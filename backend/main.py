import logging

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.snowflake_client import (
    get_latest_analysis,
    get_verdict_history,
    save_cv_results,
    save_verdict,
)

logger = logging.getLogger(__name__)

app = FastAPI(title="STRATA API")

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
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/history")
def history(entity_id: str):
    """Returns longitudinal verdict history for an entity from Snowflake"""
    return get_verdict_history(entity_id)


class AnalyzeRequest(BaseModel):
    entity_id: str


NEIGHBORHOOD_ENTITY_IDS = frozenset({"anacostia", "phoenix_south", "detroit_midtown"})


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
