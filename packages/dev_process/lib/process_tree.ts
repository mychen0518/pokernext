/**
 * @fileoverview Stops a child process together with the processes it started
 * (`next dev` runs workers; `pnpm demo` runs Next and Postgres).
 */

import {type ChildProcess, spawnSync} from 'node:child_process';

/**
 * Stops a process and every process it started. On Windows `taskkill /t /f`
 * ends the whole tree. Elsewhere the signal goes to the child's process group
 * when it was spawned `detached` (so descendants receive it too), otherwise
 * to the child alone.
 */
export function stopProcessTree(
  child: ChildProcess,
  signal: NodeJS.Signals = 'SIGTERM',
): void {
  if (
    child.pid === undefined ||
    child.exitCode !== null ||
    child.signalCode !== null
  ) {
    return;
  }
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    return;
  }
  try {
    process.kill(-child.pid, signal);
    return;
  } catch {
    // Not a process group leader: it was not spawned detached.
  }
  try {
    child.kill(signal);
  } catch {
    // Already gone.
  }
}
