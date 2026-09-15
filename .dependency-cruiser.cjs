// @ts-check
// Deep-module and layering enforcement for dependency-cruiser.
//
// Each package (one immediate child of apps/, packages/ or tooling/) is a DEEP
// MODULE: a lot of behaviour behind a small interface. A package's PUBLIC
// SURFACE is its ENTRY POINTS: the files at the package root. Implementation
// lives in SUBFOLDERS and is private (by convention `lib/` for implementation
// and `tests/` for tests, though any subfolder is private). A package may
// expose several small entry points (index.ts, testing.ts, demo.ts, …); prefer
// that over one giant barrel index.
//
// The layering section below encodes ADR-0001:
//   apps/web → packages/app → packages/domain, packages/db, packages/ports
// See packages/README.md.

/** Where packages live. Packages are flat: one tier under each root. */
const PACKAGE_ROOTS = '(?:apps|packages|tooling)';

// --- derived patterns (no need to edit) -------------------------------------
/** A package directory, e.g. `packages/domain`. */
const PKG = `${PACKAGE_ROOTS}/[^/]+`;
/**
 * A package's private internals: anything nested inside a package subfolder.
 * The package's root files are its entry points and are NOT matched here:
 * they stay importable from outside.
 */
const PACKAGE_INTERNALS = `^${PKG}/[^/]+/`;
/** Test code: files in a package's tests/ folder. */
const TEST_CODE = `^${PKG}/tests/`;
/**
 * The test wiring behind `@pokernext/app/testing`: the entry point and its
 * `lib/testing/` implementation. It builds test apps from fakes, so it may
 * import other packages' test-only entry points; only test code may import it.
 */
const APP_TEST_WIRING = '^packages/app/(testing\\.ts$|lib/testing/)';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // --- Deep modules -------------------------------------------------------
    {
      name: 'entrypoint-boundary-from-app',
      comment:
        "Code outside every package may import a package's entry points (its root files), but nothing inside its subfolders.",
      severity: 'error',
      from: {pathNot: `^${PKG}/`}, // importer is NOT inside any package
      to: {path: PACKAGE_INTERNALS},
    },
    {
      name: 'entrypoint-boundary-across-packages',
      comment:
        "A package's own files import each other freely, but may reach OTHER packages only through their entry points, never their internals.",
      severity: 'error',
      // importer is inside a package ($1), but is not a test file
      from: {path: `^(${PKG})/`, pathNot: TEST_CODE},
      to: {
        path: PACKAGE_INTERNALS,
        pathNot: '^$1/', // same package → intra-package freedom
      },
    },
    {
      name: 'tests-through-entrypoints',
      comment:
        "A package's tests exercise it through its entry points like everyone else: they may import any package's entry points and their own tests/ fixtures, but never any package's internals, not even their own.",
      severity: 'error',
      from: {path: `^(${PKG})/tests/`}, // a test file, in package $1
      to: {
        path: PACKAGE_INTERNALS,
        pathNot: '^$1/tests/', // own tests/ fixtures → allowed
      },
    },
    {
      name: 'tests-folder-is-private',
      comment:
        "A package's tests/ folder is reachable only from tests: nothing else may import fixtures.",
      severity: 'error',
      from: {pathNot: TEST_CODE}, // importer is not itself a test
      to: {path: TEST_CODE},
    },
    {
      name: 'no-circular',
      comment: 'No dependency cycles.',
      severity: 'error',
      from: {},
      to: {circular: true},
    },

    // --- Layering (ADR-0001) ------------------------------------------------
    {
      name: 'web-reaches-rules-through-app',
      comment:
        'apps/web only resolves sessions and renders projections: it reaches domain, db and ports through packages/app use-cases, never directly.',
      severity: 'error',
      from: {path: '^apps/web/'},
      to: {path: '^packages/(domain|db|ports)/'},
    },
    {
      name: 'web-no-fake-ports',
      comment:
        'apps/web must never import the fake ports in packages/ports/testing.ts.',
      severity: 'error',
      from: {path: '^apps/web/'},
      to: {path: '^packages/ports/testing\\.ts$'},
    },
    {
      name: 'fake-ports-only-in-tests',
      comment:
        'packages/ports/testing.ts (fakes and failure injection) may be imported only from test code and the @pokernext/app/testing wiring, so fakes never ship.',
      severity: 'error',
      from: {pathNot: [TEST_CODE, APP_TEST_WIRING]},
      to: {path: '^packages/ports/testing\\.ts$'},
    },
    {
      name: 'app-testing-only-in-tests',
      comment:
        'packages/app/testing.ts (test app, legal-operation builder, concurrency tool) may be imported only from test code, so test wiring never ships.',
      severity: 'error',
      from: {pathNot: TEST_CODE},
      to: {path: '^packages/app/testing\\.ts$'},
    },
    {
      name: 'db-testing-only-in-tests',
      comment:
        'packages/db/testing.ts (template and cloned test databases) may be imported only from test code and the @pokernext/app/testing wiring.',
      severity: 'error',
      from: {pathNot: [TEST_CODE, APP_TEST_WIRING]},
      to: {path: '^packages/db/testing\\.ts$'},
    },
    {
      name: 'testing-internals-behind-testing-entry',
      comment:
        "A package's lib/testing/ implementation is reachable only through that package's testing.ts, never from its production files.",
      severity: 'error',
      // importer is in package $1 but is neither testing.ts nor lib/testing/
      from: {path: '^(packages/[^/]+)/(?!testing\\.ts$|lib/testing/)'},
      to: {path: '^$1/lib/testing/'},
    },
    {
      name: 'embedded-postgres-not-in-production',
      comment:
        'Only packages/db/lib/local_cluster.ts may load embedded-postgres, and only tooling, test code and the db test databases may reach it, so the local cluster never ships.',
      severity: 'error',
      from: {
        pathNot: [
          TEST_CODE,
          '^tooling/',
          '^packages/db/(local_cluster\\.ts|lib/test_databases\\.ts)$',
        ],
      },
      to: {path: '^packages/db/(lib/)?local_cluster\\.ts$'},
    },
    {
      name: 'demo-entry-only-from-tooling-demo',
      comment:
        'packages/app/demo.ts (demo account creation) may be imported only from tooling/demo, so it never reaches a production build.',
      severity: 'error',
      from: {pathNot: '^tooling/demo/'},
      to: {path: '^packages/app/demo\\.ts$'},
    },
    {
      name: 'app-no-upward-deps',
      comment:
        'packages/app sits below apps/web: it may not import apps, tooling or packages/ui.',
      severity: 'error',
      from: {path: '^packages/app/'},
      to: {path: '^(apps|tooling)/|^packages/ui/'},
    },
    {
      name: 'lower-layer-no-upward-deps',
      comment:
        'packages/domain, packages/db and packages/ports are the bottom layer: they may not import packages/app, packages/ui, apps or tooling.',
      severity: 'error',
      from: {path: '^packages/(domain|db|ports)/'},
      to: {path: '^(apps|tooling)/|^packages/(app|ui)/'},
    },
    {
      name: 'domain-is-pure',
      comment:
        'packages/domain is framework-free: no db, no ports, no React, Next or database libraries (ADR-0001).',
      severity: 'error',
      from: {path: '^packages/domain/'},
      to: {
        path: [
          '^packages/(db|ports)/',
          'node_modules/(react|react-dom|next|drizzle-orm|drizzle-kit|pg|postgres|embedded-postgres)/',
        ],
      },
    },
    {
      name: 'ui-is-independent',
      comment:
        'packages/ui is a standalone design system: it may not import any other workspace package.',
      severity: 'error',
      from: {path: '^packages/ui/'},
      to: {path: '^(apps|tooling)/|^packages/(?!ui/)[^/]+/'},
    },
    {
      name: 'nothing-imports-apps-or-tooling',
      comment:
        'apps/* and tooling/* are leaves: no other package may import them.',
      severity: 'error',
      from: {path: '^(apps|tooling|packages)/([^/]+)/'},
      to: {path: '^(apps|tooling)/', pathNot: '^$1/$2/'},
    },

    // --- Hygiene --------------------------------------------------------------
    {
      name: 'not-to-unresolvable',
      comment:
        'Every import must resolve; an unresolvable import usually means a dependency missing from package.json.',
      severity: 'error',
      from: {},
      to: {couldNotResolve: true},
    },
    {
      name: 'no-non-package-json',
      comment:
        "Every npm import must be declared in the importing package's package.json (or the workspace root's).",
      severity: 'error',
      from: {},
      to: {dependencyTypes: ['npm-no-pkg', 'npm-unknown']},
    },
  ],
  options: {
    // Shared dev tooling (vitest, …) is declared once in the workspace root.
    combinedDependencies: true,
    doNotFollow: {path: 'node_modules'},
    tsPreCompilationDeps: true,
    tsConfig: {fileName: 'tsconfig.json'},
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
  },
};
