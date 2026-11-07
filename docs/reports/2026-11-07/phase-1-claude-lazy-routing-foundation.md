# Phase 1 — Claude lazy routing foundation

**Author:** Vuowng

**Date:** 2026-11-07

**Checkout:** `E:\demo-layout`, branch `feat/playground-compare`, starting revision `f357bcb82872768a1e3d02bebd96208b94ddd720`

**Method:** Current-source inspection, a read-only routing architecture review, static route checks, TypeScript and production build. No browser session, commit, push or deployment.

## Source inventory

**Verified current source:** `AGENTS.md`, `.agents/skills/platform-routing/SKILL.md`, `package.json`, `src/routes/router.tsx`, `src/App.tsx`, `src/menu/menu-tree.ts`, `src/layouts/`, route pages in `src/features/`, `src/experiments/` and `src/pages/`, `vite.config.ts`, `scripts/spa-fallback.mjs`, and `.github/workflows/deploy-pages.yml`. The installed dependency is React Router DOM 7.1.1; its local types support `RouteObject.lazy` with static matching keys. The current branch was clean before edits. Git still lists two stale, prunable registrations under `.worktrees/`; no worktree operation was performed.

**Historical specification:** `hds-admin-next-design-playground-plan.md` was read. `parallel-t1-routing.md` is absent from this checkout. The earlier T1/T2 implementations were not recovered or assumed. A read-only `routing-architect` review independently confirmed the route topology, exact-match menu behavior, navigation callers and Pages setup; it did not execute a browser.

## Before and after architecture

| Concern | Before | After |
| --- | --- | --- |
| Root router | One eager route tree and `AppLayout` at `/` | Root composition only: `/` redirect, Claude tree, explicit legacy redirects |
| Claude pages | Unscoped, eagerly imported | `/claude/*`, `route.lazy` page implementations |
| Paths | Repeated in router, menu and feature links | Claude route metadata supplies matching paths and `claudePath()` destinations |
| Menu and breadcrumbs | Exact-match `menu-tree.ts` | Same tree and exact-match helpers owned by `src/claude/navigation/menu-meta.ts`; old module re-exports for layout compatibility |
| Legacy URLs | Rendered directly | Explicit patterns redirect to equivalent Claude paths with `replace` |
| Other platforms | Compare source exists but no route mounted | `/chatgpt` and `/compare` remain unmounted in this phase |

`src/App.tsx` and its Ant Design theme/provider were unchanged. No feature implementation was moved. The root index and `/claude` index temporarily redirect to `/claude/offer-types`; both retain search and hash.

## Files changed

- Added `src/claude/routes/{index.ts,route-config.tsx,route-meta.ts}` and `src/claude/navigation/menu-meta.ts`.
- Added `src/routes/legacy-redirects.tsx`; reduced `src/routes/router.tsx` to root composition.
- Changed `src/menu/menu-tree.ts` to a compatibility re-export for existing layout imports.
- Updated only route destinations in the affected `src/features/` list, edit and drawer pages, `src/pages/DecisionsPage.tsx`, and the unsaved-changes route drawer. No forms, validation, data, localStorage keys, theme or global styles were changed.

## Platform route metadata contract and lazy loading

`ClaudeRouteMeta` has a stable `id`, `relativePath`, `title`, optional `navigationGroup` and `breadcrumbLabel`, and `menuVisible`. There are 31 entries. `claudePath(id, params)` generates `/claude/` paths and encodes dynamic parameter values. The menu tree keeps its existing hierarchy, permissions, labels and icon keys, while deriving its 17 leaf destinations through `claudePath()`. Full-page edit and drawer routes remain absent from the menu, preserving their intentional breadcrumb gaps. Sidebar selection still compares `location.pathname` with a leaf path; the Claude leaf paths now match that pathname.

The Claude route tree references metadata paths synchronously. Child path segments are derived from parent/child metadata entries. Each of the 31 page route entries has `route.lazy` with a dynamic import of the existing named page component. No feature page is eagerly imported by the root router, route metadata, menu metadata or barrel export. React Router resolves the lazy route implementation during data-router navigation; no additional `React.lazy`/`Suspense` layer or route-level loading component was added. Existing page-level query skeletons and React Router's default route error handling remain in place. A page import failure therefore uses React Router's default error behavior; a designed loading/error boundary is a later decision.

## Legacy route compatibility matrix

All paths below are relative to the existing router basename, normally `/demo-layout/`. The redirect module creates one explicit legacy route object per metadata path. It uses the concrete `useLocation().pathname` with `/claude` prefixed and passes through `search` and `hash`, so `:id` values and URL suffixes are retained. This is static implementation evidence, not a browser result.

| Legacy path | Claude destination | Topology |
| --- | --- | --- |
| `/` | `/claude/offer-types` | Temporary entry redirect |
| `/offer-types` | `/claude/offer-types` | List |
| `/offer-types/create` | `/claude/offer-types/create` | Child drawer |
| `/offer-types/:id` | `/claude/offer-types/:id` | Child drawer |
| `/offer-types/:id/edit` | `/claude/offer-types/:id/edit` | Sibling full page |
| `/product-sync` | `/claude/product-sync` | Page |
| `/product-settings` | `/claude/product-settings` | List |
| `/product-settings/:id` | `/claude/product-settings/:id` | Full page |
| `/background-locks` | `/claude/background-locks` | List |
| `/background-locks/:id` | `/claude/background-locks/:id` | Child drawer |
| `/fees` | `/claude/fees` | List |
| `/fees/:id` | `/claude/fees/:id` | Full page |
| `/promotions` | `/claude/promotions` | List |
| `/promotions/create` | `/claude/promotions/create` | Full page |
| `/promotions/:id/edit` | `/claude/promotions/:id/edit` | Full page |
| `/promotion-types` | `/claude/promotion-types` | List |
| `/promotion-types/create` | `/claude/promotion-types/create` | Child drawer |
| `/promotion-types/:id` | `/claude/promotion-types/:id` | Child drawer |
| `/required-information` | `/claude/required-information` | List |
| `/required-information/:id` | `/claude/required-information/:id` | Full page |
| `/display-information-sets` | `/claude/display-information-sets` | List |
| `/display-information-sets/:id` | `/claude/display-information-sets/:id` | Full page |
| `/add-ons` | `/claude/add-ons` | List |
| `/add-ons/:id` | `/claude/add-ons/:id` | Full page |
| `/popular-loans` | `/claude/popular-loans` | Page |
| `/attractive-offer` | `/claude/attractive-offer` | Page |
| `/exclusive-touch` | `/claude/exclusive-touch` | Page |
| `/experiments/unsaved-changes` | `/claude/experiments/unsaved-changes` | Experiment |
| `/experiments/unsaved-changes/edit` | `/claude/experiments/unsaved-changes/edit` | Child drawer |
| `/experiments/reorder-pagination` | `/claude/experiments/reorder-pagination` | Experiment |
| `/experiments/tabs-vs-anchor` | `/claude/experiments/tabs-vs-anchor` | Experiment |
| `/decisions` | `/claude/decisions` | Decision notes |

`/claude` also redirects to `/claude/offer-types`, preserving search and hash. No wildcard legacy redirect was added; unknown paths are not silently treated as Claude screens.

## Navigation and drawer compatibility evidence

The current route tree nests Offer Types create/detail, Background Locks detail, Promotion Types create/detail and unsaved-changes edit under their list/experiment parents. Offer Types `:id/edit` remains a sibling. Static comparison of the original route declarations with the new metadata found 31 expected screen patterns, zero missing or extra, and exactly one lazy declaration per metadata ID. All six drawer child IDs are declared via `child(...)`; the sibling edit uses `path(...)` at the Claude layout level.

Feature `Link` and `navigate()` destinations and `DecisionsPage` links now use `claudePath()`. Offer Types, Background Locks and Promotion Types drawers close to their Claude list routes. The unsaved-changes drawer continues to navigate Back after an in-app open; on a direct entry with no router history index it navigates to the Claude experiment parent. Its unsaved-changes guard still intercepts a navigation request. The history-index fallback is an implementation inference and needs browser verification, especially after redirects and Back/Forward.

## Validation results

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed (`tsc --noEmit`) |
| `npm run build` | Passed (`tsc --noEmit`, Vite 8.3.5, fallback copy); output includes distinct page chunks such as `OfferTypeListPage`, `OfferTypeDrawerRoute`, `ProductSyncPage` and experiment pages |
| `git diff --check` | Passed for tracked changes |
| Static metadata/route audit | 31 expected paths, 31 metadata entries, 31 route IDs used once, 31 lazy declarations, six child drawers, sibling full-page edit, 17 valid menu leaf IDs; no eager feature import in root/Claude metadata/menu modules |
| Pages asset/fallback audit | `vite.config.ts` still defaults to `/demo-layout/`; router still uses `import.meta.env.BASE_URL`; built `dist/index.html` uses `/demo-layout/assets/...`; `fc /b dist\index.html dist\404.html` found no differences; Pages workflow still uploads `dist` |
| Browser navigation | Not run. No usable browser automation was available; `where chrome` and `where msedge` found no executable. A Vite SSR diagnostic attempt also failed while loading the local Tailwind native dependency and spawning a child process, so it supplied no route runtime proof. |

## Risks and unverified behavior

- Static route and build checks do not prove direct Pages deep links, legacy redirects, drawer close, Back/Forward, refresh, scroll/focus behavior, or the unsaved-changes guard in a browser. Those should be exercised at `/demo-layout/` before deployment.
- `route.lazy` adds an asynchronous page-code fetch. The build proves chunks exist, but loading and import-error presentation were not visually inspected.
- The unsaved-changes direct-entry fallback relies on React Router's browser history index. Browser tests should confirm it after a legacy redirect and after normal in-app navigation.
- Stale nested worktree registrations and absent T1/T2 source are unrelated to this implementation. They were not touched.

## NEEDS-TEAM-DECISION

- Decide whether a designed route-level loading/error boundary is needed before the playground expands beyond Claude. The current phase preserves existing page loading behavior and uses React Router's default route error handling.
- Decide the later root landing, ChatGPT and Compare composition contract when those phases are authorized. This phase deliberately leaves them unmounted.
