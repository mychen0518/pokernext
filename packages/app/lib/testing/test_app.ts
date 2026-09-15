/**
 * @fileoverview Builds the application for a test: its own database cloned
 * from the migrated template, fake external ports and a controllable clock.
 */

import {connectDatabase} from '@pokernext/db';
import {createTestDatabase} from '@pokernext/db/testing';
import {
  ControllableClock,
  type ControllableClockOptions,
  createFakePorts,
  type FakeExternalPorts,
} from '@pokernext/ports/testing';

import {type App, createApp} from '../app';
import {type AuditEntry, readAuditEntries} from '../audit_log';
import {type DemoAccountsEnsured, ensureDemoAccountsOn} from '../demo_accounts';

/** How to set up a test app. */
export interface TestAppOptions extends ControllableClockOptions {
  /**
   * Pool size of the app's database connection. Concurrency tests with more
   * parallel attempts than this still run, but queue for connections.
   */
  maxConnections?: number;
}

/** The application under test, with handles on its fakes and clock. */
export interface TestApp extends App {
  readonly clock: ControllableClock;
  readonly ports: FakeExternalPorts;
  /**
   * The URL of this test's own database, for entry points that connect by
   * themselves (`@pokernext/app/dev`, an HTTP test server).
   */
  readonly databaseUrl: string;
  /**
   * Creates any missing demo account with the demo entry point's
   * implementation. Tests reach it through `given(app).demoAccount(…)`.
   */
  ensureDemoAccounts(): Promise<DemoAccountsEnsured>;
  /**
   * Reads every AuditLog entry, oldest first. Test-only: the production `App`
   * has no AuditLog query yet (ticket 03 adds an authorized one), and tests
   * observe the log through this instead of reading tables.
   */
  auditLog(): Promise<AuditEntry[]>;
  /** Closes connections and drops the test's database. */
  close(): Promise<void>;
}

/**
 * Creates an application on a fresh database. Tests arrange state only by
 * calling its use-cases (see `given`), never by writing tables.
 */
export async function createTestApp(
  options: TestAppOptions = {},
): Promise<TestApp> {
  const testDatabase = await createTestDatabase();
  const database = connectDatabase({
    url: testDatabase.url,
    maxConnections: options.maxConnections ?? 10,
  });
  const clock = new ControllableClock(options);
  const ports = createFakePorts(clock);
  const app = createApp({database, clock, ports});
  return {
    ...app,
    clock,
    ports,
    databaseUrl: testDatabase.url,
    ensureDemoAccounts: () => ensureDemoAccountsOn(database, clock),
    auditLog: () => readAuditEntries(database),
    close: async () => {
      await app.close();
      await testDatabase.drop();
    },
  };
}
