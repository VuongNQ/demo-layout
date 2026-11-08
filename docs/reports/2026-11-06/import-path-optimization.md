# Import path length/depth investigation — 2026-11-06

Branch: `improve/vuongnq/2656_sync-UI-simulator`
Revision: `51fffe8a1ab804112f0c0f773b50f891ada932f3`

Read-only investigation. No code, `tsconfig.json`, or Vite config changes
were made in this pass.

## Summary

Deep relative imports (`../../../` or deeper) are rare and concentrated in
two modules (`products`, `system`): 40 occurrences across 25 files, almost
all exactly 3 levels deep and resolving to a parent-submodule-owned
`queryKeys/`, `types/`, `utils/`, `components/`, or a sibling-submodule file
under the same parent feature (e.g. `theme-management/background-main` ->
`theme-management/topic`). None of the longest import paths found are
pathological (max depth seen is 4 levels of `../`). `@/modules/...` absolute
imports are a small fraction of all `@` imports overall (145 of 6002, ~2.4%),
and within that, `products` accounts for 93 of 145 (64%) simply because
`products` is the largest module by file count, not because of unusually
deep paths — the per-import segment depth after `modules/<domain>/` is
mostly 3-4 segments, matching ordinary `views/`, `components/`,
`hooks/`, `queryKeys/` feature-folder layout. There are no `index.ts` barrel
files anywhere under `src/modules/**`; the only `index.tsx` files at a
feature/module root are route-page entry points (lazy-loaded from
`src/routes/pages.tsx`), consistent with the existing component-folder entry
convention in `.claude/rules/07-component.md`, not a public-API barrel
pattern. There is exactly one alias configured (`@` -> `./src`); no scoped
per-module alias exists today.

Overall: the import-depth problem is small in absolute terms and already
well-contained by the existing local-first ownership model
(`.claude/rules/01-architecture.md`). The clearest, lowest-risk improvement
is case-by-case: switch a handful of `@/modules/...`-absolute imports to
short same-submodule relative imports (no config change), and leave the
3-level parent-submodule relative imports as-is, since collapsing them
behind a barrel or new alias would add indirection/circular-import surface
for a cosmetic saving of a few characters.

## Evidence

### 1. Relative imports with 3+ levels of `../` under `src/modules/**`

Command: `grep -rnE "from ['\"](\.\./){3,}" src/modules --include="*.ts" --include="*.tsx"`

- Total occurrences: **40**, across **25 files**.
- By module: `products` 14 files, `system` 11 files. No occurrences in
  `users`, `contents`, `notifications`, `order`, `blacklist`,
  `transactions`.
- Of the 40, 3 occurrences are 4 levels deep (`../../../../`); the rest are
  exactly 3 levels.

4-level examples (the deepest found):

```
src/modules/products/simulation/edit/form.tsx:20:
  } from '../../../../redux/slices/simulation.slice';
src/modules/products/simulation/view/form.tsx:5:
  import { getSimulationConfigs } from '../../../../redux/slices/simulation.slice';
src/modules/products/simulation/display-order/navigation.ts:1:
  import { PageURLs } from '../../../../utils/navigate';
```

These three reach out of `src/modules` entirely to `src/redux/` and
`src/utils/` — they are not module-internal depth, they are legacy
Redux-slice/global-util imports that happen to be expressed relatively
instead of via the `@` alias. This is a style inconsistency (the file could
use `@/redux/slices/simulation.slice` and `@/utils/navigate` instead), not a
depth problem — the alias form would be no shorter.

3-level examples, representative of the two real patterns found:

**Pattern A — reaching a parent-submodule-owned `queryKeys`/`types`/`utils`
file from a nested `components/` or `views/` folder** (promotion-management):

```
src/modules/products/promotion-management/promotion/components/PromotionFilterBar/index.tsx:7:
  import { promotionTypeLookupQueryKeys } from '../../../queryKeys/promotion-type.query-keys';
src/modules/products/promotion-management/promotion/views/PromotionEditPage/index.tsx:11:
  import { promotionTypeLookupQueryKeys } from '../../../queryKeys/promotion-type.query-keys';
src/modules/products/promotion-management/promotion-type/components/PromotionTypeDetailDrawer/hooks/usePromotionTypeDetailDrawer.hook.tsx:14:
  import { promotionTypeQueryKeys } from '../../../queryKeys/promotion-type.query-keys';
```

Count of this exact parent-level-shared-folder pattern inside
`promotion-management`: **5** occurrences
(`grep -rnE "from ['\"]\.\./\.\./\.\./(queryKeys|types)/" src/modules/products/promotion-management`).

**Pattern B — one Theme Management child submodule importing a sibling
child submodule's `queryKeys`/`types`/shared `components`** (confirmed
one-directional, see "Barrel/circularity check" below):

```
src/modules/system/theme-management/background-main/views/BackgroundMainCreatePage/index.tsx:10:
  import { topicQueryKeys } from '../../../topic/queryKeys/topic.query-keys';
src/modules/system/theme-management/background-main/views/BackgroundMainCreatePage/index.tsx:11:
  import { THEME_CATEGORY_DISPLAY_STATUS } from '../../../topic/types/topic.types';
src/modules/system/theme-management/background-main-lock/views/BackgroundMainLockPage/index.tsx:18:
  import { backgroundMainQueryKeys } from '../../../background-main/queryKeys/background-main.query-keys';
```

And the scheme-sync module-level stylesheet, imported repeatedly from nested
tab components:

```
src/modules/products/configuration/scheme-sync/components/CreditCardTab/CreditCardResultsTable/index.tsx:9:
  import schemeSyncStyles from '../../../scheme-sync.module.scss';
src/modules/products/configuration/scheme-sync/import/components/ImportHistoryTab/index.tsx:6:
  import schemeSyncStyles from '../../../scheme-sync.module.scss';
```

### 2. `@/modules/...` absolute imports — depth and distribution

Command: `grep -rhoE "from ['\"]@/modules/[^'\"]+['\"]" src/ --include="*.ts" --include="*.tsx"`

- Total: **145** imports repo-wide use `@/modules/...`.
- By domain: `products` 93, `users` 31, `system` 9, `contents` 8,
  `notifications` 4.
- Segment-depth distribution (folders after `modules/<domain>/`):
  - depth 2: 6
  - depth 3: 71
  - depth 4: 61
  - depth 5: 7
- Depth-5 examples (the deepest `@/modules` imports found, all legitimate
  cross-submodule or redux-wiring references, not accidental):

```
src/modules/products/configuration/display-information-set/components/DisplayInformationProductLabelsField.tsx:6:
  from '@/modules/products/configuration/product-labels/cash-loan/hooks/cashLoanLabelQueries'
src/modules/products/configuration/cash-loan/components/ProductLabelsField.tsx:6:
  from '@/modules/products/configuration/product-labels/cash-loan/hooks/cashLoanLabelQueries'
src/redux/slices.ts:30:
  from '@/modules/system/maintenance/stores/redux/slices/system-maintenance.slice'
src/redux/slices/notification-list.slice.ts:5:
  from '@/modules/notifications/configuration/list-notification/edit/settings/form'
```

For comparison, `@/modules` is a small share of all `@`-aliased imports:

```
2224 @/components
1034 @/redux
 705 @/utils
 542 @/constants
 530 @/hooks
 434 @/types
 145 @/modules
  97 @/layouts
  90 @/enums
  82 @/services
  82 @/assets
   7 @/queryKeys
   7 @/guards
   5 @/pages
   4 @/helpers
```

(`6002` total `@/...` imports found repo-wide.)

### 3. Barrel (`index.ts`) files under `src/modules/**`

- `find src/modules -name "index.ts"` -> **0 results**. There are no
  module-level re-export barrels anywhere under `src/modules`.
- `find src/modules -name "index.tsx"` -> **89 results**, all of them
  component-folder entry points per the existing
  `.claude/rules/07-component.md` convention (`index.tsx` as a component
  folder's public entry), not feature-level API barrels.
- Only three of those 89 sit at a module/submodule root rather than inside a
  nested component folder, and all three are route-page components consumed
  exactly once, by `src/routes/pages.tsx`, for lazy-loading — not re-exported
  internals:

```
src/routes/pages.tsx:11:  export const AdministrativeUnitList = lazy(() => import('@/modules/system/administrative-unit'));
src/routes/pages.tsx:141: export const VersionSettings = lazy(() => import('@/modules/system/version-settings'));
src/routes/pages.tsx:142: export const SystemManagement = lazy(() => import('@/modules/system/system-management'));
```

So the repo currently has **zero** "re-export but barely consumed" barrel
risk to clean up, and zero existing barrels to generalize from.

### 4. Barrel/circularity check for the Theme Management sibling-submodule case

Confirmed the cross-submodule dependency found in Pattern B is
one-directional, not circular, at present:

- `background-main` imports from `topic` (`queryKeys`, `types`): yes, 2 files.
- `topic` imports from `background-main`: **0** occurrences.
- `background-main-lock` imports from `background-main`
  (`queryKeys`/`types`/`components`): yes, 1 file.
- `background-main` imports from `background-main-lock`: not found.

So today there is no cycle, but a barrel that re-exported "everything in
`topic/`" from a single `index.ts`, consumed by `background-main`, would
create exactly the shape that risks a future cycle if `topic` ever needs
something from `background-main` (both are siblings under the same parent
`theme-management` feature, and `.claude/rules/01-architecture.md` already
treats this as an approved but scoped structure, not a precedent to widen).

### 5. `tsconfig`/Vite alias configuration

- `tsconfig.app.json` (`compilerOptions.paths`): only `"@/*": ["./src/*"]`.
- `vite.config.*` (`resolve.alias`): only
  `{ find: '@', replacement: path.resolve(import.meta.dirname, './src') }`,
  plus `tsconfigPaths: true`.
- No other alias (no `@products`, `@components`, `@modules`, etc.) exists in
  either config today.

## Proposed scheme

1. **No new barrel `index.ts` files.** The codebase has zero today, and the
   one place with a plausible candidate (`promotion-management`'s shared
   `queryKeys/`/`types/` folders, or `theme-management`'s sibling-submodule
   folders) is exactly the shape that risks a future circular import once a
   barrel re-exports a whole folder instead of the one symbol a consumer
   needs, and plain named re-exports from an `index.ts` barrel also disable
   some tree-shaking/sideEffects analysis for Rolldown/Oxc versus importing
   the concrete file directly. This matches `.claude/rules/01-architecture.md`
   local-first ownership guidance: promote only with multiple genuine
   consumers and a stable contract, which 5-7 call sites per case do not
   yet clearly establish.

2. **No new scoped alias (e.g. `@products/*`).** `@/modules/...` absolute
   imports are only 145 of 6002 `@` imports (~2.4%), and within `products`
   the per-import depth (mostly 3-4 segments) already matches the existing
   `views/components/hooks/queryKeys` folder convention — a `@products/*`
   alias would save at most one path segment (`modules/products/` ->
   nothing) while adding a second alias to maintain in both `tsconfig.app.json`
   and `vite.config.*`, for a benefit that import-frequency evidence does not
   justify yet.

3. **Case-by-case: prefer a short relative import over `@/modules/...` when
   both files are in the same submodule.** This needs no config change and
   is a pure style preference; it is not something to sweep across the
   repo, only to apply if/when those specific files are next substantially
   touched (per `.claude/rules/00-general.md` — no opportunistic repo-wide
   refactors). Example, if `cashLoanLabelQueries` and
   `ProductLabelsField.tsx` were being touched in the same change inside
   `product-labels/cash-loan/`:

   Before (absolute, current):
   ```ts
   import { useCashLoanLabelQueries } from '@/modules/products/configuration/product-labels/cash-loan/hooks/cashLoanLabelQueries';
   ```

   After (relative, same submodule, if touched for another reason):
   ```ts
   import { useCashLoanLabelQueries } from '../hooks/cashLoanLabelQueries';
   ```

4. **Leave the two confirmed parent/sibling-submodule relative-import
   patterns (Pattern A and Pattern B above) as plain relative imports.**
   They are already the shortest honest expression of "this file depends on
   a sibling/parent feature folder" and are well below any problematic
   depth (3, occasionally 4, levels). Converting them to
   `@/modules/products/promotion-management/queryKeys/...` or
   `@/modules/system/theme-management/topic/queryKeys/...` would make the
   import *longer*, not shorter, so `@`-absolute is not an improvement here
   either.

5. **Fix the 3 outlier 4-level relative imports that reach past
   `src/modules` into `src/redux`/`src/utils`**, by switching those three
   specific call sites to the `@` alias, the next time those exact files are
   substantially touched (not as a standalone sweep):

   Before:
   ```ts
   import { getSimulationConfigs } from '../../../../redux/slices/simulation.slice';
   ```
   After:
   ```ts
   import { getSimulationConfigs } from '@/redux/slices/simulation.slice';
   ```

## Tradeoffs

- A scoped alias per top-level module (`@products`, `@system`, ...) would
  make the most-nested `@/modules/products/...` imports marginally shorter,
  but doubles the alias surface to keep in sync across
  `tsconfig.app.json` and `vite.config.*`, and current import-frequency data
  (2.4% of all `@` imports go through `@/modules` at all) does not show a
  real pain point large enough to justify that maintenance cost.
- Barrels would shorten some import statements but reduce the directness of
  "which concrete file does this come from" during review, and — per the
  circularity check above — create exactly the shape (sibling submodules,
  or a submodule plus its parent's shared folder) where a future addition
  could introduce a real cycle; Rolldown/Oxc tree-shaking is also most
  reliable against direct-file imports rather than re-exported barrel
  entries.
- Switching `@/modules/...` to relative imports only pays off within the
  same submodule; past that boundary (crossing into a sibling or parent
  submodule) relative imports and `@`-absolute imports are roughly the same
  length, so the choice there is really about reinforcing "this crosses a
  feature/ownership boundary" (favoring `@`-absolute) versus "this is local
  machinery" (favoring relative) — a readability signal, not a character-count
  one.

## Open questions (NEEDS-TEAM-DECISION)

- Whether `promotion-management`'s parent-level shared `queryKeys/`/`types/`
  folders (consumed by both `promotion/` and `promotion-type/` children)
  should be documented as an approved scoped convention the way
  `theme-management`'s `background-main`/`topic` structure already is in
  `.claude/rules/01-architecture.md` — this investigation found the same
  parent-shared-folder shape reused twice in the codebase (`promotion-management`,
  `theme-management`) but only one of the two is currently codified as an
  approved structure.
- Whether the preference in proposal item 3 (short relative import over
  `@/modules/...` within the same submodule) is worth adding to
  `.claude/rules/07-component.md` or `.claude/rules/01-architecture.md` as an
  explicit `SHOULD`, or left as implicit style latitude — this report takes
  no position and defers to the team.

## Out of scope

- No `tsconfig.json`, `tsconfig.app.json`, or `vite.config.*` changes were
  made.
- No `src/` file was edited.
- No alias was added, removed, or renamed.
- No barrel `index.ts` file was created.
- Measuring actual circular-import risk with a dedicated tool (e.g. `madge`)
  was not done — it is not installed in `node_modules`/`package.json`, and
  installing new tooling was out of scope for a read-only investigation
  pass; the circularity assessment above is based on direct grep checks of
  the two concrete cross-submodule cases found, not a full dependency-graph
  analysis of the repository.
