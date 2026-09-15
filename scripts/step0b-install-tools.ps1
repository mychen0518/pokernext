$ErrorActionPreference="Continue"
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8
Set-Location "C:\Project\AI\POKERNEXT_Claude"

Write-Host "== 安裝 pnpm 與 Claude Code（npm registry）=="
npm install -g pnpm @anthropic-ai/claude-code 2>&1 | Out-Host
Write-Host "== 重新檢查 =="
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
foreach($t in 'node','pnpm','git','claude'){
  if(Get-Command $t -ErrorAction SilentlyContinue){ $v = (& $t --version 2>&1 | Select-Object -First 1); Write-Host ("OK      {0,-7} {1}" -f $t,$v) } else { Write-Host ("MISSING {0}" -f $t) -ForegroundColor Red }
}
Write-Host "== 把 google-style skill 掛進 .claude/skills =="
if(-not (Test-Path .claude\skills\google-style)){ Copy-Item -Recurse .agents\skills\google-style .claude\skills\google-style }
Get-ChildItem .claude\skills\google-style | Out-Host
git add -A; if(-not (git diff --cached --quiet)){ git commit -m "Register google-style skill" | Out-Host }
Write-Host "`n== 完成。若 claude 仍 MISSING，請關掉這個視窗重開再試（PATH 需重新載入）。接著執行 step1-grill.cmd =="
