$ErrorActionPreference="Stop"
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
Set-Location "C:\Project\AI\POKERNEXT_Claude"

$p = "/implement 依阻擋關係做 .scratch/pokernext-foundation/issues/ 的 00a–00e 與 .scratch/pokernext-platform/issues/01-project-skeleton-test-infra.md：先並行 00a 與 01；00a 合回後並行 00b、00c；00b、00c、01 都合回後做 00d；最後 00e。用 /tdd，seam 依票與 foundation spec「Testing Decisions」。implementer 必讀 docs/design/DESIGN.md、.claude/skills/google-style/SKILL.md 與 docs/design/prototype/pokernext-prototype.html（作為視覺與示範資料規格，不得複製其 JS，不移植其業務規則）。每張 UI 票完成前依票內 **UI:** 段截圖並與參考圖並排，路徑寫進票的 ## Comments。資料庫用 embedded-postgres（不依賴 Docker），連線設定放 packages/db。完成條件：第 01 票驗收條件全綠；pnpm demo 起得來、角色切換列能以六個 demo 帳號切換工作區、pnpm demo:diff 產出報告。完成後 /code-review main。"
claude $p
