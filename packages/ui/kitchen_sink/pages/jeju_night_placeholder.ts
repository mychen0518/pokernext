/**
 * @fileoverview Stand-in for a destination photo (night coast) behind the
 * player-home HeroTripCard: flat shapes in the DESIGN.md §2 background steps
 * and a few dim gold lights, no gradients. Colours are read from the loaded
 * `--pn-*` tokens, because an `<img>` cannot resolve CSS custom properties.
 */

/** Light dots along the coast: `[cx, cy, r]`. */
const LIGHTS: ReadonlyArray<readonly [number, number, number]> = [
  [96, 258, 1.5],
  [128, 257, 1.5],
  [160, 256, 1.5],
  [196, 256, 1.5],
  [232, 257, 1.5],
  [268, 258, 1.5],
  [316, 288, 2],
  [352, 278, 2],
  [390, 272, 2],
  [428, 268, 2],
  [462, 264, 2],
  [372, 306, 2],
  [420, 296, 2],
  [452, 318, 2],
];

/** Light reflections on the water: `[x, y, height]`. */
const REFLECTIONS: ReadonlyArray<readonly [number, number, number]> = [
  [127, 266, 16],
  [195, 265, 20],
  [267, 267, 14],
];

/**
 * Returns the night-coast stand-in as an SVG data URL painted with the
 * current token values. Call it after `tokens.css` has loaded (at render).
 */
export function jejuNightPlaceholderSrc(): string {
  const computed = getComputedStyle(document.documentElement);
  const token = (name: string) =>
    computed.getPropertyValue(`--pn-${name}`).trim();
  const lights = LIGHTS.map(
    ([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`,
  ).join('');
  const reflections = REFLECTIONS.map(
    ([x, y, height]) =>
      `<rect x="${x}" y="${y}" width="2" height="${height}"/>`,
  ).join('');
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 440" ' +
    'preserveAspectRatio="xMidYMid slice">' +
    `<rect width="480" height="440" fill="${token('surface')}"/>` +
    '<path d="M0 250C60 244 120 238 190 236 230 214 262 196 300 192 334 ' +
    '190 360 210 392 226 424 232 452 236 480 236V262H0z" ' +
    `fill="${token('surface-2')}"/>` +
    '<path d="M250 262C300 250 350 246 400 240 430 236 456 226 480 216' +
    `V300H250z" fill="${token('surface-3')}"/>` +
    `<rect y="258" width="480" height="182" fill="${token('bg')}"/>` +
    '<path d="M292 300C340 284 400 272 480 262V440H250C262 380 270 330 ' +
    `292 300z" fill="${token('surface')}"/>` +
    `<g fill="${token('gold-dim')}" fill-opacity="0.6">${lights}</g>` +
    `<g fill="${token('gold-dim')}" fill-opacity="0.2">${reflections}</g>` +
    '</svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
