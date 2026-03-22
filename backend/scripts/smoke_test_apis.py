"""Verify GEMINI_API_KEY works. Run from backend/: python scripts/smoke_test_apis.py"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

_BACKEND = Path(__file__).resolve().parent.parent
load_dotenv(_BACKEND / ".env", override=True)


def main() -> int:
    print(f"Using .env from {_BACKEND / '.env'}\n")
    key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if not key:
        print("FAIL Gemini: GEMINI_API_KEY missing in .env")
        return 1
    try:
        import google.generativeai as genai

        genai.configure(api_key=key)
        model_id = (os.environ.get("GEMINI_MODEL") or "").strip() or "gemini-2.5-flash"
        m = genai.GenerativeModel(model_id)
        r = m.generate_content(
            'Reply with exactly this JSON object and nothing else: {"ping":"pong"}',
            generation_config=genai.GenerationConfig(
                max_output_tokens=128,
                temperature=0,
                response_mime_type="application/json",
            ),
        )
        text = (r.text or "").strip()
        if '"ping"' in text and "pong" in text:
            print(f"OK   Gemini: model={model_id}, JSON response received")
            print("\nAll checks passed.")
            return 0
        print(f"FAIL Gemini: unexpected body (len={len(text)})")
        return 1
    except Exception as e:
        print(f"FAIL Gemini: {type(e).__name__}: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
