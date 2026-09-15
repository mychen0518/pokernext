/**
 * @fileoverview The root layout: design tokens, the page background and the
 * viewport. `viewport-fit=cover` lets BottomNav pad the safe-area inset.
 */

import '@pokernext/ui/tokens.css';
import '@pokernext/ui/base.css';

import type {Metadata, Viewport} from 'next';
import type {ReactNode} from 'react';

/** Document metadata shared by every page. */
export const ROOT_METADATA: Metadata = {title: 'POKERNEXT'};

/** Viewport of every page. */
export const ROOT_VIEWPORT: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/** Props for {@link RootLayout}. */
export interface RootLayoutProps {
  children: ReactNode;
}

/** Renders the HTML document around every page. */
export function RootLayout({children}: RootLayoutProps) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
