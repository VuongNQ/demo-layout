# Display Information Set — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

New document; `src/modules/products/configuration/display-information-set/`
(17 files) previously had no dedicated documentation, only passing mentions
inside `../product-configuration.md`. Produced in the same reconciliation run
that replaced that document's cash-loan/credit-card sections with
`cash-loan-credit-card.md`.

**Split decision.** Kept **separate** from `cash-loan-credit-card.md`, not
folded in, despite living at the same `configuration/` directory level.
Justification: no file-to-file import exists between this folder and either
`cash-loan/` or `credit-card/`; this feature has its own distinct business
entity (a display-presentation configuration record, not a product); and,
architecturally, it is the cleanest counter-example in `configuration/` —
fully TanStack-Query-owned with no Redux slice at all — rather than the
hybrid Query-read/Redux-write shape the other two share. Merging it would mix
two genuinely different ownership stories in one document.

**Verification-gap limit (top 5; remainder in §15):**

1. Backend semantics of the status-toggle `PUT` (it resends the full detail
   payload with `status` overridden, not a dedicated status endpoint) are
   **NEEDS-VERIFICATION**.
2. Five i18n keys referenced via `t()` in this module
   (`displayInformationSetGeneralInformation`, `...NoData`,
   `...DetailError`, `...HistoryError`, `...HistoryNoData`) exist in
   **neither** `src/lang/vi.json` nor `src/lang/en.json`. Confirmed by exact
   grep; rendered fallback behavior at runtime is **NEEDS-VERIFICATION**.
3. The history tab (`views/view/history.tsx`) sets `placeholderData:
   keepPreviousData` on its query but still renders a `Skeleton` and omits
   pagination during `isFetching` — a **CONFIRMED** violation of the
   paginated-table MUST in `.claude/rules/03-api-service.md` (retained rows
   and the pagination control must stay visible during a page/filter
   refetch), recorded here as a defect, not fixed.
4. Whether `FormLayout`'s own `loading` prop (which includes
   `detailQuery.isFetching`) and `views/view/general.tsx`'s separate
   `Skeleton` on `isPending` double-indicate the same in-flight request is
   **NEEDS-VERIFICATION** (one-indicator-per-request rule,
   `.claude/rules/07-component.md`).
5. Downstream consumption of the display-set `code` selected inside
   `scheme-sync`'s `PublishModal` (the only confirmed cross-domain consumer)
   was not traced past that selection point — **NEEDS-VERIFICATION**.

## 1. Responsibility

CRUD for "display information sets" — presentation-configuration records that
control how a product line's app-facing display surface is assembled (image,
label set, fee set, required-information set, and two "show in" visibility
flags) — at `/product/parameter/display-information-set/**`. Not a product
entity itself; it references product lines (`CL`/`CD`), fee definitions,
required-information sets, and product labels as reference inputs, each owned
elsewhere.

## 2. Entry points and routes

All four routes use `WithGuard` + `AuthGuard` and a `lazy()` page export.

| Action | Path | Route file:line | Lazy export (`pages.tsx`) | Permission |
| --- | --- | --- | --- | --- |
| List | `/product/parameter/display-information-set` | `main.routes.tsx:426-431` | `:172` | `DISPLAY_INFORMATION_SET_VIEW` |
| Create | `.../display-information-set/create` | `form.routes.tsx:920-925` | `:176` | `DISPLAY_INFORMATION_SET_CREATE` |
| View | `.../display-information-set/view/:id` | `form.routes.tsx:940-945` | `:179` | `DISPLAY_INFORMATION_SET_VIEW` |
| Edit | `.../display-information-set/edit/:id` | `form.routes.tsx:956-961` | `:182` | `DISPLAY_INFORMATION_SET_EDIT` |

`PageURLs.ofDisplayInformationSet[Create|View|Edit]` (`src/utils/navigate.ts:195-205`)
are used consistently by all four of this module's own views — no hardcoded
path was found in this folder (unlike the cash-loan finding in the sibling
document). Menu entry: `menus.helper.ts:327-330`, single permission
(`DISPLAY_INFORMATION_SET_VIEW`), nested under the product-parameters group.

Module-scoped vs. repo-wide permission-reference counts (content rule 13):
module-scoped grep finds 2 references (the two in-component `hasPermission`
calls below); the repo-wide count is 7 (2 in-component + 1 menu + 4 across
`main.routes.tsx`/`form.routes.tsx`), plus 3 definitions in
`permission.constant.ts`. The gap is fully explained: the route and menu
layers live outside the module directory, per content rule 13.

## 3. Directory map

| File | Responsibility |
| --- | --- |
| `constants.ts` | Status constants, default sort, image-type allowlist, view-tab enum values |
| `types.ts` | Status/filter/query/DTO/form/history types (status derived from `constants.ts`) |
| `mappers.ts` | Form↔request mappers: to-create, to-update, detail-to-edit-form |
| `services/display-information-set.service.ts` | 8 methods over `window.apiFetcher`: 3 catalog reads, list, create, detail, update, history |
| `queryKeys/display-information-set.query-keys.ts` | Keys-only factory: `industries`, `requiredInformationSets`, `fees`, `all`, `lists()`, `list()`, `details()`, `detail(id)`, `histories()`, `history(id)` |
| `hooks/displayInformationSetQueries.ts` | 8 exported hooks: 6 queries, 2 mutations (create, update) |
| `views/ListDisplayInformationSet.tsx` | List page: URL-state filters, table, pagination, create button |
| `views/create/index.tsx` + `general.tsx` | Create page shell + general form |
| `views/edit/index.tsx` + `general.tsx` | Edit page shell + general form (renders only once detail resolves) |
| `views/view/index.tsx` + `general.tsx` + `history.tsx` | View shell (status toggle via the update mutation), read-only general tab, history tab |
| `components/DisplayInformationSetGeneralForm.tsx` | Shared create/edit/view form body: fields, catalog queries, image validation |
| `components/DisplayInformationSetSearcherForm.tsx` | List filter form (keyword, status) |
| `components/DisplayInformationProductLabelsField.tsx` | Label picker; delegates to the cash-loan or credit-card product-labels Query hook by selected product line |

17 files, confirmed via `find`; no discrepancy against the enumerated list.

## 4. Main runtime flows

### List / filter

```text
ListDisplayInformationSet.tsx
  -> useDisplayInformationSetListQuery  [Query, placeholderData: keepPreviousData, no staleTime]
  -> displayInformationSetQueryKeys.list(params)
  -> display-information-set.service.ts -> window.apiFetcher.get('.../display-sets', query)
```

The same list hook is reused outside this module by
`scheme-sync/components/PublishModal/index.tsx` with a different,
`size: 99999`, query shape — see §11.

### Create

```text
views/create/general.tsx: form.validateFields()
  -> mapDisplayInformationSetFormToCreateRequest
  -> useCreateDisplayInformationSetMutation().mutateAsync
  -> service.create() -> POST .../display-sets
  -> onSuccess: await invalidateQueries(lists())
```

### Edit

```text
views/edit/index.tsx: useDisplayInformationSetDetailQuery(id)
  -> mapDisplayInformationSetApiDetailToEditForm -> Form initialValues (applied once, on detail arrival)
  -> submit: mapDisplayInformationSetFormToUpdateRequest
  -> useUpdateDisplayInformationSetMutation().mutateAsync
  -> service.update() -> PUT .../display-sets/:id
  -> onSuccess: await Promise.all([invalidate detail(id), invalidate lists(), invalidate historyById(id)])
  -> navigate to view
```

### Status toggle (view page)

```text
views/view/index.tsx: onToggleStatus
  -> builds a full update request from the already-loaded detail, with status flipped
  -> reuses useUpdateDisplayInformationSetMutation (same mutation as edit submit)
  -> same three-key invalidation as edit
```

There is no dedicated status endpoint; the toggle is a full `PUT` round trip.

### History

```text
views/view/history.tsx: useDisplayInformationSetHistoryQuery(id, {page, size})
  -> displayInformationSetQueryKeys.history(id, params)  [placeholderData: keepPreviousData set, but see §0 item 3]
```

## 5. State ownership

**CONFIRMED, not NEEDS-VERIFICATION: this resource has exactly one owner,
TanStack Query. There is no Redux shadow.** Verified by three independent
greps: no slice/middleware file under `src/redux/**` references
`display-set`/`displayInformation`; `product-list.slice.ts` (the slice that
is still authoritative for cash-loan/credit-card, see the sibling document)
has zero import sites inside this folder; and no file outside this module's
own files, routes, and menu references `display-information-set` at all,
except the one cross-domain consumer in §11. The only Redux touched from
inside this folder is `notification.slice` (`setNotification`, client-level
UI state, not a server resource) and `useHasPermission`'s own Redux read.

| Concern | Owner |
| --- | --- |
| List read | TanStack Query, feature-owned |
| Three catalog reads (industries, required-info sets, fees) for the form | TanStack Query, feature-owned, no `staleTime` (refetches on every mount) |
| Detail read | TanStack Query, feature-owned |
| Create / update (including status toggle, which reuses the update mutation) | TanStack Query mutations, feature-owned |
| History read | TanStack Query, feature-owned |
| Notifications | Redux `notification.slice` (client UI state, not server data) |

## 6. API boundaries

### Query-owned checklist (TEMPLATE.md content rule 15)

- **Key factory** (`queryKeys/display-information-set.query-keys.ts`):
  keys-only, no colocated `queryOptions`. Does not import from `services/`.
  Methods: `industries`, `requiredInformationSets(params)`, `fees(params)`,
  `all`, `lists()`, `list(params)`, `details()`, `detail(id)`, `histories()`,
  `historyById(id)`, `history(id, params)`. Key prefix:
  `['display-information-sets', ...]`.
- **Hooks and consumer counts** (`hooks/displayInformationSetQueries.ts`,
  8 hooks, 11 total call sites):

  | Hook | Kind | Consumers |
  | --- | --- | --- |
  | `useDisplayInformationSetIndustriesQuery` | query | 1 (`GeneralForm`) |
  | `useDisplayInformationSetRequiredInformationSetsQuery` | query | 1 (`GeneralForm`) |
  | `useDisplayInformationSetFeesQuery` | query | 1 (`GeneralForm`) |
  | `useDisplayInformationSetListQuery` | query | 2 (list page; `scheme-sync`'s `PublishModal`, cross-feature) |
  | `useDisplayInformationSetDetailQuery` | query | 2 (edit, view) |
  | `useDisplayInformationSetHistoryQuery` | query | 1 (history tab) |
  | `useCreateDisplayInformationSetMutation` | mutation | 1 (create) |
  | `useUpdateDisplayInformationSetMutation` | mutation | 2 (edit submit, view status toggle) |

- **`staleTime`:** none anywhere in the module (grep confirmed); every query
  uses the TanStack default of 0 plus the global `QueryProvider` defaults
  (`retry: false`, `refetchOnWindowFocus: false`, no `staleTime`). The three
  form catalogs and the list therefore refetch on every mount.
- **`placeholderData: keepPreviousData`:** present on the list query and the
  history query; absent (correctly) on detail and the three non-paginated
  catalog queries.
- **Mutation invalidation, exact and awaited:**
  - Create: invalidates `lists()` only, awaited inside `onSuccess`.
  - Update (used by both edit submit and status toggle): invalidates
    `detail(id)`, `lists()`, and `historyById(id)` via `Promise.all`,
    awaited. Edit's navigation to the view page happens only after this
    resolves.
  - `setQueryData`/`setQueriesData` is used nowhere in this module — every
    cache sync goes through invalidation, unlike the sibling document's
    cash-loan quick-edit, which uses a direct cache patch.

### Service (`services/display-information-set.service.ts`)

| Method | HTTP | Endpoint |
| --- | --- | --- |
| `getIndustries` | GET | `product-lines` |
| `getRequiredInformationSets` | GET | `required-information-sets/search/assignable` |
| `getFees` | GET | `fee-definitions/assignable` |
| `getList` | GET | `display-sets` (query) |
| `create` | POST | `display-sets` |
| `getDetail` | GET | `display-sets/:id` |
| `update` | PUT | `display-sets/:id` |
| `getHistories` | GET | `display-sets/:id/history` |

All via `window.apiFetcher`, no direct axios/fetch. Responses are typed with
`as`-cast DTOs; per `.claude/rules/03-api-service.md` this is the normal
typed-DTO default for a stable CRUD contract and is not itself a gap.

## 7. Forms and validation

AntD `Form`/`FormInstance` only; no Zod, no React Hook Form anywhere in the
module (confirmed by grep). Validation uses inline AntD `rules` plus one
custom async image validator (`validateSquareImage`: 1:1 aspect, ≤100 KB,
allowlisted formats). This is consistent with
`.claude/rules/05-form.md`'s guidance that simple constraints may use AntD
rules without an independent Zod schema.

Flow: API detail → `mapDisplayInformationSetApiDetailToEditForm` → AntD
`initialValues` (edit: applied once per entity, since the general form only
renders after `detail` resolves, so a background refetch cannot silently
overwrite in-progress edits — `NEEDS-VERIFICATION` at runtime, but the static
shape supports this) → `validateFields()` → create/update mapper → mutation.
Changing `productLineCode` in the form clears the selected product labels,
since the label field's catalog (cash-loan vs. credit-card) depends on that
field.

## 8. Types and DTO organization

`types.ts` is largely feature-owned (list/detail/create/update/history DTOs,
form values), with one ambient dependency: `Industry` (used unimported,
resolving to `src/types/product-industry.d.ts`) inside the service file.
This single ambient dependency is `legacy-compatible` and narrow; it is not a
broader ambient-type leak into this module's own DTOs.

## 9. Permissions

Three constants (`permission.constant.ts:81-83`), below the content-rule-9
table threshold, so a plain list suffices:

- `DISPLAY_INFORMATION_SET_VIEW` (`'display_set:view'`) — list and view
  routes, menu entry.
- `DISPLAY_INFORMATION_SET_CREATE` (`'display_set:create'`) — create route,
  and the in-component create-button check on the list page.
- `DISPLAY_INFORMATION_SET_EDIT` (`'display_set:edit'`) — edit route, and the
  in-component check on the view page that gates both the edit link and the
  status-toggle action (`canEdit`).

Every check is a single-element array evaluated with the app's default OR
(`some`) semantics; none is a dynamic resolver (content rule 14).

## 10. Shared and cross-domain dependencies

- **Product labels:** `components/DisplayInformationProductLabelsField.tsx`
  imports both `configuration/product-labels/cash-loan/hooks/cashLoanLabelQueries`
  and `.../product-labels/credit-card/hooks/creditCardLabelQueries`, selecting
  between them by the form's `productLineCode` value. This is a real,
  if narrow, dependency on the product-labels submodule's own Query hooks
  (not on `cash-loan/`/`credit-card/` from the sibling document).
- **Ambient:** `Industry` type (see §8).
- No dependency on `product-list.slice.ts`, `cash-loan/`, or `credit-card/`
  folder internals at all.

## 11. Consumers

- `scheme-sync/components/PublishModal/index.tsx` is the **only** confirmed
  cross-feature consumer: it calls `useDisplayInformationSetListQuery` with
  `{ page: 0, size: 99999, status: 'ACTIVE' }` to let the user pick an active
  display set by `code`, and links out to the list page via `PageURLs`.
  Backend tolerance of `size: 99999`, and what scheme-sync does with the
  selected `code` downstream, are both **NEEDS-VERIFICATION** (§0 item 5).
- No other file in the repository imports this module's types, mappers,
  constants, service, or query keys.

## 12. Pattern classification

| Pattern | Classification |
| --- | --- |
| TanStack Query feature hooks + feature service + ApiFetcher, no Redux | `target-compatible` |
| Module-local `services/` folder | `LEGACY-COMPATIBILITY` for location only |
| Keys-only query-key factory (no colocated `queryOptions`) | target gap, **SHOULD**, not a violation |
| AntD Form with AntD rules + one custom async validator, no Zod | `target-compatible` (simple constraints don't require Zod) |
| Emotion styling, no `.module.scss` anywhere in this new-ish module | target gap vs. the SCSS-for-new-features default (`.claude/rules/10-styling.md`); not a violation of existing code, but worth noting since this module postdates that rule |
| History pagination hiding retained rows/pagination during `isFetching` despite `keepPreviousData` | defect-class deviation from `.claude/rules/03-api-service.md`'s MUST; recorded, not fixed |
| Hardcoded Vietnamese UI strings outside `t()`, plus 5 missing i18n keys | deviation from `.claude/rules/11-i18n.md`; recorded, not fixed |

## 13. Technical risks

Ordered by decreasing consequence, per content rule 8.

- **Paginated history view breaks the keep-previous-data contract.**
  `views/view/history.tsx` sets `keepPreviousData` on its query but still
  shows a `Skeleton` and hides pagination while `isFetching`, so the MUST in
  `.claude/rules/03-api-service.md` (retained rows and visible pagination
  during a page/filter refetch) is not met. CONFIRMED by reading the file.
- **Status toggle is a full-payload `PUT`, not a dedicated endpoint.** Any
  concurrent edit to other fields between page load and the toggle click
  would be overwritten by the toggle's full-detail resubmission. Backend
  concurrency handling is `NEEDS-VERIFICATION`.
- **Five i18n keys are missing from both language files.** `t()` calls for
  display-set-specific strings (`§0` item 2) will render the raw key string
  at runtime unless the i18n library's behavior differs from the documented
  `fallbackLng` convention — `NEEDS-VERIFICATION`.
- **Hardcoded Vietnamese strings bypass `t()` entirely** in several list,
  view, and form messages, independent of the missing-key issue above.
- **Cross-feature query reuse with a divergent shape.** `scheme-sync`'s
  `PublishModal` calls the same list hook with a non-paginated,
  `size: 99999` shape. This works today because both query variants share
  the `lists()` invalidation prefix, but it means a future change to the
  list query's default parameters could silently affect scheme-sync's
  picker too.
- **Possible double loading indicator.** `FormLayout`'s own `loading` (which
  already reflects `detailQuery.isFetching`) and `views/view/general.tsx`'s
  separate `Skeleton` on `isPending` may both render for the same detail
  fetch — `NEEDS-VERIFICATION` at runtime, not confirmed as an actual
  double-indicator in this static pass.

## 14. Areas to avoid touching

- Do not assume this module needs a Redux migration bridge like
  `cash-loan-credit-card.md` describes — it has no Redux owner to bridge
  from, and introducing one would create a second owner where the rules
  require exactly one.
- Do not change the list query's default parameters without checking
  `scheme-sync`'s `PublishModal` consumer first.
- Do not treat the missing i18n keys as safe to silently add without
  checking actual rendered behavior first, since the fallback behavior here
  is `NEEDS-VERIFICATION`, not confirmed broken.

## 15. Open questions

- Backend semantics of the status-toggle full-payload `PUT` and any
  concurrency/`updatedDate` handling.
- Runtime rendering of the five missing i18n keys.
- Whether `FormLayout` loading and the view's own `Skeleton` double-indicate.
- Downstream consumption of the display-set `code` selected inside
  `scheme-sync`'s `PublishModal`.
- Whether backend tolerates the `size: 99999` query from `PublishModal`.
- Whether a styling migration to SCSS Modules is wanted for this
  Emotion-only module — `NEEDS-TEAM-DECISION` if raised, not decided here.
