/**
 * @fileoverview Compares two screenshots with pixelmatch. Screenshots of
 * different sizes are padded to the larger width and height; every padded
 * pixel counts as different, so a page that is much taller or shorter than
 * its prototype scores a large difference.
 */

import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';

/** Colour of differing pixels in the diff image (pixelmatch's default). */
const DIFF_COLOUR: readonly [number, number, number] = [255, 0, 0];

/** The result of comparing a formal screenshot with a prototype screenshot. */
export interface ScreenshotComparison {
  /** Differing pixels divided by all pixels of the padded size, 0 to 1. */
  readonly diffRatio: number;
  /** The padded size both screenshots were compared at. */
  readonly width: number;
  readonly height: number;
  /** PNG of the padded size: differing pixels in red over a faded original. */
  readonly diffImage: Buffer;
}

/** Compares two PNG screenshots pixel by pixel. */
export function compareScreenshots(
  formalPng: Buffer,
  prototypePng: Buffer,
): ScreenshotComparison {
  const formal = PNG.sync.read(formalPng);
  const prototype = PNG.sync.read(prototypePng);
  const width = Math.max(formal.width, prototype.width);
  const height = Math.max(formal.height, prototype.height);
  const sharedWidth = Math.min(formal.width, prototype.width);
  const sharedHeight = Math.min(formal.height, prototype.height);

  const shared = new PNG({width: sharedWidth, height: sharedHeight});
  const sharedMismatches = pixelmatch(
    crop(formal, sharedWidth, sharedHeight),
    crop(prototype, sharedWidth, sharedHeight),
    shared.data,
    sharedWidth,
    sharedHeight,
    {threshold: 0.1},
  );

  const diff = new PNG({width, height});
  for (let offset = 0; offset < diff.data.length; offset += 4) {
    diff.data[offset] = DIFF_COLOUR[0];
    diff.data[offset + 1] = DIFF_COLOUR[1];
    diff.data[offset + 2] = DIFF_COLOUR[2];
    diff.data[offset + 3] = 255;
  }
  PNG.bitblt(shared, diff, 0, 0, sharedWidth, sharedHeight, 0, 0);

  const paddedPixels = width * height - sharedWidth * sharedHeight;
  return {
    diffRatio: (sharedMismatches + paddedPixels) / (width * height),
    width,
    height,
    diffImage: PNG.sync.write(diff),
  };
}

/** Returns the RGBA bytes of the top-left `width`×`height` part of an image. */
function crop(image: PNG, width: number, height: number): Uint8Array {
  if (image.width === width && image.height === height) {
    return image.data;
  }
  const part = new PNG({width, height});
  PNG.bitblt(image, part, 0, 0, width, height, 0, 0);
  return part.data;
}
