# Product Line Hidden Fields Impact Analysis

## 1. Executive Summary

- Risk: **HIGH-RISK**
- Can FE implementation be finalized from repository evidence alone? **No.**
  Hiding fields while preserving their fetched values can be designed safely,
  but clearing persisted values cannot be finalized without explicit backend
  and BA decisions. Cash Loan simulation and customer-segment changes also
  require Mobile/Cham Vay confirmation.
- Main blockers:
  - The requirement does not specify which individual fields must be preserved
    versus cleared.
  - Both Edit tabs submit the entire `IndustryDetail` object through
    `PUT product-lines/:id`.
  - Removing controls changes `form.getFieldsValue()` and can produce `null`,
    `false`, `''`, `[]`, `{}`, or omitted JSON properties.
  - Frontend optional types do not prove that the backend accepts `null`.
  - Product Line customer-segment rules are inherited by Product Group
    workflows.
  - No Product Line fixtures or environment data establish current DEV/UAT/STG
    values.
  - `.agents/` and `.github/documents/`, referenced by `CLAUDE.md`, are absent
    from this checkout.

## 2. Scope Matrix

| Product Line | Tab | UI Field | Form Fields | Payload Fields | Current Required? | Requested Result | Evidence Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CL/CD | General | Display Schedule | `isSchedule`, `startDate`, `endDate` | Same | `startDate` required only when `isSchedule` is truthy; end date optional | Hide; clear/preserve choice unspecified | High for FE, low for backend semantics |
| CL/CD | General | Image | `image`, hidden `keyImage` | `image`, `keyImage` | No actual Ant Form required rule; only label contains `*` | Hide; clear/preserve choice unspecified | High |
| CL/CD | General | Signing Method | `signingMethod` | Comma-separated `signingMethod` | Yes | Hide and remove validation; clear/preserve unspecified | High |
| CL | General | Cash Loan Simulation | `simulationType`, `simulationRefId`, custom simulation fields | `cashLoanSimulation.*` | `simulationType` required; multiple CUSTOM fields conditionally required | Hide and remove validation; clear/preserve unspecified | High for FE, Mobile/BE confirmation required |
| CL | Rule | Bank-account validation | `hasValidateFiAccount` | `hasValidateFiAccount` | No | Hide; clear/preserve unspecified | High |
| CL | Rule | Disbursement priority | `priorityDisbursement` | `priorityDisbursement` | No | Business scope unclear; listed persisted property but not explicitly listed as a UI field to hide | High for FE |
| CL/CD | Rule | Face blacklist | `isEnableFaceCheck` | Encoded as a `BY_CUSTOMER_BLACKLIST` object in `customerSegmentRule.excludes` | No | Hide; clear/preserve unspecified | High for FE, BA confirmation required |
| CL/CD | Rule | Customer Segment View | `customerSegmentViewType`, `customerSegmentViewCode`, `customerSegmentRuleViews` | `customerSegmentRule.customerSegmentViewType`, `customerSegmentViewCode`, `views` | No Ant Form required rules | Hide; may become ALL | High for mapping, low for ALL semantics |
| CL/CD | Rule | Customer Segment Apply | `customerSegmentRuleApplies` | `customerSegmentRule.applies`; may also populate `views` | No Ant Form required rules | Hide; may become ALL | High for mapping, low for ALL semantics |
| CL/CD | Rule | Customer Segment Exclude | `customerSegmentRuleExcludes`, `isEnableFaceCheck` | `customerSegmentRule.excludes` | No Ant Form required rules | Not explicitly requested to hide, but coupled to blacklist and ALL behavior | High for mapping, BA confirmation required |

## 3. Field-by-Field Analysis

### Display Schedule

- CL/CD: Rendered identically for CL and CD.
- Detail component:
  `src/modules/products/configuration/industry-product/view/general.tsx`,
  including disabled `isSchedule`, `startDate`, and `endDate`.
- Edit component:
  `src/modules/products/configuration/industry-product/edit/general.tsx`.
- Form fields: `isSchedule`, `startDate`, `endDate`.
- Validation:
  - `startDate` has `required: formValues?.isSchedule`.
  - `endDate` is not required.
  - Date pickers constrain start/end against each other.
  - Removing all three `Form.Item` controls removes their Ant Form registration
    and validation.
  - `FormLayout` validates only the currently mounted tab through
    `validateFields()`.
- Initialization:
  - Direct fields from `GET product-lines/:id`.
  - `startDate`/`endDate` become Dayjs or `null`; `isSchedule` is copied
    directly.
  - Initialized through `form.setFieldsValue`.
- Mapper:
  - `isSchedule` is copied directly.
  - Dates are formatted when truthy and explicitly become `null` otherwise.
- Final PUT payload:
  - With controls present: boolean plus formatted strings or `null`.
  - If removed without mapper protection: `isSchedule` becomes `undefined` and
    is normally omitted by JSON serialization; both dates become explicit
    `null`.
- External consumers:
  - Exact Product Line `isSchedule` exists only in this feature and its ambient
    type.
  - `startDate`/`endDate` names occur broadly in products, banners, T&C, and
    contracts, but those are unrelated DTO properties.
- Safe to hide UI only?: Yes, only if the mapper explicitly preserves all three
  fetched values.
- Safe to clear value?: Not proven. The frontend emits `null` for dates today,
  but there is no source evidence that clearing `isSchedule` or existing
  schedules is backend-safe.
- Unknowns: Whether schedule controls Product Line visibility in Mobile/Cham
  Vay.

### Image / keyImage

- CL/CD: Same UI for both.
- Detail component: `image` upload preview in
  `src/modules/products/configuration/industry-product/view/general.tsx`.
  `keyImage` is not displayed.
- Edit component: `image` upload plus hidden `keyImage` `Form.Item` in
  `src/modules/products/configuration/industry-product/edit/general.tsx`.
- Form fields: `image`, `keyImage`.
- Validation:
  - Neither `Form.Item` has `rules`.
  - `UploadFileComp` performs an optional file-size check but no required-value
    validation.
  - The `*` in `Hình ảnh sản phẩm*` is presentation only.
- Initialization:
  - Both values come from `IndustryDetail`.
  - `null`/`undefined` is normalized to `''` in Edit.
  - View normalizes `image` to `''`.
- Mapper: Copies both fields directly.
- Final PUT payload:
  - Current empty UI values become `''`.
  - If the controls are removed, the mapper writes `undefined` over the fetched
    values; these properties are then likely omitted during JSON serialization
    rather than preserved or explicitly cleared.
  - Source does not prove omitted-property PUT semantics.
- External consumers:
  - `keyImage` is Product Line-only.
  - Generic `image` appears elsewhere but not as a consumer of this Product Line
    field.
  - The import preview uses different names such as `productLineImage`.
- Safe to hide UI only?: Yes, with explicit preservation in the mapper.
- Safe to clear value?: No repository evidence proves backend acceptance of
  `null`, `''`, or omission as the intended clearing mechanism.
- Unknowns: Whether `image`/`keyImage` is rendered by a separate Mobile
  application or consumed only by backend/mobile APIs.

### Signing Method

- CL/CD: Same UI for both.
- Detail component:
  `src/modules/products/configuration/industry-product/view/general.tsx`.
- Edit component:
  `src/modules/products/configuration/industry-product/edit/general.tsx`.
- Form fields: `signingMethod`, represented as a multiple-select array.
- Validation:
  - Explicit `required: true` on Edit.
  - Removing the `Form.Item` removes that validation.
  - If General is active, `FormLayout` currently validates it before PUT.
- Initialization:
  - API comma-separated string is split into an array by
    `formatFormValueToOption`.
  - Missing/falsy input becomes `[]`.
- Mapper:
  - `formatOptionToFormValue` joins selected values with commas.
  - Missing/undefined options produce explicit `null`.
- Final PUT payload:
  - Current examples: `ONLINE`, `OFFLINE`, or `ONLINE,OFFLINE`.
  - After naive control removal: explicit `signingMethod: null`.
- External consumers: No Product Line consumer outside this module and ambient
  type was found.
- Safe to hide UI only?: Yes, with explicit preservation.
- Safe to clear value?: Requires backend and BA confirmation. Frontend utility
  can generate `null`, but that does not prove `PUT product-lines/:id` accepts
  it.
- Unknowns: Whether contract-signing behavior in downstream applications
  depends on it.

### Cash Loan Simulation

- CL/CD: Rendered only when `productIndustry.code === 'CL'`. CD has no
  simulation controls, but the current General mapper still constructs a
  `cashLoanSimulation` object for CD.
- Detail component:
  `src/modules/products/configuration/industry-product/view/general.tsx`.
- Edit component:
  `src/modules/products/configuration/industry-product/edit/general.tsx`.
- Form fields:
  - `simulationType`, `simulationRefId`.
  - `customLimitType`, `customFixedAmount`, min/max limit.
  - `customTimeToMaturityType`, duration/step/min/max/multiple values.
  - `interestRateUnitType`, `interestRateDecliningBalance`.
- Validation:
  - `simulationType` is required.
  - `simulationRefId` is not required for PRODUCT or PRODUCT_GROUP.
  - CUSTOM fields have conditional required, range, min/max, and no-duplicates
    rules in
    `src/components/forms/industry-product/cash-loan-simulation/custom.tsx`.
  - Removing the complete block removes these registered validations.
- Initialization:
  - Nested `cashLoanSimulation` is flattened into General form values.
  - `customMultipleValue` is converted to form options only in View; Edit
    spreads the server value directly.
- Mapper:
  - Always reconstructs `cashLoanSimulation` from flat form fields, regardless
    of CL/CD.
- Final PUT payload:
  - With controls: nested simulation object.
  - If controls are removed without changing the mapper:
    `cashLoanSimulation` becomes an object whose properties are all
    `undefined`; serialized JSON is effectively `{}`.
  - This overwrites the fetched nested object before PUT.
- External consumers:
  - Exact property names are limited to the Product Line module, shared Product
    Line simulation form, and ambient type.
  - The newer `products/configs` Simulation module uses separate DTOs and
    endpoints.
- Safe to hide UI only?: Yes, only with explicit preservation of the fetched
  nested object.
- Safe to clear value?: No. Backend nullability and Mobile/Cham Vay behavior
  are unproven.
- Unknowns: Whether this object selects or configures the loan simulation
  presented by Mobile/Cham Vay.

### Bank Account Validation Toggle

- CL/CD: CL only; the entire disbursement-account section is conditional on
  `code === 'CL'`.
- Detail component:
  `src/modules/products/configuration/industry-product/view/rule.tsx`.
- Edit component:
  `src/modules/products/configuration/industry-product/edit/rule.tsx`.
- Form fields: `hasValidateFiAccount`.
- Validation: No rules.
- Initialization: Directly copied from top-level `IndustryDetail`.
- Mapper: `hasValidateFiAccount: hasValidateFiAccount ?? false`.
- Final PUT payload:
  - With control: current boolean.
  - If hidden by deleting the field: any subsequent Rule change writes `false`.
- External consumers: No exact Product Line property consumer outside this
  module/type.
- Safe to hide UI only?: Yes, with explicit preservation.
- Safe to clear value?: “Clear” needs definition. Current mapper fallback is
  boolean `false`, not `null`; business impact requires confirmation.
- Unknowns: Whether disabling validation changes disbursement eligibility
  downstream.

### Priority Disbursement

- CL/CD: CL only and displayed alongside bank validation.
- Detail component:
  `src/modules/products/configuration/industry-product/view/rule.tsx`.
- Edit component:
  `src/modules/products/configuration/industry-product/edit/rule.tsx`.
- Form fields: `priorityDisbursement`.
- Validation: No rules.
- Initialization: Direct top-level Product Line value.
- Mapper:
  - General edit preserves it but converts missing value to `''`.
  - Rule edit copies the form value for CL.
- Final PUT payload:
  - If the field is removed from Rule without protection, a Rule edit
    overwrites it with `undefined`, normally omitting it from JSON.
- External consumers: No exact Product Line consumer outside the module/type.
- Safe to hide UI only?: Yes, with explicit preservation.
- Safe to clear value?: Requires BA/backend confirmation because allowed values
  are `HDBANK`, `VIKKI`, and `OTHER`.
- Unknowns: Whether it is intended to remain visible when only the validation
  toggle is removed.

### Face Blacklist Toggle

- CL/CD: Shown for both.
- Detail component:
  `src/modules/products/configuration/industry-product/view/rule.tsx`.
- Edit component:
  `src/modules/products/configuration/industry-product/edit/rule.tsx`.
- Form fields: UI-only `isEnableFaceCheck`.
- Validation: No rules.
- Initialization:
  - Finds the segment whose `customerSegmentType` is
    `BY_CUSTOMER_BLACKLIST`.
  - Removes that ID from visible View/Apply/Exclude selectors.
  - Sets the toggle from whether the blacklist segment is present in
    `excludes`.
- Mapper:
  - If the toggle is true, adds the blacklist segment to `excludes`.
  - Otherwise it is absent.
- Final PUT payload:
  - No named `isEnableFaceCheck` property.
  - Naively removing the toggle causes the blacklist segment to be removed on
    the next Rule mapping because it was also filtered out of
    `customerSegmentRuleExcludes`.
- External consumers:
  - Group and Product mappers use the same encoding pattern for their own DTOs.
  - User segmentation defines `BY_CUSTOMER_BLACKLIST`.
- Safe to hide UI only?: Yes, but only if blacklist membership is explicitly
  preserved separately from visible excludes.
- Safe to clear value?: Requires BA confirmation. Clearing means removing a
  special segment object from `excludes`, which can alter eligibility.
- Unknowns: Whether blacklist exclusion is enforced by Product Line, inherited
  downstream, or recomputed by backend services.

### Customer Segment View / Apply / Exclude

- CL/CD: Same Product Line UI for both.
- Detail component:
  `src/modules/products/configuration/industry-product/view/rule.tsx`.
- Edit component:
  `src/modules/products/configuration/industry-product/edit/rule.tsx`.
- Form fields:
  - View: `customerSegmentViewType`, `customerSegmentViewCode`,
    `customerSegmentRuleViews`.
  - Apply: `customerSegmentRuleApplies`.
  - Exclude: `customerSegmentRuleExcludes`.
- Validation:
  - No required rules are supplied.
  - `SelectFormCustom` supports rules but none are passed here.
  - Selection handling forces an ALL ID to be the sole selected item.
- Initialization:
  - `customerSegmentRule.views/applies/excludes` objects become ID arrays.
  - Blacklist is removed from those arrays and represented by
    `isEnableFaceCheck`.
- Mapper:
  - IDs are resolved back to complete segment objects.
  - `SIMILAR_APPLICABLE_CUSTOMER_SEGMENT` sets `views = applies`.
  - Otherwise `views` comes from `customerSegmentRuleViews`.
  - Missing code becomes `''`.
- Final PUT payload:
  - Naive removal causes `views`, `applies`, and `excludes` to become `[]`.
  - View type becomes omitted.
  - View code becomes `''`.
  - Blacklist is also removed unless separately preserved.
- External consumers:
  - Product Group Create/Edit fetch Product Line detail from
    `product-lines/:id/assignable?context=PRODUCT&action=CREATE`.
  - When “Thừa kế từ ngành hàng” is enabled,
    `mapCustomerSegmentByIndustry` copies Product Line View/Apply/Exclude,
    type, and code into Product Group state.
  - Product and Product Group modules use similarly named segment contracts for
    their own payloads.
- Safe to hide UI only?: Yes, only with whole-rule preservation.
- Safe to clear value?: No, not without BA/backend confirmation.
- Unknowns: Exact semantics of ALL; whether View, Apply, and Exclude should all
  become ALL; what happens to blacklist; and how existing inheriting Product
  Groups behave.

## 4. Whole-Object PUT Risk

The actual lifecycle is:

```text
GET product-lines/:id
  → industryDetail
  → dataTempUpdate = industryDetail
  → active form setFieldsValue(...)
  → onValuesChange
  → form.getFieldsValue()
  → formatDataIndustryDetail(dataTempUpdate, values, tab)
  → dataTempUpdate replaced
  → PUT product-lines/:id with dataTempUpdate
```

Evidence:

- Initialization:
  `src/modules/products/configuration/industry-product/edit/form.tsx`
- General mapping on every change:
  `src/modules/products/configuration/industry-product/edit/general.tsx`
- Rule mapping on every change:
  `src/modules/products/configuration/industry-product/edit/rule.tsx`
- PUT body: `src/redux/slices/product-industry.slice.ts`

Accidental-change scenarios:

1. Removing schedule controls makes an unrelated General change set both dates
   to `null`.
2. Removing Signing Method makes an unrelated General change produce
   `signingMethod: null`.
3. Removing simulation controls makes an unrelated General change replace
   `cashLoanSimulation` with `{}`.
4. Removing image controls overwrites draft fields with `undefined`; serialized
   PUT omission semantics are unknown.
5. Removing bank validation makes an unrelated Rule change set
   `hasValidateFiAccount` to `false`.
6. Removing segment controls makes an unrelated Rule change send empty
   View/Apply/Exclude arrays, empty View code, and no View type.
7. Removing only the face-blacklist toggle removes the blacklist object on the
   next Rule mapping.
8. Removing `priorityDisbursement` from Rule causes Rule mapping to overwrite it
   with `undefined`.
9. General mapping runs for CD too and constructs `cashLoanSimulation`, even
   though CD has no simulation UI.
10. `Number(undefined)` is used for several unrelated numeric Rule/General
    properties. In memory this becomes `NaN`; JSON serialization normally turns
    `NaN` into `null`, so hidden-field changes must not expand this existing
    risk.
11. Only the active tab is mounted and validated. Confirming from General does
    not validate Rule, and confirming from Rule does not validate General.
12. A status activate/deactivate action sends the fetched whole object directly.
    It does not run either mapper, but any backend migration changing the GET
    shape could affect that PUT path.

General changes otherwise preserve current Rule state through object spreading.
Rule changes otherwise preserve current General state. That preservation is
defeated where the active mapper explicitly reconstructs or defaults hidden
properties.

## 5. Customer Segment / Blacklist Semantics

- View:
  - `customerSegmentViewType = TYPING_CODE`: UI shows
    `customerSegmentViewCode`.
  - `SELECTION_CUSTOMER`: UI shows selected `customerSegmentRuleViews`.
  - `SIMILAR_APPLICABLE_CUSTOMER_SEGMENT`: no separate View selection; mapper
    sets `views = applies`.
- Apply:
  - `customerSegmentRuleApplies` IDs map to complete segment objects in
    `customerSegmentRule.applies`.
- Exclude:
  - `customerSegmentRuleExcludes` IDs map to complete segment objects.
  - Blacklist is injected separately when `isEnableFaceCheck` is true.
- ALL:
  - Not a dedicated Product Line constant.
  - The UI finds a fetched segment whose display `name` is exactly `ALL`.
  - If selected, the array is reduced to only that segment ID.
  - The mapper sends the complete ALL segment object in the relevant array.
  - The frontend does not interpret ALL beyond exclusive selection.
  - Meaning is **NEEDS-BE/BA-CONFIRMATION**.
- Blacklist:
  - Canonical segment type string is `BY_CUSTOMER_BLACKLIST`.
  - Stored as an object in `customerSegmentRule.excludes`.
  - Hidden from the normal selectors and projected into `isEnableFaceCheck`.
- `customerSegmentRule.views`:
  - Selected View segment objects, or exact Apply objects under
    `SIMILAR_APPLICABLE_CUSTOMER_SEGMENT`.
- `customerSegmentRule.applies`:
  - Selected Apply segment objects.
- `customerSegmentRule.excludes`:
  - Selected Exclude objects plus blacklist when enabled.
- `customerSegmentViewType`:
  - One of `TYPING_CODE`, `SIMILAR_APPLICABLE_CUSTOMER_SEGMENT`, or
    `SELECTION_CUSTOMER`.
- `customerSegmentViewCode`:
  - Free-text code for `TYPING_CODE`; mapper sends `''` when absent.

The source does not establish whether “customer segment becomes ALL” means:

- View only;
- Apply only;
- both View and Apply;
- Exclude as well;
- a specific View type;
- retaining or removing blacklist.

## 6. Repository-Wide Consumer Impact

| Property | Consumer | Read/Write | Module | Impact if null/changed |
| --- | --- | --- | --- | --- |
| `isSchedule` | General View/Edit/mapper | Read/write/validation/presentation | Industry Product | Controls date UI and PUT value |
| `startDate`, `endDate` | General View/Edit/mapper | Read/write/validation/presentation | Industry Product | Hidden controls can map both to `null` |
| `startDate`, `endDate` | Product, Product Group, Add-on, Banner, T&C, Contract Template, Popular Loans | Unrelated same-name usage | Other modules | Different DTOs; not Product Line consumers |
| `image` | General View/Edit/mapper | Read/write/presentation | Industry Product | Omission/empty/null semantics unknown |
| `image` | Banner, order identification, segmentation upload, etc. | Unrelated same-name usage | Other modules | Not the Product Line property |
| `keyImage` | General Edit/mapper/type | Read/write | Industry Product | Upload storage key can be omitted accidentally |
| `signingMethod` | General View/Edit/mapper/type | Read/write/validation/presentation | Industry Product | Naive hiding generates `null` |
| `cashLoanSimulation` | General View/Edit/mapper/shared form/type | Read/write/validation/presentation | Industry Product | Naive hiding replaces value with `{}` |
| `simulationType` | General View/Edit/mapper/custom renderer | Read/write/validation | Industry Product | Determines SELF/PRODUCT_GROUP/PRODUCT/CUSTOM branch |
| `simulationRefId` | General View/Edit/mapper | Read/write | Industry Product | References Product or Product Group |
| `hasValidateFiAccount` | Rule View/Edit/mapper/type | Read/write/presentation | Industry Product | Missing form value defaults to `false` |
| `priorityDisbursement` | Rule View/Edit and both mappers | Read/write/presentation | Industry Product | Missing value becomes omitted or `''`, depending on tab |
| `customerSegmentRule` | Industry Rule mapper/UI | Read/write/presentation | Industry Product | Whole nested object is reconstructed |
| `customerSegmentRule` | Product Group inheritance flow | Read | Product Group | New/editing groups can inherit Product Line segments |
| `customerSegmentRule` | Product/Product Group forms and mappers | Read/write | Product/Product Group | Similar names but separate persisted objects |
| `customerSegmentViewType` | Industry Rule UI/mapper | Read/write/presentation | Industry Product | Determines how `views` is generated |
| `customerSegmentViewType` | Product Group inheritance | Read | Product Group | Inherited from selected Product Line |
| `customerSegmentViewCode` | Industry Rule UI/mapper | Read/write | Industry Product | Missing input maps to `''` |
| `customerSegmentViewCode` | Product Group inheritance | Read | Product Group | Inherited from selected Product Line |
| `BY_CUSTOMER_BLACKLIST` | Industry Rule mapper/UI | Read/write encoding | Industry Product | Presence in `excludes` controls face-blacklist toggle |
| `BY_CUSTOMER_BLACKLIST` | Product/Product Group mappers | Read/write encoding | Product/Product Group | Same segment convention in other contracts |
| `BY_CUSTOMER_BLACKLIST` | Customer segmentation options | Domain constant/presentation | Users | Defines “Blacklist khuôn mặt” segment type |
| `SIMILAR_APPLICABLE_CUSTOMER_SEGMENT` | Industry mapper/options | Read/write | Industry Product | Copies Apply objects into View |
| `SIMILAR_APPLICABLE_CUSTOMER_SEGMENT` | Product/Product Group mappers | Read/write | Product/Product Group | Same semantic pattern in separate DTOs |
| `ALL` segment | Industry Rule selection logic | Read/write | Industry Product | Forced to be exclusive selection |
| `ALL` segment | Product/Product Group/notification selectors | Read/write | Other modules | Same fetched segment convention; exact business semantics still unproven |

## 7. Create vs Edit Scope

No Product Line creation flow exists in this frontend:

- Routes provide list, view, and edit only.
- The Product Line slice has GET and PUT actions but no POST/create action.
- The list has no Product Line create button.
- Repository-wide endpoint search found no `POST product-lines`.

The requirement's “create/update” wording does not match current frontend
behavior. Product Group and Product creation exist, but Product Line creation
does not.

## 8. Mobile / Cham Vay Impact

### Proven frontend impact

- Product Line cash-loan simulation fields select SELF, PRODUCT_GROUP, PRODUCT,
  or CUSTOM simulation configuration.
- Product Line customer-segment rules are fetched through the assignable Product
  Line endpoint and can be inherited by Product Group create/edit.
- Product and Product Group customer-segment payloads use View/Apply/Exclude,
  ALL, SIMILAR, and blacklist concepts.
- Separate Portal modules configure product simulation and mobile display order,
  but they use different `products/configs` endpoints and types.
- No direct source connection was found between those newer
  simulation/display-order modules and `IndustryDetail.cashLoanSimulation`.
- No `Cham Vay`/`Chấm Vay` identifier occurs in source.

### Backend/mobile dependency requiring external confirmation

- Whether Mobile/Cham Vay directly reads Product Line schedule, image, signing
  method, simulation, bank validation, blacklist, or segment fields.
- Whether backend APIs transform or inherit Product Line values into
  mobile-facing Product/Product Group responses.
- Whether clearing Product Line segments alters already-existing Product Groups
  or only future inheritance.
- Whether clearing simulation disables, changes, or falls back to another
  simulation source.

These are **NOT PROVABLE FROM THIS REPOSITORY**.

## 9. Missing Backend / BA Information

1. Which exact fields must be preserved, and which must be cleared?
   - Why: The requirement gives only a mixed policy; mapper behavior must be
     property-specific.
2. For every cleared field, what exact PUT representation is required: `null`,
   `false`, `''`, `[]`, `{}`, or omission?
   - Why: Current mapper generates all of these differently, and PUT is
     whole-object.
3. Does `PUT product-lines/:id` use replacement or patch-like semantics for
   omitted properties?
   - Why: Removing controls can omit `undefined` properties during
     serialization.
4. Does the endpoint accept `null` for `image`, `keyImage`, `signingMethod`,
   `cashLoanSimulation`, and customer-segment properties?
   - Why: Ambient types mark them optional, not nullable.
5. Should Display Schedule clearing send `isSchedule: false` with null dates?
   - Why: Hiding the controls alone currently produces undefined plus null
     dates.
6. Should Cash Loan simulation be preserved, set to `null`, or replaced by a
   default source?
   - Why: `{}` is the current accidental outcome after control removal.
7. Does bank-account validation clearing mean `false`?
   - Why: It is a boolean, not a nullable form field.
8. Is `priorityDisbursement` retained when bank validation is hidden?
   - Why: It is coupled in the UI but independently persisted.
9. What exactly does “customer segment becomes ALL” mean for View, Apply, and
   Exclude?
   - Why: ALL is a fetched segment object, not a frontend semantic constant.
10. Which `customerSegmentViewType` accompanies ALL?
    - Why: `SELECTION_CUSTOMER`, `SIMILAR_APPLICABLE_CUSTOMER_SEGMENT`, and
      `TYPING_CODE` generate different payloads.
11. Should blacklist remain in Exclude when customer-segment UI is hidden or
    reset to ALL?
    - Why: The toggle is encoded through Exclude membership.
12. Do existing inheriting Product Groups dynamically follow Product Line rules
    or copy them only during editing?
    - Why: Frontend proves edit-time inheritance but cannot prove backend
      runtime behavior.
13. Are there Product Line records with missing/null legacy values in
    DEV/UAT/STG?
    - Why: Required-field removal and mapping must cover both populated and
      legacy-null records.
14. Does Mobile/Cham Vay consume any of these fields directly or through backend
    aggregation?
    - Why: No mobile application or backend implementation is present.
15. Should status activation/deactivation retain hidden legacy values?
    - Why: Status update sends the full fetched Product Line object.

## 10. Recommended FE Change Boundary

Do not implement until the property-level preserve/clear matrix is approved.

Smallest safe eventual boundary:

1. Remove only the requested Detail/Edit presentation blocks.
2. Remove only their associated Ant Form validation rules and conditional UI
   logic.
3. Keep the existing Redux, `FormLayout`, routes, permissions, and PUT endpoint.
4. Modify `formatDataIndustryDetail` so every hidden field has an explicit,
   reviewed policy:
   - preservation reads from the current `productIndustry` draft;
   - clearing emits the exact backend-approved value.
5. Treat `cashLoanSimulation` and `customerSegmentRule` atomically unless
   backend contracts explicitly allow partial reconstruction.
6. Preserve blacklist membership separately when hiding its toggle unless BA
   explicitly requests removal.
7. Do not modify Product/Product Group customer-segment flows except where
   regression proves Product Line inheritance behavior.
8. Do not introduce a service migration, React Query, new forms, type-system
   migration, or shared refactor.

## 11. Regression Matrix

| Scenario | Required checks |
| --- | --- |
| CL detail | Hidden General/Rule fields absent; remaining values render correctly |
| CL edit General | Remaining controls initialize, validate, and update |
| CL edit Rule | Remaining controls initialize, validate, and update |
| CD detail | Hidden common fields absent; CD-only existing-card behavior remains |
| CD edit General | No accidental `cashLoanSimulation: {}` or legacy-field clearing |
| CD edit Rule | CD rule values remain; credit-card check remains unaffected |
| Update unrelated General field | Inspect exact PUT body; hidden fields follow approved preserve/clear policy |
| Update unrelated Rule field | Inspect exact PUT body; General and hidden Rule fields remain correct |
| Switch General → Rule → General | Redux draft retains changes and hidden values across unmount/remount |
| Switch Rule → General → Rule | Same, including blacklist and segments |
| Reload after update | GET reflects approved persisted state |
| Existing record with hidden values | Preserve or clear exactly as approved |
| Existing record with null/missing values | No validation blockage, crash, `NaN`, or unintended defaults |
| CL simulation variants | SELF, PRODUCT, PRODUCT_GROUP, CUSTOM legacy records |
| Segment View types | TYPING_CODE, SELECTION_CUSTOMER, SIMILAR |
| ALL segment | Correct singleton object in every approved array |
| Blacklist enabled/disabled | Correct Exclude membership after unrelated Rule edits |
| Product Group inheritance | Create/edit inheritance still receives approved Product Line rule |
| Status deactivate | Whole-object PUT retains approved hidden-field state |
| Status activate | Same, including records with legacy-null values |
| API rejection | Generic update error remains; no silent local success |
| Mobile/Cham Vay | External runtime verification by owning team/environment |

## 12. Files Involved

Likely modification files after decisions are approved:

- `src/modules/products/configuration/industry-product/edit/general.tsx`
- `src/modules/products/configuration/industry-product/view/general.tsx`
- `src/modules/products/configuration/industry-product/edit/rule.tsx`
- `src/modules/products/configuration/industry-product/view/rule.tsx`
- `src/modules/products/configuration/industry-product/ultis.tsx`

Possible contract update only if backend nullability is confirmed:

- `src/types/product-industry.d.ts`

Required regression-inspection files:

- `src/modules/products/configuration/industry-product/edit/form.tsx`
- `src/modules/products/configuration/industry-product/view/form.tsx`
- `src/redux/slices/product-industry.slice.ts`
- `src/layouts/form.layout.tsx`
- `src/components/forms/industry-product/cash-loan-simulation/index.tsx`
- `src/components/forms/industry-product/cash-loan-simulation/custom.tsx`
- `src/utils/form.ts`
- `src/redux/slices/common.slice.ts`
- `src/modules/products/configuration/group-list-product/utils.tsx`
- `src/modules/products/configuration/group-list-product/create/rule.tsx`
- `src/modules/products/configuration/group-list-product/edit/rule.tsx`
- `src/types/common.d.ts`
- `src/components/select-form-custom.tsx`
- `src/components/upload/index.tsx`

## 13. Final Decision

| Requested field | Classification | Decision basis |
| --- | --- | --- |
| Display Schedule | NEEDS_BACKEND_CONFIRMATION | Hiding/preserving is feasible; clearing representation and visibility impact are unknown |
| Image / `keyImage` | NEEDS_MOBILE_CONFIRMATION | UI-only preservation is feasible; downstream display use and clearing semantics are unproven |
| Signing Method | NEEDS_BACKEND_CONFIRMATION | Currently required; naive hiding emits `null`, whose acceptance is unproven |
| Cash Loan Simulation | NEEDS_MOBILE_CONFIRMATION | Naive hiding overwrites with `{}`; Mobile/Cham Vay dependency is unproven |
| Bank account validation toggle | NEEDS_BA_CONFIRMATION | Hiding/preserving is feasible; whether requested clearing means `false` requires business decision |
| `priorityDisbursement` | NEEDS_BA_CONFIRMATION | Coupled UI field but requested disposition is not stated |
| Face blacklist toggle | NEEDS_BA_CONFIRMATION | Clearing removes a special Exclude segment and can change eligibility |
| Customer Segment View | NEEDS_BA_CONFIRMATION | ALL and View-type semantics are not established |
| Customer Segment Apply | NEEDS_BA_CONFIRMATION | Product Groups can inherit this rule |
| Customer Segment Exclude | NEEDS_BA_CONFIRMATION | Coupled to blacklist and ALL behavior |

No requested persisted field is currently `SAFE_TO_HIDE_AND_CLEAR` from
repository evidence alone. All fields are technically
`SAFE_TO_HIDE_AND_PRESERVE` only when the mapper is deliberately changed to
retain the fetched value; that preservation path does not authorize any
requested clearing or prove Mobile/backend behavior.
