/**
 * @fileoverview The 場館工作區 frame shared by the desktop page-type pages:
 * WorkspaceShell with the venue Sidebar and Topbar.
 */

import type {ReactNode} from 'react';

import {Badge, Sidebar, Topbar, UserChip, WorkspaceShell} from '../../index';
import {
  VENUE_BREADCRUMB,
  VENUE_NAV,
  VENUE_USER,
  VENUE_WORKSPACE_NAME,
} from '../fixtures/partner_workspace';

interface VenueFrameProps {
  /** Id of the current nav item, from `VENUE_NAV`. */
  currentId: string;
  /** Topbar date and time with the time zone label. */
  dateTime: string;
  children: ReactNode;
}

/** Does nothing; the kitchen-sink has no session to end. */
function signOut(): void {}

/** Renders a venue workspace page inside the desktop shell. */
export function VenueFrame({currentId, dateTime, children}: VenueFrameProps) {
  return (
    <WorkspaceShell
      sidebar={
        <Sidebar
          workspaceName={VENUE_WORKSPACE_NAME}
          items={VENUE_NAV}
          currentId={currentId}
          user={
            <UserChip
              name={VENUE_USER.name}
              role={VENUE_USER.role}
              badge={<Badge tone="neutral">示意資料</Badge>}
            />
          }
          onSignOut={signOut}
        />
      }
      topbar={<Topbar breadcrumb={VENUE_BREADCRUMB} dateTime={dateTime} />}
    >
      {children}
    </WorkspaceShell>
  );
}
