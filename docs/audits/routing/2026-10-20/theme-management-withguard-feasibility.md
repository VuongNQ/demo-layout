# Theme Management routes — `ThemePermissionGate` → `WithGuard` feasibility audit

| Field | Value |
|---|---|
| Date | 2026-10-20 |
| Branch | `feature/vuongnq/lock-theme_2468` |
| Revision (HEAD) | `e82df639` |
| Working tree | **Dirty**: uncommitted changes to `src/guards/auth.guard.tsx` and `src/routes/index.tsx` (see §0). Line numbers below refer to the **working tree** unless marked `HEAD`. |
| Task type | Analysis only. No source file was modified. |
| Risk | `HIGH-RISK` (routing / authentication / permission — `.claude/rules/06-routing-permission.md`) |
| Method | Static source inspection (`codebase-analyzer` subagent, then main-session re-verification of every key claim). Nothing was executed in a browser; `typecheck`/`lint`/`build` were not run. |

Certainty labels: `CONFIRMED` (read in source), `LIKELY` (inference from source with high confidence), `NEEDS-VERIFICATION`, `NEEDS-TEAM-DECISION`.

---

## Executive summary

- **ThemeEdit (`PageURLs.ofThemeEdit(':id')`) cannot migrate with identical access outcomes.** It is the only Theme/Topic route passing `requireAll` (AND over `THEME_VIEW`, `THEME_EDIT`, `THEME_CATEGORY_VIEW`). `WithGuard` is OR-only and has no mode prop. `ThemeEditPage` has no in-page AND check, so moving it would widen access → **`NEEDS-TEAM-DECISION`**.
- The five single-permission gated routes (TopicList, ThemeList, ThemeCreate, ThemeView, ThemeLock) and the two-permission-OR ThemeConfiguration redirect keep the **same final allow/deny decision** under `WithGuard`. The **transient and edge behavior is not identical**, though: unauthorized paint-then-redirect, a trailing-slash rewrite that drops the query string, and effect ordering against `AuthGuard` for logged-out users. Each migration is therefore `HIGH-RISK` by rule. The decision itself is `MODERATE` for the single-permission list/view/create/lock routes. ThemeConfiguration is `HIGH-RISK` because of a legacy deep-link regression (§11.3).
- The Topic sort/create/view/edit routes **already use `WithGuard`**. Nothing to migrate.
- `ThemePermissionGate` has **no code consumer outside `src/routes/index.tsx`**. It is referenced in `.claude/PROJECT_CONTEXT.md` and `.claude/rules/06-routing-permission.md:58`. It cannot be deleted while ThemeEdit keeps AND semantics, and deleting it would also require updating that rule text.
- The uncommitted working-tree change makes `AuthGuard` render `RouteSuspense` for **every** `AuthGuard` route in the app. That is a separate global `HIGH-RISK` change, and it should be reviewed on its own (§0, §11.4).

---

## 0. Working-tree state vs HEAD (EVIDENCE)

`git diff -- src/guards/auth.guard.tsx src/routes/index.tsx` (+9 −16):

**`src/guards/auth.guard.tsx`** — `CONFIRMED`
- L7 adds `import { RouteSuspense } from '.';`.
- L21-25 reformats the `/` redirect only.
- L27 changes `return <>{children}</>;` → `return <RouteSuspense>{children}</RouteSuspense>;`.
- Effect: every route wrapped in `AuthGuard` now has a Suspense boundary inside `AuthGuard`. This includes all ~150 `WithGuard(Guard={AuthGuard})` routes and the Product Labels exception. It is a global behavior change outside this audit's scope.

**`src/routes/index.tsx`** — `CONFIRMED`
- Removes the explicit `<RouteSuspense>` from TopicList, ThemeList, ThemeCreate, ThemeView and ThemeEdit.
- The lazy pages in those routes now depend on `AuthGuard`'s new boundary for Suspense. These two working-tree changes are therefore **coupled**: reverting `auth.guard.tsx` alone would leave five lazy pages with no route-level Suspense boundary.
- ThemeLock (L911-915) still has an explicit `<RouteSuspense>`.
- `<ThemeEditPage />` at L902 is mis-indented (a Prettier issue only).
- Lines containing `RouteSuspense` in `src/routes/index.tsx`: 29 at HEAD, 19 in the working tree. `CONFIRMED` by `grep -c`. This equals the 5 removed wrappers × 2 lines (open and close tag).
- No route was converted to `WithGuard`.

---

## 1. Task Understanding

For every Theme/Topic route in `src/routes/index.tsx`, the question is whether it can move from the current

```
AuthGuard -> ThemePermissionGate -> [RouteSuspense] -> lazy page
```

to the standard

```
WithGuard -> AuthGuard -> RouteSuspense -> lazy page
```

with **identical access outcomes**. No permission-semantics change may be proposed. Any AND → OR conversion is `NEEDS-TEAM-DECISION`.

## 2. Entry Point

- `src/routes/index.tsx` is the single route registry, a `LEGACY-COMPATIBILITY` contract.
- `ThemePermissionGate` is imported at L220. `lazy` is imported bare from React at L217.
- The Theme/Topic lazy page declarations are at L238-271:
  - L238 `TopicListPage`
  - L241 `ThemeListPage`
  - L244 `TopicCreatePage`
  - L247 `TopicViewPage`
  - L250 `TopicEditPage`
  - L253 `TopicPrioritySortPage`
  - L260 `ThemeCreatePage`
  - L263 `ThemeViewPage`
  - L266 `ThemeEditPage`
  - L269 `ThemeLockPage`

## 3. Feature Flow — every Theme/Topic route (EVIDENCE)

Located with `grep -n` for `ThemePermissionGate`, `requireAll`, `RouteSuspense`, `ofTheme` and `lazy(`. Line = the `path=` line. Wrappers are listed outermost → innermost.

| # | Route (`PageURLs`) | Line | Layout | Wrappers | Permissions | Mode | Lazy | Explicit `RouteSuspense` |
|---|---|---|---|---|---|---|---|---|
| 1 | `ofThemeConfiguration()` | 665 | MainLayout | `AuthGuard` > `ThemePermissionGate` > `ThemeConfigurationRedirect` | `THEME_CATEGORY_VIEW`, `THEME_VIEW` | OR (default) | **No** (eager redirect component) | No |
| 2 | `ofThemeTopicList()` | 680 | MainLayout | `AuthGuard` > Gate > `TopicListPage` | `THEME_CATEGORY_VIEW` | single | Yes | No (removed in WT; HEAD: yes) |
| 3 | `ofThemeList()` | 692 | MainLayout | `AuthGuard` > Gate > `ThemeListPage` | `THEME_VIEW` | single | Yes | No (removed in WT; HEAD: yes) |
| 4 | `ofThemeTopicSort()` | 825 | BasicLayout | `WithGuard(Page=TopicPrioritySortPage, Guard=AuthGuard)` | `THEME_CATEGORY_VIEW`, `THEME_CATEGORY_EDIT` | OR | Yes | via `WithGuard` |
| 5 | `ofThemeTopicCreate()` | 838 | BasicLayout | `WithGuard` | `THEME_CATEGORY_CREATE` | single | Yes | via `WithGuard` |
| 6 | `ofThemeTopicView(':id')` | 848 | BasicLayout | `WithGuard` | `THEME_CATEGORY_VIEW` | single | Yes | via `WithGuard` |
| 7 | `ofThemeTopicEdit(':id')` | 858 | BasicLayout | `WithGuard` | `THEME_CATEGORY_VIEW`, `THEME_CATEGORY_EDIT` | OR | Yes | via `WithGuard` |
| 8 | `ofThemeCreate()` | 871 | BasicLayout | `AuthGuard` > Gate > `ThemeCreatePage` | `THEME_CREATE` | single | Yes | No (removed in WT; HEAD: yes) |
| 9 | `ofThemeView(':id')` | 881 | BasicLayout | `AuthGuard` > Gate > `ThemeViewPage` | `THEME_VIEW` | single | Yes | No (removed in WT; HEAD: yes) |
| 10 | `ofThemeEdit(':id')` | 891 | BasicLayout | `AuthGuard` > Gate **`requireAll`** (L900) > `ThemeEditPage` | `THEME_VIEW` **AND** `THEME_EDIT` **AND** `THEME_CATEGORY_VIEW` | **AND** | Yes | No (removed in WT; HEAD: yes) |
| 11 | `ofThemeLock()` | 908 | BasicLayout | `AuthGuard` > Gate > `RouteSuspense` > `ThemeLockPage` | `THEME_VIEW` | single | Yes | **Yes** |

- `ThemePermissionGate` is used at **7** sites: L668, 683, 695, 874, 884, 894 and 911.
- `requireAll` appears **once**, at L900 (ThemeEdit). `CONFIRMED`.
- Permission constants in `src/constants/permission.constant.ts`, `CONFIRMED`:
  - `THEME_CATEGORY_VIEW: 'theme_category:view'` (L265)
  - `THEME_CATEGORY_CREATE: 'theme_category:create'` (L266)
  - `THEME_CATEGORY_EDIT: 'theme_category:edit'` (L267)
  - `THEME_VIEW: 'theme:view'` (L270)
  - `THEME_CREATE: 'theme:create'` (L271)
  - `THEME_EDIT: 'theme:edit'` (L272)
- No duplicate Theme/Topic path declarations were found. Each `ofTheme*` builder appears once as a `path=`.

## 4. Files Involved — guard internals (EVIDENCE)

### 4.1 `WithGuard` — `src/guards/index.tsx:40-71` (`CONFIRMED`)

- **Props** (L17-21): `Page: ComponentType<any> | ExoticComponent<any>`, `Guard: ComponentType<{children}>` and `permissions?: string[]`. `permissions` defaults to `[]` (L40).
- **Permission evaluation** (L51-62):
  - Inline `permissions.some(p => userPermissions?.includes(p))`, reading `useAppSelector(watchUserPermissions)` (L43).
  - It does **not** use `useHasPermission`.
  - It is OR-only, with no mode, `requireAll` or `'every'` option.
  - An empty `permissions` array skips the check, so access is allowed (L52).
- **Redirect mechanism**:
  - Effect-based `navigate(PageURLs.of404(), { replace: true })` inside `useEffect` (L58-60).
  - The effect deps are `[permissions, navigate, userPermissions]`. The inline array literal at each call site is a new reference every render, so the effect re-runs on every render (idempotent).
- **Render**: always `<Guard><RouteSuspense><Page /></RouteSuspense></Guard>` (L64-70). Children are **never** withheld while permission is being evaluated.
- **Trailing-slash effect** (L45-49): when `pathname.endsWith('/') && pathname !== '/'`, it calls `navigate(pathname.slice(0, -1), { replace: true })`. Only the pathname is passed, so **`search` and `hash` are dropped**.
- **`RouteSuspense`** (L23-25): `<Suspense fallback={<RouteLoading />}>`. `RouteLoading` (L27-38) is a hand-rolled progress bar styled by `RouteLoading.module.scss`, not an AntD `Spin`. `WithGuard` renders it internally at L66.
- `Page` is rendered with no props (L67). Pages read params with `useParams`.

### 4.2 `AuthGuard` — `src/guards/auth.guard.tsx:12-28` (`CONFIRMED`)

- It checks only `isLoggedIn` from `useAuth()` (L13).
- `isLoggedIn` is defined at `src/providers/auth.provider.tsx:18` as `!!activeAccount && !!accessToken`, i.e. an MSAL active account plus the Redux access token.
- Not logged in: `<Navigate to={PageURLs.ofLogin()} replace />` (L18), at render time.
- Logged in at `/`: `<Navigate to={defaultPath || PageURLs.ofIndustrySettings()} replace />` (L21-25).
- **No permission evaluation at all.**
- Working tree: wraps children in `RouteSuspense` (L27). HEAD: fragment.

### 4.3 `ThemePermissionGate` — `src/modules/system/theme-management/ThemePermissionGate.tsx:1-24` (`CONFIRMED`)

- Props: `children`, `permissions: string[]` and `requireAll?: boolean`, which defaults to `false` (L6-16).
- It calls `useHasPermission().hasPermission(permissions, requireAll ? 'every' : 'some')` (L17-19).
- Unauthorized: render-time `<Navigate to={PageURLs.of404()} replace />` (L20). **Children are not rendered.**

### 4.4 `useHasPermission` — `src/hooks/auth.hook.ts` (`CONFIRMED`)

- `check(permissions, mode: 'some' | 'every' = 'some')`.
- Returns `false` when `userPermissions` is falsy.
- `'every'` → `perms.every(...)`; `'some'` → `perms.some(...)`.

### 4.5 Equivalence of the decision function (`CONFIRMED` by reading; `LIKELY` for runtime)

| Input | Gate (`some`, or `every` when `requireAll`) | `WithGuard` (`some`) | Equal? |
|---|---|---|---|
| 1 permission | `some([p]) ≡ every([p])` | `some([p])` | **Yes** |
| 2+ permissions, OR | `some` | `some` | **Yes** |
| 3 permissions, `requireAll` | `every` | `some` | **No — widens access** |
| `permissions = []` | `[].some` = false → **deny** | check skipped → **allow** | No (no Theme route passes `[]`) |
| `userPermissions` falsy | `false` → deny | `undefined?.includes` → falsy → deny | Yes |
| `userPermissions = []` | deny | deny | Yes |

## 5. State Ownership

- `auth.slice` owns user permissions, read through the `watchUserPermissions` selector (`src/redux/slices/auth.slice.ts:198`).
- `initialState.userPermissions` is `[]` (`auth.slice.ts:20`).
- `AuthProvider` dispatches `getUserPermissions()` when `userPermissions.length === 0 && !defaultPath && accessToken`. It renders `<Spin>` instead of the router children while `isLoading` (`src/providers/auth.provider.tsx:35-64`).
- The Gate and `WithGuard` read the **same** selector, so the migration changes no state ownership.

## 6. API Flow

- Not changed by a guard swap.
- The only API involved is `getUserPermissions` (via `AuthProvider`).
- Indirect effect: under `WithGuard`, an unauthorized user's page **mounts before the redirect**, so its mount-time queries and requests may fire once (§11.1). Under the Gate they never fire.

## 7. Type/Data Flow

- `WithGuard.Page` accepts any component type, so lazy default exports and the eager `ThemeConfigurationRedirect` are both assignable. `CONFIRMED` from L15 and L17-21.
- No DTO or type contract changes.

## 8. Form Flow

- Not affected by the guard swap.
- Relevant to ThemeEdit only: `ThemeForm` gates submit with `canSubmit = hasPermission([mode === 'create' ? THEME_CREATE : THEME_EDIT])` (`src/modules/system/theme-management/theme/components/ThemeForm/index.tsx:63-66`).
- This is a submit-level control, not a page-access control. It does not replace the route's AND gate (§12).

## 9. Routing & Permission Flow — the 8-point audit (`06-routing-permission.md`)

1. **Routes, paths, layouts, guards, permissions**: see §3. There are no duplicate Theme/Topic paths. Layout parents: MainLayout for rows 1-3, BasicLayout for rows 4-11. A guard swap leaves layout nesting unchanged.

2. **`PageURLs`** (`src/utils/navigate.ts`, Theme block ~L259-298): all 11 builders exist (`ofThemeConfiguration`, `ofThemeTopicList`, `ofThemeList`, `ofThemeTopicCreate`, `ofThemeTopicSort`, `ofThemeTopicView`, `ofThemeTopicEdit`, `ofThemeCreate`, `ofThemeView`, `ofThemeEdit`, `ofThemeLock`). A guard swap needs no change. `CONFIRMED`.

3. **Menu** (`src/helpers/menus.helper.ts:517-536`), `CONFIRMED`:
   - The parent `theme-configuration` links to `ofThemeTopicList()` and has **no** `requiredPermissions`.
   - Child Topic List requires `[THEME_CATEGORY_VIEW]` and child Theme List requires `[THEME_VIEW]`. Both match their route gates.
   - There is no menu entry for create, view, edit, lock, or the configuration redirect, so menu visibility is unaffected by the migration.
   - The parent `link` points to the Topic list. A user with only `THEME_VIEW` relies on the child entry (`NEEDS-VERIFICATION` of how the menu renders a parent whose link the user cannot access; this is unchanged by the migration).

4. **Permission constants**: every gate uses `PERMISSIONS.*`. There are no hardcoded strings (§3).

5. **`WithGuard` / `AuthGuard` / `NonLoginGuard`**: see §4. `NonLoginGuard` is not used by any Theme/Topic route.

6. **In-page `useHasPermission`**, `CONFIRMED`:
   - `TopicViewPage` re-checks `THEME_CATEGORY_VIEW` and redirects (`topic/views/TopicViewPage/index.tsx:39`).
   - `TopicEditPage` enforces `[THEME_CATEGORY_VIEW, THEME_CATEGORY_EDIT], 'every'` and redirects to 404 (`topic/views/TopicEditPage/index.tsx:34-41`).
   - `TopicPrioritySortPage` re-checks at L21-27.
   - So for Topic edit/sort, the established convention is an **OR route gate with an in-page AND gate**.
   - `ThemeListPage:18` (create button), `ThemeViewPage:134-135` (edit, segments), `ThemeCreatePage:49` (topic lookup), `TopicListPage:17-19` and `TopicForm:69-70` are action-visibility checks only.
   - **`ThemeEditPage` has no in-page access check.** It relies entirely on the route's AND gate.

7. **Redirects, breadcrumbs, params, relative navigation**:
   - `ThemeConfigurationRedirect.tsx:14-35` is the backward-compatible redirect for the old single-page route and its `?tab=theme` / `?tab=topic` links.
   - It reads `useSearchParams` and returns render-time `<Navigate replace>` to the Theme or Topic list, or to 404 (L34). By its own comment that 404 branch is unreachable behind the OR route gate (`LIKELY`).
   - `:id` routes rely on `useParams`, and `TopicEditPage` validates with `parseThemeCategoryRouteId`. A guard swap does not change either.

8. **Direct link, refresh, missing `location.state`, trailing slash, unauthorized**: see §11. `location.state` dependence on the Theme pages was not traced (`NEEDS-VERIFICATION`). The guard swap does not touch state.

## 10. Dependencies & Consumers

- `grep -rn ThemePermissionGate src docs .claude .agents AGENTS.md .codex`, `CONFIRMED`:
  - Code: only `src/routes/index.tsx` (import L220 plus 7 sites) and its own definition file.
  - Docs/config: `.claude/PROJECT_CONTEXT.md` (L156-160, L286-289, L771-776, L799) and `.claude/rules/06-routing-permission.md:58`, which names it as eager synchronous-gate infrastructure.
  - `docs/` has no references.
- **Deletion**: technically it has no code consumer beyond the route file. It **cannot** be deleted while ThemeEdit needs AND, and any deletion must also update `06-routing-permission.md:58` and `PROJECT_CONTEXT.md`.
- **Prior decisions**:
  - `PROJECT_CONTEXT.md` records the ThemeEdit AND gate as *needs verification: intentional business rule or unreviewed divergence*.
  - `CLAUDE.md` "Open" lists *Theme-edit AND (`requireAll`) vs. OR elsewhere*.
  - No resolution is recorded.

## 11. Pattern Classification and behavioral deltas

Pattern classification:
- `WithGuard` routes are `target-compatible` per `06-routing-permission.md`.
- The `ThemePermissionGate` routes are a scoped, module-local `legacy-compatible` deviation. It is documented, and it was introduced to support AND.
- The working-tree `AuthGuard` Suspense is `uncertain`, because it is not described in any rule.

### 11.1 Render-time `<Navigate replace>` (Gate) vs effect-based `navigate` (`WithGuard`)

| Aspect | Gate | `WithGuard` | Certainty |
|---|---|---|---|
| Unauthorized children | Never rendered | Mounted and committed, then redirected in a parent effect. Page mount effects, lazy-chunk download and data requests can start. | `CONFIRMED` (structure); visual flash `LIKELY` |
| First paint | Lazy page never requested | Lazy chunk is requested, so the `RouteSuspense` bar may show, then 404 | `LIKELY` |
| History | `replace` | `replace` | Equal, `CONFIRMED` |
| Target | `of404()` | `of404()` | Equal |
| Direct link / refresh, authorized | Renders page | Renders page | Equal (`AuthProvider` blocks children until permission fetch settles) |
| Permission set changes while mounted | Re-evaluated on render | Re-evaluated in effect after commit | Equal outcome, different timing |
| Trailing slash | Rendered as-is (React Router matches it) | Rewritten without slash; `search`/`hash` dropped | `CONFIRMED` (code); router matching `LIKELY` |

React Router's `<Navigate>` itself navigates from an effect, so the Gate's redirect is also post-commit. The difference is that the Gate renders `<Navigate>` **instead of** the page, whereas `WithGuard` renders the page **and** schedules the redirect. `LIKELY`, based on react-router-dom 7 `Navigate` semantics; I did not re-read the library source.

### 11.2 Effect ordering with `AuthGuard` for a logged-out user (inference, main session)

- **Current Gate chain**: `AuthGuard` returns `<Navigate to=login>` and the Gate never mounts. The result is Login. `CONFIRMED`.
- **`WithGuard` chain**: `AuthGuard` (the child) renders `<Navigate to=login>`, and `WithGuard` (the parent) runs its permission effect in the same commit.
  - A logged-out user's `userPermissions` is `[]` (initial state, and `AuthProvider` fetches only with a token), so `WithGuard` would call `navigate(of404(), {replace})`.
  - Child effects run before parent effects, so the parent's 404 navigation would run **after** the child's login navigation. The logged-out user could end on **404 instead of Login**.
  - `LIKELY` / `NEEDS-VERIFICATION`. This applies equally to every existing `WithGuard` route today, so it is an existing app-wide behavior that the migration would extend to these routes.

### 11.3 Trailing slash vs `ThemeConfigurationRedirect` (inference, main session)

- If row 1 moved to `WithGuard`, a URL such as `…/theme-configuration/?tab=theme` would produce two navigations in the same commit:
  - the child `ThemeConfigurationRedirect` navigating to the Theme list;
  - then `WithGuard`'s trailing-slash effect navigating to `…/theme-configuration` with **no query**. That effect still holds the old pathname.
- The redirect would then run again without `tab`, and a user holding both view permissions would land on the **Topic list instead of the Theme list**.
- This breaks a legacy deep link that the redirect exists to preserve. `LIKELY` / `NEEDS-VERIFICATION`. It is the main reason row 1 is `HIGH-RISK` rather than `MODERATE`.
- The same slash rewrite drops query strings on the list routes (rows 2-3) if they carry list filters in the URL. `NEEDS-VERIFICATION`: list URL-state usage was not traced.

### 11.4 Explicit `<RouteSuspense>` once `WithGuard` supplies it

- **06-routing-permission.md** mandates the hierarchy `WithGuard -> Guard -> RouteSuspense -> lazy page`. `WithGuard` already places `RouteSuspense` between `Guard` and `Page` (L65-67).
- **Under `WithGuard`, an explicit wrapper is redundant.** There is no way to keep it either: `WithGuard` takes a `Page` component, not children, so "removing" it is a consequence of the API rather than a separate choice.
- **The rule forbids only having no boundary at all.** Under the Gate, a lazy page must have a Suspense ancestor:
  - At HEAD this was the explicit wrapper.
  - In the working tree it is `AuthGuard`'s new wrapper.
  - So removing the explicit wrapper is safe **only** together with the `AuthGuard` change.
- **Nested boundaries** if both the working-tree `AuthGuard` and `WithGuard` are kept:
  - The structure becomes `WithGuard > AuthGuard(RouteSuspense) > RouteSuspense > Page`.
  - The innermost boundary catches the lazy suspension, so a single progress bar appears. This is harmless but redundant (`LIKELY`).
  - ThemeLock's remaining explicit wrapper, if kept under the Gate, is likewise redundant with `AuthGuard`'s.

## 12. Risk Classification — per route

| # | Route | Same final allow/deny under `WithGuard`? | Non-identical deltas | Classification |
|---|---|---|---|---|
| 1 | ThemeConfiguration (redirect) | Yes (OR over 2 = `some`) | Flash; logged-out ordering (§11.2); **trailing-slash drops `?tab=`** (§11.3) | **HIGH-RISK** |
| 2 | TopicList | Yes (single) | Flash + mount requests; §11.2; slash rewrite drops query | **MODERATE** (change itself is routing `HIGH-RISK` by rule) |
| 3 | ThemeList | Yes (single) | Same as 2 | **MODERATE** |
| 4-7 | Topic sort / create / view / edit | Already `WithGuard` | — | **n/a** (no change) |
| 8 | ThemeCreate | Yes (single) | Flash + mount requests (topic lookup at `ThemeCreatePage:49`); §11.2 | **MODERATE** |
| 9 | ThemeView | Yes (single) | Flash + detail request for `:id`; §11.2 | **MODERATE** |
| 10 | **ThemeEdit** | **No — AND (`every`) → OR (`some`)** | A user with only `theme:view`, only `theme:edit`, or only `theme_category:view` would reach the edit page. `ThemeForm:64` limits submit to `THEME_EDIT` holders but not page access or data loading. | **NEEDS-TEAM-DECISION** |
| 11 | ThemeLock | Yes (single) | Flash; §11.2; explicit `RouteSuspense` disappears (redundant) | **MODERATE** |

"Identical access outcomes" in the strict sense requested — final decision **and** observable behavior — holds for **none** of the gated routes, because of the deltas in §11. It holds for the final allow/deny decision on rows 1-3, 8, 9 and 11 only.

## 13. Regression Surface

- Unauthorized direct link and refresh for each migrated route: 404 destination, any flash of page content, and any network calls made during that flash.
- Logged-out direct link: Login vs 404 (§11.2).
- Trailing-slash URLs, especially `theme-configuration/?tab=theme|topic` (§11.3).
- ThemeEdit with every subset of the three permissions.
- Menu vs route access for users holding exactly one of `theme:view` / `theme_category:view`.
- Lazy chunk load: one progress bar, with no double or nested Suspense flicker.
- All other `AuthGuard` routes app-wide, because of the working-tree Suspense change.

## 14. Recommended Change Boundary (handoff only — not performed)

- **Do not migrate ThemeEdit (row 10)** until the team decides AND vs OR. If the team keeps AND, the options are:
  1. keep `ThemePermissionGate` for this one route;
  2. add an in-page `'every'` check in `ThemeEditPage`, mirroring `TopicEditPage:34-41`, and then use `WithGuard` with an OR list. That is an access-timing change and needs a review;
  3. add a mode prop to `WithGuard`. That is a shared-guard change, `HIGH-RISK`, and is **not recommended** here.

  Choosing among these is `NEEDS-TEAM-DECISION`.
- **If uniformity is wanted**, the smallest boundary is rows 2, 3, 8, 9 and 11. Replace each with `<WithGuard Page={X} Guard={AuthGuard} permissions={[PERMISSIONS.…]} />`, with the same constants and order, and no explicit `RouteSuspense`.
- **Defer row 1** (ThemeConfiguration) unless the trailing-slash/query interaction is verified safe or the route keeps the Gate.
- **Preserve**:
  - all `PageURLs`;
  - permission constants and their order;
  - 404-with-`replace` redirects;
  - route order and layouts;
  - the lazy declarations;
  - the in-page checks.
- **Do not touch** `WithGuard`, `useHasPermission`, `menus.helper.ts` or `permission.constant.ts` for this task.
- **Review the uncommitted `AuthGuard` change separately.** It is global, and the five Theme routes now depend on it for Suspense. Revert both working-tree files together or neither.
- **If `ThemePermissionGate` is ever removed**, also update `.claude/rules/06-routing-permission.md:58` and `.claude/PROJECT_CONTEXT.md`.

## 15. Unknowns / Needs Verification

- Whether React Router actually commits the logged-out → 404 sequence described in §11.2, or whether `AuthProvider`'s render path prevents it. This is a runtime question.
- Whether the §11.3 trailing-slash override of `ThemeConfigurationRedirect` happens as inferred. Not run.
- Whether any Theme/Topic list keeps filters or pagination in the query string. If so, the slash rewrite would drop them.
- Whether `ThemeEditPage` or its hooks fire requests on mount before a `WithGuard` redirect. Its query lifecycle was not traced.
- Theme page dependence on `location.state`. Not traced.
- How the menu renders the parent `theme-configuration` link for a user without `THEME_CATEGORY_VIEW`.
- The intended business rule for ThemeEdit AND. Recorded as open in `PROJECT_CONTEXT.md` and `CLAUDE.md`.
- No runtime, browser, auth, permission or backend behavior was verified.

## 16. Handoff for Implementation

**Validation limits.**
- This repository has **no test runner**.
- `npm run typecheck`, `npm run lint`, `npm run prettier` and `npm run build` can prove only that the code compiles and is formatted. They **cannot** prove authentication, permission outcomes, redirect order, Suspense behavior or browser history behavior.
- None of them was run for this audit.

**Manual runtime verification required** (each with `app_locale` irrelevant; test on a production-like build and on the dev server):

1. For every migrated route, log in as a user **without** the required permission. Open it by direct link, by refresh and by in-app navigation. Expect 404 with `replace`. Watch the screen for a content flash and the Network tab for page requests.
2. Repeat as a user **with** exactly the required permission. Expect the page.
3. Repeat as a user holding only a *different* Theme/Topic permission.
4. **Logged out**: open each route directly. Expect Login, not 404 (§11.2). Compare with an existing `WithGuard` route as the baseline.
5. **ThemeEdit**: test all 8 subsets of `{theme:view, theme:edit, theme_category:view}`. Under the current Gate only the full set is allowed. Record this as the baseline before any change.
6. `…/theme-configuration?tab=theme` and `?tab=topic`, **with and without** a trailing slash. Test as a user holding each view permission alone and as a user holding both.
7. A trailing-slash variant of each migrated route, checking that any list query or filter state is kept.
8. The browser Back button after each unauthorized redirect. Expect no loop back into the protected URL.
9. A throttled network on first lazy load. Expect one `RouteSuspense` progress bar with no nested or double flicker.
10. Menu visibility vs route access for a user with only `theme:view` and for a user with only `theme_category:view`.
11. Because of the uncommitted `AuthGuard` change: spot-check unrelated `AuthGuard` routes (Product Labels, popup list, system management, a non-lazy eager page) for loading and fallback behavior.

**Open questions for the team.**
- Is ThemeEdit's AND an intended business rule? If yes, where should it live: the route gate, or the page?
- Is the paint-then-redirect behavior of `WithGuard` acceptable for Theme pages that fetch on mount?
- Should the working-tree `AuthGuard` Suspense change be kept? If yes, it needs its own review and a rule update in `06-routing-permission.md`, since it changes the documented hierarchy.
