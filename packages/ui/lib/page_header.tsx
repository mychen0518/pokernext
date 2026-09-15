/**
 * @fileoverview `PageHeader` from DESIGN.md §4: the page title, a one-line
 * description and a right-hand action slot.
 */

import type {ReactNode} from 'react';

import styles from './page_header.module.css';

/** Props for {@link PageHeader}. */
export interface PageHeaderProps {
  title: string;
  /** One sentence under the title. */
  description?: ReactNode;
  /** Right-hand slot: at most one `Button` with `variant="primary"`. */
  action?: ReactNode;
}

/** Renders the page title block; the title is the page's `h1`. */
export function PageHeader({title, description, action}: PageHeaderProps) {
  return (
    <header className={styles['page-header']}>
      <div className={styles['text']}>
        <h1 className={styles['title']}>{title}</h1>
        {description === undefined ? undefined : (
          <p className={styles['description']}>{description}</p>
        )}
      </div>
      {action === undefined ? undefined : (
        <div className={styles['action']}>{action}</div>
      )}
    </header>
  );
}
