/**
 * @fileoverview Playwright config of `pnpm demo:script`: the 13 steps of the
 * prototype's 「示範劇本：Alex 的濟州行程」 in `tests/demo_script.spec.ts`,
 * run in order against `pnpm demo` (started by the global setup, or reused
 * when already running). `video: 'on'` records the run; the shared script
 * page saves it to `recordings/<DEMO_BATCH>.webm` (tests/support/script.ts).
 * Not part of `pnpm test`: this package has no `test:e2e` script.
 */

import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  globalSetup: './tests/playwright_global_setup.ts',
  outputDir: './test-results',
  // One demo, one account state and steps that build on each other.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  // Each step may cross hosts and wait for first compiles in `next dev`.
  timeout: 180_000,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    colorScheme: 'dark',
    locale: 'zh-TW',
    timezoneId: 'Asia/Seoul',
    video: 'on',
  },
});
