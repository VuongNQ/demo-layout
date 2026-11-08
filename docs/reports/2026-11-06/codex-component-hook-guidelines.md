# Codex Component and Hook Guidelines

- **Author:** Vuowng
- **Date:** 2026-11-06
- **Branch:** `improve/vuongnq/2729_sync_CL`
- **Revision:** `55cf531f739321246de153ca77038658f388aab4`

## Scope

Reviewed the current Codex profile and its component, API, state-management,
refactoring, and architecture guidance. Added the requested concise section to
`.codex/rules/07-component.md`. The existing `.gitignore` ignores both
`.codex/*` and `docs/*`, so the updated rule and this report are local-only and
do not appear in normal Git status/diff output. No ignore rule was changed and
no force-tracking was attempted.

## Existing rules and evidence

- `AGENTS.md` defines the profile boundary: new code follows adopted
  architecture, existing contracts are preserved, and unresolved policy
  conflicts are reported rather than silently resolved.
- `.codex/README.md` establishes `.codex/rules/*.md` as focused engineering
  constraints and identifies current source and architecture status as
  authoritative over historical reports.
- `.codex/rules/07-component.md` already groups hooks and derived values before
  handlers, preserves dependency correctness and the Rules of Hooks, discourages
  ceremonial extraction, and recommends named derived values for complex JSX
  branches (`## Rules`, existing lines 84–97).
- `.codex/rules/03-api-service.md` defines feature-owned query keys/options,
  exact-key cache operations, targeted invalidation, and preservation of cache
  and mutation contracts (existing lines 149–181, 213–227). It does not specify
  when a component may use a non-reactive cache snapshot.
- `.codex/rules/04-state-management.md` requires one authoritative owner for a
  server resource and retains Redux ownership until explicit migration
  (`## Choose one owner`, lines 17–20; `## Server state ownership`, lines
  29–43). Its Theme Management note preserves key identity, cache policy, and
  invalidation (lines 77–84).
- `.codex/rules/08-refactoring.md` requires behavior and consumer contracts to
  be preserved and limits structural improvements to approved scope
  (`## Required sequence`, lines 3–14; `## Scope controls`, lines 16–45).
- `.codex/knowledge/ARCHITECTURE.md` adopts feature-owned hooks for Query
  resources and one authoritative server-state owner (§§5, 10–11; especially
  lines 534–566). It favors the least architecture that preserves clarity
  (§4, lines 143–148).
- `.codex/knowledge/PROJECT_CONTEXT.md` describes a mixed legacy/current
  implementation and reports no automated application test framework
  (§16, lines 1726–1742). It is dated evidence, not a mandate to migrate
  existing ownership.

## Changes made

Added **Component Logic and Custom Hook Design** to `.codex/rules/07-component.md`
with three concise guidelines:

1. Extract cohesive derived business logic where useful; choose a custom hook
   for React/reactive dependencies and a pure utility for deterministic
   transformations. Preserve dependency correctness and hook ordering.
2. Limit `getQueryData` to intentional, guaranteed, non-reactive snapshots;
   require parent handling for loading, errors, missing data, and query identity;
   retain `useQuery` when subscription or query state is needed; preserve cache
   and ownership contracts.
3. Use zero to three meaningful hook arguments as a review guideline, with a
   typed object considered for related, optional, or evolving inputs. Keep
   dependencies explicit and avoid global state or Context as argument
   reduction.

## Design rationale

The additions clarify decisions that the existing rules leave implicit while
remaining aligned with their incremental architecture. Pure transformations
avoid React coupling; hooks own reactive behavior. Cache snapshots are safe only
when a boundary establishes availability of the exact entry, because a
successful parent query does not imply a different child key is cached.
Subscriptions remain with `useQuery`. The hook-argument count is advisory to
avoid making a preference an arbitrary API restriction.

## Risks and limitations

- `getQueryData` remains a snapshot and does not subscribe or initiate a fetch;
  callers still need an explicit boundary that guarantees the exact entry.
- Static guidance cannot prove runtime cache availability, loading coverage,
  refetch behavior, or correct query identity in a specific feature.
- The rule does not authorize changing existing server-state ownership or
  production contracts.

## Unverified assumptions

- None introduced as an architectural decision. Whether any particular parent
  query guarantees a child's exact query key must be verified at that feature's
  source and runtime boundary.
- No direct conflict requiring edits outside the primary target was found.

## Validation results

- Compared the revised section with the existing component, Query/API,
  state-management, refactoring, and architecture rules: no contradiction found.
- Reviewed cache-read wording for unsafe recommendations: it requires exact
  entry availability and parent handling of loading, error, missing-data, and
  identity states; it explicitly distinguishes snapshot reads from reactive
  `useQuery` consumers and avoids non-null assertions.
- Reviewed argument-count wording: it is explicitly a guideline, keeps
  dependencies visible, and does not introduce Context or global state.
- Inspected both final Markdown files directly and confirmed the requested
  scope. `git diff --check` returned clean, but ignored paths are outside that
  Git diff; it does not validate these files. No application tests, typecheck,
  lint, build, browser, authenticated API, or runtime checks were run because
  this change only edits engineering guidance and a report.
- Confirmed `.gitignore` ignores `.codex/*` and `docs/*`; both files remain
  local-only. No force-tracking was attempted.
