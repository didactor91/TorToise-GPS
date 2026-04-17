import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:39001',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command: 'npm run seed:e2e -w track-api && PORT=8085 npm start -w track-api',
      cwd: '..',
      url: 'http://127.0.0.1:8085/api/health',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'VITE_API_URL=http://127.0.0.1:8085/api npm run dev -- --host 127.0.0.1 --port 39001 --strictPort',
      url: 'http://127.0.0.1:39001',
      timeout: 120 * 1000,
      reuseExistingServer: false
    }
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
