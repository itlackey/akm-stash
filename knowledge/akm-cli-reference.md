# akm CLI Reference

Quick reference for every top-level `akm` command, organized by task. Current
as of **v0.5.0** (2026-04-24). For authoritative help, run `akm <cmd> --help`.

## Setup & system

| Command | Purpose |
|---|---|
| `akm setup` | Interactive first-run wizard: embeddings provider, default registry, initial index build. |
| `akm init` | Create the working-stash skeleton (`~/akm/{scripts,skills,commands,agents,knowledge,workflows,wikis,vaults}`). |
| `akm index` | Build or refresh the local search index across all configured sources. |
| `akm info` | Print system capabilities, working-stash path, registry count, and index state. Use this to verify readiness. |
| `akm config get <key>` / `akm config set <key> <val>` | Read or write configuration. |
| `akm upgrade` | Self-update the akm binary; works with npm/bun/pnpm/binary installs. |

## Discovery

| Command | Purpose |
|---|---|
| `akm search <query>` | Search working stash + registries. Flags: `--type`, `--source`, `--limit`. |
| `akm curate <query>` | Like `search` but returns a compact, follow-up-friendly summary. Prefer this for agent-driven discovery. |
| `akm show <ref>` | Display an asset. For knowledge, supports `--mode` (summary/full/toc). |
| `akm registry list` | List configured registries. |
| `akm registry add <url> --name <n>` | Register an additional registry. |
| `akm registry search <query>` | Search only the registries (not the working stash). |

## Sources (managed stashes)

| Command | Purpose |
|---|---|
| `akm add <ref>` | Register a source. Accepts `./path`, `npm:pkg`, `github:owner/repo[#ref]`, `git+https://...`, or a website URL. |
| `akm list` | List configured sources. |
| `akm remove <id>` | Remove a source (id from `akm list`) and reindex. |
| `akm update` | Pull latest versions of managed sources. |

## Copying into the working stash

| Command | Purpose |
|---|---|
| `akm clone <ref>` | Copy a single asset (or a whole published stash) from any source into the writable working stash. Type subdirectories are appended automatically on the destination side. |
| `akm import <file>` | Ingest a knowledge document. |

## Execution

| Command | Purpose |
|---|---|
| `akm run <ref>` | Execute a runnable asset (script, command, agent, workflow). Command assets expand placeholders from flags or stdin. |
| `akm workflow create <name>` | Scaffold a new workflow asset. |
| `akm workflow start <ref>` | Begin a stateful workflow run. |
| `akm workflow next` / `akm workflow complete` | Advance or finish a running workflow. |

## Content authoring

| Command | Purpose |
|---|---|
| `akm remember "<text>"` | Append a memory fragment to the working stash as markdown. |
| `akm feedback <ref> --positive\|--negative` | Rate an asset; feedback is used to rerank future searches. |
| `akm save -m "<msg>" [--push]` | Commit (and optionally push) a git-backed working stash. Uses `git clone` under the hood for writable working stashes. |

## Wikis (v0.5.0+)

| Command | Purpose |
|---|---|
| `akm wiki list` | List registered wikis. |
| `akm wiki ingest <path-or-url>` | Add a new wiki from a local dir or remote source. |
| `akm wiki lint <name>` | Validate page structure, links, and frontmatter. |
| `akm wiki register <url>` | Register an external wiki without copying it into the working stash. |

## Vaults (v0.5.0+)

| Command | Purpose |
|---|---|
| `akm vault set <KEY> <value>` | Store a secret (masked on display). |
| `akm vault get <KEY>` | Retrieve a secret. |
| `akm vault list` | List keys (values masked). |
| `akm vault export <file>` | Export to a `.env` file (handle with care). |

## Common flag conventions

- `--source <stash|registry|both>` — scope of a search (`stash` = local working stash).
- `--type <script|skill|command|agent|knowledge|workflow|wiki|vault|memory>` — filter by asset type.
- `--json` — machine-readable output on most commands.
- `--name <alias>` — local alias when adding sources or registries.

## Environment variables

| Variable | Effect |
|---|---|
| `AKM_REGISTRY_URL` | Override the default registry URL. |
| `AKM_STASH_DIR` | Override `~/akm`. |
| `GITHUB_TOKEN` | Auth for private GitHub sources. |
| `AKM_LOG_LEVEL` | `debug\|info\|warn\|error`. |
