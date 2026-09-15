# Packages are deep modules

Every package in `apps/`, `packages/` and `tooling/` hides a lot of behaviour
behind a small interface. dependency-cruiser enforces the rules below;
`.dependency-cruiser.cjs` is the source of truth.

## Layout

Start a package in this shape (`packages/ports/` is a small working
example):

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
- `packages/ports/testing.ts` (fakes) is imported only from `tests/` folders
  and the `@pokernext/app/testing` wiring, never from `apps/web`.
- `packages/app/testing.ts` (test app, legal-operation builder, concurrency
  tool) is imported only from `tests/` folders; `packages/db/testing.ts`
  (cloned test databases) only from `tests/` folders and that wiring.
- A package's `lib/testing/` is reachable only through its own `testing.ts`.
- `packages/db/local_cluster.ts` (embedded Postgres) is imported only from
  `tooling/` and tests, so production code never loads embedded-postgres.
- `packages/app/demo.ts` (demo account creation) is imported only from
  `tooling/demo`; tests reach the same implementation through
  `@pokernext/app/testing` (`given(app).demoAccount(…)`,
  `ensureDemoAccountsInDatabase`).
- `packages/app/dev.ts` (every account, no actor, for the role switcher) is
  imported only from `apps/web/dev_tools/role_switcher.tsx` and tests, never
  from the production stub; its implementation
  `lib/role_switcher_accounts.ts` only through `dev.ts`, and the
  unauthorized `lib/account_listing.ts` only from that implementation and the
  demo account implementation.
- `apps/web/dev_tools/` (the role switcher) is reached only through the
  `#role_switcher` import and `app/dev/**/route.dev.ts`; `next.config.ts`
  removes both outside `next dev`, and
  `apps/web/tests/production_build.test.ts` checks the build output.
- Nothing imports `apps/*` or `tooling/*`.

## Checking

```sh
pnpm lint:boundaries   # dependency-cruiser only
pnpm check             # typecheck + lint + boundaries + tests
```

The pre-commit hook runs typecheck, `gts lint` and `lint:boundaries`.
