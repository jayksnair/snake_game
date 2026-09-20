import sys
import os

# Add backend directory to path so imports like `from app.xxx import ...` work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app  # noqa: F401

__all__ = ["app"]
