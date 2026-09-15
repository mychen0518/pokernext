/**
 * @fileoverview Composes the use-cases over the database, clock and external
 * ports. Real wiring and test wiring both go through {@link createApp}.
 */

import {
  connectDatabase,
  type Database,
  resolveDatabaseUrl,
} from '@pokernext/db';
import type {Clock, ExternalPorts} from '@pokernext/ports';

import {type AccountUseCases, createAccountUseCases} from './accounts';
import {
  createHealthCheckUseCases,
  type HealthCheckUseCases,
} from './health_check';
import {createSessionUseCases, type SessionUseCases} from './sessions';
import {SYSTEM_CLOCK} from './system_clock';
import {createUnconfiguredPorts} from './unconfigured_ports';

/** What the use-cases run on. */
export interface AppDependencies {
  readonly database: Database;
  readonly clock: Clock;
  readonly ports: ExternalPorts;
}

/** The application: every use-case, grouped by capability. */
export interface App {
  readonly healthCheck: HealthCheckUseCases;
  readonly accounts: AccountUseCases;
  readonly sessions: SessionUseCases;
  /** Releases the database connections. */
  close(): Promise<void>;
}

/** Builds the application from explicit dependencies. */
export function createApp(dependencies: AppDependencies): App {
  const {database, clock} = dependencies;
  return {
    healthCheck: createHealthCheckUseCases(database, clock),
    accounts: createAccountUseCases(database),
    sessions: createSessionUseCases(database, clock),
    close: () => database.close(),
  };
}

/** The environment variables the composition root reads. */
export interface AppEnvironment {
  readonly DATABASE_URL?: string;
  readonly NODE_ENV?: string;
}

/**
 * Builds the application for a running server: the database from
 * `@pokernext/db` settings, the system clock, and the external ports that
 * have real adapters (none yet; each port's ticket adds its adapter).
 */
export function createAppFromEnvironment(
  env: AppEnvironment = process.env,
): App {
  return createApp({
    database: connectDatabase({url: resolveDatabaseUrl('app', env)}),
    clock: SYSTEM_CLOCK,
    ports: createUnconfiguredPorts(),
  });
}
