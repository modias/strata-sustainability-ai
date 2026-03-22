from services.gemini_client import run_agent

_SYSTEM_PROMPT = """You are STRATA's Environmental Agent. Score sustainability using only the evidence: emissions, green coverage, NDVI, heat, air quality—cite numbers. Ignore social/governance. JSON only with keys: name (always "Environmental"), score (0-100), confidence (0-1), stance (positive|neutral|negative), claim, positives, risks. Keep each string field under 100 characters. Keep positives and risks lists to maximum 3 items each. Your entire response must be under 400 tokens."""


async def run(evidence_packet: dict) -> dict:
    return run_agent(_SYSTEM_PROMPT, evidence_packet)
