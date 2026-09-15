# Spec：pokernext-foundation — 設計系統套件、領域核心與示範工具鏈

**Status:** ready-for-agent
**Depends on:** `docs/adr/0001-stack-and-repo-shape.md`（須先 accepted）
**Blocks:** `.scratch/pokernext-platform/issues/01-project-skeleton-test-infra.md` 及其後所有票

## Problem Statement

我們已經有一份 PRD、一份 spec、34 張票，以及一個六個工作區可操作的高保真原型（`docs/design/prototype/pokernext-prototype.html`）。但 repo 裡還沒有任何正式程式碼，而且原型的三樣東西（視覺、狀態機、示範資料）目前只存在於一個單檔 HTML 裡，實作 agent 拿不到可 import 的版本。如果直接開始做第 01 票，每個 implementer 都會各自重抄一次 token、各自解釋一次「已入住」是什麼，六個工作區很快就會長歪。

## Solution

在任何業務票開始前，先把原型拆成三個可被 import、可被測試、可被重跑的東西：

1. `packages/ui`：設計系統套件。token 與 `docs/design/DESIGN.md` §2 一致，元件名與 §4 一致；附一頁 kitchen-sink 供截圖比對。
2. `packages/domain`：純 TypeScript 領域核心。行程階段、異動案件階段、押金四軸、逐晚退款、任務範本固定答案，全部以 TDD 從原型的行為移植；原型的 `seed()` 變成測試 fixture 與資料庫 seed。
3. `tooling/demo`：示範工具鏈。`pnpm demo`（起 DB、灌 seed、啟 app、開發模式角色切換列）、`pnpm demo:script`（Playwright 依 13 步劇本跨六個工作區操作並錄影）、`pnpm demo:diff`（正式頁 vs 原型頁截圖並排報告）。

## User Stories

1. As an implementer agent, I want to `import { Button, DataTable, StatusDot } from '@pokernext/ui'`, so that 我不必解讀 DESIGN.md 的每個像素就能做出和原型一致的畫面。
2. As an implementer agent, I want `packages/domain` 提供 `projectTrip()`、`transition()`（異動案件）、`depositAxes()`、`computeRefund()`、`TASK_TEMPLATES`，so that 六個工作區投影同一份規則而不是各自推論。
3. As a reviewer agent, I want kitchen-sink 頁與原型截圖並排，so that 我能用視覺 diff 而不是主觀判斷來審 UI 票。
4. As the maintainer（Mingyao），I want `pnpm demo` 一個指令起整個系統並能用角色切換列在六個工作區間跳，so that 每批票完成後我能親手走一遍。
5. As the maintainer，I want `pnpm demo:script` 錄下 13 步劇本的影片，so that 我不在電腦前也能看到這批做到哪。
6. As the maintainer，I want `pnpm demo:diff` 產出報告，so that 我能一眼看出哪一頁和原型長得不一樣。
7. As a future ticket，I want seed 資料與原型完全相同（Alex／TR-260911-028／30,000 分…），so that 票裡引用的示範情境在正式系統裡也成立。
8. As a domain test，I want 可控時鐘與純函式，so that 「T13 未確認不逾期」「歸屬六個月」這類規則不用 sleep 就能測。
9. As a security reviewer，I want 開發模式角色切換列在 production build 不存在，so that 示範工具不會變成後門。

## Implementation Decisions

- repo 形狀依 ADR-0001：pnpm workspace；`apps/web`、`packages/ui`、`packages/domain`、`packages/app`、`packages/db`、`packages/ports`、`tooling/demo`。每個 package 依 `/setup-ts-deep-modules`：根目錄檔案是公開介面，`lib/`、`tests/` 私有。
- `packages/ui` 用 CSS custom properties（token 直接取自 DESIGN.md §2，不另起 Tailwind 主題）；元件用 React + CSS Modules；不引入 shadcn 等第三方元件庫，避免兩套 token。
- `packages/domain` 不依賴 React、Next、DB。所有規則的期望值來自 PRD 8.2 與 6.6.3 的表，不從實作反推。
- 客觀狀態由事件衍生（ADR-0001；platform spec §識別與狀態建模的表即狀態機定義）：`projectTrip(events, clock)` 回傳 `TripFacts`，表中每一行（已入住、已到 PokerRoom、在島內、已離境（營運）、已離島（實際核實）、玩家已確認結算、住宿已扣分、雙方已對齊、押金已收取／已退還……）各自是獨立、可單獨測試的衍生結果，彼此不互相推定。沒有可寫的「行程階段」欄位。
- 只有由人推動的案件流程用 discriminated union 加純函式 `transition(state, event)`：異動案件。取消類案件完成時產生「已取消」的來源事件，再由 `projectTrip` 衍生。
- 行程階段若畫面需要，是從 `TripFacts` 衍生的唯讀顯示摘要，不得驅動任何規則。
- 原型裡以下片段是「決策」，可精簡後 inline 到 domain 測試作為期望值來源（來自 prototype，非工作 demo）：
  - 行程取消：「取消中」→「已取消」只由天城完成取消事件觸發。原型的線性階段鏈（`applied → … → archived`）**不**採用：它把酒店入住與 PokerRoom 到場排成先後，違反「酒店 Check-in 不推定為 PokerRoom 到場」（US 83）。
  - 異動案件：`pending → in_progress → reported → done`；`pending → withdrawn`；取消類 `in_progress → done` 直接使行程 `cancelled`，不經管理者。
  - 押金四軸：收取（無須／待收取／已收取）、退款依據（待住宿結算／待玩家確認／待天城核對／應退 n／無應退）、退還（待退還／已退還）、玩家現金確認（待本人確認／已確認）。
  - 逐晚退款：`min(兌換晚數, 已付押金晚數) × 300,000`；應退≠實退不得標已退還。
- `tooling/demo` 的角色切換列只在 `NODE_ENV !== 'production'` 掛載；它以「以某工作帳號／會員身分開啟 session」實作，不繞過授權檢查。
- 示範劇本的 13 步以 Playwright 測試檔表達，同時作為批次 B／C 的端到端驗收。

## Testing Decisions

- 好測試＝透過公開介面驗證行為、名稱是一句業務句子、期望值來自 PRD 表格而非實作。
- Seams（請維護者確認）：
  1. `packages/domain` 的根目錄函式（`projectTrip`、`transition`、`authorize`、`depositAxes`、`computeRefund`、`taskTemplate`）— 單元測試，最多的測試在這裡。
  2. `packages/ui` 的 kitchen-sink 頁 — 截圖比對測試，不做 DOM 細節斷言。
  3. `tooling/demo` 的 `demo:script` — 端到端，只在批次 B／C 之後才要求全綠。
- 不測：CSS 內部、元件 props 的形狀、seed 檔案內容。

## Out of Scope

- 任何業務功能（那是 01–34 票）。
- 真正的 OTP／TOTP、KMS、OCR 埠實作。
- 管理端專屬視覺（沿用合作端桌面版面，DESIGN.md §3.2）。

## Further Notes

- 原型是 throwaway：本 spec 完成後，`docs/design/prototype/` 保留作參考，不再更新其 JS；視覺變更改 DESIGN.md 與 `packages/ui`。
- 拆票建議三張（00a ui、00b domain、00c demo），00c blocked by 00a、00b；三張都 blocked by ADR-0001 accepted。
