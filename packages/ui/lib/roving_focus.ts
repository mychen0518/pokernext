/**
 * @fileoverview Roving focus shared by `Tabs` and `ListPanel` (DESIGN.md §4
 * keyboard rules): one Tab stop per list, arrow keys move between items,
 * Home and End jump to the ends.
 */

import type {KeyboardEvent} from 'react';

/** Options for {@link moveRovingFocus}. */
export interface RovingFocusOptions {
  /** Ids of the items, in DOM order. */
  readonly itemIds: readonly string[];
  /** Id of the item that has the Tab stop now, if any. */
  readonly currentId?: string;
  /** `horizontal` moves with ← →, `vertical` with ↑ ↓. */
  readonly orientation: 'horizontal' | 'vertical';
  /** Whether moving past either end wraps to the other end. */
  readonly wrap: boolean;
  /** DOM `id` of an item's element, so focus can move to it. */
  readonly elementId: (id: string) => string;
}

const PREVIOUS_KEY = {horizontal: 'ArrowLeft', vertical: 'ArrowUp'} as const;
const NEXT_KEY = {horizontal: 'ArrowRight', vertical: 'ArrowDown'} as const;

/**
 * Handles a key press on a roving-focus list: moves focus to the item the
 * key points at and returns its id, or returns `undefined` (and leaves the
 * event alone) when the key does not move.
 */
export function moveRovingFocus(
  event: KeyboardEvent<HTMLElement>,
  {itemIds, currentId, orientation, wrap, elementId}: RovingFocusOptions,
): string | undefined {
  const current = currentId === undefined ? -1 : itemIds.indexOf(currentId);
  const last = itemIds.length - 1;
  let next: number;
  switch (event.key) {
    case NEXT_KEY[orientation]:
      next = current >= last ? (wrap ? 0 : last) : current + 1;
      break;
    case PREVIOUS_KEY[orientation]:
      next = current <= 0 ? (wrap ? last : 0) : current - 1;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = last;
      break;
    default:
      return undefined;
  }
  event.preventDefault();
  const id = itemIds[next];
  if (id === undefined) {
    return undefined;
  }
  event.currentTarget
    .querySelector<HTMLElement>(`[id="${elementId(id)}"]`)
    ?.focus();
  return id;
}
