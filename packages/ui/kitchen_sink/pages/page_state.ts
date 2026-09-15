/**
 * @fileoverview Reads the `state` query of a kitchen-sink page into a data
 * container state, so one page can be shown loading, empty, failed or ready.
 */

import type {DataState} from '../../index';

const DATA_STATES: readonly DataState[] = [
  'loading',
  'empty',
  'error',
  'ready',
];

/** Returns the `state` query as a DataState, `ready` when absent or unknown. */
export function readDataState(params: URLSearchParams): DataState {
  const value = params.get('state');
  return DATA_STATES.find(state => state === value) ?? 'ready';
}
