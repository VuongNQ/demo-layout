# Sprint 2 — UC #2091 Promotion Type detail (F-03 view + F-04 edit) + status toggle

Branch `feature/vuongnq/loai-uu-dai_2091`. Built against the Sprint 1 mock
data layer (`USE_MOCK_PROMOTION_TYPE_DATA = true` in
`services/promotion-type.service.ts`); no real BE contract exists yet.

## What was built

1. **Types** (`types/promotion-type.types.ts`): added
   `UpdatePromotionTypeRequest` (`{ name, description, maxItems, priority }`,
   `priority` nullable per swagger's PUT body only) and
   `UpdatePromotionTypeStatusRequest` (`{ status }`), matching the PUT/PATCH
   shapes given directly (no repo search needed for these — same external
   swagger source as Sprint 1's GET DTO).

2. **Service** (`services/promotion-type.service.ts`): the seed array from
   `mock-data.ts` is now copied into a service-local mutable
   `let mockPromotionTypes` (imported under the alias
   `initialMockPromotionTypes`, then reassigned by the new mock branches).
   **Correction from the original instruction:** making `mock-data.ts`'s own
   export a `let` and reassigning it from `service.ts` does not type-check —
   ES module bindings imported with `import { x } from 'mod'` are read-only
   in the importing file even when the source module declares `export let x`.
   `mock-data.ts` keeps `export const mockPromotionTypes`; the mutable `let`
   lives in `service.ts` as originally intended, just declared there instead
   of in the data file. Added `updatePromotionType(id, request)` and
   `togglePromotionTypeStatus(id, request)`, each with a mock branch
   (find-and-replace the record in the local array, stamping
   `updatedBy`/`updatedDate`) and the real `ApiFetcher` PUT/PATCH branch,
   unreachable while the flag is `true`, same pattern as Sprint 1's list/
   detail branches. `updatedBy` in the mock branches uses a placeholder
   constant `MOCK_ACTOR` — the service layer cannot read the signed-in user
   (no Redux/auth dependency allowed here); the real PUT/PATCH response is
   written by BE from the JWT.

3. **Mutation hooks** (new `hooks/promotion-type.queries.hook.ts`):
   `useUpdatePromotionTypeMutation` and
   `useTogglePromotionTypeStatusMutation`, mirroring
   `theme/hooks/theme.queries.hook.ts` — on success, `setQueryData` on
   `detail(id)` with the authoritative response, then `invalidateQueries` on
   `lists()`. No toast inside the hooks; the Drawer/StatusToggle own
   success/error notification.

4. **Validation** (new `utils/promotion-type.validation.ts`):
   `promotionTypeUpdateFormSchema` (Zod), a request mapper that maps an empty
   `priority` to `PROMOTION_TYPE_PRIORITY_FALLBACK` (999) before the request
   is sent, and `mapPromotionTypeZodIssuesToAntdErrors`, which converts Zod
   issues into the same `{field, message}` shape the backend error envelope
   uses and reuses the shared `mapApiErrorDetailsToFieldErrors` helper (from
   `@/utils/api-error-envelope.helper`) — the "existing adapter" referenced in
   the request is this shared mapping utility, not a new bespoke one.
   **NEEDS-TEAM-DECISION:** the literal VL-01..09 validation rule text (also
   from the chat-shared swagger) was not pasted into this change, so
   `name`/`description` max-length limits (100/500 chars) are reasonable
   defaults, not sourced values — confirm with BA/BE before relying on them.
   `maxItems`/`priority` nullability and the priority-empty-maps-to-999 rule
   reuse what Sprint 1 already established, so those are not guesses.

5. **Error adapter** (`utils/promotion-type-api.error.ts`): added
   `PROMOTION_TYPE_UPDATE_FORM_FIELDS` (exported — consumed by
   `promotion-type.validation.ts`, a different file in the same module, so
   the export is warranted under the updated `.claude/rules/02-typescript.md`
   rule) and `mapPromotionTypeUpdateApiErrorToFields`, which maps the PUT
   error envelope onto `name`/`description`/`maxItems`/`priority` (the
   original `mapPromotionTypeApiErrorToFields` stays scoped to
   `code`/`name`/`description`/`status` for any future create form and is
   unchanged).

6. **`components/PromotionTypeDetailDrawer`** (new): single component,
   `mode` derived from `useHasPermission([PERMISSIONS.PROMOTION_MANAGEMENT_EDIT])`.
   - View mode: read-only banner, read-only `code`/mechanism (lock icon,
     reusing Sprint 1's hardcoded mechanism tag), name/description/priority/
     maxItems (`maxItems: null` → "Không giới hạn"), status via
     `StatusBadge`, "Ưu đãi thuộc loại" with a disabled "Xem trong Danh sách
     ưu đãi" button (UC #2498 doesn't exist yet — intentionally non-
     functional), "Thông tin hệ thống" (`createdBy`/`createdDate`/
     `updatedBy`/`updatedDate`, via `formatDateTime`). Footer: Đóng only.
   - Edit mode: header `extra` slot holds `PromotionTypeStatusToggle`;
     code/mechanism still read-only with the lock icon; name (`Input`),
     description (`Input.TextArea`), priority/maxItems
     (`InputNumber`, nullable/clearable) are editable via AntD `Form`.
     Footer: Hủy/Lưu.
   - Discard guard: `requestClose` (used by both the Drawer's built-in close
     — `✕`, mask click, Esc — and the Hủy button) checks a dirty snapshot
     against the load-time baseline and opens `useModal().openModal` with
     `ModalContent`, following `TopicForm`'s exact pattern, when dirty.
   - The "nhóm hiển thị thứ {k}" footnote (BA question #13) is intentionally
     omitted, per instruction.
   - Loading: `Skeleton active` while the detail query is pending; an
     `Alert` on error with no cached data.

7. **`components/PromotionTypeStatusToggle`** (new): wraps the shared
   `Switch` (`@/components/switch`), calling
   `useTogglePromotionTypeStatusMutation` directly. Before toggling off, if
   `itemCount >= 1` it opens AntD's imperative `Modal.confirm` (via
   `App.useApp().modal`, not the `useModal()`/`ModalContent` pair — the
   request named these as two different mechanisms, and this matches: the
   discard guard uses the custom modal provider, the toggle-off confirm uses
   AntD's own `Modal.confirm`) with the text given verbatim (interpolating
   `{{name}}`/`{{itemCount}}`). `itemCount === 0` or switching to ACTIVE
   calls the mutation directly. `itemCount` comes from the prop passed down
   from the currently-loaded detail query data, not a separate/stale read.

8. **Route wiring** (`views/PromotionTypeListPage/index.tsx`): reads `:id`
   via `useParams()` (present only on the `/view/:id` route; `undefined` on
   the list/create routes, which render the same page component), parses it
   the same way `ThemeEditPage` parses its route id, and renders
   `PromotionTypeDetailDrawer` when valid. Closing (`onClose`) navigates back
   to `PageURLs.ofPromotionTypeList()`. **Addition beyond the literal
   request:** the route was already scaffolded but nothing could reach it —
   `PromotionTypeTableSection` now takes an `onRowClick` prop and the list
   page passes `(row) => navigate(PageURLs.ofPromotionTypeView(row.id))`,
   wiring a clickable row (`cursor: pointer` via a new `.clickableRow` class)
   so the Drawer is actually reachable from the list. This was not one of
   the numbered steps but is the minimum wiring needed for the route to do
   anything; flagging it explicitly rather than silently adding it.

9. **i18n** (`vi.json`/`en.json`): added `field.description`,
   `drawer.*` (titles, banner, section labels, system-info labels),
   `action.close/cancel/save` (view had no edit actions previously),
   `confirm.*` (discard-guard + toggle-off-confirm text, with
   `{{name}}`/`{{itemCount}}` interpolation preserved in both languages),
   `message.updateSuccess`, `error.loadDetail/updateFailed/
   toggleStatusFailed`, `validation.*`. Reused the existing `column.*` and
   `status.*` keys in the Drawer instead of duplicating them (same label,
   same concept, per `.claude/rules/11-i18n.md`'s "do not merge/duplicate"
   guidance applied the other way — this is genuine reuse, not a coincidence).
   **Not sourced from BA copy:** `message.updateSuccess`'s exact text
   ("PORTAL_CV_OFFER_149") was referenced by code only, not pasted into this
   chat; the Vietnamese string used ("Cập nhật Loại ưu đãi thành công.") is a
   reasonable default — confirm the exact approved copy before this ships.
   The toggle-off confirm text ("PORTAL_CV_OFFER_142") *was* given verbatim
   and is used as-is.

## Correction (2026-10-21, post-review)

Two defaults flagged in the original Sprint 2 "What was built"/"i18n" sections
were wrong — both are documented UC #2091 facts shared in chat, not previously
restated at Sprint 2 implementation time:

1. **Validation limits**: `name` max length is 50 (not 100), `description` max
   length is 255 (not 500) — these are promotion-TYPE (UC #2091) limits, not
   the offer (UC #2498) module's 100/500, a different module entirely. Added
   `PROMOTION_TYPE_NAME_MAX = 50` and `PROMOTION_TYPE_DESCRIPTION_MAX = 255` to
   `constant.ts`; `promotion-type.validation.ts`'s Zod schema now imports both
   instead of hardcoding the numbers, and the Drawer's `Input`/`Input.TextArea`
   `maxLength` props were updated to the same constants (previously hardcoded
   100/500 inline, inconsistent with even the original placeholder values once
   the schema changed). `vi.json`/`en.json`'s `validation.nameMaxLength`/
   `descriptionMaxLength` copy text was updated to say 50/255. The earlier
   `NEEDS-TEAM-DECISION` flag on these two limits is resolved.
2. **Update-success toast** (`message.updateSuccess` / PORTAL_CV_OFFER_149):
   replaced the placeholder "Cập nhật Loại ưu đãi thành công." with the
   official text "Đã cập nhật loại ưu đãi «{{name}}»" (matching the create
   toast PORTAL_CV_OFFER_148's "Đã thêm loại ưu đãi «{Tên loại}»" pattern);
   English: "Promotion type «{{name}}» updated". The key now takes a `name`
   interpolation, so `PromotionTypeDetailDrawer`'s `message.success` call was
   updated to pass `{ name: updated.name }` (the mutation's own response, not
   stale form state). The earlier "not sourced from BA copy" flag is resolved.

## Not changed

- No create (F-02) work. `PageURLs.ofPromotionTypeCreate()`'s route still
  renders the bare list page with no form, as in Sprint 1.
- `PROMOTION_TYPE_PRIORITY_FALLBACK` now has its first real consumer (the
  update form mapper), matching the comment left on it during the Sprint 1
  priority-nullability follow-up.

## Re-validation

- `npm run typecheck` — passes (two type errors surfaced during
  implementation and were fixed: the `let`-reassignment-across-module-
  boundary issue above, and an AntD `FieldData` name-path type mismatch in
  the Drawer's `form.setFields` calls, fixed with a small local
  `applyFieldErrors` helper).
- `npx eslint` on every changed/new file under
  `promotion-management/promotion-type/` plus `src/routes/index.tsx` — 0
  errors, 0 warnings across 13 files.
- `npx prettier --write` on the same set — 3 files needed formatting
  (`PromotionTypeDetailDrawer/index.tsx`, `PromotionTypeStatusToggle.tsx`,
  `promotion-type.validation.ts`); re-ran clean after.
- `npm run build` — succeeds (pre-existing large-chunk warning, unrelated).
- `git status --short` shows exactly the files listed above as changed/new,
  plus the pre-existing unrelated `src/redux/slices/auth.slice.ts` and
  `src/helpers/menus.helper.ts` changes from earlier Sprint 1 work.
- Flattened both lang files and confirmed `PromotionManagement.*` has an
  identical key set in `vi.json` and `en.json` (48 keys each — unchanged by
  the correction above, since only values changed, not keys).

Re-run after the correction above: `npm run typecheck` (passes, no new
errors), `npx eslint` on the three touched files (`constant.ts`,
`promotion-type.validation.ts`, `PromotionTypeDetailDrawer/index.tsx`) — 0
errors/0 warnings, `npx prettier --check` on those three plus both lang files
— all formatted correctly with no rewrite needed, `npm run build` — succeeds
(same pre-existing unrelated chunk-size warning), `git status --short` —
exactly the same file set as before the correction (no new files).

## Not verified

- Browser/runtime behavior: Drawer open/close animation, row-click
  navigation, discard-guard modal, toggle-off `Modal.confirm`, AntD `Form`
  field-level error rendering for both Zod and backend validation failures,
  and the `maxItems`/priority `InputNumber` clear-to-null interaction were
  not opened in a browser.
- `app_locale=vi` and `app_locale=en` rendering of every new string.
- Permission behavior: `PROMOTION_MANAGEMENT_VIEW`-only (no `EDIT`) actually
  rendering the view-mode banner and disabling the Switch/Form at runtime —
  this is implemented per `useHasPermission`, not runtime-tested.
- `message.updateSuccess` text and `name`/`description` max-length values are
  now sourced from the UC #2091 spec (see "Correction" section above) and no
  longer flagged; their rendering in a live form/toast was still not opened in
  a browser.

## 2026-10-21 alignment pass: official BE API spec approved (Squad 3)

Two changes land in this sprint's files as part of the cross-sprint
alignment pass (full detail in
`docs/reports/2026-10-21-sprint3-promotion-type-create.md`'s "Alignment
pass" addendum):

1. `PromotionTypeDetailDrawer`'s view-mode mechanism tag now reads
   `promotionType.mechanism` through `PROMOTION_TYPE_MECHANISM_LABEL_KEY`
   instead of the hardcoded `column.mechanismTag` i18n key (now retired).
2. `error.updateFailed`'s text changed to the official
   PORTAL_CV_OFFER_152 copy ("Lưu không thành công. Vui lòng thử lại." /
   "Save failed. Please try again."), replacing this sprint's earlier
   placeholder ("Cập nhật Loại ưu đãi không thành công..."). The Drawer's
   error-detail Alert (`detailQuery.isError`) was also split by HTTP
   status: a 404 (`isPromotionTypeNotFoundError`) now shows a distinct
   "not found" message instead of the generic load-failure text, so the
   two different situations this sprint's report didn't yet distinguish are
   no longer conflated.

## 2026-10-21 UI polish pass (see Sprint 3 report for the full writeup)

`PromotionTypeDetailDrawer` picked up three of the five cosmetic changes
made across both Drawers for consistency: Drawer width 480 → 560px,
Priority/MaxItems moved onto one `Row`/`Col` pair in the edit form, and
`Input`/`Input.TextArea`/`InputNumber` got a `styledControl` class
(`border-radius: 1.2rem`) plus `size='large'`, matching
`PromotionTypeCreateDrawer`. The header status toggle
(`PromotionTypeStatusToggle` in `Drawer extra`) was already in this
position from Sprint 2 and needed no change. Full rationale — including
why `@/components/input.tsx` was checked and not adopted — is in
`docs/reports/2026-10-21-sprint3-promotion-type-create.md`'s matching
addendum, since that is where the bulk of the new UI (and the research)
lives.

## 2026-10-21 Component decomposition + default-to-View behavior change

Two behavior changes to this Drawer, detailed in full in the Sprint 3
report's matching addendum:

1. The Name/Description/Priority+MaxItems edit fields moved into shared
   components (`PromotionTypeNameField`, `PromotionTypeDescriptionField`,
   `PromotionTypePriorityMaxItemsRow`) reused from `PromotionTypeCreateDrawer`.
2. **Behavior change:** this Drawer no longer jumps straight to Edit mode
   for a user with `PROMOTION_MANAGEMENT_EDIT`. It now always opens in View
   mode; such a user instead sees a "Sửa" button in the header to enter
   Edit explicitly. The footer "Hủy" in Edit mode now returns to View
   (same discard-confirmation popup if dirty) instead of closing the
   Drawer — closing it is still only the X button / View's "Đóng". A
   successful save also now returns to View mode (an inferred, not
   explicitly specified, choice — see the Sprint 3 addendum). A user
   without EDIT permission sees no behavior change at all.

## 2026-10-21 Read-only View layout regrouping (+ Edit row alignment)

Per a pasted screenshot showing every View-mode field stacked one per row,
regrouped the static info blocks using AntD `Row`/`Col`:

1. "Mã" and "Cơ chế" (both locked/read-only fields rendered outside the
   edit form) now share one `Row` (`gutter={16}`, `span={12}` each) instead
   of two full-width blocks.
2. "Độ ưu tiên", "Hiển thị tối đa" and "Trạng thái" now share one `Row`
   (`span={8}` each, three columns).
3. "Tên loại" and "Mô tả" are unchanged — still their own full-width
   `ReadOnlySection` rows, as the instruction required.

Edit mode's form already paired Priority+MaxItems on one `Row` (from the
earlier UI-polish pass), so per the instruction's "if so, align" branch,
Status was added as a third column there too for visual consistency with
View. Status is still not an editable field of the edit form — it stays
controlled only by the header `PromotionTypeStatusToggle`, same as before.
The added column is a plain read-only `StatusBadge` display, identical to
View's. To support this without duplicating the Priority/MaxItems markup,
`PromotionTypePriorityMaxItemsRow` gained an optional `extraColumn?: ReactNode`
prop: when provided, all three columns become `span={8}`; when omitted
(as `PromotionTypeCreateDrawer` still does — it has no need for a third
column, status there is the header Switch bound to a hidden form field),
the row stays the original 2-column `span={12}` layout. This keeps the
component's existing contract and `PromotionTypeCreateDrawer`'s usage
completely unchanged.

Mã/Cơ chế's layout in Edit mode was not touched, since in Edit mode those
two fields are not part of the grouping question — they remain the static
locked blocks rendered the same way in both modes (the `Row`/`Col` wrapping
added here applies above the `mode === 'view' ? ... : <Form>...` branch, so
both modes get the Mã/Cơ chế row change identically — this was unavoidable
since those two fields are rendered once, outside the branch, not duplicated
per mode).

Validation: `npm run typecheck` clean, `npx eslint` on both changed files
(0 errors/0 warnings), `npx prettier --write` (both already correctly
formatted), `npm run build` succeeded (same pre-existing >500kB chunk-size
warning seen in every prior sprint). `git status --short` shows exactly the
two expected modified files:
`PromotionTypeDetailDrawer/index.tsx` and
`PromotionTypePriorityMaxItemsRow/index.tsx`.

Not verified: actual rendered column widths/wrapping in a browser at the
Drawer's 560px width — only confirmed via static review that `Col span={8}`
(three columns) and `span={12}` (two columns) are valid AntD 24-grid
fractions and that `ReadOnlySection`'s existing `.field`/`.label`/`.value`
classes have no fixed width that would fight the new `Col` wrapping.
