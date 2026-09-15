/**
 * @fileoverview 健康檢查：請求經 use-case 層寫入真實資料庫並讀回；同一請求識別只留
 * 一筆紀錄，並行重送也一樣。對外的探測只回報寫入並讀回的結果，不帶出任何已存紀錄。
 */

import {connectDatabase} from '@pokernext/db';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {createApp} from '../index';
import {
  createTestApp,
  expectTakesEffectOnce,
  given,
  runInParallel,
  type TestApp,
} from '../testing';

describe('健康檢查', () => {
  let app: TestApp;

  beforeEach(async () => {
    app = await createTestApp({start: '2026-09-11T09:00:00+09:00'});
  });

  afterEach(async () => {
    await app.close();
  });

  it('記錄一次健康檢查後，回傳從資料庫讀回的同一筆紀錄與記錄時間', async () => {
    const result = await app.healthCheck.record({requestKey: 'hc-1'});

    expect(result).toEqual({
      status: 'recorded',
      record: {
        requestKey: 'hc-1',
        recordedAt: new Date('2026-09-11T00:00:00Z'),
      },
    });
    expect(await app.healthCheckRecords({requestKey: 'hc-1'})).toEqual([
      {requestKey: 'hc-1', recordedAt: new Date('2026-09-11T00:00:00Z')},
    ]);
  });

  it('一天後以同一請求識別重送，回傳第一次的紀錄與記錄時間，不新增紀錄', async () => {
    await given(app).healthCheckRecorded({requestKey: 'hc-1'});
    await app.clock.advanceDays(1);

    const resent = await app.healthCheck.record({requestKey: 'hc-1'});

    expect(resent).toEqual({
      status: 'alreadyRecorded',
      record: {
        requestKey: 'hc-1',
        recordedAt: new Date('2026-09-11T00:00:00Z'),
      },
    });
    expect(await app.healthCheckRecords()).toHaveLength(1);
  });

  it('一天後以新的請求識別送出，記錄時間是推進後的時鐘時間', async () => {
    await given(app).healthCheckRecorded({requestKey: 'hc-1'});
    await app.clock.advanceDays(1);

    await app.healthCheck.record({requestKey: 'hc-2'});

    expect(await app.healthCheckRecords()).toEqual([
      {requestKey: 'hc-1', recordedAt: new Date('2026-09-11T00:00:00Z')},
      {requestKey: 'hc-2', recordedAt: new Date('2026-09-12T00:00:00Z')},
    ]);
  });

  it('空白的請求識別被拒絕，且不留下任何紀錄', async () => {
    const result = await app.healthCheck.record({requestKey: '   '});

    expect(result).toEqual({status: 'rejected', reason: 'invalidRequestKey'});
    expect(await app.healthCheckRecords()).toEqual([]);
  });

  it('同一請求識別並行送出 20 次，只留下一筆紀錄，也只有一次回報為新紀錄', async () => {
    const attempts = await expectTakesEffectOnce({
      times: 20,
      attempt: () => app.healthCheck.record({requestKey: 'hc-retry'}),
      countEffects: async () =>
        (await app.healthCheckRecords({requestKey: 'hc-retry'})).length,
    });

    const statuses = attempts.fulfilled.map(result => result.status);
    expect(attempts.rejected).toEqual([]);
    expect(statuses.filter(status => status === 'recorded')).toHaveLength(1);
    expect(
      statuses.filter(status => status === 'alreadyRecorded'),
    ).toHaveLength(19);
  });

  it('不同請求識別並行送出，各自留下一筆紀錄', async () => {
    await runInParallel(5, attempt =>
      app.healthCheck.record({requestKey: `hc-${attempt}`}),
    );

    expect(await app.healthCheckRecords()).toHaveLength(5);
  });
});

describe('健康檢查探測', () => {
  let app: TestApp;

  beforeEach(async () => {
    app = await createTestApp({start: '2026-09-11T09:00:00+09:00'});
  });

  afterEach(async () => {
    await app.close();
  });

  it('探測寫入一筆新紀錄並讀回，只回報健康與檢查時間，不帶出任何紀錄內容', async () => {
    await given(app).healthCheckRecorded({requestKey: 'earlier-check'});

    const probed = await app.healthCheck.probe();

    expect(probed).toEqual({
      status: 'healthy',
      checkedAt: new Date('2026-09-11T00:00:00Z'),
    });
    expect(await app.healthCheckRecords()).toHaveLength(2);
  });

  it('連續探測兩次，各自寫入並讀回自己的紀錄', async () => {
    await app.healthCheck.probe();
    await app.clock.advanceMinutes(1);

    const second = await app.healthCheck.probe();

    expect(second).toEqual({
      status: 'healthy',
      checkedAt: new Date('2026-09-11T00:01:00Z'),
    });
    expect(await app.healthCheckRecords()).toHaveLength(2);
  });
});

describe('真實時鐘下的健康檢查探測', () => {
  it('每次讀時鐘都已過了一毫秒，探測仍回報健康，檢查時間是寫入並讀回的時間', async () => {
    const testApp = await createTestApp({start: '2026-09-11T09:00:00+09:00'});
    let ticks = 0;
    const tickingClock = {
      now: () => new Date(Date.UTC(2026, 8, 11) + ticks++),
      wait: () => Promise.resolve(),
    };
    const database = connectDatabase({url: testApp.databaseUrl});
    const app = createApp({
      database,
      clock: tickingClock,
      ports: testApp.ports,
    });
    try {
      const probed = await app.healthCheck.probe();

      expect(probed.status).toBe('healthy');
      expect(await testApp.healthCheckRecords()).toEqual([
        expect.objectContaining({
          recordedAt: probed.status === 'healthy' ? probed.checkedAt : null,
        }),
      ]);
    } finally {
      await app.close();
      await testApp.close();
    }
  });
});

describe('資料庫無法使用時的健康檢查探測', () => {
  it('資料庫連線已關閉時，探測回報不健康而不是丟出錯誤', async () => {
    const app = await createTestApp();
    await app.close();

    expect(await app.healthCheck.probe()).toEqual({status: 'unhealthy'});
  });
});
