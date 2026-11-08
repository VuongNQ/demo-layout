# HDS Admin SAFE Implementation Pilot — Planning Report

## Revision and date

- Branch: `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung`
- Revision: `1f1f9f31eae3a48f66362753bd63d4428767a91d`
- Date: 2026-11-05
- Initial and final worktree check: no tracked or untracked changes. Application source and Codex/Claude configuration were not modified.
- `docs/reports/` is ignored by the existing `.gitignore` rule (`.gitignore:34`, `docs/*`); the report remains local-only. No tracking policy was changed.

## Guidance and source baseline

Read `AGENTS.md`, `.codex/knowledge/PROJECT_CONTEXT.md`, `.codex/knowledge/ARCHITECTURE.md`, the codebase-analyzer, feature-implementer and frontend-reviewer TOML definitions, `analyze-module`, `implement-feature`, and `review-code` skills, and the relevant general, architecture, TypeScript, component, refactoring, and styling rules. The architecture's §19 risk matrix was applied as written.

The knowledge and module index documents cite earlier snapshots (`8562c125` and `5faf27a5`); claims relevant to this proposal were checked in the current checkout. The promotion-specific living document was consulted, with its contract and runtime unknowns treated as context rather than current source evidence.

The Codex CLI was run as `codex-cli 0.166.0` with `--sandbox read-only --enable multi_agent`. Its final response says the project `codebase-analyzer` was available and used, but the captured JSON event stream has no explicit named-agent spawn/completion event. Therefore custom-agent activation is **claimed by the coordinator but not independently verifiable from the captured runtime evidence**. The source-backed candidate below was checked directly against the fixed checkout; this report does not treat the coordinator response as proof of agent activation.

## Candidate comparison

One useful candidate met the SAFE constraints with a bounded surface. Other apparently small changes in the promotion area touch API uncertainty, form behavior, uploads, or permissions and were excluded. No candidate was found that justifies changing shared cross-domain UI, types, or ownership.

| Candidate | Surface | Risk | Assessment |
| --- | --- | --- | --- |
| Consolidate the promotion feature's em-dash empty display marker | One feature constant plus two UI consumers and one formatter (4 files) | **SAFE** | Recommended: explicit source comment says the same marker is duplicated; preserve existing behavior exactly. |

## Recommended pilot: one promotion-owned empty display marker

### Source evidence and current behavior

- `src/modules/products/promotion-management/promotion/views/PromotionListPage/index.tsx:37` defines `EMPTY_VALUE = '—'`; its `CardCodesCell` returns this for an empty product list at `:261-264`.
- `src/modules/products/promotion-management/promotion/components/OfferDetailTabs/index.tsx:21` independently defines the same constant. It displays it for empty description/mechanism, linked products, and history values at `:91`, `:96`, `:100-110`, and `:266-287`.
- `src/modules/products/promotion-management/promotion/utils/promotion.format.ts:21-25` defines `NO_DATE_DISPLAY = '—'`. Its comment explicitly says this is the same marker already used on the list/detail pages and that it is duplicated because there is no feature-level empty-value constant. Null date endpoints use it at `:33-36`.
- `formatOfferEffectiveRange` is called by the list and detail surfaces at `PromotionListPage/index.tsx:123` and `OfferDetailTabs/index.tsx:115`. A source search found no other uses of `EMPTY_VALUE` or `NO_DATE_DISPLAY` in the promotion feature.
- `src/modules/products/promotion-management/promotion/constant.ts` is the feature's existing constant module. Existing consumers import it for distinct offer constants; this pilot would add one presentation constant only.

### Proposed behavior and exact scope

Add a feature-owned constant such as `OFFER_EMPTY_DISPLAY = '—'` to `constant.ts`; replace the local `EMPTY_VALUE` and `NO_DATE_DISPLAY` declarations with imports of that constant in the three affected files. Keep every existing conditional and rendered string intact. Do not change whether or when any field renders an empty marker.

Exact files:

1. `src/modules/products/promotion-management/promotion/constant.ts`
2. `src/modules/products/promotion-management/promotion/views/PromotionListPage/index.tsx`
3. `src/modules/products/promotion-management/promotion/components/OfferDetailTabs/index.tsx`
4. `src/modules/products/promotion-management/promotion/utils/promotion.format.ts`

### Why useful and consumer/dependency impact

The three implementations currently repeat the same glyph. The formatter's source comment directly records the duplication and intended common presentation. One feature-local owner makes later display-marker changes consistent and avoids importing one UI component into another. The affected consumers remain within the promotion feature: list empty-card display, offer detail/history empty fields, and the two date-range presentation call sites. No routes, permissions, API callers/contracts, payloads, forms, uploads, Redux or Query ownership, shared cross-domain components, or business rules are involved.

### Risk classification

**SAFE — Architecture §19, “isolated presentation, local styling, domain-neutral leaf component.”** This is a local presentation constant in one feature, and the proposed change preserves the exact character and every existing fallback condition. Risk is based on behavior and consumers: no contracts or lifecycle owners are changed. If product intent is that date absence and other empty values should diverge, keep the markers separate; that intent has not been independently confirmed.

## Proposed implementation scope

- Add one named feature-local constant and update only the three current local declarations/usages above.
- Keep the four-file change limited to imports/declarations and references. No cleanup or formatting outside those lines.
- Do not invoke the feature-implementer until the user explicitly approves this selected candidate.
- Preserve exact em-dash output and current conditions for all list, detail, history, and date-range paths.

## Validation plan after approval

1. Inspect the final diff and confirm only the four files above changed.
2. Search the promotion feature for `EMPTY_VALUE`, `NO_DATE_DISPLAY`, and the em-dash literal; confirm there is one owned definition and no stale duplicates.
3. Run `npm run typecheck` and `npm run prettier` (available scripts, as declared in `package.json`).
4. Review list/detail rendering for empty and populated card lists, absent description/mechanism/history values, and either/both missing effective-date endpoints. A browser visual check is required to claim rendered behavior; static checks alone do not prove it.

No validation command was run against an implementation because this is a planning-only task.

## Remaining risks and assumptions

- The identical marker is assumed to have the same user-facing meaning for missing dates, empty list data, missing fields, and empty history values. The source comment supports reuse, but product intent is not independently verified.
- The repository's current business UI and backend behavior were not exercised in a browser or against authenticated APIs. The proposal does not require those contracts to change.
- The CLI coordinator asserted that the custom analyzer was used, but the captured events do not prove actual named custom-agent activation. A future implementation should not claim agent activation based on this run alone.
- Project and module documentation are dated snapshots; the exact proposal is source-verified at this revision, but unrelated documented inventories may be stale.

## Approval gate

This is a proposal only. **Explicit approval of the four-file em-dash consolidation is required before implementation.** No application change has been made.
