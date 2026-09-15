/**
 * @fileoverview The legal business-operation builder: tests build the state a
 * scenario starts from by calling use-cases, exactly as users would, never by
 * writing tables (spec: 依合法流程建立測試狀態). Each business ticket adds the
 * steps its scenarios need.
 */

import {randomBytes} from 'node:crypto';

import type {App} from '../app';
import type {HealthCheck} from '../health_check';

/** Thrown when a use-case refuses a step, so the precondition does not exist. */
export class PreconditionRefused extends Error {
  constructor(
    readonly step: string,
    readonly outcome: unknown,
  ) {
    super(`Precondition "${step}" was refused: ${JSON.stringify(outcome)}`);
    this.name = 'PreconditionRefused';
  }
}

/** Options for a recorded health check. */
export interface HealthCheckRecordedOptions {
  /** Defaults to a key unique to this call. */
  readonly requestKey?: string;
}

/**
 * Steps that put the application into a state through its use-cases. Every
 * step returns what it created and throws {@link PreconditionRefused} when a
 * rule refuses it.
 */
export class LegalOperations {
  constructor(private readonly app: App) {}

  /** A health check has been recorded. */
  async healthCheckRecorded(
    options: HealthCheckRecordedOptions = {},
  ): Promise<HealthCheck> {
    const outcome = await this.app.healthCheck.record({
      requestKey: options.requestKey ?? uniqueKey('health-check'),
    });
    if (outcome.status === 'rejected') {
      throw new PreconditionRefused('healthCheckRecorded', outcome);
    }
    return outcome.record;
  }
}

/** Starts arranging preconditions on an application: `given(app).…()`. */
export function given(app: App): LegalOperations {
  return new LegalOperations(app);
}

/** Makes an identifier that no other step in the run uses. */
function uniqueKey(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString('hex')}`;
}
