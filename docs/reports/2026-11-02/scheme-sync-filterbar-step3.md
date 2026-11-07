# Scheme-sync FilterBar URL ownership, step 3

Scope: `src/modules/products/configuration/scheme-sync/` only.

## Props, before and after

`CashLoanTab` before: `schemeTypeCounts, selectedGroup, onSelectGroup, draftFilters, appliedFilters, onDraftFilterChange, onApplyFilters, onClearFilter, onResetFilters, noSearchFilter, rowsPage, rowsLoading, rowsError, onRetryRows, page, pageSize, onPageChange, onPageSizeChange`.

`CashLoanTab` after: `schemeTypeCounts, selectedGroup, onSelectGroup, noSearchFilter, rowsPage, rowsLoading, rowsError, onRetryRows, page, pageSize, onPageChange, onPageSizeChange`.

`FilterBar` before: 28 props (`selectedGroup`, draft values and their change callbacks, six `applied*` values, `onApplyFilters`, `onClearFilter`, `searching`, `onResetFilters`).

`FilterBar` after: `selectedGroup: SyncGroup`, `searching?: boolean`.

`CashLoanTab` renders `<FilterBar selectedGroup={selectedGroup} searching={rowsLoading} />`. `CashLoanFilterValues` and `CashLoanFilterKey` are still exported from `CashLoanTab`. `noSearchFilter` is unchanged and still computed in `SchemeSyncPage`.

## Shared helper

`utils/scheme-sync-filters-url.helper.ts` (pure, no React). It holds the five exported helpers moved verbatim: `createEmptyFilters`, `normalizeFilters`, `clearGroupSpecificFilters`, `readAppliedFilters`, `writeAppliedFilters`. `readText`, `readOneOf`, `INSURANCE_TYPES`, `PUBLISH_FILTER_STATUSES` and `IMPORT_SOURCES` moved too and stay unexported. Neither importer needs them.

Importers:
- `views/SchemeSyncPage/index.tsx` imports `clearGroupSpecificFilters`, `readAppliedFilters`, `writeAppliedFilters`.
- `components/FilterBar/index.tsx` imports all five.

`readPage`, `readPageSize`, `writePaging`, `readNonNegativeInt`, `normalizeGroup` and `editParams`/`latestParamsRef` stay in `SchemeSyncPage`. The page also dropped the now-unused `ImportSource`, `InsuranceType`, `PublishFilterStatus` and `CashLoanFilterKey` imports.

## FilterBar behaviour

- `appliedFilters` is `useMemo(readAppliedFilters(searchParams))`.
- `draftFilters` is local `useState` with a lazy seed from the URL, once.
- Apply, clear-one and reset-all each make one `setSearchParams(next, { replace: true })`. They write the filters and `next.delete('page')` into the same `next`. `pageSize` is untouched. Typing only updates the draft.
- The local `FilterKey` type is replaced by `CashLoanFilterKey`.

## selectedGroup-triggered draft resync, and a deviation

Implemented as the contract suggested (mount-skip ref, `useEffect`), with one deliberate deviation.

The effect depends on `[selectedGroup, appliedFilters.source]`, not only `selectedGroup`. A `previousGroupRef` detects whether the group actually changed.
- If the group changed, the draft's `loanInsuranceType` and `status` are cleared.
- In every run, the draft `source` is set to the applied `source`.

Why: an import can land in the group that is already selected. `selectedGroup` then does not change, so a group-only effect would not fire. The Source input would then not show "Import" even though the URL has `source=IMPORT`. Today's code sets the draft source unconditionally, so a group-only effect would regress this case. The applied `source` is read from the render-time `searchParams`, which already contain the page's writes by the time the effect runs.

Acknowledged behaviour deviations:
1. Uncommitted `source` draft. Before: a manual group switch left an uncommitted `source` selection alone. Now: it is overwritten by the applied `source`.
2. Same overwrite also happens whenever the applied `source` changes without a group change (Apply, chip clear, reset, import). In those paths the draft already equals the applied value, so it is a no-op in practice.
3. In StrictMode dev double-invoke, the effect can run once at mount. It only sets draft `source` to the applied value that seeded it, so it is harmless.

Assumption: in the import redirect, `setGroup` and `setAppliedFilters` write the URL back to back, and the page's `latestParamsRef` accumulates both. This assumes they are committed in one render, or that the `source` write is not seen later than the group write. If the router committed them in separate renders, the effect depends on `appliedFilters.source`, so it re-runs when `source` arrives and still lands the right value.

## `hooks/useSchemeSyncImportFlow.hook.tsx`

The only changes: `setDraftFilters` removed from `UseSchemeSyncImportFlowParams`, from the destructured params, and its one call in `handleImported`. Nothing else in the file changed (`git diff` shows 3 deleted lines). `ImportSource` and `CashLoanFilterValues` imports remain in use.

## Not touched

No query key, `src/services/**`, route, `PageURLs`, or permission file. `.claude/settings.local.json` was not touched. `SyncStatusModal/index.tsx` and the other `CashLoanTab` changes (step 1) were already modified in the working tree before this task and I did not edit them.

## Validation

- `npm run typecheck`: passes.
- `npm run lint`: passes (max-warnings 0).
- `npm run prettier`: fails repo-wide on the known baseline (854 files). `npx prettier --check` on the five files I changed or created: clean.
- `npm run build`: succeeds, only the usual chunk-size warning.

No browser run, so nothing here proves rendered behaviour.

## Manual checklist (not run)

- Typing in a filter field does not change results until Apply.
- Apply updates the URL and the table together in one write, with the page reset to 0.
- Clearing one chip and Reset all behave as before, including the page reset.
- Reloading after applying filters shows the same draft and applied state.
- A deep link with only `?group=` renders empty filters.
- Switching group clears BHKV and status in the filter inputs, not just the results.
- Completing an import shows "Import" in the Source input immediately, including when the import lands in the already-selected group.
- Back/forward: writes use `replace`, so no history entries per change (same as step 2).

## Test debt

Pure helpers in `utils/scheme-sync-filters-url.helper.ts` (`readAppliedFilters`/`writeAppliedFilters` round-trips, malformed values, `clearGroupSpecificFilters`) are good first unit-test candidates once a runner exists.
