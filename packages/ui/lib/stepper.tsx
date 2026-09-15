/**
 * @fileoverview `Stepper` from DESIGN.md §4: a horizontal progress line of
 * three to five steps, each with a 24px node and its name and time below.
 */

import {Check} from 'lucide-react';
import type {ReactNode} from 'react';

import {classNames} from './class_names';
import styles from './stepper.module.css';
import hidden from './visually_hidden.module.css';

/** Progress of one step. */
export type StepStatus = 'done' | 'current' | 'upcoming';

/** One step of a {@link Stepper}. */
export interface StepperStep {
  readonly label: string;
  readonly status: StepStatus;
  /** `label`-size line under the name: time and handler, such as 琪琪. */
  readonly detail?: ReactNode;
}

/** Props for {@link Stepper}. */
export interface StepperProps {
  /** Accessible name, such as 處理進度. */
  label: string;
  /** Three to five steps in order. */
  steps: readonly StepperStep[];
}

/** Words for each status, so progress is never shown by colour alone. */
const STATUS_WORDS: Readonly<Record<StepStatus, string>> = {
  done: '已完成',
  current: '進行中',
  upcoming: '未開始',
};

/**
 * Renders the steps as an ordered list. Done nodes are gold with a tick, the
 * current node has a gold ring, upcoming nodes a grey ring; the line is solid
 * gold up to the current step and dashed grey after it.
 */
export function Stepper({label, steps}: StepperProps) {
  return (
    <ol className={styles['stepper']} aria-label={label}>
      {steps.map((step, index) => {
        const previous = steps[index - 1];
        const next = steps[index + 1];
        return (
          <li
            key={step.label}
            className={classNames(styles['step'], styles[step.status])}
            aria-current={step.status === 'current' ? 'step' : undefined}
          >
            <span className={styles['track']} aria-hidden="true">
              <span
                className={classNames(
                  styles['line'],
                  previous === undefined && styles['line-none'],
                  step.status !== 'upcoming' && styles['line-reached'],
                )}
              />
              <span className={styles['node']}>
                {step.status === 'done' ? (
                  <Check size={14} strokeWidth={2.5} absoluteStrokeWidth />
                ) : undefined}
              </span>
              <span
                className={classNames(
                  styles['line'],
                  next === undefined && styles['line-none'],
                  next !== undefined &&
                    next.status !== 'upcoming' &&
                    styles['line-reached'],
                )}
              />
            </span>
            <span className={styles['name']}>
              {step.label}
              <span className={hidden['visually-hidden']}>
                （{STATUS_WORDS[step.status]}）
              </span>
            </span>
            {step.detail === undefined ? undefined : (
              <span className={styles['detail']}>{step.detail}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
