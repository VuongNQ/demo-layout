# Add-on Products — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

Reconciled 2026-11-05 against source revision `8562c125`-equivalent (branch
`portal-cham-vay`), by read-only `codebase-analyzer` inventory of all 19 files
under `src/modules/products/add-on/` plus the owning slice, middleware,
ambient type file, route files, menu/permission constants, and every external
consumer found by grep. This replaces the previous narrative-only version of
this document (dated implicitly, no explicit revision), which omitted the
file count, several dead/unreachable thunks, and a stricter characterization
of the `users/` coupling. `find src/modules/products/add-on -type f | wc -l`
= **19**, matching `docs/reports/2026-11-04/products-docs-reconciliation.md`
and `docs/modules/INDEX.md`'s recorded figure — no discrepancy.

**Corrections made in this pass against the prior document:**
1. The prior doc said "published section edits use `PUT .../:id/summary` and
   `PUT .../:id/fee`." No UI dispatcher for `updateSummaryProductAddon` or
   `updateFeeProductAddon` exists anywhere in `src/` (CONFIRMED by grep). The
   only live edit-submit path is `updatedAddOnProductAPI`, `PUT
   .../:id/add-on-products`. See §4, §6, §13 item 12.
2. The prior doc did not note that the edit/view shells read their loading
   indicator from `fee-definition.slice.ts` (`watchFeeDefinitionLoading`), not
   from the add-on slice. CONFIRMED: `edit/form.tsx:6,28`; `view/form.tsx:5,32`.
3. The prior doc did not note the view History tab is owned by
   `product-industry.slice.ts`'s history thunks, not the add-on slice.
   CONFIRMED: `view/history.tsx:6-10`.
4. The prior doc said "contract-template choices also depend on
   application-type permissions." The add-on module has zero
   `CONTRACT_TEMPLATE_*` permission references (CONFIRMED). Contract
   templates are filtered only by `applicationTypes` codes `ADDON`/`CL`/`CD`
   (`components/distributions.tsx:27-35`); `CONTRACT_TEMPLATE_*_ADD_ON`
   permission gating belongs to the contract-template module itself.
5. The `users/affiliate-partner` coupling is **re-confirmed but was
   previously imprecise**: `addon-product-form.tsx` does not import from
   `src/modules/products/add-on/**` at all — it imports the shared Redux slice
   `product-addon.slice.ts`. The actual import of add-on module internals
   (`options/fee.ts`) comes from three sibling files
   (`create-affiliate.tsx`, `edit-affiliate.tsx`, `view-affilliate.tsx`), not
   `addon-product-form.tsx`. See §10.1.
6. The prior doc did not note two parallel marketing-option stores
   (`product-addon.slice.ts` and `product-list.slice.ts`); product
   configuration pages use the `product-list` one, not add-on's.

**Verification gaps (ordered by consequence, limited to five per template rule 11 — further items are in §15):**
1. Whether the backend accepts, trims, or rejects the literal trailing-space
   path in `createProductAddon` (`product-addon.slice.ts:113`).
   NEEDS-VERIFICATION.
2. Whether the backend tolerates `DATE_TIME_FORMAT_OUTPUT`'s literal `10`-hour
   token (`src/constants/common.constant.ts:2`, confirmed by a non-mutating
   dayjs evaluation to render `15:30` as `10:30`). NEEDS-VERIFICATION.
3. Whether `associatedPartnerId` (sent top-level by create) and
   `associatedPartner.id` (read by edit/view) are both accepted by the
   backend, and which is canonical. NEEDS-VERIFICATION.
4. Whether a stale `updatedAddOnProduct` Redux draft, left behind by
   abandoning an edit session without Cancel, can be submitted against a
   different product on a later edit visit. Source-level LIKELY; requires
   runtime reproduction.
5. Runtime effect of the single shared `isFormValid` setter across both
   create sections, and of the shared list/pagination/loading state across
   the add-on list, the three users pickers, and 17 product-configuration
   consumers. Static reasoning only.

## 1. Responsibility

The add-on module (UI label "Sản phẩm khác" / "Add-on product") manages
optional products sold alongside a loan or credit card, or standalone. It
provides a paginated/searchable/sortable list with single-row and batch
activate/deactivate; a two-section create form (general info, fee/distribution);
an edit form that loads summary and fee independently and submits one
assembled update; a read-only view with a status toggle and an
update-history tab; and four distribution variants — standalone, cash-loan,
credit-card, and offset-loan (priority-ordered rows). Its data and API calls
live in one Redux slice with a listener middleware. Its options and reference
state are consumed by other products and users screens (§10, §11).

## 2. Entry points and routes

| Route | Source | Permission | Page |
| --- | --- | --- | --- |
| `/product/add-on` | `src/routes/main.routes.tsx:227-228` | `ADD_ON_PRODUCT_VIEW` | `AddOn` (`add-on.tsx`) |
| `/product/add-on/create` | `src/routes/form.routes.tsx:630-631` | `ADD_ON_PRODUCT_CREATE` | `CreateAddOn` (`create/form.tsx`) |
| `/product/add-on/edit/:id` | `src/routes/form.routes.tsx:634-635` | `ADD_ON_PRODUCT_EDIT` | `EditAddOn` (`edit/form.tsx`) |
| `/product/add-on/view/:id` | `src/routes/form.routes.tsx:638-639` | `ADD_ON_PRODUCT_VIEW` | `ViewAddon` (`view/form.tsx`) |

- All four pages are `React.lazy()` exports: `src/routes/pages.tsx:41-44`
  (CONFIRMED, per the repository-wide lazy convention in
  `.claude/rules/06-routing-permission.md`).
- `src/routes/index.tsx` carries no add-on references (CONFIRMED by grep) —
  it is the thin assembly shell; the module's routes live entirely in
  `main.routes.tsx`/`form.routes.tsx` per the current route-file split.
- `PageURLs.ofProductAddon()`: `src/utils/navigate.ts:161-163`, returns
  `withPrefix('/product/add-on')` (`withPrefix` is an identity function,
  `navigate.ts:3-5`).
- Menu entry: `src/helpers/menus.helper.ts:197-201` (`Menu.addOnProduct`,
  link `PageURLs.ofProductAddon()`, `requiredPermissions: [ADD_ON_PRODUCT_VIEW]`).
- 21 files outside the module hard-code `/product/add-on/view/${id}` string
  literals instead of going through `PageURLs` — see §11.C and §13 item 14.

## 3. Directory map

Root: `src/modules/products/add-on/` — 19 files (CONFIRMED,
`find src/modules/products/add-on -type f | wc -l`).

```text
add-on.tsx                        list page (default export AddOn)
ultis.tsx                         normalizeUpdatedAddOnProduct (filename typo "ultis", legacy-compatible)
components/
  distributions.tsx               container: maps distributionType -> variant component
  standalone.tsx
  cash-loan.tsx
  credit-card.tsx
  offset-loan.tsx                 Form.List priority rows; reads marketing options
create/
  form.tsx                        FormLayout shell (footerType='step')
  general-info.tsx                GeneralInfo (forwardRef), validateForm
  fee-price.tsx                   FeePrice (forwardRef); onFinish dispatches createProductAddon
edit/
  form.tsx                        FormLayout shell, onConfirm=handleSubmit
  general-info.tsx                summary section, accumulates into updatedOnProductSidebar
  fee-price.tsx                   fee section, accumulates into updatedOnProductSidebar
helpers/
  offsetLoan.helper.ts            validateOffsetLoanField (row + cross-row rules)
options/
  fee.ts                          distributionOptions, calculation/collection/confirmation option lists
view/
  form.tsx                        FormLayout shell (footerType='view'), status toggle
  general-info.tsx                read-only summary
  fee-price.tsx                   read-only fee view
  history.tsx                     history table — owned by product-industry.slice, not this module's slice
```

## 4. Main runtime flows

**List (`add-on.tsx`).** `useQueryState` drives list params; an effect
dispatches `getListProductAddon({page, size, code, name, associatedPartnerId,
distribution, status, sort})` (`add-on.tsx:214-225`). Search is handled by
`AddOnSearcher` (`src/components/forms/search/add-on-searcher.form.tsx`),
default sort `updatedDate,desc`. Row selection and batch status
(`handleUpdateActiveState`, `add-on.tsx:184-205`) dispatch
`updateMultiStatusAddon({id, status})` after confirmation; the batch-status
bar is visible only with `ADD_ON_PRODUCT_EDIT`.

**Create (`create/form.tsx` + `create/general-info.tsx` + `create/fee-price.tsx`).**
On mount, `getListContractTemplates({status:'ACTIVE', context:'PRODUCT',
action:'CREATE'})`, `getListAffiliatedPartners(...)` (from `common.slice`),
and `getListMarketingOptions()` are dispatched (`create/form.tsx:76-95`).
`FormLayout` uses `footerType='step'` and clones each sidebar form with an
accumulated `formData` prop (`src/layouts/form.layout.tsx:102-107`); the
shell's own local `formData` state is itself always `undefined`
(`create/form.tsx:23`) and is overridden by this cloning — it is effectively
dead state (see §13 item 13). The final-step submit calls
`activeFormRef.submitForm?.()` (`form.layout.tsx:170-175`), which resolves to
`onFinish` in `create/fee-price.tsx:226-244`, which dispatches
`createProductAddon(data)` at line 242 with raw (unformatted) Dayjs date
values. Success/failure notification and navigation are owned by
`src/redux/middlewares/product-add-on.middleware.ts:89-116`.

**Edit (`edit/form.tsx` + `edit/general-info.tsx` + `edit/fee-price.tsx`).**
On mount: `getProductAddonSummaryDetail(id)`, `getProductAddonFeeDetail(id)`,
`getListMarketingOptions()` (`edit/form.tsx:105-111`), then an unfiltered
contract list excluding `DRAFT` status (`edit/form.tsx:70-90`). Each section
also independently fetches its own resource on mount
(`edit/general-info.tsx:108-112`; `edit/fee-price.tsx:208-212`). Every field
change dispatches `updatedOnProductSidebar({section, data})` into the shared
`updatedAddOnProduct` accumulator (`edit/general-info.tsx:44-70`,
`edit/fee-price.tsx:170-175`); initialization prefers this accumulated draft
over the server detail (`edit/general-info.tsx:81`;
`edit/fee-price.tsx:181`) — see §13 item 1 for the resulting staleness risk.
Submit (`edit/form.tsx:92-103`) calls `normalizeUpdatedAddOnProduct(...)`
(`ultis.tsx:16-61`) and dispatches `updatedAddOnProductAPI({id, formData,
name})`, `PUT .../:id/add-on-products`. Success resets the accumulator and
navigates to the view route (`product-add-on.middleware.ts:236-250`). Cancel
(`edit/form.tsx:37-58`) also resets the accumulator and navigates to a
hard-coded `/product/add-on/view/${id}` literal rather than `PageURLs`.

**View (`view/form.tsx` + sections + `view/history.tsx`).** Sections
independently fetch summary and fee on mount. The status toggle
(`handleUpdateStatus`/`onUpdateStatus`, `view/form.tsx:47-98`) dispatches
`updateStatusProductAddon({id, formData:{status, disableReason, name}})`,
`PUT .../:id/:status` with body `{reason}`, then re-fetches summary; it is
visible only with `ADD_ON_PRODUCT_EDIT`. History
(`view/history.tsx:43-52`) dispatches `getListUpdatedHistories({id,
query:{..., entityType:'PRODUCT_ADD_ON'}})` from `product-industry.slice`,
**not** the add-on slice.

**Reference lists.** `getListDistributionProductAddon` and
`getListDealsAddon` (`product-addon.slice.ts:233-294`), both against `GET
api/admin/portal/v1/products/product-addons?type=...`, are consumed by the
product-configuration cash-loan/credit-card/group-list-product create/edit/view
pages (§10, §11). `getListMarketingOptions` (`GET
.../add-on-products/marketing-options`) is read only by
`components/offset-loan.tsx`.

## 5. State ownership

**Redux slice `src/redux/slices/product-addon.slice.ts` (`product-addon`, `createAppSlice`), CONFIRMED sole Redux owner.**

| Field | Written by | Read by |
| --- | --- | --- |
| `listProductAddon` | `getListProductAddon.fulfilled`; `updateMultiStatusAddon.fulfilled` | add-on list; 3 users pickers |
| `pagination` | `getListProductAddon`, `getListDistributionProductAddon`, `getListDealsAddon` (fulfilled/rejected) — one shared field across three unrelated thunks | add-on list; users pickers |
| `productAddonDetail` | summary/fee fulfilled; `resetProductAddonDetail` | edit/view shells and sections |
| `distributionAddOn` | `getListDistributionProductAddon` | 17 product-configuration consumers (§11.B) |
| `deals` | `getListDealsAddon` | same configuration consumers |
| `marketingOptions` | `getListMarketingOptions` | `components/offset-loan.tsx` only |
| `loading` | every thunk's pending/settled (one shared flag) | list table; users pickers |
| `updatedAddOnProduct` | `updatedOnProductSidebar` (accumulates `summary`/`fee`); reset by `resetUpdatedAddOnProduct` | edit sections; edit submit |
| `message` | never written | unused for add-on |

No TanStack Query usage exists in this module (CONFIRMED: zero `@tanstack`,
`useQuery`, `useMutation` matches; the only "useQuery" hit is the unrelated
URL-state hook `useQueryState`). This is a Query-free, Redux-only module.

**Other state holders.** Per-section Ant Design `Form.useForm` instances;
`FormLayout`'s internal `formData`/`activeSidebar` accumulator
(`form.layout.tsx:90`); a local `isFormValid` boolean shared by both create
sections via one setter (`create/form.tsx:22,54,64` — see §13 item 8); local
`distributionsSelected` state per shell. Cross-slice reads:
`watchFeeDefinitionLoading` (`fee-definition.slice.ts`) drives edit/view
loading; `watchContractTemplates`/`watchAffiliatedPartners`
(`common.slice.ts`); `watchListUpdatedHistory`/`watchIndustryPagination`
(`product-industry.slice.ts`) for history.

**Ownership summary.** `product-addon.slice.ts` is the single authoritative
server-resource owner for add-on data — `LEGACY-COMPATIBILITY` under
`.claude/rules/04-state-management.md` `## Server state ownership (adopted
2026-11-04)`; it is an existing Redux-owned resource, not a candidate for
incidental migration. Derived/local drafts are AntD form values and the
`updatedAddOnProduct` accumulator. The same slice fields are *shared*, not
duplicated, by the users pickers and configuration pages (§10); marketing
options specifically are duplicated across this slice and
`product-list.slice.ts` (the latter is what product-configuration pages
actually read for marketing choices, per the products `OVERVIEW.md`).

## 6. API boundaries

All calls go through `apiFetcher` directly inside slice thunks
(`src/utils/api-service.ts`); there is no service layer for add-on
(`src/services/` has zero add-on references, CONFIRMED) — `LEGACY-COMPATIBILITY`
per `.claude/rules/03-api-service.md` `## Service location`.

| Thunk | Method | Literal | Live dispatcher? |
| --- | --- | --- | --- |
| `getListProductAddon` | GET | `api/admin/portal/v1/add-on-products` (+query) | Yes — list; users pickers |
| `getProductAddonSummaryDetail` | GET | `.../add-on-products/${id}/summary` | Yes |
| `getProductAddonFeeDetail` | GET | `.../add-on-products/${id}/fee` | Yes |
| `createProductAddon` | POST | `'api/admin/portal/v1/add-on-products '` (**trailing space**, `product-addon.slice.ts:113`) | Yes — create |
| `updateSummaryProductAddon` | PUT | `.../add-on-products/${id}/summary` | **No dispatcher anywhere in `src/`** |
| `updateFeeProductAddon` | PUT | `.../add-on-products/${id}/fee` | **No dispatcher anywhere in `src/`** |
| `updateStatusProductAddon` | PUT | `.../add-on-products/${id}/${status}`, body `{reason}` | Yes — view status toggle |
| `updateMultiStatusAddon` | PUT | `.../add-on-products/${status}`, body `{ids}` | Yes — list batch |
| `getListDistributionProductAddon` | GET | `api/admin/portal/v1/products/product-addons` (+`type`) | Yes — configuration pages |
| `getListDealsAddon` | GET | same path, `type:'STANDALONE'` | Yes — configuration pages |
| `getListMarketingOptions` | GET | `.../add-on-products/marketing-options` | Yes |
| `updatedAddOnProductAPI` | PUT | `.../add-on-products/${id}/add-on-products` | Yes — edit submit (the actual update path) |

**Trailing-space endpoint (CONFIRMED present).** `product-addon.slice.ts:113`
is literally `'api/admin/portal/v1/add-on-products ',` — the space is inside
the string, before the closing quote (verified with `cat -A`). `ApiFetcher`
does not trim the path before concatenation, so the space reaches axios.
Whether the backend tolerates, rejects, or silently normalizes it is
NEEDS-VERIFICATION; preserve as-is until that evidence exists, per
`docs/modules/TEMPLATE.md` rule 1 (do not fix without a cited reason) and this
repository's general preference for behavior-preserving changes.

**Error handling.** `createProductAddon`'s catch rethrows
`new Error(error?.data?.message)` (`product-addon.slice.ts:117-119`),
discarding HTTP status; the middleware's fallback uses `??`
(`product-add-on.middleware.ts:107`), so an empty-string message (not
nullish) suppresses the intended default message — LIKELY, not confirmed at
runtime. `ApiFetcher`'s response interceptor dereferences
`error.response.status` without a guard, so a response-less network error
would throw a TypeError — LIKELY, NEEDS-VERIFICATION. All other thunks rely on
RTK `rejected` plus the listener middleware's notifications
(`product-add-on.middleware.ts:29-88,118-144,161-204,236-263`).

## 7. Forms and validation

Ant Design `Form`/`FormInstance` is the sole form-state owner throughout
(target-compatible per `.claude/rules/05-form.md`); no Zod is used anywhere
in this module (legacy-compatible by absence, not a gap — this repository
does not mandate Zod for existing stable forms).

**Create general info (`create/general-info.tsx`):** `code`, `name` required;
`startDate` required only when `isScheduled` is true, and toggling it off
clears the start-date error via `form.setFields` (`:58-69`); rich-text
`description` validated by a custom validator stripping tags/`&nbsp;`
(`:179-191`). `validateForm` checks `['code','name','description','startDate']`
and reports into the shared `isFormValid` setter.

**Create fee section (`create/fee-price.tsx`):** `distributionsOptions` and
`distributions` are required; `isDistributionValid` enforces, per selected
distribution type: STANDALONE needs `standalonePrice`; CASH_LOAN and
CREDIT_CARD need their rate plus calculation/collection methods; OFFSET_LOAN
needs at least one row, each passing `isOffsetLoanValid`. `validateForm`
(`:139-151`) blocks save until all selected rows validate — this gate is
**create-only**; edit has no equivalent (§13 item 8).

**Variant components (`components/`):** `standalone.tsx` requires
`standalonePrice`; `cash-loan.tsx` requires calculation method, rate,
collection method; `credit-card.tsx` requires the same trio (its collection
options are filtered to `ONCE_TIME` only) — `credit-card.tsx:78` derives
`allowDecimals` from `distribute.loanFeeCalculationMethod` (the **loan**
field) inside the credit-card component, a likely copy-paste defect (§13 item
10, NEEDS-VERIFICATION as business-intentional or not); `offset-loan.tsx` is
a `Form.List` requiring at least one row, each row validated by
`validateOffsetLoanField` for priority/price/componentType plus cross-row
uniqueness checks.

**Edit (`edit/general-info.tsx`, `edit/fee-price.tsx`):** `name` required;
`code` is disabled with no rule; `startDate` conditional as above;
`distributionsOptions` required, but the `distributions` `Form.Item` has
**no** `required` rule at all (`edit/fee-price.tsx:259`) — only the inner
variant-component rules apply. There is no `isFormValid`-style gate on edit
save.

**Shared submission mechanics.** `FormLayout.handleConfirm` validates only
the *active* sidebar form before calling `onConfirm`/`submitForm` — other
sections are not re-validated on edit submit (CONFIRMED,
`src/layouts/form.layout.tsx` around lines 209-228). `handleStepNext`
validates the current step before advancing on create (`:178-190`).

**Offset-loan helper (`helpers/offsetLoan.helper.ts`):** per-row required
checks (`priority > 0`, `price > 0`, `componentTypeId` set) plus cross-row
checks rejecting duplicate priority+price or duplicate componentType+price
combinations. It exports its own `OffsetLoanType`, which **shadows but
differs from** the global ambient `OffsetLoanType` in
`src/types/product-addon-list.d.ts:12-18` — a naming collision, not (from
source alone) a runtime bug, since the two are never assigned to each other
directly in the traced call sites.

**Options (`options/fee.ts`):** sources its option lists from
`src/enums/fee-method.enum.ts` TypeScript `enum`s — `LEGACY-COMPATIBILITY`;
this repository's constants policy (`.claude/rules/02-typescript.md`)
prohibits new application enums but existing ones may remain and must not be
copied into new code.

**Distribution-type requirement summary:**

| Type | Required at create | Required at edit |
| --- | --- | --- |
| STANDALONE | `standalonePrice` | same (component rule only) |
| CASH_LOAN | calc method, rate, collection method | same |
| CREDIT_CARD | calc method, rate, collection method | same |
| OFFSET_LOAN | ≥1 row; priority/price/componentType per row; cross-row checks | same |

## 8. Types and DTO organization

**Ambient/global types:** `src/types/product-addon-list.d.ts` (150 lines, zero
imports/exports — every declaration is a global script type): `ProductAddonType`,
`OffsetLoanType`, `DistributionAddonType`, `ProductAddonRequestType`,
`FormValuesProductAddonSummary`, `ProductAddonSummaryRequestType`,
`ProductAddonFeeRequestType`, `UpdateStatus`, `DistributionAddOnProduct`,
`FeeCalculationMethod`, `DistributionType`, `UpdatedAddOnProduct`,
`MarketingOptionType`. `ProductAddonListFilter` lives in
`src/types/Filter.d.ts:51-57` (also global). `ProductAddonKeyValue` and
`DistributionProductAddonKeyValue` are module-exported (not ambient) from
`src/types/common.d.ts:142-157`. These are `LEGACY-COMPATIBILITY` per
`.claude/rules/01-architecture.md` `## Compatibility`; new/refactored code
should not add further business models to this file.

**Confirmed global consumers:** `ProductAddonRequestType` has no consumer
outside the add-on module and its slice. `ProductAddonType` is consumed by
three `users/affiliate-partner` files, two `users/operator` picker files, and
`src/redux/slices/affiliate-partner.slice.ts`. `ProductAddonListFilter` is
consumed by the shared `add-on-searcher.form.tsx`. `DistributionAddOnProduct`
and `DistributionType` are consumed by `src/components/product-configuration/utils.tsx`
and `src/modules/products/configuration/group-list-product/utils.tsx`.
`ProductAddonKeyValue` is consumed by `common.slice.ts` and the
contract-template module.

**Feature-local types:** `OffsetLoanType`/`OffsetLoanField` (exported,
module-local, in `helpers/offsetLoan.helper.ts`, name-colliding with the
global `OffsetLoanType` — see §7); local prop/`FormValues` types in several
section files. There is no `types/` folder inside this module.

**Shape mismatches found in source (not fixed, recorded per template rule 1):**
- `ProductAddonType.lastUpdated: string` vs. the list column's
  `dataIndex: 'updatedDate'` (`add-on.tsx:134-140`).
- Create posts `associatedPartnerId` as a top-level field
  (`create/general-info.tsx:127`); edit/view bind `['associatedPartner','id']`
  (`edit/general-info.tsx:161`, `view/general-info.tsx:107`) — two different
  request shapes for the same logical field.
- Every create/edit/view builder writes `contactIds: []` into each
  distribution row, a field absent from `DistributionAddonType`.
- `DistributionAddonType.contractLoanCompensationIds: string[]` is declared
  required but is never set by any UI builder.
- `FormValuesProductAddonSummary.images: string` vs.
  `ProductAddonSummaryRequestType.images: array` — bridged explicitly by
  `normalizeUpdatedAddOnProduct` (`ultis.tsx:33-38`).
- Type assertions present: `selectedRowKeys as number[]` (`add-on.tsx:193`),
  `images as string` (`create/fee-price.tsx:235`),
  `state.productAddonDetail!` (`product-addon.slice.ts:97`).

No runtime guard or Zod schema parses any add-on response — absent-Zod on a
stable CRUD API is not treated as a gap per `docs/modules/TEMPLATE.md` rule 5;
the shape mismatches above are a different, concrete finding from that
default.

## 9. Permissions

Three permission constants total (below the template's ten-constant table
threshold, so recorded as prose per rule 9):

- `ADD_ON_PRODUCT_VIEW: 'add_on_product:view'` (`permission.constant.ts:112`)
- `ADD_ON_PRODUCT_CREATE: 'add_on_product:create'` (`:113`)
- `ADD_ON_PRODUCT_EDIT: 'add_on_product:edit'` (`:114`)

`CONTRACT_TEMPLATE_*_ADD_ON` constants exist in the same file (lines 88-95)
but are **not** referenced anywhere inside the add-on module (corrects the
prior document, see §0 item 4).

- **Route:** list `main.routes.tsx:228` → VIEW; create `form.routes.tsx:631`
  → CREATE; edit `:635` → EDIT; view `:639` → VIEW. All under `WithGuard` +
  `AuthGuard` — single-permission checks, not OR arrays.
- **Menu:** `menus.helper.ts:200`, `requiredPermissions: [ADD_ON_PRODUCT_VIEW]`
  — a separate registry from the route guard, both set to VIEW.
- **Component/action level:** create button and empty-state create button
  (`add-on.tsx:278,311`) gated on CREATE; the list's batch-status summary bar
  (`:321`) and the view page's update button/status toggle
  (`view/form.tsx:154-155`) gated on EDIT. Create, edit, and view pages carry
  no further in-page permission checks beyond their route guard.

Frontend checks do not establish backend authorization (NEEDS-VERIFICATION,
as with every module).

## 10. Shared and cross-domain dependencies

### 10.1 The `users/affiliate-partner` coupling, re-verified against current source

The prior document's claim ("users/affiliate-partner imports add-on data; add-on
distribution options are also consumed by users/affiliate-partner") is
**directionally correct but was imprecise about which file does what**:

- `src/modules/users/affiliate-partner/components/addon-product-form.tsx`
  does **not** import anything from `src/modules/products/add-on/**`. It
  imports the shared Redux slice directly:
  `import { getListProductAddon, watchListProductAddon,
  watchListProductAddonPagination, watchProductAddonLoading } from
  '@/redux/slices/product-addon.slice';` — it reads/dispatches the same list
  state the add-on list page itself uses, and its row type is the global
  `ProductAddonType` (no module import needed for that).
- The actual import of add-on **module internals** (`options/fee.ts`'s
  `distributionOptions`) comes from three sibling files, not
  `addon-product-form.tsx`: `src/modules/users/affiliate-partner/create/create-affiliate.tsx:31`,
  `edit/edit-affiliate.tsx:31`, `view/view-affilliate.tsx:26`.
- The same slice-level pattern (not module-internals import) repeats in
  `src/modules/users/operator/group-permission/components/addon-product-form.tsx:10-15`
  and `src/modules/users/operator/user-operator-list/components/addon-product-form.tsx:17-22`.

### 10.2 What the add-on module imports from outside itself

Shared UI primitives (`form-wrapper`, `select`, `switch`, `input`,
`date-picker`, `text-editor`, `upload`, `select-form-custom`,
`suffix-input`, `button`, `table-wrapper`, `no-data`, `table-card-status`,
`table-link`, `table-date-time`, `table-summary`, `pagination`,
`modal-content`, `forms/form-reasonDisabled`,
`forms/search/add-on-searcher.form` — the last imports back into this module,
see §10.4); `FormLayout` (`@/layouts/form.layout`); Redux slices
`common.slice` (contract templates, affiliated partners),
`fee-definition.slice` (`watchFeeDefinitionLoading`), `notification.slice`
(`setNotification`), `product-industry.slice` (history); a module-to-module
import of `convertFieldActionType` from
`src/modules/products/configuration/industry-product/ultis`
(`view/history.tsx:17`); enums `@/enums/fee-method.enum`,
`@/enums/common.enum`; constants, navigation and form utilities under
`@/constants`, `@/utils`, `@/hooks`; and `t` imported directly from
`'i18next'` in `view/form.tsx:23` rather than via `@/utils/i18n` (a minor
inconsistency with the rest of the module/repository, not a defect).

### 10.3 What other modules import from the add-on module

- **Options** (`@/modules/products/add-on/options/fee`): 13 import
  statements across 12 files (full list in §11.A).
- **Redux slice** `product-addon.slice`: 20 non-add-on consumer files (3
  users pickers, 17 product-configuration files — full list in §11.B), plus
  registration in `src/redux/slices.ts:5,50` and `src/redux/store.ts:11,57`.
- **Global ambient types** (§8).
- **Hard-coded deep links** to `/product/add-on/view/${id}` from 21 files
  (§11.C).
- **Common-slice lookalikes that are NOT the add-on slice:**
  `common.slice.ts`'s `getListAddOns` (`GET .../add-on-products/assignable`,
  `:321-344`) and `getListDistributionProductAddons` (`GET
  products/product-addons/assignable`, `:292-315`) are separate endpoints and
  separate state, consumed by contract-template create/edit/view. Do not
  conflate these with the add-on slice's own reference thunks when tracing
  consumers.
- `src/components/drag-table-add-on.tsx` shares the name "AddOn" only — it
  has no import from this module; its consumers are product-configuration
  pages.

### 10.4 Dependency-direction concerns (existing, not new)

Shared components importing module internals is an existing, repository-wide
pattern this module also exhibits: `src/components/forms/search/add-on-searcher.form.tsx:6`
imports `distributionOptions`, as do
`src/components/forms/import/list/invalid-file-import.tsx:15` and
`valid-file-import.tsx:15`. This runs counter to
`.claude/rules/01-architecture.md` ("shared code must not import
business-module internals") but is `LEGACY-COMPATIBILITY` — an existing
violation to record, not one to fix incidentally (`docs/modules/TEMPLATE.md`
rule 4).

## 11. Consumers (exhaustive, by grep)

**A. Imports of `@/modules/products/add-on/options/fee`** (13 statements, 12 files):
`src/components/forms/import/list/invalid-file-import.tsx:15`;
`valid-file-import.tsx:15`;
`src/components/forms/search/add-on-searcher.form.tsx:6`;
`src/modules/products/configuration/cash-loan/create/installment-plan.tsx:43-47`;
`cash-loan/edit/installment-plan.tsx:46-50`;
`cash-loan/view/installment-plan.tsx:35-38`;
`credit-card/create/card-info.tsx:44,47`;
`credit-card/edit/card-info.tsx:47-51`;
`credit-card/view/card-info.tsx:13`;
`src/modules/users/affiliate-partner/create/create-affiliate.tsx:31`;
`edit/edit-affiliate.tsx:31`; `view/view-affilliate.tsx:26`.

**B. Imports of `@/redux/slices/product-addon.slice`** (outside add-on):
- Users (3): `affiliate-partner/components/addon-product-form.tsx:9-14`;
  `operator/group-permission/components/addon-product-form.tsx:10-15`;
  `operator/user-operator-list/components/addon-product-form.tsx:17-22`.
- Configuration, cash-loan (6): `create/index.tsx:26-31`;
  `edit/index.tsx:31-34`; `edit/installment-plan.tsx:28-31`;
  `edit/promotion.tsx:16-19`; `view/installment-plan.tsx:22-25`;
  `view/promotion.tsx:16-19`.
- Configuration, credit-card (3): `create/index.tsx:23-26`;
  `edit/card-info.tsx:22-25`; `view/card-info.tsx:16-19`.
- Configuration, group-list-product (8): `create/form.tsx:14-19`;
  `create/product.tsx:24`; `create/promotion.tsx:24`; `edit/form.tsx:26-29`;
  `edit/product.tsx:23-26`; `edit/promotion.tsx:24-27`;
  `view/product.tsx:24-27`; `view/promotion.tsx:23-26`.
- Registration: `src/redux/slices.ts:5,50`; `src/redux/store.ts:11,57`.

**C. Hard-coded `/product/add-on/view/${id}` literals** (21 files):
`src/components/product-configuration/utils.tsx:276,519,538`;
`configuration/cash-loan/create/installment-plan.tsx:95,305`,
`create/promotion.tsx:67`; `cash-loan/edit/installment-plan.tsx:101,285`,
`edit/promotion.tsx:71`; `cash-loan/view/installment-plan.tsx:82`,
`view/promotion.tsx:56`; `configuration/credit-card/create/card-info.tsx:106,315`,
`edit/card-info.tsx:111,313`, `view/card-info.tsx:91`;
`configuration/group-list-product/create/product.tsx:156`,
`create/promotion.tsx:59`, `edit/product.tsx:161`, `edit/promotion.tsx:73`,
`utils.tsx:96`, `view/product.tsx:174`, `view/promotion.tsx:60`;
`users/affiliate-partner/components/addon-product-form.tsx:58`,
`create/create-affiliate.tsx:70`, `edit/edit-affiliate.tsx:85`,
`view/view-affilliate.tsx:58`.

**D. Global ambient type consumers:** see §8.

**E. Name-only overlap, no import:** `src/components/drag-table-add-on.tsx`.

**F. Separate common-slice endpoints, not this module's state:**
`src/redux/slices/common.slice.ts:292-344`,
`src/redux/middlewares/common.middleware.ts:10,67,78`; contract-template
consumers `src/modules/products/parameter/contract-termplate/create/create-contract-template.tsx:36,113,118-123`,
`edit/edit-contract-template.tsx:34,132,136-141,186,192`,
`view/view-contract-template.tsx:29,88`.

**G. Permission/route/menu registrations:**
`src/constants/permission.constant.ts:112-114`;
`src/helpers/menus.helper.ts:198-200`; `src/routes/main.routes.tsx:228`;
`src/routes/form.routes.tsx:631,635,639`.

No dynamic/computed consumer paths were found; all imports and lazy
references are static string literals.

## 12. Pattern classification

| Pattern | Location | Classification |
| --- | --- | --- |
| Redux slice owning list/detail/reference/mutation state, thunks calling `apiFetcher` directly, no service layer | `product-addon.slice.ts` | `LEGACY-COMPATIBILITY` — existing Redux-owned server resource; migrates opportunistically, one resource per dedicated PR, not incidentally |
| Listener middleware for notifications/navigation | `product-add-on.middleware.ts` | `LEGACY-COMPATIBILITY`, and still the normal pattern for Redux workflows |
| TanStack Query | absent from this module entirely | not applicable — no new server resource was introduced here to apply the target to |
| One shared `loading` flag and one shared `pagination` field across unrelated thunks/pages | `product-addon.slice.ts` | `LEGACY-COMPATIBILITY`, high-risk to extend further (§13 item 5) |
| Ant Design `Form`/`FormInstance` as sole form-state owner | all shells/sections | target-compatible |
| `FormLayout`/`FormRef`/`submitForm`/cloned `formData` channel | `form.layout.tsx` | `LEGACY-COMPATIBILITY`, must-preserve integration contract |
| No Zod; AntD rules plus an imperative cross-row validator helper | `helpers/offsetLoan.helper.ts` | `LEGACY-COMPATIBILITY`; not a gap under template rule 5 |
| TypeScript `enum` sourced from `src/enums/fee-method.enum.ts` | `options/fee.ts`, variant components | `LEGACY-COMPATIBILITY`; must not be copied into new code |
| Ambient global types in `src/types/product-addon-list.d.ts` | types | `LEGACY-COMPATIBILITY` |
| Emotion `css` styling | 7 files in this module | `LEGACY-COMPATIBILITY` for normal maintenance |
| Lazy route pages under `RouteSuspense` | `pages.tsx:41-44` | target-compatible |
| URL-query state for list filters | `add-on.tsx` | target-compatible (client UI state, not a server resource) |
| Shared component importing module internals (`distributionOptions`) | `src/components/forms/search/add-on-searcher.form.tsx` and 2 import-validator files | existing violation of "shared code must not import business-module internals" — `LEGACY-COMPATIBILITY`, do not copy the pattern into new shared code |

## 13. Technical risks

Ordered by decreasing consequence, each flagged a module touching this code
must weigh:

1. **Data integrity — stale draft / cross-product submit.** `updatedAddOnProduct`
   (`product-addon.slice.ts:13,20,344-380`) carries no product-ID key and is
   reset only on explicit Cancel or a successful update
   (`product-add-on.middleware.ts:239`). Leaving the edit screen any other way
   (browser back, direct navigation) leaves the draft in the store; the next
   edit visit for a *different* product initializes from this stale
   accumulator first (`edit/general-info.tsx:81`), and `handleSubmit` uses it
   directly (`edit/form.tsx:93-101`). LIKELY; needs runtime reproduction.
2. **Contract — date format literal hour.** `DATE_TIME_FORMAT_OUTPUT =
   'YYYY-MM-DDT10:mm:ss.SSSZ'` (`src/constants/common.constant.ts:2`)
   contains a literal `10` where the hour token belongs — confirmed by a
   non-mutating dayjs check (`15:30` input renders as `10:30`). Consumed by
   `ultis.tsx:30,32` (edit summary dates), by
   `configuration/group-list-product/utils.tsx:318,321`, and by
   `src/utils/common.ts:107`'s `formatDateTime` (5 consumer files total). This
   is a repository-wide shared constant, not add-on-local.
3. **API boundary — trailing-space endpoint.** See §6. CONFIRMED literal;
   backend effect NEEDS-VERIFICATION.
4. **Contract — create/edit request-shape divergence.** Create posts
   `associatedPartnerId` top-level; edit/view read `associatedPartner.id`.
   Every variant builder writes a stray `contactIds: []`; the required
   `contractLoanCompensationIds` field is never set. LIKELY; backend
   tolerance NEEDS-VERIFICATION.
5. **State ownership / race — shared loading and pagination across pages.**
   `getListDistributionProductAddon`, `getListDealsAddon`, and
   `getListProductAddon` all write the same `pagination` field; every thunk
   toggles the same `loading` flag. Configuration pages, users pickers, and
   the add-on list page can overwrite each other's loading/pagination state;
   there is no request-ID or stale-response guard. CONFIRMED mechanics;
   LIKELY user-visible impact.
6. **Loading UX / state ownership — edit/view spinner tied to an unrelated
   slice.** `edit/form.tsx:28` and `view/form.tsx:32` read
   `watchFeeDefinitionLoading` from `fee-definition.slice.ts`, not this
   module's own `loading`; the view page's own status-toggle loading state
   (on `product-addon.slice`) is never displayed on that page. CONFIRMED.
7. **Cross-domain coupling.** Users pickers dispatch and read the add-on
   list/pagination state directly; shared components import module options;
   21 files hard-code deep links instead of `PageURLs`; the view page's
   History tab depends on an unrelated module's slice and utility function.
   CONFIRMED, consistent with the products `OVERVIEW.md`'s general
   cross-domain-coupling risk entry for this module.
8. **Validation gaps.** Edit-submit validates only the active sidebar form
   (`FormLayout.handleConfirm`), so the non-active section's fields are not
   re-validated at submit time. `edit/fee-price.tsx`'s `distributions`
   `Form.Item` carries no `required` rule at all (only inner variant rules
   apply). Create's single shared `isFormValid` setter means the save-button
   state reflects only whichever section's validator ran last. CONFIRMED
   mechanics.
9. **Error-handling chain.** `createProductAddon` rethrows a bare `Error`
   discarding HTTP status; the middleware's `??` fallback is defeated by an
   empty (not nullish) message string; `ApiFetcher`'s interceptor
   dereferences `error.response.status` without a guard, risking a secondary
   TypeError on a response-less network failure. CONFIRMED logic; runtime
   behavior LIKELY, not reproduced.
10. **Business rule — possible copy-paste defect.** `components/credit-card.tsx:78`
    derives `allowDecimals` from `distribute.loanFeeCalculationMethod` (the
    **loan** field) inside the **credit-card** component. CONFIRMED source;
    whether this is an intentional shared rule or a defect is
    NEEDS-VERIFICATION with product/BA, not assumed either way.
11. **Contract — list field mismatch.** The list column reads `updatedDate`
    while the ambient type declares `lastUpdated`; `add-on.tsx:125-127` calls
    `.split(',')` on `distribution`, which throws if the backend ever returns
    a non-string. NEEDS-VERIFICATION against the actual backend response.
12. **Maintainability — dead/unreachable code.** `updateSummaryProductAddon`
    and `updateFeeProductAddon` (plus their middleware listeners) have no
    dispatchers anywhere in source — the real update path is
    `updatedAddOnProductAPI`. `resetMessages`/`message` are never used for
    add-on. `affiliate-partner.slice.ts` declares an unused
    `listProductAddOn`. `ultis.tsx` exports an unused `partnerOptions`. Do
    not assume these are safe to delete without confirming no external
    caller or planned use — flag as `NEEDS-TEAM-DECISION` before removing.
13. **Code quality — hygiene.** A `console.log(payload)` left in
    `edit/general-info.tsx:63`; a stray `text` token inside a CSS template in
    `components/offset-loan.tsx:288`; `components/distributions.tsx:82`
    returns `Col` elements with no `key`; `create/form.tsx:23`'s local
    `formData` state is effectively dead, overridden by `FormLayout`'s own
    clone mechanism; the module's own filename typo `ultis.tsx`.
14. **Routing — hard-coded paths.** Deep links and `edit/form.tsx:50`'s
    Cancel navigation use string literals instead of `PageURLs`. Currently
    harmless because `withPrefix` is an identity function, but it is a
    fragile pattern if that function ever changes.
15. **Type safety — assertions.** See §8's assertion list; low individual
    impact, listed for completeness.

## 14. Areas to avoid touching

Each item below has consumers outside this module; change only after a wide
impact analysis per `.claude/ARCHITECTURE.md` §19 HIGH-RISK guidance:

- `src/redux/slices/product-addon.slice.ts` — shared list/pagination/loading
  consumed by the add-on page, 3 users pickers, and 17 configuration pages;
  also holds the trailing-space endpoint literal.
- `src/redux/middlewares/product-add-on.middleware.ts` and its registration
  in `src/redux/store.ts:57` / `src/redux/slices.ts:50`.
- `src/types/product-addon-list.d.ts` — global ambient types reaching users,
  product configuration, and shared utilities.
- `src/modules/products/add-on/options/fee.ts` — imported by 12 files across
  shared import validators, the search form, users affiliate forms, and
  product-configuration variants.
- `src/constants/common.constant.ts`'s `DATE_TIME_FORMAT_OUTPUT` — shared
  with group-list-product utils and `formatDateTime` (5 consumer files).
- `src/redux/slices/common.slice.ts`'s `getListAddOns`,
  `getListDistributionProductAddons`, `getListContractTemplates`,
  `getListAffiliatedPartners` — shared with contract-template and others.
- `src/components/forms/search/add-on-searcher.form.tsx` and the two import
  list validator components.
- Route/menu registrations: `main.routes.tsx:227-228`,
  `form.routes.tsx:630-640`, `pages.tsx:41-44`, `menus.helper.ts:197-201`.
- `src/layouts/form.layout.tsx` — shared by every form in the repository; the
  `formData` clone channel, `submitForm`, and `handleConfirm` are relied on
  by create and view here specifically.
- `src/utils/api-service.ts` (`ApiFetcher`) — auth/401 handling for every
  module.
- `src/redux/slices/fee-definition.slice.ts`'s `watchFeeDefinitionLoading`
  and `src/redux/slices/product-industry.slice.ts`'s history thunks — both
  shared with other modules.
- `helpers/offsetLoan.helper.ts` — its exported `OffsetLoanType` shares a name
  with (but differs from) the global ambient type.
- `components/distributions.tsx` — the shared container for all four
  distribution variants.

## 15. Open questions

1. Backend behavior for the literal trailing space in `POST
   add-on-products ` (§6, §13 item 3). NEEDS-VERIFICATION.
2. Backend expectations for date fields given the literal-`10`-hour format
   constant and create's unformatted raw Dayjs payload (§13 item 2).
   NEEDS-VERIFICATION.
3. Backend list response keys (`updatedDate` vs. `lastUpdated`) and whether
   `distribution` is always a comma-separated string (§13 item 11).
   NEEDS-VERIFICATION.
4. Whether `associatedPartnerId` (create) and `associatedPartner.id`
   (edit/view) are both accepted by the backend, and which is canonical (§13
   item 4). NEEDS-VERIFICATION.
5. Whether the stray `contactIds` field and the never-set
   `contractLoanCompensationIds` field are tolerated by the backend (§13 item
   4). NEEDS-VERIFICATION.
6. Whether `updateSummaryProductAddon`/`updateFeeProductAddon` (and their
   middleware listeners) were intentionally retained for future use, or are
   safe to remove. **NEEDS-TEAM-DECISION** before anyone proposes deleting
   them.
7. Whether a stale `updatedAddOnProduct` draft can actually be submitted
   against a different product after navigating away without Cancel (§13
   item 1). Requires runtime reproduction.
8. Intended behavior of `credit-card.tsx:78`'s `allowDecimals` reading the
   loan-side field (§13 item 10). NEEDS-VERIFICATION with product/BA.
9. Whether the edit/view spinner should keep following
   `fee-definition.slice` or should follow the add-on slice instead.
   **NEEDS-TEAM-DECISION**.
10. Whether the users pickers and configuration pages should continue
    sharing the add-on list/pagination state as-is, or whether that coupling
    should eventually be narrowed. **NEEDS-TEAM-DECISION**.
11. Runtime effect of the single `isFormValid` setter shared by both create
    sections on save-button correctness (§13 item 8). NEEDS-VERIFICATION.
12. Runtime effect of `ApiFetcher`'s unguarded `error.response.status` read
    and of a 401's `{data:null}` resolution reaching add-on reducers (§13
    item 9). NEEDS-VERIFICATION.
13. Status-transition rules and the `reason` body's exact semantics for `PUT
    .../:id/:status`. Backend authority; NEEDS-VERIFICATION.
14. Scheduled-display business semantics for `isScheduled`/`startDate`/
    `endDate` across create and edit. NEEDS-VERIFICATION.
15. Whether `common.slice.ts`'s `getListDistributionProductAddons`
    (`products/product-addons/assignable`) consumers overlap in practice with
    this module's own reference thunks. Not traced in this pass;
    NEEDS-VERIFICATION, out of this module's direct scope.
