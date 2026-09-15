# RUNBOOK：在本機用 Claude Code 走一次 Matt Pocock 流程

目標：從「有 PRD、spec、34 張票、六端原型」走到「批次 A 跑通、`pnpm demo` 可親手操作」。每一步寫明：在哪裡打什麼、agent 會做什麼、你要決定什麼、怎樣算完成。步驟 0 只做一次；步驟 1–9 每個批次重複。

## 0. 環境（一次）

- Node 22+、pnpm 9、git、Claude Code CLI。資料庫由 `embedded-postgres` 自動下載，不需要 Docker。缺工具時執行 `scripts/step0b-install-tools.cmd`。
- 在 `C:\Project\AI\POKERNEXT_Claude` 執行 `scripts/step0-git-init.cmd`（git init 並 commit 目前所有文件）。之後每一步都有對應的 `scripts/stepN-*.cmd` 啟動器，雙擊即可。之後每一步的 `/code-review` 都需要一個可指的 commit。
- 開 Claude Code：`claude` 於 repo 根目錄。skills 已在 `.claude/skills/`（symlink 到 `.agents/skills/`），輸入 `/` 應看到 `to-tickets`、`implement-spec` 等。
- 先跑一次 `/git-guardrails-claude-code` 與 `/setup-pre-commit`。給 setup-pre-commit 的指示：`lint 與 format 用 gts（Google TypeScript Style），另加 commitlint 檢查 commit 訊息符合 docs/CODING_STANDARDS.md 引用的 Git Commit Message 規則；pre-commit 跑 typecheck + gts lint + depcruise。`

## 1. 接受技術決策（`/grill-with-docs`）

貼上：

```
/grill-with-docs 請讀 docs/adr/0001-stack-and-repo-shape.md（status: proposed）與 .scratch/pokernext-foundation/spec.md。針對 ADR 的三個 Considered Options 與 Consequences 一輪一輪問我，直到沒有模糊點；每個定案立刻寫進 CONTEXT.md 或該 ADR，最後把 ADR status 改成 accepted。
```

你要決定的：Postgres 是否接受；Next.js 單 app 是否接受；認證首版用 seeded 帳號是否接受。完成：ADR-0001 為 `accepted`，`CONTEXT.md` 多了相關術語。

## 2. 把 foundation spec 拆票（`/to-tickets`）

```
/to-tickets .scratch/pokernext-foundation/spec.md
```

agent 會先給你一份編號清單（已核可五張：00a token 與基礎元件、00b 桌面工作區元件、00c 玩家端手機元件、00d `pnpm demo` 與角色切換列、00e `demo:diff` 與劇本骨架；依賴 `00a → (00b ‖ 00c) → 00d → 00e`，00d 另被 platform 第 01 票擋）並問粒度與阻擋邊。你核可後它寫到 `.scratch/pokernext-foundation/issues/`。完成：五個 issue 檔存在，`Status: ready-for-agent`。業務規則不預先移植，由各業務票自己寫進 `packages/domain`。

## 3. 建 repo 骨架（`/setup-ts-deep-modules`）

```
/setup-ts-deep-modules 依 ADR-0001 建立 pnpm workspace：apps/web、packages/ui、packages/domain、packages/app、packages/db、packages/ports、tooling/demo；分層 apps/web → app → domain, db, ports，禁止 apps/web 引用 packages/ports/testing.ts，packages/app/demo.ts 只允許 tooling/demo 引用。每個 package 依深模組規則（根目錄為公開介面、lib/ 與 tests/ 私有），裝好 dependency-cruiser 並證明規則會擋。
```

接著在同一個 session 貼：

```
在 workspace 根目錄安裝並初始化 gts（Google TypeScript Style）：pnpm add -D gts typescript，npx gts init 後把產生的 eslint／prettier／tsconfig 設定改成 workspace 共用（tsconfig.base.json、根 .eslintrc）。檔名規則 snake_case、named export only、no any 要能被 lint 擋。用一個故意違規的檔案證明會擋，然後刪掉它。
```

完成：`pnpm -w typecheck`、`pnpm -w lint`（gts）、`pnpm -w lint:boundaries`（dependency-cruiser）都綠；還沒有任何業務程式碼。commit。

## 4. foundation 五張票與第 01 票（`/implement`）

```
/implement 依阻擋關係做 .scratch/pokernext-foundation/issues/ 的 00a–00e 與 .scratch/pokernext-platform/issues/01-project-skeleton-test-infra.md：先並行 00a 與 01；00a 合回後並行 00b、00c；00b、00c、01 都合回後做 00d；最後 00e。用 /tdd，seam 依票與 foundation spec「Testing Decisions」。implementer 必讀 docs/design/DESIGN.md 與 docs/design/prototype/pokernext-prototype.html（作為視覺與示範資料規格，不得複製其 JS，不移植其業務規則）。每張 UI 票完成前依票內 **UI:** 段截圖並與參考圖並排，路徑寫進票的 ## Comments。
```

agent 會：建 branch → 開 implementer subagent 各自 worktree 依 frontier 並行 → merger 合回 → 下一批 frontier → `/code-review` → 修 → 標 ready。你要決定的：review 報告裡的 finding 哪些要修。完成：第 01 票驗收條件全綠；`pnpm demo` 起得來、角色切換列能以六個 demo 帳號切換工作區、`pnpm demo:diff` 產出報告。

## 5. 批次 A 的 tracer bullet（先窄後寬）

先只做一條線，把工具鏈磨順：

```
/implement 只做 .scratch/pokernext-platform/issues/13-player-navigation-account-center.md。用 /tdd，seam 依票；畫面必須用 packages/ui，完成前 Playwright 截圖 390×844 五個頁面各 empty／ready 兩態，並與原型 #/player/home 並排自查，截圖路徑寫進票的 ## Comments。本票需要的 demo seed 以呼叫 use-case 的方式補進 tooling/demo。
```

完成：`pnpm demo` 後切到玩家工作區能看到與原型一致的首頁與空狀態。跑 `/code-review main`，修完 commit。

## 6. 批次 A 整批（`/triage` → `/implement-spec`）

```
/triage 列出 .scratch/pokernext-platform/issues/ 中 ready-for-agent 且阻擋已全部完成的票（frontier）
```

確認 frontier 是 03、05、07、08、09、10、11 後：

```
/implement-spec .scratch/pokernext-platform/spec.md 只處理批次 A：03、05、07、08、09、10、11。其餘票不動。implementer 規則同步驟 4。
```

完成：申請 → 審核 → OTP 登入 → 玩家首頁 全程可在 `pnpm demo` 走；`pnpm demo:script` 前 0 步（登入）綠。`/code-review`、`/retro`。

## 7. 批次 B（行程主線前半）

frontier 預期：15、16、17、18、19、20、21、22、27。同步驟 6。完成：劇本第 1–8 步綠，影片可看。

## 8. 批次 C（積分與結算）

frontier 預期：23、24、25、26、28、29、30。完成：劇本 13 步全綠。

## 9. 批次 D（其餘）

06、12、14、31、32、33、34。

## 每批固定收尾

1. `/code-review <上一批的 commit>`：兩軸報告，只修你同意的。
2. `/retro`：把摩擦回寫成 CLAUDE.md 導航指標、`docs/CODING_STANDARDS.md` 規則或 lint。
3. 更新 `docs/design/DESIGN.md`（若元件有新增）與 `.scratch/.../issues/*.md` 的 `## Comments`（截圖、決策）。
4. 確認這批每張票都補了自己那段 demo seed（呼叫 use-case，不直接寫 SQL），並解除 `demo:script` 裡對應步驟的 `test.fixme`。
5. commit；`pnpm demo:script` 錄影存 `tooling/demo/recordings/<batch>.webm`。

## 遇到問題時

- 票寫得不夠 agent 動手：`/triage 把 <NN> 票 grill 到 ready-for-agent`，它會用 grilling + domain-modeling 問你。
- 畫面不確定怎麼做：`/prototype`（UI 分支，2–3 個 `?variant=`），答案回寫票，不留在 main。
- 不知道現在做到哪：`/wayfinder` 或直接看 `.scratch/*/issues/` 的 Status 行。
- 要交接給下一個 session：`/handoff`。
