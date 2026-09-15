/**
 * @fileoverview Global setup of `demo:script`: the same start-or-reuse logic
 * as `demo:diff`. A demo started here is stopped after the run; a demo that
 * was already running is left running.
 */

import {ensureDemoServer} from '../../demo_server';

/** Makes the demo available and returns the teardown that undoes it. */
export async function startScriptDemo(): Promise<() => Promise<void>> {
  const demo = await ensureDemoServer();
  return () => demo.stop();
}
