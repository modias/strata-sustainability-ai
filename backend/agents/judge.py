from services.gemini_client import run_agent

_SYSTEM_PROMPT = """You are the Judge Agent for STRATA. You have received five agent verdicts. Identify where agents agree, where they sharply disagree, and what the disagreement reveals. Produce a final synthesis. Return only strict JSON with these keys: final_score as integer 0-100, verdict as exactly one of IMPROVING STAGNANT DECLINING CONTESTED, trajectory as up flat or down, rationale as one sentence, top_support_reason as one sentence, top_dissent_reason as one sentence."""


async def run(agent_results: list, evidence_packet: dict) -> dict:
    payload = {
        "agent_verdicts": agent_results,
        "evidence": evidence_packet,
    }
    return run_agent(_SYSTEM_PROMPT, payload)
