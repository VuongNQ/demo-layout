# DS-03 Semantic Color Token Audit

- **Author:** Vuowng
- **Date:** 2026-11-05
- **Branch:** `feature/vuongnq/2803_dong-bo-Vip-the-tin-dung`
- **Revision:** `6e4e6ee93c33373056e3c83ce855e5f618d59064`
- **Status:** Read-only source audit and proposal. No implementation or token values are approved here except the decisions listed below.
- **Scope:** Current global color declarations and consumers; Ant Design provider/overrides; shared status, representative layout, table, form, modal/drawer, navigation, button, alert and notification paths; Scheme Sync palette and scope.

## 1. Executive summary

**APPROVED DECISIONS:** DS-03 option B approves semantic roles first and detailed values separately. Admin `brand.primary` remains `#DC2626`; the page direction prefers a light neutral background; brand and error stay semantically independent. Semantic feedback, neutral, surface, border and interaction roles are required. Dark mode and bulk legacy migration are out of scope. Scheme Sync should eventually use the shared system, with migration deferred.

**CONFIRMED CURRENT IMPLEMENTATION:** `src/index.scss` exposes a flat set of root CSS variables. `src/providers/index.tsx` configures Ant Design's font only. `src/custom-ant.scss` contains global selector overrides, including primary-red, notification backgrounds, disabled input text and tabs. `StatusBadge` consumes the root palette directly. Scheme Sync owns a separate, more complete palette in `_tokens` Sass mixins; its TypeScript token export has no runtime consumer in the module.

**PROPOSAL:** approve role names and ownership separately from the candidate HEX table below. Values reused from source are evidence, not approval. Several proposed feedback foregrounds are already in Scheme Sync and have adequate text contrast against their current light fills; the shared StatusBadge success and warning pairs do not meet the proposed normal-text contrast target. The current global border token is translucent and very low contrast; some legacy surface/border choices are also inconsistent.

The contrast target is **PROPOSED**, not an approved HDS conformance commitment. The reference thresholds are WCAG 2.2 AA: 4.5:1 for normal text, 3:1 for large text, and 3:1 for visual information needed to identify UI components/states. A ratio calculation alone does not establish full accessibility or conformance. See [WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) and [SC 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast).

## 2. Approved decisions versus proposals

### APPROVED DECISION

- Use option B: agree semantic roles before approving detailed values.
- Preserve Admin `brand.primary = #DC2626`.
- Prefer a light neutral page surface.
- Brand and error are separate roles; red brand usage alone does not mean error.
- Define semantic feedback, neutral, surface, border and interaction roles.
- Do not implement dark mode.
- Do not bulk-migrate legacy components.
- Scheme Sync is an eventual shared Design System consumer, but implementation is out of scope for this audit.

### PROPOSED / NEEDS-TEAM-DECISION

- All new assignments and names in the target matrix below, except the approved brand-primary value, are proposed for review. Source-backed HEX values remain evidence until individually accepted.
- WCAG 2.2 AA is a **PROPOSED** review target pending DS-04; no HDS WCAG level has been approved.
- `brand.secondary` is **NEEDS-TEAM-DECISION**. No official HD SAISON brand-blue asset or color specification was verified. Existing blue values are UI colors in source and are not evidence of official brand blue.
- The mapping from existing generic CSS aliases to semantic roles, including whether aliases remain as compatibility aliases during migration, needs approval.

## 3. Source evidence and current ownership

Line numbers refer to revision `6e4e6ee` and were checked against the current checkout.

| Source | Confirmed evidence and ownership |
| --- | --- |
| [`src/index.scss`](../../../../src/index.scss#L6) | Root `:root` palette at lines 6–31: `--primary-color: #dc2626`, black/white, text `rgba(0,0,0,.88)`, grays `#5d5d5d/#959595/#f3f3f3`, success `#10ba08`, pale-red page background `#fff6f6`, pagination/form/layout grays, translucent border, separator, soft feedback fills, and `green/orange/blue` values. These names mix semantic, hue, opacity, layout and component roles. |
| [`src/custom-ant.scss`](../../../../src/custom-ant.scss#L19) | Global AntD overrides use `--primary-color` for checked checkbox, switch, date range, active tabs and rich-text error borders (lines 19–35, 60–62, 90–103, 148–160, 188–220). Notification background is hard-coded to success fill for every notification, with only the error class switching to soft pink (106–129). Disabled input text is forced to dark body text (68–72). No general hover/active/focus/disabled semantic token set is defined here. |
| [`src/providers/index.tsx`](../../../../src/providers/index.tsx#L24) | `ConfigProvider` receives `theme.token.fontFamily` only (24–28, 45–48); no color tokens or component color tokens are configured. |
| [`src/components/status-badge/index.tsx`](../../../../src/components/status-badge/index.tsx#L3) | Shared badge API is `label`, `variant`, optional `className`; variants are success/warning/error/info/neutral/accent. Current mapping in [`status-badge.module.scss`](../../../../src/components/status-badge/status-badge.module.scss#L13) reads generic root variables. Success uses `#22c55e` on `#f0fdf5`; warning `#f97316` on `#fff4ed`; error and accent both use brand red on `#fef2f2`; info uses `#2f6bff` on `#eef4ff`; neutral uses `#5d5d5d` on `#e7e7e7`. The component stylesheet owns those pairings today. |
| [`src/components/button.tsx`](../../../../src/components/button.tsx#L19) | Shared Emotion button wrapper reads primary and white CSS variables. Its hover uses `lighten(0.1, primaryColor)`, which makes the red lighter; no explicit active or focus-visible color is set in this wrapper. AntD remains the wrapped control. |
| [`src/layouts/main.layout.tsx`](../../../../src/layouts/main.layout.tsx#L66) | Main shell hard-codes `#fff` on the outer Layout, uses the `colorBgContainer` AntD token, then overrides content to `--bg-content-layout` (`#f4f4f4`); sidebar uses white and `--border-color` (lines 66–67, 124–163). This gives AntD and CSS variable ownership overlapping surface responsibilities. |
| [`src/layouts/basic.layout.tsx`](../../../../src/layouts/basic.layout.tsx#L40) | Basic shell uses `colorBgContainer` for header/footer and `--bg-content-layout` for content. |
| [`src/components/table-wrapper.tsx`](../../../../src/components/table-wrapper.tsx#L27) | Shared table wrapper owns a white card surface; table internals otherwise inherit AntD defaults or feature rules. |
| [`src/components/modal-content.tsx`](../../../../src/components/modal-content.tsx#L249) | Legacy modal content hard-codes white sticky action/title backgrounds (249–302), while the AntD Modal host owns outer modal chrome. |
| [`src/components/notification-message.tsx`](../../../../src/components/notification-message.tsx) and [`src/providers/notification.provider.tsx`](../../../../src/providers/notification.provider.tsx#L28) | Notification context selects AntD `api[type]`, but always supplies custom success/fail SVG icons for all four types (provider lines 28–52). `custom-ant.scss` gives all notices a green background except error. The rendered visual semantics therefore do not consistently follow the requested notification type. |
| [`src/modules/products/promotion-management/promotion-type/components/PromotionTypeTableSection/index.tsx`](../../../../src/modules/products/promotion-management/promotion-type/components/PromotionTypeTableSection/index.tsx#L121) | Representative table maps feature-owned status values to `StatusBadge`; error loading state uses AntD `Alert type='error'` (lines 150–162). Domain-to-presentation ownership is feature-local. |
| [`src/modules/products/promotion-management/promotion-type/components/PromotionTypeDetailDrawer/styles.module.scss`](../../../../src/modules/products/promotion-management/promotion-type/components/PromotionTypeDetailDrawer/styles.module.scss#L16) | Representative drawer defines secondary labels with `rgba(0,0,0,.45)` and a separator with `rgba(0,0,0,.06)`, illustrating local text/border values outside the shared palette. |
| [`src/components/menus.tsx`](../../../../src/components/menus.tsx#L258) and [`src/components/Header.tsx`](../../../../src/components/Header.tsx#L60) | Navigation uses AntD light Menu/Sider and `theme.useToken()` container background; a complete navigation color mapping is not declared in these call sites. AntD computed defaults and theme CSS also contribute. |
| [`src/modules/products/configuration/scheme-sync/scheme-sync.tokens.ts`](../../../../src/modules/products/configuration/scheme-sync/scheme-sync.tokens.ts#L1) | Exports a TS palette, typography, spacing and radius object. A source search found no runtime consumer of `schemeSyncTokens`; it is currently unused as code (one import-error-workbook comment references it). |
| [`src/modules/products/configuration/scheme-sync/scheme-sync.module.scss`](../../../../src/modules/products/configuration/scheme-sync/scheme-sync.module.scss#L1) | Active color definitions are duplicated in Sass custom properties (lines 1–18). `scheme-sync-tokens` and `scheme-sync-legacy-aliases` are included on the page scope and AntD modal/drawer/popover portal classes (lines 36–69, 87–90), so these values and aliases are active and deliberately cross portal boundaries. The global aliases temporarily shadow root variables inside those scopes. |
| [`src/modules/products/configuration/scheme-sync/views/SchemeSyncPage/styles.module.scss`](../../../../src/modules/products/configuration/scheme-sync/views/SchemeSyncPage/styles.module.scss#L1) | Page, table, button, tabs and publish action use scoped tokens (lines 1–103). Primary action uses red, publish action uses green, hover/focus-visible share hover values (20–55); disabled tabs explicitly reuse secondary text (90–93). |
| [`src/modules/products/configuration/scheme-sync/components/CashLoanTab/styles.module.scss`](../../../../src/modules/products/configuration/scheme-sync/components/CashLoanTab/styles.module.scss#L9) | Scoped error/warning alert border and background colors are overridden to module semantic values (9–21). |

The module context document [`docs/modules/products/scheme-sync.md`](../../../modules/products/scheme-sync.md) is dated to revision `8562c125`; it is useful for scope, but its claims were not treated as current until checked against the source above.

### Current root CSS-variable inventory

All values below are declared under `:root` in `src/index.scss:6–31`. Names are shown as implementation currently defines them; the description is usage/role inference from the value/name and observed consumers, not an approved semantic classification.

| Current variable | Current value | Current role signal / audit note |
| --- | --- | --- |
| `--primary-color` | `#DC2626` | Brand/primary; approved Admin primary. Also used in legacy validation/error selectors. |
| `--black-color` | `#000` | Primitive black; consumer inventory not exhaustive. |
| `--text-color` | `rgba(0, 0, 0, 0.88)` | Body/text alias; overlaps AntD text defaults by value. |
| `--white-color` | `#FFF` | Surface/control foreground alias. |
| `--gray-color` | `#5D5D5D` | Neutral text; used by shared neutral StatusBadge. |
| `--gray-light-color` | `#959595` | Muted gray; used by tabs/shadows; may be too light for text on white. |
| `--gray-soft-color` | `#F3F3F3` | Pale neutral fill; name implies background. |
| `--success-color` | `#10BA08` | Green success alias; distinct from `--green-color` and not used by shared StatusBadge. |
| `--background-color` | `#FFF6F6` | Blush background; not the current MainLayout content canvas. |
| `--pagination-next-prev-color` | `#F6F6F6` | Pagination/date-range background. |
| `--yellow-color` | `#FFFE4E` | Hue primitive; semantic owner not established. |
| `--border-color` | `rgba(5, 5, 5, 0.06)` | Very subtle general border; used at the sidebar boundary. |
| `--bg-bottom-navigation` | `#F7F7F7` | Layout-specific surface name. |
| `--bg-add-form` | `#F6F6F6` | Form-area surface. |
| `--bg-content-layout` | `#F4F4F4` | Main/Basic content canvas. |
| `--light-white-color` | `#E7E7E7` | Light neutral; shared StatusBadge neutral background. |
| `--black-50-opacity` | `rgba(0, 0, 0, 0.5)` | Overlay/shadow primitive; semantic ownership not established. |
| `--separator-color` | `#B0B0B0` | Separator/border alias; visually much stronger than `--border-color`. |
| `--soft-pink-color` | `#FEF2F2` | Error/accent fill in badge and error notification. |
| `--soft-green-color` | `#F0FDF5` | Success fill in shared badge and notification default. |
| `--soft-orange-color` | `#FFF4ED` | Warning fill in shared badge. |
| `--soft-blue-color` | `#EEF4FF` | Info fill in shared badge. |
| `--green-color` | `#22C55E` | Success badge foreground; duplicates the success family under another value/name. |
| `--orange-color` | `#F97316` | Warning badge foreground. |
| `--blue-color` | `#2F6BFF` | Info badge foreground; not an official brand-secondary declaration. |

**Ant Design tokens currently configured/read:** the app provider sets only `fontFamily`; no global color token is passed to `ConfigProvider`. `MainLayout`, `BasicLayout` and `Header` read `colorBgContainer` through `theme.useToken()`; `Sider`/`Menu` specify light mode. The runtime-generated values for other AntD global/map/component tokens were not exhaustively inventoried or measured in this static audit and are **NOT VERIFIED** here. Existing call sites and custom CSS can override them.

### Current source values of note

- **Brand:** root `--primary-color` is `#DC2626`; the same value is hard-coded in rich text, SVG fills, and some feature styles.
- **Feedback duplicates/conflicts:** root `--success-color` is `#10BA08`, but StatusBadge success uses `--green-color: #22C55E`; Scheme Sync success text is `#15803D`. Warning also varies (`#F97316` shared badge vs `#B45309` Scheme Sync); info varies (`#2F6BFF` vs `#1D4ED8`). Error is sometimes `#DC2626`, conflating brand and error by value even though approved semantics are independent.
- **Surfaces:** root background is blush `#FFF6F6`; page content is gray `#F4F4F4`; pagination/form gray `#F6F6F6`; bottom navigation `#F7F7F7`; badge fills and Scheme Sync use other grays/blue/red. Main shell and modal also hard-code white.
- **Borders:** root `rgba(5,5,5,.06)`, separator `#B0B0B0`, Scheme Sync `#E5E7EB`, feature table `#E5E7EB/#F0F0F0`, drawers `rgba(0,0,0,.06)`, and some feature custom borders coexist.
- **States:** checkbox hover/checked, switch, tabs, date range and button states rely on primary red. Button hover lightens red, whereas Scheme Sync hover darkens red. Focus has no single cross-app role; Scheme Sync selectively supplies `:focus-visible` and a blue 12% shadow on filter controls. Disabled tab/input rules differ and there is no common disabled color contract.

## 4. Current-to-target mapping

The mapping is a proposal, not a migration instruction. “Existing source” identifies observed evidence; it does not confer approval.

| Current declaration / behavior | Proposed semantic role | Proposed target / disposition |
| --- | --- | --- |
| `--primary-color: #DC2626` | `brand.primary` | Keep `#DC2626` (APPROVED). It may style brand actions/selection/link emphasis; it does not imply error. |
| Red also used for error and feature status | `feedback.error.foreground` | Separate role. Candidate `#B91C1C`, already used as Scheme Sync brand hover, so its contrast-ready value can differ from brand red. Business/error meaning still comes from semantic state, not color alone. |
| Blue hue variables and Scheme Sync `primary` | `feedback.info.foreground` / interactive information | Use a dedicated info role. Candidate `#1D4ED8` is an existing Scheme Sync UI color, not an official HDS brand color. `brand.secondary` remains NEEDS-TEAM-DECISION. |
| `--text-color`, `--gray-color`, `--gray-light-color`, module text vars and literal rgba | `text.primary`, `text.secondary`, `text.muted`, `text.disabled` | Consolidate role names only after value approval; text hierarchy and true disabled-state semantics must remain distinct. |
| `--white-color`, multiple `--bg-*`, `--background-color`, `colorBgContainer`, literal whites | `surface.page`, `surface.raised`, `surface.base`, `surface.subtle` | Prefer neutral page (`#F9FAFB` candidate; observed in Scheme Sync), white base/raised surface, and a distinct subtle neutral. Do not preserve blush as the default page surface merely because it is currently a root variable. |
| `--border-color`, `--separator-color`, module border literals | `border.subtle`, `border.default`, `border.strong`, `border.focus` | Separate decorative separators from boundaries required to perceive controls. Current low-opacity separators should not be assumed to satisfy a non-text contrast target. |
| Hover and focus values embedded in wrappers / SCSS | `interaction.hover`, `.active`, `.focus`, `.disabled` | Explicit, component-state roles; darken brand on hover/active rather than lighten. Focus should use a visible outline/ring independent of hover fill; disabled states need a distinct, coherent treatment. |
| Scheme Sync `--scheme-sync-*` plus aliases | Shared semantic roles in page and portal scope | Eventual module migration maps actual used roles, not mechanical variable-name substitution. Preserve portal scoping until an approved replacement provides equivalent token availability. |

## 5. Proposed primitive palette and semantic token matrix

All values below except `brand.primary` are **CANDIDATE**, for team review. Reusing an existing source value does not make it an approved token. A candidate which is not currently in source is an explicit design proposal, not an assertion about current implementation. No value is proposed for `brand.secondary`.

| Primitive / role | Candidate HEX | Evidence / status |
| --- | --- | --- |
| Brand primary | `#DC2626` | **APPROVED DECISION**, current `--primary-color`. |
| Brand secondary | No value | **NEEDS-TEAM-DECISION**; official HD SAISON brand asset/spec was not verified. |
| Neutral ink | `#111827` | CANDIDATE, existing Scheme Sync text. |
| Neutral slate | `#4B5563` | CANDIDATE, proposed neutral; not found in current source. |
| Neutral muted | `#6B7280` | CANDIDATE, existing Scheme Sync secondary text. |
| Neutral disabled | `#9CA3AF` | CANDIDATE, proposed; not found in current source. Review disabled readability and applicable WCAG exception separately. |
| Neutral border subtle | `#D1D5DB` | CANDIDATE, proposed; not found in current source. |
| Neutral border strong | `#6B7280` | CANDIDATE reuse of an observed neutral; use only where a visible component boundary is necessary. |
| Surface base / elevated | `#FFFFFF` | CANDIDATE role assignment; white is current in source. |
| Surface page | `#F9FAFB` | CANDIDATE; existing Scheme Sync page background. |
| Surface subtle | `#F3F4F6` | CANDIDATE, proposed; not found in current source. |
| Success foreground / background | `#15803D` / `#F0FDF4` | CANDIDATE reuse of active Scheme Sync values; aligns feedback role and adequate text contrast. |
| Warning foreground / background | `#B45309` / `#FFFBEB` | CANDIDATE reuse of active Scheme Sync values. |
| Error foreground / background | `#B91C1C` / `#FEF2F2` | Foreground/background assignment is CANDIDATE; both values are in source. Separate from approved brand role. |
| Info foreground / background | `#1D4ED8` / `#EFF6FF` | CANDIDATE reuse of active Scheme Sync values. This is UI info blue, not a brand declaration. |
| Semantic alert borders | `#86EFAC`, `#FCD34D`, `#FCA5A5`, `#93C5FD` for success/warning/error/info | CANDIDATE examples; new values not found in current source. Their ratios against the corresponding pale fills are low (1.34, 1.39, 1.74, 1.66:1). Do not rely on border color alone to convey state. Need separate approval or omit semantic borders and use a shared neutral stroke plus icon/text. |
| Primary hover / active | `#B91C1C` / `#991B1B` | Hover exists in Scheme Sync; active value is CANDIDATE and not found in source. |
| Focus ring | `#DC2626` | CANDIDATE use of approved brand primary as a focus indicator; blue is not required for focus. Test against all actual adjacent surfaces. |
| Disabled foreground / surface | `#9CA3AF` / `#F3F4F6` | CANDIDATE pair; low contrast is intentional only for inactive UI. Disabled state must remain identifiable and must not be the only way to communicate a required value. |

### Proposed semantic role definitions

| Role family | Proposed role names | Use |
| --- | --- | --- |
| Brand | `brand.primary`, `brand.primary.hover`, `brand.primary.active`, `brand.secondary` | Product identity, primary action and selected emphasis. `brand.secondary` has no value until the brand asset/spec is verified. |
| Text / neutral | `text.primary`, `text.secondary`, `text.muted`, `text.disabled`; neutral ramp | Headings/body, supporting labels, tertiary metadata, disabled content, and non-semantic neutral data. Placeholder is not automatically disabled. |
| Surface | `surface.page`, `surface.base`, `surface.raised`, `surface.subtle`, `surface.disabled`, `surface.overlay` | Page canvas, cards/tables/forms, popover/drawer/modal elevation, quiet grouping, inactive controls, and overlays. These are roles independent of specific component implementation. |
| Border | `border.subtle`, `border.default`, `border.strong`, `border.focus` | Separators, default control/container boundaries, emphasized boundaries, and keyboard focus. Decorative separators need not have the same contrast requirement as an input boundary. |
| Feedback | `feedback.success|warning|error|info.foreground`, `.background`, `.border` | Status text/icon, alert/badge surface, and optional stroke. Keep all feedback roles independent from brand. Pair meaning with text/icon/shape. |
| Interaction | `interaction.primary.hover`, `.active`, `.focus`, `.disabled`; analogous component overrides only where needed | State changes for pointer/keyboard controls. Component-specific tokens may adjust these values, but must preserve semantic role, visible focus, and adequate contrast. |

## 6. HEX and contrast matrix

Ratios below use the WCAG relative-luminance formula for opaque sRGB HEX pairs, rounded to two decimals. These are static calculations, not browser tests. **WCAG 2.2 AA is PROPOSED** as the review target: 4.5:1 normal text, 3:1 large text, and 3:1 for non-text UI information/parts needed to identify a control or state. A decorative divider does not necessarily need 3:1; a boundary that communicates a control/state may. Disabled controls/text are excepted from specific WCAG contrast criteria, but the proposed values should still be reviewed for usability. No full conformance claim follows from these calculations.

| Proposed foreground / UI color | Pair background | Ratio | Intended use | Proposed target result |
| --- | --- | ---: | --- | --- |
| `#111827` text.primary | `#FFFFFF` surface.base | 17.74:1 | Primary body/headings | Meets 4.5:1 normal text. |
| `#4B5563` text.secondary | `#FFFFFF` surface.base | 7.56:1 | Labels/supporting text | Meets 4.5:1 normal text. |
| `#6B7280` text.muted | `#F9FAFB` surface.page | 4.63:1 | Metadata/helper text | Meets 4.5:1 narrowly; verify antialiasing/rendered states. |
| `#9CA3AF` text.disabled | `#F3F4F6` surface.disabled | 2.31:1 | Inactive control label only | Does not meet 4.5:1; contrast criterion exception for inactive controls may apply. Candidate usability review required. |
| `#DC2626` brand.primary | `#FFFFFF` surface.base | 4.83:1 | Brand link/action text and white-label primary button | Meets 4.5:1 normal text at this pairing. |
| `#DC2626` brand.primary / focus | `#F9FAFB` surface.page | 4.62:1 | Focus outline or selected indicator against page | Exceeds 3:1 non-text target; verify outline thickness/adjacent surfaces and occlusion. |
| `#B91C1C` brand hover / error foreground candidate | `#FFFFFF` surface.base | 6.47:1 | Hover primary action or error text where on white | Meets 4.5:1 normal text. Same HEX may serve distinct semantic roles; roles remain separate. |
| `#991B1B` brand.active | `#FFFFFF` surface.base | 8.31:1 | Active/pressed primary button with white label | Meets 4.5:1 normal text. |
| `#15803D` success foreground | `#F0FDF4` success background | 4.79:1 | Success badge/alert text and icon | Meets 4.5:1 normal text. |
| `#B45309` warning foreground | `#FFFBEB` warning background | 4.84:1 | Warning badge/alert text and icon | Meets 4.5:1 normal text. |
| `#B91C1C` error foreground | `#FEF2F2` error background | 5.91:1 | Error badge/alert text and icon | Meets 4.5:1 normal text. Error role remains separate from brand despite value reuse. |
| `#1D4ED8` info foreground | `#EFF6FF` info background | 6.16:1 | Informational badge/alert/link where appropriate | Meets 4.5:1 normal text. This does not approve a brand-blue role. |
| `#4B5563` neutral text | `#E7E7E7` neutral badge surface | 6.11:1 | Neutral status label | Meets 4.5:1 normal text. |
| `#6B7280` strong border/focus outline | `#FFFFFF` surface.base | 4.83:1 | Control boundary or focus indicator when used on white | Exceeds 3:1 non-text target. Avoid using this comparatively dark stroke for every decorative divider. |
| `#9CA3AF` default border | `#FFFFFF` surface.base | 2.54:1 | Candidate default control boundary | Fails 3:1 if boundary is needed to identify the control; do not use for that role under the proposed target. |
| `#D1D5DB` subtle border | `#FFFFFF` surface.base | 1.47:1 | Decorative card/divider separation only | Fails 3:1; insufficient alone for identifying a control boundary. |
| `#F3F4F6` subtle surface | `#FFFFFF` surface.base | 1.10:1 | Background grouping/alternate row | Below 3:1; use structure/spacing and text, not this fill alone, to convey state. |
| `#86EFAC` success border | `#F0FDF4` success background | 1.34:1 | Optional semantic border | Fails 3:1; avoid sole state cue. |
| `#FCD34D` warning border | `#FFFBEB` warning background | 1.39:1 | Optional semantic border | Fails 3:1; avoid sole state cue. |
| `#FCA5A5` error border | `#FEF2F2` error background | 1.74:1 | Optional semantic border | Fails 3:1; avoid sole state cue. |
| `#93C5FD` info border | `#EFF6FF` info background | 1.66:1 | Optional semantic border | Fails 3:1; avoid sole state cue. |

**Current shared-badge comparison (confirmed source values, not proposed targets):** `#22C55E` on `#F0FDF5` = 2.18:1; `#F97316` on `#FFF4ED` = 2.59:1; `#DC2626` on `#FEF2F2` = 4.41:1; `#2F6BFF` on `#EEF4FF` = 4.07:1. Under the proposed 4.5:1 normal-text target, all four current pairs are below threshold. The badge font is 10px (`status-badge.module.scss:8`), so the large-text exception would not apply. These figures identify risk; they do not authorize a CSS change or legacy migration.

## 7. UI/UX rationale and Ant Design ownership

### UI/UX rationale

- A light neutral page canvas makes white cards/forms/tables legible through surface hierarchy and lowers the amount of page-wide red tint. Keep the primary red for brand-led action/selection; error status must be determined by explicit error role and message/icon.
- Semantic foreground/background pairs make badge, alert, and inline feedback implementations consistent while leaving business-state mapping in each feature.
- Neutral text hierarchy separates primary values from supporting labels and disabled content. Do not use low-contrast gray for ordinary helper or placeholder text solely because it looks subdued.
- Separate subtle dividers from control boundaries: the former can be quiet; an input border that must identify the control needs a more visible stroke or another persistent cue under the proposed target.
- Hover and active states should change consistently and remain legible. A lighter brand red hover is a current exception; darkening is a proposal, not a runtime change.
- Focus is an explicit interaction role. Provide a visible keyboard focus indicator rather than relying on hover fill or browser-default suppression. Status meaning should not depend on color alone; use readable label and/or icon and preserve text feedback.
- Do not interpret a blue info token as `brand.secondary`. Only an official brand asset/spec can establish that role.

### Ant Design mapping recommendation

The installed package declaration is Ant Design `^5.20.6` (`package.json:36`). Official Ant Design v5 theme documentation describes `ConfigProvider` `theme.token`, component tokens, semantic color token families, and CSS-variable theming; it treats `colorPrimary`, `colorSuccess`, `colorWarning`, `colorError`, and `colorInfo` as distinct token roles. See [Ant Design Customize Theme](https://ant.design/docs/react/customize-theme/?locale=en-US). This is a design-system reference, not an automatic approval to configure these values now.

| Proposed HDS role | Ant Design token family to evaluate | Recommended owner |
| --- | --- | --- |
| `brand.primary` and its generated interaction scale | `colorPrimary`, `colorPrimaryHover`, `colorPrimaryActive`, `colorLink` | App-level `ConfigProvider` once exact roles/values are approved; avoid separately hard-coding divergent values in global SCSS. |
| `feedback.success` | `colorSuccess`, `colorSuccessBg`, `colorSuccessBorder`, text/hover/active tokens | App-level `ConfigProvider`; feature decides whether its domain state is success and supplies localized wording. |
| `feedback.warning` | `colorWarning`, `colorWarningBg`, `colorWarningBorder`, text/hover/active tokens | Same semantic source; no component should reinterpret warning as orange brand. |
| `feedback.error` | `colorError`, `colorErrorBg`, `colorErrorBorder`, text/hover/active/outline tokens | Separate from `colorPrimary`, even if a reviewed value happens to match. |
| `feedback.info` | `colorInfo`, `colorInfoBg`, `colorInfoBorder`, text/hover/active tokens | UI information role, not HDS brand blue. |
| `text.*` | `colorText`, `colorTextSecondary`, `colorTextTertiary`, `colorTextQuaternary` | App theme defaults; use component tokens only where AntD’s contract needs a role-specific adjustment. |
| `surface.*` | `colorBgBase`, `colorBgLayout`, `colorBgContainer`, `colorBgElevated`, disabled/background aliases | App-level surface hierarchy; `colorBgContainer` is already read by layouts, while component-local CSS surfaces need matching semantic CSS variables. |
| `border.*` | `colorBorder`, `colorBorderSecondary`, `colorSplit`, `colorFillSecondary` | App-level defaults; preserve distinction between necessary control outline and decorative split. |
| Interaction and component-specific refinements | relevant global state tokens plus `components.Button`, `Input`, `Select`, `Menu`, `Table`, `Alert`, `Modal`, `Drawer` tokens where supported | App provider owns cross-app semantics; a component token override belongs to the shared component owner and must be justified by an actual component contract. Avoid feature-specific `!important` overrides expanding into global truth. |
| CSS custom properties | namespaced semantic properties such as `--color-brand-primary`, `--color-feedback-error-text`, `--color-surface-page`, `--color-border-control`, `--color-focus-ring` | CSS variables serve SCSS/Emotion/plain CSS and scoped consumers. Define one reviewed value source and mirror/map it to AntD token config; do not allow CSS and ConfigProvider values to drift. |

**Ownership boundary:** Ant Design owns rendering defaults for its controls; the app provider owns adopted cross-app token mapping; shared HDS components own stable presentation contracts; features own their domain state interpretation and localized labels; feature styles may retain a reviewed exception only when its local responsibility is documented. `StatusBadge` remains a generic presentation primitive, not a business-state registry.

**Important integration limitation:** Ant Design notes that `ConfigProvider` context does not reach static `message.xxx`, `Modal.xxx`, and `notification.xxx` methods. HDS currently uses both static APIs and hook/context APIs. A future implementation must inspect the exact API invocation, use context-aware APIs where behavior permits, and provide equivalent CSS-variable/portal treatment for existing static methods. It must not assume a provider theme alone recolors every message, modal, drawer, or notification. This detail makes the existing Scheme Sync portal scopes material migration behavior.

## 8. Scheme Sync migration dependencies (not implementation scope)

Scheme Sync currently has two divergent representations:

1. `scheme-sync.tokens.ts` duplicates color/typography/spacing/radius in TypeScript but has no runtime import; it is not a live source of UI colors.
2. `scheme-sync.module.scss` owns the active palette in a Sass mixin. It emits `--scheme-sync-*` values and legacy aliases on the page root and on real portal classes for AntD popover/modal/drawer. The page, modal/drawer and import-related components consume these scoped variables.

The active palette includes blue primary/hover `#1D4ED8/#1E40AF`, red brand/hover `#DC2626/#B91C1C`, green publish/hover `#16A34A/#15803D`, text `#111827/#6B7280`, border `#E5E7EB`, page `#F9FAFB`, surface white, and success/error/warning pairs. There is no current info pair in the Scheme Sync palette. Blue primary is a module interaction color; source does not establish official secondary brand intent.

Before an eventual migration, the owning team must:

- Inventory every use of `scheme-sync-*` and the scoped aliases, including portals; establish which values are semantic feedback, primary action, publishing action, layout/surface, and module-specific emphasis.
- Decide whether Scheme Sync's blue primary and green publish button remain module-specific interaction semantics or map to shared brand/feedback roles. A green publish action may signal publication workflow rather than success feedback; do not change this based on hue alone.
- Preserve its modals/drawers/popovers' portal token reach and local responsive behavior.
- Compare source visual states and status meanings. Review button hover/focus, current publish/action mapping, alert treatments, filters and history tables.
- Retire duplicate TS/Sass definitions only after establishing whether the TS export/comment is intended as a fixture/export contract or removable dead code. Do not delete it during a color-token migration by assumption.
- Avoid bulk migration of legacy consumers and avoid runtime theme/dark-mode infrastructure.

## 9. Risks, limitations and visual-regression requirements

### Risks

- A global change to red, semantic fills or `colorBgContainer` can affect checkboxes, switches, date ranges, tabs, text links, rich-text editor error borders, alerts, notifications, forms, tables, navigation, modal/drawer portals and feature-specific controls.
- Existing global `!important` selectors and Emotion styles may override provider tokens or vice versa. The source declarations alone cannot establish computed CSS cascade for every route.
- Separating error from brand can change alerts and form validation styling. Notification type/background/icon mismatch is already present; correcting it could change user-visible behavior and should be reviewed independently.
- Replacing border values can affect density and visual grouping, while contrast-improving borders can look heavier. Compare actual table grids, form controls, card edges, drawer separators and disabled states.
- Scheme Sync locally redefines legacy aliases for every scoped page and portal. Removing or remapping them without portal-level parity can leave menus, drawers, notifications or modals with app-root values or missing declarations.
- Changing status pair values would alter shared StatusBadge appearance across features. A current ratio concern does not imply permission for bulk migration or a silent CSS change.
- No browser inspection, rendered-cascade review, color-vision simulation, contrast tool/browser audit, keyboard-only review, screen-reader review or authenticated runtime verification was performed.

### Visual-regression review required before implementation

- Main and Basic layout canvases, header, navigation, active/hover menu, collapsed sidebar, content cards and page transitions.
- Representative table headers/rows, hover/clickable rows, empty/loading/error states and pagers.
- Create/edit/view forms: normal, focus, validation error, disabled, read-only, placeholder, select/date-picker popup and checked/indeterminate checkbox/switch.
- Buttons: primary, default/outlined, text, hover, active, keyboard focus and disabled.
- Alerts, notification types (success/warning/error/info), StatusBadge six variants and localized labels.
- Modal, drawer, popover and confirmation portals, including Scheme Sync nested portal scopes.
- Small viewport and text zoom/reflow, with long translated messages and dense tables.

These are future validation requirements, not validation claimed by this report.

## 10. NEEDS-TEAM-DECISION and approval checklist

### NEEDS-TEAM-DECISION

- Identify/provide the official HD SAISON brand asset/spec and approve `brand.secondary`, or explicitly leave the role undefined.
- Approve or revise every candidate HEX and role assignment separately from the already-approved semantic framework.
- Approve whether neutral/semantic border pairs should use a neutral stroke instead of low-contrast semantic borders.
- Approve the palette/text/surface token names and whether old root CSS variables stay as temporary compatibility aliases; define deprecation ownership.
- Decide which Scheme Sync action roles (blue primary, red brand action, green publish) map to shared semantics versus retained module exceptions.
- Approve a WCAG version/level/threshold policy for DS-04. WCAG 2.2 AA is recommended here but remains **PROPOSED**.
- Decide if existing shared status badge value corrections are part of a later separately scoped visual change; this audit does not authorize them.

### Recommended approval checklist

- [ ] Semantic role definitions are approved independently of exact color values.
- [ ] The official brand asset has been checked before assigning any secondary brand HEX.
- [ ] Brand red remains `brand.primary`; error remains an independent role and all usages have been semantically classified.
- [ ] Light neutral page, surface elevation and text hierarchy are approved.
- [ ] Success/warning/error/info foreground-background pairs meet the approved text target; semantic icons/labels communicate state without color alone.
- [ ] Control boundaries and focus indicators meet the approved non-text target on every actual adjacent surface.
- [ ] Disabled and read-only text treatment is explicitly approved and not confused with ordinary muted copy.
- [ ] AntD global tokens, component tokens, CSS variables, Emotion rules and static/portal APIs have clear ownership and no duplicate sources of truth.
- [ ] Scheme Sync alias/portal dependency migration plan and scope are approved before that module is changed.
- [ ] A bounded migration list, owner, baseline screenshots and route/component visual-regression matrix are agreed before implementation.
- [ ] Accessibility validation scope is approved; no conformance statement is made before the required testing is complete.

## Validation performed

- Verified `AGENTS.md`, the requested Codex knowledge/rule paths, Design System pages and prior decision report exist and read the relevant portions. Did not read or modify `CLAUDE.md` or `.claude/`.
- Verified the Scheme Sync module documentation and current source paths; treated its older source snapshot as context rather than current proof.
- Traced current colors and consumers in root styles, Ant Design provider/overrides, shared button/status components, Main/Basic layouts, table/modal surfaces, feature alert/status, navigation calls and Scheme Sync page/module styles.
- Searched for `schemeSyncTokens` imports/usages and active Sass mixin consumers.
- Calculated each matrix ratio with the WCAG relative-luminance formula for the stated opaque sRGB pairs.
- Confirmed the destination directory is under the existing local-only ignore policy. No `.gitignore` change was made.
- No application tests, typecheck, lint, build, browser, screenshot, contrast-tool, device, permission, backend or accessibility validation was run.

