# 30: 天城合作端現場 UI：在島玩家頁、離境與未完成核對頁、接送頁、差異提出

**What to build:** 天城人員在合作端看到在島玩家頁（今日預計抵達、已抵達待入住、在島內、需跟進）、離境玩家與未完成核對頁（今日已離境、歷史已離境、未完成核對）、接送頁（本場館接機／送機需求與回報）；能提出資料差異並附憑據，由 POKERNEXT 管理者處理，不直接修改平台帳目。

**Blocked by:** 20（現場事實事件與服務生命週期投影）、21（續住、入住前改期、取消流程與琪琪行程異動佇列）、26（玩家確認結算、正式扣分、住宿兌換核對單與天城「雙方已對齊」）、27（天城押金：應付／實收／應退／實退四軸與差異案件）

**Status:** ready-for-agent

**UI:**
- Surface: 合作端（桌面 1440×1024，最小 1280；≤1024 側欄收合為 icon 列）
- Page type: DESIGN.md §3.2 總覽頁（在島玩家頁、離境與未完成核對頁）＋ 案件頁（差異提出）
- Reference: `docs/design/references/partner-overview.png`（列表頁）、`docs/design/references/partner-change-requests.png`（差異案件）
- Prototype: `#/venue/overview`、`#/venue/departed`、`#/venue/transfer`；actions `assignCar`, `raiseDiff`
- Components: Sidebar（工作總覽／到場報到／行程異動／住宿兌換核對／押金紀錄／接送安排）、Topbar（overline 麵包屑 + 韓國時間）、PageHeader（右側最多一顆 Button/primary）、KpiRow（今日預計抵達／已抵達待入住／在島內／需跟進）、Tabs/underline（帶計數）、SearchInput、DataTable/regular（玩家、天城會員編號、行程與住宿、報到狀態、押金狀態、操作；狀態欄用 StatusDot）、ActivityTimeline、TodoPanel/TodoCard、接送頁用 DataTable/dense + Button/secondary 回報、差異提出用 Modal（Select 差異類型 + Textarea + 檔案上傳憑據）→ 建立後出現在 ListPanel/DetailPanel 案件頁並帶 Badge/warning
- States: 每個 Tab 的 DataTable 都要 loading（骨架 5 列）/ empty（原因：「今日尚無預計抵達的玩家」「沒有未完成核對的行程」）/ error；未完成核對視圖 empty 文案不得提到日期；差異案件送出後 Toast/success 並在清單置頂

- [ ] 在島內只包含本次有效 Check-in 且未退房者；已退房者不在
- [ ] 今日已離境以退房事件為準；未完成核對視圖不受日期篩選限制
- [ ] 接送頁只顯示本場館需求，可回報車輛／集合／處理結果
- [ ] 差異提出（編號／姓名／日期／行程／積分）建立案件並附憑據，平台帳目不變
- [ ] 所有頁面回應不含歸屬歷史、業績、行銷費、其他場館活動或內部備註
- [ ] 掃碼與收退款登錄在已登入後不被逐筆要求機器人驗證（配合第 33 票）
- [ ] 只用 DESIGN.md token 與元件；列表頁結構為 KpiRow → Tabs + SearchInput + DataTable（左 2/3）+ TodoPanel（右 1/3）；每頁最多一顆 Button/primary
- [ ] 報到與押金狀態用 StatusDot（warning＝待、success＝已、neutral＝無須），文字必備；DataTable 不超過 6 欄，行程與住宿併為一欄兩行
- [ ] 交付附 Playwright 截圖（1440×1024；在島／離境／未完成核對／接送四頁各 empty 與 ready 兩態）並與參考圖並排自查

**Notes:** G16／G18：具名授權名單與實機相機／本人核對 SOP 未定；本票交付介面與機制，現場 SOP 另案。
