---
name: onboard-agent
description: Bootstrap a coding agent (Claude Code, OpenCode, Codex, Cursor, etc.) so it can discover, install, and run akm assets in the current environment.
steps:
  - id: install-cli
    title: Install the akm CLI and verify it is on PATH
  - id: init-stash
    title: Initialize the working stash and build the search index
    requires: [install-cli]
  - id: wire-plugin
    title: Wire the host agent's akm plugin (Claude Code / OpenCode / etc.)
    requires: [init-stash]
  - id: load-core-assets
    title: Install the official onboarding stash (this registry)
    requires: [wire-plugin]
  - id: smoke-test
    title: Verify the agent can search, show, and run an asset
    requires: [load-core-assets]
---

# Onboard an Agent onto akm

Use this when a fresh agent/environment needs to reach the point where it can
answer "is there an akm skill for X?" and install one if the answer is yes.

## Step 1 — Install the akm CLI

```bash
# Pick one:
bun add -g akm-cli@latest
npm install -g akm-cli
pnpm add -g akm-cli
# or download the standalone binary: https://github.com/itlackey/akm/releases
```

Verify:

```bash
akm --version
akm info
```

If `akm` is not on PATH, add the global bin directory (e.g.
`$(npm bin -g)` or `~/.bun/bin`) to `PATH`.

## Step 2 — Initialize the working stash and index

```bash
akm setup        # interactive: embeddings, default registry, first index build
# or:
akm init && akm index
```

Outcome: `~/akm/{scripts,skills,commands,agents,knowledge,workflows,wikis,vaults}`
exists and `akm search ""` returns (likely empty) results without error.

## Step 3 — Wire the host agent's akm plugin

| Host | Plugin | Install |
|---|---|---|
| Claude Code | `akm-plugins/claude-code` | follow [itlackey/akm-plugins](https://github.com/itlackey/akm-plugins) |
| OpenCode | `akm-opencode` | same repo |
| Codex / Cursor / Copilot / Qwen | drop `AGENTS.md` into the project root | copy from akm-plugins repo |

Goal: the agent can call an `akm` tool (search / show / dispatch / run) from
inside its turn, not just from a separate shell.

## Step 4 — Install the official onboarding stash

The official registry (this repo) ships skills, knowledge, and workflows
about using akm itself. Load them so the agent has a ready-made context:

```bash
akm add github:itlackey/akm-registry
akm index
akm show skill:akm-quickstart
akm show knowledge:akm-overview
```

Optionally install the plugins stash for your host:

```bash
akm add github:itlackey/akm-plugins
```

## Step 5 — Smoke test

```bash
akm search "deploy" --source registry
akm curate "code review"
akm clone github:itlackey/akm-registry//knowledge:akm-cli-reference
akm show knowledge:akm-cli-reference
```

If all four commands succeed, the agent is onboarded. It can now use
`skill:install-akm-stash` to add more stashes as needs arise.

## Troubleshooting

- **`akm registry list` is empty** → `akm registry add https://raw.githubusercontent.com/itlackey/akm-registry/main/index.json --name official`
- **Search returns nothing after install** → run `akm index`.
- **Private GitHub sources fail** → set `GITHUB_TOKEN` (or store it in the
  vault and re-run).
- **Embeddings errors at setup** → choose "none" to fall back to lexical
  search; you can configure embeddings later via `akm config set`.
