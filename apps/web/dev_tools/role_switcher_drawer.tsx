/**
 * @fileoverview The role switcher's Button/secondary and Drawer: one Card per
 * workspace with its account and a button that opens the switch on that
 * workspace's host.
 */

'use client';

import {Button, Card, CardHeader, Drawer, UserChip} from '@pokernext/ui';
import {useState} from 'react';

import styles from './role_switcher_drawer.module.css';

/**
 * Marks the switcher in rendered HTML and bundles; the production build test
 * asserts this string is absent from `next build` output.
 */
const ROLE_SWITCHER_MARKER = 'pn-dev-role-switcher';

/** One account the switcher offers. */
export interface RoleSwitcherEntry {
  readonly accountId: string;
  readonly displayName: string;
  readonly roleLabel: string;
  /** CONTEXT.md name of the account's workspace. */
  readonly workspaceName: string;
  /** The switch endpoint on the host that serves the workspace. */
  readonly switchUrl: string;
}

/** Props for {@link RoleSwitcherDrawer}. */
export interface RoleSwitcherDrawerProps {
  entries: readonly RoleSwitcherEntry[];
}

/** Renders the 切換角色 button and the Drawer it opens. */
export function RoleSwitcherDrawer({entries}: RoleSwitcherDrawerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div data-dev-tool={ROLE_SWITCHER_MARKER}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        切換角色
      </Button>
      <Drawer
        open={open}
        title="切換角色（開發工具）"
        onClose={() => setOpen(false)}
      >
        <ul className={styles['entries']}>
          {entries.map(entry => (
            <li key={entry.accountId}>
              <Card header={<CardHeader title={entry.workspaceName} />}>
                <form
                  className={styles['entry']}
                  method="get"
                  action={entry.switchUrl}
                >
                  <input type="hidden" name="account" value={entry.accountId} />
                  <UserChip name={entry.displayName} role={entry.roleLabel} />
                  <Button type="submit" variant="secondary" size="sm">
                    {`以 ${entry.displayName} 進入`}
                  </Button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      </Drawer>
    </div>
  );
}
