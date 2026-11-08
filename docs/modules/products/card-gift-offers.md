# Card Gift Offer — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `improve/vuongnq` (current checkout at time of writing).
- Date: 2026-11-05.
- Scope: `src/modules/products/configuration/card-gift-offer/` — **10 files**, `find src/modules/products/configuration/card-gift-offer -type f | wc -l`. This replaces the prior "Card Gift Offers Context" draft of this file, which used a different, non-template section structure and contained stale `list-product/`-based cross-reference paths (that directory no longer exists in source; see §10).
- Method: a `codebase-analyzer` subagent read all 10 files in full, plus `src/routes/main.routes.tsx`, `src/routes/form.routes.tsx`, `src/routes/pages.tsx`, `src/utils/navigate.ts`, `src/constants/permission.constant.ts`, `src/helpers/menus.helper.ts`, `src/guards/index.tsx`, `src/types/card-gift-offer.d.ts`, and the current credit-card consumer of `CardGiftLoan`. No runtime, browser, auth, or backend verification was performed.
- Primary open question settled this pass: whether a real create/update/status-change backend endpoint now exists for gift rules. **CONFIRMED: no.** Every `apiFetcher` call in the submodule is a read-only `GET` (reference data for cards/loans/document sets); the save/status-change path mutates only the in-memory `mock-data.ts` store via `saveMockRule`. See §4 and §6.
- Verification gaps carried forward (at most five, ordered by consequence; further gaps are in §15):
  1. Whether the backend's `products/search` and `document-set` endpoints actually return the shape the tolerant parsers in `rule-form.tsx` assume, and whether `productLineIds` `1`/`2` really map to `CL`/`CD` (§6, §15).
  2. Whether the broader `PRODUCT_VIEW_CREDIT_CARD`/`PRODUCT_EDIT_CREDIT_CARD` permission fallback (§9) is intentional for the mock stage or needs its own dedicated permission going forward (§15).
  3. Whether `appliedProductCount` (rule-form.tsx:608-609) is meant to count matched card/loan pairs or distinct products — current code counts result rows, i.e. pairs (§13).
  4. Whether the `CL` (cash-loan) rule path is intentionally unreachable from the UI (list renders only the `CD` tab) or a gap (§13).
  5. How `FormLayout` invokes the embedded `rule-form.tsx`'s `submitForm` handle — `src/layouts/form.layout.tsx` was not read in this pass (§4).

## 1. Responsibility

This submodule is the admin UI for a "gift rule" (`GiftRule`): a rule that maps credit-card conditions to cash-loan conditions, used to decide which loan product a card qualifies a customer for. It is explicitly a **mock-stage prototype**: the save button's own label reads "Lưu mock" (`rule-form.tsx:815`), and there is no backend write endpoint (§4, §6). The real, backend-integrated card-to-loan gift relationship (`CardGiftLoan`) is a separate, unrelated contract consumed by the credit-card product's promotion flow — see §8 and §10. Routes exist for list, create, edit, and view of gift rules (§2); the rule editor can preview matching card/loan combinations using live reference-data GETs (§6).

## 2. Entry points and routes

All four routes are guarded by a static two-member permission OR array (CONFIRMED, `src/guards/index.tsx:32`, `permissions.some(...)`):

| Route path | `pages.tsx` lazy export | Route file : line | Permissions (OR) |
| --- | --- | --- | --- |
| list | — | `src/routes/main.routes.tsx:150-156` | `[CARD_GIFT_OFFER_VIEW, PRODUCT_VIEW_CREDIT_CARD]` |
| create | — | `src/routes/form.routes.tsx:170-177` | `[CARD_GIFT_OFFER_EDIT, PRODUCT_EDIT_CREDIT_CARD]` |
| view `/:id` | — | `src/routes/form.routes.tsx:180-187` | `[CARD_GIFT_OFFER_VIEW, PRODUCT_VIEW_CREDIT_CARD]` |
| edit `/:id` | — | `src/routes/form.routes.tsx:190-197` | `[CARD_GIFT_OFFER_EDIT, PRODUCT_EDIT_CREDIT_CARD]` |

- Lazy exports: `src/routes/pages.tsx:20-23`.
- `PageURLs` builders (CONFIRMED, `src/utils/navigate.ts`): `ofCardGiftOffer()` (145-147), `ofCardGiftOfferCreate()` (149-151), `ofCardGiftOfferEdit(id)` (153-155), `ofCardGiftOfferView(id)` (157-159) — all four routes have builders; no hardcoded-literal-navigation gap exists here, unlike some other modules.
- OR semantics (CONFIRMED): `GuardedPage` (`src/guards/index.tsx:32`) uses `.some(...)`, so a user with only `PRODUCT_VIEW_CREDIT_CARD` can reach list/view, and a user with only `PRODUCT_EDIT_CREDIT_CARD` can reach create/edit, without holding the feature-specific `CARD_GIFT_OFFER_*` permission at all. Failed guard redirects to `PageURLs.of404()` (`guards/index.tsx:33`).
- **Menu (CONFIRMED, corrects the prior draft):** `src/helpers/menus.helper.ts` has **no card-gift-offer menu entry** (`grep` for a card-gift menu item returns nothing). The prior draft's claim that "the menu additionally lists cash-loan product view, producing a different permission registry from the route" does not match current source — there is no menu entry to compare against. These four routes are reachable only by direct URL/`PageURLs` call, not via any menu item. Whether this is intentional (URL-only, embedded from elsewhere) or a gap is `NEEDS-VERIFICATION` (§15).
- Unknown/invalid `:id` on view or edit: `getMockRule(id)` returns `undefined` (`mock-data.ts:181-183`) and the form renders with empty fields (`rule-form.tsx:278`) rather than a 404 or error state.

## 3. Directory map

`find src/modules/products/configuration/card-gift-offer -type f | sort` → 10 files:

```text
card-gift-offer/
|-- rule-form.tsx          # 826 lines — shared rule editor (create/edit/view), conditions, preview, save
|-- mock-data.ts           # 210 lines — GiftRule/GiftCondition/CardGiftAssignment types + in-memory store
|-- constants.ts           # 27 lines — CardGiftOfferTabs enum, operators, criteria
|-- assignment-preview.tsx # 135 lines — preview table component; CONFIRMED no importer anywhere in src/ (dead code, §13)
|-- create/form.tsx        # 30 lines — FormLayout shell, embeds rule-form in create mode
|-- edit/form.tsx          # 38 lines — FormLayout shell, "Thông tin chung" + "Lịch sử cập nhật" tabs
|-- view/form.tsx          # 39 lines — FormLayout shell, read-only mode
|-- view/history.tsx       # 66 lines — static history table, no API/Redux
|-- list/list.tsx          # 230 lines — list page, single CD tab, client-side filter
`-- list/searcher.tsx      # 75 lines — name/status filter form, exports CardGiftOfferFilter type
```

No `services/` folder exists in this submodule (CONFIRMED, matches the file list above exactly). No `.scss`/`.module.scss` files exist; styling is Emotion (`css` prop / `@jsxImportSource`), classified `legacy-compatible` per §12.

## 4. Main runtime flows

### Flow A — list

`list/list.tsx:110` (CONFIRMED): on mount, `useState(getMockRules())` takes a one-time snapshot of the mock store. Name/status filtering (158-165) and the single `CD` tab (218-222) are applied client-side against that snapshot — the list does not refetch from `mock-data.ts` after a save elsewhere unless the page remounts via navigation. "Tạo mới" navigates to create (113-114).

### Flow B — create / edit / view (shared `rule-form.tsx`)

- `create/form.tsx`, `edit/form.tsx`, and `view/form.tsx` each wrap `FormLayout` around one embedded `rule-form.tsx` instance, differing only in `readOnly` (view) and navigation target on save (`rule-form.tsx:615-619`).
- On mount, `rule-form.tsx` loads four reference-data lists via direct `apiFetcher.get` calls (lines 312, 320, 328, 336 — see §6); errors from these are swallowed (354-355, `NEEDS-VERIFICATION` whether this is intentional).
- For edit/view, `getMockRule(id)` (mock-data.ts:181-183) seeds the form; an unknown id yields an empty form rather than an error (§2, §13).
- "Xem kết quả" (`applyRule`, rule-form.tsx:522-591) issues two more reference-data GETs (529, 537) and computes card/loan matches entirely in the browser (`matchesCatalogItem`, 215-262); results live only in React state (552-583), never persisted.
- **Save (`rule-form.tsx:593-631`, CONFIRMED mock-only):** `form.validateFields()` (AntD rules only, no Zod) → builds a `GiftRule` payload (600-611) → `console.log`s the payload (613, debug scaffolding, flagged in §13) → `saveMockRule(payload)` (614) → navigates to list/view (615-619). `saveMockRule` (mock-data.ts:185-189) mutates the module-scope `let mockRules` array (mock-data.ts:124). **No network call is made for save.** For create, the id is client-generated: `` `rule-${Date.now()}` `` (601).
- Status toggle (`ruleStatus`, rule-form.tsx:285; `Switch`, 709-716) is local component state, persisted only through the same mock-only save path — there is no separate status-change endpoint or action.
- `FormRef`/`useImperativeHandle` wiring (`rule-form.tsx:633`, `{ form, submitForm: save }`) is the contract `FormLayout` calls into; exactly how `FormLayout` invokes it was not traced in this pass (`src/layouts/form.layout.tsx` not read) — `NEEDS-VERIFICATION`.

## 5. State ownership

| State | Owner | Notes |
| --- | --- | --- |
| Gift rules (authoritative) | Module-scope mutable array `mockRules` (`mock-data.ts:124`), via `getMockRules`/`getMockRule`/`saveMockRule` | Resets to seed data on page reload — session-only, not persisted (§13) |
| Rule editor form fields | AntD `Form`/`FormInstance` (`rule-form.tsx:301`) | Target-compatible per `.claude/rules/05-form.md` |
| Rule status, conditions, preview results, reference-option lists | Local React `useState` (`rule-form.tsx:285-300`) | Not Redux, not TanStack Query |
| List filter / snapshot | Local React `useState` (`list/list.tsx:108-110`) | One-time snapshot of the mock store on mount (§4 Flow A) |

**CONFIRMED: no Redux slice and no TanStack Query usage anywhere in this submodule** (`grep -rl "@tanstack/react-query\|redux\|useAppSelector\|useAppDispatch" src/modules/products/configuration/card-gift-offer/` returns no match). This is consistent with the submodule's mock-stage status, not a target-architecture deviation to flag, per `.claude/ARCHITECTURE.md` — there is no server resource yet for either Redux or TanStack Query to own.

A separate, unrelated Redux thunk — `getCardGiftOfferProducts` (`src/redux/slices/product-list.slice.ts:248-287`, `GET api/admin/portal/v1/products/catalog`) plus its `watchCardGiftOffer*` selectors and `resetCardGiftOffer` action — exists in the Products domain's central slice but is **CONFIRMED to have no consumer anywhere in `src/`** (dead code, not owned by or used by this submodule; recorded in §13, not this submodule's own state).

## 6. API boundaries

**All calls are read-only (`GET`), made directly from `rule-form.tsx` with no service layer (CONFIRMED):**

| Call | Endpoint | Params | Line | Trigger |
| --- | --- | --- | --- | --- |
| Card catalog (CD) | `api/admin/portal/v1/products/search` | `page 0, size 9999, productLineCode 'CD', status 'ACTIVE'` | 312 | mount |
| Loan catalog (CL) | `api/admin/portal/v1/products/search` | same, `productLineCode 'CL'` | 320 | mount |
| Document set (CD) | `api/admin/portal/v1/document-set` | `page 0, size 9999, productLineIds 2, status 'ACTIVE'` | 328 | mount |
| Document set (CL) | `api/admin/portal/v1/document-set` | same, `productLineIds 1` | 336 | mount |
| Card catalog (preview) | `api/admin/portal/v1/products/search` | `productLineCode 'CD'` | 529 | "Xem kết quả" |
| Loan catalog (preview) | `api/admin/portal/v1/products/search` | `productLineCode 'CL'` | 537 | "Xem kết quả" |

**No create/update/delete/status endpoint exists.** Save and status-change are mock-only (§4, §5).

- Response parsing is tolerant rather than pinned to a known contract: `getResponseItems` (rule-form.tsx:139-150) accepts a bare array, `{items}`, or `{data:{items}}`; `getCatalogField`/`getLoanFaTenor` (160-168, 199-213) try alternate field names. This, combined with the untyped `CatalogItem` (73-80), signals the backend contract for `products/search`/`document-set` is not yet pinned down — `NEEDS-VERIFICATION` of the actual backend shape, and whether `productLineIds` `1`/`2` really correspond to `CL`/`CD` (not independently confirmed from any backend source in this pass).
- Per `.claude/rules/03-api-service.md` `## Endpoint ownership`, these direct component-level `apiFetcher.get` calls with no service are the discouraged pattern for new code; they are pre-existing in this mock-stage feature and are not presented as a defect requiring immediate fixing, but any future production implementation of this feature should not add further direct component endpoints (§9 cross-reference in prior draft retained).
- **Mock data does not conform to `.claude/rules/03-api-service.md` `## Mock data`** (adopted 2026-10-21, after this code was written — a timing gap, not treated as a defect): no `services/` folder exists to hold a boundary; the file is named `mock-data.ts`, not `<domain>.mock.ts`; there is no `USE_MOCK_*` switch anywhere in the submodule or in `src/services/index.ts` (the only related repository reference is a retired comment in an unrelated service, `src/services/products/scheme-import.service.ts:122`); components import `mock-data.ts` directly (`list.tsx:15`, `rule-form.tsx:26-30`, `assignment-preview.tsx:3-9`) rather than through a service-export boundary; and there is no designed fake-data UI indicator — "Lưu mock" (`rule-form.tsx:815`) and "QTV mock" actor labels (`view/history.tsx:22,29`) are inline text, not the convention's required visible indicator. This is the pre-convention pattern the rule's own `## Mock data` section describes as not yet existing in the repository as of 2026-10-29; whether/when to bring this file into conformance (or retire it once a real endpoint lands) is `NEEDS-TEAM-DECISION` (§15).

## 7. Forms and validation

- AntD `rules`-based field validation only; no Zod anywhere in the submodule (`grep` empty) — acceptable under `.claude/rules/05-form.md` for this feature's simple, non-cross-field constraints:
  - Name required, whitespace-only rejected (`rule-form.tsx:672-683`).
  - Priority: numeric, minimum 1 (686-698).
  - Each condition value required (456-463).
- `canViewResult` (302-303) gates the preview action behind `areConditionsComplete` (121-124).
- Dynamic condition rows are keyed by `condition.id`; changing criterion/operator resets the value field (`form.setFieldValue`, 419, 443).
- `readOnly` (view mode) disables all inputs and hides add/save actions (404-507, 682, 700, 728, 747, 813) — create and edit differ from view only by editability and save's navigation target.
- **Debug scaffolding present (flagged per `.claude/rules/00-general.md` `## Comments`, not fixed in this pass):** `console.log` of validation errors (`rule-form.tsx:595`) and of the full save payload (613).

## 8. Types and DTO organization

- Mock-local types (`mock-data.ts`): `GiftRule` (37-47), `GiftCondition` (29-35), `CardGiftAssignment` (22-27), `MockCardProduct` (14-20), `MockLoanProduct` (1-12).
- Rule-form-local types (`rule-form.tsx`): `CatalogItem` (75-80, untyped index signature), `AssignmentResultRow` (81-89), `CriterionOption` (73).
- Other feature-local types: `MockHistory` (`view/history.tsx:10-16`), `CardGiftOfferFilter` (`list/searcher.tsx:9-12`).
- **Ambient global** `src/types/card-gift-offer.d.ts` (ambient, no import/export): `CardGiftOfferLoanProduct` (1-24), `CardGiftLoan` (26-32), `CardGiftOfferProductsResponse` (34-37, uses the global `Pagination` type).
- **`CardGiftLoan` is a separate, unrelated contract from `GiftRule` (CONFIRMED, corrects nothing in the prior draft — this was already correctly stated).** `CardGiftLoan` has no reference anywhere inside `card-gift-offer/`; it is consumed entirely outside this submodule: `src/types/product-list.d.ts:157,427`; `src/components/product-configuration/utils.tsx:112-139` (`normalizeGiftLoanRequest`); `src/components/product-configuration/shared/history/history-comparison.helper.ts:231-363`; `src/modules/products/configuration/credit-card/{create,edit,view}/index.tsx` and `promotion.tsx`; `credit-card/shared/card-gift-offer-fields.tsx:26-29`; and the dead Redux code in `product-list.slice.ts:37-39,248-287`.
- `constants.ts:1-4` declares `CardGiftOfferTabs` as an application `enum` — pre-existing, `LEGACY-COMPATIBILITY`, but conflicts with `.claude/rules/02-typescript.md`'s prohibition on new application enums; not changed in this pass since it predates that rule and is untouched.

## 9. Permissions

Four permission constants, all confirmed by direct read of `src/constants/permission.constant.ts`:

| Constant | Value | Used at |
| --- | --- | --- |
| `CARD_GIFT_OFFER_VIEW` | `product_card_gift:view` (line 165) | list, view routes |
| `CARD_GIFT_OFFER_EDIT` | `product_card_gift:edit` (line 166) | create, edit routes |
| `PRODUCT_VIEW_CREDIT_CARD` | `product:view:credit_card` (line 145) | list, view routes |
| `PRODUCT_EDIT_CREDIT_CARD` | `product:edit:credit_card` (line 149) | create, edit routes |

- **Kind of check (CONFIRMED, per TEMPLATE.md rule 14):** all four route guards are static two-member OR arrays evaluated by `.some(...)` in `src/guards/index.tsx:32` — not a single permission, not a dynamic per-entity resolver.
- **Effective breadth:** because the check is OR, a user holding only the general `PRODUCT_VIEW_CREDIT_CARD`/`PRODUCT_EDIT_CREDIT_CARD` permission (not the feature-specific `CARD_GIFT_OFFER_*` permission) can still reach these routes. `src/constants/permission.constant.ts:164` carries a source comment indicating the product permission is a fallback for the mock stage. Whether this fallback should persist once the feature leaves mock stage is `NEEDS-TEAM-DECISION` (§15).
- **No menu entry exists for this submodule** (corrects the prior draft's claim about a menu/route permission mismatch — there is no menu item to compare against; see §2).
- **No in-component permission checks** (`grep` for `useHasPermission`/`PERMISSIONS`/`WithGuard` inside the submodule returns nothing): the "Tạo mới" (`list.tsx:174-181`), "Chỉnh sửa" (`view/form.tsx:34`), and "Lưu mock" (`rule-form.tsx:814`) actions are visible regardless of the viewer's permissions, relying entirely on the route guard. Runtime behavior of an unauthorized direct action click is `NEEDS-VERIFICATION`.

This module references fewer than ten permission constants and does not reuse one array across route/menu/component layers (there is no menu layer), so the TEMPLATE's named-group table threshold does not apply here.

## 10. Shared and cross-domain dependencies

- **Ordinary shared-primitive reuse:** `@/components/{button,input,select,switch,suffix-input,titles/form.title,forms/form-wrapper,no-data,table-wrapper,titles/table.title,table-link,table-card-status,table-date-time}`, `@/hooks/form.hook`, `@/types/form` (`FormRef`), `@/layouts/form.layout`, `@/utils/navigate`. No concerns.
- **Stale paths corrected (CONFIRMED against current source):** the prior draft of this document referenced `list-product/card-gift-offer-fields.tsx` and `list-product/{card-gift-offer-fields,utils}.tsx`. `src/modules/products/configuration/list-product/` **no longer exists** — `cash-loan/` and `credit-card/` are now top-level siblings directly under `configuration/` (per `docs/reports/2026-11-04/products-docs-reconciliation.md` row 8). The real, current shared gift-field component is `src/modules/products/configuration/credit-card/shared/card-gift-offer-fields.tsx`, imported by `credit-card/create/promotion.tsx:17`, `credit-card/edit/promotion.tsx:33`, and `credit-card/view/promotion.tsx:23`. The payload normalizer for the real (non-mock) gift-loan relationship is `src/components/product-configuration/utils.tsx:112-139` (`normalizeGiftLoanRequest`).
- This submodule does not import any other product sub-module. The only link between this mock prototype and the real, backend-integrated credit-card gift-loan feature is that they share the ambient `CardGiftLoan` name/type by coincidence of domain, not by code dependency (§8) — `GiftRule` (this submodule's mock model) and `CardGiftLoan` (the real feature's contract) are not the same shape and must not be assumed equivalent.

## 11. Consumers

**Direct inbound imports of this submodule's files (CONFIRMED, only importers found):**

- `src/routes/main.routes.tsx:20,150-156`; `src/routes/form.routes.tsx:12-14,170-197`; `src/routes/pages.tsx:20-23` — routing only.

No business module outside `products/configuration/card-gift-offer/` itself imports anything from this submodule. The only cross-domain connection to the rest of the Products module is the shared `CardGiftLoan` ambient type name, which the real credit-card feature consumes independently (§8, §10) — not a code dependency on this submodule.

Internal (within the submodule): `rule-form.tsx` is used by `create/form.tsx`, `edit/form.tsx`, `view/form.tsx`; `view/history.tsx` is used by `edit/form.tsx` and `view/form.tsx`; `list/searcher.tsx` is used by `list/list.tsx`; `mock-data.ts` is used by `list/list.tsx`, `rule-form.tsx`, and `assignment-preview.tsx` (the only importer of `assignment-preview.tsx` is `assignment-preview.tsx` itself — i.e., no importer exists; see §13).

## 12. Pattern classification

- **Target-compatible:** AntD `Form`/`FormInstance` as the sole form-state owner (`rule-form.tsx:301,657-664`); `FormLayout`/`FormRef` shell contract (`create/form.tsx`, `edit/form.tsx`, `view/form.tsx`); lazy route pages behind `WithGuard` → `AuthGuard` → `RouteSuspense` (`pages.tsx:20-23`, `guards/index.tsx:20-24,53-57`).
- **Legacy-compatible, not a defect:** route split across `main.routes.tsx`/`form.routes.tsx` (per `.claude/rules/06-routing-permission.md`); Emotion `css` prop/`@jsxImportSource` styling throughout (`rule-form.tsx`, `list.tsx`, `searcher.tsx`, `history.tsx`); hard-coded Vietnamese strings with no `t()` i18n calls anywhere in the submodule (`grep` for `useTranslation`/`i18n` returns nothing); AntD internal class overrides (`.ant-tabs-*`, `.ant-form-item`, `.ant-space > .ant-space-item`).
- **Not target-compatible, flagged but not fixed (pre-existing, mock-stage):** direct `apiFetcher.get` calls from a component with no service layer (§6); `mock-data.ts` consumed directly by components with no service-export boundary or `USE_MOCK_*` switch, pre-dating `.claude/rules/03-api-service.md` `## Mock data` (adopted 2026-10-21) (§6); the application `enum CardGiftOfferTabs` (`constants.ts:1-4`), pre-dating `.claude/rules/02-typescript.md`'s enum prohibition.
- **Uncertain / mock-stage, no production owner yet:** the module-scope mutable array as the "rule" state owner — there is no server resource for Redux or TanStack Query to adopt yet; which one becomes the owner once a real endpoint ships is `NEEDS-TEAM-DECISION` (§15), not a current violation.

## 13. Technical risks

Ordered by decreasing consequence, each with a short bold category label:

1. **Mistaken-identity edit.** An unknown/invalid `:id` on the edit route renders a blank form (`getMockRule` returns `undefined`, `mock-data.ts:181-183`; `rule-form.tsx:278`) rather than an error state; saving from that blank form via `saveMockRule` (186-187) **prepends a new record** rather than failing, so a bad link silently creates a new rule instead of surfacing a not-found state.
2. **Session-only persistence.** All rule data lives in a module-scope `let mockRules` (`mock-data.ts:124`); a page reload restores the original seed data, silently discarding every change made in that browser session. This is inherent to the mock stage, not a bug to fix without a real backend, but it means any demo/review of this feature must account for state loss on refresh.
3. **Permission fallback broader than the feature's own permission.** The OR-array guard (§9) lets any `PRODUCT_VIEW_CREDIT_CARD`/`PRODUCT_EDIT_CREDIT_CARD` holder reach these routes without the dedicated `CARD_GIFT_OFFER_*` permission. Whether this is the intended mock-stage behavior is `NEEDS-TEAM-DECISION` (§15).
4. **No in-component action gating.** No action button (create, edit/save) checks permissions itself (§9); all gating is route-level only. Clicking an exposed action with insufficient permission has not been runtime-verified.
5. **Possible semantic mismatch in result count.** `appliedProductCount` (`rule-form.tsx:608-609`) is derived from the result-row count (552-583), which is card×loan **pairs**, not necessarily distinct products — `NEEDS-TEAM-DECISION` on intended meaning (§15).
6. **CL (cash-loan) rule path appears unreachable from the UI.** The list page renders only the `CD` tab (`list.tsx:218-222`); the create handler (114) passes no state, so `rule-form.tsx:279-284` always defaults new rules to `'CD'`. Whether `CL` rule authoring is planned but not yet wired, or intentionally out of scope, is `NEEDS-TEAM-DECISION` (§15).
7. **Debug scaffolding left in save path.** `console.log` of validation errors (`rule-form.tsx:595`) and the full save payload (613) — per `.claude/rules/00-general.md` `## Comments`, this should be removed when this code is next substantially touched, but is not fixed in this read-only pass.
8. **Dead code.** `assignment-preview.tsx` has no importer anywhere in `src/` (confirmed by grep). Several `mock-data.ts` exports are reachable only from it (`mockCards`, `mockLoanProducts`, `getAvailableLoanProducts:208-210`, `getCardGiftAssignment:191-199`); `saveCardGiftAssignment` (201-206) has no caller at all. The unrelated Redux thunk `getCardGiftOfferProducts` and its selectors/reset action (`product-list.slice.ts:248-287,857-860,889-891,931`) also have no consumer anywhere in `src/` — recorded here because it shares this submodule's naming, not because this submodule owns it (§5). None of this is removed in this read-only pass; see §15 for the `NEEDS-TEAM-DECISION` on whether to retire it.
9. **Unpinned backend contract.** Tolerant response parsing and an untyped `CatalogItem` (§6) suggest the `products/search`/`document-set` contract used by this feature is not finalized; a shape change on the backend would fail silently rather than surface a type error.

## 14. Areas to avoid touching

- `src/types/card-gift-offer.d.ts`'s `CardGiftLoan` — consumed by the live, backend-integrated credit-card promotion flow (`credit-card/shared/card-gift-offer-fields.tsx` and its three `promotion.tsx` importers) and by `normalizeGiftLoanRequest` (`src/components/product-configuration/utils.tsx:112-139`). This submodule's own `GiftRule` mock model must not be conflated with it.
- `src/modules/products/configuration/credit-card/shared/card-gift-offer-fields.tsx` and its importers — the real feature, out of this submodule's scope.
- `src/redux/slices/product-list.slice.ts` — shared Products-domain state; its dead `getCardGiftOfferProducts` thunk (§13) should not be assumed removable without a separate audit of the whole slice.
- `src/constants/permission.constant.ts` lines 145, 149, 164-166 — shared product permission constants; `CARD_GIFT_OFFER_*` and the `PRODUCT_*_CREDIT_CARD` fallback are both load-bearing for this submodule's routes (§9).
- `src/guards/index.tsx` — shared route-guard infrastructure.
- `src/utils/navigate.ts` — change only the four `ofCardGiftOffer*` builders (145-159), if at all.

## 15. Open questions

1. `NEEDS-VERIFICATION`: does the backend actually expose `products/search` and `document-set` with the shape the tolerant parsers assume? Does `productLineIds` `1`/`2` really map to `CL`/`CD`? (§6, §0)
2. `NEEDS-TEAM-DECISION`: should the `PRODUCT_VIEW_CREDIT_CARD`/`PRODUCT_EDIT_CREDIT_CARD` permission fallback (`permission.constant.ts:164`) persist once this feature leaves the mock stage, or should access be gated solely by `CARD_GIFT_OFFER_*`? (§9, §13)
3. `NEEDS-TEAM-DECISION`: intended meaning of `appliedProductCount` (pairs vs. distinct products), and whether `CL` rule authoring is in scope for the UI. (§13)
4. `NEEDS-VERIFICATION`: whether the absence of any menu entry for this submodule is intentional (URL-only access) or a gap. (§2)
5. `NEEDS-TEAM-DECISION`: when a real backend endpoint lands, which state owner (TanStack Query vs. Redux) and service location (`src/services/products/`, per `.claude/rules/03-api-service.md` `## Service location`) should own gift rules, and when should `mock-data.ts`, its direct-import usage, and the "Lưu mock" label be removed? (§6, §12)
6. `NEEDS-TEAM-DECISION`: should `assignment-preview.tsx`, its mock-data-only exports, and the dead `product-list.slice.ts` card-gift thunk/selectors be removed as unreachable code? (§13) — recorded here, not actioned; removal is a separate task with its own scope.
7. `NEEDS-VERIFICATION`: exact mechanism by which `FormLayout` invokes the embedded `rule-form.tsx`'s `submitForm` handle (`src/layouts/form.layout.tsx` not read in this pass). (§4)
8. `NEEDS-VERIFICATION`: runtime behavior of an unauthorized direct action click, and of a swallowed reference-data load error (`rule-form.tsx:354-355`) — not exercised in this static-source-only pass.

For any future production implementation of this feature, follow `.claude/rules/03-api-service.md` (API/service/mock conventions) and `.claude/rules/06-routing-permission.md` (routing/permission conventions); do not add further direct component-level endpoint calls.
