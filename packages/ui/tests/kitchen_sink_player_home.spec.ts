/**
 * @fileoverview Visual regression for the player home composed in the
 * kitchen-sink (DESIGN.md §3.1): Alex's Jeju trip and the empty state at the
 * phone viewport, and the 480px centred container at the desktop viewport.
 */

import {expect, test} from '@playwright/test';

import {openKitchenSinkPage} from './kitchen_sink';

for (const state of ['ready', 'empty']) {
  test(`player home (${state}) looks like the approved screenshot`, async ({
    page,
  }) => {
    await openKitchenSinkPage(page, 'player-home', {state});
    await expect(page).toHaveScreenshot(`player-home-${state}.png`);
  });
}

test('player home with a trip scrolled to the end looks like the approved screenshot', async ({
  page,
  viewport,
}) => {
  test.skip(
    viewport === null || viewport.width > 768,
    'only the phone scrolls',
  );
  await openKitchenSinkPage(page, 'player-home', {state: 'ready'});
  // The navigation sticks to the viewport, so scroll instead of a full-page
  // capture to show the content end above it.
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect(page).toHaveScreenshot('player-home-ready-end.png');
});
