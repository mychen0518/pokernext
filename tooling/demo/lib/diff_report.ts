/**
 * @fileoverview Writes the `demo:diff` report: one HTML file with inline
 * styles (the DESIGN.md tokens from `@pokernext/ui/tokens.css`) and no
 * scripts, which shows per page and viewport the formal page, the prototype
 * page and the diff image side by side, largest difference first. Images are
 * files next to the report, referenced by relative path.
 */

import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';

import {VIEWPORT_SIZES, type ViewportName} from './diff_pages';

const REPORT_FILE_NAME = 'index.html';

/** One compared page at one viewport. */
export interface DiffReportEntry {
  readonly pageId: string;
  readonly title: string;
  readonly viewport: ViewportName;
  /** Where the formal page was captured. */
  readonly formalUrl: string;
  readonly prototypeRoute: string;
  /** Image paths relative to the report's directory. */
  readonly formalImage: string;
  readonly prototypeImage: string;
  readonly diffImage: string;
  /** Differing pixels divided by all pixels, 0 to 1. */
  readonly diffRatio: number;
}

/** What to write where. */
export interface DiffReportOptions {
  readonly outputDir: string;
  readonly entries: readonly DiffReportEntry[];
  /** Shown in the report header; defaults to now. */
  readonly generatedAt?: Date;
}

/** Writes `index.html` into the output directory and returns its path. */
export function writeDiffReport(options: DiffReportOptions): string {
  const entries = [...options.entries].sort(
    (a, b) => b.diffRatio - a.diffRatio,
  );
  const generatedAt = options.generatedAt ?? new Date();
  const html = `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8">
    <title>demo:diff 正式頁與原型差異報告</title>
    <style>
${designTokens()}
${REPORT_STYLES}
    </style>
  </head>
  <body>
    <header class="report-header">
      <p class="overline">POKERNEXT · DEMO DIFF</p>
      <h1>正式頁與原型差異報告</h1>
      <p class="muted">產生時間 ${escapeHtml(generatedAt.toISOString())}，共
        ${entries.length} 個頁面寬度，依差異比例由大到小排列。差異比例＝不同的像素
        ÷ 補齊到較大尺寸後的全部像素；高度不同時多出的部分算作差異。</p>
    </header>
    <main>
      <table class="summary">
        <thead>
          <tr><th>#</th><th>頁面</th><th>寬度</th><th>差異比例</th></tr>
        </thead>
        <tbody>
${entries.map((entry, index) => summaryRow(entry, index)).join('\n')}
        </tbody>
      </table>
${entries.map((entry, index) => entrySection(entry, index)).join('\n')}
    </main>
  </body>
</html>
`;
  mkdirSync(options.outputDir, {recursive: true});
  const reportPath = join(options.outputDir, REPORT_FILE_NAME);
  writeFileSync(reportPath, html);
  return reportPath;
}

function summaryRow(entry: DiffReportEntry, index: number): string {
  return `          <tr>
            <td>${index + 1}</td>
            <td><a href="#${anchorOf(entry)}">${escapeHtml(entry.title)}</a></td>
            <td>${viewportLabel(entry.viewport)}</td>
            <td class="ratio">${percent(entry.diffRatio)}</td>
          </tr>`;
}

function entrySection(entry: DiffReportEntry, index: number): string {
  return `      <section class="entry" id="${anchorOf(entry)}">
        <h2>${index + 1}. ${escapeHtml(entry.title)}
          <span class="muted">${viewportLabel(entry.viewport)}</span>
          <span class="ratio">差異 ${percent(entry.diffRatio)}</span></h2>
        <p class="muted mono">${escapeHtml(entry.pageId)} · 正式頁
          ${escapeHtml(entry.formalUrl)} · 原型 ${escapeHtml(entry.prototypeRoute)}</p>
        <div class="images">
${figure('正式頁', entry.formalImage)}
${figure('原型頁', entry.prototypeImage)}
${figure('差異圖', entry.diffImage)}
        </div>
      </section>`;
}

function figure(caption: string, src: string): string {
  const path = escapeHtml(src);
  return `          <figure>
            <figcaption>${caption}</figcaption>
            <a href="${path}"><img src="${path}" alt="${caption}"></a>
          </figure>`;
}

function anchorOf(entry: DiffReportEntry): string {
  return `${entry.pageId}-${entry.viewport}`;
}

function viewportLabel(viewport: ViewportName): string {
  const {width, height} = VIEWPORT_SIZES[viewport];
  return `${width}×${height}`;
}

function percent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/** The DESIGN.md token declarations, inlined so the report is one file. */
function designTokens(): string {
  const tokensPath = createRequire(import.meta.url).resolve(
    '@pokernext/ui/tokens.css',
  );
  return readFileSync(tokensPath, 'utf8');
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const REPORT_STYLES = `
body {
  background: var(--pn-bg);
  color: var(--pn-text);
  font-family: var(--pn-type-body-family);
  font-size: var(--pn-type-body-size);
  line-height: var(--pn-type-body-line);
  margin: 0;
  padding: var(--pn-space-8) var(--pn-space-6);
}

a {
  color: var(--pn-gold);
}

h1 {
  font-family: var(--pn-type-title-lg-family);
  font-size: var(--pn-type-title-lg-size);
  margin: 0 0 var(--pn-space-2);
}

h2 {
  font-family: var(--pn-type-title-md-family);
  font-size: var(--pn-type-title-md-size);
  margin: 0 0 var(--pn-space-1);
}

.overline {
  color: var(--pn-gold);
  font-size: var(--pn-type-overline-size);
  letter-spacing: var(--pn-type-overline-tracking);
  margin: 0 0 var(--pn-space-2);
}

.muted {
  color: var(--pn-text-2);
  font-size: var(--pn-type-body-sm-size);
}

.mono {
  font-family: var(--pn-font-mono);
  margin: 0 0 var(--pn-space-4);
}

.ratio {
  color: var(--pn-gold-bright);
  font-family: var(--pn-font-mono);
  margin-left: var(--pn-space-3);
}

.report-header {
  margin-bottom: var(--pn-space-6);
}

.summary {
  border-collapse: collapse;
  margin-bottom: var(--pn-space-8);
}

.summary th,
.summary td {
  border-bottom: 1px solid var(--pn-border);
  padding: var(--pn-space-2) var(--pn-space-4);
  text-align: left;
}

.summary th {
  color: var(--pn-text-2);
  font-size: var(--pn-type-label-size);
  font-weight: 500;
}

.entry {
  background: var(--pn-surface);
  border: 1px solid var(--pn-border);
  border-radius: var(--pn-radius-lg);
  margin-bottom: var(--pn-space-6);
  padding: var(--pn-space-6);
}

.images {
  align-items: start;
  display: grid;
  gap: var(--pn-space-4);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

figure {
  margin: 0;
}

figcaption {
  color: var(--pn-text-2);
  font-size: var(--pn-type-label-size);
  margin-bottom: var(--pn-space-2);
}

img {
  border: 1px solid var(--pn-border-strong);
  display: block;
  max-width: 100%;
}
`;
