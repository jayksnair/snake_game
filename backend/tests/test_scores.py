"""Backend API tests — Pytest + httpx async client."""
from __future__ import annotations

import os
import tempfile
import sqlite3
import pathlib
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture(scope="module")
async def client():
    # Use a temporary file DB so each test module gets an isolated schema
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    os.environ["DB_PATH"] = db_path

    # Apply migration before tests run (lifespan may not fire in test transport)
    migration = (
        pathlib.Path(__file__).parent.parent / "migrations" / "001_initial.sql"
    )
    conn = sqlite3.connect(db_path)
    conn.executescript(migration.read_text())
    conn.close()

    # Re-import app AFTER env var is set so config picks up the temp DB
    import importlib
    import app.config as cfg
    importlib.reload(cfg)
    import app.repository.score_repository as repo
    importlib.reload(repo)
    import app.main as main_mod
    importlib.reload(main_mod)
    test_app = main_mod.app

    async with AsyncClient(
        transport=ASGITransport(app=test_app), base_url="http://test"
    ) as c:
        yield c

    os.unlink(db_path)


@pytest.mark.anyio
async def test_health(client: AsyncClient):
    """INT-BE-001: GET /health returns 200."""
    r = await client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.anyio
async def test_config(client: AsyncClient):
    """INT-BE-002: GET /config returns complete config object."""
    r = await client.get("/api/v1/config")
    assert r.status_code == 200
    data = r.json()
    assert data["board_width"] == 84
    assert data["board_height"] == 48
    assert len(data["speed_table"]) == 10


@pytest.mark.anyio
async def test_submit_score_valid(client: AsyncClient):
    """INT-BE-003: POST /scores with valid body → 201."""
    r = await client.post("/api/v1/scores", json={"score": 1250})
    assert r.status_code == 201
    assert r.json()["score"] == 1250
    assert "id" in r.json()


@pytest.mark.anyio
async def test_submit_score_invalid(client: AsyncClient):
    """INT-BE-004: POST /scores with negative score → 422."""
    r = await client.post("/api/v1/scores", json={"score": -1})
    assert r.status_code == 422


@pytest.mark.anyio
async def test_high_score_after_submit(client: AsyncClient):
    """INT-BE-006: GET /high-score returns max score after submissions."""
    await client.post("/api/v1/scores", json={"score": 500})
    await client.post("/api/v1/scores", json={"score": 9999})
    r = await client.get("/api/v1/high-score")
    assert r.status_code == 200
    assert r.json()["high_score"] >= 9999
