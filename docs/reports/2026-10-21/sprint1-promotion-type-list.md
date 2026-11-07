# Sprint 1 - Promotion Type List (UC #2091, F-01)

Branch `feature/vuongnq/loai-uu-dai_2091`. Risk: HIGH-RISK (routes, permissions, menu, `Menu.*` i18n). Basis: `docs/reports/2026-10-20-plan-promotion-type-crud.md`.

## 2026-10-21 addendum: temporary mock data (superseded below)

A request asked to apply a DTO/column correction ("priority, mechanism tag,
itemCount, maxItems, status" with an "RL2" rule and no
description/createdDate/updatedBy/updatedDate/version) before adding mock
data. That shape could not be located anywhere in this repo's docs for #2091
promotion-types at the time; the only lead I could find,
`docs/reports/2026-10-20-plan-promotion-mock-first.md`, is a draft plan for a
**separate ticket (#2498 "Promotion")**. Flagged to the user, who confirmed
(at that point) to keep the then-current #2091 DTO unchanged. Mock data was
built against that shape (`code, name, description, status, version,
createdBy, updatedBy, createdDate, updatedDate`).

## 2026-10-21 source-attribution correction (supersedes the addendum above)

The user corrected the record: the DTO/column correction was **never**
sourced from `2026-10-20-plan-promotion-mock-first.md` (#2498) - that
document is unrelated and was only a coincidental repo-local hit found while
I searched for a match. The actual, authoritative source is the backend's own
OpenAPI contract for **UC #2091 itself**,
`swagger_portal_promotion_types.yaml`, shared via chat and not checked into
this repository, so it could not have been found by searching the repo. My
"flag and ask" in the prior step correctly caught a real mismatch (the fields
did trace to a different ticket's doc in-repo), but the underlying correction
request was legitimate for #2091 all along, just sourced outside the repo.
Applying it now, literally, per the schema given:

```text
PromotionTypeResponse:
  id, code, name, description (nullable), iconUrl (nullable),
  productLineCode: 'CASH_LOAN' | 'CREDIT_CARD' | null,
  maxItems (nullable), priority, status: 'ACTIVE' | 'INACTIVE',
  itemCount, createdDate, updatedDate,
  createdBy (never null), updatedBy (never null)
  -- no `version` field (no optimistic-locking/ETag mechanism).
```

**Discrepancy flagged above, now resolved (2026-10-21 follow-up):** the
schema declares `priority: number` (no `| null`) because that applies to the
GET response specifically; only the PUT request body's `priority` is
nullable (empty admin input -> BE stores `999`). A saved record's GET/list
response always has a concrete `priority`. See "priority non-nullable
follow-up" below.

### Changes applied
- `types/promotion-type.types.ts` - rebuilt `PromotionTypeResponse` to the
  swagger shape: added `iconUrl: string | null`, `productLineCode:
  PromotionTypeProductLineCode | null`, `maxItems: number | null`, `priority:
  number | null` (see flagged discrepancy above), `itemCount: number`; removed
  `version`; `createdBy`/`updatedBy` changed from `string | null` to `string`
  (never null, per BE/JWT).
- `constant.ts` - added `PROMOTION_TYPE_PRODUCT_LINE_CODE` (`as const` +
  derived `PromotionTypeProductLineCode` union, no enum) and
  `PROMOTION_TYPE_PRIORITY_FALLBACK = 999` (RL2 display fallback).
- `mock-data.ts` - rebuilt all 17 entries against the corrected shape:
  `createdBy`/`updatedBy` always a real string (never null); no `version`
  field; `priority: null` on 5 entries (ids 3, 6, 10, 13, 16) to exercise the
  999 fallback; `maxItems: null` on 5 entries (ids 2, 5, 9, 12, 15) to
  exercise "Không giới hạn"; `itemCount: 0` on 5 entries and `> 0` on the
  rest; mixed `ACTIVE`/`INACTIVE`; `productLineCode` varying across
  `CASH_LOAN`/`CREDIT_CARD`/`null`; `iconUrl` mostly `null` with 3 populated.
- `components/PromotionTypeTableSection/index.tsx` - replaced the column set
  with the 7 columns in the specified order: priority (999 fallback when
  null), code, name, mechanism (hardcoded `Tag` with the fixed label, no
  backing field - commented `LEGACY-COMPATIBILITY` per plan section 4.3 point
  2), itemCount, maxItems ("Không giới hạn" when null), status (`StatusBadge`,
  unchanged). Removed the description/createdDate/updatedBy/updatedDate
  columns and their now-unused `dayjs`/`formatDateTime` helper (no column
  uses a date anymore in F-01).
- `src/lang/vi.json` / `src/lang/en.json`
  `PromotionManagement.promotionType.column.*` - replaced
  `code/name/description/status/createdDate/updatedBy/updatedDate` with
  `priority/code/name/mechanism/mechanismTag/itemCount/maxItems/
  maxItemsUnlimited/status` (9 leaves covering the 7 columns, since
  `mechanism` needs a header label plus its fixed tag text, and `maxItems`
  needs its own unlimited-display string). Confirmed identical key sets in
  both files via a flattened-key diff (see Re-validation).

Added purely as a FE-preview aid, following the repo's only precedent for a
feature-local mock array before BE exists:
`src/modules/products/configuration/card-gift-offer/mock-data.ts` (mock-only,
see `docs/modules/products/card-gift-offers.md` section 1).

- `src/modules/products/promotion-management/promotion-type/mock-data.ts`
  (new) - `mockPromotionTypes: PromotionTypeResponse[]`, 17 entries. Edge
  cases covered: `description: null` (x2), `createdBy`/`updatedBy: null`
  (several), mixed `ACTIVE`/`INACTIVE`, `version` 1-8, `createdDate`/
  `updatedDate` spanning 2025-01 to 2026-10, codes matching
  `^[A-Z0-9_]{3,20}$`. (This DTO has no `priority`/`maxItems` fields, so the
  plan's "priority null -> 999" / "maxItems null -> Không giới hạn" edge
  cases do not apply here - see addendum above.)
- `src/modules/products/promotion-management/promotion-type/services/promotion-type.service.ts`
  (changed) - added `const USE_MOCK_PROMOTION_TYPE_DATA = true;` at the top
  (comment: "TEMPORARY - remove once BE ships the real contract, see
  docs/reports/2026-10-20-plan-promotion-type-crud.md blockers #1/#4") plus
  three private helpers (`compareByOrderBy`, `getMockPromotionTypes`,
  `getMockPromotionTypeById`). `getPromotionTypes`/`getPromotionTypeById` each
  gained one `if (USE_MOCK_PROMOTION_TYPE_DATA) { return <mock helper>; }` as
  their first statement; the original `ApiFetcher` code below is byte-for-byte
  unchanged and unreachable only while the flag is `true`. The mock path does
  an in-memory filter (keyword against `code`/`name`, exact `status`), sort
  (`orderBy` as `field,direction`, default `createdDate,desc`), and
  page/pageSize slice, returning the same `{pageInfo, items}` shape. No
  `window.apiFetcher` call occurs in the mock path - confirmed by reading the
  final file (the only `apiFetcher.get` call sites remain in the two
  now-unreachable real branches).
- Signatures, exports, and the `queryKeys` factory are unchanged - verified by
  diff: only internal branching was added, no exported symbol changed shape.

**Flipping `USE_MOCK_PROMOTION_TYPE_DATA` to `false` restores the exact
pre-mock behavior**: the early-return `if` blocks become dead but harmless,
and execution falls through to the original `appendQueryParams` + `ApiFetcher`
code, unmodified. This is also the **only file with a mock branch** -
confirmed via `grep -rn "USE_MOCK\|mockPromotionTypes" src/modules/products/promotion-management/`,
which shows matches only in `mock-data.ts` and `promotion-type.service.ts`.
No view or component file was touched, so swapping to the real API later is
the one-line flag flip the request asked for.

### Re-validation
- `npm run typecheck` - pass (no output).
- `npx eslint <the two touched/added files> --max-warnings 0` - pass,
  `errorCount: 0` on both.
- `npx prettier --check` - clean after one `--write` pass on the new
  `mock-data.ts` (a long-line wrap only; no content change).
- `npm run build` - pass, only the pre-existing large-chunk warning.
- `git status --short` - exactly `promotion-type.service.ts` modified and
  `mock-data.ts` added by this change (plus the unrelated, pre-existing
  `auth.slice.ts` modification and the prior menu-correction files, untouched
  by this step).
- Not verified: the list page rendering the mock rows in a browser, pagination
  UX against the in-memory slice, and keyword/status filtering (no filter UI
  exists yet this sprint, so only the service-level logic was exercised by
  static reading, not a running filter).

### 2026-10-21 source-attribution correction - re-validation
- `npm run typecheck` - pass (no output, both tsconfigs).
- `npx eslint src/modules/products/promotion-management/promotion-type/ --max-warnings 0`
  - pass, `errorCount: 0` on every file in the module (component, constant,
  mock-data, queryKeys, service, types, utils).
- `npx prettier --check` on every touched/added file plus `vi.json`/`en.json`
  - "All files formatted correctly".
- `npm run build` - pass, only the pre-existing large-chunk warning.
- `git status --short` - exactly `types/promotion-type.types.ts`,
  `constant.ts`, `mock-data.ts` (untracked -> still untracked, content
  rewritten), `services/promotion-type.service.ts` (unchanged by this step,
  listed from the prior addendum), `components/PromotionTypeTableSection/index.tsx`,
  `src/lang/vi.json`, `src/lang/en.json` changed by this correction, plus the
  unrelated pre-existing `src/redux/slices/auth.slice.ts` and the earlier
  menu-correction's `src/helpers/menus.helper.ts`. No route/navigate/
  permission/service-flag file touched beyond what earlier steps already
  touched.
- i18n: flattened `PromotionManagement.promotionType.column.*` key sets in
  `vi.json`/`en.json` are identical (9/9 leaves: `priority, code, name,
  mechanism, mechanismTag, itemCount, maxItems, maxItemsUnlimited, status`).
  No leftover `description`/`createdDate`/`updatedBy`/`updatedDate` column
  keys remain; `createdDate`/`updatedBy`/`updatedDate` still exist only as
  DTO fields and the default sort key, not as rendered columns or lang keys.
- Grepped the module for `version` - zero remaining occurrences (type,
  service, mock data, and query-keys all confirmed free of it).
- Not verified: rendered table layout/column widths in a browser, the
  "Không giới hạn" fallback for `maxItems: null` rows.

## 2026-10-21 priority non-nullable follow-up

Correction to the swagger application above: `PromotionTypeResponse.priority`
is `number`, not `number | null`. Per swagger, only the PUT request body's
`priority` is nullable (an admin leaving the field empty on save maps to BE
storing `999`); the GET response's `priority` is never null, because a saved
record always has a concrete value. The "empty input -> 999" behavior belongs
to the create/update form mapper in a later sprint, not to list/detail
response data - list/detail mock data was wrong to model a `null` priority.

### Changes applied
- `types/promotion-type.types.ts` - `priority` reverted from `number | null`
  to `number`. Removed the inline "flagged discrepancy" comment, since the
  discrepancy is now resolved (GET vs PUT nullability differ by design, not
  by error).
- `mock-data.ts` - the 5 entries that had `priority: null` (ids 3, 6, 10, 13,
  16) now carry concrete values `13, 14, 15, 16, 17` instead. No entry models
  a null priority anymore; `maxItems: null` (5 entries) and `itemCount: 0`
  (5 entries) edge cases are untouched, since those fields are genuinely
  nullable/zero-able on GET per the swagger.
- `components/PromotionTypeTableSection/index.tsx` - removed the priority
  column's `value ?? PROMOTION_TYPE_PRIORITY_FALLBACK` render and the now-
  unused `PROMOTION_TYPE_PRIORITY_FALLBACK` import; the column now renders
  `priority` directly (always a concrete number on GET).
- `constant.ts` - `PROMOTION_TYPE_PRIORITY_FALLBACK = 999` kept (not deleted):
  its doc comment was corrected to say it is reserved for the create/update
  form mapper's empty-input case in a later sprint, not for GET-response
  display. It has no consumer yet in this sprint.

### Confirmed no other file needed the same fix
`grep -rn "priority.*null" src/modules/products/promotion-management/` now
returns exactly one hit: the explanatory comment in `constant.ts` describing
*why* only the PUT body is nullable. No other file references a nullable
priority.

### Re-validation
- `npm run typecheck` - pass (no output, both tsconfigs).
- `npx eslint src/modules/products/promotion-management/promotion-type/ --max-warnings 0`
  - pass, `errorCount: 0` on every file in the module.
- `npx prettier --check` on every touched file - "All files formatted
  correctly".
- `npm run build` - pass, only the pre-existing large-chunk warning.
- `git status --short` - exactly `types/promotion-type.types.ts`,
  `constant.ts`, `components/PromotionTypeTableSection/index.tsx` changed by
  this step, `mock-data.ts` (still untracked, content updated), plus the
  files already modified by earlier steps in this sprint (`services/promotion-type.service.ts`,
  `src/helpers/menus.helper.ts`, `src/lang/vi.json`, `src/lang/en.json`) and
  the unrelated pre-existing `src/redux/slices/auth.slice.ts`. No other file
  touched.
- Not verified: rendered table layout in a browser with the corrected mock
  priorities.

## Files created

Module `src/modules/products/promotion-management/promotion-type/`:
- `constant.ts` - `LIST_QUERY_STALE_TIME_MS = 60_000`, `DEFAULT_LIST_PAGE_SIZE`, `PROMOTION_TYPE_STATUS` (`as const`) and derived `PromotionTypeStatus`.
- `types/promotion-type.types.ts` - `PromotionTypeResponse`, `PromotionTypePageInfo`, `PromotionTypePagedResponse`, `PromotionTypeListQueryParameters`.
- `services/promotion-type.service.ts` - `BASE_PATH = 'api/admin/portal/v1/promotion-types'`; `getPromotionTypes(params, signal)` and `getPromotionTypeById(id, signal)` (real GET-by-id, not wired to UI). No React imports; null-response guard like `theme.service.ts`.
- `queryKeys/promotion-type.query-keys.ts` - `promotionTypeQueryKeys`: `all`, `lists()`, `list(params)` (`queryOptions`, `keepPreviousData`, module `staleTime`), `details()`, `detail(id)` (`enabled: Number.isSafeInteger(id) && id > 0`).
- `utils/promotion-type-api.error.ts` - status helpers (404 / 409) and `mapPromotionTypeApiErrorToFields(error)` delegating to the shared helper with this feature's field whitelist (`code`, `name`, `description`, `status`). Unused by UI this sprint (foundation).
- `views/PromotionTypeListPage/index.tsx` (+ `styles.module.scss`) - lazy default export; `TableTitle` with count, create button gated by `PROMOTION_MANAGEMENT_CREATE`, renders the table section.
- `components/PromotionTypeTableSection/index.tsx` (+ `styles.module.scss`) - 7 columns, error Alert with retry, `NoData` empty state, `CustomPagination`, `useState(1)` page with `page - 1` sent to API (Topic convention), loading from `isFetching` (retained rows stay visible).

Shared: `src/utils/api-error-envelope.helper.ts` - `readApiErrorEnvelope`, `parseApiFieldPath`, `mapApiErrorDetailsToFieldErrors` (-> AntD `setFields` shape `{name, errors}` plus `formErrors` for unmapped details).

## Files changed (additive only)
- `src/routes/index.tsx` - one lazy `PromotionTypeListPage` declaration (before `PopupListPage`), three guarded routes in the MainLayout block (after `product/parameter/product-fee-list`, before `content/advertisement-service`): list (VIEW), `view/:id` (VIEW), `create` (CREATE). No prior `promotion` collision.
- `src/utils/navigate.ts` - `ofPromotionTypeList()`, `ofPromotionTypeView(id: number | string)`, `ofPromotionTypeCreate()`.
- `src/constants/permission.constant.ts` - `PROMOTION_MANAGEMENT_VIEW/CREATE/EDIT` (`promotion_management:*`), Vietnamese comment flags them as placeholders pending BE.
- `src/helpers/menus.helper.ts` - **(2026-10-21 correction, BA breadcrumb decision)** the `Menu.promotionType` child was moved OUT of the `Menu.productParameters` group into a new top-level sibling group `Menu.promotionManagement` ("Quản lý ưu đãi"), `key: 'promotion-management'`, `link`/group shape matching `Menu.productParameters`/`Menu.productIssuance`, sitting alongside them under the same "Quản trị sản phẩm" parent section. `Menu.promotionType` remains the group's only child, same `requiredPermissions: [PROMOTION_MANAGEMENT_VIEW]`, same link `PageURLs.ofPromotionTypeList()`. Reason: BA decided the breadcrumb is "Quản trị sản phẩm → Quản lý ưu đãi → Loại ưu đãi", not under "Tham số sản phẩm". `routes/index.tsx`, `navigate.ts`, and `permission.constant.ts` were NOT touched by this correction - only the menu registry and its labels moved.
- `src/lang/vi.json`, `src/lang/en.json` - `Menu.promotionType` (unchanged); added `Menu.promotionManagement` ("Quản lý ưu đãi" / "Promotion management") for the new group label; new top-level `PromotionManagement.promotionType.{page,column,status,action,empty,error}` (15 leaves; identical key sets).
- `docs/modules/products/OVERVIEW.md` - inventory row "Promotion types". Note: `docs/*` is gitignored in this repo, so this doc and this report do not show in `git status`.

## Assumptions (all NEEDS-VERIFICATION with BE)
- DTO: `id, code, name, description|null, status, version, createdBy|null, updatedBy|null, createdDate, updatedDate`; paged response `{pageInfo:{totalElements,totalPages,currentPage,pageSize}, items}` (Theme/Topic shape); list query params `keyword, status, page (0-based), size, orderBy`.
- Status values `ACTIVE` / `INACTIVE`; badge variants `success` / `neutral` (existing `StatusBadge`).
- Columns (7): code, name, description, status, createdDate, updatedBy, updatedDate. Dates formatted `DD/MM/YYYY HH:mm` with dayjs (local timezone, not the theme-only GMT+7 util). Default sort `createdDate,desc`, page size 10.
- Stale time 60 s (within 30 s - 5 min).
- Menu placement: superseded 2026-10-21 - was under `Menu.productParameters`, now its own top-level `Menu.promotionManagement` group per BA breadcrumb decision (see "Files changed" above).
- Permission strings are placeholders; EDIT is declared but unused.
- Route placement: all three in the MainLayout block as instructed (note: Theme create/view sit in BasicLayout; a later sprint may move view/create if full pages replace Drawers).

## Deviations / judgement calls
- Not reused: theme-management's `ManagementTableSection`, `LIST_QUERY_STALE_TIME_MS`, `useDebouncedSearchKeyword` (cross-module import forbidden by `01-architecture.md`; no filters this sprint). Section layout is a small private SCSS module instead.
- Row name is plain text, not a `TableLink` to the view route, because view currently renders the same list page. The create button navigates to the create route, which also renders the list (no Drawer) - a visible no-op until the Drawer sprint.
- Rule tension: `01-architecture.md` says promote to shared only with a real cross-module consumer; the shared envelope helper currently has exactly one consumer (`promotion-type`). Placed in `src/utils/` because the task explicitly decided shared ownership (decision #7). It has no reverse dependency on feature code.
- Empty string-keyed i18n roles: used an extra `status` group (not in the preferred vocabulary) for badge labels.

## Validation (actual results)
- `npm run typecheck` - pass (both tsconfigs, no output).
- `npm run lint` - pass (`npx eslint . --max-warnings 0` exit 0; npm wrapper output was garbled by output condensing, so exit status confirmed directly).
- `npm run prettier` - script exits non-zero on a pre-existing baseline: 319 files flagged repo-wide, none of them in this change (my new files were formatted with prettier first; `--check` on all touched files is clean).
- `npm run build` - pass ("built in 4.55s"; only the existing large-chunk warning).
- i18n checks: `PromotionManagement.*` + `Menu.promotionType` key sets identical in vi/en (16 leaves, no placeholders); every `PromotionManagement.*` literal used in the module resolves in both files. These prove nothing about rendered labels.

### 2026-10-21 menu/breadcrumb correction - re-validation
- `npm run typecheck` - pass (no output).
- `npx eslint src/helpers/menus.helper.ts --max-warnings 0` - pass (`errorCount: 0`); full `npm run lint` wrapper output garbled as before, per-file JSON confirms zero errors.
- `npx prettier --check src/helpers/menus.helper.ts src/lang/vi.json src/lang/en.json` - "All files formatted correctly".
- `npm run build` - pass, only the pre-existing large-chunk warning.
- `git status --short` - exactly `src/helpers/menus.helper.ts`, `src/lang/en.json`, `src/lang/vi.json` changed by this correction, plus the pre-existing unrelated `src/redux/slices/auth.slice.ts` modification that predates this task and was not touched. No route/navigate/permission file touched, matching the instruction that this correction is menu-registry-only.
- `Menu.*` key-set diff (vi vs en) is unchanged by this correction aside from the added `promotionManagement` pair present in both files; pre-existing vi-only `Menu.*` keys (e.g. `operator`, `customer`, `tandc*`) are unrelated baseline gaps, not introduced here.
- Not re-verified in a browser: new breadcrumb/menu rendering under vi/en locales, menu expand/collapse and active-key highlighting for the new group, permission-gated visibility of the new top-level item.

## Not verified / for later sprints
- Not run in a browser: route guards (`/404` redirect), menu visibility, API integration, pagination against real 0-based BE, locale rendering (open the list with `app_locale=vi` and `app_locale=en`).
- Later: Drawer view/create (and URL sync), form with Zod + `mapPromotionTypeApiErrorToFields`, filters/search, status toggle, delete, mutation hooks, `PROMOTION_MANAGEMENT_EDIT` usage, BE confirmation of contract and role strings, breadcrumb registry check, TEST-DEBT (envelope mapper, service, query-key normalization have no tests; repo has no test runner).

## 2026-10-21 alignment pass: official BE API spec approved (Squad 3)

The table's mechanism column described above as a hardcoded `Tag` with a
fixed label (`mechanism (hardcoded Tag with the fixed label, no backing
field)`, line 68) is now backed by a real `mechanism` field, present on
every `PromotionTypeResponse` record. The column renders
`record.mechanism` through `PROMOTION_TYPE_MECHANISM_LABEL_KEY`
(`constant.ts`) instead of a static string; the i18n key
`column.mechanismTag` used for that static text was retired and replaced by
per-mechanism keys (`field.mechanismGiftProduct/Partner/SubProduct`). All 17
seed records in `mock-data.ts` were given `mechanism: 'GIFT_PRODUCT'`, the
only value any seeded record can have this milestone. Also: the
`PROMOTION_MANAGEMENT_VIEW/CREATE/EDIT` permission values this sprint
flagged as "placeholder, chờ BE xác nhận" are now BE-confirmed exact
matches — the comment in `permission.constant.ts` was updated accordingly.
Full detail of this cross-sprint alignment pass is in
`docs/reports/2026-10-21-sprint3-promotion-type-create.md`'s "Alignment
pass" addendum (added at the same time) — it is the most complete account
since it also covers the create-form mechanism wiring and the now-official
`CreatePromotionTypeRequest` shape.
