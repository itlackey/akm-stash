---
name: akm-quickstart
description: "Use when an agent needs to bootstrap akm in a fresh environment: install the CLI, initialize the stash, configure discovery, and verify the toolchain before install, search, improve, or tasks operations."
updated: 2026-11-23
---

# akm Quickstart

This skill gets an agent from zero to a working akm installation so subsequent
skills can run without setup errors.

## When to use

- The user asks you to use akm and `akm` is not on PATH.
- `akm doctor info` or `akm --version` fails.
- The working stash does not exist yet.

## Steps

### 1. Detect current state

```bash
command -v akm && akm --version && akm doctor info || true
```

If `akm` is present and `akm doctor info` succeeds, skip to step 4.

### 2. Install the CLI

akm 0.10 needs Node.js 22 or newer for npm-compatible installs. Bun and
the standalone binary are supported alternatives.

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
akm setup --yes
# or only the bundle directory:
akm bundle create
akm index
```

Expected type directories include `scripts/`, `skills/`, `commands/`,
`agents/`, `knowledge/`, `memories/`, `env/`, `secrets/`, `lessons/`,
`tasks/`, `instructions/`, `rules/`, `sessions/`, and `facts/` when you
start authoring those assets (`workflows/` is deprecated; use `tasks/`). An LLM
wiki bundle (`schema.md` + `pages/`) is a separate installable source, not a
directory inside this stash.

### 4. Verify the official registry is reachable

```bash
akm registry list
akm search akm --from registry
```

The official registry is configured by default. If it is missing, add it:

```bash
akm registry add https://raw.githubusercontent.com/itlackey/akm-registry/main/index.json --name akm-registry
```

### 5. Confirm readiness

```bash
akm doctor
akm proposal list
```

Only proceed once `akm doctor` exits 0 (4 is a warning to read, 1 a failure).
Each deprecated command prints one stderr line naming its replacement; use the
replacement in new automation (`akm doctor info` for `info`, `akm run <ref>`
for `task run`, `agent` and `command run`). `akm improve` queues proposals for
review; accept them with `akm proposal accept`.
