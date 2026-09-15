/**
 * @fileoverview `ActivityTimeline` from DESIGN.md §4: recent events joined
 * by a line of green dots, each with time, event, related ID and a short
 * description, and its loading, empty, error and ready states.
 */

import type {ReactNode} from 'react';

import styles from './activity_timeline.module.css';
import {ErrorState, LOADING_LABEL, SkeletonBar} from './container_states';
import type {ContainerErrorProps} from './container_states';
import type {DataState} from './data_state';
import {EmptyState} from './empty_state';
import hidden from './visually_hidden.module.css';

/** Number of skeleton rows while loading. */
const SKELETON_ROWS = 3;

/** One event of an {@link ActivityTimeline}. */
export interface ActivityTimelineItem {
  readonly id: string;
  /** Time of the event, such as `10:42`; the page states the time zone. */
  readonly time: string;
  /** What happened, such as 押金已收取. */
  readonly event: string;
  /** Related ID in `mono`, such as `TR-260911-029`. */
  readonly reference?: string;
  readonly description?: ReactNode;
}

/** Props for {@link ActivityTimeline}. */
export interface ActivityTimelineProps extends ContainerErrorProps {
  /** Accessible name, such as 最近處理. */
  label: string;
  items: readonly ActivityTimelineItem[];
  state: DataState;
  /** Why there are no events, such as 今日尚無處理紀錄. */
  emptyReason: ReactNode;
}

/** Renders the timeline, newest event first as given. */
export function ActivityTimeline({
  label,
  items,
  state,
  emptyReason,
  errorReason,
  onRetry,
}: ActivityTimelineProps) {
  if (state === 'error') {
    return <ErrorState errorReason={errorReason} onRetry={onRetry} />;
  }
  if (state === 'empty' || (state === 'ready' && items.length === 0)) {
    return <EmptyState reason={emptyReason} />;
  }
  if (state === 'loading') {
    return (
      <div className={styles['timeline']} aria-busy="true">
        <span className={hidden['visually-hidden']}>{LOADING_LABEL}</span>
        {Array.from({length: SKELETON_ROWS}, (_, index) => (
          <div key={index} className={styles['skeleton-row']}>
            <SkeletonBar size="short" />
            <SkeletonBar size="wide" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <ol className={styles['timeline']} aria-label={label}>
      {items.map(item => (
        <li key={item.id} className={styles['item']}>
          <span className={styles['rail']} aria-hidden="true">
            <span className={styles['rail-line']} />
            <span className={styles['dot']} />
            <span className={styles['rail-line']} />
          </span>
          <span className={styles['time']}>{item.time}</span>
          <span className={styles['event']}>{item.event}</span>
          <span className={styles['reference']}>{item.reference}</span>
          <span className={styles['description']}>{item.description}</span>
        </li>
      ))}
    </ol>
  );
}
