/**
 * @fileoverview 天城每日／期初積分 Excel 替身：格式版本不符、同版本不同內容、缺列、
 * 阻擋錯誤。
 */

import {describe, expect, it} from 'vitest';

import type {PointsWorkbookRead} from '../index';
import {FakePointsWorkbookSource} from '../testing';

const DAILY_0911 = {
  fileVersion: '2026-09-11#1',
  rows: [
    {
      rowNumber: 2,
      venueMemberNo: 'TC-10001',
      activityDate: '2026-09-11',
      points: 10_000,
    },
    {
      rowNumber: 3,
      venueMemberNo: 'TC-10002',
      activityDate: '2026-09-11',
      points: 4_500,
    },
    {
      rowNumber: 4,
      venueMemberNo: 'TC-10003',
      activityDate: '2026-09-11',
      points: 800,
    },
  ],
};

/** Reads a daily workbook and insists that it parsed. */
async function readParsed(
  source: FakePointsWorkbookSource,
  fileId: string,
): Promise<PointsWorkbookRead['workbook']> {
  const result = await source.read({fileId, kind: 'daily'});
  if (result.status !== 'read') {
    throw new Error(`expected ${fileId} to parse, got ${result.status}`);
  }
  return result.workbook;
}

describe('天城積分 Excel 替身', () => {
  it('格式版本相符的每日 Excel 讀出每一列與檔案版本', async () => {
    const source = new FakePointsWorkbookSource();
    source.provide('daily-0911', DAILY_0911);

    const workbook = await readParsed(source, 'daily-0911');

    expect(workbook.fileVersion).toBe('2026-09-11#1');
    expect(workbook.rows).toEqual(DAILY_0911.rows);
  });

  it('格式版本不符時整份拒絕，不回傳任何列', async () => {
    const source = new FakePointsWorkbookSource({acceptedFormatVersion: 'v2'});
    source.provide('daily-0911', DAILY_0911);
    source.injectFormatVersionMismatch('old-template', {
      basedOn: 'daily-0911',
      formatVersion: 'v1',
    });

    const result = await source.read({fileId: 'old-template', kind: 'daily'});

    expect(result).toEqual({
      status: 'formatVersionMismatch',
      expectedFormatVersion: 'v2',
      actualFormatVersion: 'v1',
    });
  });

  it('重送內容完全相同的檔案，內容摘要與原檔相同', async () => {
    const source = new FakePointsWorkbookSource();
    source.provide('daily-0911', DAILY_0911);
    source.provide('daily-0911-resent', DAILY_0911);

    const original = await readParsed(source, 'daily-0911');
    const resent = await readParsed(source, 'daily-0911-resent');

    expect(resent.contentDigest).toBe(original.contentDigest);
  });

  it('同版本不同內容：檔案版本與原檔相同，但內容摘要與列不同', async () => {
    const source = new FakePointsWorkbookSource();
    source.provide('daily-0911', DAILY_0911);
    source.injectSameVersionDifferentContent('daily-0911-altered', {
      basedOn: 'daily-0911',
      changedRows: [
        {
          rowNumber: 2,
          venueMemberNo: 'TC-10001',
          activityDate: '2026-09-11',
          points: 12_000,
        },
      ],
    });

    const original = await readParsed(source, 'daily-0911');
    const altered = await readParsed(source, 'daily-0911-altered');

    expect(altered.fileVersion).toBe(original.fileVersion);
    expect(altered.contentDigest).not.toBe(original.contentDigest);
    expect(altered.rows[0]?.points).toBe(12_000);
    expect(altered.rows.slice(1)).toEqual(original.rows.slice(1));
  });

  it('缺列：檔案少了原檔的指定列，其餘列不變', async () => {
    const source = new FakePointsWorkbookSource();
    source.provide('daily-0911', DAILY_0911);
    source.injectMissingRows('daily-0911-partial', {
      basedOn: 'daily-0911',
      missingRowNumbers: [3],
    });

    const partial = await readParsed(source, 'daily-0911-partial');

    expect(partial.rows.map(row => row.rowNumber)).toEqual([2, 4]);
  });

  it('有阻擋錯誤時整份拒絕，並指出錯誤列號', async () => {
    const source = new FakePointsWorkbookSource();
    source.injectBlockingErrors('broken', [
      {rowNumber: 7, message: '積分欄不是數字'},
    ]);

    const result = await source.read({fileId: 'broken', kind: 'opening'});

    expect(result).toEqual({
      status: 'blocked',
      errors: [{rowNumber: 7, message: '積分欄不是數字'}],
    });
  });
});
