/**
 * @fileoverview 資料庫接受的工作區與領域規則的六個工作區是同一份清單：migration 裡
 * `accounts_workspace_known` 的 CHECK 必須逐字重複工作區識別，這個測試在兩邊不一致
 * 時失敗。檔案以文字讀取，不 import 套件內部。
 */

import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {WORKSPACES} from '@pokernext/domain';
import {describe, expect, it} from 'vitest';

const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations', import.meta.url));

/** The IN list of the workspace CHECK constraint, as written in SQL. */
const WORKSPACE_CHECK =
  /"accounts_workspace_known"\s+CHECK\s*\(\s*"accounts"\."workspace"\s+IN\s*\(([^)]*)\)\s*\)/g;

/**
 * Returns the workspace list of the last migration that (re)defines the
 * constraint, so a later migration that changes it is the one compared.
 */
function workspacesAcceptedByMigrations(): string[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  let accepted: string[] = [];
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    for (const match of sql.matchAll(WORKSPACE_CHECK)) {
      accepted = (match[1] ?? '')
        .split(',')
        .map(item => item.trim().replace(/^'|'$/g, ''));
    }
  }
  return accepted;
}

describe('資料庫接受的工作區', () => {
  it('migration 的工作區 CHECK 與領域規則的六個工作區完全相同，不多不少', () => {
    const accepted = workspacesAcceptedByMigrations();

    expect(accepted).toHaveLength(WORKSPACES.length);
    expect([...accepted].sort()).toEqual([...WORKSPACES].sort());
  });
});
