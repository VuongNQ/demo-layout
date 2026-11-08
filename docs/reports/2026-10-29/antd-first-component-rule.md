# Ant Design First Component Rule — Changelog

## 1. Scope and request

Add an "Ant Design first" rule to the Claude Code profile so that new UI work
must check whether Ant Design already provides the component or API before
writing custom UI. Documentation-only change, limited to:
`.claude/rules/07-component.md`, `.claude/rules/00-general.md`,
`.claude/rules/10-styling.md`, `.claude/agents/frontend-reviewer.md`,
`CLAUDE.md`, and this report. No `src/` file was touched, no component was
refactored or migrated, and nothing was committed or staged.

## 2. Revision and branch

- Revision: `9284dc97` (short SHA, `git rev-parse --short HEAD`)
- Branch: `fĩxbug/vuongnq` (`git branch --show-current`; the mojibake is the
  literal branch name as reported by git in this checkout)
- Date: 2026-10-29

## 3. Installed Ant Design version

From `package.json` (`grep -n '"antd"' package.json`):

```
"antd": "^5.20.6",
```

Every component and API named in the new rule text (`Modal.confirm`,
`Popconfirm`, `Upload`, `Upload.Dragger`, `DatePicker`, `RangePicker`,
`InputNumber`, `Table` row/pagination/sort props, `Form.List`, `Skeleton`,
`Spin`, `Empty`, `Result`, `message`, `notification`, `Tooltip`, `Popover`,
`Descriptions`, `Drawer`, `Select`, `Row`/`Col`) is a stable Ant Design 5
component or namespace member and has been present since early 5.x; no prop
name was cited, only component/API names, per the task's verification
constraint.

## 4. Verification evidence

Commands run (all read-only, from the repository root):

```
grep -n '"antd"' package.json
git rev-parse --short HEAD
git branch --show-current
grep -rln '<pattern>' src --include='*.tsx' --include='*.ts' | wc -l
grep -rln '<pattern>' src --include='*.tsx' --include='*.ts' | head -1
grep -rn "UploadFileComp" src/ | head -20
grep -n "^#\|^##" .claude/rules/07-component.md .claude/rules/00-general.md
```

Counts and one example path per pattern (file counts, not occurrence counts):

| Pattern | Files | Example path |
|---|---|---|
| `Modal.confirm` | 9 | `src/modules/products/configuration/cash-loan/components/CashLoanQuickEdit.tsx` |
| `Popconfirm` | 0 | — (available in installed version; not yet used) |
| `Upload` (bare) | 90 | `src/types/product-list.d.ts` (type-only hit; see below) |
| `Upload.Dragger` | 0 | — (available in installed version; not yet used) |
| `DatePicker` | 55 | `src/components/date-picker.tsx` |
| `RangePicker` | 3 | `src/components/forms/search/notification-list-searcher.form.tsx` |
| `InputNumber` | 14 | `src/components/select-product-modal/SelectProductModalContent.tsx` |
| `Descriptions` | 2 | `src/modules/products/configuration/scheme-sync/scheme-detail-modal.tsx` |
| `Collapse` | 12 | `src/components/menus.tsx` |
| `Empty` (word-boundary) | 10 | `src/components/menus.tsx` |
| `Result` (word-boundary) | 1 | `src/modules/products/configuration/product-labels/ProductLabelsRouteGate.tsx` |
| `Tooltip` | 41 | `src/components/switch.tsx` |
| `Popover` | 3 | `src/modules/products/configuration/scheme-sync/sync-schedule-config.tsx` |
| `Drawer` | 19 | `src/components/product-configuration/shared/history/history-comparison-drawer.tsx` |
| `Skeleton` | 18 | `src/modules/products/configuration/display-information-set/views/view/general.tsx` |
| `notification.` | 141 | `src/providers/notification.provider.tsx` |
| `message.` | 219 | `src/types/common.d.ts` (type-only hit; see below) |
| `Form.List` | 0 | — (available in installed version; not yet used) |
| `TreeSelect` | 22 | `src/components/product-configuration/card-marketing-fields.tsx` |
| `Transfer` | 0 | — |
| `Segmented` | 1 | (path not captured; single-file hit) |
| `Steps` (word-boundary) | 1 | (path not captured; single-file hit) |

Shared upload wrapper (`grep -rn "UploadFileComp" src/`): confirmed to exist
at `src/components/upload/index.tsx` (`export default function
UploadFileComp`), with at least 9 consumers found in the first 20 matches,
including `src/modules/contents/popup/components/PopupGeneral.tsx`,
`src/modules/contents/banner/edit/general.tsx`, and
`src/modules/products/configuration/cash-loan/edit/general-info.tsx`. Cited in
the new rule text because grep confirmed it. `src/components/date-picker.tsx`
was independently confirmed as a file (55-file `DatePicker` hit list) and is
also cited as a wrapper example.

Section headings recorded before editing
(`grep -n "^#\|^##" .claude/rules/07-component.md .claude/rules/00-general.md`):

- `07-component.md`: `# Component Rules`, `## Categories and placement`,
  `## Rules`, `### Approved Theme Management naming`,
  `## Loading and skeleton states`.
- `00-general.md`: `# General Engineering Rules`, `## Before modifying code`,
  `## While changing code`, `## Comments`, `## Formatting`,
  `## Before finishing`, `## Existing UI reuse checkpoint`.

Distinguishing evidence from inference: the file counts and example paths
above are direct grep output (fact). The claim that `Upload`'s and
`message.`'s top example paths are type-only declaration files, not runtime
usage, is an inference from the file names (`*.d.ts`) and was not separately
confirmed by opening those files; this is noted as unverified in §8.

## 5. Existing rule coverage before this change

- `.claude/rules/00-general.md:106-126` (`## Existing UI reuse checkpoint`)
  already required inspecting `src/components/**` and domain-shared
  directories before implementing UI, but had no explicit first step asking
  whether Ant Design itself already covers the responsibility.
- `.claude/rules/07-component.md:20-52` (`## Rules`) already had the
  "do not create a wrapper that only renames or forwards a shared control"
  bullet (line 48) and the form-primitive reuse-inspection bullet (line 23),
  but nothing instructing a check against Ant Design's own component/API
  surface before those steps.
- `.claude/rules/05-form.md:59-74` (`## Shared Form UI Reuse`) already named
  specific shared controls (`Input`, `Select`, `Switch`, `DatePicker`,
  `SuffixInput`, `UploadFileComp`, etc.) to check before creating form UI, but
  is scoped to form controls, not general UI behavior (dialogs, tables,
  feedback, etc.).
- `.claude/rules/10-styling.md:182-203` (`## Tokens and Ant Design`) already
  said to minimize deep `.ant-*` overrides and prefer tokens/APIs, but did not
  state the inverse: don't rebuild an Ant Design component's visuals/behavior
  with SCSS and custom markup in the first place.
- `.claude/agents/frontend-reviewer.md` `# Component and shared-code review`
  (around line 408-423) had no check for custom UI duplicating an available
  Ant Design capability.

## 6. Files changed

### `.claude/rules/07-component.md`

Inserted bullet in `## Rules`, before the form-primitive bullet:

```
- New single-feature components do not go into `src/components`. The reuse
  ladder starts with Ant Design itself; see `## Ant Design first` below
  before continuing to the checks in this section.
```

Inserted new section `## Ant Design first`, immediately before
`## Loading and skeleton states`:

```
## Ant Design first

Applies to new UI, newly extracted UI, and UI the approved task already
changes. It does not require replacing existing custom UI that predates this
rule; that is a refactor subject to `.claude/rules/08-refactoring.md`'s scope
controls, never repository-wide cleanup.

- **MUST:** Before implementing any new UI behavior, check whether the
  installed Ant Design version (`^5.20.6`) already provides it as a component
  or as a prop/API of a component already in use. Prefer the supported Ant
  Design API over custom markup, custom state, or a hand-rolled equivalent.
- Follow the reuse ladder in this order:
  1. a supported Ant Design component or API;
  2. an existing shared component in `src/components/**` or a domain-shared
     directory that already wraps Ant Design (see the
     `## Existing UI reuse checkpoint` in `.claude/rules/00-general.md`), for
     example `src/components/upload/index.tsx` (`UploadFileComp`) or
     `src/components/date-picker.tsx`;
  3. a custom component, only when (1) and (2) do not fit.
- Examples of behavior that must not be re-implemented by hand, phrased as
  "use X rather than a custom Y" (non-exhaustive): confirmation dialogs
  (`Modal.confirm` / `Popconfirm`), file selection and upload (`Upload`,
  `Upload.Dragger`), date and date-range input (`DatePicker`, `RangePicker`),
  numeric input and formatting (`InputNumber`), table pagination, sorting, row
  selection and expandable rows (`Table` props rather than custom controls),
  dynamic repeated form rows (`Form.List`), loading placeholders (`Skeleton`,
  `Spin`), empty and error states (`Empty`, `Result`), transient feedback
  (`message`, `notification`), hover help text (`Tooltip`, `Popover`),
  key-value read-only display (`Descriptions`), side panels (`Drawer`),
  searchable or tagged selection (`Select`), and layout columns (`Row`/`Col`)
  rather than an ad-hoc flex grid.
- **MUST:** When custom UI is written instead of the Ant Design equivalent,
  state the reason in the task notes. Valid reasons: the required product
  behavior conflicts with the component's behavior, the component lacks a
  needed capability in the installed version, matching the required design
  would need deep `.ant-*` overrides coupled to Ant Design internal DOM (see
  `.claude/rules/10-styling.md`), or a measured performance problem. "Easier
  to write from scratch", "fewer props", or visual preference alone are not
  valid reasons.
- This does not authorize wrapping an Ant Design component only to rename or
  forward it: the "do not create a wrapper that only renames or forwards a
  shared control" bullet in `## Rules` above still applies. A wrapper is
  justified only when it adds stable domain behavior, an adapter, or
  materially different interaction semantics.
- Form controls stay under `.claude/rules/05-form.md`: Ant Design
  `Form`/`FormInstance` remains the sole form-state owner, and reuse happens
  at the form boundary.
```

### `.claude/rules/00-general.md`

In `## Existing UI reuse checkpoint`, inserted a new step 1 and renumbered the
rest, and extended the closing paragraph:

```
1. Check whether the installed Ant Design version already provides the
   required responsibility as a component or as a prop/API of a component
   already in use. See `.claude/rules/07-component.md` `## Ant Design first`.
2. Inspect `src/components/**` and relevant domain-shared component directories
   for the required responsibility.
3. Inspect candidate props, value and `onChange` contracts, disabled/read-only
   behavior, validation, formatting/loading behavior, service and form-library
   dependencies, domain semantics, and consumers.
4. Reuse a compatible existing component. If only form-library integration
   differs, adapt it at the form boundary rather than duplicating its UI.
5. Create a new component only when an existing component's behavior or
   semantics do not fit; state what was checked, why it is insufficient, and
   the new component's responsibility, owner, and expected consumers.

This is a compatibility-aware reuse rule. It does not require use of every
component in `src/components`, migration of an existing form, or replacement
of untouched legacy controls. It likewise does not require replacing existing
custom UI that predates the Ant Design first rule in
`.claude/rules/07-component.md`.
```

### `.claude/rules/10-styling.md`

In `## Tokens and Ant Design`, appended one bullet:

```
- Do not reproduce an Ant Design component's visuals or interaction with SCSS
  and custom markup when the component itself, or a supported token/component
  API, already provides it. See `.claude/rules/07-component.md`
  `## Ant Design first`.
```

### `.claude/agents/frontend-reviewer.md`

In `# Component and shared-code review`, appended one paragraph after the
existing "Flag new single-feature components..." paragraph:

```
Flag new or changed UI in the diff that re-implements a capability the
installed Ant Design version already provides as a component or prop/API (see
`.claude/rules/07-component.md` `## Ant Design first`). Name the specific Ant
Design component or API that was available. This is a non-blocking (`LOW` or
`INFO`) finding by default; escalate to `MEDIUM` or higher only when the
custom implementation measurably loses behavior Ant Design already handles,
such as keyboard interaction, focus management, disabled/read-only state,
validation wiring, or theme/token consistency. Pre-existing custom UI outside
the diff is NOT a finding under this check.
```

The 14-section output format was not changed.

### `CLAUDE.md`

Inserted one dated bullet at the end of `## Repository baseline`:

```
- Added 2026-10-29: `.claude/rules/07-component.md` `## Ant Design first`
  requires checking whether the installed Ant Design version already covers
  new UI behavior before writing custom UI; `.claude/rules/00-general.md`
  `## Existing UI reuse checkpoint` now checks Ant Design first in its reuse
  steps.
```

No historical counts or snapshot figures in `CLAUDE.md` were changed.

## 7. Conflicts checked

- **Wrapper-only-renames-or-forwards bullet** (`07-component.md` `## Rules`,
  "Do not create a wrapper that only renames or forwards a shared control"):
  the new section explicitly cross-references this bullet and restates that
  it still applies — Ant Design first governs *whether* to reach for Ant
  Design/shared UI at all, not *whether* a thin wrapper around it is
  justified. No contradiction.
- **Single-use-under-~50-lines bullet** (`07-component.md` `## Rules`,
  "Treat a single-use component under approximately 50 lines as the opposite
  review trigger"): unaffected. Ant Design first is about which underlying
  API/markup to use, not about whether a small single-consumer wrapper
  component should be extracted. A component inlining a `Popconfirm` instead
  of a hand-rolled confirm dialog can still stay inline under that bullet.
- **~200-line trigger** (`07-component.md` `## Rules`, "Treat a component
  approaching or exceeding approximately 200 lines as a review trigger"): no
  interaction. Ant Design first reduces custom markup, which if anything
  shrinks components rather than growing them; no new split requirement was
  added.
- **`LEGACY-COMPATIBILITY` loading rules** (`07-component.md`
  `## Loading and skeleton states`, "Do not migrate existing Redux `loading`
  -> `Spin` sites; they remain `LEGACY-COMPATIBILITY`"): the new section's
  scope limit paragraph explicitly states it applies only to new, newly
  extracted, or task-touched UI and does not require replacing existing
  custom UI, matching the existing loading-states section's
  non-retroactive stance. No contradiction.
- **`05-form.md` form-boundary rule**: the new section explicitly defers form
  controls to `.claude/rules/05-form.md` and states Ant Design
  `Form`/`FormInstance` remains the sole form-state owner, reuse happening at
  the form boundary — matching, not overriding, the existing form rule.

## 8. Items that could not be verified

- Whether `Upload`'s and `message.`'s single-file example path hits
  (`src/types/product-list.d.ts`, `src/types/common.d.ts`) are type-only
  declarations rather than runtime usage was inferred from the `.d.ts`
  extension, not confirmed by opening the files. This does not affect the
  rule text, since those paths were not cited as examples in the published
  rule (only `UploadFileComp` and `date-picker.tsx` were cited, both grep
  confirmed as component implementations).
- `Segmented` and `Steps` matched exactly one file each but the specific path
  was not captured in the recorded grep output (only the count was retained).
  Neither is cited as an example path in the rule text, so this gap does not
  affect the delivered rule.
- No prop-level Ant Design API (e.g., a specific `Table` prop name) was
  verified against the installed `5.20.6` changelog; per the task's
  instruction, the rule text names only components/APIs/namespaces, not
  individual props, to avoid an unverifiable claim.
- `npm run prettier` was not run against the changed files because its script
  (`prettier --check "src/**/(*.tsx|*.ts|*.css|*.scss)"`) only globs `src/**`
  TS/TSX/CSS/SCSS files and does not cover Markdown; running it would have
  checked zero of the files this task touched, so it was skipped rather than
  run uselessly.

## 9. Open follow-ups and NEEDS-TEAM-DECISION

None identified. This was a documentation-only addition that cross-references
existing rules without altering their scope, so no new team decision is
introduced. The pre-existing `promotion-type.service.ts` basename collision
and other open items noted in `CLAUDE.md`'s codebase snapshot are unrelated to
this change and were left untouched.
