# 00c: 玩家端手機元件與首頁組合

**What to build:** 玩家端的手機版面與首頁元件。kitchen-sink 以這些元件和原型的示
範資料組出 DESIGN.md §3.1 的玩家首頁（ready 與 empty 兩態），並與參考圖並排比
對。第 13 票直接用這些元件做正式首頁。

**Blocked by:** 00a

**Status:** ready-for-agent

**UI:**
- Surface: 玩家端
- Page type: DESIGN.md §3.1 首頁（在 kitchen-sink 以示範資料組合）
- Reference: `docs/design/references/player-home-mobile.png`
- Components: AppHeader、BottomNav、HeroTripCard、StatusStrip、PointsPanel、
  ContactRow、EmptyState、Button/outline-gold
- States: ready（Alex 的濟州行程）；empty（沒有行程、沒有積分紀錄）

- [x] AppHeader 與 ContactRow 先補進 DESIGN.md §4 元件目錄（變體與規格重點），
  與元件在同一個變更
- [x] 上列元件都能從套件的根入口 import，名稱與 DESIGN.md §4 一致
- [x] 首頁 ready 與 empty 在 390×844 截圖，與參考圖並排，並納入 00a 的截圖測試；
  桌面寬度以 480px 置中容器呈現
- [x] empty 狀態用 EmptyState 帶原因，不顯示 0、空表格或「已完成」
- [x] BottomNav 固定五項（首頁、我的行程、到場碼、我的積分、我的帳戶），
  目前項金色，底部含 safe-area
- [x] 觸控區 ≥ 44×44 CSS px；文字放大 200% 時首頁內容仍完整、不重疊
- [x] 一屏只有一個主要動作，位於 HeroTripCard 內或內容底部
- [x] PointsPanel 左為可用積分、右為已保留，中間垂直分隔線；積分格式 `25,000 分`
- [x] 示範文案沒有促打文案（「再打多久就能免費住宿」之類）；值取自原型字面值，
  不複製原型 JS
- [x] 截圖路徑寫進本票 `## Comments`

## Comments

### 2026-09-15 implementer

**Screenshots (UI evidence, committed, separate from test baselines):**

- `.scratch/pokernext-foundation/screenshots/00c/player_home_ready_mobile.png`
  (390×844)
- `.scratch/pokernext-foundation/screenshots/00c/player_home_ready_mobile_end.png`
  (390×844, scrolled to the end: ContactRow above BottomNav)
- `.scratch/pokernext-foundation/screenshots/00c/player_home_empty_mobile.png`
  (390×844)
- `.scratch/pokernext-foundation/screenshots/00c/player_home_ready_desktop.png`
  and `player_home_empty_desktop.png` (1440×1024, 480px centred container)
- `.scratch/pokernext-foundation/screenshots/00c/player_home_ready_mobile_text_200_full.png`
  and `player_home_empty_mobile_text_200_full.png` (every font size doubled;
  full-page capture, so the sticky BottomNav is drawn at the first viewport's
  bottom)
- `.scratch/pokernext-foundation/screenshots/00c/side_by_side_ready.png` and
  `side_by_side_empty.png` (vs `docs/design/references/player-home-mobile.png`)

Side-by-side check: order and proportions match the reference (header over the
hero, hero with greeting, destination, overline, dates and the outline-gold
button, place row, three status cells with dividers, points with the vertical
divider, contact row, five-item nav with the current item gold). Known
differences, all deliberate:

- The hero is a flat grey SVG stand-in, not a photo (see Decisions), so the hero
  is darker and quieter than the reference.
- 可用積分 shows **5,000 分**, not 30,000: the prototype renders
  `ledger − reserved` (30,000 − 25,000) as 可用積分 and 25,000 as 已保留; the
  reference image shows the ledger. Values follow the prototype as the brief
  asked; the fixture holds the literals, nothing is computed.
- Dates are the prototype's `09/11 – 09/13 · 2 晚` (reference: 09/10 – 09/13 · 3
  晚).
- The hero button is full width (DESIGN.md §4) instead of the reference's half
  width; the nav home icon is outline, not filled (DESIGN.md §2.4 forbids filled
  icons); no gold rule under the greeting.
- ContactRow carries the prototype's second line 服務時段 09:00–22:00
  （韓國時間） (DESIGN.md §5 time zone rule), which pushes the row just below
  the first 844px fold.

**Screenshot baselines:**
`packages/ui/tests/screenshots/kitchen_sink_player_home.spec.ts/`
`player-home-{ready,empty}-{mobile,desktop}-win32.png` and
`player-home-ready-end-mobile-win32.png`. 00a's `base-*` baselines are unchanged
and still pass (no base component changed).

**Commands:**

```sh
pnpm --filter @pokernext/ui kitchen-sink   # /?page=player-home&state=ready|empty
pnpm typecheck && pnpm lint && pnpm lint:boundaries
pnpm test:unit                             # 10 passed
KITCHEN_SINK_PORT=5175 pnpm --filter @pokernext/ui test:e2e   # 17 passed, 9 skipped
```

The 9 skips are the phone-only gates and the scrolled shot in the desktop
project.

**Tests:**

- `tests/kitchen_sink_player_home.spec.ts`: screenshot comparison for ready and
  empty in both projects, plus the scrolled end at 390×844.
- `tests/player_home_accessibility.spec.ts` (390×844 only): every interactive
  element ≥ 44×44; at 200% text no horizontal scroll, no text run clipped by an
  overflow container or the viewport, no two text runs overlapping, content end
  above the nav; BottomNav has exactly the five items in order, one
  `aria-current="page"` (首頁) in `--pn-gold-bright`, others not gold, ≥ 72px
  tall at the screen bottom; empty state gives reasons without 0, 已完成 or a
  table; ready shows `5,000 分` / `25,000 分`. Checked red: a 32px bell, a 72px
  nav with `overflow: hidden` and the kitchen-sink link colour overriding the
  nav (found and fixed during implementation) all fail.
- `tests/player_copy_has_no_play_more_prompts.test.ts`: scans the copy module
  `kitchen_sink/pages/player_home_copy.ts` and the built-in labels of AppHeader,
  BottomNav and PointsPanel for 再打多久, 再玩多久, 免費住宿, 免費入住,
  就能免費, 即可免費, 還差, 再累積. The files are read as text, so the dev-only
  kitchen-sink stays unimportable from tests.
- `tests/component_styles_use_tokens.test.ts` extended: also scans
  `kitchen_sink/**/*.module.css`, and flags literal `letter-spacing`, literal
  `box-shadow`/`text-shadow`, and gradients using any token other than
  `--pn-bg`/`--pn-scrim`.

**Decisions:**

- DESIGN.md §4: added `AppHeader`, `ContactRow` and `PlayerShell` (480px centred
  frame, needed by ticket 13 too); detailed `BottomNav` (item order, sticky,
  `aria-current`), `HeroTripCard` (header slot, greeting, image or
  `--pn-surface-2` placeholder, chevron, grows with text), `StatusStrip`
  (optional place row for the hotel, fixed bed/car/file-text cells) and
  `PointsPanel` (unit 分, not rendered without a points record). §3.1 mentions
  `PlayerShell` and the header inside the hero.
- Hero image: the prototype has no photo, only coloured radial gradients and an
  SVG skyline, which DESIGN.md §1 forbids. The component takes
  `image={{src, alt}}` and falls back to a flat `--pn-surface-2` block; the
  kitchen-sink passes the committed
  `kitchen_sink/assets/jeju_night_placeholder.svg` (flat greys from §2, a few
  dim `--pn-gold-dim` lights, no gradient) with `alt=""` because it is
  decorative. Ticket 13 chooses the real photo source.
- AppHeader sits inside `HeroTripCard` (`header` slot) in normal flow instead of
  being absolutely positioned over it, so at 200% text the wordmark never
  overlaps the greeting.
- BottomNav is `position: sticky; bottom: 0` as the last child of `PlayerShell`,
  so it stays at the screen bottom but never covers the end of the content,
  whatever its height at large text. It pads `env(safe-area-inset-bottom, 0)`;
  apps/web must add `viewport-fit=cover` to its viewport meta for the inset to
  be non-zero (the kitchen-sink `index.html` was left unchanged).
- 200% text: all type tokens are px, so doubling the root font size alone
  changes nothing. The test doubles every element's computed font size
  (text-only zoom), which is what the gate means.
- Empty state: AppHeader, greeting, `EmptyState` 目前沒有進行中的行程 with a
  `Button/secondary` 申請行程 (DESIGN.md §4 EmptyState action), divider,
  `EmptyState` 尚無積分紀錄. No primary action on that screen; the ready
  screen's only main action is the hero `Button/outline-gold`.
- The kitchen-sink frame padding is removed for this page only, from the page's
  own CSS Module
  (`:global(.pn-kitchen-sink[data-kitchen-sink-page='player-home'])`), so
  `main.tsx` and `kitchen_sink.css` stay untouched for the 00b merge.
- Nav links point back to `?page=player-home`; the real routes belong to
  ticket 13. No new dependencies.

### 2026-09-15 review fixes

- 可用積分 5,000 vs 30,000, decided: PRD 5.7.4 (「新申請只能使用扣除所有有效保留
  後的可用積分」), PRD 6.7.1 (member sees 帳面餘額, 有效保留 and 可用積分
  separately) and ticket 25 (「帳面 60,000、正式保留 50,000 → 可用 10,000」)
  define 可用積分 as 帳面餘額 minus 有效保留. The foundation spec story 6
  literal 30,000 分 is Alex's 帳面餘額 (prototype seed
  `ledger:30000, reserved:25000`), so the home keeps 可用積分 **5,000 分** and
  已保留 **25,000 分**. The reference image labelling 30,000 as 可用積分 is
  illustrative only. The home `PointsPanel` has no ledger figure; 帳面餘額
  belongs to the 我的積分 page (tickets 23 and 25). Recorded in DESIGN.md §3.1
  and the `PointsPanel` row; the fixture comment in
  `kitchen_sink/pages/player_home_copy.ts` cites the PRD, and the accessibility
  test is named for Alex's 30,000 分 balance. Values unchanged, so no baseline
  changed.
- Hero placeholder: `kitchen_sink/assets/jeju_night_placeholder.svg` (hard-coded
  hex) was replaced by `kitchen_sink/pages/jeju_night_placeholder.ts`, which
  builds the same night-coast SVG as a data URL at render with fills read from
  the loaded `--pn-*` tokens (an `<img>` cannot resolve custom properties).
  Player-home baselines are pixel-identical.
  `tests/component_styles_use_tokens.test.ts` now also fails on hex, functional
  or named colour literals in `lib/**/*.ts(x)` and
  `kitchen_sink/**/*.{ts,tsx,svg,html}`.
