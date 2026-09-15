/**
 * @fileoverview Shape of a kitchen-sink page, shared by the registry and the
 * pages so neither imports the other.
 */

import type {ComponentType} from 'react';

/** Props every kitchen-sink page receives. */
export interface KitchenSinkPageProps {
  /**
   * The URL query, so a page can offer variants such as
   * `?page=player-home&state=empty`.
   */
  readonly params: URLSearchParams;
}

/** One entry in the kitchen-sink page registry. */
export interface KitchenSinkPage {
  /** Value of the `page` query parameter, e.g. `base`. */
  readonly id: string;
  readonly title: string;
  readonly component: ComponentType<KitchenSinkPageProps>;
}
