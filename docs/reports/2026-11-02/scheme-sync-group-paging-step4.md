# Scheme-sync group and paging URL ownership, step 4

Scope: `src/modules/products/configuration/scheme-sync/` only.

## Props, before and after (confirmed against current source)

`CashLoanTab` before: `schemeTypeCounts, selectedGroup, onSelectGroup, noSearchFilter, rowsPage, rowsLoading, rowsError, onRetryRows, page, pageSize, onPageChange, onPageSizeChange`.
`CashLoanTab` after: `schemeTypeCounts, noSearchFilter, rowsPage, rowsLoading, rowsError, onRetryRows`.

`KpiCards` before: `selectedGroup, counts, onSelectGroup`. After: `counts`.

`ResultsTable` before and after (unchanged): `group, dataSource, loading, emptyText, activeRowId, onSchemeClick, onCompare`.

## New shared helpers (pure, no React or component imports)

- `utils/scheme-sync-paging-url.helper.ts` exports `readPage`, `readPageSize`, `writePaging`. `readNonNegativeInt` stays private (no outside consumer). Logic and defaults are moved verbatim from `SchemeSyncPage`, including the `SCHEME_SYNC_ROWS_PAGE_SIZE` default.
- `utils/scheme-sync-group-url.helper.ts` exports `readGroup` (same normalization as the old `normalizeGroup`, falls back to `NEW`) and `writeGroupChange(params, group)`. It does the combined edit: set group, clear `loanInsuranceType`/`status`, reset page to 0 while keeping the current pageSize. It is one mutation of the passed `params`.

## Changes

- `SchemeSyncPage`: local `normalizeGroup`, `readNonNegativeInt`, `readPage`, `readPageSize`, `writePaging`, `handlePageChange`, `handlePageSizeChange` deleted. `selectedGroup`, `page`, `pageSize` are still computed (via the helpers) for `useSchemeSyncRows` and `useSchemeSyncPublish`. `setGroup` is now `editParams((next) => writeGroupChange(next, group))`, with the `editParams`/`latestParamsRef` mechanism unchanged. The import flow still receives `setGroup`/`setAppliedFilters`; its hook file is untouched. `<CashLoanTab />` now gets `schemeTypeCounts, noSearchFilter, rowsPage, rowsLoading, rowsError, onRetryRows`.
- `CashLoanTab`: own `useSearchParams()`. It computes `selectedGroup`, `page`, `pageSize` from it. Local `handlePageChange` and `handlePageSizeChange` each make one `setSearchParams(next, { replace: true })`. Page-size change resets page to 0 (`writePaging(next, 0, size)`). The `current={page + 1}` and `newPage - 1` conversion is kept. `selectedGroup` is still passed to `FilterBar` and `ResultsTable` and used for the REVIEW/UNCHANGED banners.
- `KpiCards`: own `useSearchParams()`. Click and keyboard handlers call one local `handleSelectGroup`, which runs `writeGroupChange` and a single `setSearchParams(next, { replace: true })`.

## `ResultsTable.group` kept

`group` drives the column set, column widths and the row class in `ResultsTable`, so it is rendering logic, not pass-through. `CashLoanTab` needs `selectedGroup` locally anyway (banners, `FilterBar` prop), so passing it one hop to `ResultsTable` is a direct parent-to-child prop. `ResultsTable` was not edited and does not read the URL.

## CustomPagination location

`CustomPagination` (`@/components/pagination`, not edited) is rendered in `CashLoanTab` as a sibling of `<ResultsTable />`, not inside it. `ResultsTable` never had paging props. So `CashLoanTab` itself, which owns the call site, now reads and writes paging via the URL. Nothing was moved into `ResultsTable`.

## Consumer check

Grepped the module for `normalizeGroup`, `readNonNegativeInt`, `readPage`, `readPageSize`, `writePaging`, `handlePageChange`, `handlePageSizeChange`, `onSelectGroup`, `CashLoanTabProps`, `KpiCardsProps`. Only the edited files referenced them. `CashLoanTab` is mounted only by `SchemeSyncPage` and `KpiCards` only by `CashLoanTab`. `routes/pages.tsx` imports `SchemeSyncPage` only (lazy default export unchanged).

## Not touched

No query key, service, route, `PageURLs`, permission file, `FilterBar`, `useSchemeSyncImportFlow.hook.tsx`, `useSchemeSyncRows`, `@/components/pagination`, or `.claude/settings.local.json`. No enum, Context, Redux or new global state.

## Validation

- `npm run typecheck`: passes. The first run caught an unused `SyncGroup` import in `CashLoanTab`, which I removed.
- `npm run lint`: passes (max-warnings 0).
- `npm run prettier`: fails repo-wide on the known baseline (854 files). `npx prettier --check` on the changed and new files is clean.
- `npm run build`: succeeds, only the usual chunk-size warning.

No browser run. These checks prove nothing about rendered behaviour.

## Manual browser checklist

- Click a KPI card: group changes, `loanInsuranceType` and `status` are cleared, page resets to 0, and the URL updates in one step (one history-replace).
- Change page, then page size: behaves as before. A page-size change resets to page 0. Defaults leave `page`/`pageSize` out of the URL.
- Reload or deep-link with only `?group=`: correct KPI selection and page 0.
- Import redirect: lands in the right group with `source=IMPORT` in the URL and in the `FilterBar` draft.
- Keyboard Enter/Space on a KPI card behaves like a click.

## Notes for the reviewer

- The `CashLoanTab` and `KpiCards` handlers build from render-time `searchParams`. This is safe because each is a single user-driven write. `SchemeSyncPage.setGroup` keeps `editParams` for the import flow's two same-tick writes.
- `CashLoanTab` still has the step-1 working-tree changes (already present before this task).

## Test debt

`readGroup`, `writeGroupChange`, `readPage`, `readPageSize`, `writePaging` are pure and good first unit-test candidates once a runner exists: malformed values, default omission, group change clearing filters while keeping pageSize.
