---
name: manage-akm-proposals
description: Use when an agent needs to review, accept, reject, or follow up on akm proposal-queue entries created by improve or propose in akm-cli v0.8.0.
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
akm diff proposal <id>
```

Check whether the proposal improves a real workflow, keeps trigger-sentence
metadata, and avoids answer leakage.

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
