/**
 * @fileoverview 以中介層模擬的 Cloudflare 邊緣：每個 HTTP 請求都先經過假邊緣才到來源；
 * 誤擋、故障、挑戰時請求到不了來源，回應中斷時來源已處理但呼叫端拿不到回應。
 */

import {describe, expect, it} from 'vitest';

import {
  EdgeResponseInterrupted,
  FAKE_EDGE_OUTCOME_HEADER,
  FakeEdgeProtection,
  withFakeEdge,
} from '../testing';

const CHECK_IN_URL = 'http://work.localhost/api/check-ins';

/** An origin handler that counts the requests that reached it. */
function countingOrigin() {
  const origin = {
    reached: [] as string[],
    handle: async (request: Request) => {
      origin.reached.push(`${request.method} ${new URL(request.url).host}`);
      return Response.json({checkInId: 'CI-1'}, {status: 201});
    },
  };
  return origin;
}

function checkIn(): Request {
  return new Request(CHECK_IN_URL, {method: 'POST', body: '{}'});
}

describe('假邊緣中介層', () => {
  it('邊緣正常時，請求送達來源，呼叫端拿到來源的回應', async () => {
    const edge = new FakeEdgeProtection();
    const origin = countingOrigin();
    const handle = withFakeEdge(edge, origin.handle);

    const response = await handle(checkIn());

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({checkInId: 'CI-1'});
    expect(origin.reached).toEqual(['POST work.localhost']);
  });

  it('誤擋時請求到不了來源，呼叫端拿到邊緣的阻擋回應而不是業務拒絕', async () => {
    const edge = new FakeEdgeProtection();
    const origin = countingOrigin();
    edge.injectFalseBlock();

    const response = await withFakeEdge(edge, origin.handle)(checkIn());

    expect(response.status).toBe(403);
    expect(response.headers.get(FAKE_EDGE_OUTCOME_HEADER)).toBe('blocked');
    expect(origin.reached).toEqual([]);
  });

  it('邊緣故障時請求到不了來源，呼叫端拿到邊緣不可用', async () => {
    const edge = new FakeEdgeProtection();
    const origin = countingOrigin();
    edge.injectOutage();

    const response = await withFakeEdge(edge, origin.handle)(checkIn());

    expect(response.status).toBe(502);
    expect(response.headers.get(FAKE_EDGE_OUTCOME_HEADER)).toBe('unavailable');
    expect(origin.reached).toEqual([]);
  });

  it('要求挑戰時請求到不了來源，呼叫端拿到挑戰頁而不是 JSON 業務回應', async () => {
    const edge = new FakeEdgeProtection();
    const origin = countingOrigin();
    edge.injectChallenge();

    const response = await withFakeEdge(edge, origin.handle)(checkIn());

    expect(response.status).toBe(403);
    expect(response.headers.get(FAKE_EDGE_OUTCOME_HEADER)).toBe('challenged');
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(origin.reached).toEqual([]);
  });

  it('回應中斷時來源已處理請求，呼叫端卻只拿到連線中斷；重試時正常拿到回應', async () => {
    const edge = new FakeEdgeProtection();
    const origin = countingOrigin();
    edge.injectResponseInterrupted({times: 1});
    const handle = withFakeEdge(edge, origin.handle);

    await expect(handle(checkIn())).rejects.toBeInstanceOf(
      EdgeResponseInterrupted,
    );
    const retried = await handle(checkIn());

    expect(retried.status).toBe(201);
    expect(origin.reached).toHaveLength(2);
  });
});
