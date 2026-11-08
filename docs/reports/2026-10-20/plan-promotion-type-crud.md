# Codebase Analysis: Quản lý Loại ưu đãi (Promotion Types CRUD, UC #2091)

- Git revision: `f8a04a49`
- Branch: `develop`
- Date: 2026-10-20
- Mode: read-only static inspection. No repo file was modified.
- Scratch script: `/private/tmp/claude-502/-Users-nguyen-quoc-vuong3-001-hds-admin/e9c55eb5-1e7f-48ae-a1a3-b434db0bce65/scratchpad/i18n.js`
- Author note: codebase-analyzer
- Not run: `typecheck`, `lint`, `build`, browser.
- Report saved: 2026-10-21. At save time the checkout was on branch `fixbug/vuongnq/theme-lock_2345` @ `6dc0c45c`. `git diff 6dc0c45c f8a04a49` is empty, so the source tree matches the investigated revision. The only working-tree change is an uncommitted `.prettierrc` edit, made outside this investigation.
- Orchestrator spot-check (2026-10-21, `[EV]`). Each of these was re-confirmed against source: `api-service.ts:174` URL composition; `permission.constant.ts:125-126,157-158`; `guards/index.tsx:53-61` `/404` redirect; `theme-management/constant.ts:1` `LIST_QUERY_STALE_TIME_MS = 60_000`; `routes/index.tsx` 2093 lines, 178 `<Route>`, 20 `lazy(`; 102 `PageURLs` builders; no `promotion-management/` directory; 0 hits for `promotion-type|promotionType|marketing_option|MARKETING_GROUP`.

**Tag legend**
- `[EV]` is evidence, given as path:line plus quoted or described code.
- `[INF]` is inference.
- Certainty labels: `CONFIRMED`, `LIKELY`, `NEEDS-VERIFICATION`, `NEEDS-TEAM-DECISION`.

All paths are relative to `/Users/nguyen.quoc-vuong3/001-hds-admin`.

## 0. Headline findings

1. No collision.
   - `src/modules/products/promotion-management/` does not exist.
   - `promotion-type`, `promotionType`, `marketing_option` and `MARKETING_GROUP` have zero hits in `src/`.
   - There is no `PromotionManagement` i18n key in either lang file.
   - No `PERMISSIONS` constant, `PageURLs` builder or route mentions promotion types.
2. `attractive-offer` and `card-gift-offer` are not the same domain as promotion types. They are adjacent in name only.
   - `attractive-offer` is a single-config view/edit screen over `api/admin/portal/v1/product-attractive-offer`.
   - `card-gift-offer` is mock-only. It has no persistence endpoint.
3. The URL must be built as `api/admin/portal/v1/promotion-types`. ApiFetcher concatenates `${apiUrl}/${url}`, and the API host has no path part. `[EV]`
4. There is no error-envelope mapper for `{code, message, details:[{field,message}]}`. No `details` consumer exists anywhere in `src/`. Only a code/status reader exists (`topic-api.error.ts`, `theme-lock-api.error.ts`), plus a Zod-issue to AntD mapper (`topic-zod-antd-validation.helper.ts`). `[EV]`
5. There is no shared 0-based to 1-based pagination helper. The convention is inline: a `page` state starting at 1 and `page: page - 1` into the query. `[EV]`
6. The module-location choice is `NEEDS-TEAM-DECISION`.
   - The menu "Tham số sản phẩm" does not align with directory names.
   - `required-information` renders under that menu but lives under `configuration/`.
   - `attractive-offer` lives at the products root but renders under "Phát hành sản phẩm".
7. Scoped Theme/Topic conventions are not widened to `products/`.
   - `.claude/rules/03-api-service.md` says that outside the Theme Management child modules "follow the existing module layout; the folder mandate below is not widened".
   - The products module has no Query-owned CRUD precedent except `scheme-sync`, which keeps the older pattern.
8. Rule 03's key-factory shape, `queryOptions` and `keepPreviousData`, still applies to any new Query-owned resource.

## 1. Task Understanding

Validate an implementation plan for a new CRUD screen, "Quản lý Loại ưu đãi" (Promotion Types). The backend swagger places it under menu "Tham số sản phẩm". The plan proposes `src/modules/products/promotion-management/promotion-type/`. Risk is `HIGH-RISK` because it touches routing, permissions and the menu.

## 2. Entry Point

There is no existing entry point for this feature. Sections 9 and 14 list what must be created. The closest templates are:
- the Theme list route at `src/routes/index.tsx:686-695`;
- the fee-list quartet of list/create/view/edit routes at `src/routes/index.tsx:574` and `1528-1568`;
- `src/modules/system/theme-management/theme/` and `topic/` for the module structure.

## 3. Feature Flow (Section A: module path and name collisions)

### Q1. `src/modules/products/` tree, depth 2, file counts

Counted from `find -type f` (`[EV]`, command output).

| Child | Files | Depth-2 children (files) |
|---|---|---|
| `add-on/` | 19 | components 5, create 3, edit 3, helpers 1, options 1, view 4, plus root files `add-on.tsx` and `ultis.tsx` |
| `attractive-offer/` | 13 | components 5, edit 1, view 2, plus root files `api-mappers.ts`, `constants.ts`, `navigation.ts`, `types.ts`, `utils.ts` |
| `configuration/` | 254 | card-gift-offer 10, components 5, group-list-product 22, industry-product 34, list-product 59, product-labels 78, required-information 12, required-information-set 11, scheme-sync 23 |
| `parameter/` | 51 | contract-termplate 14, document-list 9, document-set 9, fee 9, group-document-list 8, plus 2 root placeholders: `condition-list.parameter.tsx` and `input-form-list.parameter.tsx` |
| `popular-loans/` | 13 | components 5, edit 1, view 2, plus root files `api-mappers.ts`, `constants.ts`, `navigation.ts`, `types.ts`, `utils.ts` |
| `simulation/` | 42 | card-packages 10, cash-loan 4, components 3, display-order 17, edit 1, history 2, view 1, plus root files |

The top-level total is 392 files. `CLAUDE.md` says 383 and `OVERVIEW.md` says 312, so both are stale. The depth-2 counts above come from directory-by-directory `find`.

### Q2. Does `promotion-management/` exist?

No. `ls src/modules/products` returns `add-on attractive-offer configuration parameter popular-loans simulation`. `[EV]` `CONFIRMED`

### Q3. `attractive-offer/`

- **What it is.**
  - It is a singleton configuration of "other attractive offers", with a product table and a history tab.
  - Its constants include `ATTRACTIVE_OFFER_TABS` (`constants.ts`).
  - `navigation.ts` has `getAttractiveOfferTab` and `getAttractiveOfferEditUrl`.
  - Its Redux-free service layer is `api-mappers.ts`.
  - `[EV]`
- **Endpoints.**
  - `src/modules/products/attractive-offer/api-mappers.ts:11` is `'api/admin/portal/v1/product-attractive-offer'`.
  - `:13` is `'api/admin/portal/v1/product-attractive-offer/history'`.
  - `:15` is `'api/admin/portal/v1/products/search/assignable'`.
  - `:541-542` is `get: (url, options) => window.apiFetcher.get(url, options)` and `put: (url, data) => window.apiFetcher.put(url, data)`.
- **Routes.**
  - `src/routes/index.tsx:1225` is `product/attractive-offer/view`, guarded by `PERMISSIONS.PRODUCT_ATTRACTIVE_OFFER_VIEW`.
  - `:1235` is `product/attractive-offer/edit`, guarded by `PRODUCT_ATTRACTIVE_OFFER_EDIT`.
  - Both pages are eagerly imported (`routes/index.tsx:201-202`).
  - `PageURLs.ofAttractiveOfferConfig` and `ofAttractiveOfferEditConfig` are at `navigate.ts:99-108`.
- **Menu.**
  - It sits under "Phát hành sản phẩm" (`Menu.productIssuance`) at `menus.helper.ts:244-247`.
  - It is not under "Tham số sản phẩm".
- **Relation to promotion types.**
  - `[INF] LIKELY` none. It curates a product list for one offer slot.
  - No import, type or endpoint is shared with promotion types.
  - Whether the backend ties these together is `NEEDS-VERIFICATION`.

### Q4. `card-gift-offer`

- **Location and files.**
  - It is at `src/modules/products/configuration/card-gift-offer/`.
  - Files: `assignment-preview.tsx`, `constants.ts`, `mock-data.ts`, `rule-form.tsx`, `list/{list,searcher}.tsx`, `create/form.tsx`, `edit/form.tsx`, and `view/{form,history}.tsx`.
- **Routes.**
  - `routes/index.tsx:421` is the list, guarded by `CARD_GIFT_OFFER_VIEW`.
  - `:910` is create, `:923` is `view/:id`, and `:936` is `edit/:id`.
  - Builders are `navigate.ts:149-163`.
  - `menus.helper.ts` has no entry for it, so it is route-only. `[EV]` (grep of `menus.helper.ts` finds `attractiveOffer` only.)
- **Service.**
  - There is no service file.
  - The only API calls are reference reads in `rule-form.tsx:312,320,328,336,529,537`, on `api/admin/portal/v1/products/search` and `.../document-set`.
  - Save and history are mock. `docs/modules/products/card-gift-offers.md` §1 says "Persistence and history are mock-only".
- **Domain.** `[INF]` It is a different domain: gift-loan rules for credit cards. It is unrelated to a promotion-type master list.
- **Permission precedent.** `permission.constant.ts:156-158` has the comment "dùng quyền sản phẩm làm fallback trong giai đoạn mock". That is a precedent that FE permission strings can be placeholders before BE roles are confirmed.

### Q5. `parameter/` and the "Tham số sản phẩm" question

- **Child features.**
  - On disk, `src/modules/products/parameter/` holds `contract-termplate` (sic), `document-list`, `document-set`, `fee` and `group-document-list`.
  - It also holds the two placeholder files `condition-list.parameter.tsx` and `input-form-list.parameter.tsx`.
  - `[EV]`
- **Menu.** The "Tham số sản phẩm" menu (`menus.helper.ts:264-324`) lists:
  - documentGroup
  - document
  - documentSet
  - contractTemplate
  - requiredInformation
  - requiredInformationSet
  - plus, per the earlier output, more entries that were not re-read.
- **Directory and menu do not align.**
  - `required-information` and `required-information-set` render under the "Tham số sản phẩm" menu and the `/product/parameter/...` URL prefix.
  - But they live in `configuration/` on disk (`configuration/required-information`, `configuration/required-information-set`).
  - Fee uses `/product/parameter/product-fee-list` in `navigate.ts` and the route at `routes/index.tsx:574`, and it is in `parameter/fee/`.
  - `[EV]` (`routes/index.tsx:463,473`, the `product/parameter/required-information*` routes.)
  - Evidence that module layout is not a function of menu or URL.
- **Evidence for `promotion-management/`.**
  - Avoids mixing a new Query-owned feature into `parameter/`, which holds 4 legacy Redux CRUDs with no `services/`, `queryKeys/` or `hooks/` folders.
  - Gives the new module its own parent for future promotion-related children, as the plan's `promotion-type/` child implies.
  - Matches how `attractive-offer/` and `popular-loans/` sit at the products root while appearing under different menu groups.
- **Evidence for `parameter/promotion-type/`.**
  - The BE swagger groups it under "Tham số sản phẩm".
  - The URL would naturally be `/product/parameter/promotion-types`, in line with sibling URLs.
  - It would keep the module path and menu group aligned for the five existing `parameter/` features.
- **Verdict: `NEEDS-TEAM-DECISION` (module location).** Options are `promotion-management/promotion-type/`, `parameter/promotion-type/`, or another location. Not picked here.

### Q6. grep hits across `src/`

- **Exact tokens.**
  - `marketing_option`, `MARKETING_GROUP`, `promotionType` and `promotion-type`: 0 hits. `[EV]`
  - `marketing` (case-insensitive) has 524 matches in 48 files. These are the `EEndPointImportType.PRODUCT_MARKETING` import flow and product marketing slices (for example `src/components/forms/import/import-file-form.tsx:44`). They are unrelated to promotion types.
- **`promotion` (case-insensitive).** Hits cover 38 files. By group:
  - Ambient product types: `src/types/product-list.d.ts` (12, for example `ProductPromotion` at `:137`, `hasPromotionalOffer`, `inheritPromotionalOffer`), `src/types/product-group-list.d.ts` (6), `src/types/loan-order.d.ts` (4, for example `promotionCode: string | null` at `:64`), and `src/types/notification-list.d.ts` (1, the `'PROMOTION'` literal at `:22`).
  - Product configuration: `configuration/list-product/{utils.tsx,constant.ts}` (26 and 2), `list-product/{create,edit,view}/{cash-loan,credit-card}/promotion.tsx` (about 250 hits across 8 files), `list-product/shared/history/history-comparison.helper.ts` (46), `group-list-product/**` (about 90 hits across 9 files), and `scheme-sync/{types.ts,comparison-drawer.helper.ts}` (1 and 3).
  - Redux: `redux/slices/product-group-list.slice.ts` (16), `redux/slices/product-list.slice.ts` (13), and `redux/middlewares/{product-group,product}.middleware.ts` (5 each). `utils.tsx:750,762` call `api/admin/portal/v1/product-groups/${id}/promotions`.
  - Orders: `src/modules/order/loan-order-list/view/{product.tsx (9), loan-order-detail.tsx:904}`.
  - Notifications: `src/modules/notifications/configuration/list-notification/**` (about 10 hits across 4 files).
- **Meaning.** `[INF]` The "promotion" vocabulary is entirely product-level data (hasPromotionalOffer, promotion cards, order promotionCode). Promotion types as a master list do not exist in FE. A BE link between promotion types and product promotions is `NEEDS-VERIFICATION`.
- **Lang files.** The only offer match is `Menu.attractiveOffer` (see Q29).

## 4. Files Involved

For the file list of the reference modules see Q7. The proposed new files and outside-module files are in Section 16.

### Q7. Reference modules, files by subdirectory

Splash-screen is at `src/modules/system/splash-screen/` (22 files, flat plus a few folders). It is not a Theme-style tree.

| Dir | Files |
|---|---|
| root | `SplashScreenList.tsx`, `SplashScreenSort.tsx`, `constants.ts`, `mappers.ts`, `types.ts`, `validators.ts` |
| `components/` | `SplashScreenAssetUpload.tsx`, `SplashScreenCustomerSegmentField.tsx`, `SplashScreenFormPreview.tsx`, `SplashScreenGeneralForm.tsx`, `SplashScreenSearcherForm.tsx` |
| `create/` | `general.tsx`, `index.tsx` |
| `edit/` | `general.tsx`, `index.tsx` |
| `view/` | `general.tsx`, `history.tsx`, `index.tsx` |
| `hooks/` | `splashScreenQueries.ts`, `useSplashScreenCustomerSegments.ts` |
| `queryKeys/` | `splash-screen.query-keys.ts` |
| `services/` | `splash-screen.service.ts` (object-style `splashScreenService`) |

Theme-management is at `src/modules/system/theme-management/`.

| Dir | Files |
|---|---|
| root | `constant.ts`, `ThemeConfigurationRedirect.tsx`, `ThemePermissionGate.tsx` (no route uses it) |
| `components/` | `DetailLoadingState`, `ManagementDetailLayout`, `ManagementPageFooter`, `ManagementPageHeader`, `ManagementTableSection`, `ThemeTableSection`, `TopicTableSection` (each `index.tsx` plus `styles.module.scss`), and `chip-tag.module.scss` |
| `hooks/` | `useDebouncedSearchKeyword.hook.ts` |
| `utils/` | `gmt7-date.util.ts` |
| `theme/` | components (`ThemeAssetPicker`, `ThemeForm`, `ThemePageShell.tsx`, `ThemePreview`, `ThemeUpdateHistory`), hooks (`theme.queries.hook.ts`, `useThemeCustomerSegments.hook.ts`), queryKeys (`theme.query-keys.ts`), **schemas** (`theme-form.schema.ts`), services (`theme.service.ts`), types (`theme.types.ts`), utils (4 `*.helper.ts` and `*.validation.ts`), and views (`ThemeCreatePage`, `ThemeEditPage`, `ThemeListPage`, `ThemeViewPage`, each `index.tsx`) |
| `topic/` | same shape as `theme/`, plus `utils/topic-api.error.ts`, `utils/topic-zod-antd-validation.helper.ts`, `TopicActionModal` and `TopicPrioritySortContent` |
| `theme-lock/` | components, hooks (`theme-lock.queries.hook.ts`), queryKeys, services, types, utils (`theme-lock-api.error.ts`, `*.util.ts`) and `views/ThemeLockPage` |

- **Deviation from the scoped rule.** Theme and Topic contain a `schemas/` folder. The rule's folder list in `.claude/rules/01-architecture.md` and `02-typescript.md` is `views, queryKeys, services, utils, types, components, hooks`. `02-typescript.md` only says "Keep schemas and fixtures with their semantic owners". So `schemas/` is implemented but not enumerated. Whether to include it is minor and flaggable. `[EV]` `CONFIRMED`
- **View export shape.** `src/routes/index.tsx:240-241` lazy-imports `'@/modules/system/theme-management/theme/views/ThemeListPage'`, so the view directory's `index.tsx` default export is the contract.

## 5. State Ownership

- **Authoritative owner (proposed).**
  - TanStack Query for the server resource, as in theme-management.
  - Redux would be the alternative.
  - `[EV]` State split: `CLAUDE.md` states the new modules chose opposite architectures. `system/splash-screen` uses Query, a service and `Skeleton`. `contents/popup` uses Redux, ambient types, an `enum` and `Spin`.
  - **State owner (Query vs Redux): `NEEDS-TEAM-DECISION`.** `.claude/rules/04-state-management.md`, `01-architecture.md` and `ARCHITECTURE.md` prefer Query for new server resources.
- **Query-owned areas in products.**
  - Only `configuration/scheme-sync/` (`scheme-sync.queries.hook.ts`, `scheme-sync.query-keys.ts`, `services/scheme-sync.service.ts`).
  - Everything else in products is Redux or local state.
  - The `product-labels` module has `queryKeys/` folders (`cash-loan-label.query-keys.ts:44`) but is Redux-owned per `OVERVIEW.md`. `[INF]` These key files are not `queryOptions` factories feeding `useQuery`.
  - A `useQuery`/`useMutation` grep across `src/modules` shows Query hooks in `system/theme-management`, `system/splash-screen`, `users/*` and `scheme-sync`.
- **Derived/local draft.** AntD `FormInstance` is the sole form-state owner (`CLAUDE.md`, `05-form.md`). List filter, page and size are local `useState`, as in `TopicTableSection` (`:84-85`).
- **Other copies.** None to introduce. Avoid copying the same resource into Redux and Query.
- **Query defaults.** `src/providers/query.provider.tsx` sets `retry: false` and `refetchOnWindowFocus: false` for queries, and `retry: false` for mutations. No global `staleTime`, and the rule forbids adding one. `[EV]`

## 6. API Flow

### Q10. ApiFetcher and the final URL

- **Definition.**
  - `src/utils/api-service.ts:23` is `constructor(host: string)`, which stores `this.apiUrl = host`.
  - `:174` (GET) is `const fullUrl = url.startsWith('http') ? url : \`${this.apiUrl}/${url}${objectToQueryString(query)}\``.
  - `:189` (POST), `:202` (PUT), `:215` (PATCH) and `:224` (DELETE) are each `\`${this.apiUrl}/${url}\``.
  - DELETE is defined at `:223` as `async delete(url, options)`.
- **Where the host comes from.**
  - `src/providers/current-ctx.provider.tsx:31` is `window.apiFetcher = new ApiFetcher(appEnv.apiHost)`.
  - `src/utils/env-mapper.ts:17` is `metaEnv.VITE_API_HOST` as `apiHost`.
- **Does the host carry a path?**
  - Checked without printing the value. `VITE_API_HOST` has no path after the host, no trailing slash, and does not contain `api/admin`. `[EV]` (boolean checks on `.env`.)
  - The `.env` value is `NEEDS-VERIFICATION` per deployment, since `appEnvs` has only a `default` entry and other environments can differ in principle.
- **Therefore a service must pass `'api/admin/portal/v1/promotion-types'`.** Not `portal/v1/promotion-types`, and not a leading `/`. `CONFIRMED`

Three existing service files as evidence:
- `src/modules/system/theme-management/theme/services/theme.service.ts:14` is `const THEMES_ENDPOINT = 'api/admin/portal/v1/themes';`.
- `src/modules/system/theme-management/topic/services/topic.service.ts:13` is `const THEME_CATEGORY_ENDPOINT = 'api/admin/portal/v1/theme-categories';`.
- `src/modules/system/splash-screen/services/splash-screen.service.ts:15` is `const BASE_PATH = 'api/admin/portal/v1/splash-screens';`.
- Also: `theme-lock.service.ts:9` is `'api/admin/portal/v1/theme-locks'`, and `scheme-sync.service.ts:29` is `'api/admin/portal/v1/schemes/synchronization'`.

### Query strings and error shape

- **Query strings.**
  - `get` also accepts a `query` option through `objectToQueryString`.
  - Theme services instead build the string with a local `appendQueryParams` (`theme.service.ts:41-53`) and pass `{ signal }`.
  - The same helper is duplicated in `splash-screen.service.ts:17-29`. `[INF]` A shared helper does not exist.
- **Thrown shape.** `ApiFetcher.request` rethrows `error.response || error` (`api-service.ts:154,163`), so `status` and `data` sit directly on the thrown object. Existing readers handle both.
- **401.** `api-service.ts` `request` returns `{ data: null }` for 401 and dispatches `logoutUser`. Services therefore see `null`. `theme.service.ts:33-39` `requireThemeApiResponse` throws a `TypeError` on a `null` response.

### Q11. Auth token

- Entra ID via MSAL, not Keycloak. A case-insensitive grep for `keycloak` in `src/` and `package.json` returns nothing. `[EV]`
- `src/configs/authConfig.tsx:11-13` uses `clientId: import.meta.env.VITE_MSAL_APP_ID` and `authority: https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID}`. `:59` sets `scopes: [VITE_MSAL_APP_ID_AUDIENCES]`.
- `api-service.ts:83-107` `getHeaders` reads `state?.auth?.accessToken || LocalUtils.get('access_token')`, refreshes via `acquireTokenSilent` (`:50`) if expired, and attaches `Authorization: Bearer ${accessToken}` (`:104`). It also sets `Accept-Language` from `localStorage.app_locale`.
- Role strings such as `promotion_management:view` come from `watchUserPermissions` in `auth.slice`, not from token parsing in `ApiFetcher`. How that slice is populated is not traced here. `NEEDS-VERIFICATION`.

### Q12. Error envelope to `setFields()`

- **None exists.**
  - A grep for `.details` / `details?.` / `details.map` across `src/` finds only unrelated hits (`t&c/view/form.tsx:31`, product-label preview, and `queryKeys` `details()`).
  - `setFields(` appears in 20 files, but none maps an API `details[].field`.
- **Closest code.**
  - `src/modules/system/theme-management/topic/utils/topic-api.error.ts` has `getThemeCategoryErrorStatus`, `isThemeCategoryNotFoundError` and `isThemeCategoryVersionConflictError`. They read `response.status` and `data.code`/`data.errorCode`.
  - `theme-lock/utils/theme-lock-api.error.ts:38-52` has `readStatusAndCode` and a code-to-i18n-key switch.
  - `topic/utils/topic-zod-antd-validation.helper.ts:23` has `mapTopicZodIssuesToAntdErrors(issues)`, returning `{ fieldErrors: {name, errors}[], formErrors: string[] }`. It is Zod-issue input, not API-envelope input. It is hard-wired to a `TOPIC_FORM_FIELDS` set.
  - `TopicForm/index.tsx:106-150` `applySchemaIssues` calls `form.setFields([...])` preserving non-schema errors.
- **Ownership of a new mapper.** `NEEDS-TEAM-DECISION`. Options are a feature-local `utils/promotion-type-api.error.ts`, or a shared util under `src/utils/`. Consumer count alone does not justify promotion (`01-architecture.md` local-first). `[INF]` Today there is one candidate consumer.

### Q13. 0-based page to 1-based Pagination

- **No shared helper exists. The convention is inline.**
  - `src/modules/system/theme-management/components/TopicTableSection/index.tsx:84` is `const [page, setPage] = useState(1);` and `:98` is `page: page - 1,`.
  - `:300-301` passes `current={page}` and `pageSize={pageSize}` to `CustomPagination`.
  - `:106` reads `query.data?.pageInfo.totalElements`.
- **Legacy variants.**
  - Redux modules use `page: PAGINATION.currentPage - 1` and `current={pagination.currentPage + 1}` (for example `order/contract-list/list.contract.tsx:155`, `contents/t&c/view/history.tsx:92`).
  - `contents/popup/list.tsx:596-598` is `current={query.page + 1}` with `page: page - 1`.
- **Response type.** `topic.types.ts:35-44` is `{ pageInfo: { totalElements, totalPages, currentPage, pageSize }, items }`. Whether the promotion-types BE returns `pageInfo`/`items` is `NEEDS-VERIFICATION`.

### Mutations and query keys

- **Q8. Theme query-keys, quoted in full.**
  - Full file: `src/modules/system/theme-management/theme/queryKeys/theme.query-keys.ts`, 64 lines. The topic variant is `topic/queryKeys/topic.query-keys.ts`, 81 lines (its `all` is `['theme-categories']`). Imports and the factory top:

```ts
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { LIST_QUERY_STALE_TIME_MS } from '../../constant';
import { getThemeById, getThemeHistory, getThemes } from '../services/theme.service';
import type { ThemeHistoryQueryParameters, ThemeListQueryParameters } from '../types/theme.types';
...
export const themeQueryKeys = {
  all: ['themes'] as const,
  lists: () => [...themeQueryKeys.all, 'list'] as const,
  list: (params: ThemeListQueryParameters = {}) =>
    queryOptions({
      queryKey: [...themeQueryKeys.lists(), normalizeListParameters(params)] as const,
      queryFn: ({ signal }) => getThemes(params, signal),
      staleTime: LIST_QUERY_STALE_TIME_MS,
      placeholderData: keepPreviousData
    }),
  details: () => [...themeQueryKeys.all, 'detail'] as const,
  detail: (id: number) =>
    queryOptions({
      queryKey: [...themeQueryKeys.details(), id] as const,
      queryFn: ({ signal }) => getThemeById(id, signal),
      enabled: Number.isSafeInteger(id) && id > 0
    }),
  histories: () => [...themeQueryKeys.all, 'history'] as const,
  historyById: (id: number) => [...themeQueryKeys.histories(), id] as const,
  history: (id, params = {}) => queryOptions({ ..., staleTime: LIST_QUERY_STALE_TIME_MS, placeholderData: keepPreviousData })
};
```

  - Confirmed `[EV]`: line 1 imports `keepPreviousData, queryOptions`. Lines 3-7 import the service functions. Prefix methods `all`, `lists()`, `details()`, `histories()` and `historyById(id)` return plain `as const` arrays (lines 32-33, 44, 51-52). Fetching methods return `queryOptions({ queryKey, queryFn: ({ signal }) => ..., ... })`. Private `normalizeListParameters` normalises `page ?? 0` and `size ?? 10`.
  - `theme-lock.query-keys.ts` imports `queryOptions` only and sets no `staleTime`. It has no paginated list, so no rule breach.
  - `topic.query-keys.ts:40-50` adds an `enabled = true` argument on `list`.
- **Q9. Stale-time constant.** `src/modules/system/theme-management/constant.ts:1` is `export const LIST_QUERY_STALE_TIME_MS = 60_000 as const;`.
  - `docs/reports/2026-10-20-staletime-backfill.md` says "constant exists at `constant.ts:3`". The current file has it at line 1, because a later refactor commit moved things (`31aece3d`). Treat the report's line number as stale. `[EV]`
  - Used at `theme.query-keys.ts:2,41,61` and `topic.query-keys.ts:2,48,78`.
  - Rule: `03-api-service.md` says paginated list queries SHOULD set `staleTime` in 30 s to 5 min, using a module-owned constant, with no global default.
  - A promotion module would need its own constant, because importing `system/theme-management/constant.ts` would be a cross-module import (`01-architecture.md` says avoid it).
- **Mutation hook template.** `topic/hooks/topic.queries.hook.ts` imports `useMutation, useQuery, useQueryClient` and the `topicQueryKeys` factory. Per the staletime report, invalidation uses the prefix methods `lists()` and `historyById`.
- **Backend error contract.** `{code, message, details}` and CRUD semantics (409 version conflict, delete, status toggle) are `NEEDS-VERIFICATION`. Frontend code cannot establish them.

## 7. Type/Data Flow

- **DTO naming.** `02-typescript.md`: `CreateXRequest`, `UpdateXRequest`, `XResponse`, `XPageResponse`, `XFormValues`. Theme and topic follow it (`CreateThemeRequest`, `ThemePagedResponse`).
- **Enums.** No application `enum`. Use `as const` objects with derived unions, as in `theme-management/constant.ts:3-10` (`TopicStatus`). A two-state `ACTIVE`/`INACTIVE` status fits this.
- **Runtime validation.** For stable CRUD, typed DTOs are the default. Do not add response Zod schemas (`03-api-service.md`). Only `requireThemeApiResponse` null-guarding exists as a lightweight precedent.
- **Ambient types.** Do not add the model to `src/types/*.d.ts`. The existing ambient `ProductPromotion` types are different concepts.

## 8. Form Flow

- **Standard.** AntD `Form`/`FormInstance` is the sole state owner. Feature-owned Zod schema, explicit `safeParseAsync`, and Zod issues mapped into `form.setFields`. See `TopicForm/index.tsx:106-190`. `[EV]` Zod is installed (4.6.5 per `CLAUDE.md`). Theme and Topic use no `zodResolver`.
- **Schemas.** Live in `topic/schemas/topic-form.schema.ts` and `theme/schemas/theme-form.schema.ts`. `[EV]` (file list.)
- **Dirty and discard.** See Q24.
- **Create and edit.**
  - `TopicForm` takes `mode: 'create' | 'edit'`, `defaultValues`, and an `initialDirtySnapshot`-style comparison (`:100-104`).
  - On cancel in edit mode with no changes it navigates immediately (`:182-185`).
- **Q25. Digits-only input with max length.**
  - Best fit is `src/components/input.tsx`. With `isPhoneNumber`, `handleChange` strips non-digits and calls `onChange(inputValue)` with a string (`:58-64`).
  - It spreads `...props` into AntD `Input`, so `maxLength` passes through (`:148`). `TopicNameField` uses `maxLength={30}` (`TopicForm/index.tsx:313`).
  - Used for phone number at `users/operator/user-operator-list/edit/edit-user-operator.tsx:355` and `create/create-user-operator.tsx:353`.
  - Caveats: its `value` prop is typed `string | number`, and `onChange` is typed `(value: number | string) => void`. It is not named for general numeric codes, and the flag `isPhoneNumber` is semantically a phone flag. Using it for a promotion code is a reuse-vs-misnomer call. `NEEDS-VERIFICATION` (depends on whether the code field is digits-only).
  - Alternative: `isNumber` mode (`:81-107`) formats thousands with `formatNumber` and returns a number. That is wrong for a code.
  - AntD `InputNumber` appears only in module-local use, for example `product-labels/credit-card/components/CardRuleConfigCard.tsx:216-235` with a `.`-grouping formatter and parser. There is no max-length support.
- **Reuse checkpoint (`00-general.md`).**
  - Candidates already used by Topic: `@/components/input`, `@/components/switch`, `@/components/date-picker`, `@/components/modal-content`, `@/hooks/modal.hook`.
  - A status control should reuse `@/components/switch` (used by `TopicEnabledField`) rather than a new toggle.

## 9. Routing & Permission Flow — HIGH-RISK

Every routing, authentication or permission change is `HIGH-RISK` (`06-routing-permission.md`).

### Q14. Route file metrics

- `src/routes/index.tsx` is 2093 lines (`wc -l`).
- `<Route>` elements: 178 using `grep -oE "<Route($|[ >/])"` (the snapshot's 176 and 2069 lines are stale).
- Lazy pages: 20 lines matching `= lazy(` (5 splash-screen, 5 topic, 4 theme, 1 theme-lock, 4 popup, 1 `ProductLabelsRouteGate`).
- Eager module imports: 138 `import ... from '@/modules` lines. This includes a few non-page imports such as `ThemeConfigurationRedirect`. The eager figure is approximate.
- Layout split: MainLayout parent at `:306` (list pages) and BasicLayout parent at `:818` (create, view, edit). `:2087` is the `*` to `/404` redirect.

### Q15. Template: a complete lazy route

`src/routes/index.tsx:686-695`:

```tsx
<Route
  path={PageURLs.ofThemeList()}
  element={
    <WithGuard
      Page={ThemeListPage}
      Guard={AuthGuard}
      permissions={[PERMISSIONS.THEME_VIEW]}
    />
  }
/>
```

The page is declared at `:240-242` as `const ThemeListPage = lazy(() => import('@/modules/system/theme-management/theme/views/ThemeListPage'));`. `WithGuard` renders `<Guard><RouteSuspense><Page/></RouteSuspense></Guard>` (`src/guards/index.tsx:40-` onward), so the `WithGuard -> AuthGuard -> RouteSuspense -> lazy page` hierarchy holds. `AuthGuard` also wraps children in `RouteSuspense` (`auth.guard.tsx`, `return <RouteSuspense>{children}</RouteSuspense>`). So `RouteSuspense` nests twice. That is harmless and existing. `[INF]`

### Q16. Path collisions

A grep of `src/routes/index.tsx` for `promotion|offer|promotion-type` finds only `card-gift-offer` (`:421,910,923,936`) and `attractive-offer` (`:1225,1235`). No path starting `product/parameter/promotion` exists. No duplicate. Existing duplicates in the file (for example `group-document-list` declared twice at `:526` and `:536`) are unrelated. `[EV]`

### Q17. `PageURLs` shape

`src/utils/navigate.ts`:

```ts
export function withPrefix(path: string) { return path; }
export namespace PageURLs {
  export function ofCardGiftOffer() { return withPrefix('/product/configuration/card-gift-offer'); }
  export function ofCardGiftOfferEdit(id: number | string) { return withPrefix(`/product/configuration/card-gift-offer/edit/${id}`); }
  export function ofProductFeeList() { return withPrefix('/product/parameter/product-fee-list'); }
  ...
}
```

- It is a TypeScript `namespace` of `export function of<Name>(...)` builders.
- `export function of` count is 102 (`grep -c`). `CLAUDE.md` says 100.
- Theme builders at `navigate.ts:259-297`. They take `id: number | string`.
- Note: `navigate.ts:1` imports a type from the product-labels module. That is existing.
- Route declarations mix `PageURLs.ofThemeList()` (theme) with `withPrefix('product/...')` literals (most legacy routes). The theme-style `path={PageURLs.xxx()}` is the target.

### Q18. Permission constants

- A grep of `permission.constant.ts` (306 lines) for `PROMOTION`, `OFFER`, `ATTRACTIVE`, `CARD_GIFT`:
  - `:125` is `PRODUCT_ATTRACTIVE_OFFER_VIEW: 'product_attractive_offer:view'`.
  - `:126` is `PRODUCT_ATTRACTIVE_OFFER_EDIT: 'product_attractive_offer:edit'`.
  - `:157` is `CARD_GIFT_OFFER_VIEW: 'product_card_gift:view'`.
  - `:158` is `CARD_GIFT_OFFER_EDIT: 'product_card_gift:edit'`.
  - `PROMOTION*` has zero hits. No `promotion_management` string exists.
- **Value format.** Lowercase snake_case `resource:action[:variant]` (`'product_fee:edit:cash_loan'`, `'theme_category:view'`, `'theme:create'`, `'document_group:view'`). Actions seen are `view`, `create`, `edit`, `delete`, `export_csv`. Constant names are UPPER_SNAKE `<RESOURCE>_<ACTION>`, with comment headers in Vietnamese.
- **A plausible fit:** `PROMOTION_MANAGEMENT_VIEW: 'promotion_management:view'`, `..._CREATE`, `..._EDIT`.
- **Naming and values: `NEEDS-TEAM-DECISION` until BE roles are confirmed.** Do not invent strings. `[INF]` Frontend permission strings must match the role strings the BE issues; the FE cannot verify this.

### Q19. `WithGuard` unauthorised behaviour

`src/guards/index.tsx:53-61`:

```ts
const hasPermission = permissions.some((permission) =>
  userPermissions?.includes(permission)
);
if (!hasPermission) {
  navigate(PageURLs.of404(), { replace: true });
}
```

- It redirects to `/404` (`navigate.ts:428-430`) with `replace`. There is no 403 page.
- The redirect runs inside a `useEffect`. The component still renders `<Guard><RouteSuspense><Page/></RouteSuspense></Guard>` on the first pass. `[INF]` The page can mount for one frame before the redirect. The page's own `useQuery` could fire a request before the redirect. Whether it does is `NEEDS-VERIFICATION`.
- Empty `permissions` skips the check.
- It also strips a trailing slash (`:46-49`).

### Q20. `useHasPermission`

`src/hooks/auth.hook.ts:19-39`:

```ts
const check = (permissions: string[], mode: "some" | "every" = "some"): boolean => {
  if (!userPermissions) return false;
  ...
  if (mode === "every") return perms.every(...);
  return perms.some(...);
};
return { hasPermission: check };
```

- Default is OR (`some`). `"every"` gives AND.
- `requireAll` exists only on `ThemePermissionGate.tsx:9,19` (maps to `'every'`). No route uses it. OR semantics must be preserved.
- Call style: `const { hasPermission } = useHasPermission(); hasPermission([PERMISSIONS.THEME_CREATE])` (`ThemeListPage/index.tsx:15-16`). It is used in 105 files.
- `WithGuard` itself is OR-only (`permissions.some`).

### Q21. Menu entry template

`src/helpers/menus.helper.ts`. The "Tham số sản phẩm" group (`:264-324`) is `{ label: t('Menu.productParameters'), iconType: 'folder', key: 'product-parameters', link: PageURLs.ofGroupDocumentList(), children: [...] }`. A child entry, `:277-282` region:

```ts
{
  label: t('Menu.documentGroup'),
  key: PageURLs.ofGroupDocumentList(),
  link: PageURLs.ofGroupDocumentList(),
  requiredPermissions: [PERMISSIONS.DOCUMENT_GROUP_VIEW]
},
```

- Multi-permission example (`requiredPermissions` is an array, OR by position):

```ts
requiredPermissions: [
  PERMISSIONS.DOCUMENT_SET_VIEW_CREDIT_CARD,
  PERMISSIONS.DOCUMENT_SET_VIEW_CASH_LOAN
]
```

- The attractive-offer entry is at `:243-248`, under `Menu.productIssuance` (`:232`).
- The parent group's `link` is the first child's URL (`PageURLs.ofGroupDocumentList()`). Whether the parent's `link` must change if the new entry is placed first is `NEEDS-VERIFICATION`. Appending a child leaves it as is.
- Menu labels live in `Menu.*` and are owned by `menus.helper.ts` (`11-i18n.md`). One entry under `Menu.*` needs both lang files. Note `Menu` has 15 vi-only keys already (see Q27).
- Menu visibility and route access are separate registries. Both must use the same constants.

### 8-point route audit (`06-routing-permission.md`), per-point findings for the proposed feature

- [ ] **1. `src/routes/index.tsx` path, layout, page, guard, permission list.**
  - Nothing exists today.
  - Add a lazy page declaration near `:221-279` and routes in the MainLayout block (list, near the `product/parameter/*` list routes at `:463-574`) and the BasicLayout block (create, view/:id, edit/:id, near `:1383-1650`).
  - Use `WithGuard Page=... Guard={AuthGuard} permissions={[...]}`.
  - Path prefix depends on the module-location decision. `NEEDS-TEAM-DECISION`.
  - If a Drawer is chosen for create/edit, only a list route is needed. Drawer vs page: `NEEDS-TEAM-DECISION`.
  - Do not add an eager import. Do not copy `ProductLabelsRouteGate`.
- [ ] **2. `PageURLs`.**
  - Add builders in `navigate.ts`, for example list, create and edit/view as needed. Existing naming is `of<Feature>`, `of<Feature>Create`, `of<Feature>Edit(id)`, `of<Feature>View(id)` (`ofCardGiftOffer*` at `:149-163`, `ofTheme*` at `:259-297`).
  - Use these builders in routes, menu and navigation, not literals.
- [ ] **3. `menus.helper.ts`.**
  - Add one child entry, shape in Q21. Placement is under `Menu.productParameters` if the location decision follows the swagger.
  - Requires a `Menu.<key>` label added to both `vi.json` and `en.json`.
  - Because `Menu` already has 15 vi-only keys, a one-sided add would render the Vietnamese fallback silently.
- [ ] **4. `permission.constant.ts` identifiers.**
  - Add VIEW/CREATE/EDIT, plus DELETE or STATUS only if the BE has those roles.
  - Names and values: `NEEDS-TEAM-DECISION` until BE roles are confirmed.
  - No hardcoded strings in routes or components.
- [ ] **5. Guards.**
  - `WithGuard` redirects to `/404` on missing permission (Q19). `AuthGuard` redirects to login when logged out and handles `pathname === '/'`.
  - No change to the guards is required.
  - `NonLoginGuard` is not relevant.
- [ ] **6. Action visibility with `useHasPermission`.**
  - Gate create/edit/status/delete buttons with `hasPermission([PERMISSIONS.X])`, as in `ThemeListPage/index.tsx:15-16` (`canCreate`).
  - Frontend guards are not a security boundary.
- [ ] **7. Redirects, breadcrumbs, params, relative navigation.**
  - Edit/view routes with `:id` need an id parse and invalid-id handling. Topic detail guards with `enabled: Number.isFinite(id)` (`topic.query-keys.ts:66`) and theme with `Number.isSafeInteger(id) && id > 0` (`theme.query-keys.ts:49`). Prefer the stricter theme form.
  - Cancel and success navigation should use the `PageURLs` builders.
  - If a Drawer is URL-synced, query params must be handled. Drawer URL-sync: `NEEDS-TEAM-DECISION`.
  - No existing Drawer is URL-synced (Q23).
  - I did not inspect breadcrumb configuration (`src/components/breadcrumbs.tsx`). `NEEDS-VERIFICATION` whether breadcrumbs need a registry entry.
- [ ] **8. Direct link, refresh, missing `location.state`, trailing slash, unauthorised.**
  - Trailing slash: handled by `WithGuard` (`:46-49`).
  - Unauthorised: `/404` via effect (Q19).
  - Missing `location.state`: the page must load detail from `:id` through a query, with no reliance on router state.
  - Refresh: Query refetches. Not runtime-verified.
  - Auth reload: `permissions` come from the Redux `auth` slice. If the store is not hydrated yet on a hard refresh, `WithGuard` could redirect to `/404` before permissions load. `userPermissions?.includes` returns undefined, so `some` is false. `NEEDS-VERIFICATION` how existing screens avoid this.

## 10. Dependencies & Consumers

- **Direct consumers of what must change:** `src/routes/index.tsx`, `src/utils/navigate.ts`, `src/helpers/menus.helper.ts`, `src/constants/permission.constant.ts`, `src/lang/vi.json`, `src/lang/en.json`.
- **Indirect.** `PERMISSIONS` is imported across the app (211 `useHasPermission` matches in 105 files, plus route and menu). Adding keys is additive.
- **Cross-domain.** `StatusBadge` is used by `src/components/customer/customer-card-type.tsx:3-4,48`. `ProductLabelStatusBadge` is a separate product-label component at `product-labels/shared/StatusBadge.tsx`.
- **Unknown/dynamic.** `t(variable)` key lookups cannot be fully enumerated, per `11-i18n.md`.

## 11. Pattern Classification

| Pattern | Class |
|---|---|
| TanStack Query + `queryKeys/` factory with `queryOptions` + `services/` + `ApiFetcher` | target-compatible |
| `splash-screen` object-style service with keys-only factory | legacy-compatible (explicitly allowed in rule 03) |
| Redux slice + listener (`contents/popup`, most products) | legacy-compatible |
| AntD `Form` + feature Zod schema + explicit `safeParseAsync` + `setFields` mapping | target-compatible |
| Topic `schemas/` folder (not in the enumerated folder list) | uncertain (implemented but not enumerated) |
| Module-level inline `useState(1)` page with `page - 1` | target-compatible (used in Query-owned modules) |
| `PAGINATION.currentPage - 1` Redux convention | legacy-compatible |
| `useModal().openModal(<ModalContent .../>)` for discard | target-compatible (used by Topic/Theme) |
| `Skeleton` for detail loading (splash-screen, theme-lock) | target-compatible per `07-component.md` |
| `Spin` for detail loading (`DetailLoadingState`) | uncertain: `DetailLoadingState` exists in theme-management; the snapshot says `07-component.md` prefers Skeleton for edit-field loading |
| Emotion `css` in `ThemeListPage/index.tsx` (`cardStyles`) | legacy-compatible; new components in that tree use `*.module.scss` |
| SCSS Modules per component | target-compatible (`10-styling.md`) |
| Eager page import | legacy-compatible; do not use for new routes |
| `WithGuard -> AuthGuard -> RouteSuspense -> lazy` | target-compatible |
| `ProductLabelsRouteGate` | legacy exception, do not copy |

## 12. Risk Classification

- Whole feature: `HIGH-RISK`, because it adds a route, permission constants and a menu entry. These touch shared central registries.
- Module-internal files (service, types, queryKeys, hooks, views, components): `MODERATE`, an isolated new API operation set.
- i18n additions: `SAFE` for a new module container; `Menu.*` additions are `HIGH-RISK` per `11-i18n.md` (touching `Menu.*`).
- `NEEDS-TEAM-DECISION` items (unresolved):
  1. Module location (promotion-management vs parameter vs other).
  2. State owner (Query vs Redux).
  3. Drawer vs full page for create/edit.
  4. URL-sync of the drawer, if used.
  5. Permission constant names and values, until BE roles are confirmed.
  6. i18n container: new top-level container `PromotionManagement.*` vs a sub-scope of an existing container (see Q28).
  7. Ownership of the API error-envelope mapper (feature-local vs shared).

## 13. Regression Surface

- Route and deep link: list, create, view, edit with `:id`, refresh, trailing slash.
- Permission and menu visibility: users with and without each role, and the 404 redirect.
- Create, edit, view, and status toggle (if any), including version-conflict handling (if the BE sends versions, `NEEDS-VERIFICATION`).
- Validation failure from FE (Zod) and from BE (`details[]` mapping).
- Pagination: page 1 shown while the BE is 0-based; filter change resets to page 1; page-size change.
- Empty, loading and error states. Skeleton for detail.
- Unsaved-changes discard confirm.
- Shared consumers: `PERMISSIONS`, `PageURLs`, `menus.helper`, lang files. Verify no other menu entry or route changed. `docs/modules/products/OVERVIEW.md` should be updated if the feature is added (rule in `CLAUDE.md`).
- Not runtime-verified: browser, auth, MSAL, permissions, backend integration.

## 14. Recommended Change Boundary

Smallest safe boundary, subject to the open decisions:
- Module-internal: a new feature folder holding service, types, query keys, hooks, schema, views and components.
- Outside-module central files, additive only: `routes/index.tsx` (lazy declarations plus routes), `navigate.ts` (builders), `permission.constant.ts` (constants), `menus.helper.ts` (one entry), `vi.json` and `en.json`.
- Preserve:
  - `ApiFetcher` untouched.
  - OR permission semantics.
  - `WithGuard` as is.
  - Existing route order and the duplicate-route status quo.
  - `Menu.*` keys outside the touched scope.
- Do not touch: `attractive-offer`, `card-gift-offer`, `parameter/*`, theme-management, `query.provider.tsx`, `ApiFetcher`.
- Do not import `LIST_QUERY_STALE_TIME_MS` from theme-management. Create a module-owned constant.

### Q22–Q26 component and pattern answers

- **Q22. `StatusBadge`.**
  - File: `src/components/status-badge/index.tsx`. Props: `{ label: string; variant: StatusBadgeVariant; className?: string }`.
  - Variants: `'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent'`.
  - SCSS `status-badge.module.scss`: `.badge` is a pill (`border-radius: 10rem`, `font-size: 1rem`, weight 600). Variants map to CSS vars, for example `.success { color: var(--green-color); background-color: var(--soft-green-color); }` and `.neutral { color: var(--gray-color); background-color: var(--light-white-color); }`.
  - Yes, it can render a two-state badge as is: the caller passes `label` and chooses `success` (active) or `neutral` (inactive). The label text and the mapping from status to variant belong to the feature. `error` and `accent` share the same pink style.
  - Existing consumer: `customer-card-type.tsx` only. `[INF]` No ACTIVE/INACTIVE precedent uses it.
  - Alternative in-module look: theme-management's `chip-tag.module.scss` (module-owned, not for reuse).
- **Q23. AntD `Drawer` usages.** All three are read-only, state-controlled (not URL-synced) and have no `footer` prop.

| File | Width | Footer | URL-synced |
|---|---|---|---|
| `products/configuration/scheme-sync/comparison-drawer.tsx:95` | `600` | none | no (`open={Boolean(row)}`, state from `page.tsx`; `page.tsx:140,149` use `useSearchParams` only for the `group` filter) |
| `products/configuration/list-product/shared/history/history-comparison-drawer.tsx:43` | `'min(760px, 100vw)'` | none | no |
| `products/configuration/product-labels/shared/MobilePreviewDrawer.tsx:19` | `500` | none | no (`mobileDrawerVisible` state at `product-labels/index.tsx:43`) |

  - No editable-form Drawer exists. The nearest template is `MobilePreviewDrawer` (clean props: `open`, `onClose`, `title`), but there is no Drawer-with-form precedent in the repo. All three use `destroyOnClose` and `placement='right'`.
  - A Drawer vs page decision is `NEEDS-TEAM-DECISION`. Evidence: every existing create/edit flow is a routed page (BasicLayout `create`/`view/:id`/`edit/:id`).
- **Q24. Unsaved-changes confirm.**
  - There is no `themeTopicDiscard` key or identifier. The equivalents are `ThemeManagement.common.discardTitle/discardDescription/discardCancel/discardConfirm` (`vi.json` around lines 361-365) and `ThemeManagement.themeLock.confirm.*` (about `:609-615`).
  - `Modal.confirm` appears only in `src/components/Header.tsx:77` (`modal.confirm`).
  - Best pattern: `TopicForm/index.tsx:178-198`, which opens a `ModalContent` through `useModal().openModal(...)`. For a clean (not dirty) edit it navigates straight away. `ThemeLockPage/index.tsx:255-272` is the same pattern.
  - Also existing: a route-level exit guard at `src/components/forms/change-form-provider/use-change-form-exit-guard.tsx` (`onDiscard`, `beforeunload` at `:211-220`) wrapped by `change-form-provider.tsx`. That is the legacy `FormLayout`-family guard. Whether it fits a Query-owned form is `NEEDS-VERIFICATION`.
- **Q25.** See Section 8.
- **Q26. `Skeleton` in splash-screen.**
  - `src/modules/system/splash-screen/view/general.tsx:48-52`: when `isLoading`, it returns `<FormWrapper><Skeleton active paragraph={{ rows: 6 }} /></FormWrapper>`. If `!detail`, it renders an `Alert` for `isError`.
  - The edit and create `general.tsx` follow the same shape. `view/history.tsx:106` uses `<Skeleton active paragraph={{ rows: 4 }} />`.
  - Also `theme-lock/views/ThemeLockPage/index.tsx:423` uses `rows: 6`.
  - `DetailLoadingState` in theme-management uses a `Spin` (`components/DetailLoadingState/index.tsx`).
  - A pre-existing note in `CLAUDE.md` says no `Skeleton` is page-level or edit-field. Whether a form Skeleton is allowed for edit-field loading is governed by `07-component.md`. I did not re-read that clause. `NEEDS-VERIFICATION`.

## 15. Unknowns / Needs Verification (Not verified list)

1. Backend contract: endpoints under `promotion-types`, HTTP methods, page response shape (`pageInfo`/`items`?), error envelope, status values, delete or soft-deactivate semantics, uniqueness errors, version/optimistic locking.
2. BE role strings. No `promotion_management:*` constant exists, and the roles are not verified.
3. Whether promotion types relate to product-level promotions (`ProductPromotion`, `product-groups/${id}/promotions`), `attractive-offer`, or `marketing_option`/`MARKETING_GROUP`. Zero FE hits for the last two.
4. Whether `VITE_API_HOST` has the same shape in every deployed environment (checked locally via booleans only).
5. How the Redux `auth` permissions load on hard refresh versus the `WithGuard` redirect timing.
6. Whether the page's queries can fire before the `/404` redirect.
7. Whether the parent menu group `link` needs change if the new child is placed first.
8. Breadcrumb registry needs (not inspected).
9. `07-component.md` clauses on Skeleton/Spin and `ARCHITECTURE.md`/`04-state-management.md` details were not fully re-read; relied on `CLAUDE.md` snapshot and rule 03.
10. `05-form.md` was not read in full. Form conclusions rely on `CLAUDE.md`, rule 01 and the Topic source.
11. `10-styling.md` and `docs/modules/products/*` submodule docs were not read beyond `OVERVIEW.md` and `card-gift-offers.md`.
12. Whether `use-change-form-exit-guard` is usable outside `FormLayout`.
13. Menu parity gap detail: 15 `Menu.*` keys are vi-only (see Q27). Whether intended is unknown.
14. Runtime behavior of everything: nothing was run (`typecheck`, `lint`, `build`, browser).
15. `.agents/*` briefs: not looked up. Source and module docs were used.
16. Statistics in `CLAUDE.md` and `OVERVIEW.md` are stale versus current source (routes 2093 vs 2069, `PageURLs` 102 vs 100, products files 392 vs 383/312).

## 16. Handoff for Implementation

### Q27–Q29 i18n answers

- **Q27.** Computed with `scratchpad/i18n.js`.
  - Top-level keys: `vi.json` 309, `en.json` 188.
  - Leaf keys: vi 731, en 455. Vi-only leaves: 278. En-only leaves: 2.
  - Vi-only by top-level key (largest): `Form` 101, `Table` 27, `Menu` 15, `Searcher` 15, then many one-off flat keys (`generalInfo`, `noDataText`, `phoneNumber`, and others).
  - `ThemeManagement` has 0 vi-only and 0 en-only leaves.
  - Fallback is `vi` (`11-i18n.md`), so English gaps render silently.
  - The key containers in `vi.json` are `Menu`, `Searcher`, `Table`, `Form`, `ThemeManagement`.
- **Q28. `ThemeManagement.*` first two levels.**
  - `common`: 8 leaves (`discardTitle`, `discardDescription`, `discardCancel`, `discardConfirm`, `displayStatusInactive`, `displayStatusUpcoming`, `displayStatusOngoing`, `displayStatusEnded`).
  - `theme`: about 100 flat camelCase leaves (`createTitle`, `viewTitle`, `code`, `name`, `nameRequired`, `createSuccess`, `listEmpty`, `historyEmpty`, ...).
  - `topic`: about 80 flat camelCase leaves.
  - `themeLock`: grouped sub-scopes, not flat: `entry` 1, `header` 3, `column` 3, `field` 4, `action` 3, `picker` 6, `validation` 6, `message` 8, `confirm` 8, `empty` 4, `footer` 2, `error` 1.
  - **Template note.** `11-i18n.md` prefers role groups (`page`, `header`, `column`, `field`, `action`, `validation`, `message`, `confirm`, `empty`, `error`). `theme` and `topic` are flat and `themeLock` follows the grouped form. A new module should use the grouped form (the newest and rule-aligned).
  - Container choice: `PromotionManagement` top-level with `promotionType.*` sub-scope and `common.*` (the rule's default, mirroring `ThemeManagement.theme.*`) vs a separate container. `NEEDS-TEAM-DECISION`, and it depends on the module-location outcome.
- **Q29. Collisions.**
  - Both files (case-insensitive over flattened keys) match only `Menu.attractiveOffer`: vi "Ưu đãi hấp dẫn khác", en "Other attractive offers".
  - There is no `offer`, `cardGift` or `promotion` key.
  - `PromotionManagement` is absent as a top-level key in both files.
  - A new menu label (for example `Menu.promotionType`) would not collide. The exact key name is not decided.
  - Remember the `11-i18n.md` required checks: identical key sets in vi and en for the touched namespace, preserved placeholders, and a statement that these prove nothing about rendered labels.

### Evidence-backed boundary and files

**Proposed files for `src/modules/products/promotion-management/promotion-type/`.** The location itself is `NEEDS-TEAM-DECISION` (a `parameter/promotion-type/` alternative would use the same inner structure). Inner folders follow the Theme/Topic convention, but that convention is scoped to Theme/Topic; for products it is a proposal, not a mandate (`03-api-service.md`, "folder mandate is not widened").

| Path | One-line responsibility |
|---|---|
| `views/PromotionTypeListPage/index.tsx` | Lazy list route page (default export), header with count and a permission-gated create button |
| `views/PromotionTypeCreatePage/index.tsx` | Create route page (only if page-based, not Drawer) |
| `views/PromotionTypeViewPage/index.tsx` and `styles.module.scss` | Read-only detail page with Skeleton loading |
| `views/PromotionTypeEditPage/index.tsx` | Edit route page loading detail by `:id` |
| `components/PromotionTypeTableSection/index.tsx` and `styles.module.scss` | Table, search/filter, page state (1-based UI, `page - 1` to API), `CustomPagination` |
| `components/PromotionTypeForm/index.tsx` and `styles.module.scss` | AntD form, explicit Zod validation, field-error mapping, dirty tracking and discard confirm through `useModal` and `ModalContent` |
| `queryKeys/promotion-type.query-keys.ts` | `promotionTypeQueryKeys` factory: plain prefix methods and `queryOptions` for list, detail (`keepPreviousData`, module `staleTime`) |
| `services/promotion-type.service.ts` | `const ENDPOINT = 'api/admin/portal/v1/promotion-types'` plus typed get/list/create/update/status (and delete if the BE has it), forwarding `AbortSignal`, with no React or UI imports |
| `hooks/promotion-type.queries.hook.ts` | Mutation hooks and cache sync (`setQueryData` detail, `invalidateQueries` on `lists()`); one notification owner |
| `types/promotion-type.types.ts` | `CreatePromotionTypeRequest`, `UpdatePromotionTypeRequest`, `PromotionTypeResponse`, `PromotionTypePagedResponse`, list params, status `as const` plus derived union (no `enum`) |
| `schemas/promotion-type-form.schema.ts` | Feature-owned Zod schema (a folder Theme/Topic use but the rule list omits; optional) |
| `utils/promotion-type-api.error.ts` | Error-envelope reader and `details[{field,message}]` to AntD `setFields` mapper (ownership `NEEDS-TEAM-DECISION`) |
| `utils/promotion-type-zod-antd-validation.helper.ts` | Zod issue to AntD field/form errors (modeled on `topic-zod-antd-validation.helper.ts`, with its field set specific to this form) |
| `utils/promotion-type-form-mapper.helper.ts` | Only if form shape differs from the DTO |
| `constant.ts` (module root) | Module-owned `LIST_QUERY_STALE_TIME_MS` (30 s to 5 min), plus status/option constants |

Only add folders the feature needs. Drop `views/PromotionTypeCreatePage` and edit page if a Drawer is chosen.

**Outside-module files to touch**

| File | Responsibility |
|---|---|
| `src/routes/index.tsx` | Add `lazy()` page declarations near `:221-279` and guarded routes, with `WithGuard -> AuthGuard` and permission arrays, in the MainLayout block (list) and the BasicLayout block (create/view/edit); check for duplicates first |
| `src/utils/navigate.ts` | Add `PageURLs.of<PromotionType>*` builders |
| `src/constants/permission.constant.ts` | Add promotion-type VIEW/CREATE/EDIT constants after the `NEEDS-TEAM-DECISION` on names and values |
| `src/helpers/menus.helper.ts` | Add one menu child with `requiredPermissions` using the same constants |
| `src/lang/vi.json` | Menu label and module namespace keys |
| `src/lang/en.json` | Same key set, identical placeholders (English gaps are otherwise silent) |
| `docs/modules/products/OVERVIEW.md` | Update the submodule inventory (required by `CLAUDE.md` for products changes) |

**Preserved contracts**
- `ApiFetcher` is unchanged. URLs must not start with `/` and must omit the host.
- `WithGuard` OR semantics and the 404 redirect.
- Existing `attractive-offer` and `card-gift-offer` routes and constants.
- `Menu.*` keys not touched.

**Validation scenarios**
- Direct link and refresh on list, create, edit and view.
- Unauthorised user: 404 redirect, hidden menu, hidden buttons.
- Trailing slash.
- Pagination (BE 0-based).
- BE validation error mapped onto the correct field.
- Dirty-form discard.
- Both locales.
- Run `npm run typecheck`, `npm run lint`, `npm run prettier`, `npm run build`. These do not prove runtime behavior.

**Unresolved questions (all `NEEDS-TEAM-DECISION` unless noted)**
1. Module location.
2. State owner.
3. Drawer vs page for create/edit.
4. URL-sync of the Drawer, if used.
5. Permission constant names and values, plus BE role confirmation (`NEEDS-VERIFICATION`).
6. i18n container vs sub-scope.
7. Error-envelope mapper ownership.
8. Backend contract details (`NEEDS-VERIFICATION`).