/**
 * @fileoverview Where `pnpm demo` serves: the port and the player and
 * work-account host names, from the environment or else the domain's local
 * defaults (`LOCAL_HOST_NAMES`, `DEFAULT_DEMO_PORT`). The demo itself and the
 * tools that reach it read them here.
 */

import {
  DEFAULT_DEMO_PORT,
  type HostKind,
  LOCAL_HOST_NAMES,
} from '@pokernext/app/routing';

/** The environment variables `pnpm demo` reads for its hosts and port. */
export interface DemoHostEnvironment {
  /** Every other variable, passed on to a demo started by a tool. */
  readonly [name: string]: string | undefined;
  readonly DEMO_PORT?: string;
  readonly POKERNEXT_PLAYER_HOST?: string;
  readonly POKERNEXT_WORK_HOST?: string;
}

/** The two host origins of the demo, e.g. `http://work.localhost:3000`. */
export type DemoOrigins = Readonly<Record<HostKind, string>>;

/** Returns the port the demo serves both hosts on. */
export function demoPort(env: DemoHostEnvironment = process.env): number {
  return Number(env.DEMO_PORT || DEFAULT_DEMO_PORT);
}

/** Returns the demo's player and work-account origins. */
export function demoOrigins(
  env: DemoHostEnvironment = process.env,
): DemoOrigins {
  const port = demoPort(env);
  const player = env.POKERNEXT_PLAYER_HOST || LOCAL_HOST_NAMES.player;
  const work = env.POKERNEXT_WORK_HOST || LOCAL_HOST_NAMES.work;
  return {
    player: `http://${player}:${port}`,
    work: `http://${work}:${port}`,
  };
}
