# HDS Admin Design System

This reference separates approved product decisions, confirmed implementation, adopted direction, candidate proposals, compatibility requirements, unresolved decisions, and facts that have not been verified, for both the Claude Code and Codex profiles. It documents current source without authorizing application changes.

## Sections

- [Design Patterns](patterns.md)
- [Component System](components.md)
- [Layout System](layouts.md)
- [Color System](color.md)
- [Typography System](typography.md)
- [Status System](status.md)

## Decision labels

- **APPROVED DECISION** — product/engineering decision explicitly confirmed for this baseline.
- **CONFIRMED CURRENT IMPLEMENTATION** — behavior or contract visible in the cited checkout source.
- **ADOPTED TARGET** — direction new or substantially changed UI should follow; it does not describe uniform current implementation.
- **CANDIDATE** — proposal for review, not an approved value or requirement.
- **LEGACY-COMPATIBILITY** — existing implementation/contract to preserve during ordinary maintenance.
- **NEEDS-TEAM-DECISION** — specific open choice requiring an owner decision.
- **NOT VERIFIED** — static evidence here does not establish the claim.

The repository entry point for Codex is [AGENTS.md](../../AGENTS.md), with project facts in [`.codex/knowledge/PROJECT_CONTEXT.md`](../../.codex/knowledge/PROJECT_CONTEXT.md), architecture in [`.codex/knowledge/ARCHITECTURE.md`](../../.codex/knowledge/ARCHITECTURE.md), and focused policy in [`.codex/rules/`](../../.codex/rules/00-general.md). The repository entry point for Claude Code is [CLAUDE.md](../../CLAUDE.md), with project facts in [`.claude/PROJECT_CONTEXT.md`](../../.claude/PROJECT_CONTEXT.md), architecture in [`.claude/ARCHITECTURE.md`](../../.claude/ARCHITECTURE.md), and focused policy in [`.claude/rules/`](../../.claude/rules/00-general.md). The project context is a dated snapshot; source paths cited on these pages are checked against the current checkout.

## Ownership and boundaries

`AGENTS.md`/`.codex/` owns the Codex profile's entry point and rules; `CLAUDE.md`/`.claude/` owns the Claude Code profile's entry point and rules. This `docs/design-system/*` reference is a shared evidence/decision document consumed by both profiles; it is not owned by either one. Feature/domain code owns business meanings, localized labels, and feature-specific presentation behavior. Root styles and `ConfigProvider` currently own application-level CSS properties and Ant Design configuration; shared components own only their declared contracts.

| Area | Reference | Current source evidence |
| --- | --- | --- |
| Patterns and status classification | [patterns](patterns.md) | `.codex/knowledge/ARCHITECTURE.md`; `.codex/rules/00-general.md` |
| Component ownership and reuse | [components](components.md) | `.codex/rules/07-component.md`; `src/components/` |
| Page shells and compositions | [layouts](layouts.md) | `src/routes/index.tsx`; `src/layouts/` |
| Semantic roles and current color values | [color](color.md) | `src/index.scss`; `src/custom-ant.scss`; `src/providers/index.tsx` |
| Font ownership and candidate scale | [typography](typography.md) | `src/index.scss`; `src/providers/index.tsx`; selected feature sources |
| Shared status variants and domain mappings | [status](status.md) | `src/components/status-badge/`; feature-owned mappings and retained legacy renderers |

## Accessibility review for new or substantially changed UI

**ADOPTED TARGET:** Include these checks in design and implementation review: text/background contrast; status meaning that does not rely on color alone; visible keyboard focus; disabled and read-only states; error identification and feedback; accessible names for meaningful icons; responsive text and readable content. See [Color System](color.md), [Component System](components.md), and [Status System](status.md).

**APPROVED DECISION:** WCAG 2.2 AA is the target for new and substantially changed UI. This does not establish existing application conformance. No accessibility or WCAG conformance claim is made without implementation-level verification.

## Compatibility boundary

Keep existing component APIs and defaults, form and route-shell lifecycles, feature-owned status mappings, current colors, typography, and local styles intact during normal maintenance. The adopted guidance applies to new or substantially changed UI. It is not a migration plan, and it does not change application runtime behavior.

See the [Codex design-system decisions report](../reports/2026-11-05/codex-design-system-decisions.md) for the broader confirmed decisions and source evidence, and the [DS-03 approved color update report](../reports/2026-11-05/ds-03-approved-color-documentation-update.md) for the approved color values, Codex rule update, validation, and remaining open items.
