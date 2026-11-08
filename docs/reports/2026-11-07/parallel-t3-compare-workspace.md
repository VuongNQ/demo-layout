# Parallel T3 — Compare workspace

**Author:** Vuowng  
**Date:** 2026-11-07  
**Branch/revision:** `feat/playground-compare` at `5f3c308850b0e1c59a7cb576b5d7c1424cec3976` (uncommitted)  
**Scope:** Independent comparison shell, five fictional scenario worksheets, paired route destinations, local notes and reproducible CSV matrix. No application route integration.

## Files created

- `src/compare/scenarios.ts` — typed fictional tasks, steps, expected outcomes, criteria, destinations and initial questions.
- `src/compare/records.ts` — isolated Compare record storage and CSV matrix export.
- `src/compare/CompareWorkspace.tsx` — shell, scenario index, detail worksheet and route object.
- `src/compare/CompareWorkspace.module.scss` — locally scoped neutral layout and responsive styles.
- `src/compare/index.ts` — integration exports.
- `docs/reports/2026-11-07/parallel-t3-compare-workspace.md` — this report, as explicitly requested.

## Exports and integration

`src/compare/index.ts` exports `compareRoute`, `CompareLayout`, `CompareIndex`, `CompareScenarioPage`, scenario data and types. `compareRoute` is a React Router `RouteObject` with relative path `compare`, index and `:scenarioId` child. A future routing owner can add it as a sibling of the platform route trees while retaining the router's existing basename. This task does not mount `/compare` in `src/routes/router.tsx` or change `src/App.tsx`.

The shell links to current unscoped Claude prototype URLs for inspection. It displays proposed `/claude/*` URLs as **planned** and `/chatgpt/*` URLs as **unavailable**; it does not link to absent ChatGPT screens. Each platform opens by navigation. There is no shared active form state or simultaneous mounting. Compare notes use `compare-workspace:v1:` localStorage keys and do not read or write Claude's `decision-note:` keys.

## Scenario coverage and matrix

| Scenario | Current Claude evidence route | Proposed Claude URL | ChatGPT URL |
| --- | --- | --- | --- |
| Drawer vs full-page edit | `/offer-types/offer-1` | `/claude/offer-types/offer-1` | `/chatgpt/offer-types/offer-1` |
| Unsaved changes | `/experiments/unsaved-changes` | `/claude/experiments/unsaved-changes` | `/chatgpt/experiments/unsaved-changes` |
| Reorder with pagination | `/experiments/reorder-pagination` | `/claude/experiments/reorder-pagination` | `/chatgpt/experiments/reorder-pagination` |
| Tabs vs anchor validation | `/experiments/tabs-vs-anchor` | `/claude/experiments/tabs-vs-anchor` | `/chatgpt/experiments/tabs-vs-anchor` |
| Contextual save placement | `/product-settings/product-1` | `/claude/product-settings/product-1` | `/chatgpt/product-settings/product-1` |

Every scenario includes the task, expected outcome, numbered reproduction steps, fixed criterion IDs/checks, separate Claude and ChatGPT observations, evidence notes, decision status, owner, date, rationale and open questions. Common criteria cover task completion, context, keyboard path, narrow-width reachability and operator confidence. Each scenario adds two relevant checks. CSV export has one row per criterion and carries the scenario instructions, URLs, availability, notes and decision fields. Empty observations mean untested. `recommended` and `approved` are separate statuses; the UI explains that approval requires a team decision and evidence.

## Evidence inspected

- `docs/reports/2026-11-07/hds-admin-next-design-playground-plan.md`, especially sections 5, 10–13, defined the proposed route tree and comparison questions.
- `src/routes/router.tsx` confirms current unscoped paths, nested drawer routes and sibling full-page offer edit; `src/menu/menu-tree.ts` confirms existing navigation lacks Compare.
- `src/pages/DecisionsPage.tsx` stores eight Claude notes under `decision-note:` keys.
- `src/data/demo-data.ts` defines generated fictional offers (`offer-1` among 120); experiment sources define the unsaved, reorder and 45-day hidden-validation examples.
- `src/features/product-settings/ProductSettingsEditPage.tsx` and `src/components/ContextualSaveBar.tsx` establish the current top save-bar example.
- `package.json` declares `typecheck` and `build`; no test or browser-test script is declared.

## Validation

- `npm run typecheck`: **blocked** at `vite.config.ts(3,25)`, missing installed module `@tailwindcss/vite`. No Compare TypeScript error remained after an unused import was removed.
- `npm run build`: **blocked** by the same TypeScript error before Vite ran.
- `npm ls @tailwindcss/vite --depth=0`: package absent from the current `node_modules` although declared in `package.json`.
- `npm ci --offline --ignore-scripts --no-audit --no-fund`: failed with `EPERM` while unlinking `node_modules/.package-lock.json`; dependency state was not repaired.
- `git diff --check`: passed for tracked changes; the new Compare files and this report are untracked, so this command does not inspect their contents.
- No browser or route smoke was possible because Compare is deliberately not mounted.

## Risks, inference and unverified behavior

**Inference:** The proposed platform URLs follow the plan, not currently declared routes. `product-1` and `offer-1` are fictional demo IDs; the current route availability is based on static source inspection, not a browser visit. CSV is a local handoff artifact, not a durable decision store. Browser storage may be blocked or device-specific; the UI reports write failure and offers CSV export.

**Unverified:** rendering, direct `/compare` deep links, visual fit, keyboard behavior, screen-reader behavior, narrow-width reflow, CSV download in a browser, Claude interactions, ChatGPT screens, GitHub Pages subpath behavior and team approval authority. The current checkout initially reported `main` at the plan revision; it was switched to `feat/playground-compare` before source edits. An unrelated untracked `.worktrees/` directory and pre-existing untracked `docs/` content were left untouched.

## NEEDS-TEAM-DECISION

1. Decide who may record `approved`, how evidence is reviewed, and where durable comparison decisions live beyond per-browser storage and CSV handoff.
2. Confirm final Claude and ChatGPT route paths before mounting Compare; preserve existing deep links and drawer close behavior.
3. Resolve the five scenario questions through paired testing once ChatGPT destinations exist. Current worksheets contain no fabricated observations or approvals.
