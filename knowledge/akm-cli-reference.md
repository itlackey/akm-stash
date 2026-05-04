# akm CLI Reference

Quick reference for the main `akm` surfaces an agent is likely to use.
Current as of **v0.7.0** (2026-05-04). For authoritative syntax, run
`akm <cmd> --help`.

## Global output controls

| Flag | Purpose |
|---|---|
| `--format json\|text\|yaml\|jsonl` | Choose the output format. |
| `--detail brief\|normal\|full\|summary\|agent` | Choose how much data to return. |
| `--detail=agent` | Preferred compact mode for agents; replaces deprecated `--for-agent`. |
| `--quiet` / `--verbose` | Suppress warnings or emit extra diagnostics. |

## Setup & system

| Command | Purpose |
|---|---|
| `akm setup` | Guided first-run wizard: config, stash dir, providers, registries, and initial index. |
| `akm init [--dir <path>]` | Create the working stash skeleton (`scripts/`, `skills/`, `commands/`, `agents/`, `knowledge/`, `workflows/`, `memories/`, `vaults/`, `wikis/`, `lessons/`). |
| `akm index [--full]` | Build or refresh the local search index. |
| `akm info` | Print version, configured sources, registries, and index/search capabilities. |
| `akm config get <key>` / `set <key> <value>` | Read or write configuration. |
| `akm upgrade` | Self-update the CLI. |
| `akm help migrate <version>` | Preview release notes and migration guidance. |

## Discovery

| Command | Purpose |
|---|---|
| `akm search <query>` | Search local stash content by default. |
| `akm search <query> --source registry` | Search only registries. |
| `akm search <query> --source both` | Merge local and registry discovery. |
| `akm search <query> --type <type>` | Filter by asset type (`script`, `skill`, `command`, `agent`, `knowledge`, `workflow`, `wiki`, `vault`, `memory`, `lesson`). |
| `akm search <query> --filter user=alice --filter agent=claude` | Restrict results to matching scope metadata. |
| `akm search <query> --include-proposed` | Include assets with `quality: "proposed"`. |
| `akm curate <query>` | Return a compact shortlist plus suggested next commands. |
| `akm show <ref> [toc\|frontmatter\|section\|lines ...]` | Display an asset; knowledge supports additional view modes. |
| `akm show <ref> --scope key=value` | Require a scope match when resolving the asset. |
| `akm registry list` / `search <query>` / `add <url> --name <alias>` | Manage discovery registries. |

## Sources and install flows

| Command | Purpose |
|---|---|
| `akm add <source>` | Register a source such as `./path`, `github:owner/repo`, `npm:@scope/pkg`, `git+https://...`, or a website URL. |
| `akm list` | List configured sources. |
| `akm update` | Refresh managed sources. |
| `akm remove <id>` | Remove a configured source and reindex. |
| `akm clone <ref> [--dest <dir>] [--name <new-name>]` | Copy a single asset or stash into a writable location. |

## Execution and authoring

| Command | Purpose |
|---|---|
| `akm run <ref>` | Execute a runnable asset. |
| `akm workflow start <ref>` / `next` / `complete` / `status` | Run stateful workflows. |
| `akm workflow create <name>` / `validate <ref\|path>` | Author or validate workflow files. |
| `akm remember "<text>"` | Append a memory fragment to the working stash. |
| `akm import <file>` | Ingest a knowledge or lesson-style document into the stash. |
| `akm feedback <ref> --positive` | Record positive feedback. |
| `akm feedback <ref> --negative --reason "why it missed"` | Record negative feedback with a durable reason. |
| `akm save -m "msg" [--push]` | Commit and optionally push the git-backed working stash. |

## Proposal queue and self-improvement (v0.7.0+)

| Command | Purpose |
|---|---|
| `akm reflect [ref] [--task "..."]` | Ask the configured agent to propose an improvement to an existing asset or stash context. |
| `akm propose <type> <name> --task "..."` | Ask the configured agent to propose a brand-new asset. |
| `akm distill <ref>` | Turn feedback and usage history into a lesson proposal. |
| `akm proposal list` | List pending proposals. |
| `akm proposal show <id>` | Render a proposal. |
| `akm proposal diff <id>` | Diff a proposal against the live asset. |
| `akm proposal accept <id>` | Validate and promote a proposal into the stash. |
| `akm proposal reject <id> --reason "..."` | Reject and archive a proposal. |

## Wikis and vaults

| Command | Purpose |
|---|---|
| `akm wiki list` / `ingest` / `register` / `lint` | Manage multi-page wiki assets. |
| `akm vault set <KEY> <value>` / `get` / `list` / `export` | Manage secret or configuration key-value pairs. |

## Workflow authoring contract (v0.7.0)

akm v0.7.0 workflows are markdown documents with:

- optional frontmatter keys: `description`, `tags`, `params`
- exactly one `# Workflow: <title>` heading
- one `## Step: <title>` section per step
- one `Step ID: <id>` line per step
- one `### Instructions` section per step
- optional `### Completion Criteria` list per step

Older frontmatter-only step arrays are not the current contract.

## Good defaults for agents

- Prefer `akm show <ref> --detail=agent` when you need execution-ready output.
- Prefer `akm curate <query>` before raw `search` when the task is “find the
  best asset for this job.”
- Treat `proposal` content as draft material until it has been explicitly
  accepted.
- Use `--source both` only when you intentionally want local + registry results
  in one pass.
