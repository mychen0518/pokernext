/**
 * @fileoverview Public entry point of the domain core: framework-free business
 * and authorization rules. Each business ticket adds its own rules here via
 * TDD (ADR-0001); nothing is ported ahead of time.
 */

export {
  accountKindOfWorkspace,
  DEFAULT_DEMO_PORT,
  decideSessionEnd,
  decideSessionStart,
  decideWorkspaceEntry,
  hostOfAccountKind,
  hostOfWorkspace,
  LOCAL_HOST_NAMES,
  WORKSPACES,
} from './lib/workspace_access';
export type {
  AccountKind,
  Allowed,
  HostKind,
  Refused,
  SessionEndDecision,
  SessionEndRefusal,
  SessionEndRequest,
  SessionStartDecision,
  SessionStartRefusal,
  Workspace,
  WorkspaceActor,
  WorkspaceEntryDecision,
  WorkspaceEntryRefusal,
  WorkspaceEntryRequest,
} from './lib/workspace_access';
