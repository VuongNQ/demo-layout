# Storybook Progress UI and ZIP Implementation

- **Author:** Vuowng
- **Date:** 2026-11-09
- **Branch:** `feat/storybook-to-markdown-extension`
- **Revision:** `aa295521248a476860329266b731d00a517c9ba1` (base HEAD; implementation remains uncommitted)
- **Worktree:** `/Users/nguyen.quoc-vuong3/demo-layout`
- **Scope:** `tools/storybook-to-markdown/` and this requested report only

## Scope and evidence

The checkout was on the expected branch at the revision above. The existing extension was version 0.1.0. Its All Docs implementation used a fixed 900 ms delay after navigation, processed entries sequentially, and had no durable job progress UI. The baseline manifest declared `activeTab`, `scripting`, `downloads`, and optional HTTP(S) host access. These details were verified in the baseline files with `git show HEAD:tools/storybook-to-markdown/...`.

The current package scripts are `dev`, `typecheck`, `build`, `preview`, `test:e2e`, and `verify:scenarios2-5`. There are no extension-specific root npm scripts and no extension package dependencies. The `node_modules` executables needed by the root TypeScript and Playwright scripts are absent. Existing `.codex/` files are agent descriptors; `.agents/skills/` contains only Compare, design-system UI, and platform-routing skills, none applicable to this extension change.

The stated production-like sample of 81 Docs pages and approximately 480 KiB is supplied task context; it was not independently re-exported or verified in this checkout. A four-entry local Storybook fixture was added for browser testing, but the extension could not be loaded in the managed headless Chrome environment, so the fixture was not crawled by the extension.

## Changes

- **Persistent progress and job controls:** `popup.html`, `popup.css`, and `popup.js` now expose idle, discovering, crawling, processing, compressing, completed, paused, cancelled, and failed states; native progressbar semantics; a live status region; percentage, page counts, success/failure counts, current page, elapsed time and phase; per-entry status, IDs, error detail, attempt history and retry controls. Pause stops new assignments, waits for active page work, then closes owned tabs. Cancel is displayed as in progress until active work and cleanup finish. Duplicate All Docs jobs are rejected while an export is active. Job data is saved to `chrome.storage.local`, and popup reopen requests restore it.
- **Crawler/readiness:** `background.js` discovers Docs entries through Storybook index metadata while retaining IDs, titles, names, tags, import paths and source URLs. It follows nested Storybook base paths, bounds navigation to 20 seconds and readiness polling to 16 seconds, and replaces the fixed delay with checks for the requested Docs route, a recognized Docs root, nonempty text, absence of common busy/loading signals, and three stable text probes. A configurable pool of one, two or three inactive tabs preserves page-level failures and permits retry. Temporary tabs are tracked and cleaned up; interrupted jobs are recovered from saved state when the popup requests progress or Chrome starts.
- **Categorized ZIP:** each successful entry becomes one Markdown page under `guides/`, `components/`, `form/`, or `unclassified/`, based on explicit Storybook title hierarchy or tags. Paths are normalized, bounded, reserved-name safe, and suffixed with a stable hash of the Storybook ID; a final collision counter prevents overwrites. The archive also includes `README.md`, `INDEX.md`, `manifest.json`, `EXTRACTION_REPORT.md`, and `tokens/` documentation. The manifest records metadata, source URL, page path/status, errors and retry history. Partial exports include successes and detailed failure outcomes.
- **Extraction and token observations:** `extractor.js` returns table classification as props, variants, rendered, or unknown with the observed evidence and confidence. Examples and guideline text retain nearby headings where available. Shared CSS custom properties and selected computed styles are deduplicated by observed identity/value, while recording source ID, page path, URL and frame. Conflicting values remain distinct and are flagged. These remain runtime observations, not canonical tokens or inferred unavailable metadata.
- **Packaging and Current Docs:** ZIP assembly is performed by the bundled `offscreen.html`/`offscreen.js` document using ZIP STORE entries with CRC-32 and classic ZIP bounds. No Web Worker is used for DOM access. Current Docs remains a one-file `.md` download and retains a preview. The manifest adds storage and offscreen permissions; All Docs requests host access for the selected Storybook origin at runtime.
- **Documentation and checks:** the extension README describes operation, limitations, permissions and validation. Dependency-free mocked integration checks live in `tests/smoke.mjs`; `tests/chrome-e2e.mjs` and `tests/storybook-fixture.mjs` provide a real-browser fixture workflow.

## Findings and inferences

### Crawl concurrency

The implementation now supports sequential work and bounded pools of two or three tabs. Bounded concurrency can overlap navigation and rendering waits, but real throughput and site load depend on Storybook, browser scheduling, authentication, network and machine resources. No claim is made that either pool is faster on a real Storybook from the available evidence.

The deterministic mocked scheduler comparison completed with these observed Node run times:

| Pool width | Mock run time | Evidence limit |
| --- | ---: | --- |
| 1 tab | 2,053 ms | Synthetic navigation delay in `tests/smoke.mjs`; not a browser or production measurement |
| 2 tabs | 1,038 ms | Same synthetic harness; not a browser or production measurement |
| 3 tabs | 1,031 ms | Same synthetic harness; not a browser or production measurement |

These numbers verify that the mocked scheduler overlaps its modeled waits. They must not be used to estimate the stated 81-page export. A real comparison should use the same Storybook build and warm/cold cache condition, repeat each pool width, record page-level readiness/failure rates and total elapsed time, and report the median and range. Keep two tabs as the current default pending that evidence; whether the default should change is **NEEDS-TEAM-DECISION**.

### Readiness and MV3 lifecycle

Waiting for a matching route and stable nonempty Docs root is stronger evidence of rendered readiness than a fixed delay. It still cannot prove that every lazy or collapsed block is rendered, and common busy selectors vary by Storybook version. The bounded timeout converts indefinite waits into explicit page failures.

MV3 service workers can be suspended. State is persisted and recovery requeues entries marked running after closing tracked temporary tabs, but a crawl may wait until the next popup request or browser startup to recover. The browser's precise suspension timing and recovery behavior were not validated here. Successful cancellation is only recorded after the tab cleanup path confirms the owned tab IDs are gone.

### Worker evaluation

Web Workers cannot inspect the rendered Storybook DOM used by the extractor; that remains in scripts injected into the page frames. The observed fixture/serialization size is small, and no real CPU profile establishes ZIP generation as a bottleneck. The offscreen document keeps archive work away from the popup's event loop without adding a worker protocol. Reconsider a worker only if representative profiling shows archive assembly/CRC work produces visible UI or service-worker latency. This is an implementation choice based on the current evidence, not a measured performance result.

## Proposed architecture

The implementation uses this flow:

1. The popup requests only the selected origin's optional host access and starts one persisted job.
2. The service worker reads Storybook index metadata, assigns deterministic paths, and schedules at most the selected one-to-three tab workers.
3. Each worker navigates an owned inactive tab, waits for bounded Docs readiness, extracts the matching frame, and checkpoints the result or page failure.
4. Pause/cancel stop further assignment, settle in-flight work, and close all owned tabs before recording their terminal state.
5. Processing classifies observed material and deduplicates token observations while preserving their source provenance.
6. The offscreen document builds a ZIP; Chrome's downloads API delivers it. The popup reads persisted job snapshots and reports per-page outcomes.

Current Docs follows its existing separate path: extract the active Docs page and download one Markdown file.

### Archive path and validation rules

- Use explicit Storybook `title`, `name`, `tags`, `type`, and `id` only when present. Unknown categories go to `unclassified/`; missing metadata is not synthesized.
- Normalize title/name segments with Unicode normalization and safe character replacement, reject traversal/reserved path segments, limit segment length, and use a stable ID hash suffix. Add a deterministic numeric suffix if a path still collides.
- Preserve source URL, stable Docs ID, category evidence inputs, frame ID and observed token provenance. Keep tokens with distinct values separate and flag a shared CSS variable observed with conflicting values.
- Validate that every selected Docs ID is represented once in the manifest, every successful page has one unique safe `.md` path, all generated links target emitted archive members, all Markdown has a title and source, failure counts agree across manifest/report, and ZIP names, offsets, sizes and CRC values are consistent.
- Enforce the current 120-entry cap and classic ZIP file/size bounds; report omitted entries. Keep partial successful pages when other entries fail.

## Prioritized implementation plan

The requested iteration is implemented in this worktree. Follow-up validation and hardening should proceed in this order:

1. **P0 — Real-browser acceptance:** run the fixture in an unmanaged Chrome profile with the unpacked extension loaded; verify the popup API context, origin grant, popup close/reopen, multiple Docs pages, readiness delay, retry, pause/resume, cancellation cleanup, current-page `.md`, ZIP download and partial failures.
2. **P1 — Representative crawl benchmark:** compare one, two and three tabs against the same 81-entry Storybook dataset over repeated runs; retain elapsed-time distributions, peak tab count, memory, readiness/failure rates and downloaded archive sizes. Revisit the default concurrency only with these results.
3. **P1 — Storybook compatibility:** exercise supported index formats and real rendered table/variant/examples/guidelines structures. Tune selectors only from observed fixtures, leaving uncertain classification explicit.
4. **P2 — Archive robustness:** test collision pairs, Unicode and reserved names, missing metadata, conflicting tokens, empty/partial archives and ZIP boundaries with independent archive tooling. Consider compression or worker packaging only if profiling identifies a real bottleneck.
5. **P2 — Lifecycle/resume hardening:** test abrupt worker termination, Chrome restart, download interruption, storage quota exhaustion, and cleanup failure. Make any recovery limitations visible to users.

## Benchmark and test matrix

| Area | Check | Result |
| --- | --- | --- |
| Syntax/manifest | `node --check` on background, extractor, popup, offscreen, and both test scripts; parse `manifest.json` | PASS |
| Current Docs regression | Mock integration verifies one download, `.md` filename, Save As setting and Markdown heading/payload | PASS (mock; no real Chrome download) |
| All Docs archive | Four-entry synthetic index, categorized paths, one Markdown per entry, manifest mapping, required archive files, path uniqueness and safe segments | PASS (mock integration) |
| Extraction/partial failure/retry | Props/rendered table extraction evidence, failed page retained, retry attempt history emitted in manifest/report | PASS (mock integration) |
| Controls and cleanup | Duplicate start prevention, pause/resume, cancel terminal state after cleanup, owned tabs removed | PASS (mock integration) |
| ZIP | Local/central headers, end record, member count and CRC-32 for every entry | PASS (mock ZIP validation) |
| Scheduler comparison | Sequential, two-tab and three-tab synthetic scheduler runs | PASS; see measured mock values above, not a real crawl benchmark |
| Popup close/reopen and real controls | Browser fixture runner added; Chrome target opened as `chrome-error://chromewebdata/`, so `chrome.runtime`/`chrome.permissions` were unavailable | NOT VALIDATED in real browser |
| Root `npm run typecheck` | Script exists; `tsc` executable unavailable in checkout | BLOCKED: `tsc: command not found` |
| Root `npm run build` | Script exists; `tsc` executable unavailable in checkout | BLOCKED: `tsc: command not found` |
| Root `npm run test:e2e` | Script exists; Playwright executable unavailable in checkout | BLOCKED: `playwright: command not found` |
| Unrelated application behavior | Reviewed changed paths and diff; no `src/`, route, deployment or root dependency files changed | Static scope check PASS; no app browser regression suite ran |

No dependency installation was performed. `git diff --check` passed for tracked changes. The mock ZIP test validates its entries and CRCs but does not replace an independent unzip implementation test.

## Risks

- Storybook index shape and Docs markup vary. The timeout/readiness selectors and table classification are evidence-based heuristics and may need version-specific cases.
- Three concurrent tabs can increase browser/network/server pressure. The appropriate default is not established by the synthetic scheduler.
- Extension worker suspension may interrupt active crawl work while the popup is closed; persisted job data supports recovery on popup request/startup, but real suspension was not tested.
- `chrome.storage.local` quota can be reached when extracted pages are unusually large. Checkpoint failure is surfaced, but quota recovery was not exercised.
- ZIP entries use STORE/no compression and classic ZIP limits. The current archive has no Zip64 support; very large output fails explicitly.
- Runtime CSS/computed styles can include inherited or theme-dependent values. They are reported as observations with provenance and conflict data, not official design tokens.
- Chrome runtime permissions and download dialogs require real user/browser behavior that the managed headless environment could not provide.

## Unverified behavior and decisions

- Real-browser extension loading and `chrome.permissions.request` on the selected Storybook origin; current headless Chrome showed a managed Extensions page and navigated the extension popup URL to a Chrome error document.
- Actual popup restoration after close/reopen during a crawl; actual Pause, Resume, Cancel and temporary-tab cleanup in Chrome; actual Current Docs download and All Docs ZIP download.
- Actual partial-failure ZIP and retry outcomes on Storybook; the supplied local fixture was not crawled by the extension.
- Full 81-page export, real elapsed time and memory for concurrency 1/2/3, and the task-provided approximately 480 KiB sample.
- Behavior for authenticated Storybook pages, additional Storybook index generations, unusual frame setups, inaccessible content, Chrome storage quota exhaustion and interrupted downloads.
- **NEEDS-TEAM-DECISION:** whether two tabs should remain the default after representative browser benchmarking; whether future releases should define additional explicit category mappings for Storybook title/tag vocabularies not represented in current metadata; and whether a visible recovery action is needed when MV3 service-worker suspension pauses a persisted job.

## Files and repository boundary

Changed implementation files are `tools/storybook-to-markdown/README.md`, `background.js`, `extractor.js`, `manifest.json`, `popup.css`, `popup.html`, and `popup.js`; new files are `offscreen.html`, `offscreen.js`, and `tests/`. No application source, unrelated files, root package dependencies, `.gitignore`, or deployment workflow files were changed. This report and the extension changes remain uncommitted. The pre-existing untracked `docs/reports/2026-11-09/storybook-crawler-zip-optimization-plan.md` was left untouched.
