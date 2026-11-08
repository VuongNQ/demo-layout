# Popular Loans — Module Documentation

> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

Reconciled in this pass against revision `8562c125`, branch `improve/vuongnq`,
2026-11-05. Method: direct read of all 13 files under
`src/modules/products/popular-loans/` by this session, plus a dedicated
read-only `codebase-analyzer` subagent pass that traced routes, permissions,
menu, API endpoints, and consumers outward from the folder. `find
src/modules/products/popular-loans -type f | wc -l` → **13**, matching the
file list below exactly; no discrepancy to record.

This reconciliation resolves row 16 of
`docs/reports/2026-11-04/products-docs-reconciliation.md`, which flagged this
document's core architecture claims as "likely still true, not independently
re-verified." All of them are now `CONFIRMED` against fresh source:

- "Feature-local API coordinator and local editor state, no Redux slice" — **CONFIRMED** (`src/redux/slices.ts` and `src/redux/slices/` have no popular-loans entry).
- `POPULAR_LOANS_CODE = 'VAY_PHO_BIEN'` — **CONFIRMED** (`constants.ts:1`).
- `validatePopularLoans` returns `MSG_PT_POP_080` — **CONFIRMED** (`utils.ts:101-109`, literal at `:105`).
- Zero-based `position` in the live save payload vs. a one-based `priority` elsewhere — **CONFIRMED, but revised**: the one-based `toPopularLoansSavePayload` (`utils.ts:111-122`) has **no call site anywhere in `src/`**. It is dead code, not a legacy-compatible alternate path as the previous version of this document implied.
- `PRODUCT_POPULAR_LOANS_VIEW`/`PRODUCT_POPULAR_LOANS_EDIT` permissions — **CONFIRMED** (`permission.constant.ts:125-126`).

Verification gaps (at most 5, ordered by consequence; remaining gaps are in §15):

1. Whether the backend can ever return more than one product group from `GET product-popular`, which would make the silent `response[0]` fallback in `api-mappers.ts:350-351` pick the wrong group — **NEEDS-VERIFICATION**.
2. Whether an `EDIT`-only permission grant implies `VIEW` on the backend; the frontend route/menu asymmetry (§9) assumes it does — **NEEDS-VERIFICATION**.
3. Whether `GET product-popular`/`GET products/search/assignable` can legitimately return an empty/malformed body that the mapper silently turns into a blank, savable draft (`api-mappers.ts:417-421`) — **NEEDS-VERIFICATION**.
4. Which layout (`MainLayout`/`BasicLayout`) the two routes render under — not independently re-verified against `src/routes/form.routes.tsx`'s own layout wrapper in this pass — **NEEDS-VERIFICATION**.
5. Whether `products/search/assignable` and `product-popular/history` always return a `pageInfo.totalElements`, since both call sites fall back to the current page's item count when absent (`api-mappers.ts:472-476`) — **NEEDS-VERIFICATION**.

## 1. Responsibility

A two-route admin feature for the "Vay phổ biến" (Popular Loans) product
group (`POPULAR_LOANS_CODE = 'VAY_PHO_BIEN'`, `constants.ts:1`): a read-only
view page with a history tab, and an edit page to rename the group, toggle it
enabled/disabled, and add/remove/reorder its assigned cash-loan products.
Saving replaces the group's full product list via one `PUT`. All editor
state is component-local; there is no Redux slice and no TanStack Query for
this feature.

## 2. Entry points and routes

Both routes are declared in `src/routes/form.routes.tsx` (not
`src/routes/index.tsx`, which is now a 34-line assembly shell per
`.claude/rules/06-routing-permission.md`):

| Path | Line | Page (lazy via `pages.tsx:152-153`) | Permission | Kind |
| --- | --- | --- | --- | --- |
| `product/popular-loans/view` | `form.routes.tsx:386-392` | `ViewPopularLoansConfig` | `PERMISSIONS.PRODUCT_POPULAR_LOANS_VIEW` (`:391`) | single permission |
| `product/popular-loans/edit` | `form.routes.tsx:396-402` | `EditPopularLoansConfig` | `PERMISSIONS.PRODUCT_POPULAR_LOANS_EDIT` (`:401`) | single permission |

Both are wrapped in `WithGuard` (`form.routes.tsx:388-392`, `:398-402`),
imported from `pages.tsx:75-76`. Which layout (`MainLayout` vs `BasicLayout`)
wraps `form.routes.tsx`'s routes was not independently re-verified in this
pass — `NEEDS-VERIFICATION` (listed in §0).

`WithGuard` → `AuthGuard` → `GuardedPage` (`src/guards/index.tsx:27-58`)
performs an OR check (`permissions.some(...)`, `:32`) — confirmed a kind-1
single-permission check for each route per
`.claude/rules/TEMPLATE.md` rule 14, since each array above has exactly one
element; it is not an OR array of multiple permissions and not a dynamic
resolver. On failure it navigates to `of404()`; it also redirects
trailing-slash URLs (`:36-45`) and renders under `RouteSuspense` (`:47-49`).

Permission constants exist and are referenced exactly where claimed:
`PRODUCT_POPULAR_LOANS_VIEW = 'product_popular:view'`,
`PRODUCT_POPULAR_LOANS_EDIT = 'product_popular:edit'`
(`permission.constant.ts:125-126`).

**Confirmed permission asymmetry** (see §9, §13 for the risk): the edit
route checks only `EDIT` (`form.routes.tsx:401`); the view route and the menu
entry check only `VIEW` (`:391`; `menus.helper.ts:239`). A component-level
`useHasPermission` call exists only in `view/form.tsx:45-46`
(`canEdit = hasPermission([PRODUCT_POPULAR_LOANS_EDIT])`), gating the
view page's "Edit" action button and its "hide update button" FormLayout
prop. `useHasPermission`'s default mode is `'some'` (OR) per
`auth.hook.ts:27`.

## 3. Directory map

| File | Responsibility |
| --- | --- |
| `api-mappers.ts` | Endpoint constants, response mappers, `createPopularLoansApi(fetcher)` factory, and the singleton `popularLoansApi` bound to `window.apiFetcher` (`:519-522`). |
| `types.ts` | Domain/view model, form, and editor-ref types (§8). |
| `constants.ts` | `POPULAR_LOANS_CODE`, tab keys, message/code constants (two of which are unused — §15). |
| `utils.ts` | `getAssignedProducts`, `isPopularLoansDirty`, `validatePopularLoans`, formatters, plus three dead exports (`isInSchedule`, `reorderItems`, `toPopularLoansSavePayload` — §15). |
| `navigation.ts` | `getPopularLoansTab`, `getPopularLoansEditUrl`. |
| `components/popular-loans-editor.tsx` | The single editor (501 lines), parameterized by `mode: 'edit' \| 'view'`; owns the AntD form, baseline, draft, product cache, and all save/exit/tab logic. `forwardRef` exposes `form`, `submitForm`, `requestExit`. |
| `components/popular-loans-tabs.tsx` | AntD `Tabs` wrapper; the history pane only renders when `historyPanel` is supplied. |
| `components/popular-loans-product-table.tsx` | Assigned-product table: up/down move, drag reorder (`DragSortTable`), delete, and a row-highlight animation keyed off `data-row-key`. |
| `components/add-product-modal.tsx` | Thin wrapper over the shared `@/components/add-product-modal`, supplying `onFetchProducts`. |
| `components/popular-loans.styles.ts` | Emotion `css` style exports — also imported by `cash-loan/view/loan-packages.tsx` (§11). |
| `edit/form.tsx` | Edit page: `FormLayout` shell, exit-handler registration. |
| `view/form.tsx` | View page: `FormLayout` shell, `canEdit` permission gate, navigation to Edit. |
| `view/history.tsx` | History table and pagination for the group's change history. |

## 4. Main runtime flows

**View flow.** `view/form.tsx` renders `FormLayout` (`:69-81`) with
`footerType='view'`, `onConfirm={canEdit ? handleEdit : undefined}` (`:78`),
and `hiddenUpdateBtn={!canEdit || tab === HISTORY}` (`:80`). The editor
mounts in `mode='view'`. On load, `loadData`
(`popular-loans-editor.tsx:113-131`) calls `popularLoansApi.getEditorData()`
(`:119`), which runs `Promise.all` of `GET product-popular` and
`GET products/search/assignable` (`api-mappers.ts:409-415`); success sets
baseline/draft/products/form fields (`:122-125`), failure sets a load error
rendered as a retryable `Alert` (`editor:450-467`). The active tab is read
from the URL (`editor:101-103, 141-149`). The history pane fetches lazily
(`view/history.tsx:74-76` → `handlePageChange` → `GET
product-popular/history`, `api-mappers.ts:490`) only once its tab is
activated.

**Edit flow.** `edit/form.tsx`'s `FormLayout` (`:102-111`) has no
`onConfirm`; submission goes through `FormLayout`'s own
`validateFields` → `submitForm` → `editor.form.submit()`
(`form.layout.tsx:216-223`; `editor:366`). Add/remove/reorder all mutate
`draft.productIds` through `handleProductsChange`
(`editor:223-233`):

- **Add:** the shared catalog modal confirms a selection → `handleAddProducts` (`editor:235-261`) merges into the product cache by id and appends new ids with de-duplication.
- **Remove:** `handleRemoveProduct` (`editor:263-273`) filters `draft.productIds`.
- **Reorder:** adjacent-swap arrows (`popular-loans-product-table.tsx:103-122`) or drag (`:124-130`), both funneling into `handleProductsChange`.

**Save:** `handleFinish` (`editor:275-338`) builds the next draft, runs
`validatePopularLoans` (`:284`), and on failure sets both a form field error
and an error notification without calling the API (`:288-302`). On success
it calls `updateConfig` → `PUT product-popular`
(`api-mappers.ts:437`), promotes draft to baseline, shows a success
notification, and calls `onExit()`, which navigates to the view route and
drops any `?tab=` query parameter (`edit/form.tsx:71-81`) — a minor,
low-consequence UX gap recorded in §13.

**Dirty-exit guard:** `isDirty`/`canSave` (`editor:110-111`) gate the Save
button and a confirmation modal (`requestExit`, `editor:340-360`) on
Cancel and on tab switch while dirty (`requestTabChange`, `:170-193`). This
guard covers only the in-page Cancel button and tab switching — it does
**not** cover sidebar navigation, browser back, or a page refresh; there is
no `useBlocker`/`beforeunload` hook in this folder, unlike the
`ChangeFormProvider`/`useChangeFormExitGuard` guard that `cash-loan`'s
create/edit forms use. See §13.

## 5. State ownership

No Redux slice exists for this feature (`src/redux/slices.ts` and
`src/redux/slices/` contain no popular-loans entry — `CONFIRMED`). Redux is
used only via `useAppDispatch` to fire global notifications
(`editor:17-18`, dispatched at `:295-300, 314-319, 327-332`); there is no
`useAppSelector` anywhere in the folder.

Local state in `popular-loans-editor.tsx` is organized as:

- **`baseline`** (`:94`) — the last server-confirmed config; set on load and on successful save.
- **`draft`** (`:95`) — the working copy; mutated by form field changes and every product add/remove/reorder/save handler.
- **`products`** (`:96`) — a catalog-plus-assigned product lookup cache, with assigned items merged in last (`api-mappers.ts:362-368`).
- **`assignedProducts`** — derived via `getAssignedProducts(products, draft.productIds)` (`editor:106-109`), not stored state.
- **Form values** (`name`, `enabled`) — owned by AntD `Form.useForm` (`editor:93`), the sole form-state owner per `.claude/rules/05-form.md`.

View and edit each mount their own editor instance and independently
refetch; there is no cross-page cache sharing, consistent with this being a
single-screen, component-local state pattern rather than a cacheable server
resource.

## 6. API boundaries

There is no `services/` folder and no `src/services/products/` file for
this feature; the API object lives directly in `api-mappers.ts` alongside
the response mappers, bound to `window.apiFetcher`
(`:519-522`) via an injectable factory `createPopularLoansApi(fetcher)`
(`:407`, used for testability/seam purposes). This predates the
`src/services/<module>/` convention adopted 2026-10-29
(`.claude/rules/03-api-service.md` `## Service location`); it is
**LEGACY-COMPATIBILITY**, not a defect — nothing in this pass found a reason
it must migrate now, and `.claude/rules/01-architecture.md`'s "do not
migrate unrelated legacy code merely to make the touched code look
consistent" applies.

Endpoints called (all through `window.apiFetcher`, never a direct
axios/fetch call):

| Method | Endpoint | Constant | Call site |
| --- | --- | --- | --- |
| GET | `api/admin/portal/v1/product-popular` | `POPULAR_LOANS_ENDPOINT` (`:10`) | `getEditorData` (`:411`) |
| GET | `api/admin/portal/v1/products/search/assignable` | `PRODUCT_CATALOG_ENDPOINT` (`:13-14`) | `getEditorData` (`:412`), `getAssignableProducts` (`:468`) |
| PUT | `api/admin/portal/v1/product-popular` | — (`:437`) | `updateConfig` (`:429-438`) |
| GET | `api/admin/portal/v1/product-popular/history` | `POPULAR_LOANS_HISTORY_ENDPOINT` (`:11-12`) | `getHistories` (`:490`) |

`window.apiFetcher` is assigned a `new ApiFetcher(appEnv.apiHost)` instance
in `src/providers/current-ctx.provider.tsx:31` and typed in
`src/types/window.d.ts:5`; `ApiFetcher.get`/`.put`
(`src/utils/api-service.ts:167, 197`) preserve the shared transport contract.

## 7. Forms and validation

Ant Design `Form`/`FormInstance` is the sole form-state owner; no React Hook
Form and no Zod import exist anywhere in this folder (grep-confirmed). The
one business rule, `validatePopularLoans` (`utils.ts:101-109`): when
`enabled` is true and the trimmed name is empty, it returns message code
`MSG_PT_POP_080` (literal at `:105`). It runs only at submit time
(`handleFinish`, `editor:284`), not on field change. The name `Form.Item` has
no AntD `rules` (`editor:378-388`) beyond a `maxLength` of 120 (`:386`); the
validator's error surfaces via `form.setFields` plus a notification
(`:289-300`), cleared on the next attempt (`:304`). A minor inconsistency:
validation trims the name before checking emptiness (`utils.ts:104`), but
the untrimmed value is what gets saved (`editor:281`;
`api-mappers.ts:395`) — recorded in §13, low consequence.

## 8. Types and DTO organization

`types.ts` exports: `PopularLoansMode`, `PopularLoansTab` (UI-state unions);
`ProductStatus` (re-exports `EProductStatus` from the existing ambient
`@/enums/common.enum`, a legacy enum, used as-is per
`.claude/rules/02-typescript.md`'s "an enum contract supplied by an existing
dependency may be consumed when necessary"); `RangeValue` (discriminated
union); `PopularLoanProduct` (view model); `PopularLoansConfig` (shared
draft/baseline shape); `PopularLoansFormValues` (AntD form shape);
`PopularLoansEditorRef` (imperative ref contract). `PopularLoansSavePayload`
(`:33-40`) is exported but has zero consumers — dead, paired with the dead
`toPopularLoansSavePayload` in `utils.ts` (§15).

`api-mappers.ts` keeps its own wire-shape types separate from the domain
types above: `PopularLoansApiItem`/`PopularLoansApiGroup` (raw server
shape), `ProductCatalogApiProduct`/`ProductCatalogApiResponse`,
`PopularLoansUpdatePayload` (`{code, name?, active?, items?: {productId,
position}[]}`, the live zero-based save contract), `PopularLoansEditorData`,
and `PopularLoansApiFetcher`. Two ambient globals are consumed without an
explicit import: `UpdatedHistory` (`src/types/product-industry.d.ts:131`)
and `PageChangeParams` (`src/types/pagination.d.ts:13`) — both existing
cross-feature ambient types, not something this folder introduced.

## 9. Permissions

Covered in full in §2. Summary: two single-permission route checks
(`PRODUCT_POPULAR_LOANS_VIEW`, `PRODUCT_POPULAR_LOANS_EDIT`), one
component-level `useHasPermission` call (`view/form.tsx:45-46`), and one
menu entry gated on `VIEW` only (`menus.helper.ts:235-240`, parent entry at
`:229-240` has no `requiredPermissions` of its own). Frontend permission
checks do not establish backend authorization.

## 10. Shared and cross-domain dependencies

Grep of `^import` across all 13 files found:

- Shared technical components: `@/components/add-product-modal`, `@/components/button`, `@/components/drag-sort-table`, `@/components/table-card-status`, `@/components/pagination`, `@/components/table-date-time`, `@/components/modal-content`.
- Shared hooks/utilities: `@/hooks/modal.hook`, `@/hooks/auth.hook`, `@/utils/navigate`, `@/constants/permission.constant`, `@/constants/pagination.constant`, `@/layouts/form.layout`, `@/types/form`.
- Redux: `@/redux/hooks`, `@/redux/slices/notification.slice` (notification dispatch only, per §5).
- Ambient legacy enum/types: `@/enums/common.enum`, plus the two ambient globals in §8.
- **One cross-module import**: `view/history.tsx:12` imports `convertFieldActionType` from `@/modules/products/configuration/industry-product/ultis` — a known, pre-existing cross-domain dependency also used by 10+ other `view/history.tsx` files across the repository (see `docs/modules/products/OVERVIEW.md` "External consumers of product-owned internals"), not something introduced by this feature.

## 11. Consumers

Routing/menu/URL wiring: `src/routes/pages.tsx:152-153`,
`src/routes/form.routes.tsx:75-76, 386-401`, `src/helpers/menus.helper.ts:233-239`,
`src/utils/navigate.ts:82-88`.

**One real cross-module consumer**: `src/modules/products/configuration/cash-loan/view/loan-packages.tsx:18-28`
imports nine style exports (`cardStyles`, `countStyles`,
`modalPaginationControlsStyles`, `modalPaginationRowStyles`,
`modalPaginationTextStyles`, `sectionHeaderStyles`, `sectionTitleStyles`,
`tableRootStyles`, `tableSurfaceStyles`) from
`components/popular-loans.styles.ts`. This means
`popular-loans.styles.ts` is a de facto shared styling dependency without
shared ownership — changing it changes `cash-loan`'s UI too. Not fixed in
this pass; recorded as a finding in §13.

No other file in the repository imports from
`src/modules/products/popular-loans/`. A filename collision exists with an
unrelated `simulation` asset (`popular_loans.png`,
`src/assets/images/simulation/_mapping_asset.ts:4,33`) — not a code
dependency.

## 12. Pattern classification

Feature-local API layer + local component state + AntD Form, no Redux slice,
no TanStack Query: this is **target-compatible** with
`.claude/ARCHITECTURE.md` §2/§11's "ephemeral/single-screen state → local
React state" and "new server resource → TanStack Query" guidance in spirit
(this is a pre-Query feature that never needed Redux, not a Redux resource
pending migration), though a feature built today would more likely place its
list/detail reads behind TanStack Query per current `.codex/knowledge/ARCHITECTURE.md`
direction. The feature-local `api-mappers.ts` endpoint layer (instead of
`src/services/products/`) is **LEGACY-COMPATIBILITY** per §6. Nothing here
requires restructuring for an unrelated change.

## 13. Technical risks

- **Wrong-group save on multi-group response:** `api-mappers.ts:350-351` silently falls back to `response[0]` when no group in the response matches `POPULAR_LOANS_CODE`; everything downstream (code/name/items, including the `PUT` payload's `code` at `:394`) then operates on whatever group that is. If the backend can ever return more than one group, this could save over the wrong one. `NEEDS-VERIFICATION`.
- **Permission asymmetry between routes:** the edit route checks only `PRODUCT_POPULAR_LOANS_EDIT` (`form.routes.tsx:401`); the view route and menu check only `PRODUCT_POPULAR_LOANS_VIEW` (`:391`; `menus.helper.ts:239`). A user with `EDIT` but not `VIEW` can reach the edit page directly, but `onExit()` after save navigates to the view route (`edit/form.tsx:71-73`), which that user cannot access. Whether `EDIT` implies `VIEW` on the backend is `NEEDS-VERIFICATION`.
- **Silent empty-response fallback:** a non-array/non-object/null response from `GET product-popular` maps to a blank, immediately-savable draft (`code: VAY_PHO_BIEN, name: '', enabled: false, productIds: []`) with no error surfaced (`api-mappers.ts:417-421, 370-376`). An edit user could unknowingly overwrite existing configuration believing the group has always been empty. `NEEDS-VERIFICATION` on whether the backend can actually return this shape.
- **Dirty-exit guard has gaps:** the unsaved-changes confirmation covers only the in-page Cancel button and tab switching (`editor:340-360, 170-193`); it does not cover sidebar navigation, browser back, or page refresh — there is no `useBlocker`/`beforeunload` hook here, unlike the `ChangeFormProvider` guard used by `cash-loan` create/edit forms.
- **Unbounded catalog fetch:** every editor load requests the product catalog with `size: 99999` (`api-mappers.ts:18, 412-414`) inside a `Promise.all` that fails the whole editor load if either request fails (`:410-415`). Backend tolerance for this page size is `NEEDS-VERIFICATION`.
- **History request race:** `view/history.tsx:25-43` has no request ID or abort signal; an out-of-order response can overwrite a newer one, and `finally` can clear the loading flag from a superseded request.
- **Silent history failure:** `getHistories` (`api-mappers.ts:489-514`) catches and returns an empty list on any failure; `view/history.tsx` has no error UI, so a true empty history and a failed fetch are indistinguishable to the user.
- **Catalog/history total-count fallback:** both `products/search/assignable` and `product-popular/history` fall back to the current page's item count when `pageInfo.totalElements` is absent (`api-mappers.ts:472-476`), which can produce an incorrect pagination total. `NEEDS-VERIFICATION` on whether the field is ever actually absent.
- **Shared styling without shared ownership:** `components/popular-loans.styles.ts` is imported by `cash-loan/view/loan-packages.tsx` (§11) — a de facto cross-module style dependency.
- **Whitespace name mismatch:** `validatePopularLoans` trims before checking emptiness (`utils.ts:104`) but the untrimmed value is what gets saved (`editor:281`; `api-mappers.ts:395`), so a name of only whitespace plus one visible character would pass validation and save with leading/trailing whitespace intact.
- **Unguarded response casts:** several `as`/`any` casts on API responses exist (`api-mappers.ts:418, 425, 451, 468-470, 490-492`; `editor:321`; `view/form.tsx:26`; `edit/form.tsx:37`). Consistent with this feature's stable-CRUD, typed-DTO-by-default boundary assumption per `.claude/rules/03-api-service.md`; not independently flagged as a defect, since TypeScript typing was never claimed to be runtime validation here.
- **Dead code:** `utils.ts`'s `toPopularLoansSavePayload` (`:111-122`, one-based `priority`, no call site), `isInSchedule` (`:8-28`), `reorderItems` (`:77-99`); `types.ts`'s `PopularLoansSavePayload` (`:33-40`); `constants.ts`'s `NAME_REQUIRED_CODE` and `SAVE_SUCCESS_CODE` (unused); an always-true-guard-condition at `api-mappers.ts:435` (`Object.keys(payload).length === 0`, but `payload` always has 3 keys); nine unused style exports in `popular-loans.styles.ts` (`pageTitleStyles`, `helperNoteStyles`, `modalToolbarStyles`, `modalSelectionInfoStyles`, `modalTableStyles`, `modalFooterStyles`, `emptyStateStyles`, `loadingStateStyles`, `tableOrderBadgeStyles`). Not fixed in this pass per `TEMPLATE.md` content rule 10 — recorded here and in §15, not removed.
- **Hardcoded Vietnamese strings, no `t()`:** throughout the editor, product table, history view, and constants (e.g. `editor:179, 348, 379, 391, 408, 417`; `product-table.tsx:135-232`; `history.tsx:48-68, 81`; `constants.ts:10-13`). **LEGACY-COMPATIBILITY**; `.claude/rules/11-i18n.md` applies only if this code is substantially touched.
- **Minor UX loss:** `onExit()` after a successful save drops the `?tab=` query parameter when returning to the view route (`edit/form.tsx:71-73`).
- **Row-highlight fragility:** the product table's highlight animation depends on AntD setting `data-row-key` on table rows (`popular-loans-product-table.tsx:57-101`); not independently verified against the installed AntD version in this pass.

## 14. Areas to avoid touching

- Do not change `toPopularLoansUpdatePayload`'s zero-based `position`
  semantics (`api-mappers.ts:397-402`) without confirming the backend
  contract first — it is the only live save path; its historical one-based
  sibling is dead code, not a fallback to preserve.
- Do not move this feature's local editor state to Redux or TanStack Query
  as an architecture-consistency exercise; `.claude/rules/01-architecture.md`
  and `.claude/rules/08-refactoring.md` both require an explicit, separately
  scoped task for that, not a side effect of a small fix.
- Do not change `components/popular-loans.styles.ts` without checking
  `cash-loan/view/loan-packages.tsx` (§11) — it is a real, if undocumented,
  cross-module consumer.
- Do not "fix" the permission asymmetry in §13 by unilaterally adding
  `VIEW` to the edit route or vice versa; that is a product/permission
  decision, not a code-cleanup task.
- Do not remove the dead code listed in §13 as part of an unrelated change;
  removal is a separate, explicitly scoped cleanup.

## 15. Open questions

- Whether `GET product-popular` can return more than one group, making the
  `response[0]` fallback (§13) pick the wrong one — `NEEDS-TEAM-DECISION` on
  priority, `NEEDS-VERIFICATION` on fact.
- Whether `PRODUCT_POPULAR_LOANS_EDIT` is intended to imply `VIEW` on the
  backend, given the frontend asymmetry in §2/§13.
- Whether the dead `toPopularLoansSavePayload`/`PopularLoansSavePayload`
  one-based-priority code path (§13) is an intentional historical artifact
  worth deleting, or evidence that a backend contract once expected
  `priority` and may still in some other integration — `NEEDS-VERIFICATION`.
- Whether the backend ever omits `pageInfo.totalElements` on the catalog or
  history endpoints, which would trigger the fallback in §13.
- Whether the unbounded `size: 99999` catalog fetch (§13) has ever caused a
  timeout or truncated response in production — `NEEDS-VERIFICATION`, not
  observable from this frontend checkout.
