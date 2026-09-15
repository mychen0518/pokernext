# 00b: 桌面工作區元件與三種頁型

**What to build:** 合作端與管理端共用的版面與資料元件。kitchen-sink 以這些元件和原型的示範資料組出 DESIGN.md §3.2 的總覽頁、作業頁、案件頁，並與三張參考圖並排比對。之後場館、管理、平台治理、Agent 工作區的畫面都由這些元件組成。

**Blocked by:** 00a

**Status:** ready-for-agent

**UI:**
- Surface: 合作端、管理端
- Page type: DESIGN.md §3.2 總覽頁、作業頁、案件頁（在 kitchen-sink 以示範資料組合）
- Reference: `docs/design/references/partner-overview.png`、`docs/design/references/partner-checkin.png`、`docs/design/references/partner-change-requests.png`
- Components: Sidebar、Topbar、PageHeader、UserChip、KpiRow／KpiTile、Tabs、SearchInput、DataTable（dense／regular）、KeyValueList、ResultBanner（success／error／info）、ListPanel／ListItem、DetailPanel、Stepper、ActivityTimeline、TodoPanel／TodoCard
- States: DataTable、ListPanel、TodoPanel、ActivityTimeline 各有 loading／empty／error／ready；≤ 1024px 側欄收合

- [ ] 上列元件都能從套件的根入口 import，名稱與 DESIGN.md §4 一致
- [ ] 三種頁型在 1440×1024 截圖，與對應參考圖並排；結構符合 §3.2：Sidebar 232px、Topbar 64px、總覽頁左 2/3 右 1/3、作業頁雙欄 1:1、案件頁 ListPanel 380px
- [ ] 三種頁型納入 00a 的截圖測試，寬度 1440、1280、1024 各一張基準圖
- [ ] DataTable、ListPanel、TodoPanel、ActivityTimeline 各有四態範例；loading 為骨架列，empty 用 EmptyState 帶原因，不顯示 0 或空表格
- [ ] DataTable 最多 6 欄；狀態欄用 StatusDot 且帶文字
- [ ] ≤ 1024px 時 Sidebar 收合為 icon 列，右側欄移到主內容下方
- [ ] Sidebar 目前項為 gold-tint 底加左側 3px 金條；Tabs 與 ListItem 可用鍵盤切換與選取
- [ ] 示範資料遵守 DESIGN.md §5：時間帶時區標記、金額 `KRW 300,000`、編號用 mono；值取自原型字面值（琪琪、TR-260911-028……），不複製原型 JS
- [ ] 合作端頁型的示範資料不出現歸屬歷史、業績、行銷費、內部備註欄位
- [ ] 截圖路徑寫進本票 `## Comments`
