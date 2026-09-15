/**
 * @fileoverview The refusal page: the session cannot enter the requested
 * workspace (no session, another workspace, another host). Built from
 * EmptyState and Button in a phone-width frame; offers the account's own
 * workspace and 登出 when a session exists.
 */

import type {Workspace, WorkspaceEntryRefusal} from '@pokernext/app';
import {Button, EmptyState, PlayerShell} from '@pokernext/ui';
import {RoleSwitcher} from '#role_switcher';
import {ShieldAlert} from 'lucide-react';

import {signOut} from '../sign_out_action';
import {
  goToWorkspaceLabel,
  NO_SESSION_REASON,
  refusalReason,
  SIGN_OUT_LABEL,
} from '../workspace_copy';
import {WORKSPACE_ROUTES} from '../workspace_routes';

/** Props for {@link RefusalPage}. */
export interface RefusalPageProps {
  reason: WorkspaceEntryRefusal | 'noSession';
  /** The workspace that was asked for; undefined on the host's landing page. */
  requested?: Workspace;
  /** The workspace the host's session belongs to, if it has one. */
  own?: Workspace;
}

/** Renders why the request was refused and where the account can go. */
export function RefusalPage({reason, requested, own}: RefusalPageProps) {
  const ownRoute = own === undefined ? undefined : WORKSPACE_ROUTES[own];
  const sentence =
    requested === undefined
      ? NO_SESSION_REASON
      : refusalReason(reason, WORKSPACE_ROUTES[requested].name, ownRoute?.name);
  return (
    <PlayerShell navigation={null}>
      <EmptyState
        icon={ShieldAlert}
        reason={<span role="alert">{sentence}</span>}
        action={
          <>
            {ownRoute === undefined ? undefined : (
              <form method="get" action={ownRoute.path}>
                <Button type="submit" variant="secondary">
                  {goToWorkspaceLabel(ownRoute.name)}
                </Button>
              </form>
            )}
            {ownRoute === undefined ? undefined : (
              <form action={signOut}>
                <Button type="submit" variant="secondary">
                  {SIGN_OUT_LABEL}
                </Button>
              </form>
            )}
            <RoleSwitcher />
          </>
        }
      />
    </PlayerShell>
  );
}
