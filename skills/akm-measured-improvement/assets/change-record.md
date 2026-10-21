# Change: [name]

Status: draft
Owner: [owner]
Scope: [feature or cohesive change set; AKM and/or akm-eval]
Affected process(es) and contract: [entry point, actual inputs/outputs, state or
  external effects; selected process guidance or discovery findings]

## Goal and experiment

- User job and observed failure: [reproduction, source, issue]
- Hypothesis and intended behavior: [what should improve and why]
- Smallest fix/deletion considered: [restriction, stage, duplication to remove]
- Added machinery and justification: [or none]
- Non-goals and deferred work: [from this task; do not inherit unrelated examples]
- Primary outcome and worthwhile benefit: [choose before tuning; user impact]
- Blocking tests/invariants and limits: [process-specific contracts and failure cases]
- Tolerable regression/cost tradeoffs: [bounds and rationale; not every metric must rise]
- Outcome priority, highest first: [rank this process's hard constraints,
  primary benefit, secondary effects, and cost; include operational ceilings]
- Intended treatment: [code isolation, default change, or named combined change]
- Cases reserved for final validation: [independently authored; not tuning data]
- Candidate budget and count: [maximum 3 total by default, including first solution;
  task-authorized override if any; no reset per prompt/model/hypothesis/session]
- Evaluation run/time/cost budget: [include variation check and reserve final
  validation; stop earlier on acceptance; no automatic extension for a blocker]

## Reproduction and run recipe

| Input | Baseline | Candidate |
|---|---|---|
| AKM version, commit, working-tree fingerprint | [value] | [value] |
| akm-eval revision / runner image | [value] | [value] |
| Cases and labels / scoring version | [value] | [value] |
| Effective config and intentional differences | [value] | [value] |
| Applicable engines/models/settings | [or not applicable] | [value] |
| Applicable execution/search mode and fallback | [or not applicable] | [value] |
| Relevant machine, cold/warm, timeouts/concurrency | [value] | [value] |

Exact commands and setup: [commands or links; no credentials/private seeds]
Runner/configuration preflight: [help/compatibility checked; mode/flags;
  effective settings and applicable engines; actual outputs/errors/effects]
Regression fixtures and reproduction: [paths, expected failure and behavior]
Affected behaviors in a change set: [criterion and fixture for each]

## Evidence and iterations

| Variant/build | Artifacts and checks | Outcome / regressions / cost | Decision |
|---|---|---|---|
| Baseline | [summary, samples, tests] | [result] | [reference] |
| Candidate 1 / budget | [summary, samples, tests] | [result] | [keep/revise/discard] |

Best acceptable candidate: [code/build and evidence, or none yet]
Next experiment, if needed: [specific unresolved acceptance question, not score chasing]

| Measure | Baseline | Candidate | Interpretation |
|---|---|---|---|
| Primary outcome | [value, denominator] | [value, denominator] | [delta/uncertainty] |
| Integrity / important negative cases | [value] | [value] | [failures reviewed] |
| Completion, errors, timeouts, excluded judgments | [value] | [value] | [coverage limits] |
| Relevant tokens, latency, indexing, memory, cost | [value or unknown] | [value] | [conditions] |

| Regression or possible risk | Evidence and affected cases | Impact/severity | Classification and disposition |
|---|---|---|---|
| [negative signal, or none] | [baseline/candidate; confirmed vs uncertain] | [magnitude/frequency] | [blocker / bounded tradeoff / uncertainty; action or rationale] |

Labels/rescoring and measurement changes: [or none; keep original artifacts]
Final validation / repeats: [results, variation, and held-out limitations]
Pre-tuning variation check: [stochastic baseline/candidate observations and
  range; or not applicable for deterministic behavior, with reason]

## Acceptance decision

- Decision and evidence: [accept, iterate, or discard; why]
- Why iteration stopped or must continue: [criteria met / specific blocker;
  do not require a perfect score or zero soft regressions]
- Submission summary: [what improved; before/after; tests; remaining regression/risk
  and significance; rollout status]
- Removed code/options/stages and documentation updates: [links]
- Breaking/default changes and supported alternatives: [or none]
- Relevant repository checks and integrated final-build check: [results]
- Known limits and follow-ups: [owner, existing issue, bounded claim]

Apply the skill's `references/definition-of-done.md`. Explain non-applicable
items instead of treating every change as a platform release.

## Rollout and completion

- Target build, owner, and authorized rollout scope: [value]
- Persisted-data migration/backup/queued-decision handling: [or not applicable]
- Representative pilot and failure/recovery evidence: [or not applicable]
- Publication/installation action and actual target verification: [evidence]
- Rollback/recovery procedure and limits: [action, or not applicable with reason]
- Post-rollout observation: [user path, relevant signals, result, period/build]
- Final state: [done / ready for rollout / needs iteration / discarded]
- Remaining action and owner if not done: [specific action]
