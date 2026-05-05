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

This runs phases 1 and 2, drops their JSON output in
`/tmp/akm-dream/`, and prints the consolidation prompt. Then you (or
your agent) read the JSON, do phase 3 by hand using `akm remember`
and `bun run scripts/forget.ts`, and finish with:

```bash
bun run dream:continue
```

### Fully automated (deterministic only)

```bash
bun run dream:auto
```

Skips phase 3 — runs only inventory, signal-gather, and index rebuild.
Useful as a cron job or post-commit hook to keep MEMORY.md current
without doing any merging.

### Just one phase

```bash
bun run phase1               # inventory
bun run phase2               # gather signal
bun run phase4               # rebuild MEMORY.md + akm index
bun run phase4:dry           # preview the new MEMORY.md without writing
bun run forget memory:foo    # delete a single memory
```

## Architecture

```
akm-dream/
├── SKILL.md                          # the skill manifest read by Claude Code
├── README.md                         # this file
├── package.json
├── tsconfig.json
├── scripts/
│   ├── dream.ts                      # orchestrator (lock + phases + delegation)
│   ├── phase1-orient.ts              # inventory memories + MEMORY.md state
│   ├── phase2-gather.ts              # grep transcripts/logs for save signals
│   ├── phase4-prune.ts               # regenerate MEMORY.md, run akm index
│   ├── forget.ts                     # safe single-memory deletion shim
│   └── lib/
│       ├── akm.ts                    # akm CLI wrapper (JSON envelope parsing)
│       ├── memory.ts                 # frontmatter + relative-date scanning
│       ├── lock.ts                   # <stash>/.akm-dream.lock management
│       └── paths.ts                  # XDG / transcript path resolution
├── references/                       # loaded into context only when needed
│   ├── dream-system-prompt.md        # the four-phase prompt for phase 3
│   ├── memory-format.md              # frontmatter + body conventions
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
  current `memories/` tree into `/tmp/akm-dream/backup/` so manual
  consolidation has a local rollback point without invoking `akm save`.
- **Dry-run available.** `phase4-prune --dry-run` and `forget --dry-run`
  show what would change without writing.

## Defer to akm when possible

`dream.ts` probes `akm --help` first; if the installed akm exposes a
native `dream` subcommand (issue #302), the orchestrator delegates to
it and exits. This skill is therefore future-compatible — when akm
0.8.0 ships, your prompt-and-trigger setup keeps working unchanged
but you transparently get the in-tree implementation.

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
- [akm 0.7.0 — Proposal Queue, Reflection Commands, Lessons](https://dev.to/itlackey/akm-070-proposal-queue-reflection-commands-lessons-and-akm-bench-4lbl)
  — context for `akm reflect`/`propose`/`distill`. Dream is
  complementary: those commands generate proposals; dream consolidates
  what's already in the live stash.

## License

MPL-2.0, matching the akm project itself.
