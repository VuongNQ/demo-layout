# Codex custom-agent runtime validation

- **Validation date:** 2026-11-05 (Asia/Ho_Chi_Minh)
- **Repository:** HDS Admin
- **Branch:** `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung`
- **Revision at start:** `5faf27a510ce24bc41b030f059b0040bb9b1267d`
- **Revision at final check:** `7d7f4df2f9f4b92a989d62f0ec1cfc61703ac8f7`
- **Tested module:** `src/modules/contents/banner/`
- **Final result:** **PASS for real activation of both tested custom agents.** The independent review gave the analysis **CHANGES REQUIRED**; that is an output-quality verdict, separate from activation.

## Agents and invocation method

| Agent | Custom config | Task | Runtime method |
| --- | --- | --- | --- |
| `codebase-analyzer` | `.codex/agents/codebase-analyzer.toml` | Read-only Banner module impact map | `codex exec --json --sandbox read-only --enable multi_agent -C <repo> -o /tmp/hds-codebase-analyzer-output.txt <coordinator prompt>`; coordinator called `spawn_agent` with `agent_type: "codebase-analyzer"`, `task_name: "banner_analysis"`. |
| `frontend-reviewer` | `.codex/agents/frontend-reviewer.toml` | Independent source review of the analyzer's full final answer | Separate `codex exec --json --sandbox read-only --enable multi_agent -C <repo> -o /tmp/hds-frontend-reviewer-output.txt <coordinator prompt>`; coordinator called `spawn_agent` with `agent_type: "frontend-reviewer"`, `task_name: "banner_analysis_review"`. |

The analyzer's child final answer was saved to `/tmp/hds-codebase-analyzer-agent-output.txt` and passed as input to the second run. The reviewer did not use the first coordinator's short summary. Both runs explicitly prohibited edits and used the CLI's read-only sandbox. `AGENTS.md`, `.codex/knowledge/PROJECT_CONTEXT.md`, `.codex/knowledge/ARCHITECTURE.md`, relevant rules, `docs/modules/contents/OVERVIEW.md`, and `BANNER.md` appeared in the agent rollouts.

## Runtime activation evidence

Evidence comes from **Codex's persisted rollout events**, not from the coordinator's assertion that an agent ran. The `codex exec --json` stdout streams were also saved at `/tmp/hds-codebase-analyzer-events.jsonl` and `/tmp/hds-frontend-reviewer-events.jsonl`; those compact streams did not themselves expose the `spawn_agent` arguments, so the persisted rollouts were inspected.

| Agent | Parent rollout evidence | Separate child execution | Custom configuration evidence |
| --- | --- | --- | --- |
| `codebase-analyzer` | Parent thread `01a1a9b2-dd1b-7e70-9ca6-3af6cca682df`, rollout ordinal **64**: `collaboration.spawn_agent` with `agent_type="codebase-analyzer"`; ordinals **66** and **76**: `SubAgentActivity` started and completed. | Child thread `01a1a9b3-7c42-7f33-8e2b-ac47f38f30ba`, path `/root/banner_analysis`, with its own source reads and final answer. | Child rollout contains the custom TOML developer instruction beginning `Analyze only. Never edit, create...`. |
| `frontend-reviewer` | Parent thread `01a1a9b5-dee7-70a3-bee3-15aa931b2bd1`, rollout ordinal **17**: `collaboration.spawn_agent` with `agent_type="frontend-reviewer"`; ordinals **19** and **36**: `SubAgentActivity` started and completed. | Child thread `01a1a9b6-2959-7fd0-be5d-950bdd305b8c`, path `/root/banner_analysis_review`, with its own source reads and final answer. | Child rollout contains the custom TOML developer instruction beginning `Review only; never edit, create...`. |

The parent rollout files are under `~/.codex/sessions/2026/11/05/` and end in the parent thread IDs above; the child rollout files end in the child thread IDs. The distinct child IDs, explicit `agent_type` arguments, started/completed activity, loaded custom instructions, and separate child final answers distinguish these runs from simulated role-based responses.

## Agent outputs

**Analyzer:** Mapped Banner list/priority/status, create/edit/view, uploads, and simulation. It identified guarded lazy routes and `BANNER_SETTING_*` permissions, Redux ownership for existing Banner data and mutations, Query ownership for simulation results, shared carousel/Splash Screen/Exclusive Touch consumers, and two independent `GET screen/all` callers. It marked backend behavior, unsaved-reorder browser behavior, and cache authority as unverified. Full output: `/tmp/hds-codebase-analyzer-agent-output.txt`.

**Reviewer:** **CHANGES REQUIRED** before using that analysis as a change plan. It found omitted carousel consumers through `defaultPageComponents` in `PopupPreview` and `BackgroundMainPreview`; an omitted direct-upload caller in `Banner/components/UploadImage.tsx`; and an incorrect **MODERATE** rating for changes to upload-to-payload lifecycle, which `ARCHITECTURE.md` classifies as **HIGH-RISK**. It confirmed the other central source claims and noted that a source-confirmed self-fetch path is not proof of a successful request at runtime. Full output: `/tmp/hds-frontend-reviewer-agent-output.txt`.

## Configuration, permissions, and limits

- Both `.toml` custom agents were available to the runtime through named `agent_type` selection. The current top-level collaboration tool schema exposed to this session does not offer an `agent_type` argument, so the actual named-agent calls were made by the Codex CLI coordinator. Its persisted rollout records the internal `agent_type` arguments.
- The first local-shell attempt for each `codex exec` failed with `failed to initialize in-process app-server client: Operation not permitted (os error 1)`. Re-running the CLI command with shell escalation allowed the runtime to start; the **inner Codex session remained `--sandbox read-only`**. No project configuration or permission file was changed.
- Custom-agent instructions alone do not enforce read-only filesystem access. This validation used the parent CLI sandbox for that guarantee. Agent rollouts show read/search commands and no application-file edits by these runs.
- The branch revision and unrelated dirty source files changed during validation, apparently from concurrent activity. The analyzer and reviewer therefore may not have inspected one immutable source snapshot. This does not affect the activation evidence, but limits reproducibility of the analysis verdict. No application source, Claude configuration, or Codex configuration was edited by this task.

## Unverified capabilities

- No live browser, authenticated permission flow, backend API, upload request, or unsaved-reorder interaction was tested. `feature-implementer`, `legacy-refactorer`, custom model overrides, write-mode permissions, and parallel-agent coordination were not tested.
- This report is local-only: `docs/*` is ignored by the existing `.gitignore` policy.
