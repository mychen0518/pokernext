/**
 * @fileoverview Shared failure-injection bookkeeping for the fake ports.
 */

/** How long an injected behaviour lasts. */
export interface InjectionOptions {
  /**
   * How many upcoming calls the behaviour applies to. When omitted it applies
   * to every call until the fake is restored.
   */
  times?: number;
}

/**
 * Queues injected behaviours: count-limited ones are used first, in the order
 * they were injected, then the most recent open-ended one.
 */
export class InjectedBehaviours<B> {
  private readonly counted: Array<{behaviour: B; remaining: number}> = [];
  private openEnded?: B;

  /** Adds a behaviour for the next `times` calls, or until restored. */
  inject(behaviour: B, options: InjectionOptions = {}): void {
    if (options.times === undefined) {
      this.openEnded = behaviour;
      return;
    }
    if (!Number.isInteger(options.times) || options.times < 1) {
      throw new Error(
        `times must be a positive integer, got ${options.times}.`,
      );
    }
    this.counted.push({behaviour, remaining: options.times});
  }

  /** Returns the behaviour for the current call, or undefined for normal. */
  take(): B | undefined {
    const next = this.counted[0];
    if (next !== undefined) {
      next.remaining -= 1;
      if (next.remaining === 0) {
        this.counted.shift();
      }
      return next.behaviour;
    }
    return this.openEnded;
  }

  /** Drops every injected behaviour. */
  restore(): void {
    this.counted.length = 0;
    this.openEnded = undefined;
  }
}
