/**
 * @fileoverview 可控時鐘：測試以推進分鐘、小時、天、自然月取代 sleep。
 */

import {describe, expect, it} from 'vitest';

import {ControllableClock} from '../testing';

describe('可控時鐘', () => {
  it('推進 5 分鐘、2 小時、3 天後，現在時間恰好往後移動那麼多', async () => {
    const clock = new ControllableClock({start: '2026-09-11T09:00:00+09:00'});

    await clock.advanceMinutes(5);
    expect(clock.now().toISOString()).toBe('2026-09-11T00:05:00.000Z');
    await clock.advanceHours(2);
    expect(clock.now().toISOString()).toBe('2026-09-11T02:05:00.000Z');
    await clock.advanceDays(3);
    expect(clock.now().toISOString()).toBe('2026-09-14T02:05:00.000Z');
  });

  it('從 1 月 31 日推進一個自然月，落在 2 月的最後一天', async () => {
    const clock = new ControllableClock({start: '2026-01-31T12:00:00Z'});

    await clock.advanceMonths(1);

    expect(clock.now().toISOString()).toBe('2026-02-28T12:00:00.000Z');
  });

  it('閏年從 1 月 31 日推進一個自然月，落在 2 月 29 日', async () => {
    const clock = new ControllableClock({start: '2028-01-31T12:00:00Z'});

    await clock.advanceMonths(1);

    expect(clock.now().toISOString()).toBe('2028-02-29T12:00:00.000Z');
  });

  it('從 3 月 15 日推進六個自然月，落在 9 月 15 日同一時刻', async () => {
    const clock = new ControllableClock({start: '2026-03-15T08:30:00Z'});

    await clock.advanceMonths(6);

    expect(clock.now().toISOString()).toBe('2026-09-15T08:30:00.000Z');
  });

  it('以首爾時間計算自然月：首爾 1 月 31 日清晨推進一個月是首爾 2 月 28 日清晨', async () => {
    const clock = new ControllableClock({
      start: '2026-01-31T05:00:00+09:00',
      calendarUtcOffsetMinutes: 9 * 60,
    });

    await clock.advanceMonths(1);

    expect(clock.now().toISOString()).toBe('2026-02-27T20:00:00.000Z');
  });

  it('等待 30 秒的流程，時鐘只推進 29 秒時尚未完成', async () => {
    const clock = new ControllableClock();
    let done = false;
    void clock.wait(30_000).then(() => {
      done = true;
    });

    await clock.advanceMilliseconds(29_000);

    expect(done).toBe(false);
  });

  it('等待 30 秒的流程，時鐘推進滿 30 秒後完成，完成當下讀到的是到期時刻', async () => {
    const clock = new ControllableClock({start: '2026-09-11T00:00:00Z'});
    let seenAt: string | undefined;
    void clock.wait(30_000).then(() => {
      seenAt = clock.now().toISOString();
    });

    await clock.advanceMinutes(5);

    expect(seenAt).toBe('2026-09-11T00:00:30.000Z');
  });

  it('等待中又排入的下一段等待，只要仍在推進範圍內也會完成', async () => {
    const clock = new ControllableClock();
    const steps: string[] = [];
    const flow = async () => {
      await clock.wait(10_000);
      steps.push('first');
      await clock.wait(10_000);
      steps.push('second');
    };
    void flow();

    await clock.advanceMilliseconds(25_000);

    expect(steps).toEqual(['first', 'second']);
  });

  it('時鐘不能往回撥', async () => {
    const clock = new ControllableClock({start: '2026-09-11T00:00:00Z'});

    await expect(clock.advanceTo('2026-09-10T23:59:59Z')).rejects.toThrow(
      /backwards/,
    );
    expect(clock.now().toISOString()).toBe('2026-09-11T00:00:00.000Z');
  });
});
