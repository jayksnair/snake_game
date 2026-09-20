// ─── LCD Palette ─────────────────────────────────────────────────────────────
export const LCD_PALETTE = {
  background:       '#A8B86A',
  primary:          '#243B16',   // snake, active pixels
  secondary:        '#526A2A',   // dim pixels / grid
  bezel:            '#1A1A0E',
  bezelHighlight:   '#2E2E1A',
  pageBackground:   '#0D0D08',
} as const;

// ─── Design Tokens (Golden Ratio φ = 1.618) ───────────────────────────────────
export const DESIGN = {
  phi: 1.6180339887,
  spacing: {
    base: 8,   // Fibonacci
    sm:   13,
    md:   21,
    lg:   34,
    xl:   55,
    xxl:  89,
  },
} as const;

// ─── Game Configuration ───────────────────────────────────────────────────────
export const GAME_CONFIG = {
  board: {
    width:  84,
    height: 48,
  },
  snake: {
    initialLength:    5,
    initialDirection: 'RIGHT' as const,
    // Head start: horizontally centred, vertically centred
    startX: 10,
    startY: 24,
  },
  scoring: {
    foodPoints: 10,
  },
  gameplay: {
    wallWrap:         false,
    directionQueueMax: 2,
    // Logical rows occupied by the HUD (score + level strip at top).
    // Glyph height = 7, HUD origin y=1, scale s≈1 → rows 0..7 used, +1 margin = 9.
    // Food must not spawn in y < hudSafeY.
    hudSafeY: 9,
  },
  display: {
    pixelGrid:      false,
    lcdAspectRatio: 84 / 48,  // 1.75 — IMMUTABLE
    lcdfFlicker:    false,
  },
  audio: {
    enabled: true,
  },
  // ms per tick — index = level - 1 (levels 1..10)
  speed: [150, 135, 120, 105, 95, 85, 75, 65, 55, 50] as const,
  // Points threshold to reach each level
  levelThresholds: [0, 50, 120, 220, 350, 510, 700, 920, 1170, 1450] as const,
} as const;
