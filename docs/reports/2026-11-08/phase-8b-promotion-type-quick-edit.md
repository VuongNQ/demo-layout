# Phase 8B — Promotion Type Quick Edit

Author: Vuowng
Date: 2026-11-08
Repository: `VuongNQ/demo-layout`
Branch: `feat/playground-compare`
Revision: `981bfa707945cc2b03f17ab7504ea545c3af83cf`
Worktree: `E:\demo-layout`

## 1. Scope and decisions

Implemented a compact Promotion Type Create/Edit drawer in the existing Claude playground. The list remains mounted behind the route-backed drawer. The work is limited to Promotion Type UI, the existing Claude translation resources, one focused verification script, and this report.

The mechanism is presented as a simple highlight/classification concept. No mechanism editor, rules, calculations, eligibility behavior, API, permission semantics, or production contract was added. The exact optional classification field and its allowed values remain open: the Scenario 1 contract labels these as candidates, not approved demo fields. The implementation therefore keeps the three verified fixture fields only.

## 2. Source baseline and verified contracts

**Verified source evidence:** At the inspected HEAD, Promotion Type metadata already declares `/claude/promotion-types`, `/claude/promotion-types/create`, and `/claude/promotion-types/:id`; create and detail are children of the list route in `src/claude/routes/route-config.tsx`. Thus this phase required no competing route and no router rewrite. Existing unscoped legacy redirects are derived from the unchanged Claude route registry.

**Verified source evidence:** `src/features/promotion-types/demo-promotion-types-data.ts` owns fictional records with `id`, `name`, `code`, and `status` (`active`/`inactive`). Its local service in `promotion-types.service.ts` owns a module-memory store and simulated delay; React Query mutations update/invalidate the existing list/detail cache. The store resets when the app module reloads. The service contains no production transport contract; its `/api/demo/...` constant is explicitly unused.

**Verified source evidence:** `PromotionTypeForm.tsx` previously required Name, Code, and Status using Ant Design Form rules. The drawer previously called `validateFields`, ran the existing create/update mutation, then navigated directly to the list; it did not guard dirty exits, expose save errors, or distinguish an unknown record from a still-loading query.

**Verified contract evidence:** The Scenario 1 UX Contract at `docs/reports/2026-11-07/scenario-1-product-presentation-ux-contract.md`, §4.2, retains the current three required fields and specifies one route-backed nested drawer, recoverable unknown IDs, save/error states, a consistent dirty-exit confirmation, keyboard focus behavior, and bilingual UI. It lists optional display label and classification values only as candidates. Phase 8A evidence is documented in `docs/reports/2026-11-07/phase-8a-product-label-quick-view.md`.

**Verified repository guidance:** `AGENTS.md`, the `platform-routing`, `design-system-ui`, and `compare-workflow` skills, local routing/UI agent definitions, `package.json`, `README.md`, and the Design System index/pattern/component/layout pages were inspected. The local guidance requires feature ownership, Ant Design Form ownership, fictional data, preservation of route shells and compatibility, and separation of source/build/browser evidence.

**Worktree evidence:** The worktree was clean before editing and the expected branch was checked out. `git worktree list --porcelain` showed two pre-existing prunable nested registrations under `E:\demo-layout\.worktrees\`; they were not operated on. The production reference repository was not modified or independently inspected during this task.

## 3. Impact and risk classification

**Risk: MEDIUM.** The route and mock data contracts remain unchanged, but this changes a route-backed form lifecycle and introduces navigation blocking. Type and executable source/service checks pass; real overlay, focus, browser-history, and responsive behavior still require browser acceptance.

The implementation does not change route metadata, list sorting/filtering/pagination behavior, status-toggle behavior, fixture fields, persistence ownership, Compare data, or the Product Label feature.

## 4. Implementation details

- Reused the existing Promotion Type list and nested create/detail drawer routes.
- Added a localized list heading, explicit list-query error/retry state, a localized Actions column, and an accessible record-specific Edit link.
- Kept the fixed form at `name`, `code`, and `status`. Existing required rules and status values remain unchanged. Ant Design `FormInstance` remains the sole form-state owner; no React Hook Form or new validator dependency was added.
- Added a translated prototype note that describes Promotion Type as a simple highlight/classification label with no rule configuration.
- Added localized, field-level validation recovery: submit validation retains values, displays an error summary, scrolls to the first invalid field, and focuses it.
- Added duplicate-submit protection, pending state, success feedback, and a save-error alert that retains the current form values. The existing local mock service is still the save owner.
- Added detail-load retry, recoverable not-found state, and disabled Save until the record is ready.
- Record changes reset Form values to the selected record. A pristine baseline is captured per create/edit identity; a later background query result for that same identity does not overwrite an already-open form.

## 5. Routes and query-state

| Path | Verified behavior |
| --- | --- |
| `/claude/promotion-types` | Existing lazy list route; parent remains mounted while a nested child route is active. |
| `/claude/promotion-types/create` | Existing nested create drawer. |
| `/claude/promotion-types/:id` | Existing nested edit drawer; detail lookup is by fixture ID and unknown IDs show a recoverable not-found state. |
| Unscoped legacy equivalents | Existing redirect generation remains unchanged; no legacy route entries were edited. |

The list currently has no search, filter, sort, or pagination controls/query contract. This implementation adds none. It forwards existing query parameters and hash from list to drawer and back, including create navigation. Direct drawer close has a canonical list destination with the URL’s query/hash. This is source-verified; direct refresh/history behavior is not browser-verified.

## 6. Form, validation, save, and dirty-state behavior

**Verified source behavior:** Only the original three required fields are validated. On submit, `FormInstance.validateFields()` remains authoritative. Validation issues retain the entered values, show both Ant Design field feedback and a translated alert, then scroll/focus the first invalid control.

**Verified source behavior:** The form’s user-change callback uses `form.isFieldsTouched()` to indicate a dirty state. While dirty, React Router `useBlocker` intercepts path, search, and hash navigation, including drawer close, links, and history navigation. A translated confirmation offers Stay or Discard. Stay resets the blocked navigation and preserves values; Discard restores the captured pristine baseline before proceeding. A `beforeunload` warning is attached only while dirty.

**Verified source behavior:** During a save, duplicate Save is disabled and the drawer’s close, mask, and Escape paths are disabled; an attempted blocked route is cancelled with localized pending feedback. A successful mutation announces success and returns to the list. Failed mutation handling leaves the drawer and values in place with an error alert.

**Executed focused evidence:** `scripts/verify-promotion-type-quick-edit.mjs` exercises the existing in-memory mock service’s successful create/update and rejection for an unknown-record update. It also checks route declarations, query/hash forwarding, guard/initialization/error source contracts, and vi/en key parity. The service-level rejection is not a rendered UI failure test; the currently reachable detail form cannot load an unknown record to submit it.

**NOT VERIFIED:** No browser session exercised Form validation, Save/Cancel, dirty confirmation, Back/Forward, refresh warning, failed-save presentation, or switching records. The current local service has no deterministic save-failure switch, and none was added.

## 7. Accessibility

**Source evidence:** The drawer uses a labeled heading with programmatic focus, Ant Design Drawer keyboard/focus management, a visible X and Cancel button, and a record-specific accessible Edit link. On return from an in-app drawer, focus is directed back to the triggering row action; direct-load or unavailable-trigger fallback focuses the list’s Add button. Form labels remain Ant Design `Form.Item` labels. Validation and dirty status use text and alert/status roles; status is not communicated by color alone. Drawer width is capped to the viewport and footer actions can wrap.

**NOT VERIFIED:** Keyboard-only operation, actual focus containment/return, screen-reader announcements, focus appearance, contrast, mask/Escape interaction, and narrow-screen reflow were not rendered in a browser. WCAG 2.2 AA is a target, not a conformance claim.

## 8. Internationalization

Added matching Vietnamese and English keys under the existing `claude.pages.promotionType` namespace for list heading/actions, record-specific Edit, create/save labels, prototype mechanism note, success, validation, load/retry/not-found, dirty confirmation, and pending feedback. Existing `promotionTypeKeyParity` in `src/i18n/resources.ts` covers the namespace, and the focused checker confirms matching keys. Existing form labels/status translations and shared validation keys are reused. Language switching still uses the application’s single i18next owner; fixture values and IDs are unchanged.

Rendered vi/en copy length and wrapping are **NOT VERIFIED**.

## 9. Files changed

- `src/features/promotion-types/PromotionTypeDrawerRoute.tsx`
- `src/features/promotion-types/PromotionTypeForm.tsx`
- `src/features/promotion-types/PromotionTypesListPage.tsx`
- `src/i18n/resources.ts`
- `scripts/verify-promotion-type-quick-edit.mjs` (new executable check using already-installed TypeScript)
- `docs/reports/2026-11-08/phase-8b-promotion-type-quick-edit.md` (this report)

No route registry/router, service/fixture, Compare, Product Label, global styles/themes, Design System documentation, profiles, manifests, lockfiles, or production files were modified. No dependency was installed.

## 10. Validation commands and actual results

| Command/check | Result | Evidence boundary |
| --- | --- | --- |
| `npm run typecheck` | **PASS** | TypeScript source and translation-key parity. |
| `npm run build` | **PASS**; Vite transformed 3,212 modules and emitted a separate `PromotionTypeDrawerRoute` chunk; SPA fallback script wrote `dist/404.html`. | Build/lazy chunk/source evidence; not route-rendering proof. |
| `node scripts/verify-promotion-type-quick-edit.mjs` | **PASS** | Fictional fixture invariants; mock create/update/unknown-update failure; static route/query/guard/validation contracts; vi/en namespace keys. |
| `node scripts/verify-product-labels.mjs` | **PASS** | Existing Phase 8A list/query/route and Pages fallback source/helper regression checks. |
| `git diff --check` | **PASS** | No whitespace errors. Git emitted only an LF-to-CRLF advisory for `src/i18n/resources.ts`. |
| Compare contract/source diff | **PASS (scope inspection)** | `git diff --name-only` contains no `src/compare/` path; no Compare state or CSV code was changed. |

No browser test or deployed hosting test was run.

## 11. Regression assessment

- **Route preservation — PASS (source):** Existing Promotion Type route IDs and paths are unchanged; nested list/create/detail topology remains as declared. No router or legacy redirect file changed.
- **Query/hash — PASS (focused source check):** List links carry current search/hash into the drawer; drawer close/save carries them to the list. The list currently has no owned filters/sorting/pagination state to exercise.
- **Form and mock service — PASS (static/executable boundary):** Existing three-field requirements and status IDs remain unchanged; service create/update mutates its in-memory demo store and unknown-record update rejects. UI display and failure recovery remain browser-unverified.
- **i18n — PASS (type/source):** Promotion Type namespace key parity compiles and the focused check passes. Visual vi/en layout is unverified.
- **Product Label Quick View — PASS (existing focused check):** Its verification script passes; its route/component sources were not modified.
- **Compare — PASS (change-scope evidence only):** Scenario IDs, seven criteria, localStorage keys, observations, approval semantics, 22-column English CSV, and export code were not edited. No browser storage/CSV regression run was performed.
- **Production isolation — PASS (workspace evidence):** Only the demo checkout files listed above changed. No production checkout was accessed or modified.

## 12. Browser acceptance status

**Browser acceptance: NOT VERIFIED.** Tool discovery found no usable DOM-capable browser automation. Typecheck, build, and executable source/mock checks are not browser proof.

Manual checklist for a local Vite session (configured base `/demo-layout/`):

1. Open `http://localhost:5173/demo-layout/claude/promotion-types`; confirm the list and Edit actions render.
2. Click Edit for `promotion-type-1`; confirm the list remains behind the drawer and the correct record values load.
3. Change a value, select Save; confirm one update, localized success feedback, return to list, and updated row value.
4. Change a value, select Cancel; confirm Stay retains the edit and Discard returns to list.
5. Repeat dirty close through X, mask, Escape, and browser Back; confirm each presents the same guard and preserves data when staying.
6. Clear each required field in turn and submit; confirm field errors, summary, and first-invalid focus, with other values retained.
7. Open `/demo-layout/claude/promotion-types/promotion-type-1?sample=kept#row`; refresh, then close; confirm the record loads and `?sample=kept#row` remains on the list.
8. Open `/demo-layout/claude/promotion-types/unknown-id`; confirm recoverable not-found and Return to list.
9. Navigate to another record while clean; confirm fields update. While dirty, attempt a record change; confirm guard, Stay preserves the first record, Discard loads the second record cleanly.
10. Switch vi → en → vi while editing; confirm the form values remain and labels update without URL/history change.
11. Repeat at a narrow viewport; confirm one-column fields, readable Vietnamese labels, scrollable body, and reachable footer actions.
12. Open Product Label Quick View and verify its read-only fields/close path. In Compare, inspect existing observations and export the worksheet/all-scenario CSV; verify no values or contract changed.

## 13. Risks and unverified behavior

- The demo service owns a transient in-memory store; changes are not durable across full reloads. This is pre-existing behavior, not a new persistence guarantee.
- Save errors are caught and values retained in source. The existing service has no deterministic failure control; its unknown-ID rejection is directly checked at service level but is not a reachable edit UI path. Rendered error recovery remains unverified.
- React Router blocker, browser Back/Forward, `beforeunload`, Ant Design Drawer focus containment/return, and visible interaction states need manual browser acceptance.
- The list has no current search/filter/sort/page query model; query/hash are forwarded opaquely. No new list state was invented.
- The candidate classification field and its allowed values remain unspecified. Only the user-confirmed simple highlight/classification meaning is shown as explanatory copy.
- GitHub Pages and deployment were not tested. Local build output is not deployment evidence.
- Two pre-existing prunable worktree registrations were observed and left untouched.

## 14. NEEDS-TEAM-DECISION

1. Decide whether Phase 8B should add an optional display label and/or a single classification field, and if so approve exact fictional values and persistence semantics. Until then, the implementation uses only the existing three-field fixture model.
2. Decide whether the module-memory mock should remain ephemeral or acquire a resettable persistence contract in a later phase. No storage key was introduced here.
3. Confirm that the current seven Compare criteria remain appropriate for the expanded Scenario 1 pilots in the separately authorized Compare phase. This implementation did not alter Compare.

## 15. Phase 8C handoff

Promotion Offer Full Page remains separate. Its existing routes, multi-field form, conditional behaviors, and dirty-state work were not changed. Phase 8C should first verify its current fictional model and route guard; it must not reuse this drawer’s three-field form or treat this phase’s simple highlight/classification explanation as an offer rule. No Phase 8C route, form, validation, or business behavior was implemented here.
