---
description: Use when an agent needs to run, configure, or tune the akm self-improvement pipeline — including akm improve, akm extract, and akm health.
tags: [akm, improve, extract, health, pipeline]
quality: curated
updated: 2026-06-01
---

# akm Improve and Extract Pipeline

> **Version target:** akm-cli v0.8.0

akm's self-improvement loop is built on three commands: **extract** (harvest
durable insights from session logs), **improve** (analyze and propose changes
to stash assets), and **health** (diagnose the pipeline's throughput). They
can run independently or together on a schedule via `akm tasks`.

## akm extract — session knowledge harvesting

`akm extract` reads native session files from Claude Code or OpenCode and
queues durable insights as proposals. It replaces the legacy session-checkpoint
hooks.

```bash
# Harvest the last 24 hours from Claude Code sessions (default window):
akm extract --type claude-code

# Harvest from OpenCode sessions in the last 7 days:
akm extract --type opencode --since 7d

# Harvest all available harnesses automatically:
akm extract --auto

# Preview without queuing (dry run):
akm extract --type claude-code --dry-run

# Re-process a specific session even if already seen:
akm extract --type claude-code --session-id <id> --force
```

Run `akm proposal list` after `extract` to review the queued candidates.

## akm improve — asset improvement proposals

`akm improve` analyzes existing stash assets and generates improvement
proposals. It also runs the memory-consolidation process
(`profiles.improve.default.processes.consolidate.enabled`) when configured.

```bash
# Improve one asset:
akm improve knowledge:akm-quickstart

# Improve all assets of a type:
akm improve skill

# Whole-stash pass (highest utility first):
akm improve

# Add a specific task directive:
akm improve --task "Update CLI flag references for v0.8.0"

# Dry run — show planned actions without writing:
akm improve --dry-run

# Auto-accept proposals at or above 90 % confidence:
akm improve --auto-accept safe

# Cap to N assets per run:
akm improve --limit 10
```

### Improve profiles

Built-in profiles control which sub-processes run:

| Profile | What it runs |
|---|---|
| `default` | All processes for the asset's type |
| `quick` | Fast surface pass only |
| `thorough` | Extended analysis pass |
| `memory-focus` | Memory consolidation + contradiction detection only |

```bash
akm improve --profile memory-focus
akm improve --profile thorough skill
```

Custom profiles live under `profiles.improve.<name>` in
`~/.config/akm/config.json`. Each profile can enable or disable individual
processes: `consolidate`, `distill`, `reflect`, `graph-boost`.

## akm health — pipeline diagnostics

`akm health` probes the runtime state and surfaces improve-pipeline metrics.

```bash
akm health

# Compare two windows to spot throughput regressions:
akm health --window-compare

# JSON output for scripting:
akm health --format json
```

Key fields to watch in health output:
- `improve.lastRun` — timestamp of the most recent improve run.
- `improve.proposalsPending` — proposals waiting for review.
- `improve.distillAttempts` — how often distill ran in the window.
- `extract.lastRun` — timestamp of the most recent extract run.

## Combining extract → improve → review

The canonical pipeline for an agent maintaining an active stash:

```bash
# 1. Harvest knowledge from recent sessions:
akm extract --auto

# 2. Improve assets based on accumulated feedback and new signals:
akm improve --auto-accept safe --limit 20

# 3. Review remaining proposals:
akm proposal list --status pending
akm proposal show <id>
akm proposal diff <id>
akm proposal accept <id>   # or akm proposal reject <id> --reason "..."

# 4. Verify pipeline health:
akm health --window-compare
```

Automate this as a scheduled task — see `tasks/nightly-improve-cycle.yml` in
this stash for a ready-to-install example.

## Tuning guidance

| Symptom | Likely cause | Fix |
|---|---|---|
| `improve` produces no proposals | No feedback signal, no retrieval history | Add `akm feedback <ref> --positive/--negative` then re-run; or lower `--min-retrieval-count 0` |
| Too many low-quality proposals | Auto-accept threshold too low | Raise `--auto-accept` to 90+ or use `--auto-accept=false` + manual review |
| Memory consolidation not running | `consolidate` disabled in profile | Check `profiles.improve.default.processes.consolidate.enabled` in config |
| Extract finds nothing new | Sessions already processed | Pass `--force` to re-process; or extend `--since` window |
| Distill cooldown blocking | Distill ran too recently | Check cooldown in config (`profiles.improve.default.processes.distill.cooldownDays`) |

## Good operator habits

- Run `akm health` before and after tuning to measure impact.
- Review proposals before bulk-accepting; `akm proposal diff <id>` shows the exact change.
- Prefer `--auto-accept safe` (≥90 % confidence) over `--auto-accept 0` for unattended runs.
- Use `--dry-run` on first use in a new stash to understand what improve would touch.
- Schedule `extract` + `improve` together — extract first so improve has fresh signals.
