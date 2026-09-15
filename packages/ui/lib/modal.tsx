/**
 * @fileoverview `Modal` from DESIGN.md §4: a centred dialog over a scrim.
 */

import {OverlayShell} from './overlay';
import type {OverlayProps} from './overlay';

/** Props for {@link Modal}. */
export interface ModalProps extends OverlayProps {}

/** Renders a centred modal dialog while `open` is true. */
export function Modal(props: ModalProps) {
  return <OverlayShell {...props} placement="center" />;
}
