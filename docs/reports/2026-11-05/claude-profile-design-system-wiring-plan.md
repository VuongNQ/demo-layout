# Claude Profile Design-System Wiring — Plan

- Date: 2026-11-05 (Asia/Ho_Chi_Minh).
- Branch: `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung`.
- Scope: documentation-only PLAN. No `src/` or `docs/` file was edited by this
  task. This report records proposed text/diffs for review, output using the
  `codebase-analyzer` 16-section contract (`.claude/agents/codebase-analyzer.md`
  `# Output`).

## 1. Module Responsibility

Not applicable in the usual sense — the "module" under analysis is the
`.claude/` Claude Code profile itself (rules, agents, skills, `CLAUDE.md`) and
its relationship to `docs/design-system/*`, a Codex-facing reference. The
responsibility in question: should Claude Code sessions consult
`docs/design-system/*` for color/typography/status consistency, and if so,
where does that requirement get wired in.

## 2. Entry Points / Routes

Not applicable (no routes). The functional "entry points" are the required-
reading lists that gate every Claude Code task:
`CLAUDE.md` -> `.claude/PROJECT_CONTEXT.md`/`ARCHITECTURE.md` ->
`.claude/rules/*.md` -> `.agents/*.md` brief -> module docs; and, per agent,
`.claude/agents/{codebase-analyzer,feature-implementer,frontend-reviewer}.md`
`# Mandatory context`; and, per skill,
`.claude/skills/{implement-feature,fix-bug,review-code,analyze-module,
trace-feature-flow}/SKILL.md` "Source of truth" / "Inputs and context" /
"Context and evidence" sections.

## 3. Directory Map

```text
docs/design-system/
  README.md       Codex-facing index; links AGENTS.md, .codex/knowledge/*, .codex/rules/*
  patterns.md
  components.md
  layouts.md
  color.md         contains NEEDS-TEAM-DECISION: dark theme scope, brand-vs-semantic split
  typography.md    contains NEEDS-TEAM-DECISION: cross-app scale, feature-local exceptions
  status.md        contains NEEDS-TEAM-DECISION: StatusBadge error-vs-accent parity, legacy pill treatment

.claude/
  rules/00-general.md       "## Existing UI reuse checkpoint" (component/AntD/SCSS ladder)
  rules/07-component.md     "## Ant Design first" (component reuse ladder, MUST wording)
  rules/10-styling.md       "## Tokens and Ant Design" (token/override rules)
  agents/codebase-analyzer.md   "# Mandatory context", "# Classification" (styling classification)
  agents/feature-implementer.md "# Mandatory context before implementation", "# Forms and components"
  agents/frontend-reviewer.md   "# Mandatory context", "# Component and shared-code review", "# Finding severity"
  skills/implement-feature/SKILL.md  "## Source of truth and shared boundaries"
  skills/fix-bug/SKILL.md            "## Context and evidence"
  skills/review-code/SKILL.md        "## Inputs and context"
  skills/analyze-module/SKILL.md     "## Inputs and context"
  skills/trace-feature-flow/SKILL.md "## Inputs" / "## Context and evidence"
```

## 4. Main Runtime Flows

Not applicable (no application runtime). The relevant "flow" is the task-time
reading sequence every agent/skill already enforces, into which this plan
proposes inserting design-system pages as additional required reading, and the
review-time flow (`frontend-reviewer` finding emission) into which this plan
proposes inserting a new finding category.

## 5. State Ownership

Not applicable to application state. Document ownership today:
`docs/design-system/*` is owned by the Codex profile (its README explicitly
names `AGENTS.md`, `.codex/knowledge/PROJECT_CONTEXT.md`,
`.codex/knowledge/ARCHITECTURE.md`, `.codex/rules/*` as source of truth).
`.claude/rules/00-general.md`, `07-component.md`, `10-styling.md`,
`.claude/agents/*.md`, and the five `.claude/skills/*/SKILL.md` files are
owned by the Claude profile and currently make zero reference to
`docs/design-system/*`.

## 6. API Boundaries

Not applicable.

## 7. Forms / Validation

Not applicable.

## 8. Type / DTO Organization

Not applicable.

## 9. Permissions

Not applicable.

## 10. Shared and Cross-domain Dependencies

The dependency in question is cross-**profile**, not cross-domain: whether the
Claude profile depends on (reads) a document tree currently declared to belong
to the Codex profile. This is the central open question this plan surfaces
under §16/§17 rather than resolving.

## 11. Consumers

Potential consumers of a wired-in design-system reference, if adopted:
`feature-implementer` (new/touched UI), `frontend-reviewer` (new finding
category), `codebase-analyzer` (styling classification extension),
`implement-feature`/`fix-bug` skills (styling paragraphs), `review-code` skill
(styling-finding guidance), and indirectly every future feature/bugfix task
that introduces UI.

## 12. Pattern Classification

- `target-compatible`: the existing reuse-ladder pattern in
  `.claude/rules/07-component.md` `## Ant Design first` (MUST-check-before-
  introducing, state-reason-if-not-used, LOW/INFO-by-default severity escalating
  on measurable loss) is the established template this plan's new "visual
  tokens" step and new reviewer finding category should mirror.
- `legacy-compatible`: `docs/design-system/*`'s current Codex-only framing
  (README source-of-truth links, decision-label vocabulary) is a working,
  deliberately scoped artifact from the 2026-11-05 baseline
  (`docs/reports/2026-11-05/design-system-baseline.md`) and
  2026-11-05 relocation (`docs/reports/2026-11-05/codex-knowledge-relocation.md`).
  It should not be silently reassigned.
- `uncertain`: whether `.claude/` may cite `docs/design-system/*` directly, or
  whether a profile-agnostic duplicate/rewrite is required first, given the
  unresolved profile-authority question below.

## 13. Technical Risks

- Wiring Claude agents/skills to read a document whose own header says "This
  Codex-facing reference" risks confusing scope ownership (an agent citing a
  doc that disclaims applicability to it) unless the cross-reference is
  explicit about what is being borrowed (facts/evidence) versus what is not
  (the Codex-specific source-of-truth chain in that README).
- The six pages carry five explicit open `NEEDS-TEAM-DECISION` items (dark
  theme scope, brand-vs-semantic color split, scheme-sync token exception,
  `StatusBadge` error-vs-accent parity, legacy status pill treatment). Any
  wiring that implies these are settled would misrepresent current status.
- Adding a new mandatory-reading page to every agent/skill increases the
  context every task must load; this is a cost even when the task touches no
  color/typography/status surface at all, unless the reading requirement is
  scoped to "when the task introduces or changes visual/status UI."

## 14. Safe Extension Points

- A profile-agnostic cross-link (Option A below) that treats
  `docs/design-system/{color,typography,status}.md` purely as **evidence**
  (current token/variant inventory, source anchors) rather than as a
  Codex-authority document is the lowest-risk extension point: it adds a
  reuse-ladder step without asserting Claude-profile ownership of the Codex
  README's decision-label governance.
- The new reviewer finding category and the new `## Ant Design first`-style
  rule step are additive paragraphs in files Claude already owns
  (`.claude/rules/*.md`, `.claude/agents/*.md`, `.claude/skills/*/SKILL.md`);
  none require touching `docs/design-system/*` itself.

## 15. Areas To Avoid Touching

- Do not edit `docs/design-system/README.md`'s "Ownership and boundaries" or
  "source of truth" wording as part of this task — that is the open
  profile-authority question, `NEEDS-TEAM-DECISION`.
- Do not resolve any of the five open `NEEDS-TEAM-DECISION` items listed in
  `color.md`, `typography.md`, `status.md`.
- Do not perform a repository-wide token/color-literal/status-renderer
  migration; the proposed rule step is scoped to new/touched code only, same
  compatibility principle as `## Ant Design first`.
- Do not change `.codex/` or `AGENTS.md` — out of scope (Codex profile).

## 16. Recommended Change Boundary

If approved, the change boundary is: additive paragraphs/sections in
`CLAUDE.md`, `.claude/rules/00-general.md`, `.claude/rules/10-styling.md`,
the three `.claude/agents/*.md` files, and the five named
`.claude/skills/*/SKILL.md` files. No new files, no `docs/design-system/*`
edits, no `src/` edits. Each proposed insertion point is given below with
exact anchor text copied from current source.

### A. NEEDS-TEAM-DECISION: duplicate/adapt vs. leave Codex-only

Two options, not chosen here:

- **Option A — profile-agnostic cross-link (lower cost, some ambiguity risk).**
  Add a short "Design system reference" paragraph to `CLAUDE.md` and the
  affected `.claude/rules/*.md`/`.claude/agents/*.md`/`.claude/skills/*.md`
  files that cites `docs/design-system/{color,typography,status}.md` directly,
  explicitly framed as: "read these pages for the current color
  token/typography/`StatusBadge` variant inventory and cited source evidence;
  their README's Codex-specific source-of-truth chain and decision-label
  governance do not apply to Claude Code sessions — treat the labeled claims
  (`CONFIRMED CURRENT IMPLEMENTATION`, `NEEDS-TEAM-DECISION`, etc.) at face
  value." Tradeoff: zero duplication/drift risk, fastest to ship, but every
  Claude reader must mentally subtract the Codex-only "Ownership and
  boundaries" paragraph each time, and a future Codex-only rewrite of those
  pages could silently break the Claude-side citation's assumptions.
- **Option B — duplicate/adapt as a `.claude`-facing set.** Create parallel
  pages (e.g. `docs/design-system/color.md` content mirrored into a new
  `.claude`-scoped location, or the existing pages rewritten to be profile-
  agnostic with both `AGENTS.md`/`.codex/` and `CLAUDE.md`/`.claude/` cited as
  consumers). Tradeoff: clean ownership, no cross-profile ambiguity, but two
  copies (or one profile-agnostic copy plus a migration of the Codex
  references) must be kept in sync, and the five open
  `NEEDS-TEAM-DECISION` items would need to be decided once, not per-profile-
  copy, which the rewrite itself cannot resolve.

This plan does not choose between A and B. It is listed first in §17 below as
the decision every other proposed insertion in this section depends on. The
concrete insertion points below are written assuming Option A (direct
cross-link) purely to give the reviewing team literal text to react to; if
Option B is chosen instead, every `docs/design-system/...` path below is
replaced with whatever new path Option B produces, and the "do not apply"
caveat sentence is dropped since the rewritten pages would already be Claude-
scoped.

### B. Required-reading insertion points (if wiring is approved)

1. **`CLAUDE.md`**, in "Before changing code, read the matching brief when it
   exists in the checkout" list (the bulleted list currently ending with the
   i18n line): add one bullet —
   ```
   - color, typography, or status-display UI (new color/typography value, or
     a status badge/label/renderer): `docs/design-system/color.md`,
     `docs/design-system/typography.md`, `docs/design-system/status.md` for
     the current token/variant inventory (see the caveat in
     `.claude/rules/00-general.md` `## Existing UI reuse checkpoint`)
   ```
2. **`.claude/rules/00-general.md`**, "## Before modifying code", step 3
   ("Read every `.claude/rules/*.md` file relevant to the task.") — no change
   needed there; instead extend "## Existing UI reuse checkpoint" (the five-
   step list) with a new step 1a immediately after its current step 1 (the
   Ant-Design-version check), proposed text:
   ```
   1a. When the UI involves a color, typography value, or a status display,
       check `docs/design-system/color.md`, `typography.md`, or `status.md`
       for an existing semantic token or `StatusBadge` variant before adding a
       new one. These pages are Codex-authored evidence pages; their
       Codex-specific "Ownership and boundaries" section does not apply here
       — read only the cited token/variant facts and current-source anchors.
   ```
3. **`.claude/rules/10-styling.md`**, "## Tokens and Ant Design" — append one
   bullet after the existing "Avoid repeated hardcoded colors, spacing,
   typography, and border radii when an appropriate token or meaningful shared
   constant exists." line:
   ```
   - Before introducing a new color or typography literal, check
     `docs/design-system/color.md` and `typography.md` for an existing
     semantic token/scale value; if none fits, state why in the task notes
     (mirror `.claude/rules/07-component.md` `## Ant Design first` MUST
     wording).
   ```
4. **`.claude/agents/codebase-analyzer.md`**, "# Mandatory context", append to
   the numbered list (currently ending at item 6, module docs) as item 7, or
   fold into the existing styling-classification paragraph in
   "# Classification": add one sentence after "Existing Emotion, inline
   styles, global SCSS, or other styling contracts... are `legacy-compatible`":
   ```
   When classifying a new color, typography, or status-display choice, check
   it against `docs/design-system/{color,typography,status}.md`'s recorded
   token/variant inventory before calling it a smell or a reuse opportunity;
   treat a literal that matches no recorded token as `uncertain` rather than
   automatically `legacy-compatible`.
   ```
5. **`.claude/agents/feature-implementer.md`**, "# Mandatory context before
   implementation", add item 7 to the numbered list: "for new/changed UI
   introducing a color, typography value, or status display, read
   `docs/design-system/{color,typography,status}.md`'s current inventory
   (see the Codex-caveat in `.claude/rules/00-general.md`)." Mirror into
   "# Forms and components" styling paragraph, right after the existing "Keep
   Ant Design tokens/APIs for theme/runtime semantics" sentence:
   ```
   Before adding a new color or typography value, check
   `docs/design-system/color.md`/`typography.md` for an existing token; state
   the reason in the implementation summary when none fits, same as the
   `## Ant Design first` MUST wording in `.claude/rules/07-component.md`.
   ```
6. **`.claude/agents/frontend-reviewer.md`**, "# Component and shared-code
   review" — add a new paragraph immediately after the existing "Ant Design
   first" finding paragraph ("Flag new or changed UI in the diff that
   re-implements a capability the installed Ant Design version already
   provides..."), modeled on it:
   ```
   Flag new or changed UI in the diff that introduces a color or typography
   literal, or a status renderer that bypasses `StatusBadge`, where
   `docs/design-system/color.md`, `typography.md`, or `status.md` records an
   existing semantic token or variant that would fit. Name the specific token
   or variant. This is a non-blocking (`LOW` or `INFO`) finding by default;
   escalate to `MEDIUM` or higher only when the bypass measurably loses
   theme-consistency behavior the token/variant already provides (e.g.
   diverging from an existing status color meaning). Pre-existing custom
   color/typography/status UI outside the diff is NOT a finding under this
   check.
   ```
   Also add one line to "# Mandatory context" numbered list: "6. for a
   change touching color, typography, or status display,
   `docs/design-system/{color,typography,status}.md`'s current inventory."
7. **`.claude/skills/implement-feature/SKILL.md`**, "## Source of truth and
   shared boundaries" — append one sentence after the existing module-
   documentation sentence:
   ```
   For new/changed UI introducing a color, typography value, or status
   display, also require `docs/design-system/{color,typography,status}.md`.
   ```
8. **`.claude/skills/fix-bug/SKILL.md`**, "## Context and evidence" — same
   append, scoped to "when the fix touches color/typography/status display".
9. **`.claude/skills/review-code/SKILL.md`**, "## Inputs and context" — same
   append, framed as reviewer evidence rather than implementation evidence.
10. **`.claude/skills/analyze-module/SKILL.md`**, "## Inputs and context" —
    same append, scoped to modules with visible UI/status surfaces.
11. **`.claude/skills/trace-feature-flow/SKILL.md`**, "## Context and
    evidence" — same append, scoped to a traced symptom that is visually
    color/typography/status-related.

Every insertion above is additive text; none restructures an existing
section, renumbers an existing list beyond appending one item, or removes
existing wording.

## 17. Open Questions

Carried into §18 verbatim as the authoritative `NEEDS-TEAM-DECISION` list.

## 18. NEEDS-TEAM-DECISION

1. **Duplicate/adapt `docs/design-system/*` as a `.claude`-facing set, or
   leave it Codex-only and cross-link directly (Option A vs. Option B,
   §16.A).** This plan does not choose; every other insertion point in §16.B
   is written against Option A only to give reviewers concrete text, and must
   be redone if Option B is chosen.
2. **Profile authority between `.claude`/`CLAUDE.md` (Claude Code) and
   `.codex`/`AGENTS.md` (Codex) remains unresolved as of 2026-11-05.** Both
   `docs/reports/2026-11-05/codex-knowledge-relocation.md` ("policy-source
   authority remains unresolved") and
   `docs/reports/2026-11-05/design-system-baseline.md` ("Long-term
   authority/relationship between `.claude/` and `.codex/`... Neither was
   synchronized") record this as open. Wiring Claude agents to a Codex-labeled
   reference is a visible instance of this larger unresolved question, not a
   new one this plan introduces.
3. **Dark theme scope** (`docs/design-system/color.md` open item) — unresolved
   upstream; not addressed by this plan.
4. **Brand-vs-semantic color role split** (`color.md` open item) — unresolved
   upstream; not addressed by this plan.
5. **Scheme-sync local token exception** (`color.md`/`typography.md` open
   item, re: `src/modules/products/configuration/scheme-sync/`) — unresolved
   upstream; not addressed by this plan.
6. **`StatusBadge` error-vs-accent parity** (`status.md` open item) —
   unresolved upstream; not addressed by this plan.
7. **Legacy status pill treatment** (`status.md` open item, re: retained
   legacy status renderers alongside `StatusBadge`) — unresolved upstream; not
   addressed by this plan.

## Explicit non-authorization statement

This plan does not authorize: any `src/` change; any repository-wide color,
typography, or status-renderer migration; resolving any of the seven
`NEEDS-TEAM-DECISION` items above; or editing `docs/design-system/*` itself.
If approved, the scope is limited to the additive `.claude/`/`CLAUDE.md`
paragraphs in §16.B, applicable to new/touched code only — the same
compatibility principle already governing `## Ant Design first`
(`.claude/rules/07-component.md`) and the SCSS Modules target
(`.claude/rules/10-styling.md`).
