# Codex Design System Decisions — Execution Report

## 1. Task

- Date: 2026-11-05 (Asia/Ho_Chi_Minh).
- Branch: `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung`.
- Starting revision: `6b4038ec4ad2cd3c1230dad70ef2b90b8af9fe9c`.
- Requirement: incorporate confirmed product and engineering decisions into the Codex-facing Design System documentation and Codex component/styling rules. Documentation and Codex rules only.

## 2. Risk

**SAFE — documentation and Codex guidance only.** No application implementation, style, route, API, permission, component contract, or runtime behavior was changed. The local-only documentation policy remains in force; no files were committed.

## 3. Change Boundary

Modified seven existing Design System pages, `.codex/rules/07-component.md`, `.codex/rules/10-styling.md`, and this report. No duplicate Design System pages were created. No application files, `AGENTS.md`, `.gitignore`, or Claude profile files were changed.

## 4. Architecture Decisions

### Approved decisions incorporated

- Codex guidance owns its own `AGENTS.md` and `.codex/` source of instructions.
- Color roles are distinct: brand/primary, text and neutral, surfaces and borders, success/warning/error/info semantics, and interaction states. Existing source values are evidence, not approval of new values; brand red is not inherently error.
- Dark mode is not required in the current application. The semantic roles can support a future palette; no runtime theme or `ConfigProvider` change is proposed.
- Future Codex-generated UI follows a unified cross-application typography direction. Existing fonts and local typography remain compatible. Because no concrete scale is approved, the page labels a scale assembled from observed source sizes as **CANDIDATE**.
- The six `StatusBadge` variants remain. `error` means error/failure/negative outcome; `accent` means emphasis/featured/important content without error meaning. Current CSS is unchanged; distinct future accent styling needs separate design approval. Domain interpretation and labels remain feature-owned.
- Keep legacy status renderers. No bulk migration; a touched module requires a renderer/consumer/mapping/label/unknown-value/localization/display review and preserves behavior by default.
- Accessibility is an adopted review requirement. The WCAG 2.2 AA text and non-text contrast thresholds are labeled a recommendation pending team approval, not an approved policy or conformance claim.

### Relevant Codex policy

The changes link to `.codex/knowledge/ARCHITECTURE.md` and `.codex/rules/00-general.md`, `05-form.md`, `07-component.md`, and `10-styling.md`. Source project context is dated, so claims about implementation were checked against current source. The local-only policy was confirmed in `docs/README.md` and `.gitignore` without changing either.

## 5. Preserved Contracts

- `StatusBadge` keeps its six current variants, `label`, `variant`, and optional `className` contract, and existing CSS.
- Feature/domain-owned status values, mappings, labels, localization, and unknown-value behavior remain owned by their current features.
- Legacy status renderers and styles remain in place; no migration is implied.
- Current production color values, root/provider font setup, component typography exceptions, and current ConfigProvider behavior are unchanged.
- Existing Codex rules outside the documented component/status/accessibility and color/typography decision additions were not rewritten.

## 6. Implementation Summary

### Files modified

- `docs/design-system/README.md`
- `docs/design-system/patterns.md`
- `docs/design-system/components.md`
- `docs/design-system/layouts.md`
- `docs/design-system/color.md`
- `docs/design-system/typography.md`
- `docs/design-system/status.md`
- `.codex/rules/07-component.md`
- `.codex/rules/10-styling.md`
- `docs/reports/2026-11-05/codex-design-system-decisions.md`

### Exact sections changed

- `README.md`: section links and decision labels; Codex source ownership; area/source map; accessibility review; compatibility boundary.
- `patterns.md`: decision vocabulary and Codex-only policy links; status examples; Codex ownership decision; removal of profile-authority question.
- `components.md`: category/reuse links now point to Codex rules; added accessibility review requirements.
- `layouts.md`: form and layout policy links now point to Codex rules.
- `color.md`: approved semantic framework; confirmed palette evidence; role and interaction ownership; dark-mode decision; accessibility recommendation and unknowns.
- `typography.md`: font-family ownership; observed source scale/exceptions; candidate scale; usage and verification limits.
- `status.md`: approved variant semantics; current API/CSS; feature-owned mappings; legacy review policy; accessibility and verification limits.
- `.codex/rules/07-component.md`: `## Status presentation` and `## Accessibility review`.
- `.codex/rules/10-styling.md`: `## Design-system decisions for new Codex UI`.

### Source evidence

- Current palette/font root source: `src/index.scss:3-4,6-32,43-55,65-75`.
- Ant Design provider font token: `src/providers/index.tsx:24-28,42-48`.
- Current interaction overrides: `src/custom-ant.scss:19-62,74-76,106-129,144-160,178-200`.
- Typography examples: `src/components/status-badge/status-badge.module.scss:1-10`; `src/modules/products/configuration/scheme-sync/scheme-sync.tokens.ts:1-41`; `src/modules/users/customer/access-account/view/general.tsx:123-156`.
- `StatusBadge` contract and current variants: `src/components/status-badge/index.tsx:3-39`; current visual declarations `src/components/status-badge/status-badge.module.scss:1-37`.
- Feature-owned status examples: `src/modules/products/promotion-management/promotion-type/components/PromotionTypeTableSection/index.tsx:32-35,66-69,121-127,146-179`; `src/modules/system/theme-management/components/BackgroundMainTableSection/index.tsx:45-51,79-90,243-253`; `src/modules/system/theme-management/components/TopicTableSection/index.tsx:46-54,180-193`.
- Legacy status examples: `src/components/table-card-status.tsx:6-180`; `src/components/customer/table-card-status.tsx:5-36`; `src/components/contract-card/contract-card-status.tsx:6-26`; `src/components/contract-card/payment-card-status.tsx:6-42`; `src/modules/products/configuration/product-labels/shared/StatusBadge.tsx:15-50`.
- WCAG recommendation references: [W3C WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) and [SC 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast).

### Confirmed facts versus proposal

**CONFIRMED CURRENT IMPLEMENTATION:** root color variables and Inter font declarations; the provider's Inter `fontFamily` token; the six `StatusBadge` variants and current paired styles; feature-owned mappings; legacy renderers; feature-local Scheme Sync typography tokens.

**APPROVED DECISION:** semantic color role framework, dark mode not required currently, status variant semantics, preservation of the current StatusBadge API/CSS, feature-owned business status mapping, legacy migration policy, and accessibility review as a required consideration for future Codex-generated UI.

**CANDIDATE:** numeric cross-app typography role scale. Values are proposed for review and are not approved design tokens.

**NOT VERIFIED:** browser font fallback/loading, contrast ratios, focus rendering, screen-reader behavior, responsive text behavior, WCAG conformance, full palette usage, full domain status coverage, and Scheme Sync exception intent.

## 7. Validation Performed

- Confirmed branch/revision and inspected the initial worktree before editing.
- Read the requested Codex entry point, project context, architecture, relevant rules, all seven Design System pages, and the previous baseline report. Also checked `docs/README.md` to preserve the local-only policy.
- Verified source evidence paths in the current checkout and retained line references for the cited declarations and contracts.
- Reviewed all changed Markdown link targets and anchors, checked local source path references, and checked that approved decisions are labeled separately from candidate values and unverified behavior.
- Confirmed no application files changed; confirmed `.claude/`, `CLAUDE.md`, `AGENTS.md`, and `.gitignore` are untouched. Confirmed docs remain ignored by the existing policy.
- Reviewed the `07-component.md` and `10-styling.md` inserts against surrounding Codex rule content for contradictions and unnecessary duplication.
- No typecheck, lint, build, or application tests were run because only Markdown documentation and Codex rules changed.

## 8. Runtime Validation Gaps

No browser, visual, responsive, contrast, accessibility, font-loading, API, authentication, or backend validation was performed. No accessibility or WCAG compliance is claimed. Current `StatusBadge` semantics and the proposed accessibility checks are documentation decisions; rendering and conformance remain unmeasured.

## 9. Test Debt

The source examples are representative rather than exhaustive. The candidate type scale needs design/product review before implementation as tokens. Color aliases and usage do not yet establish one canonical role-to-value table. Legacy status consumers and all domain-specific mappings have not been exhaustively inventoried. Accessibility criteria need an approved conformance target and implementation-level validation plan.

## 10. Reviewer Attention

Remaining **NEEDS-TEAM-DECISION** items:

- Approve, revise, or replace the candidate numeric typography scale and its role/weight/line-height assignments.
- Decide whether Scheme Sync typography and palette are intended exceptions to the cross-application direction.
- Approve exact color-role-to-token assignments and whether same-semantic aliases such as the two current success values should remain distinct.
- Approve a WCAG version/level and exact contrast criteria. The WCAG 2.2 AA thresholds in `color.md` are a recommendation only.
- Approve any distinct future visual treatment for `StatusBadge` `accent`; current matching `error`/`accent` CSS remains as-is.

Business status meanings remain feature/domain-owned; a universal mapping is not proposed. Dark mode is not required for the current application. Follow-up should be limited to resolving the listed decisions and then updating the Codex reference/rules; implementation changes need their own explicit scope.
