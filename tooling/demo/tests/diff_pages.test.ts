/**
 * @fileoverview The `demo:diff` mapping table: which formal page is compared
 * with which prototype hash route, read from `tooling/demo/diff_pages.json`
 * so that adding a row needs no tool change.
 */

import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {describe, expect, test} from 'vitest';

import {loadDiffPages} from '../diff';

/** Writes a mapping table to a fresh temporary file and returns its path. */
function writeTable(table: unknown): string {
  const path = join(mkdtempSync(join(tmpdir(), 'diff-pages-')), 'pages.json');
  writeFileSync(path, JSON.stringify(table, undefined, 2));
  return path;
}

const VENUE_HOME = {
  id: 'venue_home',
  title: '場館工作區首頁',
  formal: {host: 'work', path: '/venue', signInAs: {workspace: 'venue'}},
  prototype: {route: '#/venue/overview'},
  viewports: ['desktop'],
};

describe('對照表', () => {
  test('初始對照表把六個工作區空殼對到原型六個角色的首頁', () => {
    const pages = loadDiffPages();

    expect(pages.map(page => [page.formal.path, page.prototype.route])).toEqual(
      [
        ['/player', '#/player/home'],
        ['/venue', '#/venue/overview'],
        ['/admin', '#/admin/dashboard'],
        ['/platform', '#/platform/governance'],
        ['/staff', '#/staff/tasks'],
        ['/agent', '#/agent/customers'],
      ],
    );
  });

  test('每個空殼依所屬端的寬度截圖：玩家與接待用手機，其餘用桌面', () => {
    const pages = loadDiffPages();

    expect(pages.map(page => [page.id, page.viewports])).toEqual([
      ['player_home', ['mobile']],
      ['venue_home', ['desktop']],
      ['admin_home', ['desktop']],
      ['platform_home', ['desktop']],
      ['staff_home', ['mobile']],
      ['agent_home', ['desktop']],
    ]);
  });

  test('在對照表新增一列，工具就讀到這一列，不需改程式', () => {
    const path = writeTable({
      pages: [
        VENUE_HOME,
        {
          id: 'venue_checkin',
          title: '到場報到',
          formal: {
            host: 'work',
            path: '/venue/checkin',
            signInAs: {accountId: '5e3d0000-de30-4000-8000-000000000002'},
          },
          prototype: {route: '#/venue/checkin'},
          viewports: ['desktop', 'mobile'],
        },
      ],
    });

    const pages = loadDiffPages(path);

    expect(pages.map(page => page.id)).toEqual(['venue_home', 'venue_checkin']);
    expect(pages[1]).toEqual({
      id: 'venue_checkin',
      title: '到場報到',
      formal: {
        host: 'work',
        path: '/venue/checkin',
        signInAs: {accountId: '5e3d0000-de30-4000-8000-000000000002'},
      },
      prototype: {route: '#/venue/checkin'},
      viewports: ['desktop', 'mobile'],
    });
  });

  test('寫錯的列會被指出是哪個檔案、哪一列、哪個欄位', () => {
    const path = writeTable({
      pages: [
        VENUE_HOME,
        {...VENUE_HOME, id: 'admin_home', formal: {host: 'office', path: '/'}},
      ],
    });

    expect(() => loadDiffPages(path)).toThrow(
      `${path}: pages[1] (admin_home): formal.host must be "player" or "work".`,
    );
  });

  test('原型路由不是 hash route、或寬度不是桌面／手機時，指出錯誤', () => {
    const badRoute = writeTable({
      pages: [{...VENUE_HOME, prototype: {route: '/venue/overview'}}],
    });
    const badViewport = writeTable({
      pages: [{...VENUE_HOME, viewports: ['tablet']}],
    });

    expect(() => loadDiffPages(badRoute)).toThrow(
      'pages[0] (venue_home): prototype.route must start with "#/".',
    );
    expect(() => loadDiffPages(badViewport)).toThrow(
      'pages[0] (venue_home): viewports must be a non-empty list of "desktop" and "mobile".',
    );
  });

  test('兩列用同一個 id 時被拒，因為報告的圖檔以 id 命名', () => {
    const path = writeTable({pages: [VENUE_HOME, VENUE_HOME]});

    expect(() => loadDiffPages(path)).toThrow(
      'pages[1] (venue_home): id "venue_home" is already used by pages[0].',
    );
  });

  test('同時指定工作區與帳號 id 時被拒，只能選一種登入方式', () => {
    const path = writeTable({
      pages: [
        {
          ...VENUE_HOME,
          formal: {
            host: 'work',
            path: '/venue',
            signInAs: {workspace: 'venue', accountId: 'x'},
          },
        },
      ],
    });

    expect(() => loadDiffPages(path)).toThrow(
      'pages[0] (venue_home): formal.signInAs must name exactly one of workspace or accountId.',
    );
  });
});
