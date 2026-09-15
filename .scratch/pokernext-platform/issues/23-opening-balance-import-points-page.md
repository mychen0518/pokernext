# 23: 期初積分導入與會員積分頁

**What to build:** 管理者以「資料說明＋會員期初積分」兩表一次性導入期初餘額，只有核對後的剩餘可用積分才建立期初；歷史累積總分與已兌換天數只作歷史參考；建立「合作場館＋天城會員編號 → UUID」對照表；會員在我的積分頁看到帳面餘額、最後入帳時間與來源截止。

**Blocked by:** 13（玩家端五項主導覽與會員中心（含空狀態、休息提醒偏好））

**Status:** ready-for-agent

**UI:**
- Surface: 管理端（期初導入）＋ 玩家端（我的積分）
- Page type: 管理端 DESIGN.md §3.2 作業頁（上傳兩表 → 預覽 → 確認）；玩家端 §3.1 積分頁
- Reference: `docs/design/references/player-home-mobile.png`（PointsPanel）
- Prototype: `#/player/points`；管理端無對應（比照 `#/admin/points` 的匯入卡）
- Components: 管理端 檔案上傳×2、DataTable/dense（配對／未核實列）、Badge/warning（尚不可支持住宿）、Button/primary（確認建立期初）；玩家端 PointsPanel（可用 display-lg／帳面 display-md）、Card（已保留）、列表（明細：日期、來源、± 分）、hint（資料時點／來源截止）
- States: 玩家端無入帳 → EmptyState「尚無積分紀錄」且不渲染 0；某日無紀錄不顯示為當日 0

- [ ] 導入只用「核對後剩餘可用積分」建立期初；歷史累積與已兌換天數存為參考值，不增加餘額、不產生績效
- [ ] 同一會員／同一來源基準重複導入不再次增加餘額（一正一反）
- [ ] 每會員的期初截止點到啟用日之間的空窗核對未完成前，該期初被標示為「尚不可支持住宿」
- [ ] 天城會員換號：保留新舊號與期間並對應同一 UUID，不加期初
- [ ] 四個數字分開保存：天城歷史累積、天城剩餘、平台帳面餘額、可用額（此票可用額＝帳面，保留在第 25 票）
- [ ] 我的積分頁顯示帳面餘額、最後入帳時間、來源活動日截止與已知待補；某日無紀錄不顯示為當日零分
- [ ] 我的積分頁四個數字（可用／帳面／已保留／來源截止）各有 label，無入帳時整區為 EmptyState 而非 0

**Notes:** G17：正式截止點與真實期初餘額由天城交付；本票用去識別化樣本檔。

## Comments

- 2026-09-15（foundation code review 修正）：`@pokernext/ports/testing` 已有期
  初餘額 `.xlsx` 樣本（只有正常一種），以 `loadPointsWorkbookSample` 載入。PRD
  R15-17-02 的期初格式沒有格式版本欄位，G17 也未定案，儲存格版面與表頭是暫定的；
  維護者決定維持暫定格式，本票依天城交付的真實格式改樣本產生器
  （`packages/ports/lib/testing/samples/generate_samples.ts`）與樣本。
