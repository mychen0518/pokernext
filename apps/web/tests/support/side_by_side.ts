/**
 * @fileoverview Joins a screenshot and a reference image into one PNG, the
 * reference scaled (nearest neighbour) to the screenshot's height, for the
 * visual comparison DESIGN.md §8 asks for.
 */

import {readFileSync, writeFileSync} from 'node:fs';

import {PNG} from 'pngjs';

/** Gap between the two images, in pixels. */
const GAP = 24;

/** Writes `screenshot | reference` side by side to `outputPath`. */
export function writeSideBySide(
  screenshotPath: string,
  referencePath: string,
  outputPath: string,
): void {
  const left = PNG.sync.read(readFileSync(screenshotPath));
  const reference = PNG.sync.read(readFileSync(referencePath));
  const scale = left.height / reference.height;
  const rightWidth = Math.round(reference.width * scale);
  const output = new PNG({
    width: left.width + GAP + rightWidth,
    height: left.height,
  });
  output.data.fill(0);
  for (let i = 3; i < output.data.length; i += 4) {
    output.data[i] = 255;
  }
  PNG.bitblt(left, output, 0, 0, left.width, left.height, 0, 0);
  for (let y = 0; y < left.height; y++) {
    const sourceY = Math.min(reference.height - 1, Math.floor(y / scale));
    for (let x = 0; x < rightWidth; x++) {
      const sourceX = Math.min(reference.width - 1, Math.floor(x / scale));
      const from = (sourceY * reference.width + sourceX) * 4;
      const to = (y * output.width + left.width + GAP + x) * 4;
      reference.data.copy(output.data, to, from, from + 4);
    }
  }
  writeFileSync(outputPath, PNG.sync.write(output));
}
