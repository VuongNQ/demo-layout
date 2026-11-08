# Background Main rename and lock period validation

Notes on the `background-main` rename and the period validation of
`src/modules/system/theme-management/background-main-lock/`.

## Follow-up: persisted-row period validation (2026-10-23)

### Bug
Editing the start or end date of an already-saved lock row skipped all
client-side period validation (inline error and date-picker disabled dates).
Only the backend error `THEME_LOCK_PERIOD_NOT_COVERED` caught it after Save.

### Root cause
`validateBackgroundMainLockRowPeriod`, `isStartDateDisabled` and
`isEndDateDisabled` read `row.effectivePeriod`. That field was only set for
rows added through the picker, from the `available-themes` response. Rows
built from `GET theme-locks` (`BackgroundMainLockResponse`, via `buildRows`)
never had it, and the lock list response carries no background period.

### Why `available-themes` could not be reused
The endpoint returns only backgrounds that are ongoing or upcoming, not
default, and not yet locked. Every persisted row's background is locked, so it
is structurally excluded.

### Fix
Persisted rows resolve their period from the existing background-main detail
endpoint (`getBackgroundMainById` through `backgroundMainQueryKeys.detail(id)`),
using `useQueries` over the distinct `themeId`s of the loaded locks. `startAt`
and `endAt` of the detail response are used as the row's `effectivePeriod`.

- The merge is a derived overlay (`resolvedRows`, a `useMemo`), not state. The
  `rows` draft, `editBaselineRows`, dirty check and save plan are unchanged, so
  in-progress edits are not overwritten when a detail query resolves.
- `resolvedRows` feeds the table, `handleChangeDate` validation and
  `validateBackgroundMainLockRows` on save. `handleChangeDate` writes back only
  the changed date.
- If a detail query is loading or failed, the row has no period and behaves as
  before (backend check on save).
- New rows from the picker keep their `available-themes` period.
- This adds a deliberate cross-module import from `background-main-lock` to
  `background-main` (query keys only). Neither module was restructured.

### Files changed
- `src/modules/system/theme-management/background-main-lock/views/BackgroundMainLockPage/index.tsx`
- `src/modules/system/theme-management/background-main-lock/types/background-main-lock.types.ts`
  (JSDoc of `BackgroundMainLockEditableRow.effectivePeriod` only)

### Validation
- `npm run typecheck`: passed.
- `npm run lint`: passed (no output beyond the script header).
- `npm run build`: passed; only the existing chunk size warning.
- `prettier --check` on the two changed files: passed. The directory-wide check
  reports 9 other files in this module as unformatted; they were not touched.
- Not verified: browser behavior, real API responses, behavior of the
  date pickers with resolved periods.

## Follow-up: period-not-covered on background-main save (2026-10-23)

### Bug
`THEME_LOCK_PERIOD_NOT_COVERED` is also returned when saving an edit to a
background-main item itself (shrinking its `startAt`/`endAt` so it no longer
covers an existing lock's period). `background-main`'s edit save flow had no
handling for this code and fell into the generic update-error message.

### Root cause
`BackgroundMainEditPage`'s save error mapping only read HTTP status
(`getErrorStatus`), never the backend error `code`/`errorCode`. The code-aware
reader existed only in `background-main-lock-api.error.ts`, scoped to the lock
save flow.

### Fix
- Extracted the error-code constant and a generic code-reading check to
  `theme-management/utils/theme-lock-period-error.util.ts`
  (`THEME_LOCK_PERIOD_NOT_COVERED_CODE`,
  `isThemeLockPeriodNotCoveredError(error)`), following the existing
  `theme-management/utils/` sibling-shared-utils convention (e.g.
  `gmt7-date.util.ts`).
- `background-main-lock-api.error.ts` now imports the shared constant instead
  of redeclaring it; its switch, message keys, `forceReload` values and 409/
  fallback branches are unchanged.
- `BackgroundMainEditPage`'s catch block checks
  `isThemeLockPeriodNotCoveredError(error)` before the 404/409/400 status
  branches (the backend HTTP status for this code on background-main save is
  unverified, so the code check takes priority) and sets an inline
  `submitError` without forcing reload, navigation, or a version-conflict
  state — the draft is preserved.
- New i18n key `ThemeManagement.backgroundMain.updatePeriodNotCoveredByLock`
  added to both `vi.json` and `en.json`, worded for the background's own
  period ("ảnh nền"), distinct from the existing lock-centric
  `backgroundMainLock.message.periodNotCovered` key, which is untouched.

### Files changed
- `src/modules/system/theme-management/utils/theme-lock-period-error.util.ts` (new)
- `src/modules/system/theme-management/background-main-lock/utils/background-main-lock-api.error.ts`
- `src/modules/system/theme-management/background-main/views/BackgroundMainEditPage/index.tsx`
- `src/lang/vi.json`, `src/lang/en.json`

### Validation
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; only the existing chunk-size warning.
- Not verified: real backend response shape/status for this code on
  background-main save, rendered Alert text under `app_locale=vi`/`en`, draft
  preservation in-browser, and that `background-main-lock`'s existing
  handling of this same error code is unaffected (static inspection confirms
  the lock file's exported behavior is unchanged, but it was not exercised in
  a browser).

## Follow-up: scope `THEME_LOCK_PERIOD_NOT_COVERED` to background-main only (2026-10-23)

### Change 1: removed from `background-main-lock`

The special-case mapping for `THEME_LOCK_PERIOD_NOT_COVERED` in
`background-main-lock-api.error.ts`'s switch was removed. The code now falls
through to that function's existing generic fallback for any unmapped code:
if the backend response status is `409`, it resolves to
`ThemeManagement.backgroundMainLock.message.conflict` with `forceReload: true`
(the draft is discarded, rows reset to the refetched cache, and a toast is
shown); for any other status it resolves to
`ThemeManagement.backgroundMainLock.message.saveError` with `forceReload:
false` (the draft is kept and the inline Alert shows a generic save-error
message). This fallback existed before this change and is unchanged by it —
no new fallback was added.

**This is a flagged, accepted regression for `background-main-lock`'s own
save flow**, not a transparent no-op: a user editing a lock who hits this
exact backend code will now see a generic save-error (or, if the backend
happens to return `409` for this code, an optimistic-lock-conflict message
and a forced reload) instead of the specific "lock period must be within the
background's effective period" message the 2026-10-21 follow-up (section 7
above) confirmed working. Whether the backend still returns this code during
a lock save was not re-verified in this change; if it does, the user-visible
message is now worse/different than before. The previously confirmed lock
message `ThemeManagement.backgroundMainLock.message.periodNotCovered` is kept
in both lang files (no remaining code reference after this change — grepped
and confirmed unused) rather than deleted, since removing it was out of this
task's scope and it is otherwise harmless.

### Change 2: shared util moved to single-consumer location

With the lock module no longer importing the shared code constant/helper,
`theme-lock-period-error.util.ts` dropped to a single consumer
(`background-main`'s edit save flow). Per the local-first ownership rule in
`.claude/rules/01-architecture.md` ("promote code to shared space only after
it has multiple genuine consumers"), it was moved out of the shared
`theme-management/utils/` location into
`background-main/utils/background-main-lock-period-error.util.ts`, matching
that folder's existing kebab-case `*.util.ts` siblings
(`background-main-edit-mapper.helper.ts`, `background-main-image.validation.ts`).
Its exports (`THEME_LOCK_PERIOD_NOT_COVERED_CODE`,
`isThemeLockPeriodNotCoveredError`) and implementation are unchanged; only the
file location and the one import site in `BackgroundMainEditPage/index.tsx`
were updated.

### Change 3: `handleSubmit` refactor (no behavior change)

`BackgroundMainEditPage`'s `handleSubmit` catch block was extracted into a
new module-level `handleBackgroundMainSubmitError(error, stage, actions)`
function, so `handleSubmit` now only orchestrates the upload/update mutation
calls and the success path, delegating failure branching to the extracted
function. Every branch (upload-stage errors, `BackgroundMainUpdateMappingError`,
the lock-period-not-covered check, 404 redirect, 409 version conflict, 403/400/
generic fallback) and their exact outcomes (`setSubmitError`,
`setVersionConflict`, navigation) are preserved unchanged — only the code
organization changed.

### Files changed
- `src/modules/system/theme-management/background-main-lock/utils/background-main-lock-api.error.ts`
- `src/modules/system/theme-management/background-main/utils/background-main-lock-period-error.util.ts`
  (moved from `theme-management/utils/theme-lock-period-error.util.ts`, no content change)
- `src/modules/system/theme-management/background-main/views/BackgroundMainEditPage/index.tsx`

### Validation
- `npm run typecheck`: passed.
- `npm run lint`: passed (exit 0, 0 files with lint errors).
- `npm run build`: passed; only the existing chunk-size warning.
- Not verified: real backend behavior for a lock save that still returns
  `THEME_LOCK_PERIOD_NOT_COVERED` (whether it still occurs, and what HTTP
  status it carries, which determines whether the user sees the conflict-
  reload message or the generic save-error message), and rendered Alert text
  for both flows under `app_locale=vi`/`en` in a browser.

## Follow-up: block saving a past-dated effective period on edit (2026-10-23)

### Change

`BackgroundMainEditPage` (edit mode only) now blocks saving when either
`startDate` or `endDate` is earlier than the current calendar day in GMT+7,
even when the user did not touch that field this submit — unrelated edits
(e.g. only `name`) are blocked too unless the user also fixes the stale date.
This is intentionally broader than `background-main-lock`'s guard, which
exempts a bound left equal to its baseline value (see
`background-main-lock-validation.util.ts`'s `startUnchanged`/`endUnchanged`).
Per the task's own framing, this is the intended UX: any existing Main
Background whose period has already expired must have its dates corrected
before any further edit can be saved, not only when the dates themselves are
touched.

The check reuses the exact GMT+7 calendar-day comparison already established
in this area: `dayjs().startOf('day')` compared with `.isBefore(..., 'day')`,
the same pattern `isStartDateDisabled`/`isEndDateDisabled`
(`background-main-lock-date.util.ts`) and `validateBackgroundMainLockRow`
(`background-main-lock-validation.util.ts`) already use. No new
date-comparison method was introduced. `startDate`/`endDate` in
`BackgroundMainFormValues` are already GMT+7 calendar-day `Dayjs` values (via
`mapEffectivePeriodDate`), so no extra parsing/serialization was needed.

The guard was added as `applyEffectivePeriodPastDateGuard`, a new
`superRefine` step in `backgroundMainEditFormSchema` only
(`background-main-form.schema.ts`) — `backgroundMainCreateFormSchema` is
unaffected, since a brand-new background cannot yet have an "already past"
saved period. It is skipped when `hasEffectivePeriod` is `false`, consistent
with the existing `applyEffectivePeriodRequiredDates` check it sits next to.

This single schema change satisfies both of the task's two trigger points
without new wiring:
- **Pre-flight before the mutation:** `BackgroundMainForm`'s `handleFinish`
  already calls `validateBackgroundMainValues(form, mode)` and returns early
  on failure, before `onSubmit` (the page's `handleSubmit`, which calls the
  upload/update mutations) ever runs.
- **Inline Form validation:** the same Zod schema also runs from
  `handleValuesChange` whenever the form currently has field errors, via the
  existing `applyZodIssues`/`setFields` mapping — no new mapping logic, since
  `path: ['startDate']`/`['endDate']` already route to those `Form.Item`
  fields (same mechanism as the pre-existing `endDateBeforeStart` check).

### i18n keys

Added `ThemeManagement.backgroundMain.startDateInPast` and `...endDateInPast`
in both `vi.json` and `en.json`, as flat siblings of the existing
`startDateRequired`/`endDateRequired`/`endDateBeforeStart` keys in this same
container. The task suggested a nested `ThemeManagement.backgroundMain.
validation.*` namespace, but `backgroundMain`'s own container has no
`validation` sub-scope today — every one of its existing date-validation
messages is a flat leaf key. Per `.claude/rules/11-i18n.md` ("a namespace
follows the feature that owns the content") and to stay consistent with the
sibling keys it sits beside, the new keys were added flat rather than
introducing an asymmetric nested sub-scope used by only one pair of keys. The
leaf names (`startDateInPast`/`endDateInPast`) happen to match
`backgroundMainLock.validation.*`'s leaf names, but they are separate
containers with separate wording — no collision, no shared ownership.

### Files changed
- `src/modules/system/theme-management/background-main/schemas/background-main-form.schema.ts`
- `src/lang/vi.json`
- `src/lang/en.json`

### Validation
- `npm run typecheck`: passed.
- `npm run lint`: passed (exit 0, 0 files with lint errors).
- `npm run build`: passed; only the existing chunk-size warning.
- Key parity: both new keys present in both `vi.json` and `en.json`, in the
  same `ThemeManagement.backgroundMain.*` container; grep confirmed no other
  code reference to these exact key paths pre-existed.
- Not verified in a browser: the inline per-keystroke error appearing/clearing
  on the date pickers, the submit-blocked Alert/field-error rendering in both
  locales, and that an edit to an already-expired Main Background is in fact
  rejected end-to-end against a real/mock backend.

## Follow-up: 2026-10-23 — status column restored to the lock list

Reverses the earlier decision (recorded only in code, not in this doc — no
dated entry for it was found when re-checked this session) to keep the
lock-state status out of the `BackgroundMainLockTable` list and leave it only
in `AddBackgroundMainPicker`'s filter.

### What the backend actually returns on a lock row

`BackgroundMainLockResponse` (`.../background-main-lock/types/background-main-lock.types.ts:14-29`)
carries `displayStatus: BackgroundMainLockDisplayStatus`
(`INACTIVE | UPCOMING | ONGOING | ENDED`), `startAt`, `endAt`, and `enabled`.
There is no field name distinct from `displayStatus` for the lock's own
state; the type's own comment says the status enum is "shared by lock rows
and available main backgrounds." The user confirmed that, on a lock row,
`displayStatus` reflects the lock's own timing (not the background's
separate effective-period status used in the picker), so this column maps it
directly with no client-side date computation.

### Change

- `BackgroundMainLockEditableRow` gained an optional `displayStatus` field
  (`.../types/background-main-lock.types.ts`). It is optional because a row
  added in the current edit session (`handleAddBackgroundMains`) has no lock
  yet and therefore no backend lock status until saved.
- `buildRows` (`.../views/BackgroundMainLockPage/index.tsx`) now carries
  `lock.displayStatus` through instead of dropping it.
- `BackgroundMainLockTable` (shared by view and edit mode) gained a `status`
  column between `backgroundMain` and `startDate`, rendering
  `UPCOMING -> "Sắp khóa"/"Upcoming lock"` and
  `ONGOING -> "Đang khóa"/"Currently locking"` as plain text (no color
  badge), per the earlier "tạm thời quy định theo text" decision. A row with
  no `displayStatus` yet (unsaved new row) renders an em dash. `INACTIVE`/
  `ENDED` have no mapped label and would render the raw backend value as-is;
  the GET list endpoint already filters to living locks, so neither value is
  expected in practice.

### i18n keys

Added `ThemeManagement.backgroundMainLock.column.status` and
`ThemeManagement.backgroundMainLock.status.{upcoming,ongoing}` in both
`vi.json` and `en.json`. Not reused from the existing generic
`ThemeManagement.common.displayStatus*` keys, since those carry different
Vietnamese wording ("Sắp hiệu lực"/"Đang hiệu lực", for a background's
effective period) from the lock-specific "Sắp khóa"/"Đang khóa" text this
task specified.

### Files changed
- `src/modules/system/theme-management/background-main-lock/types/background-main-lock.types.ts`
- `src/modules/system/theme-management/background-main-lock/views/BackgroundMainLockPage/index.tsx`
- `src/modules/system/theme-management/background-main-lock/components/BackgroundMainLockTable/index.tsx`
- `src/lang/vi.json`
- `src/lang/en.json`

### Validation
- `npm run typecheck`: passed.
- `npm run lint`: passed for all touched files (0 errors/warnings).
- `npm run build`: passed; only the existing chunk-size warning.
- Key parity: both new keys present in both `vi.json` and `en.json` under the
  same `ThemeManagement.backgroundMainLock.*` container.
- Not verified in a browser: the rendered column in both view and edit mode,
  the em dash for an unsaved new row, column width/layout alongside the drag
  handle and other columns, and both locales (`app_locale=vi`/`en`) on the
  Background Main lock list screen.

## Follow-up: 2026-10-23b — status column alignment and color

Two UI fixes on top of the previous follow-up, reported from a screenshot
showing the status text sitting higher than its row siblings.

### Vertical alignment

`BackgroundMainLockTable`'s rows are top-aligned (`vertical-align: top` on
`.sortable :global(.ant-table-tbody) > tr > td`), with each cell adding back
its own offset so its content lines up with the row's visual center, which is
driven by the 38px thumbnail (`.priorityCell`/`.actionCell` already did
this). The status cell had no offset, so it rendered flush to the top instead
of centered. Added a `.statusCell` selector using the same `$text-offset` as
`.priorityCell` (status is plain text, like the priority index, not a control
like the date pickers), and passed `className: styles.statusCell` on the
column definition
(`.../components/BackgroundMainLockTable/index.tsx`,
`.../components/BackgroundMainLockTable/styles.module.scss`).

### Color

Grepped for an existing displayStatus color convention before choosing
anything. `BackgroundMainTableSection` (the background's own list, a
different screen) already colors its own effective-status column via the
shared `src/components/status-badge` component: a pill with
`warning -> --orange-color`/`--soft-orange-color` and
`success -> --green-color`/`--soft-green-color`
(`src/components/status-badge/status-badge.module.scss:12-20`).

This column keeps the earlier "tạm thời quy định theo text" decision (no
badge/pill), so it reuses the same two semantic color *tokens* as plain text
color rather than pulling in `StatusBadge`'s pill shape/background:
- `UPCOMING` ("Sắp khóa" / "Upcoming lock") → `var(--orange-color)`
  (`#f97316`, the same orange as the background's own "upcoming" badge).
- `ONGOING` ("Đang khóa" / "Currently locking") → `var(--green-color)`
  (`#22c55e`, the same green as the background's own "ongoing" badge).

No new colors were invented; both are the `warning`/`success` semantics
already established by `StatusBadge`. **Flagging for confirmation:** if
Vuowng wants the column to instead use the full `StatusBadge` pill (matching
`BackgroundMainTableSection` exactly, background pill included) rather than
plain colored text, that is a one-line change swapping the new `<span>` for
`<StatusBadge variant=... label=... />`, but it would also reverse the
"tạm thời quy định theo text" decision, so it was not done without
confirmation.

### Files changed
- `src/modules/system/theme-management/background-main-lock/components/BackgroundMainLockTable/index.tsx`
- `src/modules/system/theme-management/background-main-lock/components/BackgroundMainLockTable/styles.module.scss`

### Validation
- `npm run typecheck`: passed.
- `npm run lint`: passed for all touched files (0 errors/warnings).
- `npm run build`: passed; only the existing chunk-size warning.
- Not verified in a browser: that the status text now visually lines up with
  the other cells at the actual rendered row height, and the two colors
  against the table's light/default theme (dark mode was not checked either,
  consistent with the rest of this module).

## Follow-up: 2026-10-23c — ENDED label/color; INACTIVE deferred

Closes the raw-value fallback gap for `ENDED`. `INACTIVE` is intentionally
left on the fallback and flagged below rather than guessed.

### ENDED

Added `ThemeManagement.backgroundMainLock.status.ended` ("Đã kết thúc" /
"Ended") in both `vi.json` and `en.json`, mapped in
`LOCK_STATUS_LABEL_KEYS`/`LOCK_STATUS_COLOR_CLASSES`
(`.../components/BackgroundMainLockTable/index.tsx`). Color follows the same
token-reuse pattern as the previous `UPCOMING`/`ONGOING` follow-up: the
background's own `StatusBadge` convention
(`src/components/status-badge/status-badge.module.scss:34-36`) maps `ENDED`
to the `neutral` variant, `color: var(--gray-color)` (`#5d5d5d`), so the new
`.statusEnded` class in this table's `styles.module.scss` reuses that same
`--gray-color` token as plain text, consistent with the no-pill decision
already in place for this column.

As before, the GET list endpoint already filters to living locks only, so
`ENDED` is not expected in practice; it is handled anyway for defensive
consistency with the other three values.

### INACTIVE — deferred, needs Vuowng's input

`INACTIVE` is left on the raw-value fallback. Reason: in
`BackgroundMainTableSection`'s own existing convention
(`BACKGROUND_MAIN_DISPLAY_STATUS` → `StatusBadge` variant mapping,
`.../components/BackgroundMainTableSection/index.tsx:45-50`), `INACTIVE` also
maps to `neutral`/gray — the same bucket as `ENDED` — but that mapping is for
a *background's own* effective-period status, not a lock's. On a lock row,
"Tắt" (the common `ThemeManagement.common.displayStatusInactive` label used
elsewhere) reads as "the lock is turned off," which may or may not match
what `INACTIVE` means for a lock's own timing (lock not yet enabled? an
`enabled: false` row kept in the list?). The lock row already carries a
separate `enabled: boolean` field for an actual on/off toggle, and this
screen never toggles it, so `INACTIVE` co-existing with `enabled` creates
ambiguity this frontend change cannot resolve. Per the task's instruction to
flag rather than guess: **does `INACTIVE` need a lock-specific label, and if
so what should it say, and is `neutral`/`--gray-color` the right color for
it (same as `ENDED`) or should it be visually distinct from `ENDED`?**

### Files changed
- `src/modules/system/theme-management/background-main-lock/components/BackgroundMainLockTable/index.tsx`
- `src/modules/system/theme-management/background-main-lock/components/BackgroundMainLockTable/styles.module.scss`
- `src/lang/vi.json`
- `src/lang/en.json`

### Validation
- `npm run typecheck`: passed.
- `npm run lint`: passed for all touched files (0 errors/warnings).
- `npm run build`: passed; only the existing chunk-size warning.
- Key parity: the new key is present in both `vi.json` and `en.json` under
  the same `ThemeManagement.backgroundMainLock.status.*` container.
- Not verified in a browser: the ENDED label/color rendering (expected never
  to occur given the GET filter, so no live data path exercises it today).
