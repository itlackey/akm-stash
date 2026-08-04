---
name: install-akm-stash
description: Use when the user wants to install or clone an akm stash or individual asset from npm, GitHub, a git URL, or a local directory into their working stash.
updated: 2026-05-24
---

# Install an akm Stash

This skill is for adding a stash to the user's working bundle so its assets
(skills, commands, agents, knowledge, workflows, LLM wikis, env configs,
secrets, memories, lessons) become searchable and usable via `akm show`,
`akm workflow`, `akm task`, or host-agent plugins.

## When to use

- “Install the X stash”
- “Add the GitHub repo Y as an akm source”
- “Grab just the deploy skill from stash Z”

Prerequisite: run `skills/akm-quickstart` first if `akm info` fails.

## Decision tree

1. **Don't know the exact ref?** Run `akm curate "<keywords>"` first; if needed,
   fall back to `akm search "<keywords>" --from registry`.
2. **Have a stash ref?** Use `akm bundle add`.
3. **Only want one asset?** Use `akm clone <ref>`.

## Common install patterns

### From the official registry

```bash
akm search "kubernetes deploy" --from registry
akm bundle add github:owner/kubernetes-stash
akm bundle update
akm index
```

### From npm

```bash
akm bundle add npm:@acme/review-stash
akm show skills/code-review
```

### From git or a pinned tag

```bash
akm bundle add git+https://github.com/owner/repo.git#v1.2.3
```

### From a local directory

```bash
akm bundle add ./path/to/stash --name local-stash
```

### Single asset via clone

```bash
akm clone github:owner/repo//skills/deploy
akm clone npm:@acme/stash//lessons/docker-healthchecks
```

## Verification

```bash
akm bundle list
akm search <asset-name>
akm show <ref> --shape agent
```

## Private stashes

For private GitHub repos, set `GITHUB_TOKEN` in the environment or a secret.
Secret values are never accepted on argv (that would leak via `/proc/cmdline`);
store them as a secret and inject via env:

```bash
# Store as a whole-file secret:
printf '%s' "$GITHUB_TOKEN" | akm secret set secrets/github-token

# Or store in an env asset and inject when needed:
akm env run env/user -- akm bundle add github:your-org/private-stash

akm bundle add github:your-org/private-stash
```

## Pitfalls

- If two stashes expose the same asset name, use the fully-qualified ref
  (`bundle//conceptId`).
- If search finds nothing after `akm bundle add`, run `akm index`.
- Treat `quality: "proposed"` content as draft material until it is accepted.
