/**
 * @fileoverview Visual regression for the base kitchen-sink page: tokens and
 * every variant and state of the 00a base components.
 */

import {expect, test} from '@playwright/test';

import {openKitchenSinkPage} from './kitchen_sink';

test('tokens and base components look like the approved screenshot', async ({
  page,
}) => {
  await openKitchenSinkPage(page, 'base');
  await expect(page).toHaveScreenshot('base.png', {fullPage: true});
});
