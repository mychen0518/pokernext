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
  },
});
