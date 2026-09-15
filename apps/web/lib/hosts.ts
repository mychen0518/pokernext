/**
 * @fileoverview Which host a request arrived on. The player workspace and the
 * work-account workspaces are served on different hosts (ADR-0001); the host
 * names come from the environment so production hosts can differ from the
 * domain's local `*.localhost` pair. Imports only `@pokernext/app/routing`,
 * so `next.config.ts` can load it without the database.
 */

import {type HostKind, LOCAL_HOST_NAMES} from '@pokernext/app/routing';

/** The environment variables that name the hosts. */
export interface HostEnvironment {
  readonly POKERNEXT_PLAYER_HOST?: string;
  readonly POKERNEXT_WORK_HOST?: string;
  readonly NODE_ENV?: string;
}

/** Returns the configured host name for each host kind, lowercased. */
export function configuredHosts(
  env: HostEnvironment = process.env,
): Readonly<Record<HostKind, string>> {
  return {
    player: (
      env.POKERNEXT_PLAYER_HOST || LOCAL_HOST_NAMES.player
    ).toLowerCase(),
    work: (env.POKERNEXT_WORK_HOST || LOCAL_HOST_NAMES.work).toLowerCase(),
  };
}

/**
 * Tells which host kind a `Host` header names, ignoring the port; undefined
 * for any other host, such as a bare IP address.
 */
export function hostKindOf(
  hostHeader: string | null | undefined,
  env: HostEnvironment = process.env,
): HostKind | undefined {
  if (hostHeader == null) {
    return undefined;
  }
  const hostname = hostHeader.replace(/:\d+$/, '').toLowerCase();
  const hosts = configuredHosts(env);
  if (hostname === hosts.player) {
    return 'player';
  }
  if (hostname === hosts.work) {
    return 'work';
  }
  return undefined;
}

/**
 * Builds the origin of a host kind with the scheme and port the current
 * request used, e.g. `http://work.localhost:3000` from `player.localhost:3000`.
 */
export function originOf(
  kind: HostKind,
  requestHostHeader: string,
  protocol: string,
  env: HostEnvironment = process.env,
): string {
  const port = /:(\d+)$/.exec(requestHostHeader)?.[1];
  const host = configuredHosts(env)[kind];
  return `${protocol}://${host}${port === undefined ? '' : `:${port}`}`;
}
