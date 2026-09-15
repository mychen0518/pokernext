/**
 * @fileoverview A clock that tests move forward by hand instead of sleeping.
 */

import type {Clock} from '../../index';

const MILLISECONDS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

/** Where a controllable clock starts. */
export interface ControllableClockOptions {
  /** The first instant the clock reports, as a Date or ISO 8601 string. */
  start?: Date | string;
  /**
   * The fixed UTC offset of the calendar that `advanceMonths` counts in, for
   * example 540 for Asia/Seoul. Defaults to 0 (UTC).
   */
  calendarUtcOffsetMinutes?: number;
}

/** The instant a test clock starts at unless told otherwise. */
const DEFAULT_START = '2026-09-11T09:00:00+09:00';

/**
 * Implements {@link Clock} with time that only moves when a test advances it.
 */
export class ControllableClock implements Clock {
  private current: number;
  private readonly offset: number;
  private readonly timers: PendingTimer[] = [];

  constructor(options: ControllableClockOptions = {}) {
    this.current = new Date(options.start ?? DEFAULT_START).getTime();
    this.offset = options.calendarUtcOffsetMinutes ?? 0;
  }

  /** Returns the instant the clock has been advanced to. */
  now(): Date {
    return new Date(this.current);
  }

  /** Moves the clock forward by whole or fractional minutes. */
  async advanceMinutes(minutes: number): Promise<void> {
    await this.advanceMilliseconds(minutes * MILLISECONDS_PER_MINUTE);
  }

  /** Moves the clock forward by hours. */
  async advanceHours(hours: number): Promise<void> {
    await this.advanceMinutes(hours * MINUTES_PER_HOUR);
  }

  /** Moves the clock forward by 24-hour days. */
  async advanceDays(days: number): Promise<void> {
    await this.advanceHours(days * HOURS_PER_DAY);
  }

  /**
   * Moves the clock forward by calendar months, keeping the local time of day.
   * A day that does not exist in the target month clamps to its last day
   * (Jan 31 + 1 month is Feb 28, or Feb 29 in a leap year).
   */
  async advanceMonths(months: number): Promise<void> {
    await this.advanceTo(addCalendarMonths(this.now(), months, this.offset));
  }

  /** Moves the clock forward by milliseconds. */
  async advanceMilliseconds(milliseconds: number): Promise<void> {
    await this.advanceTo(new Date(this.current + milliseconds));
  }

  /** Resolves once the clock has been advanced by `milliseconds`. */
  wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => {
      this.timers.push({dueAt: this.current + milliseconds, resolve});
    });
  }

  /**
   * Moves the clock forward to an exact instant. Waits falling due on the way
   * complete in due order, each seeing the clock at its own due time, and
   * their continuations run before this promise resolves.
   */
  async advanceTo(instant: Date | string): Promise<void> {
    const target = new Date(instant).getTime();
    if (target < this.current) {
      throw new Error(
        `A controllable clock cannot move backwards (from ${this.now().toISOString()} to ${new Date(target).toISOString()}).`,
      );
    }
    for (;;) {
      const next = this.nextTimerDueBy(target);
      if (next === undefined) {
        break;
      }
      this.current = Math.max(this.current, next.dueAt);
      next.resolve();
      await settle();
    }
    this.current = target;
    await settle();
  }

  private nextTimerDueBy(target: number): PendingTimer | undefined {
    let earliest: PendingTimer | undefined;
    for (const timer of this.timers) {
      if (
        timer.dueAt <= target &&
        (earliest === undefined || timer.dueAt < earliest.dueAt)
      ) {
        earliest = timer;
      }
    }
    if (earliest !== undefined) {
      this.timers.splice(this.timers.indexOf(earliest), 1);
    }
    return earliest;
  }
}

/** A `wait` that has not completed yet. */
interface PendingTimer {
  readonly dueAt: number;
  readonly resolve: () => void;
}

/**
 * Lets already-queued promise continuations run by yielding one macrotask;
 * it does not wait for any amount of time to pass.
 */
function settle(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

/**
 * Adds calendar months in a fixed-offset local calendar, clamping the day of
 * month to the length of the target month.
 */
function addCalendarMonths(
  instant: Date,
  months: number,
  utcOffsetMinutes: number,
): Date {
  // Shift into local wall-clock time, do the calendar arithmetic with the UTC
  // accessors (which then read local fields), and shift back.
  const offsetMilliseconds = utcOffsetMinutes * MILLISECONDS_PER_MINUTE;
  const local = new Date(instant.getTime() + offsetMilliseconds);
  const targetMonthIndex = local.getUTCMonth() + months;
  const firstOfTarget = new Date(
    Date.UTC(local.getUTCFullYear(), targetMonthIndex, 1),
  );
  const daysInTarget = new Date(
    Date.UTC(
      firstOfTarget.getUTCFullYear(),
      firstOfTarget.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();
  const shifted = Date.UTC(
    firstOfTarget.getUTCFullYear(),
    firstOfTarget.getUTCMonth(),
    Math.min(local.getUTCDate(), daysInTarget),
    local.getUTCHours(),
    local.getUTCMinutes(),
    local.getUTCSeconds(),
    local.getUTCMilliseconds(),
  );
  return new Date(shifted - offsetMilliseconds);
}
