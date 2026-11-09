# Storybook → Markdown (Chrome Manifest V3)

A standalone Chrome extension that extracts rendered Storybook Docs locally. Current Docs downloads one Markdown file. All Docs discovers entries from the selected Storybook index and downloads one ZIP containing categorized Markdown pages and extraction metadata. The extension does not upload content.

## Install

1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select `tools/storybook-to-markdown`.
3. Open the Storybook Docs page to export and click the extension action.
4. Choose Current Docs or All Docs, select content options, and start the export.

No npm install or build is required. After editing extension files, reload the extension in `chrome://extensions`.

## Current Docs

Current Docs uses the temporary `activeTab` grant and downloads a single `.md` file through Chrome's Save As dialog. It extracts from accessible frames and continues to support a best-effort export when a recognized Docs wrapper is absent.

## All Docs

All Docs asks for host access to the selected Storybook origin only. It checks the current Storybook base path and origin-root `/index.json` and `/stories.json`, selects entries with `type: "docs"`, and caps the scan at 120 entries. It preserves each index ID, title, name, tags and source URL.

The crawl uses one inactive tab by default. The popup does not expose faster concurrency settings; two- and three-tab runs remain internal benchmark options. Navigation and Docs readiness have bounded timeouts. Readiness matches the requested ID in either the top-level `?path=/docs/<id>` route or a Docs preview frame's `?id=<id>&viewMode=docs` route, then requires a recognized Docs root, substantive text and three stable probes. Busy/loading selectors are recorded as evidence but do not veto stable, visible content on their own. The ZIP manifest records the selected frame ID, root selector, text length, busy selectors and stabilization samples. Extraction is limited to the frame that passed readiness and validates that frame's Storybook ID before saving content. Pages that fail remain in the job report and can be retried.

Progress is saved in `chrome.storage.local`, so closing and reopening the popup restores the current job. Pause stops assigning new entries, waits for in-flight page work to settle, then closes the job's temporary tabs. Cancel waits for active work and cleanup before reporting **Cancelled**. Resume continues from saved page outcomes. After a partial ZIP is downloaded, extracted page checkpoints are deleted; retrying a failed page or the failed set therefore re-crawls successful pages to rebuild a complete archive. Only one export job is allowed at a time.

The ZIP includes `README.md`, `INDEX.md`, `manifest.json`, `EXTRACTION_REPORT.md`, and the folders `guides/`, `components/`, `form/`, and `tokens/`. Storybook title hierarchy and tags classify guides and forms; other known component entries go in `components/`. Unknown or conflicting category metadata falls back to `components/` with low-confidence evidence recorded in the archive manifest, each affected page and `EXTRACTION_REPORT.md`. No `unclassified/` destination is emitted. Filenames are normalized and include a stable ID-derived suffix. The archive manifest maps every Docs ID to its path and records category evidence, page status and retry history. Partial exports include successful pages and list failures in the report.

HTML tables are classified as props/variants or rendered tables only when observed selectors, headers, roles or nearby headings provide evidence; ambiguous tables are retained as unclassified tables. Examples and guidelines retain nearby headings where available. Shared CSS variables and computed styles are deduplicated by identity, observed theme/context and value while keeping source-page provenance. Conflicting values within the same identity/context are retained and flagged. Theme identity is derived only from observed root theme/color-scheme metadata; absent metadata is labeled `unknown`. These are observations, not canonical design tokens.

The archive uses a bundled pure-JavaScript ZIP STORE writer with no compression dependency. The offscreen document supplies the Blob/object-URL download path: Chrome extension service workers have no DOM, and Chrome documents the `BLOBS` offscreen reason for Blob operations including `URL.createObjectURL()`. The ZIP format writer itself uses typed arrays and CRC-32 and does not scrape DOM. No Web Worker is used. Real Chrome download validation remains necessary.

## Validate

From the extension directory:

```bash
node --check background.js
node --check extractor.js
node --check popup.js
node --check offscreen.js
node tests/smoke.mjs
```

Then load the unpacked extension and verify Current Docs still downloads one `.md`; All Docs on an index with multiple Docs entries downloads one readable ZIP; the popup restores progress after close/reopen; Pause, Resume, Cancel and per-page retry produce the displayed outcomes; partial failures remain in the ZIP report; and temporary tabs close on terminal outcomes. Also test nested-base Storybook paths, denied permissions, readiness timeout and ZIP download cancellation on a supported Chrome version.

`tests/smoke.mjs` runs a dependency-free mocked-Chrome integration check, including a synthetic sequential/2-tab/3-tab scheduler comparison and the ZIP record/CRC format. It does not replace real-browser validation. The root package has no extension-specific npm test script. Its `typecheck`, `build` and Playwright scripts concern the demo-layout application and do not validate Chrome extension APIs or the real download flow.

`tests/chrome-e2e.mjs` expects a test Chrome profile with the unpacked extension loaded, remote debugging on port 9222, and `tests/storybook-fixture.mjs` running at `http://127.0.0.1:4179`. Open `http://127.0.0.1:4179/storybook/?path=/docs/guide--docs` in that profile, then run `STORYBOOK_ORIGIN=http://127.0.0.1:4179 node tests/chrome-e2e.mjs` from this directory. The runner exercises popup restoration, retries, pause/resume/cancel, Current Docs download, archive download and one/two/three-tab scheduling.

## Permissions, limits and privacy

- Declared permissions: `activeTab`, `scripting`, `downloads`, `storage`, and `offscreen`. The optional HTTP(S) host patterns are requested at runtime only for the selected origin.
- Docs are read from the user's existing page/authentication context. Requests and page navigation are restricted to that origin; there is no cross-domain crawl.
- Job checkpoints and extracted page content are saved locally during crawling. After the ZIP download completes successfully, extracted page checkpoints are deleted while job status and page outcomes remain available for popup restoration. Chrome storage quota can limit unusually large Docs sets; export will fail with a visible error if a checkpoint cannot be saved.
- The ZIP uses the classic ZIP format without Zip64; archives over 4 GiB are rejected. Current cap is 120 entries.
- Storybook versions, themes, index formats and rendered markup vary. Collapsed/unrendered content, inaccessible cross-origin frames, missing metadata and inferred prop defaults/types are not recovered.
- Exported Docs may be internal documentation. Review the archive before sharing.

## Project boundary

This extension is independent of `demo-layout/src`, routes, root package dependencies, build scripts and deployment workflows.
