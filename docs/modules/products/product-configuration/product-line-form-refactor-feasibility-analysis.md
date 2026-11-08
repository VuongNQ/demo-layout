# Product Line Form Refactor Feasibility Analysis

> Scope: `src/modules/products/configuration/industry-product`
>
> Baseline: pre-CC2 `HEAD` source. The working tree currently contains a
> separate CC2 implementation, so those uncommitted changes are not treated as
> the behavioral baseline for this report.

## 1. Executive Summary

- Risk: **HIGH**
- Decision: **STOP AFTER ANALYSIS**
- Refactor feasibility: Technically feasible without changing routes, API
  endpoints, Redux architecture, Redux state shape, or the whole-object PUT
  contract.
- Implementation status: Not started.

The refactor should not be performed on the current working tree because it
already contains the previous CC2 visibility and mapper changes. The repository
also has no unit, integration, component, or E2E tests that can establish
before/after equivalence for conditional validation, tab lifecycle,
customer-segment behavior, or final PUT payloads.

Before implementation, restore or otherwise isolate a clean pre-CC2 baseline
and capture deterministic payload evidence for CL/CD General and Rule updates.

## 2. Current Form Ownership

### Form instances

- Edit General creates its own Ant Design `FormInstance` with
  `Form.useForm<IndustryGeneralFormValues>()`.
- Edit Rule creates a separate `FormInstance` with
  `Form.useForm<RuleFormValues>()`.
- View General and View Rule likewise create separate form instances.
- General and Rule do not receive or share a parent form instance.
- CL and CD use the same General and Rule component implementations and the
  same component lifecycle. Product-specific fields are selected inside those
  components through product-code conditions.

### Method ownership

| Operation | Owner |
| --- | --- |
| `Form.useForm` | Each General/Rule component |
| `setFieldsValue` | General/Rule initialization; General upload and simulation handlers |
| `setFieldValue` | Edit General resets `simulationRefId` |
| `getFieldsValue` | Edit General/Rule on change; `FormLayout` during navigation/logging |
| `validateFields` | `FormLayout` |
| `resetFields` | Not used in the Product Line workflow |
| `onValuesChange` | Edit General and Edit Rule |
| Final update coordination | `edit/form.tsx` |
| PUT transport | `product-industry.slice.ts` |

### Exact update flow

```text
Route
  -> Edit Form
    -> FormLayout mounts the active sidebar tab only
      -> General or Rule creates its own Ant Form
        -> setFieldsValue from Redux dataTempUpdate
        -> user changes a field
        -> onValuesChange
        -> form.getFieldsValue()
        -> formatDataIndustryDetail(...)
        -> onChangeDataTempUpdate(mapped whole draft)
        -> Redux dataTempUpdate
    -> FormLayout validates the active form on confirmation
    -> Edit Form dispatches updateIndustry(dataTempUpdate)
    -> PUT product-lines/:id with the whole Product Line draft
```

`FormLayout` stores values while switching tabs, but Product Line submission is
driven by Redux `dataTempUpdate`, not by a parent Ant Form.

## 3. CL/CD Field Ownership Matrix

This matrix describes the pre-CC2 `HEAD` implementation.

### General

| Setting | Classification | CL | CD |
| --- | --- | --- | --- |
| Code | SHARED | Visible, disabled | Visible, disabled |
| Name | SHARED | Visible, disabled | Visible, disabled |
| Status | SHARED | Visible | Visible |
| Step amount | CL_ONLY | Visible and required | Absent |
| Display schedule | SHARED | Visible | Visible |
| Start/end dates | SHARED | Visible; start is conditionally required | Same |
| Description | SHARED | Visible | Visible |
| Image/keyImage | SHARED | Visible | Visible |
| Signing method | SHARED | Visible and required | Visible and required |
| Simulation source | CL_ONLY | Visible and required | Absent |
| Product/group simulation reference | CL_ONLY | Conditional | Absent |
| CUSTOM loan limit | CL_ONLY | Conditional | Absent |
| CUSTOM maturity | CL_ONLY | Conditional | Absent |
| CUSTOM interest | CL_ONLY | Conditional | Absent |

### Rule

| Setting | Classification | CL | CD |
| --- | --- | --- | --- |
| Bank-account validation | CL_ONLY | Visible | Absent |
| Priority disbursement | CL_ONLY | Visible | Absent |
| Customer Segment View | SHARED | Visible | Visible |
| Customer Segment Apply | SHARED | Visible | Visible |
| Customer Segment Exclude | SHARED | Visible | Visible |
| Face blacklist | SHARED | Visible | Visible |
| Existing-card check | CD_ONLY | Absent | Visible |
| Cancellation waiting period | SHARED | Visible | Visible |
| First repayment period | CL_ONLY | Visible | Absent |
| Maximum monthly payment day | CL_ONLY | Visible | Absent |
| Contract-signing period | SHARED_UI_DIFFERENT_BEHAVIOR | Second CL row | First CD row |
| Additional-document period | SHARED_UI_DIFFERENT_BEHAVIOR | Second CL row | First CD row |

## 4. Conditional Rendering Inventory

### General

| Condition | Field/section | CL behavior | CD behavior | Recommended owner |
| --- | --- | --- | --- | --- |
| `productIndustry?.code === 'CL'` | Step amount | Rendered | Omitted | Composition |
| `productIndustry?.code === 'CL'` | Simulation section | Rendered | Omitted | Composition |
| `simulationType === 'PRODUCT'` | Product reference | Rendered | N/A | Simulation setting |
| `simulationType === 'PRODUCT_GROUP'` | Group reference | Rendered | N/A | Simulation setting |
| `simulationType === 'CUSTOM'` | CUSTOM configuration | Rendered | N/A | Simulation setting |
| Mapper `code === 'CL'` | Priority disbursement | Copied | Not explicitly copied | Mapper |

### Rule

| Condition | Field/section | CL behavior | CD behavior | Recommended owner |
| --- | --- | --- | --- | --- |
| `productIndustry?.code === 'CL'` | Disbursement section | Rendered | Omitted | Composition |
| `productIndustry?.code === 'CD'` | Existing-card check | Omitted | Rendered | Composition |
| `productIndustry?.code === 'CL'` | First repayment/max payment | Rendered | Omitted | Composition |
| `productIndustry?.code === 'CD'` | Contract/additional fields in first row | Omitted | Rendered | Composition |
| `productIndustry?.code === 'CL'` | Contract/additional fields in second row | Rendered | Omitted | Composition |
| Mapper `code === 'CL'` | Priority disbursement | Included | Not explicitly included | Mapper |

Customer Segment View, Apply, Exclude, and face blacklist have no product-code
condition in the baseline. They are shared between CL and CD.

## 5. Field Coupling Analysis

| Candidate | Classification | Evidence |
| --- | --- | --- |
| Basic information | SAFE_TO_EXTRACT | Presentation and stable field names; no side effects |
| Step amount | SAFE_TO_EXTRACT | Isolated CL field and validation |
| Display Schedule | EXTRACT_WITH_SHARED_CONTEXT | Couples switch, dates, conditional validation, date disabling, and current form values |
| Description | SAFE_TO_EXTRACT | Isolated presentation |
| Image | EXTRACT_WITH_SHARED_CONTEXT | Upload callback must update `keyImage` on the owning form |
| Signing Method | SAFE_TO_EXTRACT | Isolated options and required validation |
| Cash Loan Simulation | KEEP_GROUPED | Simulation type, reference data, resets, initial values, conditional fields, and validators are coupled |
| Bank validation | SAFE_TO_EXTRACT | Isolated CL switch |
| Priority disbursement | SAFE_TO_EXTRACT | Isolated selector, but its mapper contract must remain unchanged |
| Customer Segment View | KEEP_GROUPED | Coupled to Apply by `SIMILAR_APPLICABLE_CUSTOMER_SEGMENT` |
| Customer Segment Apply/Exclude | HIGH_RISK_TO_EXTRACT | ALL exclusivity, reference data, async detail enrichment, tables, addresses, master data, and mapper reconstruction |
| Face blacklist | KEEP_GROUPED | Encoded as `BY_CUSTOMER_BLACKLIST` membership in Exclude |
| Existing-card check | SAFE_TO_EXTRACT | CD-only control nested in the customer-segment rule |
| Waiting periods | EXTRACT_WITH_SHARED_CONTEXT | Shared values but product-specific layout/composition |
| Rule detail tables | HIGH_RISK_TO_EXTRACT | Async derivation, refs, row heights, address lookup, master data, and sorting |

### Existing reverse dependency

The shared Cash Loan Simulation components import
`IndustryGeneralFormValues` from the Edit General component. Before moving the
General composition, move only this form-value type to a feature-owned type
file without changing its shape.

## 6. Mapper Coupling

`formatDataIndustryDetail(...)` assumes the active form supplies the complete
field set for its tab.

Baseline risks include:

- missing schedule fields can generate `isSchedule: undefined` and null dates;
- missing signing method is passed through `formatOptionToFormValue`;
- missing simulation fields reconstruct `cashLoanSimulation`;
- General mapping constructs `cashLoanSimulation` on the CD path too;
- missing bank validation defaults to `false`;
- customer-segment arrays are reconstructed from form IDs;
- missing View/Apply/Exclude inputs can produce empty arrays;
- blacklist membership depends on `isEnableFaceCheck`;
- missing View code becomes `''`;
- CL `priorityDisbursement` comes from active Rule form values.

Extraction alone should not change `getFieldsValue()` when every extracted
field remains under the same owning `<Form>`, keeps its exact field name, and
has the same mount timing. Separate nested Forms, changed conditional mounting,
or changed Ant Form preservation behavior can change the final payload.

The structural refactor should leave mapper implementation untouched until
payload equivalence is established.

## 7. Detail vs Edit Reuse

Detail and Edit duplicate labels, grouping, product-type conditions,
initialization, simulation composition, customer-segment projection, and
waiting-period composition.

They should not initially be unified behind one highly configurable component.
Recommended direction:

- keep Edit validation and mutations in Edit-owned components;
- keep View presentation in View-owned components;
- share narrow static sections only where the contract remains simple;
- share pure types/constants rather than introducing `isView`, `isEdit`,
  `isCL`, `isCD`, `isRequired`, and `disabled` prop combinations.

## 8. Existing Shared Components

Existing reusable components include:

- `CashLoanSimulation`;
- CUSTOM Cash Loan simulation fields;
- `FormWrapper`;
- `FormSection`;
- `SelectFormCustom`;
- shared Input, Select, Switch, DatePicker, Upload, and TextEditor controls.

No existing reusable Product Line business-setting components were found for:

- Display Schedule;
- Image/keyImage;
- Signing Method;
- Disbursement settings;
- Customer Segment composition;
- Waiting periods.

## 9. Proposed Target Structure

```text
industry-product/
|-- form-values.types.ts
|-- edit/
|   |-- general.tsx
|   |-- general-sections/
|   |   |-- cash-loan.tsx
|   |   |-- credit-card.tsx
|   |   |-- basic-information.tsx
|   |   |-- display-schedule.tsx
|   |   |-- image.tsx
|   |   |-- signing-method.tsx
|   |   `-- cash-loan-simulation.tsx
|   |-- rule.tsx
|   `-- rule-sections/
|       |-- cash-loan.tsx
|       |-- credit-card.tsx
|       |-- disbursement.tsx
|       |-- customer-segment.tsx
|       `-- waiting-periods.tsx
`-- view/
    |-- general.tsx
    |-- general-sections/
    |   |-- cash-loan.tsx
    |   `-- credit-card.tsx
    |-- rule.tsx
    `-- rule-sections/
        |-- cash-loan.tsx
        `-- credit-card.tsx
```

`general.tsx` and `rule.tsx` remain the form coordinators. They keep the Ant
Form instance, initialization, `onValuesChange`, mapper call, Redux dispatch,
and reference-data orchestration. Product-specific composition moves into the
CL/CD components.

The large customer-segment data pipeline should initially remain in the Rule
coordinator. Its rendered section can be isolated without simultaneously
moving all asynchronous derivation logic.

## 10. Required Baseline Evidence

Before implementation:

1. Restore or isolate a clean pre-CC2 source baseline.
2. Capture exact payloads for:
   - CL General update;
   - CL Rule update;
   - CD General update;
   - CD Rule update.
3. Cover populated, missing, and legacy-null values.
4. Capture General -> Rule -> General behavior.
5. Capture Rule -> General -> Rule behavior.
6. Verify these properties before and after:
   - `isSchedule`;
   - `startDate`;
   - `endDate`;
   - `image`;
   - `keyImage`;
   - `signingMethod`;
   - `cashLoanSimulation`;
   - `hasValidateFiAccount`;
   - `priorityDisbursement`;
   - `customerSegmentViewType`;
   - `customerSegmentViewCode`;
   - `customerSegmentRule.views`;
   - `customerSegmentRule.applies`;
   - `customerSegmentRule.excludes`;
   - `BY_CUSTOMER_BLACKLIST` membership.
7. Add a deterministic characterization boundary around
   `formatDataIndustryDetail`, or provide a configured environment where exact
   PUT requests can be recorded.

## 11. Final Decision

**NOT_READY_FOR_CC2**

The intended component boundaries can be identified, but the structural
refactor should not proceed on top of the current CC2 changes or without
before/after payload evidence. Once those conditions are satisfied, the
refactor can retain the existing form instances, Redux draft, mapper, and PUT
flow while moving product-code decisions to explicit CL/CD composition.
