# Phase 2 — ChatGPT workspace shell and Design System showcase

**Author:** Vuowng

**Date:** 2026-11-07

**Checkout:** `E:\demo-layout`, branch `feat/playground-compare`, revision `f357bcb82872768a1e3d02bebd96208b94ddd720` (working tree has uncommitted Phase 1 changes)

## Scope and source inventory

This phase creates an independent, fictional ChatGPT platform area. The Phase 1 Claude files and root composition were present and inspected before editing. Existing uncommitted Claude changes were preserved. `src/routes/router.tsx` and `src/App.tsx` were not modified, so `/chatgpt` is intentionally not reachable yet.

Read `AGENTS.md`, both relevant local skills, `package.json`, `README.md`, the current Claude route/navigation modules, `src/compare/` as read-only reference, the playground plan, Phase 1 report, and copied Design System index, typography, color, status and layout guidance. The copied documents describe the reference HDS Admin repository; current target behavior was checked separately. A read-only `ui-reviewer` review identified issues in success wording, label styling, route feedback, breadcrumb semantics and page-style coupling; these were addressed locally before final validation.

## Files created

- `src/chatgpt/routes/{index.ts,route-config.tsx,route-meta.ts,RouteError.tsx}`
- `src/chatgpt/navigation/menu-meta.ts`
- `src/chatgpt/layout/{ChatGPTLayout.tsx,ChatGPTLayout.module.scss}`
- `src/chatgpt/theme/chatgptTheme.ts`
- `src/chatgpt/overview/{ChatGPTOverviewPage.tsx,ChatGPTOverviewPage.module.scss}`
- `src/chatgpt/showcase/{ChatGPTShowcasePage.tsx,ChatGPTShowcasePage.module.scss,StatusBadge.tsx,StatusBadge.module.scss}`

The overview and route-error modules and overview stylesheet are additional files within the assigned platform scope. They keep page concerns separate and provide visible loading/empty/error examples and route error recovery.

## Route export and metadata contract

`chatgptRoutes` exports a relative tree rooted at `path: 'chatgpt'` for later composition by the root-router owner. It has an index workspace overview and `showcase` child. Both page implementations use React Router 7.1.1 `route.lazy`; `path`, `index`, and children remain static. `ChatGPTRouteMeta` owns stable IDs, relative paths, titles, breadcrumb labels and groups. `chatgptPath()` and `chatgptMenuGroups` derive navigation destinations from that metadata. No unavailable business screen is linked. The route tree is not imported by the current root router; therefore the build does not emit ChatGPT page chunks yet and cannot prove runtime rendering.

`ChatGPTLayout` provides an Operations and Design System navigation, page header, semantic breadcrumb navigation, skip link, responsive sidebar, `useNavigation` pending status and nested `ConfigProvider`. Child route errors render a local error message with a workspace return link. The shell does not change Claude or Compare routing.

## Theme and Design System mapping

| Decision | Local implementation | Status boundary |
| --- | --- | --- |
| DS-01 | Inter stack and prototype roles: page 24/32/600, section 20/28/600, component 16/24/600, body large 16/24/400, body 14/20/400, form label 14/20/500, caption 12/16 | **CANDIDATE** numeric production scale in copied typography doc; used here only as the plan's prototype specification. Font download and computed rendering not verified. |
| DS-02 | No Scheme Sync or global typography/color migration | **LEGACY-COMPATIBILITY** preserved. |
| DS-03 | Local color object uses the approved 2026-11-06 brand, text, surface, feedback and border values. Nested AntD tokens and root-scoped CSS variables consume the same object. Brand red and feedback error remain separate. | **APPROVED** color primitives and feedback pairs. Mapping `colorBorder` to control border is a local prototype choice; final runtime/component token ownership, focus/navigation/interaction roles are **NEEDS-TEAM-DECISION**. |
| DS-04 | Skip link, semantic navigation, visible focus outline on local links, form error recovery, responsive CSS and textual states | WCAG 2.2 AA is an **APPROVED TARGET**. No conformance claim; rendered keyboard, contrast, zoom and responsive checks remain **NOT VERIFIED**. |
| DS-05 | Local `StatusBadge` supports success, warning, error, info, neutral and accent. Error uses `#B91C1C/#FEF2F2`; accent uses `#0E377B/#E8EFFB`. Labels accompany color. | Six semantics and the two pairs are **APPROVED TARGETS**; this showcase does not define domain status mappings. |

The provider is nested inside the ChatGPT root. `getPopupContainer` places trigger-based AntD popups under that root, and all authored styles are SCSS Modules or root-scoped CSS variables. Modal/Drawer portals were not used in this phase; future overlays need rendered portal checks. The existing global ConfigProvider and theme remain unchanged.

## Form UX implementation

The showcase has a fictional request form grouped into Request details and Owner and notes. Ant Design `Form`/`FormInstance` owns values and validation. Labels remain above controls; optional fields are indicated; helper text and a format example accompany fields. The optional note appears only when requested. The submit action says “Save example request.” Validation shows field feedback, an actionable summary, scroll to the first invalid field and a focus attempt through the field instance. A local 350 ms simulation shows loading and completion; it sends and persists no data. Clear form resets values and feedback. No production API, customer record, business validation contract or React Hook Form was introduced.

The overview shows static, clearly labeled loading, empty and error examples. The showcase also contains a compact fictional table and all six badge variants. These examples are presentation references, not operational data or production status mappings.

## Validation results

| Command/check | Result |
| --- | --- |
| `npm run typecheck` | Passed after correcting `scrollToField` options to the installed Ant Design type contract. |
| `npm run build` | Passed; existing mounted Claude app and Pages fallback built. ChatGPT is unmounted, so no ChatGPT runtime bundle proof. |
| `git diff --check` | Passed for tracked changes; new untracked files need separate whitespace inspection. |
| Static scope review | Only `src/chatgpt/` and this report were created in this phase. No root, Claude, Compare, global style, profile, package or Design System file was edited. |
| Static route/style review | Two relative child routes and two dynamic page imports; metadata/menu contain no eager page imports; SCSS selectors remain module-local; no API URL or production data in new files. |
| Browser checks | Not run because the new route is deliberately unmounted. Loading, error, form focus, Select portal, keyboard and narrow-screen behavior are not browser-proven. |

## Risks and unverified behavior

- Route export integration and actual `/chatgpt` rendering require a later root-router change by its owner. Successful TypeScript/build checks do not establish runtime behavior.
- Ant Design's trigger-based Select portal is configured to stay inside the ChatGPT root, but rendered DOM containment and any future Modal/Drawer portal ownership are unverified.
- Focus recovery uses `getFieldInstance().focus()` after scrolling; actual focus behavior across Input and Select must be checked in a browser.
- The local `colorBorder` mapping may affect more AntD components than input controls. Review rendered component boundaries and contrast before treating it as a reusable mapping.
- Inter availability, responsive reflow, keyboard order, screen reader output, contrast and WCAG conformance are not verified.

## NEEDS-TEAM-DECISION

- Reconcile the DS-01 numeric scale's candidate status in copied documentation with the playground's prototype specification before production use.
- Decide component-level runtime ownership for DS-03 colors, especially focus, hover, active, navigation/link, disabled and control-border behavior.
- Decide when the root-router owner should mount the ChatGPT tree and whether the shell's pending/error presentation should become a shared platform pattern.
