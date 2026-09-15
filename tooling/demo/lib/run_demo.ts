/**
 * @fileoverview `pnpm demo`: starts the demo database (embedded Postgres 16,
 * no Docker, or `DEMO_DATABASE_URL`; never `DATABASE_URL`), applies
 * migrations, ensures the six demo accounts, and runs `next dev` for apps/web
 * on the player and work-account hosts, passing it the demo database as its
 * `DATABASE_URL`, until Ctrl+C, which stops Next and Postgres.
 */

import {type ChildProcess, spawn, spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createConnection} from 'node:net';
import {fileURLToPath} from 'node:url';

import {ensureDemoAccounts} from '@pokernext/app/demo';
import {LOCAL_CLUSTERS, startDatabaseServer} from '@pokernext/db/local_cluster';
import {migrateDatabase} from '@pokernext/db/migrate';

import {STOP_MESSAGE, STOP_ON_IPC_ENV} from './demo_ipc';

const WEB_ROOT = fileURLToPath(new URL('../../../apps/web/', import.meta.url));
const DEFAULT_PORT = 3000;
const READY_TIMEOUT_MILLISECONDS = 180_000;
/** Next output of the demo, apart from e2e runs and the build test. */
const DEMO_DIST_DIR = '.next/demo';

/** The environment `pnpm demo` reads. */
interface DemoEnvironment {
  readonly DEMO_DATABASE_URL?: string;
  readonly DEMO_PORT?: string;
  readonly POKERNEXT_PLAYER_HOST?: string;
  readonly POKERNEXT_WORK_HOST?: string;
  readonly NODE_ENV?: string;
  readonly POKERNEXT_DEMO_STOP_ON_IPC?: string;
}

/** Runs the demo until the process receives Ctrl+C or Next exits. */
export async function runDemo(
  env: DemoEnvironment = process.env,
): Promise<void> {
  const port = Number(env.DEMO_PORT || DEFAULT_PORT);
  if (await isListening('127.0.0.1', port)) {
    throw new Error(
      `Port ${port} is already in use; stop that process or set DEMO_PORT.`,
    );
  }
  const usesDatabaseUrl = Boolean(env.DEMO_DATABASE_URL);
  log(
    usesDatabaseUrl
      ? 'Database: DEMO_DATABASE_URL'
      : `Database: embedded Postgres 16, .data/${LOCAL_CLUSTERS.demo.dataDirectoryName} ` +
          `(port ${LOCAL_CLUSTERS.demo.port})`,
  );
  const server = await startDatabaseServer('demo', env);
  let next: ChildProcess | undefined;
  let stopping: Promise<void> | undefined;
  const stop = () => {
    stopping ??= (async () => {
      log('Stopping Next.js and Postgres…');
      if (next !== undefined) {
        stopProcessTree(next);
      }
      try {
        await server.stop();
      } catch (error: unknown) {
        log(`Postgres did not stop cleanly: ${String(error)}`);
      }
      log('Stopped.');
    })();
    return stopping;
  };
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void stop().then(() => process.exit(0));
    });
  }
  // Started by `demo:diff` / `demo:script` (lib/demo_server.ts) with an IPC
  // channel: Windows has no catchable signal for a child process, so the
  // parent asks for a clean stop, and a parent that dies disconnects. The
  // environment flag tells that channel apart from the one tsx's own CLI
  // opens under `pnpm demo`.
  if (env[STOP_ON_IPC_ENV] === '1' && process.send !== undefined) {
    process.on('message', message => {
      if (message === STOP_MESSAGE) {
        void stop().then(() => process.exit(0));
      }
    });
    process.once('disconnect', () => {
      void stop().then(() => process.exit(0));
    });
    // Listening must not keep the process alive once Next has exited.
    process.channel?.unref();
  }

  try {
    await migrateDatabase(server.url);
    log('Migrations applied.');
    const {created, accounts} = await ensureDemoAccounts({
      databaseUrl: server.url,
    });
    log(
      `Demo accounts: ${accounts.length} present, ${created} created this run.`,
    );
    for (const account of accounts) {
      log(
        `  ${account.workspace.padEnd(8)} ${account.displayName}（${account.roleLabel}）`,
      );
    }
    next = spawnNext(port, server.url);
    await waitUntilReady(`http://127.0.0.1:${port}/api/health`, next);
  } catch (error: unknown) {
    await stop();
    throw error;
  }

  const playerHost = env.POKERNEXT_PLAYER_HOST || 'player.localhost';
  const workHost = env.POKERNEXT_WORK_HOST || 'work.localhost';
  log('');
  log(`玩家 host:     http://${playerHost}:${port}/`);
  log(`工作帳號 host: http://${workHost}:${port}/`);
  log('Use 切換角色 on either page to sign in as a demo account.');
  log('Press Ctrl+C to stop Next.js and Postgres.');

  await new Promise<void>(resolve => {
    next?.once('exit', () => resolve());
  });
  await stop();
}

/** Runs `next dev` from apps/web on the demo database. */
function spawnNext(port: number, databaseUrl: string): ChildProcess {
  const nextBin = createRequire(`${WEB_ROOT}package.json`).resolve(
    'next/dist/bin/next',
  );
  return spawn(
    process.execPath,
    [nextBin, 'dev', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      cwd: WEB_ROOT,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        NEXT_DIST_DIR: DEMO_DIST_DIR,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      stdio: ['ignore', 'inherit', 'inherit'],
    },
  );
}

/** Polls the URL until it answers 200, failing fast if Next exits. */
async function waitUntilReady(url: string, next: ChildProcess): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MILLISECONDS;
  while (Date.now() < deadline) {
    if (next.exitCode !== null) {
      throw new Error(`next dev exited with code ${next.exitCode}.`);
    }
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        return;
      }
    } catch {
      // Not listening yet.
    }
    await new Promise(resolve => {
      setTimeout(resolve, 500);
    });
  }
  throw new Error(
    `${url} did not answer 200 within ${READY_TIMEOUT_MILLISECONDS} ms.`,
  );
}

/** Stops a process and every process it started. */
function stopProcessTree(child: ChildProcess): void {
  if (child.pid === undefined || child.exitCode !== null) {
    return;
  }
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    return;
  }
  child.kill('SIGTERM');
}

/** Tells whether something accepts TCP connections on the address. */
function isListening(host: string, port: number): Promise<boolean> {
  return new Promise(resolve => {
    const socket = createConnection({host, port});
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

function log(message: string): void {
  console.log(`[demo] ${message}`);
}
