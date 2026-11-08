# Order — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq`, clean tree (`git status --porcelain` empty).
- Date: 2026-11-04.
- Method: static source inspection (`find`, `grep`, `Read`, direct route/permission/Redux verification by this session) plus one read-only `codebase-analyzer` cross-check that read all 21 files in full and the surrounding Redux/route/permission wiring. No runtime, browser, auth, or backend verification was performed.
- Scope: `src/modules/order/` (21 files, `find src/modules/order -type f | wc -l`), two submodules — `contract-list/` (5 files) and `loan-order-list/` (16 files) — plus the parts of `src/routes/`, `src/redux/slices/{loan-order,contract}.slice.ts`, `src/redux/middlewares/{loan-order,contract}.middleware.ts`, `src/helpers/menus.helper.ts`, `src/constants/permission.constant.ts`, and `src/types/{loan-order,contract,Filter,pagination}.d.ts` that reach or gate this module.
- `loan-order-list/` is split into its own document, [`LOAN-ORDER-LIST.md`](LOAN-ORDER-LIST.md), per the template's "too large for one document" rule: it is 16 files / ~4,017 lines, with a 1,004-line detail page orchestrating six distinct write actions, retry polling, a C06 read-only identification view, history, and CSV export, against one Redux slice with ~13 thunks and 20 listener-middleware registrations. `contract-list/` (5 files / ~1,175 lines, read-only apart from one CSV export and one no-op status action) stays in this overview. This document covers both submodules' shared wiring (routes, Redux registration, permission constants) and `contract-list/` in full depth; `LOAN-ORDER-LIST.md` covers `loan-order-list/` in full depth.
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Whether `products/{CREATING|INACTIVE}` (the loan-order activate/deactivate endpoint) and `contract-agreement/{id}` (singular, vs. the plural `contracts-agreement` used elsewhere) are the backend's actual intended endpoints, or copy/paste literals from a different resource.
  2. Whether the contract list's "activate/deactivate" confirm modal (§4, §13) is dead UI (no `onConfirm` wired at all) because the backend never asked for this action on contracts, or because it was never finished.
  3. The exact backend semantics of loan-order/contract status transitions (`PENDING_CONFIRM`, `REJECTED`, `CANCEL`, `APPROVED`) and whether any of them are also enforced/re-validated server-side, given the frontend has no permission gate beyond route-level VIEW on any of these writes (§9, §13 — detailed in `LOAN-ORDER-LIST.md`).
  4. Whether `common.slice`'s product-line master data and `required-information.slice`'s master data (both read by `loan-order-list/` views) are the same underlying reference data or two independent sources.
  5. Meaning of "C06" and whether the loan-order detail's `signingDueDate` field is a signed-date or a due-date (name suggests due-date; not settled from source) — detailed in `LOAN-ORDER-LIST.md`.

## 1. Responsibility

Two related, independently-owned admin resources under one top-level `order/` module, surfaced as one menu group ("Order management", `t('orderManagement')`, `src/helpers/menus.helper.ts:517-538`):

- **`loan-order-list/`** — the loan application list and detail (CONFIRMED). Search/sort/paginated list, a status-driven detail page with retry, call-confirmation, reject, cancel, approve, additional-info-request, product-adjustment, physical-contract-update, and HPO e-sign-sync actions, a C06 identification read view, history, and CSV export. Full detail in `LOAN-ORDER-LIST.md`.
- **`contract-list/`** — the signed-contract list and a read-only detail (CONFIRMED). Payment schedule/history tabs appear only for `contractType === 'CL'` (`contract-list/view/contract-detail.tsx:108`). Has a CSV export and one non-functional bulk activate/deactivate confirm (§4, §13).
- Relationship (LIKELY): same domain, two separate resources — separate Redux slices, separate endpoints (`application-requests*` vs. `contracts-agreement*`/`contract-agreement`), separate permission families (`APPLICATION_*` vs. `CONTRACT_*`). The only cross-reference found is `sourceApplication`-shaped data and shared product-line reference data; no direct import between the two submodules (confirmed by grep, §10).

## 2. Entry points and routes

- **Lazy exports (`src/routes/pages.tsx`):** `pages.tsx:89` `ListLoanOrder` → `@/modules/order/loan-order-list/list.loan-order`; `pages.tsx:90` `ContractList` → `@/modules/order/contract-list/list.contract`; `pages.tsx:120` `LoanOrderDetail` → `@/modules/order/loan-order-list/view/loan-order-detail`; `pages.tsx:121` `ContractDetail` → `@/modules/order/contract-list/view/form`.
- **Routes (CONFIRMED, this session read both route files directly):**
  - `main.routes.tsx:449-456` — path `order/loan-order-list/list`, `Page={ListLoanOrder}`, `permissions={[PERMISSIONS.APPLICATION_VIEW_CREDIT_CARD, PERMISSIONS.APPLICATION_VIEW_CASH_LOAN]}` (2-member OR array).
  - `main.routes.tsx:459-466` — path `order/contract-list/list`, `Page={ContractList}`, `permissions={[PERMISSIONS.CONTRACT_VIEW_CREDIT_CARD, PERMISSIONS.CONTRACT_VIEW_CASH_LOAN]}` (2-member OR array).
  - `form.routes.tsx` (~762-768) — path `order/loan-order-list/list/view/:id`, `Page={LoanOrderDetail}`, same `APPLICATION_VIEW_*` OR array.
  - `form.routes.tsx` (~772-778) — path `order/contract-list/list/view/:id`, `Page={ContractDetail}`, same `CONTRACT_VIEW_*` OR array.
- **Route counts (CONFIRMED):** `grep -oE "<Route($|[ >/])" src/routes/main.routes.tsx | wc -l` = 69; same pattern on `form.routes.tsx` = 113. This module contributes exactly 2 of the 69 and 2 of the 113 — 4 total, matching `docs/reports/2026-11-04/module-docs-inventory.md`'s recorded figure (that report's own route-count method for this module was usage-count, not element-count; this document's count is the stricter `<Route>`-element count and the two agree for `order`).
- **`PageURLs` builders (CONFIRMED, `src/utils/navigate.ts:253-259`):** `ofLoanOrderList()` → `/order/loan-order-list/list`, `ofContractList()` → `/order/contract-list/list`. **List builders only — there are no detail-page `PageURLs` builders.** Detail links are built as relative paths (`view/${id}`) at the call sites (`loan-order-list/list.loan-order.tsx:190`, `contract-list/list.contract.tsx:182,189`), not through a central builder — unlike `bank-list`'s single `ofSystemBanks()` covering its one route.
- **Menu (CONFIRMED, `src/helpers/menus.helper.ts:517-538`):** one top-level entry "Order management" (`key: 'order'`, `link: PageURLs.ofLoanOrderList()`) with two children, "Loan order list" (`requiredPermissions: [APPLICATION_VIEW_CREDIT_CARD, APPLICATION_VIEW_CASH_LOAN]`) and "Contract list" (`requiredPermissions: [CONTRACT_VIEW_CREDIT_CARD, CONTRACT_VIEW_CASH_LOAN]`) — the same two OR arrays as the routes, each permission-checked independently per child, unlike `bank-list`'s unguarded landing-page link (`docs/modules/system/BANK-LIST.md` §2). This module has its own menu entries; it does not depend on another module's landing page the way `bank-list` does.

## 3. Directory map

`find src/modules/order -type f | sort` → 21 files.

```text
src/modules/order/
|-- contract-list/
|   |-- list.contract.tsx               # contract list: search, sort, paginate, CSV export, bulk activate/deactivate (no-op, §4/§13)
|   `-- view/
|       |-- contract-detail.tsx          # signed-documents tab: PDF preview + payment tabs (CL contracts only)
|       |-- form.tsx                     # contract detail page shell: fetch detail, permission re-check by contractType, tab routing
|       |-- payment-history.tsx          # client-side sorted/paginated payment history table
|       `-- payment-schedule.tsx         # client-side sorted/paginated payment schedule table
`-- loan-order-list/                     # see LOAN-ORDER-LIST.md for full detail
    |-- list.loan-order.tsx              # loan order list
    |-- constants.ts                     # LoanOrderTabs enum
    |-- utils.ts                         # applicant-detail parsing helpers
    |-- component/                       # 6 write-action form fragments + 1 unimported dead file
    `-- view/                            # detail page + 5 tab views
```

No `.module.scss` anywhere in this module (confirmed, `docs/reports/2026-11-04/module-docs-inventory.md`). No feature-local `services/` folder and no feature-local `types.ts` — all domain types are ambient globals (§8). Zero `@tanstack/react-query` imports anywhere in the module (`grep -rl "@tanstack/react-query" src/modules/order/` — no match). Zero Zod and zero `react-hook-form` imports (`grep -rl "zod\|react-hook-form" src/modules/order/` — no match, re-confirmed this session). No placeholder/stub files by content (confirmed by the `codebase-analyzer` cross-check reading every file).

## 4. Main runtime flows

### Flow A — contract list: load, search, sort, paginate, export

(CONFIRMED, `contract-list/list.contract.tsx`, `src/redux/slices/contract.slice.ts`)

1. List state (page/pageSize/filter/sort) lives in the **global Redux slice `pageParam`** (`src/redux/slices/query.slice.ts`), read/written through `useQueryState()` (`list.contract.tsx:25,40` — confirmed by direct import/usage grep this session), the same mechanism `bank-list` uses — not URL state, not the feature's own `contractSlice`.
2. `getListContract` (`contract.slice.ts`) fetches `GET api/admin/portal/v1/contracts-agreement`; results land in `contractSlice.listContract`/`.pagination` — so the **current page/filter/sort** is Redux `pageParam`-owned, but the **row data and total** are `contractSlice`-owned (two different Redux owners for one list's state, split by concern, not duplicated for the same field).
3. CSV export: a permission-gated button (`list.contract.tsx:273`, `hasPermission([PERMISSIONS.CONTRACT_EXPORT_CSV_CASH_LOAN, PERMISSIONS.CONTRACT_EXPORT_CSV_CREDIT_CARD])`) calls a `downFile` handler that spreads the full `queryState` object (not a flattened filter) into the request body sent to `contracts-agreement/download`, then calls `downloadBlob(response, 'contracts.csv')` (`src/utils/common.ts:381-393`, the same shared blob-download helper `loan-order-list/` uses). Whether the backend actually applies filters correctly when it receives the raw nested `queryState` shape (rather than a flattened one) is **LIKELY** a defect, not settled from source alone (§13, §15) — the ambient `ExportContractList` type (`src/types/contract.d.ts:46`) does not declare `page`/`size`/`filter`/`path` fields, so what is actually sent does not match its own declared request type.
4. **Bulk activate/deactivate is a confirmed no-op (CONFIRMED, directly verified this session):** `handleUpdateActiveState` (`list.contract.tsx:107-124`) opens the shared `ModalContent` (`src/components/modal-content.tsx`) with only an `onCancel` prop — **no `onConfirm` is passed at all.** `ModalContent`'s own confirm button unconditionally renders and calls `onConfirm?.(selectedOption)` (`src/components/modal-content.tsx:117,209`), so clicking "Confirm" on this specific modal does nothing: no dispatch, not even `closeModal()`. This is a real, confirmed-from-source UI defect, not a hypothesis — contrast `loan-order-list/`'s equivalent toggle, which does wire `onConfirm` (`LOAN-ORDER-LIST.md` §4, §13).

### Flow B — contract detail

(CONFIRMED, `contract-list/view/form.tsx`)

1. `getContractDetail(Number(id))` fetches on mount (`form.tsx:62-79`); `contractDetail` is the sole Redux-owned detail state.
2. A permission re-check runs *after* fetch, branching on the fetched `contractType`: `contractType === 'CD'` requires `CONTRACT_VIEW_CREDIT_CARD`, `contractType === 'CL'` requires `CONTRACT_VIEW_CASH_LOAN` (`form.tsx:84,87` — both single-element arrays, confirmed per-call-site, not inferred). This mirrors the route-level OR gate but narrows it by contract type once the type is known — the same two-stage view-then-narrow pattern `bank-list` does not need (it has only one resource type).
3. `contract-detail.tsx` renders the signed-documents tab; `payment-schedule.tsx`/`payment-history.tsx` render only when `contractType === 'CL'` (`contract-detail.tsx:108`), each with its own client-side `useState`-held sort/pagination (not server-side, not Redux-owned) — a third, page-local pagination mechanism distinct from both `pageParam` and the feature slice's `pagination`.
4. The "Kích hoạt" ("Activate") cancel-button label at `form.tsx:168` while `onCancel` simply navigates back to the list (`form.tsx:170`) is a label/behavior mismatch — **NEEDS-VERIFICATION** whether this is a copy-paste label from a different form or an intentional (if confusing) choice (§15).

## 5. State ownership

| State | Owner | Registered? |
| --- | --- | --- |
| Contract list rows + total | Redux `contractSlice` (`src/redux/slices/contract.slice.ts`) via `getListContract` | Registered: `src/redux/slices.ts:25`, middleware `configureContractMiddleware` registered `src/redux/store.ts:25,71` (CONFIRMED, this session read both files directly) |
| Contract list page/filter/sort | Global Redux slice `pageParam` via `useQueryState()` — **not URL state** | `legacy-compatible`, same shared mechanism `bank-list` and every other list page use |
| Contract detail | Redux `contractSlice.contractDetail` | same registration as above |
| Payment schedule/history sort+page | Local `useState` per tab component, client-side only | — |
| Loan-order list/detail/history and all 7 write-action states | Redux `loanOrderSlice` + global `pageParam` — see `LOAN-ORDER-LIST.md` §5 for the full breakdown, including a confirmed two-owner pagination cross-write specific to that submodule | — |

No TanStack Query anywhere in this module (§3) — both resources remain fully Redux-owned, which is the correct `.claude/rules/04-state-management.md` row ("existing server data already owned by Redux → existing Redux owner until explicit migration") and not a gap to flag, unlike a *new* resource being added to Redux.

## 6. API boundaries

- **No service layer** for either submodule (confirmed, `docs/reports/2026-11-04/module-docs-inventory.md`; `src/services/order/` does not exist). Both slices call `apiFetcher` directly from their thunks — `LEGACY-COMPATIBILITY` per `.claude/rules/03-api-service.md`, consistent with every endpoint-heavy Redux slice predating the service-location convention; not a module-specific defect.
- **Contract endpoints** (`src/redux/slices/contract.slice.ts`): `GET contracts-agreement` (list), `GET contract-agreement/{id}` (detail — **singular**, `contract-agreement`, vs. the list's plural `contracts-agreement`; CONFIRMED literal strings, not a typo introduced in this document — whether this is an intentional distinct backend path or a frontend defect is **NEEDS-VERIFICATION**, §15), `POST contracts-agreement/download` (CSV export).
- **Loan-order endpoints**: see `LOAN-ORDER-LIST.md` §6 for the full list (list/detail/history/retry/status-transition/adjustment/physical-contract/HPO-sync/export — nine distinct endpoints under `application-requests`/`applications`/`products`).
- **DTOs are typed-only, ambient, no runtime validation** (§8) — per `.claude/rules/03-api-service.md` `## Contracts and errors`, absent Zod on this stable CRUD-shaped API is the default boundary assumption, not a gap; not flagged as one here.
- Errors: each `rejected` thunk clears its slice's list/detail and resets `loading`; a global listener middleware (`contract.middleware.ts`) owns the user-facing failure notification for list/export failures (`contract.middleware.ts:37-47`), not the component itself — same ownership pattern `loan-order-list/` uses (`LOAN-ORDER-LIST.md` §6).

## 7. Forms and validation

- `contract-list/` has **no `Form.useForm` and no AntD `rules=`** anywhere (confirmed by grep across all 5 files) — it is a pure read/list/export surface with one broken confirm action (§4), not a form-bearing submodule.
- All form/validation activity in this module lives in `loan-order-list/`'s six write-action fragments — see `LOAN-ORDER-LIST.md` §7 for the full accounting, including two confirmed validation gaps (an unvalidated date field, an unrequired cancel/reject reason).
- No Zod, no `react-hook-form` anywhere in the module (§3).

## 8. Types and DTO organization

- All domain types are **ambient global `.d.ts` files**, not feature-local — `legacy-compatible`, the same pattern `notifications` uses and `bank-list` does not (`bank-list` is feature-local-only): `src/types/contract.d.ts` (`Contract`, `ContractDetail`, payment types, `PaymentStatus`, `ExportContractList`), `src/types/loan-order.d.ts` (all loan-order-side types, detailed in `LOAN-ORDER-LIST.md` §8), `src/types/Filter.d.ts` (`ContractFilter`, `LoanOrderFilter`), `src/types/pagination.d.ts` (`Pagination`, `PageChangeParams`, `PageCustomerChangeParams`).
- `ExportContractList` (`src/types/contract.d.ts:46`) does not declare `page`/`size`/`filter`/`path`, yet the actual CSV-export call site spreads the full `queryState` object into the request (§4) — a real mismatch between the declared request type and what is sent at the one call site that uses it, confirmed by reading both the type declaration and the call site directly.
- `contract-detail.tsx` declares a component named `ContractDetail` in the same file whose props reference the ambient type also named `ContractDetail` (`contract-detail.tsx:16-20`) — compiles cleanly (different symbol kinds), but is a naming collision worth flagging per the template's category-label convention (§13).

## 9. Permissions

This module references **8** `PERMISSIONS.*` constants total, all defined at `src/constants/permission.constant.ts:191-200`: `CONTRACT_VIEW_CREDIT_CARD`, `CONTRACT_VIEW_CASH_LOAN`, `CONTRACT_EXPORT_CSV_CREDIT_CARD`, `CONTRACT_EXPORT_CSV_CASH_LOAN`, `APPLICATION_VIEW_CREDIT_CARD`, `APPLICATION_VIEW_CASH_LOAN`, `APPLICATION_EXPORT_CSV_CREDIT_CARD`, `APPLICATION_EXPORT_CSV_CASH_LOAN`. This matches `docs/reports/2026-11-04/module-docs-inventory.md`'s recorded count of 8 (CONFIRMED, re-derived independently this session, not merely trusted from the report).

- **Module-scoped grep** (`grep -rn "PERMISSIONS\." src/modules/order/`, re-run this session): 6 call sites total — `list.loan-order.tsx:292` (export, OR array), `loan-order-list/view/loan-order-detail.tsx:790,796` (VIEW, two single-element arrays selected by product line), `list.contract.tsx:273` (export, OR array), `contract-list/view/form.tsx:84,87` (VIEW, two single-element arrays selected by contract type).
- All 8 constants are route/menu-visible too (§2) — unlike `bank-list`'s route/module split, every permission used at the route/menu layer is also re-checked at the component layer here (VIEW constants) or used only at the component layer (EXPORT_CSV constants have no route/menu reference at all — confirmed by the menu/route excerpts in §2, which list only the VIEW pairs). This is the expected shape for a module whose EXPORT action is a feature inside an already-VIEW-gated page, not a discrepancy (per the template's rule 12 guidance on explainable splits).
- **Permission-check kind, confirmed per call site (never inferred from a neighbor):** every one of the 6 call sites is an array — either a 2-member OR array (`list.loan-order.tsx:292`, `list.contract.tsx:273`) or a 1-member array used as a type/product-line-selected branch (`loan-order-detail.tsx:790,796`, `form.tsx:84,87`). **No helper function anywhere in this module** (contrast `notifications`' `checkPermissionNotiAutomatic`) and **no bare single-permission check outside an array literal**.
- **Confirmed gap, not a discrepancy to reconcile:** none of `loan-order-list/`'s seven write actions (retry, call-confirm, reject, cancel, approve, additional-request, adjustment, physical-contract-update, HPO-sync) has any `hasPermission` check of its own — the only `hasPermission` calls in `loan-order-detail.tsx` are the two VIEW checks at mount (`:790,796`). Any user who can reach the detail page (holding either `APPLICATION_VIEW_*` permission) can trigger every one of these writes. Detailed in `LOAN-ORDER-LIST.md` §9/§13; recorded here because it is this module's single most significant permission finding.

## 10. Shared and cross-domain dependencies

Imported **by** this module, from outside it: `@/components/*` (`table-wrapper`, `no-data`, `table-link`, `pagination`, `table-summary`, `table-date-time`, `modal-content`, `forms/search/{loan-order,contract}-searcher.form`, `forms/form-section`, `forms/form-wrapper`, `button`, `icons`, `loan-order-card`+`loan-order-card-status`+`account-type`, `contract-card`+`contract-card-status`+`payment-card-status`, `detail-row`, `date-picker`, `select`, `suffix-input`, `input`, `upload-multiple`, `progress-timeline`, `pdf-worker`); `@/hooks/*` (`modal.hook`, `query-state.hook`, `query.hook`, `form.hook`, `auth.hook`); `@/layouts/form.layout` (`FormLayout`); Redux from outside the module's own two slices (`common.slice`, `required-information.slice`, `product-list.slice`, `layout.slice`, `query.slice`, and the listener middlewares).

Imported **into** other module code **from inside** this module — **none** (confirmed by grep across `src/`, both by this session and the `codebase-analyzer` cross-check: no other `src/modules/*` path imports anything from `src/modules/order/`).

One confirmed hardcoded outbound path, not using a `PageURLs` builder: `loan-order-list/view/contract.tsx:100,128,156,184` link to `/product/parameter/contract-template-list/view/${id}` as a literal string — detailed in `LOAN-ORDER-LIST.md` §10/§13.

## 11. Consumers

No outside module or shared component imports anything this module exports (§10). The only outside references to this module's own code are the four route-level `lazy()` imports in `src/routes/pages.tsx` and the two menu entries (§2) — standard routing/menu wiring, not a feature-level consumer relationship.

## 12. Pattern classification

**Legacy-compatible core, with one confirmed broken action and one real cross-field naming collision — nothing here is presented as authorization to change it (§14 still applies):**

- **State ownership (`legacy-compatible`, correctly so):** both resources remain fully Redux-owned (`contractSlice`, and `loanOrderSlice` in `LOAN-ORDER-LIST.md`) — the `.claude/rules/04-state-management.md` "existing server data already owned by Redux → existing Redux owner until explicit migration" row, not a gap.
- **List-page state (`legacy-compatible`):** global `pageParam` Redux slice rather than URL state, the same pre-existing shared mechanism every list page in the repository uses, not specific to this module.
- **Service location (`LEGACY-COMPATIBILITY`):** direct `apiFetcher` calls inside Redux thunks, no feature or `src/services/order/` service file; `src/services/order/` does not exist for any resource yet.
- **Forms (`legacy-compatible` where used):** AntD `Form`/`FormInstance` only, no RHF, no Zod — consistent with `.claude/rules/05-form.md`; `contract-list/` itself has no forms to classify.
- **Styling (`legacy-compatible`):** Emotion `css` throughout, zero `.module.scss`.
- **i18n (mixed):** most contract-list UI strings go through `t()` (`t('active')`, `t('activateLoanOrder')`, etc. — confirmed at the call sites in §4), but `src/constants/message.constant.ts`'s `LOAN_ORDER_MESSAGE` block (shared by both submodules' notification text) is hardcoded Vietnamese outside `vi.json`/`en.json` (detailed in `LOAN-ORDER-LIST.md` §12) — recorded factually, not flagged as authorization to migrate it.
- **One confirmed defect, not a pattern judgment:** the contract list's bulk activate/deactivate confirm modal has no wired `onConfirm` at all (§4) — this is a functional bug, not a styling/architecture classification.

## 13. Technical risks

1. **Contract bulk activate/deactivate confirm is a no-op** (§4). `list.contract.tsx:107-124` never passes `onConfirm` to the shared `ModalContent`; clicking "Confirm" does nothing — no dispatch, no modal close. A user believes they activated/deactivated a contract and nothing happened.
2. **Permission-ungated write actions on loan orders** (§9) — every one of the seven write actions in `loan-order-list/` (retry/call-confirm/reject/cancel/approve/additional-request/adjustment/physical-contract-update/HPO-sync) is reachable by anyone holding route-level VIEW permission alone. Full detail in `LOAN-ORDER-LIST.md` §13 item 1; recorded here as this module's top risk because it spans both submodules' trust model.
3. **Contract CSV export may not honor list filters.** `list.contract.tsx:241`'s export call spreads the raw nested `queryState` object rather than a flattened filter object into the request body, and the declared `ExportContractList` request type (`src/types/contract.d.ts:46`) does not even declare the fields being sent (§4, §8) — **LIKELY** the backend receives a shape it cannot parse into filters, not settled from source alone (§15).
4. **Singular/plural endpoint mismatch** (§6): contract list uses `contracts-agreement` (plural) but contract detail uses `contract-agreement` (singular) — confirmed literal strings; whether this is two intentionally distinct backend routes or a frontend copy-paste defect is `NEEDS-VERIFICATION` (§15).
5. **Three independent pagination/sort mechanisms coexist for one submodule's data** (§4, §5): global `pageParam` (list page/filter/sort), `contractSlice.pagination` (list total only), and per-tab local `useState` (payment schedule/history, client-side). Not a correctness bug by itself, but three different state-ownership answers for "what page am I on" inside one submodule is a maintenance hazard if a future change assumes a single owner.
6. **Naming collision** (§8): the `ContractDetail` component (`contract-detail.tsx`) and the ambient `ContractDetail` type (`src/types/contract.d.ts:13`) share a name. Compiles fine today; a future refactor that imports both into the same scope without an alias will not.
7. **Cancel-button label/behavior mismatch** (§4): `form.tsx:168`'s cancel button reads "Kích hoạt" ("Activate") while its handler simply navigates back to the list (`:170`) — confusing, `NEEDS-VERIFICATION` whether intentional (§15).
8. See `LOAN-ORDER-LIST.md` §13 for the full, longer list of `loan-order-list/`-specific risks (an inverted activate/deactivate notification message, unawaited dispatches, export field-name mismatches, a dead file, retry-polling without a failure exit, and more) — not duplicated here to keep this overview's own risk list focused on what spans or is specific to the shared/contract-list layer.

## 14. Areas to avoid touching

- `src/redux/slices/contract.slice.ts` and `contract.middleware.ts` — shared by both the list and detail pages; any change to `contractSlice.pagination` affects both.
- `src/components/modal-content.tsx` — shared by roughly 130 other call sites across the repository (confirmed by the grep run for §4); do not special-case its `onConfirm?.()` optional-call behavior to "fix" the contract no-op without a repository-wide consumer audit.
- `src/redux/slices/query.slice.ts`/`useQueryState()` — shared by both submodules here and roughly 50+ other files repository-wide (per the `codebase-analyzer` cross-check); any change to its reset-on-path-change behavior affects every list page in the application.
- `src/types/contract.d.ts`/`src/types/Filter.d.ts` — ambient globals; a type correction (e.g. adding the missing fields to `ExportContractList`) must be checked against every consumer of these files, not assumed to be contract-list-only.
- See `LOAN-ORDER-LIST.md` §14 for `loan-order-list/`-specific areas to avoid.

## 15. Open questions

- `NEEDS-VERIFICATION`: whether the contract bulk activate/deactivate action (§4, §13) was ever functional, or has always lacked a wired `onConfirm` — this determines whether fixing it restores a regressed feature or implements one that was never finished.
- `NEEDS-VERIFICATION`: whether the contract CSV export's unflattened `queryState` payload (§4, §13) actually fails to filter server-side, or the backend tolerates the nested shape — not exercised at runtime.
- `NEEDS-VERIFICATION`: whether `contract-agreement/{id}` (singular) and `contracts-agreement` (plural, §6) are two genuinely distinct backend routes or a frontend typo in one of the two call sites.
- `NEEDS-VERIFICATION`: whether the "Kích hoạt" cancel-button label in the contract detail form (§4, §13) is an intentional (if confusing) label or a copy-paste leftover.
- `NEEDS-TEAM-DECISION`: whether any of `loan-order-list/`'s seven write actions should gain their own permission check beyond route-level VIEW (§9, §13) — not resolved here; see `LOAN-ORDER-LIST.md` §15 for the full list of that submodule's open questions.
