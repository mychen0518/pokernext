/**
 * @fileoverview `Select` from DESIGN.md §4: a labelled native select in the
 * shared control box, with a chevron in place of the platform arrow.
 */

'use client';

import {ChevronDown} from 'lucide-react';
import {useId} from 'react';
import type {ReactNode, SelectHTMLAttributes} from 'react';

import {classNames} from './class_names';
import {CONTROL_CLASS, CONTROL_INVALID_CLASS, Field} from './field';
import type {FieldLabelProps} from './field';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import styles from './select.module.css';

/** Props for {@link Select}. */
export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>, FieldLabelProps {
  /** The `<option>` elements. */
  children: ReactNode;
}

/** Renders a labelled drop-down list. */
export function Select({
  label,
  labelPosition,
  error,
  id,
  className,
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const errorId = `${controlId}-error`;
  const invalid = error !== undefined;
  return (
    <Field
      label={label}
      labelPosition={labelPosition}
      error={error}
      controlId={controlId}
      errorId={errorId}
    >
      <div className={styles['wrapper']}>
        <select
          {...rest}
          id={controlId}
          className={classNames(
            CONTROL_CLASS,
            styles['select'],
            invalid && CONTROL_INVALID_CLASS,
            className,
          )}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
        >
          {children}
        </select>
        <ChevronDown
          className={styles['chevron']}
          aria-hidden="true"
          size={ICON_SIZE.list}
          strokeWidth={ICON_STROKE_WIDTH}
          absoluteStrokeWidth
        />
      </div>
    </Field>
  );
}
