# unlock-request-customer Service Extraction

## 1. Slice & Thunks In Scope

- Slice: `src/redux/slices/unlock-request-customer.slice.ts` (`name: 'unlock-request-customer'`).
- Thunks extracted (both in scope — neither reads `getState()`, neither calls more than one endpoint per thunk body):
  - `getListUnlockRequestCustomer` — `async (query?: Record<string, any>)`.
  - `updateUnlockRequest` — `async (data: { id: number | string; formData: UnlockRequestReasonRejectedFormValues })`.
- Not a thunk, untouched: `resetSegmentationCustomerList` (`create.reducer`, no API call).
- Target module/folder: `users` → `src/services/users/` (confirmed single consumer, `src/modules/users/customer/unlock-request/list.tsx`).

## 2. Endpoint Inventory

| Thunk | Method | Endpoint | Request shape |
| --- | --- | --- | --- |
| `getListUnlockRequestCustomer` | GET | `api/admin/portal/v1/unlock-requests` | `{ query }` option, `query?: Record<string, any>` |
| `updateUnlockRequest` | PUT | `` api/admin/portal/v1/unlock-requests/${id} `` | body = `formData: UnlockRequestReasonRejectedFormValues` |

No other `apiFetcher` calls existed in this slice file. No existing file elsewhere uses the `unlock-requests` endpoint string (no collision).

## 3. Service Interface Definition

`src/services/users/unlock-request-customer.service.ts`:

```ts
export interface UnlockRequestCustomerService {
  getListUnlockRequestCustomer(query?: Record<string, any>): Promise<UnlockRequestCustomerPagedResponse>;
  updateUnlockRequest(id: number | string, formData: UpdateUnlockRequestCustomerRequest): Promise<unknown>;
}
```

The interface is formally enforced by `export const unlockRequestCustomerService: UnlockRequestCustomerService = { getListUnlockRequestCustomer, updateUnlockRequest };` (added after frontend-reviewer flagged the first draft's interface as unused ceremony — see §10). The two named functions remain individually exported for the thunk's direct import style, matching `promotion-type.service.ts`'s calling convention.

`getListUnlockRequestCustomer` wraps its response in a null-guard (`requireUnlockRequestCustomerApiResponse`), the same idiom as `requirePromotionTypeApiResponse` in `promotion-type.service.ts`. `updateUnlockRequest` returns the raw response with no guard, since its return type is `unknown` and nothing reads it.

## 4. DTO / Type Placement

Sibling file `src/services/users/unlock-request-customer.types.ts` (per `.claude/rules/03-api-service.md` `## Service location` point 6):

```ts
import type { UnlockRequestCustomerType, UnlockRequestReasonRejectedFormValues } from '@/types/unlock-request-customer';

export type UnlockRequestCustomerPagedResponse = {
  items: UnlockRequestCustomerType[];
  pageInfo: Pagination;
};

export type UpdateUnlockRequestCustomerRequest = UnlockRequestReasonRejectedFormValues;
```

`UnlockRequestCustomerType` and `UnlockRequestReasonRejectedFormValues` are imported from `@/types/unlock-request-customer` (module-owned domain types) rather than redefined, per rule 03 point 4. `pageInfo` uses the ambient global `Pagination` type. `UnlockRequestCustomerPagedResponse`'s `{ items, pageInfo }` shape is marked `NEEDS-VERIFICATION` in-file — it is inferred from what the slice's `fulfilled` reducer reads, not confirmed against backend swagger/docs. No response DTO was created for `updateUnlockRequest`'s PUT response, since nothing in the repository reads it.

## 5. Preserved Contracts

Independently verified against `git diff`/`git status` by the `frontend-reviewer` pass:

- Slice `name`, both thunk exported names, and both thunk argument shapes unchanged.
- All three `pending`/`fulfilled`/`rejected` reducer bodies for both thunks are byte-for-byte unchanged (only the payload-creator bodies were swapped to call the service).
- `resetSegmentationCustomerList` and all four selectors unchanged.
- GET endpoint string + `{ query }` option shape, and PUT endpoint template + `formData` body, preserved exactly.
- `src/redux/middlewares/unlock-request-customer.middleware.ts` untouched — including its known pre-existing double-notification defect on `updateUnlockRequest.rejected`, correctly left out of scope.
- `src/modules/users/customer/unlock-request/list.tsx`, `component/form-reasonRejected.tsx`, and `src/types/unlock-request-customer.d.ts` untouched.
- `src/services/users/customer-segment.service.ts` untouched; no barrel name collision found between the new exports and `customer-segment.service.ts` or the `products` barrel.

## 6. Thunks Excluded And Why

None. Both thunks in this slice (`getListUnlockRequestCustomer`, `updateUnlockRequest`) were in scope and extracted; `resetSegmentationCustomerList` was not a thunk and required no extraction.

## 7. Change Boundary

Added:
- `src/services/users/unlock-request-customer.service.ts`
- `src/services/users/unlock-request-customer.types.ts`

Modified:
- `src/redux/slices/unlock-request-customer.slice.ts` — two thunk bodies now call the aliased service functions (`getListUnlockRequestCustomerApi`, `updateUnlockRequestApi`); one new import block.
- `src/services/index.ts` — one new `export * from './users/unlock-request-customer.service';` line, after the existing `customer-segment.service` line (unchanged).

Out of scope and confirmed untouched: the middleware, `list.tsx`, `form-reasonRejected.tsx`, `src/types/unlock-request-customer.d.ts`, `customer-segment.service.ts`, and every other module's services.

## 8. Validation Performed

- `npm run typecheck`: one failure, `src/modules/contents/banner/simulation/simulationModalContent.tsx(11,30)` vs `SimulationLayout.tsx`/`simulationLayout.tsx` filename-casing collision (TS1261) — pre-existing and unrelated to this change (confirmed present before this task started, and its import trace never touches any file in this diff).
- `npx eslint` on all four changed/added files: clean, no output.
- `npx vite build`: succeeded (separately from `npm run build`, which short-circuits on the pre-existing typecheck error above).
- Prettier: the two new files are clean; the slice file retains pre-existing formatting drift on untouched lines (present at HEAD before this change) — not reformatted, per the instruction to touch only the thunk bodies and new import.
- `frontend-reviewer` independently re-ran `npm run typecheck` and `eslint` and reached the same conclusions; verdict **PASS WITH WARNINGS**.

These checks do not prove runtime, API, or auth behavior. The repository has no test runner.

## 9. Runtime Validation Gaps

Not verified in a browser or against a real backend:

- Unlock-request list page: load, pagination, sort/filter via `handlePageChange`/`handleTableChange`.
- Approve/reject update flow: success/failure notifications (including the pre-existing double-notification defect on reject failure), `loadingUpdate` toggling, and the refresh-after-update dispatch sequence in `list.tsx`.
- The actual GET (`{ items, pageInfo }`) and PUT response shapes — both still `NEEDS-VERIFICATION`.
- The one identified behavioral delta (see §10): a `null` GET response, which previously would have produced an uncaught `TypeError` inside the `fulfilled` reducer, now cleanly dispatches `rejected` and fires the existing `GET_LIST_FAILED` notification. This was not reproduced against a live null-body response.

## 10. Reviewer Attention

- `frontend-reviewer` verdict: **PASS WITH WARNINGS**, no blocking findings.
- One `MEDIUM` (non-blocking) finding from the first draft — an exported `UnlockRequestCustomerService` interface with no consumer and no structural enforcement — was fixed in this pass by adding `export const unlockRequestCustomerService: UnlockRequestCustomerService = { ... }`, so the interface is now type-checked against its implementation rather than decorative. Re-ran typecheck/lint after the fix; both still pass with only the pre-existing baseline error.
- One `INFO` (non-blocking) finding: the GET null-response behavior change described in §9 is assessed as behavior-preserving-or-better (it routes a previously-crashing edge case through the middleware's existing `rejected` notification path rather than inventing new error handling), not a regression — but it is a net behavioral delta worth naming explicitly in any PR description, since it technically changes which action type fires for an input that was previously unhandled.
- Recommended future `TEST-DEBT` (no test runner exists): the null-guard's throw behavior, the two service functions' endpoint/payload construction, and the slice's reducer transitions for both thunks.
