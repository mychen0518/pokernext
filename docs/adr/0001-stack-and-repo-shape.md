---
status: proposed
---

# 技術棧與 repo 形狀：pnpm monorepo、Next.js 單一 app 分六個 surface、純 TypeScript 領域核心、Postgres

首版要同時服務六個 surface（玩家端／合作端／管理端／Platform admin／員工端／Agent 端）且共用同一份正式紀錄（PRD 8.2），我們決定用**一個 Next.js（App Router、TypeScript）app 以 route group 分六個 surface**，而不是六個前端專案；所有業務規則放在**與框架無關的 `packages/domain`**（行程階段、異動案件、押金四軸、逐晚退款、任務範本），Next.js 只做投影與授權邊界；資料庫用 **Postgres**（Drizzle），因為第 16、19、26、27 票要求「資料庫層唯一約束」與併發測試，SQLite 無法忠實驗證。設計系統獨立為 `packages/ui`，token 與元件名以 `docs/design/DESIGN.md` 為準。

## Considered Options

- 六個獨立前端：被拒，六端讀同一份紀錄投影，拆開會複製狀態邏輯。
- 把規則寫在 server actions／API route：被拒，`/tdd` 需要能在無 HTTP 的 seam 測領域規則，且第 01 票要求 use-case 層。
- SQLite 過渡：被拒（理由如上）。本機開發不依賴 Docker：`tooling/demo` 用 `embedded-postgres`（真實 Postgres 16 二進位，首次執行自動下載）啟動資料庫；CI 與正式環境用一般 Postgres。

## Consequences

- repo 形狀採 `/setup-ts-deep-modules` 的深模組規則：每個 package 只從根目錄檔案對外，`lib/` 與 `tests/` 為私有。
- 第 01 票（骨架與測試基礎設施）的六個外部埠假實作放在 `packages/ports`；真實實作延後。
- 認證首版：工作帳號以 seeded 帳號 + 角色；OTP／TOTP 依第 03、10 票補齊，不阻擋 UI 開發。
- 程式風格採 Google Style Guides（TypeScript／HTML-CSS／Markdown／JSON），TypeScript 以 `gts` 落地為 eslint + prettier 設定並進 pre-commit；細則與人工審查項見 `docs/CODING_STANDARDS.md`。檔名 `snake_case`、只用 named export、無 `any`。
- 原型（`docs/design/prototype/`）是規格來源，不是程式碼來源：不得直接複製其 JS 進正式程式碼。
