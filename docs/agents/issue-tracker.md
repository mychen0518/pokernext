# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.

## UI section in tickets

Any ticket that touches a screen carries a `**UI:**` block directly after `**Status:**`, before the acceptance checklist. It is the only place an implementer looks for what the screen should look like, so it points at `docs/design/DESIGN.md` rather than restating it:

```md
**UI:**
- Surface: 玩家端 | 合作端 | 管理端
- Page type: <one of DESIGN.md §3 page types, or "no precedent → /prototype first">
- Reference: `docs/design/references/<file>.png` (or "none")
- Components: <DESIGN.md §4 component names, with variants>
- States: <which of loading / empty / error / ready need specific content, and what the empty reason says>
```

Add at least one visual acceptance criterion to the checklist (e.g. "狀態欄用 StatusDot，不只以顏色表示"). Tickets without UI omit the block entirely.
