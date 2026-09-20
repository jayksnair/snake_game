/**
 * CanvasRenderer — renders GameState onto the 84×48 logical canvas.
 * The canvas element is sized physically by CSS (aspect-ratio: 84/48).
 * This module only draws to it; it never reads viewport dimensions.
 */

import type { GameState } from '../game/GameState';
import { LCD_PALETTE, GAME_CONFIG } from '../game/GameConfig';
import { renderText, textWidth, GLYPH_HEIGHT } from './PixelFont';

const W = GAME_CONFIG.board.width;   // 84
const H = GAME_CONFIG.board.height;  // 48

/**
 * Draw a full frame.
 * @param canvas The canvas element (CSS-sized to physical viewport size)
 * @param state  Current game state
 */
export function renderFrame(canvas: HTMLCanvasElement, state: GameState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Match logical canvas size to CSS size for crisp rendering
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (canvas.width !== cssW || canvas.height !== cssH) {
    canvas.width  = cssW;
    canvas.height = cssH;
  }

  ctx.imageSmoothingEnabled = false;

  // Scale factor: how many CSS pixels per logical cell
  const scaleX = cssW / W;
  const scaleY = cssH / H;

  // Clear with LCD background
  ctx.fillStyle = LCD_PALETTE.background;
  ctx.fillRect(0, 0, cssW, cssH);

  switch (state.status) {
    case 'BOOT':      drawBoot(ctx, cssW, cssH, scaleX); break;
    case 'MENU':      drawMenu(ctx, cssW, cssH, scaleX, scaleY, state); break;
    case 'READY':     drawReady(ctx, cssW, cssH, scaleX, scaleY, state); break;
    case 'PLAYING':   drawGame(ctx, cssW, cssH, scaleX, scaleY, state); break;
    case 'PAUSED':    drawGame(ctx, cssW, cssH, scaleX, scaleY, state); drawPaused(ctx, cssW, cssH, scaleX, scaleY); break;
    case 'COLLISION': drawCollisionFlash(ctx, cssW, cssH, state); break;
    case 'GAME_OVER': drawGameOver(ctx, cssW, cssH, scaleX, scaleY, state); break;
    case 'HIGH_SCORE':drawHighScore(ctx, cssW, cssH, scaleX, scaleY, state); break;
    case 'OPTIONS':   drawOptions(ctx, cssW, cssH, scaleX, scaleY, state); break;
  }
}

// ─── Screen drawers ──────────────────────────────────────────────────────────

function centerX(canvasW: number, textStr: string, scale: number): number {
  return Math.round((canvasW - textWidth(textStr, scale)) / 2);
}

function drawBoot(ctx: CanvasRenderingContext2D, cw: number, ch: number, sx: number) {
  // Simple: just show "NOKIA" logo during boot
  const s = Math.max(1, Math.floor(sx * 0.8));
  const text = 'NOKIA';
  const x = centerX(cw, text, s);
  const y = Math.round(ch / 2 - GLYPH_HEIGHT * s / 2);
  renderText(ctx, text, x, y, LCD_PALETTE.primary, s);
}

function drawMenu(
  ctx: CanvasRenderingContext2D, cw: number, _ch: number,
  sx: number, sy: number, state: GameState,
) {
  const titleScale = Math.max(1, Math.floor(sx * 1.2));
  const menuScale  = Math.max(1, Math.floor(sx * 0.7));

  // Title
  renderText(ctx, 'SNAKE', centerX(cw, 'SNAKE', titleScale), Math.round(sy * 6), LCD_PALETTE.primary, titleScale);

  // Menu items — cursor driven by state.menuIndex
  const items = ['NEW GAME', 'HIGH SCORE', 'OPTIONS'];
  const startY = Math.round(sy * 18);
  const lineH  = Math.round((GLYPH_HEIGHT + 3) * menuScale);
  const selectedIdx = state.menuIndex ?? 0;

  items.forEach((item, i) => {
    const prefix = i === selectedIdx ? '> ' : '  ';
    renderText(ctx, prefix + item, Math.round(sx * 4), startY + i * lineH, LCD_PALETTE.primary, menuScale);
  });

  // Score if any
  if (state.highScore > 0) {
    const hs = `HI ${String(state.highScore).padStart(6, '0')}`;
    renderText(ctx, hs, centerX(cw, hs, menuScale), Math.round(sy * 40), LCD_PALETTE.secondary, menuScale);
  }
}

function drawReady(
  ctx: CanvasRenderingContext2D, cw: number, _ch: number,
  sx: number, sy: number, state: GameState,
) {
  const s = Math.max(1, Math.floor(sx));
  const label = state.readyCountdown > 0 ? String(state.readyCountdown) : 'GO';
  renderText(ctx, 'READY', centerX(cw, 'READY', s), Math.round(sy * 10), LCD_PALETTE.primary, s);
  renderText(ctx, label, centerX(cw, label, s * 2), Math.round(sy * 22), LCD_PALETTE.primary, s * 2);
}

function drawGame(
  ctx: CanvasRenderingContext2D, cw: number, _ch: number,
  sx: number, sy: number, state: GameState,
) {
  // Score HUD
  const scoreStr = String(state.score).padStart(5, '0');
  const s = Math.max(1, Math.floor(sx * 0.6));
  renderText(ctx, scoreStr, Math.round(sx * 2), Math.round(sy * 1), LCD_PALETTE.primary, s);

  // Level
  const lvlStr = `L${state.level}`;
  renderText(ctx, lvlStr, cw - textWidth(lvlStr, s) - Math.round(sx * 2), Math.round(sy * 1), LCD_PALETTE.secondary, s);

  // Food (filled square)
  ctx.fillStyle = LCD_PALETTE.primary;
  ctx.fillRect(
    Math.round(state.food.x * sx),
    Math.round(state.food.y * sy),
    Math.max(1, Math.round(sx)),
    Math.max(1, Math.round(sy)),
  );

  // Snake — head drawn 1px smaller on each side to visually distinguish it
  for (let i = 0; i < state.snake.length; i++) {
    const seg = state.snake[i];
    const isHead = i === 0;
    const pw = Math.max(1, Math.round(sx));
    const ph = Math.max(1, Math.round(sy));
    if (isHead) {
      // Head: filled square with a 1px inset bright highlight border
      ctx.fillStyle = LCD_PALETTE.primary;
      ctx.fillRect(Math.round(seg.x * sx), Math.round(seg.y * sy), pw, ph);
      // Bright 1px inset to make head pop
      ctx.fillStyle = LCD_PALETTE.background;
      ctx.fillRect(
        Math.round(seg.x * sx) + 1,
        Math.round(seg.y * sy) + 1,
        Math.max(1, pw - 2),
        Math.max(1, ph - 2),
      );
      ctx.fillStyle = LCD_PALETTE.primary;
      ctx.fillRect(
        Math.round(seg.x * sx) + Math.max(1, Math.floor((pw - 2) / 2)),
        Math.round(seg.y * sy) + Math.max(1, Math.floor((ph - 2) / 2)),
        Math.max(1, Math.ceil(pw / 3)),
        Math.max(1, Math.ceil(ph / 3)),
      );
    } else {
      ctx.fillStyle = LCD_PALETTE.primary;
      ctx.fillRect(Math.round(seg.x * sx), Math.round(seg.y * sy), pw, ph);
    }
  }
}

function drawPaused(
  ctx: CanvasRenderingContext2D, cw: number, ch: number, sx: number, _sy: number,
) {
  const s = Math.max(1, Math.floor(sx * 0.8));
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(168,184,106,0.7)';
  ctx.fillRect(0, 0, cw, ch);
  renderText(ctx, 'PAUSED', centerX(cw, 'PAUSED', s), Math.round(ch / 2 - GLYPH_HEIGHT * s / 2), LCD_PALETTE.primary, s);
}

function drawCollisionFlash(
  ctx: CanvasRenderingContext2D, cw: number, ch: number, state: GameState,
) {
  // Flash: alternate between inverted and normal
  const phase = Math.floor(state.collisionFlashMs / 100) % 2;
  ctx.fillStyle = phase === 0 ? LCD_PALETTE.primary : LCD_PALETTE.background;
  ctx.fillRect(0, 0, cw, ch);
}

function drawGameOver(
  ctx: CanvasRenderingContext2D, cw: number, _ch: number,
  sx: number, sy: number, state: GameState,
) {
  // Use slightly smaller scale so 6 rows fit on the 48-unit tall LCD without overlap
  const s  = Math.max(1, Math.floor(sx * 0.6));  // numbers + title
  const s2 = Math.max(1, Math.floor(sx * 0.5));  // labels + prompt
  const scoreStr = String(state.score).padStart(6, '0');
  const hiStr    = String(state.highScore).padStart(6, '0');

  // Row positions (logical units out of 48):
  //  0 ─ GAME OVER title  (y=3)
  //  1 ─ SCORE label      (y=13)
  //  2 ─ score value      (y=18)
  //  3 ─ HI SCORE label   (y=27)
  //  4 ─ hi score value   (y=32)
  //  5 ─ PRESS ENTER      (y=42)
  renderText(ctx, 'GAME OVER',   centerX(cw, 'GAME OVER',   s),  Math.round(sy * 3),  LCD_PALETTE.primary,    s);
  renderText(ctx, 'SCORE',       centerX(cw, 'SCORE',       s2), Math.round(sy * 13), LCD_PALETTE.secondary,  s2);
  renderText(ctx, scoreStr,      centerX(cw, scoreStr,      s),  Math.round(sy * 18), LCD_PALETTE.primary,    s);
  renderText(ctx, 'HI SCORE',    centerX(cw, 'HI SCORE',   s2), Math.round(sy * 27), LCD_PALETTE.secondary,  s2);
  renderText(ctx, hiStr,         centerX(cw, hiStr,         s),  Math.round(sy * 32), LCD_PALETTE.primary,    s);
  renderText(ctx, 'PRESS ENTER', centerX(cw, 'PRESS ENTER', s2), Math.round(sy * 42), LCD_PALETTE.secondary,  s2);
}

function drawHighScore(
  ctx: CanvasRenderingContext2D, cw: number, _ch: number,
  sx: number, sy: number, state: GameState,
) {
  const s   = Math.max(1, Math.floor(sx * 0.7));
  const s2  = Math.max(1, Math.floor(sx * 0.5));
  renderText(ctx, 'HIGH SCORE', centerX(cw, 'HIGH SCORE', s),  Math.round(sy * 8),  LCD_PALETTE.primary,    s);
  const hs = String(state.highScore).padStart(6, '0');
  renderText(ctx, hs,           centerX(cw, hs, s),             Math.round(sy * 20), LCD_PALETTE.primary,    s);
  renderText(ctx, 'PRESS ENTER', centerX(cw, 'PRESS ENTER', s2), Math.round(sy * 38), LCD_PALETTE.secondary, s2);
}

function drawOptions(
  ctx: CanvasRenderingContext2D, cw: number, _ch: number, sx: number, sy: number,
  state: GameState,
) {
  // 3 option rows + title + hint + back — use compact scale to fit 48 logical units
  const s  = Math.max(1, Math.floor(sx * 0.6));
  const s2 = Math.max(1, Math.floor(sx * 0.42));

  // Title (y=3)
  renderText(ctx, 'OPTIONS', centerX(cw, 'OPTIONS', s), Math.round(sy * 3), LCD_PALETTE.primary, s);

  // Navigation hint (y=11)
  const hint = 'UP/DN:SEL  ENTER:SET';
  renderText(ctx, hint, centerX(cw, hint, s2), Math.round(sy * 11), LCD_PALETTE.secondary, s2);

  // Option rows: y=19, y=27, y=35  (8 units apart — no overlap at s2 scale)
  const options = [
    { label: 'AUDIO',       value: state.audioEnabled  ? 'ON ' : 'OFF' },
    { label: 'PIXEL GRID',  value: state.pixelGrid     ? 'ON ' : 'OFF' },
    { label: 'WALL KILL',   value: state.wallCollision ? 'ON ' : 'OFF' },
  ];
  const rowY = [Math.round(sy * 19), Math.round(sy * 27), Math.round(sy * 35)];

  options.forEach((opt, i) => {
    const cursor = i === state.optionIndex ? '>' : ' ';
    const colour = i === state.optionIndex ? LCD_PALETTE.primary : LCD_PALETTE.secondary;
    renderText(ctx, `${cursor} ${opt.label}`, Math.round(sx * 2),                               rowY[i], colour, s2);
    renderText(ctx, opt.value,                cw - textWidth(opt.value, s2) - Math.round(sx * 2), rowY[i], colour, s2);
  });

  // Back hint (y=43)
  const back = 'ESC=BACK';
  renderText(ctx, back, centerX(cw, back, s2), Math.round(sy * 43), LCD_PALETTE.secondary, s2);
}
