/**
 * @fileoverview Command-line entry of `pnpm demo:diff` (run with tsx).
 */

import {runDemoDiff} from './lib/run_demo_diff';

runDemoDiff()
  .then(reportPath => {
    console.log(`\n[diff] Report: ${reportPath}`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
