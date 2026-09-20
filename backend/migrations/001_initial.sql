-- Nokia Snake — Initial Schema
-- Run: sqlite3 snake.db < migrations/001_initial.sql

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS scores (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    score       INTEGER NOT NULL CHECK (score >= 0 AND score <= 999999),
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_scores_score_desc ON scores (score DESC);
