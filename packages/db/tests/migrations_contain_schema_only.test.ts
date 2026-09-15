/**
 * @fileoverview 正式環境的 migration 只建立結構、不含任何資料列：帳號只能經 demo
 * 入口（demo 與測試資料庫）或日後的正式流程建立，不留工程師後門（ADR-0001、第 03
 * 票）。帳號與 session 資料表也不含密碼、TOTP、備援碼、邀請、OTP 欄位。檔案以文字
 * 讀取，不 import 套件內部。
 */

import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {describe, expect, it} from 'vitest';

const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations', import.meta.url));

/** Statements that put rows into a table. */
const DATA_STATEMENT = /\b(INSERT\s+INTO|COPY\s+\S+\s+FROM|MERGE\s+INTO)\b/i;

/** Column names that belong to tickets 03 and 10, not to 00d. */
const CREDENTIAL_COLUMN =
  /"[^"]*(password|totp|backup_code|recovery_code|invitation|invite|otp)[^"]*"/i;

function readMigrations(): Array<{file: string; sql: string}> {
  return readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .map(file => ({
      file,
      sql: readFileSync(join(MIGRATIONS_DIR, file), 'utf8'),
    }));
}

describe('migration 只含結構', () => {
  it('找得到已提交的 migration 檔', () => {
    expect(readMigrations().map(({file}) => file)).toContain(
      '0001_accounts_sessions.sql',
    );
  });

  it('沒有任何 migration 寫入資料列', () => {
    const withData = readMigrations()
      .filter(({sql}) => DATA_STATEMENT.test(sql))
      .map(({file}) => file);

    expect(withData).toEqual([]);
  });

  it('帳號與 session 資料表不含密碼、TOTP、備援碼、邀請、OTP 欄位', () => {
    const withCredentials = readMigrations()
      .filter(({sql}) => CREDENTIAL_COLUMN.test(sql))
      .map(({file}) => file);

    expect(withCredentials).toEqual([]);
  });
});
