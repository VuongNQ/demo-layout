# Service location rule update — 2026-10-29

Revision: `cdac9b7b1c4d8ead10601da1e957ee6c2d543803` (branch `fĩxbug/vuongnq`,
clean tree at start of this change). Documentation-only change: `src/` was not
touched. Routing content, `src/routes/`, and `.claude/rules/06-routing-permission.md`
were explicitly out of scope and were not touched. `.claude/**` and `CLAUDE.md`
are gitignored in this repository (confirmed via `git check-ignore`:
`.gitignore:38` `.claude/*`, `.gitignore:39` `CLAUDE.md`), so no `git add` or
`git commit` was run, per instruction.

## Ground truth verified before editing

- `src/services/` contains exactly two files: `src/services/index.ts`
  (`export * from './users/customer-segment.service';`) and
  `src/services/users/customer-segment.service.ts`.
- `find src/modules -name '*.service.ts'` returns **19** files (the task
  brief said 20; actual count is 19 — reported as found, not corrected
  silently):
  - `src/modules/notifications/configuration/list-notification/services/workflow.service.ts`
  - `src/modules/products/configuration/cash-loan/services/cash-loan-product.service.ts`
  - `src/modules/products/configuration/credit-card/services/credit-card-product.service.ts`
  - `src/modules/products/configuration/display-information-set/services/display-information-set.service.ts`
  - `src/modules/products/configuration/product-labels/cash-loan/services/cash-loan-label.service.ts`
  - `src/modules/products/configuration/product-labels/credit-card/services/credit-card-label.service.ts`
  - `src/modules/products/configuration/scheme-sync/import/services/scheme-import.service.ts`
  - `src/modules/products/configuration/scheme-sync/services/scheme-sync.service.ts`
  - `src/modules/products/configuration/services/display-set.service.ts`
  - `src/modules/products/exclusive-touch/services/exclusive-touch.service.ts`
  - `src/modules/products/promotion-management/promotion-type/services/promotion-type.service.ts`
  - `src/modules/products/promotion-management/promotion/services/promotion.service.ts`
  - `src/modules/products/promotion-management/services/promotion-type.service.ts`
  - `src/modules/system/bank-list/services/bank.service.ts`
  - `src/modules/system/splash-screen/services/splash-screen.service.ts`
  - `src/modules/system/theme-management/background-main-lock/services/background-main-lock.service.ts`
  - `src/modules/system/theme-management/background-main/services/background-main.service.ts`
  - `src/modules/system/theme-management/topic/services/topic.service.ts`
  - `src/modules/system/version-settings/services/version-settings.service.ts`
- Two per-module `services/index.ts` barrels remain:
  `src/modules/products/configuration/scheme-sync/import/services/index.ts`
  and `src/modules/products/promotion-management/promotion/services/index.ts`.
- `src/components/select-product-modal/select-product.service.ts` exists and
  is excluded from this convention (confirmed by file listing).
- Product-label repository files confirmed present and excluded:
  `product-labels/cash-loan/{api-label-repository.ts,label-repository.ts,product-label-repository.ts}`,
  the credit-card equivalents, and `product-labels/shared/api-repository.ts`.
- Naming collision confirmed: both
  `src/modules/products/promotion-management/services/promotion-type.service.ts`
  and
  `src/modules/products/promotion-management/promotion-type/services/promotion-type.service.ts`
  exist today.

## Adopted convention (verbatim)

1. A service's permanent home is `src/services/<module>/`, one folder per
   owning top-level module (e.g. `users/`, `products/`, `system/`,
   `notifications/`, `contents/`, `order/`). NOT inside
   `src/modules/<domain>/<feature>/services/` for new code going forward.
2. Inside each module folder, sub-modules are distinguished by FILE NAME,
   flat — no nested sub-folders. Example: all services owned by the `users`
   domain go directly in `src/services/users/`, whatever their sub-module.
3. Exactly ONE `index.ts` at the outermost level of `src/services/`
   re-exports every service. Do not create per-module or per-sub-module
   barrels going forward; existing ones under `src/modules/**` (the two
   listed above) are `LEGACY-COMPATIBILITY`, migrate opportunistically when
   that feature is next touched, not as a forced cleanup task.
4. `src/services/` MAY import types, DTOs, and constants from
   `src/modules/**` — a deliberate, named exception to Local-first ownership,
   since `types/`, `dto/`, `mappers/`, `queryKeys/`, `schemas/` are NOT part
   of this migration and stay inside their owning module. `src/services/`
   MUST still not import React UI, routing, Redux, notifications, or
   `queryKeys/`.
5. Migration status: a service already under
   `src/modules/<domain>/<feature>/services/` is `LEGACY-COMPATIBILITY` and
   may stay there until it is next substantially touched; do not require a
   bulk move. A brand-new service, or a service being substantially
   rewritten, MUST go in `src/services/<module>/`.
6. Known pending naming collision, flagged but not resolved:
   `src/modules/products/promotion-management/services/promotion-type.service.ts`
   and
   `src/modules/products/promotion-management/promotion-type/services/promotion-type.service.ts`
   share a basename. Whoever migrates them must rename one (e.g. prefix with
   its sub-module) since the flat target layout cannot hold two same-named
   files in one folder. Recorded as a note for future migration, not a
   blocking decision now.

## Edits — file, section, before, after

| File | Section | Before | After |
| --- | --- | --- | --- |
| `.claude/ARCHITECTURE.md` | §6 Module Ownership, "API endpoint wrapper" row | `Feature \`services/\`; a repository only when it adds meaningful domain aggregation/abstraction.` | Points at `src/services/<module>/` as the 2026-10-29 target, feature `services/` marked `LEGACY-COMPATIBILITY`, repository clause kept. |
| `.claude/ARCHITECTURE.md` | §7 Recommended Feature Structure, intro | (none) | Added a note that `services/`/`feature.service.ts` entries in the trees below are `LEGACY-COMPATIBILITY`; trees themselves left unchanged per instruction (service-only change, not a restructure). |
| `.claude/ARCHITECTURE.md` | §10 API/Service/Repository Architecture, preferred flow + API rules | `-> typed feature service` / `New endpoint strings live in a feature service/repository, not a component.` | Flow now shows `src/services/<module>/` (new/rewritten) vs. feature `services/` (LEGACY-COMPATIBILITY); API rules line points at `src/services/<module>/`. |
| `.claude/ARCHITECTURE.md` | §20 Architecture Decision Status table | `Put new endpoint strings behind feature services/repositories. | ADOPTED | ...` | Original row marked `SUPERSEDED 2026-10-29`; new row added: `Put new endpoint strings in a service under src/services/<module>/, or a justified repository. | ADOPTED, migration incremental | ...`. |
| `.claude/rules/01-architecture.md` | `## Required dependency direction` | `-> feature service/repository` | `-> service in src/services/<module>/ (new/rewritten) or feature-local services/ (LEGACY-COMPATIBILITY, unmigrated)`, plus a cross-reference bullet. |
| `.claude/rules/01-architecture.md` | `## Local-first ownership` | (no exception stated) | Added the named `src/services/` import exception (point 4). |
| `.claude/rules/01-architecture.md` | `### Approved Theme Management child-module structure` | Listed `services/` as an approved child folder. | Dropped `services/` from the approved list; `services/` marked `LEGACY-COMPATIBILITY`; added note that Theme/Topic services migrate to `src/services/system/theme-management/` when touched. |
| `.claude/rules/02-typescript.md` | `## Theme Management scoped file naming` | Listed `services` among approved folders; `service files use \`<domain>.service.ts\`` with no location caveat. | Dropped `services` from approved folders with a `LEGACY-COMPATIBILITY` note and target path; clarified "service files use `<domain>.service.ts` wherever they live". |
| `.claude/rules/03-api-service.md` | New `## Service location` section (after `## Transport boundary`) | (did not exist) | Added the full 6-point convention verbatim plus the current-state note (1 migrated sample, rest legacy). |
| `.claude/rules/03-api-service.md` | `## Mock data`, first bullet | `Keep mock data inside the owning module, beside the real service in services/.` | Mock location now follows the real service's location (`src/services/<module>/` or legacy `services/`); added a note that zero `*.mock.ts` files exist today, so this is prospective. |
| `.claude/rules/03-api-service.md` | `## Endpoint ownership`, first bullet | `Put new endpoint strings in a feature-owned service or justified repository.` | Points at `src/services/<module>/` per `## Service location`. |
| `.claude/rules/03-api-service.md` | Theme Management closing paragraph | `place feature-owned endpoint wrappers under services/<domain>.service.ts` | New/rewritten Theme/Topic service goes in `src/services/system/theme-management/<domain>.service.ts`; `topic/services/<domain>.service.ts` marked `LEGACY-COMPATIBILITY`. |
| `.claude/rules/04-state-management.md` | Redux bullet list | `Call feature services/repositories from new thunks.` | Points at `src/services/<module>/` or the `LEGACY-COMPATIBILITY` feature-local `services/`, with a cross-reference. |
| `.claude/agents/codebase-analyzer.md` | State ownership analysis | `TanStack Query -> feature service/repository -> ApiFetcher is target-compatible...` | Added explicit classification: `src/services/<module>/` is target-compatible, feature-local `services/` is `LEGACY-COMPATIBILITY`, not a finding. |
| `.claude/agents/feature-implementer.md` | Preferred architecture flow | `-> feature service/repository` | Split into `src/services/<module>/` (new/rewritten) vs. legacy feature-local `services/`/repository, plus guidance paragraph. |
| `.claude/agents/feature-implementer.md` | API and error handling | `New endpoint strings belong in a feature-owned service/repository...` / `-> typed feature service/repository -> ApiFetcher` | Both point at `src/services/<module>/` or repository. |
| `.claude/agents/feature-implementer.md` | Repository guidance | `prefer a feature service and let the existing thunk coordinate state` | `prefer a service in src/services/<module>/ and let the existing thunk coordinate state`. |
| `.claude/agents/feature-implementer.md` | Redux bullet list | `call feature services from new thunks` | `call a service (src/services/<module>/ or the LEGACY-COMPATIBILITY feature-local services/) from new thunks`. |
| `.claude/agents/frontend-reviewer.md` | Architecture review flow | `-> feature service/repository` | Split target vs. legacy, plus explicit instruction: do NOT flag an unmigrated module-local service as a violation; only flag a new/rewritten service placed outside `src/services/<module>/`. |
| `.claude/agents/frontend-reviewer.md` | New server resource review checklist | `query functions call a feature service/repository that uses ApiFetcher` | Points at `src/services/<module>/` (new/rewritten) or legacy feature-local `services/`. |
| `.claude/skills/analyze-module/SKILL.md` | Trace order list | `-> services/repositories and ApiFetcher endpoints` | Added the two valid locations inline. |
| `.claude/skills/refresh-context/SKILL.md` | Snapshot metric list, item 3 | `feature services/repositories` | `services (src/services/<module>/ and remaining LEGACY-COMPATIBILITY feature-local services/)`. |
| `CLAUDE.md` | Current codebase snapshot, State/API bullet | Ended at `New generic api-error-envelope.helper.ts.` with no mention of the new convention. | Appended a dated clause: convention adopted, current counts (1 migrated sample, 19 legacy files, 1 unresolved basename collision flagged `NEEDS-TEAM-DECISION`). Did not rewrite the pre-existing `11 *.service.ts` historical count (that number is evidence from the 2026-10-21 snapshot, out of scope to correct here). |
| `.claude/PROJECT_CONTEXT.md` | New section before the 2026-10-21 changelog entry | (did not exist) | Added a `## Service location update (2026-10-29)` section recording the adopted convention, the verified current `src/services/` contents, and explicitly superseding the 2026-10-21 entries' `src/service/customer-segment.service.ts` (singular, no `users/` subfolder) and "13 feature services" figures, which predate this recount. Left the 2026-10-21 entries themselves unedited as historical evidence. |

## Skill-file grep results

| Skill | Reference to service location? | Action |
| --- | --- | --- |
| `analyze-module` | Yes — trace-order list item `-> services/repositories and ApiFetcher endpoints` | Updated |
| `fix-bug` | No reference found | No change |
| `implement-feature` | No reference found | No change |
| `refresh-context` | Yes — snapshot metric list item `feature services/repositories` | Updated |
| `review-code` | No reference found | No change |
| `trace-feature-flow` | No reference found | No change |

## Flagged naming collision

`src/modules/products/promotion-management/services/promotion-type.service.ts`
and
`src/modules/products/promotion-management/promotion-type/services/promotion-type.service.ts`
share the basename `promotion-type.service.ts`. Recorded in
`.claude/rules/03-api-service.md` `## Service location` point 6 as
`NEEDS-TEAM-DECISION`-flavored guidance (flag, not resolve): whoever migrates
these two files must rename one before placing both in the flat
`src/services/products/` target, since a flat layout cannot hold two
same-named files in one folder. Not fixed as part of this documentation-only
change.

## Left `NEEDS-TEAM-DECISION`

- The `promotion-type.service.ts` basename collision above — rename choice
  (which file keeps the bare name, which gets a sub-module prefix) is not
  decided here.
- No other ambiguity was introduced; all other points in the brief mapped to
  an unambiguous rule change.

## Not touched (explicitly out of scope, confirmed)

- Nothing under `src/` was created, moved, or renamed.
- `src/routes/**` and `.claude/rules/06-routing-permission.md` were not
  opened for editing.
- No `git add`/`git commit` was run; `.claude/**` and `CLAUDE.md` remain
  untracked/gitignored as before.
