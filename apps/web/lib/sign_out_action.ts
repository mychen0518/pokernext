/**
 * @fileoverview Server action behind 登出: ends the session on the host the
 * request came to and clears that host's cookie.
 */

'use server';

import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';

import {readRequestSession} from './request_session';
import {getRuntimeApp} from './runtime_app';
import {sessionCookieName} from './session_cookie';

/** Ends the current host's session, clears its cookie and goes to `/`. */
export async function signOut(): Promise<never> {
  const {host, token} = await readRequestSession();
  if (host !== undefined) {
    await getRuntimeApp().sessions.end({token, host});
    (await cookies()).delete(sessionCookieName(host));
  }
  redirect('/');
}
