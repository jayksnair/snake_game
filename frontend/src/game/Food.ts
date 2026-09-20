// Food generation — supports seeded RNG for deterministic tests
import type { Point } from './Point';
import { pointEquals } from './Point';
import { GAME_CONFIG } from './GameConfig';

/**
 * Simple seeded LCG pseudo-random — used for deterministic food placement in tests.
 * Pass undefined for a random seed (Math.random-backed).
 */
export function createRng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * Place food on a random unoccupied cell that is outside the HUD safe zone.
 * Tries up to 1000 times then falls back to first valid empty cell.
 *
 * The HUD (score + level strip) occupies logical rows 0..(hudSafeY-1).
 * Food is never placed within 1 logical-cell radius of the HUD strip.
 */
export function placeFood(
  snake: Point[],
  rng: () => number = Math.random,
): Point {
  const { width, height } = GAME_CONFIG.board;
  const { hudSafeY } = GAME_CONFIG.gameplay;
  const maxAttempts = 1000;

  const isBlocked = (p: Point): boolean =>
    p.y < hudSafeY ||                        // inside or within 1 cell of HUD strip
    snake.some(s => pointEquals(s, p));       // occupied by snake

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate: Point = {
      x: Math.floor(rng() * width),
      // Constrain y to the safe zone so random attempts never waste tries above HUD
      y: hudSafeY + Math.floor(rng() * (height - hudSafeY)),
    };
    if (!isBlocked(candidate)) {
      return candidate;
    }
  }

  // Fallback: linear scan for first valid empty cell (skip HUD rows)
  for (let y = hudSafeY; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p: Point = { x, y };
      if (!isBlocked(p)) return p;
    }
  }

  // Last resort: board is completely filled below HUD — fall back to full board scan
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p: Point = { x, y };
      if (!snake.some(s => pointEquals(s, p))) return p;
    }
  }

  return { x: 0, y: 0 };
}
