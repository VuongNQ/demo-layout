# Redux Ownership Audit — Phase 1: `users` module

## 1. Scope, Branch & Revision

- Date: 2026-11-04
- Scope: deeper per-domain audit of Redux slices consumed by the `users` top-level module, per `.claude/skills/audit-redux-ownership/SKILL.md` Phase 1. Builds on Phase 0 (`docs/audits/state-management/2026-11-04/redux-ownership-inventory-phase0.md`), which only grep-counted middleware listeners; this phase reads full slice and middleware file bodies for the `users`-owned/dominant slices.
- Performer note: the investigation step (full-body reads of 7 slice files + 7 middleware files, plus consumer/form call-site searches) was delegated to the `codebase-analyzer` subagent via the Agent tool, per the skill's orchestration instruction. The Agent tool and that subagent type were both available in this environment; no fallback was needed. This report file was assembled from that agent's returned evidence. No `src/` file was read or modified in assembling this report beyond what the subagent already read.
- This phase does not classify migration viability (`QUERY-CANDIDATE` etc.) — that is Phase 2, gated on Phase 1 completion for the relevant modules.

## 2. Slices In Scope

**Primary deep-dive (users is sole or dominant consumer; full slice + full middleware body read):**

account-access, affiliate-partner, customer, group-permission, segmentation-customer, staff, unlock-request-customer.

**Lightly scoped (users is a minor consumer of a products/common/client-state-dominant slice; `initialState` classification only, full middleware read deferred to that slice's dominant module's Phase 1 run):**

address, fee-definition, product-addon, product-industry, product-list, required-information, common, notification, layout.

## 3. Primary Deep-Dive: Resource Kind, Middleware, Thunks, Forms, Cross-Module Sharing

### 3.1 `account-access`

- **Resource kind (CONFIRMED):** `server-cache` — `listAccountAccess`, `accountAccessDetail`, `listHistories`, `listLoginSessions`, `pagination`.
- **Middleware** (`src/redux/middlewares/access-account.middleware.ts`, 8 listeners): every listener only dispatches `setNotification`; no navigation, no `getState()`, no chained dispatch. `getAccountAccessDetail.rejected` is **also** listened to by `affiliate-partner.middleware.ts` — see §5 duplicate-notification finding.
- **Thunk orchestration:** no `getState()`, no multi-endpoint thunk body (CONFIRMED). Component-level orchestration: `src/modules/users/customer/access-account/view/form.tsx:79-89` dispatches `updateStatusAccountAccess` without awaiting it, then unconditionally dispatches `getAccountAccessDetail` — a race, not a thunk-level orchestration issue.
- **Correctness note:** `account-access.slice.ts:182-186` compares `item.id === String(action.payload.id)` against a `string[]` payload, so a multi-status batch update only matches a single-element array — likely a bug (`staff`/`segmentation-customer` use `.includes(...)` correctly for the equivalent reducer). NEEDS-VERIFICATION against actual batch-update call sites.
- **Forms:** `customer/access-account/view/form.tsx` uses `FormReason.useForm` (AntD-style wrapper); dispatches `updateStatusAccountAccess`, `getAccountAccessDetail`.
- **Cross-module sharing:** none outside `src/modules/users` (CONFIRMED).

### 3.2 `affiliate-partner`

- **Resource kind (CONFIRMED):** `server-cache` — `listAffiliatePartner`, `listAssociatedPartnerCompany`, `affiliatePartnerDetail`, `pagination`. Dead field `listProductAddOn` (no reducer, no selector) — `LIKELY` leftover from a copy-paste.
- **Middleware** (9 listeners): two navigations on success (`createAffiliatePartner.fulfilled` → `PageURLs.ofUsersAffiliatePartner()`; `updateAffiliatePartner.fulfilled` → `getViewUrl()`). **Defect (CONFIRMED):** `updateStatusAfiliatePartner.rejected` shows the `ENABLE_SUCCESS`/`DISABLE_SUCCESS` message constants on an error.
- **Thunk orchestration:** no `getState()`, no multi-endpoint body. `createAffiliatePartner`/`updateAffiliatePartner` wrap caught errors in `new Error(message)`, losing HTTP status/code/cause (CONFIRMED) — a `.claude/rules/03-api-service.md` "Contracts and errors" deviation (preserve useful error status/code/cause), pre-existing, out of scope for this audit to fix.
- **Correctness note:** `getListAssociatedPartnerCompany` sets `loading = true` in `pending` but never clears it in `fulfilled` or `rejected` (CONFIRMED stuck-loading bug); `loading` is shared and read by the affiliate pages.
- **Forms:** `create/create-affiliate.tsx` (`createAffiliatePartner`), `edit/edit-affiliate.tsx` (`updateAffiliatePartner(...).unwrap()`), `view/form.tsx` (`getAffiliatePartnerDetail`; `updateStatusAfiliatePartner` dispatch call site NEEDS-VERIFICATION). All AntD forms.
- **Cross-module sharing:** `src/components/forms/search/affiliate-partner-searcher.form.tsx` (shared searcher component) reads `getListAssociatedPartnerCompany`/`watchListAffiliatePartnerCompany` directly — a shared technical component coupled to this users-owned slice, not a second semantic owner.

### 3.3 `customer`

- **Resource kind (CONFIRMED):** `server-cache` — list, detail, device, contact history, application, updated history, pagination. Read-only resource apart from a CSV export thunk.
- **Middleware** (8 listeners): notify-only; no navigation (CONFIRMED).
- **Thunk orchestration:** no `getState()`, no multi-endpoint body. `downloadListCustomers` performs a DOM download inside the thunk body (defines a local BOM-prefixed `downloadBlob` duplicated in `staff.slice.ts` — see §5).
- **Correctness note:** `getListDevice`/`getListApplication` write the same `pagination` field as the main customer list (CONFIRMED) — three concurrent list requests share one pagination slot.
- **Forms:** no form submission consumer under `src/modules/users` was found dispatching customer-slice thunks in this pass beyond read/detail/export flows.
- **Cross-module sharing:** none outside `src/modules/users` (CONFIRMED).

### 3.4 `group-permission`

- **Resource kind (CONFIRMED):** `server-cache` — list, detail, histories, `listPermissions` (permission catalog, unpaginated), pagination.
- **Middleware** (10 listeners): two navigations on success (`createGroupPermission.fulfilled` → `ofUsersOperatorPermission()`; `updateGroupPermission.fulfilled` → `getViewUrl()`). **Defect (CONFIRMED):** `updateStatusGroupPermission.rejected` shows `ENABLE_SUCCESS`/`DISABLE_SUCCESS` on error (same pattern as affiliate-partner). File also has a stray empty side-effect import from `staff.slice` at line 7 — dead import, no behavior impact.
- **Thunk orchestration:** no `getState()`, no multi-endpoint body (CONFIRMED).
- **Forms:** `create/create-group-permission.tsx` (`createGroupPermission`), `edit/edit-group-permission.tsx` (`updateGroupPermission`), `view/form.tsx` (`getGroupPermissionDetail`; `updateStatusGroupPermission` dispatch call site NEEDS-VERIFICATION). All AntD.
- **Cross-module sharing:** none outside `src/modules/users` directly, BUT `src/modules/users/operator/user-operator-list/utils.ts:128` (`getGroupPermissions`) calls `apiFetcher.get('api/admin/portal/v1/role/${id}')` **directly, bypassing this slice entirely**, from `create-user-operator.tsx`/`edit-user-operator.tsx` — a direct-API-bypass finding (CONFIRMED), not a cross-module Redux-ownership issue, but relevant to any future migration of this resource since a second code path already talks to a related endpoint outside Redux.

### 3.5 `segmentation-customer`

- **Resource kind (CONFIRMED):** `mixed` — server-cache (list, detail, histories, determination set) plus client draft `dataSegmentationCustomerUpdate` and a search-result list `listBlackListSearch`.
- **Middleware** (19 listeners, the largest of the seven): three navigations on success (create, edit, blacklist update — each to `getViewUrl()`/list page). **Defect (CONFIRMED):** `createCopySegmentationCustomerList.rejected` shows a `NOT_FOUND` message for every failure, not just a not-found case — misleading for other failure types.
- **Thunk orchestration:** no `getState()`, no multi-endpoint body. Two notable client-state-shaped thunks:
  - `updateSegmentationCustomerBlacklist` catches the error and returns `rejectWithValue(error?.data?.errors)`; the rejected listener does not read that payload, so field-level validation errors from the backend are not surfaced by the middleware (NEEDS-VERIFICATION whether the form component itself reads the rejected payload instead).
  - `updateDataSegmentationCustomer` is an identity thunk with **no endpoint call at all** — it only toggles the `loading` flag and merges its argument into a Redux draft (`dataSegmentationCustomerUpdate`). This is client state modeled as an async thunk for no transport reason (CONFIRMED) — a `MIXED-OWNER` signal for Phase 2.
- **Dead code:** `segmentation-customer.slice.ts` defines an unexported reducer literally named `resetSegmentationCustomerList` (line ~424) that is never exported — confusing because `unlock-request-customer.slice.ts` separately exports an action with the exact same name that resets a *different* list (see §3.7, §5).
- **Forms:** create (`condition-defined.tsx`, `condition-criteria.tsx` → `createSegmentationCustomer`), edit (same two files → `editSegmentationCustomer`), `condition-blacklist.tsx` (`updateSegmentationCustomerBlacklist`), `view/form.tsx` (`updateStatusSegmentationCustomer`). All AntD; no RHF, no Zod anywhere under `src/modules/users` (CONFIRMED by grep).
- **Cross-module sharing (genuine, not incidental):** `src/modules/products/configuration/{cash-loan,credit-card}/{create,edit}/index.tsx` (4 files) dispatch `getListSegmentationCustomer` and read `watchListSegmentationCustomer`/`watchSegmentationCustomerLoading` **directly against this users-owned slice** — the same endpoint, same Redux list, consumed for product-segment selection. This is `QUERY-CANDIDATE-SHARED` territory for Phase 2, not `QUERY-CANDIDATE`: migrating `segmentation-customer` touches `products` consumers too.
- **Dual-copy risk (NEEDS-VERIFICATION):** `common.slice.ts` separately holds `segmentationCustomers` (fetched from `api/admin/portal/v1/category/customer-segment`), and `src/queryKeys/users/customer-segment.query-keys.ts` already exposes a TanStack Query path for a `customer-segment/select` endpoint, consumed by splash-screen/background-main hooks. Whether all three (`segmentation-customer` slice, `common.slice` field, Query path) represent the same backend resource or three different ones cannot be established from frontend code alone — flag `NEEDS-TEAM-DECISION` before any Phase 2 plan touches this resource.

### 3.6 `staff`

- **Resource kind (CONFIRMED):** `server-cache` — list, detail, histories, `listStaffImport` (import staging), pagination, `isLoadingStaffImport`.
- **Middleware** (17 listeners): two navigations on success (create, update). **Defects (CONFIRMED):**
  - `updateStatusStaff.fulfilled` honours an `ignoreMiddleware` flag (suppresses its own notification when the caller wants to show its own), but `updateStatusStaff.rejected` does **not** check that flag and always shows success-labelled message constants on error.
  - `getStaffDetail.rejected` is registered **twice** in the same middleware file — a detail-load failure fires two notifications.
- **Thunk orchestration:** no `getState()`, no multi-endpoint body. `downloadTemplate`/`downloadListStaffs` perform DOM downloads inside the thunk body, duplicating a local `downloadBlob` helper that also exists verbatim in `customer.slice.ts` (vs. `segmentation-customer.slice.ts`, which imports the shared `src/utils/common.ts` version) — three copies of download logic across two slices plus one shared util; behavioral equivalence NEEDS-VERIFICATION.
- **Component-level race (CONFIRMED):** `operator/user-operator-list/edit/edit-user-operator.tsx` dispatches `updateStaff` and a conditional `updateStatusStaff` (with `ignoreMiddleware: true`) without awaiting either; `updateStaff.fulfilled` navigates to the view page, which can race the still-in-flight status update, and — per the middleware defect above — a failed status update in that race still shows a success-labelled error message.
- **Forms:** `create/create-user-operator.tsx` (`importListStaff`, `createStaff`), `edit/edit-user-operator.tsx` (`updateStaff`, `updateStatusStaff`), `view/form.tsx` (`getStaffDetail`; `updateStatusStaff` dispatch call site NEEDS-VERIFICATION). All AntD.
- **Cross-module sharing:** `resetStaffImport` only, consumed by `src/modules/products/parameter/fee/fee-list.tsx`, `CashLoanProductList.tsx`, `CreditCardProductList.tsx` (reset-only, not a read of the resource), and by the shared generic import widgets `src/components/forms/import/import-file-form.tsx` and `list/{valid,invalid}-file-import.tsx` (which read `getListStaffImport`/its watchers, generically switched by import type). Assessment: shared-widget coupling to a users-owned staging list, not a second semantic owner of the `staff` resource itself.

### 3.7 `unlock-request-customer`

- **Resource kind (CONFIRMED):** `server-cache` — `listUnlockRequestCustomer`, `pagination`, `loadingUpdate`. Dead field `loadingOption` (unused by any reducer or selector).
- **Prior-task note:** this slice's two thunks were extracted into `src/services/users/unlock-request-customer.service.ts` + sibling `unlock-request-customer.types.ts` earlier in this session (see `docs/reports/2026-11-04/unlock-request-customer-service-extraction.md`). The slice remains the Redux state owner; only its transport layer changed. Confirmed still current: the slice imports `window.apiFetcher` calls indirectly via the service now, not directly.
- **Middleware** (3 listeners): `getListUnlockRequestCustomer.rejected` notifies correctly. **Defect (CONFIRMED, pre-existing, documented in the prior extraction report):** `updateUnlockRequest.rejected` is registered **twice** — once showing `MESSAGE.UPDATE_SUCCESS` with `type: 'error'`, once showing `MESSAGE.UPDATE_FAIL` — so a failed update fires two error notifications, one with the wrong message. There is no `fulfilled` listener, so a successful update shows no success notification at all.
- **Thunk orchestration:** no `getState()`, no multi-endpoint body (CONFIRMED, re-verified post-extraction).
- **Naming collision (CONFIRMED, cosmetic):** this slice exports an action literally named `resetSegmentationCustomerList` that resets only the unlock-request list — an apparent copy-paste artifact from `segmentation-customer.slice.ts`, which separately defines (but does not export) a same-named reducer for its own, different list. Neither has any importer outside its own slice file (grep-confirmed), so there is no runtime collision — only a maintainability/grep-confusion risk.
- **Forms:** `customer/unlock-request/list.tsx` (`updateUnlockRequest(...).unwrap()` then a conditional list refetch). AntD `FormReason.useForm`.
- **Cross-module sharing:** none (CONFIRMED) — `users`-only consumer, matching Phase 0's pilot-candidate note.

## 4. Lightly Scoped Slices (users is a minor consumer)

Counts re-verified against Phase 0 and found accurate.

| Slice | Resource kind (from `initialState` only) | Users / total consumer files | Note |
| --- | --- | --- | --- |
| `address` | server-cache (reference data) | 6 / 17 | products-dominant (11); full middleware read deferred to a `products` Phase 1 run |
| `fee-definition` | server-cache | 6 / 29 | contents/products-dominant; deferred |
| `product-addon` | server-cache | 3 / 30 | products-dominant; deferred |
| `product-industry` | mixed (server lists + client `dataTempUpdate` draft) | 2 / 31 | products-dominant; deferred |
| `product-list` | server-cache | 1 / 37 | products-dominant; deferred |
| `required-information` | server-cache (reference data) | 3 / 13 | products-dominant; deferred |
| `common` | server-cache (reference, ~15 paired list/loading/pagination sets) | 10 / 92 | shared across 5 modules; needs its own dedicated Phase 1 pass, not any single module's |
| `notification` | client-state (UI message, `initialState = {}`) | 13 / 94 | `KEEP-REDUX-CLIENT` candidate per rule 04 — out of scope for any migration |
| `layout` | client-state (UI) | 1 / 9 | `KEEP-REDUX-CLIENT` candidate per rule 04 — out of scope for any migration |

These nine are deliberately not deep-dived here to avoid duplicating the same full-body read across every module's Phase 1 run; each gets its full treatment when its dominant module (`products`, or a dedicated `common`/shared pass) runs Phase 1.

## 5. Cross-Cutting Findings (span multiple slices)

- **Duplicate rejected-listeners (CONFIRMED):** `getAccountAccessDetail.rejected` is independently handled in both `access-account.middleware.ts` and `affiliate-partner.middleware.ts` — two notifications for one failure. `getStaffDetail.rejected` is registered twice within `staff.middleware.ts` itself. `updateUnlockRequest.rejected` is registered twice within `unlock-request-customer.middleware.ts` itself (pre-existing, already documented in the prior extraction task).
- **Success-labelled messages on error (CONFIRMED):** `affiliate-partner.middleware.ts` (`updateStatusAfiliatePartner.rejected`), `group-permisson.middleware.ts` (`updateStatusGroupPermission.rejected`), `staff.middleware.ts` (`updateStatusStaff.rejected`), and `unlock-request-customer.middleware.ts` (`updateUnlockRequest.rejected`) all show an `*_SUCCESS` message constant on a failure path. This is the same shape of defect repeated across four independent middleware files — a systemic pattern, not an isolated typo.
- **Stuck/shared `loading` flags (CONFIRMED):** `affiliate-partner`'s `getListAssociatedPartnerCompany` pending sets `loading = true` with no clearing path; `customer`'s `getListDevice`/`getListApplication` overwrite the same `pagination` field as the main list fetch.
- **Direct API bypass of an owned slice (CONFIRMED):** `users/operator/user-operator-list/utils.ts` calls `apiFetcher.get('api/admin/portal/v1/role/${id}')` directly rather than through `group-permission`'s thunks — a second, Redux-bypassing code path against a related endpoint.
- **Duplicated download helpers (CONFIRMED):** near-identical local `downloadBlob` implementations in both `customer.slice.ts` and `staff.slice.ts`, versus `segmentation-customer.slice.ts` importing the shared `src/utils/common.ts` version — three code paths for one responsibility.
- **No RHF/Zod anywhere under `src/modules/users`** (CONFIRMED by grep) — every form in scope is a plain AntD `Form`/`FormInstance` flow, consistent with `.claude/rules/05-form.md`.
- **Dual-copy / identity risk for `segmentation-customer`** — see §3.5. This is the single highest-uncertainty item blocking a clean Phase 2 classification for that resource.

None of the above are in scope to fix in this audit; they are recorded as Phase 2 input and as general defect awareness. None of them were introduced by, or related to, the `unlock-request-customer` service extraction done earlier in this session.

## 6. NEEDS-VERIFICATION / NEEDS-TEAM-DECISION

- `NEEDS-VERIFICATION`: dispatch call sites for `updateStatusGroupPermission`, `updateStatusAfiliatePartner`, and `updateStatusStaff` were located by import but not confirmed by a matching `dispatch(...)` call in this pass.
- `NEEDS-VERIFICATION`: whether `condition-blacklist.tsx` reads the `rejectWithValue` payload from `updateSegmentationCustomerBlacklist` that the middleware itself ignores.
- `NEEDS-VERIFICATION`: backend semantics for the `.../${status}/batch` path-segment pattern (account-access, segmentation-customer, staff), and whether `account-access`'s single-element-array comparison bug has a real multi-select call site.
- `NEEDS-VERIFICATION`: whether `customer.slice.ts`'s and `staff.slice.ts`'s local `downloadBlob` copies are behaviorally identical to each other and to the shared `src/utils/common.ts` version.
- `NEEDS-TEAM-DECISION`: whether `segmentation-customer` (Redux), `common.slice.ts`'s `segmentationCustomers` field, and the existing `src/queryKeys/users/customer-segment.query-keys.ts` TanStack Query path represent one backend resource or three — this must be resolved before any Phase 2 plan proposes migrating `segmentation-customer`.
- Consumer component bodies were located by import/dispatch search, not read in full; behavior beyond the cited call sites is unverified.
- Runtime behavior of every defect listed in §5 (duplicate toasts, stuck loading, wrong-label messages) was not executed — these are static-source findings only.
- No file under `src/` was modified in this audit.

Full file path of this report: `docs/audits/state-management/2026-11-04/phase1-users-redux-audit.md`
