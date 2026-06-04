---
description: Use when an agent needs to run, configure, or tune the akm self-improvement pipeline — including akm improve, akm extract, and akm health.
tags: [akm, improve, extract, health, pipeline]
quality: curated
updated: 2026-06-02
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
processes: `consolidate`, `distill`, `reflect`, `graph-boost`, `triage`.

### Triage pre-pass — drain the backlog before improving (v0.8.0-rc.12+)

`triage` is a first-class improve process that **drains the standing pending
proposal backlog before** the reflect/distill pass runs (it is a pre-pass, not a
tail step). It is the built-in, automated replacement for running a manual
proposal-management session — see `akm proposal drain` in
`knowledge:akm-cli-reference` for the standalone verb and policy presets.

It is **opt-in** (defaults off) and only fires on whole-stash or type-scoped
runs — a single-ref `akm improve skill:x` never drains the queue.

```yaml
profiles:
  improve:
    default:
      processes:
        triage:
          enabled: false          # opt-in
          applyMode: queue         # queue (safe default, stage-only) | promote
          policy: personal-stash   # personal-stash | conservative | manual | <path>
          maxAcceptsPerRun: 25      # hard per-run accept ceiling
          maxDiffLines: 200         # defer accepts larger than this
          rejectEmpty: true
          judgment:                # OPTIONAL judgment tier for deferred items
            mode: llm              # llm (default) | agent | sdk
            profile: <profile-name>
            timeoutMs: 600000
```

`applyMode: queue` (the default) stages and reject-empties only — it never
promotes. Set `applyMode: promote` to auto-accept. Because triage runs first,
the queue is cleared before reflect re-analyzes assets, avoiding
`duplicate_pending` collisions that discard fresh analysis.

### End-of-run git sync (v0.8.0-rc.12+)

When the primary stash is **git-backed** (recognized by a `.git` directory, not
by a configured remote), an improve profile can commit (and optionally push) the
stash automatically when the run finishes:

```yaml
profiles:
  improve:
    default:
      sync:
        enabled: true
        push: true               # commit-and-push when writable + remote; else commit-only
        message: "akm improve: {accepted} accepted, {refs} refs @ {timestamp}"
```

`message` supports `{token}` templates: `{timestamp}`, `{date}`, `{time}`,
`{scope}`, `{refs}`, `{accepted}`. Unknown tokens pass through verbatim. The
default message has no tokens. A sync/push failure is non-fatal (surfaced as a
warning). CLI overrides: `akm improve --no-sync` (commit nothing) and
`--no-push` (commit only).

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

To keep the backlog from growing without a manual review session, either enable
the `triage` pre-pass (above) so `akm improve` drains it automatically, or run
the standalone verb:

```bash
# Deterministically drain the pending backlog (preview, then promote):
akm proposal drain --policy personal-stash --dry-run
akm proposal drain --policy personal-stash --promote --yes
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
