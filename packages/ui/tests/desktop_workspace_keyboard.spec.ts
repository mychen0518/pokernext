/**
 * @fileoverview DESIGN.md §6 keyboard gate for the desktop workspace: Tabs
 * switch with the arrow keys, and a ListItem can be picked without a mouse.
 */

import {expect, test} from '@playwright/test';

import {openKitchenSinkPage} from './kitchen_sink';

// The desktop workspace has no 390px layout; the mobile project skips.
test.skip(
  ({viewport}) => (viewport?.width ?? 0) < 1024,
  'desktop workspace only',
);

test('a partner switches the overview tabs with the arrow keys', async ({
  page,
}) => {
  await openKitchenSinkPage(page, 'overview');
  const tabs = page.getByRole('tablist', {name: '到訪名單'});
  const table = page.getByRole('table');

  await tabs.getByRole('tab', {name: '今日到訪'}).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab', {name: '在島玩家'})).toBeFocused();
  await expect(
    tabs.getByRole('tab', {name: '在島玩家', selected: true}),
  ).toBeVisible();
  await expect(table.getByText('LIN, MAY')).toBeVisible();
  await expect(table.getByText('CHEN, ALEX')).toHaveCount(0);

  await page.keyboard.press('ArrowRight');
  await expect(
    tabs.getByRole('tab', {name: '今日退房', selected: true}),
  ).toBeFocused();
  await expect(page.getByText('今日沒有退房的行程')).toBeVisible();

  // Arrow keys wrap around; Home and End jump to the ends.
  await page.keyboard.press('ArrowRight');
  await expect(
    tabs.getByRole('tab', {name: '今日到訪', selected: true}),
  ).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(
    tabs.getByRole('tab', {name: '今日退房', selected: true}),
  ).toBeFocused();
  await page.keyboard.press('Home');
  await expect(
    tabs.getByRole('tab', {name: '今日到訪', selected: true}),
  ).toBeFocused();
  await expect(table.getByText('CHEN, ALEX')).toBeVisible();
});

test('the tab list is a single Tab stop on the selected tab', async ({
  page,
}) => {
  await openKitchenSinkPage(page, 'case');
  const tabs = page.getByRole('tablist', {name: '案件狀態'});

  await page.getByRole('searchbox', {name: '搜尋異動案件'}).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(
    tabs.getByRole('tab', {name: /執行中/, selected: true}),
  ).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  const focusStayedInTabs = await tabs.evaluate(list =>
    list.contains(document.activeElement),
  );
  expect(focusStayedInTabs).toBe(false);
});

test('a partner picks a change request from the list with the keyboard', async ({
  page,
}) => {
  await openKitchenSinkPage(page, 'case');
  const list = page.getByRole('listbox', {name: '異動案件'});
  const detail = page.getByRole('region', {name: '案件詳情'});
  await expect(detail.getByRole('heading', {name: '取消行程'})).toBeVisible();

  // Tab from the search box lands on the selected item.
  await page.getByRole('searchbox', {name: '搜尋異動案件'}).focus();
  await page.keyboard.press('Tab');
  await expect(
    list.getByRole('option', {name: /取消行程/, selected: true}),
  ).toBeFocused();

  // Arrow keys move focus without changing the selection.
  await page.keyboard.press('ArrowDown');
  await expect(list.getByRole('option', {name: /續住申請/})).toBeFocused();
  await expect(detail.getByRole('heading', {name: '取消行程'})).toBeVisible();

  // Enter selects the focused item and opens its detail.
  await page.keyboard.press('Enter');
  await expect(
    list.getByRole('option', {name: /續住申請/, selected: true}),
  ).toBeFocused();
  await expect(detail.getByRole('heading', {name: '續住申請'})).toBeVisible();

  // Space selects too.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press(' ');
  await expect(
    list.getByRole('option', {name: /取消行程/, selected: true}),
  ).toBeFocused();
  await expect(detail.getByRole('heading', {name: '取消行程'})).toBeVisible();
});
