# Notifications — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq`, clean tree (`git status --porcelain` empty).
- Date: 2026-11-04.
- Method: static source inspection only (`find`, `grep`, `Read` of the files cited below). No runtime, browser, auth, or backend verification was performed; nothing here proves actual request/response behavior.
- Scope: `src/modules/notifications/` (32 files, `find src/modules/notifications -type f | wc -l`), plus the parts of `src/routes/`, `src/redux/`, `src/helpers/menus.helper.ts`, `src/constants/permission.constant.ts`, and `src/types/` that this module uses or that use it.
- What could not be verified from source alone (label `NEEDS-VERIFICATION` throughout this document):
  - Actual backend contract shape/behavior for every endpoint in §6 — only the frontend call sites were read.
  - Whether `src/redux/slices/product-industry.slice.ts`'s history state can actually collide in practice between the Products "Industry" history tab and this module's `history.tsx` tab (both read/write the same global slice instance) — this is a structural risk, not something provably exercised from source alone.
  - Runtime correctness of the draft/final-submit payload mapping in the create/edit forms (§4), including date/timezone handling (`dayjs().utc()`), was not executed.
  - Whether the commented-out menu entries for the three placeholder pages (`general.notification.tsx`, `automatic.notification.tsx`, `setup.notification.tsx`) were intentionally disabled or are simply dead code.
  - Whether any backend contract matches the ambient ```src/types/notification-list.d.ts``` ```NotificationResponse```/```CreateNotification``` shapes exactly.

## 1. Responsibility

This module is the admin UI for configuring and sending in-app/push-style customer notifications over the "HPO" channel. It has two notification kinds, shown in the list UI as "Thông báo cài đặt" (`SETTINGS`) and "Thông báo tự động" (`AUTOMATIC`) (`src/modules/notifications/configuration/list-notification/list.tsx:205-208`):

- **Settings notifications** — manually authored, one-off or scheduled notices with title/content/banner/icon/device images, a CTA, and a target customer-segment + schedule.
- **Automatic notifications** — workflow-triggered notices tied to a business entity/event (order, contract, access-account, term-and-condition changes) rather than a manual send time.

Both kinds share one list page, a create/view/edit flow per kind, and (for Settings only) a history tab and a send-result tab. Three additional top-level files (`general.notification.tsx`, `automatic.notification.tsx`, `setup.notification.tsx`) are routed but are static placeholder stubs with no real implementation — see §2 and §3.

## 2. Entry points and routes

All 10 routes are lazy (`src/routes/pages.tsx:67-87`); there is no eager business page in this module.

| Route path | `pages.tsx` lazy export → import target | Route file : line | Guard / permissions (OR) | `PageURLs` key |
| --- | --- | --- | --- | --- |
| `notification/general` | `GeneralNotice` → `notifications/general.notification` | `main.routes.tsx:352` | `AuthGuard` only (`WithGuard`, no `permissions` array) | `ofGeneralNotification()` |
| `notification/automatic-notification` | `AutomaticNotice` → `notifications/automatic.notification` | `main.routes.tsx:353-356` | `AuthGuard` only | `ofAutomaticNotification()` |
| `notification/setup` | `SetupNotice` → `notifications/setup.notification` | `main.routes.tsx:357` | `AuthGuard` only | `ofSetupNotification()` |
| `notification/configuration/list` | `NotificationList` → `.../list-notification/list` | `main.routes.tsx:358-375` | `AuthGuard` + 8-permission OR array: `SETTING_NOTIFICATION_VIEW`, `AUTO_NOTIFICATION_VIEW_{USER,SYSTEM,TNC,CREDIT_CARD_APPLICATION,CASH_LOAN_APPLICATION,CREDIT_CARD_CONTRACT,CASH_LOAN_CONTRACT}` | `ofNotificationList()` |
| `notification/configuration/list/settings/create` | `CreateSettingNotification` → `.../create/settings/form` | `form.routes.tsx:781-790` | `AuthGuard` + `[SETTING_NOTIFICATION_CREATE]` | none — hardcoded template-literal path at the call site |
| `notification/configuration/list/automatic/create` | `CreateAutomaticNotification` → `.../create/automatic/form` | `form.routes.tsx:791-808` | `AuthGuard` + 7-permission OR array: `AUTO_NOTIFICATION_CREATE_{USER,SYSTEM,TNC,CREDIT_CARD_APPLICATION,CASH_LOAN_APPLICATION,CREDIT_CARD_CONTRACT,CASH_LOAN_CONTRACT}` | none |
| `notification/configuration/list/automatic/view/:id` | `ViewAutomaticNotification` → `.../view/automatic/form` | `form.routes.tsx:809-826` | `AuthGuard` + 7-permission `AUTO_NOTIFICATION_VIEW_*` OR array (same shape as create) | none |
| `notification/configuration/list/settings/view/:id` | `ViewSettingsNotification` → `.../view/settings/form` | `form.routes.tsx:827-836` | `AuthGuard` + `[SETTING_NOTIFICATION_VIEW]` | none |
| `notification/configuration/list/settings/edit/:id` | `EditSettingsNotification` → `.../edit/settings/form` | `form.routes.tsx:837-846` | `AuthGuard` + `[SETTING_NOTIFICATION_EDIT]` | none |
| `notification/configuration/list/automatic/edit/:id` | `EditAutomaticNotification` → `.../edit/automatic/form` | `form.routes.tsx:847-864` | `AuthGuard` + 7-permission `AUTO_NOTIFICATION_EDIT_*` OR array | none |

CONFIRMED by `grep -oE "<Route($|[ >/])" src/routes/main.routes.tsx src/routes/form.routes.tsx` scoped to the lines above — each path produces exactly one `<Route>` element; no duplicate/overlapping notification path exists in either file.

**`PageURLs` gap (CONFIRMED):** `src/utils/navigate.ts:239-251` defines builders only for the 4 top-level/list routes. The 6 create/view/edit sub-routes have no `PageURLs` builder; every in-module `navigate(...)` call to them uses a hardcoded template-literal string, e.g. `` navigate(`/notification/configuration/list/settings/edit/${id}?tab=${NotificationTabs.GeneralInfo}`) `` (`view/settings/general-info.tsx:76`, and 6 further call sites across `view/settings/*.tsx` and `edit/*/form.tsx`, `view/automatic/view-notification-automatic.tsx:220`).

**Menu (CONFIRMED, `src/helpers/menus.helper.ts:477-516`):** the parent menu item "Quản trị thông báo" links to `PageURLs.ofGeneralNotification()` — i.e. the parent menu entry's own link target is one of the placeholder stubs (§3). It has exactly one visible child menu entry, "Danh sách thông báo" → `ofNotificationList()`, gated by the same 8-permission OR array as the route. Three child menu entries for the placeholder pages exist in source but are commented out (`menus.helper.ts:484-498`) — they are not rendered.

## 3. Directory map

`find src/modules/notifications -type f | sort` → 32 files.

```text
src/modules/notifications/
|-- general.notification.tsx            # placeholder stub, 3 lines
|-- automatic.notification.tsx           # placeholder stub, 3 lines
|-- setup.notification.tsx               # placeholder stub, 3 lines
`-- configuration/list-notification/     # 29 files — the real module
    |-- list.tsx                         # list page: search/sort/paginate, batch activate/deactivate, create-type picker
    |-- constant.ts                      # NotificationTabs, NotificationStatus, CLIENT_HPO/CLIENT_CHAM_VAY, display/href/event option lists
    |-- utils.ts                         # HTML template-variable extraction/stripping, product/product-group lookups, misc mappers
    |-- hooks/
    |   `-- use-workflow-options.ts      # useWorkflowOptions / useWorkflowAllOptions — hand-rolled useState/useEffect, NOT TanStack Query (see §5)
    |-- services/
    |   `-- workflow.service.ts          # LEGACY-COMPATIBILITY feature-local service; window.apiFetcher calls + in-module promise cache (see §6)
    |-- components/
    |   |-- display-condition-fields.tsx
    |   |-- notification-config-content.tsx
    |   |-- order-source-fields.tsx
    |   `-- preview-content-notification.tsx
    |-- create/
    |   |-- settings/
    |   |   |-- form.tsx                 # FormLayout, 3-tab Settings create flow
    |   |   |-- general-info.tsx
    |   |   |-- content-cta.tsx
    |   |   `-- customersegment-schedule.tsx
    |   `-- automatic/
    |       |-- form.tsx                 # FormLayout wrapper
    |       `-- create-notification-automatic.tsx  # Automatic create flow body
    |-- view/
    |   |-- settings/
    |   |   |-- form.tsx                 # FormLayout, 5-tab Settings view flow
    |   |   |-- general-info.tsx
    |   |   |-- content-cta.tsx
    |   |   |-- customersegment-schedule.tsx
    |   |   |-- history.tsx              # reuses products' product-industry.slice (see §10)
    |   |   `-- result-noti.tsx          # send-result/job-execution tab, own slice state
    |   `-- automatic/
    |       |-- form.tsx
    |       `-- view-notification-automatic.tsx
    `-- edit/
        |-- settings/
        |   |-- form.tsx
        |   |-- general-info.tsx
        |   |-- content-cta.tsx
        |   `-- customersegment-schedule.tsx
        `-- automatic/
            |-- form.tsx
            `-- edit-notification-automatic.tsx
```

Subfolder file counts (CONFIRMED by the `find` run above): `components/` 4, `create/settings/` 4, `create/automatic/` 2, `view/settings/` 6, `view/automatic/` 2, `edit/settings/` 4, `edit/automatic/` 2, `hooks/` 1, `services/` 1, plus 3 loose files directly under `list-notification/` (`list.tsx`, `constant.ts`, `utils.ts`) = 29, plus the 3 top-level placeholder files = 32.

## 4. Main runtime flows

### Flow A — create a Settings notification

`create/settings/form.tsx:78-390` (CONFIRMED, fully read):

1. Entry: `CreateSettingNotification` page (route in §2) renders `Form` (`create/settings/form.tsx`).
2. One shared `AntForm.useForm<NotificationFormValues>()` instance (line 81) is passed down as a prop to three tab components rendered by `FormLayout`'s `sidebar` (`GeneralInfo`, `ContentCta`, `CustomerSegmentSchedule`; lines 306-360) — all three tabs write into the same form instance, not three independent forms.
3. Each tab reports its own validity via an `isFormValid` callback into local `formValid` state (lines 93-97); `FormLayout`'s `disableSave` is derived from `isAllFormValid(formValid, activeId)` (`@/utils/form`, line 376).
4. On submit (`handleSubmit`, lines 216-304) or draft save (`handleSaveDraft`, lines 123-214): reads `form.getFieldsValue(true)`, strips/cleans the rich-text HTML content (`extractVariableKeysFromHTMLAndStripTags` + `supportCleanHTMLToPlainText`, from `../../utils`), resolves a CTA target product/product-group's `productLineCode` by reading `watchProductGroups`/`watchProducts` from the **cross-domain** `@/redux/slices/common.slice.ts` (lines 83-84, 138-157, 231-250 — a real cross-domain dependency, see §10), converts schedule dates with `dayjs(...).utc().toISOString()`, then `dispatch(createNotification({ formData, isDraft }))`.
5. `createNotification` (`src/redux/slices/notification-list.slice.ts:108-126`) calls `apiFetcher.post('api/admin/portal/v1/notifications/draft'` or `'.../create'`, formData)` depending on `isDraft`, and sets the slice's single `loading` flag.
6. No listener middleware exists for this slice (§5); `handleCancel` (lines 101-121) dispatches `setNotification` (the global toast slice, `@/redux/slices/notification.slice.ts`) directly from the component to show a toast, and `navigate(PageURLs.ofNotificationList())`. The actual submit/save-draft paths do not call `setNotification` in this file — toast/navigation-on-success behavior for `handleSubmit`/`handleSaveDraft` was **NOT found in this file** (`NEEDS-VERIFICATION`: confirm whether `FormLayout` itself provides that feedback, or whether it's genuinely absent).

### Flow B — view a Settings notification: tabs with two different state owners

`view/settings/form.tsx:67-220+` (CONFIRMED):

1. Entry: `ViewSettingsNotification` page renders `Form`, which on mount dispatches `getNotification(Number(id))` (`notification-list.slice.ts:61-81`, `GET /notifications/{id}/notificationById`) via `initNotification` (lines 83-89), and redirects to `PageURLs.of404()` if the returned `type !== 'SETTINGS'` (cross-type guard against navigating a Settings URL to an Automatic record, or vice versa).
2. Assembles 5 tabs: `GeneralInfo`, `ContentCta`, `CustomerSegmentSchedule` (all read `watchNotification` from `notification-list.slice.ts`), `History`, and `ResultNoti`.
3. **`History` tab** (`view/settings/history.tsx:1-124`, fully read) does **not** use this module's own slice. It dispatches `getListUpdatedHistories`/reads `watchListUpdatedHistory`/`watchIndustryPagination` from `@/redux/slices/product-industry.slice` (lines 6-10) — a Products-module-owned slice, filtered with `entityType: 'NOTIFICATION'` (line 52) — and renders `convertFieldActionType` imported from `@/modules/products/configuration/industry-product/ultis.tsx` (line 18). This is a real, confirmed cross-domain dependency on a different module's Redux slice and util, not a naming coincidence (see §10, §13).
4. **`ResultNoti` tab** (`view/settings/result-noti.tsx:1-157`, fully read) correctly uses this module's own slice: `getResultNotificationList`/`watchResultNotificationList`/`watchPaginationResultNotification`/`resetResultNotificationList` from `notification-list.slice.ts`, calling `GET /notifications/{id}/job-execution-info`, and resets that slice's result list on unmount (line 104).

### Flow C — batch activate/deactivate from the list

`list.tsx:114-161, 380-387` (CONFIRMED): user selects rows (checkbox logic in `rowSelection`/`onSelectChange`, lines 84-112, which blocks a mixed-status "select all" via `isMixedStatus`), clicks the `TableSummary` action button, which opens a confirmation modal (optionally collecting a disable reason through the shared `FormReasonDisable` component) and dispatches `updateActiveState({ id, status, reason })` → `notification-list.slice.ts:197-228` → `PUT /notifications/{status}` with `{ ids, reason }` in the body → on success, the thunk patches matching rows in `state.notificationList` in place (optimistic-style local patch from the request echo, not a refetch).

## 5. State ownership

| State | Owner | Registered? |
| --- | --- | --- |
| List/detail/draft/history-result/entity-type data for this module | Redux slice `notificationListSlice` (`src/redux/slices/notification-list.slice.ts`), name `'notification-list'` | Registered `src/redux/slices.ts:17,61`. **No middleware is registered for it** — `src/redux/store.ts` has no `configureNotificationListMiddleware` import; `grep -n -i notification src/redux/store.ts` finds only `configureNotificationMiddleware` (line 18/64), which belongs to the unrelated global toast slice below. Components dispatch `setNotification` directly for toasts (e.g. `create/settings/form.tsx:107-112`) rather than going through a listener. |
| Global toast/snackbar message | Redux slice `notificationSlice` (`src/redux/slices/notification.slice.ts`), name `'notification'` | Registered `src/redux/slices.ts:2,44`; its middleware `configureNotificationMiddleware` is registered `src/redux/store.ts:18,64`. This slice is **not owned by this module** — it is the application-wide toast mechanism, read by `src/providers/notification.provider.tsx` and written to by 6 files inside this module (`create/settings/form.tsx`, `create/automatic/*`, `edit/*/form.tsx`, `view/*/form.tsx`) the same way any other module would write to it. |
| 15 `Form.useForm` instances across create/view/edit tab trees | AntD `Form`/`FormInstance` | One shared form instance per create/edit flow, passed as a prop into sibling tab components (confirmed in `create/settings/form.tsx`, `view/settings/form.tsx`) |
| List page filter/sort/page | URL state via `useQueryState()` (`list.tsx:36,53`) | — |
| Workflow dropdown options (`useWorkflowOptions`/`useWorkflowAllOptions`) | Local React state (`useState`+`useEffect` in `hooks/use-workflow-options.ts`), backed by a module-level promise/value cache in `services/workflow.service.ts` (`workflowOptionsCache`/`workflowOptionsRequest`, lines 90-93) | Not Redux, not Query — a hand-rolled cache |

Two items the prior inventory (`docs/reports/2026-11-04/module-docs-inventory.md:162,184`) flagged as open, settled here from source:

- **`notificationListSlice` ownership — CONFIRMED, owned by this module.** Every reducer/thunk in `notification-list.slice.ts` (`getNotificationList`, `getNotification`, `createNotification`, `updateNotification`, `updateNotificationStatus`, `updateActiveState`, `getResultNotificationList`, `deleteNotificationDraft`, `getEntityTypeNotifications`, `getTemplateVariables`) calls an `api/admin/portal/v1/notifications/*` or `.../workflows` endpoint and is dispatched only from files under `src/modules/notifications/` (`grep -rn "notification-list.slice" src/` finds no consumer outside this module and `src/redux/slices.ts`/`store.ts`). It has a naming collision, not a consumption relationship, with the global toast slice: `notification-list.slice.ts` defines its own **locally-scoped** `watchNotification` selector (line 312, reading its own `state.notification` detail field) that is unrelated to `notificationSlice.watchNotification` (the toast message) in `notification.slice.ts` — same selector name, two different slices, two different meanings. `NEEDS-VERIFICATION`: whether this duplicate name was intentional or accidental; it is a maintenance risk (see §13).
- **`configuration/list-notification/hooks/` has zero TanStack Query usage — CONFIRMED.** `grep -n "@tanstack/react-query" src/modules/notifications/configuration/list-notification/hooks/use-workflow-options.ts` returns no match. The file's only two exports (`useWorkflowOptions`, `useWorkflowAllOptions`) are plain `useState`/`useEffect` wrappers around the promise-returning functions in `services/workflow.service.ts` (read in full, §3/§6). The directory name does not imply Query usage anywhere in this module; this module has 0 files importing `@tanstack/react-query` module-wide (`grep -rl "@tanstack/react-query" src/modules/notifications/` — no match).

## 6. API boundaries

- **`services/workflow.service.ts`** (`src/modules/notifications/configuration/list-notification/services/workflow.service.ts`, read in full) — a feature-local service, `LEGACY-COMPATIBILITY` per `.claude/rules/03-api-service.md` `## Service location` (the target location for a new/rewritten service would be `src/services/notifications/`, which does not exist — `find src/services -maxdepth 1 -type d` lists only `contents/`, `products/`, `users/`). It calls `window.apiFetcher.get('api/admin/portal/v1/workflows', { query: { channel: 'HPO' } })` and `window.apiFetcher.get('api/admin/portal/v1/workflows/all')`, each with its own in-module promise/value cache (`workflowOptionsCache`/`workflowAllOptionsCache`, lines 90-93) to dedupe concurrent calls and avoid refetching — a non-standard pattern (neither Redux nor Query's own caching).
- **`src/redux/slices/notification-list.slice.ts`** issues every other endpoint directly via `apiFetcher.{get,post,put,delete}` inside its `asyncThunk`s (no separate service layer for these):
  - `GET api/admin/portal/v1/notifications/search` (list)
  - `GET api/admin/portal/v1/notifications/{id}/notificationById` (detail)
  - `GET api/admin/portal/v1/notifications/template-variables`
  - `POST api/admin/portal/v1/notifications/draft` or `.../create` (create, branched on `isDraft`)
  - `PUT api/admin/portal/v1/notifications/{id}/draft` or `.../{id}/notificationById` (update, branched on `isDraft`)
  - `PUT api/admin/portal/v1/notifications/{id}/status` (single-item status change)
  - `PUT api/admin/portal/v1/notifications/{status}` with `{ ids, reason }` body (batch activate/deactivate from the list)
  - `GET api/admin/portal/v1/notifications/{id}/job-execution-info` (send result)
  - `DELETE api/admin/portal/v1/notifications/{id}/notificationById` (delete a draft)
  - `GET api/admin/portal/v1/notifications/automatic-entities` (entity-type options for Automatic notifications)
- No direct `apiFetcher`/`window.apiFetcher` calls exist inside any component file in this module (`grep -rln apiFetcher src/modules/notifications/` returns only `services/workflow.service.ts`) — all other transport goes through the slice.
- **DTOs are typed-only, no runtime validation.** No Zod schema and no hand-written runtime guard exists anywhere in this module (`grep -rl "zod" src/modules/notifications/` — no match). Request/response shapes are the ambient global types in `src/types/notification-list.d.ts` (`NotificationResponse`, `CreateNotification`, `UpdateNotificationStatus`, etc.) and `src/types/Filter.d.ts` (`NotificationListFilter`). Per `.claude/rules/03-api-service.md` `## Contracts and errors`, an absent Zod/parse call on these stable, known CRUD-shaped endpoints is the default boundary assumption, not a validation gap — this document does not flag it as one.

## 7. Forms and validation

- 15 `Form.useForm` call sites (`grep -rc "Form.useForm" src/modules/notifications/`), all Ant Design. No React Hook Form, no Zod anywhere in this module.
- `FormLayout`/`FormRef` (`@/layouts/form.layout`, `@/types/form`, `@/hooks/form.hook`) are used in 20 of the module's files — every create/view/edit tab tree uses the shared step/tab orchestration contract, with per-tab `forwardRef`+`useFormImperativeHandle` wiring (e.g. `history.tsx:22,90`, `result-noti.tsx:23,108`).
- Per-tab validity is tracked with local `formValid` object state reported up by each tab's `isFormValid` callback (e.g. `create/settings/form.tsx:93-97,317-319,334-336,351-356`), not with AntD's own validation-state APIs directly at the container level.
- Validation itself is entirely AntD `rules` (field-level). The bare word `rules` also matches prose and unrelated identifiers, so this is re-derived with `grep -rln "rules={" src/modules/notifications/`, which identifies actual `Form.Item rules={...}` usage: **10 files**, all under `create/` and `edit/` (`edit/settings/{general-info,content-cta,customersegment-schedule}.tsx`, `edit/automatic/edit-notification-automatic.tsx`, `components/{notification-config-content,order-source-fields}.tsx`, `create/settings/{general-info,content-cta,customersegment-schedule}.tsx`, `create/automatic/create-notification-automatic.tsx`), **78 occurrences total** (`grep -rho "rules={" src/modules/notifications/ | wc -l`). The `view/` tab files have **zero** `rules={` occurrences (`grep -rl "rules={" src/modules/notifications/configuration/list-notification/view/` returns no match) — they are read-only display, not editable forms, so no field validation applies there. This corrects an earlier draft of this document, which cited the bare-word grep and claimed `rules` usage "across the `create`/`edit`/`view` tab files"; `view/` was included in error. There is no Zod schema to execute at submission in any of these files.

## 8. Types and DTO organization

- The stable request/response contracts (`NotificationResponse`, `CreateNotification`, `NoticeSummary`/`NoticeContent`/`NoticeCTA`/`NoticeSchedule`, `UpdateNotificationStatus`, `TemplateVariable`, `EntityTypeNotification`, `ResultNotiType`, plus the `NotificationList`/`NotificationType`/`NotificationChannel`/etc. unions) live as **ambient globals** in `src/types/notification-list.d.ts` (254 lines, read in full) and `src/types/Filter.d.ts:168` (`NotificationListFilter`) — not feature-local `types/`. This module has no `types/` folder.
- Form-shape types (`NotificationFormValues`) are feature-local, defined per flow rather than shared: `create/settings/form.tsx:27-77` and `view/settings/form.tsx:28-65` each declare their own `NotificationFormValues` with slightly different shapes (the create variant's `noticeSummary` includes `isDraft`; the view variant's does not). `edit/settings/form.tsx:94` derives `NotificationFormValuesStore` as `Omit<NotificationFormValues, 'noticeSchedule'> & {...}`. These three are not unified into one shared feature type.
- Feature-local constants and option lists (`NotificationTabs`, `NotificationStatus`, `DisplayTypeValue`, `CLIENT_HPO`, `CLIENT_CHAM_VAY`, and the various option arrays for href/screen/entity/event/method/status) live in `configuration/list-notification/constant.ts` (291 lines).
- **Reverse dependency (CONFIRMED, notable):** the global infrastructure file `src/redux/slices/notification-list.slice.ts:5` imports `NotificationFormValuesStore` — a type defined inside a feature component file, `src/modules/notifications/configuration/list-notification/edit/settings/form.tsx` — to type its own `dataNotificationUpdate` state field. This is backwards relative to the target direction in `.claude/ARCHITECTURE.md` §5 (feature code depends on infrastructure, not the reverse); flagged here, not changed.

## 9. Permissions

This module's permission scheme has **32** total constants: `SETTING_NOTIFICATION_{VIEW,CREATE,EDIT,DELETE}` (4) and `AUTO_NOTIFICATION_{VIEW,CREATE,EDIT,DELETE}_{USER,SYSTEM,TNC,CREDIT_CARD_APPLICATION,CASH_LOAN_APPLICATION,CREDIT_CARD_CONTRACT,CASH_LOAN_CONTRACT}` (4 × 7 = 28). Two different counts were derived and they disagree by one constant; the disagreement is fully explained by scope, not left open:

- **Command count, scoped to the module directory:** `grep -rhoE "PERMISSIONS\.[A-Z0-9_]+" src/modules/notifications/ | sort -u | wc -l` = **31**. This finds all 28 `AUTO_NOTIFICATION_*` constants plus only 3 of the 4 `SETTING_NOTIFICATION_*` constants (`CREATE`, `EDIT`, `DELETE`).
- **Hand-enumerated count, full scheme:** 4 + 28 = **32**. The constant missing from the module-scoped grep is `SETTING_NOTIFICATION_VIEW` — it is real (`src/constants/permission.constant.ts:207`, `'setting_notification:view'`) and does gate access to this module, but every reference to it sits outside `src/modules/notifications/`: the list route guard (`src/routes/main.routes.tsx:365`), the list sub-route guard (`src/routes/form.routes.tsx:833`), the menu entry (`src/helpers/menus.helper.ts:505`), and the shared `src/components/forms/search/notification-list-searcher.form.tsx:59,185`. `grep -rn "SETTING_NOTIFICATION_VIEW" src/` confirms these four sites and no site inside the module directory itself.

**Corrected accounting: 32 constants belong to this module's permission scheme; 31 of them are referenced from inside the module directory; the 32nd (`SETTING_NOTIFICATION_VIEW`) is enforced for this module only at the route/menu/shared-component layer.** This is settled, not `NEEDS-VERIFICATION`.

This module references more than ten permission constants and reuses the same multi-permission arrays across route, menu, and component layers, so per the template's table rule, recurring arrays are named once here and referred to by name elsewhere in this document (§2, §13, §15):

| Named group | Members | Enforced at — route | Enforced at — menu | Enforced at — component |
| --- | --- | --- | --- | --- |
| `SETTING-VIEW` | `SETTING_NOTIFICATION_VIEW` | `main.routes.tsx:365`, `form.routes.tsx:833` | `menus.helper.ts:505` | — |
| `SETTING-CREATE` | `SETTING_NOTIFICATION_CREATE` | `form.routes.tsx:787` | — | `list.tsx:216,339,369` (one arm of the create-button OR) |
| `SETTING-EDIT` | `SETTING_NOTIFICATION_EDIT` | `form.routes.tsx:843` | — | `list.tsx:380` (one arm); `view/settings/form.tsx:224,228` (single-permission check, not an OR array — see below) |
| `SETTING-DELETE` | `SETTING_NOTIFICATION_DELETE` | — (no delete route; gated in-UI) | — | `utils.ts`, `view/settings/form.tsx:228` |
| `AUTO-VIEW-7` | `AUTO_NOTIFICATION_VIEW_{USER,SYSTEM,TNC,CREDIT_CARD_APPLICATION,CASH_LOAN_APPLICATION,CREDIT_CARD_CONTRACT,CASH_LOAN_CONTRACT}` | `main.routes.tsx:366-372`, `form.routes.tsx:816-822` | `menus.helper.ts:500-515` | `view/automatic/form.tsx` (per-entity single permission via `checkPermissionNotiAutomatic`, not this array directly — see below) |
| `AUTO-CREATE-7` | same 7 suffixes, `CREATE` | `form.routes.tsx:798-804` | — | `list.tsx:219-226,339,369` (one arm); `create/automatic/create-notification-automatic.tsx` (per-entity single permission, not this array directly — see below) |
| `AUTO-EDIT-7` | same 7 suffixes, `EDIT` | `form.routes.tsx:854-860` | — | `list.tsx:380` (one arm); `edit/automatic/edit-notification-automatic.tsx` (per-entity single permission, not this array directly — see below) |
| `AUTO-DELETE-7` | same 7 suffixes, `DELETE` | — (no delete route) | — | `utils.ts` |

- **List-page create-button OR array** = `SETTING-CREATE` ∪ `AUTO-CREATE-7` (8 members), enforced at `list.tsx:339,369`. The create-type *picker*'s two options are gated separately first (`list.tsx:216` → `SETTING-CREATE` alone for the Settings option; `list.tsx:219-226` → `AUTO-CREATE-7` alone for the Automatic option), then the page-level button/empty-state CTA uses the full 8-member union.
- **List-page batch-edit OR array** = `SETTING-EDIT` ∪ `AUTO-EDIT-7` (8 members), enforced at `list.tsx:380` for the batch activate/deactivate action.
- **List-route/menu OR array** = `SETTING-VIEW` ∪ `AUTO-VIEW-7` (8 members), given verbatim in §2.

**Correction to component-level permission checks (re-verified from source, not matching the prior draft of this section):** the three automatic-flow component files do **not** apply a static 7-member OR array at the component level, unlike the route/menu layer. `edit/automatic/edit-notification-automatic.tsx:176-211,457-498` and `create/automatic/create-notification-automatic.tsx:184-211,472-498` call `hasPermission([PERMISSIONS.AUTO_NOTIFICATION_{EDIT|CREATE}_<ENTITY>])` with a **single** permission selected per the field's own entity type (`SYSTEM`, `USER`, `TNC`, etc.), not the full 7-member group. `view/automatic/form.tsx:226,254,256` calls a helper, `checkPermissionNotiAutomatic` (`configuration/list-notification/utils.ts:909-1060`), which internally maps the record's `entity`/`productLineCode` to one specific `AUTO_NOTIFICATION_{VIEW|EDIT|DELETE}_<ENTITY>` permission and checks only that one. `view/settings/form.tsx:224,228` similarly calls `hasPermission([PERMISSIONS.SETTING_NOTIFICATION_EDIT])` / `hasPermission([PERMISSIONS.SETTING_NOTIFICATION_DELETE])` as single-permission checks, not OR arrays. None of these four sites match the "component-level OR array" characterization in an earlier draft of this document; that characterization is corrected here.

Route-level and menu-level OR arrays are given verbatim in §2.

## 10. Shared and cross-domain dependencies

Imported **by** this module, from outside it:

- `@/components/*` — `Button`, `TableTitle`, `TableWrapper`, `NotificationSearcher` (`@/components/forms/search/notification-list-searcher.form`), `TableDateTime`, `TableCardStatus`, `TableLink`, `NoData`, `CustomPagination`, `ModalContent`, `FormReasonDisable`, `TableSummary`, `FormWrapper`, `FormTitle` — ordinary shared-component reuse, no concerns.
- `@/hooks/*` — `modal.hook`, `query-state.hook`, `auth.hook` (`useHasPermission`), `form.hook` (`useFormImperativeHandle`) — ordinary shared-infrastructure reuse.
- `@/redux/slices/common.slice.ts` (`watchProductGroups`, `watchProducts`) — **cross-domain**: the Settings create/edit forms resolve a CTA target's `productLineCode`/amount/term by reading Products-domain reference data out of the shared `common.slice.ts` (`create/settings/form.tsx:83-84,138-157,231-250`; mirrored in `edit/settings/form.tsx`).
- `@/redux/slices/product-industry.slice.ts` (`getListUpdatedHistories`, `watchListUpdatedHistory`, `watchIndustryPagination`) — **cross-domain**: `view/settings/history.tsx` reuses a Products-module-owned Redux slice (filtered by `entityType: 'NOTIFICATION'`) instead of having its own history state (see §4 Flow B, §13).
- `@/modules/products/configuration/industry-product/ultis.tsx` (`convertFieldActionType`) — **cross-domain**: imported directly from inside another module's feature folder by `view/settings/history.tsx:18`. This matches the exact dependency the Products module's own `docs/modules/products/OVERVIEW.md` already documents from the Products side ("Multiple history screens in users, system, contents, and notifications import `convertFieldActionType` from `.../industry-product/ultis.tsx`").
- `@/utils/form.ts` (`hasRealValue`, `isAllFormValid`), `@/utils/common.ts`, `@/utils/status.ts`, `@/utils/navigate.ts` — ordinary shared-utility reuse.

Imported **into** shared/other-module code **from inside** this module (the reverse direction, confirmed by `grep -rln "from '@/modules/notifications" src/ | grep -v '^src/modules/notifications' | grep -v '^src/routes'`):

- `src/components/forms/search/loan-order-searcher.form.tsx` imports `CLIENT_HPO` (a constant) and `useWorkflowAllOptions` (a hook) directly from `configuration/list-notification/constant.ts` and `configuration/list-notification/hooks/use-workflow-options.ts`. A shared `src/components` form depends on this module's feature-internal constant and hook — the discouraged direction named in `.claude/ARCHITECTURE.md` §5 ("`src/components`... importing from `src/modules`"). This is an existing, real dependency, not a hypothetical one; see §13.
- `src/components/text-editor/index.tsx` imports `restoreTemplateVariableHTML` from `configuration/list-notification/utils.ts` — same discouraged direction, a shared rich-text component depending on this module's utility.
- `src/redux/slices/notification-list.slice.ts` imports the `NotificationFormValuesStore` type from `edit/settings/form.tsx` (see §8).

## 11. Consumers

Outside-module consumers of this module's exports (same grep as §10, "Imported into shared/other-module code"):

- `src/components/forms/search/loan-order-searcher.form.tsx` (shared, used by the Order domain's search form — **NEEDS-VERIFICATION** whether Order-domain screens actually render this searcher with HPO workflow filtering enabled; not traced further here, out of this module's own scope).
- `src/components/text-editor/index.tsx` (shared rich-text editor component).
- `src/redux/slices/notification-list.slice.ts` (this module's own backing slice, for one type import).

No other business module (`products`, `users`, `system`, `order`, `contents`, `blacklist`, `transactions`) imports from `src/modules/notifications/` (`grep -rl "from '@/modules/notifications" src/modules/` outside the module itself returns no match beyond what's listed above, which are outside `src/modules/` entirely).

## 12. Pattern classification

**Legacy-compatible overall**, per `.claude/ARCHITECTURE.md`:

- State: a single centralized Redux slice with one broad `loading` flag shared by 9 different async thunks (§5) — this is the "one broad loading flag representing concurrent requests" risk pattern named in `.claude/ARCHITECTURE.md` §3, not the target request-specific state pattern.
- Server data: 0 TanStack Query usage anywhere in the module (§5) — fully Redux-owned, which is a legitimate `LEGACY-COMPATIBILITY` / "existing Redux-owned resource" classification, not a defect, per `.claude/ARCHITECTURE.md` §4 principle 5 and §11's decision matrix.
- Services: the one feature-local `services/workflow.service.ts` is `LEGACY-COMPATIBILITY` per `.claude/rules/03-api-service.md` `## Service location`; `src/services/notifications/` does not yet exist as of this revision.
- Forms: AntD `Form`/`FormInstance` + `FormLayout`/`FormRef`, no Zod — this matches the *current* repository-wide default for untouched legacy forms (`.claude/rules/05-form.md`), not a deviation; Zod is "prefer for new/substantially changed" validation, not mandatory for existing stable forms.
- Types: ambient global DTOs rather than feature-owned `types/` — matches the repository's broad legacy pattern, not specific to this module.

Nothing above is presented as a defect; per `.claude/ARCHITECTURE.md` §16, these are supported integration contracts while untouched.

## 13. Technical risks

Concrete, source-observed risks (not hypothetical):

1. **One shared `loading` flag across 9 async thunks** (`notification-list.slice.ts`). A `getNotification` detail fetch and a `getResultNotificationList` fetch on the same view page (§4 Flow B) can both toggle the same `state.loading`, so a fast-resolving request can clear the flag while a slower one is still in flight, producing a loading indicator that turns off before all relevant data has arrived.
2. **Cross-domain Redux slice reuse for history** (`view/settings/history.tsx` reusing `product-industry.slice.ts`, §4/§10). This slice has one global `listHistories`/pagination state; if the module's own `entityType: 'NOTIFICATION'` filter is ever dropped or a Products-domain "Industry" history view is open in another tab/state at the same time, the two features would read/write the same slice fields. `NEEDS-VERIFICATION`: whether this has caused an observed bug; it is a structural risk either way.
3. **Reverse `src/components` → module-internal dependency** (`loan-order-searcher.form.tsx`, `text-editor/index.tsx`, §10). Changing or removing `CLIENT_HPO`, `useWorkflowAllOptions`, or `restoreTemplateVariableHTML` would break shared components used outside this module's own screens, not just this module's own pages.
4. **Duplicate `watchNotification` selector name across two unrelated slices** (§5) — this is a maintenance/readability trap: `notification-list.slice.ts`'s `watchNotification` reads a per-record detail field, while `notification.slice.ts`'s `watchNotification` reads the global toast message. A future import mistake (wrong module path, same symbol name) would type-check and compile but read the wrong state.
5. **Three parallel, independently-maintained `NotificationFormValues` type declarations** (`create/settings/form.tsx`, `view/settings/form.tsx`, and the `edit`-derived `NotificationFormValuesStore`, §8) with subtly different shapes — a change to one (e.g. adding a field) is not guaranteed to be reflected in the others.
6. **No `PageURLs` builder for 6 of the 10 routes** (§2) — every in-module navigation to a create/view/edit sub-route is a hardcoded literal string repeated across multiple files; a path change requires finding and updating every literal rather than one builder function.
7. **Parent menu item links to a placeholder stub** (`menus.helper.ts:481`, §2/§3) — "Quản trị thông báo" itself resolves to `GeneralNotice`, a 3-line static component, not to any real screen.

## 14. Areas to avoid touching

- `src/redux/slices/notification-list.slice.ts`'s single `loading` flag and its 9 thunks — any change must consider every consumer tab/page listed in §4/§5, not just the one screen being changed (risk 1 above).
- `src/redux/slices/product-industry.slice.ts` — it is owned by the Products module, not this one; changing its shape, pagination contract, or `entityType` filtering semantics affects both the Products "Industry" history screen and this module's `view/settings/history.tsx` (risk 2 above). Do not assume this module owns it.
- `CLIENT_HPO`, `useWorkflowOptions`/`useWorkflowAllOptions`, and `restoreTemplateVariableHTML` — each has a confirmed outside-module consumer (§10/§11); do not change their exported signature or remove them without auditing `loan-order-searcher.form.tsx` and `text-editor/index.tsx`.
- The global toast slice (`notification.slice.ts`) and its `notificationSlice`-prefixed exports — this module only writes to it like any other feature; do not confuse it with `notificationListSlice` when editing either file (risk 4 above).
- The three placeholder stubs (`general.notification.tsx`, `automatic.notification.tsx`, `setup.notification.tsx`) and their routes/`PageURLs` builders/commented-out menu entries — §3 documents them as placeholders; do not assume removing or "cleaning up" the commented menu code is in scope for an unrelated change without separately confirming intent.

## 15. Open questions

- `NEEDS-TEAM-DECISION`: should `notification-list.slice.ts` move to request-specific loading state (one flag per thunk/operation), given 9 thunks currently share one flag? Not resolved here — this document only records the current state.
- `NEEDS-TEAM-DECISION`: should the Settings "History" tab get its own Redux state instead of reusing the Products module's `product-industry.slice.ts`? Not resolved here.
- `NEEDS-VERIFICATION`: whether the commented-out "Thông báo chung"/"Thông báo tự động"/"Thông báo cài đặt" menu entries (`menus.helper.ts:484-498`) were deliberately disabled (e.g. because those pages are known placeholders) or are simply stale dead code from before the real `list-notification` feature was built.
- `NEEDS-VERIFICATION`: whether `handleSubmit`/`handleSaveDraft` in `create/settings/form.tsx` (and the equivalent `edit` flows) are missing an explicit success toast/notification (see §4 Flow A, point 6), or whether `FormLayout` itself provides that feedback outside this file.
- Resolved in this pass (kept here for history, not open): the 4 component-level call sites are now confirmed in §9 to use single-permission, per-entity-type checks (`hasPermission([PERMISSIONS.AUTO_NOTIFICATION_{EDIT|CREATE}_<ENTITY>])` or the `checkPermissionNotiAutomatic` helper), not 7-member OR arrays as an earlier draft of this document stated.
