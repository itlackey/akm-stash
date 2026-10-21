---
name: akm-measured-improvement
description: "Use when implementing and delivering a defined change to akm or akm-eval, often from a GitHub issue: reproduce the problem, make the smallest effective modification, validate it with akm-eval, and complete acceptance and applicable rollout."
updated: 2026-10-21
---

# Measured AKM Improvement

Use this workflow to implement and deliver a defined change to any AKM
process/feature or akm-eval itself. For developer-directed discovery and ongoing
experiments, use [AKM autoresearch](../akm-autoresearch/SKILL.md); choose by the
job, not whether an issue exists. Carry forward valid research evidence and
identify remaining delivery gaps rather than repeating the exploration.
If a standalone clone lacks that sibling skill, resolve it from the recorded
source stash revision in [akm-stash](https://github.com/itlackey/akm-stash/tree/main/skills/akm-autoresearch).
Running `akm improve` maintains assets; this skill evaluates implementation
changes. Follow the selected checkouts' instructions and contracts, not a
historical command example or benchmark score.

## Principles

- Prefer subtraction and the smallest effective correction. Reuse existing
  adapters, indexing, storage, proposals, execution, and evaluation tools.
- Preserve required integrity and useful existing jobs. Breaking defaults are
  allowed when the release permits them and measured outcomes justify them.
- Treat scores as evidence about the user job. Passing a new test alone does
  not establish improvement; a higher average cannot excuse an integrity failure.
- Use one issue/PR/change record. Keep evidence proportional to the claim and
  respect task scope, privacy, and publication authorization.

## 1. Ground the change and select its validation

Read `AGENTS.md`, relevant architecture/contracts, actual source, and tests.
Reproduce the failure through the affected inputs, outputs, and state/external
boundaries. Separate observations from hypotheses and historical reports.

Read only the relevant [process guidance](references/process-guidance.md).
Choose validation by the [boundary being changed](references/evaluation-guide.md#choose-validation-by-the-changed-boundary),
not by the most expensive available benchmark. Name the question each broader
measurement would answer; disclose gaps instead of substituting unrelated scores.

## 2. Plan one bounded change

Use the existing issue/PR or [change-record template](assets/change-record.md).
Record the user job, contract, intended gain, smallest fix/deletion, non-goals,
ordered acceptance criteria, baseline, and independently reserved final cases.
Rank hard constraints, primary benefit, secondary effects, and resource cost
before tuning; use the affected process's priorities.

Set the [experiment budget](references/evaluation-guide.md#experiment-budget):
three exploratory treatments by default, with separate run/time/cost bounds
and reserved final validation. Ordinary correctness repairs are recorded under
that rule; they are not automatically new alternatives. No cap permits accepting
an integrity failure or silently extending the task.

## 3. Reproduce, review, and simplify

Use focused regression fixtures and inspect actual requests/responses, files,
and effects. For post-model processing, replay identical complete responses
through both implementations before collecting more model outputs.

Review the changed boundary, contract, test matrix, and initial implementation
**before expensive collections**. An existing reviewer can add independent cases;
if working alone, make a separate critical pass and do not claim independent
review. Keep fresh relevant cases for final validation. This does not require
spawning agents or adding a review service.

Implement the smallest effective change. Remove failed experiments and justify
any added abstraction/dependency. Use [preflight](references/evaluation-guide.md#runner-and-execution-preflight)
and the process-specific setup checks before measurement. For parallel work,
assign [shared verification ownership](references/evaluation-guide.md#shared-verification).

## 4. Measure only what can change the decision

Run focused checks and a relevant pilot before broader collections. Keep a
short treatment/repair/result/decision table and preserve the best supported
candidate. Inspect per-case failures and apply the
[variation check](references/evaluation-guide.md#variation-and-comparison)
before tuning a stochastic difference.

After edits, state what changed since the measured revision and apply
[evidence reuse rules](references/evaluation-guide.md#reuse-evidence-after-edits).
Do not describe an earlier full run as validation of later unmeasured behavior.
Reuse completed checks when valid; do not repeatedly rerun unchanged coverage.

## 5. Accept, submit, and complete applicable rollout

Use the [acceptance and rollout checklist](references/definition-of-done.md).
Once the intended benefit is demonstrated, blockers pass, remaining tradeoffs
are understood, and required final validation is complete, **stop tuning and
submit**. Keep optional optimization out of the current task. If validation
exposes a blocker, repair it within the remaining budget or report the gap;
do not chase perfect scores or disguise incomplete evidence as acceptance.

Leave a [compact evidence package](references/definition-of-done.md#compact-evidence-package)
with the before/after result, remaining regressions/risks, why iteration stopped,
and actual rollout status. Use existing release/recovery mechanisms. Submission
for review is not proof of deployment; mark the truthful
[closing state](references/definition-of-done.md#closing-state).
