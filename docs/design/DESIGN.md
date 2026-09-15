# POKERNEXT UI 設計規範（DESIGN.md）

這份文件是 POKERNEXT 所有畫面的唯一視覺依據。任何涉及 UI 的 spec、票（ticket）、
實作、code review 都必須引用這裡的 token 與元件名，不得自行發明樣式。來源是
`docs/design/references/` 裡的四張參考圖；本文件是由圖萃取出的「可執行文字版」。
圖與文字衝突時以本文件為準，並回頭修正本文件。

參考圖：

| 檔名 | Surface | 畫面 |
|---|---|---|
| `references/player-home-mobile.png` | 玩家端（手機） | 首頁：Hero 行程卡、狀態三格、積分、接待人、五項底部導覽 |
| `references/partner-overview.png` | 合作端（桌面） | 工作總覽：KPI 列、分頁資料表、最近處理時間軸、待辦側欄 |
| `references/partner-checkin.png` | 合作端（桌面） | 到場報到：掃碼結果列、雙欄「資料核對 / 押金收取」 |
| `references/partner-change-requests.png` | 合作端（桌面） | 行程異動：狀態分頁、左清單右詳情（master-detail）、處理進度 |

管理端（POKERNEXT 內部人員與外部 Agent；管理、平台治理、Agent 三個工作區）
目前沒有參考圖：**沿用合作端的桌面版面與所有 token**，只把側欄品牌副標改為所在工
作區名稱。

接待端（接待工作區的手機工作台）目前沒有參考圖，也沒有版面先例：見 §3.3。

---

## 1. 整體氣質（agent 在做任何取捨時的準則）

- **深色、黑金、高級飯店感。** 背景近黑，唯一的強調色是金色。畫面 95% 是黑灰白，
  金色只用在「主要動作、目前位置、關鍵數字、狀態強調」四種地方。
- **資訊密度高但有秩序。** 桌面端一屏要放得下 KPI、資料表、側欄待辦，靠分隔線和
  label/value 對齊而不是靠留白拉開。手機端則相反：一屏只講一件事，大字、大按鈕。
- **數字是主角。** 積分、押金、KPI 用襯線字體放大，label 用小號灰字放在數字上
  方。
- **狀態一律「圓點＋文字」或「Badge」**，永遠有文字，不只靠顏色。
- **平面、細邊框、幾乎沒有陰影。** 層次靠背景明度階（bg → surface → surface-2）
  而不是靠陰影。
- **中文為主、英文為輔。** 品牌與 section 的英文副標用寬字距全大寫小字
  （`letter-spacing: 0.25em`）。

不要做：彩色漸層、大圓角（>8px）、卡片陰影、多種強調色、圖示填色、淺色主題、
玻璃擬態。

---

## 2. Design Tokens

以 CSS custom properties 表達；Tailwind 專案請對應到 `theme.extend`，
元件庫（shadcn 等）請覆蓋其 CSS 變數，不要另起一套。

### 2.1 色彩

```css
:root {
  /* 背景明度階：由深到淺 */
  --pn-bg:            #0b0c0d;   /* 頁面底、手機端底、側欄底 */
  --pn-surface:       #121314;   /* 卡片、面板、資料表底 */
  --pn-surface-2:     #1a1c1e;   /* 卡片內的次級區塊、表頭、資訊框、輸入框底 */
  --pn-surface-3:     #202325;   /* hover 列、選取列、提示框 */
  --pn-border:        #25292d;   /* 一般分隔線、卡片邊框 */
  --pn-border-strong: #393c3f;   /* 輸入框、次要按鈕邊框 */

  /* 文字 */
  --pn-text:          #f2f2f2;   /* 主文字、值 */
  --pn-text-2:        #a0a2a9;   /* 次文字、表頭、說明 */
  --pn-text-3:        #6a6c72;   /* label、時間戳、placeholder */
  --pn-text-inverse:  #141418;   /* 金色按鈕上的文字 */

  /* 品牌金：唯一強調色 */
  --pn-gold:          #c8a86f;   /* 主要按鈕底、目前導覽項、tab 底線 */
  --pn-gold-bright:   #e7c076;   /* 大數字、金色 icon、狀態強調 */
  --pn-gold-dim:      #9c8758;   /* 金色細字、英文副標、次要金色 */
  --pn-gold-tint:     #23211b;   /* 側欄目前項底、金色 Badge 底 */

  /* 語意色：只用於 StatusDot / Badge / 提示，不用於大面積 */
  --pn-success:       #5e9f6c;   --pn-success-tint: #17211a;
  --pn-warning:       #e3bd69;   --pn-warning-tint: #26221a;   /* 待處理＝金色系 */
  --pn-danger:        #9e5e60;   --pn-danger-tint:  #291d1f;
  --pn-info:          #4f6ea3;   --pn-info-tint:    #191f2d;
  --pn-neutral:       #7d8087;   --pn-neutral-tint: #1d1f20;   /* 未開始、無須、已撤回 */

  /* 遮罩：Modal / Drawer 背後 */
  --pn-scrim:         rgba(0, 0, 0, 0.7);
}
```

規則：

- 「金底按鈕」（`Button/primary`）每個區塊最多一顆，其餘動作用
  `Button/secondary`。區塊是一張卡片、作業頁的一欄、`PageHeader` 的動作區，或
  Modal／Drawer 的動作列；所以 §3.2 作業頁每欄底部一顆、§4 `TodoCard`
  每卡一顆都成立，但同一區塊裡不並排兩顆金底按鈕。玩家端手機另守 §3.1「一屏只放
  一個主要動作」。
- 語意色只出現在 ≤ 12px 的圓點、Badge 文字、單行提示；不做整張卡片變色。
- 「待處理／待確認／待收取」這類等待狀態一律 `warning`（金色系），
  視覺上與品牌一致；「已完成／已到／已收」用 `success`；「拒絕／退款／差異」用
  `danger`；「處理中」用 `info`；「無須／尚未開始／已撤回」用 `neutral`。

### 2.2 字體

```css
:root {
  --pn-font-sans:    "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif;
  --pn-font-serif:   "Noto Serif TC", "Songti TC", "PMingLiU", Georgia, serif;   /* 數字、Hero 標題 */
  --pn-font-mono:    ui-monospace, "SF Mono", Menlo, Consolas, monospace;          /* UUID、編號 */
}
```

Noto Sans TC 與 Noto Serif TC 由 `@pokernext/ui/fonts.css` 自帶（Fontsource
字檔隨 app 打包，只載入下表用到的字重），不向任何外部字體主機請求。

| Token | 用途 | 字體 | 大小 / 行高 / 字重 |
|---|---|---|---|
| `display-xl` | 手機 Hero 目的地標題 | serif | 64 / 1.1 / 700 |
| `display-lg` | 積分、押金等關鍵數字 | serif | 48 / 1.1 / 700 |
| `display-md` | KPI 數字、詳情頁人名 | serif（人名用 sans 700） | 32 / 1.2 / 700 |
| `title-lg` | 頁面標題 | sans | 28 / 1.3 / 700 |
| `title-md` | 卡片標題、詳情標題 | sans | 20 / 1.4 / 600 |
| `title-sm` | 區塊標題、列表項標題 | sans | 16 / 1.5 / 600 |
| `body` | 一般內文、表格值 | sans | 15 / 1.6 / 400 |
| `body-sm` | 次要內文、表頭 | sans | 13 / 1.5 / 400 |
| `label` | 欄位 label、時間戳 | sans | 12 / 1.4 / 400，顏色 `--pn-text-3` |
| `overline` | 英文副標、section eyebrow | sans | 11 / 1 / 500，全大寫，`letter-spacing: .25em`，顏色 `--pn-gold-dim` |
| `mono` | UUID、編號 | mono | 14 / 1.5 / 400 |

字級以 CSS custom properties 表達：每個字級 token `<name>` 對應四個屬性
`--pn-type-<name>-family`、`-size`、`-line`（無單位行高）、`-weight`，例如
`--pn-type-title-md-size: 20px`；`overline` 另有
`--pn-type-overline-tracking: 0.25em`。實作見 `packages/ui/tokens.css`。

手機端 body 不小於 16px；玩家端所有主要流程在文字放大 200% 時仍完整（第 13
票驗收條件）。

### 2.3 間距、圓角、邊框

```css
:root {
  --pn-space-1: 4px;  --pn-space-2: 8px;  --pn-space-3: 12px; --pn-space-4: 16px;
  --pn-space-5: 20px; --pn-space-6: 24px; --pn-space-8: 32px; --pn-space-10: 40px;

  --pn-radius-sm: 4px;   /* Badge、輸入框、小按鈕 */
  --pn-radius-md: 6px;   /* 卡片、主要按鈕、面板 */
  --pn-radius-lg: 8px;   /* 手機 Hero 按鈕、Modal（上限） */
  --pn-radius-round: 50%; /* 只用於圓形元素（StatusDot 圓點、頭像），不用於容器 */

  --pn-shadow: none;     /* 不用陰影 */
  --pn-shadow-overlay: 0 8px 32px rgba(0, 0, 0, 0.6);  /* 唯一例外：Modal、Drawer */

  --pn-focus-ring: 2px solid var(--pn-gold);  /* focus-visible 外框（§6） */
  --pn-focus-offset: 2px;
}
```

- 桌面卡片內距 `--pn-space-6`，手機卡片內距 `--pn-space-5`。
- 資料表列高 64px（雙行資料）或 48px（單行）；label/value 列高 40px。
- 邊框一律 1px，顏色 `--pn-border`；輸入框與次要按鈕用 `--pn-border-strong`。

### 2.4 圖示

線性（outline）圖示，1.5px 線寬，尺寸 20px（表格、列表）／24px（導覽、卡片標題）
／32px（KPI）。顏色預設 `--pn-text-2`，在目前導覽項與 KPI 用
`--pn-gold-bright`。建議 Lucide；不要用填色（filled）或多色圖示。

---

## 3. 版面（Layout）

### 3.1 玩家端（Player，手機優先）

- 視口 ≤ 768px 為主要設計目標；桌面上以 480px 置中容器呈現（`PlayerShell`），
  不另做桌面版。
- 結構：`PlayerShell` 內 `AppHeader`（品牌字標 + 通知鈴）→ 內容 →
  `BottomNav`（五項固定：首頁、我的行程、到場碼、我的積分、我的帳戶）。
  首頁有行程時 `AppHeader` 放進 `HeroTripCard` 頂部、疊在圖上。
- 首頁：`HeroTripCard`（全幅照片、深色漸層壓底、問候、目的地 `display-xl`、
  日期、`Button/outline-gold` 主動作）→ `StatusStrip`（地點列 + 三格：
  住宿／接送／行程）→ `PointsPanel`（可用積分 `display-lg` 左、已保留右，
  中間垂直分隔線）→ `ContactRow`（接待人）。
- 積分數字的意義依 PRD 5.7.4、6.7.1 與第 25 票：可用積分＝帳面餘額 − 有效保留。
  首頁 `PointsPanel` 只放可用積分與已保留，帳面餘額在我的積分頁（第 23、25
  票）。參考圖把 30,000 標為可用積分只是示意；示範資料 Alex 帳面 30,000 分、
  已保留 25,000 分，首頁顯示「可用積分 5,000 分／已保留 25,000 分」（foundation
  spec 故事 6 的 30,000 分是帳面餘額）。
- 一屏只放一個主要動作；主要動作放在拇指區（內容底部或 Hero 卡內）。
- 觸控區 ≥ 44×44 CSS px；底部導覽每項 icon 24px + label 12px，目前項金色。
- 空狀態（沒有行程、沒有積分紀錄）使用 `EmptyState`：icon + 一句原因說明 +
  可選的次要動作；**不得顯示 0、不得顯示空表格、不得顯示「已完成」**。

### 3.2 合作端 / 管理端（Partner / Admin，桌面）

- 設計目標 1440×1024；最小支援 1280；≤ 1024 時側欄收合為 icon 列（72px，只留
  icon，文字保留給輔助科技），總覽頁右側欄下移到主內容下方；作業頁與案件頁維持雙
  欄。
- 結構：固定左 `Sidebar` 232px（品牌 + 副標、導覽項、底部使用者 + 登出）→ 頂部
  `Topbar` 64px（overline 麵包屑「JEJU · PARTNER WORKSPACE」，右側日期時間與時
  區）→ `PageHeader`（`title-lg` + 一句說明，右側最多一顆 `Button/primary`）→
  內容區。整個框架是 `WorkspaceShell`；頁型欄位是 `PageGrid`（`overview` /
  `operation` / `case`）。
- 內容區內距 `--pn-space-8`；卡片之間間距 `--pn-space-6`。
- 三種頁型：
  1. **總覽頁**（`partner-overview.png`）：`KpiRow`（4 格，垂直分隔線）→ 左
     2/3：`Tabs` + `SearchInput` + `DataTable` + `ActivityTimeline`；右 1/3：
     `TodoPanel`（`TodoCard` 堆疊）。
  2. **作業頁**（`partner-checkin.png`）：頂部 `ResultBanner`（成功／失敗 +
     關聯編號 + 右側狀態）→ 雙欄 1:1 兩張 `Card`，左資料核對、右動作表單，
     每欄底部一顆 `Button/primary` 全寬。
  3. **案件頁**（`partner-change-requests.png`）：`Tabs`（帶計數）→ 左
     `ListPanel` 380px（`SearchInput` + `ListItem` 可選取）+ 右
     `DetailPanel`（標題 + Badge、`KeyValueList`、`Stepper`、表單、
     底部動作列）。
- 資料表最多 6 欄；超過的資訊併入同一欄的第二行（`body-sm`、`--pn-text-2`）。
- 每張卡片底部可放一行 `label` 級的 meta（掃碼時間、最後更新、時區）。

### 3.3 接待端（Reception，手機工作台）

- 尚無版面先例。沿用 §2 全部 token 與玩家端的手機視口規則（≤ 768px、觸控區 ≥
  44×44），但**不**沿用玩家端的 `BottomNav` 五項、`HeroTripCard` 與玩家端文案規
  則。
- 第一張接待端 UI 票（第 22 票）實作前先跑 `/prototype`（UI 分支，2–3 個
  `?variant=`），選定後補寫本節的結構與頁型，並把選擇記在該票 `## Comments`。
- 在那之前（00d 空殼）：接待工作區首頁只用 `PlayerShell` 的 480px
  置中框（`navigation` 為空，不放 `BottomNav`）＋`EmptyState`，沒有導覽與頂列。

### 3.4 拒絕頁（兩個 host 共用）

- 以沒有 session、屬於其他工作區或其他 host 的 session 進入工作區時顯示。版面同
  §3.3 的空殼：`PlayerShell` 置中框（無導覽）＋`EmptyState`（icon
  `shield-alert`、一句拒絕原因，原因以 `role="alert"` 宣告）＋`Button/secondary`
  動作（「前往〇〇工作區」、「登出」）。不顯示被拒絕工作區的任何資料或框架。
- 開發模式的角色切換列（`Button/secondary`「切換角色」＋`Drawer`，每個工作區一張
  `Card`）是開發工具，不屬於 §4 元件目錄，production build 中不存在。

---

## 4. 元件目錄（Components）

命名即規格；票和程式碼都用這些名字。每個元件列出變體與必備狀態。

| 元件 | 變體 | 規格重點 |
|---|---|---|
| `Button` | `primary`（金底深字）、`secondary`（透明底 + `--pn-border-strong` 邊框、白字）、`outline-gold`（透明底 + 金邊金字，手機 Hero 用）、`ghost`（純文字，金色，右側 chevron）、`danger`（透明底紅字） | 高 44px（手機 52px）、內距 0 24px、`--pn-radius-md`、字重 600。狀態：default / hover（底色提亮 6%）/ focus-visible（2px 金色外框）/ disabled（40% 不透明）/ loading（spinner 取代文字）。一個區塊最多一顆 `primary`。可在文字前加一個 20px 線性 icon（例：掃碼報到）。 |
| `WorkspaceShell` | — | 合作端／管理端桌面框架：左 `Sidebar`、上 `Topbar`、下方內容區（內距 `--pn-space-8`，區塊間距 `--pn-space-6`），整體底 `--pn-bg`。五個桌面工作區共用，只換 `Sidebar` 副標、導覽項與麵包屑。 |
| `PageGrid` | `overview`（左 2/3 右 1/3，≤ 1024 單欄）、`operation`（雙欄 1:1，等高）、`case`（左 380px + 右彈性，等高） | §3.2 三種頁型的欄位；欄距 `--pn-space-6`。 |
| `Sidebar` | — | 232px、`--pn-bg`；導覽項高 64px，icon 24 + 文字 `body`；目前項底 `--pn-gold-tint`、左側 3px 金色條、文字與 icon `--pn-gold-bright`。底部 `UserChip` + 登出。副標（工作區名稱）同時是側欄的無障礙名稱。≤ 1024：72px icon 列，品牌縮為「PN」，導覽文字、使用者文字與「登出」只留給輔助科技。 |
| `BottomNav` | — | 手機端固定底部（在 `PlayerShell` 內以 sticky 貼底，內容不被遮住），高至少 72px + `env(safe-area-inset-bottom)`；五項固定順序：首頁、我的行程、到場碼、我的積分、我的帳戶，每項 icon 24 + label `label` 字級，平分寬度、觸控區 ≥ 44×44；非目前項 `--pn-text-2`，目前項 icon + label `--pn-gold-bright` 並標 `aria-current="page"`。 |
| `AppHeader` | — | 玩家端頂列，高至少 64px、透明底、左右內距 `--pn-space-6`。左品牌字標：`POKER` `--pn-text` + `NEXT` `--pn-gold-bright`，`title-sm` 700、字距 `overline` tracking；下方副標 `TRAVEL · PLAY · BELONG` `overline` 字級 `--pn-text-3`。右通知鈴：icon 24 `--pn-text`、44×44 按鈕；有未讀時右上 8px `--pn-gold-bright` 圓點，且按鈕名稱帶「有未讀通知」文字。有行程時放在 `HeroTripCard` 頂部，否則是頁面第一列。 |
| `PlayerShell` | — | 玩家端頁框：`--pn-bg` 底、寬 100%，視口 > 480px 時 480px 置中且左右 1px `--pn-border`；最小高度一個視口；內容在上、`BottomNav` 在最底。 |
| `Topbar` | — | 64px；左 `overline` 麵包屑；右日期／時區 `body-sm` `--pn-text-2`。 |
| `PageHeader` | — | `title-lg` + `body` 說明（`--pn-text-2`）；右側 action slot。 |
| `Card` | `default`、`elevated`（`--pn-surface-2`） | `--pn-surface`、1px `--pn-border`、`--pn-radius-md`；可選 `CardHeader`（`title-md` + 右側狀態 slot，底下 1px 分隔線）；可選底部 meta 列（上方 1px 分隔線、`label` `--pn-text-3`，左右兩端對齊，例：掃碼時間、接待人 + `Button/ghost`）。 |
| `KpiRow` / `KpiTile` | — | icon 32 金色 + label `body-sm` + 數字 `display-md`；tile 之間 1px 垂直分隔線；不用卡片底。 |
| `StatusDot` | `success` / `warning` / `danger` / `info` / `neutral` | 8px 圓點 + 文字（同色）；文字必備。 |
| `Badge` | 同 StatusDot 五色 | 高 22px、`--pn-radius-sm`、1px 同色邊框、底色用對應 `-tint`、字 12px。 |
| `Tabs` | `underline`（頁內）、`segmented`（僅手機） | underline：高 48px；目前項文字 `--pn-gold-bright` 600 + 2px 金底線；可帶計數（`body-sm` 600，與標籤同色）。segmented：`--pn-surface-2` 底軌、`--pn-radius-md`、內距與段距 `--pn-space-1`；各段平分寬度、高至少 44px（觸控區）、`--pn-radius-sm`、文字 `body` `--pn-text-2`；目前段 `--pn-gold` 底 + `--pn-text-inverse` 600（目前位置，不算金底按鈕），無底線。鍵盤（兩種變體相同）：整列只佔一個 Tab 停點（目前項），← → 切換並選取（頭尾循環），Home / End 到第一／最後一項。 |
| `SearchInput` | — | 高 48px、`--pn-surface-2` 底、1px `--pn-border-strong`、左 icon、右清除鍵；placeholder `--pn-text-3`。 |
| `Input` / `Select` / `DateInput` / `Textarea` | 帶前綴（如貨幣）版本 | 同 SearchInput 規格；label 在左（桌面 label/value 表單）或在上（手機）；錯誤狀態邊框 `--pn-danger` + 底下一行錯誤文字；Textarea 右下字數 `label`。 |
| `Checkbox` | — | 20px、選取時金底深色勾；用於「本人核對一致」這類確認。 |
| `DataTable` | `dense`（48px 列）、`regular`（64px 列） | 表頭 `--pn-surface-2`、`body-sm` `--pn-text-2`；列之間 1px `--pn-border`；hover `--pn-surface-3`；第一欄粗體；狀態欄用 `StatusDot`；操作欄用 `Button/secondary` 小尺寸（高 32px）。狀態：loading（表頭 + 骨架列 ×5）/ empty（`EmptyState` 佔滿，不顯示表頭；ready 但沒有列時同樣顯示 empty）/ error（§5 錯誤態）。欄內距 0 12px，第一欄左內距 16px；表頭列 48px。 |
| `KeyValueList` | `stacked`（label 上值下）、`inline`（label 左值右）、`compact`（「label：值」一行） | inline：label 寬 160px `body` `--pn-text-2`，值 `body` `--pn-text`；每列 40px，1px 分隔線；編號／UUID 用 `mono`，長 UUID 可換行並附複製鍵；列尾可放一個 `Button/ghost`（例：檢視確認單）。stacked：label `label` 在上、值 `body` 在下，無分隔線。compact：`body-sm`，label `--pn-text-2` + 全形冒號，值 `--pn-text`，列距 4px，用於 `TodoCard` 這類窄卡。 |
| `ResultBanner` | `success` / `error` / `info` | 高 56px、`--pn-surface`、左 icon + 狀態文字、中間關聯編號、右側 `StatusDot`。 |
| `InfoBox` | — | `--pn-surface-2`、`--pn-radius-md`、左 info icon；標題 `body` 600 + 說明 `body-sm` `--pn-text-2`。 |
| `AmountDisplay` | — | 幣別 `body` + 金額 `display-md` `--pn-gold-bright`；label 在左。 |
| `ListPanel` / `ListItem` | — | 項高 104px；標題 `title-sm` + 右上 `Badge`，第二行人名，第三行編號 `mono` + 時間 `label`（帶時區標記）；每項右側 chevron，選取時底 `--pn-gold-tint`、左側 3px 金條、chevron 轉 `--pn-gold-bright`。面板底 `--pn-surface`、1px 邊框，頂部可放 `SearchInput`。鍵盤：清單只佔一個 Tab 停點（選取項，無選取時第一項），↑ ↓ / Home / End 移動焦點，Enter 或 Space 選取。四態同 `DataTable`（loading 為骨架項 ×3）。 |
| `DetailPanel` | — | `Card`；標題列 `title-md` + `Badge`，下一行「案件編號」`body-sm` `--pn-text-2` + 編號 `mono`；`KeyValueList/inline`；可含 `Stepper`、表單、底部動作列（`primary` + `secondary` 並排，右側 meta）。 |
| `Stepper` | 水平 3–5 步 | 節點 24px：完成＝金底勾、進行中＝金色外圈、未開始＝灰外圈；完成段實線金、未完成段虛線灰；每步下方名稱 + 時間／經手人 `label`。 |
| `ActivityTimeline` | — | 左側綠點連線；每列：時間 `body-sm` 600、事件名 `body` 600、關聯編號 `mono`、說明 `body-sm` `--pn-text-2`；列高至少 52px，列間 1px 分隔線；只寫時間時由所在區塊標明時區。四態同 `DataTable`（loading 為骨架列 ×3）。 |
| `TodoPanel` / `TodoCard` | — | 側欄堆疊；面板 `--pn-surface` + 1px 邊框，標題 `title-md` + 右側 `Button/ghost`，底部可放 `label` meta（最新資料時間與時區）。每卡 1px 邊框；icon 24 `--pn-gold-bright` + 標題 `title-sm` + `Badge`，下一行關聯編號 `mono`，`KeyValueList/compact` 兩三行，底部一顆 `Button/primary` 全寬。四態同 `DataTable`（loading 為骨架卡 ×2）。 |
| `HeroTripCard` | — | 手機首頁全幅圖（`object-fit: cover`，純裝飾圖 `alt=""`；沒有圖時為 `--pn-surface-2` 平面底，不用彩色漸層）；底部 40% 由透明到 `--pn-bg` 的黑色漸層；頂部可放 `AppHeader`；可選問候 `title-md`；內容靠底、內距 `--pn-space-6`；目的地 `display-xl` 白 + 英文 `overline`；日期 `title-sm`；`Button/outline-gold` 高 52px 全寬、右側 chevron，是本屏唯一主要動作。高度隨內容增長（文字 200% 不裁切）。 |
| `StatusStrip` | 3 格 | 手機；可選上方地點列（map-pin icon 24 金色 + 住宿名稱 `title-sm`，底下 1px 分隔線）；三格固定順序住宿／接送／行程（bed、car、file-text icon 24 `--pn-gold-bright`）+ 狀態文字 `body` 置中；格間 1px 垂直分隔線，底部 1px 分隔線。 |
| `PointsPanel` | — | 手機；左「可用積分」（＝帳面餘額 − 有效保留，見 §3.1）`display-lg` `--pn-text`，右「已保留」`display-md` `--pn-text-2`；中間 1px 垂直分隔線；label `body-sm` `--pn-text-2` 在數字上方；數字後接單位「分」（`body`），格式 `25,000 分`。沒有積分紀錄時不渲染，改用 `EmptyState`（不顯示 0）。 |
| `ContactRow` | — | 手機；列高至少 64px、內距 `0 --pn-space-6`、底部 1px 分隔線；左 user icon 24 `--pn-gold-bright`；中間角色 + 姓名 `title-sm`（如「接待人 Amy」），可選第二行說明 `body-sm` `--pn-text-2`（服務時段帶時區）；右側可選 `Button/ghost`（如「聯繫接待人」）。 |
| `EmptyState` | — | 置中 icon 32 `--pn-text-3` + 一句原因（`body` `--pn-text-2`）+ 可選 `Button/secondary`；高度至少 240px。 |
| `Modal` / `Drawer` | — | `--pn-surface`、`--pn-radius-lg`、唯一允許陰影；標題 `title-md`；底部動作列右對齊 `secondary` + `primary`。 |
| `Toast` | success / error | 右上（桌面）／底部導覽上方（手機）；`--pn-surface-3`；左側 `StatusDot`。 |
| `UserChip` | — | 側欄底部；icon + 姓名 `body` + 角色 `label`；可附 `Badge/neutral`（例：示意資料）。 |

---

## 5. 狀態與文案規則

- 每個資料容器（表格、列表、面板）都要實作四態：**loading / empty / error /
  ready**。empty 一定給原因（「本次行程尚未建立」），不是「沒有資料」。
  - loading：骨架列，灰條 `--pn-surface-3`、高 12px、`--pn-radius-sm`，列高與
    ready 相同；緩慢明暗脈動（`prefers-reduced-motion` 時停止）；另附「載入中」
    給輔助科技。
  - error：與 `EmptyState` 同版面（置中、至少 240px）：icon 32 `--pn-text-3` +
    `StatusDot/danger`「載入失敗」+ 一句原因 `body` `--pn-text-2` + 可選
    `Button/secondary`「重新載入」；`role="alert"`。
- 玩家端禁止「再打多久就能免費住宿」等促打文案（第 13 票）；文案資源集中管理以便
  測試檢查。
- 時間一律顯示時區標記（例：`2026/09/11 11:08 · 韓國時間`）。
- 金額格式 `KRW 300,000`（幣別前綴 + 千分位）；積分 `25,000 分`。
- 編號固定字型 `mono`：行程 `TR-`、案件 `CHG-`、住宿確認 `GHJ-`、天城會員
  `TC-`。
- 合作端所有畫面**不得**出現歸屬歷史、業績、行銷費、其他場館活動、內部備註（第
  30 票）；這是資料層規則，但 UI 也不得預留這些欄位。

---

## 6. 無障礙與品質門檻（每張 UI 票的預設驗收）

- 文字對比：`--pn-text` / `--pn-text-2` 在 `--pn-surface` 上 ≥ 4.5:1；
  `--pn-text-3` 只用於非必要資訊。
- 狀態不只以顏色表示（圓點必帶文字；Badge 必帶文字）。
- 鍵盤可操作所有主要流程；focus-visible 為 2px `--pn-gold` 外框。
- 觸控區 ≥ 44×44 CSS px（手機）；桌面可點元素 ≥ 32px 高。
- 手機端文字放大 200% 主要流程仍完整。
- 圖片有替代文字；純裝飾圖 `alt=""`。

---

## 7. 票（ticket）與畫面對照

涉及畫面的票必須在票內加 `**UI:**` 段（格式見 `docs/agents/issue-tracker.md`）。
以下是目前 spec 各票的建議對照；拆新票時比照。

| 票 | Surface | 頁型 / 參考圖 | 主要元件 |
|---|---|---|---|
| 06 Lead 與潛客聯繫紀錄 | 管理端 | 案件頁（`partner-change-requests.png`） | ListPanel、DetailPanel、KeyValueList、Textarea |
| 07 會員申請表單 | 玩家端（未登入，手機優先 RWD） | 表單流程（無參考圖：手機多步表單 + Stepper） | Stepper、Input、檔案上傳、InfoBox、Button/primary |
| 08 審核工作台 | 管理端 | 作業頁（`partner-checkin.png`）三欄變體 | ResultBanner、Card×3（輸入值 / OCR / 證件原圖）、Badge、Button |
| 10 OTP 登入 | 玩家端 | 單欄手機頁 | Input（6 位 OTP）、Button/primary、InfoBox |
| 12 客戶詳情頁 | 管理端 | 案件頁 | Tabs、KeyValueList、ActivityTimeline、Badge |
| 13 玩家端五項導覽與會員中心 | 玩家端 | `player-home-mobile.png` | AppHeader、HeroTripCard、StatusStrip、PointsPanel、ContactRow、BottomNav、EmptyState |
| 19 到場 QR 與櫃檯報到 | 玩家端（QR 頁）＋合作端（`partner-checkin.png`） | 作業頁 | ResultBanner、KeyValueList、Checkbox、Button/primary |
| 21 續住／改期／取消 | 玩家端（申請）＋合作端（`partner-change-requests.png`） | 案件頁 | Tabs（帶計數）、ListPanel、DetailPanel、Stepper |
| 23 期初積分導入、會員積分頁 | 管理端（匯入）＋玩家端（積分頁） | 作業頁 ＋ 手機列表 | DataTable、AmountDisplay、EmptyState |
| 24 每日積分 Excel 匯入 | 管理端 | 作業頁：上傳 → 差額預覽 DataTable → 核准 | ResultBanner、DataTable/dense（新增／未變／更正／缺列用 Badge）、Button/primary |
| 26 結算確認與核對單 | 玩家端（確認）＋合作端（核對） | 作業頁 | KeyValueList、AmountDisplay、Checkbox、Button/primary |
| 27 天城押金四軸 | 合作端 | `partner-checkin.png` 右欄 ＋ 押金紀錄 DataTable | AmountDisplay、Input（幣別前綴）、DateInput、DataTable |
| 30 合作端現場 UI | 合作端 | `partner-overview.png` | KpiRow、Tabs、SearchInput、DataTable、TodoPanel、ActivityTimeline |
| 31 活動與推播 | 管理端 | 案件頁 | ListPanel、DetailPanel、表單 |
| 32 報表匯出 | 管理端 | 總覽頁變體 | KpiRow、DataTable、Button/secondary |

---

## 8. 給實作 agent 的流程

1. 讀本文件與票內 `**UI:**` 段指定的參考圖。
2. 若專案已有元件庫（`src/components/ui` 或同等位置），先用現成元件；
   沒有的元件依第 4 節規格新增，並以表中的名字命名。
3. 畫面在本文件沒有先例（頁型不在 3.1 / 3.2 之內）時，先用 `/prototype` 的 UI
   分支產 2–3 個 `?variant=` 版本，在票的 `## Comments` 記錄選擇與理由，
   再正式實作。
4. 完成前用 Playwright 對每個頁面截圖（桌面 1440×1024；手機 390×844；各含 empty
   與 ready 兩態），與參考圖並排自查：明度階、金色用量、字級、對齊。
   把截圖路徑寫進票的 `## Comments`。
5. 發現本文件缺漏或錯誤時，修本文件，不要在程式碼裡繞過。

---

## 9. 互動原型

`docs/design/prototype/pokernext-prototype.html` 是六個端（玩家／天城／管理
／Platform admin／員工／Agent）的可操作全保真原型：單檔、無後端、
六端共用一份記憶體狀態，一端的操作立即反映到其他端。左上角切換角色，
右下角「示範劇本」列出 Alex 濟州行程 13 步主流程並可逐步前往。

用途：拆票時作為畫面與互動的參考（票的 `**UI:**` 段可直接指到原型的路由，例如
`#/venue/checkin`）；實作時作為「應該長什麼樣、按下去會發生什麼」的對照。
原型中的資料為示意，非正式紀錄；規格衝突時以本文件與 PRD 為準。
