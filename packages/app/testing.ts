/**
 * @fileoverview Test-only entry point of the use-case layer: the test app
 * (cloned database, fake ports, controllable clock), the test database server
 * lifecycle for global setups, and the concurrency tool. dependency-cruiser
 * lets only test code import this file.
 */

export {
  createTestDatabase,
  startTestDatabaseServer,
} from '@pokernext/db/testing';
export type {TestDatabase, TestDatabaseServer} from '@pokernext/db/testing';
export {
  ConcurrencyViolation,
  expectTakesEffectOnce,
  runInParallel,
} from './lib/testing/concurrency';
export type {
  ParallelAttempts,
  TakesEffectOnceCheck,
} from './lib/testing/concurrency';
// For HTTP-level test servers that run the app on a cloned database: the same
// demo account creation as `@pokernext/app/demo`.
export {ensureDemoAccounts as ensureDemoAccountsInDatabase} from './lib/demo_accounts';
export type {DemoAccountsEnsured} from './lib/demo_accounts';
export {given, LegalOperations, PreconditionRefused} from './lib/testing/given';
export type {HealthCheckRecordedOptions} from './lib/testing/given';
export {createTestApp} from './lib/testing/test_app';
export type {TestApp, TestAppOptions} from './lib/testing/test_app';
