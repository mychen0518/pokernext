/**
 * @fileoverview DESIGN.md §3.1 and §6 gates for the player home at the phone
 * viewport: touch targets, 200% text and the five-item bottom navigation.
 */

import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {openKitchenSinkPage} from './kitchen_sink';

// --pn-gold-bright from DESIGN.md §2.1 (#e7c076) as the browser reports it.
const GOLD_BRIGHT = 'rgb(231, 192, 118)';

/** DESIGN.md §3.1: the five fixed items, in order. */
const NAV_ITEMS = ['首頁', '我的行程', '到場碼', '我的積分', '我的帳戶'];

const MIN_TOUCH_TARGET = 44;

const INTERACTIVE =
  'a[href], button, input, select, textarea, [role="button"], [tabindex]';

const STATES = ['ready', 'empty'];

// Player home is phone-first: these gates run at the 390×844 viewport.
test.skip(
  ({viewport}) => viewport === null || viewport.width > 768,
  'player home is phone-first',
);

/**
 * Box of one text run, in page coordinates. Vertically it spans the run's
 * line boxes (each line's `line-height` around the line's centre), the space
 * layout gives the text. The font's content area is taller than a tight
 * display `line-height` (Noto Serif TC's ascent plus descent is about 1.45em
 * against 1.1), so it reaches into the neighbouring lines without any glyph
 * touching them.
 */
interface TextBox {
  readonly text: string;
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly inNavigation: boolean;
  /** Why the run is not fully visible, if it is not. */
  readonly clippedBy?: string;
}

/**
 * Doubles the text size the way a 200% text setting does: the root font
 * size and every element's computed font size (the tokens are in px, so
 * scaling the root alone would change nothing).
 */
async function doubleTextSize(page: Page): Promise<void> {
  await page.evaluate(() => {
    const elements = [
      document.documentElement,
      ...Array.from(document.body.querySelectorAll<HTMLElement>('*')),
    ];
    const sizes = elements.map(element =>
      parseFloat(getComputedStyle(element).fontSize),
    );
    elements.forEach((element, index) => {
      element.style.setProperty('font-size', `${sizes[index] * 2}px`);
    });
  });
}

/** Lists the box of every visible text run on the page. */
async function readTextBoxes(page: Page): Promise<TextBox[]> {
  return page.evaluate(() => {
    const boxes: TextBox[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim() ?? '';
      const parent = node.parentElement;
      if (text === '' || parent === null || parent.closest('[hidden]')) {
        continue;
      }
      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        continue;
      }
      const lineHeight = parseFloat(getComputedStyle(parent).lineHeight);
      const lines = Array.from(range.getClientRects()).map(line => {
        const centre = (line.top + line.bottom) / 2;
        // `normal` line height parses as NaN: keep the content area.
        const half = Number.isNaN(lineHeight)
          ? line.height / 2
          : lineHeight / 2;
        return {top: centre - half, bottom: centre + half};
      });
      const box = {
        text,
        left: rect.left + window.scrollX,
        top: Math.min(...lines.map(line => line.top)) + window.scrollY,
        right: rect.right + window.scrollX,
        bottom: Math.max(...lines.map(line => line.bottom)) + window.scrollY,
      };
      let clippedBy: string | undefined;
      if (
        box.left < -0.5 ||
        box.right > document.documentElement.clientWidth + 0.5
      ) {
        clippedBy = 'the viewport';
      }
      for (let el: Element | null = parent; el; el = el.parentElement) {
        const style = getComputedStyle(el);
        if (style.overflowX === 'visible' && style.overflowY === 'visible') {
          continue;
        }
        const clip = el.getBoundingClientRect();
        if (
          rect.left < clip.left - 0.5 ||
          rect.right > clip.right + 0.5 ||
          rect.top < clip.top - 0.5 ||
          rect.bottom > clip.bottom + 0.5
        ) {
          clippedBy = `<${el.tagName.toLowerCase()} class="${el.className}">`;
        }
      }
      boxes.push({
        ...box,
        inNavigation: parent.closest('nav') !== null,
        clippedBy,
      });
    }
    return boxes;
  });
}

/** Lists pairs of text runs whose boxes overlap by more than a pixel. */
function findOverlaps(boxes: readonly TextBox[]): string[] {
  const overlaps: string[] = [];
  boxes.forEach((a, i) => {
    for (const b of boxes.slice(i + 1)) {
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (width > 1 && height > 1) {
        overlaps.push(`"${a.text}" overlaps "${b.text}"`);
      }
    }
  });
  return overlaps;
}

for (const state of STATES) {
  test(`a member can tap every control on the player home (${state}): each is at least 44 by 44 px`, async ({
    page,
  }) => {
    await openKitchenSinkPage(page, 'player-home', {state});
    const controls = page.locator(INTERACTIVE);
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);
    const tooSmall: string[] = [];
    for (let index = 0; index < count; index++) {
      const control = controls.nth(index);
      const box = await control.boundingBox();
      const name =
        (await control.getAttribute('aria-label')) ??
        (await control.innerText());
      if (
        box === null ||
        box.width < MIN_TOUCH_TARGET ||
        box.height < MIN_TOUCH_TARGET
      ) {
        tooSmall.push(`${name}: ${box?.width}×${box?.height}`);
      }
    }
    expect(tooSmall).toEqual([]);
  });

  test(`player home (${state}) stays complete and unclipped at 200% text`, async ({
    page,
  }) => {
    await openKitchenSinkPage(page, 'player-home', {state});
    await doubleTextSize(page);

    const pageWidth = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client);

    const boxes = await readTextBoxes(page);
    const content = boxes.filter(box => !box.inNavigation);
    const navigation = boxes.filter(box => box.inNavigation);
    expect(content.length).toBeGreaterThan(0);
    expect(navigation.map(box => box.text)).toEqual(NAV_ITEMS);
    expect(
      boxes
        .filter(box => box.clippedBy)
        .map(b => `${b.text} by ${b.clippedBy}`),
    ).toEqual([]);
    expect(findOverlaps(content)).toEqual([]);
    expect(findOverlaps(navigation)).toEqual([]);

    // Scrolled to the end, the navigation sits below the last content line.
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    const navTop = await page
      .getByRole('navigation', {name: '玩家導覽'})
      .evaluate(nav => nav.getBoundingClientRect().top + window.scrollY);
    const contentBottom = Math.max(...content.map(box => box.bottom));
    expect(contentBottom).toBeLessThanOrEqual(navTop + 0.5);
  });

  test(`bottom navigation on the player home (${state}) has the five items with 首頁 current in gold`, async ({
    page,
  }) => {
    await openKitchenSinkPage(page, 'player-home', {state});
    const navigation = page.getByRole('navigation', {name: '玩家導覽'});
    const items = navigation.getByRole('link');
    await expect(items).toHaveText(NAV_ITEMS);

    const current = navigation.locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText('首頁');
    await expect(current).toHaveCSS('color', GOLD_BRIGHT);
    for (const name of NAV_ITEMS.slice(1)) {
      await expect(items.filter({hasText: name})).not.toHaveCSS(
        'color',
        GOLD_BRIGHT,
      );
    }

    // Pinned to the bottom of the phone screen, at least 72px tall.
    const box = await navigation.boundingBox();
    expect(box).not.toBeNull();
    if (box !== null) {
      expect(box.height).toBeGreaterThanOrEqual(72);
      expect(box.y + box.height).toBeCloseTo(844, 0);
    }
  });
}

test('player home without a trip explains why instead of showing zero or 已完成', async ({
  page,
}) => {
  await openKitchenSinkPage(page, 'player-home', {state: 'empty'});
  const text = await page.locator('body').innerText();
  expect(text).toContain('目前沒有進行中的行程');
  expect(text).toContain('尚無積分紀錄');
  expect(text).not.toMatch(/(^|[^\d,])0( 分)?($|[^\d,])/m);
  expect(text).not.toContain('已完成');
  await expect(page.locator('table')).toHaveCount(0);
});

test('Alex sees 5,000 分 available of his 30,000 分 balance, with 25,000 分 reserved for the stay', async ({
  page,
}) => {
  await openKitchenSinkPage(page, 'player-home', {state: 'ready'});
  const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  expect(text).toContain('可用積分 5,000 分');
  expect(text).toContain('已保留 25,000 分');
});
