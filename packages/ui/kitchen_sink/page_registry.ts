/**
 * @fileoverview Every kitchen-sink page, addressed as `/?page=<id>`. A UI
 * ticket adds its page by appending one entry here and one screenshot spec
 * under `tests/` (see packages/ui/README.md).
 */

import type {KitchenSinkPage} from './page_types';
import {BasePage} from './pages/base_page';
import {CasePage} from './pages/case_page';
import {DesktopStatesPage} from './pages/desktop_states_page';
import {OperationPage} from './pages/operation_page';
import {OverviewPage} from './pages/overview_page';
import {PlayerHomePage} from './pages/player_home_page';

/** Registered pages, in the order the index lists them. */
export const KITCHEN_SINK_PAGES: readonly KitchenSinkPage[] = [
  {id: 'base', title: 'Tokens and base components (00a)', component: BasePage},
  {
    id: 'player-home',
    title: 'Player home, ready and empty (00c)',
    component: PlayerHomePage,
  },
  {
    id: 'overview',
    title: '總覽頁 desktop page type (00b)',
    component: OverviewPage,
    fullBleed: true,
  },
  {
    id: 'operation',
    title: '作業頁 desktop page type (00b)',
    component: OperationPage,
    fullBleed: true,
  },
  {
    id: 'case',
    title: '案件頁 desktop page type (00b)',
    component: CasePage,
    fullBleed: true,
  },
  {
    id: 'desktop-states',
    title: 'Desktop data container states (00b)',
    component: DesktopStatesPage,
  },
];
