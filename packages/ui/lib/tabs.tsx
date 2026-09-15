/**
 * @fileoverview `Tabs` from DESIGN.md §4, `underline` variant: in-page tabs
 * with optional counts, following the WAI-ARIA tabs pattern (one Tab stop,
 * arrow keys move and select).
 */

'use client';

import {useId, useRef} from 'react';
import type {KeyboardEvent, ReactNode} from 'react';

import {classNames} from './class_names';
import styles from './tabs.module.css';

/** One tab of a {@link Tabs} list. */
export interface TabItem {
  readonly id: string;
  readonly label: string;
  /** Optional count after the label, such as `03`. */
  readonly count?: string;
}

/** Props for {@link Tabs}. */
export interface TabsProps {
  /** Accessible name of the tab list, such as 案件狀態. */
  label: string;
  items: readonly TabItem[];
  selectedId: string;
  /** Called with the tab chosen by click, arrow keys, Home or End. */
  onSelect: (id: string) => void;
  /** Content of the selected tab, rendered as its tab panel. */
  children?: ReactNode;
}

/**
 * Renders an underline tab list. Only the selected tab is in the Tab order;
 * ArrowLeft and ArrowRight select the previous or next tab (wrapping), Home
 * and End the first or last.
 */
export function Tabs({
  label,
  items,
  selectedId,
  onSelect,
  children,
}: TabsProps) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const panelId = `${baseId}-panel`;
  const tabId = (id: string) => `${baseId}-tab-${id}`;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = items.findIndex(item => item.id === selectedId);
    const last = items.length - 1;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = current >= last ? 0 : current + 1;
        break;
      case 'ArrowLeft':
        next = current <= 0 ? last : current - 1;
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
    const target = items[next];
    onSelect(target.id);
    listRef.current
      ?.querySelector<HTMLButtonElement>(`[id="${tabId(target.id)}"]`)
      ?.focus();
  }

  return (
    <div className={styles['tabs']}>
      <div
        ref={listRef}
        className={styles['list']}
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        {items.map(item => {
          const selected = item.id === selectedId;
          return (
            <button
              key={item.id}
              id={tabId(item.id)}
              type="button"
              role="tab"
              className={classNames(
                styles['tab'],
                selected && styles['selected'],
              )}
              aria-selected={selected}
              aria-controls={children === undefined ? undefined : panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(item.id)}
            >
              {item.label}
              {item.count === undefined ? undefined : (
                <span className={styles['count']}>{item.count}</span>
              )}
            </button>
          );
        })}
      </div>
      {children === undefined ? undefined : (
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={tabId(selectedId)}
          className={styles['panel']}
        >
          {children}
        </div>
      )}
    </div>
  );
}
