/**
 * @fileoverview A workspace home. Every request resolves the host's session
 * through `app.sessions.resolve`, which applies the domain access rule; an
 * allowed actor gets the workspace's empty shell, anything else the refusal
 * page. Nothing on the shells is data: no counts, no demo rows.
 */

import type {Workspace, WorkspaceActorSummary} from '@pokernext/app';
import {
  AppHeader,
  BottomNav,
  type BottomNavItem,
  EmptyState,
  PageHeader,
  PlayerShell,
} from '@pokernext/ui';
import {RoleSwitcher} from '#role_switcher';
import {notFound} from 'next/navigation';

import {formatKoreaDateTime} from '../korea_time';
import {readRequestSession} from '../request_session';
import {getRuntimeApp} from '../runtime_app';
import {DesktopWorkspaceShell} from '../shells/desktop_workspace_shell';
import {HOME_NAV_LABEL, SHELL_EMPTY_REASON} from '../workspace_copy';
import {WORKSPACE_ROUTES} from '../workspace_routes';
import {RefusalPage} from './refusal_page';

/** Props for {@link WorkspaceHome}. */
export interface WorkspaceHomeProps {
  workspace: Workspace;
}

/** Resolves the session for the workspace and renders its home or a refusal. */
export async function WorkspaceHome({workspace}: WorkspaceHomeProps) {
  const {host, token} = await readRequestSession();
  if (host === undefined) {
    notFound();
  }
  const app = getRuntimeApp();
  const outcome = await app.sessions.resolve({token, host, workspace});
  if (outcome.status === 'refused') {
    const home = await app.sessions.home({token, host});
    return (
      <RefusalPage
        reason={outcome.reason}
        requested={workspace}
        own={home.status === 'signedIn' ? home.workspace : undefined}
      />
    );
  }
  return <WorkspaceShellFor workspace={workspace} actor={outcome.actor} />;
}

interface WorkspaceShellForProps {
  workspace: Workspace;
  actor: WorkspaceActorSummary;
}

/** Picks the shell of the workspace's surface. */
function WorkspaceShellFor({workspace, actor}: WorkspaceShellForProps) {
  if (workspace === 'player') {
    return <PlayerHomeShell />;
  }
  if (workspace === 'staff') {
    return <StaffHomeShell />;
  }
  const route = WORKSPACE_ROUTES[workspace];
  return (
    <DesktopWorkspaceShell
      workspaceName={route.name}
      breadcrumb={route.breadcrumb}
      dateTime={formatKoreaDateTime(new Date())}
      homeHref={route.path}
      displayName={actor.displayName}
      roleLabel={actor.roleLabel}
    >
      <PageHeader
        title={HOME_NAV_LABEL}
        description={route.name}
        action={<RoleSwitcher />}
      />
      <EmptyState reason={SHELL_EMPTY_REASON} />
    </DesktopWorkspaceShell>
  );
}

/** Player links stay on the home until ticket 13 adds the other pages. */
const PLAYER_NAV_HREFS: Readonly<Record<BottomNavItem, string>> = {
  home: WORKSPACE_ROUTES.player.path,
  trips: WORKSPACE_ROUTES.player.path,
  qr: WORKSPACE_ROUTES.player.path,
  points: WORKSPACE_ROUTES.player.path,
  account: WORKSPACE_ROUTES.player.path,
};

/** The player workspace (DESIGN.md §3.1): header, empty state, BottomNav. */
function PlayerHomeShell() {
  return (
    <PlayerShell
      navigation={<BottomNav current="home" hrefs={PLAYER_NAV_HREFS} />}
    >
      <AppHeader />
      <EmptyState reason={SHELL_EMPTY_REASON} action={<RoleSwitcher />} />
    </PlayerShell>
  );
}

/**
 * The reception workspace: DESIGN.md §3.3 has no layout yet (ticket 22 runs
 * `/prototype`), so only a phone-width frame and the empty state, no
 * navigation.
 */
function StaffHomeShell() {
  return (
    <PlayerShell navigation={null}>
      <EmptyState reason={SHELL_EMPTY_REASON} action={<RoleSwitcher />} />
    </PlayerShell>
  );
}
