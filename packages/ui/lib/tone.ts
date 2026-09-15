/**
 * @fileoverview Semantic tones shared by StatusDot, Badge and Toast
 * (DESIGN.md §2.1).
 */

/**
 * Semantic status tone: `warning` for waiting states, `success` for done,
 * `danger` for refused or mismatched, `info` for in progress, `neutral` for
 * not started, not needed or withdrawn.
 */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
