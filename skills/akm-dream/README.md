---
description: Repository README for the akm-dream skill. The active asset entrypoint is SKILL.md; this file documents the package layout, phase scripts, and CLI usage.
tags: [akm-dream, readme]
updated: 2026-05-23
refs: []
---

# akm-dream

> A Claude Code / OpenCode skill that implements the four-phase **Auto
> Dream** memory consolidation process for the [akm
> CLI](https://github.com/itlackey/akm).

This skill is the canonical dream implementation for AKM. It does for
`akm remember` what REM sleep does for short-term memory:
prunes stale notes, merges duplicates, converts relative dates to
absolute, and rebuilds a clean `MEMORY.md` index — without an LLM
having to scan the entire stash from scratch each session.

The implementation target and design rationale live in
`references/implementation-spec.md`.

## What it does

When you say "**dream**" (or any of the trigger phrases in `SKILL.md`),
Claude reads this skill and runs the four-phase pipeline:

| Phase | What runs       | Who does the work               |
| ----- | --------------- | ------------------------------- |
| 1     | `phase1-orient` | Bun script (deterministic)      |
| 2     | `phase2-gather` | Bun script (narrow grep)        |
| 3     | consolidate     | The agent (you), guided by prompt |
| 4     | `phase4-prune`  | Bun script + `akm index`        |

Phases 1, 2, and 4 are dependency-free Bun TypeScript that shell out
to the akm CLI. Phase 3 is where the LLM does its real job:
contradiction resolution, merging, and synthesis.

## Install

### As a Claude Code skill

```bash
# Drop the directory into ~/.claude/skills/
git clone https://github.com/itlackey/akm-dream.git ~/.claude/skills/akm-dream

# Or clone the skill asset into your working stash
akm clone "github:itlackey/akm-dream//skill:akm-dream"
```

### As an akm asset (recommended)

Once you've added this repo as a source, the skill participates in
`akm search` like any other skill:

```bash
akm add github:itlackey/akm-dream
akm index
akm search "dream consolidate memories"
```

### Standalone

You don't strictly need a skill loader. The Bun scripts are runnable
on their own:

```bash
git clone https://github.com/itlackey/akm-dream.git
cd akm-dream
bun run dream
```

## Use

### Interactive (recommended)

```bash
bun run dream
```

This runs phases 1 and 2, generates a deterministic `plan.json`, writes
stash-scoped run artifacts under `<stash>/.akm-dream/runs/<run-id>/`, and
prints the review/apply prompt. Then you (or your agent) review the plan,
preview or adjust if needed, and finish with:

```bash
bun run dream:continue
```

### Fully automated (deterministic only)

```bash
bun run dream:auto
```

Skips phase 3 review/approval and runs only inventory, signal-gather,
and index rebuild. Useful as a cron job or post-commit hook to keep
`MEMORY.md` current without doing any merging. The run report marks the
review checkpoint as skipped so audits can distinguish auto mode from a
reviewed full run.

## Review Flow

Every non-trivial dream run now emits staged review artifacts:

- `orient.json` for phase 1 validation
- `signal.json` for phase 2 validation
- `review-checklist.md` for the phase 3 approval gate
- `run-report.json` for machine-readable checkpoint status
- `phase4-result.json` after phase 4 with final audit metrics

The explicit approval boundary is between phase 3 planning and phase 3 apply.
Running `bun run dream:continue` means the consolidation plan was reviewed and
approved; it then executes the approved phase 3 plan and proceeds to phase 4. See
`references/review-flow.md` for the exact staged review contract.

### Just one phase

```bash
bun run phase1               # inventory
bun run phase2               # gather signal
bun run phase3:plan          # default: latest run's orient.json + signal.json
bun run phase3:apply         # default: latest run's plan.json in .akm-dream/runs/
bun run phase4               # rebuild MEMORY.md + akm index
bun run phase4:dry           # preview the new MEMORY.md without writing
bun run forget memory:foo    # delete a single memory
```

Phase 3 standalone commands accept explicit artifact paths when you do not want
the latest stash-scoped run directory defaults:

```bash
bun run phase3:plan -- --orient <run-dir>/orient.json --signal <run-dir>/signal.json --out <run-dir>/plan.json --run-id <run-id>
bun run phase3:apply -- --plan <run-dir>/plan.json --actions <run-dir>/actions.jsonl --result <run-dir>/result.json --apply-approved
```

If `--orient`, `--signal`, or `--plan` are omitted, the scripts resolve the
latest run directory under `<stash>/.akm-dream/runs/` and use the canonical
artifact names there.

## Architecture

```
akm-dream/
├── SKILL.md                          # the skill manifest read by Claude Code
├── README.md                         # this file
├── package.json
├── tsconfig.json
├── scripts/
│   ├── dream.ts                      # orchestrator (lock + phases + run state)
│   ├── phase1-orient.ts              # inventory memories + MEMORY.md state
│   ├── phase2-gather.ts              # grep transcripts/logs for save signals
│   ├── phase4-prune.ts               # regenerate MEMORY.md, run akm index
│   ├── forget.ts                     # safe single-memory deletion shim
│   └── lib/
│       ├── akm.ts                    # akm CLI wrapper (JSON envelope parsing)
│       ├── memory.ts                 # frontmatter + relative-date scanning
│       ├── lock.ts                   # <stash>/.akm-dream.lock management
│       ├── paths.ts                  # stash + transcript path resolution
│       ├── run-report.ts             # review checkpoints + audit artifacts
│       └── state.ts                  # stash-scoped durable dream state
├── references/                       # loaded into context only when needed
│   ├── dream-system-prompt.md        # the four-phase prompt for phase 3
│   ├── memory-format.md              # frontmatter + body conventions
│   ├── review-flow.md                # staged validation + approval contract
│   └── akm-commands.md               # quick-ref of the akm verbs we use
└── evals/
    └── evals.json                    # test prompts for skill validation
```

The skill uses `akm` for authoritative actions and stash discovery:
`akm show`, `akm remember`, `akm index`, `akm events list`, and
`akm config path --all`. Phase 1 and phase 4 intentionally walk
`<stash>/memories/` directly because the current `akm search` surface
is optimized for retrieval/ranking, not deterministic full-memory
enumeration with paths.

## Safety

- **One dream session at a time.** `<stash>/.akm-dream.lock` stores a
  session id as well as PID/timestamps, so `bun run dream:continue`
  can resume the same dream without dropping the lock for other runs.
- **Memory directory only.** `forget.ts` refuses to touch anything
  outside `<stash>/memories/`. The phase scripts never write outside
  the stash.
- **Pre-dream snapshot.** Before phase 3, the orchestrator copies the
  current `memories/` tree into `<stash>/.akm-dream/runs/<run-id>/backup/` so manual
  consolidation has a local rollback point without invoking `akm save`.
- **Dry-run available.** `phase4-prune --dry-run` and `forget --dry-run`
  show what would change without writing.
- **Review checkpoints are explicit.** `run-report.json` and
  `review-checklist.md` make the phase 3 approval boundary visible and
  auditable.

## Dream Implementation Boundary

`akm-dream` is the dream implementation. It uses current `akm` commands
for authoritative reads, writes, indexing, feedback, and stash
discovery, while keeping dream orchestration and run-state management in
this skill. Future phase B/C/D work should attach `plan.json`,
`actions.jsonl`, and `result.json` to the same per-run directory.

## Compatibility

- akm `>= 0.4.0` (locked v1 CLI surface assumed)
- Bun `>= 1.1.0` (uses `Bun.spawn`)
- Works on Linux and macOS. Windows is untested but should work under WSL.

## Related

- [Auto Dream — Claude Fast](https://claudefa.st/blog/guide/mechanics/auto-dream)
  — the original auto-dream design from which the four-phase
  structure is borrowed.
- `references/implementation-spec.md`
  — canonical design/architecture spec for this skill, with internal and
  external citations for future implementation validation.
- `references/review-flow.md`
  — staged validation, review, approval, and post-run audit expectations.
- [akm 0.8.0 — CLI Redesign, Task Assets, and Belief-Aware Memory](https://dev.to/itlackey/akm-080-cli-redesign-task-assets-and-belief-aware-memory-3h42)
  — context for `akm improve`/`propose` and the renamed proposal-review
  commands. Dream is complementary: those commands generate proposals; dream
  consolidates what's already in the live stash.

## License

MPL-2.0, matching the akm project itself.
