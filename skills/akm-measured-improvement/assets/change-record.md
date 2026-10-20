# Change: [name]

Status: draft
Owner: [owner]
Scope: [feature or cohesive change set; AKM and/or akm-eval]

## Goal and experiment

- User job and observed failure: [reproduction, source, issue]
- Hypothesis and intended behavior: [what should improve and why]
- Smallest fix/deletion considered: [restriction, stage, duplication to remove]
- Added machinery and justification: [or none]
- Non-goals: [rename preservation/stable identity remain deferred unless scoped]
- Primary outcome and acceptance criterion: [choose before tuning]
- Integrity/regression/cost criteria: [include negative and historical jobs]
- Intended treatment: [code isolation, default change, or named combined change]
- Cases reserved for final validation: [independently authored; not tuning data]

## Reproduction and run recipe

| Input | Baseline | Candidate |
|---|---|---|
| AKM version, commit, working-tree fingerprint | [value] | [value] |
| akm-eval revision / runner image | [value] | [value] |
| Cases and labels / scoring version | [value] | [value] |
| Effective config and intentional differences | [value] | [value] |
| Reader, judge, embedding model/settings | [or not applicable] | [value] |
| Actual search mode / fallback | [value] | [value] |
| Relevant machine, cold/warm, timeouts/concurrency | [value] | [value] |

Exact commands and setup: [commands or links; no credentials/private seeds]
Regression fixtures and reproduction: [paths, expected failure and behavior]
Affected behaviors in a change set: [criterion and fixture for each]

## Evidence and iterations

| Variant/build | Artifacts and checks | Outcome / regressions / cost | Decision |
|---|---|---|---|
| Baseline | [summary, samples, tests] | [result] | [reference] |
| Candidate | [summary, samples, tests] | [result] | [keep/revise/discard] |

| Measure | Baseline | Candidate | Interpretation |
|---|---|---|---|
| Primary outcome | [value, denominator] | [value, denominator] | [delta/uncertainty] |
| Integrity / important negative cases | [value] | [value] | [failures reviewed] |
| Completion, errors, timeouts, excluded judgments | [value] | [value] | [coverage limits] |
| Relevant tokens, latency, indexing, memory, cost | [value or unknown] | [value] | [conditions] |

Per-case regression review: [cases, reasons, accepted tradeoffs]
Labels/rescoring and measurement changes: [or none; keep original artifacts]
Final validation / repeats: [results, variation, and held-out limitations]

## Acceptance decision

- Decision and evidence: [accept, iterate, or discard; why]
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
