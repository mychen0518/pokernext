/**
 * @fileoverview Every kitchen-sink page, addressed as `/?page=<id>`. A UI
 * ticket adds its page by appending one entry here and one screenshot spec
 * under `tests/` (see packages/ui/README.md).
 */

import type {KitchenSinkPage} from './page_types';
import {BasePage} from './pages/base_page';

/** Registered pages, in the order the index lists them. */
export const KITCHEN_SINK_PAGES: readonly KitchenSinkPage[] = [
  {id: 'base', title: 'Tokens and base components (00a)', component: BasePage},
];
