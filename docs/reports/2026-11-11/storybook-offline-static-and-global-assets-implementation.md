# Storybook Offline Static and Global Assets Implementation

- **Author:** Vuowng
- **Date:** 2026-11-11
- **Branch:** `feat/storybook-to-markdown-extension`
- **Revision:** `4a9c876b56bd6b47d54c8cae6ee4a71d473e991d` (starting revision; changes remain uncommitted)
- **Worktree:** `C:\Users\vuong\demo-layout`
- **Scope:** `tools/storybook-to-markdown/` and this requested report. No React app files or workflow files changed.

## Executive summary

This change adds an isolated Offline Static asset-processing foundation in `offline-static.js`, wires it into the MV3 service-worker runtime graph, and adds deterministic tests for URL policy, global URL identity, static reference discovery, bounded request scheduling, content hashing/deduplication, path assignment, URL rewriting, and login-page rejection. The existing Storybook Markdown and Figma adapters were not rewritten.

**The requested user-facing Offline Static exporter is not complete.** The extension UI still offers Markdown only. There is no explicit authorization dialog, page HTML capture orchestration, recursive CSS asset queue in the extension flow, binary staging, safe offline HTML generation, archive manifests/reports, pause/resume/cancel or retry UI for offline jobs, or real offline-browser acceptance. No offline archive is generated. The README marks this status plainly. This report records partial implementation evidence and the blocking design decisions rather than claiming the business objective is met.

## Initial implementation evidence

- The required feature branch was created locally to track the existing `origin/feat/storybook-to-markdown-extension` branch. The worktree was clean before edits.
- Starting revision was `4a9c876b56bd6b47d54c8cae6ee4a71d473e991d`.
- The extension already had one-tab Docs crawling, Storybook index discovery capped at 120 entries, frame-aware readiness, `chrome.storage.local` Markdown checkpoints, a pure-JavaScript classic ZIP writer and offscreen Blob/object-URL download handoff.
- The ZIP writer accepts UTF-8 strings and builds the full ZIP in memory. It has no binary-entry interface, Zip64 or staged/chunked archive path. The existing page checkpoint holds extracted page objects in `storage.local`; this is not suitable for unbounded HTML and binary assets.
- The optional host-permission declaration already covers HTTP(S), but this implementation does not request or use it for Offline Static.
- Existing runtime/package graph follows `importScripts` references. `offline-static.js` is imported by the worker and was included in the verified runtime package.

## Implemented architecture and data flow

`background.js` imports `extractor.js` and `offline-static.js`. The new module exposes a small global API for the MV3 worker and is independently loadable in Node tests. It is not yet called by an export message handler.

The registry resolves candidate references against a supplied base URL and approves only HTTP(S) URLs on one supplied origin. URLs with user information, secret-like query parameter names, or secret-like URL values are rejected. URL fragments are excluded from fetch identity while returned separately by `register`. Query strings remain part of identity. Registry entries retain references to all page IDs and parent asset IDs, discovery evidence, status, attempts, MIME type, byte count, content hash, local path, rewrite status, warnings and failure reason.

## Page discovery strategy

No Offline Static page discovery flow was implemented. The existing Markdown `discover()` behavior is preserved: it inspects supported Storybook `index.json`/`stories.json` shapes, selects Docs entries, retains IDs and metadata and applies the current 120-entry cap. Existing URL routing uses `?path=/docs/<storybook-id>` and readiness checks select the frame matching the requested Storybook ID. These are confirmed source behaviors, not new Offline Static acceptance evidence.

## Asset discovery and registry

Implemented scanners identify common HTML `src`, `href`, `poster`, `srcset`, inline-style CSS URLs, CSS `@import`/`url()`, static JS import/re-export and literal import references. Iframe references are labeled `unsupported-iframe` by the scanner. Static JS scanning counts non-literal dynamic imports as unresolved evidence. These parsers are best-effort textual scanners; they do not constitute a standards-complete HTML, CSS or JavaScript parser.

The registry's URL identity is the normalized full URL minus fragment. Distinct query strings remain distinct. A duplicate URL maps to one entry and accumulates referring page/asset IDs. The scheduler shares an in-flight Promise for identical canonical keys. After download, same-resource-type and same-MIME SHA-256 matches share one archive path; separate types or MIME semantics are not merged. Failed resources can be explicitly passed to `download()` again. There is not yet a recursive dependency driver or persistent serialized registry in a production export job.

## Asynchronous download queue

The isolated scheduler defaults to three concurrent requests, a 15-second timeout, two retries after the initial request, 8 MiB per resource and 100 MiB total successfully staged payload. It uses exponential backoff capped at four seconds and honors numeric `Retry-After` seconds up to ten seconds. It sets `credentials: 'omit'`, follows redirects only if the final origin equals the approved origin, rejects HTML responses, enforces declared and measured size limits, records states, hashes payloads and makes downloaded bytes available in memory.

Tests confirm three overlapping mocked requests never exceed three active operations; a duplicate concurrent URL shares one request; identical content with matching type/MIME shares an archive path; and HTML login-like bodies do not count as valid assets. Pause/resume, cancellation, streaming size enforcement, quota handling, restart recovery and persisted binary reuse are not implemented. `arrayBuffer()` buffers each resource fully, so the library's limits are necessary but do not provide bounded streaming memory use.

## Checkpoint and storage strategy

The new asset primitives do not persist binary files. The existing Markdown `chrome.storage.local` checkpoint remains unchanged. IndexedDB in an extension-owned offscreen document is a plausible binary staging option, but no staging schema, transaction lifecycle, quota recovery, integrity revalidation after restart or cleanup policy was implemented. This is a **NEEDS-TEAM-DECISION** before claiming recovery guarantees for large offline exports.

## HTML snapshot, rewrite and ZIP generation

No page snapshot strategy or generated offline page exists. `rewriteReferences()` provides a tested attribute/srcset/CSS `url()` rewrite primitive using registry paths and relative paths; it is not a DOM-based snapshot sanitizer and must not be treated as safe page generation. The existing offscreen ZIP writer remains string-only and memory-resident, so binary assets are not packaged. There is no `index.html`, `pages/`, `assets/`, offline manifest, asset manifest, README or offline report output from this feature.

No offline compatibility classification is produced. There are no offline navigation, local-resource completeness or visual/interactive compatibility checks.

## Security and authorization

The asset module enforces one approved origin per registry, rejects credential-bearing URLs and secret-like query keys/values, never reads cookies/storage/authorization headers, requests do not include credentials, HTML responses are rejected, and off-origin final redirects are rejected. Existing Markdown permission and export behavior is unchanged.

The required explicit user authorization confirmation is **not implemented**, and the module is not exposed as an export action. Cross-origin resource review/approval UI, content-type validation beyond rejecting `text/html`, removal of active content, and generated-manifest URL redaction have not been integrated. The security tests cover URL screening but do not demonstrate real Chrome permission behavior or internal network authorization.

## Files added or modified

- Modified `tools/storybook-to-markdown/background.js`: imports the asset module into the MV3 service worker; no new action or job flow is connected.
- Added `tools/storybook-to-markdown/offline-static.js`: URL validation, registry, scanners, scheduler, path/digest helpers and rewrite primitive.
- Added `tools/storybook-to-markdown/tests/offline-static.mjs`: deterministic unit tests.
- Modified `tools/storybook-to-markdown/package.json`: runs the new asset tests in `npm test`.
- Modified `tools/storybook-to-markdown/tests/build-packaging.mjs`: verifies the new runtime file is packaged.
- Modified `tools/storybook-to-markdown/tests/smoke.mjs`: system unzip is optional on platforms without it; the existing built-in header/CRC checks still run. Result reports independent unzip availability separately.
- Modified `tools/storybook-to-markdown/README.md`: describes the implemented primitives and explicitly states the exporter is not yet available.
- `tools/storybook-to-markdown/release/storybook-to-markdown-v0.3.1.zip` was regenerated by the explicitly requested package validation. It contains extension runtime files only, no Storybook content.
- Added this local-only report under `docs/`; it is not part of the extension package.

## Validation commands and actual results

| Command | Result |
| --- | --- |
| `node tools/storybook-to-markdown/tests/smoke.mjs` | PASS. Current Markdown, All Docs mock, Figma ZIP, existing scheduler and CRC checks passed. System `unzip` was unavailable, so independent reader validation was unavailable. |
| `node tests/offline-static.mjs` (from extension directory) | PASS. URL identity/sensitive URL checks, scanners, reference rewrite, in-flight dedupe, content hash dedupe, concurrency peak 3 and login HTML rejection passed. |
| `node --check background.js && node --check extractor.js && node --check offline-static.js && node --check popup.js && node --check figma-css.js && node --check offscreen.js` | PASS. |
| `npm test` | FAIL in pre-existing `tests/figma-css.mjs:40`: fixture returned CRLF before `color`, while the assertion expects LF. The packaging test that runs first passed; the suite stopped before the newly added offline test, which was run directly and passed. No unrelated Figma files were changed. |
| `npm run build:raw` | PASS. Built v0.3.1 without version changes; runtime graph contains 10 files including `offline-static.js`. |
| `npm run package` | PASS. Packaged 10 runtime files, 137,889 bytes. |
| `npm run verify` | PASS. Built-in archive member/path/size/version/CRC verification passed. System `unzip` was unavailable. |
| `git diff --check` | PASS. |

No version bump command was run. No dependency was installed. Workflow YAML was not changed. No browser suite was run.

## Real Chrome acceptance status

**BLOCKED / NOT RUN.** The current implementation has no offline export UI or backend workflow to exercise. Therefore the local Storybook fixture, authorization confirmation, page capture, registry deduplication in Chrome, offline ZIP, network-disabled preview, file navigation, font/resource verification, Pause/Resume/Cancel and window reopen could not be accepted. Existing mocked Markdown behavior is not evidence for Offline Static.

## Known limitations, risks and unverified behavior

- Static scanners can miss escaped, generated or runtime-only references and can produce false positives. JavaScript parsing is intentionally incomplete.
- `srcset` tokenization by commas is best-effort and can mishandle data-like candidates (data URLs are excluded at URL validation).
- A 100 MiB payload limit does not imply safe memory use when payloads, rewritten content and ZIP buffers coexist. Streaming/staged ZIP packaging is unverified and absent.
- Same-origin fetches omit credentials by design; internal resources that require the interactive browser's authenticated context will fail. No cookie transfer or browser storage access is implemented.
- Credentials embedded in URL query values beyond the conservative patterns may not be detected. No sanitized archive manifest currently exists to assess leakage.
- Hash deduplication has only mocked Node evidence and depends on Web Crypto being available in the eventual extension execution context.
- No offline browser compatibility, visual fidelity or interactive behavior has been established.

## NEEDS-TEAM-DECISION

1. Approve the final authorization wording and confirmation UX, including intended archive storage/transfer acknowledgement.
2. Confirm whether authenticated same-origin assets should be fetched without credentials (current primitive behavior) or through a narrowly scoped in-page mechanism that never exposes or persists credentials.
3. Approve IndexedDB staging limits, retention/cancel cleanup rules and restart recovery guarantees.
4. Decide whether static snapshots should remove all scripts by default and which static module/resource classes are permitted into the archive.
5. Approve archive byte/memory ceilings after measuring the binary ZIP path in supported Chrome versions.

The business objective remains incomplete until these design points are resolved and the user-facing export, generated archive and real offline browser checks are implemented.
