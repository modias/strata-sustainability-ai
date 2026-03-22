from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import time
from typing import Optional

import google.api_core.exceptions
import google.generativeai as genai
import redis

logger = logging.getLogger(__name__)

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


# Used only if list_models() fails (offline, etc.)
_STATIC_FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-flash-latest",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
]

# Try these first when present in list_models (avoids flash-image, flash-lite ranking above core Flash).
_PREFERRED_TEXT_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash-001",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
]

_discovered_models_cache: Optional[list[str]] = None


def _is_text_generate_model(short: str) -> bool:
    """Skip image / lite / embedding variants that are wrong for JSON text agents."""
    s = short.lower()
    if any(x in s for x in ("embed", "tts", "imagen", "aqa", "text-embedding")):
        return False
    if "-image" in s or s.endswith("image") or "image-preview" in s:
        return False
    return True


def _rank_short_id(short: str) -> int:
    """Higher = try first (core Flash before lite/preview)."""
    s = short.lower()
    if not _is_text_generate_model(short):
        return -1
    # Deprioritize lite and long preview IDs so core flash goes first among 2.x family
    if "flash-lite" in s or "-lite" in s:
        return 300
    if "preview" in s and "gemini-3" not in s:
        return 350
    if "gemini-2.5" in s and "flash" in s and "lite" not in s and "image" not in s:
        return 1000
    if "gemini-2.0" in s and "flash" in s and "lite" not in s:
        return 900
    if "gemini" in s and "flash" in s:
        return 800
    if "gemini" in s and "pro" in s:
        return 500
    if "gemini" in s:
        return 400
    return 0


def _discover_models_for_generate() -> list[str]:
    """List models with generateContent; prefer standard text Flash models, not flash-image."""
    discovered: set[str] = set()
    try:
        for m in genai.list_models():
            methods = getattr(m, "supported_generation_methods", None) or []
            if "generateContent" not in methods:
                continue
            full = getattr(m, "name", "") or ""
            short = full.split("/", 1)[-1] if full else ""
            if short and _is_text_generate_model(short):
                discovered.add(short)
    except Exception as e:
        logger.warning("genai.list_models failed, using static list: %s", e)
        return list(_STATIC_FALLBACK_MODELS)

    if not discovered:
        return list(_STATIC_FALLBACK_MODELS)

    # Preferred order first, then remaining by rank
    ordered: list[str] = []
    for p in _PREFERRED_TEXT_MODELS:
        if p in discovered:
            ordered.append(p)
    rest = sorted(
        (s for s in discovered if s not in ordered),
        key=lambda x: (-_rank_short_id(x), x),
    )
    ordered.extend(rest)
    return ordered


def _model_candidates() -> list[str]:
    """Env override, else API discovery (cached), else static fallback."""
    global _discovered_models_cache
    raw = os.environ.get("GEMINI_MODEL", "").strip()
    if raw:
        return [m.strip() for m in raw.split(",") if m.strip()]
    if _discovered_models_cache is None:
        _discovered_models_cache = _discover_models_for_generate()
        logger.info(
            "Gemini model order (%s candidates): %s",
            len(_discovered_models_cache),
            _discovered_models_cache[:8],
        )
    return _discovered_models_cache


def _should_try_next_model(exc: Exception) -> bool:
    """Try next model on 404 OR 429 — quotas are often per-model; a different model may work."""
    if isinstance(exc, google.api_core.exceptions.NotFound):
        return True
    if isinstance(exc, google.api_core.exceptions.ResourceExhausted):
        return True
    s = str(exc).lower()
    if "429" in s or "resource exhausted" in s:
        return True
    if "quota" in s and ("exceeded" in s or "limit" in s):
        return True
    if "404" in s:
        return True
    if "not found" in s and "model" in s:
        return True
    if "invalid" in s and "model" in s:
        return True
    if "not supported" in s and "generate" in s:
        return True
    return False


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


def run_agent(system_prompt: str, evidence_packet: dict) -> dict:
    try:
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if not gemini_key:
            return {"error": "no api key", "score": 0, "confidence": 0}

        cache_key = _cache_key(system_prompt, evidence_packet)
        if _redis is not None:
            try:
                cached = _redis.get(cache_key)
                if cached:
                    logger.info("Cache hit for %s", cache_key[:16])
                    return json.loads(cached)
            except Exception:
                pass

        genai.configure(api_key=gemini_key)

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

        gen_cfg_json = genai.GenerationConfig(
            response_mime_type="application/json",
            max_output_tokens=2048,
            temperature=0.3,
        )
        gen_cfg_plain = genai.GenerationConfig(
            max_output_tokens=2048,
            temperature=0.3,
        )

        def _json_mode_retryable(exc: Exception) -> bool:
            s = str(exc).lower()
            return (
                "mime" in s
                or "response_mime" in s
                or "application/json" in s
                or ("json" in s and "unsupported" in s)
            )

        last_model_error: Optional[Exception] = None
        max_models = int(os.environ.get("GEMINI_MAX_MODEL_TRIES", "18"))
        for attempt_idx, model_name in enumerate(_model_candidates()):
            if attempt_idx >= max_models:
                logger.warning("Gemini: stopping after %s models", max_models)
                break
            model = genai.GenerativeModel(model_name=model_name)
            for cfg, label in ((gen_cfg_json, "json"), (gen_cfg_plain, "plain")):
                try:
                    response = model.generate_content(prompt, generation_config=cfg)
                    result = extract_json(_response_text(response))
                    if _redis is not None:
                        try:
                            _redis.setex(cache_key, 3600, json.dumps(result))
                        except Exception:
                            pass
                    return result
                except ValueError as e:
                    last_model_error = e
                    if cfg is gen_cfg_json:
                        logger.warning(
                            "Gemini model %s: could not parse JSON-mode output, retrying plain: %s",
                            model_name,
                            e,
                        )
                        continue
                    logger.warning("Gemini model %s: unparseable output, trying next model: %s", model_name, e)
                    break
                except Exception as e:
                    last_model_error = e
                    if cfg is gen_cfg_json and _json_mode_retryable(e):
                        logger.warning(
                            "Gemini model %s: JSON mode failed (%s), retrying plain text",
                            model_name,
                            e,
                        )
                        continue
                    if _should_try_next_model(e):
                        logger.warning("Gemini model %s (%s) failed: %s", model_name, label, e)
                        if isinstance(e, google.api_core.exceptions.ResourceExhausted):
                            time.sleep(0.75)
                        break
                    raise

        if last_model_error:
            raise last_model_error
        raise RuntimeError("No Gemini models available for generateContent")

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
        }
