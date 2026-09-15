$ErrorActionPreference="Stop"
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
Set-Location "C:\Project\AI\POKERNEXT_Claude"

$p = "/implement 依阻擋關係先做 .scratch/pokernext-platform/issues/02-rpo0-rto-feasibility.md（以本機測試環境證明可行性，不選雲端），再做 tracer bullet .scratch/pokernext-platform/issues/03-staff-accounts-totp-auditlog.md（擴充 00d 的帳號、session 與 AuditLog，不另建一套）。用 /tdd，seam 依票；本票需要的 demo seed 以呼叫 use-case 的方式補進 tooling/demo；畫面必須用 packages/ui，完成前依票內 **UI:** 段截圖並與參考圖並排，截圖路徑寫進票的 ## Comments。完成後 /code-review。"
claude $p
