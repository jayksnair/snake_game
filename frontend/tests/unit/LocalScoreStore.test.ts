import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalScoreStore } from '../../src/storage/LocalScoreStore';

describe('LocalScoreStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('UT-STO-001: save() writes score to localStorage', () => {
    LocalScoreStore.save(1250);
    expect(localStorage.getItem('snake.highScore')).toBe('1250');
  });

  it('UT-STO-002: load() returns 0 when key is absent', () => {
    expect(LocalScoreStore.load()).toBe(0);
  });

  it('load() returns saved value after save()', () => {
    LocalScoreStore.save(500);
    expect(LocalScoreStore.load()).toBe(500);
  });

  it('load() returns 0 for corrupted value', () => {
    localStorage.setItem('snake.highScore', 'corrupted!!');
    expect(LocalScoreStore.load()).toBe(0);
  });
});
