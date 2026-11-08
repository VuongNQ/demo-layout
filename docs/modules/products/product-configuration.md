# Product Configuration — Overview

> Living document. This is an index over `src/modules/products/configuration/`'s
> sibling submodules; it does not itself use the per-module TEMPLATE.md section
> list. Each linked document does. Update this table when a child submodule's
> document, split, or state ownership changes.

## 0. Document status

Rewritten in this pass. The previous version of this file (dated
2026-10-02-equivalent content) described `configuration/list-product/` as a
single Redux-owned tree covering cash-loan and credit-card products, with
`list-product/utils.tsx` as the shared payload-mapping layer. That directory
no longer exists:
`find src/modules/products/configuration -maxdepth 1 -iname "*list-product*"`
returns nothing. `cash-loan/` (31 files) and `credit-card/` (30 files) are now
top-level siblings under `configuration/`, each with its own
`hooks/`/`queryKeys/`/`services/`/`types.ts`, documented in
[`product-configuration/cash-loan-credit-card.md`](product-configuration/cash-loan-credit-card.md).
`group-list-product/` (22 files) kept its name and architecture unchanged
(still fully Redux-owned) and is now documented separately in
[`product-configuration/group-list-product.md`](product-configuration/group-list-product.md).
`display-information-set/` (17 files, a sibling at the same `configuration/`
level, not historically part of this document's three-level scope) has its
own document,
[`product-configuration/display-information-set.md`](product-configuration/display-information-set.md);
it is cross-referenced here because cash-loan/credit-card and
display-information-set share the product-labels submodule as reference data,
but display-information-set is not a "product configuration" entity itself.

`industry-product/` (32 files) keeps its existing document,
[`product-configuration/industry-product.md`](product-configuration/industry-product.md),
unchanged by this pass — nothing in the reconciliation that produced the other
three documents contradicted its content.

## 1. Scope

This boundary covers four sibling submodules under
`src/modules/products/configuration/`, sharing product-line/group/reference
data, customer-segmentation rules, and (for cash-loan/credit-card) the
product-labels submodule:

| Submodule | Files | State ownership | Document |
| --- | --- | --- | --- |
| `industry-product/` | 32 | Redux (`product-industry.slice.ts`) | [`industry-product.md`](product-configuration/industry-product.md) |
| `group-list-product/` | 22 | Redux (`product-group-list.slice.ts`), sole owner, no Query | [`group-list-product.md`](product-configuration/group-list-product.md) |
| `cash-loan/` + `credit-card/` | 31 + 30 | Hybrid: TanStack Query owns each line's paginated list read; Redux `product-list.slice.ts` (`productListSlice`) remains the sole owner of create/edit/view/status/draft-delete/import/export, bridged into the Query cache via explicit `invalidateQueries` on each Redux mutation's `fulfilled` | [`cash-loan-credit-card.md`](product-configuration/cash-loan-credit-card.md) |
| `display-information-set/` | 17 | TanStack Query only, no Redux shadow | [`display-information-set.md`](product-configuration/display-information-set.md) |

Counts re-derived this pass via `find <dir> -type f | wc -l` per submodule;
sum (32+22+31+30+17 = 132) plus the `configuration/` top-level shared pieces
below is less than the 312-file `configuration/` total recorded in
`docs/reports/2026-11-04/products-docs-reconciliation.md` because that total
also includes `card-gift-offer/` (10), `components/` (5),
`installment-loan/` (1), `product-labels/` (78),
`required-information/`+`required-information-set/` (12+11), and
`scheme-sync/` (63) — each documented elsewhere (see
[`../OVERVIEW.md`](../OVERVIEW.md)'s Submodule Inventory).

Product-line creation itself is not a routed workflow in any of the four
submodules above — none exposes a create route for the product-line/industry
entity (`industry-product.md` documents its own view/edit-only routing).

## 2. Shared infrastructure referenced by more than one child above

- **`src/modules/products/configuration/components/CashLoanCatalogModal/`**
  (5 files): genuinely shared — consumed by
  `credit-card/shared/card-gift-offer-fields.tsx` and
  `product-labels/shared/ProductLabelProductCatalogModal.tsx`, plus style
  helpers reused by several `product-labels/cash-loan/` files. It is also
  reached from `src/components/add-product-modal/index.tsx`, a shared,
  higher-level component reaching into this module-level folder — a
  shared-code-importing-module-internals direction that
  `.claude/rules/01-architecture.md` says shared code should not take; not
  fixed in this pass, recorded as a cross-cutting finding here since it does
  not belong to any one child document.
- **`src/redux/slices/product-list.slice.ts` (`productListSlice`)**: beyond
  `cash-loan/`/`credit-card/`, it is also imported by
  `src/components/forms/import/{import-file-form.tsx,list/invalid-file-import.tsx,list/valid-file-import.tsx}`
  (import-workflow list reads/resets, not reference-data-only),
  `src/components/product-configuration/card-marketing-fields.tsx`
  (`getMarketingOptions`), `src/modules/order/loan-order-list/component/adjustment.tsx`
  (`getProductInsurance`/`watchProductInsurance`, a cross-domain read),
  `src/modules/products/parameter/fee/fee-list.tsx` and
  `src/modules/users/operator/user-operator-list/list.operator.tsx` (import-reset
  only), and `src/redux/middlewares/product.middleware.ts`. Any change to this
  slice's thunk signatures or endpoint strings has a blast radius wider than
  `cash-loan-credit-card.md` alone describes — see that document's §14 for the
  do-not-touch-without-auditing guidance, which this note exists to reinforce
  at the index level.
- **Segmentation, fees, document sets, contract templates, add-ons**: consumed
  as reference data by `group-list-product/`, `cash-loan/`, and `credit-card/`
  alike; each child document states its own exact import sites rather than
  this index repeating them.

## 3. Change and validation guide

For a product, product-group, or product-line field/payload change, read the
relevant child document(s) above in full, plus the shared infrastructure note
in §2, before changing code. Follow the canonical
[form](../../../.claude/rules/05-form.md),
[state](../../../.claude/rules/04-state-management.md),
[API](../../../.claude/rules/03-api-service.md), and
[refactoring](../../../.claude/rules/08-refactoring.md) rules. Do not combine a
small field fix with a broad ambient-type, enum, form, or slice migration —
each child document's own §14 ("Areas to avoid touching") states submodule-specific
guardrails; this note is the index-level reminder to read them.

## 4. Open questions carried at the index level

- Whether `CashLoanCatalogModal`'s shared-code-reaching-into-module-internals
  import direction (§2) should be resolved by relocating it to a genuinely
  shared folder — `NEEDS-TEAM-DECISION`, not decided here.
- Each child document's own §15 holds its submodule-specific open questions;
  this index does not repeat them.
