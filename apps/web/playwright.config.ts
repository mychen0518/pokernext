/**
 * @fileoverview Playwright config for HTTP-level tests of apps/web. The global
 * setup starts the test database server, clones a database for this run and
 * serves the app on it; `E2E_WEB_PORT` overrides the default port.
 */

import {defineConfig} from '@playwright/test';

const PORT = Number(process.env.E2E_WEB_PORT ?? '3100');

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  globalSetup: './tests/playwright_global_setup.ts',
  // One server and one database for the whole run.
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {baseURL: `http://127.0.0.1:${PORT}`},
});
