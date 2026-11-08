# Phase 8M — Deployment and CI Acceptance Audit

Author: Vuowng  
Date: 2026-11-08  
Repository: VuongNQ/demo-layout  
Branch: `feat/playground-compare`  
Revision: `9a1b366604bcf4089326b4210dcf664dcd82b987`  
Scope: Read-only CI, local production-preview, deployed GitHub Pages, routing, and contract audit. Only this Markdown report was created.

## 1. Executive summary

**Final verdict: CHANGES REQUIRED.** Current-source typecheck, production build, and focused source verifiers passed. The current production build served locally under `/demo-layout/`; deep route requests returned HTTP 200, and the configured Chromium suite exercised the production preview. That run completed **31 passed, 1 failed, 0 skipped, 0 blocked**. The failure is a strict-mode ambiguity in the Scenario 3 test locator: “Sample order saved.” matches two DOM nodes. The UI status exists, but the test stopped before checking the final 120-item identity invariant.

The actual public Pages site is reachable at `https://vuongnq.github.io/demo-layout/`, but it is serving an older single-platform Claude shell. The root returns HTTP 200; the `/compare` route and ChatGPT pilot/scenario routes return HTTP 404 and render React Router's generic 404 screen. The hosted entry asset and `Last-Modified` date differ from the current local build. Thus the GitHub Pages deployment does not currently expose the five ChatGPT-owned scenarios.

Node 22 was not available in the local environment, so Node 22 `npm ci`/CI parity is **NOT VERIFIED**. No dependency installation was attempted. The Pages workflow only deploys on pushes to `main` or manual dispatch; neither was triggered.

## 2. Verified baseline

### Checkout and worktree

**Source evidence:** The branch is `feat/playground-compare`; HEAD is `9a1b366604bcf4089326b4210dcf664dcd82b987`. `git status --short` was empty before audit work. `git worktree list --porcelain` showed the main checkout and two pre-existing stale nested registrations at `.worktrees/feat-playground-chatgpt` and `.worktrees/feat-playground-routing`, both marked prunable because their gitdir targets are missing. They were not changed or cleaned.

The current checkout is newer than the Phase 8L report revision `ff2b6516403057d2d11926fc8133a07c43dc5de2`; all current validation below was rerun. Existing user files and worktrees were preserved.

### Instructions and toolchain

Read `AGENTS.md`, the available `platform-routing`, `design-system-ui`, and `compare-workflow` skills, `package.json`, `package-lock.json`, Vite/Playwright/Pages configuration, the Phase 8L report, Scenario 1 contract, all-five implementation report, and current platform route definitions. The routing and UI reviewer agent definitions also exist locally; delegated review was not required for this audit.

Local versions: Node `v24.13.1`, npm `11.8.0`, React Router DOM `7.1.1`, Vite `8.3.5`, Playwright Test `1.60.0`. Playwright's local Chromium revision `1223` is installed. Checks used isolated Playwright contexts and synthetic test data; no user-owned browser notes were accessed.

## 3. CI parity results

The workflow `.github/workflows/deploy-pages.yml` uses `actions/setup-node@v4` with `node-version: 22`, then `npm ci` and `npm run build`. It deploys the generated `dist` directory. Local probing found Node 24.13.1 at `C:\Program Files\nodejs\node.exe`; `node22`, `nvm`, `fnm`, and `volta` were not available through the current executable search. No Node 22 runtime was found in the standard install locations checked.

| Check | Result |
|---|---|
| Node 22 availability | **NOT VERIFIED / unavailable locally**; only Node 24.13.1 was found. |
| Isolated Node 22 `npm ci` | **NOT RUN** because Node 22 was unavailable. The active worktree was not used for `npm ci`. |
| Node 22 typecheck/build/E2E | **NOT VERIFIED**. |
| Current-runtime typecheck/build/E2E | Results in Section 4. |

Vite 8.3.5's lockfile package metadata requires Node `^20.19.0 || >=22.12.0`. The workflow's `node-version: 22` selector is compatible only if setup resolves a 22.x version at or above 22.12. CI parity remains unverified because the actual hosted runner was not executed.

## 4. Production build and local preview results

**Commands executed on current HEAD:**

| Command | Result |
|---|---|
| `npm run typecheck` | **PASS**, exit 0. |
| `npm run build` | **PASS**, exit 0; Vite emitted lazy chunks and `dist/404.html`. |
| `npm run verify:scenarios2-5` | **PASS**. |
| Available focused Phase 8A–8G verifiers | **PASS**: Product Labels, Promotion Type, Promotion Offer, Promotion History, Phase 8G remediation, and Phase 8E consolidation. |
| `git diff --check` | **PASS** before report creation. |
| `npm run test:e2e -- --reporter=list` against production preview | **FAIL** as a complete suite: 31 passed, 1 failed, 0 skipped, 0 blocked. Details below. |

The current build's `dist/index.html` references `/demo-layout/assets/index-D-2WiY45.js` and other `/demo-layout/assets/...` chunks. `dist/404.html` is byte-identical to `dist/index.html` (`fc /b` reported no differences). Vite base is `/demo-layout/`; `src/routes/router.tsx` sets `basename: import.meta.env.BASE_URL`.

`npm run preview -- --host 127.0.0.1 --port 4187 --strictPort` served the current build at `http://127.0.0.1:4187/demo-layout/`. Local HTTP HEAD requests for Product Labels, Scenario 2, Scenario 3, Scenario 4, and Scenario 5 paths all returned **200 OK**. The Playwright config reuses that configured server outside CI, so the 32-test run exercised the production build rather than the Vite development server. Direct navigation and refresh assertions in the suite passed except for the Scenario 3 strict-locator assertion described below.

### Current preview E2E failure

Test: `Scenario 3 direct global position saves exactly 120 unique offer IDs`, `tests/e2e/scenarios2-5.spec.ts:261`.

After clicking **Save order**, `getByText('Sample order saved.')` matched two nodes: a visible `div[role=status]` and a `span`. Playwright failed strict mode before the test's subsequent 120-row/unique-ID assertions. The failure screenshot shows the reorder page and saved-order state; the error context and trace are in `%TEMP%\demo-layout-playwright-results\scenarios2-5-Scenario-3-di-6eade-xactly-120-unique-offer-IDs-chromium\`. This is evidence of an ambiguous test locator, not a reproduced save failure. The second matching node's intended announcement/visual role was not evaluated independently. The acceptance assertion still needs a scoped locator and a rerun before the suite can be called green on current HEAD.

## 5. GitHub Pages deployment evidence

The configured workflow does not hardcode the resulting Pages URL; it publishes the deployment action's `page_url` output. The remote is `https://github.com/VuongNQ/demo-layout.git`; the conventional project Pages URL `https://vuongnq.github.io/demo-layout/` was probed without authentication and returned HTTP 200.

### Deployed route matrix

| Deployed URL | HTTP result | Browser/source observation |
|---|---:|---|
| `/demo-layout/` | 200 | Chromium screenshot shows the legacy Claude-oriented shell and a route warning; no platform-selection landing or ChatGPT navigation is present. |
| `/demo-layout/compare` | 404 | Not a registered route in the deployed artifact. |
| `/demo-layout/chatgpt/product-labels` | 404 | Chromium screenshot shows React Router `Unexpected Application Error! 404 Not Found`. |
| `/demo-layout/chatgpt/promotion-types` | 404 | HTTP response uses the same 443-byte fallback document. |
| `/demo-layout/chatgpt/promotions` | 404 | HTTP response uses the same 443-byte fallback document. |
| `/demo-layout/chatgpt/experiments/unsaved-changes` | 404 | HTTP response uses the same 443-byte fallback document. |
| `/demo-layout/chatgpt/experiments/reorder-pagination` | 404 | HTTP response uses the same 443-byte fallback document. |
| `/demo-layout/chatgpt/experiments/tabs-vs-anchor` | 404 | HTTP response uses the same 443-byte fallback document. |
| `/demo-layout/chatgpt/product-settings/product-setting-1` | 404 | HTTP response uses the same 443-byte fallback document. |

**Browser evidence:** A screenshot of the deployed root was captured to `%TEMP%\phase8m-pages-root.png`; it depicts the older app shell. `%TEMP%\phase8m-pages-chatgpt-product-labels.png` shows the unmatched route error after the Pages fallback delivered the SPA document. This indicates the fallback document is being served, but the deployed router bundle does not contain the current platform route tree.

The deployed root references `/demo-layout/assets/index-2go4Obt1.js` and `index-DVK8yRJY.css`, versus the current local build's `index-D-2WiY45.js` and `index-LDww0v2n.css`. The remote response reports `Last-Modified: Thu, 05 Nov 2026 09:23:51 GMT`; the audit is dated 08-Nov. The root visually and behaviorally differs from current source. **Deployed five-scenario acceptance: FAIL.** The route fallback loads a SPA, but the older published artifact renders its 404 for the target routes.

The Pages workflow triggers on `main` pushes or `workflow_dispatch`; the current feature branch does not trigger the automatic deployment rule. No workflow was triggered and no deployment was attempted.

## 6. Five-scenario deep-link matrix

| Scenario | Current ChatGPT entry | Local production preview | Deployed Pages |
|---|---|---|---|
| 1 — Product Detail Presentation Patterns | Product Labels, Promotion Types, Promotions (History opens from Promotions) | Route source and existing Playwright assertions pass; preview E2E passed the corresponding tests. | **FAIL**; target paths return 404 and route to generic router error. |
| 2 — Unsaved Changes | `/chatgpt/experiments/unsaved-changes` | Direct route and refresh/lifecycle assertions passed. | **FAIL**; HTTP 404, old route registry. |
| 3 — Reorder with Pagination | `/chatgpt/experiments/reorder-pagination` | Page-local/reorder tests passed; global move Save reached success feedback, but final uniqueness assertions did not execute because the locator matched twice. | **FAIL**; HTTP 404, old route registry. |
| 4 — Tabs vs Anchor Validation | `/chatgpt/experiments/tabs-vs-anchor` | Direct interaction and validation assertions passed. | **FAIL**; HTTP 404, old route registry. |
| 5 — Contextual Save | `/chatgpt/product-settings/product-setting-1` | Direct route, Save/Discard, conditional fields, unload and responsive assertions passed. | **FAIL**; HTTP 404, old route registry. |

**Local preview evidence:** Local HTTP requests to scenario entry paths returned 200; the production-preview E2E run directly exercised the registered screens. This is not GitHub Pages runtime proof.

## 7. Compare and Claude regressions

**Current source and focused verifier evidence:**

- `src/compare/scenarios.ts` retains the five IDs: `drawer-vs-full-page`, `unsaved-changes`, `reorder-pagination`, `tabs-vs-anchor`, and `contextual-save`.
- Each scenario retains its seven criterion IDs; `scripts/verify-phase-8g-integration-remediation.mjs` passed the corresponding contract check.
- `src/compare/records.ts` retains the `compare-workspace:v1:` namespace and status identifiers, including `approved` as the existing browser-local draft status.
- `matrixCsv` retains the 22 ordered English headers, stable row/field structure, CSV quoting/escaping, BOM and CRLF; export filename remains `compare-matrix-local-draft.csv`.
- Current ChatGPT metadata and `chatgptRoutes` register the ChatGPT-owned pilot and Scenario 2–5 paths. Current Claude metadata retains its baseline route registry; the Phase 8E verifier confirms 31 canonical Claude route patterns and no pilot registration under Claude.
- `npm run verify:scenarios2-5` and Phase 8E/8G focused verifiers passed. Browser tests used isolated contexts and synthetic records; no actual user notes were read or changed.

**Deployed site:** Compare and platform isolation cannot pass on the published artifact because the root still shows the legacy single-platform UI and `/compare` is not registered there. Current source ownership does not equal deployed ownership.

## 8. Console warning observations

| Warning | Current production preview | Deployed Pages |
|---|---|---|
| React Router `No HydrateFallback element provided to render during initial hydration` | **Observed** in per-test browser diagnostics during initial lazy-route loads, including production-preview runs. No uncaught `pageerror`; test views rendered. This is not development-only in the observed setup. | **NOT VERIFIED** for current route flows; deployed app is an older bundle and no console capture was available for the target flows. |
| `rc-util` `There may be circular references` | **Not observed** in the current production-preview suite, including Scenario 5 save assertions (`rcUtilCircularReference: 0`). | **NOT VERIFIED**; the deployed artifact does not provide the current Scenario 5 target experience. |

The warning from `rc-util` had been observed in earlier Vite development runs. This audit does not suppress it or infer its exact runtime cause. `NO_COLOR` ignored due to `FORCE_COLOR` also appeared as a Node process warning, not a page-console error.

## 9. Files changed

- Created: `docs/audits/playground/2026-11-08/phase-8m-deployment-ci-acceptance.md`.
- No application source, route, test, dependency, lockfile, profile, or production repository file was modified.
- Build output remained in the existing ignored `dist/` directory; Playwright and deployed screenshots were written under the OS temp directory. No user storage or worktree was altered.

## 10. Risks and NOT VERIFIED

- **Release blocker:** Current public Pages deployment does not contain the five-scenario ChatGPT application. Deep links render 404. The current feature branch is not the workflow's automatic deployment branch.
- **CI parity:** Node 22 `npm ci`, typecheck, build and E2E were not run. Local runtime is Node 24.13.1.
- **Current browser suite:** 31/32 pass against current production preview; Scenario 3's ambiguous locator prevented its final identity assertions. Do not report 32/32 on current HEAD.
- **Production warning policy:** React Router warning persists in the production preview. No release policy establishing whether this warning blocks release was found.
- **Deployed warning output:** No console capture was performed against the actual hosted page; current target routes do not exist in the deployed artifact.
- **Hosted Compare:** Existing notes/CSV were validated in isolated local contexts and source verifiers, not against the deployed site.
- **Worktrees:** Two stale nested registrations remain untouched.
- No API calls, data contract changes, workflow dispatch, deployment, push, or commit was performed.

## 11. NEEDS-TEAM-DECISION

- Decide the intended release sequence for `feat/playground-compare`: merge to `main` (which triggers the configured Pages workflow) or use a separately authorized manual dispatch after CI acceptance. This audit did not take either action.
- Decide whether the persistent React Router warning is release-blocking. Production-preview evidence confirms it remains observable but does not show a route failure.
- Decide whether the `rc-util` warning needs a production fix or only ongoing monitoring; it did not reproduce in the production preview and its earlier development trigger remains unproven.

## 12. Final verdict

**CHANGES REQUIRED.** Current source builds, current local production preview serves all tested ChatGPT paths, and Compare/Claude contracts pass focused source checks. However, Node 22 CI parity is not verified, the current production-preview suite has one test-locator failure, and—most importantly—the public GitHub Pages deployment still serves an older single-platform artifact with 404s for all target ChatGPT and Compare routes. No deployment readiness claim is made.
