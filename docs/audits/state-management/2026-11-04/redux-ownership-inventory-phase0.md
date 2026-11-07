# Redux Ownership Inventory (Phase 0)

## 1. Scope, Branch & Revision

- Branch: `develop`
- HEAD: `129f2a1a`
- Date: 2026-11-04
- Scope: mechanical, evidence-only inventory of registered Redux slices. No migration viability classification, no deprecation labels, no recommendations.
- Performer note: this task was originally meant to be delegated to a subagent named `codebase-analyzer`, but that agent type does not exist in this environment. The investigation was performed by a general-purpose agent instead, per the fallback instruction in the original task.
- Method: shell counting (grep/wc) and file reads against current source. Counts written in `.claude/PROJECT_CONTEXT.md` / `CLAUDE.md` were not used as inputs.
- Working tree was clean at start; only this report file was written. No `src/` file was modified.

## 2. Registration Counts (slices, middleware)

CONFIRMED (counted in source):

- `src/redux/slices.ts`: 40 imports and 40 entries in the exported `slices` array.
  - 39 slice files in `src/redux/slices/*.slice.ts` plus 1 slice at `src/modules/system/maintenance/stores/redux/slices/system-maintenance.slice.ts`.
- `src/redux/store.ts`: 33 `configure*Middleware` entries passed to `configureMiddlewares([...])`.
  - 32 live in `src/redux/middlewares/*.middleware.ts`; 1 (`system-maintenance.middleware.ts`) lives under `src/modules/system/maintenance/stores/redux/middlewares/`.
  - `src/redux/middlewares/config.ts` is a helper, not a middleware.
- `src/redux/middlewares/notification.middleware.ts` listens on both `notification` and `notification-list` slices; `simulation.middleware.ts` also imports `card-package`; `group-permisson.middleware.ts` also imports `staff`; `affiliate-partner.middleware.ts` also imports `account-access`.
- 40 slices registered vs 33 middleware registered.
  - Slices with no middleware reference at all: address, app, auth, card-package, layout, query.
  - `notification` and `notification-list` slices are both served by the single `notification.middleware.ts`.
- `appSlice` is registered in `slices.ts` but 0 importer files under `src/modules` were found for it.

## 3. Slice Table (file, lines, middleware, thunks, endpoints)

Counting rules (CONFIRMED method): lines via `wc -l`; thunks = occurrences of `createAsyncThunk` (0 everywhere) and of `create.asyncThunk` (all slices use the latter); endpoints = distinct strings matching `api/admin/portal/v1/[^`'"]*` inside the slice file (template strings with `${}` are distinct strings, so counts reflect literal count, not distinct resource count). Endpoints held in imported constants or imported services are not counted (see section 11).

| Slice file | Lines | Middleware file | createAsyncThunk / create.asyncThunk | Distinct endpoint literals |
|---|---|---|---|---|
| `src/redux/slices/account-access.slice.ts` | 229 | `src/redux/middlewares/access-account.middleware.ts` (119 lines; navigate refs=0) | 0 / 6 | 6 |
| `src/redux/slices/address.slice.ts` | 164 | none | 0 / 5 | 5 |
| `src/redux/slices/administrative-unit.slice.ts` | 422 | `src/redux/middlewares/administrative-unit.middleware.ts` (95 lines; navigate refs=0) | 0 / 10 | 1 |
| `src/redux/slices/affiliate-partner.slice.ts` | 196 | `src/redux/middlewares/affiliate-partner.middleware.ts` (146 lines; navigate refs=5) | 0 / 6 | 5 |
| `src/redux/slices/app.slice.ts` | 53 | none | 0 / 0 | 0 |
| `src/redux/slices/auth.slice.ts` | 224 | none | 0 / 5 | 2 |
| `src/redux/slices/banner.slice.ts` | 442 | `src/redux/middlewares/banner.middleware.ts` (163 lines; navigate refs=5) | 0 / 13 | 10 |
| `src/redux/slices/card-management.slice.ts` | 225 | `src/redux/middlewares/card-management.middleware.ts` (136 lines; navigate refs=5) | 0 / 7 | 4 |
| `src/redux/slices/card-package.slice.ts` | 126 | none | 0 / 2 | 0 |
| `src/redux/slices/common.slice.ts` | 983 | `src/redux/middlewares/common.middleware.ts` (259 lines; navigate refs=0) | 0 / 20 | 19 |
| `src/redux/slices/contract.slice.ts` | 122 | `src/redux/middlewares/contract.middleware.ts` (50 lines; navigate refs=0) | 0 / 3 | 3 |
| `src/redux/slices/contract-template.slice.ts` | 521 | `src/redux/middlewares/contract-template.middleware.ts` (384 lines; navigate refs=10) | 0 / 17 | 14 |
| `src/redux/slices/customer.slice.ts` | 321 | `src/redux/middlewares/customer.middleware.ts` (119 lines; navigate refs=0) | 0 / 8 | 9 |
| `src/redux/slices/ekyc-config.slice.ts` | 179 | `src/redux/middlewares/ekyc-config.middleware.ts` (82 lines; navigate refs=4) | 0 / 5 | 5 |
| `src/redux/slices/fee-definition.slice.ts` | 318 | `src/redux/middlewares/product-fee-list.middleware.ts` (231 lines; navigate refs=5) | 0 / 10 | 9 |
| `src/redux/slices/group-permission.slice.ts` | 214 | `src/redux/middlewares/group-permisson.middleware.ts` (158 lines; navigate refs=5) | 0 / 7 | 6 |
| `src/redux/slices/layout.slice.ts` | 35 | none | 0 / 0 | 0 |
| `src/redux/slices/loan-order.slice.ts` | 395 | `src/redux/middlewares/loan-order.middleware.ts` (353 lines; navigate refs=0) | 0 / 13 | 13 |
| `src/redux/slices/notification.slice.ts` | 35 | `src/redux/middlewares/notification.middleware.ts` (190 lines; navigate refs=6) | 0 / 0 | 0 |
| `src/redux/slices/notification-list.slice.ts` | 350 | `src/redux/middlewares/notification.middleware.ts` (190 lines; navigate refs=6) [shared file with notification slice] | 0 / 11 | 10 |
| `src/redux/slices/popup.slice.ts` | 425 | `src/redux/middlewares/popup.middleware.ts` (86 lines; navigate refs=0) | 0 / 11 | 10 |
| `src/redux/slices/priority-service.slice.ts` | 172 | `src/redux/middlewares/priority-service.middleware.ts` (119 lines; navigate refs=4) | 0 / 5 | 4 |
| `src/redux/slices/product-addon.slice.ts` | 434 | `src/redux/middlewares/product-add-on.middleware.ts` (276 lines; navigate refs=7) | 0 / 14 | 11 |
| `src/redux/slices/product-document-group.slice.ts` | 184 | `src/redux/middlewares/product-document-group.middleware.ts` (106 lines; navigate refs=5) | 0 / 5 | 5 |
| `src/redux/slices/product-document-list.slice.ts` | 178 | `src/redux/middlewares/product-document-list.middleware.ts` (105 lines; navigate refs=5) | 0 / 5 | 4 |
| `src/redux/slices/product-document-set.slice.ts` | 226 | `src/redux/middlewares/product-document-set.middleware.ts` (175 lines; navigate refs=5) | 0 / 6 | 5 |
| `src/redux/slices/product-group-list.slice.ts` | 527 | `src/redux/middlewares/product-group.middleware.ts` (400 lines; navigate refs=11) | 0 / 18 | 15 |
| `src/redux/slices/product-industry.slice.ts` | 256 | `src/redux/middlewares/product-industry.middleware.ts` (156 lines; navigate refs=3) | 0 / 8 | 7 |
| `src/redux/slices/product-list.slice.ts` | 932 | `src/redux/middlewares/product.middleware.ts` (507 lines; navigate refs=11) | 0 / 30 | 25 |
| `src/redux/slices/query.slice.ts` | 43 | none | 0 / 0 | 0 |
| `src/redux/slices/required-information.slice.ts` | 270 | `src/redux/middlewares/required-information.middleware.ts` (132 lines; navigate refs=5) | 0 / 8 | 7 |
| `src/redux/slices/required-information-set.slice.ts` | 196 | `src/redux/middlewares/required-information-set.middleware.ts` (169 lines; navigate refs=5) | 0 / 6 | 6 |
| `src/redux/slices/segmentation-customer.slice.ts` | 482 | `src/redux/middlewares/segmentation-customer.middleware.ts` (287 lines; navigate refs=6) | 0 / 14 | 12 |
| `src/redux/slices/simulation.slice.ts` | 368 | `src/redux/middlewares/simulation.middleware.ts` (104 lines; navigate refs=5) | 0 / 5 | 4 |
| `src/redux/slices/staff.slice.ts` | 346 | `src/redux/middlewares/staff.middleware.ts` (258 lines; navigate refs=6) | 0 / 11 | 10 |
| `src/modules/system/maintenance/stores/redux/slices/system-maintenance.slice.ts` | 160 | `src/modules/system/maintenance/stores/redux/middlewares/system-maintenance.middleware.ts` (73 lines; navigate refs=5) | 0 / 5 | 2 |
| `src/redux/slices/tandc.slice.ts` | 212 | `src/redux/middlewares/content-tandc.middleware.ts` (120 lines; navigate refs=5) | 0 / 6 | 5 |
| `src/redux/slices/tandc-place-list.slice.ts` | 166 | `src/redux/middlewares/tandc-place.middleware.ts` (112 lines; navigate refs=5) | 0 / 5 | 4 |
| `src/redux/slices/unlock-request-customer.slice.ts` | 106 | `src/redux/middlewares/unlock-request-customer.middleware.ts` (52 lines; navigate refs=1) | 0 / 2 | 2 |
| `src/redux/slices/version-settings.slice.ts` | 116 | `src/redux/middlewares/version-settings.middleware.ts` (69 lines; navigate refs=4) | 0 / 3 | 0 |

Observations (CONFIRMED):
- `card-package.slice.ts` shows 0 endpoint literals but 2 thunks: its endpoint is the imported constant `CARD_PACKAGE_LIST_ENDPOINT` (`src/modules/products/simulation/card-packages/constants.ts`).
- `version-settings.slice.ts` shows 0 endpoint literals but 3 thunks: it calls `getVersionConfig` etc. from `src/modules/system/version-settings/services/version-settings.service.ts`.
- `app`, `layout`, `notification`, `query` have 0 thunks and 0 endpoints.
- `auth.slice.ts` shows 2 endpoint literals (e.g. `api/admin/portal/v1/auth/login`); `administrative-unit.slice.ts` shows 1 literal plus path constants (`MASTER_DATA_PATH`) not counted.

## 4. Consumers Per Slice

Consumers = files under `src/modules/**` containing an import path ending `/slices/<name>.slice` (or `./<name>.slice`). Import-level match: includes actions, thunks and selectors; individual symbols were not separated. Top-level module taken from path segment after `src/modules/`. Only `users`, `products`, `system`, `notifications`, `contents`, `order` appeared (other directories under `src/modules`: `blacklist`, `transactions`, `humanities-program.module.tsx` had no matches).

| Slice | Consumer files in src/modules | Distinct top-level modules | Breakdown |
|---|---|---|---|
| account-access | 5 | 1 | users(5) |
| address | 17 | 2 | products(11) users(6) |
| administrative-unit | 3 | 1 | system(3) |
| affiliate-partner | 5 | 1 | users(5) |
| app | 0 | 0 | - |
| auth | 3 | 1 | products(3) |
| banner | 10 | 2 | contents(9) system(1) |
| card-management | 8 | 1 | system(8) |
| card-package | 3 | 1 | products(3) |
| common | 92 | 5 | contents(4) notifications(11) order(4) products(63) users(10) |
| contract | 2 | 1 | order(2) |
| contract-template | 15 | 1 | products(15) |
| customer | 5 | 1 | users(5) |
| ekyc-config | 4 | 1 | system(4) |
| fee-definition | 29 | 3 | contents(6) products(17) users(6) |
| group-permission | 12 | 1 | users(12) |
| layout | 9 | 4 | order(2) products(1) system(5) users(1) |
| loan-order | 5 | 1 | order(5) |
| notification | 94 | 5 | contents(9) notifications(4) products(54) system(14) users(13) |
| notification-list | 17 | 1 | notifications(17) |
| popup | 4 | 1 | contents(4) |
| priority-service | 6 | 1 | system(6) |
| product-addon | 30 | 2 | products(27) users(3) |
| product-document-group | 6 | 1 | products(6) |
| product-document-list | 6 | 1 | products(6) |
| product-document-set | 10 | 1 | products(10) |
| product-group-list | 30 | 1 | products(30) |
| product-industry | 31 | 4 | contents(1) notifications(1) products(27) users(2) |
| product-list | 37 | 3 | order(1) products(35) users(1) |
| query | 2 | 1 | products(2) |
| required-information | 13 | 3 | order(1) products(9) users(3) |
| required-information-set | 11 | 1 | products(11) |
| segmentation-customer | 20 | 2 | products(4) users(16) |
| simulation | 10 | 1 | products(10) |
| staff | 9 | 2 | products(3) users(6) |
| system-maintenance | 7 | 1 | system(7) |
| tandc | 5 | 1 | contents(5) |
| tandc-place-list | 7 | 1 | contents(7) |
| unlock-request-customer | 1 | 1 | users(1) |
| version-settings | 5 | 1 | system(5) |

Importers outside `src/modules` (CONFIRMED, informational): every slice is imported by `src/redux/slices.ts`; most are also imported by their `src/redux/middlewares/*.middleware.ts`; `src/utils/api-service.ts` (2 matches), and `src/components/forms/import/import-file-form.tsx`, `list/valid-file-import.tsx`, `list/invalid-file-import.tsx` (3 matches each) import slices too. Full per-file consumer lists are reproducible with: `grep -rlE "/slices/<name>\.slice['\"]" src/modules`.

## 5. Slices Shared Across Top-level Modules

Slices whose `src/modules` consumers span more than one top-level module (CONFIRMED):

| Slice | Modules spanned | Breakdown |
|---|---|---|
| address | 2 | products(11) users(6) |
| banner | 2 | contents(9) system(1) |
| common | 5 | contents(4) notifications(11) order(4) products(63) users(10) |
| fee-definition | 3 | contents(6) products(17) users(6) |
| layout | 4 | order(2) products(1) system(5) users(1) |
| notification | 5 | contents(9) notifications(4) products(54) system(14) users(13) |
| product-addon | 2 | products(27) users(3) |
| product-industry | 4 | contents(1) notifications(1) products(27) users(2) |
| product-list | 3 | order(1) products(35) users(1) |
| required-information | 3 | order(1) products(9) users(3) |
| segmentation-customer | 2 | products(4) users(16) |
| staff | 2 | products(3) users(6) |

12 of 40 slices span more than one top-level module. `app` has 0 module consumers. The remaining 27 span exactly one (including `unlock-request-customer`, `contract`, `account-access`, `customer`).

## 6. Slices Holding Manually Modeled Server Cache

CONFIRMED by reading `initialState` / state field names (full `initialState` read for app, auth, layout, notification, query, card-package, version-settings, administrative-unit; for the other slices, evidence is from identifier pattern matching of state/selector names, so field names listed are those that matched `loading|list|detail|pagination|history|page`). Evidence by slice:

| Slice | Evidence (field names) |
|---|---|
| account-access | `loading`, `accountAccessDetail`, `pagination` |
| address | `loading`, `provinceList`, `districtList`, `wardList` |
| administrative-unit | `masterData`, `masterDataPagination`, `masterDataLoading`, `provinces`, `provincesLoading`, `wardsByProvince`, `wardsPaginationByProvince`, `wardsLoadingByProvince`, `legacyMappings`, `legacyMappingsLoading` (+ `*Error` flags) |
| affiliate-partner | `loading`, `affiliatePartnerDetail`, `pagination` |
| auth | `loading`, `profileLoading`, `accessToken`, `userPermissions` (session/profile state; loading flags only) |
| banner | `loading`, `bannerList`, `detail`, `pagination`, `channelList`, `screenList`, `redirectScreenList`, `redirectTypeList` (+ per-list loading flags), updated-history selector |
| card-management | `loading`, `cardServiceList`, `cardServiceDetail`, `cardServiceDetailLoading`, `pagination`, updated-history selector |
| card-package | `items`, `total`, `page`, `pageSize`, `listStatus`, `generationStatus` |
| common | `productLineDetail`, `requiredInformationDetail`, `segmentationCustomerDetail` with matching `loading*Detail` flags |
| contract-template | `loading`, `contractTemplateDetail`, `pagination` |
| contract | `loading`, `contractDetail`, `pagination` |
| customer | `loading`, `customersDetail`, `pagination`, `contactHistory`, `listUpdatedHistory`, `paginationUpdatedHistory` |
| ekyc-config | `loading`, `detail`, `systemSettingOtherDetail`, `pagination` |
| fee-definition | `loading`, `feeDefinitionsDetail`, `pagination` |
| group-permission | `loading`, `pagination` |
| loan-order | `loading`, `loanOrderDetail`, `listHistory`, `listContractHistory`, `pagination`, `paginationHistory` |
| notification-list | `loading`, `notificationList`, `resultNotificationList`, `pagination` |
| popup | `loading`, `historyLoading`, `popupList`, `detail`, `pagination`, `channelList`, `redirectScreenList`, `redirectTypeList` |
| priority-service | `loading`, `priorityServiceList`, `priorityServiceDetail`, `priorityServiceDetailLoading`, `pagination` |
| product-addon | `loading`, `productAddonDetail`, `pagination` |
| product-document-group | `loading`, `documentGroupDetail`, `pagination` |
| product-document-list | `loading`, `documentDetail`, `pagination` |
| product-document-set | `loading`, `documentSetDetail`, `pagination` |
| product-group-list | `loading`, `productGroupList`, `pagination` |
| product-industry | `loading`, `industryDetail`, `pagination` |
| product-list | `loading`, `productList`, `pagination`, `documentServiceLoading` |
| required-information-set | `loading`, `requiredInformationSetDetail`, `pagination` |
| required-information | `loading`, `requiredInformationDetail`, `pagination` |
| segmentation-customer | `loading`, `segmentationCustomersDetail`, `pagination` |
| simulation | `loading`, `simulationDetail`, `sortCriteriaList`, `page`, `pagination`, updated-history selector |
| staff | `loading`, `staffDetail`, `listHistory`, `pagination` |
| system-maintenance | `loading`, `maintenanceDetail`, `pagination`, updated-history selector |
| tandc-place-list | `loading`, `TAndCPlaceList`, `TAndCPlaceDetail`, `listAcceptHistory`, `pagination` |
| tandc | `loading`, `contentTandCDetail`, `listHistory`, `pagination` |
| unlock-request-customer | `loading`, `pagination` |
| version-settings | `config`, `histories`, `pagination`, `loadingConfig`, `loadingHistories`, `updating` |

Slices with NO manually modeled server-cache state (CONFIRMED from `initialState`):
- `app`: `status`, `messages`, `locale`
- `layout`: `hiddenFormFooter`, `collapse`
- `notification`: empty initial state, single `notification` field (UI message)
- `query`: `page`, `pageSize`, `filter`, `sort`, `path` (UI list-query parameters)

LIKELY (inference): for slices where a list/detail field is not shown in the table (e.g. group-permission, unlock-request-customer, `getListSearchBlackList` in segmentation-customer), the data is held under a field name not matched by the pattern or only returned from thunks. Not verified.

## 7. Existing Service Files And Their Locations

`find src -name '*.service.ts*'` returned 20 files (CONFIRMED). `src/services/` contains subfolders `contents/`, `products/`, `users/` and an `index.ts`.

| File | Location class |
|---|---|
| `src/services/contents/banner-simulation.service.ts` | target (`src/services/<module>/`) |
| `src/services/products/promotion-type.service.ts` | target |
| `src/services/products/promotion.service.ts` | target |
| `src/services/products/scheme-import.service.ts` | target |
| `src/services/products/scheme-sync.service.ts` | target |
| `src/services/users/customer-segment.service.ts` | target |
| `src/modules/notifications/configuration/list-notification/services/workflow.service.ts` | LEGACY-COMPATIBILITY (under `src/modules/**`) |
| `src/modules/products/configuration/cash-loan/services/cash-loan-product.service.ts` | LEGACY-COMPATIBILITY |
| `src/modules/products/configuration/credit-card/services/credit-card-product.service.ts` | LEGACY-COMPATIBILITY |
| `src/modules/products/configuration/display-information-set/services/display-information-set.service.ts` | LEGACY-COMPATIBILITY |
| `src/modules/products/configuration/product-labels/cash-loan/services/cash-loan-label.service.ts` | LEGACY-COMPATIBILITY |
| `src/modules/products/configuration/product-labels/credit-card/services/credit-card-label.service.ts` | LEGACY-COMPATIBILITY |
| `src/modules/products/exclusive-touch/services/exclusive-touch.service.ts` | LEGACY-COMPATIBILITY |
| `src/modules/system/bank-list/services/bank.service.ts` | LEGACY-COMPATIBILITY |
| `src/modules/system/splash-screen/services/splash-screen.service.ts` | LEGACY-COMPATIBILITY |
| `src/modules/system/theme-management/background-main-lock/services/background-main-lock.service.ts` | LEGACY-COMPATIBILITY |
| `src/modules/system/theme-management/background-main/services/background-main.service.ts` | LEGACY-COMPATIBILITY |
| `src/modules/system/theme-management/topic/services/topic.service.ts` | LEGACY-COMPATIBILITY |
| `src/modules/system/version-settings/services/version-settings.service.ts` | LEGACY-COMPATIBILITY |
| `src/components/select-product-modal/select-product.service.ts` | neither: under `src/components/`, not `src/services/` and not `src/modules/**` |

Totals: 6 in `src/services/<module>/`, 13 under `src/modules/**`, 1 under `src/components/`. Per `.claude/rules/03-api-service.md` `## Service location`, the target is `src/services/<module>/`; a `src/services/system/`, `order/`, or `notifications/` folder does not exist yet.

## 8. Direct apiFetcher Calls From .tsx

Pattern: `apiFetcher.(get|post|put|patch|delete|request)...(` in `*.tsx` outside `src/redux`. CONFIRMED: 19 files, 42 call sites.

| File | Call sites |
|---|---|
| `src/components/forms/search/group-document-list-searcher.form.tsx` | 1 |
| `src/components/forms/search/document-list-searcher.form.tsx` | 1 |
| `src/components/forms/import/upload-file.tsx` | 2 |
| `src/components/forms/import/list/invalid-file-import.tsx` | 6 |
| `src/components/forms/import/list/valid-file-import.tsx` | 6 |
| `src/components/product-configuration/utils.tsx` | 4 |
| `src/components/upload-multiple/index.tsx` | 1 |
| `src/components/upload/index.tsx` | 1 |
| `src/modules/contents/banner/components/UploadImage.tsx` | 1 |
| `src/modules/contents/banner/edit/general.tsx` | 1 |
| `src/modules/contents/banner/create/createBanner.tsx` | 1 |
| `src/modules/products/configuration/card-gift-offer/rule-form.tsx` | 6 |
| `src/modules/products/configuration/cash-loan/view/loan-packages.tsx` | 1 |
| `src/modules/products/configuration/group-list-product/utils.tsx` | 1 |
| `src/modules/products/parameter/contract-termplate/utils.tsx` | 1 |
| `src/modules/products/parameter/contract-termplate/components/upload-contract.tsx` | 2 |
| `src/modules/users/operator/user-operator-list/components/upload-user-operator.tsx` | 2 |
| `src/modules/users/customer/segmentation/components/upload/upload-picture.tsx` | 1 |
| `src/modules/users/customer/segmentation/components/upload/upload-info.tsx` | 3 |

(Per-file call-site counts derived from the grep line listing; `upload-info.tsx` has three `apiFetcher.` call sites in a nested ternary. Direct calls from non-`.tsx` helper files (e.g. `.ts` utils) were not in scope.)

## 9. Current TanStack Query Ownership

CONFIRMED: 64 files import `@tanstack/react-query` (excluding `src/providers/query.provider.tsx`). Grouped by feature area:

- Products / configuration: `cash-loan` (`CashLoanProductList.tsx`, `hooks/cashLoanProductQueries.ts`), `credit-card` (`CreditCardProductList.tsx`, `hooks/creditCardProductQueries.ts`), `display-information-set` (`hooks/displayInformationSetQueries.ts`), `product-labels` (cash-loan form + `cashLoanLabelQueries.ts`; credit-card form + `creditCardLabelQueries.ts`; `shared/UnassignedProductTab.tsx`), `scheme-sync` (page, tabs, modal, `scheme-sync.queries.hook.ts`, `useSchemeSyncImportFlow.hook.tsx`, `useSchemeSyncRows.hook.ts`, `scheme-import.queries.hook.ts`, two query-keys files, import/publish history tabs).
- Products / `exclusive-touch`: `hooks/exclusiveTouchQueries.ts`.
- Products / `promotion-management`: `promotion-type` (drawer hook, table section, `promotion-type.queries.hook.ts`, query-keys; plus `promotion-management/queryKeys/promotion-type.query-keys.ts`), `promotion` (GiftCardMultiSelect, OfferDetailTabs, OfferForm, OfferScopePreviewTable, PromotionFilterBar, `promotion.queries.hook.ts`, query-keys, Edit/List/View pages).
- System: `bank-list` (`bankQueries.ts`), `splash-screen` (`splashScreenQueries.ts`, `useSplashScreenCustomerSegments.ts`, `SplashScreenMarketingPreview.tsx`), `theme-management` (`background-main-lock`, `background-main`, `topic`, plus `components/BackgroundMainTableSection`, `components/TopicTableSection`).
- Contents: `banner/simulation/simulationModalContent.tsx`.
- Shared components: `src/components/select-product-modal/` (`index.tsx`, `SelectProductModalContent.tsx`, `select-product-modal.query-keys.ts`), `src/components/simulation/components/BannerCarousel/index.tsx`.
- Shared query keys: `src/queryKeys/contents/banner-simulation.query-keys.ts`.

Full file list reproducible with `grep -rl "@tanstack/react-query" src | grep -v providers/query.provider.tsx`.

## 10. Pilot Candidates For Service Extraction

Selection criteria applied mechanically: single top-level module among `src/modules` consumers; endpoint literals present in the slice file; the slice's own middleware has no real `navigate(...)` call (only at most a type reference) and is small; slices ordered by line count. This is descriptive evidence for a later phase, not a recommendation.

Slices excluded by the criteria with lowest line counts (CONFIRMED): `app` 53, `layout` 35, `notification` 35, `query` 43 (no endpoints); `card-package` 126 (no endpoint literal in file, no middleware); `address` 164 (2 modules); `ekyc-config` 179 (middleware navigate refs=4); `version-settings` 116 (no endpoint literal, already imports a service); `affiliate-partner` 196 (navigate refs=5).

| Candidate | Lines | Top-level modules (consumer files) | Endpoint literals | Middleware | Thunks |
|---|---|---|---|---|---|
| `unlock-request-customer` (`src/redux/slices/unlock-request-customer.slice.ts`) | 106 | 1: `users` (1 file) | 2 (`api/admin/portal/v1/unlock-requests`, `.../unlock-requests/${data.id}`) | `src/redux/middlewares/unlock-request-customer.middleware.ts`, 52 lines, 3 `startListening`; `navigate` appears once, in a type declaration (line 13), no call | 2 |
| `contract` (`src/redux/slices/contract.slice.ts`) | 122 | 1: `order` (2 files: `contract-list/list.contract.tsx`, `contract-list/view/form.tsx`) | 3 (`contract-agreement/${id}`, `contracts-agreement`, `contracts-agreement/download`) | `src/redux/middlewares/contract.middleware.ts`, 50 lines, 3 `startListening`, 0 `navigate` | 3 |
| `account-access` (`src/redux/slices/account-access.slice.ts`) | 229 | 1: `users` (5 files) | 6 (all under `api/admin/portal/v1/user`) | `src/redux/middlewares/access-account.middleware.ts`, 119 lines, 8 `startListening`, 0 `navigate`; note `affiliate-partner.middleware.ts` also imports this slice | 6 |

Facts for later-phase attention (CONFIRMED, not conclusions): `unlock-request-customer` is state `loading` + `pagination` only (section 6); `contract` holds `contractDetail` + `pagination`; `account-access` slice is also imported by `affiliate-partner.middleware.ts`. Middleware listeners were only counted (`startListening`, `navigate` references), not read in full for multi-step logic (see section 11).

## 11. NEEDS-VERIFICATION

- Whether middleware listeners for the three pilot candidates contain multi-step workflow logic beyond what `startListening`/`navigate`/`dispatch` counts show: only grep-counted; listener bodies were not fully read. Blocked by scope/time (read-only mechanical pass).
- Endpoint counts exclude endpoints held in imported constants or services (`card-package` -> `CARD_PACKAGE_LIST_ENDPOINT`, `administrative-unit` -> `MASTER_DATA_PATH`, `version-settings` -> service file). The true endpoint count for those slices is not established.
- Consumer counts are import-path matches only. Imports through aliased re-exports, dynamic imports, or non-literal paths would not be detected; no barrel re-exporting slices was found, but only a pattern search was run.
- Consumers were counted for `src/modules/**` only as the task specified; consumers in `src/components/**`, `src/utils/**`, `src/hooks/**`, `src/layouts/**`, `src/guards/**` and `src/routes/**` were not exhaustively mapped (section 4 only notes some).
- Section 6 field evidence for slices other than app/auth/layout/notification/query/card-package/version-settings/administrative-unit comes from identifier pattern matching, not full `initialState` reads; names such as `watch*`/`get*`/`reset*` were filtered out manually. Fields with unconventional names may be missed.
- `app.slice` has 0 `src/modules` consumers by import-path match; usage elsewhere (e.g. `src/components`, `src/layouts`, `src/App.tsx`) was not checked.
- Thunk counts rely on literal `create.asyncThunk` occurrences; slices that define thunks by other helper functions would be undercounted (none observed).
- Whether `src/services/index.ts` re-exports all six target-location services was not checked.
- Browser/runtime behavior, permission flows and API behavior were not tested; these are static-source observations only.
