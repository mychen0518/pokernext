/**
 * @fileoverview Hotel confirmation sample PDFs: a one-page PDF with one
 * labelled fact per line, written and read in one place. PRD 5.6 says no
 * original PDF sample was available and neither the layout nor field names
 * may be assumed, so the labels here are the samples' own; the facts are the
 * ones PRD 5.6.1 and 5.6.5 require (酒店預訂編號, guest, dates, voided and
 * replacement). The reader understands only PDFs this writer produced
 * (uncompressed text, ASCII); it is not an OCR or PDF text extractor.
 */

import type {HotelConfirmation} from '../../../index';

/** The facts of a hotel confirmation, before a reader derives its digest. */
export type HotelConfirmationFacts = Omit<HotelConfirmation, 'contentDigest'>;

const LABELS = {
  hotel: 'Hotel',
  confirmationNo: 'Confirmation No',
  guest: 'Guest',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  rooms: 'Rooms',
  status: 'Status',
  replacedBy: 'Replaced by',
} as const;

const TITLE = 'HOTEL BOOKING CONFIRMATION (FICTIONAL SAMPLE)';
const SAMPLE_HOTEL = 'SAMPLE HOTEL JEJU (FICTIONAL)';

/** Writes a confirmation as a one-page PDF. */
export function writeHotelConfirmationPdf(
  confirmation: HotelConfirmationFacts,
): Uint8Array {
  const lines = [
    TITLE,
    `${LABELS.hotel}: ${SAMPLE_HOTEL}`,
    `${LABELS.confirmationNo}: ${confirmation.hotelConfirmationNo}`,
    `${LABELS.guest}: ${confirmation.guestName}`,
    `${LABELS.checkIn}: ${confirmation.checkInDate}`,
    `${LABELS.checkOut}: ${confirmation.checkOutDate}`,
    `${LABELS.rooms}: 1`,
    `${LABELS.status}: ${confirmation.voided ? 'VOID' : 'CONFIRMED'}`,
  ];
  if (confirmation.replacementConfirmationNo !== undefined) {
    lines.push(
      `${LABELS.replacedBy}: ${confirmation.replacementConfirmationNo}`,
    );
  }
  return writeTextPdf(lines);
}

/** Reads the confirmation facts from a PDF written by this module. */
export function readHotelConfirmationPdf(
  bytes: Uint8Array,
): HotelConfirmationFacts {
  const facts = new Map<string, string>();
  for (const line of readTextPdfLines(bytes)) {
    const separator = line.indexOf(': ');
    if (separator > 0) {
      facts.set(line.slice(0, separator), line.slice(separator + 2));
    }
  }
  const fact = (label: string) => {
    const value = facts.get(label);
    if (value === undefined) {
      throw new Error(`The confirmation PDF has no "${label}" line.`);
    }
    return value;
  };
  const replacement = facts.get(LABELS.replacedBy);
  return {
    hotelConfirmationNo: fact(LABELS.confirmationNo),
    guestName: fact(LABELS.guest),
    checkInDate: fact(LABELS.checkIn),
    checkOutDate: fact(LABELS.checkOut),
    voided: fact(LABELS.status) === 'VOID',
    ...(replacement === undefined
      ? {}
      : {replacementConfirmationNo: replacement}),
  };
}

/** Writes lines of ASCII text as a minimal valid one-page PDF 1.4. */
function writeTextPdf(lines: readonly string[]): Uint8Array {
  const content = [
    'BT',
    '/F1 12 Tf',
    '16 TL',
    '72 770 Td',
    ...lines.map(line => `(${escapePdfText(line)}) Tj T*`),
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
      '/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets
      .map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`)
      .join('') +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;
  // ASCII only (checked in escapePdfText), so string length is byte length.
  return new TextEncoder().encode(pdf);
}

/** Reads the text lines a {@link writeTextPdf} content stream shows. */
function readTextPdfLines(bytes: Uint8Array): string[] {
  const pdf = new TextDecoder('latin1').decode(bytes);
  const stream = /stream\n([\s\S]*?)\nendstream/.exec(pdf)?.[1];
  if (stream === undefined) {
    throw new Error('The PDF has no content stream.');
  }
  return [...stream.matchAll(/\(((?:\\.|[^\\)])*)\) Tj/g)].map(match =>
    (match[1] ?? '').replace(/\\(.)/g, '$1'),
  );
}

function escapePdfText(text: string): string {
  if (!/^[\x20-\x7e]*$/.test(text)) {
    throw new Error(`Sample PDF text must be printable ASCII: ${text}`);
  }
  return text.replace(/[\\()]/g, character => `\\${character}`);
}
