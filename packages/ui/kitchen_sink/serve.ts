/**
 * @fileoverview Starts the dev-only kitchen-sink on `KITCHEN_SINK_PORT`
 * (default 5173) with Vite's JS API. Never part of a production build: it
 * lives in a private folder that `index.ts` does not import, and
 * dependency-cruiser forbids importing it from anywhere else.
 */

import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';

const DEFAULT_PORT = 5173;

/** Reads the port from the environment, falling back to Vite's default. */
function readPort(): number {
  const raw = process.env.KITCHEN_SINK_PORT;
  if (raw === undefined || raw === '') {
    return DEFAULT_PORT;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`KITCHEN_SINK_PORT must be a port number, got "${raw}"`);
  }
  return port;
}

async function main(): Promise<void> {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('.', import.meta.url)),
    plugins: [react()],
    server: {host: '127.0.0.1', port: readPort(), strictPort: true},
    // Pre-bundle up front so the first page load never triggers a reload.
    optimizeDeps: {
      include: [
        'lucide-react',
        'react',
        'react-dom/client',
        'react/jsx-dev-runtime',
      ],
    },
  });
  await server.listen();
  server.printUrls();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
