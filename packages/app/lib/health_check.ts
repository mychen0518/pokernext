/**
 * @fileoverview Health-check use-cases: the thinnest vertical slice through the
 * use-case layer, the clock and the real database. A request key makes the
 * write idempotent, like the operation ids of every business submission
 * (spec: 重試語意).
 */

import type {Database} from '@pokernext/db';
import type {Clock} from '@pokernext/ports';

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
  readonly record: HealthCheck;
}

/** The request was refused and nothing was stored. */
export interface HealthCheckRejected {
  readonly status: 'rejected';
  readonly reason: 'invalidRequestKey';
}

/** Narrows a listing of health checks. */
export interface ListHealthChecksRequest {
  readonly requestKey?: string;
}

/** The health-check use-cases. */
export interface HealthCheckUseCases {
  /** Records a health check once per request key and reads it back. */
  record(
    request: RecordHealthCheckRequest,
  ): Promise<HealthCheckRecorded | HealthCheckRejected>;
  /** Lists recorded health checks, oldest first. */
  list(request?: ListHealthChecksRequest): Promise<HealthCheck[]>;
}

/** Builds the health-check use-cases over their collaborators. */
export function createHealthCheckUseCases(
  database: Database,
  clock: Clock,
): HealthCheckUseCases {
  return {
    async record({requestKey}) {
      if (!isValidRequestKey(requestKey)) {
        return {status: 'rejected', reason: 'invalidRequestKey'};
      }
      const {record, created} = await database.healthChecks.recordOnce({
        requestKey,
        recordedAt: clock.now(),
      });
      return {status: created ? 'recorded' : 'alreadyRecorded', record};
    },

    async list(request = {}) {
      return database.healthChecks.list({requestKey: request.requestKey});
    },
  };
}

function isValidRequestKey(requestKey: unknown): requestKey is string {
  return (
    typeof requestKey === 'string' &&
    requestKey.trim() !== '' &&
    requestKey.length <= MAX_REQUEST_KEY_LENGTH
  );
}
