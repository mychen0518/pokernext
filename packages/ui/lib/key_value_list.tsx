/**
 * @fileoverview `KeyValueList` from DESIGN.md §4: label/value pairs, either
 * `inline` (160px label column, 40px rows with dividers), `stacked` (label
 * above value) or `compact` (`label：value` on one `body-sm` line, for
 * TodoCard).
 */

import {Copy} from 'lucide-react';
import type {ReactNode} from 'react';

import {classNames} from './class_names';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import styles from './key_value_list.module.css';

/** Layout of a {@link KeyValueList}. */
export type KeyValueListVariant = 'stacked' | 'inline' | 'compact';

/** One label/value pair of a {@link KeyValueList}. */
export interface KeyValueItem {
  readonly label: string;
  readonly value: ReactNode;
  /** Sets the value in `mono`, for IDs and UUIDs. */
  readonly mono?: boolean;
  /**
   * Text copied by a copy button after the value, for long IDs such as a
   * POKERNEXT UUID. No button without it.
   */
  readonly copyValue?: string;
  /** Optional trailing action, such as a ghost 檢視確認單 Button. */
  readonly action?: ReactNode;
}

/** Props for {@link KeyValueList}. */
export interface KeyValueListProps {
  items: readonly KeyValueItem[];
  variant?: KeyValueListVariant;
}

/** Copies text to the clipboard where the browser allows it. */
function copyToClipboard(text: string): void {
  void navigator.clipboard?.writeText(text);
}

/** Renders label/value pairs as a description list. */
export function KeyValueList({items, variant = 'inline'}: KeyValueListProps) {
  return (
    <dl className={classNames(styles['list'], styles[variant])}>
      {items.map(item => (
        <div key={item.label} className={styles['row']}>
          <dt className={styles['label']}>{item.label}</dt>
          <dd className={styles['value-cell']}>
            <span
              className={classNames(
                styles['value'],
                item.mono && styles['mono'],
              )}
            >
              {item.value}
            </span>
            {item.copyValue === undefined ? undefined : (
              <button
                type="button"
                className={styles['copy']}
                aria-label={`複製${item.label}`}
                title={`複製${item.label}`}
                onClick={() => copyToClipboard(item.copyValue ?? '')}
              >
                <Copy
                  aria-hidden="true"
                  size={ICON_SIZE.list}
                  strokeWidth={ICON_STROKE_WIDTH}
                  absoluteStrokeWidth
                />
              </button>
            )}
            {item.action}
          </dd>
        </div>
      ))}
    </dl>
  );
}
