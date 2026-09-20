// API score store — secondary persistence (fire-and-forget)
import { apiClient } from '../api/client';

export const ApiScoreStore = {
  async submit(score: number): Promise<void> {
    try {
      await apiClient.post('/scores', { score });
    } catch {
      // Backend unavailable — silently ignore (local-first architecture)
    }
  },

  async fetchHighScore(): Promise<number> {
    try {
      const data = await apiClient.get<{ high_score: number }>('/high-score');
      return data.high_score ?? 0;
    } catch {
      return 0;
    }
  },
};
