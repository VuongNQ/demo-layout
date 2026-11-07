# demo-layout Codex CLI profile implementation

**Author:** Vuowng

**Date:** 2026-11-07

**Branch/revision:** `feat/playground-compare` at `05a527ecb9510f83013589cb7692d905f4770d80`

**Worktree:** `E:\demo-layout` (main repository checkout)

## Scope and files created

Implemented the six files specified by the [approved profile plan](demo-layout-codex-profile-plan.md):

| File | Contract |
| --- | --- |
| `AGENTS.md` | Concise repository entry point: source order, platform ownership, one router integrator, Claude compatibility, DS governance, external worktree safety, validation and report requirements. |
| `.codex/agents/routing-architect.toml` | Custom agent with `name`, `description`, `developer_instructions`; defaults to read-only routing analysis and uses `platform-routing` when relevant. Implementation requires explicit assignment and a single router owner. |
| `.codex/agents/ui-reviewer.toml` | Custom read-only reviewer using `design-system-ui` and `compare-workflow` when relevant; findings first with severity, evidence and unverified checks. |
| `.agents/skills/platform-routing/SKILL.md` | Platform route/metadata/lazy-page and legacy-link workflow; requires route matrix and separates static checks from runtime proof. |
| `.agents/skills/design-system-ui/SKILL.md` | UI/DS review workflow; preserves decision labels, Ant Design form ownership and scoped styles; requires accessibility and form checks. |
| `.agents/skills/compare-workflow/SKILL.md` | Paired scenario/evidence workflow; verifies destination availability, independent storage and CSV handoff limits; recommendation cannot become approval automatically. |

No project config file, extra rule, script, UI asset or dependency was added. No application, Design System, `.gitignore`, Claude Code profile, user-level Codex configuration or worktree was changed. The previously untracked plan and integration audit remain untouched.

## Evidence and contracts

`codex --version` reports **`codex-cli 0.167.0`**. [Official OpenAI documentation for custom agents](https://learn.chatgpt.com/docs/agent-configuration/subagents) specifies project `.codex/agents/*.toml` with required `name`, `description`, `developer_instructions`; agents inherit parent permissions. [Official skill documentation](https://learn.chatgpt.com/docs/build-skills) specifies repo `.agents/skills/<name>/SKILL.md` with YAML name/description. [AGENTS.md documentation](https://learn.chatgpt.com/docs/agent-configuration/agents-md) describes project instruction discovery. The agent files deliberately omit model and reasoning-effort settings. `AGENTS.md` and the skills do not claim to enforce sandbox permissions.

The current source remains at the pre-integration architecture: unscoped `src/routes/router.tsx` and menu, committed but unmounted `src/compare/`, and no `src/chatgpt/`. The [worktree audit](parallel-worktree-integration-audit.md) still records missing T1/T2 directories/reports; this task did not attempt recovery. The [playground plan](hds-admin-next-design-playground-plan.md) and copied [DS index](../../design-system/README.md) were read as design evidence, not proof of target runtime behavior.

## Profile discovery and smoke results

The first `codex debug prompt-input profile-smoke` attempt was denied temporary runtime access by the sandbox. The same **read-only diagnostic** succeeded with approved escalation. Filtering its JSON output confirmed:

- The model-visible input included `# AGENTS.md instructions for E:\demo-layout`.
- The skill catalog included all three names: `platform-routing`, `design-system-ui`, `compare-workflow`.
- Custom agent tool metadata included `routing-architect` and `ui-reviewer`.

Fresh `codex --ask-for-approval never --sandbox read-only exec --ephemeral -` prompts explicitly invoking each skill returned the expected read-only output boundary: routing matrix/export/deep-link evidence, DS decision-status and accessibility evidence, and paired Compare observations/approval boundary, respectively. These prompts asked for no shell tools or edits. They verify invocation and instruction interpretation, **not** a route/browser/UX result.

An ephemeral attempt to invoke both custom agents failed with `collab spawn failed: ... no rollout found for thread id`; it was stopped. A fresh **non-ephemeral, read-only** CLI session then requested both agents and returned their distinct one-sentence scopes. CLI output showed `collab: Wait` and the final role summaries, but did not provide a per-agent transcript in this audit. This is a limited invocation smoke, not proof of future agent decisions. Neither run changed repository files. The non-ephemeral run may have written normal Codex session history; it did not modify user-level configuration.

## Validation commands and results

| Command/check | Result and limit |
| --- | --- |
| `git status --short --branch`, `git rev-parse HEAD`, `git worktree list --porcelain` | Branch/revision and stale T1/T2 registrations recorded before edits. No worktree operation performed. |
| `codex --version`, `codex --help`, official docs | Installed version and local CLI options verified; official agent/skill contracts checked. |
| Six-file `type` read plus schema-specific frontmatter/TOML structure check | All six files read successfully; required keys, exact names, delimiters, final newline and no trailing whitespace passed. This is a focused structural check, not an independent general-purpose YAML/TOML parser. |
| `codex debug prompt-input profile-smoke` | Succeeded with approved escalation; found root guidance, both agents and all three skills in model-visible input/tool metadata. |
| Three read-only skill `codex exec` prompts | All completed successfully and summarized their requested boundaries; no source/browser checks requested. |
| Read-only custom-agent `codex exec` | Ephemeral spawn failed because no rollout existed; non-ephemeral retry completed with both role summaries. |
| `codex doctor --summary --no-color --ascii` | Config/auth loaded; provider endpoint reachability failed in this environment, despite the subsequent read-only CLI smoke sessions succeeding. Not a profile-format failure. |
| `git diff --check` | Passed, but Git does not include the new untracked files in this check. A separate six-file whitespace scan found no trailing whitespace. |
| `rg --files --hidden .agents .codex`; `git status --short --branch` | Exactly five files under the two profile directories plus root `AGENTS.md`; only these profile paths were created. Existing two untracked reports preserved. |

The bundled skill-creator `quick_validate.py` was not run because this environment has no Python executable, and installing one is outside scope. CLI discovery and focused structure checks provide the available format evidence. `npm run typecheck`, `npm run build` and browser tests were not run because no application source changed; no application runtime claim is made.

## Deviations from the approved plan

The six-file architecture and paths match the plan. Validation used the installed CLI prompt-input diagnostic and focused structural checks rather than the Python skill validator. Custom-agent smoke required a non-ephemeral read-only session after the ephemeral spawn limitation. No extra profile/config file was needed.

## Risks and unverified behavior

- Agent instructions are behavioral guidance and cannot restrict the parent sandbox; future reviewers need a read-only parent session for permission-level protection.
- T1/T2 recovery and the planned platform route exports remain unresolved. Profile text intentionally requires inspecting actual source rather than treating planned routes as present.
- Smoke prompts demonstrate discovery and a narrow response to each role/skill; they do not prove every trigger, implementation behavior, browser workflow, accessibility result or GitHub Pages deep link.
- `codex doctor` reported network reachability and Windows runtime warnings. Those diagnostics may affect future sessions independently of profile content.
- The copied Design System documents contain source paths from Jobs-to-home and a DS-01 numeric scale status conflict. The profile points readers to decision labels rather than duplicating candidate token values.

## NEEDS-TEAM-DECISION

1. Resolve T1/T2 recovery and choose the single root-router integration owner before any route implementation.
2. Reconcile DS-01 numeric-scale approval and unresolved DS-03 interaction/runtime token ownership before expressing either as production policy.
3. Set the browser/device and evidence threshold for eventual route, form, theme and Compare acceptance. This profile task did not perform that validation.
