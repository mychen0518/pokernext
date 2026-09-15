$ErrorActionPreference="Stop"
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
Set-Location "C:\Project\AI\POKERNEXT_Claude"

$p = "/implement 只做 .scratch/pokernext-platform/issues/13-player-navigation-account-center.md。用 /tdd，seam 依票；本票需要的 demo seed 以呼叫 use-case 的方式補進 tooling/demo；畫面必須用 packages/ui，完成前 Playwright 截圖 390x844 五個頁面各 empty／ready 兩態，並與原型 #/player/home 並排自查，截圖路徑寫進票的 ## Comments。完成後 /code-review main。"
claude $p
