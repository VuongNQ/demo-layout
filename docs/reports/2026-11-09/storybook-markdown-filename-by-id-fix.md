# Storybook Markdown Filename-by-ID Fix

- **Author:** Vuowng
- **Date:** 2026-11-09
- **Branch:** `feat/storybook-to-markdown-extension`
- **Revision:** `e5c531d7b80c0d15e19aa519e8564c1fa7662dcd` (source edits remain uncommitted)
- **Worktree:** `/Users/nguyen.quoc-vuong3/demo-layout`
- **Scope:** `tools/storybook-to-markdown/` and this local-only report

## Scope and baseline

Confirmed the required branch before editing. At the start of this task, HEAD was `e5c531d7b80c0d15e19aa519e8564c1fa7662dcd`; one worktree was registered. `tools/storybook-to-markdown/README.md`, `background.js`, and `tests/smoke.mjs` already had local modifications from prior work. Those modifications were preserved while making this filename fix. No unrelated application files were changed.

Read `AGENTS.md`, `package.json`, the extension README, and the 2026-11-09 Storybook implementation, decision-compliance, and readiness reports. No additional extension-specific Codex rule or applicable skill was present.

## Confirmed root cause

`assignPaths()` used `entry.name || parts.at(-1) || entry.id` for the basename and always appended `--${hashId(entry.id)}`. For the observed index metadata (`id: components-button--docs`, `title: Components/Button`, `name: Docs`), the generator therefore selected `Docs` → `docs` and emitted `components/docs--<hash>.md`. The ID influenced only the suffix instead of being the filename source. The same behavior explains the supplied Getting Started and Checkbox examples.

## Before and after

| Storybook ID | Before (observed in task) | After (exact regression assertion) |
| --- | --- | --- |
| `guides-getting-started--docs` | `guides/docs--e4774cac.md` | `guides/guides-getting-started--docs.md` |
| `components-button--docs` | `components/docs--0b730e41.md` | `components/components-button--docs.md` |
| `components-checkbox--docs` | `components/docs--010f4db0.md` | `components/components-checkbox--docs.md` |

## Implementation

- Generate the filename from the full Storybook entry ID, preserving `--docs` even when a long ID must be bounded.
- Normalize IDs with NFKC; lowercase them; replace separators and unsafe characters; remove traversal-like dot runs; handle Windows device names (including names with extensions); and bound the filename segment to 128 Unicode code points including `.md`.
- Add a stable hash of the full original ID only for IDs that collide after sanitization. A deterministic identity sort and ordinal resolve a residual hash/path collision without relying on crawl completion order.
- Keep category classification and fallback unchanged: only `guides/`, `components/`, and `form/` are category roots; unknown classifications use `components/`.
- Recompute paths when preparing an archive so a recovered pre-fix checkpoint cannot emit the old display-name paths. Keep entry title and name metadata intact.
- Validate page path shape, category, extension, length and archive-wide member uniqueness before ZIP creation.
- Update INDEX and extraction-report page links to the new path contract. Token provenance links now resolve from `tokens/design-tokens.md` with `../<page path>`. Manifest paths and token source paths continue to use the same `entry.path`; README references point to the static archive members that are emitted.
- Keep Current Docs on its existing single `.md` flow and hostname-derived filename. All Docs remains one categorized ZIP.

## Files changed

- `tools/storybook-to-markdown/background.js` — ID-based path generation, collision handling, archive path validation, and path consumers.
- `tools/storybook-to-markdown/README.md` — filename contract and smoke-test coverage.
- `tools/storybook-to-markdown/tests/smoke.mjs` — exact filename, path/link, determinism, and ZIP regressions.
- `docs/reports/2026-11-09/storybook-markdown-filename-by-id-fix.md` — this local report.

Other extension files that were already modified in the worktree were left untouched by this task.

## Tests and actual results

| Command/check | Result |
| --- | --- |
| `node --check` for `background.js`, `extractor.js`, `popup.js`, `offscreen.js`, `tests/smoke.mjs`, `tests/chrome-e2e.mjs`, and `tests/storybook-fixture.mjs` | PASS |
| Parse `tools/storybook-to-markdown/manifest.json` as JSON | PASS |
| `node tools/storybook-to-markdown/tests/smoke.mjs` | PASS. Exact expected paths passed for all three supplied examples, a form ID, unknown-category fallback, duplicate-title IDs, Unicode, traversal-like IDs, Windows reserved names, and a long ID. Collision hashes, `--docs` preservation, metadata preservation, and filename length assertions passed. |
| Determinism and path consumers | PASS. Reordered entries and a three-tab run with deliberately varied navigation delays produced the same ID-to-path map. Manifest paths, INDEX links, token provenance, extraction-report links, and all internal Markdown links resolved to emitted archive members. |
| Independent ZIP integrity | PASS. The smoke test built the filename fixture ZIP, ran `unzip -t`, and compared `unzip -Z1` members against the generated archive paths. The existing ZIP CRC/header assertions also passed. |
| `git diff --check` | PASS for tracked changes. |
| Real Chrome | **UNVERIFIED.** This task's validation used the mocked Chrome harness and independent `unzip`; no live extension download was performed. |

The smoke output reported `exactStoryIdPaths`, `collisionHashesOnly`, `pathLinksConsistent`, `deterministicCompletionOrder`, and `independentUnzip` as passing. No dependency was added or installed.

## Backward compatibility impact

All Docs archive page filenames change from display-name/hash names to sanitized Storybook-ID names. The archive manifest, INDEX, extraction report, and token provenance are regenerated together from the same canonical `entry.path`. Existing downloaded ZIP files remain unchanged. Recovered jobs are assigned the current path contract when their next ZIP is prepared. Storybook title/name values remain in the generated content and metadata. Current Docs remains one Markdown file with its existing download naming behavior.

The approved one-tab default, three category folders, `components/` fallback, token identity/context/value deduplication and provenance/conflict behavior, persistent progress/checkpoints, Pause/Resume/Cancel, cleanup, origin-scoped permissions, and successful-export checkpoint deletion were not changed.

## Risks and unverified behavior

- Real Chrome download behavior was not exercised in this task; a representative live 81-page archive was not regenerated with the updated extension.
- NFKC and lowercase normalization can cause otherwise distinct IDs to sanitize to the same filename; those collisions receive full-ID-derived hashes as designed.
- In the highly unlikely event that suffixed candidates still collide, the filename also receives a deterministic ordinal based on the colliding IDs' stable ordering.
- The archive segment limit is 128 Unicode code points; IDs longer than that are truncated while preserving a terminal `--docs` marker where present.

## NEEDS-TEAM-DECISION

None for this filename contract. The existing folder taxonomy and fallback are unchanged.

## Local-only boundary

The report is untracked and remains local-only. `.gitignore` was not changed, and no commit was created.
