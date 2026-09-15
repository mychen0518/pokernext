/**
 * @fileoverview Makes `pnpm demo` available to `demo:diff` and `demo:script`:
 * reuses a demo that already answers on the work-account host, or starts one
 * from the same entry (`main.ts`) and stops it again when done. Also builds
 * the demo's host origins and role-switch URLs from the same environment
 * variables `pnpm demo` reads.
 */

import {type ChildProcess, spawn, spawnSync} from 'node:child_process';
import {request} from 'node:http';
import {fileURLToPath} from 'node:url';

import {DEMO_ACCOUNTS} from '@pokernext/app/demo';

import type {HostKind, SignInAs} from './diff_pages';
import {STOP_MESSAGE, STOP_ON_IPC_ENV} from './demo_ipc';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const DEMO_MAIN = fileURLToPath(new URL('../main.ts', import.meta.url));
const READY_TIMEOUT_MILLISECONDS = 300_000;
const STOP_TIMEOUT_MILLISECONDS = 60_000;
/** Lines of the demo's output kept for an error message. */
const OUTPUT_TAIL_LINES = 40;

/** The environment variables `pnpm demo` reads for its hosts and port. */
export interface DemoHostEnvironment {
  /** Every other variable, passed on to a demo started here. */
  readonly [name: string]: string | undefined;
  readonly DEMO_PORT?: string;
  readonly POKERNEXT_PLAYER_HOST?: string;
  readonly POKERNEXT_WORK_HOST?: string;
}

/** The two host origins of the demo, e.g. `http://work.localhost:3000`. */
export type DemoOrigins = Readonly<Record<HostKind, string>>;

/** A demo this process can use. */
export interface DemoServer {
  readonly origins: DemoOrigins;
  /** False when an already running demo was reused. */
  readonly startedHere: boolean;
  /** Stops the demo if this process started it; otherwise does nothing. */
  stop(): Promise<void>;
}

/** Returns the demo's player and work-account origins. */
export function demoOrigins(
  env: DemoHostEnvironment = process.env,
): DemoOrigins {
  const port = demoPort(env);
  return {
    player: `http://${env.POKERNEXT_PLAYER_HOST || 'player.localhost'}:${port}`,
    work: `http://${env.POKERNEXT_WORK_HOST || 'work.localhost'}:${port}`,
  };
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
  if (await answersHealthCheck(origins.work)) {
    log(`[demo] Reusing the demo already running at ${origins.work}.`);
    return {origins, startedHere: false, stop: async () => {}};
  }
  log('[demo] Demo not running; starting pnpm demo…');
  const demo = startDemoProcess(env);
  try {
    await waitUntilHealthy(origins.work, demo);
  } catch (error: unknown) {
    await demo.stop();
    throw error;
  }
  log(`[demo] Demo is up at ${origins.work} and ${origins.player}.`);
  return {origins, startedHere: true, stop: () => demo.stop()};
}

/** A `main.ts` child process and what it printed. */
interface DemoProcess {
  readonly child: ChildProcess;
  outputTail(): string;
  stop(): Promise<void>;
}

function startDemoProcess(env: DemoHostEnvironment): DemoProcess {
  const child = spawn(process.execPath, ['--import', 'tsx', DEMO_MAIN], {
    cwd: REPO_ROOT,
    env: {...process.env, ...env, [STOP_ON_IPC_ENV]: '1'},
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  const lines: string[] = [];
  const keep = (chunk: unknown) => {
    lines.push(...String(chunk).split(/\r?\n/).filter(Boolean));
    lines.splice(0, Math.max(0, lines.length - OUTPUT_TAIL_LINES));
  };
  child.stdout?.on('data', keep);
  child.stderr?.on('data', keep);
  let stopping: Promise<void> | undefined;
  const stop = () => {
    stopping ??= stopDemoProcess(child);
    return stopping;
  };
  return {child, outputTail: () => lines.join('\n'), stop};
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
    killProcessTree(child);
  }
  const timedOut = await Promise.race([
    exited.then(() => false),
    new Promise<boolean>(resolve => {
      setTimeout(() => resolve(true), STOP_TIMEOUT_MILLISECONDS).unref();
    }),
  ]);
  if (timedOut) {
    killProcessTree(child);
    await exited;
  }
}

async function waitUntilHealthy(
  origin: string,
  demo: DemoProcess,
): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MILLISECONDS;
  while (Date.now() < deadline) {
    if (demo.child.exitCode !== null) {
      throw new Error(
        `pnpm demo exited with code ${demo.child.exitCode}:\n${demo.outputTail()}`,
      );
    }
    if (await answersHealthCheck(origin)) {
      return;
    }
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
  }
  throw new Error(
    `${origin}/api/health did not answer 200 within ` +
      `${READY_TIMEOUT_MILLISECONDS} ms:\n${demo.outputTail()}`,
  );
}

/**
 * Tells whether the origin's `/api/health` answers 200. The request goes to
 * 127.0.0.1 with the origin's Host header, because Node does not resolve
 * `*.localhost` names on every platform.
 */
function answersHealthCheck(origin: string): Promise<boolean> {
  const url = new URL(origin);
  return new Promise(resolve => {
    const outgoing = request(
      {
        host: '127.0.0.1',
        port: url.port,
        path: '/api/health',
        headers: {host: url.host},
        timeout: 10_000,
      },
      response => {
        response.resume();
        resolve(response.statusCode === 200);
      },
    );
    outgoing.once('timeout', () => outgoing.destroy());
    outgoing.once('error', () => resolve(false));
    outgoing.end();
  });
}

function demoPort(env: DemoHostEnvironment): number {
  return Number(env.DEMO_PORT || 3000);
}

function killProcessTree(child: ChildProcess): void {
  if (child.pid === undefined || child.exitCode !== null) {
    return;
  }
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    return;
  }
  child.kill('SIGKILL');
}
