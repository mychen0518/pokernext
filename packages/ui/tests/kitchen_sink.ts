/**
 * @fileoverview Playwright helpers for the kitchen-sink: opening a page in a
 * settled, screenshot-ready state, and skipping screenshot comparisons on
 * operating systems that have no committed baselines.
 */

import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

/**
 * Operating systems (`process.platform`) with committed screenshot
 * baselines. Fonts render differently per OS, so each keeps its own PNGs.
 * To add one, list it here and run `test:e2e:update` on that OS.
 */
export const SCREENSHOT_BASELINE_PLATFORMS: readonly string[] = ['win32'];

/**
 * Skips every test in the calling spec file when this OS has no committed
 * baselines, so `pnpm test` stays green there while keyboard, layout and
 * accessibility specs still run. Call it at the top level of a screenshot
 * spec.
 */
export function skipScreenshotsWithoutBaselines(): void {
  test.skip(
    !SCREENSHOT_BASELINE_PLATFORMS.includes(process.platform),
    `No screenshot baselines for ${process.platform}; they are committed ` +
      `for ${SCREENSHOT_BASELINE_PLATFORMS.join(', ')} only (fonts differ ` +
      'per OS, see packages/ui/README.md).',
  );
}

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
    // A font subset starts loading when layout first needs a glyph in its
    // unicode-range; after a frame every rendered run has asked for its
    // subsets, so `ready` waits for all of them.
    await new Promise(resolve => requestAnimationFrame(resolve));
    await document.fonts.ready;
  });
}

/**
 * Returns the families of the web fonts the page has finished loading,
 * without quotes. A family appears only when its glyphs were drawn: each
 * face covers a `unicode-range` and loads when text in that range is laid
 * out.
 */
export async function loadedFontFamilies(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    await document.fonts.ready;
    const families = new Set<string>();
    document.fonts.forEach(face => {
      if (face.status === 'loaded') {
        families.add(face.family.replace(/^"|"$/g, ''));
      }
    });
    return [...families];
  });
}
