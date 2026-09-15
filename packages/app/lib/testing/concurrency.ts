/**
 * @fileoverview Fires one operation many times at once and checks that it took
 * effect exactly once (spec: 併發、防重與冪等).
 */

/** How a batch of parallel attempts ended. */
export interface ParallelAttempts<T> {
  /** Values of the attempts that resolved, in completion order. */
  readonly fulfilled: T[];
  /** Reasons of the attempts that rejected, in completion order. */
  readonly rejected: unknown[];
}

/** An operation to race against itself, plus how to observe its effect. */
export interface TakesEffectOnceCheck<T> {
  /** How many identical attempts to fire at once. */
  readonly times: number;
  /** One attempt; `attempt` is its 0-based index. */
  readonly attempt: (attempt: number) => Promise<T>;
  /**
   * Counts the effect through the application boundary (a use-case query),
   * never by reading tables directly.
   */
  readonly countEffects: () => Promise<number>;
}

/** Thrown when parallel attempts did not take effect exactly once. */
export class ConcurrencyViolation extends Error {
  constructor(
    readonly times: number,
    readonly effects: number,
    readonly attempts: ParallelAttempts<unknown>,
  ) {
    super(
      `Expected ${times} parallel attempts to take effect exactly once, but ` +
        `they took effect ${effects} times (${attempts.fulfilled.length} ` +
        `resolved, ${attempts.rejected.length} rejected).`,
    );
    this.name = 'ConcurrencyViolation';
  }
}

/**
 * Starts `times` attempts in the same tick, after all of them are scheduled,
 * and waits for every one to settle.
 */
export async function runInParallel<T>(
  times: number,
  attempt: (attempt: number) => Promise<T>,
): Promise<ParallelAttempts<T>> {
  if (!Number.isInteger(times) || times < 2) {
    throw new Error(`Parallel attempts need times >= 2, got ${times}.`);
  }
  let release = () => {};
  const startingGun = new Promise<void>(resolve => {
    release = resolve;
  });
  const outcome: ParallelAttempts<T> = {fulfilled: [], rejected: []};
  const running = Array.from({length: times}, async (_, index) => {
    await startingGun;
    try {
      outcome.fulfilled.push(await attempt(index));
    } catch (error: unknown) {
      outcome.rejected.push(error);
    }
  });
  release();
  await Promise.all(running);
  return outcome;
}

/**
 * Fires the attempts in parallel and throws {@link ConcurrencyViolation} unless
 * the observed effect count grew by exactly one.
 */
export async function expectTakesEffectOnce<T>(
  check: TakesEffectOnceCheck<T>,
): Promise<ParallelAttempts<T>> {
  const before = await check.countEffects();
  const attempts = await runInParallel(check.times, check.attempt);
  const effects = (await check.countEffects()) - before;
  if (effects !== 1) {
    throw new ConcurrencyViolation(check.times, effects, attempts);
  }
  return attempts;
}
