# Version Settings — Module Documentation
> Living document. Update when a route, permission, state owner, API contract, or request lifecycle in this module changes.

## 0. Document status

- Verified against: revision `8562c125`, branch `portal-cham-vay`; `git status` shows this module (`src/modules/system/version-settings/`), `src/redux/slices/version-settings.slice.ts`, and `src/types/version-config.d.ts` clean.
- Date: 2026-11-04.
- Method: static source inspection only, via one read-only `codebase-analyzer` delegation that read every file in the module plus every outside file that routes, guards, or links to it (`src/routes/*`, `src/helpers/menus.helper.ts`, `src/utils/navigate.ts`, `src/constants/permission.constant.ts`, `src/redux/slices.ts`/`store.ts`, `src/modules/system/system-management/index.tsx`, `src/layouts/form.layout.tsx`). No runtime, browser, auth, or backend verification was performed.
- Scope: `src/modules/system/version-settings/` — **11 files**, matching `docs/modules/system/OVERVIEW.md:35` and `docs/modules/INDEX.md`'s "pending" entry for this module, re-derived fresh here with `find src/modules/system/version-settings -type f | sort`.
- What could not be verified from source alone (limited to five per the template; further items are in §15):
  1. Whether the edit page's cancel-confirm/history-tab footer path actually reaches `FormLayout`'s `activeFormRef.form.validateFields()` call cleanly when the active tab is History, which has no `form` on its imperative ref (`view/history.tsx:90`; `src/layouts/form.layout.tsx:209-226`) — static reading suggests a thrown `TypeError` caught and logged, not exercised at runtime (§13).
  2. Whether the backend's `PUT api/admin/portal/v1/version-config` tolerates empty-string values for `newVersionCtaLabel`/`newVersionImageUrl`/`newVersionImageKey` when the user leaves them blank (`shared/general-form.ts:42-53`), versus expecting the fields omitted or `null`.
  3. Whether the config-fetch rejection path (`version-settings.slice.ts` setting `config = null` on failure) can be triggered by the shared hub page's unconditional on-mount dispatch (`system-management/index.tsx:68-69`) in a way a user would actually observe as a transient "no data" state on the view/edit pages.
  4. Backend contract for all three endpoints in §6 (response shape, nullability, and whether `audit` accepts the same `page`/`size` semantics assumed here) — only frontend call sites were read.
  5. Whether `src/routes/pages.tsx:257-261`'s eager wrapper functions around the one `lazy()` module export (`pages.tsx:141`) satisfy `.claude/rules/06-routing-permission.md`'s lazy-export rule in spirit, since the code-split boundary is the module itself, not the two route-specific wrappers.

## 1. Responsibility

`src/modules/system/version-settings/` is the admin screen for a single global **version-config singleton** — the mobile app's current/minimum version per platform plus an in-app "update available" message (title, rich-text body, CTA label, image). There is no list, no create, no delete, and no status toggle: exactly one resource exists, view and edit are the only two modes, and a History tab shows its audit trail (`index.tsx:1-6` — a two-branch `mode === 'view' | 'edit'` container, confirmed).

## 2. Entry points and routes

Per content rule 13, route/menu/permission evidence below was gathered from `src/routes/main.routes.tsx`, `src/routes/form.routes.tsx`, `src/routes/pages.tsx`, `src/helpers/menus.helper.ts`, `src/utils/navigate.ts`, and `src/modules/system/system-management/index.tsx`, not from the module directory alone.

- **Routes (CONFIRMED, `src/routes/form.routes.tsx`, `BasicLayout`):**
  - View: path `withPrefix('system-management/version-settings/view')` (`form.routes.tsx:886`), element at `:888`, permission `[PERMISSIONS.VERSION_SETTINGS_VIEW]` — a single-element array.
  - Edit: path `withPrefix('system-management/version-settings/edit')` (`form.routes.tsx:892`), element at `:894`, permission `[PERMISSIONS.VERSION_SETTINGS_EDIT]` — a single-element array.
  - Both import at `form.routes.tsx:112-113`. Neither route is in `main.routes.tsx`. This module contributes 2 of the 113 `<Route>` elements in `form.routes.tsx` (`grep -oE "<Route($|[ >/])" src/routes/form.routes.tsx | wc -l` = 113; same pattern on `main.routes.tsx` = 69 — both counts repository-wide, not module-specific).
- **Lazy wiring (CONFIRMED):** `src/routes/pages.tsx:141` — `export const VersionSettings = lazy(() => import('@/modules/system/version-settings'));` — the one and only lazy boundary for this module. `pages.tsx:257-261` wraps it in two eager named functions, `ViewVersionSettings`/`EditVersionSettings`, each rendering `<VersionSettings mode='view'|'edit' />` for the route element to reference. Whether this two-wrapper-around-one-lazy-import shape fully satisfies `.claude/rules/06-routing-permission.md`'s lazy-export rule is **NEEDS-VERIFICATION** (§0 item 5) — the code-split boundary is real, but it sits one level below the route-visible export names.
- **Guard behavior (CONFIRMED):** `WithGuard` → `GuardedPage` (`src/guards/index.tsx:27-59`) evaluates `permissions.some(...)` (OR, including the single-element arrays above, which are trivially equivalent to an exact check) and redirects to `PageURLs.of404()` on failure; `RouteSuspense` wraps the lazy page.
- **`PageURLs` builders (CONFIRMED, `src/utils/navigate.ts:340-344`):** `ofVersionSettings()` → `/system-management/version-settings/view`; `ofVersionSettingsEdit()` → `/system-management/version-settings/edit`.
- **No menu entry of its own.** The only menu reference is the shared hub's entry (`src/helpers/menus.helper.ts:553-559`), link `PageURLs.ofSystemManagementList()`, `requiredPermissions: [PERMISSIONS.MAINTENANCE_SETTINGS_VIEW, PERMISSIONS.VERSION_SETTINGS_VIEW]` — a true two-member OR array. There is no dedicated "Version Settings" menu item anywhere.
- **No breadcrumb special-case** — `grep -i version src/helpers/breadcrumbs.helper.ts` returns no match; this module resolves its breadcrumb normally (unlike `administrative-unit`/`bank-list`, which do need a hardcoded fallback — see `docs/modules/system/OVERVIEW.md` §2).
- **Real entry point is `system-management/`'s hub page**, a sibling submodule documented in `docs/modules/system/OVERVIEW.md` §4.5, not part of this module:
  - The hub's own route (`main.routes.tsx:400-405`) is gated by the same OR array as its menu entry: `[MAINTENANCE_SETTINGS_VIEW, VERSION_SETTINGS_VIEW]` (`:405`).
  - `system-management/index.tsx:59` independently checks `hasPermission([PERMISSIONS.VERSION_SETTINGS_VIEW])` (single-element) before showing the "Cập nhật phiên bản" row and before dispatching this module's own thunks (`:68-69`, see §5).
  - `system-management/index.tsx:116` links that row to `PageURLs.ofVersionSettings()`. There is no separate permission check on the link itself (view is already gated at `:59` before the row renders at all — unlike `master-data.system.tsx`'s unguarded-link pattern documented in `docs/modules/system/BANK-LIST.md` §13 item 1, which this module does **not** share, because the row is conditionally rendered rather than unconditionally clickable).

## 3. Directory map

`find src/modules/system/version-settings -type f | sort` → 11 files.

```text
src/modules/system/version-settings/
|-- index.tsx                          # mode container: view/form.tsx or edit/form.tsx by `mode` prop (6 lines)
|-- constants.ts                       # VersionSettingsTabs enum, ACCEPT_IMAGE_TYPE (7 lines)
|-- services/
|   `-- version-settings.service.ts    # 3 apiFetcher calls: get config, update config, get audit history (17 lines)
|-- shared/
|   `-- general-form.ts                # VersionSettingsGeneralFormValues type, labels, AntD rules, API<->form mappers (72 lines)
|-- components/
|   `-- platform-version-fields.tsx    # per-platform (ios/android) current/min/storeUrl Form.Item group (62 lines)
|-- edit/
|   |-- form.tsx                       # edit container: fetch-if-null, cancel-confirm modal, two-tab FormLayout (88 lines)
|   |-- general.tsx                    # editable General tab: form, preview modal, submit (283 lines, the module's largest file)
|   `-- preview.tsx                    # read-only preview markup for the "review" modal (79 lines)
`-- view/
    |-- form.tsx                       # view container: fetch-if-null, two-tab FormLayout (60 lines)
    |-- general.tsx                    # disabled-Form mirror of edit/general.tsx (148 lines)
    `-- history.tsx                    # paginated audit-history table; also mounted inside edit/form.tsx's History tab (127 lines)
```

No feature-local `*.types.ts`, no `hooks/`, no `.module.scss`, no `enum` outside `constants.ts`'s single `VersionSettingsTabs` (§13). Shared state lives in `src/redux/slices/version-settings.slice.ts` outside this directory; domain types live in the global ambient `src/types/version-config.d.ts` (§8).

## 4. Main runtime flows (CONFIRMED)

One global singleton; no list, create, or delete.

| Step | Trigger / source | Endpoint |
| --- | --- | --- |
| Config fetch (view) | `view/form.tsx:24-27`, only when `config` is still `null` | `GET api/admin/portal/v1/version-config` (`services/version-settings.service.ts:2`) |
| Config fetch (edit) | `edit/form.tsx:31-34`, same null-guard | same GET |
| History fetch on mount | `view/history.tsx:86-88` → `handlePageChange({})` (`:37-50`, defaults `page:0, size:10`) | `GET api/admin/portal/v1/version-config/audit`, query `{page, size}` (`service:13`) |
| History page/size change | `view/history.tsx:103-116` | same GET |
| Save | `edit/general.tsx:59-71`: `form.validateFields()` (`:62`) → `mapFormValuesToUpdatePayload(config.id, values)` (`shared/general-form.ts:42-53`) → dispatch `updateVersionSettingsConfig` | `PUT api/admin/portal/v1/version-config` (`service:6`) |
| Save success | `version-settings.middleware.ts:43-54` — `UPDATE_SUCCESS` toast, `navigate(PageURLs.ofVersionSettings())` (`:52`); slice's `fulfilled` replaces `config` with the PUT response unvalidated (`slice:60-63`) | — |
| Save failure | `version-settings.middleware.ts:56-66` — `UPDATE_FAIL` toast; slice's `rejected` only clears `updating` (`slice:64-66`), no error stored | — |
| Cancel (edit) | `edit/form.tsx:36-56` confirm modal; on confirm, dispatches a **success** notification (`:42-47`, by design — not an error path) then navigates to the view page (`:48`) | — |

The save trigger is indirect: `FormLayout`'s footer confirm calls `handleConfirm` (`src/layouts/form.layout.tsx:209-226`), which calls `activeFormRef.submitForm()`; the edit page passes no `onConfirm` of its own (`edit/form.tsx:74-86`), so this resolves to `edit/general.tsx`'s `handleSubmit` via `useFormImperativeHandle` (`edit/general.tsx:73`; `src/hooks/form.hook.ts:1-14`). No pseudo-resource branching, static option list, or create-mode logic exists in this module (contrast `ekyc-config/`'s `SYSTEM_SETTING_OTHER` pseudo-row pattern, `docs/modules/system/OVERVIEW.md` §4.3) — the only UI-only field is a derived, non-submitted `configType` label (`shared/general-form.ts:14`, excluded from the PUT payload at `:42-53`).

## 5. State ownership

| State | Owner | Registration |
| --- | --- | --- |
| Version-config singleton + audit history | Redux slice `version-settings` (`src/redux/slices/version-settings.slice.ts`) | `src/redux/slices.ts:31,74`; middleware `configureVersionSettingsMiddleware` at `src/redux/store.ts:31,78` |
| Edit/view form values | AntD `Form`/`FormInstance` — `Form.useForm<VersionSettingsGeneralFormValues>()` in both `edit/general.tsx:42` and `view/general.tsx:28` | initialized from `config` via `mapVersionConfigToFormValues` (`shared/general-form.ts:29-40`), re-applied via `form.setFieldsValue` on every `config` identity change (§13) |
| History table rows | Local `dataSource`, key `index` (`view/history.tsx:52-55`), backed by the same slice's `histories`/`pagination` fields | — |

This is a Redux-owned server resource, `LEGACY-COMPATIBILITY` per `.claude/rules/04-state-management.md` `## Server state ownership (adopted 2026-11-04)` — existing work, not new, and it should not gain a second owner. **Zero TanStack Query usage** (`grep -rn "useQuery\|useMutation\|@tanstack" src/modules/system/version-settings/` returns no match, confirmed by the delegated inventory). No Zod anywhere in the module (§7).

Loading flags are mostly per-operation, with one shared pair: `edit/form.tsx:29` combines `loadingConfig || updating` into a single `loading` value passed to `FormLayout` — the fetch and the save share one visible loading state on the edit page (`slice:39-41,46-49` for `loadingConfig`; `:57-59,64-66` for `updating`). `view/form.tsx:47` and `view/history.tsx:101` each read their own single-purpose flag (`loadingConfig`, `loadingHistories` respectively) without combining them. No error value is stored in the slice; failures surface only through the middleware's toasts (§13).

**Shared-slice interaction with the `system-management` hub (CONFIRMED mechanism, NEEDS-VERIFICATION impact):** `system-management/index.tsx:68-69` unconditionally dispatches this module's own `getVersionSettingsConfig` and `getVersionSettingsHistories({page:0, size:1})` thunks on mount (gated only by `hasPermission([VERSION_SETTINGS_VIEW])` at `:59`), writing into the exact same `config`/`histories`/`pagination` slice fields the view/edit pages read. See §13 for the consequence.

## 6. API boundaries

- `services/version-settings.service.ts` is a feature-local service, `LEGACY-COMPATIBILITY` per `.claude/rules/03-api-service.md` `## Service location` point 5 — `src/services/system/` does not exist for any submodule yet, including this one. Three `window.apiFetcher` calls, all in this one file:

  | Method | Endpoint | Notes |
  | --- | --- | --- |
  | GET | `api/admin/portal/v1/version-config` | `service:2` |
  | PUT | `api/admin/portal/v1/version-config` | full singleton update, `service:6` |
  | GET | `api/admin/portal/v1/version-config/audit` | query `{page, size}`, `service:13` |

  No thunk-level endpoint code and no direct `apiFetcher` call outside this service — the slice's three thunks (`slice:36,54,71`) call the service directly.
- **Unchecked Promise casts (CONFIRMED, architecture-doc claim verified):** `services/version-settings.service.ts:2,6,15` each use `as Promise<...>` against `ApiFetcher`'s untyped `.then((response) => response.data)` resolution (`src/utils/api-service.ts:161,167-172,197-201`) — an unchecked assertion, not runtime validation. `.claude/ARCHITECTURE.md`'s §7/§20 claim ("unchecked Promise casts ... are not the preferred pattern for new boundaries") is accurate and current, re-confirmed at these exact lines rather than assumed from the document.
- No Zod, no runtime guards anywhere in the module. Per `.claude/rules/03-api-service.md` `## Contracts and errors`, the absence of Zod on this stable CRUD-shaped singleton API is the default boundary assumption, not a gap in itself — the Promise-cast pattern above is recorded as a target-direction gap specifically because `.claude/ARCHITECTURE.md` itself already names it for this module, not as a new judgment this document introduces.

## 7. Forms and validation

Both `edit/general.tsx:42` and `view/general.tsx:28` use `Form.useForm<VersionSettingsGeneralFormValues>()`; `view/general.tsx:51` additionally sets the whole `<Form>` to `disabled`, with no separate view-only rendering path. No Zod and no React Hook Form anywhere in the module (confirmed by grep). AntD `rules`:

- `requiredRule` (`shared/general-form.ts:16-19`) — on the title field (`edit/general.tsx:172`) and on each platform field only when `isRequired` is passed (`components/platform-version-fields.tsx:23,29,39,49`); the edit page passes `isRequired` (`edit/general.tsx:149-150`), the view page does not need to (fields are disabled).
- `richTextRequiredRule` (`shared/general-form.ts:21-27`) — on the rich-text message body (`edit/general.tsx:185`), stripping HTML tags before checking emptiness (`:64-71`).
- The CTA label and image fields carry no validation rule (`edit/general.tsx:200-202,214`).

No duplicate validation logic across two independent paths exists here (contrast `bank-list/`'s Save-button-enabled re-derivation, `docs/modules/system/BANK-LIST.md` §7/§13 item 4) — this module expresses each constraint exactly once, through AntD `rules`. Submission runs only `form.validateFields()` (`edit/general.tsx:62`); there is no server-error-to-field mapping, and save failures surface solely as a middleware toast (`version-settings.middleware.ts:56-66`). All labels, placeholders, and the required-field asterisk are hardcoded Vietnamese literals (§12/§13) — none of this module's own text goes through `t()`, even though `src/lang/vi.json:890` defines an unused `versionSettings` key.

## 8. Types and DTO organization

Domain types live in a global ambient `.d.ts` file, not a feature-local `*.types.ts` — a `LEGACY-COMPATIBILITY` pattern shared with every other `system/` submodule documented so far (`docs/modules/system/OVERVIEW.md` §8): `src/types/version-config.d.ts` (28 lines, no React/JSX import) declares `VersionPlatformConfig`, `VersionConfig`, `VersionConfigAuditApiResponse`, and `VersionReviewContentType`. The last of these, `VersionReviewContentType`, is used only inside this module (`shared/general-form.ts:55`, `edit/general.tsx:85`, `preview.tsx:5`) despite living in the global file — a feature-local type placed in global ambient space, not a cross-module contract.

The module also depends on two cross-domain ambient types it does not own: `UpdatedHistory` (`src/types/product-industry.d.ts:131-139`, the `products`-domain history-row shape, used at `view/history.tsx:57` and `version-config.d.ts:19`) and `Pagination`/`PageChangeParams` (`src/types/pagination.d.ts`). One real transformation layer exists and is pure: `mapVersionConfigToFormValues`/`mapFormValuesToUpdatePayload`/`toVersionReviewData` (`shared/general-form.ts:29-62`) map between the API shape, the AntD form shape, and the preview-modal shape — not an identity passthrough.

## 9. Permissions

This module and its one real entry point (the `system-management` hub) reference exactly **2** `PERMISSIONS.*` constants, defined at `src/constants/permission.constant.ts:310-311`: `VERSION_SETTINGS_VIEW: 'version_settings:view'`, `VERSION_SETTINGS_EDIT: 'version_settings:edit'`. Per the template's rule that permissions are frequently enforced outside a module's own directory, both scopes were checked and reconcile cleanly here — unlike `bank-list/`'s view/edit split, this module's own directory references **only** `EDIT` (module-scoped grep: `edit/form.tsx:84`, `view/form.tsx:56`, plus the two import lines); `VIEW` is enforced entirely outside the module (route, hub menu, hub component). The full set of 2 constants is well under the template's >10-constant table threshold, so no named-group table is used, consistent with `docs/modules/system/BANK-LIST.md` §9's similarly small 2-constant case.

Permission-check kind, confirmed per call site per the template's rule (never inferred from a neighbor):

- `form.routes.tsx:888` (view route) — `[PERMISSIONS.VERSION_SETTINGS_VIEW]`: single-element array.
- `form.routes.tsx:894` (edit route) — `[PERMISSIONS.VERSION_SETTINGS_EDIT]`: single-element array.
- `main.routes.tsx:405` (hub route) — `[PERMISSIONS.MAINTENANCE_SETTINGS_VIEW, PERMISSIONS.VERSION_SETTINGS_VIEW]`: a genuine two-member OR array.
- `menus.helper.ts:558` (hub menu) — the identical two-member OR array.
- `system-management/index.tsx:59` (hub row visibility + thunk gate) — `[PERMISSIONS.VERSION_SETTINGS_VIEW]`: single-element, `useHasPermission`'s default `mode: 'some'` (`src/hooks/auth.hook.ts:19-40`).
- `edit/form.tsx:84` (Update button visibility) — `[PERMISSIONS.VERSION_SETTINGS_EDIT]`: single-element.
- `view/form.tsx:56` (Update button visibility) — `[PERMISSIONS.VERSION_SETTINGS_EDIT]`: single-element.

**No copy-paste permission-constant bug exists in this module.** This is worth stating explicitly rather than leaving silent, because `docs/modules/system/OVERVIEW.md` §9/§13 documents exactly this class of defect in two sibling `system/` submodules (`priority-service/` gating its Edit button with `CARD_SERVICE_MANAGEMENT_EDIT` instead of its own constant; `ekyc-config/`'s edit route missing a dedicated edit-permission check). Here, every view-labeled check uses `VERSION_SETTINGS_VIEW` and every edit-labeled check uses `VERSION_SETTINGS_EDIT`, consistently; the Update-button checks in `edit/form.tsx:84`/`view/form.tsx:56` are redundant with the route-level guard (a user who reached the page already holds the permission) but not wrong.

## 10. Shared and cross-domain dependencies

Imported **by** this module, from outside it: `@/layouts/form.layout` (`FormLayout`), `@/utils/navigate` (`PageURLs`), `@/redux/hooks`, `@/redux/slices/notification.slice`, `@/hooks/modal.hook`, `@/hooks/auth.hook`, `@/hooks/form.hook`, `@/constants/permission.constant`, `@/constants/message.constant`, `@/constants/pagination.constant`, `@/types/form` (`FormRef`), and several `@/components/*` entries (`modal-content`, `forms/form-wrapper`, `forms/form-section`, `titles/form.title`, `input`, `text-editor`, `upload`, `button`, `icons`, `pagination`, `table-date-time`, `safeHtml`) — ordinary shared-infrastructure and shared-component reuse, no concerns.

**Cross-domain import (CONFIRMED):** `view/history.tsx:11` imports `convertFieldActionType` from `@/modules/products/configuration/industry-product/ultis` (a `products`-domain internal file), used at `:75` to label history-entry action types. This is the same cross-domain-import pattern `docs/modules/system/OVERVIEW.md` §10 already documents for `ekyc-config/view/history.tsx`'s identical import of the same function from the same file — not newly introduced by this module, and not a defect this document is inventing, but a real reverse dependency: a change to that function in `products/` affects this module's history labels without this module owning or reviewing that change.

**Reverse dependency (LEGACY-COMPATIBILITY):** `src/redux/slices/version-settings.slice.ts:3-7` imports the module-internal service file directly — `.claude/rules/01-architecture.md`'s "shared code must not import business-module internals" is nominally crossed here, but this is the standard shape every Redux-owned feature in this repository uses (a slice importing its own feature's service), not a shared/global file reaching into a business module.

No component or page file from this module is imported by code outside `src/modules/system/version-settings/`, except the route lazy wiring and the hub's thunk/link usage already covered in §2/§4/§5 (confirmed by a full-repository grep for the module's distinguishing symbol names).

## 11. Consumers

- Route tree: `form.routes.tsx:112-113,886-896`; lazy export `pages.tsx:141,257-261`.
- `system-management/index.tsx` — imports this module's thunks/selectors (`:13-18`), checks `VERSION_SETTINGS_VIEW` (`:59`), dispatches `getVersionSettingsConfig`/`getVersionSettingsHistories({page:0,size:1})` on mount (`:68-69`), and links to `PageURLs.ofVersionSettings()` (`:116`) — the module's only outside-module consumer, and its only inbound navigation source besides direct URL.
- `version-settings.middleware.ts:52` navigates to the view page after a successful save; `edit/form.tsx:48` navigates to the view page on cancel; `view/general.tsx:31` and `view/history.tsx:31-34` each navigate to the edit page (the latter appending `?tab=general`, coupling to the `VersionSettingsTabs.General` enum's string value, §13).
- `redux/slices.ts:31,74` and `redux/store.ts:31,78` register the slice/middleware, standard Redux wiring.

## 12. Pattern classification

**Mixed, close to the repository's "Simple feature" target shape but not fully there:** `.claude/ARCHITECTURE.md` §7/§20 describes this module as "close to this shape... service separation and form mapping are target-compatible; unchecked Promise casts and global ambient models are not the preferred pattern." Re-verified against current source, that characterization holds precisely:

- **Service separation (target-compatible):** a dedicated `services/version-settings.service.ts`, separate from the slice and components — the separation itself is correct even though its location is `LEGACY-COMPATIBILITY` (§6).
- **Form mapping (target-compatible):** pure mappers (`shared/general-form.ts:29-62`), AntD `Form`/`FormInstance` as the sole form-state owner, no competing owner (§7/§8).
- **Unchecked Promise casts (not preferred, CONFIRMED present):** `services/version-settings.service.ts:2,6,15` (§6).
- **Global ambient models (not preferred, CONFIRMED present):** `src/types/version-config.d.ts` (§8).
- **State ownership (`LEGACY-COMPATIBILITY`):** Redux, one resource, no second owner — a clean instance of the "one authoritative owner" rule, not a violation (§5). Zero TanStack Query.
- **Service location (`LEGACY-COMPATIBILITY`):** feature-local `services/`, no `src/services/system/` entry yet for this or any `system/` submodule (§6).
- **Styling:** no `.module.scss`, no Emotion `css` object files in this module's own directory (the module's visual composition relies entirely on shared `@/components/*` and `FormLayout`) — `legacy-compatible`/not applicable rather than a defect.
- **i18n (not compliant with `.claude/rules/11-i18n.md`):** every UI string in this module is a hardcoded Vietnamese literal; zero `t()` calls (`grep -n "t(" src/modules/system/version-settings/` — no hit), consistent with, not worse than, the same finding already recorded for every other `system/` submodule in `docs/modules/system/OVERVIEW.md` §12 and `docs/modules/system/BANK-LIST.md` §12.
- **Enum (`LEGACY-COMPATIBILITY`, conflicts with the current repository baseline for new code):** `constants.ts:1-4` declares `export enum VersionSettingsTabs`, which `CLAUDE.md`'s repository baseline prohibits for new code — this module predates that rule.

**No permission copy-paste defect** (§9) — the one notable way this module differs favorably from its `system/` siblings documented so far.

## 13. Technical risks

1. **Shared Redux slice fields are written by both this module and the `system-management` hub** (§5). `system-management/index.tsx:68-69` unconditionally dispatches `getVersionSettingsConfig`/`getVersionSettingsHistories({page:0,size:1})` on mount whenever the viewer holds `VERSION_SETTINGS_VIEW`, writing into the exact same `config`/`histories`/`pagination` fields this module's own view/edit/history pages read (`slice:42-45,77-85`). A background visit to the hub page could in principle truncate the history list this module's History tab is showing, mirroring the already-documented `maintenance`/`version-settings` risk in `docs/modules/system/OVERVIEW.md` §4.5/§15 — `NEEDS-VERIFICATION`, not exercised at runtime.
2. **A failed config fetch clears the cached config for everyone reading the slice.** `getVersionSettingsConfig`'s `rejected` case sets `config = null` (`slice:46-49`), and the hub dispatches this same thunk unconditionally on every mount when the viewer holds `VERSION_SETTINGS_VIEW` (`system-management/index.tsx:61-70`). A transient failure on the hub page can make the view/edit pages briefly show "Chưa có dữ liệu cấu hình" (`view/general.tsx:41-47`; `edit/general.tsx:119-125`) even though the config legitimately exists on the backend. `LIKELY`, not runtime-confirmed.
3. **Unchecked Promise casts on all three API calls** (§6, §12) — `services/version-settings.service.ts:2,6,15` assert response types with `as Promise<...>` against an untyped axios resolution, with no runtime validation; the PUT response is trusted and written straight into Redux (`slice:60-63`).
4. **Config is fetched once and never re-fetched while already non-null**, except via the hub's own dispatch (§5, item 1). `view/form.tsx:24-27` and `edit/form.tsx:31-34` both skip the fetch once `config` is set, so a change made in another session or tab is not re-read on ordinary view/edit navigation within the same SPA session. `NEEDS-VERIFICATION` for cross-user/cross-tab impact.
5. **The edit page's cancel/footer-submit path through `FormLayout` has no `form` ref on the History tab.** `edit/form.tsx` passes no `onConfirm`, so `FormLayout`'s `handleConfirm` (`src/layouts/form.layout.tsx:209-226`) calls `activeFormRef.form.validateFields()` before submitting; the History tab's imperative ref has no `form` property at all (`view/history.tsx:90`, `src/hooks/form.hook.ts:4-12`). Static reading suggests this would throw, be caught, and silently skip submission when the History tab is active and the footer is confirmed — `NEEDS-VERIFICATION`, not exercised at runtime (§0 item 1).
6. **Hardcoded Vietnamese UI text, no i18n** (§12) — zero `t()` usage anywhere in the module, consistent with every other documented `system/` submodule but recorded here as a current-state fact against `.claude/rules/11-i18n.md`.
7. **An `export enum` exists in a file the repository baseline otherwise prohibits for new code** (`constants.ts:1-4`, `VersionSettingsTabs`) — `LEGACY-COMPATIBILITY`, predates the enum prohibition; its string value `'general'` is embedded directly into a navigation URL (`view/history.tsx:33`, `?tab=general`), coupling `FormLayout`'s tab-reading logic to that literal.
8. **Cross-domain import of a `products`-owned helper** (§10): `view/history.tsx:11` imports `convertFieldActionType` from `@/modules/products/configuration/industry-product/ultis`, the same pattern already documented for `ekyc-config/` in `docs/modules/system/OVERVIEW.md` §10 — a change to that function in `products/` affects this module's history labels without this module reviewing or owning that change.
9. **Redux slice imports the module-internal service directly** (`version-settings.slice.ts:3-7`) — the standard shape for this repository's Redux-owned features, flagged only because `.claude/rules/01-architecture.md` nominally discourages shared code depending on business-module internals; here the "shared" code is the feature's own slice, not a genuinely shared/global file.
10. **Possible double-write path for the uploaded image URL field.** `edit/general.tsx:214-227` both lets the `Form.Item`'s own injected `onChange` set the field and separately calls `setFieldValue` for the same field in a sibling `onChange` handler — `NEEDS-VERIFICATION` whether this produces an observable race or redundant-but-harmless double write.
11. **Save-button no-op with no feedback.** `edit/general.tsx:60` returns silently (`if (!config) return;`) if submit is triggered before `config` has loaded — a small, low-likelihood silent-failure window, not user-reachable through the normal UI flow once the loading guard renders.

## 14. Areas to avoid touching

- `src/redux/slices/version-settings.slice.ts` and `src/redux/middlewares/version-settings.middleware.ts` — the sole owner of this module's server resource, also written to by `system-management/index.tsx` (risk 1); a shape change to any thunk or reducer affects both this module's own pages and the hub simultaneously.
- `src/types/version-config.d.ts` — a global ambient file; `VersionReviewContentType` is used only by this module (§8), but the file itself is global, so a rename affects anything else that might import it, even if none currently does.
- `src/modules/system/system-management/index.tsx` — not owned by this module, but it is this module's only real navigational entry point and its unconditional on-mount dispatch is the mechanism behind risks 1 and 2; a fix to either risk, if ever authorized, likely touches that file rather than this module's own files.
- `src/layouts/form.layout.tsx`'s `handleConfirm`/tab-submission logic — shared by every `FormLayout` consumer in the repository, not specific to this module; do not special-case it for risk 5 without a repository-wide review.
- `PERMISSIONS.VERSION_SETTINGS_VIEW`/`VERSION_SETTINGS_EDIT` and the two route declarations in `form.routes.tsx:886-896` — any change is a permission-semantics change and `HIGH-RISK` per `.claude/rules/06-routing-permission.md`; this document records the current, correctly-aligned state (§9) and does not propose changing it.

## 15. Open questions

- `NEEDS-VERIFICATION`: whether the History-tab footer-confirm path (risk 5) actually throws and silently skips submission, or whether `FormLayout` handles a `form`-less active tab some other way not visible from static reading alone.
- `NEEDS-VERIFICATION`: whether the shared Redux slice fields written by both this module and the `system-management` hub (risk 1) can produce a user-visible truncated history list in practice.
- `NEEDS-VERIFICATION`: whether a transient config-fetch failure triggered by the hub's unconditional dispatch (risk 2) is something a real user has ever observed.
- `NEEDS-VERIFICATION`: backend acceptance of empty-string values for the three optional PUT fields (`newVersionCtaLabel`/`newVersionImageUrl`/`newVersionImageKey`) when the user leaves them blank (§0 item 2).
- `NEEDS-VERIFICATION`: whether the image-URL field's apparent double-write path (risk 10) produces any observable effect.
- `NEEDS-TEAM-DECISION`: whether this module's hardcoded-Vietnamese-only UI text (§12, risk 6) should be migrated to `t()`/`vi.json`/`en.json` now or left pending a broader `system/`-area i18n pass, consistent with the same open decision already recorded for `bank-list/` in `docs/modules/system/BANK-LIST.md` §15. Not resolved here.
