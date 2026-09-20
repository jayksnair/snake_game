import type { Direction } from './Direction';
import type { Point } from './Point';

// ─── Game Status ─────────────────────────────────────────────────────────────
export type GameStatus =
  | 'BOOT'
  | 'MENU'
  | 'READY'
  | 'PLAYING'
  | 'PAUSED'
  | 'COLLISION'
  | 'GAME_OVER'
  | 'HIGH_SCORE'
  | 'OPTIONS';

// ─── Full Game State (pure — no React, no DOM) ───────────────────────────────
export interface GameState {
  status:            GameStatus;
  snake:             Point[];          // [0] = head, [last] = tail
  food:              Point;
  direction:         Direction;
  pendingDirections: Direction[];      // max GAME_CONFIG.gameplay.directionQueueMax
  score:             number;
  level:             number;           // 1..10
  highScore:         number;
  elapsedTime:       number;           // ms accumulated while PLAYING
  tick:              number;           // game tick counter (for deterministic tests)
  readyCountdown:    number;           // 3,2,1,0
  collisionFlashMs:  number;           // countdown for collision flash
  menuIndex:         number;           // 0=NEW GAME, 1=HIGH SCORE, 2=OPTIONS
  optionIndex:       number;           // 0=AUDIO, 1=PIXEL GRID, 2=WALL COLLISION
  audioEnabled:      boolean;          // options: audio on/off
  pixelGrid:         boolean;          // options: pixel grid on/off
  wallCollision:     boolean;          // options: wall kills snake (true) or wraps (false)
}

// ─── Factory ─────────────────────────────────────────────────────────────────
import { GAME_CONFIG } from './GameConfig';

export function createInitialState(highScore = 0): GameState {
  const { width, height } = GAME_CONFIG.board;
  const { startX, startY, initialLength, initialDirection } = GAME_CONFIG.snake;

  // Build initial snake horizontally — head at startX, tail extends left
  const snake: Point[] = Array.from({ length: initialLength }, (_, i) => ({
    x: startX - i,
    y: startY,
  }));

  return {
    status:            'BOOT',
    snake,
    food:              { x: Math.floor(width / 2), y: Math.floor(height / 3) },
    direction:         initialDirection,
    pendingDirections: [],
    score:             0,
    level:             1,
    highScore,
    elapsedTime:       0,
    tick:              0,
    readyCountdown:    3,
    collisionFlashMs:  0,
    menuIndex:         0,
    optionIndex:       0,
    audioEnabled:      true,
    pixelGrid:         false,
    wallCollision:     false,          // default: tunnel/wrap mode (wall does not kill)
  };
}
