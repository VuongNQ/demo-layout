# HDS Admin Design-System Audit: Color, Typography, and Status

**Audit date:** 2026-11-05
**Branch:** `improve/vuongnq/redux-service`
**Revision:** `8977a1c7c8dbc3e2e70ca197051ef11eb3055afb`
**Worktree:** clean at audit start
**Mode:** read-only source and documentation investigation; no application code changed

## 1. Task Understanding

This audit inventories written rules and current source conventions for Color System, Typography System, and Status System. It treats current implementation as evidence of existing behavior, not proof of an approved design decision. Classification labels are `COMPLETE`, `PARTIAL`, `MISSING`, and `NOT VERIFIED`. “Confirmed” means directly visible in the checked source; “inference” is identified as such. `NEEDS-TEAM-DECISION` marks unresolved design intent.

**Executive summary — overall: PARTIAL.** The repository has a root set of CSS custom properties, a single Inter font configuration at bootstrap, broad styling ownership rules, and a shared `StatusBadge` with six visual variants. It does not have a dedicated design-system guide for color, typography, or statuses. Implementation remains mixed: Ant Design theme configuration, global CSS variables and AntD overrides, feature-local tokens, hardcoded values, Emotion styles, and legacy status pills. No dark theme configuration or contrast validation was verified. Existing status meanings and style differences are business/legacy contracts and should not be normalized without mapping and consumer review.

## 2. Entry Point

**Confirmed source and documentation reviewed:**

- `CLAUDE.md` (repo root), `.codex/knowledge/PROJECT_CONTEXT.md`, `.codex/knowledge/ARCHITECTURE.md`.
- `.codex/rules/00-general.md`, `.codex/rules/07-component.md`, `.codex/rules/10-styling.md`; component and styling rules were the directly applicable rules.
- `.claude/agents/codebase-analyzer.md` for the 16-section output contract.
- Global theme sources: `src/providers/index.tsx`, `src/index.scss`, `src/custom-ant.scss`.
- Shared and domain status sources, including `src/components/status-badge/`, `src/components/table-card-status.tsx`, customer status presentation, Theme Management, Promotion Management, and Product Labels.

**Documentation search:** the existing `docs/` tree contains module docs, audits, and reports, but no color-system, typography-system, status-system, or general design-system guide was found. `docs/modules/` documents business modules, not a cross-app visual contract.

**Snapshot caveat:** project context is a dated snapshot (2026-11-04) and its header points to a different source revision/branch than this checkout. This report uses the checked checkout revision above for all current-source claims. Current docs do not claim to be design-system specifications.

## 3. Feature Flow

The static styling flow is currently distributed:

```text
FullProvider / Ant Design ConfigProvider
        +
src/index.scss root CSS custom properties and base styles
        +
src/custom-ant.scss global AntD/library overrides
        +
feature/shared component styles (SCSS Modules, Emotion, inline values)
```

For displayed business statuses, the intended local pattern in newer code is:

```text
business status/data -> feature-owned label + StatusBadgeVariant mapping -> StatusBadge
```

Legacy code may map status directly to a color and render a custom pill. This is a source-observed convention, not a fully documented mandatory architecture.

## 4. Files Involved

| Area | Current evidence |
|---|---|
| App theme/bootstrap | `src/providers/index.tsx:24-28,42-48`; `src/index.scss:1-63` |
| Global AntD styling | `src/custom-ant.scss:19-62,68-76,90-129,144-160,171-220` |
| Shared color/status presentation | `src/components/status-badge/index.tsx:3-39`; `status-badge.module.scss:1-37` |
| Legacy multi-domain statuses | `src/components/table-card-status.tsx:6-180`; `src/components/customer/table-card-status.tsx`; `src/components/contract-card/*status*` |
| Newer feature mapping examples | `src/modules/products/promotion-management/promotion-type/components/PromotionTypeTableSection/index.tsx:32-35,120-126`; `src/modules/system/theme-management/components/BackgroundMainTableSection/index.tsx:44-51,243-253` |
| Feature-local design tokens | `src/modules/products/configuration/scheme-sync/scheme-sync.tokens.ts:1-41` |
| Typography exceptions | `src/modules/users/customer/access-account/view/general.tsx:123-156`; scheme-sync token and style files above |
| Existing policy | `.codex/rules/07-component.md:15-53`; `.codex/rules/10-styling.md:187-238`; `.codex/knowledge/ARCHITECTURE.md:336-390,834-875` |

## 5. State Ownership

**Color tokens — PARTIAL.** `src/index.scss:6-41` is the global owner for current CSS custom properties. It defines brand-like, text, surface, status, and layout values. The app also has `schemeSyncTokens` in `src/modules/products/configuration/scheme-sync/scheme-sync.tokens.ts:1-41`, including its own blue primary, red brand, and semantic error/warning/success palette, typography, spacing, and radius. Source inspection confirms local ownership for that feature; whether these values are intentionally exempt from a future global system is **NEEDS-TEAM-DECISION**.

The global AntD layer has separate behavior overrides in `src/custom-ant.scss`; several selectors directly set colors or bypass variables. Feature styles and inline literals are additional owners. This conflicts with the *target rule* to use one owned token source where a shared token is appropriate, but the rule explicitly preserves existing legacy styling.

**Typography tokens — PARTIAL.** The root `--font-family` variable is defined in `src/index.scss:32`, and body styles repeat Inter at lines 49-55. Ant Design separately receives Inter in `src/providers/index.tsx:24-27`. A feature-local scale exists for scheme-sync in its token file. No single cross-app owner for type sizes, weights, line heights, or text roles was found.

**Status semantics — PARTIAL.** Business status meaning belongs to feature/domain status values and mapping code; `StatusBadge` owns only presentation variants. The shared component does not own business status constants, label localization, icons, or workflow transitions. This separation is visible in feature-local records such as Promotion Type and Background Main mappings.

## 6. API Flow

No API flow is required to establish the visual-system contracts. Status values often originate from business data, but this audit did not trace each endpoint or backend enum. The UI mappings cited here prove only how the checked frontend renders the listed values. Backend-wide status completeness and stability are **NOT VERIFIED**.

## 7. Type/Data Flow

**Color System — PARTIAL**

- Confirmed root custom properties and values (`src/index.scss:6-32`): `--primary-color: #dc2626`, `--text-color: rgba(0, 0, 0, 0.88)`, `--gray-color: #5d5d5d`, `--gray-light-color: #959595`, `--success-color: #10ba08`, `--green-color: #22c55e`, `--orange-color: #f97316`, `--blue-color: #2f6bff`, plus white/black, backgrounds, borders, separators, and soft green/orange/blue/pink surfaces.
- Brand/semantic distinction is not formally specified. The same `--primary-color` is used as brand red and error/cancel styling in examples, while `--success-color` and `--green-color` have different values. Formal semantic role assignment is **MISSING**.
- Interaction styling exists but is mostly in global AntD selectors: checkbox hover/checked/indeterminate and Switch checked use primary red (`src/custom-ant.scss:19-62`); disabled input text is forced to dark text at lines 68-72; notification success/error surfaces and tab selected/inactive styles are at lines 106-129 and 185-200. Other interactions remain component/feature-owned.
- No dark algorithm or dark theme mode was found in `src/`; `ConfigProvider` currently receives locale and a theme object containing only `fontFamily` (`src/providers/index.tsx:24-28,45-48`). This confirms no dark mode in the inspected app theme setup, not the design intent. Dark-theme requirement is **NEEDS-TEAM-DECISION**.
- Contrast ratios, non-color status cues, and accessibility validation are **NOT VERIFIED**. No color-contrast report or corresponding design rule was found. Do not infer compliance from the token values.
- Duplicated values occur as literals as well as variables (for example `#dc2626` in `src/custom-ant.scss:178` and inline/feature styling). Scheme-sync uses a distinct local palette. Full literal count was not treated as a design-token inventory because static search includes non-semantic illustration/product-preview colors.

**Typography System — PARTIAL**

- `src/index.scss:3-4` loads Noto Sans JP and Inter remotely. Root/body and AntD ConfigProvider use Inter; the declared fallback is generic `sans-serif`, not a documented platform fallback stack (`index.scss:32,49-55`; `providers/index.tsx:24-27`). Font network availability and rendered fallback are **NOT VERIFIED**.
- Base root sizing is `html { font-size: 62.5% }` and `body { font-size: 1.6rem; line-height: 1.6rem }` (`src/index.scss:43-55`). Given the root base this is intended to resolve to 16px, but browser computed style was not measured.
- Weight data attributes define 500, 600, and 700 (`index.scss:65-75`). There is no central scale, heading hierarchy, paragraph/label roles, or documented line-height scale.
- Component/library values are ad hoc: notification title 1.4rem, checkbox mark 16px, form errors 80%, AntD tabs 12px (`src/custom-ant.scss:74-76,90-104,144-146,188-200`). Shared components and modules set their own sizes and weights.
- Feature-local schemes can intentionally diverge: scheme-sync defines Be Vietnam Pro and 12/14/16/20/24px roles (`scheme-sync.tokens.ts:21-28`), while a customer-detail view uses Inter and alias-like fallbacks for 14/20px with its own line heights (`src/modules/users/customer/access-account/view/general.tsx:123-156`). Whether these are intended product-specific systems is **NEEDS-TEAM-DECISION**.
- Component-specific typography is common; no cross-app hierarchy explaining when such overrides are permitted was found (**MISSING**).

**Status System — PARTIAL**

- Shared API: `StatusBadge` accepts required `label: string` and `variant` (`success | warning | error | info | neutral | accent`), optional `className`; it renders a `<span>` (`src/components/status-badge/index.tsx:3-39`). It has no icon, title/description, loading, empty, error, disabled, role, or ARIA props/state contract.
- Variant rendering: success green/soft-green, warning orange/soft-orange, error and accent both primary-red/soft-pink, info blue/soft-blue, neutral gray/light-white; pill uses 1rem font, 600 weight and 1.6rem line-height (`status-badge.module.scss:1-37`). The visual difference between `error` and `accent` is currently none; intended distinction is **NEEDS-TEAM-DECISION**.
- Business mapping remains feature-owned. Promotion Type maps ACTIVE to success and INACTIVE to neutral (`PromotionTypeTableSection/index.tsx:32-35`); Background Main maps INACTIVE/ENDED to neutral, UPCOMING to warning and ONGOING to success (`BackgroundMainTableSection/index.tsx:44-51`). Labels are resolved at feature level and then passed into the badge.
- Consumer search found shared-badge usage in customer presentation, Promotion Type table/detail, Promotion Offer list/detail/preview, Theme Management Background Main/Topic table and sorting paths. This confirms reuse exists, but does not establish all status renderers have migrated.
- Parallel legacy systems remain. `src/components/table-card-status.tsx:12-159` contains a large cross-domain status-to-label/color switch; its pill uses saturated background plus white text (`:166-180`), while `StatusBadge` uses tinted background and colored text. Other customer and contract-card components also render their own status pill styles. Product Labels additionally has local derived/mode badge rendering (`src/modules/products/configuration/product-labels/shared/StatusBadge.tsx:15-49`). These presentations are not interchangeable without a deliberate visual/behavior mapping.
- Business status and UI lifecycle are different concerns in inspected code. The Promotion Type table has separate query error, empty, and loading handling (`PromotionTypeTableSection/index.tsx:146-165` and following lines); these are not badge variants. Status controls/switches in forms represent editable business state and have their own contracts; a display badge is not a replacement.
- Status-label/icon consistency and translation policy are **PARTIAL**: some mappings use i18n labels, while the legacy switch includes hardcoded Vietnamese strings. Shared `StatusBadge` has no icon contract. A comprehensive cross-module status dictionary was not found (**MISSING**).

## 8. Form Flow

This audit did not review every form lifecycle. Representative evidence shows editable status is not synonymous with a display badge: Product Labels maps ACTIVE/INACTIVE to a boolean switch (`src/modules/products/configuration/product-labels/shared/status-switch-mapping.ts:1-9`), while display components map statuses to visual badges. The existing component rules preserve Ant Design Form/FormInstance ownership and warn against assuming shared controls are generic (`.codex/rules/07-component.md:20-32`). Future docs should explicitly distinguish edit controls from read-only status display. Form-wide status-color usage is **NOT VERIFIED**.

## 9. Routing & Permission Flow

Routing and permission behavior are outside this visual-system audit. No routes or permission constants were changed or recommended. Consumers span shared components and multiple business modules, so any future shared-token or badge-contract change must review all affected consumers before rollout.

## 10. Dependencies & Consumers

- Ant Design 5 is configured through a root `ConfigProvider`; only locale and Inter `fontFamily` are currently provided from `src/providers/index.tsx`.
- Global styles are loaded from `src/index.scss`, which `@use`s `custom-ant.scss` (line 2). The styling rule says use supported AntD tokens/APIs, keep one CSS custom-property source and explicit scope, and minimize deep `.ant-*` overrides (`.codex/rules/10-styling.md:187-211`).
- `src/components/status-badge/` is a shared technical/presentation primitive, and mappings remain with consumers. The existing component rules require stable shared semantics and consumer review before promoting/changing shared components (`.codex/rules/07-component.md:33-53`; `.codex/rules/10-styling.md:224-238`).
- Emotion, SCSS Modules, CSS variables, inline styles, Ant Design defaults/tokens, and legacy global overrides all coexist. The architecture explicitly preserves these current approaches while adopting SCSS Modules for new independent components (`.codex/knowledge/ARCHITECTURE.md:336-390`).

## 11. Pattern Classification

| Area/finding | Classification | Evidence and interpretation |
|---|---|---|
| Root color custom properties exist with concrete values | COMPLETE (implementation fact) | `src/index.scss:6-32` |
| Written semantic palette and brand-vs-feedback role matrix | MISSING | No design-system docs found; existing styling rule is general |
| Color ownership consolidated across root, local tokens, overrides, literals | PARTIAL | Root variables exist, but feature-local and direct values remain |
| Dark mode implemented in app-level ConfigProvider | MISSING (in inspected source) | Theme object only contains font family; dark mode intent NEEDS-TEAM-DECISION |
| Contrast/accessibility checked | NOT VERIFIED | No contrast evidence or rendered audit |
| Base font family and default size/weight settings exist | COMPLETE (implementation fact) | `index.scss:3-4,32,43-75`; provider `:24-27` |
| Cross-app typography scale/hierarchy and usage rules | MISSING | Several feature/component-specific scales, no guide found |
| Shared status badge contract exists | COMPLETE (component contract only) | `status-badge/index.tsx:3-39`, styles `:1-37` |
| Business status mappings have one global source | MISSING | Feature mappings + global legacy switch + local badges coexist |
| Business status is separated from loading/empty/error UI | PARTIAL | Explicit in some newer modules; not a documented cross-app contract |
| Full consistency across tables, forms and detail views | NOT VERIFIED | Representative consumers inspected; complete screen inventory/runtime review not performed |

## 12. Risk Classification

**Read-only audit risk: SAFE.** No runtime behavior changed.

**Future broad standardization risk: HIGH-RISK.** Color and typography tokens affect shared AntD controls, global CSS, feature preview surfaces, and contrast-sensitive states. Status mappings carry business meaning and appear in multiple independently owned renderers. Changes may alter workflow interpretation, text labels, localization, table/detail consistency, or accessible cues. Architecture requires preserving legacy styling and reviewing consumers; it does not authorize bulk migration.

Specific unresolved decisions: whether dark mode is a product requirement; authoritative brand/semantic palette and role aliases; whether local feature token systems such as scheme-sync are intentional exceptions; whether `error` and `accent` should remain visually identical; and which legacy badge styles should ever migrate. Each is **NEEDS-TEAM-DECISION** before standardization.

## 13. Regression Surface

Any future visual-system changes should account for:

- AntD hover, focus-visible, checked, indeterminate, disabled, validation-error, selected-tab, notification-success/error, and date-range states affected by global overrides.
- Screen layouts that rely on inherited body font sizing and `rem` calculations.
- Font loading/fallback and localized content lengths in Vietnamese and English.
- Status rows, details/drawers, preview tables, and forms across Theme Management, Promotion Management, customers, contracts, Product Labels, and other legacy modules.
- Semantic ambiguity where one backend/domain code appears in more than one workflow or where frontend display status is derived from multiple fields.
- Color-only cues and small text/background pairs in badges and tables.

The list is a regression checklist, not evidence these cases were rendered or accessibility-tested in this audit.

## 14. Recommended Change Boundary

Recommended documentation structure (documentation-only first; implementation requires a separate scoped task):

```text
docs/design-system/README.md
  ownership, source-of-truth map, status of decisions, compatibility policy
docs/design-system/color.md
  palette + semantic aliases, surfaces/borders, interaction states, theme modes,
  contrast evidence and approved usage
docs/design-system/typography.md
  font loading/fallback, scale, weight/line-height hierarchy, component roles,
  explicit feature exceptions
docs/design-system/status.md
  business-vs-UI state distinction, StatusBadge API/variants, feature mapping
  ownership, label/icon/accessibility conventions, loading/empty/error guidance,
  legacy renderer inventory and compatibility notes
```

Keep the first documentation pass descriptive and source-linked. Separate “current observed value” from “approved target” so documentation does not turn current behavior into policy. Use explicit `NEEDS-TEAM-DECISION` boxes for unresolved decisions. Maintain a legacy exception/migration table rather than silently reclassifying existing screens. If a future implementation proposal changes shared primitives, include consumer inventory, before/after mapping, and rendered state checks; do not change the current app as part of writing the docs.

## 15. Unknowns / Needs Verification

- **NOT VERIFIED:** contrast ratios, keyboard/screen-reader behavior, non-color redundant status cues, browser-computed type sizes, dark mode outside the inspected provider/global styling, and actual remote font fallback.
- **NOT VERIFIED:** exhaustive status coverage for all tables, forms, and detail screens; this audit used focused cross-repository searches and representative code paths.
- **NOT VERIFIED:** whether all raw status values are backend-owned, frontend-derived, deprecated, or shared between workflows; endpoints/backend contracts were not audited.
- **NEEDS-TEAM-DECISION:** dark theme product scope; semantic palette/brand color intent; feature-specific font/token exceptions; error/accent distinction; future treatment of the legacy saturated pills; status icon/label standard.
- The codebase-analyzer's read-only investigation supported source coverage. This report adds direct line-checked references. No browser, visual, authenticated, API, accessibility-tool, build, lint, or test validation was performed or claimed.

## 16. Handoff for Implementation

No implementation is authorized or proposed by this audit. Next steps are to review this inventory with design/product and resolve the listed `NEEDS-TEAM-DECISION` items, then publish the descriptive design-system documentation in a separately reviewed docs-only change. If visual code changes are later approved, begin with a bounded pilot and audit all shared consumers while preserving existing feature and business status contracts. Validate actual rendered states and accessibility/contrast separately; static source inspection cannot establish those outcomes.

**Exact report path:** `docs/audits/design-system/2026-11-05/color-typography-status.md`
