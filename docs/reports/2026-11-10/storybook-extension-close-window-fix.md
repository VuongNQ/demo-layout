# Storybook Extension Close Window and Figma Source URL Fix

- Author: Vuowng
- Date: 2026-11-10
- Branch: `feat/storybook-to-markdown-extension`
- Revision before edits: `88ebe9a04a0812be2a7369cdf7c38f21192a031a`
- Worktree: `/Users/nguyen.quoc-vuong3/demo-layout`
- Scope: `tools/storybook-to-markdown/` and this local-only report.

## Baseline and preserved work

Confirmed the required branch and revision before editing. The worktree already contained uncommitted persistent-window/tab-isolation work and a `.gitignore` change that excludes the generated extension ZIP. Those changes were preserved. `.gitignore`, the manifest, background service worker, permission list, build graph, and CI workflow were not edited for this task. Read the repository's `AGENTS.md`, the existing 2026-11-10 persistent-window implementation report, the extension source/tests, and applicable local guidance. No extension-specific skill applied.

## Confirmed root cause

The Close handler called `chrome.windows.remove(chrome.windows.WINDOW_ID_CURRENT)`. Chromium defines `WINDOW_ID_CURRENT` as `-2`, while the Chromium Manifest V3 API schema sets `windows.remove(windowId)`'s minimum to `0`. That makes the sentinel invalid for this method. The existing popup UI test incorrectly expected `-2`, so it encoded the same defect.

This is confirmed by Chromium's API schema: [`WINDOW_ID_CURRENT` is `-2` and `remove.windowId` has minimum `0`](https://chromium.googlesource.com/chromium/src/+/master/chrome/common/extensions/api/windows.json). Chrome's [windows API reference](https://developer.chrome.com/docs/extensions/reference/api/windows) documents `getCurrent()` and `remove()` as the supported APIs.

## Changes and before/after behavior

Before, clicking Close passed `-2` to `windows.remove`. The test mock accepted it, which did not reflect Chromium's API constraint. The Figma field was labeled “Selection URL (optional)” and did not explain that it was provenance only.

After, Close calls `chrome.windows.getCurrent()`, validates that the result has a non-negative integer ID, and passes that concrete ID to `chrome.windows.remove(windowId)`. Missing and negative IDs are rejected before removal; API errors are caught, shown in the active mode's status, and re-enable the button. Removal targets the current extension tool window. It does not message the Storybook source tab or crawler. The existing background `windows.onRemoved` listener invalidates the saved window ID. Mock coverage confirms the source tab remains available, saved ID clears after close, and the next toolbar click creates a fresh window.

The optional URL field is now labeled **Figma Source URL**, with helper text: “Optional. Paste a Figma Design or Prototype URL to preserve the source reference. CSS is imported from the text you paste, not fetched from Figma.” Empty URLs remain valid for parsing and ZIP creation. Existing Design/Prototype validation is covered for valid links and malformed host/path/node IDs. Supplied source references remain in the export manifest. No parser logic, ZIP schema, Figma API call, or network request was added.

## Files changed for this task

- `tools/storybook-to-markdown/popup.js` — resolve, validate and remove the concrete current window ID; preserve visible failure handling.
- `tools/storybook-to-markdown/popup.html` — rename the optional Figma source field and add its explanatory helper.
- `tools/storybook-to-markdown/popup.css` — style the source helper text.
- `tools/storybook-to-markdown/README.md` — clarify that the Figma URL is optional provenance and CSS is read from pasted text.
- `tools/storybook-to-markdown/tests/popup-ui.mjs` — assert removal receives positive ID `345`; reject negative and missing IDs; assert removal API errors are visible.
- `tools/storybook-to-markdown/tests/smoke.mjs` — assert concrete-ID use, saved window-ID invalidation, fresh-window reopening, source-tab preservation and existing crawler checkpoint survival.
- `tools/storybook-to-markdown/tests/figma-css.mjs` — cover empty URL parse/ZIP generation, valid Design/Prototype provenance, invalid URL messages, source metadata and no-network behavior.
- This report — local-only under `docs/`.

No Chrome permissions, dependencies, runtime files, archive schema, crawler behavior, or CI workflow files changed. The extension runtime graph remains nine files.

## Validation commands and results

Commands were run from `/Users/nguyen.quoc-vuong3/demo-layout/tools/storybook-to-markdown` unless noted.

| Command | Result |
| --- | --- |
| `node --check background.js && node --check extractor.js && node --check popup.js && node --check figma-css.js && node --check offscreen.js && node --check scripts/lib.mjs && node --check scripts/build.mjs && node --check scripts/package.mjs && node --check scripts/verify.mjs && node --check tests/smoke.mjs && node --check tests/figma-css.mjs && node --check tests/build-packaging.mjs && node --check tests/popup-ui.mjs` | PASS. |
| `node tests/smoke.mjs` | PASS. Existing Current Docs, All Docs, pause/resume/cancel/retry, Figma ZIP, crawler persistence and ZIP integrity checks passed. Added checks confirmed saved window ID invalidation, fresh window ID after toolbar reopen, source-tab preservation and crawler state preservation. |
| `npm test` | PASS. Build/package fixture tests, Figma parser/archive tests, and popup UI tests passed. UI tests exercised positive ID `345`, negative ID `-2`, missing ID, visible API failure, and Figma URL behavior. |
| `npm run build` | PASS. Built nine runtime files. |
| `npm run package` | PASS. Packaged nine runtime files. |
| `npm run verify` | PASS. Runtime references and package contents/version verified; built-in system `unzip` integrity check passed. |
| `unzip -t release/storybook-to-markdown-v0.3.0.zip` | PASS. Independently checked all nine members. |
| `git diff --check` (repository root) | PASS. |

Figma checks also verified that an empty source URL builds a ZIP whose manifest records `source: null`, while valid Design and Prototype references are retained in metadata. Invalid text, host, route and `node-id` inputs produce specific validation errors. Existing static checks confirmed no Figma network API was introduced.

## Browser acceptance status

Chrome is installed at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. I attempted to start headless Chrome with the unpacked built extension and a remote debugging port. Chrome exited with code `134` and exposed no CDP endpoint (`fetch http://127.0.0.1:9222/json/list` failed). Real-browser Close behavior and real Chrome permission/window lifecycle therefore remain **UNVERIFIED**. The positive/negative window-ID results above are deterministic mocks, not browser proof.

## Risks and unverified behavior

- Native Chrome window closing, `getCurrent()` behavior in the loaded extension window, and action reopening after a real native close were not browser-verified because Chrome aborted during launch.
- The `windows.onRemoved` ID invalidation and toolbar reopen path passed mocked API tests only.
- Figma URL parsing/export behavior passed parser and ZIP tests; no live Figma integration exists or was added.
- The unrelated pre-existing `.gitignore` modification was left intact.
- **NEEDS-TEAM-DECISION:** none identified for this scope.

## Local-only boundary

This report remains local-only under `docs/`. It was not force-added or committed. `.gitignore` was not modified by this task, and no Claude Code or Codex profile was synchronized.
