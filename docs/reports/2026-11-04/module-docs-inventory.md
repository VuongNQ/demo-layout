# Module Documentation Inventory — 2026-11-04

Scope: every top-level entry under `src/modules/`, to scope a module
documentation effort. Read-only; no file under `src/` was modified.

Evidence: re-derived from current source via `find`/`grep`/`git` run directly
in this session, plus five parallel read-only `codebase-analyzer` inventories
(one per module cluster: products; system; users+order; contents+notifications;
blacklist+transactions+humanities-program). Every fact is marked
**CONFIRMED** (read/grepped from source), **LIKELY** (inferred), or
**NEEDS-VERIFICATION** (not settleable by static reading). Counts recorded in
`.claude/PROJECT_CONTEXT.md` were **not trusted** — every number below was
re-run against current source, and section "Disagreements" lists every place
the document's recorded figures no longer match.

## Repository state (CONFIRMED)

| Fact | Value |
| --- | --- |
| HEAD (short) | `8562c125` |
| Branch | `improve/vuongnq` |
| Working tree | clean (`git status --porcelain` empty) |
| `find src/modules -type f \| wc -l` | **919** |

## Top-level entries under `src/modules/`

| Entry | Type | Files | Submodules (own file count) |
| --- | --- | --- | --- |
| `blacklist/` | dir | 3 | none — 3 loose files |
| `contents/` | dir | 61 | `banner/` 23, `popup/` 11, `t&c/` 11, `t&c-place/` 13, + 3 loose top-level files |
| `notifications/` | dir | 32 | `configuration/` 29 (all under `list-notification/`), + 3 loose top-level files |
| `order/` | dir | 21 | `contract-list/` 5, `loan-order-list/` 16 |
| `products/` | dir | 530 | `add-on` 19, `attractive-offer` 13, `configuration` 310, `exclusive-touch` 13, `parameter` 51, `popular-loans` 13, `promotion-management` 69, `simulation` 42 |
| `system/` | dir | 179 | `administrative-unit` 4, `bank-list` 10, `card-management` 10, `ekyc-config` 8, `maintenance` 11, `priority-service` 8, `splash-screen` 25, `system-management` 1, `theme-management` 86, `version-settings` 11, + 5 loose top-level files |
| `transactions/` | dir | 1 | none — 1 loose file |
| `humanities-program.module.tsx` | loose file | 1 (81 B, 3 lines) | n/a |

**Sum check (CONFIRMED):** 3+61+32+21+530+179+1+1 = 828... (see note) — actual
total is 919; the per-module sum above (828) undercounts because
`products/configuration` (310) and `system/theme-management` (86) are already
included in their parent's total. Verified directly: 3+61+32+21+530+179+1 =
827, +1 loose humanities file = **828**. This does not match `find src/modules
-type f` = **919**. Re-checked: `find` counts every file under every
subdirectory already, so 3+61+32+21+530+179+1+1 should equal 919 exactly.
Recounting per-module `find ... | wc -l` directly: blacklist 3, contents 61,
notifications 32, order 21, products 530, system 179, transactions 1 → sum
827, + humanities 1 = **828**, not 919. **NEEDS-VERIFICATION**: there is a
91-file gap between the eight-entry sum (828) and the top-level `find`
(919). The `users/` directory (91 files) was inventoried by an agent but
omitted from the top-level `ls` capture in this report's first pass — adding
it reconciles the total exactly: 828 + 91 = **919**. `users/` is a ninth
top-level entry, confirmed present by `ls src/modules/` and by its own
agent-reported `find src/modules/users -type f | wc -l` = 91.

| `users/` | dir | 91 | `affiliate-partner/` 10, `customer/` 54, `operator/` 26, + 1 loose top-level file (`distributor.user.tsx`) |

Corrected sum: 3 (blacklist) + 61 (contents) + 32 (notifications) + 21 (order)
+ 530 (products) + 179 (system) + 1 (transactions) + 91 (users) + 1
(humanities-program.module.tsx) = **919**. Matches `find src/modules -type f`
exactly. CONFIRMED.

### `products/configuration/` (second level, CONFIRMED, sum = 310)

| Child | Files |
| --- | --- |
| `card-gift-offer` | 10 |
| `cash-loan` | 31 |
| `components/CashLoanCatalogModal` | 5 |
| `credit-card` | 30 |
| `display-information-set` | 17 |
| `group-list-product` | 22 |
| `industry-product` | 30 |
| `installment-loan` | 1 |
| `product-labels` | 78 (cash-loan 17, credit-card 16, shared 38, +7 direct) |
| `required-information` | 12 |
| `required-information-set` | 11 |
| `scheme-sync` | 63 |

### `system/theme-management/` (second level, CONFIRMED, sum = 86)

| Child | Files |
| --- | --- |
| `background-main/` | 27 |
| `background-main-lock/` | 14 |
| `components/` (shared) | 15 |
| `hooks/` | 1 |
| `topic/` | 24 |
| `utils/` | 2 |
| root files (`ThemeConfigurationRedirect.tsx`, `constant.ts`, `ThemePermissionGate.tsx`) | 3 |

**IMPORTANT FINDING:** there is no `theme/` directory and no `theme-lock/`
directory under `theme-management/` in current source (CONFIRMED,
`test -d` checked by the system-module agent). `.claude/rules/01-architecture.md`'s
"Approved Theme Management child-module structure" and several other rule
files (`02-typescript.md`, `03-api-service.md`, `04-state-management.md`,
`06-routing-permission.md`, `07-component.md`, `10-styling.md`) name `theme/`
and `topic/` as the scoped convention's two children, and `.claude/PROJECT_CONTEXT.md`
(as read in this session, dated 2026-10-21/29) describes `theme/`, `topic/`,
and a `theme-lock/` submodule. None of that matches current source: Theme was
apparently renamed/restructured to `background-main/` (with a
`background-main-lock/` sibling replacing `theme-lock/`), and `topic/` is the
only child retaining its original name. This is a **repository-rules
disagreement**, not just a stale-doc one — see "Disagreements" below.

## Routes

**IMPORTANT FINDING, affects every module's route count below:** `src/routes/index.tsx`
is **no longer the monolithic route file** `.claude/PROJECT_CONTEXT.md`
describes (2130 lines / 181 `<Route>` elements). It is now a 34-line shell
that renders `{mainRoutes}` and `{formRoutes}`, imported from two new files:

- `src/routes/main.routes.tsx` (494 lines, 69 `<Route>` elements by the
  reliable pattern)
- `src/routes/form.routes.tsx` (1042 lines, 113 `<Route>` elements)
- `src/routes/pages.tsx` (262 lines, no `<Route>` elements — holds 170
  `lazy()` page-component exports consumed by the two files above)

Reliable counting pattern (CONFIRMED, cross-checked by every subagent and by
this session directly): `grep -oE "<Route($|[ >/])" <file>`. A bare
`grep -c "<Route"` overcounts because it also matches `<RouteContainer` and
`<RouteSuspense`. Total strict `<Route>` elements across all four files:
**190** (`index.tsx` 8 + `main.routes.tsx` 69 + `form.routes.tsx` 113 = 190;
`pages.tsx` contributes 0).

**All page components for every business module now route through
`pages.tsx`'s `lazy()` exports.** Direct `grep "@/modules" src/routes/main.routes.tsx
src/routes/form.routes.tsx` returns **zero** matches — neither file imports a
module page directly; both import only from `./pages`. This reverses
`.claude/PROJECT_CONTEXT.md`'s recorded state entirely (it describes ~138 eager
page imports vs. 21 lazy as of 2026-10-21). See "Disagreements."

Per-module route counts (via `Page={X}` usage in `main.routes.tsx` +
`form.routes.tsx`, mapped back to each `X`'s `lazy()` import target in
`pages.tsx`; cross-checked independently by this session and by the per-module
agents — the two methods agree within rounding):

| Module | Route-page usages | Lazy | Eager |
| --- | --- | --- | --- |
| products | ~75 | 75 | 0 |
| system | 38 | 36 direct lazy + 2 eager wrappers around a lazy page (`ViewVersionSettings`/`EditVersionSettings` in `pages.tsx`) | 0 true eager |
| users | 45 (CONFIRMED usage count; exact `<Route>` element count NEEDS-VERIFICATION) | 22 lazy exports | 0 |
| contents | 19 | 15 confirmed lazy + 4 popup exports not individually re-confirmed (LIKELY lazy) | 0 |
| notifications | 10 | 10 | 0 |
| order | 4 | 4 | 0 |
| blacklist | 3 | 3 | 0 |
| transactions | 1 | 1 | 0 |
| `humanities-program.module.tsx` | 1 | 1 | 0 |

`src/routes/index.tsx` itself carries only the 8 infrastructure routes
(index/login/redirect/404 under `MasterLayout`), none of which resolve into a
business module.

## Redux

| Module | Feature-local slice files | Global slices (owner, registered in `src/redux/slices.ts`) | Middleware |
| --- | --- | --- | --- |
| products | none | `productGroupListSlice`, `productListSlice`, `productAddonSlice`, `industrySlice`, `feeDefinitionSlice`, `productDocumentGroupSlice`, `productDocumentSlice`, `productDocumentSetSlice`, `requiredInformationSlice`, `requiredInformationSetSlice`, `contractTemplateSlice`, `simulationSlice`, `cardPackageSlice` (LIKELY product-owned by name), `cardManagementSlice` | 13 corresponding `configure*Middleware` registrations in `src/redux/store.ts` |
| system | 1: `maintenance/stores/redux/slices/system-maintenance.slice.ts` (`systemMaintenanceSlice`, registered `slices.ts:30/73`) | — | `system-maintenance.middleware.ts` (`configureSystemMaintenanceMiddleware`, registered `store.ts:30/77`) |
| users | none | `customerSlice`, `accountAccessSlice`, `staffSlice`, `groupPermissionSlice`, `affiliatePartnerSlice`, `segmentationCustomerSlice`, `unlockRequestCustomerSlice` | corresponding middleware registered; `access-account.middleware.ts` registration **NEEDS-VERIFICATION** |
| order | none | `loanOrderSlice`, `contractSlice` | `loan-order.middleware.ts`, `contract.middleware.ts`, both registered |
| contents | none | `bannerSlice`, `popupSlice`, `contentTandCSlice`, `tandcPlaceSlice` (ownership LIKELY by name match) | `banner.middleware.ts`, `popup.middleware.ts`, `content-tandc.middleware.ts`, `tandc-place.middleware.ts` (existence CONFIRMED; store registration NEEDS-VERIFICATION) |
| notifications | none | `notificationListSlice` (LIKELY owner); `notificationSlice` registered but its consumer-by-notifications status is NEEDS-VERIFICATION | — |
| blacklist | none | none | none |
| transactions | none | none | none |
| humanities-program | none | none | none |

Repo-wide (this session, CONFIRMED): `src/redux/slices.ts` is 83 lines with 39
slice registrations (pattern `Slice,`); `src/redux/store.ts` is 111 lines.
`.claude/PROJECT_CONTEXT.md` recorded 40 (then 41) slices / 33–34 middleware as
of 2026-10-21/29 — current count (39) is close but not identical; exact
middleware count was not independently re-derived this session
(**NEEDS-VERIFICATION**).

## TanStack Query

Repo-wide (CONFIRMED, this session): `grep -rl "@tanstack/react-query" src/`
= **66 files** (was 28 at the 2026-10-21 snapshot — more than doubled).

| Module | Files importing `@tanstack/react-query` | `hooks/`/`queryKeys/` dirs |
| --- | --- | --- |
| products | 37 | 22 (`cash-loan`, `credit-card`, `display-information-set`, `product-labels/{cash-loan,credit-card,shared}`, `scheme-sync` + `scheme-sync/import`, `exclusive-touch`, `promotion-management/{promotion,promotion-type}`) |
| system | 22 | `bank-list`, `splash-screen`, `theme-management/{background-main,background-main-lock,topic}` (5 `queryKeys/`, 6 `hooks/`) |
| contents | 1 (`banner/simulation/simulationModalContent.tsx`) | `banner/hooks/` (no `queryKeys/`); shared cross-module key factory at `src/queryKeys/contents/banner-simulation.query-keys.ts` |
| notifications | 0 | `configuration/list-notification/hooks/` exists but has no TanStack import |
| users | 0 | none |
| order | 0 | none |
| blacklist / transactions / humanities-program | 0 | none |

## Service files

| Module | Feature-local `*.service.ts` (LEGACY-COMPATIBILITY) | Corresponding `src/services/<module>/` |
| --- | --- | --- |
| products | 6: `cash-loan`, `credit-card`, `display-information-set`, `product-labels/{cash-loan,credit-card}`, `exclusive-touch` | `src/services/products/` — 9 files: `index.ts`, `promotion-type.service.ts`+`.types.ts`, `promotion.service.ts`+`.types.ts`, `scheme-import.service.ts`+`.types.ts`, `scheme-sync.service.ts`+`.types.ts` |
| system | 6: `bank-list`, `splash-screen`, `theme-management/{background-main,background-main-lock,topic}`, `version-settings` | none — `src/services/system/` does not exist |
| users | 0 | `src/services/users/` — 1 file: `customer-segment.service.ts` |
| order | 0 | none — `src/services/order/` does not exist |
| contents | 0 (the only `*service*` match, `advertisement-service.content.tsx`, is a placeholder page, not a service) | `src/services/contents/` — 1 file: `banner-simulation.service.ts` |
| notifications | 1: `configuration/list-notification/services/workflow.service.ts` | none |
| blacklist / transactions / humanities-program | 0 | none |

Repo-wide (CONFIRMED, this session): `find src/modules -name "*.service.ts"`
= 13 files; `src/services/` holds 12 files across `contents/`, `products/`,
`users/` plus the root `index.ts` barrel. This is a large jump from the
2026-10-29 PROJECT_CONTEXT snapshot, which recorded exactly one migrated
service (`users/customer-segment.service.ts`). See "Disagreements."

## Permission constants

Path confirmed by `find src/constants -iname "*permission*"`:
**`src/constants/permission.constant.ts`** (329 lines; this session counted
187 `PERMISSIONS.*` key declarations via line pattern — up from 177 in the
2026-10-21 snapshot).

| Module | Distinct `PERMISSIONS.*` referenced in module source | Notable prefixes |
| --- | --- | --- |
| products | 73 | `PRODUCT_*` 35, `CONTRACT_*` 12, `DOCUMENT_*` 10, `REQUIRED_*` 8, `SIMULATION_*` 2, `PROMOTION_*` 2, `DISPLAY_*` 2, `ADD_ON_*` 2 |
| system | 19 | `THEME_*` (6), `THEME_CATEGORY_*` (3), `SPLASH_SCREEN_*` (3), `VERSION_SETTINGS_*` (2), plus one each for administrative-unit, bank, ekyc, card-service, segment, maintenance |
| users | 12 (in-module); more at route level | `STAFF_*`, `ROLE_*`/`USER_*`, `CUSTOMER_*`, `UNLOCK_REQUEST_*`, `CUSTOMER_SEGMENT_*`, `ASSOCIATED_PARTNER_*` |
| order | 8 | `CONTRACT_{VIEW,EXPORT_CSV}_{CASH_LOAN,CREDIT_CARD}`, `APPLICATION_{VIEW,EXPORT_CSV}_{CASH_LOAN,CREDIT_CARD}` |
| contents + notifications | ~29 distinct observed, not split per module (cross-module overlap) | `AUTO_NOTIFICATION_*`, `SETTING_NOTIFICATION_*`, `POPUP_SETTING_*`, `BANNER_SETTING_*`, `TNC_*` — `AUTO_NOTIFICATION_*`/`SETTING_NOTIFICATION_*` are shared between contents (T&C-adjacent) and notifications |
| blacklist / transactions / humanities-program | 0 — routes use `AuthGuard` only, no permission array | — |

## Styling (`.module.scss` and Emotion)

Repo-wide (CONFIRMED, this session): `find src -name "*.module.scss"` = **73**
files (up from 25 in the 2026-10-21 snapshot).

| Module | `.module.scss` count | Emotion (`@emotion/react` importers) |
| --- | --- | --- |
| products | 37 | 178 |
| system | 21 | 41 |
| contents | 0 | 27 |
| notifications | 0 | 15 |
| users | 0 | 60 |
| order | 0 | 19 |
| blacklist / transactions / humanities-program | 0 | 0 |

All modules except products/system still use Emotion/inline styles
exclusively — legacy-compatible per `.claude/rules/10-styling.md`.

## Placeholder vs. real implementation

| Module | Placeholders (file path, content) |
| --- | --- |
| blacklist | `devices.blacklist.tsx`, `identification.blacklist.tsx`, `portrait.blacklist.tsx` — each 3 lines, static text only |
| transactions | `list.transaction.tsx` — 3 lines, static text |
| humanities-program | `humanities-program.module.tsx` — 3 lines, static text |
| contents | `advertisement-service.content.tsx`, `faq.content.tsx`, `contact-info.content.tsx` — each 3 lines, static text |
| notifications | `general.notification.tsx`, `automatic.notification.tsx`, `setup.notification.tsx` — each 3 lines, static text |
| system | `display.system.tsx`, `integration.system.tsx`, `company.system.tsx` — each 3 lines, static text. **New finding:** `maintenance.settings.tsx` (2 lines, static text) exists but is an **orphan** — nothing in `src/` imports it; `pages.tsx` imports the real `maintenance/view/form` and `maintenance/edit/form` instead |
| users | `distributor.user.tsx` — 3 lines, static text, routed with no permission array and a `//Chưa biết` ("unknown") comment |
| products | `parameter/condition-list.parameter.tsx`, `parameter/input-form-list.parameter.tsx` — each 3 lines, static text. Several other ≤12-line files were listed but not content-verified (NEEDS-VERIFICATION) |
| order | none found |

## Existing documentation under `docs/modules/`

(`docs/*` is gitignored — confirmed via `.gitignore:34`; these files are
untracked and exist only in this checkout.)

| Path | Recorded revision/date |
| --- | --- |
| `docs/modules/products/OVERVIEW.md` | "as of 2026-10-02" (stale — products has grown from 312→401→530 files since) |
| `docs/modules/products/product-configuration.md` | no date found |
| `docs/modules/products/add-ons.md`, `card-gift-offers.md`, `documents-and-contracts.md`, `fees.md`, `popular-loans.md`, `product-labels.md`, `required-information.md`, `simulation.md` | no date found |
| `docs/modules/products/scheme-sync-import-plan.md` | "as of export 2026-10-22" |
| `docs/modules/products/products-loan-excel-import-api.md` (renamed 2026-11-04 from `# API Import Excel sản phẩm vay — tài li.md`; see `docs/reports/2026-11-04/docs-restructure.md` `## Cleanup pass`) | 2026-10-22 |
| `docs/modules/products/product-configuration/industry-product.md` | "Source snapshot: 2026-10-05" |
| `docs/modules/products/product-configuration/product-line-form-refactor-feasibility-analysis.md`, `product-line-hidden-fields-impact-analysis.md` | no date found |
| `docs/modules/system/theme-management/REACT_QUERY_GUIDE.md` | "Ngày viết: 2026-10-14", revision `875eea94` — **describes the now-renamed `theme/`/`topic`/`theme-lock` structure; `theme/` and `theme-lock/` no longer exist** |
| `docs/modules/system/theme-management/topic-api.md` | no revision header found |

No documentation exists under `docs/modules/` for: `users`, `order`,
`contents`, `notifications`, `blacklist`, `transactions`,
`humanities-program`, or any `system` submodule other than
`theme-management` (and even that doc set describes a now-superseded
structure).

## Disagreements with `.claude/PROJECT_CONTEXT.md`

The read PROJECT_CONTEXT snapshot is dated 2026-10-21 (source `ed18d0c1`),
with a 2026-10-29 service-location addendum. Current source (`8562c125`,
branch `improve/vuongnq`) disagrees on:

1. **Route file structure (HIGH-RISK to any future routing work):**
   PROJECT_CONTEXT describes one monolithic `src/routes/index.tsx`
   (2130 lines / 181 `<Route>` elements, ~138 eager imports vs. 21 lazy). It
   is now split into `index.tsx` (34 lines, 8 infra routes),
   `main.routes.tsx` (494 lines, 69 routes), `form.routes.tsx` (1042 lines,
   113 routes), and `pages.tsx` (262 lines, 170 `lazy()` exports, zero
   `<Route>` elements). **Every business page is now lazy** — the eager/lazy
   split PROJECT_CONTEXT records no longer exists at all. A
   `docs/audits/architecture/2026-10-28-service-router-restructure-impact.md`
   report already exists in this checkout and appears to document this
   change, but was not read in full by any agent in this pass.
2. **Theme Management child-module naming:** `.claude/rules/01-architecture.md`'s
   "Approved Theme Management child-module structure" and four other rule
   files name `theme/` and `topic/` as the convention's two children, and
   PROJECT_CONTEXT additionally describes a `theme-lock/` submodule. Current
   source has **no `theme/` directory and no `theme-lock/` directory** —
   only `topic/`, plus `background-main/` and `background-main-lock/`
   (apparently Theme's and theme-lock's replacements). The scoped convention
   rule text is stale against current source.
3. **File counts, every module grew:** total `src/modules` files 919 vs. 772
   recorded (eight-domain sum was 771); products 530 vs. 401; system 179 vs.
   162; contents 61 vs. 60. `users`, `order`, `blacklist`, `transactions`
   file counts (91/21/3/1) are unchanged from the snapshot.
4. **Service migration progressed well beyond the 2026-10-29 snapshot:**
   PROJECT_CONTEXT records exactly one migrated service
   (`src/services/users/customer-segment.service.ts`). Current source has
   12 files under `src/services/` across `contents/`, `products/`, `users/`
   — `products/` alone gained `promotion-type`, `promotion`, `scheme-import`,
   and `scheme-sync` service+types pairs (8 files), consistent with the
   recent `git log` commits about relocating/reorganizing promotion types.
5. **TanStack Query ownership more than doubled:** 66 files import
   `@tanstack/react-query` repo-wide vs. 28 recorded.
6. **`.module.scss` tripled:** 73 files vs. 25 recorded.
7. **Permission constants and `PageURLs` grew:** 187 permission entries vs.
   177; `PageURLs` builders 118 vs. 105 (this session's own grep of
   `src/utils/navigate.ts`).
8. **Zod importers grew:** `grep -rl "from 'zod'"` = 6 files vs. 3 recorded
   (theme-lock's non-Zod validator util is presumably one of the "non-joiners"
   previously noted; the new count was not broken down by file in this pass —
   **NEEDS-VERIFICATION**).
9. **A new orphan placeholder exists:** `src/modules/system/maintenance.settings.tsx`
   is unrouted and unreferenced anywhere in `src/` — not previously recorded
   in PROJECT_CONTEXT.
10. **Redux slice count is close but not identical:** 39 registered slices
    this session vs. 40 (then 41) recorded; exact middleware count was not
    independently re-derived (**NEEDS-VERIFICATION**).

## Limitations

- Exact `<Route>`-element counts per module (vs. the `Page={X}` usage counts
  reported) are **NEEDS-VERIFICATION** for products, system, users, order,
  and contents — multi-line JSX and non-`Page=` route forms made a fully
  reliable per-element count impractical within this pass's time budget; the
  usage-count method and the independent cross-check in this session agree
  closely (e.g. products ~75 both ways).
- Several per-module Redux middleware store-registration checks, the
  `access-account.middleware.ts` registration, and `notificationSlice`'s
  consumer status are **NEEDS-VERIFICATION**.
- Placeholder scanning for `products` and `users` was line-count-threshold
  based (≤12 lines) with only a sample of borderline files content-verified;
  a handful of short files remain unclassified.
- No `npm run typecheck`/`lint`/`build` was run — this is a static
  inventory only.
- Two background-task Bash calls inside subagents were rejected by a local
  auto-mode hook (unrelated to this report's content); affected checks were
  re-run cleanly and are reflected above.

---

Absolute path of this report:
`/Users/nguyen.quoc-vuong3/001-hds-admin-clone/docs/reports/2026-11-04/module-docs-inventory.md`
