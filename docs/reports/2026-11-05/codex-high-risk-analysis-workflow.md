# HIGH-RISK analysis-to-review workflow

## 1. Branch, revision, and date

- Date: 2026-11-05 (Asia/Ho_Chi_Minh).
- Branch: `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung`.
- HEAD: `1f1f9f31eae3a48f66362753bd63d4428767a91d`.
- Existing Banner validation report reviewed: `docs/reports/2026-11-05/codex-analyzer-quality-validation.md`.

## 2. Current workflow

`AGENTS.md` names the analyzer and reviewer for their respective read-only roles and tells sessions to select skills from `.agents/skills/`. `analyze-module` asks `codebase-analyzer` for a map when delegation is authorized; `review-code` asks `frontend-reviewer` to review diffs when authorized. The agent TOMLs already define read-only boundaries and source-backed output. General and architecture rules already require consumer/API/permission analysis and define risk categories, including HIGH-RISK for payload lifecycle and cross-domain/shared behavior.

## 3. Confirmed gaps

The shared rules defined the checks but did not require a high-risk analysis to receive independent review before being used as an implementation plan. No instructions defined what the reviewer should verify in an analysis, how CHANGES REQUIRED findings return to the analyzer, or how to bound correction and re-review. `review-code` was framed around diffs and pre-merge review, so it did not clearly trigger for an impact analysis. The Banner quality report demonstrates the consequence: the analyzer captured the three original findings after its instruction update, but the reviewer still found missing shared upload and view-status callers, a form/payload mapping discrepancy, and an imprecise risk example.

No duplicate engineering rules were added. The gap was workflow orchestration, not missing architecture policy.

## 4. Files modified

- `.agents/skills/analyze-module/SKILL.md`: added a HIGH-RISK analysis gate and one bounded correction cycle.
- `.agents/skills/review-code/SKILL.md`: made independent HIGH-RISK analysis review an explicit trigger and specified review criteria, verdict, and recheck limit.
- `docs/reports/2026-11-05/codex-high-risk-analysis-workflow.md`: this local-only report.

No application source, agent TOML, architecture decision, `.claude/`, or `.gitignore` was changed. `.agents/skills/` and `docs/` are ignored/local-only under the existing repository policy; tracking policy was not changed.

## 5. New coordination flow

1. `codebase-analyzer` creates a source-backed impact analysis with evidence, inference, unknowns, risk, and bounded scope.
2. `frontend-reviewer` independently reads the same source snapshot and verifies direct/indirect consumers, API/upload callers, form-to-payload lifecycle, state ownership, routing/permissions, highest applicable risk, and evidence versus inference.
3. Reviewer reports `PASS` or `CHANGES REQUIRED`. PASS approves only the static impact analysis; it says nothing about live runtime behavior.
4. For CHANGES REQUIRED, provide source-backed findings to the analyzer for one revision. Then the reviewer rechecks the corrected analysis against source.
5. If material/high-risk gaps remain after that one cycle, report `PARTIAL` or `BLOCKED`; keep the analysis unapproved for implementation. Do not silently pass it or loop indefinitely.
6. Keep both agents read-only and use the same frozen revision/worktree. If either agent cannot run independently or inspect that snapshot, disclose the limitation and do not claim the gate passed.

The analyzer/reviewer responsibilities and existing output contracts are preserved. Only the two relevant skills coordinate the sequence.

## 6. Risk and approval gates

The existing `.codex/knowledge/ARCHITECTURE.md` risk rules remain authoritative. Any highest applicable HIGH-RISK row governs. A HIGH-RISK analysis is a draft until independent review passes. One correction and one recheck are permitted. Unresolved material risk yields PARTIAL/BLOCKED, not approval. Reviewer PASS is not browser, authentication, permission-backend, API, device, or production verification; those remain separately stated evidence gaps.

## 7. Validation evidence

- Confirmed current skill discovery: Codex lists `.agents/skills/analyze-module/SKILL.md` and `.agents/skills/review-code/SKILL.md`; both names are also referenced from `.codex/README.md` usage guidance.
- Checked both YAML frontmatter blocks for opening/closing delimiters plus required `name` and `description`; passed.
- Checked workflow references and cross-links to the named agents, knowledge, and rules; referenced paths exist. Existing documentation hierarchy remains rooted at `AGENTS.md`.
- Inspected `.codex/rules/00-general.md` and `.codex/rules/01-architecture.md`, the agent TOMLs, and both skills before editing. No TOML change was needed.
- Static Banner regression check against the prior validation report:

| Prior Banner finding | Workflow now requires verification in |
| --- | --- |
| Indirect consumers through `defaultPageComponents` | Analyzer graph; reviewer direct/indirect consumer check |
| Direct `UploadImage.tsx` and shared upload callers | Analyzer caller map; reviewer API/upload caller check |
| Upload key through form to request payload and risk | Analyzer lifecycle/risk; reviewer lifecycle and highest-risk check |
| Remaining gaps after initial analyzer output | CHANGES REQUIRED → one analyzer correction → reviewer recheck → PARTIAL/BLOCKED if unresolved |

- The static Banner check verifies that the required workflow addresses each known finding. No agent was executed against Banner at the current HEAD as part of this change; therefore the revised workflow's runtime activation and end-to-end correction cycle are unverified here.
- No application build or tests were run; this change updates Markdown skill instructions only.

## 8. Remaining limitations

Agent availability and cross-agent coordination depend on the active Codex session. Skills cannot force the runtime to activate a named agent or enforce filesystem permissions; the instructions require disclosure when delegation is unavailable, and actual sandbox settings still govern writes. This validation did not demonstrate the new multi-step cycle in a live agent run. Repository ignores leave these skill/report edits local-only unless the existing tracking policy changes separately.

## 9. Final recommendation

Use `$analyze-module` for impact analysis. If its classification is HIGH-RISK, do not use the output as an implementation plan until `$review-code` returns PASS on the same source snapshot. On CHANGES REQUIRED, allow one analyzer correction and one reviewer recheck. Treat unresolved findings as PARTIAL/BLOCKED and investigate listed runtime unknowns separately before making runtime claims.
