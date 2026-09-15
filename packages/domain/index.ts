/**
 * @fileoverview Public entry point of the domain core: framework-free business
 * and authorization rules. Each business ticket adds its own rules here via
 * TDD (ADR-0001); nothing is ported ahead of time.
 */

export {
  accountKindOfWorkspace,
  decideSessionStart,
  decideWorkspaceEntry,
  hostOfAccountKind,
  hostOfWorkspace,
  WORKSPACES,
} from './lib/workspace_access';
export type {
  AccountKind,
  Allowed,
  HostKind,
  Refused,
  SessionStartDecision,
  SessionStartRefusal,
  Workspace,
  WorkspaceActor,
  WorkspaceEntryDecision,
  WorkspaceEntryRefusal,
  WorkspaceEntryRequest,
} from './lib/workspace_access';
