---
name: akm-migrate
description: Use when upgrading akm-cli to 0.10.261130 and you need to verify the upgrade, find callers of removed or deprecated commands, convert workflows and tasks, or prepare for 0.11.
updated: 2026-11-23
---

# akm 0.10.261130 Upgrade Guide

Use this guide to upgrade to 0.10.261130 and to move callers off what 0.11
removes. 0.10 reads what akm 0.9.15 and later wrote; an install older than
0.9.15 must go through 0.9.31 first (`akm-cli@0.9.31`, then `akm migrate apply`
under it). 0.10 adds no `state.db` migration and no `index.db` layout change.
`akm migrate` converts config, task and workflow files; it is not a general
database tool.

## 1. Check the starting point

```bash
akm --version
akm migrate status
akm workflow list --active
```

On 0.9.15 or later `akm migrate status` should end with `status: "current"`;
if not, run `akm migrate apply` under 0.9.x first. Let active workflow runs
finish or abandon them on purpose. Accept or reject pending retire proposals
written by 0.9 (`akm proposal accept|reject`); 0.10 refuses to accept them.

## 2. Find callers that need a change

These are unknown flags or commands (exit 2) in 0.10, with no alias. Search
scripts, hooks, agent instructions, tasks and the crontab before upgrading:

```bash
grep -rnE -- '--shape|help agents|task (list|validate)|config path --all|improve .*(--plan|--auto-accept)|--strategy +(quick|reflect-distill|thorough|catchup|proactive-maintenance)' <script and task dirs>
crontab -l | grep akm
```

| Gone | Use |
|---|---|
| `akm help agents` | `akm hints` |
| `--shape agent` / `--shape summary` | `--detail agent` / `--detail brief` |
| `--target` on `import`, `env create`, `env remove`, `secret set`, `proposal accept\|diff\|revert` | `--bundle` |
| `akm task list` | `akm search --type task` |
| `akm task validate <path>` | `akm lint <file> --type tasks` |
| `akm config path --all` | `akm doctor info` |
| `akm improve --plan` | `akm improve --dry-run` |
| `akm improve --auto-accept` | the default `akm improve` (gate-passed proposals are accepted), or `akm proposal drain --promote --yes` |
| `akm env`/`akm secret` bare names (`prod`) | full refs (`env/prod`, `secrets/token`) |

Built-in improve strategies are only `default` and `consolidate`. `quick`,
`reflect-distill`, `thorough`, `catchup` and `proactive-maintenance` now name
an ordinary user strategy that inherits `default`; an unknown `--strategy`
fails with `UNKNOWN_IMPROVE_STRATEGY`. The shipped tasks `akm-improve-nightly`,
`akm-improve-frequent` and `akm-improve-catchup` are gone; the nightly
template is `core/improve`.

## 3. Upgrade and migrate

```bash
akm upgrade --check
akm upgrade
akm migrate status
```

`akm upgrade` installs the release, runs `akm migrate apply` (config
`engines` become `connections` and `harnesses`, keys move to
`credentials.json`, retired keys are dropped under a backup in
`<cache dir>/config-backups/`, task files at v2 or v3 become v4), then
updates the harness plugins. It exits 1 when the migration is blocked.
Quit OpenCode first: the plugin step reports `deferred` while it runs.
Fix what `apply` reports: a key it could not move stays on its connection as
`apiKey` and is never sent, so put it in `credentials.json` (`akm setup`) or
reference an environment variable (`"apiKey": "$NAME"`).
`--engine NAME` still runs with a warning; use `--connection` or `--harness`.

## 4. Move off what 0.11 removes

Deprecated commands still work in 0.10 and print one stderr line naming the
replacement (`-q` silences it). Check [STABILITY.md](https://github.com/itlackey/akm/blob/main/STABILITY.md)
for the full list; the common ones:

| Deprecated | Use |
|---|---|
| `akm task run`, `akm agent <ref>`, `akm command run`, `akm workflow run` | `akm run <ref>` |
| `akm env run <ref> -- cmd`, `akm secret run` | a script under `scripts/`, run with `akm run --env <ref> scripts/<file>` or `--secret <ref>:<VAR>` |
| `akm health`, `akm task doctor` | `akm doctor` |
| `akm metrics`, `akm improve report` | `akm doctor metrics`, `akm doctor metrics improve` |
| `akm info`, `akm log`, `akm task history` | `akm doctor info`, `akm doctor log`, `akm doctor log --task <id>` |
| `akm task sync`, `task prune` | `akm doctor scheduler sync`, `akm doctor scheduler sync --prune` |
| `akm task explain`, `akm workflow plan` | `akm doctor explain <ref>` |
| `akm task add` | `akm import <file> --type task` |
| `akm clone` | `akm import <ref> --asset-ref` |
| `akm migrate apply --dry-run` | `akm migrate status` |
| `akm lint --auto-fix` | `akm lint --fix` |
| `akm search --include-proposed`, `--include-sessions`, `--by-usage` | `--include quality=proposed`, `--include type=session`, `akm doctor metrics assets` |
| `akm show --context`, `--max-chars` | `--lead`, `--max-tokens` |
| `akm proposal extract --type` | `--sessions` |

Config key `extends` is deprecated: copy the inherited settings into the local
config; `akm config get <key> --show-source` shows which keys come from the
base. OpenCode 1 as the `opencode` harness is deprecated; `akm doctor` warns
(`opencode-major`) while one is configured.

## 5. Convert workflows to tasks

Workflows are deprecated and removed in 0.11. `akm doctor` and
`akm migrate status` count the workflow files left in writable bundles.

```bash
akm migrate status workflows/<name>.md   # what it becomes, or why it cannot convert
akm migrate apply workflows/<name>.md    # writes tasks/<name>.yml; the workflow file stays
akm doctor explain tasks/<name>          # the check a start makes of the new task
```

A `blocked` file reports `detail` and `guidance`; the usual cause is a `${...}`
in step text that is not an input or an earlier step. Run the task once, point
task files and skills that named `workflows/<name>` at `tasks/<name>`, then
delete the workflow file. `akm migrate apply tasks/<name>.yml` converts a
named v4 task to the experimental `version: 5-beta.1`; a task not named stays
at v4 and keeps running.

## 6. Verify

```bash
akm doctor                  # exit 0 healthy; 4 = warning, read the check names; 1 = failure
akm upgrade --check         # per-plugin outcomes
akm improve --dry-run       # the strategy resolves and the plan shows the triage drain
akm lint --type tasks
akm search --type task      # tasks are indexed
```

Behaviour you will notice: a nightly `akm improve` now accepts and commits
proposals whose quality check passed (never proactive-lane proposals or distill
lessons). To keep every proposal for review, set
`improve.strategies.default.processes.triage.enabled` to `false`.
`akm index` no longer refetches git or website bundles; schedule
`akm bundle update --all` where you need them current.

Recovery: stop akm and OpenCode, install the earlier version, and restore
`config.json` from `<cache dir>/config-backups/`. Move plugins with the CLI.

See `references/breaking-changes.md` for the config-key and removed-feature
detail.
