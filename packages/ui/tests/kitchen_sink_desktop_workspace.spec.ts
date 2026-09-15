/**
 * @fileoverview Visual regression for the DESIGN.md §3.2 desktop page types
 * (總覽頁, 作業頁, 案件頁) at 1440, 1280 and 1024px wide, and for the four
 * states of every desktop data container.
 */

import {expect, test} from '@playwright/test';

import {openKitchenSinkPage} from './kitchen_sink';

const PAGE_TYPES = ['overview', 'operation', 'case'] as const;
const WIDTHS = [1440, 1280, 1024] as const;

// The desktop workspace has no 390px layout; the mobile project skips.
test.skip(
  ({viewport}) => (viewport?.width ?? 0) < 1024,
  'desktop workspace only',
);

for (const pageType of PAGE_TYPES) {
  for (const width of WIDTHS) {
    test(`the ${pageType} page type at ${width}px looks like the approved screenshot`, async ({
      page,
    }) => {
      await page.setViewportSize({width, height: 1024});
      await openKitchenSinkPage(page, pageType);
      await expect(page).toHaveScreenshot(`${pageType}-${width}.png`, {
        fullPage: true,
      });
    });
  }
}

test('every desktop data container state looks like the approved screenshot', async ({
  page,
}) => {
  await openKitchenSinkPage(page, 'desktop-states');
  await expect(page).toHaveScreenshot('desktop-states.png', {fullPage: true});
});
