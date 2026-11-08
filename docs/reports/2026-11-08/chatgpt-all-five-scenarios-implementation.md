# ChatGPT All Five Scenarios Implementation

Author: Vuowng
Date: 2026-11-08
Repository: VuongNQ/demo-layout
Branch: feat/playground-compare
Revision: 4b44187ea3a22239d027e0ebebdb8ccb3328a5e0
Worktree: E:\demo-layout

## 1. Objective and scope

**Verified source baseline:** Scenario 1 already had four ChatGPT pilots in `src/chatgpt/features/` and `/chatgpt/` route entries. Compare scenarios 2–5 referenced candidate ChatGPT paths but marked them unavailable. The active ChatGPT route tree is exported from `src/chatgpt/routes/route-config.tsx` and composed by the existing root router.

**Implemented:** Added working, fictional ChatGPT demonstrations for unsaved-change protection, reorder with pagination, tabs versus section/anchor validation, and contextual Product Settings save actions. Updated only the four existing Compare ChatGPT availability values. Scenario IDs, criteria, storage, export serialization, and Claude routes were preserved.

**Not changed:** The production repository, root router, global theme, API client, production contracts, and Compare record/export implementation.

## 2. Verified source baseline

- Branch and HEAD were checked before work. Branch was `feat/playground-compare`; HEAD was `4b44187ea3a22239d027e0ebebdb8ccb3328a5e0`.
- Repo instructions and the available `platform-routing`, `design-system-ui`, and `compare-workflow` skills were read. Local agent definitions exist, but no agent execution was required for this implementation.
- No separate Scenario 2–5 UX contract was found. The current `src/compare/scenarios.ts` descriptions, steps, criteria, and fictional fixtures were treated as the implementation evidence. Unverified business behavior was not added.
- Existing ChatGPT routing uses platform-owned metadata and `route.lazy`. The root router and Claude route modules were left unchanged.
- `src/data/demo-data.ts` defines the 120-item fictional Offer Type fixture (`INITIAL_OFFER_TYPE_COUNT`). `useOfferTypeListQuery` and `useReorderOfferTypesMutation` retain the existing React Query/service ownership.
- `src/features/product-settings/demo-product-settings-data.ts`, `product-settings.service.ts`, and `product-settings.queries.hook.ts` own the fictional Product Settings records, in-memory lifetime, and query/cache updates. ChatGPT uses these hooks rather than introducing another resource store.
- `src/compare/records.ts` continues to own Compare storage (`compare-workspace:v1:`) and its 22-column CSV schema. That file was not changed.

## 3. Existing five-scenario Compare contracts

**Source evidence:** `src/compare/scenarios.ts` retains all five IDs and the seven criterion IDs for each scenario. Scenario 1 remains `drawer-vs-full-page`; its four pilot links and approved title were not changed in this phase.

For Scenarios 2–5, only the existing `chatgpt.availability` values changed from `unavailable` to `available`. The destination URLs were already the candidates listed below:

| Stable scenario ID | ChatGPT destination | Availability |
|---|---|---|
| `unsaved-changes` | `/chatgpt/experiments/unsaved-changes` | available |
| `reorder-pagination` | `/chatgpt/experiments/reorder-pagination` | available |
| `tabs-vs-anchor` | `/chatgpt/experiments/tabs-vs-anchor` | available |
| `contextual-save` | `/chatgpt/product-settings/product-setting-1` | available |

**Executed evidence:** `scripts/verify-chatgpt-scenarios-2-5.mjs` and the updated Phase 8E verifier check these routes, stable IDs/criteria, ChatGPT metadata, and lazy imports. Phase 8G verification additionally checks the CSV header count and unchanged record implementation.

## 4. Impact and risk assessment

| Area | Risk | Reason and containment |
|---|---|---|
| ChatGPT route metadata/composition | HIGH | Adds route IDs and lazy route entries. Kept within the existing ChatGPT registry; the root router and Claude routes were not edited. |
| Compare destination availability | HIGH | Exposes destinations to existing user notes and comparison workflows. Changed four presentation fields only; stable IDs and criteria are verified unchanged. |
| Scenario 2 local drawer state | MEDIUM | Adds route-bound draft/edit lifecycle. Data remains component-local and does not create a storage key. |
| Scenario 3 reorder | MEDIUM | Uses the established shared Offer Type query/service owner. Saving changes the in-memory order seen by that service until its existing reset lifetime; no second store was introduced. |
| Scenario 4 validation demo | MEDIUM | Uses the fictional 45-day reminder and existing 30-day demonstration limit from the Compare scenario. No production constraint is claimed. |
| Scenario 5 Product Settings | MEDIUM | Reuses the existing fictional settings service/query cache and field model. The new save bar and guard are scoped to the ChatGPT page. |
| Accessibility, focus, responsive rendering | HIGH runtime concern | Semantic controls and responsive styles are present in source, but browser interaction could not run in this environment. |

## 5. Scenario 2 implementation

**Source evidence:** `src/chatgpt/features/scenario2/UnsavedChangesPage.tsx` owns two synthetic records in React state and renders the parent list; nested child routing keeps the list mounted. `UnsavedChangesDrawerRoute.tsx` uses Ant Design `Form`/`FormInstance`, compares current values with the record baseline, and updates only the parent’s fictional in-memory state on Save.

The drawer supports the visible close action, Ant Design X/Escape/mask close callbacks, route navigation, and browser history through a route blocker. Dirty attempts present Stay and Discard actions. Discard restores the baseline before proceeding; Save validates, prevents duplicate submission, updates the list record, and navigates back with the current query and hash. Native refresh/tab-close protection uses `beforeunload` while dirty. Direct unknown IDs render a recoverable not-found state.

**Inference/limit:** The sample list data is reset when the page is reloaded because it is React component state. Draft recovery across reloads is not provided or claimed.

## 6. Scenario 3 implementation

**Source evidence:** `src/chatgpt/features/scenario3/ReorderPaginationPage.tsx` loads the existing full 120-item Offer Type fixture. It provides 20-item pages, visible range feedback, page-local drag and explicit up/down controls, an all-items reorder mode, and a direct offer-ID/target-position form. Save validates that the submitted order retains all 120 unique IDs and calls the existing reorder mutation. Discard resets the pending ordering. The list uses the existing installed dnd-kit packages and keyboard sensor; no dependency was added.

The page-local mode cannot cross a page boundary and says so in its UI. The all-items mode and position entry address global rank. Offer identity remains the existing fixture ID.

**Source ownership note:** The existing reorder service owns the saved in-memory ordering and invalidates Offer Type list queries. As a result, a saved demo reorder is visible to consumers of that same service until the service’s normal reset lifetime. No API or new persistence layer was introduced.

## 7. Scenario 4 implementation

**Source evidence:** `src/chatgpt/features/scenario4/TabsVsAnchorPage.tsx` renders two comparable Ant Design forms with independent `FormInstance`s and the same fictional initial values. The existing scenario’s `reminderDaysBefore = 45` is retained and the form demonstrates the existing 30-day maximum. A blank program name supplies a second validation error so the error summary spans sections.

The tabbed form identifies each error and switches to the corresponding tab before scrolling/focusing the invalid control. The second form provides section links, a section navigation structure, and the same summary-to-field recovery. Values remain in each form while changing tabs/sections. A reset action restores both fixture forms. Validation summaries are reconciled on field changes with `validateFields({ validateOnly: true })` so corrected errors are removed and unresolved errors remain discoverable.

**Contract boundary:** These are fictional demonstration fields and validation semantics derived from the current Compare description and its Claude reference experiment. They are not represented as a production promotion schema.

## 8. Scenario 5 implementation

**Source evidence:** `src/chatgpt/features/scenario5/ProductSettingsPage.tsx` implements the directly addressable `product-setting-1` full-page form. Its fields are derived from the existing `ProductSettings` model and fixture: identity/name/code/status, base rate and rate tiers, customer type and corresponding fields, documents, and the existing advanced-configuration fields. Conditional fields use Ant Design `Form.Item` dependencies; lists use `Form.List`.

The sticky contextual save bar remains visible while scrolling and stacks at narrow widths; actions are also available after the form. Ant Design Form owns form state. A canonical baseline comparison sorts object keys and ignores undefined properties, so changing a value and reverting it returns to pristine. Discard restores the baseline. Save uses `useUpdateProductSettingsMutation`, updates the existing query/cache owner, and establishes the successful values as the new pristine baseline. Validation or mutation failures show recoverable feedback without intentionally clearing entered values. Unknown IDs and query failures have separate states.

Route and unload protection use React Router `useBlocker` and native `beforeunload` respectively. While a save is in progress, the blocker dialog communicates the wait and disables discard. On successful save, an outstanding blocked navigation is reset so a completed save does not leave a stale unsaved-changes prompt.

**Unverified behavior:** The existing mock update normally succeeds; no artificial save failure was added. The visible failure branch is source-reviewed but was not runtime-triggered.

## 9. ChatGPT route/menu/breadcrumb integration

`src/chatgpt/routes/route-meta.ts` now declares the new routes and translation-backed labels. `src/chatgpt/routes/route-config.tsx` adds lazy route entries, including the nested Scenario 2 drawer route. `src/chatgpt/navigation/menu-meta.ts` exposes the three experiment pages in the ChatGPT menu. Product Settings is reachable from Compare’s direct URL and has a ChatGPT breadcrumb; it is not presented as a separate settings index because none exists in the verified source.

The pages remain under the existing ChatGPT layout, theme, error boundary, basename, and Suspense/router composition. No Claude paths or root route definitions changed. The production build emitted separate chunks for the new route pages (`UnsavedChangesPage`, `ReorderPaginationPage`, `TabsVsAnchorPage`, and `ProductSettingsPage`).

## 10. Compare availability and compatibility

The four existing ChatGPT candidate URLs now have registered route entries and usable page implementations, and their existing availability fields are `available`. Scenario 1 remains intact.

**Compatibility evidence:** No edits were made to `src/compare/records.ts`, `CompareWorkspace.tsx`, or the CSV serializer. The existing 22 CSV column names/order, raw status values, scenario/criterion IDs, local-storage namespace, filename, BOM/CRLF/escaping code, score behavior, and saved notes contract therefore remain source-identical to the inspected baseline. The updated Phase 8E verifier’s Compare preservation checks pass.

## 11. Mock state and persistence boundaries

- Scenario 2 records use page-local React state and reset on page reload.
- Scenario 3 uses the pre-existing Offer Type fixture/service and React Query mutation/cache ownership. Its service lifetime remains in-memory.
- Scenario 4 forms are local demonstration state and do not submit or persist a promotion.
- Scenario 5 uses the pre-existing Product Settings service’s in-memory state and existing query/cache updates.
- None of these screens calls production endpoints, changes `ApiFetcher`, or creates a new localStorage key.
- Compare state and user notes remain independently owned by the existing Compare storage implementation.

## 12. Form, validation, and dirty-state behavior

All newly introduced forms use Ant Design `Form`/`FormInstance`; React Hook Form was not added. Scenario 2 and Scenario 5 use semantic baseline comparisons. Scenario 3’s reorder draft is an explicit pending full-order array validated for total length and unique IDs. Scenario 4 uses Ant Design field rules and explicit full-form validation on edits after an error summary appears.

No new backend validation, promotion calculations, permission model, or failure latency was invented.

## 13. Accessibility and i18n

**Source evidence:** New visible labels, instructions, errors, status/dirty feedback, actions, and accessibility names are under the ChatGPT-owned `pages.scenario2`–`pages.scenario5` resources in `src/i18n/resources.ts`, with matching vi/en object structure enforced by the existing compile-time parity checks. Menu labels are also provided for the new ChatGPT entries. The pages use semantic headings, associated Ant Design form labels, text feedback, keyboard-capable buttons, dnd-kit keyboard sensors, and responsive SCSS Modules. No nested `<main>` landmark was added.

**Not verified in a browser:** Actual screen-reader announcements, focus placement/restoration, keyboard completion, Vietnamese text wrapping, and 320px rendering remain unverified because the application could not be served in this environment.

## 14. Files changed

Implementation changes in this task:

- `package.json` — added `verify:scenarios2-5`; the Playwright dependency and `test:e2e` entries were already present in the worktree before this task.
- `src/chatgpt/navigation/menu-meta.ts`
- `src/chatgpt/routes/route-config.tsx`
- `src/chatgpt/routes/route-meta.ts`
- `src/chatgpt/features/scenario2/UnsavedChangesPage.tsx`
- `src/chatgpt/features/scenario2/UnsavedChangesPage.module.scss`
- `src/chatgpt/features/scenario2/UnsavedChangesDrawerRoute.tsx`
- `src/chatgpt/features/scenario2/UnsavedChangesDrawerRoute.module.scss`
- `src/chatgpt/features/scenario3/ReorderPaginationPage.tsx`
- `src/chatgpt/features/scenario3/ReorderPaginationPage.module.scss`
- `src/chatgpt/features/scenario4/TabsVsAnchorPage.tsx`
- `src/chatgpt/features/scenario4/TabsVsAnchorPage.module.scss`
- `src/chatgpt/features/scenario5/ProductSettingsPage.tsx`
- `src/chatgpt/features/scenario5/ProductSettingsPage.module.scss`
- `src/i18n/resources.ts`
- `src/compare/scenarios.ts`
- `scripts/verify-chatgpt-scenarios-2-5.mjs`
- `scripts/verify-phase-8e-chatgpt-consolidation.mjs` — extended to expect and verify the additional lazy routes, destinations, and translation parity.
- `tests/e2e/scenarios2-5.spec.ts`
- `playwright.config.ts` — changed the existing-server reuse setting to reuse a manually started local server outside CI; the existing webServer command still targets the repository’s Vite dev script.

Pre-existing Phase 8H changes were preserved: `package-lock.json` changes, Playwright dependency/test configuration, `tests/e2e/scenario1.spec.ts`, and `docs/reports/2026-11-08/phase-8h-playwright-browser-acceptance.md`. No production repository, Claude implementation, root router, `.gitignore`, or profile file was changed. No dependency installation occurred in this task.

## 15. Validation commands and actual results

| Command | Result | Evidence/limit |
|---|---|---|
| `npm run typecheck` | PASS | TypeScript completed with exit code 0. |
| `npm run build` | PASS | Vite production build completed; generated lazy chunks and `dist/404.html`. This is not runtime/browser proof. |
| `npm run verify:scenarios2-5` | PASS | New focused source contract verifier. |
| `node scripts/verify-product-labels.mjs` | PASS | Existing Phase 8A fixture/list/route/Pages checks. |
| `node scripts/verify-promotion-type-quick-edit.mjs` | PASS | Existing Phase 8B checks. |
| `node scripts/verify-promotion-offer-full-page.mjs` | PASS | Existing Phase 8C checks. |
| `node scripts/verify-promotion-history-log-viewer.mjs` | PASS | Existing Phase 8D checks. |
| `node scripts/verify-phase-8e-chatgpt-consolidation.mjs` | PASS | Updated to include Scenarios 2–5. |
| `node scripts/verify-phase-8g-integration-remediation.mjs` | PASS | Existing Phase 8G checks. |
| `npx playwright test --list` | PASS | Discovers 19 tests across Scenario 1 and Scenarios 2–5; tests were not executed. |
| `npx playwright test tests/e2e/scenarios2-5.spec.ts` | BLOCKED | Runner exited before tests with `Error: spawn EPERM`. |
| `npm run dev -- --host 127.0.0.1 --port 4187 --strictPort` | BLOCKED | Vite could not load `@tailwindcss/oxide-win32-x64-msvc/tailwindcss-oxide.win32-x64-msvc.node`; the environment also reported `spawn EPERM` during Vite’s Windows real-path resolution. No packages were installed or configuration bypassed. |
| `git diff --check` | PASS | No whitespace errors. Git emitted only LF-to-CRLF working-copy notices. |

The Playwright package and browser binaries are present, but the application server process could not be started. Thus the browser suite has **0 passed, 0 failed, 19 not executed/blocked**; this is not a claim that the UI passed or failed in a browser.

## 16. Browser acceptance evidence or NOT VERIFIED

**BROWSER NOT VERIFIED.** Playwright test discovery passed, but no UI actions ran. A local dev server was attempted once using the configured command and failed for the environment reasons in Section 15. The built production output was not served to a browser as an alternative.

Manual acceptance still needed:

1. Open `/demo-layout/compare/unsaved-changes`; follow ChatGPT. Edit a drawer field, then test Stay/Discard from X, Escape, mask, Cancel, browser Back, platform navigation, and refresh. Verify save and invalid form values.
2. Open `/demo-layout/compare/reorder-pagination`; verify 1–20/120, page-local move bounds, page 2 identity/count, all-items mode, direct position, Save and Discard.
3. Open `/demo-layout/compare/tabs-vs-anchor`; submit both modes unchanged. Verify the two errors are listed, each error action selects/scrolls to the correct section and focuses its control, then correct in different orders and verify remaining errors stay visible.
4. Open `/demo-layout/compare/contextual-save`; edit near the top and bottom of `product-setting-1`, verify the sticky save bar remains usable while scrolling, test validation, discard, save, Back/Stay/Discard, refresh, and 320px width.
5. Switch vi/en on all four destinations without changing URL or losing current form/Compare state. Verify text expansion and focus with keyboard.
6. Recheck the four Scenario 1 ChatGPT pilots, Claude Promotion Type/Promotion Offer baseline routes, and existing Compare notes/CSV export.

## 17. Claude and Scenario 1 regression

**Source/executable evidence:** `src/claude/`, root route composition, and `src/compare/records.ts` were not edited. Existing Phase 8A–8D verifiers pass. The Phase 8E verifier confirms all 31 Claude canonical route metadata entries remain and checks ChatGPT-owned lazy route paths. The existing 4 Scenario 1 ChatGPT pilots and Compare links were not modified.

**Not verified:** Browser navigation to Claude baseline routes and Scenario 1 drawer/modal/form behavior could not be exercised in this run.

## 18. Risks and limitations

- Browser runtime, focus, responsive layout, keyboard behavior, console output, and direct-refresh behavior remain unverified because Vite could not start.
- Scenario 3 commits through the existing shared Offer Type in-memory service; the changed order can be seen by other consumers of that service during its current lifetime.
- Scenario 5 service error presentation exists, but ordinary mock service success was the only supported path established by current source; a save failure was not simulated.
- Scenario 2 data is page-local and intentionally resets on reload; this is documented in its UI.
- `playwright.config.ts` still defines the actual Vite `webServer`; non-CI runs may reuse an already-started server. No dev-server behavior has been verified in this environment.
- No production API or deployed GitHub Pages behavior was tested.

## 19. NEEDS-TEAM-DECISION

- The existing Compare scenario leaves whether reorder behavior should be universal or list-specific open. This implementation exposes both page-local and full-list ordering as a fictional comparison and uses the current shared Offer Type fixture/service; it does not propose a production standard.
- Scenario 4’s 30-day reminder maximum remains a demonstration rule from the existing scenario/source context only; production ownership or applicability is not established.
- Product Settings remains a single-record direct entry in this ChatGPT demo. A browsable settings index is outside the verified scenario contract.

## 20. Final verdict and handoff

**Verdict: IMPLEMENTED WITH BROWSER ACCEPTANCE BLOCKED.** TypeScript, production build, Compare/route source checks, all available Phase 8A–8G focused verifiers, and whitespace validation passed. The four new screens are registered in the existing ChatGPT lazy route tree and the four Compare destinations are marked available. Real Playwright execution is still required after the Windows environment can start the configured Vite server.

No commit, push, deploy, dependency install, worktree operation, or production edit was performed.
