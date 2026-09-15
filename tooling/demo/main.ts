/**
 * @fileoverview Command-line entry of `pnpm demo` (run with tsx).
 */

import {runDemo} from './lib/run_demo';

runDemo().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
