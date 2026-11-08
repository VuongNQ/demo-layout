# Products Module Overview

This document is a source-verified map of `src/modules/products` as of
2026-10-02. It describes current implementation, not an endorsement of every
pattern. Target direction and mandatory rules remain in
[`.claude/ARCHITECTURE.md`](../../../.claude/ARCHITECTURE.md) and
[`.claude/rules/`](../../../.claude/rules/).

## Purpose and Scope

The products domain supplies the admin screens used to configure product lines,
product groups, cash-loan and credit-card products, product labels, add-on
products, document and information metadata, contract templates, fees, mobile
simulation/display configuration, card packages, and popular loans. This scope
is established by the route imports in `src/routes/index.tsx`, the product menu
tree in `src/helpers/menus.helper.ts`, and 312 files under
`src/modules/products`.

Frontend names and permission constants do not establish backend authorization,
production readiness, or business ownership. Those points remain subject to
backend/BA/runtime verification.

## Status Vocabulary

- **Implemented:** connected UI and request/state code exist. Runtime/backend
  behavior was not executed for this documentation task.
- **Partial/mock:** meaningful UI exists, but persistence or history is local
  mock data or the route is not a complete production flow.
- **Placeholder:** route renders static placeholder content.
- **Needs verification:** source cannot establish the business/backend fact.

## Submodule Inventory

| Boundary                     | Functionality and routes                                                                                                                                                                                                                                                                       | State/API owner                                                                                                                                                                                           | Status                                                                                                   | Detail                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Product configuration        | Product-line view/edit; product-group list/create/view/edit; cash-loan and credit-card product list/create/view/edit, draft, activation, import/export, and draft deletion. Routes: `/product/configuration/industry-setting/**`, `/group-list/**`, `/cash-loan/**`, `/credit-card/**`.          | `industry-product`/`group-list-product`: fully Redux-owned (`product-industry`, `product-group-list` slices). `cash-loan`/`credit-card`: hybrid — TanStack Query owns each line's paginated list read; Redux `product-list` slice remains sole owner of create/edit/view/status/draft-delete/import/export, bridged into the Query cache via explicit invalidation. Listener middleware owns most notifications/navigation. `list-product/` and its `utils.tsx` no longer exist (removed in the migration that produced `cash-loan/`/`credit-card/` as top-level siblings). | Implemented; large legacy-compatible trees for industry-product/group-list-product, hybrid Query/Redux for cash-loan/credit-card. | [Product Configuration](product-configuration.md) (index) → [Industry Product](product-configuration/industry-product.md), [Group List Product](product-configuration/group-list-product.md), [Cash Loan & Credit Card](product-configuration/cash-loan-credit-card.md) |
| Product Labels               | Cash-loan and credit-card label lists, filters, detail, create/edit, status, reorder, automatic/manual assignments, unlabeled catalogs, and mobile preview. Canonical routes include `/:line/create`, `/:line/view/:id`, and `/:line/edit/:id`; legacy routes redirect using `?tab=`. 78 files (`find`, 2026-11-05): 7 direct + `cash-loan/` 17 + `credit-card/` 16 + `shared/` 38.          | **Corrected 2026-11-05: no Redux slice exists** — `product-labels.slice.ts`/`.middleware.ts` were deleted. Each line owns its own TanStack Query hook/key-factory/service trio (fully Query-owned end to end: list, detail, history, assignment, mutations), independently per line, with no Redux↔Query bridge. `shared/` (38 files) supplies the route gate, list/form shells, assignment-draft helpers, and mobile-preview UI consumed by both lines, but owns no cache of its own.                 | Implemented in source; backend contracts/runtime need verification.                                      | [Product Labels](product-labels.md)                   |
| Card Gift Offers             | Rule list, create/edit/view shell, condition editor, assignment preview, and history UI at `/product/configuration/card-gift-offer/**`.                                                                                                                                                        | Module-local React state and `mock-data.ts`; catalog/reference calls occur directly in `rule-form.tsx`. No Redux slice, no TanStack Query. Route guard OR-permission fallback allows general credit-card product permissions, not only the feature's own `CARD_GIFT_OFFER_*`. | **Partial/mock, re-confirmed 2026-11-05:** every `apiFetcher` call is a read-only reference-data GET; save/status-change mutate only the in-memory `mock-data.ts` store — no create/update/status persistence endpoint exists.      | [Card Gift Offers](card-gift-offers.md)               |
| Display Information Set      | CRUD for presentation-configuration records (image, label set, fee set, required-info set, visibility flags) at `/product/parameter/display-information-set/**`. Sibling of `configuration/`, not a product entity itself.                                                                    | TanStack Query only, no Redux shadow. Fully feature-owned hooks/keys/service.                                                                                                                              | Implemented in source.                                                                                   | [Display Information Set](product-configuration/display-information-set.md) |
| Required information         | Two coupled but separately-owned submodules: `required-information/` — definitions (list/search, CSV export, create/edit/view/history) at `/product/parameter/required-information**`; `required-information-set/` — grouped/ordered sets with product-line scoping, single+batch status change, and mobile preview at `/product/parameter/required-information-set**`. No direct file import between them beyond one static options file. | Both fully Redux-owned (`required-information`/`required-information-set` slices + middlewares), no TanStack Query. A separate `common.slice.ts` independently caches overlapping required-information domain data for other consumers (`order-profile.tsx`, cash-loan rule files) — a two-owner situation at the domain level. | Implemented in source; reconciled against current source 2026-11-05 — see the document's §0 for a corrected cross-module-consumer attribution (segmentation/order consume the singular module only, not the set) and a confirmed permission cross-wiring in §13. | [Required Information](required-information.md)       |
| Documents and contracts      | Document groups, documents, document sets, and contract templates with CRUD/status/history; templates support draft/publish/delete, upload, merge-field inspection, and preview. Routes under `/product/parameter/{group-document-list,document-list,document-set,contract-template-list}/**`. 40 files total (8+9+9+14, `find`, 2026-11-05). | Four central slices (`product-document-group`, `product-document-list`, `product-document-set`, `contract-template`) and listeners, each with endpoint strings inline (no `src/services/products/` file); shared form widgets and ambient DTO/form types. `document-set`/`contract-template` data is also read directly by `products/configuration/cash-loan` and `credit-card` create/edit pages, and separately cached again via `common.slice.ts` — two to three independent caches of the same resources. | Implemented in source. `condition-list` and `input-form-list` are placeholders and absent from the menu (unrelated to this cluster, confirmed in a separate directory). The previously documented duplicate `group-document-list` route is **resolved** — confirmed gone from current `main.routes.tsx`/`form.routes.tsx`, 2026-11-05. | [Documents and Contracts](documents-and-contracts.md) |
| Fees                         | Fee-definition list/search/create/edit/view, status/batch status, import confirmation, template download, and export at `/product/parameter/product-fee-list/**`.                                                                                                                              | `fee-definition.slice.ts` and `product-fee-list.middleware.ts` (not one broad loading flag — import preview and upload each have their own, see [Fees](fees.md) §5); Ant Design forms use legacy fee enums/options, split two ways between this module's own `options/fee.ts` and `add-on/options/fee.ts`.                                                                                            | Implemented in source, re-confirmed 2026-11-05. Status-toggle/batch-status permission checks are not record-application-type-scoped, and the two product-create pages (cash-loan, credit-card) write the same Redux list state this feature owns — see [Fees](fees.md) §13. | [Fees](fees.md)                                       |
| Add-on products              | List/search/create/edit/view; summary and fee sections (loaded/saved independently); batch/single activation; distribution/deal/marketing reference lists shared with 17 product-configuration consumers and 3 users pickers; cash-loan, credit-card, standalone, and offset-loan fee variants. Routes under `/product/add-on/**`, 19 files. | `product-addon.slice.ts` (sole Redux owner, no TanStack Query) and listener middleware; the real edit-update endpoint is `updatedAddOnProductAPI` — `updateSummaryProductAddon`/`updateFeeProductAddon` exist in the slice but have no dispatcher anywhere in source. Edit/view loading is read from `fee-definition.slice.ts`, not this module's own slice; the view History tab is owned by `product-industry.slice.ts`. | Implemented in source; reconciled against current source 2026-11-05 — see the document's own §0 for corrections to the prior version and §13 for a trailing-space endpoint literal and other recorded findings. | [Add-on Products](add-ons.md)                         |
| Simulation and display order | Mobile simulation general settings, card-package list/config (no standalone generate action — settings save through the general config's `SIM_CARD` context), display-order priority/view-more rules, audit/history, dirty-draft protection, validation, and reset-to-default behavior. Routes: `/product/simulation/{view,edit}` and `/product/display-order/{view,edit}`. | `simulation.slice.ts`, `card-package.slice.ts`, simulation listener; feature-local mappers/validators and local form drafts. Card-package catalog loading writes into global `common.slice.ts` product/group state also read by `group-list-product/` and notification screens. | Implemented in source; reconciled against current source 2026-11-05 — corrected the generation-endpoint claim (dead code, no caller) and the display-order band-limit claim (split 50-100/100-200 ranges, not one 50-200 band); confirmed a display-order edit-permission cross-check mismatch, see the document's §13/§15. | [Simulation](simulation.md)                           |
| Popular loans                | View/edit a cash-loan collection, select/reorder assignable products, save configuration, and view history at `/product/popular-loans/{view,edit}`.                                                                                                                                            | Feature-local `api-mappers.ts` service/coordinator and local editor state; no Redux slice.                                                                                                                | Implemented in source; backend response variants are defensively mapped. Edit route checks only `PRODUCT_POPULAR_LOANS_EDIT` while view/menu check only `PRODUCT_POPULAR_LOANS_VIEW` — see [Popular Loans](popular-loans.md) §13. | [Popular Loans](popular-loans.md)                     |
| Attractive offer | Cash-loan-scoped config (name, on/off, ordered assigned products) plus an update-history tab at `/product/attractive-offer/{view,edit}`. No create route. | Feature-local `api-mappers.ts` coordinator and local editor state (`baseline`/`draft`/`products`); no Redux slice, no TanStack Query. Catalog-query/mapper/utility code is byte-identical to Popular Loans' with no import between them — `NEEDS-TEAM-DECISION` whether that should be shared. | Implemented in source; several `NEEDS-VERIFICATION` backend response-shape assumptions and one potential cross-group-overwrite risk — see [Attractive Offer](attractive-offer.md) §13. | [Attractive Offer](attractive-offer.md) |
| Promotion management | Two separate backend resources: `promotion/` — full list/create/view/edit CRUD for product offers (no delete) at `/product/promotion-management/promotion/**`; `promotion-type/` — list, create, view/edit drawer, and status toggle (no delete, no filter UI) for offer types at `/product/promotion-management/promotion-type/**`. Grew from a 9-file Sprint-1 `promotion-type/` to 69 files total (`promotion/` 41 + `promotion-type/` 26 + 2 shared root files). | Both fully TanStack-Query-owned, no Redux, colocated `queryOptions`; services/DTOs at the target location `src/services/products/`. Separate permission constants (`PRODUCT_PROMOTION_*` = `offer:*` for `promotion/`; `PROMOTION_MANAGEMENT_*` = `offer_type:*` for `promotion-type/`, an intentional identifier/string-value mismatch). | Implemented in source for both, beyond the old Sprint-1 scope. Backend verb/contract details flagged `NEEDS-VERIFICATION` in both child documents. | [Promotion Management](promotion-management.md) (index) → [Promotion](promotion-management/promotion.md), [Promotion Type](promotion-management/promotion-type.md) |
| Exclusive Touch            | Bulk-assigns products to a home-screen "layout" product type (browse by type with counts, keyword/status filter, server sort/paginate), plus a mobile preview (audience + start date) and a static layout-sample grid. Route: `/product/exclusive-touch/management`. No create/edit/view flow for an individual entity. | TanStack Query only, no Redux shadow for this module's own resources (`grep -rni "exclusive" src/redux/` — no match); feature-local `hooks/`, `queryKeys/` (keys-only), `services/`, `types.ts`. Also runs its own Query cache for product types/tags/customer segments that Redux already owns elsewhere (`product-list.slice.ts`, `common.slice.ts`) — two caches over the same backend data. | Implemented in source; backend semantics of the bulk-assign PUT, two disagreeing `status`/`statuses` type unions, and near-total hardcoded Vietnamese UI text are open questions. | [Exclusive Touch](exclusive-touch.md) |
| Scheme Sync                | Cash-loan scheme synchronization/classification screen (trigger/poll a Product Service sync run, per-group KPIs and row list, changed-row comparison, publish, cron-schedule edit) plus an integrated batch Excel import sub-flow (upload, server-side validate with per-cell errors, preview, confirm, import/publish history tabs). One route, `/product/configuration/scheme-sync`; `import/` has no route of its own. 63 files (44 + 19 in `import/`, `find`, 2026-11-05). | TanStack Query only, no Redux shadow (`grep -rni "scheme" src/redux/` — one unrelated hit). Services at the target location, `src/services/products/{scheme-sync,scheme-import}.service.ts`. Group/filter/page state is genuine URL state (`useSearchParams`), not the repository's dominant Redux `pageParam` pattern. | Implemented in source, rewritten 2026-11-05 replacing a stale mock-architecture planning document (`scheme-sync-import-plan.md`, since deleted — see `docs/README.md`). One documented, intentional transport-boundary deviation (direct S3 `fetch` for the presigned-upload PUT) and several cache-invalidation gaps between the parent and `import/` — see the document's §13. | [Scheme Sync](scheme-sync.md) |

## Architecture and Data-Flow Map

```text
src/routes/index.tsx
  -> MainLayout for lists / BasicLayout for forms and detail
  -> AuthGuard + WithGuard, or ProductLabelsRouteGate
  -> src/modules/products/<feature>
     |
     +-- dominant legacy-compatible flow
     |     component/FormLayout
     |       -> central Redux thunk
     |       -> window.apiFetcher / apiFetcher
     |       -> reducer-owned server state
     |       -> listener notification/navigation/refresh
     |
     +-- Product Labels flow
     |     route gate/page/form
     |       -> per-line TanStack Query hooks (list/detail/history/mutations, no Redux owner)
     |       -> feature repository + runtime guards + mapper
     |       -> ApiFetcher
     |       -> local Ant Form + assignment draft
     |
     +-- Popular Loans flow
     |     FormLayout/editor
     |       -> feature-local API coordinator/mappers
     |       -> ApiFetcher
     |       -> local state
     |
     `-- Card Gift Offer flow
           FormLayout/rule editor
             -> in-memory mock persistence
             -> direct API reads for preview references
```

Central product slices are registered in `src/redux/slices.ts`; their listener
middleware is registered by `makeStore` in `src/redux/store.ts`. New code must
follow the dependency and API rules rather than adding new endpoint catalogs to
large slices; existing flows remain legacy-compatible when migration is outside
the authorized task.

## Shared Dependencies

### Application infrastructure

- Routing and permissions: `src/routes/index.tsx`, `src/utils/navigate.ts`,
  `src/helpers/menus.helper.ts`, `src/constants/permission.constant.ts`,
  `src/guards/index.tsx`, `src/hooks/auth.hook.ts`.
- Workflow shell: `src/layouts/form.layout.tsx`, `src/types/form.d.ts`, shared form
  wrappers, modal, notification, query-state, table, upload, and rich-text
  components under `src/components` and `src/hooks`.
- Transport/reference state: `src/utils/api-service.ts`,
  `src/redux/slices/common.slice.ts`, ambient product contracts under
  `src/types/*.d.ts`, and translations in `src/lang/{vi,en}.json`.

### Cross-domain dependencies imported by products

- Product-line, group, and product rules import customer-segmentation options,
  utilities, and types from `src/modules/users/customer/segmentation/**` and
  `src/types/segmentation-customer.d.ts`.
- Product create/edit loads segmentation lists from
  `src/redux/slices/segmentation-customer.slice.ts`.
- Add-on create/view loads affiliated partners; add-on distribution options are
  also consumed by the users/affiliate-partner feature.

### External consumers of product-owned internals

- Multiple history screens in users, system, contents, and notifications import
  `convertFieldActionType` from
  `src/modules/products/configuration/industry-product/ultis.tsx`.
- Notification code imports `returnStatusForm` from
  `src/modules/products/parameter/contract-termplate/utils.tsx`.
- Shared import/search/document/industry forms import product-local options,
  form models, and constants.
- `src/utils/form.ts` imports fee options; `src/utils/navigate.ts` imports the
  Product Labels route type.
- Users/affiliate-partner imports add-on distribution options. Users role forms
  consume add-on slice data. Customer segmentation and order components consume
  required-information/product slice selectors.

These are proven reverse/cross-domain dependencies. Any move or signature
change requires a complete consumer audit; do not assume `src/modules/products`
is internally encapsulated.

## Current Patterns and Compatibility Constraints

- Lists usually retain page/filter/sort in `useQueryState`, dispatch a Redux
  search thunk, and render shared search/table/pagination components.
- Most create/edit/view flows use `FormLayout` and imperative `FormRef` child
  forms. Create and edit transformations are frequently duplicated rather than
  shared.
- Listener middleware normally owns success/error notifications and navigation,
  but some components also notify or navigate directly.
- Most product contracts remain ambient globals in `src/types/*.d.ts`; Product
  Labels, Popular Loans, display order, and card packages use feature-local
  exported types and mappers.
- Several slices use one broad `loading` flag for list/detail/mutations. Product
  Labels and card packages add keyed/request-specific state and request IDs.
- Status values include `ACTIVE`, `INACTIVE`, `UPCOMING`, and `DRAFT`, but the
  allowed transitions are feature-specific and must be traced from the UI and
  endpoint used.
- Existing enums such as `EProductStatus`, tab enums, fee-method enums, and
  import enums are current implementation facts. New or refactored code follows
  [the constants policy](../../../.claude/rules/02-typescript.md); do not migrate
  a legacy enum during a small fix.
- TypeScript 5.3.3 is installed. The target is TypeScript 5.8+, but new work must
  remain compatible with the installed compiler until the separate upgrade is
  completed.

## Known Risks and Documentation Contradictions

| Impact | Evidence-backed risk                                                                                                                                                                                                                                                         |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGH   | Product payload lifecycle spans very large create/edit/view trees, ambient models, the shared `product-list.slice.ts` (`productListSlice`, see [Cash Loan & Credit Card](product-configuration/cash-loan-credit-card.md)), listener middleware, segmentation, and several reference slices. A local field change can affect draft/final and both product variants.       |
| HIGH   | Route, menu, and component permissions are separate. Product Labels adds a custom route gate. Frontend checks do not prove backend authorization.                                                                                                                            |
| HIGH   | Cross-domain imports in both directions make product utilities/options de facto shared contracts without shared ownership.                                                                                                                                                   |
| HIGH   | Card Gift Offer routes look complete, but persistence/history are mock-only. Treating it as production CRUD would be incorrect.                                                                                                                                              |
| MEDIUM | `/product/parameter/condition-list`, `/input-form-list`, and `/product/configuration/list/edit/:id` render placeholders; their presence does not prove implemented workflows.                                                                                                |
| MEDIUM | Endpoint strings are embedded in large Redux slices and a few components/utilities. Error shapes and notification ownership vary.                                                                                                                                            |
| MEDIUM | Broad loading flags can couple independent list/detail/update requests. Product Labels/card-package request IDs are exceptions, not module-wide behavior.                                                                                                                    |
| MEDIUM | README says Redux Toolkit is the sole source of truth and describes React Router 6; source contains feature-local ownership and `package.json` installs React Router DOM 7.18.3. Use current source and `.codex/knowledge/PROJECT_CONTEXT.md`, not that statement, for maintenance decisions. |
| LOW    | Folder name `contract-termplate` and several `ultis.tsx`/ambient type names are misspelled public paths; renaming has a wide import impact.                                                                                                                                  |

## Needs Verification

- Backend validation, authorization, status-transition guarantees, and whether
  every listed endpoint is enabled in each deployment.
- Whether product label automatic assignment, mobile visibility warnings, and
  product membership semantics match approved BA rules.
- Whether Card Gift Offers are intentionally a mock/prototype and what backend
  contract will replace the in-memory store.
- Whether generic product edit, condition-list, and input-form-list routes are
  intentionally retained, planned, or safe to remove.
- Minimum browser/manual regression matrix and authoritative product variants.
- Ownership of segmentation rule definitions currently imported from users.

## Task-Oriented Reading Guide

1. **Any products task:** read repository `CLAUDE.md`, this overview,
   the relevant detailed document, and applicable `.claude/rules/*.md`.
2. **Product field/payload change:** read
   [Product Configuration](product-configuration.md), and the focused
   [Industry Product source map](product-configuration/industry-product.md) for
   product-line work,
   both product variant form files, [Cash Loan & Credit Card](product-configuration/cash-loan-credit-card.md),
   `product-list.slice.ts`, and `product.middleware.ts`; audit segmentation and
   reference-data consumers.
3. **Label behavior:** read [Product Labels](product-labels.md), `routes.ts`, the
   applicable form/rule engine/repository, the shared API repository, Redux
   slice, and listener.
4. **Reference parameter change:** read the applicable parameter document and
   inspect all product/group/add-on consumers before changing status or shape.
5. **Route/permission change:** inspect route, `PageURLs`, menu entry, permission
   constant, custom/action checks, deep links, and redirects together.
6. **Shared helper/type move:** search all of `src`, including consumers outside
   products. Treat the change as high-risk when the consumer set crosses domains.
7. **After behavior changes:** update this overview when boundaries or ownership
   change and update the detailed context when a route, contract, flow,
   permission, validation rule, endpoint, or side effect changes.

## Missing Referenced Documentation

`ONBOARDING.md`, `.agents/`, and `.github/documents/` are absent in the current
checkout, although `CLAUDE.md` refers to `.agents/` and `.github/documents/`.
No contents from those missing paths are assumed here.
