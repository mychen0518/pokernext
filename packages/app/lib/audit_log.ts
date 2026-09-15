/**
 * @fileoverview Writing the AuditLog from use-cases (PRD 7 SEC-01; PRD 2.1
 * 未授權即拒絕). Every use-case that refuses a request writes one entry in the
 * same call. This first cut covers session and workspace refusals; ticket 03
 * extends the entries and flows.
 */

import type {Database} from '@pokernext/db';
import type {HostKind} from '@pokernext/domain';
import type {Clock} from '@pokernext/ports';

import type {AccountId} from './identifiers';

/** The actions audited so far. */
export type AuditedAction = 'session.start' | 'session.end' | 'workspace.enter';

/** One AuditLog entry as the application reports it. */
export interface AuditEntry {
  readonly occurredAt: Date;
  /** Who acted; omitted when the request identified nobody. */
  readonly actorAccountId?: string;
  readonly host: HostKind;
  readonly action: string;
  /** What was acted on, such as `workspace:venue` or `account:<id>`. */
  readonly target: string;
  readonly outcome: 'allowed' | 'refused';
  readonly reason?: string;
}

/** A refused request, before the clock stamps it. */
export interface Refusal {
  readonly actorAccountId?: AccountId;
  readonly host: HostKind;
  readonly action: AuditedAction;
  readonly target: string;
  readonly reason: string;
}

/** Writes refusals to the AuditLog. */
export interface AuditTrail {
  /** Appends one entry for a refused request, stamped by the clock. */
  recordRefusal(refusal: Refusal): Promise<void>;
}

/** Builds the audit trail over the database and clock. */
export function createAuditTrail(database: Database, clock: Clock): AuditTrail {
  return {
    async recordRefusal({actorAccountId, host, action, target, reason}) {
      await database.auditLog.append({
        occurredAt: clock.now(),
        ...(actorAccountId === undefined ? {} : {actorAccountId}),
        hostKind: host,
        action,
        target,
        outcome: 'refused',
        reason,
      });
    },
  };
}

/** Reads every AuditLog entry, oldest first. */
export async function readAuditEntries(
  database: Database,
): Promise<AuditEntry[]> {
  const records = await database.auditLog.list();
  return records.map(({hostKind, ...entry}) => ({...entry, host: hostKind}));
}
