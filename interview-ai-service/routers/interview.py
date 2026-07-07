from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.interview_generator import generate_interview_questions

router = APIRouter()

class GenerateQuestionsRequest(BaseModel):
    topic: str
    difficulty: str
    previously_asked_questions: Optional[List[str]] = []

class QuestionResult(BaseModel):
    questionText: str
    expectedAnswer: str
    expectedConcepts: List[str]

class GenerateQuestionsResponse(BaseModel):
    questions: List[QuestionResult]

@router.post("/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions(request: GenerateQuestionsRequest):
    """
    Generate progressive interview questions avoiding duplicates.
    """
    if not request.topic:
        raise HTTPException(status_code=400, detail="Topic is required")
        
    generated = generate_interview_questions(
        topic=request.topic,
        difficulty=request.difficulty,
        previously_asked=request.previously_asked_questions
    )
    
    if not generated:
        raise HTTPException(status_code=500, detail="Failed to generate questions")
        
    return GenerateQuestionsResponse(
        questions=[QuestionResult(**q) for q in generated]
    )
