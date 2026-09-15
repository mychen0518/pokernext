/**
 * @fileoverview The server's single application instance. apps/web only
 * resolves requests and renders projections; behaviour lives in the use-cases.
 */

import {type App, createAppFromEnvironment} from '@pokernext/app';

/** Where the instance survives module reloads in `next dev`. */
interface AppHolder {
  pokernextApp?: App;
}

/**
 * Returns the application built from the environment, creating it on first
 * use so every request shares one database pool.
 */
export function getRuntimeApp(): App {
  // Safe: only adds an optional property; globalThis outlives hot reloads,
  // so dev reloads reuse the pool instead of opening a new one each time.
  const holder = globalThis as AppHolder;
  holder.pokernextApp ??= createAppFromEnvironment();
  return holder.pokernextApp;
}
