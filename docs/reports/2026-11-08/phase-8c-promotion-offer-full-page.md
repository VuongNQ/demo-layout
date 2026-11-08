# Phase 8C — Promotion Offer Full Page

Author: Vuowng
Date: 2026-11-08
Repository: VuongNQ/demo-layout
Branch: feat/playground-compare
Revision: 981bfa707945cc2b03f17ab7504ea545c3af83cf
Worktree: E:\demo-layout

## 1. Scope and decisions

Implemented Scenario 1 pilot 3: a route-backed Promotion Offer Create/Edit Full Page. The implementation retains the existing application shell and existing Promotion routes, and groups the verified form fields into three sections.

Scope excludes Promotion History, Compare, Product Label, Promotion Type, production source, and global styling or routing changes. The production reference repository was not edited or used as evidence for demo behavior.

**Verified source evidence:** the current demo owns fictional Promotion records in `src/features/promotions/demo-promotions-data.ts`; a local service and React Query hooks own the existing mock behavior. Existing route IDs and paths are defined in `src/claude/routes/route-meta.ts` and composed lazily in `src/claude/routes/route-config.tsx`.

**Approved UX Contract:** the Scenario 1 contract (`docs/reports/2026-11-07/scenario-1-product-presentation-ux-contract.md`) defines Promotion Offer as a Full Page pilot for multi-section configuration, validation recovery, and unsaved-change protection. It does not authorize extra production fields or business rules.

**Decision applied:** no conditional fields or new business rules were added. The current demo form has no conditional field dependencies. Date ordering, offer calculations, eligibility, and permissions remain outside this implementation.

## 2. Verified source baseline and UX Contract

| Area | Verified current source | Baseline behavior |
|---|---|---|
| Routes | `src/claude/routes/route-meta.ts`; `src/claude/routes/route-config.tsx` | `promotions`, `promotionCreate`, and `promotionEdit`; Create and Edit use lazy page imports. |
| Fields | `src/features/promotions/PromotionForm.tsx` | `name`, `code`, `offerType`, `startDate`, `endDate`, `status`, `assignedProducts`; each currently has a required rule. Dates are normalized to `YYYY-MM-DD`. |
| Data | `src/features/promotions/demo-promotions-data.ts` | Synthetic records and IDs such as `promotion-1`; defaults are fictional. The shape is a demo fixture, not a verified production DTO. |
| Service | `src/features/promotions/promotions.service.ts` | Module-memory mock store with simulated delays; no network request is made. A page refresh recreates the initial fixture state. |
| Cache | `src/features/promotions/promotions.queries.hook.ts` | Create invalidates the list; update invalidates the list and writes the updated record to its detail query key. |
| Existing edit UX | `src/features/promotions/PromotionEditPage.tsx` at baseline | Contextual save bar and touched-based dirty flag; Back was disabled while dirty, but no route blocker or native unload handler existed. |
| Localization | `src/i18n/resources.ts` | Promotion page strings live in the existing `claude.pages.promotion` namespace with Vietnamese and English resources. |

The Scenario 1 contract was available locally. The separate production audit cited by the original context was not inspected as live source; no claims about production APIs, DTOs, permissions, or server behavior are made here.

## 3. Impact map and risk classification

**Risk: HIGH.** This feature couples form lifecycle, navigation blocking, native unload warnings, and asynchronous mutation state. The route definitions themselves were left intact.

| Surface | Change | Risk / boundary |
|---|---|---|
| Promotion Create/Edit pages | Existing lazy route components now delegate to a shared feature-local Full Page lifecycle. | Medium: retains exported components and route IDs; runtime lifecycle not browser-tested. |
| Promotion form | Existing fields and required rules are grouped under semantic sections. | Low-to-medium: Ant Design Form remains the sole form-state owner. |
| List links | Add/Edit navigation carries the current search and hash values. | Low: no new query interpretation is claimed; the current list does not derive filters from these values. |
| Translation resources | Add bilingual Full Page labels and messages. | Low: existing resource ownership and promotion namespace retained. The file also contains pre-existing Phase 8B edits. |
| Compare and platform routing | No source changes. | Compatibility checked statically and via existing focused scripts; browser behavior not verified. |

## 4. Full Page implementation

`src/features/promotions/PromotionFullPage.tsx` is the shared feature-level Create/Edit page. `PromotionCreatePage.tsx` and `PromotionEditPage.tsx` remain the lazy-route entry components and select `mode="create"` or `mode="edit"`.

The page has a semantic `h1`, record identity on Edit, a return-to-list action, and in-page section navigation. The existing seven fields are organized as:

- Promotion details: name, code, offer type.
- Schedule and status: start date, end date, status.
- Applicable products: assigned products.

`PromotionForm.module.scss` and `PromotionFullPage.module.scss` provide local spacing and responsive behavior. No global style, token, or theme file was changed. Create and Edit remain a single full-page workflow; no Drawer, Modal, or artificial wizard was added.

Loading, service error with retry, unknown ID, and initialized states are represented. The error and unknown-ID branches provide a return path to the list. Unknown IDs are not converted into editable empty records.

## 5. Routing and navigation

**Verified source evidence:** `src/claude/routes/route-meta.ts` and `src/claude/routes/route-config.tsx` were not changed. Existing IDs and paths remain:

| Route ID | Existing path | Resulting presentation |
|---|---|---|
| `promotions` | `/claude/promotions` | Promotion list |
| `promotionCreate` | `/claude/promotions/create` | Create Full Page |
| `promotionEdit` | `/claude/promotions/:id/edit` | Edit Full Page |

All three remain lazy route components. No duplicate route or legacy redirect was introduced. This keeps the existing React Router and GitHub Pages basename setup intact.

The list’s Add and Edit actions append the current `location.search` and `location.hash`; Full Page Back, Cancel, error, and not-found return actions use the same values. These values are preserved as URL state. **Inference / limitation:** the current Promotions list does not appear to parse them as search/filter state, so preservation does not imply restoration of a richer filter model.

Direct deep-link, refresh, Back/Forward, and hosting behavior were not exercised in a browser. The existing build’s SPA fallback path remains the configured path, but no deployed Pages test was performed.

## 6. Form ownership and initialization

`PromotionFullPage` creates one Ant Design `FormInstance` using `Form.useForm<PromotionFormValues>()`. Form values are not copied into React state. A baseline snapshot is held only to determine semantic dirty state and to restore on discard.

When the page mode or record identity changes, a layout effect resets the form and establishes a copied baseline for the new identity. The effect keys on record ID rather than record object identity, so a same-record query refresh does not overwrite in-progress values. Products are copied as arrays so the baseline is not aliased to the form’s mutable selection.

The dirty comparison covers all seven verified fields. Reverting a value to its baseline makes the form pristine; selected-product order is compared as represented by the field value. This behavior is covered by the focused executable check for the pure comparison helper, but not by rendered interaction testing.

## 7. Validation and conditional behavior

**Verified source evidence:** the existing required rules and field names remain in `PromotionForm.tsx`; the DatePicker continues to normalize values to `YYYY-MM-DD`. No Zod package or existing Promotion Offer schema was found, so no new schema or duplicate validation layer was introduced.

Save explicitly calls `form.validateFields()`. On failure, entered values remain in the FormInstance; current field errors are summarized with links that scroll to and focus the corresponding control. A field-level alert is used when errors map to fields; a form-level fallback appears if no field can be mapped. Field-level Ant Design messages remain the field validation owner.

No conditional fields currently exist in this demo form. No conditional requirement, date dependency, financial constraint, eligibility rule, or promotion calculation was invented. The UX Contract’s conditional-validation guidance is therefore not represented as unsupported business logic.

## 8. Unsaved-changes protection

The page combines:

- React Router `useBlocker` for in-app pathname, query, or hash navigation while dirty or saving.
- One controlled Ant Design Modal for Stay or Discard. While saving, only Stay is available and modal dismissal routes are disabled.
- A native `beforeunload` listener while dirty or saving. Browsers control the confirmation wording for refresh, tab close, and external navigation.
- The existing `ContextualSaveBar` for dirty Edit state. Its Discard action resets to the current baseline without leaving the page.

Staying resets the router blocker and retains current form values. Discard resets the form to its baseline and proceeds with the pending route transition. The guard is not a global guard and does not modify other forms.

Successful Edit establishes the returned mock record as the new pristine baseline and remains on the page. Successful Create establishes a baseline and navigates to the list using the preserved query/hash. Failed mutations retain entered values and show a localized recoverable error. A pending blocked navigation is reset after successful save to prevent an unintended exit.

**Limitations / not verified:** native unload dialogs cannot offer the same custom localized Stay/Discard UI. Browser Back/Forward, repeated navigation attempts, modal focus behavior, and refresh protection were not rendered or interacted with in this environment.

## 9. Save, mock service, and cache behavior

The page uses existing `useCreatePromotionMutation` and `useUpdatePromotionMutation` hooks. It does not add a resource owner, storage key, endpoint, transport, or API client. The fictional service owns a transient module-memory store; query cache invalidation/update behavior remains in the existing hook implementation.

During a mutation, duplicate Save actions are disabled through the existing mutation pending state and form controls are disabled. The page exposes localized pending feedback. The executable focused check exercised the actual mock service’s read, update, create, and unknown-record update failure paths; it did not render the UI failure/retry experience.

## 10. Accessibility

Source-level provisions include a single page `h1`, section `h2` elements with programmatic focusability, associated Ant Design form labels, keyboard-operable section navigation and actions, `role="alert"` for errors, a polite pending status, and scroll/focus to validation fields. Section navigation does not alter the URL hash.

The layout uses wrapping actions and responsive one-column fields at narrow widths. Long page titles allow wrapping. These are implementation observations only. Keyboard-only operation, actual visible focus, screen-reader announcements, contrast, clipping, and responsive reflow have not been verified in a browser; WCAG 2.2 AA remains a target, not a conformance claim.

## 11. Internationalization

The implementation uses the existing `claude.pages.promotion` resource namespace and `useTranslation('claude')`; it adds no second language owner. New section labels, record identity, validation summary, navigation confirmation, loading/save errors, and action text have Vietnamese and English values in `src/i18n/resources.ts`.

The focused executable check compares the Vietnamese and English Promotion resource keys; `npm run typecheck` also checks the existing compile-time resource parity assertions. Fixture values and IDs remain unchanged. Language switching while editing was not browser-tested; source keeps values in the Ant Design FormInstance and does not key/reset the page on language.

## 12. Files changed

Phase 8C implementation and verification files:

- `src/features/promotions/PromotionFullPage.tsx` — Create/Edit lifecycle, validation recovery, save, dirty and navigation guards.
- `src/features/promotions/PromotionFullPage.module.scss` — page spacing, section navigation, summary, and responsive action styling.
- `src/features/promotions/PromotionForm.tsx` — retained field contract, grouped sections, and disabled state while saving.
- `src/features/promotions/PromotionForm.module.scss` — section spacing.
- `src/features/promotions/promotion-form.utils.ts` — typed value mapping, defensive copies, semantic equality.
- `src/features/promotions/PromotionCreatePage.tsx` and `PromotionEditPage.tsx` — existing lazy exports delegate to the Full Page implementation.
- `src/features/promotions/PromotionsListPage.tsx` — translated page heading, accessible Edit label, and query/hash forwarding.
- `src/i18n/resources.ts` — bilingual Promotion Full Page UI strings.
- `scripts/verify-promotion-offer-full-page.mjs` — focused checks using existing TypeScript runtime.
- This report.

**Pre-existing work preserved:** before Phase 8C edits, the working tree already contained Phase 8B modifications in `src/features/promotion-types/PromotionTypeDrawerRoute.tsx`, `PromotionTypeForm.tsx`, `PromotionTypesListPage.tsx`, `src/i18n/resources.ts`, and untracked `scripts/verify-promotion-type-quick-edit.mjs` plus `docs/reports/2026-11-08/phase-8b-promotion-type-quick-edit.md`. Those files were not reverted or cleaned. `resources.ts` contains both the earlier Phase 8B additions and the new Promotion translations.

No route registry, root router, Compare source, Product Label source, theme, global styles, dependency manifest/lockfile, production repository, or CLI profile was changed. The complete final working-tree inventory was reviewed; changes are limited to the Phase 8B pre-existing files and the listed Phase 8C files/report.

## 13. Validation commands and results

| Command/check | Result | Evidence boundary |
|---|---|---|
| `npm run typecheck` | PASS | TypeScript completed with exit code 0. |
| `npm run build` | PASS | Vite production build completed; `PromotionFullPage` emitted as a separate lazy chunk (`dist/assets/PromotionFullPage-*.js`) and `scripts/spa-fallback.mjs` wrote `dist/404.html`. Build is not browser proof. |
| `node scripts/verify-promotion-offer-full-page.mjs` | PASS | Semantic dirty helper, fictional service read/create/update/error, route contract/lazy declarations, query/hash forwarding, source guardrails, form field contract, and promotion vi/en key parity. |
| `node scripts/verify-product-labels.mjs` | PASS | Existing Phase 8A focused source/fixture/route/Pages checks. |
| `node scripts/verify-promotion-type-quick-edit.mjs` | PASS | Existing Phase 8B focused fixture/service/route/guard/resource checks. |
| `git diff --check` | PASS | No whitespace errors in tracked diff. Git emitted only a line-ending conversion warning for the pre-existing modified `src/i18n/resources.ts`. |
| `git diff --quiet -- src/compare` | PASS | Compare tracked source has no diff. Compare storage and CSV implementation were not changed. |

The focused checks are source/executable checks; they do not exercise React rendering, browser history, actual FormInstance event handling, or focus behavior.

## 14. Regression assessment

- **Routes:** source verification confirms existing Promotion route IDs/paths and lazy route component names remain in place. No route metadata, root route, or redirect file changed.
- **Promotion fixture/service:** existing source is reused. The focused script verified in-memory service reads, create/update success, and unknown update failure.
- **Form contract:** the same seven fields and required rules remain; no new DTO fields, schema, or conditional rules were added.
- **Phase 8A/8B:** their existing focused verification scripts pass. This is executable evidence for the checks encoded by those scripts, not full browser regression acceptance.
- **Compare:** tracked Compare source is unchanged; no localStorage or CSV contract edits were made.
- **GitHub Pages:** production build produced the SPA fallback; current basename/router configuration was not edited. Deployed Pages and actual deep-link responses were not tested.

## 15. Browser acceptance status

**Browser acceptance: NOT VERIFIED.** No usable DOM-capable browser automation/session was available for this task. No browser test is claimed.

Manual acceptance checklist:

1. Open `/demo-layout/claude/promotions`; choose Add and confirm a full-page Create form.
2. Enter valid fictional values and Create; confirm success feedback and return to the list.
3. Open Edit for a record and refresh its direct URL; confirm the same record initializes.
4. Submit with required fields empty; confirm values remain, errors are announced, and the first invalid control receives focus.
5. Edit then Cancel/Back; choose Stay and verify values remain, then repeat and choose Discard.
6. Edit then press browser Back; verify the same Stay/Discard behavior and Forward behavior after discard.
7. Change a value and revert it; verify navigation proceeds without a dirty warning.
8. While saving, attempt navigation and verify it cannot discard or duplicate the save; simulate a failed mutation if available and retry.
9. Open an unknown `/demo-layout/claude/promotions/<unknown-id>/edit`; verify the recoverable not-found state and list return.
10. Change language between vi/en while editing; verify values and record identity remain stable and labels wrap.
11. Use keyboard-only section navigation, form controls, validation links, and modal actions; inspect focus visibility and restoration.
12. Check 320px and desktop widths, including long labels and validation text.
13. Recheck Product Label Quick View, Promotion Type Quick Edit, Compare stored observations, and CSV export.

## 16. Risks and unverified behavior

- Runtime `useBlocker` + Modal behavior for browser history and repeated attempts is not verified; source shows one declarative modal driven by the blocker state.
- Native `beforeunload` wording and browser-specific unload behavior are controlled by the browser and unverified.
- The fictional service resets module-memory changes on refresh; there is intentionally no persistence guarantee.
- Mock mutation failure is executable at service level for an unknown ID; a recoverable UI save-failure path is implemented but not browser exercised.
- The current list preserves query/hash strings but does not establish that those strings represent implemented list filters.
- Accessibility and bilingual text expansion were reviewed statically, not measured in rendered browser layouts.
- The change does not add conditional Promotion Offer behavior because no such dependency is verified in current source or approved contract detail.

## 17. NEEDS-TEAM-DECISION

- If the pilot must demonstrate conditional fields, identify the approved field dependency and validation semantics. None are present in current demo source or specified sufficiently by the available contract; this implementation deliberately adds none.
- Confirm whether Promotion list query parameters are expected to encode future filter/sort/pagination state. The current change preserves query/hash but does not create such state behavior.
- Browser acceptance remains a required follow-up before treating keyboard, focus, route-blocking, responsive behavior, or WCAG target as verified.

No production approval, backend behavior, or new business rule is inferred by this prototype.

## 18. Phase 8D handoff

Promotion History Log Viewer Modal remains out of scope. Phase 8D should use mock event data only unless a separate explicit contract is approved; retain the distinction between inspecting event details and mutating the original event. No comment API, permissions, or production persistence contract was added here.
