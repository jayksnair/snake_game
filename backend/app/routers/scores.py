"""Score endpoints — submit and high-score query."""
from fastapi import APIRouter
from app.models.score import ScoreSubmit, ScoreResponse, HighScoreResponse
from app.services import score_service

router = APIRouter()

@router.post("/scores", response_model=ScoreResponse, status_code=201)
async def submit_score(body: ScoreSubmit):
    result = await score_service.submit_score(body.score)
    return result

@router.get("/high-score", response_model=HighScoreResponse)
async def high_score():
    hs = await score_service.fetch_high_score()
    return HighScoreResponse(high_score=hs)
