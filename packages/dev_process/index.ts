/**
 * @fileoverview Development-only entry point: starting and stopping the local
 * servers that `pnpm demo`, `demo:diff`, `demo:script` and HTTP-level tests
 * run. It waits until a server answers, tells whether a port is taken and
 * stops a process with everything it started. dependency-cruiser lets only
 * `tooling/` and test code import it, so it never reaches production code.
 */

export {stopProcessTree} from './lib/process_tree';
export {
  answersOk,
  isListening,
  keepOutputTail,
  READY_TIMEOUT_MILLISECONDS,
  waitUntilAnswering,
} from './lib/readiness';
export type {ServerProcess, WaitUntilAnsweringOptions} from './lib/readiness';
