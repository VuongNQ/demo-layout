# UC #2091 Promotion Type Module — Status Check (2026-10-26)

Pure status report. Nothing fixed in this pass. All evidence read fresh from
disk in this session; no reliance on prior session summaries.

## 0. Branch / working tree

```
$ git branch --show-current
feature/vuongnq/loai-uu-dai_2091

$ git status
On branch feature/vuongnq/loai-uu-dai_2091
Your branch is up to date with 'origin/feature/vuongnq/loai-uu-dai_2091'.
nothing to commit, working tree clean
```

**Working tree is fully clean** — no uncommitted changes of any kind.

## 1. Permission constant values — PASS

`src/constants/permission.constant.ts:167-169`:

```ts
PROMOTION_MANAGEMENT_VIEW: 'offer_type:view',
PROMOTION_MANAGEMENT_CREATE: 'offer_type:create',
PROMOTION_MANAGEMENT_EDIT: 'offer_type:edit',
```

Matches expected values exactly.

Consumers found (all reference the constant name, not a hardcoded string):
- `src/helpers/menus.helper.ts:355` — `PROMOTION_MANAGEMENT_VIEW`
- `src/routes/index.tsx:690,700,760,770` — `PROMOTION_MANAGEMENT_VIEW`
- `src/routes/index.tsx:710,780` — `PROMOTION_MANAGEMENT_CREATE`
- `views/PromotionTypeListPage/index.tsx:30` — `PROMOTION_MANAGEMENT_CREATE`
- `components/PromotionTypeDetailDrawer/index.tsx:75` — `PROMOTION_MANAGEMENT_EDIT`

No leftover `promotion_management:*`-style literal strings found anywhere in
`src/`.

## 2. Service file — mock scaffold still present — FAIL (partial)

`services/promotion-type.service.ts` and `mock-data.ts` **both still exist**.

- `mock-data.ts` still exists in the directory (seed dataset,
  `mockPromotionTypes: PromotionTypeResponse[]`).
- `USE_MOCK_PROMOTION_TYPE_DATA` **still exists** in
  `promotion-type.service.ts:25`, currently set to `false`:
  ```ts
  // 2026-10-23 cutover: BE contract confirmed live, see Sprint 3 report
  // addendum. Kept as a flag (not removed) so a regression can flip back to
  // mock data for FE-only debugging without reverting this file.
  const USE_MOCK_PROMOTION_TYPE_DATA = false;
  ```
- Every exported function (`getPromotionTypes`, `getPromotionTypeById`,
  `updatePromotionType`, `createPromotionType`,
  `togglePromotionTypeStatus`) still has the shape:
  ```ts
  if (USE_MOCK_PROMOTION_TYPE_DATA) {
    return <mock branch>;
  }
  const response = await window.apiFetcher.<verb>(...);
  return requirePromotionTypeApiResponse(response);
  ```
  So **with the flag at `false`, every call does reach `ApiFetcher`
  unconditionally at runtime** — the mock branch is dead code on this path —
  but the call is **not unconditional in the source**; the conditional
  mock branch and `mock-data.ts` are still live in the codebase, not removed.
- `BASE_PATH = 'api/admin/portal/v1/offer-types'` (`promotion-type.service.ts:19`)
  — matches the expected cutover path.

**Verdict:** flag correctly flipped to `false` and `BASE_PATH` correct, but
the mock scaffold (flag, `mock-data.ts`, five `if (USE_MOCK...)` branches,
`MOCK_ACTOR`, `throwMockDuplicateCodeError`, etc.) was never deleted. This
was a deliberate choice per the code's own comment ("kept as a flag... for
FE-only debugging"), not an oversight discovered just now — but it means the
module is not yet in its target, mock-free end state.

## 3. CodeInput/CodeField merge — PASS (already merged)

`PromotionTypeCodeInput.tsx` does **not** exist. Only `PromotionTypeCodeField.tsx`
(65 lines) and `PromotionTypeCodeField.module.scss` (54 lines) exist in
`components/`. The merge reported in a prior session is confirmed present on
disk under the current commit history (see §5 — `ca253b95`, `e859c060`).

Current component files with line counts (`.tsx`/`.scss` under `components/`):

| Lines | File |
|---|---|
| 9   | `PromotionTypeCreateDrawer/styles.module.scss` |
| 26  | `PromotionTypeNameField/index.tsx` |
| 31  | `PromotionTypeMechanismField/styles.module.scss` |
| 38  | `PromotionTypeTableSection/styles.module.scss` |
| 46  | `PromotionTypeDetailDrawer/styles.module.scss` |
| 49  | `PromotionTypeDescriptionField/styles.module.scss` |
| 53  | `PromotionTypeMechanismField/index.tsx` |
| 54  | `PromotionTypeCodeField.module.scss` |
| 59  | `PromotionTypePriorityMaxItemsRow/styles.module.scss` |
| 65  | `PromotionTypeCodeField.tsx` |
| 74  | `PromotionTypeDescriptionField/index.tsx` |
| 75  | `PromotionTypeStatusToggle.tsx` |
| 104 | `PromotionTypePriorityMaxItemsRow/index.tsx` |
| 197 | `PromotionTypeTableSection/index.tsx` |
| 229 | `PromotionTypeCreateDrawer/index.tsx` |
| 465 | `PromotionTypeDetailDrawer/index.tsx` |

Note: `PromotionTypeStatusField.tsx` (previously merged into
`PromotionTypeCreateDrawer/index.tsx` per a prior session) is also absent,
consistent with that merge having landed.

## 4. Exercised against real dev API — NOT DONE (no record)

**No record of this module having been exercised against the real dev API
for any of list/create/view/edit/toggle.** Every prior report in
`docs/reports/` that touches this module explicitly and repeatedly flags
"not verified live" / "no browser was used" (e.g.
`2026-10-21-sprint3-promotion-type-create.md` lines 184, 325, 435, 581, 698,
787, 842, 948, 1021, 1069, 1092, 1141-1142, 1213, 1269). This environment has
no interactive browser session and no MSAL credentials, per those same notes.
Stating explicitly rather than assuming: **this has not been done.**

## 5. Git state for this module

```
$ git log --oneline -10 -- src/modules/products/promotion-management/promotion-type/
e859c060 refactor: replace PromotionTypeCodeInput with PromotionTypeCodeControl for improved focus handling and input...
ca253b95 refactor: consolidate promotion type code input handling and styles into a single component
92cb5615 refactor: update promotion management constants and API paths to reflect backend changes
a8c6bcdd feat(promotion-management): update textarea padding and z-index for improved label visibility
1a16b633 feat(promotion-management): enhance layout and z-index for input components to improve visibility and alignment
adaf1f3c feat: update promotion management forms with floating labels and improved layout for better user experience
78617353 feat: enhance promotion management with new fields and components for better CRUD operations
596d8bab feat: add promotion management pages and components for CRUD operations
137e6a9c feat: add promotion type detail drawer and related components
ed18d0c1 feat: add promotion management module with CRUD functionality and permissions
```

```
$ git status
nothing to commit, working tree clean
```

**All of this work is committed** — the working tree is clean and the branch
is up to date with `origin/feature/vuongnq/loai-uu-dai_2091`. Nothing from
the sessions described in prior summaries is sitting uncommitted.

## Summary table

| Check | Result |
|---|---|
| 1. Permission constant values | PASS — exact match |
| 2. Service file: no mock scaffold | **FAIL** — flag + `mock-data.ts` + conditional branches still present (flag is `false`, so runtime calls `ApiFetcher` unconditionally today) |
| 3. CodeInput/CodeField merge | PASS — merged, `CodeInput.tsx` gone |
| 4. Exercised against real dev API | **NOT DONE** — no record, explicitly flagged in every prior report |
| 5. Committed vs uncommitted | **Fully committed**, working tree clean |
