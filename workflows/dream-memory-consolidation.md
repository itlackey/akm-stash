---
description: Walk through the full akm-dream process step by step, from kickoff through explicit review gates, phase 3 approval, phase 4 audit, and follow-up feedback. Use when staged review is the point — for routine consolidation prefer `akm improve memory --dry-run` instead.
tags: [dream, memory, review, workflow, akm-dream]
params:
  trigger: Why this dream run is happening (for example `post-refactor`, `weekly-maintenance`, or `manual-cleanup`)
  dream_dir: Directory containing the akm-dream package. Defaults to `skills/akm-dream`.
  review_focus: Optional area to scrutinize during review (for example `deletes`, `contradictions`, or `release memories`)
updated: 2026-05-24
---

# Workflow: Dream memory consolidation

This workflow is the operator-facing wrapper around `skills/akm-dream`. Use it
when you want the entire dream run to stay explicit, resumable, and auditable
inside AKM's workflow system instead of treating dream as a one-off script run.

The canonical implementation still lives in `skills/akm-dream/`; this workflow
simply walks the operator through that implementation in the right order.

## Step: Load the dream context
Step ID: load-context

### Instructions
Before touching the stash, load the documents that define the current dream
contract.

1. Read the skill and the key references:

   ```bash
   akm show skill:akm-dream
   ```

   Then inspect:
   - `{{ dream_dir }}/README.md`
   - `{{ dream_dir }}/references/review-flow.md`
   - `{{ dream_dir }}/references/akm-commands.md`
2. Record `params.trigger` and any `params.review_focus` in the workflow notes.
3. Confirm the current stash is healthy enough to run dream:
   - `akm info`
   - verify `{{ dream_dir }}` exists
   - verify the stash is not already locked by an unrelated dream session

### Completion Criteria
- The operator has loaded the current dream instructions and review contract.
- The trigger and any special review focus are explicit.
- The stash and dream package are available for use.

## Step: Try the native path first
Step ID: try-native-first

### Instructions
Before invoking the dream orchestrator, run the native CLI path. `akm improve
memory` (in akm-cli 0.8) covers most consolidation cases (merge / delete /
promote / contradict / relative-date resolution) without staged review overhead.

1. Inspect what improve would do:

   ```bash
   akm improve memory --dry-run
   ```

2. If the dry-run plan is acceptable and you don't need the staged review gate,
   apply it directly with `akm improve memory` and mark this workflow `skipped`
   with a note explaining native path was sufficient.
3. If the plan is high-risk (large deletes, contested facts, post-refactor
   churn) or you need per-run audit artifacts under `<stash>/.akm-dream/runs/`,
   continue to the next step.

### Completion Criteria
- The native dry-run was inspected.
- A clear decision was recorded: either native path applied + workflow skipped,
  or dream orchestrator needed (proceed to next step).

## Step: Start the orchestrated dream run
Step ID: start-run

### Instructions
Kick off the canonical orchestrator from `{{ dream_dir }}`.

1. Run the standard entrypoint:

   ```bash
   bun run dream
   ```

2. Capture the run directory under `<stash>/.akm-dream/runs/<run-id>/`.
3. If the command stops because another dream lock is active, determine whether
   it is the same in-flight run or an unrelated one:
   - if it is the same reviewed run waiting at phase 3, resume later with
     `bun run dream:continue`
   - otherwise mark this workflow `blocked` instead of forcing the lock

### Completion Criteria
- A dream run exists with a concrete `<run-id>`.
- The run directory is known.
- Any lock conflict is resolved by resume-or-block, not by bypassing safety.

## Step: Review phase 1 orient output
Step ID: review-orient

### Instructions
Inspect the phase 1 inventory before trusting later steps.

1. Review `<run-dir>/orient.json`.
2. Check at minimum:
   - memory count looks plausible for the stash
   - broken links in the stash memory index file are surfaced
   - protected/canonical memories are not unexpectedly at risk
   - the inventory reflects the live stash rather than an obviously stale run
3. Record any anomalies in workflow notes. If the inventory is incomplete or
   obviously wrong, mark the step `blocked` and stop.

### Completion Criteria
- `orient.json` was inspected.
- Inventory coverage and broken-link reporting look credible.
- Any phase 1 anomaly is either documented or the run is blocked.

## Step: Review phase 2 signal output
Step ID: review-signal

### Instructions
Inspect the gathered signal before approving any consolidation work.

1. Review `<run-dir>/signal.json`.
2. Check whether the signals are recent, specific, and worth memory updates.
3. Note any noisy matches, thin evidence, or transcripts/logs that should not
   influence consolidation.
4. If needed, do narrow follow-up inspection around one suspicious signal rather
   than re-reading entire transcript directories.

### Completion Criteria
- `signal.json` was reviewed.
- Noisy or low-value signals are identified.
- The operator is comfortable using phase 2 as input to planning.

## Step: Review the deterministic plan and preview apply
Step ID: review-plan

### Instructions
This is the explicit approval gate. Do not continue the dream until this step is
actually reviewed.

1. Inspect the review artifacts:
   - `<run-dir>/plan.json`
   - `<run-dir>/review-checklist.md`
   - `<run-dir>/run-report.json`
2. Focus on:
   - merges
   - deletes
   - contradiction-driven updates
   - any items matching `params.review_focus`
3. Preview the apply step from `{{ dream_dir }}` before approval:

   ```bash
   bun run phase3:apply -- --plan <run-dir>/plan.json --dry-run
   ```

4. If the plan is not acceptable, stop here and mark the workflow `blocked` or
   `failed` with specific notes. Do not run `dream:continue`.

### Completion Criteria
- The review checklist and plan were inspected.
- A dry-run preview was reviewed.
- The operator has either approved the plan or explicitly stopped the run.

## Step: Approve and execute phase 3 plus phase 4
Step ID: approve-and-continue

### Instructions
Once the plan is approved, resume the canonical run.

1. From `{{ dream_dir }}`, execute:

   ```bash
   bun run dream:continue
   ```

2. This is the approval action. It should apply the approved phase 3 plan,
   generate phase 3 artifacts, rebuild the stash memory index file, and refresh
   the AKM index.
3. If the continue step fails, inspect:
   - `<run-dir>/actions.jsonl`
   - `<run-dir>/result.json`
   - `<run-dir>/summary.md`
   - `<run-dir>/run-report.json`

### Completion Criteria
- The approved plan has been executed, or the failure is documented with the
  phase 3/4 artifacts attached.
- The dream lock is no longer blocking future runs.

## Step: Audit the final result
Step ID: audit-result

### Instructions
Review the post-run output instead of assuming success because the script
exited cleanly.

1. Inspect:
   - `<run-dir>/phase4-result.json`
   - `<run-dir>/summary.md`
   - `<run-dir>/run-report.json`
   - `<stash>/memories/MEMORY.md` (the stash memory index file)
2. Confirm:
   - the stash memory index file is readable and within budget
   - dropped refs are acceptable
   - index refresh succeeded
   - created/updated/deleted counts match expectations
3. Spot-check the final searchable state with one or more of:
   - `akm search "<topic touched by the run>"`
   - `akm show memory:<name>` for a changed memory

### Completion Criteria
- Final artifacts were audited.
- The stash memory index file and refreshed index look correct.
- Any acceptable or unacceptable dropped refs are explicitly noted.

## Step: Capture follow-up and feedback
Step ID: capture-follow-up

### Instructions
Close the loop so the next dream run is better.

1. Record follow-up work for anything that still needs manual judgment:
   - noisy signal patterns to tighten
   - protected memories that need better metadata
   - planner heuristics that were too aggressive or too timid
2. If the workflow itself was helpful, signal that with AKM feedback:

   ```bash
   akm feedback workflow:dream-memory-consolidation --positive --note "Guided the full reviewed dream flow cleanly."
   ```

   If it missed something important, leave negative feedback with a concrete
   note instead.
3. If the dream uncovered lasting improvements for the implementation itself,
   route them into the normal proposal or fix workflow instead of silently
   carrying them forward.

### Completion Criteria
- Follow-up items or explicit "none" notes are recorded.
- Feedback was captured for the workflow when useful.
- The dream run ends with a clear audit trail, not just modified files.
