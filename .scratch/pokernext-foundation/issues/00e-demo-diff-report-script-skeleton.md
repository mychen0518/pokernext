# 00e: `demo:diff` 報告與 13 步劇本骨架

**What to build:** 維護者執行 `pnpm demo:diff`，工具依一張「正式頁 → 原型 hash route」對照表，對兩邊在 1440×1024 與 390×844 截圖，產出一份可在瀏覽器打開的並排報告，標出哪些頁與原型差異最大。執行 `pnpm demo:script`，Playwright 依原型「示範劇本：Alex 的濟州行程」的 13 步跨工作區操作並錄影；尚無對應票的步驟先標為 fixme，隨各批次解除。

**Blocked by:** 00d

**Status:** ready-for-agent

- [x] 對照表初始涵蓋 00d 的六個工作區空殼，對應原型六個角色的首頁；新增一列即納入報告，不需改工具程式
- [x] `demo:diff` 在 demo 未啟動時自行啟動，已啟動時沿用；原型頁先清除其瀏覽器儲存的狀態再截圖，所以每次截圖可重現
- [x] 報告每頁並排顯示正式頁、原型頁與差異圖，列出差異比例並由大到小排序
- [x] `demo:script` 有 13 個測試，名稱是原型劇本的步驟名稱（業務句子），每個測試註明對應的票號
- [x] 目前 13 個測試全部標為 fixme，執行時整體為綠；解除某一步只需移除 fixme 標記並補上步驟內容，不需改工具設定
- [x] `demo:script` 執行時錄影，影片存到 RUNBOOK「每批固定收尾」規定的位置
- [x] RUNBOOK 的「每批固定收尾」說明如何新增對照表列與解除劇本步驟

## Comments

### 2026-09-15 implementer

**Commands:**

```sh
pnpm demo:diff                          # report: tooling/demo/reports/diff/index.html
DEMO_BATCH=batch-b pnpm demo:script     # recording: tooling/demo/recordings/batch-b.webm
pnpm typecheck && pnpm lint && pnpm lint:boundaries
pnpm test:unit                          # 21 files, 110 tests (14 new in tooling/demo)
pnpm --filter @pokernext/web test:e2e   # 11 passed, 3 skipped
pnpm --filter @pokernext/ui test:e2e    # 35 passed, 27 skipped
```

Both commands honour `DEMO_PORT`, `POKERNEXT_PLAYER_HOST` and
`POKERNEXT_WORK_HOST` like `pnpm demo`.

**Runs on this worktree:**

- `pnpm demo:diff` with no demo running: printed `Demo not running;
  starting pnpm demo…`, captured six pages, stopped the demo (ports 3000 and
  55433 free afterwards), 29 s.
- `pnpm demo:diff` with `pnpm demo` already running: printed `Reusing the
  demo already running at http://work.localhost:3000.`, same six ratios,
  10 s; `/api/health` still answered 200 afterwards.
- `pnpm demo:script` with no demo running: started and stopped the demo,
  `13 skipped`, exit 0, no recording (no step ran).
- Recording check: with step 1 temporarily changed to `test(` and
  `DEMO_BATCH=check-00e`, the run printed `1 passed, 12 skipped` and
  `Recording: …/tooling/demo/recordings/check-00e.webm` (1440×1024 VP8,
  1.4 s, last frame shows the player shell). Reverted and the file deleted.

**Observed diff ratios** (six shells vs prototype home pages, reproducible
across runs):

| Page | Viewport | Prototype route | Diff |
| --- | --- | --- | --- |
| `player_home` | 390×844 | `#/player/home` | 47.4% |
| `venue_home` | 1440×1024 | `#/venue/overview` | 47.3% |
| `admin_home` | 1440×1024 | `#/admin/dashboard` | 43.3% |
| `staff_home` | 390×844 | `#/staff/tasks` | 13.5% |
| `agent_home` | 1440×1024 | `#/agent/customers` | 6.4% |
| `platform_home` | 1440×1024 | `#/platform/governance` | 3.7% |

The top three are large mainly because the prototype pages are taller
(1304, 1825, 1709 px) than the empty shells and the extra height counts as
difference. Same-height pages score low because pixelmatch's 0.1 threshold
treats the dark backgrounds as equal; compare the diff images, not only the
number. Screenshot of the report: `.scratch/pokernext-foundation/screenshots/00e/report.png`.

**Step → ticket table** (`tooling/demo/tests/demo_script.spec.ts`,
`annotation: {type: 'ticket'}`):

| # | Step | Tickets |
| --- | --- | --- |
| 1 | 玩家確認行程新版本 v2 | 15, 17 |
| 2 | 接待 Amy 回報「接機接到本人」（T05） | 20, 22 |
| 3 | 琪琪掃碼、本人核對、確認到場 | 19 |
| 4 | 琪琪收到 KRW 300,000 押金 | 27 |
| 5 | 玩家確認「我已支付」 | 27 |
| 6 | Amy 回報酒店已入住（T06）→ 在島玩家 | 20, 22, 30 |
| 7 | 玩家申請續住 1 晚 | 21 |
| 8 | 琪琪開始執行並回報續住結果 | 21 |
| 9 | 管理者核對續住結果並正式登錄 | 16, 21 |
| 10 | 管理者核准每日積分 Excel 入帳 | 24 |
| 11 | Amy 回報已退房（T10）→ 管理者開放結算 | 20, 22, 26 |
| 12 | 玩家確認結算 → 琪琪核對「雙方已對齊」 | 26 |
| 13 | 琪琪現場退押金 → 玩家確認已收到 | 27 |

**Where things are:**

- `tooling/demo/diff_pages.json`: the mapping table (data). Row format and
  rules in RUNBOOK 「新增對照表列」.
- `tooling/demo/diff.ts` (entry): `loadDiffPages`, `compareScreenshots`,
  `writeDiffReport`; `diff_main.ts` is the command, `lib/run_demo_diff.ts`
  the capture loop, `lib/prototype_server.ts` serves the prototype HTML on
  an ephemeral 127.0.0.1 port.
- `tooling/demo/demo_server.ts` (entry): `ensureDemoServer`, `demoOrigins`,
  `roleSwitchUrl`; implementation `lib/demo_server.ts`, IPC contract
  `lib/demo_ipc.ts`.
- `tooling/demo/playwright.config.ts`, `tests/playwright_global_setup.ts`
  (→ `tests/support/script_demo.ts`), `tests/support/script.ts`
  (`test` with `scriptPage`, `openWorkspace`, `recordingPath`),
  `tests/demo_script.spec.ts`.
- Vitest: `tooling/demo/tests/diff_pages.test.ts`,
  `screenshot_comparison.test.ts`, `diff_report.test.ts`.

**Decisions:**

- Start or reuse: a 200 from `/api/health` on the work host (requested at
  127.0.0.1 with the `Host` header, since Node does not resolve
  `*.localhost` everywhere) means reuse and leave running. Otherwise the tool
  spawns `node --import tsx tooling/demo/main.ts` (the `pnpm demo` entry)
  with an IPC channel and `POKERNEXT_DEMO_STOP_ON_IPC=1`; `run_demo.ts` then
  stops on the `stop-demo` message or when the parent disconnects, because
  Windows has no catchable signal for a child process. Kills the tree only
  if the demo has not exited 60 s after the message.
- Sign-in: each row and viewport gets a fresh browser context and goes
  through `GET <host>/dev/role-switch?account=<id>`; a row names
  `{"workspace": …}` (resolved through the new `DEMO_ACCOUNTS` export of
  `@pokernext/app/demo`) or `{"accountId": …}`; omitted for pages without a
  session. The tool fails if the switch lands on `/` (refused).
- Prototype capture: served over http (a `file://` page has no stable
  origin), `localStorage` and `sessionStorage` cleared, reloaded, fonts
  awaited; `reducedMotion: 'reduce'` plus `animations: 'disabled'`. Both
  sides use full-page screenshots, dark colour scheme, zh-TW, Asia/Seoul,
  device scale 1.
- Comparison: pixelmatch (threshold 0.1) on the shared area; the images are
  padded to the larger width and height and every padded pixel counts as a
  difference (red in the diff image). Ratio = differing ÷ padded pixels.
- Initial rows capture each shell at its surface viewport only (player and
  staff 390×844, others 1440×1024); a row may list both viewports.
- Report: one HTML file, no scripts, DESIGN.md tokens inlined from
  `@pokernext/ui/tokens.css`; images are PNG files in `images/` next to it,
  referenced by relative path (keeps the HTML small). The report folder is
  cleared on every run.
- Recording: Playwright's `video: 'on'` writes one WebM per test, and its
  bundled ffmpeg has no concat demuxer or filter and cannot decode the image
  formats it encodes, so the files cannot be joined without a new
  dependency. Instead the steps share one worker-scoped page
  (`scriptPage`) whose context records when the project's `video` option is
  on, and the fixture saves that single video to
  `tooling/demo/recordings/<DEMO_BATCH>.webm` (default `latest`). One
  continuous video also matches steps that build on each other.
  `openWorkspace` switches the viewport per surface; mobile steps appear in
  the top-left of the 1440×1024 video.
- Steps run in `test.describe.serial`; the placeholder bodies already call
  `openWorkspace` for the workspace the prototype step visits.
- New dependencies of `@pokernext/demo` (all already in the workspace):
  `@pokernext/domain`, `@pokernext/ui`, dev `@playwright/test`,
  `pixelmatch`, `pngjs`. No `test:e2e` script, so `pnpm test` never starts
  the demo.

**Open issues / notes for later tickets:**

- RUNBOOK expects batch B to turn steps 1–8 green, but steps 4 and 5 need
  ticket 27, which is blocked by 26 (batch C).
- embedded-postgres stops the cluster on Windows with `taskkill /f`, so
  every demo stop (Ctrl+C or the tools) leaves a stale `postmaster.pid` and
  Postgres recovers on the next start. Pre-existing in `packages/db`; not
  changed here.
- In the captures the formal shells' CJK glyphs look like a system fallback
  font, while the prototype loads Noto Sans TC from Google Fonts; worth a
  look in a UI ticket, since font differences alone show up in the diff.

### 2026-09-15 review fixes

- Batch B expectation (open issue above) fixed in RUNBOOK §7 and §8. Checked the blockers: ticket 27 is blocked by 19 and 26, 26 by 25, 25 by 16 and 24, and 30 by 20, 21, 26 and 27. Per the `ticket` annotations in `tooling/demo/tests/demo_script.spec.ts`, batch B (15–22) turns steps 1–3 and 7–9 green; steps 4 and 5 (27) and 6 (20, 22, 30) move to batch C with 10–13. 27 is no longer listed in the batch B frontier. Also noted in §8: 28 and 29 are blocked by 14, which RUNBOOK puts in batch D.
- Recordings are committed now: `.gitignore` ignores `tooling/demo/recordings/*` except `*.webm`, and still ignores `latest.webm`; `.gitattributes` marks `*.webm` (and `*.png`) binary. RUNBOOK 「每批固定收尾」 step 6 says to commit `<batch>.webm`.
