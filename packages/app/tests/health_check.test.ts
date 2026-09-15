/**
 * @fileoverview 健康檢查：請求經 use-case 層寫入真實資料庫並讀回；同一請求識別只留
 * 一筆紀錄，並行重送也一樣。
 */

import {afterEach, beforeEach, describe, expect, it} from 'vitest';

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

  it('記錄一次健康檢查後，可以經應用服務讀回同一筆紀錄與記錄時間', async () => {
    const result = await app.healthCheck.record({requestKey: 'hc-1'});

    expect(result).toEqual({
      status: 'recorded',
      record: {
        requestKey: 'hc-1',
        recordedAt: new Date('2026-09-11T00:00:00Z'),
      },
    });
    expect(await app.healthCheck.list({requestKey: 'hc-1'})).toEqual([
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
    expect(await app.healthCheck.list()).toHaveLength(1);
  });

  it('一天後以新的請求識別送出，記錄時間是推進後的時鐘時間', async () => {
    await given(app).healthCheckRecorded({requestKey: 'hc-1'});
    await app.clock.advanceDays(1);

    await app.healthCheck.record({requestKey: 'hc-2'});

    expect(await app.healthCheck.list()).toEqual([
      {requestKey: 'hc-1', recordedAt: new Date('2026-09-11T00:00:00Z')},
      {requestKey: 'hc-2', recordedAt: new Date('2026-09-12T00:00:00Z')},
    ]);
  });

  it('空白的請求識別被拒絕，且不留下任何紀錄', async () => {
    const result = await app.healthCheck.record({requestKey: '   '});

    expect(result).toEqual({status: 'rejected', reason: 'invalidRequestKey'});
    expect(await app.healthCheck.list()).toEqual([]);
  });

  it('同一請求識別並行送出 20 次，只留下一筆紀錄，也只有一次回報為新紀錄', async () => {
    const attempts = await expectTakesEffectOnce({
      times: 20,
      attempt: () => app.healthCheck.record({requestKey: 'hc-retry'}),
      countEffects: async () =>
        (await app.healthCheck.list({requestKey: 'hc-retry'})).length,
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

    expect(await app.healthCheck.list()).toHaveLength(5);
  });
});
