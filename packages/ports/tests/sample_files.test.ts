/**
 * @fileoverview 去識別化樣本檔：天城每日積分 Excel 的正常、更正、重複、錯會員四種與
 * 期初 Excel（PRD 6.3.2、6.3.3、15.17），以及酒店確認 PDF（PRD 5.6.1、5.6.7 的
 * A／B／C 三張單、同編號不同內容、作廢無替代單）。檔案是真的 .xlsx 與 .pdf，替身
 * 能直接供應它們。姓名與編號沿用原型的虛構示範資料。
 */

import {describe, expect, it} from 'vitest';

import {
  FakeHotelConfirmationSource,
  FakePointsWorkbookSource,
  loadHotelConfirmationSample,
  loadPointsWorkbookSample,
} from '../testing';

/** The rows of the normal daily sample, written out from the PRD fields. */
const NORMAL_ROWS = [
  {
    rowNumber: 2,
    venueMemberNo: 'TC-008126',
    passportName: 'CHEN, ALEX',
    activityDate: '2026-09-11',
    addedPoints: 10_000,
    remainingPoints: 30_000,
    note: '無',
  },
  {
    rowNumber: 3,
    venueMemberNo: 'TC-008127',
    passportName: 'LIN, MAY',
    activityDate: '2026-09-11',
    addedPoints: 6_200,
    remainingPoints: 52_000,
    note: '無',
  },
  {
    rowNumber: 4,
    venueMemberNo: 'TC-008101',
    passportName: 'PARK, MINHO',
    activityDate: '2026-09-11',
    addedPoints: 3_800,
    remainingPoints: 5_000,
    note: '無',
  },
];

describe('天城每日積分 Excel 樣本', () => {
  it('正常樣本是真的 .xlsx，批次資訊有格式版本、場館代碼、活動日期、資料版本、產出與餘額基準時間及時區、提供人、範圍', async () => {
    const sample = await loadPointsWorkbookSample('daily-normal');

    expect(Buffer.from(sample.bytes.subarray(0, 2)).toString()).toBe('PK');
    expect(sample.kind).toBe('daily');
    expect(sample.batch).toEqual({
      formatVersion: 'v1',
      venueCode: 'TC',
      activityDate: '2026-09-11',
      dataVersion: 1,
      producedAt: '2026-09-12 10:00',
      producedTimeZone: 'Asia/Seoul',
      balanceAsOf: '2026-09-12 06:00',
      balanceTimeZone: 'Asia/Seoul',
      provider: '天城業務（範例）',
      scope: '無',
    });
  });

  it('正常樣本的每日明細六欄齊全，天城會員編號以文字保存', async () => {
    const sample = await loadPointsWorkbookSample('daily-normal');

    expect(sample.rows).toEqual(NORMAL_ROWS);
  });

  it('更正樣本是同一活動日的完整新版：資料版本遞增，只有更正的列換成完整新值並附更正註記', async () => {
    const sample = await loadPointsWorkbookSample('daily-correction');

    expect(sample.batch).toMatchObject({
      activityDate: '2026-09-11',
      dataVersion: 2,
    });
    expect(sample.rows).toEqual([
      NORMAL_ROWS[0],
      NORMAL_ROWS[1],
      {
        ...NORMAL_ROWS[2],
        addedPoints: 4_200,
        remainingPoints: 5_400,
        note: '更正：原 3,800，天城重新核算',
      },
    ]);
  });

  it('重複樣本與正常樣本是同活動日同版本、內容完全相同的另一份檔案', async () => {
    const normal = await loadPointsWorkbookSample('daily-normal');
    const duplicate = await loadPointsWorkbookSample('daily-duplicate');

    expect(duplicate.fileName).not.toBe(normal.fileName);
    expect(duplicate.batch).toEqual(normal.batch);
    expect(duplicate.rows).toEqual(normal.rows);
  });

  it('錯會員樣本有一列的天城會員編號屬於另一位會員，與護照英文姓名對不上', async () => {
    const sample = await loadPointsWorkbookSample('daily-wrong-member');

    expect(sample.batch).toMatchObject({
      activityDate: '2026-09-12',
      dataVersion: 1,
    });
    expect(sample.rows).toContainEqual({
      rowNumber: 2,
      venueMemberNo: 'TC-008127',
      passportName: 'CHEN, ALEX',
      activityDate: '2026-09-12',
      addedPoints: 5_500,
      remainingPoints: 35_500,
      note: '無',
    });
  });

  it('替身直接供應樣本檔：重複樣本的內容摘要與正常樣本相同，更正樣本不同', async () => {
    const source = new FakePointsWorkbookSource();
    await source.provideSample('upload-1', 'daily-normal');
    await source.provideSample('upload-2', 'daily-duplicate');
    await source.provideSample('upload-3', 'daily-correction');

    const [normal, duplicate, correction] = await Promise.all(
      ['upload-1', 'upload-2', 'upload-3'].map(fileId =>
        source.read({fileId, kind: 'daily'}),
      ),
    );

    if (
      normal?.status !== 'read' ||
      duplicate?.status !== 'read' ||
      correction?.status !== 'read'
    ) {
      throw new Error('every sample should read');
    }
    expect(normal.workbook.fileVersion).toBe('1');
    expect(normal.workbook.rows[2]).toEqual({
      rowNumber: 4,
      venueMemberNo: 'TC-008101',
      activityDate: '2026-09-11',
      points: 3_800,
    });
    expect(duplicate.workbook.contentDigest).toBe(
      normal.workbook.contentDigest,
    );
    expect(correction.workbook.contentDigest).not.toBe(
      normal.workbook.contentDigest,
    );
  });
});

describe('天城期初積分 Excel 樣本', () => {
  it('期初樣本有資料說明與會員期初積分兩表，剩餘、歷史累積與已兌換晚數分開', async () => {
    const sample = await loadPointsWorkbookSample('opening-normal');

    expect(sample.kind).toBe('opening');
    expect(sample.description).toEqual({
      venue: 'TC',
      balanceDate: '2026-08-31',
      balanceTime: '23:59',
      balanceTimeZone: 'Asia/Seoul',
      producedAt: '2026-09-01 09:00',
      confirmedBy: '天城業務（範例）',
      scope: '全部合作會員',
      pending: '無',
    });
    expect(sample.rows).toEqual([
      {
        rowNumber: 2,
        venueMemberNo: 'TC-008126',
        passportName: 'CHEN, ALEX',
        remainingPoints: 20_000,
        historicalTotalPoints: 70_000,
        redeemedNights: 2,
        note: '無',
      },
      {
        rowNumber: 3,
        venueMemberNo: 'TC-008119',
        passportName: 'KIM, JISOO',
        remainingPoints: 41_000,
        historicalTotalPoints: 41_000,
        redeemedNights: 0,
        note: '無',
      },
    ]);
  });
});

describe('酒店確認 PDF 樣本', () => {
  it('A 單是真的 PDF，讀出酒店預訂編號、住客、入住與退房日期、未作廢', async () => {
    const sample = await loadHotelConfirmationSample('booking-a-original');

    expect(Buffer.from(sample.bytes.subarray(0, 5)).toString()).toBe('%PDF-');
    expect(sample.confirmation).toEqual({
      hotelConfirmationNo: 'HT-58213',
      guestName: 'CHEN, ALEX',
      checkInDate: '2026-09-10',
      checkOutDate: '2026-09-15',
      voided: false,
    });
  });

  it('同編號不同內容：同一個酒店預訂編號，退房日期不同', async () => {
    const original = await loadHotelConfirmationSample('booking-a-original');
    const revised = await loadHotelConfirmationSample(
      'booking-a-same-number-revised',
    );

    expect(revised.confirmation.hotelConfirmationNo).toBe('HT-58213');
    expect(revised.confirmation.checkOutDate).toBe('2026-09-16');
    expect(revised.bytes).not.toEqual(original.bytes);
  });

  it('作廢無替代單：A 單標示作廢且沒有替代編號', async () => {
    const sample = await loadHotelConfirmationSample(
      'booking-a-voided-no-replacement',
    );

    expect(sample.confirmation).toMatchObject({
      hotelConfirmationNo: 'HT-58213',
      voided: true,
    });
    expect(sample.confirmation.replacementConfirmationNo).toBeUndefined();
  });

  it('A 被 B 替代、C 接續 B：B 三晚加 C 兩晚是 9/10 到 9/15 的五晚', async () => {
    const voided = await loadHotelConfirmationSample(
      'booking-a-voided-replaced-by-b',
    );
    const replacement = await loadHotelConfirmationSample(
      'booking-b-replacement',
    );
    const continuation = await loadHotelConfirmationSample(
      'booking-c-continuation',
    );

    expect(voided.confirmation).toMatchObject({
      voided: true,
      replacementConfirmationNo: replacement.confirmation.hotelConfirmationNo,
    });
    expect(replacement.confirmation).toMatchObject({
      hotelConfirmationNo: 'HT-58990',
      checkInDate: '2026-09-10',
      checkOutDate: '2026-09-13',
    });
    expect(continuation.confirmation).toMatchObject({
      hotelConfirmationNo: 'HT-59102',
      checkInDate: '2026-09-13',
      checkOutDate: '2026-09-15',
    });
  });

  it('替身直接供應 PDF 樣本；沒有供應的檔案讀成缺件', async () => {
    const source = new FakeHotelConfirmationSource();
    await source.provideSample('pdf-a', 'booking-a-original');

    const read = await source.read('pdf-a');
    const missing = await source.read('pdf-never-uploaded');

    expect(read).toMatchObject({
      status: 'read',
      confirmation: {hotelConfirmationNo: 'HT-58213', voided: false},
    });
    expect(missing).toEqual({status: 'missing'});
  });
});
