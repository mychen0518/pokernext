/**
 * @fileoverview `GET /dev/role-switch?account=<id>`: the role switcher's
 * entry. The `.dev.ts` extension is a page extension only in the Next.js
 * development server (`next.config.ts`), so production builds have no such
 * route.
 */

export {GET} from '../../../dev_tools/role_switch_route';
