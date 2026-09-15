/**
 * @fileoverview Next.js config for the single POKERNEXT app (ADR-0001).
 *
 * Development tools exist only in the development server (`next dev`). In
 * every other phase, including `next build`, two build-time switches remove
 * them rather than hiding them at runtime:
 * - `#role_switcher` resolves to an empty component, so the role switcher and
 *   its account listing are not in the module graph;
 * - `.dev.ts(x)` is not a page extension, so `app/dev/**` routes do not exist.
 * `apps/web/tests/production_build.test.ts` checks the build output.
 */

import {fileURLToPath} from 'node:url';

import type {NextConfig} from 'next';
import {PHASE_DEVELOPMENT_SERVER} from 'next/constants';

/** Where `#role_switcher` points outside the development server. */
const REMOVED_ROLE_SWITCHER = './dev_tools/role_switcher_removed.tsx';

/** The local hosts, overridable like `apps/web/lib/hosts.ts`. */
const DEV_HOSTS = [
  process.env.POKERNEXT_PLAYER_HOST || 'player.localhost',
  process.env.POKERNEXT_WORK_HOST || 'work.localhost',
];

export default function nextConfig(phase: string): NextConfig {
  const withDevTools = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    // Separate output per use (demo, e2e, build test) so runs never share it.
    distDir: process.env.NEXT_DIST_DIR || '.next',
    pageExtensions: withDevTools
      ? ['tsx', 'ts', 'dev.tsx', 'dev.ts']
      : ['tsx', 'ts'],
    // The player and work-account hosts both reach the one dev server.
    allowedDevOrigins: DEV_HOSTS,
    // The floating dev indicator would cover BottomNav and 登出.
    devIndicators: false,
    // Workspace packages ship TypeScript source.
    transpilePackages: [
      '@pokernext/app',
      '@pokernext/db',
      '@pokernext/domain',
      '@pokernext/ports',
      '@pokernext/ui',
    ],
    // Node-only database driver: load it at runtime instead of bundling it.
    serverExternalPackages: ['pg'],
    turbopack: {
      // The pnpm workspace root, so Turbopack resolves hoisted dependencies.
      root: fileURLToPath(new URL('../..', import.meta.url)),
      resolveAlias: withDevTools
        ? {}
        : {'#role_switcher': REMOVED_ROLE_SWITCHER},
    },
  };
}
