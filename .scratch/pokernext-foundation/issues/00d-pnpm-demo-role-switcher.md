# 00d: `pnpm demo` 與角色切換列

**What to build:** 維護者執行 `pnpm demo`，一個指令就起本機資料庫、跑 migration、seed 六個 demo 帳號，並在玩家 host 與工作帳號 host 上啟動 app。開發模式下的角色切換列列出六個工作區的 demo 帳號，點選後以該帳號開啟 session 並進入其工作區。六個工作區目前只有空殼。這裡建立的帳號與 session 資料表，是第 03、10 票要擴充的同一套，系統只有一條 session 建立路徑（ADR-0001）。

**Blocked by:** 00b、00c、`.scratch/pokernext-platform/issues/01-project-skeleton-test-infra.md`

**Status:** ready-for-agent

**UI:**
- Surface: 玩家端（玩家工作區）、合作端（場館工作區）、管理端（管理、平台治理、Agent 工作區）、接待端（接待工作區）
- Page type: 工作區空殼。桌面工作區用 DESIGN.md §3.2 框架（Sidebar＋Topbar＋PageHeader＋EmptyState）；玩家工作區用 §3.1 框架（AppHeader＋BottomNav＋EmptyState）；接待工作區 no precedent → 只有手機寬度容器＋EmptyState，不放導覽，版面由第 22 票 `/prototype` 決定（DESIGN.md §3.3）
- Reference: `docs/design/references/partner-overview.png`（桌面框架）、`docs/design/references/player-home-mobile.png`（手機框架）
- Components: Sidebar、Topbar、PageHeader、UserChip、AppHeader、BottomNav、EmptyState；角色切換列用 Button/secondary＋Drawer，是開發工具，不列入 DESIGN.md §4
- States: 空殼 empty（原因：本工作區的功能尚未上線）；以錯誤工作區的 session 進入 → 拒絕頁

- [ ] 乾淨 clone 後執行 `pnpm demo`（不需 Docker）即可開啟兩個本機 host；第二次執行沿用既有資料，不重複建立 demo 帳號
- [ ] demo 資料庫與測試資料庫的資料目錄分開
- [ ] seed 建立六個 demo 帳號，各屬一個工作區：Alex Chen（會員，玩家工作區）、琪琪（場館）、王經理（管理）、Mingyao（平台治理）、Amy（接待）、David Chen（Agent）
- [ ] demo 帳號只能經開發用的帳號建立入口建立；dependency-cruiser 規則只允許示範工具鏈引用該入口，並以一個故意違規的引用證明規則會擋
- [ ] 帳號與 session 資料表不含密碼、TOTP、備援碼、邀請、OTP 欄位；正式環境的 migration 不含任何帳號資料
- [ ] 切換列點選帳號 → 結束該 host 目前的 session → 以同一個建立 session 的 use-case 開新 session → 進入該工作區首頁
- [ ] use-case 測試（真實資料庫）：以某帳號建立的 session 只能進該帳號所屬工作區，進其他工作區被拒；工作帳號的 session 在玩家 host 無效，會員的 session 在工作帳號 host 無效
- [ ] 玩家工作區只在玩家 host 可達，其餘五個工作區只在工作帳號 host 可達
- [ ] 建置測試：production build 的產物不含角色切換列與 demo 帳號建立程式
- [ ] 六個空殼的視覺：桌面工作區 Sidebar 副標為工作區名稱；玩家工作區 BottomNav 五項；接待工作區沒有導覽；空殼不顯示 0 或假資料
- [ ] 每個空殼依所屬 Surface 在 1440×1024 或 390×844 截圖，路徑寫進本票 `## Comments`
