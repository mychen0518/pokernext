/**
 * @fileoverview What every use-case runs on. Each group of use-cases is built
 * from the whole set, so a use-case that needs an external port (OCR, KMS,
 * notifications, …) finds the injected one, real or fake, without changing
 * the composition.
 */

import type {Database} from '@pokernext/db';
import type {Clock, ExternalPorts} from '@pokernext/ports';

/** What the use-cases run on. */
export interface AppDependencies {
  readonly database: Database;
  readonly clock: Clock;
  readonly ports: ExternalPorts;
}
