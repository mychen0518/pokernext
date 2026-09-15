/**
 * @fileoverview 以中介層模擬的 Cloudflare 邊緣：誤擋、故障、挑戰、回應中斷。
 */

import {describe, expect, it} from 'vitest';

import {FakeEdgeProtection} from '../testing';

const CHECK_IN = {
  host: 'venue.pokernext.localhost',
  method: 'POST',
  path: '/api/check-ins',
};

/** An origin handler that counts how many requests reached it. */
function countingOrigin() {
  const origin = {
    calls: 0,
    handle: async () => {
      origin.calls += 1;
      return {checkInId: 'CI-1'};
    },
  };
  return origin;
}

describe('假邊緣防護', () => {
  it('邊緣正常時，請求送達來源並把回應交給呼叫端', async () => {
    const edge = new FakeEdgeProtection();
    const origin = countingOrigin();

    const outcome = await edge.pass(CHECK_IN, origin.handle);

    expect(outcome).toEqual({
      status: 'delivered',
      response: {checkInId: 'CI-1'},
    });
    expect(origin.calls).toBe(1);
  });

  it('誤擋時請求不會送達來源', async () => {
    const edge = new FakeEdgeProtection();
    const origin = countingOrigin();
    edge.injectFalseBlock();

    const outcome = await edge.pass(CHECK_IN, origin.handle);

    expect(outcome).toEqual({status: 'blocked'});
    expect(origin.calls).toBe(0);
  });

  it('邊緣故障時請求不會送達來源', async () => {
    const edge = new FakeEdgeProtection();
    const origin = countingOrigin();
    edge.injectOutage();

    const outcome = await edge.pass(CHECK_IN, origin.handle);

    expect(outcome).toEqual({status: 'unavailable'});
    expect(origin.calls).toBe(0);
  });

  it('要求挑戰時請求不會送達來源，呼叫端拿到挑戰而不是業務回應', async () => {
    const edge = new FakeEdgeProtection();
    const origin = countingOrigin();
    edge.injectChallenge();

    const outcome = await edge.pass(CHECK_IN, origin.handle);

    expect(outcome).toEqual({status: 'challenged'});
    expect(origin.calls).toBe(0);
  });

  it('回應中斷時來源已處理請求，但呼叫端拿不到回應', async () => {
    const edge = new FakeEdgeProtection();
    const origin = countingOrigin();
    edge.injectResponseInterrupted({times: 1});

    const interrupted = await edge.pass(CHECK_IN, origin.handle);
    const retried = await edge.pass(CHECK_IN, origin.handle);

    expect(interrupted).toEqual({status: 'interrupted'});
    expect(retried.status).toBe('delivered');
    expect(origin.calls).toBe(2);
  });
});
