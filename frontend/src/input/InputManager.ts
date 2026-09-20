/**
 * InputManager — keyboard + touch events → Direction queue.
 * Singleton pattern: one instance per game session.
 */

import type { Direction } from '../game/Direction';

type DirectionCallback = (dir: Direction) => void;
type ActionCallback    = (action: 'ENTER' | 'ESCAPE' | 'SPACE') => void;
type MenuNavCallback   = (delta: 1 | -1) => void;

export class InputManager {
  private directionCb: DirectionCallback | null = null;
  private actionCb:    ActionCallback    | null = null;
  private menuNavCb:   MenuNavCallback   | null = null;
  private bound = false;

  onDirection(cb: DirectionCallback) { this.directionCb = cb; }
  onAction(cb: ActionCallback)       { this.actionCb    = cb; }
  onMenuNav(cb: MenuNavCallback)     { this.menuNavCb   = cb; }

  bind() {
    if (this.bound) return;
    this.bound = true;
    // Must NOT be passive so we can preventDefault on arrow keys (prevents page scroll)
    window.addEventListener('keydown', this.handleKey);
  }

  unbind() {
    window.removeEventListener('keydown', this.handleKey);
    this.bound = false;
  }

  private handleKey = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':    case 'w': case 'W':
        e.preventDefault();
        this.menuNavCb?.(-1);
        this.directionCb?.('UP');    break;
      case 'ArrowDown':  case 's': case 'S':
        e.preventDefault();
        this.menuNavCb?.(1);
        this.directionCb?.('DOWN');  break;
      case 'ArrowLeft':  case 'a': case 'A':
        e.preventDefault();
        this.directionCb?.('LEFT');  break;
      case 'ArrowRight': case 'd': case 'D':
        e.preventDefault();
        this.directionCb?.('RIGHT'); break;
      case 'Enter':    this.actionCb?.('ENTER');  break;
      case 'Escape':   this.actionCb?.('ESCAPE'); break;
      case ' ':
        e.preventDefault();
        this.actionCb?.('SPACE');  break;
    }
  };

  /** Called from TouchControls component */
  dispatchDirection(dir: Direction) { this.directionCb?.(dir); }
  dispatchAction(action: 'ENTER' | 'ESCAPE' | 'SPACE') { this.actionCb?.(action); }
}
