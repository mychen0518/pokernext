/**
 * @fileoverview `WorkspaceShell` from DESIGN.md §3.2: the desktop frame of
 * every 合作端 and 管理端 workspace, with the Sidebar on the left, the Topbar
 * on top and the padded page content underneath.
 */

import type {ReactNode} from 'react';

import styles from './workspace_shell.module.css';

/** Props for {@link WorkspaceShell}. */
export interface WorkspaceShellProps {
  /** The workspace {@link Sidebar}. */
  sidebar: ReactNode;
  /** The {@link Topbar}. */
  topbar: ReactNode;
  /** Page content: a PageHeader, then the page-type layout. */
  children: ReactNode;
}

/**
 * Renders the desktop workspace frame. Content is padded 32px and its blocks
 * are 24px apart; at 1024px and below the Sidebar collapses to its icon rail.
 */
export function WorkspaceShell({
  sidebar,
  topbar,
  children,
}: WorkspaceShellProps) {
  return (
    <div className={styles['shell']}>
      {sidebar}
      <div className={styles['column']}>
        {topbar}
        <main className={styles['content']}>{children}</main>
      </div>
    </div>
  );
}
