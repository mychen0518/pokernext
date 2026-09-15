/**
 * @fileoverview HTTP boundary of the health check: `POST /api/health` records
 * a health check for a request key and returns the stored record;
 * `GET /api/health[?requestKey=…]` lists recorded health checks.
 */

import {getRuntimeApp} from '../../../lib/runtime_app';

/** Records a health check once per request key. */
export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => undefined);
  const requestKey =
    typeof body === 'object' &&
    body !== null &&
    'requestKey' in body &&
    typeof body.requestKey === 'string'
      ? body.requestKey
      : '';
  const outcome = await getRuntimeApp().healthCheck.record({requestKey});
  const status = {recorded: 201, alreadyRecorded: 200, rejected: 400}[
    outcome.status
  ];
  return Response.json(outcome, {status});
}

/** Lists recorded health checks, optionally for one request key. */
export async function GET(request: Request): Promise<Response> {
  const requestKey = new URL(request.url).searchParams.get('requestKey');
  const records = await getRuntimeApp().healthCheck.list({
    requestKey: requestKey ?? undefined,
  });
  return Response.json({records});
}
