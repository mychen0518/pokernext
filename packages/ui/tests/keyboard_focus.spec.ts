/**
 * @fileoverview DESIGN.md §6 keyboard gate: Tab reaches every interactive
 * element on the base kitchen-sink page, and each shows the 2px gold
 * focus-visible outline.
 */

import {expect, test} from '@playwright/test';

import {openKitchenSinkPage} from './kitchen_sink';

// --pn-gold from DESIGN.md §2.1 (#c8a86f) as the browser reports it.
const GOLD = 'rgb(200, 168, 111)';

// Items with tabindex="-1" (unselected tabs) are reached with arrow keys,
// not Tab.
const INTERACTIVE =
  'a[href]:not([tabindex="-1"]), button:not(:disabled):not([tabindex="-1"]), ' +
  'input:not(:disabled), select:not(:disabled), textarea:not(:disabled), ' +
  '[tabindex="0"]';

test('a keyboard user reaches every base control with Tab and sees a 2px gold outline', async ({
  page,
}) => {
  await openKitchenSinkPage(page, 'base');
  const expectedCount = await page.evaluate(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      element.setAttribute('data-focus-probe', String(index));
    });
    return elements.length;
  }, INTERACTIVE);
  expect(expectedCount).toBeGreaterThan(0);

  const reached: string[] = [];
  const outlines = new Map<string, string>();
  // A native date input takes several Tab stops (one per date part), so
  // allow extra presses and count each element once.
  for (let press = 0; press < expectedCount * 3; press++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      if (element === null || !element.hasAttribute('data-focus-probe')) {
        return undefined;
      }
      const style = getComputedStyle(element);
      return {
        probe: element.getAttribute('data-focus-probe') ?? '',
        outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
      };
    });
    if (focused === undefined) {
      break;
    }
    if (reached.at(-1) !== focused.probe) {
      reached.push(focused.probe);
      outlines.set(focused.probe, focused.outline);
    }
    if (reached.length === expectedCount) {
      break;
    }
  }

  expect(reached).toEqual(
    Array.from({length: expectedCount}, (_, index) => String(index)),
  );
  for (const [probe, outline] of outlines) {
    expect(outline, `element #${probe}`).toBe(`2px solid ${GOLD}`);
  }
});

test('a member switches the segmented tabs with the arrow keys', async ({
  page,
}) => {
  await openKitchenSinkPage(page, 'base');
  const tabs = page.getByRole('tablist', {name: '任務篩選'});

  await tabs.getByRole('tab', {name: '進行中'}).focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    tabs.getByRole('tab', {name: '已完成', selected: true}),
  ).toBeFocused();
  await page.keyboard.press('End');
  await expect(
    tabs.getByRole('tab', {name: '全部', selected: true}),
  ).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(
    tabs.getByRole('tab', {name: '進行中', selected: true}),
  ).toBeFocused();

  // Each segment is a full-width share of the row and a 44px touch target.
  const boxes = await tabs
    .getByRole('tab')
    .evaluateAll(elements =>
      elements.map(element => element.getBoundingClientRect()),
    );
  expect(boxes).toHaveLength(3);
  for (const box of boxes) {
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeCloseTo(boxes[0].width, 0);
  }
});
