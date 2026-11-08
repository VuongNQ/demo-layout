# HD SAISON Brand Color Alignment Audit

## Metadata

- **Author:** Vuowng
- **Date:** 2026-11-06
- **Branch:** `improve/vuongnq/2729_sync_CL`
- **Revision:** `23cb43ec5ce6fccf429a97452ebf0ca4817d4df2`
- **Type:** Read-only source audit and alignment proposal; no application or
  design-system implementation changes.

## Scope and methodology

Compared the five user-provided official brand HEX values against the current
HDS Admin source and current Codex/design-system decisions. Inspected root CSS
custom properties, `ConfigProvider`, global Ant Design overrides, shared
buttons/status badges/form controls/navigation/table status components,
representative feature-owned token sets and gradient artwork. Searched `src/`
for color literals, custom-property definitions, chart/data-visualization files,
and chart-library references. Verified cited findings against current files;
the dated project-context snapshot and previous color audits were used only as
leads.

Read `AGENTS.md`, `.codex/README.md`, relevant rules (`00-general`,
`04-state-management`, `07-component`, `08-refactoring`, `10-styling`),
`.codex/knowledge/ARCHITECTURE.md`, `docs/README.md`, and current
`docs/design-system/color.md`. The available `.agents/skills/` list has no
design-system/color audit skill; module, code-review, and implementation skills
do not fit this repository-wide read-only audit.

At the initial status check, three Scheme Sync source files were already
modified. Their diffs were inspected and contain no color/token edits; this
audit did not modify them. The report is under `docs/`, which is intentionally
local-only per `docs/README.md` and `.gitignore`. No ignore rules were changed.

## Official brand palette supplied for this audit

| Brand name | HEX | Exact value found in current `src/` |
| --- | --- | --- |
| Orange (Clementine) | `#EE7117` | Yes; simulation progress gradient. |
| Red (Persian Red) | `#DB1F26` | Yes; simulation progress gradient and medal SVG. |
| Blue (Cobalt) | `#0E377B` | No exact match found. |
| Orange-Yellow (Sun) | `#F4A60E` | No exact match found. |
| Yellow (Gold) | `#F7D107` | Yes; simulation progress gradient and medal SVG. |

The reference mentions lighter ramps but supplies no HEX values for them.
Current pale fills and interaction colors are not treated as official brand
shades or inferred from these five values.

## Existing Codex decisions and decision conflict

`.codex/rules/10-styling.md:213-255` says to preserve production colors, map one
logical semantic definition consistently to Ant Design and CSS custom
properties, and avoid inventing interaction colors. It also reflects the
current color reference. `docs/design-system/color.md:186-224` records the
selective HDS Admin targets: `brand.primary #DB1F26`, `brand.secondary #2B479E`,
`brand.orange #EE7117`, and `brand.yellow #FFD200`; the last two brand roles
are distinct from semantic feedback. The root source still uses
`--primary-color: #dc2626` (`src/index.scss:7`).

The supplied palette agrees with the recorded primary red and orange, but
differs from the recorded secondary blue (`#2B479E` vs official `#0E377B`) and
yellow (`#FFD200` vs official `#F7D107`). It also adds a separate Sun
orange-yellow (`#F4A60E`). This is a documentation/policy reconciliation
question, not a reason to silently replace existing values. See
**NEEDS-TEAM-DECISION** below. The user-provided five values are treated as the
comparison authority for this report; their external brand governance was not
independently verified.

## Current token and color inventory

| Owner | Current source evidence | Findings |
| --- | --- | --- |
| Root CSS variables | `src/index.scss:6-31` | Flat aliases mix roles and usage: primary `#DC2626`, text `rgba(0,0,0,.88)`, gray `#5D5D5D`/`#959595`, success `#10BA08`, blush background `#FFF6F6`, yellow `#FFFE4E`, low-opacity border `rgba(5,5,5,.06)`, neutral surfaces, feedback fills, green `#22C55E`, orange `#F97316`, blue `#2F6BFF`. `--yellow-color` and `--success-color` had no consumer matches in the `src/` search beyond definitions/feature aliases. |
| Ant Design theme | `src/providers/index.tsx:24-28,42-48`; `package.json:36` | Package declares `^5.20.6`; installed version checked locally is `5.20.6`. `ConfigProvider` sets locale and `fontFamily` only; no global color or component color tokens are configured. Ant Design defaults therefore coexist with application overrides. |
| Global Ant Design overrides | `src/custom-ant.scss:19-62,68-72,106-129,148-160,178-220` | The primary alias colors checkboxes, switch, date-range endpoints, active tabs, and rich-text error borders. Disabled inputs are forced to `rgba(0,0,0,.88)`. Notifications default to a green-tinted background regardless of non-error notification type; the error class changes to pink. This conflates/overrides some component semantics independently of provider tokens. |
| Shared component styling | `src/components/status-badge/status-badge.module.scss:13-36`; `src/components/button.tsx:19-59` | StatusBadge has its own semantic variants but directly reads root aliases. The shared button wraps Ant Design and reads primary/white aliases; hover computes a lighter color with `polished`, rather than a named approved shade. |
| Feature-owned CSS custom properties | `src/modules/products/configuration/scheme-sync/scheme-sync.module.scss:1-18,36-49` | Scheme Sync defines a full local palette and then local legacy aliases, including separate blue primary, red action/error, green publish, and semantic warning/success. It scopes these across its page and Ant Design portals. This is intentionally separate/legacy feature behavior pending DS-02. |
| Parallel Scheme Sync token object | `src/modules/products/configuration/scheme-sync/scheme-sync.tokens.ts:1-20` | Duplicates the Sass values in TypeScript; a source search found no runtime import of `schemeSyncTokens` (only a comment reference). Do not remove it without confirming whether it has a fixture/export contract. |
| SCSS variables / semantic CSS vars | `src/` scan; `src/modules/users/customer/access-account/view/general.tsx:124-140`; `src/modules/products/attractive-offer/components/attractive-offer.styles.ts:9-15` | No shared semantic Sass color-variable set or app-owned canonical `--color-*` semantic CSS custom-property system was found. Isolated `--color-alias-*` reads have fallbacks but no in-repo definition was located. Repeated feature-local `--order-*` palettes and Scheme Sync scoped vars add separate owners. Sass `$` declarations found were sizing/layout helpers, not color tokens. |
| Hardcoded colors | Examples: `src/components/upload/index.tsx:189-216,363-380`; `src/modules/system/administrative-unit/components/administrative-unit-status-modal.tsx:212-271`; `src/components/simulation/components/products/ProductLayout/styles.module.scss:126-160` | Direct values also occur in uploads, previews, administrative-unit states, tables, and feature UI. Current values include Ant Design defaults such as `#1677FF`, neutrals such as `#101828`/`#667085`, legacy primary red, and local success/error colors. They are not all brand colors and are not one interchangeable palette. |

## Component-level color usage

| Area | Current usage and evidence | Brand-alignment implication |
| --- | --- | --- |
| Shared buttons | `src/components/button.tsx:19-59` uses `--primary-color` with white text for primary, and the same color for outlined buttons; hover lightens it. | Current solid primary is `#DC2626`; current normal white-label contrast is 4.83:1. `#DB1F26` is the approved target in current DS docs, but implementation is unchanged. Do not use a brand hue as error by default. |
| Navigation and shell | `src/components/menus.tsx:360-374,476-489,518-520` uses primary red over `--background-color` for selected items; `src/layouts/main.layout.tsx:63-67,132-163` mixes `colorBgContainer`, literal white, root layout gray, and the root border. `src/layouts/basic.layout.tsx:44-82` uses the root content background. | Current selected state is red on a pale pink surface, not an official shade ramp. Shell surface responsibilities are split between Ant Design and CSS aliases. |
| Forms and controls | `src/custom-ant.scss:19-62,68-72,148-160,216-220`; `src/components/input.tsx:184-225`; `src/components/select.tsx:222-265` | Checkbox/switch/date-range/error overrides use primary red; field labels use text or separator aliases with focus-dependent opacity/background. Other form controls continue to use Ant Design defaults. A root color swap would affect multiple state and error surfaces. |
| Tables and status indicators | `StatusBadge` maps success/warning/error+accent/info/neutral to root aliases (`status-badge.module.scss:13-36`). Legacy table status helpers map business states to green/orange/primary/blue and render white text on filled chips (`src/components/table-card-status.tsx:12-40,131-182`; similar `src/components/customer/table-card-status.tsx:9-35` and `src/components/contract-card/table-card-status.tsx:9-42`). | Business mappings are distributed and status meaning is not owned by the shared brand tokens. Keep labels and status mappings intact during any future token migration. Orange is used for many in-progress/pending states; it must not become `brand.orange` merely by matching hue. Red is also used for failures/rejections, while shared badge accent and error currently share a style. |
| Notifications | `src/custom-ant.scss:106-129` gives every notification a success-colored fill except errors. | Notification background is not selected by explicit `success`, `warning`, or `info` mappings in this override; visual semantic inconsistency is confirmed. |
| Charts / data visualization | No chart/graph source file or chart-library reference was found in `src/` or `package.json` during the scan. `ProductProgress` is a 6px progress indicator, not a chart (`ProductLayout/index.tsx:72-105`; styles `:117-160`). | The process bar uses brand-like gradient stops, including official Gold/Orange/Red and a non-official-in-this-input blue `#2C489F`; it has no text label over the gradient. A medal SVG also uses Gold/Red and `#264BA5` (`src/assets/images/simulation/menus/medal.svg:22-30`). These bounded decorative/feature uses do not establish chart colors or a shared brand scale. |

## WCAG contrast analysis

Ratios were calculated from opaque sRGB HEX pairs using WCAG relative
luminance, then rounded to two decimals. WCAG 2.2 AA sets 4.5:1 for normal
text, 3:1 for large text, and 3:1 for meaningful non-text component/state
visuals; the applicable criterion depends on how the color is rendered and
whether that visual is needed to understand/use the interface. See [WCAG 2.2
SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) and [SC
1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast). These static pair
calculations do not prove rendered contrast or application conformance.

### Supplied palette screened against white

These are generic screening pairs, not claims that the application currently
uses each brand color as text or as a button fill. White label and brand-colored
text have the same ratio against the same solid color.

| Brand color | Contrast on white | Assessment for normal text | `#111827` on the brand color | Potential dark-label pair |
| --- | ---: | --- | ---: | --- |
| Red `#DB1F26` | 4.96:1 | Meets 4.5:1 | 3.58:1 | Fails 4.5:1. |
| Orange `#EE7117` | 3.00:1 | Fails 4.5:1 | 5.92:1 | Meets 4.5:1. |
| Cobalt `#0E377B` | 11.34:1 | Meets 4.5:1 | 1.56:1 | Fails 4.5:1; white is the higher-contrast text color. |
| Sun `#F4A60E` | 2.04:1 | Fails 4.5:1 | 8.71:1 | Meets 4.5:1. |
| Gold `#F7D107` | 1.49:1 | Fails 4.5:1 | 11.89:1 | Meets 4.5:1. |

Do not apply white small text to Orange, Sun, or Gold solid fills based on brand
identity alone. Dark text on those three values is a viable contrast candidate
for those exact opaque pairs, not an approved application component design.
The Orange/white result is approximately 3:1 and below 4.5:1; do not rely on
rounding to make it a normal-text pass. No shade values were inferred.

### Existing source-supported pairs

| Foreground / background in current source | Ratio | Assessment |
| --- | ---: | --- |
| StatusBadge success `#22C55E` / `#F0FDF5` | 2.18:1 | Below 4.5:1; badge text is 1rem (10px with the root 62.5% font size), not large text. |
| StatusBadge warning `#F97316` / `#FFF4ED` | 2.59:1 | Below 4.5:1; the orange is semantic warning presentation, not the brand orange token. |
| StatusBadge error/accent `#DC2626` / `#FEF2F2` | 4.41:1 | Below 4.5:1 at full precision. Error/accent currently share this style. |
| StatusBadge info `#2F6BFF` / `#EEF4FF` | 4.07:1 | Below 4.5:1. |
| StatusBadge neutral `#5D5D5D` / `#E7E7E7` | 5.32:1 | Meets 4.5:1 for this pair. |
| Shared primary button white / `#DC2626` | 4.83:1 | Meets 4.5:1 for this pair. |
| Selected menu text `#DC2626` / `#FFF6F6` | 4.55:1 | Meets 4.5:1 for this pair. |
| Legacy table-chip white / green `#22C55E` | 2.28:1 | Below 4.5:1; actual helper renders white text on the green fill. |
| Legacy table-chip white / orange `#F97316` | 2.80:1 | Below 4.5:1; actual helper renders white text on the orange fill. |
| Legacy table-chip white / blue `#2F6BFF` | 4.49877:1 | Slightly below 4.5:1 at full precision. |
| Legacy table-chip white / red `#DC2626` | 4.83:1 | Meets 4.5:1 for this pair. |

The shared `--border-color: rgba(5,5,5,.06)` composites to approximately
`#F0F0F0` over white (about 1.14:1). This is a conditional non-text risk if
used as the only visible boundary for an interactive control; the inspected
shell use is a divider, for which the control-boundary criterion cannot be
assumed. `--separator-color: #B0B0B0` is about 2.17:1 against white and is also
used for input/filter labels in some states; actual opacity, background, and
component context need browser review.

## Confirmed mismatches and recommendations

### Confirmed

- Runtime primary alias `#DC2626` differs from both supplied official red
  `#DB1F26` and the current DS `brand.primary` target `#DB1F26`. Both red values
  separately have adequate white-label contrast; they contrast with each other
  at only 1.03:1, so the migration is subtle but changes the approved target.
- Current DS secondary blue `#2B479E` differs from supplied official Cobalt
  `#0E377B`; neither is the root's current info blue `#2F6BFF` nor Scheme Sync's
  local primary `#1D4ED8`.
- Current DS `brand.yellow #FFD200` differs from supplied official Gold
  `#F7D107`; no role for supplied Sun `#F4A60E` is recorded in the active
  semantic target table.
- Root hue aliases `--orange-color`, `--blue-color`, and `--yellow-color` are
  not a role-safe brand system: orange and blue are consumed by status helpers,
  while yellow has no consumer match in the `src/` scan. `--success-color` is
  also a separate, unused root value from the consumed `--green-color`.
- `ConfigProvider`, root aliases, global selector overrides, feature-scoped
  variables, direct literals, and Ant Design defaults all own color behavior;
  visual ownership is duplicated and partial.
- Current StatusBadge success, warning, error/accent, and info text/fill pairs
  all fall below 4.5:1 under the static combinations above. Several legacy
  solid status chips also use white text over green/orange/blue fills below
  4.5:1. These are source-supported contrast risks, not a full WCAG finding for
  each rendered state.

### Recommendations

- Treat identity colors (`brand.primary`, `brand.secondary`, `brand.orange`,
  yellow/Sun brand primitives) as separate from `feedback.success|warning|error|info`,
  text, surface, border, and interaction roles. Do not map brand red to error,
  orange to warning, or yellow to warning.
- Reconcile the two differing active brand targets before implementing Cobalt,
  Sun, or Gold in HDS Admin. Use only the five supplied solid values as brand
  references; do not generate hover, active, tint, or shade tokens from them.
- In a separately scoped implementation, preserve legacy aliases as
  compatibility bridges while mapping approved semantic roles once to
  `ConfigProvider` and CSS consumers. Split shared error styling from primary
  before changing the root primary alias; preserve `StatusBadge` variant
  meanings, table status mappings, Scheme Sync actions, and its Ant Design
  portal scope.
- Address the measured text/fill pairs with their component owners and visual
  review. Do not solve a contrast issue by changing status labels or business
  state meaning. Keep the WCAG 2.2 AA target already adopted for new and
  substantially changed UI.
- Keep gradients feature-local unless separately approved. The progress bar
  currently uses official brand stops plus a different blue; no global gradient
  or button treatment is implied by its presence.

## Risk assessment and production impact

**Audit risk: MODERATE; token implementation risk: HIGH.** Root aliases drive
shared navigation, controls, uploaders, badges, legacy status chips, and form
states. Repointing a hue alias could change many states whose business mappings
currently depend on it. A global `ConfigProvider` palette would also meet
Ant Design defaults that are not currently explicitly overridden, while
existing selector specificity may continue to win. Scheme Sync is isolated by
scoped aliases, including overlays/portals, and should not be included in an
app-wide replacement without its separate DS-02 mapping. Existing production
behavior should remain unchanged until a bounded, reviewed implementation is
approved.

## Proposed minimal alignment plan (no implementation in this audit)

1. Resolve the official palette versus current HDS Admin target differences for
   secondary blue and yellow, and establish whether Sun and Gold are separate
   brand primitives. Record their owners and non-mappings.
2. Keep a single semantic token model and choose the physical source of truth
   before implementation. The current color reference leaves that file choice
   open. Map approved roles to Ant Design tokens and CSS custom properties
   without creating independently maintained copies.
3. Preserve current UI through a compatibility phase. Repoint only
   `brand.primary` consumers after separately mapping semantic error states;
   leave warning/info/status mappings and Scheme Sync local roles intact.
4. Validate representative button, selected menu, checkbox/switch, date picker,
   input/error, notifications, status badges/table chips, upload, and portal
   states. Check all foreground/surface and focus/boundary pairs in rendered UI.
5. Migrate feature/local literals only when in approved scope and their visual
   ownership/meaning is known. Do not bulk-rewrite literal colors by hue and do
   not infer missing brand ramps.

## NEEDS-TEAM-DECISION

- Does the supplied official Cobalt `#0E377B` supersede the current HDS Admin
  `brand.secondary #2B479E` target? Keep it distinct from `feedback.info`.
- Does supplied Gold `#F7D107` supersede the current HDS Admin
  `brand.yellow #FFD200` target, and should Sun `#F4A60E` have a separate named
  brand role? Keep both separate from semantic warning and interaction states.
- Which physical file owns canonical runtime semantic values before mapping
  them to Ant Design and CSS custom properties?
- What is the approved focus color and component-specific hover/active/selected
  treatment? The active color reference says the brand red is not automatically
  the focus value and the supplied palette gives no shade ramps.
- How should existing `StatusBadge` accent/error presentation be handled in
  its already-deferred DS-05 work, and which Scheme Sync actions remain local
  under DS-02? Do not make those decisions in a brand-color migration.
- Should shared link/action/navigation colors be defined as semantic roles or
  remain with component/feature owners? Existing color guidance leaves these
  roles unresolved.

## Unverified assumptions and validation limitations

- The exact values are treated as official because they were supplied as such
  for this audit; no external brand asset/spec was fetched or authenticated.
- No lighter shade HEX values were provided, so no ramp or shade comparison was
  made. Existing pale fills and current hover calculations are not official
  brand values by inference.
- The broad source scan is textual, not a complete runtime CSS cascade map.
  Ant Design defaults, specificity, portal behavior, opacity compositing,
  browser color management, and rendered component states were not visually
  verified.
- Contrast calculations assume opaque HEX pairs unless the explicit
  `rgba(5,5,5,.06)` border compositing case is named. Dynamic `lighten()` hover,
  gradients/intermediate stops, antialiasing, focus geometry, and responsive
  states need browser verification.
- No chart package or source file was found by the scan; this does not rule out
  a visualization drawn through a generic SVG/canvas or supplied by remote
  content.
- No tests, build, browser, authenticated API, or interactive accessibility
  checks were run. No application files, theme configuration, styles,
  dependencies, Codex/Claude profile, or `.gitignore` were changed.
