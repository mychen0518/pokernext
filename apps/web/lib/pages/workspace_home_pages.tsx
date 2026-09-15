/**
 * @fileoverview One page component per workspace home, re-exported by the
 * route files under `app/(player)` and `app/(work)`.
 */

import {WorkspaceHome} from './workspace_home';

/** `/player` on the player host. */
export function PlayerHomePage() {
  return <WorkspaceHome workspace="player" />;
}

/** `/venue` on the work-account host. */
export function VenueHomePage() {
  return <WorkspaceHome workspace="venue" />;
}

/** `/admin` on the work-account host. */
export function AdminHomePage() {
  return <WorkspaceHome workspace="admin" />;
}

/** `/platform` on the work-account host. */
export function PlatformHomePage() {
  return <WorkspaceHome workspace="platform" />;
}

/** `/staff` on the work-account host. */
export function StaffHomePage() {
  return <WorkspaceHome workspace="staff" />;
}

/** `/agent` on the work-account host. */
export function AgentHomePage() {
  return <WorkspaceHome workspace="agent" />;
}
