import { defineConfig, devices } from '@playwright/test';

const PORT = 8097;

// Browser tests run the production build against a mock Transmission server
// (tests/e2e/mock-transmission.mjs), so they need `vite build` first;
// `npm run test:e2e` does both.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/transmission/web/`,
    viewport: { width: 1440, height: 900 },
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: `node tests/e2e/mock-transmission.mjs dist ${PORT}`,
    url: `http://localhost:${PORT}/transmission/web/`,
    reuseExistingServer: !process.env.CI,
  },
});
