# PromotionTypeDetailDrawer clean-code audit (read-only)

Date: 2026-10-26
File audited: `src/modules/products/promotion-management/promotion-type/components/PromotionTypeDetailDrawer/index.tsx`
Current size: 386 lines (the summary's "~465" is stale — current file is 386 lines, 1 default export + 1 local `ReadOnlySection` helper).

No code was changed in this pass. Findings are ranked by impact (complexity
reduction) first, cosmetic last.

## 1. Single-responsibility — HIGH IMPACT

The component currently owns, in one function body (lines 65–377):

- data fetching: `useQuery` (`detailQuery`, line 79)
- mutation wiring: `useUpdatePromotionTypeMutation` (line 80)
- permission checks: `canEdit`, `canViewPromotionList` (lines 70, 74)
- form state: `Form.useForm`, `baselineRef`, `isDirty`, `submitError` (lines 81–84)
- dirty-tracking derivation: `handleValuesChange` (lines 91–95)
- two separate discard-confirmation flows: `requestClose` (97–116) and
  `requestCancelEdit` (130–149), each opening the same `ModalContent` with the
  same copy but different `onConfirm` (close vs. revert)
- submit orchestration: `handleFinish` (151–183), including Zod validation,
  request mapping, cache/baseline sync, and API-error-to-field mapping
- navigation: `navigate(...)` for "Xem trong Danh sách ưu đãi" (line 347)
- View-mode and Edit-mode JSX (223–374), including the duplicated status-badge
  block (see Finding 2) and the items/system-info read-only sections

This mixes three different kinds of concerns: **state/orchestration** (query,
mutation, form lifecycle, dirty tracking, confirms), **permission gating**,
and **presentation** (two full render branches). Following the pattern already
used in this module (`PromotionTypeNameField`, `PromotionTypeCodeField`,
`PromotionTypePriorityMaxItemsRow`, `PromotionTypeStatusToggle`), the
state/orchestration layer is the clearest extraction candidate.

**Concrete proposal:**

- New hook `hooks/usePromotionTypeDetailDrawer.hook.ts`, taking `{ id, onClose }`
  and returning: `{ promotionType, isLoading, loadError, mode, setMode, canEdit,
  canViewPromotionList, form, isDirty, submitError, updateMutation, requestClose,
  requestCancelEdit, handleFinish, navigateToPromotionList }`. This moves
  lines 65–183 (roughly 120 lines of state/handler logic) out of the component
  body, leaving `PromotionTypeDetailDrawer` to call the hook once and render.
- `PromotionTypeDetailDrawer/index.tsx` keeps only JSX: the `Drawer` shell,
  `extra`/`footer` branching, and the two render branches — estimated
  **380 → ~230 lines** for the component file, plus a new hook file of
  **~130–150 lines** (it absorbs the two `ModalContent` confirm blocks verbatim,
  so total LOC is roughly flat; the gain is cohesion/testability, not line count).
- Hook-extraction risk is LOW: `useModal`, `App.useApp`, and all mutation/query
  calls are already hook calls today: moving them into a wrapping custom hook
  does not change the Rules-of-Hooks position (still called unconditionally at
  the top of a component/hook), and nothing here depends on JSX closures.
- This is consistent with `.claude/rules/07-component.md`'s ~200-line review
  trigger and with `04-state-management.md`'s existing hook-wrapper convention
  for query-adding logic.

## 2. Duplicated JSX — status badge rendered twice — MEDIUM-HIGH IMPACT

Lines 273–283 (inside the Edit-mode header `Row`, status column) and lines
313–322 (inside the View-mode block) render **the identical** `StatusBadge`
construction:

```tsx
<StatusBadge
  variant={promotionType.status === PROMOTION_TYPE_STATUS.ACTIVE ? 'success' : 'neutral'}
  label={t(
    promotionType.status === PROMOTION_TYPE_STATUS.ACTIVE
      ? 'PromotionManagement.promotionType.status.active'
      : 'PromotionManagement.promotionType.status.inactive'
  )}
/>
```

Only the wrapping `<div className={styles.label}>...</div>` differs (Edit mode
has no icon-less label row, View mode wraps it in a `ReadOnlySection`-shaped
`<div>` instead of using `ReadOnlySection` itself — itself a minor
inconsistency, see Finding 3).

**Concrete proposal:** extract a small local helper in the same file (not a
new shared component — this is single-feature, status-derivation logic, not
reusable UI per `.claude/rules/07-component.md`'s ~50-line single-use
threshold):

```tsx
function PromotionTypeStatusBadge({ status }: { status: PromotionTypeStatus }) {
  const isActive = status === PROMOTION_TYPE_STATUS.ACTIVE;
  return (
    <StatusBadge
      variant={isActive ? 'success' : 'neutral'}
      label={t(isActive ? 'PromotionManagement.promotionType.status.active' : 'PromotionManagement.promotionType.status.inactive')}
    />
  );
}
```

Removes ~10 duplicated lines and the two independent places a future status
variant (e.g. a third status) would otherwise need editing in lockstep.

## 3. View/Edit header status markup inconsistency — LOW-MEDIUM IMPACT

Lines 270–284 (Edit-mode status column) use a raw `<div className={styles.field}><div className={styles.label}>...` block, while lines 294–324 (View mode) use the shared local `ReadOnlySection` component for `priority`/`maxItems` but *not* for `status` (status still gets the same raw hand-rolled `<div className={styles.field}>` markup as Edit mode). Since `ReadOnlySection` already exists in this same file (379–386) and is reused three times for plain text, inconsistent reuse for the badge case is a minor readability gap — not a functional bug, since `StatusBadge` is a node, not a string, which is presumably why `ReadOnlySection` (typed `value: string | number | null`) wasn't used for it.

**Concrete proposal:** either loosen `ReadOnlySection`'s `value` type to
`React.ReactNode` (so the status rows can go through it too and the two badge
sites collapse into `<ReadOnlySection label={...} value={<PromotionTypeStatusBadge status={promotionType.status} />} />`), or leave `ReadOnlySection` string-only and accept the dedicated `PromotionTypeStatusBadge` call as a sibling pattern. Either resolves the inconsistency; the first is slightly larger surface area (widens `ReadOnlySection`'s contract) for marginal gain, so this is ranked low — cosmetic/consistency, not a complexity reduction.

## 4. Two near-identical discard-confirm flows — MEDIUM IMPACT

`requestClose` (97–116) and `requestCancelEdit` (130–149) each build the exact
same `ModalContent` (same title/content/cancelText/confirmText keys), differing
only in the dirty-check scope (`mode === 'edit' && isDirty` vs. just `isDirty`)
and the `onConfirm` action (`onClose()` vs. `revertToView()`).

**Concrete proposal:** factor a single helper —

```tsx
const confirmDiscardIfDirty = (onConfirmed: () => void) => {
  openModal(
    <ModalContent
      title={t('PromotionManagement.promotionType.confirm.discardTitle')}
      content={t('PromotionManagement.promotionType.confirm.discardDescription')}
      cancelText={t('PromotionManagement.promotionType.confirm.discardCancel')}
      confirmText={t('PromotionManagement.promotionType.confirm.discardConfirm')}
      onCancel={closeModal}
      onConfirm={() => { closeModal(); onConfirmed(); }}
    />
  );
};

const requestClose = () => (mode === 'edit' && isDirty ? confirmDiscardIfDirty(onClose) : onClose());
const requestCancelEdit = () => (isDirty ? confirmDiscardIfDirty(revertToView) : revertToView());
```

Removes ~20 duplicated lines and the risk of the two copies' copy/behavior
drifting apart in a future edit (already a near-miss: both use identical i18n
keys today, so nothing currently distinguishes "close the drawer" wording from
"cancel edit" wording — worth flagging to product/i18n owners as a
`NEEDS-TEAM-DECISION` if they are ever meant to read differently, not this
audit's call).

## 5. Comments — mostly load-bearing, one borderline — LOW IMPACT

- Lines 42–43, 71–73, 75–77, 118–122, 166–170 are genuine rationale comments
  (why View is the default, why two confirm flows exist, why a successful save
  returns to View) — these satisfy `.claude/rules/00-general.md`'s "why, not
  what" bar and should be kept as-is, including after any extraction (move with
  the code they annotate).
- No dead code, no unused props/state, no leftover debug/narrative comments
  (`// added`, commented-out blocks) were found in this file.
- One comment is borderline: lines 118–122 justify why `revertToView` exists
  separately from `onClose`-based close — useful context, but it duplicates
  what Finding 4's extraction would already make self-evident from the two
  call sites' arguments (`confirmDiscardIfDirty(onClose)` vs.
  `confirmDiscardIfDirty(revertToView)`). If Finding 4 is applied, shorten this
  comment rather than deleting it outright — the "why a second flow exists at
  all" rationale is still non-obvious and worth keeping.

## 6. Inline handlers — LOW IMPACT (cosmetic)

All handlers (`handleValuesChange`, `requestClose`, `revertToView`,
`requestCancelEdit`, `handleFinish`) are already named top-level `const`s, not
inline JSX closures — this file already follows the convention
`.claude/rules/07-component.md` asks for (hooks/derived values, then
handlers, then JSX). No further inline-extraction is needed here; the one
remaining inline arrow is the trivial `onClick={() => setMode('edit')}` (line
205) and `onClick={() => navigate(...)}` (line 347), both one-line and not
worth naming separately.

## Summary / ranking

| # | Finding | Impact | Est. effect |
|---|---|---|---|
| 1 | Extract `usePromotionTypeDetailDrawer` (state/query/mutation/confirm/submit) | HIGH | 386 → ~230 lines in this file; new ~130–150 line hook file; main testability gain |
| 2 | Deduplicate the two identical `StatusBadge` blocks | MEDIUM-HIGH | −~10 lines, removes a lockstep-edit risk |
| 4 | Deduplicate the two discard-confirm flows into one helper | MEDIUM | −~20 lines, removes a copy-drift risk |
| 3 | `ReadOnlySection`/status markup inconsistency | LOW-MEDIUM | cosmetic consistency only |
| 5 | Comment quality | LOW | no cleanup required; one comment to shorten if Finding 4 lands |
| 6 | Inline handler extraction | LOW | already compliant, nothing to do |

No fix was applied in this pass. If the hook extraction (Finding 1) is
approved, Findings 2 and 4 should be folded into the same change rather than
done separately, since the helpers they introduce (`PromotionTypeStatusBadge`,
`confirmDiscardIfDirty`) naturally live on either side of that same hook/
component split (`confirmDiscardIfDirty` belongs inside the new hook;
`PromotionTypeStatusBadge` stays in the presentational component).
