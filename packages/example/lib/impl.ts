/**
 * @fileoverview Private implementation of the example package. Reachable only
 * from files inside `packages/example`, never from outside or from tests.
 */

/** Collapses runs of whitespace and trims the ends of a name. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Wraps an already normalized name in the greeting sentence. */
export function wrapGreeting(name: string): string {
  return name === '' ? 'Hello!' : `Hello, ${name}!`;
}
