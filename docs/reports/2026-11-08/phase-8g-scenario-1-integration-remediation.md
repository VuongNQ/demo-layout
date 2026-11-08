# Phase 8G — Scenario 1 Integration Remediation

| Metadata | Value |
|---|---|
| Author | Vuowng |
| Date | 2026-11-08 |
| Repository | VuongNQ/demo-layout |
| Branch | `feat/playground-compare` |
| Revision | `981bfa707945cc2b03f17ab7504ea545c3af83cf` |
| Scope | Compare Scenario 1 destination presentation, ChatGPT-owned translations, ChatGPT landmark and navigation semantics, and Promotion History comment submission/feedback |

## 1. Scope and verified baseline

**Verified source baseline:** The checkout is `E:\demo-layout`, on `feat/playground-compare` at `981bfa707945cc2b03f17ab7504ea545c3af83cf`. It is one commit ahead of `origin/feat/playground-compare`. `git status --short --branch` showed existing Phase 8E tracked edits and untracked ChatGPT pilot source, scripts, and reports before this remediation. No pre-existing work was cleaned or reset.

**Instructions applied:** Read `AGENTS.md` and the installed `platform-routing`, `design-system-ui`, and `compare-workflow` skills. Confirmed the local `routing-architect` and `ui-reviewer` TOML definitions exist; no profile files were changed. Read the Scenario 1 UX Contract and Phase 8E/8F reports as historical guidance, then verified the current implementation directly. The UX Contract describes four complementary pilots; the current route registry owns Product Labels, Promotion Types, and Promotions under ChatGPT. Promotion History remains a Modal opened from Promotions and has no dedicated route.

**Current source evidence:** `src/chatgpt/routes/route-meta.ts` contains the registered route IDs and path metadata. `src/chatgpt/routes/route-config.tsx` provides the lazy page implementations. Claude still owns its pre-existing Promotion Type and Promotion Offer routes. Compare still uses five scenario IDs, with Scenario 1 `drawer-vs-full-page` and seven existing criteria.

## 2. Findings F1–F8 disposition

| Finding | Severity | Disposition | Evidence boundary |
|---|---|---|---|
| F1 — stale/unavailable Compare destination | HIGH | Remediated. Scenario 1 now identifies the approved Product Detail Presentation Patterns and exposes four ChatGPT pilot entry links. Its persisted ID, criteria, record shape, and CSV schema remain unchanged. | Executable source checks; browser navigation NOT VERIFIED. |
| F2 — ChatGPT resources alias Claude page objects | MEDIUM | Remediated. ChatGPT pilot translation composition now owns independent vi/en values for the pilot strings consumed by ChatGPT. | Runtime object identity, source checks, TypeScript parity; rendered copy NOT VERIFIED. |
| F3 — nested `main` elements | MEDIUM | Remediated. Promotion Full Page uses non-landmark `div` containers in loading, error, not-found, and ready states; the ChatGPT shell retains its single `main`. | Source assertion and production build; rendered accessibility NOT VERIFIED. |
| F4 — comment duplicate-submit guard released synchronously | MEDIUM | Remediated. A form-submit capture lock spans Ant Design validation through synchronous insertion/reset; the captured event ID is checked against the current selected ID and current form value. | Source assertion; rapid user activation NOT VERIFIED in a browser. |
| F5 — nested navigation semantics | LOW | Remediated. ChatGPT child routes show parent/child breadcrumbs; the exact page uses `aria-current="page"` and an active parent link uses `aria-current="location"`. | Source and type checks; accessibility tree NOT VERIFIED. |
| F6 — stale successful-comment feedback | LOW | Remediated. Success feedback clears when the composer changes and when the selected event changes. | Source assertion; announcement timing NOT VERIFIED. |
| F7 — Promotion Type dirty detection is touched-based | REVIEW ONLY | Preserved unchanged. `form.isFieldsTouched()` remains the dirty contract; changing then reverting a value may still be treated as dirty. | Current source; interaction NOT VERIFIED. |
| F8 — Promotions list lacks explicit query error/retry | REVIEW ONLY | Left unchanged. The current fictional `listPromotions()` awaits a delay and returns its in-memory `store`; the service does not define a failure branch. The list consumes loading/data only. | Current source; no synthetic failure was added. |

## 3. Impact and risk classification

- **HIGH — Compare Scenario 1 presentation.** The scenario card and worksheet destinations are user-facing, and the Scenario object also provides fixed English values to CSV generation. Changes were limited to the existing Scenario 1 title/task/record/steps and its single compatible `chatgpt` destination. No record serializer, localStorage contract, or criteria changed.
- **MEDIUM — ChatGPT translation composition and shell route presentation.** These affect pilot wording and nested routes across the ChatGPT shell. Platform routes remain owned by `src/chatgpt/routes/`; no Claude navigation or root router changes were made.
- **LOW/MEDIUM — History comment handling.** This stays inside the route-less ChatGPT Modal and preserves event-keyed in-memory comments and `FormInstance` ownership.

**Inference:** The source-level changes should address the confirmed issues without altering domain behavior. They do not establish rendered navigation, screen-reader output, focus timing, or responsive behavior.

## 4. Compare destination remediation

`src/compare/scenarios.ts` retains `drawer-vs-full-page`, all seven criterion IDs (`completion`, `context`, `keyboard`, `narrow`, `confidence`, `validation`, `deep-link`), and all five scenario IDs. Scenario 1’s English title is now `Product Detail Presentation Patterns`; its English and vi UI copy describes the four pilots. Its ChatGPT destination is `/chatgpt/product-labels` with availability `available`, a registered list entry point.

`src/compare/CompareWorkspace.tsx` adds a Scenario 1-only destination list generated from ChatGPT route metadata:

| Pilot | Destination | Entry behavior |
|---|---|---|
| Product Label — Drawer Quick View | `/chatgpt/product-labels` | Opens the list. |
| Promotion Type — Drawer Quick Edit | `/chatgpt/promotion-types` | Opens the list. |
| Promotion Offer — Full Page Create/Edit | `/chatgpt/promotions` | Opens the Promotions list. |
| Promotion History — Log Viewer Modal | `/chatgpt/promotions` | The localized instruction directs the user to select View History on a row; no history route was invented. |

The Compare index now reflects Scenario 1’s available ChatGPT destination. Other scenarios continue to show ChatGPT unavailable. The existing Claude destination/current URL remain as defined in source.

**Compatibility evidence:** `src/compare/records.ts` is unchanged from HEAD. The `compare-workspace:v1:` key, all five scenario IDs, the seven Scenario 1 criterion IDs, raw status identifiers including `approved`, 22 English CSV headers and their order, record/row layout, quoting, BOM, CRLF, and `compare-matrix-local-draft.csv` remain intact. Only the Scenario 1 system-owned English descriptive values and its destination URL/availability change in future exports; the CSV schema and existing browser records are not migrated or rewritten. Existing saved observations and open-question text remain stored as before.

## 5. i18n ownership remediation

`src/i18n/resources.ts` now defines `chatgptPilotPages` as a ChatGPT-owned vi/en resource composition. The consumed Promotion Type, Promotion Offer, and Promotion History copy is independently represented there; ChatGPT’s `scenario1` and `pages` namespaces use these objects. ChatGPT no longer assigns mutable objects from `composedResources.*.claude.pages.*` to its pilot namespaces. Claude’s composed resources and copy were not edited by this remediation.

Compare’s `pilotLinks` labels/help and Scenario 1 title, record, task, expected outcome, and steps have parallel vi/en keys. `chatgptPagesKeyParity` was added alongside the existing TypeScript parity checks. The focused verifier recursively compares vi/en ChatGPT and Compare resource key paths and checks that ChatGPT promotion resources are distinct from Claude resource objects.

**Verification boundary:** Key parity and object independence are executable/source checks. Translation quality, interpolation, and rendered text expansion were not browser-tested.

## 6. Promotion Full Page landmark fix

`src/chatgpt/features/promotions/PromotionFullPage.tsx` replaces its route-level `<main>` wrappers with `<div className={styles.page}>` for the skeleton, load-error, not-found, and form states. Headings, sections, title focus refs, page CSS class, validation content, and retry/navigation actions remain in place. `ChatGPTLayout.tsx` continues to own `<main id="chatgpt-main">` around `<Outlet />`.

**Executed source check:** `verify-phase-8g-integration-remediation.mjs` asserts one shell main and no main in Promotion Full Page. This does not prove the rendered accessibility tree.

## 7. Comment submit and feedback fixes

In `src/chatgpt/features/promotions/PromotionHistoryLogViewer.tsx`:

- `onSubmitCapture` acquires a ref lock before Ant Design’s form submission/validation path. While locked, another submit event is prevented and stopped.
- The submitting event ID is captured in `submittingEventIdRef`. Before insertion, the handler verifies that this ID still matches `selectedEventIdRef.current`, resolves the corresponding current mock event, and confirms the current FormInstance value matches the validated value.
- The lock remains held through successful in-memory insertion and `form.resetFields()`, or is released by `onFinishFailed` after validation failure. Event switching and closing are ignored while a submission boundary is active.
- No timer, network delay, backend pending state, text-based deduplication, or API call was introduced. After a successful insertion/reset, a user can intentionally re-enter and submit identical comment text.
- Successful feedback is cleared on composer value changes and selected event changes. Comment association remains `eventId`-scoped, insertion order remains sequence-based, and FormInstance remains the composer state owner.

**Guarantee and limit:** The guard serializes submit events across Ant Design validation and the synchronous insert/reset boundary and prevents a second activation from inserting the same still-submitted form value. It does not deduplicate separate intentional submissions, and no DOM/browser test reproduced rapid double activation.

## 8. Nested navigation semantics

`src/chatgpt/layout/ChatGPTLayout.tsx` retains parent menu highlighting using `menuParent`. Nested routes now render breadcrumb links for Workspace and the parent list, followed by the current child breadcrumb. Parent menu links use `aria-current="location"` while a child route is active; only the exact route gets `aria-current="page"`. The menu is not a collapsible disclosure, so no `aria-expanded` state was added.

`src/chatgpt/routes/route-meta.ts` supplies non-interpolated child breadcrumb keys for Promotion Type Create/Edit and Promotion Offer Create/Edit. Their translations are part of the independent ChatGPT pilot resources. `ChatGPTLayout.module.scss` resets the breadcrumb list, supports wrapping, and retains visible keyboard focus on breadcrumb links.

**Not verified:** Browser keyboard traversal, actual React Router `NavLink` accessibility output, screen-reader interpretation, and narrow-screen wrapping.

## 9. Deliberately deferred decisions

- **F7 — NEEDS-TEAM-DECISION:** The Phase 8B drawer uses touched-based dirty detection. The user did not authorize changing the approved behavior; deciding whether changing and reverting a value should clear dirty state remains open.
- **F8 — no implementation change:** The current list mock has no defined rejection/error result. A retry UI would be speculative until a supported fallible source or reproducible demo failure contract exists.
- No approval workflow or new Compare status semantics were introduced.

## 10. Files changed

Files changed by this remediation:

- `src/compare/scenarios.ts`
- `src/compare/CompareWorkspace.tsx`
- `src/i18n/resources.ts`
- `src/chatgpt/features/promotions/PromotionFullPage.tsx` (pre-existing untracked Phase 8E pilot source)
- `src/chatgpt/features/promotions/PromotionHistoryLogViewer.tsx` (pre-existing untracked Phase 8E pilot source)
- `src/chatgpt/layout/ChatGPTLayout.tsx` (pre-existing Phase 8E tracked work)
- `src/chatgpt/layout/ChatGPTLayout.module.scss`
- `src/chatgpt/routes/route-meta.ts` (pre-existing Phase 8E tracked work)
- `scripts/verify-phase-8e-chatgpt-consolidation.mjs` (pre-existing untracked verifier; Compare preservation assertion now checks records contract and explicit presentation tests)
- `scripts/verify-promotion-history-log-viewer.mjs` (pre-existing untracked verifier; assertion updated for event-ID-safe insertion)
- `scripts/verify-phase-8g-integration-remediation.mjs` (new focused executable verifier)
- `docs/reports/2026-11-08/phase-8g-scenario-1-integration-remediation.md` (this report)

**Preserved pre-existing work:** Other Phase 8E route, menu, Claude baseline, Product Label, Promotion Type, Promotion Offer, fixture, and report changes remain in the worktree. No application files outside the scoped Compare/ChatGPT/i18n work were intentionally edited. No production repository, profiles, lockfiles, or dependencies were changed.

## 11. Executed validations

| Command | Result | Evidence boundary |
|---|---|---|
| `npm run typecheck` | PASS (exit 0) | TypeScript only. |
| `npm run build` | PASS (exit 0); Vite built and `scripts/spa-fallback.mjs` wrote `dist/404.html` | Production bundle/build and existing lazy chunk emission; not browser behavior. |
| `node scripts/verify-product-labels.mjs` | PASS | Existing Product Label route/helper source assertions. |
| `node scripts/verify-promotion-type-quick-edit.mjs` | PASS | Existing Promotion Type service/form/dirty contract source checks. |
| `node scripts/verify-promotion-offer-full-page.mjs` | PASS | Existing Promotion Offer semantic dirty/service/guard checks. |
| `node scripts/verify-promotion-history-log-viewer.mjs` | PASS | Event fixtures/utilities plus source assertions; not DOM testing. |
| `node scripts/verify-phase-8e-chatgpt-consolidation.mjs` | PASS | Platform ownership, Claude baseline, lazy routes, Compare contracts/destinations, and resources. |
| `node scripts/verify-phase-8g-integration-remediation.mjs` | PASS | Four destinations, stable IDs/criteria, 22 headers, storage/export source contract, i18n independence/parity, landmark count, comment lock/feedback, navigation semantics, F7/F8 preservation. |
| `git diff --check` | PASS (exit 0) | No whitespace errors; Git emitted LF-to-CRLF advisories for existing Windows-normalized worktree files. It does not inspect untracked files. |
| `npm ls playwright @playwright/test puppeteer --depth=0` | No packages installed (exit 1, empty dependency tree) | These named root automation dependencies are unavailable. No package was installed. |
| `where firefox` | Found `C:\Users\anhBa\AppData\Local\Microsoft\WindowsApps\firefox.exe` alias | Alias presence does not establish a usable interactive browser. |

`npm run build` emitted the existing ChatGPT pilot chunks, including `ProductLabelsListPage`, `PromotionTypeDrawerRoute`, `PromotionFullPage`, and `PromotionsListPage`. Build output is not evidence that their rendered interactions work.

## 12. Compare storage/CSV compatibility

**Verified:** `src/compare/records.ts` has no diff from HEAD. The new 8G verifier constructs Scenario 1 CSV and checks all 22 header names and order, fixed storage prefix, status identifiers, BOM/CRLF and filename source. The updated Phase 8E verifier also checks the unchanged record implementation.

**Not verified:** No browser was opened, so existing browser localStorage contents were not read or written and actual downloaded CSV bytes were not inspected. The serializer’s source and generated test string show the expected compatibility; this is not a browser export acceptance result.

## 13. Claude and ChatGPT regression

**Source/verification evidence:** ChatGPT still owns the four pilot entry points; History stays route-less. Claude route metadata remains 31 canonical patterns and retains Promotion Type and Promotions route definitions. Root router and legacy redirect files are unchanged from HEAD. The new changes do not alter Claude feature components, route registrations, form logic, or theme ownership. All five existing Phase 8A–8E focused verifiers passed.

**Inference:** Existing Claude baseline routing and feature behavior should be unaffected by these scoped changes. Runtime route rendering, deep-link refresh, drawer lifecycle, language switching, and cross-platform navigation remain unverified.

## 14. Browser acceptance status

**Real browser interaction was NOT performed.** Available tools did not include a browser/DOM driver; project-root Playwright/Puppeteer packages were absent. The discovered Firefox path was a WindowsApps alias only. No screenshots or rendered observations were produced.

| Status | URL | Manual action and expected result | Observed result |
|---|---|---|---|
| NOT VERIFIED | `http://localhost:5173/demo-layout/compare/drawer-vs-full-page` | Confirm approved title and four ChatGPT links; Product Label, Promotion Type and Promotions links navigate correctly; History help points to View History. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/product-labels` | Open/close the Quick View drawer and verify list context. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/promotion-types` | Open the Quick Edit drawer, verify parent highlighting/breadcrumb, Save/Cancel, and dirty confirmation. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/promotions` | Open Full Page Create/Edit, test validation and dirty navigation; use a row’s View History action. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/promotions` | In History Modal, rapidly activate submit and confirm one insertion per submitted form value; add a second intentional same-text comment; switch event and begin a new draft to verify feedback clears. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/promotion-types/promotion-type-1` and `http://localhost:5173/demo-layout/chatgpt/promotions/promotion-1/edit` | Inspect child breadcrumb hierarchy, menu parent context, and accessibility tree; parent is location context, child is current page. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/chatgpt/promotions` at 320px and desktop width | Verify wrapped breadcrumbs, pilot destination area, and modal/page layout without clipping. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/claude/promotion-types` and `http://localhost:5173/demo-layout/claude/promotions` | Recheck Claude baseline navigation and absence of ChatGPT pilot-only history controls. | |
| NOT VERIFIED | `http://localhost:5173/demo-layout/compare/drawer-vs-full-page` | Confirm existing observations/status remain; export CSV and inspect header/order, English system text, and filename. | |

## 15. Risks and unverified behavior

- No rendered browser acceptance: Compare navigation, child breadcrumbs, semantic menu state, Modal rapid-submit behavior, feedback clearing, focus restoration, keyboard behavior, and 320px layout are all **NOT VERIFIED**.
- No deployment or GitHub Pages host was visited. Local production build/fallback generation is not deployed-host evidence.
- Scenario 1 system-owned English CSV prose changes to the new approved framing. Existing stored observation fields and the serialization schema remain unchanged, but prior exported CSV comparison text will differ from future exports for this scenario.
- Independent ChatGPT-owned pilot translations intentionally duplicate current wording. Future copy edits must update ChatGPT resources separately from Claude resources.
- The submit guard depends on Ant Design’s form submit/validation callbacks; source verifies wiring, but the rapid double-activation behavior still requires browser confirmation.
- F7’s conservative touched-based dirty behavior remains, and F8 does not currently expose a list query failure state because the mock service supplies no failure contract.

## 16. NEEDS-TEAM-DECISION

- **F7:** Decide whether Promotion Type Quick Edit should continue treating “change then revert” as dirty, or whether a separate semantic-value comparison is authorized. No behavior was changed in Phase 8G.
- Browser acceptance for the critical flows and accessibility behavior is still required before claiming integration acceptance or WCAG conformance.

## 17. Final verdict and handoff

**Final verdict: PASS WITH WARNINGS (source/build scope only); browser acceptance remains NOT VERIFIED.** F1–F6 are remediated in current source and the focused static/executable checks, TypeScript check, production build, and whitespace check passed. F7 remains unchanged pending a team decision; F8 remains unchanged because the current mock list service has no defined failure path. Do not treat this verdict as browser or deployment readiness.

Next: run the manual browser matrix above, especially Compare’s four entry links, nested navigation semantics, Full Page/Drawer lifecycle, rapid comment submit, and feedback reset. Then decide F7 explicitly if semantic dirty-state is required.
