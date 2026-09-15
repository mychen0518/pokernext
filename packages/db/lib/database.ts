/**
 * @fileoverview Opens a pooled connection and exposes the stores over it.
 */

import {drizzle} from 'drizzle-orm/node-postgres';
import pg from 'pg';

import {
  type AccountStore,
  createAccountStore,
  createSessionStore,
  type SessionStore,
} from './accounts';
import {type AuditLogStore, createAuditLogStore} from './audit_log';
import {createHealthCheckStore, type HealthCheckStore} from './health_checks';

/** How to connect. */
export interface ConnectOptions {
  readonly url: string;
  /** Pool size; concurrency tests need at least as many as parallel attempts. */
  readonly maxConnections?: number;
}

/** A pooled connection to one database and the stores that use it. */
export interface Database {
  readonly healthChecks: HealthCheckStore;
  readonly accounts: AccountStore;
  readonly sessions: SessionStore;
  readonly auditLog: AuditLogStore;
  /** Closes every pooled connection. */
  close(): Promise<void>;
}

/** Opens a connection pool to the database at `options.url`. */
export function connectDatabase(options: ConnectOptions): Database {
  const pool = new pg.Pool({
    connectionString: options.url,
    max: options.maxConnections ?? 10,
  });
  // An idle client that loses its server connection emits 'error' on the pool;
  // without a listener Node would crash the process. The next query that
  // needs a connection reports the failure instead.
  pool.on('error', () => {});
  const db = drizzle({client: pool});
  return {
    healthChecks: createHealthCheckStore(db),
    accounts: createAccountStore(db),
    sessions: createSessionStore(db),
    auditLog: createAuditLogStore(db),
    close: () => pool.end(),
  };
}
