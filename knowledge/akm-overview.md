# akm Overview for Agents

**akm** is a CLI package manager for AI-agent assets.
It gives coding assistants (Claude Code, OpenCode, Codex, Cursor, Copilot,
Qwen, etc.) a unified way to discover, install, and run the skills, commands,
agents, knowledge, workflows, wikis, vaults, and memories they need — without
reinventing a storage layer per tool.

Canonical repo: <https://github.com/itlackey/akm>
Official registry: <https://github.com/itlackey/akm-registry>

> **Terminology.** akm has two related concepts that both use the word
> "stash":
>
> - **working stash** — your local editable directory (default `~/akm`).
> - **stash** (unqualified) — a shareable, publishable directory of assets.

## The three moving parts

| Concept | What it is | Default location |
|---|---|---|
| **Working stash** | Your personal, editable directory of assets. | `~/akm` |
| **Source** | A place assets come from (local dir, npm pkg, GitHub repo, website, remote provider). | configured via `akm add` |
| **Registry** | A discovery index of published stashes you don't know about yet. | `itlackey/akm-registry` (pre-configured) |

A **(published) stash** is just a shareable directory of assets. Nothing in
the directory layout is required — akm classifies by file extension and
content — but using conventional subdirectory names (`scripts/`, `skills/`,
`commands/`, etc.) improves indexing.

## Asset types

| Type | One-liner | Typical file |
|---|---|---|
| `script` | Executable code for automation. | `scripts/deploy.sh` |
| `skill` | Step-by-step instructions an agent follows. | `skills/<name>/SKILL.md` |
| `command` | Prompt template with placeholders. | `commands/review-pr.md` |
| `agent` | System prompt + model hint + tool policy. | `agents/security-reviewer.md` |
| `knowledge` | Reference docs with navigation. | `knowledge/api-reference.md` |
| `workflow` | Structured multi-step procedure with state (v0.5.0+). | `workflows/release.md` |
| `wiki` | Pages in multi-wiki knowledge bases (v0.5.0+). | `wikis/engineering/<page>.md` |
| `vault` | Environment key-value pairs; secrets masked (v0.5.0+). | `vaults/prod.env` |
| `memory` | Context fragments from external systems. | `memories/<slug>.md` |

## Ref format

Every asset is addressed by a **ref**:

```
[origin//]type:name[#version]
```

Examples:

- `script:deploy.sh` — in the working stash
- `skill:review-pr` — in the working stash
- `github:acme/stash//skill:review-pr` — from a GitHub source
- `npm:@acme/stash//knowledge:runbook` — from an npm package
- `github:acme/stash#v1.2.3//workflow:release` — pinned to a tag

`akm show <ref>` inspects any asset. `akm run <ref>` executes scripts,
commands, workflows, or agents as appropriate.

## What's new in v0.6.0 (2026-04-24)

- **Clean break on terminology.** Every remaining "kit" reference has been
  renamed to "stash". The registry index wire format is now `stashes[]`
  (schema v3); `kits[]` is no longer accepted. The legacy `kit.json`
  manifest filename and `akm-kit` keyword/topic are also gone — use
  `akm.json` / `stash.json` and the `akm-stash` keyword/topic.
- See the Stash Maker's Guide (`docs/stash-makers.md` in
  [itlackey/akm](https://github.com/itlackey/akm)) for the migration
  checklist.

## What's new in v0.5.0 (2026-04-24)

- **Workflow** is now a first-class asset type with stateful `akm workflow`
  subcommands (`create`, `start`, `next`, `complete`).
- **Wiki** support: ingest and lint multi-page markdown wikis; register
  external wikis.
- **Vault** asset type: manage `.env` files with masked secrets via
  `akm vault`.
- **`akm save`** commits & optionally pushes a git-backed working stash; save
  now uses `git clone` instead of tarballs and supports a writable stash.
- **`akm upgrade`** works across npm, bun, pnpm, and binary installs.

## Essential commands at a glance

```bash
akm setup                       # one-time configuration wizard
akm search <query>              # search working stash + registries
akm curate <query>              # summarized, follow-up-friendly search
akm add <source>                # register a source (local/npm/github/url)
akm clone <ref>                 # copy one asset into the working stash
akm show <ref>                  # view asset contents
akm run <ref>                   # execute a runnable asset
akm workflow start <ref>        # start a stateful workflow
akm vault set KEY value         # store a secret
akm save -m "msg"               # commit (and optionally push) the working stash
akm upgrade                     # update akm itself
```

## Where to go next

- Authoring a stash → `skill:publish-akm-stash`
- Installing a stash → `skill:install-akm-stash`
- Bootstrapping akm from scratch → `skill:akm-quickstart`
- End-to-end stash publishing → `workflow:publish-stash`
- Registry index format → `knowledge:akm-registry-schema`
- Full CLI reference → `knowledge:akm-cli-reference`
