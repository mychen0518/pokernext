/**
 * @fileoverview `Button` from DESIGN.md §4: five variants, three heights and
 * a loading state that swaps the label for a spinner.
 */

import {ChevronRight, LoaderCircle} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type {ButtonHTMLAttributes, ReactNode} from 'react';

import styles from './button.module.css';
import {classNames} from './class_names';
import {ICON_STROKE_WIDTH} from './icon';

/** Visual role of a button; at most one `primary` per block. */
export type ButtonVariant =
  'primary' | 'secondary' | 'outline-gold' | 'ghost' | 'danger';

/**
 * Button height: `sm` 32px (table actions), `md` 44px (desktop default),
 * `lg` 52px (mobile).
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Props for {@link Button}. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretches the button to the width of its container. */
  fullWidth?: boolean;
  /** Replaces the label with a spinner and blocks further presses. */
  loading?: boolean;
  /** Optional outline icon from `lucide-react`, drawn before the label. */
  icon?: LucideIcon;
  children: ReactNode;
}

/**
 * Renders a DESIGN.md `Button`. Hover and focus-visible can also be pinned
 * with `data-state="hover" | "focus-visible"` so a static catalogue page can
 * show every state at once.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon: Icon,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = classNames(
    styles['button'],
    styles[variant],
    styles[size],
    fullWidth && styles['full-width'],
    loading && styles['loading'],
    className,
  );
  return (
    <button
      {...rest}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {Icon === undefined ? undefined : (
        <Icon
          className={styles['icon']}
          aria-hidden="true"
          size={20}
          strokeWidth={ICON_STROKE_WIDTH}
          absoluteStrokeWidth
        />
      )}
      <span className={styles['label']}>{children}</span>
      {variant === 'ghost' ? (
        <ChevronRight
          className={styles['chevron']}
          aria-hidden="true"
          size={18}
          strokeWidth={ICON_STROKE_WIDTH}
          absoluteStrokeWidth
        />
      ) : undefined}
      {loading ? (
        <LoaderCircle
          className={styles['spinner']}
          aria-hidden="true"
          size={20}
          strokeWidth={ICON_STROKE_WIDTH}
          absoluteStrokeWidth
        />
      ) : undefined}
    </button>
  );
}
