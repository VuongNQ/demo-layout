# Phase 7B — Translation coverage completion

**Author:** Vuowng  
**Date:** 2026-11-07  
**Checkout/worktree:** `E:\demo-layout`  
**Branch/revision:** `feat/playground-compare` / `f357bcb82872768a1e3d02bebd96208b94ddd720`

## 1. Summary

Added Vietnamese and English presentation resources and `react-i18next` usage for the remaining Claude feature pages, drawers, forms, and experiments requested for Phase 7B. Added parity assertions to the translation resource module. Existing Landing, ChatGPT, Compare, Offer Types, Product Settings, Fees, and Add-ons translations were audited in the current source and retained.

The worktree already contained extensive uncommitted changes from earlier playground phases. Those changes were preserved. No browser session was available or run, so language rendering, text expansion, interaction state retention, and accessibility behavior remain unverified in a browser.

## 2. Translation coverage matrix

| Route/screen IDs | UI coverage in source | Notes |
| --- | --- | --- |
| `offerTypes`, `offerTypeCreate`, `offerTypeDetail`, `offerTypeEdit` | Existing vi/en coverage retained and audited. | Shared form, list, drawer, full-page edit, import action, status labels and contextual save text use translation resources. |
| `productSync` | Completed in this phase. | Table labels, status display and page actions use `claude.pages.sync`; fixture values and identifiers remain data. |
| `productSettings`, `productSettingsEdit` | Existing vi/en coverage retained and audited. | Labels and edit shell are localized; fixture values and form field names remain stable. |
| `backgroundLocks`, `backgroundLockDetail` | Completed in this phase. | List, form, drawer title/actions, statuses, image and validity labels are localized. |
| `fees`, `feesEdit` | Existing vi/en coverage retained and audited. | Existing display formatting is locale-aware; calculation and persisted values remain unchanged. |
| `promotions`, `promotionCreate`, `promotionEdit` | Completed in this phase. | Table, form, actions, status labels and edit/create feedback are localized. |
| `promotionTypes`, `promotionTypeCreate`, `promotionTypeDetail` | Completed in this phase. | List, form and drawer copy/status labels are localized. |
| `requiredInformation`, `requiredInformationEdit` | Completed in this phase. | Table, form, input type/supply method display labels, history and edit shell are localized; enum values remain stable. |
| `displayInformationSets`, `displayInformationSetEdit` | Completed in this phase. | Table, form, product-line display labels, actions and edit shell are localized; persisted values remain stable. |
| `addOns`, `addOnEdit` | Existing vi/en coverage retained and audited. | Display labels and edit shell are localized; records are unchanged. |
| `popularLoans` | Completed in this phase. | Page, status and save feedback are localized. |
| `attractiveOffer` | Completed in this phase. | Page title, fields, dirty/save state and actions are localized. |
| `exclusiveTouch` | Completed in this phase. | Search, assignment drawer, preview, actions and status labels are localized. |
| `unsavedChanges`, `unsavedChangesEdit` | Completed in this phase. | Experiment instructions and guard dialog are localized; raw event-log entries intentionally remain raw. |
| `reorderPagination` | Completed in this phase. | Experiment instructions, modes, actions and labels are localized; IDs and ordering data remain unchanged. |
| `tabsVsAnchor` | Completed in this phase. | Experiment copy, form section labels, validation feedback and actions are localized. |
| `decisions` | Completed in this phase. | Page heading and decision descriptions are localized; decision IDs, localStorage keys and user-authored notes remain unchanged. |
| Landing (`/`) | Existing vi/en coverage retained and audited. | Platform descriptions, links, shared navigation and language switcher use translations. |
| ChatGPT (`/chatgpt`, `/chatgpt/showcase`) | Existing vi/en coverage retained and audited. | Shell, overview, showcase, form/status copy use translations; nested theme remains platform scoped. |
| Compare (`/compare/*`) | Existing vi/en coverage retained and audited. | Scenario presentation, worksheet labels and local-draft explanation use UI translations; CSV continues to use stable English source values. |

Route IDs above are the current 31 Claude metadata entries. No route metadata, path, redirect, matching behavior, or lazy route definition was edited in this phase.

## 3. Files changed for this phase

The Phase 7B application edits were limited to translation resources and existing presentation components:

- `src/i18n/resources.ts`
- `src/components/AssignedProductsEditor.tsx`
- `src/components/ContextualSaveBar.tsx`
- `src/experiments/reorder-pagination/ReorderExperimentPage.tsx`
- `src/experiments/tabs-vs-anchor/OfferTypeFormSections.tsx`
- `src/experiments/tabs-vs-anchor/TabsVsAnchorExperimentPage.tsx`
- `src/experiments/unsaved-changes/EventLog.tsx`
- `src/experiments/unsaved-changes/LocalStateDrawerDemo.tsx`
- `src/experiments/unsaved-changes/RouteBoundDrawerRoute.tsx`
- `src/experiments/unsaved-changes/UnsavedChangesExperimentPage.tsx`
- `src/experiments/unsaved-changes/useUnsavedChangesGuard.ts`
- `src/features/add-ons/AddOnEditPage.tsx`
- `src/features/attractive-offer/AttractiveOfferPage.tsx`
- `src/features/background-lock/BackgroundLockDrawerRoute.tsx`
- `src/features/background-lock/BackgroundLockForm.tsx`
- `src/features/background-lock/BackgroundLockListPage.tsx`
- `src/features/display-information-sets/DisplayInformationSetEditPage.tsx`
- `src/features/display-information-sets/DisplayInformationSetForm.tsx`
- `src/features/display-information-sets/DisplayInformationSetsListPage.tsx`
- `src/features/exclusive-touch/AssignProductsDrawer.tsx`
- `src/features/exclusive-touch/ExclusiveTouchPage.tsx`
- `src/features/fees/FeesEditPage.tsx`
- `src/features/offer-type/OfferTypeForm.tsx`
- `src/features/offer-type/components/ImportLocalDataButton.tsx`
- `src/features/popular-loans/PopularLoansPage.tsx`
- `src/features/product-sync/ProductSyncPage.tsx`
- `src/features/promotion-types/PromotionTypeDrawerRoute.tsx`
- `src/features/promotion-types/PromotionTypeForm.tsx`
- `src/features/promotion-types/PromotionTypesListPage.tsx`
- `src/features/promotions/PromotionCreatePage.tsx`
- `src/features/promotions/PromotionEditPage.tsx`
- `src/features/promotions/PromotionForm.tsx`
- `src/features/promotions/PromotionsListPage.tsx`
- `src/features/required-information/RequiredInformationEditPage.tsx`
- `src/features/required-information/RequiredInformationForm.tsx`
- `src/features/required-information/RequiredInformationListPage.tsx`
- `src/pages/DecisionsPage.tsx`

The Phase 7B changes did not edit routing, the language owner/switcher, global tokens, Ant Design provider configuration, production contracts, dependency manifests, profile files, or Compare CSV implementation. The checkout has pre-existing changes in several of those areas from earlier phases; this list identifies this phase's touched files, not all modified paths in the worktree.

## 4. Translation-key parity and language behavior evidence

`src/i18n/resources.ts` defines Vietnamese and English resources under the existing namespaces. Compile-time `DeepKeys` / `SameKeys` assertions compare the nested key paths for common, navigation, Claude page groups, Claude base resources, ChatGPT, Compare, and validation. `npm run typecheck` passed with those assertions in place, providing executable TypeScript evidence that the asserted vi/en resource key shapes match.

The current i18n source was inspected and shows one i18next instance, supported languages `vi` and `en`, Vietnamese initialization/fallback, guarded localStorage access, no browser-language detector, and language changes that do not navigate or reload. The shared language switcher is present in platform navigation. The outer Ant Design provider selects `vi_VN` or `en_US`; ChatGPT retains its nested theme and popup-container configuration.

These are source/build observations. No browser test verified first load, language persistence, invalid or blocked storage, Ant Design widget text, or state retention while switching languages.

## 5. Source-level string inventory and remaining untranslated content

The source pass covered the route-owned feature/experiment/page areas and the previously translated Landing, ChatGPT, Compare, Offer Types, Product Settings, Fees, and Add-ons areas. All targeted Claude feature modules use the existing `claude` translation namespace for their user-facing labels and actions. A scan for literal inline JSX text (`>[A-Za-z…]`) returned no matches in the inspected application areas; a props/forms scan showed the targeted table, form, dialog, status, and action labels are translation lookups. The resource key parity assertions and typecheck passed.

Remaining intentionally untranslated or out-of-scope content:

- Stable route IDs, paths, query parameters, fixture IDs, enum/form field values, API-like field identifiers, status identifiers, storage keys, and technical source identifiers.
- Fictional record values and names where they are displayed as business data, rather than application-owned chrome.
- User-entered Compare observations, rationale, evidence, decision notes, and form text.
- Raw experiment event-log entries and dynamic low-level error details; these are diagnostic/user-data content and are not rewritten as translated prose.
- Compare CSV system-owned descriptions, which are contractually fixed in English regardless of UI language.
- Locale labels `Tiếng Việt` and `English`, intentionally displayed as the language names.

The source inventory is static and regex-assisted, not a full AST extraction of every runtime string prop. It does not establish that every possible dynamically composed string or third-party Ant Design message is translated. No verified missing vi/en key was found in the asserted resource groups; rendered key fallback behavior remains unverified.

## 6. Regression and contract evidence

The changed files localize displayed text while keeping form values and fixture/status IDs intact. Ant Design Form/FormInstance remains the form state owner. The edits preserve the language architecture and do not modify route modules.

Static current-source checks also confirmed:

- `src/claude/routes/route-meta.ts` still contains the Claude route metadata, and legacy redirects continue to derive destinations from metadata while preserving location search/hash.
- `src/compare/records.ts` still defines the 22 headers in their original order, BOM/CRLF serialization, CSV escaping and `compare-matrix-local-draft.csv` filename. Scenario/criterion identifiers and raw `approved` status are not translated through the CSV generator.
- Compare's `compare-workspace:v1:` storage prefix and current in-memory-record export fallback remain in the source.
- Vite-built `dist/index.html` uses `/demo-layout/assets/...`; `fc /b dist/index.html dist/404.html` reported no differences.
- No application route, lazy loading boundary, or Pages fallback source was edited in this phase.

This is static source/build evidence. No CSV download, storage-failure scenario, browser navigation, or deployed GitHub Pages behavior was exercised in this turn.

## 7. Validation

| Command/check | Result | Evidence limit |
| --- | --- | --- |
| `npm run typecheck` | **PASS** (`tsc --noEmit`). | Static compile and resource-key assertions only. |
| `npm run build` | **PASS** (Vite transformed 3206 modules, emitted lazy page chunks, and `scripts/spa-fallback.mjs` wrote `dist/404.html`). | Does not prove rendered language switching or browser behavior. |
| `git diff --check` | **PASS**; Git printed existing LF-to-CRLF notices for Compare files, with no whitespace error. | Existing worktree changes remain. |
| `dist/index.html` vs `dist/404.html` | **PASS (static)**; byte comparison found no differences. | Not a deployed Pages check. |
| Built asset base | **PASS (static)**; HTML references `/demo-layout/assets/...`. | No deployed deep-link request was made. |
| vi/en key parity | **PASS for asserted resource groups**; compile-time equality assertions typecheck. | Not a dynamic scan of every `t()` call or rendered missing-key assertion. |
| Complete runtime translation coverage | **NOT VERIFIED**. | No browser or AST-based runtime string inventory was available. |
| Browser interaction and responsive review | **NOT VERIFIED**; no real browser session was performed. | Text expansion, diacritics, focus, menus, forms and data retention were not visually exercised. |

## 8. Risks and NEEDS-TEAM-DECISION

- **Browser verification remains outstanding.** Review vi/en at 320, 768, and 1280 px, including sidebar/breadcrumb wrapping, drawer titles, table widths, form errors, keyboard focus, Select/DatePicker portals, and Compare notes while changing language.
- **String inventory boundary:** the static pass does not prove translation of every runtime-generated third-party message or every future data-driven label. Add a focused automated extraction/missing-key check only if an existing suitable test mechanism is adopted in a separately scoped task.
- **Terminology:** the implemented strings preserve the apparent current business meaning. If product owners require a standardized Vietnamese term for domain-specific labels (for example, Scheme Sync terminology or status wording), record the chosen glossary separately; no business semantics were changed here.
- **NEEDS-TEAM-DECISION:** none newly required by this translation coverage pass. Existing Design System decisions and any pre-existing governance questions remain at their current approval status.

No real browser interaction was performed. This report does not claim WCAG conformance or deployment readiness.
