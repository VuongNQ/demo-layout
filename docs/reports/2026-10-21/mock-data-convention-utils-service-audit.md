# Codebase Analysis: utils/service organization and mock-data convention

Revision `ed18d0c1`, branch `feature/vuongnq/loai-uu-dai_2091`, date 2026-10-21. Static inspection only. Typecheck, lint, build and runtime were not run.

This is a read-only audit; no source files were modified.

## 1. Task Understanding
Audit `src/utils/` and the service layer, then draft a `## Mock data` section for `.claude/rules/03-api-service.md`, grounded in precedent. Three assumptions in the original brief did not hold:
- Claim (a) is refuted: `card-gift-offer` has no service.
- Claim (b) is only partly confirmed: the old mechanism is gone from code but still mentioned in the docs.
- The real precedent is `promotion-type`, and its layout differs from the one described.

## 2. Entry Point
`grep -rli mock src`, `find src -iname "*mock*"`, `src/utils/*`, and all `*.service.ts` files.

## 3-4. Evidence

### Mock precedent (CONFIRMED)
`find src -iname "*mock*"` returns exactly two files:
- `src/modules/products/configuration/card-gift-offer/mock-data.ts`
- `src/modules/products/promotion-management/promotion-type/mock-data.ts`

**(a) REFUTED.** `card-gift-offer/` has no `services/` directory and no `*.service.ts`. It holds `assignment-preview.tsx`, `constants.ts`, `create/`, `edit/`, `list/`, `mock-data.ts`, `rule-form.tsx` and `view/`.
- `mock-data.ts` exports types plus in-memory functions: `getMockRules`, `getMockRule`, `saveMockRule`, `getCardGiftAssignment`, `saveCardGiftAssignment`, `getAvailableLoanProducts` (lines 177-208).
- UI imports it directly: `list/list.tsx:15` and `:110` (`useState(getMockRules())`), `rule-form.tsx:26-30`, `:278`, `:614`, and `assignment-preview.tsx:7-9`.
- The only toggle is a prop, `showMockData = true` (`assignment-preview.tsx:75`), and it gates only the preview.
- `rule-form.tsx:815` labels the save button "Lưu mock".
- `view/history.tsx:18-29` hard-codes `MockHistory` rows with the actor "QTV mock".
- `src/constants/permission.constant.ts:156` has the comment "...fallback trong giai đoạn mock".
- This is page-coupled mock data with no service seam, so it is not a model for the convention.

**Real precedent: `promotion-type`.**
- `promotion-type/mock-data.ts` is at the module root, not in `services/`. It is untracked in git.
  - Lines 8-13: "TEMPORARY… Remove alongside `USE_MOCK_PROMOTION_TYPE_DATA` in services/promotion-type.service.ts".
  - Line 16: `export const mockPromotionTypes: PromotionTypeResponse[]`. It is typed with the real DTO.
- `services/promotion-type.service.ts`:
  - `:1` imports `../mock-data`.
  - `:15` is `const USE_MOCK_PROMOTION_TYPE_DATA = true;`. This is a hard-coded literal, not an env var or runtime flag.
  - `:21` is `MOCK_ACTOR`.
  - `:26` is `let mockPromotionTypes = initialMockPromotionTypes` (mutable module state).
  - `:54-132` are the mock implementations.
  - `:154`, `:175`, `:192` and `:210` are per-function `if (USE_MOCK_…)` branches inside the real functions.
- There is no `services/index.ts`. No file outside the service references the switch.
- Mock and real code share one file, and selection happens inside each function, not at an export boundary.
- A grep for "mock" in the module's components, views, hooks and utils returns nothing, so there is no fake-data indicator.

**(b) PARTLY CONFIRMED.**
- `src/mocks/` does not exist.
- `VITE_MOCK_MODE` and `MOCK_MODE` have zero hits in `src`, `.env*`, `vite.config.*` and `src/vite-env.d.ts`. `ImportMetaEnv` (`vite-env.d.ts:4-17`) has no mock key.
- Stale doc references remain: `.claude/rules/03-api-service.md:12` ("language, mock, and 401 behavior"), `.claude/ARCHITECTURE.md:117`, and `.claude/ARCHITECTURE.md:710` ("mock interception").

**(c) CONFIRMED.** `src/utils/api-service.ts` has no "mock" string. Its interceptors are at `:129` (request) and `:137` (response). Neither mock file touches `ApiFetcher`, and the promotion-type mock branches return before any `apiFetcher` call.

**Production reachability (CONFIRMED statically, bundle output unverified).**
- Promotion-type is wired: lazy page at `src/routes/index.tsx:273`, routes at `:594-617` guarded by `PERMISSIONS.PROMOTION_MANAGEMENT_VIEW`, and a menu entry at `src/helpers/menus.helper.ts:328-335`.
- The switch is a compile-time literal `= true`. In the working tree the mock path is the active path, so if this reached `develop`, production would serve fake data.
- Could not verify that Rolldown removes the dead real-API branch or the mock data. Treat `mock-data.ts` as bundled.
- Card-gift-offer mock code is imported by routed pages (`src/routes/index.tsx:50-53`) and is always on.
- The `react-mockframe` hits (`src/components/iphone-preview`) are a phone-frame UI library. The `dataMockExclude` hits in industry-product are unrelated naming. Neither is a mock mechanism.

### `src/utils/` inventory (CONFIRMED)
Ten `.ts` files. Only `api-error-envelope.helper.ts` has a suffix.

| File | Exports | Category | Notes |
|---|---|---|---|
| `api-error-envelope.helper.ts` | `readApiErrorEnvelope`, `parseApiFieldPath`, `mapApiErrorDetailsToFieldErrors`, types | pure helper | Clean. |
| `api-service.ts` | `ApiFetcher` | HTTP / data access | Imports `@/redux/slices/auth.slice` and `notification.slice` (`:9-11`). The only `axios` import in the repo. |
| `common.ts` | about 50 functions | mixed | Pure helpers, date formatting, DOM/browser (`downloadBlob`, `openNewTab`, `getCssVariableValue`), and domain logic (`parseRelationShip`, `convertIdCardType`, `formatFeeRate`, `ImportFileItems`, `getTextButtonByStatus`). |
| `env-mapper.ts` | `AppEnv`, `appEnvs` | config | |
| `form.ts` | about 20 functions | mixed | Imports `@/modules/products/parameter/fee/options/fee` (`:2`) and `@/redux/store` and `segmentation-customer.slice` (`:157-158`). Mixes form helpers with dispatch-based domain functions (`enrichSegmentWithDetails`, `dataDetermine`). Has a mid-file import. |
| `i18n.ts` | `t`, i18next | config | |
| `local.ts` | `LocalUtils` | browser storage | |
| `navigate.ts` | `PageURLs`, `withPrefix`, `filterMenuByPermissions` | routing | A `namespace` of about 440 lines. Type-only import from a module at `:1`. |
| `status.ts` | `hasMixedStatus` | domain-ish helper | |
| `validator.ts` | `validateEmail` and patterns | pure | |

**Dependency inversion (CONFIRMED against `01-architecture.md`, "Shared code must not import business-module internals").** `form.ts` imports modules and Redux, `api-service.ts` imports Redux slices, and `navigate.ts` has a type-only module import. The original brief named `src/store/**` and `src/services/**`, but those do not exist. The real ones are `src/redux/` and `src/service/` (singular). The same inversion appears in `src/hooks` (`query-state.hook.ts`, `auth.hook.ts`) and `src/components` (`menus.tsx`, `Header.tsx`, `forms/search/*`); not audited in depth.

### Service layer (CONFIRMED)
- There are 11 `*.service.ts` files. Ten are under `src/modules/<domain>/.../services/`: `list-notification`, `cash-loan` and `credit-card` labels, `scheme-sync`, `promotion-type`, `splash-screen`, `theme-lock`, `theme`, `topic`, `version-settings`. One is `src/service/customer-segment.service.ts`, a lone file in a singular, off-pattern directory.
- No `*.service.mock.ts` exists.
- Module-local `services/` is dominant.
- 74 files reference `ApiFetcher` or `apiFetcher`. Most are legacy Redux slices, repositories and components.
- `axios` is imported only inside `ApiFetcher`. Raw `fetch(` appears in `contents/banner` (`edit/general.tsx:389`, `components/ImageCell.tsx:60`, `view/general.tsx:384`, `create/createBanner.tsx:324`). It fetches `imageUrl`, read as a binary asset download rather than an API call (LIKELY, not traced). The `fetch(0)` hits in the product-label repositories are local pagination closures, not HTTP. No service bypasses `ApiFetcher`.
- `src/helpers/` holds `breadcrumbs.helper.ts` and `menus.helper.ts`. `src/utils/` and `src/helpers/` overlap in role, and no rule defines the split.

### Suffix compliance (CONFIRMED counts)

| Suffix | Files |
|---|---|
| `.service.ts` | 11 |
| `.hook.ts` | 16 |
| `.helper.ts` | 17 |
| `.slice.ts` | 40 |
| `.middleware.ts` | 33 |
| `.constant.ts` | 5 |
| `.types.ts` | 6 |
| `.util.ts` | 4 |
| `.type.ts` | 0 |

- `*.type.ts` has zero files; `CLAUDE.md` specifies `*.types.ts`.
- Bare `constant.ts` / `constants.ts` exist in about 38 places, against 5 `*.constant.ts`. Bare `types.ts` is also widespread. These are legacy and consistent within their modules.
- `*.util.ts` appears only in `theme-management` (`gmt7-date.util.ts` and three `theme-lock-*.util.ts`). `02-typescript.md:116-117` allows `*.helper.ts` or `*.util.ts` in `utils/`, but only for the scoped Theme Management modules. The repo-wide list in `CLAUDE.md` has `*.helper.ts` only.
- Promotion-type copies Theme's `utils/` folder but names its files `promotion-type-api.error.ts` and `promotion-type.validation.ts`. These are two further unregistered suffixes, `.error.ts` and `.validation.ts`.

## 5-9. State, API, Form, Routing
Not relevant beyond the above. Promotion-type's `hooks/promotion-type.queries.hook.ts` calls the service through TanStack Query (target-compatible). Hooks and call sites do not know about the mock, and that property should be preserved.

## 10. Dependencies and Consumers
- Promotion-type mock data has one consumer: `promotion-type.service.ts`.
- Card-gift-offer mock data is consumed directly by `list/list.tsx`, `rule-form.tsx` and `assignment-preview.tsx`.
- `utils/common.ts` and `form.ts` have repo-wide fan-out, not enumerated.

## 11. Pattern Classification
- Promotion-type inline mock in the service: `uncertain`. Usable as precedent but has the defects listed in §12.
- Card-gift-offer UI-coupled mock: `legacy-compatible`. Do not copy it.
- Module-local `services/<domain>.service.ts` plus `ApiFetcher`: `target-compatible`.
- `utils` importing modules and Redux: `legacy-compatible`.
- `*.util.ts`: `target-compatible` only inside Theme Management.
- `src/service/` (singular): `legacy-compatible`.

## 12. Risk Classification (Part C verdict)
**Consistent:** `ApiFetcher` is the sole HTTP boundary, service naming `<domain>.service.ts` is respected, and module-local `services/` is dominant.
**Genuinely inconsistent:** the stale "mock" wording in the docs, the promotion-type mock shipping live with no indicator and its inline structure, and the unregistered suffixes.
**Legacy, leave alone:** `utils` importing modules and Redux, the `common.ts` grab-bag, `src/service/`, bare `constant(s).ts`/`types.ts`, and card-gift-offer.

| Issue | Fix risk | Action |
|---|---|---|
| No mock rule, and stale "mock" wording in `03-api-service.md:12`, `ARCHITECTURE.md:117` and `:710` | SAFE (docs only) | Rule change |
| Promotion-type mock live, no indicator, inline in the service, switch not at the export boundary | MODERATE | Cleanup task scoped to that feature |
| `utils/form.ts` and `api-service.ts` import modules and Redux | HIGH-RISK (shared utilities and ApiFetcher) | Leave under LEGACY-COMPATIBILITY. Optionally add one rule line: new `utils` code must not import modules or Redux. |
| `utils/common.ts` grab-bag with domain functions | HIGH-RISK to split | Nothing |
| `src/service/` vs module `services/` | MODERATE | Nothing, or one rule sentence that new services go in `<module>/services/` |
| Suffix drift (`.util`, `.error`, `.validation`, bare `constant(s).ts`/`types.ts`) | SAFE per file, MODERATE as a rename campaign | Rule clarification only, no rename campaign |
| Card-gift-offer UI-level mock | MODERATE | Nothing now. Bring it under the convention when its backend is wired. |
| Banner `fetch(imageUrl)` | SAFE | Nothing |

## 13. Regression Surface
For any future change to the promotion-type mock: list, detail, update and toggle, the invalid-id path, the empty list, the permission-gated route, and keeping real-endpoint DTOs identical. Also confirm no enabled mock switch reaches `develop`.

## 14. Recommended Change Boundary
- Rule-only change now: add `## Mock data` and fix the `ApiFetcher` wording below. Also fix `.claude/ARCHITECTURE.md:117` and `:710`; that file was outside the originally named scope, so confirm before including it.
- Do not touch `ApiFetcher`, `utils/*`, or card-gift-offer.
- Promotion-type needs its own task (see §16).

## 15. Unknowns / Needs Verification
- Whether the built bundle still contains the mock data and dead branches. Needs `npm run build` and inspecting the output (NEEDS-VERIFICATION).
- Whether `mock-data.ts` and the `true` switch were ever committed to `develop`. `mock-data.ts` is untracked, and the service diff was not inspected (NEEDS-VERIFICATION).
- Full consumer sets for `utils/common.ts` and `utils/form.ts`, and the `hooks` and `components` import inversions, were not enumerated.
- The banner `fetch(imageUrl)` targets were not traced.
- Open decisions: the mock filename, the `helpers/` vs `utils/` split, and a possible lint ban on mock imports.

## 16. Handoff and Draft Rule (Part B)
**Filename (NEEDS-TEAM-DECISION).** The only precedent is `mock-data.ts`, and it sits at the module root, not in `services/`. `02-typescript.md` says to keep fixtures with their semantic owners, and `CLAUDE.md` lists no `*.mock.ts` suffix. The candidates are:
- **A:** `services/mock-data.ts`. Keeps the precedent name and moves it beside the service.
- **B:** `services/<domain>.mock.ts`. Consistent with the dotted suffix style of `<domain>.service.ts`.

Recommendation: B, for consistency with the suffix rules — but the repo only evidences A.

```markdown
## Mock data

Mock data is a temporary, feature-local stand-in for an endpoint that the
backend has not shipped. It never changes the transport layer.

- **MUST:** Keep mock data inside the owning module, beside the real service in
  `services/`. Name the file `<domain>.mock.ts` (alternative: `mock-data.ts`;
  `NEEDS-TEAM-DECISION`). Do not create `src/mocks/` or any shared mock folder.
- **MUST:** Type mock data with the same request/response DTOs as the real
  service so typecheck catches drift. Do not duplicate or widen the types.
- **MUST:** Use exactly one switch per feature: a module-local constant
  (for example `USE_MOCK_PROMOTION_TYPE_DATA`) declared in that module's
  `services/index.ts`. Do not use an env var or a runtime flag.
- **MUST:** Select the implementation once, at the service-export boundary in
  `services/index.ts`, so views, hooks, and query definitions import one
  service API and are unchanged. Do not branch inside each service function.
- **MUST:** Keep mock state and logic out of the real service file. The real
  service contains only `ApiFetcher` calls.
- **NEVER:** Patch `ApiFetcher`, its axios interceptors, or `window`. `ApiFetcher`
  remains the only HTTP boundary. Do not add a global mock registry or a
  request-interception layer. Services must not read Redux, auth, or routing.
- **MUST:** Show a visible fake-data indicator in the UI while the switch is on.
- **NEVER:** Merge to `develop` with a mock switch enabled.
- **MUST:** Remove the mock file, the switch, and the indicator in the same task
  that wires the real endpoint.
```

**Corrected wording for `## Transport boundary` (`03-api-service.md:12`):**

> Preserve its base URL, auth/token refresh, language, and 401 behavior. It has no mock behavior; feature-local mock data follows `## Mock data`.

Apply the same removal of "mock" at `ARCHITECTURE.md:117` and `:710`.

**Handoff.** Preserve `ApiFetcher`, the DTOs, routes and hook contracts. Do not rename existing `utils/` files or migrate card-gift-offer. For promotion-type, a separate task would move the mock into `services/`, add `services/index.ts` with the single switch, add a visible indicator, and keep the switch off by default on `develop`.
