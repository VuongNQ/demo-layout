# Phase 8H — Playwright Browser Acceptance

Author: Vuowng
Date: 2026-11-08
Repository: VuongNQ/demo-layout
Branch/revision: `feat/playground-compare` / `4b44187ea3a22239d027e0ebebdb8ccb3328a5e0`
Scope: Set up and execute Chromium acceptance tests for Scenario 1, Compare compatibility, and Claude baseline navigation.

## 1. Executive summary

**Final verdict: CHANGES REQUIRED.** A local Chromium browser session exercised the app with the configured `/demo-layout/` base path. The final Playwright run executed 14 tests: **6 passed, 8 failed, 0 skipped, 0 blocked**. This is actual browser evidence; it is not deployment evidence.

The passing cases verified Scenario 1 entry links and stable identity, synthetic Compare observation preservation and the exact 22-column English CSV header, vi/en switching without URL or note loss, Promotion Offer edit dirty/revert navigation, and Promotion History copy/comment/event isolation and draft-close behavior.

Failures exposed browser-visible issues: the Product Label filter option did not become visible/interactable, opening route-backed drawers emitted a React DOM nesting console error, Ant Design static feedback APIs emitted scoped-theme context warnings, Claude’s menu emitted an Ant Design warning, and the Product Label drawer exceeded a 320px viewport. No application source was changed in this task.

## 2. Source and worktree baseline

**Verified source evidence:** Read `AGENTS.md`, the available repository skills (`platform-routing`, `design-system-ui`, and `compare-workflow`), the Scenario 1 UX contract, Phase 8E–8G reports, current route registries, platform layouts, feature pages, Compare source, Vite configuration, and `package.json`.

**Verified checkout:** `E:\demo-layout`, branch `feat/playground-compare`, HEAD `4b44187ea3a22239d027e0ebebdb8ccb3328a5e0`. The worktree was clean at the start of this task. The final changed-file inventory is limited to `package.json`, `package-lock.json`, `playwright.config.ts`, `tests/e2e/scenario1.spec.ts`, and this report. No application source, production repository, profile, `.gitignore`, or worktree was modified.

The current route registry owns the four pilots under ChatGPT. The history viewer is opened from the ChatGPT Promotions list and has no separate route. Claude’s Promotion Type and Promotion Offer baseline routes remain registered. Compare retains scenario ID `drawer-vs-full-page` and its own storage/export contracts.

## 3. Environment and Playwright setup

- Installed `@playwright/test` **1.60.0** as a development dependency and updated the lockfile. This installation was authorized. The initial npm offline-cache attempt failed with `ENOTCACHED`; installation then succeeded through the configured package source without changing npm configuration.
- `npm ls @playwright/test --depth=0`: PASS, `@playwright/test@1.60.0`.
- `node_modules\.bin\playwright.cmd --version`: PASS, `Version 1.60.0`.
- Chromium and its headless shell were present in the Playwright cache; Chromium was used. Other browser binaries listed by the machine are not included in this test project.
- `playwright.config.ts` runs one serial Chromium project with a fresh Playwright context per test, uses screenshots and retained traces on failure, and writes artifacts to `%TEMP%\demo-layout-playwright-results` outside the repository.
- The configured web server runs the existing Vite dev script at `http://127.0.0.1:4187/demo-layout/`; Vite’s existing `/demo-layout/` base was preserved. No deployed GitHub Pages site was tested.
- A sandboxed browser launch initially returned `spawn EPERM`; the authorized test command was then executed with the required local process access. The final run was not blocked.

No existing browser test framework was found. The added `test:e2e` script does not replace `typecheck`, `build`, `dev`, or `preview` scripts. Test data is synthetic and scoped to fresh browser contexts. Only the Compare contract test writes a synthetic record under the existing Scenario 1 key; it does not access or overwrite a user browser profile.

## 4. Test coverage matrix

| Area | Browser result | Evidence and limit |
|---|---|---|
| Compare: four ChatGPT pilot links and stable scenario ID | PASS | Browser observed the four entry destinations; URL remained `compare/drawer-vs-full-page`. |
| Compare: existing notes, storage namespace, CSV headers/order/filename | PASS | Synthetic seeded notes were visible and retained; downloaded CSV had 22 exact English headers, expected notes/evidence, and `compare-matrix-local-draft.csv`. This was an isolated synthetic record, not a user’s pre-existing browser data. |
| vi/en switch, URL and Compare note retention | PASS | Changed language both ways on the worksheet; URL and visible observation remained unchanged. |
| Product Label: search and pagination | PARTIAL | Search narrowed results; page 2 navigation updated the query state. Combined test later failed at the product-line option visibility assertion. |
| Product Label: filter interaction | FAIL | After opening the Product Line Select, the `Credit card` option was present in the accessibility tree but not visible/stable; Playwright could not activate it. Status filtering and the rest of this combined test did not run. |
| Product Label: nested Drawer deep link, query/hash close, Escape, focus return | Assertions reached successfully; test FAIL | URL and focus assertions completed, but the test failed at teardown because the opened Drawer emitted the React DOM nesting console error described below. |
| Product Label: unknown ID recovery | Assertions reached successfully; test FAIL | Unknown-ID and return-to-list assertions completed; teardown failed on the same Drawer console error. |
| Promotion Type: three-field validation and Save | Assertions reached successfully; test FAIL | Validation feedback, synthetic Save, and updated list-row assertions completed; teardown failed because browser console captured Drawer/Ant Design feedback warnings. |
| Promotion Type: dirty Stay/Discard and browser Back | Assertions reached; test FAIL | Dirty confirmation and navigation flow ran; test teardown captured Drawer/Ant Design console errors. No separate claim is made about every close path. |
| Promotion Offer: Create required-field validation and Save | FAIL / incomplete | Required validation and value entry ran. The applicable-product option was not visible to Playwright, so successful Create and subsequent Cancel were not verified. |
| Promotion Offer: Edit direct URL/refresh, semantic dirty/revert, navigation guard | PASS | Browser observed direct route refresh, changed value dirty state, return to baseline clearing it, Stay, and Discard navigation. |
| Promotion History: event-only copy, comments, rapid duplicate activation, event isolation | PASS | Clipboard contained the selected event ID and excluded comment text. Double activation inserted one comment; intentional later repeat inserted a second; switching events isolated and restored thread contents. |
| Promotion History: draft-safe Escape/Close and focus return | PASS | Unsent draft confirmation offered Keep writing; visible Close then Discard draft closed the Modal and returned focus to its triggering action. |
| ChatGPT-only pilots and Claude baseline routes | Assertions reached; test FAIL | Browser observed ChatGPT shell and Claude Promotion Type/Promotions pages without the Phase 8D history action. Teardown failed on the Claude Ant Design Menu console warning. Static Phase 8G checks separately passed route ownership assertions. |
| Responsive 320px / desktop | FAIL at 320px | At 320px viewport, Product Label Drawer right edge was `627.77px`, exceeding the viewport. The test stopped before its desktop/language assertions. |
| Console and uncaught page errors | FAIL | Test fixture recorded actual `console.error` messages. No uncaught `pageerror` was reported in the covered cases. |

## 5. Actual browser findings and failure reproduction

### F1 — Product Label filter option is not interactable in Chromium

**Observed:** On `/demo-layout/chatgpt/product-labels`, after opening the Product Line filter, Playwright resolved the `Credit card` option by accessible role/name but its visibility/stability checks never succeeded. `Playwright` logged that the option was not visible. The combined search/filter/pagination test therefore stopped before the Status filter and Drawer assertions. The applicable-products selector on Promotion Offer Create likewise did not expose a visible option, so Create could not be completed.

**Reproduction:** Open `/demo-layout/chatgpt/product-labels`, open “Filter by product line”, then attempt to select “Credit card”. For Promotion Offer, open `/demo-layout/chatgpt/promotions/create`, satisfy required text fields, open “Applicable products”, then select an option.

**Impact:** Filter controls and product selection could not be validated as operable through visible browser interaction. This is a browser-observed interaction failure, not inferred from static code. No application fix was made.

### F2 — Drawer portal produces invalid DOM nesting warning

**Observed:** Opening the Product Label or Promotion Type route-backed Drawer logged React `validateDOMNesting`: a `<div>` cannot appear as a child of `<html>`. The stack identifies Ant Design `DrawerPopup`, `ProductLabelQuickViewRoute` or `PromotionTypeDrawerRoute`, and `ChatGPTLayout`. The test’s console guard treats `console.error` as a failure.

**Impact:** Drawer assertions can succeed, but affected tests fail at teardown due to the actual browser console error. The warning also raises a rendered-DOM/portal containment concern. This audit does not prove additional focus or accessibility failures.

### F3 — Scoped Ant Design static APIs warn on context use

**Observed:** Promotion Type/Offer interactions logged Ant Design warnings that static `Modal` or `message` functions cannot consume dynamic theme context and recommend the `App` component. This is emitted by current interactions and captured by the console guard. The exact warning varies by flow; tests were not configured to suppress it.

**Impact:** Affected browser tests fail even where their feature assertions complete. Scoped theme behavior for static feedback APIs remains a rendered integration concern.

### F4 — Claude menu warning

**Observed:** Visiting the Claude baseline menu emitted Ant Design’s warning that `inlineCollapsed` does not control Menu under Sider and `collapsed` should be set on Sider. The platform navigation assertions reached their end, but the console guard failed.

**Impact:** Browser baseline test fails its console-clean criterion. This is not a route failure and the task made no Claude change.

### F5 — 320px Drawer overflows

**Observed:** At viewport width 320, the Product Label Drawer bounding box ended at x=`627.77`, outside the viewport. The test failed the explicit right-edge assertion.

**Impact:** Small-screen access to drawer content/actions may be clipped or require horizontal overflow. Desktop layout was not reached in this test; no WCAG conformance claim is made.

### F6 — React Router hydration fallback warning

**Observed:** Vite logged `No HydrateFallback element provided to render during initial hydration` as `console.warn`. It is not counted as a console error by the test guard. It is reported as a warning, not as a confirmed failure in the executed assertions.

## 6. Accessibility and responsive limitations

Browser checks used accessible role/name locators and exercised keyboard Escape, focus return, selected-language controls, route navigation, and visible confirmation actions. Product Label Escape/focus return and History Modal focus return assertions completed. The Product Label Drawer fails the measured 320px width constraint. No axe or other automated accessibility scanner was installed; no manual contrast audit or exhaustive keyboard-only audit was performed. WCAG 2.2 AA remains unverified. Desktop view at 1280px was not reached in the combined responsive case after the 320px assertion failed.

## 7. Executed commands and results

| Command | Result |
|---|---|
| `npm install --save-dev @playwright/test` | PASS after authorized access to configured package source; package and lockfile updated. Initial offline attempt was blocked by missing cached metadata (`ENOTCACHED`). |
| `npx playwright install chromium` | PASS / available; Chromium binaries were already present in the local Playwright cache. |
| `npm ls @playwright/test --depth=0` | PASS — `@playwright/test@1.60.0`. |
| `node_modules\\.bin\\playwright.cmd --version` | PASS — 1.60.0. |
| `node_modules\\.bin\\playwright.cmd install --list` | PASS — Chromium/headless shell and other machine binaries listed; suite project uses Chromium only. |
| `npm run typecheck` | PASS. |
| `npm run test:e2e -- --reporter=list` | FAIL — 14 total; 6 passed, 8 failed, 0 skipped, 0 blocked. Runtime 59.8 seconds. |
| `npm run build` | PASS — Vite production build completed; `dist/404.html` generated; lazy feature chunks emitted. |
| `git diff --check` | PASS. |
| `node scripts/verify-product-labels.mjs` | PASS — deterministic filtering/pagination/query/lookup and Pages fallback source checks. |
| `node scripts/verify-promotion-type-quick-edit.mjs` | PASS — fixture, service, routes, dirty guard, translation parity checks. |
| `node scripts/verify-promotion-offer-full-page.mjs` | PASS — semantic dirty state, service/cache ownership, route and validation source checks. |
| `node scripts/verify-promotion-history-log-viewer.mjs` | PASS — event immutability/order, comments, copy boundary, locale parity source checks. |
| `node scripts/verify-phase-8g-integration-remediation.mjs` | PASS — four pilot links, IDs/storage/CSV schema, i18n ownership, landmarks/navigation, Claude baseline source checks. |
| `node scripts/verify-phase-8e-chatgpt-consolidation.mjs` | FAIL due to its unchanged assertion that `package.json` and `package-lock.json` have no diff from HEAD. The authorized Playwright dependency and script necessarily change those files. No verifier was weakened. |

No Phase 8F verification script was found in the repository. The Phase 8E failure is an existing verifier scope conflict, not a failure of its other assertions; the script exits at its final no-diff check.

## 8. Compare and Claude regression results

**Compare browser evidence:** Scenario 1 remained `drawer-vs-full-page`; the four links targeted ChatGPT routes, and the worksheet retained its synthetic saved notes during language changes. The exported CSV used the exact expected 22 English headers, included the seeded observation/evidence text, and kept its existing draft-qualified filename. No real localStorage profile or note data was changed.

**Claude browser evidence:** `/demo-layout/claude/promotion-types` and `/demo-layout/claude/promotions` rendered baseline headings and did not show the Phase 8D “View history” action. These assertions ran, but the test failed because the Claude Menu emitted its Ant Design console warning. `verify-phase-8g-integration-remediation.mjs` also passed source checks for Claude baseline route preservation and pilot ownership.

## 9. Artifacts and reproduction locations

Screenshots and traces are retained outside the repository at:

`C:\Users\anhBa\AppData\Local\Temp\demo-layout-playwright-results\`

For example, the Product Label filter failure artifacts are under `scenario1-Product-Label-…-the-read-only-nested-Drawer-chromium\test-failed-1.png` and `trace.zip`. The 320px overflow artifacts are under `scenario1-Platform-integra-…-language-accessibly-chromium\test-failed-1.png` and `trace.zip`. Playwright generated one screenshot and trace for each failed test. Passing tests did not create failure artifacts. No browser output or artifacts were placed in the repository.

## 10. Changed files

- `package.json` — added `@playwright/test` dev dependency and `test:e2e` script.
- `package-lock.json` — locked the authorized dependency and its resolved dependency graph.
- `playwright.config.ts` — Chromium project, Vite webServer, `/demo-layout/` base URL, fresh contexts, failure artifacts in OS temp.
- `tests/e2e/scenario1.spec.ts` — 14 browser tests covering Compare, the four pilots, platform ownership, language switching, Claude baseline, console errors, and 320px responsive bounds.
- `docs/reports/2026-11-08/phase-8h-playwright-browser-acceptance.md` — this report.

## 11. Risks, unverified items, and NEEDS-TEAM-DECISION

- **Browser acceptance is incomplete:** eight tests fail, including filter/product option visibility, console errors/warnings, and 320px overflow. Fixes require application review and were not authorized in this test-setup task.
- **Promotion Offer Create remains unverified past product selection.** Promotion Offer Edit navigation/dirty behavior passed its browser test; save behavior was not established by that test.
- **Promotion Type dirty navigation:** the browser exercised Stay/Discard/Back flow, but a clean test result is blocked by console errors; close-by-Escape/mask and refresh behavior were not exhaustively covered.
- **Accessibility:** focus checks are narrow; keyboard-only end-to-end coverage, contrast, screen-reader announcements, and WCAG 2.2 AA are not verified.
- **Hosting:** local Vite `/demo-layout/` was exercised. No deployed GitHub Pages URL, CDN caching, or production hosting behavior was tested.
- **Phase 8E verifier:** its no-diff condition conflicts with the authorized package/script addition. A future test-aware update may be needed, but the verifier was not changed here.
- **NEEDS-TEAM-DECISION:** none for the Playwright setup itself. Product UI remediation should follow the already approved platform and UX contracts; this report does not alter those decisions.

## 12. Final verdict

**CHANGES REQUIRED before Scenario 1 can be described as browser-accepted.** Playwright and Chromium are set up, and real browser interactions ran against the local Vite app. Six tests passed, including Compare CSV compatibility and Promotion History interactions. Eight tests failed; screenshots and traces are available in the OS temporary artifact directory. TypeScript, production build, `git diff --check`, and Phase 8A–8D/8G focused scripts passed. The Phase 8E script failed only at its package-manifest no-diff assertion. No application behavior was changed and no deployed-site acceptance was performed.
