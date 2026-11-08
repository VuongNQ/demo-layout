# Same-submodule relative-import rule — 2026-11-06

Branch: `improve/vuongnq/2656_sync-UI-simulator`
Revision: `10e7aa7a665f0d05bcbe5ca064f0c377756d2a34`

Follow-up to `docs/reports/2026-11-06/import-path-optimization.md`. This
change adds one documentation rule to the local rule profile; it is not a
code change.

## File changed

`.claude/rules/01-architecture.md`, under `## Required dependency
direction`, immediately after the existing "Avoid new module-to-module
imports" bullet. Placed there (rather than `07-component.md`) because that
section already owns import-direction and cross-module-import conventions
("Avoid new module-to-module imports...", `@` alias usage context from
`CLAUDE.md`); `07-component.md` owns component/file placement and does not
currently contain any import-style convention, so no cross-reference was
added there to avoid introducing an import-style topic it doesn't otherwise
cover.

## Exact text added

```
- **SHOULD:** When a file imports another file inside the same submodule
  under `src/modules/<domain>/...` (same immediate parent folder, e.g. both
  under `product-labels/cash-loan/`), prefer a short relative import over
  the `@/modules/...` absolute alias. This is a scoped exception to the
  general "use the `@` alias for internal imports" baseline in `CLAUDE.md`,
  justified by import-depth evidence in
  `docs/reports/2026-11-06/import-path-optimization.md`: within one
  submodule the relative path is strictly shorter and does not cross an
  ownership boundary, so the alias adds length without adding a useful
  signal.

  ```ts
  // Before (absolute, same submodule)
  import { useCashLoanLabelQueries } from '@/modules/products/configuration/product-labels/cash-loan/hooks/cashLoanLabelQueries';

  // After (relative, same submodule)
  import { useCashLoanLabelQueries } from '../hooks/cashLoanLabelQueries';
  ```

  Scope: this applies only within the same submodule. Crossing into a
  sibling submodule or a parent-shared folder (for example a submodule
  reaching a parent-level shared `queryKeys/` or `types/` folder) keeps
  using relative imports as today, per the report's Pattern A/B — this rule
  does not change that case, only the `@/modules/...`-vs-relative choice
  within one submodule. It applies to new or substantially touched code
  only; it is not a reason to rewrite existing same-submodule `@/modules/...`
  imports in files the current task does not otherwise touch.
```

## Scope confirmation

- Rule level: `SHOULD`, not `MUST` — a style preference, not a correctness
  requirement, matching the task's explicit instruction.
- Applies only to new or substantially-touched code, per
  `.claude/rules/00-general.md`; explicitly not a sweep across existing
  files.
- Explicit boundary: only within the same submodule (same immediate parent
  folder under `src/modules/<domain>/...`). Crossing into a sibling
  submodule or a parent-shared folder (`queryKeys/`, `types/`) is
  unaffected and still uses relative imports as documented in the prior
  report's Pattern A/B.
- `promotion-management`'s parent-shared `queryKeys/`/`types/` folder
  convention was left untouched — that question remains open (tracked as
  `NEEDS-TEAM-DECISION` in the prior report) and out of scope here.
- No `src/` file was modified.
- No `tsconfig.app.json` or `vite.config.*` was modified.
- No `src/` or config diff exists for this change; `git status` for those
  paths is clean. `.claude/rules/01-architecture.md` itself is under
  `.claude/*`, which is gitignored and not tracked in git, so this is a
  local rule-profile documentation change only.
