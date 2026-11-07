# DS-05 StatusBadge Consumer Audit

## 1. Metadata and task understanding

- **Author:** Vuowng
- **Date:** 2026-11-06 (Asia/Ho_Chi_Minh)
- **Branch:** `improve/vuongnq/2729_sync_CL`
- **Revision:** `5fc4be3fae39aaa5d26099804f440a1061a102ab`
- **Scope:** Read-only audit of the shared `StatusBadge` contract, all direct imports and wrapper paths, the approved DS-05 error/accent direction, and bounded implementation risks. This report is the only file created.
- **Design decision audited:** `error` → foreground `#B91C1C`, background `#FEF2F2`, for actual failure/error/rejection; `accent` → foreground `#2B479E`, background `#E8EFFB`, for non-error emphasis/priority/VIP/special labels. Keep API and other variants. Accent fill is specific to `StatusBadge`.

No implementation or business-mapping change is authorized by this audit.

## 2. Scope, repository state, and methodology

Read the Codex entry point and profile index, relevant architecture/rules, the `analyze-module` skill, the shared Design System status/color pages, and the dated DS-03 audit/decision evidence. Traced the component from its entry file through every source import, JSX use, status mapper, wrapper, and similarly named local renderer. Searched for direct and dynamic variant values, re-exports, class overrides, tests/snapshots, and package scripts. Inspected the proposed pair colors and calculated WCAG relative-luminance contrast ratios.

The worktree was already **dirty** at inspection: it contained local edits in `src/lang/en.json`, `src/lang/vi.json`, and Scheme Sync files, including an untracked Scheme Sync hook. These were preserved. Findings describe the current working-tree source at the recorded `HEAD`; no claim is made that the dirty worktree is identical to that revision. None of the inspected shared `StatusBadge` source files was modified by this task.

The applicable risk reference is [Codex Architecture §19](../../../../.codex/knowledge/ARCHITECTURE.md#19-change-risk-classification): a future visual change is **HIGH-RISK** because `StatusBadge` is a shared component with cross-feature consumers. This audit itself is read-only.

## 3. Component entry point and public contract

**CONFIRMED CURRENT IMPLEMENTATION:** [`src/components/status-badge/index.tsx`](../../../../src/components/status-badge/index.tsx#L3) exports `StatusBadgeVariant` with exactly six string values: `success`, `warning`, `error`, `info`, `neutral`, and `accent` (`:3-9`). The default component is directory-index exported; all ten consumer files import `@/components/status-badge`. No additional component barrel, alias, or re-export was found.

The props are `label: string`, required `variant: StatusBadgeVariant`, and optional `className?: string` (`:11-15`). The variant-to-class record is exhaustive at compile time (`:17-24`). The component renders a `<span>` containing `label` and joins the base, variant, and optional caller class names (`:26-39`). It does not accept an icon, children, `role`, `aria-*`, or other DOM props. `variant` is required and has no default. There is no runtime fallback: if an untyped caller supplies an unsupported variant, the lookup is undefined and filtered from the class list, leaving the base badge class (and any supplied class) only. No source consumer passes `className` today.

## 4. Styling ownership and current presentation

The component owns one private stylesheet, [`status-badge.module.scss`](../../../../src/components/status-badge/status-badge.module.scss#L1). `.badge` uses `display:flex`, centered alignment, `width:fit-content`, padding `.2rem .8rem`, and `border-radius:10rem` (`:1-7`). It sets `font-size:1rem`, `font-weight:600`, `line-height:1.6rem` (`:8-10`). Since [`src/index.scss`](../../../../src/index.scss#L43) sets the root font size to `62.5%`, the badge font currently resolves to approximately **10 CSS px** and line-height to 16 px in a default 16 px browser environment; vertical padding is approximately 2 px and horizontal padding 8 px. The badge text is small, including in dense table cells.

Current variants use root aliases: success `--green-color/--soft-green-color` (`:13-16`), warning `--orange-color/--soft-orange-color` (`:18-21`), error and accent share `--primary-color/--soft-pink-color` (`:23-27`), info `--blue-color/--soft-blue-color` (`:29-32`), and neutral `--gray-color/--light-white-color` (`:34-37`). Current root values include `--primary-color:#dc2626` and `--soft-pink-color:#fef2f2` (`src/index.scss:7,25`). This is existing production styling and remains **LEGACY-COMPATIBILITY** until a separately authorized implementation.

No badge border, icon, focus, hover, or disabled treatment is defined. The badge is not itself interactive or focusable. No global override targeting the badge module was found in `src/custom-ant.scss` or other source stylesheets. A future accent split should stay inside this component stylesheet and preserve the root class, variant class contract, optional `className`, dimensions, and the other four variants.

## 5. Consumer graph summary

The source search found **10 direct-import consumer files and 12 `<StatusBadge>` render sites**. Variant values are supplied either from typed feature maps/helpers or inline boolean conditions. The direct graph closes at those call sites; no second shared wrapper or re-export layer was found.

One shared wrapper is [`CustomerCardType`](../../../../src/components/customer/customer-card-type.tsx#L7), which owns the only `accent` mapping and is rendered by three Users-feature call sites (list, customer form/detail, and access-account view; see §7). [`PromotionTypeStatusBadge`](../../../../src/modules/products/promotion-management/promotion-type/components/PromotionTypeDetailDrawer/index.tsx#L237) is another local helper, but it only emits success/neutral. No consumer routes a business status through a generic factory that can yield `error` or `accent` beyond the customer formatter.

Two similarly named renderers are **not** shared `StatusBadge` consumers:

- Product Labels [`ProductLabelStatusBadge` / `DerivedStatusBadge`](../../../../src/modules/products/configuration/product-labels/shared/StatusBadge.tsx#L15) delegates to the legacy `TableCardStatus`; its consumers remain feature-local.
- Scheme Sync `renderProductStatusBadge` in [`CreditCardResultsTable`](../../../../src/modules/products/configuration/scheme-sync/components/CreditCardTab/CreditCardResultsTable/index.tsx#L154) returns feature-local markup/styles and does not import the shared component. Scheme Sync source in this checkout is also part of the pre-existing dirty worktree.

Other legacy `table-card-status` renderers likewise have independent contracts and are outside this shared component's consumer graph. Similar names or red styling do not make these indirect consumers.

## 6. Consumer inventory — Users and customer presentation

| Source and owner | Current business mapping / label evidence | DS-05 classification and disposition |
| --- | --- | --- |
| [`src/components/customer/customer-card-type.tsx:7-50`](../../../../src/components/customer/customer-card-type.tsx#L7) — shared customer presentation used by Users | U1 → `deviceInfo`/neutral; U2 + `HAS_BASIC_INFORMATION` → `basicInfoAvailable`/neutral; U2 + `ID_CARD_CHIP_CHECK` → `identifyingByChip`/accent; U2 + `OTP_CHECK` → `waitingForOtpVerification`/accent; U3 → `identified`/success; C1 → `potentialCustomer`/warning; C2 → `customer`/info (`:22-42`). Vietnamese labels for the two accent states are “Đang định danh (Quét chip)” and “Chờ xác thực (OTP)” in [`src/lang/vi.json:1167-1170`](../../../../src/lang/vi.json#L1167). | The two accent cases are **AMBIGUOUS**. They are eKYC workflow steps, not failure/rejection, but the source does not establish that these steps represent priority, VIP, special identity, or intended visual emphasis. Confirm with the Users/domain owner before treating the changed accent color as semantically correct. No consumer currently selects shared `error`. Do not change the mapping based on color alone. |
| [`src/modules/users/customer/list-customer/list.customer.tsx:133-135`](../../../../src/modules/users/customer/list-customer/list.customer.tsx#L133) and [`view/form.tsx:215-217`](../../../../src/modules/users/customer/list-customer/view/form.tsx#L215), [`src/modules/users/customer/access-account/view/general.tsx:77`](../../../../src/modules/users/customer/access-account/view/general.tsx#L77) — Users | Call `CustomerCardType`; list and detail pass `ekycStatus`, access-account passes only customer level. The shared helper applies its neutral fallback when status formatting returns `null`. | Indirect consumers of the two ambiguous accent states through `CustomerCardType`; otherwise current mappings do not use error/accent. |
| Customer eKYC type [`src/types/customer.d.ts:179-183`](../../../../src/types/customer.d.ts#L179) | The declared union also includes `VERIFIED`. The `U2` switch in `CustomerCardType` handles only the three prior values and returns `null` for `VERIFIED` or any unrecognized case (`customer-card-type.tsx:25-35`). The component still renders an empty label with `neutral` fallback (`:48-51`). | **DYNAMIC_UNVERIFIED** for the `VERIFIED`/unknown path. Whether this combination is possible or intentionally blank is not established. It is an existing behavior to preserve until the domain owner verifies it; do not fold it into error/accent work silently. |

The component is consumed by `list.customer.tsx`, the customer detail form, and access-account general view. The supplied domain status union and display helper support the workflow interpretation, but do not establish the intended emphasis hierarchy for chip/OTP steps. English equivalents for the two keys were not found in the current `src/lang/en.json` search; the rendered fallback/locale behavior was not verified.

## 7. Consumer inventory — Products

| Source and owner | Current business mapping / label | DS-05 classification and disposition |
| --- | --- | --- |
| [`PromotionTypeTableSection`](../../../../src/modules/products/promotion-management/promotion-type/components/PromotionTypeTableSection/index.tsx#L32) (`:32-34,66-69,121-127`) and [`PromotionTypeDetailDrawer`](../../../../src/modules/products/promotion-management/promotion-type/components/PromotionTypeDetailDrawer/index.tsx#L237) (`:237-249`) | Promotion type `ACTIVE` → success and localized active label; `INACTIVE` → neutral and localized inactive label. The drawer helper derives the same two choices. Unknown table values render `EMPTY_CELL` when no status label exists. | No current error/accent mapping; these status uses are unaffected by DS-05. Business mapping is feature-owned. |
| [`PromotionListPage`](../../../../src/modules/products/promotion-management/promotion/views/PromotionListPage/index.tsx#L31) (`:31-36,128-135`) | Computed offer display status: active → success; inactive/expired → neutral; upcoming → warning. Labels come from `getOfferDisplayStatusLabel` (`promotion.status-label.ts:16-32`). | No current error/accent mapping; no consumer migration indicated. The display-status code is a typed client-computed union. |
| [`OfferScopePreviewTable`](../../../../src/modules/products/promotion-management/promotion/components/OfferScopePreviewTable/index.tsx#L75) (`:75-82`) | Read-only `hasPromotionalOffer` boolean → localized “yes”/“no”, success/neutral. Source comment documents the field as read-only. | No current error/accent mapping; the binary value and text cue remain unchanged. |
| [`OfferDetailTabs`](../../../../src/modules/products/promotion-management/promotion/components/OfferDetailTabs/index.tsx#L26) (`:26-31,116-123,170-199`) | Offer display status uses the same active/success, inactive/expired/neutral, upcoming/warning map; product status uses active/success and otherwise neutral with an inactive label; a read-only gift boolean uses success/neutral with yes/no text. | The display-status and boolean maps do not use error/accent. Product status is **DYNAMIC_UNVERIFIED**: its render parameter is plain `string`; every value other than `ACTIVE` is presented as inactive (`:176-185`). That may collapse unknown backend values into “inactive.” No evidence shows it maps to error/accent, so keep the existing behavior and treat any correction separately. |

## 8. Consumer inventory — System and other UI status mappings

| Source and owner | Current business mapping / label | DS-05 classification and disposition |
| --- | --- | --- |
| [`BackgroundMainTableSection`](../../../../src/modules/system/theme-management/components/BackgroundMainTableSection/index.tsx#L45) (`:45-52,79-90,243-254`) and [`BackgroundMainViewPage`](../../../../src/modules/system/theme-management/background-main/views/BackgroundMainViewPage/index.tsx#L53) (`:53-69,186,239-245`) | Feature-owned display statuses: inactive → neutral, upcoming → warning, ongoing → success, ended → neutral. Labels use localized common display-status keys. | No current error/accent mapping. The list/detail pair uses matching local mappings; no DS-05 consumer-level change indicated. |
| [`TopicTableSection`](../../../../src/modules/system/theme-management/components/TopicTableSection/index.tsx#L46) (`:46-51,114-122,184-194`) | Theme category display statuses: inactive → neutral, upcoming → warning, ongoing → success, ended → neutral; localized labels are feature-owned. | No current error/accent mapping. |
| [`TopicPrioritySortContent`](../../../../src/modules/system/theme-management/topic/components/TopicPrioritySortContent/index.tsx#L29) (`:29-40,108-116`) | Topic statuses: active → success, upcoming → warning, expired/disabled → neutral, with localized status labels. | No current error/accent mapping. |
| [`CustomerCardType`](../../../../src/components/customer/customer-card-type.tsx#L22) | Also emits success, warning, info, and neutral for other customer categories/status labels; details in §6. | Not error/accent except for the two ambiguous eKYC steps. |

All feature status types are statically constrained in TypeScript, but static unions do not prove backend values conform at runtime. The specific open string fallback in `OfferDetailTabs` and the unhandled `VERIFIED` customer path are noted above; other unexpected API values were not exercised.

## 9. Error/accent classification summary

| Classification | Current evidence |
| --- | --- |
| `CORRECT_ERROR` | No current direct or wrapped `StatusBadge` consumer supplies `variant="error"` or maps a business value to `error`. |
| `CORRECT_ACCENT` | No usage was confirmed as clearly representing priority, VIP, or an explicitly designated special/emphasized label. |
| `MISCLASSIFIED` | None established from the available source evidence. Do not relabel any feature business value without owner confirmation. |
| `AMBIGUOUS` | `CustomerCardType`: `ID_CARD_CHIP_CHECK` and `OTP_CHECK` map to `accent`; their labels describe eKYC steps, but emphasis/special-label intent is not stated. |
| `DYNAMIC_UNVERIFIED` | `CustomerCardType` has a declared `VERIFIED` eKYC value with no explicit case; `OfferDetailTabs` treats every non-`ACTIVE` product-status string as inactive. Neither path currently selects error/accent, but both are relevant dynamic mapping limitations for a safe consumer review. |

The inventory includes other-variant callers to close the component consumer graph. They are labeled “no current error/accent mapping” rather than assigned a false error/accent classification. Classifications above describe semantic fit for the approved DS-05 variants, not a general quality grade for every other status variant.

## 10. Proposed color and contrast assessment

Contrast ratios were calculated from the approved opaque HEX foreground/background pairs using WCAG relative luminance and `(Llighter + .05) / (Ldarker + .05)`:

| Pair | Ratio | Text assessment |
| --- | ---: | --- |
| Error `#B91C1C` on `#FEF2F2` | **5.91:1** | Exceeds the 4.5:1 WCAG 2.2 AA normal-text threshold for this color pair. |
| Accent `#2B479E` on `#E8EFFB` | **7.27:1** | Exceeds the 4.5:1 threshold for this color pair. |
| Feedback info `#1D4ED8` on `#EFF6FF` | **6.16:1** | Exceeds the 4.5:1 threshold for this color pair. |
| Accent foreground `#2B479E` on info background `#EFF6FF` | **7.73:1** | Cross-pair text contrast; does not measure perceptual distinction between the semantic roles. |
| Info foreground `#1D4ED8` on accent background `#E8EFFB` | **5.80:1** | Cross-pair text contrast; does not establish that users can infer role from color alone. |

The error and accent foregrounds differ by hue family (red vs navy), giving the approved states a clear color distinction. Accent and feedback info remain two blue semantic roles; their text pairs both contrast well, but they must not be merged or identified only by hue. The badge label and surrounding table/detail context remain the primary non-color cues. The current markup provides visible label text and no icon. No icon is required by the reviewed design decision; adding one would expand markup/API and can increase width in dense tables. The component is a non-interactive pill, not an outlined control; a border is not required solely as a control-boundary cue. If a border is proposed as meaningful state information, evaluate it against actual adjacent backgrounds separately.

These figures assess only the supplied opaque pairs. They do not verify current rendered source colors, text sizing/legibility, alpha/opacity, neighboring UI, user perception, browser rendering, or WCAG conformance.

## 11. Accessibility and presentation considerations

- **Text and non-color meaning:** current `<span>` content is the visible `label`; labels such as “error,” “failed,” “rejected,” “VIP,” or “priority” should be clear in the owning feature. The component itself has no icon or non-color state decoration. Do not rely on the red/blue hue alone.
- **Small type:** `1rem` resolves to approximately 10 px under the current root scale. Although the proposed pairs exceed the normal-text contrast ratio, contrast does not establish readability at this size. Review actual labels, localization, dense table zoom/reflow, and user legibility during implementation validation.
- **Markup:** a plain span exposes its text as ordinary content; no `role="status"`, `aria-live`, or status-specific semantics are emitted. That is appropriate for many static table labels, but dynamic announcement needs depend on the consumer. Do not add an ARIA role globally without verifying whether that would cause noisy announcements or alter semantics.
- **Icons and borders:** the API currently has no icon prop and the design is text-led. A readable label is the existing non-color cue. Borders/icons are not indicated as a prerequisite by these contrast pairs; keep them out of the minimal visual change unless design review identifies a specific ambiguity.
- **Dense tables and light surfaces:** both backgrounds are light tints and the component is compact. The intended red/navy foregrounds have strong text contrast against their respective tints. Verify the tint distinction on page, table, drawer, and modal surfaces in rendered UI; background tint ratios against white are not the text contrast measure above.
- **Keyboard focus:** the badge itself is not focusable. Do not add focus styling to it unless a future contract makes it interactive. Preserve focus behavior of surrounding controls.

WCAG 2.2 AA is an approved project target for new or substantially changed UI; this audit does not claim the current component or application conforms.

## 12. Compatibility and regression risks

1. **Existing accent users:** two eKYC stages currently use the same primary-red/soft-pink styling as error. Separating `.accent` will make these blue. Their current domain intent is ambiguous; the Users owner must verify before rollout. Preserve the mapping and production appearance until that review completes.
2. **No current error callers:** changing `.error` values has no confirmed current shared-badge consumer effect, but future and out-of-checkout consumers cannot be ruled out. The component is still shared public UI.
3. **Implicit runtime fallback:** variant is required in TypeScript; no default or runtime neutral fallback exists for an invalid value. Keep the API unchanged and ensure all typed variant mappings remain valid. Do not add silent fallback behavior as incidental work.
4. **Layout:** preserve the shared size, padding, radius, alignment, and typography in the color-only change. A new border/icon or longer local label may affect pill width and row height.
5. **CSS variables and cascade:** current error/accent share legacy root aliases. Split their selectors narrowly in the module; preserve aliases and the other variant rules. Optional `className` remains a possible consumer-level override path even though current callers do not use it. No global override was found, but visual checks should include styles injected by feature ancestors and portals.
6. **Mapping drift:** customer `VERIFIED` is not explicitly handled; product detail maps any non-active status string to inactive. Do not conceal these existing business/display questions by redefining shared colors.
7. **Tests/snapshots:** no test or snapshot files and no test script were found in this checkout. Anticipate screenshot/manual baseline comparison across the 12 call sites; repository static checks cannot prove the rendered visual delta.
8. **Working-tree edits:** existing uncommitted Scheme Sync and locale work must remain intact; re-check current source before a later implementation and avoid applying audit assumptions to a different final diff.

## 13. Risk classification

**Future component styling implementation: HIGH-RISK** under [Codex Architecture §19](../../../../.codex/knowledge/ARCHITECTURE.md#19-change-risk-classification), because this is a shared component with ten directly importing consumer files across Users, Products, and System. Risk is bounded if only `.error`/`.accent` declarations change, but shared visual impact spans list tables, detail drawers/forms, and dense read-only tables. A consumer mapping change would add business-rule risk and requires separate owner evidence.

**Audit: read-only.** No runtime or consumer contract changed here.

## 14. Minimal phased implementation plan

1. **Resolve consumer intent:** ask the Users/domain owner whether chip identification and OTP waiting are intended as emphasis/special eKYC states. If yes, retain the two existing `accent` mappings. If they mean ordinary informational progress, propose a separate approved mapping change; do not silently change to `info` or another variant.
2. **Bound component-only visual change:** after that confirmation, split the shared SCSS selector so `error` uses `#B91C1C / #FEF2F2` and `accent` uses `#2B479E / #E8EFFB`. Keep six variant names, props, `<span>` markup, dimensions, aliases, business maps, and all other variant CSS intact. Do not add icons, borders, a role, or defaults without separate approval.
3. **Validate mapping and style scope:** re-run the all-source import/variant search; inspect the full diff and CSS module cascade; verify no API/type/alias changes. Run repository-supported typecheck/lint/Prettier as relevant after implementation, and manually compare list, detail, and dense-table examples in supported light surfaces. Since no test framework exists, do not invent a test command.
4. **Review accessibility and visual regression:** check text at real rendered size, labels without color, red/navy tint distinction against page/table/drawer backgrounds, translation coverage, zoom/reflow, and any component overrides. Do not claim WCAG compliance from hex calculations alone.
5. **Rollback:** revert only the two variant color declarations if visual regression or user confusion appears; keep the existing API and mapped labels. Any consumer mapping fix should have its own focused change and rollback path.

## 15. NEEDS-TEAM-DECISION and verification items

- **NEEDS-TEAM-DECISION — Users eKYC accent semantics:** confirm whether `ID_CARD_CHIP_CHECK` and `OTP_CHECK` are intentionally special/emphasized labels or informational workflow progress. Until confirmed, keep the current runtime styling.
- **NEEDS-TEAM-DECISION — invalid/unhandled status presentation:** decide separately whether U2 + `VERIFIED` should remain blank/neutral or receive a domain-owned label/variant. Audit is not authorization to change it.
- **NEEDS-TEAM-DECISION — accent vs info differentiation:** the supplied colors are distinct brand/info blues, but labels/context must carry the meaning. Confirm no additional badge shape/icon is needed; any such addition expands scope.
- **NOT VERIFIED — English translations:** the two customer eKYC translation keys were not found in `src/lang/en.json`; fallback language and rendered label were not tested.
- **NOT VERIFIED — API domain guarantees:** static TypeScript unions/records do not establish server values. The open string consumer above remains particularly uncertain.
- **NOT VERIFIED — browser/screen-reader behavior:** no browser, device, authenticated API, screen-reader, contrast tool, or visual validation was performed.
- **NOT VERIFIED — downstream consumers:** source searches cover this checkout only; external packages or downstream builds are not available.

## 16. Validation performed and limitations

- Verified Codex entry point/profile index, relevant Codex rules/knowledge, the existing Design System status/color decisions, and prior DS-03 audit evidence. No Claude profile file was read or changed.
- Inspected the actual component, its private SCSS module, root font scale and legacy aliases, and all ten direct-import consumer files. Searched for re-exports, wrappers, direct literals, dynamic maps, local lookalike renderers, CSS overrides, tests/snapshots, and package scripts.
- Recalculated the five listed contrast pairs using the WCAG relative-luminance formula; results are rounded to two decimal places.
- No package script was run: `package.json` has no test script/framework, and this read-only audit makes no source change that warrants typecheck/lint/build. Static analysis does not prove browser rendering, business correctness, or WCAG conformance.
- No application source, styles, Design System decision, Codex rule, `.gitignore`, Claude profile, or commit was changed. This report is local-only under the existing ignored `docs/` policy.
