# Design System Documentation Baseline — Execution Report

## 1. Task

- Date: 2026-11-05 (repository environment timezone: Asia/Ho_Chi_Minh).
- Branch: `improve/vuongnq/redux-service`.
- Starting revision: `8977a1c7` (`git rev-parse --short HEAD`).
- Requirement: create a source-backed, descriptive documentation baseline for Design Patterns, Component System, Layout System, Color System, Typography System, and Status System.

## 2. Risk

**SAFE — documentation-only.** No runtime, component, layout, style, route, API, permission, or behavior changes were requested or made. The architecture risk classification describes this documentation work only and does not approve implementation changes.

## 3. Change Boundary

The only write scope is the six requested pages under `docs/design-system/` and this report. No profile synchronization, `.gitignore` change, application edit, commit, or local-doc tracking-policy change is in scope.

## 4. Architecture Decisions

- **Guidance:** `CLAUDE.md`, `AGENTS.md`, `.claude/PROJECT_CONTEXT.md`, `.claude/ARCHITECTURE.md`, `.claude/rules/00-general.md`, `05-form.md`, `06-routing-permission.md`, `07-component.md`, `10-styling.md`; `.codex/knowledge/PROJECT_CONTEXT.md`, `.codex/knowledge/ARCHITECTURE.md`, and relevant `.codex/rules/` files. Both profile trees were inspected; policy-source authority remains unresolved.
- **Required docs:** `docs/README.md`, `docs/modules/TEMPLATE.md`, `docs/audits/design-system/2026-11-05/documentation-coverage.md`, `docs/audits/design-system/2026-11-05/color-typography-status.md`.
- **Current source anchors:** route shells `src/routes/index.tsx:16-32`; layouts `src/layouts/main.layout.tsx:19-31,66-142`, `src/layouts/basic.layout.tsx:12-38,40-88`, `src/layouts/master.layout.tsx:8-25`, `src/layouts/form.layout.tsx:22-44,50-72,99-109,119-230`; root styling/provider `src/index.scss:3-75`, `src/custom-ant.scss:19-62,68-76,90-129,144-160,171-200,216-220`, `src/providers/index.tsx:24-28,42-48`.
- **Component/status examples:** `src/components/status-badge/index.tsx:3-39`, `src/components/status-badge/status-badge.module.scss:1-37`, `src/components/table-card-status.tsx:6-180`, `src/components/customer/table-card-status.tsx:5-36`, `src/components/contract-card/contract-card-status.tsx:6-26`, `src/components/contract-card/payment-card-status.tsx:6-42`, and mappings in `src/modules/products/promotion-management/promotion-type/components/PromotionTypeTableSection/index.tsx:32-35,66-69,121-127`, `src/modules/system/theme-management/components/BackgroundMainTableSection/index.tsx:45-51,79-90,243-253`, `src/modules/system/theme-management/components/TopicTableSection/index.tsx:46-54,180-193`, and `src/modules/products/configuration/product-labels/shared/StatusBadge.tsx:15-50`.
- **Representative local design values:** `src/modules/products/configuration/scheme-sync/scheme-sync.tokens.ts:1-41`; customer detail type styling `src/modules/users/customer/access-account/view/general.tsx:123-156`.

Policy classification is kept separate from implementation facts. The `.claude` architecture/rules describe target direction; existing styles/components remain compatibility contracts. Profile authority is not reconciled.

## 5. Preserved Contracts

The docs do not change or prescribe migration of existing component props/defaults, `FormLayout`/`FormRef`, route-shell/state behavior, feature-owned business status mappings, or current API/permission behavior. Current implementation is labeled separately from adopted target rules and proposals.

## 6. Implementation Summary

- `docs/design-system/README.md`
- `docs/design-system/patterns.md`
- `docs/design-system/components.md`
- `docs/design-system/layouts.md`
- `docs/design-system/color.md`
- `docs/design-system/typography.md`
- `docs/design-system/status.md`
- `docs/reports/2026-11-05/design-system-baseline.md`

### Confirmed facts versus inference

**CONFIRMED:** The root stylesheet defines color/layout custom properties and base typography; the root Ant Design provider supplies locale and Inter font family; four layout components have distinct route/workflow contracts; `StatusBadge` exposes six variants and narrow props; feature-owned mappings coexist with legacy status renderers; Scheme Sync has local color/type/spacing/radius tokens. These claims are cited in the created docs to current checked source.

**Target policy, not current uniform behavior:** The `.claude` architecture/rules describe Ant Design token APIs, private SCSS Modules for new independent components, local-first feature ownership, component reuse thresholds, and existing styling compatibility. The `.codex` architecture/rules were also read as directed by `AGENTS.md`; they do not make this baseline an approved visual system.

**INFERENCE:** Different layout contracts and feature compositions mean examples should be treated as applicable patterns, not one universal CRUD template. Local Scheme Sync tokens may be an exception, but source alone does not establish product approval.

The audit report path supplied for `documentation-coverage.md` under `docs/audits/system-design/` does not exist in this checkout. The actual file is `docs/audits/design-system/2026-11-05/documentation-coverage.md`, alongside the supplied color report. This discrepancy is reported; no documents were moved or rewritten.

## 7. Validation Performed

- Read required guidance, audit reports, current source anchors, and working-tree state before drafting.
- Checked the actual existence of cited source/document paths and internal documentation links after drafting.
- Reviewed all generated pages for unsupported claims and confirmed that references label historical reports/snapshots as such.
- Checked tracked and ignored status: the requested docs exist locally and are ignored by the existing rule in `.gitignore`; no tracked application, profile, or `.gitignore` files changed. No commit was created.
- No typecheck, lint, build, or application tests were run because application source was not changed and the task requested documentation/path/link validation.

## 8. Runtime Validation Gaps

No browser, visual, responsive, authenticated API, permission, runtime font-loading, accessibility, or contrast validation was performed. Static source does not establish rendered fallback fonts, computed typography, contrast, keyboard/screen-reader behavior, backend status completeness, or dark-theme behavior outside the inspected root provider setup.

## 9. Test Debt

The component contracts and consumers are representative, not exhaustive. Not all UI files, route-to-layout edges, status codes, design values, or direct color literals were inventoried. The prior audit likewise identifies the absence of a repository-level component/layout catalog and warns against treating all of `src/components/` as generic primitives (`docs/audits/design-system/2026-11-05/documentation-coverage.md:80-92`). The dated project snapshots predate this checkout and were verified against current source where used.

## 10. Reviewer Attention

Review and resolve these **NEEDS-TEAM-DECISION** items:

- Long-term authority/relationship between `.claude/` and `.codex/`; their entry points designate separate profile paths. Neither was synchronized.
- Approved distinction between brand and semantic color roles; whether to support a dark theme.
- A cross-app typography scale and whether feature-local schemes/fonts are intentional exceptions.
- Intended meaning of `StatusBadge` `error` versus `accent`, future treatment of legacy status pills, and any shared status label/icon convention.
- Accessibility/contrast criteria and whether a full domain status dictionary should exist.

**Result: COMPLETE — documentation baseline created.** Review the eight local documentation files with design/product owners. Resolve the explicit team decisions before promoting observed values into approved visual standards. If exhaustive component contracts or status mappings are needed, conduct a focused source audit per domain. Keep application changes and profile reconciliation in separately scoped work.
