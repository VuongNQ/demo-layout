# Phase 7 — Bilingual i18n implementation history and continuation

**Author:** Vuowng

**Date:** 2026-11-07

**Checkout/worktree:** E:\demo-layout

**Branch/revision:** feat/playground-compare / f357bcb82872768a1e3d02bebd96208b94ddd720

## 1. User authorization and settled CSV policy

The user authorized installation of exactly two direct dependencies, i18next and react-i18next, and required implementation across Landing, Claude, ChatGPT and Compare. Vietnamese (vi) is the default and fallback; English (en) is the other supported UI language. Language switching must not change routes or reload the page.

The user also settled the Compare export contract: system-owned CSV descriptions remain English in either UI language. The 22 headers, their order, row structure, escaping, scenario and criterion IDs, raw status IDs including approved, user-authored text, local-draft meaning and draft-qualified filename must remain intact. This supersedes the old report's open CSV-language decision. It does not authorize translating persisted records.

## 2. Installed dependency versions

**None installed.** Before the attempt, package.json, package-lock.json and node_modules contained neither required package. The authorized command, npm install i18next react-i18next, failed with exit code 1:

> npm error code ENOTCACHED
> npm error request to https://registry.npmjs.org/i18next failed: cache mode is 'only-if-cached' but no cached response is available.

Read-only npm configuration checks show offline=true, prefer-offline=false, registry=https://registry.npmjs.org/ and cache=E:\.npm-cache. npm also reported that it could not write logs under E:\.npm-cache\_logs. It did not resolve or install either package. After the attempt, npm ls i18next react-i18next --depth=0 still returned (empty), and git showed no changes to package.json or package-lock.json. No version can truthfully be reported.

Per the user's instruction to report installation failures caused by environment or network restrictions, implementation stopped here. No attempt was made to override npm's offline policy, bypass integrity controls, install other packages, or hand-build a substitute i18n framework.

## 3. i18n architecture and language ownership

**Current source:** src/main.tsx mounts App. src/App.tsx owns the global Ant Design ConfigProvider and RouterProvider, but has no locale or i18next instance. index.html starts with lang="vi"; this is static markup, not a runtime language owner. The root router composes Landing, Claude, ChatGPT, Compare and legacy redirects under import.meta.env.BASE_URL.

**Implementation pending:** One application-level i18next instance should own the chosen language. Initialize it synchronously with a guarded, valid stored choice or vi, use vi fallback, and avoid browser-language detection and initial English flash. The selected language should drive react-i18next hooks, document.documentElement.lang and Ant Design locale. The reusable switcher should show Tiếng Việt and English in all four platform shells without changing URL or history. These are requirements and proposed integration points, not implemented behavior.

Read-only routing-architect review advised translating labels at render time from stable route/menu IDs. Claude's 31 lazy route definitions, 31 metadata-derived legacy redirects, drawer topology, ChatGPT and Compare route trees, path helpers, basename, query and hash handling should remain unchanged. No root routing file was edited.

## 4. Translation resource structure

**Not created.** The requested namespace plan remains common, navigation, claude, chatgpt, compare and validation. Resources should contain strings only and must not eagerly import platform page implementations. Matching-critical route paths, index flags and children stay static; menu, breadcrumb and page labels resolve from stable IDs when rendered.

## 5. Coverage by platform

| Platform | Current source evidence | Bilingual implementation |
| --- | --- | --- |
| Landing | src/routes/PlatformSelectionPage.tsx and PlatformLinks.tsx have English copy and navigation labels. | NOT IMPLEMENTED. |
| Claude | src/claude route/menu metadata, src/layouts, src/menu, src/features, src/experiments and src/pages have predominantly Vietnamese copy plus English experiment terms. | NOT IMPLEMENTED; no page, form, table, drawer or validation translation was changed. |
| ChatGPT | src/chatgpt owns English shell, overview, showcase, status and form copy; its nested provider owns theme and popup placement. | NOT IMPLEMENTED. |
| Compare | src/compare/scenarios.ts owns English source descriptions; CompareWorkspace.tsx owns English UI and local-draft clarification. | NOT IMPLEMENTED; UI and CSV still use their current source strings. |

The source inventory is sufficient to identify ownership and the blocker, not a complete string-by-string coverage audit. No missing-key check is possible without translation resources.

## 6. Ant Design locale integration

**Current source:** The outer ConfigProvider passes themeTokens only. ChatGPT's nested ConfigProvider passes its scoped theme and getPopupContainer but no locale. The current source does not bind vi_VN or en_US to a shared language choice. Fees and Add Ons display numbers with hardcoded vi-VN formatting.

**Pending:** Derive vi_VN or en_US from the single i18next language owner, preserve both themes and popup containment, and coordinate Day.js locale for date controls. Keep Ant Design Form/FormInstance responsible for values and errors and retain the Phase 5 multi-error fix. Provider inheritance, date formatting and Select popup behavior require rendered verification.

## 7. Language persistence and fallback

No language storage key or switcher was created. Required future behavior remains: vi first load and fallback, a valid explicit choice persisted under a dedicated key, invalid values ignored, guarded reads and writes, in-memory continuation when storage fails, no reload, and no changes to routes, forms or Compare notes. Existing Claude decision-note keys and Compare's compare-workspace:v1: namespace were not touched.

## 8. Compare CSV compatibility evidence

**Verified source boundary:** src/compare/records.ts still has the 22 English column identifiers, English scenario descriptions sourced from src/compare/scenarios.ts, raw decision_status values, BOM, CRLF, quote escaping and compare-matrix-local-draft.csv filename. Both worksheet and all-scenario export controls use recordsForMatrix with the current visible record, preserving the Phase 5 in-memory fallback. F4 still points to product-setting-1 in source. No CSV or scenario source changed in this attempt.

**Not verified after a language change:** English export content in both UI languages, actual downloads, blocked storage and stale-record behavior. There is no language switch yet. The previous Phase 6 focused checks are historical evidence, not new bilingual browser proof.

## 9. Multilingual design considerations

No layout or theme was changed. Later rendered review must cover Vietnamese diacritics and text expansion in Landing cards, Claude sidebar and breadcrumbs, ChatGPT headers, forms and Select popup, Compare worksheets/status text, drawers, tables, focus order and narrow screens. Design System decision labels must retain their approval state in both languages. No WCAG 2.2 AA conformance claim follows from this baseline build.

## 10. Files changed

Only this requested report was updated. The failed npm command left package.json and package-lock.json unchanged. No application source, agent/skill/profile file, Design System document, global theme, router, worktree or gitignore file was edited. Preexisting uncommitted and untracked work was preserved. Routing-architect and ui-reviewer supplied independent read-only findings; neither edited files.

## 11. Validation results

| Check | Result | Evidence limit |
| --- | --- | --- |
| npm install i18next react-i18next | **BLOCKED**: ENOTCACHED under offline=true. | No packages installed. |
| npm ls i18next react-i18next --depth=0 | **PASS as inventory**: (empty). | Confirms missing direct dependencies. |
| git diff -- package.json package-lock.json; scoped git status | **PASS**: no manifest or lockfile change. | Does not establish future installation compatibility. |
| npm run typecheck | **PASS**: tsc --noEmit on unchanged application source. | No i18n code was checked. |
| npm run build | **PASS**: Vite 8.3.5 transformed 3155 modules, emitted existing lazy chunks and wrote dist/404.html. | Baseline only; no bilingual output. |
| git diff --check | **PASS**; preexisting LF-to-CRLF notices on Compare files, no whitespace error. | Existing tracked diff only. |
| Language, fallback, persistence, Ant Design locale, translation keys, CSV under vi/en | **NOT VERIFIED**. | Implementation blocked before these checks. |

Vite still defaults to /demo-layout/ and the existing SPA fallback copies index.html to 404.html. Neither hosting configuration nor deployed Pages behavior was changed or retested.

## 12. Browser verification status

**No real browser interaction was performed in this attempt.** Installation failed before UI work. The Phase 6 report had no usable interactive browser and explicitly marked rendered flows NOT VERIFIED. Typecheck, build, source inspection and historical HTTP shell responses do not prove first-load language, switching, form retention, Compare note retention, focus, responsive layout, lazy chunk execution or deployed Pages behavior.

## 13. Remaining untranslated strings

All existing application-owned strings remain in their current languages: Landing, ChatGPT and Compare are largely English; Claude pages are largely Vietnamese with mixed English experiment terms. Ant Design-generated text uses current provider defaults. No translation resources, language switcher, dynamic html lang update, missing-key detection or locale-aware replacement for the two hardcoded vi-VN number renderers exists.

## 14. Risks and NEEDS-TEAM-DECISION

**Environment blocker:** The authorized install cannot proceed with npm offline=true and no cached registry response for i18next. A usable, policy-compliant package source or populated trusted cache is required before resuming. The failed command also could not write its npm log under E:\.npm-cache\_logs. These are observed environment constraints, not a request to weaken package integrity or security controls.

**Settled decisions:** The vi/en pair, Vietnamese default/fallback, required libraries, permission to install them, and English system-owned Compare CSV prose are already decided. No new team decision is required for those contracts. Any later change to the 22-column CSV schema or formal approval semantics would require separate authorization.

**Remaining risks:** Complete Claude UI translation is broad and may expose app-owned strings embedded in feature data, form rules and Ant Design component messages. Browser verification of language switching, storage failure, form state, Compare notes, theme isolation, responsiveness, legacy routes and deployed Pages remains necessary after implementation. No release or WCAG readiness claim is made.

---

# Implementation continuation — current status

**Author:** Vuowng  
**Date:** 2026-11-07  
**Checkout/worktree:** `E:\demo-layout`  
**Branch/revision:** `feat/playground-compare` / `f357bcb82872768a1e3d02bebd96208b94ddd720`

This section supersedes the preceding dependency-blocker status. The user confirmed that installation had since succeeded. No install command was run during this continuation.

## 1. Dependency verification

`npm ls i18next react-i18next --depth=0` passed and resolved `i18next@27.0.0` and `react-i18next@18.0.0`. Both are declared in `package.json` and represented by the lockfile. The current manifest uses `^27.0.0` and `^18.0.0`. Package files already contained the authorized dependency change; they were not reinstalled or changed in this continuation.

## 2. i18n architecture and language ownership

One shared i18next instance in `src/i18n/index.ts` owns the UI language. It accepts only `vi` and `en`, reads an explicit valid choice from `hds-admin-next:ui-language:v1`, otherwise starts at Vietnamese, and uses Vietnamese fallback. It has no browser language detector. Storage reads and writes are guarded; a denied write leaves the active in-memory selection intact. `src/main.tsx` waits for initialization before mounting, preventing an initial English flash. `setAppLanguage` changes language without navigation or document reload. `document.documentElement.lang` and document title are synchronized on initialization and subsequent language changes. The language key is independent of Compare storage keys.

Translation resources live in `src/i18n/resources.ts`, separate from lazy page exports. The reusable native-select control in `src/i18n/LanguageSwitcher.tsx` exposes “Tiếng Việt” and “English”, with visible selection and an accessible name. It is placed through `PlatformLinks`, which appears in Landing, Claude, ChatGPT, and Compare shells. Language switching does not alter route state by implementation; rendered state retention was not browser-tested.

## 3. Translation resource namespaces and coverage

Resources are organized as `common`, `navigation`, `claude`, `chatgpt`, `compare`, and `validation`, each with Vietnamese and English dictionaries.

| Area | Implemented coverage | Evidence boundary |
| --- | --- | --- |
| Landing | Platform selection heading, introduction, descriptions, fictional-data note, platform links and language switcher. | Source inspection only. |
| Shared navigation | Platform links, language selector, Claude menu labels, breadcrumb labels, shell title and missing-breadcrumb text. | Source inspection only. |
| ChatGPT | Workspace shell, sidebar, breadcrumbs, overview, showcase foundations, status examples, table labels, form labels/help, field validation, error summary and route error text. | Two existing ChatGPT pages and local route error were inspected; no rendered review. |
| Compare | Workspace shell, index, five scenario titles/records/tasks/expected outcomes/steps/criteria, worksheet inputs, status labels, local-draft explanation, storage feedback and export controls. | Display strings resolve from Compare namespace; scenario IDs and record objects remain source values. |
| Claude | Navigation, breadcrumb and shell; Offer Types list, drawer/full-page edit and shared form; Product Settings list/edit and nested form; Fees and Add-ons lists and selected forms; Fees/Add-ons number formatting. | This is partial Claude coverage. Many other Claude business pages, forms, experiments and decisions remain hard-coded and are listed below. |

The source-level inventory is not complete for all literals in every Claude feature and experiment. Therefore complete translation coverage is **not claimed**. Customer/partner names and fictional record data remain data content where not explicitly rendered through translation resources.

## 4. Ant Design and date locale integration

`src/App.tsx` selects Ant Design `vi_VN` for `vi` and `en_US` for `en` on the existing outer `ConfigProvider`, retaining `themeTokens`. The ChatGPT nested provider still owns its theme and popup container; Ant Design 5.22.2 merges the parent config when nested `locale` is omitted, so it inherits the active locale. This is source/dependency evidence, not a rendered Select portal test. Day.js Vietnamese/English locale modules are loaded and the global Day.js locale follows i18next. Fees and Add-ons displayed numbers use `Intl.NumberFormat`; the Fees effective date uses `Intl.DateTimeFormat`. Persisted date values and submission data are not reformatted.

Ant Design `Form` / `FormInstance` remains the form-state owner. No React Hook Form was added. The ChatGPT showcase’s existing first-error navigation and Phase 5 multi-error reconciliation were not intentionally changed.

## 5. Compare CSV compatibility

No CSV generator, scenario IDs, criteria IDs, status values, Compare storage namespace, or record schema was changed for language selection. The UI calls translations at render time, while CSV generation continues to read system-owned prose from `src/compare/scenarios.ts` and fixed header strings in `src/compare/records.ts`; it does not use i18next. The source still contains the 22 headers in the established order, raw `approved` status, BOM/CRLF/escaping logic and filename `compare-matrix-local-draft.csv`. F1’s visible in-memory record fallback remains in the worksheet and all-scenario export path. The local-draft qualification remains visible in the UI and existing English export context. These are static source observations; CSV downloads in both selected languages were **NOT VERIFIED** in a browser.

## 6. Multilingual layout and platform isolation

The language control uses a native select and existing wrapping platform navigation, preserving keyboard operation and visible selection in markup. No global theme or global style migration was introduced by the i18n foundation. Existing platform theme boundaries remain: the ChatGPT ConfigProvider and CSS modules are intact; Claude remains on its existing provider/theme; Compare retains its module styles. No responsive visual checks at 320, 768, or 1280 px were performed. Text expansion and Vietnamese diacritic rendering therefore remain **NOT VERIFIED** in a browser. A source pass identified untranslated Claude content rather than assuming equal-length strings.

## 7. Files changed in this continuation

New i18n files: `src/i18n/index.ts`, `src/i18n/resources.ts`, `src/i18n/LanguageSwitcher.tsx`, `src/i18n/LanguageSwitcher.module.scss`.

Application integration and translated UI touched: `src/main.tsx`, `src/App.tsx`, `src/routes/PlatformSelectionPage.tsx`, `src/routes/PlatformLinks.tsx`, `src/layouts/AppLayout.tsx`, `src/layouts/Sidebar.tsx`, `src/layouts/AppBreadcrumb.tsx`, `src/claude/navigation/menu-meta.ts`, `src/chatgpt/layout/ChatGPTLayout.tsx`, `src/chatgpt/overview/ChatGPTOverviewPage.tsx`, `src/chatgpt/showcase/ChatGPTShowcasePage.tsx`, `src/chatgpt/routes/RouteError.tsx`, `src/compare/CompareWorkspace.tsx`, `src/features/offer-type/OfferTypeForm.tsx`, `OfferTypeListPage.tsx`, `OfferTypeDrawerRoute.tsx`, `OfferTypeEditPage.tsx`, `src/features/product-settings/ProductSettingsForm.tsx`, `ProductSettingsListPage.tsx`, `ProductSettingsEditPage.tsx`, `src/features/fees/FeesForm.tsx`, `FeesListPage.tsx`, `src/features/add-ons/AddOnForm.tsx`, and `AddOnsListPage.tsx`.

The working tree contained pre-existing uncommitted work from earlier playground phases. The list above identifies files touched for this i18n continuation; it is not a claim that all other working-tree changes belong to this phase. No route registry, route topology, legacy redirect implementation, global theme tokens, profile, skill, or Design System document was changed in this continuation.

## 8. Validation results

| Check | Result | Evidence limit |
| --- | --- | --- |
| Dependency resolution | **PASS** — `npm ls i18next react-i18next --depth=0` resolves both authorized packages. | Does not test browser initialization. |
| `npm run typecheck` | **PASS** — `tsc --noEmit`. | Static only. |
| `npm run build` | **PASS** — Vite transformed 3206 modules; output includes separate ChatGPT, Compare, Offer Types and other route chunks. `scripts/spa-fallback.mjs` wrote `dist/404.html`. | Build is not runtime/browser proof. |
| `git diff --check` | **PASS** — no whitespace errors. Git emitted LF-to-CRLF notices for pre-existing Compare diffs. | Notices were not edited as part of validation. |
| Built Pages paths | **PASS (static)** — `dist/index.html` contains `/demo-layout/assets/...`; `fc /b dist/index.html dist/404.html` reports no differences. | No deployed GitHub Pages visit or deep-link HTTP request was made. |
| i18next first-load/persistence/error behavior | **NOT VERIFIED in browser**; source implements guarded valid-choice read/write, vi fallback, no detector, and `lang` synchronization. | No executable browser or test harness was available. |
| CSV vi/en equivalence and storage-failure exports | **NOT VERIFIED in browser**; generator is separate and unchanged by this continuation. | Static source only. |

The available package scripts are `dev`, `typecheck`, `build`, and `preview`; the repository has no configured unit-test or browser-test script. No real browser interaction was performed. No browser dependency was installed.

## 9. Remaining untranslated strings and risks

The following areas still contain application-owned hard-coded UI text and need translation before Phase 7 can be considered complete: Product Sync; Promotions and Promotion Types including their drawers/forms; Required Information; Display Information Sets; Background Locks; Popular Loans; Attractive Offer; Exclusive Touch; unsaved-changes, reorder/pagination, and Tabs-versus-Anchor experiments; Decisions; several edit/drawer shells; and some table states, dialogs, action labels, and validation messages in the pages above. A source-level literal inventory was run with `rg` and confirmed remaining Vietnamese literals. Fictional fixture names and IDs are data and should remain stable unless a string is explicitly presentation copy.

There is no automated missing-key extraction test, no unit test for blocked/invalid storage, no rendered test of language retention while a form or Compare worksheet is dirty, and no cross-language CSV download verification. Responsive expansion, focus behavior and Vietnamese glyph rendering are not browser-verified. The app remains a prototype and this implementation does not establish WCAG conformance or deployment readiness.

## 10. NEEDS-TEAM-DECISION

No new product or governance decision is needed for the settled language pair, Vietnamese default/fallback, dependency choice, no-URL/no-reload switching, English system-owned CSV prose, or browser-local Compare draft semantics. No production tokens were promoted. The remaining issue is incomplete implementation coverage and verification, not an unresolved user policy choice. Complete the untranslated Claude views and run browser acceptance before claiming Phase 7 complete.
