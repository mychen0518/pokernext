/**
 * @fileoverview Programmable OCR provider whose delays run on a clock.
 */

import type {
  Clock,
  OcrProvider,
  OcrRecognized,
  OcrRequest,
  OcrUnrecognized,
} from '../../index';
import {InjectedBehaviours, type InjectionOptions} from './injection';

const SECOND = 1_000;
/** PRD 16.19 R16-19-10: after 30 s the player may fill fields by hand. */
const MANUAL_FILL_WINDOW = 30 * SECOND;
/** PRD 16.19 R16-19-10: after 2 min this attempt times out and may be retried. */
const ATTEMPT_TIMEOUT = 120 * SECOND;

/** How one recognition call behaves. */
interface OcrBehaviour {
  /** Milliseconds on the clock before answering; undefined never answers. */
  readonly delay?: number;
  readonly outcome: 'recognized' | 'unrecognized';
  readonly reason?: string;
}

/**
 * Implements {@link OcrProvider} for tests. Answers at once by default; every
 * delay is measured on the injected clock, so nothing ever sleeps.
 */
export class FakeOcrProvider implements OcrProvider {
  private fields: Readonly<Record<string, string>> = {
    familyName: 'CHEN',
    givenName: 'ALEX',
  };
  private readonly behaviours = new InjectedBehaviours<OcrBehaviour>();
  private readonly received: OcrRequest[] = [];

  constructor(private readonly clock: Clock) {}

  /** Lists every recognition request received so far. */
  get requests(): readonly OcrRequest[] {
    return [...this.received];
  }

  /** Sets the fields a successful recognition returns. */
  recognizeAs(fields: Readonly<Record<string, string>>): void {
    this.fields = {...fields};
  }

  /**
   * 逾時 >30s: answers successfully only after the 30-second window in which
   * the caller waits before offering manual fill, but within the 2-minute
   * attempt (default 45 s; `afterMilliseconds` must be in (30 s, 2 min]).
   */
  injectTimeoutOver30Seconds(
    options: InjectionOptions & {afterMilliseconds?: number} = {},
  ): void {
    const delay = options.afterMilliseconds ?? 45 * SECOND;
    if (delay <= MANUAL_FILL_WINDOW || delay > ATTEMPT_TIMEOUT) {
      throw new Error(
        `A timeout over 30 s answers after more than 30 s and within 2 min, got ${delay} ms.`,
      );
    }
    this.behaviours.inject({delay, outcome: 'recognized'}, options);
  }

  /**
   * 逾時 >2min: gives no result and no failure within the 2-minute attempt or
   * ever after, so only the caller's own 2-minute wait on the clock ends the
   * attempt. Use {@link injectLateResult} for a result that still arrives.
   */
  injectTimeoutOver2Minutes(options?: InjectionOptions): void {
    this.behaviours.inject({outcome: 'recognized'}, options);
  }

  /**
   * 晚到結果: answers successfully only after the 2-minute attempt has timed
   * out (default 2 min 30 s; `afterMilliseconds` must be over 2 min).
   */
  injectLateResult(
    options: InjectionOptions & {afterMilliseconds?: number} = {},
  ): void {
    const delay = options.afterMilliseconds ?? ATTEMPT_TIMEOUT + 30 * SECOND;
    if (delay <= ATTEMPT_TIMEOUT) {
      throw new Error(`A late result arrives after 2 min, got ${delay} ms.`);
    }
    this.behaviours.inject({delay, outcome: 'recognized'}, options);
  }

  /** Answers at once that the document could not be recognised. */
  injectRecognitionFailure(reason: string, options?: InjectionOptions): void {
    this.behaviours.inject(
      {delay: 0, outcome: 'unrecognized', reason},
      options,
    );
  }

  /** Drops every injected failure. */
  restore(): void {
    this.behaviours.restore();
  }

  /** Answers per the next injected behaviour, delays measured on the clock. */
  async recognize(
    request: OcrRequest,
  ): Promise<OcrRecognized | OcrUnrecognized> {
    this.received.push(request);
    const behaviour = this.behaviours.take() ?? {
      delay: 0,
      outcome: 'recognized',
    };
    if (behaviour.delay === undefined) {
      return new Promise<never>(() => {});
    }
    if (behaviour.delay > 0) {
      await this.clock.wait(behaviour.delay);
    }
    if (behaviour.outcome === 'unrecognized') {
      return {status: 'unrecognized', reason: behaviour.reason ?? 'unreadable'};
    }
    return {status: 'recognized', fields: this.fields};
  }
}
