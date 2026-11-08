# DS-03 Selective Palette Adoption Decision

## 1. Metadata

- **Author:** Vuowng
- **Date:** 2026-11-06 (Asia/Ho_Chi_Minh)
- **Branch:** `improve/vuongnq/2729_sync_CL`
- **Revision:** `5fc4be3fae39aaa5d26099804f440a1061a102ab`
- **Task:** Synchronize the approved selective internal-palette adoption decisions into shared Design System documentation and the directly affected Codex styling rule.
- **Scope:** Documentation only. No application/runtime implementation, no commit.

## 2. Scope and risk

**SAFE — decision-documentation update.** The starting worktree was clean. Updated the current Color System guidance, the Status System's current-implementation note, the Codex styling rule that contained the superseded brand value, and this report. Preserved the prior DS-03 audit and pre-adoption review files unchanged.

`CLAUDE.md` and `.claude/` were not read or modified. The shared Design System is updated as the common reference; only `.codex/rules/10-styling.md` is updated for Codex. No profile synchronization was attempted.

## 3. Approved decisions incorporated

**APPROVED TARGET — HDS Admin selective adoption:**

- `brand.primary = #DB1F26`; the former design target `#DC2626` is **HISTORICAL / SUPERSEDED** as the target value.
- `brand.secondary = #2B479E` is approved for HDS Admin. Neither approval makes these values official company-wide HD SAISON brand standards.
- `brand.yellow = #FFD200` and `brand.orange = #EE7117` are approved brand primitives. Supplied strong/soft/tint values can be documented as brand primitives; they do not automatically become global component states.
- Preserve semantic targets: text primary/secondary/muted `#111827 / #4B5563 / #6B7280`; page/base-raised/subtle surfaces `#F9FAFB / #FFFFFF / #F3F4F6`; success `#15803D / #F0FDF4`; warning `#B45309 / #FFFBEB`; error `#B91C1C / #FEF2F2`; info `#1D4ED8 / #EFF6FF`; subtle/default border `#D1D5DB`; control/strong border `#6B7280`.
- The prior `border.focus #DC2626` requires review. `#DB1F26` is **NOT YET APPROVED** for focus.
- Ant Design 5-first; do not assign blanket hover/active HEX values. Preserve visible keyboard focus and the WCAG 2.2 AA target for new and substantially changed UI.
- Preserve Inter per DS-01; leave Scheme Sync mapping in DS-02 and StatusBadge accent redesign in DS-05. Keep gradients feature-owned and keep shared primary buttons solid. Link/action/navigation roles remain unresolved.
- Preserve runtime aliases and existing production values until separately approved implementation work. Do not modify application source.

## 4. Historical decisions and evidence

The earlier DS-03 audit and prior approved-color documentation report record the former `brand.primary #DC2626`, unset `brand.secondary`, and focus `#DC2626` target. Those dated files were not edited; the color page now labels that material historical and points to this addendum. The prior internal-project adoption review is also retained as pre-decision analysis; its classifications do not override this approved selective adoption.

Current source was checked directly:

- [`src/index.scss`](../../../src/index.scss#L6) still declares `--primary-color: #dc2626` (`:6-31`); it also owns the current legacy palette and Inter base font declarations (`:32,49-55`). This is **CURRENT IMPLEMENTATION**, not the newly approved target.
- [`src/providers/index.tsx`](../../../src/providers/index.tsx#L24) (`:24-48`) still provides locale and Inter `fontFamily`, with no color token overrides.
- [`src/components/status-badge/status-badge.module.scss`](../../../src/components/status-badge/status-badge.module.scss#L13) (`:13-36`) still consumes the legacy variables. Error and accent remain visually identical through `--primary-color`; this documentation decision does not change the CSS.
- [`src/components/button.tsx`](../../../src/components/button.tsx#L19) (`:19-59`) still consumes the legacy primary variable and uses a solid button treatment.
- The active scoped Scheme Sync palette and portal variables remain in [`scheme-sync.module.scss`](../../../src/modules/products/configuration/scheme-sync/scheme-sync.module.scss#L1). Their action mapping remains DS-02 scope.
- The 2026-11-05 audit and 2026-11-06 pre-adoption review are preserved at [`ds-03-semantic-color-token-audit.md`](../../audits/design-system/2026-11-05/ds-03-semantic-color-token-audit.md) and [`ds-03-internal-brand-token-adoption-review.md`](ds-03-internal-brand-token-adoption-review.md).

## 5. Focus and Ant Design 5.20.6 assessment

The manifest declares Ant Design `^5.20.6`, and the installed package is 5.20.6. In its installed alias implementation, `controlOutline` is computed with `getAlphaColor(colorPrimaryBg, colorBgContainer)` (`node_modules/antd/es/theme/util/alias.js:70-78`). It is an alpha-derived outline value, not a direct solid-HEX focus role. The updated guidance therefore records that the prior focus target needs review, leaves `#DB1F26` unapproved for focus, and makes no implementation mapping recommendation.

Any future focus decision should inspect the specific supported component tokens, resolved opacity and adjacent surface contrast, focus indicator geometry, custom SCSS precedence, and rendered keyboard behavior before mapping. No browser, contrast-tool, or keyboard validation was done in this documentation task.

## 6. Files changed

- [`docs/design-system/color.md`](../../design-system/color.md): marked pre-adoption DS-03 content historical/superseded and appended the active 2026-11-06 selective-adoption matrix, focus status, compatibility note, and DS-02/DS-05/DS-01 boundaries.
- [`docs/design-system/status.md`](../../design-system/status.md): clarified that current StatusBadge red remains the `#DC2626` legacy implementation while accent redesign remains DS-05.
- [`.codex/rules/10-styling.md`](../../../.codex/rules/10-styling.md): replaced the superseded hard-coded primary and pending-secondary guidance with the current approved HDS Admin roles and a link to the dated decision reference.
- `docs/reports/2026-11-06/ds-03-selective-palette-adoption-decision.md`: this report.

## 7. Compatibility guarantees

- No source variable, alias, ConfigProvider value, AntD component, shared button, StatusBadge style, Scheme Sync value, or production color was changed.
- Existing `#DC2626` runtime behavior remains intact pending a separate implementation task; the documentation now distinguishes it from approved target `#DB1F26`.
- Error remains a separate semantic role from brand. Existing badge error/accent styling remains legacy-compatible; no DS-05 change is implied.
- Existing typography ownership, Scheme Sync portal scopes, feature-owned gradients, link/action/navigation uncertainty, and the no-bulk-migration boundary remain documented.
- Historical audit and adoption-review findings remain available unchanged.

## 8. Validation performed

- Verified all requested source/document paths and the current branch/revision.
- Verified installed Ant Design version and inspected the actual `controlOutline` implementation in the installed 5.20.6 package.
- Checked local Markdown links and source paths/line anchors in changed documents.
- Checked current active values against the approved decision list and verified that earlier findings carry explicit historical/superseded labels.
- Confirmed no application source, runtime styles, dependencies, `.gitignore`, `CLAUDE.md`, or `.claude/` changes. The previous audit and adoption-review files were not changed.
- Confirmed the docs/report paths remain ignored by the existing local-only policy. No commit was made.
- No tests, typecheck, lint, build, browser, visual, keyboard, contrast-tool, or accessibility validation was run.

## 9. Risks and unverified items

- Production still renders the existing `#DC2626` alias; implementing target `#DB1F26` requires separately approved source changes and consumer review.
- Focus value and AntD component mapping remain undecided. Token type availability does not demonstrate rendered focus appearance or contrast.
- Approved internal-project values are HDS Admin decisions only; they do not establish official company-wide brand authority.
- Link/action/navigation mappings remain unresolved. Brand primitives are not global component-state colors by default.
- No current application WCAG conformance or browser-rendered accessibility is established.

## 10. Files and scopes not modified

- Application source/styles under `src/**`, runtime theme/ConfigProvider behavior, dependencies, APIs, and component contracts.
- `docs/design-system/README.md`, `typography.md`, all unrelated Design System documents, the earlier DS-03 audit, and the pre-adoption review report.
- `AGENTS.md`, `.codex/knowledge/`, Codex rules other than `10-styling.md`, `CLAUDE.md`, and `.claude/`.
- `.gitignore` and Git history.
