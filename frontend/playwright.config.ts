import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir: './e2e', fullyParallel: false, workers: 1,
 use: {baseURL: 'http://localhost:5173', ...devices['iPhone 13'], defaultBrowserType: 'chromium'},
 webServer: [
  {command: 'npm --prefix ../worker run dev:e2e', url: 'http://127.0.0.1:5080/health', reuseExistingServer: false, timeout: 120000},
  {command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI},
 ],
});
