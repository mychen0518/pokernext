/**
 * @fileoverview Playwright globalSetup. Playwright only loads a default
 * export, so this file re-exports the named setup (docs/CODING_STANDARDS.md).
 */

export {startWebServer as default} from './support/web_server';
