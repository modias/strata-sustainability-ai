from services.gemini_client import run_agent

_SYSTEM_PROMPT = """You are STRATA's Risk Agent. Score material downside only: regulatory, physical climate, litigation, stranded assets, reputation—exposure near- and long-term. Ignore upside. score=100 means very high risk. JSON only: name (always "Risk"), score (0-100), confidence (0-1), stance (positive|neutral|negative), claim, positives, risks. Keep each string field under 100 characters. Keep positives and risks lists to maximum 3 items each. Your entire response must be under 400 tokens."""


async def run(evidence_packet: dict) -> dict:
    return run_agent(_SYSTEM_PROMPT, evidence_packet)
