import json
import logging
import os

import google.generativeai as genai

logger = logging.getLogger(__name__)


def extract_json(text: str) -> dict:
    # Strip markdown code fences
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json or ```) and last line (```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    # Find the outermost { } block
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]

    return json.loads(text)


def run_agent(system_prompt: str, evidence_packet: dict) -> dict:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        return {"error": "no api key", "score": 0, "confidence": 0}

    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel(model_name="gemini-2.5-flash")
        prompt = f"{system_prompt}\n\nEvidence data:\n{json.dumps(evidence_packet, indent=2)}"
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                max_output_tokens=1000,
                temperature=0.4,
            ),
        )
        logger.debug("Gemini raw response: %s", response.text[:200])
        return extract_json(response.text)
    except Exception as e:
        logger.error("run_agent failed: %s", e, exc_info=True)
        return {
            "error": str(e),
            "score": 50,
            "confidence": 0.5,
            "stance": "neutral",
            "claim": "Analysis unavailable",
        }
