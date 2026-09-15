/**
 * @fileoverview Workspace Vitest config. Vitest runs only `tests/**\/*.test.ts(x)`;
 * `*.spec.ts` files belong to Playwright and must never be collected here.
 */

import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
    exclude: ['**/node_modules/**'],
  },
});
