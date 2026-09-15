/**
 * @fileoverview Playwright helpers for the workspace pages: the two local host
 * origins on the test server's port, and switching accounts through the
 * development role switcher exactly as a person would.
 */

import {expect, type Page} from '@playwright/test';
import {LOCAL_HOST_NAMES} from '@pokernext/app/routing';

const PORT = process.env.E2E_WEB_PORT ?? '3100';

/** The player host of the test server. */
export const PLAYER_ORIGIN = `http://${LOCAL_HOST_NAMES.player}:${PORT}`;
/** The work-account host of the test server. */
export const WORK_ORIGIN = `http://${LOCAL_HOST_NAMES.work}:${PORT}`;

/** A demo account and where its workspace home is. */
export interface DemoAccountHome {
  readonly displayName: string;
  readonly workspaceName: string;
  readonly homeUrl: string;
}

/** The six demo accounts (ticket 00d) and their workspace homes. */
export const DEMO_ACCOUNT_HOMES: readonly DemoAccountHome[] = [
  {
    displayName: 'Alex Chen',
    workspaceName: '玩家工作區',
    homeUrl: `${PLAYER_ORIGIN}/player`,
  },
  {
    displayName: '琪琪',
    workspaceName: '場館工作區',
    homeUrl: `${WORK_ORIGIN}/venue`,
  },
  {
    displayName: '王經理',
    workspaceName: '管理工作區',
    homeUrl: `${WORK_ORIGIN}/admin`,
  },
  {
    displayName: 'Mingyao',
    workspaceName: '平台治理工作區',
    homeUrl: `${WORK_ORIGIN}/platform`,
  },
  {
    displayName: 'Amy',
    workspaceName: '接待工作區',
    homeUrl: `${WORK_ORIGIN}/staff`,
  },
  {
    displayName: 'David Chen',
    workspaceName: 'Agent 工作區',
    homeUrl: `${WORK_ORIGIN}/agent`,
  },
];

/** Returns the demo account whose display name is given. */
export function demoAccountHome(displayName: string): DemoAccountHome {
  const found = DEMO_ACCOUNT_HOMES.find(
    account => account.displayName === displayName,
  );
  if (found === undefined) {
    throw new Error(`No demo account named ${displayName}.`);
  }
  return found;
}

/**
 * Opens the role switcher on the current page, chooses the account and waits
 * until its workspace home has loaded.
 */
export async function switchAccount(
  page: Page,
  displayName: string,
): Promise<void> {
  await page.getByRole('button', {name: '切換角色'}).click();
  const drawer = page.getByRole('dialog', {name: '切換角色（開發工具）'});
  await drawer.getByRole('button', {name: `以 ${displayName} 進入`}).click();
  await expect(page).toHaveURL(demoAccountHome(displayName).homeUrl);
  await page.evaluate(async () => {
    // Font subsets start loading at the first layout that needs them.
    await new Promise(resolve => requestAnimationFrame(resolve));
    await document.fonts.ready;
  });
}
