/**
 * @fileoverview Screenshot and keyboard tests for the design system. Starts
 * the dev-only kitchen-sink on `KITCHEN_SINK_PORT` (default 5173) and runs
 * every `tests/**\/*.spec.ts` at the DESIGN.md desktop and mobile viewports.
 * Baselines live in `tests/screenshots/`; see packages/ui/README.md.
 */

import {defineConfig} from '@playwright/test';

const port = Number(process.env.KITCHEN_SINK_PORT || 5173);
const baseUrl = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  // Fonts differ per OS, so baselines are kept per platform.
  snapshotPathTemplate:
    '{testDir}/screenshots/{testFileName}/{arg}-{projectName}-{platform}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      // The stricter of the two wins, so a one-component regression still
      // fails on a tall full-page screenshot.
      maxDiffPixelRatio: 0.01,
      maxDiffPixels: 200,
      // Per-pixel colour tolerance. The palette is near-black, so adjacent
      // brightness steps (border vs border-strong) differ only slightly.
      threshold: 0.02,
      scale: 'css',
    },
  },
  use: {
    baseURL: baseUrl,
    browserName: 'chromium',
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    locale: 'zh-TW',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {name: 'desktop', use: {viewport: {width: 1440, height: 1024}}},
    {name: 'mobile', use: {viewport: {width: 390, height: 844}}},
  ],
  webServer: {
    command: 'pnpm exec tsx kitchen_sink/serve.ts',
    env: {KITCHEN_SINK_PORT: String(port)},
    // Never attach to a server from another worktree on the same port.
    reuseExistingServer: false,
    stdout: 'pipe',
    timeout: 60_000,
    url: `${baseUrl}/`,
  },
});
