/**
 * @fileoverview 建置測試：`next build` 的產物不含角色切換列、它的切換路由，也不含
 * demo 帳號建立程式（ADR-0001：切換列在 production build 中以建置期條件整段移除）。
 * 以獨立的 distDir 建置，不影響 `next dev`。原始碼只以文字讀取，確認標記字串仍存在，
 * 避免標記改名後測試變成永遠通過。
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
const DIST_DIR = '.next/production-build-test';
const BUILD_TIMEOUT_MILLISECONDS = 600_000;

/** Strings that exist only in the development tools. */
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
  // The fixed id prefix of the seeded demo accounts.
  demoAccounts: {
    text: '5e3d0000-de30-4000',
    source: 'packages/app/lib/demo_accounts.ts',
  },
} as const;

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

describe('production build', () => {
  let outputFiles: string[] = [];

  beforeAll(async () => {
    const output = join(WEB_ROOT, DIST_DIR);
    rmSync(output, {recursive: true, force: true});
    const nextBin = createRequire(import.meta.url).resolve(
      'next/dist/bin/next',
    );
    await promisify(execFile)(process.execPath, [nextBin, 'build'], {
      cwd: WEB_ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_DIST_DIR: DIST_DIR,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      maxBuffer: 64 * 1024 * 1024,
      timeout: BUILD_TIMEOUT_MILLISECONDS,
    });
    outputFiles = listFiles(output);
  }, BUILD_TIMEOUT_MILLISECONDS);

  it('標記字串仍在開發工具與 demo 帳號的原始碼裡，且產物裡有工作區空殼的文案', () => {
    for (const {text, source} of Object.values(MARKERS)) {
      expect(readFileSync(join(REPO_ROOT, source), 'utf8')).toContain(text);
    }
    expect(filesContaining(outputFiles, '本工作區的功能尚未上線')).not.toEqual(
      [],
    );
  });

  it('產物不含角色切換列', () => {
    expect(filesContaining(outputFiles, MARKERS.roleSwitcher.text)).toEqual([]);
  });

  it('產物沒有開發用的角色切換路由', () => {
    expect(filesContaining(outputFiles, MARKERS.roleSwitchRoute.text)).toEqual(
      [],
    );
  });

  it('產物不含 demo 帳號建立程式', () => {
    expect(filesContaining(outputFiles, MARKERS.demoAccounts.text)).toEqual([]);
  });
});
