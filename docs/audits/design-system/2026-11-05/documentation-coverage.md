# HDS Admin Frontend Documentation Coverage Audit

## 1. Task Understanding

This is a read-only documentation coverage audit for three user-defined categories: **System Design Patterns**, **System Components**, and **System Design Layouts**. Coverage measures how findable, complete, and current the documentation is against the checkout. It does not assess whether the implementation should be redesigned.

The audit inspected the project instructions, current and target architecture references, relevant component/form/routing/styling rules, documentation indexes and representative module documents, shared component and layout source, Ant Design configuration and styling tokens, and representative List/Create/Edit/View implementations. No application source or existing documentation was changed.

## 2. Entry Point

**Revision and branch:** `8977a1c7c8dbc3e2e70ca197051ef11eb3055afb`, `improve/vuongnq/redux-service`, 2026-11-05. `git status --short --branch` showed no working-tree changes at audit start.

**Instruction-source distinction:** `CLAUDE.md` identifies `.claude/PROJECT_CONTEXT.md`, `.claude/ARCHITECTURE.md`, and `.claude/rules/` as the Claude profile. The supplied `AGENTS.md` points to `.codex/knowledge/` and `.codex/rules/`. Both documentation trees exist, and `diff -q` confirmed that the two context files and the five relevant rules differ. The audit used the `.claude/` versions as the active profile’s instructions and consulted the `.codex/` versions as the supplied `AGENTS.md` references. The intended long-term authority between these profile copies is **NEEDS-TEAM-DECISION**; this audit does not resolve it.

The active profile documents a snapshot at `8562c125` (2026-11-04), while this checkout is `8977a1c7`. Snapshot counts and dated statements were treated as leads, not current facts. This report cites present source where material.

## 3. Feature Flow

This repository-wide audit has no single runtime feature flow. Representative UI evidence was selected to cover multiple current page compositions:

- `docs/modules/products/promotion-management/promotion.md` §§2–4 documents routed List, View, Create, and Edit flows; the current module source is under `src/modules/products/promotion-management/promotion/`.
- `docs/modules/products/promotion-management/promotion-type.md` §4 documents a list with route-driven create drawer and a view/edit drawer that switches modes.
- `docs/modules/system/TOPIC.md` §§2–4 documents list, create, edit, view, history, and reorder behavior.

These documents show that page patterns are documented within feature contexts. They do not establish a single repository-wide page-pattern or layout catalog.

## 4. Files Involved and Evidence Inventory

### Project architecture and rules

- `.claude/PROJECT_CONTEXT.md`: §§3–5 (bootstrap, directory, architecture maps), §§7–10 (routing, state, API, forms), §12 (component architecture), §§17–19 (representative flows and existing/legacy patterns), §§20–22 (risk, important files, open questions). It is explicitly a dated current-state snapshot.
- `.claude/ARCHITECTURE.md`: §§1–2 (scope and current/target distinction), §§5–8 (dependency direction, feature structure, component architecture), §§11–13 (state, forms, routing), §§15–16 (shared code and legacy compatibility), §§19–21 (risk and decision status).
- `.claude/rules/01-architecture.md` §§1–3: dependency direction, local ownership, compatibility.
- `.claude/rules/05-form.md` §§1–10: form ownership, Zod integration, shared form UI, submission, transformations, `FormLayout` boundary.
- `.claude/rules/06-routing-permission.md` §§1–3: route/permission audit and lazy-loading constraints.
- `.claude/rules/07-component.md` §§1–4 and `## Ant Design first`: component categories/placement, reuse checks, Ant Design reuse ladder.
- `.claude/rules/10-styling.md` §§1–5: styling selection/ownership, SCSS Modules, Emotion, tokens and Ant Design.

### Local documentation under `docs/`

- `docs/README.md` §§1–3 defines dated audit/report paths and says `docs/` is intentionally untracked/local-only. It is a path-convention guide, not a system design index.
- `docs/modules/INDEX.md` documents module-by-module coverage and known stale module documentation. Its header and several entries are verified against `8562c125`, not this checkout; §“Known stale documentation” already flags the products overview count and inventory.
- `docs/modules/TEMPLATE.md` §§“Section list” and “Content rules” standardize per-module documentation: responsibility, routes, directory map, runtime flows, state, API, forms, types, permissions, dependencies, consumers, pattern classification, risks, and open questions.
- Relevant examples: `docs/modules/system/OVERVIEW.md` §§1–15; `docs/modules/system/THEME-MANAGEMENT.md`; `docs/modules/system/BACKGROUND-MAIN.md` §§1–29; `docs/modules/system/TOPIC.md`; `docs/modules/products/OVERVIEW.md` §§1–10; `docs/modules/products/promotion-management/promotion.md` §§1–15; and `promotion-type.md` §§1–15.
- Relevant dated evidence includes `docs/audits/architecture/2026-10-28/service-router-restructure-impact.md`, `docs/audits/architecture/2026-10-29/post-restructure-actual-state.md`, `docs/audits/simulation-preview/2026-11-02/component-inventory.md`, and `docs/reports/2026-11-04/docs-restructure.md`. These are scoped or historical reports, not a canonical current design reference.

### Current source inspected

- Shared UI: `src/components/` (including `input.tsx`, `select.tsx`, `switch.tsx`, `date-picker.tsx`, `pagination/`, `status-badge/`, `forms/`, `upload/`, and domain-coupled `product-configuration/`).
- Layout and composition: `src/layouts/main.layout.tsx`, `basic.layout.tsx`, `form.layout.tsx`, and `master.layout.tsx`.
- Theme and styling: `src/providers/index.tsx`, `src/index.scss`, `src/custom-ant.scss`, and representative SCSS Modules under `src/components/` and feature modules.
- Page pattern examples: promotion and promotion-type module source above, plus `src/modules/system/theme-management/topic/`.

No `docs/components/` directory or repository-level design-pattern/layout index was found in the inspected `docs/` tree. `docs/modules/INDEX.md` is the only `INDEX.md` found under `docs/`.

## 5. State Ownership

State ownership is not itself an audit target, but it is a documented design pattern. `.claude/ARCHITECTURE.md` §§11–12 distinguishes server state, Redux compatibility, Ant Design form ownership, local interaction state, and URL state. `docs/modules/TEMPLATE.md` requires module documents to identify state ownership in §5. This is substantial architecture coverage, but distributed across policy and feature docs rather than collected as one pattern reference.

## 6. API Flow

API flow is adjacent evidence rather than a direct coverage category. `.claude/ARCHITECTURE.md` §§5 and 10 describe target dependency direction and service boundaries; module docs use §§4–6 for actual runtime and API flows. The docs distinguish current Redux-owned resources from the target TanStack Query flow and preserve `ApiFetcher` as the transport boundary. These patterns are well represented in the architecture and module template, but do not replace component or layout documentation.

## 7. Type/Data Flow

`.claude/ARCHITECTURE.md` §9 describes TypeScript/data modeling direction and §10 describes DTO/service boundaries. `docs/modules/TEMPLATE.md` §§6 and 8 request source-backed API and type/DTO descriptions. Coverage is adequate for architecture policy and per-module data boundaries. A central reference mapping representative page types to rendered compositions is absent; that is a layout/document-discovery gap, not a data-contract finding.

## 8. Form Flow

Form architecture is one of the better-covered design patterns. `.claude/ARCHITECTURE.md` §12 and `.claude/rules/05-form.md` §§1–10 document Ant Design `FormInstance` ownership, explicit Zod execution and error mapping, form-to-request transformations, Query-backed edit lifecycle, and `FormLayout`/`FormRef` compatibility. `.claude/rules/07-component.md` adds shared-control reuse guidance. Feature documents demonstrate different actual implementations.

The form component audit referenced by the component rule (`docs/audits/components/form-components-audit.md`) is absent from the current checkout. That missing reference weakens component discovery but does not invalidate the form rules. Existing form patterns should remain distinct from new-code target direction and from legacy-compatible flows.

## 9. Routing & Permission Flow

`.claude/ARCHITECTURE.md` §13 and `.claude/rules/06-routing-permission.md` document the route, menu, URL helper, guards, component permission checks, and lazy-loading constraints. `.claude/PROJECT_CONTEXT.md` §7 describes the current route arrangement as of its snapshot. Module documents and the dated router reports add feature-level examples.

The current layout choice is recorded for some module routes, but no living repository-level document consolidates which routes use which shell and what contracts each shell owns. Historical route reports must be rechecked against current source before reuse.

## 10. Dependencies & Consumers

The component rules classify pages/containers, feature components, domain-shared components, shared technical components, shared primitives, and layouts. They require consumer and contract inspection before reuse. The actual `src/components/` tree includes neutral wrappers, domain-specific searchers and widgets, form-lifecycle controls, and product-configuration components; treating the directory as one homogeneous “shared components” layer would misstate current ownership.

There is no current repository-level inventory mapping shared components to purpose, public props/value-change behavior, disabled/read-only semantics, styling owner, consumers, and compatibility status. The audit inspected representative categories but did not exhaustively trace every component’s consumers; an eventual catalog should be scoped and source-verified rather than claim a complete semantic audit from filenames.

## 11. Pattern Classification and Coverage Matrix

| Category | Coverage | Existing documentation and exact sections | Documented contracts/patterns | Main gap |
| --- | --- | --- | --- | --- |
| **System Design Patterns** | **PARTIAL** | `.claude/ARCHITECTURE.md` §§2, 4–7, 9–16, 20–21; `.claude/PROJECT_CONTEXT.md` §§5, 8–13, 17–19; `.claude/rules/01-architecture.md`, `05-form.md`, `06-routing-permission.md`, `10-styling.md`; `docs/modules/TEMPLATE.md` §§4–8, 12–15; representative module docs §§4–8 and 12. | Current-versus-target distinction; dependency direction; domain ownership; Redux/TanStack Query state direction; AntD/Zod form flow; service/API boundaries; permission coordination; shared-code thresholds; styling ownership; explicit `ADOPTED`, `CANDIDATE`, `LEGACY-COMPATIBILITY`, and `NEEDS-TEAM-DECISION` statuses. | Patterns are spread across architecture, rules, module references, and dated reports. No concise design-pattern index identifies canonical source-backed examples and links each to its status. Snapshot and historical claims need current-source checking. |
| **System Components** | **PARTIAL** | `.claude/ARCHITECTURE.md` §8; `.claude/rules/07-component.md` `## Categories and placement`, `## Rules`, `## Ant Design first`, and `## Loading and skeleton states`; `.claude/rules/05-form.md` `## Shared Form UI Reuse`; `.claude/rules/10-styling.md` §§1–5; `docs/modules/TEMPLATE.md` §§3, 10–11, 14; scoped inventories such as `docs/audits/simulation-preview/2026-11-02/component-inventory.md`. | Component ownership categories, local-first placement, Ant Design reuse ladder, contract-sensitive controls, consumer checks, semantic presentation extraction, component-private SCSS Module target, and feature/domain-local ownership. | No discoverable current catalog of `src/components/` contracts and consumers. Current components mix primitives, wrappers, domain widgets, form lifecycle components, and feature-coupled code. The referenced form-component audit file is missing. |
| **System Design Layouts** | **PARTIAL (thin centralized coverage)** | `.claude/ARCHITECTURE.md` §8 (layout responsibility), §13 (routing); `.claude/PROJECT_CONTEXT.md` §§7, 12, 17; `.claude/rules/05-form.md` `## Layout boundary`; `.claude/rules/07-component.md` `## Categories and placement`; route reports listed in §4; selected module docs §§2 and 4. | A layout is a route shell/common region and should not own feature business logic; route-level loading/guard boundaries; `FormLayout`/`FormRef` compatibility; selected feature route-to-layout mappings. | No current shell hierarchy or composition guide describes `MainLayout`, `BasicLayout`, `MasterLayout`, feature-level `FormLayout`, shared context/state, or which List/Create/Edit/View composition belongs where. Layout facts are scattered across source, route declarations, feature docs, and historical audits. |

### Current implementation versus target direction

- **Current implementation — CONFIRMED:** `src/providers/index.tsx:24–28,45–48` supplies Ant Design locale and only an Inter `fontFamily` token through `ConfigProvider`. `src/index.scss:6–40` defines application CSS custom properties, including colors, widths, timings, and form/layout dimensions; lines 49–55 define base typography. `src/custom-ant.scss` is imported from the global stylesheet. These sources, not the dated snapshot, establish the inspected theme configuration.
- **Target direction — CONFIRMED as policy:** `.claude/ARCHITECTURE.md` §8 and `.claude/rules/10-styling.md` `## Tokens and Ant Design` prefer supported Ant Design tokens/APIs for theme semantics, private SCSS Modules for new independent component presentation, and global styles for genuinely global concerns. They explicitly preserve existing mixed styles during ordinary maintenance.
- **Current layout implementation — CONFIRMED:** `MainLayout` combines header, sidebar/menu, Redux-backed collapse state, and persistence (`src/layouts/main.layout.tsx:19–31,62–90`). `BasicLayout` uses `LayoutContext` header/footer and Redux `hiddenFormFooter` state (`src/layouts/basic.layout.tsx:12–35`). `FormLayout` coordinates sidebar steps and imperative child `FormRef`s (`src/layouts/form.layout.tsx:22–50,73–105`). `MasterLayout` wraps an outlet with viewport-derived dimensions (`src/layouts/master.layout.tsx:8–25`).
- **Inference:** These distinct contracts explain why describing the layouts only as “shells” is insufficient for a reader choosing an existing composition. A design reference should document current behavior first and label target conventions separately; it should not recommend a replacement shell or broad migration.

### Representative page patterns

Current module documentation captures variation rather than one universal CRUD template. Promotion documents separate routed List/View/Create/Edit pages and feature flows (`promotion.md` §§2–4); promotion-type uses a route-driven drawer with view/edit mode switching and create drawer (`promotion-type.md` §§2–4); Topic documents its own list/create/edit/view pattern (`TOPIC.md` §§2–4). **Inference:** a layout guide should present these as examples with explicit applicability rather than prescribe one pattern for all modules.

## 12. Risk Classification

**SAFE — documentation-only audit and report creation.** No production behavior, route, permission, state owner, component, or styling contract was changed. This classification describes the requested work, not an approval to edit implementation or revise existing project policy.

## 13. Regression Surface

There is no production regression surface from this read-only audit. Documentation risk remains in: (1) dated snapshots and reports being mistaken for current source; (2) profile-copy divergence between `.codex` and `.claude`; (3) readers treating target architecture as implemented behavior; and (4) assuming all `src/components/` entries are generic primitives. The report distinguishes current implementation from target policy and cites current source for layout and theme examples.

## 14. Recommended Documentation Improvements

Prioritize discoverability and source-backed scope:

1. Create a short repository-level design-pattern index that links existing architecture/rules and a small set of current examples. Label every pattern as adopted target, current legacy-compatible contract, candidate, or team decision; do not duplicate the full architecture document.
2. Create a scoped shared-component catalog for `src/components/` that helps readers find existing UI and records contract-sensitive behavior and known consumers. Start with high-reuse form controls and shared technical components; do not presume every component needs promotion or refactoring.
3. Create a layout/composition reference documenting the current route shells and `FormLayout` separately, their state/context contracts, route placement, and representative List/Create/Edit/View compositions. Mark target direction separately from existing behavior.
4. Link these references from a repository-level documentation landing page so they are discoverable beside module documentation. `docs/README.md` currently describes file/path conventions only.
5. In a separate documentation-maintenance pass, reconcile profile entry-point references and stale snapshot/index metadata. Preserve unresolved authority or policy conflicts as **NEEDS-TEAM-DECISION** until the team decides.

No implementation changes or broad component/layout migrations are recommended.

## 15. Facts Versus Inferences; Unknowns and Unverified Items

### Confirmed facts

- `.claude/ARCHITECTURE.md` is explicit that it defines target direction while `.claude/PROJECT_CONTEXT.md` describes current state.
- `docs/modules/INDEX.md` and `docs/modules/TEMPLATE.md` organize documentation around business modules; the template requires route, flow, ownership, dependencies, and pattern-classification sections.
- The inspected source has four distinct layout contracts and a global Ant Design provider plus CSS custom properties.
- The profile context and module index cite revisions older than the current checkout. The index itself flags at least one stale module overview/inventory.
- The supplied `AGENTS.md` paths and active `CLAUDE.md` paths point to separate existing documentation trees whose corresponding architecture/context/rule files differ.

### Inferences

- The three categories are incomplete as system-level references because relevant facts are distributed among policy, feature documentation, reports, and implementation source without a central index.
- A reader may confuse examples with universal patterns unless references explicitly mark scope and decision status.
- The intended long-term authority between `.codex` and `.claude` copies cannot be inferred safely from their existence or profile names alone.

### Unverified

- No browser, visual, authenticated, backend API, or runtime verification was performed; findings are documentation and static-source based.
- This was not an exhaustive contract/consumer trace of every component in `src/components/`.
- The audit category boundaries were supplied by the user and do not correspond to an existing repository taxonomy.
- Whether both profile trees are intentionally maintained or one should be retired remains **NEEDS-TEAM-DECISION**.

## 16. Handoff

The evidence supports **PARTIAL** coverage for all three categories. Existing architecture and rules meaningfully document patterns and component ownership, while feature documents capture concrete page variants. Central discoverability and current source-backed descriptions of shared components and layout compositions are missing or thin. Documentation-only follow-up should link and organize current evidence, preserve existing contracts, and keep target direction distinct from implemented behavior. No application code or existing documentation was changed, and the three proposed documentation references have not been created.

**Audit agent:** `codebase-analyzer` (read-only). **Validation:** static file, documentation, git metadata, and source inspection only; no tests or build commands run.
