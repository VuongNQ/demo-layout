# Phase 8J — Browser Recovery and Five-Scenario Acceptance

Author: Vuowng  
Date: 2026-11-08  
Repository: VuongNQ/demo-layout  
Branch: `feat/playground-compare`  
Revision: `4b44187ea3a22239d027e0ebebdb8ccb3328a5e0`  
Worktree: `E:\demo-layout`

## 1. Executive summary

**Final verdict: PASS WITH WARNINGS.** A real Chromium browser run completed all 19 Playwright tests: **19 passed, 0 failed, 0 skipped, 0 blocked**. The run covered all 14 Scenario 1 tests and the five existing Scenarios 2–5 tests. This validates the assertions present in those tests; it does not establish every interaction listed in the Phase 8J acceptance request.

The ordinary sandboxed Playwright command failed before tests started with `spawn EPERM`. With narrowly scoped local process access, Playwright, Vite, and Chromium started. The Tailwind Windows native package is installed at the expected version and architecture; the reported “missing native module” symptom coincides with sandbox-denied process/real-path work, not a missing package in the current checkout. No packages or configuration were changed.

Browser diagnosis found one visible Compare defect: available ChatGPT destination links rendered the raw `openScreen` key. The Compare namespace lookup was corrected. Scenario 4 also had duplicate generated field IDs across its two Ant Design forms; giving the forms distinct names fixed error navigation/focus. Other interim failures were test locator or expectation mismatches and were corrected to assert the existing UI and fixture contracts. No new scenario functionality was added.

## 2. Verified environment and worktree baseline

**Checkout evidence:** `git branch --show-current` returned `feat/playground-compare`; `git rev-parse HEAD` returned `4b44187ea3a22239d027e0ebebdb8ccb3328a5e0`. The worktree already contained modified package files, Phase 8E verifier, ChatGPT route/layout/feature files, Compare scenario data, translations and Claude Sidebar, plus untracked Phase 8H/8I reports, Playwright configuration/tests, Scenarios 2–5 code, verifier and implementation report. These were present before Phase 8J edits and were preserved. No dependency manifest, lockfile, route registry, global configuration, Claude business workflow, or worktree registration was changed by Phase 8J.

`git worktree list --porcelain` also showed two pre-existing nested registrations under `E:\demo-layout\.worktrees` whose gitdir files point to missing locations. They were not inspected destructively, pruned, moved, or otherwise modified.

**Toolchain evidence:** Node `v24.13.1`, npm `11.8.0`, `@playwright/test` / `playwright` `1.60.0`. The project uses Chromium revision `1223` from `C:\Users\anhBa\AppData\Local\ms-playwright\chromium-1223`; Playwright's installed browser manifest maps it to Chromium `148.0.7778.96`. The global Playwright CLI also appears in `install --list` as `1.61.0-alpha`; the project suite used the local `1.60.0` package.

## 3. Playwright and Vite startup diagnosis

**Observed in this checkout:**

- `npm config get offline` is `true`; `NPM_CONFIG_OFFLINE=true` is set in the current process environment. Registry is `https://registry.npmjs.org/`, cache is `E:\.npm-cache`, and there is no project `.npmrc`. User/global config paths are `C:\Users\anhBa\.npmrc` and `C:\Users\anhBa\AppData\Roaming\npm\etc\npmrc`. No config was changed and no authentication data was read or printed.
- Node reports `win32` / `x64`.
- `npm ls @tailwindcss/vite @tailwindcss/node @tailwindcss/oxide @tailwindcss/oxide-win32-x64-msvc --depth=1` resolved `@tailwindcss/*` at `4.3.4`, including the Windows `win32-x64-msvc` optional package. Its directory contains `tailwindcss-oxide.win32-x64-msvc.node`; its manifest declares version `4.3.4`, `os: win32`, and `cpu: x64`.
- `npx playwright --version` resolved local Playwright `1.60.0`; Chromium and its headless shell are already cached.
- Sandboxed `npm run test:e2e -- --reporter=list` exited before discovery with `Error: spawn EPERM`.
- A post-change sandboxed `npm run build` reported both a Tailwind native-module load error and `spawn EPERM` in Vite's Windows safe-real-path resolution. The same build passed with local process access. Playwright's configured Vite `webServer` also started successfully with local process access.

**Conclusion / inference:** The present environment failure is the restricted CLI process-spawn boundary. The native package is installed, version-aligned, and platform-aligned; the evidence does not support reinstalling dependencies or changing Vite. This is consistent with Phase 8H/8I reports, which recorded sandbox `spawn EPERM` followed by successful browser execution with local process access. The earlier “missing native package” message is a secondary/ambiguous symptom in this restricted execution path, not a confirmed missing dependency in the current checkout.

## 4. Environment recovery actions

The same existing command was rerun using approved, narrowly scoped local process access:

```text
npm run test:e2e -- --reporter=list
```

This started the configured Vite server at `http://127.0.0.1:4187/demo-layout/` and launched Chromium. A post-change production build and read-only verifiers were also rerun with local process access after the sandboxed build reproduced `spawn EPERM`. No package installation, browser installation, global setting change, offline-mode change, cache deletion, lockfile edit, or Vite configuration edit was made.

## 5. Phase 8H failure regression status

| Phase 8H report | Phase 8J browser result |
|---|---|
| Product Label Product Line Select option not visible | PASS. Visible popup option was selected; product-line and status filters executed. |
| Promotion Offer Applicable Products Select option not visible | PASS. Promotion Offer Create completed through product selection and save. |
| Drawer portal rendered under `<html>` | PASS in covered flows. Scenario 1 console-error guard passed while opening Product Label and Promotion Type drawers. |
| Static Ant Design feedback context warnings | PASS for covered Type/Offer flows; the suite's Scenario 1 console-error guard passed. |
| Claude Menu `inlineCollapsed` warning | PASS in covered Claude baseline list visits; the console-error guard passed. |
| Product Label drawer overflow at 320px | PASS at measured widths 320, 375, 768 and 1280; drawer and close action right edges stayed within the viewport. |
| React Router `HydrateFallback` warning | Still observed as `console.warn` during Vite startup/navigation. It did not fail tests and was not changed. |
| Phase 8E verifier assumed package files must be unchanged | PASS. The current verifier's Playwright dependency/script allowlist and route/platform checks passed. |

The old 320px measurement was not reproduced after Drawer animation settled; Phase 8I had already corrected the test to poll stable geometry. Phase 8J's final test confirms the current stable bounds, not all possible small-screen content combinations.

## 6. Scenario 1 browser results

**Chromium PASS:** Compare exposes the four ChatGPT pilot links and preserves `drawer-vs-full-page`; a synthetic seeded observation remains visible and exports with the exact 22 English headers and `compare-matrix-local-draft.csv`; vi/en switching preserves the URL and note. Product Label search, product-line/status filters, pagination, nested read-only Drawer, direct URL query/hash close, focus return, and unknown-ID recovery passed. Promotion Type validation, save, dirty Stay/Discard and browser Back passed. Promotion Offer required-field recovery/Create, direct edit refresh, semantic dirty/revert and navigation protection passed. Promotion History event-only clipboard copy, comments, duplicate-submit protection, event isolation, unsent-draft confirmation and focus return passed.

**Limits:** Synthetic Compare records were used in fresh Playwright contexts; no personal browser profile or real user notes were read or overwritten. The successful assertions do not cover every Phase 8A–8D UX requirement, clipboard failure, backend failure, or every close path.

## 7. Scenario 2 browser results

**Chromium PASS:** The existing test opens the route-backed Drawer with `?source=acceptance#records`, edits a value, invokes browser Back, chooses Stay, saves, checks the list URL retains query/hash and verifies the updated fictional record. It then edits again, uses the visible close control and discards.

**NOT VERIFIED:** Escape, mask close, explicit invalid submission/value retention, direct URL refresh, switching records with a dirty form, and every platform-navigation exit are not asserted by the current test.

## 8. Scenario 3 browser results

**Chromium PASS:** The test verifies the first page shows 1–20 of 120; page-local move changes adjacent order; Next shows 21–40 of 120; all-items mode renders 120 rows; Discard restores the clean status. It now scopes list-count assertions to the named sortable list so navigation/pagination list items are not counted as offers.

**NOT VERIFIED:** Keyboard drag, cross-page/global reorder save, direct target-position input, global save invariants and page transitions after a persisted reorder are not covered by the current test.

## 9. Scenario 4 browser results

**Chromium PASS:** Both comparison modes produce two initial errors. The tab summary selects the right tab and focuses the Program name and Reminder days controls; the anchor summary focuses its Reminder days control; the fictional value `45` remains intact.

The two forms originally produced duplicate DOM field IDs because they shared field names. `src/chatgpt/features/scenario4/TabsVsAnchorPage.tsx` now assigns distinct Ant Design form names (`scenario4-tabs`, `scenario4-anchors`). After this correction, the focused browser assertions for both field identity and error-navigation focus passed.

**NOT VERIFIED:** Correcting errors in different orders, removal of each resolved summary entry, tab/anchor value preservation after edits, and keyboard-only traversal were not covered by this acceptance test.

## 10. Scenario 5 browser results

**Chromium PASS:** `/chatgpt/product-settings/product-setting-1` loaded and survived refresh; the existing fixture value `Vay mua xe trả góp #1` was verified. The test edited, discarded to baseline, edited and saved, observed save/status feedback and verified the sticky save button remained within 320px.

**NOT VERIFIED:** Conditional business/customer fields, validation recovery, route blocker Stay/Discard, save failure/retry, focus behavior, desktop sticky geometry and language switching while editing were not covered by this test. No mock failure was fabricated.

## 11. Compare and Claude regressions

**Compare:** Browser evidence confirms all four ChatGPT destination links for Scenarios 2–5 navigate to their corresponding existing pages, while Scenario 1 keeps its four pilot entry links. The synthetic Scenario 1 test preserves its stable ID/note and exact 22-column CSV header. Focused source verifiers confirm the five scenario IDs, criterion/storage/export contracts. Actual user-owned localStorage outside the isolated test context was not inspected.

The Compare failure screenshot showed the literal UI key `openScreen` in destination cards. `src/compare/CompareWorkspace.tsx` used a multi-namespace hook with `common` as the default namespace while requesting `compare` keys without a namespace prefix. The component now explicitly uses `compare:destinationLabel`, `compare:openScreen`, `compare:legacyUrl`, and `compare:noChatgptScreen`. The final browser test confirmed the expected localized ChatGPT link name and navigation.

**Claude:** The prior test incorrectly required a `<main>` containing an `h1` on legacy list routes. The rendered baseline uses breadcrumb context and Ant Design tables. The assertion now verifies the actual Promotion Type table and fixture row, and the Promotions table/edit action. The final browser test also verifies no History action leaked into Claude. Claude route registration and broader business workflows were not changed. This is a focused list-route regression check, not an exhaustive Claude audit.

## 12. Accessibility and responsive observations

**Browser-observed:** Product Label Drawer focus-return/Escape cases and History Modal Escape/draft/focus-return assertions passed. Scenario 4 form error links focused their corresponding controls after the distinct form-name fix. The Product Label Drawer fit at 320/375/768/1280; Product Settings sticky Save stayed within 320px.

**Not a conformance claim:** No axe scan, screen-reader test, contrast audit, exhaustive keyboard-only run, or WCAG 2.2 AA verification was performed. Responsive checks cover only the measured controls/routes above, not every screen in both languages.

## 13. Console errors and warnings

- Scenario 1's `noClientErrors` fixture listens for both `pageerror` and browser `console.error`; all 14 Scenario 1 tests passed, so no such errors were recorded in those flows.
- No uncaught `pageerror` was reported during the remaining five browser tests. The Scenarios 2–5 spec does not install the same explicit console/pageerror assertion, so this is weaker evidence than the Scenario 1 guard.
- The run repeatedly emitted React Router's `No HydrateFallback element provided to render during initial hydration` as a development `console.warn`.
- Scenario 5 emitted `Warning: There may be circular references` through Vite's client console forwarding. A targeted run reproduced it while the Scenario 5 test still passed. The installed `rc-util` source contains this warning in its equality helper. Its original console location was Vite's client relay; the specific application value path that triggers it was not established. It remains an observed framework warning, not an uncaught page exception, and was not suppressed.
- Vite also printed Node's `NO_COLOR` ignored because `FORCE_COLOR` is set. This is a process-output warning, not a browser defect.

**NEEDS-TEAM-DECISION:** If the release gate requires a clean browser console, decide whether to investigate the remaining React Router and `rc-util` warnings as a separate remediation. Do not globally suppress them.

## 14. Test changes versus application changes

**Application changes made after browser evidence:**

- `src/compare/CompareWorkspace.tsx` — explicit Compare namespace for destination-card labels; fixes the observed raw translation key.
- `src/chatgpt/features/scenario4/TabsVsAnchorPage.tsx` — unique Ant Design Form names; prevents duplicate generated field IDs and supports reliable error-field targeting.

**Existing untracked Playwright tests updated:**

- `tests/e2e/scenario1.spec.ts` — Claude assertions now match the actual legacy list/table contract while checking fixture content and absence of the Scenario 1 History action.
- `tests/e2e/scenarios2-5.spec.ts` — destination accessible-name assertion; Scenario 2 status and duplicate Close-button selection; Scenario 3 named-list count; Scenario 4 disambiguated form fields; Scenario 5 verified fixture value. These corrections replace false assumptions/ambiguous selectors without removing behavioral assertions.

No dependencies, package scripts, lockfiles, Playwright config, API/service behavior, Compare storage/export implementation, route configuration, or scenario records were changed. Temporary console-location instrumentation used for diagnosis was removed before final validation.

## 15. Exact validation commands and outcomes

| Command | Result |
|---|---|
| `npm run typecheck` | PASS, exit 0 (post-change; repeated in approved local process context). |
| `npm run build` | PASS with local process access; generated all lazy chunks and `dist/404.html`. A sandboxed post-change attempt failed with `spawn EPERM` plus native-load diagnostic; the same command passed when the sandbox process restriction was lifted. |
| `npm run test:e2e -- --reporter=list` (ordinary sandbox) | BLOCKED before test discovery: `spawn EPERM`. |
| `npm run test:e2e -- --reporter=list` (approved local process access) | PASS — Chromium 148.0.7778.96, 19 passed, 0 failed, 0 skipped, 0 blocked. |
| `npx playwright test tests/e2e/scenarios2-5.spec.ts --grep Scenario --reporter=list` | Interim diagnostic run: 4 passed / 1 failed due a strict locator counting both form instances. The locator was narrowed to the intended field; the final full suite passed. |
| `npx playwright test tests/e2e/scenarios2-5.spec.ts --grep contextual --reporter=list` | PASS — 1 Scenario 5 test. Temporary console diagnostic captured the remaining `rc-util` warning; instrumentation was removed. |
| `npm run verify:scenarios2-5` | PASS. |
| `node scripts/verify-product-labels.mjs` | PASS. |
| `node scripts/verify-promotion-type-quick-edit.mjs` | PASS. |
| `node scripts/verify-promotion-offer-full-page.mjs` | PASS. |
| `node scripts/verify-promotion-history-log-viewer.mjs` | PASS. |
| `node scripts/verify-phase-8e-chatgpt-consolidation.mjs` | PASS with local process access; allowed Playwright package changes and platform/Compare contract checks passed. |
| `node scripts/verify-phase-8g-integration-remediation.mjs` | PASS. |
| `node scripts/verify-chatgpt-scenarios-2-5.mjs` | PASS. |
| `git diff --check` | PASS. Git printed existing LF-to-CRLF working-copy notices; no whitespace errors. |
| `npx playwright --version` | PASS — local `1.60.0`. |
| `npx playwright install --list` | PASS — cached Chromium revision 1223; no browser installation performed. |
| `npm ls @playwright/test playwright --depth=1` | PASS — `@playwright/test@1.60.0`, `playwright@1.60.0`. |
| `npm ls @tailwindcss/oxide-win32-x64-msvc --all` | PASS — optional Windows native package `4.3.4` resolves under `@tailwindcss/oxide@4.3.4`. |

An attempted focused grep with the literal multiword filter `--grep "Scenario 4"` was parsed incorrectly by the Windows `cmd.exe` invocation and produced “No tests found”; it executed no tests and is not an application result. The scenario was covered by the subsequent complete 19-test run.

## 16. Remaining failures with reproduction steps

**Final suite failures: none.** All observed browser failures during diagnosis were resolved or classified as test-contract mismatches before the final run:

| Interim failure | Classification and disposition |
|---|---|
| Claude baseline expected `main > h1` | Test contract mismatch. Screenshot/source showed a breadcrumb plus table list; test now asserts actual table/fixture and edit action behavior. |
| Compare looked for exact “Open ChatGPT screen” | Real UI defect: raw `openScreen` key. Namespace-qualified translation lookup fixed it; final destination test passes. |
| Scenario 2 looked for role `alert` and an unambiguous `Close` | Test semantic/strict-locator mismatch. Existing success UI is `role=status`; Drawer has both the X and visible Close button. Test now asserts status and targets the X explicitly. |
| Scenario 3 expected 120 page-wide `listitem` roles | Locator scope defect; page navigation contributes list items. Assertion now scopes all 120 offers to the named sortable list. |
| Scenario 4 focused field query was ambiguous and field IDs collided | Duplicate form IDs were a source defect; distinct Form names fixed IDs/focus. Test queries the intended form instance. |
| Scenario 5 expected a different product name | Test fixture mismatch; current fictional record is `Vay mua xe trả góp #1`, which is now asserted. |

No force-click, warning suppression, dependency repair, or weakened behavior assertion was used.

## 17. Evidence and artifact locations

- Playwright configuration writes artifacts to `%TEMP%\demo-layout-playwright-results` (`C:\Users\anhBa\AppData\Local\Temp\demo-layout-playwright-results`).
- Interim failing reruns created screenshots, error contexts, and traces there. Playwright cleared prior test result folders during subsequent runs; after the final all-green run, the directory contained only `last-run.json`. There are no final failure traces because the final run had no failures.
- Browser evidence is the actual Playwright Chromium run and its reporter output, not only source or build output.
- Historical Phase 8H/8I reports remain unchanged. No deployed GitHub Pages visit was performed.

## 18. Risks and NOT VERIFIED

- Full coverage is limited to the 19 assertions currently present. See each scenario section for untested requirements, especially Scenario 3 keyboard/global reorder, Scenario 4 correction/resolved-error lifecycle, Scenario 5 conditional fields/dirty route guard, and all-scenario language/responsive combinations.
- The Scenarios 2–5 spec does not assert a clean console/pageerror fixture; one `rc-util` warning was observed there. No user-visible failure was attributed to it, but its trigger path is unresolved.
- React Router's `HydrateFallback` warning remains. It did not prevent initial render or route interaction in the exercised local flows.
- No deployed Pages behavior, production API, production data, or production permission contract was tested.
- No WCAG conformance claim is made.
- Local process access was necessary to run the browser suite/build; the ordinary sandbox remains unable to spawn those child processes reliably.

## 19. NEEDS-TEAM-DECISION

1. Decide whether the remaining React Router `HydrateFallback` and `rc-util` circular-reference console warnings block the intended acceptance/release gate. Keep them visible pending a separate evidence-based investigation.
2. Decide whether the outstanding manual acceptance gaps in Section 18 must be added to Playwright before describing all five scenarios as fully accepted. The present claim is strictly 19/19 existing browser assertions passing.

No scenario IDs, criteria, storage keys, CSV fields, approval semantics, or business rules need a new decision in this phase.

## 20. Final verdict and next steps

**PASS WITH WARNINGS for the 19-test local Chromium acceptance suite; not a deployment-readiness declaration.** Environment recovery required approved local process access, not package repair. Scenario 1 and Scenarios 2–5 all have browser-tested flows; Phase 8H's Select, Drawer, scoped-feedback, Claude Menu, and 320px drawer findings did not recur in the covered paths. The Compare raw translation key and Scenario 4 duplicate form-ID/focus issue were corrected narrowly. Current focused verifiers, typecheck, build, and whitespace validation pass.

Next, decide whether the two remaining browser-console warnings and the listed acceptance gaps are release blockers. Do not treat local Chromium results as deployed GitHub Pages evidence.
