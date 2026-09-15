/**
 * @fileoverview DESIGN.md §6 keyboard gate: Tab reaches every interactive
 * element on the base kitchen-sink page, and each shows the 2px gold
 * focus-visible outline.
 */

import {expect, test} from '@playwright/test';

import {openKitchenSinkPage} from './kitchen_sink';

// --pn-gold from DESIGN.md §2.1 (#c8a86f) as the browser reports it.
const GOLD = 'rgb(200, 168, 111)';

const INTERACTIVE =
  'a[href], button:not(:disabled), input:not(:disabled), ' +
  'select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';

test('Tab reaches every interactive element with a 2px gold outline', async ({
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
