# Promotion M0 scaffolding

> **Note (2026-10-27):** This file did not exist in the checkout when the M14
> entry below was requested to be appended to it. Per `CLAUDE.md`'s guidance
> that a missing referenced path is not a blocker, this file was created to
> hold the M14 section rather than treating the request as blocked. No M0–M13
> history exists here; see `docs/reports/2026-10-20-plan-promotion-mock-first.md`
> and the other `docs/reports/2026-10-2*-*promotion*` files for that history.

## M14 - form layout rearrange per mockup

### Scope

Reorganized `OfferForm`
(`src/modules/products/promotion-management/promotion/components/OfferForm/index.tsx`)
into 3 mockup-matching section groupings, each rendered with the existing
shared `FormSection` (`@/components/forms/form-section`) card wrapper and
`FormTitle` (`@/components/titles/form.title`) header — both already used
across other modules for this exact purpose, so no new component was created.
Added 3 new i18n keys (`PromotionManagement.promotion.section.classification`
/ `.displayContent` / `.scope`) to both `vi.json` and `en.json`.

### Before

Flat sequence, no grouping/headers:

1. `name` (full width)
2. `description` (full width)
3. Row: `offerTypeId` | `priority`
4. Row: `mechanism` | `giftProductType`
5. `cardIds` + `OfferScopePreviewTable`
6. Row: `effectiveFrom` | `effectiveTo`, shared hint below
7. `image` (full width, last)

### After

1. **"Phân loại" / "Classification"** — Row: `offerTypeId` | `mechanism`
   (unchanged Radio.Group; added a `LockOutlined` icon next to the field
   label when `isReadOnly('mechanism')`, matching the mockup's
   disabled-radio/lock presentation. No change to disabled logic, options,
   or values.)
2. **"Nội dung hiển thị" / "Display content"** — Row: `name` | `image`
   (moved next to `name`, unchanged validation/behavior), then `description`
   full width, then `priority` below.
3. **"Phạm vi & giá trị" / "Scope & value"** — Row: `giftProductType` |
   `cardIds` (`GiftCardMultiSelect`), then `OfferScopePreviewTable`
   (unchanged, kept directly under the row it previews), then Row:
   `effectiveFrom` | `effectiveTo` with the shared dates hint below.

All field names, `Form.Item` bindings, validation, disabled/read-only logic,
and the mutation/mapper contracts are unchanged. Only JSX position and the
added section chrome changed.

### Finding: `giftProductType` vs. `offerProductType` naming (task step 2)

The task asked to check whether the mockup's "Loại sản phẩm tặng kèm*"
control is actually the BE-confirmed `offerProductType` field, not the
FE-local `giftProductType` field. Investigation:

- `OfferFormValues`, `OfferResponse`, `OfferUpsertRequest`
  (`types/promotion.types.ts`) and the mapper/defaults/validation files all
  use `giftProductType`, currently a `Select` hardcoded to a single option
  (`GiftProductType.CARD = 'Thẻ'`, `constant.ts`). No `OfferProductType`
  constant with `'CD'/'CL'` values exists anywhere in
  `src/modules/products/promotion-management/promotion/` — that part of the
  task's premise does not match current source.
- `constant.ts`'s `OFFER_SORT_FIELDS` and `OFFER_TRACKED_FIELDS` — both lists
  explicitly annotated "BE-confirmed" — list `offerProductType`, not
  `giftProductType`.
- `vi.json`/`en.json` confirm the same Vietnamese/English label
  ("Loại sản phẩm tặng kèm" / "Gift product type") is used for both
  `field.giftProductType` **and** `history.field.offerProductType`.

This is strong evidence that `giftProductType` is the FE's own, unreconciled
stand-in for the real BE field `offerProductType`, and that the two have
likely been the same field under two different names since the write-path
contract was drafted as a guess (`types/promotion.types.ts`'s top-of-file
DRAFT CONTRACT note). **This was not acted on**: the field key, its `Select`
widget, and its options were left exactly as they were — renaming/merging it
to `offerProductType` would change the request/response/history contracts
this task was not scoped to touch, and step 2 explicitly asked to flag, not
silently resolve, this. **NEEDS-TEAM-DECISION:** reconcile `giftProductType`
and `offerProductType` into one field/name before the real write-path
contract is locked in.

### Other mockup/source mismatches found and not acted on

- The mockup's "Loại sản phẩm tặng kèm*" row is a **Thẻ/Vay radio** paired
  with the gift-card multi-select. The current `giftProductType` control is
  kept as the existing `Select` (not converted to `Radio.Group`): per task
  step 5 ("pure visual reorganization, not a behavior change"), and because
  a literal Thẻ/Vay radio would need a second option value that does not
  exist in the `GiftProductType` constant (only `CARD` is defined this
  sprint) — adding one would be inventing business logic, not relocating
  existing UI. Only its position moved, next to `cardIds`.
- `name` and `priority` were described as having "existing hint text" in the
  task, but neither field currently renders an `extra`/hint in `OfferForm` or
  has a corresponding `hint.*` i18n key. Left as-is; no hint text was
  invented.
- `effectiveFrom`/`effectiveTo` were described as needing "hint text under
  each", but only one shared `hint.dates` key/string exists today, covering
  both fields together. Kept as a single shared hint below the row rather
  than fabricating two new, unreviewed hint strings.
- The mockup's "Trạng thái" (status) toggle was **not** added inside
  `OfferForm`. Status is already toggled outside the form, as a page-level
  action (`PromotionEditPage`'s `Switch` bound to
  `action.toggleStatus`, and the same control in `OfferDetailTabs`), not an
  AntD `Form.Item`. Adding a second status control inside `OfferForm` would
  create two owners for the same field and was out of scope for a layout-only
  pass.
- The mockup's new "Mã | Sản phẩm vay | Đang tặng kèm thẻ | Toggle Ưu đãi
  tặng kèm" table was intentionally not built, per task step 4 — no known
  backing API. `OfferScopePreviewTable` was kept, unchanged, in the new
  "Phạm vi & giá trị" section.

### Validation

- `npm run typecheck` — passes (both `tsconfig.app.json` and
  `tsconfig.node.json` project references).
- `npm run lint` (ESLint on the changed file) — 0 errors, 0 warnings.
- `npm run prettier -- --check` (changed files) — all formatted.
- `npm run build` — succeeds (pre-existing large-chunk warnings only,
  unrelated to this change).
- Not verified: rendered layout, responsive behavior, and the lock icon's
  visual placement were not opened in a browser (`app_locale=vi` and
  `app_locale=en` for the new section headers, and the create/edit/view
  variants of `OfferForm`). A human should open
  `PromotionCreatePage`/`PromotionEditPage` under both locales to confirm the
  three sections render as intended and that `FormSection`/`FormTitle`
  spacing looks right next to the unchanged `OfferScopePreviewTable`.

## 2026-10-29 - PromotionImagePicker visual alignment with UploadFileComp

Scope: visual markup/styling only. Upload timing is unchanged.
(The reference module is `src/modules/products/configuration/display-information-set/`,
which renders the shared `src/components/upload/index.tsx` `UploadFileComp`.)

### Matched from UploadFileComp (single-image case)

- 8rem x 8rem square tile, white background, 2px dashed `#dc2626` border,
  0.4rem radius, pointer cursor.
- Empty state: `Icon type='image'` (20x20, fill `#DC2626`) over the
  `t('uploadLabel')` label (reused existing flat key, shared by other
  modules), red, centered, stacked.
- Caption row below the tile: "Allowed formats: ..." built from
  `OFFER_IMAGE_ACCEPT` (so it cannot drift from validation). New keys
  `PromotionManagement.promotion.hint.imageFormats` (with `{{formats}}`) and
  `hint.imagePending`, added to both `vi.json` and `en.json`. Size (WxH) was
  not copied: the rule here is 1:1 / 100 KB, covered by the existing
  `hint.image` text under the field.
- Remove button kept (`Button` + `deleteOutline`), now a sibling of the tile
  positioned at its top-right corner.

### Intentionally NOT copied

- AntD `Upload` / `UploadFileComp`: it posts to `api/admin/file` inside
  `handleChange` immediately on pick, which would leave orphaned files when the
  form is abandoned. The component still uses a plain `<input type=file>` +
  `div[role=button]` + `img`, validates via `validatePromotionImage`, holds the
  raw `File` (or URL string) in form state, and the form uploads at submit.
- AntD's hover overlay (preview/eye + delete icons): tied to `Upload` internals.

### Side change

The remove `Button` previously lived inside the clickable dropzone, so its
click bubbled to `openPicker` (opening the file dialog on remove). Moving it
outside the dropzone fixes that as a consequence of the corner placement.

### Flagged inconsistency: pending vs persisted

In `UploadFileComp` a thumbnail on the tile means the upload already finished.
Here a thumbnail can be a picked `File` that is NOT yet persisted, so the same
look could mislead users. Final version distinguishes them:

- Persisted URL: solid light-grey border (`.saved`).
- Picked, unsubmitted `File`: keeps the dashed red border and shows an amber
  line below the tile ("Not saved yet - uploaded when you save the offer").

Residual risk: this is a text plus border cue only; the thumbnail itself looks
the same and the cue is subtle. It differs from the reference module's
visuals by design. Also, the caption partly overlaps the form's existing
`hint.image` text (formats appear in both); left as is, as a copy decision.

### Validation

- `npm run typecheck`: passes.
- ESLint on `PromotionImagePicker/index.tsx`: clean.
- Prettier check on the component folder: passes.
- `npm run build`: succeeds (chunk-size warnings only).
- Both lang files contain the two new keys with the same `{{formats}}`
  placeholder (checked by loading both JSON files).
- NOT verified in a browser: rendered tile, hover/focus, disabled state,
  corner remove button placement, pending vs saved visuals, `vi`/`en` copy in
  create/edit/view of `OfferForm`.

## 2026-10-29 — Follow-up: full replacement considered, rejected (NEEDS-TEAM-DECISION)

A follow-up request asked to delete `PromotionImagePicker` entirely and wire
`OfferForm` to the same image-upload component `display-information-set`
uses, matching that module's integration directly, conditional on that
component deferring its upload to form submit the same way Offer's picker
currently does.

Checked: `display-information-set`'s image field
(`components/DisplayInformationSetGeneralForm.tsx`, the `imageUrl` /
`imageStorageKey` `Form.Item`) imports and renders
`UploadFileComp` from `src/components/upload/index.tsx` directly. There is no
module-local picker in `display-information-set` — `UploadFileComp` IS the
component in question.

`UploadFileComp.handleChange` (`src/components/upload/index.tsx`) calls
`apiFetcher.post('api/admin/file?category=...', formData, ...)` synchronously
inside its AntD `Upload` `onChange` handler, i.e. on file pick, before any
form submission. This is upload-on-pick, not defer-to-submit.

This is the same timing behavior an earlier explicit decision rejected
`UploadFileComp` for in this module (risk of orphaned uploaded files if the
Offer form is abandoned after a file is picked but before submit).

**Decision: did not replace.** Swapping `PromotionImagePicker` for
`UploadFileComp` would silently change Offer's upload-timing behavior as a
side effect of a styling/consistency request, which is explicitly out of
scope here. `PromotionImagePicker` is kept as-is (visually aligned per the
section above, still defer-to-submit).

**NEEDS-TEAM-DECISION:** if full component-level consistency with
`display-information-set` is wanted for the Offer image field, the team must
decide whether to accept upload-on-pick for Offer (and handle orphaned-file
risk some other way — e.g. a cleanup job, or deleting unsubmitted uploads on
form abandon), or keep Offer's defer-to-submit contract and accept that it
cannot structurally match `UploadFileComp`/`display-information-set` beyond
visual styling. No code change was made pending that decision.

## 2026-10-29 — PromotionImagePicker replaced with UploadFileComp

Supersedes and completes the "Follow-up: full replacement considered,
rejected (NEEDS-TEAM-DECISION)" section above: the user explicitly overrode
that decision and accepted its tradeoffs.

### What was deleted, and why

- `promotion/components/PromotionImagePicker/` (`index.tsx`,
  `styles.module.scss`), replaced in `OfferForm` by the shared
  `UploadFileComp` (`src/components/upload/index.tsx`), wired like
  `display-information-set`.
- The deferred-upload pipeline, now dead because upload happens on pick:
  `resolveOfferImageKey` (mapper), `useUploadOfferImageMutation` (hook),
  `uploadOfferImage` (service and its `services/index.ts` export),
  `OfferImageUploadResponse` (type), and the submit-time upload try/catch in
  both pages. Each was grep-confirmed to have no other consumer.
- `OFFER_IMAGE_UPLOAD_CONTEXT` (`'OFFER'` in a `metadata` blob part) was
  replaced by `OFFER_IMAGE_UPLOAD_CATEGORY = 'OFFER'`, sent as
  `api/admin/file?category=OFFER` by `UploadFileComp`.

### Wiring

- `image` is now `string | null` (type, `z.string().nullable()` schema,
  defaults unchanged at `null`). `imageKey` is a non-rendered form field set
  via `onKeyChange={(key) => form.setFieldValue('imageKey', key || null)}`
  and read through `getFieldsValue(true)`.
- `validateFile` runs `validatePromotionImage` (unchanged), surfaces its
  `OfferImageError` through the existing `handleImageError` field error, and
  returns `valid`. `maxFileSizeKB` is not passed (the validator already checks
  size), so `UploadFileComp`'s `onValidationError` would never fire and is not
  wired. `acceptType` is `[...OFFER_IMAGE_ALLOWED_EXTENSIONS]`, `isShowSize`
  is false, `disabled={isReadOnly('image')}`. `OFFER_IMAGE_ACCEPT` is now an
  unused export (left in place).
- `UploadFileComp` reports removal as `onChange('')` and `onKeyChange('')`.
  Both pages submit `validated.imageKey || null`, and the dirty helper
  compares `image` with `|| null` on both sides, so removal sends
  `imageKey: null` and an empty string never counts as a change from `null`.

### Accepted tradeoffs (user-confirmed)

- Upload-on-pick: a picked file is uploaded immediately. Abandoning or
  failing the form leaves an unreferenced file. No cleanup was built (out of
  scope). In the code read (`UploadFileComp`, the page and form code), no
  cleanup or expiry for unreferenced uploads is visible. Whether the backend
  has any is not knowable from the frontend.
- Wire format: `category=OFFER` query param replaces
  `metadata.context='OFFER'`. User-confirmed acceptable. Not verified that the
  backend accepts `OFFER` as a category.
- `UploadFileComp` swallows upload errors (logs to console only), so the old
  `imageUploadFailed` message has no replacement.

### Files changed

- `promotion/components/PromotionImagePicker/*`: deleted.
- `promotion/components/OfferForm/index.tsx`: renders `UploadFileComp`; adds `validateImage`.
- `promotion/types/promotion.types.ts`: `image: string | null`; removed `OfferImageUploadResponse`; comments updated.
- `promotion/constant.ts`: `OFFER_IMAGE_UPLOAD_CONTEXT` replaced by `OFFER_IMAGE_UPLOAD_CATEGORY`.
- `promotion/utils/promotion-offer-create.validation.ts`: `image` schema is `z.string().nullable()` (the edit schema spreads the same base shape; no separate `image` handling).
- `promotion/utils/offer-dirty.helper.ts`: `image` comparison normalizes `''` to `null`; comment fixed.
- `promotion/utils/promotion.mapper.ts`: removed `resolveOfferImageKey`.
- `promotion/hooks/promotion.queries.hook.ts`: removed `useUploadOfferImageMutation`.
- `promotion/services/promotion.service.ts`, `services/index.ts`: removed `uploadOfferImage`.
- `promotion/views/PromotionCreatePage/index.tsx`, `PromotionEditPage/index.tsx`: removed upload wiring; use `validated.imageKey || null`.
- `src/lang/vi.json`, `src/lang/en.json`: key removals below.

### i18n

Added: none. Removed from both files (grep-confirmed unreferenced across
`src/`): `PromotionManagement.promotion.hint.imageFormats`,
`hint.imagePending`, `action.chooseImage`, `action.removeImage`,
`error.imageUploadFailed`. Kept `hint.image`. The `PromotionManagement`
subtree has an identical key set in vi and en (193 keys).

### Validation

- `npm run typecheck`: passed.
- `npm run lint`: passed (`--max-warnings 0`).
- `npm run build`: succeeded (only the pre-existing chunk-size warning).
- Prettier check on changed `.ts`/`.tsx` files: clean.

### Not verified (no browser run)

The upload call succeeding against `category=OFFER`; create, edit and
read-only rendering of the field (including preview of a saved URL and the
remove flow); the orphaned-file scenario; the field error display from
`validatePromotionImage`; vi/en copy rendering. No test runner exists.

## 2026-10-29 — PromotionImagePicker UI re-aligned to SplashScreenAssetUpload's pattern

Scope: internal rendering/markup only, inside `PromotionImagePicker`'s own
folder. No change to the props contract, `OfferForm`'s usage of the
component, validation (`validatePromotionImage`/`OfferImageError`), or the
defer-to-submit/custom-`uploadOfferImage`-service architecture (restored
earlier the same day after the `UploadFileComp` swap was reverted).

### What changed

Re-implemented the component's markup/styling to follow the structural
pattern of
`src/modules/system/splash-screen/components/SplashScreenAssetUpload.tsx`
(explicit reference given for this task):

- Switched from AntD `Upload`'s `listType='picture-card'` tile to
  `listType='text'` with a custom `itemRender`: a bordered row showing an
  `Icon type='image'`, the file name, and a remove button — same visual
  shape as `SplashScreenAssetUpload`'s file row (icon + name + remove,
  bordered card, same entrance keyframe animation).
- Replaced the empty-state `PictureOutlined` + custom `.placeholder` box with
  a `Button` ("Choose image"), matching `SplashScreenAssetUpload`'s "Choose
  file" `Button` affordance, shown only when no file is present
  (`fileList.length === 0`).
- Switched styling from the component's own `styles.module.scss` (now
  deleted) to Emotion (`css`/`keyframes` from `@emotion/react`, with the
  `/** @jsxImportSource @emotion/react */` pragma), matching the reference
  file's styling approach. Per `.claude/rules/10-styling.md`, Emotion remains
  available for existing/matched patterns; this is not a repository-wide
  styling migration, just following the explicitly named template file.
- `beforeUpload` now always returns `Upload.LIST_IGNORE` (never `false`):
  the component no longer lets AntD's `Upload` own any internal `fileList`
  state at all — `fileList` is fully derived from the `value` prop (plus the
  locally-held preview object-URL) on every render, the same way
  `SplashScreenAssetUpload` derives its `fileList` from `value` via
  `useMemo` rather than tracking AntD's own `onChange(info)` list mutations.
  This removes the earlier `onChange`-driven `setFileList` path entirely (it
  was flagged by a reviewer as a possible source of flicker/duplicate items
  when it fought with the value-driven effect); there is now exactly one
  source of truth for what's displayed.
- Kept (not part of this task, verified unchanged): the props contract
  (`value`/`onChange`/`onValidationError`/`disabled`/`allowRemove`), the
  object-URL create/revoke lifecycle for a picked `File`, validation via
  `validatePromotionImage`, the click-to-preview `Image` modal, and the
  `i18n` keys `action.chooseImage`/`action.removeImage` (both already present
  from the earlier revert, reused as-is — no new keys added, none removed).

### Deliberate differences from the reference file

- `SplashScreenAssetUpload` splits its contract into a `value`/`onChange`
  pair carrying a **preview URL string** plus a separate `onFileChange`
  prop carrying the **raw `File`**, so the raw file never enters AntD `Form`
  state. `PromotionImagePicker` was NOT changed to this split-contract
  shape: its `value`/`onChange` still carry the raw `File | string | null`
  directly, unchanged from before this task. Adopting the split-contract
  shape would require changing `OfferForm`'s `Form.Item` wiring, the
  `imageKey` plumbing, and possibly `OfferFormValues`/the dirty-check/mapper
  again — out of scope for a UI-pattern-matching request. Flagging this as
  a deliberate, not-yet-reconciled difference: if full architectural
  consistency with `SplashScreenAssetUpload` is wanted later, this
  split-contract change would be the remaining piece, and is
  `NEEDS-TEAM-DECISION` if desired.
- Kept the click-to-open `Image` preview modal (not present in
  `SplashScreenAssetUpload`, which handles non-visually-previewable Lottie
  JSON/static assets). This is a deliberate, sensible addition for an actual
  image field, not an oversight.

### Validation

- `npm run typecheck`: passes.
- `npx eslint` on `PromotionImagePicker/index.tsx` (`--max-warnings 0`):
  0 errors, 0 warnings.
- `npx prettier --check` on the same file: formatted correctly.
- `npm run build`: succeeds (pre-existing chunk-size warnings only).
- NOT verified in a browser: rendered file row, "Choose image" button,
  remove button and its `allowRemove`/`disabled` gating, the preview modal,
  and the four `OfferImageError` validation messages. A human should open
  `PromotionCreatePage`/`PromotionEditPage` to confirm these.

## M15 - fix effectiveFrom/effectiveTo datetime validation (BE 111/112)

### Symptom

In the Offer Create/Edit form, the `effectiveFrom`/`effectiveTo` validation
(backend error codes `PORTAL_CV_OFFER_111`, "effectiveTo must be after
effectiveFrom", and `PORTAL_CV_OFFER_112`, "effectiveTo must be in the
future") gave wrong results specifically when the user picked the hour/minute
portion of the date-time picker, not just the date.

### Root cause

`promotion.mapper.ts` carried a "midnight means date-only" heuristic: any
`effectiveTo` picked at exactly `00:00:00.000` was silently rewritten to
`23:59:59.999` of the same day, via a file-local `isMidnight` helper, before
`toFromIso`/`toToIso` converted the value to the ISO string used by both
validation and the API payload. The intent (per the removed comment) was to
treat an exact-midnight value as "no time chosen" and default it to end of
day.

That assumption was never true for this form. `OfferForm/index.tsx` renders
both pickers with `showTime={{ format: 'HH:mm', defaultValue: MIDNIGHT }}` —
there is no date-only input mode here, so `00:00` is just an ordinary,
possibly-deliberate time choice, indistinguishable from "no time picked" at
the mapper layer. Two concrete defects followed:

- **False negatives in both rules.** `isEffectiveRangeInvalid` (111) and the
  edit-only future check (112) both compare the mapper's ISO output. An
  `effectiveTo` picked at midnight was always compared as `23:59:59.999`,
  so a range that was actually invalid (e.g. `effectiveFrom` 10:00,
  `effectiveTo` the same day at 00:00, which is really *before*
  `effectiveFrom`) silently passed.
- **Non-monotonic flips — the reported symptom.** Moving `effectiveTo`'s time
  from `00:00` to `00:01` dropped the compared instant from the rewritten
  `23:59:59.999` straight down to the literal `00:01`. A one-minute
  hour/minute-picker nudge could flip a passing validation to failing (or
  vice versa), which is what the user saw as "an error occurs when picking
  hour/minute."

Both `toFromIso`/`toToIso` also build the real `OfferUpsertRequest` payload
(`toUpsertPayload`), so the same heuristic silently changed what was sent to
the backend for this edge case, not just what the frontend validated.

### Fix

Removed `isMidnight` and the conditional rewrite branches. `toFromIso` and
`toToIso` (`promotion.mapper.ts`) now return the picked `Dayjs` instant's
literal ISO string with no rewriting:

```ts
export function toFromIso(value: Dayjs | null): string | null {
  if (!value) return null;
  return value.toISOString();
}

export function toToIso(value: Dayjs | null): string | null {
  if (!value) return null;
  return value.toISOString();
}
```

Function signatures are unchanged, so every caller (`isEffectiveRangeInvalid`
in both the create and edit schemas, the edit-only future-date check, and
`toUpsertPayload` for both create and update) is unaffected beyond now
comparing/sending the correct instant. Two comments in
`promotion-offer-create.validation.ts` and `promotion-offer-edit.validation.ts`
that referenced the removed "midnight-default"/"date-only to = end of day"
behavior were updated to stay accurate.

The `effectiveFrom` side of the old heuristic was already a no-op
(`value.startOf('day')` on an already-midnight value is identical to
`value`), so the real behavior change is scoped to `effectiveTo` at exactly
midnight. `isSameInstant`'s baseline-dirty check in the edit schema compares
raw `Dayjs` values directly and does not route through `toToIso`, so dirty
tracking is unaffected.

### Files changed

- `src/modules/products/promotion-management/promotion/utils/promotion.mapper.ts`
- `src/modules/products/promotion-management/promotion/utils/promotion-offer-create.validation.ts` (comment only)
- `src/modules/products/promotion-management/promotion/utils/promotion-offer-edit.validation.ts` (comment only)

### Non-goals

- `offerCreateFormSchema` still has no future-date (112-equivalent) check on
  create — a separate, pre-existing gap, not part of this fix.
- No change to `OfferForm/index.tsx`, the `DatePicker` wrapper, or
  `showTime`/`format` props.

### Validation

- `npm run typecheck`: passed.
- `npm run lint`: passed (`--max-warnings 0`).
- `npm run build`: succeeded (only pre-existing, unrelated chunk-size
  warnings).
- Reviewed by `frontend-reviewer`: verdict **PASS**, no required changes.
  Independently re-confirmed (by repo-wide grep) that no other code depends
  on the removed heuristic, and traced both consumers (`isEffectiveRangeInvalid`
  and `toUpsertPayload`) to confirm the fix is complete.
- Not runtime-verified: actual `DatePicker` interaction picking exactly
  `00:00`, the resulting payload in a live create/edit submit, and backend
  acceptance of a literal-midnight `effectiveTo`. No test runner exists in
  this repo (`.claude/rules/09-testing.md`); `toFromIso`/`toToIso`/
  `isEffectiveRangeInvalid` are recorded as `TEST-DEBT` candidates for future
  coverage.

### Compatibility note

An offer saved before this fix with `effectiveTo` picked at midnight was
persisted as `23:59:59.999`; loading it for edit still shows that stored
value as-is (no re-interpretation on read). Only new saves/edits that
deliberately pick exactly midnight for `effectiveTo` are affected going
forward — they are now sent and validated as literal midnight, which is the
intended fix.

## 2026-10-29 — PromotionImagePicker rewritten on Ant Design Upload (service/timing reverted)

### Context

The earlier `UploadFileComp` swap (and its removal of `uploadOfferImage`,
`resolveOfferImageKey` and the deferred-submit flow) was reverted by the
orchestrating session via `git checkout` back to the pre-swap committed
state. That revert happened before this task started; this task did not
perform it. This task's scope was only the internal rewrite of
`PromotionImagePicker` to use genuine Ant Design `Upload` instead of the
hand-rolled `<input>`/`div`, keeping the defer-to-submit timing and the
module's own `uploadOfferImage` service fully intact.

### Changed (inside `promotion/components/PromotionImagePicker/` only)

- `index.tsx`: hand-rolled hidden `<input type="file">` + `div[role=button]`
  + `<img>` + custom delete `Button` replaced by AntD `Upload`
  (`listType='picture-card'`, `maxCount={1}`, `accept={OFFER_IMAGE_ACCEPT}`),
  controlled via local `useState<UploadFile[]>` derived from `value`
  (string -> `status: 'done'`, `url`; `File` -> `status: 'done'`,
  `originFileObj`, object-URL `thumbUrl`, revoked in the effect cleanup).
  - `beforeUpload`: awaits `validatePromotionImage`; invalid ->
    `onValidationError(error)` + `Upload.LIST_IGNORE`; valid ->
    `onValidationError(null)`, `onChange(file)`, return `false` (no request;
    no `action`/`customRequest`/`apiFetcher`).
  - `onChange`: syncs local list; on removal of the last file calls
    `onValidationError(null)` and `onChange(null)`.
  - `onPreview`: AntD `Image` preview using the item's `url`/`thumbUrl`.
  - `disabled` forwarded; `allowRemove` via
    `showUploadList={{ showRemoveIcon: allowRemove && !disabled }}` (the old
    code also hid remove when disabled).
  - Removed `inputRef`, keyboard handler, `mounted` ref and `Icon`/`Button`
    imports. The stale-response guard is kept in reduced form (`pickId`
    ref): AntD does not serialize `beforeUpload`, and the select tile is
    hidden only after the first file lands, so two quick picks during async
    validation could otherwise race.
- `styles.module.scss`: removed `.fileInput`, `.dropzone`, `.disabled`,
  `.thumbnail`, `.fileInfo`; added narrowly scoped `:global(.ant-upload-*)`
  overrides under `.picker`, plus `.placeholder`/`.placeholderIcon`/
  `.previewHost`.

### Preserved unchanged

- Props contract (`value`, `onChange`, `onValidationError`, `disabled`,
  `allowRemove`) and the single default export.
- `validatePromotionImage` and `OfferImageError` keys/surfacing.
- Defer-to-submit: picking performs no network call; the raw `File` is
  reported via `onChange`; upload still happens at submit through
  `uploadOfferImage`.
- `OfferForm`, the submit flow, services, and every file outside this folder.
- Shared `UploadFileComp` is not imported.

### Validation

- `npm run typecheck`: passed. `npm run lint` (`--max-warnings 0`): passed.
  `npm run build`: succeeded (only pre-existing chunk-size warnings).
  Prettier applied to `index.tsx`.
- Not verified in a browser: picture-card dropzone rendering, thumbnail and
  preview modal, remove button (and its hiding via `allowRemove`/disabled),
  disabled state, and error display for each `OfferImageError` case
  (Format, Size, AspectRatio, Unreadable). Also unverified: that no network
  request fires on pick, and the edit-mode saved-URL tile.
