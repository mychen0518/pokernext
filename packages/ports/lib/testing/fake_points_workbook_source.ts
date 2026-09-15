/**
 * @fileoverview Programmable stand-in for uploaded venue points workbooks.
 */

import {createHash} from 'node:crypto';

import type {
  PointsWorkbook,
  PointsWorkbookBlocked,
  PointsWorkbookBlockingError,
  PointsWorkbookFormatMismatch,
  PointsWorkbookRead,
  PointsWorkbookRow,
  PointsWorkbookSource,
  PointsWorkbookUpload,
} from '../../index';
import type {PointsWorkbookSampleName} from './samples/sample_definitions';
import {loadPointsWorkbookSample} from './samples/sample_files';

/** The format version the fake accepts unless told otherwise. */
const DEFAULT_FORMAT_VERSION = 'v1';

/** What a test supplies for one sample workbook file. */
export interface PointsWorkbookContent {
  /** Defaults to the format version the source accepts. */
  formatVersion?: string;
  fileVersion: string;
  rows: readonly PointsWorkbookRow[];
}

/** Derives a new sample file from one already provided. */
interface DerivedFrom {
  /** The file id of the provided workbook to start from. */
  basedOn: string;
}

type StoredFile =
  | {kind: 'workbook'; workbook: PointsWorkbook}
  | {kind: 'blocked'; errors: readonly PointsWorkbookBlockingError[]};

/**
 * Implements {@link PointsWorkbookSource} for tests. Each file id is a sample
 * file; failures are variants derived from a provided file.
 */
export class FakePointsWorkbookSource implements PointsWorkbookSource {
  private readonly files = new Map<string, StoredFile>();
  private readonly acceptedFormatVersion: string;

  constructor(options: {acceptedFormatVersion?: string} = {}) {
    this.acceptedFormatVersion =
      options.acceptedFormatVersion ?? DEFAULT_FORMAT_VERSION;
  }

  /**
   * Stores one of the committed .xlsx sample files under a file id, read from
   * disk. A daily sample's data version becomes the file version; an opening
   * sample, whose PRD format (R15-17-02) has no format version, is stored
   * under the accepted one with its balance date as the file version.
   */
  async provideSample(
    fileId: string,
    name: PointsWorkbookSampleName,
  ): Promise<void> {
    const sample = await loadPointsWorkbookSample(name);
    if (sample.kind === 'daily') {
      this.provide(fileId, {
        formatVersion: sample.batch.formatVersion,
        fileVersion: String(sample.batch.dataVersion),
        rows: sample.rows.map(row => ({
          rowNumber: row.rowNumber,
          venueMemberNo: row.venueMemberNo,
          activityDate: row.activityDate,
          points: row.addedPoints,
        })),
      });
      return;
    }
    const {balanceDate} = sample.description;
    this.provide(fileId, {
      fileVersion: balanceDate,
      rows: sample.rows.map(row => ({
        rowNumber: row.rowNumber,
        venueMemberNo: row.venueMemberNo,
        activityDate: balanceDate,
        points: row.remainingPoints,
      })),
    });
  }

  /** Stores a well-formed sample workbook under a file id. */
  provide(fileId: string, content: PointsWorkbookContent): void {
    this.files.set(fileId, {
      kind: 'workbook',
      workbook: sealWorkbook({
        formatVersion: content.formatVersion ?? this.acceptedFormatVersion,
        fileVersion: content.fileVersion,
        rows: content.rows,
      }),
    });
  }

  /** Stores a copy of a workbook exported with another format version. */
  injectFormatVersionMismatch(
    fileId: string,
    options: DerivedFrom & {formatVersion: string},
  ): void {
    const base = this.workbook(options.basedOn);
    this.provide(fileId, {...base, formatVersion: options.formatVersion});
  }

  /** Stores a file that keeps the base's version label but changes rows. */
  injectSameVersionDifferentContent(
    fileId: string,
    options: DerivedFrom & {changedRows: readonly PointsWorkbookRow[]},
  ): void {
    const base = this.workbook(options.basedOn);
    const changes = new Map(
      options.changedRows.map(row => [row.rowNumber, row]),
    );
    this.provide(fileId, {
      ...base,
      rows: base.rows.map(row => changes.get(row.rowNumber) ?? row),
    });
  }

  /** Stores a file that lacks some of the base's rows. */
  injectMissingRows(
    fileId: string,
    options: DerivedFrom & {missingRowNumbers: readonly number[]},
  ): void {
    const base = this.workbook(options.basedOn);
    const missing = new Set(options.missingRowNumbers);
    this.provide(fileId, {
      ...base,
      rows: base.rows.filter(row => !missing.has(row.rowNumber)),
    });
  }

  /** Stores a file whose blocking errors reject it as a whole. */
  injectBlockingErrors(
    fileId: string,
    errors: readonly PointsWorkbookBlockingError[],
  ): void {
    this.files.set(fileId, {kind: 'blocked', errors});
  }

  /** Reads the sample file, rejecting blocked or mismatched formats. */
  async read(
    upload: PointsWorkbookUpload,
  ): Promise<
    PointsWorkbookRead | PointsWorkbookFormatMismatch | PointsWorkbookBlocked
  > {
    const file = this.stored(upload.fileId);
    if (file.kind === 'blocked') {
      return {status: 'blocked', errors: file.errors};
    }
    if (file.workbook.formatVersion !== this.acceptedFormatVersion) {
      return {
        status: 'formatVersionMismatch',
        expectedFormatVersion: this.acceptedFormatVersion,
        actualFormatVersion: file.workbook.formatVersion,
      };
    }
    return {status: 'read', workbook: file.workbook};
  }

  private workbook(fileId: string): PointsWorkbook {
    const file = this.stored(fileId);
    if (file.kind !== 'workbook') {
      throw new Error(`Sample file ${fileId} has no workbook to derive from.`);
    }
    return file.workbook;
  }

  private stored(fileId: string): StoredFile {
    const file = this.files.get(fileId);
    if (file === undefined) {
      throw new Error(
        `No sample workbook was provided for file ${fileId}; call provide() first.`,
      );
    }
    return file;
  }
}

/** Computes the content digest a real reader would derive from the bytes. */
function sealWorkbook(
  workbook: Omit<PointsWorkbook, 'contentDigest'>,
): PointsWorkbook {
  const contentDigest = createHash('sha256')
    .update(JSON.stringify(workbook))
    .digest('hex');
  return {...workbook, rows: [...workbook.rows], contentDigest};
}
