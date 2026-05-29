---
name: manage-akm-proposals
description: Use when an agent needs to review, accept, reject, or follow up on akm proposal-queue entries created by improve or propose in akm-cli v0.8.0.
updated: 2026-05-23
---

# Manage akm Proposals

Use this skill when draft assets or revisions already exist in the proposal
queue and the next job is to decide what should become live.

## When to use

- `akm improve <ref>` created an update and you need to review it.
- `akm propose` drafted a new asset.
- `akm improve <ref>` distilled repeated feedback into a lesson proposal.

## Steps

### 1. List pending proposals

```bash
akm proposals
```

### 2. Inspect the strongest candidate

```bash
akm show proposal <id>
akm diff <id>
```

`akm diff` accepts the proposal UUID or a UUID prefix. Check whether the
proposal improves a real workflow, keeps trigger-sentence metadata, and avoids
answer leakage.

### 3. Decide

```bash
akm accept <id>
# or
akm reject <id> --reason "why"
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

Use `akm revert <id>` to undo a previously accepted proposal — it restores
the prior asset content from the backup captured at acceptance time. Errors
if the proposal was never accepted or has no backup.

## Bulk decisions

For mass review of low-risk batches, `akm accept` and `akm reject` accept
filter flags instead of a single id:

- `akm accept --source <name>` / `akm reject --source <name>` scopes a bulk
  action to one stash's proposals.
- `--max-diff-lines <N>` caps to small, low-risk changes.
- `--older-than <duration>` caps by age (e.g. `7d`).
- `--dry-run` lists the matching ids without acting.

Pair flags freely (e.g. `akm accept --source mine --max-diff-lines 5 --dry-run`).
