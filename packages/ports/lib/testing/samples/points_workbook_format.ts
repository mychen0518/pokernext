/**
 * @fileoverview The venue points workbook layouts the samples use, written and
 * read in one place. Sheet names and fields follow PRD 6.3.3 and R15-17-04
 * (daily: 批次資訊 + 每日明細) and PRD 6.3.2 and R15-17-02 (opening:
 * 資料說明 + 會員期初積分). The PRD fixes the fields but not the cell layout,
 * header wording or date and time-zone notation (G06／G12／G17), so this
 * layout is the samples' own: key–value rows for the batch sheet, one header
 * row plus data rows for the detail sheet, dates as `YYYY-MM-DD` text.
 */

import ExcelJS from 'exceljs';

/** A fixed instant for workbook metadata, so content does not depend on runs. */
const WORKBOOK_TIMESTAMP = new Date('2026-09-01T00:00:00Z');

/** 批次資訊 of a daily workbook. */
export interface DailyBatchInfo {
  readonly formatVersion: string;
  readonly venueCode: string;
  /** Venue-local activity date, `YYYY-MM-DD`. */
  readonly activityDate: string;
  /** Increases with every new file for the same activity date. */
  readonly dataVersion: number;
  readonly producedAt: string;
  readonly producedTimeZone: string;
  /** When the remaining points were measured. */
  readonly balanceAsOf: string;
  readonly balanceTimeZone: string;
  readonly provider: string;
  /** 範圍／待補. */
  readonly scope: string;
}

/** One 每日明細 row. */
export interface DailyPointsRow {
  /** The row number as shown in Excel. */
  readonly rowNumber: number;
  /** 天城會員編號, text with leading zeros kept. */
  readonly venueMemberNo: string;
  readonly passportName: string;
  readonly activityDate: string;
  /** 當日新增積分: the complete value for the day. */
  readonly addedPoints: number;
  /** 剩餘積分, for reconciliation only; omitted when the venue left it blank. */
  readonly remainingPoints?: number;
  /** 更正／待補註記; `無` when there is nothing to note. */
  readonly note: string;
}

/** The content of a daily workbook. */
export interface DailyPointsWorkbookContent {
  readonly batch: DailyBatchInfo;
  readonly rows: readonly DailyPointsRow[];
}

/** 資料說明 of an opening balance workbook. */
export interface OpeningDescription {
  /** 合作場館. */
  readonly venue: string;
  readonly balanceDate: string;
  readonly balanceTime: string;
  readonly balanceTimeZone: string;
  readonly producedAt: string;
  /** 提供／確認人. */
  readonly confirmedBy: string;
  readonly scope: string;
  readonly pending: string;
}

/** One 會員期初積分 row. */
export interface OpeningBalanceRow {
  readonly rowNumber: number;
  readonly venueMemberNo: string;
  readonly passportName: string;
  readonly remainingPoints: number;
  /** 歷史累積總積分: reference only. */
  readonly historicalTotalPoints: number;
  /** 已兌換住宿晚數: reference only. */
  readonly redeemedNights: number;
  /** 個別異常／待補. */
  readonly note: string;
}

/** The content of an opening balance workbook. */
export interface OpeningPointsWorkbookContent {
  readonly description: OpeningDescription;
  readonly rows: readonly OpeningBalanceRow[];
}

const DAILY_BATCH_SHEET = '批次資訊';
const DAILY_ROWS_SHEET = '每日明細';
const OPENING_DESCRIPTION_SHEET = '資料說明';
const OPENING_ROWS_SHEET = '會員期初積分';
const KEY_VALUE_HEADER = ['欄位', '值'];

const DAILY_BATCH_LABELS: Readonly<Record<keyof DailyBatchInfo, string>> = {
  formatVersion: '格式版本',
  venueCode: '場館代碼',
  activityDate: '活動日期',
  dataVersion: '資料版本',
  producedAt: '產出時間',
  producedTimeZone: '產出時間時區',
  balanceAsOf: '剩餘積分基準時間',
  balanceTimeZone: '剩餘積分基準時區',
  provider: '提供人',
  scope: '範圍／待補',
};

const DAILY_ROW_HEADERS = [
  '天城會員編號',
  '護照英文姓名',
  '活動日期',
  '當日新增積分',
  '剩餘積分',
  '更正／待補註記',
];

const OPENING_DESCRIPTION_LABELS: Readonly<
  Record<keyof OpeningDescription, string>
> = {
  venue: '合作場館',
  balanceDate: '餘額基準日期',
  balanceTime: '基準時間',
  balanceTimeZone: '基準時區',
  producedAt: '產出時間',
  confirmedBy: '提供／確認人',
  scope: '範圍',
  pending: '待補',
};

const OPENING_ROW_HEADERS = [
  '天城會員編號',
  '護照英文姓名',
  '剩餘積分',
  '歷史累積總積分',
  '已兌換住宿晚數',
  '個別異常／待補',
];

/** Writes a daily workbook as .xlsx bytes. */
export async function writeDailyWorkbook(
  content: DailyPointsWorkbookContent,
): Promise<Uint8Array> {
  const workbook = newWorkbook();
  addKeyValueSheet(
    workbook,
    DAILY_BATCH_SHEET,
    DAILY_BATCH_LABELS,
    content.batch,
  );
  addTableSheet(
    workbook,
    DAILY_ROWS_SHEET,
    DAILY_ROW_HEADERS,
    content.rows.map(row => [
      row.venueMemberNo,
      row.passportName,
      row.activityDate,
      row.addedPoints,
      row.remainingPoints ?? null,
      row.note,
    ]),
  );
  return toBytes(workbook);
}

/** Writes an opening balance workbook as .xlsx bytes. */
export async function writeOpeningWorkbook(
  content: OpeningPointsWorkbookContent,
): Promise<Uint8Array> {
  const workbook = newWorkbook();
  addKeyValueSheet(
    workbook,
    OPENING_DESCRIPTION_SHEET,
    OPENING_DESCRIPTION_LABELS,
    content.description,
  );
  addTableSheet(
    workbook,
    OPENING_ROWS_SHEET,
    OPENING_ROW_HEADERS,
    content.rows.map(row => [
      row.venueMemberNo,
      row.passportName,
      row.remainingPoints,
      row.historicalTotalPoints,
      row.redeemedNights,
      row.note,
    ]),
  );
  return toBytes(workbook);
}

/** Reads a daily workbook written in the samples' layout. */
export async function readDailyWorkbook(
  bytes: Uint8Array,
): Promise<DailyPointsWorkbookContent> {
  const workbook = await loadWorkbook(bytes);
  const batch = readKeyValueSheet(workbook, DAILY_BATCH_SHEET);
  const label = (key: keyof DailyBatchInfo) => DAILY_BATCH_LABELS[key];
  return {
    batch: {
      formatVersion: textOf(batch, label('formatVersion')),
      venueCode: textOf(batch, label('venueCode')),
      activityDate: textOf(batch, label('activityDate')),
      dataVersion: integerOf(batch, label('dataVersion')),
      producedAt: textOf(batch, label('producedAt')),
      producedTimeZone: textOf(batch, label('producedTimeZone')),
      balanceAsOf: textOf(batch, label('balanceAsOf')),
      balanceTimeZone: textOf(batch, label('balanceTimeZone')),
      provider: textOf(batch, label('provider')),
      scope: textOf(batch, label('scope')),
    },
    rows: readTableSheet(workbook, DAILY_ROWS_SHEET, DAILY_ROW_HEADERS).map(
      ({rowNumber, cells}) => {
        const remaining = cells[4];
        return {
          rowNumber,
          venueMemberNo: requiredText(cells[0], rowNumber),
          passportName: requiredText(cells[1], rowNumber),
          activityDate: requiredText(cells[2], rowNumber),
          addedPoints: requiredInteger(cells[3], rowNumber),
          ...(remaining === null || remaining === undefined
            ? {}
            : {remainingPoints: requiredInteger(remaining, rowNumber)}),
          note: requiredText(cells[5], rowNumber),
        };
      },
    ),
  };
}

/** Reads an opening balance workbook written in the samples' layout. */
export async function readOpeningWorkbook(
  bytes: Uint8Array,
): Promise<OpeningPointsWorkbookContent> {
  const workbook = await loadWorkbook(bytes);
  const description = readKeyValueSheet(workbook, OPENING_DESCRIPTION_SHEET);
  const label = (key: keyof OpeningDescription) =>
    OPENING_DESCRIPTION_LABELS[key];
  return {
    description: {
      venue: textOf(description, label('venue')),
      balanceDate: textOf(description, label('balanceDate')),
      balanceTime: textOf(description, label('balanceTime')),
      balanceTimeZone: textOf(description, label('balanceTimeZone')),
      producedAt: textOf(description, label('producedAt')),
      confirmedBy: textOf(description, label('confirmedBy')),
      scope: textOf(description, label('scope')),
      pending: textOf(description, label('pending')),
    },
    rows: readTableSheet(workbook, OPENING_ROWS_SHEET, OPENING_ROW_HEADERS).map(
      ({rowNumber, cells}) => ({
        rowNumber,
        venueMemberNo: requiredText(cells[0], rowNumber),
        passportName: requiredText(cells[1], rowNumber),
        remainingPoints: requiredInteger(cells[2], rowNumber),
        historicalTotalPoints: requiredInteger(cells[3], rowNumber),
        redeemedNights: requiredInteger(cells[4], rowNumber),
        note: requiredText(cells[5], rowNumber),
      }),
    ),
  };
}

/** A cell value as the samples use them: text, a number, or blank. */
type CellValue = string | number | null | undefined;

function newWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'POKERNEXT sample generator (fictional data)';
  workbook.created = WORKBOOK_TIMESTAMP;
  workbook.modified = WORKBOOK_TIMESTAMP;
  return workbook;
}

function addKeyValueSheet<T extends object>(
  workbook: ExcelJS.Workbook,
  name: string,
  labels: Readonly<Record<keyof T, string>>,
  values: T,
): void {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow(KEY_VALUE_HEADER);
  for (const key of Object.keys(labels)) {
    // Safe: the keys come from the labels record typed by T's own keys.
    const field = key as keyof T;
    sheet.addRow([labels[field], values[field]]);
  }
}

function addTableSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  headers: readonly string[],
  rows: ReadonlyArray<readonly CellValue[]>,
): void {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow([...headers]);
  for (const row of rows) {
    sheet.addRow([...row]);
  }
}

async function toBytes(workbook: ExcelJS.Workbook): Promise<Uint8Array> {
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

async function loadWorkbook(bytes: Uint8Array): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  // exceljs declares its own `Buffer` as an ArrayBuffer; hand it one.
  await workbook.xlsx.load(new Uint8Array(bytes).buffer);
  return workbook;
}

function sheetOf(workbook: ExcelJS.Workbook, name: string): ExcelJS.Worksheet {
  const sheet = workbook.getWorksheet(name);
  if (sheet === undefined) {
    throw new Error(`The workbook has no sheet named ${name}.`);
  }
  return sheet;
}

function readKeyValueSheet(
  workbook: ExcelJS.Workbook,
  name: string,
): Map<string, CellValue> {
  const values = new Map<string, CellValue>();
  sheetOf(workbook, name).eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      values.set(String(cellValue(row.getCell(1))), cellValue(row.getCell(2)));
    }
  });
  return values;
}

function readTableSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  headers: readonly string[],
): Array<{rowNumber: number; cells: CellValue[]}> {
  const rows: Array<{rowNumber: number; cells: CellValue[]}> = [];
  sheetOf(workbook, name).eachRow((row, rowNumber) => {
    const cells = headers.map((_, index) => cellValue(row.getCell(index + 1)));
    if (rowNumber === 1) {
      if (cells.join('|') !== headers.join('|')) {
        throw new Error(`Sheet ${name} does not have the expected headers.`);
      }
      return;
    }
    rows.push({rowNumber, cells});
  });
  return rows;
}

/** Reads a cell as text or a number; formulas and rich values are refused. */
function cellValue(cell: ExcelJS.Cell): CellValue {
  const value = cell.value;
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return value;
  }
  throw new Error(
    `Cell ${cell.address} holds a ${typeof value} value; samples use plain text and numbers only.`,
  );
}

function textOf(values: Map<string, CellValue>, label: string): string {
  const value = values.get(label);
  if (typeof value !== 'string') {
    throw new Error(`${label} must be text.`);
  }
  return value;
}

function integerOf(values: Map<string, CellValue>, label: string): number {
  const value = values.get(label);
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${label} must be a whole number.`);
  }
  return value;
}

function requiredText(value: CellValue, rowNumber: number): string {
  if (typeof value !== 'string' || value === '') {
    throw new Error(`Row ${rowNumber} has a blank text field.`);
  }
  return value;
}

function requiredInteger(value: CellValue, rowNumber: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(
      `Row ${rowNumber} has a points field that is not a whole number.`,
    );
  }
  return value;
}
