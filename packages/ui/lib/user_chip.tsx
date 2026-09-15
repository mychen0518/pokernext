/**
 * @fileoverview `UserChip` from DESIGN.md §4: the signed-in user at the foot
 * of the Sidebar, with an optional Badge such as 示意資料.
 */

import {User} from 'lucide-react';
import type {ReactNode} from 'react';

import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import styles from './user_chip.module.css';

/** Props for {@link UserChip}. */
export interface UserChipProps {
  name: string;
  /** Role within the workspace, such as 天城業務. */
  role: string;
  /** Optional `Badge`, normally `tone="neutral"`. */
  badge?: ReactNode;
}

/**
 * Renders the user's name and role. In the collapsed Sidebar rail only the
 * icon shows; the name stays available to assistive technology.
 */
export function UserChip({name, role, badge}: UserChipProps) {
  return (
    <div className={styles['user-chip']} title={`${name} · ${role}`}>
      <User
        className={styles['icon']}
        aria-hidden="true"
        size={ICON_SIZE.title}
        strokeWidth={ICON_STROKE_WIDTH}
        absoluteStrokeWidth
      />
      <div className={styles['text']}>
        <p className={styles['identity']}>
          <span className={styles['name']}>{name}</span>
          <span className={styles['role']}>{role}</span>
        </p>
        {badge === undefined ? undefined : (
          <div className={styles['badge']}>{badge}</div>
        )}
      </div>
    </div>
  );
}
