# Nokia Snake

A retro Nokia Snake browser game featuring a large-format 84×48 monochrome LCD experience.

## Architecture

```
nokia-snake/
├── frontend/   React 18 + TypeScript 5 + Vite 5 + Tailwind CSS
└── backend/    Python 3.11 + FastAPI + SQLite
```

## Quick Start

### Frontend

```bash
cd nokia-snake/frontend
npm install
npm run dev          # http://localhost:5173
```

### Backend

```bash
cd nokia-snake/backend
pip install -r requirements.txt
uvicorn app.main:app --reload   # http://localhost:8000
```

## Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Direction |
| Enter / Space | Confirm / Start |
| Escape | Pause / Resume |

## Key design decisions

- **LCD is the hero** — the 84:48 ratio is immutable, the canvas fills the viewport
- **Pure TypeScript engine** — game logic has zero DOM/React dependencies
- **Local-first** — `localStorage` primary, FastAPI secondary (offline-capable)
- **No modern effects** — no blur, glow, or gradients inside the game canvas
- **Golden Ratio spacing** — φ = 1.618 governs UI composition, not the 84:48 game ratio


