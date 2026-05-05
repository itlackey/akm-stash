# akm-dream Implementation Spec

This document is the canonical implementation target for `skills/akm-dream`.

It replaces the older assumption that `akm-dream` is a temporary polyfill for a
future native `akm dream` command. The design target is now explicit:

- `akm-dream` is the implementation.
- It should use currently available `akm` commands where they are authoritative.
- It may use helper Bun/TypeScript scripts to fill missing capabilities.
- It may read stash files directly when deterministic full-state inspection is
  required.
- It may use read-only sqlite access when CLI surfaces are insufficient for
  ranking or telemetry.
- It should not write directly to AKM's sqlite DB.

## Status

- Current status: partial implementation
- Target status: end-to-end dream workflow with deterministic planning,
  controlled apply, durable run artifacts, and documented safety rails

## Goals

1. Implement the full dream process end to end.
2. Keep evidence gathering deterministic.
3. Use LLM judgment only where synthesis/conflict resolution is required.
4. Make destructive actions auditable and conservatively gated.
5. Keep the result aligned with current `akm` behavior and constraints.
6. Provide a spec that future agents can validate against.

## Non-goals

1. Do not wait for or depend on a future native `akm dream` command.
2. Do not write directly to AKM's sqlite DB.
3. Do not build a second memory/indexing system parallel to AKM.
4. Do not turn dream into uncontrolled autonomous stash rewriting.

## Product Definition

Dream is the asynchronous memory-maintenance subsystem for AKM.

Conceptually:

- `akm remember` is daytime capture.
- `akm events` / `akm history` / `akm feedback` are episodic traces.
- `akm-dream` is semantic/procedural consolidation.
- `akm index` refreshes retrieval after consolidation.

The skill must therefore do more than print a prompt. A dream run should:

1. Gather the current memory state.
2. Gather recent high-value signals.
3. Emit staged validation artifacts and pause at explicit review gates.
4. Build a deterministic consolidation plan.
5. Apply approved changes safely.
6. Rebuild `MEMORY.md`.
7. Reindex the stash.
8. Emit a machine-readable result.

## Design Principles

1. Deterministic inputs first.
2. LLM judgment second.
3. Conservative automation.
4. Explicit run state.
5. No hidden destructive behavior.
6. Prefer canonical memory updates over creating duplicates.
7. Resolve contradictions at the source.
8. Keep startup memory compact and index-like.
9. Make review and approval checkpoints visible in artifacts, not only prompts.

## Recommended Architecture

### 1. Control Plane

The control plane should be implemented in Bun/TS scripts under `scripts/`.

Recommended top-level pipeline:

1. `dream.ts`
2. `phase1-orient.ts`
3. `phase2-gather.ts`
4. `phase3-plan.ts`
5. `phase3-apply.ts`
6. `phase4-prune.ts`

The orchestrator should run the entire sequence end to end unless a mode flag
explicitly requests `--plan-only`, `--dry-run`, or similar.

### 2. Stash-Scoped Dream State

Dream artifacts should be stash-scoped, not global under a single `/tmp` path.

Recommended location:

```text
<stash>/.akm-dream/
  state.json
  runs/
    <run-id>/
      orient.json
      signal.json
      plan.json
      actions.jsonl
      result.json
      summary.md
      backup/
```

`/tmp` may still be used for scratch data, but stash-scoped state under
`<stash>/.akm-dream/` is the canonical source of run truth and review artifacts.

### 3. Deterministic Evidence Gathering

#### Phase 1: Orient

Use direct filesystem walking of `<stash>/memories/`.

Rationale:

- current `akm search` is retrieval/ranking oriented
- it is not a stable full-inventory API for deterministic orchestration

Phase 1 should produce, at minimum:

- memory ref
- file path
- size
- age
- frontmatter presence
- tags
- relative-date flags
- outbound refs
- inbound ref counts
- linked-from-`MEMORY.md` state
- protected/canonical hints

#### Phase 2: Gather Signal

Use existing AKM and local sources:

- `akm events list`
- `akm history`
- `akm feedback`
- daily logs
- Claude transcripts
- OpenCode transcripts/logs

Signal gathering should stay narrow and bounded. It should not brute-force all
session data by default.

### 4. Deterministic Planning Layer

This is the main missing piece in the current implementation.

`phase3-plan.ts` should consume `orient.json` and `signal.json` and emit a
machine-generated `plan.json` containing candidate operations such as:

- `create`
- `update`
- `merge-into`
- `delete`
- `skip`

Each candidate should include:

- target ref(s)
- evidence snippets
- confidence score
- rationale
- protected-ref flags
- contradiction/duplicate/staleness indicators

The LLM should refine decisions from this plan, not reason from scratch over raw
logs.

### 4A. Review And Approval Layer

Even before deterministic `plan.json` and `phase3-apply.ts` exist, the skill
must make review points explicit.

Minimum expectations:

- `orient.json` and `signal.json` are preserved as named run artifacts
- a machine-readable run report records checkpoint state transitions
- a human-readable review checklist states what must be validated before moving
  from phase 3 to phase 4
- `--continue` is documented as the approval boundary for the current workflow
- phase 4 emits final audit metrics including dropped refs and index status

### 5. Controlled Apply Layer

`phase3-apply.ts` should perform changes using the safest available surfaces:

- read existing memory with `akm show`
- create/update with `akm remember`
- delete with guarded local helper `forget.ts`
- defer indexing until phase 4

Every apply action should be logged to `actions.jsonl`.

### 6. Rebuild and Reindex

`phase4-prune.ts` should remain deterministic.

It should:

- rebuild `MEMORY.md`
- enforce line/size budgeting
- report dropped entries when over budget
- run `akm index`

Longer term, entry ranking should become utility-aware rather than relying only
on recency/tag grouping.

## Allowed System Boundaries

### Use AKM CLI for

- `akm show`
- `akm remember`
- `akm index`
- `akm events list`
- `akm history`
- `akm feedback`
- `akm config path --all`

### Use direct filesystem reads for

- full memory inventory
- transcript/log scanning
- stash-local run artifacts
- `MEMORY.md` generation inputs

### Use direct filesystem writes for

- stash-local dream artifacts
- `MEMORY.md`
- guarded memory deletion only where no AKM command exists

### Use read-only sqlite access for

- `entries`
- `usage_events`
- `utility_scores`

Only add direct sqlite reads if CLI/event surfaces prove insufficient for stable
ranking/triage.

### Do not use direct sqlite writes for

- entries
- utility scores
- usage events
- index metadata

## Safety Model

### Locking

- one dream session per stash at a time
- lock must be stash-scoped
- resume must work for the same session
- other sessions must be blocked

### Backups

- backup before destructive/apply phases
- backup must be local and deterministic
- backup location must be recorded in run artifacts

### Destructive actions

- deletes must be explicit and logged
- add `--no-delete`
- add `--max-deletes <n>`
- protected refs must require stronger confirmation

### Protected refs

Treat memories referenced by workflows, skills, commands, or many other memories
as protected. Deletes/renames/merges affecting them should be gated.

## Modes

Recommended modes:

- `default`: full dream run
- `--dry-run`: gather + plan + render outputs, no writes
- `--plan-only`: gather + plan only
- `--apply-approved`: apply a previously reviewed plan
- `--no-delete`: suppress deletes
- `--skip-transcripts`: use only local AKM/daily-log signals

## Data Contracts

### `orient.json`

Should include:

- stash metadata
- memory inventory
- `MEMORY.md` status
- ref graph hints
- duplicate/staleness heuristics

### `signal.json`

Should include:

- source list
- signal list
- extracted refs
- confidence hints
- timestamps/ages

### `plan.json`

Should include:

- run id
- candidate actions
- confidence
- rationale
- protected flags
- estimated impact counts

### `result.json`

Should include:

- created count
- updated count
- deleted count
- skipped count
- relative dates normalized
- `MEMORY.md` before/after metrics
- index refresh status

### `run-report.json`

Should include:

- run id and mode
- named artifacts produced so far
- checkpoint states for phases 1 through 4
- explicit phase 3 approval requirement/state
- summary counts useful for later audits

## Implementation Roadmap

### Phase A: Reposition

1. Remove native-command delegation framing from docs and code.
2. Treat the skill as the canonical dream implementation.

### Phase B: Durable State

1. Move dream artifacts to stash-scoped state.
2. Persist run metadata and backups.

### Phase C: Planning Layer

1. Add `phase3-plan.ts`.
2. Add deterministic duplicate/stale/contradiction heuristics.

### Phase D: Apply Layer

1. Add `phase3-apply.ts`.
2. Add journaling and safety thresholds.

### Phase E: Orchestration

1. Convert `dream.ts` into a full pipeline runner.
2. Keep `--dry-run` and `--plan-only` modes.

### Phase F: Ranking and Quality

1. Improve `MEMORY.md` ranking.
2. Optionally add read-only sqlite adapter.

### Phase G: Tests and Evals

1. Add e2e tests around plan/apply.
2. Add false-positive and operator-safety evals.
3. Add staged validation and approval-gate tests for the current pre-plan/apply workflow.

## Validation Checklist For Future Agents

Before implementing or changing behavior, validate against:

1. Does this rely on a future native `akm dream` command?
   - If yes, stop and redesign.
2. Is the deterministic part implemented in Bun/TS, not in the LLM prompt?
3. Are writes going through `akm remember` where possible?
4. Are deletes guarded and audited?
5. Are review/approval gates explicit in artifacts and docs?
6. Is the change aligned with current `../akm` behavior, not assumptions?
7. Are sources/claims cited in code comments or docs where the behavior is non-obvious?

## Internal Source Index

These repo files are the primary internal references future agents should read
before implementing this spec.

### akm-dream current implementation

- `skills/akm-dream/scripts/dream.ts`
- `skills/akm-dream/scripts/phase1-orient.ts`
- `skills/akm-dream/scripts/phase2-gather.ts`
- `skills/akm-dream/scripts/phase4-prune.ts`
- `skills/akm-dream/scripts/forget.ts`
- `skills/akm-dream/scripts/lib/akm.ts`
- `skills/akm-dream/scripts/lib/lock.ts`
- `skills/akm-dream/scripts/lib/inventory.ts`
- `skills/akm-dream/references/akm-commands.md`
- `skills/akm-dream/references/dream-system-prompt.md`
- `skills/akm-dream/references/memory-format.md`

### Current AKM behavior and contracts

- `../akm/docs/cli.md`
- `../akm/docs/agents/AGENTS.md`
- `../akm/src/cli.ts`
- `../akm/src/commands/remember.ts`
- `../akm/src/commands/search.ts`
- `../akm/src/commands/info.ts`
- `../akm/src/core/events.ts`
- `../akm/src/output/shapes.ts`
- `../akm/src/indexer/indexer.ts`
- `../akm/src/indexer/db.ts`
- `../akm/src/core/asset-spec.ts`

### Existing verification harness

- `skills/akm-dream/scripts/audit-current-akm.ts`
- `skills/akm-dream/tests/*.test.ts`

## External Research Sources

These are the external references the investigation used to ground the design.
Future agents should consult them when validating major implementation choices.

1. Anthropic Claude Code memory docs
   - https://docs.anthropic.com/en/docs/claude-code/memory
   - Why it matters: startup-memory constraints, `MEMORY.md` as compact entrypoint,
     memory hygiene principles.

2. Claude Fast Auto Dream guide
   - https://claudefa.st/blog/guide/mechanics/auto-dream
   - Why it matters: four-phase dream flow, lock model, contradiction cleanup,
     relative-date normalization, narrow signal gathering.

3. Reflexion: Language Agents with Verbal Reinforcement Learning
   - https://arxiv.org/abs/2303.11366
   - Why it matters: structured reflection loops and memory-guided improvement.

4. Mem0 / long-term memory systems research
   - https://arxiv.org/abs/2504.19413
   - Why it matters: add/update/delete/no-op memory operations and production
     memory-layer design.

5. Survey of memory mechanisms for LLM agents
   - https://arxiv.org/abs/2404.13501
   - Why it matters: episodic vs semantic vs procedural memory framing.

6. Self-evolving / runtime learning from episodic memory references
   - Example investigation reference: `Self-Evolving Agents via Runtime Reinforcement Learning on Episodic Memory`
   - Why it matters: utility-guided memory selection and learning loops.

7. Long-term memory security / agent memory governance references
   - Example investigation reference: mnemonic sovereignty / memory safety survey work
   - Why it matters: safe autonomous maintenance, destructive-action caution,
     provenance and auditability.

## Implementation Notes For Future Agents

When implementing against this spec:

1. Prefer the smallest correct change.
2. Add tests or audit harness updates whenever behavior changes.
3. If a behavior depends on current `../akm`, verify it with
   `bun run audit:akm` or extend that script.
4. When adding a non-obvious heuristic, cite the motivating source in code or
   doc comments.
