/**
 * @fileoverview `PageGrid` from DESIGN.md §3.2: the column layout of the
 * three desktop page types, below the PageHeader.
 */

import type {ReactNode} from 'react';

import {classNames} from './class_names';
import styles from './page_grid.module.css';

/**
 * Desktop page type: `overview` (總覽頁) main 2/3 and side column 1/3,
 * `operation` (作業頁) two equal columns, `case` (案件頁) a 380px ListPanel
 * and a DetailPanel.
 */
export type PageGridVariant = 'overview' | 'operation' | 'case';

/** Props for {@link PageGrid}. */
export interface PageGridProps {
  variant: PageGridVariant;
  /** The columns, in reading order: main content first. */
  children: ReactNode;
}

/**
 * Lays out the page columns 24px apart. At 1024px and below the overview
 * side column moves under the main column.
 */
export function PageGrid({variant, children}: PageGridProps) {
  return (
    <div className={classNames(styles['page-grid'], styles[variant])}>
      {children}
    </div>
  );
}
