/**
 * @fileoverview The account shape the application reports. Accounts are
 * created only by the demo entry point for now; tickets 03 and 10 add
 * invitation and member sign-up. Listing accounts is not a production
 * use-case: only the development role switcher (`dev.ts`) and the demo
 * (`demo.ts`) list them.
 */

import type {AccountRecord} from '@pokernext/db';
import type {AccountKind, Workspace} from '@pokernext/domain';

import {type AccountId, storedAccountId} from './identifiers';

/** An account as the application reports it. */
export interface AccountSummary {
  readonly id: AccountId;
  readonly kind: AccountKind;
  readonly displayName: string;
  readonly workspace: Workspace;
  /** Role within the workspace as shown to people, such as 天城業務. */
  readonly roleLabel: string;
}

/** Maps a stored account to the reported shape. */
export function toAccountSummary(record: AccountRecord): AccountSummary {
  const {id, kind, displayName, workspace, roleLabel} = record;
  return {id: storedAccountId(id), kind, displayName, workspace, roleLabel};
}
