# Profile stale-path fix — 2026-11-04

Source: `docs/reports/2026-11-04/module-docs-inventory.md` (revision
`8562c125`, branch `improve/vuongnq`). Both of its findings were re-verified
against current source before any edit (see "Verification" below). Scope:
`.claude/rules/` and `.claude/agents/` only. Nothing under `src/`, `docs/`,
`.claude/PROJECT_CONTEXT.md`, the snapshot section of `CLAUDE.md`, or
`.gitignore` was touched. No commit was made (`.claude/*` is gitignored
entirely in this repo, confirmed via `git check-ignore -v`, so these edits
carry no git status either way).

## Verification performed before editing

**Finding 1 (Theme Management rename).** `ls src/modules/system/theme-management/`
and `test -d` on each candidate name confirmed: `theme/` and `theme-lock/` do
not exist; the children present are `background-main/`, `background-main-lock/`,
`topic/`, `components/`, `hooks/`, `utils/`, plus root files
`ThemeConfigurationRedirect.tsx`, `ThemePermissionGate.tsx`, `constant.ts`.
Read `docs/audits/theme-management/2026-10-21-background-main-rename.md`
(a log of follow-up fixes to the already-renamed module, confirming
`background-main`/`background-main-lock` as the live names). Verified every
excluded name from the task brief is still present and unchanged in source:
`THEME_VIEW`/`THEME_CREATE`/`THEME_EDIT`/`THEME_CATEGORY_*` in
`permission.constant.ts`, `themeId`/`themeCode`/`themeName` fields,
`THEME_LOCK_*` error codes, `context: 'THEME'`, `variant='theme'` on
`ManagementDetailLayout`, `ThemeConfigurationRedirect.tsx`,
`ThemePermissionGate.tsx`, parent folder `theme-management`, and
`Menu.themeList` (`menus.helper.ts:428`, both lang files). `theme-topic` was
searched for and found only inside `.claude/PROJECT_CONTEXT.md` (a doc
filename reference, out of this task's edit scope) — it does not appear
anywhere in `.claude/rules/` or `.claude/agents/`, so no occurrence needed
preserving or changing there.

**Finding 2 (route split).** Read `src/routes/index.tsx` (34 lines, renders
`{mainRoutes}`/`{formRoutes}`), confirmed `src/routes/main.routes.tsx` (494
lines, 69 `<Route>`), `src/routes/form.routes.tsx` (1042 lines, 113
`<Route>`), and `src/routes/pages.tsx` (262 lines, 170 `lazy()` exports, 0
`<Route>` elements) all exist. Re-derived counts with
`grep -oE "<Route($|[ >/])"` myself: `index.tsx` 8, `main.routes.tsx` 69,
`form.routes.tsx` 113, total 190 — matches the inventory report and matches
`docs/audits/architecture/2026-10-28-service-router-restructure-impact.md`'s
own count exactly. Read that audit. Checked its two previously-documented
duplicate-path findings against current source:
- `product/parameter/group-document-list`: appears once as the list path
  (`main.routes.tsx:245`); its `create`/`edit/:id`/`view/:id` siblings in
  `form.routes.tsx` are distinct paths, not duplicates of it. **Still not a
  duplicate**, consistent with the audit.
- `banner-management/create` / `banner-management/edit/:id/:screenId`: each
  appears exactly once in `form.routes.tsx` (lines 1036 and 1030), using
  `BANNER_SETTING_CREATE`/`BANNER_SETTING_EDIT` respectively, with no
  duplicate declaration elsewhere. **Still not a duplicate**, consistent with
  the audit.
- The audit's 3 *overlapping* (not exact-duplicate) `product-labels` path
  pairs still exist at the same relative declaration order in
  `form.routes.tsx` (list/create at lines ~290/300, view/:id and edit/:id
  before `:line/create` at ~310/320/330). **This is an existing, previously
  accepted routing-ambiguity risk that still exists; it was not touched or
  fixed, per the task's instruction to report rather than fix it.**

## Files changed

### `.claude/rules/01-architecture.md`
- "Approved Theme Management child-module structure" section:
  `src/modules/system/theme-management/theme/` → `.../background-main/`;
  "Theme or Topic" → "Background Main or Topic"; "Theme/Topic service" →
  "Background Main/Topic service"; "Keep Theme and Topic" → "Keep Background
  Main and Topic"; "a Theme use of Topic category contracts" → "a Background
  Main use of Topic category contracts". Added a dated inline note.

### `.claude/rules/02-typescript.md`
- "Theme Management scoped file naming" section:
  `src/modules/system/theme-management/theme/` → `.../background-main/`.
  Added a dated inline note.

### `.claude/rules/07-component.md`
- "Approved Theme Management naming" section:
  `src/modules/system/theme-management/theme/` → `.../background-main/`;
  "its Theme or Topic child" → "its Background Main or Topic child". Added a
  dated inline note. **Did not edit** the sentence "Keep `theme-management/index.tsx`
  as the existing public landing route entry; do not add a forwarding views
  wrapper" — `theme-management/index.tsx` no longer exists in current source
  (see "Wording left for the user" below); this is outside the two findings
  this pass was authorized to fix, so it is flagged, not corrected.

### `.claude/rules/10-styling.md`
- "## SCSS Modules" section:
  `src/modules/system/theme-management/theme/` → `.../background-main/`.
  Added a dated inline note. **Did not edit** the later sentence "The parent
  feature's existing public `theme-management/index.tsx` remains at that
  path" for the same reason as above (same stale fact, same out-of-scope
  decision).

### `.claude/rules/06-routing-permission.md`
- Audit checklist point 1: `src/routes/index.tsx` path... →
  `src/routes/index.tsx`, `main.routes.tsx`, `form.routes.tsx`, and
  `pages.tsx` path.... No other checklist point added/removed/reordered.
- "Route-level lazy loading" MUST rule: "is loaded with `React.lazy()` in
  `src/routes/index.tsx`. Do not add a new eager top-of-file page import." →
  "adds a `lazy()` export in `src/routes/pages.tsx` and is referenced from
  `src/routes/main.routes.tsx` (`MainLayout`) or `src/routes/form.routes.tsx`
  (`BasicLayout`)... Do not add a new eager page import in either file."
- CANDIDATE wording: rewrote the sentence describing `src/routes/index.tsx`
  as "the monolithic... contract; splitting it by domain is a separate
  `CANDIDATE` decision" to state that the layout-based split (`index.tsx` →
  `main.routes.tsx`/`form.routes.tsx`/`pages.tsx`) is now implemented and
  `LEGACY-COMPATIBILITY`, while a further split **by module/domain** remains
  the still-unimplemented `CANDIDATE` decision. Added a dated inline note.
  **Did not touch** the nearby "the seven Product Labels routes... bypassing
  `WithGuard` and `RouteSuspense`" sentence — see "Wording left for the
  user" below; it is a different, pre-existing staleness (route count and a
  behavior claim) outside both authorized findings.

### `.claude/agents/codebase-analyzer.md`
- Theme Management convention-authority paragraph:
  `src/modules/system/theme-management/theme/` → `.../background-main/`.
  Added a dated inline note.
- Route-and-permission-analysis bullet list: `src/routes/index.tsx` →
  `src/routes/index.tsx`, `main.routes.tsx`, `form.routes.tsx`, and
  `pages.tsx`. Added a dated inline note.

### `.claude/agents/frontend-reviewer.md`
- Routing/auth/permission review checklist point 1: `src/routes/index.tsx` →
  `src/routes/index.tsx`, `main.routes.tsx`, `form.routes.tsx`, and
  `pages.tsx`. Added a dated inline note. (This file had no Theme Management
  directory reference — confirmed by grep, nothing to change for Finding 1.)

### `.claude/agents/feature-implementer.md`
- Routing-and-permissions audit-surfaces sentence: `src/routes/index.tsx` →
  `src/routes/index.tsx`, `main.routes.tsx`, `form.routes.tsx`, `pages.tsx`.
  Added a dated inline note. (No Theme Management directory reference here
  either — confirmed by grep.)

## Files checked and intentionally left unchanged

- `.claude/rules/03-api-service.md` and `.claude/rules/04-state-management.md`
  — both were named by the inventory report as candidates, but neither
  contains a literal `theme-management/theme/` (or `theme-lock/`) directory
  path. They use the generic prose "Theme/Topic" (03) and "Theme's use of
  Topic" (04) without a path, and 03's one directory reference,
  `topic/services/<domain>.service.ts`, is still correct (`topic/` exists
  unchanged). Confirmed by `grep -rn "theme-lock\|/theme/\|\btheme/"` — no
  match in either file. Not edited, per the task's instruction to verify
  rather than trust the candidate list.
- `.claude/agents/frontend-reviewer.md` and `.claude/agents/feature-implementer.md`
  for Finding 1 — neither file names a Theme Management child-module
  directory at all (their only `theme/`-matching text was unrelated styling
  prose — "theme/token consistency" and "theme/runtime semantics" — not a
  directory path). Confirmed by grep; nothing to change for Finding 1 in
  these two files.

## Wording left for the user to decide

Two stale facts were discovered while verifying the two authorized findings,
but are **outside their scope** (not a Theme Management directory name, not
the route-file-split path) — reported here instead of edited:

1. **`.claude/rules/07-component.md`** ("Approved Theme Management naming")
   and **`.claude/rules/10-styling.md`** ("## SCSS Modules") both still say
   `theme-management/index.tsx` is "the existing public landing route entry."
   Current source has no `index.tsx` at `src/modules/system/theme-management/`
   — only `ThemeConfigurationRedirect.tsx`, `ThemePermissionGate.tsx`, and
   `constant.ts`. `.claude/PROJECT_CONTEXT.md`'s 2026-10-13 entry (as read in
   the prior inventory pass) already recorded this file's removal and
   replacement by `ThemeConfigurationRedirect`. Proposed wording, for the
   user to apply or adjust:
   - In `07-component.md`: replace "Keep `theme-management/index.tsx` as the
     existing public landing route entry; do not add a forwarding views
     wrapper." with "Keep `theme-management/ThemeConfigurationRedirect.tsx`
     as the existing public landing route entry; do not add a forwarding
     views wrapper."
   - In `10-styling.md`: replace "The parent feature's existing public
     `theme-management/index.tsx` remains at that path; its owned adjacent
     module is `styles.module.scss`, without adding a forwarding view
     folder." with wording that reflects there being no colocated
     `styles.module.scss` for `ThemeConfigurationRedirect.tsx` in current
     source (confirmed: `find src/modules/system/theme-management -maxdepth 1
     -iname "*.scss"` returns nothing) — the sentence may need to drop the
     stylesheet claim entirely rather than just renaming the file.

2. **`.claude/rules/06-routing-permission.md`**, "Route-level lazy loading"
   section: "the seven Product Labels routes... (`ProductLabelsRouteGate`,
   bypassing `WithGuard` and `RouteSuspense`)". The 2026-10-28 restructure
   audit (`docs/audits/architecture/2026-10-28-service-router-restructure-impact.md`,
   §B11 and finding 5) found **8** `ProductLabelsRouteGate` routes (1 in
   `main.routes.tsx`, 7 in `form.routes.tsx`), and that in the current
   checkout they wrap `<AuthGuard><RouteSuspense><ProductLabelsRouteGate/></RouteSuspense></AuthGuard>`
   — i.e. they bypass `WithGuard` but **do not** bypass `RouteSuspense`,
   contradicting this sentence's "and `RouteSuspense`" clause. This is a
   routing-behavior claim, not a path, and double-checking the exact current
   route count/structure was outside this pass's time budget — proposed
   wording for the user to verify and apply: "the eight Product Labels
   routes do that today (`ProductLabelsRouteGate`, bypassing `WithGuard` but
   wrapped in `RouteSuspense`) and that is a known exception, not a pattern
   to copy."

## Changed files (absolute paths)

- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/rules/01-architecture.md`
- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/rules/02-typescript.md`
- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/rules/07-component.md`
- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/rules/10-styling.md`
- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/rules/06-routing-permission.md`
- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/agents/codebase-analyzer.md`
- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/agents/frontend-reviewer.md`
- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/agents/feature-implementer.md`

No `npm run typecheck`/`lint`/`build` was run — no file under `src/` was
touched. Nothing was committed; `.gitignore` was not changed.

## Follow-up pass

This pass fixes the two items this report previously held back for a human
(see "Wording left for the user to decide" above). Only
`.claude/rules/07-component.md`, `.claude/rules/10-styling.md`, and
`.claude/rules/06-routing-permission.md` were edited.

### Item 1 — `theme-management/index.tsx`

Verified: `ls src/modules/system/theme-management/` shows no `index.tsx` and
no top-level `.scss` file (only `background-main/`, `background-main-lock/`,
`components/`, `hooks/`, `topic/`, `utils/`, `ThemeConfigurationRedirect.tsx`,
`ThemePermissionGate.tsx`, `constant.ts`). The module's actual public landing
route entry is `ThemeConfigurationRedirect.tsx`: it is exported as a `lazy()`
page at `src/routes/pages.tsx:167-169` and used as the module's
`THEME_VIEW`-gated route at `src/routes/main.routes.tsx:381,389`. It has no
adjacent stylesheet.

- `.claude/rules/07-component.md` ("Approved Theme Management naming"):
  replaced "Keep `theme-management/index.tsx` as the existing public landing
  route entry; do not add a forwarding views wrapper." with the same
  sentence naming `theme-management/ThemeConfigurationRedirect.tsx`. Replaced
  the prior unresolved note (left by the earlier pass) with a note recording
  this resolution.
- `.claude/rules/10-styling.md` ("## SCSS Modules"): the old sentence claimed
  `theme-management/index.tsx` "remains at that path" with an "owned adjacent
  module" of `styles.module.scss` — both false (the file doesn't exist, and
  the real landing entry has no stylesheet). Rewrote it to state the true
  current fact: the landing entry is `ThemeConfigurationRedirect.tsx`, an
  unstyled standalone component with no adjacent stylesheet; kept the
  rule's remaining force ("do not add a forwarding view folder around it").

### Item 2 — Product Labels route count and wrapper chain

Re-derived from source, not from any report:

```
grep -n "ProductLabelsRouteGate" src/routes/*.tsx
```

gives 8 route usages total: 1 in `src/routes/main.routes.tsx:480` and 7 in
`src/routes/form.routes.tsx:294,304,314,324,334,344,354`. Reading the JSX
around each one (`main.routes.tsx:477-484`, `form.routes.tsx:289-298` and the
six routes that follow it) shows every one of the 8 uses the identical
wrapper chain:

```jsx
<AuthGuard>
  <RouteSuspense>
    <ProductLabelsRouteGate action='...' />
  </RouteSuspense>
</AuthGuard>
```

So the count was wrong (seven, not eight) and the bypass claim was wrong:
`RouteSuspense` **is** present on every one of these routes; only `WithGuard`
is bypassed (they call `AuthGuard` directly instead of going through
`WithGuard`).

- `.claude/rules/06-routing-permission.md` ("## Route-level lazy loading"):
  rewrote the sentence to say "the eight `ProductLabelsRouteGate` routes ...
  bypassing only `WithGuard`, not `RouteSuspense`", with the exact wrapper
  chain observed. Added a dated note at the end of the file recording the
  grep/line evidence.

### Left unchanged, with reason

- `.claude/rules/07-component.md` "## Loading and skeleton states" also
  contains: "The seven Product Labels routes have no `RouteSuspense` and
  therefore no bar." This is the same wrong count and the same wrong
  `RouteSuspense`-bypass claim as Item 2, and it sits in one of this pass's
  three permitted files — but the task scoped Item 2 specifically to
  `06-routing-permission.md` and didn't name this second occurrence. Not
  edited, flagged here instead. Proposed fix, for whoever takes this: replace
  the sentence with "The eight `ProductLabelsRouteGate` routes render under
  `RouteSuspense` (so they do get the progress bar); only `WithGuard` is
  bypassed for them." — note this also reverses the sentence's conclusion
  (they *do* get a bar), not just the count.

### Files changed in this follow-up pass

- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/rules/07-component.md`
- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/rules/10-styling.md`
- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/rules/06-routing-permission.md`

No `npm run typecheck`/`lint`/`build` was run — no file under `src/` was
touched. Nothing was committed; `.gitignore` was not changed.

### Item 3 — resolving the "left unchanged" flag above

The item flagged directly above ("Left unchanged, with reason") was itself
fixed in a later pass. Re-derived from source rather than trusting this
report's own prior wording: `grep -n "ProductLabelsRouteGate" src/routes/*.tsx`
confirmed the same 8 usages as before (1 in `main.routes.tsx:480`, 7 in
`form.routes.tsx:294,304,314,324,334,344,354`), and reading the JSX around
each confirmed the same wrapper chain
(`<AuthGuard><RouteSuspense><ProductLabelsRouteGate .../></RouteSuspense></AuthGuard>`).

In `.claude/rules/07-component.md` "## Loading and skeleton states", replaced:

> The seven Product Labels routes have no `RouteSuspense` and therefore no bar.

with:

> The eight `ProductLabelsRouteGate` routes still render under `RouteSuspense`
> (they only bypass `WithGuard`, per `.claude/rules/06-routing-permission.md`),
> so they get the same bar as any other lazy route.

This keeps the paragraph's intent (explaining when the `RouteSuspense`
progress bar can and can't double-indicate) and now agrees with the wording
already corrected in `06-routing-permission.md`. Added a dated inline note at
the same location citing the grep/JSX evidence.

#### Files changed in this pass

- `/Users/nguyen.quoc-vuong3/001-hds-admin-clone/.claude/rules/07-component.md`

No `npm run typecheck`/`lint`/`build` was run — no file under `src/` was
touched. Nothing was committed; `.gitignore` was not changed.
