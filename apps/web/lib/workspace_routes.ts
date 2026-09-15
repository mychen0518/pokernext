/**
 * @fileoverview How each workspace is presented: its home path and the names
 * people see (CONTEXT.md). The set of workspaces and the host that serves
 * each come from the domain through `@pokernext/app/routing`; a workspace
 * missing here is a compile error. Routing only; who may enter is decided by
 * `app.sessions.resolve` on every request.
 */

import {type Workspace, WORKSPACES} from '@pokernext/app/routing';

/** The home path and names of one workspace. */
export interface WorkspaceRoute {
  /** Home path, also the first path segment of every page in it. */
  readonly path: string;
  /** CONTEXT.md name, such as 場館工作區. */
  readonly name: string;
  /** Topbar overline breadcrumb of desktop workspaces. */
  readonly breadcrumb: string;
}

/** Every workspace's route, in CONTEXT.md order. */
export const WORKSPACE_ROUTES: Readonly<Record<Workspace, WorkspaceRoute>> = {
  player: {
    path: '/player',
    name: '玩家工作區',
    breadcrumb: 'POKERNEXT · PLAYER',
  },
  venue: {
    path: '/venue',
    name: '場館工作區',
    breadcrumb: 'JEJU · PARTNER WORKSPACE',
  },
  admin: {
    path: '/admin',
    name: '管理工作區',
    breadcrumb: 'POKERNEXT · ADMIN WORKSPACE',
  },
  platform: {
    path: '/platform',
    name: '平台治理工作區',
    breadcrumb: 'POKERNEXT · PLATFORM WORKSPACE',
  },
  staff: {
    path: '/staff',
    name: '接待工作區',
    breadcrumb: 'POKERNEXT · RECEPTION',
  },
  agent: {
    path: '/agent',
    name: 'Agent 工作區',
    breadcrumb: 'POKERNEXT · AGENT WORKSPACE',
  },
};

/** Returns the workspace whose pages the path belongs to, if any. */
export function workspaceOfPath(pathname: string): Workspace | undefined {
  const segment = `/${pathname.split('/')[1] ?? ''}`;
  return WORKSPACES.find(
    workspace => WORKSPACE_ROUTES[workspace].path === segment,
  );
}
