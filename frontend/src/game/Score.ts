// Scoring and level progression — pure TypeScript
import { GAME_CONFIG } from './GameConfig';

/** Returns the new score after eating food at the current level */
export function calcScore(currentScore: number, level: number): number {
  return currentScore + GAME_CONFIG.scoring.foodPoints * level;
}

/** Returns the level (1..10) for a given score */
export function calcLevel(score: number): number {
  const thresholds = GAME_CONFIG.levelThresholds;
  let level = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (score >= thresholds[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, 10);
}

/** Returns the tick interval in ms for the given level (1..10) */
export function tickIntervalMs(level: number): number {
  const idx = Math.min(Math.max(level - 1, 0), GAME_CONFIG.speed.length - 1);
  return GAME_CONFIG.speed[idx];
}
