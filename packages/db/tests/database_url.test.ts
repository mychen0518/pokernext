/**
 * @fileoverview 資料庫連線位置：測試、demo 與應用程式各自決定連到哪台伺服器，
 * 不會因為外面匯出了另一個用途的變數而把資料寫到別的伺服器。
 */

import {describe, expect, it} from 'vitest';

import {resolveDatabaseUrl} from '../index';

const CI_SERVER = 'postgres://ci:ci@db.ci.example:5432/postgres';
const OTHER_DEMO_SERVER = 'postgres://demo:demo@10.0.0.9:5432/pokernext';
const LOCAL_TEST_CLUSTER =
  'postgres://postgres:postgres@127.0.0.1:55432/postgres';
const LOCAL_DEMO_CLUSTER =
  'postgres://postgres:postgres@127.0.0.1:55433/pokernext';

describe('資料庫連線位置', () => {
  it('測試設了 DATABASE_URL 就用它，例如 CI 的 Postgres service', () => {
    expect(resolveDatabaseUrl('test', {DATABASE_URL: CI_SERVER})).toBe(
      CI_SERVER,
    );
  });

  it('測試沒設 DATABASE_URL 時用本機測試 cluster', () => {
    expect(resolveDatabaseUrl('test', {})).toBe(LOCAL_TEST_CLUSTER);
  });

  it('demo 不理會外面匯出的 DATABASE_URL，仍把 demo 資料寫進本機 demo cluster', () => {
    expect(resolveDatabaseUrl('demo', {DATABASE_URL: CI_SERVER})).toBe(
      LOCAL_DEMO_CLUSTER,
    );
  });

  it('demo 只接受自己的 DEMO_DATABASE_URL 覆寫', () => {
    expect(
      resolveDatabaseUrl('demo', {
        DATABASE_URL: CI_SERVER,
        DEMO_DATABASE_URL: OTHER_DEMO_SERVER,
      }),
    ).toBe(OTHER_DEMO_SERVER);
  });

  it('應用程式用明確給它的 DATABASE_URL', () => {
    expect(
      resolveDatabaseUrl('app', {
        DATABASE_URL: CI_SERVER,
        NODE_ENV: 'development',
      }),
    ).toBe(CI_SERVER);
  });

  it('非 production 的應用程式沒有 DATABASE_URL 時拒絕啟動，不會默默連到 demo cluster', () => {
    expect(() =>
      resolveDatabaseUrl('app', {
        NODE_ENV: 'development',
        DEMO_DATABASE_URL: OTHER_DEMO_SERVER,
      }),
    ).toThrow(/DATABASE_URL is not set.*pnpm demo/s);
  });

  it('production 的應用程式沒有 DATABASE_URL 時拒絕啟動', () => {
    expect(() => resolveDatabaseUrl('app', {NODE_ENV: 'production'})).toThrow(
      /DATABASE_URL is not set/,
    );
  });
});
