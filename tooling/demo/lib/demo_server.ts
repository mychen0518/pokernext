/**
 * @fileoverview Makes `pnpm demo` available to `demo:diff` and `demo:script`:
 * reuses a demo that already answers on the work-account host, or starts one
 * from the same entry (`main.ts`) and stops it again when done. Also builds
 * role-switch URLs on the demo's host origins (`demo_hosts.ts`).
 */

import {type ChildProcess, spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

import {DEMO_ACCOUNTS} from '@pokernext/app/demo';
import {
  answersOk,
  keepOutputTail,
  READY_TIMEOUT_MILLISECONDS,
  type ServerProcess,
  stopProcessTree,
  waitUntilAnswering,
} from '@pokernext/dev_process';

import type {HostKind, SignInAs} from './diff_pages';
import {
  type DemoHostEnvironment,
  demoOrigins,
  type DemoOrigins,
} from './demo_hosts';
import {STOP_MESSAGE, STOP_ON_IPC_ENV} from './demo_ipc';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const DEMO_MAIN = fileURLToPath(new URL('../main.ts', import.meta.url));
/**
 * How long a started demo may take to answer: its own wait for `next dev`
 * plus up to two minutes to start Postgres (initdb on a first run) and
 * migrate.
 */
const DEMO_READY_TIMEOUT_MILLISECONDS = READY_TIMEOUT_MILLISECONDS + 120_000;
const STOP_TIMEOUT_MILLISECONDS = 60_000;

/** A demo this process can use. */
export interface DemoServer {
  readonly origins: DemoOrigins;
  /** False when an already running demo was reused. */
  readonly startedHere: boolean;
  /** Stops the demo if this process started it; otherwise does nothing. */
  stop(): Promise<void>;
}

/**
 * Returns the development role-switch URL that signs in on the host and lands
 * on the account's workspace home (ticket 00d).
 */
export function roleSwitchUrl(
  host: HostKind,
  signInAs: SignInAs,
  env: DemoHostEnvironment = process.env,
): string {
  const accountId =
    'accountId' in signInAs
      ? signInAs.accountId
      : demoAccountIdOf(signInAs.workspace);
  return `${demoOrigins(env)[host]}/dev/role-switch?account=${encodeURIComponent(accountId)}`;
}

/** Returns the id of the seeded demo account of a workspace. */
function demoAccountIdOf(workspace: string): string {
  const account = DEMO_ACCOUNTS.find(known => known.workspace === workspace);
  if (account === undefined) {
    throw new Error(`No demo account belongs to workspace ${workspace}.`);
  }
  return account.id;
}

/**
 * Reuses the demo when its work-account host answers `/api/health`, or runs
 * `main.ts` (what `pnpm demo` runs) and waits until it answers.
 */
export async function ensureDemoServer(
  env: DemoHostEnvironment = process.env,
  log: (message: string) => void = console.log,
): Promise<DemoServer> {
  const origins = demoOrigins(env);
  const healthUrl = `${origins.work}/api/health`;
  if (await answersOk(healthUrl)) {
    log(`[demo] Reusing the demo already running at ${origins.work}.`);
    return {origins, startedHere: false, stop: async () => {}};
  }
  log('[demo] Demo not running; starting pnpm demo…');
  const demo = startDemoProcess(env);
  try {
    await waitUntilAnswering(demo, healthUrl, {
      timeoutMilliseconds: DEMO_READY_TIMEOUT_MILLISECONDS,
    });
  } catch (error: unknown) {
    await demo.stop();
    throw error;
  }
  log(`[demo] Demo is up at ${origins.work} and ${origins.player}.`);
  return {origins, startedHere: true, stop: () => demo.stop()};
}

/** A `main.ts` child process and what it printed. */
interface DemoProcess extends ServerProcess {
  stop(): Promise<void>;
}

function startDemoProcess(env: DemoHostEnvironment): DemoProcess {
  const child = spawn(process.execPath, ['--import', 'tsx', DEMO_MAIN], {
    cwd: REPO_ROOT,
    env: {...process.env, ...env, [STOP_ON_IPC_ENV]: '1'},
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  let stopping: Promise<void> | undefined;
  const stop = () => {
    stopping ??= stopDemoProcess(child);
    return stopping;
  };
  return {child, name: 'pnpm demo', outputTail: keepOutputTail(child), stop};
}

/** Asks the demo to stop Next and Postgres cleanly; kills it if it hangs. */
async function stopDemoProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  const exited = new Promise<void>(resolve => {
    child.once('exit', () => resolve());
  });
  if (child.connected) {
    child.send(STOP_MESSAGE);
  } else {
    stopProcessTree(child, 'SIGKILL');
  }
  const timedOut = await Promise.race([
    exited.then(() => false),
    new Promise<boolean>(resolve => {
      setTimeout(() => resolve(true), STOP_TIMEOUT_MILLISECONDS).unref();
    }),
  ]);
  if (timedOut) {
    stopProcessTree(child, 'SIGKILL');
    await exited;
  }
}
