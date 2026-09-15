/**
 * @fileoverview Health-check use-cases: the thinnest vertical slice through the
 * use-case layer, the clock and the real database. A request key makes the
 * write idempotent, like the operation ids of every business submission
 * (spec: 重試語意).
 *
 * The public probe answers anyone: it stores a record with a key of its own,
 * reads that record back and reports only whether the round trip worked. It
 * reads no stored record other than its own and reveals nothing about any
 * member, account or operation, so there is no actor to authorize. Listing
 * recorded health checks is not a use-case; tests observe records through
 * the test app.
 */

import {randomUUID} from 'node:crypto';

import type {HealthCheckRecord} from '@pokernext/db';

import type {AppDependencies} from './app_dependencies';

/** The longest request key accepted. */
const MAX_REQUEST_KEY_LENGTH = 200;

/** A recorded health check as the application reports it. */
export interface HealthCheck {
  readonly requestKey: string;
  readonly recordedAt: Date;
}

/** Asks to record a health check. */
export interface RecordHealthCheckRequest {
  /** Identifies the operation; resending the same key records nothing new. */
  readonly requestKey: string;
}

/** The health check is stored: by this call, or by an earlier one. */
export interface HealthCheckRecorded {
  readonly status: 'recorded' | 'alreadyRecorded';
  /** The record as read back from the database. */
  readonly record: HealthCheck;
}

/** The request was refused and nothing was stored. */
export interface HealthCheckRejected {
  readonly status: 'rejected';
  readonly reason: 'invalidRequestKey';
}

/** The database accepted a write and returned it on reading back. */
export interface HealthProbePassed {
  readonly status: 'healthy';
  readonly checkedAt: Date;
}

/** The write or the read-back failed. */
export interface HealthProbeFailed {
  readonly status: 'unhealthy';
}

/** The health-check use-cases. */
export interface HealthCheckUseCases {
  /** Records a health check once per request key and reads it back. */
  record(
    request: RecordHealthCheckRequest,
  ): Promise<HealthCheckRecorded | HealthCheckRejected>;
  /**
   * Writes a new health check, reads it back and reports only whether that
   * round trip worked; never throws.
   */
  probe(): Promise<HealthProbePassed | HealthProbeFailed>;
}

/** Builds the health-check use-cases over their collaborators. */
export function createHealthCheckUseCases(
  dependencies: AppDependencies,
): HealthCheckUseCases {
  const {database, clock} = dependencies;

  async function recordAndReadBack(
    requestKey: string,
    recordedAt: Date,
  ): Promise<HealthCheckRecorded> {
    const {created} = await database.healthChecks.recordOnce({
      requestKey,
      recordedAt,
    });
    const [record] = await database.healthChecks.list({requestKey});
    if (record === undefined) {
      throw new Error(`Health check ${requestKey} was stored but not found.`);
    }
    return {status: created ? 'recorded' : 'alreadyRecorded', record};
  }

  return {
    async record({requestKey}) {
      if (!isValidRequestKey(requestKey)) {
        return {status: 'rejected', reason: 'invalidRequestKey'};
      }
      return recordAndReadBack(requestKey, clock.now());
    },

    async probe() {
      try {
        const checkedAt = clock.now();
        // The same instant is written and compared: reading the clock twice
        // would differ by a millisecond on the system clock.
        const {status, record} = await recordAndReadBack(
          `probe-${randomUUID()}`,
          checkedAt,
        );
        return status === 'recorded' && sameInstant(record, checkedAt)
          ? {status: 'healthy', checkedAt}
          : {status: 'unhealthy'};
      } catch {
        return {status: 'unhealthy'};
      }
    },
  };
}

function sameInstant(record: HealthCheckRecord, instant: Date): boolean {
  return record.recordedAt.getTime() === instant.getTime();
}

function isValidRequestKey(requestKey: unknown): requestKey is string {
  return (
    typeof requestKey === 'string' &&
    requestKey.trim() !== '' &&
    requestKey.length <= MAX_REQUEST_KEY_LENGTH
  );
}
