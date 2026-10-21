# AKM research: [process / objective]

Status: [running / paused / completed / blocked]
Developer/session: [request; duration/deadline or explicit until-interrupted scope]

Use one existing note if it already covers these fields. Follow the
[research loop](../SKILL.md); link saved artifacts instead of copying raw logs.

## Charter and setup

- Process/user job; primary objective and direction: [value]
- Hard guardrails; cost/complexity tradeoffs; non-goals: [value]
- Editable boundary; fixed evaluator/cases/settings; intentional variables: [value]
- Authorized limits and consumed resources: [time/calls/cost as applicable;
  per-run timeout; checkpoint/report expectations]
- Instructions, stash/AKM/akm-eval revisions; branch/worktree/state ownership: [links]
- Runner/preflight and reproduction commands: [actual argv/config; artifacts]
- Baseline identity and results: [build/fingerprint, evaluator/corpus, objective,
  guardrails, completion/errors, variation, resource cost]
- Fresh milestone/handoff cases: [held outside tuning]

## Experiment ledger

| Trial; exact parent → candidate | Hypothesis / change | Evidence: objective, guardrails, completion, cost | Decision / reason |
|---|---|---|---|
| baseline | unchanged | [artifact; values] | reference |
| 1; [identities] | [prediction; coherent change] | [artifact; values or unavailable/error] | keep / discard / error |

Best supported incumbent: [exact identity and evidence; baseline if no gain]
Last trial/checkpoint; state restored or retained: [value]
Measurement corrections and affected rescoring/recollection: [links or none]

## Checkpoint / handoff

- Findings and negative results: [before/after; hypotheses supported/rejected]
- Confirmation, fresh cases, uncertainty, regressions, coverage limits: [links]
- Resources consumed; stop/resume reason and remaining authorization: [value]
- Reproduce incumbent: [commands, configuration, build, artifact locations]
- Changes since measured revision; retained evidence / required reruns: [value]
- Next research questions or delivery gaps/owner: [value]

A kept candidate is a research result. Use measured improvement for applicable
implementation acceptance and rollout; carry forward valid evidence.
