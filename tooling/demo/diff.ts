/**
 * @fileoverview Entry point of the `demo:diff` building blocks: the mapping
 * table, the screenshot comparison and the side-by-side report. The command
 * itself is `diff_main.ts`.
 */

export {loadDiffPages, VIEWPORT_SIZES} from './lib/diff_pages';
export type {
  DiffPage,
  FormalPage,
  HostKind,
  PrototypePage,
  SignInAs,
  ViewportName,
} from './lib/diff_pages';
export {compareScreenshots} from './lib/screenshot_comparison';
export type {ScreenshotComparison} from './lib/screenshot_comparison';
export {writeDiffReport} from './lib/diff_report';
export type {DiffReportEntry, DiffReportOptions} from './lib/diff_report';
