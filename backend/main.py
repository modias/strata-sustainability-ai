import logging

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.snowflake_client import get_verdict_history, save_cv_results

logger = logging.getLogger(__name__)

app = FastAPI(title="STRATA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/history")
def history(entity_id: str):
    """Returns longitudinal verdict history for an entity from Snowflake"""
    return get_verdict_history(entity_id)
