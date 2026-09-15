/**
 * @fileoverview 併發測試工具的自我測試：它必須真的讓嘗試同時起跑，並抓得到重複生效。
 */

import {describe, expect, it} from 'vitest';

import {expectTakesEffectOnce, runInParallel} from '../testing';

/** Lets other attempts interleave, the way a database round trip would. */
function roundTrip(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 1);
  });
}

describe('併發測試工具', () => {
  it('並行嘗試同時進行，而不是一個接一個', async () => {
    let inFlight = 0;
    let mostAtOnce = 0;

    await runInParallel(10, async () => {
      inFlight += 1;
      mostAtOnce = Math.max(mostAtOnce, inFlight);
      await roundTrip();
      inFlight -= 1;
    });

    expect(mostAtOnce).toBe(10);
  });

  it('分開回報成功與失敗的嘗試', async () => {
    const outcome = await runInParallel(4, async attempt => {
      if (attempt % 2 === 0) {
        throw new Error(`attempt ${attempt} refused`);
      }
      return attempt;
    });

    expect(outcome.fulfilled.sort()).toEqual([1, 3]);
    expect(outcome.rejected).toHaveLength(2);
  });

  it('以原子操作防重的寫入並行送出 20 次，工具確認只生效一次', async () => {
    const records = new Set<string>();

    const outcome = await expectTakesEffectOnce({
      times: 20,
      attempt: async () => {
        await roundTrip();
        const created = !records.has('op-1');
        records.add('op-1');
        return created;
      },
      countEffects: async () => records.size,
    });

    expect(outcome.fulfilled.filter(created => created)).toHaveLength(1);
  });

  it('先查再寫的操作並行送出時，工具抓到重複生效', async () => {
    const records: string[] = [];

    await expect(
      expectTakesEffectOnce({
        times: 20,
        attempt: async () => {
          const exists = records.includes('op-1');
          await roundTrip();
          if (!exists) {
            records.push('op-1');
          }
        },
        countEffects: async () => records.length,
      }),
    ).rejects.toThrow(/exactly once.*took effect 20 times/s);
  });

  it('並行送出後完全沒有生效時，工具也判定失敗', async () => {
    await expect(
      expectTakesEffectOnce({
        times: 5,
        attempt: async () => {
          throw new Error('refused');
        },
        countEffects: async () => 0,
      }),
    ).rejects.toThrow(/took effect 0 times/);
  });
});
