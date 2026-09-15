/**
 * @fileoverview `EmptyState` from DESIGN.md §4: a centred icon, one sentence
 * saying why there is nothing to show, and an optional secondary action.
 */

import {Inbox} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';

import styles from './empty_state.module.css';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';

/** Props for {@link EmptyState}. */
export interface EmptyStateProps {
  /**
   * Why the container is empty, e.g. 本次行程尚未建立. Never a bare
   * 沒有資料 (DESIGN.md §5).
   */
  reason: ReactNode;
  /** Outline icon from `lucide-react`; defaults to an empty tray. */
  icon?: LucideIcon;
  /** Optional follow-up, normally a `Button` with `variant="secondary"`. */
  action?: ReactNode;
}

/** Renders the empty state of a data container. */
export function EmptyState({
  reason,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className={styles['empty-state']}>
      <Icon
        className={styles['icon']}
        aria-hidden="true"
        size={ICON_SIZE.kpi}
        strokeWidth={ICON_STROKE_WIDTH}
        absoluteStrokeWidth
      />
      <p className={styles['reason']}>{reason}</p>
      {action}
    </div>
  );
}
