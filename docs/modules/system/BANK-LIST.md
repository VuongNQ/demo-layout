# Bank List — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq`, clean tree (`git status --porcelain` empty).
- Date: 2026-11-04.
- Method: static source inspection only (`find`, `grep`, `Read`, plus one read-only `codebase-analyzer` cross-check, both independently reading the same 10 files and the surrounding route/permission/menu wiring). No runtime, browser, auth, or backend verification was performed.
- Scope: `src/modules/system/bank-list/` (10 files, `find src/modules/system/bank-list -type f | wc -l`), plus the parts of `src/routes/`, `src/helpers/menus.helper.ts`, `src/constants/permission.constant.ts`, `src/utils/navigate.ts`, and `src/modules/system/master-data.system.tsx` that reach or gate this module. This is the first **fully Query-owned** module documented under this template (no Redux slice owns any part of this resource) and `docs/modules/system/OVERVIEW.md` does **not exist yet** — this document currently stands alone under `system/`; the rest of `system` (9 other submodules, `theme-management/`'s two stale documents) is a separate, larger effort, not undertaken here.
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. The exact backend contract for all 4 endpoints in §6 (pagination base, `sort` string format, `active` filter semantics, update response shape, error envelope/codes) — only the frontend call sites were read.
  2. Whether the shared "master data" landing page (`master-data.system.tsx`) actually returns a `BANK` row from its backend, and therefore whether the unguarded link to this module (§2) is reachable in practice.
  3. Runtime save-button spin duration: the update mutation's `onSuccess` awaits two `invalidateQueries` calls before resolving, so the Save button's loading state is tied to a background refetch, not just the write — not executed (§4, §13).
  4. Whether a background refetch with changed detail data would ever overwrite in-progress, uncommitted edits in the modal (the reset effect is keyed on the `bank` object reference, and TanStack's structural sharing usually keeps that reference stable when the response is deep-equal, but this was not exercised at runtime).
  5. Whether the backend's `currentPage` is genuinely 0-based (the UI assumes so: `pageInfo.currentPage + 1` for the AntD pagination control).

## 1. Responsibility

Admin screen for the bank master list ("Danh sách ngân hàng" — banks a customer can select for a loan disbursement/repayment account). One list page with an edit-capable detail modal; there is no create or delete flow, and no separate read-only view mode (`src/modules/system/bank-list/BankList.tsx:34-302`, `components/BankInfoModal.tsx:51-355`):

- **List** — paginated, server-side search (free-text keyword + active/inactive status), server-side sort on 3 columns.
- **Inline status toggle** — activate/deactivate a bank directly from the table row, with a confirm dialog when deactivating.
- **Detail/edit modal** — opened by clicking a bank's name; edits `appBankName`, `displayOrder` (1–999), and `active`. The modal is editable whenever the user holds `BANK_EDIT`; there is no separate view-only rendering of the same modal.

## 2. Entry points and routes

- **Lazy export:** `src/routes/pages.tsx:170` — `export const BankList = lazy(() => import('@/modules/system/bank-list/BankList'));`.
- **Route (CONFIRMED, `src/routes/main.routes.tsx:146-148`):** path `withPrefix('system-management/master-data/bank')`, element `<WithGuard Page={BankList} Guard={AuthGuard} permissions={[PERMISSIONS.BANK_VIEW]} />` — a single permission, not an OR array (the array has one element). Import at `main.routes.tsx:56`. This is the module's **only** `<Route>`; it lives in `main.routes.tsx` (`MainLayout`), not `form.routes.tsx` — there is no create/edit sub-route to put in `form.routes.tsx`.
- **Route counts (CONFIRMED):** `grep -oE "<Route($|[ >/])" src/routes/main.routes.tsx | wc -l` = 69; same pattern on `src/routes/form.routes.tsx` = 113. Neither count is specific to this module — bank-list contributes exactly 1 of the 69.
- **`PageURLs` builder:** `src/utils/navigate.ts:59-61`, `ofSystemBanks()` → `/system-management/master-data/bank`, matching the route's literal path. (The `<Route path>` declaration itself uses the literal string rather than calling the builder — this is the repository-wide convention for every route declaration, confirmed against `notifications`' routes in `docs/modules/notifications/OVERVIEW.md` §2; it is not specific to this module and is not a defect.)
- **Only one real entry point, and it is not owned by this module (CONFIRMED):** this module has **no menu entry of its own**. The only path into it, besides a direct URL, is a row in the shared "master data" landing page, `src/modules/system/master-data.system.tsx` (a loose file directly under `src/modules/system/`, not part of `bank-list/`):
  - That page's own route (`main.routes.tsx:126-134`) is gated by an **OR array** of two permissions, `[PERMISSIONS.ADMINISTRATIVE_UNIT_VIEW, PERMISSIONS.BANK_VIEW]` (`:131`) — holding either permission reaches the landing page.
  - Its row-link logic (`master-data.system.tsx:40-45`) sets `link = PageURLs.ofSystemBanks()` whenever a row's `code === 'BANK'`, with **no permission check on that specific link** — only `item.code` is inspected. A user who holds `ADMINISTRATIVE_UNIT_VIEW` but not `BANK_VIEW` would see and double-click the row (`:130-134`) and then be redirected to the 404 page, because `GuardedPage` (`src/guards/index.tsx:27-33`) evaluates `permissions.some(...)` against `[BANK_VIEW]` at the bank route itself and navigates to `PageURLs.of404()` on failure. This is a real, confirmed code path, not a hypothetical (§13).
  - The landing page's rows come from `getMasterData`/`administrative-unit.slice.ts` (`master-data.system.tsx:15-18,29-34`) — a different Redux-owned resource, unrelated to this module. Whether the backend actually returns a `BANK` row is `NEEDS-VERIFICATION` (§0).
- **Menu (CONFIRMED, `src/helpers/menus.helper.ts:551`):** the only menu reference to anything relevant here is the landing page's own entry, "Danh mục dùng chung" (`Menu.commonCategories`), `requiredPermissions: [PERMISSIONS.ADMINISTRATIVE_UNIT_VIEW, PERMISSIONS.BANK_VIEW]` — the same OR array as the landing page's route. There is no separate "Bank List" menu item anywhere (`grep -i bank src/helpers/menus.helper.ts` returns only this one line).
- **Breadcrumb special-case (CONFIRMED, `src/helpers/breadcrumbs.helper.ts:58-82`):** because the bank path isn't in the menu tree, the breadcrumb helper has a hardcoded fallback specifically for `PageURLs.ofSystemBanks()` (and for `ofAdministrativeUnits()`), rendering the label via `t('Menu.bankList')` (`src/lang/vi.json:12` = "Danh sách ngân hàng", `src/lang/en.json:108` = "Bank list").
- **No outside consumers of this module's own exports** (`grep -rn -E "bank-list|BankList|BankInfoModal|bankQueries|bankQueryKeys|bankService|BANK_" src/` outside the module returns only the route/menu/permission/i18n wiring already listed above, plus unrelated `BANK_ACCOUNT`/`OPEN_HDBANK_ACCOUNT` strings elsewhere in the codebase).

## 3. Directory map

`find src/modules/system/bank-list -type f | sort` → 10 files.

```text
src/modules/system/bank-list/
|-- BankList.tsx                        # page: list via useQueryState, table, inline status toggle, pagination, mounts the modal
|-- constants.ts                        # status labels, error codes, user-facing message strings (all hardcoded Vietnamese)
|-- types.ts                            # feature-local entity/filter/query/DTO/error types
|-- components/
|   |-- BankInfoModal.tsx               # detail/edit modal: detail query, AntD form, save, discard confirm
|   |-- BankSearcherForm.tsx            # keyword/status search bar, local draft state synced from list state
|   |-- BankDetailSkeleton.tsx          # static AntD Skeleton layout for the modal's loading state
|   `-- BankInfoModal.styles.ts         # Emotion css objects for the modal/form/footer/skeleton + one <Global> block
|-- hooks/
|   `-- bankQueries.ts                  # 2 useQuery + 2 useMutation hook exports (TanStack Query)
|-- queryKeys/
|   `-- bank.query-keys.ts              # key factory, keys only — imports only types, not services/
`-- services/
    `-- bank.service.ts                 # bankService (4 ApiFetcher calls) + normalizeBankApiError
```

No Redux files, no `.module.scss`, no Zod files anywhere in this module (all confirmed, §5/§6/§8).

## 4. Main runtime flows

### Flow A — list load, search, sort, paginate

(CONFIRMED, `BankList.tsx`, `bank.query-keys.ts`, `bank.service.ts`)

1. List state (page/pageSize/filter/sort) lives in the **global Redux slice `pageParam`** (`src/redux/slices/query.slice.ts`), read/written through `useQueryState()` (`src/hooks/query-state.hook.ts`) — not URL state. `applyNewPath` resets this slice to its initial value whenever the current pathname differs from the slice's stored `path` (`query.slice.ts:26-30`), and the slice has no persistence middleware (`grep -n "localStorage\|persist" src/redux/slices/query.slice.ts src/redux/store.ts` — no match), so filter/sort/page are lost on a full page reload and reset when navigating away and back — **CONFIRMED**, not left open.
2. `listParams` (`BankList.tsx:44-52`) feeds `useBankListQuery(listParams, isCurrentPath())` (`:53`). `isCurrentPath()` is `location.pathname === queryState.path` (`query-state.hook.ts:28-30`) — the query is disabled until the path-sync effect has run once.
3. `bankQueryKeys.list(params)` (`queryKeys/bank.query-keys.ts:3-17`) normalizes `keyword` (trimmed), `status` (`'ALL'` → `undefined`), `page`, `size`, `sort` before using them as the key — two differently-ordered-but-equivalent filter objects still produce the same cache entry.
4. `bankService.getList` (`services/bank.service.ts:43-62`) calls `GET api/admin/portal/v1/banks` with query params `keyword`, `active` (`'ACTIVE'`→`true`, `'INACTIVE'`→`false`, else omitted), `page`, `size`, `sort`, forwarding the TanStack `AbortSignal`. The raw `BankPageApiResponse` (`currentPage`/`pageSize`/`totalElements`/`totalPages`/`content`) is mapped to `{ items, pageInfo }` in the same function (`:64-72`).
5. Search: `BankSearcherForm`'s own `onFinish` (`components/BankSearcherForm.tsx:37`) calls back into `BankList.handleSearch` (`BankList.tsx:75-85`), which writes `saveQueryParams({ page: 0, filter })` — resetting to page 0 on every new search.
6. Sort: `handleTableChange` (`:153-169`) takes only the first sorter when AntD reports an array, writes `"<field>,<asc|desc>"`, and also resets to page 0. Columns `displayOrder`, `appBankName`, `updatedDate` are server-side sortable (`sorter: true`, `:182,199,218`); the rest are not.
7. Errors: `listQuery.isError` triggers a `LIST_FAILED` toast via the global `notification.slice` (`:64-73`), the same slice every other module uses for toasts.

### Flow B — view/edit one bank via the modal

(CONFIRMED, `components/BankInfoModal.tsx`)

1. Clicking a bank's name sets `selectedBankId` in local state (`BankList.tsx:201-212`); `BankInfoModal` is always mounted with `open={selectedBankId !== null}`.
2. `useBankDetailQuery(bankId, open)` (`hooks/bankQueries.ts:24-32`) fetches `GET api/admin/portal/v1/banks/{id}`, enabled only while the modal is open and `id` is a positive safe integer.
3. On detail error, the modal shows a `DETAIL_FAILED` toast and **closes itself** (`BankInfoModal.tsx:72-82`) — it does not stay open in an error state.
4. An effect keyed on `[bank, form, open]` calls `form.resetFields()` then `setFieldsValue(...)` every time the `bank` object reference changes (`:84-94`) — this is the mechanism behind the open §0 question about background-refetch overwrite risk.
5. Save is shown only when `canEdit && bank && !isDetailLoading` (`:224`), and is disabled unless `canSubmit` — which independently re-derives the same name-length and priority-range constraints already expressed as AntD `rules` (§8, §13).
6. `handleUpdate` (`:142-181`) calls `updateBank({ id, request })` → `PUT api/admin/portal/v1/banks/{id}`. On success it classifies the change as status-only vs. a real edit (`:158-166`) to pick the toast message, then closes the modal. On failure, `handleUpdateError` (`:113-140`) either sets an AntD field error on `appBankName` (duplicate-name case) or shows a toast (every other case), and the modal stays open.
7. Cache sync after save: see §6/§7 — both mutations invalidate the list-prefix and the one detail key, awaited before the mutation promise resolves.

### Flow C — inline activate/deactivate from the table row

(CONFIRMED, `BankList.tsx:103-151,237-245`)

1. The row's `Switch` `onChange` ignores the AntD-supplied checked value and always calls `handleToggleStatus(record)`.
2. Activating an inactive row calls `updateStatus(record, true)` immediately. Deactivating an active row opens `Modal.confirm` (reusing the same `bank-discard-confirm` global CSS class name as the modal's own discard-confirm dialog, `BankInfoModal.styles.ts:204-228`) and only calls `updateStatus(record, false)` on confirmation.
3. `updateStatus` calls `updateBankStatus` → `PUT api/admin/portal/v1/banks/{id}/status` with `{ active }`. Success shows `STATUS_UPDATE_SUCCESS`; failure routes through the same `notifyUpdateError` helper as the modal's duplicate-name/last-active error handling (§13, a near-duplicate of the modal's own error logic).
4. The switch is **not optimistic** — its `checked` value follows the query cache, so it visually reverts to the pre-click state until the mutation's cache invalidation triggers a refetch and that refetch resolves.

## 5. State ownership

| State | Owner | Registered? |
| --- | --- | --- |
| Bank list + detail server data | **TanStack Query only** — `useBankListQuery`/`useBankDetailQuery` (`hooks/bankQueries.ts:15-32`) | No Redux slice exists for this resource — `grep -rni "bank" src/redux/` returns **zero matches** (CONFIRMED, both independently by this session and by the `codebase-analyzer` cross-check). This is the repository's first module documented under this template with sole Query ownership and no Redux shadow. |
| Save / status-change mutations | TanStack Query — `useUpdateBankMutation`, `useUpdateBankStatusMutation` (`hooks/bankQueries.ts:34-80`) | — |
| List page / filter / sort | Global Redux slice `pageParam` (`src/redux/slices/query.slice.ts`) via `useQueryState()` — **not URL state**, despite `.claude/rules/04-state-management.md`'s "shareable tab/filter/sort/page → URL state" preference for new work; this module reuses the pre-existing shared mechanism every other list page in the repository also uses | `legacy-compatible`, not a defect specific to this module |
| `appBankName`, `displayOrder`, `active` edit fields | AntD `Form`/`FormInstance` — one `Form.useForm<BankFormValues>()` in `BankInfoModal.tsx:57` | `bankBrandCode`/`bankCode` are rendered as disabled plain `<Input>` elements (`:249-256`), not form fields — they are read-only metadata, never submitted |
| Search draft (`keyword`, `status`) before submit | Local React `useState` in `BankSearcherForm.tsx:18-19`, synced from the committed `pageParam` filter via an effect | `BankSearcherForm` has no `Form.useForm` of its own despite wrapping a plain `<Form>` element for its `onFinish` submit handler |
| `selectedBankId` (which bank's modal is open), `submitErrorField` | Local React `useState` (`BankList.tsx:38`, `BankInfoModal.tsx:65-67`) | — |

No server resource in this module has two authoritative owners — this is a clean target-direction case for `.claude/rules/04-state-management.md`'s "a server resource must not have two independent authoritative owners," unlike `notifications`' mixed picture documented in `docs/modules/notifications/OVERVIEW.md` §5.

## 6. API boundaries

- **`services/bank.service.ts`** (feature-local, read in full) is `LEGACY-COMPATIBILITY` per `.claude/rules/03-api-service.md` `## Service location`, not a violation: this module's first commit (`git log --oneline --follow -- src/modules/system/bank-list/BankList.tsx` → `0f5e5f62 feat/2479 Bank list`) predates the 2026-10-29 service-location adoption date recorded in `.claude/PROJECT_CONTEXT.md`. The target location would be `src/services/system/`, which **does not exist** (`ls src/services/` → `contents/ products/ users/ index.ts`); `src/services/system/bank.service.ts` has not been created.
- Four `window.apiFetcher` calls, all in this one file, base path `api/admin/portal/v1/banks` (`:11`):

  | Method | Endpoint | Notes |
  | --- | --- | --- |
  | GET | `banks` | query: `keyword`, `active` (derived from `status`), `page`, `size`, `sort`; forwards `AbortSignal` |
  | GET | `banks/{id}` | detail fetch, forwards `AbortSignal` |
  | PUT | `banks/{id}` | full edit (`appBankName`, `displayOrder`, `active`); errors normalized |
  | PUT | `banks/{id}/status` | status-only toggle, `{ active }` body; errors normalized |

- **DTOs are typed-only, no runtime validation** — `grep -rl "zod" src/modules/system/bank-list/` returns no match, and per `.claude/rules/03-api-service.md` `## Contracts and errors`, an absent Zod parse on this stable, known CRUD-shaped API is the default boundary assumption, not a gap; this document does not flag it as one.
- `normalizeBankApiError` (`bank.service.ts:16-40`) reads `error.response.data.{code,message}`/`errorCode`/`response.status` defensively via an `isRecord` type guard, falling back to a generic failure message, and is called from both `update` and `updateStatus`'s `catch` blocks (`:88,102`) as well as redundantly again in the two UI call sites (§13).

## 7. Forms and validation

- One `Form.useForm` call site (`BankInfoModal.tsx:57`); `BankSearcherForm` renders a plain `<Form>` for its submit handler but has no `Form.useForm`/`Form.Item name=` fields of its own — its values live in local `useState`.
- AntD `rules={[...]}` (confirmed with `grep -n "rules={" src/modules/system/bank-list/`, **2 sites**, both in `BankInfoModal.tsx`): `appBankName` required (`:265-270`); `displayOrder` required plus a custom validator enforcing an integer 1–999 (`:280-301`). No Zod anywhere in this module.
- **Validation is duplicated, not just expressed twice in the same place:** `canSubmit` (`:110-111`) independently re-derives `hasValidName` (non-empty, trimmed length ≤ 100, `:108-109`) and `hasValidPriority` (integer, 1–999, `:103-107`) to decide whether to enable the Save button — the exact same constraints already enforced by the AntD `rules` above and by `maxLength={100}` on the name input (`:272`). A future range/length change made in one place and not the other would silently desync the Save-button-enabled state from the field-level validation message.
- `isDirty` (`:96-101`) is derived by comparing `Form.useWatch` values against the fetched `bank` record (trimmed name comparison; numeric-vs-string-aware priority comparison via `getPriorityValue`, `:48-49`).

## 8. Types and DTO organization

- `types.ts` is entirely feature-local — no ambient/global declarations, unlike `notifications`' ambient-global pattern (`docs/modules/notifications/OVERVIEW.md` §8).
- A real response-DTO-to-UI-shape mapping exists: `BankPageApiResponse` (raw backend page envelope, `:39-45`) is mapped to `BankListApiResponse` (`{ items, pageInfo }`, `:34-37`) inside `bank.service.ts:64-72` — not an identity passthrough.
- `BankRecord` (`:3-14`) is reused as-is for list rows and the detail fetch. `BankUpdateApiRequest`/`BankStatusUpdateApiRequest` (`:47-55`) are explicit write DTOs, distinct from `BankRecord`.
- `BankFormValues` (modal's own form shape, `displayOrder: number | string` to tolerate the AntD numeric-input's string intermediate state) is declared locally in `BankInfoModal.tsx:39-43`, not in `types.ts` — form-to-request mapping happens inline at submission (`:150-154`), not through a shared mapper file.
- `BankApiError = Error & { status?: number; code?: string }` (`types.ts:57-60`) is the one error-shape type, constructed by `normalizeBankApiError`.

## 9. Permissions

This module references only **2** `PERMISSIONS.*` constants in total, both defined at `src/constants/permission.constant.ts:298-299`: `BANK_VIEW: 'bank:view'`, `BANK_EDIT: 'bank:edit'`. Per the template's rule that a module's permissions are frequently enforced outside its own directory, both a module-scoped and a repository-wide count were taken, and here they diverge meaningfully — not just by the one-constant gap seen in `notifications`:

- **Module-scoped** (`grep -rn "PERMISSIONS\." src/modules/system/bank-list/`): **2 matches, both `BANK_EDIT`** (`BankList.tsx:39`, `BankInfoModal.tsx:59`). `BANK_VIEW` is **never referenced inside the module directory at all.**
- **Route/menu-scoped:** `BANK_VIEW` appears 3 times outside the module — `main.routes.tsx:131` (paired with `ADMINISTRATIVE_UNIT_VIEW` in an OR array, gating the shared landing page, §2), `main.routes.tsx:147` (gating this module's own route, alone), `menus.helper.ts:551` (same OR pairing as `:131`, gating the landing page's menu entry). `form.routes.tsx` has no bank reference at all.

**This is not a discrepancy to reconcile — it is the expected shape for a view-gated-at-the-route, edit-gated-in-component module:** `BANK_VIEW` is a route/menu-level gate only (nothing inside the module needs to re-check "can I see this page" once it has already rendered), while `BANK_EDIT` is checked twice inside the module to drive field-level disabled states and to block the two mutation call paths. Both permissions are real, and the full set of 2 is already small enough that the template's >10-constant/recurring-array table threshold does not apply here — no named-group table is used in this section, unlike `notifications`' 32-constant case.

Permission-check kind, confirmed per the template's new rule (never inferred from a neighbor):

- `BankList.tsx:39` — `hasPermission([PERMISSIONS.BANK_EDIT])`: a single-permission array (OR semantics with one member is equivalent to a plain boolean check here).
- `BankInfoModal.tsx:59` — same single-permission form, same constant.
- `main.routes.tsx:131`/`menus.helper.ts:551` — a genuine 2-member OR array (`ADMINISTRATIVE_UNIT_VIEW` or `BANK_VIEW`).
- `main.routes.tsx:147` — a single-permission array (`[BANK_VIEW]`), same form as the component-level checks, not a helper function.
- No call site in this module uses a helper function (contrast `notifications`' `checkPermissionNotiAutomatic`, `docs/modules/notifications/OVERVIEW.md` §9).

`canEdit` gates: name input, priority input, status switch (both the modal's and the table row's), the modal's Save button's visibility, and both mutation-triggering handlers (`handleUpdate`, `handleToggleStatus`).

## 10. Shared and cross-domain dependencies

Imported **by** this module, from outside it:

- `@/components/*` — `no-data`, `pagination` (`CustomPagination`), `switch` (wraps AntD `Switch`, remaps `value`→`checked`), `table-date-time`, `table-wrapper`, `titles/table.title`, `button`, `input` (used both as `Input` in the searcher and, via its `isNumber` mode, as a numeric input in the modal), `select` — ordinary shared-component reuse, no concerns.
- `@/hooks/*` — `auth.hook` (`useHasPermission`), `query-state.hook` (`useQueryState`) — ordinary shared-infrastructure reuse.
- `@/redux/hooks` (`useAppDispatch`) and `@/redux/slices/notification.slice` (`setNotification`, the same global toast slice every module uses) — ordinary, not a module-specific dependency; transitively also reads `query.slice` (via the hook) and `auth.slice` (via `useHasPermission`).
- `@/utils/common` (`cleanFalsyValueFilters`), `@/constants/pagination.constant`, `@/constants/permission.constant`, plus `dayjs`, `@emotion/react`, `antd` as ordinary library dependencies.

Imported **into** shared/other-module code **from inside** this module — **none** (`grep -rn -E "bank-list|BankList|BankInfoModal|bankQueries|bankQueryKeys|bankService|BANK_" src/` outside the module returns only route/menu/permission/i18n wiring, confirmed by both this session and the `codebase-analyzer` cross-check). This module has no reverse-dependency risk comparable to `notifications`' `loan-order-searcher.form.tsx`/`text-editor/index.tsx` findings (`docs/modules/notifications/OVERVIEW.md` §10).

**Cross-domain dependency in the other direction (CONFIRMED, §2):** the shared "master data" landing page, `src/modules/system/master-data.system.tsx` — a different module's file, owned alongside `administrative-unit/` rather than by this module — is this module's only real navigational entry point, and it links to `PageURLs.ofSystemBanks()` without separately checking `BANK_VIEW` on that specific link (§13).

## 11. Consumers

No outside module or shared component imports anything this module exports (§10). The only outside reference to this module's own code is the route-level `lazy()` import in `src/routes/pages.tsx:170`, which is the standard routing wiring every lazy page goes through, not a feature-level consumer relationship.

## 12. Pattern classification

**Mixed — target-compatible in its core state/server-data architecture, legacy-compatible in service location and list-state mechanism, non-compliant on i18n:**

- **State ownership (target-compatible):** sole TanStack Query ownership of the bank resource, zero Redux duplication (§5) — this is exactly the "server data for a new feature/resource → TanStack Query" row of `.claude/rules/04-state-management.md`'s decision table, and the "a server resource must not have two independent authoritative owners" rule is satisfied cleanly, unlike `notifications`.
- **Query key factory (mixed, not a violation):** `queryKeys/bank.query-keys.ts` is keys-only — it imports only `BankListApiQuery` as a type, never `services/` or `@tanstack/react-query` itself — and does not use the `queryOptions(...)`-colocating shape `.claude/rules/03-api-service.md` names as the expected pattern for new feature-owned resources. That same rule explicitly lists `scheme-sync` and `splash-screen` as keys-only exceptions to that expected shape; `bank-list` is a further instance of the same keys-only pattern, not a newly-discovered violation.
- **Service location (`LEGACY-COMPATIBILITY`):** feature-local `services/bank.service.ts`, predating the 2026-10-29 service-location adoption (§6); `src/services/system/` does not exist yet for any module.
- **Forms (target-compatible):** AntD `Form`/`FormInstance` as the sole form-state owner, no RHF, consistent with `.claude/rules/05-form.md`.
- **List-page state (`legacy-compatible`):** global Redux `pageParam` slice rather than URL state (§5) — this is the pre-existing, shared mechanism essentially every list page in the repository uses, not a bank-list-specific deviation, but it is not the `.claude/rules/04-state-management.md`-preferred URL-state pattern for new/shareable list state either.
- **Styling (`legacy-compatible` per `.claude/rules/10-styling.md`):** Emotion `css` throughout, plus one `<Global>` block for AntD `Modal.confirm` override classes — no `.module.scss` anywhere in this module.
- **i18n (not compliant with `.claude/rules/11-i18n.md`, worth naming plainly rather than softening):** every UI string in this module is a hardcoded Vietnamese literal (`grep -n "t('" src/modules/system/bank-list/` style check — no `t()` call anywhere in the module). `.claude/rules/11-i18n.md` expects a new module's labels to live in `vi.json`/`en.json` behind `t()`. **LIKELY**, not `CONFIRMED`, that this is a gap rather than a `legacy-compatible` exemption: this module's first commit is dated 2026-10-21 (`git log --follow --format="%ai" -- src/modules/system/bank-list/BankList.tsx`), but `.claude/rules/11-i18n.md` itself carries no dated note, and `.claude/` is gitignored in this checkout (`.gitignore:38`), so its adoption date cannot be established from `git log` the way the service-location date was (§6). The file's on-disk mtime (`stat`) is 2026-11-03, which only reflects when this checkout last touched the file, not when the rule was authored or adopted — not usable as evidence either. What would settle this: the commit history of `.claude/rules/11-i18n.md` in whichever repository (if any) actually tracks `.claude/`, or a dated note inside the rule file itself. Until settled, this is recorded as a real current-state fact (zero `t()` usage) with a `LIKELY`, not `CONFIRMED`, characterization of it as a gap rather than a pre-existing exemption — the finding itself stands either way (§14 still applies).

Nothing above is presented as a defect except the i18n point, which is a documented current-state fact against an existing, applicable rule, not a judgment call this document is making on its own.

## 13. Technical risks

1. **Unguarded navigational entry point from another module** (§2, §10). `master-data.system.tsx:40-45` renders a clickable link to this module's route without checking `BANK_VIEW` on that link — only the landing page's own route-level OR gate (`ADMINISTRATIVE_UNIT_VIEW` or `BANK_VIEW`) stands between "can see the landing page" and "can click through to a 404." A user holding only `ADMINISTRATIVE_UNIT_VIEW` reaches the landing page, sees a bank row (if the backend returns one, `NEEDS-VERIFICATION`), and is redirected to `PageURLs.of404()` on click via `GuardedPage` (`src/guards/index.tsx:27-33`) — a confirmed code path, not hypothetical.
2. **No explicit `staleTime` anywhere in this module** (`grep -n "staleTime\|CACHE_STALE_TIME" src/modules/system/bank-list/` — no match); `src/providers/query.provider.tsx` sets no global `staleTime` either, so the TanStack default of `0` applies. Every mount of the list or the modal refetches, and `.claude/rules/03-api-service.md`'s "SHOULD set an explicit `staleTime`" guidance for paginated list queries is unmet here. This is a `SHOULD`, not a `MUST`, so it is recorded as a gap, not a violation.
3. **Save-button spinner is coupled to a background refetch, not just the write.** Both mutations' `onSuccess` (`hooks/bankQueries.ts:45-54,69-78`) `await Promise.all([invalidateQueries(lists()), invalidateQueries(detail(id))])` before the mutation promise resolves, and the modal's `await updateBank(...)` (`BankInfoModal.tsx:157`) sits on top of that — so the "Lưu" button's loading spinner likely persists until the subsequent list/detail refetch completes, not just until the PUT returns. Runtime duration not measured (`NEEDS-VERIFICATION`, §0).
4. **Validation duplicated across two independent code paths** (§7): the Save-button-enabled calculation re-implements the same name-length and priority-range rules already expressed as AntD `rules`. A future constraint change applied to only one of the two would desync the enabled state from the inline field error message.
5. **Error-normalization logic duplicated three times**, not one shared path: `bank.service.ts` normalizes once at the throw site (`:88,102`), then both `BankInfoModal.handleUpdateError` (`:113-140`) and `BankList.notifyUpdateError` (`:87-101`) independently re-derive the same `BANK_NAME_DUPLICATED`/`LAST_ACTIVE_...`-branching display logic for their own call sites, including a generic fallback string that is itself duplicated as a literal in both the service (`:33`) and `constants.ts:30`.
6. **Non-optimistic inline status toggle** (§4 Flow C): the table row's switch visually reverts to its pre-click state until the mutation's cache invalidation triggers and resolves a fresh list fetch, which — combined with risk 2's lack of `staleTime` — could read as unresponsive on a slow connection, though this is a UX observation, not a correctness defect.
7. **List/filter/sort state lives in Redux, not the URL** (§5) — a user cannot share, bookmark, or reload-and-keep a filtered/sorted/paginated view of this list; `applyNewPath` resets the shared `pageParam` slice on every path change, and a full page reload clears Redux entirely (confirmed, no persistence middleware).
8. **`BANK_STATUS_FILTER` (`constants.ts:3-7`) is defined but unused inside this module** (confirmed by both this session and the `codebase-analyzer` cross-check reading every file) — a small dead-export risk, not a behavior risk. Checked and confirmed unused outside the module too: `grep -rn "BANK_STATUS_FILTER" src/` returns exactly one match, its own declaration — the same §10 grep (which includes the `BANK_` pattern) would have caught an outside import of this named export, and found none.

## 14. Areas to avoid touching

- `src/modules/system/master-data.system.tsx` and `src/redux/slices/administrative-unit.slice.ts` — not owned by this module; they supply this module's only real navigation entry point (risk 1). Fixing the unguarded-link risk, if ever authorized, touches that file, not this module's own files.
- `hooks/bankQueries.ts`'s two mutation `onSuccess` invalidation blocks — any change to cache-sync behavior affects both the modal's save flow and the list's status-toggle flow simultaneously (risk 3); they currently share the exact same two-key invalidation shape.
- `src/guards/index.tsx`'s `GuardedPage` permission-check/404-redirect behavior — shared by every guarded route in the repository, not specific to this module; do not special-case it for the unguarded-landing-page-link risk without a repository-wide review.
- The global `bank-discard-confirm`/`bank-discard-confirm-ok`/`bank-discard-confirm-cancel` CSS class names (`BankInfoModal.styles.ts:204-228`, injected via `<Global>`) are shared between the modal's own discard-confirm dialog and the table's deactivate-confirm dialog (`BankList.tsx:133`) — renaming or restyling one affects both.

## 15. Open questions

- `NEEDS-VERIFICATION`: whether the "master data" landing page's backend response ever actually includes a `BANK` row, which determines whether risk 1 (§13) is reachable through the UI at all today or only through a direct URL.
- `NEEDS-VERIFICATION`: the exact duration/UX impact of the save-button spinner being coupled to a post-write refetch (risk 3) — not measured at runtime.
- `NEEDS-VERIFICATION`: whether a background refetch of the bank detail query, while the modal is open with unsaved edits, can ever actually replace the `bank` object reference with changed data and silently discard those edits via the `form.resetFields()` effect (§4 Flow B, point 4) — TanStack's structural sharing usually prevents this when the response is unchanged, but was not exercised here.
- `NEEDS-VERIFICATION`: whether the backend's `currentPage` field is genuinely 0-based, since the UI's pagination control assumes so (`pageInfo.currentPage + 1`).
- `NEEDS-TEAM-DECISION`: whether this module's hardcoded-Vietnamese-only UI text (§12) should be migrated to `t()`/`vi.json`/`en.json` now, given `.claude/rules/11-i18n.md` expects this of modules created after that rule existed, or left as-is pending a broader system-area i18n pass. Not resolved here.
