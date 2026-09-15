/**
 * @fileoverview `ListPanel` and `ListItem` from DESIGN.md §4: the selectable
 * case list on the left of a 案件頁, with an optional SearchInput and its
 * loading, empty, error and ready states. Keyboard follows the WAI-ARIA
 * listbox pattern: one Tab stop, arrow keys move, Enter or Space selects.
 */

'use client';

import {ChevronRight} from 'lucide-react';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useRef,
  useState,
} from 'react';
import type {KeyboardEvent, ReactNode} from 'react';

import {classNames} from './class_names';
import {ErrorState, LOADING_LABEL, SkeletonBar} from './container_states';
import type {ContainerErrorProps} from './container_states';
import type {DataState} from './data_state';
import {EmptyState} from './empty_state';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import styles from './list_panel.module.css';
import hidden from './visually_hidden.module.css';

/** Number of skeleton items while loading. */
const SKELETON_ITEMS = 3;

interface ListSelection {
  /** Id of the item in the Tab order. */
  readonly tabStopId?: string;
  readonly selectedId?: string;
  readonly optionId: (id: string) => string;
  readonly onSelect: (id: string) => void;
  readonly onFocusItem: (id: string) => void;
}

const ListSelectionContext = createContext<ListSelection | undefined>(
  undefined,
);

/** Props for {@link ListPanel}. */
export interface ListPanelProps extends ContainerErrorProps {
  /** Accessible name of the panel and its list, such as 異動案件. */
  label: string;
  /** Optional search box above the list, normally a `SearchInput`. */
  search?: ReactNode;
  state: DataState;
  /** Id of the selected {@link ListItem}. */
  selectedId?: string;
  /** Called with an item's id when it is clicked or chosen by keyboard. */
  onSelect: (id: string) => void;
  /** Why the list is empty, such as 此狀態沒有案件. */
  emptyReason: ReactNode;
  /** The items: {@link ListItem} elements as direct children. */
  children?: ReactNode;
}

/**
 * Renders a list panel. Only one item is in the Tab order (the selected one,
 * else the first); ArrowUp and ArrowDown, Home and End move focus, Enter or
 * Space selects the focused item.
 */
export function ListPanel({
  label,
  search,
  state,
  selectedId,
  onSelect,
  emptyReason,
  errorReason,
  onRetry,
  children,
}: ListPanelProps) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string>();
  const itemIds = Children.toArray(children).flatMap(child =>
    isValidElement<ListItemProps>(child) ? [child.props.id] : [],
  );
  const optionId = (id: string) => `${baseId}-option-${id}`;
  const tabStopId = [focusedId, selectedId, itemIds[0]].find(
    id => id !== undefined && itemIds.includes(id),
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = itemIds.indexOf(tabStopId ?? '');
    const last = itemIds.length - 1;
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(current + 1, last);
        break;
      case 'ArrowUp':
        next = Math.max(current - 1, 0);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    const id = itemIds[next];
    if (id === undefined) {
      return;
    }
    setFocusedId(id);
    listRef.current
      ?.querySelector<HTMLElement>(`[id="${optionId(id)}"]`)
      ?.focus();
  }

  let body: ReactNode;
  if (state === 'error') {
    body = <ErrorState errorReason={errorReason} onRetry={onRetry} />;
  } else if (state === 'empty' || (state === 'ready' && itemIds.length === 0)) {
    body = <EmptyState reason={emptyReason} />;
  } else if (state === 'loading') {
    body = (
      <div className={styles['items']} aria-busy="true">
        <span className={hidden['visually-hidden']}>{LOADING_LABEL}</span>
        {Array.from({length: SKELETON_ITEMS}, (_, index) => (
          <div key={index} className={styles['skeleton-item']}>
            <SkeletonBar size="medium" />
            <SkeletonBar size="short" />
            <SkeletonBar size="wide" />
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <ListSelectionContext.Provider
        value={{
          tabStopId,
          selectedId,
          optionId,
          onSelect,
          onFocusItem: setFocusedId,
        }}
      >
        <div
          ref={listRef}
          className={styles['items']}
          role="listbox"
          aria-label={label}
          onKeyDown={handleKeyDown}
        >
          {children}
        </div>
      </ListSelectionContext.Provider>
    );
  }

  return (
    <section className={styles['list-panel']} aria-label={label}>
      {search === undefined ? undefined : (
        <div className={styles['search']}>{search}</div>
      )}
      {body}
    </section>
  );
}

/** Props for {@link ListItem}. */
export interface ListItemProps {
  /** Stable id, passed to `onSelect` and compared with `selectedId`. */
  id: string;
  /** Case type or subject, such as 取消行程. */
  title: string;
  /** Status `Badge` at the top right. */
  badge?: ReactNode;
  /** Second line: the person, such as CHANG, RYAN. */
  person?: ReactNode;
  /** Third line, left: the related ID in `mono`. */
  reference?: string;
  /** Third line, right: the time, such as `09/11 09:18`. */
  time?: string;
}

/** Renders one selectable item; must be a direct child of a ListPanel. */
export function ListItem({
  id,
  title,
  badge,
  person,
  reference,
  time,
}: ListItemProps) {
  const selection = useContext(ListSelectionContext);
  if (selection === undefined) {
    throw new Error('ListItem must be rendered inside a ListPanel');
  }
  const selected = selection.selectedId === id;
  const {onSelect} = selection;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
    }
  }

  return (
    <div
      id={selection.optionId(id)}
      className={classNames(styles['item'], selected && styles['selected'])}
      role="option"
      aria-selected={selected}
      tabIndex={selection.tabStopId === id ? 0 : -1}
      onClick={() => onSelect(id)}
      onFocus={() => selection.onFocusItem(id)}
      onKeyDown={handleKeyDown}
    >
      <div className={styles['content']}>
        <div className={styles['title-row']}>
          <span className={styles['title']}>{title}</span>
          {badge}
        </div>
        {person === undefined ? undefined : (
          <div className={styles['person']}>{person}</div>
        )}
        <div className={styles['meta-row']}>
          {reference === undefined ? undefined : (
            <span className={styles['reference']}>{reference}</span>
          )}
          {time === undefined ? undefined : (
            <span className={styles['time']}>{time}</span>
          )}
        </div>
      </div>
      <ChevronRight
        className={styles['chevron']}
        aria-hidden="true"
        size={ICON_SIZE.list}
        strokeWidth={ICON_STROKE_WIDTH}
        absoluteStrokeWidth
      />
    </div>
  );
}
