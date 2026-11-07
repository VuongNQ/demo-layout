# HDS Admin Next — Design Playground implementation plan

**Author:** Vuowng

**Date:** 2026-11-07

**Target:** `VuongNQ/demo-layout`, branch `main`, revision `5f3c308850b0e1c59a7cb576b5d7c1424cec3976`

**Reference:** `VuongNQ/Jobs-to-home`, branch `portal-cham-vay`, revision `733070b62ddf6ad25bc2b22a3488c41a0225c9a8`
**Method:** Static source and documentation inspection. No application or browser execution.

## 1. Executive summary

**Verified:** The target is a Vite/React/TypeScript prototype with one application layout, one global Ant Design theme provider, fictional data, addressable drawer/full-page routes, three experiments, and decision notes. `/` redirects to `/offer-types`. It is not production HDS Admin (`README.md`, `src/App.tsx`, `src/routes/router.tsx`).

**Proposal:** Make `/` a platform-selection page; move the existing experience under `/claude/*` without changing its behavior; build an independent Enterprise Operations Workspace under `/chatgpt/*`; and use `/compare/*` to record paired observations and decisions. Retain all existing unscoped deep links through explicit compatibility routing. Implement this in phases, with Claude regression evidence before adding new business screens.

**Conflict:** The task supplies DS-01 numeric typography values as approved, but reference `docs/design-system/typography.md` and `.codex/rules/10-styling.md` call the numeric scale **CANDIDATE**. Use the supplied scale as a prototype specification; require team reconciliation before declaring it a production standard. Designlab advice is external guidance only.

## 2. Scope and non-goals

Later implementation scope: landing, platform route trees, separate shells/theme scopes, fictional shared fixtures where useful, ChatGPT screens, experiments, comparison workflow, legacy URL compatibility and validation. This report is the only change in this task.

Non-goals: UI implementation now; production HDS Admin migration; production APIs or customer data; changing Claude interactions, form validation, experiments or data; React Hook Form; profile synchronization; changes to the reference repository; dependencies without a demonstrated gap; branches, commits, PRs, pushes or deployment.

## 3. Evidence and source inventory

| Source | Verified use and limitation |
| --- | --- |
| Target `package.json`, `README.md`, `vite.config.ts`, `src/main.tsx` | Stack/scripts, public Pages safety warning, base path, bootstrap reset/Tailwind. Static evidence only. |
| Target `src/routes/router.tsx`, `src/App.tsx`, `src/layouts/`, `src/menu/menu-tree.ts` | Complete declared routes, single shell/provider, fictional permission menu, breadcrumb behavior. |
| Target `src/theme/tokens.ts`, `src/features/`, `src/experiments/`, `src/data/demo-data.ts`, `src/local-data-loader/` | Placeholder theme, screens, AntD forms, demo behavior and local override. Outcomes untested. |
| Target `.github/workflows/deploy-pages.yml`, `scripts/spa-fallback.mjs` | Main-branch Pages workflow, build artifact and 404 fallback. Deployed behavior unverified. |
| Reference `AGENTS.md`, `.codex/README.md`, `docs/design-system/README.md` | Read first: document order, decision labels, Codex/Claude ownership and source-verification boundary. |
| Reference `docs/design-system/{patterns,components,layouts,color,typography,status}.md` | DS targets, representative examples, compatibility limits and open decisions. These do not prove target runtime behavior. |
| Reference `.codex/knowledge/{PROJECT_CONTEXT,ARCHITECTURE}.md`, `.codex/rules/{00-general,01-architecture,05-form,07-component,10-styling}.md` | Form ownership, layout/component boundaries and styling guidance. Reference architecture is not assumed to match target. |
| [Designlab, “Form UI Design: 36 Tips & Best Practices”](https://designlab.com/blog/form-ui-design-best-practices) | External article, dated June 16, 2022; direct tips are cited by number below. |

**Documentation conflicts:** `color.md` retains historical DS-03 values before its 2026-11-06 approved addendum. The addendum supersedes old secondary/yellow values and puts focus under review. The typography page and Codex styling rule still call numeric scale candidate despite this task's DS-01 instruction. Target `theme/tokens.ts` calls `#1677ff` a placeholder, which describes the existing prototype and is not an HDS approval. Target sidebar text says “internal/not public,” whereas `README.md` warns its Pages deployment is publicly reachable; use the README's data-safety constraint.

## 4. Current repository architecture

**Verified:** `src/main.tsx` imports AntD reset and opt-in Tailwind theme/utilities without preflight. `src/App.tsx` wraps `RouterProvider` with one `QueryClientProvider` and one `ConfigProvider(themeTokens)`. `router.tsx` uses `createBrowserRouter` and `import.meta.env.BASE_URL`. `AppLayout` renders collapsed sidebar, header, menu-derived breadcrumb and outlet. Routes without menu entries deliberately show a breadcrumb warning. Feature folders own page, form, query hook, service and fixture code. `OfferTypeForm` is reused by drawer and full page; Product Settings uses AntD `Form.List` and `shouldUpdate`. The target root has no `AGENTS.md`.

**Inference/proposal:** Share only stable fictional data shapes and neutral scenario metadata. Keep page composition, route ownership, form lifecycle, business mapping and styles platform-owned. The reference HDS Admin `MasterLayout`, `MainLayout`, `BasicLayout`, `FormLayout`, Redux and production permission contracts differ from this target; do not transplant them (`docs/design-system/layouts.md`, `components.md`).

## 5. Current route inventory

All routes are relative to the router basename, normally `/demo-layout/` on Pages. This is the complete declared inventory from `src/routes/router.tsx`.

| Path | Current behavior |
| --- | --- |
| `/` | Replace-redirect to `/offer-types` |
| `/offer-types` | 120-item paginated list, page-local drag reorder, local JSON import |
| `/offer-types/create`, `/offer-types/:id` | Child-route create/edit drawers over mounted list |
| `/offer-types/:id/edit` | Sibling full-page edit; list unmounts |
| `/product-sync` | KPIs/table, local diff/history/confirm-progress modals; no overlay URL |
| `/product-settings`, `/product-settings/:id` | List, complex full-page form and contextual save bar |
| `/background-locks`, `/background-locks/:id` | Short unpaginated list and child-route drawer |
| `/fees`, `/fees/:id` | List and full-page edit |
| `/promotions`, `/promotions/create`, `/promotions/:id/edit` | List, full-page create and edit |
| `/promotion-types`, `/promotion-types/create`, `/promotion-types/:id` | List/status toggle and child-route drawer |
| `/required-information`, `/required-information/:id` | List and full-page edit |
| `/display-information-sets`, `/display-information-sets/:id` | List and full-page edit |
| `/add-ons`, `/add-ons/:id` | List and full-page edit |
| `/popular-loans`, `/attractive-offer`, `/exclusive-touch` | Single-config pages; Exclusive Touch has local assignment drawer |
| `/experiments/unsaved-changes`, `/experiments/unsaved-changes/edit` | Local vs route-bound drawer guard experiment |
| `/experiments/reorder-pagination` | Three reorder approaches |
| `/experiments/tabs-vs-anchor` | Hidden-tab vs section error recovery |
| `/decisions` | Eight localStorage decision notes |

**Compatibility:** Preserve `create` vs `:id` matching, nested drawer parent placement, full-page sibling placement, query/hash, and internal links. `Sidebar`, `AppBreadcrumb`, `DecisionsPage` and feature callers contain unscoped absolute paths; router prefixing alone is insufficient.

## 6. Proposed platform routing architecture

**Proposal:** Keep one React Router data router and current basename:

```text
/                  selection landing
/claude             ClaudeLayout; index -> /claude/offer-types
/claude/*           existing pages, drawers, experiments, decisions
/chatgpt            ChatGPTLayout; index -> workspace overview
/chatgpt/*          independent Enterprise Operations Workspace
/compare            CompareLayout; scenario index and decision register
/compare/:scenario  paired links, criteria, observations and decision status
legacy paths        explicit redirects/adapters to matching /claude/* paths
*                   useful not-found page
```

Create an old-to-new mapping for every row in section 5. Preserve path parameters and search/hash. A direct legacy drawer link must still mount its parent list and close to a deterministic Claude list URL. Audit all `Link`, `Navigate`, `navigate()` and browser-location callers, then make Claude path generation prefix-aware or use equivalent adapters. Keep the Claude menu/breadcrumb behavior, including its intentional missing-entry warning. The new landing replaces only the old root redirect; `/claude` provides the old entry behavior.

**Navigation proposal:** Landing presents clear platform choices and comparison entry. ChatGPT gets domain-grouped navigation, a consistent page header (breadcrumb, title, description, primary action), visible filters and a section nav on long forms. Compare has its own scenario navigation. Global search remains a decision item, not a default.

**Pages:** Preserve Vite `base: '/demo-layout/'` or explicit `VITE_BASE`, router basename, `npm run build`'s `dist/404.html` copy, and `.github/workflows/deploy-pages.yml`. The 404 copy only hands a deep link to the SPA; later browser testing must confirm assets and matching under the actual subpath.

## 7. Theme and styling isolation

**Verified:** `src/theme/tokens.ts` sets global AntD `colorPrimary: #1677ff` as a placeholder. Changing the outer provider would recolor Claude. The target already uses some SCSS Modules; the reference styling rule prefers AntD-supported tokens/APIs and private SCSS Modules for new components while preserving legacy globals.

**Proposal:** Preserve Claude's provider/theme behavior. Put a ChatGPT `ConfigProvider` inside its route shell, with only verified DS semantic mappings. Give Compare a neutral shell; use links or separately scoped preview roots for side-by-side work. Scope new styles to ChatGPT; avoid new global selectors and do not change the current reset. If both designs render simultaneously, verify portal containers, inherited CSS and AntD overlay styles. Maintain one logical semantic role map, while leaving the physical runtime owner undecided. Do not invent focus, hover, active, selected, navigation or disabled HEX values. `brand.sun` has no assigned UI role. Validate visible control boundaries with `border.control` where needed, not on every input.

## 8. DS-01 through DS-05 compliance matrix

| Decision | Verified reference position | Prototype plan / acceptance |
| --- | --- | --- |
| DS-01 typography | Inter adopted default; Scheme Sync uses feature-owned Be Vietnam Pro. **Conflict:** numeric scale remains candidate in reference docs. | Specify page 24/32/600; section 20/28/600; component 16/24/600; body large 16/24/400; body 14/20/400; emphasis 14/20/600; label 14/20/500; caption 12/16/400–500 for ChatGPT. Review long Vietnamese content and reconcile production approval before shared token rollout. |
| DS-02 Scheme Sync | `color.md` and `.codex/rules/10-styling.md` defer action mapping; preserve feature-specific blue primary, red action, green publish and portal scope. | Product Sync may explore a clearer operations UI, while keeping domain/action meanings distinct. No global color/layout migration. |
| DS-03 color | 2026-11-06 addendum approves brand `#DB1F26`, `#0E377B`, `#EE7117`, `#F7D107`, `#F4A60E`; text `#111827/#4B5563/#6B7280`; surfaces `#F9FAFB/#FFFFFF/#F3F4F6`; feedback success `#15803D/#F0FDF4`, warning `#B45309/#FFFBEB`, error `#B91C1C/#FEF2F2`, info `#1D4ED8/#EFF6FF`; borders default `#D1D5DB`, control `#6B7280`. | Showcase role-to-component mappings. Brand red is not error; cobalt is not info. Focus, interaction/navigation/disabled colors and physical token owner remain open. Historical colors are not active approval. |
| DS-04 accessibility | WCAG 2.2 AA target approved; no existing conformance established. | Evaluate keyboard, visible focus, contrast, form errors, non-color state cues and responsive reflow. Do not claim conformance without rendered verification. |
| DS-05 StatusBadge | Six variants: success, warning, error, info, neutral, accent. Approved error `#B91C1C/#FEF2F2`; accent `#0E377B/#E8EFFB`. Reference production styles still share legacy red; features own business mappings. | Showcase all six with readable labels; error means failure, accent means non-error emphasis. Prototype target is not a production migration. |

## 9. Form UX Guidelines and Designlab mapping

“Direct” identifies explicit tips in [Designlab's article](https://designlab.com/blog/form-ui-design-best-practices); “HDS” identifies verified reference guidance; “Prototype” is a new recommendation. The article's advice to disable submit until valid (tip 30) is **not automatically adopted**: it can obscure error recovery and may conflict with draft workflows.

| Guideline | Direct Designlab support | Approved HDS / adopted reference position | Prototype recommendation / decision |
| --- | --- | --- | --- |
| Minimal necessary fields | Tips 1, 22 | No universal field-removal approval | Audit against each task. **NEEDS-TEAM-DECISION** before omitting a production-equivalent field. |
| Logical grouping | Tips 3–5 | Feature owns business fields; `FormLayout` supports compatible section workflows | Group by task with section headings; no universal form template. |
| Single-column first | Tip 7 | No universal HDS layout rule | Use one main reading column for long forms; compare paired fields only when semantically useful. |
| Persistent top labels | Tips 8, 18 | DS-01 label role supplied by task; numeric approval conflict noted | Keep labels above fields; never use placeholder-only labels. |
| Required/optional indicators | Tip 2 favors visible “optional” text | No approved universal marker convention found | Show explicit optional/required meaning. **NEEDS-TEAM-DECISION** on shared wording. |
| Helpful descriptions and examples | Tips 14, 15, 20, 21 | Reference form rule requires explicit validation behavior | Keep concise helper/format text adjacent to fields; use fictional examples. |
| Progressive disclosure | Tip 3 discusses conditional logic; no broad pattern prescribed | AntD `FormInstance` owns field dependencies; target Product Settings uses `shouldUpdate` | Reveal advanced/conditional groups when relevant. Test hidden-field values/errors. **NEEDS-TEAM-DECISION** per business rule. |
| Long-form section/step navigation | Tip 11 supports steps | Reference `FormLayout` supports feature-composed sections, not universal use | Compare anchor, steps and tabs using the existing experiment; make all errors findable. |
| Action-specific buttons | Tip 16 | No approved global wording | Use action-specific copy such as “Save settings” and “Run sync”; team validates localized wording. |
| Contextual validation | Tips 26, 28 | AntD Form/FormInstance is sole state owner; existing rules remain valid | Validate at appropriate field/submit boundary; preserve existing contracts. |
| Actionable errors | Tips 26, 29 | DS-04 error identification/feedback target | State cause and correction beside field; domain owns the rule. |
| Validation summary/navigation | Article favors visible errors but does not explicitly require a summary or jump links | Reference form rule says root/unmapped errors cannot be silently dropped | **New prototype recommendation:** summary links to sections/fields and first-error focus. **NEEDS-TEAM-DECISION** on timing. |
| Unsaved-changes protection | Not directly covered | Reference form rule preserves dirty drafts; target has guard experiment | **New prototype recommendation:** protect route/drawer/platform exit and refresh. Team decides exact prompt policy. |
| Save/cancel/confirmation/loading/success | Tips 16, 23, 24 cover action text, confirmation and success, not all cancel/loading states | Reference preserves form lifecycle; DS-04 feedback target | Show pending, success/failure and discard feedback; confirm consequential actions. Team decides contextual save policy. |
| Keyboard/focus | Article discusses accessibility, but does not define focus behavior | DS-04 explicitly targets keyboard/focus review | Test Tab, Shift+Tab, Enter, Escape, focus return and names; no compliance claim without verification. |
| Responsive behavior | Tips 13, 33 | DS-04 responsive readability target | Desktop-first; collapse columns/nav without hiding actions, filters or errors. |
| Cross-browser testing | Tips 31–33 | Reference styling rule requires affected-state review | Test supported browsers and mobile; article's dated browser statistics are not current requirements. |

**Form-state boundary:** AntD `Form`/`FormInstance` owns values, touched state, errors, dependencies, registration and reset. Keep Claude's existing rules, field names and validation unchanged. Do not introduce React Hook Form. Prototype-only constraints may use AntD rules; any future Zod integration must remain feature-owned and explicitly map issues with `setFields()` per reference `.codex/rules/05-form.md`.

## 10. Screen-by-screen implementation plan

Every “Claude” cell below is **verified from target source**, not a browser result. Every “ChatGPT” cell is a **proposal**. “Shared” means fictional fixture shape or neutral scenario metadata; pages, form state and styling stay platform-owned. Each screen later needs desktop/narrow screenshots and task outcomes.

| Screen, purpose, evidence | Existing Claude behavior | Proposed ChatGPT alternative; ownership, form UX/validation, open decision |
| --- | --- | --- |
| **Selection, P1:** choose design; `router.tsx` root redirect | `/` redirects to Offer Types. | Neutral landing with platform descriptions and compare entry. Share route metadata only. Validate keyboard/deep-link entry. **Decision:** remember last choice? |
| **ChatGPT shell, P1:** orient operators; `AppLayout`, `Sidebar`, `menu-tree`, `AppBreadcrumb` | Three-level menu, collapsible sidebar, menu-derived breadcrumb and intentional missing-entry warning. | Independent domain nav, stable page header/filter/action slots, responsive shell. Platform-owned. Validate collapsed navigation/focus and unknown route. **Decision:** 2 vs 3 levels; global search. |
| **Theme/component showcase, P1:** inspect approved roles; `theme/tokens.ts`, DS docs | One blue placeholder theme, no showcase route. | Show DS type/color roles, six badges, table/form/drawer states. Share approved reference values, not runtime implementation. Validate contrast/focus. **Decision:** runtime token owner and unresolved interaction states. |
| **Offer Types, P2:** browse/reorder/edit; `OfferTypeListPage`, `OfferTypeDrawerRoute`, `OfferTypeEditPage`, `OfferTypeForm` | 120-item paginated list, page-local reorder; child drawer over mounted list; sibling full-page edit; one form component. | Readable table, persistent filters/actions, route-driven detail drawer, explicit full-page complex edit. Share fictional offer shape only. Validate create/edit, long-form errors, direct drawer, context restoration and reorder boundary. **Decision:** drawer threshold, reorder model, edit route. |
| **Product Settings, P2:** edit complex configuration; `ProductSettingsForm`, `ProductSettingsEditPage` | Full page; two `Form.List`s, conditional fields, top contextual save bar. | Full-page sections, section nav, error summary, save/discard and dirty baseline. Share fictional product shape only. Validate arrays, conditional requirements, hidden errors, refetch and save feedback. **Decision:** top save vs footer; steps vs anchor. |
| **Product Sync, P2:** inspect/run sync; `ProductSyncPage` | KPI/table; local diff, history, confirm/progress modals without URLs. | Operations dashboard with result filters and clear action hierarchy; preserve Scheme Sync action semantics. Share fictional sync events. Validate modal focus and pending/failure/success. **Decision:** addressable history? |
| **Promotion Types, P3:** classify promotions; `PromotionTypesListPage`, `PromotionTypeDrawerRoute`, `PromotionTypeForm` | List/status toggle, child-route create/edit drawer, no delete. | Compact table with status labels and context-preserving drawer. Share fictional records. Validate required name/code, duplicate demo code, cancel/close, focus return. **Decision:** edit route and status confirmation. |
| **Fees, P3:** edit fee parameters; `FeesListPage`, `FeesEditPage`, `FeesForm` | List and full-page edit. | Dense comparison table plus grouped full-page fee form. Share fictional fee shape. Validate numeric range, units/precision, error summary and dirty exit. **Decision:** save placement; inline edit. |
| **Background Locks, P3:** set priority; `BackgroundLockListPage`, `BackgroundLockDrawerRoute`, `BackgroundLockForm` | Ten-item unpaginated reorder list and six-field drawer. | Clear priority table/context drawer with keyboard reorder alternative. Share fictional items. Validate short form, priority collision, route close. **Decision:** drawer cutoff and reorder model. |
| **Promotions, P3:** create/edit campaigns; `PromotionsListPage`, `PromotionCreatePage`, `PromotionEditPage`, `PromotionForm` | List and full-page create/edit. | Full-page multi-section editor, summary and actionable errors. Share fictional promotion shape. Validate dates, conditional fields, duplicate submit and cancel. **Decision:** step vs section; drafts. |
| **Required Information, Display Information Sets, Add-ons, P3:** maintain product metadata; corresponding feature folders | Each has list and full-page edit. | Reuse ChatGPT header/table *patterns*, not generic business form. Share fictional records only. Validate each form's required/nested fields and labels. **Decision:** order after P2 findings. |
| **Popular Loans, Attractive Offer, Exclusive Touch, P3:** configure assignments; corresponding feature folders, `AssignProductsDrawer` | Single-config screens; Exclusive Touch has local assignment drawer. | Explicit count/status context and save feedback. Share fictional choices; own UI. Validate selection/empty/dirty close. **Decision:** local vs route-bound drawer. |
| **Drawer vs Full Page, P4:** choose edit substrate; Offer Type screens | Both substrates already exist. | Paired task on same fictional record; compare context, errors, deep links and narrow width. **Decision:** threshold based on task complexity, not field count alone. |
| **Unsaved changes, P4:** prevent loss; unsaved experiment and guard hook | Local vs route-bound drawers; `useBlocker` catches navigation but local close bypasses it; `beforeunload` fallback. | Consistent dirty prompt across page/drawer/platform exit. Form owns dirty baseline; guard owns navigation. Validate Cancel/X/mask/Escape/back/link/refresh/focus return. **Decision:** prompt policy and auto-save. |
| **Reorder with pagination, P4:** choose ordering; `ReorderExperimentPage` | Current-page drag, all-item sort mode, direct position on same offer data. | Compare accuracy, accessibility and explicit save/conflict feedback. Share records. Validate cross-page, keyboard and stale order. **Decision:** universal or per-list rule. |
| **Tabs vs Anchor, P4:** recover hidden validation; `TabsVsAnchorExperimentPage` | Same invalid reminder value 45 (>30) in final group; tabs obscure error, sections expose it. | Full-page sections, summary links and first-error focus using AntD Form. Validate hidden/conditional errors. **Decision:** tabs only for non-form content? |
| **Contextual save + decisions, P4:** record outcomes; `ContextualSaveBar`, `DecisionsPage` | Top save bar in Product Settings; eight localStorage decision notes. | Compare top/footer/in-section save; decision register with scenario, evidence, owner, status, rationale and date. Keep Claude notes separate. Validate reload/blocked storage/export. **Decision:** durable decision authority. |

## 11. Claude vs ChatGPT comparison strategy

**Proposal:** Each `/compare/:scenario` holds a neutral fictional record ID, task, paired URLs, expected outcome, criteria, observations, status (`open`, `testing`, `recommended`, `approved`, `rejected`), owner, rationale and evidence links. Launch each platform in its own route/context; do not share active form state. Side-by-side mounting requires provider/portal isolation proof first.

Compare task completion, table scanning, error recovery, navigation context, keyboard path, narrow-width reachability and operator confidence. Record screenshots and observations separately from team decisions. Existing `/decisions` localStorage notes remain a Claude artifact; new comparison records may link to them but must not overwrite them. “Recommended” is not “approved.”

## 12. Implementation phases and file-level changes

These are **proposed future edits**, not changes made by this report.

| Phase | Proposed files / bounded change | Exit condition |
| --- | --- | --- |
| 1A routing safety | `src/routes/router.tsx`; new `src/routes/legacy-redirects.tsx` or equivalent; route/path helper; targeted absolute-link callers in `src/layouts/`, `src/menu/`, `src/features/`, `src/experiments/`, `src/pages/` | Every old URL reaches the same Claude screen and internal navigation stays in Claude. Preserve nested drawer/sibling page topology. |
| 1B landing and shell | New `src/pages/PlatformSelectionPage.tsx`, `src/chatgpt/layout/ChatGPTLayout.tsx`, `src/chatgpt/menu/*`, scoped styles and compare shell | `/` selects; `/claude`, `/chatgpt`, `/compare` have distinct shells and working deep links. |
| 1C theme/showcase | `src/chatgpt/theme/*`, `src/chatgpt/showcase/*`; route-local `ConfigProvider`; no change to Claude `src/theme/tokens.ts` semantics | DS showcase renders; Claude computed styles match baseline; portals are scoped. |
| 2 | `src/chatgpt/features/offer-types/*`, `product-settings/*`, `product-sync/*`; fictional fixture adapters only where needed | Three priority flows usable with AntD Form and explicit validation states. |
| 3 | ChatGPT feature folders for Promotion Types, Fees, Background Locks, Promotions, Required Information, Display Sets, Add-ons and single-config pages | Screen-specific behavior and decision list complete; no production APIs. |
| 4 | `src/chatgpt/experiments/*`, `src/compare/*`; scenario/decision fixtures and optional local persistence | Paired scenarios reproducible; recommendations and approvals remain distinct. |

**Dependency discipline:** The installed stack covers the proposed shell, forms, tables, routing, drag interaction and local notes. Add nothing until a concrete capability gap and cost are documented. Avoid moving existing Claude files merely for folder symmetry if route composition/adapters preserve behavior.

## 13. Validation and acceptance criteria

**Verified scripts in target `package.json`:** `npm run typecheck` runs `tsc --noEmit`; `npm run build` runs `tsc --noEmit && vite build && node scripts/spa-fallback.mjs`; `npm run dev` and `npm run preview` exist. No test, lint or browser-test script is declared. No application command or browser test was run for this report.

| Gate | Required evidence during later implementation |
| --- | --- |
| Static | `npm run typecheck`, `npm run build`, `git diff --check`; inspect changed-file diff and confirm `dist/index.html` plus `dist/404.html`. |
| Routing | Direct load/reload for `/`, every section-5 URL, representative nested `/claude/*`, `/chatgpt/*`, `/compare/*`; preserve `:id`, search/hash, drawer context and redirects under `/demo-layout/` and root-hosted `VITE_BASE=/`. |
| Claude regression | Baseline/post-change screenshots and walkthroughs for all current screens/experiments: paging/reorder, local import, drawer close, full-page handoff, modals, save/cancel and decision-note persistence. |
| Theme isolation | Compare computed type/color/AntD component and portal styling across shells; switch between platforms and return. |
| Forms/drawers | Verify `FormInstance` state owner, dependencies, arrays, validation/error recovery, async/loading/success, cancel, direct drawer load, focus return, dirty baseline and refresh behavior. |
| Responsive/accessibility | Desktop/narrow viewport, zoom/reflow, table overflow, nav/action reachability, keyboard order, visible focus, Escape, error summary navigation, labels, non-color status meaning and measured contrast. Test supported browsers. Record defects; do not claim WCAG conformance from static checks. |
| GitHub Pages | After a future authorized deployment, inspect actual subpath and direct deep links, 404 fallback and asset loading. No deployment in this task. |

## 14. Risks and compatibility constraints

- **Legacy absolute links:** Menu, breadcrumbs, drawers, decisions and feature actions embed unscoped paths. Prefixing the router alone will leak out of Claude. Audit all route callers before editing.
- **Drawer lifecycle:** Child-route drawers keep lists mounted; full-page siblings unmount them. A direct drawer URL needs a stable close destination. Local overlays do not trigger `useBlocker` (`useUnsavedChangesGuard.ts`).
- **Theme cascade:** One global AntD provider and reset may affect all branches. Nested providers and CSS Modules still require portal and computed-style checks.
- **Reference mismatch:** HDS Admin's layouts, Redux and `FormLayout` are not in the target. Reference policy guides ownership; it is not a drop-in architecture.
- **Data exposure:** Target `README.md` warns Pages is public despite the private repository. Commit only generated fictional data; never include production/customer exports, secrets or endpoints in fixtures, screenshots or comparison records.
- **Approval drift:** Color addendum supersedes historical values; DS-01 numeric approval conflicts; DS-02 and interaction tokens remain open. Document policy choice before runtime token mapping.
- **No UI suite:** Package scripts supply type/build only. Manual or later approved browser automation is necessary for route, visual and accessibility evidence.

## 15. NEEDS-TEAM-DECISION

1. Reconcile DS-01 numeric scale: this task calls it approved while reference typography/styling documents call it candidate. Decide production status and responsive variants.
2. Choose physical runtime owner/mapping for DS-03 roles; resolve focus, hover, active, selected, navigation, link/action and disabled semantics after rendered contrast review. Do not infer these from brand primitives.
3. Confirm Scheme Sync's feature-owned Be Vietnam Pro/palette exception and DS-02 action-role mapping; preserve current semantics meanwhile.
4. Choose ChatGPT nav depth, direct-link breadcrumb treatment and whether global search is worthwhile. Keep Claude's current breadcrumb gap observable.
5. Choose drawer/full-page threshold using task context, validation density and deep-link need; decide Promotion Type edit route convention.
6. Choose dirty-state prompt policy across drawer close, route/platform switch and refresh; define save baseline and any draft/auto-save behavior.
7. Choose reorder semantics for paginated data, keyboard alternative and collision handling; current target modes are experimental.
8. Choose tabs, steps or anchor sections for long forms; define summary/focus behavior and required/optional copy.
9. Choose contextual save position and confirmation policy per action; define comparison record owner, approval authority and durable storage/export path.
10. Choose supported browser/device matrix and whether an E2E/accessibility dependency is justified after tooling review.

## 16. Unverified items

No browser, runtime, deployment, keyboard, screen-reader, contrast, form-submission, cross-browser, responsive or GitHub Pages deep-link check was performed. Static source does not establish that Claude is defect-free, external fonts load, approved colors render in either repository, or any UI meets WCAG 2.2 AA. The reference project context is a dated snapshot; production facts were not independently re-audited beyond the cited DS/Codex documents. The public Pages URL, live deployment and actual team approval state were not checked. This plan uses the task's DS-01 scale while flagging the documentation conflict.

## 17. Recommended first implementation slice

Implement **Phase 1A–1C** as one reviewable slice: selection page; `/claude` tree plus compatibility for every current URL; empty ChatGPT shell with scoped theme/component showcase; and a `/compare` scenario index. Before adding business screens, run the route matrix and Claude screenshot/interaction regression walkthrough, including nested drawer deep links and Pages-style 404 fallback. That establishes a stable comparison frame while keeping all current experiments usable.
