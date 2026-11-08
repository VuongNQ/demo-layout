# Codebase Analysis: scheme-sync component data flow and props audit

Revision `20f998b`, branch `portal-cham-vay`, date 2026-11-02. Working tree was clean at start. This is static inspection only: no typecheck, lint, build or runtime run. Mandatory reading done: CLAUDE.md, rules 00/01/02/03/04/05/06/07/08/09/10/11 (as injected), PROJECT_CONTEXT.md (grep of scheme-sync entries only).

Staleness warning: CLAUDE.md and PROJECT_CONTEXT.md describe an older layout (`scheme-sync.queries.hook.ts` at module root, `import/services/index.ts`, 23 files). Current source differs and is the authority. The task's kebab-case file names (`filter-bar.tsx`, `results-table.tsx`, and so on) do not exist. Each is a PascalCase folder, `components/<Name>/index.tsx`.

## 1. Task Understanding
Produce the current data-flow and props map of `src/modules/products/configuration/scheme-sync/`. It should support a later refactor that replaces prop drilling with TanStack Query cache reads and moves shareable filter state to URL state. This is analysis only.

## 2. Entry Point
- CONFIRMED: `views/SchemeSyncPage/index.tsx` is the page/container (382 lines), default export `SchemeSyncPage`.
- Lazy declaration: `src/routes/pages.tsx:19` (`lazy(() => import('.../views/SchemeSyncPage'))`).
- Route: `src/routes/main.routes.tsx:183-192`. Path is `withPrefix('product/configuration/scheme-sync')`. It uses `WithGuard Page={SchemeSyncPage} Guard={AuthGuard} permissions={[PERMISSIONS.PRODUCT_SCHEME_SYNC_CLASSIFICATION_VIEW]}`. `main.routes` is imported by `src/routes/index.tsx:13`. `src/routes/index.tsx` itself has no scheme-sync reference.
- `src/utils/navigate.ts:170` defines `PageURLs.ofSchemeSync(group?)`, which returns `/product/configuration/scheme-sync?group=<g>`. `src/helpers/menus.helper.ts:357-358` holds the menu entry.
- Edit permission is checked in the page: `PRODUCT_SCHEME_SYNC_CLASSIFICATION_EDIT` (page line 49).

## 3. Feature Flow
```
Route -> SchemeSyncPage
  queries: overview (poll 1s while running), cashLoanStats
  hooks:   useSchemeSyncImportFlow (summary queries + lastImportResult state + import modals)
           useSchemeSyncRows (rows + import-items queries, client merge/sort/paginate)
           useSchemeSyncPublish (publish eligibility + notifications)
  -> Tabs -> CashLoanTab (single tab) -> KpiCards / FilterBar / ResultsTable / CustomPagination / ComparisonDrawer
  modals opened imperatively via useModal().openModal:
     SchemeDetailModal (from CashLoanTab), SyncStatusModal, SyncHistoryModal, ImportModal -> ImportPreviewModal
  PublishModal is rendered declaratively by the page.
```

## 4. Files Involved (line counts)
Totals: 9084 lines across all files, including .scss.

| File | Lines |
|---|---|
| views/SchemeSyncPage/index.tsx | 382 |
| components/CashLoanTab/index.tsx | 216 |
| components/FilterBar/index.tsx | 379 |
| components/ResultsTable/index.tsx | 379 |
| components/KpiCards/index.tsx | 109 |
| components/ComparisonDrawer/index.tsx | 135 |
| components/SchemeDetailModal/index.tsx | 134 |
| components/SyncStatusModal/index.tsx | 321 |
| components/SyncHistoryModal/index.tsx | 493 |
| components/SyncScheduleConfig/index.tsx | 293 |
| components/PublishModal/index.tsx | 236 |
| components/SyncLoadingOverlay/index.tsx | 14 |
| hooks/scheme-sync.queries.hook.ts | 113 |
| hooks/useSchemeSync.ts | 22 |
| hooks/useSchemeSyncImportFlow.hook.tsx | 184 |
| hooks/useSchemeSyncPublish.hook.ts | 107 |
| hooks/useSchemeSyncRows.hook.ts | 172 |
| queryKeys/scheme-sync.query-keys.ts | 107 |
| constant.ts / scheme-sync.tokens.ts / _chip.scss / scheme-sync.module.scss | 28 / 42 / 45 / 111 |
| utils/: comparison-drawer.helper 223, presentation 41, publish.helper 52, results-table.helper 261, scheme-detail-modal.helper 23, scheme-sync.mapper 294, sync-history-modal.helper 133 | |

import/:
| File | Lines |
|---|---|
| components/ImportCancelConfirmModal | 28 |
| components/ImportConfirmModal | 29 |
| components/ImportErrorList | 40 |
| components/ImportHistoryTab | 285 |
| components/ImportModal | 203 |
| components/ImportPreviewModal | 269 |
| components/ImportPreviewTable | 110 |
| components/PublishHistoryTab | 335 |
| constant.ts | 113 |
| hooks/scheme-import.queries.hook.ts | 92 |
| queryKeys/scheme-import.query-keys.ts | 58 |
| utils/import-error-workbook.helper.ts | 140 |
| utils/import-preview-table.helper.ts | 83 |

Each component folder also has a `styles.module.scss`. There is no `import/services/` any more. Services live outside the module in `src/services/products/` (`scheme-sync.service.ts`, `scheme-import.service.ts`, `*.types.ts`). That is target-compatible per `03-api-service.md` `## Service location`.

Cross-module consumer: `src/components/product-configuration/shared/history/history-comparison.helper.ts:2` imports `mapChangedField` from `utils/comparison-drawer.helper`. `src/modules/products/configuration/product-labels/index.tsx` uses a different `CashLoanTab`, not this one. No external consumer of `schemeSyncQueryKeys` or of the module hooks was found.

## 5. State Ownership
Page `useState` (`SchemeSyncPage/index.tsx`):
| State | Line |
|---|---|
| `draftFilters` | 63 |
| `appliedFilters` | 64 |
| `page` | 65 |
| `pageSize` | 66 |
| `isStartingSync` | 67 |

- There is no `useReducer` and no sort state in the page. Sort is hard-coded on the client (`useSchemeSyncRows` `sortKey`, line 53, localeCompare) and `sort: 'schemeCode,asc'` on the server request (`scheme-sync.service.ts:119`).
- URL state: only `group`, through `useSearchParams` from `react-router-dom` (page lines 35 and 44). `selectedGroup = normalizeGroup(searchParams.get('group'))` (line 52). `setGroup` writes it with `replace: true` (76-83). Filters (productCode, schemeCode, bizLine, loanInsuranceType, status, source), page and pageSize are NOT in the URL. They are lost on refresh and cannot be shared.
- Group-change side effect: `setGroup` clears `loanInsuranceType` and `status` in both draft and applied filters and resets page to 0.
- Other owners:
  - `useSchemeSyncImportFlow` holds `lastImportResult` and `confirmedImport` (lines 61 and 66).
  - `useSchemeSyncPublish` holds `publishModalOpen` and `isPublishing` (lines 41-42).
  - `CashLoanTab` holds `comparisonRow` (line 86).
  - `SyncHistoryTab` (inside `SyncHistoryModal`, line 187) holds its own page, pageSize, draft/applied filters and sort. `ImportHistoryTab` and `PublishHistoryTab` hold their own page, pageSize, keyword and status in `useState`.
- Draft/applied model: filters apply only on "Apply" (`handleApplyFilters`, line 134). A URL design must keep that two-stage semantic or deliberately drop it.
- Redux: used only for notifications (`setNotification` dispatch), plus `watchUser` in `SyncScheduleConfig`. No server data is in Redux.

`useQuery` import source per file. No file in the module imports `@/hooks/query.hook` (grep `from '@/hooks/query` returns zero). All use `@tanstack/react-query`:
| File | Import source |
|---|---|
| views/SchemeSyncPage/index.tsx:32 | @tanstack/react-query |
| hooks/scheme-sync.queries.hook.ts:13 | @tanstack/react-query |
| hooks/useSchemeSyncRows.hook.ts:2 | @tanstack/react-query |
| hooks/useSchemeSyncImportFlow.hook.tsx:2 | @tanstack/react-query |
| components/SyncStatusModal/index.tsx:16 | @tanstack/react-query |
| import/components/ImportHistoryTab/index.tsx:16 | @tanstack/react-query |
| import/components/PublishHistoryTab/index.tsx:18 | @tanstack/react-query |

SchemeDetailModal, SyncHistoryModal, SyncScheduleConfig and PublishModal reach Query only via module hooks. `src/hooks/query.hook.ts:7` exports its own `useQuery`. It is not used here.

## 6. API Flow
Base path `api/admin/portal/v1/schemes/synchronization` (service line 29). All calls go through `window.apiFetcher`. Services have runtime guards (`requirePageResponse`, etc.) that already exist; preserve them.

Single-record detail (item 6, CONFIRMED):
- `schemeSyncApi.getSchemeDetail(schemeId: number, {synchronizationId?, businessLine?})` calls `GET {base}/schemes/{schemeId}` (service lines 175-183). It returns `SchemeSynchronizationSchemeResponse`: the summary plus `mainScheme` and `insuranceSchemes`.
- The list (`getSchemes` / `getRows`, `GET {base}/schemes`) returns `SchemeSynchronizationSchemeSummaryResponse`, which does not carry `mainScheme` or `insuranceSchemes` (types lines 66 and 183-185). Detail data therefore does not exist inside the list response.
- The UI path is `schemeSyncApi.getScheme(id, code)` (lines 235-256). `Number(code)` is the schemeId. If `code` is not an integer, it first does `GET {base}/schemes?schemeCode=<code>&page=0&size=1` to resolve `items[0].id`, then calls `getSchemeDetail`. `Number(id)` is the synchronizationId and is ignored when it is NaN. `CashLoanTab` passes `resultSessionId ?? 'latest'` (line 96), so for `'latest'` the synchronizationId is NaN and undefined. The `sessionId` in the `scheme(sessionId, code)` query key therefore only affects cache identity, not the request.
- A child can fetch its own detail by id, but it needs the numeric scheme id or the scheme code. `ResultsTable` passes `(row, schemeCode)` with a code string (`results-table.helper`, `renderSchemes`, ResultsTable:246-258). Whether `SyncResultRow.id` equals the backend scheme id is NEEDS-VERIFICATION (see `scheme-sync.mapper.toSyncPage`; not traced).
- Other endpoints:
  - `GET {base}/scheme-types` (stats).
  - `GET {base}` (history, overview).
  - `GET/PUT {base}/job/config`.
  - `POST {base}/job/run-now`.
  - `POST {base}/publish`.
  - `GET {base}/business-lines`: `getBusinessLines` has no consumer outside the service file (grep). It is likely dead code.
  - `getSession` and `getSchemes` also have no external consumers (LIKELY dead). Import APIs are in `src/services/products/scheme-import.service.ts`, not traced in depth.
- `startSync` polls `getOverview` up to 10 times at 500 ms after `run-now` (lines 196-216).

## 7. Type/Data Flow
- `SchemeSynchronizationSchemeSummaryResponse` -> `toSyncPage` / `toSyncResultRow` (mapper) -> `SyncResultRow`. It is rendered by ResultsTable and passed to ComparisonDrawer (`ProductSnapshot` current/proposed).
- Import item -> `toSyncResultRowFromImportItem` -> merged into the same `SyncResultRow[]` in `useSchemeSyncRows`. Server pagination is bypassed: the hook bulk-fetches `size: 1000` (`BULK_FETCH_SIZE`) and merges, sorts and slices on the client (lines 29, 146-158). This is the main constraint for any "cache read" refactor: `rowsPage` is a derived merge, not a cache entry.
- `CashLoanFilterValues` (exported from `CashLoanTab`) is imported by `useSchemeSyncRows` and `useSchemeSyncImportFlow` (type-only). The hooks therefore depend on a component file for a type. That is an inverted dependency.
- Counts: `cashLoanStats` (`SchemeSynchronizationTypeResponse`) -> `toSyncCounts` -> `schemeTypeCounts`. `kpiCounts` = `schemeTypeCounts` + `lastImportResult` counts when an import is pending (rows hook 131-140). `KpiCards` gets `kpiCounts ?? fallbackCounts` (`resultSession.counts`).

## 8. Form Flow
Only `SyncScheduleConfig` uses an AntD `Form.useForm` (line 79). Edit initialises with `setFieldsValue` from query data at `startEditing` (95-104) and `resetFields` on cancel. The form is not re-seeded by background refetch, which is dirty-safe. It builds a payload with `updatedBy` from the Redux user. FilterBar uses controlled inputs fed by `draftFilters`, not an AntD Form. Zod is not used in the module.

## 9. Routing & Permission Flow
One route (item 2). View permission is checked at the route. Edit permission is checked in the page and passed down as `canEdit` / `canEditSchedule`. `SyncStatusModal` navigates via `PageURLs.ofSchemeSync(group)` (line 141), which sets `?group=`. Moving filters to the URL touches these deep links. Routing is HIGH-RISK per the rules, but no route change is needed for the proposed refactor beyond search params. Not verified: menu permissions and the trailing-slash path.

## 10. Dependencies & Consumers

### 10a. Query key factory (`queryKeys/scheme-sync.query-keys.ts`)
| Method | Returns | Params normalised? |
|---|---|---|
| `all` | `['scheme-sync']` | n/a |
| `overview()` | `queryOptions({queryKey: [...all,'overview'], queryFn: getOverview, refetchInterval: 1000 while data.runningSession})` | no params |
| `cashLoanStats()` | `queryOptions({[...all,'cash-loan-stats'], staleTime: CACHE_STALE_TIME (60_000), queryFn: getSchemeTypes then find CL})` | no params |
| `rowsAll()` | `[...all,'rows']` | prefix |
| `rows(params, enabled=true)` | `queryOptions({[...rowsAll(), normalizeRowsKeyParams(params)], queryFn: getRows(...), enabled, staleTime: Infinity, placeholderData: keepPreviousData})` | key YES (`normalizeRowsKeyParams` turns `''` into `undefined`). Caveat: `queryFn` uses the raw `params` (partly `|| undefined`), not the normalised copy. |
| `session(id?)` | `[...all,'session',id]` | no consumer found (LIKELY dead) |
| `scheme(sessionId, schemeCode)` | `[...all,'scheme',sessionId,schemeCode]` | no |
| `jobConfig()` | `[...all,'job-config']` | none |
| `synchronizationsAll()` | `[...all,'synchronizations']` | prefix |
| `synchronizations(query?)` | `[...synchronizationsAll(), query]` | NO. The raw object goes into the key (TanStack hashes objects stably, so undefined props don't differ). |
| `importSummaryAll(importId?)` | `[...all,'import-summary', importId ?? 'latest']` | partial (undefined becomes `'latest'`) |
| `importSummary(importId, enabled=true)` | `queryOptions({key, queryFn: getImportSummary(importId, signal), enabled, staleTime: CACHE_STALE_TIME})` | as above |

Mixed shape. `overview`, `cashLoanStats`, `rows` and `importSummary` are `queryOptions`. `scheme`, `jobConfig`, `synchronizations` and `session` are plain arrays assembled in hooks. This matches the keys-only-plus-hook pattern that `03-api-service.md` says scheme-sync may keep. The `rows` options include a `staleTime: Infinity` with explanatory comment (lines 78-86).

`import/queryKeys/scheme-import.query-keys.ts` (`schemeImportQueryKeys`):
| Method | Returns / options | Params normalised? |
|---|---|---|
| `all` | `['scheme-import']` | n/a |
| `historiesAll()` | prefix | n/a |
| `histories(query)` | `queryOptions`, key `[...historiesAll(), query]`, `staleTime: CACHE_STALE_TIME`, `keepPreviousData`, forwards `signal` | no (raw query) |
| `publishHistoryAll()` | prefix | n/a |
| `publishHistory(query)` | `queryOptions`, `staleTime: CACHE_STALE_TIME`, `keepPreviousData`, signal | no |
| `publishHistoryDetail(id, query)` | key `[...publishHistoryAll(),'detail',id,query]`, `staleTime: CACHE_STALE_TIME`, `keepPreviousData`, signal | no |
| `itemsAll(importId)` | `[...all,'items',importId]` | prefix |
| `items(importId, enabled, query = {page:0,size:1000})` | `queryOptions`, key `[...itemsAll(importId ?? -1), query]`, `enabled: enabled && importId != null`, `staleTime: CACHE_STALE_TIME`, signal | no |

### 10b. Hooks: every query and mutation
`hooks/scheme-sync.queries.hook.ts`:
| Hook | Kind | Key | enabled | staleTime | placeholderData | select | Consumers |
|---|---|---|---|---|---|---|---|
| `useRefreshSchemeSync` | callback (not a query) | n/a | n/a | n/a | n/a | n/a | SchemeSyncPage; `scheme-import.queries.hook.ts` (`useRefreshAfterImport`, `usePublishImportMutation`) |
| `useStartSyncMutation` | useMutation | none | n/a | n/a | n/a | n/a | SchemeSyncPage:69; SyncStatusModal:97 |
| `usePublishMutation` | useMutation | none | n/a | n/a | n/a | n/a | PublishModal:78 |
| `useSchemeSyncSessionQuery(sessionId?, initialSession?)` | useQuery | `overview().queryKey` (shared) | `Boolean(sessionId)` | default 0 | none | `select` picks the session from `{runningSession, latestAttempt, latestResult}` by id; result falls back to `initialSession` | SyncStatusModal:98 |
| `useSchemeDetailQuery(sessionId, schemeCode)` | useQuery | `scheme(sessionId, schemeCode)` | none | default 0 | none | none | SchemeDetailModal:33 |
| `useSyncJobConfigQuery` | useQuery | `jobConfig()` | none | default 0 | none | none | SyncScheduleConfig:83 |
| `useUpdateJobConfigMutation` | useMutation | none | n/a | n/a | n/a | n/a | SyncScheduleConfig:84 |
| `useSynchronizationsQuery(query)` | useQuery | `synchronizations(query)` | none | default 0 | `keepPreviousData` (v5 function form, line 111) | none | SyncHistoryModal:194 and :202 (two observers in `SyncHistoryTab`) |

`QueryProvider` sets no staleTime, so the effective default is 0 (`src/providers/query.provider.tsx`, defaults are only `retry:false` and `refetchOnWindowFocus:false`). `SyncStatusModal` and `SchemeSyncPage` also call `useQuery({...schemeSyncQueryKeys.overview()})` directly, and the `useSchemeSyncSessionQuery` observer overrides the `refetchInterval` with a duplicate of the same logic (line 73).

Direct `useQuery` call sites that don't go through a module hook:
- `SchemeSyncPage:54` (`overview`) and `:57` (`cashLoanStats`).
- `useSchemeSyncRows:76` (`importItemsQuery`, enabled only when `lastImportResult !== null && importCategory !== undefined`) and `:119` (`rows(rowsParams, queriesReady)`).
- `useSchemeSyncImportFlow:76` (`importSummary(undefined, lastImportResult===null && confirmedImport===null)`) and `:97` (`importSummary(confirmedImport?.importId, confirmedImport!==null)`).
- `SyncStatusModal:99` (`overview`).
- `ImportHistoryTab:73`, `PublishHistoryTab:69` and `:234`.

`import/hooks/scheme-import.queries.hook.ts` (all mutations, no useQuery):
| Hook | Underlying call | onSuccess / onSettled | Consumers |
|---|---|---|---|
| `useImportTemplateMutation` | `getImportTemplate()` | none | ImportModal:42 |
| `useImportFileMutation` | `getImportFile(importId)` | none (caller passes `onSuccess` at call site) | ImportHistoryTab:85 |
| `useRequestUploadUrlMutation` | `requestPresignedUploadUrl` | none | ImportModal:43 |
| `useUploadImportFileMutation` | `uploadFileToPresignedUrl` | none | ImportModal:44 |
| `useValidateImportFileMutation` | `validateImportFile` | none | ImportModal:45 |
| `useRefreshAfterImport` | callback: `refreshSchemeSync()` + invalidate `schemeImportQueryKeys.historiesAll()` | n/a | ImportPreviewModal:51 |
| `usePublishImportMutation` | `publishImport` | `onSuccess` invalidates refresh set + `historiesAll()` + `publishHistoryAll()` + `schemeSyncQueryKeys.importSummaryAll()` | PublishModal:79 |

### 10c. Direct, indirect and cross-domain consumers of the components
| Component | Consumer |
|---|---|
| CashLoanTab | SchemeSyncPage only (the product-labels `CashLoanTab` is a different component) |
| KpiCards, FilterBar, ResultsTable, ComparisonDrawer | CashLoanTab only |
| SchemeDetailModal | CashLoanTab only (via `openModal`) |
| SyncStatusModal, SyncHistoryModal, SyncLoadingOverlay | SchemeSyncPage only |
| SyncScheduleConfig | SyncHistoryModal:378 only |
| ImportHistoryTab, PublishHistoryTab | SyncHistoryModal:175 and :180 only |
| PublishModal | SchemeSyncPage only |

Other runtime consumers cannot be excluded for dynamic imports. None found.

### 10d. Props map per component
Page is `SchemeSyncPage`; CLT is `CashLoanTab`.

CashLoanTab (`CashLoanTab/index.tsx:36-58`, passed by the page at 313-335). Everything flows Page -> CLT.
| Prop | Type / kind | Source in Page |
|---|---|---|
| `pendingSession` | server data (overview) | derived from `overview.latestResult` |
| `schemeTypeCounts` | server-derived data (stats + import counts) | `kpiCounts` |
| `fallbackCounts` | server data (overview) | `resultSession?.counts` |
| `selectedGroup` | URL state | `normalizeGroup(searchParams)` |
| `onSelectGroup` | callback | `setGroup` |
| `draftFilters`, `appliedFilters` | local state | page `useState` |
| `onDraftFilterChange`, `onApplyFilters`, `onClearFilter`, `onResetFilters` | callbacks | page handlers |
| `noSearchFilter` | derived boolean | derived from `appliedFilters` |
| `rowsPage` | server-derived (merge) | `useSchemeSyncRows` |
| `rowsLoading` | flag | `useSchemeSyncRows` |
| `rowsError` | server-derived string | derived from the rows error |
| `onRetryRows` | callback | `refetchRows` |
| `page`, `pageSize` | local state | page `useState` |
| `onPageChange`, `onPageSizeChange` | callbacks | `setPage`, `handlePageSizeChange` |
| `resultSessionId` | server-derived id | `resultSession?.id` |

CLT has 22 props. It is a pure forwarder for most of them.

FilterBar (`FilterBar/index.tsx:13-37`, 23 props, passed by CLT lines 145-169):
- Draft values (data): `selectedGroup`, `productCode`, `bizLine`, `schemeCode`, `loanInsuranceType`, `status`, `source`.
- Applied values (data): `appliedProductCode`, `appliedSchemeCode`, `appliedBizLine`, `appliedLoanInsuranceType`, `appliedStatus`, `appliedSource`.
- Callbacks: `onProductCodeChange`, `onBizLineChange`, `onSchemeCodeChange`, `onLoanInsuranceTypeChange`, `onStatusChange`, `onSourceChange`, `onApplyFilters`, `onClearFilter`, `onResetFilters`.
- Flag: `searching` = `rowsLoading`.
- None of them carries server data. All are local filter state, which is the candidate for URL state.
- Forwarded more than two levels: `appliedFilters` and `onClearFilter` go Page -> CLT -> FilterBar -> `ActiveFilterTags` (internal child, FilterBar line 125-133). That is 3 component levels, FLAG. The rest stop at FilterBar.

ResultsTable (`ResultsTable/index.tsx:29-37`, passed by CLT 184-196):
- `group` (= `selectedGroup`).
- `dataSource` (= `rowsPage.items`, server-derived).
- `loading` (= `rowsLoading`).
- `emptyText` (a ReactNode built by CLT).
- `activeRowId` (from CLT's local `comparisonRow`).
- `onSchemeClick` (CLT `openScheme`, which ignores the `_row` argument).
- `onCompare` (CLT `setComparisonRow`).
- `onSchemeClick` is passed into `renderSchemes(row, onSchemeClick)`, a module-level function. That is a helper call, not a component level. Not >2 levels.

KpiCards (`KpiCards/index.tsx:9-13`, passed by CLT 117-121): `selectedGroup` (URL), `counts` (server-derived, `schemeTypeCounts ?? fallbackCounts`), `onSelectGroup` (callback, `setGroup`). `onSelectGroup` goes Page -> CLT -> KpiCards, 2 levels, within the limit.

ComparisonDrawer (`ComparisonDrawer/index.tsx:13-16`, passed by CLT:213): `row` (server data, `SyncResultRow` object held in CLT local state, i.e. a copy of a list item), `onClose` (callback).

SchemeDetailModal (`SchemeDetailModal/index.tsx:10-13`): `sessionId` (from page `resultSession?.id`, through CLT `resultSessionId ?? 'latest'`; Page -> CLT -> modal = 2 hops) and `schemeCode` (from the ResultsTable click). It fetches its own data through `useSchemeDetailQuery`, so it already reads the Query cache itself.

SyncStatusModal (`SyncStatusModal/index.tsx:23-30`, passed by page `openStatus` lines 187-194): `sessionId` and `initialSession` (server data from overview, passed even though the modal reads the overview itself), `initialError` (string), `startOnOpen` (never passed by the page; always false, so the auto-start branch is dead in current wiring, LIKELY), `canEdit` (permission boolean), `onRetryStart` (callback).

SyncHistoryModal (`SyncHistoryModal/index.tsx:156-158`): `canEditSchedule`, passed by the page and forwarded to `SyncHistoryTab` (internal) and on to `SyncScheduleConfig` as `canEdit`. That is Page -> SyncHistoryModal -> SyncHistoryTab -> SyncScheduleConfig (3 levels). FLAG, though it is a single boolean.

SyncScheduleConfig (`SyncScheduleConfig/index.tsx`, props `canEdit`, `compact`, used at SyncHistoryModal:378). It fetches its own config through `useSyncJobConfigQuery`, so there are no server-data props.

PublishModal (`PublishModal/index.tsx:31-41`, passed by page 351-359): `open`, `syncOption` / `importOption` (server-derived objects built in `useSchemeSyncPublish`), `onCancel`, `onSyncPublished`, `onImportPublished`, `onPendingChange`. It owns its mutations and its display-set query internally.

No component other than those listed above forwards props through more than two levels. The only 3-level cases are `appliedFilters`/`onClearFilter` through FilterBar to ActiveFilterTags, and `canEditSchedule`.

## 11. Pattern Classification
- Services in `src/services/products/`: target-compatible.
- TanStack Query -> service -> ApiFetcher for all server data: target-compatible. No Redux/Query double ownership of server data.
- Query-key factory mixing `queryOptions` and plain keys: legacy-compatible (explicitly sanctioned for scheme-sync by `03-api-service.md`).
- `lastImportResult` local state seeded from a Query summary by `useEffect` (see section 15 item 4): uncertain / ownership risk.
- Draft/applied filters in page `useState`: legacy-compatible. `04-state-management.md` names URL state as the preferred owner for a shareable filter/page.
- Each component with its own `styles.module.scss`: target-compatible styling.
- Notifications dispatched by the UI layer with `setNotification` at several places: legacy-compatible; there is no single owner (see section 12).
- Services using `window.apiFetcher`: matches the repo convention.

## 12. Risk Classification
- Moving filters/page/pageSize to URL state: MODERATE. It touches `SchemeSyncPage`, `CashLoanTab`, `FilterBar`, `useSchemeSyncRows`, `useSchemeSyncImportFlow` (which calls `setDraftFilters`/`setAppliedFilters`/`setGroup` after import) and `SyncStatusModal` deep links (`PageURLs.ofSchemeSync`). No route-table or permission change.
- Replacing `rowsPage` and count props with cache reads: MODERATE to HIGH-RISK for behavior. `rowsPage`, `kpiCounts` and `rowsError` are derived, merged client-side values, not a single cache entry. Business rules (kpi totals incl. pending import, publish counts) are encoded there.
- Any change to the `rows` staleTime/invalidation: MODERATE. Several flows depend on it.
- Anything touching routing, permissions or `PageURLs`: HIGH-RISK. Not needed for the proposed refactor.

### Mutation cache synchronization (item 8)
| Mutation | onSuccess / onSettled | Keys touched | Notification owner |
|---|---|---|---|
| `useStartSyncMutation` | `onSuccess`: `setQueryData(overview().queryKey, updater)` with the new session; if `status !== 'RUNNING'`, `invalidateSchemeSyncData` | overview (write), then overview + `rowsAll` + `synchronizationsAll` + `cashLoanStats` (invalidate) | Error: the caller. Page `startSync` catch dispatches `SYNC_FAILURE_MESSAGE` (page 222-227) and refreshes. `SyncStatusModal.beginSync` swallows the error silently (comment line 115). Two different callers, two behaviours. |
| `usePublishMutation` | none in the hook | none in the hook. The caller `useSchemeSyncPublish.handleSyncPublished` calls `refreshSchemeSync()` (invalidation of the 4 keys above) | Success: `useSchemeSyncPublish` (dispatch, lines 73-78). Failure: `PublishModal` (`getPublishErrorNotification`, 107). Split owners (hook and component). |
| `usePublishImportMutation` | `onSuccess` invalidates the refresh set + `historiesAll` + `publishHistoryAll` + `importSummaryAll` | those keys (invalidate only, no setQueryData) | Success: `useSchemeSyncPublish.handleImportPublished`. Failure: `PublishModal`. |
| `useUpdateJobConfigMutation` | `onSuccess`: `setQueryData(jobConfig(), config)` | `jobConfig` (authoritative write) | `SyncScheduleConfig` (success and error, lines 91-138). Single owner. |
| `useRefreshAfterImport` (callback) | invalidates the refresh set + `historiesAll` | n/a | `ImportPreviewModal` handles its own notification (line 104 for the error-file case; success is notified in `useSchemeSyncImportFlow.handleImported`). |
| Import template, file, upload-URL, upload and validate mutations | none | none | `ImportModal` and `ImportHistoryTab` (not traced line by line) |

There is no single success/error notification owner across the module. Query errors are notified by `useNotifyQueryError` (`hooks/useSchemeSync.ts`) in the page and the rows hook. The refresh set `invalidateSchemeSyncData` is also triggered by a page `useEffect` when `runningSession` disappears (page 254-260).

## 13. Regression Surface
- Deep link `?group=` (valid and invalid values, which normalise to `NEW`) and the group switch resetting `loanInsuranceType`/`status`/page.
- Refresh and back/forward once filters are in the URL. Two-stage draft/applied semantic. Import flow auto-sets `source=IMPORT` plus the first non-empty classification group.
- Page-size change resets page 0. Client-side pagination clamping when rows shrink after refetch (CLT does not clamp `page`; `ImportPreviewModal` does, line 73).
- Polling: overview refetchInterval 1000 ms while running, three observers on one key (page, `SyncStatusModal` twice).
- Pending-import KPI totals vs sync-only counts for the publish option (comment at rows hook 124-130).
- Reload recovery of `lastImportResult` from `import-summary` (latest).
- Publish success path: invalidation set and `importSummaryAll`, so an already-published import does not reappear.
- Permission matrix: view only, edit, and `canEdit` false hiding the buttons.
- Loading states: initial skeleton vs table overlay vs empty state.
- Shared helper consumer: `history-comparison.helper.ts` -> `mapChangedField`.

## 14. Recommended Change Boundary
Evidence-backed smallest steps (handoff only):
1. URL-state for filters/page/pageSize: change `SchemeSyncPage` (state source) and keep the CLT/FilterBar prop names stable first. `useSchemeSyncRows` already takes `appliedFilters`, `page`, `pageSize` as parameters, so only its caller changes. Keep `group` handling as-is and keep draft filters as local state (they are not shareable by nature).
2. Do not replace `rowsPage`, `kpiCounts` and `rowsLoading` with a child-level cache read: they depend on the import merge. If wanted, first expose them through a feature hook that CLT could call itself, after URL state exists.
3. `SchemeDetailModal` and `SyncScheduleConfig` already read their own cache; `SyncStatusModal` should read `overview` through `useSchemeSyncSessionQuery` and drop the `initialSession` prop only after confirming the cache is populated at open time.
4. Do not touch: `ApiFetcher`, routes, permissions, the `rows` staleTime/invalidation contract, `normalizeRowsKeyParams`, `src/services/products/*`.

Items 9 and 10 (components under about 50 lines with one consumer, and components at or above about 200 lines, per `07-component.md`):

Small single-consumer components (under about 50 lines):
| Component | Lines | Consumer | Note |
|---|---|---|---|
| `SyncLoadingOverlay/index.tsx` | 14 | SchemeSyncPage only | has its own SCSS Module (35 lines), so it meets the "carries its own SCSS Module" exception. |
| `ImportCancelConfirmModal` | 28 | ImportPreviewModal only | a thin confirm wrapper; needs a check of whether it wraps `Modal.confirm`. |
| `ImportConfirmModal` | 29 | ImportPreviewModal only | same. |
| `ImportErrorList` | 40 | ImportModal only | has its own SCSS Module (14 lines). |

These files were not read in detail, so whether they add stable behavior or only forward is NEEDS-VERIFICATION. Per the rule, inlining is a review trigger, not a requirement.

At or above about 200 lines:
| Component | Lines |
|---|---|
| SyncHistoryModal | 493 (contains `SyncHistoryModal`, `SyncHistoryTab`, helpers) |
| FilterBar | 379 |
| ResultsTable | 379 |
| PublishHistoryTab | 335 |
| SyncStatusModal | 321 |
| SyncScheduleConfig | 293 |
| ImportHistoryTab | 285 |
| ImportPreviewModal | 269 |
| PublishModal | 236 |
| CashLoanTab | 216 (22 props, mostly forwarding) |
| ImportModal | 203 |
| SchemeSyncPage | 382 |

Also: `ComparisonDrawer` 135, `KpiCards` 109, `SchemeDetailModal` 134 are below the threshold.

Item 10: same server data from two owners, or passed as a prop while readable from the cache:
1. `lastImportResult` (`useSchemeSyncImportFlow:61`) is local state copied from the `import-summary` Query result by two `useEffect`s (lines 80-95 and 101-115). The same fields are in the cache under `importSummaryAll(importId)`. This is Query plus local state for one resource (counts for the latest import). It is also nulled locally after publish (`handleImportPublished`), while `usePublishImportMutation` invalidates `importSummaryAll`. Two owners must agree. CONFIRMED.
2. `SyncStatusModal` receives `initialSession` (a copy of an overview session) and also reads the overview via `useSchemeSyncSessionQuery` and `useQuery(overview)`. The prop is a seed fallback for the same cache. CONFIRMED.
3. `pendingSession`, `fallbackCounts`, `resultSessionId` are overview data (`schemeSyncQueryKeys.overview()`) passed into CashLoanTab as props even though CashLoanTab could read the same cache key. `schemeTypeCounts` (from `cashLoanStats`) is read by the page and sent to `useSchemeSyncRows` and `useSchemeSyncPublish` as a parameter. CONFIRMED.
4. `comparisonRow` (CLT local state, a copy of a list row) is a second copy of an item that also lives inside the `rows` cache. After `invalidate` the drawer keeps showing the old copy until it is closed. LIKELY (behavior not run).
5. `SchemeDetailModal` already reads its own cache, so there is no duplicate. `SyncScheduleConfig` is likewise self-contained.
6. No Redux server-data duplication was found. Redux is used for notifications and the current user only.

## 15. Unknowns / Needs Verification
1. Loading-state compliance (item 7), exact expressions:
   - Rows table: `rowsLoading = rowsQuery.isFetching || (hasPendingImport && importItemsQuery.isFetching)` (`useSchemeSyncRows.hook.ts:160`). CLT: `isInitialRowsLoading = rowsLoading && rowsPage.items.length === 0` (CLT:93) shows a `Skeleton`; otherwise `ResultsTable loading={rowsLoading}`. It uses `isFetching`, not `isPending` alone, and `isPlaceholderData` is not used anywhere. Compliant with the rule's `isFetching` alternative. Pagination is not unmounted during retained-data fetches, but it is unmounted while `isInitialRowsLoading` (so also on a refetch of an empty group).
   - `rows`: `placeholderData: keepPreviousData` function form (query-keys:87), `staleTime: Infinity` (outside the SHOULD range of 30 s to 5 min, but explicitly documented in a comment and sanctioned by the rules' scope note). Also the key holds no page/pageSize that varies (page 0, size 1000 fixed), so the rule on "key includes page/pageSize" is not triggered. Pagination is client-side from the 1000-row bulk fetch.
   - `useSynchronizationsQuery`: keepPreviousData function form (hook:111); NO staleTime (effective 0). `SyncHistoryTab` uses `loading = historyQuery.isFetching` (SyncHistoryModal:208). Partial non-compliance with the staleTime SHOULD.
   - `histories`, `publishHistory`, `publishHistoryDetail`: keepPreviousData function form, `staleTime: CACHE_STALE_TIME` (60_000). `ImportHistoryTab` and `PublishHistoryTab` use `loading={…isFetching}` (ImportHistoryTab:263, PublishHistoryTab:209, :317). Compliant.
   - Not verified: `PublishHistoryDetailModal` loading expression beyond line 317.
2. Whether `SyncResultRow.id` equals the backend scheme id (`scheme-sync.mapper.ts` not traced). It determines whether a child can call `getSchemeDetail(id)` without the code lookup. `getScheme` currently does a list lookup per code.
3. Whether `startOnOpen` is ever passed anywhere. In-module it is not (LIKELY dead path).
4. Whether `session(id)` key, `getSession`, `getSchemes` and `getBusinessLines` are dead (no consumer found in `src/`). Dynamic access is not excluded.
5. Notification behavior in import mutations and `ImportModal`. ImportModal, ImportPreviewModal and `ImportHistoryTab` were only skimmed.
6. Whether `useSchemeSyncSessionQuery`'s `refetchInterval` override and the factory's one produce one poll per key (TanStack uses the shortest interval among observers; not run).
7. Nothing was run: no typecheck, lint, build, browser, permissions or API behavior verified.
8. `PROJECT_CONTEXT.md` and `CLAUDE.md` entries on scheme-sync file layout are stale relative to source (section 4 note). Recommend `/refresh-context` before relying on them.

## 16. Handoff for Implementation
- Boundary: `views/SchemeSyncPage/index.tsx`, `components/CashLoanTab`, `components/FilterBar`, `hooks/useSchemeSyncRows.hook.ts`, `hooks/useSchemeSyncImportFlow.hook.tsx` for URL filter state. Optionally a feature hook for the rows/count derivation.
- Preserve: draft/applied two-stage filter semantics; `?group=` deep-link behavior from `PageURLs.ofSchemeSync`; the `normalizeGroup` fallback to `NEW`; group change clearing group-specific filters and page; `rows` query key shape and `staleTime: Infinity` plus the invalidation set (`invalidateSchemeSyncData`, `importSummaryAll` on publish); client-side merge/sort/paginate semantics; `kpiCounts` vs `schemeTypeCounts` split (publish counts must stay sync-only); import flow's post-import redirect (`source=IMPORT`); ApiFetcher, services, routes and permissions unchanged.
- Candidate prop reductions with evidence: CLT's 22 props, FilterBar's 23 props (13 data props are one filter object split into primitives), `pendingSession`/`fallbackCounts`/`resultSessionId` (overview cache), `initialSession` into SyncStatusModal, `canEditSchedule` 3-hop boolean.
- Do not use a child cache read for `rowsPage`, `kpiCounts` or `rowsLoading` without first deciding how the pending-import merge is owned. NEEDS-TEAM-DECISION whether pagination should stay client-side at 1000 rows or move server-side (changes the `rows` key to include page/size, which then makes the keepPreviousData/isPlaceholderData rule fully applicable).
- Validation scenarios: items listed in section 13, plus refresh with filters in the URL, stale `comparisonRow` after sync, and running-sync polling with the status modal open.
- Open questions: section 15.
