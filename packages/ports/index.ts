/**
 * @fileoverview Public entry point of the external ports: interfaces only for
 * the clock and the six external systems (ADR-0001). Real adapters live in
 * their own packages; fakes live behind the separate `testing.ts` entry point.
 *
 * Signatures are deliberately minimal. The ticket that first uses a port
 * sharpens it (spec: 外部介接邊界, 受控替身).
 */

/**
 * Tells the application what time it is. Tests replace it with a controllable
 * clock so that deadlines (24-hour links, 6-month attribution, calendar-month
 * settlement) are exercised without sleeping.
 */
export interface Clock {
  /** Returns the current instant. */
  now(): Date;
  /** Resolves once the given number of milliseconds has passed on this clock. */
  wait(milliseconds: number): Promise<void>;
}

/** Bundles the six external ports that use-cases may depend on. */
export interface ExternalPorts {
  readonly pointsWorkbooks: PointsWorkbookSource;
  readonly hotelConfirmations: HotelConfirmationSource;
  readonly ocr: OcrProvider;
  readonly keyManagement: KeyManagementService;
  readonly notifications: NotificationSender;
  readonly edge: EdgeProtection;
}

// --- 天城每日／期初積分 Excel -------------------------------------------------

/** Whether a venue workbook carries daily points or opening balances. */
export type PointsWorkbookKind = 'daily' | 'opening';

/** An Excel file an admin uploaded for import (no sync API exists). */
export interface PointsWorkbookUpload {
  readonly fileId: string;
  readonly kind: PointsWorkbookKind;
}

/** One data row of a venue points workbook. */
export interface PointsWorkbookRow {
  /** The row number as shown in Excel, for pointing at errors. */
  readonly rowNumber: number;
  readonly venueMemberNo: string;
  /** The venue-local activity date, `YYYY-MM-DD`. */
  readonly activityDate: string;
  readonly points: number;
}

/** A workbook that parsed against a supported format version. */
export interface PointsWorkbook {
  /** The template/format version the venue exported with. */
  readonly formatVersion: string;
  /** The version the venue assigned to this file's data. */
  readonly fileVersion: string;
  /** Identifies the exact content; differs whenever any row differs. */
  readonly contentDigest: string;
  readonly rows: readonly PointsWorkbookRow[];
}

/** The workbook was read. */
export interface PointsWorkbookRead {
  readonly status: 'read';
  readonly workbook: PointsWorkbook;
}

/** The workbook uses a format version the importer does not accept. */
export interface PointsWorkbookFormatMismatch {
  readonly status: 'formatVersionMismatch';
  readonly expectedFormatVersion: string;
  readonly actualFormatVersion: string;
}

/** A problem that stops the whole workbook from being imported. */
export interface PointsWorkbookBlockingError {
  readonly rowNumber?: number;
  readonly message: string;
}

/** The workbook has blocking errors; nothing in it may be booked. */
export interface PointsWorkbookBlocked {
  readonly status: 'blocked';
  readonly errors: readonly PointsWorkbookBlockingError[];
}

/** Reads venue points workbooks uploaded by hand. */
export interface PointsWorkbookSource {
  /** Parses an uploaded workbook, or says why it cannot be used. */
  read(
    upload: PointsWorkbookUpload,
  ): Promise<
    PointsWorkbookRead | PointsWorkbookFormatMismatch | PointsWorkbookBlocked
  >;
}

// --- 酒店確認 PDF ------------------------------------------------------------

/** The facts extracted from a hotel confirmation PDF. */
export interface HotelConfirmation {
  /** 酒店預訂編號, issued by the venue's hotel. */
  readonly hotelConfirmationNo: string;
  readonly guestName: string;
  /** Hotel-local date, `YYYY-MM-DD`. */
  readonly checkInDate: string;
  /** Hotel-local date, `YYYY-MM-DD`. */
  readonly checkOutDate: string;
  readonly voided: boolean;
  /** The confirmation that replaces this one, when the hotel names one. */
  readonly replacementConfirmationNo?: string;
  /** Identifies the exact document content. */
  readonly contentDigest: string;
}

/** The PDF was found and read. */
export interface HotelConfirmationRead {
  readonly status: 'read';
  readonly confirmation: HotelConfirmation;
}

/** No PDF exists for the reference (缺件). */
export interface HotelConfirmationMissing {
  readonly status: 'missing';
}

/** Reads hotel confirmation PDFs uploaded by admins. */
export interface HotelConfirmationSource {
  /** Extracts the confirmation from an uploaded file. */
  read(
    fileId: string,
  ): Promise<HotelConfirmationRead | HotelConfirmationMissing>;
}

// --- 外部 OCR ----------------------------------------------------------------

/** An identity document version to recognise. */
export interface OcrRequest {
  readonly documentVersionId: string;
  /** Which identity document it is, e.g. `passport`. */
  readonly documentKind: string;
}

/** The provider recognised the document. */
export interface OcrRecognized {
  readonly status: 'recognized';
  readonly fields: Readonly<Record<string, string>>;
}

/** The provider answered but could not recognise the document. */
export interface OcrUnrecognized {
  readonly status: 'unrecognized';
  readonly reason: string;
}

/**
 * An external OCR provider. It may answer slowly or never; callers race it
 * against the clock (spec: OCR p95 ≤ 30 s, manual fill after 30 s, timeout
 * after 2 min).
 */
export interface OcrProvider {
  /** Recognises the fields of an identity document. */
  recognize(request: OcrRequest): Promise<OcrRecognized | OcrUnrecognized>;
}

// --- KMS ---------------------------------------------------------------------

/** Locates one version of a key-encryption key in one region. */
export interface KeyReference {
  readonly keyId: string;
  readonly keyVersion: string;
  readonly region: string;
}

/** Why a KMS operation failed. */
export type KeyManagementFailureReason =
  | 'wrapFailed'
  | 'decryptFailed'
  | 'keyVersionUnavailable'
  | 'regionUnavailable';

/** A KMS operation failed; callers pause the operation, never store plaintext. */
export interface KeyManagementFailure {
  readonly status: 'failed';
  readonly reason: KeyManagementFailureReason;
}

/** A data-encryption key wrapped under a key-encryption key. */
export interface DataKeyWrapped {
  readonly status: 'wrapped';
  readonly key: KeyReference;
  readonly wrappedDataKey: Uint8Array;
}

/** A data-encryption key recovered from its wrapped form. */
export interface DataKeyUnwrapped {
  readonly status: 'unwrapped';
  readonly dataKey: Uint8Array;
}

/** Holds key-encryption keys for envelope encryption (spec: 文件保護). */
export interface KeyManagementService {
  /** Wraps a per-document data key under the referenced key version. */
  wrapDataKey(
    key: KeyReference,
    dataKey: Uint8Array,
  ): Promise<DataKeyWrapped | KeyManagementFailure>;
  /** Recovers a data key wrapped under the referenced key version. */
  unwrapDataKey(
    key: KeyReference,
    wrappedDataKey: Uint8Array,
  ): Promise<DataKeyUnwrapped | KeyManagementFailure>;
}

// --- 通知管道 ----------------------------------------------------------------

/** The notification channels in scope (no Respond.io). */
export type NotificationChannel = 'line' | 'email' | 'whatsApp' | 'telegram';

/** A message to deliver through one channel. */
export interface OutgoingNotification {
  /** Operation id, so a retried send can be recognised. */
  readonly messageId: string;
  readonly channel: NotificationChannel;
  readonly recipientAddress: string;
  readonly body: string;
}

/** The channel accepted the message. */
export interface NotificationSent {
  readonly status: 'sent';
  readonly messageId: string;
  readonly channel: NotificationChannel;
}

/** The channel did not accept the message. */
export interface NotificationFailed {
  readonly status: 'failed';
  readonly messageId: string;
  readonly channel: NotificationChannel;
  readonly reason: 'sendFailed' | 'channelUnreachable';
}

/** Sends notifications over LINE, Email, WhatsApp or Telegram. */
export interface NotificationSender {
  /** Sends one message through the channel it names. */
  send(
    notification: OutgoingNotification,
  ): Promise<NotificationSent | NotificationFailed>;
}

// --- 邊緣防護（Cloudflare）---------------------------------------------------

/** The parts of an incoming request the edge decides on. */
export interface EdgeRequest {
  readonly host: string;
  readonly method: string;
  readonly path: string;
}

/** The request reached the origin and its response reached the caller. */
export interface EdgeDelivered<T> {
  readonly status: 'delivered';
  readonly response: T;
}

/** The request did not get a normal response from the origin. */
export interface EdgeStopped {
  /**
   * `blocked`: WAF blocked it (possibly by mistake); `challenged`: the edge
   * demanded a challenge; `unavailable`: the edge itself failed. The origin
   * never saw the request in any of these cases.
   */
  readonly status: 'blocked' | 'challenged' | 'unavailable';
}

/**
 * The origin handled the request but the response was lost on the way back,
 * so the caller cannot tell whether the operation took effect.
 */
export interface EdgeInterrupted {
  readonly status: 'interrupted';
}

/**
 * The edge in front of every host (WAF, DDoS, challenges). It is not an
 * authorisation layer: a block is not a blacklist or a business refusal.
 */
export interface EdgeProtection {
  /** Passes a request through the edge to the origin handler. */
  pass<T>(
    request: EdgeRequest,
    origin: () => Promise<T>,
  ): Promise<EdgeDelivered<T> | EdgeStopped | EdgeInterrupted>;
}
