---
name: install-akm-stash
description: Use when the user wants to install or clone an akm stash or individual asset from npm, GitHub, a git URL, or a local directory into their working stash.
updated: 2026-11-23
---

# Install an akm Stash

This skill is for adding a stash to the user's working bundle so its assets
(skills, commands, agents, knowledge, tasks, LLM wikis, env configs,
secrets, memories, lessons) become searchable and usable via `akm show`,
`akm run`, or host-agent plugins.

## When to use

- “Install the X stash”
- “Add the GitHub repo Y as an akm source”
- “Grab just the deploy skill from stash Z”

Prerequisite: run `skills/akm-quickstart` first if `akm doctor info` fails.

## Decision tree

1. **Don't know the exact ref?** Run `akm curate "<keywords>"` first; if needed,
   fall back to `akm search "<keywords>" --from registry`.
2. **Have a stash ref?** Use `akm bundle add`.
3. **Only want one asset?** Use `akm import <ref> --asset-ref`.

## Common install patterns

### From the official registry

```bash
akm search "kubernetes deploy" --from registry
akm bundle add github:owner/kubernetes-stash
akm bundle update --all
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
akm import github:owner/repo//skills/deploy --asset-ref
akm import npm:@acme/stash//lessons/docker-healthchecks --asset-ref
```

## Verification

```bash
akm bundle list
akm search <asset-name>
akm show <ref> --detail agent
```

## Private stashes

For a private git repo over HTTPS, pass a credential reference. It is stored as
a reference, never a literal token, and resolved only when git runs. Secret
values are never accepted on argv; store the token as a secret first:

```bash
printf '%s' "$GITHUB_TOKEN" | akm secret set secrets/github-token
akm bundle add git+https://github.com/your-org/private-stash.git --credential '${secrets/github-token}'
```

`--credential '$GITHUB_TOKEN'` reads an environment variable instead.

## Pitfalls

- If two stashes expose the same asset name, use the fully-qualified ref
  (`bundle//conceptId`).
- If search finds nothing after `akm bundle add`, run `akm index`.
- Treat `quality: "proposed"` content as draft material until it is accepted.
