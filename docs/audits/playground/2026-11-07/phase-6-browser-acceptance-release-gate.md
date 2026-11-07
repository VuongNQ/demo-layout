# Phase 6 — Post-remediation browser acceptance and release gate

**Author:** Vuowng

**Date:** 2026-11-07

**Checkout:** `E:\demo-layout`

**Branch/revision:** `feat/playground-compare` / `f357bcb82872768a1e3d02bebd96208b94ddd720`

## Executive summary

**Release gate: NOT VERIFIED; do not declare the playground ready to deploy.** Current source, focused executable checks, TypeScript, production build, local HTTP responses, and Pages artifact inspection support the Phase 5 F1 and F4 corrections. F3 has source and type-contract evidence, but its multiple-error behavior has no rendered proof. No real browser interaction was performed. Compare approval governance (F2) remains **NEEDS-TEAM-DECISION**. The cross-platform close path of the Claude unsaved-changes drawer remains an unverified risk.

No application, profile, Design System, worktree, deployment, or Git configuration file was changed. This report is the only file created by Phase 6. Existing uncommitted and untracked work was preserved.

## Environment and evidence boundary

Read `AGENTS.md`, the `platform-routing`, `design-system-ui`, and `compare-workflow` skills, the complete Phase 4 audit and Phase 5 report, `package.json`, current root/Claude/ChatGPT/Compare sources, Vite config, SPA fallback script, and Pages workflow. Independent read-only routing and UI reviews cross-checked the source. Current source, rather than historical reports, determined the findings.

| Capability or check | Result |
| --- | --- |
| Chrome, Edge, Playwright executables in `PATH`; standard Chrome/Edge install paths | No usable executable found. |
| `npm ls @playwright/test playwright puppeteer selenium-webdriver jsdom --depth=0` | Empty; no browser automation package is installed. |
| Firefox | Windows app alias exists. Phase 4's two headless screenshot attempts stalled without an image. Those commands were not repeated. No interactive DOM-capable session was available. |
| Local Vite server | `npm run dev -- --host 127.0.0.1` started Vite 8.3.5 at `http://127.0.0.1:5173/demo-layout/`. |
| Local HTTP checks | Node `fetch` returned HTTP 200 and Vite's HTML shell for 11 representative direct paths. This proves server fallback responses only, not route rendering. |
| Browser interaction | **BLOCKED** by unavailable usable browser tooling; every rendered interaction below is **NOT VERIFIED**. |
| Deployed GitHub Pages | **NOT VERIFIED**; no deployment or hosted-site test was performed. |

The local URLs needed for manual acceptance are `http://127.0.0.1:5173/demo-layout/`, `/claude/offer-types`, `/chatgpt`, `/chatgpt/showcase`, and `/compare` under that same origin and base. Vite was running when this report was written; restart it with the command above if the session has ended.

## Phase 5 fix verification matrix

| Finding | Current evidence and result | Rendered result |
| --- | --- | --- |
| **F1 — Compare CSV on failed storage** | **PASS, executable/source:** both worksheet and header CSV buttons call `recordsForMatrix(selected, activeRecord.current)`. The visible worksheet record replaces stale or unreadable storage for its scenario. A fresh Node check transpiled the current `records.ts` and exercised normal storage, denied writes, denied reads, stale stored data, CSV header/BOM and quote escaping. Existing `compare-workspace:v1:` keys, columns, ordering and `compare-matrix.csv` filename remain in source. | **NOT VERIFIED:** DOM ref timing, actual download, both buttons, and latest-keystroke inclusion. |
| **F3 — ChatGPT form summary** | **PASS, source/type contract:** `onValuesChange` clears only simulated success; `onFieldsChange` maps Ant Design's complete `allFields` error snapshot into the summary. `onFinishFailed` still sets submission errors and focuses the first field. `Form`/`FormInstance` remain the state owner. | **NOT VERIFIED:** simultaneous errors, correction order, async field validation, first-error focus, Select popup and announcements. |
| **F4 — contextual-save destination** | **PASS, executable/source:** current fixture generator produces `product-setting-1`; the `contextual-save` scenario's canonical Claude URL and legacy URL use that ID. The paired ChatGPT URL remains `unavailable`. A fresh Node assertion checked these values. Scenario ID and CSV contract remain unchanged. | **NOT VERIFIED:** linked form rendering and legacy redirect in a browser. |
| **F2 — approval governance** | **NEEDS-TEAM-DECISION:** current Compare status control still allows browser-local `approved` without enforced owner, date, rationale or evidence. Phase 5 intentionally did not change it. | **NOT VERIFIED:** local persistence and exported presentation. |

The executable F1/F4 check used the installed TypeScript compiler to transpile the current source in memory, then asserted normal, failed, and stale storage behavior and fixture links. It did not render React or invoke a browser download.

## Claude regression results

**PASS, static:** `src/routes/router.tsx` composes landing, Claude, ChatGPT, Compare, then 31 explicit legacy redirects with `basename: import.meta.env.BASE_URL`. Claude's 31 metadata paths and lazy route implementations remain platform-owned. `LegacyRedirect` constructs `/claude` plus the concrete matched pathname and forwards `search` and `hash` with `replace`. Offer Types create/detail, Background Locks detail, Promotion Types create/detail, and unsaved-changes edit remain list-child drawers; Offer Types full-page edit remains a sibling. Offer Types, Background Locks, and Promotion Types drawer close functions point to Claude list paths. Sidebar and breadcrumb paths derive from Claude metadata. These are code-level observations.

**NOT VERIFIED in a browser:** legacy redirect address-bar result, query/hash, direct drawer rendering, close destination, Back/Forward, refresh, sidebar selection, breadcrumbs, unsaved guard, and cross-platform entry. The unsaved-changes route-bound drawer still uses `window.history.state.idx > 0` to choose `navigate(-1)`; a positive index alone cannot establish that the previous entry is its Claude parent. Treat the cross-platform outcome as a risk, not a reproduced defect.

## ChatGPT interaction results

**PASS, static:** `/chatgpt` overview and `/chatgpt/showcase` are static matching routes with `route.lazy` page implementations. `ChatGPTLayout` wraps its platform root in a nested Ant Design `ConfigProvider`, sets local CSS variables, supplies `getPopupContainer`, includes a skip link and semantic navigation, and renders loading feedback. The showcase uses fictional data, local simulated save feedback, six status variants, field rules and error-summary controls. Source does not connect a production API. The DS-01 numeric scale is labeled as a prototype; WCAG 2.2 AA remains a target.

**NOT VERIFIED in a browser:** overview/showcase rendering, theme isolation into Claude, Select portal containment, multi-error recovery, keyboard order, focus visibility, skip-link focus, loading/success announcements, 320/768/1280 px reflow, zoom, and text/control contrast. No WCAG conformance claim is made.

## Compare interaction results

**PASS, static/executable:** five scenario IDs and criterion lists remain present. All five Claude links are declared available; corresponding ChatGPT business destinations remain labeled unavailable. `CompareScenarioPage` has a local unknown-scenario message. Records have separate Claude, ChatGPT and evidence notes under `compare-workspace:v1:`. The CSV generator retains fixed headers and one row per criterion; source uses `compare-matrix.csv`. F1's current visible record takes precedence when a worksheet is open.

**NOT VERIFIED in a browser:** opening all five worksheets, independent persistence across navigation/reload, normal and failed localStorage behavior, actual CSV files from both buttons, unknown-scenario rendering, and unavailable destination presentation. CSV is a browser-local handoff, not proof of shared approval.

## GitHub Pages readiness

**PASS, static/build/local HTTP:** Vite defaults to `/demo-layout/`; React Router uses `import.meta.env.BASE_URL`; the Pages workflow builds with Node 22 and uploads `dist`. Build produced named lazy chunks for Claude pages, ChatGPT overview/showcase and Compare. The built `index.html` and `404.html` were byte-identical. Ten entry asset references used `/demo-layout/assets/`, and each referenced file existed in `dist`. Local Vite returned its HTML shell for landing, representative Claude drawer/full-page and legacy paths, ChatGPT, Compare and unknown scenario paths.

**NOT VERIFIED:** deployed Pages 404 response behavior, direct deep-link refresh, actual lazy-chunk network fetch and execution under the hosted subpath, browser Back/Forward, and asset loading after navigation. Local Vite's HTTP 200 is not deployed Pages proof.

## Accessibility evidence

Source includes semantic `nav`/`main` regions, skip links in ChatGPT and Compare, labeled Compare worksheet inputs, Ant Design field labels and error rules, and a source-level first-error focus helper. The local HTTP checks did not inspect rendered DOM. Keyboard-only operation, visible focus, alert announcements, screen reader output, contrast, zoom and responsive reflow are **NOT VERIFIED**. The target is WCAG 2.2 AA; conformance is not established.

## Validation results

| Command or check | Result |
| --- | --- |
| `npm run typecheck` | **PASS**, `tsc --noEmit`. |
| `npm run build` | **PASS**, Vite 8.3.5 transformed 3155 modules and wrote `dist/404.html`. |
| `git diff --check` | **PASS**, with LF-to-CRLF notices for pre-existing Compare files and no whitespace error. |
| Fresh F1/F4 transpiled-source Node assertions | **PASS** for normal, blocked-write, blocked-read and stale-visible record cases, CSV header/escaping, and fixture/URL assertions. |
| Node `fetch` to 11 Vite deep links | **PASS** for HTTP 200 HTML-shell response only. |
| Built entry asset existence and `index.html`/`404.html` equality | **PASS**. |
| Real browser interactions and deployed Pages | **BLOCKED / NOT VERIFIED** as described above. |

## Confirmed defects, risks and deployment blockers

- **No new reproducible source defect was confirmed in F1, F3 or F4.** Their rendered acceptance remains open. The F1/F4 correction checks passed; F3 has only static contract evidence.
- **MEDIUM, unverified risk:** Claude unsaved-changes drawer's history-index heuristic may close to another platform after cross-platform entry. Route: `/claude/experiments/unsaved-changes/edit`; source: `RouteBoundDrawerRoute.tsx`. Expected close to the intended Claude parent, actual cross-platform outcome **NOT VERIFIED**. Reproduce by opening the drawer from another platform, typing a draft, confirming discard, then closing. Suggested remediation if reproduced: record the parent-origin explicitly. A team decision is needed only if the experiment's intended Back semantics change.
- **MEDIUM, governance ambiguity F2:** a browser-local `approved` value can be stored/exported without required approval evidence. Source-confirmed behavior, browser persistence **NOT VERIFIED**. It is not treated as a team-approved decision. Approval authority and evidence rules require a team decision.
- **Deployment blockers:** no real browser interaction evidence for critical workflows or accessibility, no deployed Pages test, and unresolved F2 approval meaning. The first two are verification gates; F2 is a governance gate for relying on exported approval records.

## Human-executable acceptance checklist

Use a DOM-capable browser at `http://127.0.0.1:5173/demo-layout/`. For each check, record browser/version, viewport, exact URL, steps, observed result and screenshot or CSV filename. All rows are **NOT VERIFIED** in this audit.

| Route and action | Expected result | Status |
| --- | --- | --- |
| `/` → each platform link; then Back/Forward | Landing and all three destinations render; navigation returns predictably. | NOT VERIFIED |
| `/offer-types/offer-1?audit=1#details`, `/product-settings/product-setting-1?audit=1#details`, and `/experiments/unsaved-changes/edit?audit=1#details` | Each replaces to matching `/claude/...` path while retaining query and hash; refresh works. | NOT VERIFIED |
| `/claude/offer-types/offer-1`, `/claude/background-locks/bg-lock-1`, `/claude/promotion-types/promotion-type-1` direct load; close, Back/Forward | Parent list remains usable under drawer; close reaches Claude list; navigation history is coherent. | NOT VERIFIED |
| `/claude/offer-types/offer-1/edit` direct load; return | Full-page sibling renders without the list beneath and returns to Claude list. | NOT VERIFIED |
| `/claude/experiments/unsaved-changes/edit` direct load and parent-opened; type then X, Cancel, mask, Escape, Back, refresh | Unsaved prompt protects each intended exit; close destination and focus are correct. | NOT VERIFIED |
| From `/compare/unsaved-changes`, follow Claude experiment, open route drawer, then close after a dirty edit | Guard works; verify whether Back exits Claude. Capture URL/history evidence. | NOT VERIFIED |
| `/chatgpt` and `/chatgpt/showcase`; switch to Claude and back | Overview/showcase render, theme stays scoped, no overlay or CSS leakage. | NOT VERIFIED |
| `/chatgpt/showcase`: submit empty; correct title, category and email in different orders; click error links | All unresolved errors stay in the summary; each corrected error disappears; first invalid field receives focus; Select works by keyboard and popup stays in ChatGPT root. | NOT VERIFIED |
| `/chatgpt/showcase`: valid submit and clear; test 320/768/1280 px, keyboard-only Tab/Shift+Tab/Enter/Escape and 200% zoom | Loading and success feedback are perceivable; controls, focus and content remain usable. | NOT VERIFIED |
| `/compare`: open `/drawer-vs-full-page`, `/unsaved-changes`, `/reorder-pagination`, `/tabs-vs-anchor`, `/contextual-save`; then `/compare/not-a-scenario` | All five worksheets and local unknown-scenario state render; independent notes remain separated. | NOT VERIFIED |
| `/compare/drawer-vs-full-page` and `/compare/contextual-save`: enter different notes with storage allowed, reload each worksheet, then export the all-scenario CSV | Each worksheet restores only its own note; both appear in their matching scenario rows. | NOT VERIFIED |
| `/compare/contextual-save`: follow canonical and legacy Claude links | Both reach the fictional `product-setting-1` edit form. Paired ChatGPT business link remains unavailable. | NOT VERIFIED |
| `/compare/drawer-vs-full-page`: enter a note containing a comma, quote and newline; download worksheet and header all-scenario CSV | Both files use `compare-matrix.csv`, contain current visible note in the correct criterion row, preserve headers/order and escape CSV content. | NOT VERIFIED |
| Same worksheet: allow storage, then simulate `Storage.prototype.setItem` throwing; edit again and download both CSVs | Current visible note exports despite failed save; UI explains storage unavailability. Restore the prototype or reload after the test. | NOT VERIFIED |
| Same worksheet: simulate `Storage.prototype.getItem` throwing; edit and download both CSVs | Current visible note exports despite blocked reads. Restore the prototype or reload after the test. | NOT VERIFIED |
| Same worksheet: edit visible note, then overwrite its `compare-workspace:v1:drawer-vs-full-page` storage record with an older note in DevTools; download both CSVs | Current visible note wins over stale stored data for its scenario. | NOT VERIFIED |
| Refresh direct links under `/demo-layout/` in a Pages-like host; inspect Network tab for lazy `.js` and `.css` | Built chunks load from `/demo-layout/assets/` and React renders the matched route. Repeat on deployed Pages before a release claim. | NOT VERIFIED |

For failed-storage tests in DevTools, save the original method first, then set `Storage.prototype.setItem = function () { throw new DOMException('Blocked', 'QuotaExceededError'); }` or similarly override `getItem`. Restore the saved method immediately afterward or reload. Use only fictional notes. Inspect the downloaded CSV with a parser or spreadsheet rather than judging embedded newline rows by a plain line count.

## Release-gate assessment

| Gate | Classification | Reason |
| --- | --- | --- |
| Source integrity, typecheck and build | **PASS** | Current scripts completed successfully. |
| F1 and F4 focused executable checks | **PASS** | Current-source assertions passed; browser handoff and form rendering remain open. |
| F3 rendered error recovery | **NOT VERIFIED** | No DOM-capable browser session. |
| Claude, ChatGPT and Compare interaction acceptance | **BLOCKED / NOT VERIFIED** | Browser tooling unavailable. |
| Accessibility and WCAG 2.2 AA | **NOT VERIFIED** | No rendered keyboard, focus, contrast or reflow test. |
| Deployed GitHub Pages | **NOT VERIFIED** | Build/base/fallback checked locally only. |
| Compare approval governance F2 | **NEEDS-TEAM-DECISION** | Approval authority and evidence requirements remain unspecified. |

The build is healthy, but release readiness is **not established**. Complete the browser checklist and hosted Pages checks, investigate any reproduced drawer close problem, and resolve F2 before treating exported `approved` records as authorized decisions.

## NEEDS-TEAM-DECISION

1. Define who can approve a Compare decision, the required owner/date/rationale/evidence, and whether browser-local `approved` is merely a draft. No gate or status semantics were changed here.
2. Confirm the intended Back/close behavior for the unsaved-changes experiment when entered from another platform if browser testing reproduces the cross-platform destination risk.
3. Decide whether custom unknown-root-route and explicit Claude/Compare route-error experiences are release criteria; current root source has no custom wildcard UI.
