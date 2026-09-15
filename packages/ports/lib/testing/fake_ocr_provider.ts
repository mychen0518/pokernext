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
const MINUTE = 60 * SECOND;

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

  /** Answers successfully, but only after 31 s: past the manual-fill mark. */
  injectResponseAfter30Seconds(options?: InjectionOptions): void {
    this.behaviours.inject(
      {delay: 31 * SECOND, outcome: 'recognized'},
      options,
    );
  }

  /** Never answers, so the 2-minute timeout is what ends the attempt. */
  injectTimeoutOver2Minutes(options?: InjectionOptions): void {
    this.behaviours.inject({outcome: 'recognized'}, options);
  }

  /** Answers successfully after the 2-minute timeout (default 2 min 30 s). */
  injectLateResult(
    options: InjectionOptions & {afterMilliseconds?: number} = {},
  ): void {
    this.behaviours.inject(
      {
        delay: options.afterMilliseconds ?? 2 * MINUTE + 30 * SECOND,
        outcome: 'recognized',
      },
      options,
    );
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
