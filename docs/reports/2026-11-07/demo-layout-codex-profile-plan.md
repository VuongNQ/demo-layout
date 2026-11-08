# demo-layout Codex CLI profile plan

**Author:** Vuowng

**Date:** 2026-11-07

**Branch/revision:** `feat/playground-compare` at `05a527ecb9510f83013589cb7692d905f4770d80` (inspected checkout; this report is uncommitted)

**Scope:** Documentation-only proposal. No agent, skill, configuration, application, Design System, or Claude Code profile file was created or changed.

## 1. Current CLI/profile inventory

**Verified locally:** `codex --version` reports `codex-cli 0.167.0`; `codex --help` exposes `--strict-config`, `--cd`, `--sandbox`, `--worktree`, and config overrides; `codex features list` reports `multi_agent` enabled. These commands emitted a Windows temporary PATH-alias access warning but returned successfully. `--worktree` is a CLI capability, **not** permission to create a nested worktree; this repo must use external paths. The user-level `C:\Users\anhBa\.codex\config.toml` exists and has model, sandbox and feature settings. Only selected key names were inspected; it was not changed or copied. No root `AGENTS.md`, project `.codex/`, project `.agents/`, `SKILL.md`, or project `config.toml` exists in the inspected checkout (`rg --files --hidden`, directory checks). A copied Design System README mentions `AGENTS.md` and `.codex/knowledge/` paths from the **reference** repository; those paths are absent here.

**Verified source:** `package.json` has React 18.3.1, React Router DOM 7.1.1, Ant Design 5.22.2, TypeScript 5.8.3 and Vite 8.3.5; scripts are `dev`, `typecheck`, `build`, `preview`, with no test or lint script. `README.md` says this is a fictional prototype whose Pages site can be public. `src/routes/router.tsx` currently builds one eager `createBrowserRouter` tree under `AppLayout`, with unscoped URLs and `basename: import.meta.env.BASE_URL`. `src/menu/menu-tree.ts` owns the current Claude-like menu and breadcrumb lookup with unscoped paths. `src/compare/` contains `compareRoute` (relative `compare`, index, `:scenarioId`) and local note/CSV code but is not mounted. `src/chatgpt/` is absent. No platform-owned route metadata module or lazy page import exists in these inspected areas. The T1/T2 worktree registrations are stale and their report/source copies are unavailable; see the [integration audit](parallel-worktree-integration-audit.md). The [playground plan](hds-admin-next-design-playground-plan.md) describes a proposed target, not current implementation.

**CLI contract, verified against official OpenAI documentation:** Codex discovers root-to-current-directory `AGENTS.md` guidance; project custom agents are standalone `.codex/agents/*.toml` files with required `name`, `description`, and `developer_instructions`; repo skills are `.agents/skills/<name>/SKILL.md` with YAML `name` and `description`. Agents inherit parent permissions, so instructions such as “read-only” are a behavioral contract, not a sandbox. Skills can be explicitly selected or matched from their description. A project `config.toml` is not needed for the six proposed files; optional `[agents]` settings can wait for evidence of a real need. Sources: [AGENTS.md discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [custom subagents and schema](https://learn.chatgpt.com/docs/agent-configuration/subagents), [skill format and repo location](https://learn.chatgpt.com/docs/build-skills), [config reference](https://learn.chatgpt.com/docs/config-file/config-reference). The separate [React Router Route Object documentation](https://reactrouter.com/start/data/route-object) supports `route.lazy` with matching `path`/`index` known up front; this repo has not yet adopted it.

## 2. Proposed architecture

Use **six small files** in a future implementation: one root entry point, two optional specialist agents, and three task-triggered skills. Keep the root file short enough to load in every Codex terminal. Put procedures in skills, review lenses in agents, and actual design decisions in `docs/design-system/` and reports. Do not copy the Jobs-to-home Codex profile or make this demo's source layout imitate that repository. Do not add `.codex/config.toml`, `.codex/rules/`, `AGENTS.override.md`, scripts, or duplicate documentation now. A later need for configuration or a nested instruction file must be demonstrated by a concrete conflict that the six-file plan cannot handle.

Proposed relationship: `AGENTS.md` states universal safety and source-of-truth order; `routing-architect` applies `platform-routing` when asked to analyze or implement routing; `ui-reviewer` applies `design-system-ui` or `compare-workflow` when reviewing those surfaces. Skills are also usable directly by the main agent. Neither agent is automatically spawned merely because a file exists. One terminal owns any integration edit to `src/routes/router.tsx`; other terminals work on disjoint platform files or review read-only.

## 3. Agent definitions

| Proposed file | Purpose and trigger | Read scope | Write scope | Required validation and output contract | Relationship |
| --- | --- | --- | --- | --- | --- |
| `.codex/agents/routing-architect.toml` | Optional specialist for a user-assigned route inventory, route design, legacy compatibility, or integration task. TOML `name = "routing-architect"`, concise `description`, and `developer_instructions`; inherit model/effort rather than pinning a model. | `src/routes/`, `src/menu/`, route callers, `src/App.tsx`, `vite.config.ts`, Pages fallback, relevant reports; inspect recovered platform files only when present. | Default read-only for planning/review. On an explicitly authorized implementation task, only the assigned routing and navigation files in that terminal's **external** worktree; no worktree operations or platform theme/form edits. | Return route matrix, owning module/export contract, basename/deep-link reasoning, static vs browser evidence, open collisions. For edits, run `npm run typecheck`, `npm run build`, `git diff --check` when possible, and report failures rather than claiming success. | Uses `platform-routing`; root safety still applies. A single integrator owns the final router composition. |
| `.codex/agents/ui-reviewer.toml` | Optional independent reviewer for UI behavior, Design System state, accessibility, form workflow, and Compare evidence. Required TOML keys as above; inherit model/effort. | Changed UI and adjacent owners, `docs/design-system/`, relevant reports, browser output if actually available. | None; never edit files or approve a production rule. A parent task may separately assign another agent to fix findings. | Findings first with file/route, observable impact, reproduction or source evidence, severity, and unverified checks. Separate static review from browser proof; cite decision labels. | Uses `design-system-ui` and, for worksheet reviews, `compare-workflow`; does not supersede feature owners. |

These agent files are role descriptions, not permission enforcement. [Official subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) says custom agents inherit the parent's sandbox and approval mode. For a genuinely read-only review, launch the parent with an appropriate read-only sandbox as well.

## 4. Skill definitions

Each skill is instruction-only, with YAML `name` and a short, precise `description`; no scripts, assets or copied HDS documents. The description must include its positive trigger and its boundary so automatic matching remains predictable. Direct invocation by `$skill-name` remains available under the [official skill contract](https://learn.chatgpt.com/docs/build-skills).

| Proposed file | Purpose and trigger | Read scope | Write scope | Required validation and output contract | Relationship |
| --- | --- | --- | --- | --- | --- |
| `.agents/skills/platform-routing/SKILL.md` | Use for platform route trees, route metadata, lazy pages, navigation, redirects, deep links, or router integration. Do not trigger for visual-only component work. | Current router/menu/App, platform route exports that exist, route callers, Vite base/404 fallback, route portions of both reports. | No standing write authority. In an authorized implementation, limit writes to assigned platform route metadata/page wiring or the single owned router integration file; preserve feature ownership and external worktree boundary. | Produce current/proposed route matrix; show exact `RouteObject`/export ownership, legacy params/search/hash, child drawer vs sibling page behavior, basename/Pages checks, type/build and browser evidence status. | Detailed routing procedure for `routing-architect` or main agent; root AGENTS carries safety. |
| `.agents/skills/design-system-ui/SKILL.md` | Use for new or reviewed ChatGPT/Compare UI, theme, tables, drawers, forms and accessibility. Do not treat it as a production migration instruction. | `docs/design-system/README.md` then relevant DS pages, target UI/owner files, playground plan; cite copied-doc provenance. | No standing write authority. On an authorized UI task, only assigned platform UI/styles; never edit DS docs, Claude theme, production contracts or form validation ownership without a separate task. | Decision-status matrix (`APPROVED`, `ADOPTED TARGET`, `CANDIDATE`, `LEGACY-COMPATIBILITY`, `NEEDS-TEAM-DECISION`, `NOT VERIFIED`); review contrast, focus, keyboard, errors and responsive evidence; report exact tests and gaps. | Shared procedure for UI work/review; `ui-reviewer` uses it. DS docs remain source of decision labels. |
| `.agents/skills/compare-workflow/SKILL.md` | Use for paired Claude/ChatGPT scenario design, Compare worksheet review, observation capture and decision tracking. Do not trigger for a single-platform feature edit. | `src/compare/`, scenario routes that actually exist, T3 report, integration audit, plan and relevant experimental behavior. | No standing write authority. On an authorized Compare task, only `src/compare/` and its specifically requested report; router mount remains integrator-owned. | Return scenario/criterion matrix, available vs unavailable destinations, separate observed vs inferred results, evidence identifiers, decision status/owner/rationale, CSV/localStorage limits; never mark a recommendation approved without a team decision. | Applies `design-system-ui` only for visual/accessibility checks; does not duplicate DS values. |

## 5. File ownership matrix

| Area | Proposed owner | Shared boundary and rule |
| --- | --- | --- |
| Root `AGENTS.md` | Repository maintainers | Global safety and source order only; no detailed route or token tables. |
| `.codex/agents/routing-architect.toml`, `.codex/agents/ui-reviewer.toml` | Codex profile maintainers | Role-specific behavior; no copied profile from Jobs-to-home. |
| `.agents/skills/{platform-routing,design-system-ui,compare-workflow}/SKILL.md` | Corresponding workflow owners | Procedures and outputs; link to docs rather than copying decisions. |
| `src/routes/router.tsx`, root `/` and legacy mapping | One designated integration terminal | Imports platform route exports, owns basename and root behavior. No platform module independently edits it during parallel work. |
| Claude menu/feature navigation | Claude routing owner | Preserve screen behavior, nested drawers, sibling full pages and all legacy URLs. |
| Future `src/chatgpt/` route metadata/pages/theme | ChatGPT platform owner | Exports a relative platform route tree; independent menu and scoped theme. Not currently available. |
| `src/compare/` metadata/pages/records | Compare platform owner | Existing `compareRoute` stays relative; router mount is integration-owned. |
| `docs/design-system/` | Existing DS decision owners | Copied reference evidence; profile does not alter approval state or broken reference-repo paths by implication. |
| Reports in `docs/reports/2026-11-07/` | Task author/integrator | Record evidence, gaps and decisions; reports do not grant source ownership or prove browser behavior. |

## 6. Parallel terminal safety

Root `AGENTS.md` should instruct each terminal to run `git status --short --branch`, `git rev-parse HEAD` and `git worktree list --porcelain` before changes, name the exact branch, revision, worktree path and owned files, and recheck before integration. **Never create `.worktrees/` inside the repository.** All auxiliary worktrees must resolve outside the main checkout; do not use CLI `--worktree` until its destination behavior is verified to satisfy that constraint. Never automatically clean, prune, reset, merge, cherry-pick or discard worktree changes. Missing T1/T2 directories are a recovery issue, not an invitation to recreate them over stale registrations. Preserve uncommitted reports and source, and coordinate one writer per shared file. Do not modify Claude Code profiles, install dependencies, commit, push or deploy unless the user gives a later task that explicitly authorizes the particular action; this planning task authorizes none. The [integration audit](parallel-worktree-integration-audit.md) is the current recovery status, not a substitute for new verification.

## 7. Lazy routing and metadata rules

**Target proposal, not current code:** each platform owns its route metadata and page imports, exporting a relative `RouteObject` tree or a function that returns one. The central router owns only composition of `/`, `/claude/*`, `/chatgpt/*`, `/compare/*`, explicit legacy redirects and the single basename. Existing `compareRoute` provides one export example; T1/T2 export names cannot be assumed until their source is recovered. Path, `index`, nested children and stable route IDs/labels needed for matching/navigation remain statically available. Heavy page implementation may use React Router data-router `route.lazy`; do not confuse this with Framework Mode lazy route discovery or move matching-critical `path` into a lazy module. Verify the API against the installed React Router 7.1.1 types before an implementation change, since current online docs may describe newer 7.x behavior. Keep menu/breadcrumb metadata with its platform and define one explicit adapter where route metadata and UI navigation differ. Do not share live form state, theme ownership or status mappings across platforms merely to reduce files.

Legacy Claude URLs must map explicitly to the corresponding `/claude/*` path with params, query and hash; root behavior changes only in its planned phase. Preserve the existing list-child drawer vs full-page sibling route topology and direct-load close destinations. Keep `import.meta.env.BASE_URL`, Vite's `/demo-layout/` default and `dist/404.html` Pages fallback. Both route metadata and lazy chunks need direct deep-link and asset-path browser checks before claiming compatibility. [React Router route-object reference](https://reactrouter.com/start/data/route-object).

## 8. Design System governance

Read [DS index](../../design-system/README.md) before relevant pages. The copied documents include reference-repository source paths and profile links that are **not target checkout files**. Treat them as evidence with provenance, then inspect this repo's actual source. The [plan](hds-admin-next-design-playground-plan.md) records DS-01 numeric-scale conflict: its prototype values are specified while the copied typography document labels the scale **CANDIDATE**. Do not silently promote it to a production rule. DS-03's 2026-11-06 addendum supersedes historical brand values; focus, hover, active, navigation, disabled and runtime token ownership remain open. DS-02 preserves Scheme Sync feature semantics and Be Vietnam Pro; DS-05 keeps six StatusBadge variants with error and accent distinct and domain-owned mappings. DS-04 sets WCAG 2.2 AA as a target, not a compliance claim. Ant Design `Form`/`FormInstance` remains form-state owner; do not introduce React Hook Form or alter production validation contracts. Prototype fixtures stay fictional, with no production API/customer data or secrets.

The root entry should state these governance principles and point to the DS index; the `design-system-ui` skill owns the step-by-step review. No duplicate token table belongs in an agent TOML or AGENTS.md.

## 9. Report and validation contracts

Every future task report or review should state branch/revision and worktree path; changed/owned files; evidence sources; verified findings, inference and proposals separately; commands run and their exact results; browser checks actually performed; risks, unverified items and `NEEDS-TEAM-DECISION`. For implementation tasks, use actual `package.json` scripts: `npm run typecheck`, `npm run build`, and `git diff --check` when available. `npm run build` includes the Pages fallback copy. Run targeted route/drawer/form/keyboard/responsive/browser checks when tooling exists and record their results; a static code review or successful typecheck does not establish browser behavior or WCAG conformance. For a documentation-only task, report validation can be limited to the requested file inventory, link/path checks and whitespace check, with no claim of runtime testing.

## 10. Implementation order

1. Resolve or explicitly classify T1/T2 recovery; re-inventory branch, reports and route exports before treating either as implemented.
2. Add the concise root `AGENTS.md`, checking that its source order and guardrails are compatible with the current checkout. Do not copy the reference profile.
3. Add the three instruction-only skills with distinct descriptions, then the two agent TOMLs that refer to them. Keep model and config defaults inherited.
4. Verify discovery in a fresh Codex CLI session, inspect `codex --strict-config --help`/appropriate local diagnostics without mutating configuration, and dry-run read-only prompts for each agent/skill. Confirm agent instruction loading and skill matching; do not assume file presence proves it.
5. Only in a separate, authorized implementation task, apply the platform routing and UI procedures in external worktrees, one shared-file owner at a time, then run combined validation from the integration audit.

## 11. Risks and unverified assumptions

- **Recovery:** T1/T2 reports and source are absent; proposed route exports and feature ownership are hypotheses until recovered or rebuilt. No existing worktree was altered here.
- **Concurrent terminals:** the main branch advanced during the prior audit. A report's revision is a snapshot; stale worktree registrations and other terminal edits can invalidate it quickly.
- **Profile compatibility:** official documentation describes the agent/skill file contracts, but the proposed files have not been created or loaded by the installed CLI. The installed CLI version can change; run a discovery check at implementation time. User-level config may affect sessions and was not fully audited for secrets or policy.
- **Source mismatch:** copied HDS docs describe a different application architecture and contain nonlocal links. The target does not have those referenced production components or Redux layouts.
- **Routing:** lazy page and platform metadata ownership are proposed architecture; there is no implementation, route/browser test, asset-path test or Pages deployment proof in this task.
- **Governance:** DS-01 numeric approval conflict and unresolved interaction tokens remain open. Static documentation cannot certify WCAG 2.2 AA.

## 12. NEEDS-TEAM-DECISION

1. Confirm recovery owner and disposition for missing T1/T2 worktrees/reports before assigning implementation work or accepting their contracts.
2. Assign the sole root-router/landing integration owner and decide the exact platform route export shape after inspecting recovered source.
3. Confirm an external auxiliary-worktree parent path and terminal ownership protocol; keep stale registrations untouched until recovery evidence is preserved.
4. Reconcile DS-01 numeric-scale status and unresolved DS-03 interaction/focus/runtime ownership before production rule language is added anywhere.
5. Decide the browser/device matrix and evidence threshold for route, drawer, Compare and accessibility acceptance. No browser acceptance occurred in this planning task.
