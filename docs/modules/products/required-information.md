# Required Information — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

Reconciled against current source in this pass; rewritten to `TEMPLATE.md`'s
16-section structure from the previous free-form document. Covers two
coupled submodules together, as the previous document did — this pairing is
kept, not split, per this task's own instruction: `required-information/`
(12 files, confirmed via `find src/modules/products/configuration/required-information
-type f | wc -l`) and `required-information-set/` (11 files, same command).
Both remain fully Redux-owned; neither has migrated to TanStack Query.

**Settled from the prior reconciliation report's open items:**

- Row 15's "unverifiable" flag on the ambient misspelled type files is now
  **CONFIRMED**: `find src/types -iname "*infomation*"` returns exactly
  `src/types/require-infomation.d.ts` and
  `src/types/require-infomation-set.d.ts` — both misspelled ("infomation"),
  both still the live ambient contracts for their respective submodules, and
  `find src/types -iname "*information*"` (correct spelling) returns
  nothing. No correctly-spelled type file exists anywhere as a replacement
  or alternative.
- Row 16/proposed-order item #7's cross-module coupling claim is
  **confirmed true but misattributed in the old document.** The old
  document attributed the customer-segmentation and order consumers to
  *both* submodules jointly. Re-verified per-file: all four cross-domain
  consumer files (`src/modules/users/customer/segmentation/components/table/criteria-info-table.tsx`,
  `.../segmentation/components/input-info-criteria.tsx`,
  `.../segmentation/components/form/info-customer-form.tsx`, and
  `src/modules/order/loan-order-list/component/additional-request.tsx`)
  import exclusively from **`required-information/`'s** slice
  (`watchMasterDataDetailById`, and in one case `getRequiredInformation`/
  `watchRequiredInformation`) — none imports anything from
  `required-information-set/`. `required-information-set/`'s own real
  cross-domain consumers are inside `products/configuration/`: the
  cash-loan and credit-card create/edit screens
  (`configuration/cash-loan/{create,edit}/index.tsx`,
  `configuration/credit-card/{create,edit}/index.tsx`), which dispatch
  `getRequiredInformationSet` directly. This correction is carried through
  §10/§11 below.

**Verification-gap limit (top 5; remainder in §15):**

1. Whether a direct load of `required-information/edit/:id` can submit a
   `PUT` before the detail fetch resolves — `edit/general-info.tsx:164`
   builds the update id from Redux state (`requiredInformationDetail?.id`),
   not from the route param, so a race on first load could target a stale
   or absent id — **NEEDS-VERIFICATION**, browser-only.
2. Whether `required-information/`'s view-page edit button being gated by
   the **sibling set module's** permissions
   (`view/form.tsx:49`, `REQUIRED_INFORMATION_SET_EDIT_CREDIT_CARD`/
   `_CASH_LOAN`) instead of its own `REQUIRED_INFORMATION_EDIT` is
   intentional — **NEEDS-TEAM-DECISION**.
3. Whether `required-information/`'s cross-domain consumer
   `additional-request.tsx` (order module) can safely read
   `masterDataOfType` without ever dispatching the fetch that populates it,
   relying entirely on another component (the segmentation criteria modal)
   having already dispatched it first — **NEEDS-VERIFICATION**, and
   compounded by `resetRequiredInformation` clearing that same map on
   `required-information/`'s own view-page unmount.
4. Whether the backend tolerates an empty `requiredInformationIds` array on
   the CSV export endpoint — `required-information/`'s export button is not
   disabled when nothing is selected — **NEEDS-VERIFICATION**.
5. Whether `required-information-set/`'s create route (which checks only
   the CREATE permission pair) returning the user to the list (which checks
   only VIEW) after a successful save is an intended permission gap for a
   CREATE-only, no-VIEW user — **NEEDS-TEAM-DECISION**.

## 1. Responsibility

Two related, but **not shared-state**, configuration features inside
`src/modules/products/configuration/`:

- **`required-information/`** manages individual "required information"
  field *definitions* — each a `RequireInformation`
  (`src/types/require-infomation.d.ts:43-70`) with a code, name, input type
  (TEXT, NUMBER, EMAIL, ADDRESS, DATE_TIME, PHONE_NUMBER, FAMILY_RELATIVE,
  DROP_DOWN, RADIO_GROUP), supply method (TYPING, SELECTION, RADIO_GROUP,
  COMPOSED), master-data configuration, and nested items. Covers
  list/search/paginate, CSV export, create, edit, view, and change history.
- **`required-information-set/`** manages *sets* of required-information
  items grouped and ordered per product line (CL/CD), with status
  (including batch activate/deactivate), and a mobile preview. Covers
  list/search, create, edit, view, single and batch status change.

The two are coupled by subject matter (a set selects from the definitions'
"eligible" pool) but have **separate Redux slices, separate ambient type
files, separate routes, separate permission constants, and no direct
file-to-file import of each other's internals** beyond one static-options
import (§10).

## 2. Entry points and routes

Both submodules' routes live in `src/routes/main.routes.tsx` and
`src/routes/form.routes.tsx`; `src/routes/index.tsx` is a thin shell
(`MasterLayout` → `MainLayout`/`BasicLayout` → `{mainRoutes}`/`{formRoutes}`)
and declares no routes of its own — the prior document's assumption that
routes live directly in `index.tsx` is corrected here.

### A. `required-information/`

| Action | Path | Route | Lazy page (`pages.tsx`) | Permission | Check kind |
| --- | --- | --- | --- | --- | --- |
| List | `/product/parameter/required-information` | `main.routes.tsx:193-200` | `ListRequiredInformation` (`:96-98`) | `REQUIRED_INFORMATION_VIEW` | single |
| Create | `.../required-information/create` | `form.routes.tsx:527-535` | `CreateRequiredInformation` (`:105-107`) | `REQUIRED_INFORMATION_CREATE` | single |
| Edit | `.../required-information/edit/:id` | `form.routes.tsx:537-545` | `EditRequiredInformation` (`:99-101`) | `REQUIRED_INFORMATION_EDIT` | single |
| View | `.../required-information/view/:id` | `form.routes.tsx:547-555` | `ViewRequiredInformation` (`:102-104`) | `REQUIRED_INFORMATION_VIEW` | single |

Every array above has one element, so OR vs. AND does not change any route
decision. Menu: `src/helpers/menus.helper.ts:311-316` (`Menu.requiredInformation`,
single permission `REQUIRED_INFORMATION_VIEW`). `PageURLs.ofRequiredInformation()`
at `src/utils/navigate.ts:189-191`.

### B. `required-information-set/`

| Action | Path | Route | Lazy page | Permission (named group **set-OR**) | Check kind |
| --- | --- | --- | --- | --- | --- |
| List | `/product/parameter/required-information-set` | `main.routes.tsx:204-213` | `ListRequiredInformationSet` | `REQUIRED_INFORMATION_SET_VIEW_CREDIT_CARD` \| `_VIEW_CASH_LOAN` | OR array |
| Create | `.../required-information-set/create` | `form.routes.tsx:558-568` | `CreateRequiredInformationSet` | `_CREATE_CREDIT_CARD` \| `_CREATE_CASH_LOAN` | OR array |
| Edit | `.../required-information-set/edit/:id` | `form.routes.tsx:571-581` | `EditRequiredInformationSet` | `_EDIT_CREDIT_CARD` \| `_EDIT_CASH_LOAN` | OR array |
| View | `.../required-information-set/view/:id` | `form.routes.tsx:584-594` | `ViewRequiredInformationSet` | `_VIEW_CREDIT_CARD` \| `_VIEW_CASH_LOAN` | OR array |

**Confirmed, re-verified:** these are genuinely cash-loan/credit-card-specific
permission pairs (`src/constants/permission.constant.ts:68-79`, string values
like `required_information_set:view:cash_loan`), not a generic
`REQUIRED_INFORMATION_SET_*` constant — the old document's claim holds. No
delete permission exists for either submodule. Menu:
`src/helpers/menus.helper.ts:317-324` (`Menu.requiredInformationSet`,
**set-OR** of the two VIEW constants). `PageURLs.ofRequiredInformationSet()`
at `src/utils/navigate.ts:192-193`.

**Component-level checks** (both submodules, default `some`/OR semantics,
`src/hooks/auth.hook.ts:27`):
- `required-information/list-information.tsx:246` (EXPORT_CSV, export
  button, not disabled on empty selection — §0 item 4) and `:262,301-302`
  (CREATE, create buttons).
- `required-information/view/form.tsx:49` — **anomaly, confirmed**: uses
  `hasPermission([REQUIRED_INFORMATION_SET_EDIT_CREDIT_CARD,
  REQUIRED_INFORMATION_SET_EDIT_CASH_LOAN])` to gate its own edit button,
  i.e. the **singular** module's view page checks the **set** module's
  permission pair, not its own `REQUIRED_INFORMATION_EDIT`. §0 item 2.
- `required-information-set/list-information-set.tsx:269,299` (**set-OR**
  create, create buttons), `:309` (**set-OR** edit, batch action bar).
- `required-information-set/view/form.tsx:44-52` — resolves per loaded
  product line: `'every'` (both EDIT permissions) when the set spans both
  `CD` and `CL`, otherwise `'some'` on the single relevant permission —
  confirmed dynamically resolved, not a static OR (content rule 14).

## 3. Directory map

### A. `required-information/` (12 files)

| File | Responsibility |
| --- | --- |
| `list-information.tsx` | List page: table, search, pagination, CSV export, create button |
| `options/documentType.ts` | Static option lists (`informationTypeOptions`, `supplyMethodOptions`, etc.) |
| `components/composedInputType.tsx` | Nested-item editor for `supplyMethod === 'COMPOSED'` |
| `components/extraInputType.tsx` | Nested extra-input editor, branches on `supplyMethod` |
| `components/masterDataTable.tsx` | Drag-sortable master-data option table (RADIO_GROUP, or SELECTION+INPUT_LIST) |
| `create/form.tsx` + `create/general-info.tsx` | Create page shell + form body |
| `edit/form.tsx` + `edit/general-info.tsx` | Edit page shell + form body |
| `view/form.tsx` + `view/general-info.tsx` + `view/history.tsx` | View shell, read-only detail, history tab |

### B. `required-information-set/` (11 files)

| File | Responsibility |
| --- | --- |
| `list-information-set.tsx` | List page: search, sort, paginate, batch status |
| `create/create-required-information-set.tsx` + `create/form.tsx` | Create form body + page shell |
| `edit/edit-required-information-set.tsx` + `edit/form.tsx` | Edit form body + page shell |
| `view/view-required-information-set.tsx` + `view/form.tsx` + `view/history.tsx` | View body, status-change shell, history panel |
| `components/grouped-required-information-table.tsx` | Grouped/ordered item table, drag-and-drop via `@dnd-kit/core`/`sortable`/`modifiers` |
| `components/required-information-mobile-preview.tsx` | Mobile preview rendering |
| `options/requiredInfos.tsx` | `isRequiredOptions` (Có/Không) |

## 4. Main runtime flows

### A. `required-information/`

```text
List: list-information.tsx:227-233 effect -> getRequiredInformation(query)
  -> GET required-informations/search -> items/pageInfo -> table (URL state via useQueryState)
CSV export: list-information.tsx:246-260 -> downloadListRequiredInformations(ids)
  -> GET required-informations/export-csv (blob, repeated query params) -> downloadBlob

Create: create/general-info.tsx:109-171 onFinish -> createRequiredInformation(formData)
  -> POST required-informations -> middleware: notify + navigate to list

Edit: edit/general-info.tsx:437-441 getRequiredInformationDetail(id) on mount
  -> form.setFieldsValue on every new detail reference (:385-430, no dirty-baseline guard)
  -> onFinish (:115-168) -> updateRequiredInformation({id: Number(detail?.id), formData})
     [id sourced from Redux detail, NOT the route param -- see §0 item 1]
  -> PUT required-informations/:id -> middleware: notify + navigate to view

View: view/form.tsx -> resetRequiredInformation() on unmount (clears masterDataOfType, §0 item 3)
  -> view/history.tsx reads a DIFFERENT slice: product-industry.slice's
     getListUpdatedHistories/watchIndustryPagination, entityType 'REQUIRED_INFORMATION'
```

### B. `required-information-set/`

```text
List: list-information-set.tsx -> getRequiredInformationSet -> GET required-information-sets/search
Batch activate: list-information-set.tsx:108 -> updateMultiActiveState
  -> PUT required-information-sets/${status}/batch (body: raw id array)
  -> reducer updates matching list rows' status in place

Create: create-required-information-set.tsx:169 -> createRequiredInformationSet
  -> POST required-information-sets -> middleware: notify + navigate to list

Edit: edit/form.tsx:102 getRequiredInformationSetDetail(id) on mount, reset on unmount (:90-95)
  -> updateRequiredInformationSet -> PUT required-information-sets/:id
  -> middleware: notify + navigate to view

View: view/form.tsx:55-70 updateStatusRequiredInformationSet({status, reason})
  -> PUT required-information-sets/:id/status -> re-dispatch getRequiredInformationSetDetail
```

Neither submodule uses TanStack Query anywhere (`grep -rln "@tanstack"` on
both directories returns nothing) — Redux remains the sole owner for both.

## 5. State ownership

| Submodule | Slice | Middleware | Broad `loading` flag | Unmount reset |
| --- | --- | --- | --- | --- |
| `required-information/` | `src/redux/slices/required-information.slice.ts` | `src/redux/middlewares/required-information.middleware.ts` | **CONFIRMED** — all 8 thunks (`getRequiredInformation`, `getRequiredInformationGroups`, `getRequiredInformationDetail`, `getAllMasterDataType`, `createRequiredInformation`, `updateRequiredInformation`, `getMasterDataDetailById`, `downloadListRequiredInformations`) share one `state.loading` | `resetRequiredInformation` (`view/form.tsx:35`) clears `requiredInformation`, `requiredInformationGroups`, `requiredInformationDetail`, `masterDataOfType`, `dataSourceMaster` — **not** `pagination`, `loading`, or `message` |
| `required-information-set/` | `src/redux/slices/required-information-set.slice.ts` | `src/redux/middlewares/required-information-set.middleware.ts` (plural `middlewares/`, correcting the old doc's singular path) | **CONFIRMED** — all 6 thunks share one `state.loading` | `resetRequiredInformationSet` clears **only** `requiredInformationSetDetail` — list, pagination, `loading`, `message` untouched |

**Parallel owner, confirmed (new finding, not in the old doc).**
`src/redux/slices/common.slice.ts` independently models overlapping domain
data for `required-information/`'s entity: its own
`getListRequiredInformations` (`category/required-information`),
`getRequiredInformationDetail`, and `getMasterDataDetailById` — against
*different* endpoints than this module's own slice
(`required-informations/${id}` vs.
`required-informations/${id}/assignable?context=PRODUCT&action=CREATE`).
Consumers of the `common.slice.ts` copy include `order-profile.tsx` and the
cash-loan `create/rule.tsx`/`edit/rule.tsx`/`view/rule.tsx` files — a second,
independent cache of similar-but-not-identical data, not a violation of any
single module's own ownership but a real two-owner situation at the domain
level, flagged in §13.

## 6. API boundaries

All endpoints below go through the global `apiFetcher`/`window.apiFetcher`;
neither submodule has a dedicated service file — thunks call `apiFetcher`
directly.

### A. `required-information/`

| Thunk | Method/endpoint |
| --- | --- |
| `getRequiredInformation` | `GET required-informations/search` |
| `getRequiredInformationGroups` | `GET required-information-group` |
| `getRequiredInformationDetail` | `GET required-informations/:id` |
| `getAllMasterDataType` | `GET masterdata/types` |
| `createRequiredInformation` | `POST required-informations` |
| `updateRequiredInformation` | `PUT required-informations/:id` |
| `getMasterDataDetailById` | `GET required-informations/:id` (same path as detail; stores into `masterDataOfType[code]`) |
| `downloadListRequiredInformations` | `GET required-informations/export-csv` (blob, `Accept: application/octet-stream`) |

### B. `required-information-set/`

| Thunk | Method/endpoint |
| --- | --- |
| `getRequiredInformationSet` | `GET required-information-sets/search` |
| `getRequiredInformationSetDetail` | `GET required-information-sets/:id` |
| `createRequiredInformationSet` | `POST required-information-sets` |
| `updateRequiredInformationSet` | `PUT required-information-sets/:id` |
| `updateStatusRequiredInformationSet` | `PUT required-information-sets/:id/status` (body `{status, reason}`) |
| `updateMultiActiveState` | `PUT required-information-sets/:status/batch` (body: raw id array) |

All endpoint paths and methods above are re-confirmed against current
source; both submodules' API surface matches what the old document claimed,
with the full paths now cited precisely.

## 7. Forms and validation

Neither submodule uses Zod (confirmed by grep in both directories) or React
Hook Form; both use AntD `Form`/`FormInstance` exclusively, wired through
`FormLayout`/`FormWrapper`/`useFormImperativeHandle`. Absent Zod on these
stable, long-running CRUD forms is not a validation gap per content rule 5.

**`required-information/`:** `Form.useForm` sites at
`create/general-info.tsx:87`, `edit/general-info.tsx:90`,
`view/general-info.tsx:86`. AntD `rules` with `VALIDATION_MESSAGE`. The
three conditional-requirement components (`ComposedInputType`,
`ExtraInputType`, `MasterDataTable`) all still exist and branch on
`supplyMethod`/`dataSourceType` as the old document described. Create and
edit are **not symmetric**: create's `masterData.map` has no null fallback
(`create/general-info.tsx:155`) while edit uses `(masterData ?? [])`
(`edit/general-info.tsx:149`); edit also strips a nested `id` that create
does not strip — confirmed drift between the two paths, flagged §13.

**`required-information-set/`:** `Form.useForm` sites at
`create-required-information-set.tsx:50`,
`edit-required-information-set.tsx:57`,
`view/view-required-information-set.tsx:51`, and `view/form.tsx:30`
(a separate `ReasonDisable` form for the status-change modal).
`GroupedRequiredInformationTable` still exists and is genuinely
drag-and-drop (`@dnd-kit/core` `DndContext`, `@dnd-kit/sortable`
`useSortable`), confirming the old document's claim. Within-group reordering
does not renumber `priority` the way cross-group reordering does — a
confirmed asymmetry, flagged §13.

## 8. Types and DTO organization

Both ambient contracts are confirmed live and confirmed misspelled (§0):

- **`required-information/`**: `src/types/require-infomation.d.ts` declares
  `NestedItemsType`, `DataSourceMasterType`, `MasterDataOfType`,
  `RequiredInformationGroup`, `RequireInformation`,
  `MasterDataInformationType`, and `RequiredInformationRequestType` as
  ambient globals (no `export` keyword). A separate, unrelated-but-similarly-
  named local type `NestedItems` (not `NestedItemsType`) is independently
  declared in each of `create/general-info.tsx:32`,
  `edit/general-info.tsx:36` (exported), and `view/general-info.tsx:34` —
  the ambient file references a global `NestedItems[]`
  (`require-infomation.d.ts:63,100`) that **no global declaration actually
  provides**; only the differently-named `NestedItemsType` exists globally.
  Whether this is caught by `tsc` depends on `skipLibCheck`, not checked
  here. A parallel, smaller type set also exists in `src/types/common.d.ts:178-199`
  (`RequiredInformationKeyValue`, `RequiredInformationWorkflow`,
  `RequiredInformationDetail`).
- **`required-information-set/`**: `src/types/require-infomation-set.d.ts`
  declares `RequiredInformationSet`, `RequiredInformationsType`,
  `RequiredInformationsFormRequestType`, and `RequiredInformationSetRequestType`
  as ambient globals. `RequiredInformationSet.requiredInformations` is typed
  as the narrower `RequiredInformationsFormRequestType[]` (`id`, `priority`,
  `isRequired` only), while the grouped table component also reads
  name/type fields on the same objects — a possible type under-specification,
  flagged §13 as `NEEDS-VERIFICATION`.

This ambient-plus-feature-local mix is `legacy-compatible` per
`.claude/ARCHITECTURE.md`, not itself a defect; the `NestedItems`/
`NestedItemsType` naming mismatch and the under-specified set type are
recorded as confirmed/likely risks, not as evidence that the overall pattern
is wrong.

## 9. Permissions

Fewer than ten permission constants total across both submodules combined,
below the content-rule-9 table threshold, except that `required-information-set/`'s
four actions each reuse the same two-permission OR pair per action
(credit-card/cash-loan), named once here as **set-OR** and referenced by
that name above (§2) rather than re-transcribed at each call site.

- `required-information/`: `REQUIRED_INFORMATION_VIEW`, `_CREATE`, `_EDIT`,
  `_EXPORT_CSV` (`src/constants/permission.constant.ts:133-136`).
- `required-information-set/`: `REQUIRED_INFORMATION_SET_{VIEW,CREATE,EDIT}_{CREDIT_CARD,CASH_LOAN}`
  (`:68-79`) — six constants, combined pairwise into **set-OR** per action.

The one confirmed cross-wiring: `required-information/`'s own view page
checks `required-information-set/`'s EDIT permissions to gate its edit
button (§2, §0 item 2) — every other component-level check stays within its
own submodule's constant family.

## 10. Shared and cross-domain dependencies

**Corrected per-submodule attribution (§0):**

- **`required-information/`'s real external consumers** (import
  `required-information.slice.ts` directly):
  - `src/modules/users/customer/segmentation/components/table/criteria-info-table.tsx:17`
    — reads `watchMasterDataDetailById` for dropdown options.
  - `src/modules/users/customer/segmentation/components/input-info-criteria.tsx:15`
    — same selector, same purpose.
  - `src/modules/users/customer/segmentation/components/form/info-customer-form.tsx:22-25`
    — dispatches `getMasterDataDetailById` and `getRequiredInformation`,
    reads both `watch*` selectors; the only one of the four that actually
    dispatches a fetch.
  - `src/modules/order/loan-order-list/component/additional-request.tsx:11,30,72-85`
    — reads `watchMasterDataDetailById` only, **never dispatches a fetch**;
    depends entirely on another mounted component (the segmentation form
    above) having already populated `masterDataOfType` (§0 item 3).
- **`required-information-set/`'s real external consumers** are inside
  `products/configuration/`, not outside `products/` at all:
  `cash-loan/{create,edit}/index.tsx` and
  `credit-card/{create,edit}/index.tsx` dispatch `getRequiredInformationSet`
  directly to populate their own "eligible sets" selection step, and
  `src/components/product-configuration/utils.tsx:567`'s
  `mapRequiredInformationSets` maps the response shape for those forms.
- **No file-to-file import exists between the two submodules themselves**,
  except one static, non-stateful import:
  `required-information-set/create/create-required-information-set.tsx:19`
  imports `informationTypeOptions` from
  `../../required-information/options/documentType` — a plain options
  array, not a slice or selector.
- **Shared search components depending on module internals (confirmed,
  both directions):** `src/components/forms/search/required-info-searcher.form.tsx:6`
  (used by `required-information/`'s list) imports
  `informationTypeOptions` from this module's own `options/documentType.ts`
  — a shared component reaching into a business module's internals, which
  `.claude/rules/01-architecture.md` says shared code should not do.
  `src/components/forms/search/required-info-set-searcher.form.tsx` is the
  analogous shared searcher for `required-information-set/`'s list.
- **`getListProductLines`/`common.slice.ts`:** consumed by the shared
  searcher forms (`document-set-searcher.form.tsx`,
  `group-product-list-searcher.form.tsx`, `required-info-set-searcher.form.tsx`)
  — this dependency belongs to the set/document-set side, not to
  `required-information/` itself, correcting the old document's
  undifferentiated mention of it.
- **Parallel domain-data owner:** `common.slice.ts` (§5) — not a consumer of
  either submodule's slice, but an independent second cache of similar
  `required-information` domain data, consumed by `order-profile.tsx` and
  the cash-loan rule files.

## 11. Consumers

- `required-information/`: the four cross-domain files in §10A; its own four
  page containers and their shared components
  (`ComposedInputType`/`ExtraInputType`/`MasterDataTable`,
  `required-info-searcher.form.tsx`); `src/components/product-configuration/utils.tsx`'s
  `mapRequireInfo` (ambient-type consumer); routing/menu/navigate files.
- `required-information-set/`: cash-loan/credit-card create/edit screens
  inside `products/configuration/` (§10B); its own four page containers;
  `required-info-set-searcher.form.tsx`; routing/menu/navigate files.
- Each submodule's ambient ``.d.ts`` file is consumed only by its own
  submodule plus the shared searcher/mapper files named above — no
  unexpected consumer was found for either.

## 12. Pattern classification

| Pattern | Classification |
| --- | --- |
| Redux thunks, inline `apiFetcher`, no service layer (both submodules) | `legacy-compatible` — existing Redux-owned resources, migrate one resource per dedicated PR if ever scheduled |
| AntD `Form`/`FormInstance`, `FormLayout`/`useFormImperativeHandle` (both) | `target-compatible` |
| Absent Zod on stable CRUD forms (both) | not a gap, per content rule 5 |
| Broad shared `loading` flag per slice (both) | `legacy-compatible`, known repository-wide pattern |
| Ambient misspelled `.d.ts` contracts (both) | `legacy-compatible`; renaming has a wide, cross-domain import impact (§14) |
| `required-information/` view page checking the sibling set module's permission constants | confirmed cross-wiring, not a template violation but flagged §0/§13 |
| `required-information-set/`'s `GroupedRequiredInformationTable` using `@dnd-kit` | `target-compatible` UI pattern |
| Shared search-form components importing module-internal option files | deviation from `.claude/rules/01-architecture.md`'s shared-code boundary; `legacy-compatible`, not fixed |
| Parallel `common.slice.ts` cache of `required-information/`'s domain data | two-owner pattern at the domain level, flagged §13, not a single-module ownership violation |

## 13. Technical risks

Ordered by decreasing consequence, per content rule 8.

- **Permission cross-wiring on `required-information/`'s view page.**
  `view/form.tsx:49` gates the edit button with
  `required-information-set/`'s EDIT permissions instead of this module's
  own `REQUIRED_INFORMATION_EDIT`. A user with `required_information:edit`
  but no set-edit permission sees no edit button yet can still reach the
  edit route directly by URL; a user with set-edit but not
  `required_information:edit` sees the button and is blocked by the route
  guard. `NEEDS-TEAM-DECISION` (§0 item 2).
- **Edit save targets a Redux-sourced id, not the route id.**
  `required-information/edit/general-info.tsx:164` uses
  `Number(requiredInformationDetail?.id)` for the PUT target. A race on
  first page load could submit against a stale or absent id (§0 item 1).
- **Cross-domain consumer reads state it never populates.**
  `additional-request.tsx` (order module) reads `masterDataOfType` without
  ever dispatching the fetch that fills it, and `required-information/`'s
  own view page clears that same map on unmount via
  `resetRequiredInformation` — a real risk of the order screen seeing an
  empty map depending on navigation order (§0 item 3).
- **Two independent caches of overlapping domain data.**
  `common.slice.ts`'s own `getListRequiredInformations`/
  `getRequiredInformationDetail`/`getMasterDataDetailById` read different
  endpoints than `required-information/`'s own slice for materially the
  same entity; `order-profile.tsx` and the cash-loan rule files use the
  `common.slice.ts` copy, so the two caches can disagree (§5, §10).
  **Cross-domain state.**
- **Create/edit transformation asymmetry in `required-information/`.**
  Create's `masterData.map` has no null fallback while edit's does; edit
  strips a nested `id` field that create never adds — confirmed drift
  between the two paths that the old document's "duplicated logic can
  drift" risk already anticipated, now concretely located.
- **`GroupedRequiredInformationTable`'s within-group reorder does not
  renumber `priority`** the way its cross-group reorder does — whether
  downstream consumers rely on a consistent `priority` ordering within a
  group is `NEEDS-VERIFICATION`.
- **Shared search-form components import module-internal files.**
  `required-info-searcher.form.tsx` imports
  `required-information/options/documentType.ts` directly — a shared
  component depending on a business module's internals (§10).
- **History tab shares another module's pagination state.**
  `required-information/view/history.tsx` reads/writes
  `product-industry.slice`'s `watchIndustryPagination`, shared with the
  unrelated industry-product module's own history screens — two screens
  writing one pagination object can clobber each other if both are open.
  **Shared loading/pagination flag.**
- **Permission gap on `required-information-set/`'s create flow.** The
  create route checks only the CREATE pair; the list it returns to checks
  only VIEW (§0 item 5).
- **Minor:** hardcoded Vietnamese sidebar labels in
  `required-information/`'s `view/form.tsx:22,27`,
  `create/form.tsx:22-23`, `edit/form.tsx:24-25` (not `t()` keys); a
  debug `console.log` in `components/extraInputType.tsx:35`; dead/commented
  code in `edit/general-info.tsx:159` and `required-information-set/edit/edit-required-information-set.tsx:21,261-263`;
  a tautological truthy guard at `required-information/create/general-info.tsx:125-129`;
  `any` casts at several sort/filter call sites in both submodules' list
  pages.

## 14. Areas to avoid touching

- Do not change `resetRequiredInformation`'s `masterDataOfType`-clearing
  behavior, or the fetch/selector names either slice exports, without first
  re-auditing all four cross-domain consumer files in §10A — their only
  contract with this module is importing specific thunk/selector names by
  identity.
- Do not rename either misspelled ambient type file
  (`require-infomation.d.ts`/`require-infomation-set.d.ts`) as an
  incidental cleanup; both are referenced as unimported globals from many
  files inside and outside their owning submodule, and a rename is a
  wide-impact, cross-domain change outside any small fix's scope.
- Do not resolve the permission cross-wiring in §13 (view-page edit button)
  without a team decision — correcting it either direction is a real
  behavior change, not a bug obviously safe to "just fix."
- Do not touch `common.slice.ts`'s parallel required-information thunks, or
  `order-profile.tsx`/the cash-loan rule files that consume them, as part of
  a change scoped to this module alone.
- Do not migrate either slice to TanStack Query as an incidental
  improvement; per the adopted 2026-11-04 state-ownership policy this is an
  explicit, dedicated-PR, one-resource-at-a-time migration, and the
  `common.slice.ts` parallel copy would need its own resolution first.

## 15. Open questions

- The five verification gaps in §0.
- Whether `tsc`'s `skipLibCheck` setting means the ambient `NestedItems[]`
  reference in `require-infomation.d.ts` (with no matching global
  declaration) is silently tolerated or would actually fail a strict build.
- Whether `required-information-set/`'s `RequiredInformationSet.requiredInformations`
  type (narrower than what the grouped table component actually reads off
  the same objects) should be widened, or whether the table is reading
  fields the type doesn't promise by convention rather than by contract.
- Whether the two independent `common.slice.ts`/module-slice caches of
  required-information domain data are intended to ever converge, or are
  accepted as permanently separate.
