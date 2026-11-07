# Theme Lock: footer actions (Lưu / Hủy) lost after Theme <-> Theme Lock navigation

- Date: 2026-10-20
- Revision: `31aece3d`
- Branch: `fixbug/vuongnq/theme-lock_2345`
- Method: static read-only analysis (`codebase-analyzer` subagent, key claims
  spot-checked in the main session). Nothing was run in a browser. No source
  file was modified.
- Risk: diagnosis `SAFE`; page-local fix `MODERATE`; shell/layout fix `HIGH-RISK`.

## 1. Task understanding

On `ThemeLockPage`, the footer Lưu/Hủy buttons are lost or stop responding
after repeated navigation between the Theme module and Theme Lock, followed by
entering edit mode. The first visit after a full reload works.

### Reproduction steps (USER-REPORTED, not reproduced by anyone else, not in CI)

1. Full page reload.
2. Theme list -> Khóa -> back -> Theme list -> Khóa -> ... (repeated several times).
3. On Theme Lock, enter edit mode.
4. Footer Lưu/Hủy is missing or does not respond.

### Inputs

- Uncommitted worktree change: `align-items: flex-start` in
  `theme-lock/components/ThemeLockTable/styles.module.scss:13-16`. It sits on a
  flex-column block inside the table. The footer is rendered by `BasicLayout`,
  outside the page DOM. **Not a cause.**
- `docs/audits/theme-management/2026-10-16-theme-lock-save-flow-review.md` is
  **missing** from the checkout. It was recorded as missing and was not used.
- `docs/audits/routing/2026-10-20-theme-management-withguard-feasibility.md`
  was read as context for the `WithGuard` suspect.

## 2. Entry point

`src/modules/system/theme-management/theme-lock/views/ThemeLockPage/index.tsx`.
The footer is pushed into the layout slot by `setFooter(...)` in the effect
around lines 345-397. The content is
`mode === 'edit' ? <div className={styles.footer}>…</div> : null`
(`index.tsx:364-380`). Cleanup calls `setFooter(null)` (`index.tsx:384`).

## 3. Feature flow (footer path)

```text
ThemeLockPage effect -> setFooter(node)        (LayoutProvider useState, src/providers/layout.provider.tsx)
  -> BasicLayout reads { header, footer } from useLayoutContext   (src/layouts/basic.layout.tsx:19)
  -> renders <Footer> ONLY when hiddenFooter is true              (src/layouts/basic.layout.tsx:31-35)
     hiddenFooter = useAppSelector(watchHiddenFormFooter)        (src/layouts/basic.layout.tsx:17)
```

`BasicLayout` is the layout route for the whole `withPrefix('')` group
(`src/routes/index.tsx:818`). It persists across Theme and Theme Lock
navigations. Its footer is `position: fixed; z-index: 99`.

## 4. Files involved

- `src/modules/system/theme-management/theme-lock/views/ThemeLockPage/index.tsx`
- `src/modules/system/theme-management/theme/views/ThemeListPage/index.tsx:34`
  (Khóa -> `navigate(PageURLs.ofThemeLock())`)
- `src/modules/system/theme-management/theme/components/ThemePageShell.tsx`
- `src/modules/system/theme-management/topic/components/TopicFormPageShell.tsx`
- `src/modules/system/theme-management/topic/views/TopicPrioritySortPage/index.tsx`
- `src/modules/system/theme-management/topic/views/TopicViewPage/index.tsx`
- `src/layouts/basic.layout.tsx`, `src/redux/slices/layout.slice.ts`
- `src/routes/index.tsx`, `src/guards/index.tsx`, `src/guards/auth.guard.tsx`,
  `src/hooks/auth.hook.ts`, `src/utils/navigate.ts:297`
- `src/providers/modal.provider.tsx`, `src/providers/query.provider.tsx`
- `src/components/forms/change-form-provider/use-change-form-exit-guard.ts`
- `theme-lock/queryKeys/theme-lock.query-keys.ts`

## 5. State ownership

| State | Owner | Lifetime |
|---|---|---|
| Footer node | `LayoutProvider` `useState` | Set and cleared by the page effect |
| **Footer visibility** | **Redux `layout.hiddenFormFooter`** | **App lifetime, global.** Default `true` (`layout.slice.ts:10`). The name is inverted: `true` = shown. |
| Server list | TanStack Query `themeLockQueryKeys.list()` | No `staleTime` (provider default 0, `retry:false`, `refetchOnWindowFocus:false`) |
| `mode`, `rows`, `editBaselineRows`, `errors`, `submitError`, `pickerOpen` | `useState` in `ThemeLockPage` (lines 86-98) | Per mount |
| `saveInFlight` | `useRef` (line 95) | Per mount |

## 6-7. API and type flow

Not implicated. The page uses the standard `useQuery({...themeLockQueryKeys.list()})`
and `useSaveThemeLockChangesMutation`.

## 8. Footer conditions (Q1, Q2, Q4)

### EVIDENCE: conditions for the footer to render and be enabled (Q1)

1. **Layout gate:** Redux `hiddenFormFooter === true` (`basic.layout.tsx:31`).
   This is the only condition that is not local to the page.
2. `mode === 'edit'` (`ThemeLockPage:365`). It is set only by `handleEnterEdit`
   (line 183). The header Edit button needs `canEdit` (line 354).
3. Save is disabled when `!isDirty || isSaving` (line 372). Cancel is disabled
   when `isSaving` (line 367).
4. Double-click guard: `saveInFlight.current || isSaving` (line 278).
5. `canEdit = hasPermission([THEME_EDIT])` uses OR semantics via `.some`. It is
   read live from Redux on every render (`auth.hook.ts:20-34`).

### Values that can be wrong on a 2nd+ mount (Q2)

- EVIDENCE: all page-local state is `useState`/`useRef` (lines 86-98), so it
  is fresh on every mount.
- EVIDENCE: the only value that crosses mounts is Redux `hiddenFormFooter`.
  It is `true` after a reload and is written by other Theme/Topic pages
  (see §10). `ThemeLockPage` never dispatches it (grep: no
  `HiddenFormFooter` under `theme-lock/`).

### Cached re-entry (Q4)

- EVIDENCE: `baselineRows = useMemo(buildRows(savedLocks))` (line 109) and
  `useEffect(() => { if (mode === 'view') setRows(baselineRows) }, [baselineRows, mode])`
  (lines 114-118). Cached data is present on the first render, so rows are
  seeded at mount. No `isLoading -> isSuccess` transition is needed.
- EVIDENCE: `editBaselineRows` is seeded on the Edit click (line 180), not in
  an effect.
- INFERENCE: with `staleTime` 0, a background refetch on re-entry can replace
  `data`. That re-seeds `rows` only in view mode, which is harmless.

## 9. Routing and permission (Q3, Q6, Q7)

- EVIDENCE: `src/routes/index.tsx:899-908`:
  `<Route path={PageURLs.ofThemeLock()} element={<WithGuard Page={ThemeLockPage} Guard={AuthGuard} permissions={[PERMISSIONS.THEME_VIEW]} />} />`.
  `ThemeLockPage` is `lazy()` (line 268). The hierarchy is
  `WithGuard -> AuthGuard -> RouteSuspense -> RouteSuspense -> lazy page`.
  Suspense is doubled because both `WithGuard` and `AuthGuard` wrap
  `RouteSuspense`. That is harmless.
- **Q3:** the route is a distinct sibling `<Route>` under `BasicLayout`, with
  no `key` manipulation and no shared parent element other than the layout.
  When the location moves to a different route, React Router unmounts the
  element, and remounts it fresh on return. INFERENCE from the route tree: the
  page remounts on every visit. Runtime mount count is not verified.
- **Q6:** commit `2bcc3382` (ThemePermissionGate -> WithGuard) evaluates
  `permissions.some(...)`, so OR semantics are preserved. Theme-edit keeps its
  own `requireAll` AND handling in `ThemeEditPage`. `WithGuard` renders
  `<Page />` normally, with no memo or key reuse. The hard-coded
  `setHiddenFormFooter(false)` cleanups predate this commit
  (`git log -S"setHiddenFormFooter(false)"` -> `14cd0819`, `75e234cb`, `08a56be9`).
- **Q7:** `useHasPermission` reads Redux on every render, not once at mount.
  If permissions were empty, the Edit button would also disappear, which is a
  different symptom.

### 8-point audit (`.claude/rules/06-routing-permission.md`)

The audit was run to rule routing in or out. Result: **routing and permission
are not implicated.**

1. Route declaration (`routes/index.tsx:899-908`): `WithGuard` + `AuthGuard` + `THEME_VIEW`, lazy. OK.
2. `PageURLs.ofThemeLock()` (`navigate.ts:297`) matches the route. OK.
3. Menu entry (`menus.helper.ts`): not inspected. Not relevant to this bug.
4. Permission constants `THEME_VIEW`/`THEME_EDIT`/`THEME_CREATE` come from `PERMISSIONS`. OK.
5. Guards: OR semantics preserved. Suspense is doubled but harmless.
6. `useHasPermission` drives `canEdit`/`canCreate` and is read live. OK.
7. Redirects and params: none for lock. Trailing slash is handled by `WithGuard`. OK.
8. Direct link, refresh, missing state, unauthorized: **not runtime-tested.**

## 10. Dependencies and consumers of `hiddenFormFooter`

| Consumer | On mount | On unmount |
|---|---|---|
| `ThemePageShell.tsx:37,41` (Theme create/view/edit) | `true` | **`false` (hard-coded)** |
| `TopicFormPageShell.tsx:70,75` | `true` | **`false` (hard-coded)** |
| `TopicPrioritySortPage:116,121` | `true` | **`false` (hard-coded)** |
| `TopicViewPage:95,100` | `true` | restores the prior value (captured via `useRef`) |
| `order/contract-list/view/form.tsx:56-58`, `users/customer/list-customer/view/form.tsx:57-59` | `false` | `true` |
| `order/loan-order-list/view/loan-order-detail.tsx:751-753` | `confirmButton ? true : false` | `true` |
| `products/configuration/product-labels/index.tsx:153,158` | `currentAction !== 'list'` | `true` |

`ThemeListPage` dispatches nothing. Other `setFooter` users (`list-product/edit-list`,
`card-management/edit-list`, `SplashScreenSort`) share the same gate. Whether
they set the flag themselves was not traced.

## 11. Hypotheses (Q5, Q8)

### Q5: leaked listeners, blockers, timers

- EVIDENCE: `useChangeFormExitGuard` (`ThemeLockPage:130`) registers
  `navigate`, `keydown`, `beforeunload` and `popstate` listeners in effects
  that have cleanups. All of its refs are per instance. It is enabled only
  when `isDirty`. The page has no `useBlocker`.
- EVIDENCE: `ModalProvider` is a single instance above the routes and uses
  `destroyOnClose`. No stuck-mask path was found in the Theme Lock flow.
- EVIDENCE: the only module-level value in theme-lock is the `NO_LOCKS`
  constant (line 42). There are none in `guards/index.tsx`.

| Hyp | Verdict | Basis |
|---|---|---|
| H1: seeding effect misses cached re-entry | **REFUTED** | §8 Q4 |
| H2: stale unsaved-changes blocker from a previous mount | **REFUTED** statically; Navigation-API interplay UNVERIFIABLE WITHOUT RUNTIME | §11 Q5 |
| H3: WithGuard migration reuses the page instance | **REFUTED** | §9 Q3/Q6 |
| H4: AntD `message` from an unmounted provider | **REFUTED** | `App.useApp()` is bound to the root `<AppAnt>` (`main.tsx:51`), which never unmounts. It would only affect toasts, not footer buttons. |
| **H5 (new): Redux `hiddenFormFooter` left `false` by Theme/Topic shells** | **LIKELY: strong static chain, not runtime-proven** | below |

### H5 chain

1. EVIDENCE: `BasicLayout` renders `<Footer>` only when `hiddenFormFooter` is
   true (`basic.layout.tsx:31`). The default is `true`
   (`layout.slice.ts:10`), which explains why the first visit after a reload
   works.
2. EVIDENCE: `ThemeLockPage` calls `setFooter(...)` but never ensures the flag
   is `true`.
3. EVIDENCE: `ThemePageShell` (Theme create/view/edit), `TopicFormPageShell`
   and `TopicPrioritySortPage` set the flag `true` on mount and **`false`** on
   unmount. They do not restore the previous value.
4. INFERENCE: after any visit to one of those pages, the flag stays `false`.
   On Theme Lock -> Edit, `mode='edit'` and the footer node is set, but
   `BasicLayout` does not render it. The buttons are "lost" and no error is
   raised.
5. **Gap:** a pure list <-> Khóa cycle never mounts a shell, so it would not
   flip the flag. H5 needs at least one visit to a Theme create/view/edit page
   (or a Topic form, sort or view page) between lock visits. The reporter's
   "theme module" may include those pages. This must be confirmed with the
   reporter.
6. **Gap:** H5 explains "missing". It does not explain "visible but not
   responding". No static cause was found for inert buttons. The most
   conceivable path is a leftover overlay or modal mask above
   `z-index: 99`, which is unverifiable without runtime.

## 12. Risk classification

- Diagnosis: `SAFE` (read-only).
- Page-local fix in `ThemeLockPage`: `MODERATE`. It is isolated to one page
  but writes a global Redux flag.
- Fix in the shared shells, layout or slice: `HIGH-RISK`. The flag is global
  layout state with about 7 consumer groups across products, order, users and
  system.

## 13. Regression surface

- Theme Lock: view/edit, the footer on first and repeat visits, Cancel, Save,
  and leaving via back, browser back or reload with unsaved changes.
- Pages sharing the flag: Theme create/view/edit, Topic create/edit/sort/view,
  contract-list form, customer-list form, loan-order detail, product-labels.

## 14. Recommended change boundary (proposed minimal fix)

**Most likely root cause (moderate confidence): H5.** `ThemeLockPage` relies on
the global `hiddenFormFooter` flag but never sets it, and the Theme/Topic page
shells leave the flag `false` when they unmount.

**Smallest fix, contained in `ThemeLockPage` only:**

- In `ThemeLockPage`, dispatch `setHiddenFormFooter(true)` on mount and restore
  the prior value on cleanup.
- Mirror the existing `TopicViewPage:95-100` pattern, which captures the prior
  value with `useRef`.
- Do not touch routes, guards, `BasicLayout`, `layout.slice.ts` or the shells.

**Blast radius:**

- One file.
- On exit, Theme Lock restores the prior flag value, so neighbours are
  unaffected.

**Must preserve:**

- The route and the `[THEME_VIEW]` permission (OR semantics).
- The `setHeader`/`setFooter` effect contract.
- The edit-baseline and save flow.
- The query key/staleTime behaviour.

**`NEEDS-TEAM-DECISION`:**

- The underlying defect is the hard-coded `false` cleanup in `ThemePageShell`,
  `TopicFormPageShell` and `TopicPrioritySortPage`.
- Fixing it at the source touches several Theme/Topic pages. It also interacts
  with consumers that write `false` on mount (contract-list and customer-list
  forms).
- A page-local fix leaves other `setFooter` pages that depend on the flag
  exposed to the same issue.
- The team should choose between:
  - (a) the page-local mitigation only, or
  - (b) (a) plus changing the shells to restore the prior value.

## 15. Not verified

- **No runtime evidence.** Nothing was run in a browser. Real auth, real
  permissions and the real API were not exercised.
- **The repo has no test runner.** `npm run typecheck`, `lint`, `prettier` and
  `build` prove nothing about this bug's behaviour. None were run, because no
  code changed.
- **Exact reporter steps.** Did they visit a Theme create/view/edit page, or a
  Topic page, between lock visits? This is the decisive question for H5. If
  the flow was strictly list <-> Khóa, H5 does not apply and there is **no
  confident root cause**.
- **"Visible but unresponsive" buttons.** No static cause was found for this.
- **Runtime mount count** of `ThemeLockPage`, and any leftover
  `.ant-modal-mask`.
- **Navigation-API interplay.** Whether `window.navigation` in Chrome interacts
  with `useChangeFormExitGuard` across mounts.
- **Other `setFooter` pages** were not traced (`edit-list`, `SplashScreenSort`,
  `card-management/edit-list`).

### Runtime checks for a human

1. Reload -> Theme list -> Khóa -> Edit. The footer should be visible.
2. Theme list -> view or edit a theme -> back -> Khóa -> Edit. If the footer is
   missing, H5 is confirmed.
3. In Redux DevTools, watch `layout.hiddenFormFooter` after each step. It
   should be `false` whenever the footer is missing.
4. Repeat a pure list <-> Khóa cycle with no shell page. If the bug still
   reproduces, H5 is not the full cause.
5. In React DevTools, confirm `ThemeLockPage` mounts and unmounts once per
   visit. Check the DOM for a leftover `.ant-modal-mask`.
6. In edit mode with the buttons visible, confirm the Save and Cancel handlers
   fire (temporary console log).

## 16. Handoff for implementation

- **Boundary:**
  - `ThemeLockPage` only (flag on mount, restore on unmount), pending the
    reporter's confirmation of their steps and runtime check 2/3.
  - Escalate the shell-cleanup fix as `NEEDS-TEAM-DECISION`.
- **Preserved contracts:**
  - OR permission semantics.
  - The `WithGuard -> AuthGuard -> RouteSuspense -> lazy` hierarchy.
  - The layout header/footer slot contract.
  - The query key/staleTime behaviour.
- **Non-goals:**
  - No routing, guard, styling, Redux-slice or shell refactor.
  - No edits to other modules.

## Fix applied (2026-10-20, uncommitted, on `31aece3d`)

> **Superseded in part.** The ref-capture mechanism below was replaced by a
> constant `true` cleanup, and F1/F2/F4/F5 are resolved. See
> "Cleanup (F1/F2/F4/F5)" at the end of this section for the current state.

### Decision

The user resolved the §14 `NEEDS-TEAM-DECISION` as **option (b)**: fix
`ThemeLockPage` and also change the three shells to restore the prior value.
The mechanism the user mandated is the existing `TopicViewPage` pattern
(`topic/views/TopicViewPage/index.tsx:58-102`):

1. Capture the flag in a `useRef` at first render.
2. Dispatch `true` on mount.
3. Restore the captured value on cleanup.

No helper was extracted. The edits were made by the `feature-implementer`
subagent and reviewed by the `frontend-reviewer` subagent.

### Change per file

| File | Change | Rationale |
|---|---|---|
| `theme-lock/views/ThemeLockPage/index.tsx` | Imports `useAppDispatch`, `useAppSelector`, `setHiddenFormFooter`, `watchHiddenFormFooter` (:9-13). Adds `dispatch`, `footerVisible`, `previousFooterVisibility = useRef(footerVisible)` (:68-70). Adds a **separate** `useEffect(..., [dispatch])` (:407-416) that dispatches `true` on mount and restores the captured value on cleanup. The existing `setHeader`/`setFooter` effect is byte-identical. | The page now owns the layout gate it depends on, so its edit footer renders whatever page came before. |
| `theme/components/ThemePageShell.tsx` | Adds `useRef` and the selector import, and the ref capture (:24-25). Cleanup changes from `setHiddenFormFooter(false)` to `setHiddenFormFooter(priorFooterVisibility)` (:48). Mount `true` is unchanged. | Stops the hard-coded `false` leak, which was the root defect. |
| `topic/components/TopicFormPageShell.tsx` | Same shape (:36-37, :82). | Same. |
| `topic/views/TopicPrioritySortPage/index.tsx` | Same shape, in `TopicPrioritySortPageContent` (:41-42, :128). | Same. |

- No other file was touched.
- The user's uncommitted `ThemeLockTable/index.tsx` and
  `ThemeLockTable/styles.module.scss` changes are byte-identical before and
  after the fix, and they are not part of it.
- Unchanged:
  - the route, guards, permissions (`[THEME_VIEW]`, OR) and `PageURLs`;
  - the query keys, `staleTime` and invalidation;
  - the i18n keys;
  - the Theme Lock edit/save/cancel/exit-guard flow.

### Validation actually run

| Check | Result | Who |
|---|---|---|
| `npm run typecheck` | pass | implementer, re-run by reviewer |
| `npm run lint` | exit 0, no errors; `npx eslint` on the 4 files clean | implementer |
| `npx prettier --check` (4 changed files only) | pass | implementer, re-run by reviewer |
| `npm run build` | pass (pre-existing chunk-size warning only) | implementer |

**Static checks prove nothing about browser behaviour.** The repo has no test
runner. None of the following was exercised:

- footer rendering;
- navigation order;
- Lưu/Hủy click handling;
- auth, real permissions, or the real API.

### Reviewer verdict: **PASS WITH WARNINGS** (no blocking findings)

| # | Severity | Finding | Regression? |
|---|---|---|---|
| F1 | LOW | `ThemeLockPage` captures the flag at first render, before the outgoing page's cleanup runs, so "prior" is the outgoing page's *mounted* value. Path: contract-list or customer form (flag `false`) → browser Back/Forward to Theme Lock → leave to a page that relies on the default `true` (FormLayout pages, `list-product/edit-list`, `card-management/edit-list`, `SplashScreenSort`). That page loses its footer. Before the fix Theme Lock never wrote the flag, so this path worked. Theme Lock has no menu entry; its only in-app entry is `ThemeListPage:34` → captures `true`, so the path needs browser history. | **New, narrow** |
| F2 | INFO | The shells have the same residual. They write `false` on exit only when the captured value was `false`. That is a strict subset of the pre-fix cases, where every exit wrote `false`. | Pre-existing, narrowed |
| F3 | INFO | List pages with no footer (Theme list, Topic list, others) now show an empty fixed 6rem bar after a shell visit, where they showed none before. This matches first-visit-after-reload and post-contract/customer behaviour, so the old "no bar" was a side effect of the leak. The bar can cover the bottom ~6rem of long lists (e.g. pagination), as it already does on reload. | Return to baseline |
| F4 | INFO | `useAppSelector` is used only to seed the ref. It causes extra re-renders when the flag changes. The reviewer found no render loop. | Negligible |
| F5 | INFO | The untouched `TopicViewPage` has the same latent issue as F1. | Pre-existing |

Other reviewer observations:

- **Effect re-runs and StrictMode:** both are batched into one passive flush, so
  there is no flicker. Cleanup order in `ThemeLockPage` has no dependency.
- **Wider net fix:** FormLayout pages, the edit-lists and `SplashScreenSort`
  also lost their footer after any shell visit before this change. They are
  now fixed except on the F1/F2 history paths.

### Follow-ups (`NEEDS-TEAM-DECISION`)

1. **F1/F2.** Every page that writes `false` resets the flag to `true` on
   unmount, and the slice default is `true`, so the resting value between
   pages is effectively `true`.
   - Restoring a constant `true` on unmount, instead of the captured value,
     would remove F1 and F2 without changing any other consumer.
   - It departs from the user-chosen `TopicViewPage` pattern and would ideally
     be applied to `TopicViewPage` too.
   - The longer-term option is for `BasicLayout` to gate on `footer != null`
     and retire the flag. That is `HIGH-RISK` because it touches every flag
     consumer.
2. **F3.** Tell QA/product about the consistent empty bar on list pages.
   Whether an empty bar should ever render is a separate layout decision.

### Inspect-only findings

- **Opposite-direction consumers.** None of these reads the flag; each writes
  an explicit value on mount and `true` on unmount. The fix cannot strand
  them, and their behaviour is unchanged:
  - `order/contract-list/view/form.tsx:56-58` (`false`/`true`);
  - `users/customer/list-customer/view/form.tsx:57-59` (`false`/`true`);
  - `order/loan-order-list/view/loan-order-detail.tsx:751-753`
    (`confirmButton ? true : false` / `true`);
  - `products/configuration/product-labels/index.tsx:153,158`
    (`currentAction !== 'list'` / `true`).
- **Untraced `setFooter` pages.** `list-product/edit-list.tsx`,
  `card-management/edit-list.tsx` and `SplashScreenSort.tsx` do not dispatch
  the flag and rely on the default `true`. Before the fix they also lost their
  footer after any shell visit. After the fix they are exposed only via F1/F2.

### Manual checks still owed (browser, real auth/permissions/API)

Theme Lock:

1. Reload → Theme list → Khóa → Chỉnh sửa. The footer is visible.
2. Theme list → xem/sửa a theme → back → Khóa → Chỉnh sửa. The footer is
   visible. Repeat via Topic create/edit, priority sort and Topic view.
3. A pure Theme list ↔ Khóa cycle, repeated. The footer is visible every time.
4. Lưu and Hủy actually fire: save succeeds, cancel restores rows, and the exit
   guard prompts when the form is dirty.
5. In Redux DevTools, `layout.hiddenFormFooter` holds its prior value after
   leaving Theme Lock.
6. If a button is visible but inert, check the DOM for a leftover
   `.ant-modal-mask` above `z-index: 99`. This is H5 gap 6, which the fix does
   not explain.

Regression on the changed shells, each by direct link and by in-app
navigation. The footer should be present where it was before and absent where
it was absent:

- Theme create, view, edit;
- Topic create, edit;
- Topic priority sort;
- Topic view.

Cross-page:

- **Pages that hide the footer.** Visit each right after a Theme or Topic page
  and confirm their footer behaviour is unchanged:
  - contract-list form;
  - customer-list form;
  - loan-order detail (with and without `confirmButton`);
  - product-labels (list and non-list).
- **F1 path.** Contract or customer form → browser Back to Theme Lock → leave
  to a FormLayout page or `SplashScreenSort`. Confirm whether the footer is
  missing.
- **F3.** Check for the empty bar on Theme list and Topic list after a shell
  visit.

### Cleanup (F1/F2/F4/F5)

**Decision.** The user accepted reviewer findings F1, F2, F4 and F5 and asked
for them to be fixed now. This resolves Follow-up item 1.

**Rationale.** The "capture prior in a `useRef`, restore on unmount" pattern is
wrong for this flag:

- The ref is captured on the incoming page's first render. That happens before
  the outgoing page's passive cleanup in the same commit.
- So the captured value is the outgoing page's mounted value, not the resting
  value.

The resting value between pages is effectively `true`:

- Every consumer that writes `false` resets the flag to `true` on unmount.
- The slice default is `true` (`layout.slice.ts:10`).

Every Theme-family page therefore now restores a constant `true`. No helper or
hook was extracted. Five small local effects are acceptable under `07-component.md`,
and a shared hook over a global layout flag would widen the blast radius.

**Change per file (net diff vs HEAD `31aece3d`):**

| File | Net change |
|---|---|
| `theme-lock/views/ThemeLockPage/index.tsx` | Imports `useAppDispatch` and `setHiddenFormFooter`. Adds `const dispatch = useAppDispatch()`. Adds a separate `useEffect` (:402-408), deps `[dispatch]`, that dispatches `true` on mount and `true` on cleanup. The `setHeader`/`setFooter` effect is byte-identical to HEAD. `useRef` is still used by `saveInFlight`. |
| `theme/components/ThemePageShell.tsx` | One line: cleanup `setHiddenFormFooter(false)` → `true` (:41). Imports are as at HEAD. |
| `topic/components/TopicFormPageShell.tsx` | One line: cleanup `false` → `true` (:75). |
| `topic/views/TopicPrioritySortPage/index.tsx` | One line: cleanup `false` → `true` (:121). |
| `topic/views/TopicViewPage/index.tsx` | Removes the `useRef` capture, the `useAppSelector(watchHiddenFormFooter)` read and the `priorFooterVisibility` local. Cleanup dispatches `true` (:85-95). Removes the now-unused imports `useRef`, `useAppSelector` and `watchHiddenFormFooter`. Effect deps are unchanged. |

**Unchanged:**

- `basic.layout.tsx`, `layout.slice.ts` and `layout.provider.tsx`: the flag's
  name, default and semantics are unchanged.
- The four opposite-direction consumers.
- The routes, guards and permissions (`[THEME_VIEW]`, OR).
- The query keys, `staleTime` and invalidation.
- i18n.
- The Theme Lock edit/save/cancel/exit-guard flow.

**Working-tree note.** The user's earlier uncommitted
`ThemeLockTable/index.tsx` change (`className: 'halo-table-column-end-date'`)
disappeared from the working tree between 16:04 and 16:26, before this cleanup
started. None of the five edited files is that file, and nothing in this
change depends on it. Whether it was reverted on purpose is pending
confirmation from the user. The `styles.module.scss` change is intact.

**Validation actually run:**

| Check | Result | Who |
|---|---|---|
| `npm run typecheck` | pass | implementer, re-run by reviewer |
| `npm run lint` (`--max-warnings 0`) | clean | implementer; reviewer re-ran `npx eslint` on the 5 files, exit 0 |
| `npx prettier --check` (changed files only) | pass | implementer, re-run by reviewer |
| `npm run build` | pass (pre-existing chunk-size warning) | implementer |

Static checks prove nothing about browser behaviour. There is no test runner,
and nothing was exercised in a browser, with real auth or permissions, or
against the real API.

**Reviewer verdict: PASS WITH WARNINGS.** There are no blocking, HIGH, MEDIUM or
LOW findings.

| ID | Status |
|---|---|
| F1 (ThemeLockPage restores a stale `false`) | **Resolved**: cleanup is a literal `true` |
| F2 (same residual in the shells) | **Resolved** |
| F4 (selector used only to seed a ref) | **Resolved**: `watchHiddenFormFooter` is now read only by `basic.layout.tsx` |
| F5 (TopicViewPage latent restore) | **Resolved** |
| R1 (INFO) | Theme Lock view mode (footer `null`, flag forced `true`) now always shows the empty bar. At HEAD it was hidden only by the leak. This is F3. |
| R2 (INFO) | This doc was out of date. It is fixed by this subsection. The doc is gitignored and local only. |
| R3 (INFO, pre-existing) | `.claude/rules/07-component.md` says Product Labels routes lack `RouteSuspense`. Current `routes/index.tsx:798-804, 1099-1171` wrap them in `AuthGuard → RouteSuspense`. Not touched here. |
| R4 (INFO) | The `ThemeLockTable/styles.module.scss` change is unrelated and out of scope. |

**Resting-value analysis (reviewer, static reasoning about React semantics):**

- Theme-family pages now write only `true`.
- The only writers of `false` are the four opposite consumers, and each resets
  to `true` on unmount.
- No `useLayoutEffect` writers exist. One commit flushes passive unmounts,
  including deleted fibers, before passive mounts, so for A→B in one commit
  B's value wins.
- **Lazy/Suspense** (`useTransitions={false}`): the Theme subtree's deletion
  commits no later than the incoming page's first mount. A late cleanup cannot
  overwrite a consumer's `false`.
- **StrictMode:** the flag ends at the correct value.
- **No path** leaves the flag resting at `false`.

**F3 is accepted as baseline behaviour.** Footer-less list pages, and Theme
Lock in view mode, show the empty 6rem fixed bar whenever the flag is `true`.
That is the same as after a reload. It is referred to QA/product.

**Deferred.** Retiring the flag in favour of a `BasicLayout` gate on
`footer != null` stays `HIGH-RISK` and deferred, because it touches every flag
consumer.

### Manual checks still owed (supersedes the list above)

The dedicated F1-path check is dropped: the reviewer confirmed that the
mechanism is gone. A lighter end-to-end version is kept under cross-page, to
check the ordering claims that were reasoned rather than observed.

Theme Lock:

1. Reload → Theme list → Khóa → Chỉnh sửa. The footer is visible.
2. Theme list → xem/sửa a theme → back → Khóa → Chỉnh sửa. The footer is
   visible. Repeat via Topic create, edit, priority sort and view.
3. A repeated pure Theme list ↔ Khóa cycle. The footer is visible.
4. Lưu and Hủy actually fire: save succeeds, cancel restores rows, and the exit
   guard prompts when there are unsaved changes.
5. In Redux DevTools, `layout.hiddenFormFooter` is `true` after leaving any
   Theme-family page.
6. If a button is visible but inert, look in the DOM for a leftover
   `.ant-modal-mask` above `z-index: 99`. This is H5 gap 6, which the fix does
   not address.

Regression on the changed pages, each by direct link and by in-app navigation.
The footer should be present where it was before:

- Theme create, view, edit;
- Topic create, edit;
- Topic priority sort;
- Topic view (with and without edit permission).

Cross-page:

- **Pages that hide the footer.** Enter each right after a Theme-family page
  and confirm the footer hides or shows as before:
  - contract-list form;
  - customer-list form;
  - loan-order detail (with and without `confirmButton`);
  - product-labels, list and non-list, including the first lazy chunk load.
- **Pages that rely on the default.** `list-product/edit-list`,
  `card-management/edit-list`, `SplashScreenSort` and a FormLayout page should
  show their footer after a Theme-family visit.
- **Light ordering check.** Contract or customer form → browser Back to Theme
  Lock → leave to `SplashScreenSort` or a FormLayout page. The footer should
  be present.
- **F3/R1.** The empty bar on Theme list, Topic list and Theme Lock view mode.
  It needs a product/QA decision.
