# 01: 專案骨架與測試基礎設施

**What to build:** 建立可以跑起來的最小應用：一個從 HTTP 邊界進、經 use-case
層、落到真實資料庫、再回應的「健康檢查」請求，並且用它把整個專案後續都要沿用的測
試基礎設施立起來。之後每一張票都用這套設施寫測試，不各自發明。

**Blocked by:** RUNBOOK 步驟 3 的 repo 骨架；
`docs/adr/0001-stack-and-repo-shape.md` 須為 accepted。可與 foundation
00a–00c（設計系統套件）並行；foundation 00d（`pnpm demo` 與角色切換列）blocked
by 本票。

**Status:** ready-for-agent

- [x] 有一個可執行的應用服務入口，能收一個請求、寫入並讀回真實資料庫、回傳結果
- [x] 測試只透過應用服務邊界（HTTP API／use-case 層）操作，配真實資料庫；
  沒有任何測試直接寫資料庫佈置狀態
- [x] 提供「合法業務操作建構器」的骨架，讓後續測試以合法流程建立前置狀態
- [x] 提供可控時鐘：測試能推進時間（分鐘、小時、天、月）而不是 sleep
- [x] 六個外部埠（天城 Excel、酒店 PDF、OCR、KMS、通知管道、邊緣防護）
  各有假實作介面，且每個都能注入 spec「受控替身」表所列的失敗
- [x] 提供併發測試工具：能對同一操作發出並行請求並斷言只生效一次
- [x] 每個測試的名稱是一句業務句子；CI 上一條指令跑完全部測試

**Notes:** 架構選型已提案於 ADR-0001（Next.js 單 app 分六個工作區、
packages/domain、packages/app use-case 層、Postgres 16），本票以該 ADR
為準並補足 RPO／RTO 考量；選型必須為第 02 票的 RPO 0／跨區 RTO 2 小時驗證留有可
能。建議在此票同時建立 CONTEXT.md 固定 PRD 術語（會員 UUID／行程編號／酒店預訂編
號／核對單編號；在島內／營運已離境／實際離島；保留／扣分／應退／實退；有效到訪；
售前輪次），或另跑 /domain-modeling。

## Comments

### 實作紀錄（platform 01）

**基礎設施放在哪裡**

- 應用服務入口：`apps/web/app/api/health/route.ts`，只有 `GET /api/health`
  探針：`healthCheck.probe()` 以自己的 key 寫入一筆健康檢查再讀回，成功回
  200 `healthy`、失敗回 503 `unhealthy`，不列出任何紀錄、不收輸入（`POST`
  回 405）。它只呼叫 `@pokernext/app`；單一 app 實例在
  `apps/web/lib/runtime_app.ts`，由 `createAppFromEnvironment()` 建立。
- use-case 層：`@pokernext/app`（`packages/app/index.ts`）匯出 `createApp`、
  `createAppFromEnvironment`、`App`（`healthCheck.record／probe`、
  `sessions`）、`PortNotConfiguredError`。`createApp` 把整組依賴（資料庫、
  時鐘、外部埠）交給每一組 use-case。尚無真實 adapter 的外部埠在正式組裝裡是
  會丟出 `PortNotConfiguredError` 的佔位，由各埠的票替換。列出健康檢查紀錄
  不是 use-case；測試經 test app 的 `healthCheckRecords()` 觀察。
- 資料庫：`@pokernext/db`。所有連線設定都在 `packages/db/lib/config.ts`。
  - `@pokernext/db`：`resolveDatabaseUrl(purpose)`、`connectDatabase()`、
    stores。應用（`'app'`）只用 `DATABASE_URL`，沒設就丟錯並提示用
    `pnpm demo`；測試（`'test'`）以 `DATABASE_URL` 覆寫本機測試 cluster；
    `pnpm demo`（`'demo'`）只讀 `DEMO_DATABASE_URL`，否則用本機 demo cluster，
    再把該資料庫以 `DATABASE_URL` 交給 `next dev`。
  - `@pokernext/db/migrate`：`migrateDatabase(url)`。
  - `@pokernext/db/local_cluster`：`startDatabaseServer('test' | 'demo')`，給
    `tooling/demo`（00d）用；正式程式碼不會載入 embedded-postgres。
  - `@pokernext/db/testing`：template 與每個測試的複製資料庫。
  - migration 由 drizzle-kit 產生並提交在 `packages/db/migrations/`；
    `health_checks.request_key` 的唯一約束在 migration 裡。`0002_audit_log.sql`
    加入只可附加的 `audit_log`（時間由 app 時鐘寫入），session 被拒時由
    use-case 在同一次呼叫寫入；測試經 test app 的 `auditLog()` 讀取。第 03
    票擴充。
- 外部埠：`@pokernext/ports` 放 `Clock` 與六個埠的介面（`ExternalPorts`）。
  `@pokernext/ports/testing` 放 `ControllableClock`、六個假實作與
  `createFakePorts(clock)`：
  - `FakePointsWorkbookSource`：`injectFormatVersionMismatch`、
    `injectSameVersionDifferentContent`、`injectMissingRows`、
    `injectBlockingErrors`；`provideSample(name)` 提供提交的樣本 Excel。
  - `FakeHotelConfirmationSource`：`injectSameNumberDifferentContent`、
    `injectVoidedWithoutReplacement`、`injectMissing`；`provideSample(name)`
    提供提交的樣本 PDF。
  - 樣本檔（虛構資料）在 `packages/ports/lib/testing/samples/`：每日積分
    Excel 四種（正常、更正、重複、錯誤會員）與期初 Excel，依 PRD
    6.3.2／6.3.3 與 R15-17 欄位；酒店確認 PDF 依 PRD 5.6.7 的 A/B/C 例、同號
    改版、作廢無替代。`loadPointsWorkbookSample`／
    `loadHotelConfirmationSample` 讀取；
    `pnpm --filter @pokernext/ports samples:generate` 由定義重建。
  - `FakeOcrProvider`：`injectTimeoutOver30Seconds`（超過 30 秒手動填寫窗、
    仍在 2 分鐘嘗試內回應）、`injectTimeoutOver2Minutes`（嘗試內不回應）、
    `injectRecognitionFailure`、`injectLateResult`（2 分鐘後才到），延遲都走
    可控時鐘。
  - `FakeKeyManagementService`（真的以 AES-256-GCM 包裝 DEK）：
    `injectCannotWrapDataKey`、`injectCannotDecrypt`、
    `makeKeyVersionUnavailable`、`injectCrossRegionUnavailable`。
  - `FakeNotificationSender`：`injectSendFailure`、`injectChannelUnreachable`、
    `injectAllChannelsFail`；`delivered` 是可觀察的送達紀錄。
  - `FakeEdgeProtection`：`injectFalseBlock`、`injectOutage`、
    `injectChallenge`、`injectResponseInterrupted`（來源已處理、呼叫端拿不到回
    應，供重試測試用）。`withFakeEdge(edge, origin)` 把它做成 HTTP 中介層，包住
    `fetch` 或 route handler：擋下、挑戰、中斷服務由邊緣直接回應不到來源，
    回應中斷則到達來源後 reject（`EdgeResponseInterrupted`）。
    `apps/web/tests/health.spec.ts` 經它對執行中的伺服器探測，apps/web 測試
    從 `@pokernext/app/testing` 取得。
  - 失敗注入可帶 `{times: n}` 只套用 n 次，否則持續到 `restore()`。
- 測試入口：`@pokernext/app/testing`：
  - `createTestApp(options)`：複製的資料庫＋假外部埠＋`ControllableClock`；
    `app.close()` 會刪掉該資料庫。
  - `given(app).healthCheckRecorded()`：合法業務操作建構器骨架；只呼叫
    use-case，被拒時丟 `PreconditionRefused`。各業務票自行加步驟。
  - `runInParallel(n, attempt)`、
    `expectTakesEffectOnce({times, attempt, countEffects})`：併發工具，
    效果不是恰好一次就丟 `ConcurrencyViolation`。
  - `startTestDatabaseServer()`、`createTestDatabase()`：給 global setup 用。
- 可控時鐘：`advanceMinutes／Hours／Days／Months`（自然月、月底夾到該月最後一
  天，可設 `calendarUtcOffsetMinutes: 540` 以首爾日曆計算）、`advanceTo`、
  `wait(ms)`；不能往回撥。

**指令**

```sh
pnpm test                                        # 單元／use-case 測試，接著 HTTP 測試
pnpm test:unit                                   # Vitest：**/tests/**/*.test.ts(x)
pnpm exec vitest run packages/app/tests/health_check.test.ts   # 跑單一檔
pnpm --filter @pokernext/web test:e2e            # Playwright：apps/web/tests/*.spec.ts
pnpm --filter @pokernext/db exec drizzle-kit generate --name <change>  # 改 schema 後產生 migration
```

**測試怎麼拿到資料庫**

- 沒設 `DATABASE_URL` 時，Vitest globalSetup
  （`packages/app/tests/support/database_global_setup.ts`）啟動本機 embedded
  Postgres 16 測試 cluster：資料在 `.data/postgres-test`、port 55432（demo
  cluster 是 `.data/postgres-demo`、port 55433）。第一次會跑 initdb（UTF-8、C
  locale）；若已有程序在跑該 cluster 就沿用、不關它。
- globalSetup 建立以 migration 指紋命名的 template database
  （`pokernext_template_<hash>`，先建在暫名下再改名），並清掉舊 template
  與一小時以上的殘留複製庫。每個 `createTestApp()` 以
  `CREATE DATABASE … TEMPLATE …` 複製自己的資料庫；不用交易回滾隔離。
- 設了 `DATABASE_URL`（CI 的 Postgres 16 service container）就只用它：template
  與複製庫建在同一台伺服器上，測試不啟動也不關閉伺服器。
- 測試 cluster 關閉 `fsync`／`synchronous_commit`／`full_page_writes`：
  測試資料用完即丟，鎖、隔離與約束行為不變；整套 use-case 測試因此約快一倍。
- HTTP 測試：Playwright 會先啟動 `webServer` 才跑 globalSetup，所以
  `apps/web/tests/support/web_server.ts` 在 globalSetup 裡自己啟動測試 cluster、
  複製一個資料庫、以該 `DATABASE_URL` 跑 `next dev`（預設 127.0.0.1:3100，
  `E2E_WEB_PORT` 可改），結束時關掉 Next、刪庫、停 cluster。等待就緒與停止
  程序樹用 `packages/dev_process`（與 `tooling/demo` 共用）。

**CI**：`.github/workflows/ci.yml`（ubuntu、`postgres:16` service、
`DATABASE_URL`）跑
`pnpm typecheck && pnpm lint && pnpm lint:boundaries && pnpm test:unit`，接著
`pnpm --filter @pokernext/web test:e2e`。本機的一條指令是 `pnpm test`。

**結果**：Vitest 10 個檔 57 個測試、Playwright 3 個測試全綠（本機 embedded
cluster 與 `DATABASE_URL` 兩條路徑都跑過）；`next build` 成功。

**決策與偏離**

- 併發測試先紅後綠：在唯一約束之前，20 個並行的同一 `requestKey` 請求寫入 11
  筆，`expectTakesEffectOnce` 抓到；加上 migration 的唯一約束與
  `ON CONFLICT DO NOTHING` 後才通過。
- dependency-cruiser：`fake-ports-only-in-tests` 放行 `@pokernext/app/testing`
  的組裝程式；新增 `app-testing-only-in-tests`、`db-testing-only-in-tests`、
  `testing-internals-behind-testing-entry`、
  `embedded-postgres-not-in-production`，並以刻意違規的檔案確認五條規則都會擋下
  後刪除；另排除 `.next/` 與 `next-env.d.ts`。
- Playwright 只接受 default export 的 globalSetup，所以
  `tests/playwright_global_setup.ts` 加入 eslint override 與
  `docs/CODING_STANDARDS.md` 的例外清單（一行 re-export）。
- `next dev` 偵測到 AI coding agent 時會在 `apps/web` 寫入 `AGENTS.md` 與
  `CLAUDE.md`；目前加入 `.gitignore` 而不提交，要不要提交由維護者決定。
  `next-env.d.ts` 也加入 `.gitignore`，並從 tsc、eslint 排除。
- 刪除 `packages/example/`，`packages/README.md` 改指向 `packages/ports/`。
- `pnpm-workspace.yaml` 的 `allowBuilds` 加上 `@embedded-postgres/linux-x64`，讓
  CI 的 `pnpm install --frozen-lockfile` 不會卡在未核准的 build script。
- commit 的 `Refs` 行用 `.scratch/pokernext-platform/issues/01`：完整檔名超過
  commitlint 的 72 欄上限。
- 未加 CONTEXT.md 詞彙（Notes 中為選配）。未做任何畫面，所以沒有 UI 截圖。

### 2026-09-15 review fixes

- 「CI 上一條指令跑完全部測試」: `.github/workflows/ci.yml` now has two jobs
  that each run one command, `pnpm check` (typecheck, lint, boundaries,
  `pnpm test` = unit and every e2e suite). `windows-latest` uses the embedded
  Postgres test cluster and runs the packages/ui screenshot comparisons against
  the committed `win32` baselines; `ubuntu-latest` uses a `postgres:16` service
  through `DATABASE_URL`, and the screenshot specs skip there with a reason.
  Both install Playwright Chromium first (Linux with `--with-deps`). Locally
  `pnpm check` passed: Vitest 21 files / 112 tests, packages/ui Playwright 37
  passed / 27 skipped, apps/web Playwright 11 passed / 3 skipped. CI itself
  could not be run from the worktree.
- 「每個測試的名稱是一句業務句子」: the technical names in `packages/ui/tests`
  were renamed; `tooling/demo/tests` titles were already sentences and are
  unchanged.
