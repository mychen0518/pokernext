/**
 * @fileoverview `DateInput` from DESIGN.md §4: a labelled native date picker
 * in the shared control box.
 */

'use client';

import {useId} from 'react';
import type {InputHTMLAttributes} from 'react';

import {classNames} from './class_names';
import {CONTROL_CLASS, CONTROL_INVALID_CLASS, Field} from './field';
import type {FieldLabelProps} from './field';
import styles from './date_input.module.css';

/** Props for {@link DateInput}; `value` is an ISO date such as `2026-09-11`. */
export interface DateInputProps
  extends
    Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>,
    FieldLabelProps {}

/** Renders a labelled calendar date input. */
export function DateInput({
  label,
  labelPosition,
  error,
  id,
  className,
  ...rest
}: DateInputProps) {
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
      <input
        {...rest}
        type="date"
        id={controlId}
        className={classNames(
          CONTROL_CLASS,
          styles['date'],
          invalid && CONTROL_INVALID_CLASS,
          className,
        )}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
      />
    </Field>
  );
}
