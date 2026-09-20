# What the App Looks Like & How It Works

Based on the full source code analysis, here is a complete architectural and behavioral breakdown of the application:

## Architecture

* **`frontend/`** (React 18 + TypeScript + Vite)
  * Renders an $84 \times 48$ pixel Nokia LCD canvas inside a dark bezel.
* **`backend/`** (Python FastAPI + SQLite)
  * Persists high scores via REST API (offline-capable with `localStorage` fallback).

---

## Game Screens (from `CanvasRenderer.ts`)

| Screen | What You See |
| :--- | :--- |
| **BOOT** | NOKIA centered on the green LCD, fades to menu after $1.2\text{s}$ |
| **MENU** | SNAKE title + `> NEW GAME` / `HIGH SCORE` / `OPTIONS` cursor list |
| **READY** | Countdown $3 \rightarrow 2 \rightarrow 1 \rightarrow \text{GO}$ before the snake starts moving |
| **PLAYING** | Score (top-left) + Level (top-right) + snake + food pixel, speed increases per level |
| **PAUSED** | Game frozen, semi-transparent PAUSED overlay |
| **COLLISION** | Screen flashes black $\leftrightarrow$ green $8$ times |
| **GAME OVER** | Score + Hi Score + PRESS ENTER |
| **HIGH SCORE** | Your best score, PRESS ENTER to return |
| **OPTIONS** | Toggle AUDIO / PIXEL GRID / WALL KILL (wall-wrap vs. instant-death) |

---

## Controls

| Key | Action |
| :--- | :--- |
| **Arrow keys / WASD** | Steer snake (or navigate menus up/down) |
| **Enter / Space** | Confirm / start game |
| **Escape** | Pause / resume |

---

## Scoring & Speed (from `GameConfig.ts`)

* $+10$ points per food eaten.
* $10$ levels, progressively faster: $150\text{ ms/tick} \rightarrow 50\text{ ms/tick}$.
* **Level thresholds:** $0 \rightarrow 50 \rightarrow 120 \rightarrow 220 \rightarrow 350 \rightarrow 510 \rightarrow 700 \rightarrow 920 \rightarrow 1170 \rightarrow 1450\text{ pts}$.
* High score synced to the SQLite backend on game-over and loaded from the backend on page load.

---

## LCD Style

* **Palette:** Green `#A8B86A` background, dark `#243B16` pixels — authentic monochrome Nokia feel.
* **Font:** Custom $5 \times 7$ bitmap pixel font (`PixelFont.ts`) rendered directly to canvas.
* **Canvas:** $84:48$ aspect ratio locked, scales to fill viewport — CSS `image-rendering: pixelated` keeps it crisp at any size.
* **Bezel:** Dark `#1A1A0E` surround with inset box-shadow for a physical LCD feel.