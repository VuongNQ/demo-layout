# Promotion Type (Offer Type) — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

Replaces the external Sprint-1 report
(`docs/reports/2026-10-21/sprint1-promotion-type-list.md`) as the
authoritative source for this submodule. That report is stale on almost
every functional claim: it described a 9-file, list-only module with no
drawers, no form, no status toggle, and no built create flow. Current source
(26 files, confirmed via `find
src/modules/products/promotion-management/promotion-type -type f | wc -l`)
has a list, a view/edit detail drawer with an explicit edit-mode switch, a
create drawer, and a status toggle. Split decision and justification for
documenting this separately from [`promotion.md`](promotion.md) are in
[`../promotion-management.md`](../promotion-management.md) §0.

**Sprint-1 report vs. current source — the full gap (CONFIRMED):**

| Sprint-1 report claim | Current source |
| --- | --- |
| 9 files, 465 lines | 26 files |
| List-only; drawers not built | List + view/edit drawer + create drawer, all built |
| 7 columns: code, name, description, status, createdDate, updatedBy, updatedDate | 7 different columns: priority, code, name, mechanism, itemCount, maxItems, status — description and the date/updatedBy columns were dropped from the list, not merely added to |
| Default sort `createdDate,desc` | `DEFAULT_ORDER_BY = 'priority,asc'` |
| Form not built | Two `Form.useForm` sites exist, with Zod schemas |
| Status toggle not built | Built: dedicated `PromotionTypeStatusToggle` component, `PUT .../{id}/status` |
| Delete not built | **Still not built** — this one Sprint-1 claim still holds |
| Filters not built | **Still not built** — `keyword`/`status` exist in the query-key/service params but no caller passes them |
| DTO has a `version` field | No `version` field anywhere in the module or its service types |
| API base `promotion-types` | `BASE_PATH = 'api/admin/portal/v1/offer-types'` |
| Services live in `promotion-management/services/` | That folder does not exist; the only service is the target-location `src/services/products/promotion-type.service.ts` |
| ~15 i18n leaves | 68 literal keys, 68/68 vi/en parity confirmed |

The commit cited by earlier documentation as introducing this module
(`ed18d0c1`) does not exist in this checkout (`git cat-file -t ed18d0c1`
fails), and `git log` on this directory shows only 4 commits with unrelated
subjects — the 9→26 growth history could not be reconstructed here
(**NEEDS-VERIFICATION** against a checkout with fuller history).

**Verification-gap limit (top 5; remainder in §15):**

1. The status-toggle endpoint uses `PUT`
   (`src/services/products/promotion-type.service.ts:90`), but that same
   file's sibling types module documents the backend swagger contract as
   `PATCH` (`promotion-type.types.ts:88`) — **NEEDS-VERIFICATION**.
2. UI enforces `priority <= 999`
   (`components/PromotionTypePriorityMaxItemsRow/index.tsx:19`), but the Zod
   schema only requires `.int().positive()` with no upper bound
   (`utils/promotion-type.validation.ts:50-54,130-134`) — whether a value
   above 999 can reach the backend through any path, and how the backend
   would handle it, is **NEEDS-VERIFICATION**.
3. `maxItems` UI minimum is `1`
   (`PromotionTypePriorityMaxItemsRow/index.tsx:44`), but Zod allows
   `.nonnegative()` (i.e. 0) — **NEEDS-VERIFICATION** whether 0 is reachable
   and what it would mean.
4. Empty-string vs. `null` handling for the optional `description` field —
   the Zod schema accepts `''` via `.trim().max().nullable()` and the mapper
   passes it through unchanged — **NEEDS-VERIFICATION** against backend
   expectations.
5. Whether `sort=mechanism,asc/desc` (sent by the list's mechanism-column
   sort) is accepted by the backend — **NEEDS-VERIFICATION**; only `name`
   and `mechanism` are sortable in the UI and neither's backend acceptance
   was independently confirmed.

## 1. Responsibility

Admin for the backend's `offer-types` resource ("Loại ưu đãi" / offer type)
at `/product/promotion-management/promotion-type/**`: a paginated,
sortable list; a detail drawer that opens in view mode and switches to an
explicit edit mode; a create drawer; and a status toggle (switch) reachable
only in edit mode, with a confirmation prompt when deactivating a type that
still has assigned items (`itemCount >= 1`). **Not built:** delete, any
`/edit/:id` route (edit happens inside the same detail-drawer route as
view), and a keyword/status filter UI (the underlying query params exist
unused).

## 2. Entry points and routes

All three routes are declared in `src/routes/main.routes.tsx:276-304` (not
`src/routes/index.tsx` or `form.routes.tsx`), each `WithGuard` + `AuthGuard`
with a single-element permission array.

| Action | Path | Route line | Page | Permission |
| --- | --- | --- | --- | --- |
| List | `/product/promotion-management/promotion-type` | `:277-284` | `PromotionTypeListPage` | `PROMOTION_MANAGEMENT_VIEW` |
| View (drawer) | `.../promotion-type/view/:id` | `:287-294` | same component | `PROMOTION_MANAGEMENT_VIEW` |
| Create (drawer) | `.../promotion-type/create` | `:297-304` | same component | `PROMOTION_MANAGEMENT_CREATE` |

**Re-confirmed, still true:** `/view/:id` and `/create` both resolve to the
same `PromotionTypeListPage` lazy page
(`src/routes/pages.tsx:228-230`, `src/utils/navigate.ts:303-311`), which then
branches on the route itself
(`views/PromotionTypeListPage/index.tsx:15-20` `parsePromotionTypeRouteId`;
`:33-34` `isCreateRoute`) to decide whether to render the view/edit drawer or
the create drawer (`:60-71`). There is no separate edit route — edit is a
mode switch inside the same `/view/:id` drawer.

**Edge case (CONFIRMED):** navigating to `/view/abc` or `/view/0` renders the
bare list with no drawer and no error feedback
(`PromotionTypeListPage/index.tsx:15-20,60`).

Menu: `src/helpers/menus.helper.ts:334-345`. A parent "Menu.promotionManagement"
group links to this list; a child "Menu.promotionType" entry requires
`PROMOTION_MANAGEMENT_VIEW` (`:344`); a sibling "Menu.promotion" entry
(covered in `promotion.md` §2) requires `PRODUCT_PROMOTION_VIEW` (`:350`).

**Deep link into `promotion/` (one-way):** the detail drawer's
`navigateToPromotionList` (`hooks/usePromotionTypeDetailDrawer.hook.tsx:168-171`)
navigates to `/product/promotion-management/promotion?offerTypeId=<id>`,
gated by `hasPermission([PRODUCT_PROMOTION_VIEW])` (`:64`) — see
`promotion.md` §2 for the receiving side.

## 3. Directory map (26 files)

| File/folder | Responsibility |
| --- | --- |
| `constant.ts` | Status/product-line/mechanism literal unions; `PROMOTION_TYPE_MECHANISM_OPTIONS` (only `GIFT_PRODUCT` enabled); name/description/code length limits; `PROMOTION_TYPE_PRIORITY_FALLBACK = 999` |
| `queryKeys/promotion-type.query-keys.ts` | `promotionTypeQueryKeys` — `all`, `lists()`, `list(params)`, `detail(id)`, all colocated `queryOptions`. **Shares a basename, but not an export, with the different root-level `../../queryKeys/promotion-type.query-keys.ts`** — see `../promotion-management.md` §1 |
| `hooks/promotion-type.queries.hook.ts` | `useCreatePromotionTypeMutation`, `useUpdatePromotionTypeMutation`, `useTogglePromotionTypeStatusMutation` |
| `types/promotion-type.types.ts` | Re-export only — read DTOs from the root `promotion-management/types/promotion-type.types.ts`, request DTOs from `@/services/products` |
| `utils/promotion-type-api.error.ts` | Field whitelists, error helpers, create-error-to-field mapper (handles a documented `PORTAL_CV_OFFER_122` response shape) |
| `utils/promotion-type-date.util.ts` | Fixed GMT+7 date+time formatter, deliberately not shared with `theme-management/utils/gmt7-date.util.ts`; numerically reuses `CACHE_STALE_TIME` (60,000) as a ms-per-minute multiplier (low-severity coupling, §13) |
| `utils/promotion-type.validation.ts` | Create/update Zod schemas, form mappers, Zod→AntD error mappers |
| `views/PromotionTypeListPage/` | Page shell: create button, route-driven drawer rendering |
| `components/PromotionTypeTableSection/` | List table: sort, pagination, empty/error/retry states |
| `components/PromotionTypeDetailDrawer/` + `hooks/usePromotionTypeDetailDrawer.hook.tsx` | View/edit drawer and its logic (mode switch, save, cancel/discard, status toggle host) |
| `components/PromotionTypeCreateDrawer/` | Create drawer: form, submit, error mapping |
| `components/PromotionTypeStatusToggle.tsx` | Status switch with a deactivation confirm when `itemCount >= 1`; single file, no `.module.scss`, unlike its sibling components |
| `components/PromotionTypeCodeField`, `PromotionTypeNameField`, `PromotionTypeDescriptionField`, `PromotionTypeMechanismField`, `PromotionTypePriorityMaxItemsRow` | Shared field components used by both drawers |

## 4. Main runtime flows

### List

```text
components/PromotionTypeTableSection/index.tsx:49-55
  useQuery(promotionTypeQueryKeys.list({page: page-1, size, orderBy}))
  sort on name/mechanism resets to page 1
  row click -> navigate(ofPromotionTypeView(row.id))
```

### View / Edit (single drawer, mode-switched)

```text
route id -> PromotionTypeDetailDrawer -> usePromotionTypeDetailDrawer.hook.tsx:69
  useQuery({...detail(id)})  [mode starts as 'view', :68]

Edit button (:64-65, gated by canEdit) -> mode='edit'
Save (:72 -> form.submit() -> handleFinish, hook :134-166):
  safeParseAsync -> mapPromotionTypeUpdateFormValuesToRequest -> updateMutation.mutateAsync
  on success: mode='view' + success message
Cancel (:116-132): requestCancelEdit/revertToView, with a discard confirm when dirty
```

### Status toggle (edit mode only)

```text
PromotionTypeStatusToggle (rendered only in edit mode, drawer header)
  handleChange (:64-79): modal.confirm when turning OFF with itemCount >= 1
  runToggle (:53-62) -> toggleMutation.mutate
  error -> message.error
```

**Confirmed gap:** the toggle persists immediately on confirm, independent
of the form's dirty state, and does not trigger the same discard confirm
that cancelling an edit does (§13).

### Create

```text
/create -> PromotionTypeCreateDrawer
  handleFinish (:107-133): createMutation.mutateAsync(request) -> success message -> onClose() -> navigate to list
```

### Delete

Not built — no delete hook, service function, route, or permission exists.

## 5. State ownership

**CONFIRMED, no Redux shadow.** `grep -rln "redux/slices"
src/modules/products/promotion-management/promotion-type/` and a repo-wide
`grep -rln "promotion-type\|promotionType\|PromotionType" src/redux/` both
return nothing. The only Redux touched from inside this module is the shared
`useHasPermission` read of `watchUserPermissions` — client/global auth
state, not a server resource for this module.

## 6. API boundaries

### Query-owned checklist (TEMPLATE.md content rule 15)

- **Key factory** (`queryKeys/promotion-type.query-keys.ts`): colocated
  `queryOptions`. Imports `getPromotionTypes`/`getPromotionTypeById` from
  `@/services/products`, not from a `services/` folder inside this module
  (none exists). This is a **different file** from the root-level
  `promotion-management/queryKeys/promotion-type.query-keys.ts`, which
  exports the unrelated `promotionTypeLookupQueryKeys` consumed only by
  `promotion/` — see `../promotion-management.md` §1 for the full basename-
  collision accounting; their key prefixes (`promotion-types` vs.
  `promotion-types-lookup`) do not runtime-collide.
- **Queries and consumers:**

  | Query | `staleTime` | `placeholderData` | Consumers |
  | --- | --- | --- | --- |
  | `list` | `CACHE_STALE_TIME` (60s), explicit | `keepPreviousData` | `PromotionTypeTableSection:49` (1) |
  | `detail` | default (TanStack 0) | none | `usePromotionTypeDetailDrawer.hook.tsx:69` (1) |

- **Mutations** (`hooks/promotion-type.queries.hook.ts`):
  - `useCreatePromotionTypeMutation` (`:10-22`): `onSuccess` awaits
    `invalidateQueries(lists())`. No `setQueryData`.
  - `useUpdatePromotionTypeMutation` (`:24-38`): `onSuccess` calls
    `setQueryData(detail(id), ...)`, then awaits `invalidateQueries(lists())`.
  - `useTogglePromotionTypeStatusMutation` (`:40-54`): same pattern as
    update — `setQueryData(detail(id))` then awaited `invalidateQueries(lists())`.
  - **Gap, confirmed:** none of the three mutations invalidates the
    separate, root-level `promotionTypeLookupQueryKeys.unlimited()` that
    `promotion/` depends on for its category dropdown and filter — a create,
    rename, or status change here can leave that lookup stale for up to the
    60-second `CACHE_STALE_TIME` window. Low-to-moderate impact: display-only
    staleness, since `promotion/`'s own save-time validation
    (`PromotionEditPage/index.tsx:120-123`) forces `staleTime: 0` and
    re-fetches fresh data before committing.

### Service (`src/services/products/promotion-type.service.ts`)

The only `promotion-type.service*` file in the repository — the basename
collision between `promotion-management/services/` and
`promotion-management/promotion-type/services/` that
`.claude/rules/03-api-service.md` and `.claude/PROJECT_CONTEXT.md` once
flagged as a pending decision **no longer exists in current source**
(confirmed: `src/modules/products/promotion-management/services/` does not
exist at all). Base path implicit per function:

| Function | Method/endpoint |
| --- | --- |
| `getPromotionTypes` | `GET api/admin/portal/v1/offer-types?keyword&status&page&size&sort` (wire key `sort`, mapped from an `orderBy` parameter) |
| `getPromotionTypeById` | `GET .../offer-types/{id}` |
| `updatePromotionType` | `PUT .../offer-types/{id}` |
| `createPromotionType` | `POST .../offer-types` |
| `togglePromotionTypeStatus` | `PUT .../offer-types/{id}/status` (§0 item 1 — types file documents this as `PATCH` per swagger) |
| `getOfferCategories` | `GET .../offer-types/lookup` (hardcoded path; **dead, zero callers**, §13) |

Null responses throw via `requirePromotionTypeApiResponse` — the stable-CRUD
typed-DTO default, not a gap.

## 7. Forms and validation

Two `Form.useForm` sites:
`components/PromotionTypeCreateDrawer/index.tsx:58` and
`hooks/usePromotionTypeDetailDrawer.hook.tsx:71`. Zod schemas in
`utils/promotion-type.validation.ts`
(`promotionTypeUpdateFormSchema`/`promotionTypeCreateFormSchema`), executed
explicitly via `safeParseAsync` at submit, mapped to `form.setFields` via
dedicated Zod-issue mappers. **Fragile pattern, confirmed:**
`components/PromotionTypeCodeField/index.tsx:14,31-35` re-runs
`promotionTypeCreateFormSchema.shape.code.safeParse` independently per
keystroke and detects a specific pattern error by comparing
`form.getFieldError('code')` against the *translated* error message string
— a locale change or message-text edit would silently break this check
without a type error. Backend error mapping on create handles a documented
`details[].code` response shape with `{0}` interpolation
(`promotion-type-api.error.ts:99-130`); update uses a shared, simpler
helper.

## 8. Types and DTO organization

Canonical DTOs live at `src/services/products/promotion-type.types.ts`
(`PromotionTypeResponse`, `PromotionTypePagedResponse`,
`PromotionTypeListQueryParameters`, plus Create/Update/Status request
types). Two unused types are parked there: `PromotionTypeLookupResponse` and
`OfferCategoryOption` (§13). `promotion-type/types/promotion-type.types.ts`
is a two-hop re-export (read DTOs from the root
`promotion-management/types/promotion-type.types.ts`, request DTOs directly
from `@/services/products`). The root file's own header comment claims
`promotion/` consumes it for a category filter — **confirmed stale**:
`promotion/` does not import from the root types file at all (only from the
root *query-keys* file, a different file — see `../promotion-management.md`
§1).

**Other stale comments found (recorded, not fixed):**
`constant.ts:63-67` describes the priority fallback as "reserved... in a
later sprint," though the create mapper already uses it
(`validation.ts:161`); `promotion-type.types.ts:83-84` documents `priority`
as nullable "only on update," though the create request type is also
nullable for it (`:101`); `usePromotionTypeDetailDrawer.hook.tsx:61-63` cites
`src/routes/index.tsx:720`, a path that no longer exists (the guard is at
`main.routes.tsx:307-310`).

## 9. Permissions

Three constants (`src/constants/permission.constant.ts:171-173`):
`PROMOTION_MANAGEMENT_VIEW`/`_CREATE`/`_EDIT` (string values
`offer_type:view`/`create`/`edit`). The TS-identifier-vs-string-value
mismatch (`PROMOTION_MANAGEMENT_*` naming `offer_type:*` values) is
**confirmed intentional** — a comment at `permission.constant.ts:169-170`
states the identifiers were kept deliberately. There is no delete
permission (no delete feature exists) and no dedicated status-toggle
permission — the toggle is reachable only through the same `canEdit` gate as
the rest of edit mode.

Component-level checks:
- `views/PromotionTypeListPage/index.tsx:30` (`PROMOTION_MANAGEMENT_CREATE`) — create button.
- `hooks/usePromotionTypeDetailDrawer.hook.tsx:60` (`PROMOTION_MANAGEMENT_EDIT`) — `canEdit`, gates the Edit button and therefore edit mode and the status toggle.
- `hooks/usePromotionTypeDetailDrawer.hook.tsx:64` (`PRODUCT_PROMOTION_VIEW`) — `canViewPromotionList`, gates the deep-link item into `promotion/`'s list (§2).

Every check above is a single-permission array (content rule 14).

## 10. Shared and cross-domain dependencies

- **Services:** `@/services/products` barrel (hooks, query-keys, types).
- **Constants:** `@/constants/permission.constant`, `@/constants/pagination.constant`,
  `@/constants/common.constant` (`CACHE_STALE_TIME`, reused unconventionally
  as a ms-per-minute multiplier in the date util, §3).
- **Hooks:** `@/hooks/auth.hook` (Redux-backed `useHasPermission`),
  `@/hooks/modal.hook`.
- No import exists from `promotion/`, segmentation, or any other
  `products/` submodule. This module's date formatting deliberately does not
  reuse `theme-management/utils/gmt7-date.util.ts` despite solving the same
  GMT+7 problem — a small, duplicated-but-intentional boundary, not a defect.

## 11. Consumers

- Inbound: `src/routes/pages.tsx:228-230` (lazy page),
  `src/utils/navigate.ts:303-311` (URL builders, used by routes and the
  menu).
- `promotion/` does **not** import anything from `promotion-type/`
  directly — its only coupling is the shared root-level lookup query-key
  file (a different file from this module's own query-keys, see §6) and the
  one-way `?offerTypeId=` URL parameter this module's drawer produces (§2).

## 12. Pattern classification

| Pattern | Classification |
| --- | --- |
| TanStack Query, colocated `queryOptions`, no Redux | `target-compatible` |
| Services/types at `src/services/products/` (target location) | `target-compatible` |
| Zod with explicit `safeParseAsync`, AntD error mapping | `target-compatible` |
| Fragile string-comparison error detection in `PromotionTypeCodeField` | deviation-class risk, recorded §13 |
| Status toggle bypassing the dirty/discard confirm used elsewhere in the same drawer | deviation-class risk, recorded §13 |
| Fixed GMT+7 date util duplicated instead of reused from Theme Management | `legacy-compatible`-style duplication, intentional per source comment, not a defect |

## 13. Technical risks

Ordered by decreasing consequence, per content rule 8.

- **Lookup cache staleness from this module's own mutations.** None of the
  three mutations here invalidates the separate root-level
  `promotionTypeLookupQueryKeys.unlimited()` that `promotion/` depends on
  (§6). Bounded to 60 seconds and mitigated at `promotion/`'s own save path,
  but a stale category dropdown/filter is possible in that window.
- **Status-toggle HTTP verb may not match the backend contract.** `PUT` is
  used in source; the sibling types file documents `PATCH` per swagger
  (§0 item 1). If the backend truly expects `PATCH`, every toggle attempt
  would fail and surface a generic `error.toggleStatusFailed` message with
  no indication of the real cause.
- **Fragile error-detection via translated-string comparison.** The code
  field's duplicate-code detection compares live field errors against a
  *translated* message string (§7) — any wording change or locale switch
  silently breaks this check with no compiler warning.
- **Status toggle bypasses the dirty/discard confirmation pattern.** The
  toggle persists immediately on confirm even while the form has other
  unsaved edits, unlike Cancel's explicit discard-confirm path — not data
  corruption, but an inconsistent UX within the same drawer.
- **Dead code.** `isPromotionTypeVersionConflictError` and
  `mapPromotionTypeApiErrorToFields`
  (`utils/promotion-type-api.error.ts:39-41,43-46`), `getOfferCategories`
  (service, zero callers), `PromotionTypeLookupResponse` (types, zero
  callers), and `PROMOTION_TYPE_CODE_DUPLICATE_ERROR_CODE`
  (`constant.ts:83`) have no consumers — in particular, the 409
  version-conflict handling this dead code implies was once planned is
  absent; a real version conflict today falls back to a generic
  update-failed message.
- **Stale comments** (§8) — recorded there, not repeated here, per content
  rule 10's "record once, don't duplicate" spirit.
- **Invalid `/view/:id` renders silently.** §2.
- **Unused `disabled` prop** on `PromotionTypeStatusToggle`
  (`:13,45`) — only its default value is ever passed.
- **Redundant duplicate `initialValue`.** The create drawer sets the
  mechanism default in both the form's `initialValues` object and a
  `Form.Item initialValue` prop for the same field
  (`PromotionTypeCreateDrawer/index.tsx:171,178`) — harmless but worth noting
  as drift-risk if one is changed without the other.

## 14. Areas to avoid touching

- Do not rename either `promotion-type.query-keys.ts` file to "resolve" the
  basename collision with the root-level lookup-key file without first
  confirming every import site in both `promotion/` and `promotion-type/` —
  see `../promotion-management.md` §1 and `promotion.md` §14 for the same
  caution stated from the other side.
- Do not "fix" the status-toggle HTTP verb from `PUT` to `PATCH` (or vice
  versa in the types doc) without first confirming the actual backend
  contract — guessing wrong in either direction breaks a currently-working
  or currently-broken call without evidence either way.
- Do not delete the dead-code items in §13 as an incidental cleanup inside
  an unrelated task; some of them (the version-conflict helpers) hint at
  planned-but-unfinished backend-error handling that a future task may still
  need.

## 15. Open questions

- The five verification gaps in §0.
- Whether the 409 version-conflict handling implied by the dead
  `isPromotionTypeVersionConflictError`/`mapPromotionTypeApiErrorToFields`
  helpers was ever meant to ship, and whether it still should.
- Whether the status toggle's bypass of the dirty/discard confirm is
  intentional (status changes are meant to be immediate regardless of other
  in-progress edits) or an oversight.
- Whether a keyword/status filter UI for the list is planned, given the
  query params already exist unused in both the query-key factory and the
  service.
