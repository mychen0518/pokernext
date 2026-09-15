/**
 * @fileoverview Development-only role switcher (not a DESIGN.md §4 component):
 * lists every account through `@pokernext/app/dev` (dependency-cruiser allows
 * only this file to import it) and hands the entries to the Drawer. Imported
 * as `#role_switcher`; `next.config.ts` maps that import
 * to `role_switcher_removed.tsx` outside the development server, so production
 * bundles never contain this file.
 */

import {listAccountsForRoleSwitcher} from '@pokernext/app/dev';
import {headers} from 'next/headers';

import {originOf} from '../lib/hosts';
import {WORKSPACE_ROUTES} from '../lib/workspace_routes';
import {
  type RoleSwitcherEntry,
  RoleSwitcherDrawer,
} from './role_switcher_drawer';

/** Renders the 切換角色 button with every account the switcher offers. */
export async function RoleSwitcher() {
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get('host') ?? '';
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const accounts = await listAccountsForRoleSwitcher();
  const entries: RoleSwitcherEntry[] = accounts.map(account => {
    const route = WORKSPACE_ROUTES[account.workspace];
    return {
      accountId: account.id,
      displayName: account.displayName,
      roleLabel: account.roleLabel,
      workspaceName: route.name,
      switchUrl: `${originOf(route.host, hostHeader, protocol)}/dev/role-switch`,
    };
  });
  return <RoleSwitcherDrawer entries={entries} />;
}
