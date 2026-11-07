# Module documentation template

> Structure and content rules only. This file carries no facts about any
> module and must not be read as evidence about one. `docs/modules/notifications/OVERVIEW.md`
> is the worked example: when a rule below is ambiguous, see how it was
> applied there, but copy neither its counts nor its claims into another
> module's document.

## Section list

Every module document uses exactly this section list, in this order:

```text
# <Module> — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.
## 0. Document status
## 1. Responsibility
## 2. Entry points and routes
## 3. Directory map
## 4. Main runtime flows
## 5. State ownership
## 6. API boundaries
## 7. Forms and validation
## 8. Types and DTO organization
## 9. Permissions
## 10. Shared and cross-domain dependencies
## 11. Consumers
## 12. Pattern classification
## 13. Technical risks
## 14. Areas to avoid touching
## 15. Open questions
```

## Content rules

1. Every claim carries a concrete file path, and a symbol name where it
   matters. If you cannot cite a path, do not write the claim.
2. Mark facts `CONFIRMED`, inferences `LIKELY`, evidence gaps
   `NEEDS-VERIFICATION`, policy conflicts `NEEDS-TEAM-DECISION`. Do not
   resolve a `NEEDS-TEAM-DECISION`.
3. Never write a count you did not derive from a command; when you do, state
   the command.
4. Keep current-source observations separate from the target policy in
   `.claude/ARCHITECTURE.md`. Do not present `legacy-compatible` code as a
   defect, and do not present section 14 as authorization to change anything.
5. Absent Zod parsing on a stable CRUD API is not a validation gap; say so
   rather than flagging it.
6. Classify Emotion, inline styles, plain CSS and global SCSS as
   `legacy-compatible` when retained for normal maintenance.
7. Placeholder pages that belong to this module stay documented here, in
   section 2 and section 3, not in `docs/modules/PLACEHOLDERS.md`.
8. **Section 13 stays one flat list**, ordered by decreasing consequence.
   Each entry opens with a short bold category label (for example
   **Naming collision**, **Cross-domain state**, **Reverse dependency**,
   **Shared loading flag**). Do not add sub-headings per risk type.
9. **Section 9 permissions table threshold.** When a module references more
   than ten permission constants, or reuses the same multi-permission array
   across route, menu and component layers, use a table (one row per
   permission, columns for where it is enforced: route / menu / component)
   and name each recurring array once as a named group, then refer to it by
   that name elsewhere in the document. Do not re-transcribe the same array
   at every call site.
10. **Dead or commented-out code that affects behavior** — a commented menu
    entry, an unrouted component — is recorded where it occurs (section 2 or
    3, as applicable) **and** raised as an entry in section 15. It does not
    get a section of its own.
11. **Section 0 verification-gap limit.** List at most five verification gaps
    in section 0, ordered by consequence; anything beyond that goes to
    section 15. Do not split verification gaps into a separate file,
    however large the module: a module too large for one document is split
    by submodule instead (one `OVERVIEW.md` plus per-submodule files, as
    `docs/modules/products/` already does), not by moving section 0's own
    content elsewhere.
12. **Count discrepancies.** When a count derived from a command and a count
    enumerated by hand disagree, record both numbers, state the size of the
    discrepancy, and mark it `NEEDS-VERIFICATION`. Never reconcile the two
    with ad-hoc arithmetic in the prose. If the discrepancy is in fact fully
    explainable from source (for example: a different grep scope legitimately
    excludes a constant that is still real), state the explanation and the
    corrected total instead of leaving an unresolved `NEEDS-VERIFICATION` —
    but show the two numbers and the scopes that produced each one either way.
13. **A module's permissions, routes, and menu entries are enforced outside
    its own directory.** Evidence for sections 2, 9, and 10 must be gathered
    from `src/routes/index.tsx`, `src/routes/pages.tsx`,
    `src/routes/main.routes.tsx`, `src/routes/form.routes.tsx`,
    `src/helpers/menus.helper.ts`, `src/constants/permission.constant.ts`,
    and `src/components/**`, as well as from `src/modules/<module>/`. A grep
    scoped to the module directory alone will undercount — record it as a
    module-scoped count and say so, never as the module's total. Worked
    example: `notifications` references 32 permission constants total, while
    a module-scoped grep (`grep -rhoE "PERMISSIONS\.[A-Z0-9_]+" src/modules/notifications/`)
    sees only 31, because `SETTING_NOTIFICATION_VIEW` is referenced only from
    route, menu, and shared-component files outside the module directory.
14. **Confirm the kind of a permission check before describing it.** A
    `hasPermission`/`useHasPermission` call may pass a single permission, an
    OR array of several permissions, or go through a helper function that
    resolves the permission dynamically (for example by entity type). Read
    each call site and state which kind it is; do not infer the kind from a
    neighbouring check in the same file, even one that looks structurally
    identical.
15. **Query-owned modules: sections 5 and 6 each cover a fixed list**, so that
    two documents of Query-owned modules are comparable. Worked example:
    `docs/modules/system/BANK-LIST.md`.
    - **Section 5** must state whether any Redux slice also touches the
      resource (a server resource must have exactly one authoritative owner),
      with the command that established it.
    - **Section 6** must state: the query key factory's file and shape
      (keys-only, or colocating `queryOptions`); whether `queryKeys/` imports
      anything from `services/` (it must not); which query definitions use
      `queryOptions` and how many consumers each query and mutation hook
      actually has; the `staleTime` on every query, and whether it is
      explicit or the TanStack default; `placeholderData: keepPreviousData`
      on each paginated query; and, for each mutation, which keys its
      `onSuccess` invalidates, whether those invalidations are awaited, and
      whether `setQueryData` is used anywhere.
