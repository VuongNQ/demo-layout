---
name: platform-routing
description: Plan, implement, or review platform routes, route metadata, lazy pages, navigation, redirects, deep links, and router integration in demo-layout. Skip visual-only component work.
---

# Platform routing

1. Inspect the actual checkout, `src/routes/`, `src/menu/`, route callers, platform exports, `src/App.tsx`, Vite base, Pages fallback and relevant reports. Treat missing T1/T2 code as unavailable. Check the installed React Router 7.1.1 types before using `route.lazy`; current web examples may target newer versions.
2. Build a route matrix before changing shared routing. Keep each platform's metadata and page imports with that platform. Keep matching-critical `path`, `index` and child topology statically available; lazy-load implementation only. Assign one owner for root router composition.
3. Map every unscoped Claude URL explicitly to `/claude/*` with params, search and hash. Preserve list-child drawers, sibling full-page routes, navigation destinations and direct-load drawer close behavior. Keep `import.meta.env.BASE_URL`, Vite base and `dist/404.html` fallback.
4. On an authorized implementation, edit only assigned route and navigation files. Validate with `npm run typecheck`, `npm run build`, `git diff --check`, and affected browser/deep-link checks when possible. Return the route matrix, export contracts, exact results, static inferences, runtime evidence and unverified cases. Do not claim Pages behavior from a local build alone.
