# Acceptance, rollout, and definition of done

Use this for one feature or a coherent set of changes. Maintain one
[change record](../assets/change-record.md); link existing test/eval/release
artifacts instead of creating a parallel reporting system. Scale the evidence
to the change. Mark a non-applicable item with a reason.

## Acceptance

- [ ] The intended user job and behavior are explicit, supported by a source
  trace or reproduction; hypotheses are distinguished from findings.
- [ ] Acceptance criteria were chosen before final tuning: worthwhile benefit,
  blocking tests/invariants, tolerable tradeoffs, and final validation. Each
  behavior has evidence, and a change set has an integrated check. Criteria
  were not weakened after seeing results just to accept a losing variant.
- [ ] The smallest effective implementation is used. Unneeded limits,
  duplicate stages, obsolete options/branches, and dead documentation are
  removed or updated. Added machinery has a concrete benefit.
- [ ] Required regression fixtures and repository checks pass. Affected akm-eval
  collections completed with enough valid coverage for the claim; raw failures
  and per-case changes were inspected. A successful run need not improve every
  metric, and passing unit tests alone does not establish product improvement.
- [ ] Baseline and candidate evidence identify builds, effective settings,
  cases/scoring, completion/denominators, and relevant runtime/cache conditions.
  Intentional treatment differences and partial coverage are explained.
- [ ] The primary outcome improves or the reproduced correctness defect is
  fixed, or useful behavior holds with a justified simplification. Integrity
  and important existing jobs hold; each negative signal is classified as a
  blocker, bounded tradeoff, or uncertainty with evidence. No blocker remains;
  tolerated regressions/risks have their impact and rationale recorded. There
  is no universal nDCG or accuracy threshold substituted for representative cases.
- [ ] Where applicable, no defined fixture loses a distinct claim, publishes
  an unsupported assertion unnoticed, crosses scopes, or retires content based
  on incomplete assessment. Verify proposals, staging, acceptance, and recovery
  separately. State the finite coverage of these claims.
- [ ] New defaults are judged on better outcomes, including current/historical
  uses and explicit alternatives. Breaking behavior, examples, contracts, and
  fixtures agree; a legacy mode is retained only for an actual need.
- [ ] Label/scoring changes have the appropriate existing version/changelog
  updates, both saved runs are explicitly rescored where needed, and the
  reported gain is attributed to the right change.
- [ ] The best acceptable candidate is selected and its final validation is
  complete. Tuning stopped once the intended benefit and required checks were
  satisfied; optional optimization did not expand the task. See the
  [iteration/submission rules](evaluation-guide.md#decide-whether-to-iterate-or-submit).
- [ ] The submission leads with the improvement, before/after measurements,
  tests, remaining regressions/risks and their significance, why iteration
  stopped, and rollout status. A known bounded tradeoff is disclosed rather
  than hidden or treated as a demand for perfect scores.

Acceptance means **ready for rollout**. Passing code tests or committing a
change alone does not establish that its operational rollout succeeded.

## Rollout

- [ ] Identify the target version/commit, owner, rollout scope, and evidence
  location. Perform only the publication/operations already authorized by the
  task; list an outstanding authorized action plainly if it cannot be completed.
- [ ] If persisted formats or writes change, follow AKM's current persisted-data
  compatibility contract and relevant upgrade/recovery tests. Use existing
  backup/restore mechanisms. Do not invent a migration for a code-only fix.
- [ ] Inspect affected queued proposals, retirements, in-flight work, or cached
  state. A decision staged under incomplete old evidence is not automatically
  valid under a new retirement policy; review or reassess it before unattended
  acceptance. Use existing proposal tools rather than a second queue.
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
