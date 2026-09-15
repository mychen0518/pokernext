/**
 * @fileoverview Every database connection setting in the repo: the local
 * embedded Postgres 16 clusters for tests and the demo, and how a purpose
 * resolves to a connection URL. `DATABASE_URL` overrides the local test
 * cluster (CI points it at a Postgres 16 service container) and is the only
 * database of the application; `DEMO_DATABASE_URL` overrides the demo
 * cluster.
 */

/** Why a process wants a database connection. */
export type DatabasePurpose =
  // The running application (apps/web): its own database.
  | 'app'
  // Test runs: the server on which the template and per-test clones live.
  | 'test'
  // `pnpm demo`: the seeded demo database.
  | 'demo';

/** A local embedded cluster; each has its own port and data directory. */
export type LocalClusterName = 'test' | 'demo';

/** How one local embedded Postgres cluster is set up. */
export interface LocalClusterSettings {
  readonly port: number;
  readonly user: string;
  readonly password: string;
  /** The database that purpose connects to. */
  readonly database: string;
  /** Directory name under the repo-root `.data/` folder (gitignored). */
  readonly dataDirectoryName: string;
  /** Server settings passed as `-c name=value`. */
  readonly serverSettings: Readonly<Record<string, string>>;
}

/** Enough connections for parallel test workers and concurrency tests. */
const MAX_CONNECTIONS = '300';

/** The local clusters. Separate data directories keep test and demo apart. */
export const LOCAL_CLUSTERS: Readonly<
  Record<LocalClusterName, LocalClusterSettings>
> = {
  test: {
    port: 55432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
    dataDirectoryName: 'postgres-test',
    // Test data is thrown away, so skip flushing to disk. Locking, isolation
    // and constraints behave exactly as with durable settings.
    serverSettings: {
      max_connections: MAX_CONNECTIONS,
      fsync: 'off',
      synchronous_commit: 'off',
      full_page_writes: 'off',
    },
  },
  demo: {
    port: 55433,
    user: 'postgres',
    password: 'postgres',
    database: 'pokernext',
    dataDirectoryName: 'postgres-demo',
    serverSettings: {max_connections: MAX_CONNECTIONS},
  },
};

/** The environment variables the resolver reads. */
export interface DatabaseEnvironment {
  /** The application's database; for tests, the server clones live on. */
  readonly DATABASE_URL?: string;
  /** Overrides the local demo cluster for `pnpm demo` only. */
  readonly DEMO_DATABASE_URL?: string;
  readonly NODE_ENV?: string;
}

/**
 * Returns the URL that overrides the local cluster for a purpose, if set:
 * `DATABASE_URL` for tests (CI's Postgres service) and `DEMO_DATABASE_URL`
 * for the demo. The demo never reads `DATABASE_URL`, so a URL exported for
 * tests or CI cannot send demo data to that server.
 */
export function localClusterOverride(
  purpose: LocalClusterName,
  env: DatabaseEnvironment = process.env,
): string | undefined {
  const url = purpose === 'demo' ? env.DEMO_DATABASE_URL : env.DATABASE_URL;
  return url === undefined || url === '' ? undefined : url;
}

/**
 * Resolves the connection URL for a purpose. Tests and the demo use their
 * override (see {@link localClusterOverride}) or their local cluster. The
 * application uses `DATABASE_URL` only and never picks a database by itself:
 * `pnpm demo` and the e2e server pass it explicitly.
 */
export function resolveDatabaseUrl(
  purpose: DatabasePurpose,
  env: DatabaseEnvironment = process.env,
): string {
  if (purpose !== 'app') {
    return localClusterOverride(purpose, env) ?? localClusterUrl(purpose);
  }
  if (env.DATABASE_URL === undefined || env.DATABASE_URL === '') {
    throw new Error(
      'DATABASE_URL is not set. The application does not choose a database ' +
        'by itself: `pnpm demo` and the e2e test server pass DATABASE_URL ' +
        'explicitly; set it to run apps/web any other way.',
    );
  }
  return env.DATABASE_URL;
}

/** Builds the URL of a local cluster's database for that purpose. */
export function localClusterUrl(
  name: LocalClusterName,
  database: string = LOCAL_CLUSTERS[name].database,
): string {
  const {user, password, port} = LOCAL_CLUSTERS[name];
  return `postgres://${user}:${password}@127.0.0.1:${port}/${database}`;
}

/** Returns the same server URL pointed at another database. */
export function withDatabase(serverUrl: string, database: string): string {
  const url = new URL(serverUrl);
  url.pathname = `/${database}`;
  return url.toString();
}
