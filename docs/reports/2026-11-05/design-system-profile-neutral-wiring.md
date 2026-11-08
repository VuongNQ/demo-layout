# Design-System Profile-Neutral Wiring — Execution Report

Output format: `.claude/agents/feature-implementer.md` `# Feature Implementation`
10-section contract.

## 1. Task

Apply two documentation/profile-only changes together: (Part 1) neutralize
Codex-only platform framing in `docs/design-system/*.md` so the pages read as
shared evidence for both the Claude Code and Codex profiles, without
rewriting facts, source citations, or decision labels; and (Part 2) apply the
11 required-reading insertion points from
`docs/reports/2026-11-05/claude-profile-design-system-wiring-plan.md` section
16.B into the Claude profile (`CLAUDE.md`, three `.claude/rules/*.md`/
`.claude/agents/*.md` files, five `.claude/skills/*/SKILL.md` files), dropping
the plan's now-obsolete Codex-caveat sentences. Governing policy: `docs/` is a
shared asset owned by neither profile; no file is attributed to "Claude" or
"Codex" as author; `.codex/` and `AGENTS.md` are out of scope and untouched;
`.claude/agents/`, `.claude/skills/`, `.claude/rules/` are not synced to
`.codex/` content.

## 2. Risk

**SAFE — documentation-only.** No `src/` file was created, edited, or
touched. No runtime, route, permission, API, or component behavior changed.

## 3. Change Boundary

Thirteen files edited, all under `docs/design-system/` (7 files, Part 1) and
the Claude profile (`CLAUDE.md` + 5 `.claude/rules|agents|skills` files
named in the plan's 11 insertion points, Part 2). `.codex/`, `AGENTS.md`, and
every `src/` file are untouched. No new file created; no file deleted.

## 4. Architecture Decisions

No architecture decision was made. This task executed a previously planned,
reviewed insertion list (§16.B of the cited plan) with one adjustment
(dropping the Codex-caveat sentences, per instruction) and a wording-
neutrality pass over `docs/design-system/*.md` that preserves every existing
decision label (`APPROVED DECISION`, `CONFIRMED CURRENT IMPLEMENTATION`,
`ADOPTED TARGET`, `CANDIDATE`, `LEGACY-COMPATIBILITY`, `NEEDS-TEAM-DECISION`,
`NOT VERIFIED`), source citation, and token/variant value exactly as they
were.

## 5. Preserved Contracts

- Every cited source-code line range in `docs/design-system/*.md` is
  unchanged.
- Every decision label is unchanged; the one new `NEEDS-TEAM-DECISION` bullet
  added to `patterns.md` is additive (see §10), not a resolution of an
  existing one.
- No `.codex/` or `AGENTS.md` file was read for editing purposes beyond the
  diff checks required to confirm neutrality was safe; none was written.
- No `.claude/agents/`, `.claude/skills/`, or `.claude/rules/` content was
  synced from `.codex/` equivalents; only additive paragraphs modeled on the
  existing `## Ant Design first` pattern were inserted.
- No authorship/attribution line was added anywhere.

## 6. Implementation Summary

### Part 1 — `docs/design-system/*.md` (7 files)

- **`README.md`**: opening sentence rewritten from "This Codex-facing
  reference..." to a profile-neutral sentence naming both the Claude Code
  and Codex profiles; `ADOPTED TARGET` label definition changed
  "Codex-generated future UI" -> "new or substantially changed UI"; the
  "Ownership and boundaries" paragraph rewritten to state `CLAUDE.md`/
  `.claude/` and `AGENTS.md`/`.codex/` each own their own profile's entry
  point/rules and that this reference is shared by both, not owned by
  either; added the parallel Claude entry-point sentence
  (`CLAUDE.md`/`.claude/PROJECT_CONTEXT.md`/`.claude/ARCHITECTURE.md`/
  `.claude/rules/`) next to the existing Codex one; heading "Accessibility
  review for future Codex-generated UI" -> "...for new or substantially
  changed UI"; compatibility-boundary sentence dropped "Codex-generated".
- **`patterns.md`**: the `.codex/rules/00-general.md`, `.codex/rules/05-form.md`,
  `.codex/rules/07-component.md` (two citations), and `.codex/rules/10-styling.md`
  + `.codex/knowledge/ARCHITECTURE.md` links now cite the matching
  `.claude/rules/*.md` / `.claude/ARCHITECTURE.md` path side by side with the
  existing `.codex/` path at each anchor; the "APPROVED DECISION" bullet
  about Codex-only guidance ownership rewritten to state both profiles' own
  ownership and that this page cites both side by side; one new
  `NEEDS-TEAM-DECISION` bullet added (see §10).
- **`components.md`**: "The Codex component rule..." -> "The component
  rule..."; its citation and two further `.codex/rules/07-component.md`
  citations now also cite `.claude/rules/07-component.md`; "future
  Codex-generated components" -> "new or substantially changed components".
- **`layouts.md`**: the `.codex/rules/05-form.md#layout-boundary` and
  `.codex/rules/07-component.md#categories-and-placement` citations now also
  cite the matching `.claude/rules/*.md` paths.
- **`color.md`**: "Codex-generated UI uses distinct semantic roles" -> "New
  or substantially changed UI uses distinct semantic roles"; "New
  Codex-generated UI assigns colors..." -> "New or substantially changed
  UI..."; its `.codex/rules/10-styling.md#tokens-and-ant-design` citation now
  also cites `.claude/rules/10-styling.md#tokens-and-ant-design`; "future
  Codex-generated UI" (accessibility paragraph) -> "new or substantially
  changed UI".
- **`typography.md`**: "Future Codex-generated UI follows..." -> "New or
  substantially changed UI follows..."; the bare `.codex/rules/10-styling.md`
  citation now also cites `.claude/rules/10-styling.md`; "It is a Codex
  target proposal" -> "It is a target proposal".
- **`status.md`**: the `.codex/rules/07-component.md#rules` citation now also
  cites `.claude/rules/07-component.md#rules`.

No file's cited source-code line ranges, token/variant tables, or decision
labels were changed beyond the wording substitutions listed above.

### Part 2 — 11 insertion points (Claude profile only)

All 11 anchors from the plan's §16.B were grepped and confirmed present
verbatim before editing (see §7); none had drifted. Each insertion below
dropped the plan's Codex-caveat sentence as instructed.

1. **`CLAUDE.md`**: added one bullet to the "Before changing code, read the
   matching brief" list, after the i18n bullet, pointing to
   `docs/design-system/{color,typography,status}.md`.
2. **`.claude/rules/00-general.md`**: added step `1a` to "## Existing UI
   reuse checkpoint", between steps 1 and 2, directing a token/variant check
   before a new color/typography/status choice.
3. **`.claude/rules/10-styling.md`**: added one bullet to "## Tokens and Ant
   Design" after the hardcoded-values bullet, requiring the same check with
   a task-notes justification when no token fits, modeled on `## Ant Design
   first`'s MUST wording.
4. **`.claude/agents/codebase-analyzer.md`**: added one paragraph to "#
   Classification" after the existing Emotion/legacy-compatible sentence,
   directing the classifier to check the design-system inventory before
   calling a color/typography/status literal a smell, and to default to
   `uncertain` rather than `legacy-compatible` when no token matches.
5. **`.claude/agents/feature-implementer.md`**: added item 7 to "# Mandatory
   context before implementation"'s numbered list, and one paragraph to "#
   Forms and components" after the `className`-forwarding sentence, requiring
   the same check with an implementation-summary justification, modeled on
   `## Ant Design first`.
6. **`.claude/agents/frontend-reviewer.md`**: added item 6 to "# Mandatory
   context"'s numbered list, and one new finding paragraph to "# Component
   and shared-code review" immediately after the existing Ant-Design-first
   finding paragraph, with the same LOW/INFO-by-default, escalate-on-
   measurable-loss severity model and a "pre-existing UI outside the diff is
   NOT a finding" carve-out.
7. **`.claude/skills/implement-feature/SKILL.md`**: appended one sentence to
   "## Source of truth and shared boundaries".
8. **`.claude/skills/fix-bug/SKILL.md`**: appended one sentence to "##
   Context and evidence", scoped to "when the fix touches color, typography,
   or status display".
9. **`.claude/skills/review-code/SKILL.md`**: appended one sentence to "##
   Inputs and context", framed as reviewer evidence.
10. **`.claude/skills/analyze-module/SKILL.md`**: appended one sentence to
    "## Inputs and context", scoped to "a module with a visible UI/status
    surface".
11. **`.claude/skills/trace-feature-flow/SKILL.md`**: inserted one sentence
    into "## Context and evidence", scoped to "when the traced symptom is
    color-, typography-, or status-display-related".

One self-caused error was found and corrected during Part 2: the first edit
to `.claude/agents/codebase-analyzer.md` (insertion 4) duplicated an existing
trailing line ("it is legacy-compatible.") because the inserted paragraph was
placed before text already continuing that sentence. This was caught during
this same editing pass and fixed by removing the duplicate line before any
validation was run; the final file has no duplication (confirmed by reading
the file after the fix).

## 7. Validation Performed

- `grep -n "Codex" docs/design-system/*.md` was run before any edit and
  matched the task's expected hit set (all seven pages).
- Before each of the 11 Part-2 insertions, the exact anchor text quoted in
  the plan was grepped against current source and matched verbatim; no
  anchor had drifted (see §8).
- `grep -rn "Codex-generated\|Codex-facing" docs/design-system/*.md` after
  Part 1: **zero hits**.
- `grep -l "design-system" <each of the 11 target files>`: **all 11** files
  now reference `design-system`.
- `git status --short`: only five pre-existing, already-modified `src/`
  files under `src/modules/products/configuration/scheme-sync/` and
  `src/services/products/scheme-sync.types.ts` appear — none created or
  touched by this task (these were present in the working tree before this
  task started and are unrelated to it). No `.codex/` or `AGENTS.md` entry
  appears. `docs/` is covered by the repository's existing `.gitignore`
  rule, so the `docs/design-system/*.md` and this report do not appear in
  `git status` by design, not because they were skipped.
- `git diff -- CLAUDE.md .claude/` grepped for `generated by`, `claude code`,
  `co-authored`, `anthropic` (case-insensitive): **zero hits** — no
  attribution line was added.

## 8. Runtime Validation Gaps

No browser, build, lint, or typecheck validation applies: no `src/` file was
touched, so `npm run typecheck`/`lint`/`build` would exercise nothing changed
by this task. No anchor drift occurred in Part 2, so there is nothing to
report under that heading beyond the confirmation in §7.

## 9. Test Debt

None introduced. This is a documentation/profile-wiring change with no test
surface.

## 10. Reviewer Attention

- **NEEDS-TEAM-DECISION (new, raised in `docs/design-system/patterns.md`
  "## Confirmed decisions and open items"):** `.codex/rules/10-styling.md`
  has an additional `## Design-system decisions for new Codex UI` section
  (confirmed present by diff against `.claude/rules/10-styling.md`, which has
  no equivalent section) that is not mirrored in the Claude profile's
  `10-styling.md`. This divergence was deliberately not resolved — the task
  cites both rule files side by side wherever an anchor exists in both, and
  flags this one structural gap instead of silently picking a side, per the
  task's explicit instruction. No other wording divergence was found between
  cited `.claude/rules/*.md` and `.codex/rules/*.md` anchor pairs during this
  task's diffing (`07-component.md` "## Rules" and "## Categories and
  placement", `10-styling.md` "## Tokens and Ant Design", and `05-form.md`
  "## Layout boundary" differ only in each file's self-referencing path, not
  in substance).
- The seven `NEEDS-TEAM-DECISION` items already open in `color.md`,
  `typography.md`, and `status.md` before this task (dark theme scope,
  brand-vs-semantic color split, scheme-sync token exception, `StatusBadge`
  error-vs-accent parity, legacy status pill treatment) and the broader
  `.claude`/`.codex` profile-authority question recorded in
  `docs/reports/2026-11-05/codex-knowledge-relocation.md` and
  `docs/reports/2026-11-05/design-system-baseline.md` remain open; this task
  did not resolve any of them, by design.
- This task does not authorize a repository-wide color/typography/status
  migration; the new reuse-ladder step and reviewer finding category apply
  to new/touched code only, same as the existing `## Ant Design first`
  pattern they mirror.

**Result: COMPLETE.** All 7 `docs/design-system/*.md` files are
profile-neutral in wording with zero remaining `Codex-generated`/
`Codex-facing` hits, all facts/citations/labels preserved. All 11 planned
insertion points are applied verbatim (Codex-caveat sentences dropped) across
`CLAUDE.md` and 10 `.claude/` files. No `src/`, `.codex/`, or `AGENTS.md` file
was touched. No attribution line was added anywhere.

Report path: `docs/reports/2026-11-05/design-system-profile-neutral-wiring.md`
