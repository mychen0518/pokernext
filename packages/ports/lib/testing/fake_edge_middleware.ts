/**
 * @fileoverview The Cloudflare edge simulated as HTTP middleware (spec:
 * 受控替身「以中介層模擬」). It wraps any request handler, such as `fetch` to
 * a running server or a route handler called in-process, so every request
 * passes through an {@link EdgeProtection} before it reaches the origin.
 */

import type {EdgeProtection} from '../../index';

/** Takes an HTTP request and resolves its response: `fetch` or a handler. */
export type HttpHandler = (request: Request) => Promise<Response>;

/** Names what the fake edge did in its own responses: blocked, challenged…. */
export const FAKE_EDGE_OUTCOME_HEADER = 'pn-fake-edge';

/**
 * Thrown in place of a response when the origin handled the request but the
 * edge lost the response, the way a dropped connection surfaces to `fetch`.
 * The caller cannot tell whether the operation took effect.
 */
export class EdgeResponseInterrupted extends Error {
  constructor(readonly request: {method: string; url: string}) {
    super(
      `The edge lost the response to ${request.method} ${request.url} after the origin handled it.`,
    );
    this.name = 'EdgeResponseInterrupted';
  }
}

/**
 * Puts the edge in front of an origin handler. Blocks, challenges and
 * outages answer from the edge without reaching the origin; an interrupted
 * response reaches the origin and then rejects.
 */
export function withFakeEdge(
  edge: EdgeProtection,
  origin: HttpHandler,
): HttpHandler {
  return async request => {
    const url = new URL(request.url);
    let originResponse: Response | undefined;
    const outcome = await edge.pass(
      {host: url.host, method: request.method, path: url.pathname},
      async () => {
        originResponse = await origin(request);
        return originResponse;
      },
    );
    switch (outcome.status) {
      case 'delivered':
        return outcome.response;
      case 'blocked':
        return edgeResponse(
          'blocked',
          403,
          'text/plain',
          'Blocked by the edge.',
        );
      case 'challenged':
        return edgeResponse(
          'challenged',
          403,
          'text/html; charset=utf-8',
          '<!doctype html><title>Security check</title>',
        );
      case 'unavailable':
        return edgeResponse(
          'unavailable',
          502,
          'text/plain',
          'The edge is unavailable.',
        );
      case 'interrupted':
        await originResponse?.body?.cancel();
        throw new EdgeResponseInterrupted({
          method: request.method,
          url: request.url,
        });
    }
  };
}

function edgeResponse(
  outcome: string,
  status: number,
  contentType: string,
  body: string,
): Response {
  return new Response(body, {
    status,
    headers: {
      [FAKE_EDGE_OUTCOME_HEADER]: outcome,
      'content-type': contentType,
      'cache-control': 'no-store',
    },
  });
}
