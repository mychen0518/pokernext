/**
 * @fileoverview Exercises the example package only through its entry point.
 */

import {describe, expect, it} from 'vitest';

import {greet} from '../index';

describe('greet', () => {
  it('greets a person by the name they gave', () => {
    expect(greet('  Alex   Kim ')).toBe('Hello, Alex Kim!');
  });

  it('still greets when no name was given', () => {
    expect(greet('   ')).toBe('Hello!');
  });
});
