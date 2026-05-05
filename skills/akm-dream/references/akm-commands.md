# akm Commands Used by akm-dream

A focused quick-reference for the akm verbs the dream pipeline leans on.
For the full reference see [`docs/cli.md`](https://github.com/itlackey/akm/blob/main/docs/cli.md)
in the akm repo.

All commands default to JSON output. Prefer `--detail agent` for the
agent-optimized shape; `--for-agent` remains a deprecated alias.

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

## Deleting memories

akm 0.4.x has no native asset-level remove. Use the bundled shim:

```bash
bun run scripts/forget.ts memory:release-process
bun run scripts/forget.ts memory:release-process --dry-run
```

The shim refuses to delete anything outside `<stash>/memories/`.

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

## Feedback

Memories aren't ranked the same way skills are, but feedback events
are visible to the agent and useful as signal during phase 2.

```bash
akm feedback memory:release-process --positive
akm feedback memory:old-deploy --negative --note "Stale; we no longer use this script"
```

A negative-feedback event on a memory is a strong hint that the next
dream cycle should look at it.

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
