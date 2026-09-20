"""
Vercel serverless entry point.
Vercel looks for a module-level `app` (ASGI) in this file.
We re-export the FastAPI app from the main application package.
"""
import sys
import os

# Make sure `backend/` is on sys.path so `from app.xxx import ...` works
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app  # noqa: F401  — re-exported for Vercel

__all__ = ["app"]
