/**
 * @fileoverview The IPC contract between `pnpm demo` started as a child
 * process (lib/run_demo.ts) and the tool that started it
 * (lib/demo_server.ts). Kept apart so the tool does not load the database
 * modules the demo itself needs.
 */

/** Asks a demo started with an IPC channel to stop Next and Postgres. */
export const STOP_MESSAGE = 'stop-demo';

/** Set to `1` by the tool so the demo listens for {@link STOP_MESSAGE}. */
export const STOP_ON_IPC_ENV = 'POKERNEXT_DEMO_STOP_ON_IPC';
