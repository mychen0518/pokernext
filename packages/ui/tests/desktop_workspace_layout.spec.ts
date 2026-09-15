/**
 * @fileoverview DESIGN.md §3.2 layout gate for the desktop workspace: fixed
 * Sidebar, Topbar and ListPanel sizes at the design width, the page-type
 * column proportions, and the collapsed layout at 1024px and below.
 */

import {expect, test} from '@playwright/test';
import type {Locator} from '@playwright/test';

import {openKitchenSinkPage} from './kitchen_sink';

/** Reads an element's bounding box, failing the test if it is not laid out. */
async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, `${locator} has a layout box`).not.toBeNull();
  // Checked non-null just above.
  return box!;
}

// The desktop workspace has no 390px layout; the mobile project skips.
test.skip(
  ({viewport}) => (viewport?.width ?? 0) < 1024,
  'desktop workspace only',
);

test('at 1440px the sidebar is 232px, the topbar 64px and the case list 380px', async ({
  page,
}) => {
  await page.setViewportSize({width: 1440, height: 1024});
  await openKitchenSinkPage(page, 'case');

  const sidebar = await boxOf(
    page.getByRole('complementary', {name: '天城合作端'}),
  );
  expect(sidebar.width).toBe(232);
  expect(sidebar.x).toBe(0);
  const topbar = await boxOf(page.getByRole('banner'));
  expect(topbar.height).toBe(64);
  expect(topbar.x).toBe(232);
  const list = await boxOf(page.getByRole('region', {name: '異動案件'}));
  expect(list.width).toBe(380);
  const detail = await boxOf(page.getByRole('region', {name: '案件詳情'}));
  expect(detail.x).toBeGreaterThan(list.x + list.width);
});

test('at 1440px the overview splits two thirds to one third, side by side', async ({
  page,
}) => {
  await page.setViewportSize({width: 1440, height: 1024});
  await openKitchenSinkPage(page, 'overview');

  const main = await boxOf(page.getByRole('region', {name: '到訪名單'}));
  const todo = await boxOf(page.getByRole('region', {name: '待辦事項'}));
  expect(todo.x).toBeGreaterThan(main.x + main.width);
  expect(todo.y).toBe(main.y);
  expect(main.width / todo.width).toBeCloseTo(2, 1);
});

test('at 1440px the operation page has two equal columns', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 1024});
  await openKitchenSinkPage(page, 'operation');

  const left = await boxOf(page.getByRole('region', {name: '玩家與行程資料'}));
  const right = await boxOf(page.getByRole('region', {name: '押金收取'}));
  expect(right.x).toBeGreaterThan(left.x + left.width);
  expect(right.width).toBe(left.width);
  const confirm = await boxOf(page.getByRole('button', {name: '確認到場報到'}));
  const collect = await boxOf(page.getByRole('button', {name: '已收到押金'}));
  expect(confirm.width).toBeGreaterThan(left.width * 0.85);
  expect(collect.width).toBe(confirm.width);
});

test('at 1024px the sidebar is an icon rail and the to-do column moves below', async ({
  page,
}) => {
  await page.setViewportSize({width: 1024, height: 1024});
  await openKitchenSinkPage(page, 'overview');

  const sidebar = page.getByRole('complementary', {name: '天城合作端'});
  const rail = await boxOf(sidebar);
  expect(rail.width).toBeLessThanOrEqual(80);
  // Nav labels stay in the accessibility tree but take no visible space.
  const link = await boxOf(sidebar.getByRole('link', {name: '工作總覽'}));
  expect(link.width).toBeLessThanOrEqual(rail.width);

  const main = await boxOf(page.getByRole('region', {name: '到訪名單'}));
  const todo = await boxOf(page.getByRole('region', {name: '待辦事項'}));
  expect(main.x).toBeGreaterThanOrEqual(rail.width);
  expect(todo.y).toBeGreaterThanOrEqual(main.y + main.height);
  expect(todo.x).toBe(main.x);
  expect(todo.width).toBe(main.width);
});

test('at 1280px the sidebar is still fully expanded', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 1024});
  await openKitchenSinkPage(page, 'overview');

  const sidebar = await boxOf(
    page.getByRole('complementary', {name: '天城合作端'}),
  );
  expect(sidebar.width).toBe(232);
  const main = await boxOf(page.getByRole('region', {name: '到訪名單'}));
  const todo = await boxOf(page.getByRole('region', {name: '待辦事項'}));
  expect(todo.x).toBeGreaterThan(main.x + main.width);
});
