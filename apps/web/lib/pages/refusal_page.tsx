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
import {type WorkspaceRoute, WORKSPACE_ROUTES} from '../workspace_routes';

/** The request carries no usable session, whatever it asked for. */
export interface NoSessionRefusalProps {
  readonly reason: 'noSession';
}

/** A session asked for a workspace it may not enter. */
export interface EntryRefusalProps {
  readonly reason: WorkspaceEntryRefusal;
  /** The workspace that was asked for. */
  readonly requested: Workspace;
  /** The workspace the host's session belongs to, if it has one. */
  readonly own?: Workspace;
}

/** Props for {@link RefusalPage}: no session, or an entry refused. */
export type RefusalPageProps = NoSessionRefusalProps | EntryRefusalProps;

/** Renders why the request was refused and where the account can go. */
export function RefusalPage(props: RefusalPageProps) {
  if (props.reason === 'noSession') {
    return <RefusalFrame sentence={NO_SESSION_REASON} />;
  }
  const ownRoute =
    props.own === undefined ? undefined : WORKSPACE_ROUTES[props.own];
  return (
    <RefusalFrame
      sentence={refusalReason(
        props.reason,
        WORKSPACE_ROUTES[props.requested].name,
        ownRoute?.name,
      )}
      ownRoute={ownRoute}
    />
  );
}

interface RefusalFrameProps {
  sentence: string;
  /** The signed-in account's own workspace; its actions show only with one. */
  ownRoute?: WorkspaceRoute;
}

/** The phone-width frame with the sentence and the available actions. */
function RefusalFrame({sentence, ownRoute}: RefusalFrameProps) {
  return (
    <PlayerShell navigation={null}>
      <EmptyState
        icon={ShieldAlert}
        reason={<span role="alert">{sentence}</span>}
        action={
          <>
            {ownRoute === undefined ? undefined : (
              <OwnWorkspaceActions ownRoute={ownRoute} />
            )}
            <RoleSwitcher />
          </>
        }
      />
    </PlayerShell>
  );
}

interface OwnWorkspaceActionsProps {
  ownRoute: WorkspaceRoute;
}

/** 前往 the account's own workspace, and 登出. */
function OwnWorkspaceActions({ownRoute}: OwnWorkspaceActionsProps) {
  return (
    <>
      <form method="get" action={ownRoute.path}>
        <Button type="submit" variant="secondary">
          {goToWorkspaceLabel(ownRoute.name)}
        </Button>
      </form>
      <form action={signOut}>
        <Button type="submit" variant="secondary">
          {SIGN_OUT_LABEL}
        </Button>
      </form>
    </>
  );
}
