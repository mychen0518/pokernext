/**
 * @fileoverview Who may enter which workspace on which host: the first
 * authorization rule. The player workspace is served on the player host to
 * members; the other five workspaces are served on the work-account host to
 * work accounts, each account only in its own workspace (ADR-0001). Ticket 04
 * extends this with roles, scopes and fields.
 */

/** The six workspaces (CONTEXT.md), by their route ids. */
export type Workspace =
  'player' | 'venue' | 'admin' | 'platform' | 'staff' | 'agent';

/** Every workspace, in CONTEXT.md order. */
export const WORKSPACES: readonly Workspace[] = [
  'player',
  'venue',
  'admin',
  'platform',
  'staff',
  'agent',
];

/**
 * A member (會員) signs in to the player workspace; a work account (工作帳號)
 * signs in to one of the other workspaces.
 */
export type AccountKind = 'member' | 'work';

/** The two hosts: the public player site and the work-account entrance. */
export type HostKind = 'player' | 'work';

/** The part of an account that decides where it may go. */
export interface WorkspaceActor {
  readonly kind: AccountKind;
  /** The workspace the account belongs to. */
  readonly workspace: Workspace;
}

/** Why an account may not start a session on a host. */
export type SessionStartRefusal = 'accountNotAllowedOnHost';

/** Why a session may not enter a workspace. */
export type WorkspaceEntryRefusal =
  // The requested workspace is not served on the host that was asked.
  | 'workspaceNotOnHost'
  // The session was started on the other host.
  | 'sessionFromOtherHost'
  // The account's kind does not sign in on this host.
  | 'accountNotAllowedOnHost'
  // The account belongs to another workspace.
  | 'otherWorkspace';

/** The action may go ahead. */
export interface Allowed {
  readonly allowed: true;
}

/** The action is refused, with the first rule that refused it. */
export interface Refused<Reason extends string> {
  readonly allowed: false;
  readonly reason: Reason;
}

/** Whether an account may start a session on a host. */
export type SessionStartDecision = Allowed | Refused<SessionStartRefusal>;

/** Whether a session may enter a workspace. */
export type WorkspaceEntryDecision = Allowed | Refused<WorkspaceEntryRefusal>;

/** Asks whether a session may enter a workspace on the host it came to. */
export interface WorkspaceEntryRequest {
  readonly actor: WorkspaceActor;
  /** The host the session was started on. */
  readonly sessionHost: HostKind;
  /** The host the request arrived on. */
  readonly requestHost: HostKind;
  readonly workspace: Workspace;
}

/** Returns the host a workspace is served on. */
export function hostOfWorkspace(workspace: Workspace): HostKind {
  // ADR-0001: 玩家工作區與以工作帳號登入的其餘五個工作區以不同 host 提供。
  return workspace === 'player' ? 'player' : 'work';
}

/** Returns the host an account of this kind signs in on. */
export function hostOfAccountKind(kind: AccountKind): HostKind {
  // CONTEXT.md: 會員登入玩家工作區；工作帳號用於玩家工作區以外的工作區。
  return kind === 'member' ? 'player' : 'work';
}

/** Returns the account kind that belongs to a workspace. */
export function accountKindOfWorkspace(workspace: Workspace): AccountKind {
  return hostOfWorkspace(workspace) === 'player' ? 'member' : 'work';
}

/** Decides whether an account may start a session on a host. */
export function decideSessionStart(
  actor: WorkspaceActor,
  host: HostKind,
): SessionStartDecision {
  if (hostOfAccountKind(actor.kind) !== host) {
    return {allowed: false, reason: 'accountNotAllowedOnHost'};
  }
  return {allowed: true};
}

/**
 * Decides whether a session may enter a workspace. Called on every request
 * that renders a workspace, never cached (PRD 2.1 權限判斷原則：每次查詢都判斷，
 * 未授權即拒絕).
 */
export function decideWorkspaceEntry(
  request: WorkspaceEntryRequest,
): WorkspaceEntryDecision {
  const {actor, sessionHost, requestHost, workspace} = request;
  if (hostOfWorkspace(workspace) !== requestHost) {
    return {allowed: false, reason: 'workspaceNotOnHost'};
  }
  if (sessionHost !== requestHost) {
    return {allowed: false, reason: 'sessionFromOtherHost'};
  }
  const startDecision = decideSessionStart(actor, requestHost);
  if (!startDecision.allowed) {
    return startDecision;
  }
  if (actor.workspace !== workspace) {
    return {allowed: false, reason: 'otherWorkspace'};
  }
  return {allowed: true};
}
