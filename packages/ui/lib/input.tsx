/**
 * @fileoverview `Input` from DESIGN.md §4: a labelled text box with an
 * optional prefix (such as a currency) and an error line.
 */

import {useId} from 'react';
import type {InputHTMLAttributes, ReactNode} from 'react';

import {classNames} from './class_names';
import {CONTROL_CLASS, CONTROL_INVALID_CLASS, Field} from './field';
import type {FieldLabelProps} from './field';
import styles from './input.module.css';

/** Props for {@link Input}. */
export interface InputProps
  extends
    Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'>,
    FieldLabelProps {
  /** Fixed text in front of the value, such as `KRW`. */
  prefix?: ReactNode;
}

/** Renders a labelled single-line text input. */
export function Input({
  label,
  labelPosition,
  error,
  prefix,
  id,
  className,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const errorId = `${controlId}-error`;
  const invalid = error !== undefined;
  const hasPrefix = prefix !== undefined;
  const input = (
    <input
      {...rest}
      id={controlId}
      className={classNames(
        CONTROL_CLASS,
        invalid && CONTROL_INVALID_CLASS,
        hasPrefix && styles['with-prefix'],
        className,
      )}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
    />
  );
  return (
    <Field
      label={label}
      labelPosition={labelPosition}
      error={error}
      controlId={controlId}
      errorId={errorId}
    >
      {hasPrefix ? (
        <div className={styles['prefixed']}>
          <span
            className={classNames(
              styles['prefix'],
              invalid && styles['prefix-invalid'],
            )}
          >
            {prefix}
          </span>
          {input}
        </div>
      ) : (
        input
      )}
    </Field>
  );
}
