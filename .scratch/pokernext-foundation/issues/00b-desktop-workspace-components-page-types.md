# 00b: 桌面工作區元件與三種頁型

**What to build:** 合作端與管理端共用的版面與資料元件。kitchen-sink 以這些元件和原型的示範資料組出 DESIGN.md §3.2 的總覽頁、作業頁、案件頁，並與三張參考圖並排比對。之後場館、管理、平台治理、Agent 工作區的畫面都由這些元件組成。

**Blocked by:** 00a

**Status:** ready-for-agent

**UI:**
- Surface: 合作端、管理端
- Page type: DESIGN.md §3.2 總覽頁、作業頁、案件頁（在 kitchen-sink 以示範資料組合）
- Reference: `docs/design/references/partner-overview.png`、`docs/design/references/partner-checkin.png`、`docs/design/references/partner-change-requests.png`
- Components: Sidebar、Topbar、PageHeader、UserChip、KpiRow／KpiTile、Tabs、SearchInput、DataTable（dense／regular）、KeyValueList、ResultBanner（success／error／info）、ListPanel／ListItem、DetailPanel、Stepper、ActivityTimeline、TodoPanel／TodoCard
- States: DataTable、ListPanel、TodoPanel、ActivityTimeline 各有 loading／empty／error／ready；≤ 1024px 側欄收合

- [x] 上列元件都能從套件的根入口 import，名稱與 DESIGN.md §4 一致
- [x] 三種頁型在 1440×1024 截圖，與對應參考圖並排；結構符合 §3.2：Sidebar 232px、Topbar 64px、總覽頁左 2/3 右 1/3、作業頁雙欄 1:1、案件頁 ListPanel 380px
- [x] 三種頁型納入 00a 的截圖測試，寬度 1440、1280、1024 各一張基準圖
- [x] DataTable、ListPanel、TodoPanel、ActivityTimeline 各有四態範例；loading 為骨架列，empty 用 EmptyState 帶原因，不顯示 0 或空表格
- [x] DataTable 最多 6 欄；狀態欄用 StatusDot 且帶文字
- [x] ≤ 1024px 時 Sidebar 收合為 icon 列，右側欄移到主內容下方
- [x] Sidebar 目前項為 gold-tint 底加左側 3px 金條；Tabs 與 ListItem 可用鍵盤切換與選取
- [x] 示範資料遵守 DESIGN.md §5：時間帶時區標記、金額 `KRW 300,000`、編號用 mono；值取自原型字面值（琪琪、TR-260911-028……），不複製原型 JS
- [x] 合作端頁型的示範資料不出現歸屬歷史、業績、行銷費、內部備註欄位
- [x] 截圖路徑寫進本票 `## Comments`

## Comments

### 2026-09-15 implementer

**Screenshots (UI evidence, committed, separate from test baselines),**
all in `.scratch/pokernext-foundation/screenshots/00b/`:

- `overview_desktop_1440.png`, `operation_desktop_1440.png`,
  `case_desktop_1440.png` (1440×1024 viewport) and `*_desktop_1440_full.png`
  (full page)
- `overview_collapsed_1024.png`, `operation_collapsed_1024.png`,
  `case_collapsed_1024.png` (1024 wide, full page: icon rail, 待辦事項 under
  the main column)
- `overview_empty_1440.png`, `case_empty_1440.png` (`&state=empty`)
- `desktop_states_1440.png` (`?page=desktop-states`, full page)
- `side_by_side_overview.png`, `side_by_side_operation.png`,
  `side_by_side_case.png` (1440 screenshot left, reference image right)

Side-by-side check: structure (Sidebar, Topbar, PageHeader, KpiRow,
2/3–1/3, 1:1, 380px + detail), brightness steps (bg → surface →
surface-2), gold only on primary buttons, current nav item, tab underline,
KPI icons and key amount. Fixed after the first pass: TodoCard facts were
label-above-value and made the side column twice as tall as the reference
(now `KeyValueList/compact`); 酒店入住 moved out of the inline list on the
case page; the Sidebar border now runs the full page height.

Remaining visible differences, all deliberate (DESIGN.md wins over the
image): KPI and AmountDisplay numbers in serif; AmountDisplay currency in
white; 查看 is `Button/secondary`; UserChip badge is `Badge/neutral`; tabs
use `body`; the 掃描下一位 header button is secondary; confirmation boxes
start unchecked; the search clear button appears only when there is text;
case tabs filter the list, so the counts come from the fixture (01 / 02).

**Screenshot baselines** (desktop project only, full page, per platform):
`packages/ui/tests/screenshots/kitchen_sink_desktop_workspace.spec.ts/`
`{overview,operation,case}-{1440,1280,1024}-desktop-win32.png` and
`desktop-states-desktop-win32.png`. 00a baselines are unchanged and pass.

**Commands:**

```sh
KITCHEN_SINK_PORT=5174 pnpm --filter @pokernext/ui kitchen-sink
# /?page=overview | operation | case | desktop-states
# /?page=overview&state=loading|empty|error (also case)
pnpm typecheck && pnpm lint && pnpm lint:boundaries && pnpm test:unit
KITCHEN_SINK_PORT=5174 pnpm --filter @pokernext/ui test:e2e
```

**Tests:**

- `tests/kitchen_sink_desktop_workspace.spec.ts`: 10 screenshot baselines.
- `tests/desktop_workspace_layout.spec.ts`: Sidebar 232 / Topbar 64 /
  ListPanel 380 at 1440; overview 2:1 side by side at 1440 and 1280;
  operation columns equal with equal full-width primary buttons; at 1024 the
  sidebar is ≤ 80px and 待辦事項 sits under the main column with the same x
  and width.
- `tests/desktop_workspace_keyboard.spec.ts`: overview Tabs switch with
  ← → (wrapping) and Home; the tab list is one Tab stop; a case is picked
  with Tab, ↓, Enter and ↑, Space, and the DetailPanel follows.
- Checked red: removing the ArrowRight case, the Enter key in ListItem and
  widening the rail to 96px failed the keyboard, layout and 1024 screenshot
  tests; reverted.
- Vitest scanner extended: it now also scans `kitchen_sink/**/*.module.css`,
  rejects literal `box-shadow` and `letter-spacing` values, and checks that
  only `overlay.module.css` (Modal/Drawer) uses `--pn-shadow-overlay`.

**Components** (root exports of `@pokernext/ui`): WorkspaceShell,
PageGrid, Sidebar, Topbar, PageHeader, UserChip, KpiRow/KpiTile, Tabs,
SearchInput, DataTable, KeyValueList, ResultBanner, ListPanel/ListItem,
DetailPanel, Stepper, ActivityTimeline, TodoPanel/TodoCard, and the
`DataState` type.

**Decisions:**

- DESIGN.md extended in the same change: `WorkspaceShell` and `PageGrid`
  rows in §4; collapsed rail 72px in §3.2 and Sidebar; Tabs and ListPanel
  keyboard behaviour; `KeyValueList/compact` (TodoCard now uses it instead
  of `stacked`, matching the reference); Card meta line; Button icon; the
  loading skeleton and error state appearance in §5.
- Base components changed additively: `Button` got an optional `icon`,
  `Card` an optional `meta` footer. No 00a baseline changed.
- Kitchen-sink: `KitchenSinkPage.fullBleed` renders a page without the
  catalogue padding and `<main>` wrapper (WorkspaceShell has its own
  `<main>`). Demo data is in `kitchen_sink/fixtures/partner_workspace.ts`.
- Error state is a private component (`lib/container_states.tsx`):
  `StatusDot/danger` 載入失敗, reason and optional 重新載入. A `ready`
  container with no rows renders its empty state, so an empty table never
  shows. DataTable throws if given more than 6 columns.
- Time zone: full timestamps carry `· 韓國時間`; short times in the
  ActivityTimeline and Stepper rely on the block label (時間為韓國時間) or
  the panel's 最後更新 meta.
- Partner data: no attribution, performance, marketing fee, other venue or
  internal note fields. The case form field is 處理說明 (the venue's own
  processing note) rather than the reference's 處理備註, to avoid any
  reading as an internal note.
- No business rules: buttons are not disabled until the confirmation is
  ticked (that belongs to tickets 19 and 21). No new dependencies.

**Open issues:**

- DESIGN.md §2.1 allows one gold-fill button per screen, but §3.2 (a primary
  at the bottom of each 作業頁 column) and §4 TodoCard (a primary per card)
  require several. I followed §3.2 and §4; the rule needs an owner decision.
- Tabs `segmented` (mobile) is not implemented here.
- At 1440×1024 the case page's DetailPanel actions sit below the fold (the
  40px inline rows are taller than the reference's); the full-page baseline
  covers them.
- In `&state=empty|loading|error` variants the KpiRow still shows the demo
  figures; KpiTile has no state spec in DESIGN.md.
- For the 00c merge: the extended scanner rejects literal `letter-spacing`
  and `box-shadow` in any `packages/ui` CSS Module.
