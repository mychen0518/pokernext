/**
 * @fileoverview Public entry point of the Postgres 16 persistence layer
 * (ADR-0001): connection settings, the pooled connection and its stores.
 * Migrations, the local embedded clusters and test databases have their own
 * entry points so production code never loads them.
 */

export type {
  AccountRecord,
  AccountStore,
  ActiveSessionRecord,
  SessionEnding,
  SessionRecord,
  SessionStore,
} from './lib/accounts';
export {connectDatabase} from './lib/database';
export type {ConnectOptions, Database} from './lib/database';
export {resolveDatabaseUrl} from './lib/config';
export type {DatabaseEnvironment, DatabasePurpose} from './lib/config';
export type {
  HealthCheckFilter,
  HealthCheckRecord,
  HealthCheckRecording,
  HealthCheckStore,
} from './lib/health_checks';
