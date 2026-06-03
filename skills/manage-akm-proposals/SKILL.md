---
name: manage-akm-proposals
description: Use when an agent needs to review, accept, reject, or follow up on akm proposal-queue entries created by improve or propose in akm-cli v0.8.0.
updated: 2026-06-02
---

# Manage akm Proposals

Use this skill when draft assets or revisions already exist in the proposal
queue and the next job is to **hands-on review and decide** what should become
live.

> **For routine, unattended backlog cleanup, prefer `akm proposal drain`**
> (v0.8.0-rc.12+) or the `processes.triage` improve pre-pass — they apply a
> deterministic policy without an agent session. See `knowledge:akm-cli-reference`
> (the `akm proposal drain` section) and `knowledge:akm-improve-and-extract`.
> This skill remains the path for case-by-case judgment on individual drafts.

## When to use

- `akm improve <ref>` created an update and you need to review it.
- `akm propose` drafted a new asset.
- `akm improve <ref>` distilled repeated feedback into a lesson proposal.

## Steps

### 1. List pending proposals

```bash
akm proposal list --status pending
```

### 2. Inspect the strongest candidate

```bash
akm proposal show <id>
akm proposal diff <id>
```

`akm proposal diff` accepts the proposal UUID or a UUID prefix. Check whether the
proposal improves a real workflow, keeps trigger-sentence metadata, and avoids
answer leakage.

### 3. Decide

```bash
akm proposal accept <id>
# or
akm proposal reject <id> --reason "why"
```

Accept only if the draft is correct, reusable, and better than the live asset.
Reject vague, redundant, or overly task-specific proposals.

### 4. Reindex if needed

```bash
akm index
```

### 5. Verify the promoted asset

```bash
akm show <ref>
akm search "<query that should find it>"
```

If the proposal is weak but the underlying asset is still the right target,
rerun `akm improve <ref> --task "..."` with more precise guidance instead of
editing the live stash directly.

## When to revert

Use `akm proposal revert <id>` to undo a previously accepted proposal — it restores
the prior asset content from the backup captured at acceptance time. Errors
if the proposal was never accepted or has no backup.

## Bulk decisions

For mass review of low-risk batches, `akm proposal accept` and
`akm proposal reject` accept filter flags instead of a single id:

- `akm proposal accept --generator <g>` / `akm proposal reject --generator <g>`
  scopes a bulk action to one generator (`extract` | `consolidate` | `reflect` |
  `distill`). (`--source` is the deprecated alias, removed in 0.9.0.)
- `--max-diff-lines <N>` caps to small, low-risk changes (line count, not `7d`).
- `--older-than <days>` caps by age (e.g. `7` for 7 days).
- `-y` / `--yes` is required for any bulk accept in non-interactive mode.

Pair flags freely (e.g.
`akm proposal accept --generator reflect --max-diff-lines 5 -y`).

For a fully automated, policy-driven version of this bulk step, use
`akm proposal drain` (above) instead of hand-assembling generator batches.
