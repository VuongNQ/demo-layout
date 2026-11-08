# Phase 8E — Scenario 1 ChatGPT Routing Consolidation

Author: Vuowng

Date: 2026-11-08

Repository: VuongNQ/demo-layout

Branch: feat/playground-compare

Revision: 981bfa707945cc2b03f17ab7504ea545c3af83cf

Worktree: E:\demo-layout

## 1. Scope and authoritative platform decision

**User decision:** all four Scenario 1 pilot experiences belong exclusively to ChatGPT routing. The pilot behaviors must not remain mounted as Claude pilot implementations. Existing Claude behavior that predates Phases 8A–8D must remain available.

This change moves pilot page composition and routes to ChatGPT, removes the Product Label pilot from Claude, and restores Claude Promotion Type and Promotion Offer components to their checked-in baseline. It does not redesign the four patterns.

**Evidence boundary:** the current checkout was the implementation source of truth. Reports were used as historical context and compared with source. Jobs-to-home was not opened or modified in this task; no production contract is inferred.

## 2. Verified source and working-tree baseline

- `git branch --show-current`: `feat/playground-compare`.
- `git rev-parse HEAD`: `981bfa707945cc2b03f17ab7504ea545c3af83cf`.
- Root/worktree: `E:\demo-layout`.
- Initial checkout had uncommitted Phase 8B/8C/8D UI and i18n work, plus untracked Phase 8B–8D reports, feature helpers, and focused scripts. These pilot changes were retained in ChatGPT-owned view files and namespace resources before Claude source was restored.
- `git worktree list --porcelain` showed this root worktree and two pre-existing prunable registrations under `E:\demo-layout\.worktrees\feat-playground-chatgpt` and `E:\demo-layout\.worktrees\feat-playground-routing`. They were not operated on or changed.
- The repository provides `routing-architect` and `ui-reviewer` definitions in `.codex/agents/`, and the three requested skills in `.agents/skills/`. The skills and agent contracts were inspected. No subagent review was run in this execution.
- React Router remains 7.1.1. Available package scripts are `dev`, `typecheck`, `build`, and `preview`.

**Historical evidence:** the Scenario 1 UX Contract identifies `drawer-vs-full-page`, seven criteria, and the four pilots. Phase 8A–8D reports describe earlier Claude-mounted pilot behavior but are not treated as proof of current behavior.

## 3. Claude versus ChatGPT ownership inventory

| Area | Before this change, verified in current source | Resulting owner |
| --- | --- | --- |
| Product Label | Phase 8A list, fixture, utility, and nested drawer were registered under Claude. | ChatGPT route tree and ChatGPT UI; fictional fixture and deterministic utility remain in the domain feature folder. No Product Label route remains in Claude. |
| Promotion Type | Pre-existing Claude list/create/detail routes existed; uncommitted Phase 8B had enhanced those Claude view files. | ChatGPT owns the Phase 8B Quick Edit pilot view and route. Claude routes remain and their view files match the checked-in baseline. Shared fixture/service/query hooks are unchanged. |
| Promotion Offer | Pre-existing Claude list/create/edit routes existed; uncommitted Phase 8C had replaced the Claude view composition with the pilot Full Page behavior. | ChatGPT owns the Phase 8C list, seven-field Full Page, and pilot form. Claude route paths remain and its list/create/edit/form files match the checked-in baseline. Shared fixture/service/query ownership is unchanged. |
| Promotion History | Phase 8D added a modal entry action to the modified Promotions list; no route existed. | The modal and action are composed only by the ChatGPT Promotions list. Fictional event fixture and pure helper modules remain feature-domain utilities; no history route was added. |
| Shells and metadata | Separate Claude and ChatGPT route registries/shells already existed. | ChatGPT metadata, menu, shell selection, breadcrumbs, and lazy imports remain ChatGPT-owned. The Claude shell remains separate. |

**Baseline evidence:** Claude metadata now has 31 route records and matches the pre-Product-Label route count. `git diff --quiet HEAD --` over the restored Claude Promotion Type and Promotion Offer files returned exit code 0. Representative `PromotionTypeDrawerRoute.tsx` worktree blob hash matches the current HEAD blob. Git continues to display these paths as `M` in porcelain status, despite the content diff being empty; this was preserved and is called out as a worktree-status inconsistency rather than hidden.

## 4. Impact map and risk classification

**Overall risk: HIGH.** This change touches separate platform route composition, moves route-bound forms with dirty-state behavior, and restores older Claude presentations while preserving the pilot implementations.

| Surface | Risk | Bounded impact |
| --- | --- | --- |
| ChatGPT route metadata/config/menu/layout | High | Add static ChatGPT paths, nested drawer topology, lazy page implementations, menu selection, and breadcrumb/title resolution. |
| Claude route metadata/menu/layout | High | Remove only the Phase 8A Product Label registration and special list-context behavior. Keep Claude promotion routes. |
| Promotion Type and Offer views | High | Move the current Phase 8B/8C pilot views to ChatGPT; restore the pre-pilot Claude files from HEAD. Keep data, service, and Query ownership. |
| Promotion History | Medium | Mount the existing route-less modal from ChatGPT Promotions only. Preserve event and comment state behavior. |
| i18n | Medium | Expose the pilot resources in the ChatGPT namespace and remove the Claude Product Label page resource. No new language owner. |
| Compare, root router, platform links, dependencies, production | Low/none by scope | No changes made; exact tracked source scope was checked. |

## 5. Migration decisions and file ownership

- ChatGPT route tree owns all four pilot destinations and lazy page imports. `src/routes/router.tsx` remains the existing composition boundary and was not edited.
- ChatGPT page modules live under `src/chatgpt/features/`. Domain fixtures, pure helpers, in-memory services, and React Query hooks stay under their existing `src/features/` owners where they are platform-neutral.
- No ChatGPT pilot view imports Claude route metadata or `claudePath`.
- Claude keeps its original Promotion Type and Promotion Offer route IDs and paths. Their restored source files are not treated as duplicate pilot implementations.
- Product Label pilot route IDs and menu entries were removed from Claude. No cross-platform redirect was added.
- No root route, Compare record, CSV, API, theme token, package, or profile ownership changed.

## 6. Product Label migration

**ChatGPT route contract:** `/chatgpt/product-labels` is a lazy list route with a nested `:id` Quick View Drawer. Its metadata is in `src/chatgpt/routes/route-meta.ts`; its route composition is in `src/chatgpt/routes/route-config.tsx`.

The ChatGPT list preserves search, product-line/status filters, pagination, query/hash state, deterministic fixture lookup, and an `Outlet` for the nested drawer. The drawer remains read-only, handles missing IDs, and returns to the ChatGPT list with the current search/hash. The view files are in `src/chatgpt/features/product-labels/`; fictional data and pure filter/lookup helpers remain in `src/features/product-labels/`.

**Claude removal:** the two Phase 8A route metadata entries, lazy registrations, Claude menu node, and Product Label list-context special case were removed. Sidebar selection and breadcrumb lookup return to their normal pathname behavior.

**Compatibility note:** historical `/claude/product-labels` and `/claude/product-labels/:id` pilot paths, plus the unscoped Product Label redirects formerly derived from Claude metadata, no longer resolve to the pilot. No cross-platform redirect was inferred. Whether those Phase 8A pilot URLs need an explicit retirement/compatibility policy is listed under `NEEDS-TEAM-DECISION`.

## 7. Promotion Type migration

**ChatGPT route contract:** `/chatgpt/promotion-types` owns the list; `create` and `:id` remain nested drawer children. The ChatGPT page uses the verified three fields: name, code, and status. The mechanism note remains a simple highlight/classification explanation.

The Phase 8B pilot list/drawer/form live in `src/chatgpt/features/promotion-types/`; navigation uses `chatgptPath` and `chatgpt` translations. It retains query/hash forwarding, edit/save/validation feedback, record initialization, dirty-close confirmation, and the existing React Query-backed fictional service.

Claude's `/claude/promotion-types`, create, and detail route contracts remain registered. `src/features/promotion-types/PromotionTypesListPage.tsx`, `PromotionTypeDrawerRoute.tsx`, and `PromotionTypeForm.tsx` were restored to their checked-in baseline content; the baseline status-toggle/list and original drawer remain available. No domain fixture, service, or query hook was changed.

## 8. Promotion Offer migration

**ChatGPT route contract:** `/chatgpt/promotions` is the list, `/chatgpt/promotions/create` is Create Full Page, and `/chatgpt/promotions/:id/edit` is Edit Full Page. All are ChatGPT-owned static route declarations with lazy page implementations; create remains a static path separate from the dynamic edit pattern.

The migrated pilot retains the seven verified fields, three sections, Ant Design `Form` ownership, date normalization, validation summary/first-invalid focus, semantic dirty baseline comparison, React Router blocker, native `beforeunload`, mock service/query behavior, and `location.search`/`location.hash` return path. The ChatGPT view and its CSS Modules are in `src/chatgpt/features/promotions/`.

Claude Promotions list/create/edit paths remain registered and their original `PromotionsListPage.tsx`, `PromotionCreatePage.tsx`, `PromotionEditPage.tsx`, and `PromotionForm.tsx` source matches HEAD. This preserves the pre-Phase-8C Claude experience instead of mounting the ChatGPT pilot there. `promotion-form.utils.ts` remains a domain helper used by the ChatGPT pilot; fixture/service/query source was not changed.

## 9. Promotion History migration

Promotion History remains a route-less Ant Design Modal opened by a row action in the ChatGPT Promotions list. `PromotionHistoryLogViewer.tsx` and its SCSS Module are under `src/chatgpt/features/promotions/`; event data and pure comment/copy helpers remain in `src/features/promotions/`.

The migrated viewer retains stable fictional event IDs, event-only copy, immutable original event payloads, event-scoped in-memory comments, Ant Design `FormInstance` composer, and draft-discard confirmation. The Claude Promotions list was restored to baseline and no longer has the Phase 8D View History action. No backend, identity, permission, persistence, or audit guarantee was added.

## 10. Routing, navigation, and deep-link behavior

| Destination | ChatGPT declaration | Presentation topology | Claude status |
| --- | --- | --- | --- |
| Product Label | `productLabels` + `productLabelDetail` | List parent with nested `:id` Drawer | Pilot registration removed |
| Promotion Type | `promotionTypes`, `promotionTypeCreate`, `promotionTypeDetail` | List parent with nested Create and `:id` Drawers | Pre-existing routes retained with baseline components |
| Promotion Offer | `promotions`, `promotionCreate`, `promotionEdit` | List plus sibling Create/Edit Full Pages | Pre-existing routes retained with baseline components |
| Promotion History | No route | Modal opened from ChatGPT Promotions list | Phase 8D action removed from Claude list |

`ChatGPTLayout` resolves the longest matching metadata path, uses the drawer's parent menu item, and renders the matching breadcrumb. Static route paths/children are declared before `route.lazy` page imports. Claude's legacy redirects module was not edited and still derives redirects from Claude-owned metadata; because that metadata is back to the pre-8A set, it retains the 31 original Claude route patterns. No ChatGPT route is aliased to Claude metadata and no cross-platform redirect was introduced.

**Source-only evidence:** focused scripts check route patterns, nested topology, query/hash forwarding and no Claude pilot imports. Direct browser loading, refresh, Back/Forward, and focus restoration were not exercised.

## 11. i18n and design-system compatibility

- The single existing i18next instance remains unchanged. ChatGPT pilot pages call `useTranslation('chatgpt')`.
- Vietnamese and English pilot resources are exposed inside the ChatGPT namespace under `scenario1` and `pages`; TypeScript and the focused verifier enforce vi/en key parity. Product Label display keys were removed from the Claude page resource and added to the ChatGPT pilot resource. Promotion Type, Promotion Offer, and History resource objects are exposed through ChatGPT's own namespace composition; the Claude baseline page resources remain for the restored Claude features.
- Language selection and route path behavior are unchanged. Fixture IDs and values are not translated.
- Existing ChatGPT nested `ConfigProvider`, scoped theme, and CSS Module ownership are unchanged. Claude/global theme tokens and styles were not altered.
- No WCAG conformance or rendered accessibility claim is made.

## 12. Claude baseline preservation

**Verified source:** Claude route metadata has 31 entries, no Product Label path, and retains `promotion-types` and `promotions`. Claude's original Promotions and Promotion Type view files are byte-equivalent to HEAD according to `git diff --quiet` for those paths. `src/layouts/Sidebar.tsx` and `AppBreadcrumb.tsx` now use direct Claude pathname/menu behavior without Product Label list-context normalization.

**Pilot-only behavior moved:** Product Label is no longer a Claude route; Phase 8B dirty guard and feedback additions are only in ChatGPT pilot files; Phase 8C section/semantic dirty workflow is only in the ChatGPT pilot files; Phase 8D history action/modal is only in ChatGPT composition.

**Not verified:** rendered comparisons against a pre-8A browser session and behavior of external bookmarks to the retired Claude Product Label URLs.

## 13. Compare contract preservation

No `src/compare/` source was edited. `verify-phase-8e-chatgpt-consolidation.mjs` executes `git diff --quiet HEAD -- src/compare` successfully and also checks route-root/package scope. Compare scenario IDs, including `drawer-vs-full-page`, all seven criterion IDs, storage keys, saved observations, scoring, 22-column English CSV schema, export filename, and local-draft `approved` semantics therefore remain as in the starting checkout.

This is source-scope evidence, not a browser storage/CSV regression run.

## 14. Files changed

**ChatGPT platform files:**

- `src/chatgpt/routes/route-meta.ts`
- `src/chatgpt/routes/route-config.tsx`
- `src/chatgpt/navigation/menu-meta.ts`
- `src/chatgpt/layout/ChatGPTLayout.tsx`
- `src/chatgpt/features/product-labels/` — list, Quick View, and their CSS Modules
- `src/chatgpt/features/promotion-types/` — list, drawer route, and form
- `src/chatgpt/features/promotions/` — list, Create/Edit wrappers, Full Page, form, History Modal, and CSS Modules

**Claude compatibility and translations:**

- `src/claude/routes/route-meta.ts`
- `src/claude/routes/route-config.tsx`
- `src/claude/navigation/menu-meta.ts`
- `src/layouts/Sidebar.tsx`
- `src/layouts/AppBreadcrumb.tsx`
- `src/i18n/resources.ts`
- Product Label pilot view files were moved out of `src/features/product-labels/` into ChatGPT ownership.
- Claude Promotion Type and Promotion Offer view files were restored to the current HEAD baseline. Their content diff is empty even though Git porcelain continues to display `M` for those paths; the working-copy blob matches HEAD for the representative Promotion Type route and `git diff --quiet` on those files returns success.

**Verification:**

- Updated existing focused scripts: `scripts/verify-product-labels.mjs`, `scripts/verify-promotion-type-quick-edit.mjs`, `scripts/verify-promotion-offer-full-page.mjs`, `scripts/verify-promotion-history-log-viewer.mjs`.
- Added `scripts/verify-phase-8e-chatgpt-consolidation.mjs` for ChatGPT route ownership, lazy boundaries, Claude baseline route count, path isolation, query-state evidence, i18n parity, Compare and service/fixture scope.

The initial untracked Phase 8B–8D reports and helper files were preserved. No application dependency, lockfile, root router, Compare file, profile, Design System document, production checkout, or deployment configuration was changed.

## 15. Executed validation and results

| Command/check | Result | Evidence limit |
| --- | --- | --- |
| `npm run typecheck` | PASS | TypeScript compilation only |
| `npm run build` | PASS; 3,227 modules transformed; `dist/404.html` written | Confirms bundle generation and fallback script; not browser route execution |
| Production bundle inspection | PASS: distinct chunks emitted for ChatGPT pilot components, including Product Label, Promotion Type, Promotions list and Promotion Full Page | Chunk emission confirms lazy split points exist; not that a browser fetched/rendered them |
| `node scripts/verify-product-labels.mjs` | PASS | Fixture/filter/pagination/query and route-source assertions |
| `node scripts/verify-promotion-type-quick-edit.mjs` | PASS | Fictional service, fields, route, query/hash, dirty guard, focus-source and i18n assertions |
| `node scripts/verify-promotion-offer-full-page.mjs` | PASS | Semantic dirty utility, mock service, route/lazy source, field and i18n assertions |
| `node scripts/verify-promotion-history-log-viewer.mjs` | PASS | Event immutability, copy content, comment ordering/isolation, draft and i18n source assertions |
| `node scripts/verify-phase-8e-chatgpt-consolidation.mjs` | PASS | Exclusive pilot route registry checks, 31 Claude patterns, no cross-platform route imports, no Compare/root/package diff, and fixture/service scope |
| `git diff --check` | PASS | Whitespace check; Git emitted only line-ending advisories |

No new dependencies were installed. The built SPA fallback remains generated from `dist/index.html` by the existing build script. No deployed Pages site was visited.

## 16. Regression assessment

- **ChatGPT pilot route ownership:** PASS (source and focused executable checks).
- **Claude baseline promotion routes:** PASS (route source retained; restored files have no textual diff to HEAD).
- **Claude Product Label pilot removal:** PASS (route, menu, and navigation resolver references absent).
- **Compare, root router, redirect module, dependencies, and service/fixture source:** PASS (no tracked source diff in those areas, checked by executable script).
- **Lazy route declarations:** PASS (static route matching fields and lazy page imports; production chunks emitted).
- **Query/hash forwarding and list/drawer topology:** PASS (source/executable checks).
- **Language resource key parity:** PASS (TypeScript parity and focused executable checks).
- **Browser interactions, visual theme isolation, direct deep links, responsive behavior, and keyboard/focus:** NOT VERIFIED.

## 17. Browser acceptance status

**BROWSER NOT VERIFIED.** Tool discovery found no usable interactive browser. No browser session, screenshots, rendered DOM, manual click-through, GitHub Pages visit, or keyboard test was performed. Successful typecheck/build/source assertions are not presented as browser acceptance.

High-priority manual checks:

1. Open `/demo-layout/chatgpt/product-labels`; apply filters and pagination, open a row drawer, refresh its direct URL, close, and verify query/hash/list context and focus return.
2. Open `/demo-layout/chatgpt/promotion-types`; create/edit, validate, save/cancel, confirm dirty close handling, query/hash return, and vi/en switching.
3. Open `/demo-layout/chatgpt/promotions`; create/edit the seven-field Full Page, validate, save, attempt in-app navigation/Back/refresh while dirty, and verify Stay/Discard behavior and retry after a mock failure if reproducible.
4. Open History from a ChatGPT promotion row; test event-only copy, clipboard failure feedback, event switching, comments, draft confirmation, Escape/mask/X/Close, focus restoration, and narrow-width layout.
5. Visit `/demo-layout/claude/promotion-types` and `/demo-layout/claude/promotions` to verify the original Claude list/forms remain; test a legacy URL with search/hash.
6. Inspect Compare observations and CSV before/after these flows to confirm unchanged browser data/export behavior.

## 18. Risks and unverified behavior

1. **Retired Claude Product Label URLs:** the Phase 8A-only Claude URLs now have no route and no cross-platform redirect. Their user/bookmark impact is unknown.
2. **Baseline Claude runtime:** source files and route registrations are preserved/restored, but no browser session verified their rendered behavior.
3. **Moved nested Drawer and modal behavior:** build and static checks do not establish focus trapping/restoration, Escape/mask close lifecycle, query-state restoration, or keyboard operation under the ChatGPT shell.
4. **Full Page navigation protection:** `useBlocker` and native unload source remain in the migrated page, but route transitions, concurrent navigation attempts, and browser prompts were not exercised.
5. **Shared domain helpers:** fictional fixtures, services, Query hooks, promotion form helpers, and history data/helpers remain in domain folders. They do not depend on Claude route metadata in the migrated pilot views, but this ownership split should be revisited only if a real second platform consumer appears.
6. **Porcelain/source-diff discrepancy:** Git porcelain still marks the restored Claude Promotion Type/Promotion Offer files as modified, while representative blob hash and `git diff --quiet` show no content delta to HEAD. No index or status cleanup was attempted.
7. **Existing prunable worktree registrations:** two registrations were visible beneath `.worktrees`; they were not moved, pruned, or otherwise touched.

## 19. NEEDS-TEAM-DECISION

1. Decide whether legacy Phase 8A links to `/claude/product-labels` or `/claude/product-labels/:id` should simply be retired, remain unavailable, or receive a separately authorized compatibility behavior. No cross-platform redirect is currently implemented.
2. Confirm whether Phase 8B–8D pilot translation strings that previously entered the Claude resource tree should remain as shared bilingual source objects exposed in ChatGPT, or be fully extracted into dedicated ChatGPT-owned literals in a follow-up. Current ChatGPT views consume them through the ChatGPT namespace; no user-facing Claude pilot route consumes those pilot-only additions.
3. Browser acceptance of all four ChatGPT pilots and the retained Claude baselines is still required before considering runtime behavior verified.

No production API, authorization, audit guarantee, or business rule was introduced.

## 20. Scenario 1 integration handoff

The four Scenario 1 pilots are registered under ChatGPT as Product Label nested Quick View, Promotion Type nested Quick Edit, Promotion Offer Create/Edit Full Pages, and the Promotions-list History Modal. The Claude Product Label pilot registration and Phase 8D history action are removed. Claude Promotion Type and Promotion Offer baseline routes remain. Compare scenario ID, criteria, storage, scoring, local-draft approval meaning, and CSV contract are untouched.

Source, TypeScript, build, and focused executable checks pass. Browser acceptance remains NOT VERIFIED. The next acceptance step should use the manual checklist in §17, with special attention to the retired Product Label Claude URLs and the route-bound dirty workflows.
