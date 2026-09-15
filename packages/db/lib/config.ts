/**
 * @fileoverview Every database connection setting in the repo: the local
 * embedded Postgres 16 clusters for tests and the demo, and how a purpose
 * resolves to a connection URL. `DATABASE_URL` overrides the local clusters
 * (CI points it at a Postgres 16 service container).
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
  readonly DATABASE_URL?: string;
  readonly NODE_ENV?: string;
}

/**
 * Resolves the connection URL for a purpose. `DATABASE_URL` wins when set;
 * otherwise tests use the local test cluster and the demo (and a non-production
 * app) uses the local demo cluster. A production app must set `DATABASE_URL`.
 */
export function resolveDatabaseUrl(
  purpose: DatabasePurpose,
  env: DatabaseEnvironment = process.env,
): string {
  if (env.DATABASE_URL !== undefined && env.DATABASE_URL !== '') {
    return env.DATABASE_URL;
  }
  if (purpose === 'app' && env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL must be set when NODE_ENV is production.');
  }
  return localClusterUrl(purpose === 'test' ? 'test' : 'demo');
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
