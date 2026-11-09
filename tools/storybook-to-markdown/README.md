# Storybook → Markdown (Chrome Manifest V3)

A standalone, dependency-free Chrome extension for extracting **current** Storybook Docs or **all discovered Docs entries** to a Markdown file. Extraction runs locally in Chrome; no content is uploaded.

## Install from source

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select `tools/storybook-to-markdown` from this repository.
3. Open a Storybook site over HTTP(S), ideally a `?path=/docs/...` page.
4. Click the extension action, choose scope and include categories, then **Extract & download .md**.
5. Chrome asks where to save the file. Preview is displayed in the popup.

No `npm install` or build step is required. Edit a JS file then press **Reload** in `chrome://extensions`.

## Modes

- **Current Docs page** uses `activeTab` and reads accessible frames, selecting the most likely Docs frame.
- **All discoverable Docs pages** requests host access for the current origin, reads `/index.json` or `/stories.json`, selects entries with `type: "docs"`, visits `/?path=/docs/{id}` sequentially in a temporary inactive tab, and exports successful results. It does **not** crawl other domains or story-only entries. Maximum 120 entries.

## Captured material

Rendered descriptions, headings, HTML props tables, code blocks, textual lists/guidelines, CSS-variable candidates and selected computed styles. This is best-effort: it does not infer missing prop defaults, React prop types or canonical design tokens. Collapsed or unrendered content may not be captured. Each export records source URLs and extraction warnings.

## Validate

Run from this directory:

```bash
node --check background.js
node --check extractor.js
node --check popup.js
```

Then load the unpacked extension, visit a Storybook Docs URL with a prop table and examples, export the current page and inspect its Markdown. Test all-pages mode on a site exposing `index.json`: verify a consolidated file, any warnings, and cleanup of the temporary tab. Test a Storybook without an index to confirm a readable error.

## Limits and security

- Storybook versions and themes differ; Docs detection is heuristic.
- Same-origin iframe extraction is available when Chrome grants access. Cross-origin frames are not automatically readable.
- Full-site mode requires permission for the current origin and uses the user's existing authentication context without bypassing it.
- Full scans are sequential and can be slow. Chrome may suspend long-running MV3 background work; retry in current-page mode if needed.
- Downloads may contain internal documentation. Review before sharing.
- No analytics, remote execution, persistent broad content script, or external service dependency.

## Project boundary

This directory is an independent tool: it does not import from or modify `demo-layout/src`, routing, build scripts, or deployment workflow.
