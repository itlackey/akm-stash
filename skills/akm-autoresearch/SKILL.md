---
name: akm-autoresearch
description: "Use when a developer wants autonomous experiments to discover ways to improve a specific AKM process: establish a baseline, explore hypotheses with akm-eval, keep promising candidates, and report reproducible findings within the authorized research session."
updated: 2026-10-21
---

# AKM Autoresearch

Explore improvements to a selected AKM process. Research can start from a goal,
such as better retrieval or cheaper extraction, without a prescribed fix.
For implementing and delivering a defined change, use
[measured improvement](../akm-measured-improvement/SKILL.md). Choose by the job,
not whether a GitHub issue exists.

This loop follows [Karpathy's autoresearch](https://github.com/karpathy/autoresearch/blob/228791fb499afffb54b46200aca536f79142f117/program.md):
baseline, hypothesis, edit, measure, keep/discard, repeat. **Keep selects a
research incumbent; it does not establish production readiness.** This skill's
session and continuation rules govern research. Linked measurement sections
supply mechanics; their delivery attempt cap and stop-and-submit rules apply
only when handing a selected change to measured improvement.

## 1. Establish the research charter

Read repository instructions, the actual process, relevant contracts/tests, and
the selected akm-eval runner's current documentation. Use one existing research
note or the [research record](assets/research-record.md); link evidence instead
of duplicating reports. Record:

- Process, user job, primary objective and direction, mandatory guardrails,
  relevant cost/complexity tradeoffs, and non-goals. A single primary score is
  useful; integrity failures cannot be traded for a higher score.
- Editable files/configuration and fixed comparison conditions: cases, rubric,
  scoring, model/runtime settings, and resource limits except those explicitly
  being tested. Allow coherent cross-file changes; prefer useful simplification.
- Authorized session: duration/deadline, cost/call/resource ceilings where
  applicable, per-run timeout, and checkpoint/report expectations. An explicitly
  requested overnight or until-interrupted session is valid. There is **no
  default three-treatment cap** and **no stop at the first improvement**.

Use the developer's existing scope and resource authorization. If essential
limits for unattended or paid work are missing, resolve them before that work;
continue useful local inspection. Do not infer unlimited spending or expand
the process, access, or publication scope.

## 2. Establish a trustworthy baseline

Use an isolated branch/worktree and disposable AKM config, state, and indexes;
preserve unrelated work. Assign ownership or isolate shared mutable caches.
Apply only relevant [process guidance](../akm-measured-improvement/references/process-guidance.md),
[validation selection](../akm-measured-improvement/references/evaluation-guide.md#choose-validation-by-the-changed-boundary),
and [runner preflight](../akm-measured-improvement/references/evaluation-guide.md#runner-and-execution-preflight).
Inspect a saved pilot before expensive collection. Reuse existing runners,
replays, comparisons, and artifacts rather than building another framework.

Measure the unchanged baseline and establish relevant variation. Save its exact
build/configuration, invocation, evaluator/corpus identity, completeness, cost,
and artifact location. Reserve fresh cases for promising milestones or handoff.
If the collector/scorer is wrong, correct it explicitly and rescore/recollect
affected baseline and candidate evidence under the new measurement identity.
Changing the yardstick is not an AKM improvement.

## 3. Run the experiment loop

Continue autonomously within the charter; do not request approval per treatment.

1. Inspect the incumbent and previous findings. State a hypothesis and predicted
   effect. Identify the known-good parent and exact candidate commit or complete
   patch/config fingerprint. Change a coherent experimental boundary.
2. Run cheap affected correctness checks, then the relevant pilot/evaluation.
   A deterministic processing change may need identical-input replay rather
   than new model calls. Failed guardrails invalidate a candidate even if its
   objective improves. Diagnose setup failures separately from product results.
3. Record hypothesis, parent/candidate, metrics, guardrails, completion/errors,
   cost, artifact links, and decision in the same short ledger. Use explicit
   error/unavailable status for failures, never an invented zero score. Read
   concise summaries and relevant failure excerpts; retain full raw artifacts
   in existing output locations without repeatedly loading them into context.
4. **Keep** a supported improvement or equivalent useful behavior with less
   machinery. **Discard** unsupported or inferior treatments; **error** records
   an invalid/incomplete run. Report tradeoffs and uncertainty. Preserve the
   best supported candidate separately from the latest trial; an uncertain
   candidate can receive further evidence without becoming the incumbent.
5. Restore only experiment-owned changes/state when discarding a trial. A
   checkpoint permits safe restoration, not a whole-branch reset over others'
   work. Bound repairs/retries by the session resources; log failed approaches
   so they are not retried without a new reason. Continue with another hypothesis.

Apply the [variation/comparison rules](../akm-measured-improvement/references/evaluation-guide.md#variation-and-comparison)
to close, noisy, or surprising gains. Inspect per-case failures; verify promising
candidates with appropriate repeats and broader/fresh cases at milestones.
Do not require review or a full suite for every exploratory treatment. Once
fresh cases inform tuning, they are development cases. Reuse valid evidence
under the [evidence rules](../akm-measured-improvement/references/evaluation-guide.md#reuse-evidence-after-edits).

Checkpoint after each completed experiment so interruption leaves a resumable
record. Stop at the authorized session/resource limit, developer interruption,
or a blocker that prevents useful valid experiments. Report it rather than
silently widening the charter. A resumed session inherits findings and resource
accounting unless the developer authorizes a new envelope.

## 4. Hand off findings

Leave the baseline and best supported candidate (or no gain), exact reproduction
commands/builds, compact experiment history, negative findings, resource use,
coverage/variation limits, reason research stopped, and promising next questions.
Distinguish pilot winners from independently checked gains and disclose known
regressions. Keep artifacts proportional; a research note with links is enough.

When a selected candidate is to be implemented/submitted, use
[measured improvement](../akm-measured-improvement/SKILL.md) to identify remaining
acceptance and rollout gaps. Carry forward valid evidence with its measured
revision; do not repeat the research or claim later unmeasured changes passed.
Research alone does not authorize publication, installation, or deployment.

Shared links assume the full stash or both skill directories. A single-skill
`akm clone` copies only that directory: resolve missing shared documents in the
source stash at its recorded revision. The corresponding paths are available
in the [source repository](https://github.com/itlackey/akm-stash/tree/main/skills/akm-measured-improvement);
record the revision actually read rather than silently mixing versions.
