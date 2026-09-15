/**
 * @fileoverview The legal business-operation builder: tests build the state a
 * scenario starts from by calling use-cases, exactly as users would, never by
 * writing tables (spec: 依合法流程建立測試狀態). Each business ticket adds the
 * steps its scenarios need.
 */

import {randomBytes} from 'node:crypto';

import type {HostKind, Workspace} from '@pokernext/domain';

import type {AccountSummary} from '../accounts';
import type {DemoAccountsEnsured} from '../demo_accounts';
import type {HealthCheck} from '../health_check';
import type {AccountId} from '../identifiers';
import type {SessionStarted} from '../sessions';
import type {TestApp} from './test_app';

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
  constructor(private readonly app: TestApp) {}

  /**
   * The six demo accounts exist, created by the same implementation as
   * `@pokernext/app/demo`; `created` counts the ones this step added.
   */
  async demoAccountsEnsured(): Promise<DemoAccountsEnsured> {
    return this.app.ensureDemoAccounts();
  }

  /** The demo accounts exist; returns the one in the given workspace. */
  async demoAccount(workspace: Workspace): Promise<AccountSummary> {
    const {accounts} = await this.app.ensureDemoAccounts();
    const account = accounts.find(item => item.workspace === workspace);
    if (account === undefined) {
      throw new PreconditionRefused('demoAccount', {workspace, accounts});
    }
    return account;
  }

  /** A session has been started for the account on the host. */
  async sessionStarted(request: {
    readonly accountId: AccountId;
    readonly host: HostKind;
  }): Promise<SessionStarted> {
    const outcome = await this.app.sessions.start(request);
    if (outcome.status === 'refused') {
      throw new PreconditionRefused('sessionStarted', outcome);
    }
    return outcome;
  }

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
export function given(app: TestApp): LegalOperations {
  return new LegalOperations(app);
}

/** Makes an identifier that no other step in the run uses. */
function uniqueKey(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString('hex')}`;
}
