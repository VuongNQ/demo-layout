# Codex analyzer quality validation — Banner

## 1. Branch, revision, and date

- Validation date: 2026-11-05 (Asia/Ho_Chi_Minh).
- Repository branch at report time: `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung`; current HEAD observed as `1f1f9f31eae3a48f66362753bd63d4428767a91d` after the validation began.
- **Both agent runs analyzed the same fixed source snapshot:** detached local copy `/tmp/hds-analyzer-quality-55403f10` at `55403f108de3a85054510be381838fb70cf45cfc`. Its worktree was clean before and after both runs. The analyzer TOML in that copy and the working repository had the same SHA-256: `1fa228d8f3353c654c8d109ffd667726d83e9dafdbcdea70e8992bcd5e66e269`.
- The original repository's HEAD advanced during validation; this report's source conclusions apply to the fixed revision above, not automatically to the later HEAD.

## 2. Instruction audit and confirmed gap

Read `AGENTS.md`, both knowledge documents, both custom-agent TOMLs, the relevant general, architecture, API, form, component, and refactoring rules, and the prior `codex-agent-runtime-validation.md` report before editing. Existing shared instructions already require relevant consumers, API/form/payload contracts, source-backed risk classification, and HIGH-RISK treatment for payload lifecycle changes. In particular, `AGENTS.md` and `.codex/rules/00-general.md` require consumer tracing, and `.codex/knowledge/ARCHITECTURE.md` §19 classifies payload lifecycle and shared/cross-domain changes as HIGH-RISK.

One operational gap was confirmed in the **original analyzer-specific instruction**: it asked for the “full relevant consumer set” but did not say how to close indirect edges through render configuration, callbacks, or data transformations, or to enumerate component-direct API callers alongside thunk/service callers. This could explain the three omissions in the prior Banner run. It did not justify copying shared engineering rules into the agent.

## 3. Source evidence

- `src/components/simulation/components/defaultPageComponents.tsx:25,54` places the shared `BannerCarousel` in `buildHomeComponents`' default `bannerSlot` and `defaultHomeComponents`. `PopupPreview.tsx:15` uses the latter; `BackgroundMainPreview/index.tsx:23` uses the former; `ExclusiveTouchPreview.tsx:43` renders the carousel directly. `HomePage.tsx:13` also defaults to `defaultHomeComponents`. These are indirect and direct consumers.
- `src/modules/contents/banner/components/UploadImage.tsx:26,62,90` contains a direct `ApiFetcher` file upload when `autoUpload` is enabled; its default is false. Create and edit have separate deferred uploads at `create/createBanner.tsx:397` and `edit/general.tsx:452`.
- `src/components/upload/index.tsx:72-100` posts to `api/admin/file?category=${category}` and forwards the returned key through `onKeyChange`; Banner create and edit render this shared control at `create/createBanner.tsx:726` and `edit/general.tsx:863`. This fourth upload call site was missed by the analyzer and found by the reviewer.
- `create/createBanner.tsx:386-400` deletes `imageUrl` and `productName` from each Marketing slot before upload/payload mapping. The new-file branch in `edit/general.tsx:442-461` spreads the slot and adds `image: response.key` without deleting those form fields; its no-file branch deletes them. Actual wire serialization and backend interpretation were not verified.
- `view/form.tsx:48-60,98-108` dispatches `updateBanner` with a spread detail object and reversed `active` flag from the view page. `banner.slice.ts:351` sends this via `PUT banners`. `form.routes.tsx:1014` gates the view route with `BANNER_SETTING_VIEW`; the status callback has no source-visible edit-permission gate. Backend authorization was not tested.
- `.codex/knowledge/ARCHITECTURE.md:828-829` makes an isolated mapper MODERATE but a **payload lifecycle** change HIGH-RISK. The upload → key → form → create/edit request path is a payload lifecycle, so HIGH-RISK controls.

## 4. Configuration change

Only `.codex/agents/codebase-analyzer.toml` was changed. Its existing read-only boundary and output contract remain: responsibility, file/symbol flow, target-versus-legacy classification, risks, and smallest safe handoff. The added procedure requires closing direct and indirect consumer/caller edges through shared render/configuration factories, callbacks, and transformations; enumerating direct `ApiFetcher` callers; tracing upload response keys to requests; and citing §19's highest applicable risk row. It references shared architecture rules rather than duplicating them. The TOML parses and retains the required `name`, `description`, and `developer_instructions` fields.

No further analyzer instructions were added after independent review: the remaining misses already fall under the new graph, caller, transformation, and risk instructions. They are execution-quality failures, not another confirmed instruction gap. No application source, `.claude/`, `.gitignore`, architecture decision, or prior report was edited. `.codex/` and `docs/` are local-only/ignored under the existing policy; tracking policy was not changed.

## 5. Consumer and caller coverage at the fixed revision

The corrected impact map must include:

| Surface | Confirmed callers or consumers |
| --- | --- |
| Shared Home carousel | Banner simulation through `HomeBannerCarousel` with supplied `bannerLists`; `PopupPreview` via `defaultHomeComponents`; `BackgroundMainPreview` via `buildHomeComponents` default slot; `ExclusiveTouchPreview` directly; `HomePage` default component array. The shared carousel without supplied lists fetches `screen/all` and posts `banner/simulation`. |
| Marketing preview | Banner's Marketing simulation and Splash Screen Marketing preview consume Banner carousel/constants; Splash Screen also calls the Banner screen thunk. The generic default Marketing carousel is a separate component and must not be conflated with Banner's data-backed Marketing carousel. |
| Other reverse dependencies | Popup utilities re-export Banner helpers; popup list/form/history consume them. The Banner slice imports Banner constants. Relevant if those shared symbols change. |
| Banner Redux API | `src/redux/slices/banner.slice.ts` has 13 `ApiFetcher` call sites: banners list/detail, channels, select lookups, active toggle, sort, screen list, redirect type/detail, create, update, and history. Both list active toggle and view-page `updateBanner` are status-write paths. |
| Simulation API | `src/services/contents/banner-simulation.service.ts` calls `GET screen/all` and `POST banner/simulation`. Both this Query path and the Redux screen-list path exist; cache authority/freshness is unverified. Query keys and service exist, but the components call `useQuery` directly, so adopted feature-owned-hook alignment is partial. |
| File API | Four call sites relevant to Banner upload behavior: create deferred upload, edit deferred upload, optional `UploadImage` auto-upload, and shared `UploadFileComp` upload used by create/edit. The latter forwards a key and URL into form callbacks. `fetch(imageUrl)` in canvas preview is image loading, not an application API call. |
| Form/payload boundary | Shared control callback and deferred File paths can both affect AntD form values. Create and edit Marketing slot mappings differ for newly uploaded files, as detailed above. The view form has a separate detail-to-update payload path. |

This is source-based coverage of the identified Banner impact graph, not proof that every dynamic runtime edge or backend caller exists or has been exercised.

## 6. Risk classification

**HIGH-RISK** for the upload-to-form-to-payload lifecycle and any change affecting shared carousel behavior, cross-domain consumers, routing/permissions, or shared status writes, under `.codex/knowledge/ARCHITECTURE.md` §19. The analyzer correctly raised broad Banner impact to HIGH-RISK, but its suggestion that a bounded form mapper could be MODERATE was overbroad for Banner upload mapping. An isolated visual change may be SAFE; an isolated mapper unrelated to payload lifecycle may be MODERATE after its actual surface is traced. No architecture policy was changed.

## 7. Independent reviewer findings

The `frontend-reviewer` returned **CHANGES REQUIRED** on the analyzer output. It confirmed the original three defects were addressed: configuration-driven carousel consumers, direct `UploadImage` upload caller, and overall HIGH-RISK classification. It independently identified the shared `UploadFileComp` call site, the view-page status write and permission concern, the create/edit new-file payload difference, the misleading MODERATE mapper example, and only partial alignment of simulation Query usage with the adopted hook boundary. These are substantive omissions in the completed analysis, not evidence that the agent failed to activate.

## 8. Runtime and validation evidence

- A direct CLI coordinator launched from the frozen `/tmp` clone could read the TOML but reported that it could not activate a **named** project custom agent there. Its recorded output is `/tmp/hds-quality-analyzer-parent-output.txt`. The exact discovery/trust cause was not established.
- Launching the CLI coordinator from the actual repository root with `codex exec --json --sandbox read-only --enable multi_agent` succeeded while both children were instructed to read only the fixed clone. The first coordinator's `spawn_agent` call used `agent_type:"codebase-analyzer"` (thread `01a1a9ce-2537-7d61-98cd-0c07a28c9393`, rollout ordinal 17); its separate child thread was `01a1a9ce-6edc-7af3-9440-c5668ef4c0a1`. The second used `agent_type:"frontend-reviewer"` (thread `01a1a9d2-aa60-7f41-be7e-4f351346d275`, ordinal 17); its separate child thread was `01a1a9d2-d009-73c0-8487-0fc2af49235c`. Both child rollouts show their corresponding custom developer instructions and completed responses. This is real named-agent activation, not a simulated role prompt.
- Full child outputs were saved at `/tmp/hds-quality-analyzer-child-output.txt` and `/tmp/hds-quality-reviewer-child-output.txt`; coordinator JSON events are at `/tmp/hds-quality-analyzer-events2.jsonl` and `/tmp/hds-quality-reviewer-events.jsonl`. These `/tmp` artifacts are ephemeral evidence, not repository documentation. The root coordinator used escalated process launch because its app-server could not start inside the outer sandbox; the Codex agent sessions themselves were `--sandbox read-only`.
- The frozen checkout remained clean at `55403f108de3a85054510be381838fb70cf45cfc` before and after both runs. The analyzer TOML SHA-256 matched between repo and clone. Python TOML parsing passed and confirmed all required fields. No source/build/test commands were needed for this documentation and agent-quality validation.

## 9. Unverified behavior and remaining risks

No browser, authenticated route, backend authorization, network/API response, actual multipart upload, wire payload serialization, or device behavior was exercised. The status permission concern is a source-level observation, not a proven backend authorization defect. The edit payload observation is about the object passed to `updateBanner`; server handling remains unknown. The `/tmp` clone's inability to discover named project agents limits portability of this invocation method. The working repository's later HEAD was not re-analyzed. The edited `.codex` configuration remains local-only under the existing ignore policy and may not travel with a normal commit.

## 10. Result

**PARTIAL.** The targeted instruction gap was fixed, both real custom agents activated from the repository root, and the analyzer recovered the three original Banner findings. Independent review still found material omissions and an imprecise risk example in the analyzer's output. Further repetitive rules in the TOML would not address these already-covered execution failures; future analyses should be independently reviewed against the complete caller/consumer graph before being treated as a safe change plan.
