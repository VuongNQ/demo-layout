# Banner — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq`, clean tree.
- Date: 2026-11-04.
- Method: static source inspection. One read-only `codebase-analyzer` subagent read all 23 files of this submodule in full, plus `src/redux/slices/banner.slice.ts`, `banner.middleware.ts`, `src/queryKeys/contents/banner-simulation.query-keys.ts`, `src/services/contents/banner-simulation.service.ts`, and the surrounding route/permission/menu/shared-component references. This session independently re-verified the highest-impact findings directly from source (listed below) rather than trusting the subagent's report at face value.
- Scope: `src/modules/contents/banner/` — 23 files. Split out of [`OVERVIEW.md`](OVERVIEW.md) per the template's size rule — see that file's §0 for the split rationale. `OVERVIEW.md` is this document's sibling, not a source of facts about this submodule's own internals.
- Directly re-verified by this session, not merely taken from the subagent (all CONFIRMED): that `GET api/admin/portal/v1/screen/all` is called from both `banner.slice.ts:261` (Redux thunk `getScreenList`) and `src/services/contents/banner-simulation.service.ts:3` (the `BANNER_SCREEN_ALL_ENDPOINT` constant backing the TanStack Query key factory) — two independent callers of the same endpoint, from two different state-ownership mechanisms.
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Which of the two `screen/all` callers (§5, §13) is meant to be authoritative, or whether this is an unintentional duplication rather than a deliberate split (e.g. one for a settings dropdown, one for the simulation modal, each with different freshness needs).
  2. Whether `src/modules/products/exclusive-touch/components/simulation/ExclusiveTouchPreview.tsx` (a confirmed consumer of the shared `BannerCarousel` component, §10) passes `bannerLists` as a prop or lets the component self-fetch Home banner data — this determines whether a third caller of banner data exists.
  3. Whether banner's create/edit submit paths (`createBanner.tsx`, `edit/general.tsx`) rely on AntD's own `onFinish` validation gate, or validate nothing explicitly before submission — both files were read as calling `form.getFieldsValue()` rather than `form.validateFields()` in their submit handlers, but this session did not independently trace AntD's own default behavior for an unvalidated `getFieldsValue()` submit path.
  4. Runtime behavior of the unsaved-changes guard when navigating away mid-drag-reorder (`list.tsx`) — confirmed to exist in source, not exercised.
  5. Whether a save-draft flow exists anywhere in banner create/edit (none was found by either the subagent or this session's own spot-check).

## 1. Responsibility

Home and Marketing banner settings (CONFIRMED, `list.tsx`, `create/createBanner.tsx`, `edit/general.tsx`, `view/general.tsx`): a list with drag-priority reordering and a status toggle; a create/edit flow with per-slot image upload and a canvas-merged preview; a read-only view; and a live simulation modal ("Mô phỏng") that renders what a banner screen would actually look like for a given date/customer-segment combination, backed by this module's only TanStack Query usage. Backend resource family: `api/admin/portal/v1/banners*`, `screen/all`, `banner/simulation`, `banner/history/...`.

## 2. Entry points and routes

See [`OVERVIEW.md`](OVERVIEW.md) §2 for the full module-wide route/menu table. This submodule owns: list (`main.routes.tsx:473`, `BannerList`, `BANNER_SETTING_VIEW`) and create/edit/view (`form.routes.tsx:1014,1032,1038`, `BannerViewSettings`/`BannerEditSettings`/`BannerCreateSettings`, `BANNER_SETTING_{VIEW,EDIT,CREATE}`) — all single-permission arrays, no OR arrays, consistent with every other route in `contents/`. The "Quảng cáo" (advertising) menu submenu's banner child entry (`menus.helper.ts:402-406`) is independently gated by `BANNER_SETTING_VIEW`, matching the route.

## 3. Directory map

```text
banner/
|-- list.tsx                            # 720 lines — list, filters, drag-priority, status toggle, simulation entry point
|-- constants.ts                        # 233 lines — screen/layout codes, grid templates, canvas size, PAGE_SIZES, BannerManagementTabs enum
|-- utils.ts                            # 41 lines — option builders, screen-code lookup helpers
|-- components/
|   |-- BannerFilters.tsx               # 214 lines — filter form (Form.useForm), BANNER_SETTING_EDIT check at :189
|   |-- ImageCell.tsx                   # 198 lines — list thumbnail: dispatches getBannerPreview, merges slot images on canvas
|   |-- ProductLabelField.tsx           # Form.useFormInstance, required-rule field
|   `-- UploadImage.tsx                 # 247 lines — upload control; calls apiFetcher.post directly (legacy, §6)
|-- create/
|   |-- createBanner.tsx                # 1,466 lines — create form body: slot upload, merged preview, createBanner dispatch
|   |-- form.tsx                        # FormLayout shell, one "Thông tin chung" tab
|   `-- itemCard.tsx                    # 236 lines — per-slot card (create variant)
|-- edit/
|   |-- general.tsx                     # 1,620 lines — edit form body, same upload/submit pattern as create
|   |-- form.tsx                        # FormLayout shell with BannerManagementTabs
|   `-- itemCard.tsx                    # 255 lines — per-slot card (edit variant)
|-- view/
|   |-- general.tsx                     # 1,190 lines — read-only view body, resolves slot/redirect labels
|   |-- form.tsx                        # view shell
|   `-- history.tsx                     # audit history tab
|-- hooks/
|   `-- useBannerSetting.ts             # 185 lines — Redux-backed hooks: list, channels, screens, redirects, autocomplete, status, priority
`-- simulation/
    |-- formSelectScreen.tsx            # 200 lines — modal form: screen, date, customer segments
    |-- simulationModalContent.tsx      # 71 lines — THE ONLY TanStack Query consumer in this module
    |-- BannerCarousel.tsx              # 201 lines — local AntD Carousel for Marketing grid layouts
    |-- HomeBannerCarousel.tsx          # wraps the SHARED src/components/simulation/components/BannerCarousel for Home
    |-- MarketingBannerCarousel.tsx     # wraps the LOCAL carousel above, for Marketing
    `-- SimulationEmpty.tsx             # empty state
```

Three files exceed ~1,000 lines each (`edit/general.tsx` 1,620, `createBanner.tsx` 1,466, `view/general.tsx` 1,190) — well past `.claude/rules/07-component.md`'s ~200-line review-trigger threshold; this is recorded as a fact, not independently re-litigated here, since the rule itself frames the threshold as "a review trigger to inspect cohesion," not an automatic split requirement, and no task in scope here is touching these files (§13 item 2 notes the duplication between them, which is the more actionable finding).

## 4. Main runtime flows

### Flow A — create/edit: upload-then-submit, with a canvas-only merged preview

(CONFIRMED by the subagent's read; the core upload/dispatch sequencing was not independently re-walked line-by-line by this session)

1. Create is gated by `BANNER_SETTING_CREATE` (`list.tsx:536`) and navigates to `createBanner.tsx` via `PageURLs.ofBannerSettingCreate()`.
2. Submit (`createBanner.tsx`, around lines 300-410 per the subagent) builds request params from `form.getFieldsValue()` — **not** `form.validateFields()` (§0 open question 3). For each MARKETING slot whose file is a fresh `File` object, it `POST`s to `api/admin/file?category=CONTENT` directly from the component (`:397` — a direct `apiFetcher` call, not through a service, §6) and replaces that slot's `imageUrl` with the returned storage key, then dispatches `createBanner`.
3. **The canvas-merged preview is display-only and never submitted.** `createBanner.tsx` (around lines 261-310) draws the configured slot images onto an HTML canvas to build a `previewMergedUrl`, shown to the user in the form — but the actual submitted payload uses the per-slot upload results from step 2, not the merged canvas blob. This is a confirmed, deliberate-looking separation (preview UX vs. request payload), not a bug by itself, but worth recording since a future reader might assume the merged image is what gets saved.
4. `edit/general.tsx` follows the identical pattern (upload at around line 452) — this duplication between the create and edit bodies (slot-upload sequencing, date formatting, redirect-option lookup) is not shared through any common file (§13 item 6).
5. On success, the Redux listener middleware (`banner.middleware.ts`) navigates: create → the list; update → the view page.

### Flow B — drag-priority reorder with an unsaved-changes guard

(CONFIRMED by the subagent's read)

1. The list table uses `DndContext`/`SortableContext` (around `list.tsx:555-568`). `onDragEnd` (around `:351-368`) reorders the visible `dataSource` locally and rewrites each row's `priority` as `page * pageSize + index + 1` — a purely client-side, not-yet-persisted reorder.
2. Saving requires an explicit confirm step: the `TableSummary` action opens a confirmation modal, which on confirm dispatches `changeBannerPriority` (around `:423-439`) → `PUT banners/sort` (`banner.slice.ts:218`).
3. **Unsaved-changes guard:** if the user changes pages while a drag-reorder is pending (unsaved), a separate "you have unsaved changes" modal appears (around `:441-480`) rather than silently discarding the reorder. This is a real, source-confirmed UX safeguard — not exercised at runtime by this session (`NEEDS-VERIFICATION`, §0/§15, for whether it behaves correctly in every navigation path, e.g. browser back vs. in-app pagination).
4. Status (active/inactive) toggling is a separate action, `PUT banners/active` (`banner.slice.ts:204`), independent of the priority-reorder flow.

### Flow C — the simulation modal (live backend call, not mock data)

(CONFIRMED by the subagent's read; the TanStack Query usage and its endpoint were independently re-verified by this session, §0)

1. A "Mô phỏng Chạm Vay" ("Simulate Cham Vay") button, gated by `BANNER_SETTING_VIEW` (`list.tsx:524-533`), opens a `ModalContent` containing `FormSelectScreen` (`simulation/formSelectScreen.tsx`).
2. The form offers a screen choice (MARKETING or HOME), a start date, and a customer-segment multi-select backed by a Redux autocomplete hook (`useAutocompleteSearch`). On submit, `list.tsx` opens a second modal (`openIphonePreviewModal`) containing `SimulationModalContent`.
3. **`simulationModalContent.tsx` is this module's only TanStack Query usage.** It runs `useQuery({ ...bannerSimulationQueryKeys.screen({...}), enabled: Boolean(startDate) && isSupportedScreen })`. The query function calls `getSimulationScreenBanner`, which `POST`s to `api/admin/portal/v1/banner/simulation` (`src/services/contents/banner-simulation.service.ts`) — **a real, live backend call, not mock/sample data**, confirmed by reading the service file directly.
4. The result renders either `MarketingPage`/`HomePage` (via `MarketingBannerCarousel`/`HomeBannerCarousel`) or `SimulationEmpty` if nothing qualifies. `HomeBannerCarousel` wraps a **shared** component, `src/components/simulation/components/BannerCarousel/index.tsx`, which self-fetches Home-screen banner data when it isn't given a `bannerLists` prop (§10) — a second, independent data path for the same screen type, not something this submodule's own code controls.

## 5. State ownership

| State | Owner | Registered? |
| --- | --- | --- |
| Banner list/detail/channels/screens/redirects/autocomplete/history/priority/status | Redux `bannerSlice` (`src/redux/slices/banner.slice.ts`, name `'banner-settings'`), 13 thunks | `src/redux/slices.ts:79`; middleware `configureBannerManagementMiddleware` registered `src/redux/store.ts:81` (CONFIRMED thunk/endpoint count match, 13/13, per the subagent) |
| List page/filter/sort/page | **Local `useState`** (`list.tsx`, around lines 319-327) — **not** URL state, unlike this module's siblings `t&c/`/`t&c-place/` (`../OVERVIEW.md` §5) | `legacy-compatible` |
| Drag-reorder staging | Local `useState` (`isDragEnd`, `pendingAction`, around `list.tsx:318,347`) | Committed to Redux only on explicit confirm (§4 Flow B) |
| Upload preview / merged-canvas blob URLs | Local `useState` (`createBanner.tsx`, `ImageCell.tsx`) | Display-only, never submitted as-is (§4 Flow A) |
| **Banner simulation result (`screen/simulation`)** | **TanStack Query**, via `bannerSimulationQueryKeys` (`src/queryKeys/contents/banner-simulation.query-keys.ts`) and `getSimulationScreenBanner` (`src/services/contents/banner-simulation.service.ts`) — this module's **only** Query usage | Not Redux — a genuinely new, separate server-state owner for this one resource, consistent with `.claude/rules/04-state-management.md`'s "server data for a new feature/resource → TanStack Query" row |
| 14 `Form.useForm`/`useFormInstance` instances | AntD `Form`/`FormInstance` across list filters, create, edit, view, and the simulation screen-select form | One per flow, consistent with `.claude/rules/05-form.md` |

**Confirmed dual-owner finding, directly re-verified this session, not merely taken from the subagent:** `GET api/admin/portal/v1/screen/all` is called from **two independent places** — `banner.slice.ts:261` (`getScreenList`, a Redux thunk feeding `hooks/useBannerSetting.ts`'s screen-dropdown data) and `src/services/contents/banner-simulation.service.ts:3` (`BANNER_SCREEN_ALL_ENDPOINT`, backing the TanStack Query key factory's `screenList()` method, consumed by the shared `BannerCarousel` component outside this module, §10). This is two independent caches of the same server resource, with two different lifetimes/invalidation policies — the exact "one server resource must have one authoritative owner" risk `.claude/rules/04-state-management.md` names, though whether it is a deliberate split (e.g. one feeds a form dropdown, the other feeds a read-heavy preview) or an unintentional duplication is `NEEDS-TEAM-DECISION` (§0, §13, §15), not resolved here.

## 6. API boundaries

- **No feature-local `services/` folder in `banner/` itself.** The one real service file for this submodule is `src/services/contents/banner-simulation.service.ts` — at the **target** `src/services/<module>/` location (adopted 2026-10-29), not a `LEGACY-COMPATIBILITY` feature-local service, and exported through the root `src/services/index.ts` barrel.
- **`banner.slice.ts`'s 13 thunks call `apiFetcher` directly** (no service layer for these): `GET banners` (list), `GET channels/all`, `GET banners/detail` (×2 call sites), `GET {paths[type]}/select`, `PUT banners/active`, `PUT banners/sort`, `GET screen/all`, `GET redirect-types/all`, `GET redirect-details/all`, `POST banners` (create), `PUT banners` (update), `GET banner/history/{screenId}/{id}`.
- **Confirmed direct `apiFetcher` calls from component files, not through any service (LEGACY-COMPATIBILITY, not something to extend):** `createBanner.tsx` (around `:397`) and `edit/general.tsx` (around `:452`) each `POST api/admin/file?category=CONTENT` directly from their submit handlers; `components/UploadImage.tsx` (around `:62-63`) similarly `POST`s `api/admin/file?category=${finalCategory}` directly. Per `.claude/rules/03-api-service.md`, new code should not add further direct-from-component calls like these; the existing three are recorded, not treated as license to add a fourth.
- **The simulation endpoint, `POST api/admin/portal/v1/banner/simulation`**, is the one endpoint in this submodule reached through the target service/Query pattern rather than a Redux thunk (§5 Flow C).
- DTOs are typed-only; no runtime validation anywhere in this submodule (confirmed, same grep as `../OVERVIEW.md` §3) — the default boundary assumption for stable CRUD, not a gap.
- Errors and navigation-on-success for the Redux-owned flows are owned by `banner.middleware.ts`'s listener middleware (§4 Flow A step 5), not by components.

## 7. Forms and validation

- `Form.useForm`/`AntForm.useForm`/`Form.useFormInstance` call sites (per the subagent, consistent with the module-wide count in `../OVERVIEW.md` §7): `list.tsx` (filters), `components/BannerFilters.tsx`, `components/ProductLabelField.tsx` (`useFormInstance`), `create/createBanner.tsx`, `edit/general.tsx`, `view/general.tsx` (read-only display, still instantiates a form for consistent rendering).
- `rules={` sites (`grep -rln "rules={"`, per the subagent): `simulation/formSelectScreen.tsx`, `edit/itemCard.tsx`, `edit/general.tsx`, `components/ProductLabelField.tsx`, `create/createBanner.tsx`, `create/itemCard.tsx` — roughly 45 `rules` occurrences combined across create+edit, the bulk of this module's validation surface.
- **Confirmed gap in explicit validation execution:** `createBanner.tsx`'s submit handler reads `form.getFieldsValue()`, not `form.validateFields()` — whether AntD's own submit-button/`onFinish` wiring independently enforces the `rules` before this handler runs was not conclusively traced by either the subagent or this session (`NEEDS-VERIFICATION`, §0/§15); this is recorded as an open question, not asserted as a confirmed validation bypass.
- No Zod, no `react-hook-form` (§3's module-wide confirmation covers this submodule).
- Mixed i18n in form labels/messages: some hardcoded Vietnamese strings outside `t()` (e.g. around `edit/general.tsx:760`, `ProductLabelField.tsx:39`, per the subagent), unlike `t&c-place/`'s more consistent `t('Form.TandCPlace...')` usage — a real current-state inconsistency, not something this document treats as a defect requiring a fix in this pass.

## 8. Types and DTO organization

**This is the one submodule in `contents/` with a real, feature-local, exported types module, not an ambient `.d.ts`:** `src/types/banner.ts` (247 lines, ~20 named exports — e.g. `BannerCreateFormValues`, `BannerEditFormValues`, `BannerGridTemplate`, `SimulationScreenRequestData`, `SelectSimulationScreenFormValues`), imported explicitly by 14 files across this submodule. This is a better-aligned pattern than `popup/`'s, `t&c/`'s, and `t&c-place/`'s ambient-global types (`../OVERVIEW.md` §8), though it still lives under the global `src/types/` path rather than a feature-local `types/` folder inside `banner/` itself.

**Heavy `any` usage, confirmed by the subagent's grep, not independently re-counted by this session:** `list.tsx` (around `:340`), `createBanner.tsx` (`params: any` around `:324`, plus `:385,524`), `edit/general.tsx` (`params: any` around `:377`, plus `:443,586`), `view/general.tsx` (around `:208-209,399`), `components/ImageCell.tsx` (around `:105`), `hooks/useBannerSetting.ts` (`EMPTY_OPTIONS: any[]` around `:19`, plus `:107`). This is a real, concrete finding specific to this submodule — the rest of `contents/` does not show the same density of `any` usage per the subagent's broader read.

One legacy enum: `enum BannerManagementTabs` (`constants.ts:21`), used as `FormLayout`'s `tabEnum=` prop (`edit/form.tsx:75`) — `legacy-compatible`, same pattern as `popup/`'s and `t&c-place/`'s own tab enums.

## 9. Permissions

This submodule's permission surface is exactly the 3 `BANNER_SETTING_*` constants (`VIEW`/`CREATE`/`EDIT`, no `DELETE`) named in `../OVERVIEW.md` §9's 12-constant module total. Every call site is a single-element array:

- Route level: `BANNER_SETTING_VIEW` (list, view), `BANNER_SETTING_CREATE` (create), `BANNER_SETTING_EDIT` (edit) — `../OVERVIEW.md` §2.
- Component level (per the subagent, consistent with every other submodule's single-element-array pattern): `list.tsx` around `:524,536,588,597` (`BANNER_SETTING_VIEW` for the simulation button, `_CREATE` for the create button, `_EDIT` for edit-related actions), `components/BannerFilters.tsx` around `:189` (`BANNER_SETTING_EDIT`).
- **No helper function, no OR array anywhere in this submodule** — consistent with the rest of `contents/` (`../OVERVIEW.md` §9) and unlike `notifications`' per-entity-type helper (`checkPermissionNotiAutomatic`).
- Unlike `t&c-place/`'s list (`../OVERVIEW.md` §4 Flow C, §9), this submodule's create button **is** correctly `hasPermission`-gated — no analogous gap found here.

## 10. Shared and cross-domain dependencies

Imported **by** this submodule: ordinary shared-component/hook reuse (same set as `../OVERVIEW.md` §10, plus banner-specific: `src/components/simulation/*` for the simulation subsystem, `upload` for image controls).

**Imported INTO other code FROM inside this submodule — confirmed, and more extensive than any other submodule in `contents/`:**

- `src/components/simulation/components/BannerCarousel/index.tsx` imports `BANNER_SCREEN_CODES` from `banner/constants.ts` **and** the shared query key factory `src/queryKeys/contents/banner-simulation.query-keys.ts` — this shared component self-fetches Home-screen banner data via the same TanStack Query path this submodule's own `simulationModalContent.tsx` uses (§4 Flow C, §5), when it isn't given a `bannerLists` prop directly.
- **A different business module entirely depends on this submodule's internals:** `src/modules/system/splash-screen/components/preview/SplashScreenMarketingPreview.tsx` imports `BANNER_SCREEN_CODES`, `MarketingBannerCarousel`, and `SimulationEmpty` directly from `banner/`, plus the same shared query key factory — the Products-internal-import pattern `.claude/ARCHITECTURE.md` §5 discourages ("one business module importing another module's internal... component file"), here crossing from `system/splash-screen/` into `contents/banner/`.
- `src/modules/products/exclusive-touch/components/simulation/ExclusiveTouchPreview.tsx` is a third confirmed consumer of the shared `BannerCarousel` component (§0 open question 2) — whether it triggers the same self-fetch path is not settled.
- `src/redux/slices/{banner,popup}.slice.ts:1` import `PAGE_SIZES` from `banner/constants.ts` — global Redux infrastructure depending on this submodule's constant file (also noted in `../OVERVIEW.md` §10, repeated here since it is this submodule's own export being consumed).

This is a materially larger and more consequential reverse-dependency surface than any other submodule in `contents/` — two *other business modules* (`system/splash-screen/`, `products/exclusive-touch/`) and one *shared infrastructure component* all depend on banner-internal constants/components/query keys, which is the primary reason this submodule has its own document rather than folding into the overview.

## 11. Consumers

Direct: `../OVERVIEW.md` §11 covers the standard routing wiring. Cross-domain, specific to this submodule (§10): `src/components/simulation/components/BannerCarousel/index.tsx`, `src/modules/system/splash-screen/components/preview/SplashScreenMarketingPreview.tsx`, `src/modules/products/exclusive-touch/components/simulation/ExclusiveTouchPreview.tsx` (via the shared carousel), `src/redux/slices/{banner,popup}.slice.ts` (for `PAGE_SIZES`), `src/services/contents/banner-simulation.service.ts` and `src/services/index.ts` (for the one real service file).

## 12. Pattern classification

**Mixed — the one `target-compatible` TanStack Query usage in all of `contents/`, alongside the same `legacy-compatible` Redux/service/forms pattern as the rest of the module, plus this submodule's own, larger set of confirmed findings:**

- **Simulation state (`target-compatible`):** TanStack Query + a proper key factory in `src/queryKeys/contents/` + a service in `src/services/contents/` — matching `.claude/rules/03-api-service.md`'s expected shape for a new server resource, the only such instance anywhere in `contents/`.
- **Everything else (`legacy-compatible`):** Redux-owned list/detail/priority/status/history state, direct `apiFetcher` calls from three component files, ambient-adjacent-but-actually-real `src/types/banner.ts` (better than the module's other three submodules, but still outside a feature-local `types/` folder), AntD `rules`-only validation, local (not URL) list-page state.
- **Confirmed dual ownership of one resource (`screen/all`), not a classification call either way** — this is a concrete finding (§5, §13), not something resolved by labeling it legacy or target.
- **Heavy `any` usage (§8)** is a real current-state fact specific to this submodule, more so than the rest of `contents/`.

## 13. Technical risks

Ordered by decreasing consequence; each entry opens with a bold category label per the template.

1. **Two other business modules and one shared component depend on this submodule's internals** (§10, §11) — `system/splash-screen/`'s `SplashScreenMarketingPreview.tsx` and (via the shared carousel) `products/exclusive-touch/`'s preview both reach into `banner/constants.ts`/`banner/simulation/*` directly, and `src/redux/slices/{banner,popup}.slice.ts` import `PAGE_SIZES` from the same constants file. Renaming or restructuring any of `BANNER_SCREEN_CODES`, `MarketingBannerCarousel`, `SimulationEmpty`, or `PAGE_SIZES` breaks code in two other modules and one shared component, not just this submodule's own screens.
2. **Dual ownership of `GET screen/all`** (§5) — a Redux thunk and a TanStack Query key factory independently cache the same endpoint, with different lifetimes; `NEEDS-TEAM-DECISION` whether this is intentional.
3. **Duplicated create/edit logic across two 1,000+-line files** (§3, §4 Flow A): `createBanner.tsx` (1,466 lines) and `edit/general.tsx` (1,620 lines) repeat the same slot-upload-before-submit sequencing, date formatting, and redirect-option-lookup logic, with `view/general.tsx` (1,190 lines) overlapping further for display. A constraint change made in one of the three is not guaranteed to be reflected in the others.
4. **Unvalidated submit path (confirmed shape, unconfirmed consequence):** `createBanner.tsx`'s submit handler reads `form.getFieldsValue()` rather than calling `form.validateFields()` explicitly (§7) — whether this means `rules` are silently skippable on this specific path is `NEEDS-VERIFICATION` (§0/§15).
5. **Heavy `any` usage** across list, create, edit, view, and the shared hook (§8) — undermines the type-safety benefit of `src/types/banner.ts` otherwise being a real, feature-local, exported types module.
6. **Canvas-merged preview is display-only** (§4 Flow A) — not a defect, but a real trap for a future reader who assumes the merged image is what gets persisted; worth the explicit record here.
7. **Mixed i18n within one submodule** (§7) — some labels hardcoded, unlike `t&c-place/`'s more consistent `t()` usage.
8. **Three 1,000+-line files** (§3) past the component-size review trigger in `.claude/rules/07-component.md` — recorded as a fact, not a mandate to split them absent a task that already touches them.

## 14. Areas to avoid touching

- `src/components/simulation/components/BannerCarousel/index.tsx`, `src/modules/system/splash-screen/components/preview/SplashScreenMarketingPreview.tsx`, and `src/modules/products/exclusive-touch/components/simulation/ExclusiveTouchPreview.tsx` — all three depend on `banner/`-internal exports (§10/§13 item 1); do not change `BANNER_SCREEN_CODES`, `MarketingBannerCarousel`'s or `SimulationEmpty`'s props, or the shared query key factory's shape without auditing all three.
- `src/redux/slices/{banner,popup}.slice.ts:1`'s `PAGE_SIZES` import from `banner/constants.ts` (§10).
- `src/queryKeys/contents/banner-simulation.query-keys.ts` and `src/services/contents/banner-simulation.service.ts` — shared beyond this submodule's own `simulationModalContent.tsx` (§5, §10/§13 item 2); resolving the `screen/all` dual-ownership question touches both this file and `banner.slice.ts:261`, which has its own separate consumer set (`hooks/useBannerSetting.ts`).
- `banner.middleware.ts` — owns create/update success navigation (§4 Flow A); any permission or validation fix applied to `createBanner.tsx`/`edit/general.tsx` should account for what the middleware does on success/failure.

## 15. Open questions

- `NEEDS-TEAM-DECISION`: which of the two `GET screen/all` callers (Redux `banner.slice.ts:261` vs. the TanStack Query key factory, §5/§13 item 2) should be authoritative, or whether both are intentionally kept for different consumers with different freshness needs.
- `NEEDS-VERIFICATION`: whether `ExclusiveTouchPreview.tsx` (§0, §10) passes `bannerLists` to the shared carousel or lets it self-fetch — determines whether a third caller of Home-banner data exists.
- `NEEDS-VERIFICATION`: whether `createBanner.tsx`'s `form.getFieldsValue()`-based submit (§7, §13 item 4) is actually unvalidated at runtime, or AntD's own submit wiring enforces `rules` regardless of which getter the handler calls.
- `NEEDS-VERIFICATION`: whether the unsaved-changes guard (§4 Flow B) behaves correctly across every navigation path (in-app pagination vs. browser back/forward vs. direct URL change) — confirmed to exist in source, not exercised at runtime.
- `NEEDS-VERIFICATION`: whether a save-draft flow exists anywhere in banner create/edit — none was found by either the subagent or this session's spot-check, but this was not an exhaustive search.
