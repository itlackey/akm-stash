---
description: Use when an agent needs the main akm-cli v0.8.0 commands, flags, proposal review flow, and workflow or task authoring rules in one place.
tags: [akm, cli, reference]
quality: curated
updated: 2026-06-02
---

# akm CLI Reference

Quick reference for the main `akm` surfaces an agent is likely to use.
Current as of **v0.8.0** (2026-05-09). For authoritative syntax, run
`akm <cmd> --help`.

## Global output controls

| Flag | Purpose |
|---|---|
| `--format json\|text\|yaml\|jsonl` | Choose the output format. |
| `--detail brief\|normal\|full` | Choose how much data to return (verbosity). |
| `--shape human\|agent\|summary` | Choose the output projection. `--shape agent` is the compact agent mode (replaces the deprecated `--for-agent` / `--detail agent`); `--shape summary` is valid only on `akm show`. |
| `--quiet` / `--verbose` | Suppress warnings or emit extra diagnostics. |

## Setup & system

| Command | Purpose |
|---|---|
| `akm setup` | Guided first-run wizard: config, stash dir, providers, registries, and initial index. |
| `akm init [--dir <path>]` | Create the working stash skeleton (`scripts/`, `skills/`, `commands/`, `agents/`, `knowledge/`, `workflows/`, `memories/`, `env/`, `secrets/`, `wikis/`, `lessons/`, `tasks/`). |
| `akm index [--full]` | Build or refresh the local search index. |
| `akm info` | Print version, configured sources, registries, and index/search capabilities. |
| `akm health` | Runtime / telemetry probe: surfaces backend status, artifact dirs, recent improve metrics, and scheduler reachability. |
| `akm config get <key>` / `set <key> <value>` | Read or write configuration. |
| `akm upgrade` | Self-update the CLI. |
| `akm help migrate <version>` | Preview release notes and migration guidance. |

## Discovery

| Command | Purpose |
|---|---|
| `akm search <query>` | Search local stash content by default. |
| `akm search <query> --source registry` | Search only registries. |
| `akm search <query> --source both` | Merge local and registry discovery. |
| `akm search <query> --source <name>` | Scope the search to one named stash (use the name from `akm list`). |
| `akm search <query> --type <type>` | Filter by asset type (`script`, `skill`, `command`, `agent`, `knowledge`, `workflow`, `wiki`, `env`, `secret`, `memory`, `lesson`). |
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
| `akm workflow start <ref>` / `next` / `complete` / `status` | Run stateful workflows. |
| `akm workflow create <name>` / `validate <ref\|path>` | Author or validate workflow files. |
| `akm tasks add <id> --schedule "..." --workflow <ref>` | Register a scheduled task in `tasks/<id>.yml` and install it in the OS scheduler. |
| `akm tasks add <id> --schedule "..." --prompt "..."` | Register a scheduled prompt task. |
| `akm tasks add <id> --schedule "..." --command "..."` | Register a scheduled shell command task. |
| `akm tasks list` / `akm tasks show <id>` / `akm tasks run <id>` / `akm tasks history` / `akm tasks doctor` | Inspect or execute scheduled task assets. |
| `akm tasks enable <id>` / `disable <id>` / `remove <id>` / `sync` | Manage task lifecycle and scheduler reconciliation. |
| `akm remember "<text>"` | Append a memory fragment to the working stash. |
| `akm import <file\|url\|->` | Ingest a knowledge document into the stash. |
| `akm feedback <ref> --positive` | Record positive feedback. |
| `akm feedback <ref> --negative --reason "why it missed"` | Record negative feedback with a durable reason. |
| `akm sync -m "msg" [--no-push]` | Commit and optionally push the git-backed working stash (`--no-push` to skip the push). |

> ⚠️ **Task files must be `.yml`.** Legacy `tasks/*.md` files are warned at
> load time and silently skipped — they will never be scheduled. Each task
> file picks exactly one target: `workflow:`, `prompt:`, or `command:`.

## Proposal queue and self-improvement (v0.8.0+)

| Command | Purpose |
|---|---|
| `akm extract [--type claude-code\|opencode] [--since <window>] [--auto] [--dry-run]` | Extract durable insights from native session files (Claude Code, OpenCode) and queue them as proposals. Replaces the legacy session-checkpoint hook. `--auto` iterates all available harnesses; `--since` sets the discovery window (default 24h). |
| `akm improve [ref\|type] [--task "..."] [--profile <name>] [--auto-accept safe\|N] [--dry-run]` | Propose improvements to an existing asset, type, or the whole stash. Runs memory consolidation when the `consolidate` process is enabled in the active profile. `--auto-accept safe` promotes proposals at ≥90 % confidence without review. |
| `akm propose <type> <name> --task "..."` | Draft a brand-new asset and queue it as a proposal. |
| `akm proposal list [--status pending\|accepted\|rejected]` | List proposal-queue entries (bare `akm proposal` also lists). |
| `akm proposal show <id>` | Render a proposal. |
| `akm proposal diff <id>` | Diff a proposal against the live asset. Accepts a UUID or UUID prefix. |
| `akm proposal accept <id>` | Validate and promote a proposal into the stash. |
| `akm proposal reject <id> --reason "..."` | Reject and archive a proposal. |
| `akm proposal revert <id>` | Roll back a previously accepted proposal (per-id only — no batch revert). |
| `akm proposal drain [--policy <preset\|path>] [--promote] [--yes] [--dry-run] [--max-accepts N] [--max-diff-lines N] [--older-than D] [--judgment] [--profile <p>]` | Drain the standing **pending** backlog by a deterministic policy. **Mutating** when `--promote` is set: promotes/rejects proposals and commits to git. See below. |
| `akm health [--window-compare] [--format json]` | Probe runtime health and improve-pipeline metrics. Use `--window-compare` to spot throughput regressions. |

In 0.8.0, lesson distillation is part of `akm improve <ref>` rather than a
separate public `distill` command. See `knowledge:akm-improve-and-extract` for
pipeline tuning guidance.

### `akm proposal drain` — deterministic backlog triage (v0.8.0-rc.12+)

`akm proposal drain` clears the standing pending backlog using a deterministic
triage **policy**, so you no longer need a manual agent session to keep the queue
from growing. For case-by-case review of individual drafts, use the per-id
`akm proposal show|diff|accept|reject` flow — see
`knowledge:akm-proposals-and-lessons`.

Default mode is **queue** (stage/reject-empty only — never promotes); pass
`--promote` to actually accept matching proposals. Promotion commits to git and
has no batch revert, so `--dry-run` first.

Built-in presets (`--policy`):

| Preset | Accepts | Rejects | Leaves pending |
|---|---|---|---|
| `personal-stash` | extract w/ real content; reflect ≤80 lines; consolidate ≤ band | empty diffs | consolidate mid-band, distill dups, contradictions |
| `conservative` | small extract + consolidate only | empty diffs | everything else |
| `manual` | nothing | empty diffs | everything else |

`--policy <path>` loads a custom policy file. Key flags:

- `--promote` — actually accept (default is stage-only queue mode).
- `--yes` — required for promotion in non-interactive mode.
- `--dry-run` — list accept/reject/defer decisions without writing.
- `--max-accepts N` — hard per-run accept ceiling (overflow → `skippedByCap`).
- `--max-diff-lines N` — defer (never promote) accepts above this size.
- `--older-than D` — only consider proposals older than D days.
- `--judgment` — opt into the judgment tier (llm by default; agent/sdk per config)
  for deferred mid-band/dup/contradiction items.
- `--profile <p>` — read the triage block (policy, applyMode, ceilings, judgment)
  from an improve profile.

```bash
# Preview what the personal-stash policy would do:
akm proposal drain --policy personal-stash --dry-run

# Actually drain (promote) the backlog non-interactively:
akm proposal drain --policy personal-stash --promote --yes
```

Triage also runs automatically as a **pre-pass inside `akm improve`** when
`processes.triage` is enabled in the active profile — see
`knowledge:akm-improve-and-extract`.

## Wikis, env, and secrets

| Command | Purpose |
|---|---|
| `akm wiki list` / `ingest` / `register` / `lint` | Manage multi-page wiki assets. |
| `akm env list` | List all env refs. |
| `akm env path <ref>` | Print the absolute file path for an env asset (for `--env-file` consumers). |
| `akm env run <ref> -- <cmd>` | Inject env into a child command without values reaching stdout. |
| `akm env create --from-file <path>` | Ingest an existing `.env` file (mode 0600; refuses to clobber). |
| `akm env export <ref> --out <file>` | Write re-serialized export lines to a file (mode 0600; never prints to stdout). |
| `akm env remove <ref>` | Delete an env asset. |
| `akm secret list` | List secret refs. |
| `akm secret path <ref>` | Return the absolute file path for a secret (`_FILE`-style consumers). |
| `akm secret set <ref> --from-file <path>` | Store a whole-file secret. Value never goes through chat. |
| `akm secret run <ref> <VAR> -- <cmd>` | Inject secret value into child process environment. |
| `akm secret remove <ref> --yes` | Delete a secret. |

## Workflow authoring contract (v0.8.0)

akm v0.8.0 workflows are markdown documents with:

- optional frontmatter keys: `description`, `tags`, `params`
- exactly one `# Workflow: <title>` heading
- one `## Step: <title>` section per step
- one `Step ID: <id>` line per step
- one `### Instructions` section per step
- optional `### Completion Criteria` list per step

Older frontmatter-only step arrays are not the current contract.

## Good defaults for agents

- Prefer `akm show <ref> --shape agent` when you need execution-ready output.
- Prefer `akm curate <query>` before raw `search` when the task is “find the
  best asset for this job.”
- Treat proposal content as draft material until it has been explicitly
  accepted.
- Use `--source both` only when you intentionally want local + registry results
  in one pass.
- For recurring work, prefer `akm tasks add` over ad hoc cron notes in docs or
  shell history.
