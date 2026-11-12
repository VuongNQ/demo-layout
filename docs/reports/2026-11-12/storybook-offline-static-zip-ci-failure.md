# Storybook Offline Static ZIP CI failure

- Author: Vuowng
- Date: 2026-11-12
- Branch: `feat/storybook-to-markdown-extension`
- Revision investigated: `917ef59f9a89dd79339e3b3dd29f959887037db0` (fix is uncommitted)
- Worktree: `/Users/nguyen.quoc-vuong3/demo-layout`
- Scope: independent Offline Static archive checks in `tools/storybook-to-markdown/tests/smoke.mjs` and this report.

## Root cause and source evidence

The smoke test used `spawnSync('tar', ['-tf', offlineZipPath], { encoding: 'utf8' })` to list a **ZIP**. At the investigated revision this is line 905; line 917 throws the reported error when the process exits unsuccessfully. The extraction immediately afterward also uses `tar -xf ZIP -C DIRECTORY` and would have the same compatibility problem after fixing listing alone.

Ubuntu's GNU tar cannot read ZIP archives. macOS's BSD tar/libarchive can, which masks the incompatibility during macOS validation. The provided CI stderr (`This does not look like a tar archive`) identifies tar's archive-format rejection, rather than a Node.js v22.23.4 exception. Local baseline smoke passes with `independentOfflineZip: "PASS (tar)"`; local `tar --version` reports bsdtar 3.5.3 / libarchive 3.7.4. The initial local Node version is v24.21.0. An isolated Linux reproduction with Node v22.23.5, GNU tar 1.34 and Info-ZIP 6.00 fails at the original line 917 with the exact supplied three-line tar error; the fixed smoke passes in that environment.

### Complete artifact lifecycle

1. `offline-static.js:373` (`buildOfflineDocuments`) assembles directory entries, captured `pages/<id>.html`, binary assets, `index.html`, `manifest.json`, `ASSET_MANIFEST.json`, `OFFLINE_REPORT.md` and `README.md`. The exporter rewrites resource URLs to archive-relative paths and removes page scripts.
2. `background.js:993` names downloads `storybook-offline-${scope}-${YYYY-MM-DD}.zip`; `downloadOfflineArchive` at line 850 awaits `createZipUrl(files)` and the Chrome download completion. `createZipUrl` at line 662 sends `MAKE_ZIP` to the offscreen document.
3. `offscreen.js:20` (`makeZip`) creates classic ZIP, using stored members (compression method 0), UTF-8 names, CRC-32 checksums, local headers `0x04034b50`, central-directory headers `0x02014b50` and end record `0x06054b50`. It returns a complete Blob with MIME type `application/zip`. This is neither tar nor gzip, and is not Zip64.
4. The smoke harness uses `realZip: true` for `offlineIntegratedHarness` (line 745). It executes the actual `offscreen.js` in a VM (lines 104–110), captures the completed Blob through `MAKE_ZIP` (lines 153–160), and reads its members with the existing Node ZIP reader (line 760).
5. The independent test creates a unique temporary directory with `mkdtemp`, awaits `blob.arrayBuffer()`, then awaits `writeFile` to `<tmp>/storybook-markdown-zip-*/offline-static.zip` (lines 887, 903–904). Only afterward does it spawn the listing subprocess synchronously. The path passed to the tool is exactly the path written; it is one argument, without shell interpolation. Temporary archives/extraction are removed in `finally`.
6. Originally, successful tar listing split stdout into filenames and asserted three required entries. It then extracted to another unique temporary directory and compared an extracted binary image with the ZIP member bytes. Any nonzero exit code other than an unavailable executable/permission error threw an exception. The original error message used `stderr || error.message || stdout`, potentially hiding other output.

### Workflow and dependency evidence

`.github/workflows/build-storybook-extension.yml` runs the exact smoke command on `ubuntu-latest`, with Node 22, in its validation job; the package job repeats smoke and `npm test` after its runner-only version selection. The workflow already uses `unzip -t` and `unzip -Z1` for the separate extension release ZIP. No workflow change is required.

The extension `package.json` has no dependency declarations. Its scripts include `test`, `build:raw`, `package` and `verify`; `build` intentionally increments PATCH. Existing smoke checks already use `unzip -t` and `unzip -Z1` for Markdown archives. The existing `scripts/lib.mjs` ZIP reader remains useful for internal assertions, but would not provide an independent implementation check by itself.

## Confirmed facts versus hypotheses

| Possibility | Evidence and conclusion |
| --- | --- |
| Incompatible listing/extraction command | Confirmed in source and reproduced on Linux: both commands use tar on a classic ZIP. Local BSD tar accepts it; GNU tar rejects it with the exact supplied error. |
| Corrupt/incomplete generated ZIP | Not supported for the tested fixture: the fixed test independently checks ZIP integrity and extracts binary data successfully. This does not establish the bytes from an unavailable historical CI artifact. |
| Wrong path | No path mismatch in source: the same `offlineZipPath` is written and passed as a single subprocess argument. |
| Generation/write race | No race in this path: Blob construction is synchronous, byte conversion and file writing are awaited, and subprocess invocation is synchronous. |
| Node.js runtime defect | No evidence: Node successfully starts tar and reports its nonzero exit; the failure is archive-reader compatibility. |

## Fix and preserved contracts

Changed only `tests/smoke.mjs` in executable source:

- Replace listing with `unzip -Z1 ZIP`. Filename-only stdout matches the existing assertions; `unzip -l` includes headings, sizes and dates and would require parsing changes.
- Replace extraction with `unzip -q ZIP -d DIRECTORY`, retaining binary-byte comparison.
- Add `unzip -t ZIP` to independently validate member CRCs, and compare the complete filename listing with the already parsed ZIP member list. Retain the original three-entry assertion.
- On failures, include the operation, command/argument array, archive path, status, signal, spawn error, stdout and stderr. Invalid ZIP and missing ZIP errors remain failures with their distinct unzip diagnostics. Missing executables retain the existing unavailable-tool behavior; archive failures are never treated as unavailable tools.

These options are documented by Ubuntu's [unzip manual](https://manpages.ubuntu.com/manpages/noble/man1/unzip.1.html) and [zipinfo manual](https://manpages.ubuntu.com/manpages/noble/man1/zipinfo.1.html): `-Z1` emits only filenames, `-t` checks integrity and `-d` selects the extraction directory.

No dependencies, workflow, ZIP writer, application runtime, artifact names/paths, member names, download behavior, CLI arguments, version files or production contracts change. The smoke result reports the independent reader as `PASS (unzip)` instead of `PASS (tar)`.

## Files changed

1. `tools/storybook-to-markdown/tests/smoke.mjs`
2. `docs/reports/2026-11-12/storybook-offline-static-zip-ci-failure.md`

The initial checkout was clean. Git status, HEAD and worktree registration were inspected before edits and rechecked after the interrupted turn. No extra Git worktree was created. No profile/rule file or unrelated source was edited. The requested report location does not conflict with `AGENTS.md`. Referenced copied HDS `.codex/rules/00-general.md` is absent here and was not treated as an applicable local rule.

## Validation commands and results

Commands below ran from the repository root unless a different directory is specified.

| Command / check | Result |
| --- | --- |
| Baseline `node tools/storybook-to-markdown/tests/smoke.mjs` on macOS / Node v24.21.0 | PASS with BSD tar. Demonstrates why macOS did not expose the CI issue. |
| Fixed `node tools/storybook-to-markdown/tests/smoke.mjs` on macOS / Node v24.21.0 | PASS; `independentOfflineZip: "PASS (unzip)"`, `independentUnzip: "PASS"`. |
| Integrated Offline Static checks inside smoke | PASS: Current/All Docs archives, expected directory/resource types and manifests, local HTML/CSS references, script removal, origin restrictions, asset deduplication/retry, cancellation, staging cleanup and restart recovery (mock Chrome APIs). |
| Independent Offline Static ZIP checks inside smoke | PASS: `unzip -Z1`, exact member set including `index.html`, `pages/guide--docs.html`, `ASSET_MANIFEST.json`; `unzip -t`; `unzip -q ... -d ...`; extracted image bytes equal original member bytes. |
| `npm test` in `tools/storybook-to-markdown` | PASS: build/packaging, Figma CSS, Offline Static, popup UI and versioning suites. Packaging is verified in temporary fixtures. |
| `npm run build:raw` in `tools/storybook-to-markdown` | PASS: v0.3.1, 10 runtime files; no version bump. |
| `npm run verify` in `tools/storybook-to-markdown` against the existing tracked release ZIP | FAIL: `Package entry differs from dist/: background.js`. Existing release ZIP is stale relative to current source; this test-only change does not edit background.js. Tracked ZIP preserved. |
| `npm run package && npm run verify` in isolated `/private/var/folders/sv/vl5z5yzj3nbdj66k0f66d90w0000gp/T/storybook-zip-ci-l61xftvu/fixed` source copy | PASS: newly generated v0.3.1 release, 10 files, 212748 bytes, independent unzip integrity check. No overwrite of checkout release ZIP. |
| Root `npm run typecheck` and `npm run build` | Both blocked, exit 127: `tsc: command not found`; root `node_modules` absent. No dependencies installed. |
| `node --check tools/storybook-to-markdown/tests/smoke.mjs` | PASS. |
| `git diff --check` | PASS including the final report; final status contains only the two scoped files. |
| `node /tmp/storybook-zip-ci-diagnostics.mjs` | PASS: temporary instrumentation deletes or corrupts only the test-generated offline ZIP immediately before real `unzip -Z1`. Both runs exit 1 and retain command, archive path and status; missing ZIP reports `cannot find or open`, invalid ZIP reports `End-of-central-directory signature not found`. No instrumentation is added to the repository. |
| Linux baseline smoke in `node:22-bookworm` | Expected FAIL, exit 1 at `/baseline/tests/smoke.mjs:917`, exact reported tar stderr. Baseline source copied from HEAD into a temporary fixture. |
| Linux fixed smoke in `node:22-bookworm` | PASS, exit 0, `independentOfflineZip: "PASS (unzip)"`, all existing smoke assertions retained. |
| Linux `npm test` in `node:22-bookworm` | PASS, exit 0, all five extension suites including independent unzip checks. |

Linux command details (read-only mounts; container networking disabled during tests; Docker downloaded the runtime image first):

```sh
# Fixed smoke against the checkout:
docker run --rm --network none \
  --mount type=bind,src=/Users/nguyen.quoc-vuong3/demo-layout,dst=/workspace,readonly \
  --workdir /workspace node:22-bookworm \
  node tools/storybook-to-markdown/tests/smoke.mjs

# Extension suite against the same checkout:
docker run --rm --network none \
  --mount type=bind,src=/Users/nguyen.quoc-vuong3/demo-layout,dst=/workspace,readonly \
  --workdir /workspace/tools/storybook-to-markdown node:22-bookworm npm test

# Original smoke in an isolated baseline copy:
docker run --rm --network none \
  --mount type=bind,src=/var/folders/sv/vl5z5yzj3nbdj66k0f66d90w0000gp/T/storybook-zip-ci-l61xftvu/baseline,dst=/baseline,readonly \
  --workdir /baseline node:22-bookworm \
  sh -c 'node --version; tar --version; unzip -v; node tests/smoke.mjs'
```

Image digest: `sha256:e13726ca604184d7a91fcacab1fc09eefd642dc28e79ac34e85540dd93b78cfb`. This is Debian Bookworm Linux with Node v22.23.5, GNU tar 1.34 and Info-ZIP 6.00, rather than an Ubuntu hosted runner or the exact reported Node v22.23.4. It directly reproduces the GNU tar incompatibility and validates the replacement with the same ZIP-aware command interface documented for Ubuntu.

## Remaining risks and unverified behavior

- A hosted GitHub Actions rerun has not been dispatched; exact Node v22.23.4 and an actual Ubuntu runner remain unverified. The original CI artifact bytes and runner `tar --version` were not supplied. The Linux before/after reproduction confirms the compatibility defect, but does not establish the exact original runner tool version.
- Real Chrome download UI, real network-disabled rendering, visual fidelity and accessibility were not exercised. Offline functionality evidence is from the fixture-driven integration smoke and standalone tests, not a live-browser acceptance run.
- On systems without an executable unzip, the existing independent-tool unavailable policy still applies; internal archive assertions continue to run. Ubuntu CI already uses unzip for release verification.
- App-wide typecheck/build remain unverified until existing project dependencies are available. The separate stale tracked extension release ZIP should be rebuilt in the normal artifact workflow; it is outside this test fix.

## NEEDS-TEAM-DECISION

None for the bounded fix. Refreshing the existing tracked release ZIP or changing cross-platform unavailable-tool policy is separate scope.
