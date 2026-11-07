# Exclusive Touch — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`-equivalent working tree, branch `portal-cham-vay`, 2026-11-05.
- Method: static source inspection only — fresh `find`, plus a full-file read-only pass by the `codebase-analyzer` subagent over all 13 module files and their routing/permission/menu/Redux/shared-component wiring. No runtime, browser, auth, typecheck, lint, or build verification was performed.
- Scope: `src/modules/products/exclusive-touch/` (13 files, `find src/modules/products/exclusive-touch -type f | wc -l`), plus the parts of `src/routes/main.routes.tsx`, `src/routes/pages.tsx`, `src/helpers/menus.helper.ts`, `src/utils/navigate.ts`, `src/constants/permission.constant.ts`, and `src/redux/slices.ts` that reach or gate this module. This is the **first documentation this submodule has ever had** — `docs/reports/2026-11-04/products-docs-reconciliation.md` Step 2 flags it as never documented, and no prior claim exists to reconcile against.
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Backend semantics of `PUT api/admin/portal/v1/product-types/products` — whether it replaces or appends a type's product assignment, and how reassignment across types behaves (§4d, §6, §13).
  2. Whether `SelectProductModal` actually wraps `formUpdateContent` (`FormAddLayout`) in an AntD `Form`, which `FormAddLayout` depends on via `Form.useFormInstance()` (`components/FormAddLayout.tsx:23`) (§7, §13).
  3. Whether the preview form modal (`views/ExclusiveTouchPage.tsx:93-113`) stays open underneath the iPhone preview modal it opens, since no close call was found in that flow (§4e, §13).
  4. Runtime values of `ExclusiveProductItem.status` (`types.ts:53`, typed `'ACTIVE' | 'INACTIVE' | 'DRAFT' | boolean`) versus the filter's `ExclusiveProductListFilter.statuses` (`types.ts:79`, `'ACTIVE' | 'INACTIVE' | 'UPCOMING'`) — the two unions do not match (§7, §13).
  5. The shape of `ApiFetcher`'s error object as read by `handleAddProducts`'s `onError` (`views/ExclusiveTouchPage.tsx:306-313`, extracting `error.data`/`error.response.data`) — the service itself performs no error normalization (§6, §13).

## 1. Responsibility

Exclusive Touch manages which products are assigned to each product-type "layout" of a home-screen section (the exclusive-touch area of the mobile app's home page), plus a mobile preview of that section. It is a bulk-assignment and visibility screen, not a product create/edit flow:

- **Browse by type** — cards per product type with assigned-product counts; an unassigned card is flagged (`views/ExclusiveTouchPage.tsx:388-420`).
- **List/filter/sort** — keyword + status filter, server-side sort, pagination (`:193-206`, `:466-474`).
- **Bulk assign** — select products and assign them to a type/tag via a shared `SelectProductModal` with a module-specific form body (`FormAddLayout.tsx`), submitted as one PUT call (service `:32-38`).
- **Mobile preview** — a form (audience: customer segments or VIP codes, plus a start date) drives a preview query, rendered inside the shared iPhone-preview simulation shell (`:93-113`, `components/simulation/ExclusiveTouchPreview.tsx`).
- **Layout sample** — a static, read-only grid of all types' current layouts (`components/LayoutPreviewModal.tsx`).

There is **no** create, edit, view, or detail route for an individual exclusive-touch entity. Product codes in the list link out to the existing product view page (`components/ProductTableLink.tsx:24,31`, `PageURLs.ofProductView`), not to anything inside this module.

## 2. Entry points and routes

- **Lazy export:** `src/routes/pages.tsx:255` — `export const ExclusiveTouchPage = lazy(() => import('@/modules/products/exclusive-touch/views/ExclusiveTouchPage'));`.
- **Route (CONFIRMED, `src/routes/main.routes.tsx:490-492`):** path `withPrefix('product/exclusive-touch/management')`, element `<WithGuard Page={ExclusiveTouchPage} Guard={AuthGuard} permissions={[PERMISSIONS.PRODUCT_TYPE_VIEW]} />`. Import at `main.routes.tsx:71`. This is the module's **only** `<Route>`, declared in `main.routes.tsx` (`MainLayout`); there is no entry in `form.routes.tsx` and no create/edit/view sub-route.
- **`PageURLs` builder:** `src/utils/navigate.ts:207-209`, `ofExclusiveTouch()`. The route declaration itself uses the literal string `'product/exclusive-touch/management'` rather than the builder — `withPrefix` is identity (`navigate.ts:3-5`), so both resolve to the same path; this is the repository-wide route-declaration convention (also true of `bank-list`, per `docs/modules/system/BANK-LIST.md` §2), not a defect specific to this module.
- **Menu (CONFIRMED, `src/helpers/menus.helper.ts:229-246`):** a child entry under the `product-issuance` parent (`:232-233`, parent itself has no `requiredPermissions` and links to `PageURLs.ofPopularLoansConfig()`); the child (`:241-246`) has `label: t('Menu.exclusiveTouch')`, `key`/`link` = `PageURLs.ofExclusiveTouch()`, `requiredPermissions: [PERMISSIONS.PRODUCT_TYPE_VIEW]`. `filterMenuByPermissions` (`navigate.ts:455-470`) keeps the parent visible when any sibling child is visible, so the parent menu item does not independently gate this child.
- **`PageURLs.ofExclusiveTouch` has exactly one caller** outside its own definition: the menu entry above (CONFIRMED by the analysis pass's grep).
- **Guard chain (CONFIRMED):** `WithGuard` → `AuthGuard` → `GuardedPage` (`src/guards/index.tsx`, OR check via `permissions.some`, redirects to `PageURLs.of404()` on failure) → `RouteSuspense` → lazy page — the standard chain, not a `ProductLabelsRouteGate`-style exception.
- **No `location.state` or URL query parameters are used** by this route; list state comes from the global `pageParam` Redux slice (§5), keyed by `pathname`, not from the URL.

## 3. Directory map

`find src/modules/products/exclusive-touch -type f` → 13 files.

```text
src/modules/products/exclusive-touch/
|-- views/ExclusiveTouchPage.tsx                       # 553 lines: list, type cards, sort, assign, preview entry
|-- components/
|   |-- ExclusiveProductListSearcherForm.tsx            # keyword + status filter (AntD Form, no rules)
|   |-- FormAddLayout.tsx                               # SelectProductModal form body: type (required) + tag
|   |-- LayoutPreviewModal.tsx                          # static ProductLayout grid, one per product type
|   |-- ProductTableLink.tsx                            # product-code link out to cash-loan/credit-card product view
|   `-- simulation/
|       |-- ExclusiveTouchCarousel.tsx                  # drag-scroll carousel for the mobile preview
|       |-- ExclusiveTouchFormReview.tsx                 # preview input form (audience + start date)
|       `-- ExclusiveTouchPreview.tsx                   # mobile home-section simulation, wraps the carousel
|-- hooks/exclusiveTouchQueries.ts                      # 6 useQuery + 1 useMutation (TanStack Query)
|-- queryKeys/exclusive-touch.query-keys.ts             # exclusiveTouchQueryKeys, keys-only factory
|-- services/exclusive-touch.service.ts                 # exclusiveTouchService, 7 window.apiFetcher calls
|-- types.ts                                             # 17 exported types, no ambient/global declarations
`-- constants.ts                                         # default sort, status labels, message titles
```

No `.module.scss`, no test files, no TODO/FIXME markers, and no Zod import anywhere in this module (CONFIRMED).

## 4. Main runtime flows

### Flow A — list load, filter, sort, paginate (`views/ExclusiveTouchPage.tsx`)

1. `useQueryState()` (`:90`) reads/writes the global Redux `pageParam` slice (`src/redux/slices/query.slice.ts`), not URL state. `isListPath = isCurrentPath()` (`:126`) compares `location.pathname` to the stored path; `applyNewPath` resets the slice whenever the path changes (`query.slice.ts:25-30`).
2. `listTypeQuery = useExclusiveProductTypeListQuery(isListPath)` (`:127`) fetches the type/count cards.
3. `productTypeCode` (`:129-131`) defaults to the filter's type if set, else the first item of `listTypeQuery`'s result (`typeItems[0]?.code`) — i.e. an unfiltered view still resolves to a concrete type before the product list query runs.
4. An effect (`:133-151`) writes `filter.productTypeCode` back into `pageParam` whenever it differs from the resolved code.
5. `listParams` (`:153-161`) = `{ page, size, orderBy, ...filter }`; `orderBy` defaults to `''` (`constants.ts:1`).
6. The product list query is enabled only once the path matches, the type list has succeeded, and `filter.productTypeCode === productTypeCode` (`:163-169`) — avoiding a request with a stale/mismatched type.
7. Type cards (`:388-419`) hide a type whose `total === 0`; an `UNASSIGNED` type card renders a "Cần gán" (needs assignment) badge.
8. The table uses `pagination={false}` with a separate `CustomPagination` component (`:447-474`); `loading` is derived from `listTypeQuery.isLoading || listProductQuery.isFetching` (`:177-178`, `:450`) — `isFetching`, not `isPending` alone, per the paginated-query loading-state rule.

### Flow B — search and sort

- Search: the searcher form's `onFinish` (`components/ExclusiveProductListSearcherForm.tsx:41-47`) calls back into `handleSearch` (`views/ExclusiveTouchPage.tsx:270-276`), which writes `saveQueryParams({ page: 0, filter: cleanFalsyValueFilters({ ...values, productTypeCode }), sort: DEFAULT })` — every new search resets both page and sort.
- Sort (`:193-206`): a field allow-list (`EXCLUSIVE_TOUCH_SORT_FIELDS`, `:65-78`) produces a `"field,asc|desc"` string; sorting also resets to page 0.

### Flow C — bulk-assign products to a type (`FormAddLayout.tsx`, `SelectProductModal`)

1. "Thay đổi layout" (`:372`) and the unassigned-type alert button (`:433`) — both gated on `PRODUCT_TYPE_EDIT` — open the shared `SelectProductModal` (`:480-501`) with `assignedKey='productTypeCode'`, `defaultQueryParams={{ productTypeCode: 'ALL' }}`, and `formUpdateContent={<FormAddLayout>}`.
2. `FormAddLayout` reads its field values through `Form.useFormInstance()` (`:23`) rather than its own `Form.useForm()` — it depends on `SelectProductModal` to supply the surrounding `Form` (§0 verification gap 2). `productTypeId` is required (`:66-82`, rule at `:69-74`); `productTagId` is optional (`:85-92`). A default type is applied via `initialValue` (`:68`) plus a guarded effect (`:45-53`) that only fires when the field is untouched and has no existing value; the effect also emits the selected type's code up to the page (`:55-60`).
3. `handleAddProducts` (`views/ExclusiveTouchPage.tsx:278-326`) guards against a pending mutation (`:282`), resolves `productTypeId` to its `code` via `masterProductTypesQuery.data` (`:283-286`), and shows an `UPDATE_FAIL` notification if `productIds` is empty or the code can't be resolved (`:287-292`) — before calling the mutation.
4. The mutation call (`mutate({ productIds, productTypeCode, productTagId })`, `:294-326`) has its own per-call `onSuccess` (shows `UPDATE_SUCCESS`, closes the modal, `:297-305`) and `onError` (extracts `errorMessage` from `error.data`/`error.response.data`, else shows `UPDATE_FAIL`, `:306-313`) — on top of the hook-level `onSuccess` described in §6.

### Flow D — mobile preview

1. "Xem trước" (`:363-371`) opens a `ModalContent` wrapping `ExclusiveTouchFormReview` bound to a dedicated `previewForm` (`:89`); confirming calls `previewForm.submit()` (`:108`).
2. `ExclusiveTouchFormReview` (`components/simulation/ExclusiveTouchFormReview.tsx`) collects an audience (customer segments **or** VIP codes — mutually exclusive only via field `disabled` state, not a validation rule, `:104-133`) and a required start date bounded to "now or later" (`:69-96`).
3. On submit, the page's handler (`:100-105`) calls `openIphonePreviewModal(openModal, <ExclusiveTouchPreview values={values} />)`. No call closes the form modal underneath the newly-opened preview modal (§0 verification gap 3).
4. `ExclusiveTouchPreview` (`components/simulation/ExclusiveTouchPreview.tsx:21-26`) converts the form's `Dayjs` start date to an ISO string (or `''` if invalid) and calls `useExclusiveTouchPreviewQuery`, enabled only while `startDate` is truthy (`hooks/exclusiveTouchQueries.ts:22`).
5. The preview renders through the shared `SimulationLayout`/`HomePage` simulation shell with this module's own `ExclusiveTouchCarousel`; on error or an empty product list it renders `ApiResponseEmpty` (`ExclusiveTouchPreview.tsx:39-40`).

### Flow E — static layout sample (`LayoutPreviewModal.tsx`)

Opened by "Layout mẫu" (`:356`); calls `useExclusiveProductTypeListQuery()` with its default `enabled`, filters out `'ALL'` (`:21`), and renders one shared `ProductLayout` per remaining type inside a `Spin` keyed on `isFetching`.

### Flow F — outbound product link (`ProductTableLink.tsx`)

`productLineCode === 'CD'` routes to the credit-card product view, anything else routes to cash-loan (`:18`); `openInNewTab` (always `true` from the page, `:228`) renders a plain `Typography.Link target='_blank'` (`:23-29`) instead of the shared `TableLink` (`:30-33`).

## 5. State ownership

| State | Owner | Registered? |
| --- | --- | --- |
| Layout product list | TanStack Query — `useExclusiveProductListQuery` (`hooks/exclusiveTouchQueries.ts:54-65`) | No Redux slice exists for any resource this module owns — `grep -rni "exclusive" src/redux/` and `src/redux/slices.ts` both return no match (CONFIRMED). |
| Type/count cards | TanStack Query — `useExclusiveProductTypeListQuery` (`:67-74`) | — |
| Master product types, product tags, customer segments, preview payload | TanStack Query (`:76-83`, `:85-91`, `:26-34`, `:15-24`) | These same backend resources (product types, product tags, customer segments) also have **existing Redux owners elsewhere** — see §6 "Endpoint sharing" — this module does not duplicate a Redux-owned cache for its *own* resource, but it does run a second cache for data other modules already own in Redux. |
| Assignment mutation | TanStack Query — `useUpdateExclusiveProductLayoutMutation` (`:36-52`) | — |
| List page / filter / sort | Global Redux slice `pageParam` (`src/redux/slices/query.slice.ts`) via `useQueryState()` — **not URL state**, the same pre-existing, repository-wide mechanism `docs/modules/system/BANK-LIST.md` §5 documents for `bank-list` | `legacy-compatible`, not a defect specific to this module; conflicts with `.claude/rules/04-state-management.md`'s "shareable tab/filter/sort/page → URL state" preference for new work — `NEEDS-TEAM-DECISION`, not resolved here |
| Preview form values (`previewForm`) and searcher form values | AntD `Form`/`FormInstance` (`views/ExclusiveTouchPage.tsx:89`; `components/ExclusiveProductListSearcherForm.tsx:26`) | Searcher form is synced from `queryState.filter` on an effect (`:29-35`) |
| Add-modal open state, selected type code, preview-modal open state | Local React `useState` (`views/ExclusiveTouchPage.tsx:83-86`) | — |
| Carousel drag position | `useRef` DOM scroll manipulation (`components/simulation/ExclusiveTouchCarousel.tsx:73-105`) | — |

No `localStorage`/`sessionStorage` use anywhere in the module (CONFIRMED).

### Query-owned checklist (template content rule 15)

- **Redux slice touching the resource:** none, for this module's own server resources. Established by `grep -rni "exclusive" src/redux/` (no match) and reading `src/redux/slices.ts` (no reference).
- **Query key factory:** `queryKeys/exclusive-touch.query-keys.ts`, object `exclusiveTouchQueryKeys` (`:18`). Plain `as const` key arrays; a private `normalizeListParameters` helper (`:7-16`) trims `keyword` and normalizes the remaining list filter fields before they enter the key. Imports only types from `../types` (`:1-5`) — it does **not** import from `services/`.
- **`queryOptions` usage:** none. All 6 queries and the 1 mutation are assembled inline as `useQuery({ queryKey, queryFn, ... })` directly in `hooks/exclusiveTouchQueries.ts`, not via `queryOptions(...)`.
- **Consumer counts per query/mutation:** preview — 1 (`ExclusiveTouchPreview.tsx:23`); customer segments — 1 (`ExclusiveTouchFormReview.tsx:38`); product list — 1 (`views/ExclusiveTouchPage.tsx:163`); type list — 2 (`views/ExclusiveTouchPage.tsx:127`, `LayoutPreviewModal.tsx:19`, same key); master product types — 2 (`views/ExclusiveTouchPage.tsx:82`, `FormAddLayout.tsx:25`, same key); product tags — 1 (`FormAddLayout.tsx:30`); assignment mutation — 1 (`views/ExclusiveTouchPage.tsx:87`).
- **`staleTime`:** none explicit on any of the 6 queries. The global `QueryClient` (`src/providers/query.provider.tsx:7-16`) sets `retry: false` and `refetchOnWindowFocus: false` but no `staleTime`, so the TanStack default of `0` applies to every query in this module.
- **`placeholderData: keepPreviousData`:** present on the paginated product list (`hooks/exclusiveTouchQueries.ts:63`) and on the type list (`:72`, not itself paginated, so harmless); absent on preview, customer segments, master product types, and product tags (none of those are paginated list queries, so this is not a gap against the `## MUST` rule, which applies specifically to paginated list queries whose key includes page/pageSize).
- **Mutation (`:36-52`):** the hook-level `onSuccess` is `async` and runs `await Promise.all([invalidateQueries(exclusiveTouchQueryKeys.lists()), invalidateQueries(exclusiveTouchQueryKeys.listTypes())])` before resolving. No `setQueryData` is used anywhere in the module. The per-call `onSuccess`/`onError` in `views/ExclusiveTouchPage.tsx:294-326` (notification + modal close) run after this awaited hook-level `onSuccess`, so the "Lưu"-equivalent success notification and modal close likely wait on the subsequent list/type refetches, not just the write — not runtime-measured (`NEEDS-VERIFICATION`, §15).

## 6. API boundaries

`services/exclusive-touch.service.ts` (`exclusiveTouchService`, `:12`) is feature-local and `LEGACY-COMPATIBILITY` per `.claude/rules/03-api-service.md` "Service location" — the module's git history (`9fe7374`, 2026-10-28) predates the 2026-10-29 service-location adoption date, so `src/services/products/exclusive-touch.service.ts` was never the expected location at the time this module was written.

| Method | HTTP | Endpoint | Response | Notes |
| --- | --- | --- | --- | --- |
| `getProductPreview` (`:13-21`) | GET | `api/admin/portal/v1/product-types/products/preview` | `ExclusiveProductListSimulationApiResponse` | `as`-cast response, no runtime validation |
| `getCustomerSegments` (`:22-31`) | GET | `api/admin/portal/v1/category/customer-segment` | unwraps `items ?? []` | — |
| `updateProductLayout` (`:32-39`) | PUT | `api/admin/portal/v1/product-types/products` | `void` | body `UpdateExclusiveProductLayoutParams`; backend replace-vs-append semantics `NEEDS-VERIFICATION` |
| `getListProductTags` (`:40-45`) | GET | `api/admin/portal/v1/products/master-data/tags` | `ProductSelectTag[]` (ambient type) | `as`-cast |
| `getMasterProductTypes` (`:46-53`) | GET | `api/admin/portal/v1/products/master-data/types` | `ProductSelectType[]` (ambient type) | `as`-cast |
| `getListProducts` (`:54-65`) | GET | `api/admin/portal/v1/products/catalog` | `ExclusiveProductListApiResponse` | `as`-cast |
| `getListProductTypes` (`:66-75`) | GET | `api/admin/portal/v1/product-types/product-counts` | `ExclusiveProductTypeListApiResponse` | `as`-cast |

- All seven calls go through the global `window.apiFetcher` (CONFIRMED) — no direct axios/fetch, consistent with the transport-boundary rule.
- No runtime validation anywhere in this service; per `.claude/rules/03-api-service.md` "Contracts and errors", an absent Zod parse on a stable, known CRUD-shaped API is the default boundary assumption, not a gap, and this document does not flag it as one.
- No error normalization inside the service itself — unlike `bank.service.ts`'s `normalizeBankApiError`. The page's `handleAddProducts` `onError` (`views/ExclusiveTouchPage.tsx:306-313`) reads `error.data`/`error.response.data` directly; the exact shape `ApiFetcher` throws was not independently confirmed (`NEEDS-VERIFICATION`, §0).
- Every query function forwards the TanStack `AbortSignal` (`hooks/exclusiveTouchQueries.ts:21,32,61,70,80,88`); the mutation function takes no signal (expected — mutations are not cancelled the same way).
- The service imports only types from `../types`; no React, Redux, or `queryKeys/` import (satisfies the required dependency direction).

**Endpoint sharing with other owners (CONFIRMED by grep, not this module's concern to fix, but relevant to §13):**

- `products/catalog` — also called by `src/components/select-product-modal/select-product.service.ts:23` (the shared modal this module itself uses for assignment), the Redux `product-list.slice.ts:260`, and `src/modules/products/configuration/product-labels/cash-loan/product-catalog-api.ts:150`.
- `products/master-data/types` — also read by Redux `product-list.slice.ts:788`.
- `products/master-data/tags` — also read by Redux `product-list.slice.ts:810`.
- `category/customer-segment` — also read by Redux `common.slice.ts:382`.
- `product-types/products/preview`, PUT `product-types/products`, and `product-types/product-counts` are used only by this module.

## 7. Forms and validation

All forms use AntD `Form`/`FormInstance`; no React Hook Form; no Zod anywhere in the module (CONFIRMED).

- **`ExclusiveProductListSearcherForm.tsx`** — `Form.useForm()` (`:26`): `keyword` (`Input`, `maxLength=100`, `:59`) and `statuses` (`Select`, `:65-91`). No `rules`. Synced from `queryState.filter` via an effect (`:29-35`); submits through `onFinish` (`:41-47`). The form's `name` prop is `'splash-screen-searcher'` (`:40`) — an apparent copy-paste from `src/modules/system/splash-screen/components/SplashScreenSearcherForm.tsx:38`; since the two forms are never mounted together, this is a naming mistake rather than a behavior collision (`LIKELY` low-risk, per the analysis pass).
- **`FormAddLayout.tsx`** — does not call its own `Form.useForm()`; it reads the surrounding form via `Form.useFormInstance()` (`:23`), so it depends on `SelectProductModal` rendering it inside a `Form` (§0 verification gap 2). `productTypeId` is required (`:66-82`, rule `:69-74`, `VALIDATION_MESSAGE.REQUIRED`); `productTagId` has no rule.
- **`ExclusiveTouchFormReview.tsx`** — `Form.useForm(form)` (`:25`, the instance may be `undefined` if a caller omits it). `startDate` is required and bounded to "now or later" (`:69-96`). Audience is `customerSegmentIds` (via the shared `SelectFormCustom`) or `vipCodes` (free-text input, `maxLength=50`) — the two are mutually exclusive **only through `disabled` state on each field** (`:104-133`), not through a cross-field validation rule, so a submission with neither populated is currently allowed by validation (`NEEDS-TEAM-DECISION`: whether that is an intended valid business state, §15). An effect (`:35-37`) resets the form's fields on mount.
- **Imperative validation outside AntD rules:** `handleAddProducts` (`views/ExclusiveTouchPage.tsx:287`) separately checks `productIds.length` and the resolved `productTypeCode`, surfacing failures as a notification rather than a field error — this is intentional (it is not a form-field concern) rather than duplicated validation logic of the kind flagged as a risk in `docs/modules/system/BANK-LIST.md` §7.
- There is no create/edit/view submission flow for an exclusive-touch entity itself; the only two form submissions in this module are the bulk-assign form (Flow C) and the preview-input form (Flow D), neither of which maps onto the repository's usual product CRUD form pattern.

## 8. Types and DTO organization

`types.ts` is entirely feature-local (17 exported types) with no `declare global`/ambient declarations of its own. It imports `Dayjs` and `SegmentationCustomerKeyValue` (`src/types/common.d.ts:93`).

- `ExclusiveTouchFormReviewValues` (`:4-8`): `{ startDate: Dayjs | null; customerSegmentIds?: number[]; vipCodes?: string }`.
- `ExclusiveTouchPreviewQuery` (`:10-15`): `{ startDate: string }` — the Dayjs→ISO conversion happens inline at `ExclusiveTouchPreview.tsx:25`, not through a shared mapper file.
- `ExclusiveTouchCustomerSegment` (`:17`) is an alias of `SegmentationCustomerKeyValue`; `ExclusiveTouchCustomerSegmentQuery` (`:19-22`) is `{ page, size }`.
- `UpdateExclusiveProductLayoutParams` (`:24-28`): `{ productIds: number[]; productTypeCode: string; productTagId?: number }` — the mutation's write DTO.
- `FormAddLayoutValues` (`:30-33`): `{ productTypeId?; productTagId? }`.
- `ExclusiveProductItem` (`:48-74`): `status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | boolean` (`:53`); `startDate?`, `endDate?`, and non-optional `updatedDate` (`:68`) are typed `Dayjs`, but the service returns raw JSON with no mapper converting them (`LIKELY` latent mismatch — current render paths do not read these three fields, so it has not surfaced, §0/§13).
- `ExclusiveProductListFilter` (`:76-80`): `statuses?: 'ACTIVE' | 'INACTIVE' | 'UPCOMING'` — a single value, and notably **does not include `'DRAFT'`**, which `ExclusiveProductItem.status` does include, and **does include `'UPCOMING'`**, which `ExclusiveProductItem.status` does not — the two unions genuinely disagree (§0 verification gap 4).
- `ExclusiveProductListUrlQuery` (`:82-86`), `ExclusiveProductListApiResponse` (`:88-91`), `ExclusiveProductTypeItem` (`:93-97`), `ExclusiveProductTypeListApiResponse` (`:99`), `SimulationAttachment` (`:101-104`), `SimulationProductItem` (`:106-127`), `ExclusiveProductListSimulationApiResponse` (`:129-138`).
- **Ambient globals consumed, not declared, by this module:** `ProductSelectType` and `ProductSelectTag` (`src/types/product-list.d.ts:160,166`), the same ambient types the Redux `product-list.slice.ts:33-34` also uses.
- **Confirmed transformations (not identity passthroughs):** form `Dayjs` → preview-query ISO string (`ExclusiveTouchPreview.tsx:23-26`); `FormAddLayoutValues.productTypeId` (number) → `productTypeCode` (string) via a lookup against `masterProductTypesQuery.data` (`views/ExclusiveTouchPage.tsx:283-286`); customer-segment API items → `{ value → name }` with a few codes filtered out (`ExclusiveTouchFormReview.tsx:42-54`); `SimulationProductItem` → carousel card props, several fields renamed (`ExclusiveTouchCarousel.tsx:136-145`).
- **Confirmed type-safety escapes:** `status as any` (`views/ExclusiveTouchPage.tsx:265`); `as ProductTypeCode` (`LayoutPreviewModal.tsx:39`); a literal-union cast with no `default` branch in the corresponding `switch` (`ExclusiveTouchCarousel.tsx:40-59`); `Form.useWatch` casts (`ExclusiveTouchFormReview.tsx:26-33`).

## 9. Permissions

This module references only **2** `PERMISSIONS.*` constants in total, both defined at `src/constants/permission.constant.ts:161-162`: `PRODUCT_TYPE_VIEW: 'product_type:view'`, `PRODUCT_TYPE_EDIT: 'product_type:edit'`. Neither the module-scoped nor the repository-wide count exceeds the template's 10-constant/recurring-array threshold, so no named-group table is used here.

- **Module-scoped** (`grep -rn "PERMISSIONS\." src/modules/products/exclusive-touch/`): `PRODUCT_TYPE_EDIT` at `views/ExclusiveTouchPage.tsx:372,433`, both single-permission arrays passed to `hasPermission([...])` (`src/hooks/auth.hook.ts:25-38`, default OR semantics with one member). `PRODUCT_TYPE_VIEW` is **not referenced inside the module directory at all**.
- **Route/menu-scoped:** `PRODUCT_TYPE_VIEW` appears at `main.routes.tsx:491` (single-permission array, gating the route) and `menus.helper.ts:245` (single-permission array, gating the menu entry) — neither is part of a multi-permission OR array for this module.
- This is the expected shape for a view-gated-at-the-route, edit-gated-in-component module, the same pattern `docs/modules/system/BANK-LIST.md` §9 documents for `bank-list`: `PRODUCT_TYPE_VIEW` gates "can see the page at all" at the route/menu layer, while `PRODUCT_TYPE_EDIT` gates the two assignment-triggering actions (the "Thay đổi layout" button and the unassigned-type alert button) inside the rendered page.
- **Not permission-gated at all:** the assignment mutation (`updateProductLayout`) itself has no permission check in the hook or service layer — only the two UI entry points that trigger it are gated. Whether the backend independently enforces `product_type:edit` on the PUT endpoint is `NEEDS-VERIFICATION` (frontend guards are not a backend security boundary, per `.claude/rules/06-routing-permission.md`). The "Xem trước" (preview) and "Layout mẫu" (sample) actions, and the base list itself, are not gated beyond the route-level `PRODUCT_TYPE_VIEW` — a view-only user can trigger the preview query and open the sample modal.
- `main.routes.tsx:491` and `menus.helper.ts:245` are each confirmed single-permission arrays (equivalent to a plain boolean check here), not OR arrays and not a helper-function-resolved permission — confirmed per-call-site, not inferred from a neighboring check.

## 10. Shared and cross-domain dependencies

**Imported by this module, from outside it:**

- Simulation shell: `@/components/simulation/SimulationLayout`, `.../pages/home/HomePage`, `.../components/HeaderSection`, `BannerCarousel`, `FeatureMenu`, `Spacer`, `ApiResponseEmpty`, and `.../components/products/ProductLayout` (the last used by both `LayoutPreviewModal.tsx` and `ExclusiveTouchCarousel.tsx`, only 2 importers repository-wide).
- `@/components/iphone-preview/modal` (`openIphonePreviewModal`), `@/components/select-product-modal` (`SelectProductModal` — also its own service/query-keys call the same `products/catalog` endpoint this module reads independently).
- Ordinary shared-component reuse: `select-form-custom`, `date-picker`, `input`, `select`, `button`, `table-link`, `table-card-status`, `table-wrapper`, `titles/table.title`, `no-data`, `modal-content`, `pagination`.
- `@/hooks/modal.hook`, `@/hooks/query-state.hook`, `@/hooks/auth.hook`.
- `cleanFalsyValueFilters` (`src/utils/common.ts:180`), `createOptions` (`src/utils/form.ts:23`), `PageURLs`, `MESSAGE`/`VALIDATION_MESSAGE`/`PAGINATION_PARAMS` constants, `PERMISSIONS`, `ASSET_SIMULATION.products.exclusiveTouch` (an asset-mapping constant, `_mapping_asset.ts:21,55`), and the global `setNotification` (`notification.slice`).
- Ambient types `ProductSelectType`/`ProductSelectTag` (`src/types/product-list.d.ts:160,166`, §8).
- Global Redux `pageParam` (`query.slice.ts`) via `useQueryState` — shared by every page in the repository that uses that hook, not module-specific.

**A naming look-alike that is a separate component, not a shared dependency (CONFIRMED, not to be confused with this module):** `src/components/simulation/components/ExclusiveTouchCarousel/index.tsx` (with its own `styles.module.scss`) is a **different** component — its own `ExclusiveTouchCarouselProps` (`index.tsx:18`) and its own CSS variable `--exclusive-touch-bg` — consumed by `src/components/simulation/components/defaultPageComponents.tsx:7,21,36` and `src/components/simulation/types/simulation-theme.types.ts:2,10`. This module's own `components/simulation/ExclusiveTouchCarousel.tsx` does **not** import that shared component; whether the two carousels render visually consistent output is `NEEDS-VERIFICATION` (§15).

**Cross-product references:** none — this module imports no types, data, or utilities from any other `products/` submodule (cash-loan, credit-card, industry-product, etc.). It hardcodes the two product-line codes `'CL'`/`'CD'` directly (`views/ExclusiveTouchPage.tsx:249`, `ProductTableLink.tsx:18`) rather than importing a shared product-line type, and links out via the generic `PageURLs.ofProductView`.

**Outside consumers of this module's own exports:** none found (CONFIRMED by grep for `exclusive-touch|ExclusiveTouch|exclusiveTouch` outside the module directory) beyond the route/lazy/menu/navigate wiring already covered in §2.

## 11. Consumers

No outside module or shared component imports anything this module exports. The only outside references are: the route declaration (`main.routes.tsx:71,490-492`), the lazy export registration (`pages.tsx:255`), and the menu entry (`menus.helper.ts:241-246`) — all standard routing/menu wiring, not a feature-level consumer relationship. The "look-alike" shared `ExclusiveTouchCarousel` component (§10) is a separate piece of code with its own consumer set and is not a consumer of this module.

## 12. Pattern classification

**Mixed — target-compatible in its core state/server-data architecture, legacy-compatible in service location, list-state mechanism, and query-factory shape:**

- **State ownership (target-compatible):** sole TanStack Query ownership of this module's own server resources, zero Redux duplication for them (§5) — matching `.claude/rules/04-state-management.md`'s "server data for a new feature/resource → TanStack Query" row.
- **Dual caching of resources Redux already owns elsewhere (mixed, worth naming plainly):** this module runs its own TanStack Query cache for product types, product tags, and customer segments — resources the existing Redux `product-list.slice.ts` and `common.slice.ts` already own for other modules (§6). This is not the "two independent authoritative owners of the same resource" problem the state-management rule warns against for *this module's* data, since this module never writes to those Redux slices, but it is two separate caches reading the same backend endpoints under two different cache policies (`NEEDS-TEAM-DECISION`, not resolved here).
- **Query key factory (legacy-compatible, not a violation):** `queryKeys/exclusive-touch.query-keys.ts` is keys-only — no `queryOptions(...)` colocation, all queries assembled inline in the hooks file. `.claude/rules/03-api-service.md` names this keys-only-plus-hook-assembled shape as an accepted exception for `scheme-sync` and `splash-screen`, and states the `queryOptions` shape is the expected pattern specifically for *new* feature-owned resources and resources *being updated* — this module predates that rule's adoption and is not currently being substantially rewritten, so this is recorded as a `SHOULD`-level gap, not a violation.
- **Service location (`LEGACY-COMPATIBILITY`):** feature-local `services/exclusive-touch.service.ts`, committed 2026-10-28, one day before the 2026-10-29 service-location adoption date; the target `src/services/products/` location is not where this file lives.
- **Paginated-query MUST rules (target-compatible):** `placeholderData: keepPreviousData` is present on the paginated product list query; loading state is derived from `isFetching`, not `isPending` alone, and the retained rows are not unmounted during a page/filter change (§4A, §5).
- **No explicit `staleTime` (legacy-compatible deviation from a SHOULD):** none of the 6 queries set one; the repository-wide default of `0` applies (§5).
- **Forms (target-compatible):** AntD `Form`/`FormInstance` is the sole form-state owner throughout; no RHF; no Zod, which is acceptable for these two simple forms per `.claude/rules/05-form.md`'s "where appropriate" framing rather than a mandate.
- **Styling (`legacy-compatible` per `.claude/rules/10-styling.md`):** Emotion `css` props and inline styles throughout; no `.module.scss` anywhere in this module.
- **i18n (mixed, mostly hardcoded):** only one `t()` call site was found inside the module (the menu label is defined outside it, `menus.helper.ts:243`); nearly every other user-facing string (button labels, notification titles, badge text) is a hardcoded Vietnamese literal. The `Menu.exclusiveTouch` key itself is present in both `vi.json` and `en.json` (spot-checked). As with `docs/modules/system/BANK-LIST.md` §12's equivalent finding, whether this is a pre-existing exemption or a current gap against `.claude/rules/11-i18n.md` cannot be settled from source alone (`.claude/` is gitignored in this checkout, so the rule's own adoption date is not independently datable) — recorded as a current-state fact, `LIKELY` a gap rather than `CONFIRMED` one.
- **Route declaration (legacy-compatible):** the route's path is a literal string duplicating `PageURLs.ofExclusiveTouch()` rather than calling the builder — the repository-wide convention, not specific to this module.

## 13. Technical risks

1. **Backend semantics of the bulk-assignment PUT are unverified.** `updateProductLayout` (`services/exclusive-touch.service.ts:32-39`) sends `{ productIds, productTypeCode, productTagId }` to `PUT api/admin/portal/v1/product-types/products`; whether this replaces a type's full product set, appends to it, or handles cross-type reassignment (a product moved from one type to another) was not established from the frontend alone (§0).
2. **The assignment mutation has no frontend permission check of its own**; only its two UI trigger points are gated by `PRODUCT_TYPE_EDIT`. Whether the backend independently enforces this is `NEEDS-VERIFICATION` (§9).
3. **Two type unions genuinely disagree.** `ExclusiveProductItem.status` (`types.ts:53`) and `ExclusiveProductListFilter.statuses` (`types.ts:79`) do not share the same set of allowed values (`'DRAFT'`/`boolean` on one side, `'UPCOMING'` on the other) — a filter value the UI offers may not correspond to any value the list items can actually have, or vice versa (§8).
4. **`Dayjs`-typed response fields with no mapper.** `ExclusiveProductItem.startDate`/`endDate`/`updatedDate` are typed `Dayjs` (`types.ts:65-68`) but the service performs no conversion from the raw JSON response — latent until something actually renders these fields (§8).
5. **Dual TanStack Query caches for Redux-owned reference data.** Product types, product tags, and customer segments are fetched by this module's own queries while also being owned by existing Redux slices (`product-list.slice.ts:788,810`, `common.slice.ts:382`) for other modules — two caches, two policies, same backend data (§6, §12).
6. **Query key normalization mismatch.** The list query key is normalized (trimmed `keyword`, etc., `queryKeys/exclusive-touch.query-keys.ts:7-16`) but the actual request sent by the query function uses the raw, un-normalized params (`hooks/exclusiveTouchQueries.ts:60-61`, `services/exclusive-touch.service.ts:54-64`) — two differently-whitespaced filter objects would share a cache entry while potentially sending different requests. `LIKELY` low practical impact given `keyword` is also trimmed by its own input control.
7. **`listTypes` key sits outside the `['exclusive-touch']` key prefix** (`queryKeys/exclusive-touch.query-keys.ts:30`) — a hypothetical future prefix-wide invalidation of this module's resources would silently miss the type/count cache.
8. **No error normalization in the service**, unlike the pattern `docs/modules/system/BANK-LIST.md` documents for `bank-list`; the page reads `error.data`/`error.response.data` directly for the one place it displays a backend message (`views/ExclusiveTouchPage.tsx:306-313`) (§6, §0).
9. **Form-instance dependency across component boundaries.** `FormAddLayout.tsx:23` requires a parent `Form` supplied by `SelectProductModal`; this was not independently confirmed from `SelectProductModal`'s own source in this pass (§0).
10. **Preview-form-modal stacking is unconfirmed.** No code closes the preview-input form modal when the iPhone-preview modal opens on top of it (Flow D) (§0).
11. **Dead/unused code:** `ExclusiveTouchCarousel.tsx:132` destructures only `productTypeCode` from its data, leaving a `productTitle` computation (`:43-59`, which itself calls `formatMoneyShort`, `:26-36`) entirely unused — the title actually rendered comes from `product.displayValue` (`:138`). `ExclusiveTouchFormReview`'s `description` prop (`:16,22,67`) is declared but never passed by any caller.
12. **Copy-pasted AntD form `name`.** The searcher form's `name='splash-screen-searcher'` (`ExclusiveProductListSearcherForm.tsx:40`) is identical to `src/modules/system/splash-screen/components/SplashScreenSearcherForm.tsx:38`'s form name — `LIKELY` harmless since the two forms are never mounted together, but it is a naming mistake worth fixing opportunistically rather than copying forward.
13. **Hardcoded product-line and type-code label fallbacks.** `views/ExclusiveTouchPage.tsx:249` renders any non-`'CL'` line as "Thẻ tín dụng" (credit card) rather than branching on the actual `'CD'` code; `LayoutPreviewModal.tsx:37` hardcodes the `UNASSIGNED` label directly rather than through a shared status/label map.
14. **One `status as any` cast** (`views/ExclusiveTouchPage.tsx:265`) and a literal-union `switch` with no `default` branch (`ExclusiveTouchCarousel.tsx:40-59`) bypass type safety at two call sites (§8).
15. **`views/ExclusiveTouchPage.tsx` is 553 lines** in a single file, well past the repository's informal per-file review-attention threshold (`.claude/rules/07-component.md`'s ~200-line guidance) — an observation, not by itself a defect, and not something this document authorizes splitting.
16. **Visual-parity risk with the shared, same-named `ExclusiveTouchCarousel`** under `src/components/simulation/components/` (§10) — the two components are unrelated in code but share a name and a conceptual purpose (rendering an "exclusive touch" section); whether their visual output should match is `NEEDS-VERIFICATION`.

## 14. Areas to avoid touching

- `src/routes/main.routes.tsx:71,490-492` and `src/routes/pages.tsx:255` — the route declaration and lazy boundary; preserve the guard chain, the single `PRODUCT_TYPE_VIEW` permission, and the `withPrefix('product/exclusive-touch/management')` path.
- `src/helpers/menus.helper.ts:229-246` — the menu entry and its parent; changing the parent's permission-less status or the child's `requiredPermissions` affects the shared `filterMenuByPermissions`/`findFirstAccessibleMenuLink` behavior for the whole `product-issuance` menu group, not just this module.
- `src/utils/navigate.ts`'s `ofExclusiveTouch`, `withPrefix`, `filterMenuByPermissions`, and `findFirstAccessibleMenuLink` — shared navigation infrastructure, not owned by this module.
- `src/constants/permission.constant.ts:161-162` (`PRODUCT_TYPE_VIEW`/`PRODUCT_TYPE_EDIT`) — shared constants; confirm no other module depends on their exact string values before any change.
- `src/redux/slices/query.slice.ts` and `src/hooks/query-state.hook.ts` — the shared `pageParam` mechanism every list page in the repository that calls `useQueryState` depends on; this module is one consumer among many, not the owner.
- `src/types/product-list.d.ts:160,166` (`ProductSelectType`/`ProductSelectTag`) — ambient types also consumed by Redux `product-list.slice.ts`.
- `src/components/select-product-modal/**` and `src/components/simulation/**` (`SimulationLayout`, `ProductLayout`, `HomePage`, and the *other*, same-named `ExclusiveTouchCarousel` under `components/simulation/components/`) — shared infrastructure this module consumes but does not own.
- `src/providers/query.provider.tsx` — the global `QueryClient` defaults (`retry: false`, `refetchOnWindowFocus: false`, no global `staleTime`) that every query in this module inherits.
- The Redux `product-list.slice.ts` and `common.slice.ts` endpoints this module's queries overlap with (§6, §13 risk 5) — changing either independently without accounting for the other's cache is a cross-cutting change.

## 15. Open questions

- `NEEDS-VERIFICATION`: whether `PUT api/admin/portal/v1/product-types/products` replaces or appends a type's product assignment, and how cross-type reassignment behaves (§13 risk 1).
- `NEEDS-VERIFICATION`: whether `SelectProductModal` actually renders `formUpdateContent` inside an AntD `Form`, which `FormAddLayout` depends on (§7, §13 risk 9).
- `NEEDS-VERIFICATION`: whether the preview-input form modal remains open underneath the iPhone-preview modal it opens, or whether it is closed by code not found in this pass (§4 Flow D, §13 risk 10).
- `NEEDS-VERIFICATION`: the actual runtime values of `ExclusiveProductItem.status` versus `ExclusiveProductListFilter.statuses`, given the two declared unions disagree (§8, §13 risk 3).
- `NEEDS-VERIFICATION`: the exact shape `ApiFetcher` throws on error, since the page's error handling (`views/ExclusiveTouchPage.tsx:306-313`) reads `error.data`/`error.response.data` with no normalization layer to fall back on (§6).
- `NEEDS-VERIFICATION`: whether the backend independently enforces `product_type:edit` on the assignment PUT endpoint, since the frontend gates it only at two UI trigger points, not in the mutation hook itself (§9, §13 risk 2).
- `NEEDS-VERIFICATION`: whether the module's own `ExclusiveTouchCarousel` and the separate, same-named shared `src/components/simulation/components/ExclusiveTouchCarousel/` component are expected to render visually consistent output (§10, §13 risk 16).
- `NEEDS-TEAM-DECISION`: whether a preview submitted with neither `customerSegmentIds` nor `vipCodes` populated (currently allowed by validation) is an intended valid business state (§7).
- `NEEDS-TEAM-DECISION`: whether running a second TanStack Query cache for product types, tags, and customer segments — resources already owned by Redux slices for other modules — is an accepted pattern going forward, or a case the eventual Redux-to-Query migration work (`.claude/rules/04-state-management.md` "Server state ownership") should reconcile (§12, §13 risk 5).
- `NEEDS-TEAM-DECISION`: whether this module's near-total hardcoded-Vietnamese UI text should be migrated to `t()`/`vi.json`/`en.json`, given `.claude/rules/11-i18n.md` expects this of modules created after that rule existed, and this module's first commit (2026-10-28) postdates the rule's presence in this checkout but the rule's own adoption date cannot be independently established since `.claude/` is gitignored here (§12).
- `NEEDS-TEAM-DECISION`: whether the global Redux `pageParam` slice (rather than URL state) for this list's filter/page/sort is acceptable going forward, given `.claude/rules/04-state-management.md`'s stated preference for URL state on shareable list state — the same open question `docs/modules/system/BANK-LIST.md` §15 records for `bank-list` (§5, §12).
