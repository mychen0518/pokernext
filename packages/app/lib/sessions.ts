/**
 * @fileoverview Session use-cases: the one path that starts a session
 * (ADR-0001), ending it, and resolving a session token into an actor allowed
 * into a workspace. Every resolve re-reads the session and account and asks
 * the domain rule again; nothing is cached. Ticket 03 adds the AuditLog entry
 * on refusal; tickets 03 and 10 put credentials in front of `start`.
 */

import {createHash, randomBytes} from 'node:crypto';

import type {Database} from '@pokernext/db';
import {
  decideSessionStart,
  decideWorkspaceEntry,
  type HostKind,
  type SessionStartRefusal,
  type Workspace,
  type WorkspaceEntryRefusal,
} from '@pokernext/domain';
import type {Clock} from '@pokernext/ports';

import {type AccountSummary, toAccountSummary} from './accounts';

/** Bytes of randomness in a session token. */
const TOKEN_BYTES = 32;
/** Accepts only tokens shaped like the ones {@link SessionUseCases.start} issues. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** Accepts only account ids shaped like a UUID. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Asks to start a session for an account on a host. */
export interface StartSessionRequest {
  readonly accountId: string;
  readonly host: HostKind;
}

/** A session was started; the token goes into that host's cookie only. */
export interface SessionStarted {
  readonly status: 'started';
  /** Opaque bearer token; only its hash is stored. */
  readonly token: string;
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
  readonly token?: string;
  readonly host: HostKind;
}

/** Whether the call ended an active session. */
export interface SessionEndOutcome {
  readonly status: 'ended' | 'notActive';
}

/** Asks whether the session behind a token may enter a workspace. */
export interface ResolveSessionRequest {
  /** The cookie token, or undefined when the request carries none. */
  readonly token?: string;
  readonly host: HostKind;
  readonly workspace: Workspace;
}

/** Who is acting in an allowed workspace request. */
export interface WorkspaceActorSummary {
  readonly accountId: string;
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
  readonly token?: string;
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
  /** Ends the active session behind the token on that host. */
  end(request: EndSessionRequest): Promise<SessionEndOutcome>;
  /** Resolves a token into an actor allowed into the workspace, or a refusal. */
  resolve(
    request: ResolveSessionRequest,
  ): Promise<WorkspaceEntryAllowed | WorkspaceEntryRefused>;
  /** Tells which workspace the session on this host may enter. */
  home(request: SessionHomeRequest): Promise<SignedIn | SignedOut>;
}

/** Builds the session use-cases over their collaborators. */
export function createSessionUseCases(
  database: Database,
  clock: Clock,
): SessionUseCases {
  async function findActive(token: string | undefined) {
    if (token === undefined || !TOKEN_PATTERN.test(token)) {
      return undefined;
    }
    return database.sessions.findActive(hashToken(token));
  }

  return {
    async start({accountId, host}) {
      const record = UUID_PATTERN.test(accountId)
        ? await database.accounts.findById(accountId)
        : undefined;
      if (record === undefined) {
        return {status: 'refused', reason: 'accountNotFound'};
      }
      const decision = decideSessionStart(record, host);
      if (!decision.allowed) {
        return {status: 'refused', reason: decision.reason};
      }
      const token = randomBytes(TOKEN_BYTES).toString('base64url');
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
      if (token === undefined || !TOKEN_PATTERN.test(token)) {
        return {status: 'notActive'};
      }
      const ended = await database.sessions.end({
        tokenHash: hashToken(token),
        hostKind: host,
        endedAt: clock.now(),
      });
      return {status: ended ? 'ended' : 'notActive'};
    },

    async resolve({token, host, workspace}) {
      const active = await findActive(token);
      if (active === undefined) {
        return {status: 'refused', reason: 'noSession'};
      }
      const {session, account} = active;
      const decision = decideWorkspaceEntry({
        actor: account,
        sessionHost: session.hostKind,
        requestHost: host,
        workspace,
      });
      if (!decision.allowed) {
        return {status: 'refused', reason: decision.reason};
      }
      return {
        status: 'allowed',
        actor: {
          accountId: account.id,
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
      const decision = decideWorkspaceEntry({
        actor: active.account,
        sessionHost: active.session.hostKind,
        requestHost: host,
        workspace: active.account.workspace,
      });
      return decision.allowed
        ? {status: 'signedIn', workspace: active.account.workspace}
        : {status: 'signedOut'};
    },
  };
}

/** Hashes a token for storage; the token itself is never stored. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
