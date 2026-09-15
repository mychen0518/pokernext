/**
 * @fileoverview `HeroTripCard` from DESIGN.md §4: the full-bleed trip card
 * at the top of the player home, carrying the screen's one main action.
 */

import {ChevronRight} from 'lucide-react';
import type {ReactNode} from 'react';

import {Button} from './button';
import styles from './hero_trip_card.module.css';
import {classNames} from './class_names';
import {ICON_STROKE_WIDTH} from './icon';

/** A destination photo behind the card. */
export interface HeroTripImage {
  src: string;
  /** Text alternative; `''` when the photo is purely decorative. */
  alt: string;
}

/** Props for {@link HeroTripCard}. */
export interface HeroTripCardProps {
  /** Destination in Chinese, e.g. 濟州島. */
  destination: ReactNode;
  /** Destination in English, shown as an overline, e.g. JEJU ISLAND. */
  destinationEn: string;
  /** Stay dates, e.g. 09/11 – 09/13 · 2 晚. */
  dates: ReactNode;
  /** Label of the full-width `Button/outline-gold`, e.g. 查看行程. */
  actionLabel: string;
  onAction?: () => void;
  /** Optional greeting above the destination, e.g. Alex，您好. */
  greeting?: ReactNode;
  /** Top slot laid over the image, normally the `AppHeader`. */
  header?: ReactNode;
  /** Photo; without one the card is a flat `--pn-surface-2` placeholder. */
  image?: HeroTripImage;
}

/** Renders the player home `HeroTripCard`. */
export function HeroTripCard({
  destination,
  destinationEn,
  dates,
  actionLabel,
  onAction,
  greeting,
  header,
  image,
}: HeroTripCardProps) {
  return (
    <section
      className={classNames(
        styles['hero-trip-card'],
        image === undefined && styles['placeholder'],
      )}
    >
      {image === undefined ? undefined : (
        <img className={styles['image']} src={image.src} alt={image.alt} />
      )}
      <div className={styles['scrim']} aria-hidden="true" />
      {header}
      <div className={styles['body']}>
        {greeting === undefined ? undefined : (
          <p className={styles['greeting']}>{greeting}</p>
        )}
        <div className={styles['trip']}>
          <h2 className={styles['destination']}>
            {destination}
            <span className={styles['destination-en']} lang="en">
              {destinationEn}
            </span>
          </h2>
          <p className={styles['dates']}>{dates}</p>
          <Button
            variant="outline-gold"
            size="lg"
            fullWidth
            className={styles['action']}
            onClick={onAction}
          >
            {actionLabel}
            <ChevronRight
              className={styles['action-chevron']}
              aria-hidden="true"
              size={20}
              strokeWidth={ICON_STROKE_WIDTH}
              absoluteStrokeWidth
            />
          </Button>
        </div>
      </div>
    </section>
  );
}
