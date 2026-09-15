/**
 * @fileoverview Identifiers that arrive as untrusted text (cookies, query
 * strings) and are parsed once at the boundary into branded types, so the
 * use-cases never re-check their shape.
 */

import {randomBytes} from 'node:crypto';

declare const SESSION_TOKEN_BRAND: unique symbol;
declare const ACCOUNT_ID_BRAND: unique symbol;

/** An opaque session token shaped like the ones the session use-case issues. */
export type SessionToken = string & {readonly [SESSION_TOKEN_BRAND]: true};

/** An account id shaped like a UUID, lowercased. */
export type AccountId = string & {readonly [ACCOUNT_ID_BRAND]: true};

/** Bytes of randomness in a session token. */
const SESSION_TOKEN_BYTES = 32;
/** 32 bytes in unpadded base64url. */
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Parses a session token from untrusted text; undefined when the text is
 * missing or cannot be a token the application issued.
 */
export function parseSessionToken(
  text: string | null | undefined,
): SessionToken | undefined {
  if (typeof text !== 'string' || !SESSION_TOKEN_PATTERN.test(text)) {
    return undefined;
  }
  // Safe: the text has the exact shape of an issued token.
  return text as SessionToken;
}

/** Issues a new random session token. */
export function issueSessionToken(): SessionToken {
  // Safe: 32 random bytes in base64url always match SESSION_TOKEN_PATTERN.
  return randomBytes(SESSION_TOKEN_BYTES).toString('base64url') as SessionToken;
}

/**
 * Parses an account id from untrusted text; undefined when the text is
 * missing or not a UUID.
 */
export function parseAccountId(
  text: string | null | undefined,
): AccountId | undefined {
  if (typeof text !== 'string' || !UUID_PATTERN.test(text)) {
    return undefined;
  }
  // Safe: the text is a UUID; lowercasing matches how Postgres prints uuids.
  return text.toLowerCase() as AccountId;
}

/**
 * Reads an account id the database returned. The column is a Postgres uuid,
 * so it always parses; a failure means the store is broken, not the input.
 */
export function storedAccountId(id: string): AccountId {
  const accountId = parseAccountId(id);
  if (accountId === undefined) {
    throw new Error(`The stored account id ${id} is not a UUID.`);
  }
  return accountId;
}
