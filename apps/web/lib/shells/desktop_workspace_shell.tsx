/**
 * @fileoverview The desktop workspace shell (DESIGN.md §3.2) for the venue,
 * admin, platform and agent workspaces: WorkspaceShell with a Sidebar whose
 * subtitle is the workspace name, one home navigation item, the signed-in
 * account and 登出. A client component because 登出 is a button handler.
 */

'use client';

import {Sidebar, Topbar, UserChip, WorkspaceShell} from '@pokernext/ui';
import {House} from 'lucide-react';
import type {ReactNode} from 'react';

import {signOut} from '../sign_out_action';
import {HOME_NAV_LABEL} from '../workspace_copy';

/** Props for {@link DesktopWorkspaceShell}. */
export interface DesktopWorkspaceShellProps {
  /** CONTEXT.md workspace name, such as 場館工作區. */
  workspaceName: string;
  breadcrumb: string;
  /** Current Korea date and time with its time zone label. */
  dateTime: string;
  homeHref: string;
  displayName: string;
  roleLabel: string;
  /** The page: a PageHeader, then its content. */
  children: ReactNode;
}

/** Renders a desktop workspace page for the signed-in account. */
export function DesktopWorkspaceShell({
  workspaceName,
  breadcrumb,
  dateTime,
  homeHref,
  displayName,
  roleLabel,
  children,
}: DesktopWorkspaceShellProps) {
  return (
    <WorkspaceShell
      sidebar={
        <Sidebar
          workspaceName={workspaceName}
          items={[
            {id: 'home', label: HOME_NAV_LABEL, href: homeHref, icon: House},
          ]}
          currentId="home"
          user={<UserChip name={displayName} role={roleLabel} />}
          onSignOut={() => {
            void signOut();
          }}
        />
      }
      topbar={<Topbar breadcrumb={breadcrumb} dateTime={dateTime} />}
    >
      {children}
    </WorkspaceShell>
  );
}
