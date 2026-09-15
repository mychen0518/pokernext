/**
 * @fileoverview Next.js config for the single POKERNEXT app (ADR-0001).
 */

import {fileURLToPath} from 'node:url';

import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
  // The pnpm workspace root, so Turbopack resolves hoisted dependencies.
  turbopack: {root: fileURLToPath(new URL('../..', import.meta.url))},
};

export default nextConfig;
