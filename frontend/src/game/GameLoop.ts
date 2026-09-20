/**
 * GameLoop — bridges the pure game engine to requestAnimationFrame.
 * Owns timing, tick scheduling, and the connection between engine state and renderer.
 *
 * NOT a React component. Instantiated once and controlled via start/stop/pause.
 */

import type { GameState } from './GameState';
import { tick, enqueueDirection } from './SnakeEngine';
import { tickIntervalMs } from './Score';
import type { Direction } from './Direction';

type StateListener = (state: GameState) => void;

export class GameLoop {
  private state: GameState;
  private rafId: number | null = null;
  private lastTickTime: number = 0;
  private listeners: StateListener[] = [];

  constructor(initialState: GameState) {
    this.state = initialState;
  }

  getState(): GameState { return this.state; }

  setState(s: GameState) {
    this.state = s;
    this.notify();
  }

  subscribe(fn: StateListener): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify() {
    for (const fn of this.listeners) fn(this.state);
  }

  enqueueDirection(dir: Direction) {
    this.state = enqueueDirection(this.state, dir);
  }

  start() {
    if (this.rafId !== null) return;
    this.lastTickTime = performance.now();
    this.loop(this.lastTickTime);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (now: number) => {
    this.rafId = requestAnimationFrame(this.loop);

    const interval = tickIntervalMs(this.state.level);
    if (now - this.lastTickTime >= interval) {
      const elapsed = now - this.lastTickTime;
      this.lastTickTime = now;

      if (this.state.status === 'PLAYING') {
        const next = tick(this.state);
        this.state = next;

        // Transition COLLISION → begin flash countdown
        if (next.status === 'COLLISION') {
          // collisionFlashMs will be decremented each tick until it reaches 0
          // At that point the loop transitions to GAME_OVER
        }
      } else if (this.state.status === 'COLLISION') {
        // Decrement flash timer; alternate flash phase is driven by collisionFlashMs value
        const remaining = this.state.collisionFlashMs - elapsed;
        if (remaining <= 0) {
          this.state = { ...this.state, status: 'GAME_OVER', collisionFlashMs: 0 };
        } else {
          this.state = { ...this.state, collisionFlashMs: remaining };
        }
      }

      this.notify();
    }
  };
}
