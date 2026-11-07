# `docs/` conventions

This file states the current path convention for everything under `docs/`.
`docs/` is intentionally untracked by git (see `.gitignore`); these files are
local, persistent working notes, not shipped repository documentation.

## Path convention

- **Audit output**: `docs/audits/<area>/YYYY-MM-DD/<slug>.md`
- **Report, synthesis, or plan output**: `docs/reports/YYYY-MM-DD/<slug>.md`
- **Module documentation**: `docs/modules/<module>/<NAME>.md`
- **Repository reference documents**: `docs/<NAME>.md` (or another extension
  when Markdown doesn't fit, e.g. `.html`) at the root of `docs/`, for content
  that is neither an audit, a report/plan, nor documentation of one module —
  currently `docs/ENV_VARIABLES.md` and `docs/sbom-readme.html`. These carry
  no date and stay at the `docs/` root; a later cleanup pass should not
  re-classify them as "unclear".

The date is a directory, not part of the filename. Module documentation and
root-level reference documents carry no date anywhere in their path, because
they are living documents kept current in place rather than re-issued as
dated snapshots.

`docs/migrations/` keeps its own top-level name; the date-directory rule
applies inside it only for files that already carry a date.

## Historical documents

Documents under `docs/audits/`, `docs/reports/`, and `docs/migrations/` that
predate this convention were written for the earlier Codex profile (see
`CLAUDE.md`) and are kept verbatim as evidence, including any outdated paths
or claims mentioned in their bodies. They may be moved or renamed to fit the
date-directory convention, but their contents are not edited to match current
source or current paths.

## Known exception: report-shaped documents left in `docs/modules/`

The following files are report-shaped in content (risk/decision analysis, or
a phased implementation plan) but sit under `docs/modules/products/` rather
than `docs/reports/`:

- `docs/modules/products/product-configuration/product-line-form-refactor-feasibility-analysis.md`
- `docs/modules/products/product-configuration/product-line-hidden-fields-impact-analysis.md`

This is intentional, not an unresolved cleanup item: neither carries a date
(in its filename or body) that would let it be placed under
`docs/reports/YYYY-MM-DD/` without inventing one, so they stay in the dateless
living-document area. A planned `products` documentation reconciliation pass
will decide whether each becomes a dated report, gets folded into a module
document, or stays as-is. Do not move them into `docs/reports/` or assign
them a date before that pass. See
`docs/reports/2026-11-04/docs-restructure.md` `## Cleanup pass` for the
history of this decision.

`docs/modules/products/scheme-sync-import-plan.md`, formerly listed here, was
resolved on 2026-11-05: its content was stale on structure (described a
`services/`-folder mock-switch architecture that current source never has)
and is now fully superseded by the proper module document,
`docs/modules/products/scheme-sync.md` (§4 covers the actual import flow it
planned, §6 covers the API contract it anticipated, §15 carries forward the
one planning item — mutation-level permission defense-in-depth and
single-toast-per-success-path — that this pass could not exhaustively
re-verify as fully satisfied). The plan file was deleted rather than dated
and moved, since nothing in it survives as a planning document once the
actual implementation has its own current-source-verified documentation.
