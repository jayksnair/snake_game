"""Nokia Snake — FastAPI application entry point."""
from __future__ import annotations

import sqlite3
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import config
from app.routers import health, config as config_router, scores


# ─── Startup: ensure DB schema ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    import os
    if not os.getenv("TURSO_URL"):
        # Local dev only — run SQLite migration
        migration_path = (
            __import__("pathlib").Path(__file__).parent.parent
            / "migrations" / "001_initial.sql"
        )
        if migration_path.exists():
            conn = sqlite3.connect(config.DB_PATH)
            conn.executescript(migration_path.read_text())
            conn.close()
    yield


app = FastAPI(
    title="Nokia Snake Score API",
    version=config.VERSION,
    debug=False,
    lifespan=lifespan,
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health.router,         prefix="/api/v1")
app.include_router(config_router.router,  prefix="/api/v1")
app.include_router(scores.router,         prefix="/api/v1")


# ─── Global error handler (no stack traces) ────────────────────────────────────
@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "type": "https://tools.ietf.org/html/rfc7807",
            "title": "Internal Server Error",
            "status": 500,
        },
    )
