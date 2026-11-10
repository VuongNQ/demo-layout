# Storybook extension local PATCH and CI MINOR versioning

- **Author:** Vuowng
- **Date:** 2026-11-10
- **Branch:** `feat/storybook-to-markdown-extension`
- **Revision:** `88ebe9a04a0812be2a7369cdf7c38f21192a031a` (worktree changes are uncommitted)
- **Worktree:** `/Users/nguyen.quoc-vuong3/demo-layout`
- **Scope:** `tools/storybook-to-markdown/` and `.github/workflows/build-storybook-extension.yml`

## Versioning contract

`manifest.json` is the authoritative version. `package.json` now carries the matching version and the bump utility validates both JSON documents, requires equal numeric `MAJOR.MINOR.PATCH` values, computes the next supported value, stages both formatted documents, and updates both. Invalid, mismatched, unsupported, symlinked, or unsafe numeric versions are rejected before either version file changes. The update restores the manifest if replacing the package metadata fails.

| Command/event | Behavior |
| --- | --- |
| `npm run build` | Bump PATCH once, then build |
| `npm run build:patch` | Bump PATCH once, then build |
| `npm run build:minor` | Bump MINOR, reset PATCH to zero, then build |
| `npm run build:raw` | Build without changing version metadata |
| `npm run package` | Rebuild via `build:raw` and package; no bump |
| `npm run verify` | Verify existing distribution without a bump |
| `npm run clean` | Clean generated artifacts without a bump |
| Pull request to `main` | Syntax, smoke, tests, raw build, package, verify; no artifact upload |
| Push to `main` with matching path changes | One MINOR bump in the runner, raw build, package, verify, artifact upload |
| Manual workflow dispatch | `raw` by default; `minor` only when explicitly selected |

Examples verified in temporary fixtures: `0.3.0 -> 0.3.1` for PATCH and `0.3.1 -> 0.4.0` for MINOR.

## Build and CI changes

- Added `scripts/versioning.mjs` for validated version parsing, bumps, and formatted metadata replacement; added `scripts/bump-version.mjs` as its CLI.
- Added `build:raw`, `build:patch`, and `build:minor`; `build` now delegates to the PATCH path.
- Made packaging invoke `build:raw`, never the auto-bumping `build` alias. Verification and cleanup remain version-neutral.
- Tightened Manifest version validation to numeric three-part versions.
- Updated the extension workflow to use raw validation builds, push-only automatic MINOR artifact bumps, and manual `raw`/`minor` selection. Existing path filters, read-only `contents` permission, pinned actions, and 30-day artifact retention remain.
- Updated README build/version and artifact download guidance.
- Added `tests/versioning.mjs` to `npm test`; its version edits run only in temporary fixture directories.

## Artifact version and persistence

The ZIP filename and embedded `manifest.json` use the version produced in the Actions runner. The workflow does not commit that runner-side bump, create a tag or release, or grant repository write permission. The checked-out repository version and later CI runs therefore still start from the committed version. Repeated main builds from an unchanged committed base can create the same MINOR version; the commit SHA in each artifact name distinguishes runs. A durable monotonically increasing release-version strategy is **NEEDS-TEAM-DECISION**.

## Validation commands and results

All commands below were run locally in the extension directory unless stated otherwise.

- `node --check background.js && node --check extractor.js && node --check popup.js && node --check figma-css.js && node --check offscreen.js && node --check scripts/versioning.mjs && node --check scripts/bump-version.mjs && node --check tests/versioning.mjs` — PASS.
- `node tests/smoke.mjs` — PASS; existing mocked Storybook export, ZIP, retry, pause/resume, cancellation, and concurrency assertions passed.
- `npm test` — PASS. Build/packaging, Figma CSS, popup/window regression, and versioning suites passed. Version fixtures covered default/explicit PATCH, MINOR reset, raw, package, verify, clean, metadata synchronization, format preservation, invalid/mismatched versions, no partial writes, artifact filename/manifest agreement, workflow contracts, and unchanged real version files.
- `npm run build:raw` — PASS; built v0.3.0 with 9 runtime files.
- `npm run package` — PASS; generated `release/storybook-to-markdown-v0.3.0.zip`.
- `npm run verify` — PASS; verified 9 files and system `unzip -t` integrity.
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/build-storybook-extension.yml")'` — PASS for YAML syntax.
- `git diff --check` — PASS.
- Final source `manifest.json` and `package.json` versions remain `0.3.0`; the real auto-bumping `npm run build` was intentionally not run.

The GitHub-hosted workflow has not run in this validation, so its runner behavior and artifact upload were not browser/host verified.

## Risks and unverified behavior

- A process or machine failure between the two filesystem renames cannot be made pair-atomic across separate JSON files; the utility stages both before replacement and rolls the manifest back if the second replacement reports an error.
- The CI MINOR version is transient in the runner. The next run does not inherit it unless the repository's committed version changes through a separately approved process.
- GitHub Actions event routing and artifact upload were checked through source assertions and YAML parsing, not by running a hosted Actions workflow.
- The `.gitignore` and other extension files already had uncommitted changes at task start; they were preserved. `.gitignore` was not modified in this task.

## NEEDS-TEAM-DECISION

- Decide how to persist a durable, monotonically increasing release version across main builds without introducing unapproved repository writes or a trigger loop.
