/**
 * @fileoverview Session use-cases: the one path that starts a session
 * (ADR-0001), ending it, and resolving a session token into an actor allowed
 * into a workspace. Every call re-reads the session and account and asks the
 * domain rule again; nothing is cached. Every refusal writes one AuditLog
 * entry (PRD 7 SEC-01). Tickets 03 and 10 put credentials in front of `start`
 * and extend the audited flows.
 */

import {createHash} from 'node:crypto';

import type {ActiveSessionRecord, Database} from '@pokernext/db';
import {
  decideSessionEnd,
  decideSessionStart,
  decideWorkspaceEntry,
  type HostKind,
  type SessionEndRefusal,
  type SessionStartRefusal,
  type Workspace,
  type WorkspaceEntryDecision,
  type WorkspaceEntryRefusal,
} from '@pokernext/domain';
import type {Clock} from '@pokernext/ports';

import {type AccountSummary, toAccountSummary} from './accounts';
import {createAuditTrail} from './audit_log';
import {
  type AccountId,
  issueSessionToken,
  storedAccountId,
  type SessionToken,
} from './identifiers';

/** Asks to start a session for an account on a host. */
export interface StartSessionRequest {
  readonly accountId: AccountId;
  readonly host: HostKind;
}

/** A session was started; the token goes into that host's cookie only. */
export interface SessionStarted {
  readonly status: 'started';
  /** Opaque bearer token; only its hash is stored. */
  readonly token: SessionToken;
  readonly account: AccountSummary;
  readonly startedAt: Date;
}

/** No session was started. */
export interface SessionStartRefused {
  readonly status: 'refused';
  readonly reason: SessionStartRefusal | 'accountNotFound';
}

/** Asks to end the session behind a token on a host. */
export interface EndSessionRequest {
  /** The cookie token, or undefined when the request carries none. */
  readonly token?: SessionToken;
  readonly host: HostKind;
}

/** Whether the call ended an active session. */
export interface SessionEndOutcome {
  readonly status: 'ended' | 'notActive';
}

/** The session exists but this request may not end it. */
export interface SessionEndRefused {
  readonly status: 'refused';
  readonly reason: SessionEndRefusal;
}

/** Asks whether the session behind a token may enter a workspace. */
export interface ResolveSessionRequest {
  /** The cookie token, or undefined when the request carries none. */
  readonly token?: SessionToken;
  readonly host: HostKind;
  readonly workspace: Workspace;
}

/** Who is acting in an allowed workspace request. */
export interface WorkspaceActorSummary {
  readonly accountId: AccountId;
  readonly kind: AccountSummary['kind'];
  readonly displayName: string;
  readonly roleLabel: string;
  readonly workspace: Workspace;
}

/** The session may enter the workspace. */
export interface WorkspaceEntryAllowed {
  readonly status: 'allowed';
  readonly actor: WorkspaceActorSummary;
}

/** The session may not enter the workspace. */
export interface WorkspaceEntryRefused {
  readonly status: 'refused';
  readonly reason: WorkspaceEntryRefusal | 'noSession';
}

/** Asks where the session behind a token belongs on a host. */
export interface SessionHomeRequest {
  readonly token?: SessionToken;
  readonly host: HostKind;
}

/** The session on this host belongs to a workspace. */
export interface SignedIn {
  readonly status: 'signedIn';
  readonly workspace: Workspace;
}

/** There is no usable session on this host. */
export interface SignedOut {
  readonly status: 'signedOut';
}

/** The session use-cases. */
export interface SessionUseCases {
  /** Starts a session for an account on a host, if the account may sign in there. */
  start(
    request: StartSessionRequest,
  ): Promise<SessionStarted | SessionStartRefused>;
  /** Ends the active session behind the token, if this host may end it. */
  end(
    request: EndSessionRequest,
  ): Promise<SessionEndOutcome | SessionEndRefused>;
  /** Resolves a token into an actor allowed into the workspace, or a refusal. */
  resolve(
    request: ResolveSessionRequest,
  ): Promise<WorkspaceEntryAllowed | WorkspaceEntryRefused>;
  /**
   * Tells which workspace the session on this host may enter. It grants
   * nothing and only words a redirect or a refusal page, so a signed-out
   * answer is not audited; the refused workspace request itself is.
   */
  home(request: SessionHomeRequest): Promise<SignedIn | SignedOut>;
}

/** Builds the session use-cases over their collaborators. */
export function createSessionUseCases(
  database: Database,
  clock: Clock,
): SessionUseCases {
  const audit = createAuditTrail(database, clock);

  function findActive(
    token: SessionToken | undefined,
  ): Promise<ActiveSessionRecord | undefined> {
    return token === undefined
      ? Promise.resolve(undefined)
      : database.sessions.findActive(hashToken(token));
  }

  return {
    async start({accountId, host}) {
      const target = `account:${accountId}`;
      const record = await database.accounts.findById(accountId);
      if (record === undefined) {
        await audit.recordRefusal({
          host,
          action: 'session.start',
          target,
          reason: 'accountNotFound',
        });
        return {status: 'refused', reason: 'accountNotFound'};
      }
      const decision = decideSessionStart(record, host);
      if (!decision.allowed) {
        await audit.recordRefusal({
          actorAccountId: accountId,
          host,
          action: 'session.start',
          target,
          reason: decision.reason,
        });
        return {status: 'refused', reason: decision.reason};
      }
      const token = issueSessionToken();
      const startedAt = clock.now();
      await database.sessions.insert({
        tokenHash: hashToken(token),
        accountId: record.id,
        hostKind: host,
        createdAt: startedAt,
      });
      return {
        status: 'started',
        token,
        account: toAccountSummary(record),
        startedAt,
      };
    },

    async end({token, host}) {
      const active = await findActive(token);
      if (token === undefined || active === undefined) {
        return {status: 'notActive'};
      }
      const decision = decideSessionEnd({
        sessionHost: active.session.hostKind,
        requestHost: host,
      });
      if (!decision.allowed) {
        await audit.recordRefusal({
          actorAccountId: storedAccountId(active.account.id),
          host,
          action: 'session.end',
          target: `session:${active.session.id}`,
          reason: decision.reason,
        });
        return {status: 'refused', reason: decision.reason};
      }
      const ended = await database.sessions.end({
        tokenHash: hashToken(token),
        hostKind: host,
        endedAt: clock.now(),
      });
      return {status: ended ? 'ended' : 'notActive'};
    },

    async resolve({token, host, workspace}) {
      const refuse = async (
        reason: WorkspaceEntryRefused['reason'],
        actorAccountId?: AccountId,
      ): Promise<WorkspaceEntryRefused> => {
        await audit.recordRefusal({
          ...(actorAccountId === undefined ? {} : {actorAccountId}),
          host,
          action: 'workspace.enter',
          target: `workspace:${workspace}`,
          reason,
        });
        return {status: 'refused', reason};
      };
      const active = await findActive(token);
      if (active === undefined) {
        return refuse('noSession');
      }
      const decision = decideEntry(active, host, workspace);
      if (!decision.allowed) {
        return refuse(decision.reason, storedAccountId(active.account.id));
      }
      const {account} = active;
      return {
        status: 'allowed',
        actor: {
          accountId: storedAccountId(account.id),
          kind: account.kind,
          displayName: account.displayName,
          roleLabel: account.roleLabel,
          workspace: account.workspace,
        },
      };
    },

    async home({token, host}) {
      const active = await findActive(token);
      if (active === undefined) {
        return {status: 'signedOut'};
      }
      const {workspace} = active.account;
      return decideEntry(active, host, workspace).allowed
        ? {status: 'signedIn', workspace}
        : {status: 'signedOut'};
    },
  };
}

/** Asks the domain rule whether an active session may enter the workspace. */
function decideEntry(
  active: ActiveSessionRecord,
  host: HostKind,
  workspace: Workspace,
): WorkspaceEntryDecision {
  return decideWorkspaceEntry({
    actor: active.account,
    sessionHost: active.session.hostKind,
    requestHost: host,
    workspace,
  });
}

/** Hashes a token for storage; the token itself is never stored. */
function hashToken(token: SessionToken): string {
  return createHash('sha256').update(token).digest('hex');
}
