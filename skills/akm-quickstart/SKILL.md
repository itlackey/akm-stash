---
name: akm-quickstart
description: Use when an agent needs to bootstrap akm in a fresh environment — installs the CLI, initializes the stash, configures the registry, and verifies the toolchain before any install, search, or proposal operations.
---

# akm Quickstart

This skill gets an agent from zero to a working akm installation so subsequent
skills can run without setup errors.

## When to use

- The user asks you to use akm and `akm` is not on PATH.
- `akm info` or `akm --version` fails.
- The working stash does not exist yet.

## Steps

### 1. Detect current state

```bash
command -v akm && akm --version && akm info || true
```

If `akm` is present and `akm info` succeeds, skip to step 4.

### 2. Install the CLI

Prefer the package manager already used in the environment:

```bash
bun add -g akm-cli@latest
# or: npm install -g akm-cli
# or: pnpm add -g akm-cli
```

For environments without Node, use the standalone installer from the
[akm README](https://github.com/itlackey/akm#install).

### 3. Initialize the stash

```bash
akm setup
# or, for a non-interactive flow:
akm init
akm index
```

Expected type directories include `scripts/`, `skills/`, `commands/`,
`agents/`, `knowledge/`, `workflows/`, `memories/`, `vaults/`, `wikis/`, and
`lessons/`.

### 4. Verify the official registry is reachable

```bash
akm registry list
akm registry search akm
```

If the registry is empty, add the official one explicitly:

```bash
akm registry add https://raw.githubusercontent.com/itlackey/akm-registry/main/index.json --name official
```

### 5. Confirm readiness

```bash
akm info
akm help migrate 0.7.0
```

Only proceed once `akm info` succeeds.
