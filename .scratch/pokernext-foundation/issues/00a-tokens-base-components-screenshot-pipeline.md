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

- [x] kitchen-sink 有 token 區，列出 DESIGN.md §2 每個顏色、字級、間距、圓角 token 的名稱與樣本
- [x] 上列元件都能從套件的根入口 import，名稱與 DESIGN.md §4 一致
- [x] 元件樣式內沒有任何非 token 的顏色、字型、間距、圓角字面值；不引入 Tailwind 主題或第三方元件庫
- [x] kitchen-sink 列出每個元件的全部變體，以及 Button 的五種互動狀態
- [x] Playwright 截圖測試在 1440×1024 與 390×844 對 kitchen-sink 截圖，與已提交的基準圖比對，差異超過門檻即失敗；更新基準圖需要明確的指令
- [x] 視覺：金色只出現在 primary、outline-gold、ghost 與 focus 外框；Card 無陰影、圓角不超過 8px；Modal／Drawer 是唯一有陰影的元件
- [x] StatusDot 與 Badge 在 kitchen-sink 中都帶文字，沒有只靠顏色表示狀態的範例
- [x] 鍵盤 Tab 可走過所有互動元件，focus-visible 為 2px 金色外框
- [x] 自動檢查：`--pn-text`、`--pn-text-2` 在 `--pn-surface` 上對比 ≥ 4.5:1
- [x] kitchen-sink 不出現在 production build
- [x] 截圖路徑寫進本票 `## Comments`

## Comments

### 2026-09-15 implementer

**Screenshots (UI evidence, committed, separate from test baselines):**

- `.scratch/pokernext-foundation/screenshots/00a/kitchen_sink_base_desktop.png`
  (1440×1024, scrolled to the Button section)
- `.scratch/pokernext-foundation/screenshots/00a/kitchen_sink_base_desktop_full.png`
- `.scratch/pokernext-foundation/screenshots/00a/kitchen_sink_base_mobile.png`
  (390×844, scrolled to the Button section)
- `.scratch/pokernext-foundation/screenshots/00a/kitchen_sink_base_mobile_full.png`
- `.scratch/pokernext-foundation/screenshots/00a/side_by_side_desktop.png`
  (vs `docs/design/references/partner-overview.png`)
- `.scratch/pokernext-foundation/screenshots/00a/side_by_side_mobile.png`
  (vs `docs/design/references/player-home-mobile.png`)

Side-by-side check: background steps (bg → surface → surface-2) and the
gold primary / outline-gold / ghost treatment match the references; cards
are flat. The kitchen-sink has no "empty vs ready" states of its own; the
EmptyState examples carry a reason.

**Screenshot baselines:**
`packages/ui/tests/screenshots/kitchen_sink_base.spec.ts/base-{desktop,mobile}-win32.png`
(full page, per platform because fonts differ per OS).

**Commands:**

```sh
pnpm --filter @pokernext/ui kitchen-sink        # http://127.0.0.1:5173/?page=base
pnpm test:unit                                  # contrast + no-literal CSS checks
pnpm --filter @pokernext/ui test:e2e            # screenshot diff + keyboard focus
pnpm --filter @pokernext/ui test:e2e:update     # explicit baseline rewrite
```

Flow for later UI tickets is in `packages/ui/README.md`
(page registry `kitchen_sink/page_registry.ts`, `/?page=<id>&state=…`).

**Decisions:**

- Typography tokens: each DESIGN.md type token `<name>` is
  `--pn-type-<name>-family|-size|-line|-weight`, plus
  `--pn-type-overline-tracking`. New tokens added to DESIGN.md §2 and
  `tokens.css`: `--pn-scrim`, `--pn-radius-round` (circles only),
  `--pn-shadow-overlay` (Modal/Drawer shadow), `--pn-focus-ring`,
  `--pn-focus-offset`. `Consolas` added to `--pn-font-mono` so IDs render
  monospaced on Windows.
- Button states: hover and focus-visible are pinned statically with
  `data-state="hover" | "focus-visible"` on `Button`; disabled and loading
  are real props. Sizes `sm` 32px / `md` 44px / `lg` 52px.
- Modal and Drawer are shown open inside frames with `transform`, which
  contain their `position: fixed` scrim. They close on Escape, the close
  button and a scrim click; focus trapping is not implemented yet.
- Toast is the notice only; placement (top right / above BottomNav) is left
  to the page.
- Screenshot tolerance: per-pixel `threshold: 0.02` and the stricter of
  `maxDiffPixels: 200` / `maxDiffPixelRatio: 0.01`. Checked that changing
  the Card border from `--pn-border` to `--pn-border-strong` fails the test
  (the default threshold 0.2 did not catch it).
- Keyboard: `tests/keyboard_focus.spec.ts` Tabs through `?page=base` and
  asserts every enabled interactive element is reached in DOM order with a
  computed `2px solid rgb(200, 168, 111)` outline. Checked red by removing
  the Checkbox focus rule.
- Production exclusion proof: new dependency-cruiser rule
  `kitchen-sink-is-dev-only` (only files in `packages/ui/kitchen_sink/` may
  import it). A deliberate `export … from './kitchen_sink/page_registry'` in
  `packages/ui/index.ts` failed `pnpm lint:boundaries` with
  `kitchen-sink-is-dev-only: packages/ui/index.ts →
  packages/ui/kitchen_sink/page_registry.ts`; the violation was removed.
  `packages/ui` has no build step; 00d adds the Next.js build test.
- Gold criterion: component chrome uses gold only in Button primary /
  outline-gold / ghost and the focus ring. Gold also appears where DESIGN.md
  §4 requires it (checked Checkbox fill, AmountDisplay amount) and in the
  token swatches. Only Modal/Drawer use a shadow; Card radius is 6px.

**Repo-wide changes needed to land this (may overlap with platform 01):**

- `vitest.config.ts` at the root limits Vitest to `**/tests/**/*.test.ts(x)`;
  without it Vitest collected the Playwright `*.spec.ts` files.
- `@types/node` in root devDependencies and `"types": ["node"]` in
  `tsconfig.base.json` (TypeScript 6 no longer includes `@types` by default).
- `css_modules.d.ts` also declares plain `*.css` side-effect imports.

**Observation:** `--pn-danger` text (danger Button, error line) is about
3.9:1 on `--pn-bg`, under 4.5:1; DESIGN.md §6 only gates `--pn-text` and
`--pn-text-2`, so it is left as specified.
