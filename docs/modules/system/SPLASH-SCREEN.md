# Splash Screen — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `portal-cham-vay`; `git status --short src/modules/system/splash-screen` is empty, last commit touching the module is `b550b8c`.
- Date: 2026-11-04.
- Method: static source inspection only (`find`, `grep`, `Read`), via one read-only `codebase-analyzer` delegation that read all 25 files plus the surrounding route/permission/menu/service wiring. No runtime, browser, auth, or backend verification was performed. One non-canonical `npx tsc --noEmit -p tsconfig.json` run filtered for `splash` produced no output — the repository's actual `typecheck` script (`tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json`) was not run, so this is not treated as a clean-typecheck confirmation.
- Scope: `src/modules/system/splash-screen/` (25 files, `find src/modules/system/splash-screen -type f | wc -l`). This is the module's **second fully Query-owned submodule** after `bank-list/` ([`BANK-LIST.md`](BANK-LIST.md)) — the Query-owned checklist in content rule 15 is answered in full in §5/§6 below.
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Backend semantics of the `enabled` query parameter on the list endpoint — the sort page (§4 Flow E) passes `enabled: true` into its list query params, and if the backend treats this as a status filter rather than a no-op, the sort page would silently exclude inactive splash screens from reordering.
  2. Whether the sort page's reorder payload, limited to the first 10 items (`PAGINATION_PARAMS.limit`), is safe against more than 10 existing splash screens — whether the backend re-ranks the remainder or whether priority values collide is unverified (§4 Flow E, §13).
  3. Whether the backend cleans up an uploaded `imageKey` when the subsequent create/update call fails or is cancelled — the frontend has no delete-upload path for this case.
  4. Runtime behavior of `FormLayout`/`useFormImperativeHandle` when `form.validateFields()` rejects — not read in detail by the delegated investigation.
  5. Browser-verified behavior of the splash preview's post-countdown "Marketing" overlay and the Lottie player — both are static-source findings only (§4 Flow D).

## 1. Responsibility

Admin configuration of mobile-app splash screens: create, edit, view-with-history, list-with-search, and a drag-sort of display priority. A splash screen has an asset type (`STATIC` image, `GIF`, or `LOTTIE`, `constants.ts:12-16`), a display audience (`ALL`/`DEVICE_LINKED`/`DEVICE_UNLINKED`, `:6-10`), an active window (`startAt`/`endAt`), an `enabled` boolean (the module's only status mechanism — there is no separate activate/deactivate flow and no delete flow), an optional display duration, and an API-level `customerSegments` association whose edit-time UI field exists in code but is currently commented out (§4 Flow F, §6, §13 — a confirmed but currently-inert feature, not something this document treats as either fully shipped or fully absent).

## 2. Entry points and routes

- **Lazy exports** (`src/routes/pages.tsx:185-189`): `SplashScreenList`, `SplashScreenCreateForm` (→ `create/index.tsx`), `SplashScreenSort`, `SplashScreenViewForm` (→ `view/index.tsx`), `SplashScreenEditForm` (→ `edit/index.tsx`) — five separate lazy pages for five separate routes; list, create, sort, view, and edit are not variants of one shared route.

| Route | File:line | Layout | Permission (single) |
| --- | --- | --- | --- |
| `system-management/splash-screen-config/list` | `main.routes.tsx:436-437` | MainLayout | `[PERMISSIONS.SPLASH_SCREEN_VIEW]` |
| `system-management/splash-screen-config/create` | `form.routes.tsx:930-932` | BasicLayout | `[PERMISSIONS.SPLASH_SCREEN_CREATE]` |
| `system-management/splash-screen-config/list/sort` | `form.routes.tsx:936-937` | BasicLayout | `[PERMISSIONS.SPLASH_SCREEN_EDIT]` |
| `system-management/splash-screen-config/view/:id` | `form.routes.tsx:950-952` | BasicLayout | `[PERMISSIONS.SPLASH_SCREEN_VIEW]` |
| `system-management/splash-screen-config/edit/:id` | `form.routes.tsx:966-968` | BasicLayout | `[PERMISSIONS.SPLASH_SCREEN_EDIT]` |

Every route-level permission array has exactly one element, so OR/AND semantics are never exercised here (all are resolved via `WithGuard` → `GuardedPage`'s `.some()`, trivially equivalent to a plain check for a single-element array).

- **Route counts** (template-mandated command, not module-specific): `grep -oE "<Route($|[ >/])" src/routes/main.routes.tsx | wc -l` = 69; same on `form.routes.tsx` = 113. This module contributes 1 of the 69 and 4 of the 113.
- **Menu:** `src/helpers/menus.helper.ts:436-440` — single entry, label `t('splashScreenConfiguration')`, key/link `PageURLs.ofSplashScreenConfigList()`, `requiredPermissions: [PERMISSIONS.SPLASH_SCREEN_VIEW]` (single). Only the list route is menu-linked; create/sort/view/edit are reached only from within the list page.
- **`PageURLs` builders** (`src/utils/navigate.ts:361-376`): `ofSplashScreenConfigList`, `ofSplashScreenConfigCreate`, `ofSplashScreenConfigSort` (`/list/sort`), `ofSplashScreenConfigView(id, tab='')`, `ofSplashScreenConfigEdit(id)`.
- **Permission constants** (`src/constants/permission.constant.ts:317-320`): `SPLASH_SCREEN_VIEW: 'splash:view'`, `SPLASH_SCREEN_CREATE: 'splash:create'`, `SPLASH_SCREEN_EDIT: 'splash:edit'`. There is no delete permission — consistent with there being no delete flow.
- **In-page checks** (`useHasPermission`): `SplashScreenList.tsx:221` gates a "preview" action on `[SPLASH_SCREEN_VIEW]` — redundant, since the list route itself already requires that same permission to be reached at all; `:255` gates the Sort button on `[SPLASH_SCREEN_EDIT]`; `:262` gates the Create button on `[SPLASH_SCREEN_CREATE]`; `view/index.tsx:21,65` hides the Edit button unless `[SPLASH_SCREEN_EDIT]` (also hidden while detail is still loading). The sort and edit pages themselves have no additional in-page check beyond their route guard.

## 3. Directory map

`find src/modules/system/splash-screen -type f | sort` → 25 files, 3231 lines (`wc -l`).

```text
src/modules/system/splash-screen/
|-- SplashScreenList.tsx                     # list page: search, filter, sort, paginated table, preview modal, Create/Sort buttons
|-- SplashScreenSort.tsx                     # drag-sort page for display priority, first page only (§13)
|-- asset-utils.ts                           # asset-type-from-extension, filename-from-URL, Lottie JSON structural validity check
|-- constants.ts                             # statuses, audiences, asset types/extensions, max upload size, view-tab keys
|-- mappers.ts                               # form <-> request/detail mapping
|-- types.ts                                 # API DTOs and form value types (mixed in one file)
|-- validators.ts                            # plain-function validators (no Zod): period check, positive-integer check
|-- components/
|   |-- SplashScreenAssetUpload.tsx          # AntD Upload wrapper: type/size/Lottie validation, local object-URL preview
|   |-- SplashScreenCustomerSegmentField.tsx # segment multi-select field — present in code, not currently rendered (§6, §13)
|   |-- SplashScreenGeneralForm.tsx          # shared create/edit general-info form
|   |-- SplashScreenSearcherForm.tsx         # list search form (keyword, enabled)
|   `-- preview/
|       |-- SplashScreenFormPreview.tsx      # phone-frame preview dispatcher by asset type, plus post-countdown Marketing overlay
|       |-- SplashScreenGifPreview.tsx       # GIF-specific render
|       `-- SplashScreenMarketingPreview.tsx # banner-carousel overlay simulation (cross-domain, §10)
|-- create/
|   |-- index.tsx                            # create container: upload-then-create, double-submit guard
|   `-- general.tsx                          # create form wrapper (Form.useForm)
|-- edit/
|   |-- index.tsx                            # edit container: detail query, upload-if-changed, update
|   `-- general.tsx                          # edit form wrapper (Form.useForm), detail->form mapping
|-- view/
|   |-- index.tsx                            # view container: General + History tabs, Edit button
|   |-- general.tsx                          # read-only detail form
|   `-- history.tsx                          # paginated audit-history table
|-- hooks/
|   |-- splashScreenQueries.ts               # every TanStack Query hook for this resource (list/detail/history queries, upload/create/update/order mutations)
|   `-- useSplashScreenCustomerSegments.ts   # cross-domain customer-segment options query (dead at runtime, §6)
|-- queryKeys/
|   `-- splash-screen.query-keys.ts          # keys-only factory, no queryOptions
`-- services/
    `-- splash-screen.service.ts             # 7 window.apiFetcher calls
```

No Redux slice, middleware, or store entry for this resource exists anywhere (`grep -rni "splash" src/redux/` returns no match — confirmed zero-Redux, see §5).

## 4. Main runtime flows

### Flow A — list, search, sort, paginate (CONFIRMED, `SplashScreenList.tsx`)
Filter/sort/page live in URL state via `useQueryState` (`:61`), not Redux — consistent with `.claude/rules/04-state-management.md`'s "shareable filter/sort/page → URL state" row. `useSplashScreenListQuery(listParams, isListPath)` (`:75`) drives the table. Table column sorting writes `sort=<field>,<asc|desc>` (`:113-126`). Clicking preview opens `SplashScreenFormPreview` inside an iPhone-frame modal (`:98-111`).

### Flow B — create (CONFIRMED, `create/index.tsx`, `create/general.tsx`)
`handleCreate` (`:34-68`): if the staged `File` object has not already been uploaded (tracked via a `cachedUpload` ref keyed by File identity, `:31`), upload it first (`uploadMutation.mutateAsync`, `:46-50`), then create (`createMutation.mutateAsync(mapSplashScreenFormToCreateRequest(...))`, `:52-54`). An `inFlight` ref (`:30,36,64`) blocks double submission. Any failure — upload or create — collapses into one generic `CREATE_FAIL` toast (`:59-62`), not distinguishing which step failed (§13). On success, navigates to the list.

### Flow C — edit (CONFIRMED, `edit/index.tsx`, `edit/general.tsx`)
Detail query drives the form (`:34`); the same cached-upload/double-submit pattern as create is duplicated here (`:21-24,38,62-68`), not shared via a common helper (§13). `handleUpdate` (`:52-89`) uploads a new image only if `values.imageFile` is set, otherwise reuses the existing `detail.imageKey` (`:59`). On success, navigates to the view page.

### Flow D — view, with preview and history (CONFIRMED, `view/index.tsx`, `view/general.tsx`, `view/history.tsx`)
Two sidebar tabs, General and History (`:36-51`), tab keys from `constants.ts:28-31`. The preview dispatcher (`components/preview/SplashScreenFormPreview.tsx`) branches by asset type: a Lottie player (`@lottiefiles/dotlottie-react`) for `LOTTIE`, a dedicated GIF component for `GIF`, a plain `<img>` otherwise. **Correction to a premise in this task's brief:** the three preview components are not three parallel "splash-screen types" — `SplashScreenFormPreview` is the single asset-type dispatcher, and `SplashScreenMarketingPreview` is a separate, time-based overlay mode (not an asset type): when `displayDurationSeconds` elapses in the preview's countdown (`:86-110`), the dispatcher swaps to a banner-carousel simulation reusing the `contents`-domain Marketing screen components (§10) — a "what shows after the splash screen" simulation, not an alternative splash-screen format.

### Flow E — sort (CONFIRMED, `SplashScreenSort.tsx`)
Fetches with `{ page: 0, size: PAGINATION_PARAMS.limit /* = 10 */, orderBy: 'priority,asc', enabled: true }` (`:30-35`), holds an editable local copy (`items`, `:37`), renumbers `priority` to `index + 1` on drag (`:102-104`), and submits only `{ items: [{ id }] }` in server-sort order (`:109-111`) — the id's position in the array is the new priority, not an explicit priority value in the payload. **Two confirmed, backend-dependent risks, not fixed here:**
- `enabled: true` is passed as a list-query filter parameter here (not the TanStack Query hook's own `enabled` option, which is unrelated and defaults to `true` regardless) and is forwarded into the request's query string (`services/splash-screen.service.ts:22-23`). If the backend treats `enabled` as an active/inactive status filter, the sort page would silently exclude inactive splash screens from the reorder set (§0 item 1).
- The fetch is capped at the first `PAGINATION_PARAMS.limit` (10) items with no pagination control, so a splash-screen list larger than 10 cannot be fully reordered through this page, and whether the remaining items' priorities collide or shift unpredictably on the backend is unverified (§0 item 2).

### Flow F — customer-segment field (CONFIRMED present, CONFIRMED dead at runtime)
`components/SplashScreenCustomerSegmentField.tsx` and its backing hook `hooks/useSplashScreenCustomerSegments.ts` (a cross-domain query against `customerSegmentKeys`/`getCustomerSegmentOptions` from the `users` domain's segmentation service, §6) exist in source and are structurally complete, but the field's import and its one JSX usage inside `SplashScreenGeneralForm.tsx` are both commented out (`:17` import, `:153-161` JSX block comment) — confirmed by a repository-wide grep finding no other reference to either file. The query never executes today, and the segment picker is never rendered in create or edit. Existing segment assignments are still preserved across an edit save through a `hidden` form field populated from the fetched detail (`SplashScreenGeneralForm.tsx:86`, `mappers.ts:55`); a new splash screen is created with `customerSegmentIds: []` (`create/general.tsx:38`). This is recorded as a confirmed, currently-inert feature, not as either "shipped" or "removed" — `NEEDS-TEAM-DECISION` whether it should be re-enabled, finished, or deleted (§15).

## 5. State ownership — Query-owned module checklist (content rule 15)

- **Does any Redux slice also touch this resource?** `grep -rni "splash" src/redux/` returns **no match** — confirmed zero Redux ownership of the splash-screen resource itself. Redux is still used in this module, but only for two things unrelated to splash-screen's own server data: `setNotification` (the global toast slice, used by every create/edit/sort/view/history flow) and, in `SplashScreenMarketingPreview.tsx:9,49`, `getScreenList` — a **different domain's** Redux thunk (`src/redux/slices/banner.slice.ts:259`, owned by `contents`), consumed only by the Marketing-overlay preview simulation, not by anything this module writes to. Confirmed: one authoritative owner (TanStack Query) for the splash-screen resource itself, with a legitimate, read-only cross-domain Redux dependency for an unrelated preview feature.
- **Local React state and what it owns:** per-component draft/UI state only, no competing server-data owner — `create/index.tsx`/`edit/index.tsx`'s `inFlight` and `cachedUpload` refs (double-submit guard and upload-reuse-by-File-identity, duplicated between the two files, §13); `create/general.tsx`/`edit/general.tsx`'s staged `imageFile` File object and preview URL; `SplashScreenAssetUpload.tsx`'s object-URL lifecycle ref; `SplashScreenFormPreview.tsx`'s countdown and Lottie-player-instance state; `SplashScreenMarketingPreview.tsx`'s simulation-date/screen-id state (kept local specifically to hold the cross-domain query key stable); `SplashScreenSort.tsx`'s editable `items` copy of the fetched list (an explicit, reset-on-refetch local draft, not an uncoordinated second cache); `view/history.tsx`'s page/pageSize state. List-level filter/sort/page is URL state (§4 Flow A), not local React state.

## 6. API boundaries — Query-owned module checklist (content rule 15)

- **Query key factory** (`queryKeys/splash-screen.query-keys.ts`, 42 lines): **keys-only**, no `queryOptions` colocated (`grep -rn "queryOptions" src/modules/system/splash-screen/` finds no match anywhere in the module). Imports only types from `../types` — it does **not** import anything from `services/`, satisfying the architecture rule. Shape: `all`, `lists`, `list(params)`, `details`, `detail(id)`, `histories`, `historyById(id)`, `history(id, params)`, each normalizing its own parameters via private helpers in the same file. Its only consumer is `hooks/splashScreenQueries.ts`.
- **Which query definitions use `queryOptions`, and consumer counts:** none of the seven hooks in `hooks/splashScreenQueries.ts` uses `queryOptions` — all are plain, hook-assembled `useQuery`/`useMutation` calls. Consumer counts (by distinct import site): `useSplashScreenListQuery` — 2 (`SplashScreenList.tsx`, `SplashScreenSort.tsx`); `useSplashScreenDetailQuery` — 2 (`view/index.tsx`, `edit/index.tsx`); `useSplashScreenHistoryQuery` — 1 (`view/history.tsx`); `useUploadSplashScreenImageMutation` — 2 (`create/index.tsx`, `edit/index.tsx`); `useCreateSplashScreenMutation` — 1 (`create/index.tsx`); `useUpdateSplashScreenOrderMutation` — 1 (`SplashScreenSort.tsx`); `useUpdateSplashScreenMutation` — 1 (`edit/index.tsx`).
- **`staleTime`:** **no `staleTime` is set anywhere in this module** (`grep -rn "staleTime" src/modules/system/splash-screen/` — no match), and the global `QueryClient` default config (`src/providers/query.provider.tsx:7-15`) sets only `retry: false` and `refetchOnWindowFocus: false`, not a `staleTime`. The effective `staleTime` is the TanStack default of `0`. This is a gap against `.claude/rules/03-api-service.md`'s `SHOULD` for paginated list queries, recorded as a finding (§13), not silently assumed compliant.
- **`placeholderData: keepPreviousData`:** used on the list query (`splashScreenQueries.ts:25`) and the history query (`:46`) — both paginated — but **not** on the detail query (not paginated, so this is expected, not a gap).
- **Mutations — invalidation and `setQueryData`:** `setQueryData` is used **nowhere** in this module (every mutation relies on invalidation, not direct cache writes).
  - **Create** (`:59-67`): `await queryClient.invalidateQueries({ queryKey: lists() })` — awaited; does **not** invalidate `detail`/`histories` (expected, since nothing has a detail yet for a brand-new record).
  - **Order** (`:73-81`): `await invalidateQueries({ queryKey: lists() })` — awaited; does **not** invalidate the reordered items' `detail(id)` entries, so a user navigating from the sort page straight to one of those items' detail/view could see a stale `priority` value until the default refetch-on-mount behavior catches up (unverified at runtime, §15).
  - **Update** (`:87-105`): `Promise.all([invalidateQueries({queryKey: detail(id)}), invalidateQueries({queryKey: lists()})])` — both awaited; does **not** invalidate `histories(id)`, so a freshly-saved edit may not immediately show in the History tab without a manual refetch.
  - **Upload** (`:51-53`): no invalidation — expected, since an upload alone doesn't change any list/detail data until the subsequent create/update call completes.
- **Endpoints** (`services/splash-screen.service.ts`, base path `api/admin/portal/v1/splash-screens`, file-upload path `api/admin/file`):

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `splash-screens?<query>` | includes every filter key except `undefined`, including a literal `enabled` and a possibly-empty `orderBy=` (§4 Flow E) |
| POST | `api/admin/file` | multipart: `file` + a JSON `metadata` blob `{context:'SPLASH'}` |
| POST | `splash-screens` | create |
| GET | `splash-screens/{id}` | detail |
| GET | `splash-screens/{id}/history?page&size&sort` | defaults page 0, size 10 |
| PUT | `splash-screens/{id}` | update |
| PUT | `splash-screens` | reorder, body `{items:[{id}]}` in new-order sequence |

Responses are `as`-cast with no runtime guard — acceptable for stable CRUD per `.claude/rules/03-api-service.md`, not flagged as a gap; the backend's actual contract (pagination base, `enabled` filter semantics, reorder endpoint's exact ranking algorithm) is `NEEDS-VERIFICATION` (§0, §15).

- **Cross-domain `customer-segment` consumption (CONFIRMED present in code, dead at runtime — reconciling against `docs/modules/users/SEGMENTATION.md`):** `hooks/useSplashScreenCustomerSegments.ts:2-3` imports `customerSegmentKeys` from `@/queryKeys/users/customer-segment.query-keys` and `getCustomerSegmentOptions` from the `@/services` barrel (`src/services/index.ts:2` re-exporting `src/services/users/customer-segment.service.ts:60`) — this **confirms, from the splash-screen side**, the exact same cross-domain service dependency that `docs/modules/users/SEGMENTATION.md` §6.3/§11 already documents from the `users` side as a consumer relationship into `products/`; this module is a **second, independent consumer** of that same migrated service, not previously recorded in `SEGMENTATION.md` (which only tracked `products/` as a consumer) — **this document is the first place that cross-reference is made explicit; `SEGMENTATION.md` itself is not edited here**, consistent with this task's read-only-except-named-files instruction. The query uses `customerSegmentKeys.select('', PAGINATION_PARAMS.unLimit)` with no `enabled`/`staleTime` override, and the exact same cache key is also used by an unrelated module, `theme-management/background-main/hooks/useBackgroundMainCustomerSegments.hook.ts:4,17` — the two modules share one cache entry for the same underlying options list, which is consistent with "proven cross-domain reference/master data" rather than a problem. As established in §4 Flow F, none of this executes today because the consuming field/hook pair is commented out at its one call site.

## 7. Forms and validation

Four `Form.useForm` sites: `create/general.tsx:18`, `edit/general.tsx:26`, `view/general.tsx:33` (read-only), `components/SplashScreenSearcherForm.tsx:24`. No Zod anywhere in this module (`validators.ts` is plain functions, not a Zod schema — confirmed by its content, 15 lines: a date-period check requiring `endAt.isAfter(startAt)`, and a positive-integer check) — acceptable for this scope's existing, simple AntD-rule-based validation under `.claude/rules/05-form.md`, not a gap. AntD `rules` in `SplashScreenGeneralForm.tsx` cover: a required name field, a required `displayAudience`, an inline positive-integer validator on the duration field (using `validators.ts`), dependency-linked `startAt`/`endAt` validators calling the period-check helper, and a required image-preview field. Create additionally throws a plain `'Splash screen image is required'` error if the image field is somehow empty at submit time, but that specific message is swallowed into the same generic `CREATE_FAIL` toast as every other create failure (`create/index.tsx:40-41,59-62`) — a user cannot distinguish "you forgot the image" from any other failure from the toast alone (§13).

## 8. Types and DTO organization

`types.ts` is a single file mixing API DTOs (`SplashScreenListApiItem`, `SplashScreenListApiResponse`, `SplashScreenApiDetail`, `SplashScreenWriteApiRequest` with `Create`/`Update` aliases, `SplashScreenUploadResponse`, history and order request/response types) with form view-models (`SplashScreenCreateFormValues`, `SplashScreenEditFormValues`) in one place, rather than splitting DTO and form-model files — not a template violation (no rule requires the split), but worth noting as a departure from `bank-list/`'s separate `types.ts` for feature-local entity/filter/query/DTO/error types all still being one file too, so this is consistent with that sibling, not a new pattern. `mappers.ts` provides the two directional transformations: form values → `SplashScreenWriteApiRequest` (trims the name, formats dates, normalizes segment ids, and only sends `isLoop` for non-`STATIC` assets) and API detail → edit-form values (derives `assetType` from the asset URL/key, converts dates to `Dayjs`, maps segment objects to bare ids). Two types (`SplashScreenListItem`, `SplashScreenStatus`) have exactly one reference each in the module and are candidate dead types (cross-`src/` usage not checked, so not escalated to a confirmed-dead finding here). `SplashScreenHistoryItem.changes: unknown[]` and `actionType: string` are deliberately untyped at the detail level.

## 9. Permissions

This module references only **3** `PERMISSIONS.*` constants (`src/constants/permission.constant.ts:317-320`), well under the template's >10-constant table threshold (content rule 9) — a narrative accounting is used:

- `SPLASH_SCREEN_VIEW` — list route, view route, menu entry, and the list page's redundant preview-button check (§2).
- `SPLASH_SCREEN_CREATE` — create route and the list page's Create-button check.
- `SPLASH_SCREEN_EDIT` — sort route, edit route, the list page's Sort-button check, and the view page's Edit-button check.

No permission constant exists for delete (there is no delete flow) and none is checked specifically for the detail query, history query, or the (currently inert) customer-segment query — each relies solely on its page's route guard. Every check above is confirmed single-permission, never an OR array, per call site, per content rule 14.

## 10. Shared and cross-domain dependencies

Imported **by** this module, from outside it:
- **Cross-domain, `users` domain:** the customer-segment query key and migrated service described in §6 — a confirmed, legitimate second consumer of `src/services/users/customer-segment.service.ts`, currently dormant.
- **Cross-domain, `contents` domain:** `SplashScreenMarketingPreview.tsx` imports `BANNER_SCREEN_CODES`, `MarketingBannerCarousel`, `SimulationEmpty`, `bannerSimulationQueryKeys` (which does use `queryOptions`, unlike this module's own key factory), the `getScreenList` Redux thunk, and the `BannerScreen` type, all from the `contents`/banner domain — this module's only reverse-direction dependency on another domain's Redux state (§5), scoped entirely to the preview simulation feature and not to the splash-screen resource itself.
- Ordinary shared-infrastructure reuse: `@/components/*` (button, select, input, switch, date-picker, table components, layout, iPhone-preview frame, modal, drag-sort-table, form-wrapper), `@/hooks/*` (`form.hook`, `auth.hook`, `query-state.hook`, `layout.hook`, `modal.hook`), `@/layouts/form.layout`, `@/redux/hooks` and `@/redux/slices/notification.slice` (the global toast slice every module uses), plus the third-party `@lottiefiles/dotlottie-react` player.

Imported **into** shared/other-module code **from inside** this module: **none** — a full-repository grep for `splash-screen|SplashScreen` outside the module directory returns only routing/menu/permission/i18n wiring (§2), plus one unrelated copy-pasted literal string (`'splash-screen-searcher'`, the AntD form `name` prop) reused verbatim in `src/modules/products/exclusive-touch/components/ExclusiveProductListSearcherForm.tsx:40` — a naming collision risk only if both forms are ever mounted simultaneously, which they are not (different routes), not escalated further.

## 11. Consumers

No outside module or shared component imports anything this module exports (§10) — the only outside references are the five `lazy()` route imports (§2), the menu entry, and the shared customer-segment cache key also used by `theme-management/background-main/` (§6, a shared-cache relationship, not an import of this module's own code). Within the module, the three preview components, the list/sort/view/history pages, and the create/edit containers consume the seven query/mutation hooks as enumerated in §6.

## 12. Pattern classification

**Mixed — target-compatible in server-state ownership and query-key organization, `LEGACY-COMPATIBILITY` in service location and styling, not compliant with `.claude/rules/11-i18n.md` in one specific spot:**

- **State ownership (target-compatible):** sole TanStack Query ownership of the splash-screen resource, zero Redux duplication (§5) — the second clean instance of this pattern after `bank-list/`, and the "a server resource must not have two independent authoritative owners" rule is satisfied cleanly here too.
- **Query key factory (target-compatible):** keys-only, imports only types, never `services/` (§6) — matching `bank-list/`'s own keys-only shape, both of which `.claude/rules/03-api-service.md` explicitly permits as an acceptable existing form alongside the `queryOptions`-colocating shape.
- **Service location (`LEGACY-COMPATIBILITY`):** `services/splash-screen.service.ts` is feature-local, predating the 2026-10-29 service-location adoption date recorded for the repository generally (git history for this specific file's creation date was not re-derived in this pass, but the file is unchanged on the current branch and the module as a whole shows no in-progress migration); `src/services/system/` does not contain a splash-screen entry.
- **Forms (target-compatible):** AntD `Form`/`FormInstance` as the sole form-state owner, no RHF, consistent with `.claude/rules/05-form.md`.
- **Styling (`LEGACY-COMPATIBILITY` per `.claude/rules/10-styling.md`):** Emotion `css`/`jsxImportSource` usage across roughly 10 of the module's files; no `.module.scss` anywhere in this module.
- **i18n (mostly compliant, one confirmed gap worth naming plainly):** 80 distinct literal `t()` keys were found across the module, and every one resolves in both `vi.json` and `en.json` — unusually complete i18n coverage compared to every sibling submodule documented so far in `OVERVIEW.md`/`MAINTENANCE.md`/`BANK-LIST.md`, which is a positive finding worth recording, not just a neutral one. The one exception: `view/history.tsx:20-34`'s `convertFieldActionType` helper returns hardcoded Vietnamese literals (`'Tạo'`, `'Điều chỉnh'`, `'Kích hoạt'`, `'Vô hiệu'`) directly, bypassing `t()` entirely — a confirmed, isolated violation of `.claude/rules/11-i18n.md` in an otherwise well-covered module.

## 13. Technical risks

1. **Sort page's `enabled: true` leak into the list query's filter params** (§4 Flow E, §0 item 1) — if the backend treats `enabled` as a status filter on this endpoint, inactive splash screens would silently disappear from the reorder set.
2. **Sort page capped at the first 10 items with no pagination control** (§4 Flow E, §0 item 2) — a splash-screen list larger than `PAGINATION_PARAMS.limit` cannot be fully reordered through this page; backend re-ranking/collision behavior for the untouched remainder is unverified.
3. **Customer-segment field and its backing query are shipped in source but commented out at their one call site** (§4 Flow F, §6) — a confirmed, currently-inert feature. Existing segment assignments survive an edit save via a hidden field, but a new splash screen is always created with an empty segment list, and no UI exists today to change that.
4. **Order and update mutations leave adjacent caches stale.** The reorder mutation invalidates only the list, not the reordered items' own `detail(id)` entries; the update mutation invalidates detail and list but not `histories(id)` (§6) — a user who navigates directly from one of these flows to the affected detail/history view may see stale data until the next default refetch.
5. **No explicit `staleTime` anywhere in this module** (§6) — a `SHOULD`-level gap against `.claude/rules/03-api-service.md`'s guidance for paginated list queries, the same class of finding already recorded for `bank-list/` in `BANK-LIST.md` §13.
6. **Create/update error handling collapses distinct failures into one generic toast.** Both the upload step and the create/update step funnel into the same `CREATE_FAIL`/`UPDATE_FAIL` message on any failure (`create/index.tsx:59-62`, `edit/index.tsx:80-83`), so a user cannot tell an upload failure from a validation or save failure from the toast alone.
7. **Duplicated upload-cache/double-submit logic between `create/index.tsx` and `edit/index.tsx`** — the same `cachedUpload`-ref-plus-`inFlight`-ref pattern is written twice rather than shared.
8. **Redundant permission check.** `SplashScreenList.tsx:221`'s `[SPLASH_SCREEN_VIEW]` preview-button gate is always true on a route that already requires that same permission to render at all.
9. **Isolated i18n gap.** `view/history.tsx:20-34`'s action-type labels are hardcoded Vietnamese, the one exception to this module's otherwise-complete `t()` coverage (§12).
10. **Dead/commented-out code left in shipped files**, beyond the segment field itself: a commented import in `SplashScreenList.tsx:47`, a commented `Tag` import and a commented column block in `SplashScreenSort.tsx:4,23,59-77` — `.claude/rules/00-general.md`'s "Comments" section asks for removal of commented-out code when a file is next touched, not a standing defect to fix proactively here.
11. **Naming-convention deviation on two hook files**, confirmed genuine by a repository-wide check: `hooks/splashScreenQueries.ts` and `hooks/useSplashScreenCustomerSegments.ts` do not use the `*.hook.ts` suffix that 21 other hook files in `src/` do follow, but 12 files across `src/modules/**/hooks/` share this same deviation (including `bankQueries.ts`, already documented as a sibling pattern in `BANK-LIST.md`) — this is an existing, repository-wide `LEGACY-COMPATIBILITY` naming pattern, not a defect unique to this module, and not something to rename incidentally.
12. **No non-null assertions found anywhere in this module** (`grep` for `!.`/`!)` returns no match) — recorded as a positive finding, consistent with this module's generally cleaner profile relative to its siblings.

## 14. Areas to avoid touching

- `src/services/users/customer-segment.service.ts` and `src/queryKeys/users/customer-segment.query-keys.ts` — not owned by this module; shared with both `products/` (per `SEGMENTATION.md`) and `theme-management/background-main/` (§6, §10). A change to that service's shape affects three independent modules, two of which are outside this document's scope.
- `src/redux/slices/banner.slice.ts`'s `getScreenList` thunk — not owned by this module; consumed only by the Marketing-preview simulation, and a change there affects the unrelated `contents`/banner domain that actually owns it.
- `hooks/splashScreenQueries.ts`'s mutation `onSuccess` invalidation blocks — shared by both the create and edit flows (and, for the order mutation, the sort flow); any change to cache-sync behavior here affects all of them simultaneously (risk 4).
- `components/SplashScreenCustomerSegmentField.tsx`/`hooks/useSplashScreenCustomerSegments.ts` — re-enabling this currently-commented-out feature, if ever authorized, is a scoped change that should be planned deliberately rather than uncommented incidentally; this document records its existence and inert status but does not propose turning it back on.

## 15. Open questions

- `NEEDS-VERIFICATION`: backend semantics of the `enabled` query parameter on the list endpoint (risk 1, §0).
- `NEEDS-VERIFICATION`: backend behavior when the reorder payload omits items beyond the first page (risk 2, §0).
- `NEEDS-VERIFICATION`: whether the backend cleans up an orphaned uploaded `imageKey` when the subsequent create/update call fails or is abandoned (§0).
- `NEEDS-VERIFICATION`: runtime cache-staleness impact of risk 4 (order/update mutations not invalidating every adjacent cache) — whether the default refetch-on-mount behavior is sufficient in practice was not exercised.
- `NEEDS-VERIFICATION`: the exact git history date this module's `services/splash-screen.service.ts` was created, to confirm it predates the 2026-10-29 service-location adoption the way `bank-list/`'s service was confirmed to (§12) — not re-derived in this pass.
- `NEEDS-TEAM-DECISION`: whether the customer-segment field/hook (risk 3, §4 Flow F) should be finished and re-enabled, left as dormant code, or removed. Not resolved here.
