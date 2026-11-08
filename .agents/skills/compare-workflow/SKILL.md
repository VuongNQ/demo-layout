---
name: compare-workflow
description: Design or review paired Claude and ChatGPT scenarios, Compare worksheets, evidence, and decision tracking in demo-layout. Skip single-platform feature edits.
---

# Compare workflow

1. Inspect `src/compare/`, scenario routes that actually exist, relevant experiments and reports. Confirm each Claude and ChatGPT destination in the current router; label unavailable destinations and do not invent observations.
2. Give both platforms the same fictional task, reproduction steps and criterion IDs. Record observations separately from inference, with evidence identifiers and any untested criteria visible.
3. Preserve Compare's own `compare-workspace:v1:` localStorage namespace apart from Claude decision notes. Treat browser-local records and CSV export as a handoff, not durable shared approval. A `recommended` status never becomes `approved` automatically; require the team's decision owner, date, rationale and evidence.
4. For authorized Compare changes, keep writes in the assigned Compare files; the router integrator owns mounting. Validate scenario/criterion coverage, links, storage and CSV behavior, plus browser interactions when available. Report exact results and unverified behavior.
