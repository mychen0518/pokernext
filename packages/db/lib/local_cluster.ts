/**
 * @fileoverview Starts the local embedded Postgres 16 clusters (no Docker).
 * Only test and demo tooling load this file, so production code never loads
 * embedded-postgres.
 */

import {execFile, spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {platform, tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';

import {
  type DatabaseEnvironment,
  LOCAL_CLUSTERS,
  type LocalClusterName,
  type LocalClusterSettings,
  localClusterOverride,
  localClusterUrl,
  resolveDatabaseUrl,
} from './config';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

/** How long `pg_ctl` waits for the server to start or stop. */
const PG_CTL_TIMEOUT_SECONDS = 120;

// UTF-8 with the C locale, whatever the OS locale is (a zh-TW Windows would
// otherwise pick a Big5 code page).
const INITDB_LOCALE_FLAGS = ['--encoding=UTF8', '--locale=C'];

/** A database server this process may have started. */
export interface DatabaseServer {
  /** The URL of the purpose's database on this server. */
  readonly url: string;
  /** Stops the server if this process started it; otherwise does nothing. */
  stop(): Promise<void>;
}

/**
 * Makes the server for a purpose reachable. With the purpose's override set
 * (`DATABASE_URL` for tests, `DEMO_DATABASE_URL` for the demo) it only
 * returns that URL. Otherwise it starts the local cluster, or reuses it when
 * another process already runs it, and creates the purpose's database.
 */
export async function startDatabaseServer(
  purpose: LocalClusterName,
  env: DatabaseEnvironment = process.env,
): Promise<DatabaseServer> {
  const url = resolveDatabaseUrl(purpose, env);
  if (localClusterOverride(purpose, env) !== undefined) {
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
  try {
    const initialised = existsSync(join(databaseDir, 'PG_VERSION'));
    if (!initialised) {
      // initdb refuses a non-empty directory left by an interrupted init.
      await rm(databaseDir, {recursive: true, force: true});
      // Only the parent: initdb creates the data directory itself. On an
      // administrator account initdb runs with a restricted token, which may
      // not change the permissions of a directory this process created.
      await mkdir(dirname(databaseDir), {recursive: true});
    }
    if (platform() === 'win32') {
      return await startOnWindows(settings, databaseDir, initialised, log);
    }
    const cluster = new EmbeddedPostgres({
      databaseDir,
      port: settings.port,
      user: settings.user,
      password: settings.password,
      persistent: true,
      initdbFlags: INITDB_LOCALE_FLAGS,
      postgresFlags: serverSettingFlags(settings),
      onLog: message => {
        log.push(String(message));
      },
      onError: message => {
        log.push(String(message));
      },
    });
    if (!initialised) {
      await cluster.initialise();
    }
    await cluster.start();
    return () => cluster.stop();
  } catch (error: unknown) {
    throw new Error(
      `Could not start the local ${name} Postgres cluster in ${databaseDir} ` +
        `on port ${settings.port}.\n${log.slice(-40).join('\n')}`,
      {cause: error},
    );
  }
}

/** Turns a cluster's server settings into `-c name=value` flags. */
function serverSettingFlags(settings: LocalClusterSettings): string[] {
  return Object.entries(settings.serverSettings).flatMap(([setting, value]) => [
    '-c',
    `${setting}=${value}`,
  ]);
}

/**
 * Initialises (when needed) and starts the cluster on Windows with the
 * bundled `initdb` and `pg_ctl`, and returns its stopper. GitHub's Windows
 * runners run as administrator, where Postgres binaries must re-launch
 * themselves with a restricted token. embedded-postgres breaks that: it
 * starts `postgres.exe` directly, which refuses an administrator token, and it
 * runs `initdb` with an environment stripped of `SystemRoot`, `PATH` and
 * `TEMP`, so the re-launch fails. Here both run with the full environment and
 * their output is kept for the error message. Stopping with `pg_ctl stop`
 * also shuts down cleanly instead of `taskkill /f`, so no stale
 * `postmaster.pid` is left behind.
 */
async function startOnWindows(
  settings: LocalClusterSettings,
  databaseDir: string,
  initialised: boolean,
  log: string[],
): Promise<() => Promise<void>> {
  const {initdb, pg_ctl: pgCtl} =
    await import('@embedded-postgres/windows-x64');
  if (!initialised) {
    await runInitdb(initdb, settings, databaseDir, log);
  }
  const serverFlags = [
    '-p',
    String(settings.port),
    ...serverSettingFlags(settings),
  ];
  const logFile = `${databaseDir}.log`;
  await runPgCtl(pgCtl, [
    'start',
    '-D',
    databaseDir,
    '-l',
    logFile,
    '-w',
    '-t',
    String(PG_CTL_TIMEOUT_SECONDS),
    '-o',
    serverFlags.join(' '),
  ]).catch(async (error: unknown) => {
    log.push(await readFile(logFile, 'utf8').catch(() => ''));
    throw error;
  });
  return async () => {
    await runPgCtl(pgCtl, ['stop', '-D', databaseDir, '-m', 'fast', '-w']);
  };
}

/**
 * Runs `initdb` into an empty data directory with password authentication,
 * collecting its stdout and stderr into `log`. `initdb` leaves no child
 * process behind, so piping its output is safe.
 */
async function runInitdb(
  initdb: string,
  settings: LocalClusterSettings,
  databaseDir: string,
  log: string[],
): Promise<void> {
  const passwordFile = join(
    tmpdir(),
    `pokernext-pg-password-${randomBytes(6).toString('hex')}`,
  );
  await writeFile(passwordFile, `${settings.password}\n`);
  try {
    await new Promise<void>((resolve, reject) => {
      execFile(
        initdb,
        [
          `--pgdata=${databaseDir}`,
          '--auth=password',
          `--username=${settings.user}`,
          `--pwfile=${passwordFile}`,
          ...INITDB_LOCALE_FLAGS,
        ],
        {windowsHide: true},
        (error, stdout, stderr) => {
          log.push(stdout, stderr);
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });
  } finally {
    await rm(passwordFile, {force: true});
  }
}

/**
 * Runs `pg_ctl` and resolves when it exits successfully. Its output is not
 * piped: the server it launches would inherit the pipes and keep them open,
 * so the call would never finish. The server writes to the `-l` log instead.
 */
function runPgCtl(pgCtl: string, args: readonly string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(pgCtl, args, {stdio: 'ignore', windowsHide: true});
    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pg_ctl ${args[0]} exited with code ${code}`));
      }
    });
  });
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
