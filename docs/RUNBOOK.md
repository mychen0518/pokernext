# RUNBOOK：在本機用 Claude Code 走一次 Matt Pocock 流程

目標：從「有 PRD、spec、34 張票、六端原型」走到「批次 A 跑通、`pnpm demo`
可親手操作」。每一步寫明：在哪裡打什麼、agent 會做什麼、你要決定什麼、
怎樣算完成。步驟 0 只做一次；步驟 1–9 每個批次重複。

## 0. 環境（一次）

- Node 22+、pnpm 9、git、Claude Code CLI。資料庫由 `embedded-postgres`
  自動下載，不需要 Docker。缺工具時執行 `scripts/step0b-install-tools.cmd`。
- 在 `C:\Project\AI\POKERNEXT_Claude` 執行 `scripts/step0-git-init.cmd`（git
  init 並 commit 目前所有文件）。之後每一步都有對應的 `scripts/stepN-*.cmd`
  啟動器，雙擊即可。之後每一步的 `/code-review` 都需要一個可指的 commit。
- 開 Claude Code：`claude` 於 repo 根目錄。skills 已在
  `.claude/skills/`（symlink 到 `.agents/skills/`），輸入 `/` 應看到
  `to-tickets`、`implement-spec` 等。
- 先跑一次 `/git-guardrails-claude-code` 與 `/setup-pre-commit`。給
  setup-pre-commit 的指示：
  `lint 與 format 用 gts（Google TypeScript Style），另加 commitlint 檢查 commit 訊息符合 docs/CODING_STANDARDS.md 引用的 Git Commit Message 規則；pre-commit 跑 typecheck + gts lint + depcruise。`

## 1. 接受技術決策（`/grill-with-docs`）

貼上：

```
/grill-with-docs 請讀 docs/adr/0001-stack-and-repo-shape.md（status: proposed）與 .scratch/pokernext-foundation/spec.md。針對 ADR 的三個 Considered Options 與 Consequences 一輪一輪問我，直到沒有模糊點；每個定案立刻寫進 CONTEXT.md 或該 ADR，最後把 ADR status 改成 accepted。
```

你要決定的：Postgres 是否接受；Next.js 單 app 是否接受；認證首版用 seeded
帳號是否接受。完成：ADR-0001 為 `accepted`，`CONTEXT.md` 多了相關術語。

## 2. 把 foundation spec 拆票（`/to-tickets`）

```
/to-tickets .scratch/pokernext-foundation/spec.md
```

agent 會先給你一份編號清單（已核可五張：00a token 與基礎元件、00b 桌面工作區元
件、00c 玩家端手機元件、00d `pnpm demo` 與角色切換列、00e `demo:diff`
與劇本骨架；依賴 `00a → (00b ‖ 00c) → 00d → 00e`，00d 另被 platform 第 01 票擋）
並問粒度與阻擋邊。你核可後它寫到 `.scratch/pokernext-foundation/issues/`。完成：
五個 issue 檔存在，`Status: ready-for-agent`。業務規則不預先移植，
由各業務票自己寫進 `packages/domain`。

## 3. 建 repo 骨架（`/setup-ts-deep-modules`）

```
/setup-ts-deep-modules 依 ADR-0001 建立 pnpm workspace：apps/web、packages/ui、packages/domain、packages/app、packages/db、packages/ports、tooling/demo；分層 apps/web → app → domain, db, ports，禁止 apps/web 引用 packages/ports/testing.ts，packages/app/demo.ts 只允許 tooling/demo 引用。每個 package 依深模組規則（根目錄為公開介面、lib/ 與 tests/ 私有），裝好 dependency-cruiser 並證明規則會擋。
```

接著在同一個 session 貼：

```
在 workspace 根目錄安裝並初始化 gts（Google TypeScript Style）：pnpm add -D gts typescript，npx gts init 後把產生的 eslint／prettier／tsconfig 設定改成 workspace 共用（tsconfig.base.json、根 .eslintrc）。檔名規則 snake_case、named export only、no any 要能被 lint 擋。用一個故意違規的檔案證明會擋，然後刪掉它。
```

完成：`pnpm -w typecheck`、`pnpm -w lint`（gts）、
`pnpm -w lint:boundaries`（dependency-cruiser）都綠；還沒有任何業務程式碼。
commit。

## 4. foundation 五張票與第 01 票（`/implement`）

```
/implement 依阻擋關係做 .scratch/pokernext-foundation/issues/ 的 00a–00e 與 .scratch/pokernext-platform/issues/01-project-skeleton-test-infra.md：先並行 00a 與 01；00a 合回後並行 00b、00c；00b、00c、01 都合回後做 00d；最後 00e。用 /tdd，seam 依票與 foundation spec「Testing Decisions」。implementer 必讀 docs/design/DESIGN.md 與 docs/design/prototype/pokernext-prototype.html（作為視覺與示範資料規格，不得複製其 JS，不移植其業務規則）。每張 UI 票完成前依票內 **UI:** 段截圖並與參考圖並排，路徑寫進票的 ## Comments。
```

agent 會：建 branch → 開 implementer subagent 各自 worktree 依 frontier 並行 →
merger 合回 → 下一批 frontier → `/code-review` → 修 → 標 ready。你要決定的：
review 報告裡的 finding 哪些要修。完成：第 01 票驗收條件全綠；`pnpm demo`
起得來、角色切換列能以六個 demo 帳號切換工作區、`pnpm demo:diff` 產出報告。

## 5. 批次 A 的 tracer bullet（先窄後寬）

先只做一條線，把工具鏈磨順：

```
/implement 只做 .scratch/pokernext-platform/issues/13-player-navigation-account-center.md。用 /tdd，seam 依票；畫面必須用 packages/ui，完成前 Playwright 截圖 390×844 五個頁面各 empty／ready 兩態，並與原型 #/player/home 並排自查，截圖路徑寫進票的 ## Comments。本票需要的 demo seed 以呼叫 use-case 的方式補進 tooling/demo。
```

完成：`pnpm demo` 後切到玩家工作區能看到與原型一致的首頁與空狀態。跑
`/code-review main`，修完 commit。

## 6. 批次 A 整批（`/triage` → `/implement-spec`）

```
/triage 列出 .scratch/pokernext-platform/issues/ 中 ready-for-agent 且阻擋已全部完成的票（frontier）
```

確認 frontier 是 03、05、07、08、09、10、11 後：

```
/implement-spec .scratch/pokernext-platform/spec.md 只處理批次 A：03、05、07、08、09、10、11。其餘票不動。implementer 規則同步驟 4。
```

完成：申請 → 審核 → OTP 登入 → 玩家首頁 全程可在 `pnpm demo` 走；
`pnpm demo:script` 前 0 步（登入）綠。`/code-review`、`/retro`。

## 7. 批次 B（行程主線前半）

frontier 預期：15、16、17、18、19、20、21、22。第 27 票被第 26 票擋（批次 C），
不在這批。同步驟 6。完成：依 `tooling/demo/tests/demo_script.spec.ts` 每步的
`ticket` 註記，劇本第 1–3 步與第 7–9 步綠；第 4、5 步（第 27 票）與第 6 步（第
20、22、30 票）留到批次 C。影片已 commit，可看。

## 8. 批次 C（積分與結算）

frontier 預期：23、24、25、26、27、28、29、30；27 要等 26 完成、30 要等 27
完成才進 frontier。28、29 另被第 14 票擋，14 在批次 D：先做 14，或把 28、29
移到批次 D。完成：劇本第 4–6 步與第 10–13 步解除，13 步全綠；影片已 commit。

## 9. 批次 D（其餘）

06、12、14、31、32、33、34。

## 每批固定收尾

1. `/code-review <上一批的 commit>`：兩軸報告，只修你同意的。
2. `/retro`：把摩擦回寫成 CLAUDE.md 導航指標、`docs/CODING_STANDARDS.md` 規則或
   lint。
3. 更新 `docs/design/DESIGN.md`（若元件有新增）與 `.scratch/.../issues/*.md` 的
   `## Comments`（截圖、決策）。
4. 確認這批每張票都補了自己那段 demo seed（呼叫 use-case，不直接寫 SQL），並解除
   `demo:script` 裡對應步驟的 `test.fixme`（做法見下方「解除劇本步驟」）。
5. 這批新增或改動了畫面時，在 `tooling/demo/diff_pages.json` 補上對照表列（見下
   方「新增對照表列」），跑 `pnpm demo:diff` 看報告，把差異最大的幾頁寫進票的
   `## Comments`。
6. commit；`DEMO_BATCH=<batch> pnpm demo:script`，錄影存
   `tooling/demo/recordings/<batch>.webm`；把這支影片 commit 進 repo（`*.webm`
   在 `.gitattributes` 標為二進位，`<batch>.webm` 不被 `.gitignore` 忽略），
   維護者不在電腦前也能直接看這批做到哪。

兩個指令都會自己處理 demo：`http://work.localhost:3000/api/health`
有回應就沿用正在跑的 `pnpm demo`（跑完不關）；沒有就啟動一個（與 `pnpm demo`
同一個入口），跑完停掉 Next.js 與 Postgres。`DEMO_PORT`、
`POKERNEXT_PLAYER_HOST`、`POKERNEXT_WORK_HOST` 與 `pnpm demo` 相同。

### 新增對照表列（`pnpm demo:diff`）

在 `tooling/demo/diff_pages.json` 的 `pages` 加一個物件，不需改工具程式：

```json
{
  "id": "venue_checkin",
  "title": "到場報到",
  "formal": {
    "host": "work",
    "path": "/venue/checkin",
    "signInAs": {"workspace": "venue"}
  },
  "prototype": {"route": "#/venue/checkin"},
  "viewports": ["desktop"]
}
```

- `id`：小寫英數與 `_`，不可重複（報告圖檔以它命名）。
- `formal.host`：`player` 或 `work`；`formal.path` 以 `/` 開頭。
- `formal.signInAs`：`{"workspace": "<工作區>"}`（該工作區的 demo 帳號）或
  `{"accountId": "<id>"}`，二選一；不需登入的頁面省略。登入一律經開發用角色切換
  路由，每列每個寬度都用新的瀏覽器 context。
- `prototype.route`：原型的 hash route（`#/<角色>/<頁面>`）；截圖前會清除原型的
  瀏覽器儲存（`pn-proto-v1`）再重新載入。
- `viewports`：`desktop`（1440×1024）、`mobile`（390×844），可兩個都列；
  預設依頁面所屬端選一個。
- 寫錯的列會在啟動 demo 之前就被指出檔案、第幾列與欄位。

報告在 `tooling/demo/reports/diff/index.html`（gitignored，每次重寫），
每頁每個寬度並排正式頁、原型頁與差異圖，依差異比例由大到小排列；高度不同時多出的
部分算作差異。

### 解除劇本步驟（`pnpm demo:script`）

13 步在 `tooling/demo/tests/demo_script.spec.ts`，測試名稱是原型劇本的步驟名稱，
`ticket` 註記是對應票號。某步的票都完成後：

1. 把該步的 `test.fixme(` 改成 `test(`。
2. 在步驟內容用 `openWorkspace(scriptPage, '<工作區>')` 以該工作區的 demo
   帳號進入，接著像使用者一樣操作並用 `expect` 驗證畫面；需要的資料來自票自己補
   的 demo seed。
3. 不改 `playwright.config.ts`。步驟依序執行並共用同一個頁面，所以前一步留下的狀
   態下一步看得到；某步失敗時後面的步驟會被跳過。

錄影是整段劇本一支影片，存到 `tooling/demo/recordings/<DEMO_BATCH>.webm`（未設
`DEMO_BATCH` 時為 `latest.webm`，只留在本機、gitignored；`<batch>.webm` 要
commit，見「每批固定收尾」第 6 步）；全部步驟都還是 fixme 時不產生影片。

## `pnpm demo` 怎麼用

- 在 repo 根目錄執行 `pnpm demo`：起本機 demo 資料庫（embedded Postgres 16，
  資料在 `.data/postgres-demo`、port 55433，與測試用的 `.data/postgres-test`
  分開；設了 `DATABASE_URL` 就改用它）、跑 migration、確保六個 demo
  帳號（重跑不重複建立），再啟動 `next dev`。
- 開 `http://player.localhost:3000/`（玩家 host）或
  `http://work.localhost:3000/`（工作帳號 host），按「切換角色」選帳號。port 以
  `DEMO_PORT` 改，host 名以 `POKERNEXT_PLAYER_HOST`／`POKERNEXT_WORK_HOST` 改。
- Ctrl+C 會停掉 Next.js 與 Postgres；資料保留到下次執行。

## 遇到問題時

- 票寫得不夠 agent 動手：`/triage 把 <NN> 票 grill 到 ready-for-agent`，它會用
  grilling + domain-modeling 問你。
- 畫面不確定怎麼做：`/prototype`（UI 分支，2–3 個 `?variant=`），答案回寫票，
  不留在 main。
- 不知道現在做到哪：`/wayfinder` 或直接看 `.scratch/*/issues/` 的 Status 行。
- 要交接給下一個 session：`/handoff`。
