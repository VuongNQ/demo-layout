# Storybook Offline Static: browser acceptance audit

**Author:** Vuowng  
**Date:** 2026-11-12  
**Branch:** `feat/storybook-to-markdown-extension`  
**Revision:** `4a9c876b56bd6b47d54c8cae6ee4a71d473e991d`  
**Worktree:** `C:\Users\vuong\demo-layout`; implementation changes were already uncommitted.

## Scope and result

**PARTIAL.** Inspected the prior implementation report, repository guidance and relevant extension behavior, discovered installed browsers, started isolated headless Chrome, and ran the requested package regression scripts. A real extension export, network-disabled site preview and lifecycle acceptance were not completed. The resulting archive and its real asset counts/bytes are unavailable. The mock tests are not browser acceptance.

## Browser discovery and environment

**PASS:** `where /r C:\Progra~1 chrome.exe` found `C:\Program Files\Google\Chrome\Application\chrome.exe`. An explicit `--version` invocation reported Google Chrome 157.0.8103.39. `where /r C:\Progra~2 msedge.exe` found Edge at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` and versioned copies. The previous report's PATH-only search did not establish that browsers were absent from conventional installation paths. User-local recursive searches returned no Chrome, Edge or Chromium executable; Chromium installation in other locations is unverified.

**PASS (limited):** An isolated temporary-profile Chrome headless `--dump-dom about:blank` command returned the blank HTML document with subprocess access. In the sandbox the same attempt failed with Windows access-denied errors. No browser settings or installed software were changed.

**UNVERIFIED:** A Chrome command with `--load-extension` and `--disable-extensions-except` targeting the built `dist` returned a New Tab document; it did not demonstrate extension registration or MV3 service-worker startup. The root package declares `@playwright/test`, but `node_modules\@playwright\test` was absent. No installation was performed. No interactive automation session was established. This is an incomplete acceptance run, not evidence that Chrome or the feature cannot work.

## Export and offline site

**UNVERIFIED:** No controlled Storybook was visited through the extension and no real Chrome Current Docs or All Docs export was produced. Authorization confirmation, selected origin permission, Chrome download completion, ZIP contents, asset counts/bytes, browser network requests, local-only HTTP preview, navigation, images, fonts, SVG, CSS, props tables and code examples remain to be tested. No corporate network or VPN setting was changed and no internal Storybook was accessed. No comparison of online and offline visual appearance was made.

The earlier completion report describes synthetic mocked-Chrome integration evidence, including shared-resource counts and peak concurrency 3, ZIP CRC and independent `tar.exe` extraction. Those are useful regression evidence, but are not measurements from this browser audit.

## Lifecycle and security review

**UNVERIFIED:** Real Chrome Pause/Resume/Cancel, retry, IndexedDB reuse and cleanup, window reopen, worker interruption, crawler tab ownership and source-tab preservation were not exercised.

**PARTIAL, source evidence:** `offline-static.js` configures a 4 MiB resource cap, 12 MiB total cap and bounded retries; its fetch passes `credentials: 'omit'` and `redirect: 'error'`. Same-origin and secret-reference handling is covered by synthetic tests. Whether the limits are sufficient for an authorized company Storybook is unknown without real sanitized size measurements; no limits were changed. Actual extension network traffic and output redaction were not inspected in Chrome.

## Regression validation

From `tools/storybook-to-markdown/`, executed:

```text
npm test             PASS — build/packaging, Figma CSS, offline module, popup and versioning suites
npm run build:raw    PASS — v0.3.1, 10 runtime files
npm run package      PASS — v0.3.1, 10 files, 215370 bytes
npm run verify       PASS — built-in ZIP path, bounds, version and CRC verification; system unzip unavailable
```

The versioning suite reports local PATCH and CI MINOR workflow checks passing and source versions untouched. The Figma regression passed; existing Markdown behavior has prior mocked smoke evidence, but was not exported in a real browser during this audit. `npm run build` was not run. The requested package command regenerated the pre-existing modified release artifact; no source changes were made by this audit.

## Confirmed defects and risks

**FAIL, documentation evidence:** The prior completion report concluded no compatible browser was available based on PATH discovery. Conventional-path inspection now establishes that Chrome and Edge are installed. The earlier report was left intact as historical evidence.

No exporter defect was confirmed by this limited run. Runtime defects cannot be ruled out. Real archive memory behavior, authenticated asset availability with omitted credentials, fidelity of the captured frame and safe operation under MV3 interruption remain risks requiring browser evidence.

## NEEDS-TEAM-DECISION and next acceptance steps

1. Establish an available browser automation driver or a manual Chrome acceptance session, load `dist`, and verify MV3 startup before running the synthetic multi-page fixture.
2. Produce Current Docs and All Docs ZIPs; record sanitized asset counts/bytes, fetch concurrency and deduplication, ZIP integrity and all lifecycle outcomes.
3. Serve extracted output on localhost with corporate connectivity disabled, inspect requests and compare representative original/offline rendering. Do not export internal data until the user confirms organizational policy permits the selected export and storage.
4. Assess resource limits and IndexedDB retention against sanitized real-world measurements; do not increase limits without memory evidence.

This report is local-only. No internal documentation, screenshots, archives or extracted HTML were uploaded.
