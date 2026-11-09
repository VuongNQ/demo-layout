# Storybook Extension Decision Compliance and Validation

- **Author:** Vuowng
- **Date:** 2026-11-09
- **Branch:** `feat/storybook-to-markdown-extension`
- **Revision:** `dbecc06456f94b076c6c00e9a224c74b7bacbf5e` (current HEAD; this pass's source changes are uncommitted)
- **Worktree:** `/Users/nguyen.quoc-vuong3/demo-layout`
- **Scope:** `tools/storybook-to-markdown/` and this requested report only

## Scope

Reviewed the two requested 2026-11-09 reports, repository instructions, current Manifest V3 extension source and tests against the approved product decisions. HEAD already contained the prior implementation iteration and the two prior reports; those files were preserved. This pass changed only extension files and added this local report.

The checkout is on the required branch. Current HEAD is `dbecc06456f94b076c6c00e9a224c74b7bacbf5e`; the branch is one commit ahead of its configured origin. There is one registered worktree. No application source, deployment workflow, root package configuration, `.gitignore`, or Codex/Claude Code profile was changed. No dependency was installed and no commit was created in this pass.

`AGENTS.md` was read. `.codex/agents/` contains `routing-architect.toml` and `ui-reviewer.toml`; neither applies to this standalone extension. No Codex index or rules files exist in the checkout. The only `.agents/skills/` are Compare, design-system UI, and platform routing; none applies to this extension task.

The earlier implementation report described `unclassified/` as a ZIP destination and a two-tab default. Those statements are superseded by the current approved decisions and are not treated as implementation requirements.

## Approved decision compliance matrix

| Approved decision | Status | Source and test evidence |
| --- | --- | --- |
| Default concurrency is one tab; two and three are internal benchmark options | **PASS** | `background.js` defaults to `DEFAULT_CONCURRENCY = 1`; popup no longer exposes a concurrency selector and sends no concurrency override. `tests/smoke.mjs` starts All Docs without an override and asserts the persisted job uses one tab. Explicit widths 2 and 3 remain in test-only scheduling comparisons. No performance claim or pending decision about the default is made. |
| ZIP categories are exactly `guides/`, `components/`, and `form/`; unknown category falls back to `components/` | **PASS** | `categoryFor` and `assignPaths` record category source, confidence, and evidence. Unknown/conflicting metadata receives `components/` with low confidence. The archive writes the three category directory entries plus `tokens/`; it does not emit `unclassified/`. Archive `manifest.json`, `README.md`, and `EXTRACTION_REPORT.md` describe the fallback. Smoke assertions verify all three categories, no `unclassified/` member, and fallback evidence. |
| Bundled pure-JS ZIP; offscreen only for a concrete technical need | **PASS, browser download unverified** | The ZIP writer is bundled JavaScript using `TextEncoder`, typed arrays, `DataView`, and CRC-32; it does not access page DOM. The full current flow also requires `URL.createObjectURL()`. That API is unavailable in Service Workers; Chrome documents `BLOBS` specifically for offscreen Blob/object-URL operations and requires the `offscreen` permission. The offscreen document is retained for that Blob URL handoff, not DOM scraping. No permission was added in this pass. See evidence below. |
| Preserve Current Docs Markdown, All Docs ZIP, contextual token deduplication/provenance/conflicts, successful-export checkpoint deletion, safe stable paths, pause/cancel semantics, persistent progress | **PASS in source/mock checks; browser acceptance unverified** | `downloadCurrent` remains a single `.md` download; All Docs makes one `.zip` download. Token keys now include identity, observed theme/context, and value, with sources and same-context conflict groups. Successful download deletes stored page bodies while retaining outcomes. Paths remain metadata-based, normalized, hash-suffixed and collision-safe. Pause waits for active page work; cleanup uses only recorded `job.tabIds`. Progress remains persisted in `chrome.storage.local`. The smoke suite exercises these paths except real popup persistence and real Chrome APIs. |

## Specific source evidence

- `tools/storybook-to-markdown/manifest.json` remains MV3 version `0.3.0`. Required permissions include `storage` for job state and `offscreen` for the Blob/object-URL download handoff. The existing `activeTab`, `scripting`, `downloads`, and optional host permissions remain. The popup asks for only the active Storybook origin when All Docs begins; no new permission was added in this pass.
- `background.js` defaults jobs to concurrency 1. Its internal worker pool still accepts bounded widths 1–3 for tests. The popup exposes no pool selector.
- `categoryFor` trusts recognized first title hierarchy segments and recognized tags. Conflicting or absent classification evidence returns `components` with `source: "fallback"`, `confidence: "low"`, and a textual explanation. `assignPaths` preserves these fields on each entry; page Markdown, archive manifest and extraction report carry the evidence.
- `zipFilesFor` emits `guides/`, `components/`, `form/`, and `tokens/` directory members. The category list in archive `manifest.json` is exactly `guides`, `components`, `form`; the fallback folder is `components`. No `unclassified/` archive path is generated.
- `extractor.js` records token identity, `data-theme`/`data-color-scheme` where observed, and computed root `color-scheme`. Missing theme labels are represented as `unknown`. Aggregation keys combine identity, context and observed value; duplicate observations retain source entry/path/URL/frame, while multiple values under one identity and context are flagged as conflicts.
- `discardExtractedContent` removes `entry.page` after the download reaches `complete`; status/history and archive metadata remain available. This is also done in the recovered-download completion path. A completed partial archive can still be retried: successful pages whose bodies were deleted are queued again so a rebuilt ZIP is complete.
- Pause sets a request, stops new assignment, waits for active workers to settle, then calls `closeWorkerTabs`. Cancel follows the same ownership ledger and only becomes terminal after cleanup. Neither path enumerates or closes arbitrary user tabs.
- `tests/smoke.mjs` previously compared wall-clock mock times and asserted concurrency was faster. That assertion was timing-sensitive and did not represent browser performance. It now checks exact peak concurrent navigations (1/2/3). It also verifies that a retry after content deletion rebuilds every successful page. `tests/chrome-e2e.mjs` no longer performs a no-op retry selector click, uses the fixture tab directly, and contains checks for temporary-tab removal and non-selected-origin permission absence.

### Offscreen technical determination

The CRC/header/member construction is plain JavaScript and does not need a DOM, so those calculations can execute in an extension service worker. The current complete ZIP-to-download implementation additionally calls `URL.createObjectURL()` on a Blob. MDN documents that `URL.createObjectURL()` is unavailable in Service Workers. Chrome documents that extension service workers have no DOM and that the offscreen `BLOBS` reason covers Blob work including `URL.createObjectURL()`; the Offscreen API requires the manifest's `offscreen` permission and is available from Chrome 109. [Chrome Offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen), [Chrome extension service workers](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers), [MDN `URL.createObjectURL`](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static).

Therefore the pure-JS ZIP writer is retained without a library or Worker, and the offscreen document remains for the Blob URL handoff. Replacing that path with a base64/data URL or another download mechanism would change the current transfer contract and size behavior; it was not browser-validated, so it was not substituted speculatively. The offscreen and permission behavior still needs real Chrome validation.

## Changes made

- Changed the crawler default from two tabs to one. Removed the popup concurrency selector; widths two and three remain available only in internal test/benchmark messages.
- Changed category fallback from `unclassified/` to `components/`. Added per-entry category source, confidence and evidence; updated the extension manifest description/version, archive manifest, generated README, extraction report, extension README and tests.
- Added observed token identity and theme/context to extracted records. Deduplication now uses identity + context + value; source provenance is merged only for identical observations, and conflicting values within the same identity/context are retained and marked.
- Delete extracted page checkpoints after successful All Docs download while retaining job progress/outcomes. Fixed retry/retry-all after a successful partial ZIP so the archive is rebuilt with pages re-crawled after checkpoint deletion. Popup retry labels now explain the rebuild.
- Replaced mock elapsed-time assertions with deterministic pool-width assertions. Added independent `unzip` verification, category/fallback checks, token context/conflict checks, successful-export checkpoint deletion checks, and complete-archive retry checks.
- Hardened the browser test script’s cleanup and host-scope assertions. It is not claimed as passed because the environment did not provide a usable extension context.
- Kept the pure-JavaScript ZIP STORE implementation and offscreen Blob URL handoff. No Web Worker, npm dependency, new permission, app file, deployment file, `.gitignore` change, or profile synchronization was added.

## Validation evidence

### Commands run

- `node --check tools/storybook-to-markdown/background.js` — PASS
- `node --check tools/storybook-to-markdown/extractor.js` — PASS
- `node --check tools/storybook-to-markdown/popup.js` — PASS
- `node --check tools/storybook-to-markdown/offscreen.js` — PASS
- `node --check tools/storybook-to-markdown/tests/smoke.mjs` — PASS
- `node --check tools/storybook-to-markdown/tests/chrome-e2e.mjs` — PASS
- `node --check tools/storybook-to-markdown/tests/storybook-fixture.mjs` — PASS
- `node -e "JSON.parse(require('fs').readFileSync('tools/storybook-to-markdown/manifest.json','utf8')); console.log('manifest JSON PASS')"` — PASS
- `node tools/storybook-to-markdown/tests/smoke.mjs` — PASS. Output: `currentMarkdown:true`, `allDocsZip:15`, `defaultConcurrency:1`, `fallbackCategory:"components"`, `tokenContextAndConflicts:true`, `checkpointDeletion:true`, `partialRetry:true`, `pauseResume:true`, `cancellationCleanup:true`, `zipSignatures:true`, `independentUnzip:true`, with mock peak navigation counts 1, 2, and 3.
- `unzip -t <temporary export.zip>` and `unzip -Z1 <temporary export.zip>` — PASS inside the smoke test. These independently checked the archive emitted by the mocked integration run, including directory members and all expected names. They do not validate a Chrome-downloaded archive.
- `git diff --check` — PASS for tracked changes. The final whitespace scan also includes this untracked report.

No root app build or Playwright script was run because this is an extension-only task; no app build result is implied. No dependencies were installed.

### Browser acceptance status

**NOT VALIDATED in a real extension context.** The prior real-browser attempt used `node tools/storybook-to-markdown/tests/chrome-e2e.mjs` with an isolated headless Chrome profile. Chrome navigated the extension popup URL to `chrome-error://chromewebdata/`; the popup had no `chrome.runtime` or `chrome.permissions` API, and the test stopped before the first permission request. The Extensions page reported its setting as managed. No compatible unpacked-extension Chrome context was available for this pass, so permission granting/origin scoping, popup close/reopen, real pause/resume/cancel, owned-tab cleanup, and actual `.md`/ZIP downloads remain unverified. The updated browser test runner is a test artifact, not browser proof.

## Risks and unverified behavior

- Actual Chrome Blob URL generation, offscreen lifecycle/cleanup, downloads API behavior, Save As completion/cancel paths, and the `offscreen` permission are unverified in a real extension context.
- Actual host permission prompt acceptance and proof that a second origin remains ungranted are unverified; the browser runner contains these checks but could not execute in an extension context.
- Actual popup restoration during a live crawl, service-worker suspension/recovery, pause waiting, cancellation timing and temporary-tab cleanup are unverified in Chrome. Mock tests cover their coordinator semantics only.
- Theme context currently uses observed `data-theme`, `data-color-scheme`, and computed root `color-scheme`. Storybook themes represented only by toolbar state or non-root attributes may remain `unknown`; values remain distinct by observed value and provenance but may not be separated by the intended theme context.
- The successful export deletes extracted page bodies from extension storage, but failed/cancelled jobs retain available checkpoints for recovery until the job is replaced. Storage quota and abrupt browser termination were not tested.
- Retry of one failed page after a partial archive re-crawls previously successful pages as well so a complete replacement ZIP can be built without retaining the prior extracted content. This behavior is explicit in the UI/README but may add time and network activity.
- The mock ZIP was verified with the system `unzip` reader. A ZIP emitted by Chrome’s actual extension download path was not available for independent reading.

## Remaining NEEDS-TEAM-DECISION items

- **NEEDS-TEAM-DECISION:** confirm which additional Storybook title segments/tags, beyond the explicit aliases currently implemented, should be authoritative guides/form/components classification signals. Unknown/conflicting metadata already falls back to `components/` as approved.
- **NEEDS-TEAM-DECISION:** confirm whether the current token context sources (`data-theme`, `data-color-scheme`, computed root `color-scheme`, otherwise `unknown`) are sufficient for Storybook theme identity, or whether toolbar/viewport/context metadata should be added.
- **NEEDS-TEAM-DECISION:** confirm that retrying a failed page after a successfully downloaded partial archive should re-crawl successful pages to rebuild the full ZIP, given the approved deletion of checkpointed page content after successful export.
- There is **no remaining decision** on the one-tab default or the three-folder taxonomy/fallback; those are treated as approved requirements, not pending decisions.

## Local-only report and changed-file boundary

This report remains untracked/local-only. It was not force-added or committed; `.gitignore` was not changed. The pre-existing `docs/reports/2026-11-09/storybook-crawler-zip-optimization-plan.md` and `docs/reports/2026-11-09/storybook-progress-ui-and-zip-implementation.md` were read and left unchanged. This pass modified only `tools/storybook-to-markdown/background.js`, `extractor.js`, `manifest.json`, `popup.html`, `popup.js`, `README.md`, `tests/smoke.mjs`, and `tests/chrome-e2e.mjs`.
