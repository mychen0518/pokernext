/**
 * @fileoverview `SearchInput` from DESIGN.md §4: a 48px search box with a
 * search icon on the left and a clear button on the right.
 */

import {Search, X} from 'lucide-react';
import {useRef} from 'react';
import type {InputHTMLAttributes} from 'react';

import {classNames} from './class_names';
import {CONTROL_CLASS} from './field';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import styles from './search_input.module.css';

/** Props for {@link SearchInput}. */
export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> {
  /** Accessible name, such as 搜尋到訪名單; the box has no visible label. */
  label: string;
  value: string;
  /** Called with the new text on typing, and with `''` on clear. */
  onValueChange: (value: string) => void;
  /** Accessible name of the clear button. */
  clearLabel?: string;
}

/**
 * Renders a controlled search box. The clear button appears once there is
 * text to clear and returns focus to the box.
 */
export function SearchInput({
  label,
  value,
  onValueChange,
  clearLabel = '清除搜尋',
  className,
  ...rest
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function clear() {
    onValueChange('');
    inputRef.current?.focus();
  }

  return (
    <div className={styles['search']}>
      <Search
        className={styles['icon']}
        aria-hidden="true"
        size={ICON_SIZE.list}
        strokeWidth={ICON_STROKE_WIDTH}
        absoluteStrokeWidth
      />
      <input
        {...rest}
        ref={inputRef}
        type="search"
        aria-label={label}
        className={classNames(CONTROL_CLASS, styles['input'], className)}
        value={value}
        onChange={event => onValueChange(event.target.value)}
      />
      {value === '' ? undefined : (
        <button
          type="button"
          className={styles['clear']}
          aria-label={clearLabel}
          onClick={clear}
        >
          <X
            aria-hidden="true"
            size={ICON_SIZE.list}
            strokeWidth={ICON_STROKE_WIDTH}
            absoluteStrokeWidth
          />
        </button>
      )}
    </div>
  );
}
