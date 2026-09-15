/**
 * @fileoverview `Toast` from DESIGN.md §4: a surface-3 notice led by a
 * `StatusDot` that names the outcome, followed by the message.
 */

import type {ReactNode} from 'react';

import {StatusDot} from './status_dot';
import styles from './toast.module.css';

/** Outcome a toast reports. */
export type ToastTone = 'success' | 'error';

/** Props for {@link Toast}. */
export interface ToastProps {
  tone: ToastTone;
  /** Short outcome in words next to the dot, such as 已儲存. */
  title: ReactNode;
  /** Optional detail under the title. */
  children?: ReactNode;
}

/**
 * Renders one toast. Errors are announced assertively (`role="alert"`),
 * successes politely (`role="status"`). Placement (top right on desktop,
 * above BottomNav on mobile) belongs to the page that shows it.
 */
export function Toast({tone, title, children}: ToastProps) {
  return (
    <div
      className={styles['toast']}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <StatusDot tone={tone === 'error' ? 'danger' : 'success'}>
        {title}
      </StatusDot>
      {children === undefined ? undefined : (
        <div className={styles['message']}>{children}</div>
      )}
    </div>
  );
}
