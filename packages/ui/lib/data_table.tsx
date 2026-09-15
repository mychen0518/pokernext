/**
 * @fileoverview `DataTable` from DESIGN.md §4: a table of at most six
 * columns with dense (48px) or regular (64px) rows, and its loading, empty,
 * error and ready states.
 */

import type {LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';

import {classNames} from './class_names';
import {ErrorState, LOADING_LABEL, SkeletonBar} from './container_states';
import type {ContainerErrorProps} from './container_states';
import styles from './data_table.module.css';
import type {DataState} from './data_state';
import {EmptyState} from './empty_state';
import hidden from './visually_hidden.module.css';

/** DESIGN.md §3.2: more information goes into a column's second line. */
const MAX_COLUMNS = 6;

/** Number of skeleton rows while loading (DESIGN.md §4). */
const SKELETON_ROWS = 5;

/** Row height: `dense` 48px single-line rows, `regular` 64px two-line rows. */
export type DataTableDensity = 'dense' | 'regular';

/** One column of a {@link DataTable}. */
export interface DataTableColumn<Row> {
  readonly id: string;
  readonly header: string;
  /**
   * The cell's first line. A status column returns a `StatusDot`; an action
   * column a `Button` with `variant="secondary"` and `size="sm"`.
   */
  readonly cell: (row: Row) => ReactNode;
  /** Optional second line in `body-sm`, `--pn-text-2`. */
  readonly secondary?: (row: Row) => ReactNode;
  /** Sets the first line in `mono`, for IDs such as `TR-260911-028`. */
  readonly mono?: boolean;
}

/** Props for {@link DataTable}. */
export interface DataTableProps<Row> extends ContainerErrorProps {
  /** Accessible name of the table, such as 今日到訪. */
  label: string;
  /** Up to six columns; the first is set in bold. */
  columns: ReadonlyArray<DataTableColumn<Row>>;
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  state: DataState;
  density?: DataTableDensity;
  /** Why there are no rows, such as 今日沒有預計到訪的行程. */
  emptyReason: ReactNode;
  emptyIcon?: LucideIcon;
  /** Optional follow-up in the empty state, such as 清除搜尋. */
  emptyAction?: ReactNode;
}

/**
 * Renders a data table. An empty or failed table shows an EmptyState or
 * error state in its place, never a header over no rows.
 */
export function DataTable<Row>({
  label,
  columns,
  rows,
  rowKey,
  state,
  density = 'regular',
  emptyReason,
  emptyIcon,
  emptyAction,
  errorReason,
  onRetry,
}: DataTableProps<Row>) {
  if (columns.length > MAX_COLUMNS) {
    throw new Error(
      `DataTable "${label}" has ${columns.length} columns; DESIGN.md §3.2 ` +
        `allows ${MAX_COLUMNS}. Merge the extra data into a second line.`,
    );
  }
  if (state === 'error') {
    return <ErrorState errorReason={errorReason} onRetry={onRetry} />;
  }
  if (state === 'empty' || (state === 'ready' && rows.length === 0)) {
    return (
      <EmptyState reason={emptyReason} icon={emptyIcon} action={emptyAction} />
    );
  }
  const loading = state === 'loading';
  return (
    <div className={styles['scroll']}>
      <table
        className={classNames(styles['table'], styles[density])}
        aria-label={label}
        aria-busy={loading || undefined}
      >
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.id} scope="col" className={styles['header']}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({length: SKELETON_ROWS}, (_, index) => (
                <tr key={index} className={styles['row']}>
                  {columns.map((column, columnIndex) => (
                    <td key={column.id} className={styles['cell']}>
                      {index === 0 && columnIndex === 0 ? (
                        <span className={hidden['visually-hidden']}>
                          {LOADING_LABEL}
                        </span>
                      ) : undefined}
                      <SkeletonBar
                        size={columnIndex === 0 ? 'wide' : 'medium'}
                      />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map(row => (
                <tr key={rowKey(row)} className={styles['row']}>
                  {columns.map(column => (
                    <td key={column.id} className={styles['cell']}>
                      <span
                        className={classNames(
                          styles['primary'],
                          column.mono && styles['mono'],
                        )}
                      >
                        {column.cell(row)}
                      </span>
                      {column.secondary === undefined ? undefined : (
                        <span className={styles['secondary']}>
                          {column.secondary(row)}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
