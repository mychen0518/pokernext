# 14: 歸屬指派／轉派、公共池、六個月期限與轉派後可見範圍

**What to build:** 新正式會員初始歸管理者；管理者提出歸屬指派／轉派需求並由 Platform admin 執行；首次指派自生效日起六個月，未到期轉派沿用原到期日，公共池指派重算六個月；轉派後原歸屬人 A 失去現行存取但保留遮罩後的歷史業績，接手人 B 讀得到售前輪次與跟進歷史。

**Blocked by:** 04（角色／範圍／欄位／狀態授權檢查 ＋ 第二人核准框架）、12（客戶詳情頁、售前輪次與跟進紀錄）

**Status:** ready-for-agent

**UI:**
- Surface: 管理端（提出）＋ Platform admin（執行）
- Page type: DESIGN.md §3.2 總覽頁變體（左轉派申請／右公共池）
- Reference: `docs/design/references/partner-overview.png`
- Prototype: `#/admin/ownership`、`#/platform/approvals`；actions `proposeTransfer`, `executeTransfer`
- Components: Card/el（申請卡＋KeyValueList/stack）、Select、Input、Button/secondary（提出）、Button/primary（Platform admin 執行）、DataTable/dense（公共池）
- States: 公共池 empty「目前沒有到期回收的客戶」；轉派已執行 → Badge/success + 執行時間

- [ ] 新會員預設歸屬管理者；介紹人紀錄不改變歸屬（一正一反）
- [ ] 指派／轉派需管理者提出、Platform admin 執行，保存理由、期間與影響；歷史可查
- [ ] 首次指派到期日＝生效日＋6 個月；未到期轉派預設沿用原到期日；公共池指派從生效日起算新的 6 個月（用可控時鐘測）
- [ ] 到期且無待審延長時客戶回公共池（延長申請在第 28 票）
- [ ] 轉派後 A 對該客戶的現行聯絡與行程存取被拒，但能看到自己遮罩後的歷史業績
- [ ] B 讀得到完整售前輪次與跟進歷史
- [ ] 員工／Agent 沒有任何 API 能列出或下載公共池名單或未授權的聯絡資料
- [ ] 管理端只有「提出」按鈕、Platform admin 端才有「執行」按鈕；同一張申請在兩端顯示同一狀態
