/**
 * @fileoverview Lists every account with no actor and no authorization. It
 * exists for development tools only: dependency-cruiser lets only `dev.ts`,
 * the demo implementation and the test wiring import this file, so it never
 * reaches the production `App`. Ticket 03 adds an authorized account listing.
 */

import type {Database} from '@pokernext/db';
import {WORKSPACES} from '@pokernext/domain';

import {type AccountSummary, toAccountSummary} from './accounts';

/** Lists every account in workspace order. */
export async function listEveryAccount(
  database: Database,
): Promise<AccountSummary[]> {
  const records = await database.accounts.list();
  return records
    .map(toAccountSummary)
    .sort(
      (left, right) =>
        WORKSPACES.indexOf(left.workspace) -
        WORKSPACES.indexOf(right.workspace),
    );
}
