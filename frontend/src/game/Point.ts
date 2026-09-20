// Point on the 84×48 logical grid — pure data, no DOM

export interface Point { x: number; y: number; }

export function pointEquals(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}
