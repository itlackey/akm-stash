# Change: [name]

Status: [draft / needs iteration / ready for rollout / done / discarded]
Owner: [owner]
Scope/non-goals: [task; affected process and actual input/output/effect boundary]

Use this template only if the existing issue/PR lacks equivalent fields. Follow
[measurement rules](../references/evaluation-guide.md) and the
[acceptance/rollout checklist](../references/definition-of-done.md); link existing
artifacts instead of copying their contents. A
[compact example](../references/definition-of-done.md#compact-evidence-package)
shows the expected level of evidence.

## Decision and plan

- Job/failure and reproduction: [source/fixture; facts versus hypothesis]
- Intended gain, smallest fix/deletion, added machinery: [or none]
- Ordered criteria: [hard invariants, primary benefit, secondary tradeoffs/cost limits]
- Validation choice and named questions: [boundary table/process guidance; gaps]
- Review and fresh final cases: [reviewer or solo pass; what stays out of tuning]
- Budget: [exploratory treatment count/limit; repairs recorded separately;
  total run/time/cost bound including repairs and final validation]
- Shared checks/resources, if parallel: [skill/build revisions, owners, isolated state]

## Reproduction and evidence

| Context | Baseline | Selected candidate |
|---|---|---|
| Build, commit/fingerprint; harness revision | [value] | [value] |
| Inputs, effective argv/config, labels/scorer | [value] | [value] |
| Relevant model/mode/cache/runtime conditions | [value or inapplicable] | [value] |

Commands/setup and preflight: [links; required fields retained; no secrets]

| Treatment or repair/build | Question and evidence | Outcome/regressions/cost | Decision |
|---|---|---|---|
| Baseline | [reference] | [primary/integrity/errors/coverage] | reference |
| [treatment 1; repairs named] | [fixture/replay/pilot/full as needed] | [values and limits] | keep/revise/discard |

Best supported candidate: [build/evidence, or none]
Negative signals: [cases, impact, blocker/tradeoff/uncertainty, action/rationale]
Labels/version/rescoring and variation checks: [links or inapplicable]
Changes since measured revision: [boundary/dependencies, retained claims,
  required reruns, final-build results and gaps]
Why iteration stopped or continues: [criteria met / specific blocker / budget]

## Acceptance and rollout

- Acceptance narrative: [before/after benefit, tests, tradeoffs, finite coverage]
- Contract/default/docs changes: [or none]
- Actual final/combined build check: [owner/result/link]
- Target/owner and authorized publication/installation: [evidence or remaining action]
- Data/queued-state/recovery handling and limits: [or inapplicable]
- Representative installed path and post-rollout observation: [evidence or pending]
- Closing state and remaining action/owner: [use the linked checklist]
