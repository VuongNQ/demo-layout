# Frontend Review — Cash-Loan Settings Forms (Surface A: Industry-Product Edit, Surface B: CashLoanQuickEdit)

Branch: `improve/vuongnq/2656_sync-UI-simulator`
Commit reviewed: `21232ce3b4bda75d2e198dd3bcc173c5cd50686a` (2026-11-03 13:30:35 +0700)

**Scope note (important):** `git diff develop...HEAD --stat` for
`src/modules/products/configuration/industry-product` and
`src/modules/products/configuration/cash-loan` returns empty. None of the
files in this review's scope are touched by this branch; the branch's actual
commits (`42f9a7f0`..`21232ce3`) are about the home-page banner/simulation
mock-up ("UI simulator"), an unrelated feature. This report is therefore a
**standalone source-code audit of pre-existing code**, delivered because the
orchestrator requested it against these specific criteria, not a pre-merge
diff review. The `CHANGES REQUIRED` verdict below does **not** block this
branch's actual diff (which contains none of these files); it flags
production risk in code this branch does not change, for separate follow-up.

## 1. Review Summary

Task: Audit two pre-existing cash-loan settings forms against four criteria
(hidden bugs, dependent-field reset, dirty tracking, performance).
Risk: HIGH-RISK (Surface A: Redux-backed legacy form + shared industry slice;
Surface B: TanStack Query feature, MODERATE)
Intended behavior change: None — audit only, no code written.
Contracts expected to remain unchanged: N/A (read-only review).
Files changed by this branch in scope: **none**.
Modules affected (by the audit, not by this branch): `src/modules/products/configuration/industry-product/**`, `src/redux/slices/product-industry.slice.ts`, `src/modules/products/configuration/cash-loan/**`.
Verdict: **CHANGES REQUIRED** (as a standalone audit outcome; not blocking for this branch's diff, since the diff does not touch these files — see Scope note)

## 2. Blocking Findings

### [HIGH] Suspected onValuesChange ↔ Redux re-sync feedback loop on every keystroke

Surface: A

File:
`src/modules/products/configuration/industry-product/edit/general.tsx:43-93`
and `src/modules/products/configuration/industry-product/edit/rule.tsx:125-196`

Problem:
Both `general.tsx` and `rule.tsx` wire the same cycle:
1. `handleValuesChange` (AntD `onValuesChange`) runs on every field edit, computes `dataChange` from the current form values, and dispatches `onChangeDataTempUpdate(dataChange)` (`general.tsx:65`, `rule.tsx:155`).
2. A separate `useEffect` keyed on the Redux-selected draft (`productIndustry` = `watchDataTempUpdate`) calls `form.setFieldsValue(formValues)` whenever that draft object changes (`general.tsx:69-93`, `rule.tsx:159-196`).
3. `onChangeDataTempUpdate` (`src/redux/slices/product-industry.slice.ts:227-238`) always writes a **new object reference** to `state.dataTempUpdate` (`action.payload`), so step 2's selector always sees a changed reference and the effect always re-fires.
4. Ant Design's `Form.setFieldsValue` triggers the form's `onValuesChange` callback (documented AntD behavior, not merely a user-input-only event), which re-enters step 1.

This is a reference-driven circular dependency: user input → dispatch → new
Redux object reference → effect → `setFieldsValue` → `onValuesChange` →
dispatch → new reference → effect → … Each iteration also goes through an
RTK `createAsyncThunk` (`pending`/`fulfilled`), so each loop lap is at least
one microtask, not necessarily a synchronous crash, but it is a sustained
update cycle that keeps re-dispatching and re-applying the entire tab's form
values on every keystroke, independent of whether the user is still typing.

Why it matters:
At minimum this means every keystroke causes a full-form `setFieldsValue`
replay (not just the edited field) for the active tab, which is wasted work
and a correctness risk (see the loading-flicker finding below, which is a
direct consequence of this same cycle). At worst, if nothing in practice
dedupes the chain, this is a runaway update loop. I could not execute this in
a browser to confirm which outcome occurs at runtime; the static evidence is
strong enough that it should not ship/continue unexamined.

Rule / architecture reference:
`.claude/rules/04-state-management.md` "A local editable draft is allowed
only when initialization, reset, commit, and invalidation behavior are
explicit"; `.claude/rules/05-form.md` "MUST preserve dirty user edits" and
general AntD Form ownership — mixing an externally-driven full-form
`setFieldsValue` with the same form's `onValuesChange` handler is exactly the
pattern AntD's own docs warn produces re-entrant `onValuesChange` calls.

Required action (for whoever owns this code next, not this branch):
Break the cycle: either (a) make the `useEffect` only call `setFieldsValue`
when `productIndustry` changes due to a *different* source than the local
form itself (e.g. guard with a ref tracking "last value this component wrote"
and skip re-applying it), or (b) stop treating `dataTempUpdate` as the form's
input signal — derive it only for submission, and let AntD Form remain the
sole source of truth for its own fields. Verify in a browser with React
DevTools Profiler/console logging that typing in a field does not produce a
sustained chain of renders before closing this out.

Scope: Non-blocking for this branch's diff (file untouched); blocking for a
dedicated follow-up task.

### [HIGH] Every form edit flips a page-wide loading spinner via a misused asyncThunk

Surface: A

File:
`src/redux/slices/product-industry.slice.ts:227-238` (`onChangeDataTempUpdate`
thunk), consumed by `general.tsx:65`, `rule.tsx:155`, and rendered via
`src/modules/products/configuration/industry-product/edit/form.tsx:29,87-88`
and `src/layouts/form.layout.tsx:276,333,344` (`<Spin spinning={loading}>`,
and `overflow: hidden` while `loading`).

Problem:
`onChangeDataTempUpdate` is implemented as `create.asyncThunk(async (data) => data, { pending: (state) => { state.loading = true }, fulfilled: (state, action) => { state.dataTempUpdate = action.payload; state.loading = false } })`. It is dispatched on **every** `onValuesChange` in both General and Rule tabs (i.e. every keystroke/select/switch change), and `state.loading` is the exact same flag used for `getIndustryDetail`/`updateIndustry`/`updateIndustryStatus` and read by `FormLayout`'s `loading` prop, which wraps the whole active form in `<Spin spinning={loading}>` and toggles `overflow: hidden` on a global container.

Why it matters:
Because this is an async thunk (even though its payload creator does no I/O),
`pending` fires synchronously on dispatch and `fulfilled` fires on the next
microtask. That means typing a single character briefly sets `loading = true`
(activating the full-form `Spin` overlay and `overflow: hidden`) and then
`false` again, on every keystroke, for the full life of this edit screen.
This is a broad shared loading flag reused for an unrelated purpose, in
direct tension with `.claude/rules/04-state-management.md` ("Do not add
another broad `loading` flag for independent requests... Model list, detail,
and mutation request state separately when they may run concurrently") and
with the one-indicator-per-request loading convention in
`.claude/rules/07-component.md`. It is also compounded by the feedback loop
above: if that loop iterates more than once, this flicker could repeat
several times per keystroke.

Rule / architecture reference:
`.claude/rules/04-state-management.md` (broad loading flag rule);
`.claude/rules/07-component.md` "## Loading and skeleton states".

Required action:
Do not route `onChangeDataTempUpdate` through `loading`. Either make it a
plain synchronous `create.reducer` (it has no async work) or, if it must stay
a thunk, do not toggle the shared `loading` flag for it. Verify in-browser
that the form does not visibly flicker a spinner while typing.

Scope: Non-blocking for this branch's diff (file untouched); blocking for a
dedicated follow-up task given the direct, repeatable UX impact.

## 3. Other Findings

### [MEDIUM] Three of the explicitly in-scope "cash-loan simulation" files are dead code — the loan-limit/maturity/interest-rate UI is unreachable from the edit form

Surface: A

File:
`src/modules/products/configuration/industry-product/edit/general-sections/cash-loan-simulation.tsx` (whole file, `CashLoanSimulationSetting`),
`src/modules/products/configuration/industry-product/edit/cash-loan-simulation/index.tsx` (whole file, `CashLoanSimulation`),
`src/modules/products/configuration/industry-product/edit/cash-loan-simulation/custom.tsx` (whole file, `Custom`),
`src/modules/products/configuration/industry-product/edit/rule-sections/customer-segment.tsx` (whole file, `CustomerSegmentSection`)

Problem:
None of these four components is imported anywhere outside their own
definition file (verified with repo-wide grep for `CashLoanSimulationSetting`,
`CustomerSegmentSection`). The actual rendered tree is:
`edit/general.tsx` → `../general/cash-loan` (`CashLoanGeneral`) /
`../general/credit-card` (`CreditCardGeneral`), neither of which renders any
`simulationType`/`customLimitType`/etc. field
(`src/modules/products/configuration/industry-product/general/cash-loan.tsx:9-26`,
`general/credit-card.tsx`); and `edit/rule.tsx` → `../rule/cash-loan`
(`CashLoanRule`) which renders customer-segment UI from the sibling
`rule/sections/customer-segment-exclude.tsx` (`CustomerSegmentExcludeSetting`),
not from `edit/rule-sections/customer-segment.tsx`.
This is corroborated by `src/modules/products/configuration/industry-product/ultis.tsx:98-116`, whose comment states explicitly: "CL CC2 fields are not mounted. Restore their exact GET detail values after mapping editable General values into the draft" — i.e. the `simulationType`/loan-limit/maturity/interest-rate fields are known-and-intentionally not editable today, and `general.tsx`'s own `handleValuesChange` branch for `'simulationType' in changedValues` (`general.tsx:44-53`) is consequently unreachable dead code in the current tree.

Why it matters:
The orchestrator's task framing ("cash-loan-specific parts of a shared form")
assumed these files are live UI for loan-limit/maturity/interest-rate
settings; they are not reachable today. Any bug-fix work aimed at that UI
would need to target the dead files (making the fix invisible) unless someone
first wires them back into `CashLoanGeneral`/`CreditCardGeneral`, or
confirms the fields are deliberately disabled pending a backend/product
decision. This is a maintainability/orphan-code risk, not a live production
bug, since the code path never executes.

Rule / architecture reference:
`.claude/rules/02-typescript.md` "A type, interface, or constant should be
exported only when a file outside its own module file actually imports it"
— the same spirit applies to whole dead components; `.claude/rules/08-refactoring.md`
scope controls (not asking for cleanup here, only flagging it).

Required action:
NEEDS-TEAM-DECISION: confirm whether CL/CD "custom simulation" limit/maturity/
interest-rate editing is an intentionally paused feature (in which case the
four dead files and the unreachable `general.tsx` branch should be marked
with an explicit `LEGACY-COMPATIBILITY`/paused-feature comment, not silently
left dangling) or whether wiring was accidentally dropped and should be
restored. No action required in this branch.

Scope: Non-blocking (informational/clarifying), not part of this branch.

### [MEDIUM] `updateQuickUpdate` write-endpoint response typed `unknown`

Surface: B

File:
`src/modules/products/configuration/cash-loan/services/cash-loan-product.service.ts:86-91`

```ts
updateQuickUpdate(
  id: number,
  payload: CashLoanQuickUpdateRequest
): Promise<unknown> {
  return window.apiFetcher.put(quickUpdateEndpoint(id), payload);
}
```

Problem:
The PUT response is typed `unknown`, while every other contract in this
service/queryKeys/types set is explicitly typed
(`CashLoanQuickUpdateResponse`, `CashLoanQuickUpdateRequest`,
`CashLoanProductListApiResponse`). `CashLoanQuickEdit.tsx:304-315` works
around this correctly by ignoring the mutation's return value and calling
`quickUpdateQuery.refetch()` for the authoritative typed detail — so the
`unknown` typing causes no runtime bug, but it is an unexplained inconsistency
in an otherwise fully-typed boundary, and nothing stops a future caller from
reading `mutateAsync(...)`'s resolved value as `any`-shaped data.

Why it matters:
`.claude/rules/03-api-service.md` "## Contracts and errors": "Type every
request and successful response with explicit request/response DTOs." If the
PUT genuinely returns the same shape as `CashLoanQuickUpdateResponse` (or a
subset), typing it removes a latent `any`-like boundary; if it returns
something materially different, that should be named instead of erased to
`unknown`.

Rule / architecture reference:
`.claude/rules/03-api-service.md` `## Contracts and errors`;
`.claude/rules/02-typescript.md` "New code" section.

Required action:
Type the PUT response explicitly (e.g. `Promise<CashLoanQuickUpdateResponse>`
or a narrower DTO if the backend only echoes a subset). Low effort, no
behavior change since the caller already ignores the value.

Scope: Non-blocking.

### [LOW] Redundant full-form `setFieldsValue` replay on every keystroke (consequence of the HIGH feedback-loop finding)

Surface: A

File:
`src/modules/products/configuration/industry-product/edit/general.tsx:69-93`,
`src/modules/products/configuration/industry-product/edit/rule.tsx:159-196`

Problem:
Independent of whether the HIGH-severity loop above is a true infinite loop
or self-limiting in practice, each pass re-derives fresh `dayjs(...)` instances
for `startDate`/`endDate` (`general.tsx:86-87`) and re-applies the entire
tab's field set via `form.setFieldsValue`, on every keystroke of any field in
that tab (because the dependency is the whole `productIndustry` object, which
changes on every edit).

Why it matters:
Performance: this is unnecessary work scaling with form size on every
keystroke; for `rule.tsx`'s heavier tab (customer-segment table derivations,
master-data lookups) this compounds with the already-expensive
`fetchAndSetSegments` effect (`rule.tsx:209-359`), which itself re-runs
derived the same way.

Rule / architecture reference:
`.claude/rules/07-component.md` general performance/organization guidance;
criterion 4 in the task brief (performance).

Required action:
Same remediation as the HIGH feedback-loop finding — once the effect no
longer reacts to its own writes, this redundant replay disappears too.

Scope: Non-blocking, bundled with the HIGH finding above.

### [LOW] `rule.tsx` re-runs an expensive segment/master-data derivation pipeline on every change to the excludes selection

Surface: A

File:
`src/modules/products/configuration/industry-product/edit/rule.tsx:209-359`

Problem:
The `fetchAndSetSegments` effect depends on
`formValues?.customerSegmentRuleExcludes` (`rule.tsx:358`), which is a new
array reference on every `onValuesChange` for the excludes `SelectFormCustom`
control. Each run re-maps `customerSegmentMap`, calls `dataDetermine` (an
async dispatch-driven lookup), and re-derives three nested mapped structures
(`customerInformationCriteria`, `determinationCriteria`,
`actionHistoryCriteria`) purely for display logic/table rendering
(`rule.tsx:231-347`), plus dispatches `getMasterDataDetailById` for any master
data type not already cached (`rule.tsx:217-226`).

Why it matters:
This is proportionate to the excludes list size and runs on every selection
change (add/remove one excluded segment), not just on mount; for large
exclude lists this is real work on the UI thread per interaction. It does not
correctness-regress (output is still correct), so this is LOW rather than
MEDIUM/HIGH, but it is a concrete performance review trigger per the task's
criterion 4.

Rule / architecture reference: criterion 4 (performance) in task brief.

Required action: Consider memoizing per-segment derived view data keyed by
segment id instead of recomputing the full array on every change, or debounce
the heavy derivation from the Select's `onChange`. Not required for this
audit to close.

Scope: Non-blocking.

### [INFO] `CashLoanProductListFilter` ambient global type — existing repo-wide convention, not a new violation

Surface: B

File: `src/types/Filter.d.ts:20-31`, consumed by
`src/modules/products/configuration/cash-loan/CashLoanProductList.tsx:109,308`,
`cash-loan/components/CashLoanSearcher.tsx`, `cash-loan/types.ts`.

Problem/observation: This is a business filter type declared in a global
ambient `.d.ts` file, which `.claude/rules/02-typescript.md` generally
discourages for new code ("Do not add business models to global ambient
`.d.ts` files"). However `src/types/Filter.d.ts` already holds ~10+
sibling `*ProductListFilter` types for other product lines
(`CreditCardProductListFilter` immediately follows it), so this is an
established repository-wide convention for list-filter types, not a
new/isolated violation.

Rule / architecture reference: `.claude/rules/02-typescript.md`, legacy-
compatibility carve-out (`.claude/rules/00-general.md`: "existing legacy
issue != reason to block an unrelated task").

Required action: None for this audit. Flag only if a future task adds a new
sibling filter type to this file.

Scope: Non-blocking, informational.

## 4. Architecture Compliance

Surface A: `product-industry.slice.ts` is `LEGACY-COMPATIBILITY` Redux-as-
form-backing, consistent with `.claude/rules/01-architecture.md`
"Compatibility" section — using it is not itself a violation. The specific
problem is not "Redux instead of Query," it is the self-referential wiring
between the draft selector and the form's own `onValuesChange` described
above, which is a correctness/ownership issue independent of the state-owner
choice.

Surface B: `CashLoanQuickEdit.tsx` + `hooks/cashLoanProductQueries.ts` +
`services/cash-loan-product.service.ts` + `queryKeys/cash-loan-product.query-keys.ts`
follow the target architecture well:
route/list → `useCashLoanProductListQuery`/`useCashLoanQuickUpdateQuery`
(feature-owned hooks) → `cashLoanProductService` (feature-local service,
acceptable per `.claude/rules/03-api-service.md` "Service location" — a new
service may stay feature-local when not substantially promoted; this one is
not in `src/services/products/`, which is a `SHOULD`-level deviation from the
2026-10-29 target, not a MUST violation, since migration is incremental and
opportunistic) → `window.apiFetcher`. Query keys use the expected prefix/list/
detail shape (`cashLoanProductQueryKeys.all/lists/list/quickUpdate`). AntD
`Form`/`FormInstance` is the sole form-state owner in `CashLoanQuickEdit`; no
RHF, no competing Redux ownership of the quick-edit form's own fields (Redux
is only used for the shared customer-segment reference list via
`getListSegmentationCustomers`, which is legitimate shared reference data).

## 5. TypeScript & Data Modeling

- Surface B: `updateQuickUpdate`'s `Promise<unknown>` return — see Other
  Findings (MEDIUM).
- Surface B: `CashLoanQuickEditSegmentSource.status?: string` is a loose
  string rather than a narrowed literal union; used only for an `=== 'ACTIVE'`
  comparison (`CashLoanQuickEdit.tsx:68`, `267`), low risk, not flagged as a
  blocking issue.
- Surface A: `RuleFormValues`/`IndustryGeneralFormValues` (not fully read in
  this pass) are consumed with several non-null assertions (`requiredInfo?.id!`
  at `rule.tsx:223`, `action?.action!` at `rule.tsx:787`,
  `option.value===event)?.label!` at `rule.tsx:466`). These are pre-existing
  legacy patterns, not introduced here; flagged as `existing legacy
  compatibility`, not a new violation, per task boundary.
- `handleValuesChange` in `rule.tsx:125` types `(_: any, allValues: RuleFormValues)`
  — the first parameter is untyped `any` for AntD's `changedValues`; this is
  pre-existing legacy code, not newly introduced, so `existing legacy
  compatibility` rather than a new violation.

## 6. API / State / Error Handling

Surface A:
- `updateIndustry`/`updateIndustryStatus` thunks in `product-industry.slice.ts`
  call `apiFetcher.put` directly inside the slice (not a separate service
  file) — `LEGACY-COMPATIBILITY` per `.claude/rules/03-api-service.md`
  "Existing endpoint-heavy slices and direct calls may remain." Not flagged.
- See Blocking Findings for the `loading`-flag misuse on
  `onChangeDataTempUpdate`.

Surface B:
- `CashLoanQuickEdit.tsx:261-302`: before submitting a `SELECTION_CUSTOMER`
  payload, the component re-fetches active segment sources
  (`loadActiveSegments()`) and re-validates that none of the selected ids
  went inactive since the drawer opened, in addition to the Form-level
  validator doing the same check against the (possibly stale) in-memory
  `segmentOptions`. This is a deliberate, well-reasoned extra guard against a
  stale-read race (segment deactivated between drawer-open and submit) — a
  genuine positive finding, see §13.
- Error handling: `catch { setSegmentLoadError(true) }` /
  `catch { dispatch(setNotification(...)) }` swallow the error object
  entirely (no `status`/`code`/`cause` preserved) before showing a generic
  Vietnamese message. This matches `.claude/rules/03-api-service.md`'s allowed
  "do not catch with `any` merely to read a backend message" only in the
  negative direction — here nothing is read from the error at all, so there is
  no `any`-cast violation, but also no diagnostic value is preserved for
  support/debugging. LOW, not blocking: the existing notification pattern is
  one-owner and consistent across this component.
- Cache update after success (`CashLoanProductList.tsx:143-190`) uses
  `queryClient.setQueriesData` against `cashLoanProductQueryKeys.lists()`
  with the authoritative mutation-refetch response, consistent with
  `.claude/rules/03-api-service.md` "SHOULD: After mutation success,
  synchronize only affected cache entries... Use `setQueryData` when the
  response is authoritative." Correct, scoped, no global invalidation.
- Paginated list loading (`CashLoanProductList.tsx:132`): `loading =
  listQuery.isPending || listQuery.isFetching`, with
  `placeholderData: keepPreviousData` set on the query
  (`hooks/cashLoanProductQueries.ts:13-19`). This satisfies the MUST rule
  (derives loading from `isFetching`, not bare `isPending`); `productList`
  stays non-empty during refetch because of `keepPreviousData`, so the
  conditionally-rendered `CustomPagination` (`CashLoanProductList.tsx:656`)
  does not unmount during a page/filter change. No `staleTime` is set on this
  list query — SHOULD-level observation only, not a finding requiring action.

## 7. Forms

Surface A (General/Rule tabs):
- Dependent-field reset on `simulationType` change (`general.tsx:44-53`) is
  currently unreachable — see §3 MEDIUM finding (dead code).
- Rule tab's exclude-set logic (`rule.tsx:125-137`) correctly collapses the
  exclude selection to `[idSegmentationCustomerAll]` when "ALL" is selected
  among excludes — a real, reachable dependent-field normalization, and it
  looks correct.
- No Zod in either tab; acceptable since neither file is newly written or
  substantially changed by this review's triggering task, and AntD rules
  (`required`, `validateMinMax`, `validateNoDuplicates`) are the pre-existing
  validation mechanism (`.claude/rules/05-form.md` "Existing AntD rules and
  custom validators remain valid for untouched legacy forms").
- Dirty-change detection for Surface A is entirely implicit: there is no
  explicit "has this tab changed" signal; `FormLayout`'s step/submit
  orchestration (not reviewed in depth here) presumably decides via its own
  `formData`/`notValidSidebar` mechanism. This audit did not trace that far
  into `form.layout.tsx` beyond the `loading`/`activeForm` wiring already
  covered; a full dirty-tracking audit of `FormLayout` itself is out of this
  task's named scope.

Surface B (`CashLoanQuickEdit`):
- Dependent-field reset on `customerSegmentViewType` change
  (`handleViewTypeChange`, lines 236-249) is correct: uses
  `form.setFieldsValue` (not `resetFields`, which would also wipe `name`),
  clears exactly the two dependent fields' values and their stale validation
  errors via `form.setFields([...])`. This is the right pattern.
- Dirty detection (`getSnapshot`/`areSnapshotsEqual`/`isDirty`, lines 38-57,
  148-161) normalizes trim/case/array-order before comparing, correctly
  ignores the programmatic `setFieldsValue` call that seeds the form from
  query data (because `initialSnapshot` is captured from that same
  `getSnapshot(values)` call at the same time, lines 212-213, so the
  just-loaded state reads as "not dirty"). This correctly avoids a false
  "dirty" flag immediately after load, and `isDirty` gates both the Save
  button (`disabled={... || !isDirty}`, line 474) and the discard-confirm
  modal (`requestClose`, lines 326-350). This is a solid, explicit
  implementation of the `.claude/rules/05-form.md` dirty-tracking intent,
  even though the rule is about query-backed *resets*, not plain dirty
  tracking — it is directly relevant evidence for criterion 3 of the task.
- Query-backed initialization/reset policy (lines 192-214): the effect only
  runs `form.setFieldsValue` once useful data is available
  (`if (!detail || segmentLoading || quickUpdateQuery.isError) return`), and
  nothing else re-triggers a background refetch of `quickUpdateQuery` while
  the user is editing (no polling/`refetchOnWindowFocus` override visible in
  this file; default TanStack Query behavior could still refetch on window
  refocus and would re-run this effect, **re-seeding the form from server
  data over in-progress edits**, since the effect does not check `isDirty`
  before calling `setFieldsValue`). This is a real but narrower risk than
  Surface A's: it only fires if the query refetches while the drawer stays
  open and the browser tab regains focus (the TanStack Query default
  `refetchOnWindowFocus: true` unless overridden globally) — I did not verify
  the app's global `QueryClient` defaults in this pass.

### [MEDIUM] Query-backed reset effect does not check dirty state before re-seeding the form

Surface: B

File: `src/modules/products/configuration/cash-loan/components/CashLoanQuickEdit.tsx:192-214`

Problem:
```ts
useEffect(() => {
  if (!detail || segmentLoading || quickUpdateQuery.isError) return;
  ...
  form.setFieldsValue(values);
  setInitialSnapshot(getSnapshot(values));
}, [detail, form, quickUpdateQuery.isError, segmentLoading]);
```
This effect re-runs whenever `detail` (the query data object) changes
reference — which happens on the initial load and on **any** background
refetch of `quickUpdateQuery` (e.g. default `refetchOnWindowFocus`, or a
manual `refetch()` elsewhere), not only on first mount. It does not check
`isDirty` before calling `form.setFieldsValue`, so a background refetch that
returns a changed `detail` (e.g. another admin updated the product while this
drawer was open) will silently overwrite in-progress, unsaved edits and also
reset `initialSnapshot` to the new server data, masking the fact that the
user's prior edits were just discarded.

Why it matters:
`.claude/rules/05-form.md` "Query-backed edit forms": "**MUST preserve dirty
user edits.** Do not blindly call `reset(query.data)` whenever query data
changes... Choose a feature-appropriate policy... reset only while pristine."
This effect has no such guard. I could not verify at runtime whether this
app's `QueryClient` has `refetchOnWindowFocus` disabled globally (which would
make this theoretical); that configuration was not inspected in this pass.

Rule / architecture reference: `.claude/rules/05-form.md` "## Query-backed
edit forms".

Required action: Verify the global `QueryClient` default for
`refetchOnWindowFocus`/`staleTime`. If a background refetch can occur while
the drawer is open, guard the effect with `if (!isDirty) { ...seed... }` (or
an "initialize once per `record.id`" ref) so a refetch never overwrites
in-progress edits.

Scope: Non-blocking for this branch (file untouched by the diff); should be
fixed before this is treated as hardened production code.

## 8. Routing & Permissions

Not applicable — no routing/permission files are in scope for this audit, and
Surface B's action-column visibility check
(`hasPermission([PERMISSIONS.PRODUCT_EDIT_CASH_LOAN])`,
`CashLoanProductList.tsx:434-445`) is unchanged, pre-existing, and consistent
with the existing permission-constant pattern.

## 9. Scope & Refactoring Discipline

This review made no code changes. The only scope-discipline observation is
the one stated at the top: the files named in this task's scope are not part
of this branch's actual diff, so nothing here blocks `improve/vuongnq/2656_sync-UI-simulator`'s
merge.

## 10. Validation Evidence

- Read every file listed in the task scope for both Surface A and Surface B,
  plus their direct consumers (`CashLoanProductList.tsx`,
  `product-industry.slice.ts`, `rule/cash-loan.tsx`, `general/cash-loan.tsx`,
  `general/credit-card.tsx`, `rule/sections/customer-segment-exclude.tsx`,
  `ultis.tsx`, `form.layout.tsx` loading wiring, `types.ts`, `Filter.d.ts`).
- Ran repo-wide `grep` to confirm the dead-code claim for
  `CashLoanSimulationSetting`/`CashLoanSimulation`/`Custom`/
  `CustomerSegmentSection` (zero importers outside their own file).
- Ran `git log`/`git diff --stat` against `develop` to establish this
  branch's actual change set does not include these files.
- No `npm run typecheck`/`lint`/`build` was run (read-only review, no edits
  made; these commands would not detect any of the findings above, which are
  runtime-behavior and ownership issues, not type or lint errors).

## 11. Validation Gaps

- **Not verified at runtime**: whether the Surface A `onValuesChange`
  ↔ Redux-draft feedback loop actually produces a visible/perceptible render
  storm, a one-off flicker, or no visible symptom at all. This requires
  opening the Edit screen in a browser with React DevTools Profiler or console
  instrumentation on a real `IndustryDetail` record.
- **Not verified**: the app's global `QueryClient` defaults
  (`refetchOnWindowFocus`, `staleTime`) that determine whether Surface B's
  missing dirty-guard (§7 MEDIUM) is reachable in practice.
- **Not verified**: actual backend payload/response shapes for
  `GET /product-lines/{id}`, `PUT /product-lines/{id}`,
  `GET /products/cash-loans/{id}/quick-update`,
  `PUT /products/cash-loans/{id}/quick-update` — all contract assumptions are
  from the TypeScript types in the checkout, not from a live backend or
  recorded fixtures.
- **Not verified**: browser behavior for create/edit/view variants, direct
  URL/refresh, or authorization scenarios for either surface (out of this
  task's four named criteria, and no routing files were in scope).
- **Not verified**: whether `CustomerSegmentExcludeSetting`'s `disabled={readOnly}`
  prop (driven by `RuleReadOnlyContext`, set to `false` in the edit flow)
  correctly round-trips through `SelectFormCustom`'s own internal behavior;
  `SelectFormCustom` itself was not read in this pass.

## 12. Test Debt

No test framework exists in this repository (`.claude/rules/09-testing.md`).
Deterministic cases worth covering if/when this code is next substantially
touched, in priority order:
1. `formatDataIndustryDetail` (`ultis.tsx`) — pure mapper with intricate
   CL/CD branching; high-value target for a future test harness.
2. `getSnapshot`/`areSnapshotsEqual` (`CashLoanQuickEdit.tsx`) — pure, easy to
   test, already well-isolated.
3. `buildRequest` (`CashLoanQuickEdit.tsx`) — payload-shape mapper.
4. `cashLoanProductQueryKeys.list`/`normalizeListParameters` — key-identity
   stability under parameter variations.
5. `cash-loan-product-table.utils.ts` formatters — pure, deterministic.

## 13. Positive Observations

- Surface B's stale-active-segment double-check at submit time
  (`CashLoanQuickEdit.tsx:261-302`) — re-validating against freshly-fetched
  active segments immediately before submit, in addition to the Form-level
  validator — is a genuinely careful race-condition guard that most forms in
  this codebase do not bother with.
- Surface B's dirty-tracking snapshot normalization (trim, case, array sort)
  avoids the common false-positive "dirty" bug caused by whitespace/case/array
  order differences between loaded and current values.
- Surface B's `handleViewTypeChange` dependent-field reset correctly scopes
  `setFieldsValue`/`setFields` to only the two dependent fields rather than
  calling `form.resetFields()`, which would have also cleared the unrelated
  `name` field.
- Surface B's paginated list query correctly implements the
  `placeholderData: keepPreviousData` + `isFetching`-based loading contract
  from `.claude/rules/03-api-service.md`, and its post-mutation cache update
  uses targeted `setQueriesData` rather than a global invalidation.

## 14. Final Required Actions

None required for this branch's actual diff (no in-scope files are changed by
`improve/vuongnq/2656_sync-UI-simulator`). For a dedicated follow-up task on
the audited code itself:

1. Confirm/fix the suspected `onValuesChange` ↔ Redux-draft feedback loop in
   `general.tsx`/`rule.tsx` (Blocking Finding #1) — verify in-browser first.
2. Stop routing `onChangeDataTempUpdate` through the shared `loading` flag
   (Blocking Finding #2).
3. NEEDS-TEAM-DECISION: clarify whether the CL/CD custom-simulation
   limit/maturity/interest-rate UI is intentionally disabled dead code or a
   dropped wiring regression (§3 MEDIUM).
4. Type `updateQuickUpdate`'s response instead of `unknown` (§3 MEDIUM).
5. Verify `QueryClient` refetch defaults and, if needed, add an `isDirty`
   guard to `CashLoanQuickEdit`'s query-backed reset effect (§7 MEDIUM).
