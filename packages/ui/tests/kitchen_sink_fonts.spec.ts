/**
 * @fileoverview DESIGN.md §2.2 typefaces: the kitchen-sink renders with the
 * self-hosted Noto Sans TC and Noto Serif TC from `@pokernext/ui/fonts.css`,
 * not with a system fallback such as Microsoft JhengHei.
 */

import {expect, test} from '@playwright/test';

import {loadedFontFamilies, openKitchenSinkPage} from './kitchen_sink';

test('設計系統頁面以 Noto Sans TC 與 Noto Serif TC 顯示', async ({page}) => {
  // The base page's type scale shows every sans and serif type token.
  await openKitchenSinkPage(page, 'base');

  expect(await loadedFontFamilies(page)).toEqual(
    expect.arrayContaining(['Noto Sans TC', 'Noto Serif TC']),
  );
  // `check` is true only when every face covering its text (a space by
  // default) has loaded. Fontsource subsets overlap on some Latin code points,
  // so the serif check names the display-xl sample 濟州島 instead.
  expect(
    await page.evaluate(() => [
      document.fonts.check('16px "Noto Sans TC"'),
      document.fonts.check('700 64px "Noto Serif TC"', '濟州島'),
    ]),
  ).toEqual([true, true]);
});
