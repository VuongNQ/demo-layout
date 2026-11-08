# Phase 8A — Product Label Quick View

**Author:** Vuowng  
**Date:** 2026-11-07  
**Checkout/worktree:** `E:\demo-layout`  
**Branch/revision:** `feat/playground-compare` / `7364a369b65301aacfe8d144b3c03c0ea0a41c6f`

## 1. Scope and implementation summary

Implemented a fictional, bilingual Product Labels list under the Claude platform and a route-backed, read-only Quick View drawer. The list supports name/code search, product-line and status filters, and pagination. Its state is represented in URL search parameters so it remains available while the nested drawer is open and when the list is restored.

No production repository, production API, customer data, Compare source, Compare storage/export contract, theme token, global style, or existing Claude business workflow was changed. The Quick View has no save or mutation controls.

## 2. Verified source baseline

- The inspected checkout had 31 Claude route metadata entries and a route tree that lazy-loads pages. Existing Offer Types, Promotion Types, Background Locks, and the unsaved-changes experiment demonstrate nested route-backed drawers; full-page pages are separate route entries (`src/claude/routes/route-config.tsx`).
- Claude route paths and IDs are owned by `src/claude/routes/route-meta.ts`. The root `legacyRedirectRoutes` are generated from this registry and carry search/hash while redirecting unscoped paths (`src/routes/legacy-redirects.tsx`).
- The Claude shell keeps its parent route mounted around an `<Outlet />`; its sidebar and breadcrumbs are derived from the menu registry (`src/layouts/AppLayout.tsx`, `src/claude/navigation/menu-meta.ts`).
- One shared i18next instance supplies vi/en, with Vietnamese default/fallback; Ant Design locale follows that language (`src/i18n/index.ts`, `src/App.tsx`).
- The copied Design System calls WCAG 2.2 AA an approved target, recommends visible focus and status text that is not color-only, and recommends colocated SCSS Modules for new independent components (`docs/design-system/README.md`, `components.md`, `patterns.md`). These are prototype implementation references, not a WCAG conformance claim or global token change.
- Current `package.json` scripts are `dev`, `typecheck`, `build`, and `preview`; there is no configured unit or browser test script.
- The production Product Label audit/source was not available in this checkout. Its candidate finding remains user-provided context only. The model and fixture below are fictional and are not represented as a production DTO.

At initial inspection the main worktree had no uncommitted changes. `git worktree list --porcelain` also showed two pre-existing prunable registrations under `E:\demo-layout\.worktrees\`; no worktree was created, moved, removed, pruned, or otherwise changed.

## 3. Fictional Product Label model

`src/features/product-labels/demo-product-labels-data.ts` defines 12 stable synthetic records with:

- `id`, `name`, `code`
- `productLine`: `cash-loan` or `credit-card`
- `status`: `active` or `inactive`
- optional `classification`: `eligibility`, `display`, or `pricing`
- optional `associatedProductSummary`
- ISO `updatedAt`

IDs use `product-label-001` through `product-label-012`. Optional fields are omitted on selected fixtures to exercise the localized “Not provided” state. Names, codes, enum values, IDs, and timestamps are fixture data; translated interface labels are stored separately. None of these field names or shapes is asserted to match a production contract.

## 4. List functionality

The list at `/claude/product-labels` renders columns for label name, code, product line, status, and a named “View details” action. Search is case-insensitive and matches name/code. Product line and status filters can be cleared. Page size is eight; fixture order is stable and filtering/pagination is deterministic.

Filtering and page state are represented by query keys `q`, `line`, `status`, and `page`. Updates preserve unrelated query parameters. Search/filter updates replace the current query entry while page navigation pushes a history entry. Opening the drawer carries the existing search string and hash into the child route. Clearing/closing the drawer returns to `/claude/product-labels` with the current query and hash. The list remains the parent route, so its rendered table context is retained while the child outlet displays the drawer.

An explicit localized empty state covers no matching rows. The fixture source is a synchronous in-memory constant with no failure path, so artificial loading and error states were not added. If the feature later uses an asynchronous source, loading/retry/error UI will be needed then.

## 5. Drawer interaction and state behavior

The nested route `/claude/product-labels/:id` displays a right-side Ant Design Drawer. It has a programmatic heading, record identity, and read-only labeled values using `Descriptions`; no disabled form controls are used. Status is displayed as translated text, independent of color. Optional fields use the localized missing-value label. Long values wrap.

The drawer has the Ant Design close control, a visible localized Close button, keyboard handling for Escape, `autoFocus`, and an explicitly focused heading. The Ant Design Drawer implementation in the installed dependency includes focus sentinels and focus-on-close behavior. The list also observes the child-to-list route transition and restores focus to the originating row action when it is rendered, otherwise to the list heading.

An unknown ID renders a localized not-found result and a return-to-list action. On direct load, closing uses the canonical Product Labels list path and preserves query/hash; it does not rely on an assumed prior history entry. Browser Back naturally leaves the child route. No full-detail/edit action is shown because this checkout has no verified Product Label full-page destination; a dead or fabricated edit route would violate the read-only scope.

These focus, Escape, history, and drawer lifecycle details are implementation evidence only. Their rendered behavior was not browser-tested.

## 6. Route and query-state contracts

| Kind | Path | Behavior |
| --- | --- | --- |
| List | `/claude/product-labels` | Lazy list page, menu destination, query-backed filters and pagination |
| Drawer | `/claude/product-labels/:id` | Lazy nested child; keeps list route mounted |
| Legacy list | `/product-labels` | Generated explicit compatibility redirect to Claude list route |
| Legacy drawer | `/product-labels/:id` | Generated explicit compatibility redirect; retains path parameter, search, and hash |

The Claude route registry now contains 33 entries: the previous 31 plus `productLabels` and `productLabelDetail`. The route diff is additive; no existing route ID/path or route topology was replaced. The new route entries use `route.lazy` and leave paths/children statically matchable. The root router was not edited.

`resolveClaudeListContext` maps only Product Label child paths back to the Product Labels list for sidebar selection and breadcrumb lookup. Other Claude menu and breadcrumb behavior is unchanged.

## 7. Accessibility and focus implementation

- The list has a level-one heading, labeled filter group, accessible search/select names, and an `aria-live` result count.
- Each row action has visible “View details” text and an accessible name identifying its record.
- Drawer title is a focused level-two heading referenced by `aria-labelledby`; Ant Design provides focus containment, Escape handling, and a visible close control.
- On return to the list, focus targets the originating row action when present, with the list heading as fallback for direct links or filtered-out records.
- Labels and status meanings are textual. Table content uses horizontal scrolling at a minimum table width; values wrap in the drawer.

These requirements were checked in source and against installed Ant Design/rc-drawer implementation. Keyboard-only use, actual focus order/return, screen-reader announcements, contrast, and responsive reflow are **NOT VERIFIED** in a rendered browser; no WCAG conformance is claimed.

## 8. Vietnamese and English coverage

The existing `claude` and `navigation` namespaces were extended with matching vi/en Product Labels entries. They cover the page heading, filters, columns, actions, product-line/status/classification display values, result count, pagination range, Quick View labels, record identity, missing optional values, not-found state, and close/return actions. A TypeScript `SameKeys` parity assertion was added for `resources.vi.claude.pages.productLabels` and `resources.en.claude.pages.productLabels`; `npm run typecheck` validates it.

Fixture names/values remain stable across languages while product-line, status, and classification UI labels are translated at render time. Dates are formatted using the selected language (`en-US` or `vi-VN`) from unchanged UTC ISO timestamps. Vietnamese wrapping/diacritic rendering and English text expansion are **NOT VERIFIED** visually.

## 9. Files changed

Application source:

- `src/claude/routes/route-meta.ts`
- `src/claude/routes/route-config.tsx`
- `src/claude/navigation/menu-meta.ts`
- `src/layouts/Sidebar.tsx`
- `src/layouts/AppBreadcrumb.tsx`
- `src/i18n/resources.ts`
- `src/features/product-labels/demo-product-labels-data.ts`
- `src/features/product-labels/product-labels.utils.ts`
- `src/features/product-labels/ProductLabelsListPage.tsx`
- `src/features/product-labels/ProductLabelsListPage.module.scss`
- `src/features/product-labels/ProductLabelQuickViewRoute.tsx`
- `src/features/product-labels/ProductLabelQuickViewRoute.module.scss`

Focused executable check:

- `scripts/verify-product-labels.mjs` — uses the existing TypeScript package to exercise pure fixture/filter/query helpers and static route/Pages declarations. It introduces no dependency or application runtime behavior.

Documentation:

- `docs/reports/2026-11-07/phase-8a-product-label-quick-view.md`

No Compare file, storage key, scenario ID, criterion, CSV field, theme token, global style, profile, or lockfile was changed.

## 10. Validation evidence

| Check | Result | Limit |
| --- | --- | --- |
| `npm run typecheck` | **PASS** | Static type/resource-key validation. |
| `npm run build` | **PASS**; Vite transformed 3,212 modules. | Not runtime/browser proof. |
| Lazy output | **PASS (build evidence)**; separate `ProductLabelsListPage` and `ProductLabelQuickViewRoute` JS chunks and corresponding CSS were emitted. | Does not prove route rendering. |
| `node scripts/verify-product-labels.mjs` | **PASS** for deterministic name/code matching, combined filters, page slicing, invalid-filter fallback, unrelated-query preservation/encoding, valid/invalid ID lookup, 33 route entries, nested lazy route declarations, redirect derivation, basename and fallback source. | It is a focused executable source/helper check, not a DOM test. |
| `git diff --check` | **PASS**; no whitespace errors. Git printed line-ending conversion notices for touched files. | Untracked content is not covered by `git diff --check`; TypeScript build checked application files. |
| `dist/index.html` vs `dist/404.html` | **PASS (static)**; `fc /b` found no differences after build. | Local build only; no deployed Pages request. |
| Existing route preservation | **PASS (static)**; route metadata diff only adds the two Product Label IDs/paths; old entries are unchanged. The redirect list remains generated from the route registry. | No browser redirect request was made. |
| Browser interaction | **NOT VERIFIED**; no DOM-capable browser tool or configured browser test runner was available. | Drawer rendering, filtering interaction, Back/Forward, focus, Escape, and responsive behavior remain to be exercised manually. |

## 11. Risks and unverified behavior

- The fixtures, fields, labels, classifications, status meanings, and product summaries are fictional. They do not establish production DTOs, API behavior, permission semantics, or a production route.
- Search/filter controls, query history, direct deep links, Drawer focus lifecycle, and mobile/table overflow have not been rendered in a browser.
- Product Label has no full-page details/edit destination in this checkout. The Quick View intentionally omits that link; the future full-page destination and whether the view should link to it remain **NEEDS-TEAM-DECISION** before such a capability is advertised.
- GitHub Pages paths/fallback were checked in local source/build output only, not on the deployed site.
- Two pre-existing prunable nested worktree registrations were observed and left untouched.

## 12. NEEDS-TEAM-DECISION

- Confirm the eventual Product Label full-page details/edit destination and its scope before adding a link from Quick View. Phase 8A does not invent that route.
- If this prototype later needs remote or fallible data, decide its loading/retry/error contract; the current static fixture has no asynchronous failure state.
- Any adoption of this fictional field model, values, permissions, route, or API in production requires separate verification and approval.

## 13. Phase 8B handoff notes

Promotion Type Quick Edit remains a separate phase. Keep its current form/data contract untouched by this implementation. For 8B, first inspect the current Promotion Type fixture and routes; the agreed mechanism is a simple highlight/classification only, not a rules engine. Preserve the nested list/drawer topology and current dirty-state behavior unless the 8B task explicitly authorizes changes. Do not infer production edit-route or API support.
