---
status: accepted
---

# 技術棧與 repo 形狀：pnpm monorepo、Next.js 單一 app 分六個工作區、純 TypeScript 領域核心與 use-case 層、Postgres

首版要同時服務六個工作區（`CONTEXT.md`：玩家 `player`、場館 `venue`、管理
`admin`、平台治理 `platform`、接待 `staff`、Agent `agent`），且共用同一份正式
紀錄（PRD 8.2）。我們決定用**一個 Next.js（App Router、TypeScript）app、一個
部署單元，以 route group 分六個工作區**，而不是六個前端專案；玩家工作區與以工作
帳號登入的其餘五個工作區**以不同 host 提供**。業務規則與權限規則放在**與框架
無關的 `packages/domain`**，由各業務票以 TDD 逐步加入（例如第 20 票的客觀狀態
衍生、第 21 票的異動案件、第 27 票的押金四軸），不預先移植；**授權執行、版本重查、交易與資料庫約束的組合放在 `packages/app` 的
use-case**；Next.js 只做 session 解析與投影。資料庫用 **Postgres 16
（Drizzle）**，因為第 09、16、19、26、27 票要求「資料庫層唯一約束」與併發測試，
SQLite 無法忠實驗證。session 與認證自建，不用認證函式庫或外部 IdP。設計系統
獨立為 `packages/ui`，token 與元件名以 `docs/design/DESIGN.md` 為準。

## Considered Options

- 六個獨立前端：被拒，六個工作區讀同一份紀錄的投影，拆開會複製狀態邏輯。
- 一個 app 只以路徑前綴區分工作區：被拒，公開的玩家網站與工作帳號入口需要各自的
  WAF／限流／挑戰規則與 cookie 範圍（第 33 票），同一 host 下無法乾淨分開。
- 同一份程式碼、兩個部署單元（玩家／工作帳號）：暫不採用。host 分流已讓邊緣規則與
  cookie 分開；日後需要時可拆，不必改 route。
- 把規則寫在 server actions／API route：被拒，`/tdd` 需要能在無 HTTP 的 seam 測
  領域規則，且第 01 票要求 use-case 層。
- use-case 放在 `apps/web/lib/`：被拒，use-case 測試會被迫經過 Next.js。
- 授權放在 Next.js middleware、use-case 不檢查權限：被拒，第 01 票要求測試經
  use-case 層且權限檢查不替身；middleware 裡的授權在 use-case 測試中看不到。
- 權限規則與執行都放在 `packages/app`：被拒，spec 有數十條「不能」類故事，放在
  純函式層才能不起資料庫就窮舉整張權限矩陣。
- SQLite 過渡：被拒（理由如上）。本機開發不依賴 Docker：`tooling/demo` 與本機測試
  用 `embedded-postgres`（真實 Postgres 二進位，首次執行自動下載）；CI 用
  Postgres service container；正式環境用一般 Postgres。
- Kysely／Prisma：選 Drizzle，schema 以 TypeScript 撰寫、產生的 SQL 透明，
  唯一約束與 migration 可直接審查。
- 測試以「每個測試包一個交易、結束回滾」隔離：被拒，併發測試需要多條連線看到已
  提交的資料。
- better-auth／Auth.js：被拒，它們帶進自己的資料表與流程，難以讓七天單次邀請、
  密碼＋TOTP＋備援碼、第二人核准的恢復、會員 OTP 的每一步都經 use-case 授權並
  寫入 AuditLog，也難以保證不留後門（第 03、10 票）。
- 外部 IdP（Clerk、Auth0）：被拒，理由同上，且會把會員個資交給第三方，觸及處理
  地區與告知的核准（G23 類）。
- 介面、假實作、真實實作都放在 `packages/ports`：被拒，假實作會進正式打包，真實
  實作的重型 SDK 會汙染介面層。
- 現在就選定雲端：被拒，見 Consequences 的 RPO 0 前提。

## Consequences

- repo 形狀：`apps/web`、`packages/ui`、`packages/domain`、`packages/app`、
  `packages/db`、`packages/ports`、`tooling/demo`。每個 package 採
  `/setup-ts-deep-modules` 的深模組規則：只從根目錄檔案對外，`lib/` 與 `tests/`
  為私有。
- 客觀狀態由來源事件衍生（`projectTrip` 之類的純函式），沒有可寫的總狀態或行程
  階段欄位；`transition(state, event)` 只用於由人推動的案件流程（異動案件）。
  原型的線性行程階段鏈不採用。
- 分層方向 `apps/web → packages/app → packages/domain, packages/db,
  packages/ports`，由 dependency-cruiser 強制。`packages/domain` 不依賴 React、
  Next、資料庫。
- 授權：「誰能對什麼做什麼」是 `packages/domain` 的純函式（例如
  `authorize(actor, action, resource)`），以單元測試窮舉角色與動作。
  `packages/app` 的每個 use-case 載入 actor 與資源範圍、呼叫授權判定、拒絕時寫
  AuditLog；每次讀寫都重查。Next.js middleware 只依 host 決定哪些 route group
  可達，不作為授權依據。
- 玩家 host 與工作帳號 host 各自持有 cookie 與 Cloudflare 規則（第 33 票）。
- session 自建：存在 Postgres 的資料表，cookie 只放不透明 token，兩個 host 各自
  一組。建立、撤銷、輪替 session 都是 `packages/app` 的 use-case。TOTP、密碼雜湊
  等底層運算只用小型原語函式庫（例如 `@oslojs/otp`、`@node-rs/argon2`）。
- Postgres 主版本在本機、CI、正式環境一律鎖 16。本機測試與 demo 都用
  `embedded-postgres`，但資料目錄分開。每個 test worker 從 template database
  複製出獨立資料庫；併發測試直接使用真實連線池。唯一約束寫在 migration，不只靠
  應用層檢查。
- 雲端與部署拓撲不在本 ADR 範圍。選 Postgres 的前提是它能以同步跨區複寫達成
  RPO 0（含跨區）與跨區 RTO 2 小時，由第 02 票驗證；若驗證不成立，由新的 ADR
  取代本 ADR 的資料庫部分。
- 外部埠：`packages/ports` 的根目錄入口放六個外部埠的介面；假實作與失敗注入由
  另一個入口 `testing.ts` 提供，dependency-cruiser 禁止 `apps/web` 與非測試程式碼
  引用它。真實實作延到對應的票，各自成為獨立 package（例如 KMS adapter）。
- 認證首版：seeded 工作帳號與會員**只存在於 demo 與測試資料庫**，由
  `tooling/demo` 的 seed 建立；正式環境的 migration 不含任何帳號（第 03 票：
  初始 Platform admin 只經一次性入口建立，不留工程師後門）。開發模式以角色切換列
  開啟 session，走與真實登入同一條 session 建立路徑；切換列在 production build
  中以建置期條件整段移除，而非執行期隱藏。建立 demo 帳號的 use-case 放在
  `packages/app` 的獨立入口 `demo.ts`，dependency-cruiser 只允許 `tooling/demo`
  引用；其餘 demo seed 一律呼叫正式 use-case。OTP／TOTP 依第 03、10 票補齊；UI 票
  不必等這兩張票完成才開始。
- 程式風格採 Google Style Guides（TypeScript／HTML-CSS／Markdown／JSON），
  TypeScript 以 `gts` 落地為 eslint + prettier 設定並進 pre-commit。檔名
  `snake_case`、只用 named export、無 `any`；框架強制的檔名與 default export
  只在 `docs/CODING_STANDARDS.md` 的窄豁免清單內允許，並以 eslint override 寫死。
- 原型（`docs/design/prototype/`）是規格來源，不是程式碼來源：示範資料的字面值
  （Alex、TR-260911-028、30,000 分……）可轉寫為測試 fixture 與 demo seed；
  狀態轉移、計算與 render 邏輯不得複製，須從 PRD 表格以 TDD 重寫。
