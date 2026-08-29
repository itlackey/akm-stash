---
name: akm-review-stash
type: command
description: Use when you need to review a candidate akm stash before installing it. The first argument is the stash or asset ref to inspect.
updated: 2026-08-29
---

Review the akm stash at `$1` before the user installs it. Do not run `akm
bundle add` as part of this review.

## Inspect

Search the configured registries first:

```bash
akm search "$1" --from registry
```

`akm show` resolves only assets already indexed locally; do not pass an
uninstalled registry hit to it. Inspect the registry result's source or
homepage read-only instead. If the candidate is already installed, use its
canonical asset ref with `akm show <ref>`.

If the source points at a GitHub repo, also inspect `README.md`, `LICENSE`,
and any root `akm.json` or `package.json`.

## Evaluate

Score each dimension with one short justification:

1. **Metadata quality** — are descriptions, tags, and asset types specific?
2. **Asset trigger sentences** — do skills, commands, agents, and lessons say
   when to use them?
3. **License clarity** — is there a clear root license?
4. **Maintenance** — does it look current enough for the caller's need?
5. **Security red flags** — secrets, exfiltration, obfuscated scripts, or
   unsafe agent policies are blocking issues.

## Recommend

End with exactly one of:

- **Install** — safe to `akm bundle add $1`
- **Install with caveats** — say what to audit next
- **Skip** — state the blocking reason
