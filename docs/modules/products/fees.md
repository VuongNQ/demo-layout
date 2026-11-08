# Fee Definitions — Module Documentation

> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

Reconciled in this pass against revision `8562c125`, branch `improve/vuongnq`,
2026-11-05. Method: direct `find`/read of all 9 files under
`src/modules/products/parameter/fee/` by this session, plus a dedicated
read-only `codebase-analyzer` subagent pass that traced routes, permissions,
the Redux slice/middleware, consumers, and the cross-module coupling claims
outward from the folder. `find src/modules/products/parameter/fee -type f |
wc -l` → **9**, matching
`docs/reports/2026-11-04/products-docs-reconciliation.md`'s figure exactly —
no discrepancy to record.

This reconciliation resolves row 16 and proposed-order item #6 of that
report. The `src/utils/form.ts` cross-module coupling claim and the "shared
import infrastructure invokes fee import actions" claim **both still hold**,
and are restated with exact evidence in §10 rather than rediscovered from
scratch. One literal claim in the previous version of this document was
**REFUTED**: the list dispatches a thunk named `getListFeeDefinition`, not
`getFeeDefinitions` (no such export exists in the slice). Two other claims
were **partially refuted** — see §0 verification gaps below and §5.

Verification gaps (at most 5, ordered by consequence; remaining gaps are in §15):

1. Whether backend enforcement actually matches the frontend's record-scoped `VIEW`/`EDIT` redirect-after-fetch pattern (§9, §13) — `NEEDS-VERIFICATION`.
2. Whether a `PUT fee-definitions/NaN/...` request (possible when `edit-fee.tsx:58`'s `Number(feeDefinition?.id)` runs against a cleared/failed detail fetch) is rejected server-side or silently mishandled — `NEEDS-VERIFICATION`.
3. Whether the four duplicate global `UpdateStatus` declarations across `.d.ts` files (§8) resolve predictably given `tsconfig.app.json:10`'s `skipLibCheck: true` — `NEEDS-VERIFICATION`.
4. Whether the product-create pages (`cash-loan/create/index.tsx:546`, `credit-card/create/index.tsx:596`) writing the same `getListFeeDefinition`-owned list state causes an observable stale-list overwrite when a user returns to the fee list — `NEEDS-VERIFICATION`.
5. Backend fee-calculation rules, status-transition rules, and import file-schema validation — `NEEDS-VERIFICATION`, unchanged from the previous version of this document.

## 1. Responsibility

Admin screens for reusable fee definitions ("phí khác") consumed as
reference data by cash-loan and credit-card product configuration. Covers a
searchable/sortable/paginated list with batch activate/deactivate and CSV
export; create, edit, and view (with a status-change reason modal and a
history tab); and a bulk-import workflow (template download, upload,
valid/invalid preview tabs, and confirm). State and API live in
`src/redux/slices/fee-definition.slice.ts` and
`src/redux/middlewares/product-fee-list.middleware.ts`; the import UI itself
is mostly shared components under `src/components/forms/import/`, not local
to this folder.

## 2. Entry points and routes

| Path | Declared in | Lazy export (`pages.tsx`) | Layout | Permission (OR array) |
| --- | --- | --- | --- | --- |
| `product/parameter/product-fee-list` | `main.routes.tsx:266-275` | `:27` `ProductFeeList` | `MainLayout` | `[PRODUCT_FEE_VIEW_CREDIT_CARD, PRODUCT_FEE_VIEW_CASH_LOAN]` (`:272`) |
| `.../create` | `form.routes.tsx:641-650` | `:38` `CreateFee` | `BasicLayout` | `[PRODUCT_FEE_CREATE_CREDIT_CARD, PRODUCT_FEE_CREATE_CASH_LOAN]` (`:647`) |
| `.../view/:id` | `form.routes.tsx:651-660` | `:39` `ViewFee` | `BasicLayout` | `[PRODUCT_FEE_VIEW_CREDIT_CARD, PRODUCT_FEE_VIEW_CASH_LOAN]` (`:657`) |
| `.../edit/:id` | `form.routes.tsx:661-670` | `:40` `EditFee` | `BasicLayout` | `[PRODUCT_FEE_EDIT_CREDIT_CARD, PRODUCT_FEE_EDIT_CASH_LOAN]` (`:667`) |

All four are `WithGuard` wrapping `AuthGuard`. `GuardedPage`
(`src/guards/index.tsx:32`) evaluates `permissions.some(...)` — a kind-2 OR
array per `TEMPLATE.md` rule 14, not a single permission — and navigates to
`PageURLs.of404()` before mounting the page on failure. All six
`PRODUCT_FEE_*` constants exist at `src/constants/permission.constant.ts:99-104`
(view/create/edit × cash-loan/credit-card); no others exist for this
feature.

**Permissions threshold table** (6 constants; two multi-permission arrays
are reused across route and component layers, triggering `TEMPLATE.md` rule
9's table requirement):

| Permission | Route (list/create/view/edit) | Menu | Component |
| --- | --- | --- | --- |
| `PRODUCT_FEE_VIEW_CASH_LOAN` | list, view (`FEE_VIEW_GROUP`) | menu entry | — |
| `PRODUCT_FEE_VIEW_CREDIT_CARD` | list, view (`FEE_VIEW_GROUP`) | menu entry | — |
| `PRODUCT_FEE_CREATE_CASH_LOAN` | create (`FEE_CREATE_GROUP`) | — | `fee-list.tsx:386,397,432`; `create-fee.tsx:138` |
| `PRODUCT_FEE_CREATE_CREDIT_CARD` | create (`FEE_CREATE_GROUP`) | — | `fee-list.tsx:386,397,432`; `create-fee.tsx:135` |
| `PRODUCT_FEE_EDIT_CASH_LOAN` | edit (`FEE_EDIT_GROUP`) | — | `fee-list.tsx:443`; `edit-fee.tsx:165`; `edit/form.tsx:78`; `view/form.tsx:138,154-155` |
| `PRODUCT_FEE_EDIT_CREDIT_CARD` | edit (`FEE_EDIT_GROUP`) | — | `fee-list.tsx:443`; `edit-fee.tsx:162`; `edit/form.tsx:75`; `view/form.tsx:135,154-155` |

`FEE_VIEW_GROUP = [PRODUCT_FEE_VIEW_CREDIT_CARD, PRODUCT_FEE_VIEW_CASH_LOAN]`
(route + menu — named group, referred to by name below).
`FEE_CREATE_GROUP = [PRODUCT_FEE_CREATE_CREDIT_CARD, PRODUCT_FEE_CREATE_CASH_LOAN]`
(route + the create button, the import/export dropdown container, and the
empty-state create button in `fee-list.tsx`).
`FEE_EDIT_GROUP = [PRODUCT_FEE_EDIT_CASH_LOAN, PRODUCT_FEE_EDIT_CREDIT_CARD]`
(route + `fee-list.tsx:443`'s batch-status summary).

**Record-scoped checks are individual, not array-OR**: `edit/form.tsx:75,78`
and `view/form.tsx:135,138` each check one application-type-specific
permission against the loaded record's application type (e.g. "record is
`CREDIT_CARD` and user lacks `PRODUCT_FEE_EDIT_CREDIT_CARD`") — this is an
AND of application-type-match and single-permission-check, confirmed by
reading the JSX directly, not inferred from the array pattern above.

**Menu**: `src/helpers/menus.helper.ts:202-208` — label `t('Menu.productFee')`,
link `PageURLs.ofProductFeeList()`, `requiredPermissions:
[PRODUCT_FEE_VIEW_CREDIT_CARD, PRODUCT_FEE_VIEW_CASH_LOAN]` (`FEE_VIEW_GROUP`, `:207`).

**PageURLs**: `src/utils/navigate.ts:185-187` defines only
`ofProductFeeList()`. There are **no builders for create/view/edit** —
those routes are hardcoded string paths at `edit/form.tsx:38`,
`view-fee.tsx:43`, `history.tsx:39`, and at several external deep-link
sites (`product-configuration/utils.tsx:329`, `group-list-product/utils.tsx:139`,
and multiple `other-info.tsx` files for cash-loan/credit-card/group-list-product).
This is a pre-existing gap in `PageURLs` coverage for this feature, not
introduced by this reconciliation — recorded in §13.

## 3. Directory map

| File | Responsibility |
| --- | --- |
| `fee-list.tsx` | List page: URL-state search/sort/page, row selection, batch status, CSV export, template download, and the import modal (create/import/export buttons). |
| `create/form.tsx` | Route page for create: one-step `FormLayout` rendering `create-fee.tsx`, cancel-confirm modal. |
| `create/create-fee.tsx` | AntD create form: builds `{...values, status}` and dispatches `createFeeDefinition`. |
| `edit/form.tsx` | Route page for edit: fetches detail by route id, redirects to 404 on an application-type/permission mismatch **after** the fetch completes. |
| `edit/edit-fee.tsx` | AntD edit form: hydrates via `setFieldsValue`, dispatches `editFeeDefinition({ id: Number(feeDefinition?.id), formData })`; `code` field disabled. |
| `view/form.tsx` | Route page for view: fetches detail, status-toggle with a reason modal, resets detail state on unmount, redirects on a `VIEW` permission/application-type mismatch. |
| `view/view-fee.tsx` | Read-only form; fetches its own detail copy independent of `view/form.tsx`'s fetch (§13 duplicate-fetch risk). |
| `view/history.tsx` | History tab; reads and dispatches against `product-industry.slice.ts`'s shared history state with `entityType: 'FEE_DEFINITION'` (§10). |
| `options/fee.ts` | Constants only: `applicationScopeOptions`, `suffixFeeOptions`, `calculationMethodOptions`, `collectionMethodOptions`. No types/enums. |

## 4. Main runtime flows

Slice = `fee-definition.slice.ts`; middleware = `product-fee-list.middleware.ts`.

- **List**: `fee-list.tsx:207-227` dispatches `getListFeeDefinition` → `GET api/admin/portal/v1/fee-definitions` (slice `:30-55`, endpoint at `:33`). Search (`:246-257`) applies a default sort only when no filter is set; sort (`:229-244`) always resets to the first page. Failure clears the list (slice `:49-53`) and middleware notifies (`:30-40`).
- **Create**: `POST api/admin/portal/v1/fee-definitions` (slice `:79-100`, endpoint `:82`). Success notification and navigation to the list live in middleware (`:54-67`); failure notification `:69-80`.
- **Edit**: `PUT api/admin/portal/v1/fee-definitions/${id}` (slice `:102-121`, endpoint `:105`). Middleware success notifies and navigates via `getViewUrl()` (`common.ts:188-190`, derived from `window.location.pathname`) (`:82-94`); failure `:96-106`.
- **View detail**: `GET api/admin/portal/v1/fee-definitions/${id}` (slice `:57-77`, endpoint `:60`), fetched independently at three sites: `view/form.tsx:117-130`, `view-fee.tsx:54-58`, and `history.tsx:91-95` on history-tab mount.
- **Single status change**: `view/form.tsx:42-57` dispatches `updateStatusFeeDefinition` → `PUT api/admin/portal/v1/fee-definitions/${id}/${status}` with `{reason}` body (slice `:123-144`, endpoint `:126`); deactivation requires a reason (`view/form.tsx:67-74`); the component then unconditionally refetches detail (`:55`). Not record-application-type-scoped — see §13.
- **Batch status**: `fee-list.tsx:184-205` dispatches `updateMultiStatusFeeDefinition` → `PUT api/admin/portal/v1/fee-definitions/${status}/batch` with an ID array body (slice `:146-170`, endpoint `:149`); the reducer patches the list locally (`:158-164`).
- **CSV export**: `fee-list.tsx:307-318` dispatches `downloadListFeeDefinitions` → `POST api/admin/portal/v1/fee-definitions/export-csv`, `responseType: 'blob'`, downloaded as `fee-definitions.csv` (slice `:172-199`, endpoint `:175`, filename `:184`). Gated behind `FEE_CREATE_GROUP`, not a view permission — see §13.
- **Import template**: `GET api/admin/portal/v1/fee-definitions/import/template`, downloaded as `fee_import_template.csv` (slice `:201-220`, endpoint `:204`).
- **Import upload** (not in the fee slice — shared component): `src/components/forms/import/upload-file.tsx:56-75` — `POST api/admin/portal/v1/${type}/import` (`:58`) then `PUT .../import/${idList}` (`:68`), where `EEndPointImportType.FEE = 'fee-definitions'` (`src/enums/common.enum.ts:11`).
- **Import preview**: shared tabs (`valid-file-import.tsx`, `invalid-file-import.tsx`) each dispatch `getListFeeDefinitionImport` → `GET api/admin/portal/v1/fee-definitions/import/${id}` (slice `:222-244`, endpoint `:224`), using its own `isLoadingFeeDefinitionImport` flag, separate from the list/detail/mutation flag (§5).
- **Import confirm**: `fee-list.tsx:344-364` dispatches `confirmImportListFeeDefinition` → `POST api/admin/portal/v1/fee-definitions/import/${id}/confirm` (slice `:246-264`, endpoint `:249`); on success the component itself refreshes the list (`:356-360`).

Ownership split: the slice owns transport, loading, and list/detail/pagination
state; the middleware owns create/edit/status/batch/export/template/confirm
notifications and create/edit navigation; some components also notify
directly (`create/form.tsx:26-31`, `fee-list.tsx:347-350`,
`upload-file.tsx:82-89,132`) — a mixed-ownership pattern, not a single clean
layer boundary.

## 5. State ownership

`fee-definition.slice.ts` is registered at `src/redux/slices.ts:4,51`; its
listener middleware at `src/redux/store.ts:9,56`. The slice's internal name
is `'fee-destination'` (`:27`) — a pre-existing typo affecting only action
type strings, not behavior.

**Revised from the previous version of this document**: it is **not** one
single broad loading flag covering list/detail/mutation/import. There is
one shared flag (`:7`) across list/detail/create/edit/status/batch/export/template/confirm,
**plus a separate `isLoadingFeeDefinitionImport` flag** (`:14`, set at
`:230-243`) for the import-preview fetch, **plus local component state** for
the upload step itself (`upload-file.tsx:45`). So import has at least two
additional, independent loading indicators beyond the slice's main flag.

`resetFeeDefinition` (`:271-273`) is dispatched only on the view page's
unmount (`view/form.tsx:110-115`) and on a rejected detail fetch
(`:73-74`) — **not** on leaving create or edit, contrary to a blanket
"clears detail state when screens leave" reading of the previous document.
`resetFeeDefinitionImport` (`:275-278`) clears the import list/pagination
separately.

No thunk has a request ID, `AbortSignal`, or stale-response guard; query
arguments are untyped (`Record<string, any>` at `:31`, `:223`). The
middleware registers 16 listeners but none for `getFeeDefinitionsDetail.fulfilled`
or the list's `fulfilled` case — notification/navigation there is entirely
component-driven or absent.

## 6. API boundaries

All fee endpoint strings are embedded directly in the slice's thunks; there
is no fee service file — `src/services/products/` has no fee-named file,
and there is no `parameter/fee/services/` folder (confirmed via Glob/Grep).
This is **LEGACY-COMPATIBILITY** under `.claude/rules/03-api-service.md`'s
service-location convention (adopted 2026-10-29): an existing Redux-owned
server resource whose endpoints were never moved to a service, not a
deviation from a convention it should already be following — no new service
was added here that would be required to target `src/services/products/`.

Two shared import components also call `apiFetcher` directly, bypassing any
service layer: `valid-file-import.tsx:118-130` and
`invalid-file-import.tsx:121-130` (`GET api/admin/portal/v1/fee-definitions`,
though the `valid` file's call sits behind a `PRODUCT`/`PRODUCT_MARKETING`
guard not reached for the `FEE` import type) and
`upload-file.tsx:56-75` (import POST/PUT). These are pre-existing,
**LEGACY-COMPATIBILITY**, and must not be copied as a pattern into new code.

## 7. Forms and validation

Ant Design `Form`/`FormInstance` only, confirmed in all four form files
(`create-fee.tsx:35`, `edit-fee.tsx:39`, `view-fee.tsx:33`,
`view/form.tsx:30`). No Zod and no React Hook Form anywhere in this folder
(grep-confirmed). Required-field rules: `code` (`create-fee.tsx:84-92`;
`edit-fee.tsx:111-119`), `name` (`create:98-106`; `edit:125-133`),
`applicationScope` (`create:123-130`; `edit:150-157`), `calculationMethod`
(`create:175-182`; `edit:202-209`), `feeRate` plus a custom validator
(`create:210-242`; `edit:237-269`), `collectionMethod`
(`create:259-266`; `edit:286-293`).

The percentage cap on `feeRate` (rejects > 100) runs only when
`calculationMethod` is set and not `FLAT_FEE` (`create:215-230`;
`edit:243-256`); there is no lower-bound check (`NEEDS-VERIFICATION` for the
`SuffixInput` control's own behavior). Application-type-dependent option
filtering (credit-card drops `PERCENTAGE_PER_YEAR` and relabels
`LOAN_PERCENTAGE`; `collectionMethod` is restricted to `ONCE_TIME` for
credit-card) is an option-list filter, not a validation rule
(`create:185-204, 269-277`; `edit:212-231, 296-304`).

**Create and edit are confirmed parallel, not shared**: each owns its own
`onFinish`, `onFieldsChange`, rule set, and inline `{...values, status}`
payload construction (`create:41-51`; `edit:49-59`). Their option imports
even differ today: `create-fee.tsx:15` and `view-fee.tsx:20` import
`calculationMethodOptions` from the **add-on** module's
`options/fee.ts`, while `edit-fee.tsx:14` imports from this folder's own
`options/fee.ts` — the two files' option values are currently identical, but
nothing enforces that they stay identical (§13, §10 two-way dependency).

Validation execution: `FormLayout.validateAllForm` calls
`form.validateFields()` (`layouts/form.layout.tsx:119-135`), then
`submitForm`; both create and edit wire `onFinish` to **both** the AntD
`<Form onFinish>` prop and the imperative `submitForm` handle
(`create:53-59`; `edit:80-86`), but only `submitForm` is actually invoked by
`FormLayout` today, so this does not cause a double dispatch — recorded as a
low-consequence latent risk in §13, not a current defect.

## 8. Types and DTO organization

`src/types/fee-definition-list.d.ts` (ambient global, no top-level export):
`FeeDefinitionType` (`:1-12`, `updatedDate: Dayjs`, `feeRate: number`,
`status: string`), `FeeDefinitionRequestType` (`:14-25`, `status: boolean`),
`UpdateStatus` (`:27-31`), `FeeDefinitionImportType` (`:33-55`),
`ExportFeeDefinitionQuery` (`:57-68`, `payload.ids: string[]`).

`UpdateStatus` is declared as a **duplicate global in four separate `.d.ts`
files** (`fee-definition-list.d.ts:27`, `status.d.ts:1`,
`product-addon-list.d.ts:97`, `product-document-set.d.ts:79`);
`tsconfig.app.json:10` sets `skipLibCheck: true`, which hides any resulting
diagnostic. Which declaration TypeScript actually resolves is
`NEEDS-VERIFICATION`.

`options/fee.ts` exports constants only — no types or enums.
`PaymentMethod`/`CalculationMethod`/`CollectionMethod` come from the
existing ambient `src/enums/fee-method.enum.ts`. Local `FormValues` shapes
in each form file are unexported.

No runtime guards exist on any response in this folder. Observed type
drift: `feeRate: number` in the ambient type vs. form state reset to the
string `''` on calculation-method change (`create:67`; `edit:94`);
`status: string` in one ambient type vs. `status: boolean` in the request
type; `updatedDate: Dayjs`'s actual runtime shape is `NEEDS-VERIFICATION`.

## 9. Permissions

Covered fully in §2. Component-level `useHasPermission` calls inside this
folder: `fee-list.tsx:386` (create button, `FEE_CREATE_GROUP`), `:397`
(import/export dropdown container, same group — note a dead inner ternary
at `:402`, unreachable because of the enclosing `&&` at `:397`), `:432`
(empty-state create button), `:443` (batch-status summary,
`FEE_EDIT_GROUP`); `create-fee.tsx:135,138` and `edit-fee.tsx:162,165`
(option-list filters by application type); `edit/form.tsx:75,78` and
`view/form.tsx:135,138` (record-scoped redirect, run **after** the detail
fetch completes — whether content renders before the redirect fires is
`NEEDS-VERIFICATION`); `view/form.tsx:154-155` (update button/status toggle
visibility — gated on *any* `EDIT` permission, **not** scoped to the loaded
record's own application type, unlike the redirect above — see §13).

## 10. Shared and cross-domain dependencies

**(a) `src/utils/form.ts` imports fee options — CONFIRMED**:
`src/utils/form.ts:2` — `import { calculationMethodOptions } from
'@/modules/products/parameter/fee/options/fee'` — used inside
`mapProductFeesCalculate` (`form.ts:321-341`, cash-loan branch at `:330`).
Its own consumer is `src/components/product-configuration/utils.tsx:9,280`.
This restates the reconciliation report's claim; it still holds exactly as
described.

**(b) Shared import infrastructure invokes fee import actions — CONFIRMED,
with precise scope**: `src/components/forms/import/import-file-form.tsx:11,48-49`
imports and dispatches `resetFeeDefinitionImport` for the `FEE` import
type; `src/components/forms/import/list/valid-file-import.tsx:12,164-167`
and `invalid-file-import.tsx:12,166` import and dispatch
`getListFeeDefinitionImport`. These same shared components are also used by
unrelated modules for their own import types
(`src/modules/users/operator/user-operator-list/list.operator.tsx:38,213`;
`src/modules/products/configuration/cash-loan/CashLoanProductList.tsx:56,498`;
`src/modules/products/configuration/credit-card/CreditCardProductList.tsx:52,401`)
— i.e. the shared import UI is generic across feature types, and fee is one
of several consumers, not a fee-specific integration. `confirmImportListFeeDefinition`
and the template download, however, are dispatched **only** from
`fee-list.tsx` — not shared.

**Other imports into this folder from outside it**:
`fee-searcher.form.tsx:6` (`applicationScopeOptions`),
`product-configuration/utils.tsx:13`, `group-list-product/utils.tsx:10`
(`../../parameter/fee/options/fee`), and the shared
`valid-file-import.tsx:14`/`invalid-file-import.tsx:14`.

**Reverse dependency — a two-way coupling**: this folder itself imports
from the **add-on** module's options
(`create-fee.tsx:15`, `view-fee.tsx:20`, and the shared
`valid-file-import.tsx:15`/`invalid-file-import.tsx:15` all import
`calculationMethodOptions` from `add-on/options/fee.ts`, not from this
folder's own `options/fee.ts`). `edit-fee.tsx:14` is the one file in this
feature using this folder's own copy. The two files' values are identical
today but nothing enforces that — see §13.

**View history writes into a different module's Redux state**:
`view/history.tsx:6-10` reads `watchListUpdatedHistory`/
`watchIndustryPagination` and dispatches `getListUpdatedHistories` from
`product-industry.slice.ts` with `entityType: 'FEE_DEFINITION'`
(`history.tsx:53`; endpoint `GET
api/admin/portal/v1/request-application/${id}/audit`,
`product-industry.slice.ts:180`) — fee history shares pagination and list
state with the industry-product module's slice rather than owning its own.
`history.tsx:22` also imports `convertFieldActionType` from
`industry-product/ultis.tsx:17`, an existing cross-domain dependency shared
with many other `view/history.tsx` files repository-wide (see
`docs/modules/products/OVERVIEW.md` "External consumers of
product-owned internals").

## 11. Consumers

**Loading-flag readers** (16 files outside this folder read
`watchFeeDefinitionLoading`): `contents/t&c/{create,edit,view}/form.tsx`,
`contents/t&c-place/{create,edit,view}/form.tsx`,
`products/add-on/{edit,view}/form.tsx`,
`products/parameter/document-set/view/form.tsx`,
`products/parameter/group-document-list/edit/form.tsx`,
`products/parameter/document-list/edit/form.tsx`,
`users/operator/user-operator-list/create/form.tsx`,
`users/operator/group-permission/view/form.tsx`,
`users/customer/segmentation/create/form.tsx`,
`users/affiliate-partner/{create,edit}/form.tsx`.

**Product-create pages writing this feature's own list state**:
`products/configuration/credit-card/create/index.tsx:28-29,173,546` and
`products/configuration/cash-loan/create/index.tsx:34-35,83,596` both
dispatch `getListFeeDefinition` with `size: 99999, status: ACTIVE` and read
the same `watchListFeeDefinition` selector the fee list page uses — they
overwrite the same Redux-owned list state the fee list reads (§13 risk).

**A separate, unrelated fee-reads path**: `src/redux/slices/common.slice.ts:683-706`'s
`getListFeeDefinitions` hits a **different** endpoint
(`GET .../fee-definitions/assignable`), not this folder's slice; and
`display-information-set.service.ts:53` hits the same `assignable`
endpoint. The previous document's claim that "product and add-on
configuration load fee definitions as reference data" is true, but through
this separate `common.slice.ts` path, not through `fee-definition.slice.ts`
— a distinction the previous document did not draw.

**Deep links to the view route** (hardcoded, not via `PageURLs` — see §2):
`product-configuration/utils.tsx:329`, `group-list-product/utils.tsx:139`,
and multiple `other-info.tsx` files for cash-loan/credit-card/group-list-product
view/edit/create.

**Routing/menu/store wiring**: `pages.tsx:27,38-40`;
`main.routes.tsx:24,267-275`; `form.routes.tsx:21-23,642-670`;
`menus.helper.ts:203-208`; `navigate.ts:185-187`; `store.ts:9,56`;
`slices.ts:4,51`. **Enum**: `common.enum.ts:11`
(`EEndPointImportType.FEE = 'fee-definitions'`, used to build the shared
import endpoint).

## 12. Pattern classification

Redux-owned server resource with listener middleware:
**LEGACY-COMPATIBILITY** per `.claude/rules/04-state-management.md`
"Server state ownership (adopted 2026-11-04)" — an existing Redux-owned
resource, not a candidate for incidental migration during unrelated work.
Endpoints embedded in slice thunks with no service file: **LEGACY-COMPATIBILITY**
per `.claude/rules/03-api-service.md` (§6 above). The two shared import
components' direct `apiFetcher` calls are also **LEGACY-COMPATIBILITY** and
must not be used as a model for new code. Request-specific state/stale-response
guards are absent, which is a gap against `.claude/rules/04-state-management.md`'s
general guidance, not something this pass is scoped to fix. Forms:
AntD Form state ownership is target-compatible; the duplicated-validator,
no-Zod style is **LEGACY-COMPATIBILITY**. Styling (Emotion `css` prop
throughout, no `.module.scss`) and i18n (mostly hardcoded Vietnamese
literals) are both **LEGACY-COMPATIBILITY**.

## 13. Technical risks

- **No request-ID or stale-response guard on list/detail, with external writers**: `fee-definition.slice.ts:30-77` has no cancellation or ordering guard, and the product-create pages at `credit-card/create/index.tsx:546` and `cash-loan/create/index.tsx:596` write the exact same list state the fee list reads. An out-of-order response from either source could overwrite newer state. `NEEDS-VERIFICATION` on observable runtime impact.
- **Record-level permission gap on status changes**: the single-status toggle and batch-status action (`view/form.tsx:154-155`; `fee-list.tsx:443,172-182`) are gated on *any* `EDIT` permission, not the specific record's application type — unlike the redirect checks in §9, which are correctly record-scoped. A user with only `PRODUCT_FEE_EDIT_CASH_LOAN` could toggle status on a credit-card record reached via the list. `NEEDS-VERIFICATION` on backend enforcement.
- **Export gated on `CREATE`, not `VIEW`**: `fee-list.tsx:397` requires `FEE_CREATE_GROUP` for the export action, so a view-only user cannot export the list they can see. `NEEDS-TEAM-DECISION` on whether this is intentional.
- **Possible `NaN`-id submission on edit**: `edit-fee.tsx:58` submits `Number(feeDefinition?.id)`; if the detail fetch failed and cleared state (`slice:73-74`), this could construct a request to `.../fee-definitions/NaN`. The route's own `:id` param (`edit/form.tsx:23`) is available but unused for the submit call. `NEEDS-VERIFICATION` on whether the UI prevents reaching this state and whether the backend would reject it safely.
- **Triplicate detail fetch on the view page**: `view/form.tsx:117-130`, `view-fee.tsx:54-58`, and `history.tsx:91-95` each independently fetch the same record detail — two fetches on first load, a third after switching to the history tab.
- **Duplicate global `UpdateStatus` type** across four `.d.ts` files with `skipLibCheck: true` hiding any conflict (§8).
- **Type drift between ambient types and form state**: `feeRate: number` vs. a form value reset to `''` on calculation-method change; `status: string` (one ambient type) vs. `status: boolean` (another); `updatedDate: Dayjs`'s actual runtime shape unverified (§8).
- **Two-way module dependency on fee-rate options**: this folder's `create-fee.tsx`/`view-fee.tsx` import `calculationMethodOptions` from the **add-on** module, while `edit-fee.tsx` imports this folder's own copy — the two currently hold identical values, but nothing enforces that they stay in sync, so an edit to either in isolation could silently desynchronize create/view from edit.
- **Fee history piggybacks on the industry-product slice**: `view/history.tsx` reads/dispatches `product-industry.slice.ts`'s shared history/pagination state (§10) rather than owning its own — a structural coupling, not a current observed defect.
- **Hardcoded routes instead of `PageURLs`**: `edit/form.tsx:38`, `view-fee.tsx:43`, `history.tsx:39`, and multiple external deep-link sites (§2, §11) build fee create/view/edit paths as literal strings; only the list route has a `PageURLs` builder.
- **`getViewUrl()` depends on `window.location`**: `common.ts:188-190`, used by the edit-success navigation in middleware (`:92`) — works only because the listener runs before the navigation it reacts to; a structural fragility, not an observed failure.
- **Dead/misleading code**: an unreachable inner ternary in the import/export dropdown filter (`fee-list.tsx:402`); `state.message` (slice `:10`) is declared but never written; the `watchIndustryMessage` selector name (`:285`) is a copy/paste leftover.
- **Hardcoded user-visible strings bypassing i18n**: `fee-list.tsx:348`; `upload-file.tsx:82,89,132` (a generic failure message shown for every import type, not just fee). **LEGACY-COMPATIBILITY**; `.claude/rules/11-i18n.md` applies only if substantially touched.
- **No lower bound on `feeRate`**: only an upper bound (>100) is validated (`create-fee.tsx:215-230`; `edit-fee.tsx:243-256`). `NEEDS-VERIFICATION` on whether the input control itself prevents negative values.
- **Cross-page/cross-filter row selection**: `selectedRowKeys` persists across search/page changes and is cleared only after a batch update (`fee-list.tsx:198`); hidden selected IDs are still counted in the batch-status summary and sent in the batch/export payloads, while the visible-rows-only action summary can diverge from what's actually selected. `NEEDS-VERIFICATION` on AntD's exact hidden-key retention behavior.
- **Latent double-submit wiring**: both `<Form onFinish>` and the imperative `submitForm` handle are wired on create and edit (`create-fee.tsx:53-59`; `edit-fee.tsx:80-86`); only `submitForm` is invoked today by `FormLayout`, so this is not a current double-dispatch, but the redundant wiring is a latent risk if that call path changes.

## 14. Areas to avoid touching

- Do not edit `options/fee.ts` without auditing every consumer in §10/§11 —
  `src/utils/form.ts`, `product-configuration/utils.tsx`,
  `group-list-product/utils.tsx`, the fee searcher form, and the two import
  preview tabs all depend on its exact export names and values.
- Do not edit `fee-definition.slice.ts` or `product-fee-list.middleware.ts`
  without auditing the 16 external `watchFeeDefinitionLoading` readers (§11)
  and the two product-create pages that write the same list state.
- Do not edit the shared import components
  (`import-file-form.tsx`, `upload-file.tsx`, `valid-file-import.tsx`,
  `invalid-file-import.tsx`) as part of a fee-only change — they serve
  multiple unrelated import types (§10).
- Do not "fix" the record-scoping gap on status toggle/batch status, the
  export-permission choice, or the create/edit option-import mismatch as an
  incidental part of an unrelated change — each is a product/permission
  decision, not a code-cleanup task (§13).
- Do not resolve the duplicate `UpdateStatus` global type declaration
  (§8) without a repository-wide consumer audit; `skipLibCheck: true`
  means the current behavior may be load-bearing in ways static analysis
  alone cannot reveal.

## 15. Open questions

- Whether record-scoped permission gating should apply to the status
  toggle and batch-status actions, matching the redirect checks elsewhere
  in this feature (§13) — `NEEDS-TEAM-DECISION`.
- Whether CSV export should require `VIEW` rather than `CREATE`
  permissions (§13) — `NEEDS-TEAM-DECISION`.
- Whether product-create pages (`cash-loan`, `credit-card`) should continue
  independently writing this feature's own Redux list state, or should read
  it through a dedicated reference-data path instead (compare to the
  separate `common.slice.ts` `getListFeeDefinitions`/`assignable` path
  already used elsewhere, §11) — `NEEDS-TEAM-DECISION`.
- Which of the four duplicate `UpdateStatus` global declarations TypeScript
  actually resolves, and whether that matters today — `NEEDS-VERIFICATION`.
- Whether a `NaN` id can actually reach the edit `PUT` call in practice, and
  how the backend would respond if it did — `NEEDS-VERIFICATION`.
- Backend fee-calculation rules, status-transition rules, uniqueness
  constraints, and the import file schema — unresolved from the previous
  version of this document, still `NEEDS-VERIFICATION`.
