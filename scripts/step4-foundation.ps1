$ErrorActionPreference="Stop"
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
Set-Location "C:\Project\AI\POKERNEXT_Claude"

$p = "/implement-spec .scratch/pokernext-foundation/spec.md 測試 seam 依 spec「Testing Decisions」。implementer 必讀 docs/design/DESIGN.md、.claude/skills/google-style/SKILL.md 與 docs/design/prototype/pokernext-prototype.html（作為行為與視覺規格，不得複製其 JS）。00a 完成前用 Playwright 對 kitchen-sink 頁截圖並與原型 #/venue/checkin/TR-260911-028、#/player/home 並排。資料庫用 embedded-postgres（不依賴 Docker），連線設定放 packages/db。完成條件：pnpm demo 起得來、角色切換列可用、pnpm demo:diff 產出報告。"
claude $p
