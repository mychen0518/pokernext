/**
 * @fileoverview `KpiRow` and `KpiTile` from DESIGN.md §4: key figures in a
 * row of tiles split by vertical dividers, without a card background.
 */

import type {LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';

import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import styles from './kpi_row.module.css';

/** Props for {@link KpiRow}. */
export interface KpiRowProps {
  /** The tiles, normally four {@link KpiTile}s. */
  children: ReactNode;
  /** Accessible name of the figures, such as 今日概況. */
  label?: string;
}

/** Renders a row of KPI tiles as a description list. */
export function KpiRow({children, label}: KpiRowProps) {
  return (
    <dl className={styles['kpi-row']} aria-label={label}>
      {children}
    </dl>
  );
}

/** Props for {@link KpiTile}. */
export interface KpiTileProps {
  /** Outline icon from `lucide-react`, drawn 32px in gold. */
  icon: LucideIcon;
  label: string;
  /** The figure, such as `08`. Never a 0 standing in for unknown. */
  value: ReactNode;
}

/** Renders one KPI: gold icon, label above and the figure in display type. */
export function KpiTile({icon: Icon, label, value}: KpiTileProps) {
  return (
    <div className={styles['tile']}>
      <Icon
        className={styles['icon']}
        aria-hidden="true"
        size={ICON_SIZE.kpi}
        strokeWidth={ICON_STROKE_WIDTH}
        absoluteStrokeWidth
      />
      <div className={styles['text']}>
        <dt className={styles['label']}>{label}</dt>
        <dd className={styles['value']}>{value}</dd>
      </div>
    </div>
  );
}
