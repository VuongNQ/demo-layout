# Theme Management — Module Documentation (Overview)
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `portal-cham-vay`; `git status` clean for everything under `src/modules/system/theme-management/`.
- Date: 2026-11-04.
- Method: static source inspection only, via four independent read-only `codebase-analyzer` delegations (one per child submodule — `background-main/`, `background-main-lock/`, `topic/` — plus one for the shared `components/`/`hooks/`/`utils/` layer and the three root files), each citing file:line. No runtime, browser, auth, or backend verification was performed.
- Scope: this document covers `src/modules/system/theme-management/` as a whole — **86 files** total (`find src/modules/system/theme-management -type f | wc -l`; sum of children: `background-main/` 27 + `background-main-lock/` 14 + `topic/` 24 + shared `components/` 15 + `hooks/` 1 + `utils/` 2 + 3 root files = 86). This document itself covers the shared layer, the root files, and cross-cutting facts; the two children with substantial independent request lifecycles have their own documents (§1).
- **Split decision:** three documents, not one, replacing the two superseded files (`REACT_QUERY_GUIDE.md`, `topic-api.md`):
  - [`BACKGROUND-MAIN.md`](BACKGROUND-MAIN.md) covers **both** `background-main/` (27 files) and `background-main-lock/` (14 files) in one document. They were renamed together on 2026-10-21 (`theme/` → `background-main/`, `theme-lock/` → `background-main-lock/`) and remain tightly coupled: `background-main-lock/` reads `background-main/`'s own detail-query cache via a cross-module `useQueries` call (`backgroundMainQueryKeys.detail(id)`) to resolve a locked background's effective period, and a shared error-handling utility (`theme-lock-period-error.util.ts`) was deliberately moved out of the shared `theme-management/utils/` folder and now lives inside `background-main/utils/` as its single remaining consumer is `background-main/`'s own edit page. Splitting them into two files would force this cross-reference material (the period-resolution flow, the moved utility, the shared `THEME_LOCK_*` error-code handling) to be duplicated or constantly cross-linked; combining it avoids that.
  - [`TOPIC.md`](TOPIC.md) covers `topic/` (24 files) alone. Unlike the pair above, `topic/` has **no dependency in either direction** on `background-main/` or `background-main-lock/` beyond being read *from* `background-main/` (a one-way read of `topic/`'s query keys and a status-enum type, never the reverse) — it owns a structurally distinct request lifecycle (a drag-reorder screen with its own query-key shape, an async Zod validation pattern, and an optimistic-lock `version` field on every write) substantial enough to stand alone, and splitting it out does not require duplicating anything from the `background-main` pair.
  - This document (`THEME-MANAGEMENT.md`) is the overview: module-level responsibility, the full directory map, the shared `components/`/`hooks/`/`utils/` layer and the three root files, cross-cutting routing/permission/state facts, and the submodule index.
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Whether the backend still returns `THEME_LOCK_PERIOD_NOT_COVERED` on a *lock* save, and with what HTTP status — this determines whether the accepted regression recorded in `docs/audits/theme-management/2026-10-21/background-main-rename.md` (the lock module's own special-case handling for this code was deliberately removed and now falls through to a generic message) is still live in practice. See `BACKGROUND-MAIN.md` §13.
  2. Whether a user's locale can change at runtime without a full reload — several `t()` calls across this module tree (Zod schema messages, module-scope filter-option labels) are evaluated once at module import, not per render, so a runtime-only locale switch may leave them stale. Not verified against `src/utils/i18n.ts`'s actual initialization behavior.
  3. Whether saving a Background Main item changes a Topic's displayed `themeCount` — `background-main/`'s create/update mutations invalidate only `background-main`-owned query keys, never any `topic`-owned key, and `topic/`'s own list query has a 60-second `staleTime`, so a just-changed count could display stale for up to that window after a background save. See `BACKGROUND-MAIN.md` §13 / `TOPIC.md`.
  4. Runtime reachability of several frontend-only validation/permission edge cases recorded in the two child documents (e.g. whether a user holding only a subset of the OR-gated route permissions but failing the AND-gated in-page check ever actually reaches a blocked state in the browser) — all are static-source findings.
  5. Whether `ThemePermissionGate.tsx` (§4, a root-level file) is referenced anywhere through a dynamic/string-built import rather than a static one — a full-repository static grep found no importer, but a dynamic lookup would not be caught by that method.

## 1. Responsibility

`src/modules/system/theme-management/` is the admin area for the mobile app's "Theme" presentation layer: a **Background Main** (full-screen background image + optional in-app message, a renamed "Theme" entity, wire name still `themes`), a **Background Main Lock** workflow that restricts a Background Main's visibility to a date range, and a **Topic** catalog ("Theme Category", wire name `theme-categories`) used to group and prioritize Background Main items for display. All three are reached from one parent route tree, share a small set of presentation components and date/period utilities, and are documented as follows:

**Submodule index:**

| Child | Files | Documented in |
| --- | --- | --- |
| `background-main/` | 27 | [`BACKGROUND-MAIN.md`](BACKGROUND-MAIN.md) |
| `background-main-lock/` | 14 | [`BACKGROUND-MAIN.md`](BACKGROUND-MAIN.md) (same document, §4/§5/§6 as explicit subsections) |
| `topic/` | 24 | [`TOPIC.md`](TOPIC.md) |
| `components/` (shared) | 15 | this document, §4 |
| `hooks/` (shared) | 1 | this document, §4 |
| `utils/` (shared) | 2 | this document, §4 |
| Root files (`ThemeConfigurationRedirect.tsx`, `ThemePermissionGate.tsx`, `constant.ts`) | 3 | this document, §4 |

**Renamed vs. deliberately-not-renamed, confirmed current (CONFIRMED, all four delegations independently verified this list):** `theme/` and `theme-lock/` no longer exist anywhere in source; the current names are `background-main/` and `background-main-lock/` (2026-10-21 rename). The following were deliberately **not** renamed and remain exactly as named: the sibling folder `topic/` (never called "theme-topic" anywhere in source — that string does not appear; the only "theme-topic"-shaped artifact is the i18n key `Menu.themeTopicList`, which is itself a key name, not a folder); permission constants `THEME_VIEW`/`THEME_CREATE`/`THEME_EDIT` (`src/constants/permission.constant.ts:291-293`) and `THEME_CATEGORY_VIEW`/`THEME_CATEGORY_CREATE`/`THEME_CATEGORY_EDIT` (`:286-288`); `THEME_LOCK_*` error codes (e.g. `THEME_LOCK_PERIOD_NOT_COVERED`, confirmed still referenced in `background-main/utils/background-main-lock-period-error.util.ts:1`); the string literal `context: 'THEME'` (confirmed in `background-main/services/background-main.service.ts:117` and `background-main/types/background-main.types.ts:123`); `ManagementPageHeader`'s `variant: 'topic' | 'theme'` prop (the brief's premise that this prop lives on `ManagementDetailLayout` was incorrect — `ManagementDetailLayout` has no `variant` prop at all; the `variant='theme'` value is set only at `background-main/components/BackgroundMainPageShell.tsx:28`, consumed by `ManagementPageHeader`); the file names `ThemeConfigurationRedirect.tsx`/`ThemePermissionGate.tsx` (confirmed present at the `theme-management/` root, §4); the parent folder name `theme-management` itself; and the i18n key `Menu.themeList` (confirmed still the key used at `src/helpers/menus.helper.ts:428`, present in both `vi.json`/`en.json`). Backend wire fields `themeId`/`themeCode`/`themeName` and the `THEME_LOCK_*` codes were not found at this shared/root level (they are child-scoped) but are confirmed present in `background-main/` and `background-main-lock/`'s own files per `BACKGROUND-MAIN.md`.

## 2. Entry points and routes

Per content rule 13, evidence below was gathered from `src/routes/main.routes.tsx`, `src/routes/form.routes.tsx`, `src/routes/pages.tsx`, `src/helpers/menus.helper.ts`, `src/utils/navigate.ts`, and `src/constants/permission.constant.ts`, not from the module directory alone. Each child's own routes are detailed in its own document; this section covers only what is owned at the `theme-management/` root.

- **The module's only root-owned routes** are the legacy redirect, both in `main.routes.tsx` (MainLayout): `${ofThemeConfiguration()}` itself (`:377-386`, element `ThemeConfigurationRedirect`, permission OR `[THEME_CATEGORY_VIEW, THEME_VIEW]`) and a splat variant `${ofThemeConfiguration()}/themes/*` (`:388-391`, single permission `[THEME_VIEW]`). `theme-management/` has no route of its own in `form.routes.tsx`.
- **`ThemeConfigurationRedirect.tsx`** (root file, 60 lines, read in full) is confirmed still the module's public landing-route entry point. It reads a legacy `?tab=` query param (`tab=theme` → Background Main list, `tab=topic` → Topic list) and a legacy path shape (`/theme-configuration/themes[/create|/lock|/view/:id|/edit/:id]`, matched by regex at lines 23-25, requiring `THEME_VIEW` or else redirecting to 404), mapping each to the corresponding current `background-main` route. With no `tab` and no legacy path match, it defaults to the Topic list if the viewer holds `THEME_CATEGORY_VIEW`, else the Background Main list if they hold `THEME_VIEW`, else `PageURLs.of404()`. **One confirmed inaccuracy in the file's own doc comment:** lines 10-12 say a user with neither permission is sent to "the standard unauthorized page," but the actual behavior is a redirect to 404 (`src/guards/index.tsx:31-33`, and the file's own line 59) — the comment does not match the code. The file's own 404 fallback at line 59 is additionally `LIKELY` unreachable in practice, because the route-level OR gate (`main.routes.tsx:377-386`) already rejects a user holding neither permission before this component ever mounts.
- **`ThemePermissionGate.tsx`** (root file, 24 lines, read in full) is a generic OR/AND permission-gating wrapper component (`permissions: string[]`, `requireAll?: boolean`, default OR via `hasPermission(permissions, requireAll ? 'every' : 'some')`, redirecting to 404 on failure). **Confirmed dead code**: a full-repository grep for its import found zero importers anywhere in `src/` — no route or component in the entire `theme-management/` tree (or outside it) uses it. This is already noted as a pending follow-up removal in `.claude/PROJECT_CONTEXT.md:497` and `.claude/rules/06-routing-permission.md:64`; this document confirms the dead-code status is still current.
- **Menu entries are all child-owned**, not root-owned: `src/helpers/menus.helper.ts:419-431` registers a parent item `theme-configuration` (label `systemManagementThemeConfiguration`, link `PageURLs.ofThemeTopicList()`) with two children — `Menu.themeTopicList` (`:422`, `THEME_CATEGORY_VIEW`, linking to Topic's list) and `Menu.themeList` (`:428`, `THEME_VIEW`, linking to Background Main's list, confirmed still using this exact key name). There is no root-level or Background-Main-Lock menu entry.
- **`PageURLs.ofThemeConfiguration()`** is defined at `src/utils/navigate.ts:270-271` and used only by the two root routes above; nothing links to it directly as a visible menu item.

## 3. Directory map

```text
src/modules/system/theme-management/
|-- ThemeConfigurationRedirect.tsx   # public landing redirect (tab/legacy-path -> child route), still the module entry point
|-- ThemePermissionGate.tsx          # generic OR/AND permission wrapper — confirmed dead code, zero importers
|-- constant.ts                      # shared Topic status/table-item types + Background Main upload MIME/extension allow-lists
|-- components/                      # 15 files — see §4
|-- hooks/                           # 1 file — see §4
|-- utils/                           # 2 files — see §4
|-- background-main/                 # 27 files — see BACKGROUND-MAIN.md
|-- background-main-lock/            # 14 files — see BACKGROUND-MAIN.md
`-- topic/                           # 24 files — see TOPIC.md
```

Immediate child directories confirmed by `find -maxdepth 1 -type d`: exactly `background-main`, `background-main-lock`, `topic`, `components`, `hooks`, `utils` — nothing unexpected.

## 4. Shared layer (components/, hooks/, utils/, and root files)

### 4.1 `components/` (15 files: 7 component folders, each `index.tsx` + `styles.module.scss`, plus one shared stylesheet at the folder root)

| Component | Purpose | Consumers | Classification |
| --- | --- | --- | --- |
| `ManagementPageHeader` | Exit button + title header; `variant: 'topic' \| 'theme'` branches its own CSS | `background-main/components/BackgroundMainPageShell.tsx`, `topic/components/TopicFormPageShell.tsx`, `topic/views/TopicPrioritySortPage/`, `topic/views/TopicViewPage/` | Genuinely shared (2+ real consumer children) |
| `ManagementPageFooter` | Footer wrapper; `alignment: 'between' \| 'end'` | Same four consumers as above | Genuinely shared |
| `ManagementDetailLayout` | Generic section-nav + content layout for detail views; no `variant` prop (contrast `ManagementPageHeader`) | `background-main/views/BackgroundMainViewPage/`, `topic/views/TopicViewPage/` | Genuinely shared |
| `DetailLoadingState` | Centered AntD `Spin` for detail loading | `background-main/views/BackgroundMainEditPage/`, `BackgroundMainViewPage/`, `topic/views/TopicEditPage/`, `TopicViewPage/` | Genuinely shared |
| `ManagementTableSection` | Table-section chrome; `variant: 'card' \| 'flat'` — every current consumer passes `'flat'`, so `'card'` has no live consumer | `BackgroundMainTableSection`, `TopicTableSection` (both below, transitively) | Genuinely shared, one unused variant |
| `BackgroundMainTableSection` | Background Main's own list table (search, status chips, create/view actions) | Sole consumer: `background-main/views/BackgroundMainListPage/` | **Single-consumer, placed in the shared folder** — a local-first-ownership deviation (§10) |
| `TopicTableSection` | Topic's own list table (search, actions, permission-gated create/view/edit) | Sole consumer: `topic/views/TopicListPage/` | Same deviation as above |
| `chip-tag.module.scss` (folder root, not a component) | Read-only chip styling for list/detail tags | Sole live consumer: `BackgroundMainTableSection` (three `splash-screen` imports exist but are commented out, not live) | Single-consumer shared stylesheet |

### 4.2 `hooks/` (1 file)

`useDebouncedSearchKeyword.hook.ts` — debounced search input with IME-composition and Enter-key handling, imports only React. Consumers: `BackgroundMainTableSection` and `TopicTableSection` — genuinely cross-child shared, since those two components belong to different children.

### 4.3 `utils/` (2 files)

- `gmt7-date.util.ts` — exports `getGmt7DatePart` (returns a `YYYY-MM-DD` string in GMT+7). Consumers span three children: `background-main/views/BackgroundMainViewPage/`, `background-main-lock/utils/background-main-lock-date.util.ts`, `topic/utils/topic-api-mapper.helper.ts`, plus the shared `BackgroundMainTableSection` and this folder's own `effective-period-date.util.ts`.
- `effective-period-date.util.ts` — exports `serializeEffectivePeriodDateBound`, `mapEffectivePeriodDate`, `preserveUnchangedEffectivePeriodDateBound`. Consumers span the same three children: `background-main/utils/background-main-{create,edit}-mapper.helper.ts`, `background-main-lock/utils/background-main-lock-date.util.ts`, `topic/utils/topic-api-mapper.helper.ts`.

**Confirmed absence (per this task's brief, re-verified rather than assumed):** `theme-lock-period-error.util.ts` is **not** present in this shared `utils/` folder. It was deliberately moved out (per `docs/audits/theme-management/2026-10-21/background-main-rename.md`'s "Change 2") once it dropped to a single consumer, and now lives only at `background-main/utils/background-main-lock-period-error.util.ts`. This folder currently holds only the two date utilities above.

### 4.4 Root files

- `ThemeConfigurationRedirect.tsx` and `ThemePermissionGate.tsx` — see §2.
- `constant.ts` (44 lines, read in full): `TopicStatus` (lines 1-6, exported, Topic-only consumers), `EffectivePeriod` (lines 10-14, **not exported**, used only by `TopicTableItem` in the same file — one existing document's citation of this as `constant.ts:12` is off by two lines; the corrected line is 10), `TopicTableItem` (16-24, exported), `topicStatusLabels` (26-31, exported, hardcoded Vietnamese UI labels — `.claude/rules/11-i18n.md` expects Vietnamese labels behind `t()`, not in a constant; this is a confirmed, narrow exception, Topic-only consumer), and four `BACKGROUND_MAIN_*` MIME-type/extension allow-list constants (lines 33-44, all consumed only by `background-main/utils/background-main-image.validation.ts` and `background-main/components/BackgroundMainAssetPicker/`). Every export in this file has consumers in only one child — none is genuinely cross-child, which is the same local-first-ownership deviation noted for the two single-consumer shared components in §4.1.

### 4.5 Correction to a prior documented claim

**`LIST_QUERY_STALE_TIME_MS` does not exist anywhere in `src/`.** The superseded `REACT_QUERY_GUIDE.md` (now deleted — see §0) claimed this constant was defined at `constant.ts:3` with value `60_000`, and cited it as the `staleTime` used by several Theme/Topic queries. A fresh repository-wide grep confirms zero occurrences of that name in `src/`; `constant.ts:3` is actually part of the unrelated `TopicStatus` constant. The real constant actually used for `staleTime` across `background-main/` and `topic/`'s paginated queries is `CACHE_STALE_TIME` (60 seconds), defined centrally at `src/constants/common.constant.ts:14` — a repository-wide shared constant, not a `theme-management`-local one. This correction is the main reason the old guide could not simply be edited in place; see `BACKGROUND-MAIN.md`/`TOPIC.md` for the current, re-verified `staleTime` facts per query.

## 5. State ownership

**No Redux slice touches any resource anywhere in the `theme-management/` tree.** A full `src/redux/` grep for `theme`/`background`/`topic` (case-insensitive) returns zero resource-owning matches across all three children and the shared layer; the only Redux usage anywhere in this tree is the global `layout.slice`'s `setHiddenFormFooter` (client UI state, used identically by several child pages) and the global `notification.slice` toast mechanism. Every server resource in this module — Background Main, Background Main Lock, and Theme Category/Topic — is exclusively TanStack-Query-owned, with no second owner anywhere. See `BACKGROUND-MAIN.md` §5 and `TOPIC.md` §5 for the full per-resource Query-owned checklist (content rule 15): query key factory shape, every query/mutation hook's `staleTime`/`placeholderData`/`enabled`, and every mutation's invalidation behavior.

## 6. API boundaries

All three children call `window.apiFetcher` from a module-local `services/` folder (`background-main/services/`, `background-main-lock/services/`, `topic/services/`) — all `LEGACY-COMPATIBILITY` per `.claude/rules/03-api-service.md` `## Service location` point 5 and `.claude/rules/01-architecture.md`'s Approved Theme Management structure (a Background Main/Topic service inside the module is explicitly accepted as legacy, not a defect); `src/services/system/theme-management/` does not exist for any of the three. Endpoint base paths, one row per resource:

| Resource | Base path |
| --- | --- |
| Background Main | `api/admin/portal/v1/themes` (+ `api/admin/file` for uploads) |
| Background Main Lock | `api/admin/portal/v1/theme-locks` |
| Topic (Theme Category) | `api/admin/portal/v1/theme-categories` |

Full endpoint-by-endpoint detail, response guards, and the one unchecked-cast finding in Topic's reorder response are in the two child documents.

## 7. Forms and validation

All three children use AntD `Form`/`FormInstance` as the sole form-state owner. Background Main and Topic both use feature-owned Zod schemas, but with a confirmed difference in execution style: Background Main's form validates synchronously (`schema.safeParse`, `background-main/components/BackgroundMainForm/index.tsx:635`), while Topic's validates asynchronously (`schema.safeParseAsync`, `topic/components/TopicForm/index.tsx:160`) with an explicit sequence-guard ref (`validationSequenceRef`) to discard a stale validation result if a newer one has since started. Background Main Lock has no AntD `Form` and no Zod at all — its editing surface is a `Table` with inline `DatePicker`s, and its validators (`background-main-lock/utils/background-main-lock-validation.util.ts`) are plain TypeScript functions operating on a local draft array, not a form. Full detail is in the two child documents.

## 8. Types and DTO organization

All domain types across the three children are feature-local (`types/*.types.ts` or inline in a schema/mapper file) — no global ambient `.d.ts` file is used anywhere in this module tree, unlike several sibling `system/` submodules documented elsewhere (`administrative-unit`, `card-management`, etc., per `docs/modules/system/OVERVIEW.md` §8). The one shared-layer exception is `constant.ts`'s `TopicTableItem`/`EffectivePeriod` pair and the `BACKGROUND_MAIN_*` allow-lists (§4.4), which are feature-local types placed one level up from their single actual consumer, not genuinely shared contracts.

## 9. Permissions

The entire `theme-management/` tree references exactly **6** distinct `PERMISSIONS.*` constants, well under the template's >10-constant table threshold: `THEME_VIEW`/`THEME_CREATE`/`THEME_EDIT` (`permission.constant.ts:291-293`) and `THEME_CATEGORY_VIEW`/`THEME_CATEGORY_CREATE`/`THEME_CATEGORY_EDIT` (`:286-288`). At the root/shared level specifically: `ThemeConfigurationRedirect.tsx:17-18` checks both `THEME_CATEGORY_VIEW` and `THEME_VIEW` (each a single-element check, never combined into one array at this call site); `TopicTableSection/index.tsx:76-78` checks `THEME_CATEGORY_CREATE`/`THEME_CATEGORY_VIEW`/`THEME_CATEGORY_EDIT` (each single); `BackgroundMainTableSection/index.tsx:108` checks `THEME_CREATE` (single). Every check confirmed per call site is single-permission with the default `'some'` (OR) mode of `useHasPermission` (`src/hooks/auth.hook.ts:23-39`) — including the two root-route OR arrays described in §2. Full per-child permission tables, including the route-level-OR-vs-page-level-AND layering on Background Main's and Topic's edit/sort routes, are in the two child documents.

## 10. Shared and cross-domain dependencies

- **Reverse-dependency smell, confirmed:** the shared `components/BackgroundMainTableSection/` and `components/TopicTableSection/` each import internals from their own single child (`background-main/queryKeys`, `types`, `utils/...`, and the `topic/` equivalents respectively) despite sitting in the shared folder — the "shared" placement does not reflect a genuinely shared contract for either component; each has exactly one consumer. The same is true of `constant.ts`'s Topic-only and Background-Main-only exports (§4.4) and `chip-tag.module.scss` (§4.1). This is a local-first-ownership placement question (`.claude/rules/01-architecture.md`), not a runtime defect — recorded for the team's awareness, not fixed here.
- **Cross-child dependency confirmed in exactly one direction:** `background-main/` reads `topic/`'s query keys and a status-enum type (to populate a category picker in Background Main's own create/edit forms) — confirmed at `background-main/views/BackgroundMainCreatePage/index.tsx:10-11,64-66` and `BackgroundMainEditPage/index.tsx:14-15,79-80`. `topic/` never imports anything from `background-main/`. `background-main-lock/` separately reads `background-main/`'s own detail-query cache (a different, read-only cross-module edge, detailed in `BACKGROUND-MAIN.md`).
- **Nothing outside `theme-management/` imports from this shared layer or the root files**, beyond the standard route/lazy wiring in `src/routes/*` — confirmed by a full-repository grep for every shared component/hook/util name.

## 11. Consumers

Every child is consumed only through its own `lazy()` route entry in `src/routes/pages.tsx` plus `src/routes/main.routes.tsx`/`form.routes.tsx` — standard routing wiring. Within the tree, the shared layer (§4) is consumed as detailed in §10; the two cross-child dependencies (Background Main reading Topic's query keys/types, Background Main Lock reading Background Main's detail cache) are the module's only internal consumer relationships beyond ordinary parent-shared-layer reuse.

## 12. Pattern classification

**Mixed, consistent across all three children:** `target-compatible` in state ownership (TanStack Query, one owner per resource, zero Redux anywhere in the tree — §5) and in forms (AntD `Form`/`FormInstance` as sole owner, feature-owned Zod where used — §7); `LEGACY-COMPATIBILITY` in service location (module-local `services/`, no `src/services/system/theme-management/` yet — §6); mixed in styling (SCSS Modules are the dominant pattern across all three children and the shared layer, with one confirmed Emotion exception in `background-main/views/BackgroundMainListPage/index.tsx`, `legacy-compatible`); and a confirmed, narrow i18n gap in the shared `constant.ts`'s `topicStatusLabels` (§4.4) alongside otherwise-compliant i18n namespacing (`ThemeManagement.backgroundMain.*`, `ThemeManagement.backgroundMainLock.*`, `ThemeManagement.topic.*`, each confirmed present with full vi/en key parity in the two child documents).

## 13. Technical risks

Cross-cutting risks spanning more than one child, or owned at the shared/root level, ordered by decreasing consequence. Each child's own document carries its own, longer risk list (`BACKGROUND-MAIN.md` §13, `TOPIC.md` §9/§10) — this list does not repeat those, only what is genuinely shared or root-owned.

1. **The accepted `THEME_LOCK_PERIOD_NOT_COVERED` regression on lock save** (full detail in `BACKGROUND-MAIN.md` §13): the lock module's own special-case handling for this backend error code was deliberately removed per a 2026-10-23 change recorded in `docs/audits/theme-management/2026-10-21/background-main-rename.md`, and is confirmed still removed in current source — a lock save that triggers this code now gets a generic save-error or conflict message instead of the specific "lock period must be within the background's effective period" message. Whether the backend still returns this code on a lock save at all is `NEEDS-VERIFICATION`.
2. **`ThemePermissionGate.tsx` is confirmed dead code** (§2) — zero importers anywhere in `src/`, already flagged for removal in `.claude/PROJECT_CONTEXT.md`/`.claude/rules/06-routing-permission.md` as a pending follow-up, not performed here.
3. **Two shared-folder components and several `constant.ts` exports have exactly one real consumer each** (§4.1, §4.4, §10) — a local-first-ownership placement question across the shared layer as a whole, not a single isolated instance.
4. **Topic's displayed `themeCount` may read stale after a Background Main save** (§0 item 3): `background-main/`'s mutations invalidate only `background-main`-owned query keys, never any `topic`-owned key, and `topic/`'s list query has a 60-second `staleTime` — `NEEDS-VERIFICATION` whether this produces a user-visible stale count in practice.
5. **Module-scope `t()` evaluation** (§0 item 2) appears in more than one child (Zod schema messages in both Background Main's and Topic's schema files, module-scope filter-option label arrays) — a runtime-only locale switch without a page reload may leave these stale; `NEEDS-VERIFICATION` against the actual i18n initialization behavior.
6. **A previously-published documentation claim was wrong and is now corrected** (§4.5): the superseded `REACT_QUERY_GUIDE.md` cited a `LIST_QUERY_STALE_TIME_MS` constant that does not exist in source. This is recorded here as a correction, not carried forward as an open question — the real constant (`CACHE_STALE_TIME`) and its actual value/usage are documented fresh in `BACKGROUND-MAIN.md`/`TOPIC.md`.

## 14. Areas to avoid touching

- `src/modules/system/theme-management/utils/gmt7-date.util.ts` and `effective-period-date.util.ts` — genuinely shared across all three children (§4.3); a change to either's date-serialization semantics affects Background Main, Background Main Lock, and Topic simultaneously.
- `src/modules/system/theme-management/components/ManagementPageHeader`, `ManagementPageFooter`, `ManagementDetailLayout`, `DetailLoadingState`, `ManagementTableSection` — genuinely shared presentation components (§4.1); a prop or behavior change affects both `background-main/` and `topic/`'s view/edit/sort pages.
- `src/helpers/menus.helper.ts:419-431` and `src/utils/navigate.ts:270-271` (`ofThemeConfiguration`) — the parent menu entry and redirect target are shared infrastructure for both children's list pages; a change to either is `HIGH-RISK` per `.claude/rules/06-routing-permission.md`.
- The cross-module read from `background-main-lock/` into `background-main/`'s detail-query cache, and the one-directional read from `background-main/` into `topic/`'s query keys/types (§10) — changing either resource's query-key shape or response contract has effects outside its own child document's scope.

## 15. Open questions

- `NEEDS-VERIFICATION`: whether the backend still returns `THEME_LOCK_PERIOD_NOT_COVERED` on a lock save, and with what HTTP status (risk 1; full detail `BACKGROUND-MAIN.md` §15).
- `NEEDS-VERIFICATION`: whether a runtime-only locale switch (without a page reload) leaves any module-scope-evaluated `t()` string stale in the browser (risk 5).
- `NEEDS-VERIFICATION`: whether saving a Background Main item ever visibly changes a Topic's displayed `themeCount` with a noticeable staleness window (risk 4).
- `NEEDS-VERIFICATION`: whether `ThemePermissionGate.tsx` (risk 2) is referenced anywhere through a dynamic/string-built import that a static grep would miss.
- `NEEDS-TEAM-DECISION`: whether `BackgroundMainTableSection`, `TopicTableSection`, `chip-tag.module.scss`, and `constant.ts`'s single-child exports (risk 3) should be relocated into their respective owning children now that each has exactly one real consumer, or left as-is. Not resolved here.
