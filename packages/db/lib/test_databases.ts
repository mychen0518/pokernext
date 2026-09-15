/**
 * @fileoverview Per-test databases cloned from a migrated template (ADR-0001:
 * no transaction-rollback isolation, so concurrency tests see committed data
 * through a real pool).
 */

import {randomBytes} from 'node:crypto';

import pg from 'pg';

import {
  type DatabaseEnvironment,
  resolveDatabaseUrl,
  withDatabase,
} from './config';
import {quoteIdentifier, startDatabaseServer} from './local_cluster';
import {migrateDatabase, migrationsFingerprint} from './migrations';

const TEMPLATE_PREFIX = 'pokernext_template_';
const CLONE_PREFIX = 'pokernext_test_';
/** Clones older than this are leftovers of crashed runs and get swept. */
const STALE_CLONE_SECONDS = 60 * 60;
const MAX_CLONE_ATTEMPTS = 10;

/** A database of its own for one test app or one test server. */
export interface TestDatabase {
  readonly url: string;
  /** Drops the database, closing any connection still open to it. */
  drop(): Promise<void>;
}

/** The test database server, ready to hand out clones. */
export interface TestDatabaseServer {
  /** Stops the local cluster if this call started it. */
  stop(): Promise<void>;
}

/**
 * Starts (or reuses) the test server and makes sure a template database with
 * the current migrations exists. Run once per test run, before any clone.
 */
export async function startTestDatabaseServer(
  env: DatabaseEnvironment = process.env,
): Promise<TestDatabaseServer> {
  const server = await startDatabaseServer('test', env);
  try {
    await withClient(server.url, async client => {
      await ensureTemplate(client, server.url);
      await sweepLeftovers(client);
    });
  } catch (error: unknown) {
    await server.stop();
    throw error;
  }
  return server;
}

/** Clones a fresh database from the migrated template. */
export async function createTestDatabase(
  env: DatabaseEnvironment = process.env,
): Promise<TestDatabase> {
  const serverUrl = resolveDatabaseUrl('test', env);
  const template = templateName();
  const name = `${CLONE_PREFIX}${nowSeconds()}_${randomBytes(4).toString('hex')}`;
  await withClient(serverUrl, async client => {
    for (let attempt = 1; ; attempt++) {
      try {
        await client.query(
          `CREATE DATABASE ${quoteIdentifier(name)} TEMPLATE ${quoteIdentifier(template)}`,
        );
        return;
      } catch (error: unknown) {
        if (postgresCode(error) === '3D000') {
          throw new Error(
            `The test template database ${template} does not exist. Run ` +
              'tests with `pnpm test:unit` (its Vitest globalSetup builds the ' +
              'template) or call startTestDatabaseServer() first.',
            {cause: error},
          );
        }
        // 55006: another session was briefly using the template.
        if (postgresCode(error) !== '55006' || attempt >= MAX_CLONE_ATTEMPTS) {
          throw error;
        }
        await pause(50 * attempt);
      }
    }
  });
  return {
    url: withDatabase(serverUrl, name),
    drop: () =>
      withClient(serverUrl, async client => {
        await client.query(
          `DROP DATABASE IF EXISTS ${quoteIdentifier(name)} WITH (FORCE)`,
        );
      }),
  };
}

/** Names the template after the migrations it was built from. */
function templateName(): string {
  return `${TEMPLATE_PREFIX}${migrationsFingerprint().slice(0, 16)}`;
}

/** Builds the template unless a template for these migrations exists. */
async function ensureTemplate(
  client: pg.Client,
  serverUrl: string,
): Promise<void> {
  const template = templateName();
  if (await databaseExists(client, template)) {
    return;
  }
  // Build under a private name and rename at the end, so a crashed or
  // concurrent build never leaves a half-migrated template behind.
  const building = `${template}_build_${randomBytes(4).toString('hex')}`;
  await client.query(`CREATE DATABASE ${quoteIdentifier(building)}`);
  try {
    await migrateDatabase(withDatabase(serverUrl, building));
    await client.query(
      `ALTER DATABASE ${quoteIdentifier(building)} RENAME TO ${quoteIdentifier(template)}`,
    );
  } catch (error: unknown) {
    await client.query(
      `DROP DATABASE IF EXISTS ${quoteIdentifier(building)} WITH (FORCE)`,
    );
    // 42P04: a concurrent run finished the same template first.
    if (postgresCode(error) === '42P04') {
      return;
    }
    throw error;
  }
  // Nobody connects to the template, which keeps it cloneable.
  await client.query(
    `ALTER DATABASE ${quoteIdentifier(template)} WITH IS_TEMPLATE true ALLOW_CONNECTIONS false`,
  );
}

/** Drops templates of older migrations and clones left by crashed runs. */
async function sweepLeftovers(client: pg.Client): Promise<void> {
  const current = templateName();
  const result = await client.query<{datname: string}>(
    'SELECT datname FROM pg_database WHERE datname LIKE $1 OR datname LIKE $2',
    [`${TEMPLATE_PREFIX}%`, `${CLONE_PREFIX}%`],
  );
  for (const {datname} of result.rows) {
    const staleTemplate =
      datname.startsWith(TEMPLATE_PREFIX) && datname !== current;
    const createdAt = Number(datname.slice(CLONE_PREFIX.length).split('_')[0]);
    const staleClone =
      datname.startsWith(CLONE_PREFIX) &&
      nowSeconds() - createdAt > STALE_CLONE_SECONDS;
    if (!staleTemplate && !staleClone) {
      continue;
    }
    try {
      if (staleTemplate) {
        await client.query(
          `ALTER DATABASE ${quoteIdentifier(datname)} WITH IS_TEMPLATE false`,
        );
      }
      await client.query(`DROP DATABASE ${quoteIdentifier(datname)}`);
    } catch {
      // Still in use by another run; a later run sweeps it.
    }
  }
}

async function databaseExists(
  client: pg.Client,
  name: string,
): Promise<boolean> {
  const found = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [name],
  );
  return (found.rowCount ?? 0) > 0;
}

async function withClient<T>(
  url: string,
  work: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new pg.Client({connectionString: url});
  client.on('error', () => {});
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

/** Reads the SQLSTATE code of a node-postgres error. */
function postgresCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String(error.code);
  }
  return undefined;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function pause(milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}
