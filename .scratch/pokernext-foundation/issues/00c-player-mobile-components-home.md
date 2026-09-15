# 00c: 玩家端手機元件與首頁組合

**What to build:** 玩家端的手機版面與首頁元件。kitchen-sink 以這些元件和原型的示範資料組出 DESIGN.md §3.1 的玩家首頁（ready 與 empty 兩態），並與參考圖並排比對。第 13 票直接用這些元件做正式首頁。

**Blocked by:** 00a

**Status:** ready-for-agent

**UI:**
- Surface: 玩家端
- Page type: DESIGN.md §3.1 首頁（在 kitchen-sink 以示範資料組合）
- Reference: `docs/design/references/player-home-mobile.png`
- Components: AppHeader、BottomNav、HeroTripCard、StatusStrip、PointsPanel、ContactRow、EmptyState、Button/outline-gold
- States: ready（Alex 的濟州行程）；empty（沒有行程、沒有積分紀錄）

- [ ] AppHeader 與 ContactRow 先補進 DESIGN.md §4 元件目錄（變體與規格重點），與元件在同一個變更
- [ ] 上列元件都能從套件的根入口 import，名稱與 DESIGN.md §4 一致
- [ ] 首頁 ready 與 empty 在 390×844 截圖，與參考圖並排，並納入 00a 的截圖測試；桌面寬度以 480px 置中容器呈現
- [ ] empty 狀態用 EmptyState 帶原因，不顯示 0、空表格或「已完成」
- [ ] BottomNav 固定五項（首頁、我的行程、到場碼、我的積分、我的帳戶），目前項金色，底部含 safe-area
- [ ] 觸控區 ≥ 44×44 CSS px；文字放大 200% 時首頁內容仍完整、不重疊
- [ ] 一屏只有一個主要動作，位於 HeroTripCard 內或內容底部
- [ ] PointsPanel 左為可用積分、右為已保留，中間垂直分隔線；積分格式 `25,000 分`
- [ ] 示範文案沒有促打文案（「再打多久就能免費住宿」之類）；值取自原型字面值，不複製原型 JS
- [ ] 截圖路徑寫進本票 `## Comments`
