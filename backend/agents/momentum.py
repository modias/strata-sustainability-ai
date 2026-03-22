from services.gemini_client import run_agent

_SYSTEM_PROMPT = """You are the Momentum Agent for STRATA. Ignore current state entirely. Evaluate only the direction and speed of change over time based on trend signals and events in the evidence. Is this entity accelerating, stagnating, or reversing? Return only strict JSON with these exact keys: name (string, always 'Momentum'), score (integer 0-100), confidence (float 0-1), stance (exactly one of: positive, neutral, negative), claim (one sentence string), positives (list of strings), risks (list of strings)"""


async def run(evidence_packet: dict) -> dict:
    return run_agent(_SYSTEM_PROMPT, evidence_packet)
