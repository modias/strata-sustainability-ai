from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
import time
from typing import Optional

import httpx
import google.api_core.exceptions
import google.generativeai as genai
from google.generativeai import protos
from google.generativeai.types import Tool
import redis

logger = logging.getLogger(__name__)

BACKBOARD_API_URL = os.environ.get(
    "BACKBOARD_API_URL",
    "https://api.backboard.dev/v1/chat/completions",
)
BACKBOARD_API_KEY = os.environ.get("BACKBOARD_API_KEY", "")

try:
    _redis = redis.Redis(
        host=os.environ.get("REDIS_HOST", "localhost"),
        port=int(os.environ.get("REDIS_PORT", 6379)),
        db=0,
        decode_responses=True,
        socket_connect_timeout=2,
    )
    _redis.ping()
except Exception:
    _redis = None


def extract_json(text: str) -> dict:
    # Log what we received for debugging
    logger.debug("Raw Gemini response: %s", text[:500])

    # Strip markdown fences
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"```\s*$", "", text, flags=re.MULTILINE)
    text = text.strip()

    # Find outermost { }
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]

    # Try strict parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try fixing common issues:
    # Replace single quotes with double quotes
    text = re.sub(r"'([^']*)':", r'"\1":', text)
    # Remove trailing commas before } or ]
    text = re.sub(r",\s*([}\]])", r"\1", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Last resort: log the broken text and raise (run_agent returns fallback)
    logger.error("Could not parse JSON from Gemini: %s", text[:1000])
    raise ValueError("Unparseable JSON from Gemini")


def _cache_key(system_prompt: str, evidence: dict) -> str:
    raw = system_prompt + json.dumps(evidence, sort_keys=True)
    return "strata:gemini:" + hashlib.sha256(raw.encode()).hexdigest()


# Primary default when GEMINI_MODEL is unset; also the first entry in MODELS_TO_TRY.
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"

# Fixed fallback chain (avoid deprecated / unavailable ids like gemini-1.5-flash-8b on some APIs).
MODELS_TO_TRY = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
]

# Short model ids from AI Studio, e.g. gemini-2.5-flash (SDK prepends models/)
_MODEL_SHORT_ID_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9._-]{1,120}$")
_TUNED_MODEL_PREFIX_RE = re.compile(r"^tunedModels/[a-zA-Z0-9._-]+$")


def _normalize_model_id(s: str) -> Optional[str]:
    """
    Reject mistaken API keys in GEMINI_MODEL and normalize ids.
    400 'unexpected model name format' usually means an AIza... key was set as GEMINI_MODEL,
    or a full resource path was pasted and only part of it was used.
    """
    raw = (s or "").strip().strip('"').strip("'")
    raw = raw.replace("\ufeff", "").strip()
    if not raw:
        return None
    # User pasted Google API key into GEMINI_MODEL by mistake
    if raw.startswith("AIza") and len(raw) > 24:
        logger.error(
            "Invalid GEMINI_MODEL: value looks like GEMINI_API_KEY (starts with AIza). "
            "Put the key only in GEMINI_API_KEY; GEMINI_MODEL must be a model id such as gemini-2.5-flash."
        )
        return None
    # Strip repeated "models/" prefixes (e.g. models/models/gemini-...)
    while raw.lower().startswith("models/"):
        raw = raw[7:].strip()
    if raw.startswith("tunedModels/"):
        return raw if _TUNED_MODEL_PREFIX_RE.match(raw) else None
    # Pasted REST path: .../models/gemini-2.5-flash — keep last segment only
    if "/" in raw:
        raw = raw.split("/")[-1].strip()
    if not raw:
        return None
    if not _MODEL_SHORT_ID_RE.match(raw):
        logger.warning("Skipping invalid Gemini model id (bad format): %r", raw[:100])
        return None
    return raw


def _finalize_model_list(ids: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for x in ids:
        n = _normalize_model_id(x)
        if n and n not in seen:
            seen.add(n)
            out.append(n)
    return out


def _models_for_run() -> list[str]:
    """
    Ordered list: GEMINI_MODEL (comma-separated) first if set, then MODELS_TO_TRY without duplicates.
    """
    raw = os.environ.get("GEMINI_MODEL", "").strip()
    if raw:
        parsed = _finalize_model_list([p.strip() for p in raw.split(",") if p.strip()])
        if parsed:
            logger.info("GEMINI_MODEL prepend (%s ids): %s", len(parsed), parsed[:6])
            seen = set(parsed)
            out = list(parsed)
            for m in MODELS_TO_TRY:
                if m not in seen:
                    seen.add(m)
                    out.append(m)
            return out
    return list(MODELS_TO_TRY)


def _extract_grounding_sources(response) -> list[str]:
    """URIs from Google Search grounding metadata, if present."""
    grounding_sources: list[str] = []
    try:
        if hasattr(response, "candidates") and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, "grounding_metadata") and candidate.grounding_metadata:
                meta = candidate.grounding_metadata
                for chunk in meta.grounding_chunks or []:
                    if hasattr(chunk, "web") and chunk.web is not None:
                        uri = getattr(chunk.web, "uri", None)
                        if uri:
                            grounding_sources.append(str(uri))
    except Exception:
        logger.debug("grounding metadata extraction failed", exc_info=True)
    return grounding_sources


def _response_text(response) -> str:
    """Safe access to response text (blocked prompts raise on .text)."""
    try:
        t = response.text
        if t is not None and str(t).strip():
            return str(t)
    except ValueError:
        pass
    parts = []
    if response.candidates:
        for c in response.candidates:
            if not c.content or not c.content.parts:
                continue
            for p in c.content.parts:
                if getattr(p, "text", None):
                    parts.append(p.text)
    if parts:
        return "\n".join(parts)
    raise ValueError("Empty or blocked Gemini response")


async def run_agent_backboard(system_prompt: str, evidence_packet: dict) -> dict:
    if not (BACKBOARD_API_KEY or "").strip():
        raise ValueError("No BACKBOARD_API_KEY set")

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            BACKBOARD_API_URL,
            headers={
                "Authorization": f"Bearer {BACKBOARD_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"Evidence data:\n{json.dumps(evidence_packet, indent=2)}",
                    },
                ],
                "temperature": 0.3,
                "max_tokens": 1000,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        result = extract_json(content)
        if not isinstance(result, dict):
            result = {}
        result["model_used"] = "backboard-gpt4o-mini"
        result.setdefault("grounding_sources", [])
        return result


def run_agent(system_prompt: str, evidence_packet: dict) -> dict:
    try:
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if not gemini_key:
            return {"error": "no api key", "score": 0, "confidence": 0, "grounding_sources": []}

        cache_key = _cache_key(system_prompt, evidence_packet)
        if _redis is not None:
            try:
                cached = _redis.get(cache_key)
                if cached:
                    logger.info("Cache hit for %s", cache_key[:16])
                    data = json.loads(cached)
                    if isinstance(data, dict) and "grounding_sources" not in data:
                        data["grounding_sources"] = []
                    return data
            except Exception:
                pass

        genai.configure(api_key=gemini_key)

        models = _models_for_run()
        if not models:
            return {
                "error": "No valid Gemini model ids (check GEMINI_MODEL uses names like gemini-2.5-flash, not your API key)",
                "score": 50,
                "confidence": 0.5,
                "stance": "neutral",
                "claim": "Analysis unavailable",
                "positives": [],
                "risks": [],
                "grounding_sources": [],
            }

        schema_reminder = """
CRITICAL: Your response must be a single raw JSON object.
- Start your response with {
- End your response with }
- No markdown, no code fences, no explanation
- All strings must use double quotes
- No trailing commas
- Complete all fields fully before closing
"""
        prompt = f"{system_prompt}\n{schema_reminder}\n\nEvidence data:\n{json.dumps(evidence_packet, indent=2)}"

        gen_cfg = genai.GenerationConfig(
            max_output_tokens=2048,
            temperature=0.3,
        )
        search_tools = [Tool(google_search_retrieval=protos.GoogleSearchRetrieval())]

        last_error: Optional[Exception] = None
        for model_name in models:
            try:
                model = genai.GenerativeModel(model_name=model_name)
                response = model.generate_content(
                    prompt,
                    tools=search_tools,
                    generation_config=gen_cfg,
                )
                grounding_sources = _extract_grounding_sources(response)
                result = extract_json(_response_text(response))
                if not isinstance(result, dict):
                    result = {}
                result["grounding_sources"] = grounding_sources
                result["model_used"] = model_name
                if _redis is not None:
                    try:
                        _redis.setex(cache_key, 3600, json.dumps(result))
                    except Exception:
                        pass
                return result
            except ValueError as e:
                last_error = e
                logger.warning("Model %s: unparseable JSON, trying next: %s", model_name, e)
                continue
            except Exception as e:
                last_error = e
                error_str = str(e)
                if isinstance(e, google.api_core.exceptions.NotFound):
                    logger.warning("Model %s not available (404), trying next", model_name)
                    continue
                if "404" in error_str or "not found" in error_str.lower():
                    logger.warning("Model %s not available, trying next", model_name)
                    continue
                if (
                    "429" in error_str
                    or "quota" in error_str.lower()
                    or isinstance(e, google.api_core.exceptions.ResourceExhausted)
                ):
                    logger.warning("Quota hit on %s, trying next model", model_name)
                    if isinstance(e, google.api_core.exceptions.ResourceExhausted):
                        time.sleep(0.75)
                    continue
                logger.warning("Model %s failed (non-retryable): %s", model_name, e)
                break

        logger.error("All models failed: %s", last_error)
        try:
            logger.info("Trying Backboard fallback...")
            result = asyncio.run(run_agent_backboard(system_prompt, evidence_packet))
            if _redis is not None:
                try:
                    _redis.setex(cache_key, 3600, json.dumps(result))
                except Exception:
                    pass
            return result
        except Exception as be:
            logger.error("Backboard fallback failed: %s", be)

        return {
            "error": str(last_error) if last_error else "All Gemini models failed",
            "score": 50,
            "confidence": 0.5,
            "stance": "neutral",
            "claim": "Analysis unavailable",
            "positives": [],
            "risks": [],
            "grounding_sources": [],
        }

    except Exception as e:
        logger.error("run_agent failed: %s", e, exc_info=True)
        return {
            "error": str(e),
            "score": 50,
            "confidence": 0.5,
            "stance": "neutral",
            "claim": "Analysis unavailable",
            "positives": [],
            "risks": [],
            "grounding_sources": [],
        }
