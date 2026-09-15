/**
 * @fileoverview `StatusStrip` from DESIGN.md §4: an optional place row, then
 * three cells for lodging, transfer and itinerary, each an icon plus words.
 */

import {BedDouble, CarFront, FileText, MapPin} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';

import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import styles from './status_strip.module.css';

/** Props for {@link StatusStrip}. */
export interface StatusStripProps {
  /** Lodging status in words, e.g. 住宿已確認. */
  lodging: ReactNode;
  /** Transfer status in words, e.g. 接送待確認. */
  transfer: ReactNode;
  /** Itinerary status in words, e.g. 行程待您確認. */
  itinerary: ReactNode;
  /** Optional place row above the cells, e.g. the hotel name. */
  place?: ReactNode;
}

interface StatusCellProps {
  icon: LucideIcon;
  text: ReactNode;
}

/** Renders one icon above its status text. */
function StatusCell({icon: Icon, text}: StatusCellProps) {
  return (
    <li className={styles['cell']}>
      <Icon
        className={styles['icon']}
        aria-hidden="true"
        size={ICON_SIZE.title}
        strokeWidth={ICON_STROKE_WIDTH}
        absoluteStrokeWidth
      />
      <span className={styles['text']}>{text}</span>
    </li>
  );
}

/** Renders the player home `StatusStrip`. */
export function StatusStrip({
  lodging,
  transfer,
  itinerary,
  place,
}: StatusStripProps) {
  return (
    <section className={styles['status-strip']}>
      {place === undefined ? undefined : (
        <p className={styles['place']}>
          <MapPin
            className={styles['icon']}
            aria-hidden="true"
            size={ICON_SIZE.title}
            strokeWidth={ICON_STROKE_WIDTH}
            absoluteStrokeWidth
          />
          <span>{place}</span>
        </p>
      )}
      <ul className={styles['cells']}>
        <StatusCell icon={BedDouble} text={lodging} />
        <StatusCell icon={CarFront} text={transfer} />
        <StatusCell icon={FileText} text={itinerary} />
      </ul>
    </section>
  );
}
