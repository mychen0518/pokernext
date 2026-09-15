/**
 * @fileoverview Where each workspace lives: its home path, the host that
 * serves it and the names people see (CONTEXT.md). Routing only; who may enter
 * is decided by `app.sessions.resolve` on every request.
 */

import type {HostKind, Workspace} from '@pokernext/app';

/** The route and names of one workspace. */
export interface WorkspaceRoute {
  /** Home path, also the first path segment of every page in it. */
  readonly path: string;
  /** The host whose route group serves it. */
  readonly host: HostKind;
  /** CONTEXT.md name, such as 場館工作區. */
  readonly name: string;
  /** Topbar overline breadcrumb of desktop workspaces. */
  readonly breadcrumb: string;
}

/** Every workspace's route, in CONTEXT.md order. */
export const WORKSPACE_ROUTES: Readonly<Record<Workspace, WorkspaceRoute>> = {
  player: {
    path: '/player',
    host: 'player',
    name: '玩家工作區',
    breadcrumb: 'POKERNEXT · PLAYER',
  },
  venue: {
    path: '/venue',
    host: 'work',
    name: '場館工作區',
    breadcrumb: 'JEJU · PARTNER WORKSPACE',
  },
  admin: {
    path: '/admin',
    host: 'work',
    name: '管理工作區',
    breadcrumb: 'POKERNEXT · ADMIN WORKSPACE',
  },
  platform: {
    path: '/platform',
    host: 'work',
    name: '平台治理工作區',
    breadcrumb: 'POKERNEXT · PLATFORM WORKSPACE',
  },
  staff: {
    path: '/staff',
    host: 'work',
    name: '接待工作區',
    breadcrumb: 'POKERNEXT · RECEPTION',
  },
  agent: {
    path: '/agent',
    host: 'work',
    name: 'Agent 工作區',
    breadcrumb: 'POKERNEXT · AGENT WORKSPACE',
  },
};

/** Returns the workspace whose pages the path belongs to, if any. */
export function workspaceOfPath(pathname: string): Workspace | undefined {
  const segment = `/${pathname.split('/')[1] ?? ''}`;
  for (const [workspace, route] of Object.entries(WORKSPACE_ROUTES)) {
    if (route.path === segment) {
      // Safe: the keys of WORKSPACE_ROUTES are exactly the workspaces.
      return workspace as Workspace;
    }
  }
  return undefined;
}
