/**
 * @fileoverview Loads the committed sample files: venue points workbooks
 * (.xlsx) and hotel confirmation PDFs. The files live next to this module and
 * are regenerated from `sample_definitions.ts` with
 * `pnpm --filter @pokernext/ports samples:generate`.
 */

import {readFile} from 'node:fs/promises';

import {
  type HotelConfirmationFacts,
  readHotelConfirmationPdf,
} from './hotel_confirmation_pdf';
import {
  type DailyPointsWorkbookContent,
  type OpeningPointsWorkbookContent,
  readDailyWorkbook,
  readOpeningWorkbook,
} from './points_workbook_format';
import {
  DAILY_SAMPLES,
  type DailyPointsWorkbookSampleName,
  HOTEL_SAMPLES,
  type HotelConfirmationSampleName,
  OPENING_SAMPLES,
  type OpeningPointsWorkbookSampleName,
  type PointsWorkbookSampleName,
} from './sample_definitions';

/** Where the workbook samples are committed. */
export const POINTS_WORKBOOK_SAMPLE_DIR = new URL(
  './points_workbooks/',
  import.meta.url,
);
/** Where the hotel confirmation samples are committed. */
export const HOTEL_CONFIRMATION_SAMPLE_DIR = new URL(
  './hotel_confirmations/',
  import.meta.url,
);

/** The bytes of a sample file and where it came from. */
interface SampleFile {
  readonly name: string;
  readonly fileName: string;
  readonly bytes: Uint8Array;
}

/** A daily points workbook sample, read from its .xlsx file. */
export interface DailyPointsWorkbookSample
  extends SampleFile, DailyPointsWorkbookContent {
  readonly kind: 'daily';
}

/** An opening balance workbook sample, read from its .xlsx file. */
export interface OpeningPointsWorkbookSample
  extends SampleFile, OpeningPointsWorkbookContent {
  readonly kind: 'opening';
}

/** A hotel confirmation sample, read from its PDF. */
export interface HotelConfirmationSample extends SampleFile {
  readonly confirmation: HotelConfirmationFacts;
}

/** Loads a daily points workbook sample. */
export function loadPointsWorkbookSample(
  name: DailyPointsWorkbookSampleName,
): Promise<DailyPointsWorkbookSample>;
/** Loads an opening balance workbook sample. */
export function loadPointsWorkbookSample(
  name: OpeningPointsWorkbookSampleName,
): Promise<OpeningPointsWorkbookSample>;
/** Loads a venue points workbook sample of either kind. */
export function loadPointsWorkbookSample(
  name: PointsWorkbookSampleName,
): Promise<DailyPointsWorkbookSample | OpeningPointsWorkbookSample>;
export async function loadPointsWorkbookSample(
  name: PointsWorkbookSampleName,
): Promise<DailyPointsWorkbookSample | OpeningPointsWorkbookSample> {
  if (name === 'opening-normal') {
    const {fileName} = OPENING_SAMPLES[name];
    const bytes = await readSample(POINTS_WORKBOOK_SAMPLE_DIR, fileName);
    return {
      kind: 'opening',
      name,
      fileName,
      bytes,
      ...(await readOpeningWorkbook(bytes)),
    };
  }
  const {fileName} = DAILY_SAMPLES[name];
  const bytes = await readSample(POINTS_WORKBOOK_SAMPLE_DIR, fileName);
  return {
    kind: 'daily',
    name,
    fileName,
    bytes,
    ...(await readDailyWorkbook(bytes)),
  };
}

/** Loads a hotel confirmation PDF sample. */
export async function loadHotelConfirmationSample(
  name: HotelConfirmationSampleName,
): Promise<HotelConfirmationSample> {
  const {fileName} = HOTEL_SAMPLES[name];
  const bytes = await readSample(HOTEL_CONFIRMATION_SAMPLE_DIR, fileName);
  return {name, fileName, bytes, confirmation: readHotelConfirmationPdf(bytes)};
}

async function readSample(
  directory: URL,
  fileName: string,
): Promise<Uint8Array> {
  return new Uint8Array(await readFile(new URL(fileName, directory)));
}
