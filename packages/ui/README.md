# @pokernext/ui

The POKERNEXT design system: the tokens from `docs/design/DESIGN.md` §2 and
the components named in §4. React and CSS Modules only; no Tailwind, no
component library. It imports no other workspace package.

## Using it

```tsx
import '@pokernext/ui/tokens.css'; // once, in the app root
import {Button, StatusDot} from '@pokernext/ui';
```

- `tokens.css` defines every token as a `--pn-*` custom property. Type tokens
  are split into `--pn-type-<name>-family`, `-size`, `-line` and `-weight`.
- `index.ts` exports each component and its props type by name.
- Component styles use `var(--pn-*)` only. A Vitest test fails on any literal
  colour, font family or size, spacing or radius in `lib/**/*.module.css`; if
  a value is missing, add a token to DESIGN.md §2 and `tokens.css` first.

## Layout

```text
index.ts          public entry: named exports of every component
tokens.css        public entry: design tokens
lib/              components, one snake_case .tsx + .module.css each
kitchen_sink/     dev-only catalogue page (never imported by index.ts)
tests/            Vitest *.test.ts and Playwright *.spec.ts
playwright.config.ts
```

## Kitchen-sink

A dev-only page that shows every token and every component variant and
state. It is served by Vite's JS API and is structurally excluded from
production: nothing outside `kitchen_sink/` may import it
(dependency-cruiser rule `kitchen-sink-is-dev-only`).

```sh
pnpm --filter @pokernext/ui kitchen-sink          # http://127.0.0.1:5173/
KITCHEN_SINK_PORT=5199 pnpm --filter @pokernext/ui kitchen-sink
```

Pages are addressed by query: `/?page=base` (tokens and base components),
`/?page=player-home&state=ready|empty` (the DESIGN.md §3.1 player home at
phone width). `/` lists every registered page.

Button hover and focus-visible are pinned for screenshots with
`data-state="hover"` or `data-state="focus-visible"` on the `Button`.

## Tests

| Command | What it does |
| --- | --- |
| `pnpm test:unit` (root) | Token contrast, no-literal-value and player copy checks. |
| `pnpm --filter @pokernext/ui test:e2e` | Screenshot comparison and keyboard focus; fails on a diff. |
| `pnpm --filter @pokernext/ui test:e2e:update` | Rewrites the screenshot baselines. |

Playwright starts the kitchen-sink itself on `KITCHEN_SINK_PORT` (default
5173) and never reuses a server that is already running, so set a free port
when another worktree is testing at the same time. Every spec runs in two
projects: `desktop` (1440×1024) and `mobile` (390×844).

Baselines live in `tests/screenshots/<spec file>/<name>-<project>-<platform>.png`
and are committed. A test fails when more than 200 pixels (or 1% of the
image, whichever is smaller) differ by more than the per-pixel threshold.
Fonts differ per operating system, so each platform keeps its own baselines.

Updating baselines is always explicit: run `test:e2e:update`, look at every
changed PNG in the diff, and commit them with the change that caused them.

## Adding a page in a later UI ticket

1. Create `kitchen_sink/pages/<name>_page.tsx` exporting a component that
   takes `KitchenSinkPageProps`; read variants from `params`, for example
   `params.get('state')` for `?page=player-home&state=empty`. Use the
   catalogue pieces in `kitchen_sink/layout.tsx` if they fit.
2. Append `{id, title, component}` to `KITCHEN_SINK_PAGES` in
   `kitchen_sink/page_registry.ts`.
3. Add `tests/kitchen_sink_<name>.spec.ts`: open the page with
   `openKitchenSinkPage(page, '<id>', {state: 'empty'})` from
   `tests/kitchen_sink.ts` and call `toHaveScreenshot('<name>.png')`. For
   extra widths (1280, 1024), call `page.setViewportSize()` before the
   screenshot and give each width its own name, and skip the project that
   does not apply with `test.skip()`.
4. Run `test:e2e:update`, check the new PNGs, commit them.
