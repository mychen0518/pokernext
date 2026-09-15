/**
 * @fileoverview 建置測試：以 Turbopack 與 webpack 各做一次 `next build`，兩份產物都
 * 不含角色切換列、它的切換路由、開發用的帳號清單，也不含 demo 帳號建立程式
 * （ADR-0001：切換列在 production build 中以建置期條件整段移除，不依賴某一個
 * bundler）。各自以獨立的 distDir 建置，不影響 `next dev`。原始碼只以文字讀取，確認
 * 標記字串仍存在，避免標記改名後測試變成永遠通過。
 */

import {execFile} from 'node:child_process';
import {readdirSync, readFileSync, rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {beforeAll, describe, expect, it} from 'vitest';

const WEB_ROOT = fileURLToPath(new URL('../', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const BUILD_TIMEOUT_MILLISECONDS = 600_000;

/** Strings that exist only in the development tools and the demo seed. */
const MARKERS = {
  // `ROLE_SWITCHER_MARKER` in the switcher's client component.
  roleSwitcher: {
    text: 'pn-dev-role-switcher',
    source: 'apps/web/dev_tools/role_switcher_drawer.tsx',
  },
  // The path of the development-only switch route.
  roleSwitchRoute: {
    text: 'dev/role-switch',
    source: 'apps/web/dev_tools/role_switcher.tsx',
  },
  // The refusal message of `@pokernext/app/dev`'s account listing.
  devAccountListing: {
    text: 'pn-dev-account-listing',
    source: 'packages/app/lib/role_switcher_accounts.ts',
  },
  // The fixed id prefix of the seeded demo accounts.
  demoAccounts: {
    text: '5e3d0000-de30-4000',
    source: 'packages/app/lib/demo_accounts.ts',
  },
} as const;

/** The bundlers `next build` can use, and the flag that selects each. */
const BUNDLERS = [
  {name: 'Turbopack', flags: []},
  {name: 'webpack', flags: ['--webpack']},
] as const;

/**
 * Lists every regular file under a directory, skipping Next's build cache and
 * the links Next creates to external packages such as `pg`.
 */
function listFiles(directory: string): string[] {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'cache' ? [] : listFiles(path);
    }
    return entry.isFile() ? [path] : [];
  });
}

/** Returns the build output files, relative to apps/web, containing the text. */
function filesContaining(files: readonly string[], text: string): string[] {
  return files
    .filter(file => readFileSync(file, 'utf8').includes(text))
    .map(file => relative(WEB_ROOT, file));
}

/** Builds apps/web for production into its own dist dir; lists the output. */
async function buildForProduction(
  bundler: (typeof BUNDLERS)[number],
): Promise<string[]> {
  const distDir = `.next/production-build-test-${bundler.name.toLowerCase()}`;
  const output = join(WEB_ROOT, distDir);
  rmSync(output, {recursive: true, force: true});
  const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next');
  await promisify(execFile)(
    process.execPath,
    [nextBin, 'build', ...bundler.flags],
    {
      cwd: WEB_ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_DIST_DIR: distDir,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      maxBuffer: 64 * 1024 * 1024,
      timeout: BUILD_TIMEOUT_MILLISECONDS,
    },
  );
  return listFiles(output);
}

it('標記字串仍在開發工具、開發用帳號清單與 demo 帳號的原始碼裡', () => {
  for (const {text, source} of Object.values(MARKERS)) {
    expect(readFileSync(join(REPO_ROOT, source), 'utf8')).toContain(text);
  }
});

for (const bundler of BUNDLERS) {
  describe(`以 ${bundler.name} 建置的正式產物不含開發工具與 demo 帳號`, () => {
    let outputFiles: string[] = [];

    beforeAll(async () => {
      outputFiles = await buildForProduction(bundler);
    }, BUILD_TIMEOUT_MILLISECONDS);

    it('產物裡有工作區空殼的文案，證明檢查的是真的建置結果', () => {
      expect(
        filesContaining(outputFiles, '本工作區的功能尚未上線'),
      ).not.toEqual([]);
    });

    it('產物不含角色切換列', () => {
      expect(filesContaining(outputFiles, MARKERS.roleSwitcher.text)).toEqual(
        [],
      );
    });

    it('產物沒有開發用的角色切換路由', () => {
      expect(
        filesContaining(outputFiles, MARKERS.roleSwitchRoute.text),
      ).toEqual([]);
    });

    it('產物不含列出所有帳號的開發用清單', () => {
      expect(
        filesContaining(outputFiles, MARKERS.devAccountListing.text),
      ).toEqual([]);
    });

    it('產物不含 demo 帳號建立程式', () => {
      expect(filesContaining(outputFiles, MARKERS.demoAccounts.text)).toEqual(
        [],
      );
    });
  });
}
