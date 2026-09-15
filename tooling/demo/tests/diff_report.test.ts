/**
 * @fileoverview The `demo:diff` report: one HTML file that shows, per page and
 * viewport, the formal page, the prototype page and the diff side by side
 * with the diff percentage, largest difference first.
 */

import {mkdtempSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {describe, expect, test} from 'vitest';

import {type DiffReportEntry, writeDiffReport} from '../diff';

/** A report entry whose image names are derived from the page id. */
function entry(
  pageId: string,
  title: string,
  viewport: 'desktop' | 'mobile',
  diffRatio: number,
): DiffReportEntry {
  return {
    pageId,
    title,
    viewport,
    formalUrl: `http://work.localhost:3000/${pageId}`,
    prototypeRoute: `#/${pageId}/home`,
    formalImage: `images/${pageId}-${viewport}-formal.png`,
    prototypeImage: `images/${pageId}-${viewport}-prototype.png`,
    diffImage: `images/${pageId}-${viewport}-diff.png`,
    diffRatio,
  };
}

describe('差異報告', () => {
  test('頁面依差異比例由大到小排列，並列出百分比', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'diff-report-'));

    const reportPath = writeDiffReport({
      outputDir,
      entries: [
        entry('venue', '場館工作區首頁', 'desktop', 0.125),
        entry('player', '玩家工作區首頁', 'mobile', 0.5),
        entry('admin', '管理工作區首頁', 'desktop', 0.0321),
      ],
    });

    const html = readFileSync(reportPath, 'utf8');
    const positions = [
      '玩家工作區首頁',
      '場館工作區首頁',
      '管理工作區首頁',
    ].map(title => html.indexOf(title));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html).toContain('50.0%');
    expect(html).toContain('12.5%');
    expect(html).toContain('3.2%');
  });

  test('每頁每個寬度並排引用正式頁、原型頁與差異圖三張圖', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'diff-report-'));

    const reportPath = writeDiffReport({
      outputDir,
      entries: [
        entry('venue', '場館工作區首頁', 'desktop', 0.2),
        entry('venue', '場館工作區首頁', 'mobile', 0.4),
      ],
    });

    expect(reportPath).toBe(join(outputDir, 'index.html'));
    const html = readFileSync(reportPath, 'utf8');
    for (const viewport of ['desktop', 'mobile']) {
      for (const kind of ['formal', 'prototype', 'diff']) {
        expect(html).toContain(`src="images/venue-${viewport}-${kind}.png"`);
      }
    }
    expect(html.indexOf('venue-mobile-formal.png')).toBeLessThan(
      html.indexOf('venue-desktop-formal.png'),
    );
    expect(html).toContain('1440×1024');
    expect(html).toContain('390×844');
  });

  test('標題中的 HTML 特殊字元會被跳脫，報告不會壞掉', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'diff-report-'));

    const reportPath = writeDiffReport({
      outputDir,
      entries: [entry('agent', '<Agent> & 客戶', 'desktop', 0.1)],
    });

    expect(readFileSync(reportPath, 'utf8')).toContain(
      '&lt;Agent&gt; &amp; 客戶',
    );
  });
});
