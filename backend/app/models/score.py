"""Pydantic models for the Score API."""
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class ScoreSubmit(BaseModel):
    score: int = Field(..., ge=0, le=999999, description="Game score")


class ScoreResponse(BaseModel):
    id: int
    score: int
    created_at: datetime


class HighScoreResponse(BaseModel):
    high_score: int


class ConfigResponse(BaseModel):
    board_width:   int = 84
    board_height:  int = 48
    food_points:   int = 10
    wall_wrap:     bool = False
    pixel_grid:    bool = False
    audio_enabled: bool = True
    speed_table:   list[int] = [150, 135, 120, 105, 95, 85, 75, 65, 55, 50]


class HealthResponse(BaseModel):
    status:  str = "ok"
    version: str
