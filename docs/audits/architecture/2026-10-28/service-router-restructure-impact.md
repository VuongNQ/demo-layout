# Codebase Analysis: Service and Router Restructure Impact

- Revision: `9fe73741ccc2299ff1fffcc9d6c1962285f4c317`
- Branch: `portal-cham-vay`
- Date: 2026-10-28
- Working tree: clean at start (`git status --short` empty)
- Overall change: **HIGH-RISK**. It touches routing, service and ApiFetcher consumers, and shared-code dependency direction. Rule `01-architecture.md:70-71` requires an impact analysis first.
- The restructure itself is APPROVED and is not re-evaluated here.

## 0. Critical findings (read first)

1. **The `.claude` documentation describes a different revision than this checkout.**
   - `CLAUDE.md` and `PROJECT_CONTEXT.md` cite revision `ed18d0c1`. `git cat-file -t ed18d0c1` fails, and the repo has only 6 commits. CONFIRMED.
   - `.agents/` and `docs/audits/` do not exist (prior to this report). `docs/` contained only `ENV_VARIABLES.md` and `modules/`.
   - Documented facts that are false in this checkout:
     - `src/routes/index.tsx` is NOT 2130 lines or 181 routes. It is 34 lines.
     - The route file is already split (see §8).
     - There are 20 `*.service.ts` files, not 11.
     - The `theme/` and `theme-lock/` child modules do not exist.
     - The documented duplicate paths (`group-document-list` x2, banner create/edit x2) do not exist (see §9).
2. **Part B's premise is partly already done.**
   - `src/routes/` holds four files: `index.tsx` (34 lines), `main.routes.tsx` (494), `form.routes.tsx` (1042) and `pages.tsx` (262).
   - The split is by layout (MainLayout / BasicLayout), not by module.
   - `pages.tsx` is a single central catalog of 170 `lazy()` exports.
   - The remaining work is therefore to split by module the two layout-bucket files and the one lazy catalog, not to split a monolith.
3. **There are no mock files and no mock switch anywhere.**
   - There is no `*.mock.ts` and no `USE_MOCK*` in `src`.
   - The two `services/index.ts` files are plain barrels.
   - The `## Mock data` rewrite is therefore purely a rule-text change with no code to move (see §4).
4. **`typecheck`, `lint` and `build` were NOT run.** `node_modules` has no `react-router-dom` (package.json:58 declares `^7.18.3`). The scripts will fail until dependencies are installed, which was not done as part of this read-only audit.
5. **Rule 06 is out of date on `ProductLabelsRouteGate`.**
   - Rule 06 says the gate bypasses `RouteSuspense`. In this checkout all 8 gate routes wrap `<AuthGuard><RouteSuspense><ProductLabelsRouteGate/></RouteSuspense></AuthGuard>`.
   - There are 8 gate routes, not 7: 7 in `form.routes.tsx` and 1 in `main.routes.tsx`.

## 1. Task understanding

Measure the impact of two approved moves:
- (A) Move all services to one root-level services directory, one folder per module, with sub-modules nested inside.
- (B) Split routes into per-module folders under `src/routes/`, keeping `index.tsx` as the assembly file.

## 2. Entry points

- Services: `find src/modules src/service -name '*.service.ts'`.
- Routes: `src/App.tsx:3` (`import Routes from './routes'`) → `src/routes/index.tsx`.
- The only importer of `src/routes` is `App.tsx`. CONFIRMED by grep of `@/routes` and `./routes`.

## 3-7. PART A: Service move (evidence)

### A1. Inventory (CONFIRMED, `find` plus `wc -l`)

**20 `*.service.ts` files, 2225 lines**, plus 2 `services/index.ts` (13 lines) and **0 `*.mock.ts`**. The move set is 22 files, 2238 lines.

Under `src/modules` (19 files):
- `notifications/configuration/list-notification/services/workflow.service.ts` (143)
- `products/configuration/cash-loan/services/cash-loan-product.service.ts` (92)
- `products/configuration/credit-card/services/credit-card-product.service.ts` (71)
- `products/configuration/display-information-set/services/display-information-set.service.ts` (115)
- `products/configuration/product-labels/cash-loan/services/cash-loan-label.service.ts` (123)
- `products/configuration/product-labels/credit-card/services/credit-card-label.service.ts` (105)
- `products/configuration/scheme-sync/import/services/scheme-import.service.ts` (86)
- `products/configuration/scheme-sync/services/scheme-sync.service.ts` (330)
- `products/configuration/services/display-set.service.ts` (58)
- `products/exclusive-touch/services/exclusive-touch.service.ts` (76)
- `products/promotion-management/promotion/services/promotion.service.ts` (158)
- `products/promotion-management/promotion-type/services/promotion-type.service.ts` (71)
- `products/promotion-management/services/promotion-type.service.ts` (51)
- `system/bank-list/services/bank.service.ts` (105)
- `system/splash-screen/services/splash-screen.service.ts` (94)
- `system/theme-management/background-main/services/background-main.service.ts` (183)
- `system/theme-management/background-main-lock/services/background-main-lock.service.ts` (112)
- `system/theme-management/topic/services/topic.service.ts` (161)
- `system/version-settings/services/version-settings.service.ts` (16)

Outside `src/modules`: `src/service/customer-segment.service.ts` (75).

`services/index.ts` (2 files):
- `.../scheme-sync/import/services/index.ts` (3 lines): `export const schemeImportApi = schemeImportService;`
- `.../promotion-management/promotion/services/index.ts` (10 lines): re-exports 8 functions from `./promotion.service`.

`src/service/customer-segment.service.ts` still exists. It is imported by 2 files:
- `src/modules/system/splash-screen/hooks/useSplashScreenCustomerSegments.ts:5`
- `src/modules/system/theme-management/background-main/hooks/useBackgroundMainCustomerSegments.hook.ts:5`

Its sibling `src/queryKeys/customer-segment.query-keys.ts` is a keys-only factory (5 lines) with the same 2 consumers.

Service-named files outside the scope listed in the brief:
- `src/components/select-product-modal/select-product.service.ts` (30 lines). Its consumer is `select-product-modal.query-keys.ts`, which holds `queryOptions`. `NEEDS-TEAM-DECISION`: does it move?
- Seven product-label repositories that are service-like but not `*.service.ts`: `api-label-repository.ts`, `label-repository.ts` and `product-label-repository.ts` for each of cash-loan and credit-card, plus `shared/api-repository.ts`. The two label services import them (see the table).

### A2. Service -> intra-module imports -> consumers

Resolved by an import-graph script that handles `@/`, relative, multi-line, `export ... from` and dynamic `import()`. External packages are excluded.

| Service | Intra-module imports | Consumers |
|---|---|---|
| list-notification `workflow.service` | none | `components/order-source-fields.tsx`, `hooks/use-workflow-options.ts`, `utils.ts` |
| `cash-loan-product.service` | `cash-loan/types.ts` | `hooks/cashLoanProductQueries.ts` |
| `credit-card-product.service` | `credit-card/types.ts` | `hooks/creditCardProductQueries.ts` |
| `display-information-set.service` | `display-information-set/types.ts`; ambient `src/types/common.d.ts` | `hooks/displayInformationSetQueries.ts` |
| `cash-loan-label.service` | `cash-loan/{api-label-repository,product-label-repository,types}.ts`, `product-labels/shared/{api-repository,api-types}.ts`, `product-labels/types.ts` | `components/CashLoanForm.tsx`, `components/UnassignedProductsTab.tsx`, `hooks/cashLoanLabelQueries.ts` |
| `credit-card-label.service` | the same set under `credit-card/` | `components/CreditCardForm.tsx`, `components/UnassignedCardsTab.tsx`, `hooks/creditCardLabelQueries.ts` |
| `scheme-import.service` | `scheme-sync/types.ts`, `import/import.types.ts` | `import/services/index.ts` only |
| `import/services/index.ts` | `scheme-import.service` (a sibling that moves together) | `import/scheme-import.queries.hook.ts` |
| `scheme-sync.service` | `scheme-sync/types.ts`, `scheme-sync/mappers.ts` | `scheme-sync.queries.hook.ts` |
| `display-set.service` | none | **none (dead code candidate)**. The only reference to the symbol is its own declaration. CONFIRMED. |
| `exclusive-touch.service` | `exclusive-touch/types.ts` | `hooks/exclusiveTouchQueries.ts` |
| `promotion.service` | `promotion/types/promotion.types.ts`, `promotion/constant.ts` | `promotion/services/index.ts` only |
| `promotion/services/index.ts` | `promotion.service` (a sibling) | `promotion/hooks/promotion.queries.hook.ts`, `promotion/queryKeys/promotion.query-keys.ts` |
| `promotion-type/services/promotion-type.service` | `promotion-type/types/promotion-type.types.ts`, **parent** `promotion-management/types/promotion-type.types.ts` | `promotion-type/hooks/promotion-type.queries.hook.ts`, `promotion-type/queryKeys/promotion-type.query-keys.ts` |
| parent `promotion-management/services/promotion-type.service` | `promotion-management/types/promotion-type.types.ts` | `promotion-management/queryKeys/promotion-type.query-keys.ts` and the **child** `promotion-type/queryKeys/promotion-type.query-keys.ts` |
| `bank.service` | `bank-list/types.ts` | `bank-list/BankList.tsx`, `components/BankInfoModal.tsx`, `hooks/bankQueries.ts` |
| `splash-screen.service` | `splash-screen/types.ts` | `hooks/splashScreenQueries.ts` |
| `background-main.service` | `background-main/types/background-main.types.ts` | `hooks/background-main.queries.hook.ts`, `queryKeys/background-main.query-keys.ts`, `views/BackgroundMainCreatePage/index.tsx`, `views/BackgroundMainEditPage/index.tsx` |
| `background-main-lock.service` | `background-main-lock/types/background-main-lock.types.ts` | `hooks/background-main-lock.queries.hook.ts`, `queryKeys/background-main-lock.query-keys.ts` |
| `topic.service` | `topic/types/topic.types.ts` | `hooks/topic.queries.hook.ts`, `queryKeys/topic.query-keys.ts` |
| `version-settings.service` | none | `src/redux/slices/version-settings.slice.ts` (the only consumer outside `src/modules`) |
| `src/service/customer-segment.service` | none | the 2 hooks listed in A1 |

Other findings from the table:
- **Name collisions if flattened.** `promotion-type.service.ts`, `promotion-type.query-keys.ts` and `promotion-type.types.ts` each exist at both `promotion-management/` and `promotion-management/promotion-type/`. The nested layout resolves this; a flat per-module layout would not.
- **Cross-sub-module import.** The child `promotion-type` factory and service import the parent's service and types. In the new layout the child service imports a parent-owned type.
- **Imports invisible to the graph.** Services with zero import edges (`workflow`, `version-settings`, `display-set`, `customer-segment`) may use ambient types from `src/types/*.d.ts`. `NEEDS-VERIFICATION`.

### A3. Migration scopes

**MINIMAL** moves `*.service.ts`, `*.mock.ts` and `services/index.ts`:
- 22 files: 20 services plus 2 index barrels, 0 mocks.
- 21 of them come from `src/modules`. `customer-segment` is already outside.
- Touched modules:
  - 19 owner folders under `src/modules`, in 3 domains: notifications, products, system.
  - `src/service/` is the 4th location.
  - `src/redux/slices/version-settings.slice.ts` is a 5th touched consumer.
- Consumer repath: **36 import edges, 35 distinct consumer files**, all inside `src/modules` except `version-settings.slice.ts`.
- **Imports pointing from the root services directory back into `src/modules/**`: 30 edges to 25 distinct target files.** They are:
  - `cash-loan/types.ts`, `credit-card/types.ts`, `display-information-set/types.ts`, `exclusive-touch/types.ts`, `bank-list/types.ts`, `splash-screen/types.ts`
  - `scheme-sync/types.ts`, `scheme-sync/mappers.ts`, `scheme-sync/import/import.types.ts`
  - `promotion/types/promotion.types.ts`, `promotion/constant.ts`
  - `promotion-type/types/promotion-type.types.ts`, `promotion-management/types/promotion-type.types.ts`
  - `background-main/types/background-main.types.ts`, `background-main-lock/types/background-main-lock.types.ts`, `topic/types/topic.types.ts`
  - The 6 label files (counted per service: `*/api-label-repository.ts`, `*/product-label-repository.ts`, `*/types.ts`, `shared/api-repository.ts`, `shared/api-types.ts`, `product-labels/types.ts`).
- Inference (LIKELY): MINIMAL makes services import module internals. That conflicts with `01-architecture.md:21` ("Shared code must not import business-module internals") unless the rule text is rewritten to treat the root services directory as feature infrastructure. It also introduces a services->modules dependency while modules->services already exists, so every one of the 25 targets is a cycle risk between the two trees. `NEEDS-TEAM-DECISION`: what the new rule says about this direction.

**FULL** additionally moves `types/`, `dto/`, `mappers/` and `queryKeys/`, including their flat-file equivalents (`types.ts`, `*.types.ts`, `mappers.ts`, `*.query-keys.ts`) owned by the same 19 owner folders:
- **57 files**: 22 + 35 (20 in `types/` or `queryKeys/` folders and 15 flat files).
- There are 0 `dto/` and 0 `mappers/` folders in `src/modules`.
- Touched modules: the same 19 owner folders in 9 areas (`notifications/list-notification`, `products/{configuration,exclusive-touch,promotion-management}`, `system/{bank-list,splash-screen,theme-management,version-settings}`, `src/service`).
- Consumer repath: **216 import edges, 136 distinct consumer files**. Only `version-settings.slice.ts` is outside `src/modules`.
- Back-edges still pointing into `src/modules` after FULL: 30 edges to 14 targets that are not in the moved set:
  - `display-information-set/constants.ts`, `scheme-sync/constants.ts`, `promotion/constant.ts`, `promotion-type/constant.ts`, `theme-management/constant.ts`
  - `splash-screen/{asset-utils,constants}.ts`
  - `product-labels/**` repositories, `shared/api-*.ts` and `types.ts`
- Not included in the 35 (they sit outside the owner folders): `products/configuration/product-labels/types.ts`, `product-labels/shared/*`, `industry-product/form-values.types.ts` and `CashLoanCatalogModal/types.ts`.
- `promotion-management/promotion/utils/promotion.mapper.ts` is a mapper file in `utils/`, so a `mappers/` rule would not catch it.

**Query factories under FULL:**
- 6 factories contain `queryOptions(...)` and import their service:
  - `promotion/queryKeys/promotion.query-keys.ts`
  - `promotion-type/queryKeys/promotion-type.query-keys.ts`
  - `promotion-management/queryKeys/promotion-type.query-keys.ts`
  - `background-main/.../background-main.query-keys.ts`
  - `background-main-lock/.../background-main-lock.query-keys.ts`
  - `topic/.../topic.query-keys.ts`
  - Under FULL, factory and service move together. Their module consumers are separated from them: hooks, views and components such as `OfferForm`, `PromotionEditPage`, `TopicEditPage`, `BackgroundMainLockPage`.
- 10 keys-only factories, where `queryOptions` lives in module hooks, so hook and factory are separated:
  - `cash-loan`, `credit-card`, `display-information-set`, `exclusive-touch`, `bank`, `splash-screen`
  - the 2 label factories (`cash-loan-label.query-keys.ts`, `credit-card-label.query-keys.ts`)
  - `scheme-sync.query-keys.ts` and `scheme-import.query-keys.ts` (flat files)
- Plus the shared `src/queryKeys/customer-segment.query-keys.ts` (not moved by default).
- Files that import both a service and a factory (hook-level coupling): `cashLoanProductQueries`, `creditCardProductQueries`, `displayInformationSetQueries`, `cashLoanLabelQueries`, `creditCardLabelQueries`, `CashLoanForm.tsx`, `CreditCardForm.tsx`, `scheme-import.queries.hook`, `scheme-sync.queries.hook`, `exclusiveTouchQueries`, `promotion.queries.hook`, `promotion-type.queries.hook`, `bankQueries`, `splashScreenQueries`, `background-main.queries.hook`, `background-main-lock.queries.hook`, `topic.queries.hook`, plus `BackgroundMainCreatePage` and `BackgroundMainEditPage` (service + `topic` factory), and the 2 customer-segment hooks.
- FULL conflicts with `03-api-service.md:91-95` ("Keep module-specific query definitions and keys with their semantic owner").

### A4. Mock files and switches

- `services/<domain>.mock.ts`: **none exist**. `grep -rn "USE_MOCK\|\.mock'" src` is empty.
- The only `mock*`-named file is `src/modules/products/configuration/card-gift-offer/mock-data.ts`. It is unrelated to the convention and not under `services/`.
- Mock switch consts: none. The two `services/index.ts` files contain no switch.
- Lines of `.claude/rules/03-api-service.md` to rewrite (the `## Mock data` section, lines 19-43):
  - `:21-22` "Mock data is a temporary, feature-local stand-in ..."
  - `:24-26` "**MUST:** Keep mock data inside the owning module, beside the real service in `services/`. Name the file `<domain>.mock.ts`. Do not create `src/mocks/` or any shared mock folder."
  - `:29-31` "**MUST:** Use exactly one switch per feature: a module-local constant (for example `USE_MOCK_PROMOTION_TYPE_DATA`) declared in that module's `services/index.ts`."
  - `:32-34` "**MUST:** Select the implementation once, at the service-export boundary in `services/index.ts` ..."
  - `:35-36` "**MUST:** Keep mock state and logic out of the real service file."
  - `:42-43` "**MUST:** Remove the mock file, the switch, and the indicator in the same task that wires the real endpoint."
  - Also `:13`, "feature-local mock data follows `## Mock data`".
- Collision to resolve in the rewrite: the root services directory is now where `*.mock.ts` would live, yet the rule says "Do not create ... any shared mock folder". `NEEDS-TEAM-DECISION`: where mocks live.

### A5. API call sites NOT in a `*.service.ts`

These stay where they are. The move does NOT relocate them.

- **Redux slices (`src/redux/slices/*.ts`, 40 files):**
  - 33 slice files contain endpoint literals matching `api/admin...`, with 285 literal occurrences. The largest are `product-list.slice.ts` (28), `common.slice.ts` (20), `product-group-list.slice.ts` (16), `contract-template.slice.ts` (15) and `banner.slice.ts` (14).
  - 34 slice files call `apiFetcher.<m>(`, with 297 call lines.
- **`.tsx` files calling `apiFetcher.<m>(` or `window.apiFetcher.<m>(`:** 19 files, 42 call lines (CONFIRMED):
  - Shared components (8): `src/components/forms/import/list/{invalid-file-import,valid-file-import}.tsx`, `forms/import/upload-file.tsx`, `forms/search/{document-list-searcher,group-document-list-searcher}.form.tsx`, `product-configuration/utils.tsx`, `upload-multiple/index.tsx`, `upload/index.tsx`
  - `src/modules/contents/banner/{components/UploadImage,create/createBanner,edit/general}.tsx`
  - `src/modules/products/configuration/{card-gift-offer/rule-form,cash-loan/view/loan-packages,group-list-product/utils}.tsx`
  - `src/modules/products/parameter/contract-termplate/{components/upload-contract,utils}.tsx`
  - `src/modules/users/customer/segmentation/components/upload/{upload-info,upload-picture}.tsx`
  - `src/modules/users/operator/user-operator-list/components/upload-user-operator.tsx`
- **Other `.ts` files outside services and slices that call `apiFetcher`:**
  - `products/attractive-offer/api-mappers.ts` (2), `products/popular-loans/api-mappers.ts` (2)
  - `users/operator/user-operator-list/utils.ts` (1)
  - `system/maintenance/stores/redux/slices/system-maintenance.slice.ts` (4, a module-local slice)
  - `product-labels/cash-loan/product-catalog-api.ts` (1), `product-labels/shared/api-repository.ts` (6)

## 6. Edit list for the rule update (do NOT apply)

**`.claude/ARCHITECTURE.md`**

| Line(s) | Text |
|---|---|
| 223-225 | "`src/modules/<domain>` remains the primary home for business functionality. New features should be placed under the owning domain ..." |
| 231 | "Feature `hooks/` when it coordinates feature state or services." |
| 235 | "API endpoint wrapper \| Feature `services/` ..." |
| 236 | "Request/response DTO \| Feature `dto/` ..." |
| 237 | "Mapper/runtime guard \| Feature `mappers/` ..." |
| 238 | "Domain/view model \| Feature `types/` ..." |
| 246-248 | "A legacy slice may remain ... while its service and types become feature-owned" |
| 259, 275, 294-297 | structure trees showing `feature.service.ts`, `services/`, `dto/`, `mappers/` inside the feature |
| 283 | "prefer a feature service" |
| 305-306 | "`components -> feature hooks -> TanStack Query -> feature service/repository -> ApiFetcher`" |
| 312-318 | "approved, scoped exception ... `views/`, `queryKeys/`, `services/` ..." (Theme children) |
| 485 | "typed feature service" |
| 509 | "New endpoint strings live in a feature service/repository" |
| 520-524 | "Query functions call a feature service/repository ... Keep query keys feature-owned" |
| 826 | "Put new endpoint strings behind feature services/repositories." |
| 853, 854, 856 | the "stay in its service" / "feature service" / "feature-local" compatibility rows |

**`.claude/rules/01-architecture.md`**
- 12: "feature service/repository" (direction diagram).
- 17: "Business behavior belongs under its owning `src/modules/<domain>` feature."
- 21: "Shared code must not import business-module internals." (A root services directory importing module types contradicts it.)
- 22-23: "Services/repositories must not depend on React UI, routing, Redux, or notifications."
- 29-31: "Start components, hooks, types, validators, constants, and utilities inside the feature that owns them."
- 33-38: "Keep module-specific query definitions/keys and Zod schemas with their semantic owner ... no universal folder is required."
- 42-52: Theme Management child-module structure (`queryKeys/`, `services/`, `types/`).

**`.claude/rules/03-api-service.md`**
- 13 and 24-26: mock location ("inside the owning module, beside the real service in `services/`").
- 29-36: mock switch and `services/index.ts`.
- 42-43: mock removal.
- 47: "feature-owned service".
- 76: "keep the schema/guard near its feature or service owner".
- 88-90: "feature-owned hooks; ... feature service/repository".
- 91-95: query definitions and keys with their semantic owner.
- 117-120: dependency direction, and "A service MUST NOT import `queryKeys/`".
- 131-140: scoping to Theme and existing layouts.
- 162-163: "feature-owned ... feature service/repository".
- 182-189: "place feature-owned endpoint wrappers under `services/<domain>.service.ts` and key factories under `queryKeys/<domain>.query-keys.ts`".

**Outside the files named in the task brief (secondary edit list):**
- `.claude/rules/02-typescript.md:108-121` (Theme scoped file naming).
- `.claude/rules/04-state-management.md:44` and `:56-62` ("feature services/repositories"; "`queryKeys/` ... Theme").
- `.claude/rules/06-routing-permission.md:14, 42, 61-62, 70-75`.
- `CLAUDE.md:156-170` and `PROJECT_CONTEXT.md:698, 715` ("`src/services/` ... do not exist").

### A7. Theme Management convention vs. new layout

The convention is `views/`, `queryKeys/`, `services/`, `utils/`, `types/`, `components/` and `hooks/`.

- **No conflict (stay in the module):** `views/`, `components/`, `hooks/`, `utils/`.
- **Conflicts in both scopes:** `services/`. Rule 03:182-184 mandates `services/<domain>.service.ts` inside each child, and rule 02:108-116 lists it among the approved folders.
- **Conflicts only under FULL:** `queryKeys/` and `types/`. Under MINIMAL the factories stay and import the root services. The direction `views/components -> queryKeys -> services` in 03:117-120 then becomes cross-tree. The rule "a service MUST NOT import queryKeys" is still met.
- **Checkout differs from the rules:**
  - The rules and `ARCHITECTURE.md:312` name `theme/` and `topic/` children. The tree has `topic/`, `background-main/` and `background-main-lock/`. There is no `theme/`.
  - `topic/` and `background-main/` also contain `schemas/`, which is not in the approved list. The rules say schemas stay with their semantic owner.
  - The parent holds `constant.ts`, `hooks/`, `components/` and `utils/`. The `queryKeys` of `topic` and `background-main` import `theme-management/constant.ts`, a back-edge in either scope.
- Rule 06's last paragraph ("route view implementations live in `views/<PascalCaseView>/index.tsx` ... This convention is scoped to Theme and Topic") is unaffected by the service move.

## PART B: Route split

### B8. Current metrics (CONFIRMED)

| Metric | `index.tsx` | `main.routes.tsx` | `form.routes.tsx` | `pages.tsx` | Total |
|---|---|---|---|---|---|
| Lines | 34 | 494 | 1042 | 262 | 1832 |
| `<Route` via `grep -oE "<Route($\|[ >/])"` | 8 | 69 | 113 | 0 | **190** |
| `path=` | 7 | 69 | 113 | 0 | 189 |
| `lazy(` (`^(export )?const \w+ = lazy\(`) | 0 | 0 | 0 | 170 | 170 |
| Eager imports from `@/modules` | 0 | 0 | 0 | 0 | 0 |
| `WithGuard` incl. import | 4 | 68 | 107 | 0 | 179 |
| `<WithGuard` usages | 3 | 67 | 106 | 0 | 176 |

- `^const \w+ = lazy\(` literally returns 0 everywhere. The lines are `export const`.
- A bare `grep -c "<Route"` gives 9 / 69+ / 113+, so it still overcounts.
- The files have CRLF line endings. A JavaScript `$` pattern misses `<Route\r`, but the grep counts above match an independent script (190).
- Direct `<AuthGuard>` routes (no `WithGuard`): `main.routes.tsx` 1 and `form.routes.tsx` 7. These are the 8 product-label gate routes.
- Other facts:
  - Layout parents are in `index.tsx`: `MasterLayout` at :19, `MainLayout` at :25 and `BasicLayout` at :28.
  - The `*` route (`Navigate` to `PageURLs.of404()`) is at :31.
  - `main.routes.tsx:121` has a `Navigate` redirect (`system/information/master-data`).
  - `pages.tsx:257-262` defines non-lazy `ViewVersionSettings` and `EditVersionSettings` wrapper components.
  - `ProductLabelsRouteGate` is lazy via `.then()` at `pages.tsx:247-253`.
  - `WithGuard` (`src/guards/index.tsx`) checks permissions inside `GuardedPage` at render time, redirects to `/404`, and removes a trailing slash at render time through `Navigate`, not through an effect. This differs from `PROJECT_CONTEXT.md`.

### B9. Duplicate and overlapping `path=` values (exhaustive)

Method: all 190 `<Route>` elements were parsed, with `PageURLs.of*()` evaluated from `navigate.ts`.

- **Exact duplicates: 0.** There are 187 path-bearing routes with 187 distinct values.
- The documented duplicates (`group-document-list` x2, banner create/edit outside the layout) no longer exist:
  - `product/parameter/group-document-list` appears once, at `main.routes.tsx:245`.
  - `banner-management/create` appears once, at `form.routes.tsx:1036`.
- The empty `path=''` on the 3 layout parents (`index.tsx:19, 25, 28`) is by design, not a duplicate.

Overlapping, same layout depth, matchable by one URL (3 pairs). Line numbers are the `<Route` start line (the `path=` attribute is +1).

| # | A | B | Layout parents | Guard | Permissions |
|---|---|---|---|---|---|
| 1 | `main.routes.tsx:475` `product/configuration/product-labels/:line`, `action='list'` | `form.routes.tsx:299` `product/configuration/product-labels/create`, `action='legacy'` | **MainLayout vs BasicLayout** | Both `AuthGuard` directly + `RouteSuspense` + `ProductLabelsRouteGate` | None on either |
| 2 | `form.routes.tsx:309` `product-labels/view/:id`, `action='legacy'` | `form.routes.tsx:329` `product-labels/:line/create`, `action='create'` | Both BasicLayout | Same | None |
| 3 | `form.routes.tsx:319` `product-labels/edit/:id`, `action='legacy'` | `form.routes.tsx:329` `:line/create` | Both BasicLayout | Same | None |

- Where they differ: pair 1 differs in layout parent and `action`; pairs 2 and 3 differ only in `action` and declaration order. Guard and permissions are identical (none), so no constants from `permission.constant.ts` are involved.
- Inference (LIKELY, `NEEDS-VERIFICATION` in a browser):
  - React Router ranks static above param segments. Pair 1 resolves to the static `create`.
  - Pairs 2 and 3 tie on score (static + param on each side) and are siblings under `BasicLayout`. A tie is then broken by declaration order, where `view/:id` and `edit/:id` come first.
- Consequence for the split: **the relative order of `form.routes.tsx:299-355` must be kept** (the 7 product-label routes stay together in the same order).
- Also relevant: the splat route `${PageURLs.ofThemeConfiguration()}/themes/*` is at `main.routes.tsx:387` (path line 388).
- Same `Page` used by several paths (not path duplicates): `PromotionTypeListPage` on 3 paths (`main.routes.tsx:276-305`).

### B10. Routes grouped by owning module

Module = import path of the lazy page in `pages.tsx`. Counts are `<Route>` elements in `main.routes.tsx` (MainLayout) and `form.routes.tsx` (BasicLayout). Totals (69 / 113) reconcile with B8.

| Domain | Main | Basic | Spans 2 layouts? |
|---|---|---|---|
| users | 8 | 14 | **yes** |
| system | 16 (incl. 1 `Navigate` redirect) | 23 (incl. `ViewVersionSettings`/`EditVersionSettings` wrappers) | **yes** |
| contents | 7 | 12 | **yes** |
| products | 27 | 56 | **yes** |
| notifications | 4 | 6 | **yes** |
| order | 2 | 2 | **yes** |
| blacklist | 3 | 0 | no |
| transactions | 1 | 0 | no |
| humanities-program | 1 | 0 | no |

Sub-module split inside a domain:
- Main only: `products/promotion-management` (7), `products/exclusive-touch` (1), `system/{administrative-unit,bank-list,company,display,integration,master-data,system-management}` (1 each), and `contents` placeholders.
- Basic only: `products/{simulation (4), popular-loans (2), attractive-offer (2)}`, `system/maintenance` (2).
- Both: `products/{configuration (11/30), parameter (7/15), add-on (1/3)}`, `contents/{banner,popup,t&c,t&c-place}` (1/3 each), `users/{affiliate-partner (1/3), customer (4/5), operator (2/6)}`, `system/{card-management (1/3), ekyc-config (1/2), priority-service (1/2), splash-screen (1/4), theme-management (4/8)}`, `notifications`, `order`.

**Flag:** 6 domains span MainLayout and BasicLayout, so each cannot be one contiguous route file. This reflects the app's layout design (list pages under MainLayout, form pages under BasicLayout).

Proposed layout (a proposal only, not a design review):
```
src/routes/
  index.tsx                 # assembly: MasterLayout / MainLayout / BasicLayout / '*', unchanged order
  users/{main.routes.tsx,form.routes.tsx,pages.ts}
  system/{main.routes.tsx,form.routes.tsx,pages.ts}
  contents/...   products/...   notifications/...   order/...
  blacklist/main.routes.tsx   transactions/main.routes.tsx   humanities-program/main.routes.tsx
```
- Each file exports a fragment. `index.tsx` composes them inside the `MainLayout` and `BasicLayout` parents.
- Within each layout, the current declaration order is interleaved across domains (for example promotion-type sits inside the products block in `main.routes.tsx:276-329`, and banner and popup routes are the last items in `form.routes.tsx`).
- Only the order of overlapping pairs is semantically significant (B9), so preserve it for `product-labels` and keep each domain's internal order.
- `products` is large (83 routes). An optional secondary split under `products/` follows the sub-module boundaries above.
- Do not move `ProductLabelsRouteGate` away from its 8 routes.

### B11. Position and ordering constraints

- `*` wildcard (`index.tsx:31`): the last child of `RouteContainer`, after `BasicLayout` closes at :30. It is the only route outside the three layout parents.
- `/404` (`index.tsx:23`) is under `MasterLayout` with `Component={NotFoundPage}`, with no `WithGuard`. `PageURLs.of404()` is the redirect target of the `*` route and of `GuardedPage`'s permission failure.
- `login` and `redirect` are under `MasterLayout` with `NonLoginGuard`. The index route uses `AuthGuard`.
- `ProductLabelsRouteGate` routes: **8** (1 in `main.routes.tsx:475`, 7 in `form.routes.tsx:289-355`). All render `<AuthGuard><RouteSuspense><ProductLabelsRouteGate action=.../></RouteSuspense></AuthGuard>`. They bypass `WithGuard` but do **not** bypass `RouteSuspense` in this checkout. Rule 06:46-48 is stale.
- Do not reorder the 7 form-side product-label routes (B9).
- The Route parent chain must remain `Routes > Route(Component=Layout) > fragment children`. Fragments are used so that route indices are siblings.

### B12. Registries that stay centralized

| File | Lines | Entries |
|---|---|---|
| `src/utils/navigate.ts` (`PageURLs` namespace + `withPrefix`) | 563 | 119 `export function of*` |
| `src/helpers/menus.helper.ts` | 633 | `menuStructure` with 83 `link:` and 46 `requiredPermissions` |
| `src/constants/permission.constant.ts` | 329 | about 187 entries (regex estimate) |
| `src/guards/` | 59 (`index.tsx`) + 28 (`auth.guard.tsx`) + 17 (`non-login.guard.tsx`) + 29 (`RouteLoading.module.scss`) = 133 | `WithGuard`, `RouteSuspense`, `AuthGuard`, `NonLoginGuard` |

Note that `navigate.ts:1` imports a type from `@/modules/products/configuration/product-labels/routes`.

### B13. The 8 audit points of rule 06 and what can prove them

| # | Point | What the split must verify | typecheck / lint / build | Manual or static only |
|---|---|---|---|---|
| 1 | `src/routes/index.tsx` path, layout, page, guard, permission list | Every one of the 190 routes survives with the same path, layout parent, page, guard and permissions, in the same relative order | Compile errors on missing symbols and bad imports; lint on unused imports. A **dropped or duplicated `<Route>` compiles cleanly**. | A before/after manifest diff of (file, path, layout, page, guard, perms). Static, not a runtime test. |
| 2 | `PageURLs` | Unchanged | `PageURLs.of*` renames are caught | A path-literal `withPrefix('...')` string typo is not caught |
| 3 | `menus.helper.ts` link and permissions | Unchanged | Not proven | Menu->route reachability in a browser |
| 4 | `permission.constant.ts` | Unchanged | `PERMISSIONS.X` keys are checked by tsc | Correct value per route, by the manifest diff |
| 5 | `WithGuard`/`AuthGuard`/`NonLoginGuard` | Guard element and props are retained on every route | Prop-type check only | Redirect behavior (login, 404) in a browser |
| 6 | `useHasPermission` action visibility | Not touched by the split | n/a | Not applicable to the split |
| 7 | Redirects, breadcrumbs, params, relative navigation | `:id`, `:line`, `:screenId`; `Navigate` at `main.routes.tsx:121`; breadcrumbs derived from `menus.helper.ts` | Not proven | Params, breadcrumb text and relative `navigate()` in a browser |
| 8 | Direct link, refresh, missing `location.state`, trailing slash, unauthorized | Same | **Not provable**. `build` proves only that the dynamic `import()` chunks resolve. | Browser checks, including the 3 overlap URLs (`.../product-labels/create`, `/view/create`, `/edit/create`), 404 redirect, and the lazy fallback bar |

There is no test runner (`09-testing.md`), so all runtime behavior is manual.

## 10-13. Dependencies, patterns, risk, regression surface

- Direct consumers of services: 35 files (A3).
- Indirect: the barrels (`promotion/services/index.ts`, `import/services/index.ts`) and the hooks that re-export.
- Cross-domain: `src/redux/slices/version-settings.slice.ts` (Redux imports a service) and `src/service/customer-segment.service.ts` (used by `system/splash-screen` and `system/theme-management`).
- Unknown or dynamic consumers: the graph covers only static imports. Any string-built imports are not provable.
- Pattern classification:
  - A services-only root directory is a new convention and `uncertain` against current rules, which currently require `legacy-compatible` module-local placement.
  - Slices that call `apiFetcher` and `.tsx` direct calls are `legacy-compatible` and stay.
  - Keys-only factories plus hook-assembled queries are `legacy-compatible` per rule 03:135-140.
  - Factories with `queryOptions` are `target-compatible`.
- Risk: **HIGH-RISK** overall (routing, shared-code dependency direction, 136 consumer files under FULL). Isolated service-file moves would be `MODERATE`.
- Regression surface:
  - Every route (190) in direct-link, refresh and unauthorized states.
  - Menu visibility.
  - Redux version-settings flow.
  - Query cache keys (unchanged if the factories keep the same values).
  - Import cycles between the root services directory and `src/modules`.

## 14-16. Recommended change boundary and handoff

- Do the service move and the route split as **two separate changes** with no behavior edits.
- Service move:
  - Move the 22 files as one atomic commit, with consumers' import paths updated in the same commit.
  - Pick MINIMAL or FULL first (`NEEDS-TEAM-DECISION`). MINIMAL leaves 30 import edges into `src/modules` and needs a rule statement on direction. FULL leaves 14 targets (constants, utils, label repositories) that are not in the moved set.
  - Preserve ApiFetcher, endpoint strings, payloads and key values.
  - Do not move: the Redux slices, `.tsx` direct callers, or `select-product.service.ts` unless decided.
  - Resolve the `promotion-type` name collisions by nesting.
  - Confirm `display-set.service.ts` is dead before moving it (no importers).
- Route split:
  - Preserve the manifest (190 routes), the order of `form.routes.tsx:299-355`, `*` last, and the `RouteSuspense` wrapping.
  - Do not touch `PageURLs`, `menus.helper.ts`, `permission.constant.ts` or `src/guards/`.
- Rule edits are listed in section 6.
- Validation needed:
  - `npm install` is needed first (react-router-dom missing), then `typecheck`, `lint` and `build`.
  - A before/after manifest diff.
  - The B13 manual scenarios.

### `NEEDS-TEAM-DECISION` items
1. MINIMAL vs FULL scope, and whether `src/components/select-product-modal/select-product.service.ts` moves.
2. The rule for services importing module-owned types and constants (A3).
3. Where mocks live in the new layout (A4).
4. Whether the product-label repositories (`*-label-repository.ts`, `shared/api-repository.ts`) count as services.
5. The root directory name. `src/service/` already exists (singular) holding `customer-segment.service.ts`.
6. Whether to refresh `CLAUDE.md` and `PROJECT_CONTEXT.md` first, since they describe a different revision.

## Unverified

- `typecheck`, `lint` and `build` were not run (`react-router-dom` is absent from `node_modules`).
- No runtime or browser verification: React Router tie-breaking for the 3 overlapping pairs, `ProductLabelsRouteGate` behavior for the `legacy` action, lazy chunk loading.
- Ambient `src/types/*.d.ts` usage by services with no import edges.
- Dynamic or string-built imports and consumers.
- The 187 permission-entry count is a regex estimate.
- The documented revision `ed18d0c1` could not be inspected, so the differences between the docs and this checkout are explained only by the git history being absent.

## Relevant paths

- `src/routes/index.tsx`, `main.routes.tsx`, `form.routes.tsx`, `pages.tsx`
- `src/service/customer-segment.service.ts`
- `.claude/rules/03-api-service.md` (lines 19-43)
