from __future__ import annotations

import asyncio
import functools
import hashlib
import httpx
import json
import logging
import os
import re
import time as _time

import google.generativeai as genai
import redis
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── Redis cache ───────────────────────────────────────────────────────
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

# ── Config ────────────────────────────────────────────────────────────
def _resolved_model_name() -> str:
    m = (os.environ.get("GEMINI_MODEL") or "").strip()
    return m if m else "gemini-2.0-flash"

schema_reminder = """CRITICAL: Respond with a single raw JSON object only.
Start with { and end with }.
No markdown, no code fences, no explanation before or after.
All strings must use double quotes.
No trailing commas.
Complete all fields before closing the brace."""


# ── JSON extraction ───────────────────────────────────────────────────
def _first_balanced_json_object(text: str) -> str | None:
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def extract_json(text: str) -> dict:
    logger.debug("Raw response: %s", text[:500])

    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"```\s*$", "", text, flags=re.MULTILINE)
    text = text.strip()

    balanced_early = _first_balanced_json_object(text)
    if balanced_early:
        try:
            return json.loads(balanced_early)
        except json.JSONDecodeError:
            text = balanced_early

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    text = re.sub(r"'([^']*)':", r'"\1":', text)
    text = re.sub(r",\s*([}\]])", r"\1", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[^{}]*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Regex partial extraction as last resort
    try:
        score_match = re.search(r'"score"\s*:\s*(\d+)', text)
        confidence_match = re.search(r'"confidence"\s*:\s*([\d.]+)', text)
        stance_match = re.search(r'"stance"\s*:\s*"([^"]+)"', text)
        claim_match = re.search(r'"claim"\s*:\s*"([^"]+)"', text)
        name_match = re.search(r'"name"\s*:\s*"([^"]+)"', text)

        if score_match:
            return {
                "name": name_match.group(1) if name_match else "Agent",
                "score": int(score_match.group(1)),
                "confidence": float(confidence_match.group(1)) if confidence_match else 0.7,
                "stance": stance_match.group(1) if stance_match else "neutral",
                "claim": claim_match.group(1) if claim_match else "Analysis complete",
                "positives": [],
                "risks": [],
                "model_used": "partial-extraction",
            }
    except Exception:
        pass

    logger.error("Could not parse JSON: %s", text[:500])
    raise ValueError("Unparseable JSON from model")


# ── Cache key ─────────────────────────────────────────────────────────
def _cache_key(system_prompt: str, evidence: dict) -> str:
    raw = system_prompt + json.dumps(evidence, sort_keys=True)
    return "strata:gemini:" + hashlib.sha256(raw.encode()).hexdigest()


# ── Response text extractor ───────────────────────────────────────────
def _response_text(response) -> str:
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


# ── OpenRouter fallback ───────────────────────────────────────────────
def _call_openrouter(prompt: str) -> dict:
    """
    Synchronous OpenRouter call using httpx.
    Uses meta-llama/llama-3.1-8b-instruct:free — free tier, no quota.
    """
    load_dotenv()
    api_key = (os.environ.get("OPENROUTER_API_KEY") or "").strip()
    if not api_key:
        raise ValueError("No OPENROUTER_API_KEY in environment")

    with httpx.Client(timeout=30) as client:
        resp = client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://strata.city",
                "X-Title": "STRATA",
            },
            json={
                "model": "meta-llama/llama-3.1-8b-instruct:free",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 1000,
            },
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        result = extract_json(content)
        result["model_used"] = "openrouter-llama3"
        return result


# ── Main agent runner ─────────────────────────────────────────────────
def run_agent(
    system_prompt: str, evidence_packet: dict, *, agent_name: str = ""
) -> dict:
    try:
        gemini_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
        if not gemini_key:
            raise ValueError("No GEMINI_API_KEY")

        cache_key = _cache_key(system_prompt, evidence_packet)

        # Check Redis cache first
        if _redis is not None:
            try:
                cached = _redis.get(cache_key)
                if cached:
                    logger.info("Cache hit for %s", agent_name)
                    data = json.loads(cached)
                    if isinstance(data, dict):
                        data.setdefault("grounding_sources", [])
                    return data
            except Exception:
                pass

        prompt = (
            f"{system_prompt}\n\n"
            f"{schema_reminder}\n\n"
            f"Evidence data:\n{json.dumps(evidence_packet, indent=2)}"
        )

        # ── Try Gemini first ──────────────────────────────────────────
        try:
            t0 = _time.time()
            genai.configure(api_key=gemini_key)
            model_name = _resolved_model_name()
            model = genai.GenerativeModel(model_name=model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    max_output_tokens=2048,
                    temperature=0.3,
                    response_mime_type="application/json",
                ),
            )
            result = extract_json(_response_text(response))
            if not isinstance(result, dict):
                result = {}
            result.setdefault("grounding_sources", [])
            if result.get("model_used") != "partial-extraction":
                result["model_used"] = model_name
            if agent_name:
                result.setdefault("name", agent_name)

            logger.info("Gemini succeeded (%s) in %dms", model_name, int((_time.time()-t0)*1000))

            # Cache success
            if _redis is not None:
                try:
                    _redis.setex(cache_key, 3600, json.dumps(result))
                except Exception:
                    pass

            return result

        except Exception as gemini_err:
            logger.warning("Gemini failed for %s: %s", agent_name, gemini_err)

            # ── OpenRouter fallback ───────────────────────────────────
            try:
                logger.info("Trying OpenRouter fallback for %s...", agent_name)
                result = _call_openrouter(prompt)
                result.setdefault("grounding_sources", [])
                if agent_name:
                    result.setdefault("name", agent_name)

                logger.info("OpenRouter succeeded for %s", agent_name)

                # Cache the fallback result too
                if _redis is not None:
                    try:
                        _redis.setex(cache_key, 3600, json.dumps(result))
                    except Exception:
                        pass

                return result

            except Exception as or_err:
                logger.error(
                    "Both Gemini and OpenRouter failed for %s — Gemini: %s | OpenRouter: %s",
                    agent_name, gemini_err, or_err
                )
                out = {
                    "error": f"Gemini: {gemini_err} | OpenRouter: {or_err}",
                    "score": 50,
                    "confidence": 0.5,
                    "stance": "neutral",
                    "claim": "Analysis unavailable — both AI providers failed",
                    "positives": [],
                    "risks": [],
                    "grounding_sources": [],
                    "model_used": "none",
                }
                if agent_name:
                    out["name"] = agent_name
                return out

    except Exception as e:
        logger.error("run_agent outer error for %s: %s", agent_name, e)
        out = {
            "error": str(e),
            "score": 50,
            "confidence": 0.5,
            "stance": "neutral",
            "claim": "Analysis unavailable",
            "positives": [],
            "risks": [],
            "grounding_sources": [],
            "model_used": "none",
        }
        if agent_name:
            out["name"] = agent_name
        return out


# ── Async wrapper ─────────────────────────────────────────────────────
async def async_run_agent(
    system_prompt: str, evidence_packet: dict, *, agent_name: str = ""
) -> dict:
    """Non-blocking wrapper — runs sync run_agent in a thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        functools.partial(run_agent, system_prompt, evidence_packet, agent_name=agent_name),
    )