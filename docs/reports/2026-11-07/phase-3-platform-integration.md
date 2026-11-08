# Phase 3 — Platform integration

**Author:** Vuowng

**Date:** 2026-11-07

**Checkout:** `E:\demo-layout`, branch `feat/playground-compare`, revision `f357bcb82872768a1e3d02bebd96208b94ddd720`. Phase 1 and Phase 2 changes were already uncommitted in this checkout and were preserved.

## 1. Source inventory

**Verified current source:** `AGENTS.md`, the platform-routing, design-system-ui and compare-workflow skills, `package.json`, `src/App.tsx`, root/legacy routes, Claude route and menu metadata, ChatGPT route/menu/layout/theme modules, Compare workspace/scenarios/records, Vite base, SPA fallback and Pages workflow. Read the copied Design System index and Phase 1, Phase 2, T3 Compare and worktree audit reports. Reports are historical evidence, not proof of current behavior. Read-only `routing-architect` and `ui-reviewer` reviews identified stale Compare availability/copy and the need for discoverable platform navigation. No other root-router owner was visible in the inspected working tree; no worktree operation was performed.

**Preconditions verified:** Claude has 31 metadata paths and lazy page implementations; ChatGPT exports `chatgptRoutes`; Compare exports `compareRoute`; the preexisting uncommitted Phase 1/2 changes were preserved. Two stale nested worktree registrations remain unchanged.

## 2. Files changed

- Root integration: `src/routes/router.tsx`; new `src/routes/PlatformSelectionPage.tsx`, `PlatformSelectionPage.module.scss`, `PlatformLinks.tsx`, `PlatformLinks.module.scss`.
- Minimal platform switching: `src/layouts/AppLayout.tsx`, `src/chatgpt/layout/ChatGPTLayout.tsx`, `src/compare/CompareWorkspace.tsx`.
- Compare routing and destination accuracy: new `src/compare/route-config.ts`; updated `src/compare/index.ts`, `src/compare/scenarios.ts`, `src/compare/CompareWorkspace.tsx`.
- This report. No app provider, Claude route tree, Claude navigation metadata, legacy redirects, business forms/data, profiles, Design System docs, deployment config or package dependencies were changed in this phase.

## 3. Root route composition

`src/routes/router.tsx` now composes the landing at `/`, `claudeRoutes`, `chatgptRoutes`, `compareRoute`, then the explicit legacy Claude redirect routes. It retains `basename: import.meta.env.BASE_URL`. Root composition imports platform route objects, not page implementations. Matching-critical `path`, `index` and child topology remain static in platform-owned route modules.

The existing root redirect was replaced only at `/`. `src/routes/legacy-redirects.tsx` was not changed. `/claude` still has its own index redirect to Offer Types; unscoped legacy patterns still replace-redirect to `/claude` with concrete path parameters, search and hash.

## 4. Platform ownership boundaries

Claude retains `src/claude/routes/` and `src/claude/navigation/`, its existing layout/theme behavior and all feature pages. ChatGPT retains `src/chatgpt/routes/`, navigation, nested `ConfigProvider`, local color mapping and SCSS Modules. Compare owns its scenario records and now owns a static `route-config.ts` whose three implementations load with `route.lazy` from `CompareWorkspace.tsx`. The root does not duplicate platform path definitions. `src/App.tsx` and its existing global provider were untouched.

## 5. Landing and platform navigation

The new `/` page gives three accessible links and brief descriptions for Claude, ChatGPT and Compare, using fictional content. A small shared `PlatformLinks` navigation appears in the Claude header, ChatGPT top bar and Compare header. It offers Landing, Claude, ChatGPT and Compare destinations without adding a shared theme or form owner. The Claude header gained flexible wrapping so links can coexist with its existing controls; browser layout remains unverified.

## 6. Route compatibility matrix

| Current destination | Evidence and outcome |
| --- | --- |
| `/` | Landing page route, replacing only temporary root redirect |
| `/claude`, `/claude/offer-types` | Claude index redirect and existing list; 31 Claude page implementations remain lazy |
| `/chatgpt`, `/chatgpt/showcase` | Relative ChatGPT tree; index overview and showcase lazy pages |
| `/compare`, `/compare/:scenarioId` | Relative Compare tree; index and valid scenario IDs match static child routes; unknown IDs render the existing not-found state |
| Legacy `/offer-types`, `/offer-types/create`, `/offer-types/:id`, `/offer-types/:id/edit` | Explicit redirects retain list, child drawers and sibling full page |
| Legacy `/background-locks/:id`, `/promotion-types/create`, `/promotion-types/:id`, `/experiments/unsaved-changes/edit` | Explicit redirects retain child drawer topology and existing close/guard behavior |
| Other 23 legacy screen patterns | Product Sync, Product Settings, Fees, Promotions, Required Information, Display Information Sets, Add Ons, three single-config pages, experiment parents and decision notes retain their exact metadata-derived redirects |

The full 31-pattern before/after matrix is in the Phase 1 report. A current static audit found 31 unique Claude metadata paths, 31 lazy route implementations, and the unchanged explicit redirect map. The redirect component still passes `pathname`, `search`, and `hash` to `<Navigate replace />`. This is static evidence; direct-link behavior in a browser remains unverified.

## 7. Compare destination availability matrix

| Scenario ID | Claude | ChatGPT |
| --- | --- | --- |
| `drawer-vs-full-page` | `/claude/offer-types/offer-1` available; legacy `/offer-types/offer-1` retained | Matching Offer Types screen unavailable |
| `unsaved-changes` | `/claude/experiments/unsaved-changes` available | Matching experiment unavailable |
| `reorder-pagination` | `/claude/experiments/reorder-pagination` available | Matching experiment unavailable |
| `tabs-vs-anchor` | `/claude/experiments/tabs-vs-anchor` available | Matching experiment unavailable |
| `contextual-save` | `/claude/product-settings/product-1` available | Matching Product Settings screen unavailable |

All five Claude scenario destinations are marked `available` and linked canonically. Their `claudeCurrentUrl` fields remain as legacy-compatible URLs and CSV columns for handoff continuity. All five ChatGPT business destinations remain `unavailable`; the existence of its overview and showcase does not imply those scenarios exist. Compare scenario IDs, criteria, independent notes, `compare-workspace:v1:` localStorage namespace, CSV headers/export and decision status semantics were preserved. CSV availability now reflects mounted Claude routes.

## 8. Lazy-loading and build evidence

The installed React Router 7.1.1 route objects use static matching keys and lazy implementation properties. The production build emitted distinct `ChatGPTOverviewPage`, `ChatGPTShowcasePage`, `CompareWorkspace` and Claude page JS/CSS chunks. Root composition has no eager import of any platform page implementation. ChatGPT's route-local error and pending feedback remain in place; Claude and Compare retain their existing default route error/loading behavior. No global error/loading treatment was added.

## 9. Validation commands and results

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed (`tsc --noEmit`) |
| `npm run build` | Passed (Vite 8.3.5, 3155 modules transformed, SPA fallback written) |
| `git diff --check` | Passed after removing an extra EOF blank line; Git printed LF-to-CRLF conversion notices for existing Compare files, not whitespace errors |
| Static route audit | Root lists landing + three platform exports + legacy redirects; 31 Claude paths/31 lazy pages, two ChatGPT lazy pages, three Compare lazy route components; five Claude scenarios available and five ChatGPT scenarios unavailable |
| Pages output | `dist/index.html` uses `/demo-layout/assets/...`; `fc /b dist\index.html dist\404.html` reported no differences. Vite base, build fallback script and Pages workflow were not changed. |

## 10. Browser checks

**NOT VERIFIED:** No usable browser automation was available. `/` rendering, all direct routes and refresh, Back/Forward, legacy redirect suffixes, drawer open/close, unsaved-changes guard, ChatGPT Select popup containment, form error focus, Compare localStorage/CSV interaction, keyboard navigation and responsive layout were not exercised in a browser. TypeScript, static route inspection and a build do not substitute for that proof.

## 11. Risks and regressions

- Platform links add content to the Claude header. Wrapping was enabled, but narrow viewport and collapsed sidebar behavior need rendered inspection.
- Compare's `approved` status remains selectable as a browser-local record without enforced owner/date/rationale/evidence. This was preexisting behavior and should not be interpreted as team approval. CSV is a handoff artifact, not durable shared governance.
- Compare's lazy route now loads one workspace chunk for layout/index/detail; data records and decision semantics are unchanged. Initial-load and navigation feedback need browser review.
- ChatGPT's nested provider and trigger-based popup container remain scoped in source, but actual portal placement and cross-platform style isolation were not rendered.
- Pages compatibility is supported by static basename and fallback evidence; deployed deep links remain unverified.

## 12. NEEDS-TEAM-DECISION

- Decide whether Compare must enforce owner/date/rationale/evidence before a local record can be marked `approved`, and who has authority to approve a production decision.
- Decide whether Claude and Compare need explicit route-level loading/error presentation to match ChatGPT's local handling after browser review.
- Confirm final platform-switcher placement and narrow-screen behavior from rendered tests before treating this as a settled navigation pattern.
