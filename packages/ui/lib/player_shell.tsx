/**
 * @fileoverview `PlayerShell` from DESIGN.md §3.1 and §4: the phone-first
 * page frame of the player surface, centred at 480px on wider screens.
 */

import type {ReactNode} from 'react';

import styles from './player_shell.module.css';

/** Props for {@link PlayerShell}. */
export interface PlayerShellProps {
  /** Page content, starting with the `AppHeader` or a `HeroTripCard`. */
  children: ReactNode;
  /** The `BottomNav`, kept at the bottom of the screen. */
  navigation: ReactNode;
}

/** Renders the player page frame with the navigation after the content. */
export function PlayerShell({children, navigation}: PlayerShellProps) {
  return (
    <div className={styles['player-shell']}>
      <div className={styles['content']}>{children}</div>
      {navigation}
    </div>
  );
}
