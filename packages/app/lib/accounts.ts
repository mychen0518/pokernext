/**
 * @fileoverview Account use-cases and the account shape the application
 * reports. Accounts are created only by the demo entry point for now; tickets
 * 03 and 10 add invitation and member sign-up.
 */

import type {AccountRecord, Database} from '@pokernext/db';
import {type AccountKind, type Workspace, WORKSPACES} from '@pokernext/domain';

/** An account as the application reports it. */
export interface AccountSummary {
  readonly id: string;
  readonly kind: AccountKind;
  readonly displayName: string;
  readonly workspace: Workspace;
  /** Role within the workspace as shown to people, such as 天城業務. */
  readonly roleLabel: string;
}

/** The account use-cases. */
export interface AccountUseCases {
  /**
   * Lists every account in workspace order. Only the development role
   * switcher calls it; ticket 03 puts account listings behind authorization.
   */
  list(): Promise<AccountSummary[]>;
}

/** Builds the account use-cases over the database. */
export function createAccountUseCases(database: Database): AccountUseCases {
  return {
    async list() {
      const records = await database.accounts.list();
      return records
        .map(toAccountSummary)
        .sort(
          (left, right) =>
            WORKSPACES.indexOf(left.workspace) -
            WORKSPACES.indexOf(right.workspace),
        );
    },
  };
}

/** Maps a stored account to the reported shape. */
export function toAccountSummary(record: AccountRecord): AccountSummary {
  const {id, kind, displayName, workspace, roleLabel} = record;
  return {id, kind, displayName, workspace, roleLabel};
}
