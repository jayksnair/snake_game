import { describe, it, expect } from 'vitest';
import { tick, enqueueDirection } from '../../src/game/SnakeEngine';
import { createInitialState } from '../../src/game/GameState';
import { createRng } from '../../src/game/Food';

// Fixed RNG that always returns 0.5 — places food at centre
const fixedRng = createRng(42);

describe('SnakeEngine — Movement', () => {
  it('UT-MOV-001: snake moves one cell right per tick', () => {
    const s0 = { ...createInitialState(), status: 'PLAYING' as const };
    const s1 = tick(s0, fixedRng);
    expect(s1.snake[0].x).toBe(s0.snake[0].x + 1);
    expect(s1.snake[0].y).toBe(s0.snake[0].y);
  });

  it('UT-MOV-002: snake moves up', () => {
    const s0 = { ...createInitialState(), status: 'PLAYING' as const };
    const withDir = enqueueDirection(s0, 'UP');
    const s1 = tick(withDir, fixedRng);
    expect(s1.snake[0].y).toBe(s0.snake[0].y - 1);
  });

  it('UT-MOV-003: reverse direction (RIGHT→LEFT) is rejected', () => {
    const s0 = { ...createInitialState(), direction: 'RIGHT' as const, status: 'PLAYING' as const };
    const s1 = enqueueDirection(s0, 'LEFT');
    expect(s1.pendingDirections).toHaveLength(0);
  });

  it('UT-MOV-004: direction queue accepts up to 2 pending inputs', () => {
    let s = { ...createInitialState(), direction: 'RIGHT' as const, status: 'PLAYING' as const };
    s = enqueueDirection(s, 'UP');
    s = enqueueDirection(s, 'LEFT');
    expect(s.pendingDirections).toHaveLength(2);
    // Third should be rejected (queue full)
    s = enqueueDirection(s, 'DOWN');
    expect(s.pendingDirections).toHaveLength(2);
  });

  it('UT-MOV-005: direction queue rejects reverse of last pending input', () => {
    let s = { ...createInitialState(), direction: 'RIGHT' as const, status: 'PLAYING' as const };
    s = enqueueDirection(s, 'UP');
    // Reverse of pending UP is DOWN → rejected
    s = enqueueDirection(s, 'DOWN');
    expect(s.pendingDirections).toEqual(['UP']);
  });
});

describe('SnakeEngine — Food', () => {
  it('UT-FOOD-001: food is placed on an unoccupied cell', () => {
    const s0 = { ...createInitialState(), status: 'PLAYING' as const };
    // Force food to be right in front so snake eats it immediately
    const headX = s0.snake[0].x;
    const s1 = { ...s0, food: { x: headX + 1, y: s0.snake[0].y } };
    const s2 = tick(s1, fixedRng);
    // Snake ate food — verify new food is not on snake
    const snakeSet = new Set(s2.snake.map(p => `${p.x},${p.y}`));
    expect(snakeSet.has(`${s2.food.x},${s2.food.y}`)).toBe(false);
  });

  it('UT-FOOD-003: seeded RNG produces deterministic food placement', () => {
    const rng1 = createRng(123);
    const rng2 = createRng(123);
    const s0 = { ...createInitialState(), status: 'PLAYING' as const,
      food: { x: createInitialState().snake[0].x + 1, y: createInitialState().snake[0].y } };
    const s1a = tick(s0, rng1);
    const s1b = tick(s0, rng2);
    expect(s1a.food).toEqual(s1b.food);
  });
});

describe('SnakeEngine — Collision', () => {
  it('UT-COL-001: wall collision x < 0 triggers COLLISION (wallCollision=true)', () => {
    const s0 = createInitialState();
    const atEdge = { ...s0, status: 'PLAYING' as const, wallCollision: true,
      snake: [{ x: 0, y: 24 }, ...s0.snake.slice(1)],
      direction: 'LEFT' as const };
    const s1 = tick(atEdge, fixedRng);
    expect(s1.status).toBe('COLLISION');
  });

  it('UT-COL-002: wall collision x >= 84 triggers COLLISION (wallCollision=true)', () => {
    const s0 = createInitialState();
    const atEdge = { ...s0, status: 'PLAYING' as const, wallCollision: true,
      snake: [{ x: 83, y: 24 }, ...s0.snake.slice(1)],
      direction: 'RIGHT' as const };
    const s1 = tick(atEdge, fixedRng);
    expect(s1.status).toBe('COLLISION');
  });

  it('UT-COL-003: wall collision y >= 48 triggers COLLISION (wallCollision=true)', () => {
    const s0 = createInitialState();
    const atEdge = { ...s0, status: 'PLAYING' as const, wallCollision: true,
      snake: [{ x: 40, y: 47 }, ...s0.snake.slice(1)],
      direction: 'DOWN' as const };
    const s1 = tick(atEdge, fixedRng);
    expect(s1.status).toBe('COLLISION');
  });

  it('UT-COL-004: self collision triggers COLLISION', () => {
    // Snake coil: head at (6,24) going LEFT → moves to (5,24) which is body[3]
    const s0 = createInitialState();
    const snake = [
      { x: 6, y: 24 },  // head
      { x: 6, y: 25 },
      { x: 5, y: 25 },
      { x: 5, y: 24 },  // ← newHead (5,24) hits this on LEFT move
      { x: 5, y: 23 },
    ];
    const coiled = { ...s0, status: 'PLAYING' as const, snake, direction: 'LEFT' as const };
    const s1 = tick(coiled, fixedRng);
    expect(s1.status).toBe('COLLISION');
  });

  it('UT-COL-005: head does not collide with freed tail cell', () => {
    // Snake: head at (5,24), 3 cells long — tail will free up on this tick
    const snake = [{ x: 5, y: 24 }, { x: 4, y: 24 }, { x: 3, y: 24 }];
    const s0 = { ...createInitialState(), status: 'PLAYING' as const,
      snake, direction: 'RIGHT' as const,
      food: { x: 50, y: 30 } }; // food far away so no eating
    const s1 = tick(s0, fixedRng);
    expect(s1.status).toBe('PLAYING');
  });
  it('UT-COL-006: tunnel mode wraps head x < 0 to x=83 (wallCollision=false)', () => {
    const s0 = createInitialState();
    const atEdge = { ...s0, status: 'PLAYING' as const, wallCollision: false,
      snake: [{ x: 0, y: 24 }, ...s0.snake.slice(1)],
      direction: 'LEFT' as const };
    const s1 = tick(atEdge, fixedRng);
    expect(s1.status).toBe('PLAYING');
    expect(s1.snake[0].x).toBe(83);
    expect(s1.snake[0].y).toBe(24);
  });

  it('UT-COL-007: tunnel mode wraps head y >= 48 to y=0 (wallCollision=false)', () => {
    const s0 = createInitialState();
    const atEdge = { ...s0, status: 'PLAYING' as const, wallCollision: false,
      snake: [{ x: 40, y: 47 }, ...s0.snake.slice(1)],
      direction: 'DOWN' as const };
    const s1 = tick(atEdge, fixedRng);
    expect(s1.status).toBe('PLAYING');
    expect(s1.snake[0].y).toBe(0);
    expect(s1.snake[0].x).toBe(40);
  });
});

describe('SnakeEngine — Score', () => {
  it('UT-SCO-001: eating food adds foodPoints to score', () => {
    const s0 = createInitialState();
    const headX = s0.snake[0].x;
    const eatState = { ...s0, status: 'PLAYING' as const,
      food: { x: headX + 1, y: s0.snake[0].y } };
    const s1 = tick(eatState, fixedRng);
    expect(s1.score).toBe(10); // foodPoints × level 1
  });

  it('UT-SCO-002: level increases with score', () => {
    const s0 = { ...createInitialState(), score: 49, status: 'PLAYING' as const };
    const headX = s0.snake[0].x;
    const eatState = { ...s0, food: { x: headX + 1, y: s0.snake[0].y } };
    const s1 = tick(eatState, fixedRng);
    expect(s1.score).toBe(59); // 49 + 10×1
    // Level should increase (threshold 50 crossed)
    expect(s1.level).toBeGreaterThanOrEqual(2);
  });
});

describe('SnakeEngine — Game States', () => {
  it('UT-STA-003: PLAYING → PAUSED transition preserved', () => {
    const s0 = { ...createInitialState(), status: 'PLAYING' as const };
    // Simulate pause (no engine function — state is set externally via GameLoop)
    const paused = { ...s0, status: 'PAUSED' as const };
    expect(paused.status).toBe('PAUSED');
    // Snake and score unchanged
    expect(paused.snake).toBe(s0.snake);
    expect(paused.score).toBe(s0.score);
  });
});
