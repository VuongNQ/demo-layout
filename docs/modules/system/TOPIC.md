# Topic (Theme Category) — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `portal-cham-vay`; `git status` clean for `src/modules/system/theme-management/topic/`.
- Date: 2026-11-04.
- Method: static source inspection only, via one read-only `codebase-analyzer` delegation that read every file in the module plus the surrounding route/permission/menu wiring and the sibling `background-main/` module only to confirm the dependency direction between them. No runtime, browser, auth, or backend verification was performed. The two documents this file replaces (`REACT_QUERY_GUIDE.md`, `topic-api.md`) were deliberately **not** read by the delegation, to avoid carrying forward any stale claim unverified; every fact below was re-derived from current source.
- Scope: `src/modules/system/theme-management/topic/` — **24 files** (`find ... -type f | wc -l`; sibling `background-main/` has 27). This folder's own name was **not** changed during the 2026-10-21 rename that produced `background-main/`/`background-main-lock/` — see `docs/modules/system/THEME-MANAGEMENT.md` §1 for the full "deliberately not renamed" list. The backend/domain concept behind this folder is "Theme Category" (wire path `theme-categories`); its permission constants (`THEME_CATEGORY_VIEW`/`_CREATE`/`_EDIT`) are likewise intentionally still named this way, not stale.
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Whether excluding `INACTIVE` topics from the drag-reorder screen's payload (confirmed: the reorder draft is built only from the subset of topics the priority-list query itself already filters to) matches the intended business rule, or whether disabled topics should still participate in priority ordering (§4 Flow E, §10 risk 1 — the highest-consequence open item in this document).
  2. Whether the backend actually computes `code` (format `CAT-NNN`), default `priority` (`max+1`), and `displayStatus` the way the frontend assumes — the frontend never sends `code` or `priority` on create and never computes `displayStatus` itself; all three are backend-only concerns the frontend only displays (§2).
  3. Whether a stale cached reorder-list `version` (not invalidated by a plain create/update mutation, only refetched explicitly before a reorder submission) can ever actually reach the backend as a stale optimistic-lock value in practice (§10 risk 2).
  4. Whether a runtime-only locale switch (without a page reload) leaves this module's Zod schema messages, which are evaluated at module-import time, stale in the browser (§7, §10 risk 8).
  5. Full detail of several files the delegation did not read to the same depth as the rest (`TopicListPage`'s and `TopicViewPage`'s page bodies beyond their permission gates, `TopicCreatePage`'s error branches, `TopicActionModal`, `TopicFormPageShell`, `TopicPrioritySortPage`'s body beyond its gate) — treat any claim about those specific files' internals not otherwise cited below as unverified.

## 1. Responsibility

Admin catalog of "Topics" (backend/API concept: Theme Category, wire path `theme-categories`) used to group and prioritize Background Main items for display. List with search/filter, create, edit (with an optimistic-lock `version` field), view-with-history, and a dedicated drag-and-drop priority-reorder screen — the one structural feature this module has that its sibling `background-main/` does not. No delete flow.

## 2. Entry points and routes

Per content rule 13, evidence below was gathered from `src/routes/main.routes.tsx`, `src/routes/form.routes.tsx`, `src/routes/pages.tsx`, `src/helpers/menus.helper.ts`, and `src/utils/navigate.ts`.

| Route | File:line | Layout | Route-level permission | Page-level check |
| --- | --- | --- | --- | --- |
| `PageURLs.ofThemeTopicList()` | `main.routes.tsx:391-394` | MainLayout | `[THEME_CATEGORY_VIEW]` (single) | none beyond the route gate |
| `PageURLs.ofThemeTopicCreate()` | `form.routes.tsx:129-132` | BasicLayout | `[THEME_CATEGORY_CREATE]` (single) | redirects to 404 if not held (`TopicCreatePage.tsx:22`) |
| `PageURLs.ofThemeTopicSort()` | `form.routes.tsx:119-128` | BasicLayout | `[THEME_CATEGORY_VIEW, THEME_CATEGORY_EDIT]` **OR** (`form.routes.tsx:125`) | `'every'` **AND** in-page (`TopicPrioritySortPage.tsx:21-27`) |
| `PageURLs.ofThemeTopicView(':id')` | `form.routes.tsx:133-136` | BasicLayout | `[THEME_CATEGORY_VIEW]` (single) | `canEdit` check for the Edit button only (`TopicViewPage.tsx:49`) |
| `PageURLs.ofThemeTopicEdit(':id')` | `form.routes.tsx:137-146` | BasicLayout | `[THEME_CATEGORY_VIEW, THEME_CATEGORY_EDIT]` **OR** (`form.routes.tsx:143`) | `'every'` **AND** in-page (`TopicEditPage.tsx:33-37`) |

**Confirmed route-level-OR-plus-page-level-AND layering** on the sort and edit routes — the route itself admits a user holding either `THEME_CATEGORY_VIEW` or `THEME_CATEGORY_EDIT` alone (OR, via `WithGuard`/`GuardedPage`'s `.some()`, `src/guards/index.tsx:32`), but the page component itself immediately re-checks both with `'every'` (AND) and redirects to 404 if only one is held. The two registries are consistent in their final outcome (a user holding only one of the two is always redirected, just one step later than the route gate alone would suggest), but are worth recording explicitly rather than describing the route as the sole authority.

Lazy exports (`src/routes/pages.tsx`): `TopicListPage` (191), `TopicCreatePage` (195), `TopicPrioritySortPage` (198-199), `TopicViewPage` (196), `TopicEditPage` (197). `PageURLs` builders (`src/utils/navigate.ts:273-289`): `ofThemeTopicList/Create/Sort/View/Edit`, all prefixed `/system-management/theme-configuration/topics`. Menu: `src/helpers/menus.helper.ts:419-425`, label `Menu.themeTopicList`, link `ofThemeTopicList()`, single permission `[THEME_CATEGORY_VIEW]` — the menu and route registries use the same constant for the list, but are checked at both layers independently.

## 3. Directory map (24 files)

```text
src/modules/system/theme-management/topic/
|-- services/
|   `-- topic.service.ts                    # ApiFetcher wrappers: list/get/create/update/reorder/history
|-- types/
|   `-- topic.types.ts                       # display-status/history-action constants, response/request DTOs
|-- queryKeys/
|   `-- topic.query-keys.ts                   # topicQueryKeys factory, queryOptions colocated
|-- hooks/
|   `-- topic.queries.hook.ts                 # priority-list query + create/update/reorder mutation hooks
|-- schemas/
|   `-- topic-form.schema.ts                  # Zod create + edit schemas, TopicFormValues/TopicValidatedValues
|-- utils/
|   |-- topic-api-mapper.helper.ts            # response<->form, sort-item mapper, effective-period formatter
|   |-- topic-form-mapper.helper.ts           # form defaults (+ one dead export, see §10)
|   |-- topic-api.error.ts                    # status / 404 / 409 helpers
|   `-- topic-zod-antd-validation.helper.ts   # Zod issues -> AntD fieldErrors/formErrors
`-- views/
    |-- TopicListPage/index.tsx               # list route page, embeds the parent-shared TopicTableSection
    |-- TopicCreatePage/index.tsx              # create page
    |-- TopicViewPage/
    |   |-- index.tsx                         # detail view page
    |   `-- styles.module.scss
    |-- TopicEditPage/index.tsx                # edit page: optimistic lock, conflict reload
    `-- TopicPrioritySortPage/index.tsx        # drag-reorder page shell
components/ (parent-root, not under topic/ itself — see note below)
|-- TopicForm/                                 # shared create/edit form (Zod + AntD Form)
|-- TopicFormPageShell.tsx                      # header/footer shell for the two form pages
|-- TopicPrioritySortContent/                   # drag-reorder content, submit + conflict logic
|-- TopicUpdateHistory/                         # history table (one query per page)
`-- TopicActionModal/                           # enable/disable/delete modal — confirmed zero importers, §10
```

**Note on the component files listed above:** `TopicForm`, `TopicFormPageShell`, `TopicPrioritySortContent`, `TopicUpdateHistory`, and `TopicActionModal` physically live under the **parent** `theme-management/components/` folder (`components/TopicForm/`, etc.), not inside `topic/` itself, even though every one of them is a single-consumer, Topic-only file — the same ownership-placement pattern already flagged for `TopicTableSection` in `docs/modules/system/THEME-MANAGEMENT.md` §4.1/§10. They are listed here because this document is where their behavior is actually described; `THEME-MANAGEMENT.md` only records the placement question. The 24-file count for this document's own scope (`topic/` itself) does **not** include these five component files, consistent with the file count being derived from `find src/modules/system/theme-management/topic -type f`.

## 4. Main runtime flows (CONFIRMED)

Endpoint base `api/admin/portal/v1/theme-categories` (`services/topic.service.ts:13`):

| Operation | Method/path | Notes |
| --- | --- | --- |
| List/search/filter | GET `theme-categories?keyword&status&page&size&orderBy` | — |
| Get one | GET `theme-categories/{id}` | — |
| Create | POST `theme-categories` | request has no `code`, no `priority`, no `version` |
| Update | PUT `theme-categories/{id}` | request = create fields + `version` (optimistic lock) |
| Reorder (bulk) | PUT `theme-categories` (no id) | body `{items: [{id, version}]}`; no `priority` field sent — order is array order |
| History | GET `theme-categories/{id}/history?page&size&sort` | — |

Confirmed business rules: `code` is never sent by the frontend on create or update (read-only, disabled field in `TopicForm`) — backend generation itself (`CAT-NNN` format) is `NEEDS-VERIFICATION`. `priority` is never sent on create either — the form's `displayOrder` field is disabled and its default value is never submitted; backend default-assignment (`max+1`) is `NEEDS-VERIFICATION`. Each reorder item carries its own `version`, taken from the originally-loaded snapshot, not re-fetched per item. `displayStatus` (`INACTIVE`/`UPCOMING`/`ONGOING`/`ENDED`) is confirmed never computed by the frontend — it is read-only, mapped only to a UI badge/label; the backend formula is `NEEDS-VERIFICATION`.

- **Create** (`TopicCreatePage.tsx:24-36`): `mutateAsync(mapTopicFormValuesToCreateRequest(values))` → success toast → navigate to list.
- **Edit** (`TopicEditPage.tsx:94-119`): `mutateAsync({id, request})`, with 403/400/409 mapped to specific messages; success toast → navigate to view.
- **Reorder** (`TopicPrioritySortContent.tsx:161-240`): refetch the priority-list query first; compare each item's version/priority against the originally-captured snapshot (if any has changed, set a "needs reload" state rather than submitting against stale data); build the request from the current drag order with each item's **original** `version`; submit; on 400/409 also set the "needs reload" state.
- **History:** one paginated query per view/history mount, `topicQueryKeys.history(id, {page, size})` — the DTO supports a `sort` parameter, but `TopicUpdateHistory` never passes one (an unused capability, not a defect).

**Confirmed, highest-consequence finding in this document — the reorder flow silently excludes `INACTIVE` topics from the reorderable set.** `useTopicPriorityListQuery` filters out `INACTIVE` items via `excludeDisabledCategories` before the drag-reorder UI, the draft's completeness check, and the submitted payload ever see them (`hooks/topic.queries.hook.ts:52-59,73,78`). The hook's own code comment states this is intentional. The consequence: a disabled topic keeps whatever priority value it had before the reorder, which can collide with the newly-assigned `1..n` sequence given to the reordered (active) subset, since the reorder's own response-integrity check only verifies `priority === index+1` for the submitted subset, not the full collection. Whether disabled topics should participate in priority ordering at all is a product decision, not resolved here (§10 risk 1).

## 5. State ownership — Query-owned module checklist (content rule 15)

- **No Redux slice touches this resource** — `grep -i` for `theme-?categor|THEME_CATEGORY|topic` over `src/redux/` returns zero matches. The module's only Redux usage is the client-UI-state `setHiddenFormFooter` dispatch shared with every other sibling page in this tree.
- **Query key factory** (`queryKeys/topic.query-keys.ts`): colocates `queryOptions`, imports the feature service (not the reverse). Shape: `all` → `lists()`/`details()`/`histories()` → `list(params, enabled=true)`/`detail(id)`/`historyById(id)` → `history(id, params)`. **One confirmed structural deviation from the standard shape, intentional, mirrored in the superseded guide and re-verified here:** `reorderList()` is a **sibling of `lists()`, directly under `all`**, not nested inside it — `[...all, 'reorder-list', {page:0, size:99999, orderBy:'priority,asc'}]`. The consequence is that invalidating `lists()` does **not** also invalidate `reorderList()`; the reorder mutation's own `onSuccess` must (and does) invalidate both explicitly.
- **Every query:**

  | Query | `staleTime` | `placeholderData` | `enabled` predicate | Consumer(s) |
  | --- | --- | --- | --- | --- |
  | `list(params)` | `CACHE_STALE_TIME` (60s, `src/constants/common.constant.ts:14`) | `keepPreviousData` | explicit `enabled` argument | `TopicTableSection` (list), **and**, with different fixed params, `background-main/`'s create/edit pages for the category picker |
  | `reorderList()` | none (TanStack default 0) | none | none | `TopicPrioritySortContent` via `useTopicPriorityListQuery` |
  | `detail(id)` | none | n/a | **`Number.isFinite(id)`** — confirmed a different predicate from Background Main's `isSafeInteger(id) && id > 0` | `TopicViewPage`, `TopicEditPage` |
  | `history(id, params)` | `CACHE_STALE_TIME` (60s) | `keepPreviousData` | `Number.isFinite(id)` | `TopicUpdateHistory` |

  The `Number.isFinite` vs. `isSafeInteger && > 0` predicate difference between this module's `detail`/`history` queries and Background Main's own `detail` query (`BACKGROUND-MAIN.md` §5) is a confirmed, small inconsistency between sibling modules — `0` passes `Number.isFinite` but would be rejected by Background Main's stricter predicate.
- **Mutations:**
  - **Create** (`hooks:94-103`): `onSuccess` returns `invalidateQueries({queryKey: lists()})` — invalidates only `lists()`, not `reorderList()`.
  - **Update** (`hooks:105-128`): `onSuccess` awaits `Promise.all` invalidating `lists()`, `detail(id).queryKey`, and `historyById(id)` — also does **not** touch `reorderList()`. **Confirmed: no `setQueryData` anywhere in this module** — unlike Background Main's update mutation (`BACKGROUND-MAIN.md` §5), Topic's update relies purely on invalidation, never an authoritative direct cache write.
  - **Reorder** (`hooks:130-152`): `retry: false`; `onSuccess` awaits invalidating `reorderList()`, `lists()`, each returned item's own `detail(id).queryKey`, and `histories()`.
- **Mitigation for the reorder-list staleness implied by create/update not touching it:** the reorder submission flow itself refetches the priority-list query and re-compares every item's version/priority against its originally-captured snapshot before building the submission payload (§4) — so a stale cached reorder list is not, on its own, expected to reach the backend as a stale value; `NEEDS-VERIFICATION` that this guard is sufficient in every real-world sequence of events (§0 item 3).
- **Edit-page draft lifecycle:** `originalTopicRef` captures the first successful load; the form's own `initialValuesRef` freezes that snapshot for dirty-comparison purposes; on a version-conflict reload, the ref and a `formRevision` counter are both reset explicitly. A partial effective period (only one of start/end set) blocks submission and shows an inline banner, rather than silently defaulting the missing bound.

## 6. API boundaries

`services/topic.service.ts` (module-local, `LEGACY-COMPATIBILITY`; `src/services/system/theme-management/` does not exist for this or any Theme Management child). All calls go through `window.apiFetcher`. A runtime integrity guard exists specifically for the reorder response — not a generic Zod parse, but a purpose-built check (`service.ts:96-114` on the request, `:116-139` on the response): non-empty/unique/safe-integer ids and versions on the request side; array length, id order, `priority === index+1`, and safe-integer `version` on the response side. The response is then `as`-cast to `TopicReorderResponse` (`service.ts:141`) after those specific fields are checked — the cast covers fields (`name`, `displayStatus`, etc.) the integrity check does not independently verify, a low-risk gap given the fields the check does cover are the ones the reorder flow actually depends on. Error helpers (`topic-api.error.ts`) read `error.response.status`/`error.status` and match a 404 against either the HTTP status or a backend `code`/`errorCode` of `THEME_CATEGORY_NOT_FOUND` — the exact backend code string is `NEEDS-VERIFICATION`.

## 7. Forms and validation

AntD `Form.useForm<TopicFormValues>()` is the sole form-state owner (`components/TopicForm/index.tsx:72-73`). Zod schema file: `schemas/topic-form.schema.ts`, with separate `topicCreateFormSchema`/`topicFormSchema` (edit) selected by mode.

**Confirmed difference in execution style from sibling Background Main (re-verified, not carried forward from the superseded guide unverified):** this module validates **asynchronously** — `schema.safeParseAsync` (`TopicForm/index.tsx:160`) — guarded by an incrementing `validationSequenceRef` that discards a resolved validation if a newer one has since started (`:82,154,162`), a stale-validation-race guard Background Main's synchronous `schema.safeParse` does not need. Issue mapping: `mapTopicZodIssuesToAntdErrors` (`utils/topic-zod-antd-validation.helper.ts`) separates known top-level fields into AntD `fieldErrors` from everything else (unknown paths, non-string/number path segments) into `formErrors`; `TopicForm.applySchemaIssues` applies them via `form.setFields`, preserving any non-schema field errors already present and tracking the previous schema-error set so a field's error can be cleared once it is no longer failing. Revalidation on value change only begins after the first submit attempt. Cross-field validation (`validateEffectivePeriod`, a `superRefine` step) requires both dates together when `hasEffectivePeriod` is true and rejects an end date before the start date. `z.input`/`z.output` are correctly distinguished (`TopicFormValues`/`TopicValidatedValues`); the form consumes the input type, and the submit path consumes the parsed output.

**One confirmed, narrow validation inconsistency:** the edit schema validates `displayOrder` as a required positive integer even though the field is disabled in the UI and never actually sent in the update request (schema:75-79; mapper never includes it) — this cannot currently block a real save (the disabled field always holds a valid pre-populated value), but it is a schema constraint on a field the user cannot change, worth noting rather than silently assuming consistent.

## 8. Types and DTO organization

Feature-local only, `types/topic.types.ts` — no ambient/global type is used anywhere in this module. Constants are declared as `as const` objects with derived literal unions, not `enum` (compliant with the no-enum rule). One runtime-constant export, `THEME_CATEGORY_HISTORY_ACTION`, has zero runtime importers in `src/` — only its derived *type* is consumed (`TopicUpdateHistory`), the constant object itself is unused at runtime.

## 9. Permissions

Full set referenced: `THEME_CATEGORY_VIEW`/`_CREATE`/`_EDIT` (`permission.constant.ts:286-288`). Every check confirmed per call site, never inferred from a neighbor: the five routes in §2 (single, single, OR, single, OR respectively); the two in-page AND checks on the sort and edit pages (§2); `TopicListPage`'s create/view/edit action visibility flags (not fully read in depth, §0 item 5); `TopicViewPage.tsx:49`'s single-permission `canEdit` check gating the Edit button. No permission constant exists for delete — consistent with there being no delete flow.

## 10. Shared and cross-domain dependencies

- **Imports from outside its own folder** (all genuinely shared, per `THEME-MANAGEMENT.md` §4): the parent `theme-management/constant.ts` (`TopicStatus`, `TopicTableItem`, `topicStatusLabels` — all three confirmed single-consumer-within-Topic despite living at the shared root, see `THEME-MANAGEMENT.md` §4.4/§10), and the parent `theme-management/utils/gmt7-date.util.ts`/`effective-period-date.util.ts` (both genuinely shared with `background-main/` and `background-main-lock/`).
- **Confirmed dependency direction with `background-main/`: one-way, read-only, into Topic's own query keys and types — never the reverse.** `background-main/`'s create and edit pages import `topicQueryKeys.list(...)` (with their own fixed params, to populate a category picker) and `THEME_CATEGORY_DISPLAY_STATUS` from this module. A repository-wide grep for any import of `background-main/` from inside `topic/` finds **zero matches** (the only "background"-shaped string found inside `topic/` is an unrelated CSS class name, `TopicListPage/index.tsx:61`). This confirms the ownership direction stated in `THEME-MANAGEMENT.md` §1/§10: Background Main reads Topic; Topic never reads Background Main.
- **The parent-root `TopicTableSection`/`TopicForm`/`TopicFormPageShell`/`TopicPrioritySortContent`/`TopicUpdateHistory`/`TopicActionModal` components** (§3's note) import this module's own `queryKeys`/`types`/`utils` — the reverse-dependency direction already flagged in `THEME-MANAGEMENT.md` §10 (shared-folder components depending on one specific child), recorded there, not re-litigated here.
- **No cross-module query-key dependency exists outside `theme-management/` entirely** for this module (unlike Background Main's customer-segment dependency) — a repository-wide grep for `topicQueryKeys` outside `theme-management/` returns no hits besides the confirmed Background Main consumer above.

## 11. Consumers

Route/lazy wiring (§2); `background-main/`'s create and edit pages (§10, one-way read); the parent-root component files listed in §3, each a single-Topic-consumer file. No outside module imports anything from inside `topic/` beyond these.

## 12. Pattern classification

**Mixed, target-compatible in the areas that matter most, one confirmed i18n gap:** query-key factory with colocated `queryOptions`, factory imports the service not the reverse — **target-compatible**; invalidation-only mutation sync (no `setQueryData`, appropriate since this module's update response is not treated as unconditionally authoritative over the detail cache the way Background Main's is) — **target-compatible**; `Form.useForm` as sole form-state owner with async, sequence-guarded Zod validation explicitly invoked before submission — **target-compatible**; module-local `services/` — **LEGACY-COMPATIBILITY**; styling is SCSS Modules throughout (`views/TopicViewPage/styles.module.scss` and the parent-root component folders' own stylesheets), no Emotion anywhere in this module, unlike the one confirmed exception in sibling `background-main/`.

**Confirmed, isolated i18n gap:** several view files hardcode Vietnamese UI strings directly rather than going through `t()` — `TopicEditPage.tsx:75,78` (an error message and a retry-button label), `TopicViewPage.tsx:110,113,135,138` (similar strings), and `TopicListPage.tsx:26` (the page title/subtitle). This is a confirmed, narrow violation of `.claude/rules/11-i18n.md`, worth naming plainly rather than softening — the rest of this module's `ThemeManagement.topic.*` namespace otherwise follows the PascalCase-container/camelCase-children convention correctly.

## 13. Technical risks, ordered by decreasing consequence

1. **The drag-reorder flow silently excludes `INACTIVE` topics from the reorderable set** (§4) — the highest-consequence open item in this document. `NEEDS-TEAM-DECISION`: whether disabled topics should participate in priority ordering at all, and if so, how their priority should be reconciled against the active subset's freshly-assigned `1..n` sequence.
2. **Create and update mutations never invalidate `reorderList()`**, so the cached priority-sort data can go stale relative to a plain create/update — mitigated in practice by the reorder flow's own pre-submission refetch-and-compare step (§5), but the sufficiency of that mitigation across every real sequence of user actions is `NEEDS-VERIFICATION`.
3. **A query-key-shape inconsistency between sibling modules:** this module's `detail`/`history` queries use `Number.isFinite(id)` as their `enabled` predicate, while Background Main's equivalent uses the stricter `Number.isSafeInteger(id) && id > 0` — `id === 0` would behave differently between the two modules' detail queries. A documentation-only finding; not evaluated for real-world reachability.
4. **`displayOrder` is validated as a required positive integer in the edit schema despite being a disabled field never sent in the update request** (§7) — currently harmless (the field's pre-populated value always satisfies the constraint), but a schema constraint on an unsendable field is worth correcting attention if the field's disabled state is ever lifted.
5. **Confirmed dead code, zero importers anywhere in `src/`:** `components/TopicActionModal/index.tsx`, `TOPIC_PRIORITY_OPTIONS` (`schemas/topic-form.schema.ts`), `mapTopicTableItemToFormValues` (`utils/topic-form-mapper.helper.ts`), and the runtime constant object `THEME_CATEGORY_HISTORY_ACTION` (only its type is used elsewhere).
6. **An unchecked `as`-cast on the reorder response** (`service.ts:141`) covers fields the response's own integrity check does not independently verify (`name`, `displayStatus`, etc.) — low risk, since the fields the integrity check does cover are the ones the reorder flow actually depends on for correctness.
7. **Hardcoded Vietnamese UI strings in three view files** (§12) — a confirmed, isolated i18n gap against an otherwise largely-compliant namespace.
8. **Zod schema messages evaluated at module-import time** (several message strings in `schemas/topic-form.schema.ts`), the same pattern already flagged for Background Main's own schema (`BACKGROUND-MAIN.md` §13, risk 8) — `NEEDS-VERIFICATION` whether a runtime-only locale switch leaves these stale without a page reload.
9. **`ThemeCategoryHistoryParams.sort` is a supported request parameter the frontend never actually sends** (`TopicUpdateHistory` passes only `page`/`size`) — an unused capability, not a defect.

## 14. Areas to avoid touching

- `queryKeys/topic.query-keys.ts`'s `reorderList()` sibling-of-`lists()` structure (§5) — any attempt to "simplify" this into a nested shape under `lists()` would silently change which mutations' invalidations reach it; the current shape is intentional, not an oversight.
- `services/topic.service.ts`'s reorder request/response integrity checks (§6) — the only runtime validation in this module, and the one thing standing between a malformed backend response and a silently-corrupted priority order on the client.
- `background-main/`'s create and edit pages' consumption of `topicQueryKeys`/`THEME_CATEGORY_DISPLAY_STATUS` (§10) — a change to either contract here has effects outside this document's own scope, in `background-main/` (see `BACKGROUND-MAIN.md` §27).
- The permission constants `THEME_CATEGORY_VIEW`/`_CREATE`/`_EDIT` and every route declaration in §2, including the route-OR/page-AND layering on the sort and edit routes — any change is a permission-semantics change and `HIGH-RISK` per `.claude/rules/06-routing-permission.md`.

## 15. Open questions

- `NEEDS-TEAM-DECISION`: whether `INACTIVE` topics should participate in priority reordering (risk 1) — the highest-consequence open item in this document.
- `NEEDS-VERIFICATION`: whether the reorder flow's refetch-and-compare mitigation (risk 2) is sufficient against every real sequence of create/update/reorder actions a user might perform.
- `NEEDS-VERIFICATION`: the backend's actual `code`-generation, default-`priority`, and `displayStatus` formulas (§4 item 2) — none of these are computed or verifiable from the frontend alone.
- `NEEDS-VERIFICATION`: whether a runtime-only locale switch leaves this module's module-load-evaluated Zod messages stale (risk 8).
- `NEEDS-TEAM-DECISION`: whether the five parent-root, single-Topic-consumer component files (§3's note, also recorded in `THEME-MANAGEMENT.md` §10) should be relocated into `topic/` itself. Not resolved here.
