# Maintenance — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq`, clean tree (`git status --porcelain` shows only unrelated in-progress changes elsewhere in the repo).
- Date: 2026-11-04.
- Method: static source inspection only (`find`, `grep`, `Read`), via one read-only `codebase-analyzer` delegation that read all 11 files plus the surrounding route/permission/menu/Redux wiring. No runtime, browser, auth, or backend verification was performed.
- Scope: `src/modules/system/maintenance/` (11 files, `find src/modules/system/maintenance -type f | wc -l`). `src/modules/system/maintenance.settings.tsx` — a loose top-level file with a similar name, documented in [`docs/modules/system/OVERVIEW.md`](OVERVIEW.md) §4.6/§13 as a confirmed orphan exporting `MaintenanceSettings({mode})` — is a **different, unrelated file**: it is not imported by this submodule and does not import from it (confirmed, `grep -rn "maintenance.settings" src/` matches only unrelated `maintenance-settings` route-path strings, never an import of the loose file).
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Whether the backend enforces `MAINTENANCE_SETTINGS_EDIT` on `PUT api/admin/portal/v1/maintenance`, given that the frontend's status-toggle write path (§4, §13) is reachable under `MAINTENANCE_SETTINGS_VIEW` alone with no frontend edit-permission check at all — the single highest-consequence open question in this document.
  2. Backend acceptance of the frontend's write date format (`YYYY-MM-DD HH:mm:ss`, space separator, `ultis.tsx:20-21`) versus the format the frontend expects on read (`YYYY-MM-DDTHH:mm:ss`, `T` separator, `src/constants/common.constant.ts:1`) — an asymmetry confirmed in source, contract unverified.
  3. Whether `Dayjs` resolves correctly in `types/system-maintenance.d.ts:38-39` (used with no import in that ambient file) given `tsconfig.app.json:10`'s `skipLibCheck: true`, which would hide a `.d.ts` type error from both review and `npm run typecheck`'s usual signal.
  4. End-user (non-admin) consumption of the maintenance notice — what renders the title/HTML/image/CTA and whether it enforces the date window — is entirely outside this repository and could not be verified.
  5. Runtime behavior of the custom date/time-picker merge logic (`updateDateTime`, `edit/general.tsx:223-254`) on clear and on "set time before date" — the merge reads the picker's previous value defensively, and whether AntD's own value update races with it was not exercised.

## 1. Responsibility

Admin editor for a single, global "maintenance notice" record (`src/types/system-maintenance.d.ts:11-21`): a status toggle (`MAINTENANCE`/`NORMAL`), a start/end date-time window, a title, HTML message content, a CTA button label, and an optional image. There is no list and no create flow — the record is a singleton, fetched and updated in place (`view/form.tsx:93-98`, `edit/form.tsx:71-76`). The status toggle is **not** derived from the date window anywhere in this code: activation/deactivation is a manual switch on the view page that sends the whole record back with only `status` flipped (`view/form.tsx:48-61`), independent of whether the current date falls inside `[maintenanceStartDate, maintenanceEndDate]`. Whether an end-user-facing app consumes this record and enforces the date window itself is `NEEDS-VERIFICATION` — no such consumer exists anywhere in this repository (`grep -rn "api/admin/portal/v1/maintenance" src | grep -v src/modules/system/maintenance/` returns no matches).

## 2. Entry points and routes

- **Lazy exports:** `src/routes/pages.tsx:143` (`MaintenanceViewSettings` → `maintenance/view/form`), `:144` (`MaintenanceEditSettings` → `maintenance/edit/form`).
- **Routes (CONFIRMED, both in `form.routes.tsx`, BasicLayout — not `main.routes.tsx`):**
  - `system-management/maintenance-settings/view` (`form.routes.tsx:865-873`, path `:866`, element `:869`) — `<WithGuard Page={MaintenanceViewSettings} Guard={AuthGuard} permissions={[PERMISSIONS.MAINTENANCE_SETTINGS_VIEW]} />` (`:871`), **single permission**.
  - `system-management/maintenance-settings/edit` (`form.routes.tsx:875-883`, path `:876`, element `:879`) — `permissions={[PERMISSIONS.MAINTENANCE_SETTINGS_EDIT]}` (`:881`), **single permission, the only place `MAINTENANCE_SETTINGS_EDIT` is checked anywhere in the repository**.
- **Route counts (CONFIRMED, template-mandated command, not module-specific):** `grep -cE "<Route($|[ >/])" src/routes/main.routes.tsx` = 69; same on `src/routes/form.routes.tsx` = 113. This module contributes exactly 2 of the 113 in `form.routes.tsx` and 0 in `main.routes.tsx`.
- **No menu entry of its own.** The only entry point other than a direct URL is the shared `system-management/system-management/list` hub page (`src/modules/system/system-management/index.tsx`, documented in `docs/modules/system/OVERVIEW.md` §4.5), whose own route is gated by an **OR array** `[MAINTENANCE_SETTINGS_VIEW, VERSION_SETTINGS_VIEW]` (`main.routes.tsx:405`) and whose menu entry carries the same OR array (`menus.helper.ts:553-559`, array at `:558`). A user holding only `VERSION_SETTINGS_VIEW` reaches the hub, sees the maintenance summary row (gated independently inside the hub by `hasPermission([MAINTENANCE_SETTINGS_VIEW])`, `system-management/index.tsx:50`, so the row itself would not render for that user — this module's row is correctly hidden, unlike the comparable unguarded-link findings already recorded for `master-data.system.tsx` in `OVERVIEW.md` §13).
- **`PageURLs` builders** (`src/utils/navigate.ts`): `ofMaintenanceSettings(tab = '')` (`:334-336`) → `/system-management/maintenance-settings/view[?tab=...]`; `ofMaintenanceEditSettings(tab = '')` (`:337-339`) → the `/edit` equivalent. Callers: the middleware (§5), `edit/form.tsx:55` (cancel), `view/history.tsx:29` and `view/general.tsx:45` (tab-aware navigation between view/edit), and `system-management/index.tsx:110` (the hub's summary-row link).
- **Unrelated reuse of this module's tab enum:** `src/modules/system/card-management/view/history.tsx:16,33` and `src/modules/system/priority-service/view/history.tsx:16,33` each import `SystemMaintenanceTabs` from `../../maintenance/constant` and use `.General` as a generic "general tab" key for their own, unrelated `PageURLs.ofCardManagementEdit()`/`ofPriorityServiceEdit()` calls — a cross-domain coupling on this module's constant, not a routing relationship (§10, §13).

## 3. Directory map

`find src/modules/system/maintenance -type f | sort` → 11 files, 1483 lines total (`wc -l`).

```text
src/modules/system/maintenance/
|-- constant.ts                              # SystemMaintenanceTabs (enum), systemMaintenanceStatusOptions, ACCEPT_IMAGE_TYPE
|-- ultis.tsx                                # convertFieldActionType, formatDataMaintenanceDetail (form -> request DTO), toMaintenanceReviewData (form -> preview model)
|-- types/
|   `-- system-maintenance.d.ts              # ambient global script (no import/export): MaintenanceDetail, MaintenanceDetailRequest, MainTenanceGeneralFormValues, MaintenanceReviewContentType, etc.
|-- components/
|   `-- preview-maintenance.tsx              # admin-side preview of title/image/HTML content, Emotion styles
|-- view/
|   |-- form.tsx                             # view page shell: FormLayout, status-toggle modal, back-to-hub button
|   |-- general.tsx                          # read-only General tab (all fields disabled), its own preview-data mapping, edit-navigation submit
|   `-- history.tsx                          # audit-history table + pagination; reused by edit/form.tsx
|-- edit/
|   |-- form.tsx                             # edit page shell: FormLayout, cancel-confirm modal
|   `-- general.tsx                          # editable General tab: AntD Form, date/time validators, preview, submit (513 lines, the module's largest file)
`-- stores/redux/
    |-- slices/system-maintenance.slice.ts   # Redux slice "maintenance": 6 thunks, 4 selectors
    `-- middlewares/system-maintenance.middleware.ts  # listener middleware: 4 listeners (notifications + navigation)
```

**Non-standard structural finding (CONFIRMED):** this submodule's Redux slice and middleware are colocated inside the feature folder under `stores/redux/slices/` and `stores/redux/middlewares/`, unlike every sibling submodule documented in `OVERVIEW.md` (`administrative-unit`, `card-management`, `ekyc-config`, `priority-service`), which all keep their slice/middleware in the central `src/redux/slices/`/`src/redux/middlewares/` folders. Central registration still imports from the feature-local path (`src/redux/slices.ts:30`, `src/redux/store.ts:30`), so the central registry is unaffected — this is a file-location deviation only, not a registration gap. Classification is `uncertain` for intent (§12): nothing in `.claude/ARCHITECTURE.md` §7's "Recommended Feature Structure" forbids this, and `.claude/ARCHITECTURE.md` §20 even lists "co-locate newly owned Redux files inside a feature" as a `CANDIDATE` direction — but this module predates that candidate status being recorded, so whether this is an intentional early instance of that candidate or an unrelated one-off is `NEEDS-VERIFICATION` (no git-blame evidence was gathered).

No `services/`, `hooks/`, `queryKeys/`, `schemas/`, or `*.scss` file exists anywhere in this module.

## 4. Main runtime flows

### Flow A — view page: load, status toggle, navigate to edit
(CONFIRMED, `view/form.tsx`, `view/general.tsx`, `view/history.tsx`)

1. On mount, dispatches `getMaintenanceDetail()`; on unmount, dispatches `resetMaintenanceDetail()` (`view/form.tsx:93-98`).
2. `FormLayout` renders with `footerType='view'`, a status-dependent cancel-button label ("Vô hiệu"/"Kích hoạt", hardcoded, `:108-110`), and `onSaveStatus={handleUpdateStatus}` (`:111`).
3. `handleUpdateStatus` (`:63-87`) opens a confirm modal (title via `t('active')`/`t('inactive')`, body hardcoded). On confirm, `onUpdateStatus` (`:48-61`) dispatches `updateMaintenanceStatus({ formData: { ...systemMaintenance, status: flipped } })` — **the entire current record, read from the already-loaded Redux state, not from any form** — then immediately dispatches `getMaintenanceDetail()` again and closes the modal regardless of the mutation's outcome (the failure notification, if any, comes from the middleware, not from this closing logic).
4. The General tab's own "submit" (triggered from the view-mode footer) simply navigates to the edit route with the General tab preselected (`view/general.tsx:44-46`); it saves nothing itself. The History tab's "submit" does the same (`view/history.tsx:28-30`).
5. `view/general.tsx` hydrates its own disabled form fields and a separate `reviewData` `useState` (initially `undefined`) in one effect (`:71-98`). The preview button passes `reviewData!` into `PreviewMaintenance` (`:54`) — a non-null assertion on a value that starts `undefined` until that effect runs; whether a click can occur before the effect fires is `NEEDS-VERIFICATION` (§13).

### Flow B — edit page: load, edit, validate, submit
(CONFIRMED, `edit/form.tsx`, `edit/general.tsx`)

1. On mount, dispatches `getMaintenanceDetail()`; separately, whenever the fetched detail's identity changes, dispatches the no-op thunk `onChangeDataTempUpdate(systemMaintenance)` (`edit/form.tsx:65-69`), which only ever writes `dataTempUpdate` in the slice and is never read back anywhere (§5, §13 — confirmed dead state).
2. The editable form (`edit/general.tsx`) hydrates from the fetched detail (`:183-203`), converting ISO-ish date strings to `Dayjs` via `DATE_TIME_FORMAT_INPUT = 'YYYY-MM-DDTHH:mm:ss'`.
3. Four date/time `Form.Item`s (start-day, start-hour, end-day, end-hour) share two underlying field names via a custom `updateDateTime` merge helper (`:223-254`); each is independently validated by one of four near-duplicate validator functions (`validateStartHour`, `validateStartDay`, `validateEndHour`, `validateEndDay`, `:135-169`) that all delegate to `isValidateDateTime`/`isSameDay`/`isSameHour` (`:63-110`). **Confirmed logic defect:** `isSameDay`/`isSameHour` set their "equal" flag to `true` on every branch when both values are present, so the "or equal" wording in the validation messages (`:140,149,158,167`) can only ever be shown when a field is *empty*, never for a genuinely-equal-but-invalid pair — the intended day/hour-equality distinction is not implemented (§13).
4. `maintenanceMessageTitle` is AntD-required; `maintenanceMessageContent` uses a custom validator (`validateEditor`, `:171-181`) that strips tags/`&nbsp;` before checking emptiness; `status` has a UI asterisk (`:273`, "Trạng thái bảo trì*") but **no actual `rules`** — it is not enforced (§13).
5. Submit (`:205-219`) runs `form.validateFields()`, maps the raw form values through `formatDataMaintenanceDetail` (`ultis.tsx:15-28`, converts dates to `'YYYY-MM-DD HH:mm:ss'`, drops the form-only `typeLabel` field), and dispatches `updateMaintenance({ formData })`. Success notification and post-save navigation to the view page are both owned by the middleware (§5), not by this submit handler.
6. Cancel (`:42-63` in `edit/form.tsx`) opens a confirm modal; on confirm, dispatches its own local success notification (hardcoded Vietnamese string, `:50-51`) and navigates to the view page — this is the one place in the module where a save/cancel-adjacent notification is **not** owned by the middleware.

### Flow C — history tab
(CONFIRMED, `view/history.tsx`, reused identically by `edit/form.tsx:19`)

On mount, dispatches `getListUpdatedHistories({ query: { page: 0, size: 10 } })` (defaults from `PAGINATION_PARAMS`). Renders a table with no `loading` prop of its own (relies on the parent `FormLayout`'s spinner) and a `CustomPagination` (`current = currentPage + 1`, requests `newPage - 1`). The "Phạm vi" column renders through this module's own `convertFieldActionType` (`ultis.tsx:1-13`), whose `SystemMaintenanceUpdatedActionType` set does **not** include a `CREATED` case, unlike the structurally similar helper in `products/configuration/industry-product/ultis.ts` — the two are not interchangeable despite the shared name pattern (§8).

### Flow D — preview
(CONFIRMED, `components/preview-maintenance.tsx`)

A simple, stateless render of an optional `<img>` (hardcoded `alt="Version Image"`, `:12` — LIKELY copied from an unrelated version-settings component, §13), the title, and `<SafeHTML html={maintenanceMessageContent ?? ''}>`. Whether `SafeHTML` sanitizes its input was not verified (`src/components/safeHtml.tsx` not read in this pass) — `NEEDS-VERIFICATION`.

## 5. State ownership

| State | Owner | Registered? |
| --- | --- | --- |
| The maintenance record (`maintenanceDetail`), its audit history, and pagination | **Redux slice `maintenance`** (`createAppSlice`, name `'maintenance'`, `stores/redux/slices/system-maintenance.slice.ts:20`) | Yes — imported from the feature-local path (not a central file) at `src/redux/slices.ts:30,73` and `src/redux/store.ts:30,77` (§3). `grep -rni "maintenance" src/redux/` confirms no second slice owns this resource. |
| Edit/view form fields | AntD `Form.useForm<MainTenanceGeneralFormValues>()`, one instance each in `edit/general.tsx:45` and `view/general.tsx:40` | — |
| Preview data | Two independent, **duplicated** mappings: `edit/general.tsx`'s `reviewData` (`useMemo` over `Form.useWatch`, always defined) and `view/general.tsx`'s `reviewData` (`useState`, initially `undefined`, set inside an effect) — the view page does not reuse `ultis.tsx`'s `toMaintenanceReviewData` helper that the edit page's equivalent logic is based on, so the two mappings can diverge (§13) | — |
| `dataTempUpdate` | Written by the slice's `onChangeDataTempUpdate` thunk, dispatched from `edit/form.tsx:65-69` on every detail-identity change | **Confirmed dead state** — no selector reads it, and its only observable effect is toggling the shared `loading` flag (below) on every detail change |

The slice's single `loading: boolean` flag (`:5`) is shared across all six thunks — detail fetch, update, status update, the no-op `onChangeDataTempUpdate`, and history fetch — and is read by both page shells (`edit/form.tsx:37`, `view/form.tsx:38`) and by the unrelated `system-management/index.tsx:53` hub page as part of its own combined loading state. This is the same "one broad loading flag" pattern already recorded for every sibling submodule in `OVERVIEW.md` §5/§13, not a new pattern introduced here. This resource is `LEGACY-COMPATIBILITY` under `.claude/rules/04-state-management.md` `## Server state ownership (adopted 2026-11-04)` — an existing Redux-owned server resource, not a candidate for silent migration here.

**Confirmed cross-module shared-state risk:** `system-management/index.tsx:64` dispatches `getListUpdatedHistories({ query: { page: 0, size: 1 } })` into this same slice's `listUpdatedHistories`/`pagination` fields, which the view page's own History tab also reads (`view/history.tsx:25-26`). The History tab re-fetches its own full page on mount, so this is LIKELY self-healing, but the overwrite itself is confirmed from source and the self-healing claim is not runtime-verified.

## 6. API boundaries

- **No feature-local `services/` folder** (`ls src/modules/system/maintenance/services` — no such directory) and no `src/services/system/` entry for this resource — calls are made directly inside the slice's thunks via the global `window.apiFetcher`, the same `LEGACY-COMPATIBILITY` pattern recorded for every sibling submodule in `OVERVIEW.md` §5/§6.

| Thunk | Method | Endpoint | Notes |
| --- | --- | --- | --- |
| `getMaintenanceDetail` | GET | `api/admin/portal/v1/maintenance` | no params |
| `updateMaintenance` | PUT | `api/admin/portal/v1/maintenance` | body = form-mapped `MaintenanceDetailRequest` |
| `updateMaintenanceStatus` | PUT | `api/admin/portal/v1/maintenance` | **same endpoint as `updateMaintenance`**, body = the entire current Redux-held record with only `status` flipped, not form-validated |
| `getListUpdatedHistories` | GET | `api/admin/portal/v1/maintenance/audit` | query `{ page, size }` |

`grep -rn "api/admin/portal/v1/maintenance" src | grep -v src/modules/system/maintenance/` confirms no other module calls these endpoints. Per `.claude/rules/03-api-service.md` `## Contracts and errors`, the absence of Zod/runtime validation on these stable CRUD responses is the default boundary assumption, not a gap — not flagged as one here. The two write thunks (`updateMaintenance`, `updateMaintenanceStatus`) are otherwise code-identical (§13).

## 7. Forms and validation

- Two `Form.useForm` call sites total in this module: `edit/general.tsx:45` (editable) and `view/general.tsx:40` (read-only/disabled). No Zod anywhere in this module (`grep -rn "zod" src/modules/system/maintenance/` — no match).
- AntD `rules`: `maintenanceMessageTitle` required (`edit/general.tsx:390-397`); `maintenanceMessageContent` via the custom `validateEditor` (`:171-181`, strips tags/`&nbsp;` before checking emptiness); the four date/time fields via `validateStartHour`/`validateStartDay`/`validateEndHour`/`validateEndDay` (`:135-169`, see §4 Flow B for the confirmed "or equal" wording defect); `status` has **no rule** despite its UI asterisk (`:273`); `maintenanceCtaLabel` and the image fields have no rules.
- The date-pair validators effectively make both dates required (an empty pair fails `isValidateDateTime`), without an explicit `required` rule — a validator-enforced requirement, not a declared one.
- `formatDataMaintenanceDetail` (`ultis.tsx:15-28`) is the one request mapper (form values → `MaintenanceDetailRequest`); `toMaintenanceReviewData` (`:30-37`) is the one preview mapper, used by the edit side only — the view side reimplements the same mapping inline (`view/general.tsx:91-96`) rather than reusing the helper (§5, §13).

## 8. Types and DTO organization

- `types/system-maintenance.d.ts` is an **ambient global script** (no `import`/`export` statement) declaring `SystemMaintenanceUpdatedActionType`, `MaintenanceStatus`, `MaintenanceReviewContentType`, `MaintenanceDetail`, `MaintenanceDetailRequest`, and `MainTenanceGeneralFormValues` — a repository-wide `LEGACY-COMPATIBILITY` pattern for ambient business models, not unique to this module (`.claude/ARCHITECTURE.md` §9 discourages this for new code without requiring migration of existing instances).
- `MainTenanceGeneralFormValues` at `:38-39` uses `Dayjs` with no import anywhere in the file. No ambient `Dayjs` global declaration was found elsewhere in `src/`. `tsconfig.app.json:10`'s `skipLibCheck: true` would hide a resulting type error from a normal review pass and possibly from `npm run typecheck`'s usual signal path — `NEEDS-VERIFICATION`, not resolved here (§0).
- `convertFieldActionType` (`ultis.tsx:1-13`) and the structurally similar helper in `src/modules/products/configuration/industry-product/ultis.ts` are **not equivalent**: the maintenance copy's `SystemMaintenanceUpdatedActionType` omits a `CREATED` case that the products-domain copy includes. They share a name pattern, not a contract — do not assume interchangeability between "`ultis.tsx`-named" helpers across modules (a caution also relevant to the `card-management`/`priority-service` copies documented in `OVERVIEW.md` §10/§12, which are a true duplicate pair; this one is not).
- `UpdatedHistory` (the history row type) is the same cross-domain ambient type from `src/types/product-industry.d.ts:131` that every sibling submodule in `OVERVIEW.md` also depends on — a pre-existing shared dependency, not introduced here.

## 9. Permissions

This module references only **2** `PERMISSIONS.*` constants, both at `src/constants/permission.constant.ts:302-303`: `MAINTENANCE_SETTINGS_VIEW: 'maintenance_settings:view'`, `MAINTENANCE_SETTINGS_EDIT: 'maintenance_settings:edit'`. Below the module-scoped threshold for the template's >10-constant table requirement (content rule 9), so a narrative accounting is used instead, but per content rule 13 the full repository-wide picture is given since this module's permissions are enforced well outside its own directory:

- **`MAINTENANCE_SETTINGS_VIEW`** gates: this module's own view route (`form.routes.tsx:871`, single); the shared `system-management` hub route and menu entry (`main.routes.tsx:405`, `menus.helper.ts:558`, both OR with `VERSION_SETTINGS_VIEW`); the hub's own maintenance-row visibility check (`system-management/index.tsx:50`); and — **unrelated to this module** — `ekyc-config/`'s list, view, and edit routes (`main.routes.tsx:412`, `form.routes.tsx:900,906`, all single), a cross-domain reuse already recorded in `OVERVIEW.md` §9/§13 as a confirmed permission inconsistency for `ekyc-config/`, not something this document resolves or re-litigates.
- **`MAINTENANCE_SETTINGS_EDIT`** is checked in **exactly one place in the entire repository**: `form.routes.tsx:881`, the edit route guard. It is never referenced by a menu, by any `useHasPermission` call inside this module, or by any button-visibility check.

**Confirmed finding, the most significant permission observation in this module:** the view page's status-toggle write path (`view/form.tsx:111` `onSaveStatus` → `onUpdateStatus` → `updateMaintenanceStatus`, a `PUT` to the same endpoint the edit form writes to) is reachable by anyone holding `MAINTENANCE_SETTINGS_VIEW` alone — the module contains **no** `useHasPermission`/`hasPermission` check anywhere inside `edit/`, `view/`, or `stores/` gating this specific write. The only gate between a view-only user and this mutation is the route-level `MAINTENANCE_SETTINGS_VIEW` check that admits them to the page at all. Whether the backend separately enforces `MAINTENANCE_SETTINGS_EDIT` on the `PUT` itself is `NEEDS-VERIFICATION` (§0) — frontend guards are not a backend security boundary (`.claude/rules/06-routing-permission.md`).

Permission-check kind, confirmed per call site (never inferred from a neighbor): every route-level array above is a plain array resolved via `.some()` in `src/guards/index.tsx:32` (OR; single-element arrays are trivially equivalent to a plain check). `system-management/index.tsx:50,59`'s component-level checks use `hasPermission([...])` with the default `"some"` mode (`src/hooks/auth.hook.ts:27-36`) — also OR, single-element.

## 10. Shared and cross-domain dependencies

Imported **by** this module, from outside it: `@/layouts/form.layout` (`FormLayout`), `@/types/common` (`Sidebar`), `@/utils/navigate` (`PageURLs`), `@/redux/hooks`, `@/hooks/modal.hook`, `@/hooks/form.hook`, `@/components/*` (`modal-content`, `input`, `select`, `date-picker`, `text-editor`, `upload`, `form-wrapper`, `form.title`, `pagination`, `table-date-time`, `safeHtml`, icons), `@/redux/slices/notification.slice` (`setNotification`), `@/constants/message.constant`, `@/constants/common.constant` (`DATE_TIME_FORMAT_INPUT`), `@/constants/pagination.constant`, `@/redux/createAppSlice`, plus the cross-domain ambient `UpdatedHistory` type (`src/types/product-industry.d.ts:131`, shared with `products`/`system/version-settings`) — ordinary shared-infrastructure and cross-domain-ambient-type reuse, not a concern by itself.

Imported **into** other modules **from inside** this module:
- `src/modules/system/card-management/view/history.tsx:16,33` and `src/modules/system/priority-service/view/history.tsx:16,33` each import `SystemMaintenanceTabs` from `../../maintenance/constant` and use `.General` as a generic "general tab" navigation key for their own, entirely unrelated edit routes. **Confirmed cross-domain coupling on this module's own constant**: renaming or restructuring `constant.ts`'s `SystemMaintenanceTabs` enum would silently break two other submodules' navigation, not just this one's.
- `src/modules/system/system-management/index.tsx:20-26` imports `getListUpdatedHistories`, `getMaintenanceDetail`, `watchListUpdatedHistory`, `watchMaintenanceDetail`, `watchMaintenanceLoading` directly from `../maintenance/stores/redux/slices/system-maintenance.slice` (a relative import into this module's internal `stores/redux/slices/` folder, crossing a module-internal boundary that `.claude/rules/01-architecture.md` discourages) — this exact relationship is already recorded from the `system-management/` side in `OVERVIEW.md` §10, and is recorded here from the `maintenance/` side for completeness.
- `src/redux/slices.ts:30,73` and `src/redux/store.ts:30,77` (central registration, §3/§5).
- `src/routes/pages.tsx:143-144` (standard routing wiring, not a feature-level consumer relationship).

**Confirmed duplicated-label finding:** `system-management/index.tsx:28-31` declares its own local `enum EMaintenanceStatus` with the same two Vietnamese labels ("Đang bật"/"Không bật") as this module's `constant.ts:6-15` `systemMaintenanceStatusOptions` — two independent sources for the same two labels, outside this module's control to fix alone.

## 11. Consumers

- Route consumers: the two `WithGuard`-wrapped lazy pages (§2).
- The `system-management/` hub page: links to the view page, fetches this module's detail and a size-1 history slice, and duplicates its status-label source (§10).
- `card-management/` and `priority-service/`: consume this module's `SystemMaintenanceTabs` enum only (§10) — no other coupling.
- Within the module: `view/history.tsx` is imported by both `view/form.tsx:20` and `edit/form.tsx:19` — a change to the History tab affects both page shells. `PreviewMaintenance` is consumed only by `edit/general.tsx:118` and `view/general.tsx:54`.
- Unknown/out-of-repository consumer: whatever end-user surface reads the published maintenance notice — not present in this repository, not verifiable here (§0, §1).

## 12. Pattern classification

**Mixed — target-compatible in form-state ownership, `LEGACY-COMPATIBILITY` in server-state ownership, service location, and ambient typing, with one structural deviation of uncertain intent:**

- **State ownership (`LEGACY-COMPATIBILITY`):** sole Redux ownership of the maintenance record, no second owner found (§5) — satisfies the "one authoritative owner" rule cleanly, the same clean shape already recorded for `bank-list/` in `BANK-LIST.md` §12, just via Redux rather than Query. Per the Nov-4 server-state-ownership policy (`.claude/ARCHITECTURE.md` §20, `.claude/rules/04-state-management.md` `## Server state ownership (adopted 2026-11-04)`), this is exactly the kind of existing Redux-owned resource that policy neither requires nor forbids migrating — not resolved here.
- **Service location (`LEGACY-COMPATIBILITY`):** no feature service, thunks call `apiFetcher` directly (§6) — the same pattern already recorded for every sibling submodule in `OVERVIEW.md`.
- **Redux file location (`uncertain`, novel in this scope):** colocated under `stores/redux/` inside the feature folder rather than the central `src/redux/slices/`/`src/redux/middlewares/` folders every sibling submodule uses (§3). Whether this is an intentional early instance of the `CANDIDATE` "co-locate newly owned Redux files inside a feature" direction (`.claude/ARCHITECTURE.md` §20) is `NEEDS-VERIFICATION`; it is not treated as a defect, and not treated as a pattern to copy elsewhere.
- **Forms (`target-compatible`):** AntD `Form`/`FormInstance` as the sole form-state owner, no RHF, no second owner, consistent with `.claude/rules/05-form.md`. Validation is entirely AntD-rule/custom-validator based (no Zod) — acceptable for this scope's simple, existing constraints under the same rule, not a gap.
- **Types (`LEGACY-COMPATIBILITY`):** ambient global `.d.ts` with business models and one application `enum` (`SystemMaintenanceTabs`) — present repository-wide, not unique to this module, and not migrated here given its two confirmed outside consumers (§10).
- **Styling (`LEGACY-COMPATIBILITY` per `.claude/rules/10-styling.md`):** Emotion `css` prop throughout, no `.module.scss` anywhere in this module. One inconsistency noted but not resolved: `view/history.tsx:1` carries the `/** @jsxImportSource @emotion/react */` pragma while `preview-maintenance.tsx`, `edit/general.tsx`, and `view/general.tsx` use the `css` prop without it — whether the project's default JSX pragma makes this harmless is `NEEDS-VERIFICATION`, not read in this pass.
- **i18n (not compliant with `.claude/rules/11-i18n.md`, worth naming plainly):** almost every UI string in this module is a hardcoded Vietnamese literal; only three distinct `t()`-driven labels exist (`t('active')`/`t('inactive')`/`t('exit')`), and two different import paths for `t` are used across the module (`i18next` directly in `view/form.tsx:17`, versus `@/utils/i18n` in `edit/general.tsx:25`) — `NEEDS-VERIFICATION` whether both resolve to the same global i18next instance. Recorded as a current-state fact against an applicable rule, consistent with how the same finding was already recorded for every sibling submodule in `OVERVIEW.md` §12, not a new judgment invented here.

## 13. Technical risks

1. **Unguarded write path on the view page.** The status-toggle mutation (`view/form.tsx:48-61,111`, PUT via `updateMaintenanceStatus`) is reachable by anyone holding `MAINTENANCE_SETTINGS_VIEW` alone — no frontend check for `MAINTENANCE_SETTINGS_EDIT` exists anywhere in this module (§9). Backend enforcement is `NEEDS-VERIFICATION`; this is the single highest-consequence finding here.
2. **Confirmed logic defect in the date-pair validators' wording.** `isSameDay`/`isSameHour` (`edit/general.tsx:84-110`) set their "equal" flag `true` on every branch when both compared values exist, so the "or equal" phrasing in the four date validators' error messages can only ever appear for an *empty* field, never for a genuinely equal-but-invalid pair — the intended distinction between "strict after" and "on or after" is not implemented (§4 Flow B, §7).
3. **Shared broad `loading` flag across six thunks** (§5), including the unrelated `system-management/index.tsx` hub page's own combined loading state — the same cross-submodule pattern already recorded in `OVERVIEW.md` §13, confirmed again here from the `maintenance/` side.
4. **Cross-domain hub page writes into this module's history slice with `size: 1`**, overwriting the fields the view page's own History tab reads (`system-management/index.tsx:64` vs. `view/history.tsx:25-26`) — LIKELY self-healing on the History tab's own mount re-fetch, not runtime-verified.
5. **Cross-domain coupling on `SystemMaintenanceTabs`.** `card-management/` and `priority-service/` both import this module's tab enum for unrelated navigation purposes (§10) — a rename here breaks two other submodules silently.
6. **Dead state: `dataTempUpdate`.** Written by `onChangeDataTempUpdate` on every detail-identity change (`edit/form.tsx:65-69`), read nowhere, with its only observable effect being a `loading`-flag toggle (§5).
7. **Two independent, divergence-prone preview-data mappings.** The edit page's `reviewData` (a `useMemo` reusing `ultis.tsx`'s shape) and the view page's `reviewData` (a separately hand-written inline mapping in `view/general.tsx:91-96`, not reusing `ultis.tsx`'s `toMaintenanceReviewData` helper) can drift apart (§4 Flow A, §7).
8. **Non-null assertion on a value that starts undefined.** `view/general.tsx:54`'s `reviewData!` is asserted non-null while the backing `useState` (`:42`) starts `undefined` until a `useEffect` populates it — whether the preview button is reachable before that effect runs is `NEEDS-VERIFICATION` (§4 Flow A).
9. **Asymmetric date-time format between write and read.** `ultis.tsx:20-21` writes `'YYYY-MM-DD HH:mm:ss'`; `edit/general.tsx`/`view/general.tsx` parse reads with `DATE_TIME_FORMAT_INPUT = 'YYYY-MM-DDTHH:mm:ss'` — backend acceptance of the write format is `NEEDS-VERIFICATION` (§0).
10. **Duplicated status-label source.** `system-management/index.tsx:28-31`'s local `EMaintenanceStatus` enum repeats the same two labels this module's `constant.ts:6-15` already declares, maintained independently (§10).
11. **Code-duplicate thunks.** `updateMaintenance` and `updateMaintenanceStatus` are otherwise identical request logic against the same endpoint, differentiated only by caller and by which middleware listener reacts to them (§6, §5).
12. **Unused-but-present `name` interpolation.** The status-update failure middleware passes a `name` argument into `NOTIFICATION_MESSAGE.ENABLE_FAIL`/`DISABLE_FAIL`, but neither message string contains a `{{name}}` placeholder to consume it — harmless, but dead code at the call site.
13. **Cosmetic copy-paste residue.** `preview-maintenance.tsx:12`'s `alt="Version Image"` LIKELY originates from an unrelated version-settings component; `status` has a required-looking UI asterisk (`edit/general.tsx:273`) with no backing `rules` entry (§7).

## 14. Areas to avoid touching

- `src/modules/system/card-management/view/history.tsx` and `src/modules/system/priority-service/view/history.tsx` — not owned by this module, but both import `constant.ts`'s `SystemMaintenanceTabs` for their own navigation; a rename or restructure of that enum, if ever authorized, must update both call sites in the same change (risk 5).
- `src/modules/system/system-management/index.tsx` — not owned by this module, but it imports this module's slice selectors/thunks directly by relative path and duplicates its status-label source (risks 4, 10); changing this module's slice shape or the status-label option set affects that file too.
- `system-maintenance.slice.ts`'s shared `loading` flag — read by three different page shells across two modules (risk 3); any request-specific-loading correction, if ever authorized, affects all three simultaneously.
- The status-toggle write path (`view/form.tsx:48-61`) and its permission gap (risk 1) — any fix here is a permission-semantics change and is `HIGH-RISK` per `.claude/rules/06-routing-permission.md`; this document records the finding but does not propose or apply a fix.

## 15. Open questions

- `NEEDS-VERIFICATION`: whether the backend enforces `MAINTENANCE_SETTINGS_EDIT` (or any edit-level check) on `PUT api/admin/portal/v1/maintenance` independently of the frontend's missing check (risk 1, §0).
- `NEEDS-VERIFICATION`: whether the backend accepts the frontend's write date-time format and returns the format the frontend expects on read (risk 9, §0).
- `NEEDS-VERIFICATION`: `Dayjs`'s resolution in the ambient `types/system-maintenance.d.ts:38-39` given `skipLibCheck: true` (§0, §8) — would require running `npm run typecheck` with `skipLibCheck` temporarily disabled to confirm, which was not done in this read-only pass.
- `NEEDS-VERIFICATION`: whether the backend enforces the date window or required-field completeness before honoring a status-activation request sent without form validation (§4 Flow A).
- `NEEDS-VERIFICATION`: runtime behavior of the custom date/time-picker merge (`updateDateTime`, `edit/general.tsx:223-254`) on clear and on "time set before date" (§0).
- `NEEDS-VERIFICATION`: whether `SafeHTML` (`src/components/safeHtml.tsx`) sanitizes the rendered maintenance message content — not read in this pass (§4 Flow D).
- `NEEDS-VERIFICATION`: how the end-user-facing application (outside this repository) consumes and enforces this record's date window, if at all (§1, §11).
- `NEEDS-TEAM-DECISION`: whether this module's feature-colocated `stores/redux/` structure (§3, §12) should be treated as the intended pattern for future Redux-owned features in `system/`, or corrected to match its siblings' central-folder convention. Not resolved here.
