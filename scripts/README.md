# scripts/

RUNBOOK 各步驟的啟動器。雙擊 `.cmd` 即可；每個都會開一個 PowerShell 視窗，切到 repo 根目錄，然後（step1 起）以該步驟的指令啟動 Claude Code。

| 檔案 | 對應 RUNBOOK | 做什麼 |
|---|---|---|
| `step0-git-init.cmd` | 0 | 檢查 node／pnpm／git／docker／claude，`git init`，建 `.gitignore`，commit 全部文件 |
| `step1-grill.cmd` | 1 | 開 Claude Code 跑 `/grill-with-docs` 接受 ADR-0001（要你回答問題） |
| `step2-to-tickets.cmd` | 2 | `/to-tickets` foundation spec（要你核可拆法） |
| `step3-skeleton.cmd` | 3 | `/setup-ts-deep-modules` + gts + `/setup-pre-commit` |
| `step4-foundation.cmd` | 4 | `/implement` foundation 00a 與第 01 票並行，再做 00b 示範工具鏈，然後 `/code-review` |
| `step5-tracer.cmd` | 5 | `/implement` 第 13 票 tracer bullet，然後 `/code-review` |

Claude Code 在互動中問你的問題要由你回答；Cowork 端的 Claude 只能看螢幕、不能打字進終端機。
