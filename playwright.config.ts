import { defineConfig, devices } from '@playwright/test';
import { release } from 'node:os';

// Playwright's WebKit build for macOS 14 (Darwin 23) is frozen and no longer speaks the current protocol, and on
// the Linux PC (Ubuntu 26.04, not a platform Playwright supports) WebKit launches but canvas animations never
// advance. WebKit projects run in CI, on macOS >= 15 and inside CI's image (scripts/e2e-webkit.sh sets PW_WEBKIT).
const webkitAvailable =
  !!process.env['CI'] || !!process.env['PW_WEBKIT'] || (process.platform === 'darwin' && Number(release().split('.')[0]) >= 24);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // The fanless MacBook Air overheats with one browser per two cores; override with --workers.
  workers: process.env['CI'] ? undefined : 2,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4300', trace: 'retain-on-failure' },
  webServer: {
    command: 'npx http-server dist/portfolio/browser -p 4300 -s -c-1',
    url: 'http://localhost:4300/en/',
    reuseExistingServer: !process.env['CI'],
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
    ...(webkitAvailable
      ? [
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
          { name: 'iphone', use: { ...devices['iPhone 15'] } },
        ]
      : []),
  ],
});
