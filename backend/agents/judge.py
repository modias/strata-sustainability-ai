from services.gemini_client import async_run_agent

_SYSTEM_PROMPT = """You are STRATA's Judge. You have the agent verdicts. Synthesize agreement, conflict, and what it implies. JSON only: final_score (0-100), verdict (IMPROVING|STAGNANT|DECLINING|CONTESTED), trajectory (up|flat|down), rationale, top_support_reason, top_dissent_reason. Keep rationale, top_support_reason, top_dissent_reason each under 100 characters. Your entire response must be under 300 tokens."""


async def run(agent_results: list, evidence_packet: dict) -> dict:
    payload = {
        "agent_verdicts": agent_results,
        "evidence": evidence_packet,
    }
    return await async_run_agent(_SYSTEM_PROMPT, payload)
