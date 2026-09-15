/**
 * @fileoverview Entry point for local development tooling (`pnpm demo`): starts
 * the embedded Postgres 16 cluster for a purpose, or defers to its override
 * (`DATABASE_URL` for tests, `DEMO_DATABASE_URL` for the demo).
 * Production code does not import it, so embedded-postgres never ships.
 */

export {LOCAL_CLUSTERS} from './lib/config';
export type {LocalClusterName, LocalClusterSettings} from './lib/config';
export {startDatabaseServer} from './lib/local_cluster';
export type {DatabaseServer} from './lib/local_cluster';
