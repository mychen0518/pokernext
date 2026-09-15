# 00a: 設計 token、基礎元件與截圖比對流程

**What to build:** implementer 能從設計系統套件 import DESIGN.md §2 的全部 token 與一組基礎元件；一頁開發用的 kitchen-sink 把每個元件的所有變體與狀態排出來；Playwright 截圖測試能對 kitchen-sink 截圖並與已提交的基準圖比對。之後的 UI 票（00b、00c 與業務票）沿用同一套截圖流程，不各自發明。

**Blocked by:** foundation 內無。外部：ADR-0001 accepted（已完成）、RUNBOOK 步驟 3 的 repo 骨架。可與 `.scratch/pokernext-platform/issues/01-project-skeleton-test-infra.md` 並行。

**Status:** ready-for-agent

**UI:**
- Surface: 四個 Surface 共用（token 與基礎元件）；kitchen-sink 是開發用頁，不屬於任何工作區
- Page type: kitchen-sink（開發用元件目錄頁）
- Reference: none（元素規格取自 DESIGN.md §2、§4；整體明度階與金色用量對照四張參考圖）
- Components: Button（primary／secondary／outline-gold／ghost／danger）、Badge、StatusDot、Card（default／elevated，含 CardHeader）、Input／Select／DateInput／Textarea、Checkbox、InfoBox、AmountDisplay、EmptyState、Toast（success／error）、Modal／Drawer
- States: Button 的 default／hover／focus-visible／disabled／loading；EmptyState 帶原因文案範例

- [ ] kitchen-sink 有 token 區，列出 DESIGN.md §2 每個顏色、字級、間距、圓角 token 的名稱與樣本
- [ ] 上列元件都能從套件的根入口 import，名稱與 DESIGN.md §4 一致
- [ ] 元件樣式內沒有任何非 token 的顏色、字型、間距、圓角字面值；不引入 Tailwind 主題或第三方元件庫
- [ ] kitchen-sink 列出每個元件的全部變體，以及 Button 的五種互動狀態
- [ ] Playwright 截圖測試在 1440×1024 與 390×844 對 kitchen-sink 截圖，與已提交的基準圖比對，差異超過門檻即失敗；更新基準圖需要明確的指令
- [ ] 視覺：金色只出現在 primary、outline-gold、ghost 與 focus 外框；Card 無陰影、圓角不超過 8px；Modal／Drawer 是唯一有陰影的元件
- [ ] StatusDot 與 Badge 在 kitchen-sink 中都帶文字，沒有只靠顏色表示狀態的範例
- [ ] 鍵盤 Tab 可走過所有互動元件，focus-visible 為 2px 金色外框
- [ ] 自動檢查：`--pn-text`、`--pn-text-2` 在 `--pn-surface` 上對比 ≥ 4.5:1
- [ ] kitchen-sink 不出現在 production build
- [ ] 截圖路徑寫進本票 `## Comments`
