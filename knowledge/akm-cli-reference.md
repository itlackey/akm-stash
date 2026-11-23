---
description: Use when an agent needs the main akm-cli 0.10.261130 commands, flags, proposal review flow, and task authoring rules in one place.
tags: [akm, cli, reference]
quality: curated
updated: 2026-11-23
---

# akm CLI Reference

Quick reference for the main `akm` surfaces an agent is likely to use.
Current as of **0.10.261130**. For authoritative syntax, run
`akm help <cmd>` or `akm <cmd> --help`; `akm hints` prints the short agent
guide. Commands marked *Deprecated* still work in 0.10.x, print one notice on
stderr naming the replacement, and are removed in 0.11.

## Global output controls

| Flag | Purpose |
|---|---|
| `--format json\|jsonl\|yaml\|text\|md` | Choose the output format (`json` by default). `yaml` is Deprecated. |
| `--detail brief\|normal\|full` | Choose how much data to return. `agent` (a token-lean view of `search`, `curate`, `show`) is Deprecated: use `normal`. |
| `--output <file>` | Write rendered output to a file. Deprecated: redirect stdout. |
| `--quiet` / `--verbose` | Suppress warnings or emit extra diagnostics. |
| `--config <file>` | Use another config file for one call; put it before the command. |

`--shape` no longer exists. `--format html` no longer exists (use `md`).

## Setup & system

| Command | Purpose |
|---|---|
| `akm setup` | Guided first-run wizard: agent programs, connection, embeddings, bundle directory, registries, initial index. Scripted: `akm setup --yes` (add `--endpoint <url>`, `--harness <a,b>`, `--embedding <model\|local\|off>`, `--no-probe` to answer a question each). |
| `akm bundle create [--dir <path>]` | Scaffold the working bundle skeleton only (`scripts/`, `skills/`, `commands/`, `agents/`, `knowledge/`, `instructions/`, `rules/`, `memories/`, `env/`, `secrets/`, `lessons/`, `tasks/`, `sessions/`, `facts/`). The path goes through `--dir`; a positional path is a usage error. |
| `akm index [--full]` | Build or refresh the local search index. An index build never waits for another: it skips and exits 0. |
| `akm doctor` | Runtime health, durable state, scheduler, connections, harnesses, improve telemetry. Exit 0 ok, 4 warning, 1 failure. `--read-only --no-probe` inspects offline without writes. |
| `akm doctor info` | Version, configured bundles, registries, index and search capabilities. |
| `akm doctor log [--task <id>] [--limit N]` | Event stream, or one task's run history. |
| `akm doctor metrics [usage\|improve\|assets] [--since 7d]` | Read-only usage and outcome reports (Experimental payload). |
| `akm doctor scheduler sync [--dry-run] [--prune [--yes]] [--rebind]` | Reconcile (or prune orphaned) OS scheduler entries for scheduled tasks. |
| `akm doctor explain <ref>` | Print what a task would run, read-only and secret-free. |
| `akm doctor prompt <ref>` | Show the reflect prompt for one asset without a model call. |
| `akm config get <key>` / `set <key> <value>` / `list` / `unset <key>` / `path` / `diff` | Read or write configuration. |
| `akm migrate status` / `akm migrate apply [<task-file>...]` | Inspect or apply pending migrations; named task files convert to task source v5. |
| `akm upgrade` | Self-update the CLI and the installed harness plugins. |

*Deprecated:* `akm health` (use `akm doctor`), `akm info` (use `akm doctor
info`), `akm log` (use `akm doctor log`), `akm metrics` (use `akm doctor
metrics`), `akm help migrate` (read the changelog and migration guide).

## Discovery

| Command | Purpose |
|---|---|
| `akm search <query>` | Search local bundle content by default. |
| `akm search <query> --from registry` | Search only registries. |
| `akm search <query> --from all` | Merge local and registry discovery. `--from <bundle-name>` limits a search to one bundle. |
| `akm search <query> --type <type>` | Filter by asset type (`script`, `skill`, `command`, `agent`, `knowledge`, `instruction`, `rule`, `workflow`, `env`, `secret`, `memory`, `lesson`, `task`, `session`, `fact`). |
| `akm search "memories/projectA/"` | ConceptId-prefix enumeration: a query ending in `/` lists a subtree instead of keyword-matching. |
| `akm search <query> --filter key=value` | Require matching frontmatter. `--prefer key=value` only ranks matches higher. |
| `akm search <query> --include quality=proposed` | Include assets with `quality: "proposed"`. `--include type=session` includes session assets. |
| `akm curate <query>` | Return a compact shortlist with previews and follow-up commands. |
| `akm curate <query> --max-tokens <n>` | Return the ranked local assets' content in one combined token budget. Lower-ranked whole assets are dropped first; registry hits are never packed. |
| `akm show <ref>` / `akm show <ref>#<fragment>` | Display a locally indexed asset; `#fragment` selects one markdown section by heading slug. |
| `akm show <ref> --outline` | Outline (`toc` with each heading's slug) and brief metadata, no body. |
| `akm show <ref>#<slug> --lead [--max-tokens N]` | One section plus the document lead; `--max-tokens` bounds the body. |
| `akm rules` | Print the rules that apply here, in full (Experimental). |
| `akm registry list` / `akm registry add <url> --name <alias>` / `akm registry remove <url-or-name>` | Manage discovery registries. Searching a registry is `akm search --from registry`. |

Refs use the `[bundle-slug//]conceptId[#fragment]` grammar:
`skills/code-review`, `memories/vpn-note`, `<bundle-slug>//knowledge/<asset>`.
`github:owner/repo` and `npm:@scope/pkg` are source locators for `akm bundle
add`, not `show` or search-result refs.

Local search hits at `--detail normal` or `full` may include `matchStage`
(`exact`, `prefix`, `relaxed`). The response reports `searchMode`;
`fts-fallback` means a semantic attempt failed for that query and akm returned
keyword results with a warning.

*Deprecated:* `search --include-proposed` (use `--include quality=proposed`),
`search --include-sessions` (use `--include type=session`), `search
--by-usage` (use `akm doctor metrics assets`), `curate --pack` (use
`--max-tokens`), `show --context lead` and `--max-chars` (use `--lead` and
`--max-tokens`).

## Sources and install flows

| Command | Purpose |
|---|---|
| `akm bundle add <source>` | Register a source such as `./path`, `github:owner/repo`, `npm:@scope/pkg`, `git+https://...`, or a website URL. |
| `akm bundle list` | List configured sources. |
| `akm bundle update [--all\|<target>] [--force]` | Refresh managed sources. |
| `akm bundle remove <target>` | Remove a configured source and reindex. |
| `akm import <ref> --asset-ref [--dest <dir>] [--name <new-name>] [--bundle <name>]` | Copy a single asset into a writable bundle or a custom destination. A GitHub/npm source locator plus `//conceptId` is also accepted. |

To update akm itself, use `akm upgrade`, not `akm bundle update`.
*Deprecated:* `akm clone` (use `akm import <ref> --asset-ref`).

## Execution and authoring

| Command | Purpose |
|---|---|
| `akm run <ref>` | Run an asset by its ref: a task (declared input flags), an agent (`--prompt`), a command (`--arguments`), or a script. |
| `akm run [--env <ref>] [--secret <ref>:<VAR>] scripts/<file> [args]` | Run a script with env assets and secrets injected. akm's flags go before the ref; everything after it is the script's own. |
| `akm run <task-ref> --resume` | Continue the most recent failed run of a version 5 task at the step that failed. |
| `akm exec [--env <ref>] [--secret <ref>:<VAR>] -- <cmd>` | Run any command with env and secrets injected. Experimental; off until `experimental.exec` is `true`. |
| `akm import <file> --type task` | Add a task file to the bundle. Then `akm task enable <ref>` to schedule it. |
| `akm task enable <ref>` / `akm task disable <ref>` | Turn a task's schedule on or off on this host. |
| `akm lint [--fix] [--type <type>] [<file>]` | Report bundle structure and reference findings. `--fix` applies ordinary repairs; a file outside every bundle needs `--type`. |
| `akm lint --prune-dangling-edges` | Opt-in removal of `supersededBy`/`contradictedBy` edges whose target is gone. Not implied by `--fix`. |
| `akm search --type task` / `akm show tasks/<id>` | Enumerate or inspect task assets. |
| `akm remember "<text>"` | Record a memory in the working bundle (`--description`, `--tag`, `--expires`, `--source`). |
| `akm import <file\|url\|->` | Ingest a knowledge document into the bundle. |
| `akm feedback <ref> --positive` | Record that the asset helped (ranking only). |
| `akm feedback <ref> --negative --reason "what is wrong and what it should say"` | Flag wrong or stale content. Add `--replace "<current>" --with "<fixed>" --source "<where verified>"` for an exact fix. |
| `akm sync -m "msg" [--no-push]` | Commit and optionally push the git-backed working bundle. |

*Deprecated, removed in 0.11:* `akm agent` and `akm command run` (use `akm run
<ref>`); `akm task run` (use `akm run <task-ref>`); `akm task add` (use `akm
import <file> --type task`); `akm task sync|prune|doctor|explain|history` (use
`akm doctor scheduler sync [--prune]`, `akm doctor`, `akm doctor explain`, `akm
doctor log --task <id>`); every `akm workflow` command (workflows become tasks;
`akm migrate apply workflows/<name>.md` writes `tasks/<name>.yml`).

Slash-command assets under `commands/` use the literal `$ARGUMENTS`
placeholder; `akm run commands/<name> --arguments "<text>"` substitutes it.
Positional `$1`/`$2` are not expanded by akm.

### Task files

A task is a pure-YAML file at `tasks/<id>.yml`. Two sources are read in 0.10:

- **Task source v5** (`version: 5-beta.1`, Experimental). A task is a list of
  akm commands run in order: `run: <ref>` is `akm run`, `exec: <command>` is
  `akm exec`, `prompt: <text>` is `akm exec --prompt`. A step takes the
  command's own options (`env`, `secret`, `cwd`, `timeout`, `max-retries`,
  `inherit`, and `harness`, `connection`, `model` for agent steps). `inputs:`
  declares the task's flags, `${name}` fills an input or an earlier step's
  result into `prompt:`, `arguments:` or `args:`, and a script step reads all
  state as JSON from the file named by `AKM_TASK_STATE`. `lock: true` allows
  one run at a time. A failed step stops the run; `akm run <task> --resume`
  continues it. Task steps do not need `experimental.exec`. `akm migrate apply
  <task-file>` converts a v4 file; 0.11 refuses `version: 4`.
- **Task source v4** (`version: 4`). One top-level target, `uses:` (`akm/command`
  or a `commands/` or `scripts/` ref) or `run:` (one shell line), optional
  `schedule:` entries and `timeout:`. Unchanged through 0.10.x.

Check a file with `akm lint <file> --type tasks` and preview it with `akm doctor
explain <ref>`. Reconcile schedules with `akm doctor scheduler sync --dry-run`
then without `--dry-run`.

## Proposal queue and self-improvement

| Command | Purpose |
|---|---|
| `akm proposal extract [--sessions claude\|codex\|opencode \| --auto] [--since <window>] [--dry-run]` | Extract durable insights from native session files and queue them as proposals. `--auto` iterates all available harnesses; `--since` sets the discovery window (default 24h). `--type` is a Deprecated alias of `--sessions`. There is no `--watch`: schedule it as a task. |
| `akm improve [ref\|type] [--task "..."] [--strategy <name>] [--limit N] [--dry-run]` | Propose improvements to an existing asset, type, or the whole bundle. Gate-passed proposals are accepted and committed by default; the rest wait as `pending`. |
| `akm proposal new <type> <name> --task "..."` | Draft a brand-new asset and queue it as a proposal. |
| `akm proposal list [--status pending\|accepted\|rejected\|reverted] [--generator <name>]` | List proposal-queue entries. A bare `akm proposal` runs `list`. |
| `akm proposal show <id>` | Render a proposal with its validation findings. |
| `akm proposal diff <id>` | Diff a proposal against the live asset. Accepts a UUID, a UUID prefix, or an asset ref. |
| `akm proposal accept <id>...` | Validate and promote proposals into the bundle; one git commit for several ids. |
| `akm proposal reject <id> --reason "..."` | Reject and archive a proposal. |
| `akm proposal reopen <id>` | Undo a rejection: move it back to `pending`. |
| `akm proposal revert <id>` | Roll back a previously accepted proposal. |
| `akm proposal accept --generator <name> [--max-diff-lines N] [--older-than D] -y` / `akm proposal reject --generator <name> --reason "..."` | Bulk-accept or bulk-reject every pending proposal from one generator (`reflect`, `distill`, `extract`, ...). Bulk accept needs `-y`/`--yes` without a terminal; add `--dry-run` to preview. |
| `akm proposal drain [--promote] [--yes] [--dry-run] [--max-accepts N] [--older-than D] [--judgment] [--strategy <name>]` | Drain the standing **pending** backlog by one rule. Experimental. |

*Deprecated:* `akm improve report` (use `akm doctor metrics improve`), `akm
improve judge` and `akm judge` (use `akm doctor judge`), `akm improve
--show-prompt` (use `akm doctor prompt`), `akm improve --require-feedback-signal`,
`--timeout-ms` (use `--timeout`).

### `akm proposal drain`: backlog triage

One rule decides each pending proposal. A proposal whose quality judge passed
on its current content is accepted (unless its target changed since it was
minted: that one is rejected as `stale-target`). An empty diff is rejected.
Reflect and distill proposals deferred for review, and everything the
proactive-maintenance lane produced, are left for a person. The optional
judgment tier (`--judgment`) may accept only consolidate promotions; any other
kind it would accept is left for a person.

A bare drain **queues**: it stages decisions and writes nothing to assets.
`--promote` accepts, asks for confirmation first, and needs `--yes` without a
terminal. Promotion commits to git, so `--dry-run` first.

```bash
akm proposal drain --dry-run
akm proposal drain --promote --yes
akm proposal drain --max-accepts 10 --older-than 7 --promote --yes
```

Key flags: `--max-accepts N` (hard per-run ceiling; overflow is reported as
`skippedByCap`), `--older-than D` (only proposals older than D days),
`--judgment` (enable the judgment tier for this drain), `--strategy <name>`
(read the triage block from an improve strategy). There are no `--policy`
presets.

Triage also runs automatically as a **pre-pass inside `akm improve`**: the
`default` strategy runs it in `promote` mode with judgment off. See
`knowledge/akm-improve-and-extract`.

### Improve strategies

`akm improve --strategy <name>` selects a strategy; the order is `--strategy`,
config `improve.strategy`, then built-in `default`. The built-ins are
**`default`** and **`consolidate`**. A strategy named `quick`, `thorough`,
`catchup`, `reflect-distill` or `proactive-maintenance` is an ordinary
user-defined strategy that inherits `default`, not a built-in. Custom strategies
live under `improve.strategies.<name>`. A strategy says which processes run and
how they are tuned, never where they run (`improve.connection`,
`improve.harness`, or `--connection`/`--harness`/`--model` choose that).

## Env and secrets

An LLM wiki (`schema.md` + `pages/`) is a **bundle format**, not an asset
type: `akm bundle add` it like any other source; there is no `akm wiki`.

| Command | Purpose |
|---|---|
| `akm env list` | List all env refs. |
| `akm env path <ref> [--quiet]` | Print the absolute file path for an env asset (for `--env-file` consumers). |
| `akm env create <ref> [--from-file <path>]` | Create or ingest an existing `.env` file (mode 0600; refuses to clobber). Refs are full: `env/prod`. |
| `akm env export <ref> --out <file>` | Write re-serialized export lines to a file (mode 0600; never prints to stdout). |
| `akm env remove <ref>` | Delete an env asset. |
| `akm secret list` | List secret refs. |
| `akm secret set <ref>` (value via stdin, `--from-file` or `--from-env`) | Store a whole-file secret. The value never goes through chat or argv. |
| `akm secret remove <ref> --yes` | Delete a secret. |

To use their values, put the command in a script asset and run
`akm run --env env/prod --secret secrets/deploy-key:DEPLOY_KEY scripts/<file>`.
*Deprecated:* `akm env run` and `akm secret run`.

## Good defaults for agents

- Prefer `akm curate <query>` before raw `search` when the task is "find the
  best asset for this job."
- Add `--max-tokens <n>` to `curate` when the task needs the chosen local
  content now; keep ordinary curate output when refs and follow-up actions are
  enough.
- Use `akm show <ref> --outline`, then `akm show <ref>#<slug>`, for a large
  document.
- Treat proposal content as draft material until it has been accepted.
- Use `--from all` only when you intentionally want local and registry results
  in one pass.
- For recurring work, write a task file and schedule it, instead of ad hoc
  cron notes in docs or shell history.
