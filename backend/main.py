import asyncio
import hashlib
import json
import logging
import os
import time
from pathlib import Path
from typing import Any, List, Optional

from dotenv import load_dotenv

# Load backend/.env regardless of process cwd (uvicorn started from repo root is common).
# override=True lets this file fix mistaken GEMINI_MODEL=... in the shell/IDE environment.
_BACKEND_DIR = Path(__file__).resolve().parent
_env_file = _BACKEND_DIR / ".env"
load_dotenv(_env_file, override=True)

_log = logging.getLogger(__name__)

# dotenv does not remove vars missing from .env — a bad GEMINI_MODEL from the shell/IDE persists
# and causes 400 "unexpected model name format" (e.g. API key pasted as model name).
_api_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
_model = (os.environ.get("GEMINI_MODEL") or "").strip()
if _model:
    if _model.startswith("AIza") or _model == _api_key:
        os.environ.pop("GEMINI_MODEL", None)
        _log.warning(
            "Removed invalid GEMINI_MODEL from the process environment "
            "(must be a model id like gemini-2.5-flash, not your API key)."
        )

if not _api_key:
    _log.warning(
        "GEMINI_API_KEY not set after loading %s — check your .env path and restart the server.",
        _env_file,
    )

import redis as redis_lib

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from agents.environmental import run as run_environmental
from agents.judge import run as run_judge
from agents.momentum import run as run_momentum
from agents.risk import run as run_risk
from agents.social import run as run_social
from services.evidence_builder import build_evidence_packet
from services import cv_pipeline
from services.snowflake_client import (
    get_latest_analysis,
    get_verdict_history,
    save_cv_results,
    save_verdict,
)

logger = logging.getLogger(__name__)

try:
    _state_redis = redis_lib.Redis(
        host=os.environ.get("REDIS_HOST", "localhost"),
        port=int(os.environ.get("REDIS_PORT", 6379)),
        db=1,
        decode_responses=True,
        socket_connect_timeout=2,
    )
    _state_redis.ping()
except Exception:
    _state_redis = None

app = FastAPI(title="STRATA API")

# Dev-friendly CORS: any localhost port (Vite may shift ports) and mirror all requested
# headers on preflight. SSE/EventSource can trigger OPTIONS with headers like
# Last-Event-ID; a narrow allow_headers list caused 400 and forced the UI to mock data.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5178",
        "http://localhost:5178",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

ENTITY_CV_PROFILES = {
    "anacostia": {
        "green_coverage_pct": 18.0,
        "impervious_surface_pct": 74.0,
        "heat_intensity_score": 3.2,
        "ndvi_mean": 0.24,
        "fragmentation_score": 0.65,
    },
    "phoenix_south": {
        "green_coverage_pct": 6.0,
        "impervious_surface_pct": 78.0,
        "heat_intensity_score": 5.8,
        "ndvi_mean": 0.08,
        "fragmentation_score": 0.82,
    },
    "detroit_midtown": {
        "green_coverage_pct": 32.0,
        "impervious_surface_pct": 58.0,
        "heat_intensity_score": 1.8,
        "ndvi_mean": 0.31,
        "fragmentation_score": 0.44,
    },
    "target": {
        "green_coverage_pct": 0.0,
        "impervious_surface_pct": 0.0,
        "heat_intensity_score": 0.0,
        "ndvi_mean": 0.0,
        "fragmentation_score": 0.0,
    },
    "chipotle": {
        "green_coverage_pct": 0.0,
        "impervious_surface_pct": 0.0,
        "heat_intensity_score": 0.0,
        "ndvi_mean": 0.0,
        "fragmentation_score": 0.0,
    },
}


@app.on_event("startup")
def preload_cv_into_snowflake():
    try:
        for entity_id, profile in ENTITY_CV_PROFILES.items():
            ok = save_cv_results(entity_id, profile)
            if ok:
                logger.info("✓ CV results stored in Snowflake for %s", entity_id)
            else:
                logger.warning("⚠ Snowflake CV storage failed for %s", entity_id)
    except Exception:
        logger.exception("CV preload startup failed")


# Route param / UI entity id → cv_pipeline CV_PROFILES key (satellite cache)
_OVERLAY_ENTITY_KEY: dict[str, str] = {
    "anacostia-dc": "anacostia",
    "phoenix-south": "phoenix_south",
    "detroit-midtown": "detroit_midtown",
}


@app.get("/api/vision/overlay")
def vision_overlay(entity_id: str):
    """
    GeoJSON boundary + vegetation vs infrastructure polygons for map overlay.
    `entity_id` should match frontend route ids or CV cache keys (tesla, amazon, …).
    """
    raw = (entity_id or "").strip().lower()
    if not raw:
        raise HTTPException(400, "entity_id is required")
    cv_key = _OVERLAY_ENTITY_KEY.get(raw, raw)
    profile = cv_pipeline.CV_PROFILES.get(cv_key)
    empty_fc = {"type": "FeatureCollection", "features": []}
    if not profile:
        return {
            "entity_id": raw,
            "cv_key": cv_key,
            "boundary_geojson": None,
            "green_overlay_geojson": empty_fc,
            "green_coverage_pct": None,
            "impervious_surface_pct": None,
        }
    return {
        "entity_id": raw,
        "cv_key": cv_key,
        "boundary_geojson": profile.get("boundary_geojson"),
        "green_overlay_geojson": profile.get("green_overlay_geojson") or empty_fc,
        "green_coverage_pct": profile.get("green_coverage_pct"),
        "impervious_surface_pct": profile.get("impervious_surface_pct"),
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/state/{target}")
async def get_state(target: str):
    if _state_redis is None:
        raise HTTPException(503, "State store unavailable")
    raw = _state_redis.get(f"strata:state:{target.lower()}")
    if not raw:
        raise HTTPException(404, "No saved state for this entity")
    return json.loads(raw)


@app.get("/history")
def history(entity_id: str):
    """Returns longitudinal verdict history for an entity from Snowflake"""
    return get_verdict_history(entity_id)


class AnalyzeRequest(BaseModel):
    entity_id: str


NEIGHBORHOOD_ENTITY_IDS = frozenset({"anacostia", "phoenix_south", "detroit_midtown"})

# Stable order for judge / persistence when agents complete in arbitrary order
_AGENT_RESULT_ORDER = {"Environmental": 0, "Social": 1, "Risk": 2, "Momentum": 3}


def _sort_agent_results_for_judge(results: list) -> list:
    def sort_key(r: dict) -> int:
        if not isinstance(r, dict):
            return 99
        name = str(r.get("name") or "")
        return _AGENT_RESULT_ORDER.get(name, 99)

    return sorted(results, key=sort_key)


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """Latest full analysis row for an entity from Snowflake (verdict, scores, agent JSON, judge JSON)."""
    entity_id = (req.entity_id or "").strip()
    if not entity_id:
        return {"found": False, "entity_id": "", "data": None}
    data = get_latest_analysis(entity_id)

    try:
        mode = "neighborhood" if entity_id in NEIGHBORHOOD_ENTITY_IDS else "corporate"
        save_verdict(
            target=entity_id,
            mode=mode,
            final_score=0.0,
            verdict=data["verdict"] if data else "UNKNOWN",
            trajectory=data["trajectory"] if data else "UNKNOWN",
            agent_scores=data["agent_scores"] if data else [],
            judge_output=data["judge_output"] if data else {},
            entity_id=entity_id,
        )
    except Exception:
        logger.exception("save_verdict after analyze failed for %s", entity_id)

    if data is None:
        return {"found": False, "entity_id": entity_id, "data": None}
    return {"found": True, "entity_id": entity_id, "data": data}


class AskRequest(BaseModel):
    question: str = ""
    entity: Optional[str] = None
    verdict: Optional[str] = None
    agents: List[Any] = Field(default_factory=list)
    context: Optional[str] = None


_ASK_SYSTEM = """You are STRATA's committee. Answer the user's follow-up question using the STRATA verdict, agent perspectives, and context. Be concise and actionable. JSON only with one key: answer (string, plain text, no markdown). Maximum about 120 words."""


@app.post("/ask")
def ask_committee(body: AskRequest):
    q = (body.question or "").strip()
    if not q:
        return {"answer": "Please enter a question."}
    from services.gemini_client import run_agent

    packet = {
        "question": q,
        "entity": body.entity,
        "verdict": body.verdict,
        "agents": body.agents,
        "context": body.context,
    }
    # Uses run_agent → Google Search grounding on every Gemini call (see gemini_client.run_agent).
    out = run_agent(_ASK_SYSTEM, packet)
    if isinstance(out, dict):
        ans = out.get("answer")
        grounding_sources = out.get("grounding_sources")
        if isinstance(ans, str) and ans.strip():
            body: dict = {"answer": ans.strip()}
            if isinstance(grounding_sources, list):
                body["grounding_sources"] = grounding_sources
            return body
        err = out.get("error")
        if err:
            return {"answer": f"Could not generate an answer: {err}"}
    return {"answer": "No answer available"}


@app.get("/analyze/stream")
async def analyze_stream(target: str, mode: str = "company"):
    async def generator():
        try:
            yield {
                "event": "round_start",
                "data": json.dumps({"message": "Building evidence packet"}),
            }

            evidence = build_evidence_packet(target.lower(), mode)

            yield {
                "event": "agents_start",
                "data": json.dumps({"message": "Running agents in parallel"}),
            }

            tasks = [
                asyncio.create_task(run_environmental(evidence)),
                asyncio.create_task(run_social(evidence)),
                asyncio.create_task(run_risk(evidence)),
                asyncio.create_task(run_momentum(evidence)),
            ]

            clean_results = []
            for coro in asyncio.as_completed(tasks):
                try:
                    result = await coro
                    clean_results.append(result)
                except Exception as e:
                    result = {
                        "error": str(e),
                        "score": 50,
                        "confidence": 0.5,
                        "stance": "neutral",
                        "claim": "Analysis unavailable",
                        "positives": [],
                        "risks": [],
                    }
                    clean_results.append(result)
                yield {"event": "agent_result", "data": json.dumps(result)}
                await asyncio.sleep(0.1)

            clean_results = _sort_agent_results_for_judge(clean_results)

            judge_out = await run_judge(clean_results, evidence)
            yield {"event": "verdict", "data": json.dumps(judge_out)}

            if _state_redis is not None:
                try:
                    state = {
                        "target": target,
                        "mode": mode,
                        "agents": clean_results,
                        "verdict": judge_out,
                        "saved_at": time.time(),
                    }
                    _state_redis.setex(
                        f"strata:state:{target.lower()}",
                        86400,
                        json.dumps(state),
                    )
                except Exception as e:
                    logger.warning("State save failed: %s", e)

            result = save_verdict(
                target=target,
                mode=mode,
                final_score=judge_out.get("final_score", 0) / 100,
                verdict=judge_out.get("verdict", "UNKNOWN"),
                trajectory=judge_out.get("trajectory", "flat"),
                agent_scores=clean_results,
                judge_output=judge_out,
                entity_id=target.lower(),
            )

            yield {
                "event": "complete",
                "data": json.dumps({"saved": result is not None}),
            }

        except Exception as e:
            yield {"event": "error", "data": json.dumps({"message": str(e)})}

    return EventSourceResponse(generator())
