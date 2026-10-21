# Acceptance, rollout, and definition of done

Use this for one feature or a coherent set of changes. Maintain one
[change record](../assets/change-record.md); link existing test/eval/release
artifacts instead of creating a parallel reporting system. Scale the evidence
to the change. Mark a non-applicable item with a reason.

## Acceptance

- [ ] The intended user job and behavior are explicit, supported by a source
  trace or reproduction; hypotheses are distinguished from findings.
- [ ] The affected processes, input/output contracts, and actual state/external
  effects were identified. The relevant [process guidance](process-guidance.md)
  or discovery steps supplied suitable measurements and failure cases; unrelated
  process metrics were not imposed on the change.
- [ ] Ordered acceptance criteria were chosen before the first candidate:
  worthwhile benefit, process-specific blocking tests/invariants, secondary effects,
  tolerable tradeoffs/cost limits, and final validation. Each behavior has
  evidence, and a change set has an integrated check. Criteria were not reordered
  or weakened after seeing results just to accept a losing variant.
- [ ] The smallest effective implementation is used. Unneeded limits,
  duplicate stages, obsolete options/branches, and dead documentation are
  removed or updated. Added machinery has a concrete benefit.
- [ ] Required regression fixtures and repository checks pass. Applicable
  akm-eval collections completed with enough valid coverage for the claim;
  otherwise relevant tests/operation measurements and any remaining coverage
  gap are recorded. Raw failures and per-case changes were inspected. A successful
  run need not improve every metric; tests alone do not prove an unmeasured benefit.
- [ ] Baseline and candidate evidence identify builds, effective settings,
  cases/scoring, completion/denominators, and relevant runtime/cache conditions.
  Intentional treatment differences and partial coverage are explained.
- [ ] Applicable runner/configuration preflight confirmed effective settings,
  mode/flags, actual outputs/effects, errors, and applicable engines/models.
  Before further tuning based on stochastic scores, unchanged comparable pilot
  observations checked variation; any exception has a concrete reason. Repeats
  and candidate variants stayed within the recorded experiment budget.
- [ ] The primary outcome improves or the reproduced correctness defect is
  fixed, or useful behavior holds with a justified simplification. Integrity
  and important existing jobs hold; each negative signal is classified as a
  blocker, bounded tradeoff, or uncertainty with evidence. No blocker remains;
  tolerated regressions/risks have their impact and rationale recorded. There
  is no universal nDCG or accuracy threshold substituted for representative cases.
- [ ] Process-specific integrity and failure/recovery fixtures pass. Verify the
  actual affected stages separately; an intermediate result does not establish
  successful publication, execution, or recovery. State the finite coverage.
- [ ] New defaults are judged on better outcomes, including representative existing
  uses and explicit alternatives. Breaking behavior, examples, contracts, and
  fixtures agree; a legacy mode is retained only for an actual need.
- [ ] Label/scoring changes have the appropriate existing version/changelog
  updates, both saved runs are explicitly rescored where needed, and the
  reported gain is attributed to the right change.
- [ ] The best acceptable candidate is selected and its final validation is
  complete. Tuning stopped once the intended benefit and required checks were
  satisfied. The default maximum was three total candidate variants unless the
  task explicitly set another budget; optional optimization did not expand it.
  At the candidate cap, only reserved final checks remained; the run/time/cost
  cap was also respected. See the
  [iteration/submission rules](evaluation-guide.md#decide-whether-to-iterate-or-submit).
- [ ] The submission leads with the improvement, before/after measurements,
  tests, remaining regressions/risks and their significance, why iteration
  stopped, and rollout status. A known bounded tradeoff is disclosed rather
  than hidden or treated as a demand for perfect scores.

Acceptance means **ready for rollout**. Passing code tests or committing a
change alone does not establish that its operational rollout succeeded.
If a budget is exhausted with a blocker or incomplete required validation,
record **needs iteration**; this acceptance checklist has not passed.

## Rollout

- [ ] Identify the target version/commit, owner, rollout scope, and evidence
  location. Perform only the publication/operations already authorized by the
  task; list an outstanding authorized action plainly if it cannot be completed.
- [ ] If persisted formats or writes change, follow AKM's current persisted-data
  compatibility contract and relevant upgrade/recovery tests. Use existing
  backup/restore mechanisms. Do not invent a migration for a code-only fix.
- [ ] Inspect affected queued decisions, in-flight work, scheduled execution,
  or cached state. Earlier decisions are not automatically valid under a changed
  policy; review, reassess, or invalidate them through existing mechanisms when
  needed. Do not introduce a parallel queue or state service.
- [ ] Verify the candidate in an isolated, representative setting first when
  the change affects data or autonomous actions. Test failures/interruption
  when relevant; never use production destruction to demonstrate a benchmark.
- [ ] Record a practical rollback or recovery action and its limits. A binary
  downgrade is not sufficient when formats, content, or external effects changed.
- [ ] Verify the actual published/installed target and one representative user
  path. Observe relevant existing health, error, latency, recall, or proposal
  signals after rollout; record the observation and any remaining limitations.

Use existing monitoring and release procedures. Add rollout automation only
when repeated work or measured mistakes justify it. For documentation/skill
changes, remote commit verification and appropriate content/installability
checks can satisfy rollout; migration and production observation may be not
applicable. Do not require an expensive model benchmark for a wording edit.

## Closing state

Choose a truthful state in the record:

- **Done:** acceptance and all applicable rollout/verification work are complete.
- **Ready for rollout:** accepted; specify the remaining action and owner.
- **Needs iteration:** benefit, correctness, or rollout verification is inadequate.
- **Discarded:** the change did not justify its complexity or tradeoffs; remove
  experimental code and keep the useful evidence.

For a release group, verify the final combined build; do not combine separate
green runs of different intermediate builds into a claim that the final group
passed. A deferred measurement needs a reason and a bounded claim, not a check
mark. Track a real follow-up in the project's existing system; no extra status
service is needed.
