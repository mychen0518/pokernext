/**
 * @fileoverview `ContactRow` from DESIGN.md §4: the member's contact person
 * (接待人) with an optional detail line and a ghost action on the right.
 */

import {User} from 'lucide-react';
import type {ReactNode} from 'react';

import styles from './contact_row.module.css';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';

/** Props for {@link ContactRow}. */
export interface ContactRowProps {
  /** The contact's role, e.g. 接待人. */
  label: ReactNode;
  /** The contact's name, e.g. Amy. */
  name: ReactNode;
  /** Optional second line, e.g. service hours with a time zone. */
  detail?: ReactNode;
  /** Optional action, normally a `Button` with `variant="ghost"`. */
  action?: ReactNode;
}

/** Renders the player home `ContactRow`. */
export function ContactRow({label, name, detail, action}: ContactRowProps) {
  return (
    <section className={styles['contact-row']}>
      <User
        className={styles['icon']}
        aria-hidden="true"
        size={ICON_SIZE.title}
        strokeWidth={ICON_STROKE_WIDTH}
        absoluteStrokeWidth
      />
      <div className={styles['who']}>
        <p className={styles['name']}>
          <span className={styles['label']}>{label}</span> {name}
        </p>
        {detail === undefined ? undefined : (
          <p className={styles['detail']}>{detail}</p>
        )}
      </div>
      {action === undefined ? undefined : (
        <div className={styles['action']}>{action}</div>
      )}
    </section>
  );
}
