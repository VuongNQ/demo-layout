# Scheme Sync — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq`.
- Date: 2026-11-05.
- Method: static source inspection only. Two read-only `codebase-analyzer` subagents independently read every file in scope in full (one covering the parent directory excluding `import/`, one covering `import/` only), plus `src/services/products/scheme-sync.{service,types}.ts`, `src/services/products/scheme-import.{service,types}.ts`, the relevant route/permission/menu files, and both `src/lang/{vi,en}.json`. This session cross-checked both subagents' file counts directly with `find`. No runtime, browser, auth, or backend verification was performed; `npm run typecheck`/`lint`/`build` were not run for this documentation task.
- Scope: `src/modules/products/configuration/scheme-sync/`, **63 files** (`find src/modules/products/configuration/scheme-sync -type f | wc -l`), split as **44 files outside `import/`** + **19 files inside `import/`** (`find ... -not -path "*/import/*" | wc -l` = 44, `find .../import -type f | wc -l` = 19; 44+19=63, confirmed exactly). **Count discrepancy, explained (template rule 12):** the delegation brief sent to the `import/`-scoped subagent stated "12 files" for that subtree and the brief for the parent-scoped subagent stated "51 files" — both numbers were this session's own pre-delegation miscount, not a source inconsistency. The subagents' own itemized file tables both sum to the correct figures (44 and 19) independently of the wrong headline number one of them repeated; this document uses only the fresh, direct `find` counts above.
- Split decision (§ required by task): **one document, no `import.md` split**, unlike `contents/BANNER.md` (split out of `contents/OVERVIEW.md`) or `system/BACKGROUND-MAIN.md`/`TOPIC.md` (split out of `system/THEME-MANAGEMENT.md`). Those splits separate **independently routed submodules** of a shared parent that each have their own route, permission-view gate, and page entry. `import/` has none of that: it has no route of its own (it is reached only by opening a modal from the parent's one route, `main.routes.tsx:184-191`), no permission constant of its own (it reuses the parent's `PRODUCT_SCHEME_SYNC_CLASSIFICATION_EDIT`), and its TanStack Query mutations directly invalidate the parent's own query keys (`schemeSyncQueryKeys.importSummaryAll()`, `refreshSchemeSync()`) — a degree of cache coupling that a split document would have to describe twice. 63 files in one document is in the same size range as `notifications/OVERVIEW.md` (32 files) and `documents-and-contracts.md` (40 files, four slices, one document), and below `product-labels.md` (78 files, one document). This document therefore treats `import/` as §10 of a single module document (Main runtime flows) with its own dedicated API/state/risk subsections, rather than as a sibling file.
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Whether a stale cached "latest import" summary can re-populate `lastImportResult` after an import publish clears it, because the recovery effect's gating condition re-enables before the post-publish invalidation's refetch resolves (§4, §13 risk 1).
  2. Whether the backend enforces `PRODUCT_SCHEME_SYNC_CLASSIFICATION_EDIT`-equivalent authorization on `run-now`, `publish`, and `job/config` PUT server-side, or relies solely on the frontend gate (§9, §13 risk 9).
  3. Whether `POST .../schemes/import/presigned-upload-url` → direct S3 `PUT` → `POST .../validate` → `POST .../publish` matches `docs/modules/products/products-loan-excel-import-api.md`'s documented contract on every field — it matches on the large majority of fields and all four endpoints/stages, but several concrete mismatches were found and are recorded in §6 and corrected in that document's own addendum (§6, §13 risk 2).
  4. Whether the backend's max page size for `GET .../schemes` is genuinely 1000 (the frontend hard-codes a 1000-row bulk fetch with no truncation detection) (§6, §13 risk 4).
  5. Whether an import publish actually changes the underlying `/schemes` list data such that the parent rows need to be re-fetched — this determines whether the confirmed absence of post-import-publish invalidation (§6, §13 risk 3) is a real staleness bug or a no-op.

## 1. Responsibility

Cash-loan (CL) product scheme synchronization and classification screen, plus a batch Excel import feature integrated into the same page (CONFIRMED, `views/SchemeSyncPage/index.tsx`, `import/components/ImportModal/index.tsx`). One route renders:

- **Sync**: trigger or poll a Product Service synchronization run, see KPI counts by classification group (`NEW`, `CHANGED`, `DISCONTINUED`/unchanged naming varies, `REVIEW`, `UNCHANGED`), list and filter scheme rows per group, compare a changed row's old/new values, and view sync/publish/import history. A cron-style schedule for the recurring job can be viewed and edited.
- **Import**: upload a `.xlsx` file of scheme changes, validate it against the backend (which reports a `FILE`/`FORMAT`/`REFERENCE`/`PASSED` stage with per-cell errors), preview the parsed rows with inferred/kept/default-value annotations, optionally download a client-generated annotated error workbook, confirm the import (UI-only — the backend already persisted the session at validate time), and browse import/publish history in two tabs added to the sync module's own history modal.
- **Publish**: either the sync classification result or a confirmed import can be published, gated by a display-information-set selection; this action lives in the parent (`components/PublishModal/index.tsx`), not in `import/`.

Two tabs on the page ("Thẻ tín dụng"/credit-card and a third tab) are rendered `disabled: true` ("Đang phát triển" — in development) (CONFIRMED, `views/SchemeSyncPage/index.tsx:278-287`); only the `cash-loan` tab is implemented.

## 2. Entry points and routes

- **Route (CONFIRMED):** `src/routes/main.routes.tsx:184-191`, path `withPrefix('product/configuration/scheme-sync')`, `<WithGuard Page={SchemeSyncPage} Guard={AuthGuard} permissions={[PERMISSIONS.PRODUCT_SCHEME_SYNC_CLASSIFICATION_VIEW]} />` — a single-permission array, not an OR of multiple permissions. Import statement at `main.routes.tsx:19`. This is the module's **only** route; it lives in `main.routes.tsx` (`MainLayout`), and there is no corresponding `form.routes.tsx` entry — both Sync and Import are modals/tabs on the one list-shaped route, not separate create/edit/view routes.
- **Lazy export (CONFIRMED):** `src/routes/pages.tsx:19`, `SchemeSyncPage = lazy(() => import('@/modules/products/configuration/scheme-sync/views/SchemeSyncPage'))`; the view file's `export default function SchemeSyncPage` (`views/SchemeSyncPage/index.tsx:35`) is lazy-compatible.
- **`PageURLs` builder (CONFIRMED):** `src/utils/navigate.ts:141-143`, `ofSchemeSync(group?)` → `withPrefix('/product/configuration/scheme-sync?group=<group>')`. `group` is appended unencoded to the literal string. Callers: `src/helpers/menus.helper.ts:357-358` and `components/SyncStatusModal/index.tsx:135`.
- **Menu (CONFIRMED):** `src/helpers/menus.helper.ts:355-360`, label "Đồng bộ và phân loại Scheme", gated by `[PERMISSIONS.PRODUCT_SCHEME_SYNC_CLASSIFICATION_VIEW]` (same single-permission array as the route; menu filtering uses `.some`, `src/utils/navigate.ts:439`).
- **Import's own entry point (CONFIRMED):** not a route — a button on the page (`views/SchemeSyncPage/index.tsx:231-235`, gated by `canEditSchemeSync`) calls `openImport()` (`hooks/useSchemeSyncImportFlow.hook.tsx:170-174`), which opens `ImportModal` via the shared `useModal()` modal host. There is no deep link directly into the import flow.
- **Import/Publish history entry point (CONFIRMED):** the "Lịch sử" button (`views/SchemeSyncPage/index.tsx:228`, **not** permission-gated — visible to any user who can already see the page) opens `SyncHistoryModal`, whose tabs include `ImportHistoryTab` and `PublishHistoryTab` from `import/components/` (`components/SyncHistoryModal/index.tsx:21-22,63-75`). The modal's `Tabs` has `destroyInactiveTabPane` (`:57`), so switching tabs discards each tab's own filter/page state.
- **No outside consumers of this module's own route/menu wiring beyond the above** — confirmed by grep for `scheme-sync|SchemeSync|schemeSync` outside the directory (§10/§11).

## 3. Directory map

`find src/modules/products/configuration/scheme-sync -type f | sort` → 63 files (44 outside `import/`, 19 inside it).

```text
scheme-sync/
|-- _chip.scss                                   # shared Sass mixin (no selectors); 2 consumers (this module + import/)
|-- constant.ts                                   # SYNC_GROUPS, API_CATEGORY_BY_GROUP, SYNC_GROUP_BY_CATEGORY
|-- scheme-sync.module.scss                       # root `.scope` class + `:global` AntD-portal override classes + legacy CSS-var aliases
|-- scheme-sync.tokens.ts                          # TS color/size token object — NO runtime consumer found (dead export, §12)
|-- components/
|   |-- CashLoanTab/{index.tsx,styles.module.scss}        # tab body: filters, KPI cards, results table, comparison drawer trigger
|   |-- ComparisonDrawer/{index.tsx,styles.module.scss}   # changed-row old/new value diff
|   |-- FilterBar/{index.tsx,styles.module.scss}          # filter panel, draft state synced from URL
|   |-- KpiCards/{index.tsx,styles.module.scss}           # per-group KPI counts
|   |-- PublishModal/{index.tsx,styles.module.scss}       # publish sync result OR confirmed import, display-set select
|   |-- ResultsTable/{index.tsx,styles.module.scss}       # row table, source/import-type columns
|   |-- SchemeDetailModal/{index.tsx,styles.module.scss}  # one scheme's full detail
|   |-- SyncHistoryModal/{index.tsx,styles.module.scss}   # tabs: sync history, schedule popover, Import history, Publish history
|   |-- SyncLoadingOverlay/{index.tsx,styles.module.scss} # shown while a sync run is starting
|   |-- SyncScheduleConfig/{index.tsx,styles.module.scss} # AntD Form, cron schedule edit (inside the history modal's popover)
|   `-- SyncStatusModal/{index.tsx,styles.module.scss}    # running-session status/poll modal
|-- hooks/
|   |-- scheme-sync.queries.hook.ts                # all server hooks/mutations + invalidateSchemeSyncData/useRefreshSchemeSync
|   |-- useSchemeSync.ts                           # useNotifyQueryError only — note: lacks the `.hook.ts` suffix other files use
|   |-- useSchemeSyncImportFlow.hook.tsx           # parent<->import integration: open modal, handle accepted/imported, recover lastImportResult
|   |-- useSchemeSyncPublish.hook.ts               # publish-eligibility + publish-success handling for both sync and import sources
|   `-- useSchemeSyncRows.hook.ts                  # bulk-fetch rows (page 0/size 1000), merge pending import rows, client pagination
|-- queryKeys/
|   `-- scheme-sync.query-keys.ts                  # schemeSyncQueryKeys — mixed keys-only + colocated queryOptions (§6/§12)
|-- utils/
|   |-- comparison-drawer.helper.ts
|   |-- presentation.ts                            # suffix outside CLAUDE.md's established list
|   |-- publish.helper.ts
|   |-- results-table.helper.ts
|   |-- scheme-detail-modal.helper.ts
|   |-- scheme-sync-filters-url.helper.ts          # URL filter read/write
|   |-- scheme-sync-group-url.helper.ts            # URL group read/write
|   |-- scheme-sync-paging-url.helper.ts           # URL page/pageSize read/write
|   |-- scheme-sync.mapper.ts                      # suffix outside CLAUDE.md's established list; imports from import/constant
|   `-- sync-history-modal.helper.ts
|-- views/
|   `-- SchemeSyncPage/{index.tsx,styles.module.scss}      # page container; owns URL writes, sync/stats queries, start-sync, modal opening
`-- import/
    |-- constant.ts                                # MAX_IMPORT_FILE_SIZE_MB=5, .xlsx MIME, page sizes, category<->group maps, 22-col template
    |-- components/
    |   |-- ImportModal/{index.tsx,styles.module.scss}           # file pick (react-dropzone) -> presigned URL -> S3 PUT -> validate
    |   |-- ImportPreviewModal/{index.tsx,styles.module.scss}    # preview rows/cells, filters, error-file download, confirm
    |   |-- ImportPreviewTable/{index.tsx,styles.module.scss}    # 22-column read-only table
    |   |-- ImportErrorList/{index.tsx,styles.module.scss}       # FILE-stage structural errors
    |   |-- ImportConfirmModal/index.tsx                         # confirm dialog (no styles.module.scss)
    |   |-- ImportCancelConfirmModal/index.tsx                   # close-guard confirm (no styles.module.scss)
    |   |-- ImportHistoryTab/{index.tsx,styles.module.scss}      # import-session list + signed-URL file download
    |   `-- PublishHistoryTab/{index.tsx,styles.module.scss}     # publish-history list + detail modal (same file)
    |-- hooks/
    |   `-- scheme-import.queries.hook.ts          # mutations only (no useQuery; misleading "queries" name, §12) + useRefreshAfterImport
    |-- queryKeys/
    |   `-- scheme-import.query-keys.ts            # schemeImportQueryKeys — colocates queryOptions (not keys-only)
    `-- utils/
        |-- import-error-workbook.helper.ts        # client-side ExcelJS error-annotated workbook builder
        `-- import-preview-table.helper.ts         # pure filter/paginate/annotate/count helpers
```

No `services/` folder, no `.mock.ts` file, and no `USE_MOCK_*` constant anywhere in this directory (CONFIRMED by grep before and during delegation). The real service layer lives outside this directory at the target location, `src/services/products/{scheme-sync,scheme-import}.{service,types}.ts` (§6).

## 4. Main runtime flows

All CONFIRMED from source; runtime/backend behavior not exercised.

**A. Page load.** `SchemeSyncPage` mounts `overviewQuery` and `statsQuery` (`views/SchemeSyncPage/index.tsx:46,49`). `useSchemeSyncRows` is gated on `queriesReady: overviewQuery.isFetched && statsQuery.isFetched` (`:105`). Rows are bulk-fetched for the whole group (`page: 0, size: 1000`, `hooks/useSchemeSyncRows.hook.ts:23,99-111`) and paginated client-side after merging any pending import rows (`:140-152`).

**B. Filter/group/page state** is URL state via `useSearchParams` (§5), not Redux — a deliberate deviation from the repository's dominant `pageParam`-slice list-state pattern seen elsewhere (e.g. `docs/modules/system/BANK-LIST.md` §5). Group change goes through `writeGroupChange` (clears group-specific filters, resets page); filter apply goes through `commitFilters` (`components/FilterBar/index.tsx:81-86`, deletes `page`).

**C. Start sync.** Button (`views/SchemeSyncPage/index.tsx:236-247`, requires EDIT) calls `handleStartSync`. If a running session already exists it opens `SyncStatusModal` directly; otherwise `startSync` calls `useStartSyncMutation` (`hooks/scheme-sync.queries.hook.ts:36-56`), whose service function `schemeSyncApi.startSync` (`src/services/products/scheme-sync.service.ts:196-216`) POSTs `job/run-now`, then polls `getOverview` up to 10 times at 500 ms and throws if no new session appears. `SyncLoadingOverlay` renders while `isStartingSync`. On success, `SyncStatusModal` opens; on failure, a notification fires and `refreshSchemeSync()` runs.

**D. Running-session polling.** The `overview()` query key sets `refetchInterval: 1000` while a session is running (`queryKeys/scheme-sync.query-keys.ts:49`). When the running session id transitions from set to unset, the page calls `refreshSchemeSync()`.

**E. Publish.** `PublishModal` offers a sync-result option (eligible when cash-loan isn't already published and either rows are selected or the per-group stats show `NEW`/`CHANGED`/`DISCONTINUED` schemes, regardless of the active group tab) and an import option (eligible when a confirmed import exists and no rows are selected), decided by `useSchemeSyncPublish.hook.ts`. Row selection (`useSchemeSyncSelection.hook.ts`, AntD `Table` `rowSelection` in `ResultsTable`, only for `NEW`/`CHANGED`/`DISCONTINUED` tabs) covers the whole loaded row set, is cleared whenever the loaded rows change, and only lets `SYNC`-source `PENDING_PUBLISH` rows in; selected ids are sent as `schemeIds` (omitted, never `[]`, for a bulk publish). The display-set `Select` is available for the sync source too (optional there, disabled when the publish set is `DISCONTINUED`-only) and sends `displaySetCode`. Sync publish uses `usePublishMutation` (no `onSuccess` in the hook itself — the caller calls `refreshSchemeSync()` unawaited). Import publish uses `usePublishImportMutation` from `import/hooks/scheme-import.queries.hook.ts:68-92`, whose `onSuccess` invalidates both parent and import-side cache keys (§6c).

**F. Schedule edit.** `SyncScheduleConfig` (inside the history modal's popover) is a plain AntD `Form` against `job/config` GET/PUT (§8).

**G. Compare.** Clicking a `CHANGED` row opens `ComparisonDrawer`, which prefers `changedFields` when present, otherwise computes a snapshot diff.

**H. Scheme detail.** The scheme-code button opens `SchemeDetailModal` with `sessionId = resultSessionId ?? 'latest'`.

**I. Import flow — state machine (`import/components/ImportModal` → `ImportPreviewModal`), as built, not as planned:**
- **S0 Idle** → **S1 File selected** (`react-dropzone`, `.xlsx` only, 5 MB max, single file, disabled while checking) → **S2 Checking**: strictly sequential `requestPresignedUploadUrl` → direct `fetch` `PUT` to the S3 URL (bypassing `ApiFetcher`, §6) → `validateFile`. Any failure in this sequence is swallowed into one generic `checkFailed` message (`ImportModal/index.tsx:129-131`) — the original error and its cause are discarded.
- **S3 FILE-stage error**: `result.stage === 'FILE'` (string-literal comparison, not a shared constant) sets `fileErrors` and renders `ImportErrorList`; the modal stays open with the file still selected, so the user can re-check without re-selecting.
- **S4 Accepted** (FORMAT, REFERENCE, or PASSED): the flow hook swaps modal content to `ImportPreviewModal`.
- **P1 Viewing**: banner success only on `stage === PASSED`; Import confirm button disabled otherwise. Row/cell filters (`ALL`/`ERROR_ONLY`, import type) and client pagination (page size 50) operate on the already-fetched preview payload.
- **P2 Error-file download**: shown only when `summary.errorCells > 0`; entirely client-side (ExcelJS reads the originally-selected `File` object, annotates matching cells, appends an error-listing sheet, and produces a Blob) — no server-provided URL is used (§4d detail in the import subagent's evidence; file `import/utils/import-error-workbook.helper.ts`).
- **P3 Confirming**: Confirm opens `ImportConfirmModal`; confirming closes the modal, calls `refreshAfterImport()` (unawaited), then `onImported(result)` — **no publish API call happens here**; the backend already persisted the session at validate time.
- **P4 Close attempt**: any dismiss opens `ImportCancelConfirmModal`; "keep reviewing" returns to P1, confirming closes the modal without any API call to discard the already-validated server-side session.
- **P5 Reselect**: swaps back to a fresh `ImportModal`; the client-side result is dropped, with no API call to discard the server session either.
- **Post-confirm** (`useSchemeSyncImportFlow.hook.tsx:117-147`): closes the modal, shows a success toast with `result.importCode`/`result.summary.totalRows`, sets the active classification `group` to the first non-empty of NEW/CHANGED/REVIEW/UNCHANGED (default `NEW`), sets the `source` filter to `IMPORT`, and — only if `importId !== null` — stores `confirmedImport` to trigger a by-id summary refetch.

**J. Import/publish history tabs.** `ImportHistoryTab`: keyword (debounced 500 ms)/status/date-range filters (default last 7 days), server-paginated (page size 10), file download via a signed URL obtained through `useImportFileMutation`. `PublishHistoryTab`: the same filter shape independently re-implemented (different page size, 20), with a same-file detail modal (`PublishHistoryDetailModal`) opened by row click.

## 5. State ownership

| State | Owner | Notes |
| --- | --- | --- |
| Sync/import/publish server data | **TanStack Query only.** No Redux slice exists for any part of this resource — `grep -rni "scheme" src/redux/` returns one unrelated hit, `product-list.slice.ts:407-410` (`api/admin/portal/v1/schemes/document`, a different endpoint with no link to this module) (CONFIRMED). | Clean single-owner case per `.claude/rules/04-state-management.md`. |
| Group / filters / page / page size | **URL state**, genuine `useSearchParams` (CONFIRMED) — not the repository's dominant Redux `pageParam` slice pattern. Readers: the page, `CashLoanTab`, `FilterBar`, `KpiCards`, each independently re-reading the URL. Writers: `writeAppliedFilters`, `writeGroupChange`, `writePaging`, all using `setSearchParams(next, { replace: true })`. | Target-compatible per `.claude/rules/04-state-management.md`'s "shareable tab/filter/sort/page → URL state" row — one of few modules in this repository doing so for real. |
| History-tab (sync/import/publish) filter/sort/page | **Local React state**, reset every time the modal re-opens (`destroyInactiveTabPane`) — not URL state, unlike the page's own filters. | `legacy-compatible`/inconsistent-but-not-a-defect; a UX asymmetry recorded in §13. |
| `FilterBar` draft values before Apply | Local `useState`, synced from the URL via effect. | — |
| `lastImportResult`, `confirmedImport` | In-memory `useState` in `useSchemeSyncImportFlow.hook.tsx`; recovered on mount from a TanStack Query summary fetch, not persisted otherwise. | A deliberate local draft, not a second authoritative owner — the query cache remains authoritative (§6c/§13 risk 1 covers a recovery-race finding). |
| Selected row for comparison (`comparisonRow`), publish-modal selection, schedule-edit form draft | Local React state / AntD `Form` (`SyncScheduleConfig`). | — |
| Notifications | Global Redux `notification.slice`, the same mechanism every module uses. | — |
| `updatedBy` on schedule save | Read from Redux `auth.slice` (`watchUser`) and sent to the backend as a client-asserted value. | Backend trust of this field is NEEDS-VERIFICATION (§13 risk 9). |

No server resource in this module has two independent authoritative owners.

## 6. API boundaries

### Transport and service location

All HTTP (except one documented exception) goes through `window.apiFetcher`. Services sit at the target location per `.claude/rules/03-api-service.md` point 6: `src/services/products/scheme-sync.service.ts` + sibling `scheme-sync.types.ts`, and `src/services/products/scheme-import.service.ts` + sibling `scheme-import.types.ts`, both re-exported through `src/services/products/index.ts` and the root `src/services/index.ts` barrel. **This supersedes `.claude/PROJECT_CONTEXT.md`'s 2026-10-29 entry**, which described `scheme-sync/import/services/index.ts` as an existing per-module barrel not yet consolidated — that path does not exist in current source; the migration to `src/services/products/` for both scheme-sync and scheme-import is already complete, a fact this document's writer flags as a stale `.claude/PROJECT_CONTEXT.md` claim rather than silently correcting it (`NEEDS-TEAM-DECISION` on whether to refresh that file).

### `scheme-sync.service.ts` — base `api/admin/portal/v1/schemes/synchronization`

| Method | HTTP / path | Consumer | Notes |
| --- | --- | --- | --- |
| `getJobConfig` | GET `.../job/config` | `useSyncJobConfigQuery` | runtime guard `requireJobConfigResponse` |
| `updateJobConfig` | PUT `.../job/config` | `useUpdateJobConfigMutation` | if response is null, returns the payload itself as the result |
| `getSynchronizations` | GET base (paged) | `useSynchronizationsQuery` | |
| `getBusinessLines` | GET `.../business-lines` | **none — unused export** | |
| `getSchemeTypes` | GET `.../scheme-types` | `cashLoanStats` key | filtered to `CL` |
| `getSchemes` | — | **none — unused export** | |
| `getSchemeDetail` | GET `.../schemes/{id}` | only internally, via `getScheme` | |
| `runNow` | POST `.../job/run-now` | only internally, via `startSync` | |
| `getOverview` | GET base, page 0/size 50, sort `startedAt,desc` | overview query, `startSync` poll | derives latest attempt/result/running session from one 50-row history page |
| `startSync` | POST run-now, then poll `getOverview` ≤10×500ms | `useStartSyncMutation` | throws if nothing new appears within ~5s |
| `getSession` | — | **none — unused export** | |
| `getRows` | via `buildSchemeQuery` | `rows` key | always `schemeType: 'CL'`, `sort: 'schemeCode,asc'` |
| `getScheme` | GET `.../schemes/{id}` after code→id resolution | `useSchemeDetailQuery` | treats an all-digit scheme code as an ID via `Number(code)`; `Number('')` is `0` and is an integer — empty/numeric-code edge case NEEDS-VERIFICATION |
| `publish` | POST `.../publish` | `usePublishMutation` | |

No scheme-sync service method or query function forwards an `AbortSignal` (CONFIRMED by grep across the file and its callers) — §13 risk 5.

### `scheme-import.service.ts` — base `api/admin/portal/v1/schemes/import` (+ `api/admin/portal/v1/schemes/publish/histories`)

| Method | HTTP / path | `AbortSignal` forwarded |
| --- | --- | --- |
| `getImportTemplate` | GET `.../template` | No |
| `requestPresignedUploadUrl` | POST `.../presigned-upload-url` | No |
| `uploadFileToPresignedUrl` | **direct `fetch` PUT** to the presigned S3 URL (method taken from the response, not hardcoded) | No |
| `validateImportFile` | POST `.../validate` | No |
| `publishImport` | POST `.../publish` | No |
| `getImportHistories` | GET `.../histories` | Yes |
| `getImportFile` | GET `.../{importId}/file` | No |
| `getImportItems` | GET `.../items/{importId}` | Yes |
| `getImportSummary` | GET `.../summary[/{importId}]` | Yes |
| `getPublishHistory` | GET `.../publish/histories` | Yes |
| `getPublishHistoryDetail` | GET `.../publish/histories/{id}` | Yes |

**The direct `fetch` PUT to the presigned S3 URL is the one confirmed deviation from `.claude/rules/03-api-service.md`'s "`ApiFetcher` remains the transport boundary"** (CONFIRMED, `scheme-import.service.ts`, with an in-code comment explaining the presigned URL is not this application's own API). It has no abort signal and no timeout. This mirrors exactly the exception the (now-stale) `scheme-sync-import-plan.md` planning document anticipated and asked to be confirmed with the team before treating as safe — that confirmation step is `NEEDS-TEAM-DECISION`, not resolved by this document.

### Backend-contract comparison against `docs/modules/products/products-loan-excel-import-api.md`

That document is a separate backend-contract reference (Vietnamese, sourced from a GitLab issue), describing a 4-step flow: `presigned-upload-url` → S3 PUT → `validate` (with a `stage` of `FILE`/`FORMAT`/`REFERENCE`/`PASSED`) → `publish`. Current source **matches** the large majority of this contract: all four endpoint paths and methods, the `stage` enum and its FE handling, the `category` enum (`NEW`/`UPDATE`/`REVIEW`/`UNCHANGED`), the `cells[].source` enum (`INPUT`/`DERIVED`/`DEFAULT`) and its FE annotation labels, the `summary`/`columns`/`rows`/`cells` response shapes, and the 22-column template. The document **needed correction** on several concrete points, which this session applied directly to it (see that file's own addendum added by this pass):

1. Its §3 heading describes the "Import" button itself as the publish action. In current source, confirming an import in `ImportPreviewModal` does **not** call publish — it only closes the modal and surfaces the already-validated session; publish is a separate action in the parent `PublishModal`.
2. It states `importCode` is generated at first publish; current source reads and displays `importCode` from the **validate** response already (`useSchemeSyncImportFlow.hook.tsx:124-126,145`), and the type comment at `scheme-import.types.ts` says it is set once `PASSED`. Which side is correct is `NEEDS-VERIFICATION` with the backend.
3. It states a null `rawValue` on an errored cell displays "(trống)". Current source falls back to `value` first, only showing "(trống)" when both are null (`import-preview-table.helper.ts` / `ImportPreviewTable/index.tsx`).
4. It states the error tooltip shows "Mã – Nội dung" (code and message). Current source's `ImportPreviewTable` renders only the message, not the code.
5. It states `displaySetCode` is required on publish. The FE type makes it optional, though the UI's own publish flow always sends it when publishing an import.
6. It states the required permission for presigned/publish is `product:create:cash_loan`. The FE gate is `product_scheme_sync_classification:edit`. Backend enforcement of either is `NEEDS-VERIFICATION`.
7. It does not document `template`, `{importId}/file`, `histories`, `items/{importId}`, `summary`, or `publish/histories[/{id}]` — all of which exist and are called by current source. Not a contradiction, an omission.

### Cache invalidation and `setQueryData` (query-key factory is **mixed**, not keys-only)

`queryKeys/scheme-sync.query-keys.ts` colocates `queryOptions` for four methods (`overview()`, `cashLoanStats()`, `rows()`, `importSummary()`) and keeps three as plain prefix-key arrays (`rowsAll()`, `session()` — unused, `jobConfig()`, `synchronizationsAll()`). `queryKeys/scheme-import.query-keys.ts` (inside `import/`) also colocates `queryOptions`. **This contradicts `.claude/rules/03-api-service.md:187-190`'s own description of scheme-sync as "keys-only factory plus hook-assembled `useQuery`"** — current source is a hybrid shape; the rule text is stale on this point (`NEEDS-TEAM-DECISION` whether to refresh the rule, not resolved here).

`rows()` sets `staleTime: Infinity` with a documented in-code reason (it is a 1000-row bulk client-paginated fetch, not a true server-paginated list) and `placeholderData: keepPreviousData`. `synchronizations()` and the import-side `histories()`/`publishHistory()` are genuinely server-paginated and set `staleTime` of 60s via `CACHE_STALE_TIME`, with `keepPreviousData`. `overview()` has no explicit `staleTime` (default 0) and polls every 1s while a session is running.

`setQueryData` is used in exactly two places: the start-sync mutation (seeding `overview()` from the new session) and the job-config update mutation. No other mutation uses it.

**Cross-subtree invalidation (parent ↔ `import/`):**
- `import/`'s mutations call the parent's `useRefreshSchemeSync()` (which invalidates `overview`, `rowsAll`, `synchronizationsAll`, `cashLoanStats` — **not** awaited by any caller) and also directly invalidate the parent-owned key `schemeSyncQueryKeys.importSummaryAll()`.
- The parent never invalidates any `import/`-owned key.
- **Confirmed gap:** `schemeImportQueryKeys.itemsAll` (the pending-import-rows cache that `useSchemeSyncRows` merges into the results table) is referenced only inside its own factory file — no mutation anywhere invalidates it. With a 60s `staleTime`, a re-opened or re-selected import can serve stale pre-publish item data for up to 60 seconds after a publish.
- **Confirmed gap:** `usePublishMutation` (the sync-publish path) has no `onSuccess` of its own; its caller's `refreshSchemeSync()` does not invalidate `publishHistoryAll`, so `PublishHistoryTab` (which lists both sync and import publish rows) can show stale data for up to 60 seconds after a sync publish.

## 7. Forms and validation

- The only Ant Design `Form`/`FormInstance` in this module is `SyncScheduleConfig` (`enabled` Switch with no rule, `cronExpression` required + `maxLength={100}`, `zoneId` required + `maxLength={80}`). No Zod anywhere in this module; plain AntD `rules` are sufficient for these two simple constraints, which `.claude/rules/05-form.md` permits.
- Everything else that looks form-shaped is not an AntD Form: `FilterBar`'s draft filters, `SyncHistoryTab`'s filter state, and `PublishModal`'s source/display-set selection are all plain local `useState` against URL or query-driven options, not a validated submission form. Whether these fall under `.claude/rules/05-form.md`'s scope is `NEEDS-TEAM-DECISION` — they are classified here as `uncertain`, not as a form-architecture gap.
- Import's client-side constraints are entirely file-selection constraints (`.xlsx` extension/MIME, 5MB max, single file via `react-dropzone`), not form validation; all row/cell-level validation is server-side, surfaced through the `stage`/`errors` response shape.

## 8. Types and DTO organization

- All request/response DTOs for both services live in their sibling `*.types.ts` files at the target location, per `.claude/rules/03-api-service.md` point 6 — `scheme-sync.types.ts` and `scheme-import.types.ts` both outside this module directory.
- `scheme-import.types.ts` uses `as const` object + derived literal union for every enum-shaped value (`ImportSource`, `ImportRowType`, `ImportRowCategory`, `ImportCellSource`, `ImportCellErrorType`, `ImportValidateStage`, etc.) — no application `enum`, consistent with the repository's constants policy. `scheme-sync.types.ts` is not fully consistent: `SyncGroup` is a bare literal union, not derived from a const object, while `SYNC_GROUPS` (the const object with the same values) lives separately in `constant.ts` — a duplicated-source-of-truth pattern, not an `enum` violation.
- Mapping exists where API and view shapes genuinely differ: `toSyncOverview`, `toSyncResultRow`/`toSyncResultRowFromImportItem`, `toSyncPage`, `toSourceScheme` in `utils/scheme-sync.mapper.ts` (which itself imports a constant from `import/constant.ts`, a parent-utility-imports-from-child dependency, §10).
- A view-model type (`CashLoanFilterValues`/`CashLoanFilterKey`) is declared inside a component file (`components/CashLoanTab/index.tsx`) and imported by three util/hook files — type-only, but a reversed dependency direction (utils/hooks depending on a component file) worth naming as a pattern smell, not a defect.
- A runtime constant (`SCHEME_SYNC_ROWS_PAGE_SIZE`) is defined in a hook file (`hooks/useSchemeSyncRows.hook.ts`) and imported as a value by a URL-utility file — a URL helper depending on a hook module.
- `scheme-import.types.ts` imports `PageInfo`/`SyncGroup` from `scheme-sync.types.ts`, and `scheme-sync.types.ts` imports `ImportRowType`/`ImportSource` back — a type-only circular import between the two sibling service-types files, with no runtime cycle risk.
- `scheme-sync.tokens.ts` (a TS color/size token object) has no runtime consumer anywhere in the module (CONFIRMED by grep); the same color values are separately hardcoded in `scheme-sync.module.scss` and again in `import/utils/import-error-workbook.helper.ts` (which must hardcode because ExcelJS cannot read CSS) — three independent sources for the same palette.

## 9. Permissions

This module references exactly **2** `PERMISSIONS.*` constants, both at `src/constants/permission.constant.ts:155-158`: `PRODUCT_SCHEME_SYNC_CLASSIFICATION_VIEW` (`'product_scheme_sync_classification:view'`) and `PRODUCT_SCHEME_SYNC_CLASSIFICATION_EDIT` (`'product_scheme_sync_classification:edit'`). This is well under the template's >10-constant table threshold, so no named-group table is used.

- **VIEW** gates the route (`main.routes.tsx:189`) and the menu entry (`menus.helper.ts:359`), both as a single-permission array (not an OR of multiple permissions), both confirmed by direct read of the call site.
- **EDIT** is checked once, at the page level (`views/SchemeSyncPage/index.tsx:41`, `hasPermission([PERMISSIONS...EDIT])`, single-permission array via `useHasPermission`), and the resulting `canEditSchemeSync` boolean is threaded as a prop/argument into every gated action: the Import button, the Sync button, publish eligibility for both sources, the import-open guard inside `useSchemeSyncImportFlow`, the schedule-edit button, and the status modal's retry/start affordances.
- **`import/` itself references zero permission constants** (CONFIRMED by grep) — it relies entirely on the single page-level `canEditSchemeSync` gate passed down through the flow hook. The stale planning document's stated decision to reuse `PRODUCT_SCHEME_SYNC_CLASSIFICATION_EDIT` with no new constant is **CONFIRMED still true** in current source.
- **Not permission-gated** (visible to any VIEW-holding user): the "Lịch sử" (history) button, `ResultsTable`'s compare/detail row actions, and all filter/paging interaction.
- Backend enforcement of EDIT on `run-now`, `publish`, and the job-config PUT is frontend-only from this side — `NEEDS-VERIFICATION` (§0, §13 risk 9). The backend-contract reference document separately states a different permission string (`product:create:cash_loan`) for the import presigned/publish endpoints than the frontend's own gate — see §6's correction list, item 6.

## 10. Shared and cross-domain dependencies

**Imported by this module from outside `products/`:** ordinary shared-component reuse (`@/components/button`, `no-data`, `pagination`, `table-wrapper`, `table-card-status`, `table-link`, `modal-content`), ordinary shared-hook reuse (`@/hooks/modal.hook`, `@/hooks/auth.hook`), ordinary Redux reuse (`@/redux/hooks`, `notification.slice`, `auth.slice` for `watchUser`), `@/constants/{permission,common}.constant`, `@/utils/{i18n,navigate}`, the `@/services` barrel. No Emotion anywhere in this module (CONFIRMED by grep) — purely SCSS Modules plus one shared root `.module.scss`/`_chip.scss`.

**One genuine cross-domain import within `products/`:** `PublishModal` calls `useDisplayInformationSetListQuery` from `@/modules/products/configuration/display-information-set/hooks/displayInformationSetQueries` (with `size: 99999`, enabled for any selected publish source) — a direct cross-feature-module hook import, not merely a shared type.

**Reverse dependency, flagged by the content rule as higher-weight than an ordinary import:** `src/components/product-configuration/shared/history/history-comparison.helper.ts` imports `mapChangedField` from this module's `utils/comparison-drawer.helper.ts`. This is a shared-component file depending on business-module internals, contrary to `.claude/rules/01-architecture.md`'s "Shared code must not import business-module internals." It is recorded here as an existing `LEGACY-COMPATIBILITY` dependency, not something this documentation pass changes.

**Service-to-module-utils import:** `src/services/products/scheme-sync.service.ts` imports mapping functions from this module's own `utils/scheme-sync.mapper.ts`. `.claude/rules/03-api-service.md` point 4's named exception explicitly covers `types/`, `dto/`, `mappers/`, `queryKeys/`, and `schemas/` staying module-owned while `src/services/` imports from them — it does not name a plain `utils/` folder playing the `mappers/` role, which this module's `utils/scheme-sync.mapper.ts` effectively does. Recorded as a naming/placement observation, not a violation to fix here.

**Shared stylesheet used as a cross-component contract:** `scheme-sync.module.scss`'s `.scope` class and several `:global` AntD-portal override rules (including legacy CSS-variable aliases such as `--primary-color`) are imported by at least eight component files across both the parent and `import/`, not treated as each component's own private module. `.claude/rules/10-styling.md` lists "a component imports a feature/global stylesheet only for local presentation" as a smell for new code; classified here as `uncertain`, not a confirmed violation, since this predates the rule and is the module's established convention.

**Styling-token dependency from outside `products/`:** `src/modules/products/exclusive-touch/views/ExclusiveTouchPage.tsx` references the CSS custom property `var(--scheme-sync-warning)` — a cross-module dependency on this module's token naming, not an import statement.

No consumer imports anything from `import/` except through the parent's own integration points listed in §4/§6 (CONFIRMED by grep for `scheme-import|SchemeImport` outside this directory).

## 11. Consumers

- Direct consumers of this module's exported hooks/components: `views/SchemeSyncPage`, `components/{CashLoanTab,SyncStatusModal,SchemeDetailModal,SyncScheduleConfig,SyncHistoryModal,PublishModal}`, and the module's own hook files.
- The only outside reference to this module's route-level code is the standard `lazy()` import in `src/routes/pages.tsx:19` — ordinary routing wiring, not a feature-level consumer relationship.
- `import/`'s components/hooks are consumed only by the parent's integration points (§6/§10); nothing outside `scheme-sync/` imports from `import/` directly.
- **Dead/unused exports found (CONFIRMED by grep, no fixes applied):** service methods `getBusinessLines`, `getSchemes`, `getSession`; mapper function `getBusinessLineCounts`; helper `formatSyncHistoryTime`; query key `schemeSyncQueryKeys.session`; hook-file interface `SchemeSyncRowsQueryParams`; `useSchemeSyncSessionQuery`'s unused second parameter; `SyncStatusModal`'s unused `startOnOpen`/`initialError`/`onRetryStart` props, which leave that modal's own auto-start effect and retry-start branch currently unreachable from any in-scope caller; `scheme-sync.tokens.ts`'s entire token object; and, inside `import/`, `expiresAt` on the presigned-upload response, the `itemIds` branch of the publish-request union (only the `importId` branch is ever sent), `ImportConfirmModal`'s `summary.create`/`summary.update` props (the confirm copy uses only a `{{total}}` placeholder), `ImportItemFieldChange`, and the `ImportValidateStage`/`ImportCellErrorType` type exports (consumers compare against string literals instead).

## 12. Pattern classification

**Mixed — strongly target-compatible in state ownership and service location, with several named exceptions and one documented transport deviation:**

- **State ownership (target-compatible):** sole TanStack Query ownership for all sync/import/publish server data, zero Redux duplication — exactly the "server data for a new/feature resource → TanStack Query" row, satisfying "one server resource, one authoritative owner."
- **URL state for group/filter/paging (target-compatible, and comparatively rare in this repository):** genuine `useSearchParams`, matching `.claude/rules/04-state-management.md`'s preferred row for shareable list state, unlike the dominant Redux `pageParam` pattern documented for e.g. `bank-list`.
- **Service location (target-compatible):** both services at `src/services/products/`, with sibling `*.types.ts` files, per the adopted 2026-10-29 convention — and notably further along than a stale 2026-10-29 `.claude/PROJECT_CONTEXT.md` entry still describes (§6).
- **Query key factory (named exception, not a violation, but the naming rule text is stale):** colocated `queryOptions` for several methods plus plain prefix arrays for others — a hybrid shape that `.claude/rules/03-api-service.md` already carves out an exception for by name, but whose own description of that exception ("keys-only") no longer matches current source.
- **Direct S3 `fetch` bypassing `ApiFetcher` (documented, intentional deviation):** the one confirmed exception to "`ApiFetcher` remains the transport boundary," justified in-code for a presigned-URL upload target that isn't this application's own API. `NEEDS-TEAM-DECISION` on whether this exception is formally accepted (the original planning document already flagged it as needing team confirmation; that confirmation step was never closed).
- **Forms (target-compatible for the one real form; uncertain for filter/selection UIs):** AntD `Form`/`FormInstance` for the schedule editor, no RHF, no unnecessary Zod for two simple constraints.
- **Styling (target-compatible components, legacy-shaped shared stylesheet):** SCSS Modules per component folder throughout both the parent and `import/`, but a shared root stylesheet used as a cross-component presentation contract by at least eight files (§10) — classified `uncertain`, not a violation, given it predates the relevant rule.
- **i18n (mostly compliant, with a real gap):** a `ProductSchemeSync.*` namespace exists in both `src/lang/vi.json` and `src/lang/en.json` with an identical key set and identical interpolation placeholders across all ~154 distinct keys actually referenced in this module (CONFIRMED by both subagents independently). However, a substantial amount of UI text remains hardcoded Vietnamese rather than routed through `t()` — filter labels, several table column titles, KPI card metadata, and status-modal body text, among others (CONFIRMED by direct file reads, not merely inferred). This is recorded as a real current-state gap against `.claude/rules/11-i18n.md`, not a `legacy-compatible` exemption, since the namespace already exists and is already partially used correctly in the same files.
- **Naming conventions (minor, factual):** `useSchemeSync.ts` lacks the `.hook.ts` suffix every sibling hook file uses; `utils/presentation.ts` and `utils/scheme-sync.mapper.ts` use suffixes outside the list CLAUDE.md establishes (`*.mapper.ts` is close but not exactly named in that list); `import/hooks/scheme-import.queries.hook.ts` contains zero `useQuery` calls despite its name (it is mutations-only; the actual queries are inline in the component files that use them).

## 13. Technical risks

Ordered by decreasing consequence; each entry opens with a bold category label per the template.

1. **Import-publish cache coupling gap.** After an import publish, `handleImportPublished` sets `lastImportResult` to `null`, which re-enables the "latest import summary" query (gated on `lastImportResult === null && confirmedImport === null`). If that query's cached data is still fresh (60s `staleTime`) and not yet reporting `PUBLISHED`, the recovery effect can re-populate `lastImportResult` from stale cache before the post-publish invalidation's refetch resolves — and nothing clears a re-populated `lastImportResult` once the refetch later does report `PUBLISHED`. `LIKELY`, needs a runtime reproduction (publish, then remount or reselect) to confirm whether publish-eligibility can persist past a completed publish until page reload.
2. **Backend-contract document drift (now corrected).** The separate `docs/modules/products/products-loan-excel-import-api.md` had several concrete mismatches against current source (importCode timing, cell-error display text, the Import-button-publishes claim, `displaySetCode` requirement, the stated permission string, missing-endpoint coverage) — see §6's correction list. This document's writer applied the corrections directly to that file in this pass; the `importCode`-timing and permission-string items remain `NEEDS-VERIFICATION` against the actual backend, since frontend source alone cannot settle which side was wrong.
3. **No invalidation of pending-import-item cache or publish-history after certain mutations.** `schemeImportQueryKeys.itemsAll` is never invalidated by any mutation (up to 60s of stale pending-import rows after a publish); `publishHistoryAll` is never invalidated after a **sync** publish specifically (up to 60s of stale publish-history rows). Both `CONFIRMED` as cache-key gaps by source inspection; actual data-staleness impact is `NEEDS-VERIFICATION` against backend behavior.
4. **Hard 1000-row bulk-fetch cap with no truncation detection.** `useSchemeSyncRows` always requests `page: 0, size: 1000` for a classification group and has no logic to detect or surface a group that exceeds that size; KPI totals (from a separate `cashLoanStats` endpoint) could then diverge from the rendered row count for an oversized group. Backend's actual max page size is `NEEDS-VERIFICATION`.
5. **No `AbortSignal` forwarding anywhere in `scheme-sync.service.ts` or its query functions.** Changing filter/group/page in quick succession does not cancel an in-flight request for a stale parameter set; TanStack's key-based caching limits the visible blast radius, but whether a late-arriving stale response can ever overwrite fresher UI state is `NEEDS-VERIFICATION`. (`import/`'s service methods mostly do forward signals — the gap is specific to `scheme-sync.service.ts`.)
6. **Frontend-only enforcement of the EDIT gate** on `run-now`, `publish`, and the job-config PUT across both the sync and import flows (§9). Backend-side enforcement is `NEEDS-VERIFICATION`; frontend checks never substitute for backend authorization per `.claude/rules/01-architecture.md`.
7. **All check-stage failures collapse into one generic message.** Any failure across the presigned-URL request, the S3 upload, or the validate call in the import flow surfaces as the same generic `checkFailed` toast, discarding the underlying error/cause; only a `FILE`-stage structural error gets its own detailed UI. This is a behavior observation, not a proven defect, since the file is retained and a retry is always possible.
8. **i18n gap: a real namespace exists but is inconsistently used.** As recorded in §12, a correctly-mirrored `ProductSchemeSync.*` namespace exists in both language files, yet substantial Vietnamese UI text in this module bypasses it. Per `.claude/rules/11-i18n.md`, a Vietnamese label belongs in `vi.json` behind `t()`; this module already demonstrates the correct pattern elsewhere in the same files, which argues against treating this as a pre-existing exemption.
9. **History-tab filter/sort/page state is not URL state**, unlike the page's own filters, so it silently resets every time the history modal is reopened (`destroyInactiveTabPane`) while the page's own filtered/grouped/paged view survives a reload. A UX inconsistency between two state mechanisms in the same module, not a correctness defect.
10. **Duplicated client-side validation logic between `ImportHistoryTab` and `PublishHistoryTab`:** independently re-implemented keyword-debounce (500ms) and default date-range (last 7 days) logic, with inconsistent page sizes (10 vs 20) between the two otherwise-parallel tabs.
11. **Dead/unused exports** (full list in §11) — low individual risk, but several (`SyncStatusModal`'s unreachable auto-start/retry branches in particular) represent built-but-never-wired functionality that a future change could silently reactivate without a caller ever having exercised it.
12. **Three independent sources for the same color palette:** `scheme-sync.tokens.ts` (unused), `scheme-sync.module.scss`'s SCSS values (in use), and hardcoded hex literals inside `import/utils/import-error-workbook.helper.ts` (necessarily hardcoded, since ExcelJS cannot read CSS, but not derived from either of the other two sources).
13. **Scheme-code-as-ID coercion edge case.** `getScheme` treats an all-digit `code` as a numeric scheme ID via `Number(code)` / `Number.isInteger`; `Number('')` evaluates to `0`, which is an integer. Whether an empty or purely-numeric scheme code can occur in practice is `NEEDS-VERIFICATION`.

## 14. Areas to avoid touching

- `useSchemeSyncImportFlow.hook.tsx`'s recovery-effect gating condition (`lastImportResult === null && confirmedImport === null`) and `useSchemeSyncPublish.hook.ts`'s `handleImportPublished` — these two functions jointly produce risk 1 above; changing either one's timing without the other changes the race window, not just moving it.
- `schemeSyncQueryKeys`/`schemeImportQueryKeys`'s invalidation call sites (`invalidateSchemeSyncData`, `useRefreshAfterImport`, `usePublishImportMutation`'s `onSuccess`) — these are the only three places that currently keep the parent and `import/` caches loosely synchronized (risk 3); a change to one without re-checking the other two can silently widen or narrow the staleness window.
- `scheme-sync.module.scss`'s `.scope` class and its `:global` AntD-portal override rules — shared, as a presentation contract, by at least eight component files across both the parent and `import/` (§10); a rename or restyle here is not locally scoped to one component.
- `src/components/product-configuration/shared/history/history-comparison.helper.ts`'s import of `mapChangedField` from this module — a reverse shared-to-module dependency (§10); a signature or behavior change to `comparison-drawer.helper.ts` must account for that outside consumer.
- `useDisplayInformationSetListQuery`'s cross-module call site inside `PublishModal` — the only genuine cross-feature-module hook import in this module; changing `display-information-set`'s query contract affects this module's publish flow too.

## 15. Open questions

- `NEEDS-VERIFICATION` (backend): whether `run-now` is synchronous; the actual max page size for `GET .../schemes`; whether `importCode` is genuinely available at validate time or only at first publish (§6 correction item 2); whether an import publish changes `/schemes` data such that parent rows need re-fetching; whether `updatedBy` on the schedule save is server-trusted; whether an empty or purely-numeric scheme code can occur (§13 risk 13); the actual required permission for the import presigned/publish endpoints (§6 correction item 6, §9).
- `NEEDS-VERIFICATION` (runtime, not exercised by static reading): the import-publish cache/recovery race (§13 risk 1); whether a stale, un-cancelled response can ever visibly overwrite fresher UI given the lack of `AbortSignal` forwarding (§13 risk 5); whether the 1000-row bulk-fetch cap is ever actually hit in production data (§13 risk 4).
- `NEEDS-TEAM-DECISION`: whether the direct S3 `fetch` bypassing `ApiFetcher` is a formally accepted exception to the transport-boundary rule (§6, §12) — this was already flagged as needing confirmation by the original, now-retired planning document, and that confirmation was never closed out; whether `.claude/rules/03-api-service.md`'s "keys-only" description of this module's query-key factory should be corrected to reflect the current hybrid shape (§6, §12); whether `.claude/PROJECT_CONTEXT.md`'s 2026-10-29 entry describing an unconsolidated `import/services/index.ts` barrel should be refreshed, since that path no longer exists (§6); whether `FilterBar`/`SyncHistoryTab`/`PublishModal`'s filter and selection UIs fall under `.claude/rules/05-form.md`'s scope (§8).
- `NEEDS-TEAM-DECISION`, carried forward from the retired `scheme-sync-import-plan.md` rather than dropped (per this task's instruction not to silently lose anything unverifiable): that document's "Giai đoạn B" checklist items around permission defense-in-depth at the mutation call site (not just hiding the button) and single-toast-per-success-path were written as acceptance criteria for the original rollout. Current source does show `canEditSchemeSync`-based guards at each mutation call site and single notification owners per flow (§5, §9, §12), which appears to satisfy that original intent, but this document's evidence gathering did not specifically re-verify "exactly one toast per success path" as an exhaustive property across every flow — recorded here rather than asserted as fully confirmed.
