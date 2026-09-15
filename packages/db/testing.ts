/**
 * @fileoverview Test-only entry point: the test database server and per-test
 * databases cloned from a migrated template (ADR-0001). dependency-cruiser
 * lets only test code and the `@pokernext/app/testing` wiring import it.
 */

export {
  createTestDatabase,
  startTestDatabaseServer,
} from './lib/test_databases';
export type {TestDatabase, TestDatabaseServer} from './lib/test_databases';
