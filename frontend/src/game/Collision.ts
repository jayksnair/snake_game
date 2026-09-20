// Collision detection — pure TypeScript, no DOM
import type { Point } from './Point';
import { pointEquals } from './Point';
import { GAME_CONFIG } from './GameConfig';

/** Returns true if the point is outside the 84×48 grid */
export function isWallCollision(p: Point): boolean {
  return (
    p.x < 0 ||
    p.x >= GAME_CONFIG.board.width  ||
    p.y < 0 ||
    p.y >= GAME_CONFIG.board.height
  );
}

/**
 * Returns true if head collides with any body segment.
 * The tail (snake[last]) is excluded because it will have moved away this tick.
 */
export function isSelfCollision(snake: Point[]): boolean {
  const head = snake[0];
  // Check against body — exclude the last tail segment (it moves away this tick)
  for (let i = 1; i < snake.length - 1; i++) {
    if (pointEquals(head, snake[i])) return true;
  }
  return false;
}
