# Auth — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Source: derived from the read-only audit
  `docs/audits/auth/2026-11-05/login-logout-permission-mechanism.md`
  (revision `5faf27a5`, branch `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung`,
  2026-11-05). This document is a living reformatting of that audit into the
  `docs/modules/TEMPLATE.md` structure; it carries no date of its own, per
  `docs/README.md` ("Module documentation... carries no date anywhere in its
  path, because they are living documents kept current in place rather than
  re-issued as dated snapshots"). Written 2026-11-05.
- Method: every claim below is the audit's own file:line evidence,
  transcribed and reorganized, not independently re-verified against source
  in this pass. Where the audit itself marked something `NEEDS-VERIFICATION`
  or `NEEDS-TEAM-DECISION`, that label is preserved here.
- **Scope note — `auth` is NOT a `src/modules/` directory.** Unlike every
  other document under `docs/modules/`, there is no `src/modules/auth/` on
  disk. Authentication, logout, and permission logic is cross-cutting
  infrastructure spread across `src/guards/`, `src/configs/authConfig.tsx`,
  `src/pages/{login,redirect,index,not-found}.page.tsx`,
  `src/redux/slices/auth.slice.ts`, `src/utils/api-service.ts`,
  `src/utils/env-mapper.ts`, `src/providers/{auth,current-ctx}.provider.tsx`,
  `src/hooks/auth.hook.ts`, `src/constants/permission.constant.ts`, and
  `src/helpers/menus.helper.ts`. It is documented under `docs/modules/`
  anyway because it is consumed by, and gates access to, every other module
  (114 files call `useHasPermission`, 113 files call `hasPermission(`) —
  the same reasoning the module-doc template applies to any cross-cutting
  concern whose evidence must be gathered outside a single module directory
  (`docs/modules/TEMPLATE.md` content rule 13). A reader following
  `docs/modules/INDEX.md` should not expect a matching `src/modules/auth/`
  folder; see the directory map in §3 for the real file locations.
- No file under `src/` was read, modified, or executed differently by
  writing this document; it is a documentation-only transcription of
  already-gathered audit evidence.

**Top verification gaps** (capped at five per content rule 11; remaining
items are in §15):

1. Backend contract for `GET api/admin/portal/v1/auth/permissions` (array
   shape, null handling) and whether the backend enforces the same
   permission per route. `NEEDS-VERIFICATION`.
2. Runtime MSAL behavior: logout versus Entra SSO re-login, and the
   `interaction_required` race. `NEEDS-VERIFICATION`.
3. Whether MSAL itself de-duplicates concurrent `acquireTokenSilent` calls
   (the application code does not). `NEEDS-VERIFICATION`.
4. Real deployed `VITE_*` values — not read by the audit, to avoid exposing
   them; only names from source were used. `NEEDS-VERIFICATION`.
5. Rendered behavior of the "denied" branch inside `TopicEditPage`,
   `TopicPrioritySortPage`, and `BackgroundMainEditPage` when a user has
   only the route's OR permission but fails the page's AND check.
   `NEEDS-VERIFICATION`.

## 1. Responsibility

- Session and identity: MSAL (`@azure/msal-browser`) performs Entra
  sign-in. The backend session is represented by a bearer token stored in
  Redux and `localStorage['access_token']`.
- Authorization: the `auth` Redux slice holds a flat `userPermissions:
  string[]` list. Route guards, menus, and component checks read it. These
  are frontend-only checks; backend-side enforcement is
  `NEEDS-VERIFICATION` (per `.claude/rules/06-routing-permission.md`,
  frontend guards are explicitly not a security boundary).
- MSAL setup: `src/configs/authConfig.tsx`, `src/main.tsx`.
- Token attachment and 401 handling: `src/utils/api-service.ts`
  (`ApiFetcher`).

## 2. Entry points and routes

- Route composition: `src/routes/index.tsx:19-31`.
  - `MasterLayout` children: `index` (`WithGuard` + `AuthGuard` +
    `IndexPage`, L20); `login` (`WithGuard` + `NonLoginGuard` +
    `LoginPage`, L21); `redirect` (`WithGuard` + `NonLoginGuard` +
    `RedirectPage`, L22); `404` (eager `NotFoundPage`, no guard, L23).
  - `MainLayout` renders `{mainRoutes}` (L25-27). `BasicLayout` renders
    `{formRoutes}` (L28-30).
  - `path='*'` redirects to `PageURLs.of404()` (L31).
- `PageURLs` (`src/utils/navigate.ts`): `ofIndex` L9-11 (`/`); `ofLogin`
  L419-421 (`/login`); `of404` L424-426 (`/404`). There is no `PageURLs`
  entry for `/redirect`; the path is a literal at `src/routes/index.tsx:22`
  and in `authConfig.tsx:13`.
- Eager infrastructure, per `.claude/rules/06-routing-permission.md`:
  `LoginPage`, `IndexPage`, `RedirectPage`, `NotFoundPage` are imported
  directly in `src/routes/index.tsx:8-11`.
- Authentication-only routes (no `permissions` prop) in
  `src/routes/main.routes.tsx`: lines 107 (`users/distributor`), 115, 116,
  119, 161, 181, 232, 254, 332, 344, 345, 346, 349, 351, 352, 355, 357,
  469, 470 — **19 routes**, enumerated by reading the file (JSX spans
  several lines, not grep-counted). `src/routes/form.routes.tsx` has no
  authentication-only `WithGuard` routes.
- Routes that bypass `WithGuard` (`AuthGuard` directly, no route-level
  permission check): `main.routes.tsx:476-484` (1 route) and
  `form.routes.tsx:290-348` (7 routes) — **8 total**, matching the
  documented `ProductLabelsRouteGate` exception in
  `.claude/rules/06-routing-permission.md`. Access is decided inside
  `ProductLabelsRouteGate` (see §9).

Dead or commented code affecting behavior (content rule 10 — recorded
here and raised again in §15):

- Menu entries commented out in `src/helpers/menus.helper.ts`: lines
  116-136 (display, integration, company info), 372-373 (advertisement
  service), 457-463 (portrait), 486-487 (general notification), 586-592
  (transaction list). This list may be incomplete — the audit's grep
  output was truncated.
- `ThemePermissionGate`
  (`src/modules/system/theme-management/ThemePermissionGate.tsx:12-24`)
  has **zero consumers**: `grep -rln ThemePermissionGate src` returns only
  its own file. `CONFIRMED` — matches the existing rule-file note that no
  route uses it.
- `fetchAzureUserInfo` (`src/redux/slices/auth.slice.ts:137-166`) has no
  call sites (`grep -rn "fetchAzureUserInfo(" src` returns none); exported
  at `auth.slice.ts:218` but dead.
- `postLogoutRedirectUri: '/login'` (`authConfig.tsx:14`) is configured
  but never used, because `logoutRedirect`/`logoutPopup` is never called
  anywhere in `src/`.

## 3. Directory map

No `find`-based file count applies — this is cross-cutting infrastructure,
not a contiguous directory (see §0). Files involved, as identified by the
audit:

```text
src/configs/authConfig.tsx            # msalConfig, loginRequest
src/utils/env-mapper.ts               # AppEnv, appEnvs
src/providers/current-ctx.provider.tsx # CurrentCtxInitializer, window.apiFetcher
src/providers/auth.provider.tsx       # AuthProvider
src/providers/index.tsx               # FullProvider composition
src/main.tsx                          # MSAL instance, initialize(), LOGIN_SUCCESS callback
src/hooks/auth.hook.ts                # AuthContext, useAuth, useHasPermission
src/guards/index.tsx                  # GuardedPage, WithGuard, RouteLoading
src/guards/auth.guard.tsx             # AuthGuard
src/guards/non-login.guard.tsx        # NonLoginGuard
src/pages/login.page.tsx              # LoginPage
src/pages/redirect.page.tsx           # RedirectPage
src/pages/index.page.tsx              # IndexPage
src/pages/not-found.page.tsx          # NotFoundPage
src/redux/slices/auth.slice.ts        # auth slice, login/logout/permission thunks
src/utils/api-service.ts              # ApiFetcher: token, refresh, 401
src/utils/local.ts                    # LocalUtils.clear()
src/constants/permission.constant.ts  # permission identifiers (189 by current grep — see §9)
src/constants/locale.ts               # LOCALE_KEY = 'app_locale'
src/helpers/menus.helper.ts           # menuStructure, filterMenuByPermissions
src/utils/navigate.ts                 # PageURLs, findFirstAccessibleMenuLink
src/components/menus.tsx              # menu rendering, consumes filterMenuByPermissions
src/components/Header.tsx             # logout UI entry point
src/modules/products/configuration/product-labels/ProductLabelsRouteGate.tsx
                                       # the one route-level permission exception (§2, §9)
```

## 4. Main runtime flows

### Flow 1 — Login, end to end

`CONFIRMED` static; runtime `NEEDS-VERIFICATION`.

1. Button click: `login.page.tsx:40` calls `handleLoginRedirect` (L20-23).
   It first dispatches `logoutUser` (L21, clears all storage — see
   Flow 2), then calls `instance.loginRedirect(loginRequest)` (L22).
2. `loginRequest.scopes = [VITE_MSAL_APP_ID_AUDIENCES]`
   (`authConfig.tsx:58-60`). No `prompt` or `loginHint` is set.
3. Entra redirects back to `${VITE_FE_HOST}/redirect` (`authConfig.tsx:13`).
4. `main.tsx` creates the `PublicClientApplication` (L23), passes it to
   `ApiFetcher.setMsalInstance` (L26), awaits `initialize()` (L29-30),
   then registers the `LOGIN_SUCCESS` callback (L42-47), which calls
   `setActiveAccount(payload)`.
5. `RedirectPage` (`redirect.page.tsx:19-21`) calls
   `instance.handleRedirectPromise()`. If there is a response, it
   dispatches `loginUser({ accessToken: response.accessToken, email:
   response.account.username })` (L22-28).
6. `loginUser` (`auth.slice.ts:33-60`) POSTs
   `api/admin/portal/v1/auth/login` with body `{ ldapAccessToken }` and
   `Authorization: Bearer <MSAL access token>` (L42-52).
   - On success, stores `localStorage['access_token']` (L54) and
     `localStorage['user-info'] = {email}` (L57).
   - `fulfilled` sets `state.accessToken` (L72) and a success message
     (L66-72).
   - `rejected` (L74-86) calls `localStorage.clear()` and
     `sessionStorage.clear()` (L75-76), then clears user, token,
     permissions, and `defaultPath`.
7. `AuthProvider` (`auth.provider.tsx:28-33`) syncs the stored token into
   Redux if it is missing.
8. Permission fetch in `RedirectPage` (`redirect.page.tsx:33`):
   `getUserPermissions` GETs `api/admin/portal/v1/auth/permissions`
   (`auth.slice.ts:167-187`). Then `findFirstAccessibleMenuLink
   (menuStructure, ...)` (L34), `setDefaultPath` (L36), and
   `navigate(firstAccessible)` or `navigate(PageURLs.of404())` (L37-41).
9. Parallel fetch in `AuthProvider` (`auth.provider.tsx:35-59`): when
   `accessToken` changes, the effect fetches permissions if the list is
   empty and `defaultPath` is empty (L46-49) — a **second fetch of the
   same endpoint**. LIKELY redundant, and a sequencing hazard:
   `setIsLoading(true)` (L44) makes `AuthProvider` render a `Spin` instead
   of children (L61-63), which can unmount `RedirectPage` mid-flow.
   `NEEDS-VERIFICATION` at runtime.
10. `login.page.tsx:25-29`: on mount, if not logged in, dispatches
    `logoutUser` again — runs on every visit to `/login` while logged
    out.

Token storage: Redux `auth.accessToken` (`auth.slice.ts:72`) and
`localStorage['access_token']` (`auth.slice.ts:30,54`). Both are written;
initial state reads `localStorage['access_token']` (L19).

Permission fetch timing: `RedirectPage` after `loginUser` fulfills, and
`AuthProvider` on token change (steps 8-9 above). Permissions are not
persisted to storage.

### Flow 2 — Logout, end to end

`CONFIRMED` static. **No MSAL sign-out occurs; the Entra SSO session
survives.**

Every logout trigger found in source:

| # | Trigger | Location | What happens after |
| --- | --- | --- | --- |
| a | Header "Đăng xuất" menu item, with confirm modal | `src/components/Header.tsx:71-74` (handler), `:76-84` (modal), `:89-92` (item) | `dispatch(logoutUser()).unwrap()` then `navigate(PageURLs.ofLogin())` (L72-73) |
| b | Login button, before redirect | `login.page.tsx:21` | `logoutUser` then `loginRedirect` (L22) |
| c | `/login` mount while logged out | `login.page.tsx:25-29` | `logoutUser` (repeats on every mount) |
| d | 401 from any API (non-`/login` URL) | `api-service.ts:110-122` (`handleUnAuthorize`), `:140-148` (interceptor) | `logoutUser` plus an error notification; resolves the failed request as `{ data: null }`. Navigation to `/login` happens via `AuthGuard` re-render (`auth.guard.tsx:17-19`) |
| e | `loginUser` rejected | `auth.slice.ts:74-86`; `redirect.page.tsx:48-75` | Storage cleared; navigate to `/login` |

Not a logout trigger: `getToken` calling `loginRedirect` on
`interaction_required` (`api-service.ts:56-60`) is a sign-in redirect,
not a logout.

**What `logoutUser` (`auth.slice.ts:89-117`) clears:**

- `localStorage.clear()` (L91) and `sessionStorage.clear()` (L92). This
  removes:
  - the MSAL cache (`cacheLocation: 'localStorage'`, `authConfig.tsx:18`),
    including the active account;
  - `access_token`, `user-info`;
  - `app_locale` (`constants/locale.ts:1`) — the language preference is
    reset too.
- Redux `auth` (on fulfilled, L98-108): `user`, `userPermissions = []`,
  `defaultPath = ''`, `accessToken = undefined`, success message.
  `profileLoading` is not reset.
- Other slices: no reaction. `logoutUser` appears only in
  `auth.slice.ts`, `Header.tsx`, `login.page.tsx`, and `api-service.ts`.
  No middleware listens to it.
- TanStack Query cache: **not cleared**. A subsequent user on the same
  tab could see cached data from the previous user until a refetch
  happens. LIKELY — needs runtime verification.

**MSAL and the Entra session — the central finding of this flow:**

- No `logoutRedirect` or `logoutPopup` call exists anywhere in `src/`.
  `CONFIRMED`.
- Only local storage is cleared. **The Entra SSO session survives.**
- Re-login after logout uses `loginRedirect(loginRequest)` with no
  `prompt` or `loginHint` (`authConfig.tsx:58-60`) — the same account may
  be re-authenticated silently (SSO), defeating the user-visible intent
  of "logging out." LIKELY; `NEEDS-VERIFICATION` at runtime.
  `NEEDS-TEAM-DECISION`: whether a real sign-out (`logoutRedirect`,
  possibly with `prompt: 'select_account'`) is required.

**Where the user lands:**

- Header logout: `/login` (`Header.tsx:73`).
- 401: `AuthGuard` redirects to `/login` (`auth.guard.tsx:17-19`) because
  `isLoggedIn` becomes false (`auth.provider.tsx:18`).
- Failed login: `/login` (`redirect.page.tsx:55,64,74`).
- Other browser tabs: `localStorage` is shared and MSAL uses it
  (`authConfig.tsx:18`). Logout in one tab clears the MSAL cache for all
  tabs; other tabs keep their in-memory Redux token until reload or a
  401. LIKELY.

### Flow 3 — Token refresh

`CONFIRMED` static.

- Token source: `ApiFetcher.getHeaders` (`api-service.ts:83-108`) reads
  `state.auth.accessToken`, falling back to `localStorage['access_token']`
  (L90-92).
- Expiry: `isTokenExpired` (L68-77) base64-decodes the JWT payload `exp`
  claim; a parse failure is treated as expired (L73-75). No signature
  verification — acceptable for a client-side expiry check.
- Refresh: if expired, `getToken()` (L35-66) calls `acquireTokenSilent({
  ...loginRequest, account })` (L50-53) for the active account
  (L43-47). On success, it dispatches `setAccessToken` (L96), which
  writes Redux and `localStorage` (`auth.slice.ts:28-31`).
- `InteractionRequiredAuthError` (L56-60): logs, then calls
  `loginRedirect(loginRequest)` **without `await` or `return`**, and
  returns `null`. The request continues with the stale expired token,
  the server answers 401, and the 401 branch logs out. The
  `loginRedirect` navigation and the logout storage wipe can race.
  LIKELY; `NEEDS-VERIFICATION`.
- Other errors (L61-64): logs and returns `null`, same consequence.
- **Concurrency: no de-duplication.** There is no in-flight promise or
  lock in `getToken`, `getHeaders`, or `request`. N concurrent requests
  with an expired token make N independent `acquireTokenSilent` calls
  and N `setAccessToken` dispatches. `CONFIRMED` absence of app-level
  dedupe. Whether MSAL internally deduplicates is `NEEDS-VERIFICATION`.
- If the stored token is not a decodable JWT, `isTokenExpired` returns
  `true` every time, so every request triggers `acquireTokenSilent` — a
  performance concern. `NEEDS-VERIFICATION` that the token is always a
  JWT in practice.
- No proactive refresh: expiry is only checked per outgoing request.

**401 branch:**

- `api-service.ts:137-156`. For status 401 (L140), the login URL is
  excluded by substring match on `'/login'` (L142). For a non-login URL,
  the first 401 sets `isHandlingUnauthorized` and calls
  `handleUnAuthorize` (L144-148); the flag resets after 1000ms
  (L119-121). Later 401s inside that window resolve as `{ data: null }`
  (L150). A 401 after the reset triggers logout again.
- The 401 resolves as a "successful" response: `request` returns
  `response.data` (L161), so callers receive `null`. Consequences:
  `getUserPermissions` can fulfill with `null` (`auth.slice.ts:169-180`),
  and `findFirstAccessibleMenuLink` then throws on `null.includes`
  (`navigate.ts:439`). LIKELY; `NEEDS-VERIFICATION`.
- Network errors (no `error.response`): `api-service.ts:140` reads
  `error.response.status` without optional chaining. A network failure
  throws a `TypeError` inside the interceptor, replacing the original
  error. `CONFIRMED` static defect.

### Flow 4 — Hard refresh (F5) of a deep authenticated URL

`CONFIRMED` static; runtime `NEEDS-VERIFICATION`.

- Redux: `accessToken` is restored from `localStorage['access_token']` in
  `initialState` (`auth.slice.ts:19`). `userPermissions` starts as `[]`
  and `defaultPath` as `''` (L20-21) — **permissions are not persisted**.
- MSAL: `initialize()` (`main.tsx:29-30`) should restore the active
  account from the `localStorage` cache (`authConfig.tsx:18`) — library
  behavior, `NEEDS-VERIFICATION`. The fallback at `main.tsx:33-39` is
  broken: L38 calls `setActiveAccount(msalInstance.getActiveAccount())`,
  which returns `null` when no active account exists; it should use
  `getAllAccounts()[0]`. `CONFIRMED` defect in the intended fallback
  path.
- Permissions: the `AuthProvider` effect (`auth.provider.tsx:35-59`)
  fetches when `accessToken` is present and the permission list and
  `defaultPath` are both empty.
- Rendering while pending: `AuthProvider` starts with `isLoading = true`
  (L19) and renders a full-viewport `Spin` (L61-63, styles L68-73)
  instead of children — routes and guards are not mounted until the
  effect finishes (`setIsLoading(false)` in `finally`, L54).
- After load, `GuardedPage` checks `userPermissions`
  (`guards/index.tsx:29-34`). A permission-fetch failure leaves `[]`, so
  every permissioned route redirects to `/404` until a reload. LIKELY.
- Expired token on F5: the permission request goes through
  `getHeaders`, so the refresh path in Flow 3 runs first.
- `fetchCount` (`auth.provider.tsx:20,38,43`) is a per-mount counter,
  reset on reload, so it does not affect F5 specifically — see risk 9 in
  §13 for its steady-state effect.
- `ProductLabelsRouteGate` waits on `profileLoading`
  (`ProductLabelsRouteGate.tsx:37,51-57`), not permission loading.
  `profileLoading` starts `true` (`auth.slice.ts:18`) and only flips
  after `setProfileUser` runs with an active account
  (`auth.provider.tsx:21-25`). The gate is reached only after
  `AuthProvider` finishes loading, so this ordering is LIKELY safe in
  practice.

## 5. State ownership

- Session and permissions: Redux `auth` slice (`auth.slice.ts:6-14`).
  Target-compatible per `.claude/rules/04-state-management.md`: auth
  session is permanent Redux ownership, not a TanStack Query migration
  candidate.
- Derived `isLoggedIn`: computed in `AuthProvider` as `!!activeAccount &&
  !!accessToken` (`auth.provider.tsx:13,18`). `activeAccount` is read
  once per render from `instance.getActiveAccount()` (L13), not from a
  reactive MSAL store. Exposed via `AuthContext` (`hooks/auth.hook.ts:9`).
- MSAL account: owned by MSAL in `localStorage` (`authConfig.tsx:18`),
  mirrored into `setProfileUser` (`auth.provider.tsx:21-25`,
  `auth.slice.ts:118-136`) as `user = {email}`.
- Token copies: Redux `auth.accessToken`, `localStorage['access_token']`,
  and the MSAL cache — **three copies**. The authoritative token for API
  calls is the Redux value when present, otherwise storage
  (`api-service.ts:90-92`). Refresh writes both Redux and storage
  (`setAccessToken`, `auth.slice.ts:28-31`).
- `ApiFetcher` statics: `msalInstance`, `store`, `isHandlingUnauthorized`
  (`api-service.ts:19-21`) — legacy-compatible per
  `.claude/rules/03-api-service.md`. `store` is injected by
  `current-ctx.provider.tsx:35`.
- Other `localStorage` keys: `app_locale` (`constants/locale.ts:1`, read
  by `api-service.ts:80`), `user-info` (`auth.slice.ts:57`; readers not
  enumerated by the audit). `LocalUtils.clear()` (`utils/local.ts:14-17`)
  clears both storages; its callers were not established by the audit.
- Logout reset coverage: auth slice only (Flow 2). No TanStack Query
  cache clear; no other Redux slice reset.

## 6. API boundaries

- `POST api/admin/portal/v1/auth/login` (`auth.slice.ts:42-52`). Body
  `{ ldapAccessToken }`; `Authorization: Bearer <MSAL access token>`.
  Backend semantics `NEEDS-VERIFICATION`.
- `GET api/admin/portal/v1/auth/permissions` (`auth.slice.ts:169-172`).
  Response assumed `string[]`. `NEEDS-VERIFICATION`.
- `ApiFetcher` 401/refresh branches (see Flow 3, §4):
  - On an outgoing request with an expired/missing token,
    `acquireTokenSilent` is attempted first (`api-service.ts:35-66`); on
    `InteractionRequiredAuthError` or any other error, `loginRedirect` is
    triggered (un-awaited) and the function returns `null`.
  - On a 401 response (`api-service.ts:137-156`), the first 401 outside
    the `/login` URL triggers `handleUnAuthorize` (logout + toast);
    subsequent 401s inside a 1000ms window resolve the failed request as
    **`{ data: null }`** rather than rejecting — this is a deliberate,
    documented behavior to inspect before relying on any auth-adjacent
    endpoint's response shape, since callers receive `null` as if it
    were valid data (L148,150,161).
- Microsoft Graph via `apiFetcher.get(currentCtx.appEnv.microsoftGraphUrl,
  ...)` (`auth.slice.ts:139-146`) — dead code, no call sites (§2).
- `ApiFetcher` is the transport for all of the above, per
  `.claude/rules/03-api-service.md`; changes to it are HIGH-RISK.
- The `/login` substring exclusion (`api-service.ts:142`) means any
  future API path containing the literal `/login` anywhere in its URL
  would skip 401 handling. `CONFIRMED` static.
- Notifications on 401 are hard-coded Vietnamese strings
  (`api-service.ts:115`); also `redirect.page.tsx:52,61,71`: "Bạn không
  có quyền truy cập" is shown for **any** login failure, including
  network errors.

## 7. Forms and validation

Not applicable — login is a single button; no form state is involved in
the auth flow itself.

## 8. Types and DTO organization

- `AuthSliceState` (`auth.slice.ts:6-14`) is typed locally.
- `User` (`auth.slice.ts:9`) is referenced without an import —
  presumably an ambient global type; exact declaration location
  `NEEDS-VERIFICATION`.
- `apiFetcher` is used as an ambient global in
  `auth.slice.ts:42,139,169` without import; set by
  `current-ctx.provider.tsx:31`. Ambient declaration location
  `NEEDS-VERIFICATION`.
- `AppEnv` (`env-mapper.ts:3-11`) is a class with six readonly fields.
  Only `apiHost` (`current-ctx.provider.tsx:31`) and
  `microsoftGraphUrl` (`auth.slice.ts:140`) are actually read anywhere
  in `src/`. `feHost`, `msalAppId`, `msalTenantId`, `msalScope` are
  constructed but never consumed.
- `ApiFetcher.request` returns `response.data` typed as untyped `any`
  (`api-service.ts:124-165`); the auth response is not parsed at
  runtime.
- `ApiFetcher.setStore(storeInstance: any)` (`api-service.ts:31`) is
  untyped.

## 9. Permissions

Per the module-doc threshold rule (more than ten permission constants
referenced across layers), named recurring groups are used instead of a
full per-permission table:

- `G_ADMIN_UNIT_OR_BANK` = `[ADMINISTRATIVE_UNIT_VIEW, BANK_VIEW]`:
  `main.routes.tsx:131`.
- `G_TOPIC_EDIT` = `[THEME_CATEGORY_VIEW, THEME_CATEGORY_EDIT]`:
  `form.routes.tsx:143` (route, OR), `TopicEditPage/index.tsx:35` (AND),
  `TopicPrioritySortPage/index.tsx:25` (AND), `form.routes.tsx:125`
  (route only, OR).
- `G_BG_MAIN_EDIT` = `[THEME_VIEW, THEME_EDIT, THEME_CATEGORY_VIEW]`:
  `form.routes.tsx:161` (route, OR), `BackgroundMainEditPage/index.tsx:64`
  (AND).

**Every permission-decision point and its OR/AND kind:**

| Layer | Location | Kind and semantics |
| --- | --- | --- |
| Route guard | `src/guards/index.tsx:32` — `permissions.some(p => userPermissions?.includes(p))` | **OR.** Empty array skips the check entirely (`permissions?.length &&`). |
| Menu filter (`filterMenuByPermissions`) | `src/utils/navigate.ts:451-478`, used at `src/components/menus.tsx:136` | **OR** per item (L462); a parent is kept if any child is permitted (L467); items with no permission and no permitted child are dropped (L474-475). |
| Post-login default route | `src/utils/navigate.ts:430-449` (`findFirstAccessibleMenuLink`), used at `redirect.page.tsx:34` and `auth.provider.tsx:48` | **OR**, first match in menu order; returns `undefined` when the list is empty (L431). |
| Component hook (`useHasPermission`) | `src/hooks/auth.hook.ts:19-40` | **Default `'some'` (OR). `'every'` (AND)** when that mode is explicitly passed. Empty array returns `false` (L36, `some` on `[]`). |
| Product-labels gate | `ProductLabelsRouteGate.tsx:59-65` — `canAccessProductLabel` (defined in `./routes`, not read by the audit) | Helper-resolved per product line and action; exact kind `NEEDS-VERIFICATION`. |
| Theme gate (dead) | `ThemePermissionGate.tsx:19` | Supports `'every'` or `'some'`; zero route/component consumers. |

Counts, each with the exact command used by the audit:

- `grep -rl useHasPermission src` → **114 files** (includes the hook's
  own definition file and `ThemePermissionGate.tsx`).
- `grep -rn "hasPermission(" src` → **306 lines in 113 files**.
- `grep -n "requiredPermissions" src/helpers/menus.helper.ts | wc -l` →
  **46** (includes any commented-out entries, so this is not a count of
  live menu items).
- `grep -c "permissions=" src/routes/main.routes.tsx` → **48** lines;
  `grep -c "permissions=" src/routes/form.routes.tsx` → **106** lines
  (line counts only, not a route count — the prop can span lines).
- `grep -n "'every'\|\"every\"" src` → **11 lines total**. Excluding the
  hook's own definition/comparison, there are **8 call sites** requiring
  an explicit **AND** — all in product and theme-management modules:
  `required-information-set/view/form.tsx:50,52`,
  `parameter/contract-termplate/view/form.tsx:44,55`,
  `parameter/document-set/view/form.tsx:38`,
  `BackgroundMainEditPage/index.tsx:64`, `TopicEditPage/index.tsx:33-36`,
  `TopicPrioritySortPage/index.tsx:23-26`, and the dead
  `ThemePermissionGate.tsx:19`.

**The three OR-route / AND-component mismatches**
(LIKELY; `NEEDS-TEAM-DECISION` on intent):

1. Topic-edit route (`form.routes.tsx:138-144`) is **OR** over VIEW and
   EDIT; the component (`TopicEditPage/index.tsx:33-36`) requires
   **AND**. A user with only VIEW passes the route and then hits the
   component's stricter check. Rendered result of that branch was not
   read — `NEEDS-VERIFICATION`.
2. Topic-priority-sort route (`form.routes.tsx:121-126`, OR) vs.
   `TopicPrioritySortPage` (AND, `TopicPrioritySortPage/index.tsx:23-26`).
3. Background-Main-edit route (`form.routes.tsx:157-162`, OR over the
   same three permissions) vs. `BackgroundMainEditPage` (AND,
   `BackgroundMainEditPage/index.tsx:64`).

Every `WithGuard permissions` array in the route files is OR; the route
layer has no AND array anywhere (e.g. `main.routes.tsx:131`,
`ADMINISTRATIVE_UNIT_VIEW` or `BANK_VIEW`).

**Notable route-permission choice:** the ekyc edit route
(`form.routes.tsx:903-908`) is guarded by `MAINTENANCE_SETTINGS_VIEW`
(L906), not an edit permission; the sibling view route uses the same
permission (L900). LIKELY a mismatch; `NEEDS-TEAM-DECISION`.

**What an authenticated, under-permissioned user sees:** `GuardedPage`
returns `<Navigate to={PageURLs.of404()} replace />`
(`guards/index.tsx:32-34`) before the page mounts or its chunk loads.
`/404` renders `NotFoundPage` (`not-found.page.tsx:21-24`). **No
403/unauthorized screen exists for route-level denial** — the `403`
status constant (`src/constants/http-status.constant.ts:10`) is only
inspected inside Background Main pages for API-error handling, not as a
route-level authorization screen. `RedirectPage` with no accessible menu
link and `ProductLabelsRouteGate` on denial both also navigate to
`/404`. Component-level denial hides or disables controls rather than
showing a dedicated screen.

**Permission-constant count — discrepancy, not silently resolved:**

- `grep -cE "^\s+[A-Z][A-Z0-9_]*: '" src/constants/permission.constant.ts`
  returns **189** (the audit's own, current-source-derived count).
- `.claude/PROJECT_CONTEXT.md` records **168 / 174 / 177 / 187** at
  different historical revisions/snapshots.
- These numbers are **not reconciled**. Per the module-doc
  count-discrepancy content rule (record both numbers, state the gap, do
  not silently pick one), this document states the gap and follows the
  audit's current-source count (189) as the operative figure for new
  work, while flagging the discrepancy `NEEDS-VERIFICATION` — see the
  follow-up proposal at the end of this task's output regarding
  `.claude/PROJECT_CONTEXT.md`'s stale count, which this document does
  not edit.

Product Labels: the 8 routes that bypass `WithGuard` use
`ProductLabelsRouteGate` (`main.routes.tsx:476-484`;
`form.routes.tsx:290-348`). Access is decided by `canAccessProductLabel`
(defined in `./routes`, not read by the audit) — a helper-resolved kind
per content rule 14, not yet confirmed against its actual call-site
semantics.

## 10. Shared and cross-domain dependencies

- `auth` Redux slice: read by `GuardedPage`, `AuthProvider`,
  `ProductLabelsRouteGate`, `useHasPermission`, `menus.tsx`,
  `Header.tsx`, and the auth pages. Any shape change affects all of
  these.
- `ApiFetcher`: every API call in the app; changes are HIGH-RISK per
  `.claude/rules/03-api-service.md`.
- `PageURLs` and `menuStructure`: used by guards, redirect logic, and
  menus.
- `main.tsx` / `providers/index.tsx`: bootstrap order. `makeStore(navigate)`
  is invoked eagerly on every render because `useRef(makeStore(navigate))`
  evaluates its argument eagerly (`providers/index.tsx:38`) — store
  creation and `setupListeners` run each render, with only the first
  instance kept by `useRef`. Incidental performance note, outside auth
  correctness.
- `AuthProvider` wraps the query and modal providers and the routes
  (`providers/index.tsx:53-55`); its loading gate affects every route in
  the app.

## 11. Consumers

- `useAuth`: observed at `login.page.tsx:18`, `auth.guard.tsx:13`,
  `non-login.guard.tsx:11`. A full repository-wide consumer count was
  not separately run by the audit.
- `useHasPermission`: **114 files** (`grep -rl useHasPermission src`).
- `hasPermission(` call lines: **306 lines in 113 files**
  (`grep -rn "hasPermission(" src`).
- `logoutUser`: `auth.slice.ts`, `Header.tsx:72`, `login.page.tsx:21,27`,
  `api-service.ts:111`.
- `filterMenuByPermissions`: `components/menus.tsx:136`.
- `findFirstAccessibleMenuLink`: `auth.provider.tsx:48`,
  `redirect.page.tsx:34`.
- `ThemePermissionGate`: zero consumers.

Essentially every business module (`products`, `users`, `system`,
`order`, `contents`, `notifications`, `blacklist`, `transactions`) is a
consumer of this infrastructure through `useHasPermission`/
`hasPermission` and the route guards — this is the practical
justification for documenting it under `docs/modules/` despite having no
`src/modules/auth/` directory (§0).

## 12. Pattern classification

- Redux as the permanent auth-session owner: **target-compatible**
  (`.claude/rules/04-state-management.md` names auth session explicitly
  as Redux-owned, not a Query-migration candidate).
- Route-guard composition `WithGuard -> AuthGuard -> RouteSuspense ->
  Page`: **legacy-compatible**, matches the target hierarchy in
  `.claude/rules/06-routing-permission.md`.
- The 8 product-label-gate routes bypassing `WithGuard`:
  **legacy-compatible, documented exception** — not a pattern to copy.
- MSAL injected into `ApiFetcher` via static setters:
  **legacy-compatible** (`.claude/rules/03-api-service.md` requires
  `ApiFetcher` to stay the sole transport boundary).
- Frontend-only authorization with OR route semantics:
  **legacy-compatible contract**; backend enforcement is
  `NEEDS-VERIFICATION`.
- AND checks at component level (`'every'`) layered under OR route
  checks: **uncertain** — intent not established.
  `NEEDS-TEAM-DECISION`.
- `fetchCount` cap of 25 as a loop guard: **uncertain** — its semantics
  are per-mount and increment on every effect run, not specifically on
  permission-fetch retries (see risk 9 in §13).

## 13. Technical risks

Flat list, ordered by decreasing consequence, carried over verbatim from
the audit's §13 ranking. Findings only — nothing has been fixed.

1. **Logout is client-side only; no MSAL sign-out.**
   `login.page.tsx:21-22`, `Header.tsx:72-73`, `auth.slice.ts:89-117`.
   `CONFIRMED` that `logoutRedirect`/`logoutPopup` is never called. The
   Entra session survives, so re-login can be silent (SSO).
   `NEEDS-TEAM-DECISION.`
2. **`interaction_required` race with logout's storage wipe.**
   `getToken` starts `loginRedirect` without awaiting it
   (`api-service.ts:56-60`), while the same original request later
   401s and `logoutUser` wipes storage (`api-service.ts:110-111`,
   `auth.slice.ts:91-92`) — can erase MSAL interaction state mid-redirect.
   LIKELY; `NEEDS-VERIFICATION`.
3. **A handled 401 resolves as success with `null` data.**
   `api-service.ts:148,150,161`. `getUserPermissions` can set
   `userPermissions` to `null` (`auth.slice.ts:180`), and
   `findFirstAccessibleMenuLink` then throws on `null.includes`
   (`navigate.ts:439`). LIKELY; `NEEDS-VERIFICATION`.
4. **Network-error crash in the response interceptor.**
   `api-service.ts:140` reads `error.response.status` without optional
   chaining, turning a plain network failure into an unrelated
   `TypeError`. `CONFIRMED` static.
5. **Non-auth client state survives logout.** `logoutUser` resets only
   the `auth` slice (`auth.slice.ts:98-108`); the TanStack Query cache
   is never cleared, so a subsequent user on the same tab/browser could
   see cached data from the previous session until a refetch. LIKELY;
   `NEEDS-VERIFICATION`.
6. **Full storage wipe on every logout.** `localStorage.clear()` also
   removes `app_locale` (resets language) and the MSAL cache shared by
   all open tabs (`auth.slice.ts:91-92`, `constants/locale.ts:1`,
   `authConfig.tsx:18`). LIKELY.
7. **Route (OR) vs. component (AND) permission mismatch.** Topic-edit
   and topic-priority-sort routes are OR
   (`form.routes.tsx:121-126,138-144`) while their pages require AND
   (`TopicEditPage/index.tsx:33-36`, `TopicPrioritySortPage/index.tsx:23-26`).
   Background-Main-edit has the identical OR-route/AND-page pattern
   (`form.routes.tsx:157-162`, `BackgroundMainEditPage/index.tsx:64`).
   What renders for a VIEW-only user on the denied branch was not read.
   LIKELY; `NEEDS-VERIFICATION`; `NEEDS-TEAM-DECISION`.
8. **Permission-fetch failure degrades to a permanent-looking 404.**
   `auth.slice.ts:182-185` sets `[]` on failure; `GuardedPage` then
   redirects every permissioned route to `/404`
   (`guards/index.tsx:32-34`); `AuthProvider` only logs the error
   (`auth.provider.tsx:51-53`), with no retry affordance exposed to the
   user. LIKELY.
9. **Possible zero-permission refetch loop, bounded only by a session
   counter.** The effect re-runs on every change of `userPermissions`,
   `defaultPath`, or `accessToken` (`auth.provider.tsx:59`). An
   empty-array result from `getUserPermissions` creates a new array
   reference each time (`auth.slice.ts:180`), which can re-trigger the
   effect. `fetchCount` increments on every run (L43), capped at 25
   (L38), and never resets within a mount — a token refresh also counts
   toward the cap. After the cap, the permission fetch is silently
   skipped for the rest of the mount. LIKELY; `NEEDS-VERIFICATION`.
10. **Default landing can be a permissionless, authentication-only
    route.** `auth.guard.tsx:23` and `non-login.guard.tsx:14` fall back
    to `PageURLs.ofIndustrySettings()` when `defaultPath` is empty, and
    that route has no permission guard (`main.routes.tsx:161`). A user
    with no permissions at all still lands on a working, unguarded
    page. LIKELY.
11. **19 authentication-only routes in `main.routes.tsx` with no
    permission check** (enumerated in §2); several corresponding menu
    entries are commented out in `menus.helper.ts`. Whether these are
    intentionally open or an oversight, and whether the backend
    separately enforces them, is `NEEDS-TEAM-DECISION` /
    `NEEDS-VERIFICATION`.
12. **`RedirectPage` can be unmounted mid-flow by `AuthProvider`'s
    loading gate.** `AuthProvider` sets `isLoading = true` on token
    change (`auth.provider.tsx:44,61-63`), which can unmount
    `RedirectPage` while its own promise chain is still running
    (`redirect.page.tsx:22-41`); a second, parallel permission fetch
    also runs (`redirect.page.tsx:33` vs. `auth.provider.tsx:47`).
    LIKELY; `NEEDS-VERIFICATION`.
13. **Broken default-account fallback at bootstrap.** `main.tsx:38`
    calls `setActiveAccount(msalInstance.getActiveAccount())`, which is
    `null` when there is no active account — the evident intent was
    `getAllAccounts()[0]`. `CONFIRMED` defect. Real-world impact
    depends on whether MSAL restores the active account from its own
    cache without this fallback — `NEEDS-VERIFICATION`.
14. **Silent failure on MSAL `initialize()` rejection.** `main.tsx:57-59`
    logs and renders nothing if `initialize()` throws — a blank page
    with no user-visible error. `CONFIRMED`.
15. **Edit route guarded by a view-only permission.** The ekyc edit
    route (`form.routes.tsx:906`) uses `MAINTENANCE_SETTINGS_VIEW`
    rather than an edit-specific constant. LIKELY mismatch;
    `NEEDS-TEAM-DECISION`.
16. **Concurrent token refresh with no de-duplication.** N simultaneous
    requests against an expired token trigger N independent
    `acquireTokenSilent` calls and N `setAccessToken` writes
    (`api-service.ts:93-99`). `CONFIRMED` at the application level;
    whether MSAL mitigates this internally is `NEEDS-VERIFICATION`.
17. **Misleading login-error message for non-auth failures.**
    `redirect.page.tsx:52,61,71` shows "Bạn không có quyền truy cập"
    (no access permission) for any login failure including plain
    network errors. `CONFIRMED` static. Low severity.
18. **`env-mapper.ts` passes `VITE_MSAL_TENANT_ID` as the `msalScope`
    constructor argument.** `env-mapper.ts:21` — `CONFIRMED` mismatch,
    matching the `.claude/PROJECT_CONTEXT.md` suspicion. Currently
    latent/low-impact because `AppEnv.msalScope` is never read anywhere
    — the real MSAL scope actually used at runtime is
    `loginRequest.scopes`, built independently from
    `VITE_MSAL_APP_ID_AUDIENCES` (`authConfig.tsx:59`). The mistake
    exists in dead/unused data, not in the active login path.
19. **`appEnvs` has only a `'default'` key, so the host lookup always
    misses.** `env-mapper.ts:14-23` declares one key, `'default'`
    (L15); `current-ctx.provider.tsx:6` looks up
    `appEnvs[window.location.host]`, which can never match, so the
    fallback (L9-10) always runs and logs "Can't detect domain ENV" on
    every page load. `CONFIRMED`, matching the
    `.claude/PROJECT_CONTEXT.md` suspicion. Because the fallback is the
    only environment object that exists, this currently causes no
    wrong-environment risk — only a spurious console warning on every
    load — but it means the four unreferenced
    `VITE_LATEST_*`/`VITE_PROD_*` env names are dead with respect to
    this map.
20. **Asymmetric empty-permission-array handling.** The route guard
    skips the check entirely for `[]` (fail-open,
    `guards/index.tsx:32`), while the component hook returns `false`
    for `[]` (fail-closed, `auth.hook.ts:36`). No route currently
    passes an empty array, so this is latent, not currently
    exploitable. Low; see §15.
21. **Dead code.** `fetchAzureUserInfo`, `postLogoutRedirectUri`,
    `ThemePermissionGate`, and several commented-out menu entries
    (enumerated in §2). Low severity, listed for completeness per
    content rule 10.

## 14. Areas to avoid touching

Not authorization to change anything — these carry the highest blast
radius per `.claude/ARCHITECTURE.md` §13 and
`.claude/rules/03-api-service.md`:

- `src/utils/api-service.ts` (`ApiFetcher`) — HIGH-RISK.
- `src/guards/**`, `src/routes/**` — HIGH-RISK.
- `src/redux/slices/auth.slice.ts`, `src/providers/auth.provider.tsx`,
  `src/hooks/auth.hook.ts` — session and permission state.
- `src/configs/authConfig.tsx`, `src/utils/env-mapper.ts`,
  `src/main.tsx` — MSAL bootstrap.
- `src/constants/permission.constant.ts`, `src/helpers/menus.helper.ts`
  — shared permission/menu registries consumed across 100+ files.

## 15. Open questions

Carries every `NEEDS-VERIFICATION` and `NEEDS-TEAM-DECISION` item from
the audit's §0 and §15, beyond the five capped in this document's §0:

- `NEEDS-VERIFICATION`: whether the backend enforces permissions
  server-side per endpoint (frontend guards are explicitly not a
  security boundary per `.claude/rules/06-routing-permission.md`).
- `NEEDS-VERIFICATION`: exact `canAccessProductLabel` semantics inside
  `ProductLabelsRouteGate.tsx`'s `./routes` helper (not read by the
  audit).
- `NEEDS-VERIFICATION`: rendered behavior of the denied branch inside
  `TopicEditPage`, `TopicPrioritySortPage`, and `BackgroundMainEditPage`
  when the AND check fails after the OR route check passed.
- `NEEDS-VERIFICATION`: `window.currentCtx`/`window.apiFetcher` ambient
  declarations and the `User` global type's exact location.
- `NEEDS-VERIFICATION`: trailing-slash handling for the 8 product-label
  gate routes, which bypass `WithGuard` entirely.
- `NEEDS-VERIFICATION`: whether any caller of `LocalUtils.clear()`
  exists in the current source.
- `NEEDS-VERIFICATION`: the 189 vs. 187/177/174/168 permission-constant
  count discrepancy across snapshots (§9) — not resolved here, carried
  forward as a follow-up against `.claude/PROJECT_CONTEXT.md`.
- `NEEDS-VERIFICATION`: whether MSAL itself de-duplicates concurrent
  `acquireTokenSilent` calls (the application code does not — risk 16).
- `NEEDS-VERIFICATION`: real deployed `VITE_*` values (not read, to
  avoid exposing them).
- `NEEDS-TEAM-DECISION`: whether logout must perform a true Entra
  sign-out (`logoutRedirect`, possibly `prompt: 'select_account'`) —
  affects Flow 2 and risk 1.
- `NEEDS-TEAM-DECISION`: whether the 19 authentication-only routes
  (§2, risk 11) should carry permission guards.
- `NEEDS-TEAM-DECISION`: the intended relationship between AND
  component checks and their OR route guards (risk 7, §9).
- `NEEDS-TEAM-DECISION`: the ekyc edit-route permission choice
  (risk 15).
- `NEEDS-TEAM-DECISION`: whether unauthorized-but-authenticated access
  should ever render a dedicated 403 screen instead of redirecting to
  404 (already an open item in `.claude/ARCHITECTURE.md` §21, item 6 —
  this document reconfirms current behavior is 404-only).
- Low-severity, outside primary scope: hard-coded Vietnamese strings in
  auth paths (`api-service.ts:115`, `redirect.page.tsx:52-71`) bypass
  i18n; `providers/index.tsx:38`'s eager `makeStore` evaluation on
  every render is a performance note unrelated to auth correctness.
