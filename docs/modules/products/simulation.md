# Simulation and Display Order — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

Reconciled against current source in this pass; rewritten to `TEMPLATE.md`'s
16-section structure from the previous free-form document. Scope confirmed
at 42 files (`find src/modules/products/simulation -type f | wc -l`). The
module covers three features: general cash-loan simulation configuration,
card-package generation/listing, and display-order priority/view-more
rules, served by two Redux slices (`simulationSlice`, `cardPackageSlice`)
and `simulation.middleware.ts` — all confirmed still accurate.

**Settled from the prior reconciliation report's open item (row 16):** the
claimed cross-module coupling — "simulation shares product/group catalogs
as reference data; a local target-shape change can affect core product
state" — is **CONFIRMED, and the actual mechanism is more specific than the
old document stated.** The card-package editor dispatches `common.slice.ts`'s
`getListProducts`/`getListProductGroups` thunks (`card-packages/components/card-package-editor.tsx:161-177,221-249`),
which write into **global** `common.slice.ts` state (`state.products`,
`state.productGroups`, their pagination, and loading flags) — not into any
simulation-owned state. Other, unrelated consumers of that same global
state include `products/configuration/group-list-product/*`'s create/edit/view
screens and notification's `list-notification/*/settings/{content-cta,form}.tsx`.
A card-package catalog fetch (using its own filters and an unlimited page
size) can overwrite the global arrays those other screens read, though
whether they visibly notice depends on whether they refetch on their own
mount — `NEEDS-VERIFICATION`.

**Corrections to the previous document, found this pass:**

- **`POST products/card-packages/generate` is dead code.** The thunk
  (`generateCardPackages`, `src/redux/slices/card-package.slice.ts:101-120`)
  and its middleware listeners (`src/redux/middlewares/simulation.middleware.ts:48-71`)
  have no dispatch site anywhere in `src/`. The actual UI path for
  card-package settings is the shared `SIM_CARD` context inside the general
  `PUT products/configs` request (`edit/form.tsx:111-133`), not a dedicated
  generation call. The old document's claim that "generation dispatches
  `POST products/card-packages/generate`" is corrected here.
- **Display-order band limits are split ranges, not a single 50-200 band
  for both fields.** `display-order/validation.ts` (bounds from
  `display-order/constants.ts`'s `DISPLAY_ORDER_LIMITS`): the lower band
  field is constrained to 50-100, the upper band field to 100-200, with an
  additional cross-field rule that the lower value must not exceed the
  upper. The displayed-product-count limit (1-20) is unchanged and
  confirmed accurate.
- **A confirmed cross-permission mismatch on display-order's edit button,
  not in the old document.** `display-order/view/form.tsx`'s `canEdit`
  check is an OR of `[SIMULATION_DISPLAY_ORDER_EDIT,
  SIMULATION_CONFIG_EDIT]`, but the `display-order/edit` route itself
  requires only `SIMULATION_DISPLAY_ORDER_EDIT`. A user holding
  `SIMULATION_CONFIG_EDIT` alone sees the Edit button but is denied the
  route it links to. Recorded in §13, `NEEDS-TEAM-DECISION` in §15.

**Verification-gap limit (top 5; remainder in §15):**

1. Whether the global catalog overwrite from the card-package editor
   (above) is visible to `group-list-product/`'s or notification's screens
   in practice — **NEEDS-VERIFICATION**.
2. Whether `generateCardPackages` is meant to be revived as a real
   generation action, or whether the `SIM_CARD` PUT path is the permanent,
   final contract and the thunk/endpoint should simply be understood as
   historical — **NEEDS-TEAM-DECISION**.
3. The display-order permission cross-check above — **NEEDS-TEAM-DECISION**.
4. Whether `simulation.middleware.ts`'s navigate-to-view-on-rejection
   behavior (fired even on a failed `updateSimulationConfig`, including a
   failed display-order save) silently discards the user's unsaved
   in-progress edits by navigating away from the edit page —
   **NEEDS-VERIFICATION**, runtime-only.
5. Whether the hard-coded catalog filter constants in the card-package
   editor (`productLineCode: 'CD'`, `productLineId: 2`,
   `card-packages/card-package-api.ts:6-19`) are stable, intentional
   business constants or a narrower assumption that should be revisited —
   **NEEDS-VERIFICATION**.

## 1. Responsibility

- **General simulation configuration (cash-loan):** the `GENERAL` context
  (`stepAmount`, `stepEmiAmount`, `autoAddonEmiDiff`), edited via
  `cash-loan/edit/general-info.tsx` and viewed via
  `cash-loan/view/general-info.tsx`.
- **Card packages:** the `SIM_CARD` context (a step amount, scope
  `ALL`/`PRODUCT`/`PRODUCT_GROUP`, and target ids), edited inside the same
  simulation edit page under a tab (`SimulationTabs.CardPackages`), with a
  separate paginated list modal for viewing generated packages. There is no
  standalone "generate" action reachable from the UI — see §0.
- **Display order:** the `SIM_PRIORITY` context (max displayed product
  count plus criteria ordering) and `SIM_VIEW_MORE` context (EMI/FA band
  min/max, a combine operator, and criteria ordering), both saved through
  the same `products/configs` PUT, owned entirely by `display-order/`'s own
  pages (separate routes from general simulation, not a tab within it).

## 2. Entry points and routes

All four routes are declared in `src/routes/form.routes.tsx` (`BasicLayout`);
none is in `src/routes/main.routes.tsx` or the `src/routes/index.tsx` shell.

| Path | Route line | Lazy page (`pages.tsx`) | Permission | Check kind |
| --- | --- | --- | --- | --- |
| `product/simulation/view` | `form.routes.tsx:283-288` | `ViewSimulationConfig` (`:148`) | `SIMULATION_CONFIG_VIEW` | single |
| `product/simulation/edit` | `form.routes.tsx:359-364` | `EditSimulationConfig` (`:149`) | `SIMULATION_CONFIG_EDIT` | single |
| `product/display-order/view` | `form.routes.tsx:365-373` | `ViewDisplayOrderConfig` (`:150`) | `SIMULATION_DISPLAY_ORDER_VIEW` | single |
| `product/display-order/edit` | `form.routes.tsx:375-383` | `EditDisplayOrderConfig` (`:151`) | `SIMULATION_DISPLAY_ORDER_EDIT` | single |

Permission constants (`src/constants/permission.constant.ts:117-122`):
`SIMULATION_CONFIG_VIEW`/`_EDIT` (`product_sim:view`/`edit`),
`SIMULATION_DISPLAY_ORDER_VIEW`/`_EDIT`
(`product_sim_display_order:view`/`edit`) — all confirmed accurate from the
old document.

**Component-level checks:**
- `simulation/view/form.tsx`: `hasPermission([SIMULATION_CONFIG_EDIT])` —
  single.
- `display-order/view/form.tsx`: `hasPermission([SIMULATION_DISPLAY_ORDER_EDIT,
  SIMULATION_CONFIG_EDIT])` — **OR array, confirmed to mismatch the edit
  route's single-permission guard** (§0, §13).
- `edit/form.tsx` and `display-order/edit/form.tsx` have no component-level
  check beyond the route guard.

Menu (`src/helpers/menus.helper.ts:216-225`): `Menu.simulation` →
`PageURLs.ofSimulationConfig()`, single permission `SIMULATION_CONFIG_VIEW`;
`Menu.displayOrder` → `PageURLs.ofDisplayOrderConfig()`, single permission
`SIMULATION_DISPLAY_ORDER_VIEW`. Neither edit route has a menu entry.

**`tab` query parameter, confirmed:** simulation's `simulation-tabs.ts`
(`General`/`CardPackages`, plus `History` in view mode only); display-order's
`display-order/navigation.ts` (`priority`/`more`, plus `history` in view
mode only). `PageURLs` builders at `src/utils/navigate.ts:67-79` each accept
an optional tab and append `?tab=`.

Post-save navigation uses `getViewUrlWithoutId`
(`src/utils/common.ts:196-198`, a string replace of `/edit` → `/view`), not
a `PageURLs` builder — called from `simulation.middleware.ts` on both
fulfilled **and rejected** `updateSimulationConfig` (§13).

## 3. Directory map (42 files)

| File/folder | Responsibility |
| --- | --- |
| `constant.ts` | `enum SimulationTabs` (legacy TS enum, existing code); `combinationConditionOptions` |
| `draft.ts` | `DraftCallbacks` type; cash-loan/card-package dirty snapshots |
| `simulation-loading.ts` | `shouldShowSimulationSkeleton` |
| `simulation-tabs.ts` | Tab type + URL-param helpers (simulation side) |
| `view/form.tsx`, `edit/form.tsx` | General-config page shells |
| `components/simulation-config-editor.tsx` | Tabs container (general/card), dirty/unsaved guard |
| `components/simulation-config-tabs.tsx`, `simulation-config.styles.ts` | Tab nav UI, Emotion styles |
| `cash-loan/components/cash-loan-editor.tsx` | `forwardRef` wrapper selecting view/edit general-info |
| `cash-loan/{view,edit}/general-info.tsx` | Read-only / editable general-config forms |
| `card-packages/card-package-{api,mappers,options,selection}.ts` | Payload builder, API↔form mappers, catalog option mapping, selection helpers |
| `card-packages/constants.ts` | Endpoints, `PACKAGE_PAGE_SIZE`, `DEFAULT_CARD_STEP=1,000,000`, validators, status map |
| `card-packages/types.ts` | `GenerationScope`, `GenerationValues`, `GenerationRequest`, `CardPackage`, `PackagePage` |
| `card-packages/components/card-package-editor.tsx` | Scope/step/target form; dispatches shared product/group catalog thunks (§10) |
| `card-packages/components/card-package-generation-panel.tsx` | Presentational generation panel |
| `card-packages/components/card-package-list-modal.tsx` | Paginated, filterable generated-package list |
| `display-order/constants.ts` | Tab ids, `DISPLAY_ORDER_LIMITS`, messages, band slider marks |
| `display-order/types.ts` | `DisplayOrderConfig`, `PriorityPageConfig`, `ViewMoreConfig`, `SortCriteriaMaster`, `CriteriaOrderRow` |
| `display-order/api-mappers.ts` | API ↔ `DisplayOrderConfig` mappers |
| `display-order/validation.ts` | Pure validators: count/band/criteria rules (§7) |
| `display-order/utils.ts`, `band-range-change.ts`, `navigation.ts` | Row/config helpers, band-slider clamp, tab/URL helpers |
| `display-order/components/display-order-editor.tsx` | Main editor (605 lines): form, draft/baseline refs, dirty sections, load/save/reset/exit |
| `display-order/components/{display-order-tabs,priority-config-panel,more-config-panel,band-range-field,criteria-order-table}.tsx` | Tab nav, section forms, band field, drag-sortable criteria table |
| `display-order/{edit,view}/form.tsx`, `view/history.tsx` | Page shells, display-order history table |
| `history/view/history.tsx`, `history/utils.ts` | General-simulation audit history, field-action converter |

## 4. Main runtime flows

### General config (view/edit)

```text
view/form.tsx -> dispatch(getSimulationConfigs()) -> GET products/configs
  (client-side split by context: GENERAL/SIM_PRIORITY/SIM_VIEW_MORE/SIM_CARD)
edit/form.tsx: submitUpdate (GENERAL) or submitCardPackageUpdate (SIM_CARD)
  -> dispatch(updateSimulationConfig(payload)) -> PUT products/configs
  -> simulation.middleware.ts: notify + navigate to view (fulfilled AND rejected, §13)
```

### Card packages

```text
card-package-editor.tsx mount -> dispatch(getListProducts)/(getListProductGroups)
  [common.slice.ts, writes GLOBAL state.products/productGroups -- see §10]
on change -> dispatch(setUpdatedCardPackage(...))
save (via general edit page, SIM_CARD context) -> same PUT products/configs path above

list modal -> dispatch(getCardPackages(page)) -> GET products/card-packages
  [cardPackageSlice.listRequestId guards against a stale response]

generateCardPackages / POST products/card-packages/generate: DEFINED, UNREACHABLE (§0)
```

### Display order (priority/more tabs)

```text
display-order-editor.tsx loadApiData -> getSimulationConfigs() + getSortCriteria()
  -> map to DisplayOrderConfig, form.setFieldsValue, baselineRef/draftRef (init-once)
handleFinish -> normalizeConfig -> validateDisplayOrderConfig(tab)
  -> mapDisplayOrderToSimulationConfigRequest -> dispatch(updateSimulationConfig).unwrap()
tab change / route exit: dirty-section guard, confirm modal
history: display-order/view/history.tsx -> getDisplayOrderHistoriesAction -> GET products/configs/history
```

No `@tanstack/react-query` or `zod` import exists anywhere in the module
(confirmed by grep) — Redux remains the sole owner for all three features.

## 5. State ownership

**`simulationSlice`** (`src/redux/slices/simulation.slice.ts`): owns
`simulationDetail` (general/priorityPage/viewMore/cardPackage sections),
`updatedInfo` (staged per-section drafts), `sortCriteriaList`, simulation
and display-order histories/pagination, and per-operation statuses.
**Broad `loading` flag, confirmed still present**: set by 4 thunks
(`getSimulationConfigs`, `updateSimulationConfig`, `getSortCriteria`,
`getSimulationHistoriesAction`), consumed by `edit/form.tsx`'s `FormLayout`
loading and `simulation-config-editor.tsx`'s `saving` state. Display-order's
own pages use separate per-status selectors instead
(`watchSimulationDisplayOrderInitialLoading`), so the broad flag does not
reach display-order. `updateSimulationConfig.fulfilled` resets
`simulationConfigsLoaded` to `false` and clears `updatedInfo`, forcing a
reload on next view. A dead selector, `watchSimulationMessage`, reads a
`state.message` field that no reducer in this slice ever sets — recorded
§13, not fixed.

**`cardPackageSlice`** (`src/redux/slices/card-package.slice.ts`): owns the
package list page, `listStatus`/`generationStatus`, and `listRequestId`.
**`listRequestId` staleness guard, confirmed working**: pending writes the
current `requestId`; fulfilled/rejected apply only when it still matches,
so a stale list response is dropped. **Generation has no request-id guard
— but this is moot**, since the generation thunk is unreachable (§0, §13).
`watchCardPackages` returns the entire slice object (not a scoped
selector), a broad-selector pattern noted in §13.

**Dirty-draft-vs-Redux divergence, confirmed in all three features**
(re-verifying the old document's risk, now with concrete sites): cash-loan's
editable form keeps three parallel copies of the draft (AntD form, local
`formValues` state, and Redux `updatedInfo.general`); the card-package
editor stages every change into Redux `updatedInfo.cardPackage` via
`setUpdatedCardPackage` while also keeping a local `baselineRef` for reset,
with no single path clearing both consistently; display-order keeps its
own local `draftRef`/`baselineRef`, treating Redux as an init-once source
only. None of the three is a TanStack Query-backed edit form, so none
benefits from that pattern's reset/refresh guidance — this is purely a
Redux/local-draft duplication risk, inherited as-is (`legacy-compatible`).

## 6. API boundaries

All via the ambient `apiFetcher`; no service layer exists for this module
(API calls are inline in Redux thunks, which is `legacy-compatible` per
`.claude/rules/03-api-service.md` for an existing Redux-owned resource).

| Method | Endpoint | Thunk |
| --- | --- | --- |
| GET | `products/configs` | `getSimulationConfigs` |
| PUT | `products/configs` | `updateSimulationConfig` |
| GET | `products/configs/sort-criteria` | `getSortCriteria` |
| GET | `products/configs/audit` | `getSimulationHistoriesAction` |
| GET | `products/configs/history` | `getDisplayOrderHistoriesAction` |
| GET | `products/card-packages` | `getCardPackages` |
| POST | `products/card-packages/generate` | `generateCardPackages` — **defined, no caller (§0)** |

Response handling is not Zod-validated anywhere (acceptable for stable CRUD
per content rule 5), but one confirmed gap exists independent of that
policy: `getSimulationConfigs`'s thunk calls `configs.find(...)` three times
with no check that the response array exists, so a malformed/empty response
would throw inside the thunk rather than surface as a handled error (§13).

## 7. Forms and validation

No Zod and no React Hook Form anywhere in the module (confirmed by grep);
AntD `Form`/`FormInstance` is the sole form-state owner across all three
features, consistent with the sole-owner policy. `Form.useForm` sites:
`cash-loan/edit/general-info.tsx`, `cash-loan/view/general-info.tsx`,
`card-packages/components/card-package-editor.tsx`,
`display-order/components/display-order-editor.tsx`
(`card-package-generation-panel.tsx` and `band-range-field.tsx` use
`Form.useFormInstance`/`Form.useWatch` against a parent form instead of
owning their own).

**Display-order validation** (`display-order/validation.ts`, bounds from
`display-order/constants.ts`'s `DISPLAY_ORDER_LIMITS`), re-verified and
**corrected from the old document (§0)**:
- Displayed-product count: integer, 1–20.
- Band fields: **split ranges**, not a single shared 50–200 band — the
  lower band field is constrained to 50–100, the upper to 100–200, plus a
  cross-field rule that the lower value must not exceed the upper.
- Criteria rows: at least one row required, each complete (criteria +
  direction), no duplicates, and every criteria value must exist in the
  loaded master-criteria list (a rejection with no field-path attachment,
  flagged §13).

**Cash-loan validation**: required-plus-positive-integer custom validators
on `stepAmount`/`stepEmiAmount`. **Card-package validation**: a positive
integer that is a multiple of 1,000,000 (`DEFAULT_CARD_STEP`), plus a
targets-required-unless-scope-is-ALL guard.

## 8. Types and DTO organization

**Ambient global** (`src/types/simulation.d.ts`, no `export`, shared across
`src/`): `SimulationConfig` (`context: string` — not a narrowed union, so
the four context values GENERAL/SIM_PRIORITY/SIM_VIEW_MORE/SIM_CARD are not
type-checked against each other), `SimulationCriterion`,
`SimulationSettings`, `SimulationConfigRequestType`, `SimulationGeneralInfo`,
plus two types (`SimulationPriorityPageForm`, `CriterionType`) whose current
usage was not independently confirmed — flagged §15, not assumed dead.

**Feature-local types**: `card-packages/types.ts` separates the AntD form
shape (`GenerationValues`, optional fields) from the request shape
(`GenerationRequest`, non-optional), bridged by
`mapApiToGenerationValues`/`mapGenerationValuesToApiSettings`
(`card-package-mappers.ts`) — both confirmed to still exist and do exactly
what the old document described. `display-order/types.ts`'s
`DisplayOrderConfig`/`DisplayOrderFormValues` is the form model, mapped to
`SimulationConfigRequestType` via `display-order/api-mappers.ts`.

This ambient-plus-feature-local mix, along with several `any` assertions
(`simulation.slice.ts`'s `catch (error: any)` and an `as any` cast on a
history response, plus `as SimulationSettings`/`as FormRef['form']` casts
in the edit-page files), is `legacy-compatible` per
`.claude/ARCHITECTURE.md` — present as documented, not newly introduced,
and not itself evidence the overall pattern needs to change.

## 9. Permissions

Four constants total, below the content-rule-9 table threshold:
`SIMULATION_CONFIG_VIEW`/`_EDIT`, `SIMULATION_DISPLAY_ORDER_VIEW`/`_EDIT`
(§2). No card-package-specific permission constant exists; card-package
screens inherit whatever permission gates the general simulation edit page.
The one confirmed cross-check anomaly (display-order's edit-button OR check
vs. its route's single-permission guard) is documented in §2/§13/§15, not
repeated here.

## 10. Shared and cross-domain dependencies

**Confirmed, and more specific than the old document (§0):** the
card-package editor's catalog loading
(`card-packages/components/card-package-editor.tsx:161-177,221-249`)
dispatches `common.slice.ts`'s `getListProducts`/`getListProductGroups`
thunks with its own filters and an unlimited page size, writing directly
into **global** `common.slice.ts` state (`state.products`,
`state.productGroups`, and their pagination/loading flags) — not into any
state this module owns. Other confirmed readers of that same global state:
`products/configuration/group-list-product/*`'s create/edit/view screens,
and notification's `list-notification/*/settings/{content-cta,form}.tsx`.
A card-package-triggered fetch can overwrite what those other screens would
otherwise see, pending whether they independently refetch on their own
mount (`NEEDS-VERIFICATION`, §0 item 1).

**Reverse dependency (Redux importing module internals):**
`simulation.middleware.ts` imports `CARD_PACKAGE_MESSAGES` from
`card-packages/constants.ts`, and `card-package.slice.ts` imports
`toCardPackageGenerationPayload`/types from the module's own
`card-packages/` files — this reverses the local-first direction
`.claude/rules/01-architecture.md` describes, but it is the module's
existing, unmigrated contract, not a new finding to fix here.

**Ambient type impact:** `src/types/simulation.d.ts` is a global ambient
declaration; changing its shape is a repository-wide, `HIGH-RISK` change
per the routing/state rules' general caution, not scoped to this module
alone.

## 11. Consumers

Confirmed via grep: only `src/routes/pages.tsx` (four `lazy()` imports) and
the two Redux files named in §10's reverse-dependency note import anything
from this module. No other file in `src/` imports from
`src/modules/products/simulation/`. (A separate, unrelated
`src/components/simulation/**`/`src/assets/images/simulation/**` tree exists
for a phone-preview/marketing feature — not a consumer of this module, and
not covered by this document.)

## 12. Pattern classification

| Pattern | Classification |
| --- | --- |
| Redux-owned server state (both slices, no service layer) | `legacy-compatible` |
| AntD `Form`/`FormInstance` as sole form-state owner, no Zod/RHF | `target-compatible` |
| `enum SimulationTabs` | `legacy-compatible`, existing code, no-new-enum rule applies to new code only |
| `as const` objects in `display-order/constants.ts` | `target-compatible` |
| Emotion `*.styles.ts` throughout, no SCSS Modules in this module | `legacy-compatible` |
| Lazy routes under `WithGuard`/`AuthGuard` | `target-compatible` |
| Card-package editor writing to global `common.slice.ts` catalog state | confirmed cross-cutting coupling, `legacy-compatible`, not a new violation |
| Redux (middleware/slice) importing module-internal constants/types | reverses local-first direction, `legacy-compatible`, existing contract |

## 13. Technical risks

Ordered by decreasing consequence, per content rule 8.

- **Navigate-away-on-failure may discard unsaved edits.**
  `simulation.middleware.ts` navigates to the view route on **both**
  fulfilled and rejected `updateSimulationConfig` — including a failed
  display-order save, whose in-page `screenState='error'` handling would be
  immediately superseded by the navigation. `NEEDS-VERIFICATION` at
  runtime (§0 item 4).
- **Shared global catalog state overwritten by card-package fetches.** §10
  — a card-package catalog read can silently affect what
  `group-list-product/` or notification screens see, depending on their own
  refetch behavior.
- **Cross-permission mismatch on display-order's edit button.** §0/§2/§9 —
  a user with only `SIMULATION_CONFIG_EDIT` sees an Edit button that leads
  to an unauthorized route.
- **Unguarded array access in `getSimulationConfigs`.** Three `configs.find(...)`
  calls assume the response is an array with no defensive check; a
  malformed or empty response throws inside the thunk rather than
  surfacing as a handled error state.
- **Dead code.** `generateCardPackages` and its middleware listeners (§0);
  `watchSimulationMessage` reads a slice field no reducer ever sets.
- **Three divergent draft copies per feature.** §5 — cash-loan, card
  packages, and display order each maintain their own local-draft-vs-Redux
  duplication with no single consistent reset/clear path, inherited as-is.
- **Broad selector.** `watchCardPackages` returns the entire
  `cardPackageSlice` object rather than a scoped slice, causing broader
  re-renders than necessary.
- **Shared `loading` flag spans unrelated operations** in `simulationSlice`
  (general config load/save, sort-criteria load, and simulation-history
  load all toggle the same flag) — display-order avoids this via its own
  per-status selectors, but the general-config edit page does not.
- **Hard-coded catalog filter constants.** `productLineCode: 'CD'`,
  `productLineId: 2` in the card-package editor's target queries —
  intentional stable business values or a narrower assumption,
  `NEEDS-VERIFICATION` (§0 item 5).
- **Criteria-rejection issue has no field path.** `validateDisplayOrderConfig`
  can emit a rejection for an unknown criteria value with no `name` to
  attach it to a specific form field.

## 14. Areas to avoid touching

- Do not revive or remove `generateCardPackages`/`CARD_PACKAGE_GENERATE_ENDPOINT`
  as an incidental cleanup without a team decision on whether a standalone
  generation action is still wanted — the current UI contract is entirely
  the `SIM_CARD` PUT path, and removing the dead thunk could foreclose a
  planned feature, while reviving it without a decision could introduce a
  second, redundant write path.
- Do not change the card-package editor's catalog-loading calls
  (`getListProducts`/`getListProductGroups`) without first checking every
  consumer of `common.slice.ts`'s global `products`/`productGroups` state
  (§10) — this module does not own that state, but it does write to it.
- Do not resolve the display-order permission cross-check (§0/§13) without
  a team decision — correcting it in either direction changes observable
  access behavior.
- Do not change `simulation.middleware.ts`'s navigate-on-rejection behavior
  as part of an unrelated fix; confirming its actual user-facing effect on
  display-order's error state needs its own runtime-verified task.
- Do not touch `src/types/simulation.d.ts`'s shape without a full
  repository-wide consumer audit — it is an unimported ambient global.

## 15. Open questions

- The five verification gaps in §0.
- Whether `SimulationPriorityPageForm` and `CriterionType`
  (`src/types/simulation.d.ts`) have any live consumer, or are themselves
  dead ambient declarations.
- Whether the display-order criteria-rejection's missing field path (§13)
  is acceptable as a form-level-only error display, or should be mapped to
  a specific row.
- Whether a dedicated permission constant should exist for card-package
  actions instead of inheriting the general simulation edit permission.
