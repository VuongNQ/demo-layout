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

The crawl defaults to two inactive tabs; choose one tab for sequential crawling or three for comparison. Navigation and Docs readiness have bounded timeouts. Readiness requires the requested Docs ID, a recognized Docs wrapper, nonempty text and three stable probes. Pages that fail remain in the job report and can be retried.

Progress is saved in `chrome.storage.local`, so closing and reopening the popup restores the current job. Pause stops assigning new entries, waits for in-flight page work to settle, then closes the job's temporary tabs. Cancel waits for active work and cleanup before reporting **Cancelled**. Resume continues from saved page outcomes. Only one export job is allowed at a time.

The ZIP includes `README.md`, `INDEX.md`, `manifest.json`, `EXTRACTION_REPORT.md`, `guides/`, `components/`, `form/`, `unclassified/`, and `tokens/`. Storybook tags and title hierarchy are used when they explicitly identify a category; entries without category evidence go under `unclassified/`. Filenames are normalized and include a stable ID-derived suffix. The manifest maps every Docs ID to its archive path and records page status and retry history. Partial exports include successful pages and list failures in the report.

HTML tables are classified as props/variants or rendered tables only when observed selectors, headers, roles or nearby headings provide evidence; ambiguous tables are retained as unclassified tables. Examples and guidelines retain nearby headings where available. Shared CSS variables and computed styles are deduplicated by observed key/value while keeping source-page provenance and conflicting values. They are labeled observations, not canonical design tokens.

The archive is built in a bundled offscreen document with ZIP STORE entries (no compression library). There is no Web Worker: DOM access remains in injected tab scripts and current packaging work has not been shown to be CPU-bound. The popup stays responsive while ZIP bytes are assembled offscreen.

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
- Job checkpoints and extracted page content remain in local extension storage until replaced by a later export or the extension is removed. Chrome storage quota can limit unusually large Docs sets; export will fail with a visible error if a checkpoint cannot be saved.
- The ZIP uses the classic ZIP format without Zip64; archives over 4 GiB are rejected. Current cap is 120 entries.
- Storybook versions, themes, index formats and rendered markup vary. Collapsed/unrendered content, inaccessible cross-origin frames, missing metadata and inferred prop defaults/types are not recovered.
- Exported Docs may be internal documentation. Review the archive before sharing.

## Project boundary

This extension is independent of `demo-layout/src`, routes, root package dependencies, build scripts and deployment workflows.
