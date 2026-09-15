/**
 * @fileoverview Development-only entry point: what the role switcher needs
 * beyond the production `App`, namely listing every account without an actor.
 * dependency-cruiser lets only the real switcher
 * (`apps/web/dev_tools/role_switcher.tsx`) and test code import this file, and
 * the production build test checks it is not bundled.
 */

export {listAccountsForRoleSwitcher} from './lib/role_switcher_accounts';
