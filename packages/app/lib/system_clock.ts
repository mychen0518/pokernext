/**
 * @fileoverview The real clock.
 */

import type {Clock} from '@pokernext/ports';

/** Reads the system time and waits in real time. */
export const SYSTEM_CLOCK: Clock = {
  now: () => new Date(),
  wait: milliseconds =>
    new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    }),
};
