/**
 * @fileoverview The desktop workspace shell (DESIGN.md §3.2) for the venue,
 * admin, platform and agent workspaces: WorkspaceShell with a Sidebar whose
 * subtitle is the workspace name, one home navigation item, the signed-in
 * account and 登出. A client component because 登出 is a button handler.
 */

'use client';

import type {WorkspaceActorSummary} from '@pokernext/app';
import {Sidebar, Topbar, UserChip, WorkspaceShell} from '@pokernext/ui';
import {House} from 'lucide-react';
import type {ReactNode} from 'react';

import {signOut} from '../sign_out_action';
import {HOME_NAV_LABEL} from '../workspace_copy';
import type {WorkspaceRoute} from '../workspace_routes';

/** Props for {@link DesktopWorkspaceShell}. */
export interface DesktopWorkspaceShellProps {
  /** The workspace: its name, breadcrumb and home path. */
  route: WorkspaceRoute;
  /** The signed-in account, shown in the Sidebar's UserChip. */
  actor: Pick<WorkspaceActorSummary, 'displayName' | 'roleLabel'>;
  /** Current Korea date and time with its time zone label. */
  dateTime: string;
  /** The page: a PageHeader, then its content. */
  children: ReactNode;
}

/** Renders a desktop workspace page for the signed-in account. */
export function DesktopWorkspaceShell({
  route,
  actor,
  dateTime,
  children,
}: DesktopWorkspaceShellProps) {
  return (
    <WorkspaceShell
      sidebar={
        <Sidebar
          workspaceName={route.name}
          items={[
            {id: 'home', label: HOME_NAV_LABEL, href: route.path, icon: House},
          ]}
          currentId="home"
          user={<UserChip name={actor.displayName} role={actor.roleLabel} />}
          onSignOut={() => {
            void signOut();
          }}
        />
      }
      topbar={<Topbar breadcrumb={route.breadcrumb} dateTime={dateTime} />}
    >
      {children}
    </WorkspaceShell>
  );
}
