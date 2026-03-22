import json
import logging
from pathlib import Path

from services.cv_pipeline import CV_PROFILES

logger = logging.getLogger(__name__)

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "demo_cases.json"


def build_evidence_packet(entity_name: str, mode: str) -> dict:
    try:
        with open(_DATA_PATH, encoding="utf-8") as f:
            demo_cases = json.load(f)

        key = entity_name.strip().lower()
        demo_case = demo_cases.get(key, {})

        cv_data = CV_PROFILES.get(entity_name, {})

        merged = {**demo_case, **cv_data}
        merged["entity_name"] = entity_name
        merged["mode"] = mode
        return merged
    except Exception as e:
        logger.error("build_evidence_packet failed for %s: %s", entity_name, e, exc_info=True)
        return {"entity_name": entity_name, "mode": mode}
