/**
 * @fileoverview HTTP boundary of the health check: `GET /api/health` probes
 * the application by writing a health check to the database and reading it
 * back, and answers only whether that worked. It lists no stored record and
 * accepts no input.
 */

import {getRuntimeApp} from '../../../lib/runtime_app';

// Every request probes the database; never prerender or cache the answer.
export const dynamic = 'force-dynamic';

/** Answers 200 when the database round trip worked, 503 otherwise. */
export async function GET(): Promise<Response> {
  const outcome = await getRuntimeApp().healthCheck.probe();
  return Response.json(outcome, {
    status: outcome.status === 'healthy' ? 200 : 503,
    headers: {'Cache-Control': 'no-store'},
  });
}
