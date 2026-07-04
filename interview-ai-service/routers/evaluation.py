from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.nlp_service import detect_concepts
from services.communication_analyzer import analyze_communication
from services.retriever import retrieve_context
from services.evaluator import evaluate_with_rag

router = APIRouter()


class EvaluationRequest(BaseModel):
    transcript: str
    expectedAnswer: str
    expectedConcepts: List[str]
    topic: Optional[str] = "React"


class ConceptResult(BaseModel):
    detected: List[str]
    missed: List[str]


class EvaluationResponse(BaseModel):
    technical: int
    communication: int
    relevance: int
    concepts: ConceptResult
    fillerWords: int
    speakingSpeed: str
    weakConcepts: List[str] = []
    feedback: str = ""


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_answer(request: EvaluationRequest):
    """
    Evaluate a student's answer using Retrieval-Augmented Generation (RAG) and Gemini.
    """
    if not request.transcript.strip():
        raise HTTPException(
            status_code=400,
            detail="Transcript cannot be empty",
        )

    # 1. Retrieve RAG documentation context
    topic = request.topic or "React"
    context = retrieve_context(request.transcript, topic, top_k=5)

    # 2. Run Gemini RAG-grounded evaluation
    rag_result = evaluate_with_rag(
        question=request.expectedAnswer,
        answer=request.transcript,
        context=context,
        expected_concepts=request.expectedConcepts
    )

    # 3. Communication analysis (local linguistic analysis)
    comm_result = analyze_communication(request.transcript)

    return EvaluationResponse(
        technical=rag_result.get("technical", 70),
        communication=comm_result["communication"],
        relevance=rag_result.get("relevance", 70),
        concepts=ConceptResult(
            detected=rag_result.get("concepts", {}).get("detected", []),
            missed=rag_result.get("concepts", {}).get("missed", request.expectedConcepts),
        ),
        fillerWords=comm_result["fillerWords"],
        speakingSpeed=comm_result["speakingSpeed"],
        weakConcepts=rag_result.get("weakConcepts", []),
        feedback=rag_result.get("feedback", "")
    )
