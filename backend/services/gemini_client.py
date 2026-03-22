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


# Primary model for GenerativeModel(model_name=...). Override with GEMINI_MODEL env (comma-separated).
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"

_STATIC_FALLBACK_MODELS = [
    DEFAULT_GEMINI_MODEL,
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-flash-latest",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
]

_discovered_models_cache: Optional[list[str]] = None

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


def _default_static_candidates() -> list[str]:
    """DEFAULT_GEMINI_MODEL first, then other fallbacks for quota/404 rotation (no list_models)."""
    return _finalize_model_list(list(_STATIC_FALLBACK_MODELS))


def _model_candidates() -> list[str]:
    """Env override, else DEFAULT_GEMINI_MODEL + static fallbacks (cached)."""
    global _discovered_models_cache
    raw = os.environ.get("GEMINI_MODEL", "").strip()
    if raw:
        parsed = _finalize_model_list([p.strip() for p in raw.split(",") if p.strip()])
        if parsed:
            logger.info("GEMINI_MODEL override (%s ids): %s", len(parsed), parsed[:6])
            return parsed
        logger.warning("GEMINI_MODEL is set but no valid model ids; using default static fallback")
        _discovered_models_cache = None  # force fresh list; env may have had API key pasted here
    if _discovered_models_cache is None:
        _discovered_models_cache = _default_static_candidates()
        if not _discovered_models_cache:
            _discovered_models_cache = _finalize_model_list([DEFAULT_GEMINI_MODEL])
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
    if isinstance(exc, google.api_core.exceptions.BadRequest):
        s = str(exc).lower()
        if "model" in s and ("format" in s or "unexpected" in s or "invalid" in s or "name" in s):
            return True
    s = str(exc).lower()
    if "unexpected model name format" in s:
        return True
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

        if not _model_candidates():
            return {
                "error": "No valid Gemini model ids (check GEMINI_MODEL uses names like gemini-2.5-flash, not your API key)",
                "score": 50,
                "confidence": 0.5,
                "stance": "neutral",
                "claim": "Analysis unavailable",
                "positives": [],
                "risks": [],
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
            # Primary: DEFAULT_GEMINI_MODEL ("gemini-2.5-flash"); then fallbacks on quota/404.
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
