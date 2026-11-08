# Promotion-management `promotion-type.service.ts` basename collision

Static analysis only (read-only investigation, no files changed, `typecheck` not run). 2026-10-30.

Base path: `src/modules/products/promotion-management/`. In this report, "parent
service" means `services/promotion-type.service.ts` and "child service" means
`promotion-type/services/promotion-type.service.ts`.

## Evidence

### E1. Parent service, `services/promotion-type.service.ts` (51 lines)

- Header comment says it was "Moved from `promotion-type/services/promotion-type.service.ts` (M9)".
  It adds that `promotion/` consumes it too (an unlimited-size fetch for its
  category filter). It also says the write endpoints (create/update/toggle-status)
  and the by-id getter "stay in `promotion-type/services/`".
- `const BASE_PATH = 'api/admin/portal/v1/offer-types'`.
- Private helpers: `requirePromotionTypeApiResponse` (throws `TypeError` on a
  null response) and `appendQueryParams`.
- Only export: `getPromotionTypes(params = {}, signal?)`.
  - Sends GET `offer-types?keyword&status&page&size&sort`. The wire key
    `sort` is fed from the internal field `params.orderBy`.
  - Types come from `../types/promotion-type.types`
    (`PromotionTypeListQueryParameters`, `PromotionTypePagedResponse`).
  - Calls `window.apiFetcher.get(endpoint, { signal })`.

### E2. Child service, `promotion-type/services/promotion-type.service.ts` (71 lines)

- `const BASE_PATH = 'api/admin/portal/v1/offer-types'` — same literal as the
  parent. Carries its own private copy of `requirePromotionTypeApiResponse`.
- Exports:
  - `getPromotionTypeById(id, signal)`: GET `offer-types/{id}`.
  - `updatePromotionType(id, request, signal)`: PUT `offer-types/{id}`.
  - `createPromotionType(request, signal)`: POST `offer-types`.
  - `togglePromotionTypeStatus(id, request, signal)`: PUT `offer-types/{id}/status`.
  - `getOfferCategories(signal)`: GET `api/admin/portal/v1/offer-types/lookup`.
    Comment: "Parked here unused (M9) ... Not wired to any consumer ... Do not
    call this without first confirming the real response shape."
- Types: write DTOs and `OfferCategoryOption` from `../types/promotion-type.types`.
  `PromotionTypeResponse` comes from the parent's `../../types/promotion-type.types`.

### E3. Imports of the parent service

Grep over all of `src/**/*.ts(x)` — only two importers exist anywhere in the repo.

- `promotion-management/queryKeys/promotion-type.query-keys.ts:2`:
  `import { getPromotionTypes } from '../services/promotion-type.service';`
- `promotion-management/promotion-type/queryKeys/promotion-type.query-keys.ts:6`:
  `import { getPromotionTypes } from '../../services/promotion-type.service';`
  - Comment on lines 4-5: "`getPromotionTypes` moved to the shared service
    (M9); import it from there instead of this module's own `services/`
    folder."

### E4. Imports of the child service

- `promotion-type/queryKeys/promotion-type.query-keys.ts:3`:
  `import { getPromotionTypeById } from '../services/promotion-type.service';`
- `promotion-type/hooks/promotion-type.queries.hook.ts:3-7`:
  ```
  import {
    createPromotionType,
    togglePromotionTypeStatus,
    updatePromotionType
  } from '../services/promotion-type.service';
  ```
- Other mentions are comments only: `promotion-type/types/promotion-type.types.ts:29-32`,
  and the parent service's header comment.
- Nothing outside `promotion-management/` imports either service.

### E5. Exactly what each queryKeys file imports

- `promotion-management/queryKeys/promotion-type.query-keys.ts`:
  - imports `queryOptions` from `@tanstack/react-query`;
  - imports `getPromotionTypes` from the parent service;
  - its `queryFn` is `getPromotionTypes({ page: 0, size: UNLIMITED_PAGE_SIZE }, signal)` (line 21);
  - redefines `LIST_QUERY_STALE_TIME_MS = 60_000` locally — a comment notes
    the same constant is defined independently in `promotion/constant.ts`
    and `promotion-type/constant.ts`.
- `promotion-type/queryKeys/promotion-type.query-keys.ts`:
  - imports `keepPreviousData` and `queryOptions` from `@tanstack/react-query`;
  - imports `DEFAULT_LIST_PAGE_SIZE` and `LIST_QUERY_STALE_TIME_MS` from `../constant`;
  - imports `getPromotionTypeById` from the CHILD service (line 3);
  - imports `getPromotionTypes` from the PARENT service (line 6);
  - `list(params)` calls `getPromotionTypes(params, signal)` (line 25);
    `detail(id)` calls `getPromotionTypeById(id, signal)` (line 33).

### E6. `promotion/services/promotion.service.ts` (153 lines)

- `BASE_PATH = 'api/admin/portal/v1/offers'`, with a "DRAFT: resource path is
  a guess; no swagger exists yet" comment.
- Has its own copies of `requireOfferApiResponse` and `appendQueryParams`,
  and `UNLIMITED_PAGE_SIZE = 9999`.
- Imports `OFFER_IMAGE_UPLOAD_CONTEXT` from `../constant` and types from
  `../types/promotion.types`.
- Exports:

| Function | Method and path | Notes |
|---|---|---|
| `getOffers` | GET `offers?search&displayStatus&offerTypeId&page&size&sort` | |
| `getOfferDetail(id)` | GET `offers/{id}` | |
| `createOffer` | POST `offers` | |
| `updateOffer(id, ...)` | PUT `offers/{id}` | |
| `getOfferHistory(id, params)` | GET `offers/{id}/history?page&size` | |
| `getGiftCardOptions` | GET `api/admin/portal/v1/products/search` | query is `{page:0,size:9999,productLineCode:'CD',status:'ACTIVE'}`. Items mapped to `{id,code,name,status}`; non-ACTIVE status becomes `INACTIVE`. |
| `getProductGiftLinks(productLineCode)` | GET `offers/product-gift-links?productLineCode&page=0&size=9999` | |
| `uploadOfferImage(file)` | POST `api/admin/file` | multipart with a `metadata` blob; throws if `upload.key` is empty. |

### E7. `promotion/services/index.ts`

- Re-exports `getOffers, getOfferDetail, createOffer, updateOffer, getOfferHistory, getGiftCardOptions, getProductGiftLinks, uploadOfferImage` from `./promotion.service`. Matches the expected barrel.
- Every `promotion.service.ts` export is re-exported, nothing extra.

### E8. Consumers of `promotion.service.ts` and `services/index.ts`

Grep over all of `src`.

- `promotion.service.ts` is imported only by the barrel:
  `promotion/services/index.ts:10` (`} from './promotion.service';`).
- The barrel is imported by exactly two files:
  - `promotion/queryKeys/promotion.query-keys.ts:3`:
    `import { getGiftCardOptions, getOfferDetail, getOfferHistory, getOffers, getProductGiftLinks } from '../services';`
  - `promotion/hooks/promotion.queries.hook.ts:3`:
    `import { createOffer, updateOffer, uploadOfferImage } from '../services';`
- Every symbol in the barrel is used by those two importers. Nothing outside
  `promotion/` imports either file.
- Nothing is imported from `promotion-management/services/` except via the
  two parent-service importers in E3.

## Inference

### I1. Relationship between the two `promotion-type.service.ts` files

- Not near-duplicates; neither wraps nor supersedes the other. Exported
  functions are disjoint and complementary:
  - Parent: the one list call.
  - Child: by-id GET, create, update, status toggle, and the unused lookup.
- Duplicated parts are only boilerplate: the same `BASE_PATH` literal and the
  same private null-guard helper. `BASE_PATH` is a drift risk — a future
  endpoint rename must be applied in two files.
- The split was deliberate, from milestone M9, which moved the list call up
  to the parent because `promotion/` also consumes the list (per code
  comments). `promotion/` reaches it via the parent-level
  `queryKeys/promotion-type.query-keys.ts`; no file under `promotion/`
  imports either service directly.
- **Correction to the prior finding**: the child's own query-key factory
  imports BOTH services — the child service for `getPromotionTypeById`, and
  the PARENT service for `getPromotionTypes`. The parent service's consumers
  are exactly the two queryKeys files previously named, so that part is
  confirmed.

### I2. Is the child service dead code?

No. Four of its five exports are live.
- Consumers: `promotion-type/queryKeys/promotion-type.query-keys.ts`
  (`getPromotionTypeById`) and `promotion-type/hooks/promotion-type.queries.hook.ts`
  (create, update, toggle).
- Only `getOfferCategories` is unused. Its own comment says it is parked, and
  no importer references it. It is removable dead code, but that is a
  separate decision from the basename collision.

### I3. Migration scoping

- Under the flat `src/services/products/` target layout, the two files
  cannot share a basename.
- Both sit in the same sub-module family and both target `offer-types`. The
  migration has to rename at least one file and update 4 import lines: the
  two queryKeys files, one hook, and the child queryKeys' second import.
- `promotion.service.ts` has no collision. Under the flat layout it needs a
  distinct name only if another `promotion*.service.ts` appears.
  - Only 2 importers, both reaching it through the barrel.
  - Per-sub-module barrels are `LEGACY-COMPATIBILITY`; a single
    `src/services/index.ts` would replace them and repoint those 2 imports.
- `src/services/` may import types and constants from `src/modules/**` but
  must not import `queryKeys/`. All three services comply — they import
  only types and constants.

### I4. Candidate disambiguating names (for a human decision — nothing renamed)

Parent file (list-only, read-only lookup shared with `promotion/`):
1. `promotion-type-list.service.ts` — exposes only the paged list endpoint.
2. `promotion-type-lookup.service.ts` — a read-only fetch consumed across
   sub-modules, including `promotion/`'s category filter.

Child file (by-id read plus the create/update/status write endpoints):
1. `promotion-type-crud.service.ts` — holds the by-id GET, POST, PUT and
   status-toggle operations.
2. `promotion-type-mutation.service.ts` — mostly write endpoints, but also
   contains the by-id GET, so slightly less accurate.

Suggested pairing: `promotion-type-list.service.ts` plus
`promotion-type-crud.service.ts`. Both keep the `<domain>.service.ts`
suffix, and the pair makes visible that they are two halves of one
`offer-types` resource.

- Alternative: merge both into one `promotion-type.service.ts`, since both
  target the same resource. This would be a design change, not a rename,
  and would need the cross-submodule ownership question settled first
  (`NEEDS-TEAM-DECISION`). Not recommended here.
- The sub-module-prefix style suggested elsewhere would not disambiguate
  here — both files belong to the `promotion-type` sub-module, so a prefix
  gives no separation.

### I5. Other findings

- `promotion.service.ts`'s `offers` endpoints are flagged in its own comment
  as a guessed path with no swagger — `NEEDS-VERIFICATION` for backend
  correctness, unrelated to the collision.
- Duplicated helpers (`requireXApiResponse`, `appendQueryParams`) exist in
  3 service files. This is local duplication only; not recommended for
  consolidation during the move.

### Preserve during any migration

- The `offer-types` paths and methods.
- The `orderBy` → `sort` wire mapping.
- The `AbortSignal` forwarding.
- The `queryKeys` → service dependency direction.

### Risk

SAFE to MODERATE. The change is isolated to one module's query keys, hook,
and services, with no cross-module consumers. The module is Query-owned, so
there are no Redux, route, or permission effects. There is no test runner in
this repo, so `typecheck` plus manual list/create/edit/toggle checks are the
only available validation.
