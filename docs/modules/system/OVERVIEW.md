# System — Module Documentation (Overview)
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq` at the time of writing; `git status` on this branch additionally shows in-progress local changes to `.claude/ARCHITECTURE.md`, `.claude/agents/frontend-reviewer.md`, `.claude/rules/03-api-service.md`, `.claude/rules/04-state-management.md`, `CLAUDE.md`, `docs/modules/INDEX.md`, a Redux slice, and `src/services/index.ts` — none of those touch the files documented here.
- Date: 2026-11-04.
- Method: static source inspection only, via six independent read-only `codebase-analyzer` delegations (one per small submodule below, one for the five loose files), each citing file:line. No runtime, browser, auth, or backend verification was performed.
- Scope: this document covers the module's **five small submodules** — `administrative-unit/` (4 files), `card-management/` (10), `ekyc-config/` (8), `priority-service/` (8), `system-management/` (1) — and the **five loose top-level files** directly under `src/modules/system/` (`master-data.system.tsx`, `display.system.tsx`, `integration.system.tsx`, `company.system.tsx`, `maintenance.settings.tsx`), 36 files total (`find` per submodule, individually verified in each delegation). `bank-list/` (10 files), `maintenance/` (11), `version-settings/` (11), `splash-screen/` (25), and `theme-management/` (86) are **not** covered here — see the submodule index in §1 for where each is documented. `docs/modules/system/BANK-LIST.md` already exists and is treated as evidence for the shared `master-data.system.tsx` landing page, not re-derived.
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Backend contracts for every endpoint listed in §6 across all five submodules — only frontend call sites were read; no backend code is in this repository.
  2. Whether `master-data.system.tsx`'s backend response ever returns row codes other than `ADMINISTRATIVE_UNIT`/`BANK`, and whether it ever exceeds the hardcoded `page:0, size:10` fetch with no pagination UI (§4, §13).
  3. Whether the permission-constant mismatch at `src/modules/system/priority-service/view/form.tsx:135,139` (uses `CARD_SERVICE_MANAGEMENT_EDIT` instead of `PRIORITY_SERVICE_MANAGEMENT_EDIT`) is enforced correctly on the backend regardless of the frontend bug (§9, §13 — this is the single highest-consequence finding in this document).
  4. Whether `ekyc-config`'s edit route (`form.routes.tsx:904-908`, guarded only by `MAINTENANCE_SETTINGS_VIEW`) is intentionally missing an `EKYC_CONFIG_EDIT` check, or is itself a second instance of the same class of bug as item 3 (§9, §13).
  5. Runtime behavior of every "shared loading flag" and "silent failure on an unhandled error code" finding in §13 — all are static-source findings, none executed.

## 1. Responsibility

`src/modules/system/` is the admin area for repository-wide operational configuration: reference/master data, device and app settings, and per-feature operational toggles. It has no single unifying business domain; each submodule configures a distinct backend resource.

**Submodule index** (this document's own index, one level below `docs/modules/INDEX.md`):

| Submodule / file | Files | Documented in |
| --- | --- | --- |
| `administrative-unit/` | 4 | this document, §4.1 |
| `card-management/` | 10 | this document, §4.2 |
| `ekyc-config/` | 8 | this document, §4.3 |
| `priority-service/` | 8 | this document, §4.4 |
| `system-management/` | 1 | this document, §4.5 |
| `master-data.system.tsx` (loose) | 1 | this document, §4.6 |
| `display.system.tsx`, `integration.system.tsx`, `company.system.tsx` (loose) | 3 | this document, §4.6 |
| `maintenance.settings.tsx` (loose) | 1 | this document, §4.6 |
| `bank-list/` | 10 | [`docs/modules/system/BANK-LIST.md`](BANK-LIST.md), current |
| `maintenance/` | 11 | [`docs/modules/system/MAINTENANCE.md`](MAINTENANCE.md), current |
| `version-settings/` | 11 | [`docs/modules/system/VERSION-SETTINGS.md`](VERSION-SETTINGS.md), current |
| `splash-screen/` | 25 | [`docs/modules/system/SPLASH-SCREEN.md`](SPLASH-SCREEN.md), current |
| `theme-management/` | 86 | [`docs/modules/system/THEME-MANAGEMENT.md`](THEME-MANAGEMENT.md) (overview) + [`docs/modules/system/BACKGROUND-MAIN.md`](BACKGROUND-MAIN.md) (`background-main/` + `background-main-lock/`) + [`docs/modules/system/TOPIC.md`](TOPIC.md), current |

**One-line purpose per submodule covered here:**

- `administrative-unit/` — two-level (province → ward) administrative-unit reference data: list, create/edit, activate/deactivate, and a read-only legacy 3-level mapping view.
- `card-management/` — catalog of "dịch vụ thẻ" (card services): list, drag-sort reorder, view/edit, audit history, enable/disable.
- `ekyc-config/` — eKYC verification-step rate-limit/retry/lock settings per step type, plus a separate global "other settings" (match thresholds, expiry windows) resource; view/edit/history, no create.
- `priority-service/` — "dịch vụ ưu tiên" (priority service) catalog controlling a mobile-app screen toggle, structurally copy-pasted from `card-management/`; view/edit/history, no create, no list-level search or sort.
- `system-management/` — a read-only two-row summary hub ("Thông tin ứng dụng") linking into `maintenance/` and `version-settings/`; owns no resource of its own.
- Loose files: `master-data.system.tsx` is the real shared landing page for `administrative-unit/` and `bank-list/`; `display.system.tsx`/`integration.system.tsx`/`company.system.tsx` are three-line static placeholders; `maintenance.settings.tsx` is a true orphan unrelated to the real `maintenance/` submodule.

## 2. Entry points and routes

Per content rule 13, route/menu/permission evidence below was gathered from `src/routes/main.routes.tsx`, `src/routes/form.routes.tsx`, `src/routes/pages.tsx`, `src/helpers/menus.helper.ts`, `src/constants/permission.constant.ts`, and `src/utils/navigate.ts`, not from the module directories alone.

| Submodule / file | Route(s) | Layout | Permission (kind) | Menu entry |
| --- | --- | --- | --- | --- |
| `administrative-unit/` | `system-management/master-data/administrative-units` (`main.routes.tsx:136-141`) | MainLayout | single `[ADMINISTRATIVE_UNIT_VIEW]` | **none of its own** — reached only via the `master-data.system.tsx` landing page's menu entry |
| `card-management/` | `.../card-management/list` (`main.routes.tsx:416-421`, OR `[VIEW, EDIT]`); `.../card-management/list/edit` (`form.routes.tsx:910-915`, single `[EDIT]`); `.../card-management/view/:id` (`form.routes.tsx:972-977`, single `[VIEW]`); `.../card-management/edit/:id` (`form.routes.tsx:982-987`, single `[EDIT]`) | list: MainLayout; other three: BasicLayout | see above, 4 separate routes | `menus.helper.ts:567-572`, single `[CARD_SERVICE_MANAGEMENT_VIEW]` — menu links only to the list |
| `ekyc-config/` | `.../ekyc-config` (`main.routes.tsx:410-414`, single `[MAINTENANCE_SETTINGS_VIEW]`); `.../ekyc-config/view/:id` (`form.routes.tsx:898-902`, single `[MAINTENANCE_SETTINGS_VIEW]`); `.../ekyc-config/edit/:id` (`form.routes.tsx:904-908`, single `[MAINTENANCE_SETTINGS_VIEW]`) | list: MainLayout; view/edit: BasicLayout | all three gated on `MAINTENANCE_SETTINGS_VIEW` only — **no route checks `EKYC_CONFIG_EDIT`**, including the edit route | `menus.helper.ts:561-566`, single `[EKYC_CONFIG_VIEW]` — a **different** constant than the one guarding the routes (§9, §13) |
| `priority-service/` | `.../priority-service/list` (`main.routes.tsx:440-447`, single `[PRIORITY_SERVICE_MANAGEMENT_VIEW]`); `.../priority-service/view/:id` (`form.routes.tsx:992-999`, single `[VIEW]`); `.../priority-service/edit/:id` (`form.routes.tsx:1002-1009`, single `[EDIT]`) | list: MainLayout; view/edit: BasicLayout | 3 routes, each single-permission | `menus.helper.ts:574-580`, single `[PRIORITY_SERVICE_MANAGEMENT_VIEW]` |
| `system-management/` | `.../system-management/system-management/list` (`main.routes.tsx:399-408`) | MainLayout | OR `[MAINTENANCE_SETTINGS_VIEW, VERSION_SETTINGS_VIEW]` (`:405`) | `menus.helper.ts:553-559`, same OR array |
| `master-data.system.tsx` | `.../master-data` (`main.routes.tsx:126-134`); plus a `Navigate` redirect at `.../system/information/master-data` → `PageURLs.ofSystemMasterData()` (`main.routes.tsx:121-124`, itself unguarded, but its target is guarded) | MainLayout | OR `[ADMINISTRATIVE_UNIT_VIEW, BANK_VIEW]` (`:131`) | `menus.helper.ts:547-552`, same OR array — the group's only menu entry |
| `display.system.tsx` | `system/display` (`main.routes.tsx:115`) | MainLayout | **none** — `AuthGuard` only, reachable by any authenticated user | none (commented out, `menus.helper.ts:116-122`) |
| `integration.system.tsx` | `system/integration` (`main.routes.tsx:116`) | MainLayout | **none** | none (commented out, `menus.helper.ts:125-127`) |
| `company.system.tsx` | `system/information/company-info` (`main.routes.tsx:118-120`) | MainLayout | **none** | none (commented out, `menus.helper.ts:131-137`) |
| `maintenance.settings.tsx` | **none** — confirmed orphan, see §4.6 | — | — | — |

- Lazy exports (all in `src/routes/pages.tsx`, every business page is lazy per the repository-wide convention): `AdministrativeUnitList:11`; `CreditCardManagementList:156`, `CreditCardManagementEditList:157`, `CardServiceViewSettings:158`, `CardServiceEditSettings:159`; `EkycConfigList:145`, `EkycConfigView:146` (default export of `view/form.tsx`), `EkycConfigEdit:147`; three equivalent priority-service exports at `:160-162`; `SystemManagement:142`; `MasterData:10`; `Display:9`, `Integration:7`, `Company:8`.
- `<Route>` counts (template-mandated command, not specific to this module): `grep -oE "<Route($|[ >/])" src/routes/main.routes.tsx | wc -l` = 69; same on `src/routes/form.routes.tsx` = 113. This module's submodules and loose files contribute 15 of those 182 (`administrative-unit` 1, `card-management` 4, `ekyc-config` 3, `priority-service` 3, `system-management` 1, `master-data`+3 placeholders 4, counting the unguarded `Navigate` separately).
- `PageURLs` builders (`src/utils/navigate.ts`): `ofAdministrativeUnits` `:62-64`; `ofCardManagementList/ListEdit/View/Edit` `:348-359`; `ofEkycConfigList/Detail/Edit` `:325-333`; `ofPriorityServiceList/View/Edit` `:378-386`; `ofSystemManagementList` `:266-269`; `ofSystemMasterData` `:13-15`; `ofSystemDisplay/Integration/CompanyInfo` `:47-55` (dead outside a commented-out menu block, §13).
- Breadcrumbs: `src/helpers/breadcrumbs.helper.ts:59-64` special-cases `ofAdministrativeUnits()` and `ofSystemBanks()` with a hardcoded fallback label; `system-management`'s own page resolves its breadcrumb from the menu tree normally.

## 3. Directory map

### 3.1 `administrative-unit/` (4 files)
```text
src/modules/system/administrative-unit/
|-- index.tsx                               # page: province/ward two-panel master-detail (1462 lines)
`-- components/
    |-- administrative-unit-modal.tsx       # create/edit modal, province or ward
    |-- administrative-unit-status-modal.tsx # activate/deactivate confirm + "blocked" dialog
    `-- legacy-mapping-modal.tsx            # read-only 3-level legacy mapping view for a selected ward
```
No `services/`, `types/`, `hooks/`, or `.module.scss` in this directory. Shared state lives in `src/redux/slices/administrative-unit.slice.ts` outside it.

### 3.2 `card-management/` (10 files)
```text
src/modules/system/card-management/
|-- constants.ts                            # tab enum, accepted image type
|-- list.tsx                                # list, search, sort-mode entry
|-- edit-list.tsx                           # drag-sort reorder page
|-- ultis.tsx                               # convertFieldActionType (history label mapping)
|-- components/
|   `-- card-management-list-searcher.form.tsx
|-- edit/
|   |-- form.tsx                            # edit page shell (General + History tabs)
|   `-- general.tsx                         # editable fields
`-- view/
    |-- form.tsx                            # view page shell, enable/disable modal
    |-- general.tsx                         # read-only fields
    `-- history.tsx                         # audit history table (also reused by edit/form.tsx)
```

### 3.3 `ekyc-config/` (8 files)
```text
src/modules/system/ekyc-config/
|-- constants.ts                            # tab enum, verificationTypeData, rateLimitCodeData
|-- ekyc-config.tsx                         # list (static array, no fetch)
|-- components/
|   `-- ekyc-config-card.tsx                # read-only card grid for the "other settings" resource
|-- view/
|   |-- form.tsx                            # view shell
|   |-- general.tsx                         # per-step table or card grid, disabled form
|   `-- history.tsx                         # audit history
`-- edit/
    |-- form.tsx                            # edit shell, single tab
    `-- general.tsx                         # editable step table / card form (523 lines, the module's largest file)
```

### 3.4 `priority-service/` (8 files)
```text
src/modules/system/priority-service/
|-- constants.ts                            # tab enum
|-- list.tsx                                # list, URL-state sort only, no search
|-- ultis.tsx                               # convertFieldActionType, near-duplicate of card-management's
|-- edit/
|   |-- form.tsx
|   `-- general.tsx
`-- view/
    |-- form.tsx
    |-- general.tsx
    `-- history.tsx                         # reused by edit/form.tsx
```
Structurally derived from `card-management/`'s view/edit/history shape (confirmed by direct `diff`, §12).

### 3.5 `system-management/` (1 file)
```text
src/modules/system/system-management/
`-- index.tsx                               # the module's only file: a 2-row summary table
```

### 3.6 Loose top-level files (5 files)
```text
src/modules/system/
|-- master-data.system.tsx                  # real landing page: province/bank category table + filter
|-- display.system.tsx                      # 3-line placeholder, default export Display
|-- integration.system.tsx                  # 3-line placeholder, default export Integration
|-- company.system.tsx                      # 3-line placeholder, default export Company
`-- maintenance.settings.tsx                # 3-line orphan, default export MaintenanceSettings({mode})
```

## 4. Main runtime flows

### 4.1 `administrative-unit/` (CONFIRMED)
Two-panel master/detail: left panel lists provinces (client **and** server keyword/status filtering, index.tsx:114-134, :241-249, :721-731 — a mixed, partially redundant filter path); right panel lists wards of the selected province, server-filtered and paginated. Create/edit opens `AdministrativeUnitModal` (province or ward, name/code fields, code locked in edit); activate/deactivate opens `AdministrativeUnitStatusModal`, which also shows a "blocked" dialog when the backend returns a specific error code. Ward creation/activation is blocked client-side when the parent province is not ACTIVE. Clicking a ward code opens `LegacyMappingModal`, a read-only view of the pre-restructuring 3-level (province/district/ward) data linked to the selected 2-level ward (naming and exact semantics of "legacy" are LIKELY, not documented in source — NEEDS-VERIFICATION). After a ward create/update, only the ward list reloads, not the province list, so a province-level ward count shown in the deactivate dialog can go stale (§13).

### 4.2 `card-management/` (CONFIRMED)
List supports keyword/status search and links to view; a separate "Sắp xếp" (sort) entry opens a drag-and-drop reorder page that renumbers `displayOrder` locally and submits the whole reordered list in one request. View shows read-only fields plus history; its own submit action navigates to edit rather than saving anything itself (this is the FormLayout "view footer navigates to edit" pattern repository-wide, not unique to this module). Edit submits a `PUT` to the same endpoint as the enable/disable status action, with two different request-body shapes (§13). Enable/disable is a modal from the view page; disabling optionally captures a reason (not required here, unlike `priority-service/`'s equivalent flow, §13).

### 4.3 `ekyc-config/` (CONFIRMED)
The list page (`ekyc-config.tsx`) renders a static, hardcoded 11-row array (`constants.ts:8-29`, no API call) linking to a view page per row. Rows are either a verification step (`FACE_CHECK`/`OCR_ID_CARD_CHECK`/`OCR_ID_CARD_CHIP_CHECK`/`OTP`) or the single `SYSTEM_SETTING_OTHER` pseudo-row, which is a completely different backend resource (global thresholds/expiry windows) rendered through the same view/edit shell via an `id === SYSTEM_SETTING_OTHER` branch at every layer (view/form.tsx, edit/form.tsx, both `general.tsx` files). The view page always renders a History tab, including for `SYSTEM_SETTING_OTHER`, whose backend support for a history endpoint under that pseudo-id is unverified (§13). Edit validates on load (`form.validateFields().catch(() => undefined)`, `edit/general.tsx:221`) in addition to on submit.

### 4.4 `priority-service/` (CONFIRMED)
View/edit/history only — no list-level search, sort, or create. The list page fetches sorted by a user-togglable sort only (no filter). View's disable action requires and trims a reason (`view/form.tsx:83-90`); activation does not. The view page's Edit button and status toggle are gated by a **copy-pasted, wrong permission constant** — see §9/§13, the most significant finding in this document.

### 4.5 `system-management/` (CONFIRMED)
On mount, dispatches up to four Redux thunks gated by two permissions: `getMaintenanceDetail` + `getListUpdatedHistories({size:1})` if `MAINTENANCE_SETTINGS_VIEW`, and `getVersionSettingsConfig` + `getVersionSettingsHistories({size:1})` if `VERSION_SETTINGS_VIEW`. It renders two rows ("Bảo trì", "Cập nhật phiên bản") each showing the latest history actor/date, and navigates into `maintenance/` or `version-settings/` on click. It reads `getVersionSettingsConfig`'s loading flag but never its data (dispatched only to produce a loading indicator) — a confirmed, harmless-but-wasteful call (§13). Both `size:1` history fetches write into the same Redux slices that `maintenance/`'s and `version-settings/`'s own history tabs read, so a background visit to this hub page could in principle truncate a history list those other pages are showing (NEEDS-VERIFICATION, not exercised at runtime).

### 4.6 Loose top-level files (CONFIRMED)
- **`master-data.system.tsx`** — a real, data-backed landing page: server-side keyword search, a 4-column table, and exactly two possible row links, both driven by backend `code` values (`item.code === 'ADMINISTRATIVE_UNIT'` → `administrative-unit/`, `item.code === 'BANK'` → `bank-list/`; `master-data.system.tsx:36-48`). No other submodule (`card-management`, `ekyc-config`, `priority-service`, `system-management`) is linked from this page — it is specific to the `master-data`/administrative-reference resource, not a hub for all of `system/`. Data comes from `getMasterData` in `administrative-unit.slice.ts` (`page:0, size:10`, no pagination control rendered). Neither row link carries its own permission check (the risk already recorded in `docs/modules/system/BANK-LIST.md` §13 for the `BANK` row applies identically and independently to the `ADMINISTRATIVE_UNIT` row: a user with only one of `ADMINISTRATIVE_UNIT_VIEW`/`BANK_VIEW` sees both row links and is redirected to 404 on the one they lack).
- **`display.system.tsx` / `integration.system.tsx` / `company.system.tsx`** — confirmed, each is exactly 3 lines: a default-exported function returning `<>{Word}</>` with no state, hooks, props, imports, or data. Routed (unguarded) but not menu-linked.
- **`maintenance.settings.tsx`** — confirmed orphan: `export default function MaintenanceSettings({ mode }: { mode: 'view' | 'edit' })` returning one of two static strings. Zero references anywhere else in `src/` (`grep -rnw "MaintenanceSettings" src/` matches only its own 2 lines). Unrelated to the real, separately-documented `maintenance/` submodule, whose actual view/edit pages are `MaintenanceViewSettings`/`MaintenanceEditSettings` lazy-loaded from `@/modules/system/maintenance/view/form` and `edit/form` (`pages.tsx:143-144`) — a naming coincidence only.

## 5. State ownership

| Submodule | Owner | Registration |
| --- | --- | --- |
| `administrative-unit/` | Redux slice `administrative-unit` (`src/redux/slices/administrative-unit.slice.ts:86-87`) | `src/redux/slices.ts:40,82`; middleware `configureAdministrativeUnitMiddleware` at `src/redux/store.ts:39,85` |
| `card-management/` | Redux slice named `'card-service-list'` (`src/redux/slices/card-management.slice.ts:28`) | `slices.ts:34,76`; middleware `configureCardManagementMiddleware` at `store.ts:34,80` |
| `ekyc-config/` | Redux slice `'ekyc-config'` (`src/redux/slices/ekyc-config.slice.ts:24-25`) | `slices.ts:32,70`; middleware `configureEkycConfigMiddleware` at `store.ts:32,74` |
| `priority-service/` | Redux slice named `'priority-service-list'` (`src/redux/slices/priority-service.slice.ts:22`) | `slices.ts:35,77`; middleware at `store.ts:35,83` |
| `system-management/` | **No slice of its own.** Pure consumer of the `maintenance` and `version-settings` slices. | n/a |
| `master-data.system.tsx` | Reuses `administrative-unit.slice.ts`'s `masterData*` fields | same registration as `administrative-unit/` |
| `display/integration/company.system.tsx` | none | n/a |
| `maintenance.settings.tsx` | none | n/a |

All four owned server resources (`administrative-unit`, `card-management`, `ekyc-config`, `priority-service`) are Redux-owned, `LEGACY-COMPATIBILITY` per `.claude/rules/04-state-management.md` `## Server state ownership (adopted 2026-11-04)` — none is new work, and none should gain a second owner. **No TanStack Query usage exists anywhere in this document's scope** (confirmed per-submodule by grepping for `useQuery`/`useMutation`/`@tanstack` in each directory; the only false-positive hits were `useQueryState`, an unrelated URL-state hook). Every submodule's thunks call `window.apiFetcher` directly from inside the slice file — there is no feature `services/` folder and no `src/services/system/` entry for any of these five submodules (`ls src/services/system` returns nothing for them); this is a `LEGACY-COMPATIBILITY` deviation from `.claude/rules/03-api-service.md` `## Endpoint ownership`'s "thunks should call a feature service" guidance, present identically across all four.

Each slice shares one broad `loading` flag across its list/detail/update/history thunks (`administrative-unit.slice.ts` `provincesLoading`; `card-management.slice.ts:31-37` reused by list, update, and history; `ekyc-config.slice.ts` likewise; `priority-service.slice.ts` likewise) — a recurring `LEGACY-COMPATIBILITY` pattern, not unique to one submodule (§13).

## 6. API boundaries

All calls go through the global `window.apiFetcher`, invoked directly inside each slice's thunks (no service layer). Base paths, one row per endpoint:

| Submodule | Method | Path | Thunk |
| --- | --- | --- | --- |
| `administrative-unit/` | GET | `master-data/provinces` | `getAdministrativeProvinces` |
| | POST/PUT | `master-data/provinces[/{code}][/status]` | create/update/status thunks |
| | GET/POST/PUT | `master-data/provinces/{code}/wards[/{code}][/status]` | ward thunks |
| | GET | `master-data/provinces/{code}/wards/{code}` (legacy mapping detail) | `getLegacyAdministrativeMappings` |
| `card-management/` | GET | `cards/services` (list, and separately for filter options) | `getCardServiceList`, `getCardServiceFilterCodeOptions` |
| | PUT | `cards/services` (bulk reorder) | `updateCardServiceList` |
| | GET/PUT | `cards/services/{id}` (detail, edit, and status — **edit and status PUT the same path with different body shapes**) | `getCardServiceDetail`, `updateCardService`, `updateCardServiceStatus` |
| | GET | `cards/services/history/{id}` | `getListUpdatedHistories` |
| `ekyc-config/` | GET/PUT | `verification-step/{code}[/update]` | detail + update |
| | GET/PUT | `system-setting[/update]` | the `SYSTEM_SETTING_OTHER` resource |
| | GET | `verification-type/{code}/audit` | history (including for `SYSTEM_SETTING_OTHER`, §13) |
| `priority-service/` | GET | `priority-services` | list |
| | GET/PUT | `priority-services/{id}` (detail, edit, and status — same two-shapes-one-path pattern as `card-management/`) | detail, update, status |
| | GET | `priority-services/history/{id}` | history |
| `system-management/` | none directly — consumes `maintenance`'s and `version-settings`' own endpoints via their slices | — |
| `master-data.system.tsx` | GET | `master-data` (`keyword`, `page:0`, `size:10` fixed) | `getMasterData` |

No runtime response validation exists anywhere in this scope (no Zod); per `.claude/rules/03-api-service.md` `## Contracts and errors`, an absent Zod parse on stable CRUD endpoints is the default boundary assumption, not a gap — not flagged as one here. `error?.data?.message`-only rethrows in `ekyc-config.slice.ts` drop status/code (§13).

## 7. Forms and validation

All five submodules use AntD `Form`/`FormInstance` exclusively; no Zod and no React Hook Form anywhere in this scope (confirmed by grep in every directory). AntD `rules` cover required fields and a few regex/range constraints (`administrative-unit`'s code pattern `/^[A-Z0-9]{1,10}$/`; `ekyc-config`'s integer/decimal/range rule builders in `edit/general.tsx:40-99`, the module's most elaborate validation). `card-management/`'s and `priority-service/`'s edit forms validate `serviceName` as the only required field. `ekyc-config/edit/general.tsx` additionally re-runs `form.validateFields()` on every load (not just on submit), which can surface validation errors on page open for already-stored out-of-range values (LIKELY, §13). None of this is a gap under `.claude/rules/05-form.md`: these are untouched legacy forms with simple constraints, which AntD rules alone are permitted to express.

## 8. Types and DTO organization

Every submodule's domain types live in a global ambient `.d.ts` file with no React/JSX import — a repository-wide `LEGACY-COMPATIBILITY` pattern, not specific to one submodule: `src/types/administrative-unit.ts`, `src/types/card-service-management.d.ts`, `src/types/ekyc-config.d.ts`, `src/types/priority-service.d.ts`. All four additionally depend on the cross-domain ambient type `UpdatedHistory` (`src/types/product-industry.d.ts:131`, owned by the `products` domain) for their history tables — a pre-existing shared-ambient-type dependency, not introduced by this work. Type drift exists in two places: `card-service-management.d.ts`'s `CardServiceListFilter.serviceCode` (singular) versus the actual searcher field `serviceCodes` (plural, `card-management-list-searcher.form.tsx:50,59`); and `CardServiceList.status` (`'ACTIVE'|'INACTIVE'`) versus `CardServiceDetail.status: Status` (the broader shared union). Each submodule's own thunk error type (`administrative-unit`'s `AdministrativeUnitApiError`, etc.) is normalized independently in up to three places (slice, middleware, component) per submodule — duplicated logic, not a type-organization defect.

## 9. Permissions

This document's scope references **13** distinct `PERMISSIONS.*` constants (module-scoped grep across the five submodule directories plus the loose files finds the same 13 — no route/menu-only constant is missed here, unlike the `users`/`notifications` cases, because every constant below is also referenced inside its owning directory). Per content rule 9 (>10 constants), a table follows, one row per constant, with every enforcement site:

| Constant | `permission.constant.ts` | Route(s) | Menu | Component |
| --- | --- | --- | --- | --- |
| `ADMINISTRATIVE_UNIT_VIEW` | `:296` | `main.routes.tsx:131` (OR, landing), `:141` (single, own route) | `menus.helper.ts:551` (OR, landing's entry) | — |
| `ADMINISTRATIVE_UNIT_EDIT` | `:297` | — | — | `administrative-unit/index.tsx:144` (single, gates add/edit/status controls) |
| `BANK_VIEW` | `:298` | `main.routes.tsx:131` (OR, landing) | `menus.helper.ts:551` (OR) | — (owned by `bank-list/`, documented there) |
| `MAINTENANCE_SETTINGS_VIEW` | `:302` | `main.routes.tsx:405` (OR, `system-management`), `:412` (single, `ekyc-config` list), `form.routes.tsx:900,906` (single, `ekyc-config` view/edit — **the only guard on the edit route**) | `menus.helper.ts:558` (OR) | `system-management/index.tsx:50` |
| `VERSION_SETTINGS_VIEW` | `:310` | `main.routes.tsx:405` (OR) | `menus.helper.ts:558` (OR) | `system-management/index.tsx:59` |
| `EKYC_CONFIG_VIEW` | `:306` | — (routes use `MAINTENANCE_SETTINGS_VIEW` instead, see above) | `menus.helper.ts:565` (single) | — |
| `EKYC_CONFIG_EDIT` | `:307` | — (**no route checks this at all, including the edit route**) | — | `ekyc-config/view/form.tsx:134` (single, gates the Edit button only) |
| `CARD_SERVICE_MANAGEMENT_VIEW` | `:314` | `main.routes.tsx:421` (OR), `form.routes.tsx:977` (single) | `menus.helper.ts:572` (single) | — |
| `CARD_SERVICE_MANAGEMENT_EDIT` | `:315` | `main.routes.tsx:421` (OR), `form.routes.tsx:915,987` (single) | — | `card-management/view/form.tsx:136,138`; **also, incorrectly, `priority-service/view/form.tsx:135,139`** (see below) |
| `PRIORITY_SERVICE_MANAGEMENT_VIEW` | `:323` | `main.routes.tsx:445`, `form.routes.tsx:997` (single) | `menus.helper.ts:579` (single) | — |
| `PRIORITY_SERVICE_MANAGEMENT_EDIT` | `:324` | `form.routes.tsx:1007` (single) | — | **never referenced in a component — `priority-service/view/form.tsx` uses `CARD_SERVICE_MANAGEMENT_EDIT` instead** |
| `PRODUCT_CREATE_CREDIT_CARD` | `:147` | — | — | `card-management/list.tsx:162-165` (OR with the next row, gates the "Sắp xếp" button only) |
| `PRODUCT_CREATE_CASH_LOAN` | `:148` | — | — | `card-management/list.tsx:162-165` (OR) |

Permission-check kind, confirmed per call site per the template's rule (never inferred from a neighbor): every route array above is a plain array passed to `WithGuard`, resolved via `.some()` in `src/guards/index.tsx:32` (OR, including every single-element array, which is trivially equivalent to a plain check). Every component-level check above uses `useHasPermission([...])` / `hasPermission([...])`, whose default `mode` is `"some"` (`src/hooks/auth.hook.ts:27-36`) — OR, including the single-element sites. `card-management/list.tsx:162-165` is the only genuine multi-permission OR check at the component level in this scope.

**Confirmed defect, highest-consequence finding in this document:** `priority-service/view/form.tsx:135,139` gates the Edit button and the status-toggle button with `hasPermission([PERMISSIONS.CARD_SERVICE_MANAGEMENT_EDIT])` — the `card-management/` constant, not `PERMISSIONS.PRIORITY_SERVICE_MANAGEMENT_EDIT`. This is a copy-paste artifact from `card-management/view/form.tsx:136,138`, which is correct for its own module. Consequence: a user holding `PRIORITY_SERVICE_MANAGEMENT_EDIT` but not `CARD_SERVICE_MANAGEMENT_EDIT` sees no Edit button and no status toggle on the priority-service view page, even though the edit **route** itself correctly requires `PRIORITY_SERVICE_MANAGEMENT_EDIT` (`form.routes.tsx:1007`) and would admit them via a direct URL. Conversely, a user holding `CARD_SERVICE_MANAGEMENT_EDIT` but not `PRIORITY_SERVICE_MANAGEMENT_EDIT` sees the buttons but is redirected to 404 on click. Backend enforcement of either permission is `NEEDS-VERIFICATION`; this is a frontend-only finding and frontend guards are not a backend security boundary.

## 10. Shared and cross-domain dependencies

Within `src/modules/system/`, `master-data.system.tsx` and `administrative-unit/` share one Redux slice (`administrative-unit.slice.ts`); `system-management/index.tsx` reads two other submodules' slices (`maintenance`'s and `version-settings`') directly via a relative import into `../maintenance/stores/redux/slices/system-maintenance.slice`, crossing a module-internal folder boundary that `.claude/rules/01-architecture.md` discourages (existing, `LEGACY-COMPATIBILITY`, not introduced by this work).

Cross-domain imports into this scope from other top-level domains:
- `ekyc-config/view/history.tsx:7` imports `convertFieldActionType` from `@/modules/products/configuration/industry-product/ultis` — a `products`-domain internal file.
- `card-management/view/history.tsx:16` and `priority-service/view/history.tsx:16` each import a `SystemMaintenanceTabs`/`SystemMaintenanceTabs`-equivalent enum from `../../maintenance/constant` (a `system`-internal cross-submodule import, coincidentally matching by value only).

Cross-domain imports **out of** this scope (confirmed leakage in the opposite direction): `src/modules/contents/banner/utils.ts:16-27` contains an identical copy of `card-management/ultis.tsx`'s `convertFieldActionType`, typed against the card-management-named global `CardServiceUpdatedActionType`; `src/modules/contents/popup/utils.ts:1` re-exports that banner copy. A rename of the card-management ambient type would silently break `contents/`.

No component or page file from any of the five submodules or the loose files is imported by code outside `src/modules/system/` (confirmed per-submodule by a full-repository grep for each submodule's distinguishing symbol names, excluding the submodule's own directory, routes, menu, and Redux registration).

## 11. Consumers

- Every submodule and loose page is consumed only through its own `lazy()` route entry in `src/routes/pages.tsx` plus `src/routes/main.routes.tsx`/`form.routes.tsx` — standard routing wiring, not a feature-level consumer relationship.
- `administrative-unit.slice.ts`'s `getMasterData`/`watchMasterData`/`watchMasterDataLoading` are additionally consumed by `master-data.system.tsx` (its only outside consumer).
- `system-management/index.tsx` is navigated to (not imported) from `maintenance/view/form.tsx:90` and `version-settings/view/form.tsx:55` after a save/cancel action — a navigation relationship, not an import.
- `card-management/`'s and `priority-service/`'s `convertFieldActionType` each have exactly one in-module consumer (their own `view/history.tsx`), plus the one confirmed out-of-domain copy in `contents/banner` (§10).
- No dynamic or registry-based consumer exists for anything in this scope.

## 12. Pattern classification

All five submodules are **mixed, and mixed in the same way**: `LEGACY-COMPATIBILITY` in state ownership (Redux, one resource, no second owner — itself a clean instance of the "one authoritative owner" rule, not a violation), `LEGACY-COMPATIBILITY` in service location (no feature service, thunks call `apiFetcher` directly, no `src/services/system/` entry for any of the five), `target-compatible` in forms (AntD `Form`/`FormInstance`, no competing owner), `LEGACY-COMPATIBILITY` in styling (Emotion `css`/`<Global>`, no `.module.scss` anywhere in this scope), and **not compliant** with `.claude/rules/11-i18n.md` in the same specific way across all five: nearly every UI string is a hardcoded Vietnamese literal, with only a handful of `t()` calls per submodule (`administrative-unit`: 3 call sites; `system-management`: 0; others similar). This is recorded as a current-state fact against an applicable rule, consistent with how `docs/modules/system/BANK-LIST.md` §12 already recorded the same finding for `bank-list/`, not as a judgment this document invents. Per the Nov-4 server-state-ownership policy addition to `CLAUDE.md`/`.claude/ARCHITECTURE.md` §20 (Redux deprecated as a new-resource owner; existing Redux-owned server resources are `LEGACY-COMPATIBILITY`, migrated one resource per dedicated PR), all four Redux slices in this scope are exactly the kind of existing resource that policy describes — this document records that fact without resolving whether or when any of the four should be migrated.

`card-management/` and `priority-service/` additionally share a confirmed, near-identical view/edit/history file structure (direct `diff` showed `view/history.tsx` and `edit/form.tsx` differing only in names; `ultis.tsx` differing only in formatting) — a copy-paste lineage, not a shared abstraction. The two have since diverged (`card-management/` gained a searcher/sort/upload that `priority-service/` lacks; `priority-service/` added a required-reason disable flow that `card-management/` lacks), and the copy carried forward at least one wrong constant (§9).

## 13. Technical risks

1. **Wrong permission constant gates priority-service's edit UI** (§9). `priority-service/view/form.tsx:135,139` uses `CARD_SERVICE_MANAGEMENT_EDIT` instead of `PRIORITY_SERVICE_MANAGEMENT_EDIT`, copy-pasted from `card-management/`. Highest consequence in this document: UI-visible-but-blocked and UI-hidden-but-reachable both occur depending on which of the two permissions a user actually holds.
2. **`ekyc-config`'s edit route has no edit-permission check at all.** `form.routes.tsx:904-908` guards the edit route with only `MAINTENANCE_SETTINGS_VIEW`; `EKYC_CONFIG_EDIT` exists as a constant and gates only the view page's Edit *button* (`view/form.tsx:134`), never the edit route itself. A direct URL to `/ekyc-config/edit/:id` is reachable by anyone holding `MAINTENANCE_SETTINGS_VIEW`, view-only or not.
3. **`master-data.system.tsx`'s two row links are not individually permission-gated** (§4.6), reachable both for `ADMINISTRATIVE_UNIT` and `BANK` rows under the page's own OR permission gate — the same class of finding `BANK-LIST.md` §13 already recorded for the `BANK` half; this document additionally confirms it for the `ADMINISTRATIVE_UNIT` half.
4. **Two different request-body shapes PUT to the same endpoint** in both `card-management/` (`cards/services/{id}`, edit body vs. status-toggle body) and `priority-service/` (`priority-services/{id}`, same pattern) — backend acceptance of both shapes on one path is `NEEDS-VERIFICATION`.
5. **Three unguarded placeholder routes** (`display.system.tsx`, `integration.system.tsx`, `company.system.tsx`) are reachable by any authenticated user via direct URL; none renders anything beyond its own name. Whether these should be removed, gated, or left as-is is `NEEDS-TEAM-DECISION`.
6. **One true orphan file**, `maintenance.settings.tsx` — unrouted, unreferenced, unrelated to the real `maintenance/` submodule it is named after. Deletion is `NEEDS-TEAM-DECISION`, not performed here.
7. **Shared broad `loading` flag per slice** (§5) — in `card-management/`, `ekyc-config/`, and `priority-service/` alike, one flag covers list, detail, update, and (in some cases) history fetches, so an unrelated request on the same page can toggle a visible spinner meant for a different action.
8. **Silent failures on specific error codes.** `administrative-unit`'s middleware deliberately skips notification for codes `002`/`003`/`004` (relying on inline form errors that only fire for the matching code/type combination) — a code/type mismatch is swallowed by both layers with no user-visible feedback. `ekyc-config.slice.ts`'s two update thunks rethrow `new Error(error?.data?.message)`, dropping status/code information.
9. **`ekyc-config`'s history tab always renders for the `SYSTEM_SETTING_OTHER` pseudo-resource**, calling `verification-type/SYSTEM_SETTING_OTHER/audit` — whether that endpoint is valid for that pseudo-id is `NEEDS-VERIFICATION`; no failure notification exists for this specific request if it 404s (no middleware listener for that thunk's rejection).
10. **Cross-domain duplication of `convertFieldActionType`** (§10): the same function body exists in `card-management/ultis.tsx`, `priority-service/ultis.tsx`, and a `contents/banner/utils.ts` copy that imports a card-management-named ambient type — a rename in one place breaks the others silently.
11. **Reverse cross-module dependency into `maintenance/` internals** from both `system-management/index.tsx` (slice) and `card-management/`/`priority-service/`'s history tabs (a shared tab-name enum) — none of these three submodules owns the file it depends on.
12. **`system-management/`'s unused config fetch**: `getVersionSettingsConfig()` is dispatched on mount but its data is never read by the page — only its loading flag is used. Harmless but wasteful.
13. **Stale province ward-count display** in `administrative-unit/`: after a ward create/update (not a status change), the province list is not reloaded, so the deactivate-province dialog's `activeWardCount` can read stale.
14. **Hardcoded Vietnamese UI text across all five submodules** (§12) — consistent with, not worse than, the already-documented `bank-list/` finding; recorded here as a current-state fact, not a new judgment.

## 14. Areas to avoid touching

- `src/redux/slices/administrative-unit.slice.ts`, `card-management.slice.ts`, `ekyc-config.slice.ts`, and `priority-service.slice.ts` — each is the sole owner of its server resource and is shared by more than one page within its own submodule (list + detail + history all read the same slice); a change to one thunk's shape affects every consumer in that submodule simultaneously.
- `src/modules/system/maintenance/stores/redux/slices/system-maintenance.slice.ts` and `src/modules/system/maintenance/constant.ts` — not owned by this document's scope, but depended on by `system-management/index.tsx`, `card-management/view/history.tsx`, and `priority-service/view/history.tsx`; a change there has effects outside `maintenance/` itself.
- `src/modules/contents/banner/utils.ts`'s `convertFieldActionType` copy and its dependency on `CardServiceUpdatedActionType` — not owned by this document's scope, but a rename of that ambient type (owned by `card-management/`) would silently break `contents/banner` and `contents/popup`.
- The three permission constants at the center of findings 1 and 2 (`CARD_SERVICE_MANAGEMENT_EDIT`, `PRIORITY_SERVICE_MANAGEMENT_EDIT`, `EKYC_CONFIG_EDIT`) — fixing either finding, if ever authorized, is a permission-semantics change and is `HIGH-RISK` per `.claude/rules/06-routing-permission.md`; this document records the findings but does not fix them.

## 15. Open questions

- `NEEDS-VERIFICATION`: whether the `priority-service` permission bug (§9, §13 item 1) and the `ekyc-config` missing edit-route guard (§13 item 2) are also absent on the backend, or whether backend authorization independently covers them.
- `NEEDS-VERIFICATION`: backend acceptance of the two-request-body-shapes-one-PUT-path pattern in `card-management/` and `priority-service/` (§13 item 4).
- `NEEDS-VERIFICATION`: whether `verification-type/SYSTEM_SETTING_OTHER/audit` is a valid backend endpoint (§13 item 9).
- `NEEDS-VERIFICATION`: whether `master-data.system.tsx`'s backend ever returns more than 10 rows or a `code` other than `ADMINISTRATIVE_UNIT`/`BANK` (§0 item 2).
- `NEEDS-VERIFICATION`: whether `system-management/`'s two `size:1` history dispatches can ever visibly truncate a history list shown elsewhere by `maintenance/` or `version-settings/` (§4.5).
- `NEEDS-TEAM-DECISION`: whether the three unguarded placeholder routes and the one orphan file (§13 items 5-6) should be removed, gated, or left as documented stubs.
- `NEEDS-TEAM-DECISION`: whether any of the four Redux-owned server resources in this scope (`administrative-unit`, `card-management`, `ekyc-config`, `priority-service`) should be scheduled for the one-resource-per-PR TanStack Query migration the Nov-4 policy enables, and in what order. Not resolved here.
- `NEEDS-TEAM-DECISION`: whether `priority-service/`'s and `card-management/`'s diverged-but-copy-pasted view/edit/history structure should eventually share a common extraction, given they have already diverged in required-reason behavior and field sets.
