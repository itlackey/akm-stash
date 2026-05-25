---
name: akm-dream
description: Consolidate, prune, and reorganize akm memories using the four-phase Auto Dream process (Orient → Gather Signal → Consolidate → Prune & Index) with explicit staged review gates. Use this skill whenever the user says "dream", "/dream", "auto dream", "consolidate my memory files", "consolidate akm memories", "akm dream", "clean up my memories", "prune stale memories", "my memory files are a mess", "merge duplicate memories", or any time akm memories need periodic consolidation with reviewed approval — even if the user only mentions cleaning up notes, deduplicating, or "fixing the memory pile". For the common unreviewed path, prefer `akm improve memory --dry-run` (covers merge/delete/promote/contradict/relative-date natively as of akm-cli 0.8); use this skill when the staged review gate is the point.
updated: 2026-05-24
---

# akm Dream — Memory Consolidation for the akm CLI

This skill implements the **Auto Dream** consolidation process for memories
stored by the [akm CLI](https://github.com/itlackey/akm). It wraps the
native `akm improve memory` surface (which handles merge/delete/promote/
contradict ops, relative-date resolution, and contradiction-edge writing as of
akm-cli 0.8) with a four-phase staged orchestration that adds:

- explicit phase-3 plan review before any apply,
- per-run audit artifacts under `<stash>/.akm-dream/runs/<run-id>/`,
- a `forget` shim for deleting a single memory until akm has a native verb.

**When to reach for `akm improve memory` instead:** for routine consolidation
where you don't need staged review or run-scoped artifacts. The CLI is
deterministic, faster, and covers the common case.

**When to reach for this skill:** when the consolidation is high-stakes
(major refactor, contested facts, large deletes) and you want the explicit
plan-and-approve gate before anything is applied.

**Division of labour:** the bundled Bun/TypeScript scripts handle deterministic
operations (inventory, planning, apply execution, deletion, indexing) that
extend or wrap `akm improve memory`. Review and approval still happen explicitly
before phase 3 apply and phase 4.

---

## When to run

Trigger a dream when **any** of the following is true:

- The user explicitly asks for one (any phrase from the description above).
- A major refactor just happened (renamed modules, switched frameworks, dropped a service).
- The stash memory index at `<stash>/memories/MEMORY.md` is over the 200-line threshold.
- The user has not run a dream in ≥ 24 hours **and** has had ≥ 5 sessions since the last run (matches Anthropic's auto-dream gating).

Skip the dream if `<stash>/.akm-dream.lock` exists — another instance is running.

---

## The four phases

Run them in order. Phases 1, 2, and 4 are deterministic script work. Phase 3
now has a deterministic planner plus an explicit review-and-approval gate
before apply.

### Phase 1 — Orient

Inventory what already exists so you avoid creating near-duplicates.

```bash
bun run scripts/phase1-orient.ts > <stash>/.akm-dream/runs/<run-id>/orient.json
```

This emits a JSON manifest of every `memory:` asset: ref, file path, byte
size, age in days, last-modified time, presence of frontmatter, detection
of relative-date phrases ("yesterday", "last week", "X days ago"), and
whether each one is currently linked from the stash memory index
`<stash>/memories/MEMORY.md`. It also reports whether that index file exists,
its line count, and any links it contains that point nowhere.

Read the JSON first. The phase walks `<stash>/memories/` directly so the
inventory is deterministic and includes stable file paths from the live
stash, rather than depending on `akm search` ranking output.

### Phase 2 — Gather signal

Find new information worth persisting. Run:

```bash
bun run scripts/phase2-gather.ts > <stash>/.akm-dream/runs/<run-id>/signal.json
```

This searches for high-value signals in roughly priority order:

1. **Daily logs** at `<stash>/logs/YYYY/MM/YYYY-MM-DD.md` if present.
2. **Recent akm feedback events** (the `feedback` command writes utility
   events; negative feedback often points at memories that contradict
   reality).
3. **Supported transcript logs** such as `~/.claude/projects/<project>/*.jsonl`.
   The script only scans the most recent files and searches for
   "remember this", "save to memory", "save that", "actually that's wrong",
   "let's not", and similar correction/save markers.
4. **OpenCode session logs** if `~/.local/share/opencode/` exists.

The output is a list of candidate signals with file path, line number,
and a small surrounding window. Read it and decide which signals deserve
new or updated memories.

If you need targeted context for one signal, grep narrowly:

```bash
grep -rn "<narrow term>" ~/.claude/projects/<project>/ --include="*.jsonl" | tail -50
```

Don't exhaustively read transcripts. Look only for things you already
suspect matter.

### Phase 3 — Consolidate

This phase starts from the deterministic `plan.json` candidate list. Review:

- **Merge** into an existing memory (preferred — reduces duplication).
- **Update** an existing memory (e.g. correct a contradicted fact).
- **Create** a new memory (only if no good match exists).
- **Delete** an existing memory that is now wrong, stale, or superseded.
- **Skip** if the signal is too thin to be worth a memory.

For each operation you approve:

**Read a memory first** (so you preserve nuance):

```bash
akm show memory:<name> --format json --detail full
```

**Update or create with `akm remember`** (it writes/overwrites markdown
under `<stash>/memories/`):

```bash
# Short note
akm remember --name "release-process" --force "On 2026-04-12 we switched the release script from npm publish to bun publish."

# Longer note via stdin
akm remember --name "release-process" --force <<'EOF'
# Release process

On 2026-04-12 we switched the release script from `npm publish` to
`bun publish`. The CI step that ran `npm install -g akm-cli` was
replaced with `bun add -g akm-cli`.

See also: memory:ci-pipeline.
EOF
```

**Delete a memory** (akm has no `forget` verb yet, so the skill provides one):

```bash
bun run scripts/forget.ts memory:<name>
```

`forget.ts` resolves the ref via `akm show`, confirms the file is inside
the stash's `memories/` directory (refuses to delete anything else as a
safety check), removes it, and prints what was removed.

**Critical consolidation rules** (from the auto-dream system prompt):

- **Delete contradicted facts at the source.** If today's signal disproves
  an old memory, fix or delete it; don't just note the contradiction
  somewhere else. (`akm improve memory` will surface contradiction edges
  natively if you run it as a precursor.)
- **Merge near-duplicates.** Three sessions all noted the same build quirk
  → one clean entry, not three.
- **Don't rewrite untouched memories.** Dream is surgical. If a memory
  is fine, leave it.
- **Preserve memory ref names you already use elsewhere** (e.g. anything
  referenced by a workflow or skill).

> Relative-date resolution ("yesterday" → ISO date) is handled natively
> by `akm improve memory` (`memory-improve.ts`). The dream skill no longer
> performs this transform manually; if you see unresolved relative dates,
> run `akm improve memory --dry-run` first to surface them.

### Phase 4 — Prune and rebuild the index

```bash
bun run scripts/phase4-prune.ts
```

This regenerates the stash memory index at `<stash>/memories/MEMORY.md` as an
**index** (one-line descriptions plus refs), enforces the 200-line cap,
removes pointers to memories that no longer exist, sorts entries by recency ×
relevance, and then runs `akm index` to refresh the FTS5 search index.

Read the resulting memory index file and sanity-check it. If anything looks
wrong (e.g. an important memory got demoted), edit it directly — it's plain
markdown.

---

## Putting it all together

The bundled orchestrator runs the full workflow and stops at the explicit
phase 3 approval boundary:

```bash
bun run scripts/dream.ts
```

It:

1. Acquires `<stash>/.akm-dream.lock` with a dream session id (refuses to run if another dream holds it).
2. Runs phase 1 → emits `<stash>/.akm-dream/runs/<run-id>/orient.json`.
3. Runs phase 2 → emits `<stash>/.akm-dream/runs/<run-id>/signal.json`.
4. Writes `plan.json`, `run-report.json`, and `review-checklist.md` so the
   review boundary is explicit and auditable.
5. **Pauses** and prints the review/apply prompt (see
   `references/dream-system-prompt.md`) so you can inspect the deterministic
   plan and preview apply if needed.
6. Once phase 3 is approved (re-invoke with `--continue`), the same session
   runs the approved phase 3 apply step, then phase 4, then releases the lock.

Treat `--continue` as an approval action: do not run it until the review
checklist is satisfied and the phase 3 edits are acceptable.

For debugging, you can still run the phase scripts directly, but the canonical
workflow is the stash-scoped orchestrator plus the review gate.

---

## Safety guarantees the skill enforces

- **Lock file prevents concurrent runs.** `<stash>/.akm-dream.lock`
  contains the dream session id, PID, and timestamps. The same dream can
  resume with `--continue`; other sessions are blocked. Stale locks are
  reaped automatically.
- **Memory directory only.** `forget.ts` refuses to delete files
  outside `<stash>/memories/`. The phase scripts never touch source
  code, configs, or other asset types.
- **Dry-run available for destructive ops.** `forget.ts --dry-run`
  and `phase4-prune.ts --dry-run` show what would change without
  writing when you explicitly ask for preview mode.
- **Backup before consolidation.** `dream.ts` copies the current
  `memories/` tree into `<stash>/.akm-dream/runs/<run-id>/backup/` before phase 3 so bad
  merges have a local rollback point without invoking `akm save`.
- **Review and audit artifacts.** `dream.ts` emits `run-report.json`,
  `review-checklist.md`, and `phase4-result.json` so the staged validation
  flow is inspectable after the run.

---

## Useful references

- `references/dream-system-prompt.md` — the full four-phase system
  prompt to load into context during phase 3.
- `references/memory-format.md` — the memory file format akm uses
  (frontmatter + body conventions).
- `references/review-flow.md` — explicit staged validation and review/
  approval flow for end-to-end dream runs.
- For akm CLI command reference, see `akm --help` or the akm repo's
  `docs/features/improvement-loop.md` — dream relies on `akm show`,
  `akm remember`, `akm index`, `akm events list`, and
  `akm config path --all`.
- `references/implementation-spec.md` — canonical design/architecture spec,
  including internal and external citations for future implementation work.
- `evals/evals.json` — test prompts you can run to verify the skill
  triggers and behaves correctly.

---

This skill uses `akm` for authoritative actions and stash discovery:
`akm show`, `akm remember`, `akm index`, `akm events list`, and
`akm config path --all`. It intentionally walks `<stash>/memories/`
directly in phase 1 and phase 4 because current `akm search` output is
not a stable full-inventory API.
