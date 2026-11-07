# Users — Customer Segmentation — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this submodule changes.
> Split out from [`OVERVIEW.md`](OVERVIEW.md) (see that document's §0 for the split justification): `src/modules/users/customer/segmentation/` is the single largest sub-area of `users/` (34 of 91 files), the only part of `users/` with a confirmed cross-module consumer (`src/modules/products/**`), and owns the module's heaviest Redux slice.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq`. Method: static source inspection only. No runtime, browser, auth, or backend verification was performed.
- Scope: `src/modules/users/customer/segmentation/` (34 files, `find src/modules/users/customer/segmentation -type f | wc -l`), plus the parts of `src/routes/`, `src/redux/`, `src/helpers/menus.helper.ts`, and `src/modules/products/**`/`src/components/**` that consume it.
- Remaining verification gaps, ranked by consequence:
  1. **Backend semantics of `customer-segment/${data.status}/batch`** (`segmentation-customer.slice.ts:252`) — a `status`-keyed batch path, not settleable from frontend code.
  2. **Complete consumer set for segmentation utilities beyond static imports.** §10/§11 below enumerate every `import` statement found by grep; dynamic `import()` with constructed paths would not be found this way.
  3. **Per-thunk loading-state interaction across the slice's 14 thunks and 48 `loading` references** — only counted, not individually traced for race conditions.
  4. **Whether `CUSTOMER_SEGMENT_VIEW` usage inside `src/modules/system/theme-management/background-main/**`** (§9) reads the same segmentation data this submodule manages, or an independently-fetched copy — not traced beyond the permission check itself.
  5. **Full validation-rule enumeration** for the segmentation create/edit condition forms (`create/condition/*`, `edit/condition/*`) — AntD `rules={}` usage was counted module-wide in `OVERVIEW.md` §7, not broken out per segmentation file in this pass.

## 1. Responsibility

This submodule authors and manages **customer segments** — reusable rule sets (criteria, blacklist conditions, determination sets) used to target customers for business logic elsewhere in the application. It is reached at `users/customer/segmentation` (list) and its create/edit/view sub-routes. Its options and utilities are imported directly by `src/modules/products/**` to drive customer-segment-based business rules inside product configuration forms — this is the module's one confirmed, file-level cross-domain dependency (§10).

## 2. Entry points and routes

| Path | Route file : line | Guard permission | `pages.tsx` lazy export → import target |
| --- | --- | --- | --- |
| `users/customer/segmentation` | `main.routes.tsx:100-103` | `[CUSTOMER_SEGMENT_VIEW]` | `SegmentationCustomer` → `customer/segmentation/segmentation.customer` |
| `users/customer/segmentation/create` | `form.routes.tsx:228-235` | `[CUSTOMER_SEGMENT_CREATE]` | `CreateSegmentationCustomer` → `segmentation/create/form` |
| `users/customer/segmentation/edit/:id` | `form.routes.tsx:238-245` | `[CUSTOMER_SEGMENT_EDIT]` | `EditSegmentationCustomer` → `segmentation/edit/form` |
| `users/customer/segmentation/view/:id` | `form.routes.tsx:248-255` | `[CUSTOMER_SEGMENT_VIEW]` | `ViewSegmentationCustomer` → `segmentation/view/form` |

All four routes are `<WithGuard Page={…} Guard={AuthGuard} permissions={[…]} />` with a single-element permission array; OR semantics appear only at the component level (§9). `PageURLs.ofUsersCustomerSegmentation()` (`src/utils/navigate.ts:30-32`) is the only builder for this submodule's landing page; create/edit/view sub-paths are navigated with literals inside `segmentation-customer.middleware.ts`.

**Menu:** `Menu.segmentationCustomer` → `ofUsersCustomerSegmentation()`, `[CUSTOMER_SEGMENT_VIEW]` (`src/helpers/menus.helper.ts:91-95`), inside the Customer menu group documented in `OVERVIEW.md` §2.

## 3. Directory map

`find src/modules/users/customer/segmentation -type f | sort` → 34 files.

```text
src/modules/users/customer/segmentation/
|-- segmentation.customer.tsx            # list page: search/sort/paginate, create-type picker, copy action
|-- utils.ts                             # shared segmentation helpers (consumed by products, §10)
|-- options/segmentation.ts              # option lists (consumed by products, §10)
|-- components/                          # 15 files
|   |-- component-column-action-history.tsx, input-info-criteria.tsx, input-operator.tsx
|   |-- form/        # 5: action-hitstory-form (sic), add-picture-form, group-info-form, info-customer-form, search-picture-form
|   |-- table/       # 4: action-history-table, criteria-info-table, determine-table, preview-segmentation-table
|   `-- upload/      # 3: search-picture, upload-info, upload-picture
|-- create/                              # 4 files
|   |-- create-segmentation.tsx, form.tsx
|   `-- condition/{condition-criteria.tsx,condition-defined.tsx}
|-- edit/                                # 6 files
|   |-- edit-segmentation.tsx, form.tsx, utils.ts   # cleanObject, consumed by products (§10)
|   `-- condition/{condition-blacklist.tsx,condition-criteria.tsx,condition-defined.tsx}
`-- view/                                # 6 files
    |-- view-segmentation.tsx, form.tsx, history.tsx
    `-- condition/{condition-blacklist.tsx,condition-criteria.tsx,condition-defined.tsx}
```

Count check: 1 (list) + 1 (utils) + 1 (options) + 15 (components) + 4 (create) + 6 (edit) + 6 (view) = 34.

## 4. Main runtime flows

### 4a. List, create, edit, view

`segmentation.customer.tsx` is the list/landing page; its create-type picker and copy action are both gated by `hasPermission` before opening a modal/navigating (§9). `create/form.tsx`, `edit/form.tsx`, and `view/form.tsx` each wrap a three-part condition flow (`condition-criteria`, `condition-defined`, and — for edit/view only — `condition-blacklist`) under `FormLayout`/`FormRef`. `edit/utils.ts` exports `cleanObject` (line 231, parameter typed `any`), consumed outside this submodule by two Products files (§10).

### 4b. Upload/import sub-flows

`components/upload/upload-info.tsx` calls `apiFetcher` directly (bypassing the slice) to import a determination set:

- POST `api/admin/portal/v1/customer-segment/determination-set/import` (lines 58, 74 — two branches)
- PUT `api/admin/portal/v1/customer-segment/determination-set/import/${idListDeterminationSet}` (line 90)

`components/upload/upload-picture.tsx:93` calls POST `api/admin/file/batch` directly — a generic file-upload endpoint also used elsewhere in the repository (not traced further here).

### 4c. History tab

`view/history.tsx` imports `convertFieldActionType` from `@/modules/products/configuration/industry-product/ultis.tsx:17` — the same cross-domain history utility that `operator/group-permission/view/history.tsx`, `operator/user-operator-list/view/history.tsx`, and `affiliate-partner/view/history.tsx` also import (`OVERVIEW.md` §10).

## 5. State ownership

Zero TanStack Query usage in this submodule (covered by the module-wide `grep -rl "@tanstack/react-query" src/modules/users/` in `OVERVIEW.md` §5, no match).

- **Slice:** `src/redux/slices/segmentation-customer.slice.ts`, registered as `segmentationCustomerSlice` in `src/redux/slices.ts`. It is the heaviest users slice: **14 async thunks** (`grep -c "createAsyncThunk"`) and **48 `loading` references** — roughly double any other users slice (`OVERVIEW.md` §5.3).
- **Middleware:** `src/redux/middlewares/segmentation-customer.middleware.ts`, registered as `configureSegmentationCustomerMiddleware` in `src/redux/store.ts`. It has the module's largest listener count — approximately 24 `startListening` blocks (lines 32-274) — and navigates via `PageURLs` at lines 67, 95, 123.
- Per `.claude/rules/04-state-management.md` `## Server state ownership (adopted 2026-11-04)`, this slice is `LEGACY-COMPATIBILITY` as an existing Redux-owned server resource; migrating it (via `/extract-thunk-service`, one resource per dedicated PR) is not undertaken in this document.
- Shared state read from outside: `src/redux/slices/common.slice.ts` is referenced by `create/condition/condition-criteria.tsx`, `edit/condition/condition-criteria.tsx`, and `view/condition/condition-criteria.tsx`.

## 6. API boundaries

### 6.1 Direct `apiFetcher` calls (bypass the slice)

| File | Line | Method | Endpoint |
| --- | --- | --- | --- |
| `components/upload/upload-info.tsx` | 58 | POST | `api/admin/portal/v1/customer-segment/determination-set/import` |
| same | 74 | POST | same (alternate branch) |
| same | 90 | PUT | `.../customer-segment/determination-set/import/${idListDeterminationSet}` |
| `components/upload/upload-picture.tsx` | 93 | POST | `api/admin/file/batch` |

### 6.2 Slice-thunk endpoints (`segmentation-customer.slice.ts`, 13 distinct endpoints across 14 thunks)

GET `customer-segment` (45-46); GET `customer-segment/${id}` (72-73); POST `customer-segment` (94-95); PUT `customer-segment/${data.id}` (120-121); DELETE `customer-segment/${data.customerSegmentId}/blacklist/image/${data.blacklistImageId}` (165-166); POST `customer-segment/${data.id}/blacklist/image` (199-200); PUT `customer-segment/${data.id}/status` (223-224); PUT `customer-segment/${data.status}/batch` (251-252 — `status`-keyed path, `NEEDS-VERIFICATION` per §0); GET `customer-segment/${params?.id}/audit` (281-282); POST `customer-segment/copy/batch` (308-309); POST `customer-segment/${data.id}/blacklist/search` (331-332); GET `customer-segment/determination-set/import/template` (359-360); GET `customer-segment/determination-set/import/${params?.id}` (394-395).

### 6.3 The migrated service does not belong to this flow

`src/services/users/customer-segment.service.ts` (described fully in `OVERVIEW.md` §6.3) covers only `GET customer-segment/select` — a lightweight options-search endpoint used exclusively by `system/splash-screen` and `system/theme-management/background-main`, not by this submodule's own CRUD flow. No file inside `src/modules/users/customer/segmentation/` imports it (the only occurrence of the string in `list.customer.tsx` — a different file, under `list-customer/`, not this submodule — is a comment, per `OVERVIEW.md` §6.3).

## 7. Forms and validation

Of the module-wide totals in `OVERVIEW.md` §7, segmentation accounts for the bulk of the `customer` share: `create/form.tsx`, `edit/form.tsx`, `view/form.tsx` all use `FormLayout`/`FormRef`; the `condition/*` files under each use AntD `Form` with `rules={}` validation (not individually enumerated in this pass — see §0 gap 5). Zero Zod, zero `react-hook-form`.

## 8. Types and DTO organization

No feature-local `types/` folder exists under this submodule (consistent with the rest of `users/`, `OVERVIEW.md` §8). The ambient global `src/types/segmentation-customer.d.ts` is the request/response contract source; it was not read in full in this pass. No typed service DTO exists for the 13-endpoint CRUD surface (§6.2) — only the single `customer-segment/select` endpoint has a typed service (§6.3).

## 9. Permissions

Covered in `OVERVIEW.md`'s single module-wide permissions table (§9); the segmentation-specific rows are `CUSTOMER_SEGMENT_{VIEW,CREATE,EDIT}`. Component-level detail specific to this submodule:

- `segmentation.customer.tsx:372,407` — single-permission `[CUSTOMER_SEGMENT_CREATE]` checks (list-page create button, copy-handler guard).
- `segmentation.customer.tsx:416` — **OR array**: `hasPermission([PERMISSIONS.CUSTOMER_SEGMENT_EDIT, PERMISSIONS.CUSTOMER_SEGMENT_CREATE])`.
- `segmentation.customer.tsx:422,424` — single-permission checks (`CUSTOMER_SEGMENT_EDIT` for an action label, `CUSTOMER_SEGMENT_CREATE` for the copy handler).
- `view/form.tsx:166,167` — single-permission `[CUSTOMER_SEGMENT_EDIT]` checks gating `hiddenUpdateBtn`, combined with an additional `isEditable` condition read in context (not a second permission).
- Outside this submodule, `CUSTOMER_SEGMENT_VIEW` also gates two files in `src/modules/system/theme-management/background-main/` (`BackgroundMainForm/index.tsx:384`, `BackgroundMainViewPage/index.tsx:132`) — unrelated to this submodule's own routes/components; whether that system-module code reads the same segmentation data this submodule manages is `NEEDS-VERIFICATION` (§0 gap 4).

## 10. Shared and cross-domain dependencies

**Consumed by `src/modules/products/**` (13 files, CONFIRMED by reading each import line, not inferred from any other module's documentation):**

- `src/modules/products/configuration/cash-loan/{create,edit,view}/rule.tsx` — `options/segmentation` (lines 60/62/63) and `getLoanOrderAndContractStatusOptions` from `segmentation/utils` (71/72/72).
- `src/modules/products/configuration/credit-card/{create,edit,view}/rule.tsx` — same two imports (62/73, 61/71, 60/69).
- `src/modules/products/configuration/credit-card/edit/card-info.tsx:58` and `.../view/card-info.tsx:14` — `cleanObject` from `segmentation/edit/utils`.
- `src/modules/products/configuration/group-list-product/{create,edit,view}/rule.tsx` — `options/segmentation` (20/30/27) and `segmentation/utils` (26/35/31).
- `src/modules/products/configuration/industry-product/{edit,view}/rule.tsx` — `options/segmentation` (41/24) and `segmentation/utils` (45/41).

**Other outside-module consumers:**

- `src/components/forms/search/segmentation-customer-searcher.form.tsx:10` — imports `options/segmentation`.

**Confirmed non-consumers:** `src/modules/users/affiliate-partner/**` does **not** import any segmentation utility or option (`grep` for `segmentation|customer-segment` scoped to `affiliate-partner/` returns no match) — contradicting any assumption, from this module's own prior documentation gaps or from another module's documentation, that affiliate-partner consumes segmentation data.

**This submodule's own outbound dependency:** `view/history.tsx:17` imports `convertFieldActionType` from `@/modules/products/configuration/industry-product/ultis.tsx` (§4c) — the reverse direction, products→segmentation and segmentation→products both exist, on different symbols.

## 11. Consumers

- `src/modules/products/**` (13 files, §10) — the only other business module that imports this submodule.
- `src/components/forms/search/segmentation-customer-searcher.form.tsx` (shared search UI).
- `src/routes/pages.tsx` (lazy route targets, §2).
- Menu (`OVERVIEW.md` §2).

## 12. Pattern classification

**Legacy-compatible**, consistent with `OVERVIEW.md` §12: Redux-owned (no TanStack Query), AntD `Form`/`FormInstance` + `FormLayout`/`FormRef` with no Zod, ambient global types, one direct-`apiFetcher` escape from the slice layer in the upload components (§6.1). Not presented as a defect while untouched (`.claude/ARCHITECTURE.md` §16).

## 13. Technical risks

1. **Heaviest single slice in the module — 14 thunks sharing one `loading` boolean, 48 references.** A race between any two of its 14 operations (e.g. a detail fetch and a blacklist-image search) can clear the flag early. Not exercised at runtime. See `OVERVIEW.md` §13 risk 4 for the module-wide pattern; this is its most severe instance.
2. **Direct `apiFetcher` calls from upload components** bypass both the slice and the service layer (`upload-info.tsx`, `upload-picture.tsx`, §6.1) — the same legacy pattern as `OVERVIEW.md` §13 risk 8, concentrated here across three of the four total module-wide occurrences outside `operator/`.
3. **`any`-typed parameter in a cross-module utility.** `edit/utils.ts:231` `cleanObject = (obj: any) => …` is imported by two Products files (§10) — a change to its implicit contract propagates silently across the module boundary.
4. **Service/slice split for one resource family**, as in `OVERVIEW.md` §13 risk 7: the one migrated service endpoint (`customer-segment/select`) is unused by this submodule's own CRUD flow, which still issues all 13 of its own endpoints directly from the slice.
5. **Misspelled file**: `components/form/action-hitstory-form.tsx` ("hitstory") — recorded as fact, not flagged for renaming.

## 14. Areas to avoid touching

- `segmentation-customer.slice.ts`'s shared `loading` field — any change must account for all 14 thunks and every tab/page that reads it (risk 1).
- `options/segmentation.ts`, `utils.ts` (top-level), and `edit/utils.ts`'s `cleanObject` — each has confirmed outside-module consumers in `src/modules/products/**` (§10); do not change their exported shape without auditing those five Products rule files and two card-info files too.
- `src/modules/products/configuration/industry-product/ultis.tsx`'s `convertFieldActionType` — this submodule is one of four users-module consumers (`OVERVIEW.md` §10); it is owned by Products, not this submodule.

## 15. Open questions

- `NEEDS-TEAM-DECISION` / `NEEDS-VERIFICATION`: none specific to this submodule beyond what `OVERVIEW.md` §15 already records for the module as a whole (the backend `…/batch` path semantics question applies here too, §0 gap 1).
- `NEEDS-VERIFICATION`: whether `src/modules/system/theme-management/background-main/**`'s use of `CUSTOMER_SEGMENT_VIEW` reads this submodule's own data or an independent copy (§0 gap 4, §9).
