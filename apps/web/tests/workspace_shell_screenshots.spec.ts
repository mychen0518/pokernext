/**
 * @fileoverview UI evidence for ticket 00d: each workspace shell at its
 * surface's size, the refusal page and the role switcher Drawer, plus
 * side-by-side images against the DESIGN.md references (the reception shell,
 * which has none, against the prototype's `#/staff/tasks`). Writes into
 * `.scratch/pokernext-foundation/screenshots/00d/`, so it runs only with
 * `CAPTURE_00D_SCREENSHOTS=1`; normal runs skip it.
 */

import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {type Browser, type Page, test} from '@playwright/test';

import {writeSideBySide} from './support/side_by_side';
import {PLAYER_ORIGIN, switchAccount, WORK_ORIGIN} from './support/workspaces';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const OUTPUT_DIR = join(
  REPO_ROOT,
  '.scratch/pokernext-foundation/screenshots/00d',
);
const REFERENCES_DIR = join(REPO_ROOT, 'docs/design/references');
const PROTOTYPE_FILE = join(
  REPO_ROOT,
  'docs/design/prototype/pokernext-prototype.html',
);
/** A made-up origin the browser context serves the prototype under. */
const PROTOTYPE_ORIGIN = 'http://prototype.localhost';

const DESKTOP = {width: 1440, height: 1024};
const MOBILE = {width: 390, height: 844};

test.skip(
  process.env.CAPTURE_00D_SCREENSHOTS !== '1',
  'Set CAPTURE_00D_SCREENSHOTS=1 to rewrite the ticket screenshots.',
);

test.beforeAll(() => {
  mkdirSync(OUTPUT_DIR, {recursive: true});
});

async function capture(page: Page, name: string): Promise<string> {
  // A font subset starts loading when layout first needs one of its glyphs,
  // so after a frame `ready` covers every subset the page's text needs.
  await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(resolve));
    await document.fonts.ready;
  });
  const path = join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({path});
  return path;
}

/**
 * Captures a prototype hash route at 390×844 from its seed state, served from
 * the committed HTML under a fixed http origin (a `file://` page has no
 * storage origin to clear), and returns the screenshot path.
 */
async function capturePrototype(
  browser: Browser,
  route: string,
  name: string,
): Promise<string> {
  const context = await browser.newContext({
    viewport: MOBILE,
    colorScheme: 'dark',
    locale: 'zh-TW',
    timezoneId: 'Asia/Seoul',
    reducedMotion: 'reduce',
  });
  try {
    await context.route(`${PROTOTYPE_ORIGIN}/**`, request =>
      request.fulfill({path: PROTOTYPE_FILE, contentType: 'text/html'}),
    );
    const page = await context.newPage();
    await page.goto(`${PROTOTYPE_ORIGIN}/${route}`);
    // The prototype keeps its state in localStorage; start from its seed.
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    return await capture(page, name);
  } finally {
    await context.close();
  }
}

test('桌面工作區空殼 1440×1024', async ({page}) => {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${WORK_ORIGIN}/`);
  const accounts = [
    ['琪琪', 'venue'],
    ['王經理', 'admin'],
    ['Mingyao', 'platform'],
    ['David Chen', 'agent'],
  ] as const;
  // DESIGN.md §3.2 gives every desktop workspace the partner-overview frame.
  for (const [displayName, workspace] of accounts) {
    await switchAccount(page, displayName);
    const path = await capture(page, `${workspace}_home_desktop_1440`);
    writeSideBySide(
      path,
      join(REFERENCES_DIR, 'partner-overview.png'),
      join(OUTPUT_DIR, `side_by_side_${workspace}_vs_partner_overview.png`),
    );
  }
  await page.getByRole('button', {name: '切換角色'}).click();
  await capture(page, 'role_switcher_drawer_desktop_1440');
});

test('玩家與接待工作區空殼 390×844', async ({browser, page}) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${PLAYER_ORIGIN}/`);
  await switchAccount(page, 'Alex Chen');
  const player = await capture(page, 'player_home_mobile_390');
  writeSideBySide(
    player,
    join(REFERENCES_DIR, 'player-home-mobile.png'),
    join(OUTPUT_DIR, 'side_by_side_player_vs_player_home_mobile.png'),
  );
  await switchAccount(page, 'Amy');
  const staff = await capture(page, 'staff_home_mobile_390');
  // No reference image exists for reception; the prototype is its spec.
  writeSideBySide(
    staff,
    await capturePrototype(
      browser,
      '#/staff/tasks',
      'prototype_staff_tasks_mobile_390',
    ),
    join(OUTPUT_DIR, 'side_by_side_staff_vs_prototype_staff_tasks.png'),
  );
});

test('拒絕頁 390×844 與 1440×1024', async ({page}) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`${WORK_ORIGIN}/`);
  await capture(page, 'refusal_no_session_mobile_390');
  await switchAccount(page, '琪琪');
  await page.goto(`${WORK_ORIGIN}/admin`);
  await capture(page, 'refusal_other_workspace_mobile_390');
  await page.setViewportSize(DESKTOP);
  await capture(page, 'refusal_other_workspace_desktop_1440');
});
