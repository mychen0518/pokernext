/**
 * @fileoverview `AppHeader` from DESIGN.md §4: the player surface's top row
 * with the POKERNEXT wordmark and the notification bell.
 */

import {Bell} from 'lucide-react';

import styles from './app_header.module.css';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';

/** Props for {@link AppHeader}. */
export interface AppHeaderProps {
  /** Shows the unread dot and says so in the bell's accessible name. */
  hasUnreadNotifications?: boolean;
  /** Called when the member presses the bell. */
  onOpenNotifications?: () => void;
}

/**
 * Renders the player `AppHeader` on a transparent background, so it can sit
 * at the top of a page or inside a `HeroTripCard`.
 */
export function AppHeader({
  hasUnreadNotifications = false,
  onOpenNotifications,
}: AppHeaderProps) {
  return (
    <header className={styles['app-header']}>
      <div className={styles['brand']}>
        <span className={styles['wordmark']} lang="en">
          <span>POKER</span>
          <span className={styles['wordmark-accent']}>NEXT</span>
        </span>
        <span className={styles['tagline']} lang="en">
          TRAVEL · PLAY · BELONG
        </span>
      </div>
      <button
        type="button"
        className={styles['bell']}
        aria-label={hasUnreadNotifications ? '通知，有未讀通知' : '通知'}
        onClick={onOpenNotifications}
      >
        <Bell
          aria-hidden="true"
          size={ICON_SIZE.title}
          strokeWidth={ICON_STROKE_WIDTH}
          absoluteStrokeWidth
        />
        {hasUnreadNotifications ? (
          <span className={styles['unread-dot']} aria-hidden="true" />
        ) : undefined}
      </button>
    </header>
  );
}
