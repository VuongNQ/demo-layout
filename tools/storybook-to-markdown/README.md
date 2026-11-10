# Storybook → Markdown (Chrome Manifest V3)

A standalone Chrome extension that extracts rendered Storybook Docs locally. Current Docs downloads one Markdown file. All Docs discovers entries from the selected Storybook index and downloads one ZIP containing categorized Markdown pages and extraction metadata. The extension does not upload content.

## Build and package the extension

Node.js 18 or newer is required. The standalone extension package has no npm dependencies and does not build the demo-layout React application. Run commands from `tools/storybook-to-markdown/`:

```bash
npm run build
npm run build:patch
npm run build:minor
npm run build:raw
npm run package
npm run verify
npm run clean
```

`manifest.json` is the authoritative version source; the bump scripts validate it against `package.json` before changing either file. `npm run build` and `npm run build:patch` bump PATCH once and build (`0.3.0` becomes `0.3.1`). `npm run build:minor` bumps MINOR, resets PATCH to zero (`0.3.1` becomes `0.4.0`), and builds. `npm run build:raw` builds without changing either version file. `npm run package` rebuilds through `build:raw` (no bump) and packages `release/storybook-to-markdown-v<manifest-version>.zip`. The ZIP contains the contents of `dist/` directly, with `manifest.json` at its root. `npm run verify` checks the existing build and ZIP without changing versions. `npm run clean` removes `dist/` and generated `storybook-to-markdown-v*.zip` files without changing versions, preserving unrelated files under `release/`. Run `npm test` for build, packaging, Figma CSS import, and versioning regressions.

To load the unpacked build, open `chrome://extensions/`, enable Developer mode, choose **Load unpacked**, and select `tools/storybook-to-markdown/dist/`. To use the release ZIP, extract it first and load the extracted directory with **Load unpacked**; Chrome does not install the extension directly from this ZIP.

## GitHub Actions builds

The **Build Storybook-to-Markdown extension** workflow validates pull requests targeting `main` when extension files or the workflow change. Pull requests run syntax checks, smoke and packaging tests, `build:raw`, packaging, and ZIP verification without changing version metadata or uploading an artifact. A push to `main` with those same path changes bumps MINOR exactly once in the runner, builds with `build:raw`, packages that version, verifies the ZIP, and uploads it. Manual **Run workflow** builds default to `raw`; select `minor` to explicitly bump the runner's artifact version. The ZIP name uses the version embedded from `manifest.json`, and the GitHub Actions artifact name is `storybook-to-markdown-v<version>-<commit-sha>` with 30-day retention. Download it from the workflow run's **Artifacts** section in the repository's **Actions** tab.

An Actions version bump exists only in that run's checkout. It does not update committed `manifest.json`, package source, later workflow runs, or the main branch. Repeated main builds from the same committed base version can therefore produce the same MINOR version; the commit SHA in the artifact name distinguishes those builds. No commit, tag, or release is created automatically. A durable monotonically increasing release-version strategy is **NEEDS-TEAM-DECISION**.

To download a CI build, open the workflow run from the repository's **Actions** tab and download its **Artifacts** item. Extract the downloaded artifact ZIP, then open `chrome://extensions/`, enable **Developer mode**, choose **Load unpacked**, and select the extracted directory containing `manifest.json`. The archive is a distribution package for the extension; it is separate from the ZIP produced by **All Docs**, which contains exported Storybook Markdown documentation.

The release ZIP contains the Chrome extension runtime. It is different from the ZIP produced by **All Docs**, which contains the user's exported Storybook Markdown pages and observations.

## Load the extension from source

1. Open `chrome://extensions` and enable Developer mode.
2. Choose **Load unpacked** and select `tools/storybook-to-markdown`.
3. Open the Storybook Docs page to export and click the extension action. Chrome opens a separate extension tool window; clicking the action again focuses that window.
4. Choose **Storybook Docs** or **Figma CSS**, select the relevant options, and start the export.
5. Close the tool window with its **Close** button or the native window close control. The button closes only the extension window.

The tool window remains open when focus moves to another browser tab, another browser window, or another application. It is a normal Chrome extension window and is not guaranteed to stay above other applications. Closing it does not cancel a Storybook job; crawler progress remains in `chrome.storage.local` and is restored when you reopen the extension. No window is opened automatically at browser startup.

The Storybook Docs and Figma CSS tabs have separate controls, previews, status, errors and reset behavior. Switching tabs keeps the current Figma draft in memory and does not start or cancel exports. Pasted CSS is not persisted: closing the extension window discards that draft. Storybook job progress is persisted separately and can be restored after reopening.

No install or build is required to load the source directory directly. After editing extension files, reload the extension in `chrome://extensions`.

## Current Docs

Current Docs uses the browser tab that was active when the extension toolbar action was clicked, even though opening the tool window changes focus. It downloads a single `.md` file through Chrome's Save As dialog. Before extraction, the extension verifies that the original tab still exists, has not navigated, and remains on a Docs route. If that context is unavailable, it shows an error asking you to return to the intended Docs page and click the extension action again; it does not select another active tab. The action click grants `activeTab` access to the originating tab. That temporary access is tied to that tab and is no longer valid after navigation; the tab/URL checks prevent extraction from a changed page. Current Docs extracts from accessible frames and continues to support a best-effort export when a recognized Docs wrapper is absent on an eligible Docs route.

## Figma CSS import

Choose **Figma CSS** to paste the text produced by Figma's Copy CSS action; Figma Dev Mode is not required. The **Figma Source URL** field is optional and accepts Figma Design (`/design/...`) and Prototype (`/proto/...`) URLs, including `node-id=13-3169`, which is recorded as `13:3169`. It preserves source provenance only; the CSS is parsed from the text you paste and is never fetched from Figma. The importer does not authenticate, call Figma APIs, inspect an open Figma tab, or send pasted CSS to any service. CSS `url(...)` values are retained as text and are not fetched.

Choose **Parse / preview** to review the flat source-ordered layers and parser/source warning count, then **Export ZIP** to download one archive. The ZIP contains `source/original.css`, one Markdown page per parsed layer, an `INDEX.md`, JSON `manifest.json`, `EXTRACTION_REPORT.md`, and `tokens/observed-values.md`. The original CSS is retained verbatim as UTF-8 text. Layer metadata is limited to declarations present in the paste; unavailable groups are labeled unavailable. Source order does not establish parent-child hierarchy. Style-reference comments and custom properties are recorded as observations, not verified Figma variables or canonical design tokens. Malformed declarations remain in the layer data and are reported.

Figma CSS import runs locally and does not use Storybook discovery, host permissions, page tabs, or crawl controls. It shares only the existing offscreen ZIP and Chrome download utilities; a Figma ZIP export is not run concurrently with an active Storybook crawl or Current Docs export.

## All Docs

All Docs asks for host access to the selected Storybook origin only. It checks the current Storybook base path and origin-root `/index.json` and `/stories.json`, selects entries with `type: "docs"`, and caps the scan at 120 entries. It preserves each index ID, title, name, tags and source URL.

The crawl uses one inactive tab by default. The popup does not expose faster concurrency settings; two- and three-tab runs remain internal benchmark options. Navigation and Docs readiness have bounded timeouts. Readiness matches the requested ID in either the top-level `?path=/docs/<id>` route or a Docs preview frame's `?id=<id>&viewMode=docs` route, then requires a recognized Docs root, substantive text and three stable probes. Busy/loading selectors are recorded as evidence but do not veto stable, visible content on their own. The ZIP manifest records the selected frame ID, root selector, text length, busy selectors and stabilization samples. Extraction is limited to the frame that passed readiness and validates that frame's Storybook ID before saving content. Pages that fail remain in the job report and can be retried.

Progress is saved in `chrome.storage.local`, so closing and reopening the extension window restores the current job. Pause stops assigning new entries, waits for in-flight page work to settle, then closes the job's temporary tabs. Cancel waits for active work and cleanup before reporting **Cancelled**. Resume continues from saved page outcomes. After a partial ZIP is downloaded, extracted page checkpoints are deleted; retrying a failed page or the failed set therefore re-crawls successful pages to rebuild a complete archive. Only one export job is allowed at a time.

The ZIP includes `README.md`, `INDEX.md`, `manifest.json`, `EXTRACTION_REPORT.md`, and the folders `guides/`, `components/`, `form/`, and `tokens/`. Storybook title hierarchy and tags classify guides and forms; other known component entries go in `components/`. Unknown or conflicting category metadata falls back to `components/` with low-confidence evidence recorded in the archive manifest, each affected page and `EXTRACTION_REPORT.md`. No `unclassified/` destination is emitted. Markdown filenames come from normalized Storybook IDs (including the `--docs` suffix); an ID-derived hash is appended only when sanitized IDs collide. The archive manifest maps every Docs ID to its path and records category evidence, page status and retry history. Partial exports include successful pages and list failures in the report.

HTML tables are classified as props/variants or rendered tables only when observed selectors, headers, roles or nearby headings provide evidence; ambiguous tables are retained as unclassified tables. Examples and guidelines retain nearby headings where available. Shared CSS variables and computed styles are deduplicated by identity, observed theme/context and value while keeping source-page provenance. Conflicting values within the same identity/context are retained and flagged. Theme identity is derived only from observed root theme/color-scheme metadata; absent metadata is labeled `unknown`. These are observations, not canonical design tokens.

The archive uses a bundled pure-JavaScript ZIP STORE writer with no compression dependency. The offscreen document supplies the Blob/object-URL download path: Chrome extension service workers have no DOM, and Chrome documents the `BLOBS` offscreen reason for Blob operations including `URL.createObjectURL()`. The ZIP format writer itself uses typed arrays and CRC-32 and does not scrape DOM. No Web Worker is used. Real Chrome download validation remains necessary.

## Validate

From the extension directory:

```bash
node --check background.js
node --check extractor.js
node --check popup.js
node --check figma-css.js
node --check offscreen.js
node tests/figma-css.mjs
node tests/smoke.mjs
```

Then load the unpacked extension and verify Current Docs still downloads one `.md`; All Docs on an index with multiple Docs entries downloads one readable ZIP; the popup restores progress after close/reopen; Pause, Resume, Cancel and per-page retry produce the displayed outcomes; partial failures remain in the ZIP report; and temporary tabs close on terminal outcomes. Also test nested-base Storybook paths, denied permissions, readiness timeout and ZIP download cancellation on a supported Chrome version.

`tests/smoke.mjs` runs a dependency-free mocked-Chrome integration check, including exact Storybook-ID filenames, sanitized-ID collisions, path/link consistency, a synthetic sequential/2-tab/3-tab scheduler comparison and ZIP record/CRC validation with an independent `unzip` reader. It does not replace real-browser validation. The root package has no extension-specific npm test script. Its `typecheck`, `build` and Playwright scripts concern the demo-layout application and do not validate Chrome extension APIs or the real download flow.

`tests/chrome-e2e.mjs` expects a test Chrome profile with the unpacked extension loaded, remote debugging on port 9222, and `tests/storybook-fixture.mjs` running at `http://127.0.0.1:4179`. Open `http://127.0.0.1:4179/storybook/?path=/docs/guide--docs` in that profile, then run `STORYBOOK_ORIGIN=http://127.0.0.1:4179 node tests/chrome-e2e.mjs` from this directory. The runner exercises popup restoration, retries, pause/resume/cancel, Current Docs download, archive download and one/two/three-tab scheduling.

## Permissions, limits and privacy

- Declared permissions: `activeTab`, `scripting`, `downloads`, `storage`, and `offscreen`. The `chrome.windows` API uses no separate permission. The optional HTTP(S) host patterns are requested at runtime only for the selected Storybook origin when starting All Docs.
- Docs are read from the user's existing page/authentication context. Requests and page navigation are restricted to that origin; there is no cross-domain crawl.
- Job checkpoints and extracted page content are saved locally during crawling. After the ZIP download completes successfully, extracted page checkpoints are deleted while job status and page outcomes remain available for popup restoration. Chrome storage quota can limit unusually large Docs sets; export will fail with a visible error if a checkpoint cannot be saved.
- The ZIP uses the classic ZIP format without Zip64; archives over 4 GiB are rejected. Current cap is 120 entries.
- Storybook versions, themes, index formats and rendered markup vary. Collapsed/unrendered content, inaccessible cross-origin frames, missing metadata and inferred prop defaults/types are not recovered.
- Exported Docs may be internal documentation. Review the archive before sharing.

## Project boundary

This extension is independent of `demo-layout/src`, routes, root package dependencies, build scripts and deployment workflows.
