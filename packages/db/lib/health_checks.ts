/**
 * @fileoverview Persistence of health-check records, keyed by request key.
 */

import {asc, eq} from 'drizzle-orm';
import type {NodePgDatabase} from 'drizzle-orm/node-postgres';

import {healthChecks} from './schema';

/** A stored health check. */
export interface HealthCheckRecord {
  readonly requestKey: string;
  readonly recordedAt: Date;
}

/** The stored record for a request key, and whether this call created it. */
export interface HealthCheckRecording {
  readonly record: HealthCheckRecord;
  readonly created: boolean;
}

/** Narrows a listing of health checks. */
export interface HealthCheckFilter {
  readonly requestKey?: string;
}

/** Reads and writes health-check records. */
export interface HealthCheckStore {
  /**
   * Stores the record unless one with the same request key exists, and
   * returns whichever record is stored for that key.
   */
  recordOnce(record: HealthCheckRecord): Promise<HealthCheckRecording>;
  /** Lists stored records, oldest first. */
  list(filter?: HealthCheckFilter): Promise<HealthCheckRecord[]>;
}

/** Creates the health-check store over a Drizzle connection. */
export function createHealthCheckStore(db: NodePgDatabase): HealthCheckStore {
  const columns = {
    requestKey: healthChecks.requestKey,
    recordedAt: healthChecks.recordedAt,
  };
  return {
    async recordOnce(record) {
      // The unique constraint decides the race: a losing insert waits for the
      // winner to commit, inserts nothing, and then reads the winner's row.
      const [inserted] = await db
        .insert(healthChecks)
        .values(record)
        .onConflictDoNothing({target: healthChecks.requestKey})
        .returning(columns);
      if (inserted !== undefined) {
        return {record: inserted, created: true};
      }
      const [existing] = await db
        .select(columns)
        .from(healthChecks)
        .where(eq(healthChecks.requestKey, record.requestKey));
      if (existing === undefined) {
        throw new Error(
          `Health check ${record.requestKey} conflicted but cannot be read back.`,
        );
      }
      return {record: existing, created: false};
    },

    async list(filter = {}) {
      return db
        .select(columns)
        .from(healthChecks)
        .where(
          filter.requestKey === undefined
            ? undefined
            : eq(healthChecks.requestKey, filter.requestKey),
        )
        .orderBy(asc(healthChecks.recordedAt), asc(healthChecks.id));
    },
  };
}
