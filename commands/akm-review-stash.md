---
description: Use when you need to review a candidate akm stash before installing it. The first argument is the stash or asset ref to inspect.
---

Review the akm stash at `$1` before the user installs it. Do not run `akm add`
as part of this review.

## Inspect

Run these in order:

```bash
akm registry search "$1"
akm show "$1"
```

If the ref points at a GitHub repo, also inspect `README.md`, `LICENSE`, and
any root `akm.json` or `package.json`.

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

- **Install** — safe to `akm add $1`
- **Install with caveats** — say what to audit next
- **Skip** — state the blocking reason
