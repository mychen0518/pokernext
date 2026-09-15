/**
 * @fileoverview `pnpm demo:diff`: for every row of the mapping table and each
 * of its viewports, captures the formal page (signed in through the
 * development role switch, in a fresh browser context) and the prototype
 * page (browser storage cleared, then reloaded), compares them and writes the
 * side-by-side report to `tooling/demo/reports/diff/`.
 */

import {mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from '@playwright/test';

import {ensureDemoServer, roleSwitchUrl} from './demo_server';
import {
  type DiffPage,
  loadDiffPages,
  VIEWPORT_SIZES,
  type ViewportName,
} from './diff_pages';
import {type DiffReportEntry, writeDiffReport} from './diff_report';
import {startPrototypeServer} from './prototype_server';
import {compareScreenshots} from './screenshot_comparison';

/** Where the report goes; `tooling/demo/reports/` is gitignored. */
const DEFAULT_OUTPUT_DIR = fileURLToPath(
  new URL('../reports/diff/', import.meta.url),
);
const IMAGES_DIR_NAME = 'images';
const NAVIGATION_TIMEOUT_MILLISECONDS = 120_000;

/** Options of {@link runDemoDiff}. */
export interface DemoDiffOptions {
  /** Mapping table; defaults to `tooling/demo/diff_pages.json`. */
  readonly pagesPath?: string;
  readonly outputDir?: string;
  readonly log?: (message: string) => void;
}

/** Runs the whole comparison and returns the report path. */
export async function runDemoDiff(
  options: DemoDiffOptions = {},
): Promise<string> {
  const log = options.log ?? console.log;
  const pages = loadDiffPages(options.pagesPath);
  const outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  rmSync(outputDir, {recursive: true, force: true});
  mkdirSync(join(outputDir, IMAGES_DIR_NAME), {recursive: true});

  const demo = await ensureDemoServer(process.env, log);
  const prototype = await startPrototypeServer();
  let browser: Browser | undefined;
  const entries: DiffReportEntry[] = [];
  try {
    browser = await chromium.launch();
    for (const page of pages) {
      for (const viewport of page.viewports) {
        const entry = await compareOne(browser, {
          page,
          viewport,
          outputDir,
          formalOrigin: demo.origins[page.formal.host],
          prototypePageUrl: prototype.pageUrl,
        });
        log(
          `[diff] ${page.id.padEnd(16)} ${viewport.padEnd(7)} ` +
            `${(entry.diffRatio * 100).toFixed(1)}%`,
        );
        entries.push(entry);
      }
    }
  } finally {
    await browser?.close();
    await prototype.close();
    await demo.stop();
  }
  return writeDiffReport({outputDir, entries});
}

/** One row at one viewport. */
interface Capture {
  readonly page: DiffPage;
  readonly viewport: ViewportName;
  readonly outputDir: string;
  readonly formalOrigin: string;
  readonly prototypePageUrl: string;
}

async function compareOne(
  browser: Browser,
  capture: Capture,
): Promise<DiffReportEntry> {
  const {page, viewport, outputDir} = capture;
  const formalUrl = `${capture.formalOrigin}${page.formal.path}`;
  const formalPng = await captureFormal(browser, capture, formalUrl);
  const prototypePng = await capturePrototype(browser, capture);
  const comparison = compareScreenshots(formalPng, prototypePng);

  const base = `${IMAGES_DIR_NAME}/${page.id}-${viewport}`;
  const images = {
    formalImage: `${base}-formal.png`,
    prototypeImage: `${base}-prototype.png`,
    diffImage: `${base}-diff.png`,
  };
  writeFileSync(join(outputDir, images.formalImage), formalPng);
  writeFileSync(join(outputDir, images.prototypeImage), prototypePng);
  writeFileSync(join(outputDir, images.diffImage), comparison.diffImage);
  return {
    pageId: page.id,
    title: page.title,
    viewport,
    formalUrl,
    prototypeRoute: page.prototype.route,
    ...images,
    diffRatio: comparison.diffRatio,
  };
}

/**
 * Waits until the fonts the page's text needs have loaded. A unicode-range
 * subset starts loading at the first layout that needs one of its glyphs, so
 * wait a frame before `document.fonts.ready`.
 */
async function waitForFonts(tab: Page): Promise<void> {
  await tab.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(resolve));
    await document.fonts.ready;
  });
}

async function captureFormal(
  browser: Browser,
  {page, viewport}: Capture,
  formalUrl: string,
): Promise<Buffer> {
  return withContext(browser, viewport, async context => {
    const tab = await context.newPage();
    const {signInAs} = page.formal;
    if (signInAs !== undefined) {
      await tab.goto(roleSwitchUrl(page.formal.host, signInAs));
      if (new URL(tab.url()).pathname === '/') {
        throw new Error(
          `${page.id}: signing in as ${JSON.stringify(signInAs)} on the ` +
            `${page.formal.host} host did not open a workspace.`,
        );
      }
    }
    await tab.goto(formalUrl);
    await waitForFonts(tab);
    return tab.screenshot({
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
  });
}

async function capturePrototype(
  browser: Browser,
  {page, viewport, prototypePageUrl}: Capture,
): Promise<Buffer> {
  return withContext(browser, viewport, async context => {
    const tab = await context.newPage();
    await tab.goto(`${prototypePageUrl}${page.prototype.route}`);
    // The prototype keeps its state in localStorage (`pn-proto-v1`); start
    // from its seed every time so screenshots are reproducible.
    await tab.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await tab.reload();
    await waitForFonts(tab);
    return tab.screenshot({
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
  });
}

/** Runs the callback in a fresh context with the DESIGN.md viewport. */
async function withContext<T>(
  browser: Browser,
  viewport: ViewportName,
  callback: (context: BrowserContext) => Promise<T>,
): Promise<T> {
  const context = await browser.newContext({
    viewport: VIEWPORT_SIZES[viewport],
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    locale: 'zh-TW',
    timezoneId: 'Asia/Seoul',
    reducedMotion: 'reduce',
  });
  context.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MILLISECONDS);
  try {
    return await callback(context);
  } finally {
    await context.close();
  }
}
