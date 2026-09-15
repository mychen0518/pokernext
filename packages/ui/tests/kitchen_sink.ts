/**
 * @fileoverview Playwright helper for opening a kitchen-sink page in a
 * settled, screenshot-ready state.
 */

import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';

/**
 * Opens `/?page=<id>` (plus any extra query such as `{state: 'empty'}`) and
 * waits until the page has rendered and its fonts have loaded.
 */
export async function openKitchenSinkPage(
  page: Page,
  id: string,
  query: Readonly<Record<string, string>> = {},
): Promise<void> {
  const search = new URLSearchParams({page: id, ...query});
  await page.goto(`/?${search.toString()}`);
  await expect(page.locator(`[data-kitchen-sink-page="${id}"]`)).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}
