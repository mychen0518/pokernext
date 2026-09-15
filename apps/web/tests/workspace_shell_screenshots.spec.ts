/**
 * @fileoverview UI evidence for ticket 00d: each workspace shell at its
 * surface's size, the refusal page and the role switcher Drawer, plus
 * side-by-side images against the DESIGN.md references. Writes into
 * `.scratch/pokernext-foundation/screenshots/00d/`, so it runs only with
 * `CAPTURE_00D_SCREENSHOTS=1`; normal runs skip it.
 */

import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {type Page, test} from '@playwright/test';

import {writeSideBySide} from './support/side_by_side';
import {PLAYER_ORIGIN, switchAccount, WORK_ORIGIN} from './support/workspaces';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const OUTPUT_DIR = join(
  REPO_ROOT,
  '.scratch/pokernext-foundation/screenshots/00d',
);
const REFERENCES_DIR = join(REPO_ROOT, 'docs/design/references');

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
  const path = join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({path});
  return path;
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
  for (const [displayName, workspace] of accounts) {
    await switchAccount(page, displayName);
    const path = await capture(page, `${workspace}_home_desktop_1440`);
    if (workspace === 'venue') {
      writeSideBySide(
        path,
        join(REFERENCES_DIR, 'partner-overview.png'),
        join(OUTPUT_DIR, 'side_by_side_venue_vs_partner_overview.png'),
      );
    }
  }
  await page.getByRole('button', {name: '切換角色'}).click();
  await capture(page, 'role_switcher_drawer_desktop_1440');
});

test('玩家與接待工作區空殼 390×844', async ({page}) => {
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
  await capture(page, 'staff_home_mobile_390');
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
