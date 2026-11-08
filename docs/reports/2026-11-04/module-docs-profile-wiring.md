# Module documentation profile wiring

Date: 2026-11-05. Scope: `.claude/` and `CLAUDE.md` only — no `src/` or
`docs/` content was touched.

## Context

`docs/modules/` now has a documentation set covering every `src/modules/`
domain (verified against `find docs/modules -name '*.md' | sort` and
`docs/modules/INDEX.md`), but the Claude Code profile only required reading
module documentation for `src/modules/products`. This pass generalizes that
requirement to every module, using `docs/modules/INDEX.md` as the lookup for
which document covers which module.

## Changes

- `CLAUDE.md`: generalized the products-only module-documentation paragraph
  to `src/modules/<module>` -> `docs/modules/<module>/OVERVIEW.md` (or the
  relevant top-level document, or `PLACEHOLDERS.md`, per
  `docs/modules/INDEX.md`), with the existing requirements to verify against
  source, report missing documents, not infer business rules from similarly
  named modules, and update the documentation when behavior/contract/
  route/permission/state-owner/request-lifecycle changes. Added a dated
  one-line note recording the generalization; left the historical codebase
  snapshot numbers elsewhere in the file untouched.
- `.claude/skills/analyze-module/SKILL.md`: generalized the same
  products-only reference in `## Inputs and context` to the module under
  analysis, via `docs/modules/<module>/OVERVIEW.md` and
  `docs/modules/INDEX.md`. Confirmed the skill's existing boundary line
  ("Analysis only: do not edit application code or module documentation")
  already correctly reserves module-documentation writes for the main CLI
  session — no change needed there.
- `.claude/agents/codebase-analyzer.md`: added an explicit mandatory-context
  item for `docs/modules/<module>/OVERVIEW.md` (or the relevant top-level
  document) and its linked submodule documents, with the same
  verify/report-missing/no-inference requirements. This agent previously had
  no products-specific module-doc line to generalize; the new item closes
  that gap for all modules consistent with the other profile files.
- `.claude/agents/feature-implementer.md`: generalized its products-only
  `## Mandatory context before implementation` paragraph the same way, and
  added an explicit statement that, as the only write-enabled agent scoped to
  `src/`, it may update `docs/modules/<module>/` documentation when its
  implemented change invalidates a claim there — scoped to what the change
  actually invalidated, not a broader rewrite.
- `.claude/agents/frontend-reviewer.md`: added a `## Module documentation
  review` section (non-blocking `INFO`-level finding) for a diff that
  invalidates a `docs/modules/<module>/` claim without updating it. Excluded
  by rule: modules with no documentation at all (checked via
  `docs/modules/INDEX.md`, including its placeholder entries), and
  pre-existing staleness outside the diff under review.

## Verification

- `find docs/modules -name '*.md' | sort` run before editing to confirm every
  path referenced in the generalized wording actually exists; no new
  requirement points at a non-existent document.
- No file under `src/` or `docs/` was modified. `npm run typecheck`,
  `npm run lint`, and `npm run prettier` were not run, since none applies to
  an unmodified `src/` tree.
