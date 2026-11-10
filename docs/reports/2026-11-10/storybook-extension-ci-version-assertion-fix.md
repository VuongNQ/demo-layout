# Storybook extension CI version assertion fix

- **Author:** Vuowng
- **Date:** 2026-11-10
- **Branch:** `feat/storybook-to-markdown-extension`
- **Revision:** `22f06ea31b4fae4364d4072541d7c7813dcfb640` (changes in this report are uncommitted)
- **Worktree:** `/Users/nguyen.quoc-vuong3/demo-layout`
- **Scope:** Extension version-aware tests and `.github/workflows/build-storybook-extension.yml`

## Confirmed root cause

The failing assertion at `tools/storybook-to-markdown/tests/smoke.mjs:14` was:

```js
assert.equal(manifest.version, '0.3.0');
```

It assumed the checked-out extension always used version `0.3.0`. The current checkout has version `0.3.1`, so the smoke test rejected a valid version before exercising the extension. The same repository-version assumption appeared in `tests/build-packaging.mjs`, which copied the real manifest and expected a ZIP named `storybook-to-markdown-v0.3.0.zip` and a verified version of `0.3.0`. The bump suite also copied current source metadata while assuming that copy started at `0.3.0`.

The fixed `0.3.0`, `0.3.1`, and `0.4.0` values in the bump suite are retained as explicit isolated fixture inputs and expected transitions. They are test cases for version operations, not assumptions about the live extension version.

## Changes

- `tests/smoke.mjs` now validates the live manifest version with the supported numeric `MAJOR.MINOR.PATCH` parser and asserts that `package.json` matches it.
- Storybook All Docs export metadata now reads `exporterVersion` from the extension manifest, and smoke coverage asserts that metadata matches the current extension version.
- `tests/build-packaging.mjs` derives the expected ZIP name and verified version from the temporary fixture's manifest, and checks the ZIP's embedded manifest version against it.
- `tests/versioning.mjs` now initializes fixture manifest/package versions together and tests raw build, packaging, and verification at `0.3.0`, `0.3.1`, and `0.4.0`. The tests still assert exact PATCH/MINOR transitions using their explicit baseline fixtures and confirm the real source version files remain byte-identical.
- The artifact name now contains version, commit SHA, `run_id`, and `run_attempt` so reruns of one commit remain distinct.
- The artifact packaging job reruns the smoke and npm test suites after its transient version bump. PR validation already runs them before any bump; both paths use `build:raw` and package without a second bump.
- README CI guidance reflects the post-bump checks and artifact naming.

## Files changed

- `.github/workflows/build-storybook-extension.yml`
- `tools/storybook-to-markdown/README.md`
- `tools/storybook-to-markdown/background.js`
- `tools/storybook-to-markdown/tests/smoke.mjs`
- `tools/storybook-to-markdown/tests/build-packaging.mjs`
- `tools/storybook-to-markdown/tests/versioning.mjs`
- This report (local-only under `docs/reports/`).

## Before and after

- **Before:** CI failed at startup whenever the live version was not exactly `0.3.0`; packaging tests made the same assumption.
- **After:** Live-source tests validate the supported format and manifest/package consistency, while package tests use the version in each isolated fixture. The suites pass with fixture versions `0.3.0`, `0.3.1`, and `0.4.0`.
- The current source remains at `0.3.1` in both `manifest.json` and `package.json`; the requested validation used only `build:raw`.

## Commands and results

- `node tools/storybook-to-markdown/tests/smoke.mjs` — PASS at the live `0.3.1` version.
- `npm test` from `tools/storybook-to-markdown/` — PASS. This includes build/package regression tests, Figma CSS tests, popup/window UI tests, and the versioning suite across all three fixture versions.
- `npm run build:raw` — PASS; built v0.3.1 with 9 runtime files.
- `npm run package` — PASS; generated `storybook-to-markdown-v0.3.1.zip` without changing metadata.
- `npm run verify` — PASS; verified all 9 ZIP files and performed system `unzip -t` integrity checking.
- `unzip -t release/storybook-to-markdown-v0.3.1.zip` — PASS; all archive entries passed.
- `node --check background.js && node --check tests/smoke.mjs && node --check tests/versioning.mjs && node --check tests/build-packaging.mjs` — PASS.
- Ruby YAML parsing of `.github/workflows/build-storybook-extension.yml` — PASS.
- Version consistency check — PASS; manifest and package both report `0.3.1` and match the numeric three-part contract.
- `git diff --check` — PASS.

## CI validation status and remaining risks

Workflow order and artifact naming are checked by automated source assertions and YAML parsing. The smoke and npm test commands are present both before the artifact job's optional bump and after its bump step. No repository write permission was introduced. A GitHub-hosted workflow run was not triggered, so runner-specific event behavior and artifact upload remain unverified.

The artifact's version bump remains transient in the Actions runner, as documented in the versioning implementation report. This change does not persist a version to the repository or create commits, tags, or releases.

The requested local package validation left `release/storybook-to-markdown-v0.3.1.zip` as a generated, untracked worktree artifact. It was not added to source changes or uploaded anywhere.
