# Promotion Management — Overview

> Living document. This is an index over `src/modules/products/promotion-management/`'s
> two sibling submodules; it does not itself use the per-module TEMPLATE.md
> section list. Each linked document does. Update this table when a child
> submodule's document, split, or state ownership changes.

## 0. Document status

New document, replacing `docs/modules/products/OVERVIEW.md`'s one-row
"Promotion types" summary, which pointed only to
`docs/reports/2026-10-21/sprint1-promotion-type-list.md` — an external report
describing a 9-file, list-only Sprint 1 state. The module has since grown to
69 files (`find src/modules/products/promotion-management -type f | wc -l`):
`promotion/` (41 files) and `promotion-type/` (26 files), plus a shared
`queryKeys/promotion-type.query-keys.ts` and `types/promotion-type.types.ts`
at this directory's root (1 file each). The Sprint-1 report is stale on
almost every functional claim about `promotion-type/` (it now has a create
drawer, an edit drawer, and a status toggle, none of which existed at Sprint
1) and never covered `promotion/` at all — `promotion/` was previously
undocumented anywhere.

**Split decision.** `promotion/` and `promotion-type/` are documented as
**two separate documents**,
[`promotion-management/promotion.md`](promotion-management/promotion.md) and
[`promotion-management/promotion-type.md`](promotion-management/promotion-type.md),
following the same coupling-check method used for `system/theme-management`'s
Background Main/Topic split and `users/SEGMENTATION.md`. Justification:

- They are separate backend resources (`offers` vs. `offer-types`) with
  separate route trees, separate permission constants
  (`PRODUCT_PROMOTION_*` = `offer:*` vs. `PROMOTION_MANAGEMENT_*` =
  `offer_type:*` — the identifier/string mismatch is confirmed intentional,
  not a bug, per a comment at `src/constants/permission.constant.ts:169-170`),
  separate services (`src/services/products/promotion.service.ts` vs.
  `promotion-type.service.ts`), and separate query-key roots (`promotions`
  vs. `promotion-types`).
- There is **no component-level coupling in either direction** — neither
  submodule imports a component, hook, or type from the other. The only
  coupling is: (a) `promotion/`'s create/edit forms and filter bar read the
  shared root-level `promotionTypeLookupQueryKeys.unlimited()` lookup query to
  populate a category dropdown, and (b) `promotion-type/`'s detail drawer
  builds a one-way deep link (`?offerTypeId=`) into `promotion/`'s list page.
  Neither is a two-way dependency, and documenting it once per document
  (cross-referenced) does not duplicate significant content, unlike the
  Background Main/Lock case where the same thunks and middleware would have
  had to be described twice.
- `promotion/` turned out to be the larger, more complete feature by scope
  (full list/create/view/edit CRUD with a shared AntD form, image upload, and
  history — no delete) rather than a simple sibling of `promotion-type/`
  (list/create/edit-via-drawer/status-toggle — also no delete), confirming
  the reconciliation report's premise that `promotion/`'s scope "turned out to
  be substantially larger than list/create/view" as the deciding factor for a
  split rather than a combined document.

**`auth.slice.ts` workaround — resolved as NEEDS-VERIFICATION, not
determinable.** `.claude/PROJECT_CONTEXT.md`'s 2026-10-21 entry recorded an
*uncommitted* working-tree change to `src/redux/slices/auth.slice.ts`
(+23/-9) that appended the three `promotion_management:*` permission strings
to every user's permission list client-side, inside `getUserPermissions`,
independent of what the backend returned. That change is confirmed absent
from current source (`grep -rn "promotion_management\|promotion-management"
src/redux/slices/auth.slice.ts` returns nothing). `git log --oneline -10 --
src/redux/slices/auth.slice.ts` shows only two commits
(`9fe7374`, `ecd4f0a`), neither with a subject or diff referencing promotion
permissions, and `git log --all --oneline -S "promotion_management"` across
the whole repo returns no matching commit at all. Because the original change
was never committed, its removal from the working tree leaves **no git trace
either way** — there is no commit that reverted it, and no commit that
"superseded" it with real backend support. Whether the backend now correctly
returns `offer_type:*`/`offer:*` permissions, or whether the workaround was
simply discarded before anyone relied on it, **cannot be settled from
available evidence** and remains exactly as uncertain as
`.claude/PROJECT_CONTEXT.md` already recorded it. Current permission checks
in both submodules (cited in each child document's §9) call `hasPermission`
normally, with no special-casing — consistent with either explanation.

**Verification-gap limit (top 5; remainder in each child document's §15):**

1. Whether the backend enforces `offer_type:*`/`offer:*` permission strings
   server-side at all — **NEEDS-VERIFICATION**, repository-wide limitation
   (frontend checks never prove backend authorization).
2. The `auth.slice.ts` workaround's resolution (above) —
   **NEEDS-VERIFICATION**, not determinable from git history.
3. `promotion-type/`'s status-toggle endpoint uses `PUT`
   (`src/services/products/promotion-type.service.ts:90`), while that same
   file's sibling types module documents the swagger contract as `PATCH`
   (`promotion-type.types.ts:88`) — **NEEDS-VERIFICATION** against the actual
   backend.
4. The 9→26 file growth history for `promotion-type/` could not be
   reconstructed from this checkout: the commit cited in earlier
   documentation (`ed18d0c1`) does not exist in this clone
   (`git cat-file -t ed18d0c1` fails), and `git log` on the directory shows
   only 4 commits with unrelated subjects — **NEEDS-VERIFICATION** against a
   checkout with fuller history.
5. Whether empty-string vs. `null` for `promotion-type/`'s optional
   `description` field is handled consistently by the backend — the Zod
   schema accepts `''` and the mapper passes it through unchanged —
   **NEEDS-VERIFICATION**.

## 1. Scope

| Submodule | Files | State ownership | Backend resource | Document |
| --- | --- | --- | --- | --- |
| `promotion/` | 41 | TanStack Query only, no Redux shadow, colocated `queryOptions` | `api/admin/portal/v1/offers` | [`promotion.md`](promotion-management/promotion.md) |
| `promotion-type/` | 26 | TanStack Query only, no Redux shadow, colocated `queryOptions` | `api/admin/portal/v1/offer-types` | [`promotion-type.md`](promotion-management/promotion-type.md) |

Shared root-level files (not duplicated into either child document, each
cross-references this section instead): `queryKeys/promotion-type.query-keys.ts`
(exports `promotionTypeLookupQueryKeys`, an unlimited-size lookup query
consumed only by `promotion/`, not by `promotion-type/` itself — despite the
shared basename with `promotion-type/`'s own, separate
`promotion-type/queryKeys/promotion-type.query-keys.ts`, which is a confirmed
naming collision between two files that export different things, not a
runtime conflict since their query-key prefixes differ:
`['promotion-types-lookup', ...]` vs. `['promotion-types', ...]`) and
`types/promotion-type.types.ts` (a pure re-export pass-through of
`src/services/products/promotion-type.types.ts`; its own header comment
claiming `promotion/` consumes it is stale — `promotion/` does not import
from it at all, confirmed by grep).

Both submodules' actual request/response DTOs and service functions live at
the target location, `src/services/products/` (`promotion.service.ts`,
`promotion.types.ts`, `promotion-type.service.ts`, `promotion-type.types.ts`),
not inside `src/modules/products/promotion-management/` — this module was
built target-compatible with the 2026-10-29 service-location policy from the
start, unlike most of `products/`'s older submodules.

## 2. Change and validation guide

For a promotion or promotion-type field/payload change, read the relevant
child document in full. Both are small, fully Query-owned, Zod-validated
features with no Redux and no cross-feature component coupling, so a change
to one has a narrow blast radius confined to that document — unlike the wider
`cash-loan-credit-card.md`/`group-list-product.md` cluster in
`product-configuration/`. The one cross-cutting check for either submodule:
if changing `promotion-type/`'s id, code, name, or status shape, also check
`promotion/`'s shared lookup consumers (`promotion/components/OfferForm`,
`promotion/components/PromotionFilterBar`, `promotion/views/PromotionEditPage`)
since they read the same root-level lookup query.

## 3. Open questions carried at the index level

- The five verification gaps in §0.
- Each child document's own §15 holds its submodule-specific open questions;
  this index does not repeat them.
