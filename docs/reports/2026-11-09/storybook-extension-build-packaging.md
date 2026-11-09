# Storybook Extension Build and Packaging

- **Author:** Vuowng
- **Date:** 2026-11-09
- **Branch:** `feat/storybook-to-markdown-extension`
- **Revision:** `e5c531d7b80c0d15e19aa519e8564c1fa7662dcd` (implementation changes remain uncommitted)
- **Worktree:** `/Users/nguyen.quoc-vuong3/demo-layout`
- **Scope:** `tools/storybook-to-markdown/` and this local-only report

## Scope and baseline

Confirmed the required branch and revision before editing. One worktree was registered. `README.md`, `background.js`, and `tests/smoke.mjs` already had uncommitted modifications; they were preserved. This workflow updates the extension README but does not change the crawler, parser, job coordinator, runtime manifest, application, root package or `.gitignore`.

Read `AGENTS.md`, the current extension package/source, and the relevant 2026-11-09 implementation, decision-compliance, readiness, and filename reports. No applicable Codex rule or skill for standalone extension packaging was present. The root `package.json` has application-only scripts and dependencies; it was not modified.

## Runtime dependency graph

Read `manifest.json` as the build source of truth and traced its references and the transitive references in HTML, JavaScript, and CSS. The current runtime graph has eight files:

- `manifest.json`
- `background.js` → `extractor.js` through `importScripts()`
- `popup.html` → `popup.css` and `popup.js`
- `offscreen.html` → `offscreen.js`

The current manifest has no icons or additional static assets. The packaging test adds a manifest-referenced SVG icon to an isolated fixture and verifies that referenced static assets are included. Tests, development scripts, README files, reports, local data, and hidden/private paths are excluded from the runtime graph; a reference to an excluded or missing resource fails the build.

## Build architecture and outputs

Added a dependency-free package under `tools/storybook-to-markdown/` with Node.js `>=18` as its engine requirement. No bundler or external dependency is used. `scripts/lib.mjs` provides manifest/resource validation, graph traversal, syntax checks, safe output cleanup, ZIP STORE creation, CRC-32, ZIP parsing, and artifact verification.

| Command | Behavior |
| --- | --- |
| `npm run build` | Validate Manifest V3 fields, local runtime references and JavaScript syntax; replace only `dist/`; copy the manifest and complete referenced runtime graph while preserving relative paths. |
| `npm run package` | Run the build first, then write `release/storybook-to-markdown-v<manifest-version>.zip` with `manifest.json` at the ZIP root. Entries are sorted and timestamps fixed for deterministic output. |
| `npm run verify` | Validate the built graph and JavaScript, reject unexpected files, validate ZIP paths/CRC/member bytes/version, and independently run `unzip -t` when available. |
| `npm run clean` | Remove the generated `dist/` directory and extension-version ZIPs only; preserve unrelated release files. |
| `npm test` | Exercise isolated build/package/verify/clean fixtures without modifying source files. |

The actual build contained 8 files. Packaging produced `storybook-to-markdown-v0.3.0.zip` (80,727 bytes). `npm run clean` was run after verification, so generated `dist/` and `release/` artifacts are absent from the final worktree and can be recreated with the commands above.

## Packaging and compatibility

The release archive contains only files from `dist/`; it does not add a `dist/` prefix. Its paths are validated as safe relative paths with no traversal, absolute paths, duplicate entries, unsafe Windows characters/device names, or overlong filename segments. ZIP creation is a separate dependency-free build tool and does not modify the extension's existing offscreen ZIP exporter for user-requested Storybook Markdown.

The README documents loading `dist/` through `chrome://extensions/` → **Load unpacked**. A release ZIP must first be extracted and its extracted directory loaded; Chrome does not install this ZIP directly. The release ZIP contains the extension runtime, unlike the All Docs ZIP, which contains exported Storybook Markdown and observations.

Runtime behavior, manifest permissions/version, Current Docs single-Markdown export, All Docs ZIP behavior, checkpoints, progress controls, token policy, and filename generation were not changed. The root application package and deployment configuration are unchanged.

## Files added or changed

- Added `tools/storybook-to-markdown/package.json`.
- Added `tools/storybook-to-markdown/scripts/lib.mjs`, `build.mjs`, `package.mjs`, `verify.mjs`, and `clean.mjs`.
- Added `tools/storybook-to-markdown/tests/build-packaging.mjs`.
- Updated `tools/storybook-to-markdown/README.md` with Node requirements, commands, artifact paths, and loading/install guidance.
- Added this report. Existing local modifications to `background.js` and `tests/smoke.mjs` were left untouched.

## Commands executed and results

Node.js was `v26.5.0`; npm was `11.17.0`.

| Command/check | Result |
| --- | --- |
| `npm test` from `tools/storybook-to-markdown/` | PASS: repeated build, invalid/malformed manifests, missing runtime resource, referenced icon asset, root manifest, development/data exclusions, deterministic package, independent unzip, and clean preservation tests. |
| `npm run build` from `tools/storybook-to-markdown/` | PASS: built v0.3.0 with 8 runtime files. |
| `npm run package` from `tools/storybook-to-markdown/` | PASS: rebuilt first and created the versioned ZIP (80,727 bytes). |
| `npm run verify` from `tools/storybook-to-markdown/` | PASS: 8 members verified; system `unzip -t` passed. |
| `node tools/storybook-to-markdown/tests/smoke.mjs` from the repository root | PASS: existing crawler/export, exact Markdown paths, progress controls, cleanup and ZIP integrity checks. |
| `npm run clean` from `tools/storybook-to-markdown/` | PASS: removed the generated build and release artifacts. |
| `node --check` on all runtime JS, new build scripts, and existing/new extension tests | PASS. |
| Parse extension `manifest.json` and standalone `package.json`; `git diff --check` | PASS. |

## Risks and unverified behavior

- A real Chrome **Load unpacked** installation was not performed. The output graph and manifest were validated, but browser installation and runtime behavior are unverified.
- Resource traversal covers manifest references and static references in HTML, JavaScript, and CSS. Runtime paths constructed dynamically from arbitrary computed strings cannot be inferred; new dynamic extension-resource references should be declared statically or added to the scanner.
- The ZIP writer supports classic ZIP STORE entries and rejects archives exceeding classic ZIP bounds; the current extension package is far below those limits.
- Generated artifacts were removed by the requested clean command; the final worktree contains the build workflow and tests, not a prebuilt release.

## NEEDS-TEAM-DECISION

None for this build and packaging workflow.

## Local-only documentation boundary

This report is untracked/local-only. It was not committed or force-added. `.gitignore` was not changed.
