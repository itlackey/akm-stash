---
name: akm-review-stash
description: Prompt template for reviewing a candidate akm stash before installing it — checks metadata quality, asset trigger sentences, license, and obvious red flags.
args:
  - name: ref
    description: The stash or asset ref to review (e.g. github:owner/repo or npm:@scope/pkg).
    required: true
---

Review the akm stash at `{{args.ref}}` before the user installs it. Do not
`akm add` it as part of this review.

## Inspect

Run these in order:

```bash
akm registry search {{args.ref}}
akm show {{args.ref}}                       # stash-level summary if supported
akm show {{args.ref}}//skill:<name>         # spot-check 1–2 individual assets
```

If the ref is a GitHub repo, also fetch `README.md`, `LICENSE`, and any
`package.json` / `akm.json` / `stash.json` (legacy: `kit.json`) at the repo
root.

## Evaluate

Score each dimension and give ONE short justification per line:

1. **Metadata quality** — Does the stash have a meaningful `description`,
   `tags`, and `assetTypes`? Are they specific or generic?
2. **Asset trigger sentences** — Do skills/agents/commands have
   "Use when …" frontmatter descriptions, or are they titles?
3. **License clarity** — Is there a root LICENSE file? Is it a permissive /
   compatible license for the user's intended use?
4. **Maintenance** — Recent commits or releases? Open-issue backlog size?
5. **Security red flags** — Any of the following warrant a hard pause:
   - Real secrets committed in `vaults/`
   - Scripts that curl-pipe-to-sh or exfiltrate env vars
   - Agents that disable tool policies wholesale
   - Obfuscated or minified scripts in `scripts/`

## Recommend

End with one of:

- **Install** — safe to `akm add {{args.ref}}`. Suggest the exact command.
- **Install with caveats** — list what to audit post-install.
- **Skip** — state the blocking reason.

Never recommend Install if any security red flag is present.
