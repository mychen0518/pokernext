/**
 * @fileoverview Composes the use-cases over the database, clock and external
 * ports. Real wiring and test wiring both go through {@link createApp}.
 */

import {connectDatabase, resolveDatabaseUrl} from '@pokernext/db';

import type {AppDependencies} from './app_dependencies';
import {
  createHealthCheckUseCases,
  type HealthCheckUseCases,
} from './health_check';
import {createSessionUseCases, type SessionUseCases} from './sessions';
import {SYSTEM_CLOCK} from './system_clock';
import {createUnconfiguredPorts} from './unconfigured_ports';

export type {AppDependencies} from './app_dependencies';

/** The application: every use-case, grouped by capability. */
export interface App {
  readonly healthCheck: HealthCheckUseCases;
  readonly sessions: SessionUseCases;
  /** Releases the database connections. */
  close(): Promise<void>;
}

/**
 * Builds the application from explicit dependencies. Every group of
 * use-cases receives all of them, the injected external ports included.
 */
export function createApp(dependencies: AppDependencies): App {
  return {
    healthCheck: createHealthCheckUseCases(dependencies),
    sessions: createSessionUseCases(dependencies),
    close: () => dependencies.database.close(),
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
