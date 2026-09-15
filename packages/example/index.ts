/**
 * @fileoverview Copy-me template for a deep module. The root files are the
 * package's entry points; `lib/` hides the implementation and `tests/` holds
 * tests that go through the entry points. Delete this package once real
 * packages have taken its shape.
 */

import {normalizeName, wrapGreeting} from './lib/impl';

/** Builds a greeting for a person, ignoring stray whitespace in the name. */
export function greet(name: string): string {
  return wrapGreeting(normalizeName(name));
}
