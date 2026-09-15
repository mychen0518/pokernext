# 16: 訂房訂車核對、酒店預訂單四狀態與本人一間房逐晚防重

**What to build:** 管理者收到行程申請後執行正式訂房／訂車，上傳天城住宿確認 PDF 並核對編號、玩家與日期；預訂單只有待核對／有效／已被替代／已取消四種狀態，每種都由管理者核對外部結果後產生；同號更新、接續增單、替代換號、作廢無替代各有正確處理；同一會員同一住宿晚（酒店當地日期）跨所有行程只能有一筆有效住宿，由資料庫層約束保證。

**Blocked by:** 05（文件保護核心：信封加密／KMS 埠、HMAC 查找索引、限時查看、故障暫停）、15（行程申請、行程編號與版本、草稿、同行者）

**Status:** ready-for-agent

**UI:**
- Surface: 管理端
- Page type: DESIGN.md §3.2 作業頁（申請核對卡）＋ 總覽頁 DataTable（酒店預訂單）
- Reference: `docs/design/references/partner-checkin.png`
- Prototype: `#/admin/trips`；actions `approveTrip`, `confirmHotel`, `verifyChange`
- Components: Card（申請摘要 KeyValueList）、Button/primary（核准送訂）、Input（確認單編號）、檔案上傳（PDF）、Checkbox（已核對本人／日期／晚數）、DataTable/regular（確認單、日期／晚數、入住階段、單據狀態、接續／前單）、Badge（有效／已被替代／已取消／待核對）
- States: 「住宿安排缺口」以 Badge/danger 顯示於行程列；同號重傳 → ResultBanner/info「辨識為既有紀錄」

- [ ] 酒店預訂編號以文字保存並保留前導零；只在合作場館／酒店範圍內檢查重複
- [ ] 上傳 PDF 後預訂單為待核對；管理者核對後轉有效；PDF 經第 05 票加密保存
- [ ] 相同編號再次上傳：辨識既有紀錄、不新建第二份有效住宿
- [ ] 同號增加晚數：保留原 PDF，新增內容版本（日期／晚數／處理人），目前有效以新版本計
- [ ] 只收到未核對新單而原單仍有效：原單不被自動取消或覆寫
- [ ] 改期明確作廢原單但尚未收到替代單：行程顯示「住宿安排缺口」，不顯示替代成功
- [ ] 5 晚減 3 晚（作廢換新號）：舊單歷史保留，目前有效只計 3 晚；2 晚加 4 晚（同號新版）：目前有效 4 晚而不是 6 晚
- [ ] 晚數以酒店當地日期計：9/10 入住 9/12 退房＝兩晚；9/12 接續入住不與原單重複計一晚
- [ ] 本人一間房：同一會員同一晚跨兩個行程各送一筆有效住宿（併發測試）只有一筆成功，另一筆被資料庫約束拒絕；同行者不占本人晚數
- [ ] 酒店、車輛、玩家確認各自有狀態；房已訂車未確認時整趟顯示部分完成
- [ ] 預訂單四狀態各有 Badge 色（待核對 warning／有效 success／已被替代 neutral／已取消 danger）且文字必備

## Comments

- 2026-09-15（foundation code review 修正）：`@pokernext/ports/testing` 已有
  酒店確認 PDF 樣本檔，依 PRD 5.6.7 的 A 被 B 替代、C 接續 B，加同號改版與作廢
  無替代，放在
  `packages/ports/lib/testing/samples/hotel_confirmations/`。以
  `loadHotelConfirmationSample` 載入，以
  `pnpm --filter @pokernext/ports samples:generate` 重產。PRD 5.6 未定 PDF
  版面，樣本的欄位標籤是暫定的；維護者決定維持暫定格式，本票定案真實版面時一併改
  樣本產生器與樣本。
