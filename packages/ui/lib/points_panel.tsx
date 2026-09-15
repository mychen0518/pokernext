/**
 * @fileoverview `PointsPanel` from DESIGN.md §4: available points on the
 * left, reserved points on the right, in the `25,000 分` format of §5.
 */

import styles from './points_panel.module.css';

/** Props for {@link PointsPanel}. */
export interface PointsPanelProps {
  /** Points the member can use now, as shown on the points record. */
  available: number;
  /** Points already held for a stay. */
  reserved: number;
}

const POINTS_FORMAT = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

/**
 * Renders the player `PointsPanel`. Only render it when a points record
 * exists; otherwise show an `EmptyState` with the reason, never 0.
 */
export function PointsPanel({available, reserved}: PointsPanelProps) {
  return (
    <section className={styles['points-panel']}>
      <dl className={styles['figures']}>
        <div className={styles['figure']}>
          <dt className={styles['label']}>可用積分</dt>
          <dd className={`${styles['value']} ${styles['available']}`}>
            <span className={styles['number']}>
              {POINTS_FORMAT.format(available)}
            </span>{' '}
            <span className={styles['unit']}>分</span>
          </dd>
        </div>
        <div className={`${styles['figure']} ${styles['secondary']}`}>
          <dt className={styles['label']}>已保留</dt>
          <dd className={`${styles['value']} ${styles['reserved']}`}>
            <span className={styles['number']}>
              {POINTS_FORMAT.format(reserved)}
            </span>{' '}
            <span className={styles['unit']}>分</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
