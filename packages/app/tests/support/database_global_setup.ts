/**
 * @fileoverview Vitest globalSetup: starts the test Postgres server (or uses
 * `DATABASE_URL`) and builds the migrated template once per run, so each test
 * app can clone its own database.
 */

import {startTestDatabaseServer} from '../../testing';

/** Starts the server and returns the teardown that stops it. */
export async function setup(): Promise<() => Promise<void>> {
  const server = await startTestDatabaseServer();
  return () => server.stop();
}
