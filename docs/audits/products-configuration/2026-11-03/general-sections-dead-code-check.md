# general-sections dead-code check (2026-11-03)

Follow-up to `docs/audits/products-configuration/2026-11-03-cash-loan-settings-form.md`
section 3 and the subsequent cleanup task that deleted the four other confirmed-dead
files from this directory tree. This check covers the three files that remained in
`src/modules/products/configuration/industry-product/edit/general-sections/` after
that cleanup.

## Verdicts

| File | Export | Verdict |
| --- | --- | --- |
| `src/modules/products/configuration/industry-product/edit/general-sections/display-schedule.tsx` | `default function DisplayScheduleSetting` (+ local type `DisplayScheduleSettingProps`) | **DEAD** (CONFIRMED) |
| `src/modules/products/configuration/industry-product/edit/general-sections/image.tsx` | `default function ImageSetting` (+ local type `ImageSettingProps`) | **DEAD** (CONFIRMED) |
| `src/modules/products/configuration/industry-product/edit/general-sections/signing-method.tsx` | `default function SigningMethodSetting` | **DEAD** (CONFIRMED) |

No file is `NEEDS-TEAM-DECISION` on the dead-code question itself. There is no
dynamic or string-path import to these files, and the directory has no barrel or
index file. (A separate product question is flagged below — see "Observation for
the team" — but it does not change the dead-code verdict.)

## Files checked

- The three files above, plus `edit/general.tsx` (the live general-tab composer),
  `general/cash-loan.tsx`, `general/credit-card.tsx`, `edit/form.tsx`, and
  `src/routes/pages.tsx` / `src/routes/form.routes.tsx` (route mount).
- The directory `general-sections/` contains exactly these three files
  (`display-schedule.tsx` 2022 B, `image.tsx` 734 B, `signing-method.tsx` 793 B).
  `git log` shows the last touch in commit `2902022e`, the previous deletion commit.

## Grep evidence (run from repo root, scope `src/`)

1. Component / exported names. Each name appears only in its own file:
   - `grep -rn "DisplayScheduleSetting" src/` → only lines 10, 14, 16 of
     `display-schedule.tsx` (type declaration, `export default function`, props
     destructuring). No other file.
   - `grep -rn "ImageSetting" src/` → only lines 6, 10 of `image.tsx`. No other file.
   - `grep -rn "SigningMethodSetting" src/` → only line 6 of `signing-method.tsx`.
     No other file.

2. Bare path and basename references:
   - `grep -rn "general-sections" src/`: **0 matches** (exit 1).
   - `grep -rn "display-schedule" src/`: **0 matches**.
   - `grep -rn "signing-method" src/`: **0 matches**.
   - `grep -rnE "general-sections/image|/image'|/image\"" src/`: **0 matches**.

3. Combined sweep:
   `grep -rn -E "DisplaySchedule|ImageSetting|SigningMethod|display-schedule|signing-method|general-sections" src/`.
   The only hits outside the three files are `src/types/loan-order.d.ts:231`
   (`configSigningMethod: string`) and
   `src/modules/order/loan-order-list/view/loan-order-detail.tsx:725` and
   `.../view/contract.tsx:269` (`configSigningMethod` on order data). These are
   unrelated identifiers (an order payload field), not references to
   `SigningMethodSetting`. False positives, excluded.

4. Dynamic imports:
   `grep -rn -E "import\(|require\(" src/modules/products/configuration/industry-product src/routes`
   matched only `src/routes/pages.tsx` lazy imports. None points at
   `general-sections` or at the three files.

5. Sibling and parent imports:
   `grep -rn "from '\./general'\|from '\.\./general'" src/` matched `edit/form.tsx:3`
   (`import EditGeneral from './general'`) and `view/form.tsx` (`import General from
   './general'`). None matches `general-sections`.

## Render-tree trace (independent of grep absence)

```text
src/routes/form.routes.tsx:439         Page={EditIndustry}
  -> src/routes/pages.tsx:14           EditIndustry = lazy(() => import('.../industry-product/edit/form'))
  -> edit/form.tsx:3                   import EditGeneral from './general'
     edit/form.tsx:18                  sidebar[0].form = <EditGeneral />
  -> edit/general.tsx:27-29            import CashLoanGeneral from '../general/cash-loan'
                                        import CreditCardGeneral from '../general/credit-card'
                                        import { GeneralReadOnlyProvider } from '../general/read-only-provider'
     edit/general.tsx:118-119          {code === 'CL' && <CashLoanGeneral />}
                                        {code === 'CD' && <CreditCardGeneral />}
  -> general/cash-loan.tsx             imports ./sections/basic-information, ./sections/description, ./sections/step-amount
     general/credit-card.tsx           imports ./sections/basic-information, ./sections/description
```

- Neither `general/cash-loan.tsx` nor `general/credit-card.tsx` imports anything
  from `edit/general-sections/`. The live tree is `general/sections/*` only.
- `edit/general.tsx` does not import any of the three files.
- Conclusion: none of the three components is mounted in the live render tree for
  either product code (`CL` or `CD`).

## Observation for the team (not part of the dead-code verdicts)

The three dead files are the only JSX that rendered three fields:

- `image` (`UploadFileComp`, category `CONTENT`) with hidden `keyImage`,
- `signingMethod` (multi-select), and
- `isSchedule` / `startDate` / `endDate` (display schedule).

The live `edit/general.tsx` still populates those values into the form: lines
64-74 destructure `startDate`, `endDate`, `signingMethod`, `image`, `keyImage` and
call `form.setFieldsValue`. It renders no control for them. A grep for
`name='image'`, `name='isSchedule'`, `name='signingMethod'` in the
industry-product tree returns only the dead files, and `UploadFileComp` appears
only in `image.tsx`.

Deleting these files should not change rendered output, since nothing currently
renders them. Whether the live product should show these fields again is a
product question, not a dead-code question — flag as `NEEDS-TEAM-DECISION` with
product before treating the fields themselves (as opposed to the dead files) as
settled. Also note: the `setFieldsValue` writes in `general.tsx` populating these
unregistered field names are only verified as static code; whether AntD Form's
default `preserve` behavior actually keeps those values in the submitted draft
was not verified at runtime in this check.

## Limitations

- Searches covered `src/` only. Repo-root config, docs, and non-`src` files were
  not searched. None are expected to import these components.
- Static evidence only. No typecheck, build, or app run was performed in this
  check; nothing here proves runtime behavior.

## Recommended handoff

- Verdict: all three files are dead and safe to delete as a dead-code cleanup,
  with no import, route, or lazy-load changes needed.
- Before deleting, confirm with product that the removed image, signing-method,
  and schedule UI is intentionally absent from the live edit tab (see
  "Observation for the team"). Deleting the files does not require changing the
  form-value mapping in `edit/general.tsx`, which should be left alone in that
  task unless product decides otherwise.
- Verify after deletion: `grep -rn "general-sections" src/` returns 0 matches,
  `npm run typecheck` passes, and the industry-product edit General tab renders
  unchanged for `CL` and `CD` in a browser.
