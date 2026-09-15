/**
 * @fileoverview Workspace-wide Vitest config. Collects `tests/**` test files
 * from every package; Playwright owns `*.spec.ts`.
 */

import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '.claude/**',
      'Claude outputs/**',
    ],
    globalSetup: ['packages/app/tests/support/database_global_setup.ts'],
    // Starting the embedded cluster the first time runs initdb.
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
});
