# Phase 5 — Targeted remediation of F1, F3 and F4

**Author:** Vuowng

**Date:** 2026-11-07

**Checkout:** `E:\demo-layout`, branch `feat/playground-compare`, revision `f357bcb82872768a1e3d02bebd96208b94ddd720` (existing Phase 1–4 work remains uncommitted)

## Source inventory and scope

Read `AGENTS.md`, the local compare-workflow, design-system-ui and platform-routing skills, the complete [Phase 4 audit](../../audits/playground/2026-11-07/phase-4-browser-regression-readiness.md), `package.json`, the current Compare worksheet/storage/scenario files, ChatGPT showcase form, and Product Settings fixture/service. The installed `rc-field-form` type declares `onFieldsChange(changedFields, allFields)`. An independent read-only `ui-reviewer` checked the scoped changes and confirmed that F2 remains unchanged. The project has no test script or installed test framework, so no test files or dependencies were added.

Only these application files changed in this phase: `src/compare/CompareWorkspace.tsx`, `src/compare/records.ts`, `src/compare/scenarios.ts`, and `src/chatgpt/showcase/ChatGPTShowcasePage.tsx`. This report is the only other new file. Root routing, platform route metadata, Claude pages, themes, Design System documentation, profiles, worktrees and other preexisting changes were left intact.

## F1 — Compare CSV when storage fails

**Root cause:** `ScenarioDetail` held current edits in React state when `saveRecord()` failed, while both CSV controls used `loadRecord()` and therefore re-read empty or stale localStorage. The UI advised downloading CSV precisely in the failure case.

**Change:** `CompareLayout` now shares a ref for the active worksheet record with its two CSV controls. `ScenarioDetail` publishes the committed render's `{scenarioId, record}` to that ref in `useLayoutEffect`. `recordsForMatrix()` uses that visible record for its matching scenario and reads storage for other scenarios. This applies to both the header's all-scenario export and the worksheet's single-scenario export. It also handles blocked reads and stale stored data while the worksheet is open. When no worksheet is visible, export continues to use persisted records.

**Preserved:** `compare-workspace:v1:` localStorage keys; scenario IDs; independent `claude`, `chatgpt` and `evidence` observations; CSV header names, column and row order, quoting, BOM, CRLF and `compare-matrix.csv` filename; decision status meanings. `matrixCsv()` and `downloadMatrix()` were not changed.

**Focused executable evidence:** An in-memory Node check transpiled the actual `records.ts` with the installed TypeScript compiler and exercised `saveRecord`, `recordsForMatrix` and `matrixCsv` with a stub localStorage. Assertions passed for normal writes/reads, rejected writes, rejected reads, stale stored records, a visible record taking precedence, CSV quote/newline escaping, the header and one criterion row. The UI ref timing and actual browser download remain **NOT VERIFIED**.

## F3 — ChatGPT form error summary

**Root cause:** `onValuesChange` cleared the entire summary with `setErrors([])` after any edit, including when unrelated fields remained invalid.

**Change:** `onValuesChange` now only clears the simulated success feedback. `onFieldsChange` rebuilds the summary from Ant Design's complete `allFields` validation snapshot, retaining unresolved field errors and removing each corrected field after its validation state updates. `onFinishFailed` still sets the submission error summary and calls the existing first-error scroll/focus helper. Form values, validation and field-level feedback remain owned by Ant Design `Form`/`FormInstance`; no new form library, API or style was introduced.

**Focused evidence and limit:** TypeScript accepts the installed `onFieldsChange(changedFields, allFields)` contract (`node_modules/rc-field-form/lib/interface.d.ts`). Static flow shows that if title, category and email fail, correcting any one field leaves the other errors in `allFields`; the same mapping applies in any correction order. This is **static contract evidence**, not a rendered test. Multiple-error announcements, async validation timing, Select focus and keyboard recovery remain **NOT VERIFIED** in a browser.

## F4 — Contextual-save destination

**Root cause:** The Compare scenario used `product-1`, but `generateProductSettingsList()` creates `product-setting-${seed}`; the detail service returns `undefined` for `product-1`, leaving the page on its skeleton.

**Change:** The scenario's canonical Claude URL, legacy-compatible URL and fictional record label now use `product-setting-1`. Its unavailable ChatGPT paired URL uses the same fictional ID for task consistency while remaining explicitly `unavailable`. The `contextual-save` scenario ID, criteria and CSV columns are unchanged. No Product Settings behavior or fixture was modified.

**Focused executable evidence:** An in-memory Node check transpiled the actual fixture and scenarios modules, generated the five fictional settings IDs, and asserted that `product-setting-1` exists; canonical and legacy URLs point to it; the paired ChatGPT URL retains `unavailable`; and the scenario ID remains `contextual-save`. Assertions passed. Browser navigation to the form remains **NOT VERIFIED**.

## Validation results

| Command/check | Result |
| --- | --- |
| `npm run typecheck` | PASS, `tsc --noEmit` |
| `npm run build` | PASS, Vite 8.3.5 transformed 3155 modules and wrote `dist/404.html` |
| `git diff --check` | PASS; Git emitted LF-to-CRLF notices for Compare files, no whitespace error |
| F1 in-memory executable check | PASS for normal, blocked write, blocked read, stale storage and CSV escaping/header/row behavior |
| F4 in-memory executable check | PASS for generated fixture ID, canonical and legacy URLs, paired unavailable URL and scenario ID |
| F3 source/type review | PASS for static complete-field error reconciliation; rendered multi-error behavior **NOT VERIFIED** |
| Browser interaction | **NOT VERIFIED**. Phase 4's Firefox headless attempts did not produce a usable browser session; no browser result is inferred from build or static checks. |

## Risks and remaining browser verification

Run a browser worksheet test with localStorage allowed, write-denied, read-denied and stale values. Edit a note, use both CSV controls, inspect actual downloaded rows and confirm the filename. Submit the ChatGPT form with three errors; correct fields in several orders; verify remaining summary links, field messages, first-error focus, Select behavior and screen-reader announcement. Open `/claude/product-settings/product-setting-1` from Compare and confirm the fictional form appears. None of these rendered outcomes was observed here.

The active worksheet ref is updated after a committed render by `useLayoutEffect`; a browser check should confirm export always sees the latest keystroke. The fix does not add cross-session persistence if storage is blocked, and the CSV remains a manual handoff artifact.

## F2 and NEEDS-TEAM-DECISION

F2 was deliberately left unchanged. Compare still permits a browser-local `approved` value without enforced owner, date, rationale or evidence; this must not be treated as production or team approval. The team must decide approval authority, required evidence and whether local approved records should be labeled as drafts. No approval gate, new required field or status/export semantic change was made.
