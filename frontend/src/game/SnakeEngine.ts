/**
 * SnakeEngine — pure TypeScript game engine.
 * No DOM, no React, no window. Entirely deterministic given the same state + input.
 *
 * Public API:  tick(state, rng?) → GameState
 */

import type { GameState } from './GameState';
import type { Direction } from './Direction';
import type { Point } from './Point';
import { isReverseDirection, DIRECTION_DELTA } from './Direction';
import { pointEquals } from './Point';
import { isWallCollision } from './Collision';
import { placeFood } from './Food';
import { calcScore, calcLevel } from './Score';
import { GAME_CONFIG } from './GameConfig';

/** Wrap a coordinate to stay inside the board (tunnel mode). */
function wrapCoord(p: Point): Point {
  const { width, height } = GAME_CONFIG.board;
  return {
    x: ((p.x % width)  + width)  % width,
    y: ((p.y % height) + height) % height,
  };
}

/**
 * Enqueue a direction input. Ignores:
 *  - Immediate reverse of current direction
 *  - Reverse of last pending direction
 *  - Queue full (> directionQueueMax)
 */
export function enqueueDirection(state: GameState, dir: Direction): GameState {
  const { pendingDirections, direction } = state;
  const effective = pendingDirections.length > 0
    ? pendingDirections[pendingDirections.length - 1]
    : direction;
  if (isReverseDirection(effective, dir)) return state;
  if (pendingDirections.includes(dir)) return state; // deduplicate same direction
  if (pendingDirections.length >= GAME_CONFIG.gameplay.directionQueueMax) return state;
  return { ...state, pendingDirections: [...pendingDirections, dir] };
}

/**
 * Advance the game by one tick.
 * Call only when status === 'PLAYING'.
 */
export function tick(state: GameState, rng?: () => number): GameState {
  // Consume next pending direction
  let direction = state.direction;
  let pendingDirections = state.pendingDirections;
  if (pendingDirections.length > 0) {
    direction = pendingDirections[0];
    pendingDirections = pendingDirections.slice(1);
  }

  // Move head
  const head = state.snake[0];
  const delta = DIRECTION_DELTA[direction];
  const rawHead: Point = { x: head.x + delta.dx, y: head.y + delta.dy };

  // Wall collision — behaviour depends on state.wallCollision option
  let effectiveHead: Point;
  if (isWallCollision(rawHead)) {
    if (state.wallCollision) {
      // Classic mode: hitting a wall ends the game
      return { ...state, status: 'COLLISION', direction, pendingDirections, collisionFlashMs: 500 };
    } else {
      // Tunnel mode: snake appears on the opposite wall
      effectiveHead = wrapCoord(rawHead);
    }
  } else {
    effectiveHead = rawHead;
  }

  // Build new snake (head prepended, tail not yet removed to allow tail-edge collision check)
  const newSnakeFull = [effectiveHead, ...state.snake];

  // Check self collision (against full body before tail removal)
  const head2 = newSnakeFull[0];
  for (let i = 1; i < newSnakeFull.length - 1; i++) {
    if (pointEquals(head2, newSnakeFull[i])) {
      return { ...state, status: 'COLLISION', direction, pendingDirections, collisionFlashMs: 500 };
    }
  }

  // Check food consumption
  const ateFood = pointEquals(effectiveHead, state.food);

  // Remove tail unless food was eaten
  const newSnake: Point[] = ateFood ? newSnakeFull : newSnakeFull.slice(0, -1);

  // Score + level
  const newScore = ateFood ? calcScore(state.score, state.level) : state.score;
  const newLevel = calcLevel(newScore);
  const newHighScore = Math.max(state.highScore, newScore);

  // New food position if eaten
  const newFood = ateFood ? placeFood(newSnake, rng) : state.food;

  return {
    ...state,
    snake:             newSnake,
    food:              newFood,
    direction,
    pendingDirections,
    score:             newScore,
    level:             newLevel,
    highScore:         newHighScore,
    tick:              state.tick + 1,
  };
}
