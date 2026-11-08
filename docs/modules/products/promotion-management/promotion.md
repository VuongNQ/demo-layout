# Promotion (Offer) — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

New document; `src/modules/products/promotion-management/promotion/` (41
files, confirmed via `find ... -type f | wc -l`) previously had no
documentation anywhere — it was not mentioned in
`docs/modules/products/OVERVIEW.md`, and the only prior documentation of
`promotion-management/` covered `promotion-type/` alone (an external,
now-stale Sprint-1 report). This module is the backend's `offers` resource,
labelled "Ưu đãi sản phẩm" (product offer) in the UI. Split decision and
justification for documenting this separately from
[`promotion-type.md`](promotion-type.md) are in
[`../promotion-management.md`](../promotion-management.md) §0.

**Verification-gap limit (top 5; remainder in §15):**

1. The base path `api/admin/portal/v1/offers` is marked
   `// DRAFT: resource path is a guess` in source
   (`src/services/products/promotion.service.ts:15`), yet a separate report
   (`docs/reports/2026-10-27/offer-api-reconciliation.md:47,196`) records a
   real capture confirming `GET .../offers/{id}/history` — so the comment is
   stale for at least the history endpoint. Whether the other six endpoints
   under this base path are equally confirmed or still a guess is
   **NEEDS-VERIFICATION**.
2. Create and edit upload the offer image before the create/update request
   (`views/PromotionCreatePage/index.tsx:60,66`;
   `views/PromotionEditPage/index.tsx:140,146`). A backend rejection of the
   create/update request after a successful upload leaves an orphaned
   uploaded file — **NEEDS-VERIFICATION** whether the backend reconciles or
   garbage-collects unreferenced uploads.
3. The multipart upload sets an explicit `Content-Type: multipart/form-data`
   header without a boundary parameter
   (`src/services/products/promotion.service.ts:144`) —
   **NEEDS-VERIFICATION** whether the underlying HTTP client sets the
   boundary itself or whether this is a latent upload-failure risk.
4. `views/PromotionListPage/index.tsx:50-53` reads the `?offerTypeId=` query
   parameter only once on mount. Whether an in-app navigation to this list
   while it is already mounted (e.g. from the promotion-type drawer's deep
   link, see `../promotion-management.md`) re-applies a new `offerTypeId`
   filter is **NEEDS-VERIFICATION**.
5. `components/OfferForm`'s `offerProductType` field is editable on create
   (`:212-229`) but omitted from `utils/offer-dirty.helper.ts`'s
   `DIRTY_FIELDS` (`:6-16`), so a change to it alone would not register as
   dirty. Currently latent because CARD is the only selectable option and
   the default — **NEEDS-VERIFICATION** whether more options are planned,
   which would make this reachable.

## 1. Responsibility

Full CRUD (list, create, view, edit — **no delete**) for product offers at
`/product/promotion-management/promotion/**`. Each offer belongs to a
promotion-type (category) by `offerTypeId` (a foreign-key-style reference,
not an import), has a `mechanism` that is backend-derived and read-only on
the frontend, gift cards/products, an `offerProductType` (CD/CL), a priority,
a time window, a status, an optional image, and a history tab. Status is not
a separate action — it is a field on the same create/edit form, saved via the
same PUT/POST, unlike `promotion-type/`'s dedicated status-toggle switch.

## 2. Entry points and routes

All four routes are declared in `src/routes/main.routes.tsx:307-329` (not
`src/routes/index.tsx`, which is a shell, and not `form.routes.tsx`), each
`WithGuard` + `AuthGuard` with a single-element permission array — none is an
OR array or a helper-resolved check.

| Action | Path | Route line | Lazy page (`pages.tsx`) | Permission |
| --- | --- | --- | --- | --- |
| List | `/product/promotion-management/promotion` | `:307-311` | `PromotionListPage` (`:215`) | `PRODUCT_PROMOTION_VIEW` |
| Create | `.../promotion/create` | `:313-317` | `PromotionCreatePage` (`:218`) | `PRODUCT_PROMOTION_CREATE` |
| View | `.../promotion/view/:id` | `:319-323` | `PromotionViewPage` (`:221`) | `PRODUCT_PROMOTION_VIEW` |
| Edit | `.../promotion/edit/:id` | `:325-329` | `PromotionEditPage` (`:224`) | `PRODUCT_PROMOTION_EDIT` |

`PageURLs` builders at `src/utils/navigate.ts:313-323`. Menu entry:
`src/helpers/menus.helper.ts:347-350` (`Menu.promotion`, single permission
`PRODUCT_PROMOTION_VIEW`), nested under a parent "Menu.promotionManagement"
group whose own link points at the promotion-type list
(`:335-339` — see `promotion-type.md` §2).

**Component-level checks** (each a single-element array, default `some`
semantics):
- `views/PromotionListPage/index.tsx:42` (`PRODUCT_PROMOTION_CREATE`) and
  `:43` (`PRODUCT_PROMOTION_EDIT`, hides the row-level edit icon at `:156`).
- `views/PromotionViewPage/index.tsx:28` (`PRODUCT_PROMOTION_EDIT`), also
  gated on `isValidId` (`:45`).
- `PromotionCreatePage` and `PromotionEditPage` have **no** component-level
  permission check beyond the route guard.

**Deep-link coupling (one-way, from `promotion-type/`):**
`views/PromotionListPage/index.tsx:50-53` reads `?offerTypeId=` on mount,
produced by `promotion-type/`'s detail drawer
(`usePromotionTypeDetailDrawer.hook.tsx:170`) — see §0 item 4 and
`promotion-type.md` §2.

## 3. Directory map (41 files)

| File/folder | Responsibility |
| --- | --- |
| `constant.ts` | Status/mechanism/product-line/sort/limit constants; `OfferDisplayStatus` with unused Vietnamese literal labels (dead, §13); `OFFER_TRACKED_FIELDS`, `OFFER_HISTORY_ACTION` (dead, §13) |
| `views/PromotionListPage/` | Filtered, paginated list with a card-codes cell |
| `views/PromotionCreatePage/` | Create form, Zod validation, submit, navigation guard |
| `views/PromotionEditPage/` | Loads detail, renders `EditContent` keyed by id, frozen baseline, save |
| `views/PromotionViewPage/` | Detail header (back/edit actions) + `OfferDetailTabs` |
| `components/OfferForm/` | Shared AntD form (create and edit), 9 fields + status |
| `components/OfferDetailTabs/` | Info / display-places / history tabs |
| `components/OfferScopePreviewTable/` | Gift-link preview from `productGiftLinks` |
| `components/GiftCardMultiSelect/` | Card picker from `giftCardOptions`; only component in the directory using Emotion `css` instead of SCSS Modules (§13) |
| `components/PromotionFilterBar/` | Keyword/status/category filters; reads the shared root-level promotion-type lookup |
| `components/PromotionImagePicker/` | Image picker with client-side validation |
| `components/OfferCell`, `components/OfferStatusToggle` | Small presentational pieces |
| `hooks/promotion.queries.hook.ts` | Upload, create, and update mutations |
| `hooks/useOfferNavigationGuard.hook.tsx` | Unsaved-changes guard built on the browser `window.navigation` API (no `beforeunload` fallback) |
| `hooks/useDebouncedOfferSearch.hook.ts` | Debounced keyword search |
| `queryKeys/promotion.query-keys.ts` | `promotionQueryKeys`, colocated `queryOptions`, imports fetchers from `@/services/products` |
| `types/promotion.types.ts` | Re-exports DTOs from `@/services/products`; local `OfferFormValues`, `OfferScopeRow`, unused `OfferValidationError` (dead, §13) |
| `utils/promotion.mapper.ts` | DTO ↔ form mapping |
| `utils/promotion-offer-create.validation.ts`, `utils/promotion-offer-edit.validation.ts` | Zod create/edit schemas |
| `utils/promotion-api.error.ts` | Backend error codes → AntD field errors |
| `utils/offer-dirty.helper.ts` | Dirty-field count (omits `offerProductType`, §0 item 5) |
| `utils/promotion-offer-form.defaults.ts`, `promotion-image.validation.ts`, `promotion.format.ts`, `promotion.display-status.ts`, `promotion.status-label.ts`, `promotion.mechanism-label.ts`, `promotion.product-type-label.ts`, `promotion.history-label.ts` | Small formatting/label/validation helpers |

No `services/` folder exists inside `promotion/` — the API layer lives
entirely at the target location, `src/services/products/promotion.service.ts`
(confirmed: `grep -rln apiFetcher` inside `promotion/` returns nothing).

## 4. Main runtime flows

### List

```text
views/PromotionListPage/index.tsx:58 useQuery(promotionQueryKeys.list({...}))
  -> filters/page as local state (:45-56); every filter change resets to page 1
  -> row click / view action -> navigate to the view route
  -> edit action (:162-164) -> navigate to the edit route
```

### View

```text
views/PromotionViewPage/index.tsx:33 useQuery(detail(id))
  -> OfferDetailTabs: info (:62), display-places (:139, select on the same cache entry), history (:298, history(id, params))
```

### Create

```text
views/PromotionCreatePage/index.tsx
  Form.useForm (:24)
  submit (:45-77): form.getFieldsValue(true) as OfferFormValues -> safeParseAsync (:48)
    -> form.setFields on Zod failure (:52)
    -> resolveOfferImageKey (upload, :60) -> createMutation.mutateAsync (:66)
    -> success: message.success + navigate to list (:67-68)
    -> API error: mapped to fields (:70-75)
```

### Edit

```text
views/PromotionEditPage/index.tsx
  detail query (:39); EditContent mounts only once loaded (:72-74); baseline frozen via useState (:89)
  Form.useForm (:88)
  save (:107-160): buildOfferEditFormSchema(baseline).safeParseAsync (:109)
    -> fresh category-lookup check: queryClient.query({...promotionTypeLookupQueryKeys.unlimited(), staleTime: 0}) (:120-123)
       confirms the selected category is still ACTIVE (:124-133)
    -> upload (:140) -> updateMutation.mutateAsync({id, payload}) (:146-149)
```

`queryClient.query(...)` (not `fetchQuery`) is the correct TanStack Query
v5.104.1 API — confirmed present in the installed
`@tanstack/query-core` package; not a defect despite looking unusual next to
`useQuery`.

### Status and delete

Status is a form field on the same create/edit submission
(`components/OfferForm/index.tsx:253-261`), not a separate mutation — unlike
`promotion-type/`'s dedicated toggle. There is no delete action anywhere in
this module (no delete hook, no delete endpoint, no delete permission).

## 5. State ownership

**CONFIRMED, no Redux shadow.** `grep -rln "redux/slices"
src/modules/products/promotion-management/promotion/` returns nothing. This
resource has exactly one owner, TanStack Query.

## 6. API boundaries

### Query-owned checklist (TEMPLATE.md content rule 15)

- **Key factory** (`queryKeys/promotion.query-keys.ts`): colocated
  `queryOptions`, not keys-only — it imports its fetchers directly from
  `@/services/products` (`:4-10`). This differs from most other Query-owned
  modules documented so far in `products/` (which use keys-only factories);
  it matches the shape `.claude/rules/03-api-service.md` names as the
  preferred shape for new/updated Query-owned features.
- **Does not import from a `services/` folder inside `promotion/`** — there
  is none; it imports from the target-location `src/services/products/`
  instead, which is itself target-compatible, not a deviation.
- **Queries and consumers:**

  | Key | `staleTime` | `placeholderData` | Consumers |
  | --- | --- | --- | --- |
  | `list` | `CACHE_STALE_TIME` (60s, `src/constants/common.constant.ts:14`), explicit | `keepPreviousData` | `PromotionListPage:59` (1) |
  | `detail` | `CACHE_STALE_TIME`, explicit, plus `refetchOnWindowFocus: true` | none | `ViewPage:33`, `EditPage:39`, `OfferDetailTabs:62,139` |
  | `history` | default (TanStack 0) | `keepPreviousData` | `OfferDetailTabs:299` (1) |
  | `giftCardOptions` | `CACHE_STALE_TIME`, explicit | none | `GiftCardMultiSelect:23` (1) |
  | `productGiftLinks` | `CACHE_STALE_TIME`, explicit | none | `OfferForm:53`, `OfferScopePreviewTable:19` (2) |

  Plus the shared root-level `promotionTypeLookupQueryKeys.unlimited()`
  (`../../queryKeys/promotion-type.query-keys.ts:15-21`, `staleTime:
  CACHE_STALE_TIME`), consumed by `OfferForm:50`, `PromotionFilterBar:35`,
  and `PromotionEditPage:121` (the last with an overriding `staleTime: 0` for
  save-time freshness).

- **Mutations** (`hooks/promotion.queries.hook.ts`):
  - `useUploadOfferImageMutation` (`:7-12`): no invalidation, `retry: false`.
  - `useCreateOfferMutation` (`:15-23`): `onSuccess` awaits
    `invalidateQueries({ queryKey: lists() })`.
  - `useUpdateOfferMutation` (`:26-44`): `onSuccess` awaits `Promise.all`
    over `detail(id)`, `lists()`, and `historyById`/`history` prefix
    (`:33-40`).
  - No `setQueryData` anywhere in this module — every cache sync is via
    invalidation.
  - `giftCardOptions`/`productGiftLinks` are not offer-owned resources and
    are correctly not invalidated by offer mutations.

### Service (`src/services/products/promotion.service.ts`)

Base path `BASE_PATH = 'api/admin/portal/v1/offers'` (`:16`, with a `// DRAFT:
resource path is a guess` comment that is stale for at least the history
endpoint — see §0 item 1).

| Function | Method/endpoint |
| --- | --- |
| `getOffers` | `GET offers?search&displayStatus&offerTypeId&page&size&sort` |
| `getOfferDetail` | `GET offers/{id}` |
| `createOffer` | `POST offers` |
| `updateOffer` | `PUT offers/{id}` |
| `getOfferHistory` | `GET offers/{id}/history` (confirmed by real capture, `docs/reports/2026-10-27/offer-api-reconciliation.md:47,196`) |
| `getGiftCardOptions` | `GET products/search?page=0&size=9999&productLineCode=CD&status=ACTIVE` |
| `getProductGiftLinks` | `GET offers/product-gift-links?productLineCode&page=0&size=9999` |
| `uploadOfferImage` | `POST api/admin/file`, multipart (`file` + `metadata`), explicit `Content-Type: multipart/form-data` header with no boundary parameter (§0 item 3) |

All via `window.apiFetcher`/`ApiFetcher`; no direct axios/fetch. Runtime
validation (`requireOfferApiResponse`) checks only for a non-null response,
consistent with the stable-CRUD typed-DTO default — not itself a gap.

## 7. Forms and validation

Two `Form.useForm` sites, both typed `OfferFormValues`:
`views/PromotionCreatePage/index.tsx:24` and
`views/PromotionEditPage/index.tsx:88`. Zod is used explicitly via
`safeParseAsync` at submit (Create `:48`, Edit `:109`) —
`utils/promotion-offer-create.validation.ts` and
`utils/promotion-offer-edit.validation.ts` are the only Zod imports in the
directory; no AntD `rules` exist on `OfferForm`'s fields. Issues map through
`mapOfferCreateZodIssuesToAntdErrors`/equivalent to `form.setFields`.
Cross-field validation: a backend error code (111,
`isEffectiveRangeInvalid`) is checked on every save; a separate
"end date in the future" check in the edit schema runs only when
`effectiveTo` actually changed from the frozen baseline. Root-level Zod
issues with no field path are silently dropped by the mapper
(`create validation:115-116`) — currently unreachable since every
`superRefine` issue in this schema carries a path, but worth noting as a
structural gap (§13).

## 8. Types and DTO organization

`types/promotion.types.ts` contains no duplicate DTOs — it re-exports from
`src/services/products/promotion.types.ts` (the canonical DTO location) and
adds only local, form-specific types (`OfferFormValues`, `OfferScopeRow`,
and an unused `OfferValidationError`, §13). No overlap with the sibling
`promotion-management/types/promotion-type.types.ts` root file — confirmed
no import from it anywhere in `promotion/`. The relationship to
promotion-type is purely by ID (`offerTypeId: number`) plus an embedded
read-only `OfferTypeSummary` on the response (`offer.offerType.id`,
`offer.offerType.mechanism`); `promotion/` never imports a promotion-type
component or type.

## 9. Permissions

Three constants, below the content-rule-9 table threshold:
`PRODUCT_PROMOTION_VIEW`/`_CREATE`/`_EDIT` (`src/constants/permission.constant.ts:177-179`,
string values `offer:view`/`offer:create`/`offer:edit`). These are entirely
separate from `promotion-type/`'s `PROMOTION_MANAGEMENT_*` constants — see
`../promotion-management.md` §0 for confirmation this separation is
intentional, not an oversight. Enforcement sites listed in §2. Every check is
a single-permission array (content rule 14 — none is an OR array or a
dynamic resolver).

## 10. Shared and cross-domain dependencies

- **Shared root-level lookup:** `../../queryKeys/promotion-type.query-keys.ts`
  (`promotionTypeLookupQueryKeys`), imported by relative path from
  `components/OfferForm/index.tsx:10`, `components/PromotionFilterBar/index.tsx:7`,
  and `views/PromotionEditPage/index.tsx:11` — see
  `../promotion-management.md` §1 for the full shared-file accounting.
- **Services layer:** `src/services/products/promotion.service.ts`,
  `promotion.types.ts`, imported via the `hooks/`/`types/`/`queryKeys/`
  files cited in §6/§8.
- **Reverse dependency (the allowed exception):**
  `src/services/products/promotion.service.ts:1` imports
  `OFFER_IMAGE_UPLOAD_CONTEXT` from `promotion/constant.ts` — a
  service-importing-from-its-owning-module constant, which
  `.claude/rules/01-architecture.md`'s service-location exception permits.
- No other `src/modules/**` import exists from `promotion/` — confirmed no
  segmentation, product-catalog, or add-on imports; `getGiftCardOptions` and
  `getProductGiftLinks` reach other product data over HTTP, not via module
  imports.
- Shared infrastructure: `@/hooks/auth.hook`, `@/hooks/modal.hook`,
  `@/constants/pagination.constant`, `@/constants/common.constant`,
  `@/components/*`.

## 11. Consumers

- Inbound: `src/routes/pages.tsx:215-225` (lazy pages),
  `src/utils/navigate.ts:313-323` (path builders),
  `src/helpers/menus.helper.ts:347-350` (menu link), and the one reverse
  service-constant import (§10).
- `promotion-type/` does **not** import anything from `promotion/`. The only
  coupling in that direction is the URL-parameter deep link (§2) and the
  shared permission constant `PRODUCT_PROMOTION_VIEW`, which
  `promotion-type/`'s detail drawer also checks to decide whether to show its
  own link into this module's list (see `promotion-type.md` §9).

## 12. Pattern classification

| Pattern | Classification |
| --- | --- |
| TanStack Query, colocated `queryOptions`, no Redux | `target-compatible` |
| Services/types at `src/services/products/` (target location from the start) | `target-compatible` |
| Zod with explicit `safeParseAsync`, AntD error mapping, no AntD `rules` | `target-compatible` |
| Image upload before create/update, no rollback on subsequent failure | deviation-class risk, recorded §13, not fixed |
| `GiftCardMultiSelect` using Emotion `css` beside SCSS-Module siblings | `legacy-compatible`-style inconsistency within a new module; recorded, not fixed |
| Unsaved-changes guard via the browser Navigation API, no `beforeunload` fallback | deviation-class risk, recorded §13 |

## 13. Technical risks

Ordered by decreasing consequence, per content rule 8.

- **Missing i18n keys for backend error messages.** Nine
  `PromotionManagement.promotion.apiError.*` keys referenced in
  `utils/promotion-api.error.ts` (lines 51, 70, 72, 78, 82, 84, 86, 88, 90)
  exist in **neither** `src/lang/vi.json` nor `src/lang/en.json` — those
  specific backend error codes would render the raw key path to the user.
  The other 124 literal keys in this module resolve correctly in both files.
- **Orphaned-upload risk on create/edit failure.** Image upload happens
  before the create/update request (§0 item 2); a backend rejection after a
  successful upload leaves an unreferenced file with no client-side cleanup.
- **Stale `// DRAFT` comment.** `src/services/products/promotion.service.ts:15`
  still marks the whole `offers` base path as a guess, even though the
  history endpoint is independently confirmed by capture (§0 item 1) — a
  future reader could distrust an endpoint that is in fact verified, or trust
  one that genuinely is not.
- **Zod validation messages built at module-load time.** The Zod schemas in
  both validation files call `t()` during module evaluation, not inside a
  render or validation callback — a runtime language switch would not update
  these messages until a full reload.
- **Latent dirty-tracking gap.** `utils/offer-dirty.helper.ts`'s
  `DIRTY_FIELDS` omits `offerProductType` (§0 item 5); currently unreachable
  since only one value is selectable, but would silently stop registering
  changes to this field the moment a second option is added.
- **Dead code.** `OfferValidationError` (`types/promotion.types.ts:65-70`),
  `OFFER_TRACKED_FIELDS`, and `OFFER_HISTORY_ACTION` (`constant.ts:87,97`)
  have zero consumers beyond their own definitions. `OfferDisplayStatus`'s
  Vietnamese literal labels (`constant.ts:56-63`) have no value consumers
  either — a different dead-code instance from the three above, not the
  same claim repeated.
- **Duplicated small logic.** `isNotFoundError` is defined identically in
  both `PromotionEditPage/index.tsx:26-33` and
  `PromotionViewPage/index.tsx:16-23`; `toFromIso`/`toToIso` in
  `utils/promotion.mapper.ts:24-32` are identical bodies;
  `getGiftCardOptions` repeats the literal `9999` and `'CD'` instead of
  reusing an existing unlimited-page-size constant.
- **Commented-out JSX.** `views/PromotionEditPage/index.tsx:191-192` has a
  block of commented-out code inside JSX, against the no-progress-comments
  rule in `.claude/rules/00-general.md` — recorded per content rule 10, not
  removed in this pass.
- **No-op discard handler.** `ChangeFormProvider onDiscard={() => undefined}`
  appears in both `PromotionCreatePage/index.tsx:91` and
  `PromotionEditPage/index.tsx:180` — intent unconfirmed, §15.
- **Deep-link filter applied only on mount.** §0 item 4.

## 14. Areas to avoid touching

- Do not assume the shared root-level `promotionTypeLookupQueryKeys` basename
  collision with `promotion-type/`'s own, separate query-key file is safe to
  "clean up" by renaming one without checking both files' actual export
  names and all import sites first (§0, `../promotion-management.md` §1) —
  the prefixes differ and nothing is broken today, but a careless rename
  could silently break the lookup's consumers in `promotion/`.
- Do not change the image-upload-before-save ordering as an incidental fix
  without first confirming with backend whether orphaned uploads are
  reconciled server-side; changing the order changes observable request
  timing and error-recovery behavior.
- Do not treat the nine missing i18n keys as safe to add without checking
  which backend error codes actually trigger them in practice.

## 15. Open questions

- The five verification gaps in §0.
- Whether `ChangeFormProvider`'s no-op `onDiscard` handlers in both
  create and edit pages are intentional (discard logic handled elsewhere) or
  an oversight.
- Whether root-level Zod issues with no field path (currently unreachable)
  are expected to stay unreachable, or whether a future schema change could
  surface one that gets silently dropped.
- Whether `GiftCardMultiSelect`'s Emotion `css` usage, as the only Emotion
  site in an otherwise SCSS-Module-styled new module, should be aligned —
  `NEEDS-TEAM-DECISION` if raised, not decided here.
