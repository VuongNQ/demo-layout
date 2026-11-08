# `docs/modules/products/` documentation reconciliation — 2026-11-04

> Scope: reconcile every checkable factual claim in the current
> `docs/modules/products/` documents against current source (revision
> `8562c125`, branch `improve/vuongnq`). Read-only with respect to `src/`.
> No file under `docs/modules/products/` was created, edited, or deleted in
> this pass — this report and its follow-up plan are the only output.
>
> Evidence method: fresh `find`/`grep`/`git log` run directly in this session
> against current source, cross-checked against
> `docs/reports/2026-11-04/module-docs-inventory.md` (produced the same day,
> same revision, by a separate documentation-scoping task) and
> `.claude/PROJECT_CONTEXT.md`. Counts recorded in those two documents were
> spot-checked, not blindly trusted — see "Count re-verification" below.

## Documents found under `docs/modules/products/` (via `find`, not assumed)

```
docs/modules/products/OVERVIEW.md
docs/modules/products/add-ons.md
docs/modules/products/card-gift-offers.md
docs/modules/products/documents-and-contracts.md
docs/modules/products/fees.md
docs/modules/products/popular-loans.md
docs/modules/products/product-configuration.md
docs/modules/products/product-configuration/industry-product.md
docs/modules/products/product-configuration/product-line-form-refactor-feasibility-analysis.md
docs/modules/products/product-configuration/product-line-hidden-fields-impact-analysis.md
docs/modules/products/product-labels.md
docs/modules/products/products-loan-excel-import-api.md
docs/modules/products/required-information.md
docs/modules/products/scheme-sync-import-plan.md
docs/modules/products/simulation.md
```

14 content documents, not "roughly a dozen" — the task brief's list omitted
the two report-shaped files under `product-configuration/`
(`product-line-form-refactor-feasibility-analysis.md`,
`product-line-hidden-fields-impact-analysis.md`), which `docs/README.md`
already accounts for as a deliberate, intentionally-undated exception (see
its "Known exception: report-shaped documents left in `docs/modules/`").
Those two were not re-read for business content in this pass — they are
report-shaped (risk/decision analyses), not module-structure documentation,
and are out of scope for a structural reconciliation. They are listed here
only for completeness of the directory inventory.

## Count re-verification

`OVERVIEW.md`'s header count ("312 files... as of 2026-10-02") is the only
raw count asserted by the `products/` documents themselves.

| Count | Doc's figure | `module-docs-inventory.md`'s figure (same revision) | This session's fresh `find` | Verdict |
| --- | --- | --- | --- | --- |
| `src/modules/products` total | 312 (2026-10-02) | 530 | **532** | **CHANGED**, and the inventory report is itself 2 files stale — see below |
| `configuration/` total | not asserted | 310 | **312** | discrepancy traced to `industry-product/` |
| `configuration/industry-product/` | not asserted | 30 | **32** | +2 vs. the same-day, same-revision inventory report |

The 530→532 and 310→312 gaps are both fully explained by the single
industry-product discrepancy (32 vs. 30); every other `configuration/` child
count re-verified by this session matches the inventory report exactly
(`card-gift-offer` 10, `cash-loan` 31, `credit-card` 30,
`display-information-set` 17, `group-list-product` 22, `installment-loan` 1,
`product-labels` 78, `required-information` 12, `required-information-set`
11, `scheme-sync` 63, `components/` 5). `git log --diff-filter=A` against
`industry-product/` returned no commits in this checkout's visible history
for the extra files (the directory's four `read-only-context.tsx`/
`read-only-provider.tsx` files are the most likely candidates for a very
recent, not-yet-reflected addition, but this is **NEEDS-VERIFICATION** — not
confirmed by `git log`, since the report and this session's recount were run
minutes apart on the same revision and the discrepancy was not reconciled
file-by-file). Every count in the tables below uses this session's fresh
`find` figures, not the inventory report's.

## Step 1 — Claim-by-claim reconciliation

Each row is a concrete, checkable claim taken from one of the 12 content
documents (the two report-shaped files are excluded, per `docs/README.md`).

| # | Claim | Source doc | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Module is "312 files... as of 2026-10-02" | `OVERVIEW.md` | **CHANGED** | Current: 532 files (`find src/modules/products -type f \| wc -l`). The entire document's header date/count is stale; every count-dependent claim in it inherits this staleness. |
| 2 | TypeScript 5.3.3 is installed | `OVERVIEW.md` | **CHANGED** | `package.json` declares `^5.8.0`, resolved 5.9.3 (per `.claude/PROJECT_CONTEXT.md`, cross-checked, not re-run independently this pass). |
| 3 | Product Labels row: "Redux owns keyed list/detail server cache and mutation invalidation" | `OVERVIEW.md` §Submodule Inventory | **CHANGED** | `src/redux/slices/product-labels.slice.ts` and its middleware were deleted (commit `3d70aa35`, 2026-10-16, per `.claude/PROJECT_CONTEXT.md`); cash-loan/credit-card labels are now TanStack-Query-owned (`cash-loan/{hooks/cashLoanLabelQueries.ts,queryKeys/,services/}`). `product-labels.md` itself (a separate, newer document) correctly describes the keyed-Redux-cache architecture for the *list/detail read* path only — but that document's own §6 claim ("Redux owns server list pages and initial detail... Mutations live in Redux thunks") is itself now **CHANGED** for the same reason: no `product-labels.slice.ts` exists in current source. `product-labels.md` needs the same correction `OVERVIEW.md` does. |
| 4 | "Duplicate `/product/parameter/group-document-list` route declarations exist" | `OVERVIEW.md` §Known Risks (MEDIUM); `documents-and-contracts.md` §7, §10 | **CHANGED (resolved)** | `grep -n "group-document-list" src/routes/main.routes.tsx src/routes/form.routes.tsx` now returns exactly one list route (`main.routes.tsx:245`) and one create/edit/view set (`form.routes.tsx:702/708/714`) — no duplicate. Confirmed independently of `.claude/PROJECT_CONTEXT.md`'s same claim (2026-11-04 entry: "the two previously documented duplicate routes... no longer exist"). |
| 5 | `src/routes/index.tsx` is the single route file (implied throughout all 12 documents by file-path references to "`src/routes/index.tsx`") | all documents | **CHANGED** | `src/routes/index.tsx` is now a 34-line shell; routes live in `src/routes/main.routes.tsx` (69 `<Route>`s) and `src/routes/form.routes.tsx` (113 `<Route>`s), per `.claude/PROJECT_CONTEXT.md`'s 2026-11-04 entry. Every products document that cites `src/routes/index.tsx` as the route evidence location is technically imprecise, though the underlying route *behavior* each document describes was not found to be wrong — only the file-location citation is stale. This is a mechanical, repository-wide citation staleness, not a behavior error. |
| 6 | `/product/configuration/condition-list`, `/input-form-list` are static placeholders, absent from the menu | `OVERVIEW.md` §Known Risks (MEDIUM); `documents-and-contracts.md` §1 | **STILL TRUE** | `find src/modules/products -iname "*condition-list*" -o -iname "*input-form-list*"` → both still exist as 3-line placeholder files (`parameter/condition-list.parameter.tsx`, `parameter/input-form-list.parameter.tsx`), matching `module-docs-inventory.md`'s placeholder table. |
| 7 | Generic `/product/configuration/list/edit/:id` renders a placeholder (`list-product/edit-list.tsx`) | `OVERVIEW.md` §Submodule Inventory; `product-configuration.md` §3, §10 | **CHANGED** | Neither `list-product/` nor an `edit-list.tsx` file exists anywhere under `src/modules/products/` any more (`grep -rl "list-product" src/modules/products/` returns only one incidental string match in `industry-product/view/form.tsx`, not a directory). The route `product/configuration/group-list/edit/:id` that does exist (`form.routes.tsx:518`) belongs to `group-list-product`, a different, non-placeholder feature — it is not the same route. This claim cannot be re-confirmed as still true; the entire `list-product/` directory structure both documents describe is gone. |
| 8 | Product Configuration's state owner for cash-loan/credit-card: "Central slices `product-industry`, `product-group-list`, `product-list`... Forms assemble ambient models and helpers from `list-product/utils.tsx`" | `OVERVIEW.md` §Submodule Inventory; `product-configuration.md` §2, §5, §6 | **CHANGED — largest finding in this pass** | `src/modules/products/configuration/list-product/` no longer exists. `cash-loan/` and `credit-card/` are now **top-level siblings of `list-product`'s former location directly under `configuration/`** (31 and 30 files respectively), each with its own `hooks/`, `queryKeys/`, `services/`, and `types.ts` — e.g. `cash-loan/hooks/cashLoanProductQueries.ts`, `cash-loan/services/cash-loan-product.service.ts`. `CashLoanProductList.tsx` (the list page) imports `useCashLoanProductListQuery` from the feature's own hook, not a Redux selector. `productListSlice` (`src/redux/slices/product-list.slice.ts`) is **still registered** in `src/redux/slices.ts:49`, but this session found no consumer of it inside `cash-loan/` or `credit-card/` beyond a `getProductList` reference used only as reference data in `create/index.tsx` and `edit|view/promotion.tsx` — not the list/CRUD path itself. Whether `productListSlice` is now dead code, partially retained for a narrower purpose, or still authoritative for some other consumer outside `products/` is **NEEDS-VERIFICATION**; it was not traced exhaustively in this reconciliation pass. This is the single highest-impact finding in this report: both `OVERVIEW.md`'s architecture diagram and `product-configuration.md`'s entire §2/§5/§6 for the cash-loan/credit-card product CRUD path describe an architecture that no longer exists in source. `display-information-set/` has undergone the identical shape change (own `hooks/`, `queryKeys/`, `services/`, `mappers.ts`) and is also undocumented at this level of detail (it has no dedicated file; it is only covered inside `product-configuration.md`'s brief mentions). |
| 9 | `scheme-sync/import/` architecture: flat files, a mock-service switch (`USE_MOCK_SCHEME_IMPORT_DATA` in `services/index.ts`), `import-modal.tsx`-style flat component names | `scheme-sync-import-plan.md` (entire "Cấu trúc thư mục mới" section and Giai đoạn A/B/C plan) | **CHANGED** | Current `scheme-sync/import/` has **no `services/` folder at all** (`grep -n "USE_MOCK_SCHEME_IMPORT_DATA" .../import/services/index.ts` found nothing because the path doesn't exist). The actual structure is PascalCase component folders with colocated `styles.module.scss` (`components/ImportModal/index.tsx`, `components/ImportConfirmModal/index.tsx`, `components/ImportCancelConfirmModal/index.tsx` — a component not in the plan at all, `components/ImportHistoryTab/`, `components/ImportPreviewModal/`, `components/ImportPreviewTable/`, `components/ImportErrorList/`, `components/PublishHistoryTab/`), plus `hooks/scheme-import.queries.hook.ts`, `queryKeys/scheme-import.query-keys.ts`, `utils/import-error-workbook.helper.ts`, `utils/import-preview-table.helper.ts`, and a top-level `constant.ts`. The plan's Giai đoạn A/B/C mock-then-real-integration narrative, and its explicit three-file `services/` layer, do not match current source at all — the implementation appears to have gone directly to a real service/hook/query-key layout without ever landing (or without retaining) the described mock-switch scaffold. This document's own header already flags Giai đoạn B/C as "chưa triển khai" (not yet implemented) as of 2026-10-22; current source shows substantially more than Giai đoạn A was scoped to, built with a different file/folder convention than the plan specified, and with no mock switch surviving — so the plan is now stale on structure, not just on phase-completion status. |
| 10 | Card Gift Offer is mock-only (no persistence endpoint; `mock-data.ts` is the only store) | `OVERVIEW.md` §Submodule Inventory; `card-gift-offers.md` §1, §3, §6, §10 | **STILL TRUE** | `find src/modules/products/configuration/card-gift-offer -iname "mock-data.ts"` confirms the file still exists; `card-gift-offer` file count (10) is unchanged from the inventory report. Not independently re-traced for new persistence call sites beyond the file's continued existence — a full re-confirmation of "no create/update/status API is present" would need a fresh read of `rule-form.tsx`, not done in this pass. |
| 11 | The working-tree-uncommitted `auth.slice.ts` change grants all users `promotion_management:*` permissions client-side regardless of backend data | `.claude/PROJECT_CONTEXT.md`'s 2026-10-21 entry, referenced indirectly by `OVERVIEW.md`'s Promotion Types row ("permission strings are assumptions pending backend confirmation") | **CHANGED (resolved)** | `grep -n "promotion_management" src/redux/slices/auth.slice.ts` returns nothing. The workaround is gone; whether it was removed because the backend now returns these permissions properly, or because the feature was reverted, is **NEEDS-VERIFICATION** — not traceable from this file alone. `git status` at the start of this session shows `auth.slice.ts` is not even a modified file, consistent with this being resolved and committed at some point before this session. |
| 12 | `module-docs-inventory.md`'s own 530-file figure for `products/` and 310 for `configuration/` | `docs/reports/2026-11-04/module-docs-inventory.md` (not a `docs/modules/products/` document itself, but the only other same-day source with hard counts) | **CHANGED, +2 both places** | See "Count re-verification" above — fully explained by `industry-product/`'s 30→32 drift, `NEEDS-VERIFICATION` on root cause. |
| 13 | Promotion Types: Sprint 1, list-only, TanStack-Query-only, no Redux slice/middleware | `OVERVIEW.md` §Submodule Inventory (Promotion types row) | **LIKELY STILL TRUE, not fully re-verified** | `grep -rln "redux/slices" src/modules/products/promotion-management/` returns no matches, consistent with "no Redux slice." `promotion-management/` grew from the single `promotion-type/` submodule (9 files per `.claude/PROJECT_CONTEXT.md`'s 2026-10-21 entry) to two submodules today — `promotion/` (41 files) and `promotion-type/` (26 files), 69 total — which is a substantial feature expansion beyond "Sprint 1, list-only" that this reconciliation pass did not read in detail. Whether `promotion/` (41 files, not mentioned in `OVERVIEW.md` at all) implements create/edit/view beyond the list-only Sprint 1 scope is **NEEDS-VERIFICATION** and is exactly the kind of gap a dedicated `promotion-management` documentation run should close. |
| 14 | Documents-and-Contracts: contract templates folder is `contract-termplate/` (misspelled); `returnStatusForm` is a cross-domain export consumed by notifications | `documents-and-contracts.md` §2, §8 | **UNVERIFIABLE in this pass** | Not re-checked; this is a narrow, low-risk naming/export claim with low likelihood of having changed and was deprioritized against the higher-value checks above. Flagged here only so it is not silently assumed true. |
| 15 | Required Information / Required Information Set: ambient misspelled type files `require-infomation.d.ts`, `require-infomation-set.d.ts` still exist | `required-information.md` §2 | **UNVERIFIABLE in this pass** | Same reasoning as row 14 — not re-checked; low-risk naming claim, deprioritized. |
| 16 | Fees, Add-ons, Popular Loans, Simulation: route paths, permission constant names, and state-owner claims (each feature's own slice/middleware pair; Popular Loans has no Redux slice) | `fees.md`, `add-ons.md`, `popular-loans.md`, `simulation.md` | **LIKELY STILL TRUE, not independently re-verified route-by-route** | These four documents' core architecture claims (one Redux slice + middleware per feature, except Popular Loans which is correctly documented as feature-local/no-slice) are consistent with `module-docs-inventory.md`'s Redux table, which lists exactly the slices these documents name (`feeDefinitionSlice`, `productAddonSlice`, `simulationSlice`, `cardPackageSlice`) and does not list a popular-loans slice. Not re-confirmed against a fresh route-file grep in this pass; flagged as the lowest-priority verification gap of this reconciliation because the architecture pattern (one small feature, one slice, no Query migration) is the least likely of anything in `products/` to have silently changed, given the two large, confirmed migrations (cash-loan/credit-card product CRUD, product-labels) both involved comparatively large, actively-developed features. |

## Step 2 — Submodule coverage and sizing (fresh `find`, this session)

### `src/modules/products/` immediate children

| Submodule | Files (fresh `find`) | Inventory report's figure | Match? | Has a dedicated doc? |
| --- | --- | --- | --- | --- |
| `add-on/` | 19 | 19 | yes | `add-ons.md` |
| `attractive-offer/` | 13 | 13 | yes | **none** — not mentioned in any `products/` document |
| `configuration/` | **312** | 310 | **+2**, see industry-product | split across `product-configuration.md` + `product-configuration/industry-product.md` + `product-labels.md`; several children (`cash-loan`, `credit-card`, `display-information-set`) have **no dedicated coverage at their current size/architecture** |
| `exclusive-touch/` | 13 | 13 | yes | **none** — not mentioned in any `products/` document |
| `parameter/` | 51 | 51 | yes | split across `documents-and-contracts.md`, `fees.md`, `required-information.md` |
| `popular-loans/` | 13 | 13 | yes | `popular-loans.md` |
| `promotion-management/` | 69 | 69 | yes | only a one-row mention in `OVERVIEW.md`, pointing to an external sprint-1 report; no dedicated document for the module itself |
| `simulation/` | 42 | 42 | yes | `simulation.md` |

Sum: 19+13+312+13+51+13+69+42 = **532**, matching `find src/modules/products -type f | wc -l` exactly.

### `src/modules/products/configuration/` children

| Child | Files (fresh `find`) | Inventory report's figure | Match? | Current architecture (this session's finding) |
| --- | --- | --- | --- | --- |
| `card-gift-offer/` | 10 | 10 | yes | local React state + `mock-data.ts`, unchanged |
| `cash-loan/` | 31 | 31 | yes | **own `hooks/`, `queryKeys/`, `services/`** — TanStack-Query-owned, not the `list-product/`-based Redux flow `product-configuration.md` describes |
| `components/CashLoanCatalogModal/` | 5 | 5 | yes | shared modal, reused outside the label folder per `product-labels.md` |
| `credit-card/` | 30 | 30 | yes | same shape change as `cash-loan/`, not independently re-confirmed file-by-file in this pass but directory structure matches |
| `display-information-set/` | 17 | 17 | yes | own `hooks/`, `queryKeys/`, `services/`, `mappers.ts` — also TanStack-Query-shaped, has no dedicated document at all |
| `group-list-product/` | 22 | 22 | yes | state ownership not re-confirmed this pass (`NEEDS-VERIFICATION`) |
| `industry-product/` | **32** | 30 | **+2** | see "Count re-verification"; architecture claims in `industry-product.md` (Redux-slice-as-endpoint-catalog) were not contradicted by anything found in this pass |
| `installment-loan/` | 1 | 1 | yes | — |
| `product-labels/` | 78 (cash-loan 17, credit-card 16, shared 38, +7 direct) | 78 | yes | list/detail still keyed-Redux-cache per `product-labels.md`, but see row 3 above — `product-labels.slice.ts` itself no longer exists; the keyed-cache claim needs re-verification against whatever replaced it |
| `required-information/` | 12 | 12 | yes | — |
| `required-information-set/` | 11 | 11 | yes | — |
| `scheme-sync/` | 63 | 63 | yes | its `import/` child has drifted structurally from `scheme-sync-import-plan.md`, see row 9 |

Sum: 10+31+5+30+17+22+32+1+78+12+11+63 = **312**, matching `find src/modules/products/configuration -type f | wc -l` exactly, confirming the industry-product +2 is the sole source of the module-level +2 drift.

### `src/modules/products/promotion-management/` children (new breakdown, not previously documented at this level)

| Child | Files | Notes |
| --- | --- | --- |
| `promotion/` | 41 | **Not mentioned anywhere in `docs/modules/products/`.** This is the single largest undocumented unit found in this reconciliation pass. |
| `promotion-type/` | 26 | Partially covered by `OVERVIEW.md`'s one-row summary and an external sprint-1 report; grew from 9 files (2026-10-21) to 26. |
| `queryKeys/` (shared) | 1 | — |
| `types/` (shared) | 1 | — |

Sum: 41+26+1+1 = 69, matching the top-level figure.

## Step 3 — Proposed follow-up documentation order (not executed in this session)

Ordered smallest/most-isolated first, per the same per-submodule-or-cluster
model already used for `contents/BANNER.md`, `users/SEGMENTATION.md`, and the
`system/` wave. None of the runs below were started; this is a plan only.

1. **`popular-loans/` (13 files) — reconcile `popular-loans.md` in place.**
   Smallest, most isolated, feature-local-only (no Redux, no cross-domain
   consumers found). Row 10-class risk is low. Expected outcome: light-touch
   confirmation pass, likely few or no changes needed.

2. **`add-on/` (19 files) — reconcile `add-ons.md` in place.**
   Small, single Redux slice, well-contained. Main coupling risk: add-on
   distribution options are consumed by `users/affiliate-partner/` (confirmed
   this pass — `addon-product-form.tsx` imports add-on data) and vice versa;
   that cross-domain edge needs restating accurately rather than rewritten
   from scratch.

3. **`card-gift-offer/` (10 files, inside `configuration/`) — reconcile
   `card-gift-offers.md` in place.**
   Small and isolated; main risk is confirming the mock-only persistence
   claim is still exactly true (not re-verified beyond the file's continued
   existence in this pass) and whether `CardGiftLoan`'s relationship to the
   real credit-card product promotion payload has changed.

4. **`exclusive-touch/` (13 files) — new document, no existing coverage.**
   Already shows `hooks/`, `queryKeys/`, `services/`, `views/` — i.e. it
   looks TanStack-Query-shaped by directory structure alone (not confirmed by
   content in this pass). Main coupling risk: unknown, since nothing has
   ever documented this submodule; a first pass needs to establish its scope
   before any coupling claim can be made.

5. **`attractive-offer/` (13 files) — new document, no existing coverage.**
   Same situation as `exclusive-touch/`: never documented. Directory shape
   (`api-mappers.ts`, `edit/`, `view/`, `navigation.ts`, `types.ts`) looks
   closer to the `popular-loans/` feature-local pattern than to a
   Query-owned or Redux-owned pattern, but this is an unverified first
   impression from directory listing only, not file content.

6. **`fees/` (`parameter/fee`, 9 files) — reconcile `fees.md` in place.**
   Small, single slice, well-contained. Main coupling risk (already
   correctly documented): `src/utils/form.ts` imports fee options, and
   shared import infrastructure invokes fee import actions — restate rather
   than rediscover.

7. **`required-information/` + `required-information-set/` (12 + 11 = 23
   files, inside `configuration/`) — reconcile `required-information.md` in
   place.**
   Already covers both coupled submodules in one document; keep that
   pairing. Main coupling risk (already documented): consumed by
   customer-segmentation and order code outside `products/` — restate rather
   than rediscover.

8. **`documents-and-contracts/` cluster (`group-document-list` 8 +
   `document-list` 9 + `document-set` 9 + `contract-termplate` 14 = 40 files,
   inside `parameter/`) — reconcile `documents-and-contracts.md` in place.**
   Medium size, four slices. Main coupling risk (already documented):
   notifications imports `returnStatusForm` from `contract-termplate/`,
   products/group config consume document sets and contract templates as
   reference data — restate and re-verify the duplicate-route finding is
   gone (already confirmed in this pass, row 4) rather than leaving it as an
   open risk in the rewritten document.

9. **`simulation/` + `display-order` cluster (42 files) — reconcile
   `simulation.md` in place.**
   Medium size, two slices (`simulationSlice`, `cardPackageSlice`). Main
   coupling risk (already documented): shares product/group catalogs as
   reference data; a "local" target-shape change can affect core product
   state — restate rather than rediscover.

10. **`promotion-management/` (69 files: `promotion/` 41 + `promotion-type/`
    26) — new document(s), replacing `OVERVIEW.md`'s one-row summary.**
    This is the largest fully-undocumented unit found in this pass
    (`promotion/`, 41 files, has never been described at all). Decide during
    that run whether `promotion/` and `promotion-type/` are one coupled
    document or two — they share a `queryKeys/`/`types/` root, which argues
    for one document unless `promotion/`'s scope turns out to be
    substantially larger than list/create/view, as `promotion-type/`'s
    growth from 9→26 files already suggests it might be. Main coupling risk:
    unknown — this submodule has had zero prior documentation to carry
    forward, and the former `auth.slice.ts` permission-grant workaround
    (confirmed resolved in this pass, row 11) needs its resolution
    mechanism established as part of this run, not assumed.

11. **`scheme-sync/` (63 files) — reconcile `scheme-sync-import-plan.md`
    (replace with a proper module document; the plan document itself should
    likely be folded into the new document or retired as a historical
    artifact, per `docs/README.md`'s note that a reconciliation pass would
    decide this) plus `products-loan-excel-import-api.md` (a backend-contract
    reference document, likely stays mostly as-is since it describes an API
    contract, not frontend file structure — confirm during that run whether
    it still matches the BE contract actually wired up in
    `scheme-import.service.ts`/hooks, which this pass did not check).**
    Main coupling risk (already confirmed in this pass, row 9): the `import/`
    subfeature's actual structure diverges substantially from the approved
    plan — this is the clearest case in the whole module where the existing
    document actively misleads about current file layout, not just about
    counts.

12. **`cash-loan/` + `credit-card/` product CRUD, as part of a
    `product-configuration/` rewrite (31 + 30 = 61 files, inside
    `configuration/`) — replace the relevant portions of
    `product-configuration.md`; keep `industry-product.md` as-is pending its
    own smaller re-check (±2 files, row/count 2 above) since its content was
    not contradicted by anything found in this pass.**
    This is the **highest-priority** run by evidence severity, not by size:
    it is the only submodule where this reconciliation pass found the
    *current architecture itself* (TanStack Query + feature services) to
    contradict the existing document's architecture description (Redux +
    `list-product/utils.tsx`) outright, rather than finding a stale count or
    a resolved risk. Main coupling risk: `productListSlice` is still
    registered in `src/redux/slices.ts` with an unclear current consumer set
    (row 8, `NEEDS-VERIFICATION`) — establishing whether it is dead,
    partially retained, or serving a different screen must be the first
    thing that run does, since every other finding in this cluster depends
    on knowing that. `display-information-set/` (17 files, same directory
    level, same architecture shape) should very likely be folded into this
    same run rather than split out, since it appears to be the same
    migration pattern applied to a smaller sibling feature.

13. **`group-list-product/` (22 files) — reconcile or fold into the same run
    as #12**, since product groups share the same `configuration/` level and
    the same reference-data coupling (segmentation, add-ons, document sets)
    that the cash-loan/credit-card rewrite will already be re-establishing.
    Decide during #12 whether this needs its own numbered run or is small
    enough to absorb into it.

14. **`product-labels/` (78 files) — reconcile `product-labels.md` in
    place**, specifically re-verifying row 3 above (whether
    `product-labels.slice.ts`'s absence changes the "Redux owns keyed
    list/detail cache" claim, or whether that claim was already describing
    something else that still exists under a different file). This is
    ordered late because it is the largest single document and its core
    risk (custom route gate, dual local/Redux-shaped ownership) is already
    well-understood and lower-urgency than the cash-loan/credit-card
    architecture contradiction in #12.

Not included above: the two report-shaped files under
`product-configuration/` (feasibility/impact analyses) — per
`docs/README.md`, a future reconciliation pass (this one, in part) decides
whether each becomes a dated report, gets folded into a module document, or
stays as-is; that decision is explicitly out of scope for this reconciliation
report and is left to whoever runs the `product-configuration.md` rewrite in
#12, since they will have the most current read of that area.
