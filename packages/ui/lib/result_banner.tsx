/**
 * @fileoverview `ResultBanner` from DESIGN.md §4: the 56px outcome bar at the
 * top of an operation page, with the outcome in words, the related ID and
 * the current status on the right.
 */

import {CircleCheck, CircleX, Info} from 'lucide-react';
import type {ReactNode} from 'react';

import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import styles from './result_banner.module.css';

/** Outcome a {@link ResultBanner} reports. */
export type ResultBannerTone = 'success' | 'error' | 'info';

/** Props for {@link ResultBanner}. */
export interface ResultBannerProps {
  tone: ResultBannerTone;
  /** The outcome in words, such as 掃碼成功. */
  title: string;
  /** Label of the related record, such as 本次行程. */
  referenceLabel?: string;
  /** The related ID in `mono`, such as `TR-260911-028`. */
  referenceId?: string;
  /** Right-hand status, normally a `StatusDot`. */
  status?: ReactNode;
}

const ICONS = {success: CircleCheck, error: CircleX, info: Info} as const;

/**
 * Renders the outcome of a scan or lookup. Errors are announced assertively
 * (`role="alert"`), other outcomes politely (`role="status"`).
 */
export function ResultBanner({
  tone,
  title,
  referenceLabel,
  referenceId,
  status,
}: ResultBannerProps) {
  const Icon = ICONS[tone];
  const hasReference =
    referenceLabel !== undefined || referenceId !== undefined;
  return (
    <div
      className={`${styles['result-banner']} ${styles[tone]}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <p className={styles['outcome']}>
        <Icon
          className={styles['icon']}
          aria-hidden="true"
          size={ICON_SIZE.title}
          strokeWidth={ICON_STROKE_WIDTH}
          absoluteStrokeWidth
        />
        {title}
      </p>
      {hasReference ? (
        <p className={styles['reference']}>
          {referenceLabel === undefined ? undefined : (
            <span className={styles['reference-label']}>{referenceLabel}</span>
          )}
          {referenceId === undefined ? undefined : (
            <span className={styles['reference-id']}>{referenceId}</span>
          )}
        </p>
      ) : undefined}
      {status === undefined ? undefined : (
        <div className={styles['status']}>{status}</div>
      )}
    </div>
  );
}
