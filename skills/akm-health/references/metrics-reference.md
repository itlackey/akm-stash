---
description: Complete field glossary and signal thresholds for akm doctor output (schemaVersion 3). Use when interpreting health report numbers or setting alert thresholds.
tags: [akm-health, metrics, reference, thresholds]
updated: 2026-11-23
---

# akm Health Metrics Reference

Schema version: **3** (`akm doctor --format json` → `schemaVersion: 3`)

## Top-level fields

| Field | Type | Meaning |
|---|---|---|
| `ok` | bool | `true` when all hard checks pass |
| `status` | string | `pass` / `warn` / `fail` |
| `since` | ISO timestamp | Start of the reporting window |
| `hardChecks[]` | array | Deterministic pass/fail checks (see below) |
| `advisories[]` | array | Non-fatal warnings |
| `metrics` | object | Task fail rate, agent fail rate, stuck runs, and LLM usage |
| `improve` | object | Improve pipeline metrics (main section) |
| `runs[]` | array, optional | Per-improve-run summaries when `--group-by run` or `--report` is used |
| `windows[]` / `deltas` | optional | Explicit or duration-window comparison projections |
| `report` | object, optional | Pending-proposal and comparison context requested by `--report` |

---

## `hardChecks[]` — system checks

Each entry has `name`, `status` (`pass`/`warn`/`fail`), `kind`, `confidence`, `message`, `evidence`.

| Check name | What it validates |
|---|---|
| `state-db-schema` | state.db exists and required tables are present |
| `state-db-round-trip` | state.db append/read round-trip (durationMs); `unknown` with `--read-only` |
| `state-db-integrity` | state.db passes `PRAGMA integrity_check` |
| `state-db-migrations` | pending state.db migrations applied on open (names them in `evidence.applied`) |
| `task-history-read` | task_history rows readable for the window |
| `active-runs` | no stuck active runs past stale threshold |
| `connections-and-harnesses` | one row per connection and harness, then per kind of work (`improve`, `judges`, `agents`, `extract`, `enrich`, `index`, `embedding`) with the connection or harness and model it resolves to |
| `index-sources` | sources the last `akm index` could not scan completely |
| `semantic-search` | what the last index recorded about semantic search, against the current vector count |

Any non-`pass` hard check is a **blocking issue** — fix before interpreting improve metrics.

---

## `metrics` — task-level health

| Field | Meaning | ✅ Healthy | ⚠️ Warn | 🔴 Critical |
|---|---|---|---|---|
| `taskFailRate` | Fraction of task runs that failed | 0 | < 0.05 | ≥ 0.05 |
| `agentFailureRate` | Fraction of agent invocations that failed | 0 | < 0.1 | ≥ 0.1 |
| `stuckActiveRuns` | Runs exceeding stale threshold | 0 | — | > 0 |
| `llmUsage` | Token and duration totals, with `byStage`, `byProcess`, and `byEngine` (keyed by connection or harness name) breakdowns | Inspect trends | — | — |

---

## `improve` — improve pipeline

### Top-level counters

| Field | Meaning | ✅ Healthy | ⚠️ Warn |
|---|---|---|---|
| `invoked` | Total improve invocations in window | — | — |
| `completed` | Completed without error | `completed == invoked` | any gap |
| `skipped` | Total skipped (all reasons) | — | — |

### `skipReasons` (top-level)

| Reason | Meaning | Normal? |
|---|---|---|
| `no_new_signal` | Asset has no new feedback/event signal since last run | Yes — most assets |
| `strategy_filtered_all_passes` | All processes disabled for this asset's type by active strategy | Yes — expected for filtered types |

---

## `improve.actions` — per-action breakdown

### `reflect`

| Field | Meaning | ✅ | ⚠️ |
|---|---|---|---|
| `ok` | Reflects that ran and produced output | > 0 | 0 over several runs |
| `rejected` | Rejected after the model call | 0–few | many |
| `cooldown` | Skipped because cooldown period hasn't elapsed | — | — |
| `failed` | LLM or write errors | 0 | > 0 |
| `skippedByReason` | Typed histogram of skip reasons (e.g. `type-filter`, `raw-wiki`) | low counts | accumulating type-filter |

**Key insight:** `skippedByReason` replaced a single collapsed counter. If `type-filter` is high, the profile is excluding asset types that have signal. If `raw-wiki` is high, wiki raw/ pages are being scanned unnecessarily.

### `distill`

| Field | Meaning | ✅ | ⚠️ |
|---|---|---|---|
| `queued` | Distillation proposals queued | ≥ 0 | — |
| `skipped` | Skipped (all reasons) | — | — |
| `skippedByReason.no new signal since last proposal` | No new content to distill | High is normal | — |
| `skippedByReason.type-filter` | Asset type excluded by profile | Few | Many |
| `llmFailed` | LLM call failed | 0 | > 0 |
| `judgeRejected` | Rejected by judge pass | 0–few | many |
| `validatorRejected` | Rejected by proposal validator | 0–few | many |
| `configDisabled` | Distill disabled in config | 0 | — |

---

## `improve.consolidation`

Consolidation is the highest-latency and highest-signal phase. These metrics
are the primary tuning targets.

### Outcomes

| Field | Meaning | ✅ Healthy | ⚠️ Warn | 🔴 Critical |
|---|---|---|---|---|
| `processed` | Total memory pool processed | > 0 | — | 0 |
| `promoted` | Memories promoted to knowledge | > 0 | 0 over multiple runs | — |
| `merged` | Memories merged | ≥ 0 | — | — |
| `deleted` | Memories deleted | ≥ 0 | — | — |
| `contradicted` | Contradiction edges written | ≥ 0 | — | — |
| **`judgedNoAction`** | LLM saw memory but proposed nothing | < 50% of processed | 50–70% | > 70% |
| `failedChunks / totalChunks` | Chunk failure rate | < 2% | 2–5% | > 5% |
| `pairsJudged` | Pair-pass pairs that returned a verdict | — | — | — |
| `failedPairs` | Pairs that did not settle (transport, parse, cancelled); retried next run | 0 | > 0 | — |
| `deferredPairs` | Valid retirement decisions held by the same-run guard; `null` when an older result lacks a count | — | — | — |
| `durationMs` | Total consolidation wall time | < 2 min | 2–10 min | > 10 min |

**`judgedNoAction` interpretation:** If ≥50% of processed memories get no proposed action, the LLM is not finding actionable signal. Common causes:
- Memory pool too large (process ≫ 10k → consider reducing `--limit` or tuning profile pool size)
- Memories are already well-consolidated and genuinely need no action
- System prompt / model configuration not aligned with the current memory style

### `skipReasons` histogram

These are **post-LLM deterministic guard hits** — the LLM proposed something but it was rejected.

| Reason | Meaning | Fix |
|---|---|---|
| `dedup_pending_proposal` | Proposal already in queue for this ref | Normal — let pending proposals settle |
| `merge_missing_description` | Target memory has no `description` field | Add frontmatter descriptions to memories |
| `merge_participant_blocked` | A merge participant is blocked (hot-capture or pending) | Normal — protect recent captures |
| `captureMode_hot_refused` | Memory captured with `captureMode: hot` — only user can retire | Normal — these are user-explicit memories |
| `merge_content_too_short` | Content below minimum merge threshold | Normal — thin memories accumulate |
| `promote_pending_proposal_exists` | Promotion already queued | Normal |
| `promote_source_too_small` | Source too short to promote | Normal |
| `promote_already_exists` | Target knowledge asset already exists | Normal — idempotent |
| `contradict_target_missing` | Contradiction target ref doesn't exist | Stale contradiction edge — run `akm lint` |
| `merge_fence_rejected` | Merge rejected by content fence | Check LLM output quality |
| `merge_no_valid_secondaries` | Secondaries don't meet merge criteria | Normal |

**Tuning signal:** If `merge_missing_description` is consistently > 10% of processed, run a sweep to add frontmatter descriptions to memories that lack them. This is the single highest-ROI fix for consolidation quality.

---

## `improve.memoryInference`

Memory inference creates `.derived.md` sibling files from accumulated evidence.

| Field | Meaning | ✅ Healthy | ⚠️ Warn |
|---|---|---|---|
| `considered` | Pool of eligible memories | > 0 | — |
| `freshAttempts` | Parents that actually hit the LLM | > 0 per run | 0 for many runs |
| `noChange` | Explicit no-change decisions (restraint, not failure); summed per run | — | — |
| `written` | New .derived files written | ≥ 0 | — |
| **`yieldRate`** | `written / yieldEligibleConsidered` | > 0.30 | 0.10–0.30 | < 0.10 |
| `skippedNoFacts` | Attempted but LLM found no facts | Low | High |
| `durationMs` | Wall time for inference phase | < 2 min | > 5 min |

**`yieldRate` interpretation:**
- `> 0.5` — pipeline is finding new facts in recent memories. Healthy.
- `0.3–0.5` — acceptable; pool may be saturating.
- `< 0.3` — low signal. Either pool is saturated (all recent memories already have .derived), or signal quality is low.
- `= 0` over multiple runs — inference is not running or all candidates are cached.

---

## `improve.wallTime` — latency

### Overall (per run)

| Metric | ✅ Healthy | ⚠️ Warn | 🔴 Critical |
|---|---|---|---|
| `medianMs` | < 3 min | 3–10 min | > 10 min |
| `p95Ms` | < 10 min | 10–20 min | > 20 min |

---

## `--group-by run` fields

Each entry in `runs[]` is a per-run summary with phase metrics, plus:

| Field | Meaning |
|---|---|
| `id` | UUID of the improve run |
| `completedAt` | ISO completion timestamp |
| `ok` | Whether the persisted improve result was successful |
| `strategy` / `scope` / `taskId` | Resolved strategy, scope, and scheduled-task attribution |
| `wallTimeMs` | Total run duration |

Use per-run detail for incident investigation (find the specific run that spiked)
and for baseline comparisons after a config change.

---

## `--window-compare` output

The response adds:

```json
{
  "windows": [
    { "name": "current", "since": "...", "until": "...", "runs": 48, ... },
    { "name": "prior",   "since": "...", "until": "...", "runs": 51, ... }
  ],
  "deltas": {
    "improve.consolidation.promoted": { "from": 51, "to": 48, "pctChange": -5.88 },
    "improve.memoryInference.written": { ... },
    ...
  }
}
```

A `pctChange` of `+10` means 10% improvement; the field is expressed in
percentage points, not a 0–1 ratio. Look for regressions in
`consolidation.promoted`, `memoryInference.yieldRate`, and `wallTime.medianMs`.
