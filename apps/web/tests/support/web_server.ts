/**
 * @fileoverview Serves apps/web for HTTP-level tests: starts the test database
 * server, clones a database for the run, and runs `next dev` on it. Playwright
 * starts its webServer before globalSetup, so this setup launches Next itself
 * to hand it the cloned database's URL.
 */

import {type ChildProcess, spawn, spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createConnection} from 'node:net';
import {fileURLToPath} from 'node:url';

import type {FullConfig} from '@playwright/test';
import {
  createTestDatabase,
  startTestDatabaseServer,
} from '@pokernext/app/testing';

const WEB_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const READY_TIMEOUT_MILLISECONDS = 180_000;

/**
 * Starts the database and the app, waits until the health endpoint answers,
 * and returns the teardown that stops both.
 */
export async function startWebServer(
  config: FullConfig,
): Promise<() => Promise<void>> {
  const baseUrl = config.projects[0]?.use.baseURL;
  if (baseUrl === undefined) {
    throw new Error('playwright.config.ts must set use.baseURL.');
  }
  const {hostname, port} = new URL(baseUrl);
  if (await isListening(hostname, Number(port))) {
    throw new Error(
      `Port ${port} is already in use; stop that process or set E2E_WEB_PORT.`,
    );
  }

  const server = await startTestDatabaseServer();
  const database = await createTestDatabase();
  const next = spawnNext(hostname, port, database.url);
  const teardown = async () => {
    stopProcessTree(next.child);
    await database.drop();
    await server.stop();
  };
  try {
    await waitUntilReady(`${baseUrl}/api/health`, next);
  } catch (error: unknown) {
    await teardown();
    throw error;
  }
  return teardown;
}

/** A running `next dev` and what it has printed. */
interface NextProcess {
  readonly child: ChildProcess;
  /** Describes how Next exited, or undefined while it is running. */
  exitReport(): string | undefined;
}

/** Runs `next dev` from apps/web against the given database. */
function spawnNext(
  hostname: string,
  port: string,
  databaseUrl: string,
): NextProcess {
  const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next');
  const child = spawn(
    process.execPath,
    [nextBin, 'dev', '--hostname', hostname, '--port', port],
    {
      cwd: WEB_ROOT,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      // A process group on POSIX, so teardown can stop Next's workers too.
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const output: string[] = [];
  let exitReport: string | undefined;
  child.stdout?.on('data', chunk => output.push(String(chunk)));
  child.stderr?.on('data', chunk => output.push(String(chunk)));
  child.once('exit', code => {
    exitReport = `next dev exited with code ${code}:\n${output.join('')}`;
  });
  return {child, exitReport: () => exitReport};
}

/** Polls the URL until it answers 200, failing fast if Next exits. */
async function waitUntilReady(url: string, next: NextProcess): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MILLISECONDS;
  while (Date.now() < deadline) {
    const exited = next.exitReport();
    if (exited !== undefined) {
      throw new Error(exited);
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
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    // Already gone.
  }
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
