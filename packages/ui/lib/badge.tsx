/**
 * @fileoverview `Badge` from DESIGN.md §4: a 22px tinted label in one of the
 * five semantic tones.
 */

import type {ReactNode} from 'react';

import {classNames} from './class_names';
import styles from './badge.module.css';
import type {Tone} from './tone';

/** Props for {@link Badge}. */
export interface BadgeProps {
  tone: Tone;
  /** The status in words; required so status is never colour alone. */
  children: ReactNode;
}

/** Renders a short status or tag as a tinted, outlined label. */
export function Badge({tone, children}: BadgeProps) {
  return (
    <span className={classNames(styles['badge'], styles[tone])}>
      {children}
    </span>
  );
}
