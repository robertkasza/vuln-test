# Vulnerability Automation — Conversation Summary

## Goal

Detect npm vulnerabilities in the `nhost/nhost` monorepo (Go + JS/TS, pnpm workspaces) and **automate remediation PRs** — including the tricky transitive case that requires `pnpm.overrides`.

## Current pain
- CI runs `pnpm audit` (`audit-ci-recursive`) on every PR push and **fails on any vulnerability**.
- When a new advisory drops, all open PRs start failing — devs blocked until someone manually figures out the right fix.
- The repo currently does **not** use Dependabot or Renovate for updates.

## Constraints
- JS/TS focus (Go side handled separately).
- pnpm monorepo — needs proper workspace + transitive handling.
- Want a "subscribe" model (push, not poll), not per-PR scanning.
- Want to test on a sandbox before touching `nhost/nhost`.

## Options evaluated

| Tool | Verdict |
|---|---|
| **Socket.dev** | Out — Free tier has single API token (awkward for shared/CI use), and PR-time scanning isn't what's needed. |
| **Dependabot security updates** | Free, push-driven, but **doesn't generate `pnpm.overrides`** for transitive vulns — leaves the hardest cases unsolved. |
| **Renovate** | Best fit — `vulnerabilityAlerts` + `transitiveRemediation: true` + `vulnerabilityFixStrategy: "lowest"` handles direct *and* transitive cases automatically. |
| **OSV-Scanner cron** | Detection only, no autofix — useful as a complement, not a replacement. |
| **Custom script wrapping `nhost_fix_vulnerabilities` skill** | Possible fallback, more maintenance. |

## Decision
**Renovate, vulnerability-only mode**, self-hostable via GitHub Action (no Mend app dependency long-term).

## Test setup in progress
- Created public sandbox repo with `lodash@4.17.20` (known-vulnerable).
- Plan: install Renovate (Mend-hosted for fast test), drop in vuln-only config, verify it opens a remediation PR and handles a transitive case via `pnpm.overrides`.
- Once validated → propose Renovate self-hosted via GitHub Action for `nhost/nhost`.

## Prerequisites identified
- Dependabot **alerts** must be enabled on the target repo (data source for Renovate's `vulnerabilityAlerts`). No security-update PRs from Dependabot — Renovate handles those.

## Vuln-only Renovate config (for both sandbox + eventual real use)

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "enabledManagers": ["npm"],
  "packageRules": [
    { "matchPackagePatterns": ["*"], "enabled": false }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"],
    "vulnerabilityFixStrategy": "lowest"
  },
  "osvVulnerabilityAlerts": true,
  "transitiveRemediation": true,
  "prConcurrentLimit": 0,
  "prHourlyLimit": 0
}
```

## Next steps
1. Finish sandbox test (verify direct + transitive remediation behavior).
2. If good → propose self-hosted Renovate workflow + this config for `nhost/nhost`.
3. Optionally add OSV-Scanner nightly as a second-opinion safety net.
