# DS-03 Approved Color Documentation Update

## 1. Task metadata

- **Author:** Vuowng
- **Date:** 2026-11-06 (Asia/Ho_Chi_Minh)
- **Branch at final validation:** `improve/vuongnq/2729_sync_CL` (initially observed as `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung`; branch changed during this task without a revision change)
- **Revision:** `5fc4be3fae39aaa5d26099804f440a1061a102ab`
- **Task:** Synchronize approved DS-03 decisions into the shared Design System documentation and Codex styling guidance.
- **Scope:** Documentation and Codex rules only. The existing `docs/` local-only policy remains in effect; no local-only files were committed.

## 2. Risk and change boundary

**SAFE — documentation and guidance update.** Changed only the relevant Color System page, Design System index, component and status accessibility references, Codex styling rule, and this report. No application source, styles, runtime theme, dependencies, production behavior, Claude profile files, or `.gitignore` were changed.

The starting worktree was clean. The requested Codex guidance and Design System documents, the DS-03 audit, and the earlier Codex decision report were present. `CLAUDE.md` and `.claude/` were not read or modified.

## 3. Approved decisions incorporated

- **Brand:** `brand.primary = #DC2626`; `brand.secondary` remains `NEEDS-TEAM-DECISION`; brand and error have independent meaning.
- **Text:** primary `#111827`, secondary `#4B5563`, muted `#6B7280`.
- **Surface:** page `#F9FAFB`, base/raised `#FFFFFF`, subtle `#F3F4F6`.
- **Feedback:** success `#15803D / #F0FDF4`, warning `#B45309 / #FFFBEB`, error `#B91C1C / #FEF2F2`, info `#1D4ED8 / #EFF6FF` (foreground/background).
- **Borders:** subtle/default `#D1D5DB`, control/strong `#6B7280`, focus `#DC2626`. Subtle/default alone is insufficient as a control's only visible boundary when 3:1 is required; no dark border is mandated for all AntD inputs.
- **Interaction and ownership:** Ant Design 5-first after installed-version and specific API verification; preserve brand primary; allow justified component overrides; exact hover/active/selected/disabled values remain unapproved; preserve visible focus and disabled/read-only semantics. One logical semantic definition maps consistently to AntD tokens and CSS variables, while the physical source of truth remains undecided. Preserve legacy aliases and do not bulk-migrate.
- **Accessibility:** WCAG 2.2 AA is the target for new and substantially changed UI. Existing application conformance is not claimed.
- **Deferred scopes:** official secondary brand HEX; Scheme Sync action mapping (DS-02); StatusBadge accent redesign (DS-05); component state values; feedback border details.

## 4. Current source evidence

- Root CSS aliases and current values remain in [`src/index.scss`](../../../src/index.scss#L6): declarations at `:6-31`; they are documented as current implementation, not as the approved mapping.
- The provider currently passes only font family through the theme object at [`src/providers/index.tsx`](../../../src/providers/index.tsx#L24) (`:24-28,42-48`). The manifest declares Ant Design `^5.20.6` at [`package.json`](../../../package.json#L36), and the locally installed package reports 5.20.6. This confirms the checked version only; future upgrades require re-verification.
- Current StatusBadge color pairs remain in [`status-badge.module.scss`](../../../src/components/status-badge/status-badge.module.scss#L13) (`:13-36`). Existing current values and use are retained in the color page and the source audit.
- The source audit records current CSS/AntD/component ownership and Scheme Sync active Sass palette and portal scoping at [`ds-03-semantic-color-token-audit.md`](../../audits/design-system/2026-11-05/ds-03-semantic-color-token-audit.md). Its former candidate matrix is historical evidence; the approved table in the shared color page now supersedes its candidate status for the explicitly approved roles and values.
- Ant Design token mapping points were checked against the [official theme customization reference](https://ant.design/docs/react/customize-theme/?locale=en-US). Specific token behavior and component mapping must still be verified against the installed package when implementation is proposed.

## 5. Files modified and sections changed

- [`docs/design-system/color.md`](../../design-system/color.md): added the approved DS-03 semantic HEX matrix; calculated contrast table; current-versus-target distinction; Ant Design/CSS-variable mapping guidance; ownership, compatibility, interaction, accessibility, and deferral statements.
- [`docs/design-system/README.md`](../../design-system/README.md): updated the accessibility target to approved WCAG 2.2 AA and linked this report.
- [`docs/design-system/components.md`](../../design-system/components.md): corrected the component accessibility reference from pending thresholds to the approved target, while retaining the no-conformance-claim limitation.
- [`docs/design-system/status.md`](../../design-system/status.md): corrected its color-reference description to identify WCAG 2.2 AA as approved and retain current verification limits.
- [`.codex/rules/10-styling.md`](../../../.codex/rules/10-styling.md): updated “Design-system decisions for new Codex UI” with approved colors, ownership, AntD version/API verification, interaction constraints, WCAG target, and DS-02/DS-05 boundaries.
- `docs/reports/2026-11-05/ds-03-approved-color-documentation-update.md`: this execution report.

No other rule or Design System page required a direct change. The status page's existing implementation description remains valid; DS-05 accent treatment is deferred.

## 6. Contrast and compatibility guarantees

Contrast ratios in the approved color page were recalculated from opaque sRGB HEX pairs using the WCAG relative-luminance formula. Text pairs meet 4.5:1 in the listed combinations; the listed control/focus pairs meet 3:1 on the named surfaces. The approved subtle/default border yields 1.41–1.47:1 on page/base and is explicitly not sufficient as the only visible control boundary. Calculations do not establish rendered contrast or conformance.

Documentation preserves the current CSS aliases, StatusBadge API/styles, feature-owned business mappings, Scheme Sync palette and portal behavior. It does not authorize runtime tokens, alias rewiring, universal business mappings, bulk migration, dark mode, or a change to ConfigProvider behavior.

## 7. Validation performed

- Verified requested file paths exist and reviewed Codex entry/guidance, current Design System pages, the DS-03 source audit, and earlier Codex design-system report.
- Verified the branch/revision and clean starting worktree; confirmed installed Ant Design version is 5.20.6.
- Recalculated each documented foreground/background contrast ratio in the approved matrix.
- Checked all changed local Markdown links and anchors, source paths cited in changed content, decision labels, and target/current separation.
- Reviewed the Codex styling rule section for consistency with the approved deferrals and existing ownership constraints.
- Confirmed only the three requested existing documentation/rule files and this report changed; confirmed `.gitignore`, application source, `CLAUDE.md`, and `.claude/` remain untouched.
- Confirmed the destination remains ignored under the existing local-only docs policy. No `.gitignore` edit or commit was made.
- No application tests, typecheck, lint, build, browser review, screenshot review, contrast browser extension, or accessibility audit was run.

## 8. Risks

- Approved values have not been implemented; production presentation therefore remains unchanged.
- AntD token mapping names are mapping points, not a runtime implementation contract. The installed-version API, component-level token support, portal behavior, and cascade need implementation-time review.
- Existing hardcoded colors, Emotion styles, scoped feature aliases, and global overrides can produce visual divergence until separately approved migration work.
- Scheme Sync continues to own its current active scoped palette, including portal selectors; this update does not map its actions to shared roles.
- The shared StatusBadge still has current legacy styles. Its accent redesign and any visual migration remain deferred to DS-05.

## 9. Unverified items

- No rendered browser contrast, focus visibility, disabled/read-only state, zoom/reflow, keyboard, screen-reader, or responsive behavior was evaluated.
- No current application WCAG conformance is established.
- No exhaustive runtime inventory was performed to prove every legacy alias consumer or all computed AntD token effects.
- Exact feedback border treatment, hover/active/selected/disabled colors, secondary brand value, physical token source, and rollout order are unresolved.

## 10. Follow-up recommendations

- Keep the physical token source and implementation sequence as explicit team decisions before wiring ConfigProvider and CSS variables.
- In DS-02, classify each Scheme Sync action and feedback use before mapping its local palette; retain portal coverage during any approved migration.
- In DS-05, decide whether and how StatusBadge accent receives a distinct visual treatment, then review affected consumers separately.
- Before implementation, define component-specific interaction and feedback-border treatments and perform visual regression across controls, surfaces, navigation, alerts, badges, drawers, modals, and portals.
- Validate the approved target against implemented rendering and accessibility checks before making any conformance statement.
