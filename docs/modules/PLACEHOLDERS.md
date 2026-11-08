# Placeholder top-level modules

> Verified against revision `8562c125`, branch `improve/vuongnq`, 2026-11-04. Static source inspection only.

This file documents top-level entries under `src/modules/` that are placeholders **in their entirety** — every route they expose renders a static-text stub with no real implementation behind it. Placeholder pages that live inside an otherwise-real module (for example the three stubs inside `src/modules/notifications/`) are documented in that module's own `OVERVIEW.md`, not here.

## `src/modules/blacklist/`

3 files, all static-text stubs (`find src/modules/blacklist -type f`):

| Route | Guard | Component file | Content |
| --- | --- | --- | --- |
| `blacklist/devices` | `AuthGuard` only (`src/routes/main.routes.tsx:351`) | `src/modules/blacklist/devices.blacklist.tsx` | `export default function Devices() { return <>Devices</>; }` |
| `blacklist/identification` | `AuthGuard` only (`main.routes.tsx:347-350`) | `src/modules/blacklist/identification.blacklist.tsx` | `export default function Identification() { return <>identification</>; }` |
| `blacklist/portrait` | `AuthGuard` only (`main.routes.tsx:346`) | `src/modules/blacklist/portrait.blacklist.tsx` | `export default function Portrait() { return <>portrait</>; }` |

None of the three routes carries a `permissions` array. Business behavior (what a real blacklist feature would need — device/portrait/identification blacklisting rules, data source, permissions) is unknown from source.

## `src/modules/transactions/`

1 file, a static-text stub:

| Route | Guard | Component file | Content |
| --- | --- | --- | --- |
| `transaction/list` | `AuthGuard` only (`main.routes.tsx:469`) | `src/modules/transactions/list.transaction.tsx` | `export default function ListTransaction() { return <>list transaction</>; }` |

Business behavior is unknown from source.

## `src/modules/humanities-program.module.tsx`

A single loose file (not a directory), a static-text stub:

| Route | Guard | Component file | Content |
| --- | --- | --- | --- |
| `humanities-program` | `AuthGuard` only (`main.routes.tsx:470`) | `src/modules/humanities-program.module.tsx` | `export default function HumanitiesProgram() { return <>HumanitiesProgram</>; }` |

Business behavior is unknown from source.

## If any of these become real

If a future refresh finds one of these three entries has gained a real implementation (more than a static-text return, actual state/API/forms), remove it from this file and create a full `docs/modules/<module>/OVERVIEW.md` for it instead, following the template established in `docs/modules/notifications/OVERVIEW.md`.
