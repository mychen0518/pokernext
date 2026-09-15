---
name: google-style
description: Google Style Guide rules for this repo. Use whenever writing or editing TypeScript/TSX, CSS/HTML, Markdown, JSON, or a commit message in POKERNEXT — before the first line, not after.
---

# Google Style for POKERNEXT

All code in this repo follows the Google Style Guides (`Coding Guide/`, https://google.github.io/styleguide/). `gts` (eslint + prettier) enforces the mechanical TypeScript rules in pre-commit; this skill is the part you must hold in your head while designing code, because lint runs after you have already shaped it. `docs/CODING_STANDARDS.md` is the reviewer's copy of the same rules.

## TypeScript

**Files and modules**

- File names are `snake_case`: `deposit_axes.ts`, `deposit_axes.test.ts`, `trip_detail_page.tsx`.
- File order: `@fileoverview` JSDoc → imports → implementation, one blank line between sections.
- Named exports only. Never `export default` (Next.js `page.tsx`/`layout.tsx` are the one framework-forced exception; keep the default export a one-line re-export of a named component).
- No `namespace`. Cross-file references are ES imports; `import type` when only the type is used; `export type` for type re-exports.
- Relative imports inside a package; package entry points (root files) from outside — never `lib/` internals.

**Types**

- No `any`. Use `unknown` and narrow. If unavoidable, `// any: <reason>` on the same line.
- Object shapes are `interface`, not `type` aliases. Unions, mapped and conditional types may be `type`.
- `T[]` for simple element types, `Array<T>` for complex ones. No `{}` type — use `unknown`, `object`, or `Record<string, T>`.
- Optional fields `x?: T` rather than `x: T | undefined`. Prefer `undefined` over `null` unless an external API needs `null`.
- No `const enum`. Plain `enum` or a `const` object + union type.
- Type assertions use `as`, never angle brackets; every `as` and every `x!` carries a comment saying why it is safe.
- Never `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`.

**Declarations and control flow**

- `const` by default, `let` when reassigned, never `var`.
- `===` / `!==` only (`== null` allowed to catch both null and undefined).
- Braces on every `if`/`for`/`while`; `for…of` over arrays, never unfiltered `for…in`.
- Single-quoted strings; template literals for composed strings; explicit semicolons.
- Throw `new Error('…')` or an `Error` subclass. Never throw strings or plain objects.
- Top-level functions are `function` declarations. Callbacks are arrow functions. No `function` expressions.
- Arrow bodies: concise only when the value is used; otherwise block body.
- Spread only like-for-like: iterables into arrays, objects into objects.

**Classes**

- Visibility via `private`/`protected`/`readonly`; never `#private` fields.
- Parameter properties for injected collaborators: `constructor(private readonly clock: Clock) {}`.
- `readonly` on anything not reassigned after construction.
- Getters are pure. No arrow-function class properties. No `this` in static members.
- `new Foo()` always with parentheses.

**Naming**

- `UpperCamelCase`: classes, interfaces, types, enums, type parameters.
- `lowerCamelCase`: variables, parameters, functions, methods, properties.
- `CONSTANT_CASE`: module-level immutable constants and enum members.
- Acronyms as words: `loadHttpUrl`, `venueMemberNo`, not `loadHTTPURL`.
- No leading or trailing `_`; no `I` prefix on interfaces; no Hungarian notation.
- Descriptive names; single letters only for scopes of ≤ 10 lines.

**Comments**

- `/** JSDoc */` on every exported symbol; the description starts with a third-person verb phrase ("Computes the refundable amount…").
- `//` for implementation notes; multi-line notes are stacked `//`, never `/* */`.
- Domain rules cite the PRD: `// PRD 6.6.2 逐晚退款`.

**Forbidden**

`any`, `var`, default exports, `namespace`, `#fields`, own decorators, `eval`/`new Function`, prototype patching, wrapper objects (`new String()`), `debugger`, `with`, `@ts-ignore`.

## HTML and CSS (`packages/ui`, `apps/web`)

- 2-space indent, lowercase everything, no trailing whitespace, UTF-8, `<!doctype html>`.
- Semantic elements; `alt` on images (`alt=""` for decorative); no inline styles or inline event handlers.
- Omit `type` on `<link>`/`<script>`; double quotes for HTML attributes.
- Prefer `class` for styling and `data-*` for scripting; avoid `id` unless required (then hyphenated).
- Class names: lowercase, hyphen-separated, named by purpose (`status-dot`, `kpi-tile`), prefixed `pn-` where they leave a component's CSS Module.
- Selectors: no ID selectors, no type-qualified classes (`div.card`), no `!important` outside the reset.
- Values: shorthand properties, `0` without units, leading zeros (`0.5em`), 3-digit hex where possible — but in this repo every colour, spacing, radius and font value is a `var(--pn-*)` token from `docs/design/DESIGN.md` §2; a literal is a defect.
- Formatting: one selector per line, one declaration per line, declarations alphabetised, semicolon after every declaration, space after the colon and before `{`, blank line between rules, single quotes.

## Markdown (docs, tickets, ADRs)

ATX headings with one `#` per file; `-` bullets; fenced code blocks with a language; tables only for tabular data; wrap prose at ~80 columns; no trailing spaces; one blank line before lists and after headings.

## JSON (fixtures, API payloads)

`lowerCamelCase` property names; no comments; dates as ISO 8601 strings; money as integers in minor units plus a `currency` field (`{ "amountKrw": 300000 }`); booleans, not `"Y"/"N"`.

## Commit messages

Subject line ≤ 50 characters, imperative mood, capitalised, no trailing period; blank line; body wrapped at 72 explaining *what* and *why*, not how. Reference the ticket: `Refs .scratch/pokernext-platform/issues/19`.

## Before you hand in

1. `pnpm -w lint` (gts) and `pnpm -w typecheck` are green.
2. No literal colours/spacing in CSS; no `any`; no default exports outside Next.js route files.
3. Every exported symbol has JSDoc; every domain rule cites its PRD section.
