# Figma Banner Real CSS Regression

- Author: Vuowng
- Date: 2026-11-09
- Branch: `feat/storybook-to-markdown-extension`
- Revision: `10ab997b7496f7bd7f5480392fb95f666c5369da`
- Worktree: `/Users/nguyen.quoc-vuong3/demo-layout`
- Scope: validate the existing Figma Copy CSS parser against `tools/storybook-to-markdown/tests/fixtures/figma-banner-real.css`.

## Result

**Blocked: required fixture input is missing.** The exact user-provided Banner CSS could not be inspected, so no real-fixture parser results or defect findings can be reported. No synthetic or reconstructed text was used in its place.

## Fixture evidence

- Required path checked: `tools/storybook-to-markdown/tests/fixtures/figma-banner-real.css`.
- `ls -l tools/storybook-to-markdown/tests/fixtures/figma-banner-real.css` returned: `No such file or directory` (exit status 2).
- `rg --files tools/storybook-to-markdown/tests/fixtures` listed only `tools/storybook-to-markdown/tests/fixtures/figma-copy-css-edge-cases.css`. The prior implementation report identifies that file as synthetic parser coverage, not the user-provided Banner sample.
- I read `docs/reports/2026-11-09/figma-css-import-implementation.md`; it also records that the exact sample was unavailable and had been requested as a local fixture.

## Requested checks

The following checks require the missing exact CSS fixture and therefore were not run:

- Parsing the full real Banner input and recording the exact layer count/order.
- Distinct repeated Banner, whiteDot, Oval and Gradient layer checks.
- Auto layout, Inside auto layout, Shadows/shadow-md and radial-gradient warning checks against the real source.
- Real-source `calc()`, `rgba()`, image URL, transform and multiple box-shadow checks.
- Exported ZIP byte-for-byte comparison of `source/original.css` with the required fixture.
- Real-fixture Markdown-link, manifest-path and ZIP-integrity checks.
- Adding the real fixture to the automated regression suite.

No parser defect was established from the missing input, and no source or test changes were made. Existing synthetic parser coverage is not reported here as a real Banner regression result.

## Commands and actual results

- `ls -l tools/storybook-to-markdown/tests/fixtures/figma-banner-real.css` — **FAIL / missing input**; exit status 2.
- `rg --files tools/storybook-to-markdown/tests/fixtures` — listed only the synthetic `figma-copy-css-edge-cases.css` fixture.
- `npm test` — **NOT RUN** because the required real fixture is absent.
- `npm run build` — **NOT RUN** in this regression task.
- `npm run package` — **NOT RUN** in this regression task.
- `npm run verify` — **NOT RUN** in this regression task.

No result is inferred from prior synthetic tests.

## Checkout and preserved work

The required branch was active at revision `10ab997b7496f7bd7f5480392fb95f666c5369da`. Before this task, the worktree already contained modified extension files and the prior untracked Figma implementation report. Those changes were preserved. This task added only this report under `docs/`; no parser, test fixture, application, workflow, `.gitignore`, permission, dependency, or profile was changed.

## Next input needed

Place the exact original Banner CSS at `tools/storybook-to-markdown/tests/fixtures/figma-banner-real.css`. Once present, the requested real-fixture checks and automated regression can be run without reconstructing the source.

## NEEDS-TEAM-DECISION

None. The outstanding item is the missing user-provided fixture input, not a policy decision.

## Local-only boundary

This report is local-only and must remain uncommitted under `docs/`. `.gitignore` was not changed.
