---
name: design-system-ui
description: Plan, build, or review ChatGPT and Compare UI, forms, tables, drawers, scoped themes, and accessibility in demo-layout. Do not use for a production HDS migration.
---

# Design System UI

1. Read `docs/design-system/README.md` before the relevant DS pages. Check target source separately: copied reference paths and production architecture may not exist here. Identify each claim as `APPROVED DECISION`, `ADOPTED TARGET`, `CANDIDATE`, `LEGACY-COMPATIBILITY`, `NEEDS-TEAM-DECISION` or `NOT VERIFIED`.
2. Keep ChatGPT and Compare themes/CSS within their platform boundaries. Preserve Claude styles and feature-owned Scheme Sync semantics. Do not silently approve unresolved typography, interaction, focus or runtime token choices.
3. Keep Ant Design `Form`/`FormInstance` in charge of values, errors and validation; do not add React Hook Form or change production contracts. Use fictional data. Review field grouping, labels, error recovery, save/cancel feedback, drawer lifecycle, keyboard path, visible focus, contrast and responsive behavior where relevant.
4. For authorized changes, validate with the applicable package scripts and rendered checks where available. Report decision status, source evidence, observed browser results, remaining gaps and open team decisions. WCAG 2.2 AA is a target; never claim conformance without appropriate verification.
