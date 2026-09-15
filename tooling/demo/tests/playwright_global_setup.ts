/**
 * @fileoverview Playwright globalSetup of `demo:script`. Playwright only loads
 * a default export, so this file re-exports the named setup
 * (docs/CODING_STANDARDS.md).
 */

export {startScriptDemo as default} from './support/script_demo';
