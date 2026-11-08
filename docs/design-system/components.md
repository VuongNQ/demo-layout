# Component System

## Ownership categories

The component rule defines these categories: **Page/container**, **Feature component**, **Domain-shared component**, **Shared technical component**, **Shared primitive**, and **Layout** ([`.claude/rules/07-component.md`](../../.claude/rules/07-component.md#categories-and-placement) / [`.codex/rules/07-component.md`](../../.codex/rules/07-component.md#categories-and-placement)). These are ownership and placement concepts, not a claim that every existing file is correctly classified or globally reusable.

| Category | Responsibility | Current example |
| --- | --- | --- |
| Page/container | Route params, permission checks, state/service coordination, navigation, composition | Route page exports are assembled by `src/routes/pages.tsx`; individual pages remain in owning modules. |
| Feature component | Business-specific presentation or interaction | `PromotionTypeTableSection` owns promotion type list state, table, labels, and mapping (`src/modules/products/promotion-management/promotion-type/components/PromotionTypeTableSection/index.tsx:32-55,66-69,121-127`). |
| Domain-shared component | Shared UI within one business domain | Product configuration shared components live under `src/components/product-configuration/`; their domain-specific contracts should be checked before reuse. |
| Shared technical component | Domain-neutral behavior across domains | `src/components/pagination/` is used by feature list screens; consumers still own their paging state. |
| Shared primitive | Small neutral visual or behavioral wrapper | `StatusBadge` is a presentation primitive with a narrow label/variant/className contract (`src/components/status-badge/index.tsx:3-39`). |
| Layout | Page shell/common regions | Layout components are under `src/layouts/`; see [layouts](layouts.md). |

The source tree is mixed: shared controls, domain-aware components, form-lifecycle controls, and feature-coupled code coexist. Do not assume that everything under `src/components/` is a generic primitive; [`.claude/rules/07-component.md`](../../.claude/rules/07-component.md#rules) / [`.codex/rules/07-component.md`](../../.codex/rules/07-component.md#rules) requires contract and consumer checks.

## Representative contracts and consumers

| Component | Current contract / owner | Consumers and caveat |
| --- | --- | --- |
| `StatusBadge` | `label: string`, required `variant` (`success`, `warning`, `error`, `info`, `neutral`, `accent`), optional `className`; renders a span (`src/components/status-badge/index.tsx:3-39`). | Consumers include `src/components/customer/customer-card-type.tsx:3-48`; Promotion Type table/detail (`src/modules/products/promotion-management/promotion-type/components/PromotionTypeTableSection/index.tsx:3,32-35,121-127`, `src/modules/products/promotion-management/promotion-type/components/PromotionTypeDetailDrawer/index.tsx:2,237-244`); Offer list/detail (`src/modules/products/promotion-management/promotion/views/PromotionListPage/index.tsx:4,31-33,130-134`, `src/modules/products/promotion-management/promotion/components/OfferDetailTabs/index.tsx:3,26-30,122-123`); Background Main and Topic (`src/modules/system/theme-management/components/BackgroundMainTableSection/index.tsx:4-6,45-51,243-253`, `src/modules/system/theme-management/components/TopicTableSection/index.tsx:4-6,46-54,180-193`); and Topic priority sort (`src/modules/system/theme-management/topic/components/TopicPrioritySortContent/index.tsx:4-6,36-44,112-117`). Consumers map business states; the primitive does not own domain constants or labels. See [status system](status.md). |
| `FormLayout` | Props include `header`, `sidebar`, `defaultActiveSidebar`, footer controls, optional step/sidebar/status switches, loading and callback props (`src/layouts/form.layout.tsx:22-44,50-72`). | Coordinates form refs, validation, accumulated values, and tab query (`:73-109,119-162,164-230`). Representative consumers: `src/modules/users/customer/access-account/view/form.tsx:2,144`; `src/modules/users/operator/group-permission/create/form.tsx:4,55`; `src/modules/notifications/configuration/list-notification/create/automatic/form.tsx:1,219`; `src/modules/products/parameter/document-list/create/form.tsx:4,73`; and `src/modules/system/maintenance/view/form.tsx:1,101`. Its existing workflow is compatibility-sensitive. |
| `TableCardStatus` | Accepts optional global `Status` and optional display height/font weight; maps many status values to labels/colors (`src/components/table-card-status.tsx:6-180`). | Legacy cross-domain renderer; default/unknown output is blank text with gray pill treatment (`:162-180`). Not interchangeable with `StatusBadge` without mapping review. |
| Product Labels local badge family | `ProductLabelStatusBadge`, `DerivedStatusBadge`, and `ModeBadge` accept feature-owned status/mode values (`src/modules/products/configuration/product-labels/shared/StatusBadge.tsx:15-50`). | Feature-local rendering and style ownership; the names overlap with the shared primitive but contracts and meaning differ. |
| Input/select/switch/date/upload controls | Current shared contracts vary by component; for example upload and Form.Item-aware controls may own behavior beyond presentation. | Inspect actual props, change/value shape, disabled/read-only behavior, validation, loading and consumers before reuse. Component policy requires this check; this page does not claim an exhaustive prop catalog. |

## Reuse guidance and status

**ADOPTED TARGET:** Start with supported Ant Design UI, then inspect compatible repository/domain-shared controls and real consumers. Reuse only when semantics and lifecycle fit; use feature-local ownership for new single-feature behavior. Promote to `src/components` only with genuine cross-domain consumers, stable shared semantics, clear ownership, and no reverse dependency. These are policy statements in [`.claude/rules/07-component.md`](../../.claude/rules/07-component.md#rules) / [`.codex/rules/07-component.md`](../../.codex/rules/07-component.md#rules), not a claim that all current components meet the threshold.

**LEGACY-COMPATIBILITY:** Retain existing component props, default behavior, styles, and form lifecycle during normal maintenance. Before changing a shared contract, inspect every known consumer and preserve defaults unless callers migrate together. Component ownership may be mixed or uncertain where contracts/consumers were not exhaustively traced.

## Known limits

This baseline is representative, not a full inventory of every component's props and consumers. The prior audit found no current repository-level shared-component catalog and a missing referenced form-components audit (`docs/audits/design-system/2026-11-05/documentation-coverage.md:80-84,135-142`). High-risk controls, upload, rich text, and domain widgets need focused contract audits before implementation work. See [patterns](patterns.md) and [execution report](../reports/2026-11-05/design-system-baseline.md).

## Accessibility review

**ADOPTED TARGET:** For new or substantially changed components, review text/background contrast, visible keyboard focus, disabled and read-only states, error identification and feedback, accessible names for meaningful icons, and readable content at responsive sizes. Status meaning must not rely on color alone. WCAG 2.2 AA is the approved target, not a verified conformance claim; see [Color](color.md) for thresholds and current verification limits.
