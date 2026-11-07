# Component optimization rules — 2026-11-06

## Open questions

- ~~Should `getQueryData` become a default replacement for `useQuery` in
  components that read from an already-populated cache entry?~~ **Settled,
  not `NEEDS-TEAM-DECISION`.** Vuowng explicitly ruled out making
  `getQueryData` a default replacement for `useQuery`: it is scoped to
  one-time, non-reactive snapshot reads of data that has already resolved
  and is not expected to go stale for the consumer's purpose (e.g. a value
  read once inside an event handler, a derived computation, or a child that
  does not need to track that query's own loading/updating state).
  `getQueryData` does not subscribe the caller to cache updates, so any
  consumer that must stay correct as the cache changes, or for which data
  freshness matters, uses `useQuery` (optionally with `select`) instead.
  Codified in `.claude/rules/03-api-service.md` under the query-key factory
  section's `getQueryData`/`setQueryData` guidance.

## 07-component.md: hook-grouping and hook-parameter conventions

- Revision: `d573dc7eafc957279f41529ff56dd858453337b1`, branch
  `improve/vuongnq/2729_sync_CL`. `.claude/` is gitignored (`.gitignore:38`,
  `.claude/*`) and not tracked in git; this edit is a local rule-profile
  change only, no `src/` changes, nothing committed.
- File changed: `.claude/rules/07-component.md`.
- Line range: 66-70 (new hook-parameter bullet, inserted after the
  "smallest practical props contract" bullet). Added wording:

  > - Custom hooks should minimize the number of parameters, preferring 1-3.
  >   When a hook needs more than one related parameter, prefer a single named
  >   options/params object over multiple positional arguments. This mirrors the
  >   existing "smallest practical props contract" rule for components. Does not
  >   require rewriting existing hooks outside the approved task.

- Line range: 101-106 (new derived-values-grouping bullet, inserted after
  the component-body-ordering bullet). Added wording:

  > - When a component accumulates several computed/derived values that are NOT
  >   used for UI binding (JSX rendering) — e.g. values only consumed by side
  >   effects, callbacks, or passed into other hooks — group them into a
  >   dedicated custom hook (a feature hook under the component's feature)
  >   instead of leaving them as loose consts in the component body. This
  >   applies to new or substantially refactored components; do not extract an
  >   existing working component's derived values solely to satisfy this rule.
