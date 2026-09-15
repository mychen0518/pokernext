# 12: 客戶詳情頁、售前輪次與跟進紀錄

**What to build:** 銷售員工在客戶詳情頁一次看到身分、介紹人、歸屬、售前輪次、跟進歷史（行程／積分／任務／案件區塊先留位）；用五個固定售前狀態記錄進度，同一客戶最多一個有效輪次；客戶清單以三階段篩選，但沒有可手動覆蓋的「客戶總狀態」。

**Blocked by:** 09（雙驗證與唯一 UUID）

**Status:** ready-for-agent

**UI:**
- Surface: 管理端（銷售）＋ Agent 端共用同一頁型
- Page type: DESIGN.md §3.2 案件頁（左客戶清單／右詳情，Tabs 售前輪次／行程／任務／案件）
- Reference: `docs/design/references/partner-change-requests.png`
- Prototype: `#/admin/customers/C-2060`、`#/agent/customers`；actions `addFollowup`
- Components: Tabs/underline（三階段篩選）、DataTable/regular、DetailPanel、Badge/gold（售前狀態）、Modal（新增跟進：五選項 Select、管道、時間、摘要、下一步）
- States: 行程 Tab empty「尚無行程；行程申請成立後才帶出」；任務／案件 Tab 先留位 EmptyState

- [ ] 詳情頁顯示 UUID、介紹人（獨立推薦紀錄）、目前歸屬（新會員預設歸管理者）
- [ ] 售前輪次狀態只能是 UNASSESSED／CLARIFYING／INTENT_PRESENT／DEFERRED／NO_INTENT；「已轉行程」不能人工選（由第 15 票的正式送出衍生）
- [ ] 同一客戶開第二個有效輪次被拒；關閉後可開新輪次，歷史輪次保留
- [ ] 每次跟進保存實際聯繫時間、管道、摘要、結果、前後狀態與下一步；「未接通」不會改變輪次狀態
- [ ] 客戶清單能以 PRE_SERVICE／TRIP_SERVICE／RELATIONSHIP_MAINTENANCE 篩選，且同一會員可同時出現在多個分類
- [ ] 資料模型中沒有任何可寫入的客戶總狀態欄位；沒有範圍的員工看不到該客戶（一正一反）
- [ ] 五種售前狀態只能由 Select 固定選項選取；詳情頁沒有任何可編輯的「客戶總狀態」欄位
