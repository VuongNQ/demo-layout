# Contents — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq`, clean tree (`git status --porcelain` empty).
- Date: 2026-11-04.
- Method: static source inspection only. One read-only `codebase-analyzer` subagent read all 61 files (or representative files for the larger ones) plus the surrounding routes/menu/permission/Redux wiring. This session independently re-verified the highest-impact findings directly from source before writing this document (listed below), rather than trusting the subagent's report at face value.
- Scope: `src/modules/contents/` (61 files, `find src/modules/contents -type f | wc -l`, re-confirmed this session) — 4 real submodules (`banner/` 23 files, `popup/` 11, `t&c/` 11, `t&c-place/` 13) plus 3 loose top-level placeholder files, and the parts of `src/routes/`, `src/redux/`, `src/helpers/menus.helper.ts`, `src/constants/permission.constant.ts`, `src/queryKeys/contents/`, and `src/services/contents/` that reach or gate this module.
- `banner/` is split into its own document, [`BANNER.md`](BANNER.md), per the template's size rule: it is 23 files with three distinct subsystems (a list with drag-priority and an unsaved-changes guard; create/edit/view bodies with canvas image-merge and direct uploads; a simulation modal that is this module's only TanStack Query consumer), 13 Redux thunks, a confirmed dual-owner risk on one endpoint, and real cross-domain consumers in `src/components/simulation/` and `system/splash-screen/`. `popup/` (11 files), `t&c/` (11 files), and `t&c-place/` (13 files) are covered in full in this document — `t&c/` and `t&c-place/` are close structural twins (URL-state lists, versioning/history tabs) and are documented together; `popup/` has one distinct flow (drag-priority with an optimistic-concurrency token) and is documented alongside them.
- Directly re-verified by this session, not merely taken from the subagent (all CONFIRMED): that `FAQ` **is** routed (`main.routes.tsx:345`, lazy export `pages.tsx:55`) — correcting this session's own earlier scoping assumption that it was an orphan, see §2; that `t&c-place/t&c-place-list.content.tsx` has zero `hasPermission` calls (`grep -c "hasPermission"` = 0) while its "Tạo mới" button is unconditional (§9, §13); that `banner.slice.ts:261` and `banner-simulation.service.ts:3` both call `GET api/admin/portal/v1/screen/all` (§5, §13); the `console.log(formValues)` leftover at `t&c-place/components/preview-content.tsx:9`; and that `popup/list.tsx`'s `changePopupPriority.rejected` is caught by the shared middleware matcher that dispatches a toast, while `list.tsx` also renders its own inline `<Alert type='error' message={priorityError}>` for the same failure (§13).
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Backend meaning of "accept history" (`eula/{id}/accept/history`, `term-and-condition/{id}/accept/history`) — whether it is a customer-acceptance audit log or something else; column names (timestamp, account, device, accepted content) support the audit-log reading but this was not confirmed against a backend contract.
  2. Whether `popups/priorities` expects the full list or only the current page's IDs — the frontend sends only the current page's IDs (`popup/list.tsx`).
  3. Which of the two independent callers of `GET screen/all` (Redux `banner.slice.ts:261` vs. the TanStack Query `banner-simulation.service.ts` key) is meant to be authoritative, or whether this is an unintentional duplication (§5, §13 — detailed further in `BANNER.md`).
  4. Whether `src/modules/products/exclusive-touch/components/simulation/ExclusiveTouchPreview.tsx` passes `bannerLists` to the shared `BannerCarousel` component or lets it self-fetch — this affects whether a third caller of the Home-banner data exists.
  5. Whether the three placeholder pages (`advertisement-service.content.tsx`, `contact-info.content.tsx`, `faq.content.tsx`) are intentionally left out of the menu pending a real implementation, or are simply unfinished.

## 1. Responsibility

Four largely independent content-management submodules sharing one parent menu group ("Quản trị nội dung" / content management), plus three routed-but-unimplemented placeholder pages:

- **`popup/`** — popup settings: list with drag-priority reordering, create/edit/view with General and History tabs, and a status toggle. Backend resource: `api/admin/portal/v1/popups*`.
- **`t&c/`** — Terms & Conditions content, with versioning (a "create new version" flow reusing the edit route) and a content-copy prefill, plus an accept-history tab. Backend resource: `api/admin/portal/v1/term-and-condition*`.
- **`t&c-place/`** — T&C display-location (where/when a given T&C is shown, EULA-shaped), with its own create/edit/view and two distinct history tabs (an "updated" audit log reusing a Products-domain slice, and an "accept" log). Backend resource: `api/admin/portal/v1/eula*`.
- **`banner/`** — see [`BANNER.md`](BANNER.md) for full detail. Home/Marketing banner settings: list with drag-priority, create/edit/view with image upload and a canvas-merged preview, and a live simulation modal.
- Relationship (LIKELY): `t&c/` and `t&c-place/` are parallel, structurally similar features (URL-state lists, versioning/history patterns) under one "T&C" menu branch; `banner/` and `popup/` are parallel "Quảng cáo" (advertising) features under a separate menu branch. None of the four shares runtime state with another of the four; the one real cross-submodule coupling found is `t&c-place/`'s reuse of a Products-domain Redux thunk for its "updated history" tab (§10).

## 2. Entry points and routes

**Correction to this session's own earlier scoping:** `FAQ` is routed — `main.routes.tsx:345` (`<Route path={withPrefix('content/faq')} element={<WithGuard Page={FaqPage} Guard={AuthGuard} />} />`), lazy export `pages.tsx:55`. It has a `PageURLs.ofFAQ()` builder (`src/utils/navigate.ts:224`) and a commented-out menu entry (`menus.helper.ts:447-451`) — routed and reachable by direct URL, just not in the menu, same as its two placeholder siblings. (CONFIRMED, this session re-verified directly.)

- **Placeholder routes (CONFIRMED):** `content/advertisement-service` → `AdvertisementService` (`main.routes.tsx:331-333`), `content/contact-info` → `ContactInfo` (`main.routes.tsx:344`), `content/faq` → `FaqPage` (`main.routes.tsx:345`) — all three `AuthGuard`-only, no `permissions` array, all three 3-line static-text stubs (§3).
- **Real-feature routes, all single-permission arrays, no OR arrays anywhere in this module (CONFIRMED by the subagent's read, consistent with every call site this session independently checked):**

  | Path | Route file : line | Page | Permission |
  | --- | --- | --- | --- |
  | `content/tandc/t&c` | `main.routes.tsx:335-337` | `TAndC` | `TNC_VIEW` |
  | `content/tandc/t&c-place-list` | `main.routes.tsx:340-342` | `TAndCPlaceList` | `TNC_DISPLAY_LOCATION_VIEW` |
  | banner list | `main.routes.tsx:473` | `BannerList` | `BANNER_SETTING_VIEW` |
  | popup list | `main.routes.tsx:487` | `PopupListPage` | `POPUP_SETTING_VIEW` |
  | `content/tandc/t&c/create` | `form.routes.tsx:733` | `CreateTAndC` | `TNC_CREATE` |
  | `content/tandc/t&c/view/:id` | `form.routes.tsx:737` | `ViewTAndC` | `TNC_VIEW` |
  | `content/tandc/t&c/create-new-version/:id` | `form.routes.tsx:740-741` | `EditTAndC` (reused for versioning, not a separate page) | `TNC_EDIT` |
  | `content/tandc/t&c-place-list/create` | `form.routes.tsx:746` | `CreateTAndCPlace` | `TNC_DISPLAY_LOCATION_CREATE` |
  | `content/tandc/t&c-place-list/view/:id` | `form.routes.tsx:752` | `ViewTAndCPlace` | `TNC_DISPLAY_LOCATION_VIEW` |
  | `content/tandc/t&c-place-list/edit/:id` | `form.routes.tsx:758` | `EditTAndCPlace` | `TNC_DISPLAY_LOCATION_EDIT` |
  | popup view/edit/create | `form.routes.tsx:1019,1023,1027` | `PopupViewPage`/`PopupEditPage`/`PopupCreatePage` | `POPUP_SETTING_{VIEW,EDIT,CREATE}` |
  | banner view/edit/create | `form.routes.tsx:1014,1032,1038` | see `BANNER.md` §2 | `BANNER_SETTING_{VIEW,EDIT,CREATE}` |

- **Versioning reuses the edit route, not a dedicated one (CONFIRMED):** `content-new-version/:id` renders `EditTAndC` — the same component as a plain edit — gated by `TNC_EDIT`, meaning creating a new T&C version requires the same permission as editing one, with no separate "version" permission constant.
- **Hardcoded route string, not a `PageURLs` builder (CONFIRMED):** `t&c/view/view-tandc.tsx:44` and `t&c/view/history.tsx:47` navigate to the literal string `/content/tandc/t&c/create-new-version/${id}` — no builder exists for this path. The same pattern (a real but unbuilt route) appears elsewhere in this repository (e.g. `notifications`' 6 unbuilt sub-routes, `docs/modules/notifications/OVERVIEW.md` §2) and is not unique to this module.
- **Menu (CONFIRMED, `src/helpers/menus.helper.ts:364-412`):** the parent "content" menu item's own link (`:367`) and the "Quảng cáo" submenu's own link (`:399`) both resolve to `PageURLs.ofAdvertisementService()` — the placeholder stub — exactly the same "parent menu link points at an unreachable-via-click placeholder" pattern already documented for `notifications`' `GeneralNotice` (`docs/modules/notifications/OVERVIEW.md` §2, §13). "Quảng cáo"'s two real children (banner, popup) are each independently permission-gated (`:402-412`); T&C's two children (`:380-393`) likewise. Three further menu entries (advertisement service, contact info, FAQ) are commented out (`:369-373`, `:441-445`, `:447-451`) — none of the three placeholder pages has a visible menu entry.

## 3. Directory map

`find src/modules/contents -type f | sort` → 61 files (CONFIRMED, re-run this session).

```text
src/modules/contents/
|-- advertisement-service.content.tsx   # placeholder stub, 3 lines, routed (AuthGuard only)
|-- contact-info.content.tsx            # placeholder stub, 3 lines, routed (AuthGuard only)
|-- faq.content.tsx                     # placeholder stub, 3 lines, routed (AuthGuard only, §2 correction)
|-- banner/                             # 23 files — see BANNER.md
|-- popup/                              # 11 files
|   |-- list.tsx                        # list, filters, drag-priority with confirm modal, status toggle
|   |-- constants.ts                    # PAGE_SIZES re-export, FREQUENCY_OPTIONS, ACCEPT_IMAGE_TYPE, PopupManagementTabs enum
|   |-- utils.ts                        # 1-line stub
|   |-- components/
|   |   |-- PopupForm.tsx               # FormLayout container, General + History tabs
|   |   |-- PopupGeneral.tsx            # create/edit form body: validateFields, payload build, create/update dispatch
|   |   |-- sortable-row.tsx            # dnd-kit DragHandle + RowTable for the list's drag-priority
|   |   `-- simulation/PopupPreview.tsx # preview using shared simulation components
|   |-- create/form.tsx, edit/form.tsx, view/form.tsx  # thin wrappers around PopupForm
|   `-- view/history.tsx                # audit history table
|-- t&c/                                # 11 files
|   |-- t&c.content.tsx                 # list: URL-backed query state (useQueryState), TNC_CREATE-gated create button
|   |-- components/{preview-content,preview-url}.tsx  # preview modals
|   |-- create/{create-tandc,form}.tsx  # create body + shell
|   |-- edit/{edit-tandc,form}.tsx      # edit AND new-version body (same component, different route) + shell
|   |-- options/options.ts              # contentTypeOptions, consumed by a shared search form (see §10)
|   `-- view/{form,history,view-tandc}.tsx  # view, version navigation, accept-history table
`-- t&c-place/                          # 13 files
    |-- t&c-place-list.content.tsx      # list: URL-backed query state, NO permission checks (§9, §13)
    |-- constants.ts                    # ContentTandCPlaceTabs enum
    |-- components/preview-content.tsx  # preview; contains a console.log leftover (§13)
    |-- components/tandc-config-content.tsx  # config body, Form.useForm<TncsType>
    |-- create/{create-tandc-place,form}.tsx  # create body + shell
    |-- edit/{edit-tandc-place,form}.tsx      # edit body + shell
    |-- options/options.ts              # displayLocationOptions, consumed by a shared search form (see §10)
    `-- view/{form,history,history-accept,view-tandc-place}.tsx  # view, "updated" audit tab, "accept" audit tab
```

No `services/` folder in any contents submodule (`advertisement-service.content.tsx` is a placeholder page, not a service, despite its name — confirmed by the subagent reading its 3-line body). No `.module.scss`/`.css` anywhere in the module (re-confirmed this session). Zero Zod, zero `react-hook-form` imports module-wide (re-confirmed this session: `grep -rln "from 'zod'\|react-hook-form" src/modules/contents/` — no match).

## 4. Main runtime flows

See [`BANNER.md`](BANNER.md) §4 for banner's flows (create/edit with canvas-merge and upload, drag-priority, the live simulation modal).

### Flow A — popup create/edit and drag-priority

(Per the subagent's read; the double-notification half of this flow was independently re-verified by this session, §13)

1. Create (`POPUP_SETTING_CREATE`-gated, `list.tsx:364`) and edit both render `PopupForm.tsx` (`FormLayout` with General + History tabs). `PopupGeneral.tsx:225` explicitly calls `form.validateFields()` before building the payload (trim name, format dates, null-coalesce optional fields, gate `maxPerDay` on `frequency`) and dispatching `createPopup`/`updatePopup`.
2. **Update sends an optimistic-concurrency token:** `updatedDate: detail.updatedDate` is included in the update payload; `popup.middleware.ts`'s shared rejection matcher (`isAnyOf(changePopupPriority.rejected, changePopupStatus.rejected, updatePopup.rejected)`) suppresses the generic failure toast specifically when `updatePopup.rejected`'s payload is `POPUP_DATA_CHANGED` (confirmed this session by reading the matcher directly) — i.e. a stale-write conflict is detected and (presumably) surfaced differently, though this document did not trace where that specific case's own UI feedback comes from (`NEEDS-VERIFICATION`, §15).
3. **Drag-priority reorder** (`list.tsx`): `onDragEnd` recomputes priorities from the current page/size and stages them in local state; a confirm action dispatches `changePopupPriority({ channel, ids })` → `PUT popups/priorities`, sending **only the current page's IDs**, not the full list (`NEEDS-VERIFICATION` whether the backend expects this, §15). On success, a `listRevision` counter increments, triggering a refetch.
4. **Confirmed double notification on priority-save failure (directly re-verified this session):** `changePopupPriority.rejected` is caught by the middleware's shared matcher and dispatches a `setNotification` toast (`MESSAGE.UPDATE_FAIL`). Independently, `list.tsx` also renders its own inline `<Alert type='error' message={priorityError} showIcon />` for the same failure path — two separate user-visible failure indicators for one rejected action, the exact "multiple layers producing the same user-visible error notification" risk pattern named in `.claude/ARCHITECTURE.md` §3.

### Flow B — T&C create, edit, and versioning

(Per the subagent's read, not independently re-traced line-by-line by this session beyond the route/permission facts in §2)

1. Create dispatches `createContentTandC`; on success the middleware navigates to `PageURLs.ofTAndC()`.
2. **Versioning reuses the edit component and route** (§2): submitting the `create-new-version/:id` route's form (rendered by `EditTAndC`, the same component as a normal edit) dispatches `createContentTandCVersion` rather than a plain update — the same UI, two different outcomes depending on which route invoked it.
3. A "copy" prefill path exists (`getContentTandCCopy`, invoked from `edit-tandc.tsx`), separate from versioning — this document did not trace the UI trigger that distinguishes "edit", "new version", and "copy" from each other (`NEEDS-VERIFICATION`, §15, since this could affect which permission gates which action in practice).

### Flow C — T&C-place and its two "history" tabs

(Per the subagent's read; the zero-permission-check finding was independently re-verified by this session, §9/§13)

1. List, create, edit, view follow the same URL-state-backed, Redux-owned shape as T&C (§5).
2. **The "updated history" tab is not this submodule's own history** — `t&c-place/view/history.tsx` dispatches a Products-domain thunk, `getListUpdatedHistories` (`src/redux/slices/product-industry.slice.ts`), filtered to this resource — the same shared-slice-reuse pattern `notifications`' Settings history tab already uses against the same Products slice (`docs/modules/notifications/OVERVIEW.md` §4 Flow B, §10, §13). This module adds a second confirmed consumer of that same shared, Products-owned slice state.
3. **The "accept history" tab is genuinely this submodule's own**, via `getListAcceptHistories` → `GET eula/{id}/accept/history`, rendering timestamp/account/device/accepted-content columns — LIKELY a customer-acceptance audit log based on column semantics, not confirmed against a backend contract (`NEEDS-VERIFICATION`, §0/§15). `t&c/`'s own accept-history tab (`term-and-condition/{id}/accept/history`) is the same concept for the T&C resource itself.
4. **Confirmed permission gap, directly re-verified this session:** `t&c-place-list.content.tsx` has **zero** `hasPermission` calls (`grep -c "hasPermission" "t&c-place/t&c-place-list.content.tsx"` = 0). Its "Tạo mới" ("Create new") button (`:195`, rendered unconditionally whenever the filter is empty) is not gated by `TNC_DISPLAY_LOCATION_CREATE` — unlike every other create button in this module (banner, popup, and `t&c/` all gate their create buttons with `hasPermission`). A user without `TNC_DISPLAY_LOCATION_CREATE` sees and can click the button, then is blocked only by the route guard on the `create` sub-route — a dead-click UX gap, not a security gap, since the route itself is still correctly gated (§9, §13).

## 5. State ownership

| State | Owner | Registered? |
| --- | --- | --- |
| Popup list/detail/priority/status/history | Redux `popupSlice` (`src/redux/slices/popup.slice.ts`, name `'popup-settings'`), 11 thunks | `src/redux/slices.ts:80`; middleware `configurePopupManagementMiddleware` registered `src/redux/store.ts:82` (per the subagent, consistent with every endpoint having a matching thunk, 11/11) |
| T&C list/detail/copy/create/version/accept-history | Redux `contentTandCSlice` (`tandc.slice.ts`, name `'content-tandc'`), 6 thunks | `slices.ts:62`; middleware `configureContentTandCMiddleware` registered `store.ts:67` |
| T&C-place list/detail/create/edit/accept-history | Redux `tandcPlaceSlice` (`tandc-place-list.slice.ts`, name `'tandc-place'`), 5 thunks | `slices.ts:63`; middleware `configureTandCPlaceMiddleware` registered `store.ts:68` |
| T&C-place "updated history" | **Not this module's own state** — Products-domain `product-industry.slice.ts` (`getListUpdatedHistories`/`watchListUpdatedHistory`), shared with Products' own history screens (§4 Flow C, §10, §13) | Owned and registered by Products, not this module |
| Banner (list/detail/priority/status/history/simulation) | See `BANNER.md` §5 — includes this module's one TanStack Query consumer and a confirmed dual-owner finding | — |
| List page/filter/sort/page, T&C and T&C-place | **URL state via `useQueryState()`** (`t&c/t&c.content.tsx:43`, `t&c-place/t&c-place-list.content.tsx:37`) — this is the `.claude/rules/04-state-management.md`-preferred pattern for shareable/deep-linkable list state, not the global `pageParam` Redux slice other modules (`bank-list`, `order`, `notifications`) use | — |
| List page state, popup | Local `useState` (per the subagent's read; this document did not independently confirm the absence of `useQueryState`/`useSearchParams`, `NEEDS-VERIFICATION`, §15) | — |
| 12 `Form.useForm` instances across create/view/edit bodies (popup, t&c, t&c-place) | AntD `Form`/`FormInstance` | One instance per flow, consistent with `.claude/rules/05-form.md` |
| Drag-reorder staging (popup list) | Local `useState`, committed to Redux only on confirm | — |

Two state-ownership observations worth naming: (1) **`t&c/` and `t&c-place/` use URL state for list parameters, while `bank-list`, `order`, and `notifications` all use the global `pageParam` Redux slice** — this is the better-aligned-with-target pattern of the two, not a defect in either direction, and this document records the difference rather than treating one as wrong. (2) **No TanStack Query usage in `popup/`, `t&c/`, or `t&c-place/`** (confirmed, `grep -rl "@tanstack/react-query"` scoped to each returns no match) — all three remain fully Redux-owned, the correct `.claude/rules/04-state-management.md` "existing server data already owned by Redux" classification, not a gap.

## 6. API boundaries

No feature-local `services/` folder anywhere in this module (§3). All four Redux slices call `apiFetcher` directly inside their thunks — `LEGACY-COMPATIBILITY`, consistent with every endpoint-heavy slice predating the service-location convention.

- **Popup** (`popup.slice.ts`): `GET popups` (list), `GET channels/all`, `GET {paths[type]}/select`, `PUT popups/priorities`, `GET popups/{id}`, `GET redirect-types/all`, `GET redirect-details/all`, `POST popups`, `PUT popups/{id}`, `PUT popups/status`, `GET popups/{id}/history` — 11 endpoints, matching the slice's 11 thunks.
- **T&C** (`tandc.slice.ts`): `term-and-condition` (list/create), `/{id}` (detail), `/{id}/copy`, `/{id}/version`, `/{id}/accept/history` — 6 thunks, paths confirmed, individual HTTP verbs for the list/detail pair not independently re-read by this session.
- **T&C-place** (`tandc-place-list.slice.ts`): `GET eula` (list), `GET eula/{id}` (detail), `POST eula` (create), `eula/{id}` (edit, verb not independently re-read), `GET eula/{id}/accept/history` — 5 thunks.
- **Banner**: see `BANNER.md` §6, including this module's only direct-`apiFetcher`-from-component calls (file upload) and its one real `src/services/contents/` file.
- **DTOs are typed-only, no runtime validation anywhere in the module** (§3) — per `.claude/rules/03-api-service.md` `## Contracts and errors`, the default boundary assumption for stable CRUD, not flagged as a gap.
- Errors and navigation-on-success are owned by each submodule's listener middleware, not by components — consistent with `.claude/ARCHITECTURE.md` §4 principle 9's "listener middleware owns workflow notifications" direction, with the one confirmed exception already noted in §4 Flow A (popup's double notification, which is specifically about one failure case producing two independent indicators, not about the wrong layer owning the toast).

## 7. Forms and validation

- `Form.useForm` call sites outside `banner/` (12 total module-wide per the subagent, confirmed by this session's own cross-check of the grep methodology used elsewhere in this template): `t&c/{edit/edit-tandc,view/view-tandc,create/create-tandc}.tsx`, `popup/{list,components/PopupGeneral}.tsx`, `t&c-place/{edit/edit-tandc-place,components/tandc-config-content,view/view-tandc-place,create/create-tandc-place}.tsx`, plus banner's own sites (`BANNER.md` §7).
- `rules={` sites outside banner (per the subagent, using the correct `grep -rln "rules={"` pattern rather than a bare-word grep that would over-include prose): `t&c/{create/create-tandc,edit/edit-tandc}.tsx`, `popup/components/PopupGeneral.tsx`, `t&c-place/{create/create-tandc-place,edit/edit-tandc-place,components/tandc-config-content}.tsx`.
- **Explicit validation execution is inconsistent across submodules:** `popup/components/PopupGeneral.tsx:225` explicitly calls `form.validateFields()` before building its payload. Whether `t&c/` and `t&c-place/`'s submit paths do the same was not independently confirmed by either the subagent or this session (`NEEDS-VERIFICATION`, §15) — this matters because AntD's own `onFinish` does not automatically guarantee `rules` were checked outside the standard submit button flow.
- No Zod, no `react-hook-form` anywhere in the module (§3).
- `FormLayout`/`FormRef`/`useFormImperativeHandle` (`@/hooks/form.hook`) are used across 15 files module-wide (per the subagent) — every create/view/edit tab tree in this module uses the shared step/tab orchestration contract, the same pattern `notifications` uses throughout.

## 8. Types and DTO organization

- **One real feature-local module with named exports:** `src/types/banner.ts` (247 lines, 20 exports, a genuine ES module, not ambient) — see `BANNER.md` §8.
- **The other three submodules use ambient global `.d.ts` files with zero exports:** `src/types/contentTandC.d.ts` (67 lines), `src/types/popup.d.ts` (81 lines), `src/types/t&c-place.d.ts` (46 lines) — all `legacy-compatible`, matching the repository's broad legacy pattern (`notifications`, `order`, etc. all use the same ambient-global shape). `t&c-place`'s ambient types in particular are consumed by 5+ files with **zero `import` statements** (confirmed by the subagent's grep for each) — ambient global types are available without an explicit import, which is the normal (if not target-direction) behavior for this kind of declaration, not a defect specific to this module.
- No mapper layer as a separate file anywhere outside banner; response-to-form and form-to-request mapping is inline in each create/edit/view body (per the subagent).
- Three legacy enum declarations (`enum PopupManagementTabs`, `t&c-place/constants.ts`'s `enum ContentTandCPlaceTabs`, plus banner's own `enum BannerManagementTabs` in `BANNER.md`) used as `FormLayout`'s `tabEnum=` prop — `legacy-compatible`, predates `.claude/rules/02-typescript.md`'s enum prohibition, not something this document treats as authorization to migrate.

## 9. Permissions

This module (excluding `banner/`, covered in `BANNER.md` §9) references **9** of the module's 12 total `PERMISSIONS.*` constants (`TNC_{VIEW,CREATE,EDIT}`, `TNC_DISPLAY_LOCATION_{VIEW,CREATE,EDIT}`, `POPUP_SETTING_{VIEW,CREATE,EDIT}`), defined at `src/constants/permission.constant.ts:266-283`. **No `_DELETE` constant exists for any of the four families in this module** (T&C, T&C-place, banner, popup) — confirmed by reading the constant block directly; consistent with no delete action existing in any list/view file found by the subagent.

- **Every route-level and component-level permission check in this module (banner included) is a single-element array — confirmed, no OR arrays anywhere in `src/modules/contents/`.** This differs from `notifications` (8-member OR arrays throughout) and `order` (2-member OR arrays) — a module-level pattern worth noting, not a defect: `contents`' four resources each have exactly one relevant backend segment/entity type, so there is no multi-option OR gate to express.
- **Confirmed permission gap, directly re-verified this session (§4 Flow C):** `t&c-place/t&c-place-list.content.tsx` has zero `hasPermission` calls — its create button is unconditional while the route it navigates to is correctly gated by `TNC_DISPLAY_LOCATION_CREATE`. Every other create button in this module (`t&c/t&c.content.tsx:182,215`, `popup/list.tsx:364`, and banner's, `BANNER.md` §9) is `hasPermission`-gated to match its own route. This is a UI-consistency gap (dead click, not unauthorized access), unlike `order`'s write-action gap (`docs/modules/order/LOAN-ORDER-LIST.md` §9), which is a genuine authorization gap.
- **Permission-check kind, per the subagent's site-by-site read (not independently re-walked in full by this session beyond the t&c-place list check above):** every `hasPermission` call found in `t&c/`, `t&c-place/`, and `popup/` passes a single-element array via `useHasPermission` — no OR array, no helper function, consistent with the route-level pattern.
- The three placeholder routes (`AdvertisementService`, `ContactInfo`, `FaqPage`) are `AuthGuard`-only with no `permissions` array — cosmetic today given their static-stub content, same observation `notifications` makes about its own placeholder routes.

## 10. Shared and cross-domain dependencies

Imported **by** this module (popup/t&c/t&c-place; see `BANNER.md` §10 for banner's own, more extensive set): ordinary shared-component reuse (`select`, `modal-content`, `input`, `forms/form-wrapper`, `switch`, `titles/form.title`, `table-date-time`, `pagination`, `button`, `date-picker`, `icons`, `safeHtml`, `titles/table.title`, `table-link`, plus the domain-specific `forms/search/{tandc,tandc-place}-searcher` forms), `@/hooks/{modal,form,auth,query-state}.hook`, `@/layouts/form.layout`, and ordinary shared constants/utils (`pagination.constant`, `message.constant`, `permission.constant`, `navigate`, `i18n`, `common`). One cross-domain import: `t&c-place/view/history.tsx` imports `convertFieldActionType` from `@/modules/products/configuration/industry-product/ultis.tsx` — the same utility `notifications`' history tab already imports from the same Products-internal file (`docs/modules/notifications/OVERVIEW.md` §10), now with a second confirmed consumer.

**Imported INTO other code FROM inside this module (the reverse direction) — real and specific, not hypothetical:**

- `src/components/forms/search/tandc-searcher.form.tsx` imports `contentTypeOptions` from `t&c/options/options.ts`; `src/components/forms/search/tandc-place-searcher.tsx` imports `displayLocationOptions` from `t&c-place/options/options.ts` — two shared search-form components depending on this module's feature-internal option lists, the same "discouraged direction" pattern named in `.claude/ARCHITECTURE.md` §5 that `notifications`' `loan-order-searcher.form.tsx`/`text-editor` dependencies already demonstrate.
- `src/redux/slices/banner.slice.ts:1` and `popup.slice.ts:1` import `PAGE_SIZES` from a contents constants file — a global Redux infrastructure file depending on a feature-internal constant, the same reverse-dependency direction already flagged for `notifications`' `notification-list.slice.ts` importing `NotificationFormValuesStore` from a feature component file (`docs/modules/notifications/OVERVIEW.md` §8).
- See `BANNER.md` §10 for banner's own (larger) set of reverse dependencies, including two different other modules (`system/splash-screen/`, `products/exclusive-touch/`) importing banner-internal constants and components.

## 11. Consumers

Direct: all 61 files as mapped in §3; routing via `pages.tsx`/`main.routes.tsx`/`form.routes.tsx`; menu via `menus.helper.ts` (§2). Cross-domain consumers of this module's own exports: `tandc-searcher.form.tsx`, `tandc-place-searcher.tsx` (§10), plus banner's own set (`BANNER.md` §11). Shared state consumer in the other direction: `t&c-place/view/history.tsx` reads a Products-owned slice (§4 Flow C, §10) — this module is a *consumer* of Products' state here, not the other way around.

## 12. Pattern classification

**Legacy-compatible core across popup/t&c/t&c-place, with one genuinely better-aligned pattern (URL list state) and a small number of concrete, source-confirmed gaps — nothing here is presented as authorization to change it (§14 still applies). See `BANNER.md` §12 for banner's own classification, including its one target-compatible Query usage.**

- **State ownership (`legacy-compatible`, correctly so):** all three resources (popup, T&C, T&C-place) remain fully Redux-owned — the `.claude/rules/04-state-management.md` "existing server data already owned by Redux" row, not a gap.
- **List-page URL state (`target-compatible`):** `t&c/` and `t&c-place/` use `useQueryState()` against the URL, matching `.claude/rules/04-state-management.md`'s stated preference for shareable/deep-linkable list state — unlike `bank-list`/`order`/`notifications`'s shared global `pageParam` Redux slice. Popup's own list-state mechanism was not independently confirmed (`NEEDS-VERIFICATION`, §5/§15).
- **Service location (`LEGACY-COMPATIBILITY`):** no feature-local service file anywhere in popup/t&c/t&c-place; all transport is direct `apiFetcher` calls inside Redux thunks.
- **Forms (`target-compatible`):** AntD `Form`/`FormInstance` only, no RHF, no Zod — consistent with `.claude/rules/05-form.md`.
- **Types (`legacy-compatible`):** ambient global `.d.ts` for three of the four submodules (§8).
- **Permissions (mostly consistent, one confirmed gap):** every check is a single-element array matching a 1:1 resource-to-permission-family shape; one submodule (`t&c-place/`'s list page) has an unconditional create button where every sibling submodule gates its equivalent button (§9).
- **One confirmed defect, not a pattern judgment:** popup's drag-priority failure produces two independent user-visible notifications for one event (§4 Flow A, §13).
- **One confirmed debug leftover:** `console.log(formValues)` in `t&c-place/components/preview-content.tsx:9`.

## 13. Technical risks

Ordered by decreasing consequence; each entry opens with a bold category label per the template.

1. **Reverse dependency from shared infrastructure into this module** (§10): `banner.slice.ts`/`popup.slice.ts` (global Redux) importing a contents-internal constant, and two shared search-form components importing feature-internal option lists — changing or removing any of these breaks code outside this module's own screens, not just this module's own pages. (Banner's own, larger version of this risk — involving two *other business modules* — is detailed in `BANNER.md` §13 item 1.)
2. **Permission gap on the T&C-place list's create button** (§4 Flow C, §9) — a dead-click UX gap (the route itself stays correctly gated), confirmed directly by this session, not merely reported by the subagent.
3. **Double notification on popup priority-save failure** (§4 Flow A, §13 pattern-classification note) — directly re-verified this session: the shared middleware matcher dispatches a toast while the list page independently renders its own `<Alert>` for the identical failure.
4. **Shared Products-domain Redux state reused a second time** (§4 Flow C, §10) — `t&c-place/`'s "updated history" tab is a second confirmed consumer (alongside `notifications`') of `product-industry.slice.ts`'s shared history state; the structural risk already documented for `notifications` (`docs/modules/notifications/OVERVIEW.md` §13 item 2) now has one more consumer to account for in any future change to that slice.
5. **Debug leftover:** `console.log(formValues)` at `t&c-place/components/preview-content.tsx:9`.
6. **Hardcoded route string for T&C versioning** (§2) — a real route with no `PageURLs` builder, so the literal path string is repeated at both of its two call sites rather than defined once.
7. **Versioning and plain editing share one component and one permission** (§2, §4 Flow B) — `create-new-version/:id` and a plain edit both render `EditTAndC` and both require `TNC_EDIT`; there is no way to grant "can create a new version" without also granting "can edit" or vice versa.
8. See `BANNER.md` §13 for banner's own, larger risk list (a confirmed dual-owner finding on `GET screen/all`, duplicated create/edit logic, heavy `any` usage, and more) — not duplicated here.

## 14. Areas to avoid touching

- `src/redux/slices/{popup,tandc,tandc-place-list}.slice.ts` and their middleware — each owns its own notification/navigation logic; the popup middleware's `POPUP_DATA_CHANGED` special-case and its shared rejection matcher (§4 Flow A) are easy to break by editing one of the three actions it watches without re-checking the other two.
- `t&c/options/options.ts` and `t&c-place/options/options.ts` — each has a confirmed outside-module consumer (the corresponding shared searcher form, §10); do not change their exported shape without auditing those two files.
- `src/redux/slices/{banner,popup}.slice.ts:1`'s import of `PAGE_SIZES` from contents constants (§10) — a small but real reverse dependency from global Redux infrastructure.
- `src/redux/slices/product-industry.slice.ts` — owned by Products, not this module; `t&c-place/view/history.tsx` is one of (at least) two confirmed consumers across two different modules (§4 Flow C, §10).
- `t&c/view/view-tandc.tsx:44`/`t&c/view/history.tsx:47`'s hardcoded versioning path string — fixing it to use a builder requires adding that builder first, not just editing the two call sites.
- See `BANNER.md` §14 for banner-specific areas to avoid.

## 15. Open questions

- `NEEDS-VERIFICATION`: backend meaning of "accept history" for both T&C and T&C-place (§4 Flow C, §0).
- `NEEDS-VERIFICATION`: whether `popups/priorities` expects the full list or only the current page's IDs, given the frontend sends only the current page's IDs (§4 Flow A).
- `NEEDS-VERIFICATION`: whether `t&c/`'s and `t&c-place/`'s create/edit submit paths explicitly run `form.validateFields()` the way `popup/components/PopupGeneral.tsx` confirmedly does (§7) — not independently traced for these two submodules.
- `NEEDS-VERIFICATION`: what distinguishes the UI triggers for T&C's "edit", "new version", and "copy" paths from each other (§4 Flow B) — all three were identified as existing, but their precise entry points were not individually traced.
- `NEEDS-VERIFICATION`: whether `popup/list.tsx`'s list-state mechanism is genuinely local `useState` (as the subagent reported) rather than URL state like its `t&c`/`t&c-place` siblings — not independently confirmed by this session.
- `NEEDS-TEAM-DECISION`: whether `t&c-place/`'s list create button should be gated by `hasPermission([PERMISSIONS.TNC_DISPLAY_LOCATION_CREATE])` to match every sibling submodule's equivalent button (§9, §13 item 2) — not resolved here.
- `NEEDS-TEAM-DECISION`: whether the three placeholder pages (`advertisement-service`, `contact-info`, `faq`) should gain real implementations and menu entries, or be removed along with their routes/`PageURLs` builders — not resolved here.
- See `BANNER.md` §15 for banner-specific open questions, including the confirmed `screen/all` dual-owner finding.
