/**
 * @fileoverview `Sidebar` from DESIGN.md §4: the 232px workspace column with
 * the brand and workspace name, the navigation, and the UserChip with a
 * sign-out button. At 1024px and below it collapses to an icon rail.
 */

import {LogOut} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';

import {classNames} from './class_names';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import styles from './sidebar.module.css';

/** One navigation entry of a {@link Sidebar}. */
export interface SidebarItem {
  /** Stable key, compared with `currentId`. */
  readonly id: string;
  readonly label: string;
  readonly href: string;
  /** Outline icon from `lucide-react`; the only thing shown in the rail. */
  readonly icon: LucideIcon;
}

/** Props for {@link Sidebar}. */
export interface SidebarProps {
  /**
   * Workspace name shown under the brand, such as 天城合作端 or 管理端; also
   * the accessible name of the sidebar.
   */
  workspaceName: string;
  items: readonly SidebarItem[];
  /** Id of the page the user is on; that item is marked current. */
  currentId: string;
  /** The signed-in user, normally a {@link UserChip}. */
  user: ReactNode;
  /** Called by the sign-out button; the button is omitted without it. */
  onSignOut?: () => void;
  /** Accessible name of the navigation list. */
  navLabel?: string;
}

/** Renders the workspace sidebar. */
export function Sidebar({
  workspaceName,
  items,
  currentId,
  user,
  onSignOut,
  navLabel = '工作區導覽',
}: SidebarProps) {
  return (
    <aside className={styles['sidebar']} aria-label={workspaceName}>
      <div className={styles['inner']}>
        <div className={styles['brand']}>
          <p className={styles['logo']}>
            <span className={styles['logo-full']}>
              POKER<span className={styles['logo-accent']}>NEXT</span>
            </span>
            <span className={styles['logo-mark']} aria-hidden="true">
              P<span className={styles['logo-accent']}>N</span>
            </span>
          </p>
          <p className={styles['workspace']}>{workspaceName}</p>
        </div>
        <nav className={styles['nav']} aria-label={navLabel}>
          <ul className={styles['items']}>
            {items.map(({id, label, href, icon: Icon}) => {
              const current = id === currentId;
              return (
                <li key={id}>
                  <a
                    className={classNames(
                      styles['item'],
                      current && styles['current'],
                    )}
                    href={href}
                    title={label}
                    aria-current={current ? 'page' : undefined}
                  >
                    <Icon
                      className={styles['item-icon']}
                      aria-hidden="true"
                      size={ICON_SIZE.title}
                      strokeWidth={ICON_STROKE_WIDTH}
                      absoluteStrokeWidth
                    />
                    <span className={styles['item-label']}>{label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={styles['footer']}>
          {user}
          {onSignOut === undefined ? undefined : (
            <button
              type="button"
              className={styles['sign-out']}
              onClick={onSignOut}
              title="登出"
            >
              <LogOut
                aria-hidden="true"
                size={ICON_SIZE.list}
                strokeWidth={ICON_STROKE_WIDTH}
                absoluteStrokeWidth
              />
              <span className={styles['sign-out-label']}>登出</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
