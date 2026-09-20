"""Score repository — works with both local SQLite (dev) and Turso (production).

Environment variables (Turso / production):
    TURSO_URL        wss://your-db.turso.io   (libsql URL)
    TURSO_AUTH_TOKEN <token>

When TURSO_URL is not set the repository falls back to aiosqlite + the local
snake.db file, so local development needs no extra setup.
"""
from __future__ import annotations

import os
import aiosqlite
from app import config


# ─── Turso (libsql) path ─────────────────────────────────────────────────────

# Normalise URL scheme: libsql:// → https:// (HTTP client works everywhere;
# wss:// WebSocket is rejected by some environments including local Windows dev)
_raw_url = os.getenv("TURSO_URL")
TURSO_URL: str | None = (
    _raw_url.replace("libsql://", "https://", 1) if _raw_url else None
)
TURSO_AUTH_TOKEN: str | None = os.getenv("TURSO_AUTH_TOKEN")

_turso_client = None  # lazily initialised


def _get_turso_client():
    """Return a cached libsql_client.Client (created once per cold start)."""
    global _turso_client
    if _turso_client is None:
        import libsql_client  # type: ignore[import]
        _turso_client = libsql_client.create_client(
            url=TURSO_URL,
            auth_token=TURSO_AUTH_TOKEN,
        )
    return _turso_client


async def _ensure_schema_turso() -> None:
    client = _get_turso_client()
    await client.execute(
        """
        CREATE TABLE IF NOT EXISTS scores (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            score      INTEGER NOT NULL CHECK (score >= 0 AND score <= 999999),
            created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
        )
        """
    )


# ─── Public API ──────────────────────────────────────────────────────────────

async def insert_score(score: int) -> dict:
    if TURSO_URL:
        await _ensure_schema_turso()
        client = _get_turso_client()
        result = await client.execute(
            "INSERT INTO scores (score) VALUES (?)", [score]
        )
        row_id = result.last_insert_rowid
        row_result = await client.execute(
            "SELECT id, score, created_at FROM scores WHERE id = ?", [row_id]
        )
        row = row_result.rows[0]
        return {"id": row[0], "score": row[1], "created_at": row[2]}
    else:
        # Local SQLite fallback
        async with aiosqlite.connect(config.DB_PATH) as db:
            cursor = await db.execute(
                "INSERT INTO scores (score) VALUES (?)", (score,)
            )
            await db.commit()
            row = await (await db.execute(
                "SELECT id, score, created_at FROM scores WHERE id = ?",
                (cursor.lastrowid,),
            )).fetchone()
        return {"id": row[0], "score": row[1], "created_at": row[2]}


async def get_high_score() -> int:
    if TURSO_URL:
        await _ensure_schema_turso()
        client = _get_turso_client()
        result = await client.execute("SELECT MAX(score) FROM scores")
        val = result.rows[0][0] if result.rows else None
        return val if val is not None else 0
    else:
        # Local SQLite fallback
        async with aiosqlite.connect(config.DB_PATH) as db:
            row = await (await db.execute(
                "SELECT MAX(score) FROM scores"
            )).fetchone()
        return row[0] if row and row[0] is not None else 0
