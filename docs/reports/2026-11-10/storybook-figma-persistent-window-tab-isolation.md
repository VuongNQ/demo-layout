# Storybook/Figma Tab Isolation and Persistent Extension Window

- Author: Vuowng
- Date: 2026-11-10
- Branch: `feat/storybook-to-markdown-extension`
- Revision before edits: `88ebe9a04a0812be2a7369cdf7c38f21192a031a`
- Worktree: `/Users/nguyen.quoc-vuong3/demo-layout`
- Scope: `tools/storybook-to-markdown/` and this local-only report.

## Baseline and source review

The required branch and revision were confirmed before editing. The worktree was clean and had one registered worktree. The supplied `AGENTS.md` instructions were reviewed; no additional `AGENTS.md` or `.codex` rule files were found in this checkout. The available UI and routing skills concern the demo-layout application and do not apply to this standalone Manifest V3 extension.

Read the extension manifest, service worker, popup HTML/CSS/JavaScript, Figma CSS parser, build/package/verify scripts, tests, and extension README. Also reviewed the 2026-11-09 extension decision-compliance, progress/ZIP, Figma import, extension packaging, and GitHub Actions reports. Historical report claims were treated as context; the checked-out source was treated as current implementation evidence.

## Observed state-leakage cause

Both modes lived in one popup document. Only the Figma section was hidden on mode changes; the Storybook job panel was rendered and shown independently of the active mode. An active or completed Storybook job could therefore remain visible while Figma was selected. The panels did not use tab/tabpanel semantics or keyboard tab navigation. Figma input and parsed data were already held in popup memory, but the UI had no explicit mode-owned panel lifecycle. Storybook feedback used one message node outside the mode-specific content, while Figma feedback used its own node.

The implementation now places all Storybook controls, job progress, page outcomes, preview, errors and success messages inside a Storybook tab panel. Figma inputs, parser results, warnings, preview, errors and export status remain in the Figma tab panel. Separate status nodes are used. The `hidden` attribute removes the inactive panel and its descendants from keyboard focus and the accessibility tree. Tab controls expose selected state, roving `tabindex`, panel relationships and arrow/Home/End keyboard navigation. Mode changes do not issue export or reset messages.

Figma CSS remains in the live page's memory only. Switching tabs preserves its input and parsed result; the Figma reset clears only Figma fields/results. Storybook checkpoints remain in the existing `chrome.storage.local` job record. Starting a fresh Storybook export clears its own preview state. No pasted CSS is written to extension storage.

## Persistent window and source-tab architecture

The manifest no longer declares `action.default_popup`, allowing `chrome.action.onClicked` to run. The service worker opens `popup.html` through `chrome.windows.create({ type: 'popup', width: 760, height: 820 })`. A serialized launch queue avoids duplicate windows on rapid clicks. The current window ID and action-origin tab ID/URL are held in `chrome.storage.session`. A later toolbar click focuses/reuses the recorded window; a stale/closed window ID is recovered by creating a new window. A toolbar click from the extension window itself preserves the last browser source context. There is no browser-startup window creation.

The application header remains visible above the scrollable content and mode navigation. Its accessible **Close** button calls `chrome.windows.remove(chrome.windows.WINDOW_ID_CURRENT)`, which targets the extension's current window. It does not remove tabs or send job cancellation. API errors are shown in the active mode's message area. Native window close is observed only to invalidate the saved window ID; it does not mutate or cancel the Storybook job.

### Source-tab and `activeTab` behavior

The service worker captures the tab ID and URL supplied by the toolbar action event before opening or focusing the extension window. Current Docs no longer queries `tabs.query({ active: true, currentWindow: true })`. The background resolves the saved source tab, checks it still exists, compares origin/path/query/fragment with the captured URL, and requires a Docs route before extraction. It ignores caller-supplied tab identifiers/URLs for Current Docs. Missing, changed, non-web, and non-Docs source contexts return recoverable errors; no unrelated active tab is selected.

The toolbar action click supplies the temporary `activeTab` grant to its originating tab. Opening the extension window does not itself change that source tab's URL. A navigation that changes the captured URL is rejected so extraction does not proceed under stale context. All Docs obtains its tab and origin from the same saved action context, then retains the existing runtime request for only that origin's optional HTTP(S) host permission. No broad tab/window permission was added. The `chrome.windows` API did not require a new manifest permission.

## Files changed

- `tools/storybook-to-markdown/README.md` — tool-window operation, focus behavior, job/draft lifetime, Current Docs source selection and browser limitations.
- `tools/storybook-to-markdown/background.js` — toolbar launch/reuse/recovery, session context, safe source-tab validation and Current Docs/All Docs source binding.
- `tools/storybook-to-markdown/manifest.json` — removed the action's default popup.
- `tools/storybook-to-markdown/package.json` — runs the popup UI isolation regression harness.
- `tools/storybook-to-markdown/popup.html`, `popup.css`, `popup.js` — sticky header, Close button, accessible tab panels, isolated state/messages and responsive scroll layout.
- `tools/storybook-to-markdown/scripts/lib.mjs` — permits an action with `default_title` and no default popup.
- `tools/storybook-to-markdown/tests/smoke.mjs` — deterministic Chrome API checks for window reuse/reopen, origin capture, stale/non-Storybook source rejection, persisted job survival and existing exports/ZIP integrity.
- `tools/storybook-to-markdown/tests/popup-ui.mjs` — deterministic DOM/API tests for draft retention, visible panel isolation, success/error separation, reset scope, keyboard navigation and Close target.
- This report — local-only under `docs/`.

The extension runtime graph remains nine files; no new runtime file was required. The CI workflow was not changed because its existing syntax, smoke, `npm test`, build, package and verify steps cover the updated sources/tests. No root application, Pages deployment, host permission, Storybook extraction/ZIP schema, concurrency default, parser behavior, or profile file was changed. The package ZIP was generated by the requested packaging validation at `tools/storybook-to-markdown/release/storybook-to-markdown-v0.3.0.zip`.

## Tests and results

Commands below were run in `/Users/nguyen.quoc-vuong3/demo-layout/tools/storybook-to-markdown` unless noted.

| Command | Result |
| --- | --- |
| `node --check background.js && node --check extractor.js && node --check popup.js && node --check figma-css.js && node --check offscreen.js && node --check scripts/lib.mjs && node --check scripts/build.mjs && node --check scripts/package.mjs && node --check scripts/verify.mjs && node --check tests/smoke.mjs && node --check tests/figma-css.mjs && node --check tests/build-packaging.mjs && node --check tests/popup-ui.mjs` | PASS. All runtime, build, and test JavaScript parsed. |
| `node tests/smoke.mjs` | PASS. Current Docs and All Docs mock exports, Storybook-ID paths, retry/pause/resume/cancel, persisted checkpoints, Figma ZIP, ZIP CRCs and independent archive reading passed. New mocked window/source-tab assertions passed. Default crawler concurrency remained 1. |
| `npm test` | PASS. Build/packaging fixture suite, Figma parser suite, and new popup UI harness passed. The UI harness retained a Figma draft/preview across mode changes, isolated both modes' errors and success messages, checked reset scope and keyboard tab selection, and verified Close targets `WINDOW_ID_CURRENT`. |
| `npm run build` | PASS. Built the nine-file extension runtime graph. |
| `npm run package` | PASS. Packaged 9 runtime files into `release/storybook-to-markdown-v0.3.0.zip` (121,983 bytes). |
| `npm run verify` | PASS. Confirmed the runtime graph, package contents/version and system `unzip` integrity. |
| `unzip -t release/storybook-to-markdown-v0.3.0.zip` | PASS. Independently checked all nine archive members; no compressed-data errors. |
| `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/build-storybook-extension.yml"); puts "workflow YAML parse: PASS"'` (repository root) | PASS. Workflow syntax parsed; workflow content was not modified. |
| `git diff --check` (repository root) | PASS. |

The browser-context probe `node -e 'fetch("http://127.0.0.1:9222/json/list").then(async r=>console.log("CDP",r.status,(await r.text()).slice(0,500))).catch(e=>{console.error("CDP unavailable:",e.message);process.exitCode=2})'` failed with `CDP unavailable: fetch failed`. No usable Chrome extension debugging context was available, so real Chrome acceptance was not run. Mock assertions do not establish real browser focus persistence, native window Close behavior, permission prompt behavior, or download UI behavior.

## Real Figma Banner CSS Regression

**Status: BLOCKED — exact input fixture missing.** The required path `tools/storybook-to-markdown/tests/fixtures/figma-banner-real.css` does not exist in this checkout. `ls -l tests/fixtures/figma-banner-real.css` returned `No such file or directory`; `rg --files tests/fixtures` listed only `tests/fixtures/figma-copy-css-edge-cases.css`, which is synthetic parser coverage. The original CSS was not available in the repository, and this regression did not use reconstructed or substitute content.

- Exact observed parsed Banner layer count/source order: unavailable because the original CSS could not be read.
- Real-input assertions for repeated Banner/whiteDot/Oval/Gradient names; source order; Auto layout and Inside auto layout annotations; Shadows/shadow-md; radial-gradient warning behavior; calc(), rgba(), image URLs, transforms, positioning and multiple box shadows: not executed.
- Fabricated hierarchy check, manifest Markdown paths, and generated Markdown-link resolution against the real input: not executed.
- Byte-for-byte `source/original.css` comparison against the original Banner fixture: not executable without the fixture. Existing synthetic parser tests assert original-source text recovery only for their synthetic input; that does not establish preservation of the missing Banner bytes.
- Parser defects found/fixed from the Banner fixture: none established. No parser changes were made because there was no real fixture evidence.
- Independent ZIP integrity: the current `npm test` Figma CSS suite passed its independent `unzip -t` check for the synthetic archive. A ZIP generated from the real Banner input and its independent integrity check remain blocked.
- Unrelated UI/build-package tests: `npm test` passed, including the popup UI isolation harness. The existing synthetic parser suite reported 7 fixture layers and 3 warnings and independently checked its generated ZIP with `unzip -t`. The missing Banner fixture is not counted as a failure of those tests.

After the exact CSS is placed at the required fixture path, add real-input assertions to `tests/figma-css.mjs` and rerun `npm test`; do not infer a layer count or parser result before then.

## Risks, unverified behavior and NEEDS-TEAM-DECISION

- A real Chrome run is still needed to verify that the created extension window remains open across tab/window/app focus changes, that Chrome focuses/reuses it as expected, and that the Close button closes only that native window.
- Chrome's transient `activeTab` grant and optional origin permission prompt were not exercised in a browser. The implementation captures and validates tab context in mocks; browser permission lifetime remains unverified here.
- Current Docs eligibility is checked using the captured HTTP(S) URL and Storybook Docs route. Existing best-effort extraction without a recognized rendered Docs wrapper is retained for an eligible route; this is not evidence that every Storybook version/frame layout is supported.
- The Figma draft is intentionally ephemeral and is lost when its extension window closes. Only Storybook job state is checkpointed.
- The extension window is an ordinary Chrome window and is not guaranteed to remain above other applications.
- **NEEDS-TEAM-DECISION:** none identified for this scope.

## Local-only boundary

The report remains local-only under `docs/`. No documentation was force-added, no commit was created, `.gitignore` was not changed, and no Claude Code/Codex profile was synchronized.
