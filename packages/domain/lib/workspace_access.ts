/**
 * @fileoverview Who may enter which workspace on which host: the first
 * authorization rule. The player workspace is served on the player host to
 * members; the other five workspaces are served on the work-account host to
 * work accounts, each account only in its own workspace. ADR-0001 records the
 * host split; each rule below cites the PRD section it implements. Ticket 04
 * extends this with roles, scopes and fields.
 */

/** The six workspaces (CONTEXT.md), by their route ids. */
export type Workspace =
  'player' | 'venue' | 'admin' | 'platform' | 'staff' | 'agent';

/** Every workspace, in CONTEXT.md order. */
// PRD 2 用戶與權限原則（角色表）：正式會員、天城 Venue User、管理者、Platform admin、
// Host／Reception、外部 Agent 各有自己的工作範圍；財務與稽核是管理工作區內的角色。
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

/**
 * The local development name of each host. Chromium resolves `*.localhost`
 * to loopback, so both hosts reach one local server (ADR-0001). Deployed
 * hosts come from configuration, not from here.
 */
export const LOCAL_HOST_NAMES: Readonly<Record<HostKind, string>> = {
  player: 'player.localhost',
  work: 'work.localhost',
};

/** The port `pnpm demo` serves both local hosts on unless told otherwise. */
export const DEFAULT_DEMO_PORT = 3000;

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

/** Why a session may not be ended from where the request came. */
export type SessionEndRefusal = 'sessionFromOtherHost';

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

/** Whether a session may be ended by this request. */
export type SessionEndDecision = Allowed | Refused<SessionEndRefusal>;

/** Asks whether a session may enter a workspace on the host it came to. */
export interface WorkspaceEntryRequest {
  readonly actor: WorkspaceActor;
  /** The host the session was started on. */
  readonly sessionHost: HostKind;
  /** The host the request arrived on. */
  readonly requestHost: HostKind;
  readonly workspace: Workspace;
}

/**
 * Asks whether the holder of a session token may end that session from the
 * host the request arrived on.
 */
export interface SessionEndRequest {
  /** The host the session was started on. */
  readonly sessionHost: HostKind;
  /** The host the request arrived on. */
  readonly requestHost: HostKind;
}

/** Returns the host a workspace is served on. */
export function hostOfWorkspace(workspace: Workspace): HostKind {
  // PRD 3.5 MEM-05 玩家日常登入與工作密碼＋TOTP 分開、15.8 R15-08-02 工作帳號
  // 密碼＋TOTP：玩家工作區與其餘五個工作區是兩個登入入口（ADR-0001 以不同 host
  // 提供，R19-01 各端入口分別盤點防護）。
  return workspace === 'player' ? 'player' : 'work';
}

/** Returns the host an account of this kind signs in on. */
export function hostOfAccountKind(kind: AccountKind): HostKind {
  // PRD 15.8 R15-08-01 工作端員工、Agent、天城人員統一邀請授權，玩家不能自行選
  // 工作角色；3.5 MEM-05 會員以本人手機／Email 日常登入。
  return kind === 'member' ? 'player' : 'work';
}

/** Returns the account kind that belongs to a workspace. */
export function accountKindOfWorkspace(workspace: Workspace): AccountKind {
  // PRD 16.11 R16-11-01 工作人員本人同時為玩家時權限不合併：玩家工作區屬會員，
  // 其餘工作區屬工作帳號。
  return hostOfWorkspace(workspace) === 'player' ? 'member' : 'work';
}

/** Decides whether an account may start a session on a host. */
export function decideSessionStart(
  actor: WorkspaceActor,
  host: HostKind,
): SessionStartDecision {
  // PRD 2.1 未授權即拒絕；16.11 R16-11-01 會員與工作帳號權限不合併，不能以另一
  // 種帳號的入口登入。
  if (hostOfAccountKind(actor.kind) !== host) {
    return {allowed: false, reason: 'accountNotAllowedOnHost'};
  }
  return {allowed: true};
}

/**
 * Decides whether a session may enter a workspace. Called on every request
 * that renders a workspace, never cached.
 */
export function decideWorkspaceEntry(
  request: WorkspaceEntryRequest,
): WorkspaceEntryDecision {
  // PRD 2.1 權限判斷原則（SEC-03）：每次查詢都判斷，未授權即拒絕，不只隱藏按鈕。
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

/**
 * Decides whether a session may be ended by a request. Only the holder of the
 * session token can ask, and only on the host the session was started on.
 */
export function decideSessionEnd(
  request: SessionEndRequest,
): SessionEndDecision {
  // PRD 2.1 未授權即拒絕；15.8 R15-08-02 登入本人專用、禁止共用：一個 host 的
  // session 只在該 host 上由持有者結束，另一個 host 的請求不能結束它。
  if (request.sessionHost !== request.requestHost) {
    return {allowed: false, reason: 'sessionFromOtherHost'};
  }
  return {allowed: true};
}
