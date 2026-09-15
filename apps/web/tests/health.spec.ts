/**
 * @fileoverview 健康檢查的 HTTP 邊界：探測請求從 API 進、經 use-case 寫入真實資料庫
 * 再讀回，只回報結果，不列出任何已存紀錄。伺服器與它自己的資料庫由 Playwright
 * globalSetup 啟動。
 */

import {expect, test} from '@playwright/test';

test('健康檢查探測經 HTTP 寫入資料庫並讀回，只回報健康與檢查時間', async ({
  request,
}) => {
  const probed = await request.get('/api/health');

  expect(probed.status()).toBe(200);
  const body = await probed.json();
  expect(Object.keys(body).sort()).toEqual(['checkedAt', 'status']);
  expect(body.status).toBe('healthy');
  expect(Number.isNaN(Date.parse(body.checkedAt))).toBe(false);
  expect(probed.headers()['cache-control']).toContain('no-store');
});

test('以請求識別查詢健康檢查，也拿不到任何已存紀錄', async ({request}) => {
  const probed = await request.get('/api/health?requestKey=anything');

  expect(Object.keys(await probed.json()).sort()).toEqual([
    'checkedAt',
    'status',
  ]);
});

test('不能經 HTTP 以任意請求識別寫入健康檢查紀錄', async ({request}) => {
  const posted = await request.post('/api/health', {
    data: {requestKey: 'http-write'},
  });

  expect(posted.status()).toBe(405);
});
