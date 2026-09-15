/**
 * @fileoverview `Textarea` from DESIGN.md §4: a labelled multi-line box with
 * the character count at the bottom right when a limit is set.
 */

import {useId, useState} from 'react';
import type {ChangeEvent, TextareaHTMLAttributes} from 'react';

import {classNames} from './class_names';
import {CONTROL_CLASS, CONTROL_INVALID_CLASS, Field} from './field';
import type {FieldLabelProps} from './field';
import styles from './textarea.module.css';

/** Props for {@link Textarea}. */
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldLabelProps {}

/** Renders a labelled multi-line text input. */
export function Textarea({
  label,
  labelPosition,
  error,
  id,
  className,
  value,
  defaultValue,
  maxLength,
  onChange,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const errorId = `${controlId}-error`;
  const invalid = error !== undefined;
  const [uncontrolledLength, setUncontrolledLength] = useState(
    String(defaultValue ?? '').length,
  );
  const length =
    value === undefined ? uncontrolledLength : String(value).length;

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setUncontrolledLength(event.target.value.length);
    onChange?.(event);
  }

  return (
    <Field
      label={label}
      labelPosition={labelPosition}
      error={error}
      controlId={controlId}
      errorId={errorId}
      meta={maxLength === undefined ? undefined : `${length} / ${maxLength}`}
    >
      <textarea
        {...rest}
        id={controlId}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={handleChange}
        className={classNames(
          CONTROL_CLASS,
          styles['textarea'],
          invalid && CONTROL_INVALID_CLASS,
          className,
        )}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
      />
    </Field>
  );
}
