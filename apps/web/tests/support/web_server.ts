/**
 * @fileoverview Serves apps/web for HTTP-level tests: starts the test database
 * server, clones a database for the run, and runs `next dev` on it. Playwright
 * starts its webServer before globalSetup, so this setup launches Next itself
 * to hand it the cloned database's URL.
 */

import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

import type {FullConfig} from '@playwright/test';
import {
  createTestDatabase,
  ensureDemoAccountsInDatabase,
  startTestDatabaseServer,
} from '@pokernext/app/testing';
import {
  isListening,
  keepOutputTail,
  type ServerProcess,
  stopProcessTree,
  waitUntilAnswering,
} from '@pokernext/dev_process';

const WEB_ROOT = fileURLToPath(new URL('../../', import.meta.url));

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
  // The role switcher offers these accounts; created by the demo use-case.
  await ensureDemoAccountsInDatabase({databaseUrl: database.url});
  const next = spawnNext(hostname, port, database.url);
  const teardown = async () => {
    stopProcessTree(next.child);
    await database.drop();
    await server.stop();
  };
  try {
    await waitUntilAnswering(next, `${baseUrl}/api/health`);
  } catch (error: unknown) {
    await teardown();
    throw error;
  }
  return teardown;
}

/** Runs `next dev` from apps/web against the given database. */
function spawnNext(
  hostname: string,
  port: string,
  databaseUrl: string,
): ServerProcess {
  const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next');
  const child = spawn(
    process.execPath,
    [nextBin, 'dev', '--hostname', hostname, '--port', port],
    {
      cwd: WEB_ROOT,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        // Its own Next output, so `pnpm demo` can run at the same time.
        NEXT_DIST_DIR: '.next/e2e',
        NEXT_TELEMETRY_DISABLED: '1',
      },
      // A process group on POSIX, so teardown can stop Next's workers too.
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  return {child, name: 'next dev', outputTail: keepOutputTail(child)};
}
