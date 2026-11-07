# Color System

This page separates approved brand primitives, semantic UI targets, current implementation, and unresolved decisions. The active brand decision is dated 2026-11-06 in the final addendum below; earlier DS-03 analyses are retained and explicitly marked historical. Approved values are not evidence that the application currently renders them.

## HISTORICAL / SUPERSEDED: DS-03 target before 2026-11-06

**HISTORICAL DECISION — retained as recorded before selective internal palette adoption.** The following matrix and contrast review preserve the previously approved `#DC2626` brand and focus values. The brand target is superseded by the 2026-11-06 addendum; the focus target is under review there. Other semantic targets remain approved as restated in the addendum.

**APPROVED DECISION:** DS-03 approves semantic roles and the values below. Keep brand and error independent. `brand.primary` remains the Admin red. The light neutral page background is preferred. Dark mode is not required. Preserve current production colors and legacy aliases until a separately scoped implementation changes them.

| Semantic role | Approved HEX | Intended use |
| --- | --- | --- |
| `brand.primary` | `#DC2626` | Admin brand identity and primary action emphasis where the component semantics call for it; not an error signal by default. |
| `brand.secondary` | **NEEDS-TEAM-DECISION** | No official HD SAISON secondary brand HEX is approved here. |
| `text.primary` | `#111827` | Main content, headings, and high-priority labels. |
| `text.secondary` | `#4B5563` | Secondary copy and labels. |
| `text.muted` | `#6B7280` | Lower-emphasis readable text; do not use for disabled state without considering disabled semantics. |
| `surface.page` | `#F9FAFB` | Light neutral page canvas. |
| `surface.base` | `#FFFFFF` | Default component surface. |
| `surface.raised` | `#FFFFFF` | Raised cards, popovers, drawers, and similar elevated surfaces. |
| `surface.subtle` | `#F3F4F6` | Subtle grouping or secondary surface. |
| `feedback.success.foreground / background` | `#15803D / #F0FDF4` | Success messages and status presentation. |
| `feedback.warning.foreground / background` | `#B45309 / #FFFBEB` | Warning messages and status presentation. |
| `feedback.error.foreground / background` | `#B91C1C / #FEF2F2` | Errors, failures, and negative outcomes. Keep independent of `brand.primary`. |
| `feedback.info.foreground / background` | `#1D4ED8 / #EFF6FF` | Informational messages and status presentation. |
| `border.subtle / default` | `#D1D5DB` | Quiet separation where the boundary is not the sole cue identifying an interactive control. |
| `border.control / strong` | `#6B7280` | Stronger control boundary where needed to identify the component. |
| `border.focus` | `#DC2626` | Focus indicator color, with a visible indicator that remains distinguishable against its adjacent surface. |

The dotted names above are logical role identifiers. **APPROVED DECISION:** maintain one logical semantic color definition and map it consistently to Ant Design tokens and CSS custom properties. **NEEDS-TEAM-DECISION:** which physical source file owns the canonical runtime values. Preserve existing CSS aliases at their current values during ordinary maintenance; do not silently repoint them or bulk-migrate consumers.

### Contrast review of approved pairs

Ratios below use approved HEX values in representative foreground/background combinations; the examples do not assign a color to every component. The **WCAG 2.2 AA target is APPROVED** for new and substantially changed UI: 4.5:1 for normal text, 3:1 for large text, and 3:1 for meaningful non-text component boundaries and states. Passing an individual pair does not establish full accessibility or application conformance. The calculation uses foreground/background colors only; it does not verify actual rendered size, opacity, adjacent colors, focus geometry, or browser output. See [WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) and [SC 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast).

| Foreground / background | Ratio | Intended use | Target assessment |
| --- | ---: | --- | --- |
| `text.primary #111827` / `surface.page #F9FAFB` | 16.98:1 | Normal text on page canvas | Meets 4.5:1 text target. |
| `text.primary #111827` / `surface.base #FFFFFF` | 17.74:1 | Normal text on component surface | Meets 4.5:1 text target. |
| `text.primary #111827` / `surface.subtle #F3F4F6` | 16.12:1 | Normal text on subtle surface | Meets 4.5:1 text target. |
| `text.secondary #4B5563` / `surface.page #F9FAFB` | 7.23:1 | Normal secondary text on page | Meets 4.5:1 text target. |
| `text.secondary #4B5563` / `surface.base #FFFFFF` | 7.56:1 | Normal secondary text on base | Meets 4.5:1 text target. |
| `text.muted #6B7280` / `surface.page #F9FAFB` | 4.63:1 | Normal muted text on page | Meets 4.5:1 text target. |
| `text.muted #6B7280` / `surface.base #FFFFFF` | 4.83:1 | Normal muted text on base | Meets 4.5:1 text target. |
| `brand.primary #DC2626` / `surface.page #F9FAFB` | 4.62:1 | Brand-colored text or icon on page | Meets 4.5:1 text target for this pair. |
| `brand.primary #DC2626` / `surface.base #FFFFFF` | 4.83:1 | Brand-colored text or icon on base | Meets 4.5:1 text target for this pair. |
| `#FFFFFF` / `brand.primary #DC2626` | 4.83:1 | Proposed white label on primary red fill | Meets 4.5:1 text target for this pair. |
| `feedback.success.foreground #15803D` / `feedback.success.background #F0FDF4` | 4.79:1 | Success text/icon on success fill | Meets 4.5:1 text target for this pair. |
| `feedback.warning.foreground #B45309` / `feedback.warning.background #FFFBEB` | 4.84:1 | Warning text/icon on warning fill | Meets 4.5:1 text target for this pair. |
| `feedback.error.foreground #B91C1C` / `feedback.error.background #FEF2F2` | 5.91:1 | Error text/icon on error fill | Meets 4.5:1 text target for this pair. |
| `feedback.info.foreground #1D4ED8` / `feedback.info.background #EFF6FF` | 6.16:1 | Info text/icon on info fill | Meets 4.5:1 text target for this pair. |
| `border.subtle/default #D1D5DB` / `surface.base #FFFFFF` | 1.47:1 | Decorative or redundant separation | Does not meet 3:1; insufficient as the sole visible boundary of a control. |
| `border.subtle/default #D1D5DB` / `surface.page #F9FAFB` | 1.41:1 | Decorative or redundant separation | Does not meet 3:1; insufficient as the sole visible boundary of a control. |
| `border.control/strong #6B7280` / `surface.base #FFFFFF` | 4.83:1 | Visible control boundary | Meets 3:1 non-text target for this pair. |
| `border.control/strong #6B7280` / `surface.page #F9FAFB` | 4.63:1 | Visible control boundary | Meets 3:1 non-text target for this pair. |
| `border.focus #DC2626` / `surface.base #FFFFFF` | 4.83:1 | Focus indicator against base surface | Meets 3:1 non-text target for this pair. |
| `border.focus #DC2626` / `surface.page #F9FAFB` | 4.62:1 | Focus indicator against page surface | Meets 3:1 non-text target for this pair. |

Default/subtle borders are not sufficient as the sole visible boundary for controls requiring 3:1 contrast. This does not require applying dark borders to every Ant Design input: select component tokens or a justified component-level treatment according to the actual control, adjacent surface, and design. Focus must remain visibly indicated. Disabled and read-only states must retain their distinct meaning; their exact colors are not approved here.

## Current implementation evidence

**CONFIRMED CURRENT IMPLEMENTATION:** `src/index.scss:6-31` defines root CSS custom properties. The names and values below are observed source, not the approved semantic mapping.

| Current properties and values | Evidence |
| --- | --- |
| `--primary-color: #dc2626`; `--black-color: #000`; `--text-color: rgba(0, 0, 0, 0.88)`; `--white-color: #fff`; `--gray-color: #5d5d5d`; `--gray-light-color: #959595`; `--gray-soft-color: #f3f3f3` | `src/index.scss:7-13` |
| `--success-color: #10ba08`; `--background-color: #fff6f6`; `--pagination-next-prev-color: #f6f6f6`; `--yellow-color: #fffe4e`; `--border-color: rgba(5, 5, 5, 0.06)` | `src/index.scss:14-18` |
| `--bg-bottom-navigation: #f7f7f7`; `--bg-add-form: #f6f6f6`; `--bg-content-layout: #f4f4f4`; `--light-white-color: #e7e7e7`; `--black-50-opacity: rgba(0, 0, 0, 0.5)`; `--separator-color: #b0b0b0` | `src/index.scss:19-24` |
| `--soft-pink-color: #fef2f2`; `--soft-green-color: #f0fdf5`; `--soft-orange-color: #fff4ed`; `--soft-blue-color: #eef4ff`; `--green-color: #22c55e`; `--orange-color: #f97316`; `--blue-color: #2f6bff` | `src/index.scss:25-31` |

The shared `StatusBadge` currently maps success to green/soft-green, warning to orange/soft-orange, error and accent to primary/soft-pink, info to blue/soft-blue, and neutral to gray/light-white (`src/components/status-badge/status-badge.module.scss:13-36`). The root also defines a separate `--success-color`; source does not establish that these aliases are interchangeable. **LEGACY-COMPATIBILITY:** preserve current aliases, component CSS, and consumers until separately scoped migration work.

`src/providers/index.tsx:24-28,42-48` currently passes locale and the `fontFamily` token to `ConfigProvider`, not color tokens. The manifest declares Ant Design `^5.20.6` (`package.json:36`), and the installed package is 5.20.6. This confirms the available major version for this checkout; future upgrades still require token support verification.

Other current ownership evidence: `src/custom-ant.scss` contains component color/state overrides; layouts read AntD `colorBgContainer` while also consuming CSS variables; shared and feature components own scoped styling; Scheme Sync actively scopes a separate Sass palette to the page and AntD portals. See the [DS-03 audit](../audits/design-system/2026-11-05/ds-03-semantic-color-token-audit.md) for the source inventory, consumer examples, and migration risks. These are implementation facts, not authorization to change them.

## HISTORICAL / SUPERSEDED: pre-adoption internal project reference review

**HISTORICAL ANALYSIS — preserved from the pre-adoption review.** The matrix below records the classification before the selective-adoption decision. For the current role/value decisions, use the dated addendum at the end of this page. The supplied palette came from another internal HD SAISON project described as using Tailwind CSS v4; its source repository, asset package, owner, and company-wide brand authority were not supplied or independently verified. This adoption remains HDS Admin-specific and does not establish company-wide brand authority.

### Current vs approved vs internal-reference matrix

Classification labels use **COMPATIBLE WITH APPROVED TARGET**, **USEFUL NEW BRAND REFERENCE**, **CONFLICTS WITH APPROVED TARGET**, **FEATURE/DOMAIN-SPECIFIC**, **NOT APPLICABLE TO HDS ADMIN COLOR-TOKEN ADOPTION**, and **REQUIRES FURTHER VERIFICATION**. A value may be compatible by exact HEX while still unsuitable for a claimed role or contrast requirement.

| Area | Internal-project reference values | Current HDS Admin evidence | Approved DS-03 target | Classification and disposition |
| --- | --- | --- | --- | --- |
| Primary red | Brand red `#DB1F26`; red-strong `#B8161C`; red-soft `#FDF4F4`; red-tint `#FBE9E9`; flame `#EE4D2D` | `--primary-color: #DC2626`; current shared error/accent uses the same primary variable and `#FEF2F2` fill (`src/index.scss:7,25`; `status-badge.module.scss:23-27`) | `brand.primary #DC2626`; error remains independent (`feedback.error #B91C1C / #FEF2F2`) | `#DB1F26` **CONFLICTS** if substituted for Admin primary. Red family and flame are **USEFUL NEW BRAND REFERENCES** only; none is approved for Admin primary, error, hover, or surfaces. Preserve current legacy alias. |
| Other brand accents | Yellow `#FFD200`; orange `#EE7117`; amber `#FE9A00`; orange-soft `#FEF8F3` | A hue-only `--yellow-color: #FFFE4E` and `--orange-color: #F97316` exist (`src/index.scss:17,30`) | No yellow/orange brand roles or values approved; approved warning background is `#FFFBEB` | **USEFUL NEW BRAND REFERENCES**, pending ownership and use approval. The orange-soft fill is not the approved warning fill. Do not map orange/amber to warning feedback or yellow to a new global role by hue alone. |
| Navy and blue roles | Navy `#2B479E`; navy-strong `#1F3680`; navy-soft `#E8EFFB`; gradient navy `#2C489F` | `--blue-color: #2F6BFF`; Scheme Sync has UI primary/info `#1D4ED8` and page-scoped tokens (`src/index.scss:31`; `scheme-sync.module.scss:2-18`) | `brand.secondary` **NEEDS-TEAM-DECISION**; info `#1D4ED8 / #EFF6FF` | Navy values are a **USEFUL NEW BRAND REFERENCE** for a possible secondary brand family, not proof of official brand blue. Mapping them to info or replacing the approved info pair **CONFLICTS** with DS-03. Keep brand and info independent. |
| Gradient stops and treatments | Stops: yellow `#F7D107`, orange `#EE7117`, red `#DB1F26`, navy `#2C489F`; reference also reports gradients for buttons, lines, and text | Feature-local process bar uses those exact stops (`src/components/simulation/components/products/ProductLayout/styles.module.scss:154-160`); Product Labels preview has related gradients (`src/modules/products/configuration/product-labels/shared/MobilePreviewFrame.tsx:353-359,379-390,408-423`). Shared primary button remains solid `#DC2626` and lightens red on hover (`src/components/button.tsx:19-32`). | Solid `brand.primary #DC2626`; no global gradient approved | Existing gradients are **FEATURE/DOMAIN-SPECIFIC**. Matching stops are a bounded reference, not a shared brand primitive or button replacement. Check text contrast along every stop and transition. |
| Text neutrals | Ink `#1A1A1A`; muted `#6B7280`; subtle `#9CA3AF` | `--text-color: rgba(0,0,0,.88)`; gray `#5D5D5D`; light gray `#959595` (`src/index.scss:9,11-12`) | Primary `#111827`; secondary `#4B5563`; muted `#6B7280` | `muted #6B7280` is **COMPATIBLE** by exact value. Ink and subtle **CONFLICT** with the approved text-role values; subtle is also too low for normal text on white/page in the calculated pairs. |
| Neutral surfaces | Surface `#FFFFFF`; surface-muted `#F9FAFB`; canvas `#F4F5F7` | White surfaces plus current `--bg-content-layout: #F4F4F4`, form `#F6F6F6`, blush `#FFF6F6` (`src/index.scss:15,19-22`) | Base/raised `#FFFFFF`; page `#F9FAFB`; subtle `#F3F4F6` | White and surface-muted are **COMPATIBLE** with approved base/page. Canvas **CONFLICTS** if used as the shared page role; it resembles the current legacy content canvas, which remains unchanged pending separate implementation scope. |
| Neutral borders | Line `#E5E7EB`; line-strong `#D1D5DB` | Root border `rgba(5,5,5,.06)`, separator `#B0B0B0`; Scheme Sync border `#E5E7EB` (`src/index.scss:18,24`; `scheme-sync.module.scss:10`) | Border subtle/default `#D1D5DB`; control/strong `#6B7280`; focus `#DC2626` | `line-strong #D1D5DB` is **COMPATIBLE by value only** with subtle/default; its “strong” label is misleading for controls because it is below 3:1 on white/page. `#E5E7EB` is a **FEATURE/DECORATIVE SEPARATOR** candidate and also below 3:1 as a sole control boundary. |
| Feedback success | Foreground `#21914B`; soft `#ECFDF3`; line `#A7E3BE` | Shared StatusBadge uses `#22C55E / #F0FDF5`; root also has `--success-color: #10BA08`; Scheme Sync uses `#15803D / #F0FDF4` (`status-badge.module.scss:13-16`; `scheme-sync.module.scss:17-18`) | `#15803D / #F0FDF4` | Reference foreground/background **CONFLICT** with approved pair; candidate foreground pair is below 4.5:1. The line is **NOT SUFFICIENT** as a sole boundary. Preserve existing variations. |
| Feedback warning | Foreground `#C2410C`; soft `#FFFBEB`; line `#FDE68A` | Shared badge uses `#F97316 / #FFF4ED`; Scheme Sync uses `#B45309 / #FFFBEB` (`status-badge.module.scss:18-21`; `scheme-sync.module.scss:15-16`) | `#B45309 / #FFFBEB` | Background is **COMPATIBLE** by exact value; foreground **CONFLICTS** with approved value. Candidate pair clears text contrast, but that alone does not approve it. The pale line is insufficient as a sole boundary. |
| Feedback error/danger | Danger `#DB1F26`; danger-soft `#FDF4F4` | Shared badge uses brand red / `#FEF2F2`; Scheme Sync token records `#DC2626 / #FEF2F2` (`status-badge.module.scss:23-27`; `scheme-sync.module.scss:13-14`) | Error `#B91C1C / #FEF2F2`, separate from brand | Both reference values **CONFLICT** with approved error values. Its `danger` alias equals the reference brand red, illustrating why HDS must not infer error semantics from brand hue or copy this alias relationship. |
| Feedback info | Foreground `#2B479E`; soft `#E8EFFB` | Shared badge uses `#2F6BFF / #EEF4FF`; Scheme Sync uses `#1D4ED8 / #EFF6FF` (`status-badge.module.scss:29-32`; `scheme-sync.module.scss:2,8`) | Info `#1D4ED8 / #EFF6FF`; navy not assumed to be info | Reference pair **CONFLICTS** with the approved info values if mapped as HDS info. It is a **USEFUL BRAND REFERENCE** only when assigned brand meaning by an explicit decision. |
| Link, action, navigation | Link `#155DFC`; action `#184693`; navigation ink `#314158` | Root/provider do not declare one cross-app mapping for these roles; some controls use AntD defaults and others local CSS (`src/providers/index.tsx:24-48`; `src/custom-ant.scss`) | No exact values approved for these roles | **REQUIRES FURTHER VERIFICATION** of actual use and semantics. Do not equate link with info, action with brand primary, or navigation ink with a universal text role. |
| Enterprise / household segments | Segment color names were mentioned, but no values or mappings were supplied | No matching cross-domain segment palette was established in this review | No universal segment-color role approved | **FEATURE/DOMAIN-SPECIFIC**; values are **NOT PROVIDED** and semantics require domain ownership and non-color labels. Do not add to global tokens. |
| Font | Be Vietnam Pro | Root/body and AntD provider use Inter (`src/index.scss:3-4,32,49-55`; `src/providers/index.tsx:24-28`). Scheme Sync currently applies a local Be Vietnam Pro stack (`scheme-sync.module.scss:19,52-59`) | Preserve DS-01 direction: Inter as cross-app default, current feature-local exceptions retained | Global adoption **CONFLICTS** with current DS-01 direction and requires a separate **NEEDS-TEAM-DECISION**. The existing Scheme Sync font is a feature-local implementation; it does not approve global adoption or establish font download/rendering. |
| Radius, global cursor, focus, shadows, animations | Control/panel radius `0.625rem`; global pointer cursor; navy `:focus-visible` outline; popover shadow and fade/pop animations | HDS has component/feature-owned radii, local pointer cursors and local focus styles; root removes outline on anchors for active/hover (`src/index.scss:102-105`); Scheme Sync has local focus shadows and popover shadow (`scheme-sync.module.scss:73-80`) | Color roles and focus hue are approved; cross-app geometry/motion values are outside this color decision | Radius and animation are **NOT APPLICABLE TO HDS ADMIN COLOR-TOKEN ADOPTION**; evaluate under separate DS decisions. A global pointer rule is **NOT RECOMMENDED**; use pointer only for interactive elements. Navy focus color **CONFLICTS WITH APPROVED TARGET** `border.focus #DC2626`; focus treatment geometry and rendered visibility still need verification. |

### Contrast review of internal-reference candidates

Ratios use the opaque HEX values shown and the WCAG relative-luminance formula. WCAG 2.2 AA is the approved target for new and substantially changed UI: 4.5:1 normal text, 3:1 large text, and 3:1 for meaningful non-text boundaries and states. This is a pair calculation only, not an accessibility or conformance audit.

| Candidate foreground / background | Ratio | Intended use considered | Assessment against approved target |
| --- | ---: | --- | --- |
| Reference ink `#1A1A1A` / page `#F9FAFB` | 16.65:1 | Normal text | Passes text contrast, but does not match approved primary text value. |
| Reference ink `#1A1A1A` / white `#FFFFFF` | 17.40:1 | Normal text | Passes text contrast; still conflicts with approved primary text value. |
| Reference muted `#6B7280` / page `#F9FAFB` | 4.63:1 | Normal muted text | Passes and exactly matches approved muted value. |
| Reference subtle `#9CA3AF` / white `#FFFFFF` | 2.54:1 | Normal text | Fails 4.5:1; do not use for normal text. |
| Reference subtle `#9CA3AF` / page `#F9FAFB` | 2.43:1 | Normal text | Fails 4.5:1; do not use for normal text. |
| Reference subtle `#9CA3AF` / canvas `#F4F5F7` | 2.33:1 | Normal text | Fails 4.5:1. |
| Approved white label `#FFFFFF` / Admin red `#DC2626` | 4.83:1 | Primary action label | Passes this text pair. |
| Reference white label `#FFFFFF` / red `#DB1F26` | 4.96:1 | Candidate primary-action label | Passes this pair, but replacing Admin red is not approved. The two reds contrast only 1.03:1 against each other. |
| Reference red `#DB1F26` / red-soft `#FDF4F4` | 4.59:1 | Candidate red text on tint | Passes this pair; role/value still conflicts with the approved HDS mapping. |
| Reference red-strong `#B8161C` / white label `#FFFFFF` | 6.63:1 | Candidate filled-control label | Passes this pair; no hover/active value is approved. |
| Reference success `#21914B` / success-soft `#ECFDF3` | 3.82:1 | Success text | Fails 4.5:1 normal-text target. Approved pair `#15803D / #F0FDF4` is 4.79:1. |
| Reference warning `#C2410C` / warning-soft `#FFFBEB` | 4.99:1 | Warning text | Passes this pair; target uses approved `#B45309`, whose pair is 4.84:1. |
| Reference danger `#DB1F26` / danger-soft `#FDF4F4` | 4.59:1 | Error text if treated as such | Passes text pair; semantic alias conflicts with HDS brand/error independence. Approved error pair is 5.91:1. |
| Reference info navy `#2B479E` / navy-soft `#E8EFFB` | 7.27:1 | Brand-colored text or info text | Passes contrast, but does not make the pair an approved HDS info palette. Approved info pair is 6.16:1. |
| Internal line `#E5E7EB` / white `#FFFFFF` | 1.24:1 | Separator | Fails 3:1 as a sole control boundary. |
| Internal line-strong `#D1D5DB` / white `#FFFFFF` | 1.47:1 | Claimed strong boundary | Fails 3:1 as a sole control boundary despite exact approved subtle/default border value. |
| Approved control border `#6B7280` / white `#FFFFFF` | 4.83:1 | Required visible control boundary | Passes 3:1. |
| Internal success line `#A7E3BE` / white `#FFFFFF` | 1.46:1 | Semantic border | Fails 3:1 as a sole boundary. |
| Internal warning line `#FDE68A` / white `#FFFFFF` | 1.25:1 | Semantic border | Fails 3:1 as a sole boundary. |
| Reference navy focus `#2B479E` / white `#FFFFFF` | 8.41:1 | Focus color pair only | Passes color contrast; conflicts with approved focus hue. Focus geometry/area is not evaluated. |
| Approved focus `#DC2626` / white `#FFFFFF` | 4.83:1 | Focus color pair only | Passes color contrast; geometry/area is not evaluated. |
| Gradient white label `#FFFFFF` / yellow stop `#F7D107` | 1.49:1 | Normal text across gradient | Fails 4.5:1 and 3:1. |
| Gradient white label `#FFFFFF` / orange stop `#EE7117` | 3.00:1 | Normal text across gradient | Fails 4.5:1 normal-text target (and is marginally below 3:1 at full precision). |
| Gradient white label `#FFFFFF` / red stop `#DB1F26` | 4.96:1 | Normal text across gradient | Passes this stop only. |
| Gradient white label `#FFFFFF` / navy stop `#2C489F` | 8.29:1 | Normal text across gradient | Passes this stop only. |

The complete candidate matrix and additional pair interpretations are in the [DS-03 internal-brand adoption review](../reports/2026-11-06/ds-03-internal-brand-token-adoption-review.md). Contrast for segment colors cannot be calculated because the reference supplied no segment HEX values. Gradient text must be checked continuously across the rendered gradient, including interpolation and antialiasing; the stop calculations alone are not sufficient.

### HISTORICAL / SUPERSEDED adoption guidance and boundaries

- **Preserve the approved DS-03 matrix above.** No supplied reference value replaces an approved HDS value in this documentation update.
- Keep `brand.secondary` **NEEDS-TEAM-DECISION**. The navy family is only an internal-project candidate until official brand authority or a specific HDS approval is established. Never silently map navy to `feedback.info`.
- Keep `brand.primary #DC2626` and `feedback.error #B91C1C / #FEF2F2` semantically independent. Do not import the other project's shared red/danger value as HDS error or change current CSS aliases.
- Retain the approved `surface.page #F9FAFB`; document the internal canvas `#F4F5F7` as a conflicting alternative and preserve current HDS layout values as **LEGACY-COMPATIBILITY** until separately changed.
- Preserve DS-01's Inter cross-app direction and current feature-local exceptions. Global Be Vietnam Pro adoption requires a separate decision; the existing Scheme Sync local font declaration remains feature-owned.
- Preserve existing feature-owned gradients for product/process and mobile-preview decoration. The supplied stop set matches the process-bar gradient in current source, but that source use does not establish a company-wide brand role. Any new shared gradient or button variant requires separate approval; do not replace solid primary buttons or promote a global gradient. Ensure every text/state pair meets the target along every gradient stop.
- Keep segment palettes domain-owned. Do not adopt global pointer cursors, shared shadows, radii, or animations from the reference as part of color token work.
- For eventual DS-02 Scheme Sync work, map actual current actions and tokens by semantics, preserve portal scope for modal/drawer/popover styles, and obtain explicit mapping decisions before any alias or font changes. This document does not change Scheme Sync or its action mapping.

See the linked adoption review for the Ant Design 5.20.6 type/API assessment, complete current/approved/reference matrix, source-backed risks, and a phased implementation plan.

## Mapping and ownership guidance

**ADOPTED TARGET:** Ant Design 5-first for new and substantially changed UI, subject to confirming the installed version and the specific token/component API. Use AntD for supported global and component rendering semantics. Preserve justified component-level overrides where a token cannot express the required treatment.

| Logical role | Ant Design v5 mapping point | CSS custom-property mapping point | Ownership guidance |
| --- | --- | --- | --- |
| `brand.primary` | `colorPrimary`; review `colorLink` separately so links do not inherit brand semantics unintentionally | `--color-brand-primary` | App-level semantic role; maintain approved red. Component owners decide whether a control is a primary action. |
| `text.primary`, `.secondary`, `.muted` | `colorText`, `colorTextSecondary`, `colorTextTertiary` where supported | `--color-text-primary`, `--color-text-secondary`, `--color-text-muted` | App semantic roles; verify token support and disabled/read-only component behavior. |
| `surface.page`, `.base`, `.raised`, `.subtle` | `colorBgLayout`, `colorBgContainer`, `colorBgElevated`; use component tokens where elevation differs | `--color-surface-page`, `--color-surface-base`, `--color-surface-raised`, `--color-surface-subtle` | App roles mapped to AntD; component-specific surfaces may override with documented reason. |
| Feedback foreground/background | `colorSuccessText`/`colorSuccessBg`, `colorWarningText`/`colorWarningBg`, `colorErrorText`/`colorErrorBg`, `colorInfoText`/`colorInfoBg`; validate exact API support and component mappings | One property per role, e.g. `--color-feedback-success-foreground` and `--color-feedback-success-background`; repeat for warning, error, and info | Semantic message/status role; feature owns business meaning and localized label. |
| `border.subtle/default`, `border.control/strong` | `colorBorderSecondary`, `colorBorder`; use input/select component tokens where needed | `--color-border-subtle`, `--color-border-control` | AntD owns control boundary defaults; a component override must satisfy the actual boundary contrast need. |
| `border.focus` | Review `controlOutline` and component focus tokens; do not assume an outline token accepts the exact solid value without checking behavior | `--color-border-focus` | Preserve a visible focus treatment. Specific focus geometry and component mapping require rendered verification. |

These are mapping points, not a committed runtime wiring specification. Ant Design token names and behavior are supported by the [official theme customization reference](https://ant.design/docs/react/customize-theme/?locale=en-US); the installed package remains the implementation contract. **NEEDS-TEAM-DECISION:** physical source-of-truth file and migration sequence. One logical semantic definition must not become duplicate independent values in ConfigProvider, CSS, Emotion, or feature Sass. Existing aliases remain at their current values as **LEGACY-COMPATIBILITY** until an explicit migration.

## HISTORICAL / SUPERSEDED: interaction and deferred decisions before 2026-11-06

**APPROVED DECISION:** preserve brand primary; allow justified component-level overrides; preserve visible keyboard focus and disabled/read-only semantics. Exact hover, active, selected, disabled, and component-specific state HEX values are not approved. Do not infer them from neighboring colors or generate new tokens without approval.

**DEFERRED:**

- Official `brand.secondary` HEX: **NEEDS-TEAM-DECISION**.
- Scheme Sync action-role mapping: DS-02 scope. Do not remap its blue primary, red action, or green publish treatment here.
- `StatusBadge` accent visual redesign: DS-05 scope; current styling remains compatible.
- Component-specific hover, active, selected, and disabled values, plus feedback border implementation details.
- Physical location and rollout plan for the single logical definition.

No dark mode or bulk legacy migration is approved. A future palette may assign different values to the same semantic roles without redefining those roles.

## Accessibility and limits

**APPROVED DECISION:** WCAG 2.2 AA is the target for new and substantially changed UI. Review text/background contrast, meaningful non-text boundaries and states, visible keyboard focus, status meaning beyond color, disabled/read-only semantics, error identification and feedback, meaningful icon names, and readable responsive text.

This target does not establish existing application conformance. The matrix evaluates only listed opaque color pairs. **NOT VERIFIED:** rendered contrast after alpha, opacity, gradients, overlays, browser cascade, component state, focus indicator area/shape, zoom/reflow, keyboard behavior, screen-reader output, and full consumer coverage. No browser or accessibility validation is claimed. See [Status System](status.md) for status meaning and feature-owned business mappings.

## APPROVED DECISION ADDENDUM — 2026-11-06: HD SAISON brand reference for HDS Admin

**CURRENT APPROVED BRAND REFERENCE:** The five values below are the approved HD SAISON brand primitives for HDS Admin. This addendum supersedes the previous HDS Admin `brand.secondary #2B479E` and `brand.yellow #FFD200` targets, preserves `brand.primary #DB1F26` and `brand.orange #EE7117`, and adds `brand.sun`. It does not define a complete semantic UI palette or describe runtime implementation. The earlier audit and adoption review remain historical evidence and are not rewritten.

### Approved brand primitives

| Role | Approved HEX | Decision / boundary |
| --- | --- | --- |
| `brand.primary` | `#DB1F26` | **APPROVED.** Red (Persian Red). Not automatically `feedback.error`. |
| `brand.secondary` | `#0E377B` | **APPROVED.** Blue (Cobalt); supersedes the previous documented `#2B479E` target. Not automatically `feedback.info`. |
| `brand.orange` | `#EE7117` | **APPROVED.** Orange (Clementine). Not automatically `feedback.warning`. |
| `brand.yellow` | `#F7D107` | **APPROVED.** Yellow (Gold); supersedes the previous documented `#FFD200` target. Not automatically a warning color. |
| `brand.sun` | `#F4A60E` | **APPROVED BRAND PRIMITIVE.** Orange-Yellow (Sun); has no assigned semantic UI role and is not automatically a warning color. |

These brand primitives identify the approved brand reference only. They do not
automatically define `feedback.error`, `feedback.warning`, `feedback.info`,
links, focus, hover, active, selected, or disabled colors. No shade ramps,
opacity variants, or interaction-state colors are approved or inferred here.

### Active semantic UI targets

| Role | Current approved value | Decision / usage |
| --- | --- | --- |
| `text.primary` | `#111827` | **APPROVED TARGET.** |
| `text.secondary` | `#4B5563` | **APPROVED TARGET.** |
| `text.muted` | `#6B7280` | **APPROVED TARGET.** |
| `surface.page` | `#F9FAFB` | **APPROVED TARGET.** |
| `surface.base` / `surface.raised` | `#FFFFFF` | **APPROVED TARGET.** |
| `surface.subtle` | `#F3F4F6` | **APPROVED TARGET.** |
| `feedback.success` foreground / background | `#15803D / #F0FDF4` | **APPROVED TARGET.** |
| `feedback.warning` foreground / background | `#B45309 / #FFFBEB` | **APPROVED TARGET.** |
| `feedback.error` foreground / background | `#B91C1C / #FEF2F2` | **APPROVED TARGET.** Keep independent from all brand reds and `brand.primary`. |
| `feedback.info` foreground / background | `#1D4ED8 / #EFF6FF` | **APPROVED TARGET.** Cobalt `brand.secondary` is not an info replacement. |
| `border.subtle` / `border.default` | `#D1D5DB` | **APPROVED TARGET.** Not sufficient as the sole visible boundary for controls requiring 3:1 contrast. |
| `border.control` / `border.strong` | `#6B7280` | **APPROVED TARGET.** Use where the actual control boundary needs the contrast; do not force dark borders on every AntD input. |
| `border.focus` | Prior target `#DC2626` | **REQUIRES REVIEW.** The candidate `#DB1F26` is **NOT YET APPROVED** as a focus value. Do not infer focus color from the new brand-primary decision. |

### Additional brand primitives and non-mappings

Supplemental values previously recorded from the internal-project reference remain separate historical brand references: red-strong `#B8161C`, red-soft `#FDF4F4`, red-tint `#FBE9E9`, navy-strong `#1F3680`, navy-soft `#E8EFFB`, amber `#FE9A00`, orange-soft `#FEF8F3`, and flame `#EE4D2D`. They are not additional shade ramps approved by this decision. A reference primitive does **not** map to global error, warning, success, info, link, hover, active, selected, disabled, border, or focus states.

`link` `#155DFC`, `action` `#184693`, and navigation ink `#314158` remain **NEEDS-TEAM-DECISION**; their shared semantic roles are unresolved. Enterprise/household segment colors remain feature/domain-specific and need their domain-owned values and labels. Keep the supplied gradient stops feature-owned. Do not replace shared primary buttons with gradients.

### Current implementation and compatibility

**CONFIRMED CURRENT IMPLEMENTATION:** The root alias is still `--primary-color: #dc2626` in [`src/index.scss`](../../src/index.scss#L7), and the shared button and StatusBadge continue to consume existing aliases/styles. `src/providers/index.tsx` still configures only locale and Inter `fontFamily`; no color tokens have been wired. Thus the approved `brand.primary #DB1F26` is a design target, not the current production value. Preserve current aliases and all production styling until a separately scoped implementation task changes them. The approved StatusBadge `error` and `accent` targets, including the component-specific accent background and eKYC mappings, are documented in [Status System](status.md); they are not yet implemented and do not add global color tokens.

**ANT DESIGN 5.20.6 FOCUS CHECK:** Installed AntD `controlOutline` is computed as an alpha color from `colorPrimaryBg` over `colorBgContainer` (`node_modules/antd/es/theme/util/alias.js:70-78`). It does not directly represent a solid `border.focus` HEX. No implementation mapping is recommended by this documentation update. A future focus decision must review the supported component token, resulting opacity/contrast, indicator geometry, and rendered keyboard focus before mapping.

Ant Design 5-first remains the target. Do not assign blanket hover/active HEX values; preserve visible keyboard focus and the approved WCAG 2.2 AA target for new and substantially changed UI. Continue to preserve Inter per DS-01 and keep Scheme Sync action mapping in DS-02. Preserve the single logical role model and legacy aliases; the physical token source and implementation sequence remain undecided. Dark mode and bulk migration remain out of scope.

See the [selective palette adoption decision report](../reports/2026-11-06/ds-03-selective-palette-adoption-decision.md), the [historical pre-adoption review](../reports/2026-11-06/ds-03-internal-brand-token-adoption-review.md), and the [historical DS-03 source audit](../audits/design-system/2026-11-05/ds-03-semantic-color-token-audit.md).
