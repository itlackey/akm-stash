---
name: install-akm-stash
description: Use when the user wants to install or clone an akm stash (or individual asset) from npm, GitHub, a git URL, or a local directory into their working stash — covers search, source registration, install, and verification.
---

# Install an akm Stash

This skill is for adding a stash to the user's working stash so its assets
(skills, commands, agents, knowledge, workflows, wikis, vaults, memories)
become searchable and usable via `akm show`, `akm run`, or agent plugins.

> In akm terminology, **working stash** is the user's local editable
> directory (default `~/akm`), and a **stash** (unqualified) is a shareable
> directory of assets published to npm or GitHub. When the two need to be
> distinguished, the docs say "working stash" vs. "published stash."

## When to use

- "Install the X stash"
- "Add the GitHub repo Y as an akm source"
- "Grab just the deploy skill from stash Z"

Prerequisite: run the `akm-quickstart` skill first if `akm info` fails.

## Decision tree

1. **Don't know the exact ref?** → `akm search "<keywords>" --source registry`
   then `akm curate "<query>"` to get a summary of the top candidates.
2. **Have a stash ref (e.g. `owner/repo`, `@scope/pkg`)?** → `akm add`.
3. **Only want a single asset?** → `akm clone <ref>` — copies into the
   working stash without registering the whole stash as a managed source.

## Install patterns

### From the official registry

```bash
akm search "kubernetes deploy" --source registry
akm add github:owner/kubernetes-stash         # add as managed GitHub source
akm update                                    # pull latest refs
akm index                                     # refresh search index
```

### From npm

```bash
akm add npm:@acme/review-stash
akm show skill:code-review                    # verify
```

### From a git URL or branch/tag

```bash
akm add git+https://github.com/owner/repo.git#v1.2.3
# pinning a tag is strongly preferred over tracking main
```

### From a local directory (for in-progress stashes)

```bash
akm add ./path/to/stash --name local-stash
```

### Single asset via clone

```bash
akm clone github:owner/repo//skill:deploy     # copies just the skill
akm clone npm:@acme/stash//knowledge:runbook  # copies just one knowledge doc
```

Type subdirectories (`skills/`, `knowledge/`, etc.) are appended automatically
on the destination side.

## Verification

```bash
akm list                                      # confirm the source appears
akm search <asset-name>                       # confirm assets are indexed
akm show <ref>                                # inspect a specific asset
```

## Private stashes

For private GitHub repos, set `GITHUB_TOKEN` in the environment (or in the
akm vault):

```bash
akm vault set GITHUB_TOKEN ghp_xxx
akm add github:your-org/private-stash
```

## Uninstall / replace

```bash
akm remove <source-id>      # id from `akm list`
akm update                  # reindex
```

## Pitfalls

- **Two stashes export the same asset name** — always pass the
  fully-qualified ref (`github:owner/repo//skill:name`) to
  `akm show`/`akm run`.
- **Stash keeps re-downloading** — check `akm config get cache.ttl`; very
  short TTLs cause repeated clones.
- **`akm add` succeeded but `search` finds nothing** — you forgot
  `akm index`.
