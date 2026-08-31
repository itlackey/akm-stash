---
description: Use when an agent needs to run, configure, or tune the akm self-improvement pipeline — including akm improve, akm proposal extract, and akm health.
tags: [akm, improve, extract, health, pipeline]
quality: curated
updated: 2026-08-31
---

# akm Improve and Extract Pipeline

> **Version target:** akm-cli 0.9.6

akm's self-improvement loop is built on three commands: **proposal extract**
(harvest durable insights from session logs), **improve** (analyze and
propose changes to bundle assets), and **health** (diagnose the pipeline's
throughput). They can run independently or together on a schedule via `akm
task`.

## akm proposal extract — session knowledge harvesting

`akm proposal extract` reads native session files from Claude Code or
OpenCode and queues durable insights as proposals. It replaces the legacy
session-checkpoint hooks and is the standalone entrypoint for session
extraction — it runs independently of the improve-stage extract toggle
described below.

```bash
# Harvest the last 24 hours from Claude Code sessions (default window):
akm proposal extract --type claude

# Harvest from OpenCode sessions in the last 7 days:
akm proposal extract --type opencode --since 7d

# Harvest all available harnesses automatically:
akm proposal extract --auto

# Preview without queuing (dry run):
akm proposal extract --type claude --dry-run

# Re-process a specific session even if already seen:
akm proposal extract --type claude --session-id <id> --force
```

There is no `--watch`/`--debounce-ms` polling mode. For recurring
extraction, schedule `akm proposal extract --auto` as a task instead.

Run `akm proposal list` after extract to review the queued candidates.

## akm improve — asset improvement proposals

`akm improve` analyzes existing bundle assets and generates improvement
proposals. It also runs the memory-consolidation process
(`improve.strategies.default.processes.consolidate.enabled`) when configured.
**`improve` never promotes a proposal on its own** — there is no confidence
gate or `--auto-accept` flag. Every generated proposal lands `pending` and is
adjudicated later with `akm proposal accept`/`reject`, or in bulk with `akm
proposal drain`.

```bash
# Improve one asset:
akm improve knowledge/akm-quickstart

# Improve all assets of a type:
akm improve skill

# Whole-bundle pass (highest utility first):
akm improve

# Add a specific task directive:
akm improve --task "Update CLI flag references for 0.9.6"

# Dry run — show planned actions without writing:
akm improve --dry-run

# Cap to N assets per run:
akm improve --limit 10

# Only process assets with recent feedback signals (skip retrieval fallback):
akm improve --require-feedback-signal
```

### Improve strategies

Built-in strategies control which sub-processes run (renamed from
"profiles" in 0.9.0 — the flag is `--strategy`, not `--profile`):

| Strategy | What it runs |
|---|---|
| `default` | All processes for the asset's type; improve-stage extract and proactive maintenance off |
| `quick` | Fast surface pass only |
| `thorough` | Extended analysis pass |
| `frequent` | Tuned for high-frequency scheduled runs; improve-stage extract off |
| `memory-focus` | Memory consolidation + contradiction detection only |
| `reflect-distill` | Reflect + distill only; proactive maintenance off |
| `proactive-maintenance` | Opt-in dedicated preset for autonomous maintenance lanes |

```bash
akm improve --strategy memory-focus
akm improve --strategy thorough skill
```

Custom strategies live under `improve.strategies.<name>` in
`~/.config/akm/config.json`. Selection order is `--strategy`,
`defaults.improveStrategy`, then built-in `default`. Each strategy can
enable or disable individual processes: `consolidate`, `distill`, `reflect`,
`graphExtraction`, `memoryInference`, `triage`, `proactiveMaintenance`.
User-defined strategies inherit omitted fields from the built-in `default`
strategy before applying their own overrides.

### Triage pre-pass — drain the backlog before improving

`triage` is a first-class improve process that **drains the standing pending
proposal backlog before** the reflect/distill pass runs (it is a pre-pass,
not a tail step). It is the built-in, automated replacement for running a
manual proposal-management session — see `akm proposal drain` in
`knowledge/akm-cli-reference` for the standalone verb and policy presets.

It is **opt-in** (defaults off) and only fires on whole-bundle or
type-scoped runs — a single-ref `akm improve skills/x` never drains the
queue.

```jsonc
{
  "improve": {
    "strategies": {
      "default": {
        "processes": {
          "triage": {
            "enabled": false,          // opt-in
            "applyMode": "queue",      // queue (safe default, stage-only) | promote
            "policy": "personal-stash", // personal-stash | conservative | manual | <path>
            "maxAcceptsPerRun": 25,      // hard per-run accept ceiling
            "maxDiffLines": 200,         // defer accepts larger than this
            "rejectEmpty": true,
            "judgment": {                // OPTIONAL judgment tier for deferred items
              "enabled": true,
              "timeoutMs": 600000
            }
          }
        }
      }
    }
  }
}
```

`applyMode: queue` (the default) stages and reject-empties only — it never
promotes. Set `applyMode: promote` to auto-accept. Because triage runs
first, the queue is cleared before reflect re-analyzes assets, avoiding
`duplicate_pending` collisions that discard fresh analysis.

### End-of-run git sync

When the primary bundle is **git-backed** (recognized by a `.git` directory,
not by a configured remote), improve commits (and optionally pushes) the
bundle automatically when the run finishes — on by default for git-backed
bundles:

```bash
akm improve                    # auto-sync per strategy default
akm improve --no-sync          # skip the end-of-run commit entirely
akm improve --sync --no-push   # commit only, skip the push
```

Strategy sync defaults: `catchup`, `consolidate`, `default`, `frequent`,
`graph-refresh`, `memory-focus`, `quick`, and `thorough` auto-commit + push;
`proactive-maintenance` and `reflect-distill` skip sync entirely.

## akm health — pipeline diagnostics

`akm health` probes the runtime state and surfaces improve-pipeline metrics in
its schemaVersion 3 JSON envelope.

```bash
akm health

# Rolling window:
akm health --since 24h

# Compare two windows to spot throughput regressions:
akm health --since 24h --window-compare 24h

# Full report dataset (per-run rows, trend deltas, proposal queue):
akm health --report --format html
```

Key fields to watch in health output:
- `improve.invoked` / `improve.completed` — most recent improve run counts.
- proposal-queue metrics surfaced via `--report`.
- `improve` session-extraction advisory — reflects `akm proposal extract` pipeline health.

## Combining extract → improve → review

The canonical pipeline for an agent maintaining an active bundle:

```bash
# 1. Harvest knowledge from recent sessions:
akm proposal extract --auto

# 2. Improve assets based on accumulated feedback and new signals:
akm improve --limit 20

# 3. Review the resulting proposals:
akm proposal list --status pending
akm proposal show <id>
akm proposal diff <id>
akm proposal accept <id>   # or akm proposal reject <id> --reason "..."

# 4. Verify pipeline health:
akm health --window-compare 24h
```

To keep the backlog from growing without a manual review session, either
enable the `triage` pre-pass (above) so `akm improve` drains it
automatically, or run the standalone verb:

```bash
# Deterministically drain the pending backlog (preview, then promote):
akm proposal drain --policy personal-stash --dry-run
akm proposal drain --policy personal-stash --promote --yes
```

Automate this as a scheduled task — see `tasks/nightly-improve-cycle.yml` in
this bundle for a ready-to-install example.

## Tuning guidance

| Symptom | Likely cause | Fix |
|---|---|---|
| `improve` produces no proposals | No feedback signal, no retrieval history | Add `akm feedback <ref> --positive/--negative` then re-run |
| Backlog growing unattended | No drain policy running | Enable `processes.triage` in the strategy, or schedule `akm proposal drain --policy personal-stash --promote --yes` |
| Memory consolidation not running | `consolidate` disabled in strategy | Check `improve.strategies.default.processes.consolidate.enabled` in config |
| Extract finds nothing new | Sessions already processed | Pass `--force` to re-process; or extend `--since` window |
| Distill cooldown blocking | Distill ran too recently | Check cooldown in config (`improve.strategies.default.processes.distill.cooldownDays`) |

## Good operator habits

- Run `akm health` before and after tuning to measure impact.
- Review proposals before bulk-accepting; `akm proposal diff <id>` shows the exact change.
- Every proposal lands `pending` regardless of strategy — plan for an
  explicit accept/reject or drain step; there is no confidence auto-promote.
- Use `--dry-run` on first use in a new bundle to understand what improve would touch.
- Schedule extract + improve together — extract first so improve has fresh signals.
