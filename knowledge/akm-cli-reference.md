---
description: Use when an agent needs the main akm-cli 0.9.2 commands, flags, proposal review flow, and workflow or task authoring rules in one place.
tags: [akm, cli, reference]
quality: curated
updated: 2026-08-29
---

# akm CLI Reference

Quick reference for the main `akm` surfaces an agent is likely to use.
Current as of **0.9.2** (2026-08-29). For authoritative syntax, run
`akm <cmd> --help`.

## Global output controls

| Flag | Purpose |
|---|---|
| `--format json\|text\|yaml\|jsonl\|md\|html` | Choose the output format. |
| `--detail brief\|normal\|full` | Choose how much data to return (verbosity). |
| `--shape human\|agent\|summary` | Choose the output projection. `--shape agent` is the compact agent mode; `--shape summary` is valid only on `akm show`. |
| `--quiet` / `--verbose` | Suppress warnings or emit extra diagnostics. |

## Setup & system

| Command | Purpose |
|---|---|
| `akm setup` | Guided first-run wizard: config, bundle dir, providers, registries, and initial index. |
| `akm bundle create [--dir <path>]` | Scaffold the working bundle skeleton only (`scripts/`, `skills/`, `commands/`, `agents/`, `knowledge/`, `instructions/`, `workflows/`, `memories/`, `env/`, `secrets/`, `lessons/`, `tasks/`, `sessions/`, `facts/`). Use `setup` for full first-time onboarding. |
| `akm index [--full]` | Build or refresh the local search index. |
| `akm info` | Print version, configured sources, registries, and index/search capabilities (`bundleDir`, not the retired `stashDir`). |
| `akm health` | Health and telemetry probe: emits schemaVersion 3 checks, metrics, and recent improve-pipeline rollups. |
| `akm config get <key>` / `set <key> <value>` / `list` / `unset <key>` | Read or write configuration. `akm config show` was removed — use `list`. |
| `akm migrate status` / `akm migrate apply [--dry-run]` | Inspect or atomically convert task-v2 and task-v3 sources to task source v4. |
| `akm upgrade` | Self-update the CLI. |
| `akm help migrate <version>` | Preview release notes and migration guidance. |

## Discovery

| Command | Purpose |
|---|---|
| `akm search <query>` | Search local bundle content by default. |
| `akm search <query> --from registry` | Search only registries. |
| `akm search <query> --from all` | Merge local and registry discovery. |
| `akm search <query> --type <type>` | Filter by asset type (`script`, `skill`, `command`, `agent`, `knowledge`, `instruction`, `workflow`, `env`, `secret`, `memory`, `lesson`, `task`, `session`, `fact`). |
| `akm search "memories/projectA/"` | ConceptId-prefix enumeration — a query ending in `/` lists a subtree instead of keyword-matching. |
| `akm search <query> --filter user=alice --filter agent=claude` | Restrict results to matching scope metadata. |
| `akm search <query> --include-proposed` | Include assets with `quality: "proposed"`. |
| `akm curate <query>` | Return a compact shortlist plus suggested next commands. |
| `akm show <ref>` / `akm show <ref>#<fragment>` | Display a locally indexed asset; `#fragment` selects one markdown section by heading slug. |
| `akm show <ref> --filter key=value` | Require a scope match when resolving the asset. |
| `akm registry list` / `akm registry add <url> --name <alias>` / `akm registry remove <url-or-name>` | Manage discovery registries. Searching a registry is `akm search --from registry` — there is no `akm registry search`. |

Generic asset refs use the 0.9.2 `[bundle-slug//]conceptId[#fragment]`
grammar — `skills/code-review`, `memories/vpn-note`, and a bundle-qualified
knowledge ref written as `<bundle-slug>//knowledge/<asset>`. `github:owner/repo` and `npm:@scope/pkg` are
source locators for `akm bundle add`, not generic `show` or search-result
refs. `akm clone` is the narrow exception: it accepts a supported source
locator plus `//conceptId`. The pre-0.9.0 `type:name` colon grammar was
removed with no compatibility alias.

## Sources and install flows

| Command | Purpose |
|---|---|
| `akm bundle add <source>` | Register a source such as `./path`, `github:owner/repo`, `npm:@scope/pkg`, `git+https://...`, or a website URL. |
| `akm bundle list` | List configured sources. |
| `akm bundle update [--all\|<target>] [--force]` | Refresh managed sources. |
| `akm bundle remove <target>` | Remove a configured source and reindex. |
| `akm clone <ref> [--dest <dir>] [--name <new-name>] [--bundle <name>]` | Copy a single asset into a writable bundle or a custom destination. For clone only, a GitHub/npm source locator plus `//conceptId` is also accepted. |

`akm add`/`akm list`/`akm remove`/`akm update` are retired 0.8 spellings —
the whole group moved under `akm bundle`. To update akm itself, use `akm
upgrade`, not `akm bundle update`.

## Execution and authoring

| Command | Purpose |
|---|---|
| `akm workflow run <ref\|run-id>` | Start, resume, or continue a workflow run to completion, failure, or an explicit limit. There is no separate `start`/`next`/`complete`. |
| `akm workflow status <ref\|run-id>` / `akm workflow list [--active]` / `akm workflow resume <run-id>` | Inspect or resume runs. |
| `akm workflow plan <ref>` | Compile and freeze a workflow graph read-only before a durable run. |
| `akm workflow create <name> [--print] [--from <file>]` | Author a unified markdown workflow (frontmatter `params`/`steps` + step sections in the body). `--print` prints the starter template without writing; JSON output names its write root `bundleDir`. There is no `akm workflow template` or `validate` — use `akm lint --type workflows`. |
| `akm task add <id> --schedule "..." --prompt "..."` | Register a scheduled prompt task. |
| `akm task add <id> --schedule "..." --command "..."` | Register a scheduled shell command task. |
| `akm task run <id>` / `akm task explain <ref>` / `akm task history` / `akm task doctor` / `akm task sync [--rebind]` | Execute, explain read-only resolution, inspect, diagnose, or reconcile task assets. |
| `akm search --type task` / `akm show tasks/<id>` | Enumerate or inspect task assets — there is no `task list`/`task show`. |
| `akm remember "<text>"` | Append a memory fragment to the working bundle. |
| `akm import <file\|url\|->` | Ingest a knowledge document into the bundle. |
| `akm feedback <ref> --positive` | Record positive feedback. |
| `akm feedback <ref> --negative --reason "why it missed"` | Record negative feedback with a durable reason. |
| `akm sync -m "msg" [--no-push]` | Commit and optionally push the git-backed working bundle (`--no-push` to skip the push). Replaces the retired `akm save`. |

> ⚠️ **Task files must be `.yml` and use `version: 4`.** A task selects exactly
> one top-level target: `uses:` (an `akm/command`, `commands/`, `scripts/`, or
> `workflows/` ref) or `run:` (one explicit shell string). `with:` is only for
> `uses: akm/command`; task controls such as `timeout` are top-level. Scheduling
> is optional and each list binding owns its `enabled:` state. V2/v3 files are
> rejected until migrated with `akm migrate apply --dry-run` then `akm migrate
> apply`. There is no task enable/disable/remove/list/show command — edit the
> YAML and run `akm task sync`, or use `akm search --type task`.

## Proposal queue and self-improvement (0.9.2)

| Command | Purpose |
|---|---|
| `akm proposal extract [--type claude\|opencode\|--auto] [--since <window>] [--dry-run]` | Extract durable insights from native session files (Claude Code, OpenCode) and queue them as proposals. `--auto` iterates all available harnesses; `--since` sets the discovery window (default 24h). There is no `--watch`/`--debounce-ms` — schedule it as a task instead. |
| `akm improve [ref\|type] [--task "..."] [--strategy <name>] [--dry-run]` | Propose improvements to an existing asset, type, or the whole bundle. Runs memory consolidation and lesson distillation when enabled in the active strategy. **`improve` never auto-promotes** — every proposal lands `pending`; there is no confidence-gated `--auto-accept`. |
| `akm proposal new <type> <name> --task "..."` | Draft a brand-new asset and queue it as a proposal. |
| `akm proposal list [--status pending\|accepted\|rejected\|reverted]` | List proposal-queue entries. Bare `akm proposal` (no verb) is a usage error — name the verb. |
| `akm proposal show <id>` | Render a proposal. |
| `akm proposal diff <id>` | Diff a proposal against the live asset. Accepts a UUID, a UUID prefix, or an asset ref. |
| `akm proposal accept <id>` | Validate and promote a proposal into the bundle. |
| `akm proposal reject <id> --reason "..."` | Reject and archive a proposal. |
| `akm proposal revert <id>` | Roll back a previously accepted proposal (full id/ref only — no UUID prefix, no batch revert). |
| `akm proposal accept --generator <name> [--max-diff-lines N] -y` / `akm proposal reject --generator <name> --reason "..." -y` | Bulk-accept or bulk-reject every pending proposal from one generator (e.g. `reflect`, `distill`, `extract`). Requires `-y`/`--yes` in non-interactive mode. |
| `akm proposal drain [--policy <preset\|path>] [--promote] [--yes] [--dry-run] [--max-accepts N] [--max-diff-lines N] [--older-than D] [--judgment] [--strategy <name>]` | Drain the standing **pending** backlog by a deterministic policy. **Mutating** when `--promote` is set. See below. |
| `akm health [--since <window>] [--window-compare <window>] [--report]` | Probe runtime health and improve-pipeline metrics. |

The flat verbs `akm extract`, `akm propose`, `akm proposals`, `akm accept`,
`akm reject`, `akm diff`, `akm revert`, `akm reflect`, and `akm distill` were
all removed in 0.9.0 — use the `akm proposal <verb>` forms above (`reflect`
and `distill` folded into `akm improve`).

### `akm proposal drain` — deterministic backlog triage

`akm proposal drain` clears the standing pending backlog using a
deterministic triage **policy**, so you no longer need a manual agent
session to keep the queue from growing. For case-by-case review of
individual drafts, use the per-id `akm proposal show|diff|accept|reject`
flow — see `knowledge/akm-proposals-and-lessons`.

Default mode is **queue** (stage/reject-empty only — never promotes); pass
`--promote` to actually accept matching proposals. Promotion commits to git
and has no batch revert, so `--dry-run` first.

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
- `--strategy <name>` — read the triage block (policy, apply mode, ceilings,
  judgment) from an improve strategy instead.

```bash
# Preview what the personal-stash policy would do:
akm proposal drain --policy personal-stash --dry-run

# Actually drain (promote) the backlog non-interactively:
akm proposal drain --policy personal-stash --promote --yes
```

Triage also runs automatically as a **pre-pass inside `akm improve`** when
`processes.triage` is enabled in the active strategy — see
`knowledge/akm-improve-and-extract`.

### Improve strategies (formerly "profiles")

`akm improve --profile <name>` was renamed to `akm improve --strategy
<name>` in 0.9.0; presets moved from `profiles.improve.<name>` in config to
`improve.strategies.<name>`. There is no confidence-gated `--auto-accept`
flag anymore — improve always writes to the proposal queue, never directly
to a live asset.

## Wikis, env, and secrets

| Command | Purpose |
|---|---|
| — | An LLM wiki (`schema.md` + `pages/`) is a **bundle format**, not an akm asset type — there is no `akm wiki` command family. `akm bundle add` it like any other source; its pages are indexed and searchable automatically. |
| `akm env list` | List all env refs. |
| `akm env path <ref> [--quiet]` | Print the absolute file path for an env asset (for `--env-file` consumers). |
| `akm env run <ref> -- <cmd>` | Inject env into a child command without values reaching stdout. |
| `akm env create <name> [--from-file <path>]` | Create or ingest an existing `.env` file (mode 0600; refuses to clobber). |
| `akm env export <ref> --out <file>` | Write re-serialized export lines to a file (mode 0600; never prints to stdout). |
| `akm env remove <ref>` | Delete an env asset. |
| `akm secret list` | List secret refs. |
| `akm secret set <ref>` (value via stdin or `--from-file`) | Store a whole-file secret. Value never goes through chat/argv. |
| `akm secret run <ref> <VAR> -- <cmd>` | Inject secret value into child process environment. |
| `akm secret remove <ref> --yes` | Delete a secret. |

The legacy `vault` type and `akm vault ...` command family are gone. There
is also no `akm env set`/`akm env unset` — edit the `.env` file directly;
akm loads it as-is.

## Workflow authoring contract (0.9.2)

akm 0.9.2 workflows are unified markdown documents with:

- frontmatter carrying the asset envelope plus the orchestration graph:
  `params` (JSON-Schema-typed), `steps` (an ordered list of `{ id, unit?,
  map?, route?, inputs?, output? }`), optional `defaults` and `budget`.
- exactly one `## <step-id>` heading per declared step, matching a frontmatter
  `steps[].id` exactly — no `# Workflow:` title prefix, no `Step:`/`Step ID:`
  lines.
- an optional `### gate` sub-heading inside a step section: the step's
  completion rubric, evaluated fail-closed by `workflow.judgeEngine` when
  non-empty. Omitted or empty skips validation.

Durable workflow plans produced by this release use `irVersion: 5` and
`hashVersion: 7`. Earlier plans remain inspectable and may be abandoned, but
cannot be resumed or advanced; abandon them and start a fresh run from current
source instead.

The old frontmatter-free `## Step: <title>` / `Step ID:` / `### Instructions`
/ `### Completion Criteria` heading contract is retired — a workflow written
that way fails `akm lint --type workflows` with `invalid-workflow-structure`
findings and is skipped entirely by `akm index`. Run `akm workflow create
<name> --print` for a starter template.

## Good defaults for agents

- Prefer `akm show <ref> --shape agent` when you need execution-ready output.
- Prefer `akm curate <query>` before raw `search` when the task is "find the
  best asset for this job."
- Treat proposal content as draft material until it has been explicitly
  accepted.
- Use `--from all` only when you intentionally want local + registry results
  in one pass.
- For recurring work, prefer `akm task add` over ad hoc cron notes in docs or
  shell history.
