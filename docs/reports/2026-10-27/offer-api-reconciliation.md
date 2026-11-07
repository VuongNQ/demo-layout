# Offer View: "Thẻ tặng kèm" field showed an empty value

Date: 2026-10-27
Risk: SAFE (single-file, presentational change)

## Symptom

On the Offer View page (Info tab), the "Thẻ tặng kèm" field rendered "—" even
when the offer had linked products. The Edit form showed the same cards
correctly as badges.

## Root cause

`InfoTab` in
`src/modules/products/promotion-management/promotion/components/OfferDetailTabs/index.tsx`
read `offer.giftSummary?.products`. `giftSummary` (`OfferGiftSummary`) describes
gifted products with counts and is null or empty for these offers. The linked
cards live in `offer.linkedProducts` (`OfferLinkedProduct[]`, a required array on
`OfferDetailResponse`, see `types/promotion.types.ts`).

## Fix

`InfoTab` now reads `offer.linkedProducts` and renders each item as an AntD `Tag`
with the label `"{code} – {name}"` (en dash with spaces), the same format as
`formatCardLabel` in the Edit form's `GiftCardMultiSelect`. Tags are wrapped in
AntD `Space` (`wrap`, `size={[4, 4]}`). "—" (`EMPTY_VALUE`) renders only when
`linkedProducts` is empty. `Space` and `Tag` were added to the existing `antd`
import.

File: `src/modules/products/promotion-management/promotion/components/OfferDetailTabs/index.tsx`
(import on line 6, the "cards" `dd` block in `InfoTab`).

## Not changed

`offer.giftSummary` remains correctly used elsewhere (for example `CardCodesCell`
in `PromotionListPage`) and was not touched. The Edit form, `GiftCardMultiSelect`,
`promotion.mapper.ts`, the `displayProducts` rendering and i18n keys are unchanged.

## History — real response reconciliation

Date: 2026-10-29
Risk: MODERATE (response envelope/type change, i18n key removal, one shared
query key signature change — contained to the `promotion` offer feature)

### Real capture

First real capture of `GET api/admin/portal/v1/offers/{id}/history`:

```json
[
  { "id": 21028, "actor": "nguyen.quoc-vuong3@hdsaison.com.vn", "actionType": "UPDATED", "createdDate": "2026-10-29T04:30:41.616842Z", "reason": "Cập nhật ưu đãi",
    "changes": [{ "fieldKey": "effectiveTo", "path": "effectiveTo", "action": "UPDATED", "oldValue": "2026-10-29T16:59:59.999Z", "newValue": "2026-10-29T04:31:00Z" }] },
  { "id": 21027, "actor": "nguyen.quoc-vuong3@hdsaison.com.vn", "actionType": "CREATED", "createdDate": "2026-10-29T04:27:31.763474Z", "reason": "Tạo mới ưu đãi", "changes": [] }
]
```

This supersedes the self-defined/FE-invented `OfferHistoryRow`/`OfferHistoryPageResponse`
envelope from the 2026-10-27 reconciliation above. Every `NEEDS-TEAM-DECISION`/
`FE-invented` marker on this endpoint's response shape is now resolved by this
capture; the remaining open point is pagination support (see "Still open"
below), not the item shape.

### Mismatches found and fixed

1. **No page envelope.** The old `OfferHistoryPageResponse { pageInfo, items }`
   assumed a wrapper that does not exist; the endpoint returns a plain array.
   `getOfferHistory` (`services/promotion.service.ts`) now returns
   `OfferHistoryItem[]` directly, and no longer sends `page`/`size` query
   params (there was never evidence the endpoint honors them, and the real
   capture shows no envelope to report a server-side total from). `HistoryTab`
   (`components/OfferDetailTabs/index.tsx`) now paginates the full array
   client-side with `.slice()`, the same pattern already used by the sibling
   `DisplayPlacesTab` in the same file for its unpaginated list. The query key
   (`queryKeys/promotion.query-keys.ts`) dropped its `params`/`normalizeHistoryParameters`
   argument accordingly; `OfferHistoryParams` was removed from
   `types/promotion.types.ts` as dead code.
2. **Flat row shape replaced by item + nested changes.** `OfferHistoryRow`
   (`action`, `time`, `actor`, `field`, `oldValue`, `newValue` — one row per
   diffed field) is replaced by `OfferHistoryItem` (`id`, `actor`,
   `actionType`, `createdDate`, `reason`, `changes: OfferHistoryChange[]`) and
   `OfferHistoryChange` (`fieldKey`, `path`, `action`, `oldValue`, `newValue`).
   A history entry can now have zero changes (e.g. `CREATED`) or more than
   one; the table renders one row per item with a `changes` column listing
   every diffed field as `"<field label>: <old> → <new>"`.
3. **`fieldKey` vs `path`.** Both exist and currently hold the same string
   (`"effectiveTo"`/`"effectiveTo"`). Kept as two distinct fields on
   `OfferHistoryChange` per the real capture; `path` is unused by the UI today
   since it may diverge from `fieldKey` for a nested path that has not been
   observed yet.
4. **`CREATED` action.** `actionType: "CREATED"` was not in the previously
   assumed `OFFER_HISTORY_ACTION` set (`ACTIVATED`/`INACTIVATED`/`UPDATED`).
   Added to `constant.ts`.
5. **`reason` replaces the derived action label.** The History tab's "action"
   column previously called `getOfferHistoryActionLabel(actionType)` to derive
   a Vietnamese label from the action enum. The BE now confirms `reason` is
   already a ready-to-display Vietnamese label ("Cập nhật ưu đãi", "Tạo mới ưu
   đãi"), so that column now renders `item.reason` directly.
   `getOfferHistoryActionLabel` became dead code and was removed from
   `utils/promotion.history-label.ts`, along with the now-unused
   `PromotionManagement.promotion.history.action.*` i18n keys (`vi.json`/`en.json`).
   Note: `reason` is BE text, not i18n-driven, so it does not switch with
   `app_locale` — the English History tab will show the Vietnamese reason
   string. This is accepted as the new source of truth per the real capture;
   flag to BE/product if an English `reason` is later needed.
6. **Value formatting per field type.** `changes[].oldValue`/`newValue` are
   raw strings (ISO dates for `effectiveFrom`/`effectiveTo`, raw codes for
   `status`/`offerProductType`, raw numbers/ids otherwise). Added
   `formatOfferHistoryChangeValue(fieldKey, value)` in
   `utils/promotion.history-label.ts`: formats `effectiveFrom`/`effectiveTo`
   with the existing `formatOfferDateTime`, maps `status` through a new
   `getOfferStatusLabel` (added to `utils/promotion.status-label.ts`, for the
   raw stored `OfferStatus`, distinct from the computed `OfferDisplayStatusCode`
   label), and maps `offerProductType` through the existing
   `getOfferProductTypeLabel`. `name`, `description`, `imageKey`, `priority`,
   `offerTypeId`, `linkedProductIds` have no coded-value lookup and render raw
   (no evidence yet that these carry anything but plain text/numbers/ids).
   `getOfferHistoryFieldLabel` (field-name lookup) is unchanged.
7. **Column rename.** The History tab's "field"/"old value"/"new value"
   columns are replaced by one "changes" column (new key
   `PromotionManagement.promotion.column.changes`, "Thay đổi"/"Changes"); the
   now-unused `column.field`/`column.oldValue`/`column.newValue` keys were
   removed from both lang files after confirming (grep) zero remaining
   references anywhere in `src/`. The "time" column now reads `createdDate`
   instead of the invented `time` field; `rowKey` is the real `id`.

### Still open / not changed

- **Pagination semantics: CONFIRMED YES — server-side paginated.** See the
  "Pagination correction" section below: a second real capture shows the
  endpoint returns the same `pageInfo`/`items` envelope as the offers list.
  This supersedes the "unconfirmed" note originally written here.
- `changes[].action` is kept typed as `string` (not a closed union): the only
  observed value is `"UPDATED"`, which is not enough to confirm whether a
  diffed field's own action set differs from the item-level `actionType`
  (for example whether an `ADDED`/`REMOVED` value exists for array-like fields
  such as `linkedProductIds`).
- `OFFER_TRACKED_FIELDS` (`constant.ts`) is unchanged; the capture's single
  `effectiveTo` change is already a member of that set.

### Validation

- `npm run typecheck`: pass.
- `npm run lint` (promotion module): 0 errors/warnings.
- `npm run build`: pass.
- `npm run prettier --check` on every touched file: pass.
- Not verified: rendering in a running browser for either `app_locale=vi` or
  `app_locale=en` (the History tab's new "changes" column, the `reason`
  column, and the removed i18n keys were not visually confirmed), and no
  second real capture exists yet for a `CREATED`-with-changes, `ACTIVATED`, or
  `INACTIVATED` item, or for an offer with more than 2 history entries.

### Files changed

- `types/promotion.types.ts`, `constant.ts`
- `services/promotion.service.ts`, `queryKeys/promotion.query-keys.ts`
- `utils/promotion.history-label.ts`, `utils/promotion.status-label.ts`,
  `utils/promotion.mechanism-label.ts` (comment fix only)
- `components/OfferDetailTabs/index.tsx`
- `src/lang/vi.json`, `src/lang/en.json`

### Follow-up check (2026-10-29): reported `pageRows`/`.slice()` error

A follow-up report suspected `rows` in `HistoryTab` was still derived from the
old paged-response shape (e.g. `query.data?.items`), which would make
`rows.slice(...)` fail because `.items` would be `undefined` on the new plain
array response.

Re-inspected `HistoryTab` in `components/OfferDetailTabs/index.tsx`: `rows` is
already `query.data ?? []` (line 276), i.e. the query result used directly as
the array, matching the `OfferHistoryItem[]` return type `getOfferHistory`
was changed to. There is no `.items`/`.pageInfo` access anywhere in the file
(`grep -n "\.items\|pageInfo"` on this file returns no matches), and no
duplicate/stale `rows`/`pageRows` declaration exists outside this one
`HistoryTab` instance (the only other `rows`/`pageRows` pair in the file
belongs to the separate `DisplayPlacesTab` function and uses the same,
already-correct pattern). No TS or lint error reproduces:
- `npm run typecheck`: pass, no diagnostics.
- `npx eslint components/OfferDetailTabs/index.tsx`: 0 errors, 0 warnings.
- `npm run build`: pass.

No code change was needed; `rows`'s source was already fixed in the prior
History reconciliation pass, and no TS/runtime error text exists to report
because none reproduces against the current source. Not verified: an actual
browser render against a live backend response (no live/mocked API available
in this check) — static checks do not prove runtime/browser behavior.

## History — pagination correction (CONFIRMED YES, server-side)

Date: 2026-10-29
Risk: MODERATE (reverts the response-envelope/pagination-model part of the
History reconciliation above; item/change shape, `reason`-as-label, value
formatting, and i18n keys from that reconciliation are unchanged)

### Real capture

A second real capture of `GET api/admin/portal/v1/offers/{id}/history`
contradicts the first reconciliation's "no page envelope" finding:

```json
{
  "pageInfo": { "totalElements": 2, "pageSize": 10, "currentPage": 0, "totalPages": 1 },
  "items": [
    { "id": 21028, "actor": "...", "actionType": "UPDATED", "createdDate": "...", "reason": "Cập nhật ưu đãi", "changes": [...] },
    { "id": 21027, "actor": "...", "actionType": "CREATED", "reason": "Tạo mới ưu đãi", "changes": [] }
  ]
}
```

The endpoint IS server-side paginated, using the same `pageInfo { totalElements,
totalPages, currentPage, pageSize }` / `items` envelope as the offers list
(`OfferPageResponse`). The first capture's 2-item array was the full
`pageInfo`-wrapped page one response with the wrapper stripped by whatever
captured it, not an actual unwrapped array — this was a misreading of that
capture, not a BE behavior change between the two captures.

### What reverted

1. **`OfferHistoryPageResponse` restored** (`types/promotion.types.ts`):
   `{ pageInfo: OfferPageInfo; items: OfferHistoryItem[] }`, reusing the same
   `OfferPageInfo` type as the offers list. `OfferHistoryParams` (`page`,
   `size`) restored alongside it.
2. **`getOfferHistory` sends `page`/`size` again and returns the page envelope**
   (`services/promotion.service.ts`): same `appendQueryParams` pattern as
   `getOffers`, explicit `OfferHistoryPageResponse | null` response typing.
3. **Query key takes `params` again** (`queryKeys/promotion.query-keys.ts`):
   `normalizeHistoryParameters` restored, `history(id, params)` key includes
   the normalized `{ page, size }`, and `placeholderData: keepPreviousData`
   is back (needed now that a page change refetches).
4. **`HistoryTab` is server-side paginated again**
   (`components/OfferDetailTabs/index.tsx`): `useQuery` is called with
   `promotionQueryKeys.history(id, { page: page - 1, size: pageSize })` (the
   AntD-1-indexed `page` state converted to the BE's zero-based index, same
   convention as `PromotionListPage`/`getOffers`); `items` is
   `query.data?.items ?? []`; `total` is `query.data?.pageInfo.totalElements
   ?? 0`; the client-side `.slice()` added in the (incorrect) first
   reconciliation pass is removed. A page/page-size change now triggers a new
   request instead of re-slicing an already-fetched array.

### What stayed from the History reconciliation (unchanged by this correction)

- `OfferHistoryItem` / `OfferHistoryChange` field shapes (`id`, `actor`,
  `actionType`, `createdDate`, `reason`, `changes[].{fieldKey,path,action,oldValue,newValue}`).
- `reason` as the action-column source of truth (`getOfferHistoryActionLabel`
  stays removed).
- `formatOfferHistoryChangeValue`, `getOfferStatusLabel`, and the `changes`
  column rendering (`"<field label>: <old> → <new>"` per diffed field).
- The `column.changes` i18n key and the removed `column.field`/`oldValue`/
  `newValue`/`history.action.*` keys.
- `CREATED` in `OFFER_HISTORY_ACTION`.

### Also found and removed

A stray `console.log(rows)` had been added to `HistoryTab` on disk (debug
scaffolding, not part of either reconciliation pass); removed in this same
change per the no-debug-scaffolding rule.

### Validation

- `npm run typecheck`: pass.
- `npx eslint` on every touched file (`types/promotion.types.ts`,
  `services/promotion.service.ts`, `queryKeys/promotion.query-keys.ts`,
  `components/OfferDetailTabs/index.tsx`): 0 errors, 0 warnings.
- `npm run build`: pass.
- `npx prettier --check` on every touched file: pass.
- Not verified: an actual browser render/paginate against a live backend
  (no live/mocked API available in this check), and no third capture exists
  yet for a page beyond `currentPage: 0` or an offer with `totalPages > 1`.

### Files changed (this correction)

- `types/promotion.types.ts` — restored `OfferHistoryPageResponse`,
  `OfferHistoryParams`.
- `services/promotion.service.ts` — restored paginated `getOfferHistory`.
- `queryKeys/promotion.query-keys.ts` — restored `normalizeHistoryParameters`,
  parameterized `history(id, params)`.
- `components/OfferDetailTabs/index.tsx` — `HistoryTab` back to server-side
  pagination; removed stray `console.log`.

## History — one row per change (table format)

Date: 2026-10-29
Risk: SAFE (presentational row-shape change inside `HistoryTab`; no type,
service, or query-key change)

### Change

The History tab's merged single `changes` column (one row per history item,
all diffed fields listed inside one cell) is replaced by 6 separate columns —
Thời gian | Người thực hiện | Hành động | Trường | Giá trị cũ | Giá trị mới —
with **one row per change**, matching the column layout from the original
(pre-real-capture) History draft, now fed by the real `OfferHistoryItem`/
`OfferHistoryChange` shapes instead of a flat invented row.

`components/OfferDetailTabs/index.tsx`:

- Added `HistoryChangeRow` (`key`, `createdDate`, `actor`, `reason`,
  `fieldLabel`, `oldValue`, `newValue`) and `buildHistoryChangeRows(items)`,
  replacing `renderHistoryChanges`. For each `OfferHistoryItem`:
  - `changes.length > 0`: one row per change, `key` = `` `${item.id}-${index}` ``,
    `fieldLabel` = `getOfferHistoryFieldLabel(change.fieldKey)`, `oldValue`/
    `newValue` = `formatOfferHistoryChangeValue(change.fieldKey, change.oldValue|newValue) || EMPTY_VALUE`.
  - `changes.length === 0` (e.g. `CREATED`): exactly one row, `key` =
    `` `${item.id}` ``, `fieldLabel`/`oldValue`/`newValue` = `EMPTY_VALUE`
    (`'—'`) rather than a blank cell.
  - `createdDate`, `actor`, and `reason` are copied from the parent item onto
    every row it expands to.
- `Table<HistoryChangeRow>` (`rowKey='key'`) replaces `Table<OfferHistoryItem>`;
  `dataSource` is `rows = buildHistoryChangeRows(items)` instead of `items`
  directly.
- **Pagination still counts items, not rows.** `total` stays
  `query.data?.pageInfo.totalElements ?? 0` (history items from the server),
  and `page`/`pageSize` still drive the `history(id, { page, size })` query
  params — unchanged from the prior pagination correction. An item with
  multiple changes still counts as one entry toward that total even though it
  renders multiple table rows; the table only ever shows one full page's
  worth of items' rows at a time, so the rendered row count per page is
  variable (`pageSize` is an upper bound on items, not rows).
- i18n: restored `PromotionManagement.promotion.column.field`/`oldValue`/
  `newValue` (`vi.json`/`en.json`), re-adding what the prior "changes" column
  reconciliation had removed; `column.changes` (added in that pass) is now
  unused and was removed after confirming (grep) zero remaining references.

### Not changed

`OfferHistoryItem`/`OfferHistoryChange` field shapes, the paginated
`OfferHistoryPageResponse` envelope, `getOfferHistory`'s `page`/`size` request
params, the query key, `reason`-as-action-label, `formatOfferHistoryChangeValue`,
and `getOfferHistoryFieldLabel` are all unchanged — only how the already-shaped
data is laid out into table rows.

### Validation

- `npm run typecheck`: pass.
- `npx eslint components/OfferDetailTabs/index.tsx`: 0 errors, 0 warnings.
- `npm run build`: pass.
- `npx prettier --check` on the touched `.tsx` and both lang files: pass.
- Not verified: an actual browser render of the 6-column table, row-sharing
  visual appearance (repeated `createdDate`/`actor`/`reason` per change row
  is not visually merged/row-spanned — each row independently repeats those
  values), and pagination behavior across more than one page of items. No
  capture exists yet for an item with more than one change.
