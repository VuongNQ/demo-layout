# Storybook Docs Readiness Timeout Investigation

- **Author:** Vuowng
- **Date:** 2026-11-09
- **Branch:** `feat/storybook-to-markdown-extension`
- **Revision:** `dbecc06456f94b076c6c00e9a224c74b7bacbf5e` (source changes remain uncommitted)
- **Worktree:** `/Users/nguyen.quoc-vuong3/demo-layout`
- **Scope:** `tools/storybook-to-markdown/` and this local-only report

## Summary

The requested Storybook URL is `https://storybook.hangtragop.info.vn/?path=/docs/guides-getting-started--docs`. The crawler continues to navigate the top-level `?path=/docs/...` route. In a Storybook manager/preview layout, that manager route and the preview frame URL are different: the preview frame may identify Docs with `?id=<id>&viewMode=docs`. The previous readiness probe only read `path` in each frame, so it could reject the frame containing the Docs root even when its own Docs ID matched.

The direct root cause on the live site is **not confirmed** because Chrome could not be started in this environment and the site could not be reached by the available web tool. The code-level route mismatch is the strongest explanation supported by the implementation and the requested URL format. A second code-level timeout condition was an unconditional veto for busy/loading selectors inside an otherwise visible Docs root.

## Reports and source reviewed

- Read `AGENTS.md`, `package.json`, `README.md`, the Storybook progress/UI and ZIP implementation report, and the Storybook decision-compliance report.
- Read the readiness sections in `docs/reports/2026-11-09/storybook-crawler-zip-optimization-plan.md`.
- No separate readiness report exists in `docs/reports/2026-11-09/` at this revision.
- Inspected current extension code, existing uncommitted changes, the mock smoke harness, fixture server and Chrome E2E runner.
- Initial state: branch `feat/storybook-to-markdown-extension`, HEAD `dbecc06456f94b076c6c00e9a224c74b7bacbf5e`, one registered worktree. Extension files already had uncommitted changes and the decision-compliance report was already untracked. These pre-existing changes were preserved.

## Investigation evidence

### Requested and final URL

- **Requested:** `https://storybook.hangtragop.info.vn/?path=/docs/guides-getting-started--docs` (provided and confirmed by the user).
- **Crawler target from the current implementation:** `buildDocsUrl` sets the `path` query parameter to `/docs/<entry ID>` and clears the fragment. The mock smoke case confirms the target for this entry is `https://storybook.test/storybook/?path=/docs/guides-getting-started--docs`.
- **Live final navigated URL:** unverified. `navigateTab` resolves only when the completed tab URL has the same origin and pathname as the target and its decoded `path` parameter equals `/docs/<entry ID>`. The real tab URL could not be observed here.
- The crawler was not switched to `iframe.html` navigation. The iframe route is used only to identify the frame that contains rendered Docs.

### Frames, Docs root, text and loading state

| Investigation item | Evidence/result |
| --- | --- |
| Accessible live frame IDs | Unverified; no live Chrome target was available. |
| Actual live frame containing Docs | Unverified. Source supports both a Docs root in the main frame and one in a `viewMode=docs` frame whose `id` matches the entry. |
| Matched root selector on the live site | Unverified. Recognized selectors are `.sbdocs-wrapper`, `.sbdocs-content`, `#storybook-docs`, and `[data-testid="storybook-docs"]`. The matching selector is now returned and saved. |
| Live text length/stabilization samples | Unverified. The fixture tests record the matched frame ID, text length, and three consecutive stable samples in the ZIP manifest. |
| Live busy/loading selectors after content appears | Unverified. The previous code rejected a root or descendant matching `[aria-busy="true"]`, `.sb-preparing-story`, `[data-testid*="loading"]`, or `[data-testid*="loader"]`. The new probe records these selectors; stable ID-matched substantive text is not vetoed solely by them. |
| Extracted content belongs to the requested ID | Verified in mock integration cases: readiness requires exact route ID matching, extraction is limited to the selected frame, and the extractor checks the frame's `storyId` before accepting it. Live extraction remains unverified. |

### Exact previous timeout predicate

The previous `isDocsReady(expectedId)` returned a candidate only when all of these held in one frame:

1. `location.search` contained `path=/docs/<expected ID>`.
2. One of the recognized Docs roots existed.
3. Neither the root nor a descendant matched the listed busy/loading selectors.
4. Normalized root text was nonempty.

`waitForDocsReady` then required three repeated signatures for the first matching frame, polling every 250 ms until the 16-second deadline. If the real Docs root is in a preview frame with `id=<expected ID>&viewMode=docs`, condition 1 fails because that frame has no `path` parameter; the manager frame's matching `path` alone does not help if it has no Docs root. A lingering selector from condition 3 could independently cause the same timeout. The source establishes these predicates; unavailable live evidence prevents confirming which condition actually failed on this Storybook build.

## Root cause and changes

The readiness contract conflated the manager route with the URL of the frame that renders Docs and discarded the frame identity after readiness. It also treated any busy marker as proof that rendered Docs were not ready. This caused a matching Docs frame to be missed or a visible page with a persistent marker to time out. Separately, extraction selected a frame again rather than reusing the frame that passed readiness.

Changes in `tools/storybook-to-markdown/`:

- Recognize the requested ID from the existing `path=/docs/<id>` route or from `id=<id>&viewMode=docs` in a preview frame.
- Match each Docs root selector explicitly and include route, ID, root selector, text length, busy selectors and failure reason in frame probe results.
- Require substantive text and three stable probes. The stable signature includes a hash of the full normalized text, so same-length text changes reset stabilization.
- Record the three stabilization samples and selected frame metadata in the All Docs ZIP manifest.
- Pass the selected frame ID to extraction and reject extracted content when its `storyId` does not equal the requested entry ID.
- Include per-frame diagnostics in timeout errors, so a future live timeout identifies observed frame IDs, route IDs, root selectors, text lengths and active busy selectors.
- Keep the 16-second deadline, one-tab default, current Docs single-Markdown export, All Docs ZIP, existing category/token policies, saved progress and Pause/Resume/Cancel behavior, origin-scoped host permission and owned-tab cleanup.
- Expand mock tests for main-frame Docs, iframe Docs, persistent busy indicators, delayed/changing text, three stable samples, exact target route and incorrect entry IDs.

## Validation

Commands run from the repository root:

| Command/check | Result |
| --- | --- |
| `node --check` for `background.js`, `extractor.js`, `popup.js`, `offscreen.js`, `tests/smoke.mjs`, `tests/chrome-e2e.mjs`, and `tests/storybook-fixture.mjs` | PASS |
| Parse `tools/storybook-to-markdown/manifest.json` as JSON | PASS |
| `node tools/storybook-to-markdown/tests/smoke.mjs` | PASS; main/iframe readiness, delayed stable text, persistent busy markers, wrong ID rejection, current Markdown, ZIP, retry, pause/resume/cancel, tab cleanup and existing extension smoke assertions passed. |
| `git diff --check` | PASS for tracked changes. |
| Real Chrome/live URL | NOT VALIDATED. The installed Chrome executable exited with code 134 before producing a DOM; the local CDP endpoint at `127.0.0.1:9222` was unavailable, and the web tool reported the URL inaccessible. |

No application-level npm build/typecheck was run; root package scripts do not validate extension APIs, and the requested extension syntax/smoke checks passed. No dependencies were installed.

## Changed files and repository boundary

Readiness-specific edits: `tools/storybook-to-markdown/background.js`, `tools/storybook-to-markdown/extractor.js`, `tools/storybook-to-markdown/tests/smoke.mjs`, and `tools/storybook-to-markdown/README.md`. The README and other extension files already had uncommitted edits before this task; those changes were preserved. This report is an untracked local file. `.gitignore` was not modified, no commit was created, and no unrelated application files or CLI profiles were changed.

## Risks and unverified behavior

- The supplied Storybook build may use a frame URL or DOM root outside the supported patterns. Verify with a live Chrome session before treating this fix as browser-confirmed.
- The live requested URL's redirects/final URL, accessible frame IDs, matched selector, text lengths, stabilization samples, lingering busy markers and extracted page content could not be observed here.
- Busy markers are now diagnostic rather than unconditional blockers once the expected ID, recognized root, substantive non-placeholder text and stable full-text signature match. Unusual Docs shells that expose stable but incomplete text may still pass.
- Inaccessible/cross-origin frames remain limited by Chrome's scripting permissions and browser frame access.

## NEEDS-TEAM-DECISION

None for the scope of this fix. The approved one-tab default and archive folder/token policies are unchanged.
