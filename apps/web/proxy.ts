/**
 * @fileoverview Next.js proxy: decides which route group a host can reach.
 * The player host reaches the player workspace, the work-account host the
 * other five; anything else answers 404. This is routing, never authorization
 * (ADR-0001): every workspace page still resolves its session through
 * `app.sessions.resolve`.
 */

import {type NextRequest, NextResponse} from 'next/server';

import {hostKindOf} from './lib/hosts';
import {WORKSPACE_ROUTES, workspaceOfPath} from './lib/workspace_routes';

/** A path no route serves, so Next renders its 404 page. */
const UNREACHABLE_PATH = '/_unreachable';

/** Rewrites requests for a workspace on the wrong host to a 404. */
export function proxy(request: NextRequest): NextResponse {
  const workspace = workspaceOfPath(request.nextUrl.pathname);
  if (workspace === undefined) {
    return NextResponse.next();
  }
  const host = hostKindOf(request.headers.get('host'));
  if (host !== WORKSPACE_ROUTES[workspace].host) {
    return NextResponse.rewrite(new URL(UNREACHABLE_PATH, request.url));
  }
  return NextResponse.next();
}

/** Skips API routes and build assets. */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
