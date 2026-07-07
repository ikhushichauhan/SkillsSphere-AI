import os
import json
import re
import logging
import google.generativeai as genai

logger = logging.getLogger("interview_generator")

API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

def generate_interview_questions(topic: str, difficulty: str, previously_asked: list) -> list:
    """
    Generates 5 progressive interview questions using Gemini, ensuring no duplicates.
    """
    if not API_KEY:
        logger.warning("GEMINI_API_KEY not set. Using mock generated questions.")
        return [
            {
                "questionText": f"Mock Question 1 for {topic} ({difficulty})",
                "expectedAnswer": "Mock expected answer",
                "expectedConcepts": ["concept1", "concept2"]
            }
        ]

    previously_asked_str = "\n- ".join(previously_asked) if previously_asked else "None"

    prompt = f"""
You are an expert technical interviewer. Generate an interview session of 5 progressive questions on the topic '{topic}' at a '{difficulty}' difficulty level.

CRITICAL: Do NOT generate any questions that overlap with or are overly similar to the following previously asked questions:
- {previously_asked_str}

Ensure the questions are progressive in difficulty (starting from the given difficulty level and slightly scaling up).

Return your response in raw JSON format as a list of objects with this schema:
[
  {{
    "questionText": "<string: The interview question to ask>",
    "expectedAnswer": "<string: The ideal answer expected from a candidate>",
    "expectedConcepts": ["<string: key concept 1>", "<string: key concept 2>"]
  }}
]

Do not include any markdown format tags like ```json or ``` in the response. Return raw JSON array.
"""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        if text.startswith("```"):
            text = re.sub(r'^```(?:json)?\n|```$', '', text, flags=re.MULTILINE).strip()
            
        result = json.loads(text)
        # Ensure it returns exactly 5 (or up to 5)
        return result[:5]
    except Exception as e:
        logger.error(f"Error calling Gemini API for question generation: {e}")
        return []
