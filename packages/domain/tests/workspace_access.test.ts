/**
 * @fileoverview 工作區進入判定：玩家工作區只在玩家 host、其餘五個工作區只在工作帳號
 * host；會員只在玩家 host 開 session、工作帳號只在工作帳號 host 開 session；帳號只能
 * 進自己所屬的工作區（ADR-0001、PRD 2.1）。
 */

import {describe, expect, it} from 'vitest';

import {
  type AccountKind,
  decideSessionEnd,
  decideSessionStart,
  decideWorkspaceEntry,
  type HostKind,
  type Workspace,
  WORKSPACES,
} from '../index';

const HOSTS: readonly HostKind[] = ['player', 'work'];
const KINDS: readonly AccountKind[] = ['member', 'work'];

/** The six combinations that may enter, written out from the ticket. */
const ALLOWED_ENTRIES: ReadonlyArray<{
  kind: AccountKind;
  workspace: Workspace;
  host: HostKind;
}> = [
  {kind: 'member', workspace: 'player', host: 'player'},
  {kind: 'work', workspace: 'venue', host: 'work'},
  {kind: 'work', workspace: 'admin', host: 'work'},
  {kind: 'work', workspace: 'platform', host: 'work'},
  {kind: 'work', workspace: 'agent', host: 'work'},
  {kind: 'work', workspace: 'staff', host: 'work'},
];

describe('工作區進入判定', () => {
  it('六個工作區各有一個識別：玩家、場館、管理、平台治理、接待、Agent', () => {
    expect([...WORKSPACES].sort()).toEqual(
      ['admin', 'agent', 'platform', 'player', 'staff', 'venue'].sort(),
    );
  });

  it('帳號種類 × 所屬工作區 × host × 要求的工作區，只有六種組合可以進入，其餘一律拒絕', () => {
    const allowed: string[] = [];
    for (const kind of KINDS) {
      for (const accountWorkspace of WORKSPACES) {
        for (const host of HOSTS) {
          for (const requested of WORKSPACES) {
            const decision = decideWorkspaceEntry({
              actor: {kind, workspace: accountWorkspace},
              sessionHost: host,
              requestHost: host,
              workspace: requested,
            });
            if (decision.allowed) {
              allowed.push(`${kind}/${accountWorkspace}@${host}→${requested}`);
            }
          }
        }
      }
    }

    expect(allowed.sort()).toEqual(
      ALLOWED_ENTRIES.map(
        ({kind, workspace, host}) =>
          `${kind}/${workspace}@${host}→${workspace}`,
      ).sort(),
    );
  });

  it('場館帳號在工作帳號 host 進場館工作區可以，進管理工作區被拒且原因是不屬於該工作區', () => {
    const venueActor = {kind: 'work', workspace: 'venue'} as const;

    expect(
      decideWorkspaceEntry({
        actor: venueActor,
        sessionHost: 'work',
        requestHost: 'work',
        workspace: 'venue',
      }),
    ).toEqual({allowed: true});
    expect(
      decideWorkspaceEntry({
        actor: venueActor,
        sessionHost: 'work',
        requestHost: 'work',
        workspace: 'admin',
      }),
    ).toEqual({allowed: false, reason: 'otherWorkspace'});
  });

  it('在工作帳號 host 要求玩家工作區，無論帳號是誰都以「工作區不在此 host」拒絕', () => {
    for (const kind of KINDS) {
      for (const accountWorkspace of WORKSPACES) {
        expect(
          decideWorkspaceEntry({
            actor: {kind, workspace: accountWorkspace},
            sessionHost: 'work',
            requestHost: 'work',
            workspace: 'player',
          }),
        ).toEqual({allowed: false, reason: 'workspaceNotOnHost'});
      }
    }
  });

  it('在玩家 host 要求場館工作區，以「工作區不在此 host」拒絕', () => {
    expect(
      decideWorkspaceEntry({
        actor: {kind: 'work', workspace: 'venue'},
        sessionHost: 'player',
        requestHost: 'player',
        workspace: 'venue',
      }),
    ).toEqual({allowed: false, reason: 'workspaceNotOnHost'});
  });

  it('在另一個 host 開的 session 帶到這個 host 使用，即使工作區相符也被拒', () => {
    expect(
      decideWorkspaceEntry({
        actor: {kind: 'member', workspace: 'player'},
        sessionHost: 'work',
        requestHost: 'player',
        workspace: 'player',
      }),
    ).toEqual({allowed: false, reason: 'sessionFromOtherHost'});
  });

  it('會員可以在玩家 host 開 session，不能在工作帳號 host 開', () => {
    const member = {kind: 'member', workspace: 'player'} as const;

    expect(decideSessionStart(member, 'player')).toEqual({allowed: true});
    expect(decideSessionStart(member, 'work')).toEqual({
      allowed: false,
      reason: 'accountNotAllowedOnHost',
    });
  });

  it('工作帳號可以在工作帳號 host 開 session，不能在玩家 host 開', () => {
    for (const workspace of WORKSPACES.filter(item => item !== 'player')) {
      const workAccount = {kind: 'work', workspace} as const;

      expect(decideSessionStart(workAccount, 'work')).toEqual({allowed: true});
      expect(decideSessionStart(workAccount, 'player')).toEqual({
        allowed: false,
        reason: 'accountNotAllowedOnHost',
      });
    }
  });
});

describe('結束 session 判定', () => {
  it('在開 session 的 host 上結束自己的 session 可以', () => {
    for (const host of HOSTS) {
      expect(decideSessionEnd({sessionHost: host, requestHost: host})).toEqual({
        allowed: true,
      });
    }
  });

  it('把 session 帶到另一個 host 結束被拒，原因是 session 來自另一個 host', () => {
    expect(
      decideSessionEnd({sessionHost: 'work', requestHost: 'player'}),
    ).toEqual({allowed: false, reason: 'sessionFromOtherHost'});
    expect(
      decideSessionEnd({sessionHost: 'player', requestHost: 'work'}),
    ).toEqual({allowed: false, reason: 'sessionFromOtherHost'});
  });
});
