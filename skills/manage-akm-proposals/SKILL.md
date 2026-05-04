---
name: manage-akm-proposals
description: Use when an agent needs to review, accept, reject, or refine akm proposal-queue entries created by reflect, propose, or distill in akm-cli v0.7.0.
---

# Manage akm Proposals

Use this skill when draft assets or revisions already exist in the proposal
queue and the next job is to decide what should become live.

## When to use

- `akm reflect` created an update and you need to review it.
- `akm propose` drafted a new asset.
- `akm distill` produced a lesson proposal from feedback.

## Steps

### 1. List pending proposals

```bash
akm proposal list
```

### 2. Inspect the strongest candidate

```bash
akm proposal show <id>
akm proposal diff <id>
```

Check whether the proposal improves a real workflow, keeps trigger-sentence
metadata, and avoids answer leakage.

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
