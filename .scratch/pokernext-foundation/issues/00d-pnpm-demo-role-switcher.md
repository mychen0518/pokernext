# 00d: `pnpm demo` 與角色切換列

**What to build:** 維護者執行 `pnpm demo`，一個指令就起本機資料庫、跑 migration、seed 六個 demo 帳號，並在玩家 host 與工作帳號 host 上啟動 app。開發模式下的角色切換列列出六個工作區的 demo 帳號，點選後以該帳號開啟 session 並進入其工作區。六個工作區目前只有空殼。這裡建立的帳號與 session 資料表，是第 03、10 票要擴充的同一套，系統只有一條 session 建立路徑（ADR-0001）。

**Blocked by:** 00b、00c、`.scratch/pokernext-platform/issues/01-project-skeleton-test-infra.md`

**Status:** ready-for-agent

**UI:**
- Surface: 玩家端（玩家工作區）、合作端（場館工作區）、管理端（管理、平台治理、Agent 工作區）、接待端（接待工作區）
- Page type: 工作區空殼。桌面工作區用 DESIGN.md §3.2 框架（Sidebar＋Topbar＋PageHeader＋EmptyState）；玩家工作區用 §3.1 框架（AppHeader＋BottomNav＋EmptyState）；接待工作區 no precedent → 只有手機寬度容器＋EmptyState，不放導覽，版面由第 22 票 `/prototype` 決定（DESIGN.md §3.3）
- Reference: `docs/design/references/partner-overview.png`（桌面框架）、`docs/design/references/player-home-mobile.png`（手機框架）
- Components: Sidebar、Topbar、PageHeader、UserChip、AppHeader、BottomNav、EmptyState；角色切換列用 Button/secondary＋Drawer，是開發工具，不列入 DESIGN.md §4
- States: 空殼 empty（原因：本工作區的功能尚未上線）；以錯誤工作區的 session 進入 → 拒絕頁

- [x] 乾淨 clone 後執行 `pnpm demo`（不需 Docker）即可開啟兩個本機 host；第二次執行沿用既有資料，不重複建立 demo 帳號
- [x] demo 資料庫與測試資料庫的資料目錄分開
- [x] seed 建立六個 demo 帳號，各屬一個工作區：Alex Chen（會員，玩家工作區）、琪琪（場館）、王經理（管理）、Mingyao（平台治理）、Amy（接待）、David Chen（Agent）
- [x] demo 帳號只能經開發用的帳號建立入口建立；dependency-cruiser 規則只允許示範工具鏈引用該入口，並以一個故意違規的引用證明規則會擋
- [x] 帳號與 session 資料表不含密碼、TOTP、備援碼、邀請、OTP 欄位；正式環境的 migration 不含任何帳號資料
- [x] 切換列點選帳號 → 結束該 host 目前的 session → 以同一個建立 session 的 use-case 開新 session → 進入該工作區首頁
- [x] use-case 測試（真實資料庫）：以某帳號建立的 session 只能進該帳號所屬工作區，進其他工作區被拒；工作帳號的 session 在玩家 host 無效，會員的 session 在工作帳號 host 無效
- [x] 玩家工作區只在玩家 host 可達，其餘五個工作區只在工作帳號 host 可達
- [x] 建置測試：production build 的產物不含角色切換列與 demo 帳號建立程式
- [x] 六個空殼的視覺：桌面工作區 Sidebar 副標為工作區名稱；玩家工作區 BottomNav 五項；接待工作區沒有導覽；空殼不顯示 0 或假資料
- [x] 每個空殼依所屬 Surface 在 1440×1024 或 390×844 截圖，路徑寫進本票 `## Comments`

## Comments

### 2026-09-15 implementer

**Screenshots (UI evidence, committed),** all in
`.scratch/pokernext-foundation/screenshots/00d/`:

- 1440×1024: `venue_home_desktop_1440.png`, `admin_home_desktop_1440.png`,
  `platform_home_desktop_1440.png`, `agent_home_desktop_1440.png`,
  `role_switcher_drawer_desktop_1440.png`,
  `refusal_other_workspace_desktop_1440.png`
- 390×844: `player_home_mobile_390.png`, `staff_home_mobile_390.png`,
  `refusal_no_session_mobile_390.png`,
  `refusal_other_workspace_mobile_390.png`
- Side by side: `side_by_side_venue_vs_partner_overview.png`,
  `side_by_side_player_vs_player_home_mobile.png`

Side-by-side check: desktop frame matches `partner-overview.png` (232px
Sidebar with brand and workspace name, gold current item with the 3px bar,
64px Topbar with overline breadcrumb and Korea time, PageHeader, UserChip and
登出 at the foot). Player frame matches `player-home-mobile.png` (AppHeader
wordmark and bell, five-item BottomNav with 首頁 gold). Everything else in
the references is business data that belongs to tickets 13 and 30; the
shells show only `EmptyState` 「本工作區的功能尚未上線，上線後會顯示在這裡。」.
Fixed after the first look: the Next.js dev indicator covered BottomNav 首頁
and 登出 (`devIndicators: false`). The shells are empty-only, so there is no
ready state to capture.

Rewrite them with
`CAPTURE_00D_SCREENSHOTS=1 pnpm --filter @pokernext/web test:e2e`
(`tests/workspace_shell_screenshots.spec.ts`, skipped otherwise because the
Topbar clock changes every run). No Playwright baselines for apps/web.

**Commands and hosts:**

```sh
pnpm demo                    # http://player.localhost:3000/ and http://work.localhost:3000/
DEMO_PORT=3005 pnpm demo     # other port; POKERNEXT_PLAYER_HOST / POKERNEXT_WORK_HOST rename hosts
pnpm typecheck && pnpm lint && pnpm lint:boundaries
pnpm test:unit               # 18 files, 96 tests, includes the production build test
pnpm --filter @pokernext/web test:e2e   # 11 passed (3 health + 8 workspace), 3 skipped (screenshots)
KITCHEN_SINK_PORT=5191 pnpm --filter @pokernext/ui test:e2e   # 35 passed, 27 skipped
```

`pnpm demo` run twice on this worktree: first run initialised
`.data/postgres-demo` and printed `Demo accounts: 6 present, 6 created this
run.`; the second printed `6 present, 0 created this run.`. Both hosts
answered, the switcher moved between 琪琪 (work host) and Alex Chen (player
host), `player.localhost/venue` answered 404, and a Ctrl+C sent to the
console printed `Stopping Next.js and Postgres… Stopped.` with ports 3000 and
55433 free afterwards.

**Where things are:**

- `packages/domain` (`lib/workspace_access.ts`): the access rule as pure
  functions, `decideSessionStart(actor, host)` and
  `decideWorkspaceEntry({actor, sessionHost, requestHost, workspace})`, plus
  `WORKSPACES`, `hostOfWorkspace`, `hostOfAccountKind`,
  `accountKindOfWorkspace`. Unit tests enumerate account kind × account
  workspace × host × requested workspace and assert exactly six allowed
  combinations. Ticket 04 extends this rule with roles, scopes and fields.
- `packages/db`: tables `accounts` (id, kind member|work, display_name,
  workspace, role_label, created_at; CHECK constraints incl. member ⇔ player)
  and `sessions` (id, token_hash unique, account_id FK, host_kind
  player|work, created_at, ended_at) in migration
  `0001_accounts_sessions.sql`. No credential columns and no rows;
  `packages/db/tests/migrations_contain_schema_only.test.ts` scans every
  migration for INSERT/COPY/MERGE and credential-like column names, and
  `demo_accounts.test.ts` checks a freshly migrated database has no account.
- `packages/app` (index): `app.sessions.start / end / resolve / home` (the
  one session creation path; resolve re-reads session and account and calls
  the domain rule on every request) and `app.accounts.list`. Tokens are 32
  random bytes (base64url); only the SHA-256 hash is stored.
- `packages/app/demo.ts`: `ensureDemoAccounts({databaseUrl})`, fixed ids so
  reruns and parallel runs create nothing new. Tests use
  `given(app).demoAccountsEnsured()`, `given(app).demoAccount(workspace)`,
  `given(app).sessionStarted({accountId, host})` and, for the e2e server,
  `ensureDemoAccountsInDatabase` from `@pokernext/app/testing`.
- `apps/web`: `proxy.ts` (host → reachable workspace paths, 404 otherwise;
  routing only), `app/(player)/player`, `app/(work)/{venue,admin,platform,
  staff,agent}`, `app/page.tsx` (redirects to the session's home or shows
  the refusal page), `lib/pages/workspace_home.tsx` (resolve → shell or
  refusal), `lib/shells/desktop_workspace_shell.tsx`,
  `lib/sign_out_action.ts`, `dev_tools/` (role switcher).
- `tooling/demo/main.ts` → `lib/run_demo.ts`; root script `demo`.

**Decisions:**

- Build-time removal. (1) `#role_switcher` is a package `imports` alias in
  `apps/web/package.json`; `next.config.ts` exports a phase function and,
  in every phase except `PHASE_DEVELOPMENT_SERVER`, sets
  `turbopack.resolveAlias['#role_switcher']` to
  `dev_tools/role_switcher_removed.tsx`, which renders null and imports
  nothing. (2) The switch endpoint is `app/dev/role-switch/route.dev.ts`;
  `dev.ts`/`dev.tsx` are page extensions only in the development server, so
  production has no such route. Nothing in the production bundle can start a
  session for an arbitrary account: `sessions.start` is only called by the
  removed route.
- Build test `apps/web/tests/production_build.test.ts` (part of
  `pnpm test:unit`, about 25 s): `next build` into `.next/production-build-test`
  and asserts no output file contains `pn-dev-role-switcher`,
  `dev/role-switch` or the demo id prefix `5e3d0000-de30-4000`, after
  checking the markers still exist in source and the shell copy exists in
  the output. Red checks: importing `../../dev_tools/role_switcher` directly
  in `workspace_home.tsx` failed two tests (marker in 3 files, route path in
  12); importing `@pokernext/app/demo` in the stub failed the demo test
  (4 files). Both reverted.
- dependency-cruiser proof: the same deliberate
  `import {ensureDemoAccounts} from '@pokernext/app/demo'` in
  `apps/web/dev_tools/role_switcher_removed.tsx` failed
  `pnpm lint:boundaries` with `demo-entry-only-from-tooling-demo:
  apps/web/dev_tools/role_switcher_removed.tsx → packages/app/demo.ts`;
  removed. No rule was added or changed.
- Hosts: `player.localhost` and `work.localhost` on one `next dev`
  (`--hostname 127.0.0.1`), names from `POKERNEXT_PLAYER_HOST` /
  `POKERNEXT_WORK_HOST`; `allowedDevOrigins` lists both.
- Cookies: `pn_player_session` / `pn_work_session` (with the `__Host-`
  prefix when `NODE_ENV=production`), opaque token only, no `Domain`
  (host-only), `HttpOnly`, `SameSite=Lax`, `Secure` in production. The e2e
  test checks a player sign-in leaves the work host without a cookie.
- The switcher links to `GET <target host>/dev/role-switch?account=<id>`
  (a GET form per account). A GET because the target is often the other
  host: the two `*.localhost` hosts are cross-site, so only a top-level GET
  carries that host's Lax cookie, which is needed to end its current
  session. It ends that host's session, calls `sessions.start` and redirects
  with 303 to the workspace home, where `sessions.resolve` checks it.
- Refusal page and staff shell: no layout precedent, so both use the
  `PlayerShell` 480px frame without navigation plus `EmptyState` and
  `Button/secondary`; recorded in DESIGN.md §3.3 and new §3.4. No
  `/prototype` was run: the brief fixed the staff shell as frame + EmptyState
  and ticket 22 owns the reception layout.
- `packages/ui`: nine hook-using components (Input, DateInput, Select,
  Textarea, SearchInput, Tabs, ListPanel, TodoPanel, overlay for
  Modal/Drawer) now start with `'use client'`; without it a server component
  could not import `@pokernext/ui`. ui e2e baselines unchanged and passing.
- `next dev` output is separated per use with `NEXT_DIST_DIR`: demo
  `.next/demo`, e2e `.next/e2e`, build test `.next/production-build-test`,
  so the demo and the e2e run can coexist. Next did not rewrite
  `tsconfig.json` for these dirs.
- New dependency: `lucide-react` in `apps/web` (the Sidebar home icon and
  the refusal icon), same range as `packages/ui`. `tooling/demo` now depends
  on `@pokernext/db` too.

**Open issues / notes for later tickets:**

- AuditLog on a refused resolve belongs to ticket 03 (comment in
  `packages/app/lib/sessions.ts`).
- `app.accounts.list` has no actor or authorization; only the development
  switcher calls it. Ticket 03 should put account listings behind the
  domain rule.
- Player BottomNav links all point at `/player` until ticket 13 adds pages.
- The player and staff shells have no `h1`; ticket 13 / 22 bring page titles.
- ui components that take handlers but have no hooks (`Sidebar`,
  `AppHeader`, `DataTable` actions…) still need a client wrapper in apps/web
  when a handler is passed.
- `pnpm demo` on Windows prints cmd's "Terminate batch job (Y/N)?" after
  Ctrl+C because pnpm runs through a `.cmd` shim; Next and Postgres are
  already stopped by then.
