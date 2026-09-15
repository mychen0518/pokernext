/**
 * @fileoverview `InfoBox` from DESIGN.md §4: a surface-2 note with an info
 * icon, a short title and an explanation.
 */

import {Info} from 'lucide-react';
import type {ReactNode} from 'react';

import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import styles from './info_box.module.css';

/** Props for {@link InfoBox}. */
export interface InfoBoxProps {
  title: ReactNode;
  /** The explanation under the title. */
  children?: ReactNode;
}

/** Renders an informational note. */
export function InfoBox({title, children}: InfoBoxProps) {
  return (
    <aside className={styles['info-box']}>
      <Info
        className={styles['icon']}
        aria-hidden="true"
        size={ICON_SIZE.list}
        strokeWidth={ICON_STROKE_WIDTH}
        absoluteStrokeWidth
      />
      <div className={styles['text']}>
        <p className={styles['title']}>{title}</p>
        {children === undefined ? undefined : (
          <div className={styles['description']}>{children}</div>
        )}
      </div>
    </aside>
  );
}
