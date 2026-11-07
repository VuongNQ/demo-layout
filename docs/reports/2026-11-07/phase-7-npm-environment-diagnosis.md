# Phase 7 — npm environment diagnosis

**Author:** Vuowng

**Date:** 2026-11-07

**Checkout/worktree:** E:\demo-layout

**Branch/revision:** feat/playground-compare / f357bcb82872768a1e3d02bebd96208b94ddd720

## Scope and safety

This was a read-only npm environment investigation. No package installation, configuration edit, cache cleanup, permission change, source edit, or worktree operation was performed. Authentication values were not read or reported.

The prior Phase 7 report records that the user authorized installation of i18next and react-i18next and settled Vietnamese as the default/fallback language and English system-owned prose for Compare CSV. These decisions remain settled and are not reopened here.

## Effective npm configuration

Commands run from E:\demo-layout:

| Setting | Effective result |
| --- | --- |
| npm config get offline | true |
| npm config get registry | https://registry.npmjs.org/ |
| npm config get cache | E:\.npm-cache |
| npm config get userconfig | C:\Users\anhBa\.npmrc |
| npm config get globalconfig | C:\Users\anhBa\AppData\Roaming\npm\etc\npmrc |
| npm config get proxy | null |
| npm config get https-proxy | null |

`npm config get offline --location=project`, `--location=user`, and `--location=global` each returned true. This alone does not prove those files set the value: npm config locations inherit the higher-precedence environment override observed below.

## Identified source of offline=true

**Verified:** The active cmd process has `NPM_CONFIG_OFFLINE=true`. The lowercase lookup `set npm_config_offline` returned the same environment variable. `npm config get offline` and all three location-scoped queries resolve to true. No project .npmrc exists. The configured user file and global file do not exist at the paths returned by npm. No NPM_CONFIG_REGISTRY environment variable is defined.

**Conclusion:** The immediate source is the process environment variable `NPM_CONFIG_OFFLINE=true`, which takes precedence over the absent npmrc files. This is not coming from a project-level setting in this checkout.

**Policy versus stale configuration:** The variable is present in the process but its origin is not established. The current shell may have inherited it from a managed launcher, user environment, parent process, or execution policy. No project/user npmrc explains it. The user-level environment registry lookup did not find a persisted value; the machine-level registry check could not be completed with the available command invocation. Therefore it is not possible to classify this as deliberate policy or stale configuration from this evidence. Do not remove or override it without its environment owner’s direction.

## Registry, proxy, cache and install failure

**Verified configuration:** The effective registry is the public npm registry. Both npm proxy settings return null. No trusted internal registry or npm proxy is configured in the inspected npm settings. No registry environment override was defined. This does not establish whether network egress is allowed outside this process.

The authorized earlier install attempt reported:

> ENOTCACHED: request to https://registry.npmjs.org/i18next failed: cache mode is 'only-if-cached' but no cached response is available.

`npm cache ls i18next` listed cache index keys for the i18next package metadata and the i18next-26.3.1 tarball. `npm cache ls react-i18next` likewise listed metadata and the react-i18next-17.0.8 tarball. These listings establish that matching cache index entries exist; they do not prove the metadata response and tarballs can satisfy the dependency resolver or that every required transitive package is cached. No cache verification command was run because cache verification can change cache contents. No package integrity data was bypassed.

`npm ls i18next react-i18next --depth=0` returned `(empty)`. The failed install left package.json and package-lock.json unchanged. The cache entries are therefore not sufficient for this install under the current npm offline mode.

## Cache log-write investigation

The configured cache is E:\.npm-cache. The cache and `_logs` directories exist, and `_logs` contains prior npm log files, including files dated 2026-11-07. `icacls` reports inherited Modify rights for `NT AUTHORITY\Authenticated Users` on both directories. E: reports approximately 12.5 GB free. These are read-only observations; no write test was attempted.

The earlier install reported that npm could not write its log under E:\.npm-cache\_logs. The visible ACL and pre-existing logs do not explain that specific failure. A sandbox restriction, transient filesystem error, path-specific issue, or npm process context may account for it, but none is confirmed. Do not change ACLs or clear the cache based on this evidence. A safe follow-up would be for the environment owner to inspect the failed npm process/logging context and validate write access using their approved diagnostic method.

## Evidence and inference

| Statement | Classification |
| --- | --- |
| Process environment contains NPM_CONFIG_OFFLINE=true. | Directly observed. |
| No repository .npmrc exists; configured user/global npmrc paths are absent. | Directly observed. |
| The current process resolves the public npm registry and null proxy settings. | Directly observed. |
| npm lists cache index entries for both package metadata and package tarballs. | Directly observed; not proof that offline resolution can use them. |
| The immediate offline setting comes from process environment, not project .npmrc. | Supported conclusion from observed precedence and file absence. |
| The variable is deliberate managed policy or stale local state. | Unverified; provenance is unknown. |
| The log-write error resulted from ACL denial. | Not supported; the observed ACL grants inherited Modify rights. |
| An internal registry, proxy or network route is available. | Not verified; none is configured in npm, and external connectivity was not tested. |

## Safe remediation options

1. Ask the owner of the shell/managed execution environment to identify why it injects `NPM_CONFIG_OFFLINE=true` and whether policy permits a trusted package source for this task. Do not override the variable locally as part of this diagnosis.
2. If network access is allowed, have the environment owner provide the approved registry/proxy route or run the authorized install in an approved network-enabled environment. Any registry change must be made by its owner through the normal configuration process.
3. If offline installation is required, have the owner populate or provide a trusted npm cache containing the exact requested packages and all resolver-required transitive packages, with package integrity verification preserved. Cache entries observed here have not been validated for a complete offline install.
4. Have the environment owner diagnose the npm log-write failure. The observed cache ACL and free space do not establish the cause, so permissions and cache contents should remain unchanged until that diagnosis.

Once an approved source is available, the minimum package operation remains `npm install i18next react-i18next`, followed by checking package.json, package-lock.json, and `npm ls i18next react-i18next --depth=0`. No other direct dependencies are needed for this decision.

## Required user or IT approval

The user has already authorized the package names and installation. No renewed product approval is needed. **Environment or IT guidance is required** to establish whether the process-level offline setting is policy, and to provide a policy-compliant package source or validated offline cache. Do not change npm settings or ACLs without the environment owner’s authorization.

## Unverified assumptions

- The origin and intended duration of NPM_CONFIG_OFFLINE=true.
- Whether registry.npmjs.org is reachable from an approved environment when policy permits online access.
- Whether the listed package tarballs are intact and whether required transitive dependencies are cached.
- The cause of npm’s log-write error despite existing files and inherited Modify ACLs.
- Whether an internal registry exists outside the current npm configuration.

## NEEDS-TEAM-DECISION

No product or CSV decision is open. The next operational step is environment-owner/IT clarification of the offline policy and an approved package source. The established language and CSV decisions remain unchanged.
