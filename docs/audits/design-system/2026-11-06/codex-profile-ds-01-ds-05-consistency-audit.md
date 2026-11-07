# Codex Profile DS-01–DS-05 Consistency Audit

## Metadata

- **Author:** Vuowng
- **Date:** 2026-11-06
- **Branch:** `improve/vuongnq/2729_sync_CL`
- **Revision:** `dd5521dfb28afa1ce9426aeb990644ccb4f21542`
- **Mode:** Read-only profile and documentation audit; only this report was created.

## 1. Executive summary

The checkout contains **4 active agent definitions, 8 active skills, and 12
active rules**. The profile is routed through `AGENTS.md`, `.codex/README.md`,
the dated knowledge snapshot and architecture, and the rule selected for the
task. The four agents and eight skills route to existing rules and preserve
current contracts; most are conditionally relevant to DS work rather than
duplicating DS decisions. No design-specific agent or skill is required for
the documented routing to function.

Finding totals: **2 MUST FIX**, **2 SHOULD IMPROVE**, **0 OPTIONAL**, **7 NO
CHANGE**, and **5 NEEDS-TEAM-DECISION**. These count audit determinations, not
profile files. The form-component audit link target is absent but explicitly
optional in rule 05, so it is not counted as a broken reference.

The active profile is **not yet fully ready to guide DS-01 through DS-05
implementation**:

1. `.codex/rules/10-styling.md:238-242` still calls the numerical type scale
   **CANDIDATE**, while the supplied latest approved DS-01 baseline specifies
   exact roles and values. The current shared `typography.md` and its index also
   still mark the scale as candidate, so the canonical shared documentation
   must be reconciled before the Codex rule is updated.
2. `.codex/rules/07-component.md:237-240` says a distinct StatusBadge visual
   treatment needs separate design approval. DS-05 now approves the exact
   error/accent pairs and eKYC mappings; implementation still needs a bounded
   task, but the design decision is no longer pending.

The DS-03 palette and semantic/runtime boundaries, DS-02 Scheme Sync boundary,
DS-04 WCAG target, and the newer DS-05 styling reference in
`.codex/rules/10-styling.md:248-252` are aligned. The shared Design System
contains historical records with superseded colors; the active Codex rules do
not use `#2B479E` or `#FFD200` as current targets. One linked DS-03 decision
report still presents the former values as approved without a prominent
superseded label, which creates a handoff ambiguity but does not override the
canonical current palette or `.codex/README.md`'s source-of-truth hierarchy.

**Readiness:** after the DS-01 documentation/rule reconciliation and the DS-05
component-rule clarification, the Codex profile can guide separately scoped
implementation work. Runtime behavior remains legacy-compatible until an
implementation task is approved. Shared typography and StatusBadge changes
still require risk-appropriate review and rendered validation.

## 2. Audit scope and methodology

The current checkout was used as authority for inventory, paths, line
references, and active instructions. Read `AGENTS.md`, `.codex/README.md`, all
4 `.codex/agents/*.toml`, all 8 `.agents/skills/*/SKILL.md`, all 12
`.codex/rules/*.md`, and the two `.codex/knowledge/` files used by the entry
point and agents. Inspected the shared Design System index, Color, Typography,
and Status pages; the DS-05 final sync report and consumer audit; the approved
brand-color update; and relevant DS-03 records. Checked the five DS sections,
the listed profile search terms, source-of-truth/dispatch instructions,
technical guardrails, local references, package scripts, and current git
status.

The inventory excludes `.DS_Store` files and historical reports, which are not
active profile instructions. `.codex/knowledge/PROJECT_CONTEXT.md` is treated
as a dated snapshot, per `.codex/README.md:5-11`; factual claims and paths were
checked where relevant. No `CLAUDE.md` or `.claude/` file was opened. No agent
was spawned, and no application tests or runtime checks were run.

### Classification definitions

- **MUST FIX:** active contradiction with the supplied approved baseline or a
  broken active reference.
- **SHOULD IMPROVE:** ambiguity or incomplete guardrail that could misdirect a
  future handoff but does not itself contradict an approved decision.
- **OPTIONAL:** maintainability enhancement without a current material defect.
- **NO CHANGE:** aligned, correctly scoped, or not relevant to this baseline.
- **NEEDS-TEAM-DECISION:** an unresolved design or domain choice; do not infer
  an answer from implementation.

## 3. Active Codex profile inventory

All 24 agent, skill, and rule files listed below exist in the current checkout.
“Conditional” means the file applies when its task touches that design area;
profile files are not required to repeat every DS value. Canonical values
belong in `docs/design-system/`.

| File path | Type | Active status | DS relevance / applicable sections | Canonical references |
| --- | --- | --- | --- | --- |
| `.codex/agents/codebase-analyzer.toml` | Agent | Active; read-only analysis | Conditional DS-01–DS-05 for an affected module; classify current vs target | Reads relevant rules and module index; DS reached via rules 07/10 |
| `.codex/agents/feature-implementer.toml` | Agent | Active; bounded implementation | Conditional DS-01–DS-05 for UI work | Reads relevant rules; shared docs reached via rules 07/10 |
| `.codex/agents/frontend-reviewer.toml` | Agent | Active; read-only review | Conditional DS-01–DS-05 for changed UI | Reads relevant rules; review runtime limits are explicit |
| `.codex/agents/legacy-refactorer.toml` | Agent | Active; explicit refactor only | Conditional DS-01–DS-05 when presentation is touched | Routes styling work to rule 10 and relevant rules |
| `.agents/skills/analyze-module/SKILL.md` | Skill | Active; read-only module map | Conditional to all DS sections when the module uses shared UI/styles | Relevant rules and module docs |
| `.agents/skills/audit-redux-ownership/SKILL.md` | Skill | Active; read-only state audit | None directly; state-owner compatibility only | Rules 01/03/04 |
| `.agents/skills/extract-thunk-service/SKILL.md` | Skill | Active; single-slice extraction | None directly; preserves server-state ownership | Rules 03/04/08 |
| `.agents/skills/fix-bug/SKILL.md` | Skill | Active; defect workflow | Conditional if defect is visual/accessibility/status behavior | Relevant rules and module docs |
| `.agents/skills/implement-feature/SKILL.md` | Skill | Active; feature workflow | Conditional DS-01–DS-05 for UI implementation | Relevant rules and module docs |
| `.agents/skills/refresh-context/SKILL.md` | Skill | Active; explicit documentation refresh | Not a DS implementation authority | Knowledge and module docs; no DS mapping mandate |
| `.agents/skills/review-code/SKILL.md` | Skill | Active; read-only code review | Conditional DS-01–DS-05 for a UI diff | Relevant rules; reviewer/runtime limitations explicit |
| `.agents/skills/trace-feature-flow/SKILL.md` | Skill | Active; read-only flow trace | Conditional DS-05 if a status consumer is in scope | Relevant rules and module docs |
| `.codex/rules/00-general.md` | Rule | Active; cross-cutting workflow | All sections indirectly through “relevant rules” and compatibility | Entry point and rule routing; no duplicated palette |
| `.codex/rules/01-architecture.md` | Rule | Active; ownership and compatibility | DS-02/legacy boundaries indirectly; no DS values | Rules 03/07/10 |
| `.codex/rules/02-typescript.md` | Rule | Active; type/data contracts | None directly | Rules 03/06 |
| `.codex/rules/03-api-service.md` | Rule | Active; transport and DTO boundary | None directly | Rules 01/04; no visual token guidance |
| `.codex/rules/04-state-management.md` | Rule | Active; one state owner | DS-02 only as feature-ownership compatibility | Architecture and state audit skill |
| `.codex/rules/05-form.md` | Rule | Active; AntD Form/Zod | DS-01 form-label role only when using typography docs; otherwise none | Optional form audit reference; the rule explicitly allows absence |
| `.codex/rules/06-routing-permission.md` | Rule | Active; route/auth permissions | None directly | Current route files and architecture; routes explicitly HIGH-RISK |
| `.codex/rules/07-component.md` | Rule | Active; components/status/accessibility | DS-04 and DS-05 directly; findings F-02 | `docs/design-system/status.md`, README, Color |
| `.codex/rules/08-refactoring.md` | Rule | Active; bounded refactor and compatibility | All sections indirectly when presentation is refactored | Rules 02/06/10 |
| `.codex/rules/09-testing.md` | Rule | Active; validation | DS-04 and visual validation limits | Rule 10; available package scripts |
| `.codex/rules/10-styling.md` | Rule | Active; design-system guidance | DS-01–DS-05 directly; findings F-01 and R-01 | Color, Typography, Status, Design System README |
| `.codex/rules/11-i18n.md` | Rule | Active; labels/locales | DS-05 localized labels; preserves feature ownership | Language files and feature owners |

### Entry points and supporting context

| File path | Role | Finding |
| --- | --- | --- |
| `AGENTS.md:3-20` | Codex entry point and task workflow | Requires current-source verification, relevant rules, risk assessment, and preserving user work. |
| `.codex/README.md:3-16` | Profile source-of-truth and delegation index | States rules are not auto-loaded; relevant rules must be selected. Historical reports are evidence, not architecture authority. |
| `.codex/README.md:17-27` | Skill/agent dispatch table | All referenced skill and agent names exist in the discovered inventory. |
| `.codex/knowledge/ARCHITECTURE.md` | Architecture/status vocabulary and risk map | Supports legacy compatibility, high-risk shared components, and route/auth risk. It is not the DS value source. |
| `.codex/knowledge/PROJECT_CONTEXT.md` | Dated current-state snapshot | Must remain subordinate to current source, as the README directs. |

There is no `config.toml` in `.codex/`. The profile uses `AGENTS.md`, the
Codex README/index, specialist TOML agents, project `SKILL.md` files, rules,
and supporting knowledge. No dedicated Design System audit skill or agent is
present; existing read-only analysis/review workflows and rules are sufficient
for this one audit and this absence is not a broken reference.

## 4. DS-01 through DS-05 alignment matrix

| Decision | Active Codex profile | Canonical shared documentation | Assessment |
| --- | --- | --- | --- |
| **DS-01 Typography** | Rule 10: Inter/cross-app direction is referenced, but the numerical scale is explicitly called **CANDIDATE** (`10-styling.md:238-242`). | `typography.md:24-37` and `README.md:36` still mark the scale candidate. The supplied approved baseline defines exact roles including component title and form label, which the current table does not fully represent. | **MUST FIX — F-01.** Profile and canonical docs conflict with the supplied approved status. Synchronize shared Typography first, then update rule 10. Keep runtime/feature exceptions distinct. |
| **DS-02 Scheme Sync** | Rule 10 keeps Scheme Sync action mapping deferred (`:248-252`); rules 01/10 preserve feature ownership and legacy styles. | Color guidance keeps Scheme Sync page/portal tokens local and retains feature ownership (`color.md:78,147,235`). | **NO CHANGE.** No auto-migration is implied. Blue primary, green publish, red action remain feature-scoped. |
| **DS-03 Color** | Rule 10 directs to canonical Color System, separates brand from semantic roles, preserves runtime aliases, and keeps focus unresolved (`:215-237`). No active Codex rule contains superseded `#2B479E` or `#FFD200` as current target. | Active palette at `color.md:186-221` has all five approved brand primitives and semantic targets. It distinguishes current `--primary-color: #dc2626` from target (`:229-235`). | **NO CHANGE** to values. Historical old-value material is retained; one linked decision report needs clearer superseded labeling (R-02). |
| **DS-04 Accessibility** | Rules 07 and 10 require contrast, visible focus, non-color cues, readability, and prohibit claims of conformance from static checks (`07-component.md:253-261`; `10-styling.md:243-247`). | Design System README and Color System define WCAG 2.2 AA and its limits (`README.md:39-42`; `color.md:32-60,180-184`). | **NO CHANGE.** The rules link to canonical thresholds and do not claim runtime compliance. Consider the focused alpha-token clarification in R-01. |
| **DS-05 StatusBadge** | Rule 10 now points to final target and eKYC mapping in status docs (`10-styling.md:248-252`); rule 07 retains a stale approval gate (`07-component.md:234-251`). | Status System and final sync report record approved error/accent pairs, eKYC mappings, compatibility, and contrast (`status.md:24-56,90-94`; sync report `:18-35,79-106`). | **MUST FIX — F-02.** Remove the implication that the design needs fresh approval; retain a separate implementation-scope gate. |

## 5. Detailed findings

### MUST FIX

#### F-01 — DS-01 scale is still labeled candidate

- **Evidence:** `.codex/rules/10-styling.md:238-242` says “the proposed numerical
  type scale is CANDIDATE, not approved.” The canonical page says
  `typography.md:24-37` “CANDIDATE — team review required; not approved” and
  asks the team to approve/revise it; `docs/design-system/README.md:36` calls
  it a candidate scale.
- **Conflict:** The approved baseline supplied for this audit sets exact
  typography targets: page title 24/32/600; section title 20/28/600; component
  title 16/24/600; body large 16/24/400; body 14/20/400; body emphasis
  14/20/600; form label 14/20/500; caption 12/16/400–500. The current shared
  table omits component title and form label, and permits alternate weights for
  page title/body large.
- **Risk:** New UI may follow stale candidate language or leave DS-01 roles
  underspecified. This concerns target guidance, not current rendered UI.
- **Proposed remediation:** First synchronize `docs/design-system/typography.md`
  and its index label with the already-approved role/value set, retaining
  current source and “not universally implemented” caveats. Then change
  `.codex/rules/10-styling.md:238-242` to direct agents to the approved
  typography roles in that canonical page rather than call the scale a
  candidate. Preserve Inter as default and Scheme Sync Be Vietnam Pro as a
  feature-scoped legacy exception.
- **Related decision:** DS-01.
- **Priority / risk:** P0 before using Codex to create or substantially change
  UI; high implementation impact if the contradictory target is copied
  broadly, moderate documentation-only remediation risk.
- **Approval:** No new design approval is needed if the supplied approved
  baseline is authoritative; confirm synchronization with the canonical doc
  owner because the checked-in page still requests team approval.
- **Expected effect:** Agents stop treating the approved scale as optional
  candidate guidance while preserving the difference between target and
  current implementation.
- **Validation:** Compare the canonical table and rule against all eight
  approved roles; confirm no assertion that runtime is uniform; verify Scheme
  Sync remains feature-scoped.

#### F-02 — Component rule asks for a new DS-05 design approval

- **Evidence:** `.codex/rules/07-component.md:234-240` says not to change CSS
  without approval and that a distinct future visual treatment “needs separate
  design approval.” Current approved targets are in
  `docs/design-system/status.md:24-35`: error `#B91C1C / #FEF2F2`; accent
  `#0E377B / #E8EFFB`; accent is non-error emphasis and its background is
  component-specific. Approved eKYC mappings are in `status.md:45-52`.
- **Conflict:** The design treatment and two eKYC mappings are already
  approved. The wording can make an implementer defer or re-request a settled
  design decision. It is still correct to require an explicit implementation
  scope and preserve the current runtime until that task is authorized.
- **Risk:** Inconsistent handoff from the shared component rule to the latest
  status reference; accidental remapping to `info`, or unnecessary decision
  churn.
- **Proposed remediation:** In `.codex/rules/07-component.md:234-251`, preserve
  the six-variant/API/feature-ownership rules, change the semantics to actual
  error/failure/rejection versus intentional non-error emphasis, state that the
  approved target is documented in `docs/design-system/status.md`, and say
  implementation remains a separately scoped change. Do not duplicate HEX
  values in the rule or imply more design approval is needed.
- **Related decision:** DS-05; DS-03 secondary-brand boundary; DS-04 labels and
  non-color meaning.
- **Priority / risk:** P0 before any shared StatusBadge implementation; high
  component impact because it is a shared primitive, low-to-moderate risk for
  documentation-only correction.
- **Approval:** No new design approval needed for the approved pair/mappings;
  normal explicit scope and review remain required for production changes.
- **Expected effect:** Codex will distinguish approved appearance from
  unimplemented runtime and not request re-approval for DS-05.
- **Validation:** Reconcile rule wording with `status.md` and final sync report;
  confirm no consumer mapping or contract is instructed to change.

### SHOULD IMPROVE

#### R-01 — Make the Ant Design alpha-focus preservation rule explicit

- **Evidence:** Rule 10 keeps `border.focus` unresolved and requires checking
  the installed Ant Design token API (`10-styling.md:220-230`); Color System
  records that Ant Design 5.20.6 `controlOutline` is alpha-derived and not a
  solid HEX mapping (`color.md:231-235`).
- **Gap:** Current guidance implies the safeguard through the unresolved-focus
  and token-verification rules but does not explicitly say not to replace
  alpha-based focus/interaction output with an arbitrary solid HEX.
- **Proposed remediation:** Add a concise reference or sentence to
  `.codex/rules/10-styling.md` directing agents to preserve supported
  alpha-derived behavior and not substitute a solid color without an approved
  role and component-specific review. Keep exact focus values in the canonical
  docs, not duplicated in the rule.
- **Related decision:** DS-03 unresolved focus/interaction mapping; DS-04
  visible keyboard focus.
- **Priority / risk:** P1; moderate accessibility/regression risk if a future
  token override changes opacity or adjacent-surface visibility.
- **Approval:** No new approval to clarify the existing boundary; any actual
  focus mapping still requires its unresolved design decision.
- **Expected effect:** Better protection against flattening Ant Design's
  alpha-derived focus behavior into an unreviewed solid value.
- **Validation:** Compare the rule to the installed 5.20.6 token behavior and
  Color System's focus caveat; do not claim rendered focus conformance.

#### R-02 — Label the linked prior DS-03 decision report as superseded

- **Evidence:** Current `docs/design-system/color.md:188-198` supersedes
  `brand.secondary #2B479E` and `brand.yellow #FFD200`. Its final references
  (`color.md:237`) still name the linked file as “selective palette adoption
  decision report.” That report's `§3` continues to state
  `brand.secondary = #2B479E` and `brand.yellow = #FFD200` as approved
  (`docs/reports/2026-11-06/ds-03-selective-palette-adoption-decision.md:20-29`).
- **Assessment:** `.codex/README.md:8` correctly says dated reports are
  evidence, not new architecture decisions, and the active Color System has
  the correct values. The report is historical, but its link label does not
  make the superseded status apparent at point of use.
- **Proposed remediation:** In a separately authorized shared-doc update,
  label that report historical/superseded in the link or add a short status
  notice to its own report; do not rewrite its historical decision content.
- **Related decision:** DS-03.
- **Priority / risk:** P2; low direct risk, moderate stale-reference handoff
  risk because a reader can arrive at obsolete approved values.
- **Approval:** No new palette approval; confirm only the historical labeling.
- **Expected effect:** Readers retain decision history without confusing it
  with the active palette.
- **Validation:** Search active references to old palette values and verify the
  current Color System remains the canonical target.

### OPTIONAL

No optional enhancement is required to make the current agent/skill dispatch
usable. A dedicated Design System audit skill would duplicate the general
read-only analyzer/reviewer workflows unless repeated audit demand establishes
a distinct reusable process.

### NO CHANGE

1. **Profile hierarchy and dispatch:** `AGENTS.md:3-20` directs readers to
   context, architecture, and relevant rules; `.codex/README.md:5-16` states
   source precedence and that rules are not automatically loaded; its routing
   table (`:17-27`) names existing agents/skills. No missing agent or skill
   target was found.
2. **Agent/skill contract:** All four agents require relevant rules and
   current-source verification. Read-only agents prohibit edits. Skills call
   agents only when delegation is authorized/available; the high-risk
   `analyze-module`/`review-code` workflow does not treat static review as
   runtime validation.
3. **DS-02 and DS-03:** The active styling guidance points to the canonical
   Color System, keeps brand primitives separate from feedback/interaction
   roles, preserves runtime aliases and feature-local styling, and leaves
   Scheme Sync mapping deferred (`10-styling.md:215-237,248-256`). No active
   rule uses `#2B479E` or `#FFD200` as a current brand or StatusBadge target.
   Current `#DC2626` mentions in shared docs describe the runtime or historical
   target and are not misclassified by active rules.
4. **DS-04:** Rules 07/09/10 state that static checks are not conformance
   evidence and require visual/accessibility review. Canonical docs define the
   WCAG 2.2 AA target and contrast thresholds. No conformance claim is made.
5. **Technical guardrails:** Rules 02/03/04/05/06/07/09/10 align with the
   specified TypeScript, ApiFetcher, AntD Form/Zod, Query/Redux ownership,
   lazy-route, OR-permission, SCSS Module, and static-validation requirements.
   Examples: `02-typescript.md:46-75` prohibits new application enums;
   `03-api-service.md:5-12,106-130` keeps ApiFetcher as transport and typed
   CRUD without automatic response parsing; `04-state-management.md:11-20`
   assigns one server-state owner; `05-form.md:5-43` requires AntD Form,
   explicit Zod execution and `setFields()`; `06-routing-permission.md:3-32,
   36-72` marks route/auth/permission changes HIGH-RISK, preserves OR
   semantics and lazy boundaries; `10-styling.md:3-21,114-132` retains SCSS
   Modules for new independent UI and legacy styling compatibility; and
   `09-testing.md:5-8,28-48` uses existing scripts and disclaims runtime proof.
   `package.json` exposes `typecheck`, `lint`, `build`, `prettier`, and other
   build scripts but no `test` script.
6. **Optional form audit reference:** `.codex/rules/05-form.md:85-89` says the
   source-based form inventory may be absent from a checkout and keeps current
   source authoritative either way. The linked target is absent here, but this
   is an intentional limitation rather than a broken active handoff. No change
   is proposed.
7. **Routing references:** `docs/modules/INDEX.md` exists. `06-routing-
   permission.md` documents the guard/suspense/lazy hierarchy and the known
   ProductLabels exception, and current route entries use lazy pages. Route
   and permission changes remain HIGH-RISK; no route changes are proposed.

## 6. Stale-guidance search results

Search covered `.codex/agents/`, `.agents/skills/`, `.codex/rules/`,
`AGENTS.md`, `.codex/README.md`, and supporting knowledge for all requested
HEX values, `Inter`, `Be Vietnam Pro`, `StatusBadge`, `accent`,
`feedback.error`, `focus`, `WCAG`, Scheme Sync, and Ant Design configuration.

| Search term/family | Active profile result | Context/disposition |
| --- | --- | --- |
| `#2B479E`, `#FFD200` | No match as an active Codex rule/agent/skill target. | Occurs in dated historical reports and historical portions of shared Color System; current targets are `#0E377B` and `#F7D107`. R-02 covers one weakly labeled linked report. |
| `#DC2626` | No active profile color literal prescribing it. | Shared docs/source references describe a previous target or current runtime `--primary-color`; preserve as compatibility evidence. |
| `#DB1F26`, `#0E377B`, `#F7D107`, `#F4A60E` | No palette literals duplicated in active profile. | Rule 10 refers to canonical Color System; its active table contains the approved values. |
| `Inter`, `Be Vietnam Pro` | Rule 10 points to adopted cross-app typography and preserves feature-local styles. | Canonical Typography sets Inter default and records Scheme Sync's local Be Vietnam Pro; exact role scale status is F-01. |
| `StatusBadge`, `accent`, `feedback.error` | Rules 07 and 10 refer to semantic guidance; 07 contains stale separate-approval wording. | Canonical Status page now contains approved DS-05 pairs and mappings; F-02. |
| `focus`, AntD tokens/config | Rule 10 leaves focus unresolved and requires installed-token verification. | Canonical Color System documents 5.20.6 alpha-derived `controlOutline`; clarify the no-solid-substitution rule per R-01. |
| `WCAG`, Scheme Sync | Active rules point to canonical accessibility and color guidance; Scheme Sync is deferred. | Aligned; no claim of conformance or automatic migration. |

Historical source records not treated as active profile instructions include
the DS-03 selective-palette decision report (`:20-29`), the pre-adoption
review, the DS-05 consumer audit's former accent pair (`§10`), and the prior
DS-03 approval report. The `.codex/README.md:8` source hierarchy supports this
classification; the canonical current pages take precedence.

## 7. Agent/skill/rule interaction and references

- `AGENTS.md` lists the four existing specialist agents and directs task
  workflows to project skills. `.codex/README.md` lists eight skills and
  appropriate agents; all entries exist in the discovered folders.
- Agents and skills direct readers to relevant rules and verify dated evidence
  against source. For UI work, rule 07 links to the Status System and rule 10
  links to Color/Typography. This is a concise path to canonical guidance and
  avoids duplicating palette HEX values.
- `feature-implementer` does not authorize changes beyond a requested scope;
  `codebase-analyzer`/`frontend-reviewer` remain read-only; `legacy-refactorer`
  only acts on explicit refactoring tasks. `AGENTS.md` and the profile README
  preserve user work, bounded scope, and session authorization.
- High-risk shared-component, route, auth, and permission changes retain
  architecture impact/review gates (`AGENTS.md:14-18`,
  `ARCHITECTURE.md:692-709,827-832`, `analyze-module/SKILL.md:10-24`,
  `review-code/SKILL.md` high-risk section, `06-routing-permission.md:3-32`).
- A local Markdown link scan covered 22 active Markdown profile files and 15
  local file/directory targets. One optional file target is absent:
  `docs/audits/components/form-components-audit.md` from rule 05; the rule
  explicitly says it may be absent and current source remains authoritative.
  Directory targets resolved and no unresolved agent or skill names were
  found. Static path checks do not prove runtime Codex activation.
- Report path convention is present in `docs/README.md`: audit output belongs
  under `docs/audits/<area>/YYYY-MM-DD/<slug>.md`; it identifies `docs/` as
  local-only. No specialized audit report template or profile-specific audit
  agent exists; the report follows the path convention and requested sections.

## 8. Proposed update plan before DS implementation

| Order | Exact file(s) | Proposed change | DS | Priority / risk | Approval | Expected effect and validation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `docs/design-system/typography.md`; `docs/design-system/README.md` | Synchronize canonical DS-01 roles/weights and replace candidate-scale label while retaining runtime caveats. | DS-01 | P0; moderate documentation risk, high UI reach | Confirm supplied approval is the final shared-doc decision; no new value decision | Compare every specified role/value and verify Inter/feature legacy distinction. |
| 2 | `.codex/rules/10-styling.md:238-242` | Replace candidate wording with a concise reference to approved canonical DS-01 roles; state targets need not be universally implemented. | DS-01 | P0; moderate guidance impact | No additional approval after step 1 | Search active profile for candidate-scale status and stale role variants. |
| 3 | `.codex/rules/07-component.md:234-251` | State approved error/accent semantics and link to `status.md`; distinguish approved target from implementation scope, without duplicating HEX values. | DS-05 | P0; high shared-component impact | No new design approval; scope/review still required for source changes | Verify six variants/contracts, eKYC mapping, and no implication of production application. |
| 4 | `.codex/rules/10-styling.md` and `docs/design-system/color.md` | Add a concise alpha-derived focus preservation guard/reference if maintainers want this in the implementation rule; make no focus-value assignment. | DS-03/04 | P1; moderate accessibility risk | Any focus color mapping still requires team decision | Review AntD 5.20.6 behavior and rendered focus in a separately scoped change. |
| 5 | `docs/design-system/color.md:237` or historical DS-03 report | Mark the linked selective-palette decision report as historical/superseded; preserve its text as evidence. | DS-03 | P2; low runtime risk | No value approval; doc-owner review | Broad search should make active vs historical palette decisions explicit. |

Do not duplicate approved HEX values across rules, agents, or skills. Keep
shared values in the canonical Design System pages. Do not treat this report
as authorization to implement typography, theme tokens, focus colors, or
StatusBadge styling.

## 9. NEEDS-TEAM-DECISION items

These remain outside the profile consistency fixes:

1. **Runtime theme ownership and rollout:** the canonical physical token owner
   and migration sequence remain unresolved (`color.md:164,235`).
2. **Interaction and navigation colors:** final focus mapping, other
   interaction-state values, and link/action/navigation ownership remain
   unresolved (`color.md:166-178,227,233`). Preserve Ant Design 5.20.6's
   alpha-derived behavior unless and until the relevant decision and review are
   complete.
3. **DS-02 Scheme Sync:** any cross-feature/global token migration or action
   role change requires its separately approved scope; preserve current
   feature-owned portal styling and production semantics.
4. **Customer status mapping:** `U2 + VERIFIED` remains a separate unresolved
   business mapping (`status.md:54`).
5. **OfferDetailTabs status behavior:** the latest status doc keeps the reported
   non-`ACTIVE` mapping issue for separate review and notes that the generalized
   behavior was not verified from the inspected helper (`status.md:56`). No
   silent remapping is proposed.

No uncertainty about current runtime values is resolved by approval of a
design target. Unapproved shade ramps, opacity variants, global gradients, and
brand-to-feedback mappings remain unapproved.

## 10. Validation performed and limitations

- Confirmed inventory: **4 agents, 8 skills, 12 rules**; all discovered files
  were inspected or searched for DS and technical-guardrail references.
- Checked the profile entry point/index, agent/skill routing, names, local
  Markdown links, the existence of referenced canonical Design System pages,
  and report path convention. One optional audit link target is absent and is
  explicitly documented as optional in rule 05; this is not a broken active
  reference.
- Searched active profile for the requested color/font/status/accessibility/
  Scheme Sync/Ant Design terms. Old palette strings are not active Codex color
  targets; current rule conflicts are recorded as F-01/F-02.
- Compared all DS-01–DS-05 decisions against current shared docs and latest
  dated DS-03/DS-05 decision records; separated source/runtime facts from
  approved targets and historical records.
- Cross-checked technical rules against the user-specified guardrails and
  current `package.json` script names. No `test` script is present. No app
  checks were run because this audit is read-only and no application change is
  proposed.
- The working tree contained unrelated application-source edits at inspection.
  They were not modified. Git status was rechecked; `docs/` and `.codex/` are
  ignored/local-only under existing policy. No existing source/profile/doc
  file was changed, and no ignore rule or Git index action was used.
- No Codex CLI activation test, browser, authenticated API, permission matrix,
  screen-reader, rendered typography, or runtime accessibility check was
  performed. Static references do not prove profile activation or rendered
  behavior.

## 11. Final readiness assessment

**Not ready for unqualified DS implementation guidance until F-01 and F-02 are
reconciled.** The current profile already provides a sound routing and
compatibility framework, and DS-02, DS-03, DS-04, and the newer styling-rule
reference to DS-05 are otherwise aligned. Complete the recommended canonical
DS-01 update, then its rule reference, then fix the DS-05 component wording.
Repair the missing form reference and clarify historical-report links as
documentation hygiene. Keep the typography and StatusBadge production changes
in separately scoped, reviewed implementation work; preserve all unresolved
DS and domain decisions.
