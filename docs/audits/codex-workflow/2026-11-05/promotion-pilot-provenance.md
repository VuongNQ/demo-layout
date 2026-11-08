# Promotion SAFE Pilot: Git State and Implementation Provenance Audit

## 1. Executive summary and verdict

**Verdict: PARTIAL.** The Promotion source change itself matches the approved four-file, behavior-preserving SAFE consolidation. Git history, reflog, source snapshots, and Codex session logs establish multiple key events, but they do not establish who caused the later worktree mutation or who initiated the commit and push. The final commit also includes four unrelated unlock-request files, including an API response-null behavior change that was outside the pilot and was not independently reviewed as part of that commit.

Confirmed: the current branch is `improve/vuongnq/redux-service`, HEAD is `8977a1c7c8dbc3e2e70ca197051ef11eb3055afb`, the worktree is clean, and the matching `origin/improve/vuongnq/redux-service` ref points at the same commit. Reflog records a branch creation from the original `129f2a1a` HEAD, then the commit at 11:45:19 +07 and a remote-ref update by push at 11:45:44 +07.

The earliest accessible implementation transcript shows a real `feature-implementer` child applying the four-file Promotion patch. In the later explicitly requested pilot run, however, the target files were clean at 11:42:13 +07; the patch appeared by 11:42:27, before that run spawned its `feature-implementer` at 11:42:40. The later agent applied a recorded one-line correction to the constant, but it did not author the already-present remainder of the patch. Therefore the first full patch is attributable to the earlier child, the later full patch's reappearance is unattributed, and the final commit initiator is not identifiable from available evidence.

## 2. Investigation date, branch, and revision

- Investigation date: 2026-11-05, Asia/Ho_Chi_Minh.
- Current branch: `improve/vuongnq/redux-service`.
- Current HEAD: `8977a1c7c8dbc3e2e70ca197051ef11eb3055afb`.
- Current remote-tracking ref: `origin/improve/vuongnq/redux-service` at the same revision.
- Current worktree/index status: clean (`git status --short --branch` shows only branch tracking status).
- Pilot starting branch/revision verified in the current-run session: `develop` at `129f2a1a6be8ff633d399927cf85ae385d0b27d6`.
- The report is ignored/local under the existing `.gitignore` rule `docs/*`. No repository tracking policy was changed.

## 3. Evidence sources and limitations

### Direct evidence inspected

- `AGENTS.md`, `.codex/knowledge/PROJECT_CONTEXT.md`, `.codex/knowledge/ARCHITECTURE.md`, `.codex/rules/00-general.md`, `.codex/rules/08-refactoring.md`, `.codex/rules/09-testing.md`, and the previous implementation result report.
- Read-only Git state/history: `git status`, `git rev-parse`, `git log --all`, `git show`, `git diff`, `git diff-tree`, `git merge-base`, `git cat-file`, and `git reflog --all --date=iso-strict`.
- Codex session logs under `~/.codex/sessions/2026/11/05/`, including the earlier implementation run, the later rerun, and their child sessions.
- Current Promotion and unlock-request source. No runtime UI, authenticated API, or backend test was performed in this investigation.

### Evidence boundaries

- Git author/committer fields and reflog identities record configured Git identities and ref operations; they do not prove which human, IDE, automation, or agent initiated them.
- A custom-agent spawn proves invocation and child execution, not that the child authored every change visible in a shared worktree.
- Codex session logs cover those sessions only. They cannot exclude an editor, another Codex process, shell, Git GUI, automation, or other process outside those logs.
- The previous implementation result report is a coordinator-authored narrative, not an independent Git event log. Its claims were checked against the raw Git/session evidence below.
- Reflog does not record the reset mode, exact command line, or reason for branch creation. No destructive recovery or index inspection was attempted.

## 4. Reconstructed timeline

All times below are local time (+07:00) unless stated otherwise.

| Time | Event | Evidence and confidence |
| --- | --- | --- |
| 10:13:17 | Commit `7d7f4df` added the unlock-request service, types, barrel export, and Redux slice delegation on `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung`. | Git commit metadata and diff. Confirmed. |
| 10:44:33 | Commit `1f1f9f3` cleaned the unlock service by removing an interface and changing a type import. | Git commit metadata and diff. Confirmed. |
| 11:33:07–11:35 | A separate Codex run spawned child `01a1a9fb-6416-7593-90d0-5a9c635981d1` as `feature-implementer`. Its persisted tool input contains an `apply_patch` for all four Promotion files; its later diff shows those edits. The parent ran targeted Prettier and typecheck and spawned a reviewer. | Session `rollout-2026-11-05T11-32-14-01a1a9fa-93e3-7d52-801f-b1f74bd35511.jsonl` and child `rollout-2026-11-05T11-33-07-01a1a9fb-6416-7593-90d0-5a9c635981d1.jsonl`. Direct write-event evidence for the first implementation. |
| 11:39:12 | Reflog records `reset: moving to HEAD` while HEAD is `1f1f9f3`. | Git reflog. Confirmed event; reset flags and purpose unknown. |
| 11:39:16 | Reflog records checkout from the feature branch to `develop`, HEAD `129f2a1a`. | Git reflog. Confirmed. |
| 11:41:01 | The later pilot's parent session begins its repository checks on `develop` at `129f2a1a`. It sees four dirty/untracked unlock-request paths. | Parent session `01a1aa02-791f-7692-bdde-f009af5909f5`, command event ordinal 19. Confirmed. |
| 11:41:56 | Reflog records creation of `improve/vuongnq/redux-service` from the then-current `HEAD` (`129f2a1a`). | Git reflog. Confirmed; no reason is recorded. |
| 11:42:13 | The current-run parent checks `git diff --quiet` for the four approved Promotion files; exit indicates they are clean. | Parent session `01a1aa02-791f-7692-bdde-f009af5909f5`, command event ordinal 69. Confirmed. |
| 11:42:27 | The same parent executes a read-only `git status`/`git diff`; all four Promotion files now contain the consolidation, with `as const` on the new constant. The parent command itself contains no edit. | Parent session, command event ordinal 78. Confirmed. |
| 11:42:40 | The current-run parent spawns `feature-implementer` child `01a1aa04-2331-7af2-9ff0-24cabcd3929f`. | Parent session function-call ordinal 83; child session metadata. Confirmed. |
| 11:42:48 | The child’s first recorded command sees the complete Promotion diff and the unrelated unlock-request paths. It later states the patch appeared before its inspection and its original author was unknown. | Child session command event ordinal 60 and final response. Confirmed as child observation/report. |
| 11:42:56 | The current-run feature-implementer applies a recorded patch changing only `OFFER_EMPTY_DISPLAY = '—' as const` to the approved exact declaration `OFFER_EMPTY_DISPLAY = '—'`. | Child session `01a1aa04-2331-7af2-9ff0-24cabcd3929f`, custom-tool event ordinal 65; direct write-event evidence for this one-line correction. |
| 11:43:51 | The parent spawns `frontend-reviewer` child `01a1aa05-3889-7180-bec8-8db2705463fe`. The reviewer returns PASS for the Promotion diff. | Parent function-call ordinal 71; reviewer child metadata and final response. Confirmed. |
| 11:45:19 | Commit `8977a1c7` is created directly on `improve/vuongnq/redux-service`, parent `129f2a1a`. | Commit object and reflog. Confirmed. |
| 11:45:44 | Reflog records `origin/improve/vuongnq/redux-service` updated by push to `8977a1c7`. | Remote-tracking reflog. Confirmed; pusher process/person unknown. |
| 11:45:48–11:45:56 | The current-run parent checks final status and revision after the commit and sees a clean branch at `8977a1c7`. | Parent session command event ordinals 196 and 203. Confirmed. |

The first implementation attempt and later rerun are separate executions. The earlier custom-agent write is real evidence for the first patch; it does not prove authorship of the later worktree mutation or commit.

## 5. Branch and HEAD transitions

The reflog reconstructs these HEAD/ref transitions:

```text
feature/vuongnq/2803_dong-bo-Vip-the-tin-dung @ 1f1f9f3
  -> develop @ 129f2a1a                  checkout, 11:39:16
  -> improve/vuongnq/redux-service @ 129f2a1a  branch created, 11:41:56
  -> improve/vuongnq/redux-service @ 8977a1c7  commit, 11:45:19
  -> origin/improve/vuongnq/redux-service @ 8977a1c7  update by push, 11:45:44
```

The local and remote ref movements are verifiable. The `git reset` immediately before the checkout is recorded as moving to the same `1f1f9f3` HEAD; its flags are not preserved. The older Codex session had already produced a Promotion worktree diff. The later current-run session reports the four target files clean after the checkout, so that earlier worktree diff was absent by 11:42:13. The available evidence cannot determine whether the reset, checkout handling, a separate cleanup, or another process removed it.

The new branch was created from `HEAD` while the current-run session had already recorded unrelated unlock-request modifications. No branch-switch/create command appears in that parent session’s recorded command events. The reason and initiating process are unknown; the `redux-service` name is consistent with, but does not prove, an intent to isolate the unrelated service work.

## 6. Commit composition and file-level ownership evidence

Commit `8977a1c7c8dbc3e2e70ca197051ef11eb3055afb` has parent `129f2a1a6be8ff633d399927cf85ae385d0b27d6`. Its direct tree diff contains eight application files:

| File | Commit change | Scope |
| --- | --- | --- |
| `src/modules/products/promotion-management/promotion/constant.ts` | Adds `OFFER_EMPTY_DISPLAY`. | Approved Promotion scope |
| `src/modules/products/promotion-management/promotion/views/PromotionListPage/index.tsx` | Replaces local marker uses. | Approved Promotion scope |
| `src/modules/products/promotion-management/promotion/components/OfferDetailTabs/index.tsx` | Replaces local marker uses. | Approved Promotion scope |
| `src/modules/products/promotion-management/promotion/utils/promotion.format.ts` | Replaces local date marker. | Approved Promotion scope |
| `src/redux/slices/unlock-request-customer.slice.ts` | Delegates GET/PUT calls to a service and reformats exports/types. | Unrelated, outside pilot |
| `src/services/index.ts` | Exports the unlock-request service. | Unrelated, outside pilot |
| `src/services/users/unlock-request-customer.service.ts` | Adds service methods, response typing/null guard, and a service object. | Unrelated, outside pilot |
| `src/services/users/unlock-request-customer.types.ts` | Adds service request/response types, with backend-shape caveat. | Unrelated, outside pilot |

The first Codex implementation child’s persisted `apply_patch` contains edits for all four Promotion files. This directly establishes that child wrote an initial patch in that earlier run. Prettier subsequently reformatted the affected Promotion files in that run.

For the later rerun, the parent’s initial clean-surface check at 11:42:13 and the next read-only diff at 11:42:27 establish that all four files changed before the later `feature-implementer` spawn. The child reported that observation. Its persisted tool input at 11:42:56 applies a patch only to `constant.ts`, changing the declaration from `'—' as const` to the requested `'—'`. Therefore:

- Initial patch in the earlier run: attributable to the earlier `feature-implementer` by its recorded `apply_patch` input.
- Later worktree mutation of the three consumer/formatter files and the original addition in `constant.ts`: actor/process unknown; they were already present before the later named child ran.
- Constant declaration correction in the later run: directly attributable to the current `feature-implementer` child’s `apply_patch` event.
- Final commit: contains these four files, but commit-level Git metadata cannot assign line authorship to the child or the process that committed.

## 7. Agent invocation versus actual patch authorship

Two real feature-implementer executions are evidenced:

1. Earlier child `01a1a9fb-6416-7593-90d0-5a9c635981d1` (`agent_role: feature-implementer`) has a recorded `apply_patch` tool input changing all four Promotion files. Its parent’s earlier report and review are separate evidence; they do not establish later commit authorship.
2. Current-run child `01a1aa04-2331-7af2-9ff0-24cabcd3929f` (`agent_role: feature-implementer`) was spawned after the complete patch was already visible. It explicitly reported unknown original authorship. Its transcript records an `apply_patch` that corrects only the constant declaration; it does not show the child authoring the other three files or the rest of the patch.

Two corresponding frontend-reviewer child sessions also exist. The current reviewer `01a1aa05-3889-7180-bec8-8db2705463fe` returned PASS on the Promotion diff. Neither reviewer’s role nor PASS establishes who wrote the patch or who created/pushed commit `8977a1c7`.

The current-run parent transcript’s recorded shell commands include status, diff, validation, and report inspection; it contains no recorded `git add`, `git commit`, or `git push` command. That excludes a logged commit/push command in that session, not external processes or interactive tools.

## 8. Commit initiator evidence and uncertainty

The commit object records author and committer as `VuongNQ <vuong11a3@gmail.com>` at 11:45:19 +07. The local branch reflog records the commit under the same configured Git identity. The remote-tracking reflog records `update by push` at 11:45:44 under that identity.

This is identity metadata, not proof that a particular person directly initiated the commands. No commit or push command is recorded in the current-run Codex parent or child command transcripts inspected here. The commit and push therefore cannot be attributed to the feature-implementer, frontend-reviewer, current coordinator, a specific human, or a specific IDE/automation process from the available evidence.

The remote-tracking ref is already at the commit. Whether that local ref update corresponds to the actual remote server’s current state cannot be independently verified without contacting the remote; no network action was performed.

## 9. Promotion behavior and scope verification

The diff from `129f2a1a` to `8977a1c7` in the four approved Promotion files shows only:

- One feature-owned definition: `export const OFFER_EMPTY_DISPLAY = '—';`.
- Imports replacing the two local `EMPTY_VALUE` definitions and formatter `NO_DATE_DISPLAY` definition.
- Uses of the shared constant at the same existing fallback sites.
- Removal of the formatter comment that described the former duplication.

The em dash is unchanged. Conditional expressions remain the same: empty products still use the empty-list branch; detail/history values retain their original `||`/ternary conditions; missing date endpoints still choose the marker. No route, permission, form, API, upload, payload, Redux, or Query code is changed by the Promotion diff. The only marker string literal in the Promotion source is the new definition; remaining em dashes found by search are explanatory comment text. This supports the approved SAFE classification in Architecture §19. No browser behavior was tested.

The current-run typecheck and targeted Prettier/ESLint checks were reported as passing on the working tree before commit. The `npm run typecheck` command covers the repository TypeScript projects; targeted formatting/lint commands covered only the four Promotion files. The independent reviewer inspected the Promotion diff only. No application test framework, API integration test, or browser test ran.

## 10. Unrelated unlock-request change assessment

The four unlock-request paths were already dirty/untracked when the current-run parent began at `develop`/`129f2a1a`, and remain in the final commit. Git history on the other local feature branch contains earlier commits for this work. The unlock-request files in `8977a1c7` are byte-identical to their versions in commit `7d7f4df2` (the earlier service-addition commit). Compared with later commit `1f1f9f3`, the service file in `8977a1c7` restores an interface/service-object block and uses an absolute alias import; the other three paths match that earlier service-addition content.

This unrelated work moves GET/PUT transport calls out of a Redux slice into `window.apiFetcher` service methods and introduces DTO-like types. One potentially material behavior boundary is the GET null guard: the existing project context documents that handled 401 responses resolve as `null` (`PROJECT_CONTEXT.md` lines 1324–1326). The new service throws a `TypeError` on a null GET response; the slice’s rejected reducer clears list/pagination state, whereas the fulfilled reducer reads `items`/`pageInfo`. This changes the 401/null thunk outcome relative to simply returning the response and must be evaluated against the intended auth/error contract.

Architecture §19 places feature services/types and isolated API calls at least in MODERATE; `ApiFetcher` and authentication behavior are HIGH-RISK. This behavior is unrelated to the approved SAFE pilot, was not in the reviewer’s Promotion-only scope, and received no independent endpoint/auth/runtime validation here. This audit does not decide whether the unlock-request change is correct or should be retained.

## 11. Git safety and isolation failures

- A shared mutable checkout held unrelated unlock-request changes while the pilot proceeded.
- A new branch was created from the current HEAD with unrelated work present; no clean-worktree boundary or isolated worktree separated pilot and service work.
- The current-run implementation patch appeared after a clean-surface check but before the named writer was spawned. The agent handoff therefore did not preserve exclusive, attributable write ownership.
- Branch and worktree state changed while the pilot was active. The workflow continued through review without freezing or aborting on revision/branch drift.
- Review focused on the four Promotion files, while the later commit contained eight application files. The review verdict cannot approve the entire commit.
- A commit and push occurred despite the pilot instruction not to commit. The executing process is unknown; no guard or approval gate prevented it.
- The final report from the implementation run acknowledged the drift and returned PARTIAL, but this happened after commit/push. The earlier result narrative that said only the four approved application files changed is not consistent with commit `8977a1c7`’s eight-file diff.

## 12. Root-cause hypotheses (inference)

These are plausible explanations, not confirmed causes:

1. The previous implementation patch may have been cleared during the 11:39 reset/branch transition; a user, IDE, automation, or another agent may then reintroduced the equivalent diff between 11:42:13 and 11:42:27.
2. The unlock-request files likely came from work performed on `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung` and were carried or copied into the `develop` worktree before the current-run session. Their content matching commit `7d7f4df` supports lineage, but does not identify the transfer operation.
3. The branch name `improve/vuongnq/redux-service` suggests a separate service-focused task may have motivated branch creation. The name alone does not establish intent.
4. A Git GUI, IDE, shell automation, user action, or another Codex session may have staged/committed/pushed the full worktree. The available session logs do not identify which.
5. The commit likely included all visible changes because they were staged together; the exact staging command or mechanism is unknown.

## 13. Recommended safeguards for future pilots

- Run each pilot in a dedicated, isolated worktree with a recorded base revision and a clean initial status. If unrelated changes exist, do not continue in the same mutable checkout.
- Verify branch, HEAD, status, and the approved path manifest immediately before agent activation, after implementation, before review, and before reporting. Abort and re-establish the baseline if any value changes unexpectedly.
- Spawn the named implementer before any source mutation. Keep the coordinator read-only for application files and capture explicit file-write tool evidence from the implementer.
- Capture a pre/post content hash or exact diff manifest. Require the implementer’s changed paths to match the approved list; do not infer ownership from the final diff or agent invocation alone.
- Give the reviewer a fixed snapshot and the complete diff that would be committed. Require it to reject extra files and any head/branch drift.
- Enforce the no-commit/no-push boundary during a pilot. Separate commit/push into a later, explicit approval step; do not rely on agent prose to constrain Git tools.
- Before final reporting, compare both the working-tree diff and `git diff <base>...HEAD`, then verify local and remote refs. Report any unreviewed files as out of scope and keep the verdict partial.

These safeguards are recommendations. Choosing mandatory worktree, commit, and push policies remains a team governance decision.

## 14. Remaining unknowns and NEEDS-TEAM-DECISION items

- Which process/user created `improve/vuongnq/redux-service` at 11:41:56.
- Which process reintroduced the Promotion patch after the 11:42:13 clean check.
- Which process reintroduced the original four-file patch before the current feature-implementer ran.
- Which process staged, committed, and pushed `8977a1c7`; Git identity metadata is insufficient to determine the actor.
- Whether the remote server currently has the commit; only local remote-tracking ref evidence was read.
- Whether the unlock-request GET null-to-throw behavior is intended and approved, especially for handled 401 responses.
- **NEEDS-TEAM-DECISION:** assign ownership of the pushed `improve/vuongnq/redux-service` commit and decide how the unrelated unlock-request changes should be reviewed/handled. No remediation is performed by this audit.
- **NEEDS-TEAM-DECISION:** establish whether Codex agents or IDE/automation may commit or push, and what explicit human approval is required.
- **NEEDS-TEAM-DECISION:** choose whether isolated worktrees and a clean-snapshot gate are mandatory for SAFE implementation pilots.

## 15. Final readiness recommendation

Treat the four-file Promotion implementation as source-level SAFE and behavior-preserving, but do not treat the current eight-file commit as an approved SAFE pilot result. The Promotion-only reviewer PASS does not cover the unlock-request API/auth behavior or validate commit provenance. Have the responsible repository owner confirm the commit and remote update, review the unlock-request changes—especially GET null/401 handling—and decide the pilot/commit policy before using this result as a model for future implementation runs. Do not automatically reset, revert, split, or otherwise rewrite history.
