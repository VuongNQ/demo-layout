# Attractive Offer — Module Documentation

> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

First-pass documentation, written 2026-11-05 against revision `8562c125`
(branch `portal-cham-vay`, working tree otherwise clean of changes to this
module). This module was previously entirely undocumented — flagged as such
in `docs/reports/2026-11-04/products-docs-reconciliation.md` Step 2 and
`docs/modules/products/OVERVIEW.md`'s Submodule Inventory (no row existed).
Evidence basis: a full read of all 13 files under
`src/modules/products/attractive-offer/` (12 read in full;
`components/attractive-offer.styles.ts`, 575 lines, checked by export/import
grep only), repository-wide greps for routes/permissions/consumers, one
non-mutating `npx tsc --noEmit -p tsconfig.app.json` run (reported zero
errors for this module; one unrelated pre-existing error elsewhere), and
`git log -- src/modules/products/attractive-offer` (returned only 2 commits
whose messages do not describe this module — `NEEDS-VERIFICATION`, module
history is not reliably attributable from this log alone).

Verification gaps (top five, ordered by consequence; remainder in §15):

1. Whether `GET product-attractive-offer` can return a response whose
   `code` never matches `ATTRACTIVE_OFFER_CODE`, in which case the editor
   silently loads and could overwrite a different group (§6, §13 defect 1).
2. Whether an assigned item's `productId` can be absent, causing a silent
   id-matching failure between assigned items and the catalog (§13 defect 2).
3. Backend permission enforcement for the history GET and the config PUT —
   frontend route/button gating is not a backend boundary (§9).
4. The `pageInfo`/`totalElements`/`currentPage` shape assumptions in the
   history and catalog paginated responses (§6, §13 defects 4-5).
5. Whether the `CL`-scoped catalog duplication with `popular-loans/` (§10)
   reflects one real backend contract that should be shared, or two
   independently diverging ones (`NEEDS-TEAM-DECISION`).

## 1. Responsibility

A single cash-loan-scoped configuration screen for a group named "Ưu đãi hấp
dẫn khác" ("Other attractive offers"), under the product-issuance menu
(`Menu.attractiveOffer`, parent `Menu.productIssuance`,
`src/helpers/menus.helper.ts:230-232,248-251`; vi label
`src/lang/vi.json:40`, en label `src/lang/en.json:120`). The screen lets an
operator set a group name (max 30 chars), an on/off switch, and an ordered
list of assigned cash-loan products, with add/remove/reorder (arrows or
drag) and a separate "Lịch sử" (history) tab of an update-history table.

Scope is hard-coded to cash loan: `ATTRACTIVE_OFFER_CODE =
'CASH_LOAN_ATTRACTIVE_OFFER'` (`constants.ts:1`), catalog query
`productLineCode: 'CL'` (`api-mappers.ts:21`), and the view-cancel target
`PageURLs.ofProductList('cash-loan')` (`view/form.tsx:57`). There is no
create route; only view and edit exist for this one configuration record.

`src/modules/products/configuration/display-information-set/` carries a
boolean `showInAttractiveOffer` (its `types.ts:44,92,113`,
`mappers.ts:27,55`) that nothing in this module reads. Whether the backend
uses that flag to filter the assignable set is `NEEDS-VERIFICATION`.

## 2. Entry points and routes

| Path | Layout file | Guard | Permission | Page |
| --- | --- | --- | --- | --- |
| `product/attractive-offer/view` | `src/routes/form.routes.tsx:405-413` | `WithGuard` + `AuthGuard` | `PERMISSIONS.PRODUCT_ATTRACTIVE_OFFER_VIEW` | `ViewAttractiveOfferConfig` |
| `product/attractive-offer/edit` | `src/routes/form.routes.tsx:415-423` | `WithGuard` + `AuthGuard` | `PERMISSIONS.PRODUCT_ATTRACTIVE_OFFER_EDIT` | `EditAttractiveOfferConfig` |

Both are registered only in `form.routes.tsx`; `src/routes/index.tsx` and
`src/routes/main.routes.tsx` have no match for this module. Both page
exports are `lazy()` in `src/routes/pages.tsx:154-155`
(`@/modules/products/attractive-offer/view/form` and `.../edit/form`),
consistent with the repository's lazy-loading convention
(`.claude/rules/06-routing-permission.md`). No eager import exists. The
route file itself has no grep-visible `BasicLayout`/`MainLayout` identifier
string, so the exact layout wrapper for this route pair is
`NEEDS-VERIFICATION` directly from source (the file's convention per
`.claude/PROJECT_CONTEXT.md` is `BasicLayout`, but that was not re-confirmed
by a literal match in this pass).

`PageURLs` (`src/utils/navigate.ts:90-95`):
`ofAttractiveOfferConfig(tab = '')` → `/product/attractive-offer/view[?tab=]`;
`ofAttractiveOfferEditConfig(tab = '')` → `/product/attractive-offer/edit[?tab=]`.
`withPrefix` is an identity function (`navigate.ts:3-5`).

Menu entry: `src/helpers/menus.helper.ts:248-251`, requires only
`PRODUCT_ATTRACTIVE_OFFER_VIEW`. Sibling menu entries under the same
`product-issuance` parent include popular-loans and exclusive-touch.

`?tab=` selects `attractive-offer` or `history` (`ATTRACTIVE_OFFER_TABS`,
`constants.ts:3-6`); deep-linking into the history tab is only offered from
view mode (`getAttractiveOfferTab(value, includeHistory = mode === 'view')`,
`navigation.ts`). No dead or unrouted component exists in this module —
every file is reachable from one of the two route pages.

## 3. Directory map

| File | Purpose |
| --- | --- |
| `api-mappers.ts` (543 lines) | Endpoint constants, catalog query defaults, raw response DTO shapes, response→domain mappers, update-payload builder, `createAttractiveOfferApi(fetcher)` factory and the default singleton bound to `window.apiFetcher`. |
| `components/attractive-offer-editor.tsx` (502 lines) | Core container: load, draft/baseline state, dirty tracking, save, exit/discard guard, tab switching; renders the config panel and `AttractiveOfferTabs`. |
| `components/attractive-offer-product-table.tsx` (247 lines) | Assigned-products table: arrow reorder, drag-sort reorder, remove, row-move highlight animation. |
| `components/attractive-offer-tabs.tsx` (48 lines) | AntD `Tabs`; config panel `forceRender: true`, history panel not force-rendered. |
| `components/attractive-offer-add-product-modal.tsx` (68 lines) | Adapter wrapping the shared `AddProductModal` for `getAssignableProducts`. |
| `components/attractive-offer.styles.ts` (575 lines) | Emotion `css` style exports; 40 total, 12 with no in-module or external reference (§13). |
| `constants.ts` (15 lines) | Group code, tab keys, message strings/codes (two of the codes are unused — §13). |
| `edit/form.tsx` (113 lines) | Edit route page: `FormLayout` wrapper, exit-handler registration. |
| `navigation.ts` (18 lines) | `getAttractiveOfferTab`, `getAttractiveOfferEditUrl`. |
| `types.ts` (51 lines) | Domain/UI types; one exported type (`AttractiveOfferSavePayload`) is unused and shape-stale (§13). |
| `utils.ts` (122 lines) | Pure helpers: dirty check, range/amount formatting, validation; two helpers are dead code (§13). |
| `view/form.tsx` (86 lines) | View route page: `FormLayout` wrapper with permission-gated Edit button. |
| `view/history.tsx` (113 lines) | History tab: fetch + paginate update-history on mount/page change. |

## 4. Main runtime flows

**View mount** (`/product/attractive-offer/view`): `ViewAttractiveOffer`
(`view/form.tsx:45-86`) renders `FormLayout` (`footerType='view'`,
`confirmText='Chỉnh sửa'`, Edit button gated by `canEdit`) around
`AttractiveOfferEditor mode='view' historyPanel={<History/>}`. The editor's
mount effect calls `loadData` → `attractiveOfferApi.getEditorData()`
(`editor:115-137`, `api-mappers.ts:410-428`), which issues two parallel GETs:
`api/admin/portal/v1/product-attractive-offer` and
`api/admin/portal/v1/products/search/assignable` (query `PRODUCT_CATALOG_QUERY`).
On success, `baseline`/`draft`/`products` state is set and
`form.setFieldsValue({name, enabled})` runs; on failure, `loadError` renders
a retry Alert (`editor:452-469`). View mode shows a `Skeleton` while loading.

**Edit mount** (`/product/attractive-offer/edit`): same `loadData` call;
while loading the editor returns `null` (`editor:436-439`) with no
parent-loading-indicator comment (flagged in §13, required by
`.claude/rules/07-component.md`), relying on `FormLayout`'s own loading
state.

**User actions** (all in `attractive-offer-editor.tsx` unless noted):
add product opens `AttractiveOfferAddProductModal` →
`getAssignableProducts` per filter/page change; confirm merges chosen
products into `products` and appends ids to `draft.productIds`
(`:237-263`). Remove filters the id out of `draft.productIds`
(`:265-275`); the product object stays in `products`. Reorder via arrow
buttons swaps array positions inline in `attractive-offer-product-table.tsx:103-122`
(not via the `reorderItems` helper in `utils.ts`, which is dead — §13);
drag-sort calls `handleSort` (`:124-130`); both flow through
`handleProductsChange` (`editor:225-235`) to rewrite `draft.productIds`
order. Name/enabled edits mirror into `draft` via `onValuesChange`
(`:205-223`).

**Save**: `FormLayout`'s confirm button validates the AntD form, then calls
`submitForm` (`() => form.submit()`, `editor:368`) since edit passes no
`onConfirm`, triggering `Form onFinish={handleFinish}` (`editor:277-340`).
`handleFinish` builds `nextDraft`, runs `validateAttractiveOffer` (name
non-blank after trim; message code `MSG_PT_POP_080`), and on success calls
`attractiveOfferApi.updateConfig(nextDraft, baseline)` → PUT
`api/admin/portal/v1/product-attractive-offer`. On success it resets
baseline/draft/form, dispatches a success notification via the global
`notification.slice`, and calls `onExit()` → navigates to
`ofAttractiveOfferConfig()`. On validation failure it sets the `name` field
error and dispatches an error notification; on API failure it reads
`error?.response?.data?.errorMessage || error?.message` with a fallback
string.

**Cancel/exit**: edit Cancel calls a registered `requestExit` that shows a
discard-changes modal only if `isDirty` (`editor:342-362`); view Cancel
navigates directly to `PageURLs.ofProductList('cash-loan')` with no dirty
check (view has nothing to discard). Entering edit from view preserves the
current `?tab=`.

**Tab switch**: `requestTabChange` (`editor:172-195`) shows the same discard
modal when dirty in edit mode, restores the baseline before switching, and
writes the tab to the URL with `replace: true`.

**History tab** (`view/history.tsx`): on mount calls
`attractiveOfferApi.getHistories({page, size})` → GET
`api/admin/portal/v1/product-attractive-offer/history`; renders via
`CustomPagination` (`current = currentPage + 1`, assumed 0-based backend
page — `NEEDS-VERIFICATION`). No request cancellation or stale-response
guard exists for rapid page/size changes (§13 defect 6). The history panel
is not `forceRender`-ed in `AttractiveOfferTabs`, so (LIKELY, not
runtime-verified) it only mounts/fetches on first activation of that tab.

## 5. State ownership

No Redux slice, no middleware, and no TanStack Query usage exist for this
module — confirmed by `grep -rli "attractive" src/redux src/services
src/queryKeys` (no matches) and `grep -rnE
"@tanstack|react-query|useQuery|useMutation" src/modules/products/attractive-offer`
(no matches). The only Redux touchpoint is dispatching to the global
notification slice (`useAppDispatch`, `setNotification`,
`editor:17-18,93,299-302,316-320`) — an allowed single notification owner,
not state ownership of this resource.

State ownership is entirely local to the mounted `AttractiveOfferEditor`
component: `baseline` (last-saved snapshot, `editor:96`), `draft` (working
copy, `:97`), `products` (catalog+assigned cache for the screen, `:98`),
plus `loading`/`loadError`/`saving`/`addModalOpen` flags. `name`/`enabled`
are dual-held in the AntD Form store and mirrored into `draft` on change
(one-way sync, reconciled at save). There is no persistence or cache
sharing across the view/edit routes or across remounts; each mount reloads
fresh from the API. Dirty check is
`JSON.stringify(draft) !== JSON.stringify(baseline)` (`utils.ts:42-47`),
which is order-sensitive on `productIds` — reordering alone marks the
screen dirty. This is feature-local state, structurally similar in file
shape to `popular-loans/` (both use an `api-mappers.ts` + local-state
editor pattern), but this conclusion was reached from attractive-offer's
own source, not by analogy; see §10 for the literal code duplication
between the two modules' catalog-query/mapper/utility functions.

## 6. API boundaries

All calls go through `window.apiFetcher` (typed `ApiFetcher` from
`@/utils/api-service`, declared `src/types/window.d.ts:5`); the
`ApiFetcher` implementation itself was not re-read in this pass.

| Endpoint constant | Path | Method | Caller |
| --- | --- | --- | --- |
| `ATTRACTIVE_OFFER_ENDPOINT` | `api/admin/portal/v1/product-attractive-offer` | GET | `getEditorData` |
| same | same | PUT (`AttractiveOfferUpdatePayload`) | `updateConfig` |
| `ATTRACTIVE_OFFER_HISTORY_ENDPOINT` | `api/admin/portal/v1/product-attractive-offer/history` | GET (`{page, size}`) | `getHistories` |
| `PRODUCT_CATALOG_ENDPOINT` | `api/admin/portal/v1/products/search/assignable` | GET (`PRODUCT_CATALOG_QUERY`) | `getEditorData` |
| same | same | GET (dynamic query) | `getAssignableProducts` |

Catalog query defaults (`api-mappers.ts:17-26`): `page 0`, `size 99999`,
`status 'ACTIVE,UPCOMING'`, `productLineCode 'CL'`, `context 'PRODUCT'`,
`action 'CREATE'`, `isScheduled true`, `isCustomerSegment true`.

Update payload shape (`api-mappers.ts:109-117,390-406`): `{code, name,
active, items: [{productId, position}]}`; `code` falls back
`config.code || baseline?.code || ATTRACTIVE_OFFER_CODE`; `position` is
1-based.

The editor-data group is selected as
`response.find(code === ATTRACTIVE_OFFER_CODE) ?? response[0]`
(`api-mappers.ts:351-352`) — see §13 defect 1 for the cross-group-overwrite
risk this fallback creates.

Error handling: `getHistories` catches all errors into an empty page with
no notification, so a failed history load is indistinguishable from a
genuinely empty one (§13 defect 3). `getEditorData`/`updateConfig` do not
catch internally; the editor catches at the call sites. No `AbortSignal` is
passed anywhere in this module (no request cancellation).

## 7. Forms and validation

Ant Design `Form.useForm<AttractiveOfferFormValues>()` with two fields:
`name` (`Input`, `maxLength={30}`, no AntD `rules`) and `enabled` (`Switch`,
`valuePropName='checked'`). There is no Zod schema in this module (grep
returned nothing) and no AntD `rules`-based validation — the only
validation is the custom `validateAttractiveOffer` (`utils.ts:101-109`),
invoked explicitly in `handleFinish` on submit, with failures mapped via
`form.setFields([{name: 'name', errors: [...]}])`.

`FormLayout`/`FormRef` integration is standard: edit exposes
`{form, submitForm}` (`edit/form.tsx:34-41`), view exposes `{form}` only
(`view/form.tsx:26-32`). Because edit's `footerType` is not `'view'`,
`FormLayout` runs `form.validateFields()` before calling `submitForm`,
which itself triggers AntD's `onFinish` — the form is effectively validated
twice per save (redundant, not a defect). `productIds` are not part of the
AntD form values; they live only in `draft` and are merged into the request
in `handleFinish` separately from `values.name`/`values.enabled`. There is
no create mode for this module.

## 8. Types and DTO organization

`types.ts` holds domain/UI types: `AttractiveOfferMode`,
`AttractiveOfferTab` (a literal union parallel to, not derived from,
`ATTRACTIVE_OFFER_TABS` in `constants.ts`), `ProductStatus` (extends the
existing ambient `EProductStatus` enum from `@/enums/common.enum` — a
pre-existing enum, not a new one, so it does not violate the no-new-enum
rule), `RangeValue`, `AttractiveOfferProduct`, `AttractiveOfferConfig`,
`AttractiveOfferFormValues`, `AttractiveOfferEditorRef`, and the dead
`AttractiveOfferSavePayload` (§13).

`api-mappers.ts` holds the API-facing DTOs: `AttractiveOfferApiItem` (all
fields optional, most `unknown`), `AttractiveOfferApiGroup`,
`ProductCatalogApiProduct`/`ProductCatalogApiResponse`,
`AttractiveOfferUpdatePayload`, `AttractiveOfferEditorData`, and an
injectable `AttractiveOfferApiFetcher` shape used only by the factory, not
by the default singleton. `unknown`-typed fields are narrowed by explicit
mapper helpers (`toFiniteNumber`, `toDateString`, `toStatus`,
`toRangeValue`) — real runtime narrowing, though not schema-validated.
Several `any` escape hatches remain at the boundary
(`api-mappers.ts:457,491,511,513`; `editor:323`), consistent with this
being a stable-but-undocumented CRUD contract rather than a Zod-validated
one; per `.claude/rules/03-api-service.md`, absent Zod parsing on this kind
of contract is not itself flagged as a gap.

Ambient/global types consumed without import: `UpdatedHistory`
(`src/types/product-industry.d.ts:131-138`) and `PageChangeParams`
(`src/types/pagination.d.ts:13-19`), plus the global `window.apiFetcher`
(`src/types/window.d.ts`) and `FormRef` (`src/types/form.d.ts`). These are
shared ambient contracts; changing them affects other modules.

## 9. Permissions

| Permission | Enforced at |
| --- | --- |
| `PRODUCT_ATTRACTIVE_OFFER_VIEW` (`permission.constant.ts:129`) | Menu entry (`menus.helper.ts:251`); view route (`form.routes.tsx:411`) |
| `PRODUCT_ATTRACTIVE_OFFER_EDIT` (`permission.constant.ts:130`) | Edit route (`form.routes.tsx:421`); Edit button visibility in view (`view/form.tsx:49,81`) |

Both are single-permission checks (trivial OR semantics). A user with EDIT
but not VIEW can reach the edit route directly by URL but will not see the
menu entry — an asymmetry worth noting, not necessarily a defect. The
history tab inside the view route has no separate frontend permission gate
(any VIEW user sees it). Backend enforcement for the history GET and the
config PUT was not verified from this checkout (`NEEDS-VERIFICATION`);
frontend checks are not a backend security boundary.

## 10. Shared and cross-domain dependencies

Shared app infrastructure used: `@/layouts/form.layout` (`FormLayout`),
`@/types/form` (`FormRef`), `@/utils/navigate` (`PageURLs`),
`@/constants/permission.constant`, `@/hooks/auth.hook`
(`useHasPermission`), `@/hooks/modal.hook` (`useModal`),
`@/redux/slices/notification.slice` (`setNotification`),
`@/components/button`, `@/components/modal-content`,
`@/components/add-product-modal` (shared `AddProductModal` +
`FetchProductsParams`), `@/components/drag-sort-table`,
`@/components/table-card-status`, `@/components/table-date-time`,
`@/components/pagination`, `@/constants/pagination.constant`. Styling is
Emotion (`css` prop, `/** @jsxImportSource @emotion/react */` pragma in 4
files) — classified `legacy-compatible` per
`.claude/rules/10-styling.md`, not a violation.

One confirmed cross-module import: `view/history.tsx` imports
`convertFieldActionType` from
`@/modules/products/configuration/industry-product/ultis`, a helper also
consumed by `src/modules/contents/t&c-place/view/history.tsx` and
`src/modules/notifications/configuration/list-notification/view/settings/history.tsx`
— a proven, pre-existing cross-domain dependency this module participates
in but does not own.

**Unresolved ownership question (`NEEDS-TEAM-DECISION`):** this module's
catalog endpoint constant and query defaults
(`PRODUCT_CATALOG_ENDPOINT`/`PRODUCT_CATALOG_QUERY`, `api-mappers.ts:14-26`)
are byte-for-byte identical to `popular-loans/api-mappers.ts:13-26`, and
`utils.ts` in both modules exports same-named functions
(`isInSchedule`/`getAssignedProducts`/`formatLoanAmount`/`formatTenor`/
`reorderItems`/`validatePopularLoans`-equivalents) with no import between
the two modules. Whether this is intentional feature-local duplication (per
`.claude/rules/01-architecture.md` "Local-first ownership" — small local
duplication is valid when business rules may diverge) or an un-extracted
shared contract was not established from source; no shared location is
assumed here.

## 11. Consumers

Exhaustive `grep -rn "attractive-offer" src` outside the module directory
returns only: `src/routes/form.routes.tsx:406,416` (path strings),
`src/routes/pages.tsx:154-155` (the two `lazy()` imports — the only real
code consumers), and `src/utils/navigate.ts:91,95` (URL strings). No other
file imports from `src/modules/products/attractive-offer/**`. `PageURLs.ofAttractiveOfferConfig`
is called from `menus.helper.ts` and `edit/form.tsx`;
`ofAttractiveOfferEditConfig`/`getAttractiveOfferEditUrl` is called only from
`view/form.tsx` via `navigation.ts`.

`src/modules/products/configuration/display-information-set/` carries a
`showInAttractiveOffer` flag that references this feature by name in its
own domain but is not imported by, or an import target of, this module —
listed here as a named but unconfirmed data relationship, not a code
consumer (`NEEDS-VERIFICATION`, see §1).

## 12. Pattern classification

`target-compatible`: no Redux slice/middleware added, no application
`enum` introduced (the one enum reference is pre-existing), `ApiFetcher`
used exclusively as the transport boundary, `FormLayout`/`FormRef`
contracts preserved, Emotion styling consistent with its legacy-compatible
classification, one explicit notification owner (no duplicate toasts
found).

`legacy-compatible`: hard-coded Vietnamese UI strings with no `t()` keys
anywhere in the module (zero `t(` occurrences) — consistent with
`vi.json`/`en.json` only holding the menu label for this feature, not a
per-screen gap specific to this module.

`uncertain`: whether the feature-local, no-Redux/no-Query, single-component
state-ownership shape used here (and in `popular-loans/`) is an endorsed
module template or two independently-arrived-at implementations is
explicitly `NEEDS-TEAM-DECISION` at the repository level
(`.claude/ARCHITECTURE.md` §20, "Product Labels as the official module
template" row — this module is a different, smaller case of the same open
question, not Product Labels itself).

## 13. Technical risks

Ordered by decreasing consequence.

- **Silent cross-group overwrite risk.** `api-mappers.ts:351-352` selects
  the offer group as `response.find(code === ATTRACTIVE_OFFER_CODE) ??
  response[0]`. If the backend ever returns a response where no group
  matches `CASH_LOAN_ATTRACTIVE_OFFER`, the editor silently loads a
  different group's name/active/items, and saving PUTs with that other
  group's `code` — a potential overwrite of unrelated backend state.
  `NEEDS-VERIFICATION` whether this can occur.
- **Silent product disappearance.** `api-mappers.ts:322` falls an assigned
  item's `id` back to `item.productCode` when `productId`/`id`/catalog `id`
  are all absent. `getAssignedProducts` (`utils.ts:30-40`) keys by numeric
  `id`, so a string-code fallback would not match the catalog and the
  product would vanish from the visible table while its id is still saved
  in `draft.productIds` on the next save. `NEEDS-VERIFICATION` whether
  `productId` can be absent in practice.
- **Swallowed history failures.** `getHistories` (`api-mappers.ts:510-535`)
  catches every error into an empty page with no notification; a backend
  failure is indistinguishable from a genuinely empty history to the user.
- **No stale-response guard on history paging.** `view/history.tsx` has no
  `AbortSignal` or request-id guard; rapid page/size changes can resolve
  out of order and leave `loading=false` while a stale response is still
  pending.
- **Unsaved-draft loss on hard navigation.** The discard-changes guard
  (`editor:342-362`) only fires on the in-page Cancel button and in-page tab
  switches — there is no `beforeunload`/router-blocker guard (none found in
  the module or in `form.layout.tsx`), so browser back or a direct URL
  change silently drops an unsaved edit.
- **Stale/dead save-payload type.** `types.ts:33-40`
  `AttractiveOfferSavePayload` (`products: [{productId, priority}]`) has no
  references anywhere and does not match the real PUT body shape
  (`items: [{productId, position}]`) — a stale contract that could mislead
  a future reader into using it.
- **Unverified pagination base/shape assumptions.** `view/history.tsx:95`
  assumes a 0-based `currentPage`; `api-mappers.ts:493-497` falls `total`
  back to `items.length` when `pageInfo.totalElements` is absent, which is
  incorrect for a paged response if that field is ever missing.
- **Dead code and unused exports**, lower risk but worth recording: `utils.ts`
  `isInSchedule`, `reorderItems`, `toAttractiveOfferSavePayload`;
  `constants.ts` `NAME_REQUIRED_CODE`/`SAVE_SUCCESS_CODE` (the literal
  `'MSG_PT_POP_080'` is used directly instead of the constant); an
  unreachable empty-payload guard at `api-mappers.ts:436`; two dead props on
  `AttractiveOfferAddProductModal` (`products?`, `loading?`); 12 unused
  exports in `attractive-offer.styles.ts`.
- **Missing loading-indicator comment.** `editor:436-439` returns `null`
  while loading in edit mode with no comment identifying the covering
  `FormLayout` loading indicator, which `.claude/rules/07-component.md`
  requires.
- **Large, unbounded catalog fetch.** `size: 99999` (`api-mappers.ts:19`) is
  requested on every editor mount and default-filter modal load; backend
  size limits are `NEEDS-VERIFICATION`.

## 14. Areas to avoid touching

Do not alter the `code === ATTRACTIVE_OFFER_CODE ?? response[0]` fallback,
the PUT payload shape, or the `productId` numeric-coercion logic in
`api-mappers.ts` without first getting backend confirmation of the
risks in §13 — a narrow fix here can change which backend record is
written to. Do not merge this module's `utils.ts`/`api-mappers.ts` with
`popular-loans/`'s near-identical counterparts as an opportunistic
cleanup; the duplication is `NEEDS-TEAM-DECISION`, not an authorized
refactor target. Do not remove the dead code noted in §13 as an
incidental part of an unrelated change — removing `AttractiveOfferSavePayload`,
the unused constants, or the unused style exports is a separate,
explicitly scoped cleanup, not implied by this documentation pass. Do not
add i18n keys for this module's hard-coded Vietnamese strings as a side
effect of an unrelated fix; that is a `MODERATE`-risk i18n task of its own
under `.claude/rules/11-i18n.md`.

## 15. Open questions

- Whether the backend's `GET product-attractive-offer` response can ever
  omit the `CASH_LOAN_ATTRACTIVE_OFFER` group, and whether `productId` can
  be absent on an assigned item (§13, highest-consequence items).
- Whether `showInAttractiveOffer` in `display-information-set` actually
  drives which products this screen's catalog/assignment includes, or is
  an unrelated flag that happens to share a name (§1, §11).
- Whether the byte-identical catalog-query/mapper/validation duplication
  with `popular-loans/` (§10) should be extracted to a shared location, or
  is deliberately kept separate because the two features' business rules
  are expected to diverge — `NEEDS-TEAM-DECISION`, not resolved here.
- Backend permission enforcement for the history GET and config PUT (§9).
- The exact layout wrapper (`BasicLayout` presumed, not literally
  confirmed) for this route pair in `form.routes.tsx` (§2).
- Whether AntD logs a "not connected" warning for the
  `form.setFieldsValue` call that runs before the `<Form>` element mounts
  (`editor:127`) — not executed in this pass.
- Units of the `fa` (credit-limit) range — divided by 1,000,000 and
  labeled "triệu"; VND is assumed but not confirmed from source.
- Whether `git log -- src/modules/products/attractive-offer` returning only
  two unrelated-sounding commit messages reflects a squashed/rebased
  history or an incomplete log view (§0) — not pursued further in this
  pass since it does not affect current-state documentation accuracy.
