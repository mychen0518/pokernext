/**
 * @fileoverview Visual regression for the base kitchen-sink page: tokens and
 * every variant and state of the 00a base components. Button hover and
 * focus-visible are real CSS states, forced through the Chrome DevTools
 * Protocol for the capture, so the component needs no catalogue-only API.
 */

import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {
  openKitchenSinkPage,
  skipScreenshotsWithoutBaselines,
} from './kitchen_sink';

skipScreenshotsWithoutBaselines();

/** Pseudo-classes the Button section shows as columns of the same name. */
const FORCED_STATES = ['hover', 'focus-visible'] as const;

/**
 * Forces `:hover` or `:focus-visible` on every Button in the specimen
 * column captioned with that state's name.
 */
async function forceButtonStates(page: Page): Promise<void> {
  const session = await page.context().newCDPSession(page);
  await session.send('DOM.enable');
  await session.send('CSS.enable');
  const {root} = await session.send('DOM.getDocument', {depth: -1});
  for (const state of FORCED_STATES) {
    // Tag the buttons whose specimen caption names the state, so the
    // protocol can find them by selector.
    const tagged = await page.evaluate(caption => {
      const buttons = Array.from(document.querySelectorAll('figure'))
        .filter(
          figure => figure.querySelector('figcaption')?.textContent === caption,
        )
        .flatMap(figure => Array.from(figure.querySelectorAll('button')));
      for (const button of buttons) {
        button.setAttribute('data-forced-state', caption);
      }
      return buttons.length;
    }, state);
    expect(tagged, `buttons in the ${state} column`).toBe(5);
    const {nodeIds} = await session.send('DOM.querySelectorAll', {
      nodeId: root.nodeId,
      selector: `[data-forced-state="${state}"]`,
    });
    for (const nodeId of nodeIds) {
      await session.send('CSS.forcePseudoState', {
        nodeId,
        forcedPseudoClasses: [state],
      });
    }
  }
}

test('tokens and base components look like the approved screenshot', async ({
  page,
}) => {
  await openKitchenSinkPage(page, 'base');
  await forceButtonStates(page);
  await expect(page).toHaveScreenshot('base.png', {fullPage: true});
});
