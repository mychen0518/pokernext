/**
 * @fileoverview The development role switcher's account listing, behind the
 * `@pokernext/app/dev` entry point. It lists every account without an actor,
 * so it refuses to run in production as well as being removed from production
 * bundles.
 */

import {connectDatabase, resolveDatabaseUrl} from '@pokernext/db';

import type {AccountSummary} from './accounts';
import {listEveryAccount} from './account_listing';
import type {AppEnvironment} from './app';

/**
 * Names this development-only listing in its refusal message.
 * `apps/web/tests/production_build.test.ts` asserts production bundles do not
 * contain it.
 */
const DEV_LISTING_MARKER = 'pn-dev-account-listing';

/**
 * Lists every account for the development role switcher, in workspace order,
 * on the database the application uses. Rejects when `NODE_ENV` is
 * `production`.
 */
export async function listAccountsForRoleSwitcher(
  env: AppEnvironment = process.env,
): Promise<AccountSummary[]> {
  if (env.NODE_ENV === 'production') {
    throw new Error(
      `${DEV_LISTING_MARKER}: the role switcher's account listing is ` +
        'development-only and does not run in production.',
    );
  }
  const database = connectDatabase({
    url: resolveDatabaseUrl('app', env),
    maxConnections: 1,
  });
  try {
    return await listEveryAccount(database);
  } finally {
    await database.close();
  }
}
