"""Score service — thin business logic layer."""
from __future__ import annotations

from app.repository import score_repository


async def submit_score(score: int) -> dict:
    return await score_repository.insert_score(score)


async def fetch_high_score() -> int:
    return await score_repository.get_high_score()
