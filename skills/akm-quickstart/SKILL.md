---
name: akm-quickstart
description: Use when an agent needs to bootstrap akm (Agent Stash Manager) in a fresh environment — installs the CLI, initializes the stash, configures the registry, and verifies the toolchain before any install/search operations.
---

# akm Quickstart

This skill gets an agent from zero to a working akm installation so subsequent
skills (`install-akm-stash`, `publish-akm-stash`) can run without setup errors.

## When to use

- The user asks you to "use akm", "install a stash", "search for a skill", etc.,
  and `akm` is not on PATH.
- `akm info` or `akm --version` fails.
- `~/akm` (the default stash) does not exist.

## Steps

### 1. Detect current state

```bash
command -v akm && akm --version && akm info || true
```

If `akm` is present and `akm info` succeeds, skip to step 4.

### 2. Install the CLI

Prefer the package manager already used in the project. For a project with
`bun.lock` or `package.json` listing `akm-cli`:

```bash
bun add -g akm-cli@latest    # or: npm i -g akm-cli  /  pnpm add -g akm-cli
```

For environments without Node, fall back to the standalone binary per the
[akm README](https://github.com/itlackey/akm#installation).

### 3. Initialize the stash

```bash
akm setup      # interactive first-run wizard (registry, embeddings, index)
# or non-interactive:
akm init       # creates ~/akm with scripts/ skills/ commands/ agents/ knowledge/ workflows/ wikis/ vaults/
akm index      # build the local search index
```

### 4. Verify the default registry is reachable

```bash
akm registry list
akm registry search akm              # should return stashes from itlackey/akm-registry
```

If the registry is empty, add the official one explicitly:

```bash
akm registry add https://raw.githubusercontent.com/itlackey/akm-registry/main/index.json --name official
```

### 5. Confirm readiness

```bash
akm info      # should show stash path, registry count >= 1, and index built
```

Only proceed to stash install/search skills after this command succeeds.

## Common failures

- **`akm: command not found`** after `npm i -g` — user's global bin is not on
  PATH. Advise `export PATH="$(npm bin -g):$PATH"` or use `bunx akm`.
- **Empty `akm registry list`** — the config file was reset. Rerun step 4.
- **`akm index` hangs** — usually an embeddings provider is misconfigured; run
  `akm setup` and pick "none" for embeddings to fall back to lexical search.
