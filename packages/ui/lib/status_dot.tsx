/**
 * @fileoverview `StatusDot` from DESIGN.md §4: an 8px dot followed by the
 * status in words, both in the tone colour.
 */

import type {ReactNode} from 'react';

import {classNames} from './class_names';
import styles from './status_dot.module.css';
import type {Tone} from './tone';

/** Props for {@link StatusDot}. */
export interface StatusDotProps {
  tone: Tone;
  /** The status in words; required so status is never colour alone. */
  children: ReactNode;
}

/** Renders a status as a coloured dot plus its text label. */
export function StatusDot({tone, children}: StatusDotProps) {
  return (
    <span className={classNames(styles['status-dot'], styles[tone])}>
      <span className={styles['dot']} aria-hidden="true" />
      {children}
    </span>
  );
}
