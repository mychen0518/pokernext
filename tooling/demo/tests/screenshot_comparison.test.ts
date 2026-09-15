/**
 * @fileoverview How `demo:diff` scores a formal screenshot against its
 * prototype screenshot: the share of differing pixels, where the part of the
 * taller (or wider) image that the other lacks counts as different.
 */

import {PNG} from 'pngjs';
import {describe, expect, test} from 'vitest';

import {compareScreenshots} from '../diff';

/** A solid-colour PNG of the given size. */
function solidPng(
  width: number,
  height: number,
  [red, green, blue]: [number, number, number],
): Buffer {
  const png = new PNG({width, height});
  for (let offset = 0; offset < png.data.length; offset += 4) {
    png.data[offset] = red;
    png.data[offset + 1] = green;
    png.data[offset + 2] = blue;
    png.data[offset + 3] = 255;
  }
  return PNG.sync.write(png);
}

const BLACK: [number, number, number] = [0, 0, 0];
const WHITE: [number, number, number] = [255, 255, 255];

describe('截圖比對', () => {
  test('兩張一模一樣的截圖差異比例為 0', () => {
    const comparison = compareScreenshots(
      solidPng(8, 6, BLACK),
      solidPng(8, 6, BLACK),
    );

    expect(comparison.diffRatio).toBe(0);
  });

  test('每個像素都不同時差異比例為 1', () => {
    const comparison = compareScreenshots(
      solidPng(8, 6, BLACK),
      solidPng(8, 6, WHITE),
    );

    expect(comparison.diffRatio).toBe(1);
  });

  test('高度不同時補齊到較高的一張，多出來的部分算作差異', () => {
    // 8×6 vs 8×2 with the same colour: 16 shared pixels match, the 32 pixels
    // only the taller image has count as different: 32 / 48.
    const comparison = compareScreenshots(
      solidPng(8, 6, BLACK),
      solidPng(8, 2, BLACK),
    );

    expect(comparison.diffRatio).toBeCloseTo(2 / 3, 10);
    expect([comparison.width, comparison.height]).toEqual([8, 6]);
  });

  test('差異圖是補齊後大小的 PNG，補齊區域標成差異色', () => {
    const comparison = compareScreenshots(
      solidPng(4, 2, BLACK),
      solidPng(4, 4, BLACK),
    );

    const diff = PNG.sync.read(comparison.diffImage);
    expect([diff.width, diff.height]).toEqual([4, 4]);
    const bottomLeft = (3 * 4 + 0) * 4;
    expect([...diff.data.subarray(bottomLeft, bottomLeft + 4)]).toEqual([
      255, 0, 0, 255,
    ]);
    const topLeft = 0;
    expect(diff.data[topLeft]).not.toBe(255);
  });
});
