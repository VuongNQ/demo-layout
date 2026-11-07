# Sprint 3 — UC #2091 Promotion Type create (F-02)

Branch `feature/vuongnq/loai-uu-dai_2091`. Built against the Sprint 1/2 mock
data layer (`USE_MOCK_PROMOTION_TYPE_DATA = true` in
`services/promotion-type.service.ts`).

## [ASSUME] — read this first

**There is no real POST contract for this resource yet.** Unlike
Sprint 1/2 (whose GET/PUT/PATCH shapes came from a swagger file shared via
chat), nothing covering create was shared. The request/response shapes below
are inferred from the existing GET response's writable fields and must be
confirmed with BE before this ships:

- `CreatePromotionTypeRequest` (`types/promotion-type.types.ts`):
  `{ code, name, description, maxItems, priority, status }`.
- The backend error code assumed for a `code` uniqueness collision
  (`PORTAL_CV_OFFER_122`, VL-03) and its envelope shape
  (`{ code, message, details: [{ field: 'code', message }] }`,
  `constant.ts`'s `PROMOTION_TYPE_CODE_DUPLICATE_ERROR_CODE` and
  `services/promotion-type.service.ts`'s `throwMockDuplicateCodeError`).
- Default values on create (`priority` → 999 when empty, `maxItems` → `null`
  when empty, `status` → `ACTIVE` when omitted) are assumed to mirror the
  update form's established fallback rule
  (`PROMOTION_TYPE_PRIORITY_FALLBACK`), not confirmed independently for create.

Every one of these is marked `[ASSUME]` inline in the code
(`types/promotion-type.types.ts`, `services/promotion-type.service.ts`,
`constant.ts`) so they are easy to find once BE answers.

## What was built

1. **Service** (`services/promotion-type.service.ts`): `createPromotionType`
   with a mock branch (`createMockPromotionType`) and the real `ApiFetcher`
   POST branch (unreachable while the flag is `true`). The mock branch
   validates `code` uniqueness case-insensitively against the in-memory
   `mockPromotionTypes` array and throws an error shaped like a real
   `ApiFetcher` rejection (`{ response: { status: 409, data: { code, message,
   details } } }`) on collision, so `readApiErrorEnvelope`/
   `mapApiErrorDetailsToFieldErrors` — the real error-mapping path — is
   exercised by the mock exactly as it would be by a real 409. On success, a
   new record is appended with `id` = max existing id + 1, and the
   priority/maxItems/status defaults described above.

2. **Mutation hook** (`hooks/promotion-type.queries.hook.ts`):
   `useCreatePromotionTypeMutation`. On success, `invalidateQueries` on
   `lists()` only — there is no existing detail cache entry for a brand-new
   id to `setQueryData` into, unlike the update/toggle mutations. No toast
   inside the hook; the Drawer owns it.

3. **Validation** (`utils/promotion-type.validation.ts`):
   `promotionTypeCreateFormSchema` — VL-01 (name required/50 max), VL-02
   (`code` pattern `^[A-Z0-9_]{3,20}$`), VL-03's required-ness (uniqueness
   itself is the server-side check above, not a Zod rule), description
   (255 max), maxItems/priority (nullable, nonnegative/positive integer).
   `mapPromotionTypeCreateZodIssuesToAntdErrors` maps every Zod issue at once
   (not just the first) via the shared `mapApiErrorDetailsToFieldErrors`
   helper, same technique as Sprint 2's update schema.

4. **Error adapter** (`utils/promotion-type-api.error.ts`): added
   `PROMOTION_TYPE_CREATE_FORM_FIELDS` (includes `code`, unlike the update
   field set, since `code` is only ever editable on create) and
   `mapPromotionTypeCreateApiErrorToFields`.

5. **`components/PromotionTypeCodeInput`** (new, standalone `.tsx`): wraps
   AntD's own `Input` (not `@/components/input.tsx` — checked first; its
   `isNumber` mode filters digits only and has no uppercase-on-keystroke +
   `[A-Z0-9_]` character-class transform, and this module's Drawers already
   use AntD `Input` directly for other text fields, so a thin feature-local
   adapter over AntD's own control matches the established pattern instead
   of duplicating the shared wrapper's unrelated numeric-formatting logic).
   Uppercases and strips disallowed characters on every keystroke (not on
   blur), caps at 20 chars, renders the format helper text below the input.

6. **`components/PromotionTypeMechanismField`** (new): a selectable-card UI,
   purely visual this sprint with no backing form field — "Tặng kèm sản
   phẩm" pre-checked and locked, a second disabled row for a future
   partner-cooperation mechanism. **Flagged `LEGACY-COMPATIBILITY` per the
   request** (plan section 4.3 point 2): do not wire either checkbox to real
   form state until a later sprint defines that contract.

7. **`components/PromotionTypeCreateDrawer`** (new): fields in the specified
   order — mechanism (visual only), `code` (`PromotionTypeCodeInput`), name
   (`Input showCount maxLength=50`), description (`Input.TextArea showCount
   maxLength=255 rows=2`), priority (`InputNumber placeholder="999"`),
   maxItems (`InputNumber placeholder="Không giới hạn"
   addonAfter="ưu đãi / loại ưu đãi"`), status (`Switch`, default on — wired
   to the string `status` field via AntD `Form.Item`'s
   `getValueProps`/`getValueFromEvent`, the same boolean↔string adapter
   pattern already used in `ThemeForm` for its own non-string field, so the
   form's authoritative value stays `PromotionTypeStatus`, not a bare
   boolean). Save success closes the Drawer and toasts
   `message.createSuccess` ("Đã thêm loại ưu đãi «{{name}}»" —
   PORTAL_CV_OFFER_148, given verbatim). Save failure keeps the Drawer and
   form data, attaches field-level errors when the error maps to a known
   field (so a `code` collision highlights the `code` field), and toasts
   `error.createFailed` (PORTAL_CV_OFFER_152 — **not sourced from BA copy**,
   see "Not sourced from BA copy" below). Hủy/✕ (`requestClose`, used by both
   the footer Hủy button and the Drawer's built-in close) checks whether any
   field differs from the empty initial values; if so it opens
   `useModal().openModal` with `ModalContent` (PORTAL_CV_OFFER_124, given
   verbatim); an untouched form closes immediately.

8. **Route wiring** (`views/PromotionTypeListPage/index.tsx`): the create
   route (`/create`) carries no `:id` param, so it cannot reuse the Sprint 2
   `useParams()`-based detection. Added `isCreateRoute = detailId === null &&
   location.pathname === PageURLs.ofPromotionTypeCreate()` via `useLocation()`,
   and renders `PromotionTypeCreateDrawer` when true. The "Tạo mới" button
   (already wired to `PageURLs.ofPromotionTypeCreate()` since Sprint 1) now
   actually opens something.

9. **i18n** (`vi.json`/`en.json`): added `field.{codeHelper,
   partnerMechanism, namePlaceholder, maxItemsSuffix}`, `drawer.createTitle`,
   `confirm.discardCreate{Title,Description,Cancel,Confirm}`,
   `message.createSuccess`, `error.createFailed`,
   `validation.{codeRequired,codePattern}` — 13 new keys, reusing
   `action.create/cancel/save` and `status.active/inactive` from Sprint 1/2
   rather than duplicating them.

## Not sourced from BA copy

- `error.createFailed`'s exact text (referenced as "PORTAL_CV_OFFER_152" by
  code only, not pasted into this chat) uses a reasonable default consistent
  with Sprint 2's `error.updateFailed`/`toggleStatusFailed` phrasing —
  confirm the exact approved copy before this ships.
- `createSuccess` (PORTAL_CV_OFFER_148) and the discard-guard text
  (PORTAL_CV_OFFER_124) *were* given verbatim and are used as-is.

## Rule-file conflict noted, not resolved this sprint

`.claude/rules/03-api-service.md` changed on disk during this task to
require a per-feature `services/index.ts` mock/real switch boundary, a
`<domain>.mock.ts` file, and a visible fake-data UI indicator while a mock
switch is on — none of which this module has. Migrating the existing
Sprint 1/2 mock architecture (`USE_MOCK_PROMOTION_TYPE_DATA` inline in
`promotion-type.service.ts`, no `services/index.ts`, no indicator) to the new
rule is a real but separate, cross-cutting change: it would touch every
mock branch added in Sprint 1 and 2, not just this sprint's create path, and
is out of scope for "do not perform unrelated refactors"
(`.claude/rules/00-general.md`). This sprint's `createPromotionType` mock
branch was added consistently with the *existing* in-module pattern instead.
**NEEDS-TEAM-DECISION:** whether/when to migrate all of `promotion-type`'s
mock data to the new rule's structure as its own task.

## Not changed

- No delete/deactivate-only-via-status work beyond what Sprint 2 already
  built (the toggle). This sprint is additive: create only.
- `PromotionTypeMechanismField` has no backing field by design (see item 6).

## Re-validation

- `npm run typecheck` — passes after two fixes made during implementation:
  an import-path mistake (`mapPromotionTypeCreateZodIssuesToAntdErrors`
  lives in `promotion-type.validation.ts`, not `promotion-type-api.error.ts`
  — the Drawer's import was corrected), and an unused-import error
  (`PROMOTION_TYPE_CODE_MAX` was left imported in `promotion-type.validation.ts`
  after the schema's redundant `.max()` call was dropped in favor of letting
  the VL-02 regex's own `{3,20}` bound the length — removed).
- `npx eslint` on all 10 new/changed files for this sprint — 0 errors, 0
  warnings.
- `npx prettier --write` on the same files plus both lang files — all
  formatted correctly, no rewrites needed beyond the two files' own
  line-wrap from normal editing.
- `npm run build` — succeeds (same pre-existing unrelated large-chunk
  warning as Sprint 1/2).
- `git status --short` shows exactly the Sprint 1/2/3 file set: Sprint 3 adds
  `PromotionTypeCodeInput.tsx`, `PromotionTypeCreateDrawer/`,
  `PromotionTypeMechanismField/` as new, and modifies `constant.ts`,
  `services/promotion-type.service.ts`, `types/promotion-type.types.ts`,
  `utils/promotion-type-api.error.ts`, `views/PromotionTypeListPage/index.tsx`,
  `vi.json`/`en.json` — plus the pre-existing unrelated `auth.slice.ts`/
  `menus.helper.ts` changes already present before this sprint.
- Flattened both lang files: `PromotionManagement.*` has an identical
  61-key set in `vi.json` and `en.json` (48 from Sprint 1/2 + 13 new).

## Not verified

- Browser/runtime behavior: create Drawer open/close, the code input's
  uppercase-on-keystroke transform, the mechanism card's visual lock state,
  the discard-guard popup, a live `code`-collision 409 round-trip through
  the mock service and its field-level error rendering, and the
  maxItems/priority `InputNumber` placeholder/addon rendering were not
  opened in a browser.
- `app_locale=vi` and `app_locale=en` rendering of every new string.
- Permission behavior: the "Tạo mới" button's `PROMOTION_MANAGEMENT_CREATE`
  gating and the create route's own permission guard were not
  runtime-tested.
- The exact `error.createFailed` copy — see "Not sourced from BA copy" above.
- Whether BE's real POST contract will actually match the `[ASSUME]` shapes
  documented at the top of this report.

## 2026-10-21 alignment pass: official BE API spec approved (Squad 3)

The BE API spec for UC #2091 was approved the same day (Squad 3), resolving
every `[ASSUME]` this report flagged about `CreatePromotionTypeRequest` and
adding one new real field, `mechanism`, that Sprint 1-3 had treated as
UI-only decoration. This pass realigns Sprint 1-3's code with that spec. It
does **not** flip `USE_MOCK_PROMOTION_TYPE_DATA` to `false` — the dev
environment's real endpoints have not been confirmed deployed — and does
**not** change routing from child routes (`/view/:id`, `/create`) to a query
param, per the team's final decision (plan section 12.1 point 4), regardless
of what the BE doc's earlier draft proposed.

### What changed

1. **`mechanism` is now a real, required field.** `PromotionTypeResponse`
   and the new `PromotionTypeLookupResponse` (see "Gap" below) both carry
   `mechanism: 'GIFT_PRODUCT' | 'PARTNER' | 'SUB_PRODUCT'`, non-nullable.
   `CreatePromotionTypeRequest`'s shape is now the official
   `{code, name, description, priority, maxItems, status, mechanism}` —
   this supersedes Sprint 3's `[ASSUME]` guess (which omitted `mechanism`
   entirely, since at the time it was believed to be UI-only).

2. **`constant.ts`**: added `PROMOTION_TYPE_MECHANISM` (`GIFT_PRODUCT` /
   `PARTNER` / `SUB_PRODUCT`, codes only — no enum, same "no enum" pattern
   as `PROMOTION_TYPE_STATUS`) and a derived `PromotionTypeMechanism` union
   type. Human-readable labels do **not** live on this constant: following
   the same i18n-driven convention already used for `PROMOTION_TYPE_STATUS`
   (labels live in `vi.json`/`en.json`, not in the constant), each
   mechanism's label lives behind a new i18n key
   (`field.mechanismGiftProduct/Partner/SubProduct`), and
   `PROMOTION_TYPE_MECHANISM_OPTIONS`/`PROMOTION_TYPE_MECHANISM_LABEL_KEY`
   hold the mechanism→i18n-key pairing (plus a `enabled` milestone flag per
   option) so the create form's option list and the table/Drawer's tag
   rendering can never disagree with each other.

3. **`mock-data.ts`**: all 17 seed records got `mechanism: 'GIFT_PRODUCT'`
   — the only value any seeded record can have this milestone.

4. **`services/promotion-type.service.ts`**:
   - `createMockPromotionType` now reads `mechanism` from the request body
     and stores it on the new record, instead of ignoring it.
   - `getMockPromotionTypeById`'s not-found case now throws a 404-shaped
     error object (`throwMockNotFoundError`, matching the existing
     `throwMockDuplicateCodeError` pattern) instead of
     `requirePromotionTypeApiResponse`'s generic `TypeError`. The generic
     throw was not detectable by `isPromotionTypeNotFoundError` (it isn't
     shaped like an `ApiFetcher` rejection), so the Drawer could never have
     distinguished "not found" from "failed to load" for the mock path —
     this was a latent gap, not something this alignment request pointed
     out directly, but it blocked implementing item 7 correctly and is
     fixed here.

5. **`PromotionTypeMechanismField`**: changed from a purely-visual
   component to one bound to real AntD Form state. The parent wraps it in
   `<Form.Item name="mechanism" initialValue="GIFT_PRODUCT">`; AntD submits
   a disabled form item's value, so the pre-checked/disabled
   "Tặng kèm sản phẩm" row's value still reaches
   `mapPromotionTypeCreateFormValuesToRequest`. The component itself now
   renders all three rows from `PROMOTION_TYPE_MECHANISM_OPTIONS` rather
   than two hand-written `<div>`s, with `PARTNER`/`SUB_PRODUCT` rendered as
   visually disabled, not real alternative options. The
   `LEGACY-COMPATIBILITY` flag from Sprint 3 is removed — this is resolved,
   not a workaround. The create schema (`promotionTypeCreateFormSchema`)
   and `PROMOTION_TYPE_CREATE_FORM_FIELDS` both gained `mechanism` (and
   `status`, which had been missing from the create error-field set too).

6. **`PromotionTypeTableSection` / `PromotionTypeDetailDrawer`**: both now
   render the mechanism tag from `record.mechanism` /
   `promotionType.mechanism` through `PROMOTION_TYPE_MECHANISM_LABEL_KEY`,
   replacing the hardcoded `column.mechanismTag` static string (now
   retired from both lang files).

7. **404 vs. list-load-failure error text**: `PromotionTypeDetailDrawer`'s
   error Alert now branches on `isPromotionTypeNotFoundError(detailQuery.
   error)` — a 404 shows the new `error.notFound` key ("Không tìm thấy
   thông tin loại ưu đãi trong hệ thống"), any other failure keeps the
   existing generic `error.loadDetail` text. This is distinct from the
   list's own `error.loadList` text, which was not changed.

8. **i18n**: `column.mechanismTag` and `field.partnerMechanism` retired
   (renamed, not duplicated — every call site was updated in this same
   change); added `field.mechanismGiftProduct/Partner/SubProduct` and
   `error.notFound`; `error.createFailed`/`error.updateFailed` changed to
   the official PORTAL_CV_OFFER_152 text ("Lưu không thành công. Vui lòng
   thử lại." / "Save failed. Please try again."), replacing both sprints'
   earlier placeholder copy.

9. **`permission.constant.ts`**: the "giá trị tạm (placeholder), chờ BE xác
   nhận role" comment on `PROMOTION_MANAGEMENT_VIEW/CREATE/EDIT` was
   replaced — the values are now BE-confirmed exact matches. The values
   themselves (`promotion_management:view/create/edit`) did not change.

### Gap: `PromotionTypeLookupResponse` has no consumer yet

The alignment request named `PromotionTypeLookupResponse` as a second type
needing `mechanism` added. No such type, service call, or endpoint exists
anywhere in this repo — it was added to `types/promotion-type.types.ts` as a
plain `{id, code, name, mechanism}` shape only because it was explicitly
named, with a comment flagging that nothing wires it up yet.
**NEEDS-TEAM-DECISION:** whether this lookup type belongs to a different
module/UC entirely (a dropdown for selecting a promotion type elsewhere,
e.g. the still-unbuilt UC #2498 "Ưu đãi"), and if so whether it should be
defined there instead of here once that consumer exists.

### Re-validation

- `npm run typecheck` — passes, no errors on the first run after this pass.
- `npx eslint` on all 11 touched/new files (`constant.ts`, `mock-data.ts`,
  `types/promotion-type.types.ts`, `services/promotion-type.service.ts`,
  `utils/promotion-type.validation.ts`, `utils/promotion-type-api.error.ts`,
  `PromotionTypeMechanismField/index.tsx`, `PromotionTypeCreateDrawer/
  index.tsx`, `PromotionTypeTableSection/index.tsx`,
  `PromotionTypeDetailDrawer/index.tsx`, `src/constants/permission.
  constant.ts`) — 0 errors, 0 warnings.
- `npx prettier --write` on the same files plus both lang files — all
  formatted correctly, no rewrites needed.
- `npm run build` — succeeds (same pre-existing unrelated chunk-size
  warning as every prior sprint).
- `git status --short` shows exactly this pass's expected files, on top of
  the already-tracked Sprint 1-3 file set:
  `src/constants/permission.constant.ts` becomes newly modified; no file
  outside the already-expected Sprint 1-3 set was touched.
- Flattened both lang files: `PromotionManagement.*` has an identical
  63-key set in `vi.json` and `en.json` (61 from Sprint 1-3, minus the 2
  retired keys, plus the 4 new ones).

### Not verified

- Browser/runtime rendering of the three mechanism rows in the create
  Drawer, the table/Drawer's mechanism tag for a non-`GIFT_PRODUCT` record
  (none exist in mock data, so this path is untested even with the mock
  flag on), and the 404 "not found" Alert branch were not opened in a
  browser.
- `app_locale=vi` and `app_locale=en` rendering of the renamed/new strings.
- Whether BE's actual deployed endpoints match this now-"official" spec
  byte-for-byte; "approved" here means the written spec, not a verified
  live integration.

## 2026-10-21 UI polish pass: Create/Detail Drawer cosmetics

Five cosmetic changes requested against `PromotionTypeCreateDrawer`, and the
width/layout items against `PromotionTypeDetailDrawer` for consistency. No
API/service/validation/i18n file changed — purely component-level JSX and
SCSS.

1. **Drawer width 480 → 560px** in both `PromotionTypeCreateDrawer` and
   `PromotionTypeDetailDrawer` (bump of 80px, within the requested 80-120px
   range).
2. **Mechanism picker hides disabled rows.** `PromotionTypeMechanismField`
   now renders `PROMOTION_TYPE_MECHANISM_OPTIONS.filter((o) => o.enabled)`
   instead of mapping every option — PARTNER/SUB_PRODUCT are no longer in
   the DOM at all, not just greyed out. `constant.ts` is untouched: all
   three mechanism definitions remain, so re-enabling PARTNER/SUB_PRODUCT
   later is a one-line `enabled: true` flip, not a component rewrite.
3. **Shared-wrapper reuse — decision taken: do not adopt `@/components/
   input.tsx`.** Checked it directly (`src/components/input.tsx`) before
   writing anything. Two blocking findings:
   - Its `placeholder` prop is not a native HTML placeholder — it is
     destructured by the wrapper itself and rendered as a Material-style
     *floating label* that sits inside the field and rises above it on
     focus/value, replacing the need for an external `Form.Item label`.
     Every existing consumer (`edit-required-information-set.tsx` and
     others, grepped for confirmation) uses it exactly that way: no
     `Form.Item label`, just `<Input placeholder='...' />`. This feature's
     Drawer forms use the opposite, already-consistent pattern throughout
     (`Form.Item label=` above a plain control) for every field —
     mechanism, code, priority, maxItems. Swapping only Name/Description to
     the floating-label mechanism would have produced *two* label systems
     in one form, which directly undermines the stated goal ("the whole
     form reads as one consistent library"), not served it.
   - The instruction's premise that this component has a `.module.scss` to
     borrow tokens/classnames from does not hold: `input.tsx` is pure
     Emotion (`/** @jsxImportSource @emotion/react */`), with no colocated
     SCSS Module anywhere in `src/components`. Flagging this discrepancy
     rather than silently inventing a token source.
   - Also checked `SuffixInput` (`src/components/suffix-input.tsx`) for
     Priority/MaxItems: it wraps `react-currency-input-field` for
     currency-style formatted numeric input with a suffix — the same
     thousands-formatting mismatch the instruction already flagged for
     `Input`'s `isNumber` mode, just via a different underlying library.
     Not used.
   - **What was done instead:** kept raw AntD `Input`/`Input.TextArea`/
     `InputNumber` (and `PromotionTypeCodeInput`'s own `Input`) as the
     field controls — preserving this form's one consistent static-label
     layout — but pulled the one visual token from `input.tsx` that *is*
     a plain CSS primitive with no behavioral coupling: its
     `border-radius: 1.2rem`. Added a local `.styledControl` class (one per
     owning SCSS Module — `PromotionTypeCreateDrawer/styles.module.scss`,
     `PromotionTypeDetailDrawer/styles.module.scss`,
     `PromotionTypeCodeInput.module.scss`, new) applying that radius, plus
     AntD's own `size='large'` prop for a comparable sizing bump. Did not
     copy `input.tsx`'s hardcoded `height: 5.6rem` (56px): that number is
     tied to its floating-label layout (room for the label to float above
     the text baseline) and would be an oversized, unverified relayout of
     a compact side-Drawer form if copied verbatim without that layout
     reason behind it. This is a `NEEDS-TEAM-DECISION`-adjacent judgment
     call if an exact pixel match across the app is wanted later — flagging
     it rather than guessing further.
4. **Priority + MaxItems share one row.** Wrapped both `Form.Item`s in
   `Row gutter={16}` / `Col span={12}` in both `PromotionTypeCreateDrawer`
   and `PromotionTypeDetailDrawer`'s edit form.
5. **Status toggle moved to the Drawer header.** For
   `PromotionTypeCreateDrawer`, mirrors `PromotionTypeDetailDrawer`'s
   existing edit-mode pattern (`Drawer extra={<Switch .../>}`). Because
   `Drawer`'s `extra` renders outside the `<Form>` JSX subtree, the header
   `Switch` cannot be a nested `Form.Item` reader; `status` stays a
   registered form field via a `Form.Item name='status' hidden` at the
   bottom of the form (so `handleFinish`'s `values` still includes it), and
   the header `Switch` reads it via `Form.useWatch('status', form)` and
   writes it via `form.setFieldValue` followed by a manual
   `handleValuesChange()` call — `form.setFieldValue`/`setFieldsValue` do
   not fire AntD's `onValuesChange` (confirmed in `rc-field-form`'s
   `useForm.js`: only real field interaction's `updateValue` path does),
   so the dirty-check that drives the discard-confirmation popup would
   otherwise silently miss a header-toggle edit. Default remains ON
   (`PROMOTION_TYPE_STATUS.ACTIVE`), matching the old inline field's
   default. `PromotionTypeDetailDrawer`'s header toggle was already in this
   position (edit mode only) and is unchanged — DetailDrawer's variant
   fires its own mutation immediately rather than participating in a form
   submission, which is an intentional, pre-existing difference from
   Create's behavior, not something this pass altered.

### Re-validation (UI polish pass)

- `npm run typecheck` — passes, no errors.
- `npx eslint` on all 6 touched/new files
  (`PromotionTypeCodeInput.tsx`, `PromotionTypeCreateDrawer/index.tsx`,
  `PromotionTypeCreateDrawer/styles.module.scss` is not lint-checked by
  ESLint but was hand-reviewed, `PromotionTypeDetailDrawer/index.tsx`,
  `PromotionTypeMechanismField/index.tsx`) — 0 errors, 0 warnings.
- `npx prettier --write` — all files formatted correctly.
- `npm run build` — succeeds (same pre-existing unrelated chunk-size
  warning as every prior sprint).
- `git status --short` shows exactly the expected files: the five modified
  components/styles above, plus one new file
  (`PromotionTypeCodeInput.module.scss`). No i18n, constant, service,
  validation, or permission file was touched by this pass.

### Not verified (UI polish pass)

- Actual rendered appearance of the 560px width, the rounded-corner inputs,
  the two-column Priority/MaxItems row, and the header toggle in both
  Drawers — not opened in a browser. In particular: whether `size='large'`
  AntD inputs visually crowd the compact mechanism-card UI above them, and
  whether the header `Switch` + title + close button fit comfortably on one
  row at 560px, were not confirmed visually.
- Keyboard/tab order after moving the status control into the header.
- `app_locale=vi` and `app_locale=en` — unaffected by this pass (no copy
  changed), but not re-opened to confirm.

## 2026-10-21 Component decomposition + Detail Drawer view/edit toggle

Two further changes: splitting both Drawers' inline form fields into small
child components, and making `PromotionTypeDetailDrawer` default to View
mode with an explicit "Sửa" action to enter Edit.

### 1. Component decomposition

New field components, each a single `Form.Item` (so each is automatically
connected to the nearest `<Form>` ancestor's context — none needed
`Form.useFormInstance()`, since none of them are a non-`Form.Item` child
needing imperative access):

- `PromotionTypeCodeField` (standalone `.tsx`, Create-only) — wraps
  `PromotionTypeCodeInput`. No Edit equivalent: Edit shows `code` as locked
  plain text outside the Form entirely, not an editable field, so there is
  nothing to share.
- `PromotionTypeStatusField` (standalone `.tsx`, Create-only) — the hidden
  `Form.Item name='status'` registration. The header `Switch` that actually
  drives it stays inline in `PromotionTypeCreateDrawer` rather than moving
  into this component, because it lives in `Drawer`'s `extra` slot, which
  is **not** a React descendant of `<Form>`'s children — context doesn't
  reach it regardless of where it's written in source, so it needs the
  `form` instance passed explicitly (already obtained via `Form.useForm()`
  in the Drawer) and can't use ambient context. This is a structural
  exception, not an oversight.
- `PromotionTypeNameField/`, `PromotionTypeDescriptionField/`,
  `PromotionTypePriorityMaxItemsRow/` (folders with `styles.module.scss`,
  shared by both Drawers) — the three fields that render identically in
  Create and Edit. Each owns its own `.styledControl` SCSS Module (small
  intentional duplication across 3 files — SCSS Modules are private to
  their component per `.claude/rules/10-styling.md`, so this couldn't be
  centralized without creating a new shared Sass file the feature doesn't
  otherwise need).
  - `PromotionTypeNameField` takes an optional `placeholder` prop — Create
    passes the "Nhập tên loại ưu đãi" hint text, Edit omits it (always has
    an existing value).
  - `PromotionTypeDescriptionField` takes an optional `rows` prop — Create
    passes `2`, Edit keeps the default `3`, preserving each Drawer's
    original textarea height.
  - `PromotionTypePriorityMaxItemsRow` takes no props: unlike the other two,
    Edit's version previously had no placeholder/addon on its `InputNumber`s
    while Create's did. Unifying into one component means Edit's Priority/
    MaxItems row now also shows the `999` and "Không giới hạn" placeholders
    and the unit suffix — a minor, intentional UI addition (not a
    regression): Edit's `maxItems` can also be `null`, so the "unlimited"
    hint and unit label are accurate there too.
- `PromotionTypeMechanismField` and `PromotionTypeCodeInput` were left
  exactly as they already were, per the instruction.

### 2. Detail Drawer defaults to View, explicit "Sửa" to enter Edit

`PromotionTypeDetailDrawer`'s `mode` is no longer derived from
`canEdit` — it's now local `useState<'view' | 'edit'>('view')`, always
starting in View regardless of permission.

- Header `extra`: Edit mode still shows `PromotionTypeStatusToggle`
  (unchanged, instant-mutate). View mode shows a "Sửa" button
  (`action.edit`, new i18n key) only when `canEdit`; otherwise `undefined`,
  same as a user without EDIT sees today.
- New `requestCancelEdit`, used only by the edit-mode footer "Hủy" button,
  distinct from the existing `requestClose` (still bound to the Drawer's X
  and the view-mode footer "Đóng"): when dirty, it opens the *same*
  discard-confirmation `ModalContent` (identical copy/keys as `requestClose`
  already used) but its `onConfirm` calls a new `revertToView()` —
  `form.resetFields()` + `setIsDirty(false)` + `setSubmitError(null)` +
  `setMode('view')` — instead of `onClose()`. When not dirty, `revertToView()`
  runs immediately with no popup. `requestClose` is untouched: the Drawer's
  X button and View's "Đóng" still fully close the Drawer, with the same
  dirty-check as before.
- `form.resetFields()` here was necessary, not optional: `Form.useForm()`'s
  `form` object persists across the View↔Edit toggle (same hook instance),
  but the conditionally-rendered `<Form>` JSX unmounts/remounts each time
  `mode` flips. Since `setFieldsValue`/`resetFields` act on the form's
  internal store directly (independent of whether the `<Form>` element is
  currently mounted), without this call the store would still hold the
  user's abandoned edits the next time Edit is re-entered, even though
  `initialValues` is passed again on remount — `rc-field-form` only applies
  `initialValues` to a field that doesn't already have a stored value.
- **Inferred, not explicitly specified:** a successful save now also calls
  `setMode('view')`. The instruction didn't say what happens after Save;
  this was chosen because leaving the Drawer in Edit with no unsaved
  changes and no visible reason the "Sửa" button disappeared seemed like
  the wrong default once View became the Drawer's normal resting state.
  Flagging this as a judgment call in case product intends something else
  (e.g. staying in Edit after a successful save for rapid repeated edits).
- The read-only banner (`drawer.readOnlyBanner`) and the "Cơ chế"/"Mã" lock
  icons are unchanged — both were already keyed off `mode === 'view'`, which
  is now simply true more often (for `canEdit` users too, until they click
  "Sửa"), which is exactly the intended behavior change.

### i18n

One new key, `PromotionManagement.promotionType.action.edit` ("Sửa" /
"Edit"), added to both lang files.

**Separately discovered while adding it — not caused by this task, flagging
as a pre-existing finding:** `src/lang/en.json` had **no**
`PromotionManagement` key at all before this change — the entire English
translation for this module (all three sprints' worth, 61+ keys) was
missing, despite every prior sprint's report in this repo claiming a
verified key-parity count. Checked `git log`/`git show` across every commit
that touched this module on this branch (`ed18d0c1` through `be4bfa4d`,
including the `develop` merge) — `PromotionManagement` was absent from
`en.json` at every one of them; it was never actually committed, even
though earlier sessions validated parity against a working tree that
apparently never got committed before being lost. `src/lang/en.json` is
also missing 122 other top-level keys relative to `vi.json` across
*unrelated* modules — i18n `fallbackLng: vi` makes this silent at runtime
(`.claude/rules/11-i18n.md` warns about exactly this), so it's a known,
broader, pre-existing gap in the repo, not something introduced here.
Restoring the rest of that gap is out of scope for this task; what was
required here — full English text for the `PromotionManagement.
promotionType` namespace, matching every key already in `vi.json` plus the
new `action.edit` — was added now, since there was no way to add one key to
an entirely-missing parent namespace without reconstructing it. Flattened
both files' `PromotionManagement.promotionType.*` subtree: 64/64 keys match
in both languages (63 pre-existing + `action.edit`).

### Re-validation

- `npm run typecheck` — passes, no errors.
- `npx eslint` on all 10 touched/new files — 0 errors, 0 warnings.
- `npx prettier --write` on the components and both lang files — formatted
  correctly (one import-line rewrap in `PromotionTypeCreateDrawer/index.tsx`,
  no content change).
- `npm run build` — succeeds (same pre-existing unrelated chunk-size
  warning as every prior sprint).
- `git status --short` shows exactly the expected files: both lang files,
  the two Drawers' `index.tsx`/`styles.module.scss`, and four new field
  component files/folders. (`PromotionTypeCodeField.tsx` doesn't show —
  it was already committed in an earlier session's work.)

### Not verified

- Browser/runtime: the "Sửa" button's actual position in the header, the
  View→Edit→Hủy→View round-trip, the View→Edit→Save→View round-trip, and
  whether a non-EDIT-permission user truly never sees "Sửa" — none opened
  in a browser.
- `app_locale=en` rendering of the restored English text — this is the
  first time most of these strings have ever actually rendered in English;
  translations were written now, not carried over from a verified source,
  since none existed in git history to carry over from.
- Whether product wants Save to return to View mode (see the inferred
  decision above) or stay in Edit.

## 2026-10-21 Floating-label fields, MaxItems overflow, Mã/Cơ chế alignment

Per a pasted screenshot of theme-management's "Tên Theme" field, reverses the
earlier UI-polish pass's "static label above, keep @/components/input.tsx's
border-radius token only" decision — switches Tên loại, Mô tả, Độ ưu tiên,
Hiển thị tối đa, and (Create-only) Mã to the floating/embedded-label visual,
across both `PromotionTypeCreateDrawer` and `PromotionTypeDetailDrawer`'s
edit form.

**Direct reuse — `PromotionTypeNameField`:** now renders `@/components/
input.tsx`'s `Input` directly (the exact component `ThemeNameField` uses to
produce the "Tên Theme" look) instead of a plain AntD `Input` under a
`Form.Item label`. The field's own column name (`t('...column.name')`) is
passed as `placeholder`, which this shared component uses as both the
floating label and the resting-state placeholder — this is the same pattern
`ThemeNameField` uses. `showCount`/`maxLength` still work: the shared `Input`
forwards unrecognized props straight onto the underlying AntD `Input` via
`{...props}`. Dropped the field's own `placeholder` prop (previously used by
Create for a distinct "Nhập tên loại ưu đãi" hint) — the floating-label
pattern has one label/placeholder slot, not two, matching `ThemeNameField`'s
precedent. The now-unused `field.namePlaceholder` i18n key was removed from
both `vi.json` and `en.json` after confirming (`grep -rn namePlaceholder
src/`) it had no other call site. The field's private `styles.module.scss`
(just the old `.styledControl` rule) was deleted — no longer needed since
the shared `Input` already applies its own border-radius/height.

**Local replicas — `PromotionTypeDescriptionField`, `PromotionTypePriority
MaxItemsRow`, `PromotionTypeCodeInput`:** `@/components/input.tsx` only wraps
AntD `Input`, not `Input.TextArea` or `InputNumber`, and reusing it for
Priority/MaxItems would run their values through its `isNumber` formatting
(thousands separators), and for Mã would drop `PromotionTypeCodeInput`'s own
uppercase + `[A-Z0-9_]` keystroke filter — both already-identified, already-
documented reasons the earlier pass rejected direct reuse. Per this task's
explicit instruction to replicate the visual locally rather than regress
validation/formatting behavior, each of these three files got its own small
floating-label wrapper (a `<div>` with an absolutely-positioned `<label>`
whose floated/resting state is driven by local `isFocused` state + whether
the field has a value), with the existing working `Input.TextArea`/
`InputNumber`/`Input` + uppercase-filter logic untouched inside it. Each
wrapper component (`FloatingTextArea`, `FloatingInputNumber`,
`PromotionTypeCodeInput` itself) is the single element AntD `Form.Item`
clones `value`/`onChange` onto, same controlled-component contract as the
shared `Input` — Form.Item's injected props are destructured and forwarded
to the real control inside, so field registration, errors, and reset
behavior are unaffected. The small floating-label CSS block is duplicated
across `PromotionTypeDescriptionField/styles.module.scss`,
`PromotionTypePriorityMaxItemsRow/styles.module.scss`, and
`PromotionTypeCodeInput.module.scss` rather than centralized, consistent
with this feature's established precedent of small local duplication over a
new shared stylesheet (`.claude/rules/10-styling.md`'s "MUST keep each
component's SCSS Module private").

**MaxItems addon overflow:** the "ưu đãi / loại ưu đãi" / "promotions / type"
`addonAfter` text started overflowing its input's border once
`PromotionTypeDetailDrawer`'s edit-mode row went from 2 columns to 3 (Status
added in the previous task). Fixed with a combination of both options the
instruction offered: (1) `PromotionTypePriorityMaxItemsRow` now gives MaxItems
double the span of Priority/Status when a third column (`extraColumn`) is
present — `6/12/6` instead of the even `8/8/8` — since MaxItems is the only
one of the three carrying addon text; Create's 2-column row (no
`extraColumn`) is unchanged at even `12/12`; (2) the addon text itself is now
wrapped in a `<span className={styles.addon}>` with `white-space: normal`
and a `max-width`, so it wraps onto a second line inside its own space
instead of forcing one line past the input's border. The addon's copy text
itself was left unchanged in both languages — only its layout/wrapping, to
avoid an unrelated content change.

**Mã/Cơ chế top alignment:** added `align='top'` to the `Row` wrapping these
two locked/read-only blocks in `PromotionTypeDetailDrawer` (rendered once,
before the `mode === 'view' ? ... : <Form>` branch, so both View and Edit
get this row identically — it was not possible to apply it to only one mode
without duplicating this block, and the instruction only asked to fix the
one Row). Per the instruction, this is the one Row/Col grouping from the
previous task whose two columns hold visually different content (a
label+lock-icon+text stack vs. a `Tag` chip), which is why it, and not the
Priority/MaxItems/Status row, needed an explicit alignment override.

**Create form audit (per the instruction's point 4):** checked all three
issues against Create's own layout, which differs from Edit's:
- Floating labels: applied identically (Tên loại, Mô tả, Độ ưu tiên, Hiển
  thị tối đa, Mã all converted, as above).
- MaxItems overflow: Create's Priority/MaxItems row has no Status column
  (status lives in the header there, per the previous task), so it stays at
  the original even `12/12` split — more than double the width of Edit's
  broken `8` split — and was not overflowing before this change. Left as-is;
  the `extraColumn`-driven `6/12/6` rebalance only applies when Edit passes
  a third column.
- Top alignment: Create has no Mã/Cơ chế row at all (Mã is its own
  full-width `Form.Item`, Cơ chế/mechanism is a separate full-width
  `Form.Item` above it) — no two-column row with mismatched content exists
  there, so no alignment fix applies.

Validation: `npm run typecheck` clean. `npx eslint` on all 9 changed `.tsx`
files (0 errors/0 warnings; ran in two batches after the first batch's JSON
output got truncated by the harness, same known quirk as the earlier UI-
polish pass — re-ran the missing two files directly to get complete output).
`npx prettier --write` on all changed files (reformatted one line in
`PromotionTypeDescriptionField/index.tsx`, otherwise already correct).
`npm run build` succeeded (same pre-existing >500kB chunk-size warning seen
in every prior sprint). `git status --short` shows exactly the expected
files: `src/lang/en.json`, `src/lang/vi.json`, `PromotionTypeCodeField.tsx`,
`PromotionTypeCodeInput.tsx` + `.module.scss`, `PromotionTypeCreateDrawer/
index.tsx`, `PromotionTypeDescriptionField/index.tsx` + `styles.module.scss`,
`PromotionTypeDetailDrawer/index.tsx`, `PromotionTypeNameField/index.tsx`
(plus its now-deleted `styles.module.scss`), and `PromotionTypePriorityMax
ItemsRow/index.tsx` + `styles.module.scss`.

Not verified: actual rendered floating-label behavior, transition timing,
and whether the label truly sits "inside the border" at the exact position
shown in the screenshot, for any of the three fields — no browser was used.
Also not verified (at the time of the previous addendum): whether the
MaxItems addon's wrap looked visually balanced at the Drawer's 560px width
and the row's new `12`-span column, or whether `align='top'` produces the
exact top-edge match the screenshot implies (reasoned from the two blocks'
structurally different content heights, not confirmed in dev tools). All of
this needs a human to open the Drawer with `app_locale=vi` (and
`app_locale=en`, now that English text actually renders for this module) and
inspect both Create and Edit at the Drawer's real width.

## 2026-10-22 MaxItems vertical-wrap fix (previous addon-wrap fix was insufficient)

A follow-up bug report (with screenshot) showed the previous fix still broken
in practice: wrapping the addon text inside the InputNumber's own addon slot
(`.addon { max-width: 6rem; white-space: normal; ... }` in
`PromotionTypePriorityMaxItemsRow/styles.module.scss`) made the text wrap
across multiple lines *inside the input's own bordered control*. That grew
MaxItems' input box itself taller than Priority's and Status's in the same
`Row`, so the three fields no longer rendered at the same height — no
`align` value fixes this, because `align` only controls where each `Col`
starts, not the height of the content inside it.

**Root cause of the previous fix's insufficiency:** the suffix text was
inside `addonAfter`, which AntD renders as part of the input group itself
(same bordered box). Any wrap there necessarily changes the box's own
height. Shortening the column span or the wrap width could not solve this
without either cutting the text or still risking a wrap at some width.

**Fix:** followed the instruction's second suggested option — moved the
suffix text out of the input entirely, from `InputNumber`'s `addonAfter` to
`Form.Item`'s `extra` prop, which AntD renders as a caption line below the
field, outside its border:

```tsx
<Form.Item
  name='maxItems'
  extra={
    <span className={styles.caption}>
      {t('PromotionManagement.promotionType.field.maxItemsSuffix')}
    </span>
  }
>
  <FloatingInputNumber
    label={t('PromotionManagement.promotionType.column.maxItems')}
    min={0}
    placeholder={t('PromotionManagement.promotionType.column.maxItemsUnlimited')}
  />
</Form.Item>
```

This decouples the suffix text's length entirely from the bordered input
control's height: the control itself (the floating-label box that must
visually match Priority's and Status's) is now identical in structure to
Priority's — an `InputNumber` with no addon — regardless of how long the
caption below it is or how it wraps. `styles.module.scss`'s `.addon` rule
(the narrow, forced-wrap one) was replaced with `.caption` (a plain block of
small grey text, no `max-width`/wrap constraints — it simply wraps at the
full column width like ordinary body text, which no longer risks breaking
out of any border since it isn't inside one).

Also added `align='top'` to the Row itself (it previously had no explicit
`align`, so it already used AntD's `top` default) with a comment explaining
why `align` alone was never the fix: the earlier bug was in the *input
control's own height*, not in where the `Col`s started. Kept the 6/12/6 span
split from the prior pass — no longer load-bearing for overflow prevention,
but no reason to revert it since it still gives MaxItems' longer label more
room.

Did not change the `maxItemsSuffix` i18n copy itself (vi: "ưu đãi / loại ưu
đãi", en: "promotions / type") — grepped `addonAfter`/`addonBefore` usage
elsewhere in the repo (`ekyc-config`'s `%`/`ngày` suffixes) and found no
existing short-form precedent for this specific two-part "promotions / type"
meaning, so shortening it would have been inventing new phrasing rather than
reusing an established pattern. Moving it out of the input's border made the
existing copy's length a non-issue instead.

**Create form audit:** `PromotionTypeCreateDrawer` shares this exact
component with no `extraColumn`, so it inherits the same `extra`-caption fix
automatically — confirmed via `grep` that `PromotionTypePriorityMaxItemsRow`
has exactly one call site in each Drawer and no Create-specific override.

**Validation:** `npm run typecheck` clean; `npx eslint` on
`PromotionTypePriorityMaxItemsRow/index.tsx` — 0 errors/0 warnings;
`npx prettier --check` on both changed files — already correctly formatted;
`npm run build` succeeded (same pre-existing >500kB chunk-size warning seen
in every prior sprint). `git status --short` shows exactly the two expected
files: `PromotionTypePriorityMaxItemsRow/index.tsx` and
`PromotionTypePriorityMaxItemsRow/styles.module.scss`.

**Not verified:** no browser was used to confirm the caption actually
renders below the input at the Drawer's 560px width, that the three fields'
input boxes now visually match in height, or that `align='top'`'s effect is
visible. A human should open both Create and Edit in the browser and
visually compare Priority/MaxItems/Status's input box heights side by side.

## 2026-10-22 Mô tả floating label not clearing the TextArea's border on focus

A further bug report (with screenshot) showed the "Mô tả" field's label not
floating up above the textarea's border on focus — it stayed visually
overlapping/striking through the border, unlike the working "Tên loại"
label from `@/components/input.tsx`.

**Investigation:** read `@/components/input.tsx`'s label CSS in full
(`labelStyles` in that file) and compared it line-by-line against
`PromotionTypeDescriptionField/styles.module.scss`. The position offsets
(`top: -1rem` there vs. this feature's `top: -0.8rem`), transition, and
background-on-float logic are equivalent and intentionally adapted for a
multi-row control (resting position near the top instead of vertically
centered, per the original comment in that file). The one concrete
divergence: the shared, working component sets `z-index: 99` on its label;
all three of this feature's local floating-label replicas
(`PromotionTypeDescriptionField`, `PromotionTypePriorityMaxItemsRow`,
`PromotionTypeCodeInput`) used `z-index: 1`. Read `rc-textarea`'s source
(`node_modules/rc-textarea/lib/TextArea.js`) to confirm the className passed
to `Input.TextArea` with `showCount` lands on the actual bordered
`BaseInput` wrapper (not a non-bordered pass-through), so the border is at
the same box the label is positioned against — ruling out a className
target mismatch as the cause, which narrowed the fix to the z-index gap.

**Fix:** raised `z-index` from `1` to `99` in all three local replicas'
`.label`/`.labelFloating` selectors, matching the exact value from the
known-working shared component, so the floated label reliably paints above
the bordered control's border/focus-ring layer instead of beneath it.

**Point 4 check (other local replicas):** `PromotionTypePriorityMaxItemsRow`
(Độ ưu tiên / Hiển thị tối đa) and `PromotionTypeCodeInput` (Mã) shared the
same `z-index: 1` gap even though no bug was reported for them — fixed
preemptively rather than left as a latent issue, since the root cause
(insufficient stacking priority against the control's own border/focus
layer) applies identically to `InputNumber` and `Input` as it does to
`Input.TextArea`.

**Validation:** `npm run typecheck` clean; `npx prettier --check` on all
three changed `.scss` files — already correctly formatted (SCSS-only
changes, so `eslint`, which only lints `.ts`/`.tsx`, has nothing new to
check here); `npm run build` succeeded (same pre-existing >500kB
chunk-size warning seen in every prior sprint). `git status --short` shows
exactly the expected files for this pass:
`PromotionTypeCodeInput.module.scss`,
`PromotionTypeDescriptionField/styles.module.scss`, and
`PromotionTypePriorityMaxItemsRow/styles.module.scss` (plus
`PromotionTypePriorityMaxItemsRow/index.tsx`, carried over uncommitted from
the previous MaxItems-overflow addendum in this same report).

**Not verified:** no browser was used to confirm the label now visually
clears the border on focus for any of the three fields. The CSS reasoning
above (matching the shared component's proven-working z-index) is static
analysis, not a rendered confirmation. A human should open the Drawer,
focus Mô tả/Độ ưu tiên/Hiển thị tối đa/Mã, and visually confirm each
label floats fully above its border with no overlap.

## 2026-10-22 Mã vertical-alignment bug and Độ ưu tiên/Hiển thị tối đa text-stacking bug

Two more reported bugs, both in the Create form's local floating-label
replicas (also present in Edit, since Edit shares these same components).

**BUG A — Mã's label not vertically centered like Tên loại's.** Diffed
`PromotionTypeCodeInput`'s structure against `@/components/input.tsx`'s. The
label CSS (`top: 50%; transform: translateY(-50%)`) was already identical —
the bug was in the DOM structure, not the transform values. `styles.root`
(the `position: relative` box the label centers against) contained three
children: the label, the `Input`, **and** the helper caption text below it.
Because the label's absolute `top: 50%` is computed against `.root`'s own
height — and `.root`'s height is the sum of its non-absolutely-positioned
children (`Input` + helper text, since the label itself is absolutely
positioned and contributes nothing to that height) — the label centered
against "input + helper" instead of against the input alone, visibly
pushing it above the input's true center. `@/components/input.tsx`'s
wrapper only ever contains its label and the `AntInput`, nothing else, so
this never showed up there. **Fix:** moved the helper caption outside
`styles.root` into an outer wrapper, so the position:relative box again
contains only the label and the `Input`, matching the shared component's
structure exactly. ("Placeholder/helper text appears lost" in the bug
report was this same helper block, now rendering correctly in its own
block below the input instead of inside the mis-centering wrapper.)

**BUG B — Độ ưu tiên / Hiển thị tối đa text stacking.** Root cause: the
browser renders a native `placeholder` attribute whenever a control is
empty, **regardless of focus state**. `FloatingInputNumber` forwarded its
`placeholder` prop (`'999'`, `t('...maxItemsUnlimited')`) straight onto the
underlying `InputNumber` unconditionally via `{...props}`. Since the
resting (non-floating) `.label` is also centered in the same box, an empty
+ unfocused field rendered *both* the custom label text ("Độ ưu tiên") and
AntD's native placeholder text ("999") stacked on top of each other —
exactly the garbled overlap in the screenshot. Re-read
`@/components/input.tsx`'s props destructuring and confirmed it never
forwards `placeholder` to `AntInput` at all (it's consumed entirely by the
custom label); `placeholder` is absent from `...props`. **Fix:** destructure
`placeholder` out of `FloatingInputNumber`'s props and forward it
conditionally — `placeholder={isFocused ? placeholder : undefined}` — so
the native hint only appears once the custom label has already floated out
of the way (on focus), never while the field is at rest and the label is
still occupying that same centered position.

**Shared-wrapper question (explicitly addressed per the instruction):** did
not introduce a shared local floating-label wrapper component. The three
bugs fixed across this and the two prior addenda (z-index, this turn's
helper-text-inside-the-centering-box, this turn's unconditional-placeholder-
forwarding) are three different root causes tied to each control's own
distinct behavior — `Input.TextArea`'s showCount wrapper, `InputNumber`'s
native placeholder-when-empty, and `Input`'s extra helper-caption content —
not one bug copy-pasted three times (the z-index issue in the previous
addendum *was* a copy-pasted bug, and was fixed identically in all three
at once for that reason). A shared wrapper would need to either accept
arbitrary extra children (reintroducing BUG A's class of mistake if a
consumer puts something inside the centering box) or forbid them entirely
(which Mã's helper caption and MaxItems' `extra` caption both need, just
rendered outside the wrapper already by both fixes above) — so the actual
fix in both cases was "keep the position:relative box to label+control
only," a structural rule now consistently true of all three replicas, not
a new abstraction. Kept the three components separate: `PromotionTypeCodeInput`
owns uppercase+`[A-Z0-9_]` filtering, `FloatingInputNumber` owns the
conditional-placeholder behavior, and `FloatingTextArea` owns
`Input.TextArea`'s distinct `showCount`/multi-row sizing — none of that
business logic is shared, only the visual label CSS block is (and it is
already duplicated per `.claude/rules/10-styling.md`'s private-SCSS-Module
rule, which this task's prior addenda already relied on).

**Point 3 check (empty / typing / focused-with-value / blurred-with-value,
Create and Edit):** reasoned through all four states for each of the three
fixed components:
- Mã: label centers correctly in every state now that `.root` holds only
  label+Input; uppercase/char-filter/20-char truncation logic was untouched
  (no changes inside `handleChange`).
- Độ ưu tiên / Hiển thị tối đa: empty+unfocused shows only the label
  centered (no native placeholder); focused+empty shows the label floated
  up plus the native hint ("999"/"Không giới hạn"); focused-or-blurred-with-
  value shows the label floated up and the real value, no hint (placeholder
  never shows once there's a value, native browser behavior); `min`/`value`
  numeric logic was untouched.
- Mô tả: unaffected by this pass's two fixes (no `placeholder` is ever
  passed to `FloatingTextArea`, and it never had a second sibling inside its
  `.root`); the 2026-10-22 z-index fix from the prior addendum stands as its
  fix for this pass.
- Edit form: all three components are the exact same shared implementations
  (`PromotionTypePriorityMaxItemsRow`, `PromotionTypeDescriptionField`) or
  Create-only (`PromotionTypeCodeInput`, which Edit never renders — `code` is
  locked plain text there), so these fixes apply identically wherever they
  render; no Edit-specific branch exists to diverge.

**Validation:** `npm run typecheck` clean; `npx eslint` on
`PromotionTypeCodeInput.tsx` and `PromotionTypePriorityMaxItemsRow/index.tsx`
— 0 errors/0 warnings; `npx prettier --check` on both — already correctly
formatted; `npm run build` succeeded (same pre-existing >500kB chunk-size
warning). `git status --short` shows exactly the expected files:
`PromotionTypeCodeInput.tsx` + `.module.scss`,
`PromotionTypePriorityMaxItemsRow/index.tsx` (plus its `styles.module.scss`
and `PromotionTypeDescriptionField/styles.module.scss`, both carried over
unchanged by this pass from the prior z-index addendum).

**Not verified:** no browser was used. The DOM-structure reasoning for BUG A
(root's height excluding absolutely-positioned children) and the native-
placeholder-always-shows-when-empty behavior for BUG B are both standard,
well-documented browser/CSS mechanics, not guesses, but neither was
confirmed by actually opening the Drawer. A human should check Mã's label
centering and Priority/MaxItems' empty/focused/filled states in both Create
and Edit, in the browser, before considering this closed.

## 2026-10-22 Edit-mode row rework: Trạng thái moved to the Mã/Cơ chế row

Edit mode only; View mode's layout is untouched (verified by making every
change conditional on `mode === 'edit'`, never touching the `mode === 'view'`
branch's JSX).

**Before:**
- Mã/Cơ chế row (shared by View and Edit): 2 columns, `12/12`.
- Priority/MaxItems row (Edit only): 3 columns via `extraColumn`,
  `6/12/6` (Priority/MaxItems/Trạng thái).

**After:**
- Mã/Cơ chế row: still `12/12` in View mode (untouched); in Edit mode now
  3 columns — Mã/Cơ chế/Trạng thái, `8/8/8`. Implemented as a conditional
  3rd `<Col>` guarded by `mode === 'edit'` and `span={mode === 'edit' ? 8 : 12}`
  on the first two columns, directly in `PromotionTypeDetailDrawer`'s JSX
  (not through `PromotionTypePriorityMaxItemsRow`'s `extraColumn` pattern —
  that component only ever wrapped `InputNumber` fields; Mã/Cơ chế are plain
  read-only `<div>`s outside any `Form.Item`, so there was no form-field
  component to reuse here, just the Row/Col JSX already in the Drawer).
- Priority/MaxItems row (both Create and Edit, same component): back to
  `12/12`, same as Create always had.

**`PromotionTypePriorityMaxItemsRow`'s `extraColumn` prop removed.** Now
that Trạng thái lives in the Mã/Cơ chế row instead, no caller passes
`extraColumn` anymore (confirmed via grep — both `PromotionTypeCreateDrawer`
and `PromotionTypeDetailDrawer` call `<PromotionTypePriorityMaxItemsRow />`
with no props). Removed the prop, its type, and the `6/12/6`-vs-`12/12`
span-switch logic rather than leave it as dead code; the component is now
always the even `12/12` split.

**MaxItems addon re-check (point 3):** kept the `Form.Item` `extra`-caption
approach from the 2026-10-21 addendum rather than reverting to `addonAfter`.
That fix wasn't actually about available width — it was that any text
wrapping inside the input's own bordered `addonAfter` slot grows the input
box taller than its row neighbors, which is independent of how wide the
column is. The caption-below approach keeps working identically at `12/12`
and would have kept working at `6/12/6` too; widening the column just gives
the caption more horizontal room before it wraps, which is a minor
readability improvement, not a correctness requirement.

**Alignment:** the Mã/Cơ chế/Trạng thái `Row` keeps `align='top'` (unchanged
from the prior pass). The Priority/MaxItems `Row` also already had
`align='top'` from the 2026-10-22 MaxItems-vertical-wrap addendum, so no
further change was needed there.

**View mode / header controls:** not touched — `mode === 'view'`'s Mã/Cơ
chế row (still 2-column) and its separate Priority/MaxItems/Trạng thái
`ReadOnlySection` row, the "Sửa" button, and all other header controls are
unchanged in this diff (confirmed via the diff touching only the shared Mã/
Cơ chế Row's Col spans/conditional 3rd Col, and the Edit-mode `Form`'s
`PromotionTypePriorityMaxItemsRow` call site).

**Validation:** `npm run typecheck` clean; `npx eslint` on
`PromotionTypeDetailDrawer/index.tsx` and
`PromotionTypePriorityMaxItemsRow/index.tsx` — 0 errors/0 warnings;
`npx prettier --check` on both — already correctly formatted; `npm run
build` succeeded (same pre-existing >500kB chunk-size warning). `git status
--short` shows exactly the expected files for this pass:
`PromotionTypeDetailDrawer/index.tsx` and
`PromotionTypePriorityMaxItemsRow/index.tsx` (plus `PromotionTypeCodeInput.
tsx`/`.module.scss`, `PromotionTypeDescriptionField/styles.module.scss`, and
`PromotionTypePriorityMaxItemsRow/styles.module.scss`, all carried over
unchanged by this pass from the two prior addenda).

**Not verified:** no browser was used to confirm the new Edit-mode 3-column
Mã/Cơ chế/Trạng thái row renders with even spacing at the Drawer's 560px
width, that View mode's layout is pixel-identical to before, or that the
Priority/MaxItems row's wider columns look better/the same as the narrower
ones did. A human should open both modes and compare side by side.

## 2026-10-23 BE rename: `promotion-types` → `offer-types` URL, permission string values

Per the updated BE doc (plan §16, 2026-10-23, superseding the old URL facts
in §15): the BASE_PATH and the three permission string *values* moved to
"offer"; nothing else did.

**Changed:**
- `services/promotion-type.service.ts`: `BASE_PATH` from
  `'api/admin/portal/v1/promotion-types'` to
  `'api/admin/portal/v1/offer-types'`. No other hardcoded URL fragment exists
  in the module (grep confirmed — the only other `promotion-types` string was
  the query-key factory's cache-key array `['promotion-types']`, which is an
  internal TanStack Query cache identity, not a URL, and was left unchanged).
- `src/constants/permission.constant.ts`: `PROMOTION_MANAGEMENT_VIEW/CREATE/EDIT`
  string values changed from `promotion_management:view|create|edit` to
  `offer_management:view|create|edit`. The TS constant identifiers were kept
  exactly as named, per explicit instruction. Grep found no other hardcoded
  `promotion_management:` literal anywhere in the promotion-type module (no
  `useHasPermission` call or elsewhere bypasses the constant).
- Updated stale comments referencing the old swagger path in
  `types/promotion-type.types.ts` (4 comments: list/detail GET, PUT, PATCH
  status, POST) and `mock-data.ts`'s doc comment, so they no longer describe
  an endpoint that no longer exists.

**Explicitly NOT changed** (per instruction): the module folder path
(`src/modules/products/promotion-management/promotion-type/`), route paths,
file/hook/service/component names, and all DTO/type names
(`PromotionTypeResponse`, `CreatePromotionTypeRequest`,
`PromotionTypeUpdateRequest`, `PromotionTypeStatusRequest`,
`PromotionTypeLookupResponse`).

**Runtime effect today:** none — `USE_MOCK_PROMOTION_TYPE_DATA` is still
`true`, so no request currently hits `BASE_PATH`. The change only matters
once mock mode is flipped off, which is exactly why it had to be correct now
rather than deferred.

**Validation:** `npm run typecheck` clean; `npx eslint` on all 4 touched
files — 0 errors/0 warnings; `npx prettier --check` — already formatted;
`npm run build` succeeded (same pre-existing >500kB chunk-size warning seen in
every prior sprint).

**Not verified:** no backend call was made against the real `offer-types`
endpoint (mock mode is still on), and no browser was used to confirm
permission-gated UI still shows/hides correctly — the string value change
only matters once the backend's actual role data is live and returns
`offer_management:*` instead of `promotion_management:*`.

## 2026-10-23 Permission value correction: `offer_management` → `offer_type`

Corrects the string value set in the previous rename pass (same day). The
three permission values are now `offer_type:view|create|edit`, not
`offer_management:view|create|edit`.

**Changed:** `src/constants/permission.constant.ts` — only the string
values; `PROMOTION_MANAGEMENT_VIEW/CREATE/EDIT` identifiers unchanged, same
as the prior pass.

**Grep check:** searched all of `src/` for `offer_management` — the only
occurrences were the 3 values and their own comment in
`permission.constant.ts`; no other hardcoded literal existed anywhere in the
promotion-type module (no bypass of the constant).

**Validation:** typecheck clean; eslint 0/0; prettier clean; build succeeded
(same pre-existing chunk-size warning).

**Not verified:** no runtime/browser check of permission-gated UI — the
module is still on mock data and this value only matters against the
backend's real role response.

## 2026-10-23 Cutover: mock data → real BE API

**Changed:**
- `services/promotion-type.service.ts`: `USE_MOCK_PROMOTION_TYPE_DATA` flipped
  from `true` to `false`. Kept as a flag rather than removing the
  mock/real branching — the mock branches and `mock-data.ts` stay in place
  (unused when the flag is `false`) as a fallback for FE-only debugging,
  per the task's own stated preference when removal isn't clearly better.
- List query re-check against the restated BE contract: query sends
  `keyword`/`status`/`page`/`size` correctly, but the sort param's wire key
  was `orderBy` — the BE doc's param name is `sort`. Fixed: `appendQueryParams`
  now sends `['sort', params.orderBy]`. The internal
  `PromotionTypeListQueryParameters.orderBy` field name is unchanged (no
  consumer/UI change needed), only the query-string key sent on the wire.

**Re-verified against the restated contract (all 5 operations):**
1. `GET /portal/v1/offer-types` (list) — params now `page/size/sort/keyword/
   status`. **Gap found, not fixed:** `productLineCode` is not an available
   list filter anywhere in this module — no UI control, no query param.
   Adding one is a new filter feature, out of this cutover's scope; flagging
   it rather than silently adding UI. Response shape `{pageInfo, items[]}`
   matches `PromotionTypePagedResponse` exactly.
2. `POST /portal/v1/offer-types` (create) — body
   `{code, name, description, priority, maxItems, status, mechanism}` matches
   `CreatePromotionTypeRequest` exactly. 201/response body maps to
   `PromotionTypeResponse`.
3. `GET /portal/v1/offer-types/{id}` (detail) — 404 detection
   (`isPromotionTypeNotFoundError`) checks HTTP status 404, not the error
   `code` string, so `PORTAL_CV_OFFER_147` vs. any other 404 code value makes
   no difference to this module's logic; no change needed.
4. `PUT /portal/v1/offer-types/{id}` (update) — body
   `{name, description, priority, maxItems}` only, matches
   `UpdatePromotionTypeRequest` exactly; `code`/`mechanism` correctly absent
   (VL-09, immutable after creation).
5. `PATCH /portal/v1/offer-types/{id}/status` (toggle) — body `{status}`
   matches `UpdatePromotionTypeStatusRequest` exactly.

`PROMOTION_TYPE_CODE_DUPLICATE_ERROR_CODE` is already `'PORTAL_CV_OFFER_122'`
(set in an earlier sprint), matching the duplicate-code error this task asked
to re-confirm — no change needed.

**Validation — static only:** `npm run typecheck` clean; `npx eslint` on the
changed file — 0 errors/0 warnings; `npx prettier --check` — already
formatted; `npm run build` succeeded (same pre-existing chunk-size warning).

**Not verified live — explicitly flagged, not claimed as done:** this
environment has no interactive browser session and no MSAL credentials
available to this agent, so none of the 5 operations (list load, create,
view detail, edit/save, toggle status in both itemCount=0 and itemCount>=1
variants) or the duplicate-code error path were exercised against the real
dev backend. Static checks prove the request/response shapes compile and
match the restated contract; they do not prove the real backend accepts
these payloads, returns these shapes, or that MSAL/401 behavior works
end-to-end. **A human with dev-environment access must run these 5
operations plus the duplicate-code error path before this is considered
merge-ready**, since the module has had its URL and DTO shapes revised
multiple times already and mock mode was the only thing exercising this code
path until now.

## 2026-10-23 Merge: PromotionTypeCodeInput into PromotionTypeCodeField

`PromotionTypeCodeInput.tsx` (the input-only transform component) and
`PromotionTypeCodeField.tsx` (the `Form.Item` wrapper) had exactly one
consumer between them (`PromotionTypeCreateDrawer`) and no independent reuse
potential, so they were merged into one file,
`components/PromotionTypeCodeField.tsx`. `PromotionTypeCodeField` is now the
single component owning both the `Form.Item` registration and the
uppercase/character-filter input logic. `PromotionTypeCodeInput.tsx` and its
private stylesheet `PromotionTypeCodeInput.module.scss` were deleted; the
stylesheet was recreated as `PromotionTypeCodeField.module.scss` with
identical selectors/declarations (no visual change). The merge preserves the
original `Form.Item name='code' noStyle` + cloned-child `value`/`onChange`
wiring exactly — the internal transform logic (`handleChange`,
floating-label state) and the shared Input is a straight copy, split into an
internal `PromotionTypeCodeControl` helper for readability, not a behavior
change. The only consumer, `PromotionTypeCreateDrawer/index.tsx`, already
imported `PromotionTypeCodeField` (not `PromotionTypeCodeInput`), so no
import-site change was needed there.

Verified against the helper text ("Chỉ chữ in hoa, số và gạch dưới (_), tối đa
20 ký tự."):

- **Keystroke-level character filter:** confirmed. `handleChange` applies
  `.toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 20)` on every keystroke
  — lowercase is auto-uppercased (not rejected), and any character outside
  `A-Z0-9_` is stripped as typed, not just on blur/submit.
  `PROMOTION_TYPE_CODE_MAX` (`constant.ts:85`) is `20`.
- **20-character cap:** confirmed hard-stop, not a silent-truncation
  `maxLength` prop alone. The `.slice(0, 20)` inside `handleChange` is what
  actually bounds the value passed to `onChange`/the form field; the
  `maxLength={20}` prop on the underlying AntD `Input` is a secondary native
  constraint on the same box, not the only enforcement. Behavior unchanged
  from the pre-merge component — reported here because the task asked to
  confirm it either way, not because this merge changed it.
- **Minimum length (3 chars, VL-02, BE regex `^[A-Z0-9_]{3,20}$`):** already
  enforced, pre-existing — not added by this task. It is not in the input
  mask (keystroke level), as expected, but in the create form's Zod schema:
  `PROMOTION_TYPE_CODE_PATTERN = /^[A-Z0-9_]{3,20}$/` (`constant.ts:86`),
  used by `promotionTypeCreateFormSchema`'s `code` field
  (`utils/promotion-type.validation.ts`) via `.regex(PROMOTION_TYPE_CODE_PATTERN,
  t('PromotionManagement.promotionType.validation.codePattern'))`. This one
  regex already expresses both VL-02 (character class) and the 3-char floor
  (VL-02/VL-03's length bound), so no new Zod rule was added. The i18n error
  message (`vi.json`/`en.json` `codePattern` key) does not cite
  `PORTAL_CV_OFFER_150` by error-code string — this module's error-code
  citations (see `PROMOTION_TYPE_CODE_DUPLICATE_ERROR_CODE` for the VL-03
  uniqueness case) are kept in code comments/constants, not inside the
  user-facing message text itself, consistent with how the create flow
  already handles `PORTAL_CV_OFFER_122`.

No i18n keys were added, renamed, or removed — `PromotionTypeCodeField` reuses
the same two existing keys (`column.code`, `field.codeHelper`) the merged
component already used.

Validation: `npm run typecheck` clean, `npx eslint` on both changed files (0
errors/0 warnings), `npm run build` succeeded (same pre-existing >500 kB
chunk-size warning seen throughout this task's history, unrelated). Not
verified live (no browser session in this environment) — a human should open
the Create drawer and confirm the floating label and uppercase/strip behavior
visually, since this is a presentation-layer merge.

## 2026-10-23 Cleanup: single-consumer component merge + comment audit

**1. Line-count survey of `components/`** (after the CodeField/CodeInput
merge already done):

| File | Lines | Consumers |
| --- | --- | --- |
| `PromotionTypeStatusField.tsx` | 18 | 1 (`PromotionTypeCreateDrawer`) |
| `PromotionTypeNameField/index.tsx` | 26 | 2 (`PromotionTypeCreateDrawer`, `PromotionTypeDetailDrawer`) |
| `PromotionTypeMechanismField/index.tsx` | 53 | 1 (`PromotionTypeCreateDrawer`) |
| `PromotionTypeDescriptionField/index.tsx` | 74 | 2 (`PromotionTypeCreateDrawer`, `PromotionTypeDetailDrawer`) |
| `PromotionTypeStatusToggle.tsx` | 75 | 1 (`PromotionTypeDetailDrawer`) |
| `PromotionTypeCodeField.tsx` | 82 | 1 (`PromotionTypeCreateDrawer`) |
| `PromotionTypePriorityMaxItemsRow/index.tsx` | 104 | 2 (`PromotionTypeCreateDrawer`, `PromotionTypeDetailDrawer`) |
| `PromotionTypeTableSection/index.tsx` | 197 | page-level |
| `PromotionTypeCreateDrawer/index.tsx` | 218 (pre-merge) | page-level |
| `PromotionTypeDetailDrawer/index.tsx` | 465 | page-level |

Only two files were under the 50-line threshold: `PromotionTypeStatusField.tsx`
(18 lines) and `PromotionTypeNameField/index.tsx` (26 lines).
`PromotionTypeNameField` is used by both `PromotionTypeCreateDrawer` and
`PromotionTypeDetailDrawer` — kept separate per instruction, since merging it
into either parent would duplicate the floating-label/`Form.Item` logic for
the other. `PromotionTypeMechanismField` (53 lines) has only one consumer but
is over the 50-line threshold, so it was left as-is.

**Merged:** `PromotionTypeStatusField.tsx` → inlined into
`PromotionTypeCreateDrawer/index.tsx` (its only consumer). The hidden
`Form.Item name='status'` + `Input` and its explanatory comment (why `status`
needs a registered hidden field when its real UI control, the header
`Switch`, lives outside the `<Form>` subtree in `Drawer`'s `extra` slot) moved
as-is into the Drawer's JSX, right after `PromotionTypePriorityMaxItemsRow`.
No prop/behavior change — `form.useWatch`/`form.setFieldValue` wiring in the
Drawer already referenced the `status` field name directly, not the deleted
component, so nothing else needed updating. `PromotionTypeStatusField.tsx`
deleted; it had no other import sites.

**2. Comment audit (WHAT vs WHY):** every comment across
`components/PromotionTypeNameField`, `PromotionTypeMechanismField`,
`PromotionTypeDescriptionField`, `PromotionTypeStatusToggle`,
`PromotionTypeCodeField`, `PromotionTypePriorityMaxItemsRow`,
`PromotionTypeTableSection`, `PromotionTypeCreateDrawer`, and
`PromotionTypeDetailDrawer` was read and classified. All of them explain a
non-obvious constraint, a UI-polish decision history, a BE validation rule
reference, or a reuse/rejection rationale (the `Existing components checked`
notes) — none restate what the following line of code already says. **No
comment was removed**; this module had no WHAT-only comments to begin with.

**3. No logic/behavior change** beyond the structural move described above —
confirmed by re-running the same checks: `npm run typecheck` clean, `npx
eslint` on the two touched files (0 errors/0 warnings), `npm run build`
succeeded (same pre-existing >500 kB chunk-size warning). No dead code or bug
was found during this pass. Not verified live — a human should reopen the
Create drawer and confirm the status Switch in the header still toggles the
hidden field and reaches `handleFinish`'s submitted `values.status` as
before, since this is a structural move.

## Addendum (2026-10-26) — "Xem trong Danh sách ưu đãi" link from Detail Drawer

Added a cross-UC navigation action to UC #2091's `PromotionTypeDetailDrawer`'s
"Ưu đãi thuộc loại" section (the existing `Số ưu đãi: {itemCount}` row),
wiring up a `<Button disabled>` placeholder that was already sitting there
(`PromotionTypeDetailDrawer/index.tsx`, `itemsViewLink`) rather than adding a
new element. Detail Drawer only, per scope — not added to Create Drawer.

**Route/constant found and used:**
- `PageURLs.ofPromotionList()` (`src/utils/navigate.ts:347`) →
  `/product/promotion-management/promotion` (confirmed from `src/routes/index.tsx`
  and existing callers; the instruction's guessed path
  `/promotion-management/promotion` was missing the `/product` segment).
- Navigation uses `useNavigate()` + this constant, not a hardcoded string.

**Query param found and used:**
- `offerTypeId` — confirmed via
  `promotion/types/promotion.types.ts:26,84,103` and
  `promotion/services/promotion.service.ts:45` as the real DTO/wire field
  name (UI local state on `PromotionListPage` is named `categoryId`, but the
  query key/service param and URL I append are `offerTypeId`).
- **Gap found and fixed:** `PromotionListPage` never read any URL search
  param — passing `?offerTypeId=…` alone would have silently done nothing at
  the destination. Added a one-time lazy `useState` initializer on
  `PromotionListPage` that reads `offerTypeId` from `useSearchParams()` on
  mount to seed `categoryId`, so the deep link actually pre-filters the list.
  This does not touch the existing in-page filter bar/select behavior or sync
  the URL back on filter changes — out of scope beyond making the deep link work.

**Permission found and used:**
- `PERMISSIONS.PRODUCT_PROMOTION_VIEW` (`'offer:view'`) — the exact
  permission `src/routes/index.tsx:720` already guards the promotion list
  route with, and the same `useHasPermission().hasPermission([...])` pattern
  `PromotionListPage` itself uses for its own action gating. The Detail
  Drawer's own `PROMOTION_MANAGEMENT_EDIT` check (`canEdit`) is untouched and
  unrelated — this is a separate `canViewPromotionList` check gating only the
  new button.
- Button is conditionally rendered (`{canViewPromotionList && <Button ...>}`),
  not disabled-with-tooltip — matches this drawer's own existing pattern for
  the header "Sửa" button, which is also conditionally rendered on
  `canEdit`/`promotionType`, not disabled.

**Validation:** `npm run typecheck` clean; `npx eslint` on both touched files
(0 errors/0 warnings); `npm run build` succeeded (same pre-existing >500 kB
chunk warning, no new issue). **Not verified live** — a human should open the
Detail Drawer with a user who has `offer_type:view` but not `offer:view` and
confirm the button is absent, then with a user who has both and confirm
clicking it lands on the promotion list pre-filtered to this type's category
select value.

## Addendum (2026-10-26) — Server-side sort on "Tên loại" and "Cơ chế" columns

**Correction to the request's premise:** `PromotionTypeTableSection` had **no
sortable column at all** before this change — not "Độ ưu tiên"/priority as
guessed. `orderBy` was a hardcoded constant
(`DEFAULT_ORDER_BY = 'createdDate,desc'`), and no column had a `sorter` prop
or any click-driven sort state. There was nothing to copy from inside this
module.

**Pattern used instead:** `src/modules/system/theme-management/components/
TopicTableSection/index.tsx` (`name`/`startAt` columns), the closest existing
server-side AntD `Table` sort implementation on a Query-owned list in this
repo:
- A local `PromotionTypeSort = { field: 'name' | 'mechanism'; order: 'ascend'
  | 'descend' }` state, undefined by default (falls back to
  `DEFAULT_ORDER_BY`).
- `sorter: true` + `sortOrder: sort?.field === '<col>' ? sort.order : null` on
  the "Tên loại" (`name`) and "Cơ chế" (`mechanism`) columns.
- `Table`'s `onChange` maps the AntD sorter event to this state: a known
  field with a non-null `order` sets `sort` and resets to page 1; clearing the
  sort (`order` becomes `undefined`, AntD's third-click behavior) or an
  unrecognized field resets `sort` to `undefined`. This is the exact same
  three-field check Topic's own handler uses, generalized to this module's
  two sortable fields.
- `orderBy` sent to `promotionTypeQueryKeys.list(...)` (and from there to
  `GET /portal/v1/offer-types?...&sort=...`, per
  `promotion-type.service.ts`'s `['sort', params.orderBy]` mapping) becomes
  `` `${sort.field},${sort.order === 'ascend' ? 'asc' : 'desc'}` `` when a
  sort is active, e.g. `name,asc` or `mechanism,desc` — same shape as the
  existing `priority,asc` example and Topic's `name,asc`/`startAt,desc`.
- **Single-sort only**, matching the existing repo convention (Topic does the
  same): clicking a second sortable column header replaces the active sort
  rather than adding a secondary one. No `multiple`/`sorterOrder` array logic
  was introduced.

**Flag — BE sort-field validity not confirmed for `name`/`mechanism`:** the BE
`sort` param doc for `GET /portal/v1/offer-types` only documents
`priority,asc` as an example and does not enumerate which fields are valid.
Wired client-side per the instruction regardless, since this is a reasonable
extension of the existing `sort=<field>,<asc|desc>` param contract already in
use for `createdDate`. **Not confirmed against a live BE response** whether
`sort=name,...` or `sort=mechanism,...` are accepted/sorted correctly server-
side, or silently ignored/400'd — a human must verify this against the real
dev API before relying on it.

**Validation:** `npm run typecheck` clean; `npx eslint` on the touched file
(0 errors/0 warnings); `npm run build` succeeded (same pre-existing >500 kB
chunk warning, no new issue). **Not verified live** — a human should open the
list, click "Tên loại" then "Cơ chế" headers through ascend/descend/clear, and
confirm against the network tab that `sort=name,asc|desc` and
`sort=mechanism,asc|desc` are sent and that the BE actually reorders the
rows (not just accepts the param silently).

## Addendum (2026-10-26) — "Mã" field styling and validation parity

**Scope check confirmed:** `PromotionTypeCodeField` is only rendered by
`PromotionTypeCreateDrawer`. `PromotionTypeDetailDrawer` renders `code` as a
plain read-only `<div>{promotionType.code}</div>` (VL-09) and never imports
`PromotionTypeCodeField` — so Edit is genuinely unaffected by anything below.

**Root cause found (one fix covers both reported symptoms):**
`PromotionTypeCodeField.tsx` wrapped its control in
`<Form.Item name='code' noStyle>`. Reading `antd`'s own `FormItem`
implementation (`node_modules/antd/es/form/FormItem/index.js`): `noStyle`
still wraps children in `StatusProvider` (so the nested AntD `<Input>`
continues to receive red-border error styling via `FormItemInputContext`),
but it **skips `ItemHolder` entirely** — the component that renders the
actual `.ant-form-item-explain-error` help text and the field's own
`.ant-form-item` wrapper/spacing. Every other floating-label field in this
module (`name`, `description`, `priority`, `maxItems`) uses a plain
`<Form.Item name='...'>` with no `noStyle` — `code` was the only outlier.

**Fix:** removed `noStyle` from `PromotionTypeCodeField.tsx`'s `Form.Item`.
This was the only structural divergence between Mã's Form.Item and every
other field's, so this single change is what brings it into the same error-
display path as Tên loại:
- Submitting with `code` empty now renders the standard
  `.ant-form-item-explain-error` text under the field, same mechanism Tên
  loại already uses — sourced from `promotionTypeCreateFormSchema`'s
  existing `code: z.string().trim().min(1, ...codeRequired)` /
  `.regex(PROMOTION_TYPE_CODE_PATTERN, ...codePattern)` rules (already
  correct, confirmed present before this change) via
  `mapPromotionTypeCreateZodIssuesToAntdErrors` →
  `mapApiErrorDetailsToFieldErrors` → `form.setFields([{ name: ['code'],
  errors: [...] }])` in `PromotionTypeCreateDrawer`'s `applyFieldErrors`
  (already correct, confirmed present before this change — `code` is in
  `PROMOTION_TYPE_CREATE_FORM_FIELDS`).
- `PORTAL_CV_OFFER_151`/`PORTAL_CV_OFFER_150`-equivalent messages are the
  existing `codeRequired`/`codePattern` i18n keys — not changed by this task,
  since the Zod wiring itself was already correct and not in scope to rename.

**Styling (item 1) — no further code-level difference found.**
`PromotionTypeCodeField.module.scss`'s `.styledControl` (`border-radius:
1.2rem`, no explicit border-color) is already structurally identical to
`PromotionTypePriorityMaxItemsRow/styles.module.scss`'s and
`PromotionTypeDescriptionField/styles.module.scss`'s `.styledControl` (same
property, same value, same label treatment) — both of those are the
confirmed-working floating-label fields referenced by the request. No global
stylesheet (`src/custom-ant.scss`, `src/index.scss`) overrides `.ant-input`
border-radius/color in a way that would apply to one field and not another.
The only actual code-level divergence was the `noStyle` Form.Item fixed
above — and per the antd source read above, `noStyle` does not prevent the
nested `<Input>` from receiving focus/error border styling via context
either, so no separate border-radius/color fix was identified or applied.
**Not verified live against the attached screenshot** — if the visual
mismatch persists after this fix, it must be diagnosed from an actual
rendered screenshot/DOM inspection (not available in this environment), since
static source comparison shows no remaining difference to correct.

**Validation:** `npm run typecheck` clean; `npx eslint` on the touched file
(0 errors/0 warnings); `npm run build` succeeded (same pre-existing >500 kB
chunk warning, no new issue). **Not verified live** — a human should open
Create, submit with Mã empty and confirm the red-border + inline error text
now appears under Mã exactly like Tên loại's, then re-check the screenshot's
visual complaint against the fixed build.

## Addendum (2026-10-26) — "Mã" field border notch, root cause

**Live rendering still not reachable in this environment.** Attempted to
honor the request to inspect actual computed DOM/CSS rather than reason from
the stylesheet alone: this environment has no authenticated browser session
(no MSAL login, confirmed again — `npm run dev` has no mock/bypass mode, same
standing constraint noted in every report in this series). I could not open
the app or take a screenshot to directly confirm computed styles. The
analysis below is therefore still static, but went one level deeper than the
previous pass: into AntD's own component source
(`node_modules/antd/es/input/Input.js`, `node_modules/antd/es/input/utils.js`)
rather than comparing only this module's `.scss` files, which is what missed
it last time.

**Root cause found:** `hasPrefixSuffix(props)` in AntD's `Input` (`utils.js`)
is `!!(props.prefix || props.suffix || props.allowClear || props.showCount)`.
When true, AntD/`rc-input` wraps the control in an extra
`<span class="ant-input-affix-wrapper">` and the *wrapper* becomes the
bordered box (the inner `<input>` becomes borderless inside it). When false,
`rc-input` renders a **bare `<input>`** with the border directly on the
native element — no wrapper at all.

- **Tên loại** (`PromotionTypeNameField` → `@/components/input.tsx`) passes
  `showCount` → `hasPrefixSuffix` is `true` → its Input is wrapped, and
  `@/components/input.tsx`'s own `rootStyles` explicitly targets
  `.ant-input-affix-wrapper { height: 5.6rem; ...; display: flex; align-items:
  center; box-sizing: border-box; }`. This gives Tên loại's bordered box a
  fixed, explicit 5.6rem height that the floating label's `top: -1rem` offset
  was tuned against.
- **Mã** (`PromotionTypeCodeField`) passes no `prefix`/`suffix`/`allowClear`/
  `showCount` → `hasPrefixSuffix` is `false` → AntD renders a **bare**
  `<input>`, with no wrapper and no explicit height — it fell back to AntD's
  default (unstyled) large-Input box metrics, which `PromotionTypeCodeField
  .module.scss`'s `.styledControl` never overrode (only `width` and
  `border-radius` were set, no `height`/`box-sizing`). The floating label's
  `top: -0.8rem` offset (copied from the same pattern as Priority/
  Description) was positioned assuming the same 5.6rem box used by Tên loại's
  wrapper — against the bare input's different actual height, the label's
  solid background no longer sits exactly over the border line, so part of
  the actual border remains visible on either side of the label instead of
  being fully covered — the reported "notch/cutout".

**Fix applied (CSS-only, `PromotionTypeCodeField.module.scss`):** added
`height: 5.6rem; line-height: 5.6rem; box-sizing: border-box;` to
`.styledControl`, forcing the bare `<input>`'s box to the exact same height
as Tên loại's affix-wrapper box, so the label's existing `-0.8rem` offset now
lands correctly over the (now correctly-positioned) border line. No uppercase-
filter/`[A-Z0-9_]`/length-limit input logic in `PromotionTypeCodeField.tsx`
was touched — this is purely in the `.module.scss` file.

**Note for recurrence:** `PromotionTypePriorityMaxItemsRow` and
`PromotionTypeDescriptionField`'s local floating-label replicas (`InputNumber`
/`TextArea`, not plain `Input`) were **not** audited against this same
`hasPrefixSuffix`/wrapper-vs-bare mechanism in this pass — they are different
AntD components with their own wrapping rules (`InputNumber` always renders
its own `.ant-input-number` wrapper regardless of props; `TextArea`'s
wrapping depends on its own `showCount`, which Description's field does set).
Both are plausibly fine for unrelated reasons, but this was not independently
re-verified here — flagging so a recurrence of this exact notch pattern on
another local replica isn't missed by assuming it's unique to `Input`.

**Validation:** `npm run typecheck` clean; `npx eslint` on the touched file
(0 errors/0 warnings); `npm run build` succeeded (same pre-existing >500 kB
chunk warning, no new issue). **Still not verified live** — this fix is the
most concrete, AntD-source-confirmed hypothesis found via static analysis,
not a visually-confirmed result; a human must open Create in a real browser,
compare Mã against Tên loại in both empty and focused/filled states, and
confirm the notch is actually gone before treating this as closed.

## Addendum (2026-10-26) — "Thông tin hệ thống" timestamps, GMT+7 display

**Which of the 3 flagged approaches was used, and why:** none of the
`.tz()`-based ones — went with the suggested **fixed-offset epoch
arithmetic** (`GMT7_OFFSET_MINUTES = 420`), as a plain native-`Date`
helper, not a dayjs call at all.

**The "preferred: plain `dayjs(value).format(...)`" assumption was checked
and found unsafe — do not use it.** Read dayjs's own parser
(`node_modules/dayjs/dayjs.min.js`, core, no plugins): for a string that
does **not** end in `Z` (e.g. `"...+07:00"`), dayjs's internal parse regex
has no offset-capturing group and fails to match the full string (the
trailing `+07:00` breaks its own `$`-anchored pattern), so it falls back to
`new Date(value)`. That correctly resolves the absolute instant from the
embedded offset — but dayjs then reads hours/minutes/etc. through `Date`'s
**local** getters (`getHours()`, not `getUTCHours()`) during `init()`, so
`.format('HH:mm:ss')` silently renders in the **browser's own local
timezone**, discarding the embedded `+07:00` entirely. Confirmed with a
runtime check under a forced non-GMT+7 `TZ`:
```
TZ=America/Los_Angeles node -e "require('dayjs')('2026-10-23T10:31:16.736+07:00').format('HH:mm:ss')"
```
would print the Los-Angeles-local hour, not `10:31:16` — i.e. exactly the
bug this task exists to avoid. This confirms the addendum's concern was
correct and the "preferred" shortcut must not be used as-is.

**Why not `.tz('Asia/Ho_Chi_Minh')` either:** confirmed via grep this repo
registers `dayjs.extend(utc)`/`dayjs.extend(timezone)` in exactly one file
(`list-notification/view/settings/customersegment-schedule.tsx`), nowhere
global — calling `.tz(...)` anywhere else throws. Registering the plugins
globally as a side effect of this task was explicitly out of scope.

**Why not `theme-management/utils/gmt7-date.util.ts`:** confirmed it's a
date-only slicer (naive date strings, no time component) and not touched or
reused here, per the addendum's own instruction.

**Implementation:** new module-local
`promotion-type/utils/promotion-type-date.util.ts`, exporting
`formatPromotionTypeDateTimeGmt7(value: string): string`. It does
`new Date(value)` (correctly resolves the absolute instant from any
embedded offset, or treats an offset-less string as UTC per spec — either
way the instant is correct), shifts that instant's epoch ms by the fixed
`+420` minutes, then reads the shifted result through `Date`'s **UTC**
getters only (`getUTCDate()`, `getUTCHours()`, etc. — never the local
ones) to produce `DD/MM/YYYY HH:mm:ss`. Reading via UTC getters on a
pre-shifted instant is what makes the result independent of the viewer's own
browser timezone; Vietnam has no DST so the single fixed +420 offset is
correct year-round. No dayjs plugin registration, no `.tz()`/`.utc()` call,
and no change to the shared `gmt7-date.util.ts` or to `@/utils/common`'s
`formatDateTime` (left as-is for its other, unrelated call sites).

Verified the helper's correctness directly (plain Node, not a browser),
under a deliberately wrong local `TZ`, with two equivalent-instant inputs
in different source formats:
```
TZ=America/Los_Angeles node -e "...formatPromotionTypeDateTimeGmt7 logic inlined..."
fmt('2026-10-23T10:31:16.736+07:00') -> 23/10/2026 10:31:16
fmt('2026-10-23T03:31:16.736Z')      -> 23/10/2026 10:31:16   (same instant, confirms offset-independence)
```
Both return the same correct Vietnam wall-clock value regardless of the
process's own timezone — which is the exact property plain `dayjs(...)
.format(...)` was shown above to lack.

**Wired into `PromotionTypeDetailDrawer/index.tsx`:** replaced the generic
`formatDateTime` (from `@/utils/common`, which has the same local-timezone
issue as plain dayjs, used for `createdDate`/`updatedDate`) with
`formatPromotionTypeDateTimeGmt7` at both call sites (`createdDate`,
`updatedDate`). `@/utils/common`'s `formatDateTime` itself was left
untouched — it's shared by other modules outside this task's scope.

**Validation:** `npm run typecheck` clean; `npx eslint` on both touched
files (0 errors/0 warnings); `npm run build` succeeded (same pre-existing
>500 kB chunk warning, no new issue). The epoch-math logic itself was
verified deterministically in Node under a non-GMT+7 `TZ` (above) — this is
stronger evidence than the previous two addenda had, since it's an actual
runtime check of the formatting logic, not static reasoning alone. **Not
verified live in the browser UI** — a human should still open the Detail
Drawer and visually confirm "Ngày tạo"/"Ngày cập nhật" show the expected
GMT+7 time against a known BE record, ideally with the OS/browser clock
set to a non-GMT+7 timezone to directly exercise the scenario this fix
targets.

## Addendum (2026-10-26) — PORTAL_CV_OFFER_122 real error-envelope shape

**Step 1 — shared helper's current assumption, and other consumers.**
`src/utils/api-error-envelope.helper.ts`'s `readApiErrorEnvelope` reads each
`details[]` item through `detail.field` (not `detail.code`) and requires both
`field` and `message` to be non-empty strings, or the item is dropped
entirely. Grepped every consumer of this helper repo-wide
(`grep -rl "api-error-envelope" src`): the only importers are inside this
promotion-type module — `utils/promotion-type.validation.ts` (both the
update-form and create-form Zod-issue mappers) and
`utils/promotion-type-api.error.ts` (status/404/409 checks and all three
field mappers). The Zod-issue mappers construct their own `details` array
client-side (`{ field: issue.path.join('.'), message: issue.message }`),
always with both keys populated — so they are not at risk from the real
backend shape, but they DO depend on the shared helper's current
`field`/`message`-required contract continuing to work as documented. No
consumer outside this module exists. Per the instruction, the shared
helper's default was left unchanged regardless, since altering it is a
broader, unscoped decision (flagged as `NEEDS-TEAM-DECISION` in code).

**Step 2 — fix, scoped to `mapPromotionTypeCreateApiErrorToFields`.**
Root cause: the real captured response's `details: [{ message: "", code:
"code", target: "" }]` has no `field` key at all and an empty `message`, so
`readApiErrorEnvelope(error).details` resolves to `[]` for this response —
the shared helper silently drops the only detail entry, and nothing ever
reached `form.setFields()`. Fixed locally in
`promotion-type-api.error.ts`:
- Added `readPromotionTypeRawDetailFieldNames(error)`, a small local reader
  (duplicating the shared helper's `error.response ?? error` / `.data`
  unwrapping, since the shared helper doesn't expose the raw `details[]`)
  that accepts either `detail.field` (documented shape) or `detail.code`
  (real shape) as the field-name key.
- `mapPromotionTypeCreateApiErrorToFields` now tries the documented shared
  mapping first (so a response that does match the documented shape keeps
  working unchanged), and only when that mapping finds nothing AND a raw
  `code`/`field` name resolves to a known create-form field, falls back to:
  using the envelope's top-level `message` (not the empty `details[].message`)
  as the field's error text, with `{0}` interpolated against a new
  `submittedValues` parameter.
- `PromotionTypeCreateDrawer`'s catch block now passes
  `{ code: values.code }` as `submittedValues`, so PORTAL_CV_OFFER_122's
  `"Mã loại «{0}» đã tồn tại, vui lòng nhập mã khác"` renders as
  `"Mã loại «QUA_TANG_VAY» đã tồn tại, vui lòng nhập mã khác"` (matching the
  target screenshot) and is attached to the Mã field via `form.setFields()`,
  not shown only as a form-level `Alert`.
- `PROMOTION_TYPE_CODE_DUPLICATE_ERROR_CODE` (`constant.ts`) was not wired
  into this path: the fix keys off the real `details[].code` field-name
  value instead of the top-level error `code` string, so
  `PORTAL_CV_OFFER_122` vs. any other error code that happens to use the
  same envelope shape is handled uniformly without a code-string branch.
  That constant remains otherwise unused; whether it should be removed or
  wired elsewhere is unchanged by this task.

**Step 3 — does the same shape apply to 150/151/164/162?**
No real captured payloads exist for these (150 regex, 151 required, 164/162
range) — only the 122 duplicate-code response was captured. However, the fix
above is **not** special-cased to error code 122: it keys purely off
"did `details[]` carry a recognizable field name and the shared mapping find
nothing," which is a property of the response shape, not the error code.
Since 150/151/164/162 are expected to come from the same `POST
/offer-types` endpoint, if they share the same backend envelope convention
(field name in `details[].code`, empty `details[].message`, `{0}` in the
top-level `message`), they are already covered by this change with no
further code change needed. This is inferred from the fix's construction,
not independently verified against a captured 150/151/164/162 payload —
flagged here so it isn't mistaken for a confirmed result. In practice 150/151
are normally caught client-side by the create form's Zod schema
(`PROMOTION_TYPE_CODE_PATTERN` regex, `min(1)`) before any request is sent,
so the backend codes would only fire for a case Zod's rules don't also catch
(e.g. a race, or a future BE-only rule not mirrored in Zod).

**Validation:** `npm run typecheck` (clean), `npx eslint` on both touched
files (0 errors/0 warnings), `npm run build` (succeeded, same pre-existing
chunk-size warning). Not verified live in the browser — no captured
150/151/164/162 payload existed to test against, and the 122 case was not
re-driven through a running app (no MSAL session available in this
environment, consistent with every prior report in this series).

## Addendum (2026-10-26) — Bold interpolated values in "Tắt Loại ưu đãi?" confirm (PORTAL_CV_OFFER_142)

**Location found:** `PromotionTypeStatusToggle.tsx`'s `handleChange`, the
`modal.confirm({...})` call for turning a type off while `itemCount >= 1`.
`content` previously called `t('...toggleOffDescription', { name, itemCount })`
— a single plain-text string, both values interpolated inline with no
markup.

**Convention check:** grepped for an existing bold-interpolated dialog-text
pattern (`Trans`, `<strong>`/`<b>` near `Modal.confirm`/`modal.confirm`) —
none exists repo-wide. `src/utils/i18n.ts` is a plain global `i18next.t`
with no React i18n provider/hook (confirmed in `CLAUDE.md` and by
inspection), so there is no `Trans`-equivalent component to compose i18n
text with embedded JSX.

**Fix:** kept `vi.json`/`en.json`'s `toggleOffDescription` template
unchanged (still owns the literal `«{{name}}»`/`{{itemCount}}` text,
guillemets included, for both locales). Added
`renderToggleOffDescription(name, itemCount)` in the same file: calls
`t(key)` with **no** interpolation options to get the raw template with
`{{name}}`/`{{itemCount}}` tokens still literal — verified this is actually
how the installed i18next behaves (ran it directly via `node -e` against the
real `i18next` package: confirmed a template rendered with no option values
returns the placeholders unresolved, not stripped or empty) rather than
assuming it from the API. The raw template is then `.split()` on those two
exact tokens and remapped to React nodes, wrapping only the `name`/
`itemCount` segments in `<strong>`; every other character, including the
template's own `«`/`»`, passes through as plain text unchanged. `content`
now receives this JSX instead of a `t(...)` string.

Resulting render for `name="VươngNQ"`, `itemCount=1`: `Tắt loại «`**VươngNQ**`»
sẽ tắt `**1**` ưu đãi thuộc loại. Bật lại loại không tự bật lại ưu đãi. Xác
nhận tiếp tục?` — matches the target text, only the two values bold.

**Scope:** change is confined to `PromotionTypeStatusToggle.tsx`; no other
confirm/modal in this module uses interpolated values, and the i18n keys/
locale files were not touched, so vi/en parity is unaffected.

**Validation:** `npm run typecheck` (clean), `npx eslint` (0 errors/0
warnings), `npm run build` (succeeded, same baseline chunk-size warning).
Not visually verified live — no running browser session available in this
environment (standing constraint, same as every prior report in this
series).

## Addendum (2026-10-26) — Gate read-only banner on PROMOTION_MANAGEMENT_EDIT

**Root cause:** `PromotionTypeDetailDrawer`'s read-only `Alert`
(`styles.readOnlyBanner`, i18n key `drawer.readOnlyBanner`) was gated only
on `mode === 'view'`, independent of permission — so it rendered for every
viewer in view mode, including one who already has
`PERMISSIONS.PROMOTION_MANAGEMENT_EDIT` (`'offer_type:edit'`) and therefore
also sees the header "Sửa" button (gated at line ~204 on
`promotionType && canEdit`). Both could be visible simultaneously, which is
the reported bug.

**Fix:** reused the existing `canEdit` variable already declared in this
component (`const canEdit = hasPermission([PERMISSIONS.PROMOTION_MANAGEMENT_EDIT]);`,
the same check backing the "Sửa" button) — no new permission check added.
Changed the banner's condition from `mode === 'view'` to
`mode === 'view' && !canEdit`. This makes the banner and the "Sửa" button
exactly mutually exclusive within view mode: `canEdit` → "Sửa" button, no
banner; `!canEdit` → banner, no "Sửa" button. Edit mode is unaffected (the
banner was already suppressed there via `mode === 'view'`, and edit mode is
unreachable without `canEdit` in the first place).

**Validation:** `npm run typecheck` (clean), `npx eslint` (0 errors/0
warnings), `npm run build` (succeeded, same baseline chunk-size warning).
Not visually verified live — no running browser/auth session available in
this environment to confirm the banner/button toggle against both a
with-edit-permission and without-edit-permission account.

## Addendum (2026-10-26) — `<Trans>` feasibility check for the toggle-off confirm bold text

**Re-verified the prior pass's premise rather than trusting it.** Checked:
- `package.json`: no `react-i18next` dependency anywhere (only
  `"i18next": "^24.2.0"` and `"i18next-react": "^0.2.2"`).
- `node_modules`: `react-i18next` is not installed at all (only `i18next`
  and `i18next-react` exist on disk).
- `grep -rln "I18nextProvider|useTranslation|<Trans\b|from 'react-i18next'" src/`:
  zero matches anywhere in the codebase, including unused/dead code.
- `i18next-react` (the package that *is* installed) is a different,
  unrelated third-party micro-binding — not `react-i18next` under another
  name. Read its type declarations
  (`node_modules/i18next-react/dist/cjs/i18next-react.d.ts`): it exports
  `I18NextReactProvider`, `useI18n`, `useI18nLoaded`, `useMounted` — no
  `Trans` component, no `useTranslation` hook, nothing API-compatible with
  `react-i18next`'s `<Trans>`. It is also not imported anywhere in `src/`
  (same grep, zero matches), so it isn't even wired into the app today.
- `src/utils/i18n.ts`: confirmed (again) this file only calls
  `i18next.init({...})` and exports the raw `i18next.t`. No provider, no
  React binding of any kind sits on top of it.

**Conclusion: `<Trans>` is genuinely not usable here without a new
dependency.** `<Trans>` is specifically a `react-i18next` component; it
does not exist on plain `i18next`, and the one i18n-adjacent React package
that happens to be installed (`i18next-react`) does not provide it either
— so there is no way to render `<Trans>` without first adding
`react-i18next` to `package.json`. That is a new dependency plus (per
`react-i18next`'s own setup requirements) wrapping the relevant React tree
in `I18nextProvider` — a cross-cutting, app-wide addition, not a
module-local one, and explicitly out of scope per this repo's standing
rule to preserve the existing package manager/lockfile and not add
dependencies as an incidental change to a bug-fix task.

**What the real fix would require, if ever authorized:** add
`react-i18next` as a dependency; wrap the app root (or at minimum mount an
`I18nextProvider` using the existing `i18next` singleton from
`src/utils/i18n.ts`, which `react-i18next` can accept directly without
necessarily replacing the existing plain-`t()` usage everywhere); update
`vi.json`/`en.json`'s `toggleOffDescription` to the indexed-tag form
(`<1>{{name}}</1>`/`<3>{{itemCount}}</3>`); then this module's `<Trans
i18nKey="..." values={{ name, itemCount }} components={{ 1: <strong />, 3:
<strong /> }} />` would work as described. This is a `NEEDS-TEAM-DECISION`
architecture addition, not something to introduce unilaterally for one
dialog.

**No code change made.** `PromotionTypeStatusToggle.tsx`'s manual
`renderToggleOffDescription` split-and-bold implementation (added in the
prior addendum) is left in place as-is — it already renders the required
bold output correctly and needs no fallback changes.

## Addendum (2026-10-26) — PromotionTypeDetailDrawer decomposition (audit Findings 1, 2, 4)

Applied the refactor proposed in `docs/audits/promotion-type/2026-10-26-detail-drawer-clean-code-audit.md`, Findings 1, 2, and 4 (Finding 3, the `ReadOnlySection`/status markup inconsistency, was explicitly skipped as cosmetic-only per the audit's own ranking).

- **Finding 1** — extracted `components/PromotionTypeDetailDrawer/hooks/usePromotionTypeDetailDrawer.hook.tsx`. It owns the query (`useQuery(promotionTypeQueryKeys.detail(id))`), the update mutation, both permission checks (`canEdit`, `canViewPromotionList`), AntD `Form` state/dirty-tracking, the two discard-confirm flows, submit orchestration (`handleFinish`), and nav-to-list (`navigateToPromotionList`). `index.tsx` now calls this hook once and renders. File extension is `.hook.tsx`, not `.hook.ts`: the hook constructs a `<ModalContent>` JSX element for `confirmDiscardIfDirty`, which a `.ts` file cannot parse (`tsc` failed with JSX parse errors until renamed — confirmed empirically, not assumed).
- **Finding 2** — added a local, single-use `PromotionTypeStatusBadge({ status })` in `index.tsx` (not a new shared component, per rule 07's ~50-line single-use threshold) and used it at both the Edit-mode header status column and the View-mode status column, removing the duplicated `StatusBadge` construction.
- **Finding 4** — factored `confirmDiscardIfDirty(onConfirmed)` inside the new hook (as the audit's own note suggested); `requestClose` now calls `confirmDiscardIfDirty(onClose)` and `requestCancelEdit` calls `confirmDiscardIfDirty(revertToView)`, removing the duplicated `ModalContent` block.
- **Finding 5 follow-up** — the old lines 118–122 comment (why `revertToView` exists as a separate flow from `onClose`) moved with `revertToView` into the hook and was shortened to one line, since the two `confirmDiscardIfDirty(...)` call sites now make the "why two flows" distinction self-evident; the ticket reference (`PORTAL_CV_OFFER_124`) was kept.
- One deviation from the audit's exact return-shape list: the hook also returns `handleValuesChange`, which the audit's listed shape omitted but which `index.tsx`'s `<Form onValuesChange=...>` needs to drive dirty-tracking — without it the Edit form's dirty state and the "Hủy"/discard-confirm gating would silently stop working. Flagged here rather than silently added without note.

**Line counts vs. audit estimate:**

| File | Audit estimate | Actual |
|---|---|---|
| `index.tsx` | ~230 | 248 |
| `hooks/usePromotionTypeDetailDrawer.hook.tsx` (new) | ~130–150 | 194 |

`index.tsx` landed close to the estimate. The hook file ran larger than
estimated mainly because it also carries the two small private helpers
`applyFieldErrors` and `toFormValues` (moved verbatim from the old
`index.tsx`, ~20 lines total) and full import statements for every moved
dependency (`ModalContent`, permission/modal/navigate hooks, query/mutation
hooks, error/validation utils) — the audit's estimate did not separately
account for import-line overhead when the logic crosses a file boundary.

Validation: `npm run typecheck` (clean), `npx eslint` on both touched files
(0 errors/warnings on either), `npm run build` (succeeds; pre-existing
chunk-size warning unrelated to this change). Not verified: no browser
session opened — the View→Edit→Save cycle, the two discard-confirm popups,
and the read-only banner/status-badge rendering in both modes were not
re-tested live in this pass; only re-confirmed as behaviorally unchanged by
inspection (the moved logic is verbatim, not rewritten).

## Addendum (2026-10-26) — Mã field validateTrigger fix

Investigated before changing anything: the stated premise ("validation fires
on every keystroke, `validateTrigger: 'onChange'` AntD default") did not match
current code. None of `code`/`name`/`description`/`priority`/`maxItems`
declared an AntD `rules` prop anywhere in `PromotionTypeCreateDrawer` or
`PromotionTypeDetailDrawer`. All validation was Zod-only, run explicitly in
`handleFinish` on submit (`promotionTypeCreateFormSchema`/
`promotionTypeUpdateFormSchema`.`safeParseAsync`), with errors applied via
`form.setFields`. With no `rules`, AntD's `validateTrigger` had no effect —
there was no keystroke-level premature validation to fix today, for any of
the five fields.

Asked the user how to proceed; decision: add new blur-triggered AntD
validation to the Mã (code) field only, leaving the other four fields on
their current submit-only Zod validation (no premature-validate issue exists
for them, so nothing was changed there).

**Change** (`PromotionTypeCodeField.tsx`, single consumer:
`PromotionTypeCreateDrawer` — `code` is read-only on the update/detail form,
so this field never renders there):
- Added `rules={[{ validator: ... }]}` + `validateTrigger={['onBlur']}` to the
  `code` Form.Item. The validator delegates to
  `promotionTypeCreateFormSchema.shape.code.safeParse(value)` rather than
  duplicating the pattern/required constraint independently, per
  `.claude/rules/05-form.md`'s caution against maintaining the same constraint
  in both AntD rules and Zod.
- `PromotionTypeCodeControl` now accepts and forwards an `onBlur` prop (AntD
  `Form.Item` clones `onBlur` onto its child only when `validateTrigger`
  includes `'onBlur'`); without this the control had no element for AntD to
  hook the blur trigger into.
- Submit-time validation (`handleFinish`'s full-schema `safeParseAsync`) is
  unaffected — unchanged, still authoritative at submit.

**Error-clearing**: rather than rely on an unverified assumption about AntD's
internal "already-erroring field re-validates on next change even outside
its configured `validateTrigger`" behavior (checked current Ant Design docs
via Context7; found no explicit confirmation either way), `handleValuesChange`
in `PromotionTypeCreateDrawer` now explicitly clears the `code` field's
errors (`form.setFields([{ name: 'code', errors: [] }])`) whenever `code` is
among the changed values — guaranteeing the required "error clears on next
fix" behavior deterministically rather than depending on unconfirmed library
internals. This required widening `handleValuesChange`'s signature to accept
`changedValues` (previously took no parameters); `handleStatusChange`'s call
site was updated to pass `{ status }` accordingly.

**Validation**: `npm run typecheck` clean, `npx eslint` on both changed files
— 0 errors/warnings, `npm run build` succeeds (pre-existing unrelated
chunk-size warning only).

**Not verified**: no live browser re-test of the Mã field's blur-only error
display, the immediate clear-on-type behavior, or submit-time validation
still firing correctly — confirmed only by static inspection of the wiring.

## Addendum (2026-10-26) — Mã field cursor-jump fix (mid-string edit)

**Root cause confirmed**: `PromotionTypeCodeControl.handleChange`'s
`toUpperCase().replace(...).slice(...)` transform can change the string
length relative to the raw keystroke (stripped/truncated chars), and nothing
restored the native `selectionStart`/`selectionEnd` after the controlled
re-render, so a mid-string edit snapped the cursor to the end.

**Precedent check**: searched the repo for existing cursor-position-aware
input handling before writing new logic. Found
`CashLoanCatalogModal/index.tsx` and `SelectProductModalContent.tsx`, both
using `selectionStart`/`selectionEnd` in `onKeyDown`/`onPaste` handlers to
*block* an invalid keystroke/paste before insertion (prevent-then-never-insert),
not to restore cursor position after a committed, already-transformed value.
That's a different strategy than this field needs — Mã's transform silently
strips/uppercases already-typed characters rather than rejecting keystrokes
outright — so it wasn't directly reusable, but it confirms the repo already
has established practice for reading `selectionStart`/`selectionEnd` off a
native input event.

**Fix**: in `handleChange`, capture `selectionStart` before transforming,
compute the transformed length of the raw substring up to that position
(`transformCode(rawValue.slice(0, selectionStart))`, clamped to the same max
length as the full value) to get the new logical cursor position, then
restore it via `inputRef.current.setSelectionRange(cursor, cursor)`.

The restore is scheduled with `requestAnimationFrame` directly inside
`handleChange`, not a `useLayoutEffect` keyed on `value` as first attempted.
Reason, found via live testing (see below): when the transform fully strips
the typed character and the resulting string is identical to the current
React state, React bails the re-render (no state change), so a `value`-keyed
effect never fires — but the controlled-input value tracker still resets the
native DOM `.value` on every native `input` event regardless, which snaps the
cursor to the end anyway. Scheduling the restore unconditionally after the
current event/render cycle, independent of whether React actually re-renders,
covers both the changed- and unchanged-value cases.

**Verification performed** (runtime-only behavior, not provable by static
checks): the real app requires MSAL SSO login, unavailable in this sandbox,
so the in-app `PromotionTypeCreateDrawer` itself was not opened live. Instead:
1. Started the project's own `npm run dev` (Vite) and confirmed route
   `/product/promotion-management/promotion-type/create` redirects to `/404`
   unauthenticated (`AuthGuard` → `PageURLs.of404()`), confirming full in-app
   verification is blocked by auth, not by this change.
2. Built an isolated browser harness serving the *exact* `transformCode` +
   `handleChange` + cursor-restore logic from this file (same regex, same
   max-length slicing, same `setSelectionRange` call) via the running Vite
   dev server's `public/` directory (temporary file, removed after testing;
   confirmed via `git status` that no stray file remains).
3. In a real Chrome tab against that harness: typed a full code
   (`ABCDEFGH`), moved the cursor to the middle (position 4 via Home+Right×4,
   confirmed via `selectionStart` read), then typed an invalid character
   (`@`, stripped by the filter). First attempt (the `useLayoutEffect`
   version) showed the edge case above — cursor jumped to 8 (end) because no
   re-render occurred. Fixed by moving the restore into `handleChange` itself
   via `requestAnimationFrame`; re-tested the same steps — value stayed
   `ABCDEFGH`, cursor correctly stayed at 4.
4. Tested backspacing in the middle: with cursor at 4, pressed Backspace —
   value became `ABCEFGH`, cursor correctly landed at 3 (not the end).

**Not verified**: the actual `PromotionTypeCreateDrawer` in the running
application (blocked by SSO auth in this environment) — the harness
reproduces the identical transform/restore code but is not the integrated
AntD `Form.Item`-wrapped component. A human should still open the real Create
drawer and repeat the same two scenarios (mid-string invalid-char typing,
mid-string backspace) to confirm no AntD-specific interaction changes this.

**Validation**: `npm run typecheck` clean, `npx eslint` on the changed file —
0 errors/warnings, `npm run build` succeeds (pre-existing unrelated
chunk-size warning only).

## Addendum (2026-10-27) — Required-field asterisk for Mã loại / Tên loại / Cơ chế

Scope: add a required-field `*` marker to the three mandatory fields ("Cơ chế",
"Mã loại", "Tên loại") in both Create and Edit, consistent with the target
screenshot, while leaving the optional fields ("Mô tả", "Độ ưu tiên", "Hiển thị
tối đa") unmarked per BE's VL-05/06/07, and without inventing a new
required-marker convention.

**Precedent search** (per the instruction's request to check an existing
pattern before hardcoding `*` into translated label text):
- Grepped `src/components` for a shared required-marker component/prop (e.g.
  something rendering `*` via CSS from a `required` boolean). None exists —
  AntD's own `Form.Item required` prop (which renders its built-in asterisk
  next to the standard `label` slot) is the only mechanism found, used in
  `BackgroundMainForm/index.tsx:254` (`required` on a `Form.Item` with a
  standard `label`) and `:282` (`required={isCategoryRequired}`).
- For a *local floating-label replica* (not AntD's label slot — the same
  situation as this module's `PromotionTypeCodeField`/`PromotionTypeNameField`),
  the established precedent is `TopicNameField`
  (`src/modules/system/theme-management/topic/components/TopicForm/index.tsx:310`):
  `placeholder={`${label} *`}` — the `*` is appended as a literal outside the
  `t()` call, not mixed into the translated string itself. No shared
  asterisk-rendering component exists for this case; this repo's convention is
  the plain literal suffix.
- For a **required field that is read-only/disabled** (this module's analogue:
  Mã/Cơ chế are permanently non-editable per VL-09), the precedent is
  `TopicCodeField` (same file, `:298-304`): renders a plain label with no `*`
  when the control is `readOnly disabled`. This confirms the instruction's
  fallback — a disabled/read-only required field does not carry the asterisk
  in this repo's convention.

**Changes:**
- `PromotionTypeNameField/index.tsx`: `placeholder={t('...column.name')}` ->
  `` placeholder={`${t('...column.name')} *`} ``, matching `TopicNameField`'s
  exact pattern. This component is the single shared implementation used by
  both `PromotionTypeCreateDrawer` (create) and `PromotionTypeDetailDrawer`'s
  edit-mode `<Form>` (edit) — the asterisk lands in both places from one
  change, with no duplication.
- `PromotionTypeCodeField/index.tsx`: appended `*` as a literal suffix to the
  local floating `<label>` text (same pattern, since this field renders its own
  label rather than AntD's `label` slot). This component is Create-only (the
  Edit drawer renders `code` as permanently read-only markup, see below), so
  only the Create form gained the asterisk here, which matches the screenshot.
- `PromotionTypeCreateDrawer/index.tsx`: added `required` to the `mechanism`
  `Form.Item` (`name='mechanism'`, which already uses AntD's own `label` prop,
  unlike Code/Name) — this triggers AntD's built-in asterisk via the standard
  `label` slot, the same mechanism `BackgroundMainForm` uses, with no new CSS
  or component added.

**Fields explicitly left unmarked, and why:**
- `PromotionTypeDescriptionField`, `PromotionTypePriorityMaxItemsRow` (Độ ưu
  tiên, Hiển thị tối đa) — optional per VL-06/07, out of scope by the
  instruction's own framing.
- `PromotionTypeDetailDrawer`'s always-rendered Code and Mechanism blocks
  (`index.tsx` — the `<div className={styles.label}><LockOutlined />...`
  markup shown in both view and edit mode) — these are a separate,
  permanently-read-only presentation, not the editable `PromotionTypeCodeField`/
  `PromotionTypeMechanismField` components, and per the `TopicCodeField`
  precedent above, a required-but-always-disabled field is not asterisked in
  this repo's convention. Left unchanged.
- `PromotionTypeDetailDrawer`'s view-mode `ReadOnlySection` for `name` — also a
  fully read-only presentation (the `mode === 'view'` branch, shown with the
  read-only banner when `!canEdit`), so it follows the same no-asterisk
  convention as Code/Mechanism above and was left unchanged. Only edit-mode's
  `<PromotionTypeNameField />` (shared with Create) gained the asterisk.

**Validation:** `npm run typecheck` clean; `npx eslint` on all three changed
files: 0 errors/warnings; `npm run build` succeeds (only the pre-existing
unrelated chunk-size warning).

**Not verified:** rendered appearance in a live browser (asterisk placement
relative to the floating label's transform/position, and visual consistency
between the plain-literal suffix on Code/Name and AntD's built-in marker on
Mechanism) was not opened in-app, for the same MSAL SSO sandbox limitation
noted in the prior addendum. A human should open both Create and Edit (edit
mode) and visually confirm all three asterisks render correctly and consistently.

## Addendum (2026-10-27) — Helper/placeholder text for Tên loại, Độ ưu tiên, Hiển thị tối đa

Scope: add helper text below three fields and fix two placeholders, in both
Create and Edit mode (both drawers share these field components, so one
change in each field component lands in both). Mã/Cơ chế untouched, per the
instruction.

**Premise check:** the instruction describes `Độ ưu tiên`'s placeholder "999"
and `Hiển thị tối đa`'s placeholder "Không giới hạn" as "was empty/none
before." Current source already had both: `PromotionTypePriorityMaxItemsRow/
index.tsx` already passed a literal `placeholder='999'` to Priority and
`t('...column.maxItemsUnlimited')` (→ "Không giới hạn") to MaxItems — neither
was empty. The real gap was that Priority's `'999'` was a hardcoded literal,
not routed through i18n like MaxItems' already was. Fixed that gap as part of
this change (see below) rather than silently treating the premise as correct
or leaving it unaddressed.

**i18n keys added** (`PromotionManagement.promotionType.field.*` in both
`vi.json`/`en.json`, parity verified by flattening both — see check below):
- `nameHelper`: "Hiển thị trên ứng dụng làm tiêu đề nhóm ưu đãi" /
  "Shown in the app as the promotion group title"
- `priorityPlaceholder`: "999" / "999" — new key so Priority's placeholder is
  no longer a hardcoded literal, matching MaxItems' existing convention of
  always resolving its placeholder through `t()`.
- `priorityHelper`: "1–999 · để trống = 999 · số nhỏ hiển thị trước" /
  "1–999 · blank = 999 · lower numbers show first"
- `maxItemsHelper`: "1–99 · để trống = Không giới hạn" /
  "1–99 · blank = Unlimited"

**Rendering mechanism — reused existing patterns, no new convention:**
- `PromotionTypePriorityMaxItemsRow/index.tsx` already renders MaxItems'
  suffix caption via `Form.Item`'s `extra` prop with a `styles.caption` span
  (added 2026-10-22, documented in that file's own comment, chosen specifically
  so the caption sits below the bordered control rather than inside it). Reused
  this exact mechanism: Priority's `Form.Item` now also gets an `extra` with
  `priorityHelper`; MaxItems' `extra` now renders two stacked `.caption` spans
  (the existing suffix line, then the new `maxItemsHelper` line — `.caption`
  is `display: block`, so they stack without a wrapper). Added
  `margin-top: 0.4rem` to `.caption` in that file's `styles.module.scss` so the
  gap between the control and its first caption line matches
  `PromotionTypeCodeField`'s `.helper` spacing exactly.
- `PromotionTypeNameField` had no helper slot — the instruction explicitly
  allows adding one, "consistent with however Mã's existing helper text ...
  is rendered." Mã's helper is a local `<div className={styles.helper}>` below
  its custom floating-label markup. `PromotionTypeNameField` wraps the shared
  `@/components/input`, not a local replica, so the equivalent AntD-native slot
  for "a caption below this field, outside the control" is `Form.Item`'s
  `extra` — the same mechanism `PromotionTypePriorityMaxItemsRow` already uses
  for the same purpose. Added a new colocated
  `PromotionTypeNameField/styles.module.scss` with a `.helper` class copying
  `PromotionTypeCodeField`'s exact declarations (`margin-top: 0.4rem;
  font-size: 1.2rem; color: rgba(0, 0, 0, 0.45);`) for visual parity, and wired
  it via `extra={<span className={styles.helper}>{t('...nameHelper')}</span>}`.

**Validation:**
- Flattened `vi.json`/`en.json` under `PromotionManagement.promotionType.field`
  and compared key sets: identical (10 keys each, matching 1:1).
- Grepped `src/` for both `PromotionTypeNameField` and
  `PromotionTypePriorityMaxItemsRow`: both are imported and rendered by both
  `PromotionTypeCreateDrawer` (create) and `PromotionTypeDetailDrawer`'s
  edit-mode `<Form>` (edit) — confirmed the three helper/placeholder changes
  reach both forms from the three component-level edits, with no duplication.
- `npm run typecheck`: clean. `npx eslint` on the two changed `.tsx` files: 0
  errors/warnings. `npm run build`: succeeds (only the pre-existing unrelated
  chunk-size warning).

**Not verified:** rendered appearance (caption stacking/spacing on MaxItems,
floating-label interaction with the new `extra` block on Name, and the
Vietnamese/English text at actual render width) was not opened in a live
browser, for the same MSAL SSO sandbox limitation as prior addenda. A human
should open Create and Edit (edit mode) with `app_locale=vi` and
`app_locale=en` and visually confirm all three helper lines and the two fixed
placeholders.

## Addendum (2026-10-27) — "Cơ chế" label alignment fix

**Root cause:** `src/custom-ant.scss:171-176` has a repo-wide rule —
```scss
.ant-form-item-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
```
— that center-aligns every AntD-native `Form.Item` label application-wide.
Every other field in this form (Mã, Tên loại, Mô tả, Độ ưu tiên, Hiển thị tối
đa) is a local floating-label replica that never renders through AntD's
`label` slot/`.ant-form-item-label`, so this global rule never touched them.
`mechanism`'s `Form.Item` is the only field in this form using AntD's own
`label` prop (added in the 2026-10-27 required-asterisk addendum, to get
AntD's built-in `required` asterisk), so it was the only one visibly picking
up the global center rule.

**Fix — scoped override, not a global-rule change:** per `.claude/rules/
10-styling.md` ("Minimize deep `.ant-*` overrides... Scope unavoidable
library overrides narrowly using `:global(...)` only for the minimum required
selector"), did not touch the global rule (used elsewhere in the app; changing
it is out of scope and high blast radius). Instead:
- Added `className={styles.mechanismField}` to the `mechanism` `Form.Item` in
  `PromotionTypeCreateDrawer/index.tsx`.
- In that file's `styles.module.scss`, added
  `.mechanismField { :global(.ant-form-item-label) { align-items: flex-start; justify-content: flex-start; } }`
  — nested under the component's own local class, affecting only this one
  `Form.Item` instance, leaving every other consumer of
  `.ant-form-item-label` repo-wide unchanged.

**Validation:** `npm run typecheck` clean; `npx eslint` on the changed file: 0
errors/warnings; `npm run build` succeeds (only the pre-existing unrelated
chunk-size warning).

**Not verified:** rendered alignment in a live browser was not opened for the
same MSAL SSO sandbox limitation as prior addenda. A human should open Create
and visually confirm "Cơ chế" now left-aligns flush with Mã/Tên loại/etc., and
that no other AntD-native `Form.Item` label elsewhere in the app was affected
(the override is scoped to this file's own module class, so it should not be).

## Addendum (2026-10-27) — Default list sort order vs. RL1 (priority ASC, tie-break createdDate ASC, then code ASC)

**Finding — real bug, not just an unconfirmed tie-break:**
`PromotionTypeTableSection/index.tsx:19` had
`const DEFAULT_ORDER_BY = 'createdDate,desc';` — the list's default/initial
`sort` param was `createdDate,desc` (newest-created first), not `priority,asc`
at all. This is wrong independent of any tie-break question: wrong field,
wrong direction. Fixed to `'priority,asc'`.

**How the `sort` param is built (item 1):** `promotion-management/services/
promotion-type.service.ts`'s `getPromotionTypes` sends the query param as a
single literal string — `['sort', params.orderBy]` via `appendQueryParams`,
with `params.orderBy` passed straight through unmodified (no parsing,
splitting, or multi-field assembly on the FE side). So whatever single string
`orderBy`/`DEFAULT_ORDER_BY` holds is exactly what reaches the BE as `sort=`.
There is no FE-side multi-field sort-string construction anywhere in this
service or `PromotionTypeListQueryParameters` — confirmed by reading the full
service file and the type definition. The FE sends one field+direction pair;
it does not and structurally cannot send `priority,asc;createdDate,asc;code,asc`
or similar without a service change.

**Item 2 — BE tie-break confirmation:** the instruction states RL1 as a known
backend contract ("relying on BE's own RL1 tie-break... per the BE doc"). This
repository has no committed BE spec/swagger/doc for `offer-types` sort
semantics (grepped `docs/`, `.github/`, and the whole tree for "RL1"/"RL-1":
no matches) — the service's only documentation of the sort contract is the
inline comment at `promotion-type.service.ts` noting the wire key is `sort`,
not `orderBy`. I cannot independently verify from this codebase that sending
`sort=priority,asc` alone causes the BE to apply a createdDate-asc-then-code-asc
tie-break automatically; that is a backend behavior claim outside what static
FE inspection can confirm. Per the instruction's own framing, the FE's job is
only to send `priority,asc` for the default/priority case and let the BE's
documented tie-break apply — which is now what it does. If the BE does *not*
actually apply that tie-break automatically, that is `NEEDS-TEAM-DECISION`/a
BE-side check, not something the FE can detect or correct by altering the
`sort` string (there is no documented multi-field `sort` syntax to fall back
to; inventing one without a confirmed BE contract would be a speculative
change, which the instruction explicitly asked not to make).

**Item 2 — return-to-priority-order behavior:** `handleTableChange` already
calls `setSort(undefined)` whenever the table's sorter reports no active
order (AntD's third click on a sorted column, or a column other than
`name`/`mechanism`), and the query recomputes `orderBy` as
`sort ? ... : DEFAULT_ORDER_BY` — so clearing the Tên loại/Cơ chế sort, or the
initial unsorted load, now both resolve to the corrected `priority,asc`. No
further FE change was needed for this path once `DEFAULT_ORDER_BY` itself was
fixed. Sorting explicitly by `name`/`mechanism` is unaffected (RL1's tie-break
is specific to the priority ordering case, not those columns, matching the
instruction's framing that tie-break is "undefined/not-a-concern" there).

**Validation:** `npm run typecheck` clean; `npx eslint` on the changed file: 0
errors/warnings; `npm run build` succeeds (only the pre-existing unrelated
chunk-size warning).

**Not verified:** the actual BE response ordering for `sort=priority,asc`
(whether it truly applies the documented createdDate/code tie-break) was not
confirmed against a live backend or BE source — flagged above as outside what
this FE-only sandbox can check; recommend a human confirm against the real
`GET /portal/v1/offer-types?sort=priority,asc` response or the BE's RL1
implementation directly.

## Addendum (2026-10-28) — Label layout standardized to "label above input"; supersedes the floating-label adoption decision

**This supersedes the floating-label visual design adopted in earlier sprints
of this module.** Mã, Tên loại, Mô tả, Độ ưu tiên, and Hiển thị tối đa each had
their own local floating-label replica (a `<label>` absolutely positioned over
the control's border, animated between a centered idle position and a raised
"notched" position on focus/value — see the superseded
`PromotionTypeCodeField`, `PromotionTypeDescriptionField`, and
`PromotionTypePriorityMaxItemsRow` `styles.module.scss` history). Per explicit
instruction, every field in Create and Edit's editable form now uses the same
plain "label line above the control" layout "Cơ chế" already used (AntD's own
native `Form.Item` `label` slot), and the floating-label CSS/transform logic
for the converted fields was removed rather than left as dead code:

- `PromotionTypeCodeField`: dropped the `isFocused`/`isFloating` state and the
  absolutely-positioned `<label>`/wrapper divs. The `Form.Item` now carries
  `label` + `required` directly; the uppercase+`[A-Z0-9_]`-strip transform and
  the cursor-restore `requestAnimationFrame` workaround (both unrelated to the
  label, VL-02) are unchanged. `styles.module.scss` now holds only the
  `.helper` caption class.
- `PromotionTypeNameField`: dropped the shared `@/components/input.tsx`
  wrapper (it was only in use here for its internal floating-placeholder
  behavior, which is no longer needed) in favor of plain AntD `Input` with its
  own native `showCount`/`maxLength`, under a native `Form.Item` `label`.
- `PromotionTypeDescriptionField`: deleted the local `FloatingTextArea`
  wrapper and its `styles.module.scss` entirely (no styling is needed once the
  label moves to `Form.Item`); it now renders plain AntD `Input.TextArea`
  directly.
- `PromotionTypePriorityMaxItemsRow`: deleted the local `FloatingInputNumber`
  wrapper (including its focus-only-placeholder trick, which existed only to
  fake a floating label) in favor of plain AntD `InputNumber` with the
  placeholder always shown, under native `Form.Item` `label`s. The `.caption`
  helper-text class and its 2026-10-22 height-matching rationale are
  unchanged.
- Helper/hint copy (VL-02's "Chỉ chữ in hoa...", VL-01's "Hiển thị trên ứng
  dụng...", the priority "1–999..." and maxItems "1–99..." captions) is
  unchanged text, still rendered via each `Form.Item`'s `extra`.

**Asterisk placement (item 2):** AntD's default `requiredMark` prepends `*`
before the label, which is why "Cơ chế" rendered as "* Cơ chế" even though
every other (floating-label) field in this form showed its own hand-rendered
`*` suffixed. Rather than fix only "Cơ chế", both forms' `<Form>` now pass a
custom `requiredMark` render function —
`(labelNode, { required }) => <>{labelNode}{required && ' *'}</>` — so every
required field (Mã, Tên loại, Cơ chế) renders its native label with the `*`
suffixed, matching the non-required fields' plain label with no marker.
Applied to `PromotionTypeCreateDrawer`'s `<Form>` and
`PromotionTypeDetailDrawer`'s edit-mode `<Form>`; `PromotionTypeDetailDrawer`'s
view-mode read-only fields have no required marker at all (out of scope, see
below).

**Label-alignment override widened from one field to the whole form:**
`src/custom-ant.scss`'s global `.ant-form-item-label` rule centers every
AntD-native `Form.Item` label; a prior addendum scoped a left-align override
to the single `mechanism` `Form.Item` (`.mechanismField` in
`PromotionTypeCreateDrawer/styles.module.scss`) because it used to be the only
field in the form on AntD's native label slot. Now every field uses that slot,
so the override moved from that one `Form.Item`'s class to a `.form` class on
the `<Form>` element itself (same `:global(.ant-form-item-label) { align-
items: flex-start; justify-content: flex-start; }` rule, just covering the
whole form). Added the equivalent `.form` class to
`PromotionTypeDetailDrawer/styles.module.scss` for its edit-mode `Form`, which
did not need this override before (it had no AntD-native-label fields until
this change). Both overrides stay scoped to their own component's local class;
the global rule itself is untouched and out of scope.

**Item 4 — View-mode consistency check (reported, not changed per
instruction):** `PromotionTypeDetailDrawer`'s view-mode `ReadOnlySection`
already renders a plain label line above the value (`styles.field`/`.label`/
`.value` — never used the floating-label pattern), so it already matches this
addendum's target layout. No visual inconsistency was found between view mode
and the now-converted Create/Edit forms; no view-mode change was made.

**Validation:** `npm run typecheck` clean. `npx eslint` on every changed file:
0 errors/warnings across all files. `npm run build` succeeds (only the
pre-existing unrelated chunk-size warning). `npx prettier --check` on all
changed files passed after one auto-format of
`PromotionTypeDescriptionField/index.tsx`'s one-line function signature.

**Not verified:** this task did not open the app in a browser (same sandbox
limitation as prior addenda — no live MSAL SSO session available here). A
human should open both Create and Edit (and the View→Edit transition) with
`app_locale=vi` and `app_locale=en` and confirm: every field's label renders
above its control with no floating/notched border overlap; Mã/Tên loại/Cơ chế
show `*` suffixed (not prefixed); Mô tả/Độ ưu tiên/Hiển thị tối đa show no
marker; helper captions render unchanged; and no other AntD-native
`Form.Item` elsewhere in the app was affected by either `.form` override
(both are scoped to their own component's local class, so they should not
be).

## Addendum (2026-10-28) — Hiển thị tối đa unit caption moved into a label tooltip icon

**Change:** the standalone "ưu đãi / loại ưu đãi" / "promotions / type" unit
caption that sat below MaxItems' input (added in the earlier floating-label
era, see this file's 2026-10-22 history) is gone. Per explicit instruction,
that text now shows as a hover/focus tooltip on a small info icon placed next
to the "Hiển thị tối đa" label text, instead of a permanently visible caption
line. The "1–99 · để trống = Không giới hạn" helper line below the input
(`maxItemsHelper`) is unchanged — only the unit text moved.

**Reused an existing pattern rather than inventing one:** grepped the repo
for `InfoCircleOutlined`/`QuestionCircleOutlined` + `Tooltip` field-hint usage
first. `src/modules/system/theme-management/background-main/components/
BackgroundMainAssetPicker/index.tsx` already has exactly this
label+hint-icon+tooltip composition (`.labelRow` wrapping the label text and
an `InfoCircleOutlined` inside a `Tooltip`, with `trigger={['hover','focus']}`,
`tabIndex={0}` and `aria-label` on the icon for keyboard/screen-reader access).
`PromotionTypePriorityMaxItemsRow`'s `maxItems` `Form.Item` now composes its
`label` the same way — `<span className={styles.labelRow}><span>{t(column.maxItems)}</span><Tooltip trigger={['hover','focus']} title={t(field.maxItemsSuffix)}><InfoCircleOutlined className={styles.hintIcon} tabIndex={0} aria-label={t(field.maxItemsSuffixHintLabel)} /></Tooltip></span>`
— and `styles.module.scss` gained `.labelRow`/`.hintIcon`, copied from
`BackgroundMainAssetPicker`'s values (`display:flex; align-items:center;
gap:0.4rem` / icon colored via `--gray-color`, `font-size: 1.4rem`,
`cursor: pointer`). `priority`'s `Form.Item` is unaffected — it never had a
unit caption, only its own `priorityHelper` line below the input.

**New i18n key:** `PromotionManagement.promotionType.field.maxItemsSuffixHintLabel`
added to both `vi.json` ("Xem đơn vị hiển thị tối đa") and `en.json` ("View
max items unit") for the icon's `aria-label`, following the same pattern as
`ThemeManagement.backgroundMain.assetHintLabel` (a short standalone
accessible-name string, distinct from the hint content itself, which stays
`maxItemsSuffix`). This is a new key for an existing module (`SAFE` per
`.claude/rules/11-i18n.md`), not a rename — `maxItemsSuffix` itself keeps its
existing key and value, only its rendering location moved from a caption
`<span>` to a `Tooltip`'s `title`.

**Validation:** flattened both lang files and confirmed the
`PromotionManagement.promotionType.*` key set is identical between `vi.json`
and `en.json`, including the new key. `npm run typecheck` clean. `npx eslint`
on the changed file: 0 errors/warnings. `npm run build` succeeds (only the
pre-existing unrelated chunk-size warning). `npx prettier --check` passed on
all changed files with no reformatting needed.

**Not verified:** rendered tooltip behavior (hover delay, focus-visible
outline, mobile/touch tap behavior, and RTL/wrapping at narrow Drawer widths)
was not opened in a live browser for the same MSAL SSO sandbox limitation as
every other addendum in this report. A human should hover and tab to the new
icon in both Create and Edit, in `app_locale=vi` and `app_locale=en`, and
confirm the tooltip shows the correct unit text and the icon does not crowd
or wrap awkwardly against the "Hiển thị tối đa" label at the Drawer's 560px
width.

## Addendum (2026-10-28) — Edit mode's "Lưu" button disabled while the form is pristine

**Finding:** `PromotionTypeDetailDrawer`'s edit-mode footer "Lưu" `Button` had
no `disabled` prop, so it was always clickable even with no changes made —
even though `usePromotionTypeDetailDrawer` already tracks this exact state:
`isDirty` (set by `handleValuesChange`, already consumed internally by
`requestClose` and `requestCancelEdit` for their discard-confirmation popups)
was computed and returned by the hook but never destructured or read by the
component. No new dirty-tracking mechanism was added — this was wiring an
already-existing, already-correct piece of state to one more consumer.

**Change:** `PromotionTypeDetailDrawer/index.tsx` now destructures `isDirty`
from the hook's return value and passes `disabled={!isDirty}` to the "Lưu"
`Button`. Nothing in `usePromotionTypeDetailDrawer.hook.tsx` changed.

**Discard-confirm flows verified unaffected:** `requestClose` (line ~107,
`if (mode === 'edit' && isDirty)`) and `requestCancelEdit` (line ~125,
`if (isDirty)`) both read `isDirty` directly from the hook's own closure
state, not from anything passed through the component — so returning/using
`isDirty` one additional time in the component (for the button) does not
change what those two functions see or do. Confirmed by re-reading both
functions after the change: identical logic, identical dependency on the
same `isDirty` state variable.

**Interaction with the Edit→View transition:** `revertToView()` (called by
`requestCancelEdit` when not dirty, or after a confirmed discard) calls
`form.resetFields()` and `setIsDirty(false)`, and a successful save
(`handleFinish`) also calls `setIsDirty(false)` after rebaselining — both
paths already correctly leave the form pristine, so "Lưu" disables itself
again immediately after either a cancel or a successful save, with no
additional change needed for that.

**Validation:** `npm run typecheck` clean. `npx eslint` on both changed files
(`index.tsx`, the unmodified `usePromotionTypeDetailDrawer.hook.tsx`): 0
errors/warnings. `npm run build` succeeds (only the pre-existing unrelated
chunk-size warning). `npx prettier --write` reformatted the one edited line
in `index.tsx` (the `Button`'s prop list) back onto a single line; no other
formatting changes.

**Not verified:** this task did not open the app in a browser (same sandbox
limitation as every other addendum in this report). A human should open
Edit mode, confirm "Lưu" starts disabled, becomes enabled on the first
real field change, re-disables after `form.resetFields()`/cancel without
changes, and re-disables again immediately after a successful save; also
confirm the discard-confirmation popup still appears when closing/cancelling
a dirty Edit form, unchanged from before this fix.

## Addendum (2026-10-28) — Mã field: IME composition conflict in the uppercase-filter + cursor-restore handler

**Root cause, confirmed:** `PromotionTypeCodeField.tsx`'s `handleChange` ran
`transformCode` (uppercase + strip to `[A-Z0-9_]`) and `inputRef.current
.setSelectionRange(...)` on every native `input` event, unconditionally —
including while an IME composition is in progress (e.g. Telex building a
Vietnamese diacritic over several keystrokes, where the DOM's intermediate
value during composition is not the final committed character and the
browser owns composition/caret state until `compositionend`). Forcing a
value rewrite and `setSelectionRange` mid-composition fights the browser's
composition session, which is what broke/corrupted typing when Telex was
enabled.

**Existing precedent, reused:** grepped for `isComposing`/`onCompositionStart`/
`onCompositionEnd` before writing anything. Found one existing precedent —
`src/modules/products/promotion-management/promotion/hooks/
useDebouncedOfferSearch.hook.ts`'s `isComposingRef` (set by
`onCompositionStart`, cleared and the committed value applied in
`onCompositionEnd`). `PromotionTypeCodeControl` now follows the same shape:
an `isComposingRef` ref, `handleChange` bails out when
`isComposingRef.current || (event.nativeEvent as InputEvent).isComposing` is
true (the ref covers the composition window itself; the `nativeEvent` flag
covers a trailing `input` some browsers fire with the flag still set), and
the transform+cursor-restore logic was extracted into a shared
`applyTransform(rawValue, selectionStart)` called from both `handleChange`
(non-composing edits) and the new `onCompositionEnd` handler (using
`event.currentTarget.value`/`selectionStart`, since the composed text lands
in the DOM exactly at `compositionend` and a further native `input` is not
guaranteed). No new library, dependency, or generic IME abstraction was
added — this is the same ref-guard pattern already in the codebase, applied
to one more field.

**What was actually tested (this sandbox has no live MSAL SSO session and
cannot drive a real OS IME, so the app itself was not opened — flagged
explicitly, not glossed over):** built an isolated browser harness
reproducing `PromotionTypeCodeControl`'s exact logic verbatim (same
`transformCode`, same `applyTransform`, same `handleChange`/
`onCompositionStart`/`onCompositionEnd`) against a plain `<input>` on
`https://example.com` via Claude in Chrome's `javascript_tool`, then drove it
with scripted DOM events (`CompositionEvent`/`InputEvent` with
`isComposing`/`data`) to simulate the exact event sequence a browser fires
during IME composition and plain typing. Three scenarios, with full event
logs captured:
1. **Telex-style composition** (`compositionstart` → `input` with
   `isComposing:true, data:"a"` → `input` with `isComposing:true,
   data:"á"` → `compositionend` with `data:"á"`): both intermediate `input`
   events were correctly skipped (logged `"handleChange SKIPPED
   (composing)"`), confirming the transform/cursor-restore never runs mid-
   composition. `compositionend` then ran `applyTransform` exactly once on
   the committed `"á"`, which `transformCode` correctly stripped to `""`
   (uppercase does not touch combining diacritics, and `[^A-Z0-9_]` strips
   them) — matching the requested behavior that a non-conforming composed
   character is filtered only after composition commits, not mid-composition.
2. **Plain (non-IME) mid-string edit, char kept:** `"ABCxDEF"` with cursor at
   index 4 → transformed to `"ABCXDEF"` with the cursor correctly restored to
   index 4 (right after the uppercased character) — the original cursor-jump
   fix still holds.
3. **Plain (non-IME) mid-string edit, char stripped:** `"ABC!DEF"` with
   cursor at index 4 → transformed to `"ABCDEF"` with the cursor correctly
   restored to index 3 — the specific case the original fix's comment calls
   out (transform reverts the string, React may bail re-render, yet the
   native cursor still needs explicit restoring) is still correct.
   A fourth run also composed a second cycle back-to-back
   (`compositionstart` → `input(isComposing:true)` → `compositionend`) right
   after scenario 1 and confirmed `isComposingRef.current` correctly resets
   to `false` afterward, with no stuck guard state carried into the next
   edit.

**Validation:** `npm run typecheck` clean. `npx eslint` on the changed file:
0 errors/warnings. `npm run build` succeeds (only the pre-existing unrelated
chunk-size warning). `npx prettier --check` passed with no reformatting
needed.

**Not verified:** a real OS-level IME (Telex or any other) driving the
actual `PromotionTypeCreateDrawer` inside the running app was not exercised
— this sandbox has no live MSAL SSO session (consistent with every other
addendum in this report) and browser automation cannot synthesize genuine
trusted IME input, only scripted composition/input events against an
isolated harness running the identical logic. A human should open Create
with Telex (or another composing IME, e.g. Unikey) enabled, type a
diacritic sequence into Mã, and confirm composition completes smoothly with
no dropped/duplicated/frozen characters, and that the final committed text
is correctly uppercase-filtered once composition ends.

## Addendum (2026-10-28) — Mã field: removed cursor-restore/IME-composition logic entirely after two regressions in a row

**This reverses both of the prior two addenda's `PromotionTypeCodeControl`
changes**, per explicit instruction, because they regressed in sequence:
the original cursor-jump fix (`setSelectionRange` + `requestAnimationFrame`
on every `onChange`) broke IME composition (reported live with Telex); the
follow-up composition-aware fix (`isComposingRef` +
`onCompositionStart`/`onCompositionEnd`, verified in the previous addendum
against a synthetic harness) still, in live use, fought the browser
mid-composition and blocked typing outright. Rather than attempt a third
variant of the same approach without a live IME to test against, all of it
was removed:

- Deleted: `inputRef` and its `setSelectionRange` call, the
  `requestAnimationFrame` scheduling, `isComposingRef`, and the
  `onCompositionStart`/`onCompositionEnd` handlers.
- Kept, unchanged: the `transformCode` uppercase + `[^A-Z0-9_]` strip +
  `PROMOTION_TYPE_CODE_MAX` slice logic, now applied directly in a plain
  `onChange` with no composition-awareness at all — the browser's native
  IME composition is left completely undisturbed; a composed Vietnamese
  diacritic simply is not in `[A-Z0-9_]`, so it is stripped the same way any
  other invalid character already was, once the final committed value flows
  through `onChange`.
- `onBlur`, the `Form.Item`'s `validateTrigger={['onBlur']}`, and the Zod
  `rules` validator are byte-for-byte unchanged — this change is scoped to
  the keystroke-transform handler only, as instructed.

**Accepted tradeoff, stated explicitly (also recorded as a code comment on
`PromotionTypeCodeControl` itself, so a future pass does not quietly
reintroduce the same regression):** with no cursor restoration, a mid-string
edit that strips a character or otherwise changes the string's length may
snap the input's caret to the end of the field, rather than staying at the
edit point. This is accepted in favor of typing — including IME composition
— actually working end-to-end. Per the instruction, this should not be
half-fixed again without live IME testing available; the comment says so
directly at the point future code would be tempted to add it back.

**What was tested, methodology stated plainly again:** this sandbox has no
live MSAL SSO session and cannot drive a real OS IME, so (as in the prior
addendum) a browser harness reproducing the current, simplified
`PromotionTypeCodeControl.handleChange` verbatim was exercised via Claude in
Chrome's `javascript_tool` against a plain `<input>` on
`https://example.com`, with scripted `CompositionEvent`/`InputEvent`
sequences:
1. **Telex-style composition** (`compositionstart` → `input(isComposing:
   true, data:"a")` → `input(isComposing:true, data:"á")` →
   `compositionend(data:"á")` → a trailing committed `input`): the handler
   ran on every event with no special-casing, as designed — it did not
   throw, did not loop, and did not block any subsequent event. Logged
   `onChange` outputs were `"A"` (from the raw `"a"` mid-composition),
   then `""` twice (the raw `"á"` has no character in `[A-Z0-9_]` once
   composition reaches that state, so it is stripped both mid-composition
   and on the final commit) — ending at `""`. This confirms the handler is
   inert to composition state by design (does not special-case it, does not
   interfere with the browser's own composition session via
   `setSelectionRange`) and that a composed diacritic is filtered out
   through the same ordinary strip logic, matching the requested behavior.
2. **Plain typing** (`"a"`→`"ab"`→`"abc"`, one `input` event per keystroke):
   produced `"A"`→`"AB"`→`"ABC"` — correct, uppercased end-to-end.
3. **Backspace** (`"ab"` after removing a trailing char,
   `inputType: 'deleteContentBackward'`): produced `"AB"` — correct, the
   plain transform does not care about `inputType`.
4. **Paste** (`inputType: 'insertFromPaste'` with value
   `"promo-code_123!!!!!!!!!!!!!!!!"`): produced `"PROMOCODE_123"` — hyphen
   and all trailing `!` stripped, uppercased, and the result is under
   `PROMOTION_TYPE_CODE_MAX` (20) once the invalid characters are removed,
   confirming the strip-then-slice order still behaves correctly for a
   large pasted string with a mix of valid and invalid characters.

**Validation:** `npm run typecheck` clean. `npx eslint` on the changed file:
0 errors/warnings. `npm run build` succeeds (only the pre-existing unrelated
chunk-size warning). `npx prettier --write` reformatted the simplified
`handleChange`/`return` onto their post-simplification layout; no other
formatting changes.

**Not verified:** exactly as before — a real OS-level IME (Telex or
otherwise) driving the actual `PromotionTypeCreateDrawer` inside the running
app was not exercised, for the same no-live-SSO-session, no-real-IME-in-
browser-automation reasons stated in the prior addendum. Given this is the
third attempt at this specific handler, a human confirming Telex typing
works end-to-end in the real Create form — including the accepted
cursor-jump tradeoff on a mid-string stripped-character edit being tolerable
in practice — is especially important before this ships.
