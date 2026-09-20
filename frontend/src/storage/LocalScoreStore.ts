// localStorage score store — primary persistence (local-first)
const KEY = 'snake.highScore';

export const LocalScoreStore = {
  load(): number {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) return 0;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
      return 0;
    }
  },

  save(score: number): void {
    try {
      localStorage.setItem(KEY, String(score));
    } catch {
      // Storage full or private mode — silently ignore
    }
  },
};
