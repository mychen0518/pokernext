# @pokernext/ui

The POKERNEXT design system: the tokens from `docs/design/DESIGN.md` §2 and the
components named in §4. React and CSS Modules only; no Tailwind, no component
library. It imports no other workspace package.

## Using it

```tsx
import '@pokernext/ui/fonts.css'; // once, in the app root, before the tokens
import '@pokernext/ui/tokens.css'; // once, in the app root
import '@pokernext/ui/base.css'; // once, after the tokens
import {Button, StatusDot} from '@pokernext/ui';
```

- `fonts.css` self-hosts the DESIGN.md §2.2 typefaces: it registers
  "Noto Sans TC" (400, 500, 600, 700) and "Noto Serif TC" (700) from the
  `@fontsource/noto-sans-tc` and `@fontsource/noto-serif-tc` packages, the
  first families of `--pn-font-sans` and `--pn-font-serif`. The bundler emits
  the font files with the app, so no page loads fonts from an external host.
  Each weight is split into `unicode-range` subsets and a browser downloads
  only the subsets its text needs. Add a weight here only when a type token or
  component starts using it. The Noto fonts are licensed under the SIL Open
  Font License 1.1 (see each package's `LICENSE`), which allows bundling and
  redistributing them with the app.
- `tokens.css` defines every token as a `--pn-*` custom property. Type tokens
  are split into `--pn-type-<name>-family`, `-size`, `-line` and `-weight`.
- `base.css` styles the document `body` (background, text colour, body type)
  from the tokens. apps/web's root layout and the kitchen-sink both import it,
  so neither keeps its own copy.
- `index.ts` exports each component and its props type by name.
- Components that use React hooks start with `'use client'`, so Next.js server
  components can import `@pokernext/ui`. Components that take an event handler
  (such as `Sidebar`'s `onSignOut`) must be rendered from a client component
  when the handler is set.
- Component styles use `var(--pn-*)` only. A Vitest test fails on any literal
  colour, font family or size, spacing or radius in `lib/**/*.module.css`; if a
  value is missing, add a token to DESIGN.md §2 and `tokens.css` first.

## Why `index.ts` lists every component

`packages/README.md` says "No barrels": expose several small entry points rather
than one `index.ts` that re-exports a whole subtree. `@pokernext/ui` is the one
deliberate exception, for these reasons:

- The foundation spec (story 1) and tickets 00a–00c require every DESIGN.md §4
  component to be importable from the package root:
  `import {Button, DataTable, StatusDot} from '@pokernext/ui'`. DESIGN.md names
  are the contract, so the root is the catalogue.
- The components are one vocabulary used together on every screen; per component
  entry points (`@pokernext/ui/button`) would only lengthen imports without
  hiding anything.
- It stays a narrow interface, not a funnel: each component and props type is
  re-exported by name (no `export *`), private helpers such as `class_names.ts`,
  `roving_focus.ts` and `container_states.tsx` are not exported, and `lib/`
  stays unimportable from outside the package (dependency-cruiser).

Stylesheets are separate entries (`fonts.css`, `tokens.css`, `base.css`)
because they are side-effect imports, not components.

## Layout

```text
index.ts          public entry: named exports of every component
fonts.css         public entry: self-hosted Noto Sans TC and Noto Serif TC
tokens.css        public entry: design tokens
base.css          public entry: document body styles from the tokens
lib/              components, one snake_case .tsx + .module.css each
kitchen_sink/     dev-only catalogue page (never imported by index.ts)
tests/            Vitest *.test.ts and Playwright *.spec.ts
playwright.config.ts
```

## Kitchen-sink

A dev-only page that shows every token and every component variant and state. It
is served by Vite's JS API and is structurally excluded from production: nothing
outside `kitchen_sink/` may import it (dependency-cruiser rule
`kitchen-sink-is-dev-only`).

```sh
pnpm --filter @pokernext/ui kitchen-sink          # http://127.0.0.1:5173/
KITCHEN_SINK_PORT=5199 pnpm --filter @pokernext/ui kitchen-sink
```

Pages are addressed by query. `/` lists every registered page.

| Page | Shows |
| --- | --- |
| `/?page=base` | Tokens and base components (00a). |
| `/?page=overview` | 總覽頁 in the venue workspace shell (00b). |
| `/?page=operation` | 作業頁 in the venue workspace shell (00b). |
| `/?page=case` | 案件頁 in the venue workspace shell (00b). |
| `/?page=player-home&state=ready\|empty` | The DESIGN.md §3.1 player home at phone width (00c). |
| `/?page=desktop-states` | Loading, empty, error and ready of every desktop data container (00b). |

`overview` and `case` also take `&state=loading|empty|error` to switch their
data containers. Demo data for these pages lives in
`kitchen_sink/fixtures/partner_workspace.ts`, never in `lib/`.

Components carry no catalogue-only props or styles. The base page shows Button
hover and focus-visible as plain buttons; its screenshot spec forces the real
`:hover` and `:focus-visible` states on the buttons in those columns through the
Chrome DevTools Protocol (`CSS.forcePseudoState`), so open the page in a browser
and they look like default buttons.

## Tests

| Command | What it does |
| --- | --- |
| `pnpm test:unit` (root) | Token contrast, no-literal-value and player copy checks. |
| `pnpm --filter @pokernext/ui test:e2e` | Screenshot comparison and keyboard focus; fails on a diff. |
| `pnpm --filter @pokernext/ui test:e2e:update` | Rewrites the screenshot baselines. |

Playwright starts the kitchen-sink itself on `KITCHEN_SINK_PORT` (default 5173)
and never reuses a server that is already running, so set a free port when
another worktree is testing at the same time. Every spec runs in two projects:
`desktop` (1440×1024) and `mobile` (390×844). Desktop-workspace specs skip the
mobile project and set 1280 or 1024 widths per test; their layout and keyboard
checks are in `desktop_workspace_layout.spec.ts` and
`desktop_workspace_keyboard.spec.ts`.

Baselines live in
`tests/screenshots/<spec file>/<name>-<project>-<platform>.png` and are
committed. A test fails when more than 200 pixels (or 1% of the image, whichever
is smaller) differ by more than the per-pixel threshold. Fonts differ per
operating system, so each platform keeps its own baselines. Baselines exist for
`win32` only (`SCREENSHOT_BASELINE_PLATFORMS` in `tests/kitchen_sink.ts`). On
any other OS the screenshot specs skip with that reason, so `pnpm test` stays
green there while the keyboard, layout and accessibility specs still run; CI
compares screenshots in its Windows job. To add an OS, list it there and run
`test:e2e:update` on it.

The Windows baselines also assume the zh-TW regional format: Chromium on
Windows formats native date fields (`DateInput`) with the OS short-date
format, not the Playwright `locale`, so an en-US machine shows `09/14/2026`
where the baseline has `2026/09/14` and the base page fails. Set Windows
「地區格式」 to 中文（台灣）, or run `Set-Culture zh-TW` in PowerShell and open a
new terminal; the CI Windows job does the latter.

Updating baselines is always explicit: run `test:e2e:update`, look at every
changed PNG in the diff, and commit them with the change that caused them.

## Adding a page in a later UI ticket

1. Create `kitchen_sink/pages/<name>_page.tsx` exporting a component that takes
   `KitchenSinkPageProps`; read variants from `params`, for example
   `params.get('state')` for `?page=player-home&state=empty`. Use the catalogue
   pieces in `kitchen_sink/layout.tsx` if they fit.
2. Append `{id, title, component}` to `KITCHEN_SINK_PAGES` in
   `kitchen_sink/page_registry.ts`. Add `fullBleed: true` when the page brings
   its own app frame (such as `WorkspaceShell`) and must not get the catalogue
   padding and `<main>` wrapper.
3. Add `tests/kitchen_sink_<name>.spec.ts`: open the page with
   `openKitchenSinkPage(page, '<id>', {state: 'empty'})` from
   `tests/kitchen_sink.ts` and call `toHaveScreenshot('<name>.png')`; call
   `skipScreenshotsWithoutBaselines()` at the top of the spec. For extra widths
   (1280, 1024), call `page.setViewportSize()` before the screenshot and give
   each width its own name, and skip the project that does not apply with
   `test.skip()`.
4. Run `test:e2e:update`, check the new PNGs, commit them.
