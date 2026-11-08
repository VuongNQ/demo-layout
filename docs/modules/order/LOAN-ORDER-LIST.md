# Loan Order List — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq`, clean tree.
- Date: 2026-11-04.
- Method: static source inspection. One read-only `codebase-analyzer` subagent read all 16 files of this submodule in full, plus `src/redux/slices/loan-order.slice.ts`, `loan-order.middleware.ts`, `query.slice.ts`, `hooks/{query-state,query,form}.hook.ts`, the ambient `.d.ts` types, `message.constant.ts`, and the route/permission/menu references. This session independently re-verified the highest-impact findings directly from source (listed below) rather than trusting the subagent's report at face value, consistent with this template's evidence standard. No runtime, browser, auth, or backend verification was performed.
- Scope: `src/modules/order/loan-order-list/` — 16 files (`list.loan-order.tsx`, `constants.ts`, `utils.ts`, 7 files under `component/`, 6 files under `view/`). Split out of [`../OVERVIEW.md`](../OVERVIEW.md) per the template's size rule — see that file's §0 for the split rationale. `docs/modules/order/OVERVIEW.md` is this document's sibling, not a source of facts about this submodule's own internals.
- Directly re-verified by this session, not merely taken from the subagent (all CONFIRMED by direct `Read`/`grep`): the inverted activate/deactivate notification condition (§13 item 1); that none of the seven write actions carries a `hasPermission` check (§9, §13 item 2); that `component/modal-content.tsx` has zero importers (§3, §13); that `history.tsx`'s page-change handler destructures only `page`/`size`, dropping sort (§13 item 9); the `LoanOrderTabs.contract = 'contact'` typo (§13 item 23); zero Zod/RHF imports (§7).
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Whether `products/{CREATING|INACTIVE}` is the backend's actual intended activation endpoint for a loan-order resource, or a copy-paste literal from the `products` domain.
  2. Whether any of the seven write actions (retry, call-confirm, reject, cancel, approve, additional-request, adjustment, physical-contract-update) is re-validated against a permission or status precondition on the backend, which would mitigate the frontend's confirmed lack of a `hasPermission` gate (§9, §13).
  3. Meaning of "C06" in this domain (not defined anywhere in this module's source) and whether `signingDueDate` is a signed-date or a due-date field.
  4. Whether `common.slice`'s and `required-information.slice`'s master data (both read by different views in this submodule) are the same underlying reference data.
  5. Whether the retry-polling loop (`loan-order-detail.tsx:313-345`) can get stuck indefinitely on a persistent backend error, since its `.unwrap()` rejection inside the `setInterval` callback has no catch.

## 1. Responsibility

The loan application list and its detail workflow (CONFIRMED, `list.loan-order.tsx`, `view/loan-order-detail.tsx`): a paginated, searchable, sortable list of loan applications with CSV export and a bulk activate/deactivate action, and a detail page with a 5-tab sidebar (Product, Identification, Profile, Contract, History — `loan-order-detail.tsx:107-136`, via `constants.ts`'s `LoanOrderTabs` enum) plus a status-driven action area offering retry, call-confirmation, rejection, cancellation, approval, an additional-information request, a product adjustment, a physical-contract update, and an HPO e-sign-status sync (`loan-order-detail.tsx:652-738`).

## 2. Entry points and routes

See `../OVERVIEW.md` §2 for the full route/menu/`PageURLs` wiring shared across both submodules. This submodule owns 2 of the module's 4 `<Route>`s: `main.routes.tsx:449-456` (list, `ListLoanOrder`) and `form.routes.tsx` (~762-768) (detail, `LoanOrderDetail`), both gated by the 2-member OR array `[APPLICATION_VIEW_CREDIT_CARD, APPLICATION_VIEW_CASH_LOAN]`.

## 3. Directory map

```text
loan-order-list/
|-- list.loan-order.tsx                 # 395 lines — list page: search, sort, paginate, CSV export, bulk toggle
|-- constants.ts                        # 7 lines — LoanOrderTabs enum (contains a value typo, §13.23)
|-- utils.ts                            # 34 lines — applicant-detail parsing helpers; 3 importers
|-- component/
|   |-- additional-request.tsx          # 454 lines — "request more info" fragment; no <Form>, no Form.Item (§7)
|   |-- adjustment.tsx                  # 145 lines — product/term adjustment fragment; rules= at 95,115,127
|   |-- call-confirm.tsx                # 109 lines — call-confirmation fragment; rules= at 35,57,86; silent no-op (§13.11)
|   |-- modal-content.tsx               # 103 lines — DEAD: zero importers anywhere in src/ (CONFIRMED this session)
|   |-- order-cancel.tsx                # 32 lines — cancel reason fragment; no rules on the reason field (§13.13)
|   |-- order-rejected.tsx              # 32 lines — rejection reason fragment; identical to order-cancel.tsx except the label
|   `-- update-physical-contract.tsx    # 149 lines — physical-contract-update fragment; rules= at 119
`-- view/
    |-- loan-order-detail.tsx           # 1,004 lines — detail page shell; owns the one FormInstance and all write-action orchestration
    |-- contract.tsx                    # 375 lines — contract tab; hardcoded outbound path (§10, §13.24)
    |-- history.tsx                     # 174 lines — history tab; drops sort from the page-change handler (§13.9)
    |-- identification.tsx              # 347 lines — C06 read view; custom video overlay instead of AntD Modal (§12)
    |-- order-profile.tsx               # 345 lines — applicant profile tab
    `-- product.tsx                     # 312 lines — product tab
```

`modal-content.tsx` (the module's own file, distinct from the shared `src/components/modal-content.tsx` that every write-action fragment actually renders through `loan-order-detail.tsx`'s `openModal` calls) is confirmed dead: `grep -rn "loan-order-list/component/modal-content" src/` returns no importer anywhere in the repository (re-verified directly this session). Per the template's rule 10, this is recorded here and raised as an open question (§15), not given its own section.

## 4. Main runtime flows

### Flow A — list: load, search, sort, paginate, export, bulk toggle

(CONFIRMED, `list.loan-order.tsx`, `src/redux/slices/loan-order.slice.ts`)

1. Page/filter/sort state: global Redux `pageParam` via `useQueryState()` (`list.loan-order.tsx:34,51` — confirmed import/usage this session), not URL state. `handlePageChange` (`:137-155`) flattens `filter` before writing it via `saveQueryParams`.
2. List fetch: `getListLoanOrder` → `GET api/admin/portal/v1/application-requests`; rows/total land in `loanOrderSlice.listLoanOrder`/`.pagination`.
3. CSV export (`list.loan-order.tsx:292`, permission-gated by `[APPLICATION_EXPORT_CSV_CASH_LOAN, APPLICATION_EXPORT_CSV_CREDIT_CARD]`): sends `ExportLoanOrderList`-shaped flattened filters plus `profileIds: selectedRowKeys` to `POST application-requests/download` (`Accept: text/csv`, `responseType: 'blob'`), then `downloadBlob(response, 'loan-order.csv')`. Note (LIKELY, from the subagent's read, not independently re-verified by this session): the export reads `filter.idNumber`, while the searcher form's actual field is `customerIdNumber` (`forms/search/loan-order-searcher.form.tsx:244`) — if accurate, the ID-number export filter would never carry a value. Recorded as `NEEDS-VERIFICATION` (§15) since this session did not independently re-read the searcher form.
4. **Bulk activate/deactivate toggle (CONFIRMED, directly re-verified this session, `list.loan-order.tsx:110-135`):** opens the shared `ModalContent` with both `onConfirm` (dispatches `updateActiveState({ id: selectedRowKeys, status: isAllInactive ? 'CREATING' : 'INACTIVE' })`, then closes the modal and clears selection) and `onCancel` wired — unlike the sibling `contract-list/list.contract.tsx` toggle, which wires neither dispatch nor `onConfirm` at all (`../OVERVIEW.md` §4, §13). This toggle *does* function, but its resulting notification text is wrong (§13 item 1).

### Flow B — detail page and status-action orchestration

(CONFIRMED structure and line ranges per the `codebase-analyzer` read; the permission-check absence and the inverted-notification root cause were independently re-verified by this session)

1. On mount, `getDetailLoanOrder(id)` fetches the detail; cleanup resets it (`loan-order-detail.tsx:766-783`). After the fetch, a product-line-branched permission re-check runs and redirects to 404 on failure (`:785-800`, confirmed this session: `hasPermission([PERMISSIONS.APPLICATION_VIEW_CREDIT_CARD])` / `hasPermission([PERMISSIONS.APPLICATION_VIEW_CASH_LOAN])`, two single-element arrays, each tied to a different branch — not inferred from one another).
2. `RenderTopContent` dispatches `getListContractHistories` on mount and on every `detail` change (`:884-893`) — this is the thunk whose `fulfilled` handler overwrites `loanOrderSlice.pagination` (§5, §13 item 8).
3. All seven write actions share one orchestration helper, `popupHanlleUpdateStatus` (`:483-530`): open a modal with the action's fragment as content → on confirm, `validateFields()` → the action's own handler → `getDetailLoanOrder(id)` (refetch) → `resetFields()` → close the modal. **None of the seven branches calls `hasPermission` or checks any permission constant beyond the mount-time VIEW check in step 1** (confirmed this session: `grep -n "hasPermission\|PERMISSIONS\." loan-order-detail.tsx` returns only the two VIEW-check lines quoted above — nothing inside `popupHanlleUpdateStatus` or any of the seven call sites that use it).
4. Per-action endpoints (per the subagent's read of each fragment and its dispatch target; line numbers as reported, not independently re-walked by this session beyond the permission grep above):
   - **Retry** (`:310-345`): `retryLoanOrder` → `POST application-requests/{id}/retry?retryType=SUBMIT|DISBURSE` with an `Idempotency-Key` header; polls `getStatusRetryProcessing` → `GET .../{id}/retry` every 3 seconds. The poll's `.unwrap()` rejection path has no `catch` (§0, §13 item 5).
   - **Call-confirmation** (`call-confirm.tsx`): `updateStatusLoanOrder` → `POST .../{id}/status` with a `PENDING_CONFIRM` body. Silently no-ops (resets and closes without dispatching) if `dueDate`/`fromTime`/`toTime` is missing (`:349` per the subagent's line reference) — a confirmed-shape finding given `call-confirm.tsx` has no `<Form>`/registered fields for these at all per this session's own form-sweep (§7).
   - **Reject** (`order-rejected.tsx`): same `.../{id}/status` endpoint, `REJECTED` body.
   - **Cancel** (`order-cancel.tsx`): same endpoint, `CANCEL` body. The dispatch is reported as not awaited before the subsequent `getDetailLoanOrder(id)` refetch fires (LIKELY race, per the subagent; not independently re-verified).
   - **Approve**: a direct click handler with no fragment/modal, same endpoint, `APPROVED` body.
   - **Additional-info request** (`additional-request.tsx`): `POST application-requests/additionals`.
   - **Product adjustment** (`adjustment.tsx`): `POST .../{id}/adjustment`.
   - **Physical-contract update** (`update-physical-contract.tsx`): `PUT .../{id}/physical-contracts`.
   - **HPO e-sign sync**: `PUT api/admin/portal/v1/applications/{id}/hpo-sign-status` — note the different path segment (`applications`, not `application-requests`) from every other endpoint in this submodule; refetches only if `registerESign` is set.
5. Notifications for list/detail-level failures are owned by `loan-order.middleware.ts`'s listener middleware (20 listener registrations), not by the page components — consistent with `.claude/rules/03-api-service.md`'s "choose one notification owner" guidance structurally, even though one of those listeners has the wrong condition (§13 item 1).

### Flow C — C06 identification (read-only)

(Per the subagent's read; not independently re-verified by this session beyond confirming the file has no `@tanstack`/mutation/dispatch call for this specific view)

`identification.tsx` renders `data.c06Result` from the already-fetched Redux detail object — no API call and no write path of its own. Status labels are derived locally (`checkStatusInfo`): `VERIFIED` → "Đạt", `FAILED` → "Không Đạt", `UNKNOWN` → "Lỗi hệ thống", else "Chưa kiểm tra". "C06" itself is not defined anywhere in this module's source (`NEEDS-VERIFICATION`, §15) — the term also appears in `src/types/customer.d.ts` and `src/modules/users/customer/list-customer/view/identification.tsx`, which were out of this module's scope and were not read in this pass.

## 5. State ownership

| State | Owner | Registered? |
| --- | --- | --- |
| Loan-order list rows + total | Redux `loanOrderSlice.listLoanOrder`/`.pagination` | Registered: `src/redux/slices.ts:15`, middleware `configureLoanOrderMiddleware` registered `src/redux/store.ts:28,75` (CONFIRMED, this session read both files directly) |
| List page/filter/sort | Global Redux `pageParam` via `useQueryState()` | `legacy-compatible`, shared mechanism |
| Loan-order detail | Redux `loanOrderSlice.loanOrderDetail` | same registration |
| History tab rows + its own pagination | Redux `loanOrderSlice.listHistory`/`.paginationHistory` | same registration |
| **Confirmed two-owner pagination cross-write (CONFIRMED, directly re-verified this session against `loan-order.slice.ts`):** `getListContractHistories.fulfilled`'s reducer (line ~153) writes into `state.pagination` — **the same `pagination` field the main loan-order list reads for its own total**, not into `paginationHistory` (which is written separately by `getListHistories.fulfilled` at line ~126). So fetching contract histories on the detail page (Flow B, step 2) overwrites the *list* page's pagination total in the shared slice, even though the two features look independent. | `loanOrderSlice` (single slice, two logically distinct concerns sharing one field by accident or by design — `NEEDS-VERIFICATION` which, §15) | — |
| `loading` flag | One boolean (`loanOrderSlice.loading`) shared across every thunk in the slice — list fetch, detail fetch, history fetch, every write action, and the export. `history.tsx:26` reads this same shared flag for its own table spinner. | `legacy-compatible`, but means an unrelated in-flight write action can make the history table (or the list) appear to be loading |
| One `FormInstance` (`AntForm.useForm`, `loan-order-detail.tsx:79`) | Shared by all six write-action fragments rendered as modal content | `adjustment.tsx` re-initializes its fields from `detail` in an effect on every `detail` change (dirty-edit risk, LIKELY per the subagent); `additional-request.tsx` keeps separate local state copies instead of registering fields on this shared instance (consistent with §7's finding that it has no real form fields) |
| Payment/product-line/required-information master data | `common.slice`, `required-information.slice`, `product-list.slice` (all outside this submodule) | Whether `common.slice`'s and `required-information.slice`'s master data are the same underlying data is `NEEDS-VERIFICATION` (§15) |

## 6. API boundaries

No service layer, no TanStack Query (`grep -rl "@tanstack/react-query" loan-order-list/` — no match, consistent with `../OVERVIEW.md` §3's module-wide confirmation). All calls are direct `apiFetcher` calls inside `loan-order.slice.ts`'s thunks — `LEGACY-COMPATIBILITY`, not a defect to flag.

Endpoints (per §4's Flow A/B, consolidated): `GET application-requests` (list), `GET application-requests/{id}` (detail), `GET update-history/{id}`, `GET contract-history/{id}` (feeds the pagination cross-write, §5), `POST application-requests/{id}/retry?retryType=...` + `GET application-requests/{id}/retry` (retry + poll), `POST application-requests/{id}/status` (shared by call-confirm/reject/cancel/approve, distinguished only by request body), `POST application-requests/additionals`, `POST application-requests/{id}/adjustment`, `PUT application-requests/{id}/physical-contracts`, `PUT applications/{id}/hpo-sign-status` (different path segment, §4), `POST application-requests/download` (export), and `PUT products/{CREATING|INACTIVE}` (the activate/deactivate toggle — `NEEDS-VERIFICATION` whether `products/` is the intended path for a loan-order resource, §0/§15).

Errors: each `rejected` thunk clears its own list/detail slot and resets `loading`; `retryLoanOrder` wraps its error as `new Error(error.data.message)`. The activate/deactivate failure notification text is wrong due to the inverted condition (§13 item 1), which lives in the middleware, not the slice.

## 7. Forms and validation

- One `AntForm.useForm` call site total (`loan-order-detail.tsx:79`), shared across six fragments rendered as modal content — not six independent forms.
- `rules=` sites (confirmed this session by grep across all `component/*.tsx` files): `adjustment.tsx:95,115,127`; `call-confirm.tsx:35,57,86`; `update-physical-contract.tsx:119`. **`additional-request.tsx`, `order-cancel.tsx`, and `order-rejected.tsx` have zero `rules=`.**
- **Confirmed validation gap in `order-cancel.tsx`/`order-rejected.tsx`:** the cancel/reject reason field carries no `rules`, so an empty reason is accepted by the form even though `validateFields()` is still called in the shared orchestration flow (§4) — the validation call exists, but there is nothing registered for it to check on this field.
- **Confirmed shape, re-verified this session:** `additional-request.tsx` has no `<Form>` wrapper and registers no `Form.Item name=` fields at all — its `dueDate` is set purely from a `DatePicker`'s `onChange` into local component state, not into the shared `FormInstance`. The orchestration's `validateFields()` call therefore validates nothing for this specific action (consistent with the silent no-op finding on the related `call-confirm.tsx` flow in §4, which checks for missing `dueDate`/`fromTime`/`toTime` values explicitly in its own handler rather than relying on form validation to catch them).
- No Zod, no `react-hook-form` anywhere in this submodule (re-confirmed this session, same grep as `../OVERVIEW.md` §3).

## 8. Types and DTO organization

All ambient global `.d.ts`, not feature-local (same pattern as the parent module, `../OVERVIEW.md` §8): `src/types/loan-order.d.ts` declares `LoanOrder`, `C06CheckResult`, `LoanOrderDetail`, `ApplicantDetail`, `DocumentDetail`, `LoanOrderHistory`, `ContractHistory`, `RequestBodyStatus`, `HpoSignStatusResponse`, `AdjustmentApplicationRequest`, `PhysicalContractApplicationRequest`, `FileUploadRequest`, `ApplicationRequestType`, `ApplicationRequestAdditionalType`, `ExportLoanOrderList`. `src/types/Filter.d.ts` declares `LoanOrderFilter`. Feature-local: `LoanOrderTabs` (the enum in `constants.ts` — itself non-compliant with `.claude/rules/02-typescript.md`'s enum prohibition, since it predates that rule and is `legacy-compatible`, not flagged as new-code noncompliance), plus `utils.ts`'s helper functions and a couple of component-local types (`CheckStatus` in `identification.tsx`).

One confirmed typo, directly re-verified this session: `constants.ts:5` — `contract = 'contact'` (the enum member's *value* is misspelled; the member *name* `contract` is correct). Whether this value is read/compared anywhere that would make the typo behaviorally significant (e.g. a tab-key comparison) is `NEEDS-VERIFICATION` (§15) — this document only confirms the literal typo, not its runtime effect.

## 9. Permissions

This submodule's own component-level permission surface is exactly the two VIEW checks described in §4 Flow B step 1 — both single-element arrays, confirmed this session, never inferred from a neighbor. The list's export button check (`list.loan-order.tsx:292`) is the only other `hasPermission` call in this submodule; it is a genuine 2-member OR array.

**The confirmed gap (directly re-verified this session, not merely reported by the subagent):** none of the seven write actions reachable from the detail page's action area has a `hasPermission` call anywhere in its path — not in `loan-order-detail.tsx`'s `popupHanlleUpdateStatus` orchestration, not in any of the six fragment components, not in the direct-click "Approve" handler. `grep -n "hasPermission\|PERMISSIONS\." loan-order-detail.tsx` returns exactly the two VIEW-check lines and nothing else. A user who holds either `APPLICATION_VIEW_CREDIT_CARD` or `APPLICATION_VIEW_CASH_LOAN` (enough to pass the route guard and the mount-time re-check) can retry, call-confirm, reject, cancel, approve, request additional info, adjust a product, or update a physical contract on any loan order, regardless of whether the backend's intent was for VIEW-only users to be unable to do any of this. Whether the backend independently re-validates authorization for these write endpoints is `NEEDS-VERIFICATION` (§0, §15) — this is a confirmed frontend-source fact, not a confirmed exploit, since frontend guards are not a backend security boundary per `.claude/rules/06-routing-permission.md`.

## 10. Shared and cross-domain dependencies

See `../OVERVIEW.md` §10 for the module-wide list. One finding specific to this submodule: `contract.tsx:100,128,156,184` (the loan-order detail's own "Contract" tab, not to be confused with `contract-list/`) links to `/product/parameter/contract-template-list/view/${id}` as a hardcoded literal string, rather than through a `PageURLs` builder — confirmed by the subagent's read, consistent with this submodule's general absence of a `PageURLs` detail builder (`../OVERVIEW.md` §2).

## 11. Consumers

Within this submodule: the six write-action fragments are imported only by `loan-order-detail.tsx` (confirmed this session: `grep -rn "from '\.\./component/" view/loan-order-detail.tsx` finds all six; the seventh file in `component/`, `modal-content.tsx`, has zero importers, §3). `constants.ts`'s `LoanOrderTabs` is imported only by the detail page. `utils.ts` is imported by three files (per the subagent's read). No file outside this submodule imports from it (`../OVERVIEW.md` §10/§11).

## 12. Pattern classification

Same overall classification as the parent module (`../OVERVIEW.md` §12: Redux-owned, listener-middleware notifications, AntD-only forms, Emotion styling — all `legacy-compatible`, not flagged as defects). One submodule-specific addition: `identification.tsx:175-229`'s custom video-overlay implementation, instead of an AntD `Modal`, is a confirmed departure from `.claude/rules/07-component.md`'s "Ant Design first" reuse ladder — `legacy-compatible` for an untouched existing feature, not something this document treats as authorization to rewrite it (§14).

## 13. Technical risks

Ordered by decreasing consequence; each entry opens with a bold category label per the template.

1. **Inverted activate/deactivate notification message (CONFIRMED, directly re-verified this session against `loan-order.middleware.ts:44-70` and `list.loan-order.tsx:110-124`).** The middleware's `updateActiveState.fulfilled`/`.rejected` listeners both branch on `action.meta.arg.status === 'ACTIVE'`, but the list's own dispatch only ever sends `status: 'CREATING'` or `status: 'INACTIVE'` — **never `'ACTIVE'`.** The condition is therefore always false, so every successful or failed toggle shows `LOAN_ORDER_MESSAGE.DISABLE_SUCCESS`, even when the user just activated a loan order. (A second, smaller issue in the same block: the `.rejected` listener's two message choices are both named `..._SUCCESS` despite being shown with `type: 'error'` — the wrong-message risk compounds with a wrong-label risk on failure.)
2. **Permission-ungated write actions** (§9) — the single most significant finding in this submodule: seven distinct write actions on a loan order have no permission check beyond the route-level VIEW gate.
3. **Pagination cross-write between two logically separate features** (§5) — fetching contract histories on the detail page silently overwrites the list page's pagination total in the same Redux field.
4. **Export filter field-name mismatch** (§4, reported by the subagent, not independently re-verified by this session): the CSV export reads `filter.idNumber` while the searcher form's field is reportedly `customerIdNumber` — if accurate, the ID-number filter in the exported CSV request never carries a value.
5. **Retry polling has no failure exit** (§0, §4): the 3-second poll's `.unwrap()` rejection is not caught inside the interval callback, so a persistent backend error could leave the UI polling indefinitely rather than surfacing the failure.
6. **Shared `loading` flag across unrelated concerns** (§5): one boolean covers list fetch, detail fetch, history fetch, every one of the seven write mutations, and the export — an unrelated in-flight action can make an unrelated spinner appear.
7. **Dead file:** `component/modal-content.tsx` has no importer anywhere in the repository (§3, confirmed this session).
8. **Silent no-op in the call-confirmation flow** (§4): missing `dueDate`/`fromTime`/`toTime` causes the handler to reset and close the modal without dispatching anything or informing the user that nothing happened.
9. **Sort dropped from the history tab's page-change handler** (CONFIRMED, directly re-verified this session, `history.tsx`): `handlePageChange`'s destructured parameter type is `PageCustomerChangeParams` (`page`, `size` only); whatever sort state the table UI might present, it is never read into the dispatched `getListHistories` query.
10. **Unvalidated cancel/reject reason** (§7): the reason field has no `rules`, so an empty reason passes `validateFields()`.
11. **`LoanOrderTabs.contract` value typo** (§8, confirmed this session): the enum member `contract` has the string value `'contact'`. Runtime significance `NEEDS-VERIFICATION` (§15).
12. **Hardcoded outbound navigation path** (§10): `contract.tsx`'s four links to the product-contract-template detail bypass `PageURLs` entirely.
13. **Custom video-overlay UI instead of AntD `Modal`** (§12) in the C06 identification view — a legacy Ant-Design-first departure, not a correctness defect.
14. Further lower-severity findings from the subagent's read, not independently re-verified by this session and therefore not asserted as CONFIRMED here: duplicated dispatch-and-reset logic repeated near-identically across all six write-action fragments (`order-cancel.tsx`/`order-rejected.tsx` in particular are reported as identical except for the label); an unawaited `cancel` dispatch racing its own refetch; a possible `.length` throw on an unchecked array in the additional-request flow; a `'COMPANY TAX CODE'` string with a space that would not match a `COMPANY_TAX_CODE`-shaped key; inconsistent `updateDate` typing across three different declarations (`number`/`Dayjs`/`string`); an unguarded `JSON.parse` on applicant-detail strings; several commented-out code blocks (`product.tsx:61-85,148-172`, `contract.tsx:294-307`, `identification.tsx:128,149-153`) and commented-out imports (`list.loan-order.tsx:6,10,19,29`) that affect no current behavior and are therefore recorded here rather than given their own section, per the template's rule 10; a `PDFModal` component declared inside its parent's render body in two files, re-created every render; and two misspelled identifiers (`hanldePreviewContract`, `popupHanlleUpdateStatus`). These are recorded as a batch, at `NEEDS-VERIFICATION` confidence, rather than individually re-verified, to keep this pass's verification effort proportionate to this document's size budget.

## 14. Areas to avoid touching

- `src/redux/slices/loan-order.slice.ts`'s `pagination`/`paginationHistory`/`loading` fields — shared by the list, the detail page, the history tab, and every write action (§5, §13 item 3/6). A fix to the cross-write (item 3) must account for every one of these consumers.
- `loan-order.middleware.ts`'s listener registrations — fixing the inverted-notification condition (§13 item 1) touches shared listener logic that also governs the (correctly conditioned) `rejected` path's error type.
- `loan-order-detail.tsx`'s shared `FormInstance` and `popupHanlleUpdateStatus` orchestration — any permission-gating fix (§9, §13 item 2) that adds a check to one write action should consider whether the same check belongs on all seven, given they share this one orchestration path.
- `src/redux/slices/query.slice.ts`/`useQueryState()` — see `../OVERVIEW.md` §14; shared well beyond this submodule.
- `component/modal-content.tsx` — dead, but do not delete it in the same pass as an unrelated change without confirming with the team that it is safe to remove (§13 item 7, §15).

## 15. Open questions

- `NEEDS-VERIFICATION`: whether `products/{CREATING|INACTIVE}` (§6) is genuinely the backend's intended endpoint for toggling a loan order's active state.
- `NEEDS-VERIFICATION`: whether the backend independently authorizes any of the seven write actions beyond the frontend's VIEW-only gate (§9, §13 item 2).
- `NEEDS-VERIFICATION`: meaning of "C06" and whether `signingDueDate` is a signed-date or due-date field (§4 Flow C).
- `NEEDS-VERIFICATION`: whether `common.slice` and `required-information.slice` master data (§5) are the same underlying reference data.
- `NEEDS-VERIFICATION`: whether the export's `filter.idNumber`/`customerIdNumber` mismatch (§4, §13 item 4) is real — this session did not independently re-read the searcher form to confirm the subagent's claim.
- `NEEDS-VERIFICATION`: whether `LoanOrderTabs.contract`'s `'contact'` value typo (§8, §13 item 11) has any runtime effect, or is purely a cosmetic/unused literal.
- `NEEDS-VERIFICATION`: whether `component/modal-content.tsx` (§3, §13 item 7) is safe to delete as genuinely dead code, or was deliberately kept for a near-term reintroduction.
- `NEEDS-TEAM-DECISION`: whether any of the seven write actions should gain its own permission check beyond route-level VIEW (§9, §13 item 2) — the single highest-impact open decision in this submodule.
- `NEEDS-TEAM-DECISION`: whether list/filter/sort state for this submodule (and its sibling) should move from the global `pageParam` Redux slice to URL state for deep-linkability, matching `.claude/rules/04-state-management.md`'s stated preference for new/shareable list state — not applicable retroactively without an explicit decision, since this is existing, not new, code.
