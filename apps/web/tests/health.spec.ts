/**
 * @fileoverview 健康檢查的 HTTP 邊界：請求從 API 進、經 use-case 寫入真實資料庫、再讀
 * 回。伺服器與它自己的資料庫由 Playwright globalSetup 啟動。
 */

import {expect, test} from '@playwright/test';

test('健康檢查請求經 HTTP 寫入資料庫，之後以 GET 讀回同一筆紀錄', async ({
  request,
}) => {
  const created = await request.post('/api/health', {
    data: {requestKey: 'http-round-trip'},
  });

  expect(created.status()).toBe(201);
  const body = await created.json();
  expect(body).toMatchObject({
    status: 'recorded',
    record: {requestKey: 'http-round-trip'},
  });
  const listed = await request.get('/api/health?requestKey=http-round-trip');
  expect(listed.status()).toBe(200);
  expect(await listed.json()).toEqual({records: [body.record]});
});

test('以同一請求識別重送健康檢查，回傳既有紀錄且不新增', async ({request}) => {
  const first = await request.post('/api/health', {
    data: {requestKey: 'http-resend'},
  });
  const resent = await request.post('/api/health', {
    data: {requestKey: 'http-resend'},
  });

  expect(resent.status()).toBe(200);
  expect(await resent.json()).toEqual({
    status: 'alreadyRecorded',
    record: (await first.json()).record,
  });
  const listed = await request.get('/api/health?requestKey=http-resend');
  expect((await listed.json()).records).toHaveLength(1);
});

test('缺少請求識別的健康檢查被拒絕，且不留下紀錄', async ({request}) => {
  const refused = await request.post('/api/health', {data: {}});

  expect(refused.status()).toBe(400);
  expect(await refused.json()).toEqual({
    status: 'rejected',
    reason: 'invalidRequestKey',
  });
  const listed = await request.get('/api/health?requestKey=');
  expect((await listed.json()).records).toEqual([]);
});
