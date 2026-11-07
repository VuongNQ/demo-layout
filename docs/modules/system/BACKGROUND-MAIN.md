# Background Main (+ Background Main Lock) — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `portal-cham-vay`; `git status` clean for `src/modules/system/theme-management/background-main/` and `background-main-lock/`.
- Date: 2026-11-04.
- Method: static source inspection only, via two independent read-only `codebase-analyzer` delegations (one per child), each citing file:line. No runtime, browser, auth, or backend verification was performed.
- Scope: `src/modules/system/theme-management/background-main/` (**27 files**, 4,065 lines) and `src/modules/system/theme-management/background-main-lock/` (**14 files**, 1,893 lines), both via `find ... -type f | wc -l` / `wc -l`. Covered together in one document — see `docs/modules/system/THEME-MANAGEMENT.md` §0 for the split rationale (tight coupling: the lock module reads Background Main's own detail-query cache, and a shared error utility moved between the two). `topic/` is **not** covered here — see `TOPIC.md`.
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Whether multi-image card selections in Background Main's create/edit form are ever actually persisted to the backend — static reading of the form field wiring shows no path from the multi-image picker (`cardImages`) to any submitted request field (every submit handler reads a non-existent `cardImage` field instead); this is the single highest-consequence finding in this document (§13, risk 1).
  2. Whether the backend still returns `THEME_LOCK_PERIOD_NOT_COVERED` on a *lock* save, and with what HTTP status — the lock module's own special-case handling for this code was deliberately removed (2026-10-23), confirmed still removed in current source, so this determines whether a real user-visible regression is live today (§13, risk 2).
  3. Whether an edit to a Background Main item whose assigned Topic has since become `INACTIVE` or `ENDED` is an intended block or an unintended one — the edit page's option list still shows the now-invalid category, but submission rejects it, with no client-side warning before that point (§13, risk 3).
  4. Whether a default (no-period) Background Main with a past-dated effective period, switched to default after having a period, can have its dates edited while still marked default — static reading shows the date pickers are disabled whenever `isDefault` is true, but the past-date guard runs whenever `hasEffectivePeriod` is true, a combination that is reachable only by toggling `isDefault` off first (§13, risk 9).
  5. Whether saving a Background Main item changes a Topic's displayed `themeCount` — Background Main's mutations invalidate only Background-Main-owned query keys, never any Topic-owned key (§13, risk 10).

## Part A — Background Main

## 1. Responsibility

Admin configuration of a single "Main Background" entity (backend/wire name still `themes`, a full-screen background image with an optional in-app message, optional period, optional Topic/category associations, optional customer-segment targeting, and optional card/exclusive-touch supporting images) for the mobile app's home screen. List, create, edit, view-with-history; no delete and no direct status-change endpoint — `displayStatus` is entirely backend-computed and read-only on the frontend.

## 2. Entry points and routes

Per content rule 13, evidence below was gathered from `src/routes/main.routes.tsx`, `src/routes/form.routes.tsx`, `src/routes/pages.tsx`, `src/helpers/menus.helper.ts`, and `src/utils/navigate.ts`.

| Route | File:line | Layout | Permission | Check kind |
| --- | --- | --- | --- | --- |
| `PageURLs.ofBackgroundMainList()` | `main.routes.tsx:396-397` | MainLayout | `[THEME_VIEW]` | single |
| `PageURLs.ofBackgroundMainCreate()` | `form.routes.tsx:148-150` | BasicLayout | `[THEME_CREATE]` | single |
| `PageURLs.ofBackgroundMainView(':id')` | `form.routes.tsx:152-154` | BasicLayout | `[THEME_VIEW]` | single |
| `PageURLs.ofBackgroundMainEdit(':id')` | `form.routes.tsx:156-163` | BasicLayout | `[THEME_VIEW, THEME_EDIT, THEME_CATEGORY_VIEW]` | route-level OR (`src/guards/index.tsx:32`, `.some()`); **page-level AND** (`BackgroundMainEditPage/index.tsx:64`, `'every'`) — effective behavior for this one route is AND, since the page redirects to 404 if any of the three is missing even though the route itself admits a user holding only one |

Lazy exports (`src/routes/pages.tsx`): `BackgroundMainListPage` (192-194), `BackgroundMainCreatePage` (202-204), `BackgroundMainViewPage` (205-207), `BackgroundMainEditPage` (208-210). `PageURLs` builders: `src/utils/navigate.ts:276-301` (`ofBackgroundMainList/Create/View/Edit`, all prefixed `/system-management/theme-configuration/background-main`). Menu: `src/helpers/menus.helper.ts:426-431`, key `Menu.themeList`, link `ofBackgroundMainList()`, single permission `[THEME_VIEW]` — confirmed still the exact key name per the "deliberately not renamed" list (`THEME-MANAGEMENT.md` §1). Legacy entry points: the two root-owned redirect routes in `main.routes.tsx:377-391`, detailed in `THEME-MANAGEMENT.md` §2, map legacy `/theme-configuration/themes/*` paths onto these routes via `ThemeConfigurationRedirect.tsx`. Breadcrumbs (`src/helpers/breadcrumbs.helper.ts:57-88`) have no Background-Main-specific special case; only the list route matches a menu key for crumb resolution — whether create/view/edit/lock routes render a breadcrumb at all is `NEEDS-VERIFICATION`.

**Confirmed reachability gap:** with a partial permission set, the create page does not degrade gracefully. A user holding `THEME_CREATE` but not `THEME_CATEGORY_VIEW` reaches the create route (gated only on `THEME_CREATE`) but sees an empty category list (`BackgroundMainCreatePage/index.tsx:61,65,91`, the Topic query is gated by `canViewTopics`) and cannot save anything but a `default` background, since the category-completeness check blocks non-default saves (`:112-115`).

## 3. Directory map (27 files, 4,065 lines)

```text
src/modules/system/theme-management/background-main/
|-- components/
|   |-- BackgroundMainAssetPicker/
|   |   |-- CardImagesPicker.tsx            # multi-image (max 5) picker, dnd-kit reorder, writes `cardImages`
|   |   |-- index.tsx                       # single-image picker (background/exclusive-touch), object-URL lifecycle
|   |   `-- styles.module.scss
|   |-- BackgroundMainForm/
|   |   |-- index.tsx                       # shared create/edit AntD form, sync Zod validation, dirty tracking (644 lines)
|   |   `-- styles.module.scss
|   |-- BackgroundMainPageShell.tsx          # pushes header/footer into layout context; hides form footer
|   |-- BackgroundMainPreview/
|   |   |-- index.tsx                       # simulation home-page preview from the image model
|   |   `-- styles.module.scss
|   `-- BackgroundMainUpdateHistory/
|       |-- index.tsx                       # paginated audit-history table
|       `-- styles.module.scss
|-- hooks/
|   |-- background-main.queries.hook.ts      # create/update/upload mutation hooks
|   `-- useBackgroundMainCustomerSegments.hook.ts  # cross-domain customer-segment options query
|-- queryKeys/
|   `-- background-main.query-keys.ts        # key factory, queryOptions colocated
|-- schemas/
|   `-- background-main-form.schema.ts       # Zod base schema + create/edit refinements (206 lines)
|-- services/
|   `-- background-main.service.ts           # ApiFetcher wrappers: themes endpoint + file upload (162 lines)
|-- types/
|   `-- background-main.types.ts             # DTOs, request union, display-status/history-action constants
|-- utils/
|   |-- background-main-api-mapper.helper.ts        # response -> list row and detail view model
|   |-- background-main-create-mapper.helper.ts     # form values -> create request
|   |-- background-main-edit-mapper.helper.ts       # response -> form; form -> update request; mapping error (152 lines)
|   |-- background-main-image.validation.ts         # format/size (5 MB)/readable-dimension checks (120 lines)
|   |-- background-main-lock-period-error.util.ts   # detects backend code THEME_LOCK_PERIOD_NOT_COVERED (moved here, single consumer)
|   `-- background-main-theme.mapper.ts             # preview model -> SimulationThemeConfig
`-- views/
    |-- BackgroundMainCreatePage/index.tsx   # create: category list, upload, create mutation (211 lines)
    |-- BackgroundMainEditPage/index.tsx     # edit: detail load, upload, update, conflict/error handling (433 lines)
    |-- BackgroundMainListPage/index.tsx     # list shell, embeds the shared BackgroundMainTableSection
    `-- BackgroundMainViewPage/
        |-- index.tsx                        # read-only detail: general + history (370 lines)
        `-- styles.module.scss
```

No ambient/global types, no tests, no barrel files.

## 4. Main runtime flows (CONFIRMED)

- **List:** `BackgroundMainListPage` embeds the shared `theme-management/components/BackgroundMainTableSection`, which calls `useQuery(backgroundMainQueryKeys.list(params))` → `GET api/admin/portal/v1/themes`, default order `createdDate,desc`.
- **View:** `GET themes/{id}` → mapped to a detail view model (`background-main-api-mapper.helper.ts:52-70`).
- **Create** (`BackgroundMainCreatePage.handleCreate`): category-completeness check → background-image-required check → `POST api/admin/file` (background upload, `metadata.context: 'THEME'` — confirmed still using this literal, per the "deliberately not renamed" list) → storage-key guard → optional card/exclusive-touch uploads → `mapBackgroundMainFormValuesToCreateRequest` → `POST themes` → navigate to list.
- **Edit** (`BackgroundMainEditPage.handleSubmit`): same upload steps → `mapBackgroundMainFormValuesToUpdateRequest` (includes `version` for optimistic locking) → `PUT themes/{id}` → navigate to view on success.
- **Business rules, all CONFIRMED with file:line:** effective-period dates required when `hasEffectivePeriod` is true (`schema:104-119`, both create and edit); end date not before start (`schema:94-99`); a past-dated effective period blocks save **on edit only**, via a `superRefine` step not present in the create schema (`schema:127-145`, invoked at `:182`); a `default` background disables date pickers and customer-segment selection and forces `enabled: true` (`BackgroundMainForm/index.tsx:481,499,418,519`); categories must be positive integers (`schema:158-169`); card images are capped at 5 (`schema:10,50-53`); images are capped at 5 MB with a format allow-list and a readable-dimension check (`background-main-image.validation.ts`).

## 5. State ownership — Query-owned module checklist (content rule 15)

- **No Redux slice touches this resource** — `grep -ri theme src/redux` returns zero matches; `src/redux/slices/layout.slice`'s `setHiddenFormFooter` (client UI state only) is the module's only Redux usage.
- **Query key factory** (`queryKeys/background-main.query-keys.ts`): keys and `queryOptions` colocated — `all`/`lists()`/`details()`/`histories()`/`historyById(id)` prefix helpers, plus fetch methods `list(params)`, `detail(id)`, `history(id,params)`. Imports only the feature service (`.ts:1-7`), not React/UI — target-compatible per `.claude/rules/03-api-service.md`.
- **Every query, with `staleTime`/`placeholderData`/`enabled`/consumer count:**

  | Query | `staleTime` | `placeholderData` | `enabled` | Consumers |
  | --- | --- | --- | --- | --- |
  | `list(params)` | `CACHE_STALE_TIME` (60s, `src/constants/common.constant.ts:14`) | `keepPreviousData` | none | `BackgroundMainTableSection` (shared layer, outside this module) |
  | `detail(id)` | none (TanStack default of 0; `QueryProvider` sets only `retry`/`refetchOnWindowFocus`) | n/a (not paginated) | `isSafeInteger(id) && id > 0` | `BackgroundMainEditPage`, `BackgroundMainViewPage`, **and** `background-main-lock/`'s `useQueries` call (Part B §9 below) |
  | `history(id,params)` | `CACHE_STALE_TIME` (60s) | `keepPreviousData` | `id > 0` | `BackgroundMainUpdateHistory` |

- **Mutations, with exact invalidation/`setQueryData` behavior:**
  - **Create** (`hooks:13-25`): `retry: false`; `onSuccess` returns (and is therefore awaited by TanStack) `invalidateQueries({queryKey: lists()})`. No `setQueryData`.
  - **Update** (`hooks:27-54`): `retry: false`; `onSuccess` calls `setQueryData(detail(id).queryKey, response)` (the **one** `setQueryData` use in this module) **then immediately** `await Promise.all([invalidateQueries(lists()), invalidateQueries(historyById(id))])` — the just-written detail cache entry is marked stale again one line later, a redundant-but-harmless double write (consistent with the same pattern already documented for Theme/Topic in the superseded guide, now re-confirmed in current source rather than carried forward unverified).
  - **Upload** (`hooks:56-60`): `retry: false`, no invalidation at all — expected, since an upload alone changes nothing until the subsequent create/update call completes.
- **Correction to a superseded documentation claim:** the deleted `REACT_QUERY_GUIDE.md` cited a `LIST_QUERY_STALE_TIME_MS` constant (`theme-management/constant.ts:3`, value `60_000`) as the source of the `staleTime` above. That constant does not exist anywhere in `src/` — the actual constant in use, confirmed at the call sites above, is the repository-wide `CACHE_STALE_TIME` from `src/constants/common.constant.ts:14`. See `THEME-MANAGEMENT.md` §4.5 for the full correction.
- **Edit-page draft lifecycle:** `detailQuery.data` maps to `defaultValues` via `useMemo`; `BackgroundMainForm` resets only when `defaultValues`' identity changes **and** there are no unsaved changes (`BackgroundMainForm/index.tsx:77-89`) — a dirty-edit-preserving reset policy, not a blind `reset(query.data)`. On a version conflict, the page remounts via `key={`${id}-${formRevision}`}` rather than mutating state in place.

## 6. API boundaries

`services/background-main.service.ts` (module-local, `LEGACY-COMPATIBILITY`):

| Method | Path | Function |
| --- | --- | --- |
| GET | `api/admin/portal/v1/themes?keyword&status&page&size&orderBy` | `getBackgroundMains` |
| GET | `api/admin/portal/v1/themes/{id}` | `getBackgroundMainById` |
| POST | `api/admin/portal/v1/themes` | `createBackgroundMain` |
| PUT | `api/admin/portal/v1/themes/{id}` (body includes `version`) | `updateBackgroundMain` |
| GET | `api/admin/portal/v1/themes/{id}/history?page&size&sort` | `getBackgroundMainHistory` |
| POST | `api/admin/file` (multipart: `file` + `metadata` blob, `context: 'THEME'`) | `uploadBackgroundMainBackground` |

No `as`-cast anywhere in the service; runtime guards exist only for the upload response (`mapBackgroundMainUploadToStorageKeys`/`mapBackgroundMainUploadToAssetKey`, both throwing a typed error on an unexpected shape) — acceptable for stable CRUD per `.claude/rules/03-api-service.md`, not flagged as a gap. One non-null assertion exists at `CardImagesPicker.tsx:177` (`asset.file!`).

## 7. Forms and validation

AntD `Form.useForm<BackgroundMainFormValues>()` is the sole form-state owner (`BackgroundMainForm/index.tsx:69`). Validation is **synchronous** Zod only: `validateBackgroundMainValues` calls `schema.safeParse(form.getFieldsValue(true))` (`:630-644`) — no `safeParseAsync`, no async refinements (contrast Topic's async pattern, `TOPIC.md` §7). Schema selection is by mode (`backgroundMainCreateFormSchema` vs. `backgroundMainEditFormSchema`, `:634`); the edit schema adds only the past-dated-period guard on top of the shared base (`schema:180-204`). Issues map via `applyZodIssues` (`:602-628`), which groups by path and calls `form.setFields`; a pathless issue would fall back to the `name` field (`:610`), though no current schema issue lacks a path. Validation runs pre-flight on submit and, once a field already has an error, on every subsequent value change (`:104-112`).

**Confirmed, highest-consequence finding in this document — card images are selected in the UI but never persisted.** `BackgroundMainForm/index.tsx:228-230` wires `Form.Item name='cardImages'` to the multi-image `CardImagesPicker`; there is **no** `Form.Item name='cardImage'` anywhere in this form. Both `BackgroundMainCreatePage` (`:132-135`) and `BackgroundMainEditPage` (`:231-238`) read only `values.cardImage?.file` when building the upload/request payload — a field the form never populates. The preview component, by contrast, does read `cardImages` (`BackgroundMainForm/index.tsx:95-98`; `background-main-theme.mapper.ts:14`), so a user can see a multi-image preview that will never be saved. A schema comment (`schema:49`) notes "the API still stores a single card image," suggesting the multi-image picker was added ahead of a backend contract that was never wired up on the frontend side — which picker item (if any) should map to that one persisted field is `NEEDS-TEAM-DECISION` (§13, risk 1).

## 8. Types and DTO organization

Feature-local only, in `types/background-main.types.ts`: `BackgroundMainResponse`, a request union discriminated by `isDefault`, and the upload-response types. No global ambient type is used anywhere in this module. `BackgroundMainFormValues = z.infer<typeof backgroundMainFormSchema>`. Mapper transformations: response→form (`background-main-edit-mapper.helper.ts:27-51`, including `hasEffectivePeriod = Boolean(startAt || endAt)` and GMT+7 date parsing via the shared `effective-period-date.util.ts`); form→create-request (`background-main-create-mapper.helper.ts:23-54`, serializing dates to `YYYY-MM-DDT00:00:00+07:00`/`23:59:59+07:00`); form→update-request (`background-main-edit-mapper.helper.ts:90-152`, preserving an unchanged calendar date's original backend string rather than re-serializing it). One reverse dependency exists: `utils/background-main-theme.mapper.ts:2` imports a type from `components/BackgroundMainPreview`, a util depending on a component.

## 9. Permissions

Full set referenced in this module: `THEME_VIEW`/`THEME_CREATE`/`THEME_EDIT` (`permission.constant.ts:291-293`) and, for the category picker and the edit route's AND gate, `THEME_CATEGORY_VIEW` (`:286`). Every check confirmed per call site:

- `THEME_CREATE` — single, create button on list (`BackgroundMainListPage.tsx:18`) and in the shared table section (`BackgroundMainTableSection/index.tsx:108`).
- `THEME_EDIT` — single, edit-footer visibility on the view page (`BackgroundMainViewPage/index.tsx:131`).
- `THEME_CATEGORY_VIEW` — single, gates the create page's Topic query (`BackgroundMainCreatePage/index.tsx:61`); **not gated the same way on the edit page** (`BackgroundMainEditPage/index.tsx:79-81` has no equivalent `canViewTopics` check, though this is unreachable in practice since the edit route itself already requires `THEME_CATEGORY_VIEW`).
- `[THEME_VIEW, THEME_EDIT, THEME_CATEGORY_VIEW]` — the edit page's own in-component check, `'every'` (AND) (`BackgroundMainEditPage/index.tsx:64`), layered on top of the route's OR gate (§2).
- `THEME_CREATE` or `THEME_EDIT` — single-or-single, submit-button gate (`BackgroundMainForm/index.tsx:68`).
- `CUSTOMER_SEGMENT_VIEW` — single, gates the customer-segment query and field (`BackgroundMainViewPage/index.tsx:132`, `BackgroundMainForm/index.tsx:384`).

## 10. Shared and cross-domain dependencies

- **Reads from `topic/` (one direction only, confirmed, see `THEME-MANAGEMENT.md` §10):** `BackgroundMainCreatePage/index.tsx:10-11,64-66` and `BackgroundMainEditPage/index.tsx:14-15,79-80` import `topicQueryKeys` and `THEME_CATEGORY_DISPLAY_STATUS` from `topic/`, to populate and display the category picker. `topic/` never imports from this module.
- **Read *by* `background-main-lock/`:** this module's `backgroundMainQueryKeys.detail(id)` cache entry is read cross-module by the lock page's `useQueries` call (Part B §9) — a confirmed, read-only consumer relationship, not a second owner of this module's detail resource.
- **Cross-domain, outside `theme-management/` entirely:** `useBackgroundMainCustomerSegments.hook.ts` imports `customerSegmentKeys`/`getCustomerSegmentOptions` from the `users`-domain migrated service (`src/services/index.ts` → `src/services/users/customer-segment.service.ts`), with the exact same cache key (`customerSegmentKeys.select('', PAGINATION_PARAMS.unLimit)`) independently also used by `src/modules/system/splash-screen/hooks/useSplashScreenCustomerSegments.ts` — the two modules share one cache entry for the same options list, consistent with "proven cross-domain reference/master data" rather than a problem.
- **Shared-layer imports** (components, utils) are detailed in `THEME-MANAGEMENT.md` §4/§10.
- Imported *into* this module from outside, besides the above: only the standard route/lazy wiring (`src/routes/pages.tsx:192-213`, `src/routes/form.routes.tsx:98-101`, `src/routes/main.routes.tsx:60`).

## 11. Consumers

- Route tree and lazy wiring (§2).
- `theme-management/components/BackgroundMainTableSection` (shared layer, embeds the list query).
- `background-main-lock/`'s cross-module detail-cache read (Part B §9).
- `topic/`'s `background-main` consumers are the reverse direction of §10's first bullet — i.e., `topic/` is never a consumer of anything in this module.

## 12. Pattern classification

**Mixed, target-compatible in state/form ownership, `LEGACY-COMPATIBILITY` in service location:** TanStack Query sole ownership with no Redux (target-compatible, §5); query-key factory with colocated `queryOptions` importing the service, not the reverse (target-compatible per `.claude/rules/03-api-service.md`); module-local `services/` (`LEGACY-COMPATIBILITY` per the Approved Theme Management structure, not a defect); AntD `Form` as sole owner with a feature-owned, synchronously-validated Zod schema (target-compatible); styling is SCSS Modules in every file except `BackgroundMainListPage/index.tsx`, which uses Emotion (`legacy-compatible`, a small pre-existing exception, not flagged as a gap given its size).

## 13. Technical risks (Part A — Background Main), ordered by decreasing consequence

1. **Card images selected in the form are never persisted** (§7) — the multi-image picker writes `cardImages`, but every submit path reads a non-existent `cardImage` field. `NEEDS-TEAM-DECISION` on the intended mapping between the multi-image picker and the backend's single persisted card-image field.
2. **Edit blocks saving when an assigned Topic has since become `INACTIVE` or `ENDED`.** The category option list keeps showing already-assigned categories regardless of current status (`BackgroundMainEditPage/index.tsx:108-112`), but submission rejects any selected category whose status is `INACTIVE`/`ENDED` — including ones already assigned before this edit — with no warning shown until save is attempted (`:200-212`). `NEEDS-TEAM-DECISION` on whether this block is intended.
3. **Cached upload-response objects are mutated by reference**, not copied, in both create and edit's upload-caching logic (`BackgroundMainEditPage/index.tsx:218,233-237,246`; `BackgroundMainCreatePage/index.tsx:124,129-134`) — currently latent because risk 1 means no code path actually sets the field whose mutation would expose this.
4. **Default backgrounds with a past-dated effective period cannot have their dates edited while still marked default** (§0 item 4) — the date pickers are disabled whenever `isDefault` is true, but the past-date guard runs whenever `hasEffectivePeriod` is true; the only path through this is toggling `isDefault` off first.
5. **Dead code confirmed in two places unrelated to each other:** `BackgroundMainAssetPicker/index.tsx:67-70`'s catch block always has `backgroundUrl === undefined`, so its conditional `URL.revokeObjectURL` call never runs; `BackgroundMainForm/index.tsx:312` has an identical-value ternary (`mode === 'create' ? t('...background') : t('...background')`).
6. **Inconsistent error-clearing between the two single-image upload fields:** the background-image field's `onValidationError` only *sets* an error, never clears one on success (`BackgroundMainForm/index.tsx:317-326`); the exclusive-touch field's equivalent handler does clear on success (`:366-373`). A stale background-image error only clears once the next full Zod validation runs.
7. **`CardImagesPicker.tsx:212` hardcodes its own `accept` MIME list** rather than deriving it from the shared `BACKGROUND_MAIN_*` allow-list constants the way the single-image picker does (`BackgroundMainAssetPicker/index.tsx:46-49`) — currently identical in value, a drift risk only.
8. **Zod schema messages evaluated at module-load time, not per render** (`schema.ts:44,45,52`), unlike most of the schema's other messages, which are evaluated inside their refinement callbacks — `NEEDS-VERIFICATION` whether a runtime-only locale switch leaves these three specific messages stale.
9. **No cache invalidation of Topic's own query keys from any Background Main mutation** — whether a saved background ever changes a Topic's displayed `themeCount`, and if so whether that can visibly lag behind Topic's 60-second `staleTime`, is `NEEDS-VERIFICATION`.
10. **Edit page sets state after unmount with no mount-guard**, unlike the create page, which has one (`BackgroundMainEditPage/index.tsx` has a `mounted` ref used at `:222,260`; `BackgroundMainCreatePage/index.tsx:149-162` has none) — a minor, low-consequence inconsistency between the two pages' async-safety patterns.
11. **`ThemePermissionGate.tsx` is referenced nowhere in this module** (and nowhere else — see `THEME-MANAGEMENT.md` §13, risk 2); not re-listed in detail here since it is a shared/root-level finding, not specific to Background Main.

---

## Part B — Background Main Lock

## 14. Responsibility

Restricts a Background Main item's visibility to one or more date-range "locks," reached only as a child workflow of Background Main's own list page (a "Lock" button) — there is no dedicated menu entry. Lists existing locks, lets the user add backgrounds from a picker (pool excludes already-locked backgrounds), set or edit each lock's start/end date within the background's own effective period, reorder locks by drag (reorder = new priority), and remove a lock. There is no enable/disable control in this UI; `enabled` is carried through unchanged on save.

## 15. Entry points and routes

| Route | File:line | Layout | Permission | Check kind |
| --- | --- | --- | --- | --- |
| `PageURLs.ofBackgroundMainLock()` | `form.routes.tsx:165-168` | BasicLayout | `[THEME_VIEW]` | single — confirmed still reusing Background Main's own view permission, not a dedicated lock permission |

Lazy export: `src/routes/pages.tsx:211-213`. **Not** present in `main.routes.tsx`. `PageURLs.ofBackgroundMainLock()` is defined at `src/utils/navigate.ts:300-302`; its only consumers are a "Lock" button on `BackgroundMainListPage/index.tsx:33-36` (no additional permission check beyond the list page's own `THEME_VIEW` gate) and the legacy redirect's `action === 'lock'` branch in `ThemeConfigurationRedirect.tsx:35`. **Confirmed: no menu entry.** `src/helpers/menus.helper.ts:428-431` has only Background Main's own list entry (`Menu.themeList`) — menu and route registries agree on `THEME_VIEW`, but neither registers a separate lock entry.

## 16. Directory map (14 files, 1,893 lines)

```text
src/modules/system/theme-management/background-main-lock/
|-- components/
|   |-- AddBackgroundMainPicker/
|   |   |-- index.tsx                       # modal picker over the available-themes pool, keyword+status filter, multi-select
|   |   `-- styles.module.scss
|   `-- BackgroundMainLockTable/
|       |-- index.tsx                       # DragSortTable: priority/background/status/start/end-date/remove columns
|       `-- styles.module.scss
|-- hooks/
|   `-- background-main-lock.queries.hook.ts  # one mutation: sequential create/update/delete + optional re-sort
|-- queryKeys/
|   `-- background-main-lock.query-keys.ts   # key factory, queryOptions for list/availableBackgroundMains/detail
|-- services/
|   `-- background-main-lock.service.ts      # 7 ApiFetcher calls (112 lines)
|-- types/
|   `-- background-main-lock.types.ts        # status const, response/request DTOs, editable-row model, row errors
|-- utils/
|   |-- background-main-lock-api.error.ts        # error-code switch -> i18n message key + forceReload flag
|   |-- background-main-lock-date.util.ts        # parse/format/outside-period/disabled-date helpers
|   |-- background-main-lock-save-plan.util.ts   # diffs rows to creates/updates/deletes/order
|   `-- background-main-lock-validation.util.ts  # plain-function row/period validators (no Zod, no AntD rules)
`-- views/
    `-- BackgroundMainLockPage/
        |-- index.tsx                        # page container: queries, draft state, save/cancel/back (593 lines)
        `-- styles.module.scss
```

## 17. Main runtime flow (CONFIRMED)

- **Load:** `useQuery(backgroundMainLockQueryKeys.list())` — no explicit `staleTime`, so the default of 0 applies; every mount refetches.
- **Draft:** `baselineRows = buildRows(savedLocks)`; entering edit mode freezes a copy into `editBaselineRows`, used for validation, the dirty check, and the save plan — a background refetch of the list query while editing does not overwrite the in-progress draft (view mode, by contrast, does resync from the baseline on every list change).
- **Add:** opens `AddBackgroundMainPicker`, which queries `availableBackgroundMains(enabled)` only while the picker is open; the backend-returned pool already excludes default, locked, and ended backgrounds (per the response type's own comment). A picked background's `effectivePeriod` comes from this pool's own response.
- **Edit dates:** inline validation on change is period-only; required/past-date/end-before-start checks run only on save.
- **Reorder:** drag replaces the local `rows` array; the new array order is the new priority.
- **Remove:** deletes the row from the local draft only, until save.
- **Save** (`handleSave`): `validateBackgroundMainLockRows(resolvedRows, editBaselineRows)` → build and submit a save plan (`buildBackgroundMainLockSavePlan`) → on success, read the fresh list back from cache and return to view mode; on failure, read `getBackgroundMainLockErrorOutcome(error)` and either force-reload from cache (showing a partial-saved or specific outcome message) or keep the draft with an inline error.
- **Mutation** (`hooks/background-main-lock.queries.hook.ts`): **not transactional** — creates, then each changed row's update, then each removed row's delete, then (if order changed) a re-read of the list followed by a sort call, all as separate sequential requests. A failure partway through leaves earlier writes applied; an `applied` flag tracks this for the save-outcome branch above. `onSettled` awaits invalidation of the list, `availableBackgroundMains()`, and `details()` keys.

**Confirmed, persisted-row period-resolution flow (the module's defining cross-module dependency, re-verified against `docs/audits/theme-management/2026-10-21/background-main-rename.md`):** a lock row loaded from `GET theme-locks` carries no effective-period data of its own (the lock-list response has none), so the page resolves each persisted row's period by calling `useQueries` over the distinct `themeId`s of the loaded locks, against **Background Main's own** `backgroundMainQueryKeys.detail(id)` (`BackgroundMainLockPage/index.tsx:104-119`, importing from `../../../background-main/queryKeys/background-main.query-keys`). This is confirmed read-only: the lock module never calls `setQueryData`/`invalidateQueries`/`removeQueries` against any `backgroundMainQueryKeys` entry — it only reads the cache Background Main itself owns. The merge is a derived `useMemo` overlay (`resolvedRows`), not state, so it does not interfere with the draft/baseline rows described above. A row whose detail query is still loading or has failed simply has no period, and the period check is skipped for it on the client — the backend remains the only check in that case.

## 18. State ownership — Query-owned module checklist (content rule 15)

- **No Redux slice touches this resource** — confirmed by the same repository-wide grep as Background Main's own §5.
- **Query key factory** (`queryKeys/background-main-lock.query-keys.ts`): `all`/`lists()`/`details()` prefix helpers, plus `list()`, `availableBackgroundMains(enabled=false)`, `detail(id, enabled: isSafeInteger && >0)` — all colocating `queryOptions`, importing only the feature service, not React/UI.
- **Every query:**

  | Query | `staleTime` | `placeholderData` | `enabled` | Consumer |
  | --- | --- | --- | --- | --- |
  | `list()` | none (default 0) | none | n/a | the page only |
  | `availableBackgroundMains(pickerOpen)` | none | none | tied to the picker's open state | the page only |
  | `detail(id)` | none | n/a | positive safe integer | **confirmed dead within this module** — `detail(id)` and the service's `getBackgroundMainLockById` have zero consumers anywhere in `src/` |

  Note: this module's own `detail(id)` factory entry is unused; the cross-module period resolution in §17 reads **Background Main's** `detail(id)`, a different factory entirely.
- **One mutation** (`useSaveBackgroundMainLockChangesMutation`, `hooks:22-71`): `retry: false`; wraps any thrown error in `BackgroundMainLockSaveError(error, applied)`; `onSettled` awaits `Promise.all` invalidating `lists()`, `availableBackgroundMains().queryKey`, and `details()` — the last of which, per the paragraph above, invalidates a cache entry nothing reads. No `setQueryData` anywhere in this module.
- **Draft and baseline:** `rows`, `editBaselineRows`, `errors`, `submitError`, `pickerOpen` — all local React state with explicit init (`handleEnterEdit`) and reset (`handleCancel`/`handleBack`/save success/failure), not a refetch-driven reset.

## 19. API boundaries

`services/background-main-lock.service.ts`, base path `api/admin/portal/v1/theme-locks` (module-local, `LEGACY-COMPATIBILITY`):

| Method | Path |
| --- | --- |
| GET | `theme-locks` |
| GET | `theme-locks/available-themes` |
| GET | `theme-locks/{id}` (confirmed dead, §18) |
| POST | `theme-locks` |
| PUT | `theme-locks/{id}` |
| PUT | `theme-locks` (reorder/sort) |
| DELETE | `theme-locks/{id}` |

A runtime guard (`unwrapList`) tolerates either a bare array or a `{items}` envelope in the list response, since the backend contract for this specific endpoint's shape is not otherwise documented (`NEEDS-VERIFICATION`). Save order on the mutation is create → update → delete → (re-read → sort), each a separate request; not atomic (§17).

**Error-handling switch, re-verified against the 2026-10-21 rename audit's recorded changes — CONFIRMED still matching the audit's described end state.** `utils/background-main-lock-api.error.ts`'s switch now has exactly four cases: `LOCK_NOT_FOUND`, `LOCK_ALREADY_EXISTS`, `BACKGROUND_MAIN_NOT_FOUND`, `BACKGROUND_MAIN_NOT_AVAILABLE`. `THEME_LOCK_PERIOD_NOT_COVERED` is **not** one of them — its dedicated special-case mapping was deliberately removed per the audit's "Change 1" (2026-10-23) and is confirmed still absent. It now falls through to the function's generic fallback: a `409` status resolves to a conflict message with `forceReload: true` (draft discarded, rows reset from cache); any other status resolves to a generic save-error message with `forceReload: false` (draft kept). **This is the module's single highest-consequence accepted regression** (§0 item 2, §13 risk 2): a user who hits this exact backend code on a lock save now sees a generic message instead of the specific "lock period must be within the background's effective period" message the original 2026-10-21 implementation provided. Whether the backend still returns this code on a lock save at all, and with what status, is `NEEDS-VERIFICATION`.

## 20. Forms and validation

**No AntD `Form` and no Zod anywhere in this module** — confirmed by grep; the editing surface is a `Table` with inline `DatePicker`s, not a form, and its validators remain plain TypeScript functions over the local draft array (`utils/background-main-lock-validation.util.ts`), exactly as the original rename audit described. Three validator functions: `validateBackgroundMainLockRow(row, baseline?)`, `validateBackgroundMainLockRowPeriod(row)`, `validateBackgroundMainLockRows(rows, baselineRows)`.

**Confirmed, intentional asymmetry with Background Main's own past-date guard:** this module's past-date check exempts a bound that is unchanged from its baseline value (`startUnchanged`/`endUnchanged` comparisons, `validation.util.ts:30-35,41,51`) — a lock row whose start/end date was never touched this edit session is not newly rejected just because today's date has since passed it. Background Main's own edit-page guard (Part A §7) has no equivalent exemption. This difference is confirmed deliberate per the 2026-10-21 rename audit, not a bug in either module.

## 21. Types and DTO organization

Feature-local only, `types/background-main-lock.types.ts`. `BACKGROUND_MAIN_LOCK_DISPLAY_STATUS` is a derived-literal-union constant (`INACTIVE | UPCOMING | ONGOING | ENDED`), compliant with the no-`enum` repository rule. `BackgroundMainLockEditableRow` carries `displayStatus?` (optional, since a newly-added unsaved row has no backend lock status yet) and `effectivePeriod?` (optional, populated only after the cross-module detail resolution in §17 succeeds) — both field names confirmed still present exactly as the rename audit's follow-up entries describe them.

## 22. Permissions

No `THEME_LOCK_*` permission constant exists anywhere — this module reuses Background Main's own `THEME_VIEW` for its route, and `THEME_EDIT`/`THEME_CREATE` for its in-page Edit/Add-background buttons (`BackgroundMainLockPage/index.tsx:62-63`, both single-permission checks, confirmed per call site). The remove-row icon and the date pickers are gated by UI mode (`view` vs. `edit`), not by a separate permission check at the cell level.

## 23. Shared and cross-domain dependencies

- **The module's one real cross-module edge:** the read-only `background-main` detail-cache resolution described in full in §17 — the only import from outside this module's own directory tree besides the shared `theme-management/utils/gmt7-date.util.ts` and `effective-period-date.util.ts` (both genuinely shared with Background Main and Topic, per `THEME-MANAGEMENT.md` §4.3).
- **Confirmed: `theme-lock-period-error.util.ts` is no longer imported by this module at all** — the constant and check it once provided now live only inside `background-main/utils/background-main-lock-period-error.util.ts`, consumed only by Background Main's own edit page (Part A §19's regression discussion). This module has zero references to `THEME_LOCK_PERIOD_NOT_COVERED` or `isThemeLockPeriodNotCoveredError` anywhere in its own files.
- **Nothing outside this module imports anything from inside it**, beyond the standard route/lazy wiring and the Background-Main-list "Lock" button/legacy-redirect path references noted in §15.

## 24. Consumers

Route/lazy wiring (§15); Background Main's own list page (the "Lock" button); the legacy redirect's `lock` action. No outside module imports any type, hook, query key, or util from inside this module.

## 25. Pattern classification

Server state: TanStack Query, feature-owned, `queryOptions` factory, zero Redux — **target-compatible**. Service location, module-local `services/` — **LEGACY-COMPATIBILITY**. Editing surface: a local explicit draft with defined init/reset lifecycle over a `Table`, not a form — **target-compatible** per `.claude/rules/04-state-management.md`'s "a local editable draft is allowed only when initialization, reset, commit, and invalidation behavior are explicit," which this module satisfies. Validation: plain functions, not Zod — acceptable for a non-form table-editing surface, not a `.claude/rules/05-form.md` gap since there is no form here to begin with. Styling: SCSS Modules throughout, component-owned — **target-compatible**.

## 26. Technical risks (Part B — Background Main Lock), ordered by decreasing consequence

1. **The accepted `THEME_LOCK_PERIOD_NOT_COVERED` regression** (§19) remains live in current source: a lock save that hits this exact backend code now produces a generic message, not the specific period-mismatch message the original implementation provided. `NEEDS-VERIFICATION` whether the backend still returns this code on a lock save, and with what HTTP status.
2. **The `INACTIVE` lock-status label is still unmapped and deferred**, confirmed still the open state from the 2026-10-23c rename-audit follow-up: `BackgroundMainLockTable`'s status-label map has no entry for `INACTIVE`, so a row with that `displayStatus` renders the raw backend string. `NEEDS-TEAM-DECISION` (not resolved here) on whether `INACTIVE` needs a dedicated lock-specific label and color, distinct from the `ENDED` label it would otherwise visually resemble if left unstyled.
3. **Non-atomic, multi-request save** (§17/§19): create, update, delete, and sort are four separate sequential requests with no transaction; a failure partway through leaves earlier writes applied, tracked only by an `applied` flag that triggers a forced reload-and-partial-saved message. Backend-side atomicity is `NEEDS-VERIFICATION`.
4. **Confirmed dead query and endpoint:** `backgroundMainLockQueryKeys.detail(id)` and `getBackgroundMainLockById` have zero consumers anywhere in `src/`, yet `details()` is still invalidated on every save — harmless, but misleading to a future reader who might assume it is load-bearing.
5. **A declared error-code constant has no matching switch case:** `BACKGROUND_MAIN_LOCK_ERROR_CODE.INVALID_INPUT` is declared in `utils/background-main-lock-api.error.ts` but never appears in the switch itself, so it silently falls through to the generic fallback — behavior is correct, but the declared-and-unused constant is misleading.
6. **A dead export and two dead i18n keys**, confirmed by repository-wide grep: `formatLockDate` (`utils/background-main-lock-date.util.ts`) has zero consumers; `ThemeManagement.backgroundMainLock.message.periodNotCovered` and `...column.lockTime` are defined in both `vi.json`/`en.json` but have zero code references — the first is a deliberately-kept, now-unreachable message per risk 1's regression history, confirmed intentional, not an oversight.
7. **An inline `useQueries` `combine` function is re-created on every render** (`BackgroundMainLockPage/index.tsx:108-119`), so `persistedPeriods` changes identity every render and the `resolvedRows` overlay recomputes every render — a confirmed performance-only observation, not a correctness defect; not measured against any runtime target.

## 27. Areas to avoid touching

- `background-main/queryKeys/background-main.query-keys.ts` — read cross-module by `background-main-lock/`'s period-resolution flow (§17); a shape change to `detail(id)`'s response affects both modules simultaneously.
- `background-main/utils/background-main-lock-period-error.util.ts` — the sole remaining home of the `THEME_LOCK_PERIOD_NOT_COVERED` check (risk 1); its single consumer is Background Main's own edit page, not this lock module.
- `utils/background-main-lock-api.error.ts`'s switch statement (§19) — any addition or removal of a case changes the save-outcome branching described in §17 and risk 1/risk 5 above.
- `components/BackgroundMainForm/index.tsx`'s `cardImages`/`cardImage` field wiring (Part A §7, risk 1) — a fix here, if ever authorized, is a form-contract change affecting both the create and edit submit paths simultaneously, plus the preview component that already reads `cardImages`.
- The permission constants `THEME_VIEW`/`THEME_CREATE`/`THEME_EDIT`/`THEME_CATEGORY_VIEW` and every route declaration cited in §2/§15 — any change is a permission-semantics change and `HIGH-RISK` per `.claude/rules/06-routing-permission.md`.

## 28. Open questions

- `NEEDS-TEAM-DECISION`: the intended mapping between the multi-image card picker and the backend's single persisted card-image field (Part A, risk 1) — the highest-consequence open item in this document.
- `NEEDS-VERIFICATION`: whether the backend still returns `THEME_LOCK_PERIOD_NOT_COVERED` on a lock save, and with what HTTP status (Part B, risk 1).
- `NEEDS-TEAM-DECISION`: whether `INACTIVE` lock rows need a dedicated label/color (Part B, risk 2) — open since 2026-10-23c, not resolved here.
- `NEEDS-TEAM-DECISION`: whether editing a Background Main item whose assigned Topic has become `INACTIVE`/`ENDED` should be blocked the way it currently is, with no warning before save (Part A, risk 2).
- `NEEDS-VERIFICATION`: backend atomicity of the lock module's multi-request save sequence (Part B, risk 3).
- `NEEDS-VERIFICATION`: whether a runtime-only locale switch leaves the three module-load-evaluated Zod messages in Background Main's schema stale (Part A, risk 8).
- `NEEDS-VERIFICATION`: whether a Background Main save ever visibly changes a Topic's displayed `themeCount` (Part A, risk 9).
