/**
 * @fileoverview Every sentence the workspace shells and the refusal page show,
 * in one module so copy stays reviewable in CONTEXT.md vocabulary.
 */

import type {WorkspaceEntryRefusal} from '@pokernext/app';

/** The home navigation item of every desktop workspace. */
export const HOME_NAV_LABEL = '工作區首頁';

/** Why an empty shell has nothing to show (DESIGN.md §5: 給原因). */
export const SHELL_EMPTY_REASON =
  '本工作區的功能尚未上線，上線後會顯示在這裡。';

/** Why a request carries no usable session. */
export const NO_SESSION_REASON = '尚未登入，登入後才能進入工作區。';

/** The refusal sentence for a session that may not enter a workspace. */
export function refusalReason(
  reason: WorkspaceEntryRefusal | 'noSession',
  requestedName: string,
  ownName: string | undefined,
): string {
  switch (reason) {
    case 'noSession':
      return NO_SESSION_REASON;
    case 'otherWorkspace':
      return ownName === undefined
        ? `目前的帳號不能進入${requestedName}。`
        : `目前的帳號屬於${ownName}，不能進入${requestedName}。`;
    case 'workspaceNotOnHost':
      return `${requestedName}不在這個網址提供。`;
    case 'sessionFromOtherHost':
    case 'accountNotAllowedOnHost':
      return '目前的登入不適用於這個網址，請重新登入。';
  }
}

/** The button that takes a signed-in account to its own workspace. */
export function goToWorkspaceLabel(name: string): string {
  return `前往${name}`;
}

/** The sign-out button. */
export const SIGN_OUT_LABEL = '登出';
