$ErrorActionPreference="Stop"
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
Set-Location "C:\Project\AI\POKERNEXT_Claude"

$p = "/implement 分兩段：(1) 並行做 .scratch/pokernext-foundation/issues/ 的 00a 設計系統套件，與 .scratch/pokernext-platform/issues/01-project-skeleton-test-infra.md（用 /tdd，seam 依票）；(2) 兩者合回後做 foundation 00b 示範工具鏈。測試 seam 依 foundation spec「Testing Decisions」。implementer 必讀 docs/design/DESIGN.md、.claude/skills/google-style/SKILL.md 與 docs/design/prototype/pokernext-prototype.html（作為視覺與示範資料規格，不得複製其 JS，不移植其業務規則）。00a 完成前用 Playwright 對 kitchen-sink 頁截圖並與原型 #/venue/checkin/TR-260911-028、#/player/home 並排。資料庫用 embedded-postgres（不依賴 Docker），連線設定放 packages/db。完成條件：第 01 票驗收條件全綠；pnpm demo 起得來、角色切換列能以六個 demo 帳號切換工作區、pnpm demo:diff 產出報告。完成後 /code-review main。"
claude $p
