/**
 * @fileoverview `Card` and `CardHeader` from DESIGN.md §4: a flat bordered
 * panel with an optional title row.
 */

import type {HTMLAttributes, ReactNode} from 'react';

import styles from './card.module.css';
import {classNames} from './class_names';

/** Background step of a card: `default` surface or `elevated` surface-2. */
export type CardVariant = 'default' | 'elevated';

/** Props for {@link Card}. */
export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  /** Optional title row, normally a {@link CardHeader}. */
  header?: ReactNode;
  /**
   * Optional `label`-size meta line under a divider at the bottom of the
   * card, such as a scan time or last update with its time zone.
   */
  meta?: ReactNode;
  children?: ReactNode;
}

/**
 * Renders a DESIGN.md `Card`: no shadow, 6px radius, padded body
 * (24px on desktop, 20px on mobile) and an optional meta line.
 */
export function Card({
  variant = 'default',
  header,
  meta,
  className,
  children,
  ...rest
}: CardProps) {
  const classes = classNames(styles['card'], styles[variant], className);
  return (
    <section {...rest} className={classes}>
      {header}
      <div className={styles['body']}>{children}</div>
      {meta === undefined ? undefined : (
        <footer className={styles['meta']}>{meta}</footer>
      )}
    </section>
  );
}

/** Props for {@link CardHeader}. */
export interface CardHeaderProps {
  title: ReactNode;
  /** Right-hand slot, typically a `Badge` or `StatusDot`. */
  status?: ReactNode;
}

/** Renders a card title row with a divider underneath. */
export function CardHeader({title, status}: CardHeaderProps) {
  return (
    <header className={styles['header']}>
      <h3 className={styles['title']}>{title}</h3>
      {status === undefined ? undefined : (
        <div className={styles['status']}>{status}</div>
      )}
    </header>
  );
}
