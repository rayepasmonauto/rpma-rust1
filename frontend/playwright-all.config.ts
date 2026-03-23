import { defineConfig, devices } from '@playwright/test'

const WEB_SERVER_PORT = 43200

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${WEB_SERVER_PORT}`,
    trace: 'off',
  },
  webServer: {
    command: `npm run dev:next -- --port ${WEB_SERVER_PORT}`,
    port: WEB_SERVER_PORT,
    reuseExistingServer: false,
    timeout: 180000,
    env: {
      NEXT_PUBLIC_IPC_MOCK: 'true',
      NODE_ENV: 'test',
      PORT: WEB_SERVER_PORT.toString(),
    },
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
