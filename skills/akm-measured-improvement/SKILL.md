---
name: akm-measured-improvement
description: "Use when evaluating, tuning, simplifying, or developing akm or akm-eval: reproduce a problem, establish a baseline, make the smallest effective change, measure it with akm-eval, and complete acceptance and rollout as the definition of done."
updated: 2026-10-20
---

# Measured AKM Improvement

Use this process for a feature, bug fix, default change, simplification, or
coherent set of changes to **AKM's implementation or akm-eval**. Running
`akm improve` maintains knowledge assets; it does not by itself evaluate an
implementation change. For routine library maintenance, use the existing
improve, health, and proposal guidance instead.

This skill targets the AKM 0.10 improvement approach. Read the selected
checkouts' instructions, contracts, runner help, and compatibility notes;
examples are recipes to verify, not a frozen CLI contract.

## Working principles

- Prefer subtraction: remove an unnecessary limit, stage, duplicate rule,
  configuration option, or compatibility branch before adding machinery.
- Permit breaking changes and improved defaults when the release allows them
  and measured outcomes justify them. Preserve useful capabilities, not old
  output merely because it is old.
- Reuse AKM's adapters, indexing, relationships, proposals, persistence, and
  execution. Reuse akm-eval's runners, fixtures, scoring, and reports.
- A new guard, abstraction, suite, or service needs a demonstrated benefit
  exceeding its implementation, operational, and maintenance costs.
- Keep protections against data loss and corruption. Removing an arbitrary
  prompt cap means assessing complete evidence, not accepting a partial read.
- Rename preservation and stable document identity remain deferred in the
  starting improvement plan. Do not expand the task into them implicitly.

## 1. Ground the problem and create one change record

Read `AGENTS.md` and current source, tests, architecture, and stability docs.
Trace the complete behavior before declaring a capability missing. Distinguish
observed failures, documented behavior, hypotheses, and proposed improvements.
Existing comments and historical benchmark numbers are leads to verify.

Create one record for a feature or cohesive set of changes, using
[the template](assets/change-record.md) or the equivalent fields in an existing
issue/plan. The optional helper copies the template without overwriting:

```bash
bash /path/to/skills/akm-measured-improvement/scripts/new-change.sh \
  /path/to/akm/docs/plans/change-name.md
```

State the user job, reproducible failure, hypothesis, intended behavior,
smallest plausible fix or deletion, non-goals, acceptance evidence, and rollout
conditions. For a set of changes, give each behavior an acceptance criterion
and include an integrated end-to-end check.

## 2. Choose the minimum useful measurements

Use [evaluation selection and recipes](references/evaluation-guide.md).
Choose a primary outcome and relevant integrity, regression, and cost measures
before tuning. Match verification to impact: a documentation-only change does
not require an expensive agent benchmark.

Capture the baseline with existing akm-eval artifacts. Record the actual AKM
build, harness revision, cases, labels/scorer, effective configuration, models,
search mode, and environment/cache conditions relevant to the comparison.
Separate code-isolation experiments from comparisons of old and new defaults.

## 3. Reproduce and simplify

Add a small regression fixture that demonstrates the problem. Keep deterministic
parser, write-path, and state-integrity tests in AKM; extend the appropriate
akm-eval cases for behavioral measurement. Inspect model inputs and persisted
outputs, not only success envelopes or aggregate scores.

Implement the smallest effective change. Record what it removes and the cost
of anything it adds. Avoid new frameworks, broad refactors, and compatibility
modes without evidence that the user job requires them.

## 4. Measure, inspect failures, and tune

Run the relevant tests and pilot before a full expensive collection. Inspect
raw failures and per-case changes, then alter one factor or one explicitly
defined treatment at a time. Keep a short variant/result/decision table in
the change record and discard ineffective variants.

Reserve independently authored cases for the final check. Generated rewrites
of public cases do not establish a held-out set. Repeat model-backed runs
when variation changes the decision; repeating unchanged deterministic results
usually adds no information.

## 5. Make an acceptance decision

Use existing comparison reports, raw outputs, and
[the definition of done](references/definition-of-done.md). Explain the
benefit, regressions, uncertainty, and operational cost. Judge new retrieval
results where needed and explicitly rescore both saved runs after label changes.

An improved default can change existing output. Test current and historical
jobs and explicit overrides; update obsolete contracts, documentation, and
fixtures instead of retaining a legacy mode automatically. If a candidate
does not improve the intended outcome, revise it or remove it.

## 6. Complete rollout and report the actual state

Acceptance, migration/recovery where applicable, and rollout verification are
part of done. Use existing release, proposal, health, and recovery mechanisms.
Perform publication and operational changes within the task's authorization;
this skill does not itself authorize production actions.

Record the actual target build, rollout evidence, rollback procedure, and
post-change observation. When rollout is outside the authorized scope or
cannot yet happen, mark **ready for rollout**, name the remaining action and
owner, and avoid claiming the feature is done. A lightweight documentation or
skill change can use commit/push plus remote/installability verification as its
applicable rollout; mark irrelevant migration steps not applicable with a reason.

## Deliverable

Leave one reviewable change record linking the implementation, regression
fixtures, baseline/candidate artifacts, iteration decisions, acceptance result,
and rollout status. Keep sensitive logs, model keys, private corpora, and
generated private seeds out of published artifacts.
