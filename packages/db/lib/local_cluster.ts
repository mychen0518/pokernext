/**
 * @fileoverview Starts the local embedded Postgres 16 clusters (no Docker).
 * Only test and demo tooling load this file, so production code never loads
 * embedded-postgres.
 */

import {existsSync} from 'node:fs';
import {mkdir, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';

import {
  type DatabaseEnvironment,
  LOCAL_CLUSTERS,
  type LocalClusterName,
  localClusterUrl,
  resolveDatabaseUrl,
} from './config';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

/** A database server this process may have started. */
export interface DatabaseServer {
  /** The URL of the purpose's database on this server. */
  readonly url: string;
  /** Stops the server if this process started it; otherwise does nothing. */
  stop(): Promise<void>;
}

/**
 * Makes the server for a purpose reachable. With `DATABASE_URL` set it only
 * returns that URL. Otherwise it starts the local cluster, or reuses it when
 * another process already runs it, and creates the purpose's database.
 */
export async function startDatabaseServer(
  purpose: LocalClusterName,
  env: DatabaseEnvironment = process.env,
): Promise<DatabaseServer> {
  const url = resolveDatabaseUrl(purpose, env);
  if (env.DATABASE_URL !== undefined && env.DATABASE_URL !== '') {
    return {url, stop: async () => {}};
  }
  const stop = await startLocalCluster(purpose);
  await ensureDatabaseExists(purpose);
  return {url, stop};
}

/** Starts a local cluster unless it already answers; returns its stopper. */
async function startLocalCluster(
  name: LocalClusterName,
): Promise<() => Promise<void>> {
  const settings = LOCAL_CLUSTERS[name];
  const maintenanceUrl = localClusterUrl(name, 'postgres');
  if (await acceptsConnections(maintenanceUrl)) {
    return async () => {};
  }
  const databaseDir = join(REPO_ROOT, '.data', settings.dataDirectoryName);
  const log: string[] = [];
  const cluster = new EmbeddedPostgres({
    databaseDir,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    persistent: true,
    // UTF-8 with the C locale, whatever the OS locale is (a zh-TW Windows
    // would otherwise pick a Big5 code page).
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    postgresFlags: Object.entries(settings.serverSettings).flatMap(
      ([name, value]) => ['-c', `${name}=${value}`],
    ),
    onLog: message => {
      log.push(String(message));
    },
    onError: message => {
      log.push(String(message));
    },
  });
  try {
    if (!existsSync(join(databaseDir, 'PG_VERSION'))) {
      // initdb refuses a non-empty directory left by an interrupted init.
      await rm(databaseDir, {recursive: true, force: true});
      await mkdir(databaseDir, {recursive: true});
      await cluster.initialise();
    }
    await cluster.start();
  } catch (error: unknown) {
    throw new Error(
      `Could not start the local ${name} Postgres cluster in ${databaseDir} ` +
        `on port ${settings.port}.\n${log.slice(-20).join('')}`,
      {cause: error},
    );
  }
  return () => cluster.stop();
}

/** Creates the purpose's database on the local cluster if it is missing. */
async function ensureDatabaseExists(name: LocalClusterName): Promise<void> {
  const {database} = LOCAL_CLUSTERS[name];
  const client = new pg.Client({
    connectionString: localClusterUrl(name, 'postgres'),
  });
  await client.connect();
  try {
    const found = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );
    if (found.rowCount === 0) {
      await client.query(`CREATE DATABASE ${quoteIdentifier(database)}`);
    }
  } finally {
    await client.end();
  }
}

/** Tells whether a Postgres server answers at the URL. */
async function acceptsConnections(url: string): Promise<boolean> {
  const client = new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: 2_000,
  });
  client.on('error', () => {});
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

/** Quotes a Postgres identifier. */
export function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}
