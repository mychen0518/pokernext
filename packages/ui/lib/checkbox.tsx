/**
 * @fileoverview `Checkbox` from DESIGN.md §4: a 20px box that fills gold with
 * a dark tick when checked, for confirmations such as 本人核對一致.
 */

import {Check} from 'lucide-react';
import type {InputHTMLAttributes, ReactNode} from 'react';

import styles from './checkbox.module.css';
import {classNames} from './class_names';

/** Props for {@link Checkbox}. Fact confirmations are never pre-checked. */
export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label: ReactNode;
}

/** Renders a labelled checkbox. */
export function Checkbox({label, className, ...rest}: CheckboxProps) {
  return (
    <label className={styles['checkbox']}>
      <input
        {...rest}
        type="checkbox"
        className={classNames(styles['input'], className)}
      />
      <span className={styles['box']} aria-hidden="true">
        <Check
          className={styles['tick']}
          size={14}
          strokeWidth={2.5}
          absoluteStrokeWidth
        />
      </span>
      <span>{label}</span>
    </label>
  );
}
