---
name: install-akm-stash
description: Use when the user wants to install or clone an akm stash or individual asset from npm, GitHub, a git URL, or a local directory into their working stash.
updated: 2026-05-23
refs: []
---

# Install an akm Stash

This skill is for adding a stash to the user's working stash so its assets
(skills, commands, agents, knowledge, workflows, wikis, vaults, memories,
lessons) become searchable and usable via `akm show`, `akm run`, or host-agent
plugins.

## When to use

- “Install the X stash”
- “Add the GitHub repo Y as an akm source”
- “Grab just the deploy skill from stash Z”

Prerequisite: run `skill:akm-quickstart` first if `akm info` fails.

## Decision tree

1. **Don't know the exact ref?** Run `akm curate "<keywords>"` first; if needed,
   fall back to `akm search "<keywords>" --source registry`.
2. **Have a stash ref?** Use `akm add`.
3. **Only want one asset?** Use `akm clone <ref>`.

## Common install patterns

### From the official registry

```bash
akm search "kubernetes deploy" --source registry
akm add github:owner/kubernetes-stash
akm update
akm index
```

### From npm

```bash
akm add npm:@acme/review-stash
akm show skill:code-review
```

### From git or a pinned tag

```bash
akm add git+https://github.com/owner/repo.git#v1.2.3
```

### From a local directory

```bash
akm add ./path/to/stash --name local-stash
```

### Single asset via clone

```bash
akm clone github:owner/repo//skill:deploy
akm clone npm:@acme/stash//lesson:docker-healthchecks
```

## Verification

```bash
akm list
akm search <asset-name>
akm show <ref> --detail=agent
```

## Private stashes

For private GitHub repos, set `GITHUB_TOKEN` in the environment or vault.
Vault values are never accepted on argv (that would leak via `/proc/cmdline`);
read them from stdin or an environment variable:

```bash
# Value via stdin (recommended; keeps secrets out of shell history):
printf '%s' "$GITHUB_TOKEN" | akm vault set vault:user GITHUB_TOKEN

# Or read from an existing environment variable:
akm vault set vault:user GITHUB_TOKEN --from-env GITHUB_TOKEN

akm add github:your-org/private-stash
```

## Pitfalls

- If two stashes expose the same asset name, use the fully-qualified ref.
- If search finds nothing after `akm add`, run `akm index`.
- Treat `quality: "proposed"` content as draft material until it is accepted.
