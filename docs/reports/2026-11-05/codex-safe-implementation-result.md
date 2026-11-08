# HDS Admin Promotion Empty Marker — Implementation Result

## 1. Date, branch, and revisions

- Validation date: 2026-11-05 (Asia/Ho_Chi_Minh)
- Starting branch and revision observed before implementation: `develop` at `129f2a1a6be8ff633d399927cf85ae385d0b27d6`
- Ending branch and revision observed at final inspection: `improve/vuongnq/redux-service` at `8977a1c7c8dbc3e2e70ca197051ef11eb3055afb`
- The final revision's parent is the starting revision. The final checkout is clean.
- The report is local-only under the existing `.gitignore` rule `docs/*`; `.gitignore` was not changed.

## 2. Approved scope

The user approved only the Promotion empty display marker consolidation in these four files:

1. `src/modules/products/promotion-management/promotion/constant.ts`
2. `src/modules/products/promotion-management/promotion/views/PromotionListPage/index.tsx`
3. `src/modules/products/promotion-management/promotion/components/OfferDetailTabs/index.tsx`
4. `src/modules/products/promotion-management/promotion/utils/promotion.format.ts`

The intended change is SAFE under Architecture §19: one feature-owned presentation value replaces local duplicate literals; it does not change conditions, data flow, API, routing, permissions, forms, payloads, or state ownership.

## 3. Pre-existing worktree state and unexpected revision change

The initial worktree had four unrelated unlock-request changes, which were preserved during implementation:

- Modified `src/redux/slices/unlock-request-customer.slice.ts`
- Modified `src/services/index.ts`
- Untracked `src/services/users/unlock-request-customer.service.ts`
- Untracked `src/services/users/unlock-request-customer.types.ts`

During this task the branch changed from `develop` to `improve/vuongnq/redux-service` without an action by this coordinator. Final inspection found commit `8977a1c7` on that branch. Its commit metadata names `VuongNQ` and its subject describes the Promotion marker consolidation. Its tree includes both the four approved Promotion files and the four unrelated unlock-request files listed above. No commit command was run by this coordinator. The available evidence does not establish who created the commit or who authored the complete Promotion patch. This unexpected commit means the unrelated pre-existing work is now part of the current revision, not merely uncommitted work.

## 4. Actual feature-implementer activation evidence

The persisted Codex parent session is `01a1aa02-791f-7692-bdde-f009af5909f5` (`~/.codex/sessions/2026/11/05/rollout-2026-11-05T11-40-52-01a1aa02-791f-7692-bdde-f009af5909f5.jsonl`). It records an actual `spawn_agent` call with `agent_type: "feature-implementer"`.

The separate child session `01a1aa04-2331-7af2-9ff0-24cabcd3929f` records `agent_role: "feature-implementer"` and task completion. The child reported that the intended patch appeared in the shared worktree before its own inspection, that the original author was unknown, and that it corrected the constant to the requested exact declaration. Therefore custom-agent activation is confirmed, but sole authorship of the entire patch by that agent is not established.

## 5. Files and symbols

The final commit changes the approved four Promotion files:

- `constant.ts`: adds `OFFER_EMPTY_DISPLAY = '—'`.
- `PromotionListPage/index.tsx`: imports the shared constant, removes local `EMPTY_VALUE`, and uses the shared constant at the existing empty-products fallback.
- `OfferDetailTabs/index.tsx`: imports the shared constant, removes local `EMPTY_VALUE`, and uses the shared constant at existing detail/history fallbacks.
- `promotion.format.ts`: imports the shared constant, removes local `NO_DATE_DISPLAY` and its duplication comment, and uses the shared constant for missing date endpoints.

The complete commit also contains the four pre-existing unlock-request files listed in section 3. They are outside the approved pilot scope and were not reviewed as part of this implementation.

## 6. Before and after behavior

Before, two components defined `EMPTY_VALUE = '—'` locally and the date formatter separately defined `NO_DATE_DISPLAY = '—'`. After, those call sites use the feature-owned `OFFER_EMPTY_DISPLAY = '—'`.

The em-dash character and every existing fallback condition are preserved. List, detail, history, and date-range empty display behavior is unchanged by the inspected source diff. This is source-level evidence; it is not browser evidence.

## 7. Validation commands and results

Commands were run against the final Promotion source content before the unexpected commit; the committed Promotion tree matches that inspected content.

- `npm run typecheck` — PASS, exit 0 (`tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json`).
- `package.json` was inspected. Its `prettier` and `prettier:fix` scripts operate repository-wide, so neither was run.
- Targeted `./node_modules/.bin/prettier --check` on the four approved files — PASS.
- Targeted `./node_modules/.bin/eslint` on the four approved files with `--report-unused-disable-directives --max-warnings 0` — PASS, exit 0.
- `git diff --check` — PASS before commit; final `git status` is clean.
- Search across the Promotion feature finds no `EMPTY_VALUE` or `NO_DATE_DISPLAY` identifiers. The only em-dash string literal used as the target marker is the `OFFER_EMPTY_DISPLAY` definition; former consumers reference it. Other em dashes in comments are prose, not marker definitions.
- Final commit tree comparison against its parent shows the four approved Promotion files and four unrelated pre-existing unlock-request files.

## 8. Actual frontend-reviewer activation evidence

The parent session records a separate `spawn_agent` call with `agent_type: "frontend-reviewer"`. The separate child session `01a1aa05-3889-7180-bec8-8db2705463fe` records `agent_role: "frontend-reviewer"` and completion. These are real named child executions, not simulated role-based replies.

The session records establish agent identity and execution. They do not provide a separate machine-readable dump proving the exact contents of the custom TOML instructions loaded at runtime; that detail remains unverified.

## 9. Independent reviewer findings and verdict

The read-only frontend-reviewer independently inspected the Promotion diff and returned **PASS**. It found no required fixes and confirmed:

- Exact requested constant declaration and resolvable named imports.
- All old marker identifier usages replaced and no stale local marker constants.
- Existing fallback expressions and em dash preserved.
- The target diff limited to the four approved Promotion files.
- SAFE classification under Architecture §19.
- Typecheck, targeted Prettier, targeted ESLint, and diff checks passed.

It also stated that no browser or runtime UI verification was performed. The reviewer completed before the subsequent unexpected commit was visible; it did not review the unrelated unlock-request changes bundled into that commit.

## 10. Corrections

The feature-implementer reported correcting the shared constant declaration to the exact requested form `export const OFFER_EMPTY_DISPLAY = '—';`. No other correction cycle was needed. Because the initial shared-worktree patch's author is unknown, attribution of the remaining patch lines cannot be confirmed.

## 11. Remaining unverified behavior and risks

- No browser session or UI test was run; rendered UI behavior is not runtime-verified.
- No API, backend, authentication, or permission behavior was exercised; those boundaries are untouched by the inspected Promotion diff.
- The branch changed during this task, and an external/unattributed commit occurred. The commit bundles the four pre-existing unlock-request changes with the Promotion change. This coordinator did not create the commit and did not alter those four files, but the resulting repository state no longer satisfies the request to keep the pilot uncommitted and outside unrelated work.
- The original author of the complete Promotion patch and the precise runtime-loaded custom TOML instructions are not established by available evidence.

## 12. Final status

**PARTIAL** — the approved Promotion change is source-correct by inspection, all requested static checks pass, and both named custom agents actually ran with an independent reviewer PASS. However, the Promotion patch's complete authorship cannot be established, and the checkout changed branch and received an unattributed commit that also includes unrelated pre-existing unlock-request work. No rollback or reset was performed because that would risk overwriting user work.

## 13. Recommendation for the next pilot

Before another pilot, reconcile the unexpected branch/commit and the unlock-request files with their owner. Run future implementation work in an isolated worktree or otherwise freeze branch/worktree ownership through implementation, validation, review, and reporting. Keep UI behavior claims limited to checks actually performed.
