/**
 * @fileoverview Demo-only entry point: the use-case that creates seeded demo
 * accounts (ADR-0001). dependency-cruiser allows only `tooling/demo` to import
 * this file, so it never reaches a production build.
 */

export {ensureDemoAccounts} from './lib/demo_accounts';
export type {
  DemoAccountsEnsured,
  EnsureDemoAccountsOptions,
} from './lib/demo_accounts';
