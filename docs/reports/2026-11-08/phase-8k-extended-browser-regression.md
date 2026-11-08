# Phase 8K — Extended Five-Scenario Browser Regression

Author: Vuowng  
Date: 2026-11-08  
Repository: VuongNQ/demo-layout  
Branch/revision: `feat/playground-compare` / `ff2b6516403057d2d11926fc8133a07c43dc5de2`  
Worktree: `E:\demo-layout`  
Scope: Extended Chromium acceptance, known console warning investigation, and test/verifier maintenance. No application source changes.

## 1. Executive summary

**Verdict: PASS WITH WARNINGS.** The final Chromium suite completed **32 passed, 0 failed, 0 skipped, 0 blocked** on the inspected revision. It preserves all 19 Phase 8J tests and adds 13 browser cases across Scenarios 2–5. The additional assertions exercised unsaved Drawer exits and history, reorder invariants, cross-section validation recovery, conditional settings fields, semantic dirty state, unload protection, and responsive save controls.

No application defect was confirmed in this run. The investigation continues to observe React Router's initial `HydrateFallback` development warning and an `rc-util` circular-reference warning on Scenario 5 save paths. They are classified below; neither was suppressed. Browser assertions and warnings are not an accessibility-conformance or deployment-readiness claim.

## 2. Verified baseline

**Checkout evidence:** `git branch --show-current` returned `feat/playground-compare`; `git rev-parse HEAD` returned `ff2b6516403057d2d11926fc8133a07c43dc5de2`. At final inventory, the only modified pre-report files were `tests/e2e/scenarios2-5.spec.ts` and `scripts/verify-phase-8e-chatgpt-consolidation.mjs`. Their prior changes were preserved. No application source, dependency manifest, lockfile, route registry, Claude business feature, Compare implementation, profile, or worktree registration was changed for Phase 8K.

The checkout advanced from Phase 8J's reported revision while this work was underway. The final browser and static checks were rerun on the current revision. No commit was created by this task.

**Tooling evidence:** Local `@playwright/test` is `1.60.0`; `npx playwright --version` returned `Version 1.60.0`. `npx playwright install --list` found Chromium revision `1223` and its headless shell in `C:\Users\anhBa\AppData\Local\ms-playwright`. Chromium `148.0.7778.96` is the browser version recorded for this same revision in the Phase 8J report; this task did not independently query the executable's version string. The suite used the configured Chromium project.

`playwright.config.ts` uses the Vite dev server, the `/demo-layout/` base path, one worker, and a fresh Playwright context for each test. Screenshots and traces are configured on failure under `%TEMP%\demo-layout-playwright-results`. No personal browser profile or user-owned Compare storage was used.

## 3. Test coverage expansion

The existing suite had 19 tests (14 Scenario 1 tests and five Scenarios 2–5 tests). Phase 8K retained their assertions and added 13 tests, bringing the suite to 32.

The Scenarios 2–5 fixture records `console.warn`, `console.error`, and `pageerror` separately. It classifies only the exact React Router `No \`HydrateFallback\` element provided to render during initial hydration` warning and exact `rc-util` `There may be circular references` message as known diagnostics; any other warning, error, or uncaught page error fails the test. Per-test diagnostics are attached as test artifacts. This is explicit classification, not global suppression.

Test locator adjustments were limited to the new/expanded tests: visible Ant Design Select dropdown scoping, refreshed error-summary locators, unique offer-ID extraction from each row, and distinct Close button selection. Assertions were not removed to make the run pass. A prior calibration failure showed the Scenario 5 Select popup was visibly open while a hidden duplicate option node confused the role locator; the test now targets the visible dropdown and its visible option, matching the existing Scenario 1 approach. The focused test and final suite passed without force-click or fixed delay.

## 4. Scenario 1 regression

**Browser evidence:** The retained Scenario 1 tests passed as part of the 32-test run. Coverage includes Compare's four ChatGPT Scenario 1 entry links, the stable `drawer-vs-full-page` worksheet and synthetic notes, CSV export with 22 English columns, Product Label list filters and nested read-only Drawer, Promotion Type Quick Edit, Promotion Offer Full Page, Promotion History Modal, vi/en switching, and tested close/focus flows.

**Boundary:** These are the behaviors asserted by the existing tests. They do not cover every Phase 8A–8D interaction or every browser/accessibility state.

## 5. Scenario 2 results

**Browser PASS:** Added coverage opened a direct drawer URL with query and hash, refreshed it, submitted invalid values and verified they remained in the form, then reverted the edited fields to the pristine baseline and verified the semantic clean state. Dirty exits through X, visible Close, Escape, and backdrop each surfaced Stay/Discard; Stay retained the draft and URL, while Discard returned to the list. A separate test verified clean Back/Forward navigation retained query/hash, and switching records after discard did not leak the previous record's values.

The existing Save, validation, and route-state tests remained passing. Browser assertions cover the specific tested state transitions; they do not exhaust every possible overlap of repeated navigation attempts.

## 6. Scenario 3 results

**Browser PASS:** The keyboard-accessible Move Down control was focused and activated with Enter; the item moved within its page. Discard restored the original order. A separate flow reordered the first offer to global position 120, saved, and asserted exactly 120 rows, 120 unique stable IDs, and the moved ID at the last position. The test also verified navigation after creating a page-local unsaved reorder.

This verifies the demo's stated reorder interactions at the tested boundaries, not every possible sequence across all pages.

## 7. Scenario 4 results

**Browser PASS:** The expanded test verified unique generated input IDs, submitted both tab and anchor presentations, and corrected errors in different orders. After each correction the error summary showed the remaining issue, then disappeared when resolved. Clicking summary actions moved to the appropriate section/control and focused it. Switching tabs retained the entered values; the anchor presentation likewise retained values while navigating sections.

The fictional reminder value `45` remains asserted by the baseline test. Keyboard tests cover the error navigation control interactions in this scenario, not a complete keyboard-only audit of the application.

## 8. Scenario 5 results

**Browser PASS:** Tests switched language while editing and confirmed the field value remained; selected the business audience and verified its conditional revenue field appeared while the age field disappeared; submitted invalid values and confirmed input retention. Additional coverage verified semantic dirty state returns to clean after reverting to baseline, route Stay preserves the edit, Discard exits, successful Save establishes a new clean baseline, and refresh triggers a native `beforeunload` confirmation. Sticky Save controls were measured inside viewport bounds at 320px and 1280px.

The current mock does not provide a supported forced-save-failure path; failure/retry behavior was not fabricated or tested.

## 9. Compare and Claude regression

**Browser evidence:** Existing Compare and Claude checks remained passing. Compare tests retain synthetic notes in isolated contexts and validate the 22-column English CSV contract. The Scenario 1 ID and destination links were exercised. Claude baseline Promotion Type/Promotion Offer navigation remained covered by the existing suite; no pilot was moved or mounted under Claude.

**Source evidence:** `verify-phase-8e-chatgpt-consolidation.mjs`, `verify-phase-8g-integration-remediation.mjs`, and `verify-chatgpt-scenarios-2-5.mjs` passed. These assert stable Compare IDs/criteria/storage/export source contracts, ChatGPT ownership, and Claude baseline registrations. They are source checks, not rendered acceptance.

No Compare contract or user-owned browser data was modified.

## 10. Console warning investigation

### React Router `HydrateFallback`

**Observed:** Repeated as `console.warn` during initial client navigation in the Vite browser session. The new Scenarios 2–5 diagnostic reports recorded no other warning categories beyond the explicitly classified message, and no `pageerror`.

**Source evidence:** `src/main.tsx` creates the React root with `createRoot`; it does not hydrate server-rendered markup. `src/routes/router.tsx` uses `createBrowserRouter` with lazy routes. The warning originates in React Router's development `renderMatches` fallback path when it sees an initial lazy route without a `HydrateFallback` element.

**Classification: Framework behavior / non-blocking warning.** The current evidence supports an initial data-router lazy fallback warning in a client-rendered SPA, not a demonstrated hydration failure or user-visible defect. No router rewrite was made. Whether the team wants a supported route-level fallback to remove this warning is a separate decision; it is not required by current acceptance behavior.

### `rc-util` circular references

**Observed:** The exact warning was reported as `console.error` during Scenario 5 successful-save tests; tests still had zero uncaught page errors. The final run observed it in save paths that exercise the Product Settings Ant Design form.

**Source evidence:** The message is emitted by `rc-util`'s `isEqual` helper, used by `rc-field-form` when comparing cached field metadata/values. The helper warns when the same left-side object reference is encountered recursively. Product Settings contains nested form-list values, but the exact value/reference that triggers the diagnostic was not isolated.

**Classification: Framework warning; triggering value path partially correlated, exact cause inconclusive.** There is no confirmed data corruption or failed interaction. No warning was suppressed and no speculative application change was made.

## 11. Accessibility and responsive findings

**Browser evidence:** Focused assertions cover accessible names/roles, Scenario 2 keyboard Escape and keyboard-operable close controls, Scenario 3 Enter-based reorder, Scenario 4 validation navigation and focus, Scenario 1 focus restoration flows, and Scenario 5 save-action bounds at 320px/1280px. Existing Product Label responsive checks at 320/375/768/1280 remain in the preserved suite.

**Not verified:** Full keyboard-only navigation across all five scenarios, screen-reader behavior, contrast, automated WCAG scanning, every localized string at each breakpoint, and all drawer/modal geometry at every requested viewport were not established. WCAG 2.2 AA remains a target, not a conformance claim.

## 12. Changed files

- `tests/e2e/scenarios2-5.spec.ts` — added 13 Scenario 2–5 browser cases and improved robust locators/diagnostics while preserving the existing behaviors.
- `scripts/verify-phase-8e-chatgpt-consolidation.mjs` — corrected the stale baseline assumption. The verifier now normalizes authorized Playwright dependency/script/lock graph entries on both HEAD and working-tree sides, asserts their exact allowed values, and compares the rest unchanged. This preserves package, route, fixture, service, Compare, and Claude isolation checks. It is not an unconditional pass.
- `docs/reports/2026-11-08/phase-8k-extended-browser-regression.md` — this report.

No application source or package manifest changed.

## 13. Executed commands and results

All commands below were run against revision `ff2b6516403057d2d11926fc8133a07c43dc5de2`; the normal Windows sandbox initially denied process creation, so validation used the same scoped local process execution path required for prior browser runs.

| Command | Result |
|---|---|
| `npm run test:e2e -- --reporter=list` | **PASS** — Chromium, 32 passed / 0 failed / 0 skipped / 0 blocked. Full run completed in approximately 1.4 minutes. |
| `npm run typecheck` | **PASS**, exit 0. |
| `npm run build` | **PASS**, exit 0; Vite generated lazy chunks and `dist/404.html`. |
| `npm run verify:scenarios2-5` | **PASS**, route/Compare/resource/mock source checks. |
| `node scripts/verify-product-labels.mjs` | **PASS**. |
| `node scripts/verify-promotion-type-quick-edit.mjs` | **PASS**. |
| `node scripts/verify-promotion-offer-full-page.mjs` | **PASS**. |
| `node scripts/verify-promotion-history-log-viewer.mjs` | **PASS**. |
| `node scripts/verify-phase-8g-integration-remediation.mjs` | **PASS**. |
| `node scripts/verify-phase-8e-chatgpt-consolidation.mjs` | **PASS** after verifier correction. |
| `npx playwright --version` | **PASS** — `1.60.0`. |
| `npx playwright install --list` | **PASS** — local Chromium revision `1223` found. |
| `git diff --check` | **PASS**; Git emitted only working-copy LF-to-CRLF notices for the two modified files. |

The Phase 8E verifier initially failed because it normalized the current files but not the HEAD baseline, which already contained the authorized Playwright dependency/scripts. After symmetric normalization and exact allowlist assertions, it passed while still comparing all unrelated fields and lock entries.

## 14. Remaining defects and NOT VERIFIED

- No reproducible application functional defect was confirmed in the executed cases.
- The React Router warning remains observable; the rc-util warning remains in the Scenario 5 save path and its exact object/reference cause is not isolated.
- The following behavior is not verified: real production hosting, save-failure retry, comprehensive screen-reader/contrast behavior, complete keyboard-only navigation across all screens, and exhaustive responsive layout for every pilot.
- Calibration runs before the final pass included test expectation/locator failures. They were corrected without weakening the preserved baseline; the final 32-test run passed. Failure artifacts from calibration may be retained by Playwright under `%TEMP%\demo-layout-playwright-results`; the final passing run produced no failing-test screenshot/trace. No artifact directory was deleted.
- The temporary directory was not reliably enumerable in the final inspection, so this report does not claim specific retained screenshot/trace filenames. Playwright remains configured to capture them on future failures.

## 15. NEEDS-TEAM-DECISION

If a clean console is a release requirement, decide whether to pursue a separate, narrowly scoped investigation of the initial React Router fallback warning and the `rc-util` comparison warning. Current browser evidence does not show either warning breaking the tested flows; neither should be hidden with a broad allowlist.

## 16. Final verdict

**PASS WITH WARNINGS.** All 32 browser tests passed in real Chromium, including the retained 19-test regression suite and 13 additional cases. Typecheck, production build, focused scenario verifiers, Phase 8A–8G relevant verifiers, and whitespace validation passed. Known framework warnings remain and are documented. This is browser acceptance for the assertions listed here, not proof of full WCAG conformance or deployed GitHub Pages behavior.
