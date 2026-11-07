# DS-05 StatusBadge Final Decision Synchronization

- **Author:** Vuowng
- **Date:** 2026-11-06
- **Branch:** `improve/vuongnq/2729_sync_CL`
- **Revision:** `dd5521dfb28afa1ce9426aeb990644ccb4f21542`

## Objective and scope

Synchronize the final approved DS-05 StatusBadge color and consumer decisions
into the shared Design System documentation and relevant Codex styling guidance.
This is a documentation-only change. No component, consumer mapping, API,
style, or other application behavior was changed.

## Approved DS-05 decision matrix

| Variant | Approved foreground / background | Approved meaning | Scope |
| --- | --- | --- | --- |
| `error` | `#B91C1C / #FEF2F2` | Actual failure, error, or rejected outcome; uses `feedback.error`, independent of `brand.primary`. | Shared StatusBadge variant target. |
| `accent` | `#0E377B / #E8EFFB` | Intentional non-error emphasis, including selected eKYC workflow states. | Foreground follows approved `brand.secondary`; `#E8EFFB` is a StatusBadge-specific background, not a global token. |

The approved brand palette remains the five primitives in
[`docs/design-system/color.md`](../../design-system/color.md): primary
`#DB1F26`, secondary `#0E377B`, orange `#EE7117`, yellow `#F7D107`, and Sun
`#F4A60E`. This DS-05 approval does not add a global brand or semantic token
for the accent background.

## Consumer mapping decisions

| eKYC state | Approved variant | Existing label key | Current source evidence |
| --- | --- | --- | --- |
| `ID_CARD_CHIP_CHECK` | `accent` | `identifyingByChip` | [`CustomerCardType`](../../../src/components/customer/customer-card-type.tsx#L29) (`:29-30`) |
| `OTP_CHECK` | `accent` | `waitingForOtpVerification` | [`CustomerCardType`](../../../src/components/customer/customer-card-type.tsx#L31) (`:31-32`) |

These are intentionally emphasized workflow states, not `info`. The existing
mapping and label keys are retained. The source currently has no explicit
`U2 + VERIFIED` mapping (`customer-card-type.tsx:25-35`); its default path
returns no status format and the component emits an empty label with the
neutral fallback (`:47-51`). That remains a separate
**NEEDS-TEAM-DECISION** item and was not changed.

The reported `OfferDetailTabs` treatment of non-`ACTIVE` product status strings
as inactive remains a separate business-mapping review item, outside DS-05.
It was not changed or reclassified. **NOT VERIFIED:** the inspected display
status mapping (`OfferDetailTabs/index.tsx:26-31`) consumes computed display
codes, while `computeOfferDisplayStatus` explicitly returns `INACTIVE` for
stored `INACTIVE` offer/category values and otherwise checks expiry and start
dates before returning `ACTIVE` (`promotion.display-status.ts:25-61`). That
source does not establish the broader reported behavior; resolving it requires
a focused source/domain review.

## Files inspected and changed

Inspected: `AGENTS.md`; `.codex/README.md`; `.codex/rules/00-general.md`,
`07-component.md`, and `10-styling.md`; `docs/README.md`;
`docs/design-system/README.md`, `color.md`, `status.md`, and `typography.md`;
the DS-05 consumer audit; the approved brand-color documentation update; DS-03
decision/review records; current StatusBadge component and stylesheet;
`CustomerCardType`; the eKYC status type; and the current OfferDetailTabs
display-status source.

Changed:

- `docs/design-system/status.md` — records approved DS-05 pairs and semantics,
  current implementation, the eKYC mappings, outstanding business-mapping
  items, and updated contrast evidence.
- `docs/design-system/color.md` — adds a minimal cross-reference to the
  Status System for the component-specific approved targets and clarifies that
  they are not implemented or global color tokens. The five-color palette is
  unchanged.
- `.codex/rules/10-styling.md` — replaces the stale “accent redesign deferred
  to DS-05” phrasing with a reference to the approved shared documentation and
  the still-pending implementation boundary.
- `docs/reports/2026-11-06/ds-05-status-badge-final-decision-sync.md` — this
  report.

The earlier DS-05 audit and other decision reports were not modified.

## Historical, current, and approved-target distinctions

- **APPROVED TARGET:** Error is `#B91C1C / #FEF2F2`; accent is
  `#0E377B / #E8EFFB`; `ID_CARD_CHIP_CHECK` and `OTP_CHECK` remain `accent`.
- **CURRENT IMPLEMENTATION:** `status-badge.module.scss:23-27` still applies
  `--primary-color / --soft-pink-color` to both error and accent. The current
  root aliases resolve to `#dc2626 / #fef2f2` (`src/index.scss:7,25`). The
  approved DS-05 styles have not been implemented.
- **HISTORICAL / SUPERSEDED:** The prior DS-05 audit proposed
  `#2B479E / #E8EFFB` and reported `7.27:1` for that pair
  ([audit §10](../../audits/design-system/2026-11-06/ds-05-status-badge-consumer-audit.md#10-proposed-color-and-contrast-assessment)).
  It remains unchanged as historical evidence. That value is not the current
  approved brand secondary or StatusBadge accent foreground, and its contrast
  result is not used for the new pair.
- The canonical `brand.secondary` is `#0E377B` in the active palette table of
  `docs/design-system/color.md`. Other `#2B479E` references in old DS-03
  analyses/reports are historical; no active Codex StatusBadge guidance uses
  it as the target.

## Accessibility and contrast assessment

Ratios below use WCAG relative luminance and the approved opaque pairs:

| Pair | Ratio | Assessment |
| --- | ---: | --- |
| Error `#B91C1C` on `#FEF2F2` | **5.91:1** | Above the 4.5:1 normal-text threshold for this pair. |
| Accent `#0E377B` on `#E8EFFB` | **9.82:1** | Recalculated for the newly approved foreground; above the 4.5:1 normal-text threshold for this pair. |

WCAG 2.2 Level AA remains the target for new or substantially changed UI.
These pair calculations do not establish browser-rendered contrast or
application conformance. The existing badge font is `1rem` with root
`font-size: 62.5%`, approximately 10 CSS px under a default 16 px browser root
(`status-badge.module.scss:8-10`; `src/index.scss:43-51`). Its small typography
remains a separate readability review concern.

## Production compatibility guarantees

The documentation preserves the six variants (`success`, `warning`, `error`,
`info`, `neutral`, `accent`), the existing public props (`label`, `variant`,
optional `className`), `<span>` markup, and the existing dimensions, typography,
padding, alignment, and radius (`src/components/status-badge/index.tsx:3-39`;
`status-badge.module.scss:1-10`). It does not authorize icons, borders, ARIA
roles, defaults, or changes to the other four variants. Current production
styling and both eKYC mappings remain untouched.

DS-01 typography, DS-02 Scheme Sync scope, DS-03 brand/semantic separation,
and DS-04 accessibility requirements—including the WCAG 2.2 AA project
target—are preserved. The accent background is component-specific. No DS-05
value is asserted as already applied in production.

## Risks and unverified items

- The approved pairs pass a foreground/background calculation only; actual
  browser rendering, effective opacity, neighboring surfaces, and user
  readability were not tested.
- The small badge typography needs separate visual/accessibility review.
- Rendered translations for the existing eKYC label keys were not verified.
- `U2 + VERIFIED` remains unmapped and requires separate business review.
- The stated generalized `OfferDetailTabs` non-`ACTIVE` mapping behavior was
  not established by the inspected current helper; keep it as a separate
  investigation item.
- No authenticated runtime, browser, screen-reader, or full domain/backend
  behavior was verified.

## Validation performed and limitations

- Re-read modified Markdown directly; confirmed the five approved brand
  primitives remain unchanged and `brand.secondary` is `#0E377B`.
- Verified the approved error/accent values and eKYC mapping keys against the
  supplied decisions and current source line references.
- Recalculated `#0E377B` on `#E8EFFB` as **9.82:1**; did not reuse the old
  `#2B479E` ratio.
- Searched active shared Design System and Codex styling guidance for stale
  `#2B479E` StatusBadge accent targets; the remaining old target is marked
  historical/superseded in the shared status document and retained in the
  unmodified dated audit.
- Checked Markdown cross-references and source anchors cited above. No
  application tests, build, lint, typecheck, browser, or accessibility
  conformance checks were run for this documentation-only task.
- `docs/` and `.codex/` are local-only under existing ignore rules. No ignore
  rules were changed and no local-only files were force-tracked.
- No application/runtime file was modified by this task. Unrelated application
  source edits were present in the shared worktree and left untouched; their
  authorship is not attributed by this report.
