$ErrorActionPreference="Stop"
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
Set-Location "C:\Project\AI\POKERNEXT_Claude"

Write-Host "== 工具檢查 =="
foreach($t in 'node','pnpm','git','docker','claude'){
  if(Get-Command $t -ErrorAction SilentlyContinue){ $v = (& $t --version 2>&1 | Select-Object -First 1); Write-Host ("OK      {0,-7} {1}" -f $t,$v) } else { Write-Host ("MISSING {0}" -f $t) -ForegroundColor Red }
}
Write-Host "== git init / commit =="
if(-not (Test-Path .git)){ git init -b main | Out-Host }
if(-not (git config user.name)){ git config user.name "Mingyao Chen" }
if(-not (git config user.email)){ git config user.email "mychen0518@gmail.com" }
if(-not (Test-Path .gitignore)){
  @('node_modules/','.env','.env.*','!.env.example','dist/','.next/','coverage/','*.log','.DS_Store','Thumbs.db','tooling/demo/recordings/','Coding Guide/','.worktrees/') | Set-Content .gitignore -Encoding UTF8
}
git add -A | Out-Host
if(git diff --cached --quiet){ Write-Host "沒有新變更可 commit" } else {
  git commit -m "Add PRD, spec, tickets, design system, prototype and runbook" | Out-Host
}
git log --oneline -3 | Out-Host
Write-Host "`n== 完成。接著執行 step1-grill.cmd =="
