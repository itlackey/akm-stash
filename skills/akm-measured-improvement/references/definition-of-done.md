# Acceptance, rollout, and definition of done

Use one issue/PR or the [change record](../assets/change-record.md). Apply the
[validation selection](evaluation-guide.md#choose-validation-by-the-changed-boundary),
[process guidance](process-guidance.md), and
[experiment rules](evaluation-guide.md#experiment-budget); do not duplicate their
instructions in another report. Mark inapplicable items with a reason.

## Acceptance

- [ ] The observed failure, affected contracts/boundaries, intended benefit,
  ordered criteria, and non-goals are explicit. Requirements were not weakened
  after seeing disappointing results.
- [ ] The smallest justified implementation is selected; unsuccessful approaches
  and unnecessary machinery are removed. Required regression/contract/integrity
  checks pass, including relevant persistence, consumer, and recovery boundaries.
- [ ] Focused and broader measurements answer named questions. Raw failures,
  coverage/errors, per-case changes, and resource costs were inspected. The
  primary benefit is demonstrated, or useful behavior holds with a justified
  simplification; no unrelated score increase is required.
- [ ] Each negative signal has an evidence-based disposition from the table below.
  No blocker remains; tolerated regressions/uncertainty are bounded and disclosed.
- [ ] The [preflight](evaluation-guide.md#runner-and-execution-preflight),
  [evidence reuse](evaluation-guide.md#reuse-evidence-after-edits), and applicable
  [shared verification](evaluation-guide.md#shared-verification) rules are met.
  Required final-build validation is complete and the experiment budget holds.
- [ ] Intentional default/contract changes have current help, types, examples,
  and working explicit alternatives. Usefulness, not identical old output, is
  the criterion. Measurement/version changes are attributed to the correct cause.
- [ ] The selected result meets acceptance: tuning stops. Submit the gain,
  remaining regression/risk, rationale, and why further optimization is outside
  this task. Final-validation failures reopen the affected work within budget.

| Negative signal | Disposition |
|---|---|
| Failed integrity/authorization/required-contract test, critical job broken, or agreed operational bound exceeded | Block acceptance; a better aggregate cannot compensate. |
| Real limited secondary regression outweighed by the intended benefit and permitted by the criteria | Record affected cases, magnitude/severity, rationale, and any useful follow-up; submit once final checks pass. |
| Possible regression, incomplete judging, setup mismatch, or variation | Use the smallest decision-changing replay/test/repeat; do not call it noise without evidence or a fact without confirmation. A credible unresolved integrity risk blocks. |
| Bounded uncertain soft regression with enough evidence for the net-benefit decision | Disclose the uncertainty and coverage limit; do not run indefinitely to eliminate every possible risk. |

A completed run is not a graded quality pass; tests alone do not prove an
unmeasured benefit. Acceptance does not require perfect model accuracy or every
metric increasing. Avoid universal nDCG/accuracy thresholds and universal
zero-data-loss claims from finite fixtures. Distinguish introduced regressions
from documented baseline defects, without hiding either or waiving required
integrity checks. An exhausted budget is not acceptance.

## Rollout

- [ ] Record target build, owner, authorized actions, and evidence location.
- [ ] Follow existing persisted-data compatibility/backup/recovery requirements
  if affected. Do not invent migrations for code-only changes.
- [ ] Review affected queued decisions, in-flight/scheduled work, and caches;
  old decisions are not automatically valid under changed policies. Use existing
  review/invalidation mechanisms, not a parallel queue or state service.
- [ ] Perform a representative isolated installed-path/failure check when
  relevant. Record recovery and its limits; a binary downgrade alone may not
  reverse written content or external effects.
- [ ] Verify actual publication/installation and the representative user path;
  observe relevant existing error, quality, or resource signals after rollout.

Use existing release/monitoring tools. Documentation/skill publication can be
verified by commit/push, remote contents, and content/installability checks;
production migration/model-quality testing may be inapplicable with a reason.

## Compact evidence package

The issue/PR is the acceptance narrative. Link minimal reproducing fixtures,
focused test/replay results, and the baseline/candidate summary with decisive
failures and tradeoffs. Keep additional raw outputs in the existing durable,
access-appropriate result location when needed to reproduce/review the claim;
do not require committing every pilot log, duplicate report, or full raw run.
Do not remove source identities necessary for comparison when redacting secrets.

Illustrative record shape, not measured results:

> Boundary: serializer after an unchanged model request/response contract.
> Evidence: deterministic before/after publication fixture and exact-response
> replay; focused tests and independent final case linked here.
> Earlier model run: identifies its build; no final-build model-quality claim.
> Final changes/checks: optional-field repair; replay and persistence checks rerun.
> Tradeoff/limit: remaining model error disclosed; this fixes persistence only.
> State: accepted/ready for rollout; named publication action and owner.

A ranking change instead needs relevant judged retrieval/cost evidence; select
that through the [boundary table](evaluation-guide.md#choose-validation-by-the-changed-boundary).

## Closing state

- **Done:** acceptance and all applicable rollout/verification are complete.
- **Ready for rollout:** accepted; list the remaining action and owner.
- **Needs iteration:** a blocker or required evidence remains; state it precisely.
- **Discarded:** benefit does not justify the complexity/tradeoffs; remove the
  experiment and retain useful evidence.

Submission for review is not deployment. For combined work, the final-build
claim must follow the [shared verification plan](evaluation-guide.md#shared-verification).
