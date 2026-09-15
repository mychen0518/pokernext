/**
 * @fileoverview 合法業務操作建構器：前置狀態只經 use-case 建立，use-case 拒絕時建構器
 * 就失敗，不會繞過規則把狀態塞進資料庫。
 */

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {createTestApp, given, type TestApp} from '../testing';

describe('合法業務操作建構器', () => {
  let app: TestApp;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('以建構器建立的健康檢查，之後經應用服務查得到', async () => {
    const record = await given(app).healthCheckRecorded();

    expect(await app.healthCheck.list()).toEqual([record]);
  });

  it('連續建立的前置狀態各自獨立，不會互相覆蓋', async () => {
    const first = await given(app).healthCheckRecorded();
    const second = await given(app).healthCheckRecorded();

    expect(first.requestKey).not.toBe(second.requestKey);
    expect(await app.healthCheck.list()).toHaveLength(2);
  });

  it('use-case 拒絕時建構器直接失敗，資料庫裡不會出現這筆狀態', async () => {
    await expect(
      given(app).healthCheckRecorded({requestKey: ''}),
    ).rejects.toThrow(/invalidRequestKey/);
    expect(await app.healthCheck.list()).toEqual([]);
  });
});
