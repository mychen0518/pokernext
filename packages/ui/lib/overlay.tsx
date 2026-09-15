/**
 * @fileoverview Private dialog shell shared by Modal and Drawer: scrim, panel
 * with the only shadow in the system, title row, body and action row.
 */

'use client';

import {X} from 'lucide-react';
import {useEffect, useId} from 'react';
import type {ReactNode} from 'react';

import {classNames} from './class_names';
import {ICON_SIZE, ICON_STROKE_WIDTH} from './icon';
import styles from './overlay.module.css';

/** Props shared by Modal and Drawer. */
export interface OverlayProps {
  /** Whether the dialog is shown; nothing renders while closed. */
  open: boolean;
  title: ReactNode;
  /** Called on the close button, the Escape key or a click on the scrim. */
  onClose: () => void;
  /** Footer actions, right-aligned: a secondary then a primary Button. */
  actions?: ReactNode;
  children?: ReactNode;
}

interface OverlayShellProps extends OverlayProps {
  placement: 'center' | 'end';
}

/** Renders a modal dialog either centred (Modal) or at the edge (Drawer). */
export function OverlayShell({
  open,
  title,
  onClose,
  actions,
  children,
  placement,
}: OverlayShellProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }
  return (
    <div
      className={classNames(styles['scrim'], styles[placement])}
      onClick={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={classNames(styles['panel'], styles[`panel-${placement}`])}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles['header']}>
          <h2 className={styles['title']} id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className={styles['close']}
            aria-label="關閉"
            onClick={onClose}
          >
            <X
              aria-hidden="true"
              size={ICON_SIZE.list}
              strokeWidth={ICON_STROKE_WIDTH}
              absoluteStrokeWidth
            />
          </button>
        </header>
        <div className={styles['body']}>{children}</div>
        {actions === undefined ? undefined : (
          <footer className={styles['footer']}>{actions}</footer>
        )}
      </div>
    </div>
  );
}
