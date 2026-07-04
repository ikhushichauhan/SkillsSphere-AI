import os
import re
import json
import google.generativeai as genai
import logging

logger = logging.getLogger("evaluator")

# Initialize Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    logger.warning("GEMINI_API_KEY environment variable is not set. Gemini evaluator will fallback to offline mock scores.")

def evaluate_with_rag(question: str, answer: str, context: list, expected_concepts: list) -> dict:
    """
    Evaluates a candidate's answer using Gemini and retrieved RAG context.
    """
    if not API_KEY:
        # Fallback to mock scoring if API key is not configured
        return {
            "technical": 75,
            "communication": 80,
            "relevance": 70,
            "concepts": {
                "detected": [c for c in expected_concepts[:2]] if expected_concepts else [],
                "missed": [c for c in expected_concepts[2:]] if expected_concepts else []
            },
            "weakConcepts": ["Performance Optimization"],
            "feedback": "Gemini API key is not configured. Running with mock fallback evaluation.",
            "learningRecommendations": ["Study official documentation for hooks and state."]
        }

    # Format the context document passages
    formatted_context = "\n---\n".join(context) if context else "No relevant documentation found."
    
    prompt = f"""
You are an expert technical interviewer evaluating a candidate's response.
Your evaluation MUST be strictly grounded in the official technical documentation provided below. Do not use outside knowledge or hallucinated information.

Interview Question:
"{question}"

Candidate's Answer:
"{answer}"

Official Technical Documentation (Context):
{formatted_context}

Expected Concepts list:
{expected_concepts}

Evaluate the candidate's answer based ONLY on the provided documentation. Detect which expected concepts from the list were successfully explained, which were missed, and identify any weak sub-concepts.

Return your response in raw JSON format with the following schema:
{{
  "technical": <int: score 0 to 100 based on technical correctness matching the documentation>,
  "communication": <int: score 0 to 100 based on clarity and structure>,
  "relevance": <int: score 0 to 100 based on how well they answered the specific question asked>,
  "concepts": {{
    "detected": [<list of concepts from the Expected Concepts list that were explained>],
    "missed": [<list of concepts from the Expected Concepts list that were missed>]
  }},
  "weakConcepts": [<list of specific sub-concepts or details they explained poorly, missed, or ignored, e.g. "cleanup function", "dependency array">],
  "feedback": "<string: structured feedback with strengths and areas for improvement>",
  "learningRecommendations": [<list of topics or suggested sections to study based on their weak concepts>]
}}

Do not include any markdown format tags like ```json or ``` in the response. Return raw JSON.
"""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up any potential markdown wrap
        if text.startswith("```"):
            text = re.sub(r'^```(?:json)?\n|```$', '', text, flags=re.MULTILINE).strip()
            
        result = json.loads(text)
        return result
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")
        return {
            "technical": 60,
            "communication": 70,
            "relevance": 65,
            "concepts": {
                "detected": [],
                "missed": expected_concepts
            },
            "weakConcepts": ["General Concept Understanding"],
            "feedback": f"Failed to complete AI evaluation: {e}",
            "learningRecommendations": ["Review foundational topics."]
        }
