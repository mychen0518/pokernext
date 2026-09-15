/**
 * @fileoverview Demo-only entry point: the use-case that creates seeded demo
 * accounts (ADR-0001), and the list of those accounts so demo tooling can
 * sign in as one through the development role switch. dependency-cruiser
 * allows only `tooling/demo` to import this file, so it never reaches a
 * production build.
 */

export {DEMO_ACCOUNTS, ensureDemoAccounts} from './lib/demo_accounts';
export type {
  DemoAccount,
  DemoAccountsEnsured,
  EnsureDemoAccountsOptions,
} from './lib/demo_accounts';
