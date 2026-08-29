---
type: workflow
description: Improve an existing bundle by collecting feedback, generating reviewed proposals, and promoting the best results in akm-cli 0.9.2.
tags: [improvement, proposals, lessons]
params:
  ref: { type: string, description: Asset ref to improve }
updated: 2026-08-29
steps:
  - id: capture-feedback
  - id: generate-proposal
    inputs: [steps.capture-feedback.output]
  - id: review-draft
    inputs: [steps.generate-proposal.output]
  - id: decide
    inputs: [steps.review-draft.output]
  - id: verify-result
    inputs: [steps.decide.output]
---

# Evolve bundle assets with proposals

## capture-feedback

Record the win or miss for the asset named by the `ref` parameter with `akm
feedback <ref> --positive` or `akm feedback <ref> --negative --reason "..."`.

Verify:
- Useful feedback exists for the target asset.

## generate-proposal

Use `akm improve <ref> --task "..."` for improving an existing asset or
distilling repeated feedback from it, and `akm proposal new <type> <name>
--task "..."` for a brand-new asset. There is no separate `reflect`,
`distill`, or `propose` verb — `improve` and `proposal new` cover both.

Verify:
- A new proposal exists in the queue.

## review-draft

Inspect the proposal attached to this unit from the prior step with `akm
proposal show <id>` and `akm proposal diff <id>` (both accept a UUID, a
UUID prefix, or an asset ref). Check for correctness, reusability, and
answer leakage.

Verify:
- The proposal has been reviewed.

## decide

Promote a good proposal with `akm proposal accept <id>` or reject it with
`akm proposal reject <id> --reason "..."`.

Verify:
- The proposal has been accepted or rejected explicitly.

## verify-result

Run `akm index`, then confirm the updated asset — reachable via the ref
attached to this unit — is searchable and readable.

Verify:
- Search finds the final asset.
- `akm show <ref>` returns the expected content.
