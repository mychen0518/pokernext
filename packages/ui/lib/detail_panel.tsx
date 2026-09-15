/**
 * @fileoverview `DetailPanel` from DESIGN.md §4: the right side of a 案件頁,
 * a Card with a title row and Badge, the case body (KeyValueList, Stepper,
 * form) and a bottom action row with meta on the right.
 */

import type {ReactNode} from 'react';

import {Card} from './card';
import styles from './detail_panel.module.css';

/** Props for {@link DetailPanel}. */
export interface DetailPanelProps {
  /** Accessible name of the panel, such as 案件詳情. */
  label: string;
  /** Case title, such as 取消行程; the panel's `h2`. */
  title: string;
  /** Status `Badge` after the title. */
  badge?: ReactNode;
  /** Label before the case ID, such as 案件編號. */
  referenceLabel?: string;
  /** The case ID in `mono`, such as `CHG-260911-006`. */
  referenceId?: string;
  /** Bottom actions: a primary and a secondary `Button` side by side. */
  actions?: ReactNode;
  /** `label`-size meta on the right of the actions, such as 最後更新. */
  meta?: ReactNode;
  children?: ReactNode;
}

/** Renders the detail of the selected case. */
export function DetailPanel({
  label,
  title,
  badge,
  referenceLabel,
  referenceId,
  actions,
  meta,
  children,
}: DetailPanelProps) {
  const hasReference =
    referenceLabel !== undefined || referenceId !== undefined;
  const hasFooter = actions !== undefined || meta !== undefined;
  return (
    <Card
      aria-label={label}
      className={styles['detail-panel']}
      header={
        <header className={styles['header']}>
          <div className={styles['title-row']}>
            <h2 className={styles['title']}>{title}</h2>
            {badge}
          </div>
          {hasReference ? (
            <p className={styles['reference']}>
              {referenceLabel === undefined ? undefined : (
                <span>{referenceLabel}</span>
              )}
              {referenceId === undefined ? undefined : (
                <span className={styles['reference-id']}>{referenceId}</span>
              )}
            </p>
          ) : undefined}
        </header>
      }
    >
      <div className={styles['body']}>{children}</div>
      {hasFooter ? (
        <div className={styles['footer']}>
          <div className={styles['actions']}>{actions}</div>
          {meta === undefined ? undefined : (
            <p className={styles['meta']}>{meta}</p>
          )}
        </div>
      ) : undefined}
    </Card>
  );
}
