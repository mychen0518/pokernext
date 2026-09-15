/**
 * @fileoverview Entry point for tools that need a running `pnpm demo`: start
 * it or reuse the one already running, and the host origins and role-switch
 * URLs to reach it. `demo:diff` and the `demo:script` Playwright run use it.
 */

export {demoOrigins, ensureDemoServer, roleSwitchUrl} from './lib/demo_server';
export type {
  DemoHostEnvironment,
  DemoOrigins,
  DemoServer,
} from './lib/demo_server';
