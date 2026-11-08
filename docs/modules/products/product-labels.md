# Product Labels — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

This document replaces the prior `product-labels.md`, which described a
`src/redux/slices/product-labels.slice.ts` + `src/redux/middlewares/product-labels.middleware.ts`
architecture. Neither file exists in current source
(`ls src/redux/slices | grep -i label` and `ls src/redux/middlewares | grep -i label`
both empty; confirmed independently across all three reconciliation passes
below). This rewrite was produced by three parallel read-only
`codebase-analyzer` passes — cash-loan (`cash-loan/`, 17 files), credit-card
(`credit-card/`, 17 files including `manual-card-flow.ts`), and shared/root
(`shared/` 38 files + 7 root files) — cross-checked against each other and
against `docs/modules/products/product-configuration/cash-loan-credit-card.md`
(the sibling document for the *product* CRUD folders of the same two lines,
not this one).

**Split decision.** Kept as **one combined document**, not split by line or by
`shared/`, despite the 78-file size (`find src/modules/products/configuration/product-labels -type f | wc -l`
= 78: 7 direct + cash-loan 17 + credit-card 16 + shared 38). Justification,
using the same coupling-check method as `cash-loan-credit-card.md`:

- Unlike the product-CRUD lines (which share one Redux slice), cash-loan and
  credit-card labels have **no shared state owner at all** — each line owns
  its own independent TanStack Query hook/key-factory/service trio
  (`cash-loan/hooks/cashLoanLabelQueries.ts` /
  `credit-card/hooks/creditCardLabelQueries.ts`, etc.). That would argue for a
  split.
- But both lines are structurally identical consumers of the same `shared/`
  layer (38 files — just under half the module): the same route gate
  (`ProductLabelsRouteGate.tsx`), the same tab/list orchestration
  (`shared/ProductLabelTab.tsx`, `shared/ProductLabelListPanel.tsx`), the same
  form shell (`shared/ProductLabelFormShell.tsx`), the same draft/selection/
  pagination helpers (`shared/useAssignedProductDraft.ts` and siblings), the
  same generic unassigned-tab component (`shared/UnassignedProductTab.tsx`,
  driven by a per-line adapter object), and the same mobile-preview
  coordination pattern in root `index.tsx`. Splitting by line would force
  `shared/`'s 38 files to be documented twice or pulled into a third document;
  neither improves clarity, because every one of `shared/`'s non-trivial files
  has both lines as consumers.
- Documenting this once, with a per-line table for the parts that do differ
  (query keys, services, repositories, criteria/rule-engine business rules,
  forms), matches how `cash-loan-credit-card.md` itself handles its two lines
  inside one document.

**Verification-gap limit (top 5; remainder in §15):**

1. Whether the TanStack Query cache survives logout is **NEEDS-VERIFICATION**:
   no `queryClient.clear()`/`removeQueries()`/`resetQueries()` call exists
   anywhere in `src/` (repo-wide grep), and `auth.slice.ts:75-76,91-92` clears
   only `localStorage`/`sessionStorage`, not the Query cache. The old doc's
   "logout resets the Product Labels slice" claim has no replacement
   mechanism to verify against.
2. Neither line's query-key factory uses the `queryOptions`-colocated shape
   `.claude/rules/03-api-service.md` names as the expected pattern for a
   Query-owned feature being updated (`cash-loan/queryKeys/cash-loan-label.query-keys.ts`
   and `credit-card/queryKeys/credit-card-label.query-keys.ts` are both
   keys-only, hook-assembled `useQuery`). Neither folder is in that rule's
   named exemption list (scheme-sync, splash-screen, customer-segment). This
   is a target-shape gap, not a stated violation, and is left `uncertain`
   pending a team decision on whether labels should be added to the
   exemption list or migrated to the target shape.
3. Whether the backend enforces the frontend's "deactivating a label with
   assigned products hides the mobile tab" rule, and the actual timezone
   handling of `effectiveFrom`/`effectiveTo`, were not re-verified in this
   pass (carried forward from the prior document, unresolved).
4. `shared/UnassignedProductTab.tsx` builds two ad-hoc query keys outside
   either line's factory (an `'all'` suffix and an `'assignable-labels'`
   suffix — see §6) — whether this is an intentional escape hatch or drift
   from the factory pattern is **NEEDS-VERIFICATION**.
5. Automatic-assignment rollout status (`PRODUCT_LABEL_AUTO_TAB_ENABLED = false`,
   `src/modules/products/configuration/product-labels/constants.ts:2`) is
   unchanged from the prior document and still not independently confirmed
   against a BA/backend source.

## 1. Responsibility

Manages ordered labels and their assigned products, separately for cash loans
(`cash-loan`, line code `CL`) and credit cards (`credit-card`, line code
`CD`), at canonical routes parameterized by `:line`. Covers label list/search/
status-filter, create/view/edit, activation, reorder, manual/automatic
assignment, unlabeled-product views, criteria preview/apply, history, and a
combined mobile preview across both lines. Automatic-assignment UI is gated
off by `PRODUCT_LABEL_AUTO_TAB_ENABLED = false`
(`product-labels/constants.ts:2`).

## 2. Entry points and routes

Unlike most product routes, these use `AuthGuard` + a custom
`ProductLabelsRouteGate.tsx`, **not** `WithGuard`
(`product-labels/ProductLabelsRouteGate.tsx` imports `useAppSelector` and
`watchProfileLoading`/`watchUserPermissions` from `auth.slice`, not
`WithGuard`).

| Action | Path | Route file:line |
| --- | --- | --- |
| List (`:line` param) | `/product/configuration/product-label/:line` | `src/routes/main.routes.tsx:476-484` |
| List (base, `?tab=`) | `/product/configuration/product-label` | `src/routes/form.routes.tsx:290-298` |
| Legacy create/view/edit | `/product/configuration/product-label/{create,view/:id,edit/:id}` | `src/routes/form.routes.tsx:300-326`, `action='legacy'` |
| Create (`:line`) | `.../:line/create` | `src/routes/form.routes.tsx:330-337` |
| View (`:line`) | `.../:line/view/:id` | `src/routes/form.routes.tsx:340-347` |
| Edit (`:line`) | `.../:line/edit/:id` | `src/routes/form.routes.tsx:350-357` |

Lazy export: `src/routes/pages.tsx:247-253` (`ProductLabelsRouteGate`).

`ProductLabelsRouteGate.tsx:40-47` navigates a legacy action to `legacyTarget()`
or an invalid-link result; `:49-50` rejects an invalid `:line`; `:59-65`
computes `hasAccess` via `canAccessProductLabel` (OR/`.some` semantics,
`routes.ts:39-46`) and redirects to `PageURLs.of404()` on failure; `:67`
renders `index.tsx` (`ProductLabelsPage`) with `action` and `line`.

`index.tsx:85-98` honors `?tab=` only when the user holds that line's list
permission, defaulting cash-loan before credit-card; tab change navigates via
`PageURLs.ofProductLabels(tab)` (`src/utils/navigate.ts:105-117`, which also
defines `ofProductLabelCreate`/`ofProductLabelView`/`ofProductLabelEdit`).
`Tabs` renders only when there is no `:line` param (`index.tsx:315-321`,
`destroyInactiveTabPane`); for a single-line route the tab's children render
directly (`:61-62`).

## 3. Directory map

### Root (7 files)

| File | Responsibility |
| --- | --- |
| `routes.ts` | Permission matrix (`linePermissions`), `canAccessProductLabel`, `legacyTarget` |
| `ProductLabelsRouteGate.tsx` | Custom `AuthGuard`-based gate (§2) |
| `index.tsx` | Tab orchestration, mobile-preview coordination (via Query hooks, not repositories — §4) |
| `constants.ts` | `PRODUCT_LABEL_AUTO_TAB_ENABLED`, `PRODUCT_LABEL_NAME_MAX_LENGTH = 50`, `LOAN_MESSAGES`, `CARD_MESSAGES` |
| `types.ts` | `ProductLabelTab`, `ProductLabelStatus`, `LabelSource`, `DerivedDisplayStatus`, `BaseProductLabel` |
| `ux.ts` | Mobile-preview copy/metrics, selection helpers, `filterLabelRows`, `reorderRows` |
| `product-labels.styles.ts` | 1002 lines, 31 exported Emotion `css` objects; `legacy-compatible` |

### `cash-loan/` (17 files)

| File | Responsibility |
| --- | --- |
| `CashLoanTab.tsx` | Thin adapter; renders shared `ProductLabelTab` with `renderForm`/`renderUnassigned` props |
| `components/CashLoanForm.tsx` | Form orchestrator (AntD `Form.useForm`); wires all cash-loan Query hooks |
| `components/AssignedProductsTable.tsx` | Presentational assigned-products table, props-driven |
| `components/ConditionBuilder.tsx` | Presentational loan-condition editor; calls `validateLoanConditions` for display |
| `components/PreviewResultsModal.tsx` | Presentational preview-results modal |
| `components/UnassignedProductsTab.tsx` | Builds an `UnassignedProductAdapter`; renders shared `UnassignedProductTab` |
| `components/CashLoanHistorySection.tsx` | Owns page/pageSize state; calls `useCashLoanLabelHistoryQuery` |
| `criteria-mapper.ts` | `serializeLoanCriteria` — loan condition → API criteria |
| `rule-engine.ts` | `validateLoanConditions`, `evaluateLoanProduct` (dead, no consumer) |
| `hooks/cashLoanLabelQueries.ts` | 8 queries + 8 mutations (§5/§6) |
| `queryKeys/cash-loan-label.query-keys.ts` | Keys-only factory |
| `services/cash-loan-label.service.ts` | Calls `api`/`domain` repositories |
| `api-label-repository.ts` | `ApiProductLabelRepository('cash-loan', ...)` transport instance |
| `label-repository.ts` | Interface only, no runtime code |
| `product-label-repository.ts` | Domain implementation (`productLoanLabelRepository`) |
| `product-catalog-api.ts` | Direct `window.apiFetcher.get('products/catalog')` for the catalog modal |
| `types.ts` | Line DTOs; `LoanRuleCondition.value: any` |

### `credit-card/` (16 files)

| File | Responsibility |
| --- | --- |
| `CreditCardTab.tsx` | Thin adapter, same shape as `CashLoanTab.tsx` |
| `components/CreditCardForm.tsx` | Form orchestrator (741 lines) |
| `components/CardMembershipSection.tsx` | Presentational membership table/tabs |
| `components/CardRuleConfigCard.tsx` | Props-driven rule-config editor |
| `components/CreditCardHistorySection.tsx` | Page/pageSize state + `useCreditCardLabelHistoryQuery` |
| `components/UnassignedCardsTab.tsx` | Adapter + shared `UnassignedProductTab` |
| `manual-card-flow.ts` | `openManualCardCatalog` — **dead, zero importers**; cash-loan has no equivalent file |
| `criteria-mapper.ts` | `serializeCardCriteria` — rule config → API criteria |
| `rule-engine.ts` | `validateCardRuleConfig`, `evaluateCardProduct` |
| `hooks/creditCardLabelQueries.ts` | 8 queries + 8 mutations (§5/§6) |
| `queryKeys/credit-card-label.query-keys.ts` | Keys-only factory |
| `services/credit-card-label.service.ts` | Calls `api`/`domain` repositories |
| `api-label-repository.ts` | `ApiProductLabelRepository('credit-card', ...)` transport instance |
| `label-repository.ts` | Interface only |
| `product-label-repository.ts` | Domain implementation (`productCardLabelRepository`) |
| `types.ts` | Line DTOs |

### `shared/` (38 files)

| File | Responsibility |
| --- | --- |
| `api-repository.ts` | `ApiProductLabelRepository` class, runtime guards (`assertLabelSummary*`, `assertLabelDetail`, `assertPageInfo`, `assertProduct*`), `window.apiFetcher` calls |
| `api-types.ts` | Type declarations only, no runtime guards |
| `api-mappers.ts` | `mapLabelSummary`, `mapLabelDetail`, `mapCashLoanProduct`, `mapCreditCardProduct` |
| `api-errors.ts` | `normalizeProductLabelError`, `isDuplicateProductLabelNameError`, `withProductLabelApiError` |
| `list-query.ts` | Request-parameter builders (`buildProductLabelListQuery`, `buildUnlabeledProductQuery`) — not a query function |
| `load-initial-detail.ts` | `loadInitialProductLabelDetail` — **dead, zero importers**; forms use the separate detail + first-page hooks instead |
| `ProductLabelListPanel.tsx` | List page: both lines' list/reorder Query hooks, local reorder draft |
| `ProductLabelTab.tsx` | Action switch between list and form |
| `LabelFilterToolbar.tsx` | Presentational filter toolbar |
| `SortableLabelTable.tsx` | Generic dnd reorder table |
| `assigned-product-draft.ts` | Pure controller factory, no React/store imports |
| `useAssignedProductDraft.ts` | React hook; resets on `scopeKey` change |
| `assigned-product-pagination.ts` | Pure helpers, **zero importers** |
| `assigned-product-selection.ts` | Pure merge helpers; consumed by both lines' tables and `CashLoanCatalogModal` |
| `assigned-product-status-cache.ts` | Manual cache factory, **zero importers, dead** |
| `last-active-product-warning.ts` | Pure warning-condition helpers |
| `ProductLabelFormShell.tsx` | AntD `<Form>` shell wrapper |
| `LabelFormAttributes.tsx` | Shared form fields (name/status/dates) |
| `useProductLabelFormFooter.tsx` | Layout header/footer swap for the form screen |
| `ProductLabelProductCatalogModal.tsx` | Wraps `CashLoanCatalogModal` for both lines (§10) |
| `SelectProductModal.tsx` | 836 lines, **zero importers — orphan duplicate**; the live component is `src/components/select-product-modal/` |
| `MobilePreviewDrawer.tsx` | Thin wrapper over `MobilePreviewFrame` |
| `MobilePreviewFrame.tsx` | Mobile preview shell; fragile Vietnamese-string variant matching |
| `CreditCardMobilePreview.tsx` | Presentational credit-card preview |
| `mobile-preview-model.ts` | `filterActiveMobilePreviewProducts` — **dead**, logic duplicated inline in the Query hooks instead |
| `status-switch-mapping.ts`, `StatusBadge.tsx`, `label-filter-options.ts`, `product-label-list-model.ts`, `product-label-action-model.ts`, `product-label-route-model.ts`, `label-assignment-option-model.ts`, `unassigned-product-model.ts`, `ProductLabelActionButton.tsx`, `ProductLabelHistorySection.tsx`, `useDebouncedValue.ts` | Small, single-purpose presentational/model helpers (badges, filter options, row models, debounce) |
| `UnassignedProductTab.tsx` | Generic adapter-driven unassigned-product tab; **calls `useQuery`/`useMutation` directly** with two ad-hoc keys outside the line factories (§6) |

## 4. Main runtime flows

### List (Query-owned, per line)

```text
ProductLabelListPanel.tsx
  -> useCashLoanLabelListQuery / useCreditCardLabelListQuery
  -> <line>LabelQueryKeys.list(params, allPages)  (placeholderData: keepPreviousData)
  -> <line>-label.service.ts -> api-label-repository.ts -> shared/api-repository.ts
  -> window.apiFetcher.get(api/admin/portal/v1/<line>/product-labels, ...)
```

### Create / edit

```text
<Line>Form.tsx
  -> useCreate<Line>LabelMutation / useUpdate<Line>LabelMutation
  -> service -> domain repository (createLabel/updateLabel) -> api repository -> ApiFetcher
  -> onSuccess: invalidate<Line>Labels(queryClient) -> invalidateQueries({ queryKey: <line>LabelQueryKeys.all })
  -> caller's onCreated/onUpdated (notification dispatched inline in the component, not listener middleware)
```

Status has no dedicated mutation in either line; it is written only as a
field in the update payload (`CL/product-label-repository.ts` `updateLabel`;
`CD` same shape). `useChange<Line>LabelStatusMutation` exists in both hook
files but has **zero callers** in both lines.

### Reorder

```text
ProductLabelListPanel.tsx (local reorder draft)
  -> useReorder<Line>LabelsMutation.mutateAsync(...)
  -> invalidate<Line>Labels -> refetch cash/credit "allPages" snapshot query
```

### Criteria preview / apply

```text
<Line>Form.tsx
  -> usePreview<Line>RuleMutation / useApply<Line>RuleMutation
  -> serializeLoanCriteria / serializeCardCriteria -> api.previewCriteria / domain.applyRule
  -> apply only: invalidate<Line>Labels; preview: no invalidation (read-only preview)
```

### Manual/automatic assignment (unlabeled products)

```text
UnassignedProductsTab.tsx / UnassignedCardsTab.tsx
  -> builds an UnassignedProductAdapter (getPage/getUnassignedProducts, listAssignableLabels, assignToLabel)
  -> shared/UnassignedProductTab.tsx
       -> useQuery(<line>LabelQueryKeys.unassignedProducts)
       -> useQuery([...rootQueryKey, 'assignable-labels'])   [ad-hoc key, not in either factory]
       -> useMutation(adapter.assignToLabel) -> onSuccess: invalidateQueries({ queryKey: rootQueryKey })
```

### Mobile preview (both lines, root `index.tsx`)

```text
index.tsx
  -> useCashLoanMobilePreviewQuery(false) / useCreditCardMobilePreviewQuery(false)   [enabled: false]
  -> handleOpenMobileSimulation(): .refetch() each query, filter products.length > 0
  -> inside each hook (staleTime: 0, explicit):
       getAllLabels -> filter displayStatus === 'ACTIVE' -> sort by displayOrder
       -> getAllAssignedProducts per label -> filter product status ACTIVE
  -> MobilePreviewDrawer -> MobilePreviewFrame / CreditCardMobilePreview
```

This corrects the prior document's claim that `index.tsx` "directly
coordinates repositories" for mobile preview: it calls Query hooks, and the
aggregation (sequential per-label fetch, ACTIVE filtering, sort) lives inside
each line's hook file, not in `index.tsx` itself.

## 5. State ownership

**Central verdict (CONFIRMED by all three independent passes, not a guess):**
`product-labels.slice.ts` and its middleware do not exist anywhere in current
source. Server state for both lines — list, detail, history, assigned
products, unassigned products, available-product count, mobile preview, and
product pool — is owned **entirely by TanStack Query**, through each line's
own `hooks/<line>LabelQueries.ts` + `queryKeys/<line>-label.query-keys.ts` +
`services/<line>-label.service.ts` trio. There is **no Redux↔Query bridge**
for labels (unlike the sibling cash-loan/credit-card *product* CRUD folders,
which do have such a bridge for bulk/import — see
`product-configuration/cash-loan-credit-card.md` §5). This was confirmed by:

- Repo-wide grep for `product-labels.slice`, `product-labels.middleware`,
  `fetchProductLabelPage`, `createProductLabel`, `updateProductLabel`, and
  `loadInitialProductLabelDetail` — no slice or thunk found. The only
  `src/redux` hits for the string `product-label` are unrelated key-mapping
  entries in `banner.slice.ts:157` and `popup.slice.ts:141`.
- Zero `useAppSelector`/`useSelector` calls anywhere in `shared/` (38 files
  grepped). The only Redux reads in the whole module are: `index.tsx:42`
  (`watchUserPermissions`), `ProductLabelsRouteGate.tsx:37-38` (auth state),
  and `CashLoanForm.tsx:101-102` (`watchDocumentSets`/
  `watchLoadingDocumentSets` from `common.slice` — global reference data, not
  a product-label cache). `CreditCardForm.tsx` and `CashLoanForm.tsx` both
  also call `useAppDispatch` only for `setNotification` (UI notification
  state), not for label data.

| Concern | Owner | Evidence |
| --- | --- | --- |
| List (both lines) | TanStack Query, feature-owned hook/keys/service | `<line>/hooks/<line>LabelQueries.ts:25` |
| Detail | TanStack Query | `:41` |
| History | TanStack Query | `:49` |
| Assigned products | TanStack Query | `:63` |
| Unassigned products | TanStack Query (hook unused by cash-loan/credit-card forms; `shared/UnassignedProductTab.tsx` queries the same key directly, bypassing the hook) | `:77`; `shared/UnassignedProductTab.tsx:366` |
| Available-product count | TanStack Query | `:90` |
| Mobile preview | TanStack Query, `staleTime: 0` explicit | `:98-136` |
| Product pool | TanStack Query (hook has zero consumers on both lines; `CreditCardForm.tsx` and `CashLoanForm.tsx` call `queryClient.fetchQuery` with the same key directly instead) | `:138`; `CreditCardForm.tsx:219-222`; `CashLoanForm.tsx` draft loader |
| Create / update / preview / apply / reorder / status-field / assign / remove | TanStack Query mutations, invalidating the line's `all` prefix | `hooks/<line>LabelQueries.ts:146-243` |
| Editable assigned-product draft (per form session) | Local feature state, not Redux, not Query cache | `shared/useAssignedProductDraft.ts` (resets on `scopeKey` change) |
| Reference document-set catalog (cash-loan form only) | Redux `common.slice.ts` (`watchDocumentSets`) | `CashLoanForm.tsx:9-11,101-102` |
| Notification UI | Redux (`setNotification`), dispatched inline per component, not listener middleware | both forms |
| Logout cache reset | **No mechanism found** — `auth.slice.ts:75-92` clears only `localStorage`/`sessionStorage`; no `queryClient.clear`/`removeQueries` anywhere in `src/` | NEEDS-VERIFICATION, §0 |

A local editable draft is allowed under `.claude/rules/04-state-management.md`
only when init/reset/commit/invalidation are explicit; `useAssignedProductDraft.ts`
meets this (explicit `scopeKey`-driven reset), but both forms' re-seeding
`useEffect` (triggered by detail/assigned-products query refetch after a
mutation invalidates the same keys) can silently discard unsaved draft edits
— flagged as a risk in §13, not confirmed by runtime testing.

## 6. API boundaries

### Query-owned checklist (TEMPLATE.md content rule 15), per line

| | Cash loan | Credit card |
| --- | --- | --- |
| Redux shadow on list/detail itself | None found | None found |
| Key factory shape | Keys-only (`all`, `lists()`, `details()`, `histories()`, `historyById()`, plus fetching keys `list`, `detail`, `history`, `assignedProducts`, `unassignedProducts`, `availableProductCount`, `mobilePreview`, `productPool`); imports only types from `shared/api-repository`/`shared/api-types`, not `services/` | Same shape; same key set under `['product-labels','credit-card']` |
| Query hooks / consumers | List: 3 files (`ProductLabelListPanel.tsx`, `cash-loan/components/ProductLabelsField.tsx`, `display-information-set/components/DisplayInformationProductLabelsField.tsx`); detail/assigned: `CashLoanForm.tsx`; history: `CashLoanHistorySection.tsx`; unassigned/product-pool: **0 consumers (dead hooks)** | List: 3 files (`ProductLabelListPanel.tsx`, `credit-card/components/ProductLabelsField.tsx`, `DisplayInformationProductLabelsField.tsx`); detail/assigned/count: `CreditCardForm.tsx`; history: `CreditCardHistorySection.tsx`; unassigned/product-pool hooks: **0 consumers** |
| `staleTime` | Default (0) on every query except `mobilePreview` (explicit `0`) | Identical shape |
| `placeholderData: keepPreviousData` | Present on list, history, assigned-products; absent (correctly) on detail/count/mobilePreview/productPool | Identical shape |
| Mutation invalidation | Every mutation's `onSuccess` calls `invalidate<Line>Labels` → `invalidateQueries({ queryKey: <line>LabelQueryKeys.all })` — a full-prefix invalidation covering list/detail/history/assigned/unassigned/count/mobilePreview/productPool. Awaited (mutation promise resolves after invalidation; confirmed against `@tanstack/query-core`'s `mutation.js:181` awaiting `onSuccess`). `usePreview*RuleMutation` has no invalidation (correct — read-only preview). | Identical shape; prefix `['product-labels','credit-card']`. |
| `setQueryData` | None anywhere in the module | None |

Both key factories are keys-only, hook-assembled `useQuery` — not the
`queryOptions`-colocated shape `.claude/rules/03-api-service.md` names as
expected for a Query-owned feature being updated, and neither folder is in
that rule's exemption list. This is the target-shape gap recorded in §0.

**`shared/UnassignedProductTab.tsx` deviates from both factories.** It issues
its own `useQuery`/`useMutation` calls directly (not through either line's
hook file) using:
- the line's `unassignedProducts` key (within the factory), and
- an ad-hoc `[...rootQueryKey, 'assignable-labels']` key (**not** in either
  factory) for the assignable-labels list.
- `placeholderData: (previous) => previous` instead of the standard
  `keepPreviousData` import.
Its mutation invalidates `rootQueryKey` (the line's `all` prefix), consistent
with the rest of the module. `CashLoanForm.tsx`'s own assigned-products
`fetchQuery` call also appends an ad-hoc `'all'` suffix not present in the
factory.

### Non-Query endpoints

| Operation | Method/endpoint | Reached via |
| --- | --- | --- |
| List | `GET api/admin/portal/v1/<line>/product-labels` | `shared/api-repository.ts` `ApiProductLabelRepository.getAllLabelPages` |
| Detail | `GET .../product-labels/:id` | `ApiProductLabelRepository.getLabel`, `assertLabelDetail` |
| Create | `POST .../product-labels` | per-line `product-label-repository.ts` `createLabel` |
| Update | `PUT .../product-labels/:id` | `updateLabel` |
| Status | `PATCH .../product-labels/:id/status` | **no caller on either line** — status travels in the update payload instead; see §5 |
| Reorder | `PUT .../product-labels/reorder` | `ProductLabelListPanel.tsx` reorder mutation |
| Criteria preview | `PUT .../:id/criteria/preview` | `usePreview*RuleMutation` |
| History | `GET .../:id/history` (shape) | `assertLabelHistoryPage` |
| Unlabeled/labeled products | `GET .../unlabeled`, `GET .../labeled/:id` | per-line service, `getAllLabeledProducts`/`getUnassignedProducts` |
| Cash-loan catalog reference data | `GET api/admin/portal/v1/products/catalog` | `cash-loan/product-catalog-api.ts:150`, direct `window.apiFetcher.get`, bypassing the per-line service |

`shared/api-repository.ts`'s private generic `get<T>` (~420-433) still casts
`response as T` after a null check; the module's specific public methods
(`assertLabelSummaryPage`, `assertLabelDetail`, `assertPageInfo`,
`assertProduct`/`assertProducts`, `assertLabelHistoryPage`) perform the
substantive runtime guards. This is the same pattern the prior document
described and remains accurate; only the consumer above it (now Query hooks
instead of Redux thunks) has changed.

## 7. Forms and validation

Both lines use AntD `Form`/`FormInstance` exclusively (`Form.useForm()` at
`CashLoanForm.tsx:81`, `CreditCardForm.tsx:69`). No React Hook Form, no Zod
anywhere in `product-labels/` (confirmed by grep across all 78 files).
`shared/ProductLabelFormShell.tsx` renders the AntD `<Form>` element itself;
`shared/LabelFormAttributes.tsx` supplies the shared name/status/date fields.

- Cash-loan: `validateLoanConditions` (`cash-loan/rule-engine.ts`) checks
  empty/duplicate/invalid-numeric/incompatible-operator/empty-range
  conditions; `serializeLoanCriteria` (`criteria-mapper.ts`) serializes by
  criterion type and **silently keeps only the first `STARTS_WITH` value**
  when multiple are given alongside `PRODUCT_CODE` (`criteria-mapper.ts:34`)
  — a real, if narrow, defect, not previously documented.
- Credit-card: `validateCardRuleConfig` (`credit-card/rule-engine.ts`)
  requires at least one limit or document set, validates FIXED (`> 0`) and
  RANGE (`min <= max`, both `> 0`) bounds, with some message strings inline
  Vietnamese rather than via `CARD_MESSAGES`; `serializeCardCriteria`
  (`criteria-mapper.ts`) throws on mixed FIXED/RANGE or more than one RANGE,
  and resolves `docSetId` to a document-set id by `code` or `String(id)`,
  throwing if unmatched.
- Both forms use `any` at their submit boundary (`CashLoanForm.tsx` `doSave`;
  `CreditCardForm.tsx` `onFinish(values: any)`, `doSave(payload: any)`).
- Duplicate-name API errors map to an AntD field error via
  `form.setFields` in both forms.

## 8. Types and DTO organization

Each line's `types.ts` is feature-owned. `cash-loan/types.ts` includes
`LoanRuleCondition.value: any` and an unused `LoanLabelDetailDTO`.
`shared/api-types.ts` holds shared API-shape declarations with no runtime
guards (guards live in `shared/api-repository.ts`, see §6). Root `types.ts`
holds the cross-line `ProductLabelTab`/`ProductLabelStatus`/`LabelSource`/
`DerivedDisplayStatus`/`BaseProductLabel` types.

**Repository layering per line (not duplication — a real interface/
implementation/transport split):**
- `<line>/label-repository.ts` (or `api-label-repository.ts`'s sibling
  interface file) — interface only, no runtime code.
- `<line>/product-label-repository.ts` — the domain implementation
  (`productLoanLabelRepository` / `productCardLabelRepository`): business
  rules (name trimming, `productLineCode` forcing, EXTERNAL-label rejection
  on update, product-assignment merging, rule preview/apply).
- `<line>/api-label-repository.ts` — the transport adapter instantiating
  `shared/api-repository.ts`'s `ApiProductLabelRepository` class.

Each line's service (`services/<line>-label.service.ts`) calls through both
the `api` and `domain` repositories to reach `ApiFetcher`; several pass-
through domain methods are bypassed entirely in favor of a direct `api.*`
call from the service (e.g. `getLabeledProducts`, `getAllLabeledProducts` on
both lines) — recorded as dead/duplicated code in §13, not fixed.

## 9. Permissions

`routes.ts:6-22` is the feature permission matrix (`linePermissions`), naming
follows `PRODUCT_LABEL_{VIEW|CREATE|EDIT}_{CASH_LOAN|CREDIT_CARD}`
(`src/constants/permission.constant.ts:41-47`, e.g.
`product_label:view:cash_loan`):

| Permission | Enforced at route | Enforced at menu | Enforced at component |
| --- | --- | --- | --- |
| `PRODUCT_LABEL_VIEW_CASH_LOAN` | list, view (route gate) | list menu entry (not re-verified this pass, NEEDS-VERIFICATION) | tab visibility (`index.tsx:254-257`) |
| `PRODUCT_LABEL_CREATE_CASH_LOAN` | create | — | create action |
| `PRODUCT_LABEL_EDIT_CASH_LOAN` | edit | — | edit action |
| `PRODUCT_LABEL_VIEW_CREDIT_CARD` | list, view | list menu entry (NEEDS-VERIFICATION) | tab visibility |
| `PRODUCT_LABEL_CREATE_CREDIT_CARD` | create | — | create action |
| `PRODUCT_LABEL_EDIT_CREDIT_CARD` | edit | — | edit action |

There is no separate list permission; list and view share the `VIEW_<LINE>`
permission. `canAccessProductLabel` (`routes.ts:39-46`) is a single-permission
OR/`.some` check per content rule 14 — not a dynamic resolver, not an
`every`-mode check. Route, menu, and component permission behavior must be
changed together; frontend checks do not prove backend authorization.

## 10. Shared and cross-domain dependencies

- **`CashLoanCatalogModal` reuse direction (resolved — the prior document's
  claim at its old §8 is CONFIRMED TRUE, not backwards):**
  `cash-loan/product-catalog-api.ts:150` exposes `GET products/catalog`
  reference data; `src/modules/products/configuration/components/CashLoanCatalogModal/index.tsx:44-50`,
  `styles.ts:2`, and `types.ts:2` import types and the fetch function
  **from** `cash-loan/product-catalog-api.ts` — i.e. the modal *is* "reused by"
  consuming cash-loan's label catalog, exactly as the prior document stated.
  Separately (a different reuse relationship, not the one the old doc's §8
  text was about): the modal component itself is rendered from
  `shared/ProductLabelProductCatalogModal.tsx:2,26`, consumed by **both**
  lines' forms (`CashLoanForm.tsx:53,712`; `CreditCardForm.tsx:10`), and
  separately imported by credit-card's *product CRUD* folder
  (`configuration/credit-card/shared/card-gift-offer-fields.tsx:15,491` — a
  different folder from this document's scope; see
  `product-configuration/cash-loan-credit-card.md` §10/§15 for that document's
  own, unrelated "backwards" flag about its own CRUD reuse direction). Neither
  cash-loan product CRUD nor cash-loan labels import the modal component
  itself — only its `styles` module (`getInterestRateUnit`, imported by
  `AssignedProductsTable.tsx`, `PreviewResultsModal.tsx`,
  `UnassignedProductsTab.tsx`, `product-catalog-api.ts`).
- **Cross-module Query consumers of the label list hook:** both lines'
  `useCashLoanLabelListQuery`/`useCreditCardLabelListQuery` are also consumed
  outside this module, by `configuration/cash-loan/components/ProductLabelsField.tsx`,
  `configuration/credit-card/components/ProductLabelsField.tsx`, and
  `configuration/display-information-set/components/DisplayInformationProductLabelsField.tsx`.
  Any label mutation's full-prefix invalidation therefore also refreshes
  these three external consumers — a wider blast radius than this folder
  alone for any change to invalidation behavior.
- **Reference data:** `cash-loan/components/CashLoanForm.tsx` reads document
  sets from Redux `common.slice.ts` (`watchDocumentSets`), not from a
  product-labels-owned cache.
- **`src/components/select-product-modal/`:** the live, used component;
  `shared/SelectProductModal.tsx` (836 lines) is an unrelated orphan copy
  inside this module with zero importers (§13).
- Listener middleware is **not** involved anywhere in this module; every
  success/error notification is dispatched inline from the component that
  triggered the mutation (`CashLoanForm.tsx`, `CreditCardForm.tsx`,
  `ProductLabelListPanel.tsx`).
- Layout effects: `shared/useProductLabelFormFooter.tsx` and `index.tsx:136-168`
  replace the main header/footer while mounted and restore them on cleanup.

## 11. Consumers

- `configuration/cash-loan/components/ProductLabelsField.tsx`,
  `configuration/credit-card/components/ProductLabelsField.tsx`, and
  `configuration/display-information-set/components/DisplayInformationProductLabelsField.tsx`
  all consume this module's list Query hooks directly (§10) — a real,
  external consumer set the prior document did not name.
- `configuration/components/CashLoanCatalogModal/` consumes
  `cash-loan/product-catalog-api.ts` and `shared/assigned-product-selection.ts`
  (reverse dependency: a `components/` file importing business-module
  internals) and is in turn consumed by this module's
  `shared/ProductLabelProductCatalogModal.tsx`.
- No outside file imports either line's query keys, services, or repositories
  directly (only the list hook and the catalog-modal's narrow imports above).

## 12. Pattern classification

| Pattern | Classification |
| --- | --- |
| Per-line Query-owned list/detail/history/assignment hooks, keys, services | `target-compatible` |
| Keys-only query-key factory (no colocated `queryOptions`) on both lines | target gap, **SHOULD**, not a violation |
| Full-prefix (`all`) invalidation on every mutation, both lines | `target-compatible`, but broad — a narrower per-entity invalidation would reduce refetch scope; not required |
| `shared/UnassignedProductTab.tsx` issuing `useQuery`/`useMutation` directly with an ad-hoc key outside the factory | deviation from the hook/key-factory pattern; recorded, not fixed |
| Interface/implementation/transport three-file repository split per line | `target-compatible` layering, not duplication |
| AntD `Form`/`FormInstance`, no RHF, no Zod | `target-compatible` per `.claude/rules/05-form.md` |
| Custom `AuthGuard` + `ProductLabelsRouteGate` instead of `WithGuard` | `legacy-compatible`, pre-existing and intentional per the route's multi-line/legacy-redirect requirements |
| Dead hooks/files (`useChange*LabelStatusMutation` ×2, `useCashLoanUnassignedProductsQuery`, `useCashLoanProductPoolQuery`, `useCreditCardProductPoolQuery` equivalent, `manual-card-flow.ts`, `load-initial-detail.ts`, `assigned-product-status-cache.ts`, `mobile-preview-model.ts`, `assigned-product-pagination.ts`, `SelectProductModal.tsx`, `evaluateLoanProduct`) | dead code, recorded not fixed (content rule 10 applies to the two with behavior relevance; the rest are listed for completeness) |
| Emotion styling (`product-labels.styles.ts`) | `legacy-compatible` |

## 13. Technical risks

Ordered by decreasing consequence, per content rule 8.

- **Draft re-seed risk on refetch.** Both forms' initialization `useEffect`
  calls `form.setFieldsValue`/`resetAssignedProductDraft`/`setConditions`
  whenever the detail or assigned-products query's data identity changes.
  Apply/update/create mutations invalidate the same keys, so an active detail
  or assigned-products query can refetch while the form stays mounted after a
  save, and the effect could re-seed the form and silently discard any
  further unsaved edits made in that window. Not confirmed by runtime
  testing; TanStack structural sharing reduces but does not remove the risk.
- **Logout does not visibly clear the Query cache.** No
  `queryClient.clear`/`removeQueries`/`resetQueries` call exists anywhere in
  `src/`. The old doc's "logout resets the slice" protection has no
  TanStack-Query counterpart; whether label data from one session can leak
  into the next (e.g. a different user on the same tab without a full reload)
  is **NEEDS-VERIFICATION**.
- **Silent `STARTS_WITH` truncation.** `cash-loan/criteria-mapper.ts`'s
  `serializeLoanCriteria` keeps only the first `STARTS_WITH` value for
  `PRODUCT_CODE` criteria and silently drops any additional ones (line ~34).
  A user configuring multiple prefix conditions would have extras disappear
  without any validation error. (CONFIRMED by source read, not previously
  documented.)
- **`shared/UnassignedProductTab.tsx`'s ad-hoc query keys.** Its
  `[...rootQueryKey, 'assignable-labels']` key sits outside either line's
  factory. It is still invalidated correctly today because it is nested under
  the factory's own root prefix, but a future factory refactor that changes
  the root shape would silently break this key without any compile-time
  signal, since it is constructed by string concatenation rather than a
  factory method.
- **Status has no dedicated write path in practice.** `PATCH .../:id/status`
  and both `useChange*LabelStatusMutation` hooks exist but have zero callers;
  status changes travel only through the full update payload. Whether the
  dedicated status endpoint is intentionally unused, or an incomplete
  migration, is `NEEDS-TEAM-DECISION`.
- **Repository dead code and duplication.** Several domain-repository
  pass-through methods (`getLabeledProducts`, `getAllLabeledProducts`,
  `disableLabel`, `addProductManual` on cash-loan) are bypassed by their own
  service calling `api.*` directly instead, and multiple mutation hooks
  (`assignProducts`/`removeProduct` equivalents) have zero callers on both
  lines. This does not affect current behavior but is a maintenance trap for
  a future reader who assumes an exported hook or method is live.
- **Orphan duplicate component.** `shared/SelectProductModal.tsx` (836 lines)
  has zero importers; the actually-used equivalent is
  `src/components/select-product-modal/`. Harmless dead weight, not a defect
  in current behavior.
- **Fragile Vietnamese-string variant matching.** `shared/MobilePreviewFrame.tsx`'s
  `resolveVariant` maps the literal title string `'Vay tiền mặt'` to a preview
  variant — an i18n-key change elsewhere would silently break this matching
  with no compile-time signal.
- **Inline Vietnamese validation messages.** `credit-card/rule-engine.ts` has
  some inline Vietnamese message strings instead of the `CARD_MESSAGES`
  constant map used elsewhere in the same file — an i18n-consistency gap
  (`.claude/rules/11-i18n.md` scope), not independently fixed in this pass.

## 14. Areas to avoid touching

- Do not assume `product-labels.slice.ts` or its middleware still exist; any
  future reference to them in other documents or code comments is stale.
- Do not remove either line's `useChange*LabelStatusMutation`,
  `useCashLoanUnassignedProductsQuery`, or the `productPool` hooks as
  "unused cleanup" without confirming with the owning team first — their zero
  consumer count was established by static grep in this pass, not by a
  runtime trace, and `shared/UnassignedProductTab.tsx` reaches the same
  underlying keys through its own direct `useQuery` calls.
- Do not change either line's query-key factory shape without checking the
  three external consumers named in §11 (`ProductLabelsField.tsx` ×2,
  `DisplayInformationProductLabelsField.tsx`) and
  `shared/UnassignedProductTab.tsx`'s ad-hoc key construction.
- Do not "fix" the `serializeLoanCriteria` `STARTS_WITH` truncation (§13) by
  changing its output shape without confirming with backend/BA whether
  multiple prefix conditions are a supported use case at all.
- Do not migrate `cash-loan/product-catalog-api.ts`'s direct
  `window.apiFetcher.get` call into the per-line service as incidental
  cleanup inside an unrelated task; it is a real, if non-conforming, existing
  boundary consumed by `CashLoanCatalogModal` across module boundaries (§10).

## 15. Open questions

- Whether the backend enforces the "deactivating an active label with
  assigned products hides the mobile tab" rule the frontend message implies.
- Timezone handling of `effectiveFrom`/`effectiveTo` — not re-verified.
- Whether the TanStack Query cache is expected to survive logout, and if not,
  what mechanism should clear it (§0, §13).
- Whether either line's query-key factory should move to the
  `queryOptions`-colocated target shape, or be added to
  `.claude/rules/03-api-service.md`'s named exemption list alongside
  scheme-sync/splash-screen/customer-segment — `NEEDS-TEAM-DECISION`.
- Whether the dedicated `PATCH .../:id/status` endpoint and its two unused
  mutation hooks are an intentionally abandoned path or an incomplete
  migration — `NEEDS-TEAM-DECISION`.
- Whether `shared/UnassignedProductTab.tsx`'s two ad-hoc query keys should be
  folded into each line's factory as a follow-up, or are an intentional
  escape hatch for a generic shared component that cannot depend on either
  line's factory file directly.
- Automatic-assignment rollout status (`PRODUCT_LABEL_AUTO_TAB_ENABLED`) —
  unchanged open item from the prior document.
