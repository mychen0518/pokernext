/**
 * @fileoverview `Tabs` from DESIGN.md §4: `underline` in-page tabs with
 * optional counts and `segmented` phone tabs, both following the WAI-ARIA
 * tabs pattern (one Tab stop, arrow keys move and select).
 */

'use client';

import {useId} from 'react';
import type {KeyboardEvent, ReactNode} from 'react';

import {classNames} from './class_names';
import {moveRovingFocus} from './roving_focus';
import styles from './tabs.module.css';

/**
 * Look of a tab list: `underline` for in-page tabs, `segmented` for equal
 * segments on a phone.
 */
export type TabsVariant = 'underline' | 'segmented';

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
  variant?: TabsVariant;
  items: readonly TabItem[];
  selectedId: string;
  /** Called with the tab chosen by click, arrow keys, Home or End. */
  onSelect: (id: string) => void;
  /** Content of the selected tab, rendered as its tab panel. */
  children?: ReactNode;
}

/**
 * Renders a tab list. Only the selected tab is in the Tab order;
 * ArrowLeft and ArrowRight select the previous or next tab (wrapping), Home
 * and End the first or last.
 */
export function Tabs({
  label,
  variant = 'underline',
  items,
  selectedId,
  onSelect,
  children,
}: TabsProps) {
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const tabId = (id: string) => `${baseId}-tab-${id}`;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const id = moveRovingFocus(event, {
      itemIds: items.map(item => item.id),
      currentId: selectedId,
      orientation: 'horizontal',
      wrap: true,
      elementId: tabId,
    });
    if (id !== undefined) {
      onSelect(id);
    }
  }

  return (
    <div className={classNames(styles['tabs'], styles[variant])}>
      <div
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
