# Brand Color Decisions Documentation Update

- **Author:** Vuowng
- **Date:** 2026-11-06
- **Branch:** `improve/vuongnq/2656_sync-UI-simulator`
- **Revision:** `10e7aa7a665f0d05bcbe5ca064f0c377756d2a34`

## Objective and approved decisions

Update Codex-facing design-system guidance to record the approved HD SAISON
brand primitives. This is a documentation-only update. The approved palette is
not a complete semantic color system and does not establish runtime alignment.

| Brand role | Before this update | Approved value | Decision |
| --- | --- | --- | --- |
| `brand.primary` | `#DB1F26` | `#DB1F26` | Red (Persian Red), unchanged. |
| `brand.secondary` | `#2B479E` | `#0E377B` | Blue (Cobalt); replaces the prior documented target. |
| `brand.orange` | `#EE7117` | `#EE7117` | Orange (Clementine), unchanged. |
| `brand.yellow` | `#FFD200` | `#F7D107` | Yellow (Gold); replaces the prior documented target. |
| `brand.sun` | Not recorded | `#F4A60E` | Orange-Yellow (Sun), separate brand primitive with no semantic UI role. |

The five values are approved for the HDS Admin brand reference. No shade ramps,
opacity variants, interaction colors, semantic mappings, or Ant Design component
token mappings were added.

## Scope and files

Files inspected included `AGENTS.md`, `.codex/README.md`, `.codex/rules/00-general.md`,
`.codex/rules/07-component.md`, `.codex/rules/08-refactoring.md`,
`.codex/rules/10-styling.md`, `docs/README.md`,
`docs/design-system/README.md`, `docs/design-system/color.md`,
`docs/design-system/status.md`, `docs/design-system/typography.md`, the
2026-11-06 brand-color alignment audit, the DS-03 decision and review reports,
the DS-05 StatusBadge audit, and current source `src/index.scss` and
`src/providers/index.tsx`.

Files modified:

- `docs/design-system/color.md` — added the dated current approved palette,
  separated brand primitives from semantic targets, and documented non-mappings
  and runtime compatibility.
- `.codex/rules/10-styling.md` — removed duplicated brand HEX values and
  points Codex guidance to the color reference as the canonical palette list.
- `docs/reports/2026-11-06/brand-color-decisions-documentation-update.md` — this
  local report.

No other design-system document directly contained an active palette target
that needed correction. Existing audit and decision reports retain their
historical statements.

## Documentation consistency findings

The active addendum in `docs/design-system/color.md` now lists all five
approved primitives. Its active semantic table remains separate. The current
color inventory and Status System still describe production behavior and
legacy-owned styling rather than treating the approved brand palette as a
runtime implementation.

`.codex/rules/10-styling.md` now directs Codex to that canonical list and
explicitly keeps brand primitives distinct from semantic and interaction
colors. It retains the unresolved focus replacement, canonical runtime token
owner, DS-02 Scheme Sync scope, DS-05 StatusBadge accent scope, and
legacy-compatibility requirements.

Searches for `#2B479E` and `#FFD200` found no active replacement values in the
Codex styling rule. Remaining references are historical/superseded content in
the color reference and dated reports, plus `#2B479E` in the separate DS-05
StatusBadge accent proposal. The latter is component-specific and remains
unresolved; it is not the current `brand.secondary` value. Those records were
left intact to preserve decision history.

## Preserved semantic and runtime boundaries

The color reference explicitly states that brand red is not automatically
`feedback.error`; orange is not automatically `feedback.warning`; yellow and
Sun are not automatically warning colors; and Cobalt is not automatically
`feedback.info`. Brand primitives do not determine shared link, focus, hover,
active, selected, or disabled colors. `brand.sun` has no approved semantic UI
role.

Current source still defines `--primary-color: #dc2626` at
`src/index.scss:7`. `src/providers/index.tsx:24-28,45-48` configures the Ant
Design font token and locale but no color tokens. Accordingly,
`brand.primary #DB1F26` is an approved reference value, not a claim of runtime
migration. Existing aliases, shared components, feature-owned styles, and
Scheme Sync behavior remain unchanged. This documentation update is not
accessibility remediation and does not claim WCAG conformance.

## Remaining NEEDS-TEAM-DECISION items

- Physical owner of canonical runtime color tokens and implementation sequence.
- Focus and component interaction colors, including hover, active, selected,
  and disabled states.
- Shared link, action, and navigation semantics.
- StatusBadge accent/error visual separation and the remaining DS-05 consumer
  questions.
- Scheme Sync DS-02 behavior, action mapping, and scope.
- Any semantic UI role for `brand.sun`.

These decisions were not resolved by approval of the five brand primitives.

## Validation results

- Re-read the modified color reference and Codex styling rule after editing.
- Verified all five approved HEX values and their intended roles in the active
  palette table.
- Checked the relevant design-system documents and Codex styling guidance for
  consistency; no semantic or Ant Design token mappings were introduced.
- Searched relevant design-system, audit, and dated report content for
  `#2B479E` and `#FFD200`; remaining occurrences are identified above as
  historical or a separate unresolved component proposal.
- Verified current runtime evidence directly in `src/index.scss` and
  `src/providers/index.tsx`.
- Confirmed `docs/` and `.codex/` paths are ignored/local-only under existing
  `.gitignore` rules. No ignore rules were changed and no files were force-
  tracked.
- No application/runtime files were modified. No application build, lint,
  typecheck, or browser tests were run; they are outside this documentation-
  only task.

## Risks and unverified assumptions

The approved values are treated as the HDS Admin brand reference based on the
explicit approval supplied for this task; no external brand asset or company-
wide standards source was independently verified. Historical reports contain
older approval states by design and may appear in broad text searches. No
runtime appearance, contrast, accessibility behavior, or migration completeness
was tested or changed.

**Application runtime was not changed.**
