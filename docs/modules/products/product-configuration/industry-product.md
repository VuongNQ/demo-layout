# Industry Product (Product Line) Source Map

> Source snapshot: 2026-10-05. This document describes the current frontend
> implementation under `src/modules/products/configuration/industry-product`.
> Backend validation and business semantics that cannot be proven from this
> checkout are called out explicitly.

## 1. Scope

Despite the folder name, this feature manages **product lines** (Vietnamese UI:
`ngành hàng`), currently differentiated by code:

- `CL`: cash loan;
- `CD`: credit card.

The feature provides a product-line list, read-only detail, edit, status
activation/deactivation, related product-group list, and audit history. There is
no create flow in this module.

Routes:

| Route | Screen | Guard |
| --- | --- | --- |
| `/product/configuration/industry-setting` | Product-line list | Auth only; the menu separately requires either product-line view permission |
| `/product/configuration/industry-setting/view/:id` | Detail with four tabs | Cash-loan or credit-card product-line view permission |
| `/product/configuration/industry-setting/edit/:id` | Edit with two tabs | Cash-loan or credit-card product-line edit permission |

The detail footer independently checks the two edit permissions before showing
edit/status actions. Route permission arrays use the application's OR behavior.

## 2. Service and Redux ownership

There is no feature-local service. `product-industry.slice.ts` is the endpoint
owner and calls the global `apiFetcher` directly. Redux owns fetched resources,
one shared loading flag, pagination, and the assembled edit draft.

| Redux action | Request | Request/query data | Stored result / consumer |
| --- | --- | --- | --- |
| `getListIndustries` | `GET api/admin/portal/v1/product-lines` | Optional table sort, e.g. `field,asc` | `listIndustries`; list screen and product screens outside this feature also consume it |
| `getIndustryDetail` | `GET api/admin/portal/v1/product-lines/:id` | Path `id` | `industryDetail`; detail and edit initialization |
| `updateIndustry` | `PUT api/admin/portal/v1/product-lines/:id` | Entire assembled `IndustryDetail`-shaped draft | Edit submit; middleware notifies and navigates to the view URL |
| `updateIndustryStatus` | Same `PUT product-lines/:id` | Existing detail with toggled `status` and optional `reason` | View footer status action; middleware reports activate/deactivate success or failure |
| `getListProductGroups` | `GET product-lines/:id/product-groups` | `page`, `size` | Related-group tab and shared industry pagination |
| `getListUpdatedHistories` | `GET request-application/:id/audit` | `page`, `size`, `entityType=PRODUCT_LINE` | Audit-history tab and shared industry pagination |
| `getProductSegment` | `GET product-lines/customer-segment` | None | Defined in the slice but has no current source caller |
| `getListHistories` | `GET product-lines/:id/history` | Optional pagination query | Defined in the slice but has no current industry-product caller; the UI uses the audit endpoint above |
| `onChangeDataTempUpdate` | No HTTP request | Current mapped edit draft | `dataTempUpdate`, submitted by the edit container |

The feature also reads reference data through other Redux slices:

- assignable products: `GET products/search/assignable`;
- assignable product groups: `GET product-groups/search/assignable`;
- customer segments: `GET category/customer-segment`;
- required-information definitions and their assignable master data;
- provinces, districts, and wards.

Those requests populate selectors and rule-detail presentation. They are not
additional product-line write payloads.

### Request lifecycle and side effects

All industry operations share `state.loading`; simultaneous detail, reference,
history, group, or update requests are not represented independently. The
slice has no request ID, cancellation, or stale-response protection.

`product-industry.middleware.ts` owns request-failure notifications and update
success/failure notifications. After a successful general/rule update it calls
`navigate(getViewUrl())`. Status update stays on the detail page; the component
then reloads the detail.

## 3. Workflow data flow

### List and detail

```text
industry-setting list
  -> getListIndustries
  -> listIndustries
  -> table: code, name, description, updatedDate, status

detail route
  -> getIndustryDetail
  -> General and Rule read-only forms
  -> related groups load independently by product-line id
  -> audit history loads independently by product-line id
```

The detail sidebar contains:

1. `Thông tin chung` (General);
2. `Quy tắc` (Rule);
3. `Danh sách nhóm sản phẩm` (related groups);
4. `Lịch sử cập nhật` (audit history).

The General and Rule child components also dispatch some detail/reference
requests already requested by the parent. Current source therefore permits
duplicate detail requests during a detail mount.

### Edit

```text
GET product-lines/:id
  -> industryDetail
  -> initialize dataTempUpdate with the server object
  -> each tab converts API data to form-shaped values
  -> every form change calls formatDataIndustryDetail(...)
  -> mapped result replaces dataTempUpdate
  -> footer Confirm sends dataTempUpdate in PUT product-lines/:id
```

There is one edit footer for both `General` and `Rule`; the action's `type` is
always passed as `ProductIndustryTabs.General`, but the thunk does not use
`type` when constructing the request. The current API write is a whole-object
update rather than a tab-specific endpoint.

Cancel opens a confirmation modal, emits a success notification saying the
changes were cancelled, and returns to the detail route. No request is sent.

### Status change

- Active product line: the UI requires a disable reason, then sends the current
  detail with `status: INACTIVE` and `reason`.
- Inactive product line: the UI sends the current detail with `status: ACTIVE`;
  no reason is requested.
- The warning states that disabling a line prevents its products and product
  groups from operating. Whether the backend enforces that cascade is not
  provable from frontend source.

## 4. Config UI

### General tab (CL and CD)

| UI control | Behavior |
| --- | --- |
| Code, name | Displayed but disabled in edit and view |
| Status | Switch in edit; detail status is also controllable from the view footer |
| Display schedule | `isSchedule` enables start/end dates; start is required when scheduling is enabled |
| Description | Rich-text editor |
| Image | Upload component; `keyImage` is maintained in a hidden form item |
| Signing method | Multi-select: `ONLINE` (OTP), `OFFLINE` |

### CC2 General configuration

- `stepAmount` remains required for CL.
- CC2 hides Display Schedule, Image, and Signing Method from both CL and CD
  detail/edit. Their original GET values are retained in whole-object PUT
  payloads.
- Cash Loan Simulation is also hidden from CL detail/edit and is retained from
  the original GET response.
- CD retains its legacy mapper behavior of constructing `cashLoanSimulation`
  from General form values, even though CD has no simulation UI.

### Rule tab

| Section | CL | CD |
| --- | --- | --- |
| Disbursement account | Priority (`HDBANK`, `VIKKI`, `OTHER`); bank-account validation is hidden by CC2 | Hidden |
| Customer visibility | Hidden by CC2 | Hidden by CC2 |
| Applicable segments | Hidden by CC2 | Hidden by CC2 |
| Excluded segments | Editable; selected segments merge with original blacklist membership | Editable; selected segments merge with original blacklist membership |
| Face blacklist check | Hidden by CC2; existing blacklist membership is preserved | Hidden by CC2; existing blacklist membership is preserved |
| Existing-card check | Hidden | Switch |
| Waiting periods | cancellation, first repayment, max monthly payment day, contract signing, additional documents | cancellation, contract signing, additional documents |

The segment tables enrich selected segment data for display. They can render
criteria, required-information labels, master-data labels, address labels,
loan/order status labels, time/event/history criteria, and logical operators.
This enrichment is presentation-only and depends on common, address, and users
segmentation code.

CC2 hides Customer Segment View, Apply, and Face Blacklist for both products.
Exclude remains editable: the mapper preserves original View/Apply values and
merges the current selected Exclude segments with the original
`BY_CUSTOMER_BLACKLIST` membership. `priorityDisbursement` remains visible for
CL, and Existing Card Check remains visible for CD. This deliberately does not
infer the representation of Customer Segment = ALL.

## 5. Form control and field mapping

The module uses Ant Design `Form` behind the shared imperative `FormLayout` /
`FormRef` contract. `useFormImperativeHandle` registers each sidebar form with
the layout. Edit child forms use `onValuesChange`; the parent does not read the
child forms directly at submit time and instead submits Redux `dataTempUpdate`.

### Fields transformed before the service request

These fields are used directly by form controls but are not sent in the same UI
shape:

| UI/form shape | Write payload shape |
| --- | --- |
| `status: boolean` | `status: 'ACTIVE' | 'INACTIVE'` |
| `startDate`, `endDate` as Dayjs/null | Formatted date-time values/null |
| `signingMethod` select options | Values extracted by `formatOptionToFormValue` |
| Flat simulation fields (`simulationType`, `simulationRefId`, `custom*`, `interestRate*`) | Nested under `cashLoanSimulation` |
| `customerSegmentRuleViews/Applies/Excludes: number[]` | IDs resolved back to segment objects in `customerSegmentRule.views/applies/excludes` |
| `customerSegmentViewType = SIMILAR_APPLICABLE_CUSTOMER_SEGMENT` | `customerSegmentRule.views` is replaced with the mapped applicable segments |
| `isEnableFaceCheck: boolean` | Not sent as a named field; adds/removes the `BY_CUSTOMER_BLACKLIST` segment in `customerSegmentRule.excludes` |
| Status modal `disableReason` | Sent as top-level `reason` during deactivation |

`keyImage` is hidden in the UI but **is** included in the write payload, so it is
not a UI-only field.

### UI-only / display-only data not written as product-line fields

| Data | Purpose |
| --- | --- |
| Segment table `index`, `name`, `logic`, `info`, `value` | Derived display columns for applicable/excluded segment rules |
| Enriched segment-detail state (`dataMock`, address label caches, row heights) | Table rendering, tooltip/alignment, and human-readable criteria |
| Product and product-group option labels | Selector display; only `simulationRefId` is retained |
| `formValues` component state | Conditional rendering and dynamic validation |
| Pagination and sort values | List/group/history reads only |

`inheritCustomerSegment` exists in the local `RuleFormValues` and ambient
`IndustryTempData` types, but current source neither renders it nor maps it into
the update request. It is an unused declared field rather than an active UI
field.

## 6. Service payload shape assembled by the UI

The effective update object preserves untouched fields from the fetched detail
and overwrites the active tab's mapped values. Its meaningful persisted shape is:

```text
IndustryDetail
├─ id, code, name, description, status, reason?
├─ stepAmount?, image?, keyImage?, signingMethod?
├─ isSchedule, startDate?, endDate?
├─ cashLoanSimulation?                 # nested CL simulation configuration
├─ hasValidateFiAccount?, priorityDisbursement?
├─ customerSegmentRule
│  ├─ views?, applies?, excludes?      # segment objects, not form IDs
│  ├─ customerSegmentViewType?
│  ├─ customerSegmentViewCode?
│  └─ hasCreditCardCheck?
└─ cancellationDueDate?, firstRepaymentDueDate?, maxPaymentDueDate?,
   contractSigningDueDate?, additionalDocumentsDueDate?
```

The frontend types allow several loose or mixed representations (`Status |
boolean`, Dayjs on API-facing ambient types, string or select options). The
actual backend response and accepted nullability are not runtime-validated in
this feature.

## 7. Backend and third-party response/error handling

### Transport behavior

All product-line and reference-data requests go through `ApiFetcher`. For this
feature, a successful HTTP response is reduced to `response.data` and passed to
the thunk/reducer without a runtime response-shape guard. The UI therefore
assumes the backend returns the shapes described in the slice and ambient
types.

For non-401 failures, the Axios response object is thrown when one exists;
otherwise the original transport error is thrown. The industry thunks do not
catch it, normalize it, use `rejectWithValue`, or map a backend `code`,
`errorCode`, `message`, field-error collection, or HTTP status into a
feature-owned error model. Redux Toolkit consequently creates a rejected
action from the thrown value, but the industry middleware ignores its payload
and error details.

Current user-visible handling is:

| Failed operation | State fallback | User-visible result |
| --- | --- | --- |
| Product-line list | `listIndustries = []` | Generic `MESSAGE.GET_LIST_FAILED` notification |
| Product-line detail | `industryDetail = undefined` | Generic `MESSAGE.GET_FAILED` notification |
| Related groups | `listProductGroups = []` | Generic `MESSAGE.GET_FAILED` notification |
| Legacy history / audit history | Corresponding list becomes `[]` | Generic get/get-list notification |
| Customer-segment endpoint owned by the industry slice | `customerSegment = []` | Generic `MESSAGE.GET_FAILED` notification |
| Edit update | Existing draft remains in Redux | Generic `MESSAGE.UPDATE_FAIL` notification |
| Activate/deactivate | Detail is re-fetched by the component | Generic enable/disable failure text chosen from the attempted status; backend details are not displayed |

There is no field-level server error integration with Ant Design Form. A
backend validation conflict, business-rule failure, or unexpected server error
therefore produces the same generic update-failure notification in this
feature.

### Authentication errors

`ApiFetcher` handles HTTP 401 globally rather than in this module:

1. except for a login endpoint, the first 401 dispatches `logoutUser`;
2. it displays `Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.`;
3. duplicate handling is suppressed for one second;
4. the interceptor resolves the request with `{ data: null }` instead of
   rejecting it, to avoid a second feature-level notification.

Because the thunk can receive `null` as a fulfilled value, reducers that expect
`items`, `pageInfo`, or a detail object are not protected against a malformed
fulfilled payload. Exact runtime behavior after a 401 should be verified per
screen.

Token acquisition is handled through Microsoft MSAL. An
`InteractionRequiredAuthError` initiates `loginRedirect`; other token-acquisition
or token-parsing errors are logged and result in no refreshed token. This is
application-wide authentication behavior, not product-line-specific error-code
handling.

### Reference-data and upload failures

The General and Rule UIs depend on common/address requests in addition to the
product-line endpoints:

- common-slice failures for assignable products/groups, segments, and required
  information clear the corresponding list and normally show a generic
  get-list notification;
- address-slice province/district/ward failures clear the applicable data, but
  current source has no address listener that displays a notification;
- master-data failures clear the shared master-data map; the common middleware
  has no listener for `getMasterDataDetailById.rejected`;
- image upload posts to `api/admin/file?category=CONTENT`. The shared upload
  component catches failures, writes the error to the console, and does not map
  a backend response code or show an upload-failure notification. Its file-size
  check is local UI validation and does show an Ant Design message.

These failures can leave selectors empty or rule-detail labels incomplete
while the product-line detail/draft itself remains loaded.

### Backend versus third-party errors

The industry-product source does not call a business third-party API directly.
Product-line, reference-data, address, audit, and upload URLs are all sent to
the configured HDS Admin backend through `ApiFetcher`. If that backend calls a
credit service, storage provider, or another third party internally, this
frontend receives only the backend HTTP response and has no source-defined way
to distinguish the upstream provider.

The only directly identifiable third-party integration on this request path is
Microsoft MSAL for authentication. No industry-specific third-party error-code
table, retry policy, timeout policy, or fallback response exists in current
source.

### Response/error contract gaps

- No runtime validation protects successful product-line responses.
- No typed error DTO or stable mapping for HTTP status/backend error code exists.
- Backend messages and field errors are not surfaced on this feature's forms.
- No request in this feature provides an `AbortSignal` or feature-level retry.
- The UI cannot identify whether an error originated in HDS backend logic or an
  upstream third party hidden behind the backend.
- Authoritative backend error codes, localization requirements, and retryable
  versus non-retryable failures require API/BA documentation; they cannot be
  inferred safely from the current frontend.

## 8. Current-source observations and verification gaps

- The slice is an endpoint catalog rather than a feature service; this is a
  legacy-compatible implementation, not a recommendation for new code.
- `dataTempUpdate` is typed as `IndustryDetail`, while intermediate form models
  deliberately have different shapes. `formatDataIndustryDetail` is the
  critical form-to-request boundary.
- Numeric form fields are converted with `Number(...)`; blank/undefined values
  can therefore become `0` or `NaN` before transport depending on component
  behavior. The accepted backend semantics need verification.
- The common pagination object is overwritten by group and history requests.
- The meaning of customer-segment inheritance, `ALL`, blacklist injection, and
  the two product-line codes requires BA/backend confirmation.
- Static inspection does not prove browser validation, permission behavior,
  upload behavior, API acceptance, or the deactivate cascade.

## 9. Primary source files

- UI: `src/modules/products/configuration/industry-product/**`
- Mapper/helpers: `src/modules/products/configuration/industry-product/ultis.tsx`
- API/state: `src/redux/slices/product-industry.slice.ts`
- Notifications/navigation: `src/redux/middlewares/product-industry.middleware.ts`
- Ambient contracts: `src/types/product-industry.d.ts`
- Shared simulation fields: `src/components/forms/industry-product/cash-loan-simulation/**`
- Reference APIs: `src/redux/slices/common.slice.ts`, `src/redux/slices/address.slice.ts`
- Shared transport/auth: `src/utils/api-service.ts`
- Shared upload error path: `src/components/upload/index.tsx`
- Routes/menu/permissions: `src/routes/index.tsx`, `src/helpers/menus.helper.ts`,
  `src/constants/permission.constant.ts`
