/**
 * @fileoverview Demo 帳號：新資料庫（只跑過 migration）沒有任何帳號；確保 demo 帳號
 * 時建立六個工作區各一個帳號，再執行一次或同時執行都不重複建立。
 */

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {listAccountsForRoleSwitcher} from '../dev';
import {createTestApp, given, runInParallel, type TestApp} from '../testing';

describe('Demo 帳號', () => {
  let app: TestApp;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('只跑過 migration 的資料庫沒有任何帳號', async () => {
    expect(
      await listAccountsForRoleSwitcher({DATABASE_URL: app.databaseUrl}),
    ).toEqual([]);
  });

  it('確保 demo 帳號兩次：第一次建立六個工作區各一個帳號，第二次什麼都不建立', async () => {
    const first = await given(app).demoAccountsEnsured();
    const second = await given(app).demoAccountsEnsured();

    expect(first.created).toBe(6);
    expect(second.created).toBe(0);
    const accounts = await listAccountsForRoleSwitcher({
      DATABASE_URL: app.databaseUrl,
    });
    expect(
      accounts.map(({displayName, kind, workspace}) => ({
        displayName,
        kind,
        workspace,
      })),
    ).toEqual([
      {displayName: 'Alex Chen', kind: 'member', workspace: 'player'},
      {displayName: '琪琪', kind: 'work', workspace: 'venue'},
      {displayName: '王經理', kind: 'work', workspace: 'admin'},
      {displayName: 'Mingyao', kind: 'work', workspace: 'platform'},
      {displayName: 'Amy', kind: 'work', workspace: 'staff'},
      {displayName: 'David Chen', kind: 'work', workspace: 'agent'},
    ]);
  });

  it('同時確保 demo 帳號五次，仍然只有六個帳號', async () => {
    await runInParallel(5, () => given(app).demoAccountsEnsured());

    expect(
      await listAccountsForRoleSwitcher({DATABASE_URL: app.databaseUrl}),
    ).toHaveLength(6);
  });
});

describe('角色切換列的帳號清單', () => {
  it('production 環境不列出任何帳號，直接拒絕執行', async () => {
    await expect(
      listAccountsForRoleSwitcher({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://nobody@127.0.0.1:1/none',
      }),
    ).rejects.toThrow(/development-only/);
  });
});
