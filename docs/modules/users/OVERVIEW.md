# Users — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq`. Method: static source inspection only (`find`/`grep`/`Read`, plus direct reads of `src/redux/slices.ts` and `src/redux/store.ts` for registration). No runtime, browser, auth, or backend verification was performed.
- Scope: `src/modules/users/` (91 files, `find src/modules/users -type f | wc -l`), plus the parts of `src/routes/`, `src/redux/`, `src/helpers/menus.helper.ts`, `src/constants/permission.constant.ts`, `src/types/`, and `src/services/users/` that this module uses or that use it.
- Split decision: `customer/segmentation/` (34 files, `find src/modules/users/customer/segmentation -type f | wc -l`) has its own document, [`SEGMENTATION.md`](SEGMENTATION.md). It is the single largest sub-area in the module (34 of 91 files, larger than the entire `operator/` submodule), it is the only part of `users/` with a confirmed cross-module consumer (13 files under `src/modules/products/**` import its options/utils, see §10), it owns the module's heaviest Redux slice (`segmentation-customer.slice.ts`: 14 thunks, 48 `loading` references, roughly double any other users slice), and it has the deepest nested structure (`components/{form,table,upload}/`, `create|edit|view/condition/`). The remaining submodules (`customer/list-customer`, `customer/access-account`, `customer/unlock-request`, `operator/*`, `affiliate-partner/*`) are covered here. This mirrors the `contents/BANNER.md` split (one oversized, cross-consumed child pulled out of its parent's overview).
- `distributor.user.tsx` is documented here (§2, §3, §12) per the template's content rule 7 — it stays in the overview, not `docs/modules/PLACEHOLDERS.md`.
- Remaining verification gaps, ranked by consequence (full list in the underlying investigation; only the top five per the template's limit):
  1. **Unlock-request menu/route permission mismatch** — the menu entry requires `USER_VIEW` (`src/helpers/menus.helper.ts:85-89`) but the route requires `UNLOCK_REQUEST_VIEW` (`src/routes/main.routes.tsx:90-94`). `NEEDS-TEAM-DECISION` whether this is intentional.
  2. **`users/distributor` route carries no permission array** (`src/routes/main.routes.tsx:106-108`) — reachable by any authenticated user who knows the URL. Whether `WithGuard`/`AuthGuard` imposes an implicit check when `permissions` is omitted was not verified (`src/guards/index.tsx` was not read in this pass).
  3. **Backend semantics of `…/batch` endpoints that take `status` as a path segment** (e.g. `staff/${data.status}/batch`, `src/redux/slices/staff.slice.ts:82`; `user/${data.status}/batch`, `account-access.slice.ts:170`) — not settleable from frontend code alone.
  4. **C06 identification-result population** — whether the backend always returns `c06Result` on `GET customer/${id}`, and the exact status vocabulary (§4d) — frontend-only verification.
  5. **Two parallel ambient types for the same C06 concept** (`CustomerCheckResult` in `src/types/customer.d.ts:91` vs. `C06CheckResult` in `src/types/loan-order.d.ts:32`, used by `users` and `order` respectively) — which one is canonical is a team decision if they are ever consolidated, not resolved here.

## 1. Responsibility

This module is the admin UI for staff/operator administration, customer lookup and identification review, customer account-access and unlock workflows, customer segmentation rule authoring, and affiliate-partner management, under the `/users/**` route prefix. Four top-level children, confirmed by `find src/modules/users -maxdepth 1`:

- **`operator/`** (26 files) — staff/operator CRUD (`user-operator-list/`, 14 files) and role/group permission management (`group-permission/`, 12 files). Routes `users/operator/list/*` and `users/operator/permission/*`.
- **`customer/`** (54 files) — customer list/detail including the C06 identification-result display (`list-customer/`, 9 files), account-access list/detail (`access-account/`, 7 files), customer segmentation rule authoring (`segmentation/`, 34 files — see [`SEGMENTATION.md`](SEGMENTATION.md)), and unlock-request handling (`unlock-request/`, 4 files).
- **`affiliate-partner/`** (10 files) — associated-partner CRUD at `users/affiliate-partner/*`.
- **`distributor.user.tsx`** (loose file, 1 file, 3 lines) — placeholder, no real implementation (§2, §3, §12).

Segmentation's options and utilities are a genuine cross-domain dependency: `src/modules/products/**` imports them to drive customer-segment-based business rules in product configuration (§10, detailed in `SEGMENTATION.md`).

## 2. Entry points and routes

Every users route element is `<WithGuard Page={…} Guard={AuthGuard} permissions={[…]} />`, confirmed by reading each declaration; none uses `NonLoginGuard`. Counted reliably with `grep -oE "<Route($|[ >/])" src/routes/main.routes.tsx src/routes/form.routes.tsx`: **22** users `<Route>` elements total (8 in `main.routes.tsx`, 14 in `form.routes.tsx`). Every route-level `permissions` array on a users route is single-element; OR semantics for this module exist only inside components via `hasPermission` (§9), not at the route layer.

### `src/routes/main.routes.tsx` (`MainLayout`)

| Path | Line | `pages.tsx` lazy export → import target | Guard permissions | `PageURLs` |
| --- | --- | --- | --- | --- |
| `users/operator/list` | 78-80 | `ListOperator` → `operator/user-operator-list/list.operator` | `[STAFF_VIEW]` | `ofUsersOperatorList()` |
| `users/operator/permission` | 82-84 | `PermissionOperator` → `operator/group-permission/permission.operator` | `[ROLE_VIEW]` | `ofUsersOperatorPermission()` |
| `users/customer/list` | 86-88 | `ListCustomer` → `customer/list-customer/list.customer` | `[CUSTOMER_VIEW]` | `ofUsersCustomerList()` |
| `users/customer/unlock-request/list` | 90-94 | `ListCustomerUnlockRequest` → `customer/unlock-request/list` | `[UNLOCK_REQUEST_VIEW]` | `ofAccountUnlockRequest()` |
| `users/customer/account-access-list` | 96-98 | `AccountAccessList` → `customer/access-account/account-access-list.customer` | `[USER_VIEW]` | `ofAccountAccessList()` |
| `users/customer/segmentation` | 100-103 | `SegmentationCustomer` → `customer/segmentation/segmentation.customer` | `[CUSTOMER_SEGMENT_VIEW]` | `ofUsersCustomerSegmentation()` |
| `users/distributor` | 106-108 | `Distributor` → `users/distributor.user` | **none** — `//Chưa biết` comment on this line | `ofUsersDistributor()` (unused by any route) |
| `users/affiliate-partner` | 110-113 | `AffiliatePartner` → `affiliate-partner/affiliate-partner.user` | `[ASSOCIATED_PARTNER_VIEW]` | `ofUsersAffiliatePartner()` |

### `src/routes/form.routes.tsx` (`BasicLayout`)

| Path | Line | Lazy page | Guard permissions |
| --- | --- | --- | --- |
| `users/operator/list/create` | 200-202 | `CreateOperator` | `[STAFF_CREATE]` |
| `users/operator/list/view/:id` | 204-206 | `ViewOperator` | `[STAFF_VIEW]` |
| `users/operator/list/edit/:id` | 208-210 | `EditOperator` | `[STAFF_EDIT]` |
| `users/operator/permission/create` | 212-214 | `CreatePermission` | `[ROLE_CREATE]` |
| `users/operator/permission/edit/:id` | 216-218 | `EditPermission` | `[ROLE_EDIT]` |
| `users/operator/permission/view/:id` | 220-222 | `ViewPermission` | `[ROLE_VIEW]` |
| `users/customer/list/view/:id` | 224-226 | `ViewCustomer` | `[CUSTOMER_VIEW]` |
| `users/customer/segmentation/create` | 228-235 | `CreateSegmentationCustomer` | `[CUSTOMER_SEGMENT_CREATE]` |
| `users/customer/segmentation/edit/:id` | 238-245 | `EditSegmentationCustomer` | `[CUSTOMER_SEGMENT_EDIT]` |
| `users/customer/segmentation/view/:id` | 248-255 | `ViewSegmentationCustomer` | `[CUSTOMER_SEGMENT_VIEW]` |
| `users/customer/account-access-list/view/:id` | 258-260 | `ViewAccessAccount` | `[USER_VIEW]` |
| `users/affiliate-partner/create` | 262-270 | `CreateaffiliatePartner` (sic, lowercase "a") | `[ASSOCIATED_PARTNER_CREATE]` |
| `users/affiliate-partner/edit/:id` | 272-276 | `EditaffiliatePartner` (sic) | `[ASSOCIATED_PARTNER_EDIT]` |
| `users/affiliate-partner/view/:id` | 278-282 | `ViewaffiliatePartner` (sic) | `[ASSOCIATED_PARTNER_VIEW]` |

`users/customer/*` paths appear in both files; these are not duplicates — `main.routes.tsx` owns the list/landing pages and `form.routes.tsx` owns the create/edit/view sub-paths, matching the repository-wide split-by-layout structure (`.claude/rules/06-routing-permission.md`).

**Menu (`src/helpers/menus.helper.ts`, CONFIRMED):**

- Operator group (`key: 'users'`, lines 40-44, links to `ofUsersOperatorList()`): `Menu.usersOperatorList` → `ofUsersOperatorList()`, `[STAFF_VIEW]` (53-57); `Menu.groupPermission` → `ofUsersOperatorPermission()`, `[ROLE_VIEW]` (59-63).
- Customer group (`key: 'customer'`, lines 67-70): `Menu.listCustomer` → `ofUsersCustomerList()`, `[CUSTOMER_VIEW]` (73-77); `Menu.accountAccessList` → `ofAccountAccessList()`, `[USER_VIEW]` (79-83); `Menu.accountUnlockRequestList` → `ofAccountUnlockRequest()`, `[USER_VIEW]` (85-89 — mismatched against the route's `UNLOCK_REQUEST_VIEW`, see §0/§13); `Menu.segmentationCustomer` → `ofUsersCustomerSegmentation()`, `[CUSTOMER_SEGMENT_VIEW]` (91-95).
- Distributor menu item is **commented out** in full (lines 98-102).
- Affiliate partner: `ofUsersAffiliatePartner()`, `[ASSOCIATED_PARTNER_VIEW]` (104-108).

`PageURLs` builders live in the `// user` block of `src/utils/navigate.ts:12-44`: `ofUsersOperatorList`, `ofUsersOperatorPermission`, `ofUsersCustomerList`, `ofAccountAccessList`, `ofUsersCustomerSegmentation`, `ofAccountUnlockRequest`, `ofUsersDistributor`, `ofUsersAffiliatePartner` — one builder per top-level landing path; create/edit/view sub-paths are not given their own builders and are navigated with hardcoded literals inside the relevant middlewares/components (§5.2, §6).

## 3. Directory map

`find src/modules/users -type f | sort` → 91 files.

```text
src/modules/users/
|-- distributor.user.tsx                      # placeholder, 3 lines, no permission array (§12)
|-- affiliate-partner/                        # 10 files
|   |-- affiliate-partner.user.tsx            # list page
|   |-- components/addon-product-form.tsx     # add-on product form fragment (imports products add-on options)
|   |-- create/{create-affiliate.tsx,form.tsx}
|   |-- edit/{edit-affiliate.tsx,form.tsx}
|   |-- options/fee.ts                        # fee/distribution options
|   `-- view/{form.tsx,history.tsx,view-affilliate.tsx}   # "affilliate" filename typo
|-- customer/                                 # 54 files
|   |-- access-account/                       # 7 files — account-access list/detail
|   |   |-- account-access-list.customer.tsx
|   |   |-- constants.ts, utils.ts
|   |   `-- view/{form.tsx,general.tsx,history.tsx,login-sessions.tsx}
|   |-- list-customer/                        # 9 files — customer list/detail, incl. C06 display
|   |   |-- list.customer.tsx
|   |   |-- constants.ts, utils.ts, options/customer.ts
|   |   `-- view/{form.tsx,application.tsx,history.tsx,identification.tsx,other.tsx}
|   |-- segmentation/                         # 34 files — see SEGMENTATION.md
|   `-- unlock-request/                       # 4 files
|       |-- list.tsx, constants.ts
|       `-- component/{form-reasonRejected.tsx,unlock-request-searcher.form.tsx}
`-- operator/                                 # 26 files
    |-- group-permission/                     # 12 files — role/group permission CRUD
    |   |-- permission.operator.tsx, utils.ts, options/permission.ts
    |   |-- components/{addon-product-form.tsx,permission-table.tsx}
    |   |-- create/{create-group-permission.tsx,form.tsx}
    |   |-- edit/{edit-group-permission.tsx,form.tsx}
    |   `-- view/{form.tsx,history.tsx,view-group-permission.tsx}
    `-- user-operator-list/                   # 14 files — staff/operator CRUD
        |-- list.operator.tsx, constants.ts, utils.ts, options/userOperator.ts
        |-- components/{addon-product-form.tsx,permission-table.tsx,upload-user-operator.tsx}
        |-- create/{create-user-operator.tsx,form.tsx}
        |-- edit/{edit-user-operator.tsx,form.tsx}
        `-- view/{form.tsx,history.tsx,view-user-operator.tsx}
```

No `types/` directory and no `*.d.ts` file exist anywhere under `src/modules/users/` (`find src/modules/users -name "*.d.ts" -o -type d -name types` — no match; see §8). `affiliate-partner/components/addon-product-form.tsx`, `operator/group-permission/components/addon-product-form.tsx`, and `operator/user-operator-list/components/addon-product-form.tsx` share a basename across three locations; not diffed in this pass.

## 4. Main runtime flows

### 4a. Customer list, search, and detail

`customer/list-customer/list.customer.tsx` (399 lines) is the list page, routed at `users/customer/list` (`CUSTOMER_VIEW`). `customer/list-customer/view/form.tsx` is the detail page (route `users/customer/list/view/:id`, `CUSTOMER_VIEW`): on mount it dispatches `getCustomerDetail(id)` (`form.tsx:64-68`), reads `watchCustomerDetail`/`watchCustomerLoading`, and calls `resetCustomerDetail()` on unmount. `getCustomerDetail` (`src/redux/slices/customer.slice.ts:~55-70`) issues `apiFetcher.get('api/admin/portal/v1/customer/${id}')`; its `pending`/`fulfilled` reducers write the slice's one shared `loading` boolean, along with every other thunk in the slice (§5.3, §13). The shared search form `src/components/forms/search/list-customer-searcher.form.tsx` imports `customerTypeOptions` from this module's `list-customer/options/customer` (a reverse dependency, §10).

### 4b. Operator/staff management

List page `operator/user-operator-list/list.operator.tsx` (527 lines), route `users/operator/list` (`STAFF_VIEW`); create/edit/view forms under the same folder use `STAFF_CREATE`/`STAFF_EDIT`/`STAFF_VIEW`. `src/redux/slices/staff.slice.ts` owns 11 thunks against `api/admin/portal/v1/staff*` (list, status, batch-status, detail, import, audit, export-csv, import-template, import-confirm — full endpoint list in §6). `operator/user-operator-list/components/upload-user-operator.tsx` calls `apiFetcher.post('.../staff/import')` (line 51) and `apiFetcher.put('.../staff/import/${idStaffList}')` (line 61) directly, bypassing the slice. `staff.middleware.ts` has 13+ `startListening` blocks that dispatch toasts and navigate back to `ofUsersOperatorList()` (lines 150, 178, 241).

### 4c. Affiliate-partner CRUD

List page `affiliate-partner/affiliate-partner.user.tsx`, route `users/affiliate-partner` (`ASSOCIATED_PARTNER_VIEW`); create/edit/view use `ASSOCIATED_PARTNER_{CREATE,EDIT,VIEW}`. `src/redux/slices/affiliate-partner.slice.ts` owns 6 thunks against `api/admin/portal/v1/associated-partner*`. `affiliate-partner.middleware.ts` navigates to `ofUsersAffiliatePartner()` and the view URL (lines 103, 129).

### 4d. C06 customer-identification-result display

`customer/list-customer/view/identification.tsx` (224 lines) renders the row `label='Kết quả Bộ công an (C06)'` (lines 126-128) using a local `getC06Status`/`c06StatusInfo` mapping (lines 17-32) that normalizes `status` into `VERIFIED`/`FAILED`/`UNKNOWN`/`UNVERIFIED`. It receives its data as a prop (`data: CustomerDetail`), rendered from `view/form.tsx:34` as `<Identification data={detail!} />`, where `detail` is `watchCustomerDetail` from `customer.slice` (§4a) — a non-null assertion on a value that can be loading (§13). The field's type is `CustomerCheckResult` (`src/types/customer.d.ts:91`, referenced from `CustomerDetail.c06Result` at line 20) — an ambient global, not imported by name anywhere in this module. A structurally identical but separately declared type, `C06CheckResult` (`src/types/loan-order.d.ts:32`), serves the same concept for the Order module's own, independent C06 display (`src/modules/order/loan-order-list/view/identification.tsx:39,294`); the two modules do not share a component or type for this (§0, §13). No `c06` reference exists anywhere in `src/redux/**` or `src/services/**` — the field passes through the `customersDetail` payload unmapped.

### 4e. Customer segmentation

Covered in full in [`SEGMENTATION.md`](SEGMENTATION.md): the list/create/edit/view flow, its 14-thunk Redux slice, its upload/import sub-flows, and its confirmed cross-module consumption by `src/modules/products/**` (13 files).

## 5. State ownership

Zero TanStack Query usage anywhere in this module (`grep -rl "@tanstack/react-query" src/modules/users/` — no match, CONFIRMED). Every server resource below is Redux-owned.

### 5.1 Redux slices (all registered; `access-account.middleware.ts` registration — flagged `NEEDS-VERIFICATION` by the prior inventory report — is now CONFIRMED registered)

| Owner | Slice file | Registered name (`src/redux/slices.ts`) | Middleware file | Registered name (`src/redux/store.ts`) |
| --- | --- | --- | --- | --- |
| customer detail/list | `src/redux/slices/customer.slice.ts` | `customerSlice` | `src/redux/middlewares/customer.middleware.ts` | `configureCustomerMiddleware` |
| account access | `src/redux/slices/account-access.slice.ts` | `accountAccessSlice` | `src/redux/middlewares/access-account.middleware.ts` | `configureAccountAccessMiddleware` |
| segmentation (see `SEGMENTATION.md`) | `src/redux/slices/segmentation-customer.slice.ts` | `segmentationCustomerSlice` | `src/redux/middlewares/segmentation-customer.middleware.ts` | `configureSegmentationCustomerMiddleware` |
| unlock request | `src/redux/slices/unlock-request-customer.slice.ts` | `unlockRequestCustomerSlice` | `src/redux/middlewares/unlock-request-customer.middleware.ts` | `configureUnlockRequestCustomerMiddleware` |
| staff/operator | `src/redux/slices/staff.slice.ts` | `staffSlice` | `src/redux/middlewares/staff.middleware.ts` | `configureStaffMiddleware` |
| role/group permission | `src/redux/slices/group-permission.slice.ts` | `groupPermissionSlice` | `src/redux/middlewares/group-permisson.middleware.ts` (sic, missing "i") | `configureGroupPermissionMiddleware` |
| affiliate partner | `src/redux/slices/affiliate-partner.slice.ts` | `affiliatePartnerSlice` | `src/redux/middlewares/affiliate-partner.middleware.ts` | `configureAffiliatePartnerMiddleware` |

Each is a one-feature-owner Redux slice, consistent with `.claude/ARCHITECTURE.md` §6; per `.claude/rules/04-state-management.md` `## Server state ownership (adopted 2026-11-04)`, every one of these is now explicitly `LEGACY-COMPATIBILITY` as an existing Redux-owned server resource, migrated opportunistically one resource per dedicated PR via `/extract-thunk-service` rather than in bulk — this document records current state, not a migration plan for this task.

Shared (non-users) state read by users code: `src/redux/slices/common.slice.ts` (ten files: four `customer/**` files, eight `operator/user-operator-list/**` files), `src/redux/slices/notification.slice.ts` (`setNotification`, used by every users middleware for toasts), and `src/redux/slices/layout.slice.ts` (`setHiddenFormFooter`, `customer/list-customer/view/form.tsx:57-59`).

### 5.2 Listener middleware

Every users middleware is a `createListenerMiddleware()` instance with multiple `startListening` blocks dispatching `setNotification` and, in several cases, navigating via `PageURLs`. Approximate block counts (grep): customer 8, access-account 8, staff 13+, group-permission 8, affiliate-partner 7, unlock-request 3+ (segmentation's 24 blocks are covered in `SEGMENTATION.md`). Navigation calls: `staff.middleware.ts:150,178,241`; `group-permisson.middleware.ts:112,140`; `affiliate-partner.middleware.ts:103,129`. `access-account` and `unlock-request` middlewares do not navigate.

### 5.3 Loading flags

Each slice keeps one shared `loading` boolean across all of its thunks — the "one broad loading flag" risk pattern named in `.claude/ARCHITECTURE.md` §3. Thunk counts per slice (`grep -c "createAsyncThunk"`): customer 8, staff 11, account-access 6, group-permission 7, affiliate-partner 6, unlock-request-customer 2 (segmentation-customer 14, in `SEGMENTATION.md`). Per-thunk interaction was only traced in full for `getCustomerDetail` (§4a); the rest were counted, not individually read.

### 5.4 Form and local state

`Form.useForm` (AntD): 31 call lines across 25 files (customer 19, operator 7, affiliate 5). `FormReason.useForm`: 5 lines. List pages hold filter/sort/page state through `useAppSelector`/`useAppDispatch` local component state, not URL state (unlike, e.g., `notifications/list.tsx`'s `useQueryState()` — not verified for every list page in this module).

## 6. API boundaries

### 6.1 Direct `apiFetcher` calls inside the module (bypass the slice layer)

| File | Line | Method | Endpoint |
| --- | --- | --- | --- |
| `operator/user-operator-list/components/upload-user-operator.tsx` | 51 | POST | `api/admin/portal/v1/staff/import` |
| same | 61 | PUT | `api/admin/portal/v1/staff/import/${idStaffList}` |
| `operator/user-operator-list/utils.ts` | 128 | GET | `api/admin/portal/v1/role/${id}` |

(Segmentation's own direct calls — `upload-info.tsx`, `upload-picture.tsx` — are covered in `SEGMENTATION.md`.) These three sites are existing legacy facts, not a new finding against `.claude/rules/03-api-service.md` `## Endpoint ownership`, which this document records without resolving.

### 6.2 Slice-thunk endpoints (outside the module directory, owned by the users slices)

- **`customer.slice.ts`**: GET `customer` (34); GET `customer/${id}` (58-59); POST `customer/export-csv` (80-81); GET `customer/${id}/additional-info` (124-125); GET `customer/${params?.id}/device` (149-150); GET `customer/${id}/contact/history` (176-177); GET `customer/${params?.id}/application` (198-199); GET `customer/${params?.id}/audit` (225-226). 8 thunks; one further commented-out device call at 146-147.
- **`staff.slice.ts`**: GET `staff` (31); PUT `staff/${data.id}/status` (54-55); PUT `staff/${data.status}/batch` (81-82); GET `staff/${id}` (111-112); GET `staff/import/${params.id}` (132); GET `staff/${params?.id}/audit` (155-156); POST `staff` (181); PUT `staff/${data.id}` (197-198); POST `staff/export-csv` (218-219); GET `staff/import/template` (246-247); POST `staff/import/${params.id}/confirm` (266-267). 11 thunks.
- **`account-access.slice.ts`**: GET `user` (34); GET `user/${id}` (57); GET `user/${params?.id}/audit` (79-80); GET `user/${params?.id}/sessions` (105-106); PUT `user/${data.id}/status` (142-143); PUT `user/${data.status}/batch` (170-171). 6 thunks.
- **`group-permission.slice.ts`**: GET `role` (27); GET `role/${id}` (51); GET `role/${params?.id}/audit` (71-72); GET `permission` (97); PUT `role/${data.id}/status` (116-117); POST `role` (139); PUT `role/${data.id}` (161-162). 7 thunks.
- **`affiliate-partner.slice.ts`**: GET `associated-partner` (28); GET `associated-partner/company` (52); GET `associated-partner/${id}` (72-73); PUT `associated-partner/${data.id}/status` (94-95); POST `associated-partner` (120); PUT `associated-partner/${data.id}` (142-143). 6 thunks.
- **`unlock-request-customer.slice.ts`**: GET `unlock-requests` (30-31); PUT `unlock-requests/${data.id}` (66-67). 2 thunks.

(Segmentation's 13-thunk `customer-segment*` endpoint set is in `SEGMENTATION.md`.) Several `…/batch` endpoints take `status` as a path segment rather than `id` (`staff.slice.ts:82`, `account-access.slice.ts:170`) — backend intent is `NEEDS-VERIFICATION` (§0).

### 6.3 Migrated service: `src/services/users/customer-segment.service.ts` (68 lines)

Covers exactly one endpoint, `GET api/admin/portal/v1/customer-segment/select` (`getCustomerSegmentOptions`, with a runtime `parseCustomerSegmentSelectResponse` guard on the response). Its only consumers (via the root barrel `src/services/index.ts`) are `src/modules/system/splash-screen/hooks/useSplashScreenCustomerSegments.ts:3` and `src/modules/system/theme-management/background-main/hooks/useBackgroundMainCustomerSegments.hook.ts:5` — **no file inside `src/modules/users/` imports this service**, and neither `products` nor `affiliate-partner` imports it. Every other segmentation endpoint (CRUD, status, blacklist, determination import, audit, copy — 13 total) remains inside `segmentation-customer.slice.ts` (`SEGMENTATION.md`). Per `.claude/rules/03-api-service.md` `## Contracts and errors`, the typed-DTO-only slices with no Zod/runtime parsing are the default boundary assumption for stable CRUD, not a validation gap.

## 7. Forms and validation

- `Form.useForm` (AntD): 31 call lines, 25 files (§5.4). `FormLayout` (`@/layouts/form.layout`) is used in 14 files: `affiliate-partner/{create,edit,view}/form.tsx`, `customer/access-account/view/form.tsx`, `customer/list-customer/view/form.tsx`, `operator/group-permission/{create,edit,view}/form.tsx`, `operator/user-operator-list/{create,edit,view}/form.tsx` (segmentation's 3 `FormLayout` files are in `SEGMENTATION.md`).
- `FormRef` references: 62 lines across the module (customer 38 — mostly segmentation, see that document — operator 16, affiliate 8). `useFormImperativeHandle` (`@/hooks/form.hook`) is used at `customer/list-customer/view/identification.tsx:4`.
- AntD `rules={`: 77 occurrences across 19 files; this is the module's only validation mechanism. Zero Zod (`grep -rln "from 'zod'" src/modules/users/` — no match) and zero `react-hook-form` anywhere in the module. Per `.claude/rules/05-form.md`, this is the valid default for untouched legacy forms, not a deviation.

## 8. Types and DTO organization

No feature-local `types/` folder and no `*.d.ts` file exist anywhere under `src/modules/users/` (§3). Request/response and view shapes live entirely as ambient globals in `src/types/`: `customer.d.ts` (`CustomerDetail`, `CustomerCheckResult`), `staff.d.ts`, `access-account.d.ts`, `group-permission.d.ts`, `unlock-request-customer.d.ts`, `segmentation-customer.d.ts` (the last covered in `SEGMENTATION.md`). `src/types/unlock-request-customer.d.ts:5` imports from `@/modules/users/customer/unlock-request/constants` — an ambient global file depending on a module internal, the reverse of the target direction (§10, §13). The only typed service contract for this domain is `customer-segment.service.ts` (§6.3); every Redux thunk otherwise types its payload at the call site rather than through a shared DTO file.

## 9. Permissions

This module's permission scheme has at least **20** defined constants in `src/constants/permission.constant.ts`: `ROLE_{VIEW,CREATE,EDIT}` (lines 7-9), `USER_{VIEW,EDIT}` (12-13), `CUSTOMER_SEGMENT_{VIEW,CREATE,EDIT}` (16-18), `CUSTOMER_{VIEW,EDIT,EXPORT_CSV}` (21-23), `ASSOCIATED_PARTNER_{VIEW,CREATE,EDIT}` (26-28), `STAFF_{VIEW,EDIT,CREATE,EXPORT_CSV}` (31-34), `UNLOCK_REQUEST_{VIEW,EDIT}` (327-328). Two different counts were derived, and they disagree by one constant — explained, not left open:

- **Module-scoped grep** (`grep -rhoE "PERMISSIONS\.[A-Z_]+" src/modules/users/ | sort -u | wc -l`): **12** constants referenced inside the module directory — `ASSOCIATED_PARTNER_{CREATE,EDIT}`, `CUSTOMER_EXPORT_CSV`, `CUSTOMER_SEGMENT_{CREATE,EDIT}`, `ROLE_{CREATE,EDIT}`, `STAFF_{CREATE,EDIT,EXPORT_CSV}`, `UNLOCK_REQUEST_EDIT`, `USER_EDIT`.
- **Full scheme including routes/menu**: adds the seven `*_VIEW` constants enforced only outside the module directory (route/menu layer) — `STAFF_VIEW`, `ROLE_VIEW`, `CUSTOMER_VIEW`, `USER_VIEW`, `CUSTOMER_SEGMENT_VIEW`, `ASSOCIATED_PARTNER_VIEW`, `UNLOCK_REQUEST_VIEW` — for **19** total referenced constants.
- **The 20th defined constant, `CUSTOMER_EDIT`, is referenced nowhere** — not in the module, not in routes, not in menus (`grep -rn "CUSTOMER_EDIT" src/` matches only its own definition). This is a real unused constant, not a counting artifact.

This module references more than ten permission constants and reuses multi-permission groupings across layers in places (segmentation, staff), so per the template's table rule, permissions are tabulated once:

| Permission | Enforced at — route | Enforced at — menu | Enforced at — component |
| --- | --- | --- | --- |
| `STAFF_VIEW` | `main.routes.tsx:79`, `form.routes.tsx:205` | `menus.helper.ts:56` | — |
| `STAFF_CREATE` | `form.routes.tsx:201` | — | `list.operator.tsx:409,420(OR),425,461` |
| `STAFF_EDIT` | `form.routes.tsx:209` | — | `list.operator.tsx:470`; `view/form.tsx:133,134` |
| `STAFF_EXPORT_CSV` | — (no dedicated route) | — | `list.operator.tsx:420(OR),426` |
| `ROLE_VIEW` | `main.routes.tsx:83`, `form.routes.tsx:221` | `menus.helper.ts:62` | — |
| `ROLE_CREATE` | `form.routes.tsx:213` | — | `permission.operator.tsx:169,202` |
| `ROLE_EDIT` | `form.routes.tsx:217` | — | `view/form.tsx:132,133` |
| `CUSTOMER_VIEW` | `main.routes.tsx:87`, `form.routes.tsx:225` | `menus.helper.ts:76` | — |
| `CUSTOMER_EXPORT_CSV` | — | — | `list.customer.tsx:294` |
| `CUSTOMER_EDIT` | — | — | — (defined, unreferenced anywhere) |
| `USER_VIEW` | `main.routes.tsx:97`, `form.routes.tsx:259` | `menus.helper.ts:82`, `:88` (unlock-request menu entry — mismatched, see §13) | — |
| `USER_EDIT` | — | — | `account-access-list.customer.tsx:318`; `view/form.tsx:159` |
| `UNLOCK_REQUEST_VIEW` | `main.routes.tsx:92` | — (menu uses `USER_VIEW` instead, §13) | — |
| `UNLOCK_REQUEST_EDIT` | — | — | `unlock-request/list.tsx:97,312` |
| `ASSOCIATED_PARTNER_VIEW` | `main.routes.tsx:112`, `form.routes.tsx:280` | `menus.helper.ts:108` | — |
| `ASSOCIATED_PARTNER_CREATE` | `form.routes.tsx:267` | — | `affiliate-partner.user.tsx:176,210` |
| `ASSOCIATED_PARTNER_EDIT` | `form.routes.tsx:274` | — | `view/form.tsx:128,129` |
| `CUSTOMER_SEGMENT_VIEW` | `main.routes.tsx:102`, `form.routes.tsx:253` | `menus.helper.ts:94` | `BackgroundMainForm/index.tsx:384`, `BackgroundMainViewPage/index.tsx:132` (system module, outside users — see `SEGMENTATION.md`) |
| `CUSTOMER_SEGMENT_CREATE` | `form.routes.tsx:233` | — | `segmentation.customer.tsx:372,407,416(OR),424` (see `SEGMENTATION.md`) |
| `CUSTOMER_SEGMENT_EDIT` | `form.routes.tsx:243` | — | `segmentation.customer.tsx:416(OR),422`; `view/form.tsx:166,167` (see `SEGMENTATION.md`) |

All component-level checks use `hasPermission(permissions, mode = "some")` (`@/hooks/auth.hook:27-36`), whose default mode is OR; no users call site passes `mode: "every"`. Two call sites pass a genuine multi-element OR array (`segmentation.customer.tsx:416`; `list.operator.tsx:420`); every other component check reads a single permission. `operator/user-operator-list/utils.ts:30-36` resolves visibility through a local `permissionActionIds.some(...)` helper rather than `hasPermission` directly — its caller's input was not traced to its origin.

`users/distributor` (§2, §12) is the one route in this module with no permission array at all.

## 10. Shared and cross-domain dependencies

**Imported by this module, from outside:** the shared component library (`src/components/**`: `modal-content`, `forms/form-wrapper`, `titles/form.title`, `pagination`, `no-data`, `button`, `select`, `input`, `table-date-time`, `forms/form-section`, `table-wrapper`, `table-card-status`, `icons`, `switch`, `safeHtml`, `forms/form-reasonDisabled`, `text-editor`, `table-link`, `table-summary`, `table-section`, `detail-row`, and six `forms/search/*` searchers — ordinary shared-UI reuse); `src/layouts/form.layout` (14 files); `src/hooks/auth.hook`, `src/hooks/form.hook`, `src/redux/hooks`; `src/utils/navigate`, `src/utils/common`; `src/constants/permission.constant`. Two confirmed cross-module imports into other business modules: `@/modules/products/add-on/options/fee` (`distributionOptions`, used by `affiliate-partner/{create,edit,view}`) and `@/modules/products/configuration/industry-product/ultis` (`convertFieldActionType`, used by four `view/history.tsx` files across `affiliate-partner`, `customer/segmentation`, `operator/group-permission`, `operator/user-operator-list`). No other `src/modules/{products,system,contents,order,notifications,blacklist,transactions}` import was found from inside `src/modules/users/` outside segmentation (`SEGMENTATION.md` has its own cross-domain section).

**Imported into shared/other-module code from inside this module** (`grep -rn "modules/users" src --include=*.ts --include=*.tsx | grep -v "^src/modules/users/"`, outside `src/routes/pages.tsx`'s lazy targets):

- `src/components/forms/search/list-customer-searcher.form.tsx:6` (`customerTypeOptions`), `list-operator-searcher.form.tsx:7` and `permission-searcher.form.tsx:6` (`staffTypeOptions`) — shared search components depending on module-internal option lists, the discouraged direction named in `.claude/ARCHITECTURE.md` §5.
- `src/components/modal-content.tsx:10` (`convertFieldType` from `customer/list-customer/utils`) — same discouraged direction.
- `src/types/unlock-request-customer.d.ts:5` — an ambient global importing a module internal (§8).
- `src/modules/products/**` (13 files) import segmentation options/utils — covered in `SEGMENTATION.md`'s §10, which also lists `src/components/forms/search/segmentation-customer-searcher.form.tsx`.

These are existing, real dependencies; `.claude/ARCHITECTURE.md` §16 treats them as `LEGACY-COMPATIBILITY` while untouched, not a defect to fix incidentally.

## 11. Consumers

- Routes and menu (§2) and the shared search forms / `modal-content.tsx` (§10) are this module's direct consumers outside `src/modules/users/`.
- `src/modules/products/**` (13 files) consumes `customer/segmentation/**` only — no other users submodule has a confirmed products-side consumer (`SEGMENTATION.md` §10-11).
- `distributor.user.tsx` has no consumer beyond its own lazy route export (§12).
- `src/services/users/customer-segment.service.ts` is consumed only by `system/splash-screen` and `system/theme-management/background-main` (§6.3), not by any file inside `src/modules/users/` itself.

## 12. Pattern classification

**Legacy-compatible overall**, per `.claude/ARCHITECTURE.md` and the 2026-11-04 server-state-ownership update in `CLAUDE.md`/`.claude/rules/04-state-management.md`:

- State: seven centralized Redux slices, each with one broad `loading` flag shared across all of its thunks (§5.3) — the risk pattern named in `.claude/ARCHITECTURE.md` §3, and now explicitly `LEGACY-COMPATIBILITY` server-state ownership pending opportunistic one-resource-per-PR migration, not a defect in this document's sense.
- Server data: 0 TanStack Query usage anywhere in the module (§5) — fully Redux-owned.
- Services: exactly one migrated endpoint (`customer-segment.service.ts`, §6.3), consumed only outside the module; everything else is inside slice thunks or direct component `apiFetcher` calls (§6.1), both `LEGACY-COMPATIBILITY`.
- Forms: AntD `Form`/`FormInstance` + `FormLayout`/`FormRef`, no Zod — matches the repository-wide default for untouched legacy forms (`.claude/rules/05-form.md`), not a deviation.
- Types: ambient global DTOs, no feature-local `types/` — matches the broad repository legacy pattern, not specific to this module.

Nothing above is presented as a defect; per `.claude/ARCHITECTURE.md` §16 these are supported integration contracts while untouched.

## 13. Technical risks

Ordered by decreasing consequence; concrete, source-observed:

1. **Permission-less route.** `users/distributor` (`main.routes.tsx:106-108`) carries no `permissions` array on its `WithGuard`, so any authenticated user who knows the URL can reach it — the component itself is only placeholder text today (§12), but the route-guard gap is a routing-architecture fact independent of current content. Whether `WithGuard`/`AuthGuard` imposes an implicit permission requirement when `permissions` is omitted was not verified (`src/guards/index.tsx` not read in this pass).
2. **Menu/route permission mismatch on unlock-request.** The menu entry (`menus.helper.ts:85-89`) gates on `USER_VIEW`; the route (`main.routes.tsx:90-94`) gates on `UNLOCK_REQUEST_VIEW`. A user with one but not the other either sees a menu item that 403s, or can reach the route with no visible menu entry. `NEEDS-TEAM-DECISION`.
3. **Shared components and an ambient type importing module internals.** `src/components/modal-content.tsx:10`, three `src/components/forms/search/*.form.tsx` files, and `src/types/unlock-request-customer.d.ts:5` all import directly from inside `src/modules/users/**` — the reverse of the target dependency direction in `.claude/ARCHITECTURE.md` §5. Changing or removing any of the five imported symbols (`convertFieldType`, `customerTypeOptions`, `staffTypeOptions` ×2, the unlock-request constants) breaks a consumer outside this module's own screens.
4. **One shared `loading` flag per slice, across 2-14 thunks each** (§5.3). Two concurrent requests on the same screen (e.g. a detail fetch and an audit-history fetch) can race on the same boolean, producing a loading indicator that clears before all relevant data has arrived. Not exercised at runtime.
5. **Duplicate ambient types for the same C06 concept**, independently declared and consumed by two different modules (`CustomerCheckResult` in `customer.d.ts:91` for `users`; `C06CheckResult` in `loan-order.d.ts:32` for `order`) — §4d. A future shape change to one is not guaranteed to propagate to the other.
6. **Non-null assertion on data still loading.** `customer/list-customer/view/form.tsx:34` passes `data={detail!}` into `Identification`, whose `data.c06Result` is read as optional — the assertion papers over the loading state that the same file otherwise tracks (§4d).
7. **Service-layer split for one resource family.** `customer-segment.service.ts` covers exactly one of segmentation's ~13 endpoints (§6.3); the rest remain in the Redux slice. Two different in-repo paths reach the same resource family, with no file inside `src/modules/users/` using the migrated one at all.
8. **Direct component `apiFetcher` calls bypassing the slice/service layer** (`upload-user-operator.tsx:51,61`; `operator/user-operator-list/utils.ts:128`) — §6.1.
9. **Misspelled identifiers across several files**, recorded as facts, not flagged for renaming: `view/view-affilliate.tsx` (double "l"), `middlewares/group-permisson.middleware.ts` (missing "i"), `CreateaffiliatePartner`/`EditaffiliatePartner`/`ViewaffiliatePartner` (lowercase "a"), `components/form/action-hitstory-form.tsx` ("hitstory") inside segmentation.
10. **One unused permission constant.** `PERMISSIONS.CUSTOMER_EDIT` (`permission.constant.ts:22`) is defined but referenced nowhere in the repository (§9).

## 14. Areas to avoid touching

- Any of the seven users Redux slices' shared `loading` field without accounting for every thunk and every consuming screen (risk 4).
- `src/components/modal-content.tsx`'s `convertFieldType` import, the three `forms/search/*.form.tsx` option imports, and `src/types/unlock-request-customer.d.ts`'s constants import — each has a confirmed outside-module consumer; do not change the exported symbol's shape or location without auditing those files too (risk 3).
- `users/distributor`'s route guard and `distributor.user.tsx` itself — do not assume the missing permission array or the commented-out menu entry (`menus.helper.ts:98-102`) can be "cleaned up" as part of an unrelated change without separately confirming intent (risks 1, §12).
- The menu/route permission pair for unlock-request (`USER_VIEW` vs. `UNLOCK_REQUEST_VIEW`) — do not silently pick one when touching either file; this is `NEEDS-TEAM-DECISION` (risk 2).
- `src/types/customer.d.ts`'s `CustomerCheckResult`/`CustomerDetail.c06Result` shape — it is read by `identification.tsx` with a non-null-asserted parent value; changing its optionality or shape affects that display path (risks 5, 6).

## 15. Open questions

- `NEEDS-TEAM-DECISION`: is the unlock-request menu/route permission mismatch (`USER_VIEW` vs. `UNLOCK_REQUEST_VIEW`) intentional? Not resolved here.
- `NEEDS-TEAM-DECISION`: should `CustomerCheckResult` (`users`/`customer.d.ts`) and `C06CheckResult` (`order`/`loan-order.d.ts`) be consolidated into one shared type? Not resolved here.
- `NEEDS-VERIFICATION`: whether `users/distributor`'s missing permission array is an intentional "soft launch" state (menu already commented out) or an oversight. Dead/commented code is recorded here per content rule 10; this is the one entry it produces for this module, since the only other commented code found (a device-history call in `customer.slice.ts:146-147`) is a routine disabled call site, not a route/menu-visible behavior change.
- `NEEDS-VERIFICATION`: whether `operator/user-operator-list/utils.ts:30-36`'s `permissionActionIds.some(...)` helper receives its input from a place that already applies `hasPermission`, or independently re-derives visibility — its caller was not traced to origin in this pass.
- `NEEDS-VERIFICATION`: backend semantics of `…/batch` endpoints keyed by `status` rather than `id` (`staff.slice.ts:82`, `account-access.slice.ts:170`; segmentation's equivalent is in `SEGMENTATION.md`).
