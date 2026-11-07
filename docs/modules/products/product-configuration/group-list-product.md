# Group List Product — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

New document; `src/modules/products/configuration/group-list-product/` (22
files) previously had only passing mentions inside `../product-configuration.md`
(as `group-list-product`, under the generic "product groups" description).
Unlike `cash-loan/`/`credit-card/` (now `cash-loan-credit-card.md`), this
folder's name and architecture were **not** touched by the `list-product/`
deletion/migration — it remains where it was, fully Redux-owned, with no
TanStack Query, Zod, or React Hook Form anywhere in the directory (confirmed by
grep). It is documented separately rather than folded into
`cash-loan-credit-card.md` because it has a different state-ownership shape
(fully Redux, no Query-read/Redux-write hybrid) and no file-to-file import ties
it to either `cash-loan/` or `credit-card/` (confirmed: neither folder imports
from this one, and this folder imports from neither).

**Verification-gap limit (top 5; remainder in §15):**

1. `updateActiveState`'s PUT path embeds the status value directly in the URL
   (`PUT product-groups/${data.status}` with the group id in the body) —
   whether this is the backend's actual contract shape is
   **NEEDS-VERIFICATION**.
2. `deleteProductGroupDraft`'s DELETE path (`product-groups/${id}/product-groups`)
   shares a suffix with the create/update PUT path
   (`product-groups/${id}/product-groups[/draft]`) — possible copy-paste;
   **NEEDS-VERIFICATION** against the backend route table.
3. Two separate thunks PUT to `.../summary` (one general update, one status-only
   `updateProductGroupStatus`) — whether the status-only PUT can race with or
   overwrite a concurrent general-summary save is **NEEDS-VERIFICATION**.
4. Whether the product-group menu entry is reachable at all:
   `src/helpers/menus.helper.ts:167`'s `Menu.productGroup` entry is commented
   out. **NEEDS-VERIFICATION** how users currently navigate to this list.
5. `ProductGroupFormValues` is declared independently in `create/form.tsx:49`
   and `edit/form.tsx:41` under the same name — whether the two shapes have
   silently diverged is **NEEDS-VERIFICATION**.

## 1. Responsibility

List (with status filter, bulk activate/deactivate), create (draft and final),
edit, view (with status toggle, draft delete, and per-section saves), and
history for product groups, at `/product/configuration/group-list/**`. A
product group aggregates products, insurances, promotions, and more-info
sections, and is a reference input consumed by `industry-product/view/form.tsx`
(see §11); it does not itself consume cash-loan/credit-card product records.

## 2. Entry points and routes

All four routes use `WithGuard` + `AuthGuard` and a `lazy()` page export; none
uses a dynamic/helper-resolved permission check.

| Action | Path | Route file:line | Permission (OR array) |
| --- | --- | --- | --- |
| List | `/product/configuration/group-list` | `main.routes.tsx:216-224` | `[PRODUCT_GROUP_VIEW_CREDIT_CARD, PRODUCT_GROUP_VIEW_CASH_LOAN]` |
| Create | `.../group-list/create` | `form.routes.tsx:498-505` | `[PRODUCT_GROUP_CREATE_CREDIT_CARD, PRODUCT_GROUP_CREATE_CASH_LOAN]` |
| View | `.../group-list/view/:id` | `form.routes.tsx:508-515` | `[PRODUCT_GROUP_VIEW_CREDIT_CARD, PRODUCT_GROUP_VIEW_CASH_LOAN]` |
| Edit | `.../group-list/edit/:id` | `form.routes.tsx:518-525` | `[PRODUCT_GROUP_EDIT_CREDIT_CARD, PRODUCT_GROUP_EDIT_CASH_LOAN]` |

Lazy exports: `src/routes/pages.tsx:15-18` (`GroupProductList`, `ViewGroupList`,
`CreateGroupList`, `EditGroupListGeneral`). `PageURLs.ofProductGroupList()`
(`src/utils/navigate.ts:101-102`) is the only builder; it is not line-specific.

**Route/page permission asymmetry (CONFIRMED, not fixed):** the create route
checks only the CREATE pair; list/view routes check only the VIEW pair. Inside
the page, `view/form.tsx` and `edit/form.tsx` re-check VIEW/EDIT **per loaded
product line** (`productLineId === 2` → credit-card permission,
`=== 1`/else → cash-loan permission — see §9), so the route-level OR array is
necessarily broader than what the page then enforces once the line is known.

**Menu:** `src/helpers/menus.helper.ts:167` — the `Menu.productGroup` entry is
commented out. **NEEDS-VERIFICATION** (§0 item 4) how the list is currently
reached in the running app; it is not necessarily unreachable (a parent menu
item may still link in), but this was not traced further.

## 3. Directory map (22 files)

| File | Responsibility |
| --- | --- |
| `constant.ts` | `ProductListTabs` (legacy TS enum — existing code, not new), fee display constants, and unused `mock*` arrays (dead, see §13) |
| `utils.tsx` | Table/response mappers: `mapProductsTableData`, `mapInsurancesTableData`, `mapFees`, `mapCollectionFees`, `normalizeUpdatedProductGroup` |
| `group-list.tsx` | List page: searcher, table, bulk status toggle |
| `create/form.tsx` | Create container (`FormLayout`, draft + final submit, reference-data loads) |
| `create/{general-info,other-info,product,promotion,rule}.tsx` | Create tab sections; each uses `useFormImperativeHandle` against the parent form, no own `Form.useForm` |
| `edit/form.tsx` | Edit container (`FormLayout`, summary load, per-section save dispatch) |
| `edit/{general-info,other-info,product,promotion,rule}.tsx` | Edit tab sections; each owns its own `Form.useForm` |
| `view/form.tsx` | View container (status toggle, draft delete, `ReasonDisable` form) |
| `view/{general-info,other-info,product,promotion,rule,history}.tsx` | Read-only tab sections; each owns its own `Form.useForm`; `history.tsx` reads `product-industry.slice` |

Count confirmed via `find src/modules/products/configuration/group-list-product -type f | wc -l` = 22, matching hand enumeration.

## 4. Main runtime flows

All server interaction is Redux `createAppSlice`/`create.asyncThunk`, through
`apiFetcher`, with `product-group.middleware.ts` owning success/error
notification and post-save navigation. No TanStack Query hook exists anywhere
in this directory.

### List and bulk status

```text
group-list.tsx:155-160 dispatch(getProductGroupList)
  -> product-group-list.slice.ts GET product-groups/search

group-list.tsx:107-110 dispatch(updateActiveState({id, status}))
  -> slice PUT product-groups/${status}  [status in the URL path, see §0 item 1]
  -> middleware: notification only (no navigation, no list refetch dispatched)
```

### Create

```text
create/form.tsx:238 dispatch(createProductGroup({isDraft:true, formData}))   [draft]
create/form.tsx:343 dispatch(createProductGroup({isDraft:false, formData}))  [final]
  -> slice POST product-groups or product-groups/draft
  -> middleware fulfilled: notify + navigate to list
create/form.tsx:119-126 cancel: setNotification, navigate to list (no reset dispatch)
```

### Edit

```text
edit/form.tsx:149 dispatch(getProductGroupSummary(id)).unwrap()
edit/{section}.tsx: per-tab PUT via updateProductGroupSummary / ...Rule / ...Product / ...Promotion / ...MoreInfo
  -> middleware fulfilled (each): notify + navigate to view
edit/form.tsx:126-127 cancel: dispatch(resetUpdatedProductGroup), then setNotification
edit/form.tsx:263 dispatch(resetProductGroupSummary)
```

### View

```text
view/form.tsx:92 dispatch(getProductGroupSummary(id))
view/form.tsx:81-82 dispatch(updateProductGroupStatus({...}))   -> PUT .../summary
  -> middleware: notify only (no navigate)
view/form.tsx:142 dispatch(deleteProductGroupDraft(id))         -> DELETE product-groups/${id}/product-groups
```

## 5. State ownership

| Concern | Owner | Evidence |
| --- | --- | --- |
| List, all CRUD, status toggle, draft delete, all section reads/writes | Redux (`productGroupListSlice`, `src/redux/slices/product-group-list.slice.ts`), sole owner | thunks cited in §4 |
| Notifications/navigation | Listener middleware (`product-group.middleware.ts`, `configureProductGroupMiddleware`, registered `src/redux/store.ts:5`) | §4 |
| Reference data (product lines, products, add-ons, fees, contract templates, product-industry) | `common.slice.ts`, `product-addon.slice.ts`, `address.slice.ts`, `product-industry.slice.ts` | §10 |
| Local draft/UI state | AntD `Form.useForm` per section (create's sections share the parent form; edit/view sections each have their own) | §7 |
| Loading | One shared `loading` flag per slice across list/detail/mutation thunks (not request-scoped) | `product-group-list.slice.ts` |

**Query-owned checklist does not apply.** This is a confirmed, fully
Redux-owned server resource with no Query shadow at all
(`grep -rn "useQuery\|TanStack\|@tanstack" src/modules/products/configuration/group-list-product`
returns nothing beyond the unrelated `useQueryState` URL-state hook at
`group-list.tsx:37,44`). Per `.claude/rules/04-state-management.md`'s adopted
2026-11-04 policy this is `LEGACY-COMPATIBILITY`, migrated opportunistically
one resource per dedicated PR — not a defect, and not something this
reconciliation pass changes.

## 6. API boundaries

All via `apiFetcher`, defined in `product-group-list.slice.ts`:

| Operation | Method/endpoint | Thunk |
| --- | --- | --- |
| List | `GET product-groups/search` | `getProductGroupList` |
| Create (final/draft) | `POST product-groups` / `POST product-groups/draft` | `createProductGroup` |
| Summary read | `GET product-groups/:id/summary` | `getProductGroupSummary` |
| Customer-segment read | `GET product-groups/:id/customer-segment` | (section thunk) |
| Products/insurances read | `GET product-groups/:id/products-insurances` | (section thunk) |
| Promotions read | `GET product-groups/:id/promotions` | (section thunk) |
| More-info read | `GET product-groups/:id/more-info` | (section thunk) |
| Summary update | `PUT product-groups/:id/summary` | `updateProductGroupSummary` |
| Status-only update | `PUT product-groups/:id/summary` (same path, different thunk) | `updateProductGroupStatus` |
| Customer-segment update | `PUT product-groups/:id/customer-segment` | `updateProductGroupRule`(-adjacent) |
| Products/insurances update | `PUT product-groups/:id/products-insurances` | `updateProductGroupProduct` |
| Promotions update | `PUT product-groups/:id/promotions` | `updateProductGroupPromotion` |
| More-info update | `PUT product-groups/:id/more-info` | `updateProductGroupMoreInfo` |
| Final/draft assembled update | `PUT product-groups/:id/product-groups[/draft]` | (assembled update path) |
| Bulk activate/deactivate | `PUT product-groups/${status}` | `updateActiveState` |
| Draft delete | `DELETE product-groups/:id/product-groups` | `deleteProductGroupDraft` |

Two independent thunks PUT to `/summary` (summary update and status-only
update) — see §0 item 3 and §13.

## 7. Forms and validation

AntD `Form`/`FormInstance` only; no Zod, no React Hook Form anywhere in this
directory (confirmed by grep). `Form.useForm` sites: `create/form.tsx:102`;
`edit/{general-info:39, other-info:66, product:80, promotion:94, rule:110}`;
`view/{general-info:33, other-info:69, product:86, promotion:81, rule:100}`;
`view/form.tsx:69` (a `ReasonDisable` form for the status-change reason).
Create's section files have no own form — they call
`useFormImperativeHandle(ref, form)` against the parent `create/form.tsx`
form. Validation is AntD rules and custom validators from `@/utils/form` (19
import sites across the directory); no whole-form or cross-field Zod schema
exists.

## 8. Types and DTO organization

Ambient global `ProductGroupList`/`CreateProductGroup`
(`src/types/product-group-list.d.ts`) used unimported by the slice. Feature-local
`ProductGroupFormValues` is declared independently in `create/form.tsx:49` and
`edit/form.tsx:41` — same name, not confirmed to be the same shape (§0 item 5).
Other feature-local types: `ProductGroupGeneral`, `ProductGroupRule`, plus
per-section `FormValues`. This mixed ambient/feature-local pattern is
`legacy-compatible` per `.claude/ARCHITECTURE.md`, not a defect.

## 9. Permissions

Six permission constants are in play, below the content-rule-9 table
threshold (ten), but since the same OR array recurs across all four routes it
is named once: the **group-view-OR** (`PRODUCT_GROUP_VIEW_CREDIT_CARD` |
`PRODUCT_GROUP_VIEW_CASH_LOAN`), **group-create-OR**, and **group-edit-OR**
pairs (`src/constants/permission.constant.ts:50-57`).

- Route level: see §2 (all three OR pairs, one per action).
- Component level, resolved **per loaded product line, not as a static OR**
  (content rule 14 — each site reads a numeric `productLineId` and branches):
  - `group-list.tsx:172,175` — create-dropdown items per line.
  - `group-list.tsx:300` — create button (OR of the create pair).
  - `group-list.tsx:341` — bulk-status button (`PRODUCT_GROUP_EDIT_CASH_LOAN`
    specifically, not an OR — **NEEDS-VERIFICATION** whether this should also
    cover the credit-card edit permission for credit-card-line groups).
  - `view/form.tsx:157,159` — delete/edit permission chosen by
    `productLineId === 2` (credit-card) vs. else (cash-loan).
  - `view/form.tsx:184,187` — view-permission choice, same branching.
  - `edit/form.tsx:160,163` — VIEW-on-load check, same branching.

The `productLineId === 2` / `=== 1`-or-else convention (magic numbers, not
named constants) is used at every one of these branch points; see §13.

## 10. Shared and cross-domain dependencies

- **Segmentation:** `create/rule.tsx:26`, `edit/rule.tsx:35`, `view/rule.tsx:31`
  import `getLoanOrderAndContractStatusOptions` from
  `@/modules/users/customer/segmentation/utils`, plus the `options/segmentation`
  module (3 importers).
- **Contract templates:** `edit/form.tsx:34` imports `returnStatusUpdate` from
  `@/modules/products/parameter/contract-termplate/utils`.
- **Shared search component:** `group-list.tsx:12` imports
  `GroupProductListSearcher` from
  `@/components/forms/search/group-product-list-searcher.form`.
- **Redux reference state:** `@/redux/slices/common.slice` (17 importers in
  this directory), `product-addon.slice` (8), `address.slice` (3),
  `product-industry.slice` (`history.tsx:10` only).
- Not found: any import of document-set, required-information-set, or
  add-on-module files beyond `common.slice`/`product-addon.slice`.

## 11. Consumers

- No file inside `cash-loan/`, `credit-card/`, or `card-gift-offer/` imports
  anything from `group-list-product/` (repo-wide grep for the literal
  `group-list-product` returns only `src/routes/pages.tsx:15-18` and
  `src/modules/products/configuration/industry-product/view/form.tsx:5`).
- `industry-product/view/form.tsx:5` imports a relative `./group-list-product`
  path, which resolves under `industry-product/view/`, **not** this directory
  — **NEEDS-VERIFICATION** whether that local path actually exists or is a
  misleading name collision; not confirmed in this pass.

## 12. Pattern classification

| Pattern | Classification |
| --- | --- |
| Fully Redux-owned server resource (list, CRUD, status, draft-delete) | `legacy-compatible` |
| One shared `loading` flag across independent thunks | `legacy-compatible`, known repository-wide pattern |
| Ambient `product-group-list.d.ts` types alongside feature-local form types | `legacy-compatible` |
| Component-level permission resolved per product-line branch, not a static OR | confirmed pattern, not a violation of OR semantics (content rule 14 — correctly documented as line-resolved here) |
| `constant.ts`'s unused `mock*` arrays | dead code, recorded §13 |
| Legacy TS `enum ProductListTabs` | existing code; the no-new-enum rule applies to new code only, not flagged as a defect |

## 13. Technical risks

Ordered by decreasing consequence, per content rule 8.

- **Possible malformed bulk-status path.** `updateActiveState` PUTs to
  `product-groups/${data.status}` with the group id only in the body
  (§0 item 1). If the backend expects the id in the path and status in the
  body, this call could be silently hitting the wrong route.
  **NEEDS-VERIFICATION.**
- **Possible copy-pasted delete path.** `deleteProductGroupDraft`'s DELETE
  target (`product-groups/${id}/product-groups`) duplicates the assembled
  update path's suffix (§0 item 2). **NEEDS-VERIFICATION.**
- **Two independent `/summary` PUTs.** `updateProductGroupSummary` and
  `updateProductGroupStatus` both target the same endpoint. A status toggle
  fired shortly after a general-summary save (or vice versa) could overwrite
  fields the other call intended to preserve. **NEEDS-VERIFICATION** against
  backend semantics.
- **Route/page permission asymmetry.** The route-level OR pairs are broader
  than what the page then enforces once a specific product line is known
  (§2, §9) — not itself a defect (frontend checks don't prove backend
  authorization either way), but worth tracking since the two layers can
  silently drift if either is edited alone.
- **Magic product-line IDs.** `productLineId === 2` / `=== 1` recurs at five
  call sites (§9) with no named constant — a future product-line addition
  would require finding and updating every one of these branches by hand.
- **Dead `mock*` arrays.** `constant.ts:39-106` has zero consumers
  (grep-confirmed) but sits beside live constants in the same file.
- **Duplicate type name, unconfirmed shape.** `ProductGroupFormValues` in
  `create/form.tsx:49` and `edit/form.tsx:41` (§0 item 5).
- **Unnarrowed cast.** `group-list.tsx:109` casts `selectedRowKeys as number[]`
  from AntD's `Key[]` without runtime narrowing.
- **Shared `loading` flag.** One flag covers list/detail/mutation thunks in
  the slice; independent concurrent operations are not distinguished.
- **Menu entry commented out.** `menus.helper.ts:167` (§0 item 4) — reachability
  of the list page outside direct URL entry is unconfirmed.

## 14. Areas to avoid touching

- Do not assume `updateActiveState`'s and `deleteProductGroupDraft`'s URL
  shapes are safe to "clean up" without confirming the backend's actual route
  contract first (§13) — a fix attempted without that confirmation could
  break a currently-working call or "fix" something that was never broken.
- Do not collapse `updateProductGroupSummary` and `updateProductGroupStatus`
  into one thunk as an incidental simplification; their concurrent-write
  interaction with `/summary` is unconfirmed and merging them changes
  observable request timing.
- Do not replace the magic `productLineId === 2`/`=== 1` branches with a
  named constant as an opportunistic cleanup inside an unrelated task; doing
  so touches every one of the five permission-branch call sites in §9 at
  once, which is a wider blast radius than most unrelated fixes should take.

## 15. Open questions

- The three backend-contract items in §0/§13 (bulk-status path, draft-delete
  path, dual `/summary` PUT interaction).
- Whether the product-group list is currently reachable from the menu, given
  the commented-out entry at `menus.helper.ts:167`.
- Whether `industry-product/view/form.tsx:5`'s relative `./group-list-product`
  import target actually exists, and if so what its relationship is to this
  directory.
- Whether `ProductGroupFormValues` in `create/form.tsx` and `edit/form.tsx`
  have diverged.
- Whether the bulk-status button's single `PRODUCT_GROUP_EDIT_CASH_LOAN`
  check (`group-list.tsx:341`, not an OR with the credit-card edit
  permission) is intentional given that the list shows both product lines.
