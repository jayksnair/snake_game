import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    { name: 'laptop',  use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768  } } },
    { name: 'mobile',  use: { ...devices['iPhone 14'] } },
  ],
});
