# Parallel worktree integration audit

**Author:** Vuowng  
**Date:** 2026-11-07  
**Audited checkout:** `E:\demo-layout`, branch `feat/playground-compare`, revision `05a527ecb9510f83013589cb7692d905f4770d80` at report preparation. The checkout was initially observed at `6c9aaf3b88f87a139b160e7cc11112dd196f8515`; another actor advanced it to `05a527e` during this read-only audit.  
**Method:** Git metadata, existing files and reports inspected statically. No worktree migration, integration, installation, build, browser run, deployment or application edit was performed.

## Scope and evidence boundary

This report inventories the parallel work, identifies what is recoverable, and gives a guarded integration procedure. It authorizes no migration or merge. The main checkout has no `AGENTS.md`. `git status --short --branch` was clean before this report was added. The only change made by this task is this report.

The requested planning report and T3 report are tracked in the main checkout. Neither `parallel-t1-routing.md` nor `parallel-t2-chatgpt-shell.md` is present there. Git's registered T1/T2 paths are now absent, so their worktree copies cannot be read. Their branch refs still point to the common base `5f3c308850b0e1c59a7cb576b5d7c1424cec3976`, which does not contain those reports or implementations. **Do not infer that the missing work was safely committed or recovered.**

| Requested input | Current evidence |
| --- | --- |
| `hds-admin-next-design-playground-plan.md` | Present and tracked in main. Defines route, theme, phase and regression goals; it is a proposal, not runtime proof. |
| `parallel-t1-routing.md` | Absent from main and from the registered routing worktree path, which no longer exists. Contents and current code unavailable. |
| `parallel-t2-chatgpt-shell.md` | Absent from main and from the registered ChatGPT worktree path, which no longer exists. Contents and current code unavailable. |
| `parallel-t3-compare-workspace.md` | Present and tracked in main. Its statements were checked against current `src/compare/` where possible; its browser claims remain unverified. |

## Worktree location and uncommitted change inventory

`git worktree list --porcelain` at `05a527e` returned:

| Registered worktree | Branch / HEAD | Physical state | Uncommitted state |
| --- | --- | --- | --- |
| `E:/demo-layout` | `feat/playground-compare` / `05a527e` | Present; main repository checkout. | Clean before this report. T3 source and report are committed. |
| `E:/demo-layout/.worktrees/feat-playground-chatgpt` | `feat/playground-chatgpt` / `5f3c308` | **Missing**; Git says `prunable gitdir file points to non-existent location`. This registered location is inside the main checkout and violates the external-worktree constraint. | Cannot inspect; uncommitted changes and local-only report may have been lost or moved elsewhere. |
| `E:/demo-layout/.worktrees/feat-playground-routing` | `feat/playground-routing` / `5f3c308` | **Missing** with the same `prunable` warning; also nested inside main. | Cannot inspect; uncommitted changes and local-only report may have been lost or moved elsewhere. |

Both nested registrations have `.git/worktrees/<name>/gitdir` files pointing to their missing nested `.git` files. `git -C` against either path fails with “No such file or directory.” No external worktree is registered. `git for-each-ref` confirms both T1/T2 branches still at `5f3c308`; those refs cannot supply uncommitted files. The directories appeared in a directory listing early in the audit but became unavailable; do not treat that early listing as proof of their contents.

**Concurrent history:** `6c9aaf3` added T3 files, the planning report and T3 report, many other documentation files, a `.gitignore` change, and two `160000` gitlink entries for the nested worktrees. `05a527e` removed the two gitlinks. The registered worktree metadata remains. This audit did not make either commit or remove any directory. The broad contents of `6c9aaf3` make blind cherry-picking an unsafe integration method. Do not change `.gitignore` as part of this audit or migration.

## Ownership, contracts and integration conflicts

| Track | Verified files / ownership | Contract and dependency | Conflict or evidence gap |
| --- | --- | --- | --- |
| T1 Claude routing | No current T1 implementation files or report available. Main `src/routes/router.tsx` still declares unscoped routes under `AppLayout`. | Must export or expose a Claude route tree and explicit compatibility redirects while retaining `createBrowserRouter` basename `import.meta.env.BASE_URL`. Existing list-child drawer and sibling full-page topology, params, search and hash must survive. | T1 ownership and any edits to menu, features, experiments or `src/App.tsx` **cannot be verified**. Recover before integrating. |
| T2 ChatGPT shell/theme | No current T2 implementation files or report available. `src/chatgpt/` is absent from main. | Needs a separate route object or component contract for `/chatgpt/*`, scoped layout and theme; parent router and basename remain single-owner concerns. | Export name, route shape, theme provider placement, dependency changes and file overlap **cannot be verified**. Recover before integrating. |
| T3 Compare | `src/compare/{CompareWorkspace.tsx,CompareWorkspace.module.scss,index.ts,scenarios.ts,records.ts}` and its report are committed. | `src/compare/index.ts` exports `compareRoute`; it is a `RouteObject` with relative path `compare`, index and `:scenarioId` child. Mount as a sibling at the root route composition boundary. | Current Compare UI links to **unscoped** Claude paths and labels `/claude/*` planned and ChatGPT unavailable. These labels/links require a later integration review, without fabricating test results. T3 does not mount itself in `router.tsx`. |
| Landing page | No implementation audited. | Future root `/` selection page replaces the temporary Claude root redirect only after Claude and ChatGPT destinations are usable. | Ownership of root route is shared with T1 router composition and must be assigned to one integrator. |

The T3 source diff against `5f3c308` is limited to `src/compare/` for application code. This supports **T3's source ownership only**. Three-way disjoint ownership is **unverified** because T1/T2 changes are unavailable. In particular, T1's navigation callers may overlap future T2 links, and all three require the same router composition point. Do not use branch names or reports alone as proof of non-overlap.

The current router has a root redirect to `/offer-types`, a single `AppLayout`, nested drawers for Offer Types, Background Locks, Promotion Types and the unsaved-changes experiment, plus sibling full-page edit routes. It uses `createBrowserRouter(..., { basename: import.meta.env.BASE_URL })`. `vite.config.ts` defaults to `/demo-layout/`; `scripts/spa-fallback.mjs` copies `dist/index.html` to `dist/404.html`; the Pages workflow builds on `main`. These are static contracts, not verified deployed deep-link behavior.

## Local-only documents and data to preserve

- Preserve any recovered T1/T2 reports at their exact requested paths and compare them against recovered source. They are not in current Git history. Keep independent copies **outside** the main repository while recovery is unresolved.
- Preserve all recovered tracked modifications, staged changes and untracked files, including any local validation notes, before moving or replacing a worktree. Check for ignored but task-relevant files explicitly; never assume `git status` lists them.
- The planning report and T3 report are already tracked at `05a527e`; their availability does not recover T1/T2.
- Do not copy `node_modules`, generated `dist`, secrets, real customer data, or production API credentials into integration commits. Preserve any such local artifacts only when necessary for forensic recovery, outside the repository and under appropriate access control.

## T3 dependency installation failure

The T3 report records `npm run typecheck` and `npm run build` blocked at `vite.config.ts(3,25)` because `@tailwindcss/vite` was absent from that worktree's `node_modules`. Its `npm ci --offline --ignore-scripts --no-audit --no-fund` attempt then failed with `EPERM` while unlinking `node_modules/.package-lock.json`. This is **reported historical behavior**, not a currently reproduced failure. The dependency is declared in `package.json` and `package-lock.json`; `npm ls @tailwindcss/vite --depth=0` now succeeds in the main checkout at `4.3.4`. The main checkout's installed package does not prove T3's original environment was repaired, nor that T3 compiles or renders. Integration validation should use a fresh, external worktree and `npm ci` without sharing or copying `node_modules`; investigate file locks and permissions if `EPERM` recurs. No installation was attempted in this audit.

## Safe external-worktree migration procedure — future, not executed

**Stop condition now:** The T1/T2 directories are missing. `git worktree move` cannot move a nonexistent source. First locate an intact filesystem backup or snapshot, or obtain an independently preserved T1/T2 patch and report. Do **not** prune stale registrations, manually delete `.worktrees`, force-add worktrees over the names, or reset branches while uncommitted work may be recoverable. If no copy is found, treat the work as unrecovered and reimplement it from the reports/specification in newly authorized external worktrees after preserving the Git metadata for investigation.

If intact directories are recovered at their registered paths, a future operator can perform the following **only after** confirming that each source exists and each destination is outside `E:\demo-layout`:

```powershell
$repo = 'E:\demo-layout'
$external = 'E:\demo-layout-worktrees' # sibling, outside the repository
$repoFull = [IO.Path]::GetFullPath($repo).TrimEnd('\')
$externalFull = [IO.Path]::GetFullPath($external).TrimEnd('\')
if ($externalFull.Equals($repoFull, [StringComparison]::OrdinalIgnoreCase) -or
    $externalFull.StartsWith($repoFull + '\', [StringComparison]::OrdinalIgnoreCase)) {
  throw 'External worktree destination is inside the repository.'
}
foreach ($name in @('feat-playground-routing', 'feat-playground-chatgpt')) {
  if (-not (Test-Path -LiteralPath "$repo\.worktrees\$name\.git")) { throw "Missing source: $name" }
  if (Test-Path -LiteralPath "$external\$name") { throw "Destination already exists: $name" }
}
git -C $repo worktree list --porcelain
git -C "$repo\.worktrees\feat-playground-routing" status --porcelain=v1 -uall
git -C "$repo\.worktrees\feat-playground-chatgpt" status --porcelain=v1 -uall
# Archive the exact status output, diffs, and untracked reports outside $repo first.
# Verify $external resolves outside $repo; abort if any source or report is missing.
New-Item -ItemType Directory -Force -Path $external
git -C $repo worktree move "$repo\.worktrees\feat-playground-routing" "$external\feat-playground-routing"
git -C $repo worktree move "$repo\.worktrees\feat-playground-chatgpt" "$external\feat-playground-chatgpt"
git -C $repo worktree list --porcelain
git -C "$external\feat-playground-routing" status --porcelain=v1 -uall
git -C "$external\feat-playground-chatgpt" status --porcelain=v1 -uall
```

Use an external path with sufficient space and no existing destination directory. Before and after each move, compare status, diffs, untracked file inventory and report hashes. A move may need Git support or permissions; stop on any error rather than using manual filesystem deletion. If directories were already moved without Git, locate them and use `git worktree repair` only after verifying their `.git` pointers and all local files; do not guess a path. The historical `160000` entries in `6c9aaf3` are separate Git history and are not fixed by moving a worktree. No `.worktrees` directory should be created in the main repository again.

## Integration sequence and gates

1. **Recover and inventory T1/T2 first.** Obtain exact reports and source from an intact copy or patch. Capture `git status --porcelain=v1 -uall`, `git diff --binary`, staged diff, untracked files, branch/HEAD and report hashes. Confirm ownership and reconcile any changes to router, menu, features, `App.tsx`, themes, package files or global styles. Use external worktrees for any implementation. If recovery fails, reimplement from the plan; do not claim the missing implementations were integrated.
2. **Claude routing.** Assign one router owner. Integrate scoped `/claude/*` tree, complete explicit legacy redirect inventory, root temporary redirect, scoped navigation, nested drawer close paths and basename. Compare every original route and test params/query/hash. Avoid importing ChatGPT or Compare before their route exports are verified.
3. **ChatGPT shell and theme.** Integrate its recovered route contract under `/chatgpt/*`; keep provider and styles scoped and retain Claude's appearance. Confirm the actual export name and any package requirements from source. Do not infer from the unavailable T2 report.
4. **Compare workspace.** Integrate the verified relative `compareRoute` as a sibling. Update its destination availability and current/proposed links only when corresponding paths exist, and keep Claude/ChatGPT observation records independent. Review localStorage and CSV behavior in a browser.
5. **Platform selection landing.** Replace the temporary `/` redirect once both platform entries and Compare are navigable. Preserve all legacy redirects and deep links.
6. **Combined regression.** Run a clean dependency install, actual `npm run typecheck`, `npm run build` and `git diff --check` in the integration worktree. Test route matrix and browser behavior before any deployment decision. Keep integration commits narrowly scoped and avoid blind cherry-picking of `6c9aaf3`, which contains unrelated docs and historical nested gitlinks.

## Validation requirements and acceptance

Static acceptance: all old paths resolve to matching `/claude/*` routes with params, search and hash; root behavior matches the current stage; drawer child routes remain children and full-page edits remain siblings; menu, breadcrumbs, feature navigation and close destinations stay platform scoped; `compareRoute` and the actual T2 export compose under one basename; ChatGPT theme styles do not alter Claude source or global styles; no nested auxiliary worktrees or new dependencies without justification. Check a clean file inventory and `git diff --check` for each integration slice.

Runtime acceptance (not performed here): `npm run typecheck`, `npm run build` and browser navigation on `/`, representative legacy and scoped deep links, direct drawer load/close, query/hash retention, Back/Forward, experiment behavior, platform switching, theme/portal isolation, Compare notes and CSV export, responsive and keyboard behavior. Check `dist/404.html` and direct Pages-style `/demo-layout/...` fallback plus asset URLs. The package has no browser-test script; record manual or added automation separately. Do not claim WCAG or deployment compatibility from static inspection alone.

## Risks, inferences and unverified items

- **Primary risk:** T1/T2 uncommitted changes and reports may be unavailable. Their absence is observed; permanent loss is **not proven**. Preserve metadata and seek backups before any cleanup.
- **Concurrent mutation:** The main branch advanced during this audit. Recheck `HEAD`, status and worktree registry immediately before any later action; this report's revision is a snapshot.
- **Integration collision:** Router composition has one owner; unknown T1/T2 source may overlap. T3 links and availability labels are intentionally stale after integration unless reviewed.
- **Historical gitlinks:** `6c9aaf3` recorded nested worktrees as gitlinks; `05a527e` removed them but left stale worktree registrations. Avoid reintroducing gitlinks in integration history.
- **Dependency state:** Main `node_modules` has `@tailwindcss/vite`, while T3's reported `EPERM` remains unexplained. A successful `npm ls` is not a typecheck/build/browser result.
- **Unverified:** T1/T2 report contents, full uncommitted inventories, actual three-way file disjointness, T2 route export and theme implementation, T1 redirect completeness and drawer lifecycle, T3 rendering and storage/download behavior, browser interactions, accessibility, responsive behavior and deployed Pages deep links.

## NEEDS-TEAM-DECISION

1. Identify the owner and location of any backup/snapshot of the missing T1/T2 worktrees and reports. Decide whether to recover or reimplement if no intact copy exists; do not prune until that decision is evidence-backed.
2. Assign the single router/landing integration owner and confirm the final T2 route export contract after source recovery.
3. Decide the external worktree parent path and who performs the later guarded migration. The path must resolve outside `E:\demo-layout`.
4. Decide whether the broad `6c9aaf3` documentation and `.gitignore` changes belong in the eventual integration history; the Compare source itself is separately identifiable.
5. Set the browser/device matrix and evidence threshold for route, drawer, theme, Compare and Pages acceptance before approval or deployment.
