# Phase 4 — Integrated regression and Pages readiness audit

**Author:** Vuowng

**Date:** 2026-11-07

**Checkout:** `E:\demo-layout`, branch `feat/playground-compare`, revision `f357bcb82872768a1e3d02bebd96208b94ddd720` (current uncommitted Phase 1–3 source retained)

## 1. Executive summary

The current source composes landing, Claude, ChatGPT and Compare routes, plus 31 explicit legacy Claude patterns. TypeScript and production build pass; named Claude, ChatGPT and Compare lazy chunks are emitted. The Pages base and copied 404 fallback are internally consistent. Local Vite served HTML with HTTP 200 for representative deep links.

**Browser validation did not occur.** Firefox 159.0 is installed, but two headless screenshot attempts (normal and isolated temporary profile) stalled without producing an image. No route rendering, interaction, keyboard, responsive, portal, or deployed Pages outcome is claimed. Confirmed Compare CSV fallback and contextual-save destination defects, plus approval-governance concerns, prevent a deployment-readiness declaration. Source findings below are distinct from unverified browser risks.

## 2. Audit scope and evidence boundary

Inspected current `AGENTS.md`, the three local skills, `package.json`, `src/App.tsx`, root and legacy routes, Claude route/navigation modules and layout, ChatGPT route/navigation/layout/theme/showcase modules, Compare route/scenario/record/workspace modules, Vite base, SPA fallback and Pages workflow. Read the complete Phase 1, Phase 2 and Phase 3 reports as historical context; current source and build output determined findings. Independent read-only `routing-architect` and `ui-reviewer` reviews supplied cross-checks. No application, profile, Design System, worktree or deployment file was edited for this audit.

Static evidence establishes declarations and conditional code paths. The local HTTP checks establish that Vite returned HTML, not that React rendered a matching route. Build output establishes produced assets, not browser chunk loading or Pages hosting behavior.

## 3. Environment and browser availability

| Check | Observed result |
| --- | --- |
| `where chrome`, `where msedge`, `where playwright`; `npm ls @playwright/test playwright puppeteer --depth=0` | No usable Chrome/Edge/Playwright executable or browser automation package found. |
| `where firefox`; `firefox --headless --version` | Firefox Windows app alias exists; version command returned Mozilla Firefox 159.0. |
| Firefox headless screenshots against the local app | Normal and isolated-profile attempts did not finish within 30 seconds and wrote no screenshot. No visual evidence obtained. |
| `npm run dev -- --host 127.0.0.1` | Vite 8.3.5 started at `http://127.0.0.1:5173/demo-layout/`; stopped after HTTP checks. |
| `curl.exe` direct-path requests | HTTP 200 for `/demo-layout/`, `/claude/offer-types`, `/chatgpt`, `/chatgpt/showcase`, `/compare`, `/compare/drawer-vs-full-page`, and legacy `/offer-types/offer-1?view=compact` under `/demo-layout/`. All were server HTML responses only. |

## 4. Route regression matrix

**Static route result:** `src/routes/router.tsx` composes `/` landing, `claudeRoutes`, `chatgptRoutes`, `compareRoute`, then `legacyRedirectRoutes` with `import.meta.env.BASE_URL`. Claude metadata has 31 unique relative paths and 31 lazy implementations. ChatGPT has two lazy page implementations; Compare has static `compare`/index/`:scenarioId` matching keys and three lazy implementations. No eager platform page import was found in root composition. The menu's 17 visible Claude destinations derive from `claudePath()`. Unknown root paths have no custom wildcard route and use React Router's default unmatched-route behavior; unknown Compare scenario IDs render its local not-found message.

The following is a **manual browser matrix**. Every row is **NOT VERIFIED** in a browser. For each legacy URL, use the same `/demo-layout` base and add `?audit=1#focus` to verify pathname, query and hash preservation after replacement. Refresh the resulting canonical URL and test Back/Forward.

| Legacy URL under `/demo-layout` | Canonical route and manual action | Expected result | Browser status |
| --- | --- | --- | --- |
| `/` | `/` — open and use all three platform links | Landing renders; each link opens its stated platform | NOT VERIFIED |
| `/offer-types` | `/claude/offer-types` — inspect list/menu | List and selected sidebar leaf | NOT VERIFIED |
| `/offer-types/create` | `/claude/offer-types/create` — close drawer | List stays mounted; close returns to Claude list | NOT VERIFIED |
| `/offer-types/offer-1` | `/claude/offer-types/offer-1` — close drawer | Record drawer over list; close returns to Claude list | NOT VERIFIED |
| `/offer-types/offer-1/edit` | `/claude/offer-types/offer-1/edit` — return | Full-page sibling; list unmounted; return to list | NOT VERIFIED |
| `/product-sync` | `/claude/product-sync` — inspect table/modals | Existing sync demo and menu selection | NOT VERIFIED |
| `/product-settings` | `/claude/product-settings` — open record | Existing list and link to full page | NOT VERIFIED |
| `/product-settings/product-setting-1` | `/claude/product-settings/product-setting-1` — edit/return | Existing full-page form and contextual save behavior | NOT VERIFIED |
| `/background-locks` | `/claude/background-locks` — open record | Existing list/menu selection | NOT VERIFIED |
| `/background-locks/bg-lock-1` | `/claude/background-locks/bg-lock-1` — close drawer | Child drawer over list; Claude list destination | NOT VERIFIED |
| `/fees` | `/claude/fees` — open record | List/menu selection | NOT VERIFIED |
| `/fees/fee-1` | `/claude/fees/fee-1` — return | Full-page edit; Claude list destination | NOT VERIFIED |
| `/promotions` | `/claude/promotions` — create/edit | List/menu selection | NOT VERIFIED |
| `/promotions/create` | `/claude/promotions/create` — cancel | Full-page create; Claude list destination | NOT VERIFIED |
| `/promotions/promotion-1/edit` | `/claude/promotions/promotion-1/edit` — return | Full-page edit; Claude list destination | NOT VERIFIED |
| `/promotion-types` | `/claude/promotion-types` — open/create | List/menu selection | NOT VERIFIED |
| `/promotion-types/create` | `/claude/promotion-types/create` — close | Child create drawer over list | NOT VERIFIED |
| `/promotion-types/promotion-type-1` | `/claude/promotion-types/promotion-type-1` — close | Child edit drawer over list | NOT VERIFIED |
| `/required-information` | `/claude/required-information` — open | List/menu selection | NOT VERIFIED |
| `/required-information/required-info-1` | `/claude/required-information/required-info-1` — return | Full-page edit | NOT VERIFIED |
| `/display-information-sets` | `/claude/display-information-sets` — open | List/menu selection | NOT VERIFIED |
| `/display-information-sets/display-set-1` | `/claude/display-information-sets/display-set-1` — return | Full-page edit | NOT VERIFIED |
| `/add-ons` | `/claude/add-ons` — open | List/menu selection | NOT VERIFIED |
| `/add-ons/add-on-1` | `/claude/add-ons/add-on-1` — return | Full-page edit | NOT VERIFIED |
| `/popular-loans` | `/claude/popular-loans` — inspect | Single-config page/menu selection | NOT VERIFIED |
| `/attractive-offer` | `/claude/attractive-offer` — inspect | Single-config page/menu selection | NOT VERIFIED |
| `/exclusive-touch` | `/claude/exclusive-touch` — inspect local drawer | Single-config page and local assignment drawer | NOT VERIFIED |
| `/experiments/unsaved-changes` | `/claude/experiments/unsaved-changes` — open both drawers | Existing local vs route-bound experiment | NOT VERIFIED |
| `/experiments/unsaved-changes/edit` | `/claude/experiments/unsaved-changes/edit` — type, close, Back | Child drawer and guard; deterministic Claude close destination | NOT VERIFIED |
| `/experiments/reorder-pagination` | `/claude/experiments/reorder-pagination` — inspect modes | Existing three-mode experiment | NOT VERIFIED |
| `/experiments/tabs-vs-anchor` | `/claude/experiments/tabs-vs-anchor` — trigger validation | Existing hidden-tab versus anchor recovery experiment | NOT VERIFIED |
| `/decisions` | `/claude/decisions` — edit note and reload | Existing local decision notes persist | NOT VERIFIED |

Additional exact-route browser matrix:

| Route/action | Expected result | Browser status |
| --- | --- | --- |
| `/demo-layout/claude` and `/demo-layout/claude/offer-types` — enter, refresh | Index redirect and canonical Claude list; query/hash retained on `/claude` | NOT VERIFIED |
| `/demo-layout/chatgpt` — enter, refresh, switch platforms | Overview, scoped shell, loading/empty/error examples, no Claude theme change | NOT VERIFIED |
| `/demo-layout/chatgpt/showcase` — enter, refresh, submit blank form, fix first error, open Select, submit valid form | Showcase; error summary/field messages; focus reaches first error; popup stays within ChatGPT root; loading and simulated success | NOT VERIFIED |
| `/demo-layout/compare` — enter, switch platforms, download CSV | Five scenario rows and browser-local CSV export | NOT VERIFIED |
| `/demo-layout/compare/drawer-vs-full-page`, `/unsaved-changes`, `/reorder-pagination`, `/tabs-vs-anchor`, `/contextual-save` — open each | Correct worksheet, Claude canonical link, unavailable ChatGPT destination, independent notes | NOT VERIFIED |
| `/demo-layout/compare/not-a-scenario` — enter and refresh | Local “Scenario not found” and return link | NOT VERIFIED |
| `/demo-layout/compare/contextual-save` — follow its Claude link to `/demo-layout/claude/product-settings/product-1` | Current fixture has no `product-1`; link cannot reach the intended form (Finding F4) | NOT VERIFIED in browser; source defect confirmed |
| `/demo-layout/not-a-route` — enter and refresh | Predictable unmatched-route response; current source has no custom 404 UI | NOT VERIFIED |
| `/demo-layout/` at 320, 768 and 1280 CSS px; keyboard Tab/Shift+Tab/Enter; skip links | Reflow without lost controls; visible focus; semantic navigation; skip target focus | NOT VERIFIED |
| Compare with localStorage denied: type a note, download CSV, inspect row | Download contains current in-memory note or explicitly blocks unsafe handoff | NOT VERIFIED; source predicts loss (Finding F1) |

## 5. Claude compatibility findings

The nested Offer Types, Background Locks, Promotion Types and unsaved-changes child routes and Offer Types full-page sibling remain static in `src/claude/routes/route-config.tsx`. The legacy redirect module maps every metadata path to a redirect using concrete `pathname`, `search`, `hash` and `replace`. Drawer close calls, sidebar exact selection and menu-derived breadcrumbs are present in source. These are static observations, not browser confirmation. The direct-link unsaved drawer close history assumption is recorded as risk R1 below.

## 6. ChatGPT UI and accessibility findings

The nested `ConfigProvider` and root-scoped CSS variables remain inside `ChatGPTLayout`; `getPopupContainer` uses the trigger parent or ChatGPT root. Six local badges have distinct error/accent pairings. Form state uses Ant Design `FormInstance`; `focusError` scrolls then tries the field instance's `focus()`. Source shows pending and route-error feedback, overview empty/loading/error examples and simulated success. Browser containment, focus, accessible announcements, contrast, zoom and reflow remain unverified. The error-summary clearing issue is Finding F3.

## 7. Compare workflow findings

Five scenario IDs and criterion sets are present. Four Claude links name valid fictional destinations; the contextual-save link names a nonexistent fixture record (F4). All five matching ChatGPT business destinations remain marked unavailable. Compare uses `compare-workspace:v1:` keys, separate `claude`, `chatgpt` and `evidence` note fields, and a CSV with one row per criterion. Local storage and actual download were not exercised in a browser. Findings F1 and F2 address the storage fallback and approval status.

## 8. GitHub Pages readiness

**Verified static/build evidence:** Vite defaults to `/demo-layout/`; router uses `import.meta.env.BASE_URL`; `npm run build` copied `dist/index.html` to `dist/404.html`; `fc /b` found the files identical. Built `index.html` references `/demo-layout/assets/...`. Build output includes `ChatGPTOverviewPage`, `ChatGPTShowcasePage`, `CompareWorkspace` and Claude lazy chunks. The Pages workflow still builds with Node 22 and uploads `dist`.

**NOT VERIFIED:** Deployed Pages behavior, direct deep-link refresh, HTTP fallback response semantics on Pages, lazy chunk fetching under the hosted subpath, and browser rendering. Local Vite HTTP 200 responses are not Pages proof.

## 9. Validation commands and results

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS, `tsc --noEmit` |
| `npm run build` | PASS, Vite 8.3.5 transformed 3155 modules and wrote `dist/404.html` |
| `git diff --check` | PASS; Git emitted LF-to-CRLF conversion notices for Compare files, no whitespace error |
| `fc /b dist\index.html dist\404.html` | PASS, no differences |
| Local Vite and `curl.exe` deep-link requests | PASS for seven representative HTTP HTML responses; no React rendering observed |
| Firefox headless screenshots | INCOMPLETE, no image or exit within 30 seconds in either attempt |

## 10. Confirmed defects

### F1 — HIGH: Compare CSV fallback can omit current notes when storage fails

- **Affected:** `/compare/:scenarioId`; `src/compare/CompareWorkspace.tsx` (`update`, `MatrixButton`) and `src/compare/records.ts` (`loadRecord`, `saveRecord`).
- **Reproduction/static evidence:** Deny `localStorage.setItem`, enter a worksheet note, then click its CSV download. `update()` retains `next` in React state and shows “Browser storage is unavailable. Download the CSV”; `MatrixButton` instead calls `loadRecord()`, which reads storage or returns an empty record. The current in-memory note is not passed to export.
- **Expected / actual:** Expected the advised fallback CSV to contain the visible current note; source path exports blank or stale storage data under this condition.
- **Impact / confidence:** Potential loss of comparison evidence at the exact point storage fails. High confidence in conditional source behavior; browser reproduction **NOT VERIFIED**.
- **Remediation / decision:** Export the current in-memory scenario record or prevent a misleading fallback promise. No team decision required for correctness.

### F2 — MEDIUM: Local Compare approval can be recorded without evidence

- **Affected:** `/compare/:scenarioId`; `src/compare/CompareWorkspace.tsx` status selector and `src/compare/records.ts` storage.
- **Reproduction/static evidence:** Select `Approved` with blank owner/date/rationale/evidence. The selector calls `update()` and `saveRecord()` accepts the record without validation. The UI text itself says approval requires a team decision and supporting evidence.
- **Expected / actual:** Expected an approval record to carry required owner, date, rationale and evidence, or to be clearly labeled as a self-reported local draft. Actual source permits a bare browser-local `approved` value.
- **Impact / confidence:** A CSV reader can mistake a local, unsupported status for team approval. High confidence in source behavior; browser persistence **NOT VERIFIED**.
- **Remediation / decision:** Gate status or change its governance meaning and export label. **NEEDS-TEAM-DECISION** on approval authority and requirements.

### F3 — MEDIUM: ChatGPT error summary disappears after any field change

- **Affected:** `/chatgpt/showcase`; `src/chatgpt/showcase/ChatGPTShowcasePage.tsx`.
- **Reproduction/static evidence:** Submit an empty form to create several `errors`, then change only one field. `onValuesChange` immediately calls `setErrors([])` even though other fields may remain invalid.
- **Expected / actual:** Expected remaining invalid fields to stay discoverable until corrected or revalidated. Actual summary state is cleared wholesale. Ant Design field-level errors may still be visible.
- **Impact / confidence:** Long-form error recovery can lose its cross-field navigation aid. High confidence in state transition; rendered announcement/focus behavior **NOT VERIFIED**.
- **Remediation / decision:** Reconcile the summary with current `FormInstance` errors or revalidate changed fields while retaining unresolved items. No team decision required.

### F4 — HIGH: Compare contextual-save link names a nonexistent record

- **Affected:** `/compare/contextual-save` to `/claude/product-settings/product-1`; `src/compare/scenarios.ts`, `src/features/product-settings/demo-product-settings-data.ts`, `product-settings.service.ts`, and `ProductSettingsEditPage.tsx`.
- **Reproduction/static evidence:** Follow the scenario's Claude URL. The fixture generator creates IDs `product-setting-${seed}` (including `product-setting-1`), while the scenario uses `product-1`. The service returns `undefined` for an unmatched ID; the edit page returns `<Skeleton active />` whenever `!item`, even after loading finishes.
- **Expected / actual:** Expected the linked fictional record's contextual-save form; source path instead remains on the skeleton for this ID.
- **Impact / confidence:** One of five comparison scenarios cannot be executed as written. High confidence from fixture, service and page source; browser rendering **NOT VERIFIED**.
- **Remediation / decision:** Point both canonical and legacy scenario links to an existing `product-setting-1` fixture and review whether missing-record pages need an explicit not-found state. No team decision for the link correction.

## 11. Unverified risks

- **R1 — MEDIUM, Claude drawer history:** `RouteBoundDrawerRoute.tsx` uses `window.history.state.idx > 0` to choose `navigate(-1)`. A positive index does not prove the previous entry is `/claude/experiments/unsaved-changes`; an in-app link from another platform could close outside Claude. This is a confirmed code predicate, but the cross-platform outcome is **NOT VERIFIED**. Test direct, legacy-redirected, parent-opened and cross-platform entries. Remediation may require explicit parent-origin state while preserving the guard experiment. No team decision unless the experiment's Back semantics change.
- **R2 — MEDIUM, hidden optional note:** The ChatGPT optional note is conditionally unmounted without `preserve={false}`; Ant Design may retain its value if re-shown or later submitted. Current submit ignores values, so no current data leak is established. Browser/form-state test required. No team decision for a purely fictional prototype fix.
- **R3 — MEDIUM, visual and accessibility:** Select popup containment, first-error focus, skip-link target, text/control contrast, zoom/reflow, keyboard-only navigation, Back/Forward and theme isolation lack rendered proof. WCAG 2.2 AA remains a target, **NOT VERIFIED**.
- **R4 — LOW, unknown routes:** Root has no custom wildcard/not-found UI; React Router default unmatched-route behavior may be unclear to users. Source fact confirmed; actual presentation **NOT VERIFIED**. Decide whether a local 404 experience is needed.
- **R5 — MEDIUM, Pages hosting:** Build/base/404 are consistent, but deployed deep links and lazy chunks under `/demo-layout/` are **NOT VERIFIED**. No deployment was performed.

## 12. Prioritized remediation plan

1. Correct F1 before relying on Compare CSV as a storage-failure handoff; verify with forced storage failure and inspect the downloaded row.
2. Correct F4's contextual-save record URL; verify the linked form opens and the fixture exists.
3. Decide F2's approval authority and evidence gate, then prevent ambiguous `approved` exports.
4. Correct F3's summary lifecycle; test multiple simultaneous errors, correction order and keyboard focus.
5. Run the full browser matrix, prioritizing Claude drawer origin/close, legacy query/hash and refresh, ChatGPT portal/focus, Compare storage/CSV, and Pages-style lazy chunk requests.
6. Review unknown-route UX and optional note preservation based on observed browser behavior.

## 13. Release readiness assessment

**Not established.** The static build and local HTTP checks are favorable, but browser regression and deployed Pages behavior were not verified. F1 is a confirmed conditional handoff defect and F4 blocks one of five comparison tasks; F2 and F3 require resolution or explicit acceptance before relying on decision records and form recovery. No WCAG conformance or deployment readiness claim is made.

## 14. NEEDS-TEAM-DECISION

- Define who may mark Compare decisions `approved`, the required owner/date/rationale/evidence, and whether a browser-local approval is only a draft.
- Decide whether a custom root unknown-route page and explicit Claude/Compare loading-error views are part of this playground's acceptance criteria.
- Reconcile candidate DS-01 numeric typography and unresolved DS-03 interaction/focus/navigation token ownership before any production adoption. This audit does not approve them.
