/**
 * @fileoverview Private loading and error states shared by the desktop data
 * containers (DataTable, ListPanel, TodoPanel, ActivityTimeline), following
 * DESIGN.md §5.
 */

import {CircleAlert} from 'lucide-react';
import type {ReactNode} from 'react';

import {Button} from './button';
import {classNames} from './class_names';
import styles from './container_states.module.css';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import {StatusDot} from './status_dot';

/** Default failure sentence when a container gives no reason of its own. */
export const DEFAULT_ERROR_REASON = '資料暫時無法載入，請稍後再試。';

/** Error props every data container accepts. */
export interface ContainerErrorProps {
  /** Why loading failed, in one sentence; defaults to a generic sentence. */
  errorReason?: ReactNode;
  /** When given, the error state offers a secondary 重新載入 button. */
  onRetry?: () => void;
}

/** Renders a failed data container: status in words, reason and retry. */
export function ErrorState({errorReason, onRetry}: ContainerErrorProps) {
  return (
    <div className={styles['error-state']} role="alert">
      <CircleAlert
        className={styles['icon']}
        aria-hidden="true"
        size={ICON_SIZE.kpi}
        strokeWidth={ICON_STROKE_WIDTH}
        absoluteStrokeWidth
      />
      <StatusDot tone="danger">載入失敗</StatusDot>
      <p className={styles['reason']}>{errorReason ?? DEFAULT_ERROR_REASON}</p>
      {onRetry === undefined ? undefined : (
        <Button variant="secondary" onClick={onRetry}>
          重新載入
        </Button>
      )}
    </div>
  );
}

interface SkeletonBarProps {
  /** Bar width as a share of its cell, e.g. `wide` for a title line. */
  size?: 'short' | 'medium' | 'wide';
}

/** Renders one grey placeholder line of a skeleton row. */
export function SkeletonBar({size = 'medium'}: SkeletonBarProps) {
  return (
    <span
      className={classNames(styles['bar'], styles[size])}
      aria-hidden="true"
    />
  );
}

/** Screen-reader text announced while a container loads. */
export const LOADING_LABEL = '載入中';
