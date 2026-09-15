/**
 * @fileoverview `Drawer` from DESIGN.md §4: a full-height dialog sliding in
 * from the end edge over a scrim.
 */

import {OverlayShell} from './overlay';
import type {OverlayProps} from './overlay';

/** Props for {@link Drawer}. */
export interface DrawerProps extends OverlayProps {}

/** Renders a side drawer dialog while `open` is true. */
export function Drawer(props: DrawerProps) {
  return <OverlayShell {...props} placement="end" />;
}
