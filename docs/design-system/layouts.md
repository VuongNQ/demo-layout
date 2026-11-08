# Layout System

## Route-shell selection

**CONFIRMED:** `src/routes/index.tsx:16-32` composes three route branches using `MasterLayout`, `MainLayout`, and `BasicLayout`. The declarations show route selection only; feature-level `FormLayout` is separately composed within some pages.

| Layout | Current responsibility and contract | Representative composition |
| --- | --- | --- |
| `MainLayout` | Uses Redux collapse state (default collapsed), writes collapse preference, renders application `Header`, `Menu`, fixed sidebar and `<Outlet />`; hover can temporarily expand it (`src/layouts/main.layout.tsx:19-31,66-129`). Content offsets for header/sidebar and uses content background/padding (`:132-142`). | Main application shell with nav/sidebar and nested feature page. Route placement: `src/routes/index.tsx:25-26`. |
| `BasicLayout` | Reads `LayoutContext` header/footer and Redux `hiddenFormFooter`; renders fixed header, nested outlet and conditional footer (`src/layouts/basic.layout.tsx:12-38`). It sets a `120rem` minimum width and centers content within `--max-width` (`:40-42,73-88`). | Separate form-oriented route shell: `src/routes/index.tsx:27-28`. The `hiddenFooter` identifier and conditional are described literally; the name does not justify inferring broader footer intent. |
| `MasterLayout` | Wraps the outlet and derives `--wd-width`, `--wd-height`, `--wd-w-px`, `--wd-h-px`, and `--wd-ratio` from window dimensions (`src/layouts/master.layout.tsx:8-25`). | Master route branch: `src/routes/index.tsx:19-20`. Do not infer all consumers or device behavior from this small wrapper. |
| `FormLayout` | Feature-composed workflow shell, not one of the three top-level route wrappers. Accepts header/sidebar/footer/control props and uses `FormRef` children (`src/layouts/form.layout.tsx:22-72,95-109`). It stores active section/form data and validates fields while switching steps (`:119-162,164-230`). | Representative consumers include create/edit/view forms in products, users, notifications, and system. The source search showed wide use, not one uniform screen structure. |

## Representative page compositions

- **List/table:** Promotion Type keeps pagination, sorting, query states, and status rendering in a feature table section (`src/modules/products/promotion-management/promotion-type/components/PromotionTypeTableSection/index.tsx:44-55,71-127,146-205`). Background Main adds filters and feature-owned status mapping (`src/modules/system/theme-management/components/BackgroundMainTableSection/index.tsx:44-51,102-137`).
- **Drawer-based create/view/edit:** Promotion Type source and its module doc describe a route-driven create drawer and view/edit drawer mode. Treat this as a feature-owned composition, not a universal replacement for route pages. References: `docs/modules/products/promotion-management/promotion-type.md:2-4` and source `src/modules/products/promotion-management/promotion-type/`.
- **Multi-section form:** `FormLayout` is suitable only where the feature supplies compatible sidebar items and `FormRef` forms. It owns the shared step coordination; the feature owns field definitions, validation/business rules, and submitted data. See [`.claude/rules/05-form.md`](../../.claude/rules/05-form.md#layout-boundary) / [`.codex/rules/05-form.md`](../../.codex/rules/05-form.md#layout-boundary).

## Layout boundary and target policy

**ADOPTED TARGET:** A layout is a page shell/common region and has no feature business logic ([`.claude/rules/07-component.md`](../../.claude/rules/07-component.md#categories-and-placement) / [`.codex/rules/07-component.md`](../../.codex/rules/07-component.md#categories-and-placement)). Existing shell contracts are **LEGACY-COMPATIBILITY**. Do not treat this page as a route migration, responsive redesign, or permission change. Route shells, guards, and layouts are coordinated in `src/routes/index.tsx`; preserve route and state behavior when documenting or changing consumers.

**INFERENCE:** The four named layouts serve different contracts, so selection should follow route and feature needs rather than visual similarity alone. No layout is endorsed here as a single canonical shell for every page.

## Limitations

The route and consumer inventory is representative, not exhaustive; there was no centralized route-to-layout catalog in the audited docs (`docs/audits/design-system/2026-11-05/documentation-coverage.md:74-84,92`). Static source does not prove responsive, viewport, keyboard, or browser-rendered behavior. Existing `FormLayout`/`FormRef` use is compatibility-sensitive; see the [execution report](../reports/2026-11-05/design-system-baseline.md).
