// Direction enum and utilities — pure TypeScript, no DOM dependency

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/** Returns true if newDir is the exact opposite of current */
export function isReverseDirection(current: Direction, next: Direction): boolean {
  return (
    (current === 'UP'    && next === 'DOWN')  ||
    (current === 'DOWN'  && next === 'UP')    ||
    (current === 'LEFT'  && next === 'RIGHT') ||
    (current === 'RIGHT' && next === 'LEFT')
  );
}

/** Delta {dx, dy} for each direction on the 84×48 grid */
export const DIRECTION_DELTA: Record<Direction, { dx: number; dy: number }> = {
  UP:    { dx:  0, dy: -1 },
  DOWN:  { dx:  0, dy:  1 },
  LEFT:  { dx: -1, dy:  0 },
  RIGHT: { dx:  1, dy:  0 },
};
