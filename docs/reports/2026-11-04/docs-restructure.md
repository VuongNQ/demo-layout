# `docs/` restructure to date-directory convention

Date: 2026-11-04

## Why

The older convention put the date in the filename
(`docs/reports/2026-10-29-service-location-rule-update.md`); the target
convention puts it in a directory
(`docs/reports/YYYY-MM-DD/service-location-rule-update.md`), and reserves a
dateless `docs/modules/<module>/<NAME>.md` path for living module
documentation. This moves every file that used the old filename-date pattern
into the new date-directory pattern and fixes every reference to a moved
path, without editing the contents of any moved historical document.

## Moves (29 files)

### `docs/audits/` (12)

| old path | new path |
| --- | --- |
| `docs/audits/architecture/2026-10-28-service-router-restructure-impact.md` | `docs/audits/architecture/2026-10-28/service-router-restructure-impact.md` |
| `docs/audits/architecture/2026-10-29-post-restructure-actual-state.md` | `docs/audits/architecture/2026-10-29/post-restructure-actual-state.md` |
| `docs/audits/architecture/2026-10-29-promotion-management-service-collision.md` | `docs/audits/architecture/2026-10-29/promotion-management-service-collision.md` |
| `docs/audits/products-configuration/2026-11-03-cash-loan-settings-form.md` | `docs/audits/products-configuration/2026-11-03/cash-loan-settings-form.md` |
| `docs/audits/promotion-type/2026-10-26-detail-drawer-clean-code-audit.md` | `docs/audits/promotion-type/2026-10-26/detail-drawer-clean-code-audit.md` |
| `docs/audits/routing/2026-10-20-theme-management-withguard-feasibility.md` | `docs/audits/routing/2026-10-20/theme-management-withguard-feasibility.md` |
| `docs/audits/scheme-sync/2026-11-02-component-data-flow-props-audit.md` | `docs/audits/scheme-sync/2026-11-02/component-data-flow-props-audit.md` |
| `docs/audits/simulation-preview/2026-11-02-component-inventory.md` | `docs/audits/simulation-preview/2026-11-02/component-inventory.md` |
| `docs/audits/simulation-preview/2026-11-02-dynamic-theme-config-update.md` | `docs/audits/simulation-preview/2026-11-02/dynamic-theme-config-update.md` |
| `docs/audits/theme-lock/2026-10-20-footer-action-lost.md` | `docs/audits/theme-lock/2026-10-20/footer-action-lost.md` |
| `docs/audits/theme-management/2026-10-21-background-main-rename.md` | `docs/audits/theme-management/2026-10-21/background-main-rename.md` |
| `docs/audits/theme-management/2026-10-23-service-data-util-audit.md` | `docs/audits/theme-management/2026-10-23/service-data-util-audit.md` |

`docs/audits/products-configuration/2026-11-03/general-sections-dead-code-check.md`
already matched the convention and was left in place; it now sits alongside
the newly-moved `cash-loan-settings-form.md` in the same date directory — no
collision, different slugs.

### `docs/reports/` (17)

| old path | new path |
| --- | --- |
| `docs/reports/2026-10-20-plan-promotion-mock-first.md` | `docs/reports/2026-10-20/plan-promotion-mock-first.md` |
| `docs/reports/2026-10-20-plan-promotion-type-crud.md` | `docs/reports/2026-10-20/plan-promotion-type-crud.md` |
| `docs/reports/2026-10-20-staletime-backfill.md` | `docs/reports/2026-10-20/staletime-backfill.md` |
| `docs/reports/2026-10-21-mock-data-convention-utils-service-audit.md` | `docs/reports/2026-10-21/mock-data-convention-utils-service-audit.md` |
| `docs/reports/2026-10-21-promotion-m0-scaffolding.md` | `docs/reports/2026-10-21/promotion-m0-scaffolding.md` |
| `docs/reports/2026-10-21-sprint1-promotion-type-list.md` | `docs/reports/2026-10-21/sprint1-promotion-type-list.md` |
| `docs/reports/2026-10-21-sprint2-promotion-type-detail.md` | `docs/reports/2026-10-21/sprint2-promotion-type-detail.md` |
| `docs/reports/2026-10-21-sprint3-promotion-type-create.md` | `docs/reports/2026-10-21/sprint3-promotion-type-create.md` |
| `docs/reports/2026-10-26-promotion-type-status-check.md` | `docs/reports/2026-10-26/promotion-type-status-check.md` |
| `docs/reports/2026-10-27-offer-api-reconciliation.md` | `docs/reports/2026-10-27/offer-api-reconciliation.md` |
| `docs/reports/2026-10-29-antd-first-component-rule.md` | `docs/reports/2026-10-29/antd-first-component-rule.md` |
| `docs/reports/2026-10-29-service-location-rule-update.md` | `docs/reports/2026-10-29/service-location-rule-update.md` |
| `docs/reports/2026-11-02-scheme-sync-filterbar-step3.md` | `docs/reports/2026-11-02/scheme-sync-filterbar-step3.md` |
| `docs/reports/2026-11-02-scheme-sync-group-paging-step4.md` | `docs/reports/2026-11-02/scheme-sync-group-paging-step4.md` |
| `docs/reports/2026-11-02-scheme-sync-props-step1.md` | `docs/reports/2026-11-02/scheme-sync-props-step1.md` |
| `docs/reports/2026-11-02-scheme-sync-url-state-step2.md` | `docs/reports/2026-11-02/scheme-sync-url-state-step2.md` |
| `docs/reports/2026-11-03-cash-loan-form-fixes.md` | `docs/reports/2026-11-03/cash-loan-form-fixes.md` |

`docs/reports/2026-11-04/module-docs-inventory.md` and
`docs/reports/2026-11-04/profile-stale-path-fix.md` already matched the
convention and were left in place.

All moves used plain `mv` (not `git mv`; `docs/` is gitignored) and created
target date directories as needed. No file contents were edited. A collision
check against every computed target path was run before any move; none
existed.

## Reference fixes (7 lines across 3 files)

Every reference to a moved path was grepped across `CLAUDE.md`,
`.claude/PROJECT_CONTEXT.md`, `.claude/ARCHITECTURE.md`, `.claude/rules/`,
`.claude/agents/`, `.claude/skills/`, and `docs/` itself.

- `.claude/PROJECT_CONTEXT.md` — 6 occurrences updated:
  - line ~49: `docs/audits/architecture/2026-10-28-service-router-restructure-impact.md` -> `.../2026-10-28/service-router-restructure-impact.md`
  - line ~64: `docs/audits/theme-management/2026-10-21-background-main-rename.md` -> `.../2026-10-21/background-main-rename.md`
  - line ~344: `docs/reports/2026-10-21-sprint1-promotion-type-list.md` -> `docs/reports/2026-10-21/sprint1-promotion-type-list.md`
  - line ~813: `docs/audits/architecture/2026-10-28-service-router-restructure-impact.md` -> `.../2026-10-28/service-router-restructure-impact.md`
  - line ~961: `docs/audits/theme-management/2026-10-21-background-main-rename.md` -> `.../2026-10-21/background-main-rename.md`
  - line ~1067: `docs/audits/architecture/2026-10-28-service-router-restructure-impact.md` -> `.../2026-10-28/service-router-restructure-impact.md`
- `.claude/rules/01-architecture.md` — 1 occurrence updated (dated inline
  note): `docs/audits/theme-management/2026-10-21-background-main-rename.md`
  -> `.../2026-10-21/background-main-rename.md`
- `.claude/rules/06-routing-permission.md` — 1 occurrence updated (dated
  inline note): `docs/audits/architecture/2026-10-28-service-router-restructure-impact.md`
  -> `.../2026-10-28/service-router-restructure-impact.md`

`CLAUDE.md`, `.claude/ARCHITECTURE.md`, `.claude/agents/`, and
`.claude/skills/` had zero references to any moved path.

### References intentionally left unchanged

Re-grepping the old paths after the fixes above found 12 remaining
occurrences, all inside the bodies of historical documents under
`docs/audits/` and `docs/reports/` (including this directory's own
`module-docs-inventory.md` and `profile-stale-path-fix.md`, plus the moved
files `post-restructure-actual-state.md`, `general-sections-dead-code-check.md`,
`footer-action-lost.md`, `plan-promotion-type-crud.md`,
`plan-promotion-mock-first.md`, `sprint3-promotion-type-create.md`,
`promotion-m0-scaffolding.md`, `sprint1-promotion-type-list.md`,
`sprint2-promotion-type-detail.md`, and `cash-loan-form-fixes.md`). These are
left verbatim per the task scope and `CLAUDE.md`'s instruction that historical
reports/audits are kept as evidence, including any outdated paths they
mention internally.

## `docs/README.md`

Created, stating the three path patterns, that the date is a directory (not
part of the filename), that module documentation is dateless because it is a
living document, and that `docs/audits/`, `docs/reports/`, and
`docs/migrations/` hold historical Codex-profile evidence kept verbatim.

## Left unmoved — "unclear" group (human decision needed)

- `docs/modules/products/product-configuration/product-line-form-refactor-feasibility-analysis.md`
  — report-shaped content (risk rating, STOP decision) sitting under a module
  directory, but carries no date anywhere — not in the filename, not in the
  body. Cannot be placed under `docs/reports/YYYY-MM-DD/` without inventing a
  date. Left in place.
- `docs/modules/products/product-configuration/product-line-hidden-fields-impact-analysis.md`
  — same reasoning: impact-analysis content, no date in filename or body.
  Left in place.
- `docs/modules/products/scheme-sync-import-plan.md` — a "plan" (matches the
  report/plan category by content) but doubles as a living, phase-tracked
  status document (phases A/B/C progress); its only date is an internal "as
  of" status marker (2026-10-22), not an authoring date, and it is referenced
  as ongoing progress tracking rather than a one-time report. Ambiguous
  whether moving it to a dated report path would break its role. Left in
  place.
- `docs/ENV_VARIABLES.md` — does not fit any of the three categories (not an
  audit, not a report/plan, not single-module documentation — it is a
  cross-cutting environment-variable reference). Left in place at the top
  level.
- `docs/sbom-readme.html` — non-Markdown, does not fit any category. Left in
  place.
- `docs/.DS_Store`, `docs/audits/.DS_Store`, `docs/modules/.DS_Store`,
  `docs/modules/system/.DS_Store`, `docs/reports/.DS_Store` — macOS filesystem
  artifacts, not documentation. Not part of any of the three categories, and
  deletion was not requested, so left in place.
- `docs/modules/products/# API Import Excel sản phẩm vay — tài li.md` — an
  unusually formatted filename (leading `#`, em dash, Vietnamese text) but it
  is already dateless and located correctly under `docs/modules/products/`
  per the convention, so no move was needed; flagged only for the odd
  filename, not for path placement.

No other module documentation needed a decision: all other files under
`docs/modules/products/` and `docs/modules/system/theme-management/` already
matched `docs/modules/<module>/<NAME>.md` (including the nested
`product-configuration/` and `theme-management/` submodule groupings, which
are dateless and therefore compliant) and were left as "no change".

## Validation

No `src/` file was touched. No `npm run typecheck`/`lint`/`build` was run —
not applicable to a documentation move. Nothing was committed; `.gitignore`
was not changed; `git mv` was not used (`docs/` is gitignored, confirmed via
existing `git check-ignore -v docs` behavior from the prior session in this
conversation).

## Cleanup pass

Resolves the "unclear" items left above, except the three report-shaped
module files, which are resolved as a documented exception rather than moved.

### 1. `.DS_Store` removal

Ran `find docs -name ".DS_Store" -delete`. 5 files removed:
`docs/.DS_Store`, `docs/audits/.DS_Store`, `docs/modules/.DS_Store`,
`docs/modules/system/.DS_Store`, `docs/reports/.DS_Store`.

### 2. Rename of the truncated-filename module doc

`docs/modules/products/# API Import Excel sản phẩm vay — tài li.md` was read
in full: it documents the admin-api Excel bulk-import integration for loan
products (`/portal/v1/schemes/import/*` — presigned upload, validate,
publish). Renamed via `mv -n` (byte-identical contents, same directory) to:

`docs/modules/products/products-loan-excel-import-api.md`

Grepped `docs/` and `.claude/` for the old filename string. Found 3
occurrences:

- The renamed file's own `# API Import Excel sản phẩm vay...` H1 heading —
  this is page content (the document's title), not a path reference, and was
  left untouched per the no-rewrite rule on moved/renamed document contents.
- `docs/reports/2026-11-04/module-docs-inventory.md` line 266 — a path
  reference in an inventory table. Updated to the new filename, with an
  inline note recording the rename and pointing back to this section.
- `docs/reports/2026-11-04/docs-restructure.md` (this file), in the "Left
  unmoved" bullet from the prior pass — a reference to the old filename.
  Left unchanged: it accurately records what the file was named at the time
  of that earlier pass, and this changelog is an append-only history, not a
  document to retroactively edit. The current filename is recorded here,
  going forward.

### 3. `docs/README.md` — fourth category added

Added a "Repository reference documents" category (`docs/<NAME>.md` at the
`docs/` root, no date) covering `docs/ENV_VARIABLES.md` and
`docs/sbom-readme.html`, so a later pass does not re-flag them as unclear.

### 4. Known exception recorded for the three report-shaped module files

Added a "Known exception: report-shaped documents left in `docs/modules/`"
section to `docs/README.md` naming
`product-line-form-refactor-feasibility-analysis.md`,
`product-line-hidden-fields-impact-analysis.md`, and
`scheme-sync-import-plan.md`, stating they stay in the dateless living-doc
area pending a planned `products` documentation reconciliation pass, with no
invented date and no move into `docs/reports/`. Not moved in this pass.

### Files changed in this cleanup pass

- Deleted: 5 `.DS_Store` files under `docs/`.
- Renamed: `docs/modules/products/# API Import Excel sản phẩm vay — tài li.md`
  -> `docs/modules/products/products-loan-excel-import-api.md`.
- Edited: `docs/README.md` (two new sections), `docs/reports/2026-11-04/module-docs-inventory.md`
  (one reference updated).

No `src/` or `.claude/` file was touched. `.gitignore` was not changed.
Nothing was committed.
