# akm Commands Used by akm-dream

A focused quick-reference for the akm verbs the dream pipeline leans on.
For the full reference see [`docs/cli.md`](https://github.com/itlackey/akm/blob/main/docs/cli.md)
in the akm repo.

All commands default to JSON output. Prefer `--detail agent` for the
agent-optimized shape; `--for-agent` remains a deprecated alias.

> **Current akm version:** 0.8.0. Behavior below is verified against
> 0.8.0; older versions (≤ 0.4.x) lacked some of these surfaces and are
> not covered here.

## Reading memories

```bash
# Load a single memory's content.
akm show memory:release-process --format json --detail full

# Just the metadata (no body) — cheap, useful for triage.
akm show memory:release-process --detail summary
```

## Writing memories

```bash
# Short note as a positional argument (auto-derives name from content).
akm remember "Deployment needs VPN access"

# Custom name.
akm remember --name release-process "On 2026-05-04 we switched to bun publish."

# Long note via stdin (preferred for anything multi-line — avoids quoting).
akm remember --name release-process --force <<'EOF'
---
description: Release scripts now run via bun publish.
tags: [release, ci]
updated: 2026-05-04
---

# Release process
...
EOF

# Force overwrites; without --force akm refuses to clobber.
```

Since 0.8.0, every memory written through `akm remember` automatically
gets `captureMode: hot` and `beliefState: asserted` injected into its
frontmatter. Don't set those fields by hand; the CLI does it. Derived
memories written by `akm improve` instead carry `captureMode:
background` plus a `source: memory:<parent>` field that the indexer
uses to build the parent → derived link (`expandTo` on search hits).

## Deleting memories

`akm` still has no native asset-level remove as of 0.8.0. Use the bundled shim:

```bash
bun run scripts/forget.ts memory:release-process
bun run scripts/forget.ts memory:release-process --dry-run
```

The shim refuses to delete anything outside `<stash>/memories/`.

For accepted proposals (improve / propose / consolidate output) that
overwrote an existing asset, use `akm revert <id>` instead — it
restores the prior content from the backup captured at promotion time.
See "Proposals" below.

## Indexing

```bash
# Incremental rebuild — only rescans changed dirs.
akm index

# Full rebuild — slower but fixes any drift.
akm index --full

# Verbose — prints phase-by-phase progress to stderr.
akm index --verbose
```

`akm remember` does NOT auto-index. Run `akm index` after a batch of
writes (phase 4 does this for you).

## Configuration paths

```bash
# Stash dir + config file + cache dir.
akm config path --all

# Just the stash dir.
akm config get stashDir
```

Phase 1 and `forget.ts` use `akm config path --all` to resolve the
stash directory rather than hardcoding `~/.akm` — the user may have
set `AKM_STASH_DIR` or run `akm init --dir <custom>`.

> ⚠️ **`akm init --dir <path>` PERSISTS the new path** to the user's
> config file as `stashDir`. It is NOT a per-invocation override. For
> ephemeral / sandboxed testing, use either `--stash-dir <path>` (most
> commands accept it) or `AKM_STASH_DIR=<path>` in the environment.
> Running `init --dir` against a temp directory has previously caused
> agents to silently re-route all subsequent reads and writes to the
> wrong location. Always prefer `--stash-dir` or `AKM_STASH_DIR` for
> sandboxed test runs.

## Feedback

Memories aren't ranked the same way skills are, but feedback events
are visible to the agent and useful as signal during phase 2.

```bash
akm feedback memory:release-process --positive
akm feedback memory:old-deploy --negative --note "Stale; we no longer use this script"

# Credit a lesson that helped resolve a task (0.8.0+).
# Appends the feedback ref to the lesson's lessonStrength[] frontmatter,
# which boosts the lesson's ranking. Idempotent; non-lesson targets are
# silently ignored.
akm feedback memory:release-fix --positive --applied-to lesson:rollback-playbook
```

A negative-feedback event on a memory is a strong hint that the next
dream cycle should look at it.

Positive feedback also stabilizes a memory's recency decay (0.8.0+)
when the user has configured `improve.utilityDecay.feedbackStabilityBoost`
— each positive event multiplies the effective half-life by the boost
factor, capped at 4× the base half-life.

## Lessons coverage

```bash
# JSON: { uncoveredTags, lessonTagCount, totalTagCount }
akm lessons coverage

# Plain-text bulleted list.
akm lessons coverage --format text
```

Reports tags that exist on indexed assets but are NOT yet covered by
any lesson — a signal that tacit knowledge in skills/scripts/etc. has
not been crystallized into a lesson yet. Pair with `akm improve` (which
subsumes the old `distill` flow in 0.8.0) to fill the gaps. Added in 0.8.0.

## Proposals

`akm improve`, `akm propose`, and `akm consolidate` all write into the
proposal queue at `<stash>/.akm/proposals/` rather than mutating
assets directly. The dream pipeline never accepts a proposal itself —
that's the user's call — but it's useful to know how to read the queue.

```bash
# List proposals, filter by status.
akm proposals
akm proposals --status pending|accepted|rejected|reverted
akm proposals --ref memory:release-process

# Inspect / diff a proposal.
akm show proposal:<id>
akm diff <id>                      # UUID, UUID prefix, or proposal:<id> ref
akm diff <8-char-uuid-prefix>

# Accept / reject.
akm accept <id>                    # full UUID, 8-char prefix, or asset ref
akm reject <id> --reason "..."

# Revert an accepted proposal (0.8.0+) — restores the prior asset
# content from the backup captured at promotion time. Errors if the
# proposal is not accepted, has no backup, or cannot be found.
akm revert <id>                    # full UUID or asset ref only;
                                   # UUID prefixes are NOT supported
                                   # for archived proposals.
```

Each proposal record carries an optional `confidence` field (0..1, set
by improve/propose runs). `akm improve --auto-accept=<N>` promotes
proposals with `confidence × 100 >= N` (default threshold 90 when the
flag is bare; `--auto-accept=false` disables auto-promotion). Accepted
proposals that overwrote an existing asset also carry a `backup` field
pointing at the captured prior content, which is what `akm revert`
restores.

`akm improve` also runs an expiration pass: pending proposals older
than `improve.archiveRetentionDays` (default 30, set to 0 to disable)
are archived as "expired: no action within retention window".

## Workflow integration

If the user runs dream as a tracked workflow (recommended for teams):

```bash
akm workflow next workflow:dream --params '{"trigger":"manual"}'
akm workflow complete <run-id> --step phase1 --state completed
# ...
```

The skill doesn't ship a dream workflow file — that's a project-level
choice. But if one exists at `workflow:dream`, every dream run can be
audited later.

## Dream phase helpers

The standalone phase 3 helpers default to the latest stash-scoped run under
`<stash>/.akm-dream/runs/<run-id>/`:

```bash
# Uses latest run's orient.json and signal.json when flags are omitted.
bun run phase3:plan

# Explicit inputs/outputs.
bun run phase3:plan -- \
  --orient <run-dir>/orient.json \
  --signal <run-dir>/signal.json \
  --out <run-dir>/plan.json \
  --run-id <run-id>

# Uses latest run's plan.json when --plan is omitted.
bun run phase3:apply -- --dry-run

# Explicit apply artifacts.
bun run phase3:apply -- \
  --plan <run-dir>/plan.json \
  --actions <run-dir>/actions.jsonl \
  --result <run-dir>/result.json \
  --apply-approved
```

Supported phase 3 flags:

- `phase3:plan`: `--orient`, `--signal`, `--out`, `--run-id`
- `phase3:apply`: `--plan`, `--actions`, `--result`, `--dry-run`, `--apply-approved`, `--include-unapproved`, `--no-delete`, `--max-deletes`, `--allow-protected`

## Health and diagnostics

```bash
# Probe runtime, telemetry, scheduler reachability, and recent improve
# metrics. Useful as a smoke test before kicking off a dream run.
akm health
```

Two environment escape hatches that the dream pipeline can benefit from
when project-scoped context is causing noise or when scoped utility
discovery should be bypassed for a deterministic baseline:

- `AKM_DISABLE_PROJECT_CONTEXT=1` — ignore the project-local context
  layer for the duration of the process. Useful when phase 1 / phase 2
  diagnostics need a pure-stash view.
- `AKM_DISABLE_SCOPED_UTILITY=1` — disable the scoped-utility resolver
  so that asset lookups don't fall back into per-scope overlays.

Both flip back to their default (enabled) state by unsetting the
variable; they're per-process, not persisted to config.
