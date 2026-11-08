# Phase 8F — Scenario 1 Integration and Browser Acceptance Audit

Author: Vuowng  
Date: 2026-11-08  
Branch/revision: `feat/playground-compare` / `981bfa707945cc2b03f17ab7504ea545c3af83cf`  
Scope: Read-only audit of the four Scenario 1 pilots, platform isolation, i18n, Compare compatibility, and available validation evidence.  
Evidence: Current source, current worktree diff/status, historical Phase 8A–8E reports, focused executable checks, TypeScript check, and independent routing/UI reviews.  
Inference: Explicitly labeled below; static source does not establish rendered behavior.  
Risks: Browser interactions, accessibility, URL refresh, localStorage notes, clipboard, layout, and deployed Pages behavior remain unverified.  
Not verified: Real browser acceptance and deployed hosting.

## 1. Executive summary

**Final verdict: CHANGES REQUIRED before Scenario 1 integration acceptance.** The four pilot route compositions are present under ChatGPT and are absent from Claude as pilot registrations. Claude Promotion Type and Promotion Offer routes remain. Current route declarations show separate platform trees, lazy page imports, and no duplicate route IDs or path collisions. TypeScript and all existing Phase 8A–8E focused executable checks passed.

The most material source gap is that Compare Scenario 1 still identifies ChatGPT as unavailable and points to `/chatgpt/offer-types/offer-1`, a path absent from the current ChatGPT route registry. The four ChatGPT pilots therefore cannot be reached from the Scenario 1 comparison destination card. Other confirmed source concerns are the ChatGPT promotion translation resources aliasing Claude page objects, nested `<main>` landmarks on Promotion Full Page, and a synchronous comment submit lock that does not span separate submit events. See Findings.

**No real browser interaction was performed.** A Firefox executable alias was discoverable, but no interactive browser or DOM automation interface/driver was available; `npm ls playwright @playwright/test puppeteer --depth=0` found no installed automation package. Browser outcomes are all **NOT VERIFIED**. No build was run because the requested checks were non-mutating and `npm run build` writes `dist/` artifacts.

## 2. Source and worktree baseline

- Repository root: `E:\demo-layout`; branch: `feat/playground-compare`; HEAD: `981bfa707945cc2b03f17ab7504ea545c3af83cf`. The branch reports one commit ahead of `origin/feat/playground-compare`.
- `package.json` scripts are `dev`, `typecheck`, `build`, and `preview`. There is no project test or browser-test script. Dependencies include React Router 7.1.1, Ant Design 5.22.2, i18next, and react-i18next.
- Read `AGENTS.md`, the three repository skills (`platform-routing`, `design-system-ui`, `compare-workflow`), and the verified local agent definitions `.codex/agents/routing-architect.toml` and `.codex/agents/ui-reviewer.toml`. Both agents were asked for read-only review; their findings were checked against source and the explicit user decision. No profile was changed.
- Read the full Scenario 1 UX Contract and Phase 8A, 8B, 8C, 8D, and 8E reports. They are treated as historical requirements/evidence, not proof of current runtime behavior.
- Initial `git status --short --branch` showed 22 tracked paths in a changed/deleted state and 27 untracked files, all pre-existing Phase 8B–8E work. The report created by this audit is the only additional file. No source, test, fixture, dependency, translation, Compare, or profile file was edited.
- Tracked diff content is limited to the Phase 8E consolidation: ChatGPT route metadata/config/menu/layout; Claude route metadata/config/menu changes; removal of four Claude Product Label view/style files; i18n resources; shared sidebar/breadcrumb handling; and the updated Product Label verifier. Seven legacy Claude Promotion Type/Promotion Offer component paths also display as modified in porcelain, but `git diff --quiet HEAD -- src/features/promotion-types src/features/promotions` returns success and representative `git hash-object` values equal the corresponding HEAD blobs. `core.autocrlf=true`; line-ending/stat normalization is a plausible explanation, but the precise Git status cause was not proven. No index refresh or other status-changing operation was run.
- Untracked pre-existing inventory: reports `phase-8b-promotion-type-quick-edit.md`, `phase-8c-promotion-offer-full-page.md`, `phase-8d-promotion-history-log-viewer.md`, `phase-8e-chatgpt-routing-consolidation.md`; focused scripts `verify-phase-8e-chatgpt-consolidation.mjs`, `verify-promotion-history-log-viewer.mjs`, `verify-promotion-offer-full-page.mjs`, `verify-promotion-type-quick-edit.mjs`; 16 ChatGPT pilot UI files under `src/chatgpt/features/{product-labels,promotion-types,promotions}/`; and `src/features/promotions/{promotion-form.utils.ts,promotion-history.data.ts,promotion-history.utils.ts}`.
- `git worktree list --porcelain` showed the current root worktree and two existing prunable registrations under `.worktrees/feat-playground-chatgpt` and `.worktrees/feat-playground-routing`. Neither was moved, pruned, or modified.

## 3. Findings ordered by severity

### F1 — HIGH: Compare Scenario 1 points to an unavailable, unregistered ChatGPT destination

**Affected:** `src/compare/scenarios.ts` Scenario `drawer-vs-full-page`; `src/compare/CompareWorkspace.tsx` `DestinationCard` and Scenario detail.

**Evidence:** Scenario 1 still uses the title “Drawer vs full-page edit,” describes editing fictional `offer-1`, and sets `chatgpt.url` to `/chatgpt/offer-types/offer-1` with `availability: 'unavailable'`. The ChatGPT registry has no `offerTypes` route; its pilot routes are Product Labels, Promotion Types, and Promotions. `CompareScenarioPage` renders an unavailable label and code URL for that destination rather than a link. The task’s authoritative decision says the four pilots are ChatGPT-owned.

**Impact:** The Compare Scenario 1 worksheet does not provide a usable route to the newly consolidated ChatGPT pilots and presents their platform destination as unavailable. This prevents the Scenario 1 comparison entry point from representing the current integration.

**Status:** Confirmed source mismatch; no browser reproduction attempted. Existing scenario ID, criteria and CSV schema are unchanged. A revised Scenario 1 destination/worksheet design should preserve `drawer-vs-full-page`, all seven criterion IDs, user records, and CSV schema. One destination may not express all four pilots; the selection/worksheet relationship needs an explicit design decision before changing Compare.

### F2 — MEDIUM: ChatGPT pilot translation values are sourced from Claude page resources

**Affected:** `src/i18n/resources.ts`, resource composition for `chatgpt.scenario1` and `chatgpt.pages`.

**Evidence:** Current composition assigns ChatGPT Promotion Type and Promotion values directly from `composedResources.vi.claude.pages.*` and the English equivalents. The ChatGPT pages call the `chatgpt` namespace, but the underlying objects remain Claude-owned. The focused checks establish matching key shapes, not independent ownership.

**Impact:** Future edits to Claude copy can silently alter ChatGPT pilot UI. This conflicts with the platform ownership boundary and leaves locale parity unable to prove ownership isolation.

**Status:** Confirmed architecture coupling by source; visible runtime content is not in question and browser behavior is unverified. Recommend extracting the existing strings into ChatGPT-owned bilingual resources without changing copy or fixture values.

### F3 — MEDIUM: Promotion Full Page creates nested main landmarks

**Affected:** `src/chatgpt/layout/ChatGPTLayout.tsx`; `src/chatgpt/features/promotions/PromotionFullPage.tsx`.

**Evidence:** The shell renders `<main id="chatgpt-main">` around `<Outlet />`. The Promotion Full Page component renders another `<main>` for the normal form and for loading/error/not-found branches.

**Impact:** The route introduces nested main landmarks in the document structure, which can confuse landmark navigation for assistive technology users.

**Status:** Confirmed structural source issue; rendered accessibility and screen-reader impact were not tested. Remediation should retain the shell main and use a non-main page container inside the route.

### F4 — MEDIUM: Comment submit re-entry guard is released before another submit can be excluded

**Affected:** `src/chatgpt/features/promotions/PromotionHistoryLogViewer.tsx`, `submitComment`.

**Evidence:** `submitComment` is synchronous: it sets `submitLockRef.current = true`, updates local React state, then sets the ref back to `false` before returning. The submit button has no pending/disabled state. Thus the ref does not remain locked across separate rapid submit events.

**Impact:** Repeated activation can append duplicate mock annotations to the same event thread, undermining the stated duplicate-submit protection.

**Status:** Source-confirmed logic gap; duplicate insertion was not reproduced in a browser. The feature currently uses synchronous in-memory comments and has no network pending state. A future fix should prevent re-entry for the duration of the actual submit event or provide an explicit pending boundary.

### F5 — LOW: Nested routes do not expose a parent breadcrumb or semantic active-page state

**Affected:** `src/chatgpt/layout/ChatGPTLayout.tsx` breadcrumb and `NavLink` rendering.

**Evidence:** The breadcrumb renders only `Workspace / matchedRoute.breadcrumb`, so a drawer route shows its own label without the parent list label. `menuParent` adds the parent’s active CSS class, but `NavLink end` does not match the parent URL while on a child route; the parent link therefore does not receive `aria-current="page"` from `NavLink`.

**Impact:** Visual menu context exists, but breadcrumb hierarchy and programmatic current-page indication may be incomplete for nested drawer navigation.

**Status:** Confirmed markup/source behavior; assistive-technology impact is not browser-verified. Review whether the desired pattern is a parent/child breadcrumb and an explicit current/expanded semantic state.

### F6 — LOW: History success feedback can remain visible while composing the next comment

**Affected:** `src/chatgpt/features/promotions/PromotionHistoryLogViewer.tsx` `commentFeedbackEventId`.

**Evidence:** Successful submit sets the feedback event ID. No form-change handler clears it; the status is rendered whenever the selected event matches that ID.

**Impact:** After one comment succeeds, the success message remains while the user starts another draft, which can make the feedback appear to describe the unsent draft.

**Status:** Confirmed source state flow; rendered duration was not observed. Clear success feedback when a new draft is entered or after a bounded interval.

### F7 — LOW / REVIEW: Promotion Type dirty status is touched-based

**Affected:** `src/chatgpt/features/promotion-types/PromotionTypeDrawerRoute.tsx` `onValuesChange`.

**Evidence:** The drawer sets `isDirty` from `form.isFieldsTouched()`, rather than comparing current values to the captured baseline. The Phase 8B report records this as the implemented contract. A user who changes a field and restores its original value can therefore remain treated as dirty by the form’s touched state.

**Impact:** The drawer may request discard confirmation after the values have returned to their starting values. This is conservative and does not itself lose data.

**Status:** Static behavior inference; interaction not exercised. Decide whether touched-based guard is acceptable for this compact pilot or whether semantic comparison is required. Phase 8C’s semantic dirty contract remains separately implemented.

### F8 — LOW / REVIEW: Promotion list query has no explicit error/retry branch

**Affected:** `src/chatgpt/features/promotions/PromotionsListPage.tsx`.

**Evidence:** The list reads `data` and `isLoading` from `usePromotionsListQuery`; the table gets `loading` and defaults missing data to an empty array. It does not read `isError` or expose retry, unlike the Promotion Types list. The current service is fictional in-memory and does not establish a normal failure path.

**Impact:** If the query does fail, users may see an empty list rather than an error explanation.

**Status:** Failure behavior is an unverified risk because the present mock source does not demonstrate a reachable list failure. Add an error state only if this route is expected to support a fallible source or a reproducible mock failure.

## 4. Four-pilot integration matrix

| Pilot | Current ChatGPT source/route | Static review result | Browser result |
|---|---|---|---|
| Product Label Quick View | `chatgptRouteMeta.productLabels` and `productLabelDetail`; nested `product-labels/:id`; lazy list and drawer imports | PASS: list/filter/pagination helpers and query/hash forwarding are covered by `verify-product-labels.mjs`; Drawer uses read-only `Descriptions`, handles unknown ID, and supplies focus code. | NOT VERIFIED |
| Promotion Type Quick Edit | `promotionTypes` parent with nested `create` and `:id` drawers; lazy imports | PASS: three fields (name/code/status), Ant Design `FormInstance`, mock React Query mutations, validation focus, `useBlocker`, and `beforeunload` are present in source and focused verifier. Dirty state is touched-based (F7). | NOT VERIFIED |
| Promotion Offer Full Page | `promotions`, `promotions/create`, `promotions/:id/edit`; sibling lazy routes | PASS: seven fields, three sections, `FormInstance`, date normalize/format, validation summary/focus, semantic baseline equality, mock mutations, `useBlocker`, and `beforeunload` are present and focused verifier passes. Nested main landmark is F3. | NOT VERIFIED |
| Promotion History Modal | No history route; row action in ChatGPT Promotions list opens Modal | PASS: stable sample events, read-only metadata, event-only copy formatter, event-keyed in-memory comments, draft confirmation, and focus return are in source and focused verifier passes. F4/F6 concern comment submit/feedback lifecycle. | NOT VERIFIED |

Historical Phase 8A–8D reports describe earlier Claude-mounted pilots and explicitly report browser checks as unverified. Current source, rather than those old route claims, was used for this matrix.

## 5. ChatGPT route and platform isolation audit

- **Static route ownership:** `src/chatgpt/routes/route-meta.ts` has 10 IDs: Overview, Showcase, and eight pilot route IDs. `src/chatgpt/routes/route-config.tsx` contains 10 lazy page declarations. Product Labels and Promotion Types are parent/child route groups; Promotions Create/Edit are siblings; History is route-less.
- **No static collisions found:** Create paths are statically more specific than dynamic child paths. Claude and ChatGPT use separate route roots (`claude`, `chatgpt`) and separate metadata. Compare is mounted as its own route tree. Focused `verify-phase-8e-chatgpt-consolidation.mjs` passes.
- **Lazy boundaries:** matching path declarations are static and page modules are dynamically imported with `route.lazy`. The check confirms source boundaries only; this audit did not rebuild or inspect new browser network requests.
- **Navigation:** `ChatGPTLayout` derives route metadata from pathname and selects `menuParent` for child drawer menu highlighting. Menu destinations are ChatGPT-local. Shared `PlatformLinks` switch between `/`, Claude, ChatGPT and Compare without changing pilot route definitions.
- **Claude ownership:** current Claude route metadata has 31 route records, retains `promotion-types`, `promotions`, their create/edit routes, and the legacy redirects generated from that metadata. The Phase 8E verifier passes these source assertions.
- **Product Label path decision:** Product Label was introduced as a Phase 8A pilot, not part of the documented pre-Phase-8A Claude route baseline (Phase 8A report records 31 prior routes and then adds Product Labels). Its removal from Claude is consistent with the current authoritative ChatGPT-only pilot decision. Consequently, the Phase 8A-era `/claude/product-labels*` routes and generated unscoped `/product-labels*` redirects no longer resolve through Claude. No cross-platform redirect was added. This is an intentional pilot ownership change, not classified as a loss of pre-Phase-8A Claude functionality; external bookmarks to those later-created pilot paths were not tested.
- **Independent reviewer reconciliation:** the routing and UI reviewers initially noted the removed Product Label routes as a HEAD diff. Cross-checking the historical Phase 8A baseline and this task’s explicit ownership decision shows those were pilot additions. The retained Claude Promotion Type and Promotion Offer routes are the pre-existing business features; removal of the Product Label pilot is not a confirmed Claude baseline regression.

## 6. Claude baseline regression

**Static PASS:** Claude still registers its pre-existing Promotion Type and Promotion Offer list/create/detail/edit route IDs and lazy page imports. The three Claude Promotion Type components and four Claude Promotion Offer components show porcelain `M`, but directory-level `git diff --quiet HEAD` passes and representative blob hashes equal HEAD. The Claude Promotions list does not own the Phase 8D history modal action in the current diff.

**Static limitation:** Without a browser session, this does not prove that Claude pages render, that drawer focus works, or that route navigation behaves as before. The two old prunable worktree registrations were not touched.

## 7. Form and navigation lifecycle findings

- Product Label query helpers parse and update `q`, `line`, `status`, and `page`; the row link includes current `location.search` and `location.hash`; drawer close reconstructs the list URL from those values. The focus effect returns to the row action when available and otherwise to the list heading. These are source/helper assertions, not history/focus observations.
- Promotion Type uses a stable Form instance and `recordKey` initialization. It routes close/navigation through React Router `useBlocker`, presents a localized Stay/Discard modal, blocks native unload while dirty, disables close affordances while saving, validates fields and focuses the first error. Its dirty flag is touched-based (F7).
- Promotion Offer initializes only when the record key changes, stores the pristine baseline outside duplicate form state, compares meaningful form values, leaves the edit page open after successful update, navigates after create, uses `useBlocker` for route transitions, and attaches `beforeunload` while dirty or saving. Source has failure feedback and retryable mutation behavior but no deterministic browser save failure was exercised.
- Promotion History routes all Modal close mechanisms through a shared close request, confirms when a meaningful unsent draft exists, keeps comment text in Ant Design FormInstance, and maps comments to event ID. Focus is directed to event heading on open/event change and back to the initiating row after close by list code. F4/F6 remain source concerns.
- **NOT VERIFIED:** browser Back/Forward blocking, `beforeunload` prompts, duplicate submit timing, value persistence after failed Save, drawer focus containment/restoration, Modal X/Escape/mask handling, and close-confirmation interactions.

## 8. Accessibility and i18n

- The application has one shared i18next instance (`src/i18n/index.ts`); `LanguageSwitcher` is in shared `PlatformLinks`, and the outer Ant Design `ConfigProvider` maps `vi` to `vi_VN` and `en` to `en_US`. ChatGPT has a nested theme provider. The source supports language switching without changing route paths, but no rendered language transition was tested.
- Focus effects, labeled controls, error summaries, skip link, drawer/modal titles, and textual status/error feedback are visible in source. This is not a WCAG 2.2 AA conformance claim.
- F2 records ChatGPT pilot resource ownership coupling to Claude objects. The focused scripts and `npm run typecheck` establish vi/en key parity for tested namespaces, not translation quality, interpolation rendering, or independence.
- F3 records nested main landmarks on Promotion Full Page. The shell breadcrumb currently presents one route label after Workspace; nested drawer breadcrumb parent context and semantic active-menu state merit review (F5).
- Static overlay theming caveat: nested `ConfigProvider` is present, but Promotion Type and Promotion Offer call static Ant Design `Modal.confirm`/`message` APIs. Whether these static feedback surfaces inherit ChatGPT-scoped theme/portal context is **NOT VERIFIED** in the rendered application.
- Text expansion, 320px layout, focus visibility, keyboard traversal, popup/portal containment, and assistive-technology announcements are all **NOT VERIFIED**.

## 9. Compare regression

**Preserved by source scope:** no `src/compare/` file is modified relative to HEAD. Current `src/compare/scenarios.ts` still contains Scenario ID `drawer-vs-full-page`, all seven criteria (`completion`, `context`, `keyboard`, `narrow`, `confidence`, `validation`, `deep-link`), and the other four scenario IDs. `src/compare/records.ts` retains the `compare-workspace:v1:` key prefix, statuses including raw `approved`, and the existing browser-local draft qualification (not formal approval). It also retains the fixed 22-column English CSV header/order, BOM, CRLF, escaping, and `compare-matrix-local-draft.csv`. No app/browser action was performed that could load or overwrite stored observations.

**Integration mismatch:** Scenario 1’s ChatGPT destination remains unavailable and stale (F1). Current notes and browser localStorage values were not inspected; static source immutability is not proof of saved browser data contents. CSV download, its generated row values, and local-draft qualification were not exercised in a browser.

## 10. Executed checks

| Exact command | Result | Evidence boundary |
|---|---|---|
| `npm run typecheck` | **PASS**, exit 0 | Static TypeScript and resource types only. |
| `node scripts/verify-phase-8e-chatgpt-consolidation.mjs` | **PASS**, exit 0 | Route ownership, route patterns, query-state source, namespace key parity and scope assertions; not rendered routes. |
| `node scripts/verify-product-labels.mjs` | **PASS**, exit 0 | Filter/pagination helpers, lookup, query preservation and route/source assertions. |
| `node scripts/verify-promotion-type-quick-edit.mjs` | **PASS**, exit 0 | Fixture/service, route, field, validation, guard and translation source assertions. |
| `node scripts/verify-promotion-offer-full-page.mjs` | **PASS**, exit 0 | Semantic equality helper, fixture/service, route, fields, validation/guard and locale assertions. |
| `node scripts/verify-promotion-history-log-viewer.mjs` | **PASS**, exit 0 | Event lookup/order/immutability, comment helper, event-only copy and source assertions. |
| `git diff --check` | **PASS**, exit 0 | No whitespace errors in tracked diffs; Git emitted LF-to-CRLF advisories. Untracked files are not covered by this command. |
| `npm ls playwright @playwright/test puppeteer --depth=0` | **PASS (no packages listed)** | Confirms these named automation packages are not installed at project root. |
| `npm run build` | **NOT RUN** | Build writes `dist/` output and was excluded from this non-mutating audit. Prior Phase 8E report records an earlier build pass; this audit did not rerun it. |

No dev server was started, no deployed Pages site was visited, and no browser/DOM test was performed. The Vite base and SPA fallback source are covered by the Phase 8E verifier; this is not deep-link HTTP or deployed-hosting evidence.

## 11. Browser acceptance matrix

No usable interactive browser/DOM automation was available. A Firefox executable alias was found, but there was no supported way in this session to drive it or inspect rendered DOM. The following exact local URLs assume `npm run dev` using the repository’s `/demo-layout/` base. **Observed result cells are intentionally empty; every row is NOT VERIFIED.**

| Status | URL | Action and expected result | Observed result |
|---|---|---|---|
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/product-labels?line=cash-loan&status=active&page=1#row` | Search/filter/page the list, open a row, verify the read-only drawer, then close; list query/hash and focus should return. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/product-labels/product-label-001?line=cash-loan&status=active&page=1#row` | Refresh direct drawer URL; record loads; close returns to the filtered list with query/hash. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/product-labels/unknown-id` | Recoverable not-found view and usable return to list. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/promotion-types` | Open Edit for a fixture row; verify nested drawer and parent list context. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/promotion-types/promotion-type-1?source=acceptance#row` | Refresh; validate fields, Save/Cancel, dirty Stay/Discard, Back/Forward, record switch, vi/en and query/hash return. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/promotion-types/create` | Submit invalid and valid three-field forms; verify error recovery, one save, and dirty exit behavior. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/promotions` | Open Edit and View History; verify list context, event-only clipboard copy, comments, draft-safe close, event isolation, language switch and focus return. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/promotions/create` | Submit invalid/valid seven-field form; verify field summary/focus, save feedback, Cancel and dirty route blocking. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/promotions/promotion-1/edit?source=acceptance#row` | Refresh direct edit URL; edit then revert; test Stay/Discard on Back, platform switching and refresh warning; verify values survive failure/retry. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/claude/promotion-types` and `http://localhost:5173/demo-layout/claude/promotions` | Verify original Claude list/form behavior remains and no Scenario 1 pilot-only history action appears. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/compare/drawer-vs-full-page` | Verify existing notes/status survive; observe that current ChatGPT destination is marked unavailable; export and inspect CSV headers/content. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt` | Switch vi/en, keyboard navigate, inspect skip link/menu current state, then repeat pilot routes at 320px and desktop widths. | |

## 12. Remaining risks and decisions

- Resolve the Scenario 1 Compare destination/worksheet mismatch (F1) while preserving its stable scenario/criterion/storage/export contracts. Decide how the worksheet should represent four separate ChatGPT pilot paths.
- Extract pilot copy to ChatGPT-owned bilingual resources (F2) without changing visible translations.
- Correct nested landmark structure (F3) and verify route focus/accessibility in browser.
- Validate comment duplicate-submit and stale feedback cases (F4/F6) with real interactions.
- Review nested route breadcrumbs and semantic current navigation (F5).
- Decide whether Promotion Type's touched-based dirty guard is the intended acceptance behavior (F7).
- Confirm a Promotions list query error state is needed if the mock becomes fallible (F8).
- Establish real browser acceptance for keyboard, focus containment/restoration, drawer/modal close paths, route blockers, `beforeunload`, locale switching, and narrow layouts.
- GitHub Pages deep-link HTTP behavior and deployed site behavior were not exercised. No deployment readiness conclusion is made.
- The retired Phase 8A-era Claude Product Label URLs and generated unscoped aliases are no longer registered. This follows the ChatGPT-only pilot decision; any external bookmark retirement policy remains unverified and no cross-platform redirect was invented.

## 13. Final verdict

**CHANGES REQUIRED** before Scenario 1 integration can be accepted: the Compare Scenario 1 destination is demonstrably stale/unavailable under the authoritative ChatGPT ownership decision; the i18n resource ownership and source-level accessibility/comment concerns also need resolution or explicit acceptance.

Static evidence passes for typechecking and all focused Phase 8A–8E scripts. It confirms route structure and several pure helper/service contracts. It does not establish browser acceptance, keyboard accessibility, visual theme isolation, localStorage contents, clipboard results, responsive behavior, or GitHub Pages deployment behavior. Real browser interaction was **NOT PERFORMED**.
