# Codebase Analysis: post-restructure actual state (2026-10-29)

Static inspection plus `npm run typecheck`. Read-only except this file.

## HEADLINE: the restructure is NOT present in this checkout
The working tree is clean at HEAD, and HEAD is a pre-restructure state. The service and router restructure described in the 2026-10-28 audit/plan is not applied. The audit report named in the task, `docs/audits/architecture/2026-10-28-service-router-restructure-impact.md`, does not exist (`docs/audits/architecture/` did not exist before this file). No branch name matches the restructure. The stashes are unrelated (`git stash list` shows 3). Treat every "applied" assumption in the task as unverified. Re-confirm which branch or worktree holds the restructure before relying on this report.

## 1. Task Understanding
Verify the actual post-restructure state of the services directory and routes. Result: there is no restructure to verify.

## 2. Entry Point / Git state
- Branch: `fĩxbug/vuongnq` (the name contains a non-ASCII `ĩ`). Revision: `cdac9b7b1c4d8ead10601da1e957ee6c2d543803`.
- The 4 most recent commits are fixes to promotion-type and import messages. The 5th is a merge of `refactor/optimize-routes-lazy-loading` (`62a4c1cd`), and the 6th is `6a8d2a96 refactor: reorganize customer segment service and update imports`.
- Only one worktree exists. `git status` is clean.

## 3. Services directory (`src/services/`, confirmed path)
Full tree (2 files):
- `src/services/index.ts` (1 line): `export * from './users/customer-segment.service';`
- `src/services/users/customer-segment.service.ts` (68 lines)

There is one outermost `index.ts`. It re-exports everything from `customer-segment.service` only (it contains `getCustomerSegmentOptions`, used by consumers).
The folder `src/services/users/` has no other files.

Per-module `index.ts` barrels still exist. Under `src/services` there are none beyond the root. Elsewhere, `find src -name index.ts -path '*services*'` finds:
- `src/modules/products/configuration/scheme-sync/import/services/index.ts`
- `src/modules/products/promotion-management/promotion/services/index.ts`

(`find src/modules -name index.ts` gave only 2 results, which are these.) Both are NEEDS DECISION items.

## 4. Filename collisions
- Same-basename `promotion-type.service.ts` exists twice, confirmed:
  - `src/modules/products/promotion-management/services/promotion-type.service.ts`
  - `src/modules/products/promotion-management/promotion-type/services/promotion-type.service.ts`
- They do not collide today because both are module-local. They would collide in a flat `src/services/` layout.
- No other duplicate basenames among the 22 `*.service.ts` files.

## 5. `*.service.ts` outside `src/services/` (21 files left in the old locations)
- `src/components/select-product-modal/select-product.service.ts`
- `src/modules/notifications/configuration/list-notification/services/workflow.service.ts`
- `src/modules/products/configuration/cash-loan/services/cash-loan-product.service.ts`
- `src/modules/products/configuration/credit-card/services/credit-card-product.service.ts`
- `src/modules/products/configuration/display-information-set/services/display-information-set.service.ts`
- `src/modules/products/configuration/product-labels/cash-loan/services/cash-loan-label.service.ts`
- `src/modules/products/configuration/product-labels/credit-card/services/credit-card-label.service.ts`
- `src/modules/products/configuration/scheme-sync/import/services/scheme-import.service.ts`
- `src/modules/products/configuration/scheme-sync/services/scheme-sync.service.ts`
- `src/modules/products/configuration/services/display-set.service.ts`
- `src/modules/products/exclusive-touch/services/exclusive-touch.service.ts`
- `src/modules/products/promotion-management/promotion-type/services/promotion-type.service.ts`
- `src/modules/products/promotion-management/promotion/services/promotion.service.ts`
- `src/modules/products/promotion-management/services/promotion-type.service.ts`
- `src/modules/system/bank-list/services/bank.service.ts`
- `src/modules/system/splash-screen/services/splash-screen.service.ts`
- `src/modules/system/theme-management/background-main-lock/services/background-main-lock.service.ts`
- `src/modules/system/theme-management/background-main/services/background-main.service.ts`
- `src/modules/system/theme-management/topic/services/topic.service.ts`
- `src/modules/system/version-settings/services/version-settings.service.ts`

The `src/modules` find is not empty (19 files there, plus `select-product.service.ts` under `src/components`).

## 6. Consumers
- `from '@/services'`: 2 sites, both for `getCustomerSegmentOptions`: `src/modules/system/splash-screen/hooks/useSplashScreenCustomerSegments.ts` and `src/modules/system/theme-management/background-main/hooks/useBackgroundMainCustomerSegments.hook.ts`.
- 34 files import a `.service'` path. Nearly all use relative paths to module-local services (`../services/x.service`). One uses the absolute path `@/modules/system/version-settings/services/version-settings.service` (`src/redux/slices/version-settings.slice.ts`).
- Only customer-segment follows the root-barrel pattern. This matches commit `6a8d2a96` only.

## 7. Routes (`src/routes/`)
Organized by layout/route type, not by domain:
- `src/routes/index.tsx` 34 lines
- `src/routes/main.routes.tsx` 494 lines
- `src/routes/form.routes.tsx` 1042 lines
- `src/routes/pages.tsx` 262 lines (lazy page declarations)

There is no per-module split.

## 8. Route count and ProductLabelsRouteGate
- `grep -roE "<Route($|[ >/])" src/routes | wc -l` = 190 (unchanged).
- 8 `ProductLabelsRouteGate` usages, split across two files, so they are not grouped in one file:
  - `src/routes/form.routes.tsx`: path declarations at 290, 300, 310, 320, 330, 340, 350. Elements at 294 (list), 304, 314, 324 (legacy), 334 (create), 344 (view), 354 (edit).
  - `src/routes/main.routes.tsx`: path `product-labels/:line` at 476, gate `list` at 480.
- Overlap order (verified by line numbers only):
  - `product-labels/create` (300), `view/:id` (310), `edit/:id` (320) and `:line/create` (330) all appear in `form.routes.tsx`.
  - `product-labels/:line` is in a different file, `main.routes.tsx:476`.
  - Which file's routes are mounted first is determined by `src/routes/index.tsx` (not examined for order). Treat the cross-file overlap order as NEEDS-VERIFICATION.
- I did not verify the `<AuthGuard><RouteSuspense>` wrapping of each gate route.

## 9. Untouched files (current line counts)
- `src/utils/navigate.ts` 563
- `src/helpers/menus.helper.ts` 633
- `src/constants/permission.constant.ts` 329
- `src/guards/`: `index.tsx` 59, `auth.guard.tsx` 28, `non-login.guard.tsx` 17, `RouteLoading.module.scss` 29 (133 total)
- No B12 baseline exists because the audit file is missing. Working tree is clean, so these are unchanged from HEAD.

## 10. Typecheck
`npm run typecheck` (tsc app + node projects) passed with no error output.

## Differences from the 2026-10-28 audit/plan
The audit report is absent, so the comparison rests only on the task's description. All the following are false in this checkout:
- A root services directory containing all services: no, only customer-segment.
- A single root `index.ts` only: no, 2 module-level `services/index.ts` barrels remain.
- Routes organized by module: no, still by layout.
- No leftover old-location services: no, 20 remain in `src/modules` and 1 in `src/components`.

## Needs decision
1. Filename collision: the two `promotion-type.service.ts` files (paths in section 4).
2. Leftover old-location services (20 in `src/modules` plus `src/components/select-product-modal/select-product.service.ts`, listed in section 5). The task says the product-label repositories and `select-product.service.ts` are deliberately excluded. `cash-loan-label.service.ts` and `credit-card-label.service.ts` are services (not repositories) and still sit in module folders.
3. Leftover per-module barrels: `scheme-sync/import/services/index.ts` and `promotion/services/index.ts`.
4. Where the restructure actually lives (branch or worktree). Not found in this checkout.
5. Cross-file ordering of the `product-labels/:line` route against the `form.routes.tsx` routes.

## Unknowns
- The 2026-10-28 audit and plan content was not available.
- Mount order of `main.routes` vs `form.routes` was not traced.
- Whether the guard wrapping on all 8 gate routes is correct was not checked.

## Handoff
Do not proceed on the premise that the restructure is applied. Identify the correct branch or checkout, then rerun this investigation there.
