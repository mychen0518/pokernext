/**
 * @fileoverview Demo account creation: one account per workspace, named after
 * the prototype's role list (`docs/design/prototype/pokernext-prototype.html`,
 * `ROLES`). Reachable only through `demo.ts` (dependency-cruiser allows only
 * `tooling/demo`) and the test wiring, so it never reaches a production build.
 * Fixed ids make it idempotent: a second run creates nothing.
 */

import {connectDatabase, type Database} from '@pokernext/db';
import {accountKindOfWorkspace, type Workspace} from '@pokernext/domain';
import type {Clock} from '@pokernext/ports';

import type {AccountSummary} from './accounts';
import {listEveryAccount} from './account_listing';
import {SYSTEM_CLOCK} from './system_clock';

/** One demo account as seeded. */
export interface DemoAccount {
  readonly id: string;
  readonly workspace: Workspace;
  readonly displayName: string;
  readonly roleLabel: string;
}

/** The six demo accounts; ids never change so reruns find them. */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    id: '5e3d0000-de30-4000-8000-000000000001',
    workspace: 'player',
    displayName: 'Alex Chen',
    roleLabel: '正式會員',
  },
  {
    id: '5e3d0000-de30-4000-8000-000000000002',
    workspace: 'venue',
    displayName: '琪琪',
    roleLabel: '天城業務',
  },
  {
    id: '5e3d0000-de30-4000-8000-000000000003',
    workspace: 'admin',
    displayName: '王經理',
    roleLabel: '管理者',
  },
  {
    id: '5e3d0000-de30-4000-8000-000000000004',
    workspace: 'platform',
    displayName: 'Mingyao',
    roleLabel: 'Platform admin',
  },
  {
    id: '5e3d0000-de30-4000-8000-000000000005',
    workspace: 'staff',
    displayName: 'Amy',
    roleLabel: '接待人',
  },
  {
    id: '5e3d0000-de30-4000-8000-000000000006',
    workspace: 'agent',
    displayName: 'David Chen',
    roleLabel: '外部 Agent',
  },
];

/** The demo accounts exist; `created` counts the ones this call added. */
export interface DemoAccountsEnsured {
  readonly created: number;
  readonly accounts: AccountSummary[];
}

/** Connection settings for {@link ensureDemoAccounts}. */
export interface EnsureDemoAccountsOptions {
  readonly databaseUrl: string;
}

/** Creates any missing demo account on an open database. */
export async function ensureDemoAccountsOn(
  database: Database,
  clock: Clock,
): Promise<DemoAccountsEnsured> {
  let created = 0;
  for (const account of DEMO_ACCOUNTS) {
    const inserted = await database.accounts.insertIfAbsent({
      ...account,
      kind: accountKindOfWorkspace(account.workspace),
      createdAt: clock.now(),
    });
    if (inserted) {
      created += 1;
    }
  }
  const accounts = await listEveryAccount(database);
  return {created, accounts};
}

/**
 * Creates any missing demo account in the database at the URL, with the
 * system clock, and closes the connection.
 */
export async function ensureDemoAccounts(
  options: EnsureDemoAccountsOptions,
): Promise<DemoAccountsEnsured> {
  const database = connectDatabase({
    url: options.databaseUrl,
    maxConnections: 1,
  });
  try {
    return await ensureDemoAccountsOn(database, SYSTEM_CLOCK);
  } finally {
    await database.close();
  }
}
