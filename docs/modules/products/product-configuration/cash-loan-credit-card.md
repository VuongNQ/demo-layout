# Cash Loan & Credit Card Product CRUD — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

This document replaces the cash-loan/credit-card portions of
`../product-configuration.md` (its §2, §3 "Products", §4 "Products" business
rules, §5, §6, and the cash-loan/credit-card rows of its §10). It was produced
by a dedicated reconciliation run after
`docs/reports/2026-11-04/products-docs-reconciliation.md` found the prior
description (a central `product-list` Redux slice plus `list-product/utils.tsx`)
stale: `src/modules/products/configuration/list-product/` no longer exists.

**Split decision.** `cash-loan/` (31 files) and `credit-card/` (30 files) are
documented as **one combined document**, not two, and `display-information-set/`
is **not** folded in (it has its own document, `display-information-set.md`).
Justification, following the coupling-check method used for
`system/theme-management`'s Background Main/Lock split:

- Both submodules dispatch the **same** Redux slice, `product-list.slice.ts`
  (`productListSlice`, registered `src/redux/slices.ts:49`), for every
  single-product CRUD operation (create, update, draft save/delete, status
  toggle, section reads) and for list-level bulk activate/import/export. They
  are not two independent consumers of a shared type; they are two call sites
  of the identical thunks, reducers, and listener middleware
  (`src/redux/middlewares/product.middleware.ts`).
- Both follow the identical hybrid migration shape: a feature-owned TanStack
  Query hook/service/key-factory trio owns the paginated list *read*, while
  the same legacy slice still owns every mutation, bridged back into the
  Query cache by an explicit, awaited `queryClient.invalidateQueries(...)`
  call after each Redux mutation's `fulfilled` action. Documenting this
  pattern once and cross-referencing it twice would duplicate the slice's
  thunk list, the bridge code, and the `NEEDS-VERIFICATION` items that attach
  to the slice itself (not to either feature alone).
- A real, if narrow, defect spans both: `confirmImportListProduct` and
  `confirmImportListProductMarketing` (`product-list.slice.ts:700-711`) are
  byte-identical thunk bodies, and the template/export endpoints both list
  pages dispatch are hardcoded to `products/cash-loan/template` and
  `products/cash-loan/export` (`product-list.slice.ts:715,735`) — credit-card's
  list page dispatches the same cash-loan-path thunks. A single document
  states this once instead of forking the finding.
- By contrast, there is **no direct file-to-file import between the two
  folders**: neither `cash-loan/` nor `credit-card/` imports from the other's
  directory. The coupling is entirely through the shared Redux slice/
  middleware and the shared `PageURLs`/permission-constant naming convention,
  not through component or hook reuse. Business content (card fields vs.
  installment-plan fields, card-specific fee/marketing/gift-loan sections) is
  kept in clearly separated subsections below rather than merged.

**Verification-gap limit (top 5; remainder in §15):**

1. `getProductList`/`watchProductList` (Redux, endpoint `products/search`) is
   still dispatched from inside the create/edit/promotion flows as a
   reference catalog, while each list page's own paginated read now calls a
   *different* endpoint (`products/cash-loans/search`,
   `products/credit-cards/search`) through Query. Whether these return
   consistent/overlapping rows for the same backend data is
   **NEEDS-VERIFICATION**; if they diverge, the "one resource, one owner"
   rule in `.claude/ARCHITECTURE.md` §11 is in tension.
2. The cash-loan quick-edit cache patch
   (`cash-loan/CashLoanProductList.tsx:143-190`, specifically line 172) sets
   `status: hasAudience ? item.status : 'INACTIVE'` as a client-side override
   of the server response. Whether the backend enforces or expects this rule
   is **NEEDS-VERIFICATION**.
3. Whether the backend's `products/cash-loan/template` and
   `products/cash-loan/export` endpoints also correctly serve credit-card
   rows (credit-card's list page dispatches these same cash-loan-named
   thunks) is **NEEDS-VERIFICATION**.
4. Whether `PUT products/:id/product-draft` and the quick-update endpoint
   (`services/cash-loan-product.service.ts`) are both authoritative writers
   of product status, and how they reconcile, is **NEEDS-VERIFICATION**.
5. The product audit-history endpoint used by both lines' `view/history.tsx`
   is `GET api/admin/portal/v1/request-application/:id/audit`
   (`product-industry.slice.ts:178-184`) — a request-application-named
   endpoint serving product history. Whether this is intentional shared
   infrastructure or a naming artifact is **NEEDS-VERIFICATION**.

## 1. Responsibility

List, create, edit, view, activate/deactivate, import, export, and delete
drafts of cash-loan and credit-card products at
`/product/configuration/cash-loan/**` and `/product/configuration/credit-card/**`.
Product-line/group/segmentation/reference data (documents, fees, required-info
sets, contracts, add-ons, product labels) are consumed as reference inputs
owned elsewhere; this document covers only the cash-loan/credit-card product
entity's own CRUD lifecycle.

## 2. Entry points and routes

All routes use `WithGuard` + `AuthGuard`, a single-permission array, and a
`lazy()` page export per `.claude/rules/06-routing-permission.md`.

| Line | Action | Path | Route file:line | Lazy export (`pages.tsx`) | Permission |
| --- | --- | --- | --- | --- | --- |
| Cash loan | List | `/product/configuration/cash-loan` | `main.routes.tsx:163-168` | `:236` | `PRODUCT_VIEW_CASH_LOAN` |
| Cash loan | Create | `.../cash-loan/create` | `form.routes.tsx:445-454` | `:241` | `PRODUCT_CREATE_CASH_LOAN` |
| Cash loan | View | `.../cash-loan/view/:id` | `form.routes.tsx:465-470` | `:243` | `PRODUCT_VIEW_CASH_LOAN` |
| Cash loan | Edit | `.../cash-loan/edit/:id` | `form.routes.tsx:481-486` | `:245` | `PRODUCT_EDIT_CASH_LOAN` |
| Credit card | List | `/product/configuration/credit-card` | `main.routes.tsx:170-177` | `:237-238` | `PRODUCT_VIEW_CREDIT_CARD` |
| Credit card | Create | `.../credit-card/create` | `form.routes.tsx:456-463` | `:242` | `PRODUCT_CREATE_CREDIT_CARD` |
| Credit card | View | `.../credit-card/view/:id` | `form.routes.tsx:472-479` | `:244` | `PRODUCT_VIEW_CREDIT_CARD` |
| Credit card | Edit | `.../credit-card/edit/:id` | `form.routes.tsx:488-495` | `:246` | `PRODUCT_EDIT_CREDIT_CARD` |

`PageURLs` (`src/utils/navigate.ts:119-139`) exposes line-parameterized
builders only: `ofProductList`, `ofProductCreate`, `ofProductView`,
`ofProductEdit` (`ProductListLine = 'cash-loan' | 'credit-card'`). There is no
line-specific builder. **Inconsistent use, CONFIRMED:** cash-loan's own view
pages do not use `ofProductEdit`/`ofProductView` — nine call sites hard-code
the path string instead (`cash-loan/edit/index.tsx:176,192`;
`view/general-info.tsx:71`; `view/history.tsx:46`; `view/installment-plan.tsx:63`;
`view/loan-packages.tsx:226`; `view/other-info.tsx:107`; `view/promotion.tsx:96`;
`view/rule.tsx:179`). Credit-card's own hard-coding was not independently
re-verified in this pass.

Menu entries: cash-loan `menus.helper.ts:177-179` (single permission); the
shared parent group at `:164` and `:191` uses an OR array
`[PRODUCT_LINE_VIEW_CREDIT_CARD, PRODUCT_LINE_VIEW_CASH_LOAN]`. Credit-card's
own entry: `:183-185`.

## 3. Directory map

### `cash-loan/` (31 files)

| File | Responsibility |
| --- | --- |
| `CashLoanProductList.tsx` | List page: Query list read, Redux bulk/import/export bridge, quick-edit host |
| `CashLoanProductList.styles.ts` | Emotion styles for the list page and searcher |
| `cash-loan-product-table.utils.ts` | Table-cell formatters (amount/term/interest rate) |
| `components/CashLoanSearcher.tsx` | List filter form; Redux catalogs (document sets, segments) |
| `components/CashLoanQuickEdit.tsx` | Quick-edit modal: Query detail + mutation, fully Query-owned |
| `components/ProductLabelsField.tsx` | Wraps the cross-module product-labels Query hook |
| `hooks/cashLoanProductQueries.ts` | `useCashLoanProductListQuery`, `useCashLoanQuickUpdateQuery`, `useUpdateCashLoanQuickUpdateMutation` |
| `queryKeys/cash-loan-product.query-keys.ts` | Keys-only factory: `all`, `lists()`, `list(params)`, `quickUpdate(id)` |
| `services/cash-loan-product.service.ts` | `window.apiFetcher` calls for list read and quick update |
| `types.ts` | List/quick-edit DTOs and props (depends on ambient `Filter`/`Status`/`Pagination`) |
| `create/index.tsx` + 5 section files (`general-info`, `other-info`, `installment-plan`, `promotion`, `rule`) | Create wizard: Redux `createProduct`, draft + final submit |
| `edit/index.tsx` + 5 section files | Edit wizard: Redux `updateProduct`, draft save, discard |
| `view/index.tsx` + 5 section files + `history.tsx` + `loan-packages.tsx` + `document-service-section.tsx` | Read-only sections, status toggle, draft delete, history, loan-package table (own direct `apiFetcher.get`, not via a service) |

### `credit-card/` (30 files)

| File | Responsibility |
| --- | --- |
| `CreditCardProductList.tsx` | List page: Query list read, Redux bulk/import/export bridge (no quick-edit) |
| `CreditCardProductList.styles.ts` | Emotion styles |
| `components/CreditCardSearcher.tsx` | List filter form; Redux catalogs |
| `components/ProductLabelsField.tsx` | Wraps the cross-module product-labels Query hook (credit-card variant) |
| `create/index.tsx` + 5 section files (`general-info`, `card-info`, `other-info`, `promotion`, `rule`) | Create wizard |
| `edit/index.tsx` + 5 section files | Edit wizard |
| `view/index.tsx` + 5 section files + `history.tsx` | Read-only sections, status toggle, draft delete, history |
| `hooks/creditCardProductQueries.ts` | `useCreditCardProductListQuery` only — no quick-update hook |
| `queryKeys/credit-card-product.query-keys.ts` | Keys-only factory: `all`, `lists()`, `list(params)` |
| `services/credit-card-product.service.ts` | `window.apiFetcher` call for list read |
| `types.ts` | List DTOs (same ambient-dependency pattern as cash-loan) |
| `shared/card-fees-fields.tsx`, `shared/card-fees-validation.ts`, `shared/card-gift-offer-fields.tsx` | Card-specific fee editor, fee validator, gift-loan picker (reuses `CashLoanCatalogModal`) |

Both counts confirmed via `find <dir> -type f | wc -l` (31 and 30) with
matching hand enumeration; no discrepancy.

## 4. Main runtime flows

### List read (Query-owned, both lines)

```text
CashLoanProductList.tsx / CreditCardProductList.tsx
  -> useCashLoanProductListQuery / useCreditCardProductListQuery
  -> <line>ProductQueryKeys.list(params)  (placeholderData: keepPreviousData, no explicit staleTime)
  -> <line>-product.service.ts  -> window.apiFetcher.get('products/<line>s/search', ...)
```

Enabled only while `isCurrentPath()` is true; that gate reads Redux
`query.slice.ts`'s `pageParam.path`, so Query enablement is itself
Redux-gated — a documented cross-owner coupling, not a defect.

### Bulk activate / import confirm / template-export (Redux → Query bridge)

```text
list page dispatch(updateActiveState | confirmImportListProduct[Marketing])
  -> product-list.slice.ts thunk -> PUT/POST .../products/...
  -> product.middleware.ts (notification)
  -> on `.fulfilled` only: await queryClient.invalidateQueries({ queryKey: <line>ProductQueryKeys.lists() })
```

This is the explicit migration-bridge pattern `.claude/ARCHITECTURE.md` §11
permits. The Redux reducer for `updateActiveState` also still writes its own
copy of `state.productList` (`product-list.slice.ts:111-121`) even though no
list page reads that selector any more — a harmless but real double-write,
not a double-read.

### Quick edit (cash-loan only, fully Query-owned)

```text
CashLoanQuickEdit.tsx
  -> useCashLoanQuickUpdateQuery(id)        [Query, no staleTime]
  -> useUpdateCashLoanQuickUpdateMutation() [no onSuccess/onError in the hook]
  -> on submit: mutateAsync(...) -> refetch() the single quickUpdate(id) query
  -> caller's onSuccess (CashLoanProductList.tsx:143-190):
       queryClient.setQueriesData(lists(), patch) [not invalidation; synchronous; status overridden client-side]
       dispatch(setNotification(...))
```

Credit-card has no equivalent flow; its list page offers no row-level quick
edit.

### Create / edit / view / draft-delete / status-toggle (Redux-owned, both lines)

```text
create|edit section forms (forwardRef<FormRef>, useFormImperativeHandle)
  -> createProduct | updateProduct (isDraft: true|false)
  -> product-list.slice.ts thunk -> PUT/POST .../products[...]
  -> product.middleware.ts (notification + navigation)

view/index.tsx
  -> getProductSummary (mount) / updateProductStatus (toggle) / deleteProductDraft (DRAFT only)
```

Section reads (`getProductInsurance`, `getProductRule`, `getProductPromotion`,
`getProductMoreInfo`, `getDocumentServiceGroups`) are all the same slice,
dispatched from each section's own `view`/`edit` file.

### History (Redux, different slice)

```text
view/history.tsx -> getListUpdatedHistories({ id, entityType: 'PRODUCT' })
  -> product-industry.slice.ts -> GET request-application/:id/audit
```

Both lines use this same cross-slice call.

## 5. State ownership

| Concern | Owner | Evidence |
| --- | --- | --- |
| Paginated list read (both lines) | TanStack Query, feature-owned hook/keys/service | `hooks/<line>ProductQueries.ts`, `queryKeys/`, `services/` |
| Bulk activate/deactivate | Redux (`productListSlice.updateActiveState`), bridged into Query via explicit invalidation | `CashLoanProductList.tsx:256-268`, `CreditCardProductList.tsx:189-203` |
| Import confirm (product / marketing) | Redux, same bridge pattern | `*ProductList.tsx` confirm handlers |
| Template download / export | Redux, no cache effect (read-only side effects) | `downloadTemplate`, `downloadListProducts` |
| Quick edit (cash-loan only) | TanStack Query end-to-end; bypasses Redux | `CashLoanQuickEdit.tsx` |
| Create / update / draft save/delete / status toggle (single product) | Redux (`productListSlice`), **sole** owner, both lines | `create/index.tsx`, `edit/index.tsx`, `view/index.tsx` |
| Section reads (summary/insurance/rule/promotion/moreInfo/document-service) | Redux (`productListSlice`), both lines | section files, both folders |
| Reference "all products" catalog used inside promotion sections and edit-payload assembly | Redux (`productListSlice.getProductList`/`watchProductList`), **cash-loan only** — credit-card has no consumer of this selector | `cash-loan/create/index.tsx:84,601`; `create/promotion.tsx`; `edit/index.tsx:149`; `edit/promotion.tsx`; `view/promotion.tsx` |
| History | Redux, `product-industry.slice`, not `productListSlice` | `view/history.tsx` both lines |
| `loan-packages` table (cash-loan view only) | Neither: direct `apiFetcher.get` inside the component | `cash-loan/view/loan-packages.tsx:151` |
| URL/filter/page/sort UI state | Redux `query.slice.ts` via `useQueryState`, feeding both the Query `enabled` gate and the filter form | `useQueryState` in both list pages |

**`productListSlice` verdict (CONFIRMED, not NEEDS-VERIFICATION):** it is
**not dead code and not superseded**. It remains the sole authoritative owner
of every single-product CRUD operation and every list-level bulk/import/export
action for both cash-loan and credit-card. Only the paginated list *read* on
each line's own list page has migrated to TanStack Query, via an explicit,
awaited, `fulfilled`-gated invalidation bridge — exactly the "explicitly
designed migration bridge" exception `.claude/ARCHITECTURE.md` §11
anticipates. This was confirmed by reading the actual imported symbols at
every one of the 41 repo-wide import sites of `product-list.slice`, not by
the file's continued existence alone.

## 6. API boundaries

### Query-owned checklist (TEMPLATE.md content rule 15), per line

| | Cash loan | Credit card |
| --- | --- | --- |
| Redux shadow on the *list read itself* | No selector reads list rows for this page; `getProductList`/`watchProductList` is a separate reference catalog (see §5) consumed elsewhere | No selector reads list rows; no consumer of `watchProductList` at all in this folder |
| Key factory shape | Keys-only (`all`, `lists()`, `list(params)`, `quickUpdate(id)`); imports only its own `types`, not `services/` | Keys-only (`all`, `lists()`, `list(params)`); imports only its own `types`, not `services/` |
| Query hooks / consumers | `useCashLoanProductListQuery` (1 consumer), `useCashLoanQuickUpdateQuery` (1), `useUpdateCashLoanQuickUpdateMutation` (1) | `useCreditCardProductListQuery` (1 consumer) — the module's only hook |
| `staleTime` | None (TanStack default 0) on both the list and quick-update queries | None (TanStack default 0) |
| `placeholderData: keepPreviousData` | Present on the list query; absent (correctly) on the quick-update detail query | Present on the list query |
| Mutation invalidation | Quick-edit mutation itself invalidates nothing — the *caller* patches `lists()` via `setQueriesData`, not invalidation, and does not await it | N/A (no mutation hook in this folder) |
| Redux→Query bridge invalidation | `lists()`, awaited, gated on `.fulfilled` (activate, import×2) | Identical: `lists()`, awaited, gated on `.fulfilled` (activate, import×2) |

Neither key factory uses the `queryOptions`-colocated shape
`.claude/rules/03-api-service.md` names as the expected shape for a
Query-owned feature being updated; both remain in the keys-only-plus-hook
shape. This is a target gap (**SHOULD**, not a violation) since the
exceptions named in that rule do not list these two folders, but it is also
not a defect — the existing shape is internally consistent and typed.

### Non-Query endpoints (both lines, via `product-list.slice.ts`)

| Operation | Method/endpoint | Thunk |
| --- | --- | --- |
| Create (final/draft) | `POST products` / `POST products/draft` | `createProduct` |
| Update (final/draft) | `PUT products/:id/product` / `PUT products/:id/product-draft` | `updateProduct` |
| Draft delete | `DELETE products/:id/product` | `deleteProductDraft` |
| Status toggle | `PUT products/:id/summary` | `updateProductStatus` |
| Bulk activate/deactivate | `PUT products/:status` | `updateActiveState` |
| Import confirm (product / marketing) | `POST products/import/:id/confirm` (**identical for both**, flagged §13) | `confirmImportListProduct` / `confirmImportListProductMarketing` |
| Template / export | `GET products/cash-loan/template` / `GET products/cash-loan/export` (**hardcoded to the cash-loan path for both lines**, flagged §13) | `downloadTemplate` / `downloadListProducts` |
| Section reads | `GET` per section (summary/insurance/rule/promotion/more-info/document-service-groups) | `getProduct*` |
| Reference catalog | `GET products/search` | `getProductList` |

## 7. Forms and validation

Both lines use AntD `Form`/`FormInstance` exclusively via `forwardRef<FormRef>`
section components and `useFormImperativeHandle`, under the shared
`FormLayout`/`FormRef` contract. No Zod, no React Hook Form in either folder
(confirmed by grep). Cash-loan's quick-edit modal is the one AntD-form
exception worth naming: it uses `Form.useForm`/`Form.useWatch` directly with
inline AntD validators (`vipCodeRule`, `positiveValueRule`,
`getRangeValidationRule`), not the `FormRef` wizard pattern, because it is a
single-section modal, not a multi-step wizard.

Create and edit submit two intentionally different payload branches
(draft vs. final) built by line-specific normalizers
(`normalizeUpdatedProductCashLoan` / `normalizeUpdatedProductCreditCard`),
consistent with `../product-configuration.md`'s existing business-rule
statement that cash-loan and credit-card forms are intentionally different
(installment-plan section vs. card configuration/fees/marketing/gift-loan/
statement-date conversion). That business-rule statement in
`product-configuration.md` is **unaffected** by this document's architecture
correction and is not repeated here beyond this cross-reference.

## 8. Types and DTO organization

Both `types.ts` files are feature-owned for list/DTO shapes but still depend
on unimported ambient globals: `Status` (`src/types/status.d.ts`), the
line-specific `*ProductListFilter` (`src/types/Filter.d.ts`), and `Pagination`
(`src/types/pagination.d.ts`). This is `legacy-compatible`, not a defect,
per `.claude/ARCHITECTURE.md` §9. Two independently maintained normalizer
functions exist for the same filter shape (`normalizeCashLoanFilters` in the
searcher vs. `normalizeListParameters` in the cash-loan query-keys file vs.
`buildCashLoanProductListEndpoint` in the service) — three places perform
overlapping normalization for one filter object; not unified in this pass.

## 9. Permissions

Ten permission constants are in play across both lines plus one cross-domain
OR partner, which meets the content-rule-9 table threshold.

| Permission | Enforced at route | Enforced at menu | Enforced at component |
| --- | --- | --- | --- |
| `PRODUCT_VIEW_CASH_LOAN` | list, view routes | list menu entry | — |
| `PRODUCT_CREATE_CASH_LOAN` | create route | — | create button, import dropdown, empty-state create button |
| `PRODUCT_EDIT_CASH_LOAN` | edit route | — | bulk-activate summary bar, quick-edit button (+ `quickUpdatable !== false`) |
| `PRODUCT_DELETE_CASH_LOAN` | **not enforced at route or menu** | — | draft-delete button only (`view/index.tsx`) |
| `PRODUCT_VIEW_CREDIT_CARD` | list, view routes | list menu entry | — |
| `PRODUCT_CREATE_CREDIT_CARD` | create route | — | create button, import dropdown, empty-state create button |
| `PRODUCT_EDIT_CREDIT_CARD` | edit route | — | bulk-activate summary bar |
| `PRODUCT_DELETE_CREDIT_CARD` | **not independently confirmed**; likely same component-only pattern as cash-loan (NEEDS-VERIFICATION) | — | draft-delete button (assumed; not independently re-verified) |
| `PRODUCT_LINE_VIEW_CASH_LOAN` / `PRODUCT_LINE_VIEW_CREDIT_CARD` | — | parent menu group, OR array (`menus.helper.ts:164,191`) | — |
| `CARD_GIFT_OFFER_VIEW` / `CARD_GIFT_OFFER_EDIT` | OR-combined with credit-card permissions on some routes (`form.routes.tsx:175,185,195`; `main.routes.tsx:155`) — **not independently confirmed which page each such route renders**; flagged §15 | — | — |

Every in-component check in both folders is a single-permission array
evaluated with the app's OR/`some` semantics (no dynamic resolver, no `every`
mode, per content rule 14). `PRODUCT_DELETE_*` being enforced only at the
component layer, with no route- or menu-level backing, is the one real gap
worth flagging — see §13.

## 10. Shared and cross-domain dependencies

- **Same-slice dependents (not cross-domain, but cross-feature):** both
  folders import `product-list.slice.ts`; so does
  `src/modules/order/loan-order-list/component/adjustment.tsx` (reference
  data) and three shared import-form components
  (`src/components/forms/import/**`), `src/components/product-configuration/card-marketing-fields.tsx`,
  and `src/modules/users/operator/user-operator-list/list.operator.tsx`
  (import-reset side effects only). Any change to `product-list.slice.ts`'s
  shape or thunk signatures is therefore a wider blast radius than these two
  folders alone.
- **Segmentation:** `src/modules/users/customer/segmentation/**` (options,
  utils, ambient types) — both lines, `rule.tsx` sections.
- **Fees/add-ons:** `src/modules/products/add-on/options/fee` — cash-loan's
  installment-plan sections and credit-card's card-info sections.
- **Contract templates:** `src/modules/products/parameter/contract-termplate/utils.tsx`
  (`returnStatusUpdate`) — both lines' edit submit.
- **Product labels:** each line's `components/ProductLabelsField.tsx` wraps a
  line-specific Query hook owned by `configuration/product-labels/<line>/`
  (a separate, larger, still-Redux-and-Query-mixed submodule per
  `product-labels.md`, itself flagged for its own reconciliation pass).
- **Industry product:** `view/history.tsx` (cash-loan) imports
  `convertFieldActionType` from `../../industry-product/ultis.tsx`.
- **Popular loans:** cash-loan's `view/loan-packages.tsx` imports styles from
  `src/modules/products/popular-loans/components/popular-loans.styles`.
- **Credit-card-only, cash-loan-named shared component:** credit-card's
  `shared/card-gift-offer-fields.tsx` imports `CashLoanCatalogModal` from
  `configuration/components/CashLoanCatalogModal/` — **cash-loan itself does
  not import this component**, despite the name. `product-labels.md:153-155`'s
  claim about this component's reuse direction needs re-verification against
  that document's own text (flagged for the `product-labels.md` reconciliation
  run, not fixed here).
- **Group list product / industry product / card-gift-offer:** no direct
  folder-path imports found from either folder into `configuration/card-gift-offer/`
  despite the shared `CARD_GIFT_OFFER_*` OR-permission routes (§9) — the
  coupling, if real, is only at the route-permission layer.

## 11. Consumers

- Both list pages' quick-edit/bulk/import flows are consumed only by their
  own page; no outside file imports either line's query hooks, keys, or
  service.
- `src/modules/system/card-management/list.tsx:164` references
  `PRODUCT_CREATE_CASH_LOAN` — a cross-domain permission consumer, not a code
  consumer.
- History/audit, segmentation, fees, contracts, product-labels, and
  popular-loans are consumed-from, not consumers-of, this document's scope
  (see §10).

## 12. Pattern classification

| Pattern | Classification |
| --- | --- |
| Query-owned paginated list read, feature hook/keys/service | `target-compatible` |
| Redux-owned single-product CRUD via `productListSlice` | `legacy-compatible` |
| Redux→Query explicit invalidation bridge on mutation `fulfilled` | `target-compatible` (explicit migration bridge, per ARCHITECTURE §11) |
| Cash-loan quick-edit: Query mutation + synchronous `setQueriesData` patch, no Redux | `target-compatible` |
| Module-local `services/` folder | `LEGACY-COMPATIBILITY` for location only (migration incremental, `03-api-service.md`) |
| Keys-only query-key factory (no colocated `queryOptions`) | target gap, **SHOULD**, not a violation |
| `loan-packages.tsx` direct `apiFetcher.get` inside a component | deviation from the service-boundary rule; **MODERATE** |
| Ambient ambient-type dependency in `types.ts` (`Status`, `Filter`, `Pagination`) | `legacy-compatible` |
| Hardcoded routes bypassing `PageURLs.ofProductEdit`/`ofProductView` (cash-loan, 9 sites) | deviation from `.claude/rules/06-routing-permission.md`; defect-class, recorded not fixed |

## 13. Technical risks

Ordered by decreasing consequence, per content rule 8.

- **Duplicate thunk bodies.** `confirmImportListProduct` and
  `confirmImportListProductMarketing` (`product-list.slice.ts:700-711`) are
  byte-identical, both POSTing `products/import/:id/confirm`. If the two
  import types ever need different backend handling, this silently breaks
  one of them. (CONFIRMED.)
- **Cross-line hardcoded endpoint.** Credit-card's list page dispatches
  `downloadTemplate`/`downloadListProducts`, whose thunk endpoints are
  hardcoded to `products/cash-loan/template`/`/export`
  (`product-list.slice.ts:715,735`). Whether the backend actually returns
  credit-card data from a cash-loan-path endpoint is **NEEDS-VERIFICATION**;
  if not, credit-card's export/template feature is silently broken or
  silently wrong.
- **Shared loading/shadow state.** `product-list.slice.ts`'s
  `updateActiveState.fulfilled` reducer still writes `state.productList`
  even though neither list page reads that selector any more — a dead write,
  not a dead reducer; harmless today but a trap for a future reader who
  assumes that selector is live.
- **Client-side status override in quick edit.** Cash-loan's quick-edit cache
  patch (`CashLoanProductList.tsx:172`) sets
  `status: hasAudience ? item.status : 'INACTIVE'`, a business rule enforced
  only in the optimistic cache patch, not confirmed against the actual PUT
  response. If the backend disagrees, the cache silently diverges from the
  server until the next list refetch.
- **`PRODUCT_DELETE_*` has no route/menu backing.** Draft deletion is gated
  only by a component-level `hasPermission` check inside `view/index.tsx`,
  both lines. Frontend-only enforcement at a single layer is the known
  "frontend checks do not prove backend authorization" risk this repository
  already tracks elsewhere, but it is worth restating here since nothing
  else in this document's route table backs it.
- **Reference-catalog/list-read divergence risk.** `getProductList`
  (`products/search`) and each line's own Query list read
  (`products/<line>s/search`) are two different endpoints that may or may
  not return the same underlying rows; cash-loan's edit submit path uses the
  Redux copy (`listProduct`) as an input to `normalizeUpdatedProductCashLoan`.
  If the two endpoints diverge, edit submit could use stale or
  differently-filtered data. **NEEDS-VERIFICATION.**
- **Debug leftovers.** `cash-loan/edit/index.tsx:224` and
  `cash-loan/view/installment-plan.tsx:174` contain `console.log` calls with
  Vietnamese debug text. Recorded per content rule 10 as dead/debug code
  affecting nothing functionally, not fixed in this pass.
- **Hardcoded navigation paths.** Nine cash-loan view/edit files bypass
  `PageURLs.ofProductEdit`/`ofProductView` with hardcoded template strings
  (§2). A future `PageURLs` change to these builders would silently miss
  these nine call sites.
- **Credit-card promotion double-write (CONFIRMED, credit-card only).**
  `credit-card/edit/promotion.tsx:77` saves the promotion tab independently
  via `updateProductPromotions` (`PUT products/:id/promotions`), while
  `credit-card/edit/index.tsx:317,346`'s page-level save sends the full
  product — built from `productDetail` plus Redux `updatedProduct`, which
  already includes promotion data written by the same tab's own
  `updateSidebar` calls (`edit/promotion.tsx:123-140`). Which write
  ultimately wins when both fire close together is **NEEDS-VERIFICATION**;
  the promotion-tab payload also hardcodes `hasAddOnOffer: false`,
  `inheritAddOnOffer: false`, `extraDeals: []`, and
  `cashLoanPromotionDetails: []` (`edit/promotion.tsx:85-88`) regardless of
  the actual form state. Cash-loan has no equivalent per-section save for
  promotion; this is a credit-card-specific additional write path, not a
  symmetric pattern between the two lines.
- **Credit-card's gift-loan picker hardcodes the cash-loan product line.**
  `credit-card/shared/card-gift-offer-fields.tsx:312,391` select gift-loan
  products by hardcoding `'cash-loan'` as the catalog's product line, even
  though the picker is only rendered from credit-card's own promotion tab.
  This is consistent with `§10`'s note that credit-card reuses
  `CashLoanCatalogModal`, but confirms the reuse is a deliberate
  cash-loan-only catalog choice, not an oversight limited to the component
  name.
- **Unawaited draft delete and unchecked status-toggle result (credit-card;
  cash-loan's equivalents were not independently re-verified in this
  addendum).** `credit-card/view/index.tsx:199-205` dispatches
  `deleteProductDraft` without awaiting it before closing the modal, and
  `view/index.tsx:142-154`'s status toggle does not check whether
  `updateProductStatus` fulfilled or rejected before refetching the summary;
  both rely entirely on listener middleware for user-visible failure
  feedback.

## 14. Areas to avoid touching

- Do not change `product-list.slice.ts`'s thunk signatures, action types, or
  endpoint strings without auditing all 41 repo-wide import sites listed in
  §10/§5 — this slice is shared well beyond cash-loan/credit-card.
- Do not assume the Redux→Query invalidation bridge can be removed or
  replaced by a Redux-side cache write; it is the only mechanism keeping the
  Query-owned list in sync with Redux-owned bulk/import mutations.
- Do not "fix" the `confirmImportListProduct`/`confirmImportListProductMarketing`
  duplication by deleting one, without first confirming with backend/BA
  whether the two import types are in fact meant to behave identically.
- Do not migrate `loan-packages.tsx`'s direct `apiFetcher.get` call into the
  service layer as an incidental cleanup inside an unrelated task; it is a
  real, if non-conforming, existing boundary.

## 15. Open questions

- Whether `getProductList`'s `products/search` and the per-line Query list
  endpoints return consistent data (§13, §5).
- Whether the backend's cash-loan-path template/export endpoints correctly
  serve credit-card data, or whether credit-card's export/template feature is
  silently non-functional.
- Whether `PUT products/:id/product-draft` and the quick-update endpoint are
  both authoritative status writers and how they reconcile if both are hit
  for the same product in close succession.
- Whether `request-application/:id/audit` is intentional shared
  infrastructure for product history, or a naming artifact worth asking
  about.
- Which page each of the `CARD_GIFT_OFFER_*`-OR-combined routes
  (`form.routes.tsx:175,185,195`; `main.routes.tsx:155`) actually renders —
  not independently confirmed in this pass.
- `PRODUCT_DELETE_CREDIT_CARD`'s enforcement pattern was assumed symmetric
  with cash-loan's component-only check, not independently re-verified.
- `product-labels.md:153-155`'s claim about `CashLoanCatalogModal` reuse
  direction appears backwards (credit-card imports it; cash-loan does not) —
  flagged for correction when `product-labels.md` is next reconciled, not
  fixed here.
- Whether the three independent filter-normalization implementations
  (searcher, query-keys, service) for the same filter shape are intentional
  or drift — not unified or investigated further in this pass.
- Which of credit-card's two promotion write paths (the tab's own
  `updateProductPromotions` vs. the page-level full-product save) is
  authoritative when both fire for the same edit session (§13).
