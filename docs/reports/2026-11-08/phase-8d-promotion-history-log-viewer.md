# Phase 8D — Promotion History Log Viewer Modal

Author: Vuowng
Date: 2026-11-08
Repository: VuongNQ/demo-layout
Branch: feat/playground-compare
Revision: 981bfa707945cc2b03f17ab7504ea545c3af83cf
Worktree: E:\demo-layout

## 1. Scope and decisions

Implemented Scenario 1 pilot 4 as a route-less Ant Design Modal opened from the existing Claude Promotions list. It displays fictional sample event details as read-only values, copies only event details, and supports event-scoped inline comment threads with in-memory state.

The user-provided Scenario 1 contract authorizes an event Log Viewer Modal with immutable event data, mock comments, event-only copy, and a close confirmation for a nonempty unsent comment. No production endpoint, identity, permissions, retention, audit guarantee, or audit DTO was inferred.

**Verified source evidence:** the current checkout had no Promotion History page, route, event-detail UI, event fixtures, comment state/API, or copy behavior for promotion history. The Scenario 1 contract also describes these as absent and the history route as proposed rather than current. `PromotionsListPage.tsx` was therefore given a localized per-row “View history” entry action. This is the smallest available entry point and opens the modal without routing away from the list.

**Prototype decisions:** the modal contains two generated, stable fictional events per current fictional promotion fixture, newest first. Comments remain in memory while the Promotions list stays mounted. An unsent draft is held only by an Ant Design FormInstance; closing or switching events prompts before discarding it. No localStorage key or route was added.

## 2. Verified source baseline and UX Contract

| Topic | Current evidence | Finding |
|---|---|---|
| History source/entry point | `rg --files src` and source searches across `src/features/promotions`, Claude routes, menu, and translations | No Promotion History feature, history list, event-detail route, or entry action existed. Existing “history” strings in Required Information/Popular Loans/Attractive Offer and the sync page belong to other screens. |
| Promotion list | `src/features/promotions/PromotionsListPage.tsx` | Existing list has promotion data, Edit links, and an Add action; no history affordance or history behavior. List route remains mounted for this route-less modal. |
| Fictional record model | `src/features/promotions/demo-promotions-data.ts` | Existing stable IDs and fields provide fictional promotion name/code/type/status/assigned products. No history DTO is implied. |
| Mock data ownership | `src/features/promotions/promotions.service.ts`, `promotions.queries.hook.ts` | Existing editable Promotion data uses a module-memory service. It has no history/comment API. Phase 8D does not change it. |
| i18n | `src/i18n/index.ts`, `src/i18n/resources.ts` | One shared vi/en i18next instance; promotion screen strings are owned by `claude.pages.promotion`. |
| Modal/design evidence | Local Ant Design 5.22.2 dependency, `AGENTS.md`, `docs/design-system/README.md`, `components.md`, `patterns.md`, `layouts.md`, `status.md` | Feature-local ownership and Ant Design are appropriate. WCAG 2.2 AA is a target; rendered conformance is not established. |
| Routing | `src/claude/routes/route-meta.ts`, `route-config.tsx` | No Promotion History route exists or was added. Existing route and lazy boundaries are unchanged. |

**UX Contract evidence:** `docs/reports/2026-11-07/scenario-1-product-presentation-ux-contract.md`, §4.4, specifies read-only event details, event identity, timestamp/actor/action/source, before/after data, event-only copy, comments separate from event data, mock attribution, isolated comment lifetime, close confirmation for nonempty drafts, and no assumed production API or permission model. The contract leaves production copy allowlists/masking, comment persistence, identity, and history route as open decisions.

**Production boundary:** this implementation uses only local fictional demo fixtures and does not inspect or change the production repository. No production claim is made.

## 3. Impact map and risk classification

**Risk: MEDIUM-HIGH.** The code change is feature-local and route-less, but clipboard permission failures, modal focus lifecycle, comment identity isolation, and draft-safe close behavior require rendered browser verification.

| Surface | Impact | Compatibility boundary |
|---|---|---|
| Promotions list | Adds one row-level View history button and focus restoration bookkeeping. | Existing Edit/Add navigation and query/hash behavior remain. |
| Event fixtures | Adds deterministic synthetic events derived from the current fictional Promotion fixtures. | Does not modify the Promotion model/service or claim an audit source. |
| Modal | Adds focused read-only event/detail view, event chooser, copy feedback, and thread. | No route, drawer, page-shell, or global-style changes. |
| Comment state | Stores comments by stable event ID in component memory. | No localStorage, backend, API, identity, or permission contract. |
| i18n | Adds bilingual strings to existing Promotion namespace. | Shared i18next remains the only locale owner; IDs/raw event values remain unchanged. |
| Compare and earlier pilots | No Compare files or Phase 8A/8B feature files were changed by Phase 8D. | Compare scenario/storage/CSV contracts remain untouched; earlier uncommitted 8B/8C work is preserved. |

## 4. Log Viewer Modal implementation

`src/features/promotions/PromotionHistoryLogViewer.tsx` is rendered as a child of the existing `PromotionsListPage` and remains mounted while that list route remains mounted. The list row’s new “View history” control opens the Modal for that promotion. The latest sample event is selected initially; event-selector buttons allow viewing the other event without leaving the Modal.

The Modal includes a named heading, a prominent fictional-data notice, a chronological event selector, event metadata, before/after changes, a Copy event details action, the separate comment thread, and a visible Close action. Unknown promotion/event identifiers and empty event sets render localized recoverable empty/not-found content. No loading or retry state is invented because the mock fixture is synchronous and has no failure path.

There is no direct history deep link because the current source had no history route and the current contract does not authorize one. The parent history/list context stays in place behind the Modal.

## 5. Historical event integrity

`src/features/promotions/promotion-history.data.ts` creates stable IDs such as `promotion-history-promotion-1-created` and `promotion-history-promotion-1-products`. The two entries use fixed UTC timestamps, the fictional actor `Demo operator`, the source `Local prototype`, and only fields available from the current demo promotion fixtures. The UI labels the records as fictional sample events and explicitly says they are not a system audit log.

Source fixture objects and their change arrays are frozen. Lookup returns copies, including copied array values, so the viewer cannot mutate the source event payload. The viewer offers no event edit/delete controls. Comment objects live separately in a map keyed by `eventId`; commenting does not modify event timestamps, actor, source, action, or before/after values.

These sample records are generated examples, not verified historical activity. They do not imply a real audit trail, signature, compliance guarantee, permission, or backend event semantics.

## 6. Copy functionality

`formatPromotionHistoryCopyText` in `promotion-history.utils.ts` produces a plain-text summary of the selected event’s ID, promotion ID, translated display labels, fixed timestamp, fictional actor/source, and before/after values. The displayed UI labels follow the current vi/en language; event identifiers and raw fixture values remain unchanged. Empty before/after values receive a localized “Not applicable” label.

Only the selected event is copied. Comments and unrelated promotion records are excluded. The copy allowlist is limited to the displayed, synthetic event fields; the implementation has no sensitive or customer data. Successful `navigator.clipboard.writeText` resolves to localized status feedback. If clipboard is missing or rejects, the UI reports failure and exposes the same event text in a selectable `<pre>` block for manual copying. It does not announce false success.

**UX Contract boundary:** production event-field copy allowlists and masking rules remain **NEEDS-TEAM-DECISION**. This prototype’s copy set is only for its fictional visible data.

## 7. Comment model and ownership

`PromotionHistoryComment` contains comment ID, event ID, body, fictional author, timestamp, and sequence. `commentsByEvent` is owned in `PromotionHistoryLogViewer` React state and indexed by stable event ID. `appendPromotionHistoryComment` orders comments oldest-first by ISO timestamp and then sequence, so equal timestamps remain deterministic. The author is localized as a fictional “Demo operator”; no authenticated identity is read.

No comment service, React Query resource, API, storage key, or durable persistence is added. Comments survive modal close/reopen and event switching while `PromotionsListPage` remains mounted. Navigating away from the list or reloading the application discards this in-memory mock state, as stated in the UI. There is no comment edit/delete/reaction/mention behavior.

## 8. Comment composer and draft lifecycle

The composer uses an Ant Design `FormInstance` as the single draft owner. Its persistent label is associated with a textarea, and its validator rejects empty or whitespace-only input. A successful synchronous local submit appends a comment under the selected event ID, clears only the composer, and announces success. Since this implementation has no asynchronous or fallible persistence operation, it has no fabricated pending/network-failure path; validation is the only submission error.

The submission handler includes a synchronous re-entry lock. Submission order is deterministic. Switching event while a meaningful unsent draft exists does not change the selected event; an inline confirmation offers Keep writing or Discard draft. The same confirmation appears when closing with a nonempty draft. X, Escape, mask, and the visible Close button use the same close path. Keep retains the FormInstance value and returns focus to the composer; Discard resets the form and either switches event or closes. Whitespace-only drafts are invalid and are not treated as meaningful content for close confirmation.

No route blocker is used. The Modal does not claim to protect a comment draft from browser refresh or navigating away through external browser controls; the list-level modal remains local to the screen.

## 9. Modal accessibility and close behavior

Source-level provisions include:

- Ant Design Modal with a programmatic title and heading.
- Initial focus to the selected event heading (or Modal title when no event is available).
- Ant Design Modal’s built-in modal keyboard/focus behavior; no custom focus trap is introduced.
- Event selector buttons with `aria-pressed` state and an accessible navigation name.
- Definition-list-like labeled values through Ant Design `Descriptions`, semantic change sections, and an ordered comment list.
- Visible Close and Copy actions, persistent comment label, field-level validation, and status/error announcements.
- Escape, X, backdrop, footer Close, and draft confirmation share one safety path.
- On close, focus returns to the triggering row action, with the list heading as fallback if that row is no longer rendered.
- A bounded Modal with a scrollable body, wrapping values, stacked narrow-screen layout, and pinned Modal footer actions.

These are source observations, not rendered keyboard or screen-reader proof. WCAG 2.2 AA conformance is not claimed.

## 10. Internationalization

The feature uses `useTranslation('claude')` and extends the existing `claude.pages.promotion.history` resource object in `src/i18n/resources.ts`. The strings cover list actions, event metadata, before/after labels, empty/not-found states, fictional-data notice, copy success/failure, comments, validation, draft confirmation, and close actions. The event data and stable IDs are not translated. Display timestamps use `Intl.DateTimeFormat` with `vi-VN` or `en-US`, explicit UTC interpretation, and a timezone label.

The focused verifier compares all history keys under both locales; TypeScript also validates the existing nested promotion key-parity assertion. Translation length, diacritic rendering, keyboard behavior after language switching, and narrow-screen wrapping have not been visually verified.

## 11. Files changed

Phase 8D files:

- `src/features/promotions/PromotionHistoryLogViewer.tsx` — route-less Modal, event selector/details, clipboard feedback, event-scoped comments and draft confirmation.
- `src/features/promotions/PromotionHistoryLogViewer.module.scss` — feature-local modal dimensions, scroll, event/change layout, comment thread, and responsive rules.
- `src/features/promotions/promotion-history.data.ts` — deterministic fictional event data and safe event lookup/copies.
- `src/features/promotions/promotion-history.utils.ts` — comment validation/order and event-only copy formatting.
- `src/features/promotions/PromotionsListPage.tsx` — accessible row-level history entry action and focus restoration. This file also contains existing Phase 8C work.
- `src/i18n/resources.ts` — vi/en history strings. This file already contained uncommitted Phase 8B/8C translations.
- `scripts/verify-promotion-history-log-viewer.mjs` — focused checks using existing TypeScript dependency.
- `docs/reports/2026-11-08/phase-8d-promotion-history-log-viewer.md` — this report.

The pre-existing uncommitted Phase 8B and Phase 8C files, reports, and scripts were preserved. No dependency, lockfile, route metadata, router, shell, Compare file, Product Label file, Promotion Type file, Promotion Offer service/form, global style/theme, Design System document, profile, or production repository was changed by Phase 8D.

## 12. Validation commands and results

| Command/check | Result | Evidence boundary |
|---|---|---|
| `npm run typecheck` | PASS | TypeScript completed with exit code 0, including locale key parity and Modal/Form APIs. |
| `npm run build` | PASS | Vite built 3,220 modules and emitted separate lazy `PromotionsListPage` JS/CSS chunks; SPA fallback script wrote `dist/404.html`. This is build evidence, not runtime proof. |
| `node scripts/verify-promotion-history-log-viewer.mjs` | PASS | Stable IDs/order, event lookup and unknown cases, copy isolation, event copy boundaries, comment validation/association/order, source immutability, and vi/en parity/source contracts. |
| `node scripts/verify-product-labels.mjs` | PASS | Existing Phase 8A focused source/helper/route/Pages checks. |
| `node scripts/verify-promotion-type-quick-edit.mjs` | PASS | Existing Phase 8B focused fixture/service/route/guard/resource checks. |
| `node scripts/verify-promotion-offer-full-page.mjs` | PASS | Existing Phase 8C focused lifecycle/route/service/resource checks. |
| `git diff --check` | PASS | No tracked-diff whitespace errors. Git emitted a line-ending conversion warning for the already modified `src/i18n/resources.ts`. |
| `git diff --quiet -- src/compare` | PASS | Compare tracked source is unchanged. |
| `fc /b dist\index.html dist\404.html` | PASS | The post-build SPA fallback exactly matches the entry document; this is local artifact evidence only. |
| Worktree/status inspection | VERIFIED | Current branch is `feat/playground-compare`, HEAD `981bfa707945cc2b03f17ab7504ea545c3af83cf`, root `E:\demo-layout`. Existing uncommitted Phase 8B/8C files remain present. Two old prunable worktree registrations were observed and left untouched. |

The Phase 8D executable script exercises data/helper modules and source contracts. It does not render React or establish Modal, clipboard, focus, or keyboard behavior.

## 13. Regression assessment

- **Promotion route registry:** unchanged; no history route or lazy route was added.
- **Promotion list:** existing Add/Edit actions remain. The added history action is a separate button in the same row action region; edit destination and list query/hash forwarding remain in source.
- **Promotion records/service:** fixture model, service, Query hooks, IDs, and mutations are unchanged. History fixtures are separate and read-only.
- **Earlier pilots:** Phase 8A/8B/8C verification scripts passed. This does not replace browser acceptance; their historical reports still state browser behavior is unverified.
- **Compare:** `git diff --quiet -- src/compare` passed. Scenario ID `drawer-vs-full-page`, criteria, localStorage keys, notes, scoring, CSV structure, and export behavior were not edited.
- **Packages:** no dependency or lockfile changes.
- **Production:** no production checkout/source was edited or queried.

## 14. Browser acceptance status

**Browser acceptance: NOT VERIFIED.** Tool inspection found no usable interactive DOM browser in this environment. No browser test, screenshot, clipboard observation, keyboard test, or rendered layout check is claimed. No browser package was installed and no server was started.

Manual acceptance checklist:

1. Open `/demo-layout/claude/promotions`; activate “View history” for a row and confirm the list remains behind the named Modal.
2. Confirm the two events appear newest first; select each and verify the ID, promotion ID, fixed timestamp, fictional actor/source, and read-only before/after values.
3. Close the clean Modal using X, Escape, backdrop, and visible Close; confirm focus returns to the same row action, or to the list heading if the row is unavailable.
4. Copy event details and inspect clipboard content. Confirm it contains only the selected event, excludes comments/other promotions, and gives success feedback.
5. Deny clipboard access or use a context where the Clipboard API is unavailable; verify failure feedback and that the selectable event text remains visible.
6. Submit an empty/whitespace-only comment and verify validation. Submit two comments and verify deterministic chronological display and fictional author attribution.
7. Close/reopen and switch events; verify comments stay with their event while the list remains mounted.
8. Enter a draft and attempt close via X, Escape, backdrop, and footer Close; choose Keep and verify the draft/focus remain, then repeat and discard.
9. Enter a draft and select another event; verify switching asks before clearing it. Test both Keep and Discard.
10. Switch vi/en while viewing and composing; verify draft/comments stay intact and labels/timestamps update appropriately.
11. Use keyboard-only navigation and inspect Modal focus containment, visible focus, announcement behavior, and 320px/desktop scrolling with long Vietnamese text.
12. Recheck Phase 8A Product Label, Phase 8B Promotion Type, Phase 8C Promotion Offer, and Compare notes/CSV in the same browser profile.

## 15. Risks and unverified behavior

- There was no existing Promotion History entry point to reuse. The minimal row-level action on each Promotion is an implementation choice; whether product design prefers a separate timeline/list remains open.
- The displayed events are synthetic snapshots derived from fictional fixtures. They are not records of operations and do not update when the fictional Promotion form changes.
- Clipboard success/failure is implemented but not browser-tested; clipboard access can depend on secure context and browser permission.
- Comment insertion is synchronous in-memory state with no persistence-failure branch. The app provides no durable comment guarantee; navigating away or reloading resets it.
- Focus return, focus containment, Escape/mask interactions, screen-reader announcements, text expansion, and responsive reflow remain NOT VERIFIED in a rendered browser.
- There is no direct event deep link or route. A separate deep-link requirement would need explicit route ownership/approval.
- `git diff --check` does not inspect untracked files; the focused script covers the new Phase 8D source/report files for trailing whitespace after report creation.

## 16. NEEDS-TEAM-DECISION

1. Confirm whether “View history” belongs on each promotion row or should be reached through a separate Promotion History list/timeline. No such existing entry point was present in this checkout.
2. Confirm any future production copy allowlist and masking rules. Current prototype copies only its fictional displayed fields; no production event/customer data is present.
3. Decide whether comments should persist beyond the current Promotions list lifetime and, if so, define an explicitly approved storage/API and identity boundary. This implementation intentionally adds neither.
4. Confirm any future history route/deep-link behavior before publishing event URLs. The current implementation is in-context only.

No backend approval, author authentication, permission, audit integrity, retention, or compliance rule was created.

## 17. Scenario 1 completion handoff

All four Scenario 1 pilot surfaces now have implementation work in the demo checkout: Product Label Quick View (8A), Promotion Type Quick Edit (8B), Promotion Offer Full Page (8C), and Promotion History Log Viewer Modal (8D). This statement describes source presence and static checks only. Phase 8A, 8B, 8C and 8D browser acceptance remains NOT VERIFIED; the four presentations should be tested together against the Scenario 1 acceptance criteria before treating the comparison as complete. No Compare Scenario 1 data, criterion IDs, local notes, scoring, or CSV contract was changed in Phase 8D.
