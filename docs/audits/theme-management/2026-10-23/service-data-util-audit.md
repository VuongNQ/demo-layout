# Service-data-handling util audit: background-main, background-main-lock, topic

Scope: mappers/transformers/helpers that shape API request/response payloads
under `src/modules/system/theme-management/` (`background-main/`,
`background-main-lock/`, `topic/`, and the shared `theme-management/utils/`).
Validation helpers and error-mapping helpers are out of scope and are listed
only for completeness.

Note: the task referenced
`docs/audits/theme-management/2026-10-14-effective-period-datepicker.md` as
the precedent for "looks similar but isn't, so kept triplicated." That file
does not exist in this checkout (`ls docs/audits/theme-management/` showed
only the 2026-10-21 rename audit before this report was added). The closest
actual in-repo evidence of that precedent was a comment inside
`background-main-lock/utils/background-main-lock-date.util.ts` stating its
`serializeLockDateBound` "deliberately mirrors the mapper rather than
touching it, so no second date semantics is introduced" — i.e. a prior
decision to duplicate rather than share. This audit revisits that specific
duplicate (see Step 3, Change 1) because the duplication is a byte-identical
algorithm with identical inputs/semantics, not a case of disguised business
divergence; consolidating it does not introduce a second semantics, it removes
the only alternative one.

## Step 1 — Inventory

| Module | File | Exports | Maps for | What it does |
| --- | --- | --- | --- | --- |
| background-main | `utils/background-main-api-mapper.helper.ts` | `mapBackgroundMainToListRow`, `mapBackgroundMainToDetailViewModel` | `GET` list/detail | Picks response fields into list-row and detail-view-model shapes; detail also derives `categoryNames`. |
| background-main | `utils/background-main-create-mapper.helper.ts` | `mapBackgroundMainFormValuesToCreateRequest` | `POST create` | Maps form values to `CreateBackgroundMainRequest`; validates/maps category IDs (throws `TypeError`); serialized dates via local `serializeDateBound` (now shared, see below). |
| background-main | `utils/background-main-edit-mapper.helper.ts` | `mapBackgroundMainResponseToFormValues`, `mapBackgroundMainFormValuesToUpdateRequest`, `BackgroundMainUpdateMappingError` | `GET` detail → form, form → `PUT update` | Response→form mapping (dates via local `mapDate`); form→update-request mapping (dates via local `serializeDateBound`/`preserveUnchangedDateBound`); validates/maps category IDs and storage keys (throws `BackgroundMainUpdateMappingError`). |
| background-main | `utils/background-main-image.validation.ts` | image validators | file upload | Format/size/dimension validation for the background image. **Validation, not payload shaping — out of scope**, listed for completeness. |
| background-main | `utils/background-main-lock-period-error.util.ts` | `THEME_LOCK_PERIOD_NOT_COVERED_CODE`, `isThemeLockPeriodNotCoveredError` | save-error mapping | Backend error-code check. **Error mapping, not payload shaping — out of scope.** |
| background-main-lock | `utils/background-main-lock-date.util.ts` | `serializeLockDateBound`, `parseLockDate`, `formatLockDate`, `isOutsideEffectivePeriod`, `isStartDateDisabled`, `isEndDateDisabled` | lock save/display | Lock-date serialization (now a re-export of the shared function, see below), parsing, display formatting, and effective-period disabled-date predicates. |
| background-main-lock | `utils/background-main-lock-save-plan.util.ts` | `buildBackgroundMainLockSavePlan` | `POST`/`PUT`/`DELETE` lock batch save | Diffs working rows against baseline rows into create/update/delete requests plus reorder metadata. No counterpart elsewhere. |
| background-main-lock | `utils/background-main-lock-validation.util.ts` | row/period validators, `toBackgroundMainLockItems`, `areBackgroundMainLockItemsEqual` | lock row business rules | Row-level and period-only validation, row→comparable-item serialization, item-list equality. Validation-heavy; `toBackgroundMainLockItems` is payload shaping but lock-specific (no counterpart). |
| background-main-lock | `utils/background-main-lock-api.error.ts` | `BackgroundMainLockSaveError`, `getBackgroundMainLockErrorOutcome` | save-error mapping | Backend error-code/status → i18n outcome. **Error mapping — out of scope.** |
| topic | `utils/topic-api-mapper.helper.ts` | `parseThemeCategoryRouteId`, `mapThemeCategoryToTopicFormValues`, `mapTopicFormValuesToCreateRequest`, `mapTopicFormValuesToUpdateRequest`, `mapThemeCategoryToPrioritySortItem`, `formatThemeCategoryEffectivePeriod`, `topicStatusByCategoryStatus` | `GET`/`POST`/`PUT` category | Response↔form↔request mapping (dates via local `mapDate`/`serializeDateBound`/`preserveUnchangedDateBound`, now shared, see below); status mapping; priority-sort-table row mapping; display-period formatting. |
| topic | `utils/topic-form-mapper.helper.ts` | `createTopicFormDefaults`, `mapTopicTableItemToFormValues` | priority-sort table → form | Maps a table row (already-formatted display dates) back to form values for inline editing. Topic-specific shape (`TopicTableItem`), no counterpart. |
| topic | `utils/topic-zod-antd-validation.helper.ts` | `mapTopicZodIssuesToAntdErrors` | form validation | Zod issues → AntD field/form error shape. **Validation, not payload shaping — out of scope.** |
| topic | `utils/topic-api.error.ts` | status/error helpers | save-error mapping | **Error mapping — out of scope** (noted for completeness only; not read in depth here). |
| shared | `theme-management/utils/gmt7-date.util.ts` | `getGmt7DatePart` | all of the above | GMT+7 calendar-date-part extraction from a timestamp string. Already shared; unchanged by this audit. |
| shared | `theme-management/utils/effective-period-date.util.ts` | `serializeEffectivePeriodDateBound`, `mapEffectivePeriodDate`, `preserveUnchangedEffectivePeriodDateBound` | **new in this audit** | Extracted shared date-bound serialize/parse/preserve logic (see Step 3). |

## Step 2 — Classification

### Consolidation candidates (confirmed duplicates)

1. **`serializeDateBound` / `serializeLockDateBound`** — byte-identical
   algorithm in `background-main-create-mapper.helper.ts`,
   `background-main-edit-mapper.helper.ts`, `topic-api-mapper.helper.ts`
   (topic's null check was `!value || !value.isValid()` vs the others'
   `!value?.isValid()` — semantically identical, not a real difference), and
   `background-main-lock-date.util.ts`. Same inputs (`Dayjs | null`,
   `'start' | 'end'`), same output format
   (`YYYY-MM-DDT00:00:00+07:00`/`T23:59:59+07:00`), same null/invalid
   handling. **4 copies, confirmed duplicate.**
2. **`mapDate`** — byte-identical in `background-main-edit-mapper.helper.ts`
   and `topic-api-mapper.helper.ts` (`dayjs(getGmt7DatePart(value))`, valid
   check, else `null`). **2 copies, confirmed duplicate.**
3. **`preserveUnchangedDateBound`** — byte-identical in
   `background-main-edit-mapper.helper.ts` and `topic-api-mapper.helper.ts`
   (same originalValue-comparison-then-reserialize logic). **2 copies,
   confirmed duplicate.**

### Looks similar but intentionally NOT merged

- **`mapDate` (above) vs. `parseLockDate`** in
  `background-main-lock-date.util.ts`: `mapDate` parses with
  `dayjs(getGmt7DatePart(value))` (lenient/auto-detected format);
  `parseLockDate` parses with
  `dayjs(getGmt7DatePart(value), 'YYYY-MM-DD', true)` (**strict** format
  parsing). Both normally produce the same result because
  `getGmt7DatePart` already returns a 10-character `YYYY-MM-DD` string, but
  they diverge for a malformed/unexpected input: strict parsing invalidates
  it, lenient parsing may still coerce something. This is the kind of subtle
  difference the referenced precedent warns about — **not merged.**
- **`mapCategoryIds`/`requireCategoryIds`-style category-ID mapping** in
  `background-main-create-mapper.helper.ts` vs.
  `background-main-edit-mapper.helper.ts`: structurally similar (map to
  `number[]`, validate, require a non-empty tuple for non-default), but the
  create path throws a plain `TypeError` while the edit path throws
  `BackgroundMainUpdateMappingError('invalid-categories')`, which the edit
  page's catch handler specifically branches on
  (`error instanceof BackgroundMainUpdateMappingError`). Merging would either
  break that branch or force the create path to adopt an error class it has
  no catch site for. **Not merged.**
- **`formatThemeCategoryEffectivePeriod`/`formatDate`** (topic) vs.
  **`formatLockDate`** (background-main-lock): both render a GMT+7 date as
  `dd/MM/yyyy`, but topic's `formatDate` returns `null` for an unset value and
  falls back to the raw string on parse failure, using `dayjs(...).format(...)`;
  the lock's `formatLockDate` returns the em-dash `'—'` for an unset value and
  uses a regex-based reformat with no `dayjs` parse. Different null-handling
  and consumer expectations (table cell vs. read-only display). **Not
  merged.**
- **`mapThemeCategoryToPrioritySortItem`** (topic) vs.
  **`mapBackgroundMainToListRow`** (background-main): both shape a response
  into a table row, but the target shapes (`TopicTableItem` vs.
  `BackgroundMainListRow`) and fields diverge enough (topic needs
  `effectiveLabel`/`status`/`themeCount`; background-main needs
  `categories`/`priority`/`isDefault` as raw fields) that this is ordinary
  per-feature row mapping, not a hidden duplicate. **Not merged.**
- **`toBackgroundMainLockItems`** (lock) has no counterpart; it serializes
  editable rows to a lock-specific comparable shape used only for diffing.
  **Not applicable to merge.**

## Step 3 — Consolidation applied

Extracted the three confirmed duplicates into
`src/modules/system/theme-management/utils/effective-period-date.util.ts`
(new file), following the existing sibling-shared-utils convention used for
`gmt7-date.util.ts` and `theme-lock-period-error.util.ts`/
`background-main-lock-period-error.util.ts`:

- `serializeEffectivePeriodDateBound(value, bound)`
- `mapEffectivePeriodDate(value)`
- `preserveUnchangedEffectivePeriodDateBound(value, originalValue, bound)`

Each consumer now imports the shared function **aliased to its original
local name**, so every internal call site inside each file is unchanged and
behavior is identical to each original copy:

- `background-main-create-mapper.helper.ts`: removed local
  `serializeDateBound`; added
  `import { serializeEffectivePeriodDateBound as serializeDateBound } from '../../utils/effective-period-date.util'`.
- `background-main-edit-mapper.helper.ts`: removed local `mapDate`,
  `serializeDateBound`, `preserveUnchangedDateBound`; added aliased imports
  for `mapDate` and `preserveUnchangedDateBound` (which internally calls the
  shared `serializeEffectivePeriodDateBound` directly, same as before); the
  now-unused `getGmt7DatePart` import and the `Dayjs` type import were
  removed.
- `topic-api-mapper.helper.ts`: removed local `mapDate`, `serializeDateBound`,
  `preserveUnchangedDateBound`; added aliased imports for all three. `dayjs`
  and `getGmt7DatePart` imports were kept (still used by the unrelated local
  `formatDate`).
- `background-main-lock-date.util.ts`: removed the local
  `serializeLockDateBound` implementation; it is now
  `export { serializeLockDateBound }` from an aliased import of the shared
  `serializeEffectivePeriodDateBound`, so its two consumers
  (`background-main-lock-validation.util.ts`) needed no changes.

### Before/after file list

| File | Change |
| --- | --- |
| `theme-management/utils/effective-period-date.util.ts` | **New.** Shared `serializeEffectivePeriodDateBound`, `mapEffectivePeriodDate`, `preserveUnchangedEffectivePeriodDateBound`. |
| `background-main/utils/background-main-create-mapper.helper.ts` | Local `serializeDateBound` removed; aliased import added. |
| `background-main/utils/background-main-edit-mapper.helper.ts` | Local `mapDate`, `serializeDateBound`, `preserveUnchangedDateBound` removed; aliased imports added; unused `getGmt7DatePart`/`Dayjs` imports removed. |
| `topic/utils/topic-api-mapper.helper.ts` | Local `mapDate`, `serializeDateBound`, `preserveUnchangedDateBound` removed; aliased imports added. |
| `background-main-lock/utils/background-main-lock-date.util.ts` | Local `serializeLockDateBound` implementation replaced with a re-export of the shared function; the comment explaining the old deliberate-duplication choice was removed since it no longer applies. |

No other file changed. No function signature, return value, or exported
name changed for any existing consumer.

## Intentionally left unmerged (see Step 2 for full reasoning)

- `mapDate`/`mapEffectivePeriodDate` vs. `parseLockDate` (strict vs. lenient
  date parsing).
- Create vs. edit category-ID mapping (different thrown error types with
  different catch-site consumers).
- Topic `formatDate`/`formatThemeCategoryEffectivePeriod` vs. lock
  `formatLockDate` (different null-handling and rendering strategy).
- `mapThemeCategoryToPrioritySortItem` vs. `mapBackgroundMainToListRow`
  (genuinely different target shapes, ordinary per-feature mapping).

## Validation

Run after each consolidation step and once at the end; results below are the
final state.

- `npm run typecheck`: passed after every file change and at the end.
- `npm run lint`: passed (exit 0, 0 files with lint errors).
- `npm run build`: passed; only the pre-existing chunk-size warning.
- Not verified: rendered form values and submitted request payloads for
  background-main create/edit and topic create/edit in a browser (dates in
  particular — the shared functions are a direct extraction with no logic
  change, but runtime behavior of the three consuming forms was not
  exercised).
