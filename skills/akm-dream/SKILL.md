---
name: akm-dream
description: Consolidate, prune, and reorganize akm memories with explicit staged review gates. Use when the user says "dream", "/dream", "auto dream", "consolidate memories", "clean up my memories", "prune stale memories", or "my memory files are a mess". For routine consolidation without staged review, prefer `akm improve memory` + `akm proposal extract --auto` directly.
updated: 2026-08-04
---

# akm Dream — Reviewed Memory Consolidation

This skill wraps the native `akm improve` + `akm proposal extract` pipeline with an
explicit plan-review gate, a lock to prevent concurrent runs, pre-apply
backups, and per-run audit artifacts. It also manages the `MEMORY.md` index
file that `akm improve` does not own.

## Division of labour

| Responsibility | Native CLI | This skill |
|---|---|---|
| Harvest recent session knowledge | `akm proposal extract --auto` | calls it in Phase 2 |
| Surface contradictions + relative-date fixes | `akm improve memory --dry-run` | calls it before Phase 3 |
| Merge/delete/promote/contradict proposals | `akm improve memory` | review gate on top |
| Single-file memory deletion | — (no native verb) | bundled forget helper |
| MEMORY.md index management (200-line cap) | — | Phase 4 index rebuild |
| Lock file, backup, audit artifacts | — | bundled dream orchestrator |

**When to reach for `akm improve memory` alone:** routine consolidation where
you don't need staged review or run artifacts. The CLI is faster and covers
the common case.

**When to use this skill:** when consolidation is high-stakes (large deletes,
contested facts, major refactor) and you want the explicit plan-approve gate
before anything is applied, or when `MEMORY.md` needs rebuilding.

---

## When to run

Trigger a dream when **any** of the following is true:

- The user explicitly asks (any phrase from the description above).
- A major refactor just landed (renamed modules, dropped a service, changed frameworks).
- `<stash>/memories/MEMORY.md` is over the 200-line threshold.
- The user has not run a dream in ≥ 24 hours and has had ≥ 5 sessions since the last run.

Skip if `<stash>/.akm-dream.lock` exists — another instance is running.

---

## The four phases

### Phase 1 — Orient

Inventory the current memory state directly from the filesystem so the plan
has a stable, complete picture before any extraction or improvement runs.

```bash
bun run scripts/phase1-orient.ts > <stash>/.akm-dream/runs/<run-id>/orient.json
```

The output includes every `memories/` ref with size, age, relative-date phrases,
internal cross-refs, and whether it is linked from `MEMORY.md`. Read
`orient.json` before loading any individual memories.

### Phase 2 — Gather signal

Use the native CLI first, then supplement with direct sources if needed.

**Step 1 — extract session knowledge:**

```bash
akm proposal extract --auto --since 7d
```

This reads native Claude Code and OpenCode session files and queues candidates
as proposals. Run `akm proposal list --status pending` to see what it found.

**Step 2 — surface improvement candidates:**

```bash
akm improve memory --dry-run
```

This shows what `akm improve` would do: merges, deletes, relative-date
fixes, contradiction edges. Review the dry-run output — it is your Phase 2
signal.

**Step 3 — supplement (optional):**

If the stash uses daily logs (`<stash>/logs/YYYY/MM/YYYY-MM-DD.md`) or you
need signals that `akm proposal extract` doesn't cover, run the supplemental script:

```bash
bun run scripts/phase2-gather.ts > <stash>/.akm-dream/runs/<run-id>/signal.json
```

Use this for daily-log entries and targeted feedback events only — not as a
replacement for `akm proposal extract`.

### Phase 3 — Consolidate

Run the deterministic planner, review the plan, then apply:

```bash
bun run scripts/phase3-plan.ts   # emits plan.json + review-checklist.md
# --- review gate: inspect plan.json and review-checklist.md ---
bun run scripts/dream.ts --continue  # executes approved plan
```

The plan includes operations that `akm improve` proposed plus any direct edits
from Phase 2 supplemental signals.

**For each approved operation:**

```bash
# Read a memory before touching it:
akm show memories/<name> --detail full

# Update or create via stdin:
akm remember --name "<name>" --force <<'EOF'
---
description: One-liner for MEMORY.md.
updated: 2026-06-01
---
Body text here.
EOF

# Delete a single memory (akm has no native forget verb):
bun run scripts/forget.ts memories/<name>
```

**Consolidation rules:**

- Merge near-duplicates. Three notes about the same build quirk → one clean entry.
- Delete contradicted facts at the source — `akm improve memory` surfaces these as contradiction edges; resolve them here.
- Relative-date resolution ("yesterday" → ISO date) is handled by `akm improve memory`; if you see unresolved phrases it means `akm improve` was skipped or was not run against that memory.
- Never rewrite untouched memories. Dream is surgical.
- Never store secrets in memories — use `akm env` or `akm secret`.
- Never write content directly into `MEMORY.md` — it is an index, not a dump.

### Phase 4 — Prune and rebuild the index

```bash
bun run scripts/phase4-prune.ts
akm index
```

`phase4-prune.ts` regenerates `<stash>/memories/MEMORY.md` (one-line entry
per memory, grouped by tag, newest-first, capped at 200 lines), removes
dead links, and sorts by recency × relevance. `akm index` then refreshes
the FTS5 search index so `akm search` reflects the consolidated state.

Preview without writing:

```bash
bun run scripts/phase4-prune.ts --dry-run
```

---

## Running the full workflow

The orchestrator handles lock acquisition, backup, and phase gating:

```bash
bun run scripts/dream.ts
```

It:
1. Acquires `<stash>/.akm-dream.lock` (refuses to run if another session holds it).
2. Backs up `<stash>/memories/` to `<stash>/.akm-dream/runs/<run-id>/backup/`.
3. Runs Phase 1 → `orient.json`.
4. Runs Phase 2 (`akm proposal extract --auto`, `akm improve memory --dry-run`, optional `phase2-gather.ts`) → `signal.json`.
5. Runs the planner → `plan.json` + `review-checklist.md`.
6. **Pauses at the review gate.** Inspect artifacts, verify the plan, then:

```bash
bun run scripts/dream.ts --continue
```

7. Executes the approved Phase 3 plan, then Phase 4, then releases the lock.

`--continue` is an approval action — only run it when the review checklist
is satisfied.

---

## Safety guarantees

- **Lock prevents concurrent runs.** `<stash>/.akm-dream.lock` blocks other instances; stale locks are reaped automatically.
- **Memory directory only.** The forget helper refuses to touch anything outside `<stash>/memories/`.
- **Dry-run available.** `bun run scripts/forget.ts --dry-run` and `phase4-prune.ts --dry-run` preview without writing.
- **Backup before apply.** The orchestrator snapshots `memories/` before Phase 3.
- **Audit trail.** Each run emits `run-report.json`, `review-checklist.md`, `actions.jsonl`, and `phase4-result.json` under `.akm-dream/runs/<run-id>/`.

---

## Reference files

- `references/dream-system-prompt.md` — system prompt to load into context during Phase 3.
- `references/memory-format.md` — memory frontmatter and body conventions.
- `references/review-flow.md` — staged review gate and artifact checklist.
- `evals/evals.json` — test prompts for verifying skill trigger behavior.
