"""Game configuration endpoint."""
from fastapi import APIRouter
from app.models.score import ConfigResponse

router = APIRouter()

@router.get("/config", response_model=ConfigResponse)
async def get_config():
    return ConfigResponse()
