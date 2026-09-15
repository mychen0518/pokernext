/**
 * @fileoverview 健康檢查的 HTTP 邊界：探測請求從 API 進、經 use-case 寫入真實資料庫
 * 再讀回，只回報結果，不列出任何已存紀錄。伺服器與它自己的資料庫由 Playwright
 * globalSetup 啟動。每個請求也能先經過以中介層模擬的 Cloudflare 邊緣（誤擋、故障、
 * 挑戰、回應中斷）。
 */

import {type APIRequestContext, expect, test} from '@playwright/test';
import {
  EdgeResponseInterrupted,
  FAKE_EDGE_OUTCOME_HEADER,
  FakeEdgeProtection,
  withFakeEdge,
} from '@pokernext/app/testing';

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

test.describe('經過假 Cloudflare 邊緣的健康檢查', () => {
  /**
   * Sends requests to the test server through Playwright's request context
   * and counts the ones that reach it. (Node's global fetch leaves keep-alive
   * sockets that trip a libuv assertion when the Windows worker exits.)
   */
  function originServer(api: APIRequestContext, baseUrl: string) {
    const origin = {
      reached: 0,
      fetch: async (request: Request): Promise<Response> => {
        origin.reached += 1;
        const answered = await api.fetch(request.url, {
          method: request.method,
          headers: Object.fromEntries(request.headers),
        });
        return new Response(await answered.text(), {
          status: answered.status(),
          headers: answered.headers(),
        });
      },
      probe: () => new Request(`${baseUrl}/api/health`),
    };
    return origin;
  }

  test('邊緣正常時探測送達伺服器，回報健康', async ({baseURL, request}) => {
    const origin = originServer(request, String(baseURL));
    const edgeFetch = withFakeEdge(new FakeEdgeProtection(), origin.fetch);

    const response = await edgeFetch(origin.probe());

    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe('healthy');
    expect(origin.reached).toBe(1);
  });

  test('邊緣誤擋時探測到不了伺服器，拿到邊緣的阻擋而不是不健康', async ({
    baseURL,
    request,
  }) => {
    const origin = originServer(request, String(baseURL));
    const edge = new FakeEdgeProtection();
    edge.injectFalseBlock();

    const response = await withFakeEdge(edge, origin.fetch)(origin.probe());

    expect(response.status).toBe(403);
    expect(response.headers.get(FAKE_EDGE_OUTCOME_HEADER)).toBe('blocked');
    expect(origin.reached).toBe(0);
  });

  test('邊緣故障時探測到不了伺服器，拿到邊緣不可用', async ({
    baseURL,
    request,
  }) => {
    const origin = originServer(request, String(baseURL));
    const edge = new FakeEdgeProtection();
    edge.injectOutage();

    const response = await withFakeEdge(edge, origin.fetch)(origin.probe());

    expect(response.status).toBe(502);
    expect(response.headers.get(FAKE_EDGE_OUTCOME_HEADER)).toBe('unavailable');
    expect(origin.reached).toBe(0);
  });

  test('邊緣要求挑戰時探測到不了伺服器，拿到挑戰頁而不是 JSON', async ({
    baseURL,
    request,
  }) => {
    const origin = originServer(request, String(baseURL));
    const edge = new FakeEdgeProtection();
    edge.injectChallenge();

    const response = await withFakeEdge(edge, origin.fetch)(origin.probe());

    expect(response.status).toBe(403);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(origin.reached).toBe(0);
  });

  test('回應中斷時伺服器已完成探測、呼叫端拿不到回應，重試後回報健康', async ({
    baseURL,
    request,
  }) => {
    const origin = originServer(request, String(baseURL));
    const edge = new FakeEdgeProtection();
    edge.injectResponseInterrupted({times: 1});
    const edgeFetch = withFakeEdge(edge, origin.fetch);

    await expect(edgeFetch(origin.probe())).rejects.toBeInstanceOf(
      EdgeResponseInterrupted,
    );
    const retried = await edgeFetch(origin.probe());

    expect(retried.status).toBe(200);
    expect((await retried.json()).status).toBe('healthy');
    expect(origin.reached).toBe(2);
  });
});
