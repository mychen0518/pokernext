/**
 * @fileoverview 六個工作區空殼與角色切換列：經切換列以六個 demo 帳號各自進入所屬工作
 * 區首頁；玩家工作區只在玩家 host 可達、其餘只在工作帳號 host 可達；以錯誤工作區的
 * session 或沒有 session 進入時顯示拒絕頁。資料庫由 globalSetup 以 demo use-case 建立
 * 帳號，不寫 SQL。
 */

import {expect, type Page, test} from '@playwright/test';
import {LOCAL_HOST_NAMES} from '@pokernext/app/routing';

import {
  DEMO_ACCOUNT_HOMES,
  PLAYER_ORIGIN,
  switchAccount,
  WORK_ORIGIN,
} from './support/workspaces';

const EMPTY_REASON = '本工作區的功能尚未上線，上線後會顯示在這裡。';

/** The refusal sentence; Next's empty route announcer is also an alert. */
function refusalMessage(page: Page) {
  return page.getByRole('alert').filter({hasText: /\S/});
}

/** Checks the shell of the workspace the page is on. */
async function expectWorkspaceShell(page: Page, workspaceName: string) {
  await expect(page.getByText(EMPTY_REASON)).toBeVisible();
  if (workspaceName === '玩家工作區') {
    const nav = page.getByRole('navigation', {name: '玩家導覽'});
    await expect(nav.getByRole('link')).toHaveText([
      '首頁',
      '我的行程',
      '到場碼',
      '我的積分',
      '我的帳戶',
    ]);
    return;
  }
  if (workspaceName === '接待工作區') {
    await expect(page.getByRole('navigation')).toHaveCount(0);
    return;
  }
  const sidebar = page.getByRole('complementary', {name: workspaceName});
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole('link')).toHaveText(['工作區首頁']);
  await expect(page.getByRole('heading', {level: 1})).toHaveText('工作區首頁');
}

test.describe('工作區空殼與角色切換列', () => {
  test.use({viewport: {width: 1440, height: 1024}});

  test('經角色切換列依序切換六個 demo 帳號，每次都進入該帳號所屬的工作區首頁', async ({
    page,
  }) => {
    await page.goto(`${WORK_ORIGIN}/`);

    for (const account of DEMO_ACCOUNT_HOMES) {
      await switchAccount(page, account.displayName);

      await expectWorkspaceShell(page, account.workspaceName);
      if (!['玩家工作區', '接待工作區'].includes(account.workspaceName)) {
        await expect(page.getByText(account.displayName)).toBeVisible();
      }
    }
  });

  test('桌面工作區空殼沒有數字或假資料，只有空狀態原因', async ({page}) => {
    await page.goto(`${WORK_ORIGIN}/`);
    await switchAccount(page, '王經理');

    const content = page.getByRole('main');
    await expect(content).not.toContainText(/\d/);
    await expect(content.getByRole('table')).toHaveCount(0);
  });

  test('在同一 host 切換帳號會結束原本的 session：切到管理帳號後，場館工作區拒絕進入', async ({
    page,
  }) => {
    await page.goto(`${WORK_ORIGIN}/`);
    await switchAccount(page, '琪琪');
    await switchAccount(page, '王經理');

    await page.goto(`${WORK_ORIGIN}/venue`);

    await expect(refusalMessage(page)).toHaveText(
      '目前的帳號屬於管理工作區，不能進入場館工作區。',
    );
  });

  test('以場館帳號的 session 進管理工作區顯示拒絕頁，並可前往自己的場館工作區', async ({
    page,
  }) => {
    await page.goto(`${WORK_ORIGIN}/`);
    await switchAccount(page, '琪琪');

    await page.goto(`${WORK_ORIGIN}/admin`);

    await expect(refusalMessage(page)).toHaveText(
      '目前的帳號屬於場館工作區，不能進入管理工作區。',
    );
    await expect(page.getByRole('complementary')).toHaveCount(0);
    await page.getByRole('button', {name: '前往場館工作區'}).click();
    await expect(page).toHaveURL(`${WORK_ORIGIN}/venue`);
    await expectWorkspaceShell(page, '場館工作區');
  });

  test('沒有 session 時進工作區顯示拒絕頁，登入後才能進入', async ({page}) => {
    await page.goto(`${WORK_ORIGIN}/platform`);

    await expect(refusalMessage(page)).toHaveText(
      '尚未登入，登入後才能進入工作區。',
    );
    await expect(page.getByText(EMPTY_REASON)).toHaveCount(0);
  });

  test('玩家工作區在工作帳號 host 不可達，場館工作區在玩家 host 不可達', async ({
    page,
  }) => {
    const playerOnWorkHost = await page.goto(`${WORK_ORIGIN}/player`);
    const venueOnPlayerHost = await page.goto(`${PLAYER_ORIGIN}/venue`);
    const venueOnWorkHost = await page.goto(`${WORK_ORIGIN}/venue`);
    const playerOnPlayerHost = await page.goto(`${PLAYER_ORIGIN}/player`);

    expect(playerOnWorkHost?.status()).toBe(404);
    expect(venueOnPlayerHost?.status()).toBe(404);
    expect(venueOnWorkHost?.status()).toBe(200);
    expect(playerOnPlayerHost?.status()).toBe(200);
  });

  test('會員登入玩家 host 後，工作帳號 host 仍沒有 session；兩個 host 的 cookie 各自獨立且只放不透明 token', async ({
    page,
    context,
  }) => {
    await page.goto(`${PLAYER_ORIGIN}/`);
    await switchAccount(page, 'Alex Chen');

    await page.goto(`${WORK_ORIGIN}/venue`);

    await expect(refusalMessage(page)).toHaveText(
      '尚未登入，登入後才能進入工作區。',
    );
    const cookies = await context.cookies([PLAYER_ORIGIN, WORK_ORIGIN]);
    expect(cookies.map(({name, domain}) => ({name, domain}))).toEqual([
      {name: 'pn_player_session', domain: LOCAL_HOST_NAMES.player},
    ]);
    expect(cookies[0]).toMatchObject({httpOnly: true, sameSite: 'Lax'});
    expect(cookies[0]?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  test('登出後同一個工作區不再能進入', async ({page}) => {
    await page.goto(`${WORK_ORIGIN}/`);
    await switchAccount(page, 'David Chen');

    await page.getByRole('button', {name: '登出'}).click();
    await expect(page).toHaveURL(`${WORK_ORIGIN}/`);
    await page.goto(`${WORK_ORIGIN}/agent`);

    await expect(refusalMessage(page)).toHaveText(
      '尚未登入，登入後才能進入工作區。',
    );
  });
});
