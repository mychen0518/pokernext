$ErrorActionPreference="Stop"
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
Set-Location "C:\Project\AI\POKERNEXT_Claude"

$p = "/setup-ts-deep-modules 依 ADR-0001 建立 pnpm workspace：apps/web、packages/ui、packages/domain、packages/app、packages/db、packages/ports、tooling/demo；分層 apps/web → app → domain, db, ports，禁止 apps/web 引用 packages/ports/testing.ts，packages/app/demo.ts 只允許 tooling/demo 引用。每個 package 依深模組規則（根目錄為公開介面、lib/ 與 tests/ 私有），裝好 dependency-cruiser 並證明規則會擋。完成後在 workspace 根目錄安裝並初始化 gts（Google TypeScript Style）：pnpm add -D gts typescript，npx gts init 後把產生的 eslint／prettier／tsconfig 設定改成 workspace 共用；檔名 snake_case、named export only、no any 要能被 lint 擋，用一個故意違規的檔案證明會擋再刪掉。最後執行 /setup-pre-commit：pre-commit 跑 typecheck + gts lint + depcruise，並加 commitlint。全部綠後 git commit。"
claude $p
