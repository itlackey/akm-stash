---
name: akm-dream
description: Consolidate, prune, and reorganize akm memories using the four-phase Auto Dream process (Orient → Gather Signal → Consolidate → Prune & Index). Use this skill whenever the user says "dream", "/dream", "auto dream", "consolidate my memory files", "consolidate akm memories", "akm dream", "clean up my memories", "prune stale memories", "my memory files are a mess", "merge duplicate memories", or any time akm memories need REM-sleep-style maintenance — even if the user only mentions cleaning up notes, deduplicating, or "fixing the memory pile". Also use after major refactors when old memory entries reference renamed/deleted code, or when MEMORY.md exceeds ~200 lines.
---

# akm Dream — Memory Consolidation for the akm CLI

This skill implements the **Auto Dream** consolidation process for memories
stored by the [akm CLI](https://github.com/itlackey/akm). It is the canonical
dream implementation for AKM, built on top of the existing `akm` surface
(`show`, `remember`, `index`, `feedback`, `history`, `events`, `config`) plus
helper Bun/TypeScript scripts where AKM does not expose a dedicated command.

The dream process is the REM-sleep equivalent for an agent's memory: while
`akm remember` is the daytime note-taker, dream is the nightly consolidator
that prunes stale notes, merges duplicates, converts relative dates to
absolute, and rebuilds a clean `MEMORY.md` index.

**Division of labour:** the bundled Bun/TypeScript scripts handle deterministic
operations (inventory, parsing, deletion, indexing). The agent — that's you —
does the synthesis, contradiction resolution, and merging. This mirrors akm's
"akm surfaces, the agent writes" philosophy.

---

## When to run

Trigger a dream when **any** of the following is true:

- The user explicitly asks for one (any phrase from the description above).
- A major refactor just happened (renamed modules, switched frameworks, dropped a service).
- `MEMORY.md` is over the 200-line startup-load threshold.
- The user has not run a dream in ≥ 24 hours **and** has had ≥ 5 sessions since the last run (matches Anthropic's auto-dream gating).

Skip the dream if `<stash>/.akm-dream.lock` exists — another instance is running.

---

## The four phases

Run them in order. Phase 1, 2, and 4 are mostly script work. Phase 3 is where
you do the real LLM thinking.

### Phase 1 — Orient

Inventory what already exists so you avoid creating near-duplicates.

```bash
bun run scripts/phase1-orient.ts > /tmp/akm-dream/orient.json
```

This emits a JSON manifest of every `memory:` asset: ref, file path, byte
size, age in days, last-modified time, presence of frontmatter, detection
of relative-date phrases ("yesterday", "last week", "X days ago"), and
whether each one is currently linked from `MEMORY.md`. It also reports
whether `MEMORY.md` exists, its line count, and any links it contains
that point nowhere.

Read the JSON first. The phase walks `<stash>/memories/` directly so the
inventory is deterministic and includes stable file paths from the live
stash, rather than depending on `akm search` ranking output.

### Phase 2 — Gather signal

Find new information worth persisting. Run:

```bash
bun run scripts/phase2-gather.ts > /tmp/akm-dream/signal.json
```

This searches for high-value signals in roughly priority order:

1. **Daily logs** at `<stash>/logs/YYYY/MM/YYYY-MM-DD.md` if present.
2. **Recent akm feedback events** (the `feedback` command writes utility
   events; negative feedback often points at memories that contradict
   reality).
3. **Claude Code transcripts** at `~/.claude/projects/<project>/*.jsonl`.
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

This is the LLM-heavy phase. For each candidate, decide:

- **Merge** into an existing memory (preferred — reduces duplication).
- **Update** an existing memory (e.g. correct a contradicted fact).
- **Create** a new memory (only if no good match exists).
- **Delete** an existing memory that is now wrong, stale, or superseded.
- **Skip** if the signal is too thin to be worth a memory.

For each operation:

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

- **Convert relative dates to absolute.** "Yesterday we decided to use
  Redis" becomes "On 2026-05-04 we decided to use Redis." `today` is
  `2026-05-05` — use `date -I` if you need to compute another.
- **Delete contradicted facts at the source.** If today's signal disproves
  an old memory, fix or delete it; don't just note the contradiction
  somewhere else.
- **Merge near-duplicates.** Three sessions all noted the same build quirk
  → one clean entry, not three.
- **Don't rewrite untouched memories.** Dream is surgical. If a memory
  is fine, leave it.
- **Preserve memory ref names you already use elsewhere** (e.g. anything
  referenced by a workflow or skill).

### Phase 4 — Prune and rebuild the index

```bash
bun run scripts/phase4-prune.ts
```

This regenerates `<stash>/memories/MEMORY.md` as an **index** (one-line
descriptions plus refs), enforces the 200-line cap, removes pointers to
memories that no longer exist, sorts entries by recency × relevance, and
then runs `akm index` to refresh the FTS5 search index.

Read the resulting `MEMORY.md` and sanity-check it. If anything looks
wrong (e.g. an important memory got demoted), edit it directly — it's
plain markdown.

---

## Putting it all together

The bundled orchestrator runs phases 1, 2, and 4 deterministically and
prompts the agent (you) to handle phase 3 in between:

```bash
bun run scripts/dream.ts
```

It:

1. Acquires `<stash>/.akm-dream.lock` with a dream session id (refuses to run if another dream holds it).
2. Runs phase 1 → emits `/tmp/akm-dream/orient.json`.
3. Runs phase 2 → emits `/tmp/akm-dream/signal.json`.
4. **Pauses** and prints the consolidation prompt (see
   `references/dream-system-prompt.md`) — this is where you, the agent,
   read the JSON outputs, decide what to merge/update/delete/create, and
   issue the `akm remember`, `forget.ts`, etc. calls.
5. Once you indicate phase 3 is done (re-invoke with `--continue`), the
   same session resumes phase 4 and then releases the lock.

For a fully manual dream — useful for small stashes or debugging —
just run each phase script in order yourself.

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
  `memories/` tree into `/tmp/akm-dream/backup/` before phase 3 so bad
  merges have a local rollback point without invoking `akm save`.

---

## Useful references

- `references/dream-system-prompt.md` — the full four-phase system
  prompt to load into context during phase 3.
- `references/memory-format.md` — the memory file format akm uses
  (frontmatter + body conventions).
- `references/akm-commands.md` — quick reference for the akm verbs
  this skill leans on.
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
