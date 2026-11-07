# Typography System

## Font-family ownership

**CONFIRMED CURRENT IMPLEMENTATION:** `src/index.scss:3-4` imports Noto Sans JP and Inter from Google Fonts. The root `--font-family` property and `body` declaration use Inter with a `sans-serif` fallback (`:32,49-55`). `src/providers/index.tsx:24-28` sets the Ant Design `fontFamily` token to the same family. These are separate CSS and provider ownership points in source; actual font download and browser fallback are **NOT VERIFIED**. The Noto Sans JP import is confirmed, but its use beyond import is not established here.

**ADOPTED TARGET:** New or substantially changed UI follows one cross-application type hierarchy and uses the current Inter stack by default through the global/provider ownership points. Feature-local font stacks require a documented compatibility or product exception. Preserve current font declarations and exceptions during ordinary maintenance.

## Current scale evidence and exceptions

Current source does not declare a unified cross-application role scale. These observations illustrate existing sizes, weights, and line heights; they do not themselves define standards.

| Source scope | Observed values | Evidence |
| --- | --- | --- |
| Root text | `font-size: 1.6rem`; `line-height: 1.6rem`; `html` sets `font-size: 62.5%` | `src/index.scss:43-51` |
| Root weight helpers | 500 medium, 600 semibold, 700 bold through `data-font-w` selectors | `src/index.scss:65-75` |
| Ant Design overrides | notification 1.4rem; form error 80%; tabs 12px | `src/custom-ant.scss:74-76,144-146,185-200` |
| Shared `StatusBadge` | 1rem, weight 600, line-height 1.6rem | `src/components/status-badge/status-badge.module.scss:1-10` |
| Scheme Sync local tokens | Be Vietnam Pro; token sizes 12/14/16/20/24px for label/body/section/modal/page-title roles | `src/modules/products/configuration/scheme-sync/scheme-sync.tokens.ts:1-41` |
| Customer access account detail | Inter; local design aliases; title 20px/600 with 32px line height among other role values | `src/modules/users/customer/access-account/view/general.tsx:123-156` |

Component-specific conventions and feature styles are **LEGACY-COMPATIBILITY** unless changed within a separately scoped task. The source examples above are not exhaustive. Use component-supported typography where present, and keep component-specific styling with its owner under [`.claude/rules/10-styling.md`](../../.claude/rules/10-styling.md) / [`.codex/rules/10-styling.md`](../../.codex/rules/10-styling.md).

## Candidate cross-application scale

**CANDIDATE — team review required; not approved values.** This compact scale uses size and line-height categories already observed in source, arranged into a proposed hierarchy. It is a target proposal, not a claim that all current pages follow it.

| Candidate role | Candidate size / line height | Candidate weight | Intended use |
| --- | --- | --- | --- |
| Caption | 12px / 16px | 400 or 500 | Supporting metadata, helper text |
| Body | 14px / 20px | 400 | Dense controls, table cells, standard supporting text |
| Body emphasis | 14px / 20px | 600 | Labels and emphasized values |
| Body large | 16px / 24px | 400 or 600 | Primary reading text and prominent values |
| Section title | 20px / 28px | 600 | Section headings and dialog titles |
| Page title | 24px / 32px | 600 or 700 | Primary page heading |

The numeric choices are proposed only. **NEEDS-TEAM-DECISION:** approve, revise, or replace the scale, and decide whether responsive steps, line-height rules, and weight-role pairings need additional tokens.

## Usage guidance and limitations

- **ADOPTED TARGET:** Use semantic roles (caption, body, label, section title, page title) rather than assigning sizes by visual intuition. Prefer the approved application/provider typography source and Ant Design-supported typography APIs when applicable.
- Keep localized strings, controls, tables, and status labels readable at supported content lengths and viewport sizes. Do not clip or rely on fixed text height without a verified need.
- Keep intentional feature typography local and documented; do not silently replace a product-specific font or component override with the candidate scale.
- No browser-computed scale, remote font availability, locale-length rendering, zoom, responsive text, or readability validation was performed. No accessibility or WCAG conformance is claimed.

See [Color System](color.md) for accessibility review criteria and [Design Patterns](patterns.md) for decision labels.
