/**
 * @fileoverview `BottomNav` from DESIGN.md §3.1 and §4: the player surface's
 * five fixed destinations, pinned to the bottom of the screen.
 */

import {BriefcaseBusiness, Database, House, Scan, User} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';

import styles from './bottom_nav.module.css';
import {classNames} from './class_names';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';

/** One of the five player destinations, in DESIGN.md §3.1 order. */
export type BottomNavItem = 'home' | 'trips' | 'qr' | 'points' | 'account';

interface BottomNavEntry {
  readonly item: BottomNavItem;
  readonly label: string;
  readonly icon: LucideIcon;
}

/** DESIGN.md §3.1: 首頁、我的行程、到場碼、我的積分、我的帳戶, fixed. */
const ENTRIES: readonly BottomNavEntry[] = [
  {item: 'home', label: '首頁', icon: House},
  {item: 'trips', label: '我的行程', icon: BriefcaseBusiness},
  {item: 'qr', label: '到場碼', icon: Scan},
  {item: 'points', label: '我的積分', icon: Database},
  {item: 'account', label: '我的帳戶', icon: User},
];

/** Props for {@link BottomNav}. */
export interface BottomNavProps {
  /** The destination the member is on; shown in gold. */
  current: BottomNavItem;
  /** Link target of each destination. */
  hrefs: Readonly<Record<BottomNavItem, string>>;
}

/**
 * Renders the player `BottomNav`. It sticks to the bottom of the viewport
 * and, as the last child of a `PlayerShell`, never covers the content end.
 */
export function BottomNav({current, hrefs}: BottomNavProps) {
  return (
    <nav className={styles['bottom-nav']} aria-label="玩家導覽">
      <ul className={styles['list']}>
        {ENTRIES.map(({item, label, icon: Icon}) => {
          const isCurrent = item === current;
          return (
            <li key={item} className={styles['entry']}>
              <a
                href={hrefs[item]}
                className={classNames(
                  styles['link'],
                  isCurrent && styles['current'],
                )}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <Icon
                  aria-hidden="true"
                  size={ICON_SIZE.title}
                  strokeWidth={ICON_STROKE_WIDTH}
                  absoluteStrokeWidth
                />
                <span className={styles['label']}>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
