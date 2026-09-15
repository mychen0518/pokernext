/**
 * @fileoverview Persistence of the AuditLog. The store is append-only: it can
 * add an entry and read entries back, and has no way to change or remove one
 * (ticket 03 extends the table and its flows).
 */

import type {HostKind} from '@pokernext/domain';
import {asc} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

import {auditLog} from './schema';

/** Whether the audited decision let the request go ahead. */
export type AuditOutcome = 'allowed' | 'refused';

/** One AuditLog entry. */
export interface AuditEntryRecord {
  /** When the application clock says it happened. */
  readonly occurredAt: Date;
  /** Who acted; omitted when nobody was identified. */
  readonly actorAccountId?: string;
  readonly hostKind: HostKind;
  /** What was attempted, such as `workspace.enter`. */
  readonly action: string;
  /** What it was attempted on, such as `workspace:venue`. */
  readonly target: string;
  readonly outcome: AuditOutcome;
  /** The rule's reason for a refusal. */
  readonly reason?: string;
}

/** Appends to and reads the AuditLog; nothing can change an entry. */
export interface AuditLogStore {
  /** Adds one entry. */
  append(entry: AuditEntryRecord): Promise<void>;
  /** Lists every entry, oldest first. */
  list(): Promise<AuditEntryRecord[]>;
}

/** Creates the AuditLog store over a Drizzle connection. */
export function createAuditLogStore(db: NodePgDatabase): AuditLogStore {
  return {
    async append(entry) {
      await db.insert(auditLog).values({
        occurredAt: entry.occurredAt,
        actorAccountId: entry.actorAccountId ?? null,
        hostKind: entry.hostKind,
        action: entry.action,
        target: entry.target,
        outcome: entry.outcome,
        reason: entry.reason ?? null,
      });
    },

    async list() {
      const rows = await db
        .select()
        .from(auditLog)
        .orderBy(asc(auditLog.occurredAt), asc(auditLog.id));
      return rows.map(row => ({
        occurredAt: row.occurredAt,
        ...(row.actorAccountId === null
          ? {}
          : {actorAccountId: row.actorAccountId}),
        // Safe: the audit_log_host_kind_known constraint admits only these.
        hostKind: row.hostKind as HostKind,
        action: row.action,
        target: row.target,
        // Safe: the audit_log_outcome_known constraint admits only these.
        outcome: row.outcome as AuditOutcome,
        ...(row.reason === null ? {} : {reason: row.reason}),
      }));
    },
  };
}
