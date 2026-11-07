# Status System

## Separate domain status from UI lifecycle

Business statuses describe feature/domain data and workflow. Their values, interpretation, localized labels, and mapping to presentation are owned by the feature/domain. Do not create a universal business-status mapping unless cross-domain semantics have been verified.

Query loading, empty, and request-error presentation are UI lifecycle states, not business status badges. Promotion Type handles request failure, resolved empty results, and table loading separately from row status badges (`src/modules/products/promotion-management/promotion-type/components/PromotionTypeTableSection/index.tsx:146-179`). Editable form controls are also not display badges.

## Approved `StatusBadge` semantics and current contract

**APPROVED DECISION:** Keep the six existing variants and their semantic distinction:

| Variant | Approved meaning | Current visual implementation |
| --- | --- | --- |
| `success` | Successful, positive outcome | Green text / soft-green background |
| `warning` | Warning state | Orange text / soft-orange background |
| `error` | Actual failure, error, or rejected outcome | Still shares legacy red / soft-pink styling with `accent` |
| `info` | Informational status | Blue text / soft-blue background |
| `neutral` | Neutral status | Gray text / light-white background |
| `accent` | Intentional non-error emphasis, including selected eKYC workflow states | Still shares legacy red / soft-pink styling with `error` |

The API remains `label: string`, required `variant`, and optional `className`; the component renders a `span` and merges internal variant classes with `className` (`src/components/status-badge/index.tsx:3-39`). Preserve all six names, the public API, `<span>` markup, and the component's dimensions, typography, padding, alignment, and border radius. Do not add icons, borders, ARIA roles, defaults, or alter the other four variants through this decision.

### DS-05 approved visual targets

**APPROVED TARGET — DS-05, 2026-11-06:** The following pairs are approved for the two variants. They describe a design target; they are not current production styling.

| Variant | Approved foreground / background | Role and boundary |
| --- | --- | --- |
| `error` | `#B91C1C / #FEF2F2` | Uses semantic `feedback.error` for actual failure, error, or rejected outcomes. It is independent of `brand.primary`. |
| `accent` | `#0E377B / #E8EFFB` | Intentional non-error emphasis. The foreground follows approved `brand.secondary`; the background is an explicitly approved StatusBadge-specific navy-soft treatment, not a global brand or semantic token. |

Error and accent therefore remain semantically distinct. Accent is not `info`; do not reinterpret the approved eKYC mappings as informational status.

The earlier DS-05 consumer audit's proposed `accent #2B479E / #E8EFFB` pair and its `7.27:1` contrast result are **HISTORICAL / SUPERSEDED**. The current approved accent foreground is `#0E377B`, consistent with the approved `brand.secondary` in [Color System](color.md); do not use the old ratio as evidence for the new pair. The dated audit remains unchanged as historical evidence.

### Current implementation and compatibility

**CONFIRMED CURRENT IMPLEMENTATION:** `src/components/status-badge/status-badge.module.scss:1-37` defines a pill with centered flex alignment, `width: fit-content`, `0.2rem 0.8rem` padding, `10rem` border radius, `1rem` font size, weight 600, and `1.6rem` line height. The `.error` and `.accent` selectors still share `--primary-color / --soft-pink-color` (`:23-27`); current root values are `#dc2626 / #fef2f2` (`src/index.scss:7,25`). The other four variants continue to use their existing aliases (`status-badge.module.scss:13-21,29-37`).

**LEGACY-COMPATIBILITY:** The approved DS-05 pairs are not yet implemented. Preserve the current runtime colors and all component contracts until a separately scoped implementation task. This documentation update does not claim that the approved targets are rendered in production.

**APPROVED DECISION:** Use `error` only for actual failures, errors, or rejected outcomes, and use `accent` for intentional non-error emphasis. Color alone must not carry a status meaning; retain a readable label or another appropriate non-color cue.

### Approved eKYC mappings

**APPROVED DECISION — consumer mapping:** Keep these existing feature-owned mappings and business labels. Both states are intentional emphasis and remain `accent`, not `info`.

| eKYC state | StatusBadge variant | Existing label key | Current source |
| --- | --- | --- | --- |
| `ID_CARD_CHIP_CHECK` | `accent` | `identifyingByChip` | `src/components/customer/customer-card-type.tsx:29-30` |
| `OTP_CHECK` | `accent` | `waitingForOtpVerification` | `src/components/customer/customer-card-type.tsx:31-32` |

`CustomerCardType` currently returns no mapped status for `U2 + VERIFIED` (`src/components/customer/customer-card-type.tsx:25-35`) and renders its empty-label neutral fallback (`:47-51`). Whether that combination should remain unhandled or receive a domain-owned mapping is a separate **NEEDS-TEAM-DECISION**; DS-05 does not change it.

The reported `OfferDetailTabs` treatment of non-`ACTIVE` product status strings as inactive is also a separate business-mapping review item, not a DS-05 requirement. Do not change or reclassify it here. **NOT VERIFIED:** the inspected `OfferDetailTabs` display-status map and `computeOfferDisplayStatus` helper (`src/modules/products/promotion-management/promotion/components/OfferDetailTabs/index.tsx:26-31`; `src/modules/products/promotion-management/promotion/utils/promotion.display-status.ts:25-61`) do not establish that generalized behavior; it needs a focused source/domain review.

## Feature-owned mapping examples

**CONFIRMED CURRENT IMPLEMENTATION:** These examples map feature statuses and translated labels to shared presentation variants; none establishes a cross-domain mapping.

| Feature | Example mapping | Evidence and owner |
| --- | --- | --- |
| Promotion Type | `ACTIVE → success`; `INACTIVE → neutral` | Feature-owned variant and translated labels in `src/modules/products/promotion-management/promotion-type/components/PromotionTypeTableSection/index.tsx:32-35,66-69,121-127`; the detail drawer also maps locally at `src/modules/products/promotion-management/promotion-type/components/PromotionTypeDetailDrawer/index.tsx:237-244`. |
| Background Main | `INACTIVE → neutral`; `UPCOMING → warning`; `ONGOING → success`; `ENDED → neutral` | Feature-owned mapping and labels in `src/modules/system/theme-management/components/BackgroundMainTableSection/index.tsx:45-51,79-90,243-253`. |
| Topic | Feature-owned display status mapping | `src/modules/system/theme-management/components/TopicTableSection/index.tsx:46-54,180-193`; keep these meanings local. |

## Legacy renderers and compatibility

**LEGACY-COMPATIBILITY:** Keep existing legacy status components and styles. Do not bulk-migrate them to `StatusBadge`.

When a module is already being modified:

1. Inspect its current status renderers and consumers.
2. Check labels, business mappings, unknown values, localization, and display behavior.
3. Evaluate whether shared `StatusBadge` semantics and contract fit that module.
4. Preserve current behavior by default. Propose a separate migration if behavior or appearance would change; do not silently replace a renderer.

Examples include:

- `src/components/table-card-status.tsx:6-180`: a broad global `Status` switch with a blank/gray fallback for unknown values (`:162-180`). It is not interchangeable with `StatusBadge` without reviewing consumers and mappings.
- `src/components/customer/table-card-status.tsx:5-36`: a boolean-driven customer renderer with its own localized text and treatment.
- `src/components/contract-card/contract-card-status.tsx:6-26` and `src/components/contract-card/payment-card-status.tsx:6-42`: contract/payment renderers with feature-specific options and due-date behavior.
- `src/modules/products/configuration/product-labels/shared/StatusBadge.tsx:15-50`: Product Labels local status/mode renderers. Similar names do not imply shared contracts.

This scoped review requirement supplements [`.claude/rules/07-component.md`](../../.claude/rules/07-component.md#rules) / [`.codex/rules/07-component.md`](../../.codex/rules/07-component.md#rules), which requires consumer checks before shared component changes.

## Accessibility and limits

**ADOPTED TARGET:** Status meaning must not be conveyed by color alone. Review label clarity, accessible names for meaningful icons, contrast against the actual surface, and keyboard/focus behavior for any interactive status control. A static `StatusBadge` is text in a `span`; this source does not declare a separate accessible-name, icon, or interaction API.

**APPROVED TARGET:** WCAG 2.2 Level AA remains the project target for new or substantially changed UI. The approved opaque pairs are approximately `5.91:1` for error (`#B91C1C` on `#FEF2F2`) and `9.82:1` for accent (`#0E377B` on `#E8EFFB`), recalculated using WCAG relative luminance. These ratios exceed 4.5:1 for normal text for these pairs only. The badge's current small typography (`1rem` under the root `62.5%` scale) remains a separate visual/readability review concern; passing color contrast does not establish legibility or conformance.

**NOT VERIFIED:** Browser-rendered colors, effective opacity, actual text rendering, keyboard/screen-reader behavior, and complete domain-status coverage. No browser-rendered WCAG conformance is claimed. See [Color System](color.md) for the approved brand palette and its separate semantic color boundaries.
