# 13: 玩家端五項主導覽與會員中心（含空狀態、休息提醒偏好）

**What to build:** 會員登入後用首頁、我的行程、到場碼、我的積分、我的帳戶五項主導覽；尚無行程或積分時看到可理解的空狀態，而不是被顯示為已完成或零積分；我的帳戶能查看資料、進入換證、通訊綁定與偏好設定。此票完成即 M 批次可驗收。

**Blocked by:** 10（會員 OTP 登入、換證與人工帳號恢復）、11（通訊綁定與通知偏好）

**Status:** ready-for-agent

**UI:**
- Surface: 玩家端（手機優先；桌面以 480px 置中容器呈現）
- Page type: DESIGN.md §3.1 玩家端首頁 ＋ 四個子頁（我的行程、到場碼、我的積分、我的帳戶）
- Reference: `docs/design/references/player-home-mobile.png`
- Prototype: `#/player/home`、`#/player/trips/TR-260911-028`、`#/player/qr`、`#/player/points`、`#/player/account`；actions `confirmVersion`, `confirmPaid`, `savePrefs`, `openCase`
- Components: AppHeader、BottomNav（五項，目前項金色）、HeroTripCard、StatusStrip（住宿／接送／行程三格）、PointsPanel（可用積分 display-lg、已保留 display-md）、ContactRow（接待人 + Button/ghost）、KeyValueList/stacked（我的帳戶）、Button/secondary（換證、通訊綁定、偏好、休息提醒入口）、EmptyState
- States: 首頁與「我的行程」「到場碼」在沒有行程時整區改為 EmptyState，原因文案例：「目前沒有進行中的行程，行程確認後會顯示在這裡」；「我的積分」無入帳時 EmptyState「尚無積分紀錄」，不渲染 PointsPanel；loading 用骨架（Hero 區塊 + 三格 + 數字）；error 用 ResultBanner/error + 重試

- [ ] 五項主導覽都可達；行程與到場碼頁在沒有行程時顯示原因說明，不顯示空的報到或「已完成」
- [ ] 我的積分頁在尚無任何入帳時顯示「尚無紀錄」，不顯示 0 分
- [ ] 我的帳戶能進入換證、通訊綁定、服務／推廣偏好與休息提醒設定
- [ ] 整個玩家端沒有「再打多久就能免費住宿」等促打文案（以測試檢查文案資源）
- [ ] 文字放大 200% 主要流程仍完整、觸控區 ≥ 44×44 CSS px、狀態不只以顏色表示、鍵盤可操作主要流程
- [ ] 只用 DESIGN.md token 與元件；首頁結構為 HeroTripCard → StatusStrip → PointsPanel → ContactRow，一屏只有一顆 Button/primary 或 outline-gold
- [ ] 空狀態一律 EmptyState 含原因文案，不出現 0、空表格或空的 Hero 圖
- [ ] 交付附 Playwright 截圖（390×844，五個頁面各 empty 與 ready 兩態）並與參考圖並排自查
