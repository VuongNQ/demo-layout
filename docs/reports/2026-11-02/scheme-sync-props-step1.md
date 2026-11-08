# Scheme Sync: remove duplicate server-data props (step 1)

Date: 2026-11-02. Scope: `src/modules/products/configuration/scheme-sync/` only. Risk: MODERATE (isolated component props, no API/route/permission/query-key change).

## Files changed

- `components/CashLoanTab/index.tsx`
- `components/SyncStatusModal/index.tsx`
- `views/SchemeSyncPage/index.tsx`

## Props: before / after

### CashLoanTab

Removed: `pendingSession: SyncSession | null`, `fallbackCounts?: SyncCounts`, `resultSessionId?: string`.

Retained unchanged: `schemeTypeCounts`, `selectedGroup`, `onSelectGroup`, `draftFilters`, `appliedFilters`, `onDraftFilterChange`, `onApplyFilters`, `onClearFilter`, `onResetFilters`, `noSearchFilter`, `rowsPage`, `rowsLoading`, `rowsError`, `onRetryRows`, `page`, `pageSize`, `onPageChange`, `onPageSizeChange`.

The component now reads the overview itself and derives the three values verbatim from the page's former derivation:

```ts
const overviewQuery = useQuery({ ...schemeSyncQueryKeys.overview() });
const overview = overviewQuery.data ?? null;
const resultSession = overview?.latestResult ?? null;
const pendingSession = resultSession?.status === 'PENDING_CONFIRMATION' ? resultSession : null;
const fallbackCounts = resultSession?.counts;
const resultSessionId = resultSession?.id;
```

Internal usages (pending Alert, `counts={schemeTypeCounts ?? fallbackCounts}`, UNCHANGED banner fallback, `openScheme` `sessionId={resultSessionId ?? 'latest'}`) are untouched. The unused `SyncSession` type import was removed (confirmed no other use).

### SyncStatusModal

Removed: `initialSession?: SyncSession | null` (default `null`).
Retained: `sessionId`, `initialError`, `startOnOpen`, `canEdit`, `onRetryStart`.

Internal edits: `useSchemeSyncSessionQuery(activeSessionId)`; `waitingForAutoStart` and the auto-start effect guard/deps dropped the `initialSession` clause; unused `SyncSession` type import removed (no other use).

### SchemeSyncPage (call sites only)

- Removed `pendingSession`, `fallbackCounts`, `resultSessionId` from `<CashLoanTab />`.
- Removed `initialSession={session}` from `<SyncStatusModal />` in `openStatus`.
- Deleted the page-local `pendingSession` const: after the prop removal it had no remaining reader (grep confirmed). The `SyncSession` import stays (used by `openStatus`'s parameter type).
- `overviewQuery`, `overview`, `resultSession`, `runningSession`, `runningSessionId` and all URL-state code untouched.

## Query key and network behavior

The key is the existing `schemeSyncQueryKeys.overview()` (`queryKeys/scheme-sync.query-keys.ts`, not edited): same key, `queryFn`, and `refetchInterval`. No new key was introduced. No new network request is added: the page, `CashLoanTab` and `SyncStatusModal` are independent observers of one cache entry, which TanStack Query dedupes to one request and one polling interval.

## SyncStatusModal cache-already-populated verification (holds; prop removed)

Re-read from current source:

1. The page mounts an always-enabled `useQuery({ ...schemeSyncQueryKeys.overview() })` for its lifetime. `SyncStatusModal` is only opened via `openStatus` from that page (`startSync`, `handleStartSync`); no other opener exists in the module's page code.
2. `startSync()` calls `openStatus(session)` only after `startSyncMutation.mutateAsync()` resolves. `useStartSyncMutation.onSuccess` (`hooks/scheme-sync.queries.hook.ts`) does `setQueryData(overview().queryKey, ...)` setting `latestAttempt = session` (plus `runningSession`/`latestResult` as applicable). `useSchemeSyncSessionQuery`'s `select` looks up the session by id in `runningSession`/`latestAttempt`/`latestResult`, so it finds the session on first render.
3. `handleStartSync` "already running" path: `runningSession` comes from `overview?.runningSession`, so the cache is loaded when it is reachable; `select` finds it via `runningSession`.
4. `SyncStatusModal` still mounts its own `useQuery({ ...overview() })` (line ~97), confirmed present.
5. The auto-start (`startOnOpen`) path is not used by the page; with `initialSession` always null there, removing the clause is behavior-identical. The clause could only differ when `initialSession` was set while `sessionId` was undefined, which the page never does (it passes `sessionId={session?.id}` together with it).

Residual edge (not a regression found, but note for reviewer): if a synchronous run finishes and `invalidateSchemeSyncData` refetch returns an overview in which that session id is no longer in any of the three slots, the modal previously fell back to the seed `initialSession`; it now shows the failed/empty state. This requires a newer session to have replaced it within the refetch window and was not observed in the code paths above.

## Contradictions with the audit

None material. Line numbers in the contract matched current source for the edited regions. The audit's claim that the page's `pendingSession` has no other reader was correct.

## Validation

- `npm run typecheck`: pass (both tsconfig projects).
- `npm run lint`: pass (`--max-warnings 0`).
- `npx prettier --check` on the 3 touched files: initially flagged `SyncStatusModal/index.tsx` (the shortened `waitingForAutoStart` condition fits on one line; HEAD version was clean), fixed with `prettier --write` on that file only; touched files are now formatted.
- `npm run prettier` (repo-wide): fails with the known pre-existing baseline ("Code style issues found in 855 files"); not related to this task.
- `npm run build`: pass (only the existing chunk-size warning).

## Not verified (no browser, no test runner)

Reviewer checklist:

- Opening the sync-status modal shows the same session data as before, with no extra network request (same key, deduped).
- Starting a sync and watching it run still polls (1s while `runningSession`) and updates the modal and the KPI cards identically; modal opens straight into the session (no loading flash) after start.
- Open the modal while a sync is already running (button shows "Đang đồng bộ…"): session displays immediately.
- `CashLoanTab` KPI cards / group selector are unchanged; when `schemeTypeCounts` (kpiCounts) is null the KPI cards and UNCHANGED banner fall back to the latest result counts.
- PENDING_CONFIRMATION warning Alert still appears; scheme detail modal still receives the latest result session id (or `'latest'`).

## Test debt

No test runner exists. Candidates: derivation of pending/fallback values from an overview fixture; `useSchemeSyncSessionQuery` select behavior with and without seed data.

## Found but out of scope

None new; `rowsPage`/`kpiCounts` merge logic, `lastImportResult` dual ownership and split notification ownership untouched as instructed.
