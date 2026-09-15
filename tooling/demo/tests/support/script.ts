/**
 * @fileoverview The `demo:script` test API. Steps share one page for the
 * whole run (`scriptPage`), so the recording is one continuous video of the
 * journey across workspaces; when the project's `video` option is on, the
 * video is saved to `tooling/demo/recordings/<DEMO_BATCH>.webm` (RUNBOOK
 * 「每批固定收尾」). Playwright's own per-test videos would be one file per
 * step, and its bundled ffmpeg cannot join WebM files.
 */

import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

import {test as base, expect, type Page} from '@playwright/test';
import type {Workspace} from '@pokernext/domain';

import {demoOrigins, roleSwitchUrl} from '../../demo_server';

/** Recording name when `DEMO_BATCH` is not set. */
const DEFAULT_BATCH = 'latest';
const RECORDINGS_DIR = fileURLToPath(
  new URL('../../recordings/', import.meta.url),
);
const DESKTOP = {width: 1440, height: 1024};
const MOBILE = {width: 390, height: 844};

/** Worker-scoped fixtures of the script. */
interface ScriptFixtures {
  /** The page every step drives; recorded when `video` is on. */
  scriptPage: Page;
}

/** Returns where this run's recording goes, from `DEMO_BATCH`. */
export function recordingPath(env: NodeJS.ProcessEnv = process.env): string {
  const batch = env.DEMO_BATCH || DEFAULT_BATCH;
  if (!/^[\w.-]+$/.test(batch)) {
    throw new Error(
      `DEMO_BATCH may use only letters, digits, ".", "_" and "-": ${batch}`,
    );
  }
  return `${RECORDINGS_DIR}${batch}.webm`;
}

/** `test` with the shared, recorded `scriptPage`. */
export const test = base.extend<object, ScriptFixtures>({
  scriptPage: [
    async ({browser}, use, workerInfo) => {
      const videoOption = workerInfo.project.use.video;
      const videoMode =
        typeof videoOption === 'object' ? videoOption.mode : videoOption;
      const recording = videoMode !== undefined && videoMode !== 'off';
      const context = await browser.newContext({
        colorScheme: workerInfo.project.use.colorScheme,
        locale: workerInfo.project.use.locale,
        timezoneId: workerInfo.project.use.timezoneId,
        viewport: DESKTOP,
        recordVideo: recording
          ? {dir: workerInfo.project.outputDir, size: DESKTOP}
          : undefined,
      });
      const page = await context.newPage();
      await use(page);
      await context.close();
      const video = page.video();
      if (video !== null) {
        const path = recordingPath();
        mkdirSync(dirname(path), {recursive: true});
        await video.saveAs(path);
        console.log(`[script] Recording: ${path}`);
      }
    },
    {scope: 'worker'},
  ],
});

export {expect};

/**
 * Signs in as the workspace's demo account through the development role
 * switch and waits on its home, at the width of its surface (player and
 * staff on a phone, the rest on a desktop).
 */
export async function openWorkspace(
  page: Page,
  workspace: Workspace,
): Promise<void> {
  const host = workspace === 'player' ? 'player' : 'work';
  await page.setViewportSize(
    workspace === 'player' || workspace === 'staff' ? MOBILE : DESKTOP,
  );
  await page.goto(roleSwitchUrl(host, {workspace}));
  await expect(page).toHaveURL(`${demoOrigins()[host]}/${workspace}`);
}
