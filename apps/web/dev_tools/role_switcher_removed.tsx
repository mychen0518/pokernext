/**
 * @fileoverview What `#role_switcher` resolves to outside the development
 * server (`next.config.ts`): renders nothing and imports nothing, so neither
 * the switcher nor its account listing reaches a production bundle.
 */

/** Renders nothing: production builds have no role switcher. */
export function RoleSwitcher() {
  return null;
}
