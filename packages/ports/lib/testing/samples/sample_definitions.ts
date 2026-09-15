/**
 * @fileoverview The fictional content of every sample file, which
 * `generate_samples.ts` writes to disk. Names and venue member numbers are
 * the prototype's demo literals (CHEN, ALEX / TC-008126 …); hotel and
 * confirmation numbers are invented. Nothing here is real data.
 */

import type {HotelConfirmationFacts} from './hotel_confirmation_pdf';
import type {
  DailyPointsRow,
  DailyPointsWorkbookContent,
  OpeningPointsWorkbookContent,
} from './points_workbook_format';

/** The four daily workbook samples the spec asks for (正常／更正／重複／錯會員). */
export type DailyPointsWorkbookSampleName =
  | 'daily-normal'
  | 'daily-correction'
  | 'daily-duplicate'
  | 'daily-wrong-member';

/** The opening balance workbook samples. */
export type OpeningPointsWorkbookSampleName = 'opening-normal';

/** Every venue points workbook sample. */
export type PointsWorkbookSampleName =
  DailyPointsWorkbookSampleName | OpeningPointsWorkbookSampleName;

/** The hotel confirmation PDF samples. */
export type HotelConfirmationSampleName =
  | 'booking-a-original'
  | 'booking-a-same-number-revised'
  | 'booking-a-voided-no-replacement'
  | 'booking-a-voided-replaced-by-b'
  | 'booking-b-replacement'
  | 'booking-c-continuation';

/** A sample's file name and content. */
export interface SampleDefinition<Content> {
  readonly fileName: string;
  readonly content: Content;
}

const DAILY_0911_BATCH = {
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
};

const DAILY_0911_ROWS: readonly DailyPointsRow[] = [
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

/** The daily workbook samples. */
export const DAILY_SAMPLES: Readonly<
  Record<
    DailyPointsWorkbookSampleName,
    SampleDefinition<DailyPointsWorkbookContent>
  >
> = {
  // 正常: the first file for activity date 2026-09-11.
  'daily-normal': {
    fileName: 'daily_2026-09-11_v1_normal.xlsx',
    content: {batch: DAILY_0911_BATCH, rows: DAILY_0911_ROWS},
  },
  // 更正: the complete new version for the same day; one row's value changed
  // (PRD 6.3.5 完整更正版, R15-17-08).
  'daily-correction': {
    fileName: 'daily_2026-09-11_v2_correction.xlsx',
    content: {
      batch: {...DAILY_0911_BATCH, dataVersion: 2},
      rows: DAILY_0911_ROWS.map(row =>
        row.venueMemberNo === 'TC-008101'
          ? {
              ...row,
              addedPoints: 4_200,
              remainingPoints: 5_400,
              note: '更正：原 3,800，天城重新核算',
            }
          : row,
      ),
    },
  },
  // 重複: the same day, version and content uploaded again as another file
  // (R15-17-06 完全相同重複是無需變更).
  'daily-duplicate': {
    fileName: 'daily_2026-09-11_v1_duplicate.xlsx',
    content: {batch: DAILY_0911_BATCH, rows: DAILY_0911_ROWS},
  },
  // 錯會員: a row whose venue member number belongs to another member than the
  // passport name shows (PRD 6.3.4 姓名輔助不獨自自動配對, R15-17-10 識別更正).
  'daily-wrong-member': {
    fileName: 'daily_2026-09-12_v1_wrong_member.xlsx',
    content: {
      batch: {
        ...DAILY_0911_BATCH,
        activityDate: '2026-09-12',
        producedAt: '2026-09-13 10:00',
        balanceAsOf: '2026-09-13 06:00',
      },
      rows: [
        {
          rowNumber: 2,
          venueMemberNo: 'TC-008127',
          passportName: 'CHEN, ALEX',
          activityDate: '2026-09-12',
          addedPoints: 5_500,
          remainingPoints: 35_500,
          note: '無',
        },
        {
          rowNumber: 3,
          venueMemberNo: 'TC-008101',
          passportName: 'PARK, MINHO',
          activityDate: '2026-09-12',
          addedPoints: 1_200,
          remainingPoints: 6_600,
          note: '無',
        },
      ],
    },
  },
};

/** The opening balance workbook samples. */
export const OPENING_SAMPLES: Readonly<
  Record<
    OpeningPointsWorkbookSampleName,
    SampleDefinition<OpeningPointsWorkbookContent>
  >
> = {
  'opening-normal': {
    fileName: 'opening_2026-08-31_normal.xlsx',
    content: {
      description: {
        venue: 'TC',
        balanceDate: '2026-08-31',
        balanceTime: '23:59',
        balanceTimeZone: 'Asia/Seoul',
        producedAt: '2026-09-01 09:00',
        confirmedBy: '天城業務（範例）',
        scope: '全部合作會員',
        pending: '無',
      },
      rows: [
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
      ],
    },
  },
};

const BOOKING_A = {
  hotelConfirmationNo: 'HT-58213',
  guestName: 'CHEN, ALEX',
  checkInDate: '2026-09-10',
  checkOutDate: '2026-09-15',
  voided: false,
};

/**
 * The hotel confirmation samples, after PRD 5.6.7: A (five nights) is voided
 * and replaced by B (three nights), and C continues B for two more nights.
 */
export const HOTEL_SAMPLES: Readonly<
  Record<HotelConfirmationSampleName, SampleDefinition<HotelConfirmationFacts>>
> = {
  'booking-a-original': {
    fileName: 'ht-58213_a_original.pdf',
    content: BOOKING_A,
  },
  // 同編號不同內容: the same confirmation number with another check-out date.
  'booking-a-same-number-revised': {
    fileName: 'ht-58213_a_same_number_revised.pdf',
    content: {...BOOKING_A, checkOutDate: '2026-09-16'},
  },
  // 作廢無替代單.
  'booking-a-voided-no-replacement': {
    fileName: 'ht-58213_a_voided_no_replacement.pdf',
    content: {...BOOKING_A, voided: true},
  },
  'booking-a-voided-replaced-by-b': {
    fileName: 'ht-58213_a_voided_replaced_by_b.pdf',
    content: {
      ...BOOKING_A,
      voided: true,
      replacementConfirmationNo: 'HT-58990',
    },
  },
  'booking-b-replacement': {
    fileName: 'ht-58990_b_replacement.pdf',
    content: {
      ...BOOKING_A,
      hotelConfirmationNo: 'HT-58990',
      checkOutDate: '2026-09-13',
    },
  },
  'booking-c-continuation': {
    fileName: 'ht-59102_c_continuation.pdf',
    content: {
      ...BOOKING_A,
      hotelConfirmationNo: 'HT-59102',
      checkInDate: '2026-09-13',
      checkOutDate: '2026-09-15',
    },
  },
};
