# Storybook crawler and ZIP optimization plan

**Author:** Vuowng

**Date:** 2026-11-09

**Branch/revision:** `feat/storybook-to-markdown-extension` / `aa295521248a476860329266b731d00a517c9ba1`

**Worktree:** `/Users/nguyen.quoc-vuong3/demo-layout` (the only registered worktree)

**Owned/changed file:** `docs/reports/2026-11-09/storybook-crawler-zip-optimization-plan.md` only.

## Scope

Read-only audit and next-iteration plan for `tools/storybook-to-markdown/`. The report covers navigation and readiness, extraction and classification, serialization and download, permissions, errors and MV3 lifecycle; compares sequential crawling with worker pools of two and three tabs; evaluates Web Worker use; and proposes a foldered All Docs ZIP format, deterministic paths, token provenance, validation and resumability. It preserves the existing Current Docs single-Markdown export.

No source, application, package, deployment or production-contract files were changed. No dependency was installed. No extension or browser test was run. The reported 81 Docs pages and approximately 480 KiB from a real export on 2026-11-09 are task-provided context, not independently reproduced measurements.

## Evidence

### Repository and policy evidence

- `AGENTS.md` was read. It directs source-based claims, preservation of local-only boundaries, and recording branch/revision/worktree and verification limits.
- `package.json` and root `README.md` were read. Available scripts are `dev`, `typecheck`, `build`, `preview`, `test:e2e`, and `verify:scenarios2-5`; none targets this standalone extension. Root README says GitHub Pages is public and prohibits committing real or sensitive data.
- `docs/design-system/README.md` was read for decision labels and verification distinctions; it does not define extension behavior.
- The 2026-11-07 playground plan and parallel-worktree integration audit were inspected as repository context. They concern the UI playground/recovery and provide no extension-specific implementation contract.
- `.codex/` contains only two agent configuration files; this checkout has no `.codex` index or rules tree. `.agents/skills/` contains `design-system-ui`, `compare-workflow`, and `platform-routing`; none applies to a standalone extension crawler/ZIP audit. No extension-specific local skill was found.
- `.gitignore` ignores `node_modules`, build output and local-data files, but not `docs/`. `git check-ignore` found no ignore rule for this report path. `.gitignore` was not changed.
- Initial and final working-tree inspection showed no pre-existing changes. HEAD is `aa295521248a476860329266b731d00a517c9ba1`, branch is the expected feature branch, and there is one registered worktree.

### Extension source evidence

| Source | Observed behavior |
| --- | --- |
| `tools/storybook-to-markdown/manifest.json` | MV3 service worker; permissions are `activeTab`, `scripting`, and `downloads`; broad HTTP(S) host patterns are optional and requested by origin for All Docs. No `storage`, `offscreen`, or other permission is declared. |
| `README.md` in the extension directory | Current Docs uses temporary `activeTab`; All Docs reads `/index.json` or `/stories.json`, selects `type: "docs"`, visits entries sequentially in one inactive temporary tab, and caps at 120. It documents best-effort extraction and MV3 interruption risk. |
| `background.js` lines 1–7, 45–59 | `MAX_PAGES` is 120. Discovery fetches origin-root index paths using the page's same-origin credentials, accepts docs/story/root metadata, filters to Docs and slices to 120. It does not inspect nested deployment base paths. |
| `background.js` lines 60–69, 85–99 | A single temporary tab is navigated serially. `waitUntilComplete` checks tab `status === "complete"` and a URL containing `path=/docs/`; a fixed 900 ms sleep precedes extraction. The listener is registered after `tabs.update`, then checks current tab state to catch completion. Per-entry failures become warnings; `finally` attempts to close the temp tab. |
| `extractor.js` lines 3–34 | Extraction is a serialized function injected into all frames. It chooses the Docs wrapper or `main`/`body`; detects Docs via four selectors; collects up to 5 paragraphs, 100 headings, 150 tables × 150 rows, 40 code blocks, 30 blockquote/list strings, up to 150 styled/token-like elements, and root CSS variables up to the token limit. Returned data includes page title, URL and `foundDocs`, but no frame ID or Docs entry ID. |
| `background.js` lines 8–37, 101–105 | Output is currently one Markdown string. All tables are rendered under generic `Table N`; observed CSS values are emitted on each page; warnings are appended. Download uses a percent-encoded `data:` URL and `chrome.downloads.download({saveAs:true})`. |
| `popup.js` lines 13–31 | The popup requests the current origin's optional host permission for All Docs, sends one long-lived request, shows a status and up-to-8,000-character preview on completion, and re-enables the button. It has no progress, cancel or resume control and holds presentation state only in the popup. |
| Extension README lines 24–43 | It prescribes Node syntax checks and manual Chrome tests, describes captures as best-effort, and warns that long sequential scans may be interrupted. These checks were not run in this documentation-only task. |

### External platform evidence

Chrome's official [extension service-worker lifecycle documentation](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle) says service workers can be terminated after 30 seconds inactivity, a single request taking over five minutes, or a fetch response taking over 30 seconds; extension events/API calls reset timers, and state should be persisted for resilience. Its official [`chrome.scripting` reference](https://developer.chrome.com/docs/extensions/reference/api/scripting) documents injecting functions into selected tabs/frames and returning one result per injected frame. The official [`chrome.downloads` reference](https://developer.chrome.com/docs/extensions/reference/api/downloads) documents URL-based downloads, relative download paths, and save dialogs. These references inform design constraints; they do not prove this extension's behavior on a particular Chrome build.

## Findings and inferences

### Verified findings

1. **Sequential work and fixed wait:** one tab processes one entry at a time. Every successful navigation currently incurs at least the explicit 900 ms delay after the load signal, in addition to navigation and injection time. For 81 entries, the explicit-delay component alone is `81 × 0.9 = 72.9 seconds`; this arithmetic is not an end-to-end timing measurement.
2. **Readiness signal is incomplete:** `status: complete` means navigation completed, not that Storybook's Docs content rendered. A selector check happens only after the fixed sleep. A slow or delayed render can be missed; a SPA transition or stale completed state can be accepted too early. The 18-second timeout covers navigation status only, not a bounded selector wait after load.
3. **URL assumptions:** discovery probes only origin-root `/index.json` and `/stories.json`; navigation always uses origin-root `/?path=...`. Storybook deployments mounted below a path prefix are not represented by current logic. The current Docs path remains the active tab URL and does not have this all-pages root-navigation assumption.
4. **Metadata fallback defect:** discovery retains entry `title` and `name`; extraction always returns a nonempty fallback title (`Untitled` or document title), so `page.title ||= entry.title` normally does not apply. Entry ID is not attached to extracted pages, complicating stable identity and diagnostics.
5. **Content categories are conflated:** every HTML table is called a table and treated as props when the `props` option is enabled. Rendered UI tables, Storybook Args/Controls tables, and unrelated tables are not distinguished. `pre` content has no contextual label; lists and blockquotes are merged as generic guidelines. Lists are only selected under `.sbdocs-content`, even when another recognized Docs wrapper was selected.
6. **Token duplication/provenance:** each page captures root CSS custom properties and styled/token-like elements and repeats the resulting observations in its Markdown page. Current rows lack page-level provenance fields beyond the page URL elsewhere in the document, frame identity, theme/viewport context, canonical-token status, or conflict handling. The renderer already labels computed styles as observations, which must remain true.
7. **Error/partial behavior:** individual entry errors are converted to warnings and successful pages are exported; an all-failed scan throws. A count equal to 120 triggers a “limited” warning even if the discovered set happened to contain exactly 120. The return field `failures` is the number of warnings, not a count of failed entries.
8. **Lifecycle/recovery:** a temporary tab is closed in `finally` while the service worker remains active. There is no durable job checkpoint or startup cleanup ledger. Closing the popup loses visible progress; worker termination/browser shutdown can interrupt work without a resume point. Current globals are run-local state.
9. **Download contract:** Current Docs and All Docs share one Markdown download flow, with a single Save As prompt. No archive implementation, ZIP library, extension storage, offscreen document, or web worker exists in the checkout. There is no extension-specific npm script.

### Inferences and proposed direction

- **Bounded concurrency is worth measuring** because navigation/render waits are likely to be a substantial component for a large index, but the available source and the task-provided output size do not establish elapsed time or speedup. Two or three concurrent inactive tabs may contend for memory, CPU, network and Storybook's own rendering. Three tabs are not automatically faster than two.
- **Start benchmark evaluation at two tabs**, preserving the serial mode as a baseline and fallback. Two workers offer independent navigation while limiting extra render pressure. Evaluate three only as a separate candidate. Production default remains **NEEDS-TEAM-DECISION** after results, Chrome/version coverage, and acceptable resource impact are reviewed.
- **Do DOM scraping in page execution contexts.** Web Workers cannot directly read the rendered tab DOM; the existing `chrome.scripting.executeScript` path can continue to extract small, JSON-serializable records in each page/frame. A Worker could receive those records to serialize Markdown, build token indexes, hash content, or compress ZIP bytes, but the task does not establish that these CPU operations are material at approximately 480 KiB.
- **Do not add a Worker by assumption.** Benchmark synchronous serialization and archive generation against a Worker with realistic exports and larger stress fixtures, measuring main-thread long tasks, total generation time, and peak memory. At 81 pages / ~480 KiB, message-copy/Worker startup and archive library overhead may outweigh gains; require evidence of UI responsiveness or time improvement against an agreed threshold. A worker would not accelerate page navigation or live DOM extraction.
- **ZIP generation context is unresolved:** the current MV3 service worker is non-DOM and the manifest has no offscreen permission/document. A candidate architecture is a bundled pure-JS ZIP generator in the service worker for modest bounded data, or a narrowly scoped offscreen document for Blob/URL work if browser testing shows that is required. Verify data/blob URL size/behavior, supported ZIP implementation, object-URL lifetime and save-dialog behavior in Chrome before committing to one. Do not add a remote library or broaden permissions beyond the current origin.

## Proposed architecture

### 1. Job coordinator and bounded tab pool

- Treat All Docs as a durable job with a stable job ID, source origin/base path, normalized discovery set, options, creation time, status, concurrency, next/pending IDs, per-entry result, and errors. Keep the active-tab ID separate from worker tab IDs.
- Begin with a two-slot pool; allocate one inactive tab per slot and dispatch the next unprocessed ID when a slot becomes free. Preserve original discovery order in final output regardless of completion order. Cap remains explicit; report the exact total discovered, selected, omitted, succeeded and failed counts.
- Use `chrome.storage.local` for durable job checkpoints and extracted results (requires adding the `storage` permission). Persist a checkpoint after each completed/failed page. Store only fictional/documentation extraction content locally as user-requested data; make retention and deletion behavior visible. **NEEDS-TEAM-DECISION:** storage retention ceiling and whether a completed job is kept until the user deletes it.
- Persist tab IDs/ownership in the checkpoint. On success, cancel, error and next extension startup, close only tabs recorded as owned by that job; never close the user's original tab. Handle missing/closed tab IDs idempotently. Add user cancel and resume/retry controls. A resumed job should reuse successful entries only when origin, index identity, options, and extractor/schema version match; otherwise offer re-extract.
- Each worker should have bounded navigation and Docs readiness timeouts with entry-level status. Cleanup must run across partial initialization, cancellation, download failure and thrown tab errors. Prevent duplicate runs for the same active source/job.

### 2. Readiness and navigation

- Resolve the Docs index and Storybook base URL relative to the current Storybook location/configuration; do not assume the site is at `/`. Keep `id` from the index as the canonical page key and use `URLSearchParams` to encode `path=/docs/{id}` without corrupting a deployment base path.
- For each slot, subscribe to tab events before navigation, then verify the final URL corresponds to the requested Docs ID. After document completion, poll with a short interval until a recognized Docs root is present and has stable, nonempty text for two consecutive samples, or a per-entry deadline expires. Re-query current tab state after listener attachment to close the registration race. Avoid fixed sleeps as the only readiness criterion.
- Extraction returns explicit readiness outcome, matched root selector, `frameId`, entry ID, title provenance (`rendered`, `index`, or fallback), source URL and content length. Distinguish “not ready”, “Docs wrapper absent”, “injection denied”, and “valid but empty” in the report. Select frames deterministically: prefer a Docs wrapper; if multiple candidates remain, record frame identities and use a stated tie-breaker instead of only content-length sorting.
- Keep the extractor function self-contained because Chrome serializes it into page contexts. Send only extracted records to the service worker. Do not pass DOM nodes or assume the extension service worker can access `document`.

### 3. Extraction model and classification

Use a versioned intermediate record, with raw observations retained separately from classification:

```json
{
  "schemaVersion": 1,
  "entryId": "...",
  "title": "...",
  "sourceUrl": "...",
  "frameId": 0,
  "sections": [],
  "propsTables": [],
  "renderedTables": [],
  "unknownTables": [],
  "examples": [],
  "guidelines": [],
  "tokenObservations": [],
  "warnings": []
}
```

- Classify tables using ordered evidence such as known Storybook Args/Controls selectors, captions/labels, column headers, row semantics, and nearest section heading. Keep confidence/reason and original table text. Low-confidence or unrecognized tables go to `unknownTables` and remain exportable. Do not label every table “props.” Validate against Storybook Docs versions/themes and examples that include rendered HTML data tables.
- Keep code samples as fenced blocks with nearest heading, language/class metadata when present, and stable order. Keep blockquotes and lists as separate guideline/note records with nearest section heading and list structure when extraction supports it. Do not claim inferred prop defaults/types.
- Page destination classification (`guides`, `components`, `form`) should use a documented, overridable rule: explicit mapping first; known metadata/tag conventions second; title/entry-ID vocabulary only as lower-confidence fallback; otherwise `components/` or an `unclassified` section in the report. Do not infer that component names containing “form” imply form guidance without a rule. **NEEDS-TEAM-DECISION:** confirm folder taxonomy and whether additional `unclassified/` is permitted versus mapping all uncertain Docs into `components/`.

### 4. Shared token index and provenance

- Aggregate only observations with compatible keys. For a CSS custom property, key by exact case-sensitive property name plus theme/context identity. Keep all distinct observed values; do not silently select one value if the same key differs by page/theme. A token row records `name`, raw value, observation kind (`css-custom-property`, `computed-style`, or `swatch`), source entry IDs/URLs, frame IDs, observed times and conflict set.
- Deduplicate an identical `(key, value, theme/context)` observation while preserving all source pages. Do not merge label-based computed styles into canonical CSS tokens. Preserve the existing caveat: runtime-observed values are not confirmed design tokens.
- Add source-page links/provenance in `tokens/` and references from each component/page. If theme identity cannot be determined, label it `unknown` and retain potentially conflicting values separately.
- **NEEDS-TEAM-DECISION:** what constitutes a theme/context identity (Storybook theme selector, computed root attributes, explicit user-selected theme, or unknown), whether identical computed styles should be globally deduplicated, and whether tokens are opt-in as they are now.

### 5. ZIP contents and deterministic naming

All Docs downloads one ZIP with this top-level structure:

```text
README.md
INDEX.md
manifest.json
guides/
components/
form/
tokens/
EXTRACTION_REPORT.md
```

- `README.md`: what was exported, source origin/base path, extraction timestamp, limits, fidelity caveats and token-observation caveat.
- `INDEX.md`: stable discovery-order list grouped by destination folder; title, path, Storybook entry ID and source URL; links to token catalog and extraction report.
- `manifest.json`: schema/exporter versions; source origin/base path; index URL and fingerprint; timestamps; option switches; discovered/selected/omitted counts; every entry ID/title/name/type, category/path/status/source URL, warnings/error code and content digest; token observations with provenance/conflicts; completion state. Serialize object keys and arrays deterministically. Keep volatile timestamps explicit so consumers do not confuse them with stable identity.
- `guides/`, `components/`, `form/`: one Markdown file per successfully extracted Docs page, with title, entry ID, source URL, classification/confidence, section order, separated props/rendered/unknown tables, code examples and guidelines. For unknown metadata, retain content and explain fallback classification.
- `tokens/README.md` and `tokens/design-tokens.md`: deduplicated observations, values, observation type, source page links and conflict groups. Include “observed, not canonical” on both documents.
- `EXTRACTION_REPORT.md`: counts and capped entries; per-entry success/failure/skip/readiness and classification warnings; table-classifier uncertainty; token conflicts; errors without sensitive stack traces; resumability/job ID; cleanup status and limitations.
- Deterministic relative paths: normalize entry title/name/title hierarchy using Unicode NFKC, lowercase, trim, replace unsafe/path separators with `-`, collapse repeated separators, cap segment length, reject `.`/`..`, and protect Windows reserved names. Prefer a stable Storybook hierarchy such as `components/button--primary.md`; if metadata is missing use the index entry ID. Resolve collisions with a stable short hash of the full entry ID (not completion order or a numeric counter), and maintain a manifest mapping from every index ID to exactly one archive path. Sort collisions/order independently from concurrency. **NEEDS-TEAM-DECISION:** preferred title hierarchy and maximum segment length.
- Only ZIP output is required for All Docs; ZIP internal paths represent the requested folders. Save As should offer one archive file, not multiple independent downloads. Keep Current Docs on its existing `.md` path, renderer and user flow. Shared extraction improvements may improve the content model, but do not change the Current Docs file format without a separately reviewed compatibility decision.

## Prioritized implementation plan

| Priority | Work | Acceptance evidence |
| --- | --- | --- |
| P0 | Add fixture inventory and baseline metrics for current sequential path; capture all outcomes on the 81-page case and small/large fixtures. | Reproducible extension/browser/version, fixture hash, options, raw timings, counts, warnings and memory observations; no extrapolated speed claims. |
| P1 | Define entry/result/job schemas, category rules, path algorithm, token provenance/conflict semantics, partial failure UX and resume retention. Decide open product items below. | Schema/path goldens; determinism and classifier fixture expectations approved. |
| P2 | Implement robust URL/base-path resolution and Docs readiness polling; explicit per-entry outcomes; listener race handling and frame/source metadata. | Tests for load-complete-but-not-rendered, delayed Docs root, SPA route, wrong route, iframe, access denial and timeout. |
| P3 | Implement sequential durable checkpoints, cancellation, idempotent cleanup, resume/retry and popup progress/status. | Restart worker/browser mid-job, popup close/reopen, cancelled, failed download and all-failed scenarios recover safely. |
| P4 | Benchmark bounded pool sizes 2 and 3 against sequential. Adopt two only if it improves median/upper percentile elapsed time without unacceptable failure, throttling or memory regression; retain a serial fallback. | Matrix and decision threshold below. Pool completion order must not change filenames, manifest ordering or content association. |
| P5 | Introduce intermediate extraction model and table/examples/guideline classifiers with confidence and raw fallback. | Representative Storybook versions, props and rendered-table fixtures reviewed; unknowns preserved. |
| P6 | Build shared token index and conflict/provenance output. | Repeated identical variables deduplicate with all sources; conflicting values remain distinct and traceable. |
| P7 | Generate archive and requested Markdown tree; benchmark main-thread vs Web Worker serialization/ZIP CPU and validate Chrome download path. | ZIP integrity, path safety, deterministic members and one Save As archive; choose Worker only from benchmark evidence. |
| P8 | Run permissions, lifecycle, accessibility of popup status/progress, compatibility and user-facing retention review; release only after acceptance. | Permission prompt is origin-scoped; cleanup and restart tests pass; Current Docs remains a single `.md` download. |

## Benchmark and test matrix

No performance measurements are available from this audit. Use the actual 81-page/~480 KiB case as a labeled real fixture when permitted, then add small and stress fixtures with fixed index and content. Record Chrome version/OS, Storybook build/version, origin/base path, cold/warm cache, options, discovered/success/failed count, output bytes, time-to-first-page, total elapsed time, per-page navigation/readiness/extraction/serialization/compression timings, main-thread long tasks, peak memory where available, download success and open-tab count. Repeat each case enough to report median and p90; publish raw trials and failures.

| Dimension | Cases | What it validates |
| --- | --- | --- |
| Crawl width | Sequential (1), bounded 2, bounded 3; same index/options/cache state | Real end-to-end comparison; no invented performance claims. Include throttled network and CPU contention where possible. |
| Readiness | Immediate Docs, delayed Docs root, skeleton then content, empty Docs, non-Docs route, redirect, SPA update, timeout | No fixed-delay-only dependence; correct requested ID and explicit failure reason. |
| Deployment/navigation | Root Storybook, nested base path, query already present, encoded IDs, trailing slash, private/authenticated same-origin site | Correct index and target URL; no loss of user auth context; no cross-origin crawl. |
| Frame behavior | Main-frame Docs, same-origin Docs iframe, cross-origin iframe, multiple matching frames, no readable frame | Deterministic selection, permission failure detail and no duplicate page export. |
| Extraction classes | Args/Controls props table, rendered data table, layout table, table without semantics, nested table, code blocks with backticks/language, lists, blockquotes, CSS vars | Correct category/confidence; content preserved when classification is uncertain. |
| Tokens | Same key/value across pages, key/value conflict, dark/light context, unlabelled computed style, duplicate swatches | Stable dedup, complete provenance, conflict retention, no canonical-token overclaim. |
| Paths/archive | Duplicate titles, missing title, unicode, punctuation, separators, `..`, reserved filenames, long names, same slug with distinct IDs | Safe deterministic names and one-to-one ID mapping; deterministic member order; no traversal/collision overwrite. |
| Partial/resume | One failed page, intermittent failure, all fail, cancellation, popup close, worker termination, browser restart, index changed, options changed | Checkpoint durability, correct retry policy, accurate counts, idempotent cleanup, explainable resume invalidation. |
| Download/permissions | Permission denied, download canceled, duplicate ZIP, save dialog, large archive, repeated retry | Single archive, user-facing error and no leaked worker tabs; minimum required origin permission. |
| CPU/Worker | Main-thread vs Worker on ~480 KiB and stress sets (e.g. 5/10 MiB of extracted text), ZIP off/on | Actual CPU cost, long tasks, total time and memory; worker only if a pre-agreed threshold is met. Worker never handles live DOM. |
| Regression | Current Docs with each include option and iframe; All Docs Markdown baseline comparison during transition | Current Docs continues to download one Markdown file with expected title/source/warnings; All Docs intentional switch to ZIP is isolated. |

**Comparison model (not a measured estimate):** let `T_i` be each page's navigation + readiness + extraction duration. Sequential elapsed time is approximately `ΣT_i` plus serial setup/serialization. An ideal pool width `k` has a lower bound of at least `max(ΣT_i/k, max(T_i))`, but real tabs contend for browser resources and have scheduling/setup overhead. Compare widths 1, 2 and 3 on identical cases; do not promise `1/k` speedup. The known 900 ms sleep contributes 72.9 seconds of explicit delay over 81 successful pages in the current code, but removing it requires readiness tests, not a performance-only assumption.

## Risks

- Concurrent tabs may increase memory use, contend with the active Storybook app, trigger server throttling, or make readiness/extraction less reliable. Keep concurrency bounded, configurable for testing, and serial fallback available.
- Storybook index shape, docs IDs, root paths, title hierarchy, ArgsTable markup and theme structure vary across versions/builds. Capture unknown content and report confidence rather than silently dropping it.
- A ZIP library increases extension package size and maintenance/supply-chain surface. No dependency is present; any dependency or vendored library needs license, version and integrity review. The requested no-install constraint applies to this audit; implementation dependency selection is open.
- Data URLs currently support the Markdown download but ZIP size and Chrome URL behavior for larger archive bytes are not verified here. Offscreen document/Blob route may need an additional permission and lifecycle handling. Validate with target Chrome versions before architecture commitment.
- A long scan can exceed assumptions around worker runtime, browser shutdown, downloads and popup lifetime. Checkpointing helps recovery but introduces sensitive local extracted content; define deletion/retention UX.
- Downloaded Docs may be internal/confidential. The extension keeps extraction local today; the archive remains user data. Do not introduce upload, telemetry, broad persistent content scripts, or wider host access.
- Determinism is limited if source pages mutate between runs or CSS/theme values are dynamic. Clearly distinguish stable file identity/order from timestamped extraction observations.
- Current Docs regression risk exists if the new intermediate model replaces the current renderer. Preserve its one-Markdown export as an explicit compatibility acceptance test.

## Unverified items

- The task-provided 81-page / ~480 KiB export was not supplied as a fixture and was not reproduced; source pages, exact Chrome/Storybook versions, options, timings, and breakdown of CSS-token bytes are unknown.
- No browser/extension interaction, permissions prompt, runtime state, visual output, download, ZIP, service-worker suspension, authenticated site, iframe policy, or cleanup behavior was executed in this audit.
- Whether a particular Storybook deployment uses root or nested index paths; actual supported index schemas and Docs ID route behavior are unverified.
- Whether archive generation fits comfortably in the MV3 worker for expected maximum output, whether offscreen DOM/Blob is necessary, and whether a Worker measurably improves responsiveness or throughput are unverified.
- Table selector/classifier evidence across Storybook generations/themes, category taxonomy, token theme identity, retention policy, concurrency default, archive library, and deterministic timestamp policy require product/engineering decisions.
- Official Chrome documentation was consulted as current design guidance; minimum Chrome version and the exact supported target matrix for this standalone extension are not declared in its manifest.

## NEEDS-TEAM-DECISION

1. Set acceptable p50/p90 crawl-time, peak-memory, error-rate and server-load thresholds for promoting concurrency 2 or 3; decide default and whether users can select it.
2. Approve category taxonomy and the fallback location/reporting for unclassified Docs pages.
3. Approve token theme/context identity, conflict display, and whether observed computed-style values share the catalog with CSS custom properties.
4. Set local checkpoint/archive retention and deletion behavior, and decide whether resume data is kept after a completed export.
5. Choose ZIP implementation context/library only after Chrome download/Blob tests and size benchmarks; approve any new permission/dependency separately.
6. Approve deterministic naming hierarchy/length and timestamp policy, plus whether manifest should include content digests.
7. Define supported Chrome/Storybook versions and the evidence threshold for table classification and readiness confidence.

## Commands and results

- Read-only inspection: `git status --short --branch`, `git rev-parse HEAD`, `git worktree list --porcelain`, source/document reads, directory inventory and `git check-ignore -v` for the report path. **Result:** expected feature branch and revision; one worktree; clean source tree before report creation; report path is not ignored.
- Actual package scripts reviewed in `package.json`; extension README's Node syntax commands were noted but not run. No tests, typecheck, build or browser validation were requested or performed.
- After saving this report, inspect `git diff --check` and `git status --short --branch` to verify only the authorized report path changed. Do not commit it or alter `.gitignore`.
