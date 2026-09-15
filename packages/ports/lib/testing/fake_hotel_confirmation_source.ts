/**
 * @fileoverview Programmable stand-in for uploaded hotel confirmation PDFs.
 */

import {createHash} from 'node:crypto';

import type {
  HotelConfirmation,
  HotelConfirmationMissing,
  HotelConfirmationRead,
  HotelConfirmationSource,
} from '../../index';
import type {HotelConfirmationSampleName} from './samples/sample_definitions';
import {loadHotelConfirmationSample} from './samples/sample_files';

/** What a test supplies for one sample confirmation PDF. */
export interface HotelConfirmationContent {
  hotelConfirmationNo: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  /** Defaults to false. */
  voided?: boolean;
  replacementConfirmationNo?: string;
}

/**
 * Implements {@link HotelConfirmationSource} for tests. Each file id is a
 * sample PDF; a file id never provided reads as missing (缺件).
 */
export class FakeHotelConfirmationSource implements HotelConfirmationSource {
  private readonly files = new Map<string, HotelConfirmation>();

  /** Stores one of the committed PDF sample files under a file id. */
  async provideSample(
    fileId: string,
    name: HotelConfirmationSampleName,
  ): Promise<void> {
    const {confirmation} = await loadHotelConfirmationSample(name);
    this.provide(fileId, confirmation);
  }

  /** Stores a sample confirmation PDF under a file id. */
  provide(fileId: string, content: HotelConfirmationContent): void {
    this.files.set(fileId, sealConfirmation(content));
  }

  /** Stores a PDF with the base's confirmation number but other content. */
  injectSameNumberDifferentContent(
    fileId: string,
    options: {
      basedOn: string;
      changes: Partial<Omit<HotelConfirmationContent, 'hotelConfirmationNo'>>;
    },
  ): void {
    const base = this.confirmation(options.basedOn);
    this.provide(fileId, {...contentOf(base), ...options.changes});
  }

  /** Stores a voided copy of the base that names no replacement. */
  injectVoidedWithoutReplacement(
    fileId: string,
    options: {basedOn: string},
  ): void {
    const base = contentOf(this.confirmation(options.basedOn));
    delete base.replacementConfirmationNo;
    this.provide(fileId, {...base, voided: true});
  }

  /** Makes a file id read as missing. */
  injectMissing(fileId: string): void {
    this.files.delete(fileId);
  }

  /** Reads the sample PDF stored under the file id, or reports it missing. */
  async read(
    fileId: string,
  ): Promise<HotelConfirmationRead | HotelConfirmationMissing> {
    const confirmation = this.files.get(fileId);
    if (confirmation === undefined) {
      return {status: 'missing'};
    }
    return {status: 'read', confirmation};
  }

  private confirmation(fileId: string): HotelConfirmation {
    const confirmation = this.files.get(fileId);
    if (confirmation === undefined) {
      throw new Error(
        `No sample confirmation was provided for file ${fileId}; call provide() first.`,
      );
    }
    return confirmation;
  }
}

/** Strips the derived digest so a confirmation can be re-sealed. */
function contentOf(confirmation: HotelConfirmation): HotelConfirmationContent {
  const {contentDigest, ...content} = confirmation;
  void contentDigest;
  return content;
}

/** Computes the content digest a real reader would derive from the PDF. */
function sealConfirmation(
  content: HotelConfirmationContent,
): HotelConfirmation {
  const facts = {...content, voided: content.voided ?? false};
  const contentDigest = createHash('sha256')
    .update(JSON.stringify(facts))
    .digest('hex');
  return {...facts, contentDigest};
}
