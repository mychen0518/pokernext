# Packages are deep modules

Every package in `apps/`, `packages/` and `tooling/` hides a lot of behaviour
behind a small interface. dependency-cruiser enforces the rules below;
`.dependency-cruiser.cjs` is the source of truth.

## Layout

Copy `packages/example/` to start a package:

```text
packages/<name>/
  package.json    exports map lists the entry points
  index.ts        entry point (public): import this from outside
  testing.ts      another entry point: a package may expose several
  lib/            implementation: private, files import each other freely
  tests/          tests and fixtures: private, go through the entry points
```

File names are `snake_case`, exports are named only (`pnpm lint` checks both).

## Rules

**Import only through entry points.** Code outside a package may import only
its root files (`@pokernext/ports`, `@pokernext/ports/testing`), never anything
in a subfolder. Any subfolder is private, not just `lib/`.

**Intra-package freedom.** A package's own files import each other freely.

**Tests go through entry points.** Files in `<pkg>/tests/` may import any
package's entry points and their own `tests/` fixtures, never internals, not
even their own package's `lib/`.

**No cycles.** No dependency cycles anywhere.

**No barrels.** Do not funnel a whole subtree through one `index.ts` that
re-exports everything. Expose several small entry points instead and keep the
rest in `lib/`.

## Layering (ADR-0001)

`apps/web` → `packages/app` → `packages/domain`, `packages/db`,
`packages/ports`.

- `apps/web` imports `packages/app` and `packages/ui` only.
- `packages/domain` imports no other workspace package and no React, Next or
  database library.
- `packages/ui` imports no other workspace package.
- `packages/ui/kitchen_sink/` (dev-only component catalogue) is imported only
  from inside itself, never from `packages/ui`'s entry points or `lib/`.
- `packages/ports/testing.ts` (fakes) is imported only from `tests/` folders,
  never from `apps/web`.
- `packages/app/demo.ts` is imported only from `tooling/demo`.
- Nothing imports `apps/*` or `tooling/*`.

## Checking

```sh
pnpm lint:boundaries   # dependency-cruiser only
pnpm check             # typecheck + lint + boundaries + tests
```

The pre-commit hook runs typecheck, `gts lint` and `lint:boundaries`.
