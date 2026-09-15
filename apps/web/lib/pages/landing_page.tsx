/**
 * @fileoverview `/` on either host: a signed-in session goes to its own
 * workspace home; without one the refusal page says so.
 */

import {notFound, redirect} from 'next/navigation';

import {readRequestSession} from '../request_session';
import {getRuntimeApp} from '../runtime_app';
import {WORKSPACE_ROUTES} from '../workspace_routes';
import {RefusalPage} from './refusal_page';

/** Redirects to the session's workspace home or renders the refusal page. */
export async function LandingPage() {
  const {host, token} = await readRequestSession();
  if (host === undefined) {
    notFound();
  }
  const home = await getRuntimeApp().sessions.home({token, host});
  if (home.status === 'signedIn') {
    redirect(WORKSPACE_ROUTES[home.workspace].path);
  }
  return <RefusalPage reason="noSession" />;
}
