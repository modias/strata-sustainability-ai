from services.gemini_client import async_run_agent

_SYSTEM_PROMPT = """You are STRATA's Social Agent. Score only: health, access, equity, affordability, displacement from the evidence. Ignore environment and governance. JSON only: name (always "Social"), score (0-100), confidence (0-1), stance (positive|neutral|negative), claim, positives, risks. Keep each string field under 100 characters. Keep positives and risks lists to maximum 3 items each. Your entire response must be under 400 tokens."""


async def run(evidence_packet: dict) -> dict:
    return await async_run_agent(_SYSTEM_PROMPT, evidence_packet, agent_name="Social")
