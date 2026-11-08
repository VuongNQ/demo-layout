# Industry-Product Edit (Surface A) - Three Audit Fixes

Source audit: `docs/audits/products-configuration/2026-11-03-cash-loan-settings-form.md`
(Blocking Findings 1 and 2, Other Findings MEDIUM dead code). Surface B
(`CashLoanQuickEdit`) was not touched.

## Fix 1 - break the onValuesChange <-> Redux re-sync loop

Files: `edit/general.tsx`, `edit/rule.tsx`.

- Added `lastWrittenDraft = useRef<IndustryDetail>()` in each tab.
- `handleValuesChange` sets `lastWrittenDraft.current = dataChange` immediately
  before `dispatch(onChangeDataTempUpdate(dataChange))`.
- The draft-to-form effect now starts with: if the selected draft is
  reference-equal to `lastWrittenDraft.current`, clear the ref and return
  (skip `setFieldsValue`). Otherwise the effect behaves exactly as before.
  The ref is cleared on consumption so a later re-run of the same effect for
  another dependency (in `rule.tsx`, `customerSegmentMap` changing) still
  re-seeds the form.
- A WHY comment was added at each effect. No other effect, date derivation or
  segment logic changed.

Trace (reading final code only):
(a) User types -> `onValuesChange` -> ref = dataChange -> dispatch -> the
reducer stores that same object reference (Immer keeps the assigned plain
object's identity) -> selector returns it -> effect runs, `draft ===
ref.current` -> ref cleared, return. No `setFieldsValue`, so no re-entrant
`onValuesChange`, so no further dispatch. The chain ends after one lap.
(b) First load: `form.tsx` dispatches `onChangeDataTempUpdate(industryDetail)`
(it does not touch the ref) -> effect runs with ref `undefined` -> no match ->
`setFieldsValue` seeds the form once. Tab switch / remount: the new component
instance has a fresh ref (`undefined`), so the draft written by the other tab
is applied once. A draft written by another source while this ref holds a stale
value also does not match (different reference) and is applied.

## Fix 2 - stop misusing the shared `loading` flag

File: `src/redux/slices/product-industry.slice.ts`.
`onChangeDataTempUpdate` changed from `create.asyncThunk` (pending set
`loading = true`, fulfilled set it false, rejected cleared the draft) to
`create.reducer<IndustryDetail | undefined>` that only does
`state.dataTempUpdate = action.payload`.

Call sites: `dispatch(onChangeDataTempUpdate(x))` is unchanged in `general.tsx`,
`rule.tsx` and `form.tsx:75` (the only other caller; it ignores the return
value). The export surface is unchanged (same name in `industrySlice.actions`).
Behavior note: the old `rejected` branch could not occur (payload creator never
throws), so nothing is lost. `form.tsx`'s seeding dispatch no longer pulses
`loading`; `getIndustryDetail` still owns `loading` for that request.

Trace (c): after the edit, `loading` is assigned only inside
`getListIndustries`, `getIndustryDetail`, `updateIndustry`,
`updateIndustryStatus`, `getListProductGroups`, `getListHistories`,
`getProductSegment`, `getListUpdatedHistories`. The new reducer body (slice
lines ~227-231) contains no `loading` reference.

## Fix 3 - dead code removal

Re-run repo-wide greps (`grep -rn` over `src/`, excluding the files' own
definitions) for `CashLoanSimulationSetting`, `CustomerSegmentSection`,
`cash-loan-simulation`, `rule-sections`, `general-sections`, `./custom`:
zero importers. `CashLoanSimulation` matches only the unrelated global type
`CashLoanSimulation` in `src/types/product-industry.d.ts` and
`form-values.types.ts`; the component of that name was imported only by the
also-deleted `general-sections/cash-loan-simulation.tsx`. `Custom` was imported
only by the also-deleted `cash-loan-simulation/index.tsx`. The files were
deleted as a connected dead set.

Deleted:
- `edit/general-sections/cash-loan-simulation.tsx`
- `edit/cash-loan-simulation/index.tsx`
- `edit/cash-loan-simulation/custom.tsx` (directory removed with them)
- `edit/rule-sections/customer-segment.tsx` (directory became empty and is gone)

`general.tsx`: before removing the `'simulationType' in changedValues` branch I
confirmed the rendered tree is only `CashLoanGeneral` / `CreditCardGeneral`
(`../general/*`), which never mount the simulation fields. Removed the branch,
the now-unused `changedValues` parameter, and the now-unused `resetFieldErrors`
import (lint flagged it). The `initialValues` object was left as-is.

`ultis.tsx` (lines ~98-116): comment reworded only. The old text "CL CC2 fields
are not mounted" is vague; new text says the General tab does not mount these
CL fields and the GET-detail values are restored so the draft keeps what the
backend returned. Mapping logic untouched.

Note, not acted on: `edit/general-sections/` still contains `display-schedule.tsx`,
`image.tsx`, `signing-method.tsx`, and grep shows no importers of
`general-sections` anywhere, so they look dead too. Out of scope; flagged for
the team.

Trace (d): `grep -rnE "CashLoanSimulationSetting|CustomerSegmentSection|cash-loan-simulation|rule-sections/customer-segment" src` returns 0 lines.

## Validation

- `npm run typecheck`: FAILS, but only with 3 errors in
  `scheme-sync/import/utils/import-error-workbook.helper.ts` (`exceljs` module
  not installed in this checkout, plus two implicit-any errors derived from
  it). Confirmed pre-existing: the same errors appear with my changes stashed.
  No errors in any file I touched (an unused-import error in `general.tsx`
  appeared mid-work and was fixed).
- `npm run lint`: PASS (0 problems, `--max-warnings 0`).
- `npm run build`: FAILS because it runs typecheck first; `build:bundle`
  alone also fails in the Rolldown step, consistent with the unresolved
  `exceljs` import in the same file. Not caused by this change.

These checks do not prove runtime or browser behavior.

## Needs browser verification (NOT done; no browser was used)

A human must open the Industry-Product edit screen, General and Rule tabs, with
React DevTools Profiler or console render-count logging, and confirm that:
typing in a field no longer produces a sustained re-render chain, the
full-form spinner no longer flickers on keystrokes, initial load and
General<->Rule tab switching still populate fields correctly (including dates,
image, signing method, excludes selection and blacklist/face-check switch),
and saving still submits the expected payload.

## Test debt

`formatDataIndustryDetail` (mapper) and the new reference-skip guard are the
deterministic candidates once a test runner exists.
