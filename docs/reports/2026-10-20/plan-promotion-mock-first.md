# Promotion Management (#2498) — mock-first implementation plan

| Field | Value |
| --- | --- |
| Date written | 2026-10-20 (finalised 2026-10-21) |
| Checkout revision | `6dc0c45c` ("feat: enhance styling for priority and action cells in ThemeLockTable") |
| Checkout branch | `fixbug/vuongnq/theme-lock_2345` — **not** `develop`; `develop` is `f8a04a49` |
| Worktree | clean except a pre-existing modification to `.prettierrc` (untouched by this run) |
| Method | Static source inspection only. No file under `src/` was modified. No command other than read-only `git`/`grep`/`cat` was run. |
| Snapshot drift | `CLAUDE.md` records revision `070ede66` on `develop`; that is stale relative to this checkout. |

Legend used throughout: **EVIDENCE** = provable at the cited `file:line`;
**INFERENCE** = reasoning on top of evidence; **NEEDS-TEAM-DECISION** /
**NEEDS-VERIFICATION** = not decidable from source.

---

## 0. Headline: the decisive finding

**There is no mock layer in this repository.** `src/mocks/` does not exist, and
`src/utils/api-service.ts` contains zero occurrences of the string `mock`
(verified: `grep -c -i mock src/utils/api-service.ts` → `0`). The in-browser
mock interceptor was deleted in commit `c75d1420` *"refactor: remove API
mocking"* (2026-10-15). `git ls-files | grep -i mock` returns exactly one file:
`src/modules/products/configuration/card-gift-offer/mock-data.ts`.

Consequences, in order of importance:

1. **Option (A) of the brief — using "the repo's `src/mocks/` registry" — is
   not available.** It cannot be proven excluded from a production build
   because it does not exist. The plan therefore takes **Option (B)**: a
   `promotion.service.mock.ts` beside the real service, selected in one line of
   `services/index.ts` behind a module-owned constant.
2. `.claude/rules/03-api-service.md:9` ("Preserve its base URL, auth/token
   refresh, language, **mock**, and 401 behavior") and
   `.claude/PROJECT_CONTEXT.md:1377-1386` ("Browser mock flow … Mock
   activation rules and production build guarantees should be confirmed")
   are **stale documentation**. PROJECT_CONTEXT was already honest enough to
   flag the mechanism as *Needs verification*; the answer is that it is gone.
   Correcting those two documents is out of scope for this run (read-only) and
   is listed as follow-up work in §19.
3. Restoring an `ApiFetcher`-level interceptor would be a `HIGH-RISK` change to
   the single HTTP boundary, requiring a full consumer impact analysis
   (`.claude/rules/03-api-service.md:14-16`). It is **not** proposed here.

---

## 1. Task Understanding

Build CRUD for product promotions — Vietnamese UI name **"Quản lý ưu đãi sản
phẩm"**, mechanism **"Tặng kèm sản phẩm"**, gift product type **Thẻ** (card),
business use case **#2498** — as UI-first work against mock data, then swap in
the real backend without touching the UI.

Known-contract inputs (given by the brief, **not** provable from this
repository — treat as external authority):

- Parent resource #2091: `GET /portal/v1/promotion-types` and
  `GET /portal/v1/promotion-types/lookup`.
- Page envelope `{ pageInfo: { currentPage, pageSize, totalElements, totalPages }, items: [] }`.
- Request `page` is **0-based**.
- Error envelope `{ code, message, details: [{ field, message }] }`.
- Status domain `ACTIVE | INACTIVE`.
- Backend roles `promotion_management:view` and `promotion_management:edit`.

No swagger, no contract and no endpoint exists for the **child** resource
(#2498). Every DTO in this plan is therefore a **DRAFT CONTRACT invented on
2026-10-20**, imitating the #2091 conventions above.

---

## 2. Entry Point

There is no entry point today. `grep promotion` over `src/routes/index.tsx`,
`src/utils/navigate.ts`, `src/constants/permission.constant.ts` and
`src/helpers/menus.helper.ts` returns **no hits** (EVIDENCE). No
`promotion_management:*` permission exists.

The entry point is new work: a route family, a `PageURLs` builder group, three
permission constants and one menu entry — all covered in §9.

---

## 3. Feature Flow (as it will be built)

```text
Menu (menus.helper.ts)  ->  /product/<promotion path>/list
  WithGuard[PROMOTION_MANAGEMENT_VIEW]
    -> AuthGuard
      -> RouteSuspense
        -> lazy(PromotionListPage)
          -> useQuery({ ...promotionQueryKeys.list(params) })
            -> promotionQueryKeys  ->  services/index.ts  (one-line swap)
                 -> promotion.service.ts      (real, via window.apiFetcher)
                 -> promotion.service.mock.ts (fixtures + in-memory store)
              -> mapPromotionListResponse(dto) -> Promotion[] (domain)
                -> components render the DOMAIN MODEL ONLY
```

The swap point is the single line in `services/index.ts`. Nothing above it
changes at M5.

---

## 4. Files Involved

### 4.1 Existing, inspected, **not to be modified**

| File | Why it matters |
| --- | --- |
| `src/utils/api-service.ts:124-165` | `ApiFetcher.request`: `axios.create`, request interceptor applying `getHeaders()` at `:129-135`, 401 response interceptor at `:137-156`, rethrow `error.response \|\| error` at `:154,163`. No interception point exists. **Do not touch.** |
| `src/utils/api-service.ts:174-176,189,202,215,224` | URL composition (see §5). |
| `src/modules/products/configuration/card-gift-offer/**` | Different mechanism; see §1 of the investigation, summarised in §10.1. **Do not extend.** |
| `src/modules/products/attractive-offer/**` | Unrelated singleton curation. **Do not extend.** |
| `src/types/card-gift-offer.d.ts`, `list-product/card-gift-offer-fields.tsx` | The real #2092-family card→loan gift relation inside product forms. **Do not touch.** |
| `src/constants/permission.constant.ts:156-158` | `CARD_GIFT_OFFER_VIEW='product_card_gift:view'`, `..._EDIT='product_card_gift:edit'`. Name-collision hazard. |

### 4.2 Existing, to be modified (real work, `HIGH-RISK`, §9)

`src/routes/index.tsx`, `src/utils/navigate.ts`,
`src/constants/permission.constant.ts`, `src/helpers/menus.helper.ts`,
`src/lang/vi.json`, `src/lang/en.json`.

### 4.3 New files (proposed)

```
src/modules/products/promotion-management/
  constant.ts                         # LIST_QUERY_STALE_TIME_MS, PROMOTION_DATA_SOURCE
  promotion/
    types/promotion.types.ts          # DRAFT DTOs + domain model + form values
    types/promotion.dto.ts            # (optional split) DRAFT CONTRACT header lives here
    services/promotion.service.ts     # real, window.apiFetcher, BASE_PATH
    services/promotion.service.mock.ts# fixtures + in-memory store + behaviour sim
    services/promotion.fixtures.ts    # the fixture rows of §14
    services/index.ts                 # THE ONE-LINE SWAP
    utils/promotion.mapper.ts         # DTO <-> domain <-> form values
    utils/promotion.display-status.ts # FE-computed 4-label display status
    utils/promotion.zod.ts            # feature-owned Zod schema
    utils/promotion-zod-antd.helper.ts# Zod issues -> setFields
    utils/promotion-api-error.helper.ts # details[] -> setFields  (NEW, see §6)
    queryKeys/promotion.query-keys.ts # queryOptions factory
    hooks/promotion.queries.hook.ts   # mutations + cache sync
    views/PromotionListPage/index.tsx + index.module.scss
    views/PromotionViewPage/index.tsx + index.module.scss
    views/PromotionCreatePage/index.tsx
    views/PromotionEditPage/index.tsx
    components/PromotionTableSection/, PromotionForm/, PromotionUpdateHistory/, ...
```

Each new component gets a **private colocated `*.module.scss`**
(`.claude/rules/10-styling.md:8,16,56`). **No new Emotion.**

---

## 5. API Flow and path prefix

**EVIDENCE.** `window.apiFetcher = new ApiFetcher(appEnv.apiHost)` at
`src/providers/current-ctx.provider.tsx:31`; `appEnv.apiHost` is `VITE_API_HOST`
(`src/utils/env-mapper.ts`). URL composition:

- GET: `` `${this.apiUrl}/${url}${objectToQueryString(query)}` `` —
  `src/utils/api-service.ts:174-176`
- POST / PUT / PATCH / DELETE: `` `${this.apiUrl}/${url}` `` —
  `:189`, `:202`, `:215`, `:224`
- A `url` starting with `http` bypasses the host.
- A **leading slash produces `host//…`** and must not be used.

**Therefore a service must pass the string
`'api/admin/portal/v1/promotion-types'`** — literal `api/admin/` prefix, no
leading slash — for a backend route documented as `/portal/v1/promotion-types`.

Proofs in existing code:
`src/modules/system/splash-screen/services/splash-screen.service.ts:13`
(`BASE_PATH = 'api/admin/portal/v1/splash-screens'`);
`src/modules/products/attractive-offer/api-mappers.ts:11`
(`api/admin/portal/v1/product-attractive-offer`);
`src/components/forms/import/upload-file.tsx:58`.
No code anywhere uses a bare `portal/v1/...` (grep: zero hits).

**NEEDS-VERIFICATION:** that the gateway actually maps `/portal/v1/...` to
`api/admin/portal/v1/...` for this new resource. Source proves the house
convention, not the gateway routing table. Confirm with the backend team before
M5.

---

## 6. Pagination and error mapping (existing behaviour)

### 6.1 Pagination — the envelope is already consumed

**EVIDENCE.** `src/modules/system/splash-screen/types.ts:18-23,65-68` declares
`SplashScreenListApiResponse = { pageInfo, items }` with
`pageInfo: { currentPage, pageSize, totalElements, totalPages }` — i.e. **the
#2091 envelope already exists in this codebase.**

The 0-based ↔ 1-based mapping, `src/modules/system/splash-screen/SplashScreenList.tsx:316-321`:

```
current={pageInfo.currentPage + 1}
onPageChange={(page) => saveQueryParams({ page: page - 1 })}
```

with the query state defaulting to `page: 0` (`:77`) and `pageInfo` defaulted to
an object (`:86-88`). Same shape in `src/modules/contents/banner/list.tsx:470-471,651-652`
and `src/modules/contents/popup/list.tsx:595`.

`CustomPagination` (`src/components/pagination/index.tsx:8-14,40-47`) takes a
**1-based** `current`, plus `pageSize`, `total`, `onPageChange`,
`onPageSizeChange`; page sizes are hard-coded 10/20/50 with
`showSizeChanger={false}` on the inner AntD control. **Reuse it as-is.**

### 6.2 Error mapping — `details[]` has no precedent

**EVIDENCE.** About 20 `.setFields(` call sites exist; **none** reads a
`details: [{ field, message }]` array:

- `src/modules/.../affiliate-partner/create/create-affiliate.tsx:139-146` maps
  `error.message` onto the single field `taxCode`.
- `administrative-unit-modal.tsx:180-197` uses a local
  `getInlineValidationError(error, …)` returning `{ field, message }`.
- `attractive-offer-editor.tsx:291-297` maps a client code onto `name`.

Client-side Zod→AntD helpers that **do** exist and are the right shape to
imitate: `theme-management/topic/utils/topic-zod-antd-validation.helper.ts`
(`mapTopicZodIssuesToAntdErrors`, consumed at `TopicForm/index.tsx:129-150`) and
`applyZodIssues` in `ThemeForm/index.tsx:~585-606`. Shared reset:
`resetFieldErrors(form)` at `src/utils/form.ts:242-254`.

Thrown error shape: `ApiFetcher.request` rethrows `error.response || error`
(`api-service.ts:154,163`), so a backend body lands at `error.data`.

**INFERENCE / new work:** a `promotion-api-error.helper.ts` that narrows
`unknown → { code, message, details?: { field, message }[] }` and maps
`details[].field` onto form field names is **new code** with no in-repo
precedent. `.claude/rules/03-api-service.md:52` allows normalising "only when
the feature has a clear contract" — #2091 gives that contract, so the helper is
justified, scoped to this module, and must define explicit failure behaviour
(unmatched fields fall back to a single form-level message rather than being
silently dropped).

**NEEDS-TEAM-DECISION:** whether this normaliser should eventually be promoted
to shared space. Per `.claude/rules/01-architecture.md` ("Local-first
ownership"), it stays module-owned until a second genuine consumer exists.

---

## 7. Type / Data Flow — the query factory pattern

### 7.1 Pattern confirmed against source

`src/modules/system/theme-management/theme/queryKeys/theme.query-keys.ts`
(64 lines) confirms every clause of the rewritten
`.claude/rules/03-api-service.md`:

| Clause | Verdict | Evidence |
| --- | --- | --- |
| One `<domain>QueryKeys` object | CONFIRMED | `export const themeQueryKeys = { … }` |
| Prefix methods return plain `as const` arrays | CONFIRMED | `all`, `lists()`, `details()`, `histories()`, `historyById(id)` |
| Fetching methods return `queryOptions({ queryKey, queryFn: ({ signal }) => service(..., signal), ...options })` | CONFIRMED | `list(params)`, `detail(id)`, `history(id, params)` |
| Factory imports `queryOptions` + `keepPreviousData` + the service | CONFIRMED | `import { keepPreviousData, queryOptions } from '@tanstack/react-query'` at `:1`; `getThemes`/`getThemeById`/`getThemeHistory` at `:3` |
| Consumers spread the options | CONFIRMED | `ThemeTableSection/index.tsx:133`, `ThemeViewPage/index.tsx:142`, `ThemeEditPage/index.tsx:77`, `ThemeUpdateHistory/index.tsx:66` |
| `.queryKey` for exact-entry cache APIs | CONFIRMED | `hooks/theme.queries.hook.ts:37` — `setQueryData(themeQueryKeys.detail(id).queryKey, response)` |
| Prefix invalidation uses plain prefix methods | CONFIRMED | `theme.queries.hook.ts:20,39-41` — `invalidateQueries({ queryKey: themeQueryKeys.lists() })`, `historyById(id)` |
| Module-owned `staleTime` constant | CONFIRMED | `theme-management/constant.ts:1` — `LIST_QUERY_STALE_TIME_MS = 60_000 as const` |
| `placeholderData: keepPreviousData` on the paginated list | CONFIRMED | in `list()` and `history()` |

Parameter normalisation lives in private file-local helpers
(`normalizeListParameters`, `normalizeHistoryParameters`) — as the rule
requires. Services are **function exports** (`getThemes`, …), not an object.

### 7.2 Where source and rule disagree

- `detail(id)` sets **no** `staleTime`. This is **consistent** with the rule,
  which asks for `staleTime` only on paginated lists. Not a disagreement.
- `.claude/rules/03-api-service.md:9` requires preserving `ApiFetcher`'s "mock"
  behaviour, which **no longer exists in source** (§0). **Real disagreement;
  the rule is stale.**
- `src/modules/system/splash-screen/` uses a **keys-only** factory plus
  hook-assembled `useQuery` (`hooks/splashScreenQueries.ts`, `keepPreviousData`
  at `:25,46`). The rule explicitly grandfathers this ("They are not
  violations"). **Not a disagreement, but it is not the pattern to copy for new
  code.**

**Decision for #2498: copy Theme, not splash-screen, for the data layer.** Use
splash-screen only for route/`PageURLs`/permission/menu wiring and the
pagination mapping.

---

## 8. Form Flow

- AntD `Form`/`FormInstance` is the sole form-state owner
  (`.claude/rules/05-form.md:10`). React Hook Form is prohibited (`:13`) and
  absent from `package.json`.
- `FormValues`, `RequestDTO`, `ResponseDTO` and `DomainModel` stay separate with
  explicit mappers (`05-form.md`, "Models and transformations").
- A feature-owned Zod schema validates on submit, **explicitly invoked**, with
  issues mapped through `setFields()` — imitating
  `mapTopicZodIssuesToAntdErrors` (`TopicForm/index.tsx:129-150`).
- Submission uses mutation-hook `isPending`/`error` for local UI
  (`05-form.md:146`), with **one** notification owner.
- Dirty-edit protection: reuse `src/components/forms/change-form-provider/`
  (`ChangeFormProvider` props `onDiscard`, `shouldBlockNavigation?`,
  `onDirtyChange?`, `title`, `message`, `cancelText`, `confirmText`; it wraps an
  AntD `Form` and blocks router navigation). Consumers today: the four
  `list-product` cash-loan/credit-card create/edit forms, and `theme-lock` via
  `use-change-form-exit-guard` (`ThemeLockPage/index.tsx:134-135`,
  `enabled: isDirty`). **There is no standalone "unsaved-changes bar"
  component** — if a bar is required by the design, it is new, feature-local
  work with a private SCSS Module.

---

## 9. Routing and Permission Flow — real work, `HIGH-RISK`

Routing, auth and permission changes are `HIGH-RISK` by definition
(`.claude/rules/06-routing-permission.md:7`). The 8-point audit, applied:

1. **`src/routes/index.tsx`** — add list/create/view/edit under
   `WithGuard → AuthGuard → RouteSuspense → lazy page`
   (`06-routing-permission.md`, "Route-level lazy loading"). Model the
   declarations on splash-screen (lazy imports at `:221-235`; routes at `:733`,
   `:1923`, `:1934`, `:1945`, `:1955`). **Do not** copy `card-gift-offer`
   (eager imports at `:50-53`) and **do not** copy the `ProductLabelsRouteGate`
   exception. Each lazy page keeps a compatible **default export**.
2. **`PageURLs`** (`src/utils/navigate.ts`) — add
   `ofPromotionList`, `ofPromotionCreate`, `ofPromotionView(id, tab = '')`,
   `ofPromotionEdit(id)`. Model on `navigate.ts:344-363`
   (`ofSplashScreenConfigView(id, tab)` appends `?tab=`). The view page has
   three tabs, so the `tab` query parameter is required.
3. **`src/helpers/menus.helper.ts`** — add one entry (model: `:552-556` for
   splash-screen, `:244-247` for attractive-offer). Note
   `card-gift-offer` has **no** menu entry and is URL-only — do not repeat that.
   Menu visibility and route access are **separate registries**; wire both.
4. **`src/constants/permission.constant.ts`** — the house pattern is
   `<FEATURE>_VIEW|CREATE|EDIT: '<backend>:view|create|edit'`, verified at
   `:294-297` (`SPLASH_SCREEN_VIEW: 'splash:view'`, `..._CREATE: 'splash:create'`,
   `..._EDIT: 'splash:edit'`). So the proposed names fit:
   `PROMOTION_MANAGEMENT_VIEW: 'promotion_management:view'`,
   `PROMOTION_MANAGEMENT_EDIT: 'promotion_management:edit'`.
   **`PROMOTION_MANAGEMENT_CREATE` is `NEEDS-TEAM-DECISION`:** the #2091
   contract lists only `view` and `edit` roles. Either create is gated by
   `:edit` (fewest moving parts, matches the backend as stated), or the backend
   must add `promotion_management:create`. Do **not** invent a backend role
   string that the server will not issue — a constant that never matches makes
   the button permanently invisible.
5. **`WithGuard` / `AuthGuard` / `NonLoginGuard`** — unchanged. Permission
   arrays keep **OR** semantics (`06-routing-permission.md`). **NEEDS-VERIFICATION:**
   PROJECT_CONTEXT records an open item that Theme-edit uses `requireAll` (AND)
   while the rest use OR; confirm which `WithGuard` prop this new route passes
   before merge, at runtime.
6. **Action visibility** — create/edit buttons gated through
   `useHasPermission`, never a hardcoded string.
7. **Redirects, breadcrumbs, params** — `:id` plus `?tab=`; relative navigation
   through `PageURLs` only.
8. **Direct link, refresh, missing `location.state`, trailing slash,
   unauthorized** — must be exercised by a human; static checks prove none of
   it.

**Collision check (mandatory "search for duplicate paths" step).** Choose a
path that does **not** collide with `/product/configuration/card-gift-offer`
(`navigate.ts:149-162`) and a Vietnamese title that does not collide with
`card-gift-offer`'s "Danh sách ưu đãi tặng kèm". Proposed:
`/product/promotion-management/...`. The near-identical wording
("Ưu đãi tặng kèm" vs "Tặng kèm sản phẩm") is the single most likely source of
human confusion in this feature — name it deliberately.

---

## 10. Dependencies and Consumers

### 10.1 Overlap verdict — build new, do not extend

**`card-gift-offer`** (`src/modules/products/configuration/card-gift-offer/`,
committed in `fac3344f`):

- It is a **rule engine assigning a loan product to cards** — conditions
  `CARD_CODE`, `CARD_LIMIT`, `LOAN_FA`, `LOAN_TENOR`, `LOAN_IR`; `GiftRule`
  carries `assignments` with `loanProductId` (`mock-data.ts:~35-45`). That is
  the **card→loan relation, the #2092 family**, not #2498's
  "card gifted with a product".
- It has **no endpoint for its own CRUD**: state is a module-level mutable
  array (`mock-data.ts:~99`, `let mockRules: GiftRule[]`) read into
  `useState(getMockRules())` (`list/list.tsx:~127`). Its only real calls are
  lookups: `apiFetcher.get('api/admin/portal/v1/products/search')`
  (`rule-form.tsx:312,320,529,537`) and `.../document-set` (`:328,336`).
- It is visibly unfinished: the save button reads **"Lưu mock"**
  (`rule-form.tsx:815`), its history tab is hard-coded fake rows with actor
  "QTV mock" (`view/history.tsx:~14-30`), `pagination={false}`, no menu entry,
  and its permissions carry a comment saying they borrow the product permission
  "during the mock phase" (`permission.constant.ts:156-158`).
- It is legacy-compatible: Emotion, eager route imports, and
  `export enum CardGiftOfferTabs` (`constants.ts:1`) — which the enum ban
  forbids for new code (`CLAUDE.md`, `.claude/rules/02-typescript.md`).
- **NEEDS-TEAM-DECISION:** whether `card-gift-offer` is the intended #2092
  deliverable, and whether it should be retired now that a real promotion
  module arrives. Source never names a ticket.

**`attractive-offer`** (`src/modules/products/attractive-offer/`): a
**singleton** configuration — `ATTRACTIVE_OFFER_CODE =
'CASH_LOAN_ATTRACTIVE_OFFER'` (`constants.ts:1`), one name + enabled flag + an
ordered list of cash-loan products saved by PUT
(`types.ts: AttractiveOfferSavePayload`), endpoints
`api/admin/portal/v1/product-attractive-offer[/history]` and
`.../products/search/assignable` (`api-mappers.ts:11-15`, calls at `:541-542`),
view/edit routes only (`routes/index.tsx:1225-1241`), permissions
`PRODUCT_ATTRACTIVE_OFFER_VIEW|EDIT` (`permission.constant.ts:125-126`), menu at
`menus.helper.ts:244-247`. **Unrelated** — curation of featured products, not a
promotion type with a gift mechanism. Only the English token "offer" is shared.

**Other greps:** `promotion` and `marketing` appear only as product-form
sections (`promotionDetails`, `card-marketing-fields.tsx`, promotion tabs in
`group-list-product` / `list-product` / `scheme-sync`). None is a
promotion-types resource.

> **DECISION 1 — create a new module.** Proposed location
> `src/modules/products/promotion-management/promotion/`. Justification: the
> business mechanism differs from both existing features; `card-gift-offer` has
> no service layer, no Query ownership, an `enum`, Emotion styling and eager
> routes, so extending it would mean either inheriting forbidden patterns or
> rewriting it — a rewrite is a separate, unasked-for scope
> (`.claude/rules/00-general.md`, "Do not perform unrelated refactors").
> The new module follows the **Theme Management** layout
> (`views/ queryKeys/ services/ utils/ types/ components/ hooks/`,
> `.claude/rules/01-architecture.md`). **NEEDS-TEAM-DECISION:** whether
> `products/` or `system/` is the right parent — it also determines the i18n
> container placement (§11).

### 10.2 Reuse candidates (inspected contracts)

| Candidate | Contract | Consumers | Verdict |
| --- | --- | --- | --- |
| `src/components/status-badge/` | `{ label: string; variant: 'success'\|'warning'\|'error'\|'info'\|'neutral'\|'accent'; className? }` (`index.tsx:3-15`), styled by `status-badge.module.scss` | 5 sites: `customer-card-type.tsx:5`, `ThemeViewPage/index.tsx:5`, `ThemeTableSection/index.tsx:6`, `TopicTableSection/index.tsx:6`, `TopicPrioritySortContent/index.tsx:6` | **REUSE** — generic leaf, SCSS-Module, fits the 4 display statuses. Do **not** use `table-card-status.tsx` (60 sites, older, used by `card-gift-offer/list.tsx`). |
| `src/components/pagination/index.tsx` | 1-based `current`, `pageSize`, `total`, `onPageChange`, `onPageSizeChange`; sizes 10/20/50 hard-coded (`:8-14,40-47`) | wide | **REUSE** as-is. |
| `src/components/input.tsx` | AntD `InputProps` + `isLabelAbove`, `isReadOnlyDisplay`, `isNumber`, `isDecimal`, `isMultiValue`, `isPhoneNumber`, `isFilter`, `width`, `isDefaultFloatPlaceholder`; **`onChange` passes a VALUE, not an event** (`:10-22,38,48-86`) | 154 | **REUSE**; note the non-standard `onChange`. |
| `src/components/select.tsx` | AntD `SelectProps` + `searchFields`, `isFilter`, `isLabelAbove`, `isReadOnlyDisplay`; `onChange(value: string[])` (`:13-19`); **diacritics-insensitive search built in**; read-only display supports `tagRender` (`:~46-60`) | 162 | **REUSE** — its accent-insensitive search is exactly what the card multi-select needs. |
| `src/components/switch.tsx` | AntD `SwitchProps` + `label`, `text`, `textOn`/`textOff` (defaults `'Bật'`/`'Tắt'` hard-coded), `value`, `tooltip`, `isReadOnlyDisplay`, `onChange(checked: boolean)` (`:11-37`) | 110 | **REUSE**; pass explicit `textOn`/`textOff` from i18n rather than relying on the hard-coded Vietnamese. |
| `src/components/date-picker.tsx` | AntD `DatePickerProps` + `placeholder`, `height` (default 56), `showOnlyDay`, `isLabelAbove`, `isReadOnlyDisplay`; read-only format hard-coded `DD/MM/YYYY` (`:34-36`) | 45 | **REUSE** for the effective period. |
| `src/components/select-badge-tag.tsx` | exports `badgeTagRender` — a `tagRender` drawing a pill with a close button | `list-product/view/cash-loan/rule.tsx`, `select-form-custom.tsx` | **REUSE** as `tagRender` on the shared `Select` — this is the multi-select-with-tags control. Prefer this over `select-form-custom.tsx` (23 importers, business-coupled to legacy lookup shapes). |
| `src/components/forms/change-form-provider/` | see §8 | 4 `list-product` forms + `theme-lock` | **REUSE** for discard-confirm / navigation block. No unsaved-changes *bar* exists. |
| `src/components/upload/index.tsx` (`UploadFileComp`) | `category` (required), `value?: string\|string[]`, `onChange?(urls)`, `onKeyChange?`, `totalFile`, `label`, `width`/`height` (80), `acceptType` (default `.png .jpeg .jpg .svg .gif`), `disabled`, `isFile`, `isViewOnly`, `isShowSize`, `getKey`, `maxFileSizeKB` (`:11-30`). **Uploads immediately on selection** via `apiFetcher.post('api/admin/file?category=…')` (`:74-82`), returns the URL (or key when `getKey`); only size validation (`~:220-224`) | 33 files | **REUSE with a caveat** — its upload-on-select behaviour *matches* the draft assumption that the image field is a URL produced by a separate upload step (§12). It does **no** ratio or SVG validation. |
| Update-history tab | `theme/components/ThemeUpdateHistory/index.tsx` props `{ themeId: string }`, bound to `themeQueryKeys.history`, `ThemeHistoryItem`, `THEME_HISTORY_ACTION` and `ThemeManagement.theme.history*` keys. Near-duplicate: `splash-screen/view/history.tsx` (155 lines). Shared flat i18n key `updatedHistory` (`vi.json:255`, `en.json:13`) used by 8 view forms | — | **COPY THE STRUCTURE, do not import.** Both existing versions are feature-owned; importing Theme's would be a module-to-module import forbidden by `01-architecture.md`. Extracting a generic one is **NEEDS-TEAM-DECISION** (it would be the third consumer, which is when promotion becomes defensible). |
| `theme-management/components/` shells (`ManagementPageFooter`, `ManagementPageHeader` with `variant: 'topic'\|'theme'`, `ManagementDetailLayout`, `ManagementTableSection`, `DetailLoadingState`) | SCSS-Module based, parent-feature owned | theme/topic | **DO NOT IMPORT** — cross-module import, and `variant: 'topic'\|'theme'` is hard-wired. Build feature-local equivalents. |

### 10.3 Theme image validation helper — what it actually does

`src/modules/system/theme-management/theme/utils/theme-image.validation.ts`:

- **Format** (`:33-50`): lowercase extension must be in
  `THEME_BACKGROUND_ALLOWED_EXTENSIONS` = `.png .jpg .jpeg .webp .gif`
  (`theme-management/constant.ts:42-48`); if `file.type` is empty it passes,
  otherwise the MIME must be in `image/png|jpeg|webp|gif` (`constant.ts:35-40`).
  **`.svg` is NOT allowed.**
- **1:1 ratio, and `.svg` via `viewBox`: NOT IMPLEMENTED.** The aspect-ratio
  check is **commented out** at `:73-78` (`// no need validation for aspect
  ratio…`, with an old 16:9 formula in the comment).
  `ThemeImageError.BackgroundAspectRatio` is declared at `:17` but
  **unreachable**. `grep -i viewBox` over `src/` finds **nothing**.
- **Max size** (`:6-8,60,91`): `THEME_BACKGROUND_MAX_SIZE_MB = 5`, rejected when
  `file.size >= 5 * 1024 * 1024` — so a file of *exactly* 5 MB **fails**.
- **Dimensions** (`:95-103`): `createImageBitmap(file)`; failure or a
  non-positive/non-finite dimension yields `BackgroundUnreadable`.
  **NEEDS-VERIFICATION:** SVG is not decodable this way in all browsers.
- **Keeping the previous image on failure** (`ThemeAssetPicker/index.tsx:49-79`):
  the input is cleared (`event.target.value = ''`, `:49`); a monotonic
  `validationRequestId` discards stale async results (`:52,54`); on
  `!result.valid` it calls **only** `onValidationError(result.error)` and
  returns **without** calling `onChange`, so the form value keeps the previous
  image. On success it creates a tracked object URL, clears the error, then
  `onChange({url,file,width,height,size,mimeType})` (`:61-79`), revoking URLs on
  change/unmount (`:100-115`). The error surfaces via
  `form.setFields([{ name: 'background', errors: [t(error, { max })] }])`
  (`ThemeForm/index.tsx:326-335`). **Upload happens on submit, not on select.**

**Consequence for #2498:** if the design requires a 1:1 ratio including `.svg`
measured from `viewBox`, **that code does not exist and must be written new**
(parse the SVG text, read `viewBox`/`width`/`height`, compare the ratio). The
*stale-result + do-not-call-onChange* technique from `ThemeAssetPicker` is the
part worth copying.

---

## 11. i18n

**EVIDENCE.** Keys matching `promotion`, `offer`, `uuDai`, `gift`, `attractive`
or `cardGift` in either lang file: **only** `Menu.attractiveOffer`
(`vi.json:37` "Ưu đãi hấp dẫn khác"; `en.json:93` "Other attractive offers").
No promotion / gift / card-gift keys exist.

Existing top-level **object** containers: `vi.json` — `Menu` (`:2`), `Searcher`
(`:49`), `Table` (`:78`), `Form` (`:123`), `ThemeManagement` (`:360`);
`en.json` — `Menu` (`:75`), `ThemeManagement` (`:167`). So `Searcher`, `Table`
and `Form` exist **only in vi** — a pre-existing parity gap that `fallbackLng: vi`
hides at runtime (`.claude/rules/11-i18n.md`). Out of scope here, but do not
newly depend on those containers.

`grep PromotionManagement src/` → **no hits. No collision.**

> **DECISION 2 — i18n namespace `PromotionManagement.{common|promotion}.*`**,
> every key landing in **both** `vi.json` and `en.json` in the same change
> (`11-i18n.md`: a missing `en` key renders Vietnamese silently). Leaf names use
> the established vocabulary: `page`, `header`, `footer`, `column`, `field`,
> `action`, `validation`, `message`, `confirm`, `empty`, `error`, `picker`.
> The menu label goes in `Menu.*` (owned by `menus.helper.ts`) — flagged
> `HIGH-RISK` by `11-i18n.md` because `Menu.*` is consumed outside its owning
> module. Everything else under `PromotionManagement.*` is `SAFE`.
> **NEEDS-TEAM-DECISION:** container placement if the module lands under
> `system/` rather than `products/`.

Required i18n checks (`11-i18n.md`): flatten both files and prove the touched
namespace has an identical key set; grep every literal key; preserve
interpolation placeholders identically across languages. **These checks prove
nothing about rendered labels** — a human must open each screen with
`app_locale=vi` and `app_locale=en`. Validation scripts go in the scratch
directory outside the repository.

---

## 12. The DRAFT CONTRACT and the mapper layer

### 12.1 Mandatory file header

Every DTO file carries this header verbatim, so no reader mistakes it for an
issued contract:

```ts
/**
 * DRAFT CONTRACT — invented on 2026-10-20.
 *
 * No swagger or backend contract exists for use case #2498 (product promotion
 * CRUD, mechanism "Tặng kèm sản phẩm", gift type Thẻ). These shapes imitate the
 * #2091 promotion-types conventions: a `{ pageInfo, items }` page envelope with
 * 0-based `page`, a `{ code, message, details: [{ field, message }] }` error
 * envelope, and an `ACTIVE | INACTIVE` status domain.
 *
 * RISKIEST ASSUMPTION: `imageUrl` is assumed to be a plain URL string produced
 * by a SEPARATE upload step (see src/components/upload/index.tsx:74-82, which
 * POSTs to api/admin/file and returns a URL). If the backend instead expects an
 * asset id, a multipart body, or an object, the create/update RequestDTO and the
 * mapper change — the form and every component do NOT.
 *
 * Every field below is unverified. Re-check all of it against the real swagger
 * at M5 (see docs/reports/2026-10-20-plan-promotion-mock-first.md §17).
 */
```

### 12.2 Draft DTOs (no `enum`; `as const` + derived union)

```ts
export const PROMOTION_STATUS = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' } as const;
export type PromotionStatus = (typeof PROMOTION_STATUS)[keyof typeof PROMOTION_STATUS];

export const GIFT_PRODUCT_TYPE = { CARD: 'CARD' } as const;
export type GiftProductType = (typeof GIFT_PRODUCT_TYPE)[keyof typeof GIFT_PRODUCT_TYPE];

export const PROMOTION_DISPLAY_STATUS = {
  Active: 'Active', Scheduled: 'Scheduled', Expired: 'Expired', Inactive: 'Inactive'
} as const;
export type PromotionDisplayStatus =
  (typeof PROMOTION_DISPLAY_STATUS)[keyof typeof PROMOTION_DISPLAY_STATUS];

/** Page envelope — imitates #2091 exactly. */
export interface PromotionPageInfoDto {
  currentPage: number;   // 0-based
  pageSize: number;
  totalElements: number;
  totalPages: number;
}
export interface PromotionListResponseDto {
  pageInfo: PromotionPageInfoDto;
  items: PromotionListItemDto[];
}

export interface PromotionListItemDto {
  id: number;
  code: string;
  name: string;
  promotionTypeId: number;          // FK -> #2091 promotion-types
  promotionTypeName: string;
  promotionTypeStatus: PromotionStatus;  // needed for the FE display status
  status: PromotionStatus;
  priority: number;
  effectiveFrom: string;            // ISO-8601
  effectiveTo: string | null;       // null = open-ended
  createdAt: string;
  updatedAt: string;
}

export interface PromotionDetailDto extends PromotionListItemDto {
  description: string | null;
  imageUrl: string | null;          // RISKIEST ASSUMPTION
  giftProductType: GiftProductType;
  giftCards: PromotionGiftCardDto[];
  loanProducts: PromotionLoanProductDto[];
}
export interface PromotionGiftCardDto {
  id: number; code: string; name: string; status: PromotionStatus;
}
export interface PromotionLoanProductDto {
  id: number; code: string; name: string;
}

export interface PromotionListQueryDto {
  keyword?: string;
  promotionTypeId?: number;
  status?: PromotionStatus;
  page?: number;      // 0-based
  size?: number;
  orderBy?: string;
}

export interface PromotionCreateRequestDto {
  code: string; name: string; promotionTypeId: number;
  description?: string | null; imageUrl?: string | null;
  priority: number; effectiveFrom: string; effectiveTo?: string | null;
  giftProductType: GiftProductType; giftCardIds: number[];
}
export type PromotionUpdateRequestDto = PromotionCreateRequestDto;

export interface PromotionApiErrorDto {
  code: string; message: string;
  details?: { field: string; message: string }[];
}
```

### 12.3 The mapper layer — and why it is the whole point

`utils/promotion.mapper.ts` holds pure functions and is the **only** place that
knows DTO field names:

```
mapPromotionListResponse(dto: PromotionListResponseDto): PromotionListPage
mapPromotionDetail(dto: PromotionDetailDto): Promotion
mapPromotionToFormValues(model: Promotion): PromotionFormValues
mapFormValuesToCreateRequest(values: PromotionFormValues): PromotionCreateRequestDto
```

Domain model (`Promotion`) uses `dayjs` objects for dates (as
`splash-screen/mappers.ts` does with `DATE_TIME_FORMAT_ISO`), a non-null
`description: string`, `image: string | null`, and a **computed**
`displayStatus: PromotionDisplayStatus`.

**Rule: components read the domain model only.** No component, view, hook or
query key imports a `*Dto` type.

**Why this keeps a wrong contract guess cheap (the central justification of this
plan):** the draft DTOs are a guess, and a guess about an unissued contract is
usually wrong in detail — a renamed field, a date format, `imageUrl` turning out
to be an asset id, `effectiveTo` being an empty string instead of `null`. With a
mapper in place, **being wrong costs one file.** The table columns, the form
fields, the Zod schema, the display-status rule, the query keys and every SCSS
Module are written against `Promotion`, which *we* define and which does not
move. Without a mapper, every DTO field name would be spread across ~20 files
and a contract correction at M5 would be a module-wide rewrite — exactly the
outcome "swap in the real API later without touching the UI" is meant to avoid.

The display-status computation lives in
`utils/promotion.display-status.ts` as a pure function of
`(offerStatus, promotionTypeStatus, effectiveFrom, effectiveTo, now)` returning
one of the four labels. It is FE-side by requirement, so it is **not** a DTO
field and must not be mocked as one.

---

## 13. The mock boundary

> **DECISION 3 — Option (B): `promotion.service.mock.ts` beside the real
> service, selected in one line of `services/index.ts` behind a module-owned
> constant.**

**Evidence for the choice (not a preference — Option A is unavailable):**
`src/mocks/` does not exist; `grep -c -i mock src/utils/api-service.ts` → `0`;
the interceptor was removed in `c75d1420`; `git ls-files | grep -i mock` returns
only `card-gift-offer/mock-data.ts`; `.env.example` declares only
`VITE_FE_HOST`, `VITE_API_HOST` and the MSAL keys; `vite.config.ts` has no mock
branch; `.gitignore` has no mock entry. Option (A) is conditional on proving
production exclusion, and **there is nothing to prove.** (Historically the
removed layer intercepted at the *top* of `ApiFetcher.request` and its
`isMockControlEnabled` returned a literal `true`, so even the deleted design was
**not** provably excluded from production — a second reason not to restore it.)

Restoring an interceptor is a `HIGH-RISK` edit to `ApiFetcher`
(`.claude/rules/03-api-service.md:14-16`) and is out of scope. Adding MSW would
be a new dependency and a `NEEDS-TEAM-DECISION`.

**Shape of the boundary:**

```ts
// constant.ts  (module-owned)
export const PROMOTION_DATA_SOURCE = 'mock' as const;   // 'mock' | 'api'
```

```ts
// services/index.ts  — THE ONLY SWAP POINT
import { PROMOTION_DATA_SOURCE } from '../../constant';
import * as realService from './promotion.service';
import * as mockService from './promotion.service.mock';

const impl = PROMOTION_DATA_SOURCE === 'mock' ? mockService : realService;

export const getPromotions = impl.getPromotions;
export const getPromotionById = impl.getPromotionById;
export const createPromotion = impl.createPromotion;
export const updatePromotion = impl.updatePromotion;
export const togglePromotionStatus = impl.togglePromotionStatus;
export const getPromotionHistory = impl.getPromotionHistory;
```

Both modules export the **same function signatures**, each taking the same
params plus a trailing `signal?: AbortSignal`, so the query factory is unaware
of which is live. `queryKeys/promotion.query-keys.ts` imports from
`'../services'` — never from either concrete file.

**Constraints this satisfies:** no `if (isMock)` appears in a component, hook or
query key — the branch exists on exactly one line of one service barrel. The
mock never calls `axios` or `fetch` (it resolves from an in-memory store, so it
makes no HTTP call at all). `ApiFetcher` is untouched.

**What is lost — record as UNPROVEN:**

- Option (B) **never exercises `ApiFetcher`'s auth header, token-expiry refresh
  (`acquireTokenSilent`), `Accept-Language` header, 401-logout handling, or its
  `error.response || error` rethrow** (`src/utils/api-service.ts:129-135,137-156,154,163`).
  Through M4, **none of that path is proven for this feature.**
- The real URL composition (§5) is never executed, so the
  `api/admin/portal/v1/...` prefix is unproven until M5.
- The mock's thrown error object is hand-made; the real one is an axios response
  with the body at `error.data`. The `details[]` normaliser must therefore be
  written against the **axios-response shape**, and the mock must throw an
  object of that same shape — otherwise M5 breaks the error mapping silently.
- The mock resolves instantly in terms of network reality; `staleTime` and
  invalidation behaviour against real latency are unproven (§17).

---

## 14. The fixture set and simulated behaviour

`services/promotion.fixtures.ts` must force **every** UI branch. Required rows:

| # | Fixture | Branch it forces |
| --- | --- | --- |
| 1 | offer `ACTIVE`, type `ACTIVE`, range covering today | display status **Active** |
| 2 | offer `ACTIVE`, type `ACTIVE`, `effectiveFrom` in the future | display status **Scheduled** |
| 3 | offer `ACTIVE`, type `ACTIVE`, `effectiveTo` in the past | display status **Expired** |
| 4 | offer `INACTIVE` (and one more with type `INACTIVE`) | display status **Inactive**, both causes |
| 5 | exactly one gift card | single-card rendering |
| 6 | several gift cards | tag overflow / `badgeTagRender` wrapping |
| 7 | zero loan products using the selected cards | empty-state inside the detail tab |
| 8 | more than ten loan products | in-tab scrolling / truncation / count label |
| 9 | `description: null` | empty-description rendering |
| 10 | `imageUrl: null` | empty-image placeholder |
| 11 | `effectiveTo: null` | open-ended period label |
| 12 | `priority: 999` alongside priorities 1, 2, 3 | sort order and column width |
| 13 | a gift card with `status: 'INACTIVE'` still saved on an offer | the "saved but no longer active" warning path |
| 14 | an entirely empty list (forced via a reserved keyword) | list empty state |

**Simulated behaviour the mock must implement** (otherwise the UI is written
against a fiction):

- **Paging** over the in-memory store, returning a real
  `{ pageInfo: { currentPage, pageSize, totalElements, totalPages }, items }`
  with **0-based** `currentPage` — so the `currentPage + 1` mapping of
  `SplashScreenList.tsx:316-321` is genuinely exercised.
- **Search**: accent- and case-insensitive over `code` **and** `name`. Normalise
  with `String.prototype.normalize('NFD')` + combining-mark strip, matching the
  diacritics-insensitive behaviour already in `src/components/select.tsx`.
- **Filters**: by `promotionTypeId` and by `status`.
- **Sort**: `priority` ascending, then `createdAt` descending, then `code` A–Z.
  Implement as a single comparator so the real backend's `orderBy` can replace
  it wholesale.
- **Latency**: a random **300–800 ms** delay on every call, so
  `placeholderData: keepPreviousData`, `isPlaceholderData` dimming and
  `isPending` skeletons are all visibly exercised. (The removed mock layer used
  a flat 100 ms, which is too fast to reveal loading bugs.)
- **Forced 500**: a reserved trigger (for example keyword `__500__`) throws an
  object shaped like an axios response — `{ status: 500, data: { code, message } }`.
- **Forced validation error**: a reserved trigger (for example code
  `__INVALID__` on submit) throws
  `{ status: 400, data: { code, message, details: [{ field: 'code', message: '…' }, { field: 'priority', message: '…' }] } }`,
  so the `details[]` → `setFields()` path of §6.2 is exercised before any real
  backend exists.
- **In-memory store**: a module-level mutable array seeded from the fixtures, so
  create / update / toggle are reflected when the list is reopened. This mirrors
  the only in-repo precedent (`card-gift-offer/mock-data.ts:~99`) — but unlike
  that file, it sits **behind a service signature**, which is the whole
  difference.

The store resets on page reload. **This is intentional and must be stated in the
UI review notes** so a reviewer does not read a reload as a data-loss bug.

---

## 15. Milestones and what proves each one done

The repository has **no test runner** (`CLAUDE.md`: "Testing: still zero
tests"). So "done" means: static checks pass **and** a named human walked named
screens. Every milestone's proof below explicitly separates the two.

**M0 — scaffolding.** Module folders; draft DTOs with the §12.1 header; mapper;
display-status function; query-key factory; real service (written, unused);
mock service; fixtures; `services/index.ts` swap line; route + `PageURLs` +
permissions + menu; i18n keys in both lang files.
*Proof:* `npm run typecheck`, `npm run lint`, `npm run prettier`, `npm run build`
all pass; `grep` proves no component imports a `*Dto`; `grep` proves no
`if (isMock)` outside `services/index.ts`; the flattened `PromotionManagement.*`
key sets are identical in `vi.json` and `en.json`; a human loads the list URL
directly and sees an empty shell with the menu entry visible, plus a 403/redirect
when the permission is absent.

**M1 — list screen.** Table, searcher, filters, `CustomPagination`,
`placeholderData: keepPreviousData`, loading from
`isPlaceholderData`/`isFetching`, the 4 display-status badges via
`status-badge`, empty state.
*Proof:* static checks pass; a human walks all 14 fixtures and confirms each
branch renders; pages back and forth and confirms the retained page stays
visible and the pagination control does **not** unmount
(`.claude/rules/03-api-service.md`, `07-component.md:167`); searches with and
without diacritics and with mixed case; sorts; triggers `__500__` and sees one
error affordance, not two.

**M2 — detail, three tabs.** General, gift/loan-product relation, update
history. `?tab=` round-trips through `PageURLs`.
*Proof:* static checks; a human deep-links each tab, refreshes on each tab, and
opens the fixtures with 0 and >10 loan products, null image, null description,
null end date, and the inactive-card-still-saved row.

**M3 — create form.** AntD `Form`, feature-owned Zod invoked explicitly, issues
through `setFields()`, image via `UploadFileComp`, card multi-select via shared
`Select` + `badgeTagRender`, `ChangeFormProvider` discard guard.
*Proof:* static checks; a human submits empty, submits invalid, triggers
`__INVALID__` and confirms both `details[]` entries land on the right fields,
navigates away dirty and sees the confirm, creates a row and sees it in the list
after reopening.

**M4 — update, enable/disable.** Edit form prefilled through
`mapPromotionToFormValues`; toggle mutation with `setQueryData` on the detail
`.queryKey` plus targeted `lists()` invalidation (the Theme pattern,
`theme.queries.hook.ts:37,39-41`).
*Proof:* static checks; a human edits, confirms the list reflects it without a
full reload, toggles status and confirms the display status recomputes, and
confirms dirty edits are not clobbered by a background refetch
(`.claude/rules/05-form.md:129`).

**M5 — real-API integration.** See §17.
*Proof:* the §17 checklist, executed against a real backend, by a human.

---

## 16. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| **Mock code reaches production.** Option (B) is *not* dead-code-eliminated: `services/index.ts` statically imports both modules, so the fixtures and the mock ship in the bundle whenever `PROMOTION_DATA_SOURCE === 'mock'` — and even flipping the constant leaves elimination dependent on Rolldown's treeshaking, which this plan does **not** claim to have proven. | **HIGH** | Make the constant a literal (not an env read) so a reviewer sees it in the diff; add a release-gate checklist item "`PROMOTION_DATA_SOURCE` is `'api'`"; delete `promotion.service.mock.ts` and the fixtures at M5 (§17) rather than leaving them switched off; if the team wants a build-time guarantee instead, a dynamic `import()` behind `import.meta.env.DEV` is the alternative — that is a **NEEDS-TEAM-DECISION** with its own async-boundary cost. |
| **The screen becomes visible to users while the data is fake.** The route, the menu entry and the permissions are real work landing at M0, so anyone with `promotion_management:view` sees a working-looking screen full of invented rows. | **HIGH** | Do not grant the backend role until M5; keep the menu entry behind the permission and have the permission issued to nobody (or to a test group only); add a visible non-production banner on the list page while `PROMOTION_DATA_SOURCE === 'mock'`; raise it explicitly at the demo so a stakeholder does not approve invented numbers. |
| **The draft contract is wrong.** Guaranteed in detail. | HIGH, cheap | The mapper layer (§12.3). Measure the cost: a contract change must touch `promotion.mapper.ts`, the DTO file and the real service — **nothing else**. If it touches a component, the boundary leaked. |
| **`imageUrl` is not a URL string.** The riskiest single assumption. | HIGH | `UploadFileComp` already POSTs to `api/admin/file` and hands back a URL (`:74-82`), so the assumption matches house behaviour — but if the promotion API wants an asset id or multipart, the RequestDTO and mapper change. Ask the backend team for this field first, before the rest of the contract. |
| **`page` 0- vs 1-based flips at M5.** | MEDIUM | §17 makes it the first check. The mock returning genuine 0-based `currentPage` means the mapping is already exercised, not merely written. |
| **`details[].field` names do not match form field names.** | MEDIUM | One lookup table in `promotion-api-error.helper.ts`; unmatched fields fall back to a form-level message rather than vanishing. |
| **Name/path confusion with `card-gift-offer`** ("Ưu đãi tặng kèm" vs "Tặng kèm sản phẩm"; `product_card_gift:*` vs `promotion_management:*`). | MEDIUM | Distinct route prefix, distinct permissions, distinct i18n container; §10.1 raises retiring `card-gift-offer` as a team decision. |
| **`PROMOTION_MANAGEMENT_CREATE` may not exist as a backend role.** | MEDIUM | §9 point 4 — decide with the backend before M0 lands the constant. |
| **1:1 + SVG `viewBox` validation must be written from scratch**; the Theme helper's ratio check is commented out and rejects `.svg` outright. | MEDIUM | §10.3. Budget it as new work, and verify `createImageBitmap` on SVG per browser. |
| **Stale rules and PROJECT_CONTEXT** still describe a mock layer that was deleted, so the next reader will plan against a mechanism that does not exist. | MEDIUM | §19 follow-up; this run was read-only and did not edit them. |
| **`Searcher`/`Table`/`Form` i18n containers exist only in `vi.json`.** | LOW | Do not newly depend on them; `fallbackLng: vi` hides the gap. |
| **Guard array semantics (OR vs AND) are unverified**, with a known Theme-edit `requireAll` exception. | LOW–MEDIUM | §9 point 5; verify at runtime before merge. |

---

## 17. M5 removal checklist

**Files that disappear:**
`services/promotion.service.mock.ts`, `services/promotion.fixtures.ts`, and the
non-production banner component from §16.

**Files that change:**
`constant.ts` — delete `PROMOTION_DATA_SOURCE`;
`services/index.ts` — collapse to a plain re-export of
`./promotion.service` with no branch (and ideally delete the barrel, pointing
the query factory straight at the service, as Theme does);
`types/promotion.types.ts` — replace the DRAFT CONTRACT header with the real
swagger reference and reconcile every field;
`utils/promotion.mapper.ts` — reconcile to the real DTOs;
`utils/promotion-api-error.helper.ts` — reconcile the `details[].field` lookup
table to the real backend field names.

**Nothing in `views/`, `components/`, `queryKeys/` or any `*.module.scss` should
need to change. If one does, record it — that is the measured cost of the
boundary leaking, and the lesson for the next mock-first feature.**

**What must be re-checked, by a human, against the real backend:**

1. **`page` 0-based vs 1-based.** Confirm the request sends 0 for the first page
   and that `pageInfo.currentPage` comes back 0-based; re-verify the
   `currentPage + 1` / `page - 1` mapping at both edges (first page, last page)
   and after a filter change resets the page.
2. **`pageInfo` field names** — `currentPage`/`pageSize`/`totalElements`/
   `totalPages`, and whether an extra field like `itemsOnCurrentPage` appears
   (the older `BannerListResponse` at `src/types/banner.d.ts:199-208` has one).
3. **Backend field names vs form field names** when mapping `details[].field`
   into `setFields()` — walk at least one real validation error per form field,
   and confirm an unmatched field surfaces a form-level message rather than
   disappearing.
4. **Error envelope reality.** Confirm the body really is
   `{ code, message, details: [{ field, message }] }` and that it arrives at
   `error.data` on the rethrown axios response (`api-service.ts:154,163`).
   Confirm a 401 behaves as designed: `ApiFetcher` resolves handled 401s as
   `{ data: null }` after dispatching logout (`:137-156`), which a Query
   `queryFn` will see as **success with null data** — verify the list and detail
   screens do not render a broken empty state in that case. **This path was
   never exercised during M0–M4.**
5. **`staleTime` and invalidation against real latency.** Confirm the chosen
   module-owned `staleTime` (proposed `60_000`, matching
   `theme-management/constant.ts:1`, inside the mandated 30 s–5 min band) does
   not serve visibly stale rows after a mutation, and that `setQueryData` +
   targeted `lists()` invalidation settles correctly when the response is slow.
6. **URL prefix.** Confirm `api/admin/portal/v1/promotion-types` (no leading
   slash) actually reaches the documented `/portal/v1/...` route.
7. **`AbortSignal`** is forwarded and stale requests really cancel on fast
   navigation and fast typing.
8. **`imageUrl`** round-trips: upload → save → reopen → edit → save unchanged.
9. **Permissions end to end** with a real token carrying
   `promotion_management:view` only, then `:edit`, then neither.

---

## 18. What could not be verified from source

- The #2091 contract itself (endpoints, envelopes, roles) — supplied by the
  brief, absent from this repository.
- Anything at all about the #2498 contract. There is none.
- Whether the gateway maps `/portal/v1/...` to `api/admin/portal/v1/...` for
  this resource (§5).
- Whether `card-gift-offer` is the intended #2092 deliverable, and whether it
  should be retired (§10.1). Source names no ticket.
- Whether `WithGuard` permission arrays are OR or AND for a newly added route,
  given the known Theme-edit `requireAll` exception (§9 point 5).
- Whether `createImageBitmap` decodes SVG in the browsers this admin supports
  (§10.3).
- Whether Rolldown/Oxc would tree-shake the mock service out once
  `PROMOTION_DATA_SOURCE` is `'api'`. **Not claimed. Not proven.** (§16)
- Whether `promotion_management:create` exists as a backend role (§9 point 4).
- Whether the three detail tabs, the exact four display-status labels and the
  1:1-with-SVG image rule are final business requirements. They came from the
  brief, not from source.

**And, stated plainly as the repository constraints require:** this repository
has **no test runner**. `npm run typecheck`, `npm run lint`, `npm run prettier`
and `npm run build` prove **nothing** about browser behaviour, authentication,
permissions, routing at runtime, or API behaviour. **Mocked data proves nothing
whatsoever about the real contract.** Everything in §14 is invented, and a green
build over invented fixtures is not evidence that this feature works.

Nothing in this run was executed: no `typecheck`, `lint`, `prettier` or `build`
was run, because no source file was modified.

---

## 19. Handoff and follow-ups

**Decisions taken in this plan:** new module under
`src/modules/products/promotion-management/promotion/` (§10.1); mock boundary at
Option (B), because Option (A) does not exist (§13); Theme's `queryOptions`
factory as the data-layer reference, splash-screen as the wiring reference
(§7.2); i18n container `PromotionManagement.{common|promotion}.*` (§11).

**Blocking questions for the team, in priority order:**

1. Is `imageUrl` a URL string, an asset id, or multipart? (§12.1 — ask first.)
2. Does `promotion_management:create` exist, or is create gated by `:edit`? (§9)
3. `products/` or `system/` as the module parent? (§10.1, §11)
4. Should the mock live behind a dynamic `import()` guarded by
   `import.meta.env.DEV` for a build-time exclusion guarantee, rather than the
   literal constant? (§16)
5. Is `card-gift-offer` the #2092 deliverable, and should it be retired? (§10.1)
6. Is the 1:1-including-SVG-`viewBox` image rule actually required? It is new
   code either way. (§10.3)

**Documentation follow-ups (out of scope for this read-only run):**
`.claude/rules/03-api-service.md:9` and
`.claude/PROJECT_CONTEXT.md:118,474,550,960,1377-1386` describe an
`ApiFetcher` mock mechanism that was deleted in `c75d1420`. They should be
corrected before the next reader plans against it. `CLAUDE.md`'s snapshot
revision (`070ede66` / `develop`) is also stale against this checkout
(`6dc0c45c` / `fixbug/vuongnq/theme-lock_2345`).

**Do not touch:** `src/utils/api-service.ts`,
`src/modules/products/configuration/card-gift-offer/**`,
`src/modules/products/attractive-offer/**`,
`src/modules/products/configuration/list-product/card-gift-offer-fields.tsx`,
`src/types/card-gift-offer.d.ts`, and the `product_card_gift:*` permissions.
