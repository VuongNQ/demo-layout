# Storybook Offline Static Export Completion

**Author:** Vuowng  
**Date:** 2026-11-12  
**Branch:** `feat/storybook-to-markdown-extension`  
**Revision:** `4a9c876b56bd6b47d54c8cae6ee4a71d473e991d` (changes are uncommitted)  
**Worktree:** `C:\Users\vuong\demo-layout` (main checkout)

## Scope and summary

Completed the user-facing Offline Static ZIP workflow in `tools/storybook-to-markdown/`: authorization acknowledgement, Docs discovery/capture, a global asset registry, bounded same-origin fetching, safe static HTML generation and rewriting, offline navigation and reports, binary ZIP creation/download, progress controls, IndexedDB staging, retry and recovery behavior. Existing Storybook Markdown and Figma CSS flows remain separate.

Offline Static now produces a downloadable ZIP for Current Docs and All Docs. The background coordinator reuses the Storybook index and route/readiness contracts, scans selected pages serially with one owned crawler tab for All Docs, then discovers and fetches resources through one job-wide registry. Asset requests default to three concurrent workers. The archive has HTML pages, a local index, assets, manifests, an offline report and a README.

The output is a safe static snapshot. Page scripts are removed and captured JavaScript is not executed. This work does not establish interactive Storybook compatibility or real-browser visual fidelity. Chrome acceptance is unverified because no compatible browser was available.

## What the previous implementation provided

The baseline report described a tested `offline-static.js` utility layer for asset reference discovery, canonical URL registry/deduplication, asynchronous downloads, hashing and rewriting. It did not connect those primitives to the extension coordinator, capture and export Docs pages, stage binaries, create a user-facing site ZIP, expose popup controls or perform an integrated archive download. This completion adds those connections and binary ZIP support.

## Fixed pre-existing test failure

The baseline `npm test` failure was in `tests/figma-css.mjs:40`. It compared a preserved declaration's `raw` value with an LF-only expectation even though the fixture uses CRLF. The parser correctly retained the source line ending.

The test now derives its expected raw declaration from the original fixture using a CRLF-or-LF-aware match and compares against that source slice. No Figma parser behavior changed; byte-preservation remains asserted and the regression suite passes.

## Architecture and page workflow

1. `popup.html`/`popup.js` add Markdown and Offline Static format selection inside Storybook, Current Docs/All Docs scope, a confirmation that the user must verify organizational policy permits the content export and intended storage/transfer, progress counts, warnings and Pause/Resume/Cancel/Retry controls. Figma remains isolated.
2. `background.js` owns an independent Offline Static job and phase state. It rejects conflicting Storybook/Figma ZIP operations. Current Docs captures the selected source tab; All Docs discovers the index first and uses one owned crawler tab at a time.
3. The existing Storybook route `?path=/docs/<storybook-id>` and frame-aware Docs readiness remain in use. The selected Docs frame must pass readiness and its captured ID must match the expected entry.
4. `captureOfflinePage` records the Docs root markup, selected frame's stylesheet/style and metadata head tags, theme attributes, frame/readiness metadata and same-origin Resource Timing references where available. It does not export the Storybook manager shell or all computed layout state.
5. `offline-static.js` creates the global registry, discovers nested static dependencies, schedules fetches, stages bytes, rewrites references, generates manifests/navigation/reports and verifies local links.
6. `offscreen.js` creates a binary-safe ZIP Blob; the existing Chrome downloads handoff tracks the resulting download. Completion is reported after Chrome signals the archive download is complete.

The phase state distinguishes page discovery/capture, asset discovery/download, rewriting, site generation, compression and archive download. Page scan concurrency remains one tab. The existing 120-entry page cap remains and omitted entries are reported. Capture limits are 1 MiB/page and 16 MiB total HTML. The deterministic multi-page fixture exercises delayed readiness, wrong/missing root, failures, filenames and navigation through mocked Chrome APIs; it is not a live Storybook server test.

## Global asset registry and discovery

Each asset record tracks `assetId`, sanitized original URL, canonical fetch key, type, evidence, referring pages and parent assets, reference count, status, attempts, MIME type, byte sizes, SHA-256 hash, local path, rewrite status, error and warnings.

Discovery supports HTML stylesheet/script/preload/image/srcset/picture/media/poster/SVG references and inline styles; CSS `url()`, `@import`, quoted `image-set()` and font-face URLs; statically resolvable JS modules/re-exports/asset references; and same-origin Performance Resource Timing entries where visible. CSS and static JS dependency discovery is bounded at eight passes. Circular references reuse registry entries. Dynamic/runtime imports, APIs and unsupported iframe content are reported, not found by arbitrary crawling. Registry capacity is 5,000 entries.

### URL and content identity

- Canonical fetch identity is a normalized absolute HTTP(S) URL with the fragment removed. Query parameters are preserved; different URLs are never merged by pathname alone. SVG/HTML fragment meaning is retained during rewriting.
- A canonical URL is registered once; duplicate references share its registry record and in-flight Promise. A successful URL is fetched once per job.
- Downloaded bytes use SHA-256. Content deduplication requires matching resource type, MIME type and extension. It is enabled for semantics-safe binary/image/font/media/other members. CSS, JavaScript and SVG are stored separately because relative dependencies and fragment IDs can differ by source URL.
- References from all pages/parent assets remain in manifests when URLs or safe content are shared.

## Async downloads, bounds and lifecycle

- Asset concurrency defaults to three and is independent of the one-tab page crawler. Integrated smoke evidence observed a peak of 3 and did not exceed the bound.
- Fetch uses `credentials: 'omit'`, `redirect: 'error'`, a 15-second timeout and an approved-origin check. It rejects HTML/login/error responses, JSON-like API responses, incorrect MIME, credential-like text assets, oversized resources and origin escapes.
- Limits: 4 MiB per resource, 12 MiB aggregate asset staging/transfer, two automatic retries after the initial attempt (three attempts total) for transient errors, exponential backoff and bounded `Retry-After`. Permanent failures are reported without automatic retry; explicit user Retry can reattempt failures.
- Pause stops assigning new resources and waits for active fetches to settle. Resume continues the in-memory work. Cancel aborts supported requests, prevents ZIP handoff and cleans extension-owned temporary resources. Counters separately report discovered, queued, downloading, downloaded, failed, skipped, deduplicated and downloaded bytes.
- Offline coordinator limit is 32 MiB uncompressed. The binary ZIP writer has a 64 MiB complete ZIP ceiling and a 64 MiB uncompressed guard. No data is silently truncated. ZIP construction is in-memory and crosses the extension/offscreen message path; these bounds do not prove a fixed peak browser memory footprint.

### Staging and checkpoints

Compact job metadata/progress stays in `chrome.storage.local`; binary assets use extension-owned IndexedDB database `storybook-offline-assets-v1`, store `assets`, keyed by origin plus canonical URL. Staged data is reused only after SHA-256 revalidation. Storage quota/transaction errors are reported. Partial failed runs retain verified assets for retry; success and cancellation clean staging for that origin. Stale records older than seven days are removed at the next export. Cleanup only touches this extension database.

Pause/resume while the worker is alive is tested. On worker restart, page buffers cannot be restored; the job is marked failed and the owned crawler tab is closed when possible. An explicit retry rescans pages and can reuse valid staged assets. This is recovery assistance, not a guarantee that MV3 can resume the original in-memory job. The source tab and other user tabs are not closed.

## HTML, rewrite and archive

The generated archive contains:

```text
index.html
pages/<storybook-id>.html
assets/css/...
assets/js/...
assets/images/...
assets/fonts/...
assets/svg/...
assets/other/...
manifest.json
ASSET_MANIFEST.json
OFFLINE_REPORT.md
README.md
```

Storybook IDs are the stable filename basis with the established `--docs` suffix. The local index preserves available title hierarchy and links selected pages with missing/partial indicators. Supported HTML/CSS/srcset/SVG references are rewritten to deterministic relative archive paths. Generated-file validation rejects unresolved internal links. Sensitive URL material is redacted; secret-bearing references are excluded.

Scripts, inline event handlers, forms and unsupported active content are removed or made inert. Captured JavaScript can be inventoried/packaged but is not executed. Dynamic imports, API-backed widgets and runtime-only resources remain unsupported; no API body is collected. Manifests/reports distinguish missing dependencies and unsupported behavior.

Pages are `STATIC_READY`, `PARTIAL` or `FAILED`. `STATIC_READY` means a page was generated and passed available structural/local-reference checks without blocking resource failures. It does not mean Chrome rendered it faithfully, loaded fonts, or supports interactions. The source-frame stylesheet context and computed visual state may not be complete.

The ZIP writer accepts UTF-8 strings, `Uint8Array` and `ArrayBuffer`, generates CRC-32, and validates safe paths/duplicate members. Integrated tests check member paths and CRCs. Smoke independently lists and extracts a generated Offline Static ZIP with Windows `tar.exe` and compares extracted image bytes to the fixture binary.

## Security and authorization

- A required user confirmation asks that organizational policy permits the selected export and intended storage/transfer. The extension cannot determine company authorization from site access.
- Chrome is asked for optional host access only to the selected Storybook origin at runtime. The manifest's optional HTTP(S) host patterns already existed; no new always-on permission was added. Current Docs uses the selected tab; All Docs uses a same-origin owned tab.
- Asset fetches omit credentials, reject redirects and do not read/export cookies, localStorage, sessionStorage, bearer tokens or authorization headers. Cross-origin and likely secret-bearing URLs are skipped. Protected assets may therefore be missing.
- HTML authentication/error responses and JSON-like response bodies are excluded. Captures/assets stay local; no external service receives them. The extension distribution archive contains runtime files only, not exported Storybook content.

## Files changed

Under `tools/storybook-to-markdown/`:

- `background.js` — independent coordinator, capture, progress, lifecycle, IndexedDB staging and recovery.
- `offline-static.js` — registry, discovery, scheduler, rewrite, site/manifests/report/local checks (new).
- `offscreen.js` — binary ZIP entries and safe directory paths, retaining existing consumers.
- `popup.html`, `popup.js` — Offline format/scope/authorization/progress UI and reopen state.
- `manifest.json` — description only; version remains `0.3.1`, permissions unchanged.
- `scripts/lib.mjs` — safe ZIP directory-entry support.
- `README.md` — workflow, limits, security, ZIP layout and preview limitations.
- `package.json` — includes Offline Static regression suite.
- `tests/offline-static.mjs` (new), `tests/smoke.mjs`, `tests/popup-ui.mjs`, `tests/storybook-fixture.mjs` — asset/coordinator/UI fixture tests.
- `tests/figma-css.mjs` — CRLF-aware source-preservation expectation; parser untouched.
- `tests/build-packaging.mjs`, `tests/versioning.mjs` — runtime graph/Windows/version contracts.
- `release/storybook-to-markdown-v0.3.1.zip` — rebuilt extension runtime package, without internal Docs content.

This report is local-only under `docs/reports/2026-11-11/`. No `.gitignore`, React application, auth contract, GitHub Actions workflow, GitHub Pages workflow, npm dependency or unrelated application file was changed. `npm run build` was not run; version stays `0.3.1`.

## Validation

Commands and observed results:

```text
node tools/storybook-to-markdown/tests/smoke.mjs
PASS — Current Docs and All Docs ZIPs, shared CSS/image/JS fetched once, actual peak asset concurrency 3, nested CSS/font/static JS, retry/pause/resume/cancel, staged reuse/cleanup, authorization gate, no external fetch, page/path/status checks, ZIP CRC. With subprocess access, Windows tar independently listed and extracted Offline Static ZIP and binary comparison passed.

cd tools/storybook-to-markdown
npm test
PASS — build/packaging, Figma CSS, Offline Static, popup UI and versioning.
npm run build:raw
PASS — v0.3.1, 10 runtime files; no version change.
npm run package
PASS — 10 extension files; ZIP size 215,370 bytes.
npm run verify
PASS — v0.3.1, 10 files; safe paths, bounds, version and CRC checks. System unzip unavailable.

node --check background.js
node --check offline-static.js
node --check popup.js
node --check offscreen.js
node --check scripts/lib.mjs
node --check tests/smoke.mjs
node --check tests/offline-static.mjs
node --check tests/popup-ui.mjs
node --check tests/figma-css.mjs
node --check tests/versioning.mjs
node --check tests/storybook-fixture.mjs
PASS — all syntax checks.

git diff --check
PASS
```

Smoke uses mocked Chrome APIs and fixture responses. It establishes integrated registry fetch counts and scheduler behavior, not Chrome permission prompts, real downloads, company Storybook capture, visual fidelity or network-disabled browser navigation. The test's system `unzip` path was unavailable; `tar.exe` independently validated the Offline ZIP. `npm run verify`'s built-in checks also passed.

## Chrome acceptance and evidence labels

**BLOCKED / UNVERIFIED:** `chrome.exe`, `msedge.exe` and `chromium.exe` were not found on PATH. No compatible browser was available to load the unpacked extension, host and crawl a local Storybook, disable networking, inspect requests, preview actual pages, test Chrome download behavior, or run real window/lifecycle controls. Python and system `unzip` were also unavailable. `tar.exe` was available for the independent ZIP extraction above.

- **CONFIRMED:** Node module/coordinator tests generate Current Docs and All Docs ZIPs; canonical shared resources fetch once through the mocked coordinator; peak asset requests were 3; manifests, local paths/navigation, missing assets, retries, staging and ZIP CRC/integrity checks pass; Markdown/Figma regressions and build/package/version contracts pass.
- **INFERRED:** Selected-origin host permissions and same-origin fetch policy should work as implemented in Chrome. Existing frame readiness/root checks should support Storybook variants matching those contracts. These were not observed in a live browser.
- **UNVERIFIED:** Layout/style/font fidelity, `file://` and localhost rendering, protected-resource behavior, performance-resource visibility in live frame arrangements, Chrome MV3 suspension timing and browser download UX.
- **BLOCKED:** Real Chrome and network-disabled acceptance with an authorized internal Storybook was unavailable in this environment.

## Limitations, risks and NEEDS-TEAM-DECISION

- This is a static snapshot, not a full Storybook deployment. Interactions, API-backed widgets, dynamic imports, auth-dependent assets and runtime-only dependencies may remain unsupported.
- Captured markup/style context excludes manager shell and may omit styles or computed layout outside the Docs frame. Visual fidelity requires real browser validation. `STATIC_READY` is a structural/resource result, not screenshot or interaction proof.
- Worker restart loses in-memory pages; retry rescans. Binary ZIP generation is bounded but in-memory peak behavior is not measured across Chrome/device versions.
- Browser handling of extracted `file://` assets varies; README recommends local HTTP preview. Neither mode was browser-tested here.
- User confirmation is not organizational approval.

**NEEDS-TEAM-DECISION**

1. Confirm size defaults (120 Docs, 4 MiB/resource, 12 MiB asset staging, 16 MiB captured HTML, 32 MiB uncompressed ZIP) with real authorized Storybook sizes.
2. Confirm the seven-day partial staging retention policy and whether it should be configurable.
3. Decide whether an interactive mode is required. It needs a separate security review and real offline browser acceptance; safe static mode does not execute page scripts.
4. Run Chrome acceptance with an authorized internal Storybook: selected-origin permission, network-disabled localhost preview, protected/missing assets, window reopen and controls.
5. Confirm supported Storybook root selectors/versions and whether additional explicitly approved origins are needed. Current behavior excludes all origins beyond the selected Storybook origin.
