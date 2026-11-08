# Codex knowledge relocation

- **Migration date:** 2026-11-05 (Asia/Ho_Chi_Minh)
- **Branch:** `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung`
- **Revision:** `5faf27a510ce24bc41b030f059b0040bb9b1267d`
- **Scope:** AI configuration and documentation only. `docs/*` remains ignored by `.gitignore`, so this report is local-only.

## Files moved

| Original | Destination | SHA-256 before and after |
| --- | --- | --- |
| `PROJECT_CONTEXT.md` | `.codex/knowledge/PROJECT_CONTEXT.md` | `0e26098b5d20218195743e0cede6d75a1e4f72a6c95f0196ba7e59f8a87eb7f4` |
| `ARCHITECTURE.md` | `.codex/knowledge/ARCHITECTURE.md` | `0a8020d2a8d6417dd5f4b38f6554b2066925181ea95411ed0355efa77ffe62f1` |

Both were moved by rename. Their bytes were not edited. The old root paths are absent.

## Files updated and references changed

- Root `AGENTS.md`: explicitly orders reading `.codex/knowledge/PROJECT_CONTEXT.md` for current project facts, then `.codex/knowledge/ARCHITECTURE.md` for adopted/target architecture and legacy compatibility, then relevant Codex rules. Its risk-classification link now points to the new architecture path. It remains the primary Codex entry point.
- `.codex/README.md`: updates the active source-of-truth hierarchy, migration mapping, and manual validation example. Historical `.claude/...` source references remain historical.
- `.codex/agents/codebase-analyzer.toml`, `feature-implementer.toml`, `frontend-reviewer.toml`, `legacy-refactorer.toml`: update required reading paths only.
- `.codex/rules/00-general.md`, `04-state-management.md`: update active knowledge references only.
- `.agents/skills/analyze-module/SKILL.md`, `audit-redux-ownership/SKILL.md`, `extract-thunk-service/SKILL.md`, `fix-bug/SKILL.md`, `implement-feature/SKILL.md`, `refresh-context/SKILL.md`, `review-code/SKILL.md`, `trace-feature-flow/SKILL.md`: update required reading and, where applicable, documentation output paths only.
- `docs/modules/products/OVERVIEW.md` and `docs/modules/products/popular-loans.md`: update their current guidance references to the relocated knowledge files. These files remain local-only under `docs/*`.

The agent roles, skill triggers, execution workflows, rule hierarchy, and Claude configuration were not changed. `.gitignore`, application source, package files, and CI were not edited in this relocation.

## Validation

- SHA-256 hashes before and after match for both moved documents; both target files exist, and both old root files are absent.
- A search of active Codex entry-point, agents, skills, rules, and README found **zero** bare references to the old root document paths. Historical references inside the two knowledge documents remain byte-for-byte unchanged by requirement.
- All explicitly referenced Codex instruction files exist. Local links from `AGENTS.md` resolve. `AGENTS.md` presents the required reading order: context, architecture, rules.
- All four custom-agent TOML files parsed with `pip._vendor.tomli`; all eight skill frontmatters parsed with the repository's `js-yaml`.
- `codex debug prompt-input` included root `AGENTS.md` and both new knowledge paths in a fresh CLI invocation.
- `git diff --check` passed. `git check-ignore -v` confirms this report is ignored by the existing `docs/*` rule.

## Unverified items and remaining risks

- A live task did not spawn a custom agent or exercise its runtime behavior after this relocation. Prompt discovery and static parser checks do not prove custom-agent activation.
- The knowledge documents contain historical bare names and references, including references to each other. Their content was deliberately preserved exactly; readers should resolve current Codex knowledge paths through root `AGENTS.md`.
- Dated reports under `docs/audits/` and older `docs/reports/` retain historical bare document names and line citations as records of their original reviews. They are not Codex instruction entry points; current paths are given by `AGENTS.md`.
- `.codex/rules/05-form.md` has an existing optional link to `docs/audits/components/form-components-audit.md`, which is absent in this checkout. The rule itself says the report may be absent and current source remains authoritative. This is not a missing Codex instruction file.
- The repository already had unrelated dirty files, including `.gitignore` and application source, at the start of this task. This relocation did not change them.
