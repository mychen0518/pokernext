/**
 * @fileoverview Development-only role switch: ends the session of the host the
 * request came to, starts a session for the chosen account through the one
 * session use-case, and redirects to that account's workspace home, where
 * `app.sessions.resolve` checks it like any other request. Reachable only from
 * `app/dev/role-switch/route.dev.ts`, which production builds do not route.
 *
 * It is a GET because the switcher links to the other host: a top-level GET
 * carries that host's `SameSite=Lax` cookie, so its current session can be
 * ended; a cross-site POST would not.
 */

import {parseAccountId, parseSessionToken} from '@pokernext/app';
import {type NextRequest, NextResponse} from 'next/server';

import {hostKindOf, originOf} from '../lib/hosts';
import {getRuntimeApp} from '../lib/runtime_app';
import {sessionCookieName, sessionCookieOptions} from '../lib/session_cookie';
import {WORKSPACE_ROUTES} from '../lib/workspace_routes';

/** Switches this host's session to the account named by `?account=`. */
export async function GET(request: NextRequest): Promise<Response> {
  const hostHeader = request.headers.get('host') ?? '';
  const host = hostKindOf(hostHeader);
  if (host === undefined) {
    return new Response('Not Found', {status: 404});
  }
  const app = getRuntimeApp();
  const cookieName = sessionCookieName(host);
  await app.sessions.end({
    token: parseSessionToken(request.cookies.get(cookieName)?.value),
    host,
  });
  const accountId = parseAccountId(request.nextUrl.searchParams.get('account'));
  const started =
    accountId === undefined
      ? undefined
      : await app.sessions.start({accountId, host});
  const origin = originOf(
    host,
    hostHeader,
    request.nextUrl.protocol.replace(/:$/, ''),
  );
  const path =
    started?.status === 'started'
      ? WORKSPACE_ROUTES[started.account.workspace].path
      : '/';
  const response = NextResponse.redirect(`${origin}${path}`, 303);
  if (started?.status === 'started') {
    response.cookies.set(cookieName, started.token, sessionCookieOptions());
  } else {
    response.cookies.delete(cookieName);
  }
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
