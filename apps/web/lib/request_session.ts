/**
 * @fileoverview Reads the host kind and session token of the current request
 * in server components, server actions and route handlers.
 */

import {
  type HostKind,
  parseSessionToken,
  type SessionToken,
} from '@pokernext/app';
import {cookies, headers} from 'next/headers';

import {hostKindOf} from './hosts';
import {sessionCookieName} from './session_cookie';

/** The host and session token of the current request. */
export interface RequestSession {
  /** Undefined when the request came to neither configured host. */
  readonly host?: HostKind;
  /** The raw `Host` header, for building links with the same port. */
  readonly hostHeader: string;
  /** The session cookie of this host, if it holds a well-formed token. */
  readonly token?: SessionToken;
}

/** Reads the current request's host kind and that host's session token. */
export async function readRequestSession(): Promise<RequestSession> {
  const hostHeader = (await headers()).get('host') ?? '';
  const host = hostKindOf(hostHeader);
  if (host === undefined) {
    return {hostHeader};
  }
  const token = parseSessionToken(
    (await cookies()).get(sessionCookieName(host))?.value,
  );
  return {host, hostHeader, token};
}
