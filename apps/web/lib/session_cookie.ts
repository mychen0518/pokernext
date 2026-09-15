/**
 * @fileoverview The session cookie: an opaque token only, one cookie name per
 * host kind, host-only (no `Domain`), `HttpOnly`, `SameSite=Lax`, and `Secure`
 * with the `__Host-` prefix outside local development (ADR-0001: 兩個 host
 * 各自一組 cookie).
 */

import type {HostKind} from '@pokernext/app';

/** Cookie attributes Next's `cookies().set` accepts. */
export interface SessionCookieOptions {
  readonly httpOnly: true;
  readonly sameSite: 'lax';
  readonly secure: boolean;
  readonly path: '/';
}

/** Tells whether cookies must be `Secure`: everywhere but local development. */
function isSecure(env: {readonly NODE_ENV?: string}): boolean {
  return env.NODE_ENV === 'production';
}

/** Returns the session cookie name for a host kind. */
export function sessionCookieName(
  host: HostKind,
  env: {readonly NODE_ENV?: string} = process.env,
): string {
  // `__Host-` makes the browser refuse the cookie unless it is Secure,
  // host-only and scoped to `/`; it needs HTTPS, so local dev drops it.
  const prefix = isSecure(env) ? '__Host-' : '';
  return `${prefix}pn_${host}_session`;
}

/** Returns the attributes of a session cookie. No `Domain`: host-only. */
export function sessionCookieOptions(
  env: {readonly NODE_ENV?: string} = process.env,
): SessionCookieOptions {
  return {httpOnly: true, sameSite: 'lax', secure: isSecure(env), path: '/'};
}
