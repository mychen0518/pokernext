/**
 * @fileoverview Enforces DESIGN.md §2 in component and kitchen-sink styles:
 * every colour, font, font size, spacing, radius, shadow and letter spacing
 * in `lib/**\/*.module.css` and `kitchen_sink/**\/*.module.css` is a
 * `var(--pn-*)` token, never a literal; only Modal and Drawer use the overlay
 * shadow.
 */

import {readdirSync, readFileSync} from 'node:fs';
import {basename, join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {describe, expect, it} from 'vitest';

const LIB_DIR = fileURLToPath(new URL('../lib', import.meta.url));
const KITCHEN_SINK_DIR = fileURLToPath(
  new URL('../kitchen_sink', import.meta.url),
);

// DESIGN.md §2.3: Modal and Drawer are the only components with a shadow;
// both are styled by this one stylesheet.
const OVERLAY_STYLESHEET = 'overlay.module.css';

// CSS Color Module Level 4 named colours. `transparent` and `currentcolor`
// are keywords, not palette colours, and stay allowed.
const NAMED_COLOURS = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black ' +
    'blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse ' +
    'chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan ' +
    'darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta ' +
    'darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen ' +
    'darkslateblue darkslategray darkslategrey darkturquoise darkviolet ' +
    'deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite ' +
    'forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green ' +
    'greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender ' +
    'lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan ' +
    'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink ' +
    'lightsalmon lightseagreen lightskyblue lightslategray lightslategrey ' +
    'lightsteelblue lightyellow lime limegreen linen magenta maroon ' +
    'mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen ' +
    'mediumslateblue mediumspringgreen mediumturquoise mediumvioletred ' +
    'midnightblue mintcream mistyrose moccasin navajowhite navy oldlace ' +
    'olive olivedrab orange orangered orchid palegoldenrod palegreen ' +
    'paleturquoise palevioletred papayawhip peachpuff peru pink plum ' +
    'powderblue purple rebeccapurple red rosybrown royalblue saddlebrown ' +
    'salmon sandybrown seagreen seashell sienna silver skyblue slateblue ' +
    'slategray slategrey snow springgreen steelblue tan teal thistle tomato ' +
    'turquoise violet wheat white whitesmoke yellow yellowgreen'
  ).split(' '),
);

const TOKEN_REFERENCE = /var\(--pn-[a-z0-9-]+\)/g;
const LENGTH_LITERAL = /(?<![\w.-])-?\d*\.?\d+(px|rem|em|%|vh|vw|pt)\b/;
const SPACING_PROPERTY =
  /^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left)(-|$)/;
const RADIUS_PROPERTY = /^border(-[a-z]+)*-radius$/;
// Weight and line height are plain numbers in DESIGN.md, so only the family
// and size (and the `font` shorthand, which carries both) must be tokens.
const FONT_PROPERTY = /^(font|font-family|font-size)$/;
// DESIGN.md §1 and §2.3: flat surfaces; a shadow is a token or nothing.
const SHADOW_PROPERTY = /^box-shadow$/;
// DESIGN.md §2.2: wide tracking is the overline token, not a new value.
const TRACKING_PROPERTY = /^letter-spacing$/;

/** One literal design value found in a stylesheet. */
interface Violation {
  readonly declaration: string;
  readonly reason: string;
}

/** Lists every declaration in `css` that hard-codes a design value. */
function findLiteralDesignValues(css: string): Violation[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const violations: Violation[] = [];
  for (const match of withoutComments.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)) {
    const property = match[1];
    const value = match[2].trim();
    const declaration = `${property}: ${value}`;
    if (property.startsWith('--')) {
      continue;
    }
    const literalPart = value.replace(TOKEN_REFERENCE, ' ');
    if (
      /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i.test(
        literalPart,
      )
    ) {
      violations.push({declaration, reason: 'literal colour'});
    }
    const words = literalPart.toLowerCase().match(/[a-z]+/g) ?? [];
    if (words.some(word => NAMED_COLOURS.has(word))) {
      violations.push({declaration, reason: 'named colour'});
    }
    if (
      FONT_PROPERTY.test(property) &&
      !/^[\s/]*(inherit)?[\s/]*$/.test(literalPart)
    ) {
      violations.push({declaration, reason: 'literal font value'});
    }
    if (SPACING_PROPERTY.test(property) && LENGTH_LITERAL.test(literalPart)) {
      violations.push({declaration, reason: 'literal spacing'});
    }
    if (RADIUS_PROPERTY.test(property) && LENGTH_LITERAL.test(literalPart)) {
      violations.push({declaration, reason: 'literal radius'});
    }
    if (
      SHADOW_PROPERTY.test(property) &&
      !/^\s*(none)?\s*$/.test(literalPart)
    ) {
      violations.push({declaration, reason: 'literal shadow'});
    }
    if (
      TRACKING_PROPERTY.test(property) &&
      !/^\s*(0|normal)?\s*$/.test(literalPart)
    ) {
      violations.push({declaration, reason: 'literal letter spacing'});
    }
  }
  return violations;
}

/** Lists every CSS Module under `dir`, recursively. */
function listCssModules(dir: string): string[] {
  return readdirSync(dir, {recursive: true, encoding: 'utf8'})
    .filter(file => file.endsWith('.module.css'))
    .map(file => join(dir, file));
}

describe('component styles', () => {
  it('reports hard-coded colours, fonts, spacing and radii', () => {
    const css = `
      .a { color: #fff; background: rgba(0, 0, 0, 0.5); }
      .b { border-color: red; font-family: Georgia, serif; }
      .c { padding: 12px var(--pn-space-2); gap: 1rem; }
      .d { border-radius: 10px; font-size: 14px; }
      .e { box-shadow: 0 2px 4px var(--pn-scrim); letter-spacing: 0.2em; }
    `;
    expect(findLiteralDesignValues(css).map(v => v.reason)).toEqual([
      'literal colour',
      'literal colour',
      'named colour',
      'literal font value',
      'literal spacing',
      'literal spacing',
      'literal radius',
      'literal font value',
      'literal shadow',
      'literal letter spacing',
    ]);
  });

  it('accepts tokens, zero, keywords and 1px borders', () => {
    const css = `
      .a { color: var(--pn-text); background: transparent; margin: 0; }
      .b { border: 1px solid var(--pn-border); padding: 0 var(--pn-space-6); }
      .c { font: var(--pn-type-body-weight) var(--pn-type-body-size) /
        var(--pn-type-body-line) var(--pn-type-body-family); }
      .d { border-radius: var(--pn-radius-md); height: 44px; }
      .e { margin-left: calc(-1 * var(--pn-space-2)); }
      .f { box-shadow: var(--pn-shadow); letter-spacing: 0; }
      .g { letter-spacing: var(--pn-type-overline-tracking); }
    `;
    expect(findLiteralDesignValues(css)).toEqual([]);
  });

  it('use only design tokens for colour, font, spacing, radius, shadow and tracking', () => {
    const files = [
      ...listCssModules(LIB_DIR),
      ...listCssModules(KITCHEN_SINK_DIR),
    ];
    expect(files.length).toBeGreaterThan(0);
    const violations = files.flatMap(file =>
      findLiteralDesignValues(readFileSync(file, 'utf8')).map(
        v => `${file}: ${v.reason} in "${v.declaration}"`,
      ),
    );
    expect(violations).toEqual([]);
  });

  it('give a shadow only to Modal and Drawer', () => {
    const shadowed = listCssModules(LIB_DIR).filter(file =>
      /box-shadow\s*:\s*var\(--pn-shadow-overlay\)/.test(
        readFileSync(file, 'utf8'),
      ),
    );
    expect(shadowed.map(file => basename(file))).toEqual([OVERLAY_STYLESHEET]);
  });
});
