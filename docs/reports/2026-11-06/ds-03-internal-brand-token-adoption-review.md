# DS-03 Internal Brand Token Adoption Review

## 1. Metadata and scope

- **Author:** Vuowng
- **Date:** 2026-11-06 (Asia/Ho_Chi_Minh)
- **Branch:** `improve/vuongnq/2729_sync_CL`
- **Revision:** `5fc4be3fae39aaa5d26099804f440a1061a102ab`
- **Scope:** Documentation and compatibility analysis only. Update the shared Design System color reference and create this report. No application or runtime changes.
- **Task risk:** **SAFE** for documentation; any token implementation or migration described below requires a separate approved scope.

The worktree was clean at the start of this task. The requested Codex guidance, Design System pages, previous DS-03 audit, and approved DS-03 report exist. `CLAUDE.md` and `.claude/` were not read or modified. The supplied internal-project reference did not include a source repository, asset, owner, commit, or company-wide brand approval record, so its provenance beyond the user-provided values remains unverified.

## 2. Decision summary

**Approved existing decisions preserved:** Admin `brand.primary` remains `#DC2626`; DS-03 semantic roles and the approved text, surface, feedback, and border values remain unchanged. Brand and error remain independent. WCAG 2.2 AA remains the target for new or substantially changed UI. Inter remains the cross-app typography direction; existing feature-local exceptions remain compatible. No dark mode, bulk migration, or Scheme Sync source/action remapping is authorized.

**New internal-project values:** all values are recorded as **REFERENCE ONLY / CANDIDATE** unless their exact value already matches an approved DS-03 role. The reference is not presumed to be an official company-wide brand guideline.

**No new values are approved by this review.** `brand.secondary` remains **NEEDS-TEAM-DECISION**. The internal navy is only a candidate pending authority verification or an explicit use decision.

## 3. Evidence and provenance

### HDS Admin source evidence

- Root aliases and current global font declarations: [`src/index.scss`](../../../src/index.scss#L3) (`:3-4,6-40,49-55,89-105`). Root `--primary-color` is `#DC2626`, current content canvas is `#F4F4F4`, and the global font is Inter. Anchor `a`, `a:active`, and `a:hover` outlines are suppressed at `:102-105`; this source fact does not by itself establish keyboard behavior for the application.
- Ant Design provider: [`src/providers/index.tsx`](../../../src/providers/index.tsx#L24) (`:24-48`) passes locale and only the `fontFamily` token; no HDS color token overrides are configured there.
- Ant Design version: [`package.json`](../../../package.json#L36) declares `^5.20.6`; the installed package is 5.20.6.
- Global/legacy overrides: [`src/custom-ant.scss`](../../../src/custom-ant.scss#L19) (`:19-62,68-72,106-129,178-220`) uses red for checkbox/switch/range/tab and editor error styling, retains disabled input overrides, and assigns notifications green by default with a special error fill.
- Shared badge ownership: [`status-badge.module.scss`](../../../src/components/status-badge/status-badge.module.scss#L13) (`:13-36`) owns existing visual pairs: success `#22C55E/#F0FDF5`, warning `#F97316/#FFF4ED`, error/accent `#DC2626/#FEF2F2`, info `#2F6BFF/#EEF4FF`, and neutral `#5D5D5D/#E7E7E7`. This report does not propose changing those current styles.
- Shared button behavior: [`src/components/button.tsx`](../../../src/components/button.tsx#L19) (`:19-59`) wraps AntD, uses the current CSS primary variable, and lightens red on hover. It remains a solid-color wrapper.
- Existing feature-owned gradient examples: [`ProductLayout/styles.module.scss`](../../../src/components/simulation/components/products/ProductLayout/styles.module.scss#L154) (`:154-160`) uses the supplied four gradient stops for a process bar; [`MobilePreviewFrame.tsx`](../../../src/modules/products/configuration/product-labels/shared/MobilePreviewFrame.tsx#L353) (`:353-359,379-390,408-423`) uses related gradients in product previews. These examples are feature/preview decoration, not shared button styling or evidence of global brand ownership.
- Scheme Sync current palette and exceptions: [`scheme-sync.module.scss`](../../../src/modules/products/configuration/scheme-sync/scheme-sync.module.scss#L1) (`:1-50,52-110`) actively scopes its own Sass variables and legacy aliases to the page and AntD popover/modal/drawer portals. It declares Be Vietnam Pro locally, red primary action, blue local primary, green publish action, and page surface `#F9FAFB`.
- Scheme Sync current button/focus examples: [`SchemeSyncPage/styles.module.scss`](../../../src/modules/products/configuration/scheme-sync/views/SchemeSyncPage/styles.module.scss#L1) (`:1-57`) keeps its red and green action mappings local and darkens selected button states. This does not settle DS-02 mapping.
- Scheme Sync TypeScript token object: [`scheme-sync.tokens.ts`](../../../src/modules/products/configuration/scheme-sync/scheme-sync.tokens.ts#L1) (`:1-41`) contains a parallel set including Be Vietnam Pro and local colors. Current Sass use is confirmed separately; source search found no runtime import of the TypeScript `schemeSyncTokens` object (a comment reference exists).
- Typography ownership: [`docs/design-system/typography.md`](../../design-system/typography.md) and the Codex decisions report establish Inter as the cross-app direction, while documenting Scheme Sync's feature-local Be Vietnam Pro declarations as existing exceptions. The external font's network loading/rendering is not verified.

### Internal-project reference provenance

The complete token list and behavior descriptions in the “Internal project” column below are user-supplied. No Tailwind configuration, compiled CSS, screenshot, brand asset, package version, or source project was available for direct inspection. Therefore token meanings, gradients, segment mappings, global focus/cursor rules, shadows, and animations are **reference statements, not independently confirmed source behavior**.

## 4. Current vs approved vs internal-reference matrix

Classifications use **COMPATIBLE WITH APPROVED TARGET**, **USEFUL NEW BRAND REFERENCE**, **CONFLICTS WITH APPROVED TARGET**, **FEATURE/DOMAIN-SPECIFIC**, **NOT APPLICABLE TO HDS ADMIN COLOR-TOKEN ADOPTION**, and **REQUIRES FURTHER VERIFICATION**. A value may match an approved HEX but still fail for a particular role or contrast need.

| Area | Current HDS Admin implementation | Approved DS-03 value/role | Supplied internal-project reference | Classification and proposed adoption |
| --- | --- | --- | --- | --- |
| Admin primary / other red | Root `--primary-color: #DC2626`; shared error also currently uses this alias | `brand.primary #DC2626`; `feedback.error #B91C1C / #FEF2F2`, independent | Brand red `#DB1F26`; strong `#B8161C`; soft `#FDF4F4`; tint `#FBE9E9`; flame `#EE4D2D`; feedback danger `#DB1F26` | `#DB1F26` **CONFLICTS** if used as HDS primary. Red accents are **USEFUL NEW BRAND REFERENCES**, not replacements. The danger alias reuses brand red, which **CONFLICTS** with HDS semantic independence. Keep existing CSS. |
| Yellow/orange brand family | `--yellow-color #FFFE4E`; `--orange-color #F97316` | No approved yellow/orange brand roles | Yellow `#FFD200`; orange `#EE7117`; amber `#FE9A00`; orange-soft `#FEF8F3` | **USEFUL NEW BRAND REFERENCES** only. Do not derive warning semantics or interaction states from the hue. |
| Navy/blue family | Root blue `#2F6BFF`; Scheme Sync local blue `#1D4ED8` | `brand.secondary` **NEEDS-TEAM-DECISION**; info `#1D4ED8 / #EFF6FF` | Navy `#2B479E`; navy-strong `#1F3680`; navy-soft `#E8EFFB`; gradient navy `#2C489F`; info `#2B479E / #E8EFFB` | Navy is a **USEFUL NEW BRAND REFERENCE** only. Mapping it to HDS info or approving it as official secondary brand **CONFLICTS** with current approved assignments absent an explicit decision. |
| Text neutrals | `--text-color rgba(0,0,0,.88)`, `--gray-color #5D5D5D`, `--gray-light-color #959595` | Primary `#111827`; secondary `#4B5563`; muted `#6B7280` | Ink `#1A1A1A`; muted `#6B7280`; subtle `#9CA3AF` | Muted is **COMPATIBLE** by exact value. Ink/subtle **CONFLICT** with approved text values. Subtle fails normal-text contrast on the listed light surfaces. |
| Surfaces | Root content `#F4F4F4`; form `#F6F6F6`; blush `#FFF6F6`; white used by shells/components | Page `#F9FAFB`; base/raised `#FFFFFF`; subtle `#F3F4F6` | White `#FFFFFF`; surface-muted `#F9FAFB`; canvas `#F4F5F7` | White and surface-muted are **COMPATIBLE**. Canvas **CONFLICTS** if made the shared page role, though it resembles the existing legacy canvas. Preserve current source behavior. |
| Borders | Root `rgba(5,5,5,.06)` and separator `#B0B0B0`; Scheme Sync `#E5E7EB` | Subtle/default `#D1D5DB`; control/strong `#6B7280`; focus `#DC2626` | Line `#E5E7EB`; line-strong `#D1D5DB` | `#D1D5DB` is **COMPATIBLE BY VALUE** with subtle/default, but its “strong” label is not sufficient for a sole control boundary. `#E5E7EB` is a decorative/feature separator candidate and fails 3:1 as a sole boundary. |
| Success | Badge `#22C55E/#F0FDF5`; root `--success-color #10BA08`; Scheme Sync `#15803D/#F0FDF4` | `#15803D/#F0FDF4` | `#21914B`; soft `#ECFDF3`; line `#A7E3BE` | Reference foreground/background **CONFLICT** with target. Pair is 3.82:1, below normal-text target. Preserve approved target and existing legacy variations. Line is not sufficient as the sole boundary. |
| Warning | Badge `#F97316/#FFF4ED`; Scheme Sync `#B45309/#FFFBEB` | `#B45309/#FFFBEB` | `#C2410C`; soft `#FFFBEB`; line `#FDE68A` | Background is **COMPATIBLE** by exact value; foreground differs. Candidate pair passes text contrast but is not approved. Pale line is not sufficient as the sole boundary. |
| Error/danger | Shared badge currently uses `#DC2626/#FEF2F2`; Scheme Sync same values | `#B91C1C/#FEF2F2`, independent from brand | Danger `#DB1F26`; danger-soft `#FDF4F4` | **CONFLICTS** by value and by aliased brand/danger treatment. Do not infer or adopt error semantics from a red token. |
| Info | Badge `#2F6BFF/#EEF4FF`; Scheme Sync local `#1D4ED8/#EFF6FF` | `#1D4ED8/#EFF6FF` | `#2B479E/#E8EFFB` | **CONFLICTS** if mapped as shared info. Strong contrast does not make brand navy an info role. |
| Link/action/navigation | AntD defaults and component-specific styles coexist; root provider has no shared color mapping | No exact link/action/navigation values approved | Link `#155DFC`; action `#184693`; navigation ink `#314158` | **REQUIRES FURTHER VERIFICATION** of intended semantics and consumers. Do not silently equate link with info, action with brand primary, or navigation ink with a universal text token. |
| Gradients | Product process bar already uses the exact four stops locally; Product Labels mobile preview has related gradients; shared primary button is solid red | Solid primary red retained; no global gradient approved | Stops `#F7D107`, `#EE7117`, `#DB1F26`, `#2C489F`; button/line/text gradients described | Existing gradients are **FEATURE/DOMAIN-SPECIFIC**. Matching stops are a bounded reference, not evidence of global brand ownership. Any new shared variant requires separate approval; never replace primary buttons by implication. |
| Segment palette | No universal enterprise/household color map established | No segment roles approved | Enterprise/household colors named without supplied values or semantic mappings | **FEATURE/DOMAIN-SPECIFIC**; values **NOT PROVIDED**, so no contrast calculation or global token proposal. Require labels/non-color cues. |
| Font | Inter root/body and provider; local Be Vietnam Pro in Scheme Sync Sass | Preserve DS-01: Inter cross-app direction and existing feature exceptions | Be Vietnam Pro | Global adoption **CONFLICTS** with current DS-01 direction and is **NEEDS-TEAM-DECISION**. Existing Scheme Sync local declaration remains feature-owned; no global font migration. |
| Radius and effects | Component and feature declarations; Scheme Sync has local 4/8/12px radii, shadow and motion | Not part of DS-03 color values | Control/panel radius `0.625rem`, popover shadow, fade/pop animations | **NOT APPLICABLE TO HDS ADMIN COLOR-TOKEN ADOPTION**; evaluate under separate layout/motion decisions. Do not import the external root/rem assumptions or globalize. |
| Cursor/focus behavior | Some controls have local pointer cursors/focus styles; root removes outlines on anchor active/hover. No single global HDS focus palette found in inspected code. | Focus role `#DC2626`; preserve visible keyboard focus | Global pointer cursor; global navy focus-visible outline | Global pointer is **NOT RECOMMENDED**; pointer should signal actual interactivity. Navy focus hue **CONFLICTS** with approved focus color. Focus geometry/visibility needs implementation review. |

## 5. Contrast calculations

Ratios below were calculated from opaque sRGB HEX pairs using WCAG relative luminance and rounded to two decimals unless greater precision is needed to clarify a threshold. The approved target is 4.5:1 for normal text, 3:1 for large text, and 3:1 for meaningful non-text boundaries/states. A passing pair does not establish conformance, rendered opacity, focus area/shape, gradient interpolation, or browser behavior.

| Foreground / background | Ratio | Intended use | Assessment |
| --- | ---: | --- | --- |
| Approved primary text `#111827` / page `#F9FAFB` | 16.98:1 | Normal text | Passes 4.5:1. |
| Internal ink `#1A1A1A` / page `#F9FAFB` | 16.65:1 | Candidate normal text | Passes contrast, but conflicts with approved primary text value. |
| Internal ink `#1A1A1A` / white `#FFFFFF` | 17.40:1 | Candidate normal text | Passes contrast, but conflicts with approved primary text value. |
| Approved muted `#6B7280` / page `#F9FAFB` | 4.63:1 | Normal muted text | Passes and exactly matches supplied muted token. |
| Internal subtle `#9CA3AF` / white `#FFFFFF` | 2.54:1 | Candidate normal text | Fails 4.5:1. |
| Internal subtle `#9CA3AF` / page `#F9FAFB` | 2.43:1 | Candidate normal text | Fails 4.5:1. |
| Approved muted `#6B7280` / reference canvas `#F4F5F7` | 4.43:1 | Normal text on candidate canvas | Fails 4.5:1; the same muted text passes on approved page `#F9FAFB` at 4.63:1. |
| Reference yellow `#FFD200` / white `#FFFFFF` | 1.45:1 | Colored text or meaningful icon | Fails 4.5:1 and 3:1. |
| Reference amber `#FE9A00` / white `#FFFFFF` | 2.13:1 | Colored text or meaningful icon | Fails 4.5:1 and 3:1. |
| Reference orange `#EE7117` / white `#FFFFFF` | 3.00:1 (2.9958:1) | Colored text or meaningful icon | Fails 4.5:1 and is below 3:1 at full precision. |
| Reference flame `#EE4D2D` / white `#FFFFFF` | 3.66:1 | Colored text or meaningful icon | Passes 3:1 non-text contrast but fails 4.5:1 normal-text target. |
| Approved primary text `#111827` / reference yellow `#FFD200` | 12.22:1 | Dark label on candidate yellow fill | Passes this pair; brand role/use still requires approval. |
| Approved control border `#6B7280` / white `#FFFFFF` | 4.83:1 | Sole visible control boundary | Passes 3:1. |
| Approved subtle border `#D1D5DB` / white `#FFFFFF` | 1.47:1 | Separator/control boundary | Fails 3:1 as sole control boundary. |
| Internal line `#E5E7EB` / white `#FFFFFF` | 1.24:1 | Separator/control boundary | Fails 3:1 as sole control boundary. |
| Internal line `#E5E7EB` / page `#F9FAFB` | 1.18:1 | Separator/control boundary | Fails 3:1 as sole control boundary. |
| Internal `line-strong #D1D5DB` / page `#F9FAFB` | 1.41:1 | Claimed strong control boundary | Fails 3:1 as sole boundary. |
| Approved border `#D1D5DB` / subtle surface `#F3F4F6` | 1.34:1 | Default border on subtle surface | Fails 3:1 as sole boundary. |
| Approved control `#6B7280` / subtle surface `#F3F4F6` | 4.39:1 | Required visible control boundary | Passes 3:1 for this pair. |
| Approved focus `#DC2626` / subtle surface `#F3F4F6` | 4.39:1 | Focus color pair | Passes 3:1 color-pair check; geometry/area not measured. |
| Internal success `#21914B` / `#ECFDF3` | 3.82:1 | Normal success text | Fails 4.5:1. Approved success pair is 4.79:1. |
| Internal success line `#A7E3BE` / success fill `#ECFDF3` | 1.39:1 | Feedback boundary | Fails 3:1 as sole boundary. |
| Internal warning `#C2410C` / `#FFFBEB` | 4.99:1 | Normal warning text | Passes; approved warning pair is 4.84:1. Value replacement remains unapproved. |
| Internal warning line `#FDE68A` / warning fill `#FFFBEB` | 1.20:1 | Feedback boundary | Fails 3:1 as sole boundary. |
| Internal danger `#DB1F26` / `#FDF4F4` | 4.59:1 | Normal error text if semantically assigned | Passes contrast, but conflicts with independent approved HDS error role/value. Approved pair is 5.91:1. |
| Internal info navy `#2B479E` / `#E8EFFB` | 7.27:1 | Normal text if assigned to info | Passes contrast, but conflicts with approved info role/value. Approved info pair is 6.16:1. |
| Approved brand white label `#FFFFFF` / Admin red `#DC2626` | 4.83:1 | Primary-action label | Passes this pair. |
| Candidate white label `#FFFFFF` / reference red `#DB1F26` | 4.96:1 | Candidate filled-action label | Passes this pair; red replacement is not approved. `#DC2626` and `#DB1F26` contrast only 1.03:1 against each other. |
| Candidate white label `#FFFFFF` / red-strong `#B8161C` | 6.63:1 | Candidate strong filled state | Passes this pair; no active/hover values are approved. |
| Candidate white label `#FFFFFF` / navy `#2B479E` | 8.41:1 | Candidate navy-filled action label | Passes; secondary-brand and action-role use remain unapproved. |
| Candidate white label `#FFFFFF` / action blue `#184693` | 8.99:1 | Candidate filled action | Passes this pair; shared action role remains unapproved. |
| Approved focus red `#DC2626` / white `#FFFFFF` | 4.83:1 | Focus color pair | Passes 3:1 color-pair check; geometry/area not measured. |
| Approved focus red `#DC2626` / page `#F9FAFB` | 4.62:1 | Focus color pair | Passes 3:1 color-pair check; geometry/area not measured. |
| Candidate navy `#2B479E` / white `#FFFFFF` | 8.41:1 | Focus color pair | Passes color-pair check; conflicts with approved focus hue and geometry/area is not verified. |
| Candidate navy `#2B479E` / page `#F9FAFB` | 8.05:1 | Focus color pair | Passes color-pair check; conflicts with approved focus hue and geometry/area is not verified. |
| Internal success line `#A7E3BE` / white `#FFFFFF` | 1.46:1 | Feedback boundary | Fails 3:1 as sole boundary. |
| Internal warning line `#FDE68A` / white `#FFFFFF` | 1.25:1 | Feedback boundary | Fails 3:1 as sole boundary. |
| White label `#FFFFFF` / gradient yellow stop `#F7D107` | 1.49:1 | Text across gradient | Fails 4.5:1 and 3:1. |
| White label `#FFFFFF` / gradient orange stop `#EE7117` | 3.00:1 (2.9958:1) | Normal text across gradient | Fails 4.5:1 and is below 3:1 at full precision. |
| White label `#FFFFFF` / gradient red stop `#DB1F26` | 4.96:1 | Text at this stop only | Passes 4.5:1 at this stop. |
| White label `#FFFFFF` / gradient navy stop `#2C489F` | 8.29:1 | Text at this stop only | Passes 4.5:1 at this stop. |
| Approved primary text `#111827` / gradient yellow stop `#F7D107` | 11.89:1 | Dark label at this stop | Passes at this stop only; the dark label does not pass over the navy stop. |
| Approved primary text `#111827` / gradient navy stop `#2C489F` | 2.14:1 | Dark label at this stop | Fails 4.5:1; no single black/white text color passes all supplied stops. |
| Reference orange `#EE7117` / orange-soft `#FEF8F3` | 2.84:1 | Candidate orange text on tint | Fails 4.5:1 and 3:1. |
| Link `#155DFC` / page `#F9FAFB` | 5.02:1 | Candidate link text | Passes this pair; role and hover/visited states remain undecided. |
| Navigation ink `#314158` / page `#F9FAFB` | 9.91:1 | Candidate navigation text | Passes this pair; no global navigation role is approved. |
| Action `#184693` / white `#FFFFFF` | 8.99:1 | Candidate action text/icon | Passes this pair; shared action role is not approved. |

No contrast values can be calculated for enterprise/household segment colors because those HEX values were not supplied. Focus indicator dimensions, color transitions, shadows, and browser-rendered gradients were not tested.

## 6. Ant Design 5 integration assessment

The installed repository version is Ant Design **5.20.6**. Its local `ThemeConfig` types accept `token?: Partial<AliasToken>` and `components` token overrides (`node_modules/antd/es/config-provider/context.d.ts:50-65`). The installed seed/map declarations include the relevant `colorPrimary`, `colorLink`, text tiers, `colorBorder`/`colorBorderSecondary`, `colorBgLayout`/`colorBgContainer`/`colorBgElevated`, feedback text/background tokens, and `controlOutline` (for example `node_modules/antd/es/theme/interface/seeds.d.ts:2-16`, `maps/colors.d.ts:1-84,174-237,253-381,453-460`, and `alias.d.ts:124-138`). This confirms API/type compatibility in the installed version, not visual correctness or complete component coverage.

Assessment:

- The approved and candidate semantic roles can be represented through AntD 5 global/map tokens plus component tokens where necessary. AntD token values and HDS CSS custom properties would need one logical role mapping; avoid keeping divergent hardcoded copies.
- AntD seed tokens such as `colorPrimary` can derive palettes. Exact approved text/background pairs may need explicit map-token overrides and component review rather than relying on generated shades. Do not use `colorPrimary` to make brand red mean error.
- `colorLink` is a distinct seed token, so the supplied `#155DFC` link value should not be automatically equated with info or primary.
- `controlOutline` exists as an alias token, but in AntD 5.20.6 its default is alpha-derived from primary/background (`node_modules/antd/es/theme/util/alias.js:70-78`). It is not automatically the approved solid `border.focus #DC2626`; review opacity, geometry, component focus behavior, and adjacent surfaces before mapping.
- Component tokens can supply justified local differences without redefining global semantics. Specific support must be checked per AntD component and this application’s custom SCSS/cascade.
- Tailwind v4 directives or `@theme` declarations are not a fit for the current SCSS/AntD application and must not be copied. Only the reference values/semantics are being documented.

## 7. Typography, gradients, and non-color reference items

- Preserve DS-01's Inter cross-app direction and retain the numerical scale's **CANDIDATE** status as documented in [`docs/design-system/typography.md`](../../design-system/typography.md). The internal Be Vietnam Pro value is a separate **NEEDS-TEAM-DECISION** for global adoption. HDS Scheme Sync already declares and applies it locally; do not treat that feature exception as cross-app approval, remove it, or expand it.
- Gradients are not global brand primitives by default. HDS already uses the supplied four stops in a feature-owned product process bar and related product-preview treatments; those usages remain local decoration. Any new shared variant requires separate approval. Existing HDS primary buttons stay solid red unless another explicit decision authorizes a component change. Since the yellow and orange stops fail contrast for white text, any candidate must define appropriate label treatment and check intermediate colors, borders, focus, and hover/disabled states.
- Segment colors are feature/domain-specific; values were not supplied. Request the domain owner’s mapping and ensure status/segment meaning is available in labels or another non-color cue.
- The `0.625rem` control/panel radius, popover shadow, fade/pop animations, and cursor behavior are outside DS-03. A global pointer cursor would misrepresent non-interactive surfaces; keep pointer styling on actual interactive controls. Review radius/motion under separate decisions and local component ownership.
- The reference’s navy focus outline is a candidate interaction style, but its hue conflicts with the approved HDS focus role. HDS currently has local focus declarations and a root anchor outline reset; neither the reference’s global behavior nor HDS-wide keyboard focus outcome was browser-verified.

## 8. Scheme Sync DS-02 dependencies

Scheme Sync is explicitly out of implementation scope. Its active Sass tokens and aliases are scoped to the page and AntD portal classes. Before any DS-02 migration, the owning team should:

1. Inventory active token use, including modal/drawer/popover portals, and distinguish its blue local primary, red action, green publish action, and feedback pairs by workflow semantics.
2. Decide separately whether the supplied brand-red/navy/gradient candidates have authority or apply to that feature; do not infer action roles from hue.
3. Preserve the existing red/green action behavior by default, the portal token reach, current focus and responsive behavior, and the local Be Vietnam Pro exception unless a DS-02 task explicitly changes them.
4. Map tokens and aliases by role, review existing direct aliases, and test representative page/action/error/success/focus/disabled/portal states before removing any compatibility value.
5. Keep the unused TypeScript token object and active Sass token definitions distinct until the DS-02 owner determines whether the former has a contract or should be reconciled; do not remove by assumption.

## 9. Risks and compatibility guarantees

- `#DB1F26` and approved `#DC2626` are extremely close (1.03:1 pair contrast); a silent substitution changes the approved primary while offering little visual separation.
- The supplied internal palette uses the same `#DB1F26` for brand red and danger, which cannot be copied as HDS semantic architecture.
- Reference success foreground `#21914B` fails normal-text contrast on its supplied fill; pale green/yellow borders fail 3:1 as sole control boundaries. `line-strong #D1D5DB` is not strong enough for that purpose either.
- Reference `canvas #F4F5F7` would conflict with approved neutral page `#F9FAFB`; HDS’s current `#F4F4F4` content canvas remains legacy implementation, not a reason to change the approved target.
- Global token changes could affect AntD components, shared wrappers, custom SCSS, Emotion styles, status badges, notification behavior, and third-party portal styling. The source audit records these overlapping owners.
- AntD’s accepted token types do not prove every component consumes an override or that runtime CSS wins over current selectors. Color-generation, interaction states, portal contexts, and accessible focus require rendered verification.

Compatibility guarantees in this documentation update: approved DS-03 values remain unchanged; current CSS variables and aliases remain unchanged; current font declarations and Scheme Sync exceptions remain unchanged; no AntD ConfigProvider behavior, component contract, feature/domain mapping, or production UI changes are authorized; no bulk migration or dark mode is proposed.

## 10. NEEDS-TEAM-DECISION checklist

- [ ] Verify whether the supplying project’s palette is governed by an official HD SAISON brand asset/spec and who owns that decision.
- [ ] If authority is confirmed, decide whether any navy/red/yellow/orange values may be used in HDS Admin; keep `brand.secondary` unresolved until explicit approval.
- [ ] Confirm that no reference color replaces any approved DS-03 value without a separate, explicit value change.
- [ ] Define whether link, action, navigation, and segment colors are shared semantic roles or feature/domain-owned styles.
- [ ] Decide separately whether Be Vietnam Pro has any HDS cross-app role; preserve the DS-01 Inter direction unless explicitly revised.
- [ ] If gradients are desired, approve one bounded component/feature use and its text, focus, hover, disabled, and motion treatment; do not authorize global replacement by implication.
- [ ] Keep Scheme Sync role/action mapping for DS-02 and StatusBadge accent treatment for DS-05.
- [ ] Keep the physical source-of-truth implementation decision and migration plan explicit before runtime work.

## 11. Safe phased implementation plan

1. **Authority and semantics:** verify reference ownership/assets; decide brand.secondary and whether candidate accent roles apply. Leave all existing values untouched meanwhile.
2. **Token contract design:** agree role names and one logical source-to-AntD/CSS mapping, including how map-token overrides and component exceptions work in installed AntD 5.20.6. No Tailwind directives.
3. **Bounded visual prototype:** only after explicit approval, prototype a new isolated component/feature use (for example an optional gradient variant) without replacing shared primary defaults. Evaluate all text/boundary/focus states and screen sizes.
4. **DS-02 Scheme Sync plan:** audit its source consumers and portal scope, then obtain a separate role/action mapping approval. Do not bulk-rewrite its Sass or TypeScript tokens.
5. **Scoped implementation and validation:** change only approved components/consumers, preserve legacy aliases, and validate visual regression, browser contrast, keyboard focus, disabled/read-only behavior, feedback states, portals, localization, and responsive rendering. No application conformance statement before the agreed audit.
6. **Legacy follow-up:** consider other modules only when separately scoped or substantially touched; preserve behavior by default and do not bulk-migrate.

## 12. Validation, unverified items, and files

### Validation performed

- Verified requested repository paths and current branch/revision.
- Read Codex guidance and relevant Design System pages/reports; did not read or modify `CLAUDE.md` or `.claude/`.
- Inspected current HDS root CSS, provider, AntD overrides, shared status/button styles, Scheme Sync Sass and TypeScript tokens, typography declarations, and installed AntD 5.20.6 type/alias definitions.
- Calculated listed opaque color-pair ratios with the WCAG relative-luminance formula. No browser, screenshot, contrast extension, keyboard, or accessibility validation was performed.
- Checked local Markdown links, source paths, and line anchors after writing; confirmed approved target values were preserved.
- Confirmed no application source, runtime styles, dependency, profile rule, or `.gitignore` change. No commit was made; `docs/` remains local-only under the existing policy.

### Unverified items

- The supplying project’s repository, exact Tailwind v4 configuration, assets, palette owner, and company-wide brand authority.
- Actual external-project rendered gradients, font loading, focus geometry, cursor coverage, motion behavior, segment meanings, and contrast.
- HDS browser-rendered contrast, keyboard focus visibility, font download/fallback, overlay/cascade results, and full route/component coverage.
- Any official authority for `brand.secondary`; segment HEX values; approved link/action/navigation values; global gradient use; global Be Vietnam Pro adoption; component-specific state values.

### Files modified by this task

- `docs/design-system/color.md`
- `docs/reports/2026-11-06/ds-03-internal-brand-token-adoption-review.md`

### Explicit files/scopes not modified

- Application source and styles (`src/**`), runtime theme/ConfigProvider, APIs, dependencies, component contracts, and production behavior.
- `docs/design-system/README.md`, `typography.md`, `components.md`, `status.md`, and all other unrelated documentation.
- `.codex/` rules/knowledge, `AGENTS.md`, `CLAUDE.md`, and `.claude/`.
- `.gitignore` and Git commit history.
