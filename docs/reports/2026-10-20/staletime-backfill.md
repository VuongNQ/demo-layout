# Feature Implementation: staleTime backfill (theme-management)

Branch `feature/vuongnq/lock-theme_2468`, base revision `072be019` (uncommitted), date 2026-10-20.

## 1. Task
Add `staleTime: LIST_QUERY_STALE_TIME_MS` (60 s) to the four paginated list/history queries lacking it, per the SHOULD in `.claude/rules/03-api-service.md` (30 s - 5 min, module-owned constant, no global staleTime). Type: Bounded Existing-Feature Change.

## 2. Risk
SAFE/MODERATE: isolated option addition in two query-key factories; no key, payload, route or permission change.

## 3. Change Boundary
Changed: `src/modules/system/theme-management/theme/queryKeys/theme.query-keys.ts`, `src/modules/system/theme-management/topic/queryKeys/topic.query-keys.ts`. Not touched: `detail`, `reorderList`, theme-lock, constant value, `query.provider.tsx`, other modules, `.claude/`.
Preconditions verified: constant exists at `constant.ts:3` (60_000); no `staleTime` previously present in theme-management.

## 4. Architecture Decisions
Reused the existing module-owned constant; no new constant, no global default. `placeholderData: keepPreviousData` retained alongside.

## 5. Preserved Contracts
Query keys, normalize helpers, `enabled`, `placeholderData`, service calls unchanged. Inference (not proven): mutations invalidate `lists()` / `historyById(id)` / `histories()` prefixes and `invalidateQueries` marks entries stale regardless of `staleTime`, so post-mutation refetch is unchanged; global `refetchOnWindowFocus: false` unchanged.

## 6. Implementation Summary
Four `staleTime` lines added (theme list, theme history, topic list, topic history) and one import per file.
Consumers (grep-verified):
- theme list: `components/ThemeTableSection/index.tsx:133`
- theme history: `theme/components/ThemeUpdateHistory/index.tsx:66`
- topic list: `components/TopicTableSection/index.tsx:95`; topic selector in `theme/views/ThemeCreatePage/index.tsx:53` and `theme/views/ThemeEditPage/index.tsx:102` (inherit staleTime; the selector may reuse a cached category list for up to 60 s)
- topic history: `topic/components/TopicUpdateHistory/index.tsx:40`
- Invalidation-only users: `theme/hooks/theme.queries.hook.ts`, `topic/hooks/topic.queries.hook.ts` (use `lists()`/`historyById`, no options).

Diff stat: 2 files, 6 insertions.
```diff
--- theme.query-keys.ts
 import { keepPreviousData, queryOptions } from '@tanstack/react-query';
+import { LIST_QUERY_STALE_TIME_MS } from '../../constant';
 ...list:    queryFn...
+      staleTime: LIST_QUERY_STALE_TIME_MS,
       placeholderData: keepPreviousData
 ...history: enabled...
+      staleTime: LIST_QUERY_STALE_TIME_MS,
       placeholderData: keepPreviousData
--- topic.query-keys.ts
+import { LIST_QUERY_STALE_TIME_MS } from '../../constant';
 ...list:    enabled,
+      staleTime: LIST_QUERY_STALE_TIME_MS,
       placeholderData: keepPreviousData
 ...history: enabled: Number.isFinite(id),
+      staleTime: LIST_QUERY_STALE_TIME_MS,
       placeholderData: keepPreviousData
```
(abridged; the full `git diff` is in the run output.)

`grep -rn LIST_QUERY_STALE_TIME_MS src/`: constant.ts:3 (definition); theme.query-keys.ts:2,41,61; topic.query-keys.ts:2,48,78.

## 7. Validation Performed
- `npm run typecheck`: no errors.
- `npm run lint` (max-warnings 0): no output errors.
- `npx prettier --check` on both files: pass.
These prove nothing about cache behaviour.

## 8. Runtime Validation Gaps
Manual QA (not run): theme list, theme update-history, topic list, topic update-history, topic selector in ThemeCreatePage/ThemeEditPage. Expected: revisiting within 60 s does not refetch; after 60 s refetches on remount/key change; after create/update/reorder the list still refetches.

## 9. Test Debt
No test runner exists; cache-behaviour tests (staleTime, invalidation) would be useful future TEST-DEBT.

## 10. Reviewer Attention
- Selector in Create/Edit pages now may show up-to-60 s old topic categories (e.g. a topic created in another tab).
- `docs/reports/` did not exist in this checkout; created for this report.
