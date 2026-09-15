/**
 * @fileoverview `Topbar` from DESIGN.md §4: the 64px bar above the page with
 * an overline breadcrumb on the left and the date, time and time zone on the
 * right.
 */

import styles from './topbar.module.css';

/** Props for {@link Topbar}. */
export interface TopbarProps {
  /** Overline breadcrumb, such as `JEJU · PARTNER WORKSPACE`. */
  breadcrumb: string;
  /**
   * Current date and time with its time zone label, such as
   * `2026/09/11（五）11:05 · 韓國時間` (DESIGN.md §5).
   */
  dateTime: string;
}

/** Renders the workspace top bar. */
export function Topbar({breadcrumb, dateTime}: TopbarProps) {
  return (
    <header className={styles['topbar']}>
      <p className={styles['breadcrumb']}>{breadcrumb}</p>
      <p className={styles['date-time']}>{dateTime}</p>
    </header>
  );
}
