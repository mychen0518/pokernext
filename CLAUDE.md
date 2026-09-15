# POKERNEXT_Claude

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`. Stack and repo shape: `docs/adr/0001-stack-and-repo-shape.md`.

### Coding standards

`docs/CODING_STANDARDS.md` — read by `/code-review`, not by implementers. Base style is the Google Style Guides (TypeScript via `gts`, HTML/CSS, Markdown, JSON); implementers get them through lint, reviewers through the standards file.

### How we run the process

`docs/RUNBOOK.md` — the step-by-step order of skills for this repo. Foundation work (design-system package, domain core, demo toolchain) is `.scratch/pokernext-foundation/` and blocks `.scratch/pokernext-platform/issues/01`.

## Code style

All code follows the Google Style Guides. Before writing any TypeScript, CSS/HTML, Markdown, JSON or a commit message, load the `google-style` skill (`.claude/skills/google-style/SKILL.md`); `gts` enforces the mechanical parts in pre-commit, `docs/CODING_STANDARDS.md` is what `/code-review` checks.

## UI design

The visual spec for every screen is `docs/design/DESIGN.md` (tokens, layouts, component catalogue, state rules, ticket-to-screen map). Reference mockups live in `docs/design/references/`.

- **Planning / ticketing** (`/to-spec`, `/to-tickets`, `/grill-*`): any spec or ticket that touches a screen must name its surface (玩家端 / 合作端 / 管理端), the page type, the reference image, and the DESIGN.md components it uses, in a `**UI:**` section (format in `docs/agents/issue-tracker.md`). Add at least one visual acceptance criterion per UI ticket.
- **Implementing** (`/implement`, `/implement-spec`, implementer subagents): before writing UI code, read `docs/design/DESIGN.md` and the ticket's referenced image. Use only DESIGN.md component names and tokens; extend DESIGN.md rather than inventing styles. If a screen has no layout precedent in DESIGN.md §3, run `/prototype` (UI branch, 2–3 `?variant=` options) first and record the choice in the ticket's `## Comments`. Before finishing, take Playwright screenshots (desktop 1440×1024, mobile 390×844, empty + ready states), compare against the reference image, and note the screenshot paths in the ticket.
- **Reviewing** (`/code-review`): flag any hard-coded colour, font, spacing, or radius that is not a DESIGN.md token, any status shown by colour alone, and any missing loading / empty / error state.
