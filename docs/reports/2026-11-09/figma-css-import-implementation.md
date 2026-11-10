# Figma Copy CSS Import Implementation

- Author: Vuowng
- Date: 2026-11-09
- Branch: `feat/storybook-to-markdown-extension`
- Revision inspected: `10ab997b7496f7bd7f5480392fb95f666c5369da`
- Worktree: `/Users/nguyen.quoc-vuong3/demo-layout`
- Scope: `tools/storybook-to-markdown/`, plus the existing extension workflow's syntax check for the new parser file.

## Scope and source review

Confirmed the requested branch, revision, worktree and initially clean status before edits. Read `AGENTS.md`, applicable `.codex/agents/` entries and `.agents/skills/`, the current extension sources/build scripts, and the 2026-11-09 readiness, filename, build/packaging, decision-compliance, progress/ZIP and CI reports. The existing reports describe historical revisions; the current checkout was used as implementation truth. No applicable agent or skill instruction governs this standalone parser change.

The exact supplied multi-layer Banner CSS sample was not in the checkout or conversation. I requested it as a local regression fixture and did not recreate or label a synthetic sample as the supplied one. `tests/fixtures/figma-copy-css-edge-cases.css` is an explicitly separate parser coverage fixture.

## Parser design and layer boundary evidence

Added a dependency-free `figma-css.js` parser imported only by the popup module. Its scanner walks the pasted text while tracking quotes/escapes, parentheses, brackets, braces, comments and top-level semicolons. It does not split declarations with a semicolon regular expression. It parses the first top-level property/value colon and keeps raw declaration text and exact value substrings. Malformed declarations, unterminated comments/strings, missing semicolon separators, and unbalanced delimiters are retained and recorded as warnings; the complete source is also included unchanged in the archive.

Layer boundary evidence is a standalone block comment at the top level that is not one of the supported annotations. `Auto layout` and `Inside auto layout` are retained as layout annotations; `Shadows/shadow-md` and other slash-style comments are retained as style-reference annotations; `warning: ...` comments are retained and counted as warnings. A same-line comment following a declaration is retained as a CSS inline annotation. Layer names are not interpreted as selectors or component metadata. Layer order is source order; there is no parent-child field and the output explicitly says hierarchy is unavailable.

Repeated names receive distinct stable positional paths such as `layers/0003-item.md` and `layers/0004-item.md`. Filename sanitation uses NFKC normalization, removes path separators and traversal-like dot runs, limits the name portion to 64 Unicode characters, and prefixes Windows device names. Original layer names remain in JSON and Markdown.

## Output schema

Each export ZIP contains:

- `README.md`, `INDEX.md`, `manifest.json`, and `EXTRACTION_REPORT.md`.
- `source/original.css`, preserving the pasted source string as UTF-8 text.
- One `layers/<zero-padded-order>-<sanitized-name>.md` page per parsed layer.
- `tokens/observed-values.md` for observed CSS custom properties and style-reference annotations.

The JSON manifest uses schema version 1 and format `figma-copy-css-import`. It records the optional normalized selection reference, ordered layer IDs/paths, original heading comments, exact declaration records, annotations, warnings, observed metadata, and explicit hierarchy status. Known but unobserved metadata fields are labeled `unavailable`; repeated declarations remain in order and keep all observed values. Generated Markdown references are resolved against the archive member list before export.

The metadata groups cover dimensions, positioning, flex layout, spacing, typography, backgrounds, borders, shadows, opacity and transforms. Observed values remain source text. The token page states that these are not verified Figma variables or canonical design tokens.

## Figma selection references

Optional `https://www.figma.com/design/<fileKey>/<name>` and `/proto/<fileKey>/<name>` URLs are accepted. The parser validates the HTTPS Figma host and route shape, records Design/Prototype kind, file key and normalized node ID (for example `13:3169`), and preserves a normalized URL reference. It does not authenticate, call Figma APIs, inspect a Figma tab, or fetch CSS URL values.

## Files changed

- `.github/workflows/build-storybook-extension.yml` — syntax check for the new runtime parser.
- `tools/storybook-to-markdown/background.js` — validates archive members and routes a separate Figma ZIP download through the existing offscreen ZIP/download utilities; prevents concurrent archive work from interrupting an active Storybook export.
- `tools/storybook-to-markdown/figma-css.js` — new parser, URL normalizer, metadata model, and archive Markdown/JSON builder.
- `tools/storybook-to-markdown/manifest.json` — extension description includes Figma CSS import; permissions and version are unchanged.
- `tools/storybook-to-markdown/package.json` — `npm test` includes the Figma CSS regression suite.
- `tools/storybook-to-markdown/popup.html`, `popup.css`, `popup.js` — independent Figma CSS mode, URL/name inputs, paste area, preview counts, parse/export/reset controls and validation messages.
- `tools/storybook-to-markdown/README.md` — Figma CSS workflow and constraints.
- `tools/storybook-to-markdown/tests/build-packaging.mjs` — includes the parser in the runtime graph fixture.
- `tools/storybook-to-markdown/tests/figma-css.mjs` — parser, metadata, safety, link and ZIP tests.
- `tools/storybook-to-markdown/tests/fixtures/figma-copy-css-edge-cases.css` — synthetic parser coverage fixture, not the supplied Banner sample.
- `tools/storybook-to-markdown/tests/smoke.mjs` — mocked Figma ZIP download and Storybook-state isolation checks.
- This report — local-only under `docs/`.

No Chrome permissions, npm dependencies, root application source/package files, `deploy-pages.yml`, crawler readiness, Storybook ID path generation, default concurrency, Current Docs behavior, All Docs content, checkpoint rules, or pause/resume/cancel semantics were changed. The existing CI workflow gained only the `node --check` command for `figma-css.js`.

## Security constraints

- Pasted text remains in popup memory and is sent only to this extension's service worker/offscreen ZIP path; it is not saved to storage or transmitted to a service.
- Preview and error content is assigned through DOM `textContent` and created elements; no `innerHTML`, `eval`, CSS execution, or page injection is used.
- CSS `url(...)` strings are parsed and archived as text only.
- Selection URLs are validated as HTTPS `www.figma.com` Design/Prototype paths; no URL is opened.
- Archive paths are generated from fixed directories and sanitized indexed names, then independently checked again by the background handler. Duplicate, traversal, unexpected, oversized and unsafe file lists are rejected.
- Existing extension ZIP creation, Blob URL download handling, permissions, and packaging pipeline are reused; no new dependency or permission was added.

## Tests and actual results

Local Node.js was `v24.21.0`.

- `node --check` for `background.js`, `extractor.js`, `popup.js`, `figma-css.js`, `offscreen.js`, `tests/smoke.mjs`, `tests/figma-css.mjs`, and `tests/build-packaging.mjs` — PASS.
- `node tools/storybook-to-markdown/tests/smoke.mjs` — PASS. Existing Current Docs and All Docs checks passed; added Figma ZIP download passed without Storybook navigation or job state changes, and the background rejected a traversal archive path.
- `npm test` from the extension directory — PASS. Build/package fixture suite passed, then Figma parser tests passed with 7 synthetic layers and 3 warnings.
- Parser cases passed for prompt-listed layer headings, repeated names, auto-layout/style-reference/warning annotations, `calc()`, `rgba()`, gradients, multiple shadows, matrix transforms, URL values, decimals, negative positioning, inline comments, malformed declarations, empty input, Unicode names, Windows reserved names, traversal attempts, bounded names, Design/Prototype URLs, and unavailable metadata.
- Archive tests passed for exact original CSS recovery, structured JSON values, no hierarchy/component invention, token disclaimer, safe deterministic paths, resolved Markdown links, ZIP member list, and independent `unzip -t` integrity.
- `npm run build` — PASS; assembled 9 runtime files.
- `npm run package` — PASS; created `release/storybook-to-markdown-v0.3.0.zip` (116,409 bytes).
- `npm run verify` — PASS; confirmed version `0.3.0`, 9 ZIP members and system `unzip` integrity.
- `npm run clean` — PASS; generated `dist/` and versioned extension ZIP were removed afterward.
- Ruby Psych parsed `.github/workflows/build-storybook-extension.yml` — PASS.
- `git diff --check` — PASS. `.github/workflows/deploy-pages.yml` remained unchanged; its SHA-256 is `d3d3a6d792079826f9bc5f110b989cc0657934f81ba76e60dc7bae5100edd1cf`.

## Known limitations and unverified behavior

- The exact user-supplied Banner CSS regression fixture remains pending because the original sample was unavailable. Synthetic fixtures exercise the specified syntax but are not evidence about that exact paste.
- Standalone unrecognized block comments are treated as layer boundaries. A standalone ordinary CSS comment is ambiguous with a Figma layer heading; known annotations and same-line inline comments are handled separately. Slash-style comments are treated as style references, so a literal slash-containing layer name may need a future explicit rule.
- This is a bounded Figma Copy CSS dialect parser, not a complete CSS parser. Input is limited to 2,000,000 characters and the generated archive to 16 MB. Unsupported/malformed constructs are retained and reported rather than interpreted.
- The UI and Chrome downloads APIs were not validated in a usable real extension context. The installed Chrome executable exited with code 134 when launched with the unpacked extension, and the CDP endpoint was unavailable. Real Chrome behavior is therefore **UNVERIFIED**.
- Metadata is copied CSS observation only. It does not verify resolved Figma styles, canonical variables, rendered values, parent-child layout, component names, or visual fidelity.
- The exact appearance and edge-case handling of the popup layout, save dialog, downloads completion/cancellation, and offscreen lifecycle require real Chrome validation.

## NEEDS-TEAM-DECISION

None identified for the requested local import contract. The exact Banner CSS fixture is a missing test input, not a policy decision; the requested local fixture has not yet been supplied.

## Local-only boundary

This report remains local-only and untracked under `docs/`. No commit was created, `.gitignore` was not changed, and no Codex/Claude Code profile was synchronized.
