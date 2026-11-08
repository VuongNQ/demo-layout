# Phase 8L — ChatGPT Playground Release Readiness Audit

Author: Vuowng  
Date: 2026-11-08  
Repository: VuongNQ/demo-layout  
Branch: `feat/playground-compare`  
Revision: `ff2b6516403057d2d11926fc8133a07c43dc5de2`  
Scope: Read-only release readiness audit for all five ChatGPT scenarios; only this Markdown report was created.

## 1. Executive summary

**Final verdict: PASS WITH WARNINGS.** On the current checkout, typecheck, production build, the 32-test real Chromium suite, the Scenario 2–5 verifier, and all available relevant Phase 8A–8G focused verifiers passed. The suite reproduced the Phase 8K result: **32 passed, 0 failed, 0 skipped, 0 blocked**.

The source shows the intended `/demo-layout/` Pages base, basename-aware router, generated SPA fallback, and lazy-loaded ChatGPT routes for all five Compare scenarios. Build output contains `/demo-layout/assets/...` references, and `dist/404.html` is byte-identical to `dist/index.html`. The actual GitHub Pages site and deep-link HTTP responses were not visited, so deployed hosting behavior is **NOT VERIFIED**.

Two browser console warnings remain: React Router's missing `HydrateFallback` warning on initial lazy-route rendering and `rc-util`'s circular-reference warning during Scenario 5 save paths. The first is attributable to the installed React Router render fallback branch in the local Vite run and did not prevent tested views from appearing. The second's exact value/reference trigger is **NOT VERIFIED**; current fictional fixture records are plain nested values, and no application circular reference was proven.

## 2. Verified baseline

### Checkout and worktree

**Source evidence:** `git branch --show-current` is `feat/playground-compare`; `git rev-parse HEAD` is `ff2b6516403057d2d11926fc8133a07c43dc5de2`. `git status --short` before the audit showed:

- Modified: `scripts/verify-phase-8e-chatgpt-consolidation.mjs`
- Modified: `tests/e2e/scenarios2-5.spec.ts`
- Untracked: `docs/reports/2026-11-08/phase-8k-extended-browser-regression.md`

These were pre-existing at the start of Phase 8L and were preserved. This report is the only new file from this audit. `git worktree list --porcelain` shows the main worktree at `E:/demo-layout` plus two pre-existing nested registrations at `E:/demo-layout/.worktrees/feat-playground-chatgpt` and `.../feat-playground-routing`; both say their gitdir points to a non-existent location and are marked prunable. No worktree operation was performed.

### Applicable instructions and evidence

`AGENTS.md`, `.agents/skills/platform-routing/SKILL.md`, `.agents/skills/design-system-ui/SKILL.md`, and `.agents/skills/compare-workflow/SKILL.md` were present and read. The `.codex/agents/routing-architect.toml` and `.codex/agents/ui-reviewer.toml` definitions also exist; no delegated review was needed for this read-only audit.

Read current `package.json`, Playwright/Vite/Pages configuration, the Scenario 1 UX Contract, Phase 8K report, and `chatgpt-all-five-scenarios-implementation.md`, then checked current source. Historical reports were treated as evidence to verify, not as proof of current runtime.

**Environment evidence:** Node `v24.13.1`, npm `11.8.0`, `react-router-dom@7.1.1`, `antd@5.22.2`, and `@playwright/test@1.60.0`. The Playwright project is Chromium, one worker, with a configured Vite dev server at `http://127.0.0.1:4187/demo-layout/`, Vietnamese browser locale, a fresh context per test, and failure-only screenshots/traces in `%TEMP%\demo-layout-playwright-results`.

## 3. Validation results

All commands below were executed against the current revision. The default Windows command sandbox can deny process creation; commands were executed through the same narrowly scoped local process path used by the successful Phase 8K run. No dependency or machine setting was changed.

| Command | Result |
|---|---|
| `npm run typecheck` | **PASS**, exit 0. |
| `npm run build` | **PASS**, exit 0; Vite built lazy chunks and the SPA fallback. |
| `npm run test:e2e -- --reporter=list` | **PASS**, Chromium: 32 passed, 0 failed, 0 skipped, 0 blocked; completed in about 1.3 minutes. |
| `npm run verify:scenarios2-5` | **PASS**, current ChatGPT route, Compare contract, translation, and mock-service checks. |
| `node scripts/verify-product-labels.mjs` | **PASS**. |
| `node scripts/verify-promotion-type-quick-edit.mjs` | **PASS**. |
| `node scripts/verify-promotion-offer-full-page.mjs` | **PASS**. |
| `node scripts/verify-promotion-history-log-viewer.mjs` | **PASS**. |
| `node scripts/verify-phase-8g-integration-remediation.mjs` | **PASS**. |
| `node scripts/verify-phase-8e-chatgpt-consolidation.mjs` | **PASS**, with the Phase 8K symmetric normalization of the authorized Playwright package/script entries. |
| `npx playwright test --list` | **PASS**, discovers 32 tests in the two E2E files. |
| `git diff --check` | **PASS**; only line-ending normalization notices for the two pre-existing modified files. |

**Browser observation:** The current suite is the Phase 8K acceptance suite: Scenario 1's four pilots and Compare contract; Scenario 2 drawer lifecycle and dirty exits; Scenario 3 page-local/global reorder invariants; Scenario 4 tab/anchor validation focus; Scenario 5 conditional fields, dirty state, save, unload and 320/1280px action bounds; plus Compare destinations, Claude baseline and language switching. Passing tests establish only their specific assertions.

## 4. React Router warning findings

**Observed in Chromium:** `No \`HydrateFallback\` element provided to render during initial hydration` appears as a `console.warn` on initial route loading in the local Vite test session. The warning appears before the tested route content renders; the 32 browser assertions completed successfully, and no user-visible missing page/fallback was reported by those tests.

**Source evidence:** `src/main.tsx` waits for `i18nReady` and uses `createRoot`; it does not call `hydrateRoot`. `src/routes/router.tsx` uses `createBrowserRouter` with `basename: import.meta.env.BASE_URL`. `src/chatgpt/routes/route-config.tsx` has a static ChatGPT parent shell and lazy child implementations with route error elements, but no `HydrateFallback`. The installed `react-router` package is version 7.1.1. Its development `renderMatches` implementation (`node_modules/react-router/dist/development/index.js`, around lines 4538–4588) finds the nearest `HydrateFallback`; when an initial lazy match requests a render fallback and none exists, at the root match index it warns and marks fallback rendering. This is the condition reached by the client-side lazy route composition in the test environment.

**Assessment:** This is a framework fallback warning, not evidence that the app is hydrating server HTML. Browser tests show route content eventually renders. The behavior is observed in Vite development. Whether production execution emits the same console warning was not separately established by serving the production build in a browser; therefore “development-only” is **NOT VERIFIED**. A minimal route fallback could present a deliberate loading state, but no visual loading defect requiring it was demonstrated. No route change is recommended by this audit.

## 5. `rc-util` warning findings

**Observed in Chromium:** `Warning: There may be circular references` is captured as `console.error` during Scenario 5 save flows. The relevant tests pass and their `pageerror` count is zero. No other browser console warning/error categories were observed by the explicit Scenarios 2–5 diagnostic fixture, aside from the known React Router warning. Node's `NO_COLOR`/`FORCE_COLOR` message is a server/process warning, not a browser page error.

**Source evidence:** The fictional fixture in `src/features/product-settings/demo-product-settings-data.ts` contains primitive fields plus plain arrays of tier/document objects and optional conditional fields. `src/chatgpt/features/scenario5/ProductSettingsPage.tsx` clones values with `structuredClone`, removes the `id` from the form model, compares canonical JSON snapshots, and sends the Ant Design Form values into `useUpdateProductSettingsMutation`. The mock service in `src/features/product-settings/product-settings.service.ts` shallowly replaces a fictional in-memory record; the query hook updates/invalidate the existing TanStack Query owner. It adds no API or persisted storage.

The installed `rc-field-form` 2.5.1 calls `rc-util` 5.44.4 `isEqual` for field metadata comparisons and external value updates (`node_modules/rc-field-form/es/Field.js`, around lines 117 and 140). `rc-util/es/isEqual.js` maintains one `Set` of visited left-hand objects for the recursive comparison and does not remove objects when unwinding. A shared reference encountered again can therefore produce the “circular references” warning even when there is no actual back-edge; this is a plausible library-level false-positive mechanism.

**Assessment:** The warning is library-originated and correlated with `FormInstance` update/save. The fixture's source data has no explicit circular edges. However, the actual runtime value/reference path that reaches the repeated-set condition was not instrumented, so whether this specific warning is a false positive or reflects an internal Form value reference is **NOT VERIFIED**. No sensitive values were logged, no warning was suppressed, and no app source was changed. It did not reproduce a failed save or other functional defect.

## 6. Deployment readiness

### Verified source/build evidence

- `vite.config.ts` defaults `base` to `/demo-layout/`; the built router uses that value through `import.meta.env.BASE_URL` in `src/routes/router.tsx`.
- Built `dist/index.html` references `/demo-layout/assets/...` for the entry and module-preload assets. `npm run build` emitted lazy feature chunks.
- `scripts/spa-fallback.mjs` copies `dist/index.html` to `dist/404.html`; `fc /b dist/index.html dist/404.html` reported no differences.
- `.github/workflows/deploy-pages.yml` runs `npm ci` and `npm run build` on Ubuntu with Node 22, uploads `dist`, and deploys through GitHub Pages. Automatic workflow trigger is pushes to `main`, with a manual dispatch option.
- The root router mounts ChatGPT routes, Compare, Claude, and explicit legacy Claude redirects. `chatgptRouteMeta` and its `chatgptRoutes` tree include the five scenario destinations: Scenario 1 pilot entry routes and routes for unsaved changes, reorder/pagination, tabs-vs-anchor, and product settings.
- Compare Scenario 1 links point to actual ChatGPT-owned entry points. Scenarios 2–5 each expose registered ChatGPT destinations in `src/compare/scenarios.ts` and the route metadata. The current browser suite exercised the corresponding navigation assertions.
- Compare record storage reads/writes are guarded and use the existing `compare-workspace:v1:` prefix; the export uses the fixed 22-header English schema, BOM, CRLF, escaping, raw decision status and `compare-matrix-local-draft.csv` filename.
- The Claude route metadata retains 31 canonical route IDs/patterns; Scenario 1 pilots remain ChatGPT-owned. The Phase 8E/8G verifiers passed on current source.

### Limits

The 404 copy supports GitHub Pages' static deep-link fallback assumption, but it does not let Pages return a successful HTTP status for unknown paths. No local HTTP deep-link response or deployed GitHub Pages URL was tested in this audit. Lazy-chunk loads were exercised by local Chromium navigation and the production build emitted their assets, but the hosted asset resolution under the deployed site is **NOT VERIFIED**. Browser storage was exercised only in isolated test contexts; no personal browser notes were inspected or modified.

**Deployment assessment:** Build/configuration readiness is supported. Deployed runtime and direct-refresh behavior are **NOT VERIFIED**, so this audit does not declare deployment readiness.

## 7. Accessibility and responsive gaps

### Evidence from executed browser checks

- Role/label based E2E assertions cover the principal tested buttons, fields, dialogs, tabs and navigation links.
- Scenario 2 keyboard Escape and close paths, Scenario 3 Enter activation of a keyboard-accessible move control, and Scenario 4 error-summary navigation/focus were exercised.
- Scenario 1 includes selected Drawer/Modal focus and responsive checks; Scenario 5 measured contextual Save controls at 320px and 1280px.
- The 32-test run found no uncaught `pageerror` and no unclassified browser console warning/error under the Scenarios 2–5 fixture.

### Remaining gaps

- No screen-reader or assistive-technology session, axe scan, full contrast measurement, or full keyboard-only pass was run.
- Focus containment/restoration is asserted for selected overlays, not every close mechanism, nested focus target, or route transition.
- Visible focus styling was not visually audited across all platforms and both languages.
- Vietnamese/English string parity and selected language switching have source/browser checks, but every long label, breadcrumb, error message, table column, and overlay was not measured for text expansion at 320px.
- Drawer/Modal geometry and sticky actions are not measured for every scenario and viewport combination.
- WCAG 2.2 AA is the target, not a verified conformance result.

The highest-priority follow-up is a focused human keyboard/screen-reader and contrast review of nested ChatGPT overlays and the long Scenario 5 form at 320px, followed by hosted deep-link checks.

## 8. Compare and Claude contract preservation

**Source and verifier evidence:** `src/compare/scenarios.ts` retains the five IDs `drawer-vs-full-page`, `unsaved-changes`, `reorder-pagination`, `tabs-vs-anchor`, and `contextual-save`. Each still contains seven criteria. `src/compare/records.ts` retains the `compare-workspace:v1:` key prefix, status values `open`, `testing`, `recommended`, `approved`, and `rejected`, and note fields for each criterion. `matrixCsv` retains the 22 ordered headers, quotes/escapes fields, emits BOM and CRLF, keeps English system-owned descriptions and raw status values; `downloadMatrix` retains `compare-matrix-local-draft.csv`. Focused Phase 8E/8G verifiers assert these contracts.

**Browser evidence:** Scenario 1 Playwright tests seed synthetic storage in isolated contexts, check notes survive language switching, and assert the exported 22-column header. Compare destination links and ChatGPT route ownership are exercised. No user profile or non-test browser storage was accessed.

**Claude isolation:** `src/claude/routes/route-meta.ts` retains the Claude-owned baseline route registry; root routing composes separate `claudeRoutes` and `chatgptRoutes`. Existing Claude promotions and promotion types remain registered, with no pilot routes moved back from ChatGPT. Focused verifiers and the browser baseline-list assertion passed. This is not an exhaustive functional audit of every Claude route.

## 9. Confirmed risks

1. **Console noise:** Both known warnings remain in the tested local browser run. The rc-util trigger's exact object path is unresolved.
2. **Static Pages fallback:** The fallback file is correctly generated, but GitHub Pages' actual response/body behavior for deep links has not been observed.
3. **Accessibility evidence boundary:** Automated interaction assertions do not establish screen-reader, full keyboard-only, contrast, or WCAG conformance.
4. **Stale worktree registrations:** Two existing `.worktrees` registrations point to missing gitdirs. They were not changed. This is repository housekeeping risk, not evidence of a playground defect.
5. **CI parity:** Local checks ran with Node 24.13.1/npm 11.8.0; the Pages workflow uses Node 22 and `npm ci`. The CI workflow itself was not executed in this audit.

No confirmed release-blocking functional defect was reproduced.

## 10. NOT VERIFIED

- Deployed GitHub Pages route rendering, deep-link refresh, and hosted lazy-chunk loading.
- HTTP status and fallback handling for deep links on GitHub Pages.
- Whether the `HydrateFallback` warning appears in production runtime.
- Exact runtime Product Settings value/reference responsible for `rc-util` warning.
- Screen-reader announcements, contrast conformance, exhaustive keyboard-only use, and full WCAG 2.2 AA compliance.
- Every localized screen's text expansion/layout at all breakpoints.
- CI workflow execution on Node 22.
- Browser storage behavior outside isolated Playwright contexts; actual user notes were not inspected.

## 11. NEEDS-TEAM-DECISION

- Decide whether release policy requires a warning-free console. If so, investigate the narrowly scoped React Router fallback and `rc-util` comparison warnings without globally suppressing either.
- Decide whether release sign-off requires deployed GitHub Pages verification and human accessibility review before publishing.
- Decide whether the two stale nested worktree registrations should be handled in a separate, explicitly authorized repository-maintenance task. They were preserved here.

## 12. Final verdict

**PASS WITH WARNINGS.** All requested local checks passed on the current revision, including 32 real Chromium tests and focused route/Compare/feature verifiers. The ChatGPT route ownership, Compare persistence/export contracts, and Claude baseline registrations are supported by current source and targeted checks. The remaining console warnings are not proven functional defects, but their causes and production behavior are not fully resolved. Static GitHub Pages configuration is consistent; deployed behavior and comprehensive accessibility remain unverified. Do not treat this audit as a deployment or WCAG-conformance approval.
