# Codex guidance for demo-layout

This repository is a fictional HDS Admin Next UI playground, not production HDS Admin. It uses React 18, TypeScript, React Router 7, Ant Design 5 and Vite. The intended areas are Claude, ChatGPT and Compare; inspect the checkout because a planned area may be absent.

## Evidence and ownership

Use the current checkout as the source of implementation truth. Read `package.json` and `README.md` for scripts and data limits, `docs/design-system/README.md` and relevant pages for decision status, then the playground plan and integration audit in `docs/reports/2026-11-07/` for proposed architecture and recovery status. Copied HDS documents describe another repository; verify their source paths here before using them. Separate verified behavior, inference and proposals.

Each platform owns its route metadata, lazy page imports, navigation, shell, theme and feature behavior. One assigned integrator owns `src/routes/router.tsx`, root selection and legacy redirects; parallel terminals must not edit that shared file independently. Keep matching-critical `path`, `index` and children static when using lazy route implementations. Preserve the React Router basename and GitHub Pages fallback.

Preserve all Claude screens, experiments, nested drawer versus sibling full-page topology, navigation and unscoped deep links, including route params, query and hash. Preserve Ant Design `Form`/`FormInstance` as form-state owner. Use fictional demo data only; never add production customer data, secrets, production API connections or change production contracts.

Use Design System labels literally: approved decisions, adopted targets, candidates, legacy compatibility, open team decisions and unverified claims are different. Do not promote external guidance or unresolved tokens to production standards. WCAG 2.2 AA is a target, not an untested compliance claim. Keep platform styles and themes scoped.

## Parallel work and validation

Before edits, inspect `git status --short --branch`, `git rev-parse HEAD` and `git worktree list --porcelain`; identify your worktree and owned files. Preserve uncommitted and untracked work. Never create `.worktrees/` inside this repository. Any auxiliary Git worktree must be outside the main checkout. Do not use `codex --worktree` until its destination is verified safe. Never automatically create, move, delete, prune, reset, clean, merge, cherry-pick or discard worktree changes. Do not attempt T1/T2 recovery from stale registrations without a separate task. Do not change Claude Code profiles or copy the Jobs-to-home Codex profile.

For authorized source changes, use actual `package.json` scripts (`npm run typecheck`, `npm run build`) and `git diff --check` when available. Test affected routes, browser interactions and accessibility where tooling exists; report what was actually run. Do not infer browser proof from static checks. Do not install dependencies, commit, push or deploy without task-specific authorization.

When a Markdown report is requested, record author/date, branch/revision and worktree path, owned/changed files, evidence, commands and results, risks, unverified behavior and `NEEDS-TEAM-DECISION`. Keep its claims limited to observed evidence.
