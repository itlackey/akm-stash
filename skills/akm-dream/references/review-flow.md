# Dream Review And Approval Flow

This skill uses staged validation so a full dream run is reviewable before the
destructive or index-rewriting parts complete.

## Review gates

1. Phase 1 output review
   - Artifact: `orient.json`
   - Validate inventory completeness, broken `MEMORY.md` refs, and any memories
     that appear protected or canonical.
2. Phase 2 output review
   - Artifact: `signal.json`
   - Validate that gathered signals are recent, specific, and not transcript
     noise.
3. Phase 3 approval gate
   - Artifacts: `orient.json`, `signal.json`, `plan.json`,
     `review-checklist.md`, `run-report.json`
   - Required review: proposed merges, deletes, contradiction fixes, and any
      changes touching commonly referenced memories.
   - Advance only after explicit approval. In the current implementation,
     `bun run scripts/dream.ts --continue` is the approval action and also
     executes the approved phase 3 plan before phase 4.
4. Phase 4 post-run audit
   - Artifact: `phase4-result.json`
   - Validate final `MEMORY.md` metrics, dropped refs, and index refresh status.

## Run artifacts

The orchestrator writes the following local artifacts into the stash-scoped run
directory (`<stash>/.akm-dream/runs/<run-id>/`):

- `run-report.json`: machine-readable run status, checkpoints, and summary.
- `review-checklist.md`: human review checklist for phase transitions.
- `orient.json`: phase 1 memory inventory output.
- `signal.json`: phase 2 gathered signal output.
- `plan.json`: deterministic phase 3 candidate plan.
- `actions.jsonl`: applied phase 3 action journal after approval.
- `result.json`: machine-readable phase 3 apply result.
- `summary.md`: human-readable phase 3 apply summary.
- `phase4-result.json`: phase 4 output metrics including dropped refs.
- `backup/memories/`: pre-consolidation snapshot when available.

## Current boundary

The explicit approval boundary remains between planning and apply. Review the
deterministic `plan.json` first, then resume with `--continue` only when the
checklist is satisfied.

For direct phase-3 debugging outside the orchestrator, `phase3-plan.ts` and
`phase3-apply.ts` default to the latest run directory under
`<stash>/.akm-dream/runs/`, but you can override inputs and outputs with the
explicit path flags documented in `references/akm-commands.md`.
