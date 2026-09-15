# Spec：pokernext-foundation — 設計系統套件與示範工具鏈

**Status:** ready-for-agent
**Depends on:** `docs/adr/0001-stack-and-repo-shape.md`（accepted）；RUNBOOK 步驟 3 的 repo 骨架
**Blocks:** 所有涉及畫面的票（00a–00c）；每批收尾的 `pnpm demo`／`pnpm demo:script` 驗收（00d–00e）

## Problem Statement

我們已經有一份 PRD、一份 spec、34 張票，以及一個六個工作區可操作的高保真原型（`docs/design/prototype/pokernext-prototype.html`）。但 repo 裡還沒有任何正式程式碼，原型的視覺與示範資料只存在於一個單檔 HTML 裡，實作 agent 拿不到可 import 的版本。如果直接開始做業務票，每個 implementer 都會各自重抄一次 token，維護者也沒有辦法在每批票完成後親手走一遍系統。

原型的**業務規則**（狀態鏈、押金公式等）刻意不在這裡抽出：原型的線性行程階段鏈已被 ADR-0001 否決，退款公式也是簡化版。業務規則由各業務票依驗收條件以 TDD 寫進 `packages/domain`。

## Solution

在業務票之前與旁邊，先做兩個可被 import、可被重跑的東西：

1. **`packages/ui`（00a–00c）**：設計系統套件。token 與 `docs/design/DESIGN.md` §2 一致，元件名與 §4 一致；附一頁 kitchen-sink 供截圖比對。
2. **`tooling/demo`（00d–00e）**：示範工具鏈。`pnpm demo`（起 DB、跑 migration、灌 seed、啟 app、開發模式角色切換列）、`pnpm demo:script`（Playwright 依 13 步劇本跨工作區操作並錄影）、`pnpm demo:diff`（正式頁 vs 原型頁截圖並排報告）。為了讓角色切換列走真實的 session 建立路徑，00b 同時建立最小的帳號與 session。

## User Stories

1. As an implementer agent, I want to `import { Button, DataTable, StatusDot } from '@pokernext/ui'`, so that 我不必解讀 DESIGN.md 的每個像素就能做出和原型一致的畫面。
2. As a reviewer agent, I want kitchen-sink 頁與原型截圖並排，so that 我能用視覺 diff 而不是主觀判斷來審 UI 票。
3. As the maintainer（Mingyao），I want `pnpm demo` 一個指令起整個系統並能用角色切換列在六個工作區間跳，so that 每批票完成後我能親手走一遍。
4. As the maintainer，I want `pnpm demo:script` 錄下 13 步劇本的影片，so that 我不在電腦前也能看到這批做到哪。
5. As the maintainer，I want `pnpm demo:diff` 產出報告，so that 我能一眼看出哪一頁和原型長得不一樣。
6. As a future ticket，I want demo seed 的值與原型相同（Alex／TR-260911-028／30,000 分…），而且由我自己補上屬於我的那段 seed，so that 票裡引用的示範情境在正式系統裡也成立。
7. As a security reviewer，I want 開發模式角色切換列與 demo 帳號建立在 production build 不存在，so that 示範工具不會變成後門。
8. As the implementer of 第 03、10 票，I want 擴充 00d 已建立的帳號與 session，而不是另建一套，so that 系統只有一條 session 建立路徑。

## Implementation Decisions

- repo 形狀依 ADR-0001：pnpm workspace；`apps/web`、`packages/ui`、`packages/domain`、`packages/app`、`packages/db`、`packages/ports`、`tooling/demo`。每個 package 依 `/setup-ts-deep-modules`：根目錄檔案是公開介面，`lib/`、`tests/` 私有。
- `packages/ui` 用 CSS custom properties（token 直接取自 DESIGN.md §2，不另起 Tailwind 主題）；元件用 React + CSS Modules；不引入 shadcn 等第三方元件庫，避免兩套 token。接待端版面不在 00a 範圍（DESIGN.md §3.3，由第 22 票先 `/prototype`）。
- 00d 的最小帳號與 session：
  - `packages/db` 建立帳號（會員或工作帳號＋所屬工作區與角色）與 session 資料表；不含密碼、TOTP、備援碼、邀請、OTP，這些由第 03、10 票加欄位與流程。
  - `packages/app` 提供建立與結束 session 的 use-case；session 存 Postgres，cookie 只放不透明 token，玩家 host 與工作帳號 host 各一組。本機以兩個 `*.localhost` 子網域模擬兩個 host。
  - 建立 demo 帳號的 use-case 放在 `packages/app` 的獨立入口 `demo.ts`，dependency-cruiser 只允許 `tooling/demo` 引用；它和角色切換列一樣在 production build 中不存在。
- 角色切換列只在開發模式掛載，以建置期條件整段移除；它列出各工作區的 demo 帳號，切換時結束目前 session、呼叫同一個建立 session 的 use-case，不繞過授權檢查。
- demo seed：
  - 00d 只 seed 六個工作區各一個 demo 帳號，名稱取自原型 `ROLES`（Alex Chen、琪琪、王經理、Mingyao、Amy、David Chen）。
  - 其餘示範資料由各業務票在完成時補上自己那段 seed，一律呼叫正式 use-case，不直接寫 SQL 或 Drizzle insert。
  - demo 帳號的建立是唯一例外（經 `demo.ts`）；第 03、09、10 票完成後，seed 改走真實的邀請、入會與登入流程。
- 示範劇本的 13 步以 Playwright 測試檔表達；00e 建立檔案與 13 個步驟，尚未有對應票的步驟標為 `test.fixme`，隨批次解除，同時作為批次 B／C 的端到端驗收。
- `demo:diff` 以 1440×1024 與 390×844 截正式頁與對應的原型 hash route，產出並排報告。

## Testing Decisions

- 好測試＝透過公開介面驗證行為、名稱是一句業務句子、期望值來自規格而非實作。
- Seams：
  1. `packages/ui` 的 kitchen-sink 頁：截圖比對測試，不做 DOM 細節斷言。
  2. `packages/app` 的 session use-case：用第 01 票的測試基礎設施（真實資料庫）驗證「以某 demo 帳號建立的 session 只能進該帳號所屬工作區」；另有一個建置測試證明 production build 不含角色切換列與 `demo.ts`。
  3. `tooling/demo` 的 `demo:script`：端到端，只在批次 B／C 之後才要求全綠。
- 不測：CSS 內部、元件 props 的形狀、seed 檔案內容。

## Out of Scope

- 任何業務功能與業務規則（那是 01–34 票）；`packages/domain` 在此不加入規則。
- 可控時鐘、合法業務操作建構器、外部埠假實作、併發測試工具（第 01 票）。
- 真正的邀請、密碼、TOTP、OTP（第 03、10 票）；KMS、OCR 埠實作。
- 管理端專屬視覺（沿用合作端桌面版面，DESIGN.md §3.2）；接待端版面（DESIGN.md §3.3）。

## Further Notes

- 原型是 throwaway：本 spec 完成後，`docs/design/prototype/` 保留作參考，不再更新其 JS；視覺變更改 DESIGN.md 與 `packages/ui`。原型裡的業務決策片段已移到對應票的 Notes（第 21 票異動案件階段、第 27 票押金四軸與退款公式），只作參考，不作期望值來源。
- 已拆為五張票（`issues/`），依賴 `00a → (00b ‖ 00c) → 00d → 00e`：
  - 00a 設計 token、基礎元件與截圖比對流程：blocked by repo 骨架，可與第 01 票並行。
  - 00b 桌面工作區元件與三種頁型、00c 玩家端手機元件與首頁組合：blocked by 00a，彼此並行。
  - 00d `pnpm demo` 與角色切換列：blocked by 00b、00c 與 `.scratch/pokernext-platform/issues/01`。
  - 00e `demo:diff` 報告與 13 步劇本骨架：blocked by 00d。
- 原本規劃的「領域核心」票已刪除：它與第 20、21、22、27 票重複，期望值來自原型而非驗收條件，且違反 platform spec「核心規則須穿過 use-case 與資料庫測試」的決策。
