---
description: Use when an agent needs to run, configure, or tune the akm self-improvement pipeline — including akm improve, akm proposal extract, and akm doctor.
tags: [akm, improve, extract, doctor, pipeline]
quality: curated
updated: 2026-11-23
type: knowledge
generated:
  by: human:itlackey
  at: 2026-10-06T20:08:06.321Z
verified:
  - by: human:itlackey
    at: 2026-10-06T20:08:06.321Z
---

# akm Improve and Extract Pipeline

> **Version target:** akm-cli 0.10.261130

akm's self-improvement loop is built on three commands: **proposal extract**
(harvest durable insights from session logs), **improve** (analyze and
propose changes to bundle assets), and **doctor** (diagnose the pipeline's
health and throughput). They can run independently or together on a schedule
as a task.

Improve and extract are model work: they need a connection or a harness (see
`akm setup`). `akm setup --learning off` turns background learning off on a
host (`akm improve` and `akm proposal extract` then do nothing);
`--learning on` turns it back on.

## akm proposal extract — session knowledge harvesting

`akm proposal extract` reads native session files from Claude Code, Codex or
OpenCode and queues durable insights as proposals. It is the standalone
entrypoint for session extraction and runs independently of the improve-stage
extract toggle described below.

```bash
# Harvest the last 24 hours from Claude Code sessions (default window):
akm proposal extract --sessions claude

# Harvest from OpenCode sessions in the last 7 days:
akm proposal extract --sessions opencode --since 7d

# Harvest all available harnesses automatically:
akm proposal extract --auto

# Preview without queuing (dry run):
akm proposal extract --sessions claude --dry-run

# Re-process a specific session even if already seen:
akm proposal extract --sessions claude --session-id <id> --force
```

There is no `--watch` polling mode. For recurring extraction, schedule
`akm proposal extract --auto` as a task instead.

Run `akm proposal list` after extract to review the queued candidates.

## akm improve — asset improvement proposals

`akm improve` analyzes existing bundle assets and generates improvement
proposals. It also runs memory consolidation when the selected strategy enables
it. **Improve is proposal-first.** Every generator emits a proposal; by
default `akm improve` then accepts and commits the proposals whose quality
check passed on that exact content, and leaves the rest `pending` for `akm
proposal accept` / `reject` or `akm proposal drain`. A run scoped to a single
ref (`akm improve skills/x`) skips that drain pre-pass, so what it queues is
first eligible on the next whole-bundle run.

```bash
# Improve one asset:
akm improve skills/akm-quickstart

# Improve all assets of a type:
akm improve skill

# Whole-bundle pass (highest salience first):
akm improve

# Add a specific task directive:
akm improve --task "Update CLI flag references"

# Dry run — show planned actions and routing without writing:
akm improve --dry-run

# Cap to N assets per run:
akm improve --limit 10

# Skip the git sync before and after the run:
akm improve --no-sync
```

Reflect plans a rewrite only for assets with negative feedback in the last 30
days (or an explicit ref); a positive signal never plans one. Reflect changes
frontmatter (`description`, `when_to_use`, `title`) and leaves the body to
people. The proactive-maintenance lane in `default` also plans up to 15 assets
a run that have no recent feedback and were not reflected or distilled in 30
days; its proposals always wait for a person.

### Improve strategies

Two strategies are built in:

| Strategy | What it runs |
|---|---|
| `default` | Reflect, distill, consolidation, validation, the proactive-maintenance lane, and a triage drain in `promote` mode with judgment off (up to 200 accepts a run). Improve-stage extract is off. |
| `consolidate` | Memory consolidation only: reflect, distill, memory inference, extract, triage, validation and proactive maintenance are off. |

```bash
akm improve --strategy consolidate
```

A strategy named `quick`, `thorough`, `catchup`, `reflect-distill` or
`proactive-maintenance` is an ordinary user-defined strategy that inherits
`default`; it does not carry any former built-in's settings. Define the
processes you want explicitly.

Custom strategies live under `improve.strategies.<name>` in the akm config
file. Selection order is `--strategy`, config `improve.strategy`, then built-in
`default`. A strategy says which processes run and how each is tuned
(`consolidate`, `distill`, `reflect`, `memoryInference`, `triage`,
`proactiveMaintenance`, `extract`, `validation`), never where they run:
`improve.connection`, `improve.harness`, `improve.processes.<process>`, or
`--connection` / `--harness` / `--model` choose that. A strategy inherits
omitted fields from `default`.

Some autonomous lanes (memory inference, memory cleanup, and a triage promote
with judgment on) are held until `experimental.improveAutonomy` is `true`. A
held lane is reported, not silent: `akm doctor` lists it under
`improveAutonomy`.

### Triage pre-pass — drain the backlog before improving

`triage` is an improve process that **drains the standing pending proposal
backlog before** the reflect/distill pass runs. It is the automated
counterpart of `akm proposal drain` (see `knowledge/akm-cli-reference`). In
`default` it is on, in `promote` mode, with judgment off: it accepts proposals
a quality judge already passed (when their content has not changed since) and
the retirements the consolidate pair pass staged with no continuity risk. It
never accepts a proposal from the proactive lane, an uncertain verdict, or a
distill lesson.

To leave every proposal for a person, turn it off:

```jsonc
{
  "improve": {
    "strategies": {
      "default": { "processes": { "triage": { "enabled": false } } }
    }
  }
}
```

Other triage keys: `applyMode` (`queue` stages only; `promote` accepts),
`maxAcceptsPerRun` (hard ceiling), and `judgment` (`true` or `false`; a judged
tier accepts only consolidate promotions and, in a promote strategy, needs
`experimental.improveAutonomy`). Every accept is an ordinary accept: a
git-backed bundle gets the usual commit and `akm proposal revert` undoes it.

### End-of-run git sync

When the primary bundle is **git-backed** (recognized by a `.git` directory,
not by a configured remote), `akm improve` syncs it before the run and commits
(and pushes, when writable with a remote) when the run finishes. This is on by
default:

```bash
akm improve                    # sync before and after the run
akm improve --no-sync          # skip both syncs
akm improve --sync --no-push   # commit only, skip the push
```

## akm doctor — pipeline diagnostics

`akm doctor` checks the runtime state and surfaces improve-pipeline metrics.
Exit codes: 0 pass, 4 warning, 1 failure.

```bash
akm doctor

# Offline inspection with no writes:
akm doctor --read-only --no-probe

# Rolling window, and a comparison with the window before it:
akm doctor --since 24h --window-compare 24h

# Full report dataset (per-run rows, trend deltas, proposal queue):
akm doctor --report --format md

# Usage, routing and cost of recent improve runs:
akm doctor metrics improve --since 7d

# One task's run history:
akm doctor log --task <id> --limit 20
```

Key fields to watch in `akm doctor` output:
- `improve` run counts, and the improve skip-reason summary (including
  `autonomy_gated`).
- `improveTriage` and `improveAutonomy`: the effective triage mode and any held
  lanes.
- `scheduler`: scheduler backend and task state.
- The session-extraction advisory, which reflects `akm proposal extract`
  pipeline health.

## Combining extract → improve → review

The canonical pipeline for an agent maintaining an active bundle:

```bash
# 1. Harvest knowledge from recent sessions:
akm proposal extract --auto

# 2. Improve assets based on accumulated feedback and new signals:
akm improve --limit 20

# 3. Review what is still pending:
akm proposal list --status pending
akm proposal show <id>
akm proposal diff <id>
akm proposal accept <id>   # or akm proposal reject <id> --reason "..."

# 4. Verify pipeline health:
akm doctor --window-compare 24h
```

To keep the backlog from growing without a manual review session, rely on the
`triage` pre-pass (on in `default`) or run the standalone verb:

```bash
# Preview, then drain the pending backlog by the one drain rule:
akm proposal drain --dry-run
akm proposal drain --promote --yes
```

Automate this as a scheduled task — see `tasks/nightly-improve-cycle.yml` in
this bundle for a ready-to-install example.

## Tuning guidance

| Symptom | Likely cause | Fix |
|---|---|---|
| `improve` produces no proposals | No negative feedback and the proactive lane has nothing due | Add `akm feedback <ref> --negative --reason "..."` then re-run, or name the ref: `akm improve <ref>` |
| `improve` exits 78 at planning | No connection or harness is configured | Run `akm setup`; check `akm doctor` |
| Improve does nothing and says learning is off | `improve.enabled` is `false` | `akm setup --learning on` |
| Backlog growing unattended | Triage is off, or the rest need a person | Check `improveTriage` in `akm doctor`; run `akm proposal drain --dry-run` and review what it defers |
| A scheduled run stopped doing something | An autonomous lane is held | `akm doctor` lists it under `improveAutonomy.gatedLanes`; set `experimental.improveAutonomy` only if you want it |
| Memory consolidation not running | `consolidate` disabled in the strategy | Check `improve.strategies.<name>.processes.consolidate.enabled` |
| Extract finds nothing new | Sessions already processed | Pass `--force` to re-process, or extend `--since` |
| An asset is not retried | The improve ledger holds it after a rejection (14 days for reflect, 30 for distill) | Wait, give new feedback, or name the ref explicitly |

## Good operator habits

- Run `akm doctor` before and after tuning to measure impact.
- Review proposals before bulk-accepting; `akm proposal diff <id>` shows the
  exact change, and `akm proposal revert <id>` undoes an accept.
- Plan for a review step: whatever the quality gate does not pass stays
  `pending` until accepted, rejected, or drained.
- Use `--dry-run` on first use in a new bundle to understand what improve would
  touch.
- Schedule extract and improve together, extract first, so improve has fresh
  signals.
