/**
 * @fileoverview DESIGN.md §2.2 typefaces in the app: a demo workspace page
 * renders with Noto Sans TC served from the app itself
 * (`@pokernext/ui/fonts.css`), not with a system fallback or an external font
 * host.
 */

import {expect, test} from '@playwright/test';

import {switchAccount, WORK_ORIGIN} from './support/workspaces';

test('工作區頁面以自帶的 Noto Sans TC 顯示，不向外部字體主機請求', async ({
  page,
}) => {
  await page.setViewportSize({width: 1440, height: 1024});
  const fontRequests: string[] = [];
  page.on('request', request => {
    if (request.resourceType() === 'font') {
      fontRequests.push(request.url());
    }
  });

  await page.goto(`${WORK_ORIGIN}/`);
  await switchAccount(page, '琪琪');

  const fonts = await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(resolve));
    await document.fonts.ready;
    const loaded = new Set<string>();
    document.fonts.forEach(face => {
      if (face.status === 'loaded') {
        loaded.add(face.family.replace(/^"|"$/g, ''));
      }
    });
    return {
      loaded: [...loaded],
      sansReady: document.fonts.check('16px "Noto Sans TC"'),
    };
  });
  expect(fonts.loaded).toContain('Noto Sans TC');
  expect(fonts.sansReady).toBe(true);
  expect(fontRequests).not.toEqual([]);
  expect(
    fontRequests.filter(url => new URL(url).origin !== WORK_ORIGIN),
  ).toEqual([]);
});
