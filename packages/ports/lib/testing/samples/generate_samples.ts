/**
 * @fileoverview Command-line generator of the committed sample files, run
 * with `pnpm --filter @pokernext/ports samples:generate`. It writes every
 * workbook and PDF from `sample_definitions.ts`, so the samples can be
 * reproduced and changed in review as data. Workbook zip entries carry the
 * time of generation, so regenerated .xlsx bytes differ even when their
 * content does not; the duplicate sample is always a byte copy of the normal
 * one.
 */

import {mkdir, writeFile} from 'node:fs/promises';

import {writeHotelConfirmationPdf} from './hotel_confirmation_pdf';
import {
  writeDailyWorkbook,
  writeOpeningWorkbook,
} from './points_workbook_format';
import {
  DAILY_SAMPLES,
  HOTEL_SAMPLES,
  OPENING_SAMPLES,
} from './sample_definitions';
import {
  HOTEL_CONFIRMATION_SAMPLE_DIR,
  POINTS_WORKBOOK_SAMPLE_DIR,
} from './sample_files';

/** Writes every sample file and lists what it wrote. */
async function generateSamples(): Promise<void> {
  await mkdir(POINTS_WORKBOOK_SAMPLE_DIR, {recursive: true});
  await mkdir(HOTEL_CONFIRMATION_SAMPLE_DIR, {recursive: true});
  const normal = await writeDailyWorkbook(
    DAILY_SAMPLES['daily-normal'].content,
  );
  for (const [name, {fileName, content}] of Object.entries(DAILY_SAMPLES)) {
    const bytes =
      name === 'daily-duplicate' ? normal : await writeDailyWorkbook(content);
    await write(POINTS_WORKBOOK_SAMPLE_DIR, fileName, bytes);
  }
  for (const {fileName, content} of Object.values(OPENING_SAMPLES)) {
    await write(
      POINTS_WORKBOOK_SAMPLE_DIR,
      fileName,
      await writeOpeningWorkbook(content),
    );
  }
  for (const {fileName, content} of Object.values(HOTEL_SAMPLES)) {
    await write(
      HOTEL_CONFIRMATION_SAMPLE_DIR,
      fileName,
      writeHotelConfirmationPdf(content),
    );
  }
}

async function write(
  directory: URL,
  fileName: string,
  bytes: Uint8Array,
): Promise<void> {
  const target = new URL(fileName, directory);
  await writeFile(target, bytes);
  console.log(`wrote ${fileName}`);
}

generateSamples().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
