---
description: Improve an existing stash by collecting feedback, distilling lessons, and promoting reviewed proposals in akm-cli v0.7.0.
tags: [improvement, proposals, lessons]
params:
  ref: Asset ref to improve
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
Use `akm reflect <ref-from-params> --task "..."`,
`akm propose <type> <name> --task "..."`, or `akm distill <ref-from-params>`
depending on whether you need a revision, a new asset, or a lesson.

### Completion Criteria
- A new proposal exists in the queue.

## Step: Review the draft
Step ID: review-draft

### Instructions
Inspect the proposal with `akm proposal show <id>` and `akm proposal diff <id>`.
Check for correctness, reusability, and answer leakage.

### Completion Criteria
- The proposal has been reviewed.

## Step: Accept or reject
Step ID: decide

### Instructions
Promote a good proposal with `akm proposal accept <id>` or reject it with a
reason.

### Completion Criteria
- The proposal has been accepted or rejected explicitly.

## Step: Reindex and verify
Step ID: verify-result

### Instructions
Run `akm index`, then confirm the updated asset is searchable and readable.

### Completion Criteria
- Search finds the final asset.
- `akm show <ref>` returns the expected content.
