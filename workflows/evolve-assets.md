---
description: Improve an existing stash by collecting feedback, generating reviewed proposals, and promoting the best results in akm-cli v0.8.0.
tags: [improvement, proposals, lessons]
params:
  ref: Asset ref to improve
updated: 2026-05-23
---

# Workflow: Evolve stash assets with proposals

## Step: Capture the signal
Step ID: capture-feedback

### Instructions
Record the win or miss for `params.ref` with `akm feedback <ref-from-params>
--positive` or `akm feedback <ref-from-params> --negative --reason "..."`.

### Completion Criteria
- Useful feedback exists for the target asset.

## Step: Generate a proposal
Step ID: generate-proposal

### Instructions
Use `akm improve <ref-from-params> --task "..."` for improving an existing
asset or distilling repeated feedback from it, and `akm propose <type> <name>
--task "..."` for a brand-new asset.

### Completion Criteria
- A new proposal exists in the queue.

## Step: Review the draft
Step ID: review-draft

### Instructions
Inspect the proposal with `akm show proposal:<id>` and `akm diff <id>` (which accepts a UUID, UUID prefix, or `proposal:<id>` ref positionally).
Check for correctness, reusability, and answer leakage.

### Completion Criteria
- The proposal has been reviewed.

## Step: Accept or reject
Step ID: decide

### Instructions
Promote a good proposal with `akm accept <id>` or reject it with a reason.

### Completion Criteria
- The proposal has been accepted or rejected explicitly.

## Step: Reindex and verify
Step ID: verify-result

### Instructions
Run `akm index`, then confirm the updated asset is searchable and readable.

### Completion Criteria
- Search finds the final asset.
- `akm show <ref>` returns the expected content.
