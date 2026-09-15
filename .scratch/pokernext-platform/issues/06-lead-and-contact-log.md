# 06: Lead 與潛客聯繫紀錄

**What to build:** 訪客不必上傳證件就能瀏覽合作活動與諮詢入口；客服為詢問的潛客建立 Lead 與聯繫紀錄，作為售前跟進的可追溯起點。Lead ID 與之後的申請編號、正式 UUID 是三個不同識別。

**Blocked by:** 04（角色／範圍／欄位／狀態授權檢查 ＋ 第二人核准框架）

**Status:** ready-for-agent

**UI:**
- Surface: 管理端（客服／銷售）＋ 公開頁（未登入）
- Page type: DESIGN.md §3.2 案件頁；公開活動頁為手機優先單欄
- Reference: `docs/design/references/partner-change-requests.png`（列表＋詳情）；活動卡無圖，依 §4 Card
- Prototype: `#/admin/customers`、`#/admin/customers/C-2060`；actions `newLead`, `addFollowup`
- Components: ListPanel/ListItem、DetailPanel、KeyValueList/inline、Textarea、Button/secondary（新增聯繫紀錄）、Badge/neutral（Lead）
- States: 客戶清單 empty「尚無 Lead；由官方 LINE 或活動頁諮詢建立」；聯繫紀錄 empty「尚無聯繫；純未接通不等於無意願」

- [ ] 公開頁面（活動列表與諮詢入口）不需登入、不要求任何證件
- [ ] 客服能建立 Lead（來源管道、聯絡方式、備註）並新增多筆聯繫紀錄，每筆有實際聯繫時間與操作者
- [ ] Lead ID 與申請編號、UUID 格式與命名空間不同；Lead 數量不被計入會員數
- [ ] 無範圍的員工看不到其他人的 Lead 聯絡資料（一正一反）
- [ ] Lead 與正式會員在列表以 Badge 區分（Lead 灰、會員金），不以顏色單獨表示
