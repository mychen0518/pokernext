/**
 * @fileoverview Checks the DESIGN.md §6 contrast gate against the published
 * token file: body text tokens must stay readable on card surfaces.
 */

import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

import {describe, expect, it} from 'vitest';

const TOKENS_CSS = readFileSync(
  fileURLToPath(new URL('../tokens.css', import.meta.url)),
  'utf8',
);

/** WCAG 2.x AA minimum for normal-size text (DESIGN.md §6). */
const WCAG_AA_NORMAL_TEXT = 4.5;

/** Reads a hex colour token such as `--pn-text` from tokens.css. */
function readHexToken(name: string): string {
  const match = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(
    TOKENS_CSS,
  );
  if (!match) {
    throw new Error(`tokens.css does not define ${name} as a 6-digit hex`);
  }
  return match[1];
}

/** Computes WCAG relative luminance of a `#rrggbb` colour. */
function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map(offset => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Computes the WCAG contrast ratio between two `#rrggbb` colours. */
function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Text contrast on cards', () => {
  it('white on black has the WCAG reference contrast of 21:1', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('a member can read primary text on a card', () => {
    const ratio = contrastRatio(
      readHexToken('--pn-text'),
      readHexToken('--pn-surface'),
    );
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
  });

  it('a member can read secondary text on a card', () => {
    const ratio = contrastRatio(
      readHexToken('--pn-text-2'),
      readHexToken('--pn-surface'),
    );
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
  });
});
