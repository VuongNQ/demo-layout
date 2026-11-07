# Phase 6 — Critical flow acceptance and Compare local-draft clarification

**Author:** Vuowng

**Date:** 2026-11-07

**Checkout:** `E:\demo-layout`

**Branch/revision:** `feat/playground-compare` / `f357bcb82872768a1e3d02bebd96208b94ddd720`

## 1. Executive summary

The user's F2 decision is implemented as a presentation clarification: Compare's `approved` value is a **browser-local draft**, never formal team or production approval. The UI says this next to the status control and in the scenario index; both export buttons and the downloaded filename identify the CSV as a local draft. Stored records, raw status identifiers, CSV headers and row content remain intact. Only `src/compare/CompareWorkspace.tsx` and `src/compare/records.ts` were edited.

Typecheck, build, focused executable checks, and local production-preview HTTP checks pass. **No real browser interaction was performed.** A DOM-capable browser was unavailable, so P0/P1 rendered acceptance is **BLOCKED / NOT VERIFIED** and release readiness is **not established**. Deployed GitHub Pages was not visited.

## 2. Confirmed user decisions

1. Compare `approved` is a browser-local draft selection only. No owner/date/evidence gate, backend, workflow or new governance rule is authorized. The internal `approved` identifier and existing transitions remain.
2. Acceptance prioritizes F1/F3/F4 and the critical platform flows. This audit statically checks all 31 Claude route definitions but does not require browser execution of every route.

The earlier Phase 4/5 reports describe F2 as an open governance question. This explicit user decision supersedes that open interpretation for this prototype. It does not establish any formal approval process.

## 3. F2 local-draft clarification and changed files

| File | Minimal change | Preserved |
| --- | --- | --- |
| `src/compare/CompareWorkspace.tsx` | The selector and index now display `Approved (local draft)`; index and status-adjacent copy explicitly reject formal team/production meaning. Both CSV buttons say local draft, and the index explains the download name. | Selector option value remains `approved`; all other status values and transitions, notes, scenario IDs, storage behavior and route links remain. |
| `src/compare/records.ts` | The download name is `compare-matrix-local-draft.csv`. | `matrixCsv()` data, storage prefix, record structure, headers, columns, ordering, quoting, BOM and CRLF remain unchanged. |

The prior sentence telling users to choose Approved only after a team decision was removed because it contradicted the user's local-draft decision and implied required evidence. Owner, date, rationale and evidence remain optional handoff notes. No historical observation or user-authored rationale is rewritten.

## 4. CSV contract compatibility evidence

**PASS, executable non-browser:** A fresh Node check transpiled current `scenarios.ts`, `records.ts` and the Product Settings fixture in memory. It asserted the 22 existing CSV headers in their original order, BOM, quoted comma/quote/newline handling, unchanged raw `"approved"` in `decision_status`, unmodified rationale text, and the new filename emitted by `downloadMatrix()`. The same check confirmed `approved` persists in the existing `compare-workspace:v1:<scenarioId>` key. No schema, status identifier, storage record or observation field changed.

A second executable check passed the visible record to both a single-worksheet and all-scenario CSV. Each contained the current visible note instead of a stale stored note; the all-scenario CSV also retained another scenario's stored note. This checks F1's export data path without claiming browser download behavior.

The filename is the existing export context used for the draft qualification. There is deliberately **no in-band disclaimer** in CSV cells: changing `decision_status` would break its raw identifier, while injecting text into rationale, evidence or observations would alter user content. A recipient who renames the file can lose that contextual label; any future requirement for a self-describing detached CSV needs an explicit contract decision. No repository source reference to the old filename was found; historical reports mention it, and external consumers were not inspected.

## 5. Browser environment and tooling

`where chrome`, `where msedge` and `where playwright` found no executables. Standard Chrome and Edge install paths were absent. `npm ls @playwright/test playwright puppeteer selenium-webdriver jsdom --depth=0` was empty. Firefox exists only through the Windows app alias; Phase 4's two headless screenshot attempts stalled, so they were not repeated. No browser/DOM automation tool was exposed in this session. Thus **real browser interaction: NO**.

The normal `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` and normal `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` attempts failed while loading Vite config with `spawn EPERM` and an unloadable Tailwind native dependency. Vite's supported `runner` config loader also failed (`require is not defined` in `picomatch`). Production preview succeeded with the existing script and `--configLoader native` at **`http://127.0.0.1:4173/demo-layout/`**. A dev start with `--configLoader native` could not replace a locked Vite dependency cache file (`EPERM`); no cache cleanup or dependency installation was attempted. The preview serves the freshly built output, but its HTTP responses do not prove React rendered.

## 6. P0 acceptance matrix — F1, F3 and F4

| Critical test | Source / executable result | Browser result |
| --- | --- | --- |
| **F1 normal storage and both CSV paths** | **PASS, executable/source:** `saveRecord()` and `loadRecord()` retain current observations; both buttons call `recordsForMatrix(selected, activeRecord.current)`; generated CSV has the fixed header and escaped notes. | **NOT VERIFIED:** clicks, real download, latest-keystroke timing and worksheet/all-scenario files. |
| **F1 blocked writes, blocked reads, stale stored record** | **PASS, executable:** simulated denied `setItem`, denied `getItem`, and a stale stored value. The visible worksheet record won in `recordsForMatrix()` for the active scenario. | **NOT VERIFIED:** real localStorage restrictions, UI warning, download and content. |
| **F3 multiple form errors, correction orders, first-error focus, Select** | **PASS, static/type contract:** `onFieldsChange` maps the complete Ant Design field-error snapshot; `onValuesChange` no longer clears all errors; `onFinishFailed` retains first-error focus. Ant Design `Form`/`FormInstance` remain owner. | **NOT VERIFIED:** empty submit, remaining/resolved error display, focus, Select popup and keyboard path. |
| **F4 canonical and legacy contextual-save destination** | **PASS, executable/source:** fixture generator includes `product-setting-1`; scenario links are `/claude/product-settings/product-setting-1` and `/product-settings/product-setting-1`; ChatGPT counterpart remains unavailable. | **NOT VERIFIED:** following either link and seeing the fictional edit form. |

No P0 browser case is labeled PASS. The executable checks exercise current source functions, not mounted React components.

## 7. P1 platform acceptance matrix

| Critical flow | Current source evidence | Browser result |
| --- | --- | --- |
| Landing, platform links, Back/Forward and refresh | Root composes landing plus `claudeRoutes`, `chatgptRoutes`, `compareRoute` and explicit legacy redirects. `PlatformLinks` exposes all four destinations. | **NOT VERIFIED**. |
| Claude Offer Types list, drawer close, full-page sibling, direct deep link | List-child drawer and sibling full-page edit remain static in Claude's route tree; Offer Types drawer close calls `claudePath('offerTypes')`. | **NOT VERIFIED**. |
| One legacy redirect with params, query and hash | `LegacyRedirect` uses concrete `pathname`, `search`, `hash` and `replace`; metadata supplies 31 explicit patterns. | **NOT VERIFIED** in browser; preview HTTP only returns the HTML shell. |
| Unsaved guard and cross-platform drawer entry | Guard remains in the route-bound drawer. Its close still uses `history.state.idx > 0` to choose Back, which does not prove the prior entry is the Claude parent. | **NOT VERIFIED**; cross-platform close remains a risk, not a reproduced bug. |
| ChatGPT overview, showcase, scoped theme, focus, skip link, Select, narrow screen | Two lazy pages, nested `ConfigProvider`, scoped CSS variables, popup-container callback and skip link remain in source. No global theme file was edited in this phase. | **NOT VERIFIED**; no WCAG conformance claim. |
| Compare five scenarios, Claude destinations, unavailable ChatGPT screens, independent notes | Five stable IDs and per-scenario `compare-workspace:v1:` records; all canonical Claude links are declared available; five matching ChatGPT business links remain marked unavailable. | **NOT VERIFIED**. |
| F2 draft presentation, CSV handoff and unknown scenario | Current source labels Approved as local draft, names the CSV accordingly, and renders a local `Scenario not found` branch for unknown IDs. CSV generator preserves one row per criterion. | **NOT VERIFIED** visually or by actual browser download. |

Independent read-only `routing-architect` and `ui-reviewer` reviews confirmed these source boundaries and the browser evidence gap. The UI review found no concrete issue in the narrow F2 change; it flagged the filename-context limitation and possible external handoff scripts that expect the old name.

## 8. P2 Pages/build readiness

**PASS, static/build/local HTTP:** Vite base defaults to `/demo-layout/`; root router uses `import.meta.env.BASE_URL`; Pages workflow still builds on Node 22 and uploads `dist`. The production build emitted named lazy JS chunks for Offer Types list/drawer/edit, Product Settings edit, ChatGPT overview/showcase and Compare. Built `index.html` and copied `404.html` were byte-identical. Every entry `/demo-layout/assets/` reference pointed to an existing file. The local production preview returned HTTP 200 HTML for 12 representative direct paths, including landing, Claude drawers/full-page, ChatGPT, Compare, contextual save, unknown Compare scenario and a legacy URL. Three named lazy JS asset requests also returned HTTP 200 with nonempty content.

**NOT VERIFIED:** actual browser chunk execution, address-bar legacy redirect, deployed Pages fallback status/refresh, and hosted direct links. Local preview is not GitHub Pages.

## 9. Validation commands and results

| Command or check | Result |
| --- | --- |
| `npm run typecheck` | **PASS** (`tsc --noEmit`). |
| `npm run build` | **PASS** (Vite 8.3.5, 3155 modules transformed, `dist/404.html` written). |
| `git diff --check` | **PASS**; LF-to-CRLF notices on existing Compare work, no whitespace error. |
| Current-source Node assertions | **PASS** for F1 normal/blocked/stale storage and CSV escaping; F2 raw status, storage key, unchanged 22-column header, UI copy and draft filename; F3 source handler/focus contract; F4 fixture/links. F3 assertions are static, not rendered proof. |
| Claude route/fallback assertions | **PASS** for 31 unique metadata paths, 31 `route.lazy` declarations, metadata-derived legacy map, basename, entry assets and fallback equality. |
| Preview HTTP and lazy asset fetch | **PASS** for 12 HTML-shell paths and three nonempty JS assets under `/demo-layout/`. |
| Browser interaction | **BLOCKED** by environment; all P0/P1 rendered cases **NOT VERIFIED**. |
| Deployed Pages visit | **NOT VERIFIED**; no deployment or site visit. |

## 10. Confirmed defects

No new application-source defect was reproduced in the scoped critical flows. F1 and F4 corrections pass focused executable checks; F3 has source/type evidence only. The standard Vite dev/preview startup failures are **environment execution blockers** observed in this session, not proof of an application-source defect. Native-loader production preview succeeds. No rendered test failure was observed because no rendered test was run.

## 11. Remaining unverified risks

- **Medium — Claude drawer history:** `RouteBoundDrawerRoute` may close outside Claude after cross-platform entry because it uses history index alone. Browser reproduction is required before labeling the outcome a defect.
- **Medium — F1/F3 rendered timing:** the active-record ref, actual CSV downloads, multi-error summary updates, focus and Select popup were not exercised in a browser.
- **Medium — CSV handoff context:** a renamed `compare-matrix-local-draft.csv` loses its only export-level draft marker. Stored/raw `approved` remains intentionally unchanged. A self-contained CSV marker would require a separate contract choice.
- **Medium — accessibility and hosting:** keyboard/focus, popup containment, theme isolation, narrow reflow, contrast and deployed Pages deep links remain unverified. WCAG 2.2 AA is a target.
- **Low — unknown root routes:** root has no custom wildcard page; Compare has a local unknown-scenario state. Rendered behavior is unverified.

## 12. Manual acceptance checklist

Use the production preview at `http://127.0.0.1:4173/demo-layout/` (restart with `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort --configLoader native` if needed). Record browser/version, viewport, URL, action, observed result and a screenshot or downloaded CSV. Every row below is **NOT VERIFIED** in this audit.

| Priority and exact URL/action | Expected outcome | Status |
| --- | --- | --- |
| **P0 F1:** `/demo-layout/compare/drawer-vs-full-page`; type a note containing comma, quote and newline; download worksheet and header all-scenario CSV | Both files are named `compare-matrix-local-draft.csv`; current visible note appears in the correct criterion row with original header/order and CSV escaping. | NOT VERIFIED |
| **P0 F1:** same URL with storage allowed; reload. Then repeat with DevTools temporarily denying `Storage.prototype.setItem`, denying `getItem`, and replacing a stored record with a stale copy | Normal note persists after reload; blocked/stale storage still exports the visible note from both buttons; storage warning appears on failed writes. Restore prototypes afterward. | NOT VERIFIED |
| **P0 F3:** `/demo-layout/chatgpt/showcase`; submit empty, correct title/category/email in different orders, click remaining summary errors and operate Select by keyboard | Multiple errors appear; unresolved errors stay discoverable, corrected errors disappear, first invalid field receives focus and popup remains within ChatGPT. | NOT VERIFIED |
| **P0 F4:** `/demo-layout/compare/contextual-save`; follow Claude link and legacy-compatible link | Both paths reach `/demo-layout/claude/product-settings/product-setting-1` and show the fictional edit form. | NOT VERIFIED |
| **P1 landing:** `/demo-layout/`; open each platform, Back/Forward, refresh | Landing and each destination render; navigation stays coherent. | NOT VERIFIED |
| **P1 Claude:** `/demo-layout/claude/offer-types`; open `offer-1` drawer, close, open full-page edit, then direct-load `/demo-layout/claude/offer-types/offer-1` | Drawer overlays list; close returns to Claude list; full-page edit is a sibling; direct link and refresh work. | NOT VERIFIED |
| **P1 legacy:** `/demo-layout/offer-types/offer-1?audit=1#focus`; refresh and close | URL replaces to canonical Claude path with query/hash preserved; drawer and close work. | NOT VERIFIED |
| **P1 guard:** `/demo-layout/claude/experiments/unsaved-changes/edit`; type then try X/Cancel/Back. Also enter via `/demo-layout/compare/unsaved-changes` and close | Unsaved prompt permits stay/discard; direct and cross-platform close destination is understood and recorded. | NOT VERIFIED |
| **P1 ChatGPT:** `/demo-layout/chatgpt` and `/demo-layout/chatgpt/showcase`; use Tab/Shift+Tab/skip link, open Select, inspect at 320 px and 1280 px, switch to Claude | Focus stays visible, skip link reaches content, popup stays scoped, layout remains usable and Claude styling is unaffected. | NOT VERIFIED |
| **P1 Compare:** `/demo-layout/compare`; visit `drawer-vs-full-page`, `unsaved-changes`, `reorder-pagination`, `tabs-vs-anchor`, `contextual-save`, then `/demo-layout/compare/not-a-scenario` | Five worksheets render; Claude links work; ChatGPT business links remain unavailable; notes stay independent; unknown ID shows local not-found; Approved visibly says local draft. | NOT VERIFIED |
| **P2 hosting:** refresh the listed deep links on deployed Pages and inspect Network for `/demo-layout/assets/` lazy chunks | Hosted fallback loads the app and matching chunks without broken URLs. | NOT VERIFIED |

## 13. Release-gate assessment

| Gate | Status | Basis |
| --- | --- | --- |
| F2 local-draft source clarification | **PASS** | UI copy, raw status and draft-qualified download name checked in current source/executable assertions. |
| Typecheck/build/CSV contract/route declarations/local preview HTTP | **PASS** | Commands and checks above. |
| P0 browser interactions | **BLOCKED / NOT VERIFIED** | No usable interactive browser. |
| P1 critical platform flows and accessibility | **BLOCKED / NOT VERIFIED** | No rendered interaction, focus, theme or viewport evidence. |
| Deployed GitHub Pages | **NOT VERIFIED** | No deployed-site visit. |

**Release readiness is not established.** Browser execution of P0 and P1, plus deployed Pages checks if publication is contemplated, remains necessary. The F2 clarification does not convert any local status into formal approval.

## 14. NEEDS-TEAM-DECISION

No team decision remains for the scoped meaning of Compare `approved`: the user explicitly set it to browser-local draft. If a future consumer requires draft qualification to survive file renaming or to be machine-readable inside CSV cells, the team must choose a versioned export contract. This phase intentionally preserves raw status values and user-authored cells.
