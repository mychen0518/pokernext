/**
 * @fileoverview Private layout shared by Input, Select, DateInput and
 * Textarea: the label, the control and the error line underneath.
 */

import type {ReactNode} from 'react';

import {classNames} from './class_names';
import styles from './field.module.css';

/** Where a form label sits: `left` for desktop label/value forms, `top` on mobile. */
export type LabelPosition = 'top' | 'left';

/** Label and error props every form control accepts. */
export interface FieldLabelProps {
  label: ReactNode;
  labelPosition?: LabelPosition;
  /** Error message; when present the control gets a danger border. */
  error?: ReactNode;
}

interface FieldProps extends FieldLabelProps {
  controlId: string;
  errorId: string;
  /** Extra line under the control, right-aligned (e.g. a character count). */
  meta?: ReactNode;
  children: ReactNode;
}

/** Lays out a label, a control, and its error and meta lines. */
export function Field({
  label,
  labelPosition = 'top',
  error,
  controlId,
  errorId,
  meta,
  children,
}: FieldProps) {
  const hasFooter = error !== undefined || meta !== undefined;
  return (
    <div className={classNames(styles['field'], styles[labelPosition])}>
      <label className={styles['label']} htmlFor={controlId}>
        {label}
      </label>
      <div className={styles['control-column']}>
        {children}
        {hasFooter ? (
          <div className={styles['footer']}>
            {error === undefined ? (
              <span />
            ) : (
              <span className={styles['error']} id={errorId}>
                {error}
              </span>
            )}
            {meta === undefined ? undefined : (
              <span className={styles['meta']}>{meta}</span>
            )}
          </div>
        ) : undefined}
      </div>
    </div>
  );
}

/** Class name of the shared control box (border, fill, height, focus ring). */
export const CONTROL_CLASS = styles['control'];

/** Class name added to the control box when the field has an error. */
export const CONTROL_INVALID_CLASS = styles['invalid'];
