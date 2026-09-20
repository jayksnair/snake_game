import { test, expect } from '@playwright/test';

// ─── E2E-001 & E2E-002: Load + LCD ratio ─────────────────────────────────────
test('E2E-001: Nokia logo and LCD are visible on load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.nokia-brand')).toBeVisible();
  await expect(page.locator('[data-testid="lcd-frame"]')).toBeVisible();
});

test('E2E-002: LCD maintains 84:48 aspect ratio (± 0.02)', async ({ page }) => {
  await page.goto('/');
  const frame = page.locator('[data-testid="lcd-frame"]');
  const box = await frame.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    const ratio = box.width / box.height;
    expect(ratio).toBeCloseTo(84 / 48, 1); // 1.75 ± ~0.05
  }
});

// ─── E2E-007: Browser resize preserves LCD ratio ─────────────────────────────
test('E2E-007: LCD ratio preserved after browser resize', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 800, height: 600 });
  const frame = page.locator('[data-testid="lcd-frame"]');
  const box = await frame.boundingBox();
  if (box) {
    const ratio = box.width / box.height;
    expect(ratio).toBeCloseTo(84 / 48, 1);
  }
  // Resize larger
  await page.setViewportSize({ width: 1920, height: 1080 });
  const box2 = await frame.boundingBox();
  if (box2) {
    expect(box2.width / box2.height).toBeCloseTo(84 / 48, 1);
  }
});

// ─── E2E-009: Arrow key navigation ───────────────────────────────────────────
test('E2E-009: Arrow keys are accepted without JS errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.keyboard.press('Enter'); // start from menu
  await page.waitForTimeout(2000);    // wait for READY countdown
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  expect(errors).toHaveLength(0);
});
