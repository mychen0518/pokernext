/**
 * @fileoverview Persistence of accounts and their sessions. Rules about who
 * may start or use a session live in `packages/domain` and are applied by the
 * `packages/app` use-cases; this file only stores and reads rows.
 */

import {and, asc, eq, isNull} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

import {accounts, sessions} from './schema';

/** The kinds the `accounts_kind_known` constraint accepts. */
export type StoredAccountKind = 'member' | 'work';

/** The workspaces the `accounts_workspace_known` constraint accepts. */
export type StoredWorkspace =
  'player' | 'venue' | 'admin' | 'platform' | 'staff' | 'agent';

/** The hosts the `sessions_host_kind_known` constraint accepts. */
export type StoredHostKind = 'player' | 'work';

/** A stored account. */
export interface AccountRecord {
  readonly id: string;
  readonly kind: StoredAccountKind;
  readonly displayName: string;
  readonly workspace: StoredWorkspace;
  readonly roleLabel: string;
  readonly createdAt: Date;
}

/** A stored session, identified by the hash of its token. */
export interface SessionRecord {
  readonly tokenHash: string;
  readonly accountId: string;
  readonly hostKind: StoredHostKind;
  readonly createdAt: Date;
}

/** An active session together with its account. */
export interface ActiveSessionRecord {
  readonly session: SessionRecord;
  readonly account: AccountRecord;
}

/** Asks to end the active session with this token hash on this host. */
export interface SessionEnding {
  readonly tokenHash: string;
  readonly hostKind: StoredHostKind;
  readonly endedAt: Date;
}

/** Reads and writes accounts. */
export interface AccountStore {
  /**
   * Stores the account unless one with the same id exists; tells whether
   * this call stored it.
   */
  insertIfAbsent(account: AccountRecord): Promise<boolean>;
  /** Reads one account by id. */
  findById(id: string): Promise<AccountRecord | undefined>;
  /** Lists every account, oldest first. */
  list(): Promise<AccountRecord[]>;
}

/** Reads and writes sessions. */
export interface SessionStore {
  /** Stores a new active session. */
  insert(session: SessionRecord): Promise<void>;
  /** Reads the session with this token hash if it has not ended. */
  findActive(tokenHash: string): Promise<ActiveSessionRecord | undefined>;
  /**
   * Ends the matching active session; tells whether one was ended by this
   * call.
   */
  end(ending: SessionEnding): Promise<boolean>;
}

const ACCOUNT_COLUMNS = {
  id: accounts.id,
  kind: accounts.kind,
  displayName: accounts.displayName,
  workspace: accounts.workspace,
  roleLabel: accounts.roleLabel,
  createdAt: accounts.createdAt,
};

/** An account row as Drizzle returns it, before narrowing its enums. */
interface AccountRow {
  readonly id: string;
  readonly kind: string;
  readonly displayName: string;
  readonly workspace: string;
  readonly roleLabel: string;
  readonly createdAt: Date;
}

/** Creates the account store over a Drizzle connection. */
export function createAccountStore(db: NodePgDatabase): AccountStore {
  return {
    async insertIfAbsent(account) {
      const inserted = await db
        .insert(accounts)
        .values(account)
        .onConflictDoNothing({target: accounts.id})
        .returning({id: accounts.id});
      return inserted.length > 0;
    },

    async findById(id) {
      const [row] = await db
        .select(ACCOUNT_COLUMNS)
        .from(accounts)
        .where(eq(accounts.id, id));
      return row === undefined ? undefined : toAccountRecord(row);
    },

    async list() {
      const rows = await db
        .select(ACCOUNT_COLUMNS)
        .from(accounts)
        .orderBy(asc(accounts.createdAt), asc(accounts.id));
      return rows.map(toAccountRecord);
    },
  };
}

/** Creates the session store over a Drizzle connection. */
export function createSessionStore(db: NodePgDatabase): SessionStore {
  return {
    async insert(session) {
      await db.insert(sessions).values(session);
    },

    async findActive(tokenHash) {
      const [row] = await db
        .select({
          tokenHash: sessions.tokenHash,
          accountId: sessions.accountId,
          hostKind: sessions.hostKind,
          createdAt: sessions.createdAt,
          account: ACCOUNT_COLUMNS,
        })
        .from(sessions)
        .innerJoin(accounts, eq(sessions.accountId, accounts.id))
        .where(
          and(eq(sessions.tokenHash, tokenHash), isNull(sessions.endedAt)),
        );
      if (row === undefined) {
        return undefined;
      }
      return {
        session: {
          tokenHash: row.tokenHash,
          accountId: row.accountId,
          // Safe: the sessions_host_kind_known constraint admits only these.
          hostKind: row.hostKind as StoredHostKind,
          createdAt: row.createdAt,
        },
        account: toAccountRecord(row.account),
      };
    },

    async end({tokenHash, hostKind, endedAt}) {
      const ended = await db
        .update(sessions)
        .set({endedAt})
        .where(
          and(
            eq(sessions.tokenHash, tokenHash),
            eq(sessions.hostKind, hostKind),
            isNull(sessions.endedAt),
          ),
        )
        .returning({id: sessions.id});
      return ended.length > 0;
    },
  };
}

function toAccountRecord(row: AccountRow): AccountRecord {
  return {
    ...row,
    // Safe: the accounts_kind_known constraint admits only these values.
    kind: row.kind as StoredAccountKind,
    // Safe: the accounts_workspace_known constraint admits only these values.
    workspace: row.workspace as StoredWorkspace,
  };
}
