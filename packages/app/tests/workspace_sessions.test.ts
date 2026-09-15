/**
 * @fileoverview 帳號 session 與工作區進入：以某帳號開的 session 只能進該帳號所屬的
 * 工作區；會員的 session 只在玩家 host 有效，工作帳號的 session 只在工作帳號 host
 * 有效；結束的 session 不再有效。全部經 use-case 與真實資料庫。
 */

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {createTestApp, given, type TestApp} from '../testing';

const WORK_WORKSPACES = [
  'venue',
  'admin',
  'platform',
  'staff',
  'agent',
] as const;

describe('帳號 session 與工作區進入', () => {
  let app: TestApp;

  beforeEach(async () => {
    app = await createTestApp({start: '2026-09-11T09:00:00+09:00'});
  });

  afterEach(async () => {
    await app.close();
  });

  it('以場館帳號在工作帳號 host 開的 session 可以進場館工作區，進其他四個工作帳號工作區都被拒', async () => {
    const venueAccount = await given(app).demoAccount('venue');
    const {token} = await given(app).sessionStarted({
      accountId: venueAccount.id,
      host: 'work',
    });

    expect(
      await app.sessions.resolve({token, host: 'work', workspace: 'venue'}),
    ).toEqual({
      status: 'allowed',
      actor: {
        accountId: venueAccount.id,
        kind: 'work',
        displayName: '琪琪',
        roleLabel: venueAccount.roleLabel,
        workspace: 'venue',
      },
    });
    for (const other of WORK_WORKSPACES.filter(item => item !== 'venue')) {
      expect(
        await app.sessions.resolve({token, host: 'work', workspace: other}),
      ).toEqual({status: 'refused', reason: 'otherWorkspace'});
    }
  });

  it('以會員帳號在玩家 host 開的 session 可以進玩家工作區', async () => {
    const member = await given(app).demoAccount('player');
    const {token} = await given(app).sessionStarted({
      accountId: member.id,
      host: 'player',
    });

    const resolved = await app.sessions.resolve({
      token,
      host: 'player',
      workspace: 'player',
    });

    expect(resolved).toMatchObject({
      status: 'allowed',
      actor: {displayName: 'Alex Chen', kind: 'member', workspace: 'player'},
    });
  });

  it('會員不能在工作帳號 host 開 session，也不留下可用的 session', async () => {
    const member = await given(app).demoAccount('player');

    const started = await app.sessions.start({
      accountId: member.id,
      host: 'work',
    });

    expect(started).toEqual({
      status: 'refused',
      reason: 'accountNotAllowedOnHost',
    });
  });

  it('工作帳號不能在玩家 host 開 session', async () => {
    const admin = await given(app).demoAccount('admin');

    const started = await app.sessions.start({
      accountId: admin.id,
      host: 'player',
    });

    expect(started).toEqual({
      status: 'refused',
      reason: 'accountNotAllowedOnHost',
    });
  });

  it('工作帳號 host 的 session 帶到玩家 host 使用無效，會員 session 帶到工作帳號 host 也無效', async () => {
    const admin = await given(app).demoAccount('admin');
    const member = await given(app).demoAccount('player');
    const adminSession = await given(app).sessionStarted({
      accountId: admin.id,
      host: 'work',
    });
    const memberSession = await given(app).sessionStarted({
      accountId: member.id,
      host: 'player',
    });

    expect(
      await app.sessions.resolve({
        token: adminSession.token,
        host: 'player',
        workspace: 'player',
      }),
    ).toEqual({status: 'refused', reason: 'sessionFromOtherHost'});
    expect(
      await app.sessions.resolve({
        token: memberSession.token,
        host: 'work',
        workspace: 'admin',
      }),
    ).toEqual({status: 'refused', reason: 'sessionFromOtherHost'});
  });

  it('在工作帳號 host 要求玩家工作區、在玩家 host 要求場館工作區，都以工作區不在此 host 拒絕', async () => {
    const venueAccount = await given(app).demoAccount('venue');
    const {token} = await given(app).sessionStarted({
      accountId: venueAccount.id,
      host: 'work',
    });

    expect(
      await app.sessions.resolve({token, host: 'work', workspace: 'player'}),
    ).toEqual({status: 'refused', reason: 'workspaceNotOnHost'});
    expect(
      await app.sessions.resolve({token, host: 'player', workspace: 'venue'}),
    ).toEqual({status: 'refused', reason: 'workspaceNotOnHost'});
  });

  it('結束的 session 不再能進工作區；同帳號重新開的 session 可以', async () => {
    const staff = await given(app).demoAccount('staff');
    const first = await given(app).sessionStarted({
      accountId: staff.id,
      host: 'work',
    });

    expect(await app.sessions.end({token: first.token, host: 'work'})).toEqual({
      status: 'ended',
    });

    expect(
      await app.sessions.resolve({
        token: first.token,
        host: 'work',
        workspace: 'staff',
      }),
    ).toEqual({status: 'refused', reason: 'noSession'});
    const second = await given(app).sessionStarted({
      accountId: staff.id,
      host: 'work',
    });
    expect(
      await app.sessions.resolve({
        token: second.token,
        host: 'work',
        workspace: 'staff',
      }),
    ).toMatchObject({status: 'allowed'});
  });

  it('再結束一次已結束的 session，不會有任何效果', async () => {
    const agent = await given(app).demoAccount('agent');
    const {token} = await given(app).sessionStarted({
      accountId: agent.id,
      host: 'work',
    });
    await app.sessions.end({token, host: 'work'});

    expect(await app.sessions.end({token, host: 'work'})).toEqual({
      status: 'notActive',
    });
  });

  it('另一個 host 不能結束這個 host 的 session', async () => {
    const platform = await given(app).demoAccount('platform');
    const {token} = await given(app).sessionStarted({
      accountId: platform.id,
      host: 'work',
    });

    expect(await app.sessions.end({token, host: 'player'})).toEqual({
      status: 'notActive',
    });
    expect(
      await app.sessions.resolve({token, host: 'work', workspace: 'platform'}),
    ).toMatchObject({status: 'allowed'});
  });

  it('沒有 token 或 token 不存在時，任何工作區都以未登入拒絕', async () => {
    await given(app).demoAccountsEnsured();

    expect(
      await app.sessions.resolve({host: 'work', workspace: 'venue'}),
    ).toEqual({status: 'refused', reason: 'noSession'});
    expect(
      await app.sessions.resolve({
        token: 'forged-token',
        host: 'player',
        workspace: 'player',
      }),
    ).toEqual({status: 'refused', reason: 'noSession'});
  });

  it('不存在的帳號不能開 session', async () => {
    const started = await app.sessions.start({
      accountId: '6f0e2f5e-2a1b-4c3d-9e8f-0a1b2c3d4e5f',
      host: 'work',
    });

    expect(started).toEqual({status: 'refused', reason: 'accountNotFound'});
  });

  it('已登入的 session 回報它所屬的工作區首頁；沒有 session 時回報未登入', async () => {
    const admin = await given(app).demoAccount('admin');
    const {token} = await given(app).sessionStarted({
      accountId: admin.id,
      host: 'work',
    });

    expect(await app.sessions.home({token, host: 'work'})).toEqual({
      status: 'signedIn',
      workspace: 'admin',
    });
    expect(await app.sessions.home({token, host: 'player'})).toEqual({
      status: 'signedOut',
    });
    expect(await app.sessions.home({host: 'work'})).toEqual({
      status: 'signedOut',
    });
  });
});
