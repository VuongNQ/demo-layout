# Documents and Contracts — Module Documentation

> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

Reconciled 2026-11-05 against revision `8562c125` (branch `portal-cham-vay`,
descended from `improve/vuongnq`) via four parallel read-only
`codebase-analyzer` passes, one per child:
`src/modules/products/parameter/group-document-list/` (8 files),
`document-list/` (9), `document-set/` (9), `contract-termplate/` (14) — 40
files total (`find` per child, matching the sum in
`docs/reports/2026-11-04/products-docs-reconciliation.md` proposed-order item
#8). This replaces the prior non-template-shaped version of this document
wholesale; it keeps the same four-submodule pairing (not split, per task
scope).

Two findings from `docs/reports/2026-11-04/products-docs-reconciliation.md`
are resolved by this pass:

- **Row 4 (duplicate route) — RESOLVED, not an open risk.** The prior
  document's claim that `src/routes/index.tsx` declares the
  `group-document-list` list path twice no longer applies. `src/routes/index.tsx`
  is now a 34-line assembly shell with no `group-document-list` string at
  all; exactly one list route exists, at `src/routes/main.routes.tsx:245-247`,
  and exactly one create/edit/view set exists in `src/routes/form.routes.tsx:702-718`.
  See §2.
- **Row 14 (unverified `contract-termplate` spelling and `returnStatusForm`
  cross-domain export) — CONFIRMED, both parts true.** The folder is spelled
  `contract-termplate` (not "template"); the Redux slice file itself is
  correctly spelled `contract-template.slice.ts`. `returnStatusForm` is
  exported from `contract-termplate/utils.tsx:37` and is imported by
  `src/modules/notifications/configuration/list-notification/utils.ts:22` and
  `.../view/settings/general-info.tsx:20`, in addition to a same-submodule
  consumer in `edit/edit-contract-template.tsx:33`. See §8, §10.

Top five verification gaps, ordered by consequence (remaining gaps are in
§15):

1. Whether `ApiFetcher` trims or rejects the trailing space in the literal
   endpoint `'api/admin/portal/v1/document-group '`
   (`product-document-group.slice.ts:82`) — **NEEDS-VERIFICATION**, backend
   behavior, not fixable by inspection alone. See §6, §13.
2. Whether the batch-status request shape used by both `document-set`
   (`PUT document-set/${status}/batch`, id array in body) and
   `contract-termplate` (`PUT contracts/${status}/batch`) matches the actual
   backend contract — **NEEDS-VERIFICATION**. See §6.
3. Whether `request-application/{id}/audit` (used for `group-document-list`,
   `document-list`, and shared with many other modules' history tabs) is the
   backend's intended endpoint for a document/document-group entity id, given
   the path's name suggests a different owning resource —
   **NEEDS-VERIFICATION**. See §6, §10.
4. Whether `attachmentUrlExpiresAt` on an uploaded contract file is ever
   compared against current time before `contracts/preview`/`more-info` calls
   use it — no expiry check was found in `contract-termplate/components/upload-contract.tsx`
   or `create/create-contract-detail.tsx` — **NEEDS-VERIFICATION** against
   backend enforcement. See §13.
5. Whether `updateStatusProductDocumentGroup`, `updateStatusProductDocument`,
   `updateContractTemplateSummary`, `updateContractTemplateMoreInfo`,
   `getContractTemplatePreviewTable`, and `getContractTemplatePreview` — six
   thunks confirmed to have zero callers in `src/` — are intentionally dead,
   partially wired, or pending a consumer — **NEEDS-TEAM-DECISION** on
   removal; not performed here. See §6, §13.

## 1. Responsibility

Four sibling features under `src/modules/products/parameter/`, documented
together because they form one reference-data cluster consumed by product
configuration:

- **`group-document-list/`** (CONFIRMED): CRUD for "document groups" —
  named bundles of individual documents (`ProductDocumentGroupType`: `code`,
  `name`, `description`, `documents[]`). List, create, edit, view, and a
  view-tab audit history. No status/delete UI is exposed.
- **`document-list/`** (CONFIRMED): CRUD for individual documents (`giấy tờ`)
  — `code`, `name`, `type` (`SYSTEM`|`CUSTOM`), `description`, `iconUrl`,
  image-upload bounds, `inputTypes`, OCR flags, and a many-to-many
  `documentGroups` selection. List, create, edit, view, history.
- **`document-set/`** (CONFIRMED): CRUD for document sets scoped to product
  lines (`productLines: number[]`), each built from a `rootCondition` tree
  (AND/OR operator over `conditions[]`, each holding ordered `DOCUMENT`
  operands). Supports single and batch activate/deactivate. List, create,
  edit, view, history.
- **`contract-termplate/`** (CONFIRMED, folder name as-is — see §0): contract
  templates with draft/final create, draft-save or publish on edit, view
  (summary + more-info + history), single and batch status toggle, draft
  delete, file upload with merge-field extraction, and merge-field preview.
  Application types are `CD`/`CL`/`ADDON`.

The routed `condition-list` and `input-form-list` pages referenced by the
`OVERVIEW.md` risk table are **not** part of this cluster — they live
elsewhere under `parameter/` and are unrelated placeholders, confirmed absent
from all four directories above.

## 2. Entry points and routes

All four submodules declare their list route in `src/routes/main.routes.tsx`
(`MainLayout`) and their create/edit/view routes in `src/routes/form.routes.tsx`
(`BasicLayout`); none has any entry in `src/routes/index.tsx`, which is now
only a 34-line shell (CONFIRMED, zero matches for any of the four path
segments). Lazy page exports for all twelve + four history-bearing view pages
live in `src/routes/pages.tsx`.

| Submodule | Path | File:line | Permission(s) |
| --- | --- | --- | --- |
| group-document-list | `product/parameter/group-document-list` | `main.routes.tsx:245-247` | `DOCUMENT_GROUP_VIEW` |
| group-document-list | `.../group-document-list/create` | `form.routes.tsx:702-706` | `DOCUMENT_GROUP_CREATE` |
| group-document-list | `.../group-document-list/edit/:id` | `form.routes.tsx:708-712` | `DOCUMENT_GROUP_EDIT` |
| group-document-list | `.../group-document-list/view/:id` | `form.routes.tsx:714-718` | `DOCUMENT_GROUP_VIEW` |
| document-list | `product/parameter/document-list` | `main.routes.tsx:249` | `DOCUMENT_VIEW` |
| document-list | `.../document-list/create` | `form.routes.tsx:720` | `DOCUMENT_CREATE` |
| document-list | `.../document-list/edit/:id` | `form.routes.tsx:724` | `DOCUMENT_EDIT` |
| document-list | `.../document-list/view/:id` | `form.routes.tsx:728` | `DOCUMENT_VIEW` |
| document-set | `product/parameter/document-set` | `main.routes.tsx:235-243` | `DOCUMENT_SET_VIEW_{CREDIT_CARD,CASH_LOAN}` (OR) |
| document-set | `.../document-set/create` | `form.routes.tsx:671-680` | `DOCUMENT_SET_CREATE_{CREDIT_CARD,CASH_LOAN}` (OR) |
| document-set | `.../document-set/view/:id` | `form.routes.tsx:681-690` | `DOCUMENT_SET_VIEW_{CREDIT_CARD,CASH_LOAN}` (OR) |
| document-set | `.../document-set/edit/:id` | `form.routes.tsx:691-700` | `DOCUMENT_SET_EDIT_{CREDIT_CARD,CASH_LOAN}` (OR) |
| contract-termplate | `product/parameter/contract-template-list` | `main.routes.tsx:256-262` | `CONTRACT_TEMPLATE_VIEW_{CREDIT_CARD,CASH_LOAN}` (OR) |
| contract-termplate | `.../contract-template-list/create` | `form.routes.tsx:596-606` | `CONTRACT_TEMPLATE_CREATE_{CREDIT_CARD,CASH_LOAN}` (OR) |
| contract-termplate | `.../contract-template-list/edit/:id` | `form.routes.tsx:609-617` | `CONTRACT_TEMPLATE_EDIT_{CREDIT_CARD,CASH_LOAN}` (OR) |
| contract-termplate | `.../contract-template-list/view/:id` | `form.routes.tsx:619-627` | `CONTRACT_TEMPLATE_VIEW_{CREDIT_CARD,CASH_LOAN}` (OR) |

**Duplicate-route finding is resolved (CONFIRMED, see §0).** Each path above
appears exactly once across `main.routes.tsx` and `form.routes.tsx`.

Menu entries (`src/helpers/menus.helper.ts`): `group-document-list` at
`:279-283` (`DOCUMENT_GROUP_VIEW`); `document-list` at `:285-288`
(`DOCUMENT_VIEW`); `document-set` at `:296-300` (`DOCUMENT_SET_VIEW_{CC,CL}`);
`contract-termplate` at `:301-310` with `requiredPermissions` listing
`CONTRACT_TEMPLATE_VIEW_CREDIT_CARD`, `CONTRACT_TEMPLATE_VIEW_CASH_LOAN`, **and**
`CONTRACT_TEMPLATE_VIEW_ADD_ON` — the last of which **no route in this
module checks** (CONFIRMED gap; menu and route permission sets diverge for
contract templates). `PageURLs` builders: `ofGroupDocumentList()`
(`navigate.ts:172-173`), `ofDocumentList()` (`:168-169`),
`ofDocumentFormList()` (`:176-177`, document-set's list URL — the builder name
does not match the feature name), `ofContractTemplateList()` (`:182-183`,
create/edit/view paths for contracts are hardcoded strings, not built through
`PageURLs`).

## 3. Directory map

**`group-document-list/`** (8 files): `group-document-list.tsx` (list);
`create/create-group-document-list.tsx` + `create/form.tsx` (create body +
shell); `edit/edit-group-document-list.tsx` + `edit/form.tsx` (edit body +
shell); `view/view-group-document-list.tsx` + `view/form.tsx` (view body +
shell, two tabs); `view/history.tsx` (audit tab).

**`document-list/`** (9 files): `document-list.tsx` (list);
`create/create-document-list.tsx` + `create/form.tsx`;
`edit/edit-document-list.tsx` + `edit/form.tsx`;
`view/view-document-list.tsx` + `view/form.tsx` + `view/history.tsx`;
`options/documentType.ts` — static constants `documentTypeOptions`
(`SYSTEM`/`CUSTOM`) and `inputTypesOptions` (six input-type values), **not**
API-sourced (CONFIRMED).

**`document-set/`** (9 files): `document-set-list.tsx` (list, with batch
activate/deactivate); `create/create-document-set.tsx` + `create/form.tsx`;
`edit/edit-document-set.tsx` + `edit/form.tsx`;
`view/view-document-set.tsx` + `view/form.tsx` + `view/history.tsx`;
`options/operator.tsx` — the two-item `operatorOptions` constant (`AND`/`OR`),
consumed by the shared component `src/components/forms/document-set/document-list.tsx`.

**`contract-termplate/`** (14 files): `contract-template-list.tsx` (list,
with batch activate/deactivate); `utils.tsx` — `getContractMergeFields`,
`returnStatusForm`, `returnStatusUpdate` (the cross-domain exports, see §0,
§10); `create/{create-contract-template.tsx, create-contract-detail.tsx,
form.tsx}` (general-info step, content/upload step, shell);
`edit/{edit-contract-template.tsx, edit-contract-detail.tsx, form.tsx}`
(same split for edit, branching publish vs. plain update); `view/{view-contract-template.tsx,
view-contract-detail.tsx, form.tsx, history.tsx}`;
`components/{upload-contract.tsx, preview-contract-table.tsx}` (react-dropzone
+ react-pdf upload and the merge-field preview table).

## 4. Main runtime flows

**Document groups**: list dispatches `getListProductDocumentGroup` on
query-state change. Create loads the reference `documents` list
(`common.slice.getListDocuments`) and posts via `createProductDocumentGroup`.
Edit loads detail via `getProductDocumentGroupDetail` and updates via
`updateProductDocumentGroup`, mapping `documents` back to `id[]`. View loads
detail again and exposes an audit-history tab that dispatches
`getListUpdatedHistories({ entityType: 'DOCUMENT_GROUP' })` from
**`product-industry.slice.ts`** (not this feature's own slice — see §5, §10).
On update success the listener middleware navigates to the view URL via
`getViewUrl()` (`src/utils/common.ts`).

**Documents**: identical list/create/edit/view/history shape via
`product-document-list.slice.ts`'s `getListProductDocument` /
`getProductDocumentDetail` / `createProductDocument` / `updateProductDocument`.
History again reads/dispatches through `product-industry.slice.ts`
(`entityType: 'DOCUMENT'`). Create forces `type: 'CUSTOM'`; the `SYSTEM` type
option is disabled client-side. `inputTypes` options are filtered by the
selected `type`; `imageUploadMin/Max` and OCR switches are conditionally shown
based on `availableInputTypes`.

**Document sets**: list dispatches `getProductDocumentSet`, with default
sort `updatedDate,desc`. Create maps a `rootCondition` tree (root operator
applied to `conditions[0]`, each operand mapped to `{type:'DOCUMENT',
documentId}`) and posts via `createProductDocumentSet`. **Confirmed
behavior**: switching the root operator to `OR` discards every condition
after the first (`create-document-set.tsx:142-179`, mirrored in edit) — a
silent-truncation risk, not a bug introduced by this document. Edit loads
detail via `getProductDocumentSetDetail` and updates via
`updateProductDocumentSet`. View exposes a status toggle
(`updateStatusDocumentSet`, `PUT document-set/{id}/status` with a reason) and
the list supports batch activate/deactivate
(`updateMultiStatusDocumentSet`, `PUT document-set/{status}/batch`, id array
body).

**Contract templates**: list calls `GET contracts/search`. Create branches on
draft vs. final: draft posts `contracts/draft` (`isDraft: true`, `status:
'DRAFT'`); final posts `contracts` with `status` derived from a boolean
toggle. Edit branches on the loaded detail's status: when `status ===
'DRAFT'`, submit calls `POST contracts/draft/{id}/publish`; otherwise `PUT
contracts/{id}`. A separate draft-save action calls `PUT
contracts/{id}/draft`. View composes `GET contracts/{id}/summary` and `GET
contracts/{id}/more-info` into one display. Status toggle is `PUT
contracts/{id}/status`; batch status is `PUT contracts/{status}/batch`.
Delete-draft is `DELETE contracts/{id}`. Upload posts to `POST
api/admin/file?category=CONTRACT_DOCUMENT` (no `portal/v1` prefix — a
confirmed divergence from every other endpoint in this cluster), then fetches
merge fields via `GET contracts/merge-fields?url=...` and posts a preview via
`POST contracts/preview`. Application-type selection
(`create-contract-template.tsx:74-152`, mirrored in edit) diffs the selected
product/add-on IDs against the previous selection and dispatches
`common.slice` `getListProducts`/`getListAddOns`/`updateListProducts`
accordingly, tagged with `EContext.CONTRACT_TEMPLATE`.

## 5. State ownership

| Submodule | Owning slice | Middleware |
| --- | --- | --- |
| group-document-list | `src/redux/slices/product-document-group.slice.ts` (`product-document-group`) | `product-document-group.middleware.ts` |
| document-list | `src/redux/slices/product-document-list.slice.ts` (`product-document-list`) | `product-document-list.middleware.ts` |
| document-set | `src/redux/slices/product-document-set.slice.ts` (`product-document-set`) | `product-document-set.middleware.ts` |
| contract-termplate | `src/redux/slices/contract-template.slice.ts` (`contract-template` — correctly spelled despite the misspelled folder) | `contract-template.middleware.ts` |

All four are registered in `src/redux/slices.ts` and `src/redux/store.ts`.
**No TanStack Query usage exists in any of the four directories** (CONFIRMED,
`@tanstack/react-query` grep returns zero matches in each). Each slice keeps
one shared `loading` flag covering list/detail/mutation requests concurrently
— no per-request state, request IDs, or cancellation in any of the four
(CONFIRMED).

Cross-cutting state ownership facts, confirmed across all four analyses:

- Audit-history tabs in `group-document-list` and `document-list` do **not**
  use their own slice; they read/dispatch `getListUpdatedHistories` and its
  `pagination` from **`src/redux/slices/product-industry.slice.ts`**, shared
  with the industry-product module and many other history tabs across the
  repository. A concurrently open history view elsewhere can leak stale rows
  or pagination state into these tabs (LIKELY, not runtime-verified).
- `edit/form.tsx` in both `document-list` and `document-set` sources its
  `FormLayout` loading flag from **`src/redux/slices/fee-definition.slice.ts`**
  (`watchFeeDefinitionLoading`) instead of its own slice's loading state
  (CONFIRMED in both). The edit page's spinner therefore does not reflect its
  own in-flight request.
- Reference data for all four is centralized: `documentGroups` and
  `documents` options come from `common.slice.ts` (`getListDocumentGroups`,
  `getListDocuments`); `productLines` options also come from `common.slice.ts`.

## 6. API boundaries

All endpoint strings are inline in each slice; none of the four has a
`src/services/products/` file (LEGACY-COMPATIBILITY per
`.claude/rules/03-api-service.md` `## Service location`).

| Submodule | Operation | Method | Path |
| --- | --- | --- | --- |
| group-document-list | list | GET | `api/admin/portal/v1/document-group` |
| group-document-list | detail | GET | `api/admin/portal/v1/document-group/{id}` |
| group-document-list | create | POST | `'api/admin/portal/v1/document-group '` — **literal trailing space in source**, `product-document-group.slice.ts:82` (CONFIRMED; see §0, §13) |
| group-document-list | update | PUT | `api/admin/portal/v1/document-group/{id}` |
| group-document-list | status (dead, no caller) | PUT | `api/admin/portal/v1/document-group/{id}/{status}` |
| document-list | list | GET | `api/admin/portal/v1/document` |
| document-list | detail | GET | `api/admin/portal/v1/document/{id}` |
| document-list | create | POST | `api/admin/portal/v1/document` |
| document-list | update | PUT | `api/admin/portal/v1/document/{id}` |
| document-list | status (dead, no caller) | PUT | `api/admin/portal/v1/document/{id}/{status}` |
| document-set | list | GET | `api/admin/portal/v1/document-set` |
| document-set | detail | GET | `api/admin/portal/v1/document-set/{id}` |
| document-set | create | POST | `api/admin/portal/v1/document-set` |
| document-set | update | PUT | `api/admin/portal/v1/document-set/{id}` |
| document-set | status | PUT | `api/admin/portal/v1/document-set/{id}/status` (body `{status, reason}`) |
| document-set | batch status | PUT | `api/admin/portal/v1/document-set/{status}/batch` (body: id array) |
| document-set | assignable (reference, in `common.slice.ts`) | GET | `api/admin/portal/v1/document-set/assignable` |
| contract-termplate | list | GET | `contracts/search` |
| contract-termplate | application types | GET | `contracts/application-types` |
| contract-termplate | create draft | POST | `contracts/draft` |
| contract-termplate | create final | POST | `contracts` |
| contract-termplate | edit draft-save | PUT | `contracts/{id}/draft` |
| contract-termplate | edit publish | POST | `contracts/draft/{id}/publish` |
| contract-termplate | edit update | PUT | `contracts/{id}` |
| contract-termplate | view summary | GET | `contracts/{id}/summary` |
| contract-termplate | view more-info | GET | `contracts/{id}/more-info` |
| contract-termplate | status | PUT | `contracts/{id}/status` (body `{status, reason}`) |
| contract-termplate | batch status | PUT | `contracts/{status}/batch` (body: id array) |
| contract-termplate | delete draft | DELETE | `contracts/{id}` |
| contract-termplate | upload | POST | `api/admin/file?category=CONTRACT_DOCUMENT` — **no `portal/v1` prefix**, confirmed divergence from every other endpoint above |
| contract-termplate | merge fields | GET | `contracts/merge-fields?url={encoded}` |
| contract-termplate | preview | POST | `contracts/preview` |

**Confirmed dead thunks with zero callers in `src/`**: `updateStatusProductDocumentGroup`,
`updateStatusProductDocument`, `updateContractTemplateSummary`,
`updateContractTemplateMoreInfo`, `getContractTemplatePreviewTable`,
`getContractTemplatePreview`. See §0 item 5 — removal is
`NEEDS-TEAM-DECISION`, not performed here.

Per `.claude/rules/03-api-service.md` `## Contracts and errors`, typed DTOs
without Zod runtime parsing are the expected default for this kind of stable
CRUD traffic; their absence is not itself flagged as a gap.

## 7. Forms and validation

All twelve create/edit/view forms across the cluster use AntD
`Form.useForm`, wrapped in `FormLayout` with `forwardRef<FormRef>` +
`useFormImperativeHandle` (`src/hooks/form.hook.ts`) — the adopted
`FormLayout`/`FormRef` contract. **No Zod and no RHF exist anywhere in this
cluster** (CONFIRMED by grep in all four directories); validation is AntD
`rules` with `VALIDATION_MESSAGE.REQUIRED` plus feature-specific custom
validators (document-list: `imageUploadMin <= imageUploadMax`,
`ocrImageMatchingRate <= 100`; document-set: product-line- and
condition-shape-driven field visibility; contract-termplate: draft-vs-final
submit gating via `disableDraftSave`/`disableSave`).

Document-set composes its ordered document selection and AND/OR tree through
the shared component `src/components/forms/document-set/document-list.tsx`,
which imports `FormValues` and `operatorOptions` directly from
`document-set/create/create-document-set.tsx` and `document-set/options/operator.tsx`
— a shared-component-into-module-internals dependency (see §10, §13).
Contract-termplate's application-type filtering (§4) is the most complex
form-to-reference-data coupling in the cluster.

Per the rule's existing-code allowance, none of this is flagged as a gap on
its own: existing AntD `rules`/custom validators remain valid for untouched
legacy forms.

## 8. Types and DTO organization

Each submodule has its own ambient `.d.ts` file with no explicit `export`
keyword, relying on TypeScript's implicit declaration-file export behavior
(NEEDS-VERIFICATION under `npm run typecheck`, not run in this pass):
`src/types/product-document-group.d.ts`, `src/types/product-document-list.d.ts`,
`src/types/product-document-set.d.ts`, `src/types/contract-template.d.ts`.
Several confirmed field-name mismatches between these ambient types and what
the UI actually reads exist independently in `group-document-list`
(`updatedDate` column vs. `updateDate` field) and `document-list` (same
pattern) — both CONFIRMED in source, backend field name NEEDS-VERIFICATION.

**`returnStatusForm` / `returnStatusUpdate` — the confirmed cross-domain
export (§0 row 14).** Both are defined in `contract-termplate/utils.tsx`
(`returnStatusForm` at line 37, `returnStatusUpdate` at line 55) and typed
with `status: any`. Consumers:

- `returnStatusForm`: `src/modules/notifications/configuration/list-notification/utils.ts:22`
  (used at lines 825 and 1170) and
  `src/modules/notifications/configuration/list-notification/view/settings/general-info.tsx:20`
  (used at line 89) — both in `notifications/`, a different top-level
  domain. Also used inside the same submodule,
  `contract-termplate/edit/edit-contract-template.tsx:256`.
- `returnStatusUpdate`: `src/modules/products/configuration/cash-loan/edit/index.tsx:43`,
  `.../credit-card/edit/index.tsx:40`, `.../group-list-product/edit/form.tsx:34`,
  plus `contract-termplate/edit/form.tsx:31`.

This is a real, proven cross-domain dependency: a `products/parameter/`
feature's own `utils.tsx` is a de facto shared contract for `notifications/`
and three other `products/configuration/` features. See §10 and §14 — do not
move or change its signature without auditing every listed consumer.

Also note: `ContractTemplatePreviewTable` and `ContractTemplateType` are
imported type-only by files outside this submodule (`src/components/forms/import/upload-file.tsx`,
`src/modules/users/operator/user-operator-list/components/upload-user-operator.tsx`,
`src/components/product-configuration/utils.tsx`); `ProductLinesDetailType`
(from `product-document-set.d.ts`) is imported by
`src/modules/users/customer/segmentation/segmentation.customer.tsx` and
`configuration/required-information-set/list-information-set.tsx`.

## 9. Permissions

24 permission constants are referenced across this cluster (above the
10-constant table threshold in `docs/modules/TEMPLATE.md` rule 9), so they are
tabulated once here rather than re-transcribed per call site.

| Permission | Route | Menu | Component |
| --- | --- | --- | --- |
| `DOCUMENT_GROUP_VIEW` | list, view | yes | edit-button gate (view page) |
| `DOCUMENT_GROUP_CREATE` | create | — | create buttons (list page) |
| `DOCUMENT_GROUP_EDIT` | edit | — | edit-button gate (view page) |
| `DOCUMENT_VIEW` | list, view | yes | — |
| `DOCUMENT_CREATE` | create | — | create buttons (list page) |
| `DOCUMENT_EDIT` | edit | — | edit-button gate (view page) |
| `DOCUMENT_SET_VIEW_CREDIT_CARD` / `DOCUMENT_SET_VIEW_CASH_LOAN` (OR pair, "DocSet CC/CL") | list, view | yes (pair) | list/search view gating; `canView` redirect in view/edit |
| `DOCUMENT_SET_CREATE_CREDIT_CARD` / `DOCUMENT_SET_CREATE_CASH_LOAN` (OR pair) | create | — | industry-option disabling in create form; list create button |
| `DOCUMENT_SET_EDIT_CREDIT_CARD` / `DOCUMENT_SET_EDIT_CASH_LOAN` (OR pair) | edit | — | industry-option disabling in edit form; `canEdit` gate in view/edit; list edit button |
| `CONTRACT_TEMPLATE_VIEW_CREDIT_CARD` / `CONTRACT_TEMPLATE_VIEW_CASH_LOAN` (OR pair, "ContractTpl CC/CL") | list, view | yes (pair) | multi-permission `every` check for CD+CL+ADDON templates (view page) |
| `CONTRACT_TEMPLATE_CREATE_CREDIT_CARD` / `CONTRACT_TEMPLATE_CREATE_CASH_LOAN` (OR pair) | create | — | list create button |
| `CONTRACT_TEMPLATE_EDIT_CREDIT_CARD` / `CONTRACT_TEMPLATE_EDIT_CASH_LOAN` (OR pair) | edit | — | — |
| `CONTRACT_TEMPLATE_DELETE_CREDIT_CARD` / `CONTRACT_TEMPLATE_DELETE_CASH_LOAN` (OR pair) | — | — | delete-draft button (view page) |
| `CONTRACT_TEMPLATE_VIEW_ADD_ON` / `CONTRACT_TEMPLATE_CREATE_ADD_ON` / `CONTRACT_TEMPLATE_EDIT_ADD_ON` / `CONTRACT_TEMPLATE_DELETE_ADD_ON` | **none** — confirmed absent from every contract-termplate route guard | `VIEW_ADD_ON` listed in the menu entry's `requiredPermissions` | ADD_ON checks appear in list, create, edit, and view components |

**Confirmed gap**: the menu entry for contract templates requires
`CONTRACT_TEMPLATE_VIEW_ADD_ON` in addition to the CC/CL pair, but no route in
`main.routes.tsx`/`form.routes.tsx` checks it — menu visibility and route
reachability diverge for the ADD_ON application type. See §13.

All "OR pair" permission checks were confirmed as OR arrays passed to
`WithGuard`/`hasPermission`, except `view/form.tsx` in `document-set`, which
explicitly passes `'every'` for one combined CD+CL+ADDON check — confirmed a
different kind of check from its neighbors, not inferred from a structurally
similar one, per `docs/modules/TEMPLATE.md` rule 14.

## 10. Shared and cross-domain dependencies

**Within the cluster:**

- `document-set/` imports `inputTypesOptions` (a constant, not a Redux/Query
  dependency) from `document-list/options/documentType.ts` in its create,
  edit, and view forms. Document-set does **not** otherwise consume
  `document-list`'s slice, service, or components. Its ordered document
  selection instead goes through the shared component
  `src/components/forms/document-set/document-list.tsx`, which reads
  `common.slice.ts`'s `documents`/`getListDocuments` — the same reference data
  `document-list` itself uses, but via the common slice, not via
  `document-list`'s own slice.
- All four link to each other's view pages by hardcoded path strings in
  places (e.g., `document-set` links to `/product/parameter/document-list/view/:id`),
  not through `PageURLs` builders.

**Products/group configuration consuming this cluster as reference data
(the proposed-order item #8 claim — CONFIRMED):**

- `src/modules/products/configuration/cash-loan/create/index.tsx` and
  `.../credit-card/create/index.tsx` import `getProductDocumentSet` /
  `watchProductDocumentSet` directly from **this submodule's own**
  `product-document-set.slice.ts` (not the common slice) — so a configuration
  create page shares live state with the document-set list page.
- `cash-loan`/`credit-card` catalogs and selectors (`CashLoanSearcher.tsx`,
  `CashLoanCatalogModal/index.tsx`, `cash-loan/view/other-info.tsx`) instead
  use `getListDocumentSets`/`watchDocumentSets` from **`common.slice.ts`** — a
  second, independent cache of the same backend resource.
- `card-gift-offer/rule-form.tsx` bypasses both slices with a direct
  `apiFetcher.get('api/admin/portal/v1/document-set', ...)` call.
- `cash-loan/create/index.tsx` and `credit-card/create/index.tsx` similarly
  import `getListContractTemplate`/`watchListContractTemplate` from
  **`contract-template.slice.ts`** directly; `cash-loan/edit/index.tsx` and
  `credit-card/edit/index.tsx` import `returnStatusUpdate` (§8).

**Cross-domain exports leaving this cluster:**

- `returnStatusForm`/`returnStatusUpdate` — see §8 (the confirmed row-14
  finding).
- `group-document-list/view/history.tsx` and `document-list/view/history.tsx`
  both import `convertFieldActionType` from
  `src/modules/products/configuration/industry-product/ultis.tsx` — a
  cross-module helper also consumed by `contents/`, `notifications/`, and
  other `users`/`system` history screens (not re-traced exhaustively here;
  see `docs/modules/products/OVERVIEW.md` "External consumers of
  product-owned internals").

**Reverse dependency (shared component depends on module internals,
CONFIRMED):** `src/components/forms/document-set/document-list.tsx` imports
`FormValues` from `document-set/create/create-document-set.tsx` and
`operatorOptions` from `document-set/options/operator.tsx`. This is a shared
component reaching into one feature's local types/constants — flagged as a
pattern risk in §13, not something this pass changes.

**Searcher components reaching into module internals:** `src/components/forms/search/document-list-searcher.form.tsx`
imports `documentTypeOptions` from `document-list/options/documentType.ts`
and calls the document list endpoint directly, bypassing the slice.

## 11. Consumers

- Routing/menu/i18n layers consume all four as described in §2.
- `group-document-list`'s slice, types, and components have no consumers
  outside routing and the shared `group-document-list-searcher.form.tsx`
  (CONFIRMED by grep).
- `document-list`'s `options/documentType.ts` is consumed by `document-set`
  (`inputTypesOptions`) and by the shared `document-list-searcher.form.tsx`
  (`documentTypeOptions`); its slice has no consumer outside this submodule.
- `document-set`'s slice (`watchProductDocumentSet`/`getProductDocumentSet`)
  is consumed by `cash-loan`/`credit-card` create pages (§10); its ambient
  type `ProductLinesDetailType` is consumed by users/segmentation and
  required-information-set (§8).
- `contract-termplate`'s slice is consumed by `cash-loan`/`credit-card`
  create/edit pages and `contract-template-searcher.form.tsx`; its
  `utils.tsx` exports are consumed by `notifications/` and three
  `products/configuration/*/edit` pages (§8, §10); its ambient types are
  consumed type-only by two files outside `products/` (§8).

## 12. Pattern classification

- Redux `createAppSlice` + `asyncThunk`, with endpoint strings inline in the
  slice rather than a `src/services/products/` file, owning each of the four
  server resources: **LEGACY-COMPATIBILITY** per `.claude/rules/04-state-management.md`
  `## Server state ownership (adopted 2026-11-04)`. Not a defect; not a
  candidate to copy for a new resource, which would use TanStack Query.
- Listener middleware owning workflow notifications/navigation for all four:
  **LEGACY-COMPATIBILITY**, matches the adopted Redux-workflow pattern.
  pattern.
- AntD `Form.useForm` + `FormLayout`/`FormRef` via `useFormImperativeHandle`
  in all twelve forms: **target-compatible**, the adopted sole form-state
  owner.
  owner.
- AntD `rules`-only validation, no Zod, across the whole cluster:
  **target-compatible** for untouched legacy forms per
  `.claude/rules/05-form.md`; a substantially rewritten validation path would
  be expected to introduce feature-owned Zod, not add it opportunistically
  here.
- Ambient `.d.ts` DTOs with no explicit `export`: **LEGACY-COMPATIBILITY**.
- Emotion `css`-prop styling throughout (no `.module.scss` in any of the
  four): **LEGACY-COMPATIBILITY** per `.claude/rules/10-styling.md`; not a
  defect for normal maintenance.
- Route-level lazy loading for every page in the cluster, under `WithGuard`/
  `AuthGuard`: **target-compatible**.
- Shared component (`document-list.tsx` under `components/forms/document-set/`)
  importing one feature's local types/constants: **uncertain** — a reverse
  dependency that predates the Ant-Design-first reuse guidance; not
  recommended as a pattern to copy, not scoped for correction here.

## 13. Technical risks

Ordered by decreasing consequence; items already resolved are not listed
here (see §0).

- **Malformed endpoint string.** `product-document-group.slice.ts:82` POSTs
  to the literal string `'api/admin/portal/v1/document-group '` with a
  trailing space. CONFIRMED in source; runtime effect is
  NEEDS-VERIFICATION. Do not silently "correct" it without backend/runtime
  evidence (preserved from the prior document's finding).
- **ADD_ON permission menu/route mismatch.** The contract-termplate menu
  entry requires `CONTRACT_TEMPLATE_VIEW_ADD_ON`; no route guard in this
  module checks it, so a user with only the ADD_ON permission and neither
  CC/CL permission sees the menu entry but cannot reach the route. CONFIRMED.
- **Dual/triple independent caches of the same backend resource.**
  `document-set` and `contract-template` server data is read through at
  least two Redux slices each (the feature's own slice and `common.slice.ts`),
  plus a direct `apiFetcher` call in `card-gift-offer/rule-form.tsx` for
  document sets. CONFIRMED; no single authoritative owner for cross-module
  reads of these two resources.
- **Shared, non-isolated audit-history state.** `group-document-list` and
  `document-list` history tabs both dispatch through
  `product-industry.slice.ts`'s shared `listUpdatedHistories`/`pagination`,
  which is also used by the industry-product module and other
  history-bearing screens cluster-wide. LIKELY stale-row/pagination leakage
  across concurrently used history tabs; not runtime-verified.
- **Wrong loading-state source on edit.** `document-list/edit/form.tsx` and
  `document-set/edit/form.tsx` both source their `FormLayout` loading flag
  from `fee-definition.slice.ts`'s `watchFeeDefinitionLoading` instead of
  their own slice. CONFIRMED in both; the edit spinner does not reflect the
  actual in-flight request.
- **Upload file URL expiry not checked client-side.** `contract-termplate`'s
  upload flow stores `attachmentUrlExpiresAt` but only checks it for
  truthiness, never against current time, before using the URL in
  `contracts/preview`/`more-info` calls. CONFIRMED absent; backend-side
  enforcement is NEEDS-VERIFICATION.
- **Silent root-operator truncation.** In `document-set` create/edit,
  switching the condition tree's root operator to `OR` discards every
  condition after the first with no user-facing warning. CONFIRMED in
  source.
- **Reverse shared-component dependency.** `src/components/forms/document-set/document-list.tsx`
  imports `FormValues`/`operatorOptions` from `document-set`'s own
  `create/`/`options/` files. CONFIRMED; a shared component should not depend
  on one feature's internals.
- **Endpoint-prefix divergence.** Contract upload posts to
  `api/admin/file?category=CONTRACT_DOCUMENT`, omitting the `api/admin/portal/v1/`
  prefix every other endpoint in this cluster uses. CONFIRMED; likely
  intentional (a different backend route), but undocumented as such.
- **Six dead thunks with zero callers.** See §0 item 5 and §6. CONFIRMED by
  grep across `src/`; removal is `NEEDS-TEAM-DECISION`, not performed.
- **Field-name mismatches between ambient types and rendered columns.**
  `updatedDate` (column) vs. `updateDate` (declared field) in both
  `group-document-list` and `document-list`. CONFIRMED in source; backend
  field name NEEDS-VERIFICATION.
- **One shared `loading` flag per slice.** All four slices use a single
  `loading` boolean for list/detail/mutation thunks; concurrent requests can
  clear each other's flag. CONFIRMED structurally in all four; consistent
  with the cluster-wide legacy pattern, not a new finding to fix
  opportunistically.
- **Hardcoded Vietnamese UI string outside `t()`.** `contract-termplate/components/upload-contract.tsx`'s
  upload-failure message is a literal Vietnamese string, not routed through
  i18n. CONFIRMED; a fix would need both lang files updated per
  `.claude/rules/11-i18n.md`, not performed here.

## 14. Areas to avoid touching

- All four slices' endpoint strings and the middleware listener behavior
  built on them (`product-document-group.slice.ts`,
  `product-document-list.slice.ts`, `product-document-set.slice.ts`,
  `contract-template.slice.ts`, and their four middleware files) — each
  carries live create/update/status contracts, and `document-set`/
  `contract-template`'s slices are also read directly by
  `products/configuration/cash-loan` and `credit-card` create/edit pages
  (§10).
- `contract-termplate/utils.tsx` — `returnStatusForm` and `returnStatusUpdate`
  are consumed by `notifications/` and three `products/configuration/*/edit`
  pages; changing their signature or behavior requires auditing all six
  confirmed call sites in §8.
- `document-list/options/documentType.ts` — consumed by `document-set`
  (`inputTypesOptions`) and the shared `document-list-searcher.form.tsx`
  (`documentTypeOptions`).
- `src/components/forms/document-set/document-list.tsx` — shared across all
  three `document-set` form bodies and reaches into their internals; a
  signature change there requires updating `create-document-set.tsx` and
  `options/operator.tsx` together.
- `src/redux/slices/product-industry.slice.ts`'s history thunks and
  `src/modules/products/configuration/industry-product/ultis.tsx`'s
  `convertFieldActionType` — both shared far beyond this cluster.
- `src/redux/slices/common.slice.ts`'s `getListDocuments`,
  `getListDocumentGroups`, `getListDocumentSets`, `getListProductLines`,
  `getListProducts`, `getListAddOns` — all are cross-module reference data.
- `src/redux/slices/fee-definition.slice.ts`'s `watchFeeDefinitionLoading` —
  despite being the wrong source for two of this cluster's edit pages (§13),
  changing it affects the fee-definition module too; fix it at the
  consuming call sites, not at its source.
- Route, menu, and permission declarations for all four submodules
  (`main.routes.tsx`, `form.routes.tsx`, `pages.tsx`, `menus.helper.ts`,
  `permission.constant.ts`) — routing/permission changes are HIGH-RISK per
  `.claude/ARCHITECTURE.md` §13.
- Ambient type files `product-document-group.d.ts`, `product-document-list.d.ts`,
  `product-document-set.d.ts`, `contract-template.d.ts` — several are
  consumed outside this cluster (§8, §11).

## 15. Open questions

Beyond the top five in §0:

- Backend contract for both batch-status endpoints
  (`document-set/{status}/batch`, `contracts/{status}/batch}`): status in the
  path, id array in the body — confirm this matches what the backend expects.
- Whether `src/types/product-document-group.d.ts`,
  `product-document-list.d.ts`, `product-document-set.d.ts`, and
  `contract-template.d.ts` typecheck correctly given none has an explicit
  `export` keyword (`npm run typecheck` was not run in this pass).
- Whether `imageUploadMin`/`Max`, `ocrImageMatchingRate` (≤100), and the
  `MANUAL_INPUT_BHXH`-driven field-hiding logic in `document-list` match
  approved BA rules — client-only validation, backend rule set not visible.
- Whether `ocrImageMatchingRate` is intentionally omitted from the
  `document-list` create form (present only in edit/view).
- Whether the shared `documentSets`/`listContractTemplate` Redux state being
  written by both the reference-data list pages and the
  `cash-loan`/`credit-card` configuration create pages (§10) is a deliberate
  reuse or an accidental coupling — not resolved by this pass.
- Whether `DocmentGroupKeyValue` (common slice shape: `{value, id}`) and
  `DocumentGroupType` (document-list ambient shape: `{id, code, name}`) are
  both genuinely needed, or one should have replaced the other.
- Whether `request-application/{id}/audit` (used for both
  `group-document-list` and `document-list` history, entityType
  `DOCUMENT_GROUP`/`DOCUMENT`) is the backend's intended endpoint name for
  these entities, given the path implies a different owning resource.
- Whether `SafeHTML` (used to render the document-set list's rich-text
  description) sanitizes its input — not inspected in this pass.
- Runtime behavior for every flow above (direct link, refresh, unauthorized
  access, create/edit success and failure toasts, upload/preview edge cases)
  was not tested; this document is static source analysis only.
