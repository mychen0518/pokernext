/**
 * @fileoverview Lightweight entry point for routing: the six workspaces, the
 * host that serves each, and the local host names and demo port. It
 * re-exports domain constants only and loads no database module, so
 * `apps/web/next.config.ts`, `apps/web/proxy.ts` and demo tooling can import
 * it; dependency-cruiser keeps it that way.
 */

export {
  DEFAULT_DEMO_PORT,
  hostOfWorkspace,
  LOCAL_HOST_NAMES,
  WORKSPACES,
} from '@pokernext/domain';
export type {HostKind, Workspace} from '@pokernext/domain';
