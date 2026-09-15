/**
 * @fileoverview The four states every data container renders (DESIGN.md §5).
 */

/**
 * State of a data container such as DataTable or ListPanel: `loading` shows
 * skeleton rows, `empty` an EmptyState with a reason, `error` a failure
 * notice, `ready` the data. A `ready` container with no data renders as
 * `empty`, so an empty table or a bare 0 never shows.
 */
export type DataState = 'loading' | 'empty' | 'error' | 'ready';
