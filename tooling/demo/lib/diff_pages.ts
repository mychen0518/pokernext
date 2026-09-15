/**
 * @fileoverview The `demo:diff` mapping table (`tooling/demo/diff_pages.json`):
 * each row pairs a formal page with a prototype hash route and names the
 * viewports to capture. Rows are data, so adding one needs no tool change;
 * this module reads and validates them and reports a malformed row by file,
 * row and field.
 */

import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

import {type Workspace, WORKSPACES} from '@pokernext/domain';

/** The committed mapping table. */
export const DEFAULT_DIFF_PAGES_PATH = fileURLToPath(
  new URL('../diff_pages.json', import.meta.url),
);

/** Which of the two local hosts serves a formal page. */
export type HostKind = 'player' | 'work';

/** A DESIGN.md viewport: desktop 1440×1024 or mobile 390×844. */
export type ViewportName = 'desktop' | 'mobile';

/** Pixel sizes of the DESIGN.md viewports. */
export const VIEWPORT_SIZES: Readonly<
  Record<ViewportName, {readonly width: number; readonly height: number}>
> = {
  desktop: {width: 1440, height: 1024},
  mobile: {width: 390, height: 844},
};

/** Signs in as the demo account of a workspace. */
export interface SignInAsWorkspace {
  readonly workspace: Workspace;
}

/** Signs in as one account, for pages that need a specific account. */
export interface SignInAsAccount {
  readonly accountId: string;
}

/** Who to sign in as before capturing a formal page. */
export type SignInAs = SignInAsWorkspace | SignInAsAccount;

/** The formal page of a row. */
export interface FormalPage {
  readonly host: HostKind;
  /** Path on that host, starting with `/`. */
  readonly path: string;
  /** Omitted for pages that are viewed without a session. */
  readonly signInAs?: SignInAs;
}

/** The prototype page of a row. */
export interface PrototypePage {
  /** Hash route of `pokernext-prototype.html`, e.g. `#/venue/overview`. */
  readonly route: string;
}

/** One row of the mapping table. */
export interface DiffPage {
  /** Unique; names the report's image files. */
  readonly id: string;
  readonly title: string;
  readonly formal: FormalPage;
  readonly prototype: PrototypePage;
  readonly viewports: readonly ViewportName[];
}

/** Reports a row that does not match the table format. */
class RowError extends Error {}

/**
 * Reads and validates the mapping table, by default the committed
 * `diff_pages.json`; throws an error naming the file, row and field of the
 * first malformed row.
 */
export function loadDiffPages(path = DEFAULT_DIFF_PAGES_PATH): DiffPage[] {
  let table: unknown;
  try {
    table = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error: unknown) {
    throw new Error(`${path}: not readable as JSON.`, {cause: error});
  }
  if (!isRecord(table) || !Array.isArray(table.pages)) {
    throw new Error(`${path}: expected an object with a "pages" list.`);
  }
  const pages: DiffPage[] = [];
  const firstIndexOfId = new Map<string, number>();
  table.pages.forEach((row: unknown, index: number) => {
    const label = `pages[${index}]${rowIdSuffix(row)}`;
    try {
      const page = parseRow(row);
      const previous = firstIndexOfId.get(page.id);
      if (previous !== undefined) {
        throw new RowError(
          `id "${page.id}" is already used by pages[${previous}].`,
        );
      }
      firstIndexOfId.set(page.id, index);
      pages.push(page);
    } catch (error: unknown) {
      if (error instanceof RowError) {
        throw new Error(`${path}: ${label}: ${error.message}`);
      }
      throw error;
    }
  });
  return pages;
}

function parseRow(row: unknown): DiffPage {
  if (!isRecord(row)) {
    throw new RowError('must be an object.');
  }
  const id = requireString(row.id, 'id');
  if (!/^[a-z0-9_]+$/.test(id)) {
    throw new RowError('id must use only a-z, 0-9 and _.');
  }
  return {
    id,
    title: requireString(row.title, 'title'),
    formal: parseFormal(row.formal),
    prototype: parsePrototype(row.prototype),
    viewports: parseViewports(row.viewports),
  };
}

function parseFormal(value: unknown): FormalPage {
  if (!isRecord(value)) {
    throw new RowError('formal must be an object.');
  }
  if (value.host !== 'player' && value.host !== 'work') {
    throw new RowError('formal.host must be "player" or "work".');
  }
  const path = requireString(value.path, 'formal.path');
  if (!path.startsWith('/')) {
    throw new RowError('formal.path must start with "/".');
  }
  if (value.signInAs === undefined) {
    return {host: value.host, path};
  }
  return {host: value.host, path, signInAs: parseSignInAs(value.signInAs)};
}

function parseSignInAs(value: unknown): SignInAs {
  const exactlyOne =
    'formal.signInAs must name exactly one of workspace or accountId.';
  if (!isRecord(value)) {
    throw new RowError(exactlyOne);
  }
  const keys = Object.keys(value);
  if (keys.length !== 1) {
    throw new RowError(exactlyOne);
  }
  if (keys[0] === 'accountId') {
    return {
      accountId: requireString(value.accountId, 'formal.signInAs.accountId'),
    };
  }
  if (keys[0] === 'workspace') {
    const workspace = WORKSPACES.find(known => known === value.workspace);
    if (workspace === undefined) {
      throw new RowError(
        `formal.signInAs.workspace must be one of ${WORKSPACES.join(', ')}.`,
      );
    }
    return {workspace};
  }
  throw new RowError(exactlyOne);
}

function parsePrototype(value: unknown): PrototypePage {
  if (!isRecord(value)) {
    throw new RowError('prototype must be an object.');
  }
  const route = requireString(value.route, 'prototype.route');
  if (!route.startsWith('#/')) {
    throw new RowError('prototype.route must start with "#/".');
  }
  return {route};
}

function parseViewports(value: unknown): ViewportName[] {
  const message =
    'viewports must be a non-empty list of "desktop" and "mobile".';
  if (!Array.isArray(value) || value.length === 0) {
    throw new RowError(message);
  }
  const viewports: ViewportName[] = [];
  for (const item of value) {
    if (item !== 'desktop' && item !== 'mobile') {
      throw new RowError(message);
    }
    if (!viewports.includes(item)) {
      viewports.push(item);
    }
  }
  return viewports;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new RowError(`${field} must be a non-empty string.`);
  }
  return value;
}

/** Returns ` (<id>)` when the row has a string id, for error messages. */
function rowIdSuffix(row: unknown): string {
  return isRecord(row) && typeof row.id === 'string' ? ` (${row.id})` : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
