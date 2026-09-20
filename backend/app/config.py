"""Application configuration — loaded from environment variables."""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

# Database (local dev only — ignored when TURSO_URL is set)
DB_PATH: str = os.getenv("DB_PATH", str(BASE_DIR / "snake.db"))

# CORS — comma-separated list of allowed origins.
# In production set ALLOWED_ORIGINS to your Vercel domain, e.g.:
#   ALLOWED_ORIGINS=https://nokia-snake.vercel.app
ALLOWED_ORIGINS: list[str] = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

# App version
VERSION: str = "1.0.0"
