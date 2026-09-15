/**
 * @fileoverview DESIGN.md §5 and ticket 13: the player surface never nudges
 * a member to play more for a free stay. Scans the player-home copy module
 * and the player components' built-in labels as text (they are read, not
 * imported, so the dev-only kitchen-sink stays unreachable from tests).
 */

import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

import {describe, expect, it} from 'vitest';

/** Files holding every string the player home shows. */
const PLAYER_COPY_FILES = [
  '../kitchen_sink/pages/player_home_copy.ts',
  '../lib/app_header.tsx',
  '../lib/bottom_nav.tsx',
  '../lib/points_panel.tsx',
];

// Ticket 13 / PRD: 「再打多久就能免費住宿」「再打多久即可免費住宿」 and the
// phrasings they are built from.
const PLAY_MORE_PROMPTS = [
  '再打多久',
  '再玩多久',
  '免費住宿',
  '免費入住',
  '就能免費',
  '即可免費',
  '還差',
  '再累積',
];

/** Lists the play-more prompts that occur in `copy`. */
function findPlayMorePrompts(copy: string): string[] {
  return PLAY_MORE_PROMPTS.filter(phrase => copy.includes(phrase));
}

describe('player copy', () => {
  it('flags the play-more prompt quoted in ticket 13', () => {
    expect(findPlayMorePrompts('再打多久就能免費住宿')).toEqual([
      '再打多久',
      '免費住宿',
      '就能免費',
    ]);
    expect(findPlayMorePrompts('還差 5,000 分即可免費入住')).toEqual([
      '免費入住',
      '即可免費',
      '還差',
    ]);
  });

  it('never urges the member to play more for a free stay', () => {
    const found = PLAYER_COPY_FILES.flatMap(file =>
      findPlayMorePrompts(
        readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8'),
      ).map(phrase => `${file}: ${phrase}`),
    );
    expect(found).toEqual([]);
  });
});
